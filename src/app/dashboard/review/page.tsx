import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/constants";
import { tanggal } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { EmptyState, Icon, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Review Saya" };

export default async function ReviewSaya() {
  const user = await requireUser();

  const [belum, sudah] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: user.id, status: ORDER_STATUS.SELESAI, review: null },
      orderBy: { completedAt: "desc" },
      select: {
        code: true,
        completedAt: true,
        service: { select: { title: true, category: { select: { icon: true } } } },
        provider: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.review.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        service: { select: { title: true, slug: true, category: { select: { icon: true } } } },
        provider: { select: { user: { select: { name: true } } } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Review Saya"
        description="Ulasan hanya bisa ditulis untuk pesanan yang sudah selesai — menjaga kredibilitas rating di platform."
      />

      {belum.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">
            Menunggu review{" "}
            <span className="badge badge-warning ml-1">{belum.length}</span>
          </h2>
          <div className="space-y-3">
            {belum.map((o) => (
              <Link
                key={o.code}
                href={`/dashboard/pesanan/${o.code}`}
                className="card flex flex-wrap items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-oranye-500/50"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-krem-200 text-xl">
                  <span aria-hidden>{o.service.category.icon}</span>
                </span>
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-bold text-tinta-900">{o.service.title}</p>
                  <p className="mt-0.5 text-xs text-tinta-600">
                    oleh {o.provider.user.name} · selesai{" "}
                    {o.completedAt ? tanggal(o.completedAt) : "-"}
                  </p>
                </div>
                <span className="btn-primary btn-sm">
                  <Icon name="star" size={14} />
                  Tulis review
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">Review yang sudah ditulis</h2>
        {sudah.length === 0 ? (
          <EmptyState
            icon="⭐"
            title="Belum ada review"
            description="Setelah pesananmu selesai, kamu bisa memberi rating dan ulasan di sini."
            action={{ href: "/dashboard/pesanan", label: "Lihat pesanan saya" }}
          />
        ) : (
          <ul className="space-y-3">
            {sudah.map((r) => (
              <li key={r.id} className="card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/layanan/${r.service.slug}`}
                      className="text-sm font-bold text-tinta-900 hover:text-merah-500"
                    >
                      {r.service.category.icon} {r.service.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-tinta-600">
                      oleh {r.provider.user.name} · {tanggal(r.createdAt)}
                    </p>
                  </div>
                  <Stars value={r.rating} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-tinta-700">{r.comment}</p>
                {r.reply && (
                  <div className="mt-3 rounded-xl border-l-2 border-oranye-500 bg-krem-50 px-3.5 py-2.5">
                    <p className="text-xs font-bold text-tinta-800">
                      Balasan {r.provider.user.name}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-tinta-700">{r.reply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
