import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import {
  hasErrors,
  validateFullName,
  validateOptionalEmail,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone
} from '../../utils/validators'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'
import Input from '../common/Input'

const INITIAL_VALUES = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: ''
}

const TERMS_MARK = '[[terms]]'
const PRIVACY_MARK = '[[privacy]]'

export default function SignupForm () {
  const { register } = useAuth()
  const { t } = useLanguage()
  const [values, setValues] = useState(INITIAL_VALUES)
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
      fullName: validateFullName(values.fullName),
      phone: validatePhone(values.phone),
      email: validateOptionalEmail(values.email),
      password: validatePassword(values.password),
      confirmPassword: validatePasswordConfirmation(
        values.password,
        values.confirmPassword
      )
    }

    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSubmitting(true)
    setSubmitError('')

    const email = values.email.trim()

    try {
      await register({
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        password: values.password,
        ...(email ? { email } : {})
      })
    } catch (error) {
      setErrors(getFieldErrors(error))
      setSubmitError(getErrorMessage(error))
      setSubmitting(false)
    }
  }

  const consent = t(
    'By creating an account you accept the {terms} and the {privacy}.',
    { terms: TERMS_MARK, privacy: PRIVACY_MARK }
  )
    .split(/(\[\[terms\]\]|\[\[privacy\]\])/)
    .map((part, index) => {
      if (part === TERMS_MARK) {
        return (
          <Link
            key={index}
            to={ROUTES.TERMS}
            target='_blank'
            rel='noopener noreferrer'
          >
            {t('Terms of use')}
          </Link>
        )
      }

      if (part === PRIVACY_MARK) {
        return (
          <Link
            key={index}
            to={ROUTES.PRIVACY}
            target='_blank'
            rel='noopener noreferrer'
          >
            {t('Privacy policy')}
          </Link>
        )
      }

      return part
    })

  return (
    <form className='form' onSubmit={handleSubmit} noValidate>
      <ErrorMessage message={t(submitError)} />
      <Input
        label={t('Full name')}
        name='fullName'
        autoComplete='name'
        value={values.fullName}
        onChange={handleChange}
        error={t(errors.fullName)}
        required
      />
      <Input
        label={t('Phone number')}
        name='phone'
        type='tel'
        autoComplete='tel'
        placeholder='0911223344'
        hint={t(
          'Ethiopian mobile number, for example 0911223344 or +251911223344'
        )}
        value={values.phone}
        onChange={handleChange}
        error={t(errors.phone)}
        required
      />
      <Input
        label={t('Email (recommended)')}
        name='email'
        type='email'
        autoComplete='email'
        hint={t(
          'Needed to reset your password by email and to receive account messages'
        )}
        value={values.email}
        onChange={handleChange}
        error={t(errors.email)}
      />
      <Input
        label={t('Password')}
        name='password'
        type='password'
        autoComplete='new-password'
        hint={t('At least 8 characters with a letter and a number')}
        value={values.password}
        onChange={handleChange}
        error={t(errors.password)}
        required
      />
      <Input
        label={t('Confirm password')}
        name='confirmPassword'
        type='password'
        autoComplete='new-password'
        value={values.confirmPassword}
        onChange={handleChange}
        error={t(errors.confirmPassword)}
        required
      />
      <Button type='submit' fullWidth loading={submitting}>
        {t('Create account')}
      </Button>
      <p className='field-hint'>{consent}</p>
    </form>
  )
}
