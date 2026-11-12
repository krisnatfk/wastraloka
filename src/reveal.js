// Animasi muncul saat di-scroll. Kelas .reveal hanya dipasang lewat JS, jadi tanpa JS
// (atau dengan "kurangi gerakan") semua konten tetap terlihat seperti biasa.
import { prefersReducedMotion } from "./dom.js";

const STAGGER_STEP_MS = 70;
const MAX_STAGGER_ITEMS = 8;

export function initReveal(selector = "[data-reveal], [data-reveal-group] > *") {
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return { observe() {} };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  const observe = (root = document) => {
    for (const node of root.querySelectorAll(selector)) {
      if (node.classList.contains("reveal")) continue;
      const index = node.parentElement?.hasAttribute("data-reveal-group") ? [...node.parentElement.children].indexOf(node) : 0;
      node.style.setProperty("--reveal-delay", `${Math.min(index, MAX_STAGGER_ITEMS) * STAGGER_STEP_MS}ms`);
      node.classList.add("reveal");
      observer.observe(node);
    }
  };
  observe();
  return { observe };
}
