import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'
import { parseSalesCsv, saleKey, TEMPLATE_CSV } from '@/lib/salesCsv'

// GET /api/sales/import - Plantilla CSV descargable
export async function GET() {
  return new NextResponse('﻿' + TEMPLATE_CSV, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla_cierres.csv"'
    }
  })
}

// POST /api/sales/import  { csv: string, dryRun?: boolean }
// dryRun=true: valida y devuelve vista previa sin guardar.
// dryRun=false: inserta en una sola transacción las filas válidas y no duplicadas.
export async function POST(request: NextRequest) {
  try {
    const { csv, dryRun = true } = await request.json()
    if (typeof csv !== 'string' || !csv.trim()) return errorResponse('Archivo CSV vacío')

    const { rows, fatal } = parseSalesCsv(csv)
    if (fatal) return errorResponse(fatal)

    // Duplicados contra la base y dentro del propio archivo
    const existing = await prisma.salesClose.findMany({
      select: { clientName: true, product: true, createdAt: true }
    })
    const seen = new Set(existing.map(s => saleKey(s.clientName, s.product, s.createdAt)))

    const preview = rows.map(r => {
      let duplicate = false
      if (r.data) {
        const key = saleKey(r.data.clientName, r.data.product, r.data.createdAt)
        duplicate = seen.has(key)
        seen.add(key)
      }
      return { line: r.line, errors: r.errors, duplicate, data: r.data ?? null }
    })

    const toInsert = preview.filter(p => p.data && !p.duplicate)
    const summary = {
      total: rows.length,
      valid: toInsert.length,
      duplicates: preview.filter(p => p.duplicate).length,
      invalid: preview.filter(p => p.errors.length > 0).length,
      onboardingTotal: toInsert.reduce((s, p) => s + p.data!.onboardingValue, 0),
      mrrTotal: toInsert
        .filter(p => p.data!.status === 'active')
        .reduce((s, p) => s + p.data!.recurringValue, 0)
    }

    if (dryRun) return successResponse({ imported: 0, summary, rows: preview })

    if (toInsert.length === 0) return errorResponse('No hay filas válidas para importar')

    await prisma.$transaction(
      toInsert.map(p =>
        prisma.salesClose.create({
          data: p.data!
        })
      )
    )

    return successResponse({ imported: toInsert.length, summary, rows: [] }, 201)
  } catch (error) {
    console.error('Error importing sales CSV:', error)
    return errorResponse('Error al importar CSV', 500)
  }
}
