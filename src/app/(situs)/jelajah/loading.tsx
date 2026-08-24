import {
  BilahMemuat,
  Kerangka,
  KerangkaGridLayanan,
  KerangkaJudul,
} from "@/components/memuat";

export default function Memuat() {
  return (
    <div className="wrap py-10">
      <BilahMemuat />
      <KerangkaJudul />
      <Kerangka className="mb-8 h-16 w-full rounded-2xl" />

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="card-pad space-y-3" aria-hidden>
            <Kerangka className="h-4 w-20" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Kerangka key={i} className="h-3.5 w-full" />
            ))}
          </div>
        </aside>
        <KerangkaGridLayanan />
      </div>
    </div>
  );
}
