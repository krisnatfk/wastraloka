// Kartu sentra wastra bergambar, dipakai di beranda dan halaman provinsi.

import { CULTURE_PHOTOS } from "./content/culture-photos.js";
import { sentraMapUrl } from "./content/culture.js";
import { provinceById } from "./content/provinces.js";
import { SENTRA_PHOTOS } from "./content/sentra-photos.js";
import { wikimediaSized } from "./content/wastra-catalog.js";
import { el } from "./dom.js";
import { fillPhotoOf, provinceUrl } from "./map.js";

const PHOTO_WIDTH = 500;

// foto sentra itu sendiri bila ada; kalau tidak, foto kain/busana provinsinya (keterangan foto tetap jujur)
// sentra batik tanpa foto sendiri memakai foto kain batik umum (keterangannya tetap "Batik"), bukan foto tari/alam
const BATIK_PHOTO_PROVINCE = "jawa-tengah";
function photoForSentra(sentra, provinceId) {
  if (SENTRA_PHOTOS[sentra.name]) return SENTRA_PHOTOS[sentra.name];
  if (/batik/i.test(sentra.wastra) && CULTURE_PHOTOS[BATIK_PHOTO_PROVINCE]?.pakaian) return CULTURE_PHOTOS[BATIK_PHOTO_PROVINCE].pakaian;
  if (CULTURE_PHOTOS[provinceId]?.pakaian) return CULTURE_PHOTOS[provinceId].pakaian;
  return fillPhotoOf(provinceId);
}

export function sentraCard(sentra, provinceId, { withProvinceLink = true } = {}) {
  const province = provinceById(provinceId);
  const photo = photoForSentra(sentra, provinceId);
  const caption = photo.article ? `Foto: ${photo.article}` : `Foto: ${province.name}`;
  return el("article", { className: "sentra" }, [
    el("figure", { className: "sentra-img" }, [
      el("img", { src: wikimediaSized(photo.src, PHOTO_WIDTH), alt: "", loading: "lazy" }),
      el("span", { className: "sentra-tag", textContent: sentra.wastra }),
      el("figcaption", {}, [`${caption} · `, el("a", { href: photo.page, rel: "noopener", target: "_blank", textContent: `${photo.artist}, ${photo.license}` })]),
    ]),
    el("div", { className: "sentra-body" }, [
      el("h3", { textContent: sentra.name }),
      el("p", { textContent: withProvinceLink ? `${sentra.place}, ${province.name}` : sentra.place }),
      el("div", { className: "sentra-links" }, [
        el("a", { href: sentraMapUrl(sentra), rel: "noopener", target: "_blank", textContent: "Lihat di peta ↗" }),
        withProvinceLink ? el("a", { href: provinceUrl(provinceId), textContent: "Kenali provinsinya" }) : null,
        el("a", { href: sentra.source, rel: "noopener", target: "_blank", textContent: "Sumber" }),
      ]),
    ]),
  ]);
}
