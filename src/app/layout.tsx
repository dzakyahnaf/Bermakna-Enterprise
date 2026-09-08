import type { Metadata, Viewport } from "next";
import { Aleo, Tilt_Warp } from "next/font/google";

import "./globals.css";

// Font resmi GDV KM ITB 2026/2027.
// Tilt Warp untuk heading (ditulis kapital), Aleo untuk seluruh teks lainnya.
const tiltWarp = Tilt_Warp({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-tilt-warp",
});

const aleo = Aleo({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
  variable: "--font-aleo",
});

/**
 * Alamat kanonis situs, dipakai untuk menyusun URL absolut pada metadata.
 * Saat domain khusus dipasang, cukup isi NEXT_PUBLIC_SITE_URL di Vercel —
 * tidak ada URL yang perlu diubah di dalam kode.
 */
const alamatSitus =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(alamatSitus),
  title: {
    default: "Bermakna Enterprise — Marketplace Jasa Mahasiswa ITB",
    template: "%s · Bermakna Enterprise",
  },
  description:
    "Satu kanal digital untuk semua kebutuhan jasa mahasiswa ITB: tutor akademik, mentor kompetisi, desain, dokumentasi, event, hingga kos & kontrakan. Dikelola KM ITB 2026/2027.",
  keywords: [
    "marketplace mahasiswa",
    "jasa mahasiswa ITB",
    "tutor ITB",
    "KM ITB",
    "Bermakna Enterprise",
  ],
  openGraph: {
    title: "Bermakna Enterprise — Marketplace Jasa Mahasiswa ITB",
    description:
      "Mempertemukan penyedia dan pengguna jasa mahasiswa ITB dalam satu ekosistem yang transparan, terpercaya, dan mudah diakses.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff8e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${tiltWarp.variable} ${aleo.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
