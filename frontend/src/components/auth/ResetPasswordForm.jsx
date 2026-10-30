import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'
import { authService } from '../../services/authService'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import {
  hasErrors,
  validatePassword,
  validatePasswordConfirmation,
  validateResetToken
} from '../../utils/validators'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'
import Input from '../common/Input'

export default function ResetPasswordForm () {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [values, setValues] = useState({
    token: searchParams.get('token') ?? '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = event => {
    const { name, value } = event.target
    setValues(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: '' }))
  }

  const handleSubmit = async event => {
    event.preventDefault()

    const nextErrors = {
      token: validateResetToken(values.token),
      newPassword: validatePassword(values.newPassword),
      confirmPassword: validatePasswordConfirmation(
        values.newPassword,
        values.confirmPassword
      )
    }

    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSubmitting(true)
    setSubmitError('')

    try {
      await authService.resetPassword({
        token: values.token.trim(),
        newPassword: values.newPassword
      })
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: {
          notice: 'Your password has been reset, log in with the new password'
        }
      })
    } catch (error) {
      setErrors(getFieldErrors(error))
      setSubmitError(getErrorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <form className='form' onSubmit={handleSubmit} noValidate>
      <ErrorMessage message={t(submitError)} />
      <Input
        label={t('Reset code')}
        name='token'
        autoComplete='one-time-code'
        value={values.token}
        onChange={handleChange}
        error={t(errors.token)}
        required
      />
      <Input
        label={t('New password')}
        name='newPassword'
        type='password'
        autoComplete='new-password'
        hint={t('At least 8 characters with a letter and a number')}
        value={values.newPassword}
        onChange={handleChange}
        error={t(errors.newPassword)}
        required
      />
      <Input
        label={t('Confirm new password')}
        name='confirmPassword'
        type='password'
        autoComplete='new-password'
        value={values.confirmPassword}
        onChange={handleChange}
        error={t(errors.confirmPassword)}
        required
      />
      <Button type='submit' fullWidth loading={submitting}>
        {t('Reset password')}
      </Button>
    </form>
  )
}
