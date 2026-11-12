// Marquee tanpa putus.
// Track berisi dua grup identik dan digeser selebar satu grup (-50% dari track), lalu diulang dari awal.
// Supaya sambungannya mulus, SATU GRUP HARUS SELEBAR (ATAU LEBIH) DARI LAYAR; kalau tidak, di ujung
// loop sisi kanan kosong sampai grup berikutnya masuk. Karena itu isi tiap grup diulang sebanyak
// yang dibutuhkan untuk menutupi lebar marquee, dan dihitung ulang saat layar berubah.

const SPEED_PX_PER_SECOND = 45;
const COVERAGE_MARGIN_PX = 2; // cadangan untuk pembulatan sub-pixel
const DURATION_CHANGE_TOLERANCE = 0.005; // abaikan perubahan durasi < 0,5% supaya animasi tidak tersentak

export function initMarquee(marquee) {
  const track = marquee?.querySelector(".marquee-track");
  const groups = track ? [...track.querySelectorAll(".marquee-group")] : [];
  if (groups.length < 2) return;

  const unitItems = [...groups[0].children].map((item) => item.cloneNode(true)); // satu set item asli
  let copiesPerGroup = 1;
  let appliedDuration = 0;

  function fillGroups(copies) {
    groups.forEach((group, groupIndex) => {
      const nodes = [];
      for (let copy = 0; copy < copies; copy += 1) {
        for (const item of unitItems) {
          const node = item.cloneNode(true);
          // pembaca layar cukup membaca satu set; semua salinan lain disembunyikan
          if (groupIndex > 0 || copy > 0) node.setAttribute("aria-hidden", "true");
          nodes.push(node);
        }
      }
      group.replaceChildren(...nodes);
    });
    copiesPerGroup = copies;
  }

  function refresh() {
    const visibleWidth = marquee.clientWidth;
    // lebar grup naik linear terhadap jumlah salinan (spasi antar item sama rata), jadi lebar satu set = lebar grup / salinan
    const unitWidth = groups[0].getBoundingClientRect().width / copiesPerGroup;
    if (!visibleWidth || !unitWidth) return;

    const neededCopies = Math.max(1, Math.ceil((visibleWidth + COVERAGE_MARGIN_PX) / unitWidth));
    if (neededCopies !== copiesPerGroup) fillGroups(neededCopies);

    // kecepatan tetap (px per detik) berapa pun lebar layarnya
    const duration = (unitWidth * neededCopies) / SPEED_PX_PER_SECOND;
    if (!appliedDuration || Math.abs(duration - appliedDuration) / appliedDuration > DURATION_CHANGE_TOLERANCE) {
      track.style.setProperty("--marquee-duration", `${duration.toFixed(2)}s`);
      appliedDuration = duration;
    }
  }

  let isScheduled = false;
  const scheduleRefresh = () => {
    if (isScheduled) return;
    isScheduled = true;
    requestAnimationFrame(() => {
      isScheduled = false;
      refresh();
    });
  };

  refresh();
  new ResizeObserver(scheduleRefresh).observe(marquee);
  // lebar teks berubah setelah font web selesai dimuat
  document.fonts?.ready.then(scheduleRefresh);
}
