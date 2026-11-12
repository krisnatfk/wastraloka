import { createDecartClient } from "@decartai/sdk";

const DECART_BASE_URL = "https://api.decart.ai";
const REQUEST_TIMEOUT_MS = 10_000;

export class DecartKeyError extends Error {
  /** @param {"invalid" | "exhausted" | "unavailable"} reason */
  constructor(reason, message, options) {
    super(message, options);
    this.name = "DecartKeyError";
    this.reason = reason;
  }
}

const CREDIT_ERROR_PATTERN = /credit|balance|quota|insufficient|payment|402/i;

function classify(status, detail, cause) {
  if (status === 401 || status === 403) return new DecartKeyError("invalid", `API key ditolak Decart (${status}): ${detail}`, { cause });
  if (status === 402 || CREDIT_ERROR_PATTERN.test(detail)) return new DecartKeyError("exhausted", `Kredit habis: ${detail}`, { cause });
  return new DecartKeyError("unavailable", `Decart tidak bisa dihubungi (${status || "jaringan"}): ${detail}`, { cause });
}

async function readDetail(response) {
  const text = await response.text().catch(() => "");
  try { return JSON.parse(text).detail || text; } catch { return text || response.statusText; }
}

/**
 * Sisa kredit untuk satu API key (GET /v1/credits, hanya untuk key server, bukan client token).
 * @returns {Promise<{credits: number, keyQuota: null | {limit: number, used: number, remaining: number, resetsAt: string | null}}>}
 */
export async function fetchCredits(apiKey) {
  let response;
  try {
    response = await fetch(`${DECART_BASE_URL}/v1/credits`, {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw classify(0, err.message, err);
  }
  if (!response.ok) throw classify(response.status, await readDetail(response));
  const body = await response.json();
  const quota = body.key_quota;
  return {
    credits: Number(body.credits) || 0,
    keyQuota: quota ? { limit: quota.limit, used: quota.used, remaining: quota.remaining, resetsAt: quota.resets_at ?? null } : null,
  };
}

/** Token sementara untuk browser. API key asli tidak pernah keluar dari server. */
export async function createClientToken(apiKey, options) {
  try {
    const client = createDecartClient({ apiKey });
    return await client.tokens.create(options);
  } catch (err) {
    const statusInMessage = Number((/\b([45]\d{2})\b/.exec(err?.message || "") || [])[1]);
    const status = err?.data?.status ?? err?.status ?? (Number.isFinite(statusInMessage) ? statusInMessage : 0);
    throw classify(status, err?.message || String(err), err);
  }
}
