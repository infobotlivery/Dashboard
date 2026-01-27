import { NextResponse } from 'next/server'

// =====================================================
// MIDDLEWARE DESACTIVADO TEMPORALMENTE
// =====================================================
// La verificación de seguridad está desactivada para permitir
// el funcionamiento del dashboard mientras se resuelven los
// problemas de compatibilidad con Edge Runtime.
//
// TODO: Re-implementar seguridad cuando tengamos tiempo para
// depurar correctamente.
// =====================================================

export function middleware() {
  // Permitir todas las requests sin verificación
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
