/**
 * Data awal Bermakna Enterprise.
 * Menyiapkan 10 kategori sesuai proposal, akun demo untuk tiap peran,
 * katalog layanan, serta beberapa transaksi & review agar dasbor langsung terisi.
 *
 * Jalankan: npm run db:seed   (atau npm run db:reset untuk mulai bersih)
 */
import crypto from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function slug(text: string, suffix: string) {
  return `${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 55)}-${suffix}`;
}

function kodePesanan(i: number) {
  return `BE-260${(i % 9) + 1}${String(10 + i).slice(0, 2)}-${crypto
    .randomBytes(2)
    .toString("hex")
    .toUpperCase()}`;
}

function hariLalu(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// ── 10 kategori pada proposal (hlm. 5) ──────────────────────────────────
const KATEGORI = [
  { slug: "tutor-akademik", name: "Tutor Akademik", icon: "📚", tagline: "Kalkulus, fisika dasar, kimia, sampai mata kuliah jurusan." },
  { slug: "mentor-kompetisi", name: "Mentor Kompetisi", icon: "🏆", tagline: "Pendampingan lomba, business case, dan olimpiade." },
  { slug: "konsultasi-akademik", name: "Konsultasi Akademik", icon: "🎓", tagline: "Konsultasi karier, beasiswa, TA, dan rencana studi." },
  { slug: "desain-grafis", name: "Jasa Desain Grafis", icon: "🎨", tagline: "Poster, feed Instagram, logo, dan materi acara." },
  { slug: "dokumentasi", name: "Jasa Dokumentasi", icon: "📷", tagline: "Foto acara, wisuda, produk, dan liputan kepanitiaan." },
  { slug: "video-editing", name: "Video Editing", icon: "🎬", tagline: "After movie, konten pendek, dan motion graphic." },
  { slug: "event-manpower", name: "Event & Manpower", icon: "🎪", tagline: "Usher, LO, MC, operator, dan tenaga acara." },
  { slug: "kos-kontrakan", name: "Kos & Kontrakan", icon: "🏠", tagline: "Kos, kontrakan, dan sewa kamar dekat kampus." },
  { slug: "penerjemahan", name: "Penerjemahan Dokumen", icon: "🌐", tagline: "Terjemahan akademik, abstrak, dan proofreading." },
  { slug: "digital-kreatif", name: "Jasa Digital & Kreatif Lainnya", icon: "💡", tagline: "Web, data, copywriting, dan kebutuhan kreatif lain." },
];

type SeedLayanan = {
  kategori: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  campus: string;
  location?: string;
  deliveryDays?: number;
};

type SeedPenyedia = {
  name: string;
  email: string;
  phone: string;
  campus: string;
  faculty: string;
  batch: string;
  nim: string;
  studyProgram: string;
  headline: string;
  about: string;
  status: string;
  isPremium?: boolean;
  bank: [string, string, string];
  portfolio?: { title: string; description: string }[];
  layanan: SeedLayanan[];
};

const PENYEDIA: SeedPenyedia[] = [
  {
    name: "Alya Rahmadhani",
    email: "alya@students.itb.ac.id",
    phone: "081234500011",
    campus: "GANESHA",
    faculty: "FMIPA",
    batch: "2023",
    nim: "10123045",
    studyProgram: "Matematika",
    headline: "Tutor Kalkulus & Aljabar Linear — asisten praktikum 2 tahun",
    about:
      "Mahasiswa Matematika ITB 2023, asisten praktikum Kalkulus 1 & 2. Terbiasa mengajar dari nol dengan pendekatan latihan soal bertahap. Sudah mendampingi lebih dari 60 mahasiswa TPB menghadapi UTS dan UAS.",
    status: "VERIFIED",
    isPremium: true,
    bank: ["Bank Mandiri", "1300011122233", "Alya Rahmadhani"],
    portfolio: [
      { title: "Modul Ringkas Kalkulus 1", description: "Rangkuman 40 halaman + 120 soal latihan bertahap." },
      { title: "Kelas Intensif UAS TPB 2025", description: "Kelas daring 5 sesi, diikuti 38 mahasiswa TPB." },
    ],
    layanan: [
      {
        kategori: "tutor-akademik",
        title: "Tutor Privat Kalkulus 1 & 2 (TPB)",
        description:
          "Belajar kalkulus dari dasar sampai siap ujian. Satu sesi 90 menit, bisa daring lewat Zoom atau tatap muka di sekitar Kampus Ganesha.\n\nYang kamu dapat:\n• Pembahasan materi sesuai silabus TPB ITB\n• Latihan soal bertingkat dari mudah ke soal ujian\n• Rangkuman digital tiap sesi\n• Konsultasi lewat WhatsApp di luar jam sesi\n\nCocok untuk kamu yang tertinggal materi kuliah atau sedang mempersiapkan UTS/UAS.",
        price: 75000,
        priceUnit: "PER_SESI",
        campus: "GANESHA",
        location: "Sekitar Kampus Ganesha / daring",
      },
      {
        kategori: "tutor-akademik",
        title: "Kelas Intensif Persiapan UTS Aljabar Linear",
        description:
          "Kelas kelompok kecil maksimal 6 orang selama 4 sesi menjelang UTS. Fokus pada matriks, ruang vektor, transformasi linear, dan nilai eigen.\n\nSetiap peserta mendapat modul latihan dan pembahasan soal ujian tahun-tahun sebelumnya.",
        price: 220000,
        priceUnit: "PER_ORANG",
        campus: "GANESHA",
        location: "Ruang belajar sekitar Ganesha",
      },
    ],
  },
  {
    name: "Bimo Anggara",
    email: "bimo@students.itb.ac.id",
    phone: "081234500022",
    campus: "GANESHA",
    faculty: "FSRD",
    batch: "2022",
    nim: "17022018",
    studyProgram: "Desain Komunikasi Visual",
    headline: "Desainer grafis untuk kebutuhan himpunan, UKM, dan kepanitiaan",
    about:
      "Mahasiswa DKV ITB 2022. Pernah menjadi Kepala Divisi Kreatif dua kepanitiaan besar tingkat institut. Terbiasa mengerjakan identitas visual acara secara utuh: logo, poster, feed, sampai perlengkapan hari-H.",
    status: "VERIFIED",
    isPremium: true,
    bank: ["Bank BCA", "7770011223", "Bimo Anggara"],
    portfolio: [
      { title: "Identitas Visual Wisuda Oktober", description: "Logo, poster, dan 12 aset turunan untuk kepanitiaan wisuda." },
      { title: "Feed Instagram Kaderisasi HMM", description: "Rangkaian 18 konten feed dan story selama satu bulan." },
      { title: "Rebranding UKM Fotografi", description: "Logo baru, panduan warna, dan templat konten." },
    ],
    layanan: [
      {
        kategori: "desain-grafis",
        title: "Paket Desain Poster & Feed Instagram Acara",
        description:
          "Paket lengkap materi promosi acara kampus: 1 poster utama, 3 konten feed, dan 3 templat story yang seragam.\n\nAlur pengerjaan:\n1. Pengisian brief dan referensi\n2. Konsep awal dalam 2 hari\n3. Dua kali revisi tanpa biaya tambahan\n4. Serah terima berkas PNG, JPG, dan sumber Figma\n\nCocok untuk kepanitiaan, himpunan, dan UKM yang butuh materi promosi cepat tapi tetap rapi.",
        price: 350000,
        priceUnit: "PER_PROYEK",
        campus: "GANESHA",
        deliveryDays: 5,
      },
      {
        kategori: "desain-grafis",
        title: "Desain Logo & Identitas Visual Acara",
        description:
          "Perancangan logo acara beserta panduan penggunaannya: pilihan warna, tipografi, dan contoh penerapan pada poster, kaos, serta sertifikat.\n\nTermasuk tiga alternatif konsep awal dan tiga kali revisi.",
        price: 600000,
        priceUnit: "PER_PROYEK",
        campus: "GANESHA",
        deliveryDays: 7,
      },
    ],
  },
  {
    name: "Citra Maheswari",
    email: "citra@students.itb.ac.id",
    phone: "081234500033",
    campus: "JATINANGOR",
    faculty: "SITH",
    batch: "2023",
    nim: "11923077",
    studyProgram: "Rekayasa Pertanian",
    headline: "Fotografer acara & dokumentasi kegiatan kampus",
    about:
      "Fotografer lepas sejak SMA, kini mahasiswa SITH ITB Jatinangor. Fokus pada dokumentasi acara, wisuda, dan kegiatan himpunan. Menggunakan kamera mirrorless full-frame dengan dua lensa.",
    status: "VERIFIED",
    bank: ["Bank BNI", "8890012345", "Citra Maheswari"],
    portfolio: [
      { title: "Dokumentasi Wisuda April", description: "Sesi foto keluarga dan kandid, 240 foto tersunting." },
      { title: "Liputan Festival Jatinangor", description: "Dokumentasi acara dua hari penuh." },
    ],
    layanan: [
      {
        kategori: "dokumentasi",
        title: "Dokumentasi Acara Kampus (Setengah Hari)",
        description:
          "Peliputan foto acara selama 4 jam di kampus Jatinangor maupun Ganesha.\n\nHasil akhir:\n• Minimal 120 foto tersunting\n• 20 foto pilihan siap unggah media sosial\n• Pengiriman lewat Google Drive maksimal 3 hari\n\nSudah termasuk kamera, lensa, dan lampu tambahan bila dibutuhkan.",
        price: 450000,
        priceUnit: "PER_SESI",
        campus: "JATINANGOR",
        location: "Jatinangor & sekitarnya",
        deliveryDays: 3,
      },
      {
        kategori: "dokumentasi",
        title: "Foto Wisuda — Sesi Keluarga & Kandid",
        description:
          "Sesi foto wisuda dua jam bersama keluarga dan teman. Termasuk pengarahan gaya, 80 foto tersunting, dan 10 foto retouch tingkat lanjut.",
        price: 400000,
        priceUnit: "PER_SESI",
        campus: "GANESHA",
        location: "Kampus Ganesha",
        deliveryDays: 4,
      },
    ],
  },
  {
    name: "Damar Prasetyo",
    email: "damar@students.itb.ac.id",
    phone: "081234500044",
    campus: "GANESHA",
    faculty: "STEI",
    batch: "2022",
    nim: "13522091",
    studyProgram: "Teknik Informatika",
    headline: "Mentor kompetisi teknologi & video editor konten kampus",
    about:
      "Mahasiswa Teknik Informatika ITB 2022. Finalis dua kompetisi data nasional dan mantan ketua divisi media himpunan. Membantu tim lomba menyusun solusi sekaligus mempersiapkan presentasi akhir.",
    status: "VERIFIED",
    bank: ["Bank BRI", "0021003344556", "Damar Prasetyo"],
    portfolio: [
      { title: "After Movie Olimpiade Himpunan", description: "Video 3 menit dengan color grading dan sound design." },
      { title: "Pendampingan Tim Datathon", description: "Mentoring 6 minggu, tim masuk 10 besar nasional." },
    ],
    layanan: [
      {
        kategori: "mentor-kompetisi",
        title: "Mentoring Lomba Data & Teknologi",
        description:
          "Pendampingan tim lomba dari pemahaman soal sampai simulasi presentasi final.\n\nCakupan:\n• Bedah studi kasus dan penentuan strategi solusi\n• Tinjauan teknis atas model atau prototipe\n• Perapian alur cerita presentasi\n• Simulasi tanya jawab dewan juri\n\nSatu sesi 120 menit untuk seluruh anggota tim.",
        price: 250000,
        priceUnit: "PER_SESI",
        campus: "ONLINE",
      },
      {
        kategori: "video-editing",
        title: "Editing After Movie Acara Kampus",
        description:
          "Penyuntingan video dokumentasi acara menjadi after movie 2–3 menit: pemilihan klip, color grading, teks judul, dan penataan musik.\n\nTermasuk dua kali revisi dan berkas akhir resolusi 1080p serta versi vertikal untuk media sosial.",
        price: 500000,
        priceUnit: "PER_PROYEK",
        campus: "ONLINE",
        deliveryDays: 7,
      },
    ],
  },
  {
    name: "Elang Nugroho",
    email: "elang@students.itb.ac.id",
    phone: "081234500055",
    campus: "GANESHA",
    faculty: "FTTM",
    batch: "2021",
    nim: "12121033",
    studyProgram: "Teknik Perminyakan",
    headline: "Pengelola kos putra dua menit dari Gerbang Belakang ITB",
    about:
      "Mengelola dua rumah kos di sekitar Kampus Ganesha bersama keluarga. Semua kamar sudah dilengkapi perabot dasar dan internet, dengan penghuni mayoritas mahasiswa ITB.",
    status: "VERIFIED",
    bank: ["Bank Mandiri", "1300044455566", "Elang Nugroho"],
    layanan: [
      {
        kategori: "kos-kontrakan",
        title: "Kos Putra Dago — Kamar Berperabot + WiFi",
        description:
          "Kamar kos putra berukuran 3×4 meter, berjarak dua menit berjalan kaki dari Gerbang Belakang ITB.\n\nFasilitas kamar:\n• Kasur, lemari, meja belajar, dan kursi\n• Kamar mandi dalam dengan pemanas air\n• WiFi 100 Mbps tanpa batas kuota\n\nFasilitas bersama: dapur, mesin cuci, ruang jemur, dan parkir motor. Listrik ditagih terpisah sesuai pemakaian. Minimal sewa tiga bulan.",
        price: 1400000,
        priceUnit: "PER_BULAN",
        campus: "GANESHA",
        location: "Dago Asri, Bandung",
      },
      {
        kategori: "kos-kontrakan",
        title: "Kontrakan Petak 2 Kamar — Cisitu",
        description:
          "Kontrakan dua kamar tidur beserta ruang tamu dan dapur, cocok untuk dua sampai tiga mahasiswa yang ingin berbagi biaya.\n\nSudah termasuk perabot dasar dan akses WiFi bersama. Pembayaran per bulan atau per semester.",
        price: 2500000,
        priceUnit: "PER_BULAN",
        campus: "GANESHA",
        location: "Cisitu Lama, Bandung",
      },
    ],
  },
  {
    name: "Farah Salsabila",
    email: "farah@students.itb.ac.id",
    phone: "081234500066",
    campus: "GANESHA",
    faculty: "FTI",
    batch: "2022",
    nim: "13322050",
    studyProgram: "Teknik Kimia",
    headline: "Penerjemah dokumen akademik & proofreader naskah",
    about:
      "Peraih skor IELTS 8.0 dan penerjemah lepas sejak 2023. Terbiasa menangani abstrak, jurnal, dan berkas pendaftaran beasiswa dengan istilah teknis.",
    status: "VERIFIED",
    bank: ["Bank BCA", "7770099887", "Farah Salsabila"],
    layanan: [
      {
        kategori: "penerjemahan",
        title: "Terjemahan Abstrak & Jurnal (ID ⇄ EN)",
        description:
          "Penerjemahan dokumen akademik dua arah dengan menjaga istilah teknis bidang terkait.\n\nTermasuk satu kali revisi dan pemeriksaan tata bahasa akhir. Perhitungan biaya per halaman berisi maksimal 300 kata.",
        price: 25000,
        priceUnit: "PER_HALAMAN",
        campus: "ONLINE",
        deliveryDays: 3,
      },
      {
        kategori: "konsultasi-akademik",
        title: "Konsultasi Esai Beasiswa & Motivation Letter",
        description:
          "Sesi 60 menit membedah esai beasiswa: struktur cerita, kekuatan argumen, dan kesesuaian dengan kriteria penyelenggara.\n\nSudah termasuk catatan tertulis dan satu kali tinjauan naskah revisi.",
        price: 150000,
        priceUnit: "PER_SESI",
        campus: "ONLINE",
      },
    ],
  },
  {
    name: "Gilang Ramadhan",
    email: "gilang@students.itb.ac.id",
    phone: "081234500077",
    campus: "CIREBON",
    faculty: "FTI",
    batch: "2023",
    nim: "13423012",
    studyProgram: "Teknik Industri",
    headline: "Koordinator tenaga acara & MC kegiatan kampus",
    about:
      "Aktif di kepanitiaan sejak tahun pertama dan kini mengoordinasi tim usher lintas kampus ITB. Menyediakan tenaga acara terlatih beserta koordinator lapangannya.",
    status: "VERIFIED",
    bank: ["Bank BNI", "8890055443", "Gilang Ramadhan"],
    layanan: [
      {
        kategori: "event-manpower",
        title: "Tenaga Usher & LO Acara (per orang, per hari)",
        description:
          "Penyediaan usher dan liaison officer terlatih untuk acara kampus, seminar, dan wisuda.\n\nSetiap personel sudah mendapat pengarahan alur acara dan tata cara menyambut tamu. Tersedia koordinator lapangan bila jumlah personel lebih dari lima orang.",
        price: 150000,
        priceUnit: "PER_ORANG",
        campus: "CIREBON",
        location: "Cirebon, Bandung, Jatinangor",
      },
      {
        kategori: "event-manpower",
        title: "MC Acara Formal & Semi-Formal",
        description:
          "Pembawa acara untuk seminar, pelantikan, dan malam apresiasi. Sudah termasuk penyusunan naskah dan satu kali gladi bersih.",
        price: 500000,
        priceUnit: "PER_HARI",
        campus: "CIREBON",
      },
    ],
  },
  {
    name: "Hana Aprilia",
    email: "hana@students.itb.ac.id",
    phone: "081234500088",
    campus: "GANESHA",
    faculty: "SBM",
    batch: "2022",
    nim: "19022074",
    studyProgram: "Manajemen",
    headline: "Konsultan karier mahasiswa: CV, LinkedIn, dan persiapan magang",
    about:
      "Mahasiswa SBM ITB 2022 dengan pengalaman magang di dua perusahaan teknologi. Membantu mahasiswa menyusun CV yang lolos penyaringan otomatis dan mempersiapkan wawancara kerja.",
    status: "VERIFIED",
    bank: ["Bank Mandiri", "1300077788899", "Hana Aprilia"],
    layanan: [
      {
        kategori: "konsultasi-akademik",
        title: "Review CV & Persiapan Wawancara Magang",
        description:
          "Sesi 75 menit untuk membedah CV dan berlatih wawancara.\n\nCakupan:\n• Penyesuaian CV agar lolos penyaringan otomatis\n• Perapian profil LinkedIn\n• Simulasi wawancara perilaku beserta umpan baliknya\n\nSudah termasuk berkas catatan dan templat CV siap pakai.",
        price: 180000,
        priceUnit: "PER_SESI",
        campus: "ONLINE",
      },
      {
        kategori: "digital-kreatif",
        title: "Penulisan Copy Media Sosial Organisasi",
        description:
          "Penyusunan naskah konten media sosial untuk himpunan atau UKM: 10 caption beserta ide visualnya, disusun dari satu tema besar.",
        price: 275000,
        priceUnit: "PER_PROYEK",
        campus: "ONLINE",
        deliveryDays: 5,
      },
    ],
  },
  {
    name: "Ivan Kurniawan",
    email: "ivan@students.itb.ac.id",
    phone: "081234500099",
    campus: "GANESHA",
    faculty: "STEI",
    batch: "2023",
    nim: "13523140",
    studyProgram: "Sistem dan Teknologi Informasi",
    headline: "Pembuatan website acara & dasbor data sederhana",
    about:
      "Mahasiswa STI ITB 2023 yang mengerjakan situs untuk kepanitiaan dan organisasi kampus. Terbiasa membangun landing page acara lengkap dengan formulir pendaftaran.",
    status: "PENDING",
    bank: ["Bank BCA", "7770066554", "Ivan Kurniawan"],
    layanan: [
      {
        kategori: "digital-kreatif",
        title: "Landing Page Acara + Formulir Pendaftaran",
        description:
          "Pembuatan situs satu halaman untuk acara kampus, lengkap dengan formulir pendaftaran yang datanya masuk ke spreadsheet.\n\nSudah termasuk penyesuaian tampilan untuk ponsel dan pemasangan domain milik penyelenggara.",
        price: 750000,
        priceUnit: "PER_PROYEK",
        campus: "ONLINE",
        deliveryDays: 10,
      },
    ],
  },
];

// ── Pengguna jasa ────────────────────────────────────────────────────────
const PENGGUNA = [
  { name: "Nadia Puspita", email: "nadia@students.itb.ac.id", phone: "081299900011", campus: "GANESHA", faculty: "FTSL", batch: "2024" },
  { name: "Reza Aditya", email: "reza@students.itb.ac.id", phone: "081299900022", campus: "GANESHA", faculty: "STEI", batch: "2024" },
  { name: "Kirana Dewi", email: "kirana@students.itb.ac.id", phone: "081299900033", campus: "JATINANGOR", faculty: "SITH", batch: "2023" },
  { name: "Yoga Pratama", email: "yoga@students.itb.ac.id", phone: "081299900044", campus: "GANESHA", faculty: "FTMD", batch: "2022" },
];

const ULASAN = [
  "Penjelasannya runtut dan sabar. Materi yang tadinya membingungkan jadi masuk akal setelah dibedah pelan-pelan.",
  "Hasilnya rapi dan pengerjaannya tepat waktu. Revisi juga ditanggapi cepat tanpa dipersulit.",
  "Komunikasi enak dari awal sampai serah terima. Sangat direkomendasikan untuk kepanitiaan lain.",
  "Kualitasnya melebihi harapan untuk harga semahasiswa ini. Pasti pesan lagi semester depan.",
  "Prosesnya jelas dan terjadwal. Saya tinggal mengikuti arahan dan hasilnya memuaskan.",
  "Responsif dan profesional. Briefnya dipahami dengan baik sejak pertemuan pertama.",
];

async function main() {
  console.log("→ Membersihkan data lama…");
  await prisma.notification.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.serviceImage.deleteMany();
  await prisma.service.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.setting.deleteMany();

  // ── Pengaturan platform ───────────────────────────────────────────────
  console.log("→ Menyimpan pengaturan platform…");
  await prisma.setting.createMany({
    data: [
      { key: "commission_percent", value: "8" },
      { key: "admin_fee", value: "2000" },
      { key: "bank_name", value: "Bank Mandiri" },
      { key: "bank_account", value: "1300099887766" },
      { key: "bank_holder", value: "Bermakna Enterprise KM ITB" },
      { key: "support_whatsapp", value: "6281200001234" },
    ],
  });

  // ── Kategori ──────────────────────────────────────────────────────────
  console.log("→ Membuat 10 kategori layanan…");
  const kategoriMap = new Map<string, string>();
  for (const [i, k] of KATEGORI.entries()) {
    const row = await prisma.category.create({
      data: { slug: k.slug, name: k.name, tagline: k.tagline, icon: k.icon, order: i },
    });
    kategoriMap.set(k.slug, row.id);
  }

  // ── Administrator ─────────────────────────────────────────────────────
  console.log("→ Membuat akun demo…");
  await prisma.user.create({
    data: {
      name: "Tarisha — Admin Bermakna",
      email: "admin@bermakna.id",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN",
      phone: "6281200001234",
      campus: "GANESHA",
      faculty: "Kabinet KM ITB",
      batch: "2022",
    },
  });

  // ── Pengguna jasa ─────────────────────────────────────────────────────
  const penggunaIds: string[] = [];
  for (const p of PENGGUNA) {
    const row = await prisma.user.create({
      data: { ...p, passwordHash: hashPassword("pengguna123"), role: "USER" },
    });
    penggunaIds.push(row.id);
  }

  // ── Penyedia jasa + layanan + portofolio ──────────────────────────────
  console.log("→ Membuat penyedia jasa dan katalog layanan…");
  const layananTerbuat: { id: string; providerId: string; price: number; unit: string }[] = [];

  for (const [idx, p] of PENYEDIA.entries()) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash: hashPassword("penyedia123"),
        role: "PROVIDER",
        phone: p.phone,
        campus: p.campus,
        faculty: p.faculty,
        batch: p.batch,
      },
    });

    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        headline: p.headline,
        about: p.about,
        nim: p.nim,
        studyProgram: p.studyProgram,
        status: p.status,
        verifiedAt: p.status === "VERIFIED" ? hariLalu(40 - idx) : null,
        isPremium: p.isPremium ?? false,
        premiumUntil: p.isPremium ? new Date(Date.now() + 90 * 864e5) : null,
        bankName: p.bank[0],
        bankAccount: p.bank[1],
        bankHolder: p.bank[2],
      },
    });

    for (const item of p.portfolio ?? []) {
      await prisma.portfolioItem.create({
        data: { providerId: provider.id, title: item.title, description: item.description, imageUrl: "" },
      });
    }

    for (const [j, s] of p.layanan.entries()) {
      const service = await prisma.service.create({
        data: {
          slug: slug(s.title, `${idx}${j}`),
          title: s.title,
          description: s.description,
          categoryId: kategoriMap.get(s.kategori)!,
          providerId: provider.id,
          price: s.price,
          priceUnit: s.priceUnit,
          campus: s.campus,
          location: s.location ?? null,
          deliveryDays: s.deliveryDays ?? null,
          status: p.status === "VERIFIED" ? "ACTIVE" : "PAUSED",
          views: 40 + Math.floor(Math.random() * 460),
          createdAt: hariLalu(35 - idx),
        },
      });
      if (p.status === "VERIFIED") {
        layananTerbuat.push({ id: service.id, providerId: provider.id, price: s.price, unit: s.priceUnit });
      }
    }
  }

  // ── Transaksi contoh dengan bermacam status ───────────────────────────
  console.log("→ Membuat riwayat transaksi contoh…");
  const settings = { commissionPercent: 8, adminFee: 2000 };
  const statusPola = [
    "SELESAI", "SELESAI", "SELESAI", "SELESAI", "SELESAI", "SELESAI", "SELESAI",
    "DIKERJAKAN", "DIKERJAKAN", "DIKERJAKAN",
    "MENUNGGU_VERIFIKASI", "MENUNGGU_VERIFIKASI",
    "MENUNGGU_PEMBAYARAN", "MENUNGGU_PEMBAYARAN",
    "MENUNGGU_KONFIRMASI", "MENUNGGU_KONFIRMASI",
    "DIBATALKAN", "DITOLAK",
  ];

  let ulasanIdx = 0;
  for (const [i, status] of statusPola.entries()) {
    const layanan = layananTerbuat[i % layananTerbuat.length]!;
    const buyerId = penggunaIds[i % penggunaIds.length]!;
    const quantity = layanan.unit === "PER_HALAMAN" ? 6 : layanan.unit === "PER_ORANG" ? 3 : 1;

    const subtotal = layanan.price * quantity;
    const commission = Math.round((subtotal * settings.commissionPercent) / 100);
    const dibuat = hariLalu(30 - i);

    const order = await prisma.order.create({
      data: {
        code: kodePesanan(i),
        serviceId: layanan.id,
        buyerId,
        providerId: layanan.providerId,
        quantity,
        unitPrice: layanan.price,
        subtotal,
        adminFee: settings.adminFee,
        commission,
        total: subtotal + settings.adminFee,
        providerPayout: subtotal - commission,
        status,
        note: "Mohon dikonfirmasi ya, terima kasih.",
        contactPhone: "0812999000" + (10 + i),
        scheduledAt: new Date(Date.now() + (i % 10) * 864e5),
        createdAt: dibuat,
        completedAt: status === "SELESAI" ? hariLalu(28 - i) : null,
        rejectReason: status === "DITOLAK" ? "Jadwal penyedia sedang penuh pada tanggal tersebut." : null,
      },
    });

    await prisma.orderEvent.create({
      data: { orderId: order.id, status: "MENUNGGU_KONFIRMASI", message: "Pesanan dibuat oleh pengguna.", actor: "Pengguna", createdAt: dibuat },
    });

    // Pembayaran untuk pesanan yang sudah melewati tahap transfer.
    if (["MENUNGGU_VERIFIKASI", "DIKERJAKAN", "SELESAI"].includes(status)) {
      const terverifikasi = status !== "MENUNGGU_VERIFIKASI";
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: subtotal + settings.adminFee,
          senderName: "Pengirim Demo",
          senderBank: "Bank BCA",
          proofUrl: "",
          status: terverifikasi ? "TERVERIFIKASI" : "MENUNGGU",
          verifiedAt: terverifikasi ? hariLalu(29 - i) : null,
          createdAt: hariLalu(29 - i),
        },
      });
    }

    // Review hanya untuk pesanan yang sudah selesai.
    if (status === "SELESAI" && ulasanIdx < 6) {
      const rating = [5, 5, 4, 5, 4, 5][ulasanIdx]!;
      await prisma.review.create({
        data: {
          orderId: order.id,
          serviceId: layanan.id,
          providerId: layanan.providerId,
          authorId: buyerId,
          rating,
          comment: ULASAN[ulasanIdx]!,
          createdAt: hariLalu(27 - i),
        },
      });
      ulasanIdx++;
    }
  }

  // ── Menyegarkan agregat rating & jumlah pesanan ───────────────────────
  console.log("→ Menghitung ulang rating dan statistik…");
  for (const layanan of await prisma.service.findMany({ select: { id: true } })) {
    const agg = await prisma.review.aggregate({
      where: { serviceId: layanan.id },
      _avg: { rating: true },
      _count: true,
    });
    const orderCount = await prisma.order.count({
      where: { serviceId: layanan.id, status: "SELESAI" },
    });
    await prisma.service.update({
      where: { id: layanan.id },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count,
        orderCount,
      },
    });
  }

  for (const provider of await prisma.provider.findMany({ select: { id: true } })) {
    const agg = await prisma.review.aggregate({
      where: { providerId: provider.id },
      _avg: { rating: true },
      _count: true,
    });
    const completed = await prisma.order.count({
      where: { providerId: provider.id, status: "SELESAI" },
    });
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count,
        completedOrders: completed,
      },
    });
  }

  const jumlah = {
    kategori: await prisma.category.count(),
    pengguna: await prisma.user.count(),
    penyedia: await prisma.provider.count(),
    layanan: await prisma.service.count(),
    pesanan: await prisma.order.count(),
    review: await prisma.review.count(),
  };

  console.log("\n✓ Data awal siap.");
  console.table(jumlah);
  console.log(`
  Akun demo (kata sandi di sebelah kanan):
  ┌──────────────┬─────────────────────────────┬──────────────┐
  │ Admin        │ admin@bermakna.id           │ admin123     │
  │ Penyedia     │ alya@students.itb.ac.id     │ penyedia123  │
  │ Penyedia     │ bimo@students.itb.ac.id     │ penyedia123  │
  │ Pengguna     │ nadia@students.itb.ac.id    │ pengguna123  │
  └──────────────┴─────────────────────────────┴──────────────┘
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
