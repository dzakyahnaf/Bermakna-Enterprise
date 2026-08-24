import type { Metadata } from "next";
import Link from "next/link";

import { ubahStatusAkun } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { campusLabel } from "@/lib/constants";
import { rupiah, tanggal } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/action-form";
import { Avatar, Badge, EmptyState, Icon, StatCard } from "@/components/ui";

export const metadata: Metadata = { title: "Kelola Pengguna" };

export default async function KelolaPengguna({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; peran?: string }>;
}) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const peran = sp.peran ?? "";

  const [pengguna, totalPengguna, totalPenyedia, nonaktif, belanja] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
          : {}),
        ...(peran ? { role: peran } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        provider: { select: { id: true, status: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "PROVIDER" } }),
    prisma.user.count({ where: { isActive: false } }),
    // Digabung ke Promise.all agar tidak menambah satu perjalanan ke database.
    prisma.order.groupBy({
      by: ["buyerId"],
      where: { status: { in: ["DIKERJAKAN", "SELESAI"] } },
      _sum: { total: true },
    }),
  ]);

  const petaBelanja = new Map(belanja.map((b) => [b.buyerId, b._sum.total ?? 0]));

  const PERAN = [
    { value: "", label: "Semua" },
    { value: "USER", label: "Pengguna jasa" },
    { value: "PROVIDER", label: "Penyedia" },
    { value: "ADMIN", label: "Admin" },
  ];

  return (
    <>
      <PageHeader
        title="Kelola Pengguna"
        description="Seluruh akun terdaftar di platform. Nonaktifkan akun yang melanggar ketentuan."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pengguna jasa" value={totalPengguna} sub="peran pembeli" />
        <StatCard label="Penyedia jasa" value={totalPenyedia} sub="peran penjual" />
        <StatCard label="Akun nonaktif" value={nonaktif} sub="tidak bisa masuk" />
      </div>

      <form method="get" className="card mt-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-52 flex-1">
          <label className="label" htmlFor="q">
            Cari pengguna
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Nama atau email" className="input" />
        </div>
        <div className="min-w-40">
          <label className="label" htmlFor="peran">
            Peran
          </label>
          <select id="peran" name="peran" defaultValue={peran} className="select">
            {PERAN.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          <Icon name="search" size={16} />
          Cari
        </button>
        {(q || peran) && (
          <Link href="/admin/pengguna" className="btn-secondary">
            Reset
          </Link>
        )}
      </form>

      <div className="mt-6">
        {pengguna.length === 0 ? (
          <EmptyState icon="👥" title="Tidak ada pengguna yang cocok" />
        ) : (
          <div className="card tabel-scroll">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Peran</th>
                  <th>Kampus</th>
                  <th className="text-right">Pesanan</th>
                  <th className="text-right">Total belanja</th>
                  <th>Bergabung</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pengguna.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} url={u.avatarUrl} size={32} />
                        <div className="min-w-0">
                          <span className="block font-semibold whitespace-nowrap">{u.name}</span>
                          <span className="text-xs text-tinta-500">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.role === "ADMIN" ? (
                        <Badge tone="danger">Admin</Badge>
                      ) : u.provider ? (
                        <Link href={`/penyedia/${u.provider.id}`}>
                          <Badge tone={u.provider.status === "VERIFIED" ? "success" : "warning"}>
                            Penyedia
                          </Badge>
                        </Link>
                      ) : (
                        <Badge tone="info">Pengguna</Badge>
                      )}
                    </td>
                    <td className="text-xs whitespace-nowrap">{campusLabel(u.campus)}</td>
                    <td className="text-right tabular-nums">{u._count.orders}</td>
                    <td className="text-right tabular-nums">
                      {rupiah(petaBelanja.get(u.id) ?? 0)}
                    </td>
                    <td className="text-xs whitespace-nowrap">{tanggal(u.createdAt)}</td>
                    <td>
                      <Badge tone={u.isActive ? "success" : "neutral"}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="text-right">
                      {u.role !== "ADMIN" && u.id !== admin.id && (
                        <form action={ubahStatusAkun} className="inline-flex">
                          <input type="hidden" name="userId" value={u.id} />
                          <SubmitButton
                            className={u.isActive ? "btn-danger btn-sm" : "btn-success btn-sm"}
                            confirm={
                              u.isActive
                                ? "Nonaktifkan akun ini? Pengguna tidak akan bisa masuk."
                                : "Aktifkan kembali akun ini?"
                            }
                            pendingLabel="…"
                          >
                            {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </SubmitButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
