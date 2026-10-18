import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorMessage from '../../components/common/ErrorMessage'
import AuthLayout from '../../components/layout/AuthLayout'
import { ROUTES } from '../../constants/routes'
import { authService } from '../../services/authService'
import { getErrorMessage } from '../../utils/errors'

export default function VerifyEmail () {
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
      title='Email verification'
      subtitle='Confirming your email address'
      footer={
        <p>
          <Link to={ROUTES.DASHBOARD}>Continue to Equb Platform</Link>
        </p>
      }
    >
      <div className='form'>
        {status === 'loading' && (
          <p className='muted'>Verifying your email...</p>
        )}
        {status === 'success' && (
          <p className='alert alert-success' role='status'>
            Your email address has been verified.
          </p>
        )}
        {status === 'error' && <ErrorMessage message={message} />}
      </div>
    </AuthLayout>
  )
}
