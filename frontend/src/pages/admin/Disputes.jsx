import { useCallback, useMemo, useState } from 'react'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import Select from '../../components/common/Select'
import DisputeBadge from '../../components/disputes/DisputeBadge'
import DisputeThread from '../../components/disputes/DisputeThread'
import {
  DISPUTE_CATEGORY_LABELS,
  DISPUTE_STATUS_LABELS
} from '../../constants/disputes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLanguage } from '../../hooks/useLanguage'
import { disputeService } from '../../services/disputeService'
import { formatDateTime } from '../../utils/formatDate'
import '../../styles/disputes.css'

export default function Disputes () {
  const { t } = useLanguage()
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState('')

  const statusOptions = useMemo(
    () =>
      Object.entries(DISPUTE_STATUS_LABELS).map(([value, label]) => ({
        value,
        label: t(label)
      })),
    [t]
  )

  const categoryOptions = useMemo(
    () =>
      Object.entries(DISPUTE_CATEGORY_LABELS).map(([value, label]) => ({
        value,
        label: t(label)
      })),
    [t]
  )

  const listLoader = useCallback(
    () =>
      disputeService.admin.list({
        page,
        limit: 20,
        ...(status ? { status } : {}),
        ...(category ? { category } : {})
      }),
    [page, status, category]
  )
  const list = useAsyncData(listLoader)

  const detailLoader = useCallback(
    () =>
      selectedId ? disputeService.admin.get(selectedId) : Promise.resolve(null),
    [selectedId]
  )
  const detail = useAsyncData(detailLoader)

  const handleComment = async body => {
    await disputeService.admin.comment(selectedId, body)
    detail.reload()
  }

  const handleDecide = async payload => {
    await disputeService.admin.decide(selectedId, payload)
    detail.reload()
    list.reload()
  }

  const columns = [
    {
      key: 'time',
      header: 'Time',
      render: dispute => formatDateTime(dispute.createdAt)
    },
    {
      key: 'group',
      header: 'Equb',
      render: dispute => dispute.group?.name ?? '—'
    },
    { key: 'subject', header: 'Subject', render: dispute => dispute.subject },
    {
      key: 'category',
      header: 'Category',
      render: dispute =>
        t(DISPUTE_CATEGORY_LABELS[dispute.category] ?? dispute.category)
    },
    {
      key: 'reporter',
      header: 'Reported by',
      render: dispute => dispute.reporter?.fullName ?? '—'
    },
    {
      key: 'status',
      header: 'Status',
      render: dispute => <DisputeBadge status={dispute.status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      render: dispute => (
        <Button variant='secondary' onClick={() => setSelectedId(dispute.id)}>
          {t('Review')}
        </Button>
      )
    }
  ]

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
        <Select
          label='Category'
          name='category'
          placeholder='All categories'
          options={categoryOptions}
          value={category}
          onChange={event => {
            setCategory(event.target.value)
            setPage(1)
          }}
        />
      </div>

      <ErrorMessage message={list.error} onRetry={list.reload} />
      {list.loading && !list.data && <Loader label='Loading disputes' />}

      {list.data && list.data.disputes.length === 0 && (
        <EmptyState title='No disputes' />
      )}
      {list.data && list.data.disputes.length > 0 && (
        <DataTable
          columns={columns}
          rows={list.data.disputes}
          caption='Disputes'
        />
      )}

      <Pagination
        meta={list.data?.meta}
        onPageChange={setPage}
        disabled={list.loading}
      />

      {selectedId && (
        <>
          <ErrorMessage message={detail.error} onRetry={detail.reload} />
          {detail.loading && !detail.data && <Loader label='Loading dispute' />}
          {detail.data && (
            <DisputeThread
              dispute={detail.data}
              onComment={handleComment}
              onDecide={handleDecide}
            />
          )}
        </>
      )}
    </div>
  )
}
