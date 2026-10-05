import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'
import { parseProposalsCsv, proposalKey, PROPOSALS_TEMPLATE_CSV } from '@/lib/proposalsCsv'

// GET /api/proposals/import - Plantilla CSV descargable
export async function GET() {
  return new NextResponse('﻿' + PROPOSALS_TEMPLATE_CSV, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla_propuestas.csv"'
    }
  })
}

// POST /api/proposals/import  { csv, dryRun? } — misma mecánica que /api/sales/import
export async function POST(request: NextRequest) {
  try {
    const { csv, dryRun = true } = await request.json()
    if (typeof csv !== 'string' || !csv.trim()) return errorResponse('Archivo CSV vacío')

    const { rows, fatal } = parseProposalsCsv(csv)
    if (fatal) return errorResponse(fatal)

    const existing = await prisma.proposal.findMany({
      select: { clientName: true, service: true, amount: true, date: true }
    })
    const seen = new Set(existing.map(proposalKey))

    const preview = rows.map(r => {
      let duplicate = false
      if (r.data) {
        const key = proposalKey(r.data)
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
      extraLabel: 'Monto total',
      extraValue: toInsert.reduce((s, p) => s + p.data!.amount, 0)
    }

    if (dryRun) return successResponse({ imported: 0, summary, rows: preview })
    if (toInsert.length === 0) return errorResponse('No hay filas válidas para importar')

    await prisma.$transaction(toInsert.map(p => prisma.proposal.create({ data: p.data! })))
    return successResponse({ imported: toInsert.length, summary, rows: [] }, 201)
  } catch (error) {
    console.error('Error importing proposals CSV:', error)
    return errorResponse('Error al importar CSV', 500)
  }
}
