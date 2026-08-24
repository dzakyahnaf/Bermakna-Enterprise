import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { warnaKategori } from "@/lib/constants";
import { Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Kategori Layanan",
  description:
    "Sepuluh kategori jasa mahasiswa ITB: tutor akademik, mentor kompetisi, desain, dokumentasi, event, kos & kontrakan, dan lainnya.",
};

export default async function DaftarKategori() {
  const kategori = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { services: { where: { status: "ACTIVE" } } } },
    },
  });

  return (
    <div className="wrap py-10">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow mb-2">Kategori layanan</p>
        <h1 className="judul text-3xl sm:text-4xl">Sepuluh kategori, satu platform.</h1>
        <p className="mt-3 leading-relaxed text-tinta-600">
          Semua kebutuhan jasa mahasiswa dikelompokkan agar mudah dicari — dari kebutuhan akademik,
          kreatif, kepanitiaan, sampai tempat tinggal.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kategori.map((k, i) => {
          const w = warnaKategori(k.slug);
          return (
          <Link
            key={k.id}
            href={`/kategori/${k.slug}`}
            className="card group relative flex flex-col overflow-hidden p-6 transition-all hover:-translate-y-1"
          >
            <span className={`absolute inset-x-0 top-0 h-1.5 ${w.solid}`} aria-hidden />
            <div className="flex items-start justify-between">
              <span
                className={`inline-flex size-14 items-center justify-center rounded-2xl text-3xl ${w.bg}`}
                aria-hidden
              >
                {k.icon}
              </span>
              <span className="text-xs font-bold text-krem-400">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h2 className="mt-4 text-lg leading-snug font-bold group-hover:text-merah-500">
              {k.name}
            </h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-tinta-600">{k.tagline}</p>
            <div className="mt-4 flex items-center justify-between border-t border-krem-200 pt-3">
              <span className="text-xs font-semibold text-tinta-700">
                {k._count.services} layanan aktif
              </span>
              <span className="text-oranye-500 transition-transform group-hover:translate-x-0.5">
                <Icon name="arrowRight" size={16} />
              </span>
            </div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
