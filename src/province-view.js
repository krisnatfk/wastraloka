// Tampilan kisah satu provinsi: sejarah, wastra, rumah adat, tari, musik, busana, senjata, kuliner,
// belanja & sentra, lalu peta. Dipakai halaman /provinsi/?p=<id> dan tampilan dalam-halaman di beranda
// (setelah animasi zoom peta), jadi semua pencarian elemen dibatasi pada root-nya sendiri.

import { CULTURE_KINDS, CULTURE_PHOTOS } from "./content/culture-photos.js";
import { FOODS, FOOD_SOURCE, MUSIC, MUSIC_SOURCE, SENTRA, WEAPONS, WEAPON_SOURCE, shopSearches } from "./content/culture.js";
import { HISTORY, historySource } from "./content/history.js";
import { PROVINCE_PHOTOS } from "./content/province-photos.js";
import { PROVINCES, SOURCES, regionOf } from "./content/provinces.js";
import { catalogForProvince, wikimediaSized } from "./content/wastra-catalog.js";
import { el } from "./dom.js";
import { coupleSvg } from "./figures.js";
import { provinceUrl, renderMap } from "./map.js";
import { readPassport, stampVisited } from "./paspor.js";
import { sentraCard } from "./sentra.js";

const HERO_WIDTH = 1920;
const CARD_WIDTH = 500;

const link = (source) => el("a", { href: source.url, rel: "noopener", target: "_blank", textContent: source.label });
const sourceNote = (source) => el("p", { className: "src" }, ["Sumber: ", link(source)]);
// "Gadang" -> "Rumah Gadang", tapi "Tari Piring" tidak jadi "Tari Tari Piring"
const withPrefix = (prefix, value, alreadyPrefixed) => (!value ? "" : alreadyPrefixed.test(value) ? value : `${prefix} ${value}`);

const CHAPTERS = [
  ["bab-sejarah", "Sejarah"], ["bab-wastra", "Wastra"], ["bab-budaya", "Rumah · Tari · Musik"], ["bab-busana", "Busana"],
  ["bab-senjata", "Senjata & Kuliner"], ["bab-belanja", "Belanja"], ["bab-lokasi", "Peta"],
];

function chapter(id, number, kicker, title, children) {
  return el("section", { className: "chapter", id }, [
    el("header", { className: "chapter-head" }, [el("span", { className: "chapter-no", textContent: number }), el("div", {}, [el("small", { textContent: kicker }), el("h2", { textContent: title })])]),
    ...children,
  ]);
}

function hero(province, photo, region) {
  const crumbs = el("ol", { className: "crumbs" }, [
    el("li", {}, [el("a", { href: "/#peta", textContent: "Peta" })]),
    el("li", {}, [el("a", { href: `/?wilayah=${region.id}#peta`, textContent: region.name })]),
    el("li", { textContent: province.name }),
  ]);
  crumbs.setAttribute("aria-label", "Lokasi halaman");
  const facts = [
    ["Ibu kota", province.capital], ["Wastra", province.wastra[0]?.name], ["Rumah adat", withPrefix("Rumah", province.rumah, /^(Rumah|Gapura)/)],
    ["Kuliner", FOODS[province.id]],
  ].filter(([, value]) => value);
  return el("header", { className: "prov-hero" }, [
    el("img", { className: "hero-bg is-front", src: wikimediaSized(photo.src, HERO_WIDTH), alt: photo.desc ? `Foto ${province.name}: ${photo.desc}` : `Foto ${province.name}`, fetchPriority: "high" }),
    el("div", { className: "prov-hero-inner" }, [
      el("div", { className: "hero-in", style: "--d:0" }, [
        crumbs,
        el("p", { className: "prov-region", textContent: region.name }),
        el("h1", { textContent: province.name }),
        el("dl", { className: "prov-facts" }, facts.map(([k, v]) => el("div", {}, [el("dt", { textContent: k }), el("dd", { textContent: v })]))),
      ]),
      el("p", { className: "photo-credit" }, ["Foto: ", el("a", { href: photo.page, rel: "noopener", textContent: `${photo.artist} · ${photo.license}` }), " · Wikimedia Commons"]),
    ]),
  ]);
}

function chapterNav() {
  const nav = el("nav", { className: "chapter-nav", ariaLabel: "Bab di halaman ini" }, [
    el("ol", {}, CHAPTERS.map(([id, label], i) => el("li", {}, [el("a", { href: `#${id}` }, [el("span", { textContent: String(i + 1).padStart(2, "0") }), label])]))),
  ]);
  return nav;
}

function historyChapter(province) {
  const items = HISTORY[province.id] || [];
  return chapter("bab-sejarah", "01", "Sejarah singkat", `Jejak ${province.name}`, [
    el("ol", { className: "timeline" }, items.map((item) => el("li", {}, [el("span", { className: "era", textContent: item.era }), el("p", { textContent: item.text })]))),
    sourceNote(historySource(province.name)),
  ]);
}

function wastraChapter(province) {
  const items = province.wastra.map((w) => {
    const title = el("h3", { textContent: w.name });
    if (!w.verified) title.append(el("span", { className: "verify", textContent: "perlu verifikasi" }));
    return el("li", { className: "wastra-item" }, [title, w.note ? el("p", { textContent: w.note }) : null]);
  });
  return chapter("bab-wastra", "02", "Wastra", `Kain khas ${province.name}`, [
    el("p", { className: "chapter-lead", textContent: "Wastra adalah kain tradisional Nusantara: batik, tenun, songket, ikat, sulam, dan anyaman. Tiap helai menyimpan teknik dan cerita daerahnya." }),
    el("ul", { className: "wastra-items" }, items),
    tryBox(province),
  ]);
}

function tryBox(province) {
  const [garment] = catalogForProvince(province.id);
  if (!garment) {
    return el("div", { className: "try-box no-image" }, [
      el("div", {}, [el("h3", { textContent: `Punya wastra ${province.name}?` }), el("p", { textContent: "Upload foto kemeja atau kainnya di cermin dan coba langsung di badanmu." })]),
      el("a", { className: "pill pill-gold", href: "/#cermin", textContent: "Upload di cermin" }),
    ]);
  }
  return el("div", { className: "try-box" }, [
    el("img", { src: garment.src, alt: garment.name }),
    el("div", {}, [el("h3", { textContent: `Coba ${garment.name}` }), el("p", { textContent: garment.about })]),
    el("a", { className: "pill pill-gold", href: `/?coba=${garment.id}#cermin`, textContent: "Coba di cermin" }),
  ]);
}

function cultureCard({ kind, title, list, photo, source }) {
  const figure = photo
    ? el("figure", { className: "ccard-img" }, [
      el("img", { src: wikimediaSized(photo.src, CARD_WIDTH), alt: `${CULTURE_KINDS[kind]}: ${photo.article}`, loading: "lazy" }),
      el("figcaption", {}, [`${photo.article} · `, el("a", { href: photo.page, rel: "noopener", textContent: `${photo.artist}, ${photo.license}` })]),
    ])
    : el("div", { className: "ccard-img" }, [el("div", { className: "ph", textContent: "Foto berlisensi bebas belum kami temukan" })]);
  return el("article", { className: "ccard" }, [
    figure,
    el("div", { className: "ccard-body" }, [
      el("small", { textContent: CULTURE_KINDS[kind] }),
      el("h3", { className: title ? "" : "missing", textContent: title || "Belum terverifikasi" }),
      list || null,
      el("span", { className: "src" }, ["Sumber: ", link(source)]),
    ]),
  ]);
}

function cultureChapter(province) {
  const photos = CULTURE_PHOTOS[province.id] || {};
  const music = MUSIC[province.id] || [];
  const musicList = music.length ? el("ul", {}, music.map((x) => el("li", {}, [el("b", { textContent: x.name }), el("span", { textContent: x.play })]))) : null;
  const grid = el("div", { className: "culture culture-3" }, [
    cultureCard({ kind: "rumah", title: withPrefix("Rumah", province.rumah, /^(Rumah|Gapura)/), photo: photos.rumah, source: SOURCES.rumah }),
    cultureCard({ kind: "tari", title: withPrefix("Tari", province.tarian, /^Tari/), photo: photos.tari, source: SOURCES.tarian }),
    cultureCard({ kind: "musik", title: music[0]?.name || "", list: musicList, photo: photos.musik, source: MUSIC_SOURCE }),
  ]);
  grid.setAttribute("data-reveal-group", "");
  return chapter("bab-budaya", "03", "Rumah adat, tarian & musik", "Ruang, gerak, dan bunyi", [grid]);
}

// ilustrasi pasangan berbusana adat (gambar sederhana buatan sendiri, dari data tetap)
function coupleFigure(province) {
  const box = el("div", { className: "costume-couple" });
  box.innerHTML = coupleSvg(province.id, { label: `Ilustrasi pasangan berbusana adat ${province.name}` });
  return box;
}

function costumeChapter(province) {
  const photo = CULTURE_PHOTOS[province.id]?.pakaian;
  return chapter("bab-busana", "04", "Pakaian adat", province.pakaian, [
    el("div", { className: "costume" }, [
      photo
        ? el("figure", {}, [
          el("img", { src: wikimediaSized(photo.src, 960), alt: `Busana: ${photo.article}`, loading: "lazy" }),
          el("figcaption", {}, [`${photo.article} · `, el("a", { href: photo.page, rel: "noopener", textContent: `${photo.artist}, ${photo.license}` })]),
        ])
        : el("div", { className: "ph", textContent: "Foto busana berlisensi bebas belum kami temukan" }),
      el("div", { className: "costume-text" }, [
        coupleFigure(province),
        el("p", { textContent: `Pakaian adat ${province.name} yang tercatat di sumber kami adalah ${province.pakaian}. Busana adat biasanya dikenakan pada upacara, pernikahan, dan hari besar daerah. Ilustrasi di atas adalah gambar sederhana, bukan reproduksi detail busananya.` }),
        sourceNote(SOURCES.pakaian),
      ]),
    ]),
  ]);
}

function weaponFoodChapter(province) {
  const weapon = WEAPONS[province.id];
  const food = FOODS[province.id];
  const card = (icon, kicker, value, source) => el("article", { className: "mini-card" }, [
    el("span", { className: "mini-icon", ariaHidden: "true", innerHTML: icon }),
    el("small", { textContent: kicker }),
    el("h3", { className: value ? "" : "missing", textContent: value || "Belum terverifikasi" }),
    sourceNote(source),
  ]);
  // ikon garis sederhana buatan sendiri (bukan input pengguna)
  const bladeIcon = '<svg viewBox="0 0 48 48"><path d="M8 40 30 18l6-10 4 4-10 6-22 22Z M14 30l4 4 M6 42l4-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  const bowlIcon = '<svg viewBox="0 0 48 48"><path d="M6 24h36c0 9-8 16-18 16S6 33 6 24Z M17 18c0-3 3-3 3-6 M24 18c0-3 3-3 3-6 M31 18c0-3 3-3 3-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  return chapter("bab-senjata", "05", "Senjata tradisional & kuliner", "Pusaka dan rasa", [
    el("div", { className: "mini-grid" }, [card(bladeIcon, "Senjata tradisional", weapon, WEAPON_SOURCE), card(bowlIcon, "Makanan khas", food, FOOD_SOURCE)]),
  ]);
}

function shopChapter(province) {
  const sentra = SENTRA[province.id] || [];
  const links = shopSearches(province).map((x) => el("a", { href: x.url, rel: "noopener", target: "_blank" }, [el("small", { textContent: x.kind }), `${x.label} ↗`]));
  return chapter("bab-belanja", "06", "Belanja wastra", `Beli dari perajin ${province.name}`, [
    el("p", { className: "chapter-lead", textContent: "Tautan ini membuka hasil pencarian langsung di Google Maps dan marketplace, bukan toko pilihan atau mitra kami. Utamakan membeli dari perajin." }),
    el("div", { className: "shop-links" }, links),
    sentra.length ? el("div", { className: "sentra-grid" }, sentra.map((s) => sentraCard(s, province.id, { withProvinceLink: false }))) : null,
  ]);
}

function locationChapter(province, region, isNewStamp) {
  const passport = readPassport();
  const visited = new Set([...Object.keys(passport.visited), ...Object.keys(passport.tried)]);
  const siblings = PROVINCES.filter((p) => p.region === region.id).map((p) => {
    const a = el("a", { href: provinceUrl(p.id), textContent: p.name });
    if (p.id === province.id) a.setAttribute("aria-current", "page");
    return el("li", {}, [a]);
  });
  const stamp = el("section", { className: "stamp-card", ariaLabel: "Paspor wastra" }, [
    el("div", { className: "stamp-mark" }, [el("span", {}, [el("small", { textContent: "Paspor Wastra" }), province.name])]),
    el("p", { textContent: isNewStamp ? "Cap kunjungan baru masuk paspormu." : "Cap kunjungan sudah ada di paspormu." }),
    el("p", {}, [`${visited.size} dari ${PROVINCES.length} provinsi. `, el("a", { href: "/#paspor", textContent: "Buka paspor" })]),
  ]);
  return chapter("bab-lokasi", "07", "Di peta", `${province.name} dan tetangganya`, [
    el("div", { className: "prov-grid" }, [
      el("section", { className: "map-card", ariaLabel: "Peta lokasi" }, [
        el("div", { className: "map-sea" }, [el("div", { className: "map-wrap", id: "miniMap" })]),
        el("ul", { className: "siblings", ariaLabel: `Provinsi lain di ${region.name}` }, siblings),
      ]),
      stamp,
    ]),
  ]);
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

// tandai bab yang sedang dibaca di navigasi bab
function trackChapters(root) {
  if (!("IntersectionObserver" in window)) return null;
  const links = new Map([...root.querySelectorAll(".chapter-nav a")].map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const [id, a] of links) a.toggleAttribute("aria-current", id === entry.target.id);
      const active = links.get(entry.target.id);
      const list = active?.closest("ol");
      // geser daftar bab secara horizontal saja (di HP), tanpa ikut menggulir halaman
      if (active && list) list.scrollTo({ left: active.parentElement.offsetLeft - list.clientWidth / 2 + active.offsetWidth / 2, behavior: "smooth" });
    }
  }, { rootMargin: "-35% 0px -60% 0px" });
  root.querySelectorAll(".chapter").forEach((section) => io.observe(section));
  return io;
}

/**
 * Gambar kisah provinsi ke dalam root. Mengembalikan { destroy } untuk melepas pengamat saat ditutup.
 * @param {HTMLElement} root
 */
export function renderProvinceView(root, province) {
  const region = regionOf(province);
  const photo = PROVINCE_PHOTOS[province.id];
  const isNewStamp = stampVisited(province.id);

  root.style.setProperty("--accent", region.accent);
  document.title = `${province.name} · Wastraloka`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", `Sejarah, wastra, rumah adat, tarian, alat musik, pakaian adat, senjata, dan kuliner ${province.name}. Lalu coba wastranya di cermin AI.`);

  const notes = [];
  if (province.note) notes.push(el("p", { className: "honest", textContent: province.note }));
  notes.push(el("p", { className: "honest", textContent: "Ringkasan dari sumber publik dan masih dikurasi. Satu daerah punya banyak suku dan tradisi; yang tercantum di sini belum lengkap." }));

  const main = el("div", { id: "isi", className: "prov-main" }, [
    chapterNav(),
    el("div", { className: "chapters" }, [
      historyChapter(province), wastraChapter(province), cultureChapter(province), costumeChapter(province),
      weaponFoodChapter(province), shopChapter(province), locationChapter(province, region, isNewStamp),
      pager(province), ...notes,
    ]),
  ]);
  root.replaceChildren(hero(province, photo, region), main);

  // peta digambar setelah masuk dokumen: ukuran tiap provinsi baru bisa diukur saat sudah tampil
  const map = renderMap(root.querySelector("#miniMap"), {
    current: province.id,
    visited: new Set([...Object.keys(readPassport().visited)]),
    label: `Peta Indonesia, ${province.name} disorot`,
  });
  map.loadImages();
  const observer = trackChapters(root);
  return { destroy: () => observer?.disconnect() };
}

