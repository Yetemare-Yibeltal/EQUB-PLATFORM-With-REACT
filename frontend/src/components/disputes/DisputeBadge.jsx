import { DISPUTE_STATUS_LABELS } from '../../constants/disputes'
import StatusBadge from '../common/StatusBadge'

const TONES = {
  open: 'info',
  in_review: 'warning',
  resolved: 'success',
  dismissed: 'neutral'
}

export default function DisputeBadge ({ status }) {
  return (
    <StatusBadge
      status={status}
      labels={DISPUTE_STATUS_LABELS}
      tone={TONES[status]}
    />
  )
}
