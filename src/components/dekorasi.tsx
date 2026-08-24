/**
 * Aset visual GDV KM ITB 2026/2027.
 *
 * Radiant + Flowing — bentuk organis seperti aliran air dan sinar cahaya,
 *   diisi gradien dua warna lalu diberi blur. Dipakai sebagai latar.
 * Striking — lingkaran dan setengah lingkaran solid warna-warni, berbagai
 *   ukuran, tersebar namun tetap tertata. Dipakai sebagai aksen.
 *
 * Catatan GDV hlm. 13: aset "striking" untuk konten yang lebih santai,
 * "flowing" untuk konten serius. Halaman pemasaran memakai keduanya;
 * halaman dasbor cukup flowing yang tipis.
 */

type Warna =
  | "merah"
  | "kuning"
  | "mint"
  | "biru"
  | "pink"
  | "ungu"
  | "tosca"
  | "lime"
  | "oranye";

const ISI: Record<Warna, string> = {
  merah: "var(--color-merah-500)",
  kuning: "var(--color-kuning-400)",
  mint: "var(--color-mint-300)",
  biru: "var(--color-biru-500)",
  pink: "var(--color-pink-500)",
  ungu: "var(--color-ungu-500)",
  tosca: "var(--color-tosca-500)",
  lime: "var(--color-lime-300)",
  oranye: "var(--color-oranye-500)",
};

/** Satu bentuk organis bergradien dua warna dengan blur. */
export function Flowing({
  dari,
  ke,
  className = "",
  opacity = 0.5,
  animasi = false,
}: {
  dari: Warna;
  ke: Warna;
  className?: string;
  opacity?: number;
  animasi?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`flowing ${animasi ? "flowing-lambat" : ""} ${className}`}
      style={{
        opacity,
        backgroundImage: `linear-gradient(135deg, ${ISI[dari]}, ${ISI[ke]})`,
      }}
    />
  );
}

/** Lingkaran solid — aksen "striking". */
export function Bulat({
  warna,
  className = "",
  cincin = false,
}: {
  warna: Warna;
  className?: string;
  cincin?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={
        cincin
          ? { border: `3px solid ${ISI[warna]}` }
          : { backgroundColor: ISI[warna] }
      }
    />
  );
}

/** Setengah lingkaran solid — aksen "striking". */
export function Setengah({
  warna,
  className = "",
  arah = "atas",
}: {
  warna: Warna;
  className?: string;
  arah?: "atas" | "bawah" | "kiri" | "kanan";
}) {
  const radius = {
    atas: "9999px 9999px 0 0",
    bawah: "0 0 9999px 9999px",
    kiri: "9999px 0 0 9999px",
    kanan: "0 9999px 9999px 0",
  }[arah];

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={{ backgroundColor: ISI[warna], borderRadius: radius }}
    />
  );
}

/**
 * Latar hero: kombinasi flowing bergradien dengan beberapa aksen striking,
 * disusun menyebar namun tetap tertata seperti contoh layout pada GDV.
 */
export function LatarHero() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <Flowing dari="merah" ke="pink" className="-top-28 -right-16 size-[26rem]" opacity={0.42} animasi />
      <Flowing dari="ungu" ke="biru" className="top-24 -right-40 size-80" opacity={0.3} animasi />
      <Flowing dari="kuning" ke="mint" className="-bottom-24 -left-28 size-[22rem]" opacity={0.35} animasi />
      <Flowing dari="mint" ke="biru" className="top-1/2 left-1/3 size-64" opacity={0.16} />

      <Bulat warna="kuning" className="top-20 right-[22%] size-4" />
      <Bulat warna="biru" className="top-44 right-[12%] size-2.5" />
      <Bulat warna="merah" className="top-[38%] right-[30%] size-3" />
      <Bulat warna="ungu" className="top-64 left-[6%] size-3.5 opacity-70" />
      <Bulat warna="tosca" className="bottom-24 left-[24%] size-2.5" />
      <Bulat warna="pink" className="top-32 left-[42%] size-2" />
      <Bulat warna="lime" className="bottom-40 right-[8%] size-5 opacity-80" cincin />
      <Setengah warna="kuning" className="top-[30%] left-[-1rem] h-16 w-8" arah="kanan" />
    </div>
  );
}

/** Latar tipis untuk bagian dalam halaman — hanya flowing, tanpa aksen ramai. */
export function LatarLembut({
  className = "",
  varian = "hangat",
}: {
  className?: string;
  varian?: "hangat" | "sejuk" | "radiant";
}) {
  const pasangan: Record<typeof varian, [[Warna, Warna], [Warna, Warna]]> = {
    hangat: [
      ["merah", "kuning"],
      ["oranye", "pink"],
    ],
    sejuk: [
      ["biru", "mint"],
      ["tosca", "lime"],
    ],
    radiant: [
      ["merah", "ungu"],
      ["biru", "mint"],
    ],
  };
  const [a, b] = pasangan[varian];

  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
      <Flowing dari={a[0]} ke={a[1]} className="-top-32 -left-24 size-[24rem]" opacity={0.22} />
      <Flowing dari={b[0]} ke={b[1]} className="-right-28 -bottom-28 size-80" opacity={0.18} />
    </div>
  );
}
