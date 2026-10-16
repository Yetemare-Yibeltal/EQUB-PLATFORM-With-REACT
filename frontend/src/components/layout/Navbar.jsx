import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import Button from '../common/Button'
import Icon from '../common/Icon'
import NotificationBell from '../notification/NotificationBell'

export default function Navbar () {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
  }

  const initial = (user?.fullName || '?').trim().charAt(0).toUpperCase()

  return (
    <header className='navbar'>
      <Link to={ROUTES.DASHBOARD} className='brand navbar-brand'>
        <span className='brand-mark'>E</span>
        <span>Equb</span>
      </Link>
      <div className='navbar-actions'>
        <button
          type='button'
          className='icon-button'
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
          }
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <NotificationBell />
        <Link to={ROUTES.PROFILE} className='navbar-user'>
          <span className='avatar' aria-hidden='true'>
            {initial}
          </span>
          <span className='navbar-name'>{user?.fullName}</span>
        </Link>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleLogout}
          loading={loggingOut}
        >
          Log out
        </Button>
      </div>
    </header>
  )
}
