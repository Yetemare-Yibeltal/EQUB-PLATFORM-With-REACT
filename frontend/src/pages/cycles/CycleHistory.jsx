import { useCallback, useMemo, useState } from 'react'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import ReasonModal from '../../components/common/ReasonModal'
import ContributionTable from '../../components/contribution/ContributionTable'
import PaymentInstructions from '../../components/contribution/PaymentInstructions'
import PaymentProofList from '../../components/contribution/PaymentProofList'
import SubmitProofModal from '../../components/contribution/SubmitProofModal'
import CycleCard from '../../components/cycle/CycleCard'
import CycleTimeline from '../../components/cycle/CycleTimeline'
import { ONLINE_PAYMENT_ENABLED } from '../../constants/mahber'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useGroup } from '../../hooks/useGroup'
import { useLanguage } from '../../hooks/useLanguage'
import { usePayOnline } from '../../hooks/usePayOnline'
import { contributionService } from '../../services/contributionService'
import { cycleService } from '../../services/cycleService'
import { paymentProofService } from '../../services/paymentProofService'
import { getErrorMessage } from '../../utils/errors'

export default function CycleHistory () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { group, isOrganizer, isAdmin, version, refresh } = useGroup()
  const { pay, payingId, error: payError } = usePayOnline()
  const [selectedId, setSelectedId] = useState(null)
  const [waiveTarget, setWaiveTarget] = useState(null)
  const [proofTarget, setProofTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [busyProofId, setBusyProofId] = useState(null)
  const [proofError, setProofError] = useState('')
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

  const proofsLoader = useCallback(async () => {
    if (group.status !== 'active') return { proofs: [], meta: null }

    return paymentProofService.listByGroup(group.id, {
      status: 'pending',
      limit: 100
    })
  }, [group.id, group.status, version])
  const { data: proofData } = useAsyncData(proofsLoader)

  const proofs = proofData?.proofs ?? []
  const pendingProofs = useMemo(
    () =>
      Object.fromEntries(
        proofs.map(proof => [
          typeof proof.contribution === 'object'
            ? proof.contribution.id
            : proof.contribution,
          proof
        ])
      ),
    [proofs]
  )

  const rows = contributions?.contributions ?? []
  const overdueCount = rows.filter(
    contribution => contribution.status === 'pending' && contribution.isOverdue
  ).length
  const isCollecting =
    group.status === 'active' && selected?.status === 'collecting'
  const canManage = (isOrganizer || isAdmin) && isCollecting

  const handleWaive = async reason => {
    await contributionService.waive(group.id, waiveTarget.id, reason)
    setWaiveTarget(null)
    setNotice(t('Contribution waived'))
    refresh()
  }

  const handleSubmitProof = async payload => {
    await paymentProofService.submit(group.id, proofTarget.id, payload)
    setProofTarget(null)
    setNotice(t('Your payment proof was sent for approval.'))
    refresh()
  }

  const handleApprove = async proof => {
    setBusyProofId(proof.id)
    setProofError('')

    try {
      await paymentProofService.approve(group.id, proof.id)
      setNotice(t('Payment proof approved'))
      refresh()
    } catch (requestError) {
      setProofError(getErrorMessage(requestError))
    } finally {
      setBusyProofId(null)
    }
  }

  const handleReject = async reason => {
    await paymentProofService.reject(group.id, rejectTarget.id, reason)
    setRejectTarget(null)
    setNotice(t('Payment proof rejected'))
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
          <ErrorMessage message={proofError} />
          <ErrorMessage message={contributionsError} />

          {isCollecting && (
            <section className='card'>
              <PaymentInstructions />
            </section>
          )}

          {canManage && proofs.length > 0 && (
            <section className='card'>
              <h2>{t('Payment proofs waiting for approval')}</h2>
              <p className='muted'>
                {t(
                  'Check each reference in your CBE or Telebirr record before approving.'
                )}
              </p>
              <PaymentProofList
                proofs={proofs}
                groupId={group.id}
                busyId={busyProofId}
                onApprove={handleApprove}
                onReject={setRejectTarget}
              />
            </section>
          )}

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
              pendingProofs={pendingProofs}
              onPayOnline={
                ONLINE_PAYMENT_ENABLED && group.status === 'active'
                  ? pay
                  : undefined
              }
              onSubmitProof={
                group.status === 'active' ? setProofTarget : undefined
              }
              onWaive={setWaiveTarget}
            />
          )}
        </>
      )}

      <SubmitProofModal
        open={Boolean(proofTarget)}
        contribution={proofTarget}
        onSubmit={handleSubmitProof}
        onClose={() => setProofTarget(null)}
      />

      <ReasonModal
        open={Boolean(rejectTarget)}
        title='Reject this payment proof?'
        description='The member will see the reason you give and can send a new proof.'
        label='Reason'
        submitLabel='Reject'
        variant='danger'
        maxLength={300}
        onSubmit={handleReject}
        onClose={() => setRejectTarget(null)}
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
