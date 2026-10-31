const TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeVin(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function isValidVin(value: string): boolean {
  const vin = normalizeVin(value);
  if (vin.length !== 17) return false;
  if (/[IOQ]/.test(vin)) return false;

  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    const char = vin[i];
    const digit = /\d/.test(char) ? Number(char) : TRANSLITERATION[char];
    if (digit === undefined) return false;
    sum += digit * WEIGHTS[i];
  }

  const check = sum % 11;
  const expected = check === 10 ? "X" : String(check);
  return vin[8] === expected;
}

export function vinChecksumValid(value: string): boolean {
  return isValidVin(value);
}
