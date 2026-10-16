import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../../constants/navigation'
import Icon from '../common/Icon'

export default function MobileNav () {
  return (
    <nav className='mobile-nav' aria-label='Main navigation'>
      {NAV_ITEMS.map(item => (
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
