// Plate photo -> itemized nutrition via Gemini vision. Uses the user's key.
// A known-size reference object in the photo anchors portion estimation.
import { VISION_PROMPT, REFERENCE_LINE_TEMPLATE } from './visionPrompt';

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;

export const REFERENCES = {
  card: { id: 'card', label: 'כרטיס אשראי', desc: 'a standard ID-1 bank/credit/ID card, 85.6 x 54 mm' },
  coin10: { id: 'coin10', label: 'מטבע ₪10', desc: 'an Israeli 10 new-shekel coin, 23 mm in diameter' },
  coin5: { id: 'coin5', label: 'מטבע ₪5', desc: 'an Israeli 5 new-shekel coin, 24 mm in diameter' },
  none: { id: 'none', label: 'ללא', desc: null },
};

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          grams: { type: 'NUMBER' },
          calories: { type: 'NUMBER' },
          protein: { type: 'NUMBER' },
        },
        required: ['name', 'grams', 'calories', 'protein'],
      },
    },
    assumptions: { type: 'STRING' },
  },
  required: ['items'],
};

export function refLine(reference) {
  const r = REFERENCES[reference] || REFERENCES.none;
  return REFERENCE_LINE_TEMPLATE.replace('{REF}', r.desc || 'none');
}

// Returns { items: [{name, grams, calories, protein}], assumptions }
// Throws Error(NO_KEY | BAD_KEY | RATE_LIMIT | NETWORK | EMPTY | HTTP_xxx)
export async function analyzePlatePhoto({ base64, mimeType = 'image/jpeg', apiKey, reference = 'card' }) {
  if (!apiKey || !apiKey.trim()) throw new Error('NO_KEY');
  if (!base64) throw new Error('EMPTY');

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: VISION_PROMPT + '\n\n' + refLine(reference) }, { inlineData: { mimeType, data: base64 } }],
      },
    ],
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.2 },
  };

  let res;
  try {
    res = await fetch(ENDPOINT(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error('NETWORK');
  }
  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) throw new Error('BAD_KEY');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    throw new Error('HTTP_' + res.status);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('EMPTY');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error('EMPTY');
  }

  const items = (parsed.items || [])
    .map((it) => ({
      name: String(it.name || '').trim(),
      grams: Math.max(0, Math.round(Number(it.grams) || 0)),
      calories: Math.max(0, Math.round(Number(it.calories) || 0)),
      protein: Math.max(0, Math.round((Number(it.protein) || 0) * 10) / 10),
    }))
    .filter((it) => it.name && (it.calories > 0 || it.protein > 0));

  if (!items.length) throw new Error('EMPTY');
  return { items, assumptions: String(parsed.assumptions || '').trim() };
}
