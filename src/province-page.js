// Halaman khusus provinsi: /provinsi/?p=<id>. Warna aksen, foto, isi, dan peta mini menyesuaikan provinsinya.

import { PROVINCE_PHOTOS } from "./content/province-photos.js";
import { PROVINCES, REGIONS, SOURCES, provinceById, regionOf } from "./content/provinces.js";
import { catalogForProvince, wikimediaSized } from "./content/wastra-catalog.js";
import { provinceUrl, renderMap } from "./map.js";
import { readPassport, stampVisited } from "./paspor.js";
import { initSiteNav } from "./site-nav.js";

const HERO_WIDTH = 1920;

const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};
const sourceLink = (key) => el("a", { href: SOURCES[key].url, rel: "noopener", textContent: SOURCES[key].label });

function hero(province, photo, region) {
  const img = el("img", { className: "hero-bg", src: wikimediaSized(photo.src, HERO_WIDTH), alt: photo.desc ? `Foto ${province.name}: ${photo.desc}` : `Foto ${province.name}`, fetchPriority: "high" });
  const crumbs = el("ol", { className: "crumbs" }, [
    el("li", {}, [el("a", { href: "/#peta", textContent: "Peta" })]),
    el("li", {}, [el("a", { href: `/?wilayah=${region.id}#peta`, textContent: region.name })]),
    el("li", { textContent: province.name }),
  ]);
  crumbs.setAttribute("aria-label", "Lokasi halaman");
  const credit = el("p", { className: "photo-credit" }, ["Foto: ", el("a", { href: photo.page, rel: "noopener", textContent: `${photo.artist} · ${photo.license}` }), " · Wikimedia Commons"]);
  return el("header", { className: "prov-hero" }, [
    img,
    el("div", { className: "prov-hero-inner" }, [
      el("div", {}, [
        crumbs,
        el("h1", { textContent: province.name }),
        el("div", { className: "prov-meta" }, [el("span", { className: "region", textContent: region.name }), el("span", { textContent: `Ibu kota: ${province.capital}` }), el("span", { textContent: `${province.wastra.length} wastra tercatat` })]),
      ]),
      credit,
    ]),
  ]);
}

function wastraFact(province) {
  const items = province.wastra.map((w) => {
    const title = el("b", { textContent: w.name });
    const li = el("li", {}, [title]);
    if (!w.verified) title.after(el("span", { className: "verify", textContent: "perlu verifikasi" }));
    if (w.note) li.append(el("p", { textContent: w.note }));
    return li;
  });
  return el("article", { className: "fact fact-wastra" }, [
    el("div", {}, [el("small", { textContent: "Wastra" }), el("h3", { textContent: `Kain khas ${province.name}` }), el("p", { textContent: "Wastra adalah kain tradisional Nusantara: batik, tenun, songket, ikat, sulam, dan anyaman." })]),
    el("ul", { className: "wastra-list" }, items),
  ]);
}

function simpleFact(label, value, sourceKey, missingText) {
  const body = value ? el("h3", { textContent: value }) : el("h3", { className: "missing", textContent: missingText });
  return el("article", { className: "fact" }, [el("small", { textContent: label }), body, el("span", { className: "src" }, ["Sumber: ", sourceLink(sourceKey)])]);
}

function tryBox(province) {
  const [garment] = catalogForProvince(province.id);
  if (!garment) {
    return el("section", { className: "try-box no-image", ariaLabel: "Coba di cermin" }, [
      el("div", {}, [el("h2", { textContent: `Belum ada contoh wastra ${province.name} di katalog.` }), el("p", { textContent: "Punya kemeja atau kain dari daerah ini? Upload fotonya di cermin dan coba langsung. Perajin juga bisa mendaftarkan produknya." })]),
      el("a", { className: "pill pill-gold", href: "/#cermin", textContent: "Upload di cermin" }),
    ]);
  }
  return el("section", { className: "try-box", ariaLabel: "Coba di cermin" }, [
    el("img", { src: garment.src, alt: garment.name }),
    el("div", {}, [el("h2", { textContent: `Coba ${garment.name}` }), el("p", { textContent: garment.about })]),
    el("a", { className: "pill pill-gold", href: `/?coba=${garment.id}#cermin`, textContent: "Coba di cermin" }),
  ]);
}

function mapAndStamp(province, region, isNewStamp) {
  const passport = readPassport();
  const visited = new Set([...Object.keys(passport.visited), ...Object.keys(passport.tried)]);
  const mapHost = el("div", { className: "map-wrap" });
  const siblings = PROVINCES.filter((p) => p.region === region.id).map((p) => {
    const a = el("a", { href: provinceUrl(p.id), textContent: p.name });
    if (p.id === province.id) a.setAttribute("aria-current", "page");
    return el("li", {}, [a]);
  });
  const mapCard = el("section", { className: "map-card", ariaLabel: "Peta lokasi" }, [mapHost, el("ul", { className: "siblings", ariaLabel: `Provinsi lain di ${region.name}` }, siblings)]);
  renderMap(mapHost, { current: province.id, visited, label: `Peta Indonesia, ${province.name} disorot` });

  const visitedCount = visited.size;
  const stamp = el("section", { className: "stamp-card", ariaLabel: "Paspor wastra" }, [
    el("div", { className: "stamp-mark" }, [el("span", {}, [el("small", { textContent: "Paspor Wastra" }), province.name])]),
    el("p", { textContent: isNewStamp ? "Cap kunjungan baru masuk paspormu." : "Cap kunjungan sudah ada di paspormu." }),
    el("p", {}, [`${visitedCount} dari ${PROVINCES.length} provinsi. `, el("a", { href: "/#paspor", textContent: "Buka paspor" })]),
  ]);
  return el("div", { className: "prov-grid" }, [mapCard, stamp]);
}

function pager(province) {
  const index = PROVINCES.findIndex((p) => p.id === province.id);
  const prev = PROVINCES[(index - 1 + PROVINCES.length) % PROVINCES.length];
  const next = PROVINCES[(index + 1) % PROVINCES.length];
  return el("nav", { className: "pager", ariaLabel: "Provinsi sebelum dan sesudahnya" }, [
    el("a", { href: provinceUrl(prev.id) }, [el("small", { textContent: "← Sebelumnya" }), el("b", { textContent: prev.name })]),
    el("a", { href: provinceUrl(next.id) }, [el("small", { textContent: "Berikutnya →" }), el("b", { textContent: next.name })]),
  ]);
}

function renderProvince(province) {
  const region = regionOf(province);
  const photo = PROVINCE_PHOTOS[province.id];
  const isNewStamp = stampVisited(province.id);

  document.documentElement.style.setProperty("--accent", region.accent);
  document.title = `${province.name} · Cermin Wastra`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", `Wastra ${province.name}: ${province.wastra.map((w) => w.name).join(", ")}. Pakaian adat, rumah adat, tarian, lalu coba wastranya di cermin AI.`);

  const facts = el("div", { className: "facts" }, [
    wastraFact(province),
    simpleFact("Pakaian adat", province.pakaian, "pakaian", "Belum tercatat"),
    simpleFact("Rumah adat", province.rumah, "rumah", "Belum tercatat"),
    simpleFact("Tarian", province.tarian, "tarian", "Belum terverifikasi"),
  ]);
  const notes = [];
  if (province.note) notes.push(el("p", { className: "honest", textContent: province.note }));
  notes.push(el("p", { className: "honest", textContent: "Ringkasan dari sumber publik dan masih dikurasi. Satu daerah bisa punya banyak suku dan kain; yang tercantum di sini belum lengkap." }));

  const main = el("main", { id: "isi" }, [el("section", {}, [facts, tryBox(province), mapAndStamp(province, region, isNewStamp), pager(province), ...notes])]);
  document.getElementById("page").replaceChildren(hero(province, photo, region), main);
}

function renderNotFound(requested) {
  document.title = "Provinsi tidak ditemukan · Cermin Wastra";
  const list = el("div", { className: "prov-index" }, REGIONS.map((r) => el("div", {}, [
    el("h3", { textContent: r.name }),
    el("ul", {}, PROVINCES.filter((p) => p.region === r.id).map((p) => el("li", {}, [el("a", { href: provinceUrl(p.id), textContent: p.name })]))),
  ])));
  document.getElementById("page").replaceChildren(el("main", { id: "isi", className: "notfound" }, [
    el("h1", { textContent: "Provinsi tidak ditemukan" }),
    el("p", { textContent: requested ? `Tidak ada provinsi dengan kode "${requested}". Pilih dari daftar di bawah.` : "Pilih provinsi dari daftar di bawah atau dari peta." }),
    list,
  ]));
  document.querySelector(".notfound").style.maxWidth = "1000px";
}

const requested = new URLSearchParams(location.search).get("p") || "";
const province = provinceById(requested);
if (province) renderProvince(province);
else renderNotFound(requested);
initSiteNav({ nav: document.getElementById("siteNav"), sentinel: document.getElementById("navSentinel") });
