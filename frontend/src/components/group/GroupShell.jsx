import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { MEMBER_ROLE_LABELS } from '../../constants/roles'
import { ROUTES, groupPath } from '../../constants/routes'
import { GROUP_STATUS_LABELS } from '../../constants/statuses'
import { SOCKET_EVENTS } from '../../constants/socketEvents'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useSocket } from '../../hooks/useSocket'
import { groupService } from '../../services/groupService'
import ErrorMessage from '../common/ErrorMessage'
import Loader from '../common/Loader'
import StatusBadge from '../common/StatusBadge'

const LIVE_EVENTS = [
  SOCKET_EVENTS.GROUP_UPDATED,
  SOCKET_EVENTS.MEMBERS_CHANGED,
  SOCKET_EVENTS.CONTRIBUTION_UPDATED,
  SOCKET_EVENTS.CYCLE_UPDATED,
  SOCKET_EVENTS.DRAW_COMPLETED,
  SOCKET_EVENTS.PAYOUT_PAID
]

export default function GroupShell () {
  const { groupId } = useParams()
  const { isAdmin } = useAuth()
  const { socket } = useSocket()
  const [version, setVersion] = useState(0)

  const loader = useCallback(
    () => groupService.get(groupId),
    [groupId, version]
  )
const { data, error, reload } = useAsyncData(loader)

  const group = data && data.id === groupId ? data : null
  const membership = group?.membership ?? null
  const isOrganizer =
    membership?.role === 'organizer' && membership?.status === 'active'

  const refresh = useCallback(() => setVersion(current => current + 1), [])

  useEffect(() => {
    if (!socket) return undefined

    let timer = null

    const handleChange = payload => {
      if (payload?.groupId && payload.groupId !== groupId) return

      clearTimeout(timer)
      timer = setTimeout(refresh, 300)
    }

    LIVE_EVENTS.forEach(event => socket.on(event, handleChange))
    socket.emit(SOCKET_EVENTS.GROUP_SUBSCRIBE, { groupId }, () => {})

    return () => {
      clearTimeout(timer)
      LIVE_EVENTS.forEach(event => socket.off(event, handleChange))
    }
  }, [socket, groupId, refresh])

  const context = useMemo(
    () => ({
      group,
      membership,
      isOrganizer,
      isAdmin,
      canViewPrivate: isOrganizer || isAdmin,
      version,
      refresh
    }),
    [group, membership, isOrganizer, isAdmin, version, refresh]
  )

  if (!group) {
    if (error) {
      return (
        <div className='page'>
          <ErrorMessage message={error} onRetry={reload} />
          <Link to={ROUTES.GROUPS}>Back to my equbs</Link>
        </div>
      )
    }

    return <Loader label='Loading group' />
  }

  const tabs = [
    { to: '', label: 'Overview', end: true },
    { to: 'members', label: 'Members' },
    { to: 'cycles', label: 'Contributions' },
    { to: 'draws', label: 'Draws' },
    { to: 'payouts', label: 'Payouts' },
    { to: 'ledger', label: 'Ledger' },
    { to: 'reports', label: 'Reports' },
    ...(isOrganizer ? [{ to: 'settings', label: 'Settings' }] : [])
  ]

  return (
    <div className='page'>
      <header className='page-header'>
        <p>
          <Link to={ROUTES.GROUPS}>My equbs</Link>
        </p>
        <div className='title-row'>
          <h1>{group.name}</h1>
          <StatusBadge status={group.status} labels={GROUP_STATUS_LABELS} />
          {membership && (
            <StatusBadge
              status={membership.role}
              labels={MEMBER_ROLE_LABELS}
              tone='neutral'
            />
          )}
        </div>
        {group.description && <p className='muted'>{group.description}</p>}
      </header>

      <nav className='tabs' aria-label='Group sections'>
        {tabs.map(tab => (
          <NavLink
            key={tab.to || 'overview'}
            to={groupPath(groupId, tab.to)}
            end={tab.end}
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={context} />
    </div>
  )
}
