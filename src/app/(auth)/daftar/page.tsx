import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { daftar } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { CAMPUSES } from "@/lib/constants";
import { ActionForm } from "@/components/action-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun Bermakna Enterprise — gratis untuk seluruh mahasiswa ITB.",
};

export default async function HalamanDaftar() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="card p-7 sm:p-8">
      <h1 className="text-2xl font-extrabold">Buat akun baru</h1>
      <p className="mt-1.5 text-sm text-tinta-600">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="tautan">
          Masuk di sini
        </Link>
      </p>

      <ActionForm action={daftar} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Nama lengkap
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={3}
            autoComplete="name"
            placeholder="Nama sesuai KTM"
            className="input"
          />
        </div>

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
          <p className="hint">Disarankan memakai email kampus agar verifikasi lebih cepat.</p>
        </div>

        <div>
          <label className="label" htmlFor="phone">
            Nomor WhatsApp
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="081234567890"
            className="input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="campus">
              Kampus
            </label>
            <select id="campus" name="campus" className="select" defaultValue="GANESHA">
              {CAMPUSES.filter((c) => c.value !== "ONLINE").map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="batch">
              Angkatan
            </label>
            <input
              id="batch"
              name="batch"
              placeholder="2024"
              inputMode="numeric"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="faculty">
            Fakultas / Sekolah <span className="font-normal text-tinta-500">(opsional)</span>
          </label>
          <input id="faculty" name="faculty" placeholder="STEI, FTI, SBM, …" className="input" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="konfirmasi">
              Ulangi kata sandi
            </label>
            <input
              id="konfirmasi"
              name="konfirmasi"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              className="input"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary btn-block">
          Daftar Sekarang
        </button>

        <p className="text-center text-xs leading-relaxed text-tinta-600">
          Dengan mendaftar kamu menyetujui ketentuan penggunaan Bermakna Enterprise dan pengelolaan
          data oleh pengurus KM ITB 2026/2027.
        </p>
      </ActionForm>
    </div>
  );
}
