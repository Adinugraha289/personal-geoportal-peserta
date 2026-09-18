# ---- Stage 1: Install dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

# Copy hanya file dependency dulu supaya layer ini di-cache
# (tidak perlu install ulang tiap kali ada perubahan kode)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# ---- Stage 2: Build aplikasi ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NextJS menanam nilai NEXT_PUBLIC_* ke dalam berkas hasil build, bukan
# membacanya saat aplikasi berjalan. Karena .dockerignore mengecualikan .env
# dari build context, nilai itu harus dikirim sebagai build argument.
#
# Cloud Build mengirimnya dari substitution variable _CESIUM_ION_TOKEN.
# Tanpa nilai, build tetap berjalan dan peta 3D tetap tampil, tetapi aset
# 3D Tiles dari Cesium Ion tidak dapat dimuat.
ARG NEXT_PUBLIC_CESIUM_ION_TOKEN=""
ENV NEXT_PUBLIC_CESIUM_ION_TOKEN=$NEXT_PUBLIC_CESIUM_ION_TOKEN

# Build NextJS untuk production
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ---- Stage 3: Production image (ringan, tanpa source code & dev dependency) ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT=3000

# Buat user non-root untuk keamanan (jangan jalankan container sebagai root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy hasil build standalone (lihat catatan next.config.js di bawah)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
