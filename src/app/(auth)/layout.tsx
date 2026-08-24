import Link from "next/link";

import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-kuning-100/40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-32 size-96 rounded-full bg-krem-300/50"
        aria-hidden
      />

      <header className="relative">
        <div className="wrap flex h-16 items-center justify-between">
          <Logo />
          <Link href="/" className="btn-ghost btn-sm">
            ← Kembali ke beranda
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="relative py-6 text-center text-xs text-tinta-600">
        Bermakna Enterprise · Kabinet Bermakna KM ITB 2026/2027
      </footer>
    </div>
  );
}
