import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import DisputeThread from '../../components/disputes/DisputeThread'
import { groupPath } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useGroup } from '../../hooks/useGroup'
import { useLanguage } from '../../hooks/useLanguage'
import { disputeService } from '../../services/disputeService'

export default function GroupDisputeDetail () {
  const { t } = useLanguage()
  const { disputeId } = useParams()
  const { group } = useGroup()

  const loader = useCallback(
    () => disputeService.get(group.id, disputeId),
    [group.id, disputeId]
  )
  const { data, loading, error, reload } = useAsyncData(loader)

  const handleComment = async body => {
    await disputeService.comment(group.id, disputeId, body)
    reload()
  }

  const handleDecide = async payload => {
    await disputeService.decide(group.id, disputeId, payload)
    reload()
  }

  return (
    <div className='stack'>
      <p>
        <Link to={groupPath(group.id, 'disputes')}>
          {t('Back to disputes')}
        </Link>
      </p>

      <ErrorMessage message={error} onRetry={reload} />
      {loading && !data && <Loader label='Loading dispute' />}

      {data && (
        <DisputeThread
          dispute={data}
          onComment={handleComment}
          onDecide={handleDecide}
        />
      )}
    </div>
  )
}
