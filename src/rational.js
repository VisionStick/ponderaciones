// Exact decimal arithmetic. Academic thresholds are compared before display rounding.
const gcd = (a, b) => { a = a < 0n ? -a : a; while (b) [a, b] = [b, a % b]; return a || 1n; };
export class Rational {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (!d) throw new RangeError('División por cero');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d); this.n = n / g; this.d = d / g;
  }
  add(v) { v = q(v); return new Rational(this.n * v.d + v.n * this.d, this.d * v.d); }
  sub(v) { v = q(v); return new Rational(this.n * v.d - v.n * this.d, this.d * v.d); }
  mul(v) { v = q(v); return new Rational(this.n * v.n, this.d * v.d); }
  div(v) { v = q(v); return new Rational(this.n * v.d, this.d * v.n); }
  cmp(v) { v = q(v); const a = this.n * v.d - v.n * this.d; return a < 0n ? -1 : a > 0n ? 1 : 0; }
  gte(v) { return this.cmp(v) >= 0; }
  lt(v) { return this.cmp(v) < 0; }
  eq(v) { return this.cmp(v) === 0; }
  valueOf() { return Number(this.n) / Number(this.d); }
  toString() { return `${this.n}/${this.d}`; }
}
export function q(value) {
  if (value instanceof Rational) return value;
  let s = String(value).replace(',', '.');
  if (s.startsWith('.')) s = '0' + s;
  if (!/^-?\d+(\.\d*)?$/.test(s)) throw new TypeError('Decimal inválido');
  const [integer, decimals = ''] = s.split('.');
  const negative = s.startsWith('-');
  const n = BigInt(integer.replace('-', '') + decimals);
  return new Rational(negative ? -n : n, 10n ** BigInt(decimals.length));
}
export const sum = values => values.reduce((s, v) => s.add(v), q(0));
export const mean = values => values.length ? sum(values).div(values.length) : null;
export const min = (...values) => values.map(q).reduce((a, b) => a.lt(b) ? a : b);
export const max = (...values) => values.map(q).reduce((a, b) => a.gte(b) ? a : b);
export function parseGrade(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === '') return { value: null, error: null };
  if (!['string', 'number'].includes(typeof raw)) return { value: null, error: 'Ingresa una nota numérica.' };
  let s = String(raw).trim().replace(',', '.');
  if (s.startsWith('.')) s = '0' + s;
  if (s.length > 16 || !/^\d+(\.\d{0,6})?$/.test(s)) return { value: null, error: 'Usa un número entre 0 y 100 (hasta 6 decimales).' };
  const value = q(s);
  if (value.lt(0) || value.cmp(100) > 0) return { value: null, error: 'La nota debe estar entre 0 y 100.' };
  return { value, error: null };
}
// Generic positive multiplier retained only to read the legacy η value without reusing it.
export function parseFactor(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === '') return { value: null, error: null };
  if (!['string', 'number'].includes(typeof raw)) return { value: null, error: 'Ingresa el factor numérico confirmado.' };
  let s = String(raw).trim().replace(',', '.');
  if (s.startsWith('.')) s = '0' + s;
  if (s.length > 16 || !/^\d+(\.\d{0,6})?$/.test(s)) return { value: null, error: 'Usa un factor positivo con hasta 6 decimales.' };
  const value = q(s);
  return value.cmp(0) <= 0 ? { value: null, error: 'El factor debe ser mayor que cero. Confirma su valor en AULA.' } : { value, error: null };
}
// MAT071's corrected source explicitly bounds L, independently of grade validation.
export function parseLabFactor(raw) {
  const result = parseFactor(raw);
  if (result.error || result.value === null) return result;
  return result.value.lt('0.9') || result.value.cmp('1.1') > 0
    ? { value: null, error: 'El factor de laboratorio debe estar entre 0,9 y 1,1.' } : result;
}
// Smallest passing hundredth. This is a recommendation precision, not an institutional rounding rule.
export function minimumHundredth(predicate) {
  if (!predicate(q(100))) return null;
  let lo = 0, hi = 10000;
  while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (predicate(q(mid).div(100))) hi = mid; else lo = mid + 1; }
  return q(lo).div(100);
}
