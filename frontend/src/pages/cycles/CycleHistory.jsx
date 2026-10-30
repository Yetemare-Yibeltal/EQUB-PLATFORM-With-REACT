import { useCallback, useMemo, useState } from 'react'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import RecordPaymentModal from '../../components/common/RecordPaymentModal'
import ReasonModal from '../../components/common/ReasonModal'
import ContributionTable from '../../components/contribution/ContributionTable'
import CycleCard from '../../components/cycle/CycleCard'
import CycleTimeline from '../../components/cycle/CycleTimeline'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useGroup } from '../../hooks/useGroup'
import { useLanguage } from '../../hooks/useLanguage'
import { usePayOnline } from '../../hooks/usePayOnline'
import { contributionService } from '../../services/contributionService'
import { cycleService } from '../../services/cycleService'
import { formatMoney } from '../../utils/formatCurrency'

export default function CycleHistory () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { group, isOrganizer, version, refresh } = useGroup()
  const { pay, payingId, error: payError } = usePayOnline()
  const [selectedId, setSelectedId] = useState(null)
  const [recordTarget, setRecordTarget] = useState(null)
  const [waiveTarget, setWaiveTarget] = useState(null)
  const [notice, setNotice] = useState('')

  const cyclesLoader = useCallback(
    () => cycleService.list(group.id),
    [group.id, version]
  )
  const { data: cycles, loading, error, reload } = useAsyncData(cyclesLoader)

  const selected = useMemo(() => {
    if (!cycles || cycles.length === 0) return null

    return (
      cycles.find(cycle => cycle.id === selectedId) ??
      cycles.find(
        cycle => cycle.status === 'collecting' || cycle.status === 'collected'
      ) ??
      cycles[cycles.length - 1]
    )
  }, [cycles, selectedId])

  const selectedCycleId = selected?.id

  const contributionsLoader = useCallback(async () => {
    if (!selectedCycleId) return null

    return contributionService.listByGroup(group.id, {
      cycleId: selectedCycleId,
      limit: 100
    })
  }, [group.id, selectedCycleId, version])
  const { data: contributions, error: contributionsError } =
    useAsyncData(contributionsLoader)

  const rows = contributions?.contributions ?? []
  const overdueCount = rows.filter(
    contribution => contribution.status === 'pending' && contribution.isOverdue
  ).length
  const canManage =
    isOrganizer &&
    group.status === 'active' &&
    selected?.status === 'collecting'

  const handleRecord = async payload => {
    await contributionService.record(group.id, recordTarget.id, payload)
    setRecordTarget(null)
    setNotice(t('Contribution recorded'))
    refresh()
  }

  const handleWaive = async reason => {
    await contributionService.waive(group.id, waiveTarget.id, reason)
    setWaiveTarget(null)
    setNotice(t('Contribution waived'))
    refresh()
  }

  if (loading && !cycles) return <Loader label='Loading cycles' />

  return (
    <div className='stack'>
      <ErrorMessage message={error} onRetry={reload} />

      {cycles && cycles.length === 0 && (
        <EmptyState
          title='No cycles yet'
          description='Cycles and contributions are created when the organizer starts the equb.'
        />
      )}

      {cycles && selected && (
        <>
          <CycleTimeline
            cycles={cycles}
            selectedId={selected.id}
            onSelect={setSelectedId}
          />
          <CycleCard cycle={selected} overdueCount={overdueCount} />

          {notice && (
            <p className='alert alert-success' role='status'>
              {notice}
            </p>
          )}
          <ErrorMessage message={payError} />
          <ErrorMessage message={contributionsError} />

          {selected.status === 'upcoming' ? (
            <EmptyState
              title='This cycle has not opened yet'
              description="Contributions are created when the previous cycle's payout is recorded."
            />
          ) : (
            <ContributionTable
              contributions={rows}
              showUser
              currentUserId={user.id}
              canManage={canManage}
              payingId={payingId}
              onPayOnline={group.status === 'active' ? pay : undefined}
              onRecord={setRecordTarget}
              onWaive={setWaiveTarget}
            />
          )}
        </>
      )}

      <RecordPaymentModal
        open={Boolean(recordTarget)}
        title={t('Record contribution')}
        summary={
          recordTarget
            ? t(
                '{name} owes {amount}. A late penalty is added automatically if the payment time is after the grace period.',
                {
                  name: recordTarget.user?.fullName,
                  amount: formatMoney(recordTarget.amountOutstanding)
                }
              )
            : null
        }
        onSubmit={handleRecord}
        onClose={() => setRecordTarget(null)}
      />

      <ReasonModal
        open={Boolean(waiveTarget)}
        title='Waive contribution'
        description={t(
          '{name} will not pay for this cycle. The pot becomes smaller.',
          { name: waiveTarget?.user?.fullName ?? t('This member') }
        )}
        label='Reason'
        submitLabel='Waive contribution'
        onSubmit={handleWaive}
        onClose={() => setWaiveTarget(null)}
      />
    </div>
  )
}
