'use client'
import Script from 'next/script'
import { useEffect } from 'react'

declare global {
  interface Window {
    $crisp?: unknown[]
    CRISP_WEBSITE_ID?: string
  }
}

const WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID

export default function CrispChat() {
  useEffect(() => {
    if (!WEBSITE_ID) return
    if (typeof window === 'undefined') return

    window.$crisp = window.$crisp || []
    window.CRISP_WEBSITE_ID = WEBSITE_ID

    // Auto-open chat if URL has ?support=open or ?feedback=open
    const params = new URLSearchParams(window.location.search)
    if (params.get('support') === 'open' || params.get('feedback') === 'open') {
      ;(window.$crisp as unknown[]).push(['do', 'chat:open'])
    }
  }, [])

  if (!WEBSITE_ID) return null

  return (
    <Script id="crisp-chat" strategy="afterInteractive">
      {`
        window.$crisp = window.$crisp || [];
        window.CRISP_WEBSITE_ID = "${WEBSITE_ID}";
        (function(){
          var d = document, s = d.createElement("script");
          s.src = "https://client.crisp.chat/l.js";
          s.async = 1;
          d.getElementsByTagName("head")[0].appendChild(s);
        })();
      `}
    </Script>
  )
}

/** Helper to identify the logged-in user inside Crisp (call after login). */
export function identifyCrispUser(opts: { email: string; name?: string; userId?: number }) {
  if (typeof window === 'undefined' || !window.$crisp) return
  const queue = window.$crisp as unknown[]
  queue.push(['set', 'user:email', [opts.email]])
  if (opts.name) queue.push(['set', 'user:nickname', [opts.name]])
  if (opts.userId) queue.push(['set', 'session:data', [[['user_id', String(opts.userId)]]]])
}

/** Programmatically open the chat (used by sidebar Ajuda button). */
export function openCrispChat() {
  if (typeof window === 'undefined' || !window.$crisp) return
  ;(window.$crisp as unknown[]).push(['do', 'chat:open'])
}
