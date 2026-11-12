import { HttpError, sendError } from "./http.js";

// Mengambil gambar baju dari link toko online (Tokopedia, Shopee, dll) tanpa masalah CORS.
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

// Endpoint ini publik: tolak alamat internal supaya tidak bisa dipakai menembus jaringan server (SSRF).
const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|\[?::1\]?|\[?f[cd][0-9a-f]{2}:.*|\[?fe80:.*)$/i;

function assertPublicUrl(url) {
  const { protocol, hostname } = new URL(url);
  if (!/^https?:$/.test(protocol) || PRIVATE_HOST.test(hostname)) {
    throw new HttpError(400, "INVALID_URL", "Link itu tidak bisa diambil.");
  }
}

const MAX_REDIRECTS = 4;

// redirect diikuti manual supaya setiap lompatan ikut dicek (redirect ke alamat internal ditolak)
async function grab(startUrl) {
  let url = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertPublicUrl(url);
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "image/avif,image/webp,image/*,text/html;q=0.8,*/*;q=0.5" },
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url).href;
      continue;
    }
    if (!response.ok) throw new HttpError(502, "UPSTREAM_REJECTED", `Situs menolak permintaan (HTTP ${response.status})`);
    return response;
  }
  throw new HttpError(502, "TOO_MANY_REDIRECTS", "Link itu terlalu banyak dialihkan.");
}

function findProductImage(html, pageUrl) {
  const match =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (!match) {
    throw new HttpError(422, "NO_PRODUCT_IMAGE", "Tidak menemukan foto produk di halaman itu. Klik kanan foto baju > Salin alamat gambar, lalu tempel linknya.");
  }
  return new URL(match[1].replace(/&amp;/g, "&"), pageUrl).href;
}

export async function handleImageProxy(req, res) {
  try {
    const target = new URL(req.url, "http://localhost").searchParams.get("url");
    if (!target || !/^https?:\/\//i.test(target)) throw new HttpError(400, "INVALID_URL", "Link tidak valid");

    let response = await grab(target);
    let type = response.headers.get("content-type") || "";
    if (type.includes("text/html")) {
      response = await grab(findProductImage(await response.text(), target));
      type = response.headers.get("content-type") || "";
    }
    if (!type.startsWith("image/")) throw new HttpError(415, "NOT_AN_IMAGE", "Link itu bukan gambar");

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) throw new HttpError(413, "IMAGE_TOO_LARGE", "Gambar terlalu besar");
    res.statusCode = 200;
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "no-store");
    res.end(buffer);
  } catch (err) {
    if (err instanceof HttpError) return sendError(res, err);
    sendError(res, new HttpError(502, "IMAGE_FETCH_FAILED", err?.message || "Gagal mengambil gambar"));
  }
}
