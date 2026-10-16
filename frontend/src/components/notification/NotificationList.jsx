import EmptyState from '../common/EmptyState'
import NotificationItem from './NotificationItem'

export default function NotificationList ({
  notifications,
  onRead,
  onDelete,
  emptyTitle
}) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description='Updates about your groups, contributions, draws, and payouts appear here.'
      />
    )
  }

  return (
    <ul className='notification-list'>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRead={onRead}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
