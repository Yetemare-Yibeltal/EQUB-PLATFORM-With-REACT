import { useLanguage } from '../../hooks/useLanguage'
import { formatRelative } from '../../utils/formatDate'
import Button from '../common/Button'

export default function NotificationItem ({ notification, onRead, onDelete }) {
  const { t } = useLanguage()
  const unread = !notification.readAt

  return (
    <li
      className={unread ? 'notification notification-unread' : 'notification'}
    >
      <span className='notification-dot' aria-hidden='true' />
      <div className='notification-body'>
        <p className='notification-title'>{t(notification.title)}</p>
        <p>{t(notification.message)}</p>
        <p className='muted notification-time'>
          {formatRelative(notification.createdAt)}
        </p>
      </div>
      <div className='notification-actions'>
        {unread && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onRead(notification.id)}
          >
            {t('Mark read')}
          </Button>
        )}
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onDelete(notification.id)}
        >
          {t('Delete')}
        </Button>
      </div>
    </li>
  )
}
