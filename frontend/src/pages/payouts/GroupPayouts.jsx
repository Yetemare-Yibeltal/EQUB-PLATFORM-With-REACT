import { useCallback, useState } from 'react'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import PayoutTable from '../../components/payout/PayoutTable'
import RecordPayoutModal from '../../components/payout/RecordPayoutModal'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useGroup } from '../../hooks/useGroup'
import { useLanguage } from '../../hooks/useLanguage'
import { payoutService } from '../../services/payoutService'
import { formatMoney } from '../../utils/formatCurrency'

export default function GroupPayouts () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { group, isOrganizer, isAdmin, version, refresh } = useGroup()
  const [target, setTarget] = useState(null)
  const [notice, setNotice] = useState('')

  const loader = useCallback(
    () => payoutService.listByGroup(group.id, { limit: 100 }),
    [group.id, version]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  const handleRecord = async payload => {
    const result = await payoutService.record(group.id, target.id, payload)

    setTarget(null)
    setNotice(
      result.groupStatus === 'completed'
        ? t('Final payout recorded, the equb is complete')
        : t('Payout recorded, cycle {number} contributions are now open', {
            number: result.nextCycle?.number ?? ''
          })
    )
    refresh()
  }

  if (loading && !data) return <Loader label='Loading payouts' />

  return (
    <div className='stack'>
      {notice && (
        <p className='alert alert-success' role='status'>
          {notice}
        </p>
      )}
      <ErrorMessage message={error} onRetry={reload} />

      {data && data.payouts.length === 0 && (
        <EmptyState
          title='No payouts yet'
          description='A payout is created automatically when a draw is performed.'
        />
      )}

      {data && data.payouts.length > 0 && (
        <PayoutTable
          payouts={data.payouts}
          showRecipient
          canManage={(isOrganizer || isAdmin) && group.status === 'active'}
          currentUserId={user.id}
          onRecord={setTarget}
        />
      )}

      <RecordPayoutModal
        open={Boolean(target)}
        title={t('Record payout')}
        summary={
          target
            ? t(
                'Record how {name} received {amount}. This completes cycle {number} and opens the next one.',
                {
                  name: target.user?.fullName,
                  amount: formatMoney(target.amount),
                  number: target.cycle?.number
                }
              )
            : null
        }
        onSubmit={handleRecord}
        onClose={() => setTarget(null)}
      />
    </div>
  )
}
