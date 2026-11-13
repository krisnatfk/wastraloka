// Beranda: hero, peta, galeri budaya, kuis, kartu wastra, paspor, sentra UMKM, sumber.
// Dimuat sebagai script sendiri (terpisah dari cermin AI), jadi kalau cermin gagal dimuat, isi beranda tetap tampil.

import { CULTURE_PHOTOS } from "./content/culture-photos.js";
import { FOODS, MUSIC, MUSIC_SOURCE, SENTRA } from "./content/culture.js";
import { PROVINCES, REGIONS, SOURCES, provinceById } from "./content/provinces.js";
import { WASTRA_CATALOG, catalogForProvince, wikimediaSized } from "./content/wastra-catalog.js";
import { el, installImageRetry, prefersReducedMotion } from "./dom.js";
import { coupleSvg } from "./figures.js";
import { initGallery } from "./gallery.js";
import { initHero } from "./hero.js";
import { fillPhotoOf, provinceUrl, renderMap } from "./map.js";
import { initMarquee } from "./marquee.js";
import { clearPassport, formatStampDate, readPassport, stampVisited } from "./paspor.js";
import { initQuiz } from "./quiz.js";
import { initReveal } from "./reveal.js";
import { sentraCard } from "./sentra.js";
import { initSiteNav } from "./site-nav.js";
import { renderProvinceView } from "./province-view.js";

const COUNT_UP_MS = 900;
let mapApi = null;
let reveal = null;

const stampedIds = (passport) => new Set([...Object.keys(passport.visited), ...Object.keys(passport.tried)]);

const PANEL_PHOTO_WIDTH = 960;

// Panel samping peta: busana adat (ilustrasi), foto rumah adat sebagai latar, dan ringkasan budaya.
function renderMapPanel(id) {
  const province = provinceById(id);
  if (!province) return;
  const region = REGIONS.find((r) => r.id === province.region);
  const photo = fillPhotoOf(id);
  const panel = document.getElementById("mapPanel");
  const rumah = province.rumah ? (/^(Rumah|Gapura)/.test(province.rumah) ? province.rumah : `Rumah ${province.rumah}`) : null;
  const facts = [
    ["Ibu kota", province.capital], ["Wastra", province.wastra.map((w) => w.name).slice(0, 2).join(", ")], ["Rumah adat", rumah],
    ["Tarian", province.tarian], ["Alat musik", MUSIC[id]?.[0]?.name], ["Kuliner", FOODS[id]], ["Busana", province.pakaian],
  ].filter(([, value]) => value);
  const figure = el("div", { className: "panel-couple" });
  figure.innerHTML = coupleSvg(id, { label: `Ilustrasi pasangan berbusana adat ${province.name}` }); // markup dari data tetap kita sendiri
  const [garment] = catalogForProvince(id);
  panel.style.setProperty("--accent", region?.accent ?? "#5a3220");
  panel.replaceChildren(
    el("div", { className: "panel-hero" }, [
      el("img", { className: "panel-bg", src: wikimediaSized(photo.src, PANEL_PHOTO_WIDTH), alt: "" }),
      figure,
      el("div", { className: "panel-title" }, [el("small", { textContent: region?.name ?? "" }), el("h3", { textContent: province.name })]),
    ]),
    el("dl", { className: "panel-facts" }, facts.map(([k, v]) => el("div", {}, [el("dt", { textContent: k }), el("dd", { textContent: v })]))),
    el("div", { className: "panel-actions" }, [
      el("a", { className: "pill pill-sogan", href: provinceUrl(id), textContent: "Buka kisah lengkap →" }),
      garment ? el("a", { className: "pill pill-line", href: `/?coba=${garment.id}#cermin`, textContent: "Coba wastranya" }) : null,
    ]),
    el("p", { className: "panel-credit" }, [`${photo.label}: `, el("a", { href: photo.page, rel: "noopener", target: "_blank", textContent: `${photo.artist} · ${photo.license}` }), ". Ilustrasi busana: gambar sederhana Wastraloka."]),
  );
  panel.classList.remove("is-fresh");
  void panel.offsetWidth; // ulang animasi masuk
  panel.classList.add("is-fresh");
}

// ---- Masuk ke provinsi tanpa muat ulang: zoom peta -> tampilan provinsi di halaman ini (URL ikut berganti)
const HOVER_PREVIEW_MS = 120;
const homeTitle = document.title;
let hoverTimer = 0;
let isEntering = false;
let activeView = null;

function previewProvince(id) {
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => renderMapPanel(id), HOVER_PREVIEW_MS);
}

function showProvinceView(id) {
  const province = provinceById(id);
  if (!province) return false;
  const root = document.getElementById("provinceView");
  activeView?.destroy();
  activeView = renderProvinceView(root, province);
  root.hidden = false;
  document.body.classList.add("is-province-open");
  root.classList.remove("is-entering");
  void root.offsetWidth; // ulang animasi masuk
  root.classList.add("is-entering");
  window.scrollTo({ top: 0, behavior: "auto" });
  reveal?.observe(root);
  return true;
}

async function enterProvince(id) {
  if (isEntering || !provinceById(id)) return;
  isEntering = true;
  clearTimeout(hoverTimer);
  const mapCard = document.querySelector("#peta .map-card");
  try {
    // di HP peta bisa digeser: tengahkan dulu, karena zoom selalu berpusat di tengah peta
    const sea = mapCard.querySelector(".map-sea");
    if (sea && sea.scrollWidth > sea.clientWidth) sea.scrollTo({ left: (sea.scrollWidth - sea.clientWidth) / 2, behavior: "auto" });
    await mapApi.zoomTo(id);
    mapCard.classList.add("is-diving");
    await new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 0 : 280));
    if (showProvinceView(id)) history.pushState({ province: id }, "", provinceUrl(id));
  } finally {
    mapCard.classList.remove("is-diving");
    isEntering = false;
  }
}

function closeProvinceView({ toHash = "#peta" } = {}) {
  if (!document.body.classList.contains("is-province-open")) return;
  activeView?.destroy();
  activeView = null;
  const root = document.getElementById("provinceView");
  root.hidden = true;
  root.replaceChildren();
  document.body.classList.remove("is-province-open");
  document.title = homeTitle;
  renderPassport(); // cap kunjungan baru dari halaman provinsi
  const target = (toHash === "#peta" && document.querySelector("#peta .map-card")) || document.querySelector(toHash) || document.getElementById("peta");
  const scrollToTarget = () => target.scrollIntoView({ behavior: "auto", block: toHash === "#peta" ? "center" : "start" });
  scrollToTarget();
  requestAnimationFrame(scrollToTarget); // ulangi setelah tata letak beranda kembali tampil
  if (toHash === "#peta") mapApi.resetZoom();
  else mapApi.resetZoom(0);
}

function initProvinceRouting() {
  // posisi gulir diatur sendiri (kembali ke peta setelah Back), bukan dipulihkan browser
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("popstate", (e) => {
    const id = e.state?.province;
    if (id) showProvinceView(id);
    else closeProvinceView();
  });
  // selama tampilan provinsi terbuka: tautan provinsi lain dibuka di tempat, tautan beranda menutupnya
  document.addEventListener("click", (e) => {
    const isOpen = document.body.classList.contains("is-province-open");
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const link = e.target.closest?.("a[href]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (href.startsWith("#bab-")) return; // navigasi bab di dalam tampilan provinsi
    if (isOpen && href.startsWith("#")) { // menu beranda (#peta, #galeri, ...) saat kisah provinsi terbuka
      e.preventDefault();
      history.pushState(null, "", `/${href}`);
      closeProvinceView({ toHash: href.length > 1 ? href : "#beranda" });
      return;
    }
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    const id = url.pathname.startsWith("/provinsi") ? url.searchParams.get("p") : null;
    if (id && provinceById(id)) {
      e.preventDefault();
      if (showProvinceView(id)) history.pushState({ province: id }, "", provinceUrl(id));
      return;
    }
    if (isOpen && url.pathname === "/" && !url.search) {
      e.preventDefault();
      history.pushState(null, "", `/${url.hash}`);
      closeProvinceView({ toHash: url.hash || "#beranda" });
    }
  });
}

function renderMapSection() {
  const visited = stampedIds(readPassport());
  const host = document.getElementById("map");
  mapApi = renderMap(host, { visited, figures: true, onActivate: enterProvince, onHover: previewProvince });

  // provinsi muncul bergantian saat peta pertama kali terlihat
  const paths = host.querySelectorAll(".map-prov");
  paths.forEach((p, i) => p.style.setProperty("--i", i));
  host.querySelectorAll(".map-figure").forEach((f, i) => f.style.setProperty("--i", i));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      host.classList.add("is-drawn");
      mapApi.loadImages();
      io.disconnect();
    }, { threshold: 0.2 });
    io.observe(host);
  } else {
    host.classList.add("is-drawn");
    mapApi.loadImages();
  }

  // petunjuk "geser peta" di HP hilang setelah peta digeser sedikit
  const sea = document.querySelector("#peta .map-sea");
  const hint = document.getElementById("mapHint");
  const SWIPE_HIDE_PX = 24;
  sea?.addEventListener("scroll", () => {
    if (sea.scrollLeft > SWIPE_HIDE_PX) hint?.classList.add("is-hidden");
  }, { passive: true });

  // tautan footer "?wilayah=..." tetap menyorot pulau terkait, tanpa tombol wilayah di atas peta
  const region = new URLSearchParams(location.search).get("wilayah");
  if (REGIONS.some((r) => r.id === region)) mapApi.setRegion(region);

  // daftar teks per wilayah: cara cepat ke provinsi kecil (DKI, DIY, Bali) dan untuk pembaca layar
  document.getElementById("provIndex").replaceChildren(...REGIONS.map((r) => {
    const items = PROVINCES.filter((p) => p.region === r.id).map((p) => {
      const a = el("a", { href: provinceUrl(p.id), textContent: p.name });
      if (visited.has(p.id)) a.classList.add("is-visited");
      return el("li", {}, [a]);
    });
    return el("div", {}, [el("h3", { textContent: r.name }), el("ul", {}, items)]);
  }));

  document.getElementById("footRegions").replaceChildren(...REGIONS.map((r) => el("li", {}, [el("a", { href: `/?wilayah=${r.id}#peta`, textContent: r.name })])));
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

function countUp(node, target, suffix) {
  const start = performance.now();
  const from = Number(node.dataset.value || 0);
  node.dataset.value = String(target);
  const step = (now) => {
    const t = Math.min(1, (now - start) / COUNT_UP_MS);
    const eased = 1 - (1 - t) ** 3;
    node.replaceChildren(`${Math.round(from + (target - from) * eased)} `, suffix.cloneNode(true));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function renderPassport() {
  const passport = readPassport();
  const stamped = stampedIds(passport);
  countUp(document.getElementById("pasporCount"), stamped.size, el("small", { textContent: `/ ${PROVINCES.length}` }));
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
  for (const link of document.querySelectorAll(".map-prov, .prov-index a")) {
    const id = link.dataset.id || new URL(link.href, location.href).searchParams.get("p");
    link.classList.toggle("is-visited", stamped.has(id));
  }
}

function renderSentra() {
  const cards = Object.entries(SENTRA).flatMap(([provinceId, list]) => list.map((sentra) => sentraCard(sentra, provinceId)));
  document.getElementById("sentraGrid").replaceChildren(...cards);
}

function renderSources() {
  const all = [...Object.values(SOURCES), MUSIC_SOURCE];
  document.getElementById("sourceList").replaceChildren(...all.map((s) => el("li", {}, [el("a", { href: s.url, rel: "noopener", textContent: s.label })])));
}

// angka di hero dihitung dari data, supaya tidak basi saat data bertambah
function renderStats() {
  const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = String(value); };
  set("statWastra", PROVINCES.reduce((total, p) => total + p.wastra.length, 0));
  set("statMusic", Object.values(MUSIC).flat().length);
  set("statPhotos", Object.values(CULTURE_PHOTOS).flatMap(Object.values).filter(Boolean).length);
}

function initHome() {
  installImageRetry();
  initSiteNav({ nav: document.getElementById("siteNav"), sentinel: document.getElementById("navSentinel") });
  initMarquee(document.querySelector(".marquee"));
  initHero();
  renderStats();
  renderMapSection();
  renderWastraGrid();
  renderSentra();
  renderSources();
  renderPassport();
  reveal = initReveal();
  initProvinceRouting();
  initGallery({ onRender: (grid) => reveal.observe(grid.parentElement) });
  initQuiz({ onCorrect: (id) => { if (stampVisited(id)) renderPassport(); } });

  document.getElementById("pasporReset").addEventListener("click", () => {
    if (!window.confirm("Kosongkan semua cap di paspor? Tidak bisa dibatalkan.")) return;
    clearPassport();
    renderPassport();
  });
}

initHome();
