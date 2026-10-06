'use client'

import { CsvImportCard } from './CsvImportCard'

interface Props {
  onImported?: () => void
}

export function SalesCsvImport({ onImported }: Props) {
  return (
    <CsvImportCard
      title="Importar ventas desde CSV"
      description="Columnas: cliente, producto, onboarding, mensual, meses_contrato, estado, fecha (y fecha_cancelacion opcional)."
      endpoint="/api/sales/import"
      noun="cierres"
      onImported={onImported}
    />
  )
}

export function ProposalsCsvImport({ onImported }: Props) {
  return (
    <CsvImportCard
      title="Importar propuestas enviadas desde CSV"
      description="Columnas: cliente, empresa, servicio, monto, mensual (MRR esperado, opcional), fecha, estado (por_aprobacion, aprobada o no_cerrada), notas."
      endpoint="/api/proposals/import"
      noun="propuestas"
      onImported={onImported}
    />
  )
}

export function CallsCsvImport({ onImported }: Props) {
  return (
    <CsvImportCard
      title="Importar llamadas desde CSV"
      description="Columnas: lead, email, fecha_llamada, agendada_el, presupuesto, estado (agendada o cancelada), reprogramada (si/no), asistencia (pendiente, asistio o no_asistio)."
      endpoint="/api/calls/import"
      noun="llamadas"
      onImported={onImported}
    />
  )
}
