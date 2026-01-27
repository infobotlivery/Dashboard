'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ExportType = 'all' | 'expenses' | 'history' | 'goals'

interface ExportButtonProps {
  className?: string
}

export function ExportButton({ className = '' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleExport = async (type: ExportType) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/finance/export?type=${type}`)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finanzas_${type}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 transition-all disabled:opacity-50"
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span className="font-medium text-sm">Exportar CSV</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-48 glass-card p-2 z-50"
            >
              <button
                onClick={() => handleExport('all')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all"
              >
                📦 Todo
              </button>
              <button
                onClick={() => handleExport('expenses')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all"
              >
                💸 Solo gastos
              </button>
              <button
                onClick={() => handleExport('history')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all"
              >
                📈 Solo historial
              </button>
              <button
                onClick={() => handleExport('goals')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all"
              >
                🎯 Solo metas
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
