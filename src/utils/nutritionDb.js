// Lazy-load the ~per-100g table so Metro doesn't parse/retain it at app boot
// (the photo-grounding path is the only consumer).
let _table;
function table() {
  if (!_table) _table = require('../data/nutrition100g.json');
  return _table;
}

// Keys longest-first so the most specific match wins (built once, lazily).
let _keys;
function keys() {
  if (!_keys) _keys = Object.keys(table()).sort((a, b) => b.length - a.length);
  return _keys;
}

// Must match the normalization used to build the table.
function normalize(s) {
  return String(s || '')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[׳״'"`]/g, '')
    .replace(/[^א-תa-zA-Z0-9]/g, '')
    .toLowerCase();
}

// Split a free-text item name into normalized whole-word tokens.
function tokenize(s) {
  return String(s || '')
    .split(/[\s,./()\-־–—]+/)
    .map(normalize)
    .filter((t) => t.length >= 2);
}

// Look up per-100g nutrition for a Hebrew food name and scale to grams.
// Returns { calories, protein, matchedName } or null if no confident match.
export function groundItem(name, grams) {
  const n = normalize(name);
  if (n.length < 2 || !(grams > 0)) return null;
  const TABLE = table();

  let entry = TABLE[n] ? n : null;
  if (!entry) {
    // Whole-token match only: a table key must equal one of the item's tokens,
    // so a short generic key (e.g. חלב) can't be grounded to a longer word
    // it merely appears inside (e.g. חלבון). Exact match above handles
    // multi-word names; here we keep the longest confident single-token key.
    const tokens = tokenize(name);
    if (tokens.length) {
      for (const key of keys()) {
        if (key.length < 3) break;
        if (tokens.includes(key)) {
          entry = key;
          break;
        }
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
