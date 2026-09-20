#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Memindahkan SELURUH data dari Supabase ke VPS: isi database + berkas
# unggahan (gambar publik, KTM, bukti transfer). Jalankan dari laptop:
#
#   bash deploy/migrasi-dari-supabase.sh
#
# Kredensial Supabase dibaca dari .env lokal dan dikirim ke server lewat
# SSH — tidak pernah ditulis ke disk server.
#
# PERHATIAN: data di VPS DIKOSONGKAN lalu diisi ulang dari Supabase. Aman
# diulang, dan memang harus diulang sekali lagi tepat sebelum DNS dipindah,
# supaya pesanan yang masuk lewat Vercel sementara itu tidak tertinggal.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

SERVER="${SERVER:-root@38.103.171.82}"
KUNCI="${KUNCI:-$HOME/.ssh/bermakna_vps}"

cd "$(git rev-parse --show-toplevel)"
# Variabel yang tidak ada menghasilkan string kosong, bukan menghentikan skrip.
nilai() { { grep -E "^$1=" .env || true; } | head -1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/'; }

# URL koneksi dipecah di sini lalu dikirim sebagai variabel PG* terpisah.
# Prisma memisahkan kredensial pada '@' TERAKHIR, sedangkan pg_dump/psql
# (libpq) pada '@' PERTAMA — sandi yang mengandung '@' diterima Prisma tetapi
# membuat libpq salah membaca nama host.
BS='\'
urldecode() { printf '%b' "${1//%/${BS}x}"; }
URL_DB="$(nilai DIRECT_URL)"
URL_DB="${URL_DB%%[?]*}"          # buang parameter khusus Prisma (?pgbouncer=…)
sisa="${URL_DB#*://}"
kredensial="${sisa%@*}"           # sampai '@' terakhir
alamat="${sisa##*@}"              # host:port/database
S_USER="$(urldecode "${kredensial%%:*}")"
S_PASS="$(urldecode "${kredensial#*:}")"
S_HOST="${alamat%%[:/]*}"
S_PORT="${alamat#"$S_HOST"}"; S_PORT="${S_PORT#:}"; S_PORT="${S_PORT%%/*}"; S_PORT="${S_PORT:-5432}"
S_DB="${alamat##*/}"
SB_URL="$(nilai NEXT_PUBLIC_SUPABASE_URL)"
SB_KEY="$(nilai SUPABASE_SECRET_KEY)"
[ -n "$SB_KEY" ] || SB_KEY="$(nilai SUPABASE_SERVICE_ROLE_KEY)"
for v in S_USER S_PASS S_HOST S_DB SB_URL SB_KEY; do
  [ -n "${!v}" ] || { echo "✗ $v kosong — periksa .env"; exit 1; }
done

{
  printf 'export S_USER=%q S_PASS=%q S_HOST=%q S_PORT=%q S_DB=%q SB_URL=%q SB_KEY=%q\n' "$S_USER" "$S_PASS" "$S_HOST" "$S_PORT" "$S_DB" "$SB_URL" "$SB_KEY"
  cat <<'JARAK_JAUH'
# Seluruh isi dibungkus fungsi: bash membaca skrip ini lewat stdin, dan perintah
# docker yang ikut membaca stdin akan "menelan" sisa skrip bila tidak dibungkus.
utama() {
set -euo pipefail
cd /opt/bermakna
C=(docker compose -f app/deploy/compose.yaml --env-file .env)
psql_lokal() { "${C[@]}" exec -T db psql -U bermakna -d bermakna -v ON_ERROR_STOP=1 "$@"; }
SUMBER=(-e PGHOST="$S_HOST" -e PGPORT="$S_PORT" -e PGUSER="$S_USER" -e PGPASSWORD="$S_PASS" -e PGDATABASE="$S_DB" -e PGSSLMODE=require)
psql_sumber() { "${C[@]}" exec -T "${SUMBER[@]}" db psql -v ON_ERROR_STOP=1 "$@"; }

HITUNG="SELECT table_name || '=' || (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1"

echo "==> Menghentikan aplikasi selama impor (Vercel tetap melayani pengunjung)"
"${C[@]}" stop caddy app >/dev/null
"${C[@]}" up -d --wait db >/dev/null

echo "==> Skema database"
"${C[@]}" --profile alat run --rm -T alat npx prisma db push --skip-generate </dev/null 2>&1 | grep -Ev '^\s*$' | tail -2

echo "==> Mengosongkan tabel di VPS"
TABEL="$(psql_lokal -Atc "SELECT string_agg(format('%I', tablename), ', ') FROM pg_tables WHERE schemaname = 'public'")"
psql_lokal -qc "TRUNCATE $TABEL CASCADE"

echo "==> Menyalin isi database dari Supabase"
"${C[@]}" exec -T "${SUMBER[@]}" db pg_dump --data-only --schema=public \
    --disable-triggers --no-owner --no-privileges \
  | psql_lokal -q >/dev/null

echo "==> Mengarahkan URL gambar ke disk server"
AWALAN="$SB_URL/storage/v1/object/public/bermakna-publik/"
psql_lokal -q -v awalan="$AWALAN" <<'SQL'
UPDATE "User"          SET "avatarUrl" = '/berkas/' || substr("avatarUrl", length(:'awalan') + 1) WHERE starts_with("avatarUrl", :'awalan');
UPDATE "Service"       SET "coverUrl"  = '/berkas/' || substr("coverUrl",  length(:'awalan') + 1) WHERE starts_with("coverUrl",  :'awalan');
UPDATE "ServiceImage"  SET "url"       = '/berkas/' || substr("url",       length(:'awalan') + 1) WHERE starts_with("url",       :'awalan');
UPDATE "PortfolioItem" SET "imageUrl"  = '/berkas/' || substr("imageUrl",  length(:'awalan') + 1) WHERE starts_with("imageUrl",  :'awalan');
SQL

echo "==> Mengunduh berkas dari Supabase Storage"
"${C[@]}" run --rm --no-deps -T -e SB_URL -e SB_KEY app node - <<'JS'
const fs = require("node:fs/promises");
const path = require("node:path");
const { SB_URL, SB_KEY } = process.env;
// Kunci sb_secret_ cukup di header apikey; kunci JWT lama juga sebagai Bearer.
const H = { apikey: SB_KEY, ...(SB_KEY.startsWith("eyJ") ? { authorization: `Bearer ${SB_KEY}` } : {}) };
const TUJUAN = { "bermakna-publik": "/data/berkas/publik", "bermakna-privat": "/data/berkas/privat" };

async function daftar(bucket, prefix = "") {
  const hasil = [];
  for (let offset = 0; ; offset += 1000) {
    const r = await fetch(`${SB_URL}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: { ...H, "content-type": "application/json" },
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
    });
    if (!r.ok) throw new Error(`gagal mendaftar ${bucket}/${prefix}: ${r.status} ${await r.text()}`);
    const isi = await r.json();
    for (const o of isi) {
      if (o.name.startsWith(".")) continue; // .emptyFolderPlaceholder
      const p = prefix ? `${prefix}/${o.name}` : o.name;
      if (o.id === null) hasil.push(...(await daftar(bucket, p)));
      else hasil.push({ p, ukuran: o.metadata?.size ?? -1 });
    }
    if (isi.length < 1000) break;
  }
  return hasil;
}

(async () => {
  let galat = 0;
  for (const [bucket, dir] of Object.entries(TUJUAN)) {
    const objek = await daftar(bucket);
    let baru = 0, ada = 0;
    for (const { p, ukuran } of objek) {
      const lokasi = path.join(dir, p);
      const sudah = await fs.stat(lokasi).catch(() => null);
      if (sudah && sudah.size === ukuran) { ada++; continue; }
      const alamat = p.split("/").map(encodeURIComponent).join("/");
      const r = await fetch(`${SB_URL}/storage/v1/object/${bucket}/${alamat}`, { headers: H });
      if (!r.ok) { galat++; console.log(`   gagal: ${bucket}/${p} (${r.status})`); continue; }
      await fs.mkdir(path.dirname(lokasi), { recursive: true });
      await fs.writeFile(lokasi, Buffer.from(await r.arrayBuffer()));
      baru++;
    }
    console.log(`   ${bucket}: ${objek.length} objek (${baru} diunduh, ${ada} sudah ada)`);
  }
  process.exit(galat ? 1 : 0);
})().catch((e) => { console.error("   gagal:", e.message); process.exit(1); });
JS

echo "==> Memeriksa: jumlah baris Supabase vs VPS"
if diff <(psql_sumber -Atc "$HITUNG") <(psql_lokal -Atc "$HITUNG"); then
  psql_lokal -Atc "$HITUNG" | sed 's/^/   ✓ /'
else
  echo "   ✗ jumlah baris berbeda (lihat di atas)"
  exit 1
fi

echo "==> Memeriksa: setiap gambar & dokumen yang dirujuk database ada di disk"
psql_lokal -At > /tmp/rujukan-berkas.txt <<'SQL'
SELECT 'publik ' || substr(u, 9) FROM (
  SELECT "avatarUrl" AS u FROM "User"
  UNION ALL SELECT "coverUrl" FROM "Service"
  UNION ALL SELECT url FROM "ServiceImage"
  UNION ALL SELECT "imageUrl" FROM "PortfolioItem") t
WHERE u LIKE '/berkas/%'
UNION ALL
SELECT 'privat ' || p FROM (
  SELECT "ktmUrl" AS p FROM "Provider"
  UNION ALL SELECT "proofUrl" FROM "Payment") t
WHERE p <> '';
SQL
hilang=0
while read -r wilayah p; do
  if [ ! -f "/var/lib/docker/volumes/bermakna_berkas_$wilayah/_data/$p" ]; then
    echo "   ✗ hilang: $wilayah/$p"
    hilang=$((hilang + 1))
  fi
done < /tmp/rujukan-berkas.txt
echo "   $(wc -l < /tmp/rujukan-berkas.txt) rujukan diperiksa, $hilang hilang"
rm -f /tmp/rujukan-berkas.txt

SISA="$(psql_lokal -At <<'SQL'
SELECT count(*) FROM (
  SELECT "avatarUrl" AS u FROM "User"
  UNION ALL SELECT "coverUrl" FROM "Service"
  UNION ALL SELECT url FROM "ServiceImage"
  UNION ALL SELECT "imageUrl" FROM "PortfolioItem") t
WHERE u LIKE '%supabase.co%';
SQL
)"
echo "   URL yang masih menunjuk ke Supabase: $SISA"

echo "==> Menyalakan kembali aplikasi"
"${C[@]}" up -d --wait >/dev/null
[ "$hilang" = 0 ] && [ "$SISA" = 0 ] && echo "✓ Migrasi selesai"
}
utama "$@"
JARAK_JAUH
} | ssh -i "$KUNCI" -o IdentitiesOnly=yes -o ServerAliveInterval=30 "$SERVER" bash -s
