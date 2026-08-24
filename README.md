# Bermakna Enterprise

**Marketplace jasa mahasiswa ITB, terintegrasi.**
Program Mahasiswa Wirausaha 2026 · Kabinet Bermakna KM ITB 2026/2027

> *“From Us, For Together.”*

Platform berbasis web yang mempertemukan penyedia dan pengguna jasa mahasiswa dalam satu
ekosistem yang transparan, terpercaya, dan mudah diakses — dari tutor akademik, konsultasi
karier, jasa desain dan dokumentasi, hingga pencarian tempat tinggal.

---

## Menyiapkan Supabase

Aplikasi ini memakai Supabase untuk **database (PostgreSQL)** dan **penyimpanan berkas**.
Perlu dilakukan sekali di awal, sekitar sepuluh menit.

### 1. Buat proyek

Masuk ke [supabase.com](https://supabase.com) → **New project**.

| Isian             | Nilai                                                          |
| ----------------- | -------------------------------------------------------------- |
| Name              | `bermakna-enterprise`                                            |
| Database Password | Buat yang kuat — **simpan baik-baik**, dipakai di `DATABASE_URL` |
| Region            | **Southeast Asia (Singapore)** — paling dekat dari Indonesia     |
| Plan              | Free                                                             |

Tunggu sekitar dua menit sampai proyek selesai disiapkan.

### 2. Buat dua bucket penyimpanan

Menu **Storage** → **New bucket**. Buat **dua** bucket dengan nama persis seperti ini:

| Nama bucket        | Public bucket   | Isinya                                     |
| ------------------ | --------------- | ------------------------------------------ |
| `bermakna-publik`  | ✅ **dicentang** | Foto layanan, portofolio, avatar            |
| `bermakna-privat`  | ❌ **kosongkan** | **Foto KTM dan bukti transfer**             |

> Centang pada `bermakna-privat` harus benar-benar kosong. Bucket inilah yang menyimpan
> data pribadi mahasiswa. Berkasnya hanya bisa dibuka lewat tautan bertanda tangan yang
> dibuat server dan kedaluwarsa dalam satu jam. Skrip `npm run cek:supabase` akan menolak
> lanjut kalau bucket ini ternyata publik.

### 3. Ambil kredensial

Salin `.env.example` menjadi `.env`, lalu isi empat nilai berikut:

**Database** — dari dashboard proyek, klik tombol **Connect** → tab **ORMs** → pilih **Prisma**.
Ganti `[YOUR-PASSWORD]` dengan sandi database dari langkah 1.

- `DATABASE_URL` → **Transaction pooler**, port `6543`
- `DIRECT_URL` → **Session pooler**, port `5432`

**Storage** — dari menu **Settings ▸ API Keys**.

- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `SUPABASE_SECRET_KEY` → dari bagian **Secret keys**, nilainya diawali `sb_secret_`

> Supabase menyediakan dua jenis kunci. Yang dibutuhkan di sini adalah **secret key**,
> bukan *publishable key*. Kunci `service_role` lama (format JWT, diawali `eyJ`) masih
> diterima aplikasi, tetapi dipensiunkan Supabase akhir 2026 — untuk proyek baru pakai
> `sb_secret_`.

> Kunci ini mengabaikan seluruh Row Level Security. Simpan hanya di `.env` (sudah masuk
> `.gitignore`), jangan pernah dikirim lewat grup chat atau ikut ter-commit.

### 4. Periksa dan jalankan

```bash
npm install
npm run cek:supabase   # memastikan koneksi, bucket, dan izinnya sudah benar
npm run setup          # buat tabel + isi data contoh
npm run dev            # http://localhost:3000
```

`npm run cek:supabase` menguji koneksi database, keberadaan kedua bucket, lalu benar-benar
mengunggah berkas uji, membuat tautan bertanda tangan, memastikan bucket privat menolak
akses langsung, dan menghapusnya lagi. Kalau ada yang keliru, pesannya menyebutkan menu
persis yang perlu dibuka.

---

## Akun demo

Tersedia setelah `npm run setup`, dan juga ditampilkan di halaman **Masuk**.

| Peran           | Email                       | Kata sandi     |
| --------------- | --------------------------- | -------------- |
| Pengguna jasa   | `nadia@students.itb.ac.id`  | `pengguna123`  |
| Penyedia jasa   | `alya@students.itb.ac.id`   | `penyedia123`  |
| Administrator   | `admin@bermakna.id`         | `admin123`     |

Penyedia lain memakai kata sandi yang sama (`penyedia123`): `bimo@`, `citra@`, `damar@`,
`elang@`, `farah@`, `gilang@`, `hana@`, `ivan@` — semuanya `@students.itb.ac.id`.
Akun `ivan@` sengaja dibiarkan berstatus **menunggu verifikasi** supaya alur verifikasi
penyedia bisa langsung dicoba dari Dashboard Administrasi.

---

## Delapan sistem inti (sesuai proposal, hlm. 6)

| # | Sistem                  | Ada di                                             |
| - | ----------------------- | -------------------------------------------------- |
| 1 | Dashboard Pengguna      | `/dashboard`                                        |
| 2 | Dashboard Penyedia Jasa | `/mitra`                                            |
| 3 | Pencarian Layanan       | `/jelajah` — filter kategori, kampus, harga, urutan |
| 4 | Sistem Pemesanan        | `/layanan/[slug]` → `/dashboard/pesanan/[kode]`     |
| 5 | Rating & Review         | Hanya dari pembeli dengan pesanan **selesai**       |
| 6 | Dashboard Administrasi  | `/admin`                                            |
| 7 | Verifikasi Penyedia     | `/jadi-penyedia` → `/admin/verifikasi`              |
| 8 | Database Transaksi      | `/admin/transaksi` + ekspor CSV                     |

### Sepuluh kategori layanan

Tutor Akademik · Mentor Kompetisi · Konsultasi Akademik · Jasa Desain Grafis ·
Jasa Dokumentasi · Video Editing · Event & Manpower · Kos & Kontrakan ·
Penerjemahan Dokumen · Jasa Digital & Kreatif Lainnya

---

## Alur transaksi

```
                   pembeli          penyedia          admin
                      │                 │               │
  Pesan layanan  ─────┤                 │               │
                      ▼                 │               │
       MENUNGGU_KONFIRMASI ─────────────┤               │
                      │        terima   ▼               │
       MENUNGGU_PEMBAYARAN ◄────────────┘               │
                      │                                 │
  Unggah bukti   ─────┤                                 │
                      ▼                                 │
       MENUNGGU_VERIFIKASI ─────────────────────────────┤
                      │                       verifikasi▼
              DIKERJAKAN ◄────────────────────────────-─┘
                      │                 │
                      │   tandai selesai▼
                  SELESAI ◄─────────────┘
                      │
  Tulis review   ─────┘
```

Pembeli bisa membatalkan selama status masih `MENUNGGU_KONFIRMASI` atau
`MENUNGGU_PEMBAYARAN`. Penyedia bisa menolak dengan alasan tertulis. Setiap perubahan
status tercatat di linimasa pesanan sebagai jejak audit dan memicu notifikasi in-app.

### Perhitungan biaya

Diatur admin di `/admin/pengaturan` (bawaan: komisi **8%**, biaya administrasi **Rp 2.000**).

```
Pembeli bayar       = subtotal + biaya administrasi
Penyedia terima     = subtotal − komisi layanan
Pendapatan platform = biaya administrasi + komisi layanan
```

Tarif dikunci pada saat pesanan dibuat, jadi mengubah pengaturan tidak akan mengacaukan
catatan transaksi lama.

---

## Penanganan berkas & data pribadi

Berkas unggahan dipisahkan ke dua bucket menurut sensitivitasnya:

| Bucket             | Isi                                     | Cara diakses                                        |
| ------------------ | --------------------------------------- | --------------------------------------------------- |
| `bermakna-publik`  | Foto layanan, portofolio, avatar         | URL publik biasa — memang untuk dilihat umum         |
| `bermakna-privat`  | **Foto KTM, bukti transfer**             | Signed URL yang dibuat server, kedaluwarsa **1 jam** |

Berkas privat hanya dibuatkan tautannya pada tiga halaman, itu pun setelah pemeriksaan
peran di server:

- `/admin/verifikasi` — KTM, hanya admin
- `/admin/pembayaran` — bukti transfer, hanya admin
- `/dashboard/pesanan/[kode]` — bukti transfer, hanya pembeli pesanan itu sendiri

Yang tersimpan di database adalah *path* berkas, bukan URL. Jadi walau seseorang membaca
isi tabel, ia tetap tidak bisa membuka berkasnya.

Semua gambar dikompresi di server memakai `sharp` sebelum diunggah: diputar sesuai
orientasi EXIF, diperkecil (maksimal 512–2000 px tergantung jenisnya), lalu diubah ke
WebP. Foto ponsel 3–5 MB biasanya turun ke bawah 200 KB — penting karena kuota
penyimpanan Supabase paket gratis hanya 1 GB.

---

## Deploy ke Vercel

**Berkas `.env` tidak ikut ter-commit** (memang sengaja — isinya rahasia). Karena itu
Vercel tidak mendapat satu pun variabel dari repositori; semuanya harus dimasukkan
manual di **Vercel ▸ Settings ▸ Environment Variables**, lalu **Redeploy**.

Lima variabel yang wajib ada, untuk environment *Production*, *Preview*, dan *Development*:

| Variabel                    | Sumber                                                |
| --------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`              | Supabase ▸ Connect ▸ ORMs ▸ Transaction pooler (6543)  |
| `DIRECT_URL`                | Supabase ▸ Connect ▸ ORMs ▸ Session pooler (5432)      |
| `NEXT_PUBLIC_SUPABASE_URL`  | Supabase ▸ Settings ▸ API Keys ▸ Project URL           |
| `SUPABASE_SECRET_KEY`       | Supabase ▸ Settings ▸ API Keys ▸ Secret keys           |
| `SESSION_SECRET`            | Buat baru, jangan pakai nilai yang sama dengan lokal   |

> Menambahkan variabel **tidak** otomatis menerapkannya. Setelah menyimpan, buka tab
> **Deployments** lalu **Redeploy** — deployment lama tetap memakai konfigurasi lamanya.

### Memeriksa hasil deploy

Buka `/api/diagnostik` pada domain yang bersangkutan, misalnya
`https://namaproyek.vercel.app/api/diagnostik`. Endpoint itu melaporkan variabel mana
yang terisi, host database yang dipakai, serta hasil uji koneksi database dan storage —
**tanpa pernah menampilkan kata sandi atau kunci** (semuanya disamarkan).

Balasan `"sehat": true` berarti konfigurasi sudah benar. Setelah itu **hapus
`src/app/api/diagnostik/route.ts`** agar tidak ikut tayang di produksi.

### Catatan teknis

- `binaryTargets` pada `prisma/schema.prisma` menyertakan `rhel-openssl-3.0.x`, yaitu
  runtime serverless Vercel. Tanpa itu Prisma bisa gagal menemukan query engine dan
  setiap query berujung galat 500, meski build-nya sukses.
- `next build` sengaja tidak menyentuh database, jadi build tetap berhasil walaupun
  variabel database belum diatur. Konsekuensinya, kesalahan konfigurasi baru terlihat
  saat halaman dibuka — bukan saat build.

---

## Identitas visual

Seluruh antarmuka mengikuti **Grand Design Visual KM ITB 2026/2027**.

**Palet** — warna utama `#D81623` `#FFE030` `#9CF0E1` `#176BFF`, sekunder
`#970F18` `#094E2C` `#08266E` `#E57B12` `#1A844F` `#22A980` `#CEF564` `#FFF8E5`
`#151515`, aksen `#F137A6` `#A500FD`. Semuanya terdaftar sebagai token di
`src/app/globals.css`; tidak ada warna di luar palet ini.

**Font** — *Tilt Warp* untuk heading (ditulis kapital) dan *Aleo* untuk
subheading, body, serta seluruh elemen antarmuka. Keduanya dimuat lewat
`next/font`, jadi tidak ada permintaan ke server font pihak ketiga saat runtime.

**Kata kunci** diterjemahkan ke komponen di `src/components/dekorasi.tsx`:

| Kata kunci GDV | Wujud di aplikasi                                                     |
| -------------- | --------------------------------------------------------------------- |
| Radiant        | Gradien warna-warni pada tombol, judul, dan kartu (`pita-radiant` dll.) |
| Flowing        | `<Flowing>` — bentuk organis bergradien dengan blur, sebagai latar      |
| Striking       | `<Bulat>` dan `<Setengah>` — lingkaran solid sebagai aksen             |

**Perlakuan huruf** — `<JudulGDV>` di `src/components/judul.tsx` menerapkan
aturan Font Guide hlm. 15: tiap kata kapital dengan Tilt Warp, huruf pertama
dan terakhirnya memakai Aleo. Dipakai pada judul hero.

**Pembagian warna** — mengikuti pola GDV hlm. 5 yang memberi tiap kemenkoan satu
warna, sepuluh kategori layanan juga mendapat warnanya sendiri lewat
`warnaKategori()` di `src/lib/constants.ts`, dipakai pada kartu dan sampul.

> Catatan SOP GDV: setiap desain wajib melalui asistensi Menteri/Wamenteri
> Media Kreatif. Tampilan ini disusun mengikuti panduan, tetapi belum
> diasistensi — ajukan terlebih dahulu sebelum dipublikasikan luas.

---

## Perintah yang tersedia

| Perintah              | Kegunaan                                                          |
| --------------------- | ----------------------------------------------------------------- |
| `npm run dev`         | Server pengembangan di port 3000                                   |
| `npm run build`       | Build produksi (tidak memerlukan koneksi database)                 |
| `npm start`           | Menjalankan hasil build produksi                                   |
| `npm run setup`       | Buat tabel + isi data contoh (sekali di awal)                      |
| `npm run cek:supabase`| Periksa koneksi, bucket, dan izin penyimpanan                      |
| `npm run cek:rute`    | Smoke test seluruh halaman & penjagaan akses (server harus hidup)  |
| `npm run db:push`     | Terapkan perubahan skema ke database                               |
| `npm run db:seed`     | Isi ulang data contoh                                              |
| `npm run db:reset`    | Sinkronkan skema lalu isi ulang data contoh                        |
| `npm run db:deploy`   | Terapkan migrasi di produksi                                       |
| `npm run db:studio`   | Prisma Studio — lihat & ubah isi database lewat browser            |
| `npm run lint`        | Pemeriksaan ESLint                                                 |

---

## Struktur proyek

```
prisma/
  schema.prisma          Skema basis data (12 model)
  seed.ts                Data awal: kategori, akun demo, layanan, transaksi
scripts/
  cek-supabase.mjs       Pemeriksa koneksi & konfigurasi Supabase
  cek-rute.mjs           Smoke test rute untuk semua peran
src/
  app/
    (situs)/             Halaman publik + landing pitch PMW
    (auth)/              Masuk & daftar
    dashboard/           Dashboard Pengguna
    mitra/               Dashboard Penyedia Jasa
    admin/               Dashboard Administrasi
    api/keluar/          Endpoint logout
  actions/               Server Action (auth, order, review, provider, admin)
  components/            Komponen UI yang dipakai bersama
  lib/
    auth.ts              Sesi, hash kata sandi, penjagaan peran
    supabase.ts          Klien Supabase sisi server + nama bucket
    upload.ts            Kompresi gambar, unggah, signed URL
    constants.ts         Status, kategori, satuan harga, target proposal
    settings.ts          Pengaturan platform & perhitungan biaya
    format.ts            Format rupiah, tanggal, slug, tautan WhatsApp
```

### Teknologi

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Prisma · **Supabase** (PostgreSQL + Storage) · sharp.

Autentikasi ditangani sendiri memakai `node:crypto` bawaan — kata sandi di-hash dengan
**scrypt**, sesi disimpan pada cookie `httpOnly` bertanda tangan **HMAC-SHA256**.
Supabase Auth sengaja tidak dipakai: seluruh akses database berjalan di server lewat
Prisma, tidak pernah dari browser, sehingga Row Level Security tidak diperlukan dan
alur verifikasi penyedia tetap sepenuhnya di tangan pengurus.

---

## Catatan operasional

**Proyek Supabase paket gratis di-pause setelah satu minggu tanpa aktivitas.** Kalau ini
terjadi menjelang presentasi PMW, aplikasi tidak bisa membaca data sampai proyeknya
diaktifkan kembali dari dashboard. Biasakan membuka dashboard atau situsnya minimal
seminggu sekali, dan pastikan sudah aktif sehari sebelum penilaian.

Batas paket gratis: 500 MB database, 1 GB penyimpanan berkas, 5 GB egress per bulan,
maksimal 2 proyek aktif. Untuk target tahun pertama (500 pengguna, 150 penyedia,
200 transaksi) yang paling cepat penuh adalah **penyimpanan berkas**, bukan database —
karena itu kompresi gambar dipasang sejak awal. Paket Pro seharga $25/bulan setara
sekitar Rp 4,8 juta setahun, sementara pos *Operating & Infrastructure* pada RAB hanya
Rp 1,2 juta — jadi rencanakan lebih dulu kalau memang perlu naik paket.

`next build` sengaja tidak menyentuh database sama sekali, sehingga deploy tetap berhasil
walaupun proyek Supabase sedang tidak aktif.

## Sebelum menerima pengguna sungguhan

1. **Ganti `SESSION_SECRET`** dengan nilai acak baru:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **Hapus data contoh.** Jalankan `npm run db:seed` untuk mengosongkan lalu mengisi ulang,
   atau hapus akun demo satu per satu dari `/admin/pengguna`.
3. **Ganti rekening penampungan** di `/admin/pengaturan` menjadi rekening resmi
   Bermakna Enterprise sebelum menerima pembayaran.
4. **Tetapkan kebijakan penyimpanan KTM.** Berkasnya sudah tertutup, tetapi tetap perlu
   disepakati berapa lama disimpan setelah verifikasi selesai dan siapa yang berhak
   membukanya. Helper `hapusBerkasPrivat()` di `src/lib/upload.ts` sudah tersedia untuk
   menghapusnya.

---

Narahubung: Tarisha · tarishazp@gmail.com
