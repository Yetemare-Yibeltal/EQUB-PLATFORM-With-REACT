import { useState } from 'react'
import Button from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import ErrorMessage from '../components/common/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { useSocket } from '../hooks/useSocket'
import { useTheme } from '../hooks/useTheme'
import { getErrorMessage } from '../utils/errors'

const LANGUAGE_CHOICES = [
  { value: 'en', label: 'English' },
  { value: 'am', label: 'አማርኛ' }
]

export default function Settings () {
  const { logoutAll } = useAuth()
  const { theme, setTheme } = useTheme()
  const { connected } = useSocket()
  const { language, setLanguage, t } = useLanguage()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleLogoutAll = async () => {
    setBusy(true)
    setError('')

    try {
      await logoutAll()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className='page'>
      <header className='page-header'>
        <h1>{t('Settings')}</h1>
        <p className='muted'>{t('Appearance, connection, and sessions')}</p>
      </header>

      <section className='card'>
        <h2>{t('Language')}</h2>
        <p className='muted'>{t('Choose the language of the platform')}</p>
        <div className='segmented' role='group' aria-label={t('Language')}>
          {LANGUAGE_CHOICES.map(choice => (
            <button
              key={choice.value}
              type='button'
              className={
                language === choice.value ? 'segment active' : 'segment'
              }
              aria-pressed={language === choice.value}
              onClick={() => setLanguage(choice.value)}
              lang={choice.value}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </section>

      <section className='card'>
        <h2>{t('Appearance')}</h2>
        <div className='segmented' role='group' aria-label={t('Theme')}>
          {['light', 'dark'].map(value => (
            <button
              key={value}
              type='button'
              className={theme === value ? 'segment active' : 'segment'}
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
            >
              {value === 'light' ? t('Light') : t('Dark')}
            </button>
          ))}
        </div>
      </section>

      <section className='card'>
        <h2>{t('Live updates')}</h2>
        <p>
          <span
            className={
              connected ? 'status-dot status-on' : 'status-dot status-off'
            }
          />
          {connected
            ? t('Connected, notifications arrive instantly')
            : t('Not connected, reconnecting')}
        </p>
      </section>

      <section className='card'>
        <h2>{t('Sessions')}</h2>
        <p className='muted'>
          {t(
            'Sign out of this device and every other device where you are logged in.'
          )}
        </p>
        <ErrorMessage message={error} />
        <Button variant='danger' onClick={() => setConfirmOpen(true)}>
          {t('Log out of all devices')}
        </Button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title='Log out of all devices?'
        message='You will need to log in again everywhere, including this device.'
        confirmLabel='Log out everywhere'
        variant='danger'
        loading={busy}
        onConfirm={handleLogoutAll}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
