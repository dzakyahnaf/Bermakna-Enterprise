"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { simpanGambar } from "@/lib/upload";
import { berhasil, berkas, gagal, teks, type ActionState } from "@/lib/action-state";

const EMAIL_POLA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Masuk ────────────────────────────────────────────────────────────────

export async function masuk(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = teks(formData, "email").toLowerCase();
  const password = teks(formData, "password");
  const tujuan = teks(formData, "tujuan");

  if (!email || !password) return gagal("Email dan kata sandi wajib diisi.");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, role: true, isActive: true, provider: { select: { id: true } } },
  });

  // Pesan galat sengaja disamakan agar tidak membocorkan email mana yang terdaftar.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return gagal("Email atau kata sandi tidak cocok. Silakan periksa kembali.");
  }
  if (!user.isActive) {
    return gagal("Akun ini sedang dinonaktifkan. Hubungi admin Bermakna Enterprise.");
  }

  await createSession(user.id);

  if (tujuan && tujuan.startsWith("/")) redirect(tujuan);
  if (user.role === "ADMIN") redirect("/admin");
  if (user.provider) redirect("/mitra");
  redirect("/dashboard");
}

// ── Daftar ───────────────────────────────────────────────────────────────

export async function daftar(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = teks(formData, "name");
  const email = teks(formData, "email").toLowerCase();
  const password = teks(formData, "password");
  const konfirmasi = teks(formData, "konfirmasi");
  const phone = teks(formData, "phone");
  const campus = teks(formData, "campus") || "GANESHA";
  const faculty = teks(formData, "faculty");
  const batch = teks(formData, "batch");

  if (!name || name.length < 3) return gagal("Nama lengkap minimal 3 karakter.");
  if (!EMAIL_POLA.test(email)) return gagal("Format email belum benar.");
  if (password.length < 8) return gagal("Kata sandi minimal 8 karakter.");
  if (password !== konfirmasi) return gagal("Konfirmasi kata sandi belum sama.");
  if (!phone || phone.replace(/\D/g, "").length < 9) {
    return gagal("Nomor WhatsApp belum benar. Contoh: 081234567890");
  }

  const sudahAda = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (sudahAda) return gagal("Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.");

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: "USER",
      phone,
      campus,
      faculty: faculty || null,
      batch: batch || null,
    },
    select: { id: true },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Selamat datang di Bermakna Enterprise",
      body: "Akunmu sudah aktif. Mulai jelajahi layanan mahasiswa ITB, atau daftarkan jasamu sendiri sebagai penyedia.",
      link: "/jelajah",
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

// ── Keluar ───────────────────────────────────────────────────────────────

export async function keluar() {
  await destroySession();
  redirect("/");
}

// ── Perbarui profil ──────────────────────────────────────────────────────

export async function perbaruiProfil(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const name = teks(formData, "name");
  const phone = teks(formData, "phone");
  if (!name || name.length < 3) return gagal("Nama lengkap minimal 3 karakter.");
  if (!phone || phone.replace(/\D/g, "").length < 9) return gagal("Nomor WhatsApp belum benar.");

  let avatarUrl: string | undefined;
  try {
    avatarUrl = (await simpanGambar(berkas(formData, "avatar"), "avatar")) ?? undefined;
  } catch (e) {
    return gagal(e instanceof Error ? e.message : "Gagal mengunggah foto profil.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone,
      campus: teks(formData, "campus") || user.campus,
      faculty: teks(formData, "faculty") || null,
      batch: teks(formData, "batch") || null,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });

  revalidatePath("/dashboard/profil");
  revalidatePath("/", "layout");
  return berhasil("Profil berhasil diperbarui.");
}

// ── Ubah kata sandi ──────────────────────────────────────────────────────

export async function ubahKataSandi(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const sesi = await getCurrentUser();
  if (!sesi) return gagal("Sesi berakhir. Silakan masuk kembali.");

  const lama = teks(formData, "lama");
  const baru = teks(formData, "baru");
  const konfirmasi = teks(formData, "konfirmasi");

  if (baru.length < 8) return gagal("Kata sandi baru minimal 8 karakter.");
  if (baru !== konfirmasi) return gagal("Konfirmasi kata sandi baru belum sama.");

  const user = await prisma.user.findUnique({
    where: { id: sesi.id },
    select: { passwordHash: true },
  });
  if (!user || !verifyPassword(lama, user.passwordHash)) {
    return gagal("Kata sandi lama tidak cocok.");
  }

  await prisma.user.update({
    where: { id: sesi.id },
    data: { passwordHash: hashPassword(baru) },
  });

  return berhasil("Kata sandi berhasil diubah.");
}
