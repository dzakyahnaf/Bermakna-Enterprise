import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_ORDER_STATUSES, ORDER_STATUS } from "@/lib/constants";
import { rupiahRingkas } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { OrderRow, PILIH_BARIS_PESANAN } from "@/components/order-row";
import { PILIH_KARTU_LAYANAN, ServiceCard } from "@/components/service-card";
import { Alert, EmptyState, Icon, StatCard } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPengguna() {
  const user = await requireUser();

  const [aktif, selesai, totalBelanja, perluAksi, terbaru, rekomendasi, belumDireview] =
    await Promise.all([
      prisma.order.count({ where: { buyerId: user.id, status: { in: ACTIVE_ORDER_STATUSES } } }),
      prisma.order.count({ where: { buyerId: user.id, status: ORDER_STATUS.SELESAI } }),
      prisma.order.aggregate({
        where: {
          buyerId: user.id,
          status: { in: [ORDER_STATUS.DIKERJAKAN, ORDER_STATUS.SELESAI] },
        },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { buyerId: user.id, status: ORDER_STATUS.MENUNGGU_PEMBAYARAN },
      }),
      prisma.order.findMany({
        where: { buyerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          ...PILIH_BARIS_PESANAN,
          provider: { select: { user: { select: { name: true, avatarUrl: true } } } },
        },
      }),
      prisma.service.findMany({
        where: {
          status: "ACTIVE",
          provider: { status: "VERIFIED", NOT: { userId: user.id } },
        },
        orderBy: [{ ratingAvg: "desc" }, { orderCount: "desc" }],
        take: 3,
        select: PILIH_KARTU_LAYANAN,
      }),
      prisma.order.count({
        where: { buyerId: user.id, status: ORDER_STATUS.SELESAI, review: null },
      }),
    ]);

  return (
    <>
      <PageHeader
        title={`Halo, ${user.name.split(" ")[0]} 👋`}
        description="Ringkasan aktivitasmu di Bermakna Enterprise."
        action={
          <Link href="/jelajah" className="btn-primary">
            <Icon name="search" size={16} />
            Cari layanan
          </Link>
        }
      />

      {perluAksi > 0 && (
        <div className="mb-6">
          <Alert tone="warning" title="Ada pesanan menunggu pembayaran">
            {perluAksi} pesanan sudah diterima penyedia dan menunggu kamu menyelesaikan pembayaran.{" "}
            <Link href="/dashboard/pesanan?status=MENUNGGU_PEMBAYARAN" className="tautan">
              Lihat pesanannya
            </Link>
          </Alert>
        </div>
      )}

      {belumDireview > 0 && (
        <div className="mb-6">
          <Alert tone="info" title="Bantu mahasiswa lain dengan reviewmu">
            {belumDireview} pesanan sudah selesai tapi belum kamu beri rating.{" "}
            <Link href="/dashboard/review" className="tautan">
              Tulis review sekarang
            </Link>
          </Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pesanan aktif"
          value={aktif}
          sub="sedang berjalan"
          icon={<Icon name="cart" />}
        />
        <StatCard
          label="Pesanan selesai"
          value={selesai}
          sub="transaksi tuntas"
          icon={<Icon name="check" />}
        />
        <StatCard
          label="Total belanja"
          value={rupiahRingkas(totalBelanja._sum.total ?? 0)}
          sub="pembayaran terverifikasi"
          icon={<Icon name="wallet" />}
        />
        <StatCard
          label="Menunggu review"
          value={belumDireview}
          sub="pesanan selesai"
          icon={<Icon name="star" />}
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Pesanan terbaru</h2>
          <Link href="/dashboard/pesanan" className="btn-ghost btn-sm">
            Lihat semua
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>

        {terbaru.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="Belum ada pesanan"
            description="Mulai dengan menjelajahi layanan dari mahasiswa ITB terverifikasi."
            action={{ href: "/jelajah", label: "Jelajah layanan" }}
          />
        ) : (
          <div className="space-y-3">
            {terbaru.map((o) => (
              <OrderRow
                key={o.code}
                pesanan={{ ...o, lawan: o.provider.user }}
                basePath="/dashboard/pesanan"
                labelLawan="Penyedia"
              />
            ))}
          </div>
        )}
      </section>

      {rekomendasi.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Rekomendasi untukmu</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rekomendasi.map((s) => (
              <ServiceCard key={s.slug} layanan={s} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
