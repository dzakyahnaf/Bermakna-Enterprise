import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/constants";
import { DashboardShell } from "@/components/dashboard-shell";
import type { ItemNav } from "@/components/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  const [menungguVerifikasi, menungguBayar] = await Promise.all([
    prisma.provider.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: ORDER_STATUS.MENUNGGU_VERIFIKASI } }),
  ]);

  const items: ItemNav[] = [
    { href: "/admin", label: "Ringkasan", icon: "grid", exact: true },
    {
      href: "/admin/verifikasi",
      label: "Verifikasi Penyedia",
      icon: "shield",
      badge: menungguVerifikasi,
    },
    { href: "/admin/pembayaran", label: "Verifikasi Bayar", icon: "wallet", badge: menungguBayar },
    { href: "/admin/transaksi", label: "Database Transaksi", icon: "receipt" },
    { href: "/admin/penyedia", label: "Penyedia", icon: "briefcase" },
    { href: "/admin/layanan", label: "Layanan", icon: "image" },
    { href: "/admin/pengguna", label: "Pengguna", icon: "users" },
    { href: "/admin/pengaturan", label: "Pengaturan", icon: "settings" },
  ];

  return (
    <DashboardShell items={items} user={user} peran="Administrator" peranTone="danger">
      {children}
    </DashboardShell>
  );
}
