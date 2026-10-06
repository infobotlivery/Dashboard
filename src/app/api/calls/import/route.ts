import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'
import { parseCallsCsv, callKey, CALLS_TEMPLATE_CSV } from '@/lib/callsCsv'

// GET /api/calls/import - Plantilla CSV descargable
export async function GET() {
  return new NextResponse('﻿' + CALLS_TEMPLATE_CSV, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla_llamadas.csv"'
    }
  })
}

// POST /api/calls/import  { csv, dryRun? } — vista previa y confirmación, como /api/sales/import.
// Las llamadas importadas cuentan como leads/agendadas según su fecha "agendada_el".
export async function POST(request: NextRequest) {
  try {
    const { csv, dryRun = true } = await request.json()
    if (typeof csv !== 'string' || !csv.trim()) return errorResponse('Archivo CSV vacío')

    const { rows, fatal } = parseCallsCsv(csv)
    if (fatal) return errorResponse(fatal)

    const existing = await prisma.call.findMany({
      select: { leadName: true, leadEmail: true, scheduledAt: true, calendlyInviteeUri: true }
    })
    const seen = new Set(existing.map(callKey))

    const preview = rows.map(r => {
      let duplicate = false
      if (r.data) {
        const key = callKey(r.data)
        duplicate = seen.has(key)
        seen.add(key)
      }
      // `clientName` lo usa la tarjeta de importación para nombrar las filas duplicadas
      return { line: r.line, errors: r.errors, duplicate, data: r.data ? { ...r.data, clientName: r.data.leadName } : null }
    })

    const toInsert = preview.filter(p => p.data && !p.duplicate)
    const summary = {
      total: rows.length,
      valid: toInsert.length,
      duplicates: preview.filter(p => p.duplicate).length,
      invalid: preview.filter(p => p.errors.length > 0).length,
      extraLabel: 'Con presupuesto indicado',
      extraValue: toInsert.filter(p => p.data!.budget).length,
      extraIsCount: true
    }

    if (dryRun) return successResponse({ imported: 0, summary, rows: preview })
    if (toInsert.length === 0) return errorResponse('No hay filas válidas para importar')

    await prisma.$transaction(
      toInsert.map(p => {
        const { clientName: _ignored, ...data } = p.data!
        void _ignored
        return prisma.call.create({ data })
      })
    )
    return successResponse({ imported: toInsert.length, summary, rows: [] }, 201)
  } catch (error) {
    console.error('Error importing calls CSV:', error)
    return errorResponse('Error al importar CSV', 500)
  }
}
