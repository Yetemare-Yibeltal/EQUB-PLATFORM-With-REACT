import { useCallback, useMemo, useState } from 'react'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import DataTable from '../../components/common/DataTable'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import Select from '../../components/common/Select'
import StatusBadge from '../../components/common/StatusBadge'
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from '../../constants/roles'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { userService } from '../../services/userService'
import { getErrorMessage } from '../../utils/errors'
import { formatDateTime } from '../../utils/formatDate'

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Administrator' }
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' }
]

export default function Users () {
  const { user: currentUser } = useAuth()
  const { t } = useLanguage()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const roleOptions = useMemo(
    () => ROLE_OPTIONS.map(option => ({ ...option, label: t(option.label) })),
    [t]
  )
  const statusOptions = useMemo(
    () => STATUS_OPTIONS.map(option => ({ ...option, label: t(option.label) })),
    [t]
  )

  const loader = useCallback(
    () =>
      userService.list({
        page,
        limit: 20,
        ...(search ? { search } : {}),
        ...(role ? { role } : {}),
        ...(status ? { status } : {})
      }),
    [page, search, role, status]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  const handleSearch = event => {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleConfirm = async () => {
    setBusy(true)
    setActionError('')

    try {
      if (pending.kind === 'status') {
        await userService.setStatus(pending.user.id, pending.value)
      } else {
        await userService.setRole(pending.user.id, pending.value)
      }
      reload()
    } catch (requestError) {
      setActionError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  const columns = [
    { key: 'name', header: 'Name', render: row => row.fullName },
    { key: 'phone', header: 'Phone', render: row => row.phone },
    { key: 'email', header: 'Email', render: row => row.email ?? '—' },
    {
      key: 'role',
      header: 'Role',
      render: row => (
        <StatusBadge
          status={row.role}
          labels={USER_ROLE_LABELS}
          tone='neutral'
        />
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: row => (
        <StatusBadge status={row.status} labels={USER_STATUS_LABELS} />
      )
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      render: row =>
        row.lastLoginAt ? formatDateTime(row.lastLoginAt) : t('Never')
    },
    {
      key: 'actions',
      header: '',
      className: 'cell-actions',
      render: row =>
        row.id === currentUser.id ? (
          <span className='muted'>{t('You')}</span>
        ) : (
          <div className='inline-actions'>
            <Button
              size='sm'
              variant='secondary'
              onClick={() =>
                setPending({
                  user: row,
                  kind: 'status',
                  value: row.status === 'active' ? 'suspended' : 'active'
                })
              }
            >
              {row.status === 'active' ? t('Suspend') : t('Activate')}
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={() =>
                setPending({
                  user: row,
                  kind: 'role',
                  value: row.role === 'admin' ? 'user' : 'admin'
                })
              }
            >
              {row.role === 'admin' ? t('Remove admin') : t('Make admin')}
            </Button>
          </div>
        )
    }
  ]

  const confirmName = pending ? { name: pending.user.fullName } : {}

  const confirmMessage = pending
    ? pending.kind === 'status'
      ? pending.value === 'suspended'
        ? t(
            '{name} will be signed out and cannot log in until reactivated.',
            confirmName
          )
        : t('{name} will be able to log in again.', confirmName)
      : pending.value === 'admin'
      ? t('{name} will get full administrator access.', confirmName)
      : t('{name} will lose administrator access.', confirmName)
    : ''

  return (
    <div className='stack'>
      <form className='toolbar' onSubmit={handleSearch}>
        <Input
          label='Search'
          name='search'
          placeholder='Name, phone, or email'
          value={searchInput}
          onChange={event => setSearchInput(event.target.value)}
        />
        <Select
          label='Role'
          name='role'
          placeholder='All roles'
          options={roleOptions}
          value={role}
          onChange={event => {
            setRole(event.target.value)
            setPage(1)
          }}
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
      <ErrorMessage message={actionError} />
      {loading && !data && <Loader label='Loading users' />}

      {data && data.users.length === 0 && <EmptyState title='No users match' />}
      {data && data.users.length > 0 && (
        <DataTable columns={columns} rows={data.users} caption='Users' />
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} disabled={loading} />

      <ConfirmDialog
        open={Boolean(pending)}
        title='Confirm change'
        message={confirmMessage}
        confirmLabel='Confirm'
        variant={pending?.value === 'suspended' ? 'danger' : 'primary'}
        loading={busy}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
