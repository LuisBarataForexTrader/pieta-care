import { NextRequest, NextResponse } from 'next/server'

const PUBLIC = ['/login', '/register', '/invite']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC.some(p => pathname.startsWith(p))
  const token = req.cookies.get('token')?.value

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(token ? '/dashboard' : '/login', req.url)
    )
  }

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|public).*)'],
}
