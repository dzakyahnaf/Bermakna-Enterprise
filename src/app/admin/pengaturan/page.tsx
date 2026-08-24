import type { Metadata } from "next";

import { simpanPengaturan } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/dashboard-shell";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Pengaturan Platform" };

export default async function PengaturanPlatform() {
  await requireAdmin();
  const settings = await getSettings();

  const contoh = 100000;
  const komisiContoh = Math.round((contoh * settings.commissionPercent) / 100);

  return (
    <>
      <PageHeader
        title="Pengaturan Platform"
        description="Mengatur revenue stream dan rekening penampungan sesuai model bisnis pada proposal."
      />

      <div className="mb-6">
        <Alert tone="info" title="Simulasi dengan tarif saat ini">
          Untuk layanan seharga <strong>Rp 100.000</strong>: pembeli membayar{" "}
          <strong>Rp {(contoh + settings.adminFee).toLocaleString("id-ID")}</strong>, penyedia
          menerima <strong>Rp {(contoh - komisiContoh).toLocaleString("id-ID")}</strong>, dan
          platform memperoleh{" "}
          <strong>Rp {(settings.adminFee + komisiContoh).toLocaleString("id-ID")}</strong>.
        </Alert>
      </div>

      <ActionForm action={simpanPengaturan} className="space-y-6">
        <section className="card-pad space-y-4">
          <h2 className="text-lg font-bold">Revenue stream</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="commission_percent">
                Komisi layanan (%)
              </label>
              <input
                id="commission_percent"
                name="commission_percent"
                type="number"
                min={0}
                max={50}
                step={0.5}
                required
                defaultValue={settings.commissionPercent}
                className="input"
              />
              <p className="hint">Dipotong dari pendapatan penyedia saat pesanan dibuat.</p>
            </div>

            <div>
              <label className="label" htmlFor="admin_fee">
                Biaya administrasi (Rp)
              </label>
              <input
                id="admin_fee"
                name="admin_fee"
                type="number"
                min={0}
                step={500}
                required
                defaultValue={settings.adminFee}
                className="input"
              />
              <p className="hint">Ditambahkan ke total yang dibayar pembeli, per pesanan.</p>
            </div>
          </div>

          <p className="rounded-xl bg-krem-100 px-4 py-3 text-xs leading-relaxed text-tinta-700">
            Perubahan tarif hanya berlaku untuk pesanan baru. Pesanan yang sudah dibuat tetap
            memakai tarif yang berlaku saat itu, sehingga catatan transaksi lama tidak berubah.
          </p>
        </section>

        <section className="card-pad space-y-4">
          <h2 className="text-lg font-bold">Rekening penampungan</h2>
          <p className="-mt-2 text-sm text-tinta-600">
            Rekening ini ditampilkan ke pembeli pada instruksi pembayaran.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bank_name">
                Nama bank
              </label>
              <input
                id="bank_name"
                name="bank_name"
                required
                defaultValue={settings.bankName}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="bank_account">
                Nomor rekening
              </label>
              <input
                id="bank_account"
                name="bank_account"
                required
                inputMode="numeric"
                defaultValue={settings.bankAccount}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="bank_holder">
              Atas nama
            </label>
            <input
              id="bank_holder"
              name="bank_holder"
              required
              defaultValue={settings.bankHolder}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="support_whatsapp">
              WhatsApp pengurus
            </label>
            <input
              id="support_whatsapp"
              name="support_whatsapp"
              defaultValue={settings.supportWhatsapp}
              placeholder="6281234567890"
              className="input"
            />
            <p className="hint">Format internasional tanpa tanda plus, contoh: 6281234567890.</p>
          </div>

          <div>
            <label className="label" htmlFor="instagram_url">
              Instagram Bermakna Enterprise
            </label>
            <input
              id="instagram_url"
              name="instagram_url"
              type="url"
              defaultValue={settings.instagram}
              placeholder="https://instagram.com/bermaknaenterprise"
              className="input"
            />
            <p className="hint">
              Muncul sebagai tautan di footer situs. Kosongkan bila belum ada.
            </p>
          </div>
        </section>

        <SubmitButton className="btn-primary" pendingLabel="Menyimpan…">
          Simpan Pengaturan
        </SubmitButton>
      </ActionForm>
    </>
  );
}
