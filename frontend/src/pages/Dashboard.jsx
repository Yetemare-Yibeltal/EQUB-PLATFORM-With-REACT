import { useCallback, useEffect, useState } from 'react'
import EmptyState from '../components/common/EmptyState'
import ErrorMessage from '../components/common/ErrorMessage'
import Loader from '../components/common/Loader'
import StatsCard from '../components/dashboard/StatsCard'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { reportService } from '../services/reportService'
import { getErrorMessage } from '../utils/errors'
import { formatMoney } from '../utils/formatCurrency'
import { formatNumber, formatPercent } from '../utils/formatNumber'

export default function Dashboard () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [statement, setStatement] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setStatement(await reportService.getMyStatement())
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const contributions = statement?.contributions
  const ledger = statement?.ledger

  return (
    <div className='page'>
      <header className='page-header'>
        <h1>
          {t('Hello, {name}', { name: user?.fullName?.split(' ')[0] ?? '' })}
        </h1>
        <p className='muted'>{t('Your equb activity at a glance')}</p>
      </header>

      {loading && <Loader label='Loading your summary' />}
      <ErrorMessage message={error} onRetry={load} />

      {statement && (
        <>
          <section className='stats-grid' aria-label={t('Summary')}>
            <StatsCard
              label='Active equbs'
              value={formatNumber(statement.activeGroups)}
            />
            <StatsCard
              label='Total contributed'
              value={formatMoney(ledger.totalContributed)}
            />
            <StatsCard
              label='Total received'
              value={formatMoney(ledger.totalReceived)}
            />
            <StatsCard
              label='Net position'
              value={formatMoney(ledger.netPosition)}
              tone={ledger.netPosition < 0 ? 'warning' : 'success'}
              hint='Received minus contributed'
            />
            <StatsCard
              label='Outstanding'
              value={formatMoney(contributions.outstanding)}
              tone={contributions.outstanding > 0 ? 'warning' : 'neutral'}
              hint={t('{count} pending contributions', {
                count: formatNumber(contributions.pending)
              })}
            />
            <StatsCard
              label='Overdue'
              value={formatNumber(contributions.overdue)}
              tone={contributions.overdue > 0 ? 'danger' : 'neutral'}
              hint='Contributions past their grace period'
            />
            <StatsCard
              label='On-time rate'
              value={formatPercent(contributions.onTimeRate)}
              hint={t('{count} late payments', {
                count: formatNumber(contributions.late)
              })}
            />
            <StatsCard
              label='Penalties paid'
              value={formatMoney(ledger.penaltiesPaid)}
              hint='Late payment penalties'
            />
          </section>

          {statement.activeGroups === 0 && (
            <EmptyState
              title='You have not joined an equb yet'
              description='Once you create or join a group, your contributions and payouts appear here.'
            />
          )}
        </>
      )}
    </div>
  )
}
