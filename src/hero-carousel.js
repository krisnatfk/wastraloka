// Carousel 3D melingkar untuk kartu di hero.
// Posisi disimpan sebagai angka pecahan (`position`, satuan = 1 kartu) dan setiap
// frame dihitung ulang offset tiap kartu terhadap tengah (`--o`). CSS memakai
// `--o` untuk menaruh kartu di permukaan silinder, jadi JS cukup mengurus fisika:
// geser (drag/swipe), inersia, snap ke kartu terdekat, dan putaran otomatis.

const AUTO_SPEED = 0.0028; // kartu per frame (~0,17 kartu/detik di 60 fps)
const FRICTION = 0.91; // perlambatan inersia per frame
const SNAP_STIFFNESS = 0.11; // seberapa cepat kartu "jatuh" ke posisi tengah
const SNAP_EPSILON = 0.0015;
const MIN_INERTIA = 0.006; // di bawah kecepatan ini inersia diganti snap
const IDLE_AFTER_INPUT_MS = 2600; // jeda sebelum putaran otomatis lanjut
const MAX_LEAN_DEG = 9;
const LEAN_PER_VELOCITY = 140;
const FADE_WIDTH = 1; // lebar zona pudar di tepi, dalam satuan kartu
const MAX_FLING = 0.28; // batas kecepatan lempar, kartu per frame
const FRAME_MS = 1000 / 60;
const MAX_FRAME_STEPS = 4;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function initHeroCarousel(root) {
  const tiles = [...root.querySelectorAll(".tile")];
  const count = tiles.length;
  if (count === 0) return;

  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const pauseButton = document.querySelector("[data-carousel-toggle]");
  const startIndex = Math.max(0, tiles.findIndex((t) => t.hasAttribute("data-start")));

  let position = startIndex;
  let velocity = 0;
  let snapTarget = null;
  let isDragging = false;
  let isHovered = false;
  let isPausedByUser = false;
  let isOnScreen = true;
  let idleUntil = 0;
  let lastX = 0;
  let lastTime = 0;
  let frameId = 0;
  let lastFrameAt = performance.now();

  // offset kartu i terhadap tengah, dibungkus ke [-count/2, count/2) supaya berputar
  const wrapOffset = (offset) => ((((offset + count / 2) % count) + count) % count) - count / 2;
  const cssNumber = (name, fallback) => {
    const value = parseFloat(getComputedStyle(root).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };
  const pixelsPerCard = () => cssNumber("--tile-w", 148) * 1.08;
  const isAutoplayAllowed = () =>
    !prefersReducedMotion.matches && !isPausedByUser && !isHovered && !isDragging && isOnScreen && !document.hidden;

  function render() {
    const visible = cssNumber("--visible", 4.4);
    const lean = clamp(velocity * LEAN_PER_VELOCITY, -MAX_LEAN_DEG, MAX_LEAN_DEG);
    tiles.forEach((tile, index) => {
      const offset = wrapOffset(index - position);
      const distance = Math.abs(offset);
      const alpha = clamp((visible + FADE_WIDTH / 2 - distance) / FADE_WIDTH, 0, 1);
      const blur = clamp((distance - (visible - 1.2)) * 2.2, 0, 5);
      const focus = clamp(1 - distance, 0, 1);
      tile.style.setProperty("--o", offset.toFixed(4));
      tile.style.setProperty("--alpha", alpha.toFixed(3));
      tile.style.setProperty("--blur", `${blur.toFixed(2)}px`);
      tile.style.setProperty("--focus", focus.toFixed(3));
      tile.style.setProperty("--lean", `${lean.toFixed(2)}deg`);
      tile.style.visibility = alpha < 0.01 ? "hidden" : "visible";
      tile.classList.toggle("is-center", distance < 0.5);
    });
  }

  function step(now) {
    // fisika berbasis waktu: kecepatan sama di layar 60 Hz, 120 Hz, maupun HP yang lambat.
    // dt = jumlah "frame 60 fps" sejak frame terakhir, dibatasi supaya tidak melompat setelah tab ditinggal
    const dt = clamp((now - lastFrameAt) / FRAME_MS, 0, MAX_FRAME_STEPS);
    lastFrameAt = now;
    if (!isDragging) {
      if (snapTarget !== null) {
        const gap = snapTarget - position;
        const moved = gap * (1 - Math.pow(1 - SNAP_STIFFNESS, dt));
        velocity = moved / Math.max(dt, 0.0001);
        position += moved;
        if (Math.abs(gap) < SNAP_EPSILON) {
          position = snapTarget;
          snapTarget = null;
          velocity = 0;
        }
      } else if (Math.abs(velocity) > MIN_INERTIA) {
        position += velocity * dt;
        velocity *= Math.pow(FRICTION, dt);
      } else if (now < idleUntil || !isAutoplayAllowed()) {
        // berhenti rapi di kartu terdekat setelah inersia habis
        if (position !== Math.round(position)) snapTarget = Math.round(position);
        velocity = 0;
      } else {
        position += AUTO_SPEED * dt;
      }
    }
    position = ((position % count) + count) % count;
    if (snapTarget !== null) snapTarget = position + wrapOffset(snapTarget - position);
    render();
    frameId = requestAnimationFrame(step);
  }

  function markInput() {
    idleUntil = performance.now() + IDLE_AFTER_INPUT_MS;
  }

  function goTo(delta) {
    const base = snapTarget ?? Math.round(position);
    snapTarget = base + delta;
    markInput();
  }

  /* ---------- geser dengan mouse / jari ---------- */
  root.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    isDragging = true;
    snapTarget = null;
    velocity = 0;
    lastX = event.clientX;
    lastTime = performance.now();
    root.setPointerCapture(event.pointerId);
    root.classList.add("is-dragging");
  });

  root.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const now = performance.now();
    const deltaCards = -(event.clientX - lastX) / pixelsPerCard();
    const frames = Math.max(1, (now - lastTime) / 16.7);
    position += deltaCards;
    // kecepatan dihaluskan supaya lemparan tidak tersentak
    velocity = clamp(velocity * 0.6 + (deltaCards / frames) * 0.4, -MAX_FLING, MAX_FLING);
    lastX = event.clientX;
    lastTime = now;
  });

  const endDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    root.classList.remove("is-dragging");
    if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
    // jari diam sebelum dilepas = tanpa lemparan
    if (performance.now() - lastTime > 90) velocity = 0;
    markInput();
  };
  root.addEventListener("pointerup", endDrag);
  root.addEventListener("pointercancel", endDrag);

  /* ---------- trackpad / Shift + scroll ---------- */
  root.addEventListener("wheel", (event) => {
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0;
    if (!horizontal) return; // scroll vertikal biasa tetap menggulir halaman
    event.preventDefault();
    snapTarget = null;
    velocity = clamp(velocity + horizontal / pixelsPerCard() * 0.08, -0.6, 0.6);
    markInput();
  }, { passive: false });

  /* ---------- keyboard ---------- */
  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") { event.preventDefault(); goTo(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); goTo(-1); }
  });

  root.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") isHovered = true; });
  root.addEventListener("pointerleave", () => { isHovered = false; });
  root.addEventListener("focusin", () => { isHovered = true; });
  root.addEventListener("focusout", () => { isHovered = false; });

  pauseButton?.addEventListener("click", () => {
    isPausedByUser = !isPausedByUser;
    pauseButton.setAttribute("aria-pressed", String(isPausedByUser));
    pauseButton.textContent = isPausedByUser ? "Putar kartu" : "Jeda kartu";
  });

  // hemat baterai: animasi berhenti saat hero tidak terlihat
  new IntersectionObserver(([entry]) => {
    isOnScreen = entry.isIntersecting;
    cancelAnimationFrame(frameId);
    if (!isOnScreen) return;
    lastFrameAt = performance.now();
    frameId = requestAnimationFrame(step);
  }).observe(root);

  render();
  frameId = requestAnimationFrame(step);
}
