import { randomId, signPayload, verifySignedPayload } from "./crypto.js";
import { HttpError, isHttpsRequest, parseCookies } from "./http.js";

/**
 * Jatah coba gratis untuk tamu (tanpa login). Tiga lapis supaya kredit tidak bocor:
 *  1. per tamu  : cookie bertanda tangan, maksimal `guestTries` percobaan seumur cookie
 *  2. per IP    : maksimal `ipDailyTries` percobaan per hari (menahan yang ganti browser atau menghapus cookie).
 *                 Bawaannya sama dengan jatah tamu, jadi ganti browser di jaringan yang sama tidak menambah jatah.
 *  3. global    : plafon `dailyBudgetSeconds` per hari untuk semua pengunjung (pengaman utama)
 * Durasi tiap percobaan dikunci Decart lewat `maxSessionDuration` di dalam token.
 */

const GUEST_COOKIE = "vf_guest";
const DAY_SECONDS = 86_400;
const YEAR_SECONDS = 365 * DAY_SECONDS;
const JAKARTA_OFFSET_MS = 7 * 3_600_000;
const MIN_TRIAL_SECONDS = 10; // batas minimum maxSessionDuration dari Decart
const TOKEN_LIFETIME_SECONDS = 45;
const ALLOWED_MODELS = ["lucy-vton-3.6", "lucy-vton-3.5"];

export function trialConfigFromEnv(env) {
  const number = (name, fallback, min = 0) => {
    const value = Number(env[name]);
    return Number.isFinite(value) && value >= min ? value : fallback;
  };
  // Di Vercel aktif otomatis. Lokal mati supaya pengembangan tidak kena batas (nyalakan: TRIAL_ENABLED=1).
  const enabled = env.TRIAL_ENABLED ? env.TRIAL_ENABLED === "1" : Boolean(env.VERCEL);
  const guestTries = number("TRIAL_GUEST_TRIES", 2);
  return {
    enabled,
    guestTries,
    seconds: number("TRIAL_SECONDS", 20, MIN_TRIAL_SECONDS),
    ipDailyTries: number("TRIAL_IP_DAILY_TRIES", guestTries),
    dailyBudgetSeconds: number("TRIAL_DAILY_BUDGET_SECONDS", 300),
    // SDK Decart meminta token lagi tiap sambungan ulang: token yang diminta dalam masa tenggang
    // dihitung sebagai percobaan yang sama, supaya gangguan jaringan sesaat tidak menghabiskan jatah.
    graceSeconds: number("TRIAL_GRACE_SECONDS", 15, 1),
    maxIssuesPerTry: 3,
  };
}

/* ---------- penghitung: memori (lokal) atau Redis (Vercel) ---------- */

function createMemoryCounters() {
  const entries = new Map();
  const live = (key) => {
    const entry = entries.get(key);
    if (entry?.expiresAt && entry.expiresAt <= Date.now()) {
      entries.delete(key);
      return null;
    }
    return entry ?? null;
  };
  return {
    async incrBy(key, amount, ttlSeconds) {
      const entry = live(key) ?? { value: 0, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 };
      entry.value += amount;
      entries.set(key, entry);
      return entry.value;
    },
    async decrBy(key, amount) {
      const entry = live(key);
      if (entry) entry.value -= amount;
    },
    async get(key) {
      return Math.max(0, live(key)?.value ?? 0);
    },
  };
}

function createRedisCounters(redis) {
  return {
    async incrBy(key, amount, ttlSeconds) {
      const [value, ttl] = await redis.pipeline([["INCRBY", key, amount], ["TTL", key]]);
      if (ttlSeconds && ttl < 0) await redis.command("EXPIRE", key, ttlSeconds);
      return value;
    },
    async decrBy(key, amount) {
      await redis.command("DECRBY", key, amount);
    },
    async get(key) {
      return Math.max(0, Number(await redis.command("GET", key)) || 0);
    },
  };
}

// Redis gangguan: jatah tetap dibatasi lewat hitungan di memori instance, request tidak digagalkan.
function withMemoryFallback(primary, fallback) {
  const guarded = (method) => async (...args) => {
    try {
      return await primary[method](...args);
    } catch (err) {
      console.error(`[trial] Redis bermasalah (${method}), memakai hitungan memori`, err.message);
      return fallback[method](...args);
    }
  };
  return { incrBy: guarded("incrBy"), decrBy: guarded("decrBy"), get: guarded("get") };
}

/**
 * Kunci IP untuk pembatasan.
 * - IPv4 dipakai apa adanya; "::ffff:1.2.3.4" (IPv4 yang dibungkus IPv6) dianggap IPv4 itu.
 * - IPv6 dipotong ke /64 (4 blok pertama): satu rumah/perangkat memakai banyak alamat sementara
 *   dalam /64 yang sama, jadi tanpa ini satu perangkat bisa mendapat jatah berulang kali.
 */
export function normalizeIp(rawIp) {
  const value = String(rawIp || "unknown").trim().toLowerCase().split("%")[0];
  const mappedV4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value);
  if (mappedV4) return mappedV4[1];
  if (!value.includes(":")) return value;

  const hasCompression = value.includes("::");
  const [leftText, rightText = ""] = hasCompression ? value.split("::") : [value, ""];
  const left = leftText.split(":").filter(Boolean);
  const right = rightText.split(":").filter(Boolean);
  const missing = 8 - left.length - right.length;
  if (missing < 0 || (!hasCompression && missing !== 0)) return value; // bukan IPv6 yang valid: pakai apa adanya
  const blocks = [...left, ...Array(hasCompression ? missing : 0).fill("0"), ...right];
  return `${blocks.slice(0, 4).map((block) => block.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

const jakartaDay = () => new Date(Date.now() + JAKARTA_OFFSET_MS).toISOString().slice(0, 10);

function deny(code, message, config) {
  return new HttpError(429, code, message, { guestTries: config.guestTries, seconds: config.seconds });
}

export function createTrialLimiter({ config, redis = null, secret = null }) {
  const memory = createMemoryCounters();
  const counters = redis ? withMemoryFallback(createRedisCounters(redis), memory) : memory;

  const keysFor = (guestId, rawIp) => {
    const day = jakartaDay();
    const ip = normalizeIp(rawIp);
    return {
      guest: `cermin-wastra:trial:guest:${guestId}`,
      ip: `cermin-wastra:trial:ip:${day}:${ip}`,
      budget: `cermin-wastra:trial:budget:${day}`,
      window: `cermin-wastra:trial:window:${guestId}`,
    };
  };

  return {
    config,

    /** Siapa tamu ini? Cookie bertanda tangan; tanpa cookie valid dibuatkan baru (kalau `mint`). */
    identify(req, ip, { mint = true } = {}) {
      if (!secret) return { id: `ip-${ip}`, cookie: null };
      const payload = verifySignedPayload(parseCookies(req)[GUEST_COOKIE], secret);
      if (payload?.g) return { id: payload.g, cookie: null };
      if (!mint) return { id: null, cookie: null };
      const id = randomId(12);
      const secure = isHttpsRequest(req) ? "; Secure" : "";
      const cookie = `${GUEST_COOKIE}=${signPayload({ g: id }, secret)}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${YEAR_SECONDS}${secure}`;
      return { id, cookie };
    },

    /** Opsi token untuk tamu: umur pendek, hanya model VTON, durasi sesi dikunci. */
    tokenOptions() {
      return {
        expiresIn: TOKEN_LIFETIME_SECONDS,
        allowedModels: ALLOWED_MODELS,
        constraints: { realtime: { maxSessionDuration: config.seconds } },
        metadata: { kind: "guest-trial" },
      };
    },

    /** Sisa jatah, tanpa menghitung apa pun. */
    async status({ guestId, ip: rawIp }) {
      const ip = normalizeIp(rawIp);
      const keys = guestId ? keysFor(guestId, ip) : null;
      const [used, budgetUsed, ipUsed] = await Promise.all([
        keys ? counters.get(keys.guest) : 0,
        counters.get(`cermin-wastra:trial:budget:${jakartaDay()}`),
        counters.get(`cermin-wastra:trial:ip:${jakartaDay()}:${ip}`),
      ]);
      return {
        enabled: true,
        guestTries: config.guestTries,
        triesLeft: Math.max(0, config.guestTries - used),
        seconds: config.seconds,
        budgetAvailable: budgetUsed + config.seconds <= config.dailyBudgetSeconds,
        ipAvailable: ipUsed < config.ipDailyTries,
      };
    },

    /**
     * Pesan jatah sebelum token dibuat. Melempar HttpError 429 kalau ditolak.
     * Setiap token mengurangi plafon harian (asumsi terburuk: terpakai penuh);
     * hanya token pertama dalam masa tenggang yang mengurangi jatah tamu.
     */
    async consume({ guestId, ip }) {
      const keys = keysFor(guestId, ip);
      const undo = [];
      const rollback = () => Promise.all(undo.map(([key, amount]) => counters.decrBy(key, amount)));
      const reject = async (code, message) => {
        await rollback();
        throw deny(code, message, config);
      };

      const issued = await counters.incrBy(keys.window, 1, config.graceSeconds);
      undo.push([keys.window, 1]);
      if (issued > config.maxIssuesPerTry) {
        await reject("TRIAL_TOO_FAST", "Terlalu cepat. Tunggu beberapa detik lalu coba lagi.");
      }

      const isNewTry = issued === 1;
      let triesUsed;
      if (isNewTry) {
        triesUsed = await counters.incrBy(keys.guest, 1, YEAR_SECONDS);
        undo.push([keys.guest, 1]);
        if (triesUsed > config.guestTries) {
          await reject("TRIAL_LIMIT_REACHED", `Jatah coba gratis kamu sudah habis (${config.guestTries} dari ${config.guestTries}). Login dan beli menit segera hadir.`);
        }
        const ipUsed = await counters.incrBy(keys.ip, 1, 2 * DAY_SECONDS);
        undo.push([keys.ip, 1]);
        if (ipUsed > config.ipDailyTries) {
          await reject("TRIAL_IP_LIMIT", "Jatah coba gratis dari jaringan ini sudah habis hari ini (dihitung per alamat IP, jadi ganti browser tidak menambah jatah). Coba lagi besok.");
        }
      } else {
        triesUsed = await counters.get(keys.guest);
      }

      const budgetUsed = await counters.incrBy(keys.budget, config.seconds, 2 * DAY_SECONDS);
      undo.push([keys.budget, config.seconds]);
      if (budgetUsed > config.dailyBudgetSeconds) {
        await reject("TRIAL_BUDGET_EXHAUSTED", "Jatah coba gratis hari ini sudah habis untuk semua pengunjung. Coba lagi besok.");
      }

      return { undo, seconds: config.seconds, triesLeft: Math.max(0, config.guestTries - triesUsed) };
    },

    /** Dikembalikan kalau token gagal dibuat (bukan salah pengunjung). */
    async refund(reservation) {
      await Promise.all(reservation.undo.map(([key, amount]) => counters.decrBy(key, amount)));
    },

    async stats() {
      const budgetUsedSeconds = await counters.get(`cermin-wastra:trial:budget:${jakartaDay()}`);
      return {
        budgetUsedSeconds: Math.min(budgetUsedSeconds, config.dailyBudgetSeconds),
        budgetSeconds: config.dailyBudgetSeconds,
        guestTries: config.guestTries,
        seconds: config.seconds,
        ipDailyTries: config.ipDailyTries,
      };
    },
  };
}
