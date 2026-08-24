import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { daftarPenyedia } from "@/actions/provider";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Jadi Penyedia Jasa",
  description:
    "Daftarkan keterampilanmu di Bermakna Enterprise dan dapatkan penghasilan dari pasar kampus ITB.",
};

export default async function JadiPenyedia() {
  const user = await getCurrentUser();
  if (user?.provider) redirect("/mitra");

  const kategori = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { name: true, icon: true },
  });

  return (
    <div className="wrap py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
        {/* ── Ajakan ────────────────────────────────────────────────── */}
        <div>
          <p className="eyebrow mb-3">Peluang pendapatan</p>
          <h1 className="text-3xl leading-tight font-extrabold sm:text-4xl">
            Ubah keterampilanmu jadi{" "}
            <span className="teks-gradien">penghasilan nyata.</span>
          </h1>
          <p className="mt-4 leading-relaxed text-tinta-700">
            Mahasiswa ITB punya kemampuan mengajar, desain, videografi, pemrograman, hingga
            pengelolaan acara yang bernilai ekonomi. Bermakna Enterprise menghubungkannya langsung
            dengan pasar kampus: 20.000+ mahasiswa, himpunan, UKM, dan kepanitiaan.
          </p>

          <ul className="mt-7 space-y-4">
            {[
              [
                "Gratis, tanpa biaya tayang",
                "Kamu hanya dikenai komisi saat pesanan benar-benar selesai.",
              ],
              [
                "Terverifikasi = lebih dipercaya",
                "Lencana terverifikasi muncul di setiap layanan setelah admin memeriksa KTM-mu.",
              ],
              [
                "Portofolio yang terus tumbuh",
                "Rating, review, dan galeri karya terkumpul otomatis dari tiap transaksi.",
              ],
              [
                "Pembayaran yang aman",
                "Dana ditahan platform dan diteruskan setelah pesanan tuntas.",
              ],
            ].map(([judul, isi]) => (
              <li key={judul} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-hijau-100 text-hijau-600">
                  <Icon name="check" size={14} />
                </span>
                <div>
                  <p className="text-sm font-bold text-tinta-900">{judul}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-tinta-600">{isi}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="card-pad mt-7">
            <p className="text-sm font-bold text-tinta-900">Kategori yang bisa kamu tawarkan</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {kategori.map((k) => (
                <span key={k.name} className="badge badge-neutral">
                  {k.icon} {k.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Formulir ──────────────────────────────────────────────── */}
        <div>
          {!user ? (
            <div className="card-pad">
              <h2 className="text-xl font-bold">Masuk dulu untuk mendaftar</h2>
              <p className="mt-2 text-sm leading-relaxed text-tinta-600">
                Pendaftaran penyedia memerlukan akun Bermakna Enterprise. Buat akun gratis dulu —
                hanya butuh satu menit.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/daftar" className="btn-primary">
                  Daftar akun gratis
                </Link>
                <Link href="/masuk?tujuan=/jadi-penyedia" className="btn-secondary">
                  Sudah punya akun
                </Link>
              </div>
            </div>
          ) : (
            <div className="card-pad">
              <h2 className="text-xl font-bold">Formulir pendaftaran penyedia</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-tinta-600">
                Data berikut diperiksa pengurus Bermakna Enterprise untuk memastikan kamu benar
                mahasiswa ITB. Proses verifikasi biasanya selesai dalam 1×24 jam.
              </p>

              <ActionForm action={daftarPenyedia} className="mt-5 space-y-4">
                <div>
                  <label className="label" htmlFor="headline">
                    Judul keahlian
                  </label>
                  <input
                    id="headline"
                    name="headline"
                    required
                    minLength={10}
                    maxLength={120}
                    placeholder="Contoh: Tutor Kalkulus & Fisika Dasar — asisten praktikum 2 tahun"
                    className="input"
                  />
                  <p className="hint">Kalimat singkat yang muncul di bawah namamu.</p>
                </div>

                <div>
                  <label className="label" htmlFor="about">
                    Ceritakan tentang dirimu
                  </label>
                  <textarea
                    id="about"
                    name="about"
                    required
                    minLength={40}
                    rows={5}
                    placeholder="Latar belakang, pengalaman, dan alasan kamu layak dipercaya untuk jasa ini."
                    className="textarea"
                  />
                  <p className="hint">Minimal 40 karakter.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="nim">
                      NIM
                    </label>
                    <input
                      id="nim"
                      name="nim"
                      required
                      inputMode="numeric"
                      pattern="\d{5,12}"
                      placeholder="13522001"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="studyProgram">
                      Program studi
                    </label>
                    <input
                      id="studyProgram"
                      name="studyProgram"
                      required
                      placeholder="Teknik Informatika"
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="ktm">
                    Foto Kartu Tanda Mahasiswa
                  </label>
                  <input
                    id="ktm"
                    name="ktm"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    required
                    className="file-input"
                  />
                  <p className="hint">
                    Dipakai hanya untuk verifikasi internal dan tidak ditampilkan ke publik. JPG/PNG,
                    maksimal 5 MB.
                  </p>
                </div>

                <fieldset className="rounded-xl border border-krem-300 p-4">
                  <legend className="px-1.5 text-sm font-bold text-tinta-900">
                    Rekening pencairan dana
                  </legend>
                  <p className="mb-3 text-xs text-tinta-600">
                    Ke rekening inilah pendapatanmu diteruskan setelah pesanan selesai. Bisa diisi
                    belakangan.
                  </p>
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input name="bankName" placeholder="Nama bank" className="input" />
                      <input
                        name="bankAccount"
                        placeholder="Nomor rekening"
                        inputMode="numeric"
                        className="input"
                      />
                    </div>
                    <input
                      name="bankHolder"
                      placeholder="Nama pemilik rekening"
                      defaultValue={user.name}
                      className="input"
                    />
                  </div>
                </fieldset>

                <SubmitButton className="btn-primary btn-block" pendingLabel="Mengirim…">
                  Kirim Pendaftaran
                </SubmitButton>

                <p className="text-center text-xs leading-relaxed text-tinta-600">
                  Dengan mendaftar kamu bersedia menjaga kualitas layanan sesuai ketentuan
                  Bermakna Enterprise KM ITB.
                </p>
              </ActionForm>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
