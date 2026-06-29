// Barcode -> nutrition via the free Open Food Facts API (no key required).
// OFF asks for a descriptive User-Agent.

// Open Food Facts asks for an identifiable (not necessarily personal) contact.
const UA = 'BulkTracker/1.0 (Expo; contact: com.bulktracker.app)';

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round1 = (n) => Math.round(n * 10) / 10;

// Returns { name, servingLabel, calories, protein, barcode }.
// Throws Error with code: NETWORK | NOT_FOUND | NO_NUTRITION | HTTP_xxx
export async function lookupBarcode(code) {
  const url =
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json` +
    `?fields=product_name,product_name_he,brands,nutriments,serving_size`;

  let res;
  try {
    res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  } catch (e) {
    throw new Error('NETWORK');
  }
  if (!res.ok) throw new Error('HTTP_' + res.status);

  const data = await res.json();
  if (!data || data.status !== 1 || !data.product) throw new Error('NOT_FOUND');

  const p = data.product;
  const n = p.nutriments || {};
  const name = String(p.product_name_he || p.product_name || p.brands || 'מוצר').trim();

  // kcal: prefer the kcal field; fall back to kJ -> kcal.
  const kcalServing = num(n['energy-kcal_serving']) ?? (num(n['energy-kj_serving']) != null ? num(n['energy-kj_serving']) / 4.184 : null);
  const protServing = num(n['proteins_serving']);
  const kcal100 = num(n['energy-kcal_100g']) ?? (num(n['energy-kj_100g']) != null ? num(n['energy-kj_100g']) / 4.184 : null);
  const prot100 = num(n['proteins_100g']);

  let calories, protein, servingLabel;
  if (kcalServing != null && p.serving_size) {
    calories = Math.round(kcalServing);
    protein = round1(protServing ?? 0);
    servingLabel = `מנה (${String(p.serving_size).trim()})`;
  } else if (kcal100 != null) {
    calories = Math.round(kcal100);
    protein = round1(prot100 ?? 0);
    servingLabel = '100 גרם';
  } else {
    throw new Error('NO_NUTRITION');
  }

  return { name, servingLabel, calories, protein, barcode: String(code) };
}
