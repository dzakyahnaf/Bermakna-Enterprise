import { PrismaClient } from "@prisma/client";

/**
 * Satu instance PrismaClient dipakai ulang antar hot-reload di mode dev,
 * supaya tidak membuka koneksi baru setiap kali berkas berubah.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
