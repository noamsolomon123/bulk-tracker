// Gemini-powered food nutrition lookup. The API key is supplied by the user
// (pasted in Settings, stored locally) — never bundled into the app.

const MODEL = 'gemini-2.0-flash';
const ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;

const PROMPT = (query) =>
  `אתה מסד נתונים תזונתי מדויק. עבור המזון: "${query}", החזר ערכים תזונתיים מקובלים (לפי USDA / נתונים סטנדרטיים) למנה אחת רגילה שאדם באמת אוכל.
- name: שם המזון בעברית.
- servingLabel: גודל המנה בעברית כולל הכמות בגרמים/מ״ל בסוגריים (לדוגמה "פיתה אחת (60 גרם)").
- calories: קלוריות למנה (מספר שלם).
- protein: גרם חלבון למנה (מספר).
ודא שהערכים ריאליסטיים ועקביים (protein*4 לא עולה על הקלוריות).`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    servingLabel: { type: 'STRING' },
    calories: { type: 'NUMBER' },
    protein: { type: 'NUMBER' },
  },
  required: ['name', 'servingLabel', 'calories', 'protein'],
};

// Returns { name, servingLabel, calories, protein }. Throws Error with a
// machine code in .message: NO_KEY | BAD_KEY | RATE_LIMIT | NETWORK | EMPTY | HTTP_xxx
export async function lookupFoodNutrition(query, apiKey) {
  if (!apiKey || !apiKey.trim()) throw new Error('NO_KEY');

  const body = {
    contents: [{ role: 'user', parts: [{ text: PROMPT(query) }] }],
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

  const calories = Math.round(Number(parsed.calories) || 0);
  const protein = Math.round((Number(parsed.protein) || 0) * 10) / 10;
  if (!calories && !protein) throw new Error('EMPTY');

  return {
    name: String(parsed.name || query).trim(),
    servingLabel: String(parsed.servingLabel || 'מנה').trim(),
    calories,
    protein,
  };
}
