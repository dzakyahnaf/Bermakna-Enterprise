import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klien Supabase khusus sisi server.
 *
 * Memakai service role key, sehingga BOLEH mengabaikan Row Level Security.
 * Karena itu berkas ini tidak boleh pernah diimpor dari komponen klien —
 * seluruh pemakaiannya hanya lewat Server Action dan Server Component.
 */

export const BUCKET_PUBLIK = "bermakna-publik";
export const BUCKET_PRIVAT = "bermakna-privat";

let klien: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (klien) return klien;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Supabase mengganti kunci `service_role` (JWT) dengan secret key baru
  // berawalan `sb_secret_`; yang lama dipensiunkan akhir 2026. Keduanya
  // diterima di sini supaya proyek yang sudah berjalan tidak perlu diubah.
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan " +
        "SUPABASE_SECRET_KEY pada berkas .env — lihat README bagian “Menyiapkan Supabase”.",
    );
  }

  klien = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return klien;
}

/** Menyusun URL publik sebuah objek di bucket publik. */
export function urlPublik(path: string): string {
  return supabaseAdmin().storage.from(BUCKET_PUBLIK).getPublicUrl(path).data.publicUrl;
}
