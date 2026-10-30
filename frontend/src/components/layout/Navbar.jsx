import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { useTheme } from '../../hooks/useTheme'
import Button from '../common/Button'
import Icon from '../common/Icon'
import LanguageSwitcher from '../common/LanguageSwitcher'
import NotificationBell from '../notification/NotificationBell'

export default function Navbar () {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
  }

  const initial = (user?.fullName || '?').trim().charAt(0).toUpperCase()

  return (
    <header className='navbar'>
      <Link to={ROUTES.DASHBOARD} className='brand navbar-brand'>
        <span className='brand-mark'>K</span>
        <span>{t('brand.short')}</span>
      </Link>
      <div className='navbar-actions'>
        <LanguageSwitcher />
        <button
          type='button'
          className='icon-button'
          onClick={toggleTheme}
          aria-label={
            theme === 'dark'
              ? t('Switch to light theme')
              : t('Switch to dark theme')
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
          {t('nav.logout')}
        </Button>
      </div>
    </header>
  )
}
