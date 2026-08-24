"use client";

import { useState } from "react";

const LABEL = ["", "Kurang sekali", "Kurang", "Cukup", "Bagus", "Sangat bagus"];

/** Pemilih rating bintang untuk formulir review. */
export function RatingInput({ name = "rating" }: { name?: string }) {
  const [nilai, setNilai] = useState(5);
  const [hover, setHover] = useState(0);
  const tampil = hover || nilai;

  return (
    <div>
      <input type="hidden" name={name} value={nilai} />
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setNilai(i)}
              onMouseEnter={() => setHover(i)}
              className="rounded p-0.5 transition-transform hover:scale-110"
              aria-label={`Beri ${i} bintang`}
              aria-pressed={nilai === i}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 20 20"
                fill={i <= tampil ? "var(--color-kuning-400)" : "var(--color-krem-300)"}
              >
                <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.78l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85z" />
              </svg>
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold text-tinta-700">{LABEL[tampil]}</span>
      </div>
    </div>
  );
}
