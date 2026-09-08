import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

/**
 * Peta situs untuk mesin telusur.
 *
 * Hanya memuat halaman publik: beranda, kategori, layanan yang tayang, dan
 * profil penyedia terverifikasi. Halaman berakun sengaja tidak dimasukkan —
 * lihat robots.ts.
 */
export const revalidate = 3600;

function alamatSitus() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const situs = alamatSitus();

  const tetap: MetadataRoute.Sitemap = [
    { url: situs, changeFrequency: "daily", priority: 1 },
    { url: `${situs}/jelajah`, changeFrequency: "daily", priority: 0.9 },
    { url: `${situs}/kategori`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${situs}/penyedia`, changeFrequency: "daily", priority: 0.8 },
    { url: `${situs}/tentang`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${situs}/jadi-penyedia`, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Database bisa saja sedang tidak aktif (proyek Supabase gratis ter-pause).
  // Peta situs tetap harus terbit dengan halaman tetapnya, bukan gagal total.
  try {
    const [kategori, layanan, penyedia] = await Promise.all([
      prisma.category.findMany({ select: { slug: true } }),
      prisma.service.findMany({
        where: { status: "ACTIVE", provider: { status: "VERIFIED" } },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.provider.findMany({
        where: { status: "VERIFIED" },
        select: { id: true, updatedAt: true },
        take: 5000,
      }),
    ]);

    return [
      ...tetap,
      ...kategori.map((k) => ({
        url: `${situs}/kategori/${k.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...layanan.map((s) => ({
        url: `${situs}/layanan/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...penyedia.map((p) => ({
        url: `${situs}/penyedia/${p.id}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return tetap;
  }
}
