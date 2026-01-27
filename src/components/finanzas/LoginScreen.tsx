'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GlassCard } from './GlassCard'

interface LoginScreenProps {
  password: string
  setPassword: (password: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  error: string
}

export function LoginScreen({
  password,
  setPassword,
  onSubmit,
  loading,
  error
}: LoginScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <GlassCard hover={false}>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
            <p className="text-gray-400 mt-2">Ingresa tu contrasena para continuar</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm text-center bg-red-400/10 py-2 px-4 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Ingresar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-gray-400 hover:text-[#44e1fc] text-sm transition-colors"
            >
              Volver al Dashboard
            </a>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
