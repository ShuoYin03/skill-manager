import { useEffect, useState } from 'react'

export function useTheme(themeSetting: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => {
    if (themeSetting !== 'system') return themeSetting
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (themeSetting !== 'system') {
      setResolved(themeSetting)
      document.documentElement.setAttribute('data-theme', themeSetting)
      return
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent): void => {
      const theme = e.matches ? 'dark' : 'light'
      setResolved(theme)
      document.documentElement.setAttribute('data-theme', theme)
    }

    const initial = mq.matches ? 'dark' : 'light'
    setResolved(initial)
    document.documentElement.setAttribute('data-theme', initial)

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeSetting])

  return resolved
}
