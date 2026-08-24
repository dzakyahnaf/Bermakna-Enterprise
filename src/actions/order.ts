"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, requireAdmin, requireProvider, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings, hitungBiaya } from "@/lib/settings";
import { hapusBerkasPrivat, simpanBerkasPrivat } from "@/lib/upload";
import { beriNotifikasi, catatEvent } from "@/lib/notify";
import { buatKodePesanan } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/constants";
import { berhasil, berkas, gagal, teks, type ActionState } from "@/lib/action-state";

// ── Pengguna membuat pesanan ─────────────────────────────────────────────

export async function buatPesanan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  const slug = teks(formData, "slug");

  if (!user) redirect(`/masuk?tujuan=/layanan/${slug}`);

  const layanan = await prisma.service.findUnique({
    where: { slug },
    select: {
      id: true,
      price: true,
      status: true,
      title: true,
      provider: {
        select: { id: true, status: true, userId: true, user: { select: { name: true } } },
      },
    },
  });

  if (!layanan || layanan.status !== "ACTIVE" || layanan.provider.status !== "VERIFIED") {
    return gagal("Layanan ini sedang tidak tersedia.");
  }
  if (layanan.provider.userId === user.id) {
    return gagal("Kamu tidak bisa memesan layananmu sendiri.");
  }

  const quantity = Math.max(1, Math.min(99, Number(teks(formData, "quantity")) || 1));
  const catatan = teks(formData, "note");
  const kontak = teks(formData, "contactPhone") || user.phone || "";
  const jadwalRaw = teks(formData, "scheduledAt");

  if (!kontak) return gagal("Nomor WhatsApp yang bisa dihubungi wajib diisi.");

  const settings = await getSettings();
  const biaya = hitungBiaya(layanan.price, quantity, settings);

  const pesanan = await prisma.order.create({
    data: {
      code: buatKodePesanan(),
      serviceId: layanan.id,
      buyerId: user.id,
      providerId: layanan.provider.id,
      quantity,
      unitPrice: layanan.price,
      subtotal: biaya.subtotal,
      adminFee: biaya.adminFee,
      commission: biaya.commission,
      total: biaya.total,
      providerPayout: biaya.providerPayout,
      status: ORDER_STATUS.MENUNGGU_KONFIRMASI,
      note: catatan || null,
      contactPhone: kontak,
      scheduledAt: jadwalRaw ? new Date(jadwalRaw) : null,
    },
    select: { id: true, code: true },
  });

  await catatEvent({
    orderId: pesanan.id,
    status: ORDER_STATUS.MENUNGGU_KONFIRMASI,
    message: "Pesanan dibuat dan menunggu konfirmasi penyedia.",
    actor: user.name,
  });

  await beriNotifikasi({
    userId: layanan.provider.userId,
    title: "Pesanan baru masuk",
    body: `${user.name} memesan "${layanan.title}". Konfirmasi sebelum pembeli menunggu terlalu lama.`,
    link: `/mitra/pesanan/${pesanan.code}`,
  });

  redirect(`/dashboard/pesanan/${pesanan.code}?baru=1`);
}

// ── Penyedia menerima / menolak ──────────────────────────────────────────

export async function terimaPesanan(formData: FormData) {
  const user = await requireProvider();
  const code = teks(formData, "code");

  const pesanan = await prisma.order.findUnique({
    where: { code },
    select: { id: true, providerId: true, status: true, buyerId: true, service: { select: { title: true } } },
  });
  if (!pesanan || pesanan.providerId !== user.provider.id) redirect("/mitra/pesanan");
  if (pesanan.status !== ORDER_STATUS.MENUNGGU_KONFIRMASI) redirect(`/mitra/pesanan/${code}`);

  await prisma.order.update({
    where: { id: pesanan.id },
    data: { status: ORDER_STATUS.MENUNGGU_PEMBAYARAN },
  });

  await catatEvent({
    orderId: pesanan.id,
    status: ORDER_STATUS.MENUNGGU_PEMBAYARAN,
    message: "Penyedia menerima pesanan. Pembeli diminta menyelesaikan pembayaran.",
    actor: user.name,
  });

  await beriNotifikasi({
    userId: pesanan.buyerId,
    title: "Pesanan diterima penyedia",
    body: `Pesanan "${pesanan.service.title}" sudah diterima. Silakan lakukan pembayaran dan unggah buktinya.`,
    link: `/dashboard/pesanan/${code}`,
  });

  revalidatePath(`/mitra/pesanan/${code}`);
  revalidatePath("/mitra/pesanan");
}

export async function tolakPesanan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireProvider();
  const code = teks(formData, "code");
  const alasan = teks(formData, "alasan");

  if (alasan.length < 5) return gagal("Tuliskan alasan penolakan minimal 5 karakter.");

  const pesanan = await prisma.order.findUnique({
    where: { code },
    select: { id: true, providerId: true, status: true, buyerId: true, service: { select: { title: true } } },
  });
  if (!pesanan || pesanan.providerId !== user.provider.id) return gagal("Pesanan tidak ditemukan.");
  if (pesanan.status !== ORDER_STATUS.MENUNGGU_KONFIRMASI) {
    return gagal("Pesanan ini sudah tidak bisa ditolak.");
  }

  await prisma.order.update({
    where: { id: pesanan.id },
    data: { status: ORDER_STATUS.DITOLAK, rejectReason: alasan },
  });

  await catatEvent({
    orderId: pesanan.id,
    status: ORDER_STATUS.DITOLAK,
    message: `Penyedia menolak pesanan. Alasan: ${alasan}`,
    actor: user.name,
  });

  await beriNotifikasi({
    userId: pesanan.buyerId,
    title: "Pesanan ditolak penyedia",
    body: `Pesanan "${pesanan.service.title}" ditolak. Alasan: ${alasan}`,
    link: `/dashboard/pesanan/${code}`,
  });

  revalidatePath(`/mitra/pesanan/${code}`);
  return berhasil("Pesanan ditolak dan pembeli sudah diberi tahu.");
}

// ── Pembeli membatalkan ──────────────────────────────────────────────────

export async function batalkanPesanan(formData: FormData) {
  const user = await requireUser();
  const code = teks(formData, "code");

  const pesanan = await prisma.order.findUnique({
    where: { code },
    select: {
      id: true,
      buyerId: true,
      status: true,
      service: { select: { title: true } },
      provider: { select: { userId: true } },
    },
  });
  if (!pesanan || pesanan.buyerId !== user.id) redirect("/dashboard/pesanan");

  const bolehBatal: string[] = [
    ORDER_STATUS.MENUNGGU_KONFIRMASI,
    ORDER_STATUS.MENUNGGU_PEMBAYARAN,
  ];
  if (!bolehBatal.includes(pesanan.status)) redirect(`/dashboard/pesanan/${code}`);

  await prisma.order.update({
    where: { id: pesanan.id },
    data: { status: ORDER_STATUS.DIBATALKAN },
  });

  await catatEvent({
    orderId: pesanan.id,
    status: ORDER_STATUS.DIBATALKAN,
    message: "Pesanan dibatalkan oleh pembeli.",
    actor: user.name,
  });

  await beriNotifikasi({
    userId: pesanan.provider.userId,
    title: "Pesanan dibatalkan",
    body: `Pesanan "${pesanan.service.title}" dibatalkan oleh pembeli.`,
    link: `/mitra/pesanan/${code}`,
  });

  revalidatePath(`/dashboard/pesanan/${code}`);
  revalidatePath("/dashboard/pesanan");
}

// ── Pembeli mengunggah bukti bayar ───────────────────────────────────────

export async function unggahBuktiBayar(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const code = teks(formData, "code");

  const pesanan = await prisma.order.findUnique({
    where: { code },
    select: {
      id: true,
      buyerId: true,
      status: true,
      total: true,
      service: { select: { title: true } },
      provider: { select: { userId: true } },
      payment: { select: { proofUrl: true } },
    },
  });
  if (!pesanan || pesanan.buyerId !== user.id) return gagal("Pesanan tidak ditemukan.");
  if (pesanan.status !== ORDER_STATUS.MENUNGGU_PEMBAYARAN) {
    return gagal("Pesanan ini sedang tidak menunggu pembayaran.");
  }

  const senderName = teks(formData, "senderName");
  const senderBank = teks(formData, "senderBank");
  if (!senderName) return gagal("Nama pemilik rekening pengirim wajib diisi.");
  if (!senderBank) return gagal("Nama bank pengirim wajib diisi.");

  // Bukti transfer memuat nama dan nomor rekening: masuk bucket privat,
  // hanya terbuka lewat signed URL bagi pembeli sendiri dan admin.
  let proofUrl: string | null = null;
  try {
    proofUrl = await simpanBerkasPrivat(berkas(formData, "proof"), "bukti");
  } catch (e) {
    return gagal(e instanceof Error ? e.message : "Gagal mengunggah bukti transfer.");
  }
  if (!proofUrl) return gagal("Bukti transfer wajib diunggah (JPG/PNG, maksimal 8 MB).");

  // Unggahan ulang setelah bukti ditolak: buang berkas lama agar tidak
  // menumpuk di kuota penyimpanan.
  if (pesanan.payment?.proofUrl && pesanan.payment.proofUrl !== proofUrl) {
    await hapusBerkasPrivat(pesanan.payment.proofUrl);
  }

  await prisma.payment.upsert({
    where: { orderId: pesanan.id },
    create: {
      orderId: pesanan.id,
      amount: pesanan.total,
      senderName,
      senderBank,
      proofUrl,
      status: "MENUNGGU",
    },
    update: {
      senderName,
      senderBank,
      proofUrl,
      status: "MENUNGGU",
      note: null,
      verifiedAt: null,
      verifiedById: null,
    },
  });

  await prisma.order.update({
    where: { id: pesanan.id },
    data: { status: ORDER_STATUS.MENUNGGU_VERIFIKASI },
  });

  await catatEvent({
    orderId: pesanan.id,
    status: ORDER_STATUS.MENUNGGU_VERIFIKASI,
    message: "Pembeli mengunggah bukti transfer. Menunggu verifikasi admin.",
    actor: user.name,
  });

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (admin) {
    await beriNotifikasi({
      userId: admin.id,
      title: "Bukti pembayaran baru",
      body: `Pesanan ${code} menunggu verifikasi pembayaran.`,
      link: "/admin/pembayaran",
    });
  }

  revalidatePath(`/dashboard/pesanan/${code}`);
  return berhasil("Bukti transfer terkirim. Admin akan memverifikasi dalam 1×24 jam.");
}

// ── Admin memverifikasi pembayaran ───────────────────────────────────────

export async function verifikasiPembayaran(formData: FormData) {
  const admin = await requireAdmin();
  const code = teks(formData, "code");
  const keputusan = teks(formData, "keputusan"); // "terima" | "tolak"
  const catatan = teks(formData, "catatan");

  const pesanan = await prisma.order.findUnique({
    where: { code },
    select: {
      id: true,
      status: true,
      buyerId: true,
      payment: { select: { id: true } },
      service: { select: { title: true } },
      provider: { select: { userId: true } },
    },
  });
  if (!pesanan?.payment) redirect("/admin/pembayaran");
  if (pesanan.status !== ORDER_STATUS.MENUNGGU_VERIFIKASI) redirect("/admin/pembayaran");

  const diterima = keputusan === "terima";

  await prisma.payment.update({
    where: { id: pesanan.payment.id },
    data: {
      status: diterima ? "TERVERIFIKASI" : "DITOLAK",
      note: catatan || null,
      verifiedById: admin.id,
      verifiedAt: new Date(),
    },
  });

  await prisma.order.update({
    where: { id: pesanan.id },
    data: {
      status: diterima ? ORDER_STATUS.DIKERJAKAN : ORDER_STATUS.MENUNGGU_PEMBAYARAN,
    },
  });

  await catatEvent({
    orderId: pesanan.id,
    status: diterima ? ORDER_STATUS.DIKERJAKAN : ORDER_STATUS.MENUNGGU_PEMBAYARAN,
    message: diterima
      ? "Pembayaran terverifikasi admin. Pesanan mulai dikerjakan."
      : `Bukti pembayaran ditolak admin. ${catatan}`,
    actor: `Admin ${admin.name}`,
  });

  await beriNotifikasi({
    userId: pesanan.buyerId,
    title: diterima ? "Pembayaran terverifikasi" : "Bukti pembayaran ditolak",
    body: diterima
      ? `Pembayaran untuk "${pesanan.service.title}" sudah terverifikasi. Penyedia mulai mengerjakan pesananmu.`
      : `Bukti pembayaranmu ditolak. ${catatan || "Silakan unggah ulang bukti yang benar."}`,
    link: `/dashboard/pesanan/${code}`,
  });

  if (diterima) {
    await beriNotifikasi({
      userId: pesanan.provider.userId,
      title: "Pembayaran masuk — silakan mulai kerjakan",
      body: `Pembayaran untuk "${pesanan.service.title}" sudah terverifikasi.`,
      link: `/mitra/pesanan/${code}`,
    });
  }

  revalidatePath("/admin/pembayaran");
  revalidatePath(`/admin/transaksi`);
}

// ── Penyedia menandai pesanan selesai ────────────────────────────────────

export async function selesaikanPesanan(formData: FormData) {
  const user = await requireProvider();
  const code = teks(formData, "code");

  const pesanan = await prisma.order.findUnique({
    where: { code },
    select: {
      id: true,
      providerId: true,
      status: true,
      buyerId: true,
      serviceId: true,
      service: { select: { title: true } },
    },
  });
  if (!pesanan || pesanan.providerId !== user.provider.id) redirect("/mitra/pesanan");
  if (pesanan.status !== ORDER_STATUS.DIKERJAKAN) redirect(`/mitra/pesanan/${code}`);

  await prisma.order.update({
    where: { id: pesanan.id },
    data: { status: ORDER_STATUS.SELESAI, completedAt: new Date() },
  });

  await prisma.$transaction([
    prisma.service.update({
      where: { id: pesanan.serviceId },
      data: { orderCount: { increment: 1 } },
    }),
    prisma.provider.update({
      where: { id: pesanan.providerId },
      data: { completedOrders: { increment: 1 } },
    }),
  ]);

  await catatEvent({
    orderId: pesanan.id,
    status: ORDER_STATUS.SELESAI,
    message: "Penyedia menandai pesanan selesai.",
    actor: user.name,
  });

  await beriNotifikasi({
    userId: pesanan.buyerId,
    title: "Pesanan selesai",
    body: `"${pesanan.service.title}" sudah ditandai selesai. Beri rating dan review untuk membantu mahasiswa lain.`,
    link: `/dashboard/pesanan/${code}`,
  });

  revalidatePath(`/mitra/pesanan/${code}`);
  revalidatePath("/mitra");
}
