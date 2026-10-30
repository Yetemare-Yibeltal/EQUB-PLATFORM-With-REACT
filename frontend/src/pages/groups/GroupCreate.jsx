import { Link, useNavigate } from 'react-router-dom'
import GroupForm from '../../components/group/GroupForm'
import { ROUTES, groupPath } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import { groupService } from '../../services/groupService'

export default function GroupCreate () {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleSubmit = async payload => {
    const group = await groupService.create(payload)
    navigate(groupPath(group.id))
  }

  return (
    <div className='page'>
      <header className='page-header'>
        <p>
          <Link to={ROUTES.GROUPS}>{t('My equbs')}</Link>
        </p>
        <h1>{t('Create an equb')}</h1>
        <p className='muted'>
          {t('You become the organizer and the first member')}
        </p>
      </header>
      <section className='card'>
        <GroupForm onSubmit={handleSubmit} submitLabel={t('Create equb')} />
      </section>
    </div>
  )
}
