'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SelectOption {
  value: string
  label: string
  icon?: string
}

interface SelectProps {
  label?: string
  error?: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export function Select({ label, error, options, value, onChange, placeholder = 'Seleccionar...' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cerrar con Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-brand-muted mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Botón principal */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-brand-dark border rounded-button px-4 py-3 text-left flex items-center justify-between transition-all ${
            isOpen
              ? 'border-brand-primary ring-2 ring-brand-primary/20'
              : 'border-brand-border hover:border-brand-primary/50'
          } ${error ? 'border-red-500' : ''}`}
        >
          <span className={selectedOption ? 'text-white' : 'text-brand-muted'}>
            {selectedOption?.icon && <span className="mr-2">{selectedOption.icon}</span>}
            {selectedOption?.label || placeholder}
          </span>

          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 text-brand-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 bg-brand-dark border border-brand-border rounded-xl shadow-xl overflow-hidden"
            >
              <div className="py-1 max-h-60 overflow-y-auto">
                {options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      onChange?.(option.value)
                      setIsOpen(false)
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all ${
                      option.value === value
                        ? 'bg-brand-primary/20 text-brand-primary'
                        : 'text-white hover:bg-white/5'
                    }`}
                  >
                    {option.icon && (
                      <span className="text-lg">{option.icon}</span>
                    )}
                    <span className="flex-1">{option.label}</span>
                    {option.value === value && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 text-brand-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </motion.svg>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
