'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

interface Props {
  variant?: 'button' | 'inline'
  className?: string
}

export default function ThemeToggle({ variant = 'button', className }: Props) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={toggle}
        className={className ?? 'theme-toggle-inline'}
        aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        title={isDark ? 'Tema claro' : 'Tema escuro'}
      >
        {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        <span>{isDark ? 'Claro' : 'Escuro'}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={className ?? 'theme-toggle-pill'}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      {isDark ? <Sun size={14} strokeWidth={2.25} /> : <Moon size={14} strokeWidth={2.25} />}
    </button>
  )
}
