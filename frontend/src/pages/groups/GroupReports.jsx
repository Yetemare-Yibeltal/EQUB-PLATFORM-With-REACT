import { useCallback, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import StatusBadge from '../../components/common/StatusBadge'
import StatsCard from '../../components/dashboard/StatsCard'
import { AUDIT_ACTION_LABELS } from '../../constants/auditActions'
import {
  CYCLE_STATUS_LABELS,
  PAYOUT_STATUS_LABELS
} from '../../constants/statuses'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useGroup } from '../../hooks/useGroup'
import { useLanguage } from '../../hooks/useLanguage'
import { groupService } from '../../services/groupService'
import { reportService } from '../../services/reportService'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDate, formatDateTime } from '../../utils/formatDate'
import { formatPercent } from '../../utils/formatNumber'

const summarize = metadata => {
  const text = JSON.stringify(metadata ?? {})

  return text.length > 120 ? `${text.slice(0, 119)}…` : text
}

export default function GroupReports () {
  const { t } = useLanguage()
  const { group, canViewPrivate, isOrganizer, version } = useGroup()
  const [auditPage, setAuditPage] = useState(1)

  const statementLoader = useCallback(
    () => reportService.getGroupStatement(group.id),
    [group.id, version]
  )
  const { data: statement, loading, error } = useAsyncData(statementLoader)

  const reliabilityLoader = useCallback(
    async () =>
      canViewPrivate ? reportService.getReliability(group.id) : null,
    [group.id, canViewPrivate, version]
  )
  const { data: reliability, error: reliabilityError } =
    useAsyncData(reliabilityLoader)

  const auditLoader = useCallback(
    async () =>
      canViewPrivate
        ? groupService.auditLogs(group.id, { page: auditPage, limit: 10 })
        : null,
    [group.id, canViewPrivate, auditPage, version]
  )
  const {
    data: audit,
    loading: auditLoading,
    error: auditError
  } = useAsyncData(auditLoader)

  const cycleColumns = [
    { key: 'number', header: 'Cycle', render: cycle => `#${cycle.number}` },
    {
      key: 'dueDate',
      header: 'Due',
      render: cycle => formatDate(cycle.dueDate)
    },
    {
      key: 'status',
      header: 'Status',
      render: cycle => (
        <StatusBadge status={cycle.status} labels={CYCLE_STATUS_LABELS} />
      )
    },
    {
      key: 'collected',
      header: 'Collected',
      render: cycle =>
        t('{resolved} of {total}', {
          resolved: formatMoney(cycle.collectedAmount),
          total: formatMoney(cycle.potAmount)
        })
    },
    {
      key: 'recipient',
      header: 'Recipient',
      render: cycle =>
        cycle.payout ? (
          <span className='inline-actions'>
            {cycle.payout.recipient.fullName}
            <StatusBadge
              status={cycle.payout.status}
              labels={PAYOUT_STATUS_LABELS}
            />
          </span>
        ) : (
          '—'
        )
    }
  ]

  const reliabilityColumns = [
    {
      key: 'member',
      header: 'Member',
      render: row => row.user.fullName ?? '—'
    },
    { key: 'paid', header: 'Paid', render: row => row.paid },
    { key: 'onTime', header: 'On time', render: row => row.onTime },
    { key: 'late', header: 'Late', render: row => row.late },
    { key: 'waived', header: 'Waived', render: row => row.waived },
    { key: 'overdue', header: 'Overdue', render: row => row.overdue },
    {
      key: 'outstanding',
      header: 'Owes',
      render: row => formatMoney(row.outstanding)
    },
    {
      key: 'rate',
      header: 'On-time rate',
      render: row => formatPercent(row.onTimeRate)
    }
  ]

  const auditColumns = [
    {
      key: 'time',
      header: 'Time',
      render: entry => formatDateTime(entry.createdAt)
    },
    {
      key: 'actor',
      header: 'By',
      render: entry => entry.actor?.fullName ?? '—'
    },
    {
      key: 'action',
      header: 'Action',
      render: entry => t(AUDIT_ACTION_LABELS[entry.action] ?? entry.action)
    },
    {
      key: 'details',
      header: 'Details',
      render: entry => (
        <code className='code-inline'>{summarize(entry.metadata)}</code>
      )
    }
  ]

  return (
    <div className='stack'>
      <ErrorMessage message={error} />
      {loading && !statement && <Loader label='Loading statement' />}

      {statement && (
        <>
          <section className='stats-grid' aria-label={t('Statement totals')}>
            <StatsCard
              label='Collected'
              value={formatMoney(statement.totals.totalIn)}
              tone='success'
            />
            <StatsCard
              label='Paid out'
              value={formatMoney(statement.totals.totalOut)}
            />
            <StatsCard
              label='Balance held'
              value={formatMoney(statement.totals.balance)}
            />
            <StatsCard
              label='Penalties collected'
              value={formatMoney(statement.totals.penaltiesCollected)}
            />
            <StatsCard
              label='Contributions paid'
              value={statement.totals.contributionsPaid}
              hint={t('{count} late', { count: statement.totals.latePayments })}
            />
            <StatsCard
              label='Outstanding'
              value={statement.totals.contributionsPending}
              tone={
                statement.totals.contributionsOverdue > 0 ? 'danger' : 'neutral'
              }
              hint={t('{count} overdue', {
                count: statement.totals.contributionsOverdue
              })}
            />
          </section>

          <section className='stack'>
            <h2>{t('Cycles')}</h2>
            <DataTable
              columns={cycleColumns}
              rows={statement.cycles}
              caption='Cycle statement'
            />
          </section>
        </>
      )}

      {canViewPrivate && (
        <section className='stack'>
          <h2>{t('Member reliability')}</h2>
          <ErrorMessage message={reliabilityError} />
          {reliability && (
            <>
              <p className='muted'>
                {t(
                  'Group on-time rate: {rate}. Waived and not-yet-due contributions are not counted.',
                  { rate: formatPercent(reliability.summary.onTimeRate) }
                )}
              </p>
              <DataTable
                columns={reliabilityColumns}
                rows={reliability.members}
                rowKey={row => row.user.id}
                caption='Member reliability'
              />
            </>
          )}
        </section>
      )}

      {canViewPrivate && (
        <section className='stack'>
          <h2>{t('Audit trail')}</h2>
          {isOrganizer ? null : (
            <p className='muted'>{t('Viewing as administrator')}</p>
          )}
          <ErrorMessage message={auditError} />
          {audit && audit.auditLogs.length === 0 && (
            <p className='muted'>
              {t('Draws and payouts are recorded here once they happen.')}
            </p>
          )}
          {audit && audit.auditLogs.length > 0 && (
            <DataTable
              columns={auditColumns}
              rows={audit.auditLogs}
              caption='Audit trail'
            />
          )}
          <Pagination
            meta={audit?.meta}
            onPageChange={setAuditPage}
            disabled={auditLoading}
          />
        </section>
      )}
    </div>
  )
}
