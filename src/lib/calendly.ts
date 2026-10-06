// Cliente mínimo de la API v2 de Calendly (solo lectura).
// Requiere CALENDLY_API_TOKEN. CALENDLY_API_BASE existe solo para pruebas locales.

const BASE = process.env.CALENDLY_API_BASE || 'https://api.calendly.com'

export class CalendlyError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
  }
}

export function isCalendlyConfigured(): boolean {
  return !!process.env.CALENDLY_API_TOKEN
}

async function request<T>(pathOrUrl: string): Promise<T> {
  const token = process.env.CALENDLY_API_TOKEN
  if (!token) throw new CalendlyError('CALENDLY_API_TOKEN no está configurado')

  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${BASE}${pathOrUrl}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store'
  })
  if (res.status === 401 || res.status === 403) throw new CalendlyError('Token de Calendly inválido o sin permisos', res.status)
  if (res.status === 429) throw new CalendlyError('Calendly limitó las consultas, reintenta en un minuto', 429)
  if (!res.ok) throw new CalendlyError(`Calendly respondió ${res.status}`, res.status)
  return res.json() as Promise<T>
}

export interface CalendlyEvent {
  uri: string
  name: string
  status: 'active' | 'canceled'
  start_time: string
  created_at: string
  location?: { actual_instance?: { join_url?: string } | null } | null
}

export interface CalendlyInvitee {
  uri: string
  name: string
  email: string
  status: string
  created_at: string
  rescheduled?: boolean
  old_invitee?: string | null   // presente en la reserva NUEVA de una reprogramación
  no_show?: { uri: string } | null
  questions_and_answers?: { question: string; answer: string; position: number }[]
}

interface Page<T> {
  collection: T[]
  pagination: { next_page: string | null }
}

async function listAll<T>(firstPath: string, maxPages = 20): Promise<T[]> {
  const out: T[] = []
  let next: string | null = firstPath
  for (let i = 0; next && i < maxPages; i++) {
    const page: Page<T> = await request<Page<T>>(next)
    out.push(...page.collection)
    next = page.pagination?.next_page ?? null
  }
  return out
}

export async function getCurrentUserUri(): Promise<string> {
  const me = await request<{ resource: { uri: string } }>('/users/me')
  return me.resource.uri
}

export function listEvents(userUri: string, minStart: Date, maxStart: Date): Promise<CalendlyEvent[]> {
  const qs = new URLSearchParams({
    user: userUri,
    min_start_time: minStart.toISOString(),
    max_start_time: maxStart.toISOString(),
    count: '100',
    sort: 'start_time:desc'
  })
  return listAll<CalendlyEvent>(`/scheduled_events?${qs}`)
}

export function listInvitees(eventUri: string): Promise<CalendlyInvitee[]> {
  // eventUri es la URL completa del evento: .../scheduled_events/{uuid}
  return listAll<CalendlyInvitee>(`${eventUri}/invitees?count=100`, 3)
}

// Respuesta sobre presupuesto / facturación del formulario de agendamiento
// (los formularios antiguos preguntan "qué fondos estarías dispuesto a invertir")
const BUDGET_QUESTION = /presupuesto|facturaci[oó]n|budget|inversi[oó]n|invertir|fondos/i

export function extractBudget(invitee: CalendlyInvitee): string | null {
  const qa = (invitee.questions_and_answers ?? []).find(q => BUDGET_QUESTION.test(q.question) && q.answer?.trim())
  return qa ? qa.answer.trim() : null
}
