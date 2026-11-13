// Halaman khusus provinsi: /provinsi/?p=<id> (dibuka langsung, mis. dari tautan atau tab baru).
// Isinya digambar oleh src/province-view.js, yang juga dipakai beranda untuk tampilan tanpa muat ulang.

import { PROVINCES, REGIONS, provinceById, regionOf } from "./content/provinces.js";
import { el, installImageRetry } from "./dom.js";
import { provinceUrl } from "./map.js";
import { renderProvinceView } from "./province-view.js";
import { initReveal } from "./reveal.js";
import { initSiteNav } from "./site-nav.js";

function renderNotFound(requested) {
  document.title = "Provinsi tidak ditemukan · Wastraloka";
  const list = el("div", { className: "prov-index" }, REGIONS.map((r) => el("div", {}, [
    el("h3", { textContent: r.name }),
    el("ul", {}, PROVINCES.filter((p) => p.region === r.id).map((p) => el("li", {}, [el("a", { href: provinceUrl(p.id), textContent: p.name })]))),
  ])));
  document.getElementById("page").replaceChildren(el("main", { id: "isi", className: "notfound" }, [
    el("h1", { textContent: "Provinsi tidak ditemukan" }),
    el("p", { textContent: requested ? `Tidak ada provinsi dengan kode "${requested}". Pilih dari daftar di bawah.` : "Pilih provinsi dari daftar di bawah atau dari peta." }),
    list,
  ]));
}

installImageRetry();
const requested = new URLSearchParams(location.search).get("p") || "";
const province = provinceById(requested);
if (province) {
  document.documentElement.style.setProperty("--accent", regionOf(province).accent);
  renderProvinceView(document.getElementById("page"), province);
  // tautan langsung ke satu bab (mis. #bab-memudar dari Mode Lentera)
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) {
    const jump = () => target.scrollIntoView({ block: "start", behavior: "instant" });
    requestAnimationFrame(jump);
    // ulangi setelah gambar dimuat, karena tinggi halaman berubah
    if (document.readyState !== "complete") window.addEventListener("load", jump, { once: true });
  }
}
else renderNotFound(requested);
initReveal(".chapter, [data-reveal-group] > *");
initSiteNav({ nav: document.getElementById("siteNav"), sentinel: document.getElementById("navSentinel") });
