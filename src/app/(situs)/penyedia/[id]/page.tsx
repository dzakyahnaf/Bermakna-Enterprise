import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { campusLabel } from "@/lib/constants";
import { tanggal, tautanWhatsapp, waktuRelatif } from "@/lib/format";
import { PILIH_KARTU_LAYANAN, ServiceCard } from "@/components/service-card";
import { Avatar, Icon, PremiumBadge, Stars, VerifiedBadge } from "@/components/ui";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const penyedia = await prisma.provider.findUnique({
    where: { id },
    select: { headline: true, user: { select: { name: true } } },
  });
  if (!penyedia) return { title: "Penyedia tidak ditemukan" };
  return { title: penyedia.user.name, description: penyedia.headline };
}

export default async function ProfilPenyedia({ params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();

  const penyedia = await prisma.provider.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          faculty: true,
          batch: true,
          campus: true,
          phone: true,
          createdAt: true,
        },
      },
      portfolio: { orderBy: { createdAt: "desc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          author: { select: { name: true, avatarUrl: true } },
          service: { select: { title: true } },
        },
      },
    },
  });

  if (!penyedia) notFound();

  const milikSendiri = user?.id === penyedia.userId;
  if (penyedia.status !== "VERIFIED" && !milikSendiri && user?.role !== "ADMIN") notFound();

  const layanan = await prisma.service.findMany({
    where: {
      providerId: penyedia.id,
      ...(milikSendiri || user?.role === "ADMIN" ? {} : { status: "ACTIVE" }),
    },
    orderBy: [{ status: "asc" }, { ratingAvg: "desc" }],
    select: PILIH_KARTU_LAYANAN,
  });

  const waLink = tautanWhatsapp(
    penyedia.user.phone,
    `Halo ${penyedia.user.name}, saya melihat profilmu di Bermakna Enterprise. Boleh saya tanya soal layanan yang kamu tawarkan?`,
  );

  return (
    <div className="wrap py-8">
      {/* ── Kepala profil ─────────────────────────────────────────────── */}
      <header className="card overflow-hidden">
        <div className="pita-gradien h-24 sm:h-28" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="rounded-full ring-4 ring-white">
              <Avatar name={penyedia.user.name} url={penyedia.user.avatarUrl} size={80} />
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {waLink && !milikSendiri && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-wa btn-sm">
                  Hubungi via WhatsApp
                </a>
              )}
              {milikSendiri && (
                <a href="/mitra/profil" className="btn-secondary btn-sm">
                  Edit profil penyedia
                </a>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold sm:text-3xl">{penyedia.user.name}</h1>
              {penyedia.status === "VERIFIED" && <VerifiedBadge />}
              {penyedia.isPremium && <PremiumBadge />}
            </div>
            <p className="mt-1 text-sm text-tinta-600">
              {penyedia.studyProgram} · {penyedia.user.faculty} · Angkatan {penyedia.user.batch} ·{" "}
              {campusLabel(penyedia.user.campus)}
            </p>
            <p className="mt-3 max-w-2xl text-base leading-relaxed font-semibold text-tinta-800">
              {penyedia.headline}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-krem-200 pt-5 sm:grid-cols-4">
            <Metrik
              label="Rating"
              nilai={penyedia.ratingAvg > 0 ? penyedia.ratingAvg.toFixed(1) : "Baru"}
              sub={`${penyedia.ratingCount} ulasan`}
            />
            <Metrik
              label="Pesanan selesai"
              nilai={String(penyedia.completedOrders)}
              sub="transaksi tuntas"
            />
            <Metrik label="Layanan aktif" nilai={String(layanan.length)} sub="siap dipesan" />
            <Metrik
              label="Bergabung"
              nilai={tanggal(penyedia.user.createdAt).split(" ").slice(1).join(" ")}
              sub={
                penyedia.verifiedAt
                  ? `Terverifikasi ${waktuRelatif(penyedia.verifiedAt)}`
                  : "Menunggu verifikasi"
              }
            />
          </dl>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {/* Layanan */}
          <section>
            <h2 className="mb-4 text-xl font-bold">Layanan yang ditawarkan</h2>
            {layanan.length === 0 ? (
              <div className="card px-6 py-10 text-center text-sm text-tinta-600">
                Penyedia ini belum menayangkan layanan apa pun.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {layanan.map((s) => (
                  <ServiceCard key={s.slug} layanan={s} />
                ))}
              </div>
            )}
          </section>

          {/* Review */}
          {penyedia.reviews.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-bold">
                Ulasan pembeli{" "}
                <span className="font-semibold text-tinta-600">({penyedia.ratingCount})</span>
              </h2>
              <ul className="card-pad divide-y divide-krem-200">
                {penyedia.reviews.map((r) => (
                  <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <Avatar name={r.author.name} url={r.author.avatarUrl} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="text-sm font-bold text-tinta-900">{r.author.name}</span>
                          <Stars value={r.rating} />
                          <span className="text-xs text-tinta-500">{waktuRelatif(r.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-tinta-500">untuk “{r.service.title}”</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-tinta-700">{r.comment}</p>
                        {r.reply && (
                          <div className="mt-2.5 rounded-xl border-l-2 border-oranye-500 bg-krem-50 px-3.5 py-2.5">
                            <p className="text-xs font-bold text-tinta-800">Balasan penyedia</p>
                            <p className="mt-1 text-sm leading-relaxed text-tinta-700">{r.reply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside className="space-y-4">
          <div className="card-pad">
            <h2 className="text-base font-bold">Tentang saya</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-tinta-700">{penyedia.about}</p>
          </div>

          {penyedia.portfolio.length > 0 && (
            <div className="card-pad">
              <h2 className="text-base font-bold">Portofolio</h2>
              <ul className="mt-3 space-y-3">
                {penyedia.portfolio.map((p) => (
                  <li key={p.id} className="rounded-xl border border-krem-200 bg-krem-50 p-3">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="mb-2.5 aspect-video w-full rounded-lg object-cover"
                      />
                    )}
                    <p className="text-sm font-bold text-tinta-900">{p.title}</p>
                    {p.description && (
                      <p className="mt-1 text-xs leading-relaxed text-tinta-600">{p.description}</p>
                    )}
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tautan mt-1.5 inline-flex items-center gap-1 text-xs"
                      >
                        Lihat karya
                        <Icon name="arrowRight" size={12} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Metrik({ label, nilai, sub }: { label: string; nilai: string; sub: string }) {
  return (
    <div>
      <dt className="text-xs text-tinta-600">{label}</dt>
      <dd className="mt-0.5 text-xl font-extrabold text-tinta-900">{nilai}</dd>
      <p className="text-xs text-tinta-500">{sub}</p>
    </div>
  );
}
