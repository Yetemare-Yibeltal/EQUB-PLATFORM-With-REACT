import { useCallback, useEffect, useMemo, useState } from 'react'
import { storage } from '../utils/storage'
import { ThemeContext } from './contexts'

export function ThemeProvider ({ children }) {
  const [theme, setThemeState] = useState(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setTheme = useCallback(next => {
    setThemeState(next)
    storage.set('theme', next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
