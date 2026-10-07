'use client'

import { useState } from 'react'
import { Modal, modalInputCls } from './Modal'

const TYPES = [
  { id: 'metrics', label: 'Métricas por mes', hint: 'Una fila por mes: leads, cierres, facturación, MRR, churn…' },
  { id: 'sales', label: 'Ventas / clientes', hint: 'Cierres de venta por fecha de cierre' },
  { id: 'collections', label: 'Cobros', hint: 'Mensualidades y otros ingresos cobrados, por fecha de cobro' },
  { id: 'proposals', label: 'Propuestas', hint: 'Por fecha de la propuesta' },
  { id: 'calls', label: 'Llamadas', hint: 'Por fecha de la llamada' },
  { id: 'expenses', label: 'Gastos', hint: 'Gastos vigentes en el rango' }
]

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState('metrics')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const params = new URLSearchParams({ type })
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const current = TYPES.find(t => t.id === type)

  return (
    <Modal open={open} title="Exportar datos (CSV)" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-brand-muted mb-1">Qué exportar</label>
          <select value={type} onChange={e => setType(e.target.value)} className={`${modalInputCls} dark-select`}>
            {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <p className="text-xs text-brand-muted mt-1">{current?.hint}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-brand-muted mb-1">Desde</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={modalInputCls} />
          </div>
          <div>
            <label className="block text-sm text-brand-muted mb-1">Hasta</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={modalInputCls} />
          </div>
        </div>
        <p className="text-xs text-brand-muted">Deja las fechas vacías para exportar todo el historial.</p>
        <a href={`/api/export?${params}`} download className="btn-primary text-sm inline-block" onClick={onClose}>
          ⬇ Descargar CSV
        </a>
      </div>
    </Modal>
  )
}
