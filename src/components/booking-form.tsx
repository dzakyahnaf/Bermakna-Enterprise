"use client";

import Link from "next/link";
import { useState } from "react";

import { buatPesanan } from "@/actions/order";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { priceUnitLabel } from "@/lib/constants";
import { rupiah } from "@/lib/format";

/**
 * Kartu pemesanan pada halaman layanan.
 * Rincian biaya dihitung ulang di klien agar pembeli langsung melihat totalnya,
 * lalu dihitung ulang lagi di server saat pesanan dibuat (server yang berwenang).
 */
export function BookingForm({
  slug,
  price,
  priceUnit,
  adminFee,
  sudahMasuk,
  milikSendiri,
  teleponAwal,
}: {
  slug: string;
  price: number;
  priceUnit: string;
  adminFee: number;
  sudahMasuk: boolean;
  milikSendiri: boolean;
  teleponAwal: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const subtotal = price * quantity;

  if (milikSendiri) {
    return (
      <div className="card-pad">
        <p className="text-sm font-semibold text-tinta-900">Ini layananmu sendiri</p>
        <p className="mt-1.5 text-sm leading-relaxed text-tinta-600">
          Kelola harga, deskripsi, dan galeri layanan ini dari dashboard penyedia.
        </p>
        <Link href="/mitra/layanan" className="btn-secondary btn-block mt-4">
          Kelola layanan saya
        </Link>
      </div>
    );
  }

  if (!sudahMasuk) {
    return (
      <div className="card-pad">
        <p className="text-2xl font-extrabold text-tinta-900">
          {rupiah(price)}
          <span className="ml-1 text-sm font-semibold text-tinta-600">
            {priceUnitLabel(priceUnit)}
          </span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-tinta-600">
          Masuk dengan akunmu untuk memesan layanan ini. Pendaftaran gratis dan hanya butuh satu
          menit.
        </p>
        <Link href={`/masuk?tujuan=/layanan/${slug}`} className="btn-primary btn-block mt-4">
          Masuk untuk memesan
        </Link>
        <Link href="/daftar" className="btn-secondary btn-block mt-2">
          Belum punya akun? Daftar
        </Link>
      </div>
    );
  }

  return (
    <ActionForm action={buatPesanan} className="card-pad space-y-4">
      <input type="hidden" name="slug" value={slug} />

      <div>
        <p className="text-2xl font-extrabold text-tinta-900">
          {rupiah(price)}
          <span className="ml-1 text-sm font-semibold text-tinta-600">
            {priceUnitLabel(priceUnit)}
          </span>
        </p>
      </div>

      <div>
        <label className="label" htmlFor="quantity">
          Jumlah
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="btn-secondary size-10 shrink-0 p-0 text-lg"
            aria-label="Kurangi jumlah"
          >
            −
          </button>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            className="input text-center"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="btn-secondary size-10 shrink-0 p-0 text-lg"
            aria-label="Tambah jumlah"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="scheduledAt">
          Tanggal dibutuhkan <span className="font-normal text-tinta-500">(opsional)</span>
        </label>
        <input id="scheduledAt" name="scheduledAt" type="date" className="input" />
      </div>

      <div>
        <label className="label" htmlFor="contactPhone">
          Nomor WhatsApp aktif
        </label>
        <input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          required
          defaultValue={teleponAwal}
          placeholder="081234567890"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="note">
          Catatan untuk penyedia <span className="font-normal text-tinta-500">(opsional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          placeholder="Contoh: materi yang ingin dibahas, tema desain, atau lokasi acara."
          className="textarea"
        />
      </div>

      {/* Rincian biaya — transparan sejak sebelum memesan */}
      <dl className="space-y-1.5 border-t border-krem-200 pt-4 text-sm">
        <Baris label={`Subtotal (${quantity}×)`} nilai={rupiah(subtotal)} />
        <Baris label="Biaya administrasi" nilai={rupiah(adminFee)} />
        <div className="flex items-center justify-between border-t border-krem-200 pt-2 text-base font-extrabold text-tinta-900">
          <dt>Total bayar</dt>
          <dd className="tabular-nums">{rupiah(subtotal + adminFee)}</dd>
        </div>
      </dl>

      <SubmitButton className="btn-primary btn-block" pendingLabel="Membuat pesanan…">
        Pesan Sekarang
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-tinta-600">
        Pembayaran baru dilakukan setelah penyedia menerima pesananmu.
      </p>
    </ActionForm>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-center justify-between text-tinta-700">
      <dt>{label}</dt>
      <dd className="tabular-nums">{nilai}</dd>
    </div>
  );
}
