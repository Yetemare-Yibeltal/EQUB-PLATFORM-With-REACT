import { useState } from 'react'
import Button from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'
import Input from '../components/common/Input'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { getErrorMessage, getFieldErrors } from '../utils/errors'
import { formatDate } from '../utils/formatDate'
import {
  hasErrors,
  validateFullName,
  validateOptionalEmail,
  validatePassword,
  validatePasswordConfirmation
} from '../utils/validators'

const EMPTY_PASSWORDS = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
}

export default function Profile () {
  const { user, updateProfile, changePassword } = useAuth()
  const { t } = useLanguage()
  const [profile, setProfile] = useState({
    fullName: user.fullName,
    email: user.email ?? ''
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS)
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const handleProfileChange = event => {
    const { name, value } = event.target
    setProfile(current => ({ ...current, [name]: value }))
    setProfileErrors(current => ({ ...current, [name]: '' }))
    setProfileMessage('')
  }

  const handleProfileSubmit = async event => {
    event.preventDefault()

    const nextErrors = {
      fullName: validateFullName(profile.fullName),
      email: validateOptionalEmail(profile.email)
    }

    setProfileErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    const payload = {}
    const fullName = profile.fullName.trim()
    const email = profile.email.trim().toLowerCase()

    if (fullName !== user.fullName) payload.fullName = fullName
    if (email !== (user.email ?? '')) payload.email = email || null

    if (Object.keys(payload).length === 0) {
      setProfileMessage(t('There are no changes to save'))
      return
    }

    setSavingProfile(true)
    setProfileError('')
    setProfileMessage('')

    try {
      await updateProfile(payload)
      setProfileMessage(t('Profile updated'))
    } catch (error) {
      setProfileErrors(getFieldErrors(error))
      setProfileError(getErrorMessage(error))
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordChange = event => {
    const { name, value } = event.target
    setPasswords(current => ({ ...current, [name]: value }))
    setPasswordErrors(current => ({ ...current, [name]: '' }))
    setPasswordMessage('')
  }

  const handlePasswordSubmit = async event => {
    event.preventDefault()

    const nextErrors = {
      currentPassword: passwords.currentPassword
        ? ''
        : t('Current password is required'),
      newPassword: validatePassword(passwords.newPassword),
      confirmPassword: validatePasswordConfirmation(
        passwords.newPassword,
        passwords.confirmPassword
      )
    }

    setPasswordErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSavingPassword(true)
    setPasswordError('')
    setPasswordMessage('')

    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      })
      setPasswords(EMPTY_PASSWORDS)
      setPasswordMessage(t('Password changed, other devices were signed out'))
    } catch (error) {
      setPasswordErrors(getFieldErrors(error))
      setPasswordError(getErrorMessage(error))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className='page'>
      <header className='page-header'>
        <h1>{t('Profile')}</h1>
        <p className='muted'>
          {t('Member since {date}', { date: formatDate(user.createdAt) })}
        </p>
      </header>

      <section className='card'>
        <h2>{t('Personal details')}</h2>
        <form className='form' onSubmit={handleProfileSubmit} noValidate>
          <ErrorMessage message={profileError} />
          {profileMessage && (
            <p className='alert alert-success' role='status'>
              {profileMessage}
            </p>
          )}
          <Input label='Phone number' value={user.phone} disabled readOnly />
          <Input
            label='Full name'
            name='fullName'
            autoComplete='name'
            value={profile.fullName}
            onChange={handleProfileChange}
            error={profileErrors.fullName}
            required
          />
          <Input
            label='Email (optional)'
            name='email'
            type='email'
            autoComplete='email'
            value={profile.email}
            onChange={handleProfileChange}
            error={profileErrors.email}
          />
          <Button type='submit' loading={savingProfile}>
            {t('Save changes')}
          </Button>
        </form>
      </section>

      <section className='card'>
        <h2>{t('Change password')}</h2>
        <form className='form' onSubmit={handlePasswordSubmit} noValidate>
          <ErrorMessage message={passwordError} />
          {passwordMessage && (
            <p className='alert alert-success' role='status'>
              {passwordMessage}
            </p>
          )}
          <Input
            label='Current password'
            name='currentPassword'
            type='password'
            autoComplete='current-password'
            value={passwords.currentPassword}
            onChange={handlePasswordChange}
            error={passwordErrors.currentPassword}
            required
          />
          <Input
            label='New password'
            name='newPassword'
            type='password'
            autoComplete='new-password'
            hint='At least 8 characters with a letter and a number'
            value={passwords.newPassword}
            onChange={handlePasswordChange}
            error={passwordErrors.newPassword}
            required
          />
          <Input
            label='Confirm new password'
            name='confirmPassword'
            type='password'
            autoComplete='new-password'
            value={passwords.confirmPassword}
            onChange={handlePasswordChange}
            error={passwordErrors.confirmPassword}
            required
          />
          <Button type='submit' loading={savingPassword}>
            {t('Change password')}
          </Button>
        </form>
      </section>
    </div>
  )
}
