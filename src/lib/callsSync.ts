import prisma from '@/lib/db'
import {
  CalendlyError,
  extractBudget,
  getCurrentUserUri,
  isCalendlyConfigured,
  listEvents,
  listInvitees
} from '@/lib/calendly'

export interface SyncResult {
  configured: boolean
  created: number
  updated: number
  skipped?: boolean
  error?: string
}

const MIN_INTERVAL_MS = 30_000
let lastSyncAt = 0
let inFlight: Promise<SyncResult> | null = null

// Ejecuta tareas con concurrencia limitada para no rebasar el límite de Calendly
async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let index = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) await fn(items[index++])
    })
  )
}

async function runSync(days: number): Promise<SyncResult> {
  const now = new Date()
  const minStart = new Date(now.getTime() - days * 86_400_000)
  const maxStart = new Date(now.getTime() + 180 * 86_400_000)
  const nameFilter = process.env.CALENDLY_EVENT_NAME_FILTER?.trim().toLowerCase()

  const userUri = await getCurrentUserUri()
  let events = await listEvents(userUri, minStart, maxStart)
  if (nameFilter) events = events.filter(e => e.name.toLowerCase().includes(nameFilter))

  const known = await prisma.call.findMany({
    where: { calendlyEventUri: { in: events.map(e => e.uri) } },
    select: { id: true, calendlyEventUri: true, status: true, scheduledAt: true }
  })
  const knownByUri = new Map(known.map(k => [k.calendlyEventUri, k]))

  let created = 0
  let updated = 0

  // Llamadas ya guardadas: solo refrescar estado y hora (cancelaciones)
  for (const ev of events) {
    const k = knownByUri.get(ev.uri)
    if (!k) continue
    const start = new Date(ev.start_time)
    const status = ev.status === 'canceled' ? 'canceled' : 'scheduled'
    if (k.status !== status || k.scheduledAt.getTime() !== start.getTime()) {
      await prisma.call.update({ where: { id: k.id }, data: { status, scheduledAt: start } })
      updated++
    }
  }

  // Llamadas nuevas: traer al invitado (nombre, email, respuestas)
  const fresh = events.filter(e => !knownByUri.has(e.uri))
  await mapLimit(fresh, 4, async ev => {
    const invitees = await listInvitees(ev.uri)
    for (const inv of invitees) {
      const exists = await prisma.call.findUnique({ where: { calendlyInviteeUri: inv.uri }, select: { id: true } })
      if (exists) continue

      // Llamada cargada antes por CSV (sin enlace a Calendly): vincularla en vez de duplicarla
      const imported = inv.email
        ? await prisma.call.findFirst({
            where: { leadEmail: inv.email, scheduledAt: new Date(ev.start_time), calendlyInviteeUri: null },
            select: { id: true }
          })
        : null
      if (imported) {
        await prisma.call.update({
          where: { id: imported.id },
          data: {
            calendlyEventUri: invitees.length === 1 ? ev.uri : null,
            calendlyInviteeUri: inv.uri,
            status: ev.status === 'canceled' || inv.status === 'canceled' ? 'canceled' : 'scheduled'
          }
        })
        updated++
        continue
      }

      await prisma.call.create({
        data: {
          calendlyEventUri: invitees.length === 1 ? ev.uri : null,
          calendlyInviteeUri: inv.uri,
          leadName: inv.name || inv.email || 'Sin nombre',
          leadEmail: inv.email || '',
          eventName: ev.name,
          scheduledAt: new Date(ev.start_time),
          bookedAt: new Date(inv.created_at || ev.created_at),
          budget: extractBudget(inv),
          status: ev.status === 'canceled' || inv.status === 'canceled' ? 'canceled' : 'scheduled',
          // Una reprogramación no es un lead nuevo. Calendly marca `old_invitee` en la reserva NUEVA;
          // la original (cancelada, con `rescheduled: true`) sí es el lead.
          isReschedule: !!inv.old_invitee,
          // Calendly permite marcar "no asistió" desde su panel
          attendance: inv.no_show ? 'no_show' : 'pending',
          source: 'calendly',
          joinUrl: ev.location?.actual_instance?.join_url ?? null
        }
      })
      created++
    }
  })

  return { configured: true, created, updated }
}

/**
 * Sincroniza Calendly → tabla Call. Evita ejecuciones simultáneas y repetidas
 * (mínimo 30 s entre sincronizaciones salvo `force`).
 */
export async function syncCalls(opts: { days?: number; force?: boolean } = {}): Promise<SyncResult> {
  if (!isCalendlyConfigured()) return { configured: false, created: 0, updated: 0 }
  if (inFlight) return inFlight
  if (!opts.force && Date.now() - lastSyncAt < MIN_INTERVAL_MS) {
    return { configured: true, created: 0, updated: 0, skipped: true }
  }

  inFlight = runSync(opts.days ?? 120)
    .catch((err): SyncResult => {
      console.error('[Calendly sync]', err)
      return {
        configured: true,
        created: 0,
        updated: 0,
        error: err instanceof CalendlyError ? err.message : 'Error al sincronizar con Calendly'
      }
    })
    .finally(() => {
      lastSyncAt = Date.now()
      inFlight = null
    })
  return inFlight
}
