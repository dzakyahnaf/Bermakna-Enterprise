import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { tautanWhatsapp } from "@/lib/format";
import { Logo } from "@/components/logo";

export async function SiteFooter() {
  const settings = await getSettings();

  // Kanal pada model bisnis proposal: Website, Instagram, WhatsApp Business.
  const wa = tautanWhatsapp(
    settings.supportWhatsapp,
    "Halo Bermakna Enterprise, saya ingin bertanya soal platform.",
  );

  const kategori = await prisma.category.findMany({
    orderBy: { order: "asc" },
    take: 6,
    select: { slug: true, name: true },
  });

  return (
    <footer className="mt-20 border-t border-krem-300 bg-krem-50">
      <div className="wrap py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-tinta-600">
              Marketplace jasa mahasiswa ITB yang terintegrasi — mempertemukan penyedia dan
              pengguna jasa dalam satu ekosistem yang transparan dan terpercaya.
            </p>
            <p className="mt-4 text-sm font-bold text-merah-500">“From Us, For Together.”</p>

            {(settings.instagram || wa) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {settings.instagram && (
                  <a
                    href={settings.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary btn-sm"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.43.42.7.82.9 1.4.18.4.38 1 .43 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2-.22.6-.48 1-.9 1.4-.42.43-.82.7-1.4.9-.4.18-1 .38-2.2.43-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42-.6-.22-1-.48-1.4-.9-.43-.42-.7-.82-.9-1.4-.18-.4-.38-1-.43-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.22-.6.48-1 .9-1.4.42-.43.82-.7 1.4-.9.4-.18 1-.38 2.2-.43C8.4 2.2 8.8 2.2 12 2.2zm0 3.3a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 10.7a4.2 4.2 0 110-8.4 4.2 4.2 0 010 8.4zm6.8-10.9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                    Instagram
                  </a>
                )}
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa btn-sm">
                    WhatsApp Business
                  </a>
                )}
              </div>
            )}
          </div>

          <KolomFooter
            judul="Platform"
            tautan={[
              { href: "/jelajah", label: "Jelajah Layanan" },
              { href: "/kategori", label: "Semua Kategori" },
              { href: "/penyedia", label: "Daftar Penyedia" },
              { href: "/jadi-penyedia", label: "Jadi Penyedia" },
            ]}
          />

          <KolomFooter
            judul="Kategori Populer"
            tautan={kategori.map((k) => ({
              href: `/kategori/${k.slug}`,
              label: k.name,
            }))}
          />

          <KolomFooter
            judul="Program"
            tautan={[
              { href: "/tentang", label: "Tentang Bermakna" },
              { href: "/tentang#model-bisnis", label: "Model Bisnis" },
              { href: "/tentang#tim", label: "Tim Kami" },
              { href: "/masuk", label: "Masuk ke Akun" },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-krem-300 pt-6 text-xs text-tinta-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Bermakna Enterprise · Kabinet Bermakna KM ITB 2026/2027
          </p>
          <p>Program Mahasiswa Wirausaha 2026 · Kampus Ganesha, Jatinangor & Cirebon</p>
        </div>
      </div>
    </footer>
  );
}

function KolomFooter({
  judul,
  tautan,
}: {
  judul: string;
  tautan: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-bold text-tinta-900">{judul}</p>
      <ul className="space-y-2">
        {tautan.map((t) => (
          <li key={t.href + t.label}>
            <Link
              href={t.href}
              className="text-sm text-tinta-600 transition-colors hover:text-merah-500"
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
