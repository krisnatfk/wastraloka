import { randomId } from "./crypto.js";

const MAX_BODY_BYTES = 16 * 1024;

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sendJson(res, status, { data = null, error = null, meta = null } = {}, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(JSON.stringify({ data, error, meta: { requestId: res.requestId ?? randomId(6), ...meta } }));
}

export function sendError(res, err) {
  if (err instanceof HttpError) {
    const headers = err.retryAfter ? { "Retry-After": String(err.retryAfter) } : {};
    return sendJson(res, err.status, { error: { code: err.code, message: err.message, details: err.details ?? null } }, headers);
  }
  console.error(`[api] ${res.requestId}`, err);
  return sendJson(res, 500, { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan di server. Coba lagi.", details: null } });
}

export async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Data yang dikirim terlalu besar.");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Format data tidak valid.");
  }
}

export function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "").split(";").map((part) => part.trim().split("=")).filter(([name]) => name)
      .map(([name, ...rest]) => [name, decodeURIComponent(rest.join("="))]),
  );
}

export const clientIp = (req) => req.socket?.remoteAddress || "unknown";

function rateLimited(retryAfter) {
  const err = new HttpError(429, "RATE_LIMITED", `Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik.`);
  err.retryAfter = retryAfter;
  return err;
}

/**
 * Pembatas berbasis jendela waktu. Dengan `redis`, hitungan dibagi ke semua instance
 * serverless; tanpa redis, disimpan di memori (cukup untuk server lokal).
 */
export function createRateLimiter({ limit, windowMs, redis = null, prefix = "rl" }) {
  const hits = new Map();
  const windowSeconds = Math.ceil(windowMs / 1000);

  async function consumeRedis(id) {
    const key = `cermin-wastra:${prefix}:${id}`;
    const [count, ttl] = await redis.pipeline([["INCR", key], ["TTL", key]]);
    if (ttl < 0) await redis.command("EXPIRE", key, windowSeconds);
    if (count > limit) throw rateLimited(ttl > 0 ? ttl : windowSeconds);
  }

  function consumeMemory(id) {
    const now = Date.now();
    const entry = hits.get(id);
    if (!entry || entry.resetAt <= now) {
      hits.set(id, { count: 1, resetAt: now + windowMs });
      return;
    }
    entry.count += 1;
    if (entry.count > limit) throw rateLimited(Math.ceil((entry.resetAt - now) / 1000));
  }

  return async function consume(id) {
    if (!redis) return consumeMemory(id);
    try {
      return await consumeRedis(id);
    } catch (err) {
      if (err instanceof HttpError) throw err; // 429 dari pembatas itu sendiri
      // database gangguan: tetap dibatasi lewat hitungan di memori instance ini, jangan gagalkan request
      console.error("[rate-limit] Redis bermasalah, memakai hitungan memori", err.message);
      return consumeMemory(id);
    }
  };
}

// Di Vercel, IP asli pengunjung ada di header x-forwarded-for (diisi oleh Vercel).
export const clientIpFromRequest = (req) =>
  (process.env.VERCEL && String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || clientIp(req);

export const isHttpsRequest = (req) => req.headers["x-forwarded-proto"] === "https" || Boolean(req.socket?.encrypted);
