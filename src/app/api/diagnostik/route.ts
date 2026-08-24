import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";

/**
 * Endpoint pemeriksa kesehatan deployment.
 *
 * Dibuat untuk menemukan penyebab galat setelah deploy tanpa harus membuka
 * log server. Di produksi endpoint ini MATI secara bawaan — nyalakan dengan
 * menambahkan variabel DIAGNOSTIK=1 di Vercel, lalu Redeploy.
 *
 * Yang dilaporkan hanya: variabel mana yang terisi, host dan awalan nilainya,
 * serta hasil uji koneksi. NILAI RAHASIA TIDAK PERNAH DIKELUARKAN — kata sandi
 * dan token disamarkan oleh fungsi samarkan() di bawah.
 */

export const dynamic = "force-dynamic";

/**
 * Mati secara bawaan. Endpoint ini memaparkan konfigurasi infrastruktur
 * (walau tanpa nilai rahasia), jadi tidak pantas terbuka terus-menerus di
 * produksi. Nyalakan hanya ketika sedang menelusuri masalah deployment:
 * tambahkan variabel DIAGNOSTIK=1 di Vercel, Redeploy, lalu hapus lagi
 * variabelnya setelah selesai.
 */
function aktif() {
  return process.env.DIAGNOSTIK === "1" || process.env.NODE_ENV !== "production";
}

/** Membuang kata sandi, token, dan kunci dari teks apa pun sebelum ditampilkan. */
function samarkan(teks: string): string {
  return teks
    // postgres://user:SANDI@host  → sandi disamarkan
    .replace(/:\/\/([^:@/]+):([^@]+)@/g, "://$1:***@")
    // sb_secret_xxx / eyJ… / string panjang tanpa spasi
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "sb_secret_***")
    .replace(/eyJ[A-Za-z0-9._-]{16,}/g, "eyJ***")
    .replace(/\b[A-Za-z0-9_-]{40,}\b/g, "***");
}

/** Ringkasan aman sebuah variabel lingkungan. */
function periksaVar(nama: string, nilai: string | undefined) {
  if (!nilai) return { nama, terisi: false as const };

  const dasar = { nama, terisi: true as const, panjang: nilai.length };

  if (nilai.startsWith("postgres")) {
    try {
      const u = new URL(nilai);
      return { ...dasar, host: u.hostname, port: u.port, query: u.search || "(kosong)" };
    } catch {
      return { ...dasar, catatan: "bukan URL yang sah" };
    }
  }
  if (nilai.startsWith("http")) {
    try {
      return { ...dasar, host: new URL(nilai).hostname };
    } catch {
      return { ...dasar, catatan: "bukan URL yang sah" };
    }
  }
  return { ...dasar, awalan: `${nilai.slice(0, 10)}…` };
}

export async function GET() {
  if (!aktif()) {
    return new Response("Not found", { status: 404 });
  }

  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const lingkungan = [
    periksaVar("DATABASE_URL", process.env.DATABASE_URL),
    periksaVar("DIRECT_URL", process.env.DIRECT_URL),
    periksaVar("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    periksaVar("SUPABASE_SECRET_KEY / SERVICE_ROLE_KEY", secretKey),
    periksaVar("SESSION_SECRET", process.env.SESSION_SECRET),
  ];

  // ── Uji database ──────────────────────────────────────────────────────
  let database: Record<string, unknown>;
  const mulai = Date.now();
  try {
    const baris = await prisma.$queryRaw<
      { jumlah: number }[]
    >`SELECT COUNT(*)::int AS jumlah FROM information_schema.tables WHERE table_schema = 'public'`;
    const kategori = await prisma.category.count();
    database = {
      status: "OK",
      ms: Date.now() - mulai,
      tabel: baris[0]?.jumlah ?? 0,
      kategori,
    };
  } catch (e) {
    database = {
      status: "GAGAL",
      ms: Date.now() - mulai,
      jenis: e instanceof Error ? e.constructor.name : typeof e,
      pesan: samarkan(e instanceof Error ? e.message : String(e)).slice(0, 600),
    };
  }

  // ── Uji storage ───────────────────────────────────────────────────────
  let storage: Record<string, unknown>;
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !secretKey) {
      storage = { status: "DILEWATI", alasan: "variabel Supabase belum lengkap" };
    } else {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
        auth: { persistSession: false },
      });
      const { data, error } = await sb.storage.listBuckets();
      storage = error
        ? { status: "GAGAL", pesan: samarkan(error.message).slice(0, 300) }
        : {
            status: "OK",
            bucket: data.map((b) => `${b.name} (${b.public ? "publik" : "privat"})`),
          };
    }
  } catch (e) {
    storage = {
      status: "GAGAL",
      pesan: samarkan(e instanceof Error ? e.message : String(e)).slice(0, 300),
    };
  }

  const semuaTerisi = lingkungan.every((v) => v.terisi);
  const sehat = semuaTerisi && database.status === "OK" && storage.status === "OK";

  return Response.json(
    {
      sehat,
      runtime: {
        node: process.version,
        platform: `${process.platform}-${process.arch}`,
        vercel: process.env.VERCEL === "1",
        region: process.env.VERCEL_REGION ?? "(lokal)",
        env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      },
      lingkungan,
      database,
      storage,
      saran: sehat
        ? "Semua sehat. Hapus variabel DIAGNOSTIK di Vercel untuk menutup endpoint ini lagi."
        : !semuaTerisi
          ? "Ada variabel yang belum terisi. Tambahkan di Vercel ▸ Settings ▸ Environment Variables, lalu Redeploy."
          : "Variabel lengkap tetapi koneksi gagal — periksa pesan galat di atas.",
    },
    { status: sehat ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
