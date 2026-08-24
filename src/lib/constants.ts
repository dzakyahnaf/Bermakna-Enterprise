/**
 * Nilai-nilai tetap yang dipakai di seluruh aplikasi.
 * SQLite tidak mendukung enum Prisma, jadi kontraknya dijaga di sini.
 */

// ── Peran akun ───────────────────────────────────────────────────────────
export const ROLES = {
  USER: "USER",
  PROVIDER: "PROVIDER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

// ── Kampus ITB (proposal: Ganesha, Jatinangor, Cirebon) ──────────────────
export const CAMPUSES = [
  { value: "GANESHA", label: "Kampus Ganesha" },
  { value: "JATINANGOR", label: "Kampus Jatinangor" },
  { value: "CIREBON", label: "Kampus Cirebon" },
  { value: "ONLINE", label: "Daring / Online" },
] as const;

export function campusLabel(value: string) {
  return CAMPUSES.find((c) => c.value === value)?.label ?? value;
}

// ── Satuan harga ─────────────────────────────────────────────────────────
export const PRICE_UNITS = [
  { value: "PER_JAM", label: "per jam", short: "/jam" },
  { value: "PER_SESI", label: "per sesi", short: "/sesi" },
  { value: "PER_PROYEK", label: "per proyek", short: "/proyek" },
  { value: "PER_HARI", label: "per hari", short: "/hari" },
  { value: "PER_BULAN", label: "per bulan", short: "/bulan" },
  { value: "PER_HALAMAN", label: "per halaman", short: "/halaman" },
  { value: "PER_ORANG", label: "per orang", short: "/orang" },
] as const;

export function priceUnitShort(value: string) {
  return PRICE_UNITS.find((u) => u.value === value)?.short ?? "";
}
export function priceUnitLabel(value: string) {
  return PRICE_UNITS.find((u) => u.value === value)?.label ?? "";
}

// ── Status verifikasi penyedia ───────────────────────────────────────────
export const PROVIDER_STATUS = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;

export const PROVIDER_STATUS_META: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  PENDING: { label: "Menunggu verifikasi", tone: "warning" },
  VERIFIED: { label: "Terverifikasi", tone: "success" },
  REJECTED: { label: "Ditolak", tone: "danger" },
};

// ── Alur status pesanan ──────────────────────────────────────────────────
export const ORDER_STATUS = {
  MENUNGGU_KONFIRMASI: "MENUNGGU_KONFIRMASI",
  MENUNGGU_PEMBAYARAN: "MENUNGGU_PEMBAYARAN",
  MENUNGGU_VERIFIKASI: "MENUNGGU_VERIFIKASI",
  DIKERJAKAN: "DIKERJAKAN",
  SELESAI: "SELESAI",
  DIBATALKAN: "DIBATALKAN",
  DITOLAK: "DITOLAK",
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export type BadgeTone = "neutral" | "info" | "warning" | "success" | "danger";

export const ORDER_STATUS_META: Record<
  string,
  { label: string; tone: BadgeTone; description: string }
> = {
  MENUNGGU_KONFIRMASI: {
    label: "Menunggu konfirmasi",
    tone: "warning",
    description: "Pesanan sedang menunggu penyedia menerima permintaan.",
  },
  MENUNGGU_PEMBAYARAN: {
    label: "Menunggu pembayaran",
    tone: "info",
    description: "Penyedia sudah menerima. Silakan transfer dan unggah bukti bayar.",
  },
  MENUNGGU_VERIFIKASI: {
    label: "Menunggu verifikasi",
    tone: "info",
    description: "Bukti bayar sudah diunggah dan sedang diperiksa admin.",
  },
  DIKERJAKAN: {
    label: "Sedang dikerjakan",
    tone: "info",
    description: "Pembayaran terverifikasi. Penyedia sedang mengerjakan pesanan.",
  },
  SELESAI: {
    label: "Selesai",
    tone: "success",
    description: "Pesanan selesai. Jangan lupa beri rating & review.",
  },
  DIBATALKAN: {
    label: "Dibatalkan",
    tone: "neutral",
    description: "Pesanan dibatalkan oleh pengguna.",
  },
  DITOLAK: {
    label: "Ditolak",
    tone: "danger",
    description: "Pesanan ditolak.",
  },
};

/** Status yang dihitung sebagai transaksi berjalan (belum tuntas/batal). */
export const ACTIVE_ORDER_STATUSES = [
  ORDER_STATUS.MENUNGGU_KONFIRMASI,
  ORDER_STATUS.MENUNGGU_PEMBAYARAN,
  ORDER_STATUS.MENUNGGU_VERIFIKASI,
  ORDER_STATUS.DIKERJAKAN,
];

/** Status yang dihitung sebagai pendapatan (uang sudah masuk). */
export const PAID_ORDER_STATUSES = [
  ORDER_STATUS.DIKERJAKAN,
  ORDER_STATUS.SELESAI,
];

// ── Status pembayaran ────────────────────────────────────────────────────
export const PAYMENT_STATUS = {
  MENUNGGU: "MENUNGGU",
  TERVERIFIKASI: "TERVERIFIKASI",
  DITOLAK: "DITOLAK",
} as const;

export const PAYMENT_STATUS_META: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  MENUNGGU: { label: "Menunggu diperiksa", tone: "warning" },
  TERVERIFIKASI: { label: "Terverifikasi", tone: "success" },
  DITOLAK: { label: "Ditolak", tone: "danger" },
};

// ── Status layanan ───────────────────────────────────────────────────────
export const SERVICE_STATUS_META: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  ACTIVE: { label: "Tayang", tone: "success" },
  PAUSED: { label: "Dijeda", tone: "neutral" },
  TAKEDOWN: { label: "Diturunkan admin", tone: "danger" },
};

// ── Kunci pengaturan platform ────────────────────────────────────────────
export const SETTING_KEYS = {
  COMMISSION_PERCENT: "commission_percent",
  ADMIN_FEE: "admin_fee",
  BANK_NAME: "bank_name",
  BANK_ACCOUNT: "bank_account",
  BANK_HOLDER: "bank_holder",
  SUPPORT_WHATSAPP: "support_whatsapp",
  INSTAGRAM: "instagram_url",
} as const;

export const DEFAULT_SETTINGS: Record<string, string> = {
  [SETTING_KEYS.COMMISSION_PERCENT]: "8",
  [SETTING_KEYS.ADMIN_FEE]: "2000",
  [SETTING_KEYS.BANK_NAME]: "Bank Mandiri",
  [SETTING_KEYS.BANK_ACCOUNT]: "1300099887766",
  [SETTING_KEYS.BANK_HOLDER]: "Bermakna Enterprise KM ITB",
  [SETTING_KEYS.SUPPORT_WHATSAPP]: "6281200001234",
  [SETTING_KEYS.INSTAGRAM]: "",
};

// ── Target tahun pertama (proposal hlm. 2 & 10) ──────────────────────────
export const YEAR_ONE_TARGETS = {
  users: 500,
  providers: 150,
  orders: 200,
};

// ── Pembagian warna kategori ─────────────────────────────────────────────
// Mengikuti pola "Pembagian Warna" pada GDV KM ITB 2026/2027 (hlm. 5), yang
// memberi tiap kemenkoan satu warna dari palet. Di sini pola yang sama
// diterapkan pada sepuluh kategori layanan agar tiap kategori punya identitas
// visual sendiri, dengan warna utama tetap menjadi aksen.
export const WARNA_KATEGORI: Record<
  string,
  { bg: string; teks: string; solid: string }
> = {
  "tutor-akademik": { bg: "bg-merah-100", teks: "text-merah-900", solid: "bg-merah-500" },
  "mentor-kompetisi": { bg: "bg-kuning-100", teks: "text-oranye-500", solid: "bg-kuning-400" },
  "konsultasi-akademik": { bg: "bg-biru-100", teks: "text-laut-900", solid: "bg-biru-500" },
  "desain-grafis": { bg: "bg-pink-100", teks: "text-pink-500", solid: "bg-pink-500" },
  dokumentasi: { bg: "bg-ungu-100", teks: "text-ungu-500", solid: "bg-ungu-500" },
  "video-editing": { bg: "bg-mint-100", teks: "text-tosca-500", solid: "bg-tosca-500" },
  "event-manpower": { bg: "bg-kuning-100", teks: "text-merah-900", solid: "bg-oranye-500" },
  "kos-kontrakan": { bg: "bg-hijau-100", teks: "text-hutan-900", solid: "bg-hijau-600" },
  penerjemahan: { bg: "bg-mint-100", teks: "text-laut-900", solid: "bg-mint-300" },
  "digital-kreatif": { bg: "bg-ungu-100", teks: "text-ungu-500", solid: "bg-lime-300" },
};

export function warnaKategori(slug: string) {
  return (
    WARNA_KATEGORI[slug] ?? { bg: "bg-krem-200", teks: "text-tinta-700", solid: "bg-krem-400" }
  );
}
