'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** Aviso en la portada: gastos mensuales del mes en curso que aún no se confirmaron (Sigue / Cancelar / Cambiar monto). */
export function ExpenseReviewAlert({ refreshKey }: { refreshKey?: number }) {
  const [pending, setPending] = useState(0)

  useEffect(() => {
    apiFetch('/api/finance/review')
      .then(r => r.json())
      .then(d => { if (d.success) setPending(d.data.pending) })
      .catch(() => {})
  }, [refreshKey])

  if (pending <= 0) return null
  return (
    <a
      href="/finanzas?tab=revision"
      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm text-yellow-200 hover:bg-yellow-400/15 transition-colors"
    >
      <span>
        ⚠ Tienes <strong>{pending}</strong> gasto{pending === 1 ? '' : 's'} sin revisar en {MONTHS[new Date().getMonth()]}
      </span>
      <span className="font-medium underline">Revisar ahora →</span>
    </a>
  )
}
