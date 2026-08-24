"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Galat({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Bermakna Enterprise]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <span className="pita-gradien flex size-14 items-center justify-center rounded-2xl text-2xl font-black text-white">
        BE
      </span>
      <h1 className="mt-6 text-2xl font-extrabold">Terjadi kesalahan</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-tinta-600">
        Ada yang tidak beres saat memuat halaman ini. Coba muat ulang — jika masih berlanjut,
        laporkan ke pengurus Bermakna Enterprise.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-tinta-500">Kode galat: {error.digest}</p>
      )}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Coba lagi
        </button>
        <Link href="/" className="btn-secondary">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
