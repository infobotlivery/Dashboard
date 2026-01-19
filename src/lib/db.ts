import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  console.log('[Prisma] Creando cliente con DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...')

  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
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
