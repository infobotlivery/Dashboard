'use client'

import { useState, useEffect } from 'react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  label: string
  icon?: React.ReactNode
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  color?: string
}

export default function NumberInput({
  value,
  onChange,
  label,
  icon,
  prefix,
  suffix,
  min = 0,
  max = Infinity,
  step = 1,
  disabled = false,
  color = '#44e1fc'
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(value.toString())

  useEffect(() => {
    setLocalValue(value.toString())
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    const parsed = parseFloat(newValue)
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed)
    }
  }

  const handleBlur = () => {
    const parsed = parseFloat(localValue)
    if (isNaN(parsed)) {
      setLocalValue(value.toString())
    } else {
      const clamped = Math.min(Math.max(parsed, min), max)
      setLocalValue(clamped.toString())
      onChange(clamped)
    }
  }

  const increment = () => {
    const newValue = Math.min(value + step, max)
    onChange(newValue)
  }

  const decrement = () => {
    const newValue = Math.max(value - step, min)
    onChange(newValue)
  }

  return (
    <div className="bg-brand-dark rounded-xl border border-brand-border p-4 transition-all hover:border-brand-primary/30">
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <span style={{ color }} className="text-lg">
            {icon}
          </span>
        )}
        <label className="text-sm font-medium text-brand-muted">{label}</label>
      </div>

      <div className="flex items-center gap-2">
        {prefix && (
          <span className="text-brand-muted text-lg font-medium">{prefix}</span>
        )}

        <div className="flex-1 flex items-center bg-black/30 rounded-lg overflow-hidden border border-brand-border focus-within:border-brand-primary transition-colors">
          <button
            type="button"
            onClick={decrement}
            disabled={disabled || value <= min}
            className="px-3 py-2 text-brand-muted hover:text-white hover:bg-brand-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>

          <input
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            className="flex-1 bg-transparent text-center text-xl font-semibold text-white py-2 focus:outline-none disabled:opacity-50"
          />

          <button
            type="button"
            onClick={increment}
            disabled={disabled || value >= max}
            className="px-3 py-2 text-brand-muted hover:text-white hover:bg-brand-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {suffix && (
          <span className="text-brand-muted text-lg font-medium">{suffix}</span>
        )}
      </div>
    </div>
  )
}
