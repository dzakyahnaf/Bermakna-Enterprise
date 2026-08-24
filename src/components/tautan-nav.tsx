"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

/**
 * Tautan navigasi yang menampilkan pemintal begitu diklik.
 *
 * `loading.tsx` sudah menampilkan kerangka halaman tujuan, tetapi pengguna
 * juga perlu tahu *tautan mana* yang sedang diproses — terutama saat jaringan
 * lambat dan halaman lama masih terlihat. useLinkStatus memberi tahu apakah
 * navigasi dari tautan ini sedang berjalan.
 */

/** Pemintal kecil yang hanya muncul saat navigasi tautan induknya tertunda. */
export function PemintalTautan({ className = "" }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <svg
      className={`size-3.5 shrink-0 animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Memuat"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Meredupkan isi tautan selama navigasi, agar terasa "sedang diproses". */
export function IsiTautan({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span className={pending ? "opacity-60 transition-opacity" : undefined}>{children}</span>
  );
}

/** Tautan dengan pemintal otomatis di sisi kanan. */
export function TautanNav({
  href,
  className,
  children,
  posisiPemintal = "kanan",
  ...sisa
}: {
  href: string;
  className?: string;
  children: ReactNode;
  posisiPemintal?: "kiri" | "kanan";
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={className} {...sisa}>
      {posisiPemintal === "kiri" && <PemintalTautan />}
      {children}
      {posisiPemintal === "kanan" && <PemintalTautan />}
    </Link>
  );
}
