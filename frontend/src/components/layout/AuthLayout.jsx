import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function AuthLayout ({ title, subtitle, children, footer }) {
  return (
    <div className='auth-page'>
      <div className='auth-card'>
        <Link to={ROUTES.HOME} className='brand auth-brand'>
          <span className='brand-mark'>E</span>
          <span>Equb Platform</span>
        </Link>
        <h1>{title}</h1>
        {subtitle && <p className='muted'>{subtitle}</p>}
        {children}
        {footer && <div className='auth-footer'>{footer}</div>}
      </div>
    </div>
  )
}
