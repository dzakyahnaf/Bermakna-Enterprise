import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { PILIH_KARTU_LAYANAN, ServiceCard } from "@/components/service-card";
import { EmptyState, Icon } from "@/components/ui";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const kategori = await prisma.category.findUnique({ where: { slug } });
  if (!kategori) return { title: "Kategori tidak ditemukan" };
  return { title: kategori.name, description: kategori.tagline };
}

export default async function HalamanKategori({ params }: Params) {
  const { slug } = await params;

  const kategori = await prisma.category.findUnique({ where: { slug } });
  if (!kategori) notFound();

  const [layanan, lainnya] = await Promise.all([
    prisma.service.findMany({
      where: { categoryId: kategori.id, status: "ACTIVE", provider: { status: "VERIFIED" } },
      orderBy: [
        { provider: { isPremium: "desc" } },
        { ratingAvg: "desc" },
        { orderCount: "desc" },
      ],
      take: 24,
      select: PILIH_KARTU_LAYANAN,
    }),
    prisma.category.findMany({
      where: { NOT: { id: kategori.id } },
      orderBy: { order: "asc" },
      select: { slug: true, name: true, icon: true },
    }),
  ]);

  return (
    <div className="wrap py-10">
      <nav className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-tinta-600">
        <Link href="/kategori" className="hover:text-merah-500">
          Kategori
        </Link>
        <Icon name="arrowRight" size={12} />
        <span className="text-tinta-900">{kategori.name}</span>
      </nav>

      <header className="card mb-8 flex flex-wrap items-center gap-5 p-6 sm:p-8">
        <span className="pita-gradien flex size-16 shrink-0 items-center justify-center rounded-2xl text-3xl">
          <span aria-hidden>{kategori.icon}</span>
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="judul text-2xl sm:text-3xl">{kategori.name}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-tinta-600">{kategori.tagline}</p>
        </div>
        <Link href={`/jelajah?kategori=${kategori.slug}`} className="btn-secondary">
          Filter lanjutan
          <Icon name="search" size={15} />
        </Link>
      </header>

      {layanan.length === 0 ? (
        <EmptyState
          icon={kategori.icon}
          title={`Belum ada layanan di kategori ${kategori.name}`}
          description="Kategori ini masih menunggu penyedia pertamanya. Kalau kamu punya keterampilan di bidang ini, daftarkan jasamu sekarang."
          action={{ href: "/jadi-penyedia", label: "Jadi penyedia pertama" }}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-tinta-600">
            {layanan.length} layanan tersedia dari penyedia terverifikasi.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {layanan.map((s) => (
              <ServiceCard key={s.slug} layanan={s} />
            ))}
          </div>
        </>
      )}

      <section className="mt-14 border-t border-krem-300 pt-8">
        <p className="mb-4 text-sm font-bold text-tinta-900">Jelajahi kategori lain</p>
        <div className="flex flex-wrap gap-2">
          {lainnya.map((k) => (
            <Link
              key={k.slug}
              href={`/kategori/${k.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-krem-300 bg-white px-3.5 py-2 text-xs font-semibold text-tinta-800 transition-all hover:-translate-y-0.5 hover:border-oranye-500 hover:text-merah-500"
            >
              <span aria-hidden>{k.icon}</span>
              {k.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
