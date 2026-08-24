import type { Metadata } from "next";
import Link from "next/link";

import { verifikasiPenyedia } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROVIDER_STATUS_META, campusLabel } from "@/lib/constants";
import { tanggalWaktu } from "@/lib/format";
import { urlPrivat } from "@/lib/upload";
import { PageHeader } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/action-form";
import { Avatar, Badge, EmptyState, Icon } from "@/components/ui";

export const metadata: Metadata = { title: "Verifikasi Penyedia" };

export default async function VerifikasiPenyedia({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status = "PENDING" } = await searchParams;

  const [daftar, hitungan] = await Promise.all([
    prisma.provider.findMany({
      where: status === "SEMUA" ? {} : { status },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
            phone: true,
            campus: true,
            faculty: true,
            batch: true,
          },
        },
      },
    }),
    prisma.provider.groupBy({ by: ["status"], _count: true }),
  ]);

  const jumlahPer = new Map(hitungan.map((h) => [h.status, h._count]));

  // KTM tersimpan di bucket privat — tautannya dibuatkan per permintaan dan
  // hanya berlaku satu jam, jadi tidak ada URL permanen yang bisa tersebar.
  const tautanKtm = new Map(
    await Promise.all(
      daftar.map(async (p) => [p.id, await urlPrivat(p.ktmUrl)] as const),
    ),
  );

  const TAB = [
    { value: "PENDING", label: "Menunggu" },
    { value: "VERIFIED", label: "Terverifikasi" },
    { value: "REJECTED", label: "Ditolak" },
    { value: "SEMUA", label: "Semua" },
  ];

  return (
    <>
      <PageHeader
        title="Verifikasi Penyedia"
        description="Periksa KTM dan kesesuaian data sebelum menyetujui seorang mahasiswa menjadi penyedia jasa."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TAB.map((t) => (
          <Link
            key={t.value}
            href={`/admin/verifikasi?status=${t.value}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              status === t.value
                ? "pita-gradien text-white"
                : "border border-krem-300 bg-white text-tinta-700 hover:border-oranye-500"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                status === t.value ? "bg-white/25" : "bg-krem-200 text-tinta-700"
              }`}
            >
              {t.value === "SEMUA"
                ? hitungan.reduce((n, h) => n + h._count, 0)
                : (jumlahPer.get(t.value) ?? 0)}
            </span>
          </Link>
        ))}
      </div>

      {daftar.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Tidak ada yang perlu diperiksa"
          description="Semua pendaftaran penyedia pada status ini sudah ditangani."
        />
      ) : (
        <div className="space-y-4">
          {daftar.map((p) => {
            const meta = PROVIDER_STATUS_META[p.status];
            return (
              <article key={p.id} className="card-pad">
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar name={p.user.name} url={p.user.avatarUrl} size={52} />
                  <div className="min-w-48 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-tinta-900">{p.user.name}</h3>
                      <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
                      {p.isPremium && <Badge tone="warning">★ Premium</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-tinta-600">
                      {p.user.email} · {p.user.phone}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed font-semibold text-tinta-800">
                      {p.headline}
                    </p>
                  </div>
                  <p className="text-xs whitespace-nowrap text-tinta-500">
                    Diajukan {tanggalWaktu(p.createdAt)}
                  </p>
                </div>

                <dl className="mt-4 grid gap-3 border-t border-krem-200 pt-4 sm:grid-cols-4">
                  <Data label="NIM" nilai={p.nim} />
                  <Data label="Program studi" nilai={p.studyProgram} />
                  <Data
                    label="Fakultas / Angkatan"
                    nilai={`${p.user.faculty ?? "-"} · ${p.user.batch ?? "-"}`}
                  />
                  <Data label="Kampus" nilai={campusLabel(p.user.campus)} />
                </dl>

                <div className="mt-4 border-t border-krem-200 pt-4">
                  <p className="text-xs font-semibold text-tinta-600">Tentang penyedia</p>
                  <p className="mt-1 text-sm leading-relaxed text-tinta-700">{p.about}</p>
                </div>

                <div className="mt-4 border-t border-krem-200 pt-4">
                  <p className="mb-2 text-xs font-semibold text-tinta-600">
                    Bukti kemahasiswaan (KTM)
                  </p>
                  {tautanKtm.get(p.id) ? (
                    <a href={tautanKtm.get(p.id)!} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tautanKtm.get(p.id)!}
                        alt={`KTM ${p.user.name}`}
                        className="max-h-44 rounded-xl border border-krem-300"
                      />
                    </a>
                  ) : (
                    <p className="rounded-lg bg-kuning-100/25 px-3 py-2 text-xs text-tinta-800">
                      Belum ada berkas KTM yang diunggah (data contoh). Minta penyedia mengunggahnya
                      sebelum disetujui.
                    </p>
                  )}
                </div>

                {p.reviewNote && (
                  <p className="mt-4 rounded-lg bg-merah-500/8 px-3 py-2 text-xs text-merah-900">
                    Catatan sebelumnya: {p.reviewNote}
                  </p>
                )}

                {p.status !== "VERIFIED" && (
                  <form
                    action={verifikasiPenyedia}
                    className="mt-5 flex flex-wrap items-end gap-3 border-t border-krem-200 pt-4"
                  >
                    <input type="hidden" name="providerId" value={p.id} />
                    <div className="min-w-56 flex-1">
                      <label className="label" htmlFor={`catatan-${p.id}`}>
                        Catatan (wajib bila menolak)
                      </label>
                      <input
                        id={`catatan-${p.id}`}
                        name="catatan"
                        placeholder="Contoh: foto KTM buram, mohon unggah ulang."
                        className="input"
                      />
                    </div>
                    <div className="flex gap-2">
                      <SubmitButton
                        name="keputusan"
                        value="setujui"
                        className="btn-primary"
                        pendingLabel="Memproses…"
                      >
                        <Icon name="check" size={16} />
                        Setujui
                      </SubmitButton>
                      <SubmitButton
                        name="keputusan"
                        value="tolak"
                        className="btn-danger"
                        confirm="Tolak pendaftaran penyedia ini? Semua layanannya akan dijeda."
                        pendingLabel="Memproses…"
                      >
                        Tolak
                      </SubmitButton>
                    </div>
                  </form>
                )}

                {p.status === "VERIFIED" && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-krem-200 pt-4">
                    <Link href={`/penyedia/${p.id}`} className="btn-secondary btn-sm">
                      <Icon name="eye" size={14} />
                      Lihat profil publik
                    </Link>
                    <form action={verifikasiPenyedia}>
                      <input type="hidden" name="providerId" value={p.id} />
                      <input type="hidden" name="catatan" value="Verifikasi dicabut admin." />
                      <SubmitButton
                        name="keputusan"
                        value="tolak"
                        className="btn-danger btn-sm"
                        confirm="Cabut verifikasi penyedia ini? Semua layanannya akan dijeda."
                        pendingLabel="…"
                      >
                        Cabut verifikasi
                      </SubmitButton>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function Data({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div>
      <dt className="text-xs text-tinta-600">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-tinta-900">{nilai}</dd>
    </div>
  );
}
