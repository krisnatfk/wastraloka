import { createClientToken, DecartKeyError, fetchCredits } from "./decart-api.js";

export const MIN_CREDITS = 10; // di bawah ini key dianggap habis (±5 detik coba-pakai)
export const CREDITS_PER_SECOND = 2; // Lucy VTON realtime, mode standar
const CREDITS_STALE_MS = 60_000;
const MAX_SESSION_SECONDS = 3600;

export class NoKeyAvailableError extends Error {
  constructor() {
    super("Tidak ada API key Decart yang bisa dipakai. Tambahkan atau isi ulang kredit di /admin.");
    this.name = "NoKeyAvailableError";
  }
}

/**
 * Memilih API key berdasarkan urutan prioritas dan otomatis pindah ke key berikutnya
 * kalau key habis kredit, ditolak Decart, atau sedang tidak bisa dihubungi.
 */
export function createKeyService({ store }) {
  let lastIssuedKeyId = null;

  async function refreshCredits(id) {
    const key = await store.get(id);
    if (!key) return null;
    try {
      const { credits, keyQuota } = await fetchCredits(await store.reveal(id));
      const patch = { credits, keyQuota, creditsCheckedAt: new Date().toISOString(), lastError: null };
      if (key.status === "active" && credits <= MIN_CREDITS) {
        return store.update(id, { ...patch, status: "exhausted", exhaustedCredits: credits },
          { type: "key_exhausted", message: `Kredit tinggal ${credits}, key dinonaktifkan otomatis` });
      }
      const isToppedUp = key.status === "exhausted" && credits > MIN_CREDITS && credits > (key.exhaustedCredits ?? 0);
      if (isToppedUp) {
        return store.update(id, { ...patch, status: "active", exhaustedCredits: null },
          { type: "key_restored", message: `Kredit terisi (${credits}), key aktif lagi` });
      }
      if (key.status === "invalid") {
        return store.update(id, { ...patch, status: credits > MIN_CREDITS ? "active" : "exhausted" },
          { type: "key_restored", message: "Key diterima Decart lagi" });
      }
      return store.update(id, patch);
    } catch (err) {
      return markFailure(id, err);
    }
  }

  async function markFailure(id, err) {
    if (!(err instanceof DecartKeyError)) throw err;
    if (err.reason === "invalid") {
      return store.update(id, { status: "invalid", lastError: err.message }, { type: "key_invalid", message: err.message });
    }
    if (err.reason === "exhausted") {
      const key = await store.get(id);
      return store.update(id, { status: "exhausted", lastError: err.message, exhaustedCredits: key?.credits ?? 0 },
        { type: "key_exhausted", message: err.message });
    }
    return store.update(id, { lastError: err.message });
  }

  const isStale = (key) => !key.creditsCheckedAt || Date.now() - Date.parse(key.creditsCheckedAt) > CREDITS_STALE_MS;

  async function tryKey(key, tokenOptions) {
    if (isStale(key)) await refreshCredits(key.id);
    const fresh = await store.get(key.id);
    if (!fresh || fresh.status !== "active") return null;
    try {
      const token = await createClientToken(await store.reveal(key.id), tokenOptions);
      await store.update(key.id, { tokensIssued: fresh.tokensIssued + 1, lastUsedAt: new Date().toISOString(), lastError: null });
      return { token, key: fresh };
    } catch (err) {
      await markFailure(key.id, err);
      return null;
    }
  }

  return {
    refreshCredits,

    async refreshAll() {
      const keys = await store.list();
      return Promise.all(keys.filter((k) => k.status !== "disabled").map((k) => refreshCredits(k.id)));
    },

    /** Token sementara dari key aktif pertama yang masih bisa dipakai. */
    async issueToken(tokenOptions) {
      const keys = await store.list();
      // key yang habis ikut dicek ulang (mungkin sudah diisi), tapi setelah semua key aktif dicoba
      const candidates = [...keys.filter((k) => k.status === "active"), ...keys.filter((k) => k.status === "exhausted" && isStale(k))];
      for (const key of candidates) {
        const result = await tryKey(key, tokenOptions);
        if (!result) continue;
        if (lastIssuedKeyId && lastIssuedKeyId !== result.key.id) {
          await store.log("key_switched", result.key.id, `Beralih ke "${result.key.label}"`);
        }
        lastIssuedKeyId = result.key.id;
        return result;
      }
      throw new NoKeyAvailableError();
    },

    async recordSession(keyId, seconds) {
      const key = await store.get(keyId);
      if (!key) return;
      const used = Math.min(MAX_SESSION_SECONDS, Math.max(0, Math.round(Number(seconds) || 0)));
      await store.update(keyId, { usageSeconds: key.usageSeconds + used, sessions: key.sessions + 1 });
      refreshCredits(keyId).catch((err) => console.error("[admin] gagal memperbarui kredit", err));
    },

    /** Dipanggil saat Decart mengakhiri sesi karena kredit habis. */
    async recordExhausted(keyId) {
      const key = await store.get(keyId);
      if (!key || key.status !== "active") return;
      await refreshCredits(keyId);
      const fresh = await store.get(keyId);
      if (fresh?.status === "active") {
        await store.update(keyId, { status: "exhausted", exhaustedCredits: fresh.credits ?? 0 },
          { type: "key_exhausted", message: "Decart menghentikan sesi karena kredit habis" });
      }
    },

    async overview() {
      const keys = await store.list();
      const usable = keys.filter((k) => k.status === "active");
      const totalCredits = usable.reduce((sum, k) => sum + (k.credits ?? 0), 0);
      return {
        totalCredits,
        estimatedSeconds: Math.floor(totalCredits / CREDITS_PER_SECOND),
        currentKeyId: usable[0]?.id ?? null,
        counts: Object.fromEntries(["active", "disabled", "exhausted", "invalid"].map((s) => [s, keys.filter((k) => k.status === s).length])),
        totalSeconds: keys.reduce((sum, k) => sum + k.usageSeconds, 0),
        totalSessions: keys.reduce((sum, k) => sum + k.sessions, 0),
        minCredits: MIN_CREDITS,
        creditsPerSecond: CREDITS_PER_SECOND,
      };
    },
  };
}
