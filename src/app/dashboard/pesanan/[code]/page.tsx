import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { batalkanPesanan, unggahBuktiBayar } from "@/actions/order";
import { tulisReview } from "@/actions/review";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { ORDER_STATUS, ORDER_STATUS_META, PAYMENT_STATUS_META } from "@/lib/constants";
import { rupiah, tanggal, tanggalWaktu, tautanWhatsapp } from "@/lib/format";
import { urlPrivat } from "@/lib/upload";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { OrderTimeline, PriceBreakdown, StatusStepper } from "@/components/order-parts";
import { RatingInput } from "@/components/rating-input";
import { Alert, Avatar, Badge, Icon, Stars } from "@/components/ui";

type Params = { params: Promise<{ code: string }>; searchParams: Promise<{ baru?: string }> };

export const metadata: Metadata = { title: "Detail Pesanan" };

export default async function DetailPesanan({ params, searchParams }: Params) {
  const { code } = await params;
  const { baru } = await searchParams;
  const user = await requireUser();
  const settings = await getSettings();

  const pesanan = await prisma.order.findUnique({
    where: { code },
    include: {
      service: { include: { category: true } },
      provider: {
        include: { user: { select: { name: true, avatarUrl: true, phone: true, faculty: true } } },
      },
      payment: true,
      review: true,
      timeline: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!pesanan || pesanan.buyerId !== user.id) notFound();

  // Bukti transfer tersimpan di bucket privat; pembeli hanya melihat tautan
  // sementara atas buktinya sendiri.
  const tautanBukti = await urlPrivat(pesanan.payment?.proofUrl);

  const meta = ORDER_STATUS_META[pesanan.status];
  const bisaBatal =
    pesanan.status === ORDER_STATUS.MENUNGGU_KONFIRMASI ||
    pesanan.status === ORDER_STATUS.MENUNGGU_PEMBAYARAN;

  const waLink = tautanWhatsapp(
    pesanan.provider.user.phone,
    `Halo ${pesanan.provider.user.name}, saya ingin menanyakan pesanan ${pesanan.code} ("${pesanan.service.title}") di Bermakna Enterprise.`,
  );

  return (
    <>
      <Link href="/dashboard/pesanan" className="btn-ghost btn-sm mb-4 -ml-3">
        <Icon name="arrowLeft" size={15} />
        Kembali ke daftar pesanan
      </Link>

      {baru && (
        <div className="mb-5">
          <Alert tone="success" title="Pesanan berhasil dibuat">
            Penyedia sudah mendapat pemberitahuan. Kamu akan diberi tahu begitu pesanan dikonfirmasi.
          </Alert>
        </div>
      )}

      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-tinta-600">{pesanan.code}</p>
          <h1 className="mt-1 text-2xl font-extrabold">{pesanan.service.title}</h1>
          <p className="mt-1 text-sm text-tinta-600">
            Dibuat {tanggalWaktu(pesanan.createdAt)}
          </p>
        </div>
        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
      </header>

      <StatusStepper status={pesanan.status} />

      <p className="mt-3 text-sm leading-relaxed text-tinta-600">{meta?.description}</p>

      {pesanan.rejectReason && (
        <div className="mt-4">
          <Alert tone="danger" title="Alasan penolakan">
            {pesanan.rejectReason}
          </Alert>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
        <div className="min-w-0 space-y-6">
          {/* ── Instruksi pembayaran ──────────────────────────────── */}
          {pesanan.status === ORDER_STATUS.MENUNGGU_PEMBAYARAN && (
            <section className="card-pad">
              <h2 className="text-lg font-bold">Selesaikan pembayaran</h2>
              <p className="mt-1 text-sm leading-relaxed text-tinta-600">
                Transfer sejumlah nominal berikut, lalu unggah bukti transfernya. Dana ditahan
                Bermakna Enterprise dan baru diteruskan ke penyedia setelah pesanan selesai.
              </p>

              {pesanan.payment?.status === "DITOLAK" && (
                <div className="mt-4">
                  <Alert tone="danger" title="Bukti transfer sebelumnya ditolak">
                    {pesanan.payment.note || "Silakan unggah ulang bukti transfer yang benar."}
                  </Alert>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-krem-300 bg-krem-50 p-4">
                <p className="text-xs font-semibold tracking-wide text-tinta-600 uppercase">
                  Transfer ke rekening
                </p>
                <p className="mt-2 text-lg font-extrabold text-tinta-900">{settings.bankName}</p>
                <p className="font-mono text-xl font-bold tracking-wider text-merah-500">
                  {settings.bankAccount}
                </p>
                <p className="mt-0.5 text-sm text-tinta-700">a.n. {settings.bankHolder}</p>
                <div className="mt-3 flex items-center justify-between border-t border-krem-300 pt-3">
                  <span className="text-sm font-semibold text-tinta-700">Nominal transfer</span>
                  <span className="text-xl font-extrabold text-tinta-900">
                    {rupiah(pesanan.total)}
                  </span>
                </div>
              </div>

              <ActionForm action={unggahBuktiBayar} className="mt-5 space-y-4">
                <input type="hidden" name="code" value={pesanan.code} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="senderName">
                      Nama pemilik rekening pengirim
                    </label>
                    <input
                      id="senderName"
                      name="senderName"
                      required
                      defaultValue={user.name}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="senderBank">
                      Bank pengirim
                    </label>
                    <input
                      id="senderBank"
                      name="senderBank"
                      required
                      placeholder="Bank BCA"
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="proof">
                    Bukti transfer
                  </label>
                  <input
                    id="proof"
                    name="proof"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    required
                    className="file-input"
                  />
                  <p className="hint">
                    Tangkapan layar bukti transfer. Format JPG/PNG/WEBP, maksimal 5 MB.
                  </p>
                </div>

                <SubmitButton className="btn-primary" pendingLabel="Mengunggah…">
                  Kirim Bukti Pembayaran
                </SubmitButton>
              </ActionForm>
            </section>
          )}

          {/* ── Status pembayaran ─────────────────────────────────── */}
          {pesanan.payment && pesanan.status !== ORDER_STATUS.MENUNGGU_PEMBAYARAN && (
            <section className="card-pad">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">Pembayaran</h2>
                <Badge tone={PAYMENT_STATUS_META[pesanan.payment.status]?.tone ?? "neutral"}>
                  {PAYMENT_STATUS_META[pesanan.payment.status]?.label}
                </Badge>
              </div>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Nominal" nilai={rupiah(pesanan.payment.amount)} />
                <Info label="Metode" nilai="Transfer bank" />
                <Info label="Pengirim" nilai={pesanan.payment.senderName} />
                <Info label="Bank pengirim" nilai={pesanan.payment.senderBank} />
                <Info label="Dikirim" nilai={tanggalWaktu(pesanan.payment.createdAt)} />
                {pesanan.payment.verifiedAt && (
                  <Info label="Diverifikasi" nilai={tanggalWaktu(pesanan.payment.verifiedAt)} />
                )}
              </dl>
              {tautanBukti && (
                <a
                  href={tautanBukti}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-fit"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tautanBukti}
                    alt="Bukti transfer"
                    className="max-h-56 rounded-xl border border-krem-300"
                  />
                </a>
              )}
            </section>
          )}

          {/* ── Review ────────────────────────────────────────────── */}
          {pesanan.status === ORDER_STATUS.SELESAI && !pesanan.review && (
            <section className="card-pad">
              <h2 className="text-lg font-bold">Beri rating & review</h2>
              <p className="mt-1 text-sm leading-relaxed text-tinta-600">
                Ulasanmu membantu mahasiswa lain memilih penyedia yang tepat, sekaligus menjadi
                kontrol kualitas platform.
              </p>

              <ActionForm action={tulisReview} className="mt-4 space-y-4">
                <input type="hidden" name="code" value={pesanan.code} />

                <div>
                  <p className="label">Rating</p>
                  <RatingInput />
                </div>

                <div>
                  <label className="label" htmlFor="comment">
                    Ulasan
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    required
                    minLength={10}
                    rows={4}
                    placeholder="Ceritakan pengalamanmu: kualitas hasil, ketepatan waktu, dan komunikasinya."
                    className="textarea"
                  />
                </div>

                <SubmitButton className="btn-primary" pendingLabel="Mengirim…">
                  Kirim Review
                </SubmitButton>
              </ActionForm>
            </section>
          )}

          {pesanan.review && (
            <section className="card-pad">
              <h2 className="text-lg font-bold">Review kamu</h2>
              <div className="mt-3">
                <Stars value={pesanan.review.rating} size="md" />
                <p className="mt-2 text-sm leading-relaxed text-tinta-700">
                  {pesanan.review.comment}
                </p>
                <p className="mt-1.5 text-xs text-tinta-500">
                  Ditulis {tanggal(pesanan.review.createdAt)}
                </p>
                {pesanan.review.reply && (
                  <div className="mt-3 rounded-xl border-l-2 border-oranye-500 bg-krem-50 px-3.5 py-2.5">
                    <p className="text-xs font-bold text-tinta-800">
                      Balasan {pesanan.provider.user.name}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-tinta-700">
                      {pesanan.review.reply}
                    </p>
                  </div>
                )}
              </div>
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
            <h2 className="mb-3 text-base font-bold">Rincian biaya</h2>
            <PriceBreakdown pesanan={pesanan} sudutPandang="pembeli" />
          </div>

          <div className="card-pad">
            <h2 className="mb-3 text-base font-bold">Penyedia</h2>
            <div className="flex items-center gap-3">
              <Avatar
                name={pesanan.provider.user.name}
                url={pesanan.provider.user.avatarUrl}
                size={44}
              />
              <div className="min-w-0">
                <Link
                  href={`/penyedia/${pesanan.provider.id}`}
                  className="block truncate text-sm font-bold text-tinta-900 hover:text-merah-500"
                >
                  {pesanan.provider.user.name}
                </Link>
                <p className="truncate text-xs text-tinta-600">
                  {pesanan.provider.studyProgram} · {pesanan.provider.user.faculty}
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

          <div className="card-pad">
            <h2 className="mb-3 text-base font-bold">Detail pesanan</h2>
            <dl className="space-y-2.5 text-sm">
              <Info label="Layanan" nilai={pesanan.service.title} />
              <Info label="Kategori" nilai={pesanan.service.category.name} />
              <Info label="Jumlah" nilai={`${pesanan.quantity} item`} />
              {pesanan.scheduledAt && (
                <Info label="Tanggal dibutuhkan" nilai={tanggal(pesanan.scheduledAt)} />
              )}
              {pesanan.contactPhone && (
                <Info label="Kontak kamu" nilai={pesanan.contactPhone} />
              )}
              {pesanan.note && <Info label="Catatan" nilai={pesanan.note} />}
            </dl>
          </div>

          {bisaBatal && (
            <form action={batalkanPesanan}>
              <input type="hidden" name="code" value={pesanan.code} />
              <SubmitButton
                className="btn-danger btn-block"
                confirm="Yakin membatalkan pesanan ini? Tindakan ini tidak bisa dibatalkan."
                pendingLabel="Membatalkan…"
              >
                Batalkan pesanan
              </SubmitButton>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}

function Info({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div>
      <dt className="text-xs text-tinta-600">{label}</dt>
      <dd className="mt-0.5 leading-relaxed font-semibold text-tinta-900">{nilai}</dd>
    </div>
  );
}
