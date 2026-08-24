/** Bentuk balikan seragam untuk seluruh Server Action berbasis formulir. */
export type ActionState = { error?: string; success?: string } | null;

export function gagal(error: string): ActionState {
  return { error };
}

export function berhasil(success: string): ActionState {
  return { success };
}

/** Membaca field teks wajib dari FormData. */
export function teks(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Membaca field angka dari FormData. */
export function angkaDari(formData: FormData, key: string, fallback = 0): number {
  const value = Number(teks(formData, key).replace(/[^\d-]/g, ""));
  return Number.isFinite(value) ? value : fallback;
}

export function berkas(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}
