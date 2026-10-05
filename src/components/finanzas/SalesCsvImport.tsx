'use client'

import { useRef, useState } from 'react'
import { GlassCard } from './GlassCard'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/apiFetch'

interface PreviewRow {
  line: number
  errors: string[]
  duplicate: boolean
  data: { clientName: string; product: string; onboardingValue: number; recurringValue: number; status: string; createdAt: string } | null
}

interface ImportSummary {
  total: number
  valid: number
  duplicates: number
  invalid: number
  onboardingTotal: number
  mrrTotal: number
}

interface SalesCsvImportProps {
  onImported?: () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export function SalesCsvImport({ onImported }: SalesCsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [csv, setCsv] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function reset() {
    setCsv(null)
    setFileName('')
    setSummary(null)
    setRows([])
    if (inputRef.current) inputRef.current.value = ''
  }

  async function send(text: string, dryRun: boolean) {
    setLoading(true)
    setMessage(null)
    try {
      const res = await apiFetch('/api/sales/import', {
        method: 'POST',
        body: JSON.stringify({ csv: text, dryRun })
      })
      const data = await res.json()
      if (!data.success) {
        setMessage({ type: 'error', text: data.error || 'Error al procesar el archivo' })
        return null
      }
      return data.data as { imported: number; summary: ImportSummary; rows: PreviewRow[] }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' })
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setCsv(text)
    setFileName(file.name)
    const result = await send(text, true)
    if (result) {
      setSummary(result.summary)
      setRows(result.rows)
    }
  }

  async function handleConfirm() {
    if (!csv) return
    const result = await send(csv, false)
    if (result) {
      setMessage({ type: 'success', text: `${result.imported} cierres importados` })
      reset()
      onImported?.()
    }
  }

  const problems = rows.filter(r => r.errors.length > 0 || r.duplicate)

  return (
    <GlassCard hover={false} className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold">Importar ventas desde CSV</h3>
          <p className="text-xs text-gray-400">
            Columnas: cliente, producto, onboarding, mensual, meses_contrato, estado, fecha (y fecha_cancelacion opcional).
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/sales/import" className="btn-secondary text-sm" download>Descargar plantilla</a>
          <Button size="sm" onClick={() => inputRef.current?.click()} loading={loading && !summary}>
            Subir CSV
          </Button>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </div>
      </div>

      {message && (
        <p className={`text-sm py-2 px-4 rounded-lg mb-3 ${message.type === 'success' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
          {message.text}
        </p>
      )}

      {summary && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Archivo: {fileName}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-white/5 rounded-lg p-3"><p className="text-xl font-bold text-green-400">{summary.valid}</p><p className="text-xs text-gray-400">A importar</p></div>
            <div className="bg-white/5 rounded-lg p-3"><p className="text-xl font-bold text-yellow-400">{summary.duplicates}</p><p className="text-xs text-gray-400">Duplicadas (se omiten)</p></div>
            <div className="bg-white/5 rounded-lg p-3"><p className="text-xl font-bold text-red-400">{summary.invalid}</p><p className="text-xs text-gray-400">Con errores</p></div>
            <div className="bg-white/5 rounded-lg p-3"><p className="text-xl font-bold">{fmt(summary.onboardingTotal)}</p><p className="text-xs text-gray-400">Onboarding · MRR {fmt(summary.mrrTotal)}</p></div>
          </div>

          {problems.length > 0 && (
            <ul className="text-xs space-y-1 max-h-40 overflow-y-auto bg-black/30 rounded-lg p-3">
              {problems.slice(0, 100).map(r => (
                <li key={r.line} className={r.errors.length ? 'text-red-400' : 'text-yellow-400'}>
                  Línea {r.line}: {r.errors.length ? r.errors.join(', ') : `duplicada (${r.data?.clientName})`}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <Button onClick={handleConfirm} loading={loading} disabled={summary.valid === 0}>
              Importar {summary.valid} cierres
            </Button>
            <Button variant="secondary" onClick={reset}>Cancelar</Button>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
