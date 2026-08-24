import Link from "next/link";

import { ORDER_STATUS_META } from "@/lib/constants";
import { rupiah, tanggalWaktu } from "@/lib/format";
import { Avatar, Badge } from "@/components/ui";

export type BarisPesanan = {
  code: string;
  status: string;
  total: number;
  quantity: number;
  createdAt: Date;
  service: { title: string; slug: string; category: { icon: string } };
  lawan: { name: string; avatarUrl: string | null };
};

/** Kartu ringkas satu pesanan, dipakai di dasbor pengguna maupun penyedia. */
export function OrderRow({
  pesanan,
  basePath,
  labelLawan,
}: {
  pesanan: BarisPesanan;
  basePath: string;
  labelLawan: string;
}) {
  const meta = ORDER_STATUS_META[pesanan.status];

  return (
    <Link
      href={`${basePath}/${pesanan.code}`}
      className="card flex flex-wrap items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-oranye-500/50"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-krem-200 text-xl">
        <span aria-hidden>{pesanan.service.category.icon}</span>
      </span>

      <div className="min-w-40 flex-1">
        <p className="text-sm leading-snug font-bold text-tinta-900">{pesanan.service.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-tinta-600">
          <span className="font-mono">{pesanan.code}</span>
          <span>·</span>
          <span>{tanggalWaktu(pesanan.createdAt)}</span>
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-tinta-600">
          <Avatar name={pesanan.lawan.name} url={pesanan.lawan.avatarUrl} size={18} />
          {labelLawan} <span className="font-semibold text-tinta-800">{pesanan.lawan.name}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? pesanan.status}</Badge>
        <span className="text-sm font-extrabold text-tinta-900">{rupiah(pesanan.total)}</span>
        <span className="text-xs text-tinta-500">{pesanan.quantity} item</span>
      </div>
    </Link>
  );
}

export const PILIH_BARIS_PESANAN = {
  code: true,
  status: true,
  total: true,
  quantity: true,
  createdAt: true,
  service: { select: { title: true, slug: true, category: { select: { icon: true } } } },
} as const;
