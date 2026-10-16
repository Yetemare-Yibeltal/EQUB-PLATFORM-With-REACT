import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import ReasonModal from '../../components/common/ReasonModal'
import GroupForm from '../../components/group/GroupForm'
import { ROUTES, groupPath } from '../../constants/routes'
import { useGroup } from '../../hooks/useGroup'
import { groupService } from '../../services/groupService'

export default function GroupSettings () {
  const navigate = useNavigate()
  const { group, isOrganizer, refresh } = useGroup()
  const [notice, setNotice] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!isOrganizer) {
    return <Navigate to={groupPath(group.id)} replace />
  }

  const isOpen = group.status === 'open'

  const handleUpdate = async payload => {
    await groupService.update(group.id, payload)
    setNotice('Changes saved')
    refresh()
  }

  const handleCancel = async reason => {
    await groupService.cancel(group.id, reason)
    navigate(ROUTES.GROUPS, { replace: true })
  }

  return (
    <div className='stack'>
      {notice && (
        <p className='alert alert-success' role='status'>
          {notice}
        </p>
      )}

      <section className='card'>
        <h2>Group settings</h2>
        {isOpen ? (
          <GroupForm
            key={group.updatedAt}
            group={group}
            onSubmit={handleUpdate}
            submitLabel='Save changes'
          />
        ) : (
          <p className='muted'>
            Settings can only be changed while the group is open.
          </p>
        )}
      </section>

      {isOpen && (
        <section className='card'>
          <h2>Cancel this equb</h2>
          <p className='muted'>
            Cancelling stops the group before it starts. Members are notified
            and pending requests are rejected. This cannot be undone.
          </p>
          <div>
            <Button variant='danger' onClick={() => setCancelOpen(true)}>
              Cancel equb
            </Button>
          </div>
        </section>
      )}

      <ReasonModal
        open={cancelOpen}
        title='Cancel this equb?'
        description='Members will see the reason you give.'
        label='Reason (optional)'
        required={false}
        submitLabel='Cancel equb'
        variant='danger'
        onSubmit={handleCancel}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  )
}
