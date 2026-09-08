import type { MetadataRoute } from "next";

/**
 * Area berakun tidak perlu dirayapi mesin telusur: isinya milik masing-masing
 * pengguna dan pengunjung anonim hanya akan dialihkan ke halaman masuk.
 * Membatasinya di sini juga mencegah URL pribadi muncul di hasil pencarian.
 */
export default function robots(): MetadataRoute.Robots {
  const situs =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/mitra", "/admin", "/api"],
    },
    sitemap: `${situs}/sitemap.xml`,
  };
}
