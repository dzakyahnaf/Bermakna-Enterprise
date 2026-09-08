/**
 * Audit integritas data Bermakna Enterprise.
 *
 * Memeriksa hal-hal yang tidak tertangkap oleh type check maupun smoke test
 * rute: apakah angka uang konsisten, apakah status pesanan masuk akal, apakah
 * agregat rating cocok dengan review yang benar-benar ada, dan apakah tabel
 * di Supabase sudah terlindungi.
 *
 *   npm run cek:data
 *
 * Skrip ini hanya membaca. Tidak ada satu pun operasi tulis.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let masalah = 0;
let peringatan = 0;

const ok = (p) => console.log(`  ✓ ${p}`);
const bad = (p, detail) => {
  masalah++;
  console.log(`  ✗ ${p}`);
  if (detail) console.log(`     ${detail}`);
};
const warn = (p, detail) => {
  peringatan++;
  console.log(`  ! ${p}`);
  if (detail) console.log(`     ${detail}`);
};
const bagian = (judul) =>
  console.log(`\n── ${judul} ${"─".repeat(Math.max(0, 52 - judul.length))}`);

/** Menjalankan satu pemeriksaan: lolos bila tidak ada baris yang menyimpang. */
async function periksa(nama, cariPelanggaran, penjelasan) {
  const pelanggar = await cariPelanggaran();
  if (pelanggar.length === 0) return ok(nama);
  bad(
    `${nama} — ${pelanggar.length} baris menyimpang`,
    `${penjelasan}\n     contoh: ${pelanggar
      .slice(0, 3)
      .map((x) => x.code ?? x.id ?? JSON.stringify(x))
      .join(", ")}`,
  );
}

// ══ 1. Kelengkapan data dasar ═══════════════════════════════════════════
bagian("Kelengkapan data");

const [kategori, pengguna, penyedia, layanan, pesanan, review, setting] =
  await Promise.all([
    prisma.category.count(),
    prisma.user.count(),
    prisma.provider.count(),
    prisma.service.count(),
    prisma.order.count(),
    prisma.review.count(),
    prisma.setting.count(),
  ]);

console.log(
  `     kategori ${kategori} · pengguna ${pengguna} · penyedia ${penyedia} · ` +
    `layanan ${layanan} · pesanan ${pesanan} · review ${review}`,
);

kategori === 10
  ? ok("Sepuluh kategori sesuai proposal")
  : bad(`Kategori berjumlah ${kategori}, seharusnya 10`);

setting >= 6
  ? ok("Pengaturan platform terisi")
  : warn(`Hanya ${setting} pengaturan tersimpan — sisanya memakai nilai bawaan`);

(await prisma.user.count({ where: { role: "ADMIN" } })) > 0
  ? ok("Ada akun administrator")
  : bad("Tidak ada akun administrator — dasbor admin tidak bisa diakses siapa pun");

// ══ 2. Konsistensi uang ═════════════════════════════════════════════════
bagian("Konsistensi perhitungan uang");

const semuaPesanan = await prisma.order.findMany({
  select: {
    code: true,
    quantity: true,
    unitPrice: true,
    subtotal: true,
    adminFee: true,
    commission: true,
    total: true,
    providerPayout: true,
  },
});

await periksa(
  "subtotal = harga satuan × jumlah",
  async () => semuaPesanan.filter((o) => o.subtotal !== o.unitPrice * o.quantity),
  "Subtotal tidak sama dengan harga satuan dikali jumlah.",
);

await periksa(
  "total dibayar = subtotal + biaya administrasi",
  async () => semuaPesanan.filter((o) => o.total !== o.subtotal + o.adminFee),
  "Nominal yang ditagih ke pembeli tidak cocok dengan rinciannya.",
);

await periksa(
  "diterima penyedia = subtotal − komisi",
  async () => semuaPesanan.filter((o) => o.providerPayout !== o.subtotal - o.commission),
  "Nominal yang diterima penyedia tidak cocok dengan rinciannya.",
);

await periksa(
  "tidak ada nominal negatif",
  async () =>
    semuaPesanan.filter(
      (o) => o.subtotal < 0 || o.total < 0 || o.providerPayout < 0 || o.commission < 0,
    ),
  "Ada nominal bernilai negatif.",
);

// ══ 3. Konsistensi status pesanan ═══════════════════════════════════════
bagian("Konsistensi status pesanan");

const STATUS_SAH = [
  "MENUNGGU_KONFIRMASI",
  "MENUNGGU_PEMBAYARAN",
  "MENUNGGU_VERIFIKASI",
  "DIKERJAKAN",
  "SELESAI",
  "DIBATALKAN",
  "DITOLAK",
];

await periksa(
  "semua status pesanan memakai nilai yang dikenal",
  async () =>
    prisma.order.findMany({
      where: { NOT: { status: { in: STATUS_SAH } } },
      select: { code: true, status: true },
    }),
  "Ada status di luar daftar yang didukung antarmuka.",
);

await periksa(
  "pesanan selesai punya tanggal penyelesaian",
  async () =>
    prisma.order.findMany({
      where: { status: "SELESAI", completedAt: null },
      select: { code: true },
    }),
  "Status SELESAI tetapi completedAt kosong.",
);

await periksa(
  "pesanan menunggu verifikasi punya bukti bayar",
  async () =>
    prisma.order.findMany({
      where: { status: "MENUNGGU_VERIFIKASI", payment: null },
      select: { code: true },
    }),
  "Tidak mungkin diverifikasi karena buktinya belum ada.",
);

await periksa(
  "pesanan dikerjakan/selesai pembayarannya sudah terverifikasi",
  async () =>
    prisma.order.findMany({
      where: {
        status: { in: ["DIKERJAKAN", "SELESAI"] },
        OR: [{ payment: null }, { payment: { status: { not: "TERVERIFIKASI" } } }],
      },
      select: { code: true, status: true },
    }),
  "Pekerjaan berjalan padahal pembayaran belum sah — ini kebocoran pendapatan.",
);

await periksa(
  "pesanan ditolak menyertakan alasan",
  async () =>
    prisma.order.findMany({
      where: { status: "DITOLAK", OR: [{ rejectReason: null }, { rejectReason: "" }] },
      select: { code: true },
    }),
  "Pembeli tidak diberi tahu alasan penolakan.",
);

// ══ 4. Aturan review ════════════════════════════════════════════════════
bagian("Aturan rating & review");

await periksa(
  "review hanya pada pesanan yang selesai",
  async () =>
    prisma.review.findMany({
      where: { order: { status: { not: "SELESAI" } } },
      select: { id: true, order: { select: { code: true, status: true } } },
    }),
  "Kontrol kualitas bocor: ada review pada pesanan yang belum tuntas.",
);

const reviewSalahPenulis = await prisma.$queryRaw`
  SELECT r.id FROM "Review" r
  JOIN "Order" o ON o.id = r."orderId"
  WHERE r."authorId" <> o."buyerId"`;
reviewSalahPenulis.length === 0
  ? ok("penulis review adalah pembeli pesanan itu sendiri")
  : bad(
      `${reviewSalahPenulis.length} review ditulis oleh orang lain`,
      "Seseorang menulis review atas pesanan milik orang lain.",
    );

await periksa(
  "rating berada di rentang 1–5",
  async () =>
    prisma.review.findMany({
      where: { OR: [{ rating: { lt: 1 } }, { rating: { gt: 5 } }] },
      select: { id: true, rating: true },
    }),
  "Ada rating di luar rentang yang sah.",
);

// ══ 5. Ketepatan agregat ════════════════════════════════════════════════
bagian("Ketepatan angka agregat");

const layananSemua = await prisma.service.findMany({
  select: { id: true, slug: true, ratingAvg: true, ratingCount: true, orderCount: true },
});

const salahAgregatLayanan = [];
for (const s of layananSemua) {
  const [agg, selesai] = await Promise.all([
    prisma.review.aggregate({
      where: { serviceId: s.id },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.order.count({ where: { serviceId: s.id, status: "SELESAI" } }),
  ]);
  const rataSeharusnya = agg._avg.rating ?? 0;
  if (
    agg._count !== s.ratingCount ||
    Math.abs(rataSeharusnya - s.ratingAvg) > 0.01 ||
    selesai !== s.orderCount
  ) {
    salahAgregatLayanan.push(
      `${s.slug}: rating ${s.ratingAvg.toFixed(2)}/${s.ratingCount} vs ` +
        `${rataSeharusnya.toFixed(2)}/${agg._count}, pesanan ${s.orderCount} vs ${selesai}`,
    );
  }
}
salahAgregatLayanan.length === 0
  ? ok("agregat rating & jumlah pesanan tiap layanan akurat")
  : bad(
      `${salahAgregatLayanan.length} layanan agregatnya meleset`,
      salahAgregatLayanan.slice(0, 3).join("\n     "),
    );

const penyediaSemua = await prisma.provider.findMany({
  select: { id: true, ratingAvg: true, ratingCount: true, completedOrders: true },
});

const salahAgregatPenyedia = [];
for (const p of penyediaSemua) {
  const [agg, selesai] = await Promise.all([
    prisma.review.aggregate({
      where: { providerId: p.id },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.order.count({ where: { providerId: p.id, status: "SELESAI" } }),
  ]);
  const rataSeharusnya = agg._avg.rating ?? 0;
  if (
    agg._count !== p.ratingCount ||
    Math.abs(rataSeharusnya - p.ratingAvg) > 0.01 ||
    selesai !== p.completedOrders
  ) {
    salahAgregatPenyedia.push(
      `${p.id}: rating ${p.ratingAvg.toFixed(2)}/${p.ratingCount} vs ` +
        `${rataSeharusnya.toFixed(2)}/${agg._count}, selesai ${p.completedOrders} vs ${selesai}`,
    );
  }
}
salahAgregatPenyedia.length === 0
  ? ok("agregat rating & pesanan selesai tiap penyedia akurat")
  : bad(
      `${salahAgregatPenyedia.length} penyedia agregatnya meleset`,
      salahAgregatPenyedia.slice(0, 3).join("\n     "),
    );

// ══ 6. Aturan tayang ════════════════════════════════════════════════════
bagian("Aturan tayang & verifikasi");

await periksa(
  "layanan tayang hanya dari penyedia terverifikasi",
  async () =>
    prisma.service.findMany({
      where: { status: "ACTIVE", provider: { status: { not: "VERIFIED" } } },
      select: { slug: true },
    }),
  "Layanan tayang padahal penyedianya belum lolos verifikasi.",
);

await periksa(
  "penyedia terverifikasi punya tanggal verifikasi",
  async () =>
    prisma.provider.findMany({
      where: { status: "VERIFIED", verifiedAt: null },
      select: { id: true },
    }),
  "Status VERIFIED tetapi verifiedAt kosong — jejak auditnya hilang.",
);

await periksa(
  "penyedia ditolak menyertakan catatan",
  async () =>
    prisma.provider.findMany({
      where: { status: "REJECTED", OR: [{ reviewNote: null }, { reviewNote: "" }] },
      select: { id: true },
    }),
  "Calon penyedia tidak tahu apa yang harus diperbaiki.",
);

await periksa(
  "akun penyedia punya peran PROVIDER",
  async () =>
    prisma.provider.findMany({
      where: { user: { role: { notIn: ["PROVIDER", "ADMIN"] } } },
      select: { id: true },
    }),
  "Profil penyedia ada, tetapi peran akunnya belum diubah.",
);

// ══ 7. Berkas privat ════════════════════════════════════════════════════
bagian("Berkas & data pribadi");

const ktmPublik = await prisma.provider.findMany({
  where: { ktmUrl: { startsWith: "http" } },
  select: { id: true },
});
ktmPublik.length === 0
  ? ok("KTM disimpan sebagai path bucket privat, bukan URL publik")
  : bad(
      `${ktmPublik.length} KTM tersimpan sebagai URL langsung`,
      "URL publik berarti siapa pun yang punya tautannya bisa membuka KTM.",
    );

const buktiPublik = await prisma.payment.findMany({
  where: { proofUrl: { startsWith: "http" } },
  select: { id: true },
});
buktiPublik.length === 0
  ? ok("bukti transfer disimpan sebagai path bucket privat")
  : bad(`${buktiPublik.length} bukti transfer tersimpan sebagai URL langsung`);

// ══ 8. Keamanan basis data ══════════════════════════════════════════════
bagian("Keamanan basis data");

const rls = await prisma.$queryRaw`
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename`;

const tanpaRls = rls.filter((t) => !t.rowsecurity).map((t) => t.tablename);
if (tanpaRls.length === 0) {
  ok(`Row Level Security aktif di seluruh ${rls.length} tabel`);
} else {
  warn(
    `Row Level Security mati di ${tanpaRls.length} dari ${rls.length} tabel`,
    `${tanpaRls.join(", ")}\n     ` +
      "Aplikasi ini aman karena semua akses lewat Prisma di server dan kunci\n     " +
      "anon tidak pernah dikirim ke peramban. Tetapi bila suatu saat kunci anon\n     " +
      "dipakai di sisi klien, seluruh tabel akan terbuka. Aktifkan RLS sebagai\n     " +
      "lapisan pengaman kedua.",
  );
}

await prisma.$disconnect();

// ══ Ringkasan ═══════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(58));
if (masalah === 0 && peringatan === 0) {
  console.log("✓ SEMUA PEMERIKSAAN DATA LULUS");
} else {
  console.log(
    `${masalah === 0 ? "✓" : "✗"} ${masalah} masalah · ${peringatan} peringatan`,
  );
}
console.log("═".repeat(58) + "\n");
process.exit(masalah === 0 ? 0 : 1);
