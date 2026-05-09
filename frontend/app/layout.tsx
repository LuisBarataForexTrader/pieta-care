import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider, themeBootScript } from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
})

// Global SEO defaults. Per-page metadata overrides title/description
// via Next.js metadata API. The defaults below are the safety net.
export const metadata: Metadata = {
  metadataBase: new URL('https://pietas.care'),
  title: {
    default: 'pietas.care · App para cuidar de pais idosos em Portugal',
    template: '%s · pietas.care',
  },
  description: 'App portuguesa para famílias que cuidam de pais idosos: medicação, consultas, sinais vitais e coordenação familiar. 14 dias grátis.',
  applicationName: 'pietas.care',
  authors: [{ name: 'Flow 88 — Gestão de Ativos Lda', url: 'https://pietas.care' }],
  generator: 'Next.js',
  keywords: [
    'app cuidar pais idosos',
    'app cuidar idosos',
    'gestão medicação idosos',
    'agenda medicação',
    'cuidar familiar idoso',
    'app saúde idosos',
    'cuidador familiar',
    'aplicação cuidados domiciliários',
    'pietas.care',
    'cuidar pais distância',
  ],
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'pietas.care',
    locale: 'pt_PT',
    url: 'https://pietas.care',
    // og:image injected automatically via app/opengraph-image.tsx (Next.js file convention)
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-icon.png',
  },
  alternates: { canonical: '/' },
  verification: { google: '0encH7vlWreXvvokfCSH4Se8km2PxSahJdvEqo8A_R0' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2A6049' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1116' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Apply theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
