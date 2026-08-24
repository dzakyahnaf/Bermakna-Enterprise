"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Avatar, Icon } from "@/components/ui";

export type NavUser = {
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  isProvider: boolean;
  belumDibaca: number;
};

const TAUTAN_PUBLIK = [
  { href: "/jelajah", label: "Jelajah Layanan" },
  { href: "/kategori", label: "Kategori" },
  { href: "/penyedia", label: "Penyedia" },
  { href: "/tentang", label: "Tentang" },
];

export function HeaderNav({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [pengguna, setPengguna] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tutup menu setiap kali pindah halaman.
  useEffect(() => {
    setMenuTerbuka(false);
    setPengguna(false);
  }, [pathname]);

  // Tutup dropdown saat klik di luar area menu.
  useEffect(() => {
    if (!pengguna) return;
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPengguna(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [pengguna]);

  const aktif = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const tautanDasbor =
    user?.role === "ADMIN" ? "/admin" : user?.isProvider ? "/mitra" : "/dashboard";

  return (
    <>
      {/* Navigasi layar lebar */}
      <nav className="hidden items-center gap-1 md:flex">
        {TAUTAN_PUBLIK.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              aktif(t.href)
                ? "bg-krem-200 text-tinta-900"
                : "text-tinta-700 hover:bg-krem-200/60 hover:text-tinta-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setPengguna((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-krem-300 bg-white py-1 pr-2.5 pl-1 transition-colors hover:border-krem-400"
              aria-expanded={pengguna}
              aria-haspopup="menu"
            >
              <span className="relative">
                <Avatar name={user.name} url={user.avatarUrl} size={30} />
                {user.belumDibaca > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-merah-500 ring-2 ring-white" />
                )}
              </span>
              <span className="hidden max-w-28 truncate text-sm font-semibold text-tinta-900 sm:block">
                {user.name.split(" ")[0]}
              </span>
              <Icon name="menu" size={15} />
            </button>

            {pengguna && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-krem-300 bg-white shadow-[0_16px_40px_-12px_rgba(58,22,7,0.28)]"
              >
                <div className="border-b border-krem-200 bg-krem-50 px-4 py-3">
                  <p className="truncate text-sm font-bold text-tinta-900">{user.name}</p>
                  <p className="truncate text-xs text-tinta-600">{user.email}</p>
                </div>
                <div className="p-1.5">
                  <ItemMenu href={tautanDasbor} icon="grid">
                    {user.role === "ADMIN"
                      ? "Dashboard Admin"
                      : user.isProvider
                        ? "Dashboard Penyedia"
                        : "Dashboard Saya"}
                  </ItemMenu>
                  {user.role !== "ADMIN" && (
                    <ItemMenu href="/dashboard/pesanan" icon="cart">
                      Pesanan Saya
                    </ItemMenu>
                  )}
                  <ItemMenu href="/dashboard/notifikasi" icon="bell">
                    Notifikasi
                    {user.belumDibaca > 0 && (
                      <span className="ml-auto rounded-full bg-merah-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {user.belumDibaca}
                      </span>
                    )}
                  </ItemMenu>
                  <ItemMenu href="/dashboard/profil" icon="user">
                    Profil & Akun
                  </ItemMenu>
                  {!user.isProvider && user.role !== "ADMIN" && (
                    <ItemMenu href="/jadi-penyedia" icon="briefcase">
                      Jadi Penyedia Jasa
                    </ItemMenu>
                  )}
                </div>
                <form action="/api/keluar" method="post" className="border-t border-krem-200 p-1.5">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-merah-900 transition-colors hover:bg-merah-500/8"
                  >
                    <Icon name="logout" size={16} />
                    Keluar
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/masuk" className="btn-ghost btn-sm">
              Masuk
            </Link>
            <Link href="/daftar" className="btn-primary btn-sm">
              Daftar Gratis
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuTerbuka((v) => !v)}
          className="btn-ghost p-2 md:hidden"
          aria-label="Buka menu navigasi"
          aria-expanded={menuTerbuka}
        >
          <Icon name={menuTerbuka ? "x" : "menu"} size={20} />
        </button>
      </div>

      {/* Laci navigasi ponsel */}
      {menuTerbuka && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-krem-300 bg-white p-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1">
            {TAUTAN_PUBLIK.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  aktif(t.href) ? "bg-krem-200 text-tinta-900" : "text-tinta-700"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          {!user && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-krem-200 pt-3">
              <Link href="/masuk" className="btn-secondary">
                Masuk
              </Link>
              <Link href="/daftar" className="btn-primary">
                Daftar
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ItemMenu({
  href,
  icon,
  children,
}: {
  href: string;
  icon: "grid" | "cart" | "user" | "briefcase" | "bell";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-tinta-800 transition-colors hover:bg-krem-100"
    >
      <Icon name={icon} size={16} />
      {children}
    </Link>
  );
}
