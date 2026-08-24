import type { Metadata } from "next";

import { perbaruiProfil, ubahKataSandi } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { CAMPUSES } from "@/lib/constants";
import { PageHeader } from "@/components/dashboard-shell";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Avatar } from "@/components/ui";

export const metadata: Metadata = { title: "Profil & Akun" };

export default async function Profil() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        title="Profil & Akun"
        description="Data ini dipakai penyedia untuk menghubungimu saat pesanan berjalan."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Data diri ─────────────────────────────────────────────── */}
        <section className="card-pad">
          <h2 className="text-lg font-bold">Data diri</h2>

          <ActionForm action={perbaruiProfil} className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} url={user.avatarUrl} size={64} />
              <div className="min-w-0 flex-1">
                <label className="label" htmlFor="avatar">
                  Foto profil
                </label>
                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="file-input"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="name">
                Nama lengkap
              </label>
              <input id="name" name="name" required defaultValue={user.name} className="input" />
            </div>

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input id="email" value={user.email} disabled className="input" />
              <p className="hint">Email tidak bisa diubah sendiri. Hubungi admin bila perlu.</p>
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
                defaultValue={user.phone ?? ""}
                className="input"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="campus">
                  Kampus
                </label>
                <select id="campus" name="campus" defaultValue={user.campus} className="select">
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
                  defaultValue={user.batch ?? ""}
                  placeholder="2024"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="faculty">
                Fakultas / Sekolah
              </label>
              <input
                id="faculty"
                name="faculty"
                defaultValue={user.faculty ?? ""}
                placeholder="STEI, FTI, SBM, …"
                className="input"
              />
            </div>

            <SubmitButton className="btn-primary" pendingLabel="Menyimpan…">
              Simpan Perubahan
            </SubmitButton>
          </ActionForm>
        </section>

        {/* ── Keamanan ──────────────────────────────────────────────── */}
        <section className="card-pad h-fit">
          <h2 className="text-lg font-bold">Ubah kata sandi</h2>
          <p className="mt-1 text-sm text-tinta-600">
            Gunakan kata sandi yang tidak kamu pakai di layanan lain.
          </p>

          <ActionForm action={ubahKataSandi} className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="lama">
                Kata sandi saat ini
              </label>
              <input
                id="lama"
                name="lama"
                type="password"
                required
                autoComplete="current-password"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="baru">
                Kata sandi baru
              </label>
              <input
                id="baru"
                name="baru"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="input"
              />
              <p className="hint">Minimal 8 karakter.</p>
            </div>
            <div>
              <label className="label" htmlFor="konfirmasi">
                Ulangi kata sandi baru
              </label>
              <input
                id="konfirmasi"
                name="konfirmasi"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="input"
              />
            </div>

            <SubmitButton className="btn-secondary" pendingLabel="Menyimpan…">
              Ubah Kata Sandi
            </SubmitButton>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
