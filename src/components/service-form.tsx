import { buatLayanan, perbaruiLayanan } from "@/actions/provider";
import { CAMPUSES, PRICE_UNITS } from "@/lib/constants";
import { ActionForm, SubmitButton } from "@/components/action-form";

type Kategori = { id: string; name: string; icon: string };

type LayananAwal = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  price: number;
  priceUnit: string;
  campus: string;
  location: string | null;
  deliveryDays: number | null;
  coverUrl: string | null;
};

/** Formulir tambah/edit layanan. Dipakai di /mitra/layanan/baru dan …/[id]. */
export function ServiceForm({
  kategori,
  awal,
}: {
  kategori: Kategori[];
  awal?: LayananAwal;
}) {
  const edit = Boolean(awal);

  return (
    <ActionForm
      action={edit ? perbaruiLayanan : buatLayanan}
      className="space-y-6"
      encType="multipart/form-data"
    >
      {awal && <input type="hidden" name="id" value={awal.id} />}

      <section className="card-pad space-y-4">
        <h2 className="text-lg font-bold">Informasi layanan</h2>

        <div>
          <label className="label" htmlFor="title">
            Judul layanan
          </label>
          <input
            id="title"
            name="title"
            required
            minLength={10}
            maxLength={120}
            defaultValue={awal?.title}
            placeholder="Contoh: Tutor Privat Kalkulus 1 & 2 (TPB)"
            className="input"
          />
          <p className="hint">Sebutkan jasa dan sasarannya agar mudah ditemukan lewat pencarian.</p>
        </div>

        <div>
          <label className="label" htmlFor="categoryId">
            Kategori
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={awal?.categoryId ?? ""}
            className="select"
          >
            <option value="" disabled>
              Pilih kategori
            </option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.icon} {k.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="description">
            Deskripsi lengkap
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={50}
            rows={10}
            defaultValue={awal?.description}
            placeholder={
              "Jelaskan apa yang didapat pembeli, bagaimana alur pengerjaannya, dan apa saja yang termasuk.\n\nContoh:\n• Satu sesi 90 menit, daring atau tatap muka\n• Rangkuman digital setiap sesi\n• Konsultasi lewat WhatsApp di luar jam sesi"
            }
            className="textarea"
          />
          <p className="hint">
            Minimal 50 karakter. Gunakan baris baru agar mudah dibaca — format tetap terjaga.
          </p>
        </div>
      </section>

      <section className="card-pad space-y-4">
        <h2 className="text-lg font-bold">Harga & pelaksanaan</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="price">
              Harga (Rp)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              required
              min={1000}
              step={1000}
              defaultValue={awal?.price}
              placeholder="75000"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="priceUnit">
              Satuan harga
            </label>
            <select
              id="priceUnit"
              name="priceUnit"
              defaultValue={awal?.priceUnit ?? "PER_SESI"}
              className="select"
            >
              {PRICE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="campus">
              Wilayah layanan
            </label>
            <select
              id="campus"
              name="campus"
              defaultValue={awal?.campus ?? "GANESHA"}
              className="select"
            >
              {CAMPUSES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="deliveryDays">
              Estimasi pengerjaan (hari)
            </label>
            <input
              id="deliveryDays"
              name="deliveryDays"
              type="number"
              min={0}
              max={365}
              defaultValue={awal?.deliveryDays ?? ""}
              placeholder="Kosongkan bila tidak relevan"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="location">
            Lokasi detail <span className="font-normal text-tinta-500">(opsional)</span>
          </label>
          <input
            id="location"
            name="location"
            defaultValue={awal?.location ?? ""}
            placeholder="Contoh: Dago Asri, Bandung · atau: daring via Zoom"
            className="input"
          />
        </div>
      </section>

      <section className="card-pad space-y-4">
        <h2 className="text-lg font-bold">Foto layanan</h2>
        <p className="-mt-2 text-sm text-tinta-600">
          Layanan dengan foto jauh lebih sering dipesan — terutama untuk desain, dokumentasi, dan
          kos.
        </p>

        {awal?.coverUrl && (
          <div>
            <p className="label">Sampul saat ini</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={awal.coverUrl}
              alt=""
              className="h-32 rounded-xl border border-krem-300 object-cover"
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="cover">
            Foto sampul {edit && <span className="font-normal text-tinta-500">(ganti, opsional)</span>}
          </label>
          <input
            id="cover"
            name="cover"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="file-input"
          />
        </div>

        <div>
          <label className="label" htmlFor="galeri">
            Foto tambahan <span className="font-normal text-tinta-500">(maks. 6)</span>
          </label>
          <input
            id="galeri"
            name="galeri"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="file-input"
          />
          <p className="hint">Masing-masing maksimal 5 MB, format JPG/PNG/WEBP.</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <SubmitButton className="btn-primary" pendingLabel="Menyimpan…">
          {edit ? "Simpan Perubahan" : "Tayangkan Layanan"}
        </SubmitButton>
        <a href="/mitra/layanan" className="btn-secondary">
          Batal
        </a>
      </div>
    </ActionForm>
  );
}
