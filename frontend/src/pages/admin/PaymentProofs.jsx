import { useCallback, useMemo, useState } from 'react'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import ReasonModal from '../../components/common/ReasonModal'
import Select from '../../components/common/Select'
import PaymentProofList from '../../components/contribution/PaymentProofList'
import { PROOF_STATUS_LABELS } from '../../constants/paymentProof'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLanguage } from '../../hooks/useLanguage'
import { paymentProofService } from '../../services/paymentProofService'
import { getErrorMessage } from '../../utils/errors'

const groupIdOf = proof =>
  typeof proof.group === 'object' ? proof.group.id : proof.group

export default function PaymentProofs () {
  const { t } = useLanguage()
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [version, setVersion] = useState(0)
  const [busyId, setBusyId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')

  const statusOptions = useMemo(
    () =>
      Object.entries(PROOF_STATUS_LABELS).map(([value, label]) => ({
        value,
        label: t(label)
      })),
    [t]
  )

  const loader = useCallback(
    () =>
      paymentProofService.admin.list({
        page,
        limit: 20,
        ...(status ? { status } : {})
      }),
    [page, status, version]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  const handleApprove = async proof => {
    setBusyId(proof.id)
    setActionError('')
    setNotice('')

    try {
      await paymentProofService.approve(groupIdOf(proof), proof.id)
      setNotice(t('Payment proof approved'))
      setVersion(current => current + 1)
    } catch (requestError) {
      setActionError(getErrorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async reason => {
    await paymentProofService.reject(
      groupIdOf(rejectTarget),
      rejectTarget.id,
      reason
    )
    setRejectTarget(null)
    setNotice(t('Payment proof rejected'))
    setVersion(current => current + 1)
  }

  return (
    <div className='stack'>
      <div className='toolbar'>
        <Select
          label='Status'
          name='status'
          placeholder='All statuses'
          options={statusOptions}
          value={status}
          onChange={event => {
            setStatus(event.target.value)
            setPage(1)
          }}
        />
      </div>

      {notice && (
        <p className='alert alert-success' role='status'>
          {notice}
        </p>
      )}

      <ErrorMessage message={error} onRetry={reload} />
      <ErrorMessage message={actionError} />
      {loading && !data && <Loader label='Loading payment proofs' />}

      {data && data.proofs.length === 0 && (
        <EmptyState title='No payment proofs' />
      )}
      {data && data.proofs.length > 0 && (
        <PaymentProofList
          proofs={data.proofs}
          showGroup
          showStatus
          busyId={busyId}
          onApprove={handleApprove}
          onReject={setRejectTarget}
        />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />

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
    </div>
  )
}
