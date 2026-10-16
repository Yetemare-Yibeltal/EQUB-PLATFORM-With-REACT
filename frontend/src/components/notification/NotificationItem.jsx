import { formatRelative } from '../../utils/formatDate'
import Button from '../common/Button'

export default function NotificationItem ({ notification, onRead, onDelete }) {
  const unread = !notification.readAt

  return (
    <li
      className={unread ? 'notification notification-unread' : 'notification'}
    >
      <span className='notification-dot' aria-hidden='true' />
      <div className='notification-body'>
        <p className='notification-title'>{notification.title}</p>
        <p>{notification.message}</p>
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
            Mark read
          </Button>
        )}
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onDelete(notification.id)}
        >
          Delete
        </Button>
      </div>
    </li>
  )
}
