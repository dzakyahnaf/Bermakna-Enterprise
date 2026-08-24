import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * Seluruh halaman di bawah layout ini memang dirender per permintaan: isinya
 * bergantung pada sesi pengguna dan data terkini dari database.
 * Menyatakannya eksplisit membuat `next build` tidak perlu menyentuh database
 * sama sekali — jadi deploy tetap berhasil walau basis data sedang tidak aktif.
 */
export const dynamic = "force-dynamic";

export default function LayoutSitus({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
