import { fetchCredits, DecartKeyError } from "./decart-api.js";
import { HttpError, readJson, sendJson } from "./http.js";

const MAX_LABEL_LENGTH = 40;
const API_KEY_PATTERN = /^[A-Za-z0-9_\-.]{20,256}$/;
const EDITABLE_STATUSES = ["active", "disabled"];

// Hanya data aman yang dikirim ke dashboard; key asli tidak pernah keluar dari server.
export const publicKey = (k) => ({
  id: k.id,
  label: k.label,
  masked: `••••${k.last4}`,
  status: k.status,
  credits: k.credits,
  keyQuota: k.keyQuota,
  creditsCheckedAt: k.creditsCheckedAt,
  lastError: k.lastError,
  lastUsedAt: k.lastUsedAt,
  usageSeconds: k.usageSeconds,
  sessions: k.sessions,
  tokensIssued: k.tokensIssued,
  createdAt: k.createdAt,
});

function validateLabel(label) {
  const value = typeof label === "string" ? label.trim() : "";
  if (!value) throw new HttpError(400, "VALIDATION_ERROR", "Isi nama untuk API key ini.", [{ field: "label", issue: "Wajib diisi" }]);
  if (value.length > MAX_LABEL_LENGTH) {
    throw new HttpError(400, "VALIDATION_ERROR", `Nama maksimal ${MAX_LABEL_LENGTH} karakter.`, [{ field: "label", issue: "Terlalu panjang" }]);
  }
  return value;
}

/** Rute /api/admin/* (selain login/logout/session yang ditangani di api.js). */
export async function handleAdminRoute({ req, res, path, store, keys, trial = null }) {
  const send = (data, status = 200) => sendJson(res, status, { data });

  if (req.method === "GET" && path === "/api/admin/overview") {
    const [list, events, overview, trialStats] = await Promise.all([store.list(), store.events(), keys.overview(), trial ? trial.stats() : null]);
    return send({ keys: list.map(publicKey), events: events.slice(0, 40), overview, trial: trialStats });
  }

  if (req.method === "POST" && path === "/api/admin/keys/refresh-all") {
    await keys.refreshAll();
    return send({ keys: (await store.list()).map(publicKey) });
  }

  if (req.method === "POST" && path === "/api/admin/keys") {
    const body = await readJson(req);
    const label = validateLabel(body.label);
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (!API_KEY_PATTERN.test(apiKey)) {
      throw new HttpError(400, "VALIDATION_ERROR", "Format API key tidak dikenali. Salin ulang dari platform.decart.ai.", [{ field: "apiKey", issue: "Format tidak valid" }]);
    }
    if (await store.hasKeyValue(apiKey)) throw new HttpError(409, "DUPLICATE_KEY", "API key ini sudah terdaftar.");
    let credits;
    try {
      credits = await fetchCredits(apiKey); // validasi ke Decart sebelum disimpan
    } catch (err) {
      if (err instanceof DecartKeyError && err.reason === "invalid") {
        throw new HttpError(422, "KEY_REJECTED", "Decart menolak API key ini. Pastikan key masih aktif.");
      }
      throw new HttpError(502, "DECART_UNAVAILABLE", "Tidak bisa memeriksa key ke Decart sekarang. Coba lagi sebentar.");
    }
    const created = await store.add({ label, apiKey });
    await keys.refreshCredits(created.id);
    res.setHeader("Location", `/api/admin/keys/${created.id}`);
    return send({ key: publicKey(await store.get(created.id)), credits: credits.credits }, 201);
  }

  const match = /^\/api\/admin\/keys\/([A-Za-z0-9_-]+)(\/refresh|\/move)?$/.exec(path);
  if (!match) throw new HttpError(404, "NOT_FOUND", "Endpoint tidak ditemukan.");
  const [, id, action] = match;
  const existing = await store.get(id);
  if (!existing) throw new HttpError(404, "KEY_NOT_FOUND", "API key tidak ditemukan.");

  if (req.method === "POST" && action === "/refresh") {
    return send({ key: publicKey(await keys.refreshCredits(id)) });
  }
  if (req.method === "POST" && action === "/move") {
    const { direction } = await readJson(req);
    if (direction !== "up" && direction !== "down") throw new HttpError(400, "VALIDATION_ERROR", "Arah harus up atau down.");
    await store.move(id, direction);
    return send({ keys: (await store.list()).map(publicKey) });
  }
  if (req.method === "PATCH" && !action) {
    const body = await readJson(req);
    const patch = {};
    if (body.label !== undefined) patch.label = validateLabel(body.label);
    if (body.status !== undefined) {
      if (!EDITABLE_STATUSES.includes(body.status)) throw new HttpError(400, "VALIDATION_ERROR", "Status harus active atau disabled.");
      patch.status = body.status;
    }
    const event = patch.status ? { type: `key_${patch.status === "active" ? "enabled" : "disabled"}`, message: patch.status === "active" ? "Diaktifkan admin" : "Dinonaktifkan admin" } : null;
    await store.update(id, patch, event);
    const updated = patch.status === "active" ? await keys.refreshCredits(id) : await store.get(id);
    return send({ key: publicKey(updated) });
  }
  if (req.method === "DELETE" && !action) {
    await store.remove(id);
    res.statusCode = 204;
    return res.end();
  }
  throw new HttpError(405, "METHOD_NOT_ALLOWED", "Metode tidak didukung.");
}
