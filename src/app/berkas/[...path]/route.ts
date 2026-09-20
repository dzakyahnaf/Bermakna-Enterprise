import { responsBerkas } from "@/lib/penyimpanan";

/**
 * Gambar publik (foto layanan, portofolio, avatar) dari disk lokal.
 *
 * Di VPS, Caddy melayani /berkas/* langsung dari disk sebelum permintaannya
 * sampai ke aplikasi. Rute ini cadangan untuk `npm start` tanpa Caddy.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const res = await responsBerkas("publik", path.join("/"), {
    // Nama berkas selalu unik per unggahan, jadi isinya tidak pernah berubah.
    "cache-control": "public, max-age=31536000, immutable",
  });
  return res ?? new Response("Not found", { status: 404 });
}
