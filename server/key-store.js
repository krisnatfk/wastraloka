import { decryptSecret, encryptSecret, randomId } from "./crypto.js";

const MAX_EVENTS = 100;
const MAX_LABEL_LENGTH = 40;
export const KEY_STATUSES = ["active", "disabled", "exhausted", "invalid"];

const emptyState = () => ({ version: 1, keys: [], events: [] });

/**
 * Penyimpanan API key Decart. Key disimpan terenkripsi (AES-256-GCM);
 * yang keluar ke dashboard hanya 4 karakter terakhir.
 * `persistence` = file (lokal) atau Upstash Redis (Vercel), lihat persistence.js.
 */
export function createKeyStore({ persistence, secret }) {
  let state = null;

  async function load() {
    if (state) return state;
    state = { ...emptyState(), ...((await persistence.read()) || {}) };
    return state;
  }

  // setiap perubahan = load() lalu mutasi sinkron lalu persist(), tanpa await di antaranya,
  // jadi reload() dari request lain tidak bisa menyelip dan membuat state kosong tertulis
  const persist = () => (state ? persistence.write(state) : Promise.resolve());

  const ordered = () => [...state.keys].sort((a, b) => a.order - b.order);
  const findKey = (id) => state.keys.find((k) => k.id === id);

  function logEvent(type, key, message) {
    state.events.unshift({ at: new Date().toISOString(), type, keyId: key?.id ?? null, label: key?.label ?? null, message });
    state.events.length = Math.min(state.events.length, MAX_EVENTS);
  }

  return {
    // di serverless tiap request bisa jalan di instance berbeda: baca ulang state terbaru
    reload() {
      state = null;
    },
    async list() {
      await load();
      return ordered();
    },
    async events() {
      await load();
      return state.events;
    },
    async get(id) {
      await load();
      return findKey(id) ?? null;
    },
    async reveal(id) {
      await load();
      const key = findKey(id);
      return key ? decryptSecret(key.cipher, secret) : null;
    },
    async add({ label, apiKey }) {
      await load();
      const now = new Date().toISOString();
      const key = {
        id: randomId(),
        label: String(label).trim().slice(0, MAX_LABEL_LENGTH),
        cipher: encryptSecret(apiKey, secret),
        last4: apiKey.slice(-4),
        status: "active",
        order: state.keys.reduce((max, k) => Math.max(max, k.order), 0) + 1,
        createdAt: now,
        updatedAt: now,
        credits: null,
        keyQuota: null,
        creditsCheckedAt: null,
        lastError: null,
        lastUsedAt: null,
        usageSeconds: 0,
        sessions: 0,
        tokensIssued: 0,
      };
      state.keys.push(key);
      logEvent("key_added", key, "API key ditambahkan");
      await persist();
      return key;
    },
    async hasKeyValue(apiKey) {
      await load();
      return state.keys.some((k) => decryptSecret(k.cipher, secret) === apiKey);
    },
    async update(id, patch, event) {
      await load();
      const key = findKey(id);
      if (!key) return null;
      Object.assign(key, patch, { updatedAt: new Date().toISOString() });
      if (event) logEvent(event.type, key, event.message);
      await persist();
      return key;
    },
    async remove(id) {
      await load();
      const key = findKey(id);
      if (!key) return false;
      state.keys = state.keys.filter((k) => k.id !== id);
      logEvent("key_removed", key, "API key dihapus");
      await persist();
      return true;
    },
    async move(id, direction) {
      await load();
      const list = ordered();
      const index = list.findIndex((k) => k.id === id);
      const swapWith = index + (direction === "up" ? -1 : 1);
      if (index < 0 || swapWith < 0 || swapWith >= list.length) return false;
      [list[index].order, list[swapWith].order] = [list[swapWith].order, list[index].order];
      await persist();
      return true;
    },
    async log(type, keyId, message) {
      await load();
      logEvent(type, keyId ? findKey(keyId) : null, message);
      await persist();
    },
  };
}
