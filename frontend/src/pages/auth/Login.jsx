import { Link } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'
import AuthLayout from '../../components/layout/AuthLayout'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../hooks/useLanguage'

export default function Login () {
  const { t } = useLanguage()

  return (
    <AuthLayout
      title={t('Welcome back')}
      subtitle={t('Log in to manage your equb groups')}
      footer={
        <p>
          {t('New here?')}{' '}
          <Link to={ROUTES.SIGNUP}>{t('Create an account')}</Link>
        </p>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
