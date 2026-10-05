// Parseo y validación de CSV de cierres de venta (importación histórica).

export const PRODUCTS = ['CRM', 'Agente IA', 'Enigma', 'Comunidad', 'Asesoría', 'Otro'] as const
export const MAX_IMPORT_ROWS = 2000

export const TEMPLATE_CSV =
  'cliente,producto,onboarding,mensual,meses_contrato,estado,fecha,fecha_cancelacion\n' +
  'Juan Pérez,CRM,500,300,6,activo,2026-01-15,\n' +
  'Ana Gómez,Enigma,997,0,,completado,2026-02-03,\n' +
  'Empresa XYZ,Agente IA,800,250,12,cancelado,2026-01-20,2026-04-20\n'

export interface ParsedSale {
  clientName: string
  product: string
  customProduct: string | null
  onboardingValue: number
  recurringValue: number
  contractMonths: number | null
  status: 'active' | 'cancelled' | 'completed'
  createdAt: Date
  cancelledAt: Date | null
}

export interface RowResult {
  line: number // línea en el archivo (1 = encabezado)
  data?: ParsedSale
  errors: string[]
}

// Nombres de columna aceptados (sin tildes, minúsculas)
const HEADER_ALIASES: Record<string, string> = {
  cliente: 'clientName', nombre: 'clientName', client: 'clientName', clientname: 'clientName',
  producto: 'product', product: 'product', servicio: 'product',
  producto_personalizado: 'customProduct', customproduct: 'customProduct',
  onboarding: 'onboarding', onboardingvalue: 'onboarding', pago_unico: 'onboarding',
  mensual: 'recurring', recurrente: 'recurring', mrr: 'recurring', recurringvalue: 'recurring',
  meses_contrato: 'contractMonths', meses: 'contractMonths', contractmonths: 'contractMonths',
  estado: 'status', status: 'status',
  fecha: 'createdAt', fecha_cierre: 'createdAt', createdat: 'createdAt', date: 'createdAt',
  fecha_cancelacion: 'cancelledAt', cancelledat: 'cancelledAt'
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, '_')

// Parser CSV con comillas, separador coma o punto y coma, y BOM
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] || ''
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ','

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (inQuotes) {
      if (c === '"' && clean[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQuotes = false
      else field += c
    } else if (c === '"') inQuotes = true
    else if (c === sep) { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++
      row.push(field); field = ''
      rows.push(row); row = []
    } else field += c
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

export function parseAmount(raw: string): number | null {
  let s = raw.replace(/[$€\s]|usd|mxn/gi, '')
  if (s === '') return 0
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    // El último separador es el decimal
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (lastComma > -1) {
    // "1,200" → miles; "12,5" → decimal
    s = /,\d{3}$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.')
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return n < 0 ? null : n
}

// Acepta YYYY-MM-DD o DD/MM/YYYY (formato latino). Devuelve fecha local a las 12:00.
export function parseCsvDate(raw: string): Date | null {
  const s = raw.trim()
  let y: number, m: number, d: number
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s)
  if (match) { y = +match[1]; m = +match[2]; d = +match[3] }
  else if ((match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s))) { d = +match[1]; m = +match[2]; y = +match[3] }
  else return null
  const date = new Date(y, m - 1, d, 12, 0, 0)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

function normalizeProduct(raw: string): { product: string; customProduct: string | null } {
  const key = norm(raw)
  const known = PRODUCTS.find(p => norm(p) === key)
  if (known) return { product: known, customProduct: null }
  return { product: 'Otro', customProduct: raw.trim() }
}

function normalizeStatus(raw: string): ParsedSale['status'] | null {
  const k = norm(raw)
  if (k === '' || ['activo', 'active', 'activa'].includes(k)) return 'active'
  if (['cancelado', 'cancelled', 'canceled', 'cancelada', 'perdido'].includes(k)) return 'cancelled'
  if (['completado', 'completed', 'completada', 'terminado'].includes(k)) return 'completed'
  return null
}

export function parseSalesCsv(text: string): { rows: RowResult[]; fatal?: string } {
  const table = parseCsv(text).filter(r => r.some(c => c.trim() !== ''))
  if (table.length < 2) return { rows: [], fatal: 'El archivo está vacío o no tiene filas de datos' }
  if (table.length - 1 > MAX_IMPORT_ROWS) {
    return { rows: [], fatal: `Máximo ${MAX_IMPORT_ROWS} filas por archivo` }
  }

  const cols: Record<string, number> = {}
  table[0].forEach((h, i) => {
    const field = HEADER_ALIASES[norm(h)]
    if (field && !(field in cols)) cols[field] = i
  })
  const missing = ['clientName', 'product', 'createdAt'].filter(f => !(f in cols))
  if (missing.length) {
    return { rows: [], fatal: 'Faltan columnas obligatorias: cliente, producto y fecha' }
  }

  const get = (r: string[], f: string) => (f in cols ? (r[cols[f]] ?? '').trim() : '')

  const rows = table.slice(1).map((r, idx): RowResult => {
    const line = idx + 2
    const errors: string[] = []

    const clientName = get(r, 'clientName')
    if (!clientName) errors.push('cliente vacío')

    const productRaw = get(r, 'product')
    if (!productRaw) errors.push('producto vacío')
    const { product, customProduct: autoCustom } = normalizeProduct(productRaw)
    const customProduct = get(r, 'customProduct') || autoCustom

    const onboarding = parseAmount(get(r, 'onboarding'))
    if (onboarding === null) errors.push('onboarding no es un número válido')
    const recurring = parseAmount(get(r, 'recurring'))
    if (recurring === null) errors.push('mensual no es un número válido')

    const monthsRaw = get(r, 'contractMonths')
    const months = monthsRaw === '' ? null : Number(monthsRaw)
    if (months !== null && (!Number.isInteger(months) || months <= 0)) errors.push('meses_contrato inválido')

    const status = normalizeStatus(get(r, 'status'))
    if (!status) errors.push('estado inválido (activo, cancelado o completado)')

    const createdAt = parseCsvDate(get(r, 'createdAt'))
    if (!createdAt) errors.push('fecha inválida (usa AAAA-MM-DD o DD/MM/AAAA)')

    let cancelledAt: Date | null = null
    const cancelRaw = get(r, 'cancelledAt')
    if (cancelRaw) {
      cancelledAt = parseCsvDate(cancelRaw)
      if (!cancelledAt) errors.push('fecha_cancelacion inválida')
    }
    if (status === 'cancelled' && !cancelledAt && createdAt) cancelledAt = createdAt

    if (errors.length || !status || !createdAt || onboarding === null || recurring === null) {
      return { line, errors }
    }
    return {
      line,
      errors,
      data: {
        clientName,
        product,
        customProduct: product === 'Otro' ? customProduct : null,
        onboardingValue: onboarding,
        recurringValue: recurring,
        contractMonths: months,
        status,
        createdAt,
        cancelledAt: status === 'cancelled' ? cancelledAt : null
      }
    }
  })

  return { rows }
}

// Clave para detectar duplicados: cliente + producto + día de cierre (local)
export function saleKey(clientName: string, product: string, date: Date): string {
  const d = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  return `${clientName.trim().toLowerCase()}|${product}|${d}`
}
