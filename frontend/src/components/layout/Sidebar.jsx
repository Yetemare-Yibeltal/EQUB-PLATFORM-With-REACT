import { Link, NavLink } from 'react-router-dom'
import { ADMIN_NAV_ITEM, NAV_ITEMS } from '../../constants/navigation'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import Icon from '../common/Icon'

export default function Sidebar () {
  const { isAdmin } = useAuth()
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS

  return (
    <aside className='sidebar'>
      <Link to={ROUTES.DASHBOARD} className='brand'>
        <span className='brand-mark'>E</span>
        <span>Equb Platform</span>
      </Link>
      <nav aria-label='Main navigation'>
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
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
