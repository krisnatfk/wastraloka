// Pembuat elemen kecil: el("a", { href, textContent }, [anak...]). Semua teks lewat textContent, jadi aman dari HTML.
export const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter((child) => child !== null && child !== undefined && child !== false));
  return node;
};

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Thumbnail Wikimedia dibuat saat pertama diminta dan kadang gagal (500/429) di permintaan pertama.
// Coba muat ulang sekali setelah jeda; kalau tetap gagal, biarkan (kotak gambar tetap berlatar motif).
const RETRY_DELAY_MS = 1800;
export function retryOnce(node, attribute = "src") {
  if (node.dataset.retried) return;
  node.dataset.retried = "1";
  const url = node.getAttribute(attribute);
  if (!url) return;
  setTimeout(() => node.setAttribute(attribute, `${url}${url.includes("?") ? "&" : "?"}r=1`), RETRY_DELAY_MS);
}

export function installImageRetry() {
  document.addEventListener("error", (e) => {
    const target = e.target;
    if (target instanceof HTMLImageElement) retryOnce(target);
    else if (target instanceof SVGImageElement) retryOnce(target, "href");
  }, true);
}
