import { PAYOUT_ORDER_LABELS } from '../../constants/statuses'
import { useLanguage } from '../../hooks/useLanguage'
import { formatDateTime } from '../../utils/formatDate'
import StatusBadge from '../common/StatusBadge'

export default function DrawCard ({ draw }) {
  const { t } = useLanguage()

  return (
    <section className='card'>
      <div className='title-row'>
        <h2>{t('Cycle {number} draw', { number: draw.cycleNumber })}</h2>
        <StatusBadge
          status={draw.verified ? 'verified' : 'failed'}
          labels={{ verified: 'Verified', failed: 'Not verified' }}
        />
      </div>
      <dl className='detail-list'>
        <div>
          <dt>{t('Winner')}</dt>
          <dd>{draw.winnerUser?.fullName ?? '—'}</dd>
        </div>
        <div>
          <dt>{t('Method')}</dt>
          <dd>{t(PAYOUT_ORDER_LABELS[draw.method])}</dd>
        </div>
        <div>
          <dt>{t('Drawn')}</dt>
          <dd>{formatDateTime(draw.drawnAt)}</dd>
        </div>
        <div>
          <dt>{t('Participants')}</dt>
          <dd>{draw.participants.length}</dd>
        </div>
      </dl>
      <details className='details'>
        <summary>{t('Participants and verification')}</summary>
        <ol className='participant-list'>
          {draw.participants.map((participant, index) => (
            <li
              key={participant.member}
              className={
                index === draw.winnerIndex
                  ? 'participant participant-winner'
                  : 'participant'
              }
            >
              {participant.user?.fullName}
              {index === draw.winnerIndex && ` (${t('winner')})`}
            </li>
          ))}
        </ol>
        {draw.seed && (
          <>
            <p className='muted'>{t('Draw seed')}</p>
            <code className='code-block'>{draw.seed}</code>
          </>
        )}
        <p className='muted'>
          {t(
            'The winner is the participant at position (SHA-256 of seed, cycle id, and participant ids) modulo the number of participants. The server recomputes this on every request.'
          )}
        </p>
      </details>
    </section>
  )
}
