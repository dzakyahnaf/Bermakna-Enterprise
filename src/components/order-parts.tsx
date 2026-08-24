import { ORDER_STATUS, ORDER_STATUS_META } from "@/lib/constants";
import { rupiah, tanggalWaktu } from "@/lib/format";
import { Icon } from "@/components/ui";

/** Penanda tahapan alur pesanan dari dibuat sampai selesai. */
export function StatusStepper({ status }: { status: string }) {
  const tahap = [
    { key: ORDER_STATUS.MENUNGGU_KONFIRMASI, label: "Dikonfirmasi" },
    { key: ORDER_STATUS.MENUNGGU_PEMBAYARAN, label: "Dibayar" },
    { key: ORDER_STATUS.MENUNGGU_VERIFIKASI, label: "Diverifikasi" },
    { key: ORDER_STATUS.DIKERJAKAN, label: "Dikerjakan" },
    { key: ORDER_STATUS.SELESAI, label: "Selesai" },
  ];

  const batal: string[] = [ORDER_STATUS.DIBATALKAN, ORDER_STATUS.DITOLAK];
  if (batal.includes(status)) {
    const meta = ORDER_STATUS_META[status];
    return (
      <div className="card flex items-center gap-3 p-4">
        <span className="flex size-9 items-center justify-center rounded-full bg-merah-500/12 text-merah-900">
          <Icon name="x" size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-tinta-900">{meta?.label}</p>
          <p className="text-xs text-tinta-600">{meta?.description}</p>
        </div>
      </div>
    );
  }

  const indeksSaatIni = tahap.findIndex((t) => t.key === status);

  return (
    <div className="card overflow-x-auto p-5">
      <ol className="flex min-w-max items-center gap-1">
        {tahap.map((t, i) => {
          const selesai = i < indeksSaatIni || status === ORDER_STATUS.SELESAI;
          const sekarang = i === indeksSaatIni && status !== ORDER_STATUS.SELESAI;
          return (
            <li key={t.key} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    selesai
                      ? "bg-hijau-100 text-hijau-600"
                      : sekarang
                        ? "pita-gradien text-white"
                        : "bg-krem-200 text-tinta-500"
                  }`}
                >
                  {selesai ? <Icon name="check" size={15} /> : i + 1}
                </span>
                <span
                  className={`text-[11px] font-semibold whitespace-nowrap ${
                    selesai || sekarang ? "text-tinta-900" : "text-tinta-500"
                  }`}
                >
                  {t.label}
                </span>
              </div>
              {i < tahap.length - 1 && (
                <span
                  className={`mb-5 h-0.5 w-8 rounded-full sm:w-14 ${
                    i < indeksSaatIni || status === ORDER_STATUS.SELESAI
                      ? "bg-hijau-600/40"
                      : "bg-krem-300"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Linimasa perubahan status (jejak audit). */
export function OrderTimeline({
  events,
}: {
  events: { id: string; message: string; actor: string; createdAt: Date }[];
}) {
  return (
    <ol className="relative space-y-4 border-l border-krem-300 pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full bg-oranye-500 ring-4 ring-krem-100" />
          <p className="text-sm leading-relaxed text-tinta-800">{e.message}</p>
          <p className="mt-0.5 text-xs text-tinta-500">
            {e.actor} · {tanggalWaktu(e.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Rincian biaya sebuah pesanan. */
export function PriceBreakdown({
  pesanan,
  sudutPandang,
}: {
  pesanan: {
    quantity: number;
    unitPrice: number;
    subtotal: number;
    adminFee: number;
    commission: number;
    total: number;
    providerPayout: number;
  };
  sudutPandang: "pembeli" | "penyedia" | "admin";
}) {
  return (
    <dl className="space-y-2 text-sm">
      <Baris
        label={`Harga satuan × ${pesanan.quantity}`}
        nilai={rupiah(pesanan.unitPrice)}
        redup
      />
      <Baris label="Subtotal" nilai={rupiah(pesanan.subtotal)} />

      {sudutPandang !== "penyedia" && (
        <Baris label="Biaya administrasi" nilai={rupiah(pesanan.adminFee)} />
      )}
      {sudutPandang !== "pembeli" && (
        <Baris label="Komisi platform" nilai={`− ${rupiah(pesanan.commission)}`} />
      )}

      <div className="flex items-center justify-between border-t border-krem-200 pt-2.5 text-base font-extrabold text-tinta-900">
        <dt>
          {sudutPandang === "pembeli"
            ? "Total bayar"
            : sudutPandang === "penyedia"
              ? "Kamu terima"
              : "Dibayar pembeli"}
        </dt>
        <dd className="tabular-nums">
          {rupiah(sudutPandang === "penyedia" ? pesanan.providerPayout : pesanan.total)}
        </dd>
      </div>

      {sudutPandang === "admin" && (
        <>
          <Baris label="Diteruskan ke penyedia" nilai={rupiah(pesanan.providerPayout)} redup />
          <div className="flex items-center justify-between rounded-lg bg-hijau-100 px-3 py-2 text-sm font-bold text-hijau-600">
            <dt>Pendapatan platform</dt>
            <dd className="tabular-nums">{rupiah(pesanan.adminFee + pesanan.commission)}</dd>
          </div>
        </>
      )}
    </dl>
  );
}

function Baris({
  label,
  nilai,
  redup = false,
}: {
  label: string;
  nilai: string;
  redup?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${redup ? "text-tinta-500" : "text-tinta-700"}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{nilai}</dd>
    </div>
  );
}
