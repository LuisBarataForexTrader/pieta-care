import { NextRequest, NextResponse } from 'next/server'

const PUBLIC = ['/', '/login', '/register', '/invite', '/verificar-email', '/privacidade', '/termos']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))
  const token = req.cookies.get('token')?.value

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|public).*)'],
}
