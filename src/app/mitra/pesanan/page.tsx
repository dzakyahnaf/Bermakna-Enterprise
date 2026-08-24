import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_META } from "@/lib/constants";
import { PageHeader } from "@/components/dashboard-shell";
import { OrderRow, PILIH_BARIS_PESANAN } from "@/components/order-row";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Pesanan Masuk" };

const TAB = [
  { value: "", label: "Semua" },
  { value: "MENUNGGU_KONFIRMASI", label: "Perlu dikonfirmasi" },
  { value: "MENUNGGU_PEMBAYARAN", label: "Menunggu bayar" },
  { value: "MENUNGGU_VERIFIKASI", label: "Cek pembayaran" },
  { value: "DIKERJAKAN", label: "Dikerjakan" },
  { value: "SELESAI", label: "Selesai" },
];

export default async function PesananMasuk({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireProvider();
  if (user.provider.status !== "VERIFIED") redirect("/mitra/status");

  const { status = "" } = await searchParams;

  const [pesanan, hitungan] = await Promise.all([
    prisma.order.findMany({
      where: {
        providerId: user.provider.id,
        ...(status && status in ORDER_STATUS_META ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: { ...PILIH_BARIS_PESANAN, buyer: { select: { name: true, avatarUrl: true } } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { providerId: user.provider.id },
      _count: true,
    }),
  ]);

  const jumlahPer = new Map(hitungan.map((h) => [h.status, h._count]));
  const total = hitungan.reduce((n, h) => n + h._count, 0);

  return (
    <>
      <PageHeader
        title="Pesanan Masuk"
        description="Konfirmasi pesanan baru dan tandai selesai setelah pekerjaan tuntas."
      />

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {TAB.map((t) => {
          const jumlah = t.value ? (jumlahPer.get(t.value) ?? 0) : total;
          return (
            <Link
              key={t.value}
              href={t.value ? `/mitra/pesanan?status=${t.value}` : "/mitra/pesanan"}
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
          icon="📥"
          title={status ? "Tidak ada pesanan pada status ini" : "Belum ada pesanan masuk"}
          description="Pesanan dari mahasiswa lain akan muncul di sini beserta detail dan kontaknya."
          action={{ href: "/mitra/layanan", label: "Kelola layanan saya" }}
        />
      ) : (
        <div className="space-y-3">
          {pesanan.map((o) => (
            <OrderRow
              key={o.code}
              pesanan={{ ...o, lawan: o.buyer }}
              basePath="/mitra/pesanan"
              labelLawan="Pembeli"
            />
          ))}
        </div>
      )}
    </>
  );
}
