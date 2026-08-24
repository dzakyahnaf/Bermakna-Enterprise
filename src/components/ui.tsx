import Link from "next/link";
import type { ReactNode } from "react";

import type { BadgeTone } from "@/lib/constants";
import { inisial } from "@/lib/format";

// ── Lencana status ───────────────────────────────────────────────────────

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

// ── Kotak pesan ──────────────────────────────────────────────────────────

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: BadgeTone;
  title?: string;
  children: ReactNode;
}) {
  const gaya: Record<BadgeTone, string> = {
    neutral: "border-krem-300 bg-krem-50 text-tinta-800",
    info: "border-biru-500/25 bg-biru-100/60 text-biru-500",
    warning: "border-kuning-400/50 bg-kuning-100/25 text-tinta-800",
    success: "border-hijau-600/25 bg-hijau-100 text-hijau-600",
    danger: "border-merah-500/25 bg-merah-500/8 text-merah-900",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${gaya[tone]}`}>
      {title && <p className="mb-0.5 font-semibold">{title}</p>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

// ── Kartu statistik dasbor ───────────────────────────────────────────────

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`card-pad ${accent ? "pita-gradien border-0 text-white" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p
          className={`text-xs font-semibold tracking-wide uppercase ${
            accent ? "text-white/80" : "text-tinta-600"
          }`}
        >
          {label}
        </p>
        {icon && <span className={accent ? "text-white/90" : "text-oranye-500"}>{icon}</span>}
      </div>
      {/* Angka panjang seperti "Rp 1.931.000" harus tetap muat di kolom sempit. */}
      <p
        className={`mt-2 text-2xl font-bold break-words tabular-nums ${
          accent ? "text-white" : "text-tinta-900"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className={`mt-1 text-xs ${accent ? "text-white/80" : "text-tinta-600"}`}>{sub}</p>
      )}
    </div>
  );
}

/** Kartu statistik dengan bilah kemajuan menuju target tahun pertama. */
export function TargetCard({
  label,
  value,
  target,
  satuan,
}: {
  label: string;
  value: number;
  target: number;
  satuan: string;
}) {
  const persen = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="card-pad">
      <p className="text-xs font-semibold tracking-wide text-tinta-600 uppercase">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-tinta-900 sm:text-3xl">{value}</span>
        <span className="text-sm text-tinta-600">
          / {target} {satuan}
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-krem-200">
        <div className="pita-gradien h-full rounded-full transition-all" style={{ width: `${persen}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-tinta-600">{persen}% dari target tahun pertama</p>
    </div>
  );
}

// ── Keadaan kosong ───────────────────────────────────────────────────────

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="text-base font-semibold text-tinta-900">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-tinta-600">{description}</p>
      )}
      {action && (
        <Link href={action.href} className="btn-primary mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────

export function Avatar({
  name,
  url,
  size = 40,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="pita-gradien inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {inisial(name)}
    </span>
  );
}

// ── Rating bintang ───────────────────────────────────────────────────────

export function Stars({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const px = size === "md" ? 18 : 14;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex" aria-label={`Rating ${value.toFixed(1)} dari 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            width={px}
            height={px}
            viewBox="0 0 20 20"
            fill={i <= Math.round(value) ? "var(--color-kuning-400)" : "var(--color-krem-300)"}
            aria-hidden
          >
            <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.78l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85z" />
          </svg>
        ))}
      </span>
      <span className={`font-semibold text-tinta-800 ${size === "md" ? "text-sm" : "text-xs"}`}>
        {value > 0 ? value.toFixed(1) : "Baru"}
      </span>
      {count !== undefined && count > 0 && (
        <span className={`text-tinta-600 ${size === "md" ? "text-sm" : "text-xs"}`}>({count})</span>
      )}
    </span>
  );
}

// ── Judul bagian ─────────────────────────────────────────────────────────

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="judul text-xl sm:text-2xl">{title}</h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tinta-600">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Lencana terverifikasi ────────────────────────────────────────────────

export function VerifiedBadge({ withText = true }: { withText?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold text-hijau-600"
      title="Penyedia terverifikasi KM ITB"
    >
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M10 1.5l2.03 1.48 2.5-.2.87 2.36 2.1 1.4-.9 2.35.9 2.35-2.1 1.4-.87 2.36-2.5-.2L10 16.28l-2.03-1.48-2.5.2-.87-2.36-2.1-1.4.9-2.35-.9-2.35 2.1-1.4.87-2.36 2.5.2L10 1.5zm3.4 5.6a.75.75 0 00-1.08-1.04L9.1 9.53 7.66 8.06A.75.75 0 006.6 9.11l1.98 2.02c.3.3.78.3 1.08 0l3.74-4.03z"
          clipRule="evenodd"
        />
      </svg>
      {withText && "Terverifikasi"}
    </span>
  );
}

export function PremiumBadge() {
  return (
    <span
      className="badge badge-warning"
      title="Premium listing — layanan diprioritaskan pada hasil pencarian"
    >
      ★ Premium
    </span>
  );
}

// ── Ikon garis sederhana untuk navigasi ──────────────────────────────────

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const d = ICON_PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      {d.map((path, i) => (
        <path key={i} d={path} />
      ))}
    </svg>
  );
}

export type IconName = keyof typeof ICON_PATHS;

const ICON_PATHS = {
  grid: ["M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"],
  cart: ["M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6", "M10 21a1 1 0 1 0 0-.01", "M18 21a1 1 0 1 0 0-.01"],
  star: ["M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z"],
  user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  users: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  briefcase: ["M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z", "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35"],
  wallet: ["M21 12V7H5a2 2 0 0 1 0-4h14v4", "M3 5v14a2 2 0 0 0 2 2h16v-5", "M18 12a2 2 0 0 0 0 4h4v-4z"],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  settings: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"],
  image: ["M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z", "M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", "M21 15l-5-5L5 21"],
  receipt: ["M6 2h12v20l-3-2-3 2-3-2-3 2z", "M9 7h6", "M9 11h6", "M9 15h4"],
  bell: ["M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9", "M13.7 21a2 2 0 0 1-3.4 0"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  plus: ["M12 5v14", "M5 12h14"],
  check: ["M20 6L9 17l-5-5"],
  x: ["M18 6L6 18", "M6 6l12 12"],
  arrowLeft: ["M19 12H5", "M12 19l-7-7 7-7"],
  arrowRight: ["M5 12h14", "M12 5l7 7-7 7"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"],
  mapPin: ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", "M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  eye: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  menu: ["M3 12h18", "M3 6h18", "M3 18h18"],
  trend: ["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"],
} as const;
