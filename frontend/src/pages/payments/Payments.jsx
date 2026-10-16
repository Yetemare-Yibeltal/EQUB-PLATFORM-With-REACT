import { useCallback, useState } from 'react'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import StatusBadge from '../../components/common/StatusBadge'
import { PAYMENT_STATUS_LABELS } from '../../constants/statuses'
import { useAsyncData } from '../../hooks/useAsyncData'
import { paymentService } from '../../services/paymentService'
import { getErrorMessage } from '../../utils/errors'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

export default function Payments () {
  const [page, setPage] = useState(1)
  const [checkingRef, setCheckingRef] = useState(null)
  const [actionError, setActionError] = useState('')

  const loader = useCallback(
    () => paymentService.listMine({ page, limit: 15 }),
    [page]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  const handleCheck = async payment => {
    setCheckingRef(payment.txRef)
    setActionError('')

    try {
      await paymentService.verify(payment.txRef)
      reload()
    } catch (requestError) {
      setActionError(getErrorMessage(requestError))
    } finally {
      setCheckingRef(null)
    }
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: payment => formatDateTime(payment.createdAt)
    },
    {
      key: 'group',
      header: 'Equb',
      render: payment => payment.group?.name ?? '—'
    },
    {
      key: 'cycle',
      header: 'Cycle',
      render: payment => (payment.cycle ? `#${payment.cycle.number}` : '—')
    },
    {
      key: 'amount',
      header: 'Amount',
      render: payment => (
        <>
          {formatMoney(payment.amount)}
          {payment.penaltyAmount > 0 && (
            <span className='muted'> incl. penalty</span>
          )}
        </>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: payment => (
        <span className='inline-actions'>
          <StatusBadge status={payment.status} labels={PAYMENT_STATUS_LABELS} />
          {payment.requiresReview && (
            <StatusBadge status='review' labels={{ review: 'Under review' }} />
          )}
        </span>
      )
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
        payment.status === 'pending' ? (
          <div className='inline-actions'>
            {payment.checkoutUrl && (
              <a className='btn btn-primary btn-sm' href={payment.checkoutUrl}>
                Continue
              </a>
            )}
            <Button
              size='sm'
              variant='secondary'
              onClick={() => handleCheck(payment)}
              loading={checkingRef === payment.txRef}
            >
              Check status
            </Button>
          </div>
        ) : null
    }
  ]

  return (
    <div className='page'>
      <header className='page-header'>
        <h1>My payments</h1>
        <p className='muted'>Online payments made through Chapa</p>
      </header>

      <ErrorMessage message={error} onRetry={reload} />
      <ErrorMessage message={actionError} />
      {loading && !data && <Loader label='Loading payments' />}

      {data && data.payments.length === 0 && (
        <EmptyState
          title='No online payments yet'
          description='Use Pay online on a pending contribution to start one.'
        />
      )}

      {data && data.payments.length > 0 && (
        <DataTable
          columns={columns}
          rows={data.payments}
          caption='Online payments'
        />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />
    </div>
  )
}
