import { useCallback, useState } from 'react'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import PayoutTable from '../../components/payout/PayoutTable'
import { useAsyncData } from '../../hooks/useAsyncData'
import { payoutService } from '../../services/payoutService'

export default function Payouts () {
  const [page, setPage] = useState(1)

  const loader = useCallback(
    () => payoutService.listMine({ page, limit: 15 }),
    [page]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  return (
    <div className='page'>
      <header className='page-header'>
        <h1>My payouts</h1>
        <p className='muted'>Pots you have won in your equbs</p>
      </header>

      <ErrorMessage message={error} onRetry={reload} />
      {loading && !data && <Loader label='Loading payouts' />}

      {data && data.payouts.length === 0 && (
        <EmptyState
          title='No payouts yet'
          description='When you win a draw, the payout appears here.'
        />
      )}

      {data && data.payouts.length > 0 && (
        <PayoutTable payouts={data.payouts} showGroup />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />
    </div>
  )
}
