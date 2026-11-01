import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import Select from '../../components/common/Select'
import DisputeBadge from '../../components/disputes/DisputeBadge'
import DisputeForm from '../../components/disputes/DisputeForm'
import {
  DISPUTE_CATEGORY_LABELS,
  DISPUTE_STATUS_LABELS
} from '../../constants/disputes'
import { groupPath } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useGroup } from '../../hooks/useGroup'
import { useLanguage } from '../../hooks/useLanguage'
import { disputeService } from '../../services/disputeService'
import { formatDateTime } from '../../utils/formatDate'
import '../../styles/disputes.css'

export default function GroupDisputes () {
  const { t } = useLanguage()
  const { group, membership, canViewPrivate } = useGroup()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const isMember = membership?.status === 'active'

  const statusOptions = useMemo(
    () =>
      Object.entries(DISPUTE_STATUS_LABELS).map(([value, label]) => ({
        value,
        label: t(label)
      })),
    [t]
  )

  const loader = useCallback(
    () =>
      disputeService.listByGroup(group.id, {
        page,
        limit: 20,
        ...(status ? { status } : {})
      }),
    [group.id, page, status]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  const handleCreate = async payload => {
    await disputeService.create(group.id, payload)
    setFormOpen(false)
    setNotice(t('Your report was sent.'))
    setPage(1)
    reload()
  }

  return (
    <div className='stack'>
      {notice && (
        <p className='alert alert-success' role='status'>
          {notice}
        </p>
      )}

      <section className='card'>
        <div className='title-row'>
          <h2>{t('Disputes')}</h2>
          {isMember && !formOpen && (
            <Button
              onClick={() => {
                setNotice('')
                setFormOpen(true)
              }}
            >
              {t('Report a problem')}
            </Button>
          )}
        </div>
        <p className='muted'>
          {canViewPrivate
            ? t('Problems reported by members of this equb.')
            : t('Problems you reported or are named in appear here.')}
        </p>

        {formOpen && (
          <DisputeForm
            onSubmit={handleCreate}
            onCancel={() => setFormOpen(false)}
          />
        )}
      </section>

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

      <ErrorMessage message={error} onRetry={reload} />
      {loading && !data && <Loader label='Loading disputes' />}

      {data && data.disputes.length === 0 && <EmptyState title='No disputes' />}

      {data && data.disputes.length > 0 && (
        <ul className='dispute-list'>
          {data.disputes.map(dispute => (
            <li key={dispute.id}>
              <Link
                className='dispute-item'
                to={groupPath(group.id, `disputes/${dispute.id}`)}
              >
                <div className='title-row'>
                  <strong>{dispute.subject}</strong>
                  <DisputeBadge status={dispute.status} />
                </div>
                <p className='muted dispute-meta'>
                  {t(
                    DISPUTE_CATEGORY_LABELS[dispute.category] ??
                      dispute.category
                  )}
                  {' · '}
                  {dispute.reporter?.fullName ?? '—'}
                  {' · '}
                  {formatDateTime(dispute.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />
    </div>
  )
}
