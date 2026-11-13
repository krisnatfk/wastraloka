// Lentera Warisan: edukasi budaya yang memudar atau sudah hilang, plus ajakan "menyalakan lentera"
// (janji kecil pengunjung untuk ikut menjaganya). Lentera disimpan di perangkat pengunjung saja.

import { HELP_ACTIONS, HERITAGE_RISKS, RISK_KINDS, RISK_LEVELS, groupForDisplay } from "./content/heritage-risk.js";
import { provinceById } from "./content/provinces.js";
import { el } from "./dom.js";
import { provinceUrl } from "./map.js";

const STORAGE_KEY = "wastraloka.lentera.v1";
const REPORT_EMAIL = "rudeykadalz@gmail.com";

export function readLanterns() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch { return {}; }
}
function writeLanterns(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (err) { console.warn("[LENTERA] tidak tersimpan", err); }
}
export function toggleLantern(id) {
  const data = readLanterns();
  if (data[id]) delete data[id]; else data[id] = new Date().toISOString();
  writeLanterns(data);
  document.dispatchEvent(new CustomEvent("lentera:change", { detail: { id, lit: Boolean(data[id]) } }));
  return Boolean(data[id]);
}
export const lanternCount = () => Object.keys(readLanterns()).length;

// ikon lentera (gambar sendiri), dipakai di tombol dan peta
export const LANTERN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M12 3v2M8 7h8l1 2v8l-1 2H8l-1-2V9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 10.5c1.3 1.3 1.6 2.4 1.2 3.4a1.3 1.3 0 0 1-2.4 0c-.4-1 0-2.1 1.2-3.4Z" fill="currentColor"/><path d="M9 21h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

/** Kartu satu budaya yang memudar. */
export function riskCard(risk, { withProvince = true } = {}) {
  const level = RISK_LEVELS[risk.level];
  const province = provinceById(risk.province);
  const lit = Boolean(readLanterns()[risk.id]);
  const button = el("button", { type: "button", className: "lantern-btn" });
  const paint = (isLit) => {
    button.classList.toggle("is-lit", isLit);
    button.setAttribute("aria-pressed", String(isLit));
    button.innerHTML = `${LANTERN_SVG}<span>${isLit ? "Lentera menyala" : "Nyalakan lentera"}</span>`;
  };
  paint(lit);
  button.addEventListener("click", () => paint(toggleLantern(risk.id)));
  const card = el("article", { className: `risk-card tone-${level.tone}` }, [
    el("div", { className: "risk-top" }, [
      el("span", { className: `risk-badge tone-${level.tone}`, textContent: level.short }),
      el("span", { className: "risk-kind", textContent: RISK_KINDS[risk.kind] }),
    ]),
    el("h3", { textContent: risk.name }),
    el("p", { className: "risk-place" }, [
      risk.place,
      withProvince && province ? " · " : "",
      withProvince && province ? el("a", { href: provinceUrl(province.id), textContent: province.name }) : null,
    ]),
    el("p", { className: "risk-why", textContent: risk.why }),
    el("p", { className: "risk-note", textContent: risk.note }),
    el("p", { className: "risk-src" }, ["Sumber: ", el("a", { href: risk.source.url, rel: "noopener", target: "_blank", textContent: risk.source.label })]),
    button,
  ]);
  card.dataset.kind = risk.kind;
  return card;
}

export function helpList() {
  return el("ol", { className: "help-steps" }, HELP_ACTIONS.map((a) => el("li", {}, [el("b", { textContent: a.label }), el("span", { textContent: a.text })])));
}

export function reportLink(provinceName = "") {
  const subject = encodeURIComponent(`Kabar budaya yang memudar${provinceName ? ` - ${provinceName}` : ""}`);
  const body = encodeURIComponent("Nama budaya/adat:\nDaerah:\nApa yang terjadi (mis. pelaku tinggal sedikit):\nSumber atau kontak yang bisa dihubungi:\n");
  return `mailto:${REPORT_EMAIL}?subject=${subject}&body=${body}`;
}

function renderCounts() {
  const counts = Object.fromEntries(Object.keys(RISK_LEVELS).map((k) => [k, 0]));
  for (const r of HERITAGE_RISKS) counts[r.level] += 1;
  document.getElementById("lenteraLevels").replaceChildren(...Object.entries(RISK_LEVELS)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key, level]) => el("div", { className: `level tone-${level.tone}` }, [
      el("b", { textContent: String(counts[key]) }),
      el("strong", { textContent: level.label }),
      el("span", { textContent: level.desc }),
    ])));
}

function renderMine() {
  const n = lanternCount();
  document.getElementById("lenteraMine").textContent = n
    ? `Kamu sudah menyalakan ${n} lentera. Terima kasih sudah ikut menjaga.`
    : "Belum ada lentera yang kamu nyalakan. Pilih satu budaya di bawah, pelajari, lalu nyalakan lenteranya.";
}

export function initLenteraSection({ onRender } = {}) {
  const grid = document.getElementById("lenteraGrid");
  const tabs = document.getElementById("lenteraTabs");
  if (!grid || !tabs) return;
  let kind = "";
  const sorted = groupForDisplay(HERITAGE_RISKS);

  tabs.replaceChildren(...[["", "Semua"], ...Object.entries(RISK_KINDS)].map(([id, label]) => {
    const b = el("button", { type: "button", textContent: label });
    b.dataset.kind = id;
    return b;
  }));
  const render = () => {
    for (const b of tabs.children) b.setAttribute("aria-pressed", String(b.dataset.kind === kind));
    grid.replaceChildren(...sorted.filter((r) => !kind || r.kind === kind).map((r) => riskCard(r)));
    onRender?.(grid);
  };
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    kind = b.dataset.kind;
    render();
  });

  renderCounts();
  renderMine();
  document.getElementById("lenteraHelp").replaceChildren(helpList());
  document.getElementById("lenteraReport").href = reportLink();
  document.addEventListener("lentera:change", renderMine);
  render();
}
