import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api'
import { parseCollectionsCsv, COLLECTIONS_TEMPLATE_CSV } from '@/lib/collectionsCsv'

// GET /api/collections/import - Plantilla CSV
export async function GET() {
  return new NextResponse('﻿' + COLLECTIONS_TEMPLATE_CSV, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla_cobros.csv"'
    }
  })
}

const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

// POST /api/collections/import { csv, dryRun }
// mensualidad → ClientPayment (cliente por nombre exacto); otro → cuenta por cobrar ya cobrada.
export async function POST(request: NextRequest) {
  try {
    const { csv, dryRun = true } = await request.json()
    if (typeof csv !== 'string' || !csv.trim()) return errorResponse('Archivo CSV vacío')

    const { rows, fatal } = parseCollectionsCsv(csv)
    if (fatal) return errorResponse(fatal)

    const [sales, payments, entries] = await Promise.all([
      prisma.salesClose.findMany({ select: { id: true, clientName: true } }),
      prisma.clientPayment.findMany({ select: { saleId: true, forMonth: true } }),
      prisma.accountEntry.findMany({
        where: { kind: 'receivable', status: 'paid' },
        select: { counterparty: true, concept: true, amount: true, paidAt: true }
      })
    ])
    const saleByName = new Map(sales.map(s => [s.clientName.trim().toLowerCase(), s.id]))
    const seen = new Set<string>([
      ...payments.map(p => `m|${p.saleId}|${p.forMonth}`),
      ...entries.map(e => `o|${e.counterparty.toLowerCase()}|${e.concept.toLowerCase()}|${e.amount}|${e.paidAt ? ymd(e.paidAt) : ''}`)
    ])

    const preview = rows.map(r => {
      const errors = [...r.errors]
      let duplicate = false
      let saleId: number | null = null
      if (r.data) {
        const d = r.data
        if (d.kind === 'mensualidad') {
          saleId = saleByName.get(d.clientName.toLowerCase()) ?? null
          if (saleId === null) errors.push(`no existe una venta de "${d.clientName}" (importa primero las ventas)`)
          else {
            const key = `m|${saleId}|${d.forMonth}`
            duplicate = seen.has(key)
            seen.add(key)
          }
        } else {
          const key = `o|${d.clientName.toLowerCase()}|${d.concept.toLowerCase()}|${d.amount}|${ymd(d.paidAt)}`
          duplicate = seen.has(key)
          seen.add(key)
        }
      }
      return { line: r.line, errors, duplicate, data: r.data ?? null, saleId }
    })

    const toInsert = preview.filter(p => p.data && p.errors.length === 0 && !p.duplicate)
    const summary = {
      total: rows.length,
      valid: toInsert.length,
      duplicates: preview.filter(p => p.duplicate).length,
      invalid: preview.filter(p => p.errors.length > 0).length,
      extraLabel: 'Total cobrado',
      extraValue: toInsert.reduce((s, p) => s + p.data!.amount, 0)
    }
    if (dryRun) return successResponse({ imported: 0, summary, rows: preview })
    if (toInsert.length === 0) return errorResponse('No hay filas válidas para importar')

    await prisma.$transaction(
      toInsert.map(p => {
        const d = p.data!
        return d.kind === 'mensualidad'
          ? prisma.clientPayment.create({ data: { saleId: p.saleId!, forMonth: d.forMonth, amount: d.amount, paidAt: d.paidAt } })
          : prisma.accountEntry.create({
              data: { kind: 'receivable', concept: d.concept, counterparty: d.clientName, amount: d.amount, dueDate: d.paidAt, status: 'paid', paidAt: d.paidAt }
            })
      })
    )
    return successResponse({ imported: toInsert.length, summary, rows: [] }, 201)
  } catch (error) {
    console.error('Error importing collections CSV:', error)
    return errorResponse('Error al importar CSV', 500)
  }
}
