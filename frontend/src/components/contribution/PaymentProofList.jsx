import {
  PROOF_METHOD_LABELS,
  PROOF_STATUS_LABELS
} from '../../constants/paymentProof'
import { useLanguage } from '../../hooks/useLanguage'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import Button from '../common/Button'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'
import ProofScreenshot from './ProofScreenshot'

export default function PaymentProofList ({
  proofs,
  groupId,
  showGroup = false,
  showStatus = false,
  busyId = null,
  onApprove,
  onReject
}) {
  const { t } = useLanguage()

  const columns = []

  if (showGroup) {
    columns.push({
      key: 'group',
      header: 'Equb',
      render: proof => proof.group?.name ?? '—'
    })
  }

  columns.push(
    {
      key: 'member',
      header: 'Member',
      render: proof => proof.user?.fullName ?? '—'
    },
    {
      key: 'amount',
      header: 'Amount',
      render: proof =>
        proof.contribution?.amountOutstanding
          ? formatMoney(proof.contribution.amountOutstanding)
          : '—'
    },
    {
      key: 'method',
      header: 'Method',
      render: proof => t(PROOF_METHOD_LABELS[proof.method] ?? proof.method)
    },
    {
      key: 'reference',
      header: 'Reference',
      render: proof => <code className='code-inline'>{proof.reference}</code>
    },
    {
      key: 'screenshot',
      header: 'Screenshot',
      render: proof =>
        proof.hasScreenshot ? (
          <ProofScreenshot proof={proof} groupId={groupId} />
        ) : (
          '—'
        )
    },
    {
      key: 'sent',
      header: 'Sent',
      render: proof => formatDateTime(proof.createdAt)
    }
  )

  if (showStatus) {
    columns.push({
      key: 'status',
      header: 'Status',
      render: proof => (
        <StatusBadge status={proof.status} labels={PROOF_STATUS_LABELS} />
      )
    })
  }

  columns.push({
    key: 'actions',
    header: '',
    className: 'cell-actions',
    render: proof => {
      if (proof.status !== 'pending') return null

      return (
        <div className='inline-actions'>
          <Button
            size='sm'
            loading={busyId === proof.id}
            onClick={() => onApprove(proof)}
          >
            {t('Approve')}
          </Button>
          <Button
            size='sm'
            variant='ghost'
            disabled={busyId === proof.id}
            onClick={() => onReject(proof)}
          >
            {t('Reject')}
          </Button>
        </div>
      )
    }
  })

  return (
    <DataTable
      columns={columns}
      rows={proofs}
      caption='Payment proofs waiting for approval'
    />
  )
}
