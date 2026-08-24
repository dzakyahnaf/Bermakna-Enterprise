import type { Metadata } from "next";
import Link from "next/link";

import { verifikasiPembayaran } from "@/actions/order";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { ORDER_STATUS, PAYMENT_STATUS_META } from "@/lib/constants";
import { rupiah, tanggalWaktu } from "@/lib/format";
import { urlPrivat } from "@/lib/upload";
import { PageHeader } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/action-form";
import { Alert, Badge, EmptyState, Icon } from "@/components/ui";

export const metadata: Metadata = { title: "Verifikasi Pembayaran" };

export default async function VerifikasiPembayaran() {
  await requireAdmin();
  const settings = await getSettings();

  const [menunggu, riwayat] = await Promise.all([
    prisma.order.findMany({
      where: { status: ORDER_STATUS.MENUNGGU_VERIFIKASI },
      orderBy: { updatedAt: "asc" },
      include: {
        payment: true,
        buyer: { select: { name: true, email: true, phone: true } },
        service: { select: { title: true } },
        provider: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.payment.findMany({
      where: { status: { not: "MENUNGGU" } },
      orderBy: { verifiedAt: "desc" },
      take: 15,
      include: {
        order: {
          select: { code: true, service: { select: { title: true } }, buyer: { select: { name: true } } },
        },
        verifiedBy: { select: { name: true } },
      },
    }),
  ]);

  // Bukti transfer ada di bucket privat; tautannya dibuat sesaat dan
  // kedaluwarsa dalam satu jam.
  const tautanBukti = new Map(
    await Promise.all(
      menunggu.map(async (o) => [o.code, await urlPrivat(o.payment?.proofUrl)] as const),
    ),
  );

  return (
    <>
      <PageHeader
        title="Verifikasi Pembayaran"
        description="Cocokkan bukti transfer dengan mutasi rekening platform sebelum menyetujui."
      />

      <div className="mb-6">
        <Alert tone="info" title="Rekening penerima platform">
          {settings.bankName} · <strong className="font-mono">{settings.bankAccount}</strong> a.n.{" "}
          {settings.bankHolder}
        </Alert>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold">
          Menunggu diperiksa{" "}
          {menunggu.length > 0 && <span className="badge badge-warning ml-1">{menunggu.length}</span>}
        </h2>

        {menunggu.length === 0 ? (
          <EmptyState
            icon="💸"
            title="Tidak ada pembayaran yang menunggu"
            description="Semua bukti transfer sudah diperiksa. Pesanan berjalan sebagaimana mestinya."
          />
        ) : (
          <div className="space-y-4">
            {menunggu.map((o) => (
              <article key={o.code} className="card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-tinta-600">{o.code}</p>
                    <h3 className="mt-0.5 text-base font-bold text-tinta-900">{o.service.title}</h3>
                    <p className="mt-0.5 text-xs text-tinta-600">
                      {o.buyer.name} → {o.provider.user.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-tinta-900">{rupiah(o.total)}</p>
                    <p className="text-xs text-tinta-600">
                      dikirim {o.payment ? tanggalWaktu(o.payment.createdAt) : "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-5 border-t border-krem-200 pt-4 sm:grid-cols-[200px_1fr]">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-tinta-600">Bukti transfer</p>
                    {tautanBukti.get(o.code) ? (
                      <a href={tautanBukti.get(o.code)!} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tautanBukti.get(o.code)!}
                          alt="Bukti transfer"
                          className="max-h-48 rounded-xl border border-krem-300"
                        />
                      </a>
                    ) : (
                      <p className="rounded-lg bg-kuning-100/25 px-3 py-2 text-xs text-tinta-800">
                        Tidak ada berkas bukti (data contoh).
                      </p>
                    )}
                  </div>

                  <div>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <Data label="Nama pengirim" nilai={o.payment?.senderName ?? "-"} />
                      <Data label="Bank pengirim" nilai={o.payment?.senderBank ?? "-"} />
                      <Data label="Nominal seharusnya" nilai={rupiah(o.total)} />
                      <Data label="Kontak pembeli" nilai={o.buyer.phone ?? o.buyer.email} />
                      <Data label="Subtotal layanan" nilai={rupiah(o.subtotal)} />
                      <Data
                        label="Pendapatan platform"
                        nilai={rupiah(o.adminFee + o.commission)}
                      />
                    </dl>

                    <form
                      action={verifikasiPembayaran}
                      className="mt-4 flex flex-wrap items-end gap-3 border-t border-krem-200 pt-4"
                    >
                      <input type="hidden" name="code" value={o.code} />
                      <div className="min-w-52 flex-1">
                        <label className="label" htmlFor={`catatan-${o.code}`}>
                          Catatan (wajib bila menolak)
                        </label>
                        <input
                          id={`catatan-${o.code}`}
                          name="catatan"
                          placeholder="Contoh: nominal transfer tidak sesuai."
                          className="input"
                        />
                      </div>
                      <div className="flex gap-2">
                        <SubmitButton
                          name="keputusan"
                          value="terima"
                          className="btn-primary"
                          pendingLabel="Memproses…"
                        >
                          <Icon name="check" size={16} />
                          Terima
                        </SubmitButton>
                        <SubmitButton
                          name="keputusan"
                          value="tolak"
                          className="btn-danger"
                          confirm="Tolak bukti pembayaran ini? Pembeli diminta mengunggah ulang."
                          pendingLabel="Memproses…"
                        >
                          Tolak
                        </SubmitButton>
                      </div>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {riwayat.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Riwayat verifikasi</h2>
          <div className="card tabel-scroll">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Layanan</th>
                  <th>Pembeli</th>
                  <th className="text-right">Nominal</th>
                  <th>Status</th>
                  <th>Diperiksa</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((p) => {
                  const meta = PAYMENT_STATUS_META[p.status];
                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-xs">
                        <Link
                          href={`/admin/transaksi?q=${p.order.code}`}
                          className="hover:text-merah-500"
                        >
                          {p.order.code}
                        </Link>
                      </td>
                      <td className="max-w-52 truncate font-semibold">{p.order.service.title}</td>
                      <td className="whitespace-nowrap">{p.order.buyer.name}</td>
                      <td className="text-right font-semibold tabular-nums">{rupiah(p.amount)}</td>
                      <td>
                        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label}</Badge>
                      </td>
                      <td className="text-xs whitespace-nowrap text-tinta-600">
                        {p.verifiedAt ? tanggalWaktu(p.verifiedAt) : "-"}
                        {p.verifiedBy && ` · ${p.verifiedBy.name}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function Data({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div>
      <dt className="text-xs text-tinta-600">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-tinta-900">{nilai}</dd>
    </div>
  );
}
