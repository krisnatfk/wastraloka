// Ringkasan sejarah tiap provinsi, ditulis ulang dengan kata-kata sendiri dari artikel Wikipedia
// bahasa Indonesia (bagian "Sejarah") dan undang-undang pembentukan provinsi. Tiga babak: masa awal/kerajaan,
// masa kolonial/perjuangan, dan terbentuknya provinsi.

const t = (era, text) => ({ era, text });

export const HISTORY = {
  "aceh": [
    t("Abad ke-13", "Samudera Pasai di pesisir utara Sumatra menjadi salah satu kerajaan Islam tertua di Nusantara."),
    t("1607–1636", "Kesultanan Aceh Darussalam mencapai puncak kejayaan di bawah Sultan Iskandar Muda; Perang Aceh melawan Belanda kemudian berlangsung puluhan tahun sejak 1873."),
    t("1956", "Provinsi Aceh dibentuk lewat UU No. 24 Tahun 1956, lalu sempat bernama Daerah Istimewa Aceh dan Nanggroe Aceh Darussalam sebelum kembali menjadi Aceh."),
  ],
  "sumatera-utara": [
    t("Masa kerajaan", "Wilayahnya pernah menjadi pusat Kerajaan Haru dan kemudian Kesultanan Deli; Istana Maimun di Medan dibangun pada 1888."),
    t("Masa kolonial", "Perkebunan tembakau Deli menjadikan Medan kota dagang penting di masa Hindia Belanda."),
    t("1948", "Provinsi Sumatera dipecah menjadi tiga lewat UU No. 10 Tahun 1948; Sumatera Utara salah satunya."),
  ],
  "sumatera-barat": [
    t("Masa kerajaan", "Kerajaan Pagaruyung menjadi pusat adat Minangkabau, dengan Istano Basa sebagai simbolnya."),
    t("1803–1838", "Perang Padri mempertemukan kaum adat, kaum ulama, dan Belanda; Tuanku Imam Bonjol menjadi tokoh utamanya."),
    t("1957", "Sumatera Barat berdiri sendiri setelah Provinsi Sumatera Tengah dipecah lewat UU Darurat No. 19 Tahun 1957."),
  ],
  "riau": [
    t("1723", "Kesultanan Siak Sri Indrapura berdiri dan menguasai perdagangan di sepanjang Sungai Siak."),
    t("1945", "Sultan Syarif Kasim II menyatakan kesultanannya bergabung dengan Republik Indonesia dan menyerahkan hartanya untuk perjuangan."),
    t("1957", "Provinsi Riau dibentuk dari pemecahan Sumatera Tengah lewat UU Darurat No. 19 Tahun 1957."),
  ],
  "kepulauan-riau": [
    t("Abad ke-16–19", "Wilayah ini bagian dari Kesultanan Johor-Riau lalu Riau-Lingga; Pulau Penyengat menjadi pusat sastra Melayu."),
    t("1847", "Raja Ali Haji menulis Gurindam Dua Belas, karya penting yang ikut membentuk bahasa Melayu Riau, akar bahasa Indonesia."),
    t("2002", "Kepulauan Riau resmi menjadi provinsi sendiri, terpisah dari Riau, lewat UU No. 25 Tahun 2002."),
  ],
  "jambi": [
    t("Abad ke-7–13", "Kompleks Candi Muaro Jambi menjadi pusat belajar agama Buddha di masa Kerajaan Melayu Kuno."),
    t("Abad ke-19", "Sultan Thaha Syaifuddin dari Kesultanan Jambi memimpin perlawanan panjang terhadap Belanda."),
    t("1957", "Provinsi Jambi dibentuk dari pemecahan Sumatera Tengah lewat UU Darurat No. 19 Tahun 1957."),
  ],
  "sumatera-selatan": [
    t("Abad ke-7", "Palembang menjadi pusat Sriwijaya, kerajaan maritim besar; Prasasti Kedukan Bukit bertarikh 682 M."),
    t("Abad ke-17–19", "Kesultanan Palembang Darussalam berjaya; Sultan Mahmud Badaruddin II melawan Inggris dan Belanda."),
    t("1948", "Sumatera Selatan menjadi provinsi saat Provinsi Sumatera dibagi tiga lewat UU No. 10 Tahun 1948."),
  ],
  "bengkulu": [
    t("1685", "Kongsi dagang Inggris (EIC) membuka pos lada di Bengkulu dan membangun Benteng Marlborough (1714–1719)."),
    t("1824", "Lewat Traktat London, Inggris menukar Bengkulu dengan Malaka milik Belanda. Bung Karno kelak diasingkan di sini (1938–1942)."),
    t("1968", "Provinsi Bengkulu dibentuk lewat UU No. 9 Tahun 1967 dan resmi berdiri pada 1968."),
  ],
  "lampung": [
    t("Prasejarah", "Temuan dolmen dan menhir menunjukkan budaya megalitik di Lampung."),
    t("1568–1808", "Lampung berada di bawah pengaruh Kesultanan Banten lewat perdagangan lada."),
    t("1964", "Lampung berdiri sebagai provinsi pada 18 Maret 1964, sebelumnya keresidenan di bawah Sumatera Selatan."),
  ],
  "kepulauan-bangka-belitung": [
    t("Abad ke-18", "Penambangan timah di Bangka berkembang pesat dan mendatangkan banyak pekerja dari Tiongkok."),
    t("1949", "Muntok di Pulau Bangka menjadi tempat pengasingan Bung Karno dan Bung Hatta."),
    t("2000", "Kepulauan Bangka Belitung menjadi provinsi sendiri, terpisah dari Sumatera Selatan, lewat UU No. 27 Tahun 2000."),
  ],
  "banten": [
    t("Abad ke-5", "Wilayah Banten bagian dari Tarumanagara; Prasasti Cidanghiyang memuji Raja Purnawarman."),
    t("1527–1813", "Kesultanan Banten menjadi bandar lada internasional; Sultan Ageng Tirtayasa terkenal melawan VOC."),
    t("2000", "Banten menjadi provinsi sendiri, terpisah dari Jawa Barat, lewat UU No. 23 Tahun 2000."),
  ],
  "dki-jakarta": [
    t("Abad ke-16", "Sunda Kalapa adalah pelabuhan Kerajaan Sunda; pada 1527 direbut Fatahillah dan dinamai Jayakarta."),
    t("1619", "VOC menghancurkan Jayakarta dan membangun Batavia, pusat pemerintahan Hindia Belanda."),
    t("2024", "Setelah lama menjadi ibu kota negara, statusnya menjadi Daerah Khusus Jakarta lewat UU No. 2 Tahun 2024."),
  ],
  "jawa-barat": [
    t("Abad ke-5", "Tarumanagara meninggalkan prasasti di banyak tempat di Jawa Barat, lalu diteruskan Kerajaan Sunda (Pajajaran)."),
    t("1955", "Bandung menjadi tuan rumah Konferensi Asia-Afrika yang bersejarah."),
    t("1950", "Provinsi Jawa Barat dibentuk lewat UU No. 11 Tahun 1950."),
  ],
  "jawa-tengah": [
    t("Abad ke-8–9", "Kerajaan Mataram Kuno membangun Candi Borobudur dan Prambanan."),
    t("1825–1830", "Pangeran Diponegoro memimpin Perang Jawa melawan Belanda."),
    t("1950", "Provinsi Jawa Tengah dibentuk lewat UU No. 10 Tahun 1950."),
  ],
  "daerah-istimewa-yogyakarta": [
    t("1755", "Perjanjian Giyanti membagi Mataram dan melahirkan Kasultanan Ngayogyakarta Hadiningrat."),
    t("1946–1949", "Yogyakarta menjadi ibu kota Republik Indonesia selama revolusi kemerdekaan."),
    t("1950", "Berstatus daerah istimewa lewat UU No. 3 Tahun 1950, dipertegas UU Keistimewaan No. 13 Tahun 2012."),
  ],
  "jawa-timur": [
    t("1293", "Majapahit berdiri dan kelak menjadi salah satu kerajaan terbesar di Nusantara."),
    t("1945", "Pertempuran 10 November di Surabaya, kini diperingati sebagai Hari Pahlawan."),
    t("1950", "Provinsi Jawa Timur dibentuk lewat UU No. 2 Tahun 1950."),
  ],
  "bali": [
    t("Abad ke-10–14", "Kerajaan-kerajaan Bali Kuno berkembang, lalu budaya Majapahit kuat memengaruhi Bali."),
    t("1906", "Puputan Badung: keluarga raja memilih berperang sampai akhir daripada menyerah kepada Belanda."),
    t("1958", "Bali menjadi provinsi sendiri setelah Provinsi Sunda Kecil dipecah lewat UU No. 64 Tahun 1958."),
  ],
  "nusa-tenggara-barat": [
    t("Masa kerajaan", "Kerajaan Selaparang (Sasak) di Lombok dan Kesultanan Bima di Sumbawa tumbuh sebagai pusat kekuasaan."),
    t("1815", "Letusan Gunung Tambora di Sumbawa, salah satu letusan terdahsyat dalam sejarah, mengubah iklim dunia."),
    t("1958", "NTB menjadi provinsi lewat UU No. 64 Tahun 1958, pecahan Provinsi Sunda Kecil."),
  ],
  "nusa-tenggara-timur": [
    t("Abad ke-16", "Portugis dan Belanda bersaing memperebutkan cendana di Timor, Flores, dan Solor."),
    t("1934–1938", "Bung Karno diasingkan di Ende, Flores, masa yang ia kenang sebagai saat merenungkan Pancasila."),
    t("1958", "NTT menjadi provinsi lewat UU No. 64 Tahun 1958, pecahan Provinsi Sunda Kecil."),
  ],
  "kalimantan-barat": [
    t("1771", "Syarif Abdurrahman Alkadrie mendirikan Kesultanan Pontianak di pertemuan Sungai Kapuas dan Landak."),
    t("Masa kolonial", "Kongsi-kongsi tambang emas Tionghoa di Monterado dan Mandor berkembang di abad ke-18–19."),
    t("1956", "Provinsi Kalimantan Barat dibentuk lewat UU No. 25 Tahun 1956."),
  ],
  "kalimantan-tengah": [
    t("1894", "Rapat Damai Tumbang Anoi mempertemukan suku-suku Dayak untuk mengakhiri tradisi saling menyerang."),
    t("Masa kolonial", "Wilayahnya berada di bawah pengaruh Kesultanan Banjar lalu Hindia Belanda."),
    t("1957", "Kalimantan Tengah berdiri lewat UU Darurat No. 10 Tahun 1957; Palangka Raya dibangun sebagai ibu kota baru."),
  ],
  "kalimantan-selatan": [
    t("1526", "Kesultanan Banjar berdiri setelah Pangeran Samudera memeluk Islam dan bergelar Sultan Suriansyah."),
    t("1859–1905", "Perang Banjar melawan Belanda, dipimpin antara lain oleh Pangeran Antasari."),
    t("1956", "Provinsi dibentuk lewat UU No. 25 Tahun 1956; ibu kota pindah dari Banjarmasin ke Banjarbaru pada 2022."),
  ],
  "kalimantan-timur": [
    t("Abad ke-4", "Prasasti Yupa dari Kerajaan Kutai Martadipura, tulisan tertua yang ditemukan di Indonesia."),
    t("Masa kolonial", "Kesultanan Kutai Kartanegara berkuasa di tepi Mahakam; minyak dan batu bara mulai ditambang."),
    t("1956", "Provinsi dibentuk lewat UU No. 25 Tahun 1956; kini menjadi lokasi Ibu Kota Nusantara."),
  ],
  "kalimantan-utara": [
    t("Abad ke-18", "Kesultanan Bulungan berkuasa di tepi Sungai Kayan."),
    t("Masa kolonial", "Kawasan perbatasan dengan Sabah ini menjadi jalur dagang dan permukiman suku Tidung dan Dayak."),
    t("2012", "Kalimantan Utara menjadi provinsi ke-34 lewat UU No. 20 Tahun 2012, pecahan Kalimantan Timur."),
  ],
  "sulawesi-utara": [
    t("Masa awal", "Batu Watu Pinawetengan dikenal sebagai tempat leluhur Minahasa membagi wilayah dan bermusyawarah."),
    t("Abad ke-16–17", "Spanyol dan Belanda bersaing di Minahasa dan Sangihe; Benteng Amsterdam berdiri di Manado."),
    t("1964", "Provinsi Sulawesi Utara dibentuk lewat UU No. 13 Tahun 1964."),
  ],
  "gorontalo": [
    t("Masa kerajaan", "Kerajaan Gorontalo dan Limboto bersatu dalam persekutuan adat U Duluwo Limo lo Pohalaa."),
    t("1942", "Pada 23 Januari 1942 Nani Wartabone memimpin rakyat Gorontalo memproklamasikan kemerdekaan dari Belanda."),
    t("2000", "Gorontalo menjadi provinsi sendiri, terpisah dari Sulawesi Utara, lewat UU No. 38 Tahun 2000."),
  ],
  "sulawesi-tengah": [
    t("Prasejarah", "Arca-arca megalitik di Lembah Bada dan Lore Lindu menunjukkan peradaban yang sangat tua."),
    t("Masa kerajaan", "Kerajaan-kerajaan Kaili seperti Banawa dan Palu berkuasa di lembah Palu."),
    t("1964", "Provinsi Sulawesi Tengah dibentuk lewat UU No. 13 Tahun 1964."),
  ],
  "sulawesi-barat": [
    t("Masa kerajaan", "Kerajaan-kerajaan Mandar bersekutu: Pitu Ba'bana Binanga di pesisir dan Pitu Ulunna Salu di pegunungan."),
    t("Tradisi bahari", "Orang Mandar dikenal sebagai pelaut ulung dengan perahu bercadik sandeq."),
    t("2004", "Sulawesi Barat menjadi provinsi lewat UU No. 26 Tahun 2004, pecahan Sulawesi Selatan."),
  ],
  "sulawesi-selatan": [
    t("Abad ke-17", "Kesultanan Gowa-Tallo menjadi kekuatan maritim besar; Sultan Hasanuddin melawan VOC."),
    t("1667", "Perjanjian Bongaya mengakhiri perang Makassar dan memperkuat posisi VOC serta Kerajaan Bone."),
    t("1964", "Provinsi Sulawesi Selatan dibentuk lewat UU No. 13 Tahun 1964."),
  ],
  "sulawesi-tenggara": [
    t("Abad ke-16", "Kesultanan Buton berdiri dan dikenal dengan Benteng Keraton Buton yang sangat luas."),
    t("Masa kerajaan", "Kerajaan Konawe dan Mekongga berkembang di daratan Sulawesi Tenggara."),
    t("1964", "Provinsi Sulawesi Tenggara dibentuk lewat UU No. 13 Tahun 1964."),
  ],
  "maluku": [
    t("Abad ke-16", "Pala dan cengkih Maluku menarik Portugis (1512), lalu Belanda, ke 'kepulauan rempah'."),
    t("1817", "Kapitan Pattimura memimpin perlawanan rakyat Saparua dan merebut Benteng Duurstede."),
    t("1945", "Maluku termasuk delapan provinsi pertama Republik Indonesia."),
  ],
  "maluku-utara": [
    t("Masa kerajaan", "Kesultanan Ternate dan Tidore menguasai perdagangan cengkih dunia."),
    t("1575", "Sultan Baabullah dari Ternate mengusir Portugis dari bentengnya."),
    t("1999", "Maluku Utara menjadi provinsi lewat UU No. 46 Tahun 1999, dengan ibu kota Sofifi."),
  ],
  "papua": [
    t("Masa awal", "Suku-suku Papua hidup dengan ratusan bahasa; kawasan pesisir menjalin dagang dengan Tidore."),
    t("1969", "Penentuan Pendapat Rakyat (Pepera) menetapkan Irian Barat sebagai bagian Indonesia."),
    t("2001", "Berstatus otonomi khusus lewat UU No. 21 Tahun 2001; wilayahnya dipecah lagi pada 2022."),
  ],
  "papua-barat": [
    t("1855", "Misionaris Ottow dan Geissler mendarat di Pulau Mansinam, Manokwari, awal penyebaran Injil di Tanah Papua."),
    t("Masa kerajaan", "Kepulauan di Kepala Burung memiliki hubungan dagang dan adat dengan Kesultanan Tidore."),
    t("1999/2003", "Dibentuk sebagai Irian Jaya Barat lewat UU No. 45 Tahun 1999, berjalan sejak 2003, dan berganti nama Papua Barat pada 2007."),
  ],
  "papua-barat-daya": [
    t("Masa kerajaan", "Raja Ampat ('empat raja') berasal dari empat kerajaan pulau yang terhubung dengan Tidore."),
    t("Masa modern", "Sorong tumbuh sebagai kota minyak dan pelabuhan; Raja Ampat dikenal dunia karena keanekaragaman lautnya."),
    t("2022", "Papua Barat Daya menjadi provinsi ke-38 lewat UU No. 29 Tahun 2022."),
  ],
  "papua-tengah": [
    t("Masa awal", "Wilayah pegunungan dan pesisir Nabire dihuni suku Mee, Moni, Amungme, dan Kamoro."),
    t("Masa modern", "Puncak Jaya, gunung tertinggi Indonesia, dan tambang di Mimika menjadi penanda kawasan ini."),
    t("2022", "Papua Tengah menjadi provinsi lewat UU No. 15 Tahun 2022, beribu kota Nabire."),
  ],
  "papua-pegunungan": [
    t("Masa awal", "Lembah Baliem dihuni suku Dani, Lani, dan Yali yang bertani ubi di dataran tinggi."),
    t("1938", "Ekspedisi Richard Archbold membuat Lembah Baliem dikenal dunia luar."),
    t("2022", "Papua Pegunungan menjadi provinsi lewat UU No. 16 Tahun 2022, beribu kota Wamena."),
  ],
  "papua-selatan": [
    t("Masa awal", "Suku Marind dan Asmat dikenal dengan ukiran kayu dan pesta adatnya."),
    t("Masa modern", "Merauke menjadi titik paling timur Indonesia, ujung dari 'Sabang sampai Merauke'."),
    t("2022", "Papua Selatan menjadi provinsi lewat UU No. 14 Tahun 2022, beribu kota Merauke."),
  ],
};

export const historySource = (provinceName) => ({
  label: `Wikipedia bahasa Indonesia: ${provinceName} (bagian Sejarah)`,
  url: `https://id.wikipedia.org/wiki/${encodeURIComponent(provinceName === "Papua" ? "Papua (provinsi)" : provinceName === "DKI Jakarta" ? "Daerah Khusus Jakarta" : provinceName.replace(/ /g, "_"))}`,
});
