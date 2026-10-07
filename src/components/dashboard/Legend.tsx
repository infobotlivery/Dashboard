'use client'

import { motion } from 'framer-motion'

interface Term {
  name: string
  def: string
}

const BLOCKS: { n: number; title: string; question: string; terms: Term[] }[] = [
  {
    n: 1,
    title: 'Embudo',
    question: '¿Estoy generando oportunidades?',
    terms: [
      { name: 'Leads', def: 'Llamadas agendadas (cuenta cuando la persona agenda; una reprogramación no cuenta de nuevo) + propuestas enviadas directamente, sin llamada previa.' },
      { name: 'Llamadas asistidas', def: 'Llamadas del periodo que marcaste como "Asistió". Las canceladas no cuentan.' },
      { name: 'Propuestas enviadas', def: 'Propuestas con fecha de envío dentro del periodo, en cualquier estado.' },
      { name: 'Clientes nuevos', def: 'Cierres de venta firmados en el periodo (se crean al aprobar una propuesta).' },
      { name: '% de cierre ★', def: 'Clientes nuevos ÷ llamadas asistidas. Si todavía no marcaste asistencia, se calcula sobre las llamadas agendadas y la tarjeta lo avisa.' },
      { name: 'Asistencia', def: 'Asistieron ÷ (asistieron + no asistieron). Lo que falta por marcar no entra.' }
    ]
  },
  {
    n: 2,
    title: 'Ventas',
    question: '¿Cuánto vendí?',
    terms: [
      { name: 'Venta nueva', def: 'Valor firmado en el periodo: onboarding + MRR de los clientes que cerraron. No significa que ya se cobró.' },
      { name: 'Facturación por cerrar', def: 'Dinero de las propuestas que siguen "por aprobación": pago único + mensual esperado. Es tu pronóstico.' }
    ]
  },
  {
    n: 3,
    title: 'Dinero',
    question: '¿Cuánto entró?',
    terms: [
      { name: 'Facturación cobrada ★', def: 'Solo lo que realmente cobraste: onboarding + mensualidades que marcaste con ✓ (en el mes en que las cobraste) + otras cuentas por cobrar cobradas.' },
      { name: 'Mensualidades por cobrar', def: 'MRR proyectado − MRR ya cobrado. Es la lista de "Cobros de clientes" y la caja "Cuentas por cobrar".' },
      { name: 'Utilidad neta', def: 'Facturación cobrada − gastos del mes (aparece arriba, en Finanzas del Mes).' }
    ]
  },
  {
    n: 4,
    title: 'Base recurrente (MRR)',
    question: '¿Qué tan sólida es la agencia?',
    terms: [
      { name: 'MRR activo ★', def: 'Lo que tus clientes con recurrencia vigente deberían pagar cada mes (proyectado). El onboarding nunca entra aquí.' },
      { name: 'MRR nuevo', def: 'Mensualidades de los clientes que cerraron en el periodo.' },
      { name: 'MRR perdido y churn', def: 'Mensualidades de los clientes que cancelaron en el periodo, y ese monto como % del MRR que tenías al empezar.' },
      { name: 'MRR neto', def: 'MRR nuevo − MRR perdido: cuánto creció o se encogió tu base.' }
    ]
  }
]

const RULES = [
  'Vendido, cobrado y recurrente nunca se mezclan: Venta nueva es lo firmado, Facturación cobrada es la caja y MRR es la base mensual.',
  'Cada hecho tiene una sola fecha: el lead nace al agendar la llamada, la venta al firmar y el dinero al cobrar.',
  'El selector de mes de arriba mueve toda la página. Semanal = actividad, Mensual = dinero, Trimestral = tendencia.',
  '★ marca los 3 números clave para revisar cada semana: % de cierre, Facturación cobrada y MRR activo.'
]

const WORKFLOW = [
  ['Llamadas', 'Llegan desde Calendly (sincronización automática una vez conectado el token) o por CSV. Tú marcas "Asistió / No asistió"; al marcar "Asistió" registras la propuesta enviada.'],
  ['Propuestas', 'Las registras tú. Al pasarlas a "Aprobada" se abre el cierre de venta y nace el cliente.'],
  ['Cobros', 'Cada mensualidad se cobra en el día en que cerraste la venta. Marca ✓ en "Cobros de clientes" y se mueven la facturación, la utilidad y las cuentas por cobrar.'],
  ['Gastos y cuentas manuales', 'Se gestionan en Finanzas (Gastos). Los gastos recurrentes con día de cobro aparecen como cuentas por pagar hasta que los marques pagados.']
]

export function Legend() {
  return (
    <motion.details
      open
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-0 overflow-hidden group"
    >
      <summary className="cursor-pointer select-none list-none px-6 py-4 flex items-center justify-between">
        <span>
          <span className="text-xl font-bold text-white">Leyenda: cómo leer este panel</span>
          <span className="block text-sm text-brand-muted">Qué significa cada número y qué haces tú frente a lo que es automático</span>
        </span>
        <span className="text-brand-muted text-sm group-open:rotate-180 transition-transform">▾</span>
      </summary>

      <div className="px-6 pb-6 space-y-6 border-t border-white/10 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {BLOCKS.map(b => (
            <section key={b.n} className="space-y-2">
              <h3 className="flex items-baseline gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">{b.n}</span>
                <span className="text-lg font-semibold text-white">{b.title}</span>
                <span className="text-sm text-brand-muted">{b.question}</span>
              </h3>
              <dl className="space-y-2">
                {b.terms.map(t => (
                  <div key={t.name} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                    <dt className="text-sm font-semibold text-white">{t.name}</dt>
                    <dd className="text-sm text-brand-muted">{t.def}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Reglas para no perderte</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-brand-muted">
            {RULES.map(r => <li key={r}>{r}</li>)}
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Qué es automático y qué haces tú</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {WORKFLOW.map(([k, v]) => (
              <div key={k} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                <dt className="text-sm font-semibold text-white">{k}</dt>
                <dd className="text-sm text-brand-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-xs text-brand-muted border-t border-white/10 pt-4">
          El seguimiento de cobros empieza en julio de 2026. Los meses anteriores no tienen registro de pagos, así que se
          consideran cobrados (su facturación = onboarding + MRR) y no se pueden editar. Las conversaciones de Kommo se muestran
          aparte y no suman a los leads.
        </p>
      </div>
    </motion.details>
  )
}
