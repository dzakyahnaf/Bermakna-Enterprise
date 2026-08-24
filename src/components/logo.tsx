import Link from "next/link";

/**
 * Penanda merek Bermakna Enterprise.
 * Mengikuti GDV KM ITB 2026/2027: monogram di atas gradien radiant, nama
 * ditulis kapital dengan Tilt Warp, dan keterangan unit memakai Aleo.
 */
export function Logo({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md";
  href?: string;
}) {
  const kotak = size === "sm" ? "size-8 text-[13px]" : "size-9 text-sm";

  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5"
      aria-label="Bermakna Enterprise — beranda"
    >
      <span
        className={`pita-radiant relative inline-flex items-center justify-center overflow-hidden rounded-xl font-display text-white transition-transform group-hover:scale-105 ${kotak}`}
      >
        {/* Aksen "striking": setengah lingkaran kuning di sudut monogram. */}
        <span
          aria-hidden
          className="absolute -top-1 -right-1 size-3 rounded-full bg-kuning-400"
        />
        <span className="relative">BE</span>
      </span>

      <span className="leading-none">
        <span className="judul block text-[13px] text-tinta-900">Bermakna</span>
        <span className="block font-sans text-[10px] font-semibold tracking-[0.22em] text-merah-500 uppercase">
          Enterprise
        </span>
      </span>
    </Link>
  );
}
