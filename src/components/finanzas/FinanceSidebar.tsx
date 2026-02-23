'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export type FinanceTab = 'resumen' | 'gastos' | 'categorias' | 'historial' | 'metas' | 'clientes'

interface FinanceSidebarProps {
  activeTab: FinanceTab
  onTabChange: (tab: FinanceTab) => void
  onLogout: () => void
}

const tabs = [
  { id: 'resumen' as FinanceTab, label: 'Resumen', icon: '📊' },
  { id: 'gastos' as FinanceTab, label: 'Gastos', icon: '💸' },
  { id: 'categorias' as FinanceTab, label: 'Categorias', icon: '🏷️' },
  { id: 'historial' as FinanceTab, label: 'Historial', icon: '📈' },
  { id: 'metas' as FinanceTab, label: 'Metas', icon: '🎯' },
  { id: 'clientes' as FinanceTab, label: 'Clientes', icon: '👥' }
]

export function FinanceSidebar({ activeTab, onTabChange, onLogout }: FinanceSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 glass-sidebar z-50">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-green-500">$</span>
            <span>Finanzas</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Control financiero</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeSidebarTab"
                      className="absolute left-0 w-1 h-8 bg-green-500 rounded-r-full"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <span className="text-lg">🏠</span>
            <span className="font-medium">Dashboard</span>
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Cerrar Sesion</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-sidebar border-t border-white/5 z-50 safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'text-green-500'
                  : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 glass-sidebar border-b border-white/5 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span className="text-green-500">$</span>
            <span>Finanzas</span>
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              🏠
            </Link>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              🚪
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
