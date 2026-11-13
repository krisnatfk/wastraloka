// "Lentera Warisan": budaya dan adat yang memudar atau sudah hilang, hanya dari sumber yang bisa ditelusuri
// (UNESCO, Kemendikbudristek/Badan Bahasa via kantor berita, situs pemerintah daerah, media nasional).
// Alasan "mengapa memudar" ditulis sebatas yang disebut sumbernya. Angka mengikuti tahun liputannya.

export const RISK_LEVELS = {
  punah: { label: "Sudah punah", short: "Punah", tone: "punah", order: 0, desc: "Tidak ada lagi penutur atau pelakunya." },
  kritis: { label: "Kritis", short: "Kritis", tone: "kritis", order: 1, desc: "Pelaku atau penerusnya tinggal sangat sedikit." },
  mendesak: { label: "Perlu perlindungan mendesak (UNESCO)", short: "Mendesak", tone: "mendesak", order: 2, desc: "Masuk Daftar Warisan Budaya Takbenda yang Memerlukan Perlindungan Mendesak UNESCO." },
  terancam: { label: "Terancam", short: "Terancam", tone: "terancam", order: 3, desc: "Pewarisannya melemah; sebagian motif, teknik, atau pelakunya mulai hilang." },
};

export const RISK_KINDS = { tradisi: "Seni & tradisi", bahasa: "Bahasa daerah", wastra: "Wastra & kriya" };

const src = (label, url) => ({ label, url });
const UNESCO_SAMAN = src("UNESCO, Saman dance (2011)", "https://ich.unesco.org/en/RL/saman-dance-00509");
const UNESCO_NOKEN = src("UNESCO, Noken (2012)", "https://ich.unesco.org/en/USL/noken-multifunctional-knotted-or-woven-bag-handcraft-of-the-people-of-papua-00619");
const UNESCO_REOG = src("UNESCO, Reog Ponorogo performing art (2024)", "https://ich.unesco.org/en/USL/reog-ponorogo-performing-art-01969");
const BAHASA_PUNAH = src("Antara: Kemendikbudristek, 11 bahasa daerah alami kepunahan", "https://www.antaranews.com/berita/4000401/kemendikbudristek-11-bahasa-daerah-di-indonesia-alami-kepunahan");

const LANGUAGE_WHY = "Penuturnya tidak lagi memakai dan mewariskan bahasa ini ke anak cucunya, menurut Kemendikbudristek.";
const LANGUAGE_LESSON = "Bahasa membawa nama tempat, tumbuhan, cerita, dan pengetahuan lokal. Saat bahasa hilang, pengetahuan itu ikut hilang.";

/** @type {Array<{id:string, province:string, name:string, kind:string, level:string, place:string, why:string, note:string, source:{label:string,url:string}}>} */
export const HERITAGE_RISKS = [
  // ---- UNESCO: perlu perlindungan mendesak
  { id: "saman", province: "aceh", name: "Tari Saman", kind: "tradisi", level: "mendesak", place: "Gayo, Aceh",
    why: "Masuk daftar UNESCO yang memerlukan perlindungan mendesak pada 2011; pewarisannya kepada generasi muda dinilai perlu dijaga.",
    note: "Tari duduk berbaris dengan gerak tangan cepat dan syair, milik masyarakat Gayo.", source: UNESCO_SAMAN },
  { id: "noken-papua", province: "papua", name: "Noken", kind: "wastra", level: "mendesak", place: "Tanah Papua",
    why: "Masuk daftar UNESCO yang memerlukan perlindungan mendesak pada 2012. Pembuatnya berkurang dan noken bersaing dengan tas buatan pabrik.",
    note: "Tas rajut atau anyam dari serat kayu dan daun, dibuat tangan oleh masyarakat Papua.", source: UNESCO_NOKEN },
  { id: "noken-papua-barat", province: "papua-barat", name: "Noken", kind: "wastra", level: "mendesak", place: "Tanah Papua",
    why: "Masuk daftar UNESCO yang memerlukan perlindungan mendesak pada 2012. Pembuatnya berkurang dan noken bersaing dengan tas buatan pabrik.",
    note: "UNESCO mencatat noken sebagai warisan masyarakat di Provinsi Papua dan Papua Barat.", source: UNESCO_NOKEN },
  { id: "reog", province: "jawa-timur", name: "Reog Ponorogo", kind: "tradisi", level: "mendesak", place: "Ponorogo, Jawa Timur",
    why: "Masuk daftar UNESCO yang memerlukan perlindungan mendesak pada Desember 2024. UNESCO mencatat makin sulit menemukan maestro Reog dan generasi muda lebih memilih seni kontemporer.",
    note: "Seni pertunjukan dengan topeng dadak merak raksasa yang diangkat penari dengan gigitan.", source: UNESCO_REOG },

  // ---- Bahasa daerah yang sudah punah (Badan Bahasa)
  ...[
    ["kajeli", "Bahasa Kajeli (Kayeli)"], ["piru", "Bahasa Piru"], ["moksela", "Bahasa Moksela"], ["palumata", "Bahasa Palumata"],
    ["hukumina", "Bahasa Hukumina"], ["hoti", "Bahasa Hoti"], ["serua", "Bahasa Serua"], ["nila", "Bahasa Nila"],
  ].map(([id, name]) => ({ id: `bahasa-${id}`, province: "maluku", name, kind: "bahasa", level: "punah", place: "Maluku", why: LANGUAGE_WHY, note: LANGUAGE_LESSON, source: BAHASA_PUNAH })),
  { id: "bahasa-ternateno", province: "maluku-utara", name: "Bahasa Ternateno", kind: "bahasa", level: "punah", place: "Maluku Utara", why: LANGUAGE_WHY, note: LANGUAGE_LESSON, source: BAHASA_PUNAH },
  { id: "bahasa-mawes", province: "papua", name: "Bahasa Mawes", kind: "bahasa", level: "punah", place: "Papua", why: LANGUAGE_WHY, note: LANGUAGE_LESSON, source: BAHASA_PUNAH },
  { id: "bahasa-tandia", province: "papua-barat", name: "Bahasa Tandia", kind: "bahasa", level: "punah", place: "Papua Barat", why: LANGUAGE_WHY, note: LANGUAGE_LESSON, source: BAHASA_PUNAH },

  // ---- Wastra yang penerusnya tinggal sedikit
  { id: "kluwung-gendong", province: "jawa-tengah", name: "Tenun Kluwung Gendong", kind: "wastra", level: "kritis", place: "Desa Tajug, Karangmoncol, Purbalingga",
    why: "Pada 2020 tercatat hanya sekitar enam warga yang masih menenunnya, itu pun sebagai pekerjaan sampingan.",
    note: "Dinamai \"gendong\" karena dipakai untuk menggendong barang dagangan atau anak kecil.",
    source: src("Pemprov Jawa Tengah: Kain Tenun Kluwung Gendong yang Semakin Langka (2020)", "https://jatengprov.go.id/beritadaerah/kain-tenun-kluwung-gendong-yang-semakin-langka/") },
  { id: "gadod", province: "jawa-barat", name: "Tenun Gadod", kind: "wastra", level: "kritis", place: "Majalengka, Jawa Barat",
    why: "Kekurangan penenun membuat kain khas Majalengka ini terancam punah; pada 2021 tinggal sangat sedikit penenun yang menguasainya.",
    note: "Kain tenun tradisional khas Majalengka.",
    source: src("detikJabar: Tenun Gadod, Kain Khas Majalengka yang Terancam Punah (2021)", "https://news.detik.com/berita-jawa-barat/d-5718959/tenun-gadod-kain-khas-majalengka-yang-terancam-punah") },
  { id: "gedogan", province: "jawa-barat", name: "Tenun Gedogan Indramayu", kind: "wastra", level: "kritis", place: "Desa Juntikebon, Indramayu",
    why: "Diberitakan hanya satu penenun lanjut usia yang masih aktif di desanya, dan mencari penerus tidak mudah.",
    note: "Tenun gedogan ditenun dengan alat tenun tradisional yang dipangku.",
    source: src("detikJabar: Merajut Generasi Baru di Sisa Helai Tenun Gedogan Indramayu", "https://www.detik.com/jabar/cirebon-raya/d-8176882/merajut-generasi-baru-di-sisa-helai-tenun-gedogan-indramayu") },
  { id: "batik-gedog", province: "jawa-timur", name: "Batik Gedog Tuban", kind: "wastra", level: "terancam", place: "Tuban, Jawa Timur",
    why: "Menghadapi krisis regenerasi penenun: keahlian menenun kain gedog berisiko hilang tanpa generasi penerus.",
    note: "Batik di atas kain tenun gedog buatan tangan.",
    source: src("GNFI: Krisis Regenerasi Penenun Kain Batik Gedog Tuban (2024)", "https://www.goodnewsfromindonesia.id/2024/03/10/krisis-regenerasi-penenun-kain-batik-gedog-tuban-ancaman-atau-tantangan") },
  { id: "tenun-sembalun", province: "nusa-tenggara-barat", name: "Tenun Sembalun", kind: "wastra", level: "terancam", place: "Sembalun, Lombok Timur",
    why: "Penenunnya kebanyakan perempuan berusia 50–70 tahun, dan sebagian motif lama mulai terlupakan karena perajin membuat desain baru agar laku.",
    note: "Tenun dari kaki Gunung Rinjani.",
    source: src("GNFI: Upaya dan Tantangan Pelestarian Kain Tenun di Sembalun (2024)", "https://www.goodnewsfromindonesia.id/2024/08/12/mengembalikan-warisan-tenun-yang-luntur-upaya-dan-tantangan-pelestarian-kain-tenun-di-sembalun") },
  { id: "motif-sumba", province: "nusa-tenggara-timur", name: "Motif Tenun Sumba", kind: "wastra", level: "terancam", place: "Sumba, NTT",
    why: "Kemendikbudristek mencatat 16 dari 85 motif tenun Sumba terancam punah, antara lain karena motif tidak didokumentasikan dan produksinya terbatas.",
    note: "Tenun ikat Sumba terkenal dengan motif hewan, manusia, dan simbol kepercayaan Marapu.",
    source: src("Medcom: Tenun Sumba Punya 85 Motif, 16 Terancam Punah (2023)", "https://www.medcom.id/pendidikan/news-pendidikan/wkBjr2lk-tenun-sumba-punya-85-motif-16-terancam-punah") },
];

// Urutan tampil: yang paling bisa ditolong lebih dulu (UNESCO mendesak, kritis, terancam), lalu yang sudah punah.
const DISPLAY_ORDER = { mendesak: 0, kritis: 1, terancam: 2, punah: 3 };
const byDisplay = (a, b) => DISPLAY_ORDER[a.level] - DISPLAY_ORDER[b.level];

/** Bahasa punah dari provinsi yang sama digabung jadi satu kartu supaya daftar tetap ringkas. */
export function groupForDisplay(risks) {
  const out = [];
  const languages = new Map();
  const seen = new Set();
  for (const risk of risks) {
    if (risk.kind !== "bahasa") {
      // warisan yang sama di beberapa provinsi (mis. Noken) cukup tampil sekali
      const key = `${risk.name}|${risk.source.url}`;
      if (!seen.has(key)) out.push(risk);
      seen.add(key);
      continue;
    }
    languages.set(risk.province, [...(languages.get(risk.province) || []), risk]);
  }
  for (const [province, list] of languages) {
    if (list.length === 1) { out.push(list[0]); continue; }
    const [first] = list;
    out.push({
      ...first,
      id: `bahasa-${province}-grup`,
      name: `${list.length} bahasa daerah ${first.place}`,
      why: `${list.map((r) => r.name.replace(/^Bahasa /, "")).join(", ")}. ${first.why}`,
    });
  }
  return out.sort(byDisplay);
}

export const risksForProvince = (provinceId) => HERITAGE_RISKS.filter((r) => r.province === provinceId);

export const riskProvinceIds = () => [...new Set(HERITAGE_RISKS.map((r) => r.province))];

// Lima langkah yang bisa dilakukan siapa saja (dipakai di beranda & halaman provinsi).
export const HELP_ACTIONS = [
  { id: "pelajari", label: "Pelajari", text: "Baca kisahnya sampai habis dan kenali siapa pemilik budayanya." },
  { id: "bagikan", label: "Bagikan", text: "Ceritakan ke teman. Budaya yang dibicarakan tidak mudah dilupakan." },
  { id: "beli", label: "Beli dari perajin", text: "Membeli langsung dari penenun membuat mereka punya alasan untuk terus berkarya." },
  { id: "datangi", label: "Datangi", text: "Kunjungi sanggar, desa tenun, atau pertunjukannya saat berwisata." },
  { id: "belajar", label: "Belajar langsung", text: "Ikut kelas menari, menenun, atau bahasa daerah dari maestronya." },
];
