'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-brand-muted mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-brand-dark border border-brand-border rounded-button px-4 py-3 text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
