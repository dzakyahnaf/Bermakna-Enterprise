import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { campusLabel } from "@/lib/constants";
import { Avatar, EmptyState, Icon, PremiumBadge, Stars, VerifiedBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Daftar Penyedia",
  description:
    "Mahasiswa ITB terverifikasi yang menawarkan jasa di Bermakna Enterprise — lengkap dengan rating, portofolio, dan rekam jejak pesanan.",
};

export default async function DaftarPenyedia({
  searchParams,
}: {
  searchParams: Promise<{ kampus?: string }>;
}) {
  const { kampus = "" } = await searchParams;

  const penyedia = await prisma.provider.findMany({
    where: {
      status: "VERIFIED",
      ...(kampus ? { user: { campus: kampus } } : {}),
    },
    orderBy: [{ isPremium: "desc" }, { ratingAvg: "desc" }, { completedOrders: "desc" }],
    include: {
      user: { select: { name: true, avatarUrl: true, faculty: true, batch: true, campus: true } },
      _count: { select: { services: { where: { status: "ACTIVE" } } } },
    },
  });

  const kampusPilihan = [
    { value: "", label: "Semua kampus" },
    { value: "GANESHA", label: "Ganesha" },
    { value: "JATINANGOR", label: "Jatinangor" },
    { value: "CIREBON", label: "Cirebon" },
  ];

  return (
    <div className="wrap py-10">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow mb-2">Penyedia terverifikasi</p>
        <h1 className="judul text-3xl sm:text-4xl">Mahasiswa di balik setiap layanan.</h1>
        <p className="mt-3 leading-relaxed text-tinta-600">
          Setiap penyedia diperiksa identitas kemahasiswaannya oleh pengurus Bermakna Enterprise
          sebelum layanannya boleh tayang.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {kampusPilihan.map((k) => (
          <Link
            key={k.value}
            href={k.value ? `/penyedia?kampus=${k.value}` : "/penyedia"}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              kampus === k.value
                ? "pita-gradien text-white"
                : "border border-krem-300 bg-white text-tinta-700 hover:border-oranye-500"
            }`}
          >
            {k.label}
          </Link>
        ))}
      </div>

      {penyedia.length === 0 ? (
        <EmptyState
          icon="🧑‍🎓"
          title="Belum ada penyedia di kampus ini"
          description="Kalau kamu mahasiswa di kampus tersebut, kamu bisa jadi penyedia pertamanya."
          action={{ href: "/jadi-penyedia", label: "Jadi penyedia jasa" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {penyedia.map((p) => (
            <Link
              key={p.id}
              href={`/penyedia/${p.id}`}
              className="card group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-oranye-500/50"
            >
              <div className="flex items-start gap-3">
                <Avatar name={p.user.name} url={p.user.avatarUrl} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-tinta-900 group-hover:text-merah-500">
                    {p.user.name}
                  </p>
                  <p className="truncate text-xs text-tinta-600">
                    {p.studyProgram} · {p.user.faculty}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <VerifiedBadge withText={false} />
                    {p.isPremium && <PremiumBadge />}
                  </div>
                </div>
              </div>

              <p className="mt-3.5 line-clamp-2 flex-1 text-sm leading-relaxed text-tinta-700">
                {p.headline}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-krem-200 pt-3 text-xs text-tinta-600">
                <Stars value={p.ratingAvg} count={p.ratingCount} />
                <span>{p._count.services} layanan</span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-tinta-500">
                <Icon name="mapPin" size={13} />
                {campusLabel(p.user.campus)} · {p.completedOrders} pesanan selesai
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
