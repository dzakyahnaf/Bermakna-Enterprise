import type { Metadata } from "next";
import Link from "next/link";

import { simpanProfilPenyedia } from "@/actions/provider";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROVIDER_STATUS_META } from "@/lib/constants";
import { PageHeader } from "@/components/dashboard-shell";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Alert, Badge, Icon } from "@/components/ui";

export const metadata: Metadata = { title: "Profil Penyedia" };

export default async function ProfilPenyediaMitra() {
  const user = await requireProvider();

  const penyedia = await prisma.provider.findUnique({
    where: { id: user.provider.id },
  });
  if (!penyedia) return null;

  const meta = PROVIDER_STATUS_META[penyedia.status];

  return (
    <>
      <PageHeader
        title="Profil Penyedia"
        description="Informasi ini tampil di halaman publikmu dan di setiap layanan yang kamu tayangkan."
        action={
          penyedia.status === "VERIFIED" ? (
            <Link href={`/penyedia/${penyedia.id}`} className="btn-secondary btn-sm">
              <Icon name="eye" size={14} />
              Lihat profil publik
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-tinta-700">Status verifikasi:</span>
        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
        {penyedia.isPremium && <Badge tone="warning">★ Premium listing aktif</Badge>}
      </div>

      {penyedia.status === "REJECTED" && penyedia.reviewNote && (
        <div className="mb-6">
          <Alert tone="danger" title="Catatan admin">
            {penyedia.reviewNote}
          </Alert>
        </div>
      )}

      <ActionForm action={simpanProfilPenyedia} className="space-y-6">
        <section className="card-pad space-y-4">
          <h2 className="text-lg font-bold">Profil publik</h2>

          <div>
            <label className="label" htmlFor="headline">
              Judul keahlian
            </label>
            <input
              id="headline"
              name="headline"
              required
              minLength={10}
              maxLength={120}
              defaultValue={penyedia.headline}
              className="input"
            />
            <p className="hint">Kalimat singkat yang muncul di bawah namamu.</p>
          </div>

          <div>
            <label className="label" htmlFor="about">
              Tentang saya
            </label>
            <textarea
              id="about"
              name="about"
              required
              minLength={40}
              rows={6}
              defaultValue={penyedia.about}
              className="textarea"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="nim">
                NIM
              </label>
              <input id="nim" value={penyedia.nim} disabled className="input" />
              <p className="hint">NIM terkunci setelah diverifikasi. Hubungi admin bila keliru.</p>
            </div>
            <div>
              <label className="label" htmlFor="studyProgram">
                Program studi
              </label>
              <input
                id="studyProgram"
                name="studyProgram"
                defaultValue={penyedia.studyProgram}
                className="input"
              />
            </div>
          </div>
        </section>

        <section className="card-pad space-y-4">
          <h2 className="text-lg font-bold">Rekening pencairan dana</h2>
          <p className="-mt-2 text-sm text-tinta-600">
            Pendapatan dari pesanan yang selesai diteruskan pengurus ke rekening ini.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bankName">
                Nama bank
              </label>
              <input
                id="bankName"
                name="bankName"
                defaultValue={penyedia.bankName ?? ""}
                placeholder="Bank Mandiri"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="bankAccount">
                Nomor rekening
              </label>
              <input
                id="bankAccount"
                name="bankAccount"
                inputMode="numeric"
                defaultValue={penyedia.bankAccount ?? ""}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="bankHolder">
              Nama pemilik rekening
            </label>
            <input
              id="bankHolder"
              name="bankHolder"
              defaultValue={penyedia.bankHolder ?? user.name}
              className="input"
            />
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <SubmitButton className="btn-primary" pendingLabel="Menyimpan…">
            Simpan Perubahan
          </SubmitButton>
          <Link href="/dashboard/profil" className="btn-secondary">
            Ubah data akun & kata sandi
          </Link>
        </div>
      </ActionForm>
    </>
  );
}
