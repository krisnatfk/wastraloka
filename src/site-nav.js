// Navbar yang berubah jadi "pulau" kaca saat halaman di-scroll.
// Animasinya sepenuhnya CSS (transisi pada padding/opacity), jadi tetap mulus walau scroll cepat.
// JS hanya menandai apakah halaman sudah di-scroll, memakai IntersectionObserver pada elemen penanda
// di dekat puncak halaman, tanpa listener scroll yang berjalan di setiap frame.

const SCROLLED_CLASS = "is-scrolled";
const FALLBACK_SCROLL_THRESHOLD_PX = 24;

export function initSiteNav({ nav, sentinel }) {
  if (!nav || !sentinel) return;
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
