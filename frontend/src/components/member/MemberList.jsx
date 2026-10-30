import { MEMBER_ROLE_LABELS } from '../../constants/roles'
import { MEMBER_STATUS_LABELS } from '../../constants/statuses'
import { useLanguage } from '../../hooks/useLanguage'
import { formatDate } from '../../utils/formatDate'
import Button from '../common/Button'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'

export default function MemberList ({
  members,
  showPhone = false,
  canManage = false,
  groupOpen = false,
  busyId = null,
  onApprove,
  onReject,
  onRemove
}) {
  const { t } = useLanguage()

  const columns = [
    {
      key: 'name',
      header: 'Member',
      render: member => (
        <span className='person'>
          <span className='avatar avatar-sm' aria-hidden='true'>
            {(member.user?.fullName || '?').charAt(0).toUpperCase()}
          </span>
          {member.user?.fullName}
        </span>
      )
    },
    ...(showPhone
      ? [
          {
            key: 'phone',
            header: 'Phone',
            render: member => member.user?.phone ?? '—'
          }
        ]
      : []),
    {
      key: 'role',
      header: 'Role',
      render: member => (
        <StatusBadge
          status={member.role}
          labels={MEMBER_ROLE_LABELS}
          tone='neutral'
        />
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: member => (
        <StatusBadge status={member.status} labels={MEMBER_STATUS_LABELS} />
      )
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      render: member => (member.joinedAt ? formatDate(member.joinedAt) : '—')
    },
    {
      key: 'payout',
      header: 'Payout',
      render: member => {
        if (member.hasReceivedPayout) return t('Received')
        return member.payoutPosition
          ? t('Cycle {number}', { number: member.payoutPosition })
          : '—'
      }
    }
  ]

  if (canManage) {
    columns.push({
      key: 'actions',
      header: '',
      className: 'cell-actions',
      render: member => (
        <div className='inline-actions'>
          {member.status === 'pending' && (
            <>
              <Button
                size='sm'
                onClick={() => onApprove(member)}
                loading={busyId === member.id}
              >
                {t('Approve')}
              </Button>
              <Button
                size='sm'
                variant='secondary'
                onClick={() => onReject(member)}
                disabled={busyId === member.id}
              >
                {t('Reject')}
              </Button>
            </>
          )}
          {member.status === 'active' && member.role === 'member' && groupOpen && (
            <Button
              size='sm'
              variant='ghost'
              onClick={() => onRemove(member)}
              disabled={busyId === member.id}
            >
              {t('Remove')}
            </Button>
          )}
        </div>
      )
    })
  }

  return <DataTable columns={columns} rows={members} caption='Group members' />
}
