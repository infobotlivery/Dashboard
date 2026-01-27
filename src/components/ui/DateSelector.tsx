'use client'

import { useState, useRef, useEffect } from 'react'

interface DateSelectorProps {
  value: Date
  onChange: (date: Date) => void
  label: string
  mode?: 'date' | 'week' | 'month'
  disabled?: boolean
}

export default function DateSelector({
  value,
  onChange,
  label,
  mode = 'date',
  disabled = false
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const daysOfWeek = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

  const formatDisplay = () => {
    if (mode === 'month') {
      return `${months[value.getMonth()]} ${value.getFullYear()}`
    }
    if (mode === 'week') {
      const weekStart = new Date(value)
      const day = weekStart.getDay()
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
      weekStart.setDate(diff)
      return `Semana del ${weekStart.getDate()} de ${months[weekStart.getMonth()]}`
    }
    return `${value.getDate()} de ${months[value.getMonth()]} ${value.getFullYear()}`
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []

    // Días vacíos al inicio
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // Días del mes
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const handleDayClick = (day: Date | null) => {
    if (!day) return

    if (mode === 'week') {
      const weekStart = new Date(day)
      const dayOfWeek = weekStart.getDay()
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)
      onChange(weekStart)
    } else {
      onChange(day)
    }
    setIsOpen(false)
  }

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(viewDate.getFullYear(), monthIndex, 1)
    if (mode === 'month') {
      onChange(newDate)
      setIsOpen(false)
    } else {
      setViewDate(newDate)
    }
  }

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const prevYear = () => {
    setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1))
  }

  const nextYear = () => {
    setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1))
  }

  const isSelected = (day: Date | null) => {
    if (!day) return false

    if (mode === 'week') {
      const weekStart = new Date(value)
      const dayOfWeek = weekStart.getDay()
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      weekStart.setDate(diff)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      return day >= weekStart && day <= weekEnd
    }

    return day.toDateString() === value.toDateString()
  }

  const isToday = (day: Date | null) => {
    if (!day) return false
    return day.toDateString() === new Date().toDateString()
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-brand-muted mb-2">{label}</label>

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 bg-brand-dark border border-brand-border rounded-xl text-white transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-primary/30 cursor-pointer'
        } ${isOpen ? 'border-brand-primary' : ''}`}
      >
        <span className="font-medium">{formatDisplay()}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-brand-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full bg-brand-dark border border-brand-border rounded-xl shadow-2xl p-4 animate-fadeIn">
          {mode === 'month' ? (
            <>
              {/* Header para selección de mes */}
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevYear} className="p-2 hover:bg-brand-primary/10 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-muted" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-white font-semibold">{viewDate.getFullYear()}</span>
                <button type="button" onClick={nextYear} className="p-2 hover:bg-brand-primary/10 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-muted" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Grid de meses */}
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleMonthClick(index)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      value.getMonth() === index && value.getFullYear() === viewDate.getFullYear()
                        ? 'bg-brand-primary text-black'
                        : 'text-white hover:bg-brand-primary/10'
                    }`}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Header para selección de día/semana */}
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth} className="p-2 hover:bg-brand-primary/10 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-muted" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-white font-semibold">
                  {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button type="button" onClick={nextMonth} className="p-2 hover:bg-brand-primary/10 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-muted" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-brand-muted py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(viewDate).map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    disabled={!day}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      !day
                        ? 'invisible'
                        : isSelected(day)
                        ? 'bg-brand-primary text-black'
                        : isToday(day)
                        ? 'bg-brand-primary/20 text-brand-primary'
                        : 'text-white hover:bg-brand-primary/10'
                    }`}
                  >
                    {day?.getDate()}
                  </button>
                ))}
              </div>

              {/* Botón Hoy */}
              <div className="mt-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    if (mode === 'week') {
                      const dayOfWeek = today.getDay()
                      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
                      today.setDate(diff)
                    }
                    onChange(today)
                    setIsOpen(false)
                  }}
                  className="w-full py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                >
                  Hoy
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
