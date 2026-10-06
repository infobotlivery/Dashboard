// Parseo y validación de CSV de llamadas (histórico de Calendly o manual).
import { parseCsv, parseCsvDate, norm, MAX_IMPORT_ROWS } from '@/lib/salesCsv'

export const CALLS_TEMPLATE_CSV =
  'lead,email,fecha_llamada,agendada_el,presupuesto,estado,reprogramada,asistencia\n' +
  'Juan Pérez,juan@ejemplo.com,2026-02-10 15:00,2026-02-08 10:30,500$ a 1000$,agendada,no,asistio\n' +
  'Ana Gómez,ana@ejemplo.com,2026-02-12 11:00,2026-02-09 18:00,No tengo presupuesto,cancelada,no,pendiente\n'

export interface ParsedCall {
  leadName: string
  leadEmail: string
  eventName: string
  scheduledAt: Date
  bookedAt: Date
  budget: string | null
  status: 'scheduled' | 'canceled'
  attendance: 'pending' | 'attended' | 'no_show'
  isReschedule: boolean
  calendlyEventUri: string | null
  calendlyInviteeUri: string | null
  source: 'calendly' | 'manual'
}

export interface CallRowResult {
  line: number
  data?: ParsedCall
  errors: string[]
}

const ALIASES: Record<string, string> = {
  lead: 'leadName', nombre: 'leadName', cliente: 'leadName',
  email: 'leadEmail', correo: 'leadEmail',
  fecha_llamada: 'scheduledAt', fecha: 'scheduledAt', llamada: 'scheduledAt',
  agendada_el: 'bookedAt', fecha_agendada: 'bookedAt', fecha_reserva: 'bookedAt',
  presupuesto: 'budget',
  estado: 'status',
  reprogramada: 'isReschedule',
  asistencia: 'attendance',
  evento_calendly: 'eventUri',
  invitado_calendly: 'inviteeUri',
  nombre_evento: 'eventName'
}

/** Acepta ISO (2026-02-10T15:00:00Z), "AAAA-MM-DD HH:mm", "DD/MM/AAAA HH:mm" o solo fecha. */
export function parseCsvDateTime(raw: string): Date | null {
  const s = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})$/.exec(s) ?? null
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  const l = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})[ T](\d{1,2}):(\d{2})$/.exec(s)
  if (l) return new Date(+l[3], +l[2] - 1, +l[1], +l[4], +l[5])
  return parseCsvDate(s)
}

const yes = (v: string) => ['si', 'sí', 'yes', 'true', '1', 'x'].includes(norm(v))

export function parseCallsCsv(text: string): { rows: CallRowResult[]; fatal?: string } {
  const table = parseCsv(text).filter(r => r.some(c => c.trim() !== ''))
  if (table.length < 2) return { rows: [], fatal: 'El archivo está vacío o no tiene filas de datos' }
  if (table.length - 1 > MAX_IMPORT_ROWS) return { rows: [], fatal: `Máximo ${MAX_IMPORT_ROWS} filas por archivo` }

  const cols: Record<string, number> = {}
  table[0].forEach((h, i) => {
    const f = ALIASES[norm(h)]
    if (f && !(f in cols)) cols[f] = i
  })
  if (!('leadName' in cols) || !('scheduledAt' in cols)) {
    return { rows: [], fatal: 'Faltan columnas obligatorias: lead y fecha_llamada' }
  }
  const get = (r: string[], f: string) => (f in cols ? (r[cols[f]] ?? '').trim() : '')

  const rows = table.slice(1).map((r, idx): CallRowResult => {
    const line = idx + 2
    const errors: string[] = []

    const leadName = get(r, 'leadName')
    if (!leadName) errors.push('lead vacío')

    const scheduledAt = parseCsvDateTime(get(r, 'scheduledAt'))
    if (!scheduledAt) errors.push('fecha_llamada inválida (usa AAAA-MM-DD HH:mm o formato ISO)')

    let bookedAt: Date | null = null
    const bookedRaw = get(r, 'bookedAt')
    if (bookedRaw) {
      bookedAt = parseCsvDateTime(bookedRaw)
      if (!bookedAt) errors.push('agendada_el inválida')
    }

    const statusRaw = norm(get(r, 'status'))
    if (!['', 'agendada', 'scheduled', 'activa', 'active', 'cancelada', 'canceled', 'cancelled'].includes(statusRaw)) {
      errors.push('estado inválido (agendada o cancelada)')
    }
    const attRaw = norm(get(r, 'attendance'))
    const attendance: ParsedCall['attendance'] | null =
      ['', 'pendiente', 'pending'].includes(attRaw) ? 'pending'
      : ['asistio', 'attended', 'si'].includes(attRaw) ? 'attended'
      : ['no_asistio', 'no_show', 'noshow', 'no'].includes(attRaw) ? 'no_show'
      : null
    if (!attendance) errors.push('asistencia inválida (pendiente, asistio o no_asistio)')

    if (errors.length || !scheduledAt || !attendance) return { line, errors }
    const eventUri = get(r, 'eventUri') || null
    const inviteeUri = get(r, 'inviteeUri') || null
    return {
      line,
      errors,
      data: {
        leadName,
        leadEmail: get(r, 'leadEmail'),
        eventName: get(r, 'eventName') || (inviteeUri ? 'Calendly' : 'Llamada importada'),
        scheduledAt,
        bookedAt: bookedAt ?? scheduledAt,
        budget: get(r, 'budget') || null,
        status: ['cancelada', 'canceled', 'cancelled'].includes(statusRaw) ? 'canceled' : 'scheduled',
        attendance,
        isReschedule: yes(get(r, 'isReschedule')),
        calendlyEventUri: eventUri,
        calendlyInviteeUri: inviteeUri,
        source: inviteeUri ? 'calendly' : 'manual'
      }
    }
  })
  return { rows }
}

// Duplicado: mismo invitado de Calendly, o mismo email/lead + misma hora de llamada
export function callKey(c: { leadName: string; leadEmail: string; scheduledAt: Date; calendlyInviteeUri?: string | null }): string {
  if (c.calendlyInviteeUri) return `uri|${c.calendlyInviteeUri}`
  const who = (c.leadEmail || c.leadName).trim().toLowerCase()
  return `${who}|${Math.floor(c.scheduledAt.getTime() / 60000)}`
}
