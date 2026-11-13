// Navbar yang berubah jadi "pulau" kaca saat halaman di-scroll.
// Animasinya sepenuhnya CSS (transisi pada padding/opacity), jadi tetap mulus walau scroll cepat.
// JS hanya menandai apakah halaman sudah di-scroll, memakai IntersectionObserver pada elemen penanda
// di dekat puncak halaman, tanpa listener scroll yang berjalan di setiap frame.

const SCROLLED_CLASS = "is-scrolled";
const FALLBACK_SCROLL_THRESHOLD_PX = 24;

// Menu hamburger (HP): pulau kaca melebar ke bawah berisi daftar menu.
// Tutup dengan tombol yang sama, Escape, klik di luar, atau saat sebuah menu dipilih.
const MOBILE_QUERY = "(max-width: 920px)";

function initMenuToggle(nav) {
  const toggle = nav.querySelector(".nav-toggle");
  const menu = nav.querySelector(".nav-links");
  if (!toggle || !menu) return;
  const mobile = window.matchMedia(MOBILE_QUERY);

  const setOpen = (isOpen, { focusToggle = false } = {}) => {
    nav.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
    // saat tertutup di HP, menu tidak boleh bisa di-Tab atau dibaca pembaca layar
    menu.toggleAttribute("inert", mobile.matches && !isOpen);
    if (isOpen) menu.querySelector("a")?.focus({ preventScroll: true });
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
