import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import StatsCard from '../../components/dashboard/StatsCard'
import { ROUTES } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLanguage } from '../../hooks/useLanguage'
import { adminService } from '../../services/adminService'
import { formatMoney } from '../../utils/formatCurrency'
import { formatNumber } from '../../utils/formatNumber'

export default function AdminDashboard () {
  const { t } = useLanguage()
  const loader = useCallback(() => adminService.overview(), [])
  const { data, loading, error, reload } = useAsyncData(loader)

  if (loading && !data) return <Loader label='Loading overview' />

  return (
    <div className='stack'>
      <ErrorMessage message={error} onRetry={reload} />

      {data && (
        <>
          <section className='stats-grid' aria-label={t('Attention')}>
            <StatsCard
              label='Payments needing review'
              value={formatNumber(data.attention.paymentsNeedingReview)}
              tone={
                data.attention.paymentsNeedingReview > 0 ? 'danger' : 'neutral'
              }
              hint='Review them on the Payments tab'
            />
            <StatsCard
              label='Pending payouts'
              value={formatNumber(data.attention.pendingPayouts)}
              tone={data.attention.pendingPayouts > 0 ? 'warning' : 'neutral'}
            />
            <StatsCard
              label='Overdue contributions'
              value={formatNumber(data.attention.overdueContributions)}
              tone={
                data.attention.overdueContributions > 0 ? 'warning' : 'neutral'
              }
            />
            <StatsCard
              label='Cycles awaiting a draw'
              value={formatNumber(data.attention.cyclesAwaitingDraw)}
            />
          </section>

          <section className='stats-grid' aria-label={t('Platform totals')}>
            <StatsCard
              label='Users'
              value={formatNumber(data.users.total)}
              hint={t(
                '{active} active, {suspended} suspended, {admins} admins',
                {
                  active: data.users.active,
                  suspended: data.users.suspended,
                  admins: data.users.admins
                }
              )}
            />
            <StatsCard
              label='Equbs'
              value={formatNumber(data.groups.total)}
              hint={t(
                '{open} open, {active} active, {completed} completed, {cancelled} cancelled',
                {
                  open: data.groups.open,
                  active: data.groups.active,
                  completed: data.groups.completed,
                  cancelled: data.groups.cancelled
                }
              )}
            />
            <StatsCard
              label='Collected'
              value={formatMoney(data.money.totalIn)}
              tone='success'
            />
            <StatsCard
              label='Paid out'
              value={formatMoney(data.money.totalOut)}
            />
            <StatsCard
              label='Balance held'
              value={formatMoney(data.money.balance)}
            />
            <StatsCard
              label='Penalties collected'
              value={formatMoney(data.money.penaltiesCollected)}
            />
          </section>

          <p>
            <Link to={ROUTES.ADMIN_PAYMENTS}>{t('Go to payment review')}</Link>
          </p>
        </>
      )}
    </div>
  )
}
