// Fungsi tampilan untuk dashboard admin. Semua teks dari server dimasukkan lewat
// textContent (bukan innerHTML) supaya nama key tidak bisa menyisipkan HTML.

const STATUS_LABEL = { active: "Aktif", exhausted: "Kredit habis", invalid: "Ditolak Decart", disabled: "Nonaktif" };
const EVENT_LABEL = {
  key_added: "Key ditambahkan",
  key_removed: "Key dihapus",
  key_exhausted: "Kredit habis",
  key_restored: "Key aktif lagi",
  key_invalid: "Key ditolak",
  key_switched: "Ganti key otomatis",
  key_enabled: "Diaktifkan",
  key_disabled: "Dinonaktifkan",
};

const numberFormat = new Intl.NumberFormat("id-ID");
export const formatNumber = (value) => (value === null || value === undefined ? "–" : numberFormat.format(value));

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours) return `${hours} j ${minutes} mnt`;
  if (minutes) return `${minutes} mnt ${rest} dtk`;
  return `${rest} dtk`;
}

export function formatRelative(iso) {
  if (!iso) return "belum pernah";
  const diff = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (diff < 45) return "baru saja";
  if (diff < 3600) return `${Math.round(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.round(diff / 3600)} jam lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function actionButton(label, action, id, { title, disabled = false, extraClass = "" } = {}) {
  const button = el("button", `btn btn-line btn-sm ${extraClass}`.trim(), label);
  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = id;
  button.disabled = disabled;
  if (title) { button.title = title; button.setAttribute("aria-label", title); }
  return button;
}

export function renderStats(overview, keys) {
  const current = keys.find((k) => k.id === overview.currentKeyId);
  const { counts } = overview;
  document.getElementById("statCredits").textContent = formatNumber(overview.totalCredits);
  document.getElementById("statCreditsSub").textContent = `dari ${counts.active} key aktif`;
  document.getElementById("statTime").textContent = formatDuration(overview.estimatedSeconds);
  document.getElementById("statTimeSub").textContent = `± ${overview.creditsPerSecond} kredit per detik`;
  document.getElementById("statCurrent").textContent = current ? current.label : "Tidak ada";
  document.getElementById("statCounts").textContent =
    `${counts.active} aktif · ${counts.exhausted} habis · ${counts.invalid} ditolak · ${counts.disabled} nonaktif`;
  document.getElementById("statUsage").textContent = formatDuration(overview.totalSeconds);
  document.getElementById("statSessions").textContent = `${formatNumber(overview.totalSessions)} sesi cermin`;
  document.getElementById("minCredits").textContent = overview.minCredits;
}

export function renderTrial(trial) {
  const line = document.getElementById("trialLine");
  if (!trial) { line.textContent = ""; return; }
  line.textContent = `Coba gratis hari ini: ${formatNumber(trial.budgetUsedSeconds)} / ${formatNumber(trial.budgetSeconds)} dtk · tamu ${trial.guestTries}× ${trial.seconds} dtk`;
}

export function renderKeys(keys, currentKeyId) {
  const list = document.getElementById("keyList");
  document.getElementById("keysEmpty").hidden = keys.length > 0;
  const maxCredits = Math.max(1, ...keys.map((k) => k.credits ?? 0));
  list.replaceChildren(...keys.map((key, index) => {
    const item = el("li", `key${key.id === currentKeyId ? " is-current" : ""}`);

    const rank = el("span", "key-rank", String(index + 1));
    rank.title = index === 0 ? "Dipakai pertama" : `Cadangan ke-${index}`;

    const info = el("div", "key-info");
    const meta = el("div", "key-meta");
    meta.append(el("span", `pill pill-${key.status}`, STATUS_LABEL[key.status] ?? key.status), el("span", "mono", key.masked));
    if (key.id === currentKeyId) meta.append(el("span", "", "· sedang dipakai"));
    info.append(el("div", "key-name", key.label), meta);

    const credits = el("div", "key-credits");
    const ratio = key.keyQuota ? key.keyQuota.remaining / Math.max(1, key.keyQuota.limit) : (key.credits ?? 0) / maxCredits;
    const bar = el("div", "bar");
    const fill = el("i");
    fill.style.width = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
    bar.append(fill);
    credits.append(
      el("strong", "", formatNumber(key.credits)),
      el("span", "", key.keyQuota ? `kuota ${formatNumber(key.keyQuota.remaining)} / ${formatNumber(key.keyQuota.limit)}` : `≈ ${formatDuration((key.credits ?? 0) / 2)} · dicek ${formatRelative(key.creditsCheckedAt)}`),
      bar,
    );

    const usage = el("div", "key-usage");
    usage.append(el("strong", "", formatDuration(key.usageSeconds)), el("span", "", `${formatNumber(key.sessions)} sesi · terakhir ${formatRelative(key.lastUsedAt)}`));

    const actions = el("div", "key-actions");
    const isEnabled = key.status !== "disabled";
    actions.append(
      actionButton("↑", "up", key.id, { title: `Naikkan prioritas ${key.label}`, disabled: index === 0, extraClass: "icon-btn" }),
      actionButton("↓", "down", key.id, { title: `Turunkan prioritas ${key.label}`, disabled: index === keys.length - 1, extraClass: "icon-btn" }),
      actionButton("Cek saldo", "refresh", key.id),
      actionButton(isEnabled ? "Nonaktifkan" : "Aktifkan", isEnabled ? "disable" : "enable", key.id),
      actionButton("Hapus", "delete", key.id),
    );

    item.append(rank, info, credits, usage, actions);
    if (key.lastError && key.status !== "active") item.append(el("p", "key-error", key.lastError));
    return item;
  }));
}

export function renderEvents(events) {
  const list = document.getElementById("eventList");
  document.getElementById("eventsEmpty").hidden = events.length > 0;
  list.replaceChildren(...events.map((event) => {
    const item = el("li");
    const time = el("time", "", new Date(event.at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }));
    time.dateTime = event.at;
    const message = el("span");
    if (event.label) message.append(el("b", "", event.label), document.createTextNode(" · "));
    message.append(document.createTextNode(event.message));
    item.append(time, el("span", "", EVENT_LABEL[event.type] ?? event.type), message);
    return item;
  }));
}
