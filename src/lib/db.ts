import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// En producción Docker, SIEMPRE usar la ruta absoluta al volumen
const getDatabaseUrl = () => {
  // Si estamos en producción, forzar la ruta correcta
  if (process.env.NODE_ENV === 'production') {
    return 'file:/app/data/metrics.db'
  }
  // En desarrollo, usar la variable de entorno o un default local
  return process.env.DATABASE_URL || 'file:./prisma/dev.db'
}

const prismaClientSingleton = () => {
  const dbUrl = getDatabaseUrl()
  console.log('[Prisma] NODE_ENV:', process.env.NODE_ENV)
  console.log('[Prisma] Usando DATABASE_URL:', dbUrl)

  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: dbUrl
      }
    }
  })
}

// En producción, siempre crear una nueva instancia para evitar problemas de conexión
export const prisma = global.prisma ?? prismaClientSingleton()

// Solo cachear en desarrollo
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma
