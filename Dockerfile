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

# Copiar script de inicio
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json

# Crear directorio para datos con permisos correctos
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app/prisma /app/scripts

USER nextjs

EXPOSE 3000

# Usar npm start que ejecuta el script de inicio
CMD ["node", "scripts/start-production.js"]
