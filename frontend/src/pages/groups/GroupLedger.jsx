import { useCallback, useState } from 'react'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import DataTable from '../../components/common/DataTable'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import StatusBadge from '../../components/common/StatusBadge'
import StatsCard from '../../components/dashboard/StatsCard'
import { PAYMENT_METHOD_LABELS } from '../../constants/paymentMethods'
import { TRANSACTION_TYPE_LABELS } from '../../constants/transactions'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useGroup } from '../../hooks/useGroup'
import { useLanguage } from '../../hooks/useLanguage'
import { transactionService } from '../../services/transactionService'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'contribution', label: 'Contributions' },
  { value: 'payout', label: 'Payouts' }
]

export default function GroupLedger () {
  const { t } = useLanguage()
  const { group, version } = useGroup()
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)

  const summaryLoader = useCallback(
    () => transactionService.summary(group.id),
    [group.id, version]
  )
  const { data: summary, error: summaryError } = useAsyncData(summaryLoader)

  const listLoader = useCallback(
    () =>
      transactionService.listByGroup(group.id, {
        page,
        limit: 25,
        ...(type ? { type } : {})
      }),
    [group.id, type, page, version]
  )
  const { data, loading, error, reload } = useAsyncData(listLoader)

  const changeType = value => {
    setType(value)
    setPage(1)
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: entry => formatDateTime(entry.occurredAt)
    },
    {
      key: 'member',
      header: 'Member',
      render: entry => entry.user?.fullName ?? '—'
    },
    {
      key: 'type',
      header: 'Type',
      render: entry => (
        <StatusBadge
          status={entry.type}
          labels={TRANSACTION_TYPE_LABELS}
          tone={entry.direction === 'in' ? 'success' : 'info'}
        />
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: entry => (
        <span className={entry.direction === 'in' ? 'amount-in' : 'amount-out'}>
          {entry.direction === 'in' ? '+' : '−'}
          {formatMoney(entry.amount)}
        </span>
      )
    },
    {
      key: 'method',
      header: 'Method',
      render: entry =>
        t(PAYMENT_METHOD_LABELS[entry.method] ?? entry.method ?? '—')
    },
    {
      key: 'reference',
      header: 'Reference',
      render: entry => entry.reference || '—'
    }
  ]

  return (
    <div className='stack'>
      <ErrorMessage message={summaryError} />
      {summary && (
        <section className='stats-grid' aria-label={t('Ledger summary')}>
          <StatsCard
            label='Collected'
            value={formatMoney(summary.totalIn)}
            tone='success'
          />
          <StatsCard label='Paid out' value={formatMoney(summary.totalOut)} />
          <StatsCard
            label='Balance held'
            value={formatMoney(summary.balance)}
          />
          <StatsCard
            label='Penalties collected'
            value={formatMoney(summary.penaltiesCollected)}
            hint={t('{count} ledger entries', { count: summary.entryCount })}
          />
        </section>
      )}

      <div className='tabs' role='tablist' aria-label={t('Ledger filter')}>
        {FILTERS.map(filter => (
          <button
            key={filter.value || 'all'}
            type='button'
            role='tab'
            aria-selected={type === filter.value}
            className={type === filter.value ? 'tab active' : 'tab'}
            onClick={() => changeType(filter.value)}
          >
            {t(filter.label)}
          </button>
        ))}
      </div>

      <ErrorMessage message={error} onRetry={reload} />
      {loading && !data && <Loader label='Loading ledger' />}

      {data && data.transactions.length === 0 && (
        <EmptyState
          title='No ledger entries yet'
          description='Every recorded contribution and payout is listed here.'
        />
      )}

      {data && data.transactions.length > 0 && (
        <DataTable
          columns={columns}
          rows={data.transactions}
          caption='Group ledger'
        />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />
    </div>
  )
}
