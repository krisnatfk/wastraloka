import { join } from "node:path";

import { createAdminAuth } from "./admin-auth.js";
import { handleAdminRoute } from "./admin-routes.js";
import { randomId, signPayload, verifySignedPayload } from "./crypto.js";
import { createEnvKeyPool, envKeysFrom } from "./env-key-pool.js";
import { clientIpFromRequest, createRateLimiter, HttpError, readJson, sendError, sendJson } from "./http.js";
import { handleImageProxy } from "./image-proxy.js";
import { createKeyService, NoKeyAvailableError } from "./key-service.js";
import { createKeyStore } from "./key-store.js";
import { createFilePersistence, createRedisClient, createRedisPersistence, redisConfigFromEnv } from "./persistence.js";
import { createTrialLimiter, trialConfigFromEnv } from "./trial-limiter.js";

const TICKET_TTL_MS = 6 * 60 * 60 * 1000;
const PUBLIC_LIMIT = { limit: 30, windowMs: 60_000 };
const STATE_KEY = "cermin-wastra:admin-state:v1";

function createPersistence({ env, rootDir, redis }) {
  if (redis) return createRedisPersistence(redis, STATE_KEY);
  // file sistem Vercel read-only: tanpa database, dashboard admin tidak bisa menyimpan apa pun
  if (env.VERCEL) return null;
  return createFilePersistence(join(env.VIRTUALFIT_DATA_DIR || join(rootDir, "data"), "keys.json"));
}

/**
 * Semua endpoint /api/*. Ditulis sebagai middleware Node biasa (req, res, next)
 * supaya dipakai sama persis oleh dev server Vite dan Vercel Functions (api/[...path].js).
 */
export function createApi({ env, rootDir }) {
  const secret = env.ADMIN_SECRET;
  const redisConfig = redisConfigFromEnv(env);
  const redis = redisConfig ? createRedisClient(redisConfig) : null;
  const auth = createAdminAuth({ username: env.ADMIN_USERNAME, passwordHash: env.ADMIN_PASSWORD_HASH, secret, redis });
  const persistence = secret ? createPersistence({ env, rootDir, redis }) : null;
  const store = persistence ? createKeyStore({ persistence, secret }) : null;
  const keys = store ? createKeyService({ store }) : null;
  const consumePublic = createRateLimiter({ ...PUBLIC_LIMIT, redis, prefix: "public" });
  const trialConfig = trialConfigFromEnv(env);
  const trial = trialConfig.enabled ? createTrialLimiter({ config: trialConfig, redis, secret }) : null;
  // DECART_API_KEY = key utama, DECART_API_KEY_2 dst. = cadangan bila key sebelumnya habis/ditolak
  const envKeys = envKeysFrom(env);
  const envKey = envKeys[0] ?? null;
  const envPool = createEnvKeyPool(envKeys);

  // Pertama kali: key dari .env otomatis masuk dashboard supaya tidak perlu diketik ulang.
  // Kalau gagal (mis. database lambat saat server baru nyala), dicoba lagi di request berikutnya.
  let importPromise = null;
  function ensureImported() {
    if (!store || !envKey) return Promise.resolve();
    importPromise ??= (async () => {
      if ((await store.list()).length === 0) {
        for (const [index, apiKey] of envKeys.entries()) {
          await store.add({ label: index === 0 ? "Key utama (.env)" : `Key cadangan ${index + 1} (.env)`, apiKey });
        }
        console.info(`[admin] ${envKeys.length} API key dari .env diimpor ke dashboard`);
      }
    })().catch((err) => {
      importPromise = null;
      console.error("[admin] gagal mengimpor key dari .env, akan dicoba lagi", err);
    });
    return importPromise;
  }

  // Token langsung dari key di env, tanpa dashboard (mode lama, juga cadangan kalau database bermasalah).
  async function issueTokenFromEnvKey(tokenOptions) {
    const { token, keyIndex } = await envPool.issueToken(tokenOptions);
    // tiket berisi urutan key, supaya laporan "kredit habis" dari browser bisa melewati key itu
    const ticket = secret ? signPayload({ e: keyIndex, exp: Date.now() + TICKET_TTL_MS }, secret) : null;
    return { apiKey: token.apiKey, expiresAt: token.expiresAt, ticket };
  }

  async function issueToken(tokenOptions) {
    if (!keys) return issueTokenFromEnvKey(tokenOptions);
    await ensureImported();
    try {
      const { token, key } = await keys.issueToken(tokenOptions);
      const ticket = signPayload({ k: key.id, exp: Date.now() + TICKET_TTL_MS }, secret);
      return { apiKey: token.apiKey, expiresAt: token.expiresAt, ticket };
    } catch (err) {
      if (err instanceof NoKeyAvailableError) throw new HttpError(503, "NO_KEY_AVAILABLE", "Layanan cermin sedang tidak tersedia. Coba lagi nanti.");
      // database tidak bisa dihubungi: cermin tetap jalan lewat key di env, hanya pencatatan pemakaian yang terlewat
      if (envKey) {
        console.error("[api] database bermasalah, memakai key dari env sementara", err);
        return issueTokenFromEnvKey(tokenOptions);
      }
      throw err;
    }
  }

  async function recordUsage(req) {
    const body = await readJson(req);
    const ticket = secret ? verifySignedPayload(body.ticket, secret) : null;
    if (Number.isInteger(ticket?.e)) {
      if (body.event === "insufficient_credits") envPool.markExhausted(ticket.e);
      return { recorded: true };
    }
    if (!keys) return null;
    if (!ticket?.k) throw new HttpError(400, "INVALID_TICKET", "Tiket pemakaian tidak valid.");
    if (body.event === "insufficient_credits") await keys.recordExhausted(ticket.k);
    if (body.seconds !== undefined) await keys.recordSession(ticket.k, body.seconds);
    return { recorded: true };
  }

  async function route(req, res, path) {
    if (path === "/api/image") return handleImageProxy(req, res);

    if (path === "/api/token") {
      if (req.method !== "POST") throw new HttpError(405, "METHOD_NOT_ALLOWED", "Gunakan POST.");
      const ip = clientIpFromRequest(req);
      await consumePublic(`token:${ip}`);
      // admin tidak kena batas coba gratis; tamu dibatasi jatah, IP, dan plafon harian
      if (!trial || auth.session(req)) return sendJson(res, 200, { data: { ...(await issueToken()), trial: null } });

      const guest = trial.identify(req, ip);
      const reservation = await trial.consume({ guestId: guest.id, ip });
      try {
        const issued = await issueToken(trial.tokenOptions());
        const data = { ...issued, trial: { seconds: reservation.seconds, triesLeft: reservation.triesLeft } };
        return sendJson(res, 200, { data }, guest.cookie ? { "Set-Cookie": guest.cookie } : {});
      } catch (err) {
        await trial.refund(reservation); // gagal bikin token bukan salah pengunjung: jatahnya dikembalikan
        throw err;
      }
    }
    if (path === "/api/trial") {
      if (req.method !== "GET") throw new HttpError(405, "METHOD_NOT_ALLOWED", "Gunakan GET.");
      if (!trial || auth.session(req)) return sendJson(res, 200, { data: { enabled: false } });
      const ip = clientIpFromRequest(req);
      const guest = trial.identify(req, ip, { mint: false });
      return sendJson(res, 200, { data: await trial.status({ guestId: guest.id, ip }) });
    }
    if (path === "/api/usage") {
      if (req.method !== "POST") throw new HttpError(405, "METHOD_NOT_ALLOWED", "Gunakan POST.");
      await consumePublic(`usage:${clientIpFromRequest(req)}`);
      return sendJson(res, 200, { data: await recordUsage(req) });
    }

    if (path === "/api/admin/session" && req.method === "GET") {
      return sendJson(res, 200, { data: { configured: auth.isConfigured, session: auth.session(req) } });
    }
    if (path === "/api/admin/login" && req.method === "POST") {
      const cookie = await auth.login(req, await readJson(req));
      return sendJson(res, 200, { data: { ok: true } }, { "Set-Cookie": cookie });
    }
    if (path === "/api/admin/logout" && req.method === "POST") {
      return sendJson(res, 200, { data: { ok: true } }, { "Set-Cookie": auth.logoutCookie(req) });
    }
    if (path.startsWith("/api/admin/")) {
      auth.require(req);
      if (!store) {
        const message = env.VERCEL && !redis
          ? "Database belum terhubung. Hubungkan Upstash Redis di Vercel (Storage), lalu deploy ulang."
          : "Admin belum disiapkan. Jalankan: npm run admin:setup";
        throw new HttpError(503, "ADMIN_NOT_CONFIGURED", message);
      }
      await ensureImported();
      return handleAdminRoute({ req, res, path, store, keys, trial });
    }
    throw new HttpError(404, "NOT_FOUND", "Endpoint tidak ditemukan.");
  }

  return async function apiMiddleware(req, res, next) {
    const path = new URL(req.url, "http://localhost").pathname;
    // folder server & data tidak boleh disajikan sebagai file statis
    if (/^\/(data|server|scripts)(\/|$)/i.test(decodeURIComponent(path)) || /^\/\.env/i.test(path)) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    if (path === "/admin") {
      res.statusCode = 302;
      res.setHeader("Location", "/admin/");
      return res.end();
    }
    if (!path.startsWith("/api/")) return next();
    res.requestId = randomId(6);
    store?.reload(); // serverless: selalu baca state terbaru dari database
    try {
      await route(req, res, path);
    } catch (err) {
      sendError(res, err);
    }
  };
}
