import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import LanguageSwitcher from '../common/LanguageSwitcher'

export default function AuthLayout ({ title, subtitle, children, footer }) {
  const { t } = useLanguage()

  return (
    <div className='auth-page'>
      <div className='auth-card'>
        <div className='auth-top'>
          <Link to={ROUTES.HOME} className='brand auth-brand'>
            <span className='brand-mark'>K</span>
            <span className='brand-text'>
              <span>{t('brand.short')}</span>
              <small>{t('brand.group')}</small>
            </span>
          </Link>
          <LanguageSwitcher />
        </div>
        <h1>{title}</h1>
        {subtitle && <p className='muted'>{subtitle}</p>}
        {children}
        {footer && <div className='auth-footer'>{footer}</div>}
      </div>
    </div>
  )
}
