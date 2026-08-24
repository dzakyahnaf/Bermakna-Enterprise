/**
 * Smoke test rute Bermakna Enterprise.
 *
 * Memeriksa setiap halaman merespons 200 untuk peran yang berhak, dan
 * mengalihkan peran yang tidak berhak. Jalankan saat server dev sudah hidup:
 *
 *   npm run dev          (terminal 1)
 *   npm run cek:rute     (terminal 2)
 *
 * Keluar dengan kode 1 bila ada rute yang gagal, sehingga bisa dipakai di CI.
 */
import crypto from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const secret = process.env.SESSION_SECRET;

if (!secret) {
  console.error("SESSION_SECRET belum terbaca. Jalankan lewat: npm run cek:rute");
  process.exit(1);
}

/** Membuat cookie sesi yang sah tanpa perlu melalui halaman login. */
function tokenUntuk(userId) {
  const payload = Buffer.from(
    JSON.stringify({ userId, expiresAt: Date.now() + 300_000 }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `bermakna_session=${payload}.${sig}`;
}

const [admin, layanan, provider, pesanan] = await Promise.all([
  prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } }),
  prisma.service.findFirst({ where: { status: "ACTIVE" }, select: { slug: true, id: true, providerId: true } }),
  prisma.provider.findFirst({ where: { status: "VERIFIED" }, select: { id: true, userId: true } }),
  prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { code: true, buyerId: true, providerId: true },
  }),
]);

if (!admin || !layanan || !provider || !pesanan) {
  console.error("Data belum lengkap. Jalankan `npm run db:reset` terlebih dahulu.");
  process.exit(1);
}

// Pakai pemilik pesanan terakhir agar halaman detailnya pasti bisa diakses.
const pembeli = { id: pesanan.buyerId };
const penyediaPesanan = await prisma.provider.findUnique({
  where: { id: pesanan.providerId },
  select: { userId: true },
});
const layananPenyedia = await prisma.service.findFirst({
  where: { providerId: pesanan.providerId },
  select: { id: true },
});

const KELOMPOK = [
  {
    label: "Publik (tanpa login)",
    cookie: null,
    rute: [
      "/",
      "/jelajah",
      "/jelajah?q=tutor&kampus=GANESHA&urut=termurah",
      "/jelajah?kategori=kos-kontrakan&min=1000000",
      "/kategori",
      "/kategori/desain-grafis",
      "/kategori/kos-kontrakan",
      `/layanan/${layanan.slug}`,
      "/penyedia",
      "/penyedia?kampus=JATINANGOR",
      `/penyedia/${provider.id}`,
      "/tentang",
      "/masuk",
      "/daftar",
      "/jadi-penyedia",
      ["/halaman-yang-tidak-ada", 404],
    ],
  },
  {
    label: "Pengguna jasa",
    cookie: tokenUntuk(pembeli.id),
    rute: [
      "/dashboard",
      "/dashboard/pesanan",
      "/dashboard/pesanan?status=SELESAI",
      `/dashboard/pesanan/${pesanan.code}`,
      "/dashboard/review",
      "/dashboard/notifikasi",
      "/dashboard/profil",
    ],
  },
  {
    label: "Penyedia jasa",
    cookie: tokenUntuk(penyediaPesanan.userId),
    rute: [
      "/mitra",
      "/mitra/pesanan",
      "/mitra/pesanan?status=SELESAI",
      `/mitra/pesanan/${pesanan.code}`,
      "/mitra/layanan",
      "/mitra/layanan/baru",
      `/mitra/layanan/${layananPenyedia.id}`,
      "/mitra/portofolio",
      "/mitra/review",
      "/mitra/profil",
    ],
  },
  {
    label: "Administrator",
    cookie: tokenUntuk(admin.id),
    rute: [
      "/admin",
      "/admin/verifikasi",
      "/admin/verifikasi?status=SEMUA",
      "/admin/pembayaran",
      "/admin/transaksi",
      "/admin/transaksi?q=BE&status=SELESAI",
      "/admin/transaksi/ekspor",
      "/admin/penyedia",
      "/admin/layanan",
      "/admin/layanan?q=tutor",
      "/admin/pengguna",
      "/admin/pengguna?peran=PROVIDER",
      "/admin/pengaturan",
    ],
  },
];

let gagal = 0;

for (const { label, cookie, rute } of KELOMPOK) {
  console.log(`\n── ${label} ${"─".repeat(Math.max(0, 46 - label.length))}`);
  for (const entri of rute) {
    const [jalur, diharapkan] = Array.isArray(entri) ? entri : [entri, 200];
    const res = await fetch(BASE + jalur, {
      headers: cookie ? { cookie } : {},
      redirect: "manual",
    });
    const ok = res.status === diharapkan;
    if (!ok) gagal++;
    console.log(`${ok ? "  ok " : "FAIL "} ${String(res.status).padEnd(4)} ${jalur}`);
  }
}

console.log("\n── Penjagaan akses ─────────────────────────────");
const PENJAGAAN = [
  ["/admin oleh pengguna jasa", "/admin", tokenUntuk(pembeli.id)],
  ["/admin tanpa login", "/admin", null],
  ["/mitra oleh pengguna jasa", "/mitra", tokenUntuk(pembeli.id)],
  ["/dashboard tanpa login", "/dashboard", null],
  ["/admin/transaksi oleh penyedia", "/admin/transaksi", tokenUntuk(penyediaPesanan.userId)],
];

for (const [label, jalur, cookie] of PENJAGAAN) {
  const res = await fetch(BASE + jalur, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  const dialihkan = [301, 302, 303, 307, 308].includes(res.status);
  if (!dialihkan) gagal++;
  console.log(
    `${dialihkan ? "  ok " : "FAIL "} ${res.status} → ${res.headers.get("location") ?? "-"}   (${label})`,
  );
}

// Endpoint ekspor harus menolak siapa pun yang bukan admin.
const ekspor = await fetch(`${BASE}/admin/transaksi/ekspor`, { redirect: "manual" });
const ditolak = ekspor.status === 403;
if (!ditolak) gagal++;
console.log(`${ditolak ? "  ok " : "FAIL "} ${ekspor.status}          (ekspor CSV tanpa login harus 403)`);

console.log(`\n${gagal === 0 ? "✓ SEMUA RUTE LULUS" : `✗ ${gagal} RUTE GAGAL`}\n`);
await prisma.$disconnect();
process.exit(gagal === 0 ? 0 : 1);
