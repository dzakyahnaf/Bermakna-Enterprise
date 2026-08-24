import { BilahMemuat, Kerangka, KerangkaJudul } from "@/components/memuat";

export default function Memuat() {
  return (
    <div className="wrap py-10">
      <BilahMemuat />
      <KerangkaJudul />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="card p-6" aria-hidden>
            <Kerangka className="size-14 rounded-2xl" />
            <Kerangka className="mt-4 h-5 w-3/5" />
            <Kerangka className="mt-2 h-3.5 w-full" />
            <Kerangka className="mt-4 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
