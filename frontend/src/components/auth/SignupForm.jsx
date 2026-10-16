import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
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

export default function SignupForm () {
  const { register } = useAuth()
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

  return (
    <form className='form' onSubmit={handleSubmit} noValidate>
      <ErrorMessage message={submitError} />
      <Input
        label='Full name'
        name='fullName'
        autoComplete='name'
        value={values.fullName}
        onChange={handleChange}
        error={errors.fullName}
        required
      />
      <Input
        label='Phone number'
        name='phone'
        type='tel'
        autoComplete='tel'
        placeholder='0911223344'
        hint='Ethiopian mobile number, for example 0911223344 or +251911223344'
        value={values.phone}
        onChange={handleChange}
        error={errors.phone}
        required
      />
      <Input
        label='Email (optional)'
        name='email'
        type='email'
        autoComplete='email'
        value={values.email}
        onChange={handleChange}
        error={errors.email}
      />
      <Input
        label='Password'
        name='password'
        type='password'
        autoComplete='new-password'
        hint='At least 8 characters with a letter and a number'
        value={values.password}
        onChange={handleChange}
        error={errors.password}
        required
      />
      <Input
        label='Confirm password'
        name='confirmPassword'
        type='password'
        autoComplete='new-password'
        value={values.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        required
      />
      <Button type='submit' fullWidth loading={submitting}>
        Create account
      </Button>
    </form>
  )
}
