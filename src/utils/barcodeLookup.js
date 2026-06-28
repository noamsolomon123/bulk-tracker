import BARCODES from '../data/barcodes.json';
import { lookupBarcode as lookupOFF } from './openfoodfacts';

// Offline lookup against the bundled Israeli barcode DB (15.5k products).
// Map value shape: [name, kcal_per_100g, protein_per_100g].
export function lookupLocalBarcode(code) {
  const c = String(code || '').trim();
  if (!c) return null;
  let r = BARCODES[c];
  if (!r) {
    const noZeros = c.replace(/^0+/, '');
    if (noZeros && noZeros !== c) r = BARCODES[noZeros];
  }
  if (!r) return null;
  return { name: r[0], servingLabel: '100 גרם', calories: r[1], protein: r[2], source: 'local' };
}

// Local first (instant, offline), then Open Food Facts online.
// Throws (NOT_FOUND | NETWORK | NO_NUTRITION | HTTP_xxx) from OFF if both miss.
export async function lookupAnyBarcode(code) {
  const local = lookupLocalBarcode(code);
  if (local) return local;
  const off = await lookupOFF(code);
  return { ...off, source: 'off' };
}
