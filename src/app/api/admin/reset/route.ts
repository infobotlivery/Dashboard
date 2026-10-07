import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'

// POST /api/admin/reset { target: 'proposals' | 'sales', confirm: 'BORRAR' }
// Antes de borrar copia la base de datos a backups/pre-reset-<target>-<fecha>.db.
//  - proposals: borra todas las propuestas (no toca ventas ni llamadas).
//  - sales: borra todos los cierres de venta y sus cobros (ClientPayment).
export async function POST(request: NextRequest) {
  try {
    const { target, confirm } = await request.json()
    if (target !== 'proposals' && target !== 'sales') return errorResponse('target inválido')
    if (confirm !== 'BORRAR') return errorResponse('Escribe BORRAR para confirmar')

    // Respaldo previo (mejor esfuerzo: en desarrollo la ruta de la BD puede variar)
    let backup: string | null = null
    try {
      const url = process.env.DATABASE_URL || ''
      const rel = url.replace(/^file:/, '')
      const dbFile = path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), 'prisma', rel)
      if (fs.existsSync(dbFile)) {
        await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE)')
        const dir = path.join(path.dirname(dbFile), 'backups')
        fs.mkdirSync(dir, { recursive: true })
        const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
        backup = path.join(dir, `pre-reset-${target}-${stamp}.db`)
        fs.copyFileSync(dbFile, backup)
      }
    } catch (e) {
      console.error('No se pudo crear el respaldo previo al borrado:', e)
      return errorResponse('No se pudo crear el respaldo previo; no se borró nada', 500)
    }

    let deleted: Record<string, number>
    if (target === 'proposals') {
      const r = await prisma.proposal.deleteMany({})
      deleted = { propuestas: r.count }
    } else {
      const [pay, sales] = await prisma.$transaction([prisma.clientPayment.deleteMany({}), prisma.salesClose.deleteMany({})])
      deleted = { cobros: pay.count, ventas: sales.count }
    }
    return successResponse({ deleted, backup: backup ? path.basename(backup) : null })
  } catch (error) {
    console.error('Error en reset:', error)
    return errorResponse('Error al borrar', 500)
  }
}
