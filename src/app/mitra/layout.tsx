import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS, PROVIDER_STATUS_META } from "@/lib/constants";
import { DashboardShell } from "@/components/dashboard-shell";
import type { ItemNav } from "@/components/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function LayoutMitra({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.provider) redirect("/jadi-penyedia");

  const perluKonfirmasi = await prisma.order.count({
    where: {
      providerId: user.provider.id,
      status: { in: [ORDER_STATUS.MENUNGGU_KONFIRMASI, ORDER_STATUS.DIKERJAKAN] },
    },
  });

  const terverifikasi = user.provider.status === "VERIFIED";

  const items: ItemNav[] = terverifikasi
    ? [
        { href: "/mitra", label: "Ringkasan", icon: "grid", exact: true },
        { href: "/mitra/pesanan", label: "Pesanan Masuk", icon: "cart", badge: perluKonfirmasi },
        { href: "/mitra/layanan", label: "Layanan Saya", icon: "briefcase" },
        { href: "/mitra/portofolio", label: "Portofolio", icon: "image" },
        { href: "/mitra/review", label: "Review", icon: "star" },
        { href: "/mitra/profil", label: "Profil Penyedia", icon: "user" },
        { href: "/dashboard", label: "Mode Pembeli", icon: "users" },
      ]
    : [
        { href: "/mitra/status", label: "Status Verifikasi", icon: "shield" },
        { href: "/mitra/profil", label: "Profil Penyedia", icon: "user" },
        { href: "/dashboard", label: "Mode Pembeli", icon: "users" },
      ];

  const meta = PROVIDER_STATUS_META[user.provider.status];

  return (
    <DashboardShell
      items={items}
      user={user}
      peran={terverifikasi ? "Penyedia jasa" : (meta?.label ?? "Penyedia")}
      peranTone={meta?.tone ?? "neutral"}
    >
      {children}
    </DashboardShell>
  );
}
