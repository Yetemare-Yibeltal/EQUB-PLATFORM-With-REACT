import { NavLink } from 'react-router-dom'
import { ADMIN_NAV_ITEM, NAV_ITEMS } from '../../constants/navigation'
import { useAuth } from '../../hooks/useAuth'
import Icon from '../common/Icon'

export default function MobileNav () {
  const { isAdmin } = useAuth()
  const items = NAV_ITEMS.filter(item => item.mobile)

  if (isAdmin) items.push(ADMIN_NAV_ITEM)

  return (
    <nav className='mobile-nav' aria-label='Main navigation'>
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive ? 'mobile-link active' : 'mobile-link'
          }
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
