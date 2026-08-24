import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ubahStatusLayanan } from "@/actions/provider";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SERVICE_STATUS_META, campusLabel, priceUnitShort } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/action-form";
import { Badge, EmptyState, Icon, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Layanan Saya" };

export default async function LayananSaya() {
  const user = await requireProvider();
  if (user.provider.status !== "VERIFIED") redirect("/mitra/status");

  const layanan = await prisma.service.findMany({
    where: { providerId: user.provider.id },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true, icon: true } },
      _count: { select: { orders: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Layanan Saya"
        description="Kelola katalog jasamu — tayangkan, jeda, atau perbarui kapan saja."
        action={
          <Link href="/mitra/layanan/baru" className="btn-primary">
            <Icon name="plus" size={16} />
            Tambah Layanan
          </Link>
        }
      />

      {layanan.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Belum ada layanan"
          description="Tambahkan layanan pertamamu agar bisa ditemukan lebih dari 20.000 mahasiswa ITB."
          action={{ href: "/mitra/layanan/baru", label: "Tambah layanan pertama" }}
        />
      ) : (
        <div className="space-y-3">
          {layanan.map((s) => {
            const meta = SERVICE_STATUS_META[s.status];
            return (
              <div key={s.id} className="card p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-krem-200 text-2xl">
                    {s.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.coverUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span aria-hidden>{s.category.icon}</span>
                    )}
                  </span>

                  <div className="min-w-48 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/layanan/${s.slug}`}
                        className="text-sm font-bold text-tinta-900 hover:text-merah-500"
                      >
                        {s.title}
                      </Link>
                      <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-tinta-600">
                      {s.category.name} · {campusLabel(s.campus)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tinta-600">
                      <span className="font-bold text-tinta-900">
                        {rupiah(s.price)}
                        {priceUnitShort(s.priceUnit)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="eye" size={13} />
                        {s.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="cart" size={13} />
                        {s._count.orders}
                      </span>
                      <Stars value={s.ratingAvg} count={s.ratingCount} />
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link href={`/mitra/layanan/${s.id}`} className="btn-secondary btn-sm">
                      Edit
                    </Link>
                    {s.status !== "TAKEDOWN" && (
                      <form action={ubahStatusLayanan}>
                        <input type="hidden" name="id" value={s.id} />
                        <SubmitButton
                          className={s.status === "ACTIVE" ? "btn-ghost btn-sm" : "btn-success btn-sm"}
                          pendingLabel="…"
                        >
                          {s.status === "ACTIVE" ? "Jeda" : "Tayangkan"}
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </div>

                {s.status === "TAKEDOWN" && (
                  <p className="mt-3 rounded-lg bg-merah-500/8 px-3 py-2 text-xs text-merah-900">
                    Layanan ini diturunkan admin. Hubungi pengurus Bermakna Enterprise untuk
                    peninjauan ulang.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
