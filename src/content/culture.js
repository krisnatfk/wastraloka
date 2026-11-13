// Alat musik dan sentra wastra per provinsi.
// Alat musik: detikJogja (3 Feb 2025), merangkum buku "Alat Musik Tradisional Nusantara" (Akhmalul Khuluq)
// dan "Ensiklopedia Mini Alat Musik Tradisional" (Tegar Utama). Sentra: tempat umum yang dikenal luas
// sebagai pusat perajin; BUKAN mitra Wastraloka. Tautan toko berupa pencarian, bukan toko pilihan kami.

export const MUSIC_SOURCE = {
  label: "detikJogja, alat musik tradisional 38 provinsi (2025)",
  url: "https://www.detik.com/jogja/budaya/d-7761408/daftar-alat-musik-tradisional-38-provinsi-di-indonesia-dan-cara-memainkannya",
};

const m = (name, play) => ({ name, play });

export const MUSIC = {
  "aceh": [m("Serune Kalee", "ditiup"), m("Rapai", "dipukul"), m("Arbab", "digesek")],
  "sumatera-utara": [m("Gordang Sambilan", "dipukul"), m("Taganing", "dipukul"), m("Hasapi", "dipetik")],
  "sumatera-barat": [m("Saluang", "ditiup"), m("Talempong", "dipukul"), m("Rabab", "digesek")],
  "riau": [m("Gambus", "dipetik"), m("Nafiri", "ditiup")],
  "kepulauan-riau": [m("Gendang Panjang", "dipukul")],
  "jambi": [m("Kelintang Kayu", "dipukul"), m("Serangko", "ditiup"), m("Cangor", "dipukul dan dipetik")],
  "sumatera-selatan": [m("Akordeon", "dipompa dan ditekan")],
  "bengkulu": [m("Dol", "dipukul"), m("Tassa", "dipukul")],
  "lampung": [m("Gamolan", "dipukul"), m("Kompang", "dipukul")],
  "kepulauan-bangka-belitung": [m("Gendang Melayu", "dipukul")],
  "banten": [m("Rampak Bedug", "dipukul"), m("Dogdog Lojor", "dipukul"), m("Terbang Gede", "dipukul")],
  "dki-jakarta": [m("Tanjidor", "ditiup dan dipukul"), m("Tehyan", "digesek")],
  "jawa-barat": [m("Angklung", "digoyangkan"), m("Kecapi", "dipetik"), m("Karinding", "ditiup dan dipukul")],
  "jawa-tengah": [m("Gamelan Jawa", "dipukul, ditiup, dan digesek"), m("Siter", "dipetik")],
  "daerah-istimewa-yogyakarta": [m("Gendang", "dipukul"), m("Rebab", "digesek")],
  "jawa-timur": [m("Saronen", "ditiup"), m("Bonang", "dipukul"), m("Terompet Reog", "ditiup")],
  "bali": [m("Gamelan Bali", "dipukul"), m("Rindik", "dipukul"), m("Ceng-ceng", "dipukul")],
  "nusa-tenggara-barat": [m("Gendang Beleq", "dipukul"), m("Genggong", "ditiup")],
  "nusa-tenggara-timur": [m("Sasando", "dipetik"), m("Foy Doa", "ditiup"), m("Heo", "digesek")],
  "kalimantan-barat": [m("Sape", "dipetik")],
  "kalimantan-tengah": [m("Garantung", "dipukul"), m("Kacapi", "dipetik")],
  "kalimantan-selatan": [m("Panting", "dipetik"), m("Kintung", "dihentakkan")],
  "kalimantan-timur": [m("Sampe", "dipetik"), m("Kadire", "ditiup")],
  "kalimantan-utara": [m("Jatung Utang", "dipukul")],
  "sulawesi-utara": [m("Kolintang", "dipukul"), m("Salude", "dipetik")],
  "gorontalo": [m("Polopalo", "dipukul atau digetarkan")],
  "sulawesi-tengah": [m("Ganda", "dipukul"), m("Suling", "ditiup")],
  "sulawesi-barat": [m("Kecapi", "dipetik")],
  "sulawesi-selatan": [m("Keso-keso", "digesek"), m("Basi-basi", "ditiup"), m("Ana' Becing", "dibenturkan")],
  "sulawesi-tenggara": [m("Ladolado", "dipukul"), m("Gambus", "dipetik")],
  "maluku": [m("Tifa Totobuang", "dipukul"), m("Fu", "ditiup")],
  "maluku-utara": [m("Korno", "ditiup")],
  "papua": [m("Tifa", "dipukul"), m("Triton", "ditiup"), m("Pikon", "ditiup")],
  "papua-barat": [m("Guoto", "dipetik")],
  "papua-barat-daya": [m("Triton", "ditiup")],
  "papua-tengah": [m("Pikon", "ditiup")],
  "papua-pegunungan": [m("Pikon", "ditiup")],
  "papua-selatan": [m("Tifa", "dipukul")],
};

// Sentra perajin yang dikenal umum. Hanya provinsi yang sentranya bisa kami pastikan dari sumber.
const s = (name, place, wastra, source) => ({ name, place, wastra, source });
export const SENTRA = {
  "sumatera-utara": [s("Desa Lumban Suhi-suhi Toruan", "Pangururan, Samosir", "Ulos", "https://id.wikipedia.org/wiki/Lumban_Suhi_Suhi_Toruan,_Pangururan,_Samosir")],
  "sumatera-barat": [s("Nagari Pandai Sikek", "Tanah Datar", "Songket Pandai Sikek", "https://id.wikipedia.org/wiki/Pandai_Sikek,_X_Koto,_Tanah_Datar")],
  "jawa-barat": [s("Kampung Batik Trusmi", "Plered, Cirebon", "Batik Mega Mendung", "https://id.wikipedia.org/wiki/Trusmi_Wetan,_Plered,_Cirebon")],
  "jawa-tengah": [
    s("Kampung Batik Laweyan", "Surakarta", "Batik Solo", "https://id.wikipedia.org/wiki/Laweyan,_Laweyan,_Surakarta"),
    s("Kampung Batik Kauman", "Pekalongan", "Batik Pekalongan", "https://id.wikipedia.org/wiki/Kauman,_Pekalongan_Timur,_Pekalongan"),
  ],
  "daerah-istimewa-yogyakarta": [s("Kampung Batik Giriloyo", "Wukirsari, Imogiri, Bantul", "Batik tulis", "https://id.wikipedia.org/wiki/Wukirsari,_Imogiri,_Bantul")],
  "jawa-timur": [s("Sentra Batik Tanjung Bumi", "Bangkalan, Madura", "Batik Madura", "https://id.wikipedia.org/wiki/Tanjung_Bumi,_Bangkalan")],
  "bali": [s("Desa Tenganan Pegringsingan", "Manggis, Karangasem", "Gringsing", "https://id.wikipedia.org/wiki/Tenganan_Pegringsingan,_Karangasem")],
  "nusa-tenggara-barat": [s("Desa Sukarara", "Jonggat, Lombok Tengah", "Tenun Sasak", "https://id.wikipedia.org/wiki/Sukarara,_Jonggat,_Lombok_Tengah")],
  "kalimantan-selatan": [s("Kampung Sasirangan", "Banjarmasin", "Sasirangan", "https://id.wikipedia.org/wiki/Sasirangan")],
  "kalimantan-timur": [s("Kampung Tenun Samarinda", "Samarinda Seberang", "Sarung Samarinda", "https://id.wikipedia.org/wiki/Sarung_Samarinda")],
  "sulawesi-selatan": [s("Sentra Sutra Sengkang", "Wajo", "Lipa Sabbe", "https://id.wikipedia.org/wiki/Sengkang_(kota)")],
  "papua": [s("Kampung Asei", "Danau Sentani, Jayapura", "Lukisan kulit kayu", "https://id.wikipedia.org/wiki/Asei_Besar,_Sentani_Timur,_Jayapura")],
};

// Tautan pencarian toko (hasilnya dari Google Maps / marketplace, bukan daftar pilihan kami)
export function shopSearches(province) {
  const wastra = province.wastra.find((w) => w.verified)?.name ?? province.wastra[0]?.name ?? "kain tradisional";
  const q = (text) => encodeURIComponent(text);
  return [
    { label: `Toko ${wastra} di ${province.capital}`, kind: "Google Maps", url: `https://www.google.com/maps/search/${q(`toko ${wastra} ${province.capital}`)}` },
    { label: `${wastra} di Tokopedia`, kind: "Tokopedia", url: `https://www.tokopedia.com/search?q=${q(wastra)}` },
    { label: `${wastra} di Shopee`, kind: "Shopee", url: `https://shopee.co.id/search?keyword=${q(wastra)}` },
  ];
}

export const sentraMapUrl = (sentra) => `https://www.google.com/maps/search/${encodeURIComponent(`${sentra.name} ${sentra.place}`)}`;

// Senjata tradisional: detikJogja (2024). Makanan khas: detikEdu (2022), merangkum buku Tata Boga
// dan e-modul Badan Bahasa. null = sumber belum menyebut khusus untuk provinsi itu.
export const WEAPON_SOURCE = { label: "detikJogja, 38 senjata tradisional tiap provinsi", url: "https://www.detik.com/jogja/budaya/d-7668676/38-senjata-tradisional-dan-asalnya-dari-tiap-provinsi-di-indonesia" };
export const FOOD_SOURCE = { label: "detikEdu, makanan khas 38 provinsi", url: "https://www.detik.com/edu/detikpedia/d-6476079/lengkap-makanan-khas-indonesia-dari-38-provinsi-bisa-dicoba-saat-libur-nataru" };

export const WEAPONS = {
  "aceh": "Rencong", "sumatera-utara": "Pedang Si Ular", "sumatera-barat": "Karambit", "riau": "Pedang Jenawi",
  "kepulauan-riau": "Badik Tumbuk Lado", "jambi": "Keris Siginjai", "sumatera-selatan": "Tombak Trisula",
  "kepulauan-bangka-belitung": "Siwar Panjang", "bengkulu": "Rodos", "lampung": "Terapang",
  "kalimantan-barat": "Sipet", "kalimantan-timur": "Mandau", "kalimantan-tengah": "Lonjo",
  "kalimantan-selatan": "Keris Bujak Beliung", "kalimantan-utara": "Kupang Mandau", "dki-jakarta": "Golok",
  "banten": "Congkrang", "jawa-barat": "Kujang", "jawa-tengah": "Condroso", "jawa-timur": "Clurit",
  "daerah-istimewa-yogyakarta": "Keris Patrem", "bali": "Wedhung", "nusa-tenggara-barat": "Klewang",
  "nusa-tenggara-timur": "Sundu", "gorontalo": "Baladu", "sulawesi-barat": "Badek", "sulawesi-selatan": "Bessing",
  "sulawesi-tengah": "Guma", "sulawesi-tenggara": "Parang Taawu", "sulawesi-utara": "Pedang Bara Sangihe",
  "papua": "Belati Tulang Kasuari", "papua-barat": "Busur dan Panah", "papua-barat-daya": "Kapak",
  "papua-pegunungan": "Parang", "papua-selatan": "Pisuwe", "papua-tengah": "Pisau Belati",
  "maluku": "Salawaku", "maluku-utara": "Kalawai",
};

export const FOODS = {
  "aceh": "Mi Aceh", "sumatera-utara": "Bika Ambon", "sumatera-barat": "Rendang", "jambi": "Gulai Ikan Patin",
  "bengkulu": "Pendap", "riau": "Gulai Belacan", "kepulauan-riau": "Otak-otak", "sumatera-selatan": "Pempek",
  "kepulauan-bangka-belitung": "Mi Bangka", "lampung": "Seruit", "banten": "Sate Bandeng", "dki-jakarta": "Kerak Telor",
  "jawa-barat": "Karedok", "jawa-tengah": "Lumpia", "daerah-istimewa-yogyakarta": "Gudeg", "jawa-timur": "Rujak Cingur",
  "bali": "Ayam Betutu", "nusa-tenggara-barat": "Ayam Taliwang", "nusa-tenggara-timur": "Catemak Jagung",
  "kalimantan-barat": "Bubur Pedas Sambas", "kalimantan-tengah": "Juhu Singkah", "kalimantan-selatan": "Soto Banjar",
  "kalimantan-timur": "Ayam Cincane", "kalimantan-utara": "Kepiting Soka", "sulawesi-selatan": "Sup Konro",
  "sulawesi-tengah": "Ikan Jantung Pisang", "sulawesi-tenggara": "Lapa-lapa", "sulawesi-barat": "Bolu Paranggi",
  "gorontalo": "Binte Biluhuta", "sulawesi-utara": "Tinutuan", "maluku": "Ikan Asar", "maluku-utara": "Gohu Ikan",
  "papua-barat": "Ikan Bakar Manokwari", "papua-tengah": "Kue Sagu", "papua": "Papeda",
  "papua-barat-daya": null, "papua-pegunungan": null, "papua-selatan": null,
};
