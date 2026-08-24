import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_META } from "@/lib/constants";
import { PageHeader } from "@/components/dashboard-shell";
import { OrderRow, PILIH_BARIS_PESANAN } from "@/components/order-row";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Pesanan Saya" };

const TAB = [
  { value: "", label: "Semua" },
  { value: "MENUNGGU_KONFIRMASI", label: "Menunggu konfirmasi" },
  { value: "MENUNGGU_PEMBAYARAN", label: "Perlu dibayar" },
  { value: "MENUNGGU_VERIFIKASI", label: "Cek pembayaran" },
  { value: "DIKERJAKAN", label: "Dikerjakan" },
  { value: "SELESAI", label: "Selesai" },
];

export default async function PesananSaya({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { status = "" } = await searchParams;

  const where = {
    buyerId: user.id,
    ...(status && status in ORDER_STATUS_META ? { status } : {}),
  };

  const [pesanan, hitungan] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        ...PILIH_BARIS_PESANAN,
        provider: { select: { user: { select: { name: true, avatarUrl: true } } } },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { buyerId: user.id },
      _count: true,
    }),
  ]);

  const jumlahPer = new Map(hitungan.map((h) => [h.status, h._count]));
  const total = hitungan.reduce((n, h) => n + h._count, 0);

  return (
    <>
      <PageHeader
        title="Pesanan Saya"
        description="Semua transaksi yang kamu buat, lengkap dengan statusnya."
      />

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {TAB.map((t) => {
          const jumlah = t.value ? (jumlahPer.get(t.value) ?? 0) : total;
          return (
            <Link
              key={t.value}
              href={t.value ? `/dashboard/pesanan?status=${t.value}` : "/dashboard/pesanan"}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                status === t.value
                  ? "pita-gradien text-white"
                  : "border border-krem-300 bg-white text-tinta-700 hover:border-oranye-500"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  status === t.value ? "bg-white/25" : "bg-krem-200 text-tinta-700"
                }`}
              >
                {jumlah}
              </span>
            </Link>
          );
        })}
      </div>

      {pesanan.length === 0 ? (
        <EmptyState
          icon="🧾"
          title={status ? "Tidak ada pesanan pada status ini" : "Belum ada pesanan"}
          description="Semua pesanan yang kamu buat akan muncul di sini beserta riwayat statusnya."
          action={{ href: "/jelajah", label: "Jelajah layanan" }}
        />
      ) : (
        <div className="space-y-3">
          {pesanan.map((o) => (
            <OrderRow
              key={o.code}
              pesanan={{ ...o, lawan: o.provider.user }}
              basePath="/dashboard/pesanan"
              labelLawan="Penyedia"
            />
          ))}
        </div>
      )}
    </>
  );
}
