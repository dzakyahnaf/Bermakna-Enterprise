import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CAMPUSES } from "@/lib/constants";
import { angka } from "@/lib/format";
import { PILIH_KARTU_LAYANAN, ServiceCard } from "@/components/service-card";
import { SearchBar } from "@/components/search-bar";
import { EmptyState, Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Jelajah Layanan",
  description:
    "Cari jasa mahasiswa ITB berdasarkan kategori, kampus, harga, dan rating penyedia.",
};

const PER_HALAMAN = 12;

const URUTAN: Record<string, Prisma.ServiceOrderByWithRelationInput[]> = {
  relevan: [{ provider: { isPremium: "desc" } }, { ratingAvg: "desc" }, { orderCount: "desc" }],
  terbaru: [{ createdAt: "desc" }],
  termurah: [{ price: "asc" }],
  termahal: [{ price: "desc" }],
  rating: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
  terlaris: [{ orderCount: "desc" }],
};

type Params = {
  searchParams: Promise<{
    q?: string;
    kategori?: string;
    kampus?: string;
    min?: string;
    max?: string;
    urut?: string;
    hal?: string;
  }>;
};

export default async function Jelajah({ searchParams }: Params) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const kategori = sp.kategori ?? "";
  const kampus = sp.kampus ?? "";
  const min = Number(sp.min) || 0;
  const max = Number(sp.max) || 0;
  const urut = sp.urut && sp.urut in URUTAN ? sp.urut : "relevan";
  const halaman = Math.max(1, Number(sp.hal) || 1);

  const where: Prisma.ServiceWhereInput = {
    status: "ACTIVE",
    provider: { status: "VERIFIED" },
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
            { provider: { user: { name: { contains: q, mode: "insensitive" } }, status: "VERIFIED" } },
          ],
        }
      : {}),
    ...(kategori ? { category: { slug: kategori } } : {}),
    ...(kampus ? { campus: kampus } : {}),
    ...(min || max
      ? { price: { ...(min ? { gte: min } : {}), ...(max ? { lte: max } : {}) } }
      : {}),
  };

  const [daftarKategori, total, layanan] = await Promise.all([
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: {
        slug: true,
        name: true,
        icon: true,
        _count: { select: { services: { where: { status: "ACTIVE" } } } },
      },
    }),
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      orderBy: URUTAN[urut],
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      select: PILIH_KARTU_LAYANAN,
    }),
  ]);

  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const adaFilter = Boolean(q || kategori || kampus || min || max);

  /** Menyusun URL sambil mempertahankan filter yang sedang aktif. */
  const url = (ubah: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const gabung = { q, kategori, kampus, min: min || "", max: max || "", urut, ...ubah };
    for (const [k, v] of Object.entries(gabung)) {
      if (v !== undefined && v !== "" && v !== 0 && !(k === "urut" && v === "relevan")) {
        p.set(k, String(v));
      }
    }
    const s = p.toString();
    return `/jelajah${s ? `?${s}` : ""}`;
  };

  return (
    <div className="wrap py-10">
      <header className="mb-8">
        <p className="eyebrow mb-2">Pencarian layanan</p>
        <h1 className="judul text-3xl sm:text-4xl">
          {q ? (
            <>
              Hasil untuk <span className="teks-gradien">“{q}”</span>
            </>
          ) : (
            "Jelajah semua layanan"
          )}
        </h1>
        <p className="mt-2 text-sm text-tinta-600">
          {angka(total)} layanan ditemukan dari penyedia terverifikasi.
        </p>
        <div className="mt-6">
          <SearchBar defaultQuery={q} defaultCampus={kampus} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* ── Panel filter ──────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <form method="get" action="/jelajah" className="card-pad space-y-5">
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="urut" value={urut} />

            <div>
              <p className="mb-2.5 text-sm font-bold text-tinta-900">Kategori</p>
              <div className="space-y-1">
                <Link
                  href={url({ kategori: "", hal: undefined })}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    !kategori ? "bg-krem-200 text-tinta-900" : "text-tinta-700 hover:bg-krem-100"
                  }`}
                >
                  Semua kategori
                </Link>
                {daftarKategori.map((k) => (
                  <Link
                    key={k.slug}
                    href={url({ kategori: k.slug, hal: undefined })}
                    className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      kategori === k.slug
                        ? "bg-krem-200 text-tinta-900"
                        : "text-tinta-700 hover:bg-krem-100"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span aria-hidden>{k.icon}</span>
                      <span className="truncate">{k.name}</span>
                    </span>
                    <span className="shrink-0 text-tinta-500">{k._count.services}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-krem-200 pt-4">
              <label className="label" htmlFor="kampus">
                Kampus
              </label>
              <select id="kampus" name="kampus" defaultValue={kampus} className="select">
                <option value="">Semua kampus</option>
                {CAMPUSES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-krem-200 pt-4">
              <p className="label">Rentang harga (Rp)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="min"
                  min={0}
                  step={10000}
                  defaultValue={min || ""}
                  placeholder="Min"
                  className="input px-2.5 py-2 text-xs"
                />
                <span className="text-tinta-500">–</span>
                <input
                  type="number"
                  name="max"
                  min={0}
                  step={10000}
                  defaultValue={max || ""}
                  placeholder="Maks"
                  className="input px-2.5 py-2 text-xs"
                />
              </div>
            </div>

            <input type="hidden" name="kategori" value={kategori} />

            <div className="flex gap-2 border-t border-krem-200 pt-4">
              <button type="submit" className="btn-primary btn-sm flex-1">
                Terapkan
              </button>
              {adaFilter && (
                <Link href="/jelajah" className="btn-secondary btn-sm">
                  Reset
                </Link>
              )}
            </div>
          </form>
        </aside>

        {/* ── Hasil ─────────────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-tinta-600">
              Menampilkan{" "}
              <span className="font-semibold text-tinta-900">
                {layanan.length ? (halaman - 1) * PER_HALAMAN + 1 : 0}–
                {(halaman - 1) * PER_HALAMAN + layanan.length}
              </span>{" "}
              dari {angka(total)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                ["relevan", "Paling relevan"],
                ["terlaris", "Terlaris"],
                ["rating", "Rating tertinggi"],
                ["termurah", "Harga terendah"],
                ["terbaru", "Terbaru"],
              ].map(([nilai, label]) => (
                <Link
                  key={nilai}
                  href={url({ urut: nilai, hal: undefined })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    urut === nilai
                      ? "pita-gradien text-white"
                      : "border border-krem-300 bg-white text-tinta-700 hover:border-oranye-500"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {layanan.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Belum ada layanan yang cocok"
              description="Coba ubah kata kunci, longgarkan rentang harga, atau pilih kategori lain."
              action={{ href: "/jelajah", label: "Reset semua filter" }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {layanan.map((s) => (
                <ServiceCard key={s.slug} layanan={s} />
              ))}
            </div>
          )}

          {totalHalaman > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Navigasi halaman">
              <Link
                href={url({ hal: halaman - 1 })}
                aria-disabled={halaman === 1}
                className={`btn-secondary btn-sm ${halaman === 1 ? "pointer-events-none opacity-45" : ""}`}
              >
                <Icon name="arrowLeft" size={14} />
                Sebelumnya
              </Link>
              <span className="px-3 text-sm font-semibold text-tinta-700">
                {halaman} / {totalHalaman}
              </span>
              <Link
                href={url({ hal: halaman + 1 })}
                aria-disabled={halaman === totalHalaman}
                className={`btn-secondary btn-sm ${
                  halaman === totalHalaman ? "pointer-events-none opacity-45" : ""
                }`}
              >
                Berikutnya
                <Icon name="arrowRight" size={14} />
              </Link>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
