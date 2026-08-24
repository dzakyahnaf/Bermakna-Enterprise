import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
