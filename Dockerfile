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

# DEBUG: Verificar que el build generó los archivos estáticos
RUN echo "=== [BUILDER] Verificando output del build ===" && \
    echo "--- .next/standalone existe:" && ls -la /app/.next/standalone/ | head -10 && \
    echo "--- .next/static existe:" && ls -la /app/.next/static/ | head -10 && \
    echo "--- .next/static/chunks:" && ls /app/.next/static/chunks/ | head -5 && \
    echo "--- public:" && ls -la /app/public/

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

# ============================================
# PASO 1: Copiar standalone build
# ============================================
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone /app

# DEBUG: Verificar qué se copió del standalone
RUN echo "=== [RUNNER] Después de copiar standalone ===" && \
    echo "--- /app contiene:" && ls -la /app/ && \
    echo "--- /app/.next contiene:" && ls -la /app/.next/ 2>/dev/null || echo "NO EXISTE /app/.next"

# ============================================
# PASO 2: Copiar archivos estáticos de Next.js
# ============================================
COPY --from=builder --chown=nextjs:nodejs /app/.next/static /app/.next/static

# DEBUG: Verificar que se copiaron los archivos estáticos
RUN echo "=== [RUNNER] Después de copiar static ===" && \
    echo "--- /app/.next/static contiene:" && ls -la /app/.next/static/ && \
    echo "--- /app/.next/static/chunks (primeros 5):" && ls /app/.next/static/chunks/ | head -5

# ============================================
# PASO 3: Copiar archivos públicos
# ============================================
COPY --from=builder --chown=nextjs:nodejs /app/public /app/public

# DEBUG: Verificar archivos públicos
RUN echo "=== [RUNNER] Después de copiar public ===" && \
    echo "--- /app/public contiene:" && ls -la /app/public/

# ============================================
# PASO 4: Copiar archivos de Prisma
# ============================================
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/node_modules/prisma /app/node_modules/prisma

# ============================================
# PASO 5: Copiar scripts y configuración
# ============================================
COPY --from=builder /app/scripts /app/scripts
COPY --from=builder /app/package.json /app/package.json

# Crear directorio para datos con permisos correctos
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app/prisma /app/scripts

# Copiar script de entrada
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# ============================================
# DEBUG FINAL: Verificar estructura completa
# ============================================
RUN echo "=== [RUNNER] ESTRUCTURA FINAL ===" && \
    echo "--- /app (raíz):" && ls -la /app/ && \
    echo "--- /app/.next:" && ls -la /app/.next/ && \
    echo "--- /app/.next/static:" && ls -la /app/.next/static/ && \
    echo "--- /app/.next/static/chunks (5 archivos):" && ls /app/.next/static/chunks/ | head -5 && \
    echo "--- /app/.next/static/css:" && ls /app/.next/static/css/ 2>/dev/null || echo "NO HAY CSS" && \
    echo "--- /app/.next/static/media:" && ls /app/.next/static/media/ 2>/dev/null || echo "NO HAY MEDIA" && \
    echo "--- /app/public:" && ls -la /app/public/ && \
    echo "--- /app/server.js existe:" && ls -la /app/server.js

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
