// Navbar yang berubah jadi "pulau" kaca saat halaman di-scroll.
// Animasinya sepenuhnya CSS (transisi pada padding/opacity), jadi tetap mulus walau scroll cepat.
// JS hanya menandai apakah halaman sudah di-scroll, memakai IntersectionObserver pada elemen penanda
// di dekat puncak halaman, tanpa listener scroll yang berjalan di setiap frame.

const SCROLLED_CLASS = "is-scrolled";
const FALLBACK_SCROLL_THRESHOLD_PX = 24;

// Menu hamburger (HP): pulau kaca melebar ke bawah berisi daftar menu.
// Tutup dengan tombol yang sama, Escape, klik di luar, atau saat sebuah menu dipilih.
const MOBILE_QUERY = "(max-width: 1024px)";
const HOVER_QUERY = "(hover: hover) and (min-width: 1025px)";
const HOVER_CLOSE_DELAY_MS = 140;

// Dropdown (Jelajah, Wastra): klik atau hover (mouse) membuka; panah bawah/atas berpindah antar item;
// Escape menutup dan mengembalikan fokus; klik di luar atau memilih item menutupnya.
// Di HP (menu hamburger) dropdown berfungsi sebagai akordeon.
function initDropdowns(nav) {
  const items = [...nav.querySelectorAll(".nav-item.has-sub")];
  if (!items.length) return () => {};
  const hoverMode = window.matchMedia(HOVER_QUERY);
  const timers = new Map();

  const setItem = (item, isOpen) => {
    clearTimeout(timers.get(item));
    item.classList.toggle("is-open", isOpen);
    item.querySelector(".nav-sub-toggle")?.setAttribute("aria-expanded", String(isOpen));
  };
  const closeAll = (except = null) => { for (const item of items) if (item !== except) setItem(item, false); };

  for (const item of items) {
    const toggle = item.querySelector(".nav-sub-toggle");
    const links = [...item.querySelectorAll(".nav-sub a")];
    const focusLink = (i) => links[(i + links.length) % links.length]?.focus();

    toggle.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      if (!MOBILE_MQ().matches) closeAll(item); // desktop: satu dropdown terbuka sekali waktu
      setItem(item, willOpen);
    });
    toggle.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); closeAll(item); setItem(item, true); focusLink(0); }
      if (e.key === "Escape") setItem(item, false);
    });
    item.addEventListener("keydown", (e) => {
      const index = links.indexOf(document.activeElement);
      if (index < 0) return;
      if (e.key === "ArrowDown") { e.preventDefault(); focusLink(index + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); index === 0 ? toggle.focus() : focusLink(index - 1); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setItem(item, false); toggle.focus(); }
    });
    item.addEventListener("focusout", (e) => {
      if (!MOBILE_MQ().matches && !item.contains(e.relatedTarget)) setItem(item, false);
    });
    item.addEventListener("mouseenter", () => { if (hoverMode.matches) { closeAll(item); setItem(item, true); } });
    item.addEventListener("mouseleave", () => {
      if (!hoverMode.matches) return;
      timers.set(item, setTimeout(() => setItem(item, false), HOVER_CLOSE_DELAY_MS));
    });
    item.querySelector(".nav-sub").addEventListener("click", (e) => { if (e.target.closest("a")) closeAll(); });
  }
  document.addEventListener("pointerdown", (e) => { if (!nav.contains(e.target)) closeAll(); });
  window.matchMedia(MOBILE_QUERY).addEventListener("change", () => closeAll());
  return closeAll;
}
const MOBILE_MQ = () => window.matchMedia(MOBILE_QUERY);

function initMenuToggle(nav) {
  const toggle = nav.querySelector(".nav-toggle");
  const menu = nav.querySelector(".nav-links");
  if (!toggle || !menu) return;
  const mobile = window.matchMedia(MOBILE_QUERY);
  const closeDropdowns = initDropdowns(nav);

  const setOpen = (isOpen, { focusToggle = false } = {}) => {
    nav.classList.toggle("is-open", isOpen);
    if (!isOpen) closeDropdowns();
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
    // saat tertutup di HP, menu tidak boleh bisa di-Tab atau dibaca pembaca layar
    menu.toggleAttribute("inert", mobile.matches && !isOpen);
    if (isOpen) menu.querySelector("a, button")?.focus({ preventScroll: true });
    else if (focusToggle) toggle.focus({ preventScroll: true });
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) setOpen(false, { focusToggle: true });
  });
  document.addEventListener("pointerdown", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) setOpen(false);
  });
  // pindah ke ukuran desktop: menu kembali jadi deretan link biasa
  mobile.addEventListener("change", () => setOpen(false));
  setOpen(false);
}

export function initSiteNav({ nav, sentinel }) {
  if (!nav || !sentinel) return;
  initMenuToggle(nav);
  const setScrolled = (isScrolled) => nav.classList.toggle(SCROLLED_CLASS, isScrolled);

  if ("IntersectionObserver" in window) {
    // penanda terlihat = masih di puncak; hilang dari layar = sudah di-scroll
    new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting)).observe(sentinel);
    return;
  }

  // browser lama tanpa IntersectionObserver
  let isTicking = false;
  const update = () => {
    isTicking = false;
    setScrolled(window.scrollY > FALLBACK_SCROLL_THRESHOLD_PX);
  };
  window.addEventListener("scroll", () => {
    if (isTicking) return;
    isTicking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}
