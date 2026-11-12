// Hero beranda: foto latar berganti antar provinsi (crossfade), daftar provinsi di kanan sebagai pemilih slide.
// Daftar & foto pertama sudah ada di HTML, jadi hero tetap terisi walau JS gagal.

import { PROVINCE_PHOTOS } from "./content/province-photos.js";
import { provinceById } from "./content/provinces.js";
import { wikimediaSized } from "./content/wastra-catalog.js";
import { el, prefersReducedMotion } from "./dom.js";
import { provinceUrl } from "./map.js";

const SLIDE_MS = 6500;
const HERO_WIDTH = 1920;
const THUMB_WIDTH = 500;
const THUMBS = ["sumatera-utara", "kalimantan-timur", "sulawesi-selatan", "maluku"];

export function initHero() {
  const hero = document.getElementById("beranda");
  const items = [...hero.querySelectorAll("[data-slide]")];
  const layers = [...hero.querySelectorAll(".hero-bg")];
  const credit = document.getElementById("heroCredit");
  const progress = document.getElementById("heroProgress");
  if (!items.length || layers.length < 2) return;

  let current = -1;
  let frontLayer = 0;
  let timer = null;
  const isStill = prefersReducedMotion();

  // muat semua foto sekali di awal supaya pergantian tidak berkedip
  for (const item of items) new Image().src = wikimediaSized(PROVINCE_PHOTOS[item.dataset.slide].src, HERO_WIDTH);

  function show(index) {
    if (index === current) return;
    current = index;
    const id = items[index].dataset.slide;
    const photo = PROVINCE_PHOTOS[id];
    const province = provinceById(id);
    frontLayer = 1 - frontLayer;
    const next = layers[frontLayer];
    next.src = wikimediaSized(photo.src, HERO_WIDTH);
    layers.forEach((layer, i) => layer.classList.toggle("is-front", i === frontLayer));
    items.forEach((item, i) => item.classList.toggle("is-active", i === index));
    credit.replaceChildren(`${province.name}: `, el("a", { href: photo.page, rel: "noopener", textContent: `foto ${photo.artist} · ${photo.license}` }));
    if (progress && !isStill) {
      progress.classList.remove("is-running");
      void progress.offsetWidth; // ulang animasi garis waktu
      progress.classList.add("is-running");
    }
  }

  const schedule = () => {
    clearInterval(timer);
    if (isStill) return;
    timer = setInterval(() => show((current + 1) % items.length), SLIDE_MS);
  };

  items.forEach((item, index) => {
    const select = () => { show(index); schedule(); };
    item.addEventListener("mouseenter", select);
    item.addEventListener("focusin", select);
  });
  // jeda saat tab disembunyikan, supaya tidak memuat foto percuma
  document.addEventListener("visibilitychange", () => (document.hidden ? clearInterval(timer) : schedule()));

  show(0);
  schedule();
  renderThumbs();
}

function renderThumbs() {
  const strip = document.getElementById("heroStrip");
  const credit = document.getElementById("heroCredit");
  for (const id of THUMBS) {
    const province = provinceById(id);
    const photo = PROVINCE_PHOTOS[id];
    const link = el("a", { className: "thumb", href: provinceUrl(id), title: `Foto: ${photo.artist} · ${photo.license}` }, [
      el("img", { src: wikimediaSized(photo.src, THUMB_WIDTH), alt: "", loading: "lazy" }),
      el("span", { textContent: province.name }),
    ]);
    strip.insertBefore(link, credit);
  }
}
