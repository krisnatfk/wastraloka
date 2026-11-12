import { createCipheriv, createDecipheriv, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const CIPHER = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;
const SALT_BYTES = 16;
const PASSWORD_HASH_BYTES = 64;
const ENCRYPTION_CONTEXT = "cermin-wastra:api-keys:v1";
const SIGNING_CONTEXT = "cermin-wastra:signing:v1";

// Kunci turunan dipisah per kegunaan supaya satu ADMIN_SECRET aman dipakai untuk enkripsi & tanda tangan.
const deriveKey = (secret, context) => createHmac("sha256", secret).update(context).digest().subarray(0, KEY_BYTES);

export function encryptSecret(plainText, secret) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(CIPHER, deriveKey(secret, ENCRYPTION_CONTEXT), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((b) => b.toString("base64url")).join(".");
}

export function decryptSecret(payload, secret) {
  const [iv, tag, encrypted] = payload.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv(CIPHER, deriveKey(secret, ENCRYPTION_CONTEXT), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

// Format hash: scrypt:<salt base64url>:<hash base64url>
// Pemisahnya ":" (bukan "$") karena Vite membaca .env dengan dotenv-expand,
// yang menganggap "$teks" sebagai variabel dan menghapusnya.
export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES);
  const hash = await scryptAsync(password, salt, PASSWORD_HASH_BYTES);
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltText, hashText] = String(stored || "").split(/[:$]/);
  if (scheme !== "scrypt" || !saltText || !hashText) return false;
  const expected = Buffer.from(hashText, "base64url");
  const actual = await scryptAsync(password, Buffer.from(saltText, "base64url"), expected.length);
  return timingSafeEqual(actual, expected);
}

export function timingSafeTextEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    timingSafeEqual(left, left); // tetap habiskan waktu yang sama
    return false;
  }
  return timingSafeEqual(left, right);
}

// Token bertanda tangan ringkas: <payload base64url>.<hmac base64url>
export function signPayload(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", deriveKey(secret, SIGNING_CONTEXT)).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifySignedPayload(token, secret) {
  const [body, mac] = String(token || "").split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", deriveKey(secret, SIGNING_CONTEXT)).update(body).digest("base64url");
  if (!timingSafeTextEqual(mac, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp === "number" && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const randomId = (bytes = 9) => randomBytes(bytes).toString("base64url");
export const randomSecret = () => randomBytes(48).toString("base64url");
