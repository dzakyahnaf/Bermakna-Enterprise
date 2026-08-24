import Link from "next/link";

import { Logo } from "@/components/logo";

export default function TidakDitemukan() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <p className="teks-gradien mt-10 text-7xl font-black">404</p>
      <h1 className="mt-3 text-2xl font-extrabold">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-tinta-600">
        Tautannya mungkin salah, atau layanan yang kamu cari sudah tidak tayang lagi.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Kembali ke beranda
        </Link>
        <Link href="/jelajah" className="btn-secondary">
          Jelajah layanan
        </Link>
      </div>
    </div>
  );
}
