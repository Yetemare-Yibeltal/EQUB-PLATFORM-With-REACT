import { useEffect, useMemo, useState } from 'react'
import { SOCKET_EVENTS } from '../constants/socketEvents'
import { refreshSession } from '../services/api'
import { createSocket } from '../services/socket'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { SocketContext } from './contexts'

const TOKEN_ERROR_PATTERN = /token|account|password/i

export function SocketProvider ({ children }) {
  const status = useAuthStore(state => state.status)
  const userId = useAuthStore(state => state.user?.id)
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated' || !userId) return undefined

    const instance = createSocket()

    const recover = async () => {
      try {
        await refreshSession()
        instance.connect()
      } catch {
        return
      }
    }

    instance.on('connect', () => setConnected(true))

    instance.on('disconnect', reason => {
      setConnected(false)

      if (reason === 'io server disconnect') {
        recover()
      }
    })

    instance.on('connect_error', error => {
      if (TOKEN_ERROR_PATTERN.test(error.message)) {
        recover()
      }
    })

    instance.on(
      SOCKET_EVENTS.NOTIFICATION_NEW,
      ({ notification, unreadCount }) => {
        useNotificationStore.getState().receive(notification, unreadCount)
      }
    )

    instance.on(SOCKET_EVENTS.UNREAD_COUNT, ({ unreadCount }) => {
      useNotificationStore.getState().setUnreadCount(unreadCount)
    })

    setSocket(instance)

    return () => {
      instance.removeAllListeners()
      instance.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [status, userId])

  const value = useMemo(() => ({ socket, connected }), [socket, connected])

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  )
}
