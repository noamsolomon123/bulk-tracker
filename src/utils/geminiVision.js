// Plate photo(s) -> itemized nutrition via Gemini vision, then DB-grounded.
// The LLM estimates items + grams; calories/protein come from a real food DB
// where possible (the biggest accuracy lever), falling back to the LLM's numbers.
import { VISION_PROMPT, REFERENCE_LINE_TEMPLATE } from './visionPrompt';
import { groundItem } from './nutritionDb';
import { GEMINI_VISION_MODEL, VISION_THINKING } from './aiModels';

const MODEL = GEMINI_VISION_MODEL;
const ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;

export const REFERENCES = {
  none: { id: 'none', label: 'צלחת/מזלג', desc: null },
  card: { id: 'card', label: 'כרטיס אשראי', desc: 'a standard ID-1 bank/credit/ID card, 85.6 x 54 mm' },
  coin10: { id: 'coin10', label: 'מטבע ₪10', desc: 'an Israeli 10 new-shekel coin, 23 mm in diameter' },
  coin5: { id: 'coin5', label: 'מטבע ₪5', desc: 'an Israeli 5 new-shekel coin, 24 mm in diameter' },
};

const SUPPLEMENT = `
You may receive ONE or TWO photos of the SAME meal. If two photos: the FIRST is top-down (use it for footprint and the reference/plate scale) and the SECOND is an oblique ~45° view (use it to judge each item's HEIGHT / thickness — the dominant portion error a single flat photo cannot see). They show the SAME food: identify each item once and never double-count across the two views.

Work like a registered dietitian in two internal steps: (1) decompose the meal into distinct items with grams and cooking method, (2) reason about nutrition. Output ONLY the final JSON.

Israeli / Middle-Eastern glossary — identify these correctly (common mis-IDs cause huge errors): פלאפל = deep-fried chickpea balls (NOT meatballs); חומוס = chickpea spread with tahini & oil (calorie-dense); טחינה = sesame paste (very calorie-dense); שקשוקה = eggs poached in tomato sauce; סביח = pita with fried eggplant & egg; בורקס = filled puff pastry (high fat); שניצל = breaded fried chicken/turkey cutlet; מלוואח / ג'חנון = rich laminated dough (very calorie-dense); מג'דרה = rice & lentils; מלבי = milk pudding; לאפה/פיתה = flatbread. Use correct macros for these.`;

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

// images: [{ base64, mimeType }] (1 or 2). Returns { items, assumptions }.
// Each item: { name, grams, calories, protein, source: 'db'|'ai' }.
// Throws Error(NO_KEY | BAD_KEY | RATE_LIMIT | NETWORK | EMPTY | HTTP_xxx)
export async function analyzePlatePhoto({ images, apiKey, reference = 'none' }) {
  if (!apiKey || !apiKey.trim()) throw new Error('NO_KEY');
  const imgs = (images || []).filter((im) => im && im.base64);
  if (!imgs.length) throw new Error('EMPTY');

  const parts = [{ text: VISION_PROMPT + '\n' + SUPPLEMENT + '\n\n' + refLine(reference) }];
  for (const im of imgs) parts.push({ inlineData: { mimeType: im.mimeType || 'image/jpeg', data: im.base64 } });

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
      temperature: 0.2,
      thinkingConfig: { thinkingLevel: VISION_THINKING },
    },
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
    .map((it) => {
      const name = String(it.name || '').trim();
      const grams = Math.max(0, Math.round(Number(it.grams) || 0));
      let calories = Math.max(0, Math.round(Number(it.calories) || 0));
      let protein = Math.max(0, Math.round((Number(it.protein) || 0) * 10) / 10);
      let source = 'ai';
      // DB grounding: trust the AI's grams, take calories/protein from a real DB.
      const g = grams > 0 ? groundItem(name, grams) : null;
      if (g) {
        calories = g.calories;
        protein = g.protein;
        source = 'db';
      }
      return { name, grams, calories, protein, source };
    })
    .filter((it) => it.name && (it.calories > 0 || it.protein > 0));

  if (!items.length) throw new Error('EMPTY');
  return { items, assumptions: String(parsed.assumptions || '').trim() };
}
