import { NavLink, Outlet } from 'react-router-dom'
import { ADMIN_TABS } from '../../constants/navigation'
import { useLanguage } from '../../hooks/useLanguage'

export default function AdminLayout () {
  const { t } = useLanguage()

  return (
    <div className='page'>
      <header className='page-header'>
        <h1>{t('Administration')}</h1>
        <p className='muted'>
          {t('Platform oversight, payments review, audit trail, and jobs')}
        </p>
      </header>
      <nav className='tabs' aria-label={t('Administration sections')}>
        {ADMIN_TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          >
            {t(tab.label)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
