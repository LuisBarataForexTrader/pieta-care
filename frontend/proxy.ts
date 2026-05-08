import { NextRequest, NextResponse } from 'next/server'

const PUBLIC = [
  '/', '/login', '/register', '/invite',
  '/verificar-email', '/privacidade', '/termos', '/planos',
]

// File extensions of static assets that must NEVER hit the auth gate —
// images, fonts, manifest, etc. live in /public and are served from root.
// (The Next.js matcher's `public` exclusion only catches /public/* paths,
// which is a path that doesn't exist at runtime.)
const STATIC_EXT = /\.(?:webp|svg|png|jpe?g|gif|ico|webmanifest|json|css|js|map|woff2?|ttf|eot|mp4|webm|mp3|wav|txt|xml|pdf)$/i

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Bypass any static asset. Avoids gating images in /public/showcase/ etc.
  if (STATIC_EXT.test(pathname)) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))
  const token = req.cookies.get('token')?.value

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  // Same matcher as before plus a broad static-extension exclusion so the
  // proxy short-circuits before any logic runs (faster + cheaper).
  matcher: ['/((?!_next|favicon\\.ico|manifest\\.json|public|.*\\.(?:webp|svg|png|jpe?g|gif|ico|webmanifest|woff2?|ttf|css|js|map)).*)'],
}
