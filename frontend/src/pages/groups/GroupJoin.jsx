import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import ErrorMessage from '../../components/common/ErrorMessage'
import Input from '../../components/common/Input'
import StatusBadge from '../../components/common/StatusBadge'
import { ROUTES, groupPath } from '../../constants/routes'
import {
  FREQUENCY_LABELS,
  GROUP_STATUS_LABELS,
  PAYOUT_ORDER_LABELS
} from '../../constants/statuses'
import { groupService } from '../../services/groupService'
import { getErrorMessage } from '../../utils/errors'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

const CODE_PATTERN = /^[A-Za-z0-9-]{6,16}$/

export default function GroupJoin () {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') ?? '')
  const [fieldError, setFieldError] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [looking, setLooking] = useState(false)
  const [joining, setJoining] = useState(false)
  const [requested, setRequested] = useState(false)

  const handlePreview = async event => {
    event.preventDefault()

    const value = code.trim()

    if (!CODE_PATTERN.test(value)) {
      setFieldError('Enter the invite code you received')
      return
    }

    setLooking(true)
    setError('')
    setPreview(null)

    try {
      setPreview(await groupService.preview(value))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLooking(false)
    }
  }

  const handleJoin = async () => {
    setJoining(true)
    setError('')

    try {
      const result = await groupService.join(code.trim())

      if (result.membership.status === 'active') {
        navigate(groupPath(result.group.id), { replace: true })
        return
      }

      setRequested(true)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setJoining(false)
    }
  }

  if (requested) {
    return (
      <div className='page'>
        <section className='card'>
          <h1>Request sent</h1>
          <p>
            The organizer of {preview?.name} must approve your request. You will
            get a notification when they decide.
          </p>
          <Link to={ROUTES.GROUPS} className='btn btn-primary btn-md'>
            Back to my equbs
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className='page'>
      <header className='page-header'>
        <p>
          <Link to={ROUTES.GROUPS}>My equbs</Link>
        </p>
        <h1>Join an equb</h1>
        <p className='muted'>
          Enter the invite code the organizer shared with you
        </p>
      </header>

      <section className='card'>
        <form className='form' onSubmit={handlePreview} noValidate>
          <Input
            label='Invite code'
            name='inviteCode'
            autoComplete='off'
            autoCapitalize='characters'
            value={code}
            onChange={event => {
              setCode(event.target.value)
              setFieldError('')
              setPreview(null)
            }}
            error={fieldError}
            required
          />
          <Button type='submit' loading={looking}>
            Look up equb
          </Button>
        </form>
      </section>

      <ErrorMessage message={error} />

      {preview && (
        <section className='card'>
          <div className='title-row'>
            <h2>{preview.name}</h2>
            <StatusBadge status={preview.status} labels={GROUP_STATUS_LABELS} />
          </div>
          {preview.description && (
            <p className='muted'>{preview.description}</p>
          )}
          <dl className='detail-list'>
            <div>
              <dt>Organizer</dt>
              <dd>{preview.organizer.fullName ?? '—'}</dd>
            </div>
            <div>
              <dt>Contribution</dt>
              <dd>
                {formatMoney(preview.contributionAmount)} ·{' '}
                {FREQUENCY_LABELS[preview.frequency]}
              </dd>
            </div>
            <div>
              <dt>Members</dt>
              <dd>
                {preview.memberCount} / {preview.maxMembers} (
                {preview.spotsLeft} spots left)
              </dd>
            </div>
            <div>
              <dt>Starts</dt>
              <dd>{formatDate(preview.startDate)}</dd>
            </div>
            <div>
              <dt>Late penalty</dt>
              <dd>
                {preview.latePenaltyAmount > 0
                  ? formatMoney(preview.latePenaltyAmount)
                  : 'None'}
                {preview.gracePeriodDays > 0 &&
                  ` after ${preview.gracePeriodDays} grace days`}
              </dd>
            </div>
            <div>
              <dt>Payout order</dt>
              <dd>{PAYOUT_ORDER_LABELS[preview.payoutOrderMethod]}</dd>
            </div>
          </dl>
          {preview.requireApproval && (
            <p className='alert alert-info'>
              The organizer must approve your request to join.
            </p>
          )}
          {!preview.canJoin && (
            <p className='alert alert-error'>
              This group is full or no longer accepting members.
            </p>
          )}
          <Button
            onClick={handleJoin}
            loading={joining}
            disabled={!preview.canJoin}
          >
            {preview.requireApproval ? 'Request to join' : 'Join this equb'}
          </Button>
        </section>
      )}
    </div>
  )
}
