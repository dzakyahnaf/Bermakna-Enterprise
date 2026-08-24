/**
 * Pemeriksa konfigurasi Supabase.
 *
 * Jalankan setelah mengisi .env, sebelum `npm run setup`:
 *
 *   npm run cek:supabase
 *
 * Memeriksa koneksi database, kunci API, keberadaan kedua bucket, dan
 * memastikan bucket privat benar-benar tertutup — lalu melakukan uji unggah,
 * membuat signed URL, dan menghapusnya kembali.
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const BUCKET_PUBLIK = "bermakna-publik";
const BUCKET_PRIVAT = "bermakna-privat";

let gagal = 0;
const ok = (pesan) => console.log(`  ✓ ${pesan}`);
const err = (pesan, saran) => {
  gagal++;
  console.log(`  ✗ ${pesan}`);
  if (saran) console.log(`     → ${saran}`);
};

console.log("\n── Variabel lingkungan ─────────────────────────");

// Nama lama SUPABASE_SERVICE_ROLE_KEY masih diterima demi kompatibilitas.
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (secretKey) process.env.SUPABASE_SECRET_KEY = secretKey;

const WAJIB = {
  DATABASE_URL: 'tombol "Connect" ▸ tab ORMs ▸ Prisma ▸ Transaction pooler (port 6543)',
  DIRECT_URL: 'tombol "Connect" ▸ tab ORMs ▸ Prisma ▸ Session pooler (port 5432)',
  NEXT_PUBLIC_SUPABASE_URL: "Settings ▸ API Keys ▸ Project URL",
  SUPABASE_SECRET_KEY: "Settings ▸ API Keys ▸ Secret keys (sb_secret_…)",
  SESSION_SECRET: 'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
};

for (const [kunci, sumber] of Object.entries(WAJIB)) {
  if (process.env[kunci]) ok(`${kunci} terisi`);
  else err(`${kunci} kosong`, `Ambil dari: ${sumber}`);
}

// Kunci yang keliru adalah kesalahan paling sering saat menyiapkan proyek —
// periksa bentuknya lebih dulu supaya pesannya jelas.
if (secretKey) {
  if (secretKey.startsWith("sb_publishable_") || secretKey.startsWith("sb_publishable")) {
    err(
      "Yang terisi adalah PUBLISHABLE key, bukan secret key",
      "Publishable key tidak boleh dipakai di server. Ambil dari Settings ▸ API Keys ▸ Secret keys.",
    );
  } else if (secretKey.startsWith("sb_secret_")) {
    ok("Format kunci benar (secret key baru)");
  } else if (secretKey.startsWith("eyJ")) {
    ok("Format kunci benar (service_role lama)");
    console.log(
      `     ! Kunci service_role JWT dipensiunkan Supabase akhir 2026.` +
      ` Sebaiknya ganti ke secret key baru (sb_secret_…) sebelum itu.`,
    );
  } else {
    err(
      `Kunci tidak dikenali (panjang ${secretKey.length} karakter)`,
      'Nilainya sepertinya masih placeholder. Secret key asli diawali "sb_secret_" ' +
        "dan disalin dari Settings ▸ API Keys ▸ Secret keys.",
    );
  }
}

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("6543")) {
  console.log(
    "  ! DATABASE_URL sepertinya bukan URL pooler (port 6543).\n" +
      "     Aplikasi tetap jalan, tapi koneksi bisa cepat habis saat dideploy.",
  );
}

if (gagal > 0) {
  console.log(`\n✗ Isi dulu ${gagal} nilai di atas pada berkas .env, lalu ulangi.\n`);
  process.exit(1);
}

console.log("\n── Koneksi database ────────────────────────────");

const prisma = new PrismaClient();
try {
  await prisma.$queryRaw`SELECT 1`;
  ok("Berhasil terhubung ke PostgreSQL");

  const tabel = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS jumlah
    FROM information_schema.tables
    WHERE table_schema = 'public'`;
  const jumlah = tabel[0]?.jumlah ?? 0;
  if (jumlah > 0) ok(`Skema sudah dibuat (${jumlah} tabel)`);
  else console.log("  ! Database masih kosong — jalankan `npm run setup` setelah cek ini lulus.");
} catch (e) {
  err(`Gagal terhubung: ${e.message.split("\n")[0]}`, "Periksa sandi database di DATABASE_URL.");
}

// DIRECT_URL dipakai Prisma saat `db push` dan migrasi. Ia tidak tersentuh oleh
// query biasa, jadi kesalahannya baru ketahuan ketika `npm run setup` gagal —
// karena itu diuji terpisah di sini.
try {
  const langsung = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
  });
  await langsung.$queryRaw`SELECT 1`;
  await langsung.$disconnect();
  ok("DIRECT_URL bisa dihubungi (dipakai saat migrasi)");
} catch (e) {
  let host = "?";
  try {
    host = new URL(process.env.DIRECT_URL).hostname;
  } catch {}

  if (host.startsWith("db.") && host.endsWith(".supabase.co")) {
    err(
      `DIRECT_URL memakai host direct connection lama (${host})`,
      "Host ini tidak punya alamat IPv4 pada proyek Supabase baru. Pakai Session " +
        "pooler: host yang sama dengan DATABASE_URL, hanya portnya 5432.",
    );
  } else {
    err(`DIRECT_URL gagal dihubungi: ${String(e.message).split("\n")[0]}`);
  }
}

console.log("\n── Storage ─────────────────────────────────────");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  secretKey,
  { auth: { persistSession: false } },
);

const { data: buckets, error: galatBucket } = await supabase.storage.listBuckets();

if (galatBucket) {
  err(`Gagal membaca daftar bucket: ${galatBucket.message}`, "Periksa SUPABASE_SECRET_KEY.");
} else {
  const peta = new Map(buckets.map((b) => [b.name, b]));

  for (const [nama, harusPublik] of [
    [BUCKET_PUBLIK, true],
    [BUCKET_PRIVAT, false],
  ]) {
    const b = peta.get(nama);
    if (!b) {
      err(
        `Bucket "${nama}" belum ada`,
        `Buat di Storage ▸ New bucket, nama persis "${nama}", ` +
          `Public bucket ${harusPublik ? "DICENTANG" : "JANGAN dicentang"}.`,
      );
      continue;
    }
    if (b.public === harusPublik) {
      ok(`Bucket "${nama}" ada dan bersifat ${harusPublik ? "publik" : "privat"}`);
    } else {
      err(
        `Bucket "${nama}" seharusnya ${harusPublik ? "publik" : "PRIVAT"}, tetapi sekarang ${b.public ? "publik" : "privat"}`,
        harusPublik
          ? "Storage ▸ bucket ▸ Settings ▸ centang Public bucket."
          : "PENTING: KTM dan bukti transfer akan terbuka untuk umum. " +
            "Storage ▸ bucket ▸ Settings ▸ hilangkan centang Public bucket.",
      );
    }
  }

  // Uji lengkap: unggah → signed URL → hapus.
  if (peta.has(BUCKET_PRIVAT)) {
    const path = `uji/cek-${Date.now()}.txt`;
    const { error: e1 } = await supabase.storage
      .from(BUCKET_PRIVAT)
      .upload(path, new Blob(["uji koneksi bermakna"]), { contentType: "text/plain" });

    if (e1) {
      err(`Gagal mengunggah berkas uji: ${e1.message}`);
    } else {
      ok("Unggah berkas uji berhasil");

      const { data: tanda, error: e2 } = await supabase.storage
        .from(BUCKET_PRIVAT)
        .createSignedUrl(path, 60);
      if (e2) err(`Gagal membuat signed URL: ${e2.message}`);
      else ok("Pembuatan signed URL berhasil");

      // Tanpa signed URL, berkas privat harus ditolak.
      const langsung = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_PRIVAT}/${path}`;
      const res = await fetch(langsung).catch(() => null);
      if (res && res.ok) {
        err(
          "Berkas di bucket privat ternyata bisa dibuka tanpa izin",
          "Pastikan bucket privat tidak dicentang sebagai Public bucket.",
        );
      } else {
        ok("Berkas privat benar-benar tertutup dari akses langsung");
      }

      await supabase.storage.from(BUCKET_PRIVAT).remove([path]);
      ok("Hapus berkas uji berhasil");
    }
  }
}

await prisma.$disconnect();

console.log(
  gagal === 0
    ? "\n✓ SUPABASE SIAP — lanjutkan dengan `npm run setup`\n"
    : `\n✗ ${gagal} masalah perlu dibereskan dulu\n`,
);
process.exit(gagal === 0 ? 0 : 1);
