import type { Metadata } from "next";
import Link from "next/link";

import { moderasiLayanan } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SERVICE_STATUS_META, campusLabel, priceUnitShort } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/action-form";
import { Badge, EmptyState, Icon, StatCard, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Moderasi Layanan" };

export default async function ModerasiLayanan({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const kategori = sp.kategori ?? "";

  const [layanan, daftarKategori, jumlahAktif, jumlahTakedown] = await Promise.all([
    prisma.service.findMany({
      where: {
        ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
        ...(kategori ? { category: { slug: kategori } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        category: { select: { name: true, icon: true } },
        provider: { select: { id: true, user: { select: { name: true } } } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { slug: true, name: true } }),
    prisma.service.count({ where: { status: "ACTIVE" } }),
    prisma.service.count({ where: { status: "TAKEDOWN" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Moderasi Layanan"
        description="Turunkan layanan yang melanggar ketentuan agar tidak muncul di pencarian."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Layanan tayang" value={jumlahAktif} sub="terlihat publik" />
        <StatCard label="Diturunkan admin" value={jumlahTakedown} sub="disembunyikan" />
        <StatCard label="Ditampilkan" value={layanan.length} sub="maksimal 60 terbaru" />
      </div>

      <form method="get" className="card mt-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-52 flex-1">
          <label className="label" htmlFor="q">
            Cari layanan
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Judul atau isi deskripsi"
            className="input"
          />
        </div>
        <div className="min-w-44">
          <label className="label" htmlFor="kategori">
            Kategori
          </label>
          <select id="kategori" name="kategori" defaultValue={kategori} className="select">
            <option value="">Semua kategori</option>
            {daftarKategori.map((k) => (
              <option key={k.slug} value={k.slug}>
                {k.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          <Icon name="search" size={16} />
          Cari
        </button>
        {(q || kategori) && (
          <Link href="/admin/layanan" className="btn-secondary">
            Reset
          </Link>
        )}
      </form>

      <div className="mt-6">
        {layanan.length === 0 ? (
          <EmptyState icon="📦" title="Tidak ada layanan yang cocok" />
        ) : (
          <div className="card tabel-scroll">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Layanan</th>
                  <th>Penyedia</th>
                  <th>Kategori</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">Pesanan</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {layanan.map((s) => {
                  const meta = SERVICE_STATUS_META[s.status];
                  return (
                    <tr key={s.id}>
                      <td className="max-w-56">
                        <Link
                          href={`/layanan/${s.slug}`}
                          className="block truncate font-semibold hover:text-merah-500"
                        >
                          {s.category.icon} {s.title}
                        </Link>
                        <span className="text-xs text-tinta-500">{campusLabel(s.campus)}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        <Link href={`/penyedia/${s.provider.id}`} className="hover:text-merah-500">
                          {s.provider.user.name}
                        </Link>
                      </td>
                      <td className="text-xs whitespace-nowrap">{s.category.name}</td>
                      <td className="text-right whitespace-nowrap tabular-nums">
                        {rupiah(s.price)}
                        <span className="text-xs text-tinta-500">
                          {priceUnitShort(s.priceUnit)}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">{s._count.orders}</td>
                      <td>
                        <Stars value={s.ratingAvg} count={s.ratingCount} />
                      </td>
                      <td>
                        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
                      </td>
                      <td className="text-right">
                        <form action={moderasiLayanan} className="inline-flex">
                          <input type="hidden" name="serviceId" value={s.id} />
                          <SubmitButton
                            className={
                              s.status === "TAKEDOWN" ? "btn-success btn-sm" : "btn-danger btn-sm"
                            }
                            confirm={
                              s.status === "TAKEDOWN"
                                ? "Pulihkan layanan ini? Penyedia bisa menayangkannya lagi."
                                : "Turunkan layanan ini dari pencarian publik?"
                            }
                            pendingLabel="…"
                          >
                            {s.status === "TAKEDOWN" ? "Pulihkan" : "Turunkan"}
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
