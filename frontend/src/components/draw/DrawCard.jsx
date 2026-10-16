import { PAYOUT_ORDER_LABELS } from '../../constants/statuses'
import { formatDateTime } from '../../utils/formatDate'
import StatusBadge from '../common/StatusBadge'

export default function DrawCard ({ draw }) {
  return (
    <section className='card'>
      <div className='title-row'>
        <h2>Cycle {draw.cycleNumber} draw</h2>
        <StatusBadge
          status={draw.verified ? 'verified' : 'failed'}
          labels={{ verified: 'Verified', failed: 'Not verified' }}
        />
      </div>
      <dl className='detail-list'>
        <div>
          <dt>Winner</dt>
          <dd>{draw.winnerUser?.fullName ?? '—'}</dd>
        </div>
        <div>
          <dt>Method</dt>
          <dd>{PAYOUT_ORDER_LABELS[draw.method]}</dd>
        </div>
        <div>
          <dt>Drawn</dt>
          <dd>{formatDateTime(draw.drawnAt)}</dd>
        </div>
        <div>
          <dt>Participants</dt>
          <dd>{draw.participants.length}</dd>
        </div>
      </dl>
      <details className='details'>
        <summary>Participants and verification</summary>
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
              {index === draw.winnerIndex && ' (winner)'}
            </li>
          ))}
        </ol>
        {draw.seed && (
          <>
            <p className='muted'>Draw seed</p>
            <code className='code-block'>{draw.seed}</code>
          </>
        )}
        <p className='muted'>
          The winner is the participant at position (SHA-256 of seed, cycle id,
          and participant ids) modulo the number of participants. The server
          recomputes this on every request.
        </p>
      </details>
    </section>
  )
}
