"use client";

import { useState } from "react";

/** Galeri foto layanan/portofolio dengan gambar utama dan deretan pratinjau. */
export function Gallery({
  images,
  fallbackIcon,
  alt,
}: {
  images: string[];
  fallbackIcon: string;
  alt: string;
}) {
  const [aktif, setAktif] = useState(0);

  if (images.length === 0) {
    return (
      <div className="card flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-krem-200 via-krem-300 to-krem-400">
        <span className="text-7xl opacity-70" aria-hidden>
          {fallbackIcon}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="card aspect-[16/9] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[aktif]} alt={alt} className="size-full object-cover" />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setAktif(i)}
              className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                i === aktif ? "border-oranye-500" : "border-krem-300 hover:border-krem-400"
              }`}
              aria-label={`Lihat foto ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
