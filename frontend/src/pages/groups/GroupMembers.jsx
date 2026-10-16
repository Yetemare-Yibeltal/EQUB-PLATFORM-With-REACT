import { useCallback, useState } from 'react'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import MemberList from '../../components/member/MemberList'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useGroup } from '../../hooks/useGroup'
import { memberService } from '../../services/memberService'
import { getErrorMessage } from '../../utils/errors'

const VIEWS = [
  { value: 'active', label: 'Members' },
  { value: 'pending', label: 'Join requests' }
]

export default function GroupMembers () {
  const { group, isOrganizer, version, refresh } = useGroup()
  const [view, setView] = useState('active')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [actionError, setActionError] = useState('')

  const loader = useCallback(
    () =>
      memberService.list(group.id, {
        page,
        limit: 25,
        ...(isOrganizer ? { status: view } : {})
      }),
    [group.id, isOrganizer, view, page, version]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  const changeView = value => {
    setView(value)
    setPage(1)
  }

  const act = async (member, action) => {
    setBusyId(member.id)
    setActionError('')

    try {
      await action()
      refresh()
    } catch (requestError) {
      setActionError(getErrorMessage(requestError))
    } finally {
      setBusyId(null)
      setRemoveTarget(null)
    }
  }

  return (
    <div className='stack'>
      {isOrganizer && (
        <div className='tabs' role='tablist' aria-label='Member views'>
          {VIEWS.map(item => (
            <button
              key={item.value}
              type='button'
              role='tab'
              aria-selected={view === item.value}
              className={view === item.value ? 'tab active' : 'tab'}
              onClick={() => changeView(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <ErrorMessage message={error} onRetry={reload} />
      <ErrorMessage message={actionError} />
      {loading && !data && <Loader label='Loading members' />}

      {data && data.members.length === 0 && (
        <EmptyState
          title={view === 'pending' ? 'No pending requests' : 'No members yet'}
          description={
            view === 'pending' ? 'New join requests appear here.' : undefined
          }
        />
      )}

      {data && data.members.length > 0 && (
        <MemberList
          members={data.members}
          showPhone={isOrganizer}
          canManage={isOrganizer}
          groupOpen={group.status === 'open'}
          busyId={busyId}
          onApprove={member =>
            act(member, () => memberService.approve(group.id, member.id))
          }
          onReject={member =>
            act(member, () => memberService.reject(group.id, member.id))
          }
          onRemove={setRemoveTarget}
        />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title='Remove this member?'
        message={`${
          removeTarget?.user?.fullName ?? 'This member'
        } is removed from the group and cannot rejoin.`}
        confirmLabel='Remove member'
        variant='danger'
        loading={busyId === removeTarget?.id}
        onConfirm={() =>
          act(removeTarget, () =>
            memberService.remove(group.id, removeTarget.id)
          )
        }
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
