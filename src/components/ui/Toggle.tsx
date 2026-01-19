'use client'

import { motion } from 'framer-motion'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, description, disabled = false }: ToggleProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl bg-brand-dark border border-brand-border transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-brand-primary/30'
      } ${checked ? 'border-brand-primary/50' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className="flex-1 pr-4">
        <p className="text-white font-medium">{label}</p>
        {description && (
          <p className="text-sm text-brand-muted mt-1">{description}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
          checked ? 'bg-brand-primary' : 'bg-brand-border'
        }`}
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) onChange(!checked)
        }}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-1'
          } mt-1`}
        />
      </button>
    </div>
  )
}
