import { CYCLE_STATUS_LABELS } from '../../constants/statuses'

export default function CycleTimeline ({ cycles, selectedId, onSelect }) {
  return (
    <div className='cycle-chips' role='tablist' aria-label='Cycles'>
      {cycles.map(cycle => (
        <button
          key={cycle.id}
          type='button'
          role='tab'
          aria-selected={cycle.id === selectedId}
          className={
            cycle.id === selectedId ? 'cycle-chip active' : 'cycle-chip'
          }
          onClick={() => onSelect(cycle.id)}
        >
          <span className='cycle-chip-number'>Cycle {cycle.number}</span>
          <span className='cycle-chip-status'>
            {CYCLE_STATUS_LABELS[cycle.status]}
          </span>
        </button>
      ))}
    </div>
  )
}
