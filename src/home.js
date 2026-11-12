// Beranda: hero foto, peta provinsi, daftar per wilayah, kartu jelajah wastra, dan paspor.

import { PROVINCE_PHOTOS } from "./content/province-photos.js";
import { PROVINCES, REGIONS, SOURCES, provinceById } from "./content/provinces.js";
import { WASTRA_CATALOG, wikimediaSized } from "./content/wastra-catalog.js";
import { provinceUrl, renderMap } from "./map.js";
import { clearPassport, formatStampDate, readPassport } from "./paspor.js";

const HERO_PROVINCE = "jawa-tengah";
const HERO_LIST = ["sumatera-barat", "daerah-istimewa-yogyakarta", "bali", "kalimantan-selatan", "sulawesi-selatan"];
const HERO_THUMBS = ["bali", "sumatera-utara", "nusa-tenggara-timur", "papua-pegunungan"];
const THUMB_WIDTH = 500;
const HERO_WIDTH = 1920;

const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

export const photoCredit = (photo) => `Foto: ${photo.artist} · ${photo.license}`;

function creditLink(photo, prefix = "") {
  const link = el("a", { href: photo.page, rel: "noopener", textContent: `${prefix}${photo.artist} · ${photo.license}` });
  return link;
}

function renderHero() {
  const photo = PROVINCE_PHOTOS[HERO_PROVINCE];
  const bg = document.getElementById("heroBg");
  bg.src = wikimediaSized(photo.src, HERO_WIDTH);
  bg.alt = "";

  document.getElementById("heroList").replaceChildren(...HERO_LIST.map((id) => {
    const p = provinceById(id);
    return el("li", {}, [el("a", { href: provinceUrl(id) }, [el("b", { textContent: p.name }), el("small", { textContent: p.wastra.map((x) => x.name).join(" · ") })])]);
  }));

  const strip = document.getElementById("heroStrip");
  const credit = document.getElementById("heroCredit");
  for (const id of HERO_THUMBS) {
    const p = provinceById(id);
    const ph = PROVINCE_PHOTOS[id];
    const img = el("img", { src: wikimediaSized(ph.src, THUMB_WIDTH), alt: "", loading: "lazy" });
    const link = el("a", { className: "thumb", href: provinceUrl(id), title: photoCredit(ph) }, [img, el("span", { textContent: p.name })]);
    strip.insertBefore(link, credit);
  }
  credit.replaceChildren(`Latar: Borobudur, Jawa Tengah. `, creditLink(photo, "Foto "), ". Foto kecil: lihat halaman provinsinya.");
}

function renderMapSection(passport) {
  const visited = new Set([...Object.keys(passport.visited), ...Object.keys(passport.tried)]);
  const map = renderMap(document.getElementById("map"), { visited });

  const chips = document.getElementById("regionChips");
  const params = new URLSearchParams(location.search);
  let activeRegion = REGIONS.some((r) => r.id === params.get("wilayah")) ? params.get("wilayah") : "";
  const buttons = [{ id: "", name: "Semua" }, ...REGIONS].map((r) => {
    const b = el("button", { type: "button", textContent: r.name });
    b.dataset.region = r.id;
    return b;
  });
  const sync = () => {
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.region === activeRegion));
    map.setRegion(activeRegion);
  };
  chips.replaceChildren(...buttons);
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    activeRegion = b.dataset.region;
    sync();
  });
  sync();

  // daftar teks per wilayah: cara cepat ke provinsi kecil (DKI, DIY, Bali) dan untuk pembaca layar
  document.getElementById("provIndex").replaceChildren(...REGIONS.map((r) => {
    const items = PROVINCES.filter((p) => p.region === r.id).map((p) => {
      const a = el("a", { href: provinceUrl(p.id), textContent: p.name });
      if (visited.has(p.id)) a.classList.add("is-visited");
      return el("li", {}, [a]);
    });
    return el("div", {}, [el("h3", { textContent: r.name }), el("ul", {}, items)]);
  }));

  document.getElementById("footRegions").replaceChildren(...REGIONS.slice(0, 7).map((r) => el("li", {}, [el("a", { href: `/?wilayah=${r.id}#peta`, textContent: r.name })])));
}

function renderWastraGrid() {
  document.getElementById("wastraGrid").replaceChildren(...WASTRA_CATALOG.map((g) => {
    const province = g.province && provinceById(g.province);
    const origin = province
      ? el("a", { className: "origin", href: provinceUrl(province.id), textContent: `Asal: ${province.name} →` })
      : el("span", { className: "origin", textContent: "Batik kontemporer" });
    const credit = el("p", { className: "credit" }, ["Foto: ", el("a", { href: g.credit.page, rel: "noopener", textContent: `${g.credit.artist} · ${g.credit.license}` })]);
    const tryLink = el("a", { className: "pill pill-sogan", href: `/?coba=${g.id}#cermin`, textContent: "Coba di cermin" });
    tryLink.dataset.coba = g.id;
    return el("article", { className: "wcard" }, [
      el("div", { className: "wcard-img" }, [el("img", { src: g.src, alt: g.name, loading: "lazy" }), el("span", { className: "chip", textContent: g.experimental ? `${g.tag} · EKSPERIMEN` : g.tag })]),
      el("div", { className: "wcard-body" }, [el("h3", { textContent: g.name }), origin, el("p", { textContent: g.about }), credit, tryLink]),
    ]);
  }));
}

export function renderPassport() {
  const passport = readPassport();
  const stamped = new Set([...Object.keys(passport.visited), ...Object.keys(passport.tried)]);
  document.getElementById("pasporCount").replaceChildren(`${stamped.size} `, el("small", { textContent: `/ ${PROVINCES.length}` }));
  document.getElementById("pasporBar").style.width = `${(stamped.size / PROVINCES.length) * 100}%`;
  document.getElementById("pasporTried").textContent = `${Object.keys(passport.tried).length} provinsi sudah dicoba di cermin`;
  document.getElementById("stamps").replaceChildren(...PROVINCES.map((p) => {
    const visitedAt = passport.visited[p.id];
    const triedAt = passport.tried[p.id];
    const li = el("li", { className: "stamp" });
    if (visitedAt || triedAt) li.classList.add("is-on");
    if (triedAt) li.classList.add("is-tried");
    const status = triedAt ? `Dicoba ${formatStampDate(triedAt)}` : visitedAt ? `Dikunjungi ${formatStampDate(visitedAt)}` : "Belum ada cap";
    li.append(el("a", { href: provinceUrl(p.id) }, [p.name, el("small", { textContent: status })]));
    return li;
  }));
}

function renderSources() {
  document.getElementById("sourceList").replaceChildren(...Object.values(SOURCES).map((s) => el("li", {}, [el("a", { href: s.url, rel: "noopener", textContent: s.label })])));
}

export function initHome() {
  const passport = readPassport();
  renderHero();
  renderMapSection(passport);
  renderWastraGrid();
  renderPassport();
  renderSources();
  document.getElementById("pasporReset").addEventListener("click", () => {
    if (!window.confirm("Kosongkan semua cap di paspor? Tidak bisa dibatalkan.")) return;
    clearPassport();
    renderPassport();
    for (const node of document.querySelectorAll(".map-prov.is-visited, .prov-index a.is-visited")) node.classList.remove("is-visited");
  });
}
