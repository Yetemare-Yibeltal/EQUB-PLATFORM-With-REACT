import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import ContributionTable from '../../components/contribution/ContributionTable'
import { ROUTES } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { usePayOnline } from '../../hooks/usePayOnline'
import { contributionService } from '../../services/contributionService'

const FILTERS = [
  { id: 'pending', label: 'Pending', params: { status: 'pending' } },
  { id: 'overdue', label: 'Overdue', params: { overdue: true } },
  { id: 'paid', label: 'Paid', params: { status: 'paid' } },
  { id: 'all', label: 'All', params: {} }
]

export default function Contributions () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { pay, payingId, error: payError } = usePayOnline()
  const [filterId, setFilterId] = useState('pending')
  const [page, setPage] = useState(1)

  const loader = useCallback(() => {
    const filter = FILTERS.find(item => item.id === filterId)

    return contributionService.listMine({ page, limit: 15, ...filter.params })
  }, [filterId, page])
  const { data, loading, error, reload } = useAsyncData(loader)

  const changeFilter = id => {
    setFilterId(id)
    setPage(1)
  }

  return (
    <div className='page'>
      <header className='page-header page-header-row'>
        <div>
          <h1>{t('My contributions')}</h1>
          <p className='muted'>
            {t('What you owe and what you have paid across all equbs')}
          </p>
        </div>
        <div className='inline-actions'>
          <Link to={ROUTES.PAYMENTS} className='btn btn-secondary btn-md'>
            {t('My payments')}
          </Link>
          <Link to={ROUTES.PAYOUTS} className='btn btn-secondary btn-md'>
            {t('My payouts')}
          </Link>
        </div>
      </header>

      <div
        className='tabs'
        role='tablist'
        aria-label={t('Contribution filter')}
      >
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            type='button'
            role='tab'
            aria-selected={filterId === filter.id}
            className={filterId === filter.id ? 'tab active' : 'tab'}
            onClick={() => changeFilter(filter.id)}
          >
            {t(filter.label)}
          </button>
        ))}
      </div>

      <ErrorMessage message={error} onRetry={reload} />
      <ErrorMessage message={payError} />
      {loading && !data && <Loader label='Loading contributions' />}

      {data && data.contributions.length === 0 && (
        <EmptyState
          title='Nothing here'
          description='Contributions appear once an equb you belong to has started.'
        />
      )}

      {data && data.contributions.length > 0 && (
        <ContributionTable
          contributions={data.contributions}
          showGroup
          currentUserId={user.id}
          payingId={payingId}
          onPayOnline={pay}
        />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />
    </div>
  )
}
