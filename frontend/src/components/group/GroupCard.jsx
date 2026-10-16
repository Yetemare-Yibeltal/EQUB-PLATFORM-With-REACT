import { Link } from 'react-router-dom'
import { MEMBER_ROLE_LABELS } from '../../constants/roles'
import { groupPath } from '../../constants/routes'
import { FREQUENCY_LABELS, GROUP_STATUS_LABELS } from '../../constants/statuses'
import { formatMoney } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import StatusBadge from '../common/StatusBadge'

export default function GroupCard ({ group }) {
  const membership = group.membership
  const pending = membership?.status === 'pending'

  const body = (
    <>
      <div className='title-row'>
        <h2>{group.name}</h2>
        <StatusBadge status={group.status} labels={GROUP_STATUS_LABELS} />
      </div>
      <div className='title-row'>
        {pending ? (
          <StatusBadge
            status='pending'
            tone='warning'
            labels={{ pending: 'Awaiting approval' }}
          />
        ) : (
          membership && (
            <StatusBadge
              status={membership.role}
              labels={MEMBER_ROLE_LABELS}
              tone='neutral'
            />
          )
        )}
      </div>
      <dl className='detail-list'>
        <div>
          <dt>Contribution</dt>
          <dd>
            {formatMoney(group.contributionAmount)} ·{' '}
            {FREQUENCY_LABELS[group.frequency]}
          </dd>
        </div>
        <div>
          <dt>Members</dt>
          <dd>
            {group.memberCount} / {group.maxMembers}
          </dd>
        </div>
        <div>
          <dt>Pot</dt>
          <dd>{formatMoney(group.potAmount)}</dd>
        </div>
        <div>
          <dt>Starts</dt>
          <dd>{formatDate(group.startDate)}</dd>
        </div>
      </dl>
    </>
  )

  if (pending) {
    return <div className='card group-card'>{body}</div>
  }

  return (
    <Link to={groupPath(group.id)} className='card group-card group-card-link'>
      {body}
    </Link>
  )
}
