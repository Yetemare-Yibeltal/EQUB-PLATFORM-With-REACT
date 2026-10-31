import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import Select from '../../components/common/Select'
import StatusBadge from '../../components/common/StatusBadge'
import { groupPath } from '../../constants/routes'
import { GROUP_STATUS_LABELS } from '../../constants/statuses'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLanguage } from '../../hooks/useLanguage'
import { adminService } from '../../services/adminService'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function Groups () {
  const { t } = useLanguage()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const statusOptions = useMemo(
    () =>
      Object.entries(GROUP_STATUS_LABELS).map(([value, label]) => ({
        value,
        label: t(label)
      })),
    [t]
  )

  const loader = useCallback(
    () =>
      adminService.groups({
        page,
        limit: 20,
        ...(search ? { search } : {}),
        ...(status ? { status } : {})
      }),
    [page, search, status]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  const columns = [
    {
      key: 'name',
      header: 'Equb',
      render: group => <Link to={groupPath(group.id)}>{group.name}</Link>
    },
    {
      key: 'organizer',
      header: 'Organizer',
      render: group => group.createdBy?.fullName ?? '—'
    },
    {
      key: 'status',
      header: 'Status',
      render: group => (
        <StatusBadge status={group.status} labels={GROUP_STATUS_LABELS} />
      )
    },
    {
      key: 'members',
      header: 'Members',
      render: group => `${group.memberCount} / ${group.maxMembers}`
    },
    {
      key: 'contribution',
      header: 'Contribution',
      render: group => formatMoney(group.contributionAmount)
    },
    {
      key: 'created',
      header: 'Created',
      render: group => formatDate(group.createdAt)
    }
  ]

  return (
    <div className='stack'>
      <form
        className='toolbar'
        onSubmit={event => {
          event.preventDefault()
          setSearch(searchInput.trim())
          setPage(1)
        }}
      >
        <Input
          label='Search'
          name='search'
          placeholder='Group name'
          value={searchInput}
          onChange={event => setSearchInput(event.target.value)}
        />
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
        <Button type='submit' variant='secondary'>
          {t('Search')}
        </Button>
      </form>

      <ErrorMessage message={error} onRetry={reload} />
      {loading && !data && <Loader label='Loading equbs' />}

      {data && data.groups.length === 0 && (
        <EmptyState title='No equbs match' />
      )}
      {data && data.groups.length > 0 && (
        <DataTable columns={columns} rows={data.groups} caption='All equbs' />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />
    </div>
  )
}
