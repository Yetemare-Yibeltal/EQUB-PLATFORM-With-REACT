import { useCallback, useState } from 'react'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import DataTable from '../../components/common/DataTable'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import StatusBadge from '../../components/common/StatusBadge'
import { useAsyncData } from '../../hooks/useAsyncData'
import { adminService } from '../../services/adminService'
import { getErrorMessage } from '../../utils/errors'

const JOB_DESCRIPTIONS = {
  'contribution-reminders': 'Contribution reminders and overdue notices',
  'draw-reminders': 'Reminds organizers about draws that are waiting',
  'payout-reminders': 'Reminds organizers about pending payouts',
  'notification-cleanup': 'Deletes old notifications'
}

export default function SystemSettings () {
  const loader = useCallback(() => adminService.jobs(), [])
  const { data, loading, error, reload } = useAsyncData(loader)
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')

  const handleRun = async () => {
    setBusy(true)
    setActionError('')
    setNotice('')

    try {
      const result = await adminService.runJob(target.name)
      setNotice(`${target.name} finished: ${JSON.stringify(result.summary)}`)
      reload()
    } catch (requestError) {
      setActionError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
      setTarget(null)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Job',
      render: job => <code className='code-inline'>{job.name}</code>
    },
    {
      key: 'description',
      header: 'Purpose',
      render: job => JOB_DESCRIPTIONS[job.name] ?? '—'
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: job => (
        <>
          <code className='code-inline'>{job.schedule}</code>
          <span className='muted'> {job.timezone}</span>
        </>
      )
    },
    {
      key: 'state',
      header: 'State',
      render: job => (
        <StatusBadge
          status={job.running ? 'running' : 'idle'}
          tone={job.running ? 'warning' : 'neutral'}
        />
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'cell-actions',
      render: job => (
        <Button
          size='sm'
          variant='secondary'
          disabled={job.running}
          onClick={() => setTarget(job)}
        >
          Run now
        </Button>
      )
    }
  ]

  return (
    <div className='stack'>
      <p className='muted'>
        Jobs run automatically on their schedule. Running one by hand is safe to
        repeat, because notifications are deduplicated.
      </p>

      {notice && (
        <p className='alert alert-success' role='status'>
          {notice}
        </p>
      )}
      <ErrorMessage message={error} onRetry={reload} />
      <ErrorMessage message={actionError} />
      {loading && !data && <Loader label='Loading jobs' />}

      {data && (
        <DataTable
          columns={columns}
          rows={data}
          rowKey='name'
          caption='Scheduled jobs'
        />
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title='Run this job now?'
        message={`${
          target?.name ?? ''
        } runs immediately and the run is recorded in the audit log.`}
        confirmLabel='Run job'
        loading={busy}
        onConfirm={handleRun}
        onCancel={() => setTarget(null)}
      />
    </div>
  )
}
