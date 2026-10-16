import { NavLink, Outlet } from 'react-router-dom'
import { ADMIN_TABS } from '../../constants/navigation'

export default function AdminLayout () {
  return (
    <div className='page'>
      <header className='page-header'>
        <h1>Administration</h1>
        <p className='muted'>
          Platform oversight, payments review, audit trail, and jobs
        </p>
      </header>
      <nav className='tabs' aria-label='Administration sections'>
        {ADMIN_TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
