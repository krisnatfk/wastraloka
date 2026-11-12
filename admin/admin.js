import { renderEvents, renderKeys, renderStats, renderTrial } from "./admin-render.js";

const $ = (id) => document.getElementById(id);
const POLL_MS = 15_000;

class ApiError extends Error {
  constructor(status, code, message, options) {
    super(message, options);
    this.status = status;
    this.code = code;
  }
}

async function api(path, { method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };
  if (method !== "GET") headers["x-virtualfit-admin"] = "1";
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: "same-origin" });
  } catch (err) {
    throw new ApiError(0, "NETWORK", "Server tidak bisa dihubungi. Pastikan npm run dev masih berjalan.", { cause: err });
  }
  if (response.status === 204) return null;
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new ApiError(response.status, json.error?.code, json.error?.message || `Gagal (${response.status})`);
    if (response.status === 401 && path !== "/api/admin/login") showView("login");
    throw err;
  }
  return json.data;
}

let toastTimer;
function toast(message, isError = false) {
  const node = $("toast");
  node.textContent = message;
  node.classList.toggle("err", isError);
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), isError ? 6000 : 3000);
}

function showView(name) {
  $("viewSetup").hidden = name !== "setup";
  $("viewLogin").hidden = name !== "login";
  $("viewDashboard").hidden = name !== "dashboard";
  if (name === "login") { stopPolling(); setTimeout(() => $("loginUser").focus(), 0); }
}

async function withBusy(button, task) {
  const label = button.textContent;
  button.disabled = true;
  try { return await task(); } finally { button.disabled = false; button.textContent = label; }
}

/* ---------- data ---------- */
let currentKeys = [];

async function loadOverview() {
  const { keys, events, overview, trial } = await api("/api/admin/overview");
  currentKeys = keys;
  renderStats(overview, keys);
  renderTrial(trial);
  renderKeys(keys, overview.currentKeyId);
  renderEvents(events);
  $("updatedAt").textContent = `Diperbarui ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

let pollTimer = null;
function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    if (!document.hidden) loadOverview().catch((err) => console.warn("[admin] gagal memuat ulang", err));
  }, POLL_MS);
}
function stopPolling() { clearInterval(pollTimer); pollTimer = null; }

async function enterDashboard(username) {
  $("whoami").textContent = username;
  showView("dashboard");
  await loadOverview();
  startPolling();
  // saldo terbaru langsung dari Decart setiap dashboard dibuka
  api("/api/admin/keys/refresh-all", { method: "POST" })
    .then(loadOverview)
    .catch((err) => toast(`Gagal mengecek saldo: ${err.message}`, true));
}

/* ---------- login ---------- */
$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("loginError").textContent = "";
  const username = $("loginUser").value.trim();
  const password = $("loginPass").value;
  if (!username || !password) { $("loginError").textContent = "Isi username dan password."; return; }
  await withBusy($("loginSubmit"), async () => {
    $("loginSubmit").textContent = "Memeriksa...";
    try {
      await api("/api/admin/login", { method: "POST", body: { username, password } });
      $("loginPass").value = "";
      await enterDashboard(username);
    } catch (err) {
      $("loginError").textContent = err.message;
      $("loginPass").select();
    }
  });
});

$("logoutBtn").addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" }).catch(() => null);
  showView("login");
});

/* ---------- tambah key ---------- */
$("addToggle").addEventListener("click", () => {
  const form = $("addForm");
  form.hidden = !form.hidden;
  $("addToggle").setAttribute("aria-expanded", String(!form.hidden));
  if (!form.hidden) $("addLabel").focus();
});

$("addReveal").addEventListener("click", () => {
  const isHidden = $("addKey").type === "password";
  $("addKey").type = isHidden ? "text" : "password";
  $("addReveal").textContent = isHidden ? "Sembunyikan" : "Tampilkan";
  $("addReveal").setAttribute("aria-pressed", String(isHidden));
});

$("addForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("addError").textContent = "";
  const label = $("addLabel").value.trim();
  const apiKey = $("addKey").value.trim();
  if (!label || !apiKey) { $("addError").textContent = "Isi nama dan API key."; return; }
  await withBusy($("addSubmit"), async () => {
    $("addSubmit").textContent = "Memeriksa ke Decart...";
    try {
      const { key } = await api("/api/admin/keys", { method: "POST", body: { label, apiKey } });
      $("addForm").reset();
      $("addKey").type = "password";
      $("addForm").hidden = true;
      $("addToggle").setAttribute("aria-expanded", "false");
      toast(`"${key.label}" disimpan. Sisa kredit ${key.credits ?? "–"}.`);
      await loadOverview();
    } catch (err) {
      $("addError").textContent = err.message;
    }
  });
});

/* ---------- aksi per key ---------- */
async function confirmDelete(key) {
  $("confirmText").textContent = `"${key.label}" (${key.masked}) akan dihapus dari daftar dan tidak dipakai lagi oleh cermin. Key di akun Decart-mu tidak ikut terhapus.`;
  const dialog = $("confirmDlg");
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) => dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true }));
}

const ACTIONS = {
  up: (id) => api(`/api/admin/keys/${id}/move`, { method: "POST", body: { direction: "up" } }),
  down: (id) => api(`/api/admin/keys/${id}/move`, { method: "POST", body: { direction: "down" } }),
  refresh: async (id) => {
    const { key } = await api(`/api/admin/keys/${id}/refresh`, { method: "POST" });
    toast(`Saldo "${key.label}": ${key.credits ?? "–"} kredit.`);
  },
  enable: async (id) => {
    const { key } = await api(`/api/admin/keys/${id}`, { method: "PATCH", body: { status: "active" } });
    toast(key.status === "active" ? `"${key.label}" diaktifkan.` : `"${key.label}" belum bisa dipakai: ${key.lastError || "kredit habis"}`, key.status !== "active");
  },
  disable: async (id) => {
    const { key } = await api(`/api/admin/keys/${id}`, { method: "PATCH", body: { status: "disabled" } });
    toast(`"${key.label}" dinonaktifkan.`);
  },
  delete: async (id) => {
    const key = currentKeys.find((k) => k.id === id);
    if (!key || !(await confirmDelete(key))) return;
    await api(`/api/admin/keys/${id}`, { method: "DELETE" });
    toast(`"${key.label}" dihapus.`);
  },
};

$("keyList").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const run = ACTIONS[button.dataset.action];
  await withBusy(button, async () => {
    try {
      await run(button.dataset.id);
      await loadOverview();
    } catch (err) {
      toast(err.message, true);
    }
  });
});

$("refreshAllBtn").addEventListener("click", () => withBusy($("refreshAllBtn"), async () => {
  $("refreshAllBtn").textContent = "Mengecek...";
  try {
    await api("/api/admin/keys/refresh-all", { method: "POST" });
    await loadOverview();
    toast("Saldo semua key diperbarui dari Decart.");
  } catch (err) {
    toast(err.message, true);
  }
}));

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !$("viewDashboard").hidden) loadOverview().catch(() => null);
});

/* ---------- mulai ---------- */
(async function init() {
  try {
    const { configured, session } = await api("/api/admin/session");
    if (!configured) return showView("setup");
    if (!session) return showView("login");
    await enterDashboard(session.username);
  } catch (err) {
    showView("login");
    $("loginError").textContent = err.message;
  }
})();
