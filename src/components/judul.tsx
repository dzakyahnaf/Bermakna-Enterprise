import type { ReactNode } from "react";

/**
 * Perlakuan heading sesuai Font Guide GDV KM ITB 2026/2027 (hlm. 15):
 *
 *   "Tilt Warp + Aleo Regular — gunakan Caps Lock. Font Tilt Warp lebih
 *    mendominasi header, sedangkan font Aleo Regular digunakan di awal
 *    huruf dan akhir saja pada setiap kata."
 *
 * Jadi tiap kata ditulis kapital dengan Tilt Warp, lalu huruf pertama dan
 * huruf terakhirnya diganti Aleo. Efek ini hanya cocok pada ukuran besar,
 * karena itu dipakai untuk judul hero dan judul bagian saja.
 */
export function JudulGDV({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const kata = children.split(/(\s+)/);

  return (
    <span className={`judul ${className}`}>
      {kata.map((potongan, i) => {
        if (/^\s+$/.test(potongan)) return potongan;

        const huruf = [...potongan];
        if (huruf.length <= 2) {
          return (
            <span key={i} className="font-sans font-normal">
              {potongan}
            </span>
          );
        }

        const awal = huruf[0];
        const tengah = huruf.slice(1, -1).join("");
        const akhir = huruf[huruf.length - 1];

        return (
          <span key={i}>
            <span className="font-sans font-normal">{awal}</span>
            {tengah}
            <span className="font-sans font-normal">{akhir}</span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * Subheading dengan latar blok warna, sesuai Text Treatment GDV hlm. 17.
 * Boleh dimiringkan 4–6 derajat lewat prop `miring`.
 */
export function BlokSubjudul({
  children,
  warna = "kuning",
  miring = false,
  className = "",
}: {
  children: ReactNode;
  warna?: "kuning" | "mint" | "merah" | "biru" | "lime" | "pink";
  miring?: boolean;
  className?: string;
}) {
  const gaya: Record<string, string> = {
    kuning: "bg-kuning-400 text-tinta-900",
    mint: "bg-mint-300 text-tinta-900",
    lime: "bg-lime-300 text-tinta-900",
    merah: "bg-merah-500 text-white",
    biru: "bg-biru-500 text-white",
    pink: "bg-pink-500 text-white",
  };

  return (
    <span
      className={`subjudul inline-block rounded-md px-2.5 py-1 ${gaya[warna]} ${
        miring ? "miring-gdv" : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}
