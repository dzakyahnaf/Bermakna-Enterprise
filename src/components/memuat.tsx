/**
 * Umpan balik saat halaman sedang dimuat.
 *
 * Halaman di aplikasi ini dirender di server dan menyentuh database, sehingga
 * ada jeda sebelum isinya muncul. Berkas loading.tsx pada tiap segmen memakai
 * komponen di sini agar pengguna langsung melihat sesuatu terjadi begitu
 * menekan tautan — bukan layar yang membeku tanpa penjelasan.
 */

/** Bilah kemajuan bergradien radiant di puncak layar. */
export function BilahMemuat() {
  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-krem-200"
      role="status"
      aria-label="Halaman sedang dimuat"
    >
      <div className="pita-radiant h-full w-1/3 animate-[meluncur_1.1s_ease-in-out_infinite] rounded-full" />
    </div>
  );
}

/** Blok abu berkilau sebagai pengganti konten yang belum datang. */
export function Kerangka({ className = "" }: { className?: string }) {
  return <div className={`berkilau rounded-lg bg-krem-200 ${className}`} aria-hidden />;
}

/** Beberapa baris teks tiruan. */
export function KerangkaTeks({
  baris = 3,
  className = "",
}: {
  baris?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: baris }).map((_, i) => (
        <Kerangka key={i} className={`h-3.5 ${i === baris - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

/** Tiruan satu kartu layanan pada hasil pencarian. */
export function KerangkaKartuLayanan() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <Kerangka className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-4">
        <Kerangka className="h-4 w-4/5" />
        <KerangkaTeks baris={2} />
        <div className="flex items-center gap-2 pt-1">
          <Kerangka className="size-6 rounded-full" />
          <Kerangka className="h-3 w-24" />
        </div>
        <div className="flex items-center justify-between border-t border-krem-200 pt-3">
          <Kerangka className="h-3 w-20" />
          <Kerangka className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

/** Grid kartu layanan. */
export function KerangkaGridLayanan({ jumlah = 6 }: { jumlah?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: jumlah }).map((_, i) => (
        <KerangkaKartuLayanan key={i} />
      ))}
    </div>
  );
}

/** Baris kartu statistik dasbor. */
export function KerangkaStat({ jumlah = 4 }: { jumlah?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: jumlah }).map((_, i) => (
        <div key={i} className="card-pad" aria-hidden>
          <Kerangka className="h-3 w-24" />
          <Kerangka className="mt-3 h-7 w-20" />
          <Kerangka className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

/** Daftar baris pesanan. */
export function KerangkaDaftar({ jumlah = 4 }: { jumlah?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: jumlah }).map((_, i) => (
        <div key={i} className="card flex flex-wrap items-center gap-4 p-4" aria-hidden>
          <Kerangka className="size-11 rounded-xl" />
          <div className="min-w-40 flex-1 space-y-2">
            <Kerangka className="h-4 w-3/5" />
            <Kerangka className="h-3 w-2/5" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Kerangka className="h-5 w-28 rounded-full" />
            <Kerangka className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tabel data. */
export function KerangkaTabel({ baris = 6 }: { baris?: number }) {
  return (
    <div className="card p-4" aria-hidden>
      <Kerangka className="h-3 w-full" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: baris }).map((_, i) => (
          <Kerangka key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Kepala halaman: judul + keterangan. */
export function KerangkaJudul() {
  return (
    <div className="mb-6" aria-hidden>
      <Kerangka className="h-3 w-32" />
      <Kerangka className="mt-3 h-8 w-72 max-w-full" />
      <Kerangka className="mt-3 h-3.5 w-96 max-w-full" />
    </div>
  );
}
