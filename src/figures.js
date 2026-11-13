// Ilustrasi pasangan berpakaian adat untuk 38 provinsi, digambar sendiri sebagai SVG "boneka kertas".
// Ini penyederhanaan bergaya (tutup kepala, warna, motif kain), bukan reproduksi detail busana asli.
// Semua isi SVG berasal dari data di file ini (bukan input pengguna), jadi aman dipasang sebagai markup.

const SKIN = ["#d39a6a", "#c48a5a", "#b3784a", "#9a643c"];
const GOLD = "#d9a62e";

// Pola kain. Setiap pola dibuat unik per gambar supaya id tidak bentrok saat banyak SVG di satu halaman.
function patternDef(id, kind, base, accent) {
  const p = (w, h, body) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${base}"/>${body}</pattern>`;
  switch (kind) {
    case "songket": return p(8, 8, `<path d="M0 1h8M0 7h8" stroke="${accent}" stroke-width="0.8"/><path d="M4 2.5 6 4 4 5.5 2 4Z" fill="${accent}"/>`);
    case "batik": return p(7, 7, `<circle cx="3.5" cy="3.5" r="1.6" fill="none" stroke="${accent}" stroke-width="0.7"/><circle cx="0" cy="0" r="0.8" fill="${accent}"/><circle cx="7" cy="7" r="0.8" fill="${accent}"/>`);
    case "parang": return p(6, 6, `<path d="M-1 7 7 -1M-1 1 1 -1M5 7 7 5" stroke="${accent}" stroke-width="1.2"/>`);
    case "ikat": return p(8, 6, `<path d="M0 4 2 1 4 4 6 1 8 4" fill="none" stroke="${accent}" stroke-width="0.9"/>`);
    case "lurik": return p(4, 4, `<path d="M1 0v4M3 0v4" stroke="${accent}" stroke-width="0.6"/>`);
    case "kotak": return p(6, 6, `<path d="M0 3h6M3 0v6" stroke="${accent}" stroke-width="1.4" opacity="0.8"/>`);
    case "manik": return p(4, 4, `<circle cx="2" cy="2" r="0.9" fill="${accent}"/>`);
    case "rumbai": return p(3, 10, `<path d="M1.5 0v10" stroke="${accent}" stroke-width="1"/>`);
    default: return p(4, 4, "");
  }
}

function maleHead(kind, color, cx) {
  switch (kind) {
    case "peci": return `<rect x="${cx - 8.5}" y="6" width="17" height="7.5" rx="2" fill="${color}"/>`;
    case "tanjak": return `<path d="M${cx - 9} 14 L${cx + 9} 14 L${cx + 5} 4 L${cx + 8} -1 L${cx - 1} 5 L${cx - 7} 6Z" fill="${color}"/><path d="M${cx - 9} 14 L${cx + 9} 14" stroke="${GOLD}" stroke-width="1.4"/>`;
    case "destar": return `<path d="M${cx - 9} 15 Q${cx} 4 ${cx + 9} 15 L${cx + 9} 10 Q${cx} 1 ${cx - 9} 10Z" fill="${color}"/><path d="M${cx + 8} 9 l5 -3 -1 6Z" fill="${color}"/>`;
    case "blangkon": return `<path d="M${cx - 9} 15 Q${cx - 9} 5 ${cx} 5 Q${cx + 9} 5 ${cx + 9} 15Z" fill="${color}"/><circle cx="${cx - 9}" cy="15" r="3" fill="${color}"/><path d="M${cx - 7} 12 h14" stroke="${GOLD}" stroke-width="0.6" opacity="0.7"/>`;
    case "udeng": return `<path d="M${cx - 9} 14 Q${cx} 6 ${cx + 9} 14 L${cx + 8} 9 Q${cx} 3 ${cx - 8} 9Z" fill="${color}"/><path d="M${cx - 2} 9 L${cx} 1 L${cx + 2} 9Z" fill="${color}"/>`;
    case "meukeutop": return `<path d="M${cx - 7} 13 L${cx - 5} -4 Q${cx} -8 ${cx + 5} -4 L${cx + 7} 13Z" fill="#c0392b"/><path d="M${cx - 6.5} 8h13M${cx - 6} 3h12M${cx - 5.5} -1h11" stroke="${GOLD}" stroke-width="1.6"/><path d="M${cx - 6} 5.5h12" stroke="#1e7d4f" stroke-width="1.3"/>`;
    case "bulu": return `<path d="M${cx - 9} 12 h18" stroke="${color}" stroke-width="4"/>${[-8, -4, 0, 4, 8].map((dx, i) => `<path d="M${cx + dx * 0.9} 11 L${cx + dx * 1.6} -6" stroke="${i % 2 ? "#f4f1e8" : "#1d1d1d"}" stroke-width="2.2" stroke-linecap="round"/>`).join("")}`;
    case "mahkota": return `<path d="M${cx - 8} 12 L${cx - 8} 4 L${cx - 4} 8 L${cx} 1 L${cx + 4} 8 L${cx + 8} 4 L${cx + 8} 12Z" fill="${color}"/>`;
    default: return `<path d="M${cx - 8} 14 Q${cx} 4 ${cx + 8} 14" fill="#2b1d14"/>`;
  }
}

function femaleHead(kind, color, cx) {
  const hair = `<path d="M${cx - 8.5} 18 Q${cx - 9} 6 ${cx} 6 Q${cx + 9} 6 ${cx + 8.5} 18 Q${cx} 12 ${cx - 8.5} 18Z" fill="#241710"/>`;
  switch (kind) {
    case "sanggul": return `${hair}<circle cx="${cx + 7}" cy="8" r="5" fill="#241710"/><circle cx="${cx + 9}" cy="5" r="1.6" fill="${color}"/><circle cx="${cx + 5}" cy="4" r="1.3" fill="#f4f1e8"/>`;
    case "suntiang": return `<path d="M${cx - 16} 13 A16 16 0 0 1 ${cx + 16} 13Z" fill="${color}"/>${[-12, -6, 0, 6, 12].map((dx) => `<path d="M${cx} 13 L${cx + dx} -1" stroke="#fff3c4" stroke-width="0.7"/>`).join("")}${hair}`;
    case "siger": return `${hair}<path d="M${cx - 13} 11 L${cx - 11} 2 L${cx - 7} 7 L${cx - 4} -1 L${cx} 5 L${cx + 4} -1 L${cx + 7} 7 L${cx + 11} 2 L${cx + 13} 11Z" fill="${color}"/>`;
    case "kerudung": return `<path d="M${cx - 10} 24 Q${cx - 11} 5 ${cx} 5 Q${cx + 11} 5 ${cx + 10} 24 L${cx + 6} 20 Q${cx} 26 ${cx - 6} 20Z" fill="${color}"/>`;
    case "tengkuluk": return `${hair}<path d="M${cx - 13} 8 Q${cx - 6} 12 ${cx} 9 Q${cx + 6} 12 ${cx + 13} 8 L${cx + 9} 14 Q${cx} 10 ${cx - 9} 14Z" fill="${color}"/>`;
    case "mahkota": return `${hair}<path d="M${cx - 8} 10 L${cx - 8} 3 L${cx - 4} 7 L${cx} 0 L${cx + 4} 7 L${cx + 8} 3 L${cx + 8} 10Z" fill="${color}"/>`;
    case "bulu": return `${hair}<path d="M${cx - 9} 10 h18" stroke="${color}" stroke-width="3.5"/>${[-6, -2, 2, 6].map((dx, i) => `<path d="M${cx + dx} 9 L${cx + dx * 1.7} -5" stroke="${i % 2 ? "#f4f1e8" : "#b8322a"}" stroke-width="2" stroke-linecap="round"/>`).join("")}`;
    default: return hair;
  }
}

// Satu figur dalam kotak 44 x 112, digeser ke kanan sebanyak ox.
function figure(sex, look, ox, ids, skin) {
  const cx = ox + 22;
  const shade = `url(#${ids.shade})`;
  const topFill = look.topPattern ? `url(#${ids.top})` : look.top;
  const kainFill = `url(#${ids.kain})`;
  const isRumbai = look.kainPattern === "rumbai";
  const legs = `<rect x="${cx - 7}" y="94" width="5" height="12" fill="${isRumbai || sex === "f" ? skin : look.pants || "#1e1a17"}"/><rect x="${cx + 2}" y="94" width="5" height="12" fill="${isRumbai || sex === "f" ? skin : look.pants || "#1e1a17"}"/><ellipse cx="${cx - 4.5}" cy="107" rx="4" ry="1.8" fill="#2b1d14"/><ellipse cx="${cx + 4.5}" cy="107" rx="4" ry="1.8" fill="#2b1d14"/>`;

  let body;
  if (sex === "m") {
    const pants = isRumbai ? "" : `<path d="M${cx - 10} 58 L${cx + 10} 58 L${cx + 9} 96 L${cx - 9} 96Z" fill="${look.pants || "#1e1a17"}"/>`;
    const kainBottom = isRumbai ? 94 : look.kainLong ? 96 : 78;
    const kain = `<path d="M${cx - 12} 56 L${cx + 12} 56 L${cx + 13} ${kainBottom} L${cx - 13} ${kainBottom}Z" fill="${kainFill}"/><path d="M${cx - 12} 56 L${cx + 12} 56 L${cx + 13} ${kainBottom} L${cx - 13} ${kainBottom}Z" fill="${shade}"/>`;
    const torso = look.top === "skin"
      ? `<path d="M${cx - 13} 30 Q${cx} 25 ${cx + 13} 30 L${cx + 11} 58 L${cx - 11} 58Z" fill="${skin}"/><path d="M${cx - 9} 33 Q${cx} 42 ${cx + 9} 33" fill="none" stroke="${look.accent || GOLD}" stroke-width="2.2"/>`
      : `<path d="M${cx - 13} 30 Q${cx} 25 ${cx + 13} 30 L${cx + 11} 60 L${cx - 11} 60Z" fill="${topFill}"/><path d="M${cx - 13} 30 Q${cx} 25 ${cx + 13} 30 L${cx + 11} 60 L${cx - 11} 60Z" fill="${shade}"/><path d="M${cx} 28 V58" stroke="${look.accent || GOLD}" stroke-width="1"/>`;
    const sleeve = look.top === "skin" ? skin : topFill;
    const arms = `<path d="M${cx - 13} 30 L${cx - 18} 56 L${cx - 14} 57 L${cx - 10} 34Z" fill="${sleeve}"/><path d="M${cx + 13} 30 L${cx + 18} 56 L${cx + 14} 57 L${cx + 10} 34Z" fill="${sleeve}"/><circle cx="${cx - 16}" cy="58" r="2.6" fill="${skin}"/><circle cx="${cx + 16}" cy="58" r="2.6" fill="${skin}"/>`;
    const sash = look.sash ? `<path d="M${cx - 11} 30 L${cx - 6} 30 L${cx + 11} 56 L${cx + 6} 57Z" fill="${look.sash}"/>` : "";
    const keris = look.keris ? `<path d="M${cx + 6} 50 l7 -9" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>` : "";
    body = `${legs}${pants}${kain}${arms}${torso}${sash}${keris}`;
  } else {
    const kain = `<path d="M${cx - 11} 54 L${cx + 11} 54 L${cx + 10} 98 L${cx - 10} 98Z" fill="${kainFill}"/><path d="M${cx - 11} 54 L${cx + 11} 54 L${cx + 10} 98 L${cx - 10} 98Z" fill="${shade}"/>`;
    const bodo = look.style === "bodo";
    const torsoPath = bodo
      ? `M${cx - 16} 29 Q${cx} 25 ${cx + 16} 29 L${cx + 14} 60 L${cx - 14} 60Z`
      : `M${cx - 11} 29 Q${cx} 25 ${cx + 11} 29 L${cx + 13} ${look.style === "labuh" ? 80 : 64} L${cx - 13} ${look.style === "labuh" ? 80 : 64}Z`;
    const torso = look.top === "skin"
      ? `<path d="M${cx - 11} 29 Q${cx} 25 ${cx + 11} 29 L${cx + 10} 55 L${cx - 10} 55Z" fill="${skin}"/><path d="M${cx - 10} 36 h20 v8 h-20Z" fill="${kainFill}"/><path d="M${cx - 8} 32 Q${cx} 40 ${cx + 8} 32" fill="none" stroke="${look.accent || GOLD}" stroke-width="2"/>`
      : `<path d="${torsoPath}" fill="${topFill}" ${bodo ? 'opacity="0.92"' : ""}/><path d="${torsoPath}" fill="${shade}"/><path d="M${cx - 5} 29 L${cx} 40 L${cx + 5} 29" fill="none" stroke="${look.accent || GOLD}" stroke-width="1.4"/>`;
    const sleeveColor = look.top === "skin" || bodo ? skin : topFill;
    const arms = `<path d="M${cx - 11} 30 L${cx - 16} 56 L${cx - 12} 57 L${cx - 8} 34Z" fill="${sleeveColor}"/><path d="M${cx + 11} 30 L${cx + 16} 56 L${cx + 12} 57 L${cx + 8} 34Z" fill="${sleeveColor}"/><circle cx="${cx - 14}" cy="58" r="2.4" fill="${skin}"/><circle cx="${cx + 14}" cy="58" r="2.4" fill="${skin}"/>`;
    const sash = look.sash ? `<path d="M${cx + 9} 29 L${cx + 13} 29 L${cx + 16} 70 L${cx + 12} 70Z" fill="${look.sash}"/>` : "";
    const noken = look.noken ? `<path d="M${cx - 10} 30 Q${cx - 18} 50 ${cx - 14} 66 L${cx - 4} 66 Q${cx - 2} 50 ${cx - 6} 30" fill="#b48a52" opacity="0.95"/><path d="M${cx - 13} 50 h8 M${cx - 13} 56 h8 M${cx - 13} 62 h8" stroke="#7a5630" stroke-width="0.8"/>` : "";
    body = `${legs}${kain}${arms}${torso}${sash}${noken}`;
  }
  const neck = `<rect x="${cx - 3}" y="22" width="6" height="7" fill="${skin}"/>`;
  const face = `<circle cx="${cx}" cy="17" r="8" fill="${skin}"/><circle cx="${cx - 3}" cy="17" r="0.9" fill="#2b1d14"/><circle cx="${cx + 3}" cy="17" r="0.9" fill="#2b1d14"/><path d="M${cx - 2} 20.5 Q${cx} 22 ${cx + 2} 20.5" fill="none" stroke="#7a3b2a" stroke-width="0.7"/>`;
  const head = sex === "m" ? maleHead(look.head, look.headColor || "#1e1a17", cx) : femaleHead(look.head, look.headColor || GOLD, cx);
  return `${body}${neck}${face}${head}`;
}

const L = (look) => look;
// m: pria, f: wanita. top: warna atasan (atau "skin" untuk dada terbuka), topPattern/kainPattern: motif.
export const COSTUMES = {
  "aceh": { m: L({ head: "meukeutop", top: "#1b1b1b", accent: GOLD, kain: "#8e1f2a", kainPattern: "songket", pants: "#1b1b1b", keris: true }), f: L({ head: "mahkota", top: "#b3263a", kain: "#4b2a6b", kainPattern: "songket" }) },
  "sumatera-utara": { m: L({ head: "destar", headColor: "#8e1b1b", top: "#1b1b1b", kain: "#7a1414", kainPattern: "ikat", kainAccent: "#f1e3c6", sash: "#8e1b1b" }), f: L({ head: "tengkuluk", headColor: "#8e1b1b", top: "#7a1414", kain: "#1b1b1b", kainPattern: "ikat", kainAccent: "#e0c08a", sash: "#3a1a14" }) },
  "sumatera-barat": { m: L({ head: "destar", headColor: "#1b1b1b", top: "#1b1b1b", kain: "#9b1c22", kainPattern: "songket", pants: "#1b1b1b", sash: "#9b1c22" }), f: L({ head: "suntiang", headColor: GOLD, top: "#a5162a", kain: "#a5162a", kainPattern: "songket" }) },
  "riau": { m: L({ head: "tanjak", headColor: "#d4a017", top: "#e0b21d", accent: "#7a4a00", kain: "#7a1b1b", kainPattern: "songket", pants: "#e0b21d" }), f: L({ head: "sanggul", headColor: "#e0b21d", top: "#2f7a4a", style: "labuh", kain: "#7a1b1b", kainPattern: "songket" }) },
  "kepulauan-riau": { m: L({ head: "tanjak", headColor: "#1d4f8a", top: "#2a64a8", kain: "#d9a62e", kainPattern: "songket", kainAccent: "#7a1b1b", pants: "#2a64a8" }), f: L({ head: "sanggul", headColor: "#d9a62e", top: "#b0283a", style: "labuh", kain: "#3a2a6a", kainPattern: "songket" }) },
  "jambi": { m: L({ head: "tanjak", headColor: "#a01f2b", top: "#a01f2b", kain: "#3b2a6b", kainPattern: "batik", kainAccent: GOLD, pants: "#a01f2b" }), f: L({ head: "mahkota", top: "#b5203a", kain: "#3b2a6b", kainPattern: "batik" }) },
  "sumatera-selatan": { m: L({ head: "mahkota", top: "#a4161f", topPattern: "songket", topAccent: GOLD, kain: "#a4161f", kainPattern: "songket", pants: "#a4161f" }), f: L({ head: "siger", top: "#a4161f", topPattern: "songket", topAccent: GOLD, kain: "#a4161f", kainPattern: "songket" }) },
  "bengkulu": { m: L({ head: "peci", top: "#1b1b1b", kain: "#7a1f3a", kainPattern: "batik", pants: "#1b1b1b" }), f: L({ head: "sanggul", headColor: "#d14a7a", top: "#d14a7a", kain: "#6b1f3a", kainPattern: "batik" }) },
  "lampung": { m: L({ head: "mahkota", top: "#f2ece0", accent: GOLD, kain: "#8a1f1f", kainPattern: "songket", pants: "#f2ece0", sash: GOLD }), f: L({ head: "siger", top: "#f2ece0", kain: "#8a1f1f", kainPattern: "songket", sash: GOLD }) },
  "kepulauan-bangka-belitung": { m: L({ head: "peci", top: "#b3263a", kain: "#3a6b8a", kainPattern: "songket", pants: "#b3263a" }), f: L({ head: "mahkota", top: "#b3263a", kain: "#3a6b8a", kainPattern: "songket" }) },
  "banten": { m: L({ head: "destar", headColor: "#2a1f17", top: "#1b1b1b", kain: "#5a3a22", kainPattern: "batik", pants: "#1b1b1b" }), f: L({ head: "sanggul", headColor: "#f4f1e8", top: "#2a5b8a", kain: "#5a3a22", kainPattern: "batik" }) },
  "dki-jakarta": { m: L({ head: "peci", top: "#f4f1e8", accent: "#c9a37a", kain: "#7a1f2a", kainPattern: "kotak", kainAccent: "#e8c77a", pants: "#2b2b2b", sash: "#7a1f2a" }), f: L({ head: "sanggul", headColor: "#e0457a", top: "#f4f1e8", accent: "#e0457a", kain: "#1f5a47", kainPattern: "batik", sash: "#e0457a" }) },
  "jawa-barat": { m: L({ head: "destar", headColor: "#5a3a22", top: "#1b1b1b", kain: "#5a3a22", kainPattern: "parang", kainAccent: "#e8d6b0", pants: "#1b1b1b", keris: true }), f: L({ head: "sanggul", headColor: GOLD, top: "#2f7a4a", kain: "#5a3a22", kainPattern: "parang" }) },
  "jawa-tengah": { m: L({ head: "blangkon", headColor: "#3b2414", top: "#1b1b1b", kain: "#5a3220", kainPattern: "parang", kainAccent: "#e8d6b0", kainLong: true, keris: true }), f: L({ head: "sanggul", headColor: GOLD, top: "#1b1b1b", accent: GOLD, kain: "#5a3220", kainPattern: "parang" }) },
  "daerah-istimewa-yogyakarta": { m: L({ head: "blangkon", headColor: "#3b2414", top: "#5a3a22", topPattern: "lurik", topAccent: "#e8d6b0", kain: "#4a2a18", kainPattern: "parang", kainAccent: "#e8d6b0", kainLong: true, keris: true }), f: L({ head: "sanggul", headColor: GOLD, top: "#6b1f2a", kain: "#4a2a18", kainPattern: "parang" }) },
  "jawa-timur": { m: L({ head: "destar", headColor: "#5a3220", top: "#d63a3a", topPattern: "lurik", topAccent: "#f4f1e8", kain: "#1b1b1b", kainPattern: "kotak", kainAccent: "#7a1f2a", pants: "#1b1b1b" }), f: L({ head: "sanggul", headColor: "#d63a3a", top: "#d63a3a", kain: "#3a2a1a", kainPattern: "batik" }) },
  "bali": { m: L({ head: "udeng", headColor: "#f4f1e8", top: "#f4f1e8", kain: "#d9a62e", kainPattern: "songket", kainAccent: "#8e1f2a", kainLong: true, sash: "#8e1f2a" }), f: L({ head: "mahkota", top: "#8e1f2a", topPattern: "songket", topAccent: GOLD, kain: "#d9a62e", kainPattern: "songket", kainAccent: "#8e1f2a" }) },
  "nusa-tenggara-barat": { m: L({ head: "destar", headColor: "#1b1b1b", top: "#1b1b1b", kain: "#2f6b4a", kainPattern: "songket", pants: "#1b1b1b" }), f: L({ head: "sanggul", headColor: GOLD, top: "#1b1b1b", accent: GOLD, kain: "#2f6b4a", kainPattern: "songket" }) },
  "nusa-tenggara-timur": { m: L({ head: "destar", headColor: "#8e2a1c", top: "#f4f1e8", kain: "#3a1f17", kainPattern: "ikat", kainAccent: "#d98a3a", kainLong: true, sash: "#8e2a1c" }), f: L({ head: "sanggul", headColor: GOLD, top: "#8e2a1c", kain: "#3a1f17", kainPattern: "ikat", kainAccent: "#d98a3a" }) },
  "kalimantan-barat": { m: L({ head: "bulu", headColor: "#7a4a22", top: "#7a4a22", topPattern: "manik", topAccent: "#f4f1e8", kain: "#7a4a22", kainPattern: "manik", kainAccent: "#1b1b1b" }), f: L({ head: "bulu", headColor: "#7a4a22", top: "#7a4a22", topPattern: "manik", topAccent: "#f4f1e8", kain: "#7a4a22", kainPattern: "manik", kainAccent: "#b8322a" }) },
  "kalimantan-tengah": { m: L({ head: "bulu", headColor: "#5a3a1a", top: "#8a5a2a", topPattern: "manik", topAccent: "#e8c77a", kain: "#5a3a1a", kainPattern: "ikat", kainAccent: "#e8c77a" }), f: L({ head: "bulu", headColor: "#8a5a2a", top: "#8a5a2a", topPattern: "manik", topAccent: "#e8c77a", kain: "#5a3a1a", kainPattern: "ikat" }) },
  "kalimantan-selatan": { m: L({ head: "mahkota", top: "#e0b21d", accent: "#7a4a00", kain: "#7a2f8a", kainPattern: "ikat", kainAccent: "#f2c94c", pants: "#e0b21d" }), f: L({ head: "sanggul", headColor: "#e0b21d", top: "#e0b21d", kain: "#7a2f8a", kainPattern: "ikat", kainAccent: "#f2c94c" }) },
  "kalimantan-timur": { m: L({ head: "bulu", headColor: "#1b1b1b", top: "#1b1b1b", topPattern: "manik", topAccent: "#f4f1e8", kain: "#1b1b1b", kainPattern: "manik", kainAccent: "#e8c77a" }), f: L({ head: "bulu", headColor: "#1b1b1b", top: "#1b1b1b", topPattern: "manik", topAccent: "#e8c77a", kain: "#1b1b1b", kainPattern: "manik", kainAccent: "#f4f1e8" }) },
  "kalimantan-utara": { m: L({ head: "bulu", headColor: "#2a4a2a", top: "#2a4a2a", topPattern: "manik", topAccent: "#e8c77a", kain: "#2a4a2a", kainPattern: "manik", kainAccent: "#f4f1e8" }), f: L({ head: "bulu", headColor: "#2a4a2a", top: "#b8322a", topPattern: "manik", topAccent: "#f4f1e8", kain: "#2a4a2a", kainPattern: "manik" }) },
  "sulawesi-utara": { m: L({ head: "destar", headColor: GOLD, top: "#1b1b1b", kain: "#7a1f2a", kainPattern: "ikat", pants: "#1b1b1b" }), f: L({ head: "mahkota", top: "#f4f1e8", accent: GOLD, kain: "#7a1f2a", kainPattern: "ikat" }) },
  "gorontalo": { m: L({ head: "destar", headColor: "#5a2a7a", top: "#5a2a7a", kain: "#e0b21d", kainPattern: "songket", pants: "#5a2a7a" }), f: L({ head: "mahkota", top: "#5a2a7a", kain: "#e0b21d", kainPattern: "songket", kainAccent: "#5a2a7a" }) },
  "sulawesi-tengah": { m: L({ head: "destar", headColor: "#d4a017", top: "#d4a017", accent: "#7a1b1b", kain: "#7a1b1b", kainPattern: "kotak", kainAccent: GOLD, pants: "#d4a017" }), f: L({ head: "sanggul", headColor: "#c0392b", top: "#c0392b", style: "bodo", kain: "#7a1b1b", kainPattern: "kotak", kainAccent: GOLD }) },
  "sulawesi-barat": { m: L({ head: "destar", headColor: "#3a1a4a", top: "#1b1b1b", kain: "#3a1a4a", kainPattern: "kotak", kainAccent: "#e8c77a", pants: "#1b1b1b" }), f: L({ head: "mahkota", top: "#d14a7a", style: "bodo", kain: "#3a1a4a", kainPattern: "kotak", kainAccent: "#e8c77a" }) },
  "sulawesi-selatan": { m: L({ head: "peci", headColor: "#1b1b1b", top: "#1b1b1b", kain: "#8e1f2a", kainPattern: "kotak", kainAccent: GOLD, pants: "#1b1b1b", keris: true }), f: L({ head: "sanggul", headColor: GOLD, top: "#2f9a5a", style: "bodo", kain: "#8e1f2a", kainPattern: "kotak", kainAccent: GOLD }) },
  "sulawesi-tenggara": { m: L({ head: "destar", headColor: "#1b1b1b", top: "#f4f1e8", kain: "#1b1b1b", kainPattern: "kotak", kainAccent: "#d9a62e", pants: "#1b1b1b" }), f: L({ head: "mahkota", top: "#b3263a", kain: "#1b1b1b", kainPattern: "kotak", kainAccent: "#d9a62e" }) },
  "maluku": { m: L({ head: "peci", top: "#b3263a", topPattern: "kotak", topAccent: "#f4f1e8", kain: "#1b1b1b", kainPattern: "ikat", kainAccent: "#b3263a", pants: "#1b1b1b" }), f: L({ head: "sanggul", headColor: "#b3263a", top: "#f4f1e8", kain: "#b3263a", kainPattern: "kotak", kainAccent: "#f4f1e8" }) },
  "maluku-utara": { m: L({ head: "peci", top: "#1b1b1b", accent: GOLD, kain: "#3a5a2a", kainPattern: "songket", pants: "#1b1b1b" }), f: L({ head: "sanggul", headColor: GOLD, top: "#e0b21d", kain: "#3a5a2a", kainPattern: "songket" }) },
  "papua": { m: L({ head: "bulu", headColor: "#b8322a", top: "skin", accent: "#f4f1e8", kain: "#c9a35a", kainPattern: "rumbai", kainAccent: "#8a6a2a" }), f: L({ head: "bulu", headColor: "#b8322a", top: "skin", accent: "#f4f1e8", kain: "#c9a35a", kainPattern: "rumbai", kainAccent: "#8a6a2a", noken: true }) },
  "papua-barat": { m: L({ head: "bulu", headColor: "#1b1b1b", top: "skin", accent: "#e8c77a", kain: "#b58a4a", kainPattern: "rumbai", kainAccent: "#6a4a1a" }), f: L({ head: "bulu", headColor: "#1b1b1b", top: "skin", accent: "#e8c77a", kain: "#b58a4a", kainPattern: "rumbai", kainAccent: "#6a4a1a", noken: true }) },
  "papua-barat-daya": { m: L({ head: "bulu", headColor: "#2a5a8a", top: "skin", accent: "#f4f1e8", kain: "#c9a35a", kainPattern: "rumbai", kainAccent: "#2a5a8a" }), f: L({ head: "bulu", headColor: "#2a5a8a", top: "skin", accent: "#f4f1e8", kain: "#c9a35a", kainPattern: "rumbai", kainAccent: "#2a5a8a", noken: true }) },
  "papua-tengah": { m: L({ head: "bulu", headColor: "#e0b21d", top: "skin", accent: "#f4f1e8", kain: "#b58a4a", kainPattern: "rumbai", kainAccent: "#5a3a1a" }), f: L({ head: "bulu", headColor: "#e0b21d", top: "skin", accent: "#f4f1e8", kain: "#b58a4a", kainPattern: "rumbai", kainAccent: "#5a3a1a", noken: true }) },
  "papua-pegunungan": { m: L({ head: "bulu", headColor: "#1b1b1b", top: "skin", accent: "#f4f1e8", kain: "#a8844a", kainPattern: "rumbai", kainAccent: "#4a3216" }), f: L({ head: "bulu", headColor: "#1b1b1b", top: "skin", accent: "#f4f1e8", kain: "#a8844a", kainPattern: "rumbai", kainAccent: "#4a3216", noken: true }) },
  "papua-selatan": { m: L({ head: "bulu", headColor: "#f4f1e8", top: "skin", accent: "#b8322a", kain: "#c9a35a", kainPattern: "rumbai", kainAccent: "#7a1f1f" }), f: L({ head: "bulu", headColor: "#f4f1e8", top: "skin", accent: "#b8322a", kain: "#c9a35a", kainPattern: "rumbai", kainAccent: "#7a1f1f", noken: true }) },
};

let uidCounter = 0;

/** Isi SVG (tanpa tag <svg>) sepasang figur untuk satu provinsi, ukuran 88 x 112. */
export function coupleMarkup(provinceId) {
  const costume = COSTUMES[provinceId];
  if (!costume) return "";
  uidCounter += 1;
  const uid = `fg${uidCounter}`;
  const skinIndex = [...provinceId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % SKIN.length;
  const skin = SKIN[provinceId.startsWith("papua") ? 3 : skinIndex];
  const defs = [`<linearGradient id="${uid}-shade" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.32"/></linearGradient>`];
  const idsFor = (who, look) => {
    const ids = { shade: `${uid}-shade`, top: `${uid}-${who}-top`, kain: `${uid}-${who}-kain` };
    defs.push(patternDef(ids.kain, look.kainPattern, look.kain, look.kainAccent || GOLD));
    if (look.topPattern) defs.push(patternDef(ids.top, look.topPattern, look.top, look.topAccent || GOLD));
    return ids;
  };
  const male = figure("m", costume.m, 0, idsFor("m", costume.m), skin);
  const female = figure("f", costume.f, 42, idsFor("f", costume.f), skin);
  const ground = `<ellipse cx="44" cy="108" rx="40" ry="3.5" fill="#000" opacity="0.18"/>`;
  return `<defs>${defs.join("")}</defs>${ground}${male}${female}`;
}

/** Elemen <svg> lengkap untuk dipasang di HTML (panel, kartu). */
export function coupleSvg(provinceId, { label = "" } = {}) {
  const markup = coupleMarkup(provinceId);
  if (!markup) return "";
  return `<svg class="couple" viewBox="0 -10 88 122" role="img" aria-label="${label.replace(/"/g, "")}">${markup}</svg>`;
}
