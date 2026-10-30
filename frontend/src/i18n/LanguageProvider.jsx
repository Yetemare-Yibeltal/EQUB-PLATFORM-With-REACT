import { useCallback, useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './languageContext'
import { DEFAULT_LANGUAGE, LANGUAGE_CODES, STORAGE_KEY } from './languages'
import { translate } from './translate'

const readStoredLanguage = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return LANGUAGE_CODES.includes(stored) ? stored : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export default function LanguageProvider ({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    document.title = translate(language, 'brand.name')
  }, [language])

  const setLanguage = useCallback(next => {
    if (!LANGUAGE_CODES.includes(next)) return

    setLanguageState(next)

    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      return
    }
  }, [])

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language]
  )

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
