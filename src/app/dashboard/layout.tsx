import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_ORDER_STATUSES } from "@/lib/constants";
import { DashboardShell } from "@/components/dashboard-shell";
import type { ItemNav } from "@/components/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");

  const [pesananAktif, belumDibaca] = await Promise.all([
    prisma.order.count({
      where: { buyerId: user.id, status: { in: ACTIVE_ORDER_STATUSES } },
    }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  const items: ItemNav[] = [
    { href: "/dashboard", label: "Ringkasan", icon: "grid", exact: true },
    { href: "/dashboard/pesanan", label: "Pesanan Saya", icon: "cart", badge: pesananAktif },
    { href: "/dashboard/review", label: "Review Saya", icon: "star" },
    { href: "/dashboard/notifikasi", label: "Notifikasi", icon: "bell", badge: belumDibaca },
    { href: "/dashboard/profil", label: "Profil & Akun", icon: "user" },
    ...(user.provider
      ? [{ href: "/mitra", label: "Dashboard Penyedia", icon: "briefcase" as const }]
      : [{ href: "/jadi-penyedia", label: "Jadi Penyedia", icon: "briefcase" as const }]),
  ];

  return (
    <DashboardShell items={items} user={user} peran="Pengguna jasa" peranTone="info">
      {children}
    </DashboardShell>
  );
}
