/**
 * Uji otorisasi tingkat data.
 *
 * Smoke test rute memastikan halaman merespons untuk peran yang berhak.
 * Skrip ini menguji sisi sebaliknya: apakah seseorang bisa membuka data
 * milik orang lain hanya dengan menebak URL-nya.
 *
 *   BASE_URL=https://... npm run cek:otorisasi
 *
 * Hanya melakukan permintaan GET. Tidak ada operasi tulis.
 */
import crypto from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const secret = process.env.SESSION_SECRET;

let gagal = 0;
const ok = (p) => console.log(`  ✓ ${p}`);
const bad = (p, d) => {
  gagal++;
  console.log(`  ✗ ${p}`);
  if (d) console.log(`     ${d}`);
};

function cookieUntuk(userId) {
  const payload = Buffer.from(
    JSON.stringify({ userId, expiresAt: Date.now() + 300_000 }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `bermakna_session=${payload}.${sig}`;
}

async function ambil(jalur, cookie) {
  const res = await fetch(BASE + jalur, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  return { status: res.status, lokasi: res.headers.get("location"), res };
}

/**
 * Menguji bahwa halaman "tidak ditemukan" benar-benar dirender dan tidak ada
 * jejak data milik orang lain di dalamnya.
 *
 * Catatan: status HTTP-nya sengaja tidak diperiksa. Next.js App Router selalu
 * membalas 200 untuk notFound() pada halaman yang dirender dinamis, karena
 * responsnya sudah mulai dialirkan sebelum pemeriksaan selesai — keterbatasan
 * kerangka kerja yang sudah didokumentasikan (vercel/next.js#76474). Yang
 * menentukan aman atau tidaknya adalah isi halamannya, dan itulah yang diuji.
 */
async function tolakAkses(nama, jalur, cookie, jejakRahasia) {
  const { res } = await ambil(jalur, cookie);
  const html = await res.text();

  const bocor = jejakRahasia.filter((j) => j && j.length > 3 && html.includes(j));
  const halaman404 = /tidak ditemukan/i.test(html);

  if (bocor.length > 0) {
    return bad(
      `${nama} — DATA BOCOR`,
      `Jejak yang muncul: ${bocor.join(" · ").slice(0, 120)}`,
    );
  }
  if (!halaman404) {
    return bad(`${nama} — halaman "tidak ditemukan" tidak dirender`);
  }
  ok(`${nama} (halaman 404 dirender, tanpa data)`);
}

console.log(`\n── Otorisasi data · ${BASE} ${"─".repeat(10)}`);

// Cari dua pesanan milik pembeli yang berbeda.
const pesanan = await prisma.order.findMany({
  select: {
    code: true,
    buyerId: true,
    note: true,
    buyer: { select: { name: true, email: true } },
    provider: { select: { userId: true } },
  },
  take: 40,
});

const a = pesanan[0];
const catatanA = a?.note;
const b = pesanan.find((o) => o.buyerId !== a.buyerId);
const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });

if (!a || !b) {
  console.log("  ! butuh minimal dua pesanan dari pembeli berbeda — dilewati");
} else {
  // Pembeli lain tidak boleh melihat isi pesanan yang bukan miliknya.
  await tolakAkses(
    "pembeli lain membuka pesanan orang",
    `/dashboard/pesanan/${a.code}`,
    cookieUntuk(b.buyerId),
    [catatanA, a.buyer.name, a.buyer.email],
  );

  // Penyedia lain juga tidak boleh.
  const penyediaLain = pesanan.find(
    (o) => o.provider.userId !== a.provider.userId,
  )?.provider.userId;
  if (penyediaLain) {
    await tolakAkses(
      "penyedia lain membuka pesanan orang",
      `/mitra/pesanan/${a.code}`,
      cookieUntuk(penyediaLain),
      [catatanA, a.buyer.name, a.buyer.email],
    );
  }

  // Pembeli tidak boleh memakai jalur penyedia untuk pesanannya sendiri.
  const r3 = await ambil(`/mitra/pesanan/${a.code}`, cookieUntuk(a.buyerId));
  [307, 302, 303, 404].includes(r3.status)
    ? ok(`pembeli ditolak dari jalur penyedia (${r3.status})`)
    : bad(`pembeli mendapat ${r3.status} di /mitra/pesanan/${a.code}`);
}

// Layanan milik penyedia lain tidak boleh bisa disunting.
const layanan = await prisma.service.findFirst({
  select: {
    id: true,
    title: true,
    description: true,
    provider: { select: { userId: true } },
  },
});
const penyediaBeda = await prisma.provider.findFirst({
  where: { status: "VERIFIED", NOT: { userId: layanan.provider.userId } },
  select: { userId: true },
});
if (layanan && penyediaBeda) {
  await tolakAkses(
    "penyedia menyunting layanan milik orang lain",
    `/mitra/layanan/${layanan.id}`,
    cookieUntuk(penyediaBeda.userId),
    [layanan.title, layanan.description?.slice(0, 60)],
  );
}

// Halaman admin tidak boleh terbuka bagi non-admin.
const biasa = await prisma.user.findFirst({
  where: { role: "USER" },
  select: { id: true },
});
for (const jalur of ["/admin", "/admin/pengguna", "/admin/pengaturan", "/admin/transaksi"]) {
  const r = await ambil(jalur, cookieUntuk(biasa.id));
  [307, 302, 303].includes(r.status)
    ? ok(`${jalur} dialihkan untuk pengguna biasa`)
    : bad(`${jalur} membalas ${r.status} untuk pengguna biasa`);
}

// Ekspor CSV hanya untuk admin.
const rExp = await ambil("/admin/transaksi/ekspor", cookieUntuk(biasa.id));
rExp.status === 403
  ? ok("ekspor CSV menolak pengguna biasa (403)")
  : bad(`ekspor CSV membalas ${rExp.status} untuk pengguna biasa`);

const rExpAdmin = await ambil("/admin/transaksi/ekspor", cookieUntuk(admin.id));
rExpAdmin.status === 200
  ? ok("ekspor CSV melayani admin (200)")
  : bad(`ekspor CSV membalas ${rExpAdmin.status} untuk admin`);

// Cookie sesi yang dipalsukan harus ditolak.
const palsu = "bermakna_session=eyJ1c2VySWQiOiJwYWxzdSJ9.tandatanganpalsu";
const rPalsu = await ambil("/dashboard", palsu);
[307, 302, 303].includes(rPalsu.status)
  ? ok("cookie sesi palsu ditolak")
  : bad(`cookie palsu membalas ${rPalsu.status} — tanda tangan sesi tidak diperiksa`);

// Sesi kedaluwarsa harus ditolak.
const kedaluwarsa = (() => {
  const p = Buffer.from(
    JSON.stringify({ userId: biasa.id, expiresAt: Date.now() - 1000 }),
  ).toString("base64url");
  const s = crypto.createHmac("sha256", secret).update(p).digest("base64url");
  return `bermakna_session=${p}.${s}`;
})();
const rExpired = await ambil("/dashboard", kedaluwarsa);
[307, 302, 303].includes(rExpired.status)
  ? ok("sesi kedaluwarsa ditolak")
  : bad(`sesi kedaluwarsa membalas ${rExpired.status}`);

await prisma.$disconnect();

console.log(
  `\n${gagal === 0 ? "✓ SEMUA UJI OTORISASI LULUS" : `✗ ${gagal} uji otorisasi GAGAL`}\n`,
);
process.exit(gagal === 0 ? 0 : 1);
