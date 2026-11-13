// Beranda: hero, peta, galeri budaya, kuis, kartu wastra, paspor, sentra UMKM, sumber.
// Dimuat sebagai script sendiri (terpisah dari cermin AI), jadi kalau cermin gagal dimuat, isi beranda tetap tampil.

import { CULTURE_PHOTOS } from "./content/culture-photos.js";
import { MUSIC, MUSIC_SOURCE, SENTRA } from "./content/culture.js";
import { PROVINCES, REGIONS, SOURCES, provinceById } from "./content/provinces.js";
import { WASTRA_CATALOG } from "./content/wastra-catalog.js";
import { el, installImageRetry } from "./dom.js";
import { initGallery } from "./gallery.js";
import { initHero } from "./hero.js";
import { provinceUrl, renderMap } from "./map.js";
import { initMarquee } from "./marquee.js";
import { clearPassport, formatStampDate, readPassport, stampVisited } from "./paspor.js";
import { initQuiz } from "./quiz.js";
import { initReveal } from "./reveal.js";
import { sentraCard } from "./sentra.js";
import { initSiteNav } from "./site-nav.js";
import { initTabBar } from "./tab-bar.js";

const COUNT_UP_MS = 900;
let mapApi = null;

const stampedIds = (passport) => new Set([...Object.keys(passport.visited), ...Object.keys(passport.tried)]);

function renderMapSection() {
  const visited = stampedIds(readPassport());
  const host = document.getElementById("map");
  mapApi = renderMap(host, { visited });

  // provinsi muncul bergantian saat peta pertama kali terlihat
  const paths = host.querySelectorAll(".map-prov");
  paths.forEach((p, i) => p.style.setProperty("--i", i));
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
    mapApi.setRegion(activeRegion);
  };
  chips.replaceChildren(...buttons);
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    activeRegion = b.dataset.region;
    sync();
  });
  sync();

  document.getElementById("randomProvince").addEventListener("click", () => {
    const pick = PROVINCES[Math.floor(Math.random() * PROVINCES.length)];
    location.href = provinceUrl(pick.id);
  });

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
  initTabBar();
  initMarquee(document.querySelector(".marquee"));
  initHero();
  renderStats();
  renderMapSection();
  renderWastraGrid();
  renderSentra();
  renderSources();
  renderPassport();
  const reveal = initReveal();
  initGallery({ onRender: (grid) => reveal.observe(grid.parentElement) });
  initQuiz({ onCorrect: (id) => { if (stampVisited(id)) renderPassport(); } });

  document.getElementById("pasporReset").addEventListener("click", () => {
    if (!window.confirm("Kosongkan semua cap di paspor? Tidak bisa dibatalkan.")) return;
    clearPassport();
    renderPassport();
  });
}

initHome();
