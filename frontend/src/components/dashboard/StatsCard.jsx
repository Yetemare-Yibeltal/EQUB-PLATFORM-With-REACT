export default function StatsCard ({ label, value, hint, tone = 'neutral' }) {
  return (
    <div className={`stats-card stats-${tone}`}>
      <p className='stats-label'>{label}</p>
      <p className='stats-value'>{value}</p>
      {hint && <p className='stats-hint'>{hint}</p>}
    </div>
  )
}
