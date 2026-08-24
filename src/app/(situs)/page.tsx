import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { angka } from "@/lib/format";
import { warnaKategori } from "@/lib/constants";
import { PILIH_KARTU_LAYANAN, ServiceCard } from "@/components/service-card";
import { ChipKategori, SearchBar } from "@/components/search-bar";
import { Bulat, LatarHero, LatarLembut } from "@/components/dekorasi";
import { BlokSubjudul, JudulGDV } from "@/components/judul";
import { Avatar, Icon, SectionHeading, Stars, VerifiedBadge } from "@/components/ui";

export default async function Beranda() {
  const [kategori, unggulan, terbaru, penyedia, jumlahLayanan, jumlahPenyedia, jumlahSelesai] =
    await Promise.all([
      prisma.category.findMany({ orderBy: { order: "asc" } }),
      // Premium listing tampil lebih dulu — sesuai revenue stream pada proposal.
      prisma.service.findMany({
        where: { status: "ACTIVE", provider: { status: "VERIFIED" } },
        orderBy: [
          { provider: { isPremium: "desc" } },
          { ratingAvg: "desc" },
          { orderCount: "desc" },
        ],
        take: 6,
        select: PILIH_KARTU_LAYANAN,
      }),
      prisma.service.findMany({
        where: { status: "ACTIVE", provider: { status: "VERIFIED" } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: PILIH_KARTU_LAYANAN,
      }),
      prisma.provider.findMany({
        where: { status: "VERIFIED" },
        orderBy: [{ ratingAvg: "desc" }, { completedOrders: "desc" }],
        take: 4,
        select: {
          id: true,
          headline: true,
          ratingAvg: true,
          ratingCount: true,
          completedOrders: true,
          studyProgram: true,
          user: { select: { name: true, avatarUrl: true, faculty: true } },
        },
      }),
      prisma.service.count({ where: { status: "ACTIVE" } }),
      prisma.provider.count({ where: { status: "VERIFIED" } }),
      prisma.order.count({ where: { status: "SELESAI" } }),
    ]);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Aset visual GDV: flowing bergradien + aksen striking */}
        <LatarHero />

        <div className="wrap relative pt-14 pb-16 sm:pt-20">
          <p className="eyebrow mb-4">Kabinet Bermakna · KM ITB 2026/2027</p>
          <h1 className="max-w-4xl text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
            <JudulGDV>Satu kanal digital untuk semua</JudulGDV>{" "}
            <span className="teks-gradien">
              <JudulGDV>kebutuhan jasa mahasiswa ITB</JudulGDV>
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-tinta-700 sm:text-lg">
            Dari tutor akademik, konsultasi karier, jasa desain dan dokumentasi, hingga pencarian
            tempat tinggal — semua terhubung langsung dengan kebutuhan pasar kampus.
          </p>

          <div className="mt-8 max-w-3xl">
            <SearchBar size="lg" />
          </div>

          <div className="mt-6">
            <ChipKategori kategori={kategori.slice(0, 6)} />
          </div>

          <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            <Statistik nilai={angka(jumlahLayanan)} label="layanan aktif" />
            <Statistik nilai={angka(jumlahPenyedia)} label="penyedia terverifikasi" />
            <Statistik nilai={angka(jumlahSelesai)} label="transaksi selesai" />
            <Statistik nilai="20.000+" label="mahasiswa ITB sebagai pasar" />
          </dl>
        </div>
      </section>

      {/* ── Cara kerja (proposal 03 — Solusi Kami) ────────────────────── */}
      <section className="wrap py-14">
        <SectionHeading
          eyebrow="Cara kerja"
          title="Marketplace jasa yang dibangun mahasiswa, untuk mahasiswa."
          description="Tiga langkah sederhana, satu alur transaksi yang transparan dari awal sampai selesai."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <LangkahKerja
            nomor="01"
            judul="Temukan"
            deskripsi="Cari layanan yang dibutuhkan dari penyedia terverifikasi dalam hitungan menit — tersaring per kategori, kampus, dan rentang harga."
          />
          <LangkahKerja
            nomor="02"
            judul="Pesan"
            deskripsi="Sistem pemesanan, pembayaran, rating, dan review berada dalam satu alur transaksi yang tercatat rapi dan bisa dilacak."
          />
          <LangkahKerja
            nomor="03"
            judul="Berdaya"
            deskripsi="Penyedia jasa memperoleh pendapatan, portofolio nyata, dan jejaring kolaborasi baru di dalam ekosistem KM ITB."
          />
        </div>
      </section>

      {/* ── Kategori ──────────────────────────────────────────────────── */}
      <section className="wrap py-14">
        <SectionHeading
          eyebrow="Kategori layanan"
          title="Sepuluh kategori, satu platform."
          description="Semua kebutuhan jasa mahasiswa dalam satu tempat — tidak perlu lagi berpindah dari grup ke grup percakapan."
          action={
            <Link href="/kategori" className="btn-secondary btn-sm">
              Lihat semua
              <Icon name="arrowRight" size={15} />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kategori.map((k) => {
            const w = warnaKategori(k.slug);
            return (
            <Link
              key={k.id}
              href={`/kategori/${k.slug}`}
              className="card group flex flex-col gap-2 p-4 transition-all hover:-translate-y-1"
            >
              <span
                className={`inline-flex size-11 items-center justify-center rounded-xl text-2xl ${w.bg}`}
                aria-hidden
              >
                {k.icon}
              </span>
              <span className="text-sm leading-snug font-bold text-tinta-900 group-hover:text-merah-500">
                {k.name}
              </span>
              <span className="line-clamp-2 text-xs leading-relaxed text-tinta-600">{k.tagline}</span>
              <span className={`mt-1 h-1 w-8 rounded-full ${w.solid}`} aria-hidden />
            </Link>
            );
          })}
        </div>
      </section>

      {/* ── Layanan pilihan ───────────────────────────────────────────── */}
      <section className="wrap py-14">
        <SectionHeading
          eyebrow="Paling diminati"
          title="Layanan pilihan minggu ini"
          description="Diurutkan dari rating tertinggi dan jumlah pesanan terbanyak."
          action={
            <Link href="/jelajah" className="btn-secondary btn-sm">
              Jelajahi semua
              <Icon name="arrowRight" size={15} />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unggulan.map((s) => (
            <ServiceCard key={s.slug} layanan={s} />
          ))}
        </div>
      </section>

      {/* ── Keunggulan kompetitif (proposal 06) ───────────────────────── */}
      <section className="wrap py-14">
        <div className="card overflow-hidden">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="pita-gradien flex flex-col justify-center p-8 text-white sm:p-10">
              <p className="text-xs font-semibold tracking-[0.14em] text-white/85 uppercase">
                Keunggulan kompetitif
              </p>
              <h2 className="mt-3 text-2xl leading-tight font-extrabold text-white sm:text-3xl">
                Kenapa Bermakna Enterprise berbeda.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/90">
                Bukan sekadar grup jual-beli jasa. Ini unit usaha resmi yang dikelola KM ITB dengan
                proses verifikasi, kontrol kualitas, dan pencatatan transaksi yang tertib.
              </p>
            </div>
            <ul className="grid gap-px bg-krem-200 sm:grid-cols-2">
              {[
                ["Khusus mahasiswa ITB", "Ekosistem tertutup dengan konteks dan harga yang relevan bagi sesama mahasiswa."],
                ["Penyedia terverifikasi", "Setiap penyedia diperiksa identitas kemahasiswaannya sebelum layanannya tayang."],
                ["Terintegrasi ekosistem KM ITB", "Terhubung dengan himpunan, UKM, dan kepanitiaan sebagai pasar utama."],
                ["Banyak kategori, satu tempat", "Sepuluh kategori jasa yang paling dibutuhkan mahasiswa dalam satu pencarian."],
                ["Rating & quality control", "Review hanya bisa ditulis pembeli yang pesanannya benar-benar selesai."],
                ["Dikelola organisasi resmi", "Dana dan penyelesaian sengketa dikelola pengurus Bermakna Enterprise."],
              ].map(([judul, isi], i) => (
                <li key={judul} className="bg-white p-6">
                  <span className="text-xs font-bold text-oranye-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-1.5 text-sm font-bold text-tinta-900">{judul}</p>
                  <p className="mt-1 text-xs leading-relaxed text-tinta-600">{isi}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Penyedia unggulan ─────────────────────────────────────────── */}
      <section className="wrap py-14">
        <SectionHeading
          eyebrow="Penyedia terverifikasi"
          title="Mahasiswa di balik layanannya"
          description="Keterampilan mahasiswa ITB yang selama ini belum terhubung dengan pasar kampus."
          action={
            <Link href="/penyedia" className="btn-secondary btn-sm">
              Semua penyedia
              <Icon name="arrowRight" size={15} />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {penyedia.map((p) => (
            <Link
              key={p.id}
              href={`/penyedia/${p.id}`}
              className="card group p-5 transition-all hover:-translate-y-0.5 hover:border-oranye-500/50"
            >
              <Avatar name={p.user.name} url={p.user.avatarUrl} size={48} />
              <p className="mt-3 text-sm font-bold text-tinta-900 group-hover:text-merah-500">
                {p.user.name}
              </p>
              <p className="text-xs text-tinta-600">
                {p.studyProgram} · {p.user.faculty}
              </p>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-tinta-700">{p.headline}</p>
              <div className="mt-3 flex items-center justify-between border-t border-krem-200 pt-3">
                <Stars value={p.ratingAvg} count={p.ratingCount} />
                <VerifiedBadge withText={false} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Layanan terbaru ───────────────────────────────────────────── */}
      {terbaru.length > 0 && (
        <section className="wrap py-14">
          <SectionHeading eyebrow="Baru tayang" title="Layanan yang baru bergabung" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {terbaru.map((s) => (
              <ServiceCard key={s.slug} layanan={s} />
            ))}
          </div>
        </section>
      )}

      {/* ── Ajakan jadi penyedia ──────────────────────────────────────── */}
      <section className="wrap py-14">
        <div className="card grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="eyebrow mb-3">Peluang pendapatan</p>
            <h2 className="text-2xl leading-tight font-extrabold sm:text-3xl">
              Punya keterampilan yang bisa dijual? Daftarkan jasamu hari ini.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-tinta-700">
              Mengajar, mendesain, memotret, mengedit video, sampai mengelola acara — semuanya
              bernilai ekonomi. Bermakna Enterprise menghubungkanmu langsung dengan lebih dari 20.000
              mahasiswa ITB, himpunan, UKM, dan kepanitiaan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/jadi-penyedia" className="btn-primary btn-lg">
                Jadi Penyedia Jasa
              </Link>
              <Link href="/tentang" className="btn-secondary btn-lg">
                Pelajari programnya
              </Link>
            </div>
          </div>
          <ul className="space-y-3">
            {[
              "Gratis mendaftar, tanpa biaya tayang",
              "Verifikasi kemahasiswaan agar dipercaya pembeli",
              "Pencairan dana setelah pesanan selesai",
              "Portofolio dan rating yang terus terkumpul",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-tinta-800">
                <span className="mt-0.5 text-hijau-600">
                  <Icon name="check" size={16} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function Statistik({ nilai, label }: { nilai: string; label: string }) {
  return (
    <div className="card px-4 py-3.5">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-xl font-extrabold text-merah-500 sm:text-2xl">{nilai}</span>
        <span className="mt-0.5 block text-xs leading-snug text-tinta-600">{label}</span>
      </dd>
    </div>
  );
}

function LangkahKerja({
  nomor,
  judul,
  deskripsi,
}: {
  nomor: string;
  judul: string;
  deskripsi: string;
}) {
  return (
    <div className="card-pad">
      <span className="pita-gradien inline-flex size-9 items-center justify-center rounded-xl text-xs font-black text-white">
        {nomor}
      </span>
      <h3 className="mt-3.5 text-lg font-bold">{judul}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-tinta-600">{deskripsi}</p>
    </div>
  );
}
