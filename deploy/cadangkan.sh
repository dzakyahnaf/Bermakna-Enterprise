#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Cadangan produksi, dijalankan cron setiap malam (lihat README):
#   - database   : setiap hari, disimpan 14 hari
#   - berkas     : gambar & dokumen unggahan, setiap Minggu, disimpan 4 minggu
#
# Cadangan di disk yang sama hanya melindungi dari kesalahan manusia
# (data terhapus, volume ter-reset). Untuk melindungi dari kerusakan server,
# salin isi /opt/bermakna/cadangan ke tempat lain secara berkala.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

TUJUAN=/opt/bermakna/cadangan
COMPOSE=(docker compose -f /opt/bermakna/app/deploy/compose.yaml --env-file /opt/bermakna/.env)
CAP="$(date +%Y%m%d-%H%M)"
umask 077
mkdir -p "$TUJUAN"

# Database — format custom pg_dump, sudah terkompresi. Ditulis ke berkas
# sementara dulu supaya cadangan yang gagal di tengah jalan tidak tampak utuh.
"${COMPOSE[@]}" exec -T db pg_dump -U bermakna -d bermakna -Fc > "$TUJUAN/db-$CAP.dump.tmp"
mv "$TUJUAN/db-$CAP.dump.tmp" "$TUJUAN/db-$CAP.dump"
find "$TUJUAN" -name 'db-*.dump' -mtime +14 -delete

# Berkas unggahan — setiap Minggu (gambar sudah WebP, tidak perlu dikompres lagi).
if [ "$(date +%u)" = 7 ] || [ "${PAKSA_BERKAS:-0}" = 1 ]; then
  tar -cf "$TUJUAN/berkas-$CAP.tar.tmp" -C /var/lib/docker/volumes \
    bermakna_berkas_publik/_data bermakna_berkas_privat/_data
  mv "$TUJUAN/berkas-$CAP.tar.tmp" "$TUJUAN/berkas-$CAP.tar"
  find "$TUJUAN" -name 'berkas-*.tar' -mtime +28 -delete
fi

find "$TUJUAN" -name '*.tmp' -mmin +120 -delete
echo "$(date '+%F %T') cadangan OK: $(ls -1 "$TUJUAN" | wc -l) berkas, $(du -sh "$TUJUAN" | cut -f1)"
