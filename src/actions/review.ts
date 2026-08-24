"use server";

import { revalidatePath } from "next/cache";

import { requireProvider, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { beriNotifikasi } from "@/lib/notify";
import { ORDER_STATUS } from "@/lib/constants";
import { berhasil, gagal, teks, type ActionState } from "@/lib/action-state";

/** Menghitung ulang rata-rata rating layanan dan penyedia setelah ada review baru. */
async function segarkanRating(serviceId: string, providerId: string) {
  const [layanan, penyedia] = await Promise.all([
    prisma.review.aggregate({
      where: { serviceId },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.aggregate({
      where: { providerId },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  await prisma.$transaction([
    prisma.service.update({
      where: { id: serviceId },
      data: { ratingAvg: layanan._avg.rating ?? 0, ratingCount: layanan._count },
    }),
    prisma.provider.update({
      where: { id: providerId },
      data: { ratingAvg: penyedia._avg.rating ?? 0, ratingCount: penyedia._count },
    }),
  ]);
}

// ── Pembeli menulis review ───────────────────────────────────────────────

export async function tulisReview(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const code = teks(formData, "code");
  const rating = Number(teks(formData, "rating"));
  const comment = teks(formData, "comment");

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return gagal("Pilih rating bintang 1 sampai 5.");
  }
  if (comment.length < 10) {
    return gagal("Tuliskan ulasan minimal 10 karakter agar bermanfaat bagi mahasiswa lain.");
  }

  const pesanan = await prisma.order.findUnique({
    where: { code },
    select: {
      id: true,
      buyerId: true,
      status: true,
      serviceId: true,
      providerId: true,
      review: { select: { id: true } },
      service: { select: { title: true, slug: true } },
      provider: { select: { userId: true } },
    },
  });

  if (!pesanan || pesanan.buyerId !== user.id) return gagal("Pesanan tidak ditemukan.");

  // Kontrol kualitas: review hanya dari pembeli yang pesanannya benar-benar selesai.
  if (pesanan.status !== ORDER_STATUS.SELESAI) {
    return gagal("Review hanya bisa ditulis setelah pesanan berstatus selesai.");
  }
  if (pesanan.review) return gagal("Kamu sudah menulis review untuk pesanan ini.");

  await prisma.review.create({
    data: {
      orderId: pesanan.id,
      serviceId: pesanan.serviceId,
      providerId: pesanan.providerId,
      authorId: user.id,
      rating,
      comment,
    },
  });

  await segarkanRating(pesanan.serviceId, pesanan.providerId);

  await beriNotifikasi({
    userId: pesanan.provider.userId,
    title: `Review baru ${"★".repeat(rating)}`,
    body: `${user.name} memberi ulasan untuk "${pesanan.service.title}".`,
    link: `/mitra/review`,
  });

  revalidatePath(`/dashboard/pesanan/${code}`);
  revalidatePath(`/layanan/${pesanan.service.slug}`);
  return berhasil("Terima kasih! Review kamu sudah tayang.");
}

// ── Penyedia membalas review ─────────────────────────────────────────────

export async function balasReview(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireProvider();
  const reviewId = teks(formData, "reviewId");
  const reply = teks(formData, "reply");

  if (reply.length < 3) return gagal("Balasan minimal 3 karakter.");

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, providerId: true, authorId: true, service: { select: { slug: true } } },
  });
  if (!review || review.providerId !== user.provider.id) return gagal("Review tidak ditemukan.");

  await prisma.review.update({ where: { id: review.id }, data: { reply } });

  await beriNotifikasi({
    userId: review.authorId,
    title: "Penyedia membalas ulasanmu",
    body: reply.slice(0, 120),
    link: `/layanan/${review.service.slug}`,
  });

  revalidatePath("/mitra/review");
  revalidatePath(`/layanan/${review.service.slug}`);
  return berhasil("Balasan terkirim.");
}
