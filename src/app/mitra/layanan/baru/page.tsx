import type { Metadata } from "next";
import Link from "next/link";

import { requireVerifiedProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard-shell";
import { ServiceForm } from "@/components/service-form";
import { Icon } from "@/components/ui";

export const metadata: Metadata = { title: "Tambah Layanan" };

export default async function TambahLayanan() {
  await requireVerifiedProvider();

  const kategori = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true, icon: true },
  });

  return (
    <>
      <Link href="/mitra/layanan" className="btn-ghost btn-sm mb-4 -ml-3">
        <Icon name="arrowLeft" size={15} />
        Kembali ke layanan saya
      </Link>

      <PageHeader
        title="Tambah Layanan Baru"
        description="Jelaskan jasamu sedetail mungkin. Semakin jelas, semakin sedikit pertanyaan bolak-balik dengan pembeli."
      />

      <ServiceForm kategori={kategori} />
    </>
  );
}
