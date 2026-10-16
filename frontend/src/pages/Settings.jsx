import { useState } from 'react'
import Button from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import ErrorMessage from '../components/common/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { useTheme } from '../hooks/useTheme'
import { getErrorMessage } from '../utils/errors'

export default function Settings () {
  const { logoutAll } = useAuth()
  const { theme, setTheme } = useTheme()
  const { connected } = useSocket()
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
        <h1>Settings</h1>
        <p className='muted'>Appearance, connection, and sessions</p>
      </header>

      <section className='card'>
        <h2>Appearance</h2>
        <div className='segmented' role='group' aria-label='Theme'>
          {['light', 'dark'].map(value => (
            <button
              key={value}
              type='button'
              className={theme === value ? 'segment active' : 'segment'}
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
            >
              {value === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </section>

      <section className='card'>
        <h2>Live updates</h2>
        <p>
          <span
            className={
              connected ? 'status-dot status-on' : 'status-dot status-off'
            }
          />
          {connected
            ? 'Connected, notifications arrive instantly'
            : 'Not connected, reconnecting'}
        </p>
      </section>

      <section className='card'>
        <h2>Sessions</h2>
        <p className='muted'>
          Sign out of this device and every other device where you are logged
          in.
        </p>
        <ErrorMessage message={error} />
        <Button variant='danger' onClick={() => setConfirmOpen(true)}>
          Log out of all devices
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
