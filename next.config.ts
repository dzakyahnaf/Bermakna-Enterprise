import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build Docker (VPS) butuh keluaran "standalone": server Node mandiri
  // beserta hanya dependensi yang benar-benar dipakai. Vercel tidak
  // membutuhkannya, jadi hanya dinyalakan oleh Dockerfile.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Folder ini adalah akar proyek — mencegah Next.js salah menebak karena
  // ada lockfile lain di direktori induk.
  outputFileTracingRoot: __dirname,
  // sharp memuat binary asli — biarkan Node yang me-require-nya, jangan dibundel.
  serverExternalPackages: ["@prisma/client", "sharp"],
  experimental: {
    serverActions: {
      // Bukti transfer, KTM, dan foto portofolio diunggah lewat Server Action.
      // Gambar dikompresi di server, jadi batas ini hanya untuk berkas mentahnya.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
