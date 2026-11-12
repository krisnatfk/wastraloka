// Peta interaktif 38 provinsi. Tiap provinsi adalah <a> di dalam SVG, jadi bisa diklik,
// di-Tab dengan keyboard, dan dibuka di tab baru seperti link biasa.

import { MAP_VIEWBOX, PROVINCE_SHAPES } from "./content/indonesia-map.js";
import { PROVINCES, REGIONS } from "./content/provinces.js";

const SVG_NS = "http://www.w3.org/2000/svg";
export const provinceUrl = (id) => `/provinsi/?p=${encodeURIComponent(id)}`;

const dataById = new Map(PROVINCES.map((p) => [p.id, p]));
const regionName = (id) => REGIONS.find((r) => r.id === id)?.name ?? "";

/**
 * @param {HTMLElement} container
 * @param {{ current?: string, visited?: Set<string>, label?: string }} options
 */
export function renderMap(container, { current = "", visited = new Set(), label = "Peta Indonesia, 38 provinsi" } = {}) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", MAP_VIEWBOX);
  svg.setAttribute("class", "map-svg");
  svg.setAttribute("aria-label", label);
  svg.setAttribute("role", "group");

  const links = new Map();
  for (const shape of PROVINCE_SHAPES) {
    const data = dataById.get(shape.id);
    const link = document.createElementNS(SVG_NS, "a");
    link.setAttribute("href", provinceUrl(shape.id));
    link.setAttribute("class", "map-prov");
    link.setAttribute("aria-label", `${data?.name ?? shape.name}, ${regionName(data?.region)}`);
    link.dataset.id = shape.id;
    link.dataset.region = data?.region ?? "";
    if (shape.id === current) { link.classList.add("is-current"); link.setAttribute("aria-current", "page"); }
    if (visited.has(shape.id)) link.classList.add("is-visited");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", shape.d);
    link.append(path);
    svg.append(link);
    links.set(shape.id, { link, shape });
  }

  const tip = document.createElement("div");
  tip.className = "map-tip";
  tip.hidden = true;
  container.replaceChildren(svg, tip);

  const showTip = (id) => {
    const entry = links.get(id);
    const data = dataById.get(id);
    if (!entry || !data) return;
    tip.replaceChildren();
    const name = document.createElement("b");
    name.textContent = data.name;
    const sub = document.createElement("span");
    sub.textContent = data.wastra.map((x) => x.name).slice(0, 2).join(" · ");
    tip.append(name, sub);
    // posisi tooltip mengikuti titik tengah provinsi, dihitung relatif ke ukuran peta yang tampil
    const [, , vbWidth, vbHeight] = MAP_VIEWBOX.split(" ").map(Number);
    const box = svg.getBoundingClientRect();
    const host = container.getBoundingClientRect();
    tip.style.left = `${box.left - host.left + (entry.shape.cx / vbWidth) * box.width}px`;
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
    /** Sorot satu wilayah (pulau besar); string kosong = semua */
    setRegion(regionId) {
      svg.classList.toggle("has-filter", Boolean(regionId));
      for (const { link } of links.values()) link.classList.toggle("is-dim", Boolean(regionId) && link.dataset.region !== regionId);
    },
  };
}
