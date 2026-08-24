import { prisma } from "@/lib/prisma";

/** Menambahkan notifikasi in-app untuk satu pengguna. */
export async function beriNotifikasi(input: {
  userId: string;
  title: string;
  body: string;
  link?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  });
}

/** Mencatat perubahan status pesanan ke linimasa (jejak audit). */
export async function catatEvent(input: {
  orderId: string;
  status: string;
  message: string;
  actor: string;
}) {
  await prisma.orderEvent.create({ data: input });
}
