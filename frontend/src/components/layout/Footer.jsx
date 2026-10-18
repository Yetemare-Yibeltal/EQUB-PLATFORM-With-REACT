import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import '../../styles/footer.css'

const platformLinks = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD },
  { label: 'My equbs', to: ROUTES.GROUPS },
  { label: 'Create an equb', to: ROUTES.GROUP_CREATE },
  { label: 'Join an equb', to: ROUTES.GROUP_JOIN }
]

const moneyLinks = [
  { label: 'Contributions', to: ROUTES.CONTRIBUTIONS },
  { label: 'Payments', to: ROUTES.PAYMENTS },
  { label: 'Payouts', to: ROUTES.PAYOUTS }
]

const accountLinks = [
  { label: 'Profile', to: ROUTES.PROFILE },
  { label: 'Settings', to: ROUTES.SETTINGS },
  { label: 'Notifications', to: ROUTES.NOTIFICATIONS }
]

const steps = [
  'Members join an equb and agree on the contribution.',
  'Everyone contributes in every cycle.',
  'A verifiable draw picks the recipient, who receives the payout.'
]

function LinkColumn ({ title, links }) {
  return (
    <nav aria-label={title}>
      <h3 className='site-footer-title'>{title}</h3>
      <ul className='site-footer-list'>
        {links.map((item) => (
          <li key={item.label}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Footer () {
  return (
    <footer className='site-footer'>
      <div className='site-footer-inner'>
        <div className='site-footer-grid'>
          <div className='site-footer-intro'>
            <Link to={ROUTES.DASHBOARD} className='site-footer-brand'>
              <span className='site-footer-logo'>E</span>
              Equb Platform
            </Link>
            <p className='site-footer-about'>
              A digital platform for rotating savings groups. Create an equb,
              collect contributions, run a verifiable draw and pay out members,
              with every step recorded.
            </p>
          </div>

          <LinkColumn title='Platform' links={platformLinks} />
          <LinkColumn title='Money' links={moneyLinks} />
          <LinkColumn title='Account' links={accountLinks} />

          <div>
            <h3 className='site-footer-title'>How it works</h3>
            <ol className='site-footer-steps'>
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className='site-footer-bottom'>
          <p>© {new Date().getFullYear()} Equb Platform. All rights reserved.</p>
          <p>All amounts are shown in Ethiopian Birr (ETB).</p>
        </div>
      </div>
    </footer>
  )
}