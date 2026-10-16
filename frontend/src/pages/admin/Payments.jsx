import { useCallback, useState } from 'react'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import ReasonModal from '../../components/common/ReasonModal'
import StatusBadge from '../../components/common/StatusBadge'
import { PAYMENT_STATUS_LABELS } from '../../constants/statuses'
import { useAsyncData } from '../../hooks/useAsyncData'
import { adminService } from '../../services/adminService'
import { paymentService } from '../../services/paymentService'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

const FILTERS = [
  { id: 'review', label: 'Needs review', params: { requiresReview: true } },
  { id: 'failed', label: 'Failed', params: { status: 'failed' } },
  { id: 'pending', label: 'Pending', params: { status: 'pending' } },
  { id: 'success', label: 'Successful', params: { status: 'success' } },
  { id: 'all', label: 'All', params: {} }
]

export default function Payments () {
  const [filterId, setFilterId] = useState('review')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState(null)
  const [notice, setNotice] = useState('')

  const loader = useCallback(() => {
    const filter = FILTERS.find(item => item.id === filterId)

    return paymentService.listAll({ page, limit: 20, ...filter.params })
  }, [filterId, page])
  const { data, loading, error, reload } = useAsyncData(loader)

  const changeFilter = id => {
    setFilterId(id)
    setPage(1)
  }

  const handleResolve = async note => {
    await adminService.resolvePaymentReview(target.id, note)
    setTarget(null)
    setNotice('Review resolved and recorded in the audit log')
    reload()
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: payment => formatDateTime(payment.createdAt)
    },
    {
      key: 'user',
      header: 'Payer',
      render: payment => (
        <>
          {payment.user?.fullName}
          <span className='muted'> {payment.user?.phone}</span>
        </>
      )
    },
    {
      key: 'group',
      header: 'Equb',
      render: payment => payment.group?.name ?? '—'
    },
    {
      key: 'amount',
      header: 'Amount',
      render: payment => formatMoney(payment.amount)
    },
    {
      key: 'status',
      header: 'Status',
      render: payment => (
        <span className='inline-actions'>
          <StatusBadge status={payment.status} labels={PAYMENT_STATUS_LABELS} />
          {payment.requiresReview && (
            <StatusBadge status='review' labels={{ review: 'Needs review' }} />
          )}
        </span>
      )
    },
    {
      key: 'note',
      header: 'Note',
      render: payment => payment.reviewNote || payment.failureReason || '—'
    },
    {
      key: 'reference',
      header: 'Reference',
      render: payment => <code className='code-inline'>{payment.txRef}</code>
    },
    {
      key: 'actions',
      header: '',
      className: 'cell-actions',
      render: payment =>
        payment.requiresReview ? (
          <Button size='sm' onClick={() => setTarget(payment)}>
            Resolve
          </Button>
        ) : null
    }
  ]

  return (
    <div className='stack'>
      <p className='muted'>
        Resolving a review records that you handled it, for example by refunding
        the payer through Chapa. It does not move money by itself.
      </p>

      <div className='tabs' role='tablist' aria-label='Payment filter'>
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            type='button'
            role='tab'
            aria-selected={filterId === filter.id}
            className={filterId === filter.id ? 'tab active' : 'tab'}
            onClick={() => changeFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {notice && (
        <p className='alert alert-success' role='status'>
          {notice}
        </p>
      )}
      <ErrorMessage message={error} onRetry={reload} />
      {loading && !data && <Loader label='Loading payments' />}

      {data && data.payments.length === 0 && (
        <EmptyState title='No payments match' />
      )}
      {data && data.payments.length > 0 && (
        <DataTable columns={columns} rows={data.payments} caption='Payments' />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />

      <ReasonModal
        open={Boolean(target)}
        title='Resolve payment review'
        description='Describe what you did, for example: refunded the payer through Chapa.'
        label='Resolution note'
        maxLength={300}
        submitLabel='Resolve review'
        onSubmit={handleResolve}
        onClose={() => setTarget(null)}
      />
    </div>
  )
}
