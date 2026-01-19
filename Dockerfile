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

# Database URL para build (dummy, se sobreescribe en runtime)
ENV DATABASE_URL="file:./prisma/dev.db"

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

# Copiar prisma schema y directorio completo
COPY --from=builder /app/prisma ./prisma

# Copiar standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar Prisma client y CLI completos
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Crear directorio para datos con permisos correctos
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app/prisma

# Crear script de inicio - FORZAR DATABASE_URL correcto
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "=== Dashboard Metrics - Iniciando ==="' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# FORZAR la ruta correcta de la base de datos' >> /app/start.sh && \
    echo 'export DATABASE_URL="file:/app/data/metrics.db"' >> /app/start.sh && \
    echo 'echo "DATABASE_URL forzado a: $DATABASE_URL"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Crear directorio de datos' >> /app/start.sh && \
    echo 'mkdir -p /app/data 2>/dev/null || true' >> /app/start.sh && \
    echo 'cd /app' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Inicializar base de datos con reintentos' >> /app/start.sh && \
    echo 'echo "Inicializando base de datos..."' >> /app/start.sh && \
    echo 'for i in 1 2 3 4 5; do' >> /app/start.sh && \
    echo '  echo "Intento $i de 5..."' >> /app/start.sh && \
    echo '  if npx prisma db push --skip-generate --accept-data-loss 2>&1; then' >> /app/start.sh && \
    echo '    echo "Base de datos creada/actualizada correctamente"' >> /app/start.sh && \
    echo '    break' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  echo "Fallo, reintentando en 3 segundos..."' >> /app/start.sh && \
    echo '  sleep 3' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Verificar que la base de datos existe' >> /app/start.sh && \
    echo 'echo "Contenido de /app/data:"' >> /app/start.sh && \
    echo 'ls -la /app/data/' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Iniciar servidor Next.js' >> /app/start.sh && \
    echo 'echo "=== Iniciando servidor Next.js ==="' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

USER nextjs

EXPOSE 3000

CMD ["/app/start.sh"]
