import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_META, PAID_ORDER_STATUSES } from "@/lib/constants";
import { angka, rupiah, tanggalWaktu } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, EmptyState, Icon, StatCard } from "@/components/ui";

export const metadata: Metadata = { title: "Database Transaksi" };

const PER_HALAMAN = 25;

export default async function DatabaseTransaksi({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; hal?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status ?? "";
  const halaman = Math.max(1, Number(sp.hal) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { service: { title: { contains: q, mode: "insensitive" } } },
            { buyer: { name: { contains: q, mode: "insensitive" } } },
            { buyer: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(status && status in ORDER_STATUS_META ? { status } : {}),
  };

  const [total, transaksi, ringkasan] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      include: {
        buyer: { select: { name: true, email: true } },
        provider: { select: { id: true, user: { select: { name: true } } } },
        service: { select: { title: true, category: { select: { name: true } } } },
        payment: { select: { status: true } },
      },
    }),
    prisma.order.aggregate({
      where: { ...where, status: { in: PAID_ORDER_STATUSES } },
      _sum: { total: true, adminFee: true, commission: true, providerPayout: true },
      _count: true,
    }),
  ]);

  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const pendapatan = (ringkasan._sum.adminFee ?? 0) + (ringkasan._sum.commission ?? 0);

  const urlEkspor = `/admin/transaksi/ekspor${q || status ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) })}` : ""}`;

  const url = (ubah: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const gabung: Record<string, string | number | undefined> = { q, status, ...ubah };
    for (const [k, v] of Object.entries(gabung)) {
      if (v !== undefined && v !== "" && v !== 0) p.set(k, String(v));
    }
    const s = p.toString();
    return `/admin/transaksi${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Database Transaksi"
        description="Seluruh catatan transaksi platform — dapat disaring, dicari, dan diekspor ke CSV."
        action={
          <a href={urlEkspor} className="btn-primary btn-sm" download>
            <Icon name="download" size={14} />
            Ekspor CSV
          </a>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Transaksi tercatat" value={angka(total)} sub="sesuai filter aktif" />
        <StatCard
          label="Nilai transaksi"
          value={rupiah(ringkasan._sum.total ?? 0)}
          sub={`${ringkasan._count} pembayaran terverifikasi`}
        />
        <StatCard
          label="Pendapatan platform"
          value={rupiah(pendapatan)}
          sub="biaya admin + komisi"
        />
        <StatCard
          label="Diteruskan ke penyedia"
          value={rupiah(ringkasan._sum.providerPayout ?? 0)}
          sub="hak penyedia jasa"
        />
      </div>

      {/* ── Pencarian & filter ────────────────────────────────────────── */}
      <form method="get" className="card mt-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-52 flex-1">
          <label className="label" htmlFor="q">
            Cari
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Kode pesanan, layanan, nama, atau email pembeli"
            className="input"
          />
        </div>
        <div className="min-w-44">
          <label className="label" htmlFor="status">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="select">
            <option value="">Semua status</option>
            {Object.entries(ORDER_STATUS_META).map(([nilai, meta]) => (
              <option key={nilai} value={nilai}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          <Icon name="search" size={16} />
          Terapkan
        </button>
        {(q || status) && (
          <Link href="/admin/transaksi" className="btn-secondary">
            Reset
          </Link>
        )}
      </form>

      {/* ── Tabel ─────────────────────────────────────────────────────── */}
      <div className="mt-6">
        {transaksi.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Tidak ada transaksi yang cocok"
            description="Coba ubah kata kunci pencarian atau pilih status yang berbeda."
          />
        ) : (
          <div className="card tabel-scroll">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Kode & waktu</th>
                  <th>Layanan</th>
                  <th>Pembeli</th>
                  <th>Penyedia</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Komisi</th>
                  <th className="text-right">Biaya adm.</th>
                  <th className="text-right">Ke penyedia</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.map((o) => {
                  const meta = ORDER_STATUS_META[o.status];
                  return (
                    <tr key={o.code}>
                      <td>
                        <span className="block font-mono text-xs font-semibold">{o.code}</span>
                        <span className="text-xs text-tinta-500">{tanggalWaktu(o.createdAt)}</span>
                      </td>
                      <td className="max-w-52">
                        <span className="block truncate font-semibold">{o.service.title}</span>
                        <span className="text-xs text-tinta-500">{o.service.category.name}</span>
                      </td>
                      <td>
                        <span className="block whitespace-nowrap">{o.buyer.name}</span>
                        <span className="text-xs text-tinta-500">{o.buyer.email}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        <Link
                          href={`/penyedia/${o.provider.id}`}
                          className="hover:text-merah-500"
                        >
                          {o.provider.user.name}
                        </Link>
                      </td>
                      <td>
                        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
                      </td>
                      <td className="text-right font-semibold tabular-nums">{rupiah(o.total)}</td>
                      <td className="text-right tabular-nums text-tinta-600">
                        {rupiah(o.commission)}
                      </td>
                      <td className="text-right tabular-nums text-tinta-600">
                        {rupiah(o.adminFee)}
                      </td>
                      <td className="text-right tabular-nums">{rupiah(o.providerPayout)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalHalaman > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-2">
            <Link
              href={url({ hal: halaman - 1 })}
              className={`btn-secondary btn-sm ${halaman === 1 ? "pointer-events-none opacity-45" : ""}`}
            >
              <Icon name="arrowLeft" size={14} />
              Sebelumnya
            </Link>
            <span className="px-3 text-sm font-semibold text-tinta-700">
              {halaman} / {totalHalaman}
            </span>
            <Link
              href={url({ hal: halaman + 1 })}
              className={`btn-secondary btn-sm ${halaman === totalHalaman ? "pointer-events-none opacity-45" : ""}`}
            >
              Berikutnya
              <Icon name="arrowRight" size={14} />
            </Link>
          </nav>
        )}
      </div>
    </>
  );
}
