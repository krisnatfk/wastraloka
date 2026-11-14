// Katalog wastra bawaan cermin. Foto ditampilkan langsung dari Wikimedia Commons (tidak diunduh);
// nama fotografer & lisensi wajib tampil di kartu (lihat CREDITS.md).
// cat "kain" = eksperimen: motif kain lembaran dipakaikan AI sebagai atasan.

export const WASTRA_CATALOG = [
  {
    id: "w-tiga-negeri", cat: "top", tag: "BATIK", name: "Kemeja batik Tiga Negeri", province: "jawa-tengah",
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Kemeja_batik_Tiga_Negeri.jpg/960px-Kemeja_batik_Tiga_Negeri.jpg",
    prompt: "Wearing a long-sleeve Indonesian batik shirt in the Tiga Negeri pattern shown in the reference image: diagonal parang bands in orange, maroon and navy blue with small white flowers, maroon cuffs, button front, untucked.",
    about: "Batik pesisir tiga warna: merah khas Lasem, biru, dan cokelat soga khas Solo. Sumber berbeda pendapat soal di kota mana tiap warna dicelup.",
    credit: { artist: "Rifacan14", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Kemeja_batik_Tiga_Negeri.jpg" },
  },
  {
    id: "w-batik-lukis", cat: "top", tag: "BATIK", name: "Kemeja batik tulis lukis", province: null,
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Kemeja_batik_tulis_lukis.jpg/960px-Kemeja_batik_tulis_lukis.jpg",
    prompt: "Wearing a short-sleeve Indonesian hand-painted batik shirt shown in the reference image: large red koi fish and green bamboo leaves on a light blue water pattern, button front, untucked.",
    about: "Batik kontemporer: motif ikan dilukis dengan canting (batik tulis), bukan dicap. Contoh bagaimana batik terus berkembang.",
    credit: { artist: "Batikbumi", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Kemeja_batik_tulis_lukis.jpg" },
  },
  {
    id: "w-tapis", cat: "kain", tag: "TAPIS", name: "Motif Tapis Lampung", province: "lampung", experimental: true,
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Woman%27s_Ceremonial_Skirt_%28Tapis%29_MET_DP145517.jpg/960px-Woman%27s_Ceremonial_Skirt_%28Tapis%29_MET_DP145517.jpg",
    // buang latar abu-abu foto museum, kalau tidak AI ikut mewarnai lengan kebiruan
    refCrop: [0.09, 0.06, 0.81, 0.88],
    prompt: "Wearing a long-sleeve shirt made entirely from the Lampung tapis fabric shown in the reference image: dark brown woven horizontal stripes with cream and gold embroidered bands, sleeves and cuffs in the same brown fabric, button front.",
    about: "Kain tenun kapas bersulam benang emas atau perak. Aslinya dipakai sebagai sarung dalam upacara adat; di sini motifnya dicoba sebagai atasan.",
    credit: { artist: "The Metropolitan Museum of Art", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Woman%27s_Ceremonial_Skirt_(Tapis)_MET_DP145517.jpg" },
  },
  {
    id: "w-sasirangan", cat: "kain", tag: "SASIRANGAN", name: "Motif Sasirangan Banjar", province: "kalimantan-selatan", experimental: true,
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/Kain_Sasirangan_002.JPG/960px-Kain_Sasirangan_002.JPG",
    // foto aslinya berisi 4 kain; AI hanya diberi panel hitam-putih supaya tidak mencampur motif
    refCrop: [0.215, 0.09, 0.265, 0.85],
    prompt: "Wearing a long-sleeve shirt made entirely from the Banjar sasirangan fabric shown in the reference image: black cloth with vertical white tie-dye stripes and small white and blue motifs, sleeves and cuffs in the same fabric, button front.",
    about: "Kain Banjar yang dijelujur mengikuti pola, diikat, lalu dicelup warna. Foto berisi beberapa lembar kain, jadi hasil AI bisa mencampur motif.",
    credit: { artist: "Ezagren", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Kain_Sasirangan_002.JPG" },
  },
];

export const catalogForProvince = (provinceId) => WASTRA_CATALOG.filter((g) => g.province === provinceId);

// Ukuran thumbnail Wikimedia (hanya URL /thumb/ yang bisa diubah lebarnya)
export const wikimediaSized = (src, width) => (src.includes("/thumb/") ? src.replace(/\/\d+px-/, `/${width}px-`) : src);
