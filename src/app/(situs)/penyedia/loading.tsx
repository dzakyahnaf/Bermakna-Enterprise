import { BilahMemuat, Kerangka, KerangkaJudul } from "@/components/memuat";

export default function Memuat() {
  return (
    <div className="wrap py-10">
      <BilahMemuat />
      <KerangkaJudul />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5" aria-hidden>
            <div className="flex items-start gap-3">
              <Kerangka className="size-13 rounded-full" />
              <div className="flex-1 space-y-2">
                <Kerangka className="h-4 w-4/5" />
                <Kerangka className="h-3 w-3/5" />
              </div>
            </div>
            <Kerangka className="mt-4 h-3.5 w-full" />
            <Kerangka className="mt-4 h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
