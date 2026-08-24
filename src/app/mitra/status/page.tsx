import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tanggalWaktu } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { Alert, Icon } from "@/components/ui";

export const metadata: Metadata = { title: "Status Verifikasi" };

export default async function StatusVerifikasi() {
  const user = await requireProvider();
  if (user.provider.status === "VERIFIED") redirect("/mitra");

  const penyedia = await prisma.provider.findUnique({
    where: { id: user.provider.id },
    select: {
      status: true,
      reviewNote: true,
      nim: true,
      studyProgram: true,
      headline: true,
      createdAt: true,
    },
  });
  if (!penyedia) redirect("/jadi-penyedia");

  const ditolak = penyedia.status === "REJECTED";

  return (
    <>
      <PageHeader title="Status Verifikasi Penyedia" />

      <div className="card overflow-hidden">
        <div className={`p-8 text-center ${ditolak ? "bg-merah-500/8" : "bg-krem-50"}`}>
          <span
            className={`inline-flex size-16 items-center justify-center rounded-full ${
              ditolak ? "bg-merah-500/12 text-merah-900" : "bg-kuning-100/45 text-tinta-800"
            }`}
          >
            <Icon name={ditolak ? "x" : "clock"} size={30} />
          </span>
          <h2 className="mt-4 text-xl font-extrabold">
            {ditolak ? "Pendaftaran belum bisa disetujui" : "Menunggu verifikasi admin"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-tinta-600">
            {ditolak
              ? "Pengurus Bermakna Enterprise belum dapat menyetujui pendaftaranmu. Perbaiki datanya lalu hubungi admin untuk peninjauan ulang."
              : "Pengurus Bermakna Enterprise sedang memeriksa data kemahasiswaanmu. Proses ini biasanya selesai dalam 1×24 jam pada hari kerja."}
          </p>
        </div>

        <div className="border-t border-krem-200 p-6">
          {ditolak && penyedia.reviewNote && (
            <div className="mb-5">
              <Alert tone="danger" title="Catatan dari admin">
                {penyedia.reviewNote}
              </Alert>
            </div>
          )}

          <dl className="grid gap-4 sm:grid-cols-2">
            <Data label="Nama" nilai={user.name} />
            <Data label="NIM" nilai={penyedia.nim} />
            <Data label="Program studi" nilai={penyedia.studyProgram} />
            <Data label="Diajukan" nilai={tanggalWaktu(penyedia.createdAt)} />
            <div className="sm:col-span-2">
              <Data label="Judul keahlian" nilai={penyedia.headline} />
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-krem-200 pt-5">
            <Link href="/mitra/profil" className="btn-secondary">
              Perbarui data penyedia
            </Link>
            <Link href="/jelajah" className="btn-ghost">
              Jelajahi layanan lain
            </Link>
          </div>
        </div>
      </div>

      <div className="card-pad mt-6">
        <h2 className="text-base font-bold">Sambil menunggu, siapkan ini</h2>
        <ul className="mt-3 space-y-2.5 text-sm text-tinta-700">
          {[
            "Susun deskripsi layanan yang jelas: apa yang didapat pembeli, berapa lama, dan bagaimana alurnya.",
            "Siapkan foto contoh karya untuk portofolio — ini yang paling menentukan pembeli percaya.",
            "Tentukan harga yang masuk akal untuk kantong mahasiswa tapi tetap layak bagi waktumu.",
            "Pastikan nomor WhatsApp di profilmu aktif agar pembeli mudah menghubungi.",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-oranye-500">
                <Icon name="check" size={15} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Data({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div>
      <dt className="text-xs text-tinta-600">{label}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed font-semibold text-tinta-900">{nilai}</dd>
    </div>
  );
}
