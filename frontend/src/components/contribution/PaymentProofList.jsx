import { PROOF_METHOD_LABELS } from '../../constants/paymentProof'
import { useLanguage } from '../../hooks/useLanguage'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import Button from '../common/Button'
import DataTable from '../common/DataTable'

export default function PaymentProofList ({
  proofs,
  busyId = null,
  onApprove,
  onReject
}) {
  const { t } = useLanguage()

  const columns = [
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
      key: 'sent',
      header: 'Sent',
      render: proof => formatDateTime(proof.createdAt)
    },
    {
      key: 'actions',
      header: '',
      className: 'cell-actions',
      render: proof => (
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
  ]

  return (
    <DataTable
      columns={columns}
      rows={proofs}
      caption='Payment proofs waiting for approval'
    />
  )
}
