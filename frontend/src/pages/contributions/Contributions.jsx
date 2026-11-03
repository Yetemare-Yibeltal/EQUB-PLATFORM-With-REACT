import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import ContributionTable from '../../components/contribution/ContributionTable'
import PaymentInstructions from '../../components/contribution/PaymentInstructions'
import SubmitProofModal from '../../components/contribution/SubmitProofModal'
import { ONLINE_PAYMENT_ENABLED } from '../../constants/mahber'
import { ROUTES } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { usePayOnline } from '../../hooks/usePayOnline'
import { contributionService } from '../../services/contributionService'
import { paymentProofService } from '../../services/paymentProofService'

const FILTERS = [
  { id: 'pending', label: 'Pending', params: { status: 'pending' } },
  { id: 'overdue', label: 'Overdue', params: { overdue: true } },
  { id: 'paid', label: 'Paid', params: { status: 'paid' } },
  { id: 'all', label: 'All', params: {} }
]

const groupIdOf = contribution =>
  typeof contribution.group === 'object'
    ? contribution.group.id
    : contribution.group

export default function Contributions () {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { pay, payingId, error: payError } = usePayOnline()
  const [filterId, setFilterId] = useState('pending')
  const [page, setPage] = useState(1)
  const [version, setVersion] = useState(0)
  const [proofTarget, setProofTarget] = useState(null)
  const [notice, setNotice] = useState('')

  const loader = useCallback(() => {
    const filter = FILTERS.find(item => item.id === filterId)

    return contributionService.listMine({ page, limit: 15, ...filter.params })
  }, [filterId, page, version])
  const { data, loading, error, reload } = useAsyncData(loader)

  const groupIds = useMemo(
    () => [...new Set((data?.contributions ?? []).map(groupIdOf))],
    [data]
  )

  const proofsLoader = useCallback(async () => {
    if (groupIds.length === 0) return []

    const results = await Promise.all(
      groupIds.map(groupId =>
        paymentProofService.listByGroup(groupId, {
          status: 'pending',
          limit: 100
        })
      )
    )

    return results.flatMap(result => result.proofs)
  }, [groupIds, version])
  const { data: proofs } = useAsyncData(proofsLoader)

  const pendingProofs = useMemo(
    () =>
      Object.fromEntries(
        (proofs ?? []).map(proof => [
          typeof proof.contribution === 'object'
            ? proof.contribution.id
            : proof.contribution,
          proof
        ])
      ),
    [proofs]
  )

  const hasPending = (data?.contributions ?? []).some(
    contribution => contribution.status === 'pending'
  )

  const changeFilter = id => {
    setFilterId(id)
    setPage(1)
  }

  const handleSubmitProof = async payload => {
    await paymentProofService.submit(
      groupIdOf(proofTarget),
      proofTarget.id,
      payload
    )
    setProofTarget(null)
    setNotice(t('Your payment proof was sent for approval.'))
    setVersion(current => current + 1)
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

      {notice && (
        <p className='alert alert-success' role='status'>
          {notice}
        </p>
      )}

      <ErrorMessage message={error} onRetry={reload} />
      <ErrorMessage message={payError} />
      {loading && !data && <Loader label='Loading contributions' />}

      {hasPending && (
        <section className='card'>
          <PaymentInstructions />
        </section>
      )}

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
          pendingProofs={pendingProofs}
          onPayOnline={ONLINE_PAYMENT_ENABLED ? pay : undefined}
          onSubmitProof={setProofTarget}
        />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />

      <SubmitProofModal
        open={Boolean(proofTarget)}
        contribution={proofTarget}
        onSubmit={handleSubmitProof}
        onClose={() => setProofTarget(null)}
      />
    </div>
  )
}
