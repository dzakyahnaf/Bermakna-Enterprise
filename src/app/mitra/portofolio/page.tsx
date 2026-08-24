import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { hapusPortofolio, tambahPortofolio } from "@/actions/provider";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tanggal } from "@/lib/format";
import { PageHeader } from "@/components/dashboard-shell";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { EmptyState, Icon } from "@/components/ui";

export const metadata: Metadata = { title: "Portofolio" };

export default async function Portofolio() {
  const user = await requireProvider();
  if (user.provider.status !== "VERIFIED") redirect("/mitra/status");

  const karya = await prisma.portfolioItem.findMany({
    where: { providerId: user.provider.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Portofolio"
        description="Contoh karya nyata adalah alasan utama pembeli memilihmu. Tampilkan yang terbaik di sini."
        action={
          <Link href={`/penyedia/${user.provider.id}`} className="btn-secondary btn-sm">
            <Icon name="eye" size={14} />
            Lihat profil publik
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          {karya.length === 0 ? (
            <EmptyState
              icon="🖼️"
              title="Portofolio masih kosong"
              description="Unggah contoh karya pertamamu lewat formulir di samping — poster, foto acara, cuplikan video, atau tangkapan layar proyek."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {karya.map((k) => (
                <li key={k.id} className="card overflow-hidden">
                  {k.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={k.imageUrl} alt="" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-krem-200 to-krem-400">
                      <span className="text-4xl opacity-70" aria-hidden>
                        🖼️
                      </span>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-bold text-tinta-900">{k.title}</p>
                    {k.description && (
                      <p className="mt-1 text-xs leading-relaxed text-tinta-600">{k.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-krem-200 pt-3">
                      <span className="text-xs text-tinta-500">{tanggal(k.createdAt)}</span>
                      <form action={hapusPortofolio}>
                        <input type="hidden" name="id" value={k.id} />
                        <SubmitButton
                          className="btn-danger btn-sm"
                          confirm="Hapus karya ini dari portofolio?"
                          pendingLabel="…"
                        >
                          Hapus
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card-pad">
            <h2 className="text-lg font-bold">Tambah karya</h2>

            <ActionForm action={tambahPortofolio} className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="title">
                  Judul karya
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  minLength={3}
                  placeholder="Identitas Visual Wisuda Oktober"
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="description">
                  Deskripsi singkat <span className="font-normal text-tinta-500">(opsional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Apa yang kamu kerjakan dan hasilnya seperti apa."
                  className="textarea"
                />
              </div>

              <div>
                <label className="label" htmlFor="image">
                  Gambar karya
                </label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="file-input"
                />
                <p className="hint">JPG/PNG/WEBP, maksimal 5 MB.</p>
              </div>

              <div>
                <label className="label" htmlFor="link">
                  Tautan <span className="font-normal text-tinta-500">(opsional)</span>
                </label>
                <input
                  id="link"
                  name="link"
                  type="url"
                  placeholder="https://drive.google.com/…"
                  className="input"
                />
              </div>

              <SubmitButton className="btn-primary btn-block" pendingLabel="Menyimpan…">
                Tambah ke Portofolio
              </SubmitButton>
            </ActionForm>
          </div>
        </aside>
      </div>
    </>
  );
}
