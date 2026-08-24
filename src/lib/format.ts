/** Pemformat nilai untuk tampilan berbahasa Indonesia. */

export function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Versi ringkas untuk kartu statistik: Rp 1,2 jt / Rp 950 rb. */
export function rupiahRingkas(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (value >= 1_000) return `Rp ${Math.round(value / 1_000)} rb`;
  return rupiah(value);
}

export function angka(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function tanggal(value: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function tanggalWaktu(value: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function waktuRelatif(value: Date | string): string {
  const diff = Date.now() - new Date(value).getTime();
  const menit = Math.round(diff / 60_000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  const bulan = Math.round(hari / 30);
  if (bulan < 12) return `${bulan} bulan lalu`;
  return `${Math.round(bulan / 12)} tahun lalu`;
}

/** Membuat slug URL dari judul, dengan akhiran acak agar unik. */
export function slugify(text: string, withSuffix = true): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  if (!withSuffix) return base || "layanan";
  return `${base || "layanan"}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Menormalkan nomor telepon Indonesia ke format wa.me (62…). */
export function normalisasiWhatsapp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function tautanWhatsapp(
  phone: string | null | undefined,
  pesan: string,
): string | null {
  const nomor = normalisasiWhatsapp(phone);
  if (!nomor) return null;
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
}

export function inisial(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function potong(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/** Kode pesanan yang mudah dibaca manusia: BE-260815-4F2A */
export function buatKodePesanan(): string {
  const now = new Date();
  const tgl = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const acak = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BE-${tgl}-${acak}`;
}
