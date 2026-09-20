#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Menyiapkan VPS baru (Rocky Linux / RHEL 8–9) untuk Bermakna Enterprise.
#
# Dijalankan SEKALI sebagai root pada server yang masih kosong:
#   ssh root@IP 'bash -s' < deploy/siapkan-server.sh
#
# Idempoten — aman dijalankan ulang. Yang dilakukan:
#   1. pembaruan paket + pembaruan keamanan otomatis harian
#   2. swap 2 GB (RAM 2 GB terlalu mepet untuk build Next.js tanpa swap)
#   3. firewall: hanya SSH, HTTP, HTTPS yang terbuka
#   4. mematikan rpcbind (port 111) yang tidak dipakai
#   5. Docker Engine + Compose
# Pengerasan SSH (hanya kunci) ada di bagian akhir dan sengaja terpisah.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

langkah() { printf '\n==> %s\n' "$*"; }

langkah "Pembaruan paket"
dnf -y -q update
dnf -y -q install dnf-plugins-core firewalld dnf-automatic tar curl

langkah "Swap 2 GB"
if ! swapon --show=NAME --noheadings | grep -qx /swapfile; then
  # dd, bukan fallocate: swapfile hasil fallocate ditolak XFS di kernel RHEL 8.
  dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
fi
grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap defaults 0 0' >> /etc/fstab
# Pakai swap hanya saat benar-benar perlu (build), bukan saat melayani pengunjung.
echo 'vm.swappiness = 10' > /etc/sysctl.d/90-bermakna.conf
sysctl -q -p /etc/sysctl.d/90-bermakna.conf

langkah "Mematikan rpcbind (port 111 terbuka ke internet, tidak dipakai)"
systemctl disable --now rpcbind.socket rpcbind.service >/dev/null 2>&1 || true

langkah "Firewall: hanya SSH, HTTP, HTTPS"
systemctl enable --now firewalld
for layanan in ssh http https; do firewall-cmd -q --permanent --add-service="$layanan"; done
firewall-cmd -q --permanent --add-port=443/udp   # HTTP/3
for layanan in cockpit dhcpv6-client; do
  firewall-cmd -q --permanent --remove-service="$layanan" 2>/dev/null || true
done
firewall-cmd -q --reload

langkah "Docker Engine + Compose"
if ! command -v docker >/dev/null; then
  dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
  dnf -y -q install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "live-restore": true
}
JSON
systemctl enable docker >/dev/null
systemctl restart docker

langkah "Pembaruan keamanan otomatis (harian)"
sed -i -E 's/^upgrade_type\s*=.*/upgrade_type = security/; s/^apply_updates\s*=.*/apply_updates = yes/' /etc/dnf/automatic.conf
systemctl enable --now dnf-automatic.timer >/dev/null

langkah "Selesai"
docker --version
docker compose version
free -m | sed -n '1,3p'
firewall-cmd --list-services
