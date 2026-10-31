import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import { useNotifications } from '../../hooks/useNotifications'
import Icon from '../common/Icon'

export default function NotificationBell () {
  const { t } = useLanguage()
  const { unreadCount, refreshUnreadCount } = useNotifications()

  useEffect(() => {
    refreshUnreadCount().catch(() => null)
  }, [refreshUnreadCount])

  const label =
    unreadCount > 0
      ? t('Notifications, {count} unread', { count: unreadCount })
      : t('Notifications, none unread')

  return (
    <Link
      to={ROUTES.NOTIFICATIONS}
      className='icon-button bell'
      aria-label={label}
    >
      <Icon name='bell' />
      {unreadCount > 0 && (
        <span className='badge'>{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </Link>
  )
}
