// Peta interaktif 38 provinsi. Tiap provinsi diisi foto rumah adatnya (dipotong mengikuti bentuk provinsi)
// lalu diberi gradasi warna wilayah di atasnya. Provinsi adalah <a> di dalam SVG: bisa diklik, di-Tab,
// dan dibuka di tab baru seperti link biasa.

import { CULTURE_PHOTOS } from "./content/culture-photos.js";
import { MAP_VIEWBOX, PROVINCE_SHAPES } from "./content/indonesia-map.js";
import { PROVINCE_PHOTOS } from "./content/province-photos.js";
import { PROVINCES, REGIONS } from "./content/provinces.js";
import { wikimediaSized } from "./content/wastra-catalog.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const FILL_IMAGE_WIDTH = 330;
const CARD_IMAGE_WIDTH = 330;
export const provinceUrl = (id) => `/provinsi/?p=${encodeURIComponent(id)}`;

const dataById = new Map(PROVINCES.map((p) => [p.id, p]));
const regionById = new Map(REGIONS.map((r) => [r.id, r]));

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

function regionGradients(defs) {
  for (const region of REGIONS) {
    const gradient = svgEl("linearGradient", { id: `tint-${region.id}`, x1: "0", y1: "0", x2: "1", y2: "1" });
    gradient.append(
      svgEl("stop", { offset: "0", "stop-color": region.accent, "stop-opacity": "0.92" }),
      svgEl("stop", { offset: "0.55", "stop-color": region.accent, "stop-opacity": "0.55" }),
      svgEl("stop", { offset: "1", "stop-color": "#e8c77a", "stop-opacity": "0.35" }),
    );
    defs.append(gradient);
  }
}

/**
 * @param {HTMLElement} container
 * @param {{ current?: string, visited?: Set<string>, label?: string, loadImages?: boolean }} options
 */
export function renderMap(container, { current = "", visited = new Set(), label = "Peta Indonesia, 38 provinsi" } = {}) {
  const svg = svgEl("svg", { viewBox: MAP_VIEWBOX, class: "map-svg", "aria-label": label, role: "group" });
  if (current) svg.classList.add("has-current");
  const defs = svgEl("defs");
  regionGradients(defs);
  svg.append(defs);

  const links = new Map();
  for (const shape of PROVINCE_SHAPES) {
    const data = dataById.get(shape.id);
    const region = regionById.get(data?.region);
    const link = svgEl("a", { href: provinceUrl(shape.id), class: "map-prov", "aria-label": `${data?.name ?? shape.name}, ${region?.name ?? ""}` });
    link.dataset.id = shape.id;
    link.dataset.region = data?.region ?? "";
    if (shape.id === current) { link.classList.add("is-current"); link.setAttribute("aria-current", "page"); }
    if (visited.has(shape.id)) link.classList.add("is-visited");

    const pattern = svgEl("pattern", { id: `fill-${shape.id}`, patternUnits: "userSpaceOnUse" });
    const image = svgEl("image", { preserveAspectRatio: "xMidYMid slice" });
    pattern.append(image);
    defs.append(pattern);

    // isi lewat style inline supaya tidak tertimpa aturan warna CSS lama
    const photoPath = svgEl("path", { d: shape.d, class: "prov-photo", style: `fill:url(#fill-${shape.id})` });
    const tintPath = svgEl("path", { d: shape.d, class: "prov-tint", style: `fill:url(#tint-${data?.region})` });
    link.append(photoPath, tintPath);
    svg.append(link);
    links.set(shape.id, { link, shape, pattern, image, photoPath });
  }

  const tip = document.createElement("div");
  tip.className = "map-tip";
  tip.hidden = true;
  container.replaceChildren(svg, tip);

  // ukuran pola = kotak batas tiap provinsi, supaya foto memenuhi bentuknya tanpa gepeng
  for (const { pattern, image, photoPath } of links.values()) {
    const box = photoPath.getBBox();
    const size = { x: box.x, y: box.y, width: Math.max(box.width, 1), height: Math.max(box.height, 1) };
    for (const [k, v] of Object.entries(size)) pattern.setAttribute(k, String(v));
    // isi pola dihitung dari pojok kiri atas pola, jadi foto mulai di 0,0
    image.setAttribute("width", String(size.width));
    image.setAttribute("height", String(size.height));
  }

  let imagesLoaded = false;
  const loadImages = () => {
    if (imagesLoaded) return;
    imagesLoaded = true;
    for (const [id, { image }] of links) image.setAttribute("href", wikimediaSized(fillPhotoOf(id).src, FILL_IMAGE_WIDTH));
  };

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
    sub.textContent = `${data.rumah ? `Rumah ${data.rumah.replace(/^Rumah /, "")} · ` : ""}${data.wastra[0]?.name ?? ""}`;
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
    if (link) showTip(link.dataset.id);
  });
  svg.addEventListener("pointerleave", hideTip);
  svg.addEventListener("focusin", (e) => {
    const link = e.target.closest?.(".map-prov");
    if (link) showTip(link.dataset.id);
  });
  svg.addEventListener("focusout", hideTip);

  return {
    loadImages,
    /** Sorot satu wilayah (pulau besar); string kosong = semua */
    setRegion(regionId) {
      svg.classList.toggle("has-filter", Boolean(regionId));
      for (const { link } of links.values()) link.classList.toggle("is-dim", Boolean(regionId) && link.dataset.region !== regionId);
    },
  };
}
