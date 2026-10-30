import { CYCLE_STATUS_LABELS } from '../../constants/statuses'
import { useLanguage } from '../../hooks/useLanguage'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import StatusBadge from '../common/StatusBadge'

export default function CycleCard ({ cycle, overdueCount = 0 }) {
  const { t } = useLanguage()

  const percent = cycle.expectedCount
    ? Math.round((cycle.resolvedCount / cycle.expectedCount) * 100)
    : 0

  const awaitingDraw = cycle.status === 'collected' && !cycle.recipient

  return (
    <section className='card'>
      <div className='title-row'>
        <h2>{t('Cycle {number}', { number: cycle.number })}</h2>
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
            labels={{
              overdue: t('{count} overdue', { count: overdueCount })
            }}
          />
        )}
      </div>
      <div
        className='progress'
        role='progressbar'
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('Contributions resolved')}
      >
        <div className='progress-bar' style={{ width: `${percent}%` }} />
      </div>
      <dl className='detail-list'>
        <div>
          <dt>{t('Due date')}</dt>
          <dd>{formatDate(cycle.dueDate)}</dd>
        </div>
        <div>
          <dt>{t('Resolved')}</dt>
          <dd>
            {t('{resolved} of {total}', {
              resolved: cycle.resolvedCount,
              total: cycle.expectedCount
            })}
          </dd>
        </div>
        <div>
          <dt>{t('Collected')}</dt>
          <dd>
            {t('{resolved} of {total}', {
              resolved: formatMoney(cycle.collectedAmount),
              total: formatMoney(cycle.potAmount)
            })}
          </dd>
        </div>
      </dl>
    </section>
  )
}
