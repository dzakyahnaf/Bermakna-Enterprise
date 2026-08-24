"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProvider, requireUser, requireVerifiedProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { simpanBanyakGambar, simpanBerkasPrivat, simpanGambar } from "@/lib/upload";
import { beriNotifikasi } from "@/lib/notify";
import { slugify } from "@/lib/format";
import { berhasil, angkaDari, berkas, gagal, teks, type ActionState } from "@/lib/action-state";

// ── Mendaftar sebagai penyedia jasa ──────────────────────────────────────

export async function daftarPenyedia(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const sudahAda = await prisma.provider.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (sudahAda) redirect("/mitra");

  const headline = teks(formData, "headline");
  const about = teks(formData, "about");
  const nim = teks(formData, "nim");
  const studyProgram = teks(formData, "studyProgram");

  if (headline.length < 10) return gagal("Judul keahlian minimal 10 karakter.");
  if (about.length < 40) {
    return gagal("Ceritakan dirimu minimal 40 karakter agar pembeli lebih percaya.");
  }
  if (!/^\d{5,12}$/.test(nim)) return gagal("NIM harus berupa 5–12 digit angka.");
  if (!studyProgram) return gagal("Program studi wajib diisi.");

  // KTM berisi data pribadi: disimpan di bucket privat, hanya bisa dibuka
  // admin lewat signed URL berbatas waktu.
  let ktmUrl: string | null = null;
  try {
    ktmUrl = await simpanBerkasPrivat(berkas(formData, "ktm"), "ktm");
  } catch (e) {
    return gagal(e instanceof Error ? e.message : "Gagal mengunggah foto KTM.");
  }
  if (!ktmUrl) return gagal("Foto KTM wajib diunggah untuk proses verifikasi.");

  await prisma.provider.create({
    data: {
      userId: user.id,
      headline,
      about,
      nim,
      studyProgram,
      ktmUrl,
      status: "PENDING",
      bankName: teks(formData, "bankName") || null,
      bankAccount: teks(formData, "bankAccount") || null,
      bankHolder: teks(formData, "bankHolder") || null,
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { role: "PROVIDER" } });

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (admin) {
    await beriNotifikasi({
      userId: admin.id,
      title: "Pendaftaran penyedia baru",
      body: `${user.name} mendaftar sebagai penyedia jasa dan menunggu verifikasi.`,
      link: "/admin/verifikasi",
    });
  }

  await beriNotifikasi({
    userId: user.id,
    title: "Pendaftaran penyedia terkirim",
    body: "Tim Bermakna Enterprise sedang memeriksa data kemahasiswaanmu. Proses ini biasanya selesai dalam 1×24 jam.",
    link: "/mitra/status",
  });

  redirect("/mitra/status");
}

// ── Memperbarui profil penyedia ──────────────────────────────────────────

export async function simpanProfilPenyedia(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireProvider();

  const headline = teks(formData, "headline");
  const about = teks(formData, "about");
  if (headline.length < 10) return gagal("Judul keahlian minimal 10 karakter.");
  if (about.length < 40) return gagal("Deskripsi diri minimal 40 karakter.");

  await prisma.provider.update({
    where: { id: user.provider.id },
    data: {
      headline,
      about,
      studyProgram: teks(formData, "studyProgram") || undefined,
      bankName: teks(formData, "bankName") || null,
      bankAccount: teks(formData, "bankAccount") || null,
      bankHolder: teks(formData, "bankHolder") || null,
    },
  });

  revalidatePath("/mitra/profil");
  return berhasil("Profil penyedia berhasil diperbarui.");
}

// ── Membuat & memperbarui layanan ────────────────────────────────────────

type DataLayanan = {
  title: string;
  description: string;
  categoryId: string;
  price: number;
  priceUnit: string;
  campus: string;
  location: string | null;
  deliveryDays: number | null;
};

type HasilFormLayanan =
  | { error: string; data?: undefined }
  | { error?: undefined; data: DataLayanan };

function bacaFormLayanan(formData: FormData): HasilFormLayanan {
  const title = teks(formData, "title");
  const description = teks(formData, "description");
  const categoryId = teks(formData, "categoryId");
  const price = angkaDari(formData, "price");
  const priceUnit = teks(formData, "priceUnit") || "PER_SESI";
  const campus = teks(formData, "campus") || "GANESHA";
  const location = teks(formData, "location");
  const deliveryDays = angkaDari(formData, "deliveryDays");

  if (title.length < 10) return { error: "Judul layanan minimal 10 karakter." };
  if (description.length < 50) {
    return { error: "Deskripsi minimal 50 karakter agar pembeli paham isi layanannya." };
  }
  if (!categoryId) return { error: "Pilih kategori layanan." };
  if (price < 1000) return { error: "Harga minimal Rp 1.000." };

  return {
    data: {
      title,
      description,
      categoryId,
      price,
      priceUnit,
      campus,
      location: location || null,
      deliveryDays: deliveryDays > 0 ? deliveryDays : null,
    },
  };
}

export async function buatLayanan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireVerifiedProvider();
  const hasil = bacaFormLayanan(formData);
  if (hasil.error !== undefined) return gagal(hasil.error);

  let coverUrl: string | null = null;
  let galeri: string[] = [];
  try {
    coverUrl = await simpanGambar(berkas(formData, "cover"), "layanan");
    galeri = await simpanBanyakGambar(
      formData.getAll("galeri").filter((f): f is File => f instanceof File && f.size > 0),
      "layanan",
    );
  } catch (e) {
    return gagal(e instanceof Error ? e.message : "Gagal mengunggah gambar.");
  }

  const layanan = await prisma.service.create({
    data: {
      ...hasil.data,
      slug: slugify(hasil.data.title),
      providerId: user.provider.id,
      coverUrl,
      status: "ACTIVE",
      images: { create: galeri.map((url, order) => ({ url, order })) },
    },
    select: { slug: true },
  });

  revalidatePath("/mitra/layanan");
  redirect(`/layanan/${layanan.slug}`);
}

export async function perbaruiLayanan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireVerifiedProvider();
  const id = teks(formData, "id");

  const milik = await prisma.service.findUnique({
    where: { id },
    select: { id: true, providerId: true, coverUrl: true, slug: true },
  });
  if (!milik || milik.providerId !== user.provider.id) return gagal("Layanan tidak ditemukan.");

  const hasil = bacaFormLayanan(formData);
  if (hasil.error !== undefined) return gagal(hasil.error);

  let coverUrl = milik.coverUrl;
  let galeri: string[] = [];
  try {
    coverUrl = (await simpanGambar(berkas(formData, "cover"), "layanan")) ?? milik.coverUrl;
    galeri = await simpanBanyakGambar(
      formData.getAll("galeri").filter((f): f is File => f instanceof File && f.size > 0),
      "layanan",
    );
  } catch (e) {
    return gagal(e instanceof Error ? e.message : "Gagal mengunggah gambar.");
  }

  await prisma.service.update({
    where: { id: milik.id },
    data: {
      ...hasil.data,
      coverUrl,
      ...(galeri.length
        ? { images: { create: galeri.map((url, order) => ({ url, order })) } }
        : {}),
    },
  });

  revalidatePath("/mitra/layanan");
  revalidatePath(`/layanan/${milik.slug}`);
  return berhasil("Layanan berhasil diperbarui.");
}

/** Menjeda atau menayangkan kembali sebuah layanan. */
export async function ubahStatusLayanan(formData: FormData) {
  const user = await requireProvider();
  const id = teks(formData, "id");

  const layanan = await prisma.service.findUnique({
    where: { id },
    select: { id: true, providerId: true, status: true },
  });
  if (!layanan || layanan.providerId !== user.provider.id) redirect("/mitra/layanan");

  // Layanan yang diturunkan admin tidak bisa ditayangkan sendiri oleh penyedia.
  if (layanan.status === "TAKEDOWN") redirect("/mitra/layanan");

  await prisma.service.update({
    where: { id: layanan.id },
    data: { status: layanan.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
  });

  revalidatePath("/mitra/layanan");
}

export async function hapusGambarLayanan(formData: FormData) {
  const user = await requireProvider();
  const imageId = teks(formData, "imageId");

  const gambar = await prisma.serviceImage.findUnique({
    where: { id: imageId },
    select: { id: true, service: { select: { providerId: true, id: true } } },
  });
  if (!gambar || gambar.service.providerId !== user.provider.id) redirect("/mitra/layanan");

  await prisma.serviceImage.delete({ where: { id: gambar.id } });
  revalidatePath(`/mitra/layanan/${gambar.service.id}`);
}

// ── Portofolio ───────────────────────────────────────────────────────────

export async function tambahPortofolio(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireProvider();

  const title = teks(formData, "title");
  if (title.length < 3) return gagal("Judul karya minimal 3 karakter.");

  let imageUrl: string | null = null;
  try {
    imageUrl = await simpanGambar(berkas(formData, "image"), "portofolio");
  } catch (e) {
    return gagal(e instanceof Error ? e.message : "Gagal mengunggah gambar karya.");
  }

  await prisma.portfolioItem.create({
    data: {
      providerId: user.provider.id,
      title,
      description: teks(formData, "description") || null,
      link: teks(formData, "link") || null,
      imageUrl: imageUrl ?? "",
    },
  });

  revalidatePath("/mitra/portofolio");
  revalidatePath(`/penyedia/${user.provider.id}`);
  return berhasil("Karya berhasil ditambahkan ke portofolio.");
}

export async function hapusPortofolio(formData: FormData) {
  const user = await requireProvider();
  const id = teks(formData, "id");

  const item = await prisma.portfolioItem.findUnique({
    where: { id },
    select: { id: true, providerId: true },
  });
  if (!item || item.providerId !== user.provider.id) redirect("/mitra/portofolio");

  await prisma.portfolioItem.delete({ where: { id: item.id } });
  revalidatePath("/mitra/portofolio");
}
