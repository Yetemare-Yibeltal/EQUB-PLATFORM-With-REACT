import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import CopyButton from '../../components/common/CopyButton'
import ErrorMessage from '../../components/common/ErrorMessage'
import CycleCard from '../../components/cycle/CycleCard'
import StatsCard from '../../components/dashboard/StatsCard'
import { ROUTES, groupPath } from '../../constants/routes'
import { FREQUENCY_LABELS, PAYOUT_ORDER_LABELS } from '../../constants/statuses'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useGroup } from '../../hooks/useGroup'
import { cycleService } from '../../services/cycleService'
import { groupService } from '../../services/groupService'
import { getErrorMessage } from '../../utils/errors'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function GroupDetail () {
  const navigate = useNavigate()
  const { group, membership, isOrganizer, version, refresh } = useGroup()
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const cycleLoader = useCallback(async () => {
    if (group.status !== 'active') return null

    try {
      return await cycleService.current(group.id)
    } catch (requestError) {
      if (requestError.response?.status === 404) return null
      throw requestError
    }
  }, [group.id, group.status, version])
  const { data: currentCycle, error: cycleError } = useAsyncData(cycleLoader)

  const isOpen = group.status === 'open'
  const joinLink = group.inviteCode
    ? `${window.location.origin}${ROUTES.GROUP_JOIN}?code=${group.inviteCode}`
    : ''

  const runAction = async (action, successMessage) => {
    setBusy(true)
    setError('')
    setNotice('')

    try {
      await action()
      setNotice(successMessage)
      refresh()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  const handleConfirm = async () => {
    if (confirm === 'start') {
      await runAction(
        () => groupService.start(group.id),
        'The equb has started'
      )
    } else if (confirm === 'regenerate') {
      await runAction(
        () => groupService.regenerateInviteCode(group.id),
        'A new invite code was generated, the old one no longer works'
      )
    } else if (confirm === 'leave') {
      setBusy(true)
      setError('')

      try {
        await groupService.leave(group.id)
        navigate(ROUTES.GROUPS, { replace: true })
      } catch (requestError) {
        setError(getErrorMessage(requestError))
        setBusy(false)
        setConfirm(null)
      }
    }
  }

  const confirmCopy = {
    start: {
      title: 'Start this equb?',
      message: `The member list is fixed at ${group.memberCount} members, ${group.memberCount} cycles are scheduled, and nobody can join or leave afterwards.`,
      label: 'Start equb',
      variant: 'primary'
    },
    regenerate: {
      title: 'Generate a new invite code?',
      message:
        'The current code stops working immediately. Share the new one with people you want to invite.',
      label: 'Generate new code',
      variant: 'primary'
    },
    leave: {
      title: 'Leave this equb?',
      message:
        'You can rejoin later with the invite code while the group is still open.',
      label: 'Leave equb',
      variant: 'danger'
    }
  }[confirm]

  const canLeave = membership?.status === 'active' && !isOrganizer && isOpen

  return (
    <div className='stack'>
      {notice && (
        <p className='alert alert-success' role='status'>
          {notice}
        </p>
      )}
      <ErrorMessage message={error} />

      <section className='stats-grid' aria-label='Group summary'>
        <StatsCard
          label='Contribution'
          value={formatMoney(group.contributionAmount)}
          hint={FREQUENCY_LABELS[group.frequency]}
        />
        <StatsCard
          label='Members'
          value={`${group.memberCount} / ${group.maxMembers}`}
          hint={isOpen ? `${group.spotsLeft} spots left` : undefined}
        />
        <StatsCard label='Pot per cycle' value={formatMoney(group.potAmount)} />
        <StatsCard label='Start date' value={formatDate(group.startDate)} />
        <StatsCard
          label='Late penalty'
          value={
            group.latePenaltyAmount > 0
              ? formatMoney(group.latePenaltyAmount)
              : 'None'
          }
          hint={`Grace period: ${group.gracePeriodDays} days`}
        />
        <StatsCard
          label='Payout order'
          value={PAYOUT_ORDER_LABELS[group.payoutOrderMethod]}
        />
      </section>

      {isOrganizer && isOpen && (
        <section className='card'>
          <h2>Invite members</h2>
          <p className='muted'>
            Share this code or link. Only people you give it to can join.
          </p>
          <div className='inline-actions'>
            <code className='code-block code-large'>{group.inviteCode}</code>
            <CopyButton value={group.inviteCode} label='Copy code' />
            <CopyButton value={joinLink} label='Copy link' />
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setConfirm('regenerate')}
            >
              New code
            </Button>
          </div>
          {group.requireApproval && (
            <p>
              Approval is required.{' '}
              <Link to={groupPath(group.id, 'members')}>
                Review join requests
              </Link>
            </p>
          )}
          <div>
            <Button
              onClick={() => setConfirm('start')}
              disabled={group.memberCount < 2}
            >
              Start equb
            </Button>
            {group.memberCount < 2 && (
              <p className='field-hint'>
                At least 2 active members are needed to start.
              </p>
            )}
          </div>
        </section>
      )}

      {group.status === 'cancelled' && (
        <p className='alert alert-error'>
          This equb was cancelled
          {group.cancelReason ? `: ${group.cancelReason}` : '.'}
        </p>
      )}

      {group.status === 'completed' && (
        <p className='alert alert-success'>
          Every member has received a payout. This equb is complete.
        </p>
      )}

      <ErrorMessage message={cycleError} />
      {currentCycle && (
        <CycleCard
          cycle={currentCycle}
          overdueCount={currentCycle.overdueCount}
        />
      )}

      {canLeave && (
        <div>
          <Button variant='ghost' onClick={() => setConfirm('leave')}>
            Leave this equb
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirmCopy?.title ?? ''}
        message={confirmCopy?.message ?? ''}
        confirmLabel={confirmCopy?.label}
        variant={confirmCopy?.variant}
        loading={busy}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
