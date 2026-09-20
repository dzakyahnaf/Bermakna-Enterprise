import { prisma } from "@/lib/prisma";

/**
 * Pemeriksa kesehatan untuk Docker: aplikasi hidup dan database terjangkau.
 * Dipakai `docker compose up --wait` saat deploy. Tidak memaparkan apa pun
 * selain ya/tidak.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const header = { "cache-control": "no-store" };
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ sehat: true }, { headers: header });
  } catch {
    return Response.json({ sehat: false }, { status: 503, headers: header });
  }
}
