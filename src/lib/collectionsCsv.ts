// Parseo de CSV de cobros históricos: mensualidades cobradas y otros ingresos.
import { parseCsv, parseAmount, parseCsvDate, norm, MAX_IMPORT_ROWS } from './salesCsv'

export const COLLECTIONS_TEMPLATE_CSV =
  'tipo,cliente,concepto,mes,monto,fecha_cobro\n' +
  'mensualidad,Juan Pérez,,2026-07,300,2026-07-15\n' +
  'otro,Crew,Crew Manual,2026-07,120,2026-07-20\n'

export interface ParsedCollection {
  kind: 'mensualidad' | 'otro'
  clientName: string
  concept: string
  forMonth: string // AAAA-MM
  amount: number
  paidAt: Date
}

export interface CollectionRow {
  line: number
  data?: ParsedCollection
  errors: string[]
}

const ALIASES: Record<string, string> = {
  tipo: 'kind', type: 'kind',
  cliente: 'clientName', nombre: 'clientName',
  concepto: 'concept', detalle: 'concept',
  mes: 'forMonth', month: 'forMonth', para_mes: 'forMonth',
  monto: 'amount', valor: 'amount', amount: 'amount',
  fecha_cobro: 'paidAt', fecha: 'paidAt', paidat: 'paidAt'
}

export function parseCollectionsCsv(text: string): { rows: CollectionRow[]; fatal?: string } {
  const table = parseCsv(text).filter(r => r.some(c => c.trim() !== ''))
  if (table.length < 2) return { rows: [], fatal: 'El archivo está vacío o no tiene filas de datos' }
  if (table.length - 1 > MAX_IMPORT_ROWS) return { rows: [], fatal: `Máximo ${MAX_IMPORT_ROWS} filas por archivo` }

  const cols: Record<string, number> = {}
  table[0].forEach((h, i) => {
    const f = ALIASES[norm(h)]
    if (f && !(f in cols)) cols[f] = i
  })
  const missing = ['kind', 'clientName', 'forMonth', 'amount'].filter(f => !(f in cols))
  if (missing.length) return { rows: [], fatal: 'Faltan columnas obligatorias: tipo, cliente, mes y monto' }
  const get = (r: string[], f: string) => (f in cols ? (r[cols[f]] ?? '').trim() : '')

  const rows = table.slice(1).map((r, idx): CollectionRow => {
    const line = idx + 2
    const errors: string[] = []

    const k = norm(get(r, 'kind'))
    const kind = ['mensualidad', 'mrr', 'recurrente'].includes(k) ? 'mensualidad'
      : ['otro', 'otros', 'extra'].includes(k) ? 'otro' : null
    if (!kind) errors.push('tipo inválido (mensualidad u otro)')

    const clientName = get(r, 'clientName')
    if (!clientName) errors.push('cliente vacío')

    const forMonth = get(r, 'forMonth')
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(forMonth)) errors.push('mes inválido (usa AAAA-MM)')

    const amount = parseAmount(get(r, 'amount'))
    if (amount === null) errors.push('monto no es un número válido')

    let paidAt: Date | null = null
    const rawPaid = get(r, 'paidAt')
    if (rawPaid) {
      paidAt = parseCsvDate(rawPaid)
      if (!paidAt) errors.push('fecha_cobro inválida')
    } else if (/^\d{4}-\d{2}$/.test(forMonth)) {
      const [y, m] = forMonth.split('-').map(Number)
      paidAt = new Date(y, m - 1, 15, 12, 0, 0) // por defecto, día 15 del mes
    }

    if (errors.length || !kind || amount === null || !paidAt) return { line, errors }
    return { line, errors, data: { kind, clientName, concept: get(r, 'concept') || clientName, forMonth, amount, paidAt } }
  })
  return { rows }
}
