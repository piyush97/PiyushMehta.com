// src/components/theme/ThemeSelector.tsx
import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'high-contrast'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove(
    'professional-dark', 'professional-light', 'high-contrast',
    'retro-tech', 'minimalist', 'custom-theme', 'light'
  )
  if (theme === 'dark') root.classList.add('professional-dark')
  else if (theme === 'light') root.classList.add('professional-light')
  else root.classList.add('high-contrast')
  localStorage.setItem('theme', theme)
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
}

function getCurrentTheme(): Theme {
  const root = document.documentElement
  if (root.classList.contains('professional-light') || root.classList.contains('light')) return 'light'
  if (root.classList.contains('high-contrast')) return 'high-contrast'
  return 'dark'
}

export function ThemeSelector() {
  const [current, setCurrent] = useState<Theme>('dark')

  useEffect(() => {
    setCurrent(getCurrentTheme())
    const handler = (e: Event) => setCurrent((e as CustomEvent<{ theme: Theme }>).detail.theme)
    document.addEventListener('themechange', handler)
    return () => document.removeEventListener('themechange', handler)
  }, [])

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'dark', label: 'Dark', icon: '◐' },
    { value: 'light', label: 'Light', icon: '○' },
    { value: 'high-contrast', label: 'High contrast', icon: '●' },
  ]

  return (
    <div className="theme-selector" role="group" aria-label="Select theme">
      {themes.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          className={`theme-opt${current === value ? ' active' : ''}`}
          onClick={() => applyTheme(value)}
          aria-pressed={current === value}
          aria-label={label}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
