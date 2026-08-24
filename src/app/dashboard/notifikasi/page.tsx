import type { Metadata } from "next";
import Link from "next/link";

import { tandaiSemuaDibaca } from "@/actions/notification";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { waktuRelatif } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/action-form";
import { EmptyState, Icon } from "@/components/ui";

export const metadata: Metadata = { title: "Notifikasi" };

export default async function Notifikasi() {
  const user = await requireUser();

  const notifikasi = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const belumDibaca = notifikasi.filter((n) => !n.isRead).length;

  return (
    <>
      <PageHeader
        title="Notifikasi"
        description="Pemberitahuan perubahan status pesanan, pembayaran, dan verifikasi."
        action={
          belumDibaca > 0 ? (
            <form action={tandaiSemuaDibaca}>
              <SubmitButton className="btn-secondary btn-sm" pendingLabel="Menandai…">
                <Icon name="check" size={14} />
                Tandai semua dibaca
              </SubmitButton>
            </form>
          ) : undefined
        }
      />

      {notifikasi.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="Belum ada notifikasi"
          description="Pemberitahuan akan muncul di sini saat ada perkembangan pada pesananmu."
        />
      ) : (
        <ul className="space-y-2.5">
          {notifikasi.map((n) => {
            const isi = (
              <>
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    n.isRead ? "bg-krem-300" : "bg-merah-500"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm ${n.isRead ? "font-semibold text-tinta-800" : "font-bold text-tinta-900"}`}
                  >
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-tinta-600">{n.body}</p>
                  <p className="mt-1 text-xs text-tinta-500">{waktuRelatif(n.createdAt)}</p>
                </div>
                {n.link && (
                  <span className="mt-1 shrink-0 text-tinta-500">
                    <Icon name="arrowRight" size={16} />
                  </span>
                )}
              </>
            );

            return (
              <li key={n.id}>
                {n.link ? (
                  <Link
                    href={n.link}
                    className={`card flex items-start gap-3 p-4 transition-colors hover:border-oranye-500/50 ${
                      n.isRead ? "" : "bg-krem-50"
                    }`}
                  >
                    {isi}
                  </Link>
                ) : (
                  <div className={`card flex items-start gap-3 p-4 ${n.isRead ? "" : "bg-krem-50"}`}>
                    {isi}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
