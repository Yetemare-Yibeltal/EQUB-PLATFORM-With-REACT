import { CYCLE_STATUS_LABELS } from '../../constants/statuses'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import StatusBadge from '../common/StatusBadge'

export default function CycleCard ({ cycle, overdueCount = 0 }) {
  const percent = cycle.expectedCount
    ? Math.round((cycle.resolvedCount / cycle.expectedCount) * 100)
    : 0

  const awaitingDraw = cycle.status === 'collected' && !cycle.recipient

  return (
    <section className='card'>
      <div className='title-row'>
        <h2>Cycle {cycle.number}</h2>
        <StatusBadge status={cycle.status} labels={CYCLE_STATUS_LABELS} />
        {awaitingDraw && (
          <StatusBadge
            status='pending'
            tone='warning'
            labels={{ pending: 'Awaiting draw' }}
          />
        )}
        {overdueCount > 0 && (
          <StatusBadge
            status='overdue'
            labels={{ overdue: `${overdueCount} overdue` }}
          />
        )}
      </div>
      <div
        className='progress'
        role='progressbar'
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label='Contributions resolved'
      >
        <div className='progress-bar' style={{ width: `${percent}%` }} />
      </div>
      <dl className='detail-list'>
        <div>
          <dt>Due date</dt>
          <dd>{formatDate(cycle.dueDate)}</dd>
        </div>
        <div>
          <dt>Resolved</dt>
          <dd>
            {cycle.resolvedCount} of {cycle.expectedCount}
          </dd>
        </div>
        <div>
          <dt>Collected</dt>
          <dd>
            {formatMoney(cycle.collectedAmount)} of{' '}
            {formatMoney(cycle.potAmount)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
