import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import { authService } from '../../services/authService'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import { validateIdentifier } from '../../utils/validators'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'
import Input from '../common/Input'

export default function ForgotPasswordForm () {
  const { t } = useLanguage()
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async event => {
    event.preventDefault()

    const validation = validateIdentifier(identifier)
    setError(validation)
    if (validation) return

    setSubmitting(true)
    setSubmitError('')

    try {
      setResult(
        await authService.forgotPassword({ identifier: identifier.trim() })
      )
    } catch (requestError) {
      setError(getFieldErrors(requestError).identifier || '')
      setSubmitError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className='form'>
        <p className='alert alert-success' role='status'>
          {t(result.message)}
        </p>
        <p className='muted'>
          {t(
            'If your account has an email address, check your inbox for a reset link. The link expires in 15 minutes.'
          )}
        </p>
        {result.resetToken && (
          <p className='alert alert-info'>
            Development mode:{' '}
            <Link to={`${ROUTES.RESET_PASSWORD}?token=${result.resetToken}`}>
              continue to reset your password
            </Link>
          </p>
        )}
        <Link to={ROUTES.LOGIN}>{t('Back to log in')}</Link>
      </div>
    )
  }

  return (
    <form className='form' onSubmit={handleSubmit} noValidate>
      <ErrorMessage message={t(submitError)} />
      <Input
        label={t('Phone number or email')}
        name='identifier'
        autoComplete='username'
        value={identifier}
        onChange={event => {
          setIdentifier(event.target.value)
          setError('')
        }}
        error={t(error)}
        required
      />
      <Button type='submit' fullWidth loading={submitting}>
        {t('Send reset link')}
      </Button>
    </form>
  )
}
