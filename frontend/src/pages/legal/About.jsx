import { Link } from 'react-router-dom'
import { COMMITTEE, MAHBER } from '../../constants/mahber'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import '../../styles/legal.css'
import '../../styles/about.css'

export default function About () {
  const { language, t } = useLanguage()

  return (
    <article className='legal-doc'>
      <header className='about-hero'>
        <img
          className='about-logo'
          src={MAHBER.logo}
          width='160'
          height='160'
          alt={t('Kidane Mihret Equb Mahber logo')}
        />
        <h1>{language === 'am' ? MAHBER.nameAm : MAHBER.name}</h1>
        <p className='about-motto'>{t('Faith · Unity · Service')}</p>
      </header>

      <section className='card'>
        <h2>{t('About the Mahber')}</h2>
        <p>
          {t(
            'Kidane Mihret Equb Mahber is a community equb run by its committee. Members save together in turns, and every contribution, draw and payout is recorded openly on this platform so that everyone can see how the equb is going.'
          )}
        </p>
      </section>

      <section className='card'>
        <h2>{t('Committee')}</h2>
        <ul className='committee-list'>
          {COMMITTEE.map(member => (
            <li key={member.name}>
              <strong>{member.name}</strong>
              <span className='muted'>{t(member.role)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className='card'>
        <h2>{t('Rules and contact')}</h2>
        <div className='about-links'>
          <Link to={ROUTES.HELP}>{t('How to use the platform')}</Link>
          <Link to={ROUTES.RULES}>{t('Read the rules and regulations')}</Link>
          <Link to={ROUTES.CONTACT}>{t('Contact the Mahber')}</Link>
        </div>
      </section>
    </article>
  )
}
