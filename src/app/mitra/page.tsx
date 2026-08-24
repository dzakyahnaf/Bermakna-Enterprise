import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_ORDER_STATUSES, ORDER_STATUS } from "@/lib/constants";
import { rupiah, rupiahRingkas } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { OrderRow, PILIH_BARIS_PESANAN } from "@/components/order-row";
import { Alert, EmptyState, Icon, StatCard, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard Penyedia" };

export default async function DashboardMitra() {
  const user = await requireProvider();
  if (user.provider.status !== "VERIFIED") redirect("/mitra/status");

  const providerId = user.provider.id;

  const [penyedia, pendapatan, tertunda, aktif, selesai, perluKonfirmasi, terbaru, layananTeratas] =
    await Promise.all([
      prisma.provider.findUnique({
        where: { id: providerId },
        select: { ratingAvg: true, ratingCount: true, completedOrders: true, isPremium: true },
      }),
      prisma.order.aggregate({
        where: { providerId, status: ORDER_STATUS.SELESAI },
        _sum: { providerPayout: true },
      }),
      prisma.order.aggregate({
        where: { providerId, status: ORDER_STATUS.DIKERJAKAN },
        _sum: { providerPayout: true },
      }),
      prisma.order.count({ where: { providerId, status: { in: ACTIVE_ORDER_STATUSES } } }),
      prisma.order.count({ where: { providerId, status: ORDER_STATUS.SELESAI } }),
      prisma.order.count({ where: { providerId, status: ORDER_STATUS.MENUNGGU_KONFIRMASI } }),
      prisma.order.findMany({
        where: { providerId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          ...PILIH_BARIS_PESANAN,
          buyer: { select: { name: true, avatarUrl: true } },
        },
      }),
      prisma.service.findMany({
        where: { providerId },
        orderBy: [{ orderCount: "desc" }, { views: "desc" }],
        take: 4,
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          views: true,
          orderCount: true,
          ratingAvg: true,
          ratingCount: true,
          status: true,
          category: { select: { icon: true } },
        },
      }),
    ]);

  return (
    <>
      <PageHeader
        title={`Halo, ${user.name.split(" ")[0]} 👋`}
        description="Ringkasan performa layanan dan pendapatanmu di Bermakna Enterprise."
        action={
          <Link href="/mitra/layanan/baru" className="btn-primary">
            <Icon name="plus" size={16} />
            Tambah Layanan
          </Link>
        }
      />

      {perluKonfirmasi > 0 && (
        <div className="mb-6">
          <Alert tone="warning" title="Ada pesanan menunggu konfirmasimu">
            {perluKonfirmasi} pesanan baru belum kamu tanggapi. Konfirmasi cepat meningkatkan
            kepercayaan pembeli.{" "}
            <Link href="/mitra/pesanan?status=MENUNGGU_KONFIRMASI" className="tautan">
              Lihat sekarang
            </Link>
          </Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          accent
          label="Pendapatan cair"
          value={rupiahRingkas(pendapatan._sum.providerPayout ?? 0)}
          sub="dari pesanan selesai"
          icon={<Icon name="wallet" />}
        />
        <StatCard
          label="Sedang berjalan"
          value={rupiahRingkas(tertunda._sum.providerPayout ?? 0)}
          sub={`${aktif} pesanan aktif`}
          icon={<Icon name="clock" />}
        />
        <StatCard
          label="Pesanan selesai"
          value={selesai}
          sub="transaksi tuntas"
          icon={<Icon name="check" />}
        />
        <StatCard
          label="Rating rata-rata"
          value={penyedia && penyedia.ratingAvg > 0 ? penyedia.ratingAvg.toFixed(1) : "Baru"}
          sub={`${penyedia?.ratingCount ?? 0} ulasan`}
          icon={<Icon name="star" />}
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Pesanan terbaru</h2>
          <Link href="/mitra/pesanan" className="btn-ghost btn-sm">
            Lihat semua
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>

        {terbaru.length === 0 ? (
          <EmptyState
            icon="📥"
            title="Belum ada pesanan masuk"
            description="Pastikan layananmu sudah tayang dan deskripsinya menjelaskan hasil yang didapat pembeli."
            action={{ href: "/mitra/layanan/baru", label: "Tambah layanan" }}
          />
        ) : (
          <div className="space-y-3">
            {terbaru.map((o) => (
              <OrderRow
                key={o.code}
                pesanan={{ ...o, lawan: o.buyer }}
                basePath="/mitra/pesanan"
                labelLawan="Pembeli"
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Performa layanan</h2>
          <Link href="/mitra/layanan" className="btn-ghost btn-sm">
            Kelola layanan
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>

        {layananTeratas.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Belum ada layanan"
            description="Tambahkan layanan pertamamu agar bisa ditemukan mahasiswa lain."
            action={{ href: "/mitra/layanan/baru", label: "Tambah layanan" }}
          />
        ) : (
          <div className="card tabel-scroll">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Layanan</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">Dilihat</th>
                  <th className="text-right">Pesanan</th>
                  <th className="text-right">Rating</th>
                </tr>
              </thead>
              <tbody>
                {layananTeratas.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link
                        href={`/layanan/${s.slug}`}
                        className="font-semibold text-tinta-900 hover:text-merah-500"
                      >
                        {s.category.icon} {s.title}
                      </Link>
                    </td>
                    <td className="text-right tabular-nums">{rupiah(s.price)}</td>
                    <td className="text-right tabular-nums">{s.views}</td>
                    <td className="text-right tabular-nums">{s.orderCount}</td>
                    <td className="text-right">
                      <span className="inline-flex justify-end">
                        <Stars value={s.ratingAvg} count={s.ratingCount} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!penyedia?.isPremium && (
        <section className="card mt-10 overflow-hidden">
          <div className="grid items-center gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
            <div>
              <span className="badge badge-warning">★ Premium listing</span>
              <h2 className="mt-3 text-xl font-extrabold">
                Ingin layananmu tampil paling atas?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-tinta-600">
                Premium listing menempatkan layananmu di urutan teratas hasil pencarian dan halaman
                beranda. Hubungi pengurus Bermakna Enterprise untuk berlangganan.
              </p>
            </div>
            <a href="https://wa.me/6281200001234" className="btn-secondary shrink-0">
              Hubungi pengurus
            </a>
          </div>
        </section>
      )}
    </>
  );
}
