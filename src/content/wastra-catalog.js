// Katalog wastra bawaan cermin. Foto ditampilkan langsung dari Wikimedia Commons (tidak diunduh);
// nama fotografer & lisensi wajib tampil di kartu (lihat CREDITS.md).
// cat "kain" = eksperimen: motif kain lembaran dipakaikan AI sebagai atasan.

export const WASTRA_CATALOG = [
  {
    id: "w-tiga-negeri", cat: "top", tag: "BATIK", name: "Kemeja batik Tiga Negeri", province: "jawa-tengah",
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Kemeja_batik_Tiga_Negeri.jpg/960px-Kemeja_batik_Tiga_Negeri.jpg",
    prompt: "Wearing an Indonesian batik shirt with the Tiga Negeri batik pattern shown in the reference image, short sleeves, button front, untucked.",
    about: "Batik pesisir tiga warna: merah khas Lasem, biru, dan cokelat soga khas Solo. Sumber berbeda pendapat soal di kota mana tiap warna dicelup.",
    credit: { artist: "Rifacan14", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Kemeja_batik_Tiga_Negeri.jpg" },
  },
  {
    id: "w-batik-lukis", cat: "top", tag: "BATIK", name: "Kemeja batik tulis lukis", province: null,
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Kemeja_batik_tulis_lukis.jpg/960px-Kemeja_batik_tulis_lukis.jpg",
    prompt: "Wearing an Indonesian hand-painted batik shirt with the fish motif shown in the reference image, short sleeves, button front, untucked.",
    about: "Batik kontemporer: motif ikan dilukis dengan canting (batik tulis), bukan dicap. Contoh bagaimana batik terus berkembang.",
    credit: { artist: "Batikbumi", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Kemeja_batik_tulis_lukis.jpg" },
  },
  {
    id: "w-tapis", cat: "kain", tag: "TAPIS", name: "Motif Tapis Lampung", province: "lampung", experimental: true,
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Woman%27s_Ceremonial_Skirt_%28Tapis%29_MET_DP145517.jpg/960px-Woman%27s_Ceremonial_Skirt_%28Tapis%29_MET_DP145517.jpg",
    prompt: "Wearing a long-sleeve shirt made from the Lampung tapis fabric shown in the reference image, with its woven stripes and gold embroidered bands.",
    about: "Kain tenun kapas bersulam benang emas atau perak. Aslinya dipakai sebagai sarung dalam upacara adat; di sini motifnya dicoba sebagai atasan.",
    credit: { artist: "The Metropolitan Museum of Art", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Woman%27s_Ceremonial_Skirt_(Tapis)_MET_DP145517.jpg" },
  },
  {
    id: "w-sasirangan", cat: "kain", tag: "SASIRANGAN", name: "Motif Sasirangan Banjar", province: "kalimantan-selatan", experimental: true,
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/Kain_Sasirangan_002.JPG/960px-Kain_Sasirangan_002.JPG",
    prompt: "Wearing a long-sleeve shirt made from the colorful Banjar sasirangan tie-dye fabric shown in the reference image.",
    about: "Kain Banjar yang dijelujur mengikuti pola, diikat, lalu dicelup warna. Foto berisi beberapa lembar kain, jadi hasil AI bisa mencampur motif.",
    credit: { artist: "Ezagren", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Kain_Sasirangan_002.JPG" },
  },
];

export const catalogForProvince = (provinceId) => WASTRA_CATALOG.filter((g) => g.province === provinceId);

// Ukuran thumbnail Wikimedia (hanya URL /thumb/ yang bisa diubah lebarnya)
export const wikimediaSized = (src, width) => (src.includes("/thumb/") ? src.replace(/\/\d+px-/, `/${width}px-`) : src);
