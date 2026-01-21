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

# IMPORTANTE: Generar cliente Prisma ANTES del build
# Esto asegura que el cliente incluya todos los campos del schema actual
RUN npx prisma generate

# Verificar que el cliente se generó correctamente (debug)
RUN echo "=== Verificando cliente Prisma generado ===" && \
    grep -l "mrrComunidad" node_modules/.prisma/client/index.d.ts && \
    echo "Campo mrrComunidad encontrado en cliente Prisma"

RUN npm run build

# Etapa 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl su-exec
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
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar archivos públicos
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copiar prisma schema y directorio completo
COPY --from=builder /app/prisma ./prisma

# Copiar Prisma client generado (CRÍTICO - debe incluir mrrComunidad)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Instalar prisma CLI globalmente para db push en runtime
RUN npm install -g prisma@5.22.0

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
