'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'

interface Props {
  target: 'proposals' | 'sales'
  label: string
  warning: string
  onDone: () => void
}

/** Borrado masivo con confirmación escrita. El servidor hace un respaldo de la BD antes de borrar. */
export function ResetButton({ target, label, warning, onDone }: Props) {
  const [busy, setBusy] = useState(false)

  async function run() {
    const typed = window.prompt(`${warning}\n\nSe hace un respaldo de la base de datos antes de borrar.\nEscribe BORRAR para confirmar:`)
    if (typed === null) return
    if (typed.trim() !== 'BORRAR') { alert('No se borró nada: no escribiste BORRAR.'); return }
    setBusy(true)
    try {
      const res = await apiFetch('/api/admin/reset', { method: 'POST', body: JSON.stringify({ target, confirm: 'BORRAR' }) })
      const data = await res.json()
      if (data.success) {
        alert(`Listo. Respaldo: ${data.data.backup ?? 'no disponible'}`)
        onDone()
      } else alert(data.error || 'No se pudo borrar')
    } catch {
      alert('Error de conexión')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button onClick={run} disabled={busy} className="btn-secondary text-sm text-red-400">
      {busy ? 'Borrando…' : `🗑 ${label}`}
    </button>
  )
}
