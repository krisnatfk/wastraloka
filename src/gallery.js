// Galeri budaya: foto rumah adat, tarian, alat musik, dan pakaian dari 38 provinsi.
// Filter per jenis, tombol acak, dan lightbox dengan kredit foto + tautan ke halaman provinsi.

import { CULTURE_KINDS, CULTURE_PHOTOS } from "./content/culture-photos.js";
import { provinceById } from "./content/provinces.js";
import { wikimediaSized } from "./content/wastra-catalog.js";
import { el, shuffle } from "./dom.js";
import { provinceUrl } from "./map.js";

const ITEMS_PER_VIEW = 12;
const CARD_WIDTH = 500;
const LIGHTBOX_WIDTH = 1280;

export const allCultureItems = () => Object.entries(CULTURE_PHOTOS).flatMap(([provinceId, kinds]) =>
  Object.entries(kinds).filter(([, photo]) => photo).map(([kind, photo]) => ({ provinceId, kind, photo })));

export function initGallery({ onRender } = {}) {
  const grid = document.getElementById("galleryGrid");
  const tabs = document.getElementById("galleryTabs");
  const dialog = document.getElementById("lightbox");
  if (!grid || !tabs || !dialog) return;

  const items = allCultureItems();
  let kind = "";

  tabs.replaceChildren(...[["", "Semua"], ...Object.entries(CULTURE_KINDS)].map(([id, label]) => {
    const b = el("button", { type: "button", textContent: label });
    b.dataset.kind = id;
    return b;
  }), el("button", { type: "button", className: "shuffle", textContent: "↻ Acak lagi" }));

  function render() {
    for (const b of tabs.querySelectorAll("[data-kind]")) b.setAttribute("aria-pressed", String(b.dataset.kind === kind));
    const pool = shuffle(items.filter((item) => !kind || item.kind === kind)).slice(0, ITEMS_PER_VIEW);
    grid.replaceChildren(...pool.map((item, index) => card(item, index)));
    onRender?.(grid);
  }

  function card(item, index) {
    const province = provinceById(item.provinceId);
    const button = el("button", { type: "button", className: "gcard" }, [
      el("img", { src: wikimediaSized(item.photo.src, CARD_WIDTH), alt: "", loading: "lazy" }),
      el("span", { className: "gcard-kind", textContent: CULTURE_KINDS[item.kind] }),
      el("span", { className: "gcard-cap" }, [el("b", { textContent: item.photo.article }), el("small", { textContent: province.name })]),
    ]);
    button.setAttribute("aria-label", `${CULTURE_KINDS[item.kind]}: ${item.photo.article}, ${province.name}. Buka foto besar.`);
    button.style.setProperty("--i", index);
    button.addEventListener("click", () => openLightbox(item));
    return button;
  }

  function openLightbox(item) {
    const province = provinceById(item.provinceId);
    document.getElementById("lightboxImg").src = wikimediaSized(item.photo.src, LIGHTBOX_WIDTH);
    document.getElementById("lightboxImg").alt = `${item.photo.article}, ${province.name}`;
    document.getElementById("lightboxKind").textContent = `${CULTURE_KINDS[item.kind]} · ${province.name}`;
    document.getElementById("lightboxTitle").textContent = item.photo.article;
    document.getElementById("lightboxCredit").replaceChildren(
      "Foto: ", el("a", { href: item.photo.page, rel: "noopener", textContent: `${item.photo.artist} · ${item.photo.license}` }),
      " · Baca artikelnya di ", el("a", { href: item.photo.articleUrl, rel: "noopener", textContent: "Wikipedia" }),
    );
    const link = document.getElementById("lightboxLink");
    link.href = provinceUrl(item.provinceId);
    link.textContent = `Jelajahi ${province.name} →`;
    dialog.showModal();
  }

  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.kind !== undefined) kind = b.dataset.kind;
    render();
  });
  document.getElementById("lightboxClose").addEventListener("click", () => dialog.close());
  // klik di luar foto (latar gelap) menutup lightbox
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  render();
}
