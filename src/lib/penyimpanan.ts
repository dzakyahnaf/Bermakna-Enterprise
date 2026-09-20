import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { BUCKET_PRIVAT, BUCKET_PUBLIK, supabaseAdmin, urlPublik } from "@/lib/supabase";

/**
 * Tempat berkas unggahan disimpan, dipilih lewat variabel lingkungan:
 *
 *  - STORAGE_DIR terisi → disk lokal. Dipakai di VPS: gambar publik dilayani
 *    Caddy langsung dari disk, sedangkan berkas privat hanya bisa dibuka lewat
 *    tautan bertanda tangan yang diperiksa aplikasi (app/berkas-privat).
 *  - STORAGE_DIR kosong → Supabase Storage. Dipakai di Vercel, yang tidak
 *    punya disk permanen.
 *
 * Keduanya memakai path yang sama persis (mis. "ktm/1718…-a1b2c3.webp"), jadi
 * data bisa dipindahkan dari yang satu ke yang lain cukup dengan menyalin
 * berkasnya.
 */

export type Wilayah = "publik" | "privat";

// Path yang sah: satu folder yang dikenal + satu nama berkas. Menolak "..",
// garis miring tambahan, dan nama berawalan titik.
const POLA_PATH: Record<Wilayah, RegExp> = {
  publik: /^(avatar|layanan|portofolio)\/[A-Za-z0-9][A-Za-z0-9._-]*$/,
  privat: /^(ktm|bukti)\/[A-Za-z0-9][A-Za-z0-9._-]*$/,
};

function akarLokal(): string | null {
  const dir = process.env.STORAGE_DIR;
  return dir ? path.resolve(dir) : null;
}

export function pakaiDiskLokal(): boolean {
  return akarLokal() !== null;
}

/**
 * Lokasi berkas di disk. Null bila penyimpanan bukan disk lokal atau path-nya
 * tidak sah — pemanggil cukup memperlakukannya sebagai "tidak ditemukan".
 */
export function lokasiBerkas(wilayah: Wilayah, p: string): string | null {
  const akar = akarLokal();
  if (!akar || !POLA_PATH[wilayah].test(p)) return null;
  const dasar = path.join(akar, wilayah);
  const lokasi = path.join(dasar, p);
  return lokasi.startsWith(dasar + path.sep) ? lokasi : null;
}

async function tulisKeDisk(wilayah: Wilayah, p: string, isi: Buffer): Promise<void> {
  const lokasi = lokasiBerkas(wilayah, p);
  if (!lokasi) throw new Error(`path berkas tidak sah: ${p}`);
  await fs.mkdir(path.dirname(lokasi), { recursive: true });
  // Tulis ke berkas sementara lalu rename, supaya pengunjung tidak pernah
  // menerima gambar yang baru setengah tertulis.
  const sementara = `${lokasi}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(sementara, isi, { flag: "wx" });
  await fs.rename(sementara, lokasi);
}

/**
 * Galat disk memuat path internal server (mis. "EACCES … /data/berkas/…").
 * Pesan galat unggahan ditampilkan ke pengguna, jadi rinciannya cukup masuk
 * log server.
 */
async function lindungi<T>(kerja: () => Promise<T>): Promise<T> {
  try {
    return await kerja();
  } catch (e) {
    console.error("[Bermakna] penyimpanan disk gagal:", e);
    throw new Error("penyimpanan server sedang bermasalah, coba lagi sebentar lagi");
  }
}

// ── Tautan bertanda tangan untuk berkas privat ───────────────────────────

function kunciTautan(): Buffer {
  const rahasia = process.env.SESSION_SECRET;
  if (!rahasia) throw new Error("SESSION_SECRET belum diisi.");
  // Kunci turunan: tanda tangan tautan berkas tidak bisa dipakai sebagai
  // tanda tangan cookie sesi, dan sebaliknya.
  return crypto.createHmac("sha256", rahasia).update("bermakna:tautan-berkas-privat").digest();
}

function tandaTangan(p: string, berlaku: number): string {
  return crypto.createHmac("sha256", kunciTautan()).update(`${p}\n${berlaku}`).digest("base64url");
}

/**
 * Memeriksa tautan berkas privat. Mengembalikan sisa masa berlakunya dalam
 * detik bila sah, atau null bila palsu atau sudah kedaluwarsa.
 */
export function periksaTautan(
  p: string,
  berlaku: string | null,
  tanda: string | null,
): number | null {
  if (!berlaku || !tanda || !/^\d{1,12}$/.test(berlaku)) return null;
  const sisa = Number(berlaku) - Math.floor(Date.now() / 1000);
  if (sisa <= 0) return null;
  const a = Buffer.from(tanda);
  const b = Buffer.from(tandaTangan(p, Number(berlaku)));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return sisa;
}

// ── Operasi penyimpanan ──────────────────────────────────────────────────

/** Menyimpan berkas publik dan mengembalikan URL yang siap dipakai di src. */
export async function simpanPublik(p: string, isi: Buffer, tipe: string): Promise<string> {
  if (pakaiDiskLokal()) {
    await lindungi(() => tulisKeDisk("publik", p, isi));
    return `/berkas/${p}`;
  }
  const { error } = await supabaseAdmin()
    .storage.from(BUCKET_PUBLIK)
    .upload(p, isi, { contentType: tipe, upsert: false });
  if (error) throw new Error(error.message);
  return urlPublik(p);
}

export async function simpanPrivat(p: string, isi: Buffer, tipe: string): Promise<void> {
  if (pakaiDiskLokal()) {
    await lindungi(() => tulisKeDisk("privat", p, isi));
    return;
  }
  const { error } = await supabaseAdmin()
    .storage.from(BUCKET_PRIVAT)
    .upload(p, isi, { contentType: tipe, upsert: false });
  if (error) throw new Error(error.message);
}

export async function tautanPrivat(p: string, detik: number): Promise<string | null> {
  if (pakaiDiskLokal()) {
    if (!lokasiBerkas("privat", p)) return null;
    const berlaku = Math.floor(Date.now() / 1000) + detik;
    return `/berkas-privat/${p}?berlaku=${berlaku}&tanda=${tandaTangan(p, berlaku)}`;
  }
  const { data, error } = await supabaseAdmin()
    .storage.from(BUCKET_PRIVAT)
    .createSignedUrl(p, detik);
  if (error) {
    console.error("[Bermakna] gagal membuat signed URL:", error.message);
    return null;
  }
  return data.signedUrl;
}

export async function hapusPrivat(p: string): Promise<void> {
  if (pakaiDiskLokal()) {
    const lokasi = lokasiBerkas("privat", p);
    if (lokasi) await fs.rm(lokasi, { force: true }).catch((e) => console.error("[Bermakna] gagal menghapus berkas:", e));
    return;
  }
  const { error } = await supabaseAdmin().storage.from(BUCKET_PRIVAT).remove([p]);
  if (error) console.error("[Bermakna] gagal menghapus berkas:", error.message);
}

// ── Melayani berkas dari disk (dipakai rute app/berkas & app/berkas-privat) ─

const TIPE_MIME: Record<string, string> = {
  webp: "image/webp",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
};

/** Membaca berkas dari disk sebagai Response, atau null bila tidak ada. */
export async function responsBerkas(
  wilayah: Wilayah,
  p: string,
  header: Record<string, string>,
): Promise<Response | null> {
  const lokasi = lokasiBerkas(wilayah, p);
  if (!lokasi) return null;
  let isi: Buffer;
  try {
    isi = await fs.readFile(lokasi);
  } catch {
    return null;
  }
  const ext = p.slice(p.lastIndexOf(".") + 1).toLowerCase();
  return new Response(new Uint8Array(isi), {
    headers: {
      "content-type": TIPE_MIME[ext] ?? "application/octet-stream",
      "content-length": String(isi.length),
      "x-content-type-options": "nosniff",
      ...header,
    },
  });
}
