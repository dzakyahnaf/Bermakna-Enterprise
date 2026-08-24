import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { selesaikanPesanan, terimaPesanan, tolakPesanan } from "@/actions/order";
import { balasReview } from "@/actions/review";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS, ORDER_STATUS_META, PAYMENT_STATUS_META } from "@/lib/constants";
import { rupiah, tanggal, tanggalWaktu, tautanWhatsapp } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { OrderTimeline, PriceBreakdown, StatusStepper } from "@/components/order-parts";
import { Alert, Avatar, Badge, Icon, Stars } from "@/components/ui";

type Params = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "Detail Pesanan" };

export default async function DetailPesananMitra({ params }: Params) {
  const { code } = await params;
  const user = await requireProvider();
  if (user.provider.status !== "VERIFIED") redirect("/mitra/status");

  const pesanan = await prisma.order.findUnique({
    where: { code },
    include: {
      service: { include: { category: true } },
      buyer: {
        select: { name: true, avatarUrl: true, phone: true, faculty: true, batch: true, campus: true },
      },
      payment: true,
      review: true,
      timeline: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!pesanan || pesanan.providerId !== user.provider.id) notFound();

  const meta = ORDER_STATUS_META[pesanan.status];

  const waLink = tautanWhatsapp(
    pesanan.contactPhone || pesanan.buyer.phone,
    `Halo ${pesanan.buyer.name}, saya ${user.name} dari Bermakna Enterprise. Saya ingin membahas pesanan ${pesanan.code} ("${pesanan.service.title}").`,
  );

  return (
    <>
      <Link href="/mitra/pesanan" className="btn-ghost btn-sm mb-4 -ml-3">
        <Icon name="arrowLeft" size={15} />
        Kembali ke pesanan masuk
      </Link>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-tinta-600">{pesanan.code}</p>
          <h1 className="mt-1 text-2xl font-extrabold">{pesanan.service.title}</h1>
          <p className="mt-1 text-sm text-tinta-600">Masuk {tanggalWaktu(pesanan.createdAt)}</p>
        </div>
        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
      </header>

      <StatusStepper status={pesanan.status} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
        <div className="min-w-0 space-y-6">
          {/* ── Aksi: konfirmasi pesanan ──────────────────────────── */}
          {pesanan.status === ORDER_STATUS.MENUNGGU_KONFIRMASI && (
            <section className="card-pad">
              <h2 className="text-lg font-bold">Konfirmasi pesanan ini</h2>
              <p className="mt-1 text-sm leading-relaxed text-tinta-600">
                Periksa catatan dan jadwal pembeli. Bila kamu sanggup mengerjakannya, terima pesanan
                agar pembeli bisa melanjutkan ke pembayaran.
              </p>

              <form action={terimaPesanan} className="mt-4">
                <input type="hidden" name="code" value={pesanan.code} />
                <SubmitButton className="btn-primary" pendingLabel="Memproses…">
                  <Icon name="check" size={16} />
                  Terima Pesanan
                </SubmitButton>
              </form>

              <details className="mt-5 border-t border-krem-200 pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-tinta-700 hover:text-merah-500">
                  Tidak bisa mengerjakan? Tolak pesanan
                </summary>
                <ActionForm action={tolakPesanan} className="mt-3 space-y-3">
                  <input type="hidden" name="code" value={pesanan.code} />
                  <div>
                    <label className="label" htmlFor="alasan">
                      Alasan penolakan
                    </label>
                    <textarea
                      id="alasan"
                      name="alasan"
                      required
                      minLength={5}
                      rows={3}
                      placeholder="Contoh: jadwal saya sedang penuh pada tanggal tersebut."
                      className="textarea"
                    />
                    <p className="hint">Alasan ini dikirim ke pembeli, tuliskan dengan sopan.</p>
                  </div>
                  <SubmitButton className="btn-danger" pendingLabel="Memproses…">
                    Tolak Pesanan
                  </SubmitButton>
                </ActionForm>
              </details>
            </section>
          )}

          {/* ── Aksi: tandai selesai ──────────────────────────────── */}
          {pesanan.status === ORDER_STATUS.DIKERJAKAN && (
            <section className="card-pad">
              <h2 className="text-lg font-bold">Sudah selesai dikerjakan?</h2>
              <p className="mt-1 text-sm leading-relaxed text-tinta-600">
                Tandai selesai setelah hasil pekerjaan diserahkan ke pembeli. Setelah itu pembeli
                bisa memberi rating, dan pendapatanmu masuk hitungan pencairan.
              </p>
              <div className="mt-4 rounded-xl bg-hijau-100 px-4 py-3">
                <p className="text-sm font-semibold text-hijau-600">
                  Kamu akan menerima {rupiah(pesanan.providerPayout)}
                </p>
                <p className="mt-0.5 text-xs text-tinta-700">
                  Sudah dipotong komisi platform {rupiah(pesanan.commission)}.
                </p>
              </div>
              <form action={selesaikanPesanan} className="mt-4">
                <input type="hidden" name="code" value={pesanan.code} />
                <SubmitButton
                  className="btn-primary"
                  confirm="Tandai pesanan ini selesai? Pastikan hasil pekerjaan sudah diterima pembeli."
                  pendingLabel="Memproses…"
                >
                  <Icon name="check" size={16} />
                  Tandai Selesai
                </SubmitButton>
              </form>
            </section>
          )}

          {pesanan.status === ORDER_STATUS.MENUNGGU_PEMBAYARAN && (
            <Alert tone="info" title="Menunggu pembayaran pembeli">
              Kamu sudah menerima pesanan ini. Pekerjaan baru dimulai setelah pembayaran pembeli
              diverifikasi admin.
            </Alert>
          )}

          {pesanan.status === ORDER_STATUS.MENUNGGU_VERIFIKASI && (
            <Alert tone="info" title="Bukti bayar sedang diperiksa admin">
              Pembeli sudah mengunggah bukti transfer. Begitu admin memverifikasinya, pesanan otomatis
              berubah menjadi “sedang dikerjakan”.
            </Alert>
          )}

          {pesanan.rejectReason && (
            <Alert tone="danger" title="Pesanan ditolak">
              {pesanan.rejectReason}
            </Alert>
          )}

          {/* ── Detail permintaan ─────────────────────────────────── */}
          <section className="card-pad">
            <h2 className="mb-3 text-lg font-bold">Permintaan pembeli</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="Layanan" nilai={pesanan.service.title} />
              <Info label="Kategori" nilai={pesanan.service.category.name} />
              <Info label="Jumlah" nilai={`${pesanan.quantity} item`} />
              <Info
                label="Tanggal dibutuhkan"
                nilai={pesanan.scheduledAt ? tanggal(pesanan.scheduledAt) : "Fleksibel"}
              />
              <Info label="Kontak pembeli" nilai={pesanan.contactPhone ?? "-"} />
              <Info label="Kampus pembeli" nilai={pesanan.buyer.campus} />
              {pesanan.note && (
                <div className="sm:col-span-2">
                  <Info label="Catatan" nilai={pesanan.note} />
                </div>
              )}
            </dl>
          </section>

          {/* ── Pembayaran ────────────────────────────────────────── */}
          {pesanan.payment && (
            <section className="card-pad">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">Pembayaran</h2>
                <Badge tone={PAYMENT_STATUS_META[pesanan.payment.status]?.tone ?? "neutral"}>
                  {PAYMENT_STATUS_META[pesanan.payment.status]?.label}
                </Badge>
              </div>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <Info label="Nominal dibayar pembeli" nilai={rupiah(pesanan.payment.amount)} />
                <Info label="Pengirim" nilai={pesanan.payment.senderName} />
                <Info label="Bank pengirim" nilai={pesanan.payment.senderBank} />
                <Info label="Dikirim" nilai={tanggalWaktu(pesanan.payment.createdAt)} />
              </dl>
            </section>
          )}

          {/* ── Review & balasan ──────────────────────────────────── */}
          {pesanan.review && (
            <section className="card-pad">
              <h2 className="text-lg font-bold">Review pembeli</h2>
              <div className="mt-3">
                <Stars value={pesanan.review.rating} size="md" />
                <p className="mt-2 text-sm leading-relaxed text-tinta-700">
                  {pesanan.review.comment}
                </p>
                <p className="mt-1.5 text-xs text-tinta-500">
                  {tanggal(pesanan.review.createdAt)}
                </p>
              </div>

              {pesanan.review.reply ? (
                <div className="mt-4 rounded-xl border-l-2 border-oranye-500 bg-krem-50 px-3.5 py-2.5">
                  <p className="text-xs font-bold text-tinta-800">Balasanmu</p>
                  <p className="mt-1 text-sm leading-relaxed text-tinta-700">
                    {pesanan.review.reply}
                  </p>
                </div>
              ) : (
                <ActionForm action={balasReview} className="mt-4 space-y-3">
                  <input type="hidden" name="reviewId" value={pesanan.review.id} />
                  <div>
                    <label className="label" htmlFor="reply">
                      Balas ulasan ini
                    </label>
                    <textarea
                      id="reply"
                      name="reply"
                      required
                      rows={3}
                      placeholder="Terima kasih atas ulasannya…"
                      className="textarea"
                    />
                  </div>
                  <SubmitButton className="btn-secondary" pendingLabel="Mengirim…">
                    Kirim Balasan
                  </SubmitButton>
                </ActionForm>
              )}
            </section>
          )}

          {/* ── Linimasa ──────────────────────────────────────────── */}
          <section className="card-pad">
            <h2 className="mb-4 text-lg font-bold">Riwayat status</h2>
            <OrderTimeline events={pesanan.timeline} />
          </section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside className="space-y-4">
          <div className="card-pad">
            <h2 className="mb-3 text-base font-bold">Pendapatanmu</h2>
            <PriceBreakdown pesanan={pesanan} sudutPandang="penyedia" />
            <p className="mt-3 border-t border-krem-200 pt-3 text-xs leading-relaxed text-tinta-600">
              Pencairan dilakukan pengurus Bermakna Enterprise setelah pesanan berstatus selesai.
            </p>
          </div>

          <div className="card-pad">
            <h2 className="mb-3 text-base font-bold">Pembeli</h2>
            <div className="flex items-center gap-3">
              <Avatar name={pesanan.buyer.name} url={pesanan.buyer.avatarUrl} size={44} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-tinta-900">{pesanan.buyer.name}</p>
                <p className="truncate text-xs text-tinta-600">
                  {pesanan.buyer.faculty ?? "-"} · Angkatan {pesanan.buyer.batch ?? "-"}
                </p>
              </div>
            </div>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa btn-block btn-sm mt-3"
              >
                Hubungi via WhatsApp
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function Info({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div>
      <dt className="text-xs text-tinta-600">{label}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed font-semibold text-tinta-900">{nilai}</dd>
    </div>
  );
}
