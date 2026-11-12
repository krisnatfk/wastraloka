import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const REDIS_TIMEOUT_MS = 10_000;

/**
 * Tempat menyimpan state dashboard admin (satu dokumen JSON).
 * - Lokal: file di disk.
 * - Vercel: Upstash Redis lewat REST (file sistem Vercel sementara & read-only).
 */
export function createFilePersistence(filePath) {
  let writeChain = Promise.resolve();
  return {
    kind: "file",
    async read() {
      try {
        return JSON.parse(await readFile(filePath, "utf8"));
      } catch (err) {
        if (err.code === "ENOENT") return null;
        throw new Error(`Gagal membaca ${filePath}`, { cause: err });
      }
    },
    // tulis atomik & berurutan: file sementara lalu rename, supaya tidak pernah setengah tertulis
    write(state) {
      const snapshot = JSON.stringify(state, null, 2);
      writeChain = writeChain.then(async () => {
        await mkdir(dirname(filePath), { recursive: true });
        const tmp = `${filePath}.${process.pid}.tmp`;
        await writeFile(tmp, snapshot, { mode: 0o600 });
        await rename(tmp, filePath);
      });
      return writeChain;
    },
  };
}

export function createRedisClient({ url, token }) {
  async function pipeline(commands) {
    let response;
    try {
      response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(commands),
        signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
      });
    } catch (err) {
      throw new Error("Database (Upstash Redis) tidak bisa dihubungi", { cause: err });
    }
    if (!response.ok) throw new Error(`Database menolak permintaan (HTTP ${response.status})`);
    const results = await response.json();
    const failed = results.find((r) => r.error);
    if (failed) throw new Error(`Perintah database gagal: ${failed.error}`);
    return results.map((r) => r.result);
  }
  return { pipeline, command: async (...args) => (await pipeline([args]))[0] };
}

export function createRedisPersistence(redis, key) {
  return {
    kind: "redis",
    async read() {
      const raw = await redis.command("GET", key);
      return raw ? JSON.parse(raw) : null;
    },
    async write(state) {
      await redis.command("SET", key, JSON.stringify(state));
    },
  };
}

const READ_ONLY_TOKEN = /READ_ONLY/i;

/**
 * Upstash langsung memakai UPSTASH_REDIS_REST_*. Dari Vercel Marketplace namanya
 * <PREFIX>_REST_API_URL / <PREFIX>_REST_API_TOKEN, dengan PREFIX bebas diatur
 * (KV, STORAGE, dst.), jadi semua prefix dikenali.
 */
export function redisConfigFromEnv(env) {
  const direct = { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN };
  if (direct.url && direct.token) return direct;

  const names = Object.keys(env);
  const urlName = names.find((n) => /_REST_API_URL$/.test(n) && env[n]);
  if (!urlName) return null;
  const prefix = urlName.replace(/_REST_API_URL$/, "");
  const tokenName = names.find((n) => n === `${prefix}_REST_API_TOKEN` && !READ_ONLY_TOKEN.test(n) && env[n]);
  return tokenName ? { url: env[urlName], token: env[tokenName] } : null;
}
