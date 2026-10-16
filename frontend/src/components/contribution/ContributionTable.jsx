import { Link } from 'react-router-dom'
import { groupPath } from '../../constants/routes'
import { CONTRIBUTION_STATUS_LABELS } from '../../constants/statuses'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import Button from '../common/Button'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'

const STATUS_LABELS = {
  ...CONTRIBUTION_STATUS_LABELS,
  overdue: 'Overdue',
  late: 'Late'
}

const ownerOf = contribution =>
  contribution.user && typeof contribution.user === 'object'
    ? contribution.user.id
    : contribution.user

export default function ContributionTable ({
  contributions,
  showUser = false,
  showGroup = false,
  currentUserId,
  canManage = false,
  payingId = null,
  onPayOnline,
  onRecord,
  onWaive
}) {
  const columns = []

  if (showUser) {
    columns.push({
      key: 'user',
      header: 'Member',
      render: contribution => contribution.user?.fullName ?? '—'
    })
  }

  if (showGroup) {
    columns.push(
      {
        key: 'group',
        header: 'Equb',
        render: contribution =>
          contribution.group ? (
            <Link to={groupPath(contribution.group.id)}>
              {contribution.group.name}
            </Link>
          ) : (
            '—'
          )
      },
      {
        key: 'cycle',
        header: 'Cycle',
        render: contribution =>
          contribution.cycle ? `#${contribution.cycle.number}` : '—'
      }
    )
  }

  columns.push(
    {
      key: 'dueDate',
      header: 'Due',
      render: contribution => formatDate(contribution.dueDate)
    },
    {
      key: 'amount',
      header: 'Amount',
      render: contribution => {
        if (contribution.status === 'paid')
          return formatMoney(contribution.amountPaid)
        if (contribution.status === 'waived') return '—'

        return (
          <>
            {formatMoney(contribution.amountOutstanding)}
            {contribution.amountOutstanding > contribution.amount && (
              <span className='muted'> incl. penalty</span>
            )}
          </>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: contribution => {
        const overdue =
          contribution.status === 'pending' && contribution.isOverdue

        return (
          <span className='inline-actions'>
            <StatusBadge
              status={overdue ? 'overdue' : contribution.status}
              labels={STATUS_LABELS}
            />
            {contribution.status === 'paid' && contribution.isLate && (
              <StatusBadge status='late' labels={STATUS_LABELS} />
            )}
          </span>
        )
      }
    },
    {
      key: 'actions',
      header: '',
      className: 'cell-actions',
      render: contribution => {
        if (contribution.status !== 'pending') return null

        const own = ownerOf(contribution) === currentUserId

        return (
          <div className='inline-actions'>
            {own && onPayOnline && (
              <Button
                size='sm'
                onClick={() => onPayOnline(contribution)}
                loading={payingId === contribution.id}
              >
                Pay online
              </Button>
            )}
            {canManage && (
              <Button
                size='sm'
                variant='secondary'
                onClick={() => onRecord(contribution)}
              >
                Record
              </Button>
            )}
            {canManage && (
              <Button
                size='sm'
                variant='ghost'
                onClick={() => onWaive(contribution)}
              >
                Waive
              </Button>
            )}
          </div>
        )
      }
    }
  )

  return (
    <DataTable columns={columns} rows={contributions} caption='Contributions' />
  )
}
