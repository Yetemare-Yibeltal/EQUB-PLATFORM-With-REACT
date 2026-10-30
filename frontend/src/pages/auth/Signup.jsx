import { Link } from 'react-router-dom'
import SignupForm from '../../components/auth/SignupForm'
import AuthLayout from '../../components/layout/AuthLayout'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'

export default function Signup () {
  const { t } = useLanguage()

  return (
    <AuthLayout
      title={t('Create your account')}
      subtitle={t('Join or organize an equb in minutes')}
      footer={
        <p>
          {t('Already have an account?')}{' '}
          <Link to={ROUTES.LOGIN}>{t('Log in')}</Link>
        </p>
      }
    >
      <SignupForm />
    </AuthLayout>
  )
}
