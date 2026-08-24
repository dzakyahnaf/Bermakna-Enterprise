import Link from "next/link";

import { CAMPUSES } from "@/lib/constants";
import { Icon } from "@/components/ui";

/**
 * Kolom pencarian yang mengirim GET ke /jelajah — tanpa JavaScript sisi klien,
 * jadi tetap berfungsi meski skrip belum termuat.
 */
export function SearchBar({
  defaultQuery = "",
  defaultCampus = "",
  size = "md",
}: {
  defaultQuery?: string;
  defaultCampus?: string;
  size?: "md" | "lg";
}) {
  return (
    <form
      action="/jelajah"
      method="get"
      className={`card flex flex-col gap-2 p-2 sm:flex-row sm:items-center ${
        size === "lg" ? "sm:p-2.5" : ""
      }`}
    >
      <label className="flex flex-1 items-center gap-2.5 px-3">
        <span className="text-tinta-500">
          <Icon name="search" size={18} />
        </span>
        <span className="sr-only">Cari layanan</span>
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder="Cari tutor kalkulus, desain poster, fotografer…"
          className={`w-full border-0 bg-transparent py-2.5 text-sm text-tinta-900 placeholder:text-tinta-400 focus:outline-none ${
            size === "lg" ? "sm:text-base" : ""
          }`}
        />
      </label>

      <div className="flex gap-2 border-t border-krem-200 pt-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-2">
        <label className="flex-1 sm:flex-none">
          <span className="sr-only">Kampus</span>
          <select name="kampus" defaultValue={defaultCampus} className="select border-0 bg-transparent py-2.5 text-sm font-semibold focus:ring-0">
            <option value="">Semua kampus</option>
            {CAMPUSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary shrink-0">
          Cari
        </button>
      </div>
    </form>
  );
}

export function ChipKategori({
  kategori,
}: {
  kategori: { slug: string; name: string; icon: string }[];
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {kategori.map((k) => (
        <Link
          key={k.slug}
          href={`/kategori/${k.slug}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-krem-300 bg-white px-3.5 py-2 text-xs font-semibold text-tinta-800 transition-all hover:-translate-y-0.5 hover:border-oranye-500 hover:text-merah-500"
        >
          <span aria-hidden>{k.icon}</span>
          {k.name}
        </Link>
      ))}
    </div>
  );
}
