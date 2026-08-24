import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { masuk } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Bermakna Enterprise.",
};

export default async function HalamanMasuk({
  searchParams,
}: {
  searchParams: Promise<{ tujuan?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : user.provider ? "/mitra" : "/dashboard");

  const { tujuan = "" } = await searchParams;

  return (
    <>
      <div className="card p-7 sm:p-8">
        <h1 className="text-2xl font-extrabold">Masuk ke akunmu</h1>
        <p className="mt-1.5 text-sm text-tinta-600">
          Belum punya akun?{" "}
          <Link href="/daftar" className="tautan">
            Daftar gratis
          </Link>
        </p>

        <ActionForm action={masuk} className="mt-6 space-y-4">
          {tujuan.startsWith("/") && <input type="hidden" name="tujuan" value={tujuan} />}

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@students.itb.ac.id"
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="input"
            />
          </div>

          <button type="submit" className="btn-primary btn-block">
            Masuk
          </button>
        </ActionForm>
      </div>

      {/* Akun demo untuk keperluan pengujian & presentasi PMW */}
      <div className="card mt-4 p-5">
        <p className="text-xs font-bold tracking-wide text-tinta-800 uppercase">Akun demo</p>
        <p className="mt-1 text-xs text-tinta-600">
          Salin salah satu untuk mencoba tiap peran di platform.
        </p>
        <ul className="mt-3 space-y-2 text-xs">
          {[
            ["Pengguna jasa", "nadia@students.itb.ac.id", "pengguna123"],
            ["Penyedia jasa", "alya@students.itb.ac.id", "penyedia123"],
            ["Administrator", "admin@bermakna.id", "admin123"],
          ].map(([peran, email, sandi]) => (
            <li
              key={email}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-krem-100 px-3 py-2"
            >
              <span className="font-semibold text-tinta-800">{peran}</span>
              <span className="font-mono text-tinta-600">
                {email} · {sandi}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
