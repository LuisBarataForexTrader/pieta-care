'use client'
import Script from 'next/script'
import { useEffect } from 'react'

declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void
      maximize?: () => void
      setAttributes?: (attrs: Record<string, string>, cb?: (err: unknown) => void) => void
      visitor?: Record<string, string>
    }
    Tawk_LoadStart?: Date
  }
}

const PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID
const WIDGET_ID = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || 'default'

/**
 * Tawk.to live chat widget — truly free tier, unlimited chats/agents.
 * Configure NEXT_PUBLIC_TAWK_PROPERTY_ID (and optionally
 * NEXT_PUBLIC_TAWK_WIDGET_ID) in Vercel.
 */
export default function ChatWidget() {
  useEffect(() => {
    if (!PROPERTY_ID || typeof window === 'undefined') return

    // Auto-open chat if URL has ?support=open or ?feedback=open (used by trial emails)
    const params = new URLSearchParams(window.location.search)
    if (params.get('support') === 'open' || params.get('feedback') === 'open') {
      const tryMaximize = () => window.Tawk_API?.maximize?.()
      // Tawk loads async — retry a few times
      const interval = setInterval(() => {
        if (window.Tawk_API?.maximize) {
          tryMaximize()
          clearInterval(interval)
        }
      }, 400)
      setTimeout(() => clearInterval(interval), 8000)
    }
  }, [])

  if (!PROPERTY_ID) return null

  const src = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`

  return (
    <Script id="tawk-chat" strategy="afterInteractive">
      {`
        var Tawk_API = Tawk_API || {};
        var Tawk_LoadStart = new Date();
        (function(){
          var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
          s1.async = true;
          s1.src = "${src}";
          s1.charset = "UTF-8";
          s1.setAttribute("crossorigin", "*");
          s0.parentNode.insertBefore(s1, s0);
        })();
      `}
    </Script>
  )
}

/** Identify the logged-in user so the agent sees who's writing. */
export function identifyChatUser(opts: { email: string; name?: string; userId?: number }) {
  if (typeof window === 'undefined') return
  const apply = () => {
    if (!window.Tawk_API?.setAttributes) return false
    window.Tawk_API.setAttributes(
      {
        name: opts.name ?? '',
        email: opts.email,
        ...(opts.userId ? { user_id: String(opts.userId) } : {}),
      },
      () => undefined,
    )
    return true
  }
  if (apply()) return
  // Tawk may not be ready yet — poll briefly
  const interval = setInterval(() => {
    if (apply()) clearInterval(interval)
  }, 400)
  setTimeout(() => clearInterval(interval), 8000)
}

/** Programmatically open the chat (used by sidebar Ajuda button). */
export function openChat() {
  if (typeof window === 'undefined') return
  window.Tawk_API?.maximize?.()
}
