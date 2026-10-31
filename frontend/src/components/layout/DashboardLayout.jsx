import { Outlet } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import Footer from './Footer'
import MobileNav from './MobileNav'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function DashboardLayout () {
  const { t } = useLanguage()

  return (
    <div className='app-shell'>
      <a className='skip-link' href='#main-content'>
        {t('Skip to content')}
      </a>
      <Sidebar />
      <div className='app-main'>
        <Navbar />
        <main className='app-content' id='main-content'>
          <Outlet />
        </main>
        <Footer />
      </div>
      <MobileNav />
    </div>
  )
}
