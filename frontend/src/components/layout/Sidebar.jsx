import { Link, NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../../constants/navigation'
import { ROUTES } from '../../constants/routes'
import Icon from '../common/Icon'

export default function Sidebar () {
  return (
    <aside className='sidebar'>
      <Link to={ROUTES.DASHBOARD} className='brand'>
        <span className='brand-mark'>E</span>
        <span>Equb Platform</span>
      </Link>
      <nav aria-label='Main navigation'>
        <ul className='nav-list'>
          {NAV_ITEMS.map(item => (
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
