// Vercel Function untuk semua /api/* (token, usage, image, admin).
// vercel.json me-rewrite /api/<path> ke /api/index?__path=<path>, karena catch-all
// [...path].js di Vercel Functions (non-Next.js) hanya menangkap satu segmen.
// Logikanya sama persis dengan dev server lokal: lihat server/api.js.
import { createApi } from "../server/api.js";
import { sendJson } from "../server/http.js";

const api = createApi({ env: process.env, rootDir: process.cwd() });
const FORWARDED_PATH_PARAM = "__path";

function restoreOriginalUrl(req) {
  const url = new URL(req.url, "http://localhost");
  const forwarded = url.searchParams.get(FORWARDED_PATH_PARAM);
  if (forwarded === null) return;
  url.searchParams.delete(FORWARDED_PATH_PARAM);
  req.url = `/api/${forwarded}${url.search}`;
}

export default function handler(req, res) {
  restoreOriginalUrl(req);
  return api(req, res, () => sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Endpoint tidak ditemukan.", details: null } }));
}
