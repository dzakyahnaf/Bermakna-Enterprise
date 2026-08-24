import Link from "next/link";

import { campusLabel, priceUnitShort, warnaKategori } from "@/lib/constants";
import { potong, rupiah } from "@/lib/format";
import { Avatar, PremiumBadge, Stars, VerifiedBadge } from "@/components/ui";

export type KartuLayanan = {
  slug: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  campus: string;
  coverUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  orderCount: number;
  category: { name: string; icon: string; slug: string };
  provider: {
    isPremium: boolean;
    status: string;
    user: { name: string; avatarUrl: string | null };
  };
};

export function ServiceCard({ layanan }: { layanan: KartuLayanan }) {
  // Warna sampul mengikuti pembagian warna kategori pada GDV.
  const w = warnaKategori(layanan.category.slug);

  return (
    <Link
      href={`/layanan/${layanan.slug}`}
      className="card group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(58,22,7,0.05),0_18px_36px_-20px_rgba(58,22,7,0.35)]"
    >
      {/* Sampul: gambar unggahan atau latar gradien dengan ikon kategori */}
      <div className="relative aspect-[16/10] overflow-hidden bg-krem-200">
        {layanan.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={layanan.coverUrl}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`relative flex size-full items-center justify-center ${w.bg}`}>
            {/* Aksen "striking": lingkaran solid warna kategori. */}
            <span
              aria-hidden
              className={`absolute -top-6 -right-6 size-20 rounded-full opacity-30 ${w.solid}`}
            />
            <span
              aria-hidden
              className={`absolute -bottom-8 -left-4 size-14 rounded-full opacity-20 ${w.solid}`}
            />
            <span className="relative text-5xl">{layanan.category.icon}</span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className={`badge bg-white/95 shadow-sm ${w.teks}`}>
            {layanan.category.icon} {layanan.category.name}
          </span>
          {layanan.provider.isPremium && <PremiumBadge />}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] leading-snug font-bold text-tinta-900 group-hover:text-merah-500">
          {layanan.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-tinta-600">
          {potong(layanan.description.replace(/\n+/g, " "), 120)}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Avatar name={layanan.provider.user.name} url={layanan.provider.user.avatarUrl} size={24} />
          <span className="truncate text-xs font-semibold text-tinta-700">
            {layanan.provider.user.name}
          </span>
          {layanan.provider.status === "VERIFIED" && <VerifiedBadge withText={false} />}
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-tinta-600">
          <Stars value={layanan.ratingAvg} count={layanan.ratingCount} />
          {layanan.orderCount > 0 && <span>· {layanan.orderCount}× dipesan</span>}
        </div>

        {/* Harga tidak boleh terdesak; label kampus yang dipotong bila sempit. */}
        <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-krem-200 pt-3">
          <span className="truncate text-xs text-tinta-600">{campusLabel(layanan.campus)}</span>
          <span className="shrink-0 text-right whitespace-nowrap">
            <span className="text-base font-extrabold text-tinta-900">{rupiah(layanan.price)}</span>
            <span className="text-xs font-semibold text-tinta-600">
              {priceUnitShort(layanan.priceUnit)}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Pilihan field Prisma yang dibutuhkan ServiceCard. */
export const PILIH_KARTU_LAYANAN = {
  slug: true,
  title: true,
  description: true,
  price: true,
  priceUnit: true,
  campus: true,
  coverUrl: true,
  ratingAvg: true,
  ratingCount: true,
  orderCount: true,
  category: { select: { name: true, icon: true, slug: true } },
  provider: {
    select: {
      isPremium: true,
      status: true,
      user: { select: { name: true, avatarUrl: true } },
    },
  },
} as const;
