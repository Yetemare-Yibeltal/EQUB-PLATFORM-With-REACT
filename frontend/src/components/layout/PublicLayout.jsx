import { Link, Outlet } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import LanguageSwitcher from '../common/LanguageSwitcher'
import LegalLinks from '../common/LegalLinks'
import '../../styles/footer.css'
import '../../styles/legal.css'

export default function PublicLayout () {
  const { t } = useLanguage()

  return (
    <div className='public-shell'>
      <header className='public-header'>
        <Link to={ROUTES.HOME} className='public-brand'>
          <span className='site-footer-logo'>K</span>
          {t('brand.name')}
        </Link>
        <div className='public-actions'>
          <LanguageSwitcher />
          <Link to={ROUTES.HOME} className='btn btn-secondary btn-sm'>
            {t('Back to the platform')}
          </Link>
        </div>
      </header>

      <main className='public-main'>
        <Outlet />
      </main>

      <footer className='public-footer'>
        <LegalLinks />
        <p>
          {t('footer.rights', {
            year: new Date().getFullYear(),
            name: t('brand.name')
          })}
        </p>
      </footer>
    </div>
  )
}
