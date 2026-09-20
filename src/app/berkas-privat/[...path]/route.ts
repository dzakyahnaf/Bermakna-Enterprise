import { periksaTautan, responsBerkas } from "@/lib/penyimpanan";

/**
 * Berkas privat (KTM, bukti transfer) dari disk lokal.
 *
 * Hanya terbuka lewat tautan bertanda tangan buatan urlPrivat() yang berlaku
 * satu jam — padanan signed URL Supabase. Caddy sengaja tidak diberi akses ke
 * folder privat, jadi pemeriksaan di bawah adalah satu-satunya jalan masuk.
 */
export const dynamic = "force-dynamic";

const TANPA_CACHE = { "cache-control": "no-store" };

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const p = path.join("/");
  const { searchParams } = new URL(req.url);

  const sisa = periksaTautan(p, searchParams.get("berlaku"), searchParams.get("tanda"));
  if (sisa === null) {
    return new Response("Tautan tidak sah atau sudah kedaluwarsa.", {
      status: 403,
      headers: TANPA_CACHE,
    });
  }

  const res = await responsBerkas("privat", p, {
    "cache-control": `private, max-age=${Math.min(sisa, 3600)}`,
    "referrer-policy": "no-referrer",
    "x-robots-tag": "noindex, nofollow",
  });
  return res ?? new Response("Not found", { status: 404, headers: TANPA_CACHE });
}
