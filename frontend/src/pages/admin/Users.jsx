import { useCallback, useState } from 'react'
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
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

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
        row.lastLoginAt ? formatDateTime(row.lastLoginAt) : 'Never'
    },
    {
      key: 'actions',
      header: '',
      className: 'cell-actions',
      render: row =>
        row.id === currentUser.id ? (
          <span className='muted'>You</span>
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
              {row.status === 'active' ? 'Suspend' : 'Activate'}
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
              {row.role === 'admin' ? 'Remove admin' : 'Make admin'}
            </Button>
          </div>
        )
    }
  ]

  const confirmMessage = pending
    ? pending.kind === 'status'
      ? pending.value === 'suspended'
        ? `${pending.user.fullName} will be signed out and cannot log in until reactivated.`
        : `${pending.user.fullName} will be able to log in again.`
      : pending.value === 'admin'
      ? `${pending.user.fullName} will get full administrator access.`
      : `${pending.user.fullName} will lose administrator access.`
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
          options={ROLE_OPTIONS}
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
          options={STATUS_OPTIONS}
          value={status}
          onChange={event => {
            setStatus(event.target.value)
            setPage(1)
          }}
        />
        <Button type='submit' variant='secondary'>
          Search
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
