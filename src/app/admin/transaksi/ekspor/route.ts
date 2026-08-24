import type { Prisma } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_META } from "@/lib/constants";

/** Membungkus satu sel CSV agar aman terhadap koma, kutip, dan baris baru. */
function sel(nilai: string | number | null | undefined): string {
  const teks = String(nilai ?? "");
  return `"${teks.replace(/"/g, '""')}"`;
}

/**
 * Mengunduh Database Transaksi sebagai CSV.
 * Filter pencarian dan status ikut diterapkan, sesuai tampilan tabel.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return new Response("Akses ditolak.", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status") ?? "";

  const where: Prisma.OrderWhereInput = {
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { service: { title: { contains: q, mode: "insensitive" } } },
            { buyer: { name: { contains: q, mode: "insensitive" } } },
            { buyer: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(status && status in ORDER_STATUS_META ? { status } : {}),
  };

  const transaksi = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true, phone: true, campus: true } },
      provider: { select: { user: { select: { name: true, email: true } } } },
      service: { select: { title: true, category: { select: { name: true } } } },
      payment: { select: { status: true, senderName: true, senderBank: true, verifiedAt: true } },
    },
  });

  const judul = [
    "Kode Pesanan",
    "Tanggal Dibuat",
    "Tanggal Selesai",
    "Status",
    "Layanan",
    "Kategori",
    "Pembeli",
    "Email Pembeli",
    "WhatsApp Pembeli",
    "Kampus Pembeli",
    "Penyedia",
    "Email Penyedia",
    "Jumlah",
    "Harga Satuan",
    "Subtotal",
    "Biaya Administrasi",
    "Komisi Platform",
    "Total Dibayar",
    "Diterima Penyedia",
    "Pendapatan Platform",
    "Status Pembayaran",
    "Pengirim",
    "Bank Pengirim",
    "Tanggal Verifikasi",
  ];

  const baris = transaksi.map((o) =>
    [
      o.code,
      o.createdAt.toISOString(),
      o.completedAt?.toISOString() ?? "",
      ORDER_STATUS_META[o.status]?.label ?? o.status,
      o.service.title,
      o.service.category.name,
      o.buyer.name,
      o.buyer.email,
      o.buyer.phone ?? "",
      o.buyer.campus,
      o.provider.user.name,
      o.provider.user.email,
      o.quantity,
      o.unitPrice,
      o.subtotal,
      o.adminFee,
      o.commission,
      o.total,
      o.providerPayout,
      o.adminFee + o.commission,
      o.payment?.status ?? "BELUM ADA",
      o.payment?.senderName ?? "",
      o.payment?.senderBank ?? "",
      o.payment?.verifiedAt?.toISOString() ?? "",
    ]
      .map(sel)
      .join(","),
  );

  // BOM UTF-8 agar Excel membaca karakter Indonesia dengan benar.
  const csv = `﻿${[judul.map(sel).join(","), ...baris].join("\r\n")}`;
  const namaBerkas = `transaksi-bermakna-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${namaBerkas}"`,
    },
  });
}
