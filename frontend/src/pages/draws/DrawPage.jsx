import { useCallback, useState } from 'react'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import DrawCard from '../../components/draw/DrawCard'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useGroup } from '../../hooks/useGroup'
import { useLanguage } from '../../hooks/useLanguage'
import { cycleService } from '../../services/cycleService'
import { drawService } from '../../services/drawService'
import { getErrorMessage } from '../../utils/errors'
import { formatMoney } from '../../utils/formatCurrency'

export default function DrawPage () {
  const { t } = useLanguage()
  const { group, isOrganizer, version, refresh } = useGroup()
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')

  const cyclesLoader = useCallback(
    () => cycleService.list(group.id),
    [group.id, version]
  )
  const { data: cycles, error: cyclesError } = useAsyncData(cyclesLoader)

  const drawsLoader = useCallback(
    () => drawService.list(group.id, { limit: 100 }),
    [group.id, version]
  )
  const { data: draws, loading, error, reload } = useAsyncData(drawsLoader)

  const awaiting = (cycles ?? []).filter(
    cycle => cycle.status === 'collected' && !cycle.recipient
  )

  const handlePerform = async () => {
    setBusy(true)
    setActionError('')
    setNotice('')

    try {
      const result = await drawService.perform(group.id, target.id)
      setNotice(
        t(
          '{name} won the cycle {number} draw. Record the payout from the Payouts tab.',
          {
            name: result.draw.winnerUser?.fullName ?? t('A member'),
            number: result.draw.cycleNumber
          }
        )
      )
      refresh()
    } catch (requestError) {
      setActionError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
      setTarget(null)
    }
  }

  if (loading && !draws) return <Loader label='Loading draws' />

  return (
    <div className='stack'>
      {notice && (
        <p className='alert alert-success' role='status'>
          {notice}
        </p>
      )}
      <ErrorMessage message={error} onRetry={reload} />
      <ErrorMessage message={cyclesError} />
      <ErrorMessage message={actionError} />

      {awaiting.map(cycle => (
        <section key={cycle.id} className='card'>
          <h2>
            {t('Cycle {number} is ready for the draw', {
              number: cycle.number
            })}
          </h2>
          <p>
            {t('Every contribution is in. The winner receives {amount}.', {
              amount: formatMoney(cycle.collectedAmount)
            })}
          </p>
          {isOrganizer ? (
            <div>
              <Button onClick={() => setTarget(cycle)}>
                {t('Perform draw')}
              </Button>
            </div>
          ) : (
            <p className='muted'>{t('The organizer performs the draw.')}</p>
          )}
        </section>
      ))}

      {draws && draws.draws.length === 0 && awaiting.length === 0 && (
        <EmptyState
          title='No draws yet'
          description='A draw becomes available once every contribution for a cycle is paid or waived.'
        />
      )}

      {draws?.draws.map(draw => (
        <DrawCard key={draw.id} draw={draw} />
      ))}

      <ConfirmDialog
        open={Boolean(target)}
        title={t('Perform the cycle {number} draw?', {
          number: target?.number ?? ''
        })}
        message='The winner is chosen by the server from members who have not received a payout yet. This cannot be repeated or undone.'
        confirmLabel='Perform draw'
        loading={busy}
        onConfirm={handlePerform}
        onCancel={() => setTarget(null)}
      />
    </div>
  )
}
