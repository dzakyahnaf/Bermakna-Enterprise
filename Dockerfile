# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────
# Image produksi Bermakna Enterprise (VPS). Dipakai oleh deploy/compose.yaml.
#
# Tiga tahap: dependensi → build → runner. Image akhir hanya berisi server
# Next.js "standalone" — tanpa kode sumber dan tanpa devDependencies.
# ─────────────────────────────────────────────────────────────────────────

FROM node:22-bookworm-slim AS dasar
# Prisma butuh OpenSSL untuk berbicara dengan PostgreSQL.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── 1. Dependensi — di-cache selama package-lock.json tidak berubah ──────
FROM dasar AS dependensi
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ── 2. Build ─────────────────────────────────────────────────────────────
FROM dependensi AS build
COPY . .
# Alamat situs ditanam ke metadata & sitemap saat build.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_OUTPUT=standalone \
    NODE_OPTIONS=--max-old-space-size=1024
# public/ kosong tidak ikut dilacak git, padahal tahap runner menyalinnya.
RUN mkdir -p public && npx prisma generate
RUN --mount=type=cache,target=/app/.next/cache npx next build

# ── 3. Runner ────────────────────────────────────────────────────────────
FROM dasar AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_DIR=/data/berkas
# Folder berkas dibuat di image dengan pemilik yang benar: volume Docker yang
# baru dibuat mewarisi kepemilikan ini, sehingga aplikasi bisa menulis ke sana
# tanpa berjalan sebagai root.
RUN groupadd --system --gid 1001 bermakna \
 && useradd --system --uid 1001 --gid bermakna --no-create-home bermakna \
 && mkdir -p /data/berkas/publik /data/berkas/privat \
 && chown -R bermakna:bermakna /data/berkas
COPY --from=build --chown=bermakna:bermakna /app/.next/standalone ./
COPY --from=build --chown=bermakna:bermakna /app/.next/static ./.next/static
COPY --from=build --chown=bermakna:bermakna /app/public ./public
USER bermakna
EXPOSE 3000
CMD ["node", "server.js"]
