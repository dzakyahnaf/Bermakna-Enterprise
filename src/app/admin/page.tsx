import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ORDER_STATUS,
  ORDER_STATUS_META,
  PAID_ORDER_STATUSES,
  YEAR_ONE_TARGETS,
} from "@/lib/constants";
import { rupiah, rupiahRingkas, tanggalWaktu } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { Alert, Badge, Icon, StatCard, TargetCard } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard Administrasi" };

export default async function DashboardAdmin() {
  await requireAdmin();

  const [
    totalPengguna,
    penyediaVerified,
    penyediaPending,
    totalLayanan,
    pesananSelesai,
    totalTransaksi,
    gmv,
    pendapatan,
    menungguBayar,
    perStatus,
    transaksiTerbaru,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { not: "ADMIN" } } }),
    prisma.provider.count({ where: { status: "VERIFIED" } }),
    prisma.provider.count({ where: { status: "PENDING" } }),
    prisma.service.count({ where: { status: "ACTIVE" } }),
    prisma.order.count({ where: { status: ORDER_STATUS.SELESAI } }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { in: PAID_ORDER_STATUSES } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: PAID_ORDER_STATUSES } },
      _sum: { adminFee: true, commission: true },
    }),
    prisma.order.count({ where: { status: ORDER_STATUS.MENUNGGU_VERIFIKASI } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        code: true,
        status: true,
        total: true,
        createdAt: true,
        buyer: { select: { name: true } },
        service: { select: { title: true } },
      },
    }),
  ]);

  const totalPendapatan =
    (pendapatan._sum.adminFee ?? 0) + (pendapatan._sum.commission ?? 0);

  return (
    <>
      <PageHeader
        title="Dashboard Administrasi"
        description="Pantauan menyeluruh atas pengguna, penyedia, transaksi, dan pendapatan platform."
        action={
          <Link href="/admin/transaksi" className="btn-secondary btn-sm">
            <Icon name="download" size={14} />
            Ekspor transaksi
          </Link>
        }
      />

      {(penyediaPending > 0 || menungguBayar > 0) && (
        <div className="mb-6 space-y-3">
          {penyediaPending > 0 && (
            <Alert tone="warning" title="Ada pendaftaran penyedia menunggu verifikasi">
              {penyediaPending} calon penyedia menunggu pemeriksaan data kemahasiswaan.{" "}
              <Link href="/admin/verifikasi" className="tautan">
                Periksa sekarang
              </Link>
            </Alert>
          )}
          {menungguBayar > 0 && (
            <Alert tone="warning" title="Ada bukti pembayaran menunggu verifikasi">
              {menungguBayar} pesanan tertahan sampai bukti transfernya diperiksa.{" "}
              <Link href="/admin/pembayaran" className="tautan">
                Verifikasi sekarang
              </Link>
            </Alert>
          )}
        </div>
      )}

      {/* ── Metrik utama ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          accent
          label="Pendapatan platform"
          value={rupiahRingkas(totalPendapatan)}
          sub="biaya admin + komisi"
          icon={<Icon name="wallet" />}
        />
        <StatCard
          label="Nilai transaksi (GMV)"
          value={rupiahRingkas(gmv._sum.total ?? 0)}
          sub="dari pembayaran terverifikasi"
          icon={<Icon name="trend" />}
        />
        <StatCard
          label="Total transaksi"
          value={totalTransaksi}
          sub={`${pesananSelesai} selesai`}
          icon={<Icon name="receipt" />}
        />
        <StatCard
          label="Layanan aktif"
          value={totalLayanan}
          sub={`dari ${penyediaVerified} penyedia`}
          icon={<Icon name="briefcase" />}
        />
      </div>

      {/* ── Progres target tahun pertama (proposal hlm. 2 & 10) ───────── */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">
          Progres target tahun pertama
          <span className="ml-2 text-sm font-semibold text-tinta-600">
            sesuai proposal PMW 2026
          </span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <TargetCard
            label="Pengguna aktif"
            value={totalPengguna}
            target={YEAR_ONE_TARGETS.users}
            satuan="pengguna"
          />
          <TargetCard
            label="Penyedia jasa terdaftar"
            value={penyediaVerified}
            target={YEAR_ONE_TARGETS.providers}
            satuan="penyedia"
          />
          <TargetCard
            label="Transaksi"
            value={pesananSelesai}
            target={YEAR_ONE_TARGETS.orders}
            satuan="transaksi"
          />
        </div>
      </section>

      {/* ── Sebaran status pesanan ────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Sebaran status pesanan</h2>
        <div className="card-pad">
          <ul className="space-y-3">
            {perStatus
              .slice()
              .sort((a, b) => b._count - a._count)
              .map((s) => {
                const meta = ORDER_STATUS_META[s.status];
                const persen = totalTransaksi ? (s._count / totalTransaksi) * 100 : 0;
                return (
                  <li key={s.status} className="flex items-center gap-3">
                    <span className="w-44 shrink-0">
                      <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? s.status}</Badge>
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-krem-200">
                      <div
                        className="pita-gradien h-full rounded-full"
                        style={{ width: `${persen}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-tinta-900">
                      {s._count}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      </section>

      {/* ── Transaksi terbaru ─────────────────────────────────────────── */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Transaksi terbaru</h2>
          <Link href="/admin/transaksi" className="btn-ghost btn-sm">
            Lihat semua
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>

        <div className="card tabel-scroll">
          <table className="tabel">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Layanan</th>
                <th>Pembeli</th>
                <th>Status</th>
                <th className="text-right">Nilai</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {transaksiTerbaru.map((o) => {
                const meta = ORDER_STATUS_META[o.status];
                return (
                  <tr key={o.code}>
                    <td className="font-mono text-xs">{o.code}</td>
                    <td className="max-w-56 truncate font-semibold">{o.service.title}</td>
                    <td className="whitespace-nowrap">{o.buyer.name}</td>
                    <td>
                      <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
                    </td>
                    <td className="text-right font-semibold tabular-nums">{rupiah(o.total)}</td>
                    <td className="text-xs whitespace-nowrap text-tinta-600">
                      {tanggalWaktu(o.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
