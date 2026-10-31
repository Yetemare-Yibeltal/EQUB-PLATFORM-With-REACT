import { useCallback, useMemo, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import Select from '../../components/common/Select'
import { AUDIT_ACTION_LABELS } from '../../constants/auditActions'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLanguage } from '../../hooks/useLanguage'
import { adminService } from '../../services/adminService'
import { formatDateTime } from '../../utils/formatDate'

const summarize = metadata => {
  const text = JSON.stringify(metadata ?? {})

  return text.length > 160 ? `${text.slice(0, 159)}…` : text
}

export default function AuditLogs () {
  const { t } = useLanguage()
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)

  const actionOptions = useMemo(
    () =>
      Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
        value,
        label: t(label)
      })),
    [t]
  )

  const loader = useCallback(
    () =>
      adminService.auditLogs({
        page,
        limit: 25,
        ...(action ? { action } : {})
      }),
    [page, action]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  const columns = [
    {
      key: 'time',
      header: 'Time',
      render: entry => formatDateTime(entry.createdAt)
    },
    {
      key: 'actor',
      header: 'By',
      render: entry => entry.actor?.fullName ?? '—'
    },
    {
      key: 'action',
      header: 'Action',
      render: entry => t(AUDIT_ACTION_LABELS[entry.action] ?? entry.action)
    },
    { key: 'entity', header: 'Entity', render: entry => entry.entityType },
    {
      key: 'details',
      header: 'Details',
      render: entry => (
        <code className='code-inline'>{summarize(entry.metadata)}</code>
      )
    }
  ]

  return (
    <div className='stack'>
      <div className='toolbar'>
        <Select
          label='Action'
          name='action'
          placeholder='All actions'
          options={actionOptions}
          value={action}
          onChange={event => {
            setAction(event.target.value)
            setPage(1)
          }}
        />
      </div>

      <ErrorMessage message={error} onRetry={reload} />
      {loading && !data && <Loader label='Loading audit log' />}

      {data && data.auditLogs.length === 0 && (
        <EmptyState title='No audit entries match' />
      )}
      {data && data.auditLogs.length > 0 && (
        <DataTable
          columns={columns}
          rows={data.auditLogs}
          caption='Audit log'
        />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />
    </div>
  )
}
