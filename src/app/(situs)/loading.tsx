import {
  BilahMemuat,
  KerangkaGridLayanan,
  KerangkaJudul,
} from "@/components/memuat";

export default function Memuat() {
  return (
    <div className="wrap py-10">
      <BilahMemuat />
      <KerangkaJudul />
      <KerangkaGridLayanan />
    </div>
  );
}
