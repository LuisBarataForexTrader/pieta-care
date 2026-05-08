'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'pieta_theme'

interface ThemeCtx {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const Ctx = createContext<ThemeCtx>({ theme: 'light', setTheme: () => {}, toggle: () => {} })

/** Inline script that applies the persisted theme BEFORE React hydration so
 * there's no flash. Inject this in the <head> via _document or the root layout. */
export const themeBootScript = `
(function(){
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    if (!t) {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();
`

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? null
    const initial: Theme =
      stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setThemeState(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    document.documentElement.setAttribute('data-theme', t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch {}
  }

  function toggle() {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return <Ctx.Provider value={{ theme, setTheme, toggle }}>{children}</Ctx.Provider>
}

export function useTheme() {
  return useContext(Ctx)
}
