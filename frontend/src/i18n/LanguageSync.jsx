import { useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { STORAGE_KEY } from './languages'

const hasStoredLanguage = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export default function LanguageSync () {
  const { user, updateProfile } = useAuth()
  const { language, setLanguage } = useLanguage()
  const adopted = useRef(false)
  const pushed = useRef('')

  useEffect(() => {
    if (!user) {
      adopted.current = false
      pushed.current = ''
      return
    }

    if (!adopted.current) {
      adopted.current = true

      if (!hasStoredLanguage() && user.language && user.language !== language) {
        setLanguage(user.language)
        return
      }
    }

    if (
      user.language &&
      user.language !== language &&
      pushed.current !== language
    ) {
      pushed.current = language
      updateProfile({ language }).catch(() => null)
    }
  }, [user, language, setLanguage, updateProfile])

  return null
}
