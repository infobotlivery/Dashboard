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

# Script de inicio
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Initializing database..."' >> /app/start.sh && \
    echo 'npx prisma db push --skip-generate' >> /app/start.sh && \
    echo 'echo "Database ready. Starting server..."' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

USER nextjs

EXPOSE 3000

CMD ["/app/start.sh"]
