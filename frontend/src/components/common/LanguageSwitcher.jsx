import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../hooks/useLanguage'
import { LANGUAGE_OPTIONS } from '../../i18n/languages'
import '../../styles/language.css'

export default function LanguageSwitcher () {
  const { language, setLanguage, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handlePointer = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKey = event => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const current =
    LANGUAGE_OPTIONS.find(option => option.code === language) ??
    LANGUAGE_OPTIONS[0]

  const choose = code => {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <div className='language-switcher' ref={rootRef}>
      <button
        type='button'
        className='language-trigger'
        aria-haspopup='menu'
        aria-expanded={open}
        aria-label={t('language.change')}
        onClick={() => setOpen(value => !value)}
      >
        <svg
          width='18'
          height='18'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          aria-hidden='true'
        >
          <circle cx='12' cy='12' r='10' />
          <path d='M2 12h20' />
          <path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' />
        </svg>
        <span lang={current.code}>{current.short}</span>
      </button>

      {open && (
        <ul
          className='language-menu'
          role='menu'
          aria-label={t('language.label')}
        >
          {LANGUAGE_OPTIONS.map(option => (
            <li key={option.code} role='none'>
              <button
                type='button'
                role='menuitemradio'
                aria-checked={option.code === language}
                lang={option.code}
                className={
                  option.code === language
                    ? 'language-option language-option-active'
                    : 'language-option'
                }
                onClick={() => choose(option.code)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
