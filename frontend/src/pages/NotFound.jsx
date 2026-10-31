import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useLanguage } from '../hooks/useLanguage'

export default function NotFound () {
  const { t } = useLanguage()

  return (
    <div className='center-screen'>
      <div className='not-found'>
        <p className='not-found-code'>404</p>
        <h1>{t('Page not found')}</h1>
        <p className='muted'>
          {t('The page you are looking for does not exist or has moved.')}
        </p>
        <Link to={ROUTES.HOME} className='btn btn-primary btn-md'>
          {t('Back to home')}
        </Link>
      </div>
    </div>
  )
}
