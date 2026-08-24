"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { beriNotifikasi } from "@/lib/notify";
import { SETTING_KEYS } from "@/lib/constants";
import { berhasil, angkaDari, gagal, teks, type ActionState } from "@/lib/action-state";

// ── Verifikasi penyedia ──────────────────────────────────────────────────

export async function verifikasiPenyedia(formData: FormData) {
  const admin = await requireAdmin();
  const providerId = teks(formData, "providerId");
  const keputusan = teks(formData, "keputusan"); // "setujui" | "tolak"
  const catatan = teks(formData, "catatan");

  const penyedia = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { id: true, userId: true, status: true },
  });
  if (!penyedia) return;

  const disetujui = keputusan === "setujui";

  await prisma.provider.update({
    where: { id: penyedia.id },
    data: {
      status: disetujui ? "VERIFIED" : "REJECTED",
      verifiedAt: disetujui ? new Date() : null,
      reviewNote: disetujui ? null : catatan || "Data kemahasiswaan belum dapat diverifikasi.",
    },
  });

  // Saat penyedia ditolak, seluruh layanannya ikut dijeda agar tidak tayang.
  if (!disetujui) {
    await prisma.service.updateMany({
      where: { providerId: penyedia.id, status: "ACTIVE" },
      data: { status: "PAUSED" },
    });
  }

  await beriNotifikasi({
    userId: penyedia.userId,
    title: disetujui ? "Selamat, kamu resmi jadi penyedia!" : "Pendaftaran penyedia belum disetujui",
    body: disetujui
      ? "Akun penyediamu sudah terverifikasi. Kamu bisa mulai menayangkan layanan sekarang."
      : catatan || "Silakan perbaiki datamu lalu hubungi pengurus untuk peninjauan ulang.",
    link: disetujui ? "/mitra/layanan/baru" : "/mitra/status",
  });

  void admin;
  revalidatePath("/admin/verifikasi");
  revalidatePath("/admin");
}

/** Menyalakan atau mematikan premium listing seorang penyedia. */
export async function ubahPremium(formData: FormData) {
  await requireAdmin();
  const providerId = teks(formData, "providerId");

  const penyedia = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { id: true, isPremium: true, userId: true },
  });
  if (!penyedia) return;

  const jadiPremium = !penyedia.isPremium;

  await prisma.provider.update({
    where: { id: penyedia.id },
    data: {
      isPremium: jadiPremium,
      premiumUntil: jadiPremium ? new Date(Date.now() + 90 * 864e5) : null,
    },
  });

  if (jadiPremium) {
    await beriNotifikasi({
      userId: penyedia.userId,
      title: "Premium listing aktif",
      body: "Layananmu kini tampil di urutan teratas hasil pencarian selama 90 hari.",
      link: "/mitra",
    });
  }

  revalidatePath("/admin/penyedia");
}

// ── Pengelolaan pengguna ─────────────────────────────────────────────────

export async function ubahStatusAkun(formData: FormData) {
  const admin = await requireAdmin();
  const userId = teks(formData, "userId");
  if (userId === admin.id) return; // admin tidak bisa menonaktifkan dirinya sendiri

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, role: true },
  });
  if (!target || target.role === "ADMIN") return;

  await prisma.user.update({
    where: { id: target.id },
    data: { isActive: !target.isActive },
  });

  revalidatePath("/admin/pengguna");
}

// ── Moderasi layanan ─────────────────────────────────────────────────────

export async function moderasiLayanan(formData: FormData) {
  await requireAdmin();
  const serviceId = teks(formData, "serviceId");

  const layanan = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, status: true, title: true, provider: { select: { userId: true } } },
  });
  if (!layanan) return;

  const diturunkan = layanan.status !== "TAKEDOWN";

  await prisma.service.update({
    where: { id: layanan.id },
    data: { status: diturunkan ? "TAKEDOWN" : "PAUSED" },
  });

  await beriNotifikasi({
    userId: layanan.provider.userId,
    title: diturunkan ? "Layananmu diturunkan admin" : "Layananmu dipulihkan",
    body: diturunkan
      ? `"${layanan.title}" diturunkan dari pencarian. Hubungi pengurus untuk peninjauan ulang.`
      : `"${layanan.title}" sudah bisa kamu tayangkan kembali dari dashboard penyedia.`,
    link: "/mitra/layanan",
  });

  revalidatePath("/admin/layanan");
}

// ── Pengaturan platform ──────────────────────────────────────────────────

export async function simpanPengaturan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const komisi = angkaDari(formData, "commission_percent");
  const biayaAdmin = angkaDari(formData, "admin_fee");

  if (komisi < 0 || komisi > 50) return gagal("Komisi harus antara 0% dan 50%.");
  if (biayaAdmin < 0) return gagal("Biaya administrasi tidak boleh negatif.");

  const nilai: Record<string, string> = {
    [SETTING_KEYS.COMMISSION_PERCENT]: String(komisi),
    [SETTING_KEYS.ADMIN_FEE]: String(biayaAdmin),
    [SETTING_KEYS.BANK_NAME]: teks(formData, "bank_name"),
    [SETTING_KEYS.BANK_ACCOUNT]: teks(formData, "bank_account"),
    [SETTING_KEYS.BANK_HOLDER]: teks(formData, "bank_holder"),
    [SETTING_KEYS.SUPPORT_WHATSAPP]: teks(formData, "support_whatsapp"),
    [SETTING_KEYS.INSTAGRAM]: teks(formData, "instagram_url"),
  };

  await prisma.$transaction(
    Object.entries(nilai).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );

  revalidatePath("/admin/pengaturan");
  revalidatePath("/", "layout");
  return berhasil(
    "Pengaturan tersimpan. Perubahan komisi hanya berlaku untuk pesanan baru — pesanan lama tetap memakai tarif saat dibuat.",
  );
}
