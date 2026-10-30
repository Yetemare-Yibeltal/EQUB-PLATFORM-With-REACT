import { useLanguage } from '../../hooks/useLanguage'

const TONES = {
  active: 'success',
  paid: 'success',
  success: 'success',
  completed: 'success',
  verified: 'success',
  approved: 'success',
  open: 'info',
  collecting: 'info',
  collected: 'info',
  pending: 'warning',
  late: 'warning',
  review: 'warning',
  overdue: 'danger',
  failed: 'danger',
  cancelled: 'danger',
  rejected: 'danger',
  removed: 'danger',
  suspended: 'danger',
  upcoming: 'neutral',
  waived: 'neutral',
  left: 'neutral'
}

const humanize = value =>
  String(value ?? '')
    .replace(/_/g, ' ')
    .replace(/^./, character => character.toUpperCase())

export default function StatusBadge ({ status, labels, tone }) {
  const { t } = useLanguage()
  const resolved = tone ?? TONES[status] ?? 'neutral'

  return (
    <span className={`status-badge status-badge-${resolved}`}>
      {t(labels?.[status] ?? humanize(status))}
    </span>
  )
}
