# Etapa 1: Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci

# Etapa 2: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Necesitamos DATABASE_URL para el build aunque sea dummy
ENV DATABASE_URL="file:./dev.db"

RUN npx prisma generate
RUN npm run build

# Etapa 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar prisma schema
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma

# Copiar standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar Prisma client y CLI
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Crear directorio para la base de datos y dar permisos
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app/prisma

# Script de inicio mejorado con reintentos
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "=== Inicializando base de datos ===" ' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Crear directorio si no existe' >> /app/start.sh && \
    echo 'mkdir -p /app/data' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Ejecutar migración con reintentos' >> /app/start.sh && \
    echo 'for i in 1 2 3; do' >> /app/start.sh && \
    echo '  echo "Intento $i de inicializar DB..."' >> /app/start.sh && \
    echo '  if npx prisma db push --skip-generate --accept-data-loss 2>&1; then' >> /app/start.sh && \
    echo '    echo "Base de datos inicializada correctamente"' >> /app/start.sh && \
    echo '    break' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  echo "Reintentando en 2 segundos..."' >> /app/start.sh && \
    echo '  sleep 2' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "=== Iniciando servidor ===" ' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

USER nextjs

EXPOSE 3000

CMD ["/app/start.sh"]
