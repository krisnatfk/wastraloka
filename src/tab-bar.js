// Tab bar bawah di HP: menandai bagian halaman yang sedang dilihat.
// Hanya untuk link "#bagian" di halaman yang sama; link ke halaman lain dibiarkan.

export function initTabBar(root = document.querySelector(".tabbar")) {
  if (!root || !("IntersectionObserver" in window)) return;
  const links = [...root.querySelectorAll('a[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (!sections.length) return;

  const markCurrent = (id) => {
    for (const a of links) {
      if (a.getAttribute("href") === `#${id}`) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  };
  // bagian dianggap "sedang dilihat" saat melewati garis 40% dari atas layar
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) markCurrent(entry.target.id);
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach((section) => observer.observe(section));
}
