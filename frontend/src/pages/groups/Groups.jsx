import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import GroupCard from '../../components/group/GroupCard'
import { ROUTES } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLanguage } from '../../hooks/useLanguage'
import { groupService } from '../../services/groupService'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

export default function Groups () {
  const { t } = useLanguage()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const loader = useCallback(
    () => groupService.list({ page, limit: 12, ...(status ? { status } : {}) }),
    [page, status]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  const changeFilter = value => {
    setStatus(value)
    setPage(1)
  }

  return (
    <div className='page'>
      <header className='page-header page-header-row'>
        <div>
          <h1>{t('My equbs')}</h1>
          <p className='muted'>{t('Groups you organize or belong to')}</p>
        </div>
        <div className='inline-actions'>
          <Link to={ROUTES.GROUP_JOIN} className='btn btn-secondary btn-md'>
            {t('Join with code')}
          </Link>
          <Link to={ROUTES.GROUP_CREATE} className='btn btn-primary btn-md'>
            {t('Create equb')}
          </Link>
        </div>
      </header>

      <div
        className='tabs'
        role='tablist'
        aria-label={t('Group status filter')}
      >
        {FILTERS.map(filter => (
          <button
            key={filter.value || 'all'}
            type='button'
            role='tab'
            aria-selected={status === filter.value}
            className={status === filter.value ? 'tab active' : 'tab'}
            onClick={() => changeFilter(filter.value)}
          >
            {t(filter.label)}
          </button>
        ))}
      </div>

      <ErrorMessage message={error} onRetry={reload} />
      {loading && !data && <Loader label='Loading your equbs' />}

      {data && data.groups.length === 0 && (
        <EmptyState
          title='No equbs here yet'
          description='Create a new equb or join one with an invite code.'
          action={
            <Link to={ROUTES.GROUP_CREATE} className='btn btn-primary btn-md'>
              {t('Create equb')}
            </Link>
          }
        />
      )}

      {data && data.groups.length > 0 && (
        <div className='group-grid'>
          {data.groups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />
    </div>
  )
}
