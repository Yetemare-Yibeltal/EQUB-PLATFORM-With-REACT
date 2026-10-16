import { Link } from 'react-router-dom'
import ResetPasswordForm from '../../components/auth/ResetPasswordForm'
import AuthLayout from '../../components/layout/AuthLayout'
import { ROUTES } from '../../constants/routes'

export default function ResetPassword () {
  return (
    <AuthLayout
      title='Choose a new password'
      subtitle='Enter your reset code and a new password'
      footer={
        <p>
          <Link to={ROUTES.LOGIN}>Back to log in</Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthLayout>
  )
}
