import { Link } from 'react-router-dom'
import { groupPath } from '../../constants/routes'
import { PAYMENT_METHOD_LABELS } from '../../constants/paymentMethods'
import { PAYOUT_STATUS_LABELS } from '../../constants/statuses'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import Button from '../common/Button'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'

export default function PayoutTable ({
  payouts,
  showGroup = false,
  showRecipient = false,
  canManage = false,
  onRecord
}) {
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
      render: payout =>
        payout.paidAt
          ? `${formatDate(payout.paidAt)} · ${
              PAYMENT_METHOD_LABELS[payout.paymentMethod] ?? ''
            }`
          : '—'
    }
  )

  if (canManage) {
    columns.push({
      key: 'actions',
      header: '',
      className: 'cell-actions',
      render: payout =>
        payout.status === 'pending' ? (
          <Button size='sm' onClick={() => onRecord(payout)}>
            Record payout
          </Button>
        ) : null
    })
  }

  return <DataTable columns={columns} rows={payouts} caption='Payouts' />
}
