"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/ui";

export type ItemNav = {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  /** Cocokkan persis (untuk tautan indeks seperti /mitra). */
  exact?: boolean;
};

export function DashboardNav({ items }: { items: ItemNav[] }) {
  const pathname = usePathname();

  const aktif = (item: ItemNav) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={aktif(item) ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors lg:shrink ${
            aktif(item)
              ? "pita-gradien text-white shadow-[0_6px_16px_-10px_rgba(217,55,15,0.9)]"
              : "text-tinta-700 hover:bg-krem-200/70 hover:text-tinta-900"
          }`}
        >
          <Icon name={item.icon} size={17} />
          <span className="whitespace-nowrap">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span
              className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                aktif(item) ? "bg-white/25 text-white" : "bg-merah-500 text-white"
              }`}
            >
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
