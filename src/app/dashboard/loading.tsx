import {
  BilahMemuat,
  KerangkaDaftar,
  KerangkaJudul,
  KerangkaStat,
} from "@/components/memuat";

export default function Memuat() {
  return (
    <>
      <BilahMemuat />
      <KerangkaJudul />
      <KerangkaStat />
      <div className="mt-8">
        <KerangkaDaftar />
      </div>
    </>
  );
}
