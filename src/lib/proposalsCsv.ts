// Parseo y validación de CSV de propuestas enviadas.
import { parseCsv, parseAmount, parseCsvDate, norm, MAX_IMPORT_ROWS } from '@/lib/salesCsv'

export const PROPOSALS_TEMPLATE_CSV =
  'cliente,empresa,servicio,monto,mensual,fecha,estado,notas\n' +
  'Juan Pérez,Pérez SA,CRM,1500,300,2026-01-15,aprobada,Cerró en la llamada\n' +
  'Ana Gómez,,Agente IA,2500,250,2026-02-03,por_aprobacion,\n' +
  'Empresa XYZ,XYZ,Asesoría,800,0,2026-02-20,no_cerrada,Sin presupuesto\n'

export interface ParsedProposal {
  clientName: string
  company: string
  service: string
  amount: number
  recurringAmount: number
  date: Date
  status: 'por_aprobacion' | 'aprobada' | 'no_cerrada'
  notes: string | null
}

export interface ProposalRowResult {
  line: number
  data?: ParsedProposal
  errors: string[]
}

const ALIASES: Record<string, string> = {
  cliente: 'clientName', nombre: 'clientName', clientname: 'clientName',
  empresa: 'company', company: 'company',
  servicio: 'service', producto: 'service', service: 'service',
  monto: 'amount', valor: 'amount', amount: 'amount',
  mensual: 'recurring', mrr: 'recurring', recurringamount: 'recurring',
  fecha: 'date', fecha_envio: 'date', date: 'date',
  estado: 'status', status: 'status',
  notas: 'notes', notes: 'notes'
}

function normalizeStatus(raw: string): ParsedProposal['status'] | null {
  const k = norm(raw)
  if (k === '' || ['por_aprobacion', 'por_aprobar', 'pendiente', 'enviada', 'enviado'].includes(k)) return 'por_aprobacion'
  if (['aprobada', 'aprobado', 'cerrada', 'cerrado', 'ganada', 'ganado'].includes(k)) return 'aprobada'
  if (['no_cerrada', 'no_cerrado', 'perdida', 'perdido', 'rechazada', 'rechazado', 'no_aprobada'].includes(k)) return 'no_cerrada'
  return null
}

export function parseProposalsCsv(text: string): { rows: ProposalRowResult[]; fatal?: string } {
  const table = parseCsv(text).filter(r => r.some(c => c.trim() !== ''))
  if (table.length < 2) return { rows: [], fatal: 'El archivo está vacío o no tiene filas de datos' }
  if (table.length - 1 > MAX_IMPORT_ROWS) return { rows: [], fatal: `Máximo ${MAX_IMPORT_ROWS} filas por archivo` }

  const cols: Record<string, number> = {}
  table[0].forEach((h, i) => {
    const f = ALIASES[norm(h)]
    if (f && !(f in cols)) cols[f] = i
  })
  if (!('clientName' in cols) || !('date' in cols)) {
    return { rows: [], fatal: 'Faltan columnas obligatorias: cliente y fecha' }
  }
  const get = (r: string[], f: string) => (f in cols ? (r[cols[f]] ?? '').trim() : '')

  const rows = table.slice(1).map((r, idx): ProposalRowResult => {
    const line = idx + 2
    const errors: string[] = []
    const clientName = get(r, 'clientName')
    if (!clientName) errors.push('cliente vacío')
    const amount = parseAmount(get(r, 'amount'))
    if (amount === null) errors.push('monto no es un número válido')
    const recurring = parseAmount(get(r, 'recurring'))
    if (recurring === null) errors.push('mensual no es un número válido')
    const date = parseCsvDate(get(r, 'date'))
    if (!date) errors.push('fecha inválida (usa AAAA-MM-DD o DD/MM/AAAA)')
    const status = normalizeStatus(get(r, 'status'))
    if (!status) errors.push('estado inválido (por_aprobacion, aprobada o no_cerrada)')

    if (errors.length || amount === null || recurring === null || !date || !status) return { line, errors }
    return {
      line,
      errors,
      data: {
        clientName,
        company: get(r, 'company'),
        service: get(r, 'service'),
        amount,
        recurringAmount: recurring,
        date,
        status,
        notes: get(r, 'notes') || null
      }
    }
  })
  return { rows }
}

// Duplicado: cliente + servicio + monto + día
export function proposalKey(p: { clientName: string; service: string; amount: number; date: Date }): string {
  const d = `${p.date.getFullYear()}-${p.date.getMonth() + 1}-${p.date.getDate()}`
  return `${p.clientName.trim().toLowerCase()}|${p.service.trim().toLowerCase()}|${p.amount}|${d}`
}
