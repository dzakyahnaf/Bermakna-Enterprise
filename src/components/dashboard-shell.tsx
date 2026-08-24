import type { ReactNode } from "react";

import { DashboardNav, type ItemNav } from "@/components/dashboard-nav";
import { SiteHeader } from "@/components/site-header";
import { Avatar, Badge } from "@/components/ui";
import type { BadgeTone } from "@/lib/constants";

/** Kerangka dasbor: header situs + sidebar navigasi + area konten. */
export async function DashboardShell({
  items,
  user,
  peran,
  peranTone = "neutral",
  children,
}: {
  items: ItemNav[];
  user: { name: string; email: string; avatarUrl: string | null };
  peran: string;
  peranTone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <div className="wrap w-full flex-1 py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
          {/* min-w-0 wajib: tanpa ini, nav yang menggeser ke samping pada layar
              sempit justru melebarkan grid dan membuat seluruh halaman meluber. */}
          <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            <div className="card mb-3 hidden items-center gap-3 p-4 lg:flex">
              <Avatar name={user.name} url={user.avatarUrl} size={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-tinta-900">{user.name}</p>
                <Badge tone={peranTone}>{peran}</Badge>
              </div>
            </div>
            <DashboardNav items={items} />
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

/** Judul halaman di dalam dasbor. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="judul text-2xl sm:text-[28px]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tinta-600">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
