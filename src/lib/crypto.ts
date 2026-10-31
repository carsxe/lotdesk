import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function keyBytes(secret: string): Buffer {
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string, secret: string): string {
  const key = keyBytes(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string, secret: string): string {
  const key = keyBytes(secret);
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function maskSecret(value: string, visible = 4): string {
  if (value.length <= visible) return "•".repeat(Math.max(4, value.length));
  return `${"•".repeat(8)}${value.slice(-visible)}`;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function cacheKeyFor(params: Record<string, string | number | boolean | undefined | null>): string {
  const normalized = Object.keys(params)
    .sort()
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => `${key}=${String(params[key]).trim().toLowerCase()}`)
    .join("&");
  return sha256Hex(normalized);
}
