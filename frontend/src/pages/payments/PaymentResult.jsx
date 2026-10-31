import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import ErrorMessage from '../../components/common/ErrorMessage'
import Loader from '../../components/common/Loader'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import { paymentService } from '../../services/paymentService'
import { getErrorMessage } from '../../utils/errors'
import { formatMoney } from '../../utils/formatCurrency'

const MAX_ATTEMPTS = 10
const RETRY_DELAY_MS = 3000

export default function PaymentResult () {
  const { txRef } = useParams()
  const { t } = useLanguage()
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [round, setRound] = useState(0)

  useEffect(() => {
    let active = true
    let timer = null

    const check = async attempt => {
      try {
        const result = await paymentService.verify(txRef)

        if (!active) return

        setPayment(result)
        setError('')

        if (result.status === 'pending' && attempt < MAX_ATTEMPTS) {
          timer = setTimeout(() => check(attempt + 1), RETRY_DELAY_MS)
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      }
    }

    check(1)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [txRef, round])

  if (!payment && !error) {
    return <Loader label='Confirming your payment' />
  }

  return (
    <div className='page'>
      <section className='card result-card'>
        <ErrorMessage
          message={error}
          onRetry={() => setRound(current => current + 1)}
        />

        {payment?.status === 'success' && (
          <>
            <h1>{t('Payment received')}</h1>
            <p>
              {t(
                'Your payment of {amount} was confirmed and your contribution is marked as paid.',
                { amount: formatMoney(payment.amount) }
              )}
            </p>
          </>
        )}

        {payment?.status === 'pending' && (
          <>
            <h1>{t('Waiting for confirmation')}</h1>
            <p className='muted'>
              {t(
                'The payment provider has not confirmed this payment yet. This page checks again automatically.'
              )}
            </p>
            <div>
              <Button
                variant='secondary'
                onClick={() => setRound(current => current + 1)}
              >
                {t('Check again')}
              </Button>
            </div>
          </>
        )}

        {payment?.status === 'failed' && payment.requiresReview && (
          <>
            <h1>{t('Payment needs review')}</h1>
            <p>
              {t(
                'We received your payment but could not apply it automatically. An administrator will review it. Keep this reference:'
              )}{' '}
              <code className='code-inline'>{payment.txRef}</code>
            </p>
          </>
        )}

        {payment?.status === 'failed' && !payment.requiresReview && (
          <>
            <h1>{t('Payment not completed')}</h1>
            <p>
              {t(
                payment.failureReason || 'The payment was cancelled or failed.'
              )}{' '}
              {t('You can start a new payment from your contributions.')}
            </p>
          </>
        )}

        <div className='inline-actions'>
          <Link to={ROUTES.CONTRIBUTIONS} className='btn btn-primary btn-md'>
            {t('My contributions')}
          </Link>
          <Link to={ROUTES.PAYMENTS} className='btn btn-secondary btn-md'>
            {t('My payments')}
          </Link>
        </div>
      </section>
    </div>
  )
}
