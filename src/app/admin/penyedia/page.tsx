import type { Metadata } from "next";
import Link from "next/link";

import { ubahPremium } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROVIDER_STATUS_META, campusLabel } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/action-form";
import { Avatar, Badge, EmptyState, Icon, StatCard, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Kelola Penyedia" };

export default async function KelolaPenyedia() {
  await requireAdmin();

  const [penyedia, jumlahPremium, pendapatanPerPenyedia] = await Promise.all([
    prisma.provider.findMany({
      orderBy: [{ status: "asc" }, { completedOrders: "desc" }],
      include: {
        user: { select: { name: true, email: true, avatarUrl: true, campus: true } },
        _count: { select: { services: true, orders: true } },
      },
    }),
    prisma.provider.count({ where: { isPremium: true } }),
    // Digabung ke Promise.all agar tidak menambah satu perjalanan ke database.
    prisma.order.groupBy({
      by: ["providerId"],
      where: { status: "SELESAI" },
      _sum: { providerPayout: true },
    }),
  ]);

  const petaPendapatan = new Map(
    pendapatanPerPenyedia.map((p) => [p.providerId, p._sum.providerPayout ?? 0]),
  );

  const terverifikasi = penyedia.filter((p) => p.status === "VERIFIED").length;

  return (
    <>
      <PageHeader
        title="Kelola Penyedia"
        description="Daftar seluruh penyedia jasa beserta performa dan status premium listing-nya."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total penyedia" value={penyedia.length} sub="semua status" />
        <StatCard label="Terverifikasi" value={terverifikasi} sub="boleh menayangkan layanan" />
        <StatCard label="Premium listing" value={jumlahPremium} sub="revenue stream aktif" />
      </div>

      <div className="mt-6">
        {penyedia.length === 0 ? (
          <EmptyState icon="🧑‍🎓" title="Belum ada penyedia terdaftar" />
        ) : (
          <div className="card tabel-scroll">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Penyedia</th>
                  <th>Status</th>
                  <th>Kampus</th>
                  <th className="text-right">Layanan</th>
                  <th className="text-right">Pesanan</th>
                  <th className="text-right">Pendapatan</th>
                  <th>Rating</th>
                  <th className="text-right">Premium</th>
                </tr>
              </thead>
              <tbody>
                {penyedia.map((p) => {
                  const meta = PROVIDER_STATUS_META[p.status];
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.user.name} url={p.user.avatarUrl} size={32} />
                          <div className="min-w-0">
                            <Link
                              href={`/penyedia/${p.id}`}
                              className="block font-semibold whitespace-nowrap hover:text-merah-500"
                            >
                              {p.user.name}
                            </Link>
                            <span className="text-xs text-tinta-500">{p.user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
                      </td>
                      <td className="text-xs whitespace-nowrap">{campusLabel(p.user.campus)}</td>
                      <td className="text-right tabular-nums">{p._count.services}</td>
                      <td className="text-right tabular-nums">{p._count.orders}</td>
                      <td className="text-right tabular-nums">
                        {rupiah(petaPendapatan.get(p.id) ?? 0)}
                      </td>
                      <td>
                        <Stars value={p.ratingAvg} count={p.ratingCount} />
                      </td>
                      <td className="text-right">
                        <form action={ubahPremium} className="inline-flex">
                          <input type="hidden" name="providerId" value={p.id} />
                          <SubmitButton
                            className={p.isPremium ? "btn-success btn-sm" : "btn-secondary btn-sm"}
                            pendingLabel="…"
                            title={
                              p.isPremium
                                ? "Matikan premium listing"
                                : "Aktifkan premium listing 90 hari"
                            }
                          >
                            {p.isPremium ? (
                              <>
                                <Icon name="check" size={13} />
                                Aktif
                              </>
                            ) : (
                              "Aktifkan"
                            )}
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
