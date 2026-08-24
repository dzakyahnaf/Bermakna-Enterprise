import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { hapusGambarLayanan } from "@/actions/provider";
import { requireVerifiedProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard-shell";
import { ServiceForm } from "@/components/service-form";
import { SubmitButton } from "@/components/action-form";
import { Icon } from "@/components/ui";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit Layanan" };

export default async function EditLayanan({ params }: Params) {
  const { id } = await params;
  const user = await requireVerifiedProvider();

  const [layanan, kategori] = await Promise.all([
    prisma.service.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, icon: true },
    }),
  ]);

  if (!layanan || layanan.providerId !== user.provider.id) notFound();

  return (
    <>
      <Link href="/mitra/layanan" className="btn-ghost btn-sm mb-4 -ml-3">
        <Icon name="arrowLeft" size={15} />
        Kembali ke layanan saya
      </Link>

      <PageHeader
        title="Edit Layanan"
        description={layanan.title}
        action={
          <Link href={`/layanan/${layanan.slug}`} className="btn-secondary btn-sm">
            <Icon name="eye" size={14} />
            Lihat halaman publik
          </Link>
        }
      />

      {layanan.images.length > 0 && (
        <section className="card-pad mb-6">
          <h2 className="text-lg font-bold">Galeri saat ini</h2>
          <p className="mt-1 text-sm text-tinta-600">
            Hapus foto yang sudah tidak relevan, lalu unggah penggantinya lewat formulir di bawah.
          </p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {layanan.images.map((img) => (
              <li key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="size-24 rounded-xl border border-krem-300 object-cover"
                />
                <form action={hapusGambarLayanan} className="absolute -top-2 -right-2">
                  <input type="hidden" name="imageId" value={img.id} />
                  <SubmitButton
                    className="flex size-7 items-center justify-center rounded-full border border-merah-500/25 bg-white text-merah-900 shadow-sm hover:bg-merah-500/10"
                    confirm="Hapus foto ini dari galeri?"
                    pendingLabel=""
                  >
                    <Icon name="x" size={14} />
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ServiceForm
        kategori={kategori}
        awal={{
          id: layanan.id,
          title: layanan.title,
          description: layanan.description,
          categoryId: layanan.categoryId,
          price: layanan.price,
          priceUnit: layanan.priceUnit,
          campus: layanan.campus,
          location: layanan.location,
          deliveryDays: layanan.deliveryDays,
          coverUrl: layanan.coverUrl,
        }}
      />
    </>
  );
}
