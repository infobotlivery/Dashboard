// Shared types for the Dashboard project
// Canonical type definitions - import from '@/types' instead of defining locally

// ============================================================
// Dashboard / Metrics types
// ============================================================

export interface WeeklyMetric {
  id?: number
  weekStart: string
  mrr: number
  mrrComunidad: number
  pipelineActivo: number
  personasAgendadas?: number
  cierresSemana: number
  contenidoPublicado: number
  leadsEntrantes: number
}

export interface MonthlyScorecard {
  id?: number
  month: string
  facturacionTotal: number
  mrr: number
  mrrComunidad?: number
  clientesNuevos: number
  clientesPerdidos: number
  enigmaVendidos: number
  serviciosRecurrentes: number
  leadsTotales: number
  tasaCierre: number
}

export interface DailyCheck {
  id: number
  date: string
  publicoContenido: boolean
  respondioLeads: boolean
  notas?: string
}

export interface Settings {
  logoUrl: string | null
  brandPrimary: string
  brandDark: string
}

// ============================================================
// Sales types
// ============================================================

export interface SalesClose {
  id?: number
  clientName: string
  product: string
  customProduct: string | null
  onboardingValue: number
  recurringValue: number
  contractMonths: number | null
  status: 'active' | 'cancelled' | 'completed'
  createdAt: string
  cancelledAt: string | null
}

export interface SalesSummary {
  mrrActivo: number
  totalOnboardingHistorico: number
  totalOnboardingMes: number
  clientesActivos: number
  clientesTotales: number
  cierresMes: number
}

// ============================================================
// Finance types
// ============================================================

export interface FinanceSummary {
  month: string
  income: {
    total: number
    onboarding: number
    mrrServices: number
    mrrCommunity: number
  }
  expenses: {
    total: number
    byType: {
      fixed: number
      recurring: number
    }
    byCategory: Record<string, { total: number; color: string; items: { name: string; amount: number }[] }>
    list?: { id: number; name: string; amount: number; type: string; category: string; categoryColor: string }[]
  }
  netProfit: number
  activeClients: number
}

export interface MonthlyHistory {
  month: string
  monthLabel: string
  totalIncome: number
  totalOnboarding: number
  totalMrrServices: number
  totalMrrCommunity: number
  totalExpenses: number
  netProfit: number
}

export interface Category {
  id: number
  name: string
  color: string
  _count: { expenses: number }
}

export interface Expense {
  id: number
  name: string
  amount: number
  type: string
  categoryId: number
  category: { name: string; color: string }
  startDate: string
  endDate: string | null
  notes: string | null
  billingDay: number | null
  paidByClient: string | null
}

export interface UpcomingPayment {
  id: number
  name: string
  amount: number
  billingDay: number
  paidByClient: string | null
  category: { name: string; color: string }
  nextPaymentDate: string
  daysUntil: number
}

export interface MonthlyGoal {
  id: number
  month: string
  incomeTarget: number
  expenseLimit: number
  savingsTarget: number
  notes: string | null
}
