import { signPayload, timingSafeTextEqual, verifyPassword, verifySignedPayload } from "./crypto.js";
import { clientIpFromRequest, createRateLimiter, HttpError, isHttpsRequest, parseCookies } from "./http.js";

const SESSION_COOKIE = "vf_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
// header wajib di request yang mengubah data; browser lain tidak bisa memalsukannya lintas situs
export const CSRF_HEADER = "x-virtualfit-admin";

export function createAdminAuth({ username, passwordHash, secret, redis = null }) {
  const consumeLogin = createRateLimiter({ limit: LOGIN_ATTEMPTS, windowMs: LOGIN_WINDOW_MS, redis, prefix: "login" });
  const isConfigured = Boolean(username && passwordHash && secret);

  function cookie(req, value, maxAgeSeconds) {
    const secure = isHttpsRequest(req) ? "; Secure" : "";
    return `${SESSION_COOKIE}=${value}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`;
  }

  return {
    isConfigured,

    async login(req, body) {
      if (!isConfigured) throw new HttpError(503, "ADMIN_NOT_CONFIGURED", "Admin belum disiapkan. Jalankan: npm run admin:setup");
      await consumeLogin(clientIpFromRequest(req));
      const inputUser = typeof body.username === "string" ? body.username.trim() : "";
      const inputPassword = typeof body.password === "string" ? body.password : "";
      if (!inputUser || !inputPassword) {
        throw new HttpError(400, "VALIDATION_ERROR", "Isi username dan password.");
      }
      // cek password selalu dijalankan supaya waktu respons tidak membocorkan username yang benar
      const isPasswordValid = await verifyPassword(inputPassword, passwordHash);
      if (!timingSafeTextEqual(inputUser, username) || !isPasswordValid) {
        throw new HttpError(401, "INVALID_CREDENTIALS", "Username atau password salah.");
      }
      const token = signPayload({ u: username, exp: Date.now() + SESSION_TTL_MS }, secret);
      return cookie(req, token, SESSION_TTL_MS / 1000);
    },

    logoutCookie: (req) => cookie(req, "", 0),

    session(req) {
      if (!isConfigured) return null;
      const payload = verifySignedPayload(parseCookies(req)[SESSION_COOKIE], secret);
      return payload?.u === username ? { username, expiresAt: new Date(payload.exp).toISOString() } : null;
    },

    require(req) {
      const session = this.session(req);
      if (!session) throw new HttpError(401, "UNAUTHENTICATED", "Sesi admin berakhir. Masuk lagi.");
      if (req.method !== "GET" && req.headers[CSRF_HEADER] !== "1") {
        throw new HttpError(403, "CSRF_REJECTED", "Permintaan ditolak.");
      }
      return session;
    },
  };
}
