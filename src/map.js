// Peta interaktif 38 provinsi.
// - Awalnya semua daratan hijau. Provinsi yang dipilih (atau provinsi halaman ini) berganti isi menjadi
//   foto rumah adat/budayanya, dipotong mengikuti bentuk provinsi.
// - Opsional: ilustrasi pasangan berpakaian adat berdiri di tiap provinsi (src/figures.js).
// - Tiap provinsi adalah <a> di dalam SVG: bisa di-Tab dan dibuka di tab baru seperti link biasa.

import { CULTURE_PHOTOS } from "./content/culture-photos.js";
import { MAP_VIEWBOX, PROVINCE_SHAPES } from "./content/indonesia-map.js";
import { PROVINCE_PHOTOS } from "./content/province-photos.js";
import { PROVINCES, REGIONS } from "./content/provinces.js";
import { wikimediaSized } from "./content/wastra-catalog.js";
import { coupleMarkup } from "./figures.js";
import { HERITAGE_RISKS, RISK_LEVELS } from "./content/heritage-risk.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const FILL_IMAGE_WIDTH = 500;
const CARD_IMAGE_WIDTH = 330;
const FIGURE_WIDTH = 30;
const FIGURE_HEIGHT = 41;
const LEADER_MIN_DISTANCE = 8;
export const provinceUrl = (id) => `/provinsi/?p=${encodeURIComponent(id)}`;
const ZOOM_MS = 950;
const ZOOM_PADDING = 0.6; // ruang di sekitar provinsi saat diperbesar, relatif terhadap ukurannya
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const dataById = new Map(PROVINCES.map((p) => [p.id, p]));
const regionById = new Map(REGIONS.map((r) => [r.id, r]));

// Titik kaki figur tiap provinsi (koordinat peta). Provinsi yang rapat (Jawa, Sulawesi, Papua)
// diletakkan di laut terdekat dan dihubungkan garis ke provinsinya, seperti peta pakaian adat di buku sekolah.
const FIGURE_FEET = {
  "aceh": [44, 50], "sumatera-utara": [86, 88], "sumatera-barat": [84, 165], "riau": [142, 118], "kepulauan-riau": [229, 98],
  "jambi": [172, 168], "bengkulu": [134, 228], "sumatera-selatan": [203, 210], "lampung": [176, 262],
  "kepulauan-bangka-belitung": [252, 188], "banten": [222, 304], "dki-jakarta": [250, 246], "jawa-barat": [274, 322],
  "jawa-tengah": [320, 262], "daerah-istimewa-yogyakarta": [330, 344], "jawa-timur": [382, 270], "bali": [432, 352],
  "nusa-tenggara-barat": [492, 352], "nusa-tenggara-timur": [592, 364], "kalimantan-barat": [347, 135],
  "kalimantan-tengah": [402, 172], "kalimantan-selatan": [452, 203], "kalimantan-timur": [472, 128],
  "kalimantan-utara": [470, 72], "sulawesi-utara": [652, 98], "gorontalo": [598, 120], "sulawesi-tengah": [560, 152],
  "sulawesi-barat": [512, 196], "sulawesi-selatan": [546, 240], "sulawesi-tenggara": [602, 240], "maluku": [756, 238],
  "maluku-utara": [716, 128], "papua-barat-daya": [806, 152], "papua-barat": [846, 210], "papua-tengah": [896, 246],
  "papua": [952, 170], "papua-pegunungan": [986, 228], "papua-selatan": [956, 304],
};

// Nama provinsi di peta: singkatan yang lazim dipakai (seperti peta pakaian adat di buku sekolah);
// nama lengkap tetap ada di tooltip, label tautan, dan halaman provinsinya.
const MAP_LABELS = {
  "aceh": "Aceh", "sumatera-utara": "Sumut", "sumatera-barat": "Sumbar", "riau": "Riau", "kepulauan-riau": "Kepri",
  "jambi": "Jambi", "sumatera-selatan": "Sumsel", "bengkulu": "Bengkulu", "lampung": "Lampung",
  "kepulauan-bangka-belitung": "Babel", "banten": "Banten", "dki-jakarta": "DKI Jakarta", "jawa-barat": "Jabar",
  "jawa-tengah": "Jateng", "daerah-istimewa-yogyakarta": "DIY", "jawa-timur": "Jatim", "bali": "Bali",
  "nusa-tenggara-barat": "NTB", "nusa-tenggara-timur": "NTT", "kalimantan-barat": "Kalbar", "kalimantan-tengah": "Kalteng",
  "kalimantan-selatan": "Kalsel", "kalimantan-timur": "Kaltim", "kalimantan-utara": "Kaltara", "sulawesi-utara": "Sulut",
  "gorontalo": "Gorontalo", "sulawesi-tengah": "Sulteng", "sulawesi-barat": "Sulbar", "sulawesi-selatan": "Sulsel",
  "sulawesi-tenggara": "Sultra", "maluku": "Maluku", "maluku-utara": "Malut", "papua": "Papua", "papua-barat": "Papua Barat",
  "papua-barat-daya": "Papua B. Daya", "papua-tengah": "Papua Tengah", "papua-pegunungan": "Papua Peg.", "papua-selatan": "Papua Selatan",
};
const LABEL_FONT = 10.5;
const LABEL_GAP = 9; // jarak dari kaki figur ke garis dasar teks
const LABEL_CHAR_WIDTH = 0.6; // perkiraan lebar huruf relatif terhadap ukuran font, untuk menjaga label di dalam peta

const risksByProvince = HERITAGE_RISKS.reduce((map, risk) => map.set(risk.province, [...(map.get(risk.province) || []), risk]), new Map());

// Lapisan "Mode Lentera": lentera menyala di provinsi yang punya budaya memudar atau sudah hilang.
function lanternLayer(svg, shapesById) {
  const layer = svgEl("g", { class: "map-lanterns", "aria-hidden": "true" });
  for (const [id, risks] of risksByProvince) {
    const shape = shapesById.get(id);
    if (!shape) continue;
    const worst = [...risks].sort((a, b) => RISK_LEVELS[a.level].order - RISK_LEVELS[b.level].order)[0];
    const group = svgEl("g", { class: `map-lantern tone-${RISK_LEVELS[worst.level].tone}`, transform: `translate(${shape.cx} ${shape.cy})` });
    group.dataset.id = id;
    group.append(
      svgEl("circle", { r: "16", class: "lantern-glow" }),
      svgEl("circle", { r: "9.5", class: "lantern-core" }),
      svgEl("path", { d: "M-3.5 -5h7M0 -5v1.6M-4 -3h8l.8 1.6v6l-.8 1.6h-8l-.8-1.6v-6z", class: "lantern-frame" }),
      svgEl("path", { d: "M0 -1.4c1.2 1.2 1.5 2.2 1.1 3.1a1.2 1.2 0 0 1-2.2 0c-.4-.9 0-1.9 1.1-3.1Z", class: "lantern-flame" }),
    );
    const badge = svgEl("g", { class: "lantern-count", transform: "translate(8 -8)" });
    badge.append(svgEl("circle", { r: "5.2" }));
    const n = svgEl("text", { "text-anchor": "middle", y: "2.3", "font-size": "6.5" });
    n.textContent = String(risks.length);
    badge.append(n);
    group.append(badge);
    layer.append(group);
  }
  svg.append(layer);
  return layer;
}

// foto untuk isi provinsi: rumah adat dulu, lalu foto budaya lain, terakhir foto utama provinsi
export function fillPhotoOf(id) {
  const culture = CULTURE_PHOTOS[id] || {};
  const photo = culture.rumah || culture.pakaian || culture.tari || culture.musik || PROVINCE_PHOTOS[id];
  const label = culture.rumah ? "Rumah adat" : photo === PROVINCE_PHOTOS[id] ? "Foto provinsi" : "Budaya";
  return { ...photo, label };
}

const svgEl = (tag, attrs = {}) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};

function landGradient(defs) {
  const gradient = svgEl("linearGradient", { id: "land", x1: "0", y1: "0", x2: "0.4", y2: "1" });
  gradient.append(
    svgEl("stop", { offset: "0", "stop-color": "#a8d08d" }),
    svgEl("stop", { offset: "0.55", "stop-color": "#7fb069" }),
    svgEl("stop", { offset: "1", "stop-color": "#5e9150" }),
  );
  defs.append(gradient);
}

function figuresLayer(svg, shapesById) {
  const layer = svgEl("g", { class: "map-figures", "aria-hidden": "true" });
  for (const [id, [fx, fy]] of Object.entries(FIGURE_FEET)) {
    const shape = shapesById.get(id);
    if (!shape) continue;
    const group = svgEl("g", { class: "map-figure" });
    group.dataset.id = id;
    if (Math.hypot(fx - shape.cx, fy - shape.cy) > LEADER_MIN_DISTANCE) {
      group.append(svgEl("line", { x1: String(fx), y1: String(fy), x2: String(shape.cx), y2: String(shape.cy), class: "map-leader" }));
      group.append(svgEl("circle", { cx: String(shape.cx), cy: String(shape.cy), r: "1.6", class: "map-pin" }));
    }
    const art = svgEl("svg", { x: String(fx - FIGURE_WIDTH / 2), y: String(fy - FIGURE_HEIGHT), width: String(FIGURE_WIDTH), height: String(FIGURE_HEIGHT), viewBox: "0 -10 88 122" });
    art.innerHTML = coupleMarkup(id); // markup buatan sendiri dari data tetap, bukan input pengguna
    group.append(art);
    const text = MAP_LABELS[id] || shape.name;
    const halfWidth = (text.length * LABEL_FONT * LABEL_CHAR_WIDTH) / 2;
    const [, , mapWidth] = MAP_VIEWBOX.split(" ").map(Number);
    const labelX = Math.min(Math.max(fx, halfWidth + 2), mapWidth - halfWidth - 2);
    const label = svgEl("text", { x: String(labelX), y: String(fy + LABEL_GAP), class: "map-label", "text-anchor": "middle", "font-size": String(LABEL_FONT) });
    label.textContent = text;
    group.append(label);
    layer.append(group);
  }
  svg.append(layer);
  return layer;
}

/**
 * @param {HTMLElement} container
 * @param {{ current?: string, visited?: Set<string>, label?: string, figures?: boolean, onSelect?: (id: string) => void,
 *   onActivate?: (id: string) => void, onHover?: (id: string) => void }} options
 *   onActivate: bila diisi, klik pada provinsi/figur memanggilnya (tidak pindah halaman lewat link).
 *   onSelect: dipanggil setiap provinsi dipilih. onHover: dipanggil saat kursor/fokus masuk provinsi.
 */
export function renderMap(container, { current = "", visited = new Set(), label = "Peta Indonesia, 38 provinsi", figures = false, onSelect = null, onActivate = null, onHover = null } = {}) {
  const svg = svgEl("svg", { viewBox: MAP_VIEWBOX, class: "map-svg", "aria-label": label, role: "group" });
  if (current) svg.classList.add("has-current");
  const defs = svgEl("defs");
  landGradient(defs);
  svg.append(defs);

  const links = new Map();
  const shapesById = new Map();
  for (const shape of PROVINCE_SHAPES) {
    shapesById.set(shape.id, shape);
    const data = dataById.get(shape.id);
    const region = regionById.get(data?.region);
    const link = svgEl("a", { href: provinceUrl(shape.id), class: "map-prov", "aria-label": `${data?.name ?? shape.name}, ${region?.name ?? ""}` });
    link.dataset.id = shape.id;
    link.dataset.region = data?.region ?? "";
    if (visited.has(shape.id)) link.classList.add("is-visited");
    if (risksByProvince.has(shape.id)) link.classList.add("has-risk");

    // foto dipotong mengikuti bentuk provinsi lewat clipPath (lebih andal daripada <pattern> di Chrome
    // saat fotonya baru dimuat setelah peta tampil)
    const clip = svgEl("clipPath", { id: `clip-${shape.id}` });
    clip.append(svgEl("path", { d: shape.d }));
    defs.append(clip);
    const image = svgEl("image", { class: "prov-photo", preserveAspectRatio: "xMidYMid slice", "clip-path": `url(#clip-${shape.id})` });
    // isi lewat style inline supaya tidak tertimpa aturan warna CSS lama
    const landPath = svgEl("path", { d: shape.d, class: "prov-land", style: "fill:url(#land)" });
    const outline = svgEl("path", { d: shape.d, class: "prov-outline", style: "fill:none" });
    link.append(image, landPath, outline);
    svg.append(link);
    links.set(shape.id, { link, shape, image, landPath });
  }
  const figureLayer = figures ? figuresLayer(svg, shapesById) : null;
  const lanterns = figures ? lanternLayer(svg, shapesById) : null;

  const tip = document.createElement("div");
  tip.className = "map-tip";
  tip.hidden = true;
  container.replaceChildren(svg, tip);

  // foto menutupi kotak batas tiap provinsi, lalu dipotong clipPath mengikuti bentuknya
  for (const { image, landPath } of links.values()) {
    const box = landPath.getBBox();
    image.setAttribute("x", String(box.x));
    image.setAttribute("y", String(box.y));
    image.setAttribute("width", String(Math.max(box.width, 1)));
    image.setAttribute("height", String(Math.max(box.height, 1)));
  }

  const loadPhoto = (id) => {
    const entry = links.get(id);
    if (entry && !entry.image.getAttribute("href")) entry.image.setAttribute("href", wikimediaSized(fillPhotoOf(id).src, FILL_IMAGE_WIDTH));
  };

  let selected = "";
  function select(id) {
    if (!links.has(id)) return;
    if (selected) links.get(selected).link.classList.remove("is-selected");
    selected = id;
    loadPhoto(id);
    const { link } = links.get(id);
    link.classList.add("is-selected");
    svg.append(link); // provinsi terpilih digambar paling atas supaya garis tepinya utuh
    if (figureLayer) {
      svg.append(figureLayer);
      for (const fig of figureLayer.children) fig.classList.toggle("is-selected", fig.dataset.id === id);
    }
    onSelect?.(id);
  }

  if (current) {
    const entry = links.get(current);
    if (entry) {
      entry.link.classList.add("is-current", "is-selected");
      entry.link.setAttribute("aria-current", "page");
      loadPhoto(current);
      svg.append(entry.link);
    }
  }

  if (onSelect || onActivate) {
    svg.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return; // buka di tab baru tetap boleh
      const link = e.target.closest?.(".map-prov");
      const fig = e.target.closest?.(".map-figure") || e.target.closest?.(".map-lantern");
      const id = link?.dataset.id || fig?.dataset.id;
      if (!id) return;
      if (onActivate) { e.preventDefault(); onActivate(id); return; }
      if (id === selected && link) return; // klik kedua: biarkan link membuka halaman provinsi
      e.preventDefault();
      select(id);
    });
  }

  const showTip = (id) => {
    const entry = links.get(id);
    const data = dataById.get(id);
    if (!entry || !data) return;
    const photo = fillPhotoOf(id);
    const img = document.createElement("img");
    img.src = wikimediaSized(photo.src, CARD_IMAGE_WIDTH);
    img.alt = "";
    const body = document.createElement("div");
    const kicker = document.createElement("small");
    kicker.textContent = regionById.get(data.region)?.name ?? "";
    const name = document.createElement("b");
    name.textContent = data.name;
    const sub = document.createElement("span");
    const risks = risksByProvince.get(id) || [];
    sub.textContent = svg.classList.contains("is-lentera")
      ? (risks.length ? `${risks.length} budaya memudar: ${risks.slice(0, 3).map((r) => r.name).join(", ")}${risks.length > 3 ? ", ..." : ""}` : "Belum ada catatan dari sumber kami")
      : onActivate ? "Klik untuk masuk ke provinsinya" : onSelect ? (id === selected ? "Klik lagi untuk membuka kisahnya" : "Klik untuk melihat budayanya") : (data.wastra[0]?.name ?? "");
    body.append(kicker, name, sub);
    tip.replaceChildren(img, body);
    const [, , vbWidth, vbHeight] = MAP_VIEWBOX.split(" ").map(Number);
    const box = svg.getBoundingClientRect();
    const host = container.getBoundingClientRect();
    const x = box.left - host.left + (entry.shape.cx / vbWidth) * box.width;
    tip.style.left = `${Math.min(Math.max(x, 120), host.width - 120)}px`;
    tip.style.top = `${box.top - host.top + (entry.shape.cy / vbHeight) * box.height}px`;
    tip.hidden = false;
  };
  const hideTip = () => { tip.hidden = true; };

  svg.addEventListener("pointerover", (e) => {
    const link = e.target.closest?.(".map-prov");
    const fig = e.target.closest?.(".map-figure") || e.target.closest?.(".map-lantern");
    if (link) showTip(link.dataset.id);
    else if (fig?.classList.contains("map-lantern")) showTip(fig.dataset.id);
    const id = link?.dataset.id || fig?.dataset.id;
    if (id) onHover?.(id);
  });
  svg.addEventListener("pointerleave", hideTip);
  svg.addEventListener("focusin", (e) => {
    const link = e.target.closest?.(".map-prov");
    if (link) { showTip(link.dataset.id); onHover?.(link.dataset.id); }
  });
  svg.addEventListener("focusout", hideTip);

  // ---- Zoom: viewBox dianimasikan dari seluruh Indonesia ke kotak provinsi (rasio peta dipertahankan)
  const [baseX, baseY, baseW, baseH] = MAP_VIEWBOX.split(" ").map(Number);
  let viewBox = [baseX, baseY, baseW, baseH];
  let zoomFrame = 0;
  const applyViewBox = (vb) => { viewBox = vb; svg.setAttribute("viewBox", vb.map((n) => n.toFixed(2)).join(" ")); };
  function animateViewBox(target, duration) {
    cancelAnimationFrame(zoomFrame);
    if (reduceMotion() || duration <= 0) { applyViewBox(target); return Promise.resolve(); }
    const from = [...viewBox];
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const k = easeInOut(t);
        applyViewBox(from.map((v, i) => v + (target[i] - v) * k));
        if (t < 1) zoomFrame = requestAnimationFrame(step);
        else resolve();
      };
      zoomFrame = requestAnimationFrame(step);
    });
  }
  function boxFor(id) {
    const box = links.get(id).landPath.getBBox();
    const ratio = baseW / baseH;
    let w = box.width * (1 + ZOOM_PADDING * 2);
    let h = box.height * (1 + ZOOM_PADDING * 2);
    if (w / h > ratio) h = w / ratio; else w = h * ratio;
    const minW = 110; // provinsi kecil (DKI, DIY) jangan diperbesar berlebihan
    if (w < minW) { w = minW; h = minW / ratio; }
    return [box.x + box.width / 2 - w / 2, box.y + box.height / 2 - h / 2, w, h];
  }

  return {
    select,
    /** Perbesar peta ke satu provinsi. Selesai saat animasi selesai. */
    hideTip,
    /** Nyalakan/matikan Mode Lentera. */
    setLentera(isOn) {
      svg.classList.toggle("is-lentera", isOn);
      if (lanterns) svg.append(lanterns);
    },
    isLentera: () => svg.classList.contains("is-lentera"),
    zoomTo(id, duration = ZOOM_MS) {
      if (!links.has(id)) return Promise.resolve();
      hideTip();
      select(id);
      svg.classList.add("is-zooming");
      return animateViewBox(boxFor(id), duration);
    },
    /** Kembalikan peta ke seluruh Indonesia. */
    resetZoom(duration = ZOOM_MS * 0.8) {
      svg.classList.remove("is-zooming");
      return animateViewBox([baseX, baseY, baseW, baseH], duration);
    },
    /** Dipertahankan untuk kompatibilitas: foto kini dimuat saat provinsi dipilih. */
    loadImages() {},
    /** Sorot satu wilayah (pulau besar); string kosong = semua */
    setRegion(regionId) {
      svg.classList.toggle("has-filter", Boolean(regionId));
      for (const { link } of links.values()) link.classList.toggle("is-dim", Boolean(regionId) && link.dataset.region !== regionId);
      if (figureLayer) for (const fig of figureLayer.children) fig.classList.toggle("is-dim", Boolean(regionId) && dataById.get(fig.dataset.id)?.region !== regionId);
    },
  };
}
