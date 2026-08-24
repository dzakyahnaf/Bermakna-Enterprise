import {
  BilahMemuat,
  KerangkaJudul,
  KerangkaStat,
  KerangkaTabel,
} from "@/components/memuat";

export default function Memuat() {
  return (
    <>
      <BilahMemuat />
      <KerangkaJudul />
      <KerangkaStat />
      <div className="mt-8">
        <KerangkaTabel />
      </div>
    </>
  );
}
