import { NavLink } from 'react-router-dom'
import { ADMIN_NAV_ITEM, NAV_ITEMS } from '../../constants/navigation'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import Icon from '../common/Icon'

export default function MobileNav () {
  const { isAdmin } = useAuth()
  const { t } = useLanguage()
  const items = NAV_ITEMS.filter(item => item.mobile)

  if (isAdmin) items.push(ADMIN_NAV_ITEM)

  return (
    <nav className='mobile-nav' aria-label={t('nav.main')}>
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive ? 'mobile-link active' : 'mobile-link'
          }
        >
          <Icon name={item.icon} />
          <span>{t(item.label)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
