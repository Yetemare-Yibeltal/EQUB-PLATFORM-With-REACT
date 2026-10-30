import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorMessage from '../../components/common/ErrorMessage'
import AuthLayout from '../../components/layout/AuthLayout'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import { authService } from '../../services/authService'
import { getErrorMessage } from '../../utils/errors'

export default function VerifyEmail () {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState(token ? 'loading' : 'error')
  const [message, setMessage] = useState(
    token ? '' : 'This verification link is incomplete'
  )
  const requested = useRef(false)

  useEffect(() => {
    if (!token || requested.current) return
    requested.current = true

    authService
      .verifyEmail({ token })
      .then(() => setStatus('success'))
      .catch(error => {
        setMessage(getErrorMessage(error))
        setStatus('error')
      })
  }, [token])

  return (
    <AuthLayout
      title={t('Email verification')}
      subtitle={t('Confirming your email address')}
      footer={
        <p>
          <Link to={ROUTES.DASHBOARD}>{t('common.continue')}</Link>
        </p>
      }
    >
      <div className='form'>
        {status === 'loading' && (
          <p className='muted'>{t('Verifying your email...')}</p>
        )}
        {status === 'success' && (
          <p className='alert alert-success' role='status'>
            {t('Your email address has been verified.')}
          </p>
        )}
        {status === 'error' && <ErrorMessage message={t(message)} />}
      </div>
    </AuthLayout>
  )
}
