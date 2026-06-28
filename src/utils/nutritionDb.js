import TABLE from '../data/nutrition100g.json';

// Must match the normalization used to build the table.
function normalize(s) {
  return String(s || '')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[׳״'"`]/g, '')
    .replace(/[^א-תa-zA-Z0-9]/g, '')
    .toLowerCase();
}

// Keys longest-first so the most specific match wins.
const KEYS = Object.keys(TABLE).sort((a, b) => b.length - a.length);

// Look up per-100g nutrition for a Hebrew food name and scale to grams.
// Returns { calories, protein, matchedName } or null if no confident match.
export function groundItem(name, grams) {
  const n = normalize(name);
  if (n.length < 2 || !(grams > 0)) return null;

  let entry = TABLE[n] ? n : null;
  if (!entry) {
    // Longest table key that appears inside the (more specific) item name.
    for (const key of KEYS) {
      if (key.length < 3) break;
      if (n.includes(key)) {
        entry = key;
        break;
      }
    }
  }
  if (!entry) return null;

  const [display, kcal100, protein100] = TABLE[entry];
  return {
    calories: Math.round((kcal100 * grams) / 100),
    protein: Math.round(((protein100 * grams) / 100) * 10) / 10,
    matchedName: display,
  };
}
