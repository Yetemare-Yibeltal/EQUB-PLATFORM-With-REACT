import { Link } from 'react-router-dom'
import { groupPath } from '../../constants/routes'
import { PAYMENT_METHOD_LABELS } from '../../constants/paymentMethods'
import { PAYOUT_STATUS_LABELS } from '../../constants/statuses'
import { useLanguage } from '../../hooks/useLanguage'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import Button from '../common/Button'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'

const recipientOf = payout =>
  payout.user && typeof payout.user === 'object' ? payout.user.id : payout.user

export default function PayoutTable ({
  payouts,
  showGroup = false,
  showRecipient = false,
  canManage = false,
  currentUserId,
  onRecord
}) {
  const { t } = useLanguage()

  const columns = [
    {
      key: 'cycle',
      header: 'Cycle',
      render: payout => (payout.cycle ? `#${payout.cycle.number}` : '—')
    }
  ]

  if (showGroup) {
    columns.push({
      key: 'group',
      header: 'Equb',
      render: payout =>
        payout.group ? (
          <Link to={groupPath(payout.group.id)}>{payout.group.name}</Link>
        ) : (
          '—'
        )
    })
  }

  if (showRecipient) {
    columns.push({
      key: 'recipient',
      header: 'Recipient',
      render: payout => payout.user?.fullName ?? '—'
    })
  }

  columns.push(
    {
      key: 'amount',
      header: 'Amount',
      render: payout => formatMoney(payout.amount)
    },
    {
      key: 'status',
      header: 'Status',
      render: payout => (
        <StatusBadge status={payout.status} labels={PAYOUT_STATUS_LABELS} />
      )
    },
    {
      key: 'paidAt',
      header: 'Paid',
      render: payout => {
        if (!payout.paidAt) return '—'

        const method = PAYMENT_METHOD_LABELS[payout.paymentMethod]

        return `${formatDate(payout.paidAt)} · ${method ? t(method) : ''}`
      }
    },
    {
      key: 'reference',
      header: 'Reference',
      render: payout =>
        payout.reference ? (
          <code className='code-inline'>{payout.reference}</code>
        ) : (
          '—'
        )
    }
  )

  if (canManage) {
    columns.push({
      key: 'actions',
      header: '',
      className: 'cell-actions',
      render: payout => {
        if (payout.status !== 'pending') return null

        if (currentUserId && recipientOf(payout) === currentUserId) {
          return (
            <span className='muted'>
              {t('Another administrator must record this payout')}
            </span>
          )
        }

        return (
          <Button size='sm' onClick={() => onRecord(payout)}>
            {t('Record payout')}
          </Button>
        )
      }
    })
  }

  return <DataTable columns={columns} rows={payouts} caption='Payouts' />
}
