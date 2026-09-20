import crypto from "node:crypto";

import sharp from "sharp";

import { hapusPrivat, simpanPrivat, simpanPublik, tautanPrivat } from "@/lib/penyimpanan";

const MAX_BYTES = 8 * 1024 * 1024; // batas berkas mentah sebelum dikompresi
const TIPE_DIIZINKAN = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Berkas yang boleh dilihat siapa saja — foto layanan, portofolio, avatar. */
export type FolderPublik = "avatar" | "layanan" | "portofolio";

/** Berkas berisi data pribadi — hanya boleh dibuka lewat signed URL. */
export type FolderPrivat = "ktm" | "bukti";

type OpsiKompresi = { lebarMaks: number; kualitas: number };

// KTM dan bukti transfer perlu tetap terbaca, jadi kompresinya lebih ringan.
const KOMPRESI: Record<FolderPublik | FolderPrivat, OpsiKompresi> = {
  avatar: { lebarMaks: 512, kualitas: 80 },
  layanan: { lebarMaks: 1600, kualitas: 80 },
  portofolio: { lebarMaks: 1600, kualitas: 80 },
  ktm: { lebarMaks: 2000, kualitas: 88 },
  bukti: { lebarMaks: 1600, kualitas: 85 },
};

function periksa(file: File | null | undefined): File | null {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("Ukuran berkas maksimal 8 MB.");
  if (!TIPE_DIIZINKAN.has(file.type)) {
    throw new Error("Format berkas harus JPG, PNG, WEBP, atau GIF.");
  }
  return file;
}

/**
 * Memperkecil dan mengubah gambar ke WebP.
 * Foto ponsel 3–5 MB biasanya turun ke bawah 200 KB — menghemat disk server
 * (atau kuota 1 GB Supabase paket gratis) dan mempercepat halaman.
 */
async function kompres(
  file: File,
  opsi: OpsiKompresi,
): Promise<{ isi: Buffer; tipe: string }> {
  const asli = Buffer.from(await file.arrayBuffer());
  try {
    const isi = await sharp(asli)
      .rotate() // hormati orientasi EXIF agar foto ponsel tidak terbalik
      .resize({ width: opsi.lebarMaks, withoutEnlargement: true })
      .webp({ quality: opsi.kualitas })
      .toBuffer();
    return { isi, tipe: "image/webp" };
  } catch {
    // Bila gambar tidak bisa diproses, simpan apa adanya daripada gagal total.
    return { isi: asli, tipe: file.type };
  }
}

function namaBerkas(folder: string, tipe: string) {
  const ext = tipe.split("/")[1] ?? "bin";
  return `${folder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
}

// ── Berkas publik ────────────────────────────────────────────────────────

/**
 * Menyimpan gambar publik dan mengembalikan URL yang bisa langsung dipakai
 * pada atribut src. Mengembalikan null bila tidak ada berkas dipilih.
 */
export async function simpanGambar(
  file: File | null | undefined,
  folder: FolderPublik,
): Promise<string | null> {
  const berkas = periksa(file);
  if (!berkas) return null;

  const { isi, tipe } = await kompres(berkas, KOMPRESI[folder]);
  const path = namaBerkas(folder, tipe);

  try {
    return await simpanPublik(path, isi, tipe);
  } catch (e) {
    throw new Error(`Gagal mengunggah gambar: ${e instanceof Error ? e.message : e}`);
  }
}

/** Menyimpan beberapa gambar publik sekaligus (galeri layanan). */
export async function simpanBanyakGambar(
  files: File[],
  folder: FolderPublik,
  max = 6,
): Promise<string[]> {
  const hasil: string[] = [];
  for (const file of files.slice(0, max)) {
    const url = await simpanGambar(file, folder);
    if (url) hasil.push(url);
  }
  return hasil;
}

// ── Berkas privat ────────────────────────────────────────────────────────

/**
 * Menyimpan berkas berisi data pribadi (KTM, bukti transfer) ke area privat.
 *
 * Yang dikembalikan adalah *path*, bukan URL — area ini tertutup, jadi
 * berkasnya tidak bisa dibuka tanpa tautan bertanda tangan walaupun
 * seseorang menebak alamatnya.
 */
export async function simpanBerkasPrivat(
  file: File | null | undefined,
  folder: FolderPrivat,
): Promise<string | null> {
  const berkas = periksa(file);
  if (!berkas) return null;

  const { isi, tipe } = await kompres(berkas, KOMPRESI[folder]);
  const path = namaBerkas(folder, tipe);

  try {
    await simpanPrivat(path, isi, tipe);
  } catch (e) {
    throw new Error(`Gagal mengunggah berkas: ${e instanceof Error ? e.message : e}`);
  }
  return path;
}

/**
 * Membuat tautan sementara untuk membuka berkas privat.
 * Berlaku 1 jam — cukup untuk sekali pemeriksaan admin, dan otomatis mati
 * sehingga tautan yang tanpa sengaja tersebar tidak berumur panjang.
 */
export async function urlPrivat(
  path: string | null | undefined,
  detik = 3600,
): Promise<string | null> {
  if (!path) return null;
  return tautanPrivat(path, detik);
}

/** Menghapus berkas privat, misalnya bukti transfer lama yang diunggah ulang. */
export async function hapusBerkasPrivat(path: string | null | undefined): Promise<void> {
  if (!path) return;
  await hapusPrivat(path);
}
