"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Menandai seluruh notifikasi milik pengguna sebagai sudah dibaca. */
export async function tandaiSemuaDibaca() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/dashboard/notifikasi");
  revalidatePath("/", "layout");
}
