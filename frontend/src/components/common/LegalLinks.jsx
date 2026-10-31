import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import '../../styles/legal.css'

export default function LegalLinks () {
  const { t } = useLanguage()

  const links = [
    { to: ROUTES.TERMS, label: t('Terms of use') },
    { to: ROUTES.PRIVACY, label: t('Privacy policy') },
    { to: ROUTES.CONTACT, label: t('Contact') }
  ]

  return (
    <ul className='site-footer-legal'>
      {links.map(link => (
        <li key={link.to}>
          <Link to={link.to}>{link.label}</Link>
        </li>
      ))}
    </ul>
  )
}
