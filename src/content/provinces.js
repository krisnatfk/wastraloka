// Data budaya 38 provinsi, diringkas dari sumber publik (lihat SOURCES).
// Prinsip: hanya mencantumkan yang ada di sumber. Item yang belum bisa dipastikan diberi verified: false
// dan tampil berlabel "perlu verifikasi" di halaman, bukan ditebak.

export const SOURCES = {
  pakaian: { label: "CNN Indonesia, 38 baju adat tiap provinsi (2025)", url: "https://www.cnnindonesia.com/edukasi/20250729103045-569-1256112/38-macam-baju-adat-daerah-lengkap-tiap-provinsi-di-indonesia" },
  rumah: { label: "Telkomsel Jelajah Nusantara, 38 rumah adat", url: "https://www.telkomsel.com/jelajah/jelajah-nusantara/38-keanekaragaman-rumah-adat-di-indonesia" },
  tarian: { label: "detikJogja, 38 tarian tradisional tiap provinsi", url: "https://www.detik.com/jogja/budaya/d-7488319/38-tarian-tradisional-beserta-asalnya-dari-tiap-provinsi-di-indonesia" },
  peta: { label: "Peta 38 provinsi, denyherianto (CC BY 4.0)", url: "https://github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces" },
};

export const REGIONS = [
  { id: "sumatera", name: "Sumatera", accent: "#8E2A1C" },
  { id: "jawa", name: "Jawa", accent: "#5A3220" },
  { id: "bali-nusa", name: "Bali & Nusa Tenggara", accent: "#A4561A" },
  { id: "kalimantan", name: "Kalimantan", accent: "#1F5A47" },
  { id: "sulawesi", name: "Sulawesi", accent: "#6E2B4C" },
  { id: "maluku", name: "Maluku", accent: "#1D4E6B" },
  { id: "papua", name: "Papua", accent: "#7A4310" },
];

const w = (name, note = "", verified = true) => ({ name, note, verified });

/** @type {Array<{id:string,name:string,capital:string,region:string,pakaian:string,rumah:string,tarian:string|null,wastra:Array<{name:string,note:string,verified:boolean}>,note?:string}>} */
export const PROVINCES = [
  // Sumatera
  { id: "aceh", name: "Aceh", capital: "Banda Aceh", region: "sumatera", pakaian: "Ulee Balang, dahulu dipakai kaum bangsawan, berhias sulaman benang emas", rumah: "Krong Bade", tarian: "Saman", wastra: [w("Songket Aceh")] },
  { id: "sumatera-utara", name: "Sumatera Utara", capital: "Medan", region: "sumatera", pakaian: "Ulos, kain yang juga menandai status sosial dan kepercayaan", rumah: "Bolon", tarian: "Tor-Tor", wastra: [w("Ulos", "Kain tenun Batak yang diberikan dalam berbagai upacara adat")] },
  { id: "sumatera-barat", name: "Sumatera Barat", capital: "Padang", region: "sumatera", pakaian: "Bundo Kanduang", rumah: "Gadang", tarian: "Tari Piring", wastra: [w("Songket Pandai Sikek"), w("Songket Silungkang")] },
  { id: "riau", name: "Riau", capital: "Pekanbaru", region: "sumatera", pakaian: "Teluk Belanga dan Kebaya Labuh", rumah: "Selaso Jatuh Kembar", tarian: "Zapin", wastra: [w("Songket Siak")] },
  { id: "kepulauan-riau", name: "Kepulauan Riau", capital: "Tanjungpinang", region: "sumatera", pakaian: "Teluk Belanga dan Kebaya Labuh", rumah: "Atap Limas Potong", tarian: "Malemang", wastra: [w("Batik Gonggong")] },
  { id: "jambi", name: "Jambi", capital: "Jambi", region: "sumatera", pakaian: "Baju Kurung Tanggung", rumah: "Panggung", tarian: "Sekapur Sirih", wastra: [w("Batik Jambi")] },
  { id: "sumatera-selatan", name: "Sumatera Selatan", capital: "Palembang", region: "sumatera", pakaian: "Aesan Gede", rumah: "Limas", tarian: "Erai-Erai", wastra: [w("Songket Palembang"), w("Jumputan Palembang")] },
  { id: "bengkulu", name: "Bengkulu", capital: "Bengkulu", region: "sumatera", pakaian: "Rejang Lebong", rumah: "Bubungan Lima", tarian: "Ganau", wastra: [w("Batik Besurek", "Batik bermotif kaligrafi khas Bengkulu")] },
  { id: "lampung", name: "Lampung", capital: "Bandar Lampung", region: "sumatera", pakaian: "Tulang Bawang", rumah: "Nuwo Sesat", tarian: "Cangget", wastra: [w("Tapis", "Tenun kapas bersulam benang emas atau perak (sulam cucuk). Kerumitan motif pernah menjadi penanda status pemakainya."), w("Kain Kapal")] },
  { id: "kepulauan-bangka-belitung", name: "Kepulauan Bangka Belitung", capital: "Pangkalpinang", region: "sumatera", pakaian: "Paksian", rumah: "Rakit", tarian: "Campak", wastra: [w("Tenun Cual")] },
  // Jawa
  { id: "banten", name: "Banten", capital: "Serang", region: "jawa", pakaian: "Baju Pangsi", rumah: "Baduy", tarian: "Cokek", wastra: [w("Batik Banten")] },
  { id: "dki-jakarta", name: "DKI Jakarta", capital: "Jakarta", region: "jawa", pakaian: "Kebaya Encim dan Sadariah", rumah: "Kebaya", tarian: "Topeng Betawi", wastra: [w("Batik Betawi")], note: "Sejak UU No. 2 Tahun 2024 berstatus Daerah Khusus Jakarta. Nama di peta mengikuti data sumber." },
  { id: "jawa-barat", name: "Jawa Barat", capital: "Bandung", region: "jawa", pakaian: "Bedahan dan Kebaya Sunda", rumah: "Kasepuhan", tarian: "Jaipong", wastra: [w("Batik Mega Mendung", "Motif awan khas Cirebon"), w("Batik Garutan")] },
  { id: "jawa-tengah", name: "Jawa Tengah", capital: "Semarang", region: "jawa", pakaian: "Kebaya Jawa", rumah: "Joglo", tarian: "Bedhaya Ketawang", wastra: [w("Batik Tiga Negeri", "Tiga warna: merah (Lasem), biru, dan cokelat soga (Solo). Kisah asal pewarnaannya beragam antarsumber."), w("Batik Pekalongan"), w("Lurik")] },
  { id: "daerah-istimewa-yogyakarta", name: "Daerah Istimewa Yogyakarta", capital: "Yogyakarta", region: "jawa", pakaian: "Kebaya Kesatrian", rumah: "Joglo", tarian: "Serimpi", wastra: [w("Batik Yogyakarta"), w("Lurik")] },
  { id: "jawa-timur", name: "Jawa Timur", capital: "Surabaya", region: "jawa", pakaian: "Pesa'an", rumah: "Joglo", tarian: "Reog Ponorogo", wastra: [w("Batik Madura"), w("Tenun Ikat Kediri")] },
  // Bali & Nusa Tenggara
  { id: "bali", name: "Bali", capital: "Denpasar", region: "bali-nusa", pakaian: "Payas Agung", rumah: "Gapura Candi Bentar", tarian: "Kecak", wastra: [w("Endek"), w("Songket Bali"), w("Gringsing", "Tenun ikat ganda dari Tenganan")] },
  { id: "nusa-tenggara-barat", name: "Nusa Tenggara Barat", capital: "Mataram", region: "bali-nusa", pakaian: "Baju Lambung", rumah: "Dalam Loka", tarian: "Mpaa Lenggo", wastra: [w("Tenun Sasak", "Salah satu sentranya Desa Sukarara, Lombok"), w("Tembe Nggoli", "Sarung tenun Bima")] },
  { id: "nusa-tenggara-timur", name: "Nusa Tenggara Timur", capital: "Kupang", region: "bali-nusa", pakaian: "Baju Amarasi", rumah: "Musalaki", tarian: "Caci", wastra: [w("Tenun Ikat Sumba"), w("Tenun Ikat Flores")] },
  // Kalimantan
  { id: "kalimantan-barat", name: "Kalimantan Barat", capital: "Pontianak", region: "kalimantan", pakaian: "King Baba dan King Tompang", rumah: "Panjang", tarian: "Monong", wastra: [w("Tenun Ikat Sintang"), w("Kain Lunggi", "Tenun khas Sambas")] },
  { id: "kalimantan-tengah", name: "Kalimantan Tengah", capital: "Palangka Raya", region: "kalimantan", pakaian: "Sangkarut", rumah: "Betang", tarian: "Giring-Giring", wastra: [w("Batik Benang Bintik")] },
  { id: "kalimantan-selatan", name: "Kalimantan Selatan", capital: "Banjarbaru", region: "kalimantan", pakaian: "Babaju Kun Galung Pacinan", rumah: "Bubungan Tinggi", tarian: "Gandut", wastra: [w("Sasirangan", "Kain Banjar: dijelujur (dijahit jarang) mengikuti pola, diikat, lalu dicelup. Namanya dari kata sirang, menjelujur.")] },
  { id: "kalimantan-timur", name: "Kalimantan Timur", capital: "Samarinda", region: "kalimantan", pakaian: "Pakaian Kustin", rumah: "Lamin", tarian: "Hudoq", wastra: [w("Ulap Doyo", "Tenun dari serat daun doyo"), w("Sarung Samarinda")] },
  { id: "kalimantan-utara", name: "Kalimantan Utara", capital: "Tanjung Selor", region: "kalimantan", pakaian: "Ta'a dan Sapei Sapaq", rumah: "Baloy", tarian: "Lalatip", wastra: [w("Batik Lulantatibu")] },
  // Sulawesi
  { id: "sulawesi-utara", name: "Sulawesi Utara", capital: "Manado", region: "sulawesi", pakaian: "Laku Tepu", rumah: "Walewangko", tarian: "Maengket", wastra: [w("Kain Bentenan"), w("Kain Koffo")] },
  { id: "gorontalo", name: "Gorontalo", capital: "Gorontalo", region: "sulawesi", pakaian: "Biliu dan Makuta", rumah: "Dulohupa", tarian: "Dana-Dana", wastra: [w("Karawo", "Sulaman iris khas Gorontalo")] },
  { id: "sulawesi-tengah", name: "Sulawesi Tengah", capital: "Palu", region: "sulawesi", pakaian: "Baju Nggembe", rumah: "Souraja", tarian: "Dero", wastra: [w("Tenun Donggala", "Dikenal juga sebagai Buya Sabe")] },
  { id: "sulawesi-barat", name: "Sulawesi Barat", capital: "Mamuju", region: "sulawesi", pakaian: "Pattuqduq Towaine", rumah: "Boyang", tarian: "Bamba Manurung", wastra: [w("Lipa Saqbe Mandar", "Sarung sutra Mandar")] },
  { id: "sulawesi-selatan", name: "Sulawesi Selatan", capital: "Makassar", region: "sulawesi", pakaian: "Baju Bodo dan Baju Pokko", rumah: "Tongkonan", tarian: "Manimbong", wastra: [w("Lipa Sabbe", "Sarung sutra Bugis"), w("Tenun Toraja")] },
  { id: "sulawesi-tenggara", name: "Sulawesi Tenggara", capital: "Kendari", region: "sulawesi", pakaian: "Kinawo dan Babu Nggawi", rumah: "Buton", tarian: "Balumpa", wastra: [w("Tenun Buton")] },
  // Maluku
  { id: "maluku", name: "Maluku", capital: "Ambon", region: "maluku", pakaian: "Baju Cele", rumah: "Baileo", tarian: "Cakalele", wastra: [w("Tenun Tanimbar")] },
  { id: "maluku-utara", name: "Maluku Utara", capital: "Sofifi", region: "maluku", pakaian: "Manteren Lamo", rumah: "Sasadu", tarian: "Kapita", wastra: [w("Tenun Ternate", "Bermotif kehidupan laut; kini langka"), w("Puta Dino", "Kain tenun Tidore")] },
  // Papua
  { id: "papua", name: "Papua", capital: "Jayapura", region: "papua", pakaian: "Koteka dan rok rumbai (Holim)", rumah: "Kariwari", tarian: "Pangkur Sagu", wastra: [w("Noken", "Tas rajut atau anyam serat kayu, Warisan Budaya Takbenda UNESCO (2012)"), w("Kain kulit kayu Kombouw", "Dari kawasan Sentani", false)] },
  { id: "papua-barat", name: "Papua Barat", capital: "Manokwari", region: "papua", pakaian: "Pakaian Ewer", rumah: "Mod Aki Aksa", tarian: "Tumbu Tanah", wastra: [w("Noken", "Warisan Budaya Takbenda UNESCO (2012)"), w("Wastra khas daerah", "Belum kami temukan sumber yang cukup", false)] },
  { id: "papua-barat-daya", name: "Papua Barat Daya", capital: "Sorong", region: "papua", pakaian: "Boe, Kuli Bia, Topi Kasuari, dan Kalung Manik-Manik", rumah: "Kaki Seribu", tarian: null, wastra: [w("Noken", "Warisan Budaya Takbenda UNESCO (2012)"), w("Kain Timur", "Kain yang dipakai dalam adat pernikahan", false)] },
  { id: "papua-tengah", name: "Papua Tengah", capital: "Nabire", region: "papua", pakaian: "Koteka dan rok rumbai (Holim)", rumah: "Karapao", tarian: null, wastra: [w("Noken", "Warisan Budaya Takbenda UNESCO (2012)")] },
  { id: "papua-pegunungan", name: "Papua Pegunungan", capital: "Wamena", region: "papua", pakaian: "Koteka dan rok rumbai (Holim)", rumah: "Honai", tarian: null, wastra: [w("Noken", "Warisan Budaya Takbenda UNESCO (2012)")] },
  { id: "papua-selatan", name: "Papua Selatan", capital: "Merauke", region: "papua", pakaian: "Pummi", rumah: "Jew", tarian: null, wastra: [w("Noken", "Warisan Budaya Takbenda UNESCO (2012)")] },
];

export const regionOf = (province) => REGIONS.find((r) => r.id === province.region);
export const provinceById = (id) => PROVINCES.find((p) => p.id === id) || null;
