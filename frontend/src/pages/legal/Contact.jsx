import { CONTACT } from '../../constants/legal'
import { useLanguage } from '../../hooks/useLanguage'
import '../../styles/legal.css'

const FIELDS = [
  {
    key: 'phone',
    label: 'Phone',
    href: value => `tel:${value.replace(/\s+/g, '')}`
  },
  { key: 'email', label: 'Email', href: value => `mailto:${value}` },
  {
    key: 'telegram',
    label: 'Telegram',
    href: value =>
      value.startsWith('http')
        ? value
        : `https://t.me/${value.replace(/^@/, '')}`
  },
  { key: 'address', label: 'Address' },
  { key: 'hours', label: 'Office hours' }
]

export default function Contact () {
  const { t } = useLanguage()
  const entries = FIELDS.filter(field => CONTACT[field.key])

  return (
    <article className='legal-doc'>
      <header>
        <h1>{t('Contact us')}</h1>
        <p>{t('Reach the Mahber through any of the ways below.')}</p>
      </header>

      {entries.length === 0 ? (
        <p className='alert alert-info'>
          {t(
            'Contact details will be published here soon. Until then, please ask the organizer of your equb.'
          )}
        </p>
      ) : (
        <section className='card'>
          <dl className='detail-list'>
            {entries.map(field => (
              <div key={field.key}>
                <dt>{t(field.label)}</dt>
                <dd>
                  {field.href ? (
                    <a
                      href={field.href(CONTACT[field.key])}
                      rel='noopener noreferrer'
                    >
                      {CONTACT[field.key]}
                    </a>
                  ) : (
                    CONTACT[field.key]
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <p className='muted'>
        {t(
          'For help with an account or a payment, include your phone number and the payment reference.'
        )}
      </p>
    </article>
  )
}
