#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Deploy versi terkini ke VPS produksi. Jalankan dari laptop (Git Bash,
# macOS, atau Linux) di folder proyek:
#
#   bash deploy/deploy.sh
#
# Yang dikirim: semua berkas yang dilacak git + berkas baru yang tidak
# di-ignore. .env lokal TIDAK PERNAH ikut — rahasia produksi tinggal di
# /opt/bermakna/.env di server.
#
# Build berjalan di server. Selama build, versi lama tetap melayani
# pengunjung; bila build gagal, versi lama tetap jalan tanpa gangguan.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

SERVER="${SERVER:-root@38.103.171.82}"
KUNCI="${KUNCI:-$HOME/.ssh/bermakna_vps}"
jalankan() { ssh -i "$KUNCI" -o IdentitiesOnly=yes -o ServerAliveInterval=30 "$SERVER" "$@"; }

cd "$(git rev-parse --show-toplevel)"

REV="$(git rev-parse --short HEAD)"
if [ -n "$(git status --porcelain)" ]; then
  REV="$REV-lokal"
  echo "!  Ada perubahan yang belum di-commit — ikut dikirim, tetapi belum tercatat di git."
fi
RILIS="$(date +%Y%m%d-%H%M%S)-$REV"

echo "==> Mengirim kode ($RILIS)"
git ls-files -z --cached --others --exclude-standard \
  | while IFS= read -r -d '' f; do [ -e "$f" ] && printf '%s\0' "$f"; done \
  | tar --null -T - -czf - \
  | jalankan "mkdir -p /opt/bermakna/rilis/$RILIS && tar -xzf - -C /opt/bermakna/rilis/$RILIS"

echo "==> Build & menjalankan (beberapa menit)"
jalankan bash -s -- "$RILIS" <<'JARAK_JAUH'
# Seluruh isi dibungkus fungsi: bash membaca skrip ini lewat stdin, dan perintah
# docker yang ikut membaca stdin akan "menelan" sisa skrip bila tidak dibungkus.
utama() {
set -euo pipefail
RILIS="$1"
cd /opt/bermakna
test -f .env || { echo "✗ /opt/bermakna/.env belum ada — lihat deploy/env.contoh"; exit 1; }

SEBELUM="$(readlink app 2>/dev/null || true)"
ln -sfn "rilis/$RILIS" app
C=(docker compose -f app/deploy/compose.yaml --env-file .env)

gagal() {
  echo "✗ Deploy gagal pada langkah: $1"
  if [ -n "$SEBELUM" ]; then ln -sfn "$SEBELUM" app; fi
  exit 1
}

# 1. Build dulu. Bila gagal, versi lama tetap melayani tanpa gangguan.
"${C[@]}" --profile alat build app alat || gagal "build"

# 2. Terapkan perubahan skema database. Prisma menolak perubahan yang akan
#    menghapus data — deploy berhenti di sini, aplikasi lama tetap jalan.
"${C[@]}" up -d --wait db || gagal "database"
"${C[@]}" --profile alat run --rm -T alat npx prisma db push --skip-generate </dev/null || gagal "skema database (prisma db push)"

# 3. Ganti aplikasi ke versi baru dan tunggu sampai sehat.
if ! "${C[@]}" up -d --wait; then
  "${C[@]}" logs --tail 40 app || true
  echo "   Untuk kembali ke versi lama: git checkout <commit-lama> && bash deploy/deploy.sh"
  gagal "menjalankan aplikasi"
fi

# Rapikan: simpan 3 rilis terakhir, buang image & cache build lama.
ls -1dt rilis/* | tail -n +4 | xargs -r rm -rf
docker image prune -f >/dev/null
docker builder prune -f --filter until=240h >/dev/null
}
utama "$@"
JARAK_JAUH

echo "==> Selesai. Status:"
jalankan "docker compose -f /opt/bermakna/app/deploy/compose.yaml --env-file /opt/bermakna/.env ps --format 'table {{.Service}}\t{{.Status}}'"
