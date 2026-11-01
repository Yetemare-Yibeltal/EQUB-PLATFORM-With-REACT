import { useState } from 'react'
import {
  DISPUTE_CATEGORY_LABELS,
  DISPUTE_STATUS,
  isActiveDispute
} from '../../constants/disputes'
import { useLanguage } from '../../hooks/useLanguage'
import { getErrorMessage } from '../../utils/errors'
import { formatDateTime } from '../../utils/formatDate'
import Button from '../common/Button'
import ReasonModal from '../common/ReasonModal'
import Textarea from '../common/Textarea'
import DisputeBadge from './DisputeBadge'
import '../../styles/disputes.css'

const DECISIONS = {
  [DISPUTE_STATUS.RESOLVED]: {
    title: 'Resolve this dispute?',
    description: 'Members involved will see the decision you write.',
    submitLabel: 'Resolve',
    variant: 'primary'
  },
  [DISPUTE_STATUS.DISMISSED]: {
    title: 'Dismiss this dispute?',
    description: 'Members involved will see the reason you give.',
    submitLabel: 'Dismiss',
    variant: 'danger'
  }
}

export default function DisputeThread ({ dispute, onComment, onDecide }) {
  const { t } = useLanguage()
  const [body, setBody] = useState('')
  const [commentError, setCommentError] = useState('')
  const [sending, setSending] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [decision, setDecision] = useState(null)

  const permissions = dispute.permissions ?? {}
  const decided = !isActiveDispute(dispute.status)
  const decisionConfig = decision ? DECISIONS[decision] : null

  const handleComment = async event => {
    event.preventDefault()

    const value = body.trim()

    if (!value) {
      setCommentError(t('Write a comment first'))
      return
    }

    setSending(true)
    setCommentError('')

    try {
      await onComment(value)
      setBody('')
    } catch (error) {
      setCommentError(getErrorMessage(error))
    } finally {
      setSending(false)
    }
  }

  const startReview = async () => {
    setReviewing(true)
    setActionError('')

    try {
      await onDecide({ status: DISPUTE_STATUS.IN_REVIEW })
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setReviewing(false)
    }
  }

  const handleDecision = async resolution => {
    await onDecide({ status: decision, resolution })
    setDecision(null)
  }

  return (
    <div className='stack'>
      <section className='card'>
        <div className='title-row'>
          <h2>{dispute.subject}</h2>
          <DisputeBadge status={dispute.status} />
        </div>
        <p className='muted dispute-meta'>
          {t(DISPUTE_CATEGORY_LABELS[dispute.category] ?? dispute.category)}
          {' · '}
          {t('Reported by {name}', { name: dispute.reporter?.fullName ?? '—' })}
          {' · '}
          {formatDateTime(dispute.createdAt)}
        </p>
        {dispute.group?.name && (
          <p className='muted dispute-meta'>
            {t('Equb: {name}', { name: dispute.group.name })}
          </p>
        )}
        {dispute.against && (
          <p className='muted dispute-meta'>
            {t('About {name}', { name: dispute.against.fullName ?? '—' })}
          </p>
        )}
        <p className='dispute-text'>{dispute.description}</p>
      </section>

      {decided && (
        <section className='card'>
          <h2>{t('Decision')}</h2>
          <p className='dispute-text'>{dispute.resolution || '—'}</p>
          <p className='muted dispute-meta'>
            {t('Decided by {name}', {
              name: dispute.decidedBy?.fullName ?? '—'
            })}
            {' · '}
            {formatDateTime(dispute.decidedAt)}
          </p>
        </section>
      )}

      <section className='card'>
        <h2>{t('Discussion')}</h2>

        {dispute.comments.length === 0 ? (
          <p className='muted'>{t('No comments yet.')}</p>
        ) : (
          <ul className='dispute-comments'>
            {dispute.comments.map(comment => (
              <li key={comment._id ?? comment.id} className='dispute-comment'>
                <strong>{comment.author?.fullName ?? '—'}</strong>
                <span className='muted dispute-meta'>
                  {' · '}
                  {formatDateTime(comment.createdAt)}
                </span>
                <p>{comment.body}</p>
              </li>
            ))}
          </ul>
        )}

        {permissions.canComment && (
          <form className='form' onSubmit={handleComment} noValidate>
            <Textarea
              label='Add a comment'
              rows={3}
              value={body}
              maxLength={1000}
              error={commentError}
              onChange={event => {
                setBody(event.target.value)
                setCommentError('')
              }}
            />
            <div>
              <Button type='submit' loading={sending}>
                {t('Post comment')}
              </Button>
            </div>
          </form>
        )}
      </section>

      {permissions.canDecide && (
        <section className='card'>
          <h2>{t('Decide this dispute')}</h2>
          <p className='muted'>
            {t(
              'Review the report, then resolve it or dismiss it with a written decision.'
            )}
          </p>

          {actionError && (
            <p className='field-error' role='alert'>
              {actionError}
            </p>
          )}

          <div className='dispute-actions'>
            {dispute.status === DISPUTE_STATUS.OPEN && (
              <Button
                variant='secondary'
                loading={reviewing}
                onClick={startReview}
              >
                {t('Start review')}
              </Button>
            )}
            <Button onClick={() => setDecision(DISPUTE_STATUS.RESOLVED)}>
              {t('Resolve')}
            </Button>
            <Button
              variant='danger'
              onClick={() => setDecision(DISPUTE_STATUS.DISMISSED)}
            >
              {t('Dismiss')}
            </Button>
          </div>
        </section>
      )}

      <ReasonModal
        open={Boolean(decisionConfig)}
        title={decisionConfig?.title ?? ''}
        description={decisionConfig?.description}
        label='Decision'
        submitLabel={decisionConfig?.submitLabel ?? 'Submit'}
        variant={decisionConfig?.variant ?? 'primary'}
        maxLength={1000}
        onSubmit={handleDecision}
        onClose={() => setDecision(null)}
      />
    </div>
  )
}
