import { createClientToken, DecartKeyError, fetchCredits } from "./decart-api.js";
import { HttpError } from "./http.js";
import { MIN_CREDITS } from "./key-service.js";

const CREDITS_CACHE_MS = 60_000;
const MAX_ENV_KEYS = 10;
const PLACEHOLDER = "isi_api_key";

/** DECART_API_KEY, lalu DECART_API_KEY_2 … DECART_API_KEY_10, urut sebagai prioritas. */
export function envKeysFrom(env) {
  const names = ["DECART_API_KEY", ...Array.from({ length: MAX_ENV_KEYS - 1 }, (_, i) => `DECART_API_KEY_${i + 2}`)];
  const keys = names.map((name) => env[name]?.trim()).filter((value) => value && !value.includes(PLACEHOLDER));
  return [...new Set(keys)];
}

/**
 * Rotasi key langsung dari env, untuk saat dashboard/database tidak tersedia.
 * Key dicek kreditnya (di-cache 1 menit per instance); yang habis atau ditolak dilewati ke key berikutnya.
 */
export function createEnvKeyPool(apiKeys) {
  const state = apiKeys.map(() => ({ blockedUntil: 0, checkedAt: 0 }));

  const block = (index) => { state[index].blockedUntil = Date.now() + CREDITS_CACHE_MS; };

  async function hasCredits(index) {
    const entry = state[index];
    if (entry.blockedUntil > Date.now()) return false;
    if (Date.now() - entry.checkedAt < CREDITS_CACHE_MS) return true;
    try {
      const { credits } = await fetchCredits(apiKeys[index]);
      entry.checkedAt = Date.now();
      if (credits > MIN_CREDITS) return true;
      block(index);
      return false;
    } catch (err) {
      if (err instanceof DecartKeyError && err.reason !== "unavailable") { block(index); return false; }
      // cek kredit gagal karena jaringan: tetap coba buat token, biar Decart yang memutuskan
      return true;
    }
  }

  async function issueToken(tokenOptions) {
    if (!apiKeys.length) throw new HttpError(500, "NO_API_KEY", "DECART_API_KEY belum diisi di file .env");
    let lastError = null;
    for (let index = 0; index < apiKeys.length; index += 1) {
      if (!(await hasCredits(index))) continue;
      try {
        const token = await createClientToken(apiKeys[index], tokenOptions);
        return { token, keyIndex: index };
      } catch (err) {
        lastError = err;
        if (err instanceof DecartKeyError && err.reason !== "unavailable") block(index);
        console.error(`[api] key env #${index + 1} gagal, mencoba key berikutnya`, err.message);
      }
    }
    if (lastError?.reason === "unavailable") throw new HttpError(502, "DECART_ERROR", lastError.message);
    throw new HttpError(503, "NO_KEY_AVAILABLE", "Layanan cermin sedang tidak tersedia. Coba lagi nanti.");
  }

  /** Dipanggil saat browser melapor kredit habis di tengah sesi. */
  const markExhausted = (index) => { if (state[index]) block(index); };

  return { issueToken, markExhausted, size: apiKeys.length };
}
