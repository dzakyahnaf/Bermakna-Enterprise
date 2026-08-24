import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { YEAR_ONE_TARGETS } from "@/lib/constants";
import { angka } from "@/lib/format";
import { Icon, SectionHeading } from "@/components/ui";
import { LatarHero } from "@/components/dekorasi";

export const metadata: Metadata = {
  title: "Tentang Bermakna Enterprise",
  description:
    "Program Mahasiswa Wirausaha 2026 — marketplace jasa mahasiswa ITB yang dikelola Kabinet Bermakna KM ITB 2026/2027.",
};

export default async function Tentang() {
  const [pengguna, penyedia, transaksi] = await Promise.all([
    prisma.user.count({ where: { role: { not: "ADMIN" } } }),
    prisma.provider.count({ where: { status: "VERIFIED" } }),
    prisma.order.count({ where: { status: "SELESAI" } }),
  ]);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <LatarHero />
        <div className="wrap relative py-16">
          <p className="eyebrow mb-4">Program Mahasiswa Wirausaha · 2026</p>
          <h1 className="judul max-w-4xl text-4xl leading-[1.08] sm:text-5xl">
            Menciptakan peluang ekonomi baru bagi mahasiswa, sekaligus{" "}
            <span className="teks-gradien">unit usaha berkelanjutan</span> bagi civitas ITB.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-tinta-700">
            Bermakna Enterprise adalah platform berbasis web yang mempertemukan penyedia dan pengguna
            jasa mahasiswa dalam satu ekosistem yang transparan, terpercaya, dan mudah diakses.
          </p>
          <p className="mt-6 text-xl font-bold text-oranye-500">“From Us, For Together.”</p>
        </div>
      </section>

      {/* ── Latar belakang ────────────────────────────────────────────── */}
      <section className="wrap py-14">
        <SectionHeading
          eyebrow="Latar belakang"
          title="Kebutuhan dan potensi mahasiswa masih terputus."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <article className="card-pad">
            <span className="badge badge-danger">Masalah</span>
            <h3 className="mt-3 text-lg font-bold">Pencarian jasa masih konvensional</h3>
            <p className="mt-2 text-sm leading-relaxed text-tinta-700">
              Kebutuhan tutor, mentor kompetisi, tempat tinggal, dan tenaga acara dicari lewat grup
              percakapan, media sosial, dan jaringan pertemanan. Cara ini sering tidak efektif dan
              sulit menjangkau seluruh mahasiswa.
            </p>
          </article>
          <article className="card-pad">
            <span className="badge badge-success">Potensi</span>
            <h3 className="mt-3 text-lg font-bold">Keterampilan mahasiswa belum terhubung</h3>
            <p className="mt-2 text-sm leading-relaxed text-tinta-700">
              Mahasiswa ITB punya kemampuan mengajar, desain, videografi, pemrograman, hingga
              pengelolaan acara yang bernilai ekonomi. Namun belum ada platform yang
              menghubungkannya dengan pasar kampus secara terintegrasi.
            </p>
          </article>
        </div>
        <p className="mt-5 rounded-2xl border border-krem-300 bg-white px-6 py-5 text-center leading-relaxed font-semibold text-tinta-800">
          Bermakna Enterprise menjembatani keduanya: akses jasa yang cepat dan terpercaya, sekaligus
          peluang pendapatan bagi penyedia.
        </p>
      </section>

      {/* ── Arsitektur platform ───────────────────────────────────────── */}
      <section className="wrap py-14">
        <SectionHeading
          eyebrow="Arsitektur platform"
          title="Website responsif dengan delapan sistem inti."
          description="Setiap sistem di bawah ini sudah berjalan penuh di platform ini — bukan sekadar rencana."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Dashboard Pengguna", "Ringkasan pesanan, review, dan notifikasi pembeli.", "/dashboard"],
            ["Dashboard Penyedia Jasa", "Pendapatan, pesanan masuk, dan performa layanan.", "/mitra"],
            ["Pencarian Layanan", "Filter kategori, kampus, harga, dan pengurutan.", "/jelajah"],
            ["Sistem Pemesanan", "Alur pesan → konfirmasi → bayar → kerjakan → selesai.", "/jelajah"],
            ["Rating & Review", "Hanya dari pembeli dengan pesanan yang benar-benar selesai.", "/penyedia"],
            ["Dashboard Administrasi", "Pantauan pengguna, transaksi, dan pendapatan platform.", "/admin"],
            ["Verifikasi Penyedia", "Pemeriksaan KTM sebelum layanan boleh tayang.", "/jadi-penyedia"],
            ["Database Transaksi", "Catatan lengkap tiap transaksi, dapat diekspor ke CSV.", "/admin"],
          ].map(([judul, isi, href], i) => (
            <Link
              key={judul}
              href={href}
              className="card group p-5 transition-all hover:-translate-y-0.5 hover:border-oranye-500/50"
            >
              <span className="text-xs font-bold text-oranye-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-1.5 text-sm font-bold text-tinta-900 group-hover:text-merah-500">
                {judul}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-tinta-600">{isi}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Model bisnis ──────────────────────────────────────────────── */}
      <section id="model-bisnis" className="wrap scroll-mt-20 py-14">
        <SectionHeading
          eyebrow="Model bisnis"
          title="Ekonomi platform yang berkelanjutan."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Customer Segments", "Mahasiswa, Himpunan, UKM, Kepanitiaan, Alumni, Mitra Kampus"],
            ["Value Proposition", "Jasa mahasiswa yang cepat, terpercaya, dan terintegrasi"],
            ["Channels", "Website, Instagram, WhatsApp Business, Media KM ITB"],
            ["Key Resources", "Platform digital, database pengguna, jaringan KM ITB, tim pengelola"],
            ["Key Partners", "KM ITB, Himpunan, UKM, Alumni, Perusahaan Mitra"],
            [
              "Revenue Streams",
              "Biaya administrasi, komisi layanan, premium listing, sponsorship",
            ],
          ].map(([judul, isi], i) => (
            <div key={judul} className={`card-pad ${i === 5 ? "pita-gradien border-0" : ""}`}>
              <p
                className={`text-xs font-semibold tracking-wide uppercase ${
                  i === 5 ? "text-white/85" : "text-tinta-600"
                }`}
              >
                {judul}
              </p>
              <p
                className={`mt-2 text-sm leading-relaxed font-semibold ${
                  i === 5 ? "text-white" : "text-tinta-900"
                }`}
              >
                {isi}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Target & pasar ────────────────────────────────────────────── */}
      <section className="wrap py-14">
        <SectionHeading
          eyebrow="Target & potensi pasar"
          title="Pasar yang besar dan siap diakses."
          description="Angka di bawah menunjukkan capaian nyata platform ini dibanding target tahun pertama pada proposal."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Progres
            label="Pengguna aktif"
            nilai={pengguna}
            target={YEAR_ONE_TARGETS.users}
          />
          <Progres
            label="Penyedia jasa terverifikasi"
            nilai={penyedia}
            target={YEAR_ONE_TARGETS.providers}
          />
          <Progres
            label="Transaksi selesai"
            nilai={transaksi}
            target={YEAR_ONE_TARGETS.orders}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            [
              "Tahun pertama",
              "Fokus Kampus Ganesha, Jatinangor, dan Cirebon dengan target 500 pengguna aktif.",
            ],
            [
              "Pasar potensial",
              "Himpunan, UKM, kepanitiaan acara, dan jaringan alumni sebagai pembeli institusional.",
            ],
            [
              "Jangka panjang",
              "Model direplikasi ke perguruan tinggi lain di Indonesia dengan struktur yang sama.",
            ],
          ].map(([judul, isi]) => (
            <div key={judul} className="card-pad">
              <p className="text-sm font-bold text-tinta-900">{judul}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-tinta-600">{isi}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-tinta-600">
          Pasar utama: <strong className="text-tinta-900">20.000+</strong> mahasiswa aktif ITB.
        </p>
      </section>

      {/* ── Tim ───────────────────────────────────────────────────────── */}
      <section id="tim" className="wrap scroll-mt-20 py-14">
        <SectionHeading eyebrow="Profil tim" title="Tim yang membangun Bermakna." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              "Tarisha",
              "Chief Executive Officer",
              "Strategi bisnis, pengembangan kemitraan, pengelolaan organisasi, dan koordinasi keseluruhan kegiatan.",
            ],
            [
              "Tamara",
              "Chief Technology Officer",
              "Pengembangan website, sistem informasi, database, user experience, dan fitur platform.",
            ],
            [
              "Samuel",
              "Chief Operating Officer",
              "Pengelolaan rencana bisnis, operasionalisasi kegiatan, dan pelaporan.",
            ],
          ].map(([nama, jabatan, tugas]) => (
            <article key={nama} className="card-pad">
              <span className="pita-gradien inline-flex size-12 items-center justify-center rounded-2xl text-lg font-black text-white">
                {nama[0]}
              </span>
              <h3 className="mt-4 text-lg font-bold">{nama}</h3>
              <p className="text-sm font-semibold text-oranye-500">{jabatan}</p>
              <p className="mt-2.5 text-sm leading-relaxed text-tinta-600">{tugas}</p>
            </article>
          ))}
        </div>

        <div className="card-pad mt-4">
          <p className="text-sm font-bold text-tinta-900">Tim pendukung</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Business Development",
              "Marketing & Partnership",
              "UI/UX Designer",
              "Web Developer",
              "Customer Success",
            ].map((t) => (
              <span key={t} className="badge badge-neutral">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ajakan ────────────────────────────────────────────────────── */}
      <section className="wrap py-14">
        <div className="card pita-gradien border-0 p-10 text-center sm:p-14">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">From Us, For Together.</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/90">
            Bergabunglah dengan {angka(pengguna)} mahasiswa yang sudah memakai Bermakna Enterprise —
            baik sebagai pengguna jasa maupun penyedia.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/jelajah"
              className="btn btn-lg bg-white text-tinta-900 hover:bg-krem-100"
            >
              Jelajah Layanan
            </Link>
            <Link
              href="/jadi-penyedia"
              className="btn btn-lg border border-white/40 text-white hover:bg-white/12"
            >
              Jadi Penyedia Jasa
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/80">
            Narahubung: Tarisha · tarishazp@gmail.com · Kabinet Bermakna KM ITB 2026/2027
          </p>
        </div>
      </section>
    </>
  );
}

function Progres({ label, nilai, target }: { label: string; nilai: number; target: number }) {
  const persen = Math.min(100, Math.round((nilai / target) * 100));
  return (
    <div className="card-pad">
      <p className="text-xs font-semibold tracking-wide text-tinta-600 uppercase">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-tinta-900">{angka(nilai)}</span>
        <span className="text-sm text-tinta-600">/ {angka(target)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-krem-200">
        <div className="pita-gradien h-full rounded-full" style={{ width: `${persen}%` }} />
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-xs text-tinta-600">
        <Icon name="trend" size={12} />
        {persen}% dari target tahun pertama
      </p>
    </div>
  );
}
