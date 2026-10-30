import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import { hasErrors, validateIdentifier } from '../../utils/validators'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'
import Input from '../common/Input'

export default function LoginForm () {
  const { login } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [values, setValues] = useState({ identifier: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const notice = location.state?.notice

  const handleChange = event => {
    const { name, value } = event.target
    setValues(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: '' }))
  }

  const handleSubmit = async event => {
    event.preventDefault()

    const nextErrors = {
      identifier: validateIdentifier(values.identifier),
      password: values.password ? '' : 'Password is required'
    }

    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSubmitting(true)
    setSubmitError('')

    try {
      await login({
        identifier: values.identifier.trim(),
        password: values.password
      })
    } catch (error) {
      setErrors(getFieldErrors(error))
      setSubmitError(getErrorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <form className='form' onSubmit={handleSubmit} noValidate>
      {notice && (
        <p className='alert alert-success' role='status'>
          {t(notice)}
        </p>
      )}
      <ErrorMessage message={t(submitError)} />
      <Input
        label={t('Phone number or email')}
        name='identifier'
        autoComplete='username'
        placeholder='0911223344'
        value={values.identifier}
        onChange={handleChange}
        error={t(errors.identifier)}
        required
      />
      <Input
        label={t('Password')}
        name='password'
        type='password'
        autoComplete='current-password'
        value={values.password}
        onChange={handleChange}
        error={t(errors.password)}
        required
      />
      <div className='form-row'>
        <Link to={ROUTES.FORGOT_PASSWORD}>{t('Forgot password?')}</Link>
      </div>
      <Button type='submit' fullWidth loading={submitting}>
        {t('Log in')}
      </Button>
    </form>
  )
}
