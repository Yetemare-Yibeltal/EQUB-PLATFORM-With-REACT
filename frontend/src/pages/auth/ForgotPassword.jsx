import { Link } from 'react-router-dom'
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm'
import AuthLayout from '../../components/layout/AuthLayout'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'

export default function ForgotPassword () {
  const { t } = useLanguage()

  return (
    <AuthLayout
      title={t('Forgot your password?')}
      subtitle={t(
        'Enter your phone number or email and we will send you a reset link'
      )}
      footer={
        <p>
          {t('Remembered it?')} <Link to={ROUTES.LOGIN}>{t('Log in')}</Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
