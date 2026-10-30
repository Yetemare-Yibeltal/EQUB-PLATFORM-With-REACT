import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import '../../styles/footer.css'

function LinkColumn ({ title, links }) {
  return (
    <nav aria-label={title}>
      <h3 className='site-footer-title'>{title}</h3>
      <ul className='site-footer-list'>
        {links.map(item => (
          <li key={item.to}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Footer () {
  const { t } = useLanguage()

  const platformLinks = [
    { label: t('nav.dashboard'), to: ROUTES.DASHBOARD },
    { label: t('nav.groups'), to: ROUTES.GROUPS },
    { label: t('footer.createEqub'), to: ROUTES.GROUP_CREATE },
    { label: t('footer.joinEqub'), to: ROUTES.GROUP_JOIN }
  ]

  const moneyLinks = [
    { label: t('nav.contributions'), to: ROUTES.CONTRIBUTIONS },
    { label: t('nav.payments'), to: ROUTES.PAYMENTS },
    { label: t('nav.payouts'), to: ROUTES.PAYOUTS }
  ]

  const accountLinks = [
    { label: t('nav.profile'), to: ROUTES.PROFILE },
    { label: t('nav.settings'), to: ROUTES.SETTINGS },
    { label: t('nav.notifications'), to: ROUTES.NOTIFICATIONS }
  ]

  const steps = ['footer.step1', 'footer.step2', 'footer.step3']

  return (
    <footer className='site-footer'>
      <div className='site-footer-inner'>
        <div className='site-footer-grid'>
          <div className='site-footer-intro'>
            <Link to={ROUTES.DASHBOARD} className='site-footer-brand'>
              <span className='site-footer-logo'>K</span>
              {t('brand.name')}
            </Link>
            <p className='site-footer-about'>{t('footer.about')}</p>
          </div>

          <LinkColumn title={t('footer.platform')} links={platformLinks} />
          <LinkColumn title={t('footer.money')} links={moneyLinks} />
          <LinkColumn title={t('footer.account')} links={accountLinks} />

          <div>
            <h3 className='site-footer-title'>{t('footer.howItWorks')}</h3>
            <ol className='site-footer-steps'>
              {steps.map(step => (
                <li key={step}>{t(step)}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className='site-footer-bottom'>
          <p>
            {t('footer.rights', {
              year: new Date().getFullYear(),
              name: t('brand.name')
            })}
          </p>
          <p>{t('footer.currency')}</p>
        </div>
      </div>
    </footer>
  )
}
