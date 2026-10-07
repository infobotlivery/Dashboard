'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PeriodMetrics } from '@/components/dashboard/PeriodMetrics'
import { Legend } from '@/components/dashboard/Legend'

type Tab = 'weekly' | 'monthly' | 'quarterly'

const TABS: { id: Tab; label: string; icon: string; period: 'week' | 'month' | 'quarter'; title: string }[] = [
  { id: 'weekly', label: 'Semanal', icon: '📊', period: 'week', title: 'Métricas semanales' },
  { id: 'monthly', label: 'Mensual', icon: '📈', period: 'month', title: 'Métricas mensuales' },
  { id: 'quarterly', label: 'Trimestral', icon: '🗓️', period: 'quarter', title: 'Métricas trimestrales' }
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('weekly')
  const tab = TABS.find(t => t.id === activeTab) ?? TABS[0]

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-brand-border bg-brand-dark/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold">Panel de Administración</h1>
              <p className="text-brand-muted text-sm">Revisión semanal, mensual y trimestral</p>
            </div>
            <a href="/" className="btn-secondary text-sm">Ver Dashboard</a>
          </div>
        </div>
      </header>

      <div className="border-b border-brand-border bg-black/50">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
                  activeTab === t.id ? 'text-brand-primary' : 'text-brand-muted hover:text-white'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
                {activeTab === t.id && (
                  <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <p className="text-sm text-brand-muted bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          Estas métricas se calculan solas a partir de las propuestas, los cierres de venta y los leads de Kommo.
          Registra propuestas y cierres directamente desde el <a href="/" className="text-brand-primary hover:underline">dashboard</a>.
        </p>
        <PeriodMetrics key={tab.id} periods={[tab.period]} initialPeriod={tab.period} title={tab.title} />
        <Legend />
      </main>
    </div>
  )
}
