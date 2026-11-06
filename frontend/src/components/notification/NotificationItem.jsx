import { Link } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import { translateNotification } from '../../i18n/notificationText'
import { formatRelative } from '../../utils/formatDate'
import Button from '../common/Button'

const groupIdOf = notification => {
  const group = notification.groupId ?? notification.group

  if (!group) return null

  return String(typeof group === 'object' ? group.id ?? group._id : group)
}

const targetOf = notification => {
  const groupId = groupIdOf(notification)

  if (!groupId) return null

  return String(notification.type ?? '').includes('member')
    ? `/groups/${groupId}/members`
    : `/groups/${groupId}`
}

export default function NotificationItem ({ notification, onRead, onDelete }) {
  const { language, t } = useLanguage()
  const unread = !notification.readAt
  const text = translateNotification(language, notification)
  const target = targetOf(notification)

  const handleOpen = () => {
    if (unread) onRead(notification.id)
  }

  return (
    <li
      className={unread ? 'notification notification-unread' : 'notification'}
    >
      <span className='notification-dot' aria-hidden='true' />
      <div className='notification-body'>
        <p className='notification-title'>
          {target ? (
            <Link to={target} onClick={handleOpen}>
              {text.title}
            </Link>
          ) : (
            text.title
          )}
        </p>
        <p>{text.message}</p>
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
