import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import StatsCard from '../../components/dashboard/StatsCard'
import { ROUTES } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { adminService } from '../../services/adminService'
import { formatMoney } from '../../utils/formatCurrency'
import { formatNumber } from '../../utils/formatNumber'

export default function AdminDashboard () {
  const loader = useCallback(() => adminService.overview(), [])
  const { data, loading, error, reload } = useAsyncData(loader)

  if (loading && !data) return <Loader label='Loading overview' />

  return (
    <div className='stack'>
      <ErrorMessage message={error} onRetry={reload} />

      {data && (
        <>
          <section className='stats-grid' aria-label='Attention'>
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

          <section className='stats-grid' aria-label='Platform totals'>
            <StatsCard
              label='Users'
              value={formatNumber(data.users.total)}
              hint={`${data.users.active} active, ${data.users.suspended} suspended, ${data.users.admins} admins`}
            />
            <StatsCard
              label='Equbs'
              value={formatNumber(data.groups.total)}
              hint={`${data.groups.open} open, ${data.groups.active} active, ${data.groups.completed} completed, ${data.groups.cancelled} cancelled`}
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
            <Link to={ROUTES.ADMIN_PAYMENTS}>Go to payment review</Link>
          </p>
        </>
      )}
    </div>
  )
}
