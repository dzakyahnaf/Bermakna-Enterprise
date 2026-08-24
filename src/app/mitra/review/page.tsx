import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { balasReview } from "@/actions/review";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tanggal } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Avatar, EmptyState, StatCard, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewMitra() {
  const user = await requireProvider();
  if (user.provider.status !== "VERIFIED") redirect("/mitra/status");

  const [penyedia, review] = await Promise.all([
    prisma.provider.findUnique({
      where: { id: user.provider.id },
      select: { ratingAvg: true, ratingCount: true },
    }),
    prisma.review.findMany({
      where: { providerId: user.provider.id },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, avatarUrl: true } },
        service: { select: { title: true, slug: true } },
      },
    }),
  ]);

  const belumDibalas = review.filter((r) => !r.reply).length;
  const sebaran = [5, 4, 3, 2, 1].map((b) => ({
    bintang: b,
    jumlah: review.filter((r) => r.rating === b).length,
  }));

  return (
    <>
      <PageHeader
        title="Review Pembeli"
        description="Balasan yang sopan atas setiap ulasan menunjukkan profesionalitasmu ke calon pembeli."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Rating rata-rata"
          value={penyedia && penyedia.ratingAvg > 0 ? penyedia.ratingAvg.toFixed(1) : "Baru"}
          sub="dari 5,0"
        />
        <StatCard label="Total ulasan" value={penyedia?.ratingCount ?? 0} sub="dari pembeli" />
        <StatCard label="Belum dibalas" value={belumDibalas} sub="menunggu tanggapanmu" />
      </div>

      {review.length > 0 && (
        <div className="card-pad mt-6">
          <p className="mb-3 text-sm font-bold text-tinta-900">Sebaran rating</p>
          <div className="space-y-1.5">
            {sebaran.map(({ bintang, jumlah }) => (
              <div key={bintang} className="flex items-center gap-3 text-xs">
                <span className="w-8 text-tinta-600">{bintang} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-krem-200">
                  <div
                    className="h-full rounded-full bg-kuning-400"
                    style={{ width: `${(jumlah / review.length) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-tinta-600">{jumlah}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Semua ulasan</h2>

        {review.length === 0 ? (
          <EmptyState
            icon="⭐"
            title="Belum ada ulasan"
            description="Ulasan muncul setelah pembeli menyelesaikan pesanan dan memberi rating."
            action={{ href: "/mitra/pesanan", label: "Lihat pesanan masuk" }}
          />
        ) : (
          <ul className="space-y-3">
            {review.map((r) => (
              <li key={r.id} className="card-pad">
                <div className="flex items-start gap-3">
                  <Avatar name={r.author.name} url={r.author.avatarUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="text-sm font-bold text-tinta-900">{r.author.name}</span>
                      <Stars value={r.rating} />
                      <span className="text-xs text-tinta-500">{tanggal(r.createdAt)}</span>
                    </div>
                    <Link
                      href={`/layanan/${r.service.slug}`}
                      className="mt-0.5 block text-xs text-tinta-500 hover:text-merah-500"
                    >
                      untuk “{r.service.title}”
                    </Link>
                    <p className="mt-2 text-sm leading-relaxed text-tinta-700">{r.comment}</p>

                    {r.reply ? (
                      <div className="mt-3 rounded-xl border-l-2 border-oranye-500 bg-krem-50 px-3.5 py-2.5">
                        <p className="text-xs font-bold text-tinta-800">Balasanmu</p>
                        <p className="mt-1 text-sm leading-relaxed text-tinta-700">{r.reply}</p>
                      </div>
                    ) : (
                      <ActionForm action={balasReview} className="mt-3 space-y-2.5">
                        <input type="hidden" name="reviewId" value={r.id} />
                        <textarea
                          name="reply"
                          required
                          rows={2}
                          placeholder="Tulis balasan untuk ulasan ini…"
                          className="textarea min-h-0"
                        />
                        <SubmitButton className="btn-secondary btn-sm" pendingLabel="Mengirim…">
                          Kirim Balasan
                        </SubmitButton>
                      </ActionForm>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
