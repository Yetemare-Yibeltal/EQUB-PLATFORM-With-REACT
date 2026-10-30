import { Link } from 'react-router-dom'
import ResetPasswordForm from '../../components/auth/ResetPasswordForm'
import AuthLayout from '../../components/layout/AuthLayout'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'

export default function ResetPassword () {
  const { t } = useLanguage()

  return (
    <AuthLayout
      title={t('Choose a new password')}
      subtitle={t('Enter your reset code and a new password')}
      footer={
        <p>
          <Link to={ROUTES.LOGIN}>{t('Back to log in')}</Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthLayout>
  )
}
