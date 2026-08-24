import { BilahMemuat, Kerangka } from "@/components/memuat";

export default function Memuat() {
  return (
    <div className="card p-7 sm:p-8">
      <BilahMemuat />
      <Kerangka className="h-7 w-48" />
      <Kerangka className="mt-3 h-3.5 w-64" />
      <div className="mt-6 space-y-4" aria-hidden>
        <Kerangka className="h-10 w-full" />
        <Kerangka className="h-10 w-full" />
        <Kerangka className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
