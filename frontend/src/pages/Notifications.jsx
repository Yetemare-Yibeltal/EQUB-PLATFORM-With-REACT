import { useCallback, useEffect, useState } from 'react'
import Button from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'
import Loader from '../components/common/Loader'
import NotificationList from '../components/notification/NotificationList'
import { useLanguage } from '../hooks/useLanguage'
import { useNotifications } from '../hooks/useNotifications'
import { notificationService } from '../services/notificationService'
import { getErrorMessage } from '../utils/errors'

const PAGE_SIZE = 20

export default function Notifications () {
  const { t } = useLanguage()
  const { unreadCount, lastReceived, markRead, markAllRead, remove } =
    useNotifications()
  const [filter, setFilter] = useState('all')
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const fetchPage = useCallback(
    page =>
      notificationService.list({
        page,
        limit: PAGE_SIZE,
        ...(filter === 'unread' ? { unread: true } : {})
      }),
    [filter]
  )

  useEffect(() => {
    let active = true

    setLoading(true)
    setError('')

    fetchPage(1)
      .then(result => {
        if (!active) return
        setItems(result.notifications)
        setMeta(result.meta)
      })
      .catch(requestError => {
        if (active) setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [fetchPage])

  useEffect(() => {
    if (!lastReceived) return

    setItems(current =>
      current.some(item => item.id === lastReceived.id)
        ? current
        : [lastReceived, ...current]
    )
  }, [lastReceived])

  const loadMore = async () => {
    setLoadingMore(true)
    setError('')

    try {
      const result = await fetchPage(meta.page + 1)
      setItems(current => [
        ...current,
        ...result.notifications.filter(
          item => !current.some(known => known.id === item.id)
        )
      ])
      setMeta(result.meta)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoadingMore(false)
    }
  }

  const handleRead = async id => {
    try {
      const updated = await markRead(id)
      setItems(current =>
        filter === 'unread'
          ? current.filter(item => item.id !== id)
          : current.map(item => (item.id === id ? updated : item))
      )
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const handleReadAll = async () => {
    try {
      await markAllRead()
      const readAt = new Date().toISOString()
      setItems(current =>
        filter === 'unread'
          ? []
          : current.map(item => ({ ...item, readAt: item.readAt ?? readAt }))
      )
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const handleDelete = async id => {
    try {
      await remove(id)
      setItems(current => current.filter(item => item.id !== id))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <div className='page'>
      <header className='page-header page-header-row'>
        <div>
          <h1>{t('Notifications')}</h1>
          <p className='muted'>{t('{count} unread', { count: unreadCount })}</p>
        </div>
        <Button
          variant='secondary'
          onClick={handleReadAll}
          disabled={unreadCount === 0}
        >
          {t('Mark all as read')}
        </Button>
      </header>

      <div
        className='tabs'
        role='tablist'
        aria-label={t('Notification filter')}
      >
        {['all', 'unread'].map(value => (
          <button
            key={value}
            type='button'
            role='tab'
            aria-selected={filter === value}
            className={filter === value ? 'tab active' : 'tab'}
            onClick={() => setFilter(value)}
          >
            {value === 'all' ? t('All') : t('Unread')}
          </button>
        ))}
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <Loader label='Loading notifications' />
      ) : (
        <NotificationList
          notifications={items}
          onRead={handleRead}
          onDelete={handleDelete}
          emptyTitle={
            filter === 'unread'
              ? t('No unread notifications')
              : t('No notifications yet')
          }
        />
      )}

      {meta?.hasNextPage && !loading && (
        <div className='center-row'>
          <Button variant='secondary' onClick={loadMore} loading={loadingMore}>
            {t('Load more')}
          </Button>
        </div>
      )}
    </div>
  )
}
