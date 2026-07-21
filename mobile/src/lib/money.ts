// Amounts are stored as *_minor bigint in the event's currency. Most East
// African currencies (UGX, KES, TZS, RWF) have no minor unit, so their
// "minor" value IS the whole amount; currencies like USD divide by 100.
const ZERO_DECIMAL = new Set([
  'UGX',
  'KES',
  'TZS',
  'RWF',
  'XOF',
  'XAF',
  'GNF',
  'BIF',
  'DJF',
  'KMF',
  'MGA',
  'JPY',
  'KRW',
  'VND',
  'CLP',
  'PYG',
  'VUV',
]);

export function isZeroDecimal(currency: string): boolean {
  return ZERO_DECIMAL.has(currency.toUpperCase());
}

// Convert a human-entered major amount (e.g. 30000 or 19.99) to minor units.
export function toMinor(amountMajor: number, currency: string): number {
  return isZeroDecimal(currency) ? Math.round(amountMajor) : Math.round(amountMajor * 100);
}

export function fromMinor(minor: number, currency: string): number {
  return isZeroDecimal(currency) ? minor : minor / 100;
}

// Display an amount with the currency code and thousands separators.
export function formatMoney(minor: number, currency: string): string {
  if (minor === 0) return 'Free';
  const zero = isZeroDecimal(currency);
  const value = fromMinor(minor, currency);
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: zero ? 0 : 2,
    maximumFractionDigits: zero ? 0 : 2,
  });
  return `${currency.toUpperCase()} ${formatted}`;
}
