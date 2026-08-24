import { BilahMemuat, Kerangka, KerangkaTeks } from "@/components/memuat";

export default function Memuat() {
  return (
    <div className="wrap py-8">
      <BilahMemuat />
      <Kerangka className="mb-6 h-3 w-64" />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <Kerangka className="aspect-[16/9] w-full rounded-2xl" />
          <Kerangka className="mt-6 h-6 w-28 rounded-full" />
          <Kerangka className="mt-3 h-8 w-4/5" />
          <Kerangka className="mt-3 h-3.5 w-2/3" />
          <div className="card-pad mt-8">
            <KerangkaTeks baris={6} />
          </div>
        </div>
        <aside className="space-y-3">
          <div className="card-pad space-y-4" aria-hidden>
            <Kerangka className="h-8 w-40" />
            <Kerangka className="h-10 w-full" />
            <Kerangka className="h-10 w-full" />
            <Kerangka className="h-24 w-full" />
            <Kerangka className="h-11 w-full rounded-xl" />
          </div>
        </aside>
      </div>
    </div>
  );
}
