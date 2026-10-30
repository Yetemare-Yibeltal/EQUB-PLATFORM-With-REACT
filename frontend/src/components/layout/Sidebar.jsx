import { Link, NavLink } from 'react-router-dom'
import { ADMIN_NAV_ITEM, NAV_ITEMS } from '../../constants/navigation'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import Icon from '../common/Icon'

export default function Sidebar () {
  const { isAdmin } = useAuth()
  const { t } = useLanguage()
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS

  return (
    <aside className='sidebar'>
      <Link to={ROUTES.DASHBOARD} className='brand'>
        <span className='brand-mark'>K</span>
        <span className='brand-text'>
          <span>{t('brand.short')}</span>
          <small>{t('brand.group')}</small>
        </span>
      </Link>
      <nav aria-label={t('nav.main')}>
        <ul className='nav-list'>
          {items.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                <Icon name={item.icon} />
                <span>{t(item.label)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
