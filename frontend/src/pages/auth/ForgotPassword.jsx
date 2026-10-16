import { Link } from 'react-router-dom'
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm'
import AuthLayout from '../../components/layout/AuthLayout'
import { ROUTES } from '../../constants/routes'

export default function ForgotPassword () {
  return (
    <AuthLayout
      title='Forgot your password?'
      subtitle='Enter your phone number or email and we will issue a reset code'
      footer={
        <p>
          Remembered it? <Link to={ROUTES.LOGIN}>Log in</Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
