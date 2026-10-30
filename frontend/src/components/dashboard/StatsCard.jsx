import { useLanguage } from '../../hooks/useLanguage'

export default function StatsCard ({ label, value, hint, tone = 'neutral' }) {
  const { t } = useLanguage()

  return (
    <div className={`stats-card stats-${tone}`}>
      <p className='stats-label'>{t(label)}</p>
      <p className='stats-value'>{value}</p>
      {hint && <p className='stats-hint'>{t(hint)}</p>}
    </div>
  )
}
