# Etapa 1: Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
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

# Verificar que el schema tiene mrrComunidad ANTES de generar
RUN echo "=== Verificando schema.prisma ===" && \
    cat prisma/schema.prisma && \
    grep -q "mrrComunidad" prisma/schema.prisma && \
    echo "SUCCESS: Campo mrrComunidad encontrado en schema.prisma"

# Generar cliente Prisma
RUN npx prisma generate

# Verificar que el cliente se generó correctamente
RUN echo "=== Verificando cliente Prisma generado ===" && \
    grep -q "mrrComunidad" node_modules/.prisma/client/index.d.ts && \
    echo "SUCCESS: Campo mrrComunidad encontrado en cliente Prisma"

RUN npm run build

# Etapa 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl su-exec sqlite
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar standalone build (incluye server.js y node_modules mínimos)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copiar archivos estáticos de Next.js (CSS, JS, fuentes)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/standalone/.next/static

# Copiar archivos públicos
COPY --from=builder --chown=nextjs:nodejs /app/public ./.next/standalone/public

# Copiar prisma schema y directorio completo
COPY --from=builder /app/prisma ./prisma

# Copiar Prisma client generado (CRÍTICO - debe incluir mrrComunidad)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# NO instalamos prisma global - usamos el de node_modules para evitar incompatibilidades

# Copiar script de inicio
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json

# Crear directorio para datos con permisos correctos
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app/prisma /app/scripts

# Copiar script de entrada que maneja permisos
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
