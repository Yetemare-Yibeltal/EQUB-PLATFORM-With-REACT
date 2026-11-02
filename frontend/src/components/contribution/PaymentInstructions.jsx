import {
  PAYMENT_ACCOUNTS,
  PAYMENT_ACCOUNT_HOLDER
} from '../../constants/mahber'
import { useLanguage } from '../../hooks/useLanguage'

export default function PaymentInstructions () {
  const { t } = useLanguage()

  return (
    <section aria-label={t('How to pay')}>
      <h3>{t('How to pay')}</h3>
      <p className='muted'>
        {t(
          'Pay only to the mahber account below, then send the transaction reference for approval.'
        )}
      </p>
      <dl className='detail-list'>
        {PAYMENT_ACCOUNTS.map(account => (
          <div key={account.method}>
            <dt>{t(account.label)}</dt>
            <dd>
              <strong>{account.number}</strong>
            </dd>
          </div>
        ))}
        <div>
          <dt>{t('Account holder')}</dt>
          <dd>{PAYMENT_ACCOUNT_HOLDER}</dd>
        </div>
      </dl>
    </section>
  )
}