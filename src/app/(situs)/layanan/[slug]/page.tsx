import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { campusLabel, priceUnitLabel } from "@/lib/constants";
import { potong, tanggal, tautanWhatsapp, waktuRelatif } from "@/lib/format";
import { BookingForm } from "@/components/booking-form";
import { Gallery } from "@/components/gallery";
import { PILIH_KARTU_LAYANAN, ServiceCard } from "@/components/service-card";
import { Avatar, Icon, PremiumBadge, Stars, VerifiedBadge } from "@/components/ui";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const layanan = await prisma.service.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });
  if (!layanan) return { title: "Layanan tidak ditemukan" };
  return {
    title: layanan.title,
    description: potong(layanan.description.replace(/\n+/g, " "), 155),
  };
}

export default async function DetailLayanan({ params }: Params) {
  const { slug } = await params;
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);

  const layanan = await prisma.service.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { order: "asc" } },
      provider: {
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, faculty: true, batch: true, phone: true },
          },
          portfolio: { orderBy: { createdAt: "desc" }, take: 3 },
          _count: { select: { services: { where: { status: "ACTIVE" } } } },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { author: { select: { name: true, avatarUrl: true } } },
      },
    },
  });

  if (!layanan) notFound();

  // Layanan yang dijeda atau penyedianya belum terverifikasi hanya boleh
  // dilihat pemiliknya sendiri dan admin.
  const milikSendiri = user?.id === layanan.provider.userId;
  const tersedia = layanan.status === "ACTIVE" && layanan.provider.status === "VERIFIED";
  if (!tersedia && !milikSendiri && user?.role !== "ADMIN") notFound();

  // Penghitung tampilan sederhana (tidak menghitung kunjungan pemilik sendiri).
  if (!milikSendiri) {
    await prisma.service.update({ where: { id: layanan.id }, data: { views: { increment: 1 } } });
  }

  const serupa = await prisma.service.findMany({
    where: {
      categoryId: layanan.categoryId,
      status: "ACTIVE",
      provider: { status: "VERIFIED" },
      NOT: { id: layanan.id },
    },
    orderBy: { ratingAvg: "desc" },
    take: 3,
    select: PILIH_KARTU_LAYANAN,
  });

  const gambar = [
    ...(layanan.coverUrl ? [layanan.coverUrl] : []),
    ...layanan.images.map((i) => i.url),
  ];

  const waLink = tautanWhatsapp(
    layanan.provider.user.phone,
    `Halo ${layanan.provider.user.name}, saya menemukan layanan "${layanan.title}" di Bermakna Enterprise. Boleh saya tanya-tanya dulu?`,
  );

  const sebaranRating = [5, 4, 3, 2, 1].map((bintang) => ({
    bintang,
    jumlah: layanan.reviews.filter((r) => r.rating === bintang).length,
  }));

  return (
    <div className="wrap py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-tinta-600">
        <Link href="/jelajah" className="hover:text-merah-500">
          Jelajah
        </Link>
        <Icon name="arrowRight" size={12} />
        <Link href={`/kategori/${layanan.category.slug}`} className="hover:text-merah-500">
          {layanan.category.name}
        </Link>
        <Icon name="arrowRight" size={12} />
        <span className="truncate text-tinta-900">{potong(layanan.title, 40)}</span>
      </nav>

      {!tersedia && (
        <div className="mb-6 rounded-xl border border-kuning-400/50 bg-kuning-100/25 px-4 py-3 text-sm text-tinta-800">
          <strong className="font-bold">Pratinjau.</strong> Layanan ini belum tayang untuk umum
          {layanan.provider.status !== "VERIFIED"
            ? " karena akun penyedia masih menunggu verifikasi admin."
            : " karena statusnya sedang dijeda."}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ── Kolom utama ───────────────────────────────────────────── */}
        <div className="min-w-0">
          <Gallery images={gambar} fallbackIcon={layanan.category.icon} alt={layanan.title} />

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/kategori/${layanan.category.slug}`} className="badge badge-neutral">
                {layanan.category.icon} {layanan.category.name}
              </Link>
              {layanan.provider.isPremium && <PremiumBadge />}
            </div>

            <h1 className="mt-3 text-2xl leading-tight font-semibold sm:text-3xl" style={{ fontFamily: "var(--font-sans)" }}>
              {layanan.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-tinta-600">
              <Stars value={layanan.ratingAvg} count={layanan.ratingCount} size="md" />
              <span className="flex items-center gap-1.5">
                <Icon name="cart" size={15} />
                {layanan.orderCount}× dipesan
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="eye" size={15} />
                {layanan.views} dilihat
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="mapPin" size={15} />
                {campusLabel(layanan.campus)}
              </span>
              {layanan.deliveryDays && (
                <span className="flex items-center gap-1.5">
                  <Icon name="clock" size={15} />
                  Estimasi {layanan.deliveryDays} hari
                </span>
              )}
            </div>
          </div>

          {/* Deskripsi */}
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Deskripsi layanan</h2>
            <div className="card-pad space-y-3 text-sm leading-relaxed whitespace-pre-line text-tinta-800">
              {layanan.description}
            </div>
            {layanan.location && (
              <p className="mt-3 flex items-center gap-2 text-sm text-tinta-600">
                <Icon name="mapPin" size={16} />
                <span>
                  <strong className="font-semibold text-tinta-800">Lokasi:</strong> {layanan.location}
                </span>
              </p>
            )}
          </section>

          {/* Profil penyedia */}
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Tentang penyedia</h2>
            <div className="card-pad">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar
                  name={layanan.provider.user.name}
                  url={layanan.provider.user.avatarUrl}
                  size={56}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/penyedia/${layanan.provider.id}`}
                      className="text-base font-bold text-tinta-900 hover:text-merah-500"
                    >
                      {layanan.provider.user.name}
                    </Link>
                    {layanan.provider.status === "VERIFIED" && <VerifiedBadge />}
                  </div>
                  <p className="mt-0.5 text-xs text-tinta-600">
                    {layanan.provider.studyProgram} · {layanan.provider.user.faculty} · Angkatan{" "}
                    {layanan.provider.user.batch}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-tinta-700">
                    {layanan.provider.headline}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-krem-200 pt-4 text-center">
                <div>
                  <dt className="text-xs text-tinta-600">Rating</dt>
                  <dd className="mt-0.5 text-lg font-bold text-tinta-900">
                    {layanan.provider.ratingAvg > 0
                      ? layanan.provider.ratingAvg.toFixed(1)
                      : "Baru"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-tinta-600">Pesanan selesai</dt>
                  <dd className="mt-0.5 text-lg font-bold text-tinta-900">
                    {layanan.provider.completedOrders}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-tinta-600">Layanan aktif</dt>
                  <dd className="mt-0.5 text-lg font-bold text-tinta-900">
                    {layanan.provider._count.services}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-sm leading-relaxed text-tinta-700">
                {layanan.provider.about}
              </p>

              {layanan.provider.portfolio.length > 0 && (
                <div className="mt-5 border-t border-krem-200 pt-4">
                  <p className="mb-2.5 text-sm font-bold text-tinta-900">Portofolio terbaru</p>
                  <ul className="grid gap-2.5 sm:grid-cols-3">
                    {layanan.provider.portfolio.map((p) => (
                      <li key={p.id} className="rounded-xl border border-krem-200 bg-krem-50 p-3">
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="mb-2 aspect-video w-full rounded-lg object-cover"
                          />
                        )}
                        <p className="text-xs font-bold text-tinta-900">{p.title}</p>
                        {p.description && (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-tinta-600">
                            {p.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                href={`/penyedia/${layanan.provider.id}`}
                className="btn-secondary btn-sm mt-4"
              >
                Lihat profil lengkap
                <Icon name="arrowRight" size={14} />
              </Link>
            </div>
          </section>

          {/* Rating & Review */}
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold">
              Rating & review{" "}
              <span className="font-semibold text-tinta-600">({layanan.ratingCount})</span>
            </h2>

            {layanan.reviews.length === 0 ? (
              <div className="card px-6 py-10 text-center">
                <p className="text-sm font-semibold text-tinta-800">Belum ada review</p>
                <p className="mt-1 text-sm text-tinta-600">
                  Jadilah yang pertama memberi ulasan setelah pesananmu selesai.
                </p>
              </div>
            ) : (
              <div className="card-pad">
                <div className="flex flex-wrap items-center gap-8 border-b border-krem-200 pb-5">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-tinta-900">
                      {layanan.ratingAvg.toFixed(1)}
                    </p>
                    <Stars value={layanan.ratingAvg} />
                    <p className="mt-1 text-xs text-tinta-600">{layanan.ratingCount} ulasan</p>
                  </div>
                  <div className="min-w-48 flex-1 space-y-1">
                    {sebaranRating.map(({ bintang, jumlah }) => (
                      <div key={bintang} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-tinta-600">{bintang}★</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-krem-200">
                          <div
                            className="h-full rounded-full bg-kuning-400"
                            style={{
                              width: `${layanan.reviews.length ? (jumlah / layanan.reviews.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="w-5 text-right text-tinta-600">{jumlah}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <ul className="divide-y divide-krem-200">
                  {layanan.reviews.map((r) => (
                    <li key={r.id} className="py-5 first:pt-5 last:pb-0">
                      <div className="flex items-start gap-3">
                        <Avatar name={r.author.name} url={r.author.avatarUrl} size={36} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="text-sm font-bold text-tinta-900">{r.author.name}</span>
                            <Stars value={r.rating} />
                            <span className="text-xs text-tinta-500">
                              {waktuRelatif(r.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-tinta-700">{r.comment}</p>
                          {r.reply && (
                            <div className="mt-3 rounded-xl border-l-2 border-oranye-500 bg-krem-50 px-3.5 py-2.5">
                              <p className="text-xs font-bold text-tinta-800">
                                Balasan {layanan.provider.user.name}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-tinta-700">{r.reply}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        {/* ── Kolom pemesanan ───────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BookingForm
            slug={layanan.slug}
            price={layanan.price}
            priceUnit={layanan.priceUnit}
            adminFee={settings.adminFee}
            sudahMasuk={Boolean(user)}
            milikSendiri={milikSendiri}
            teleponAwal={user?.phone ?? ""}
          />

          {waLink && !milikSendiri && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa btn-block mt-3"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.32l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5.01c0-5.18 4.22-9.4 9.42-9.4a9.34 9.34 0 0 1 6.65 2.76 9.32 9.32 0 0 1 2.75 6.65c0 5.18-4.22 9.4-9.41 9.42z" />
              </svg>
              Tanya dulu via WhatsApp
            </a>
          )}

          <div className="card-pad mt-3">
            <p className="text-sm font-bold text-tinta-900">Transaksi aman</p>
            <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-tinta-700">
              {[
                "Penyedia sudah diverifikasi identitas kemahasiswaannya.",
                "Dana ditahan Bermakna Enterprise sampai pesanan selesai.",
                "Review hanya bisa ditulis pembeli dengan pesanan tuntas.",
                "Ada pengurus yang menengahi bila terjadi sengketa.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-hijau-600">
                    <Icon name="check" size={14} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 px-1 text-xs text-tinta-500">
            Tayang sejak {tanggal(layanan.createdAt)} · Satuan harga{" "}
            {priceUnitLabel(layanan.priceUnit)}
          </p>
        </aside>
      </div>

      {serupa.length > 0 && (
        <section className="mt-16 border-t border-krem-300 pt-10">
          <h2 className="mb-5 text-xl font-bold">Layanan serupa lainnya</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serupa.map((s) => (
              <ServiceCard key={s.slug} layanan={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
