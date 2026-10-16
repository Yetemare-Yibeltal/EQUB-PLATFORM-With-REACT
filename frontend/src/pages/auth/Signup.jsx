import { Link } from 'react-router-dom'
import SignupForm from '../../components/auth/SignupForm'
import AuthLayout from '../../components/layout/AuthLayout'
import { ROUTES } from '../../constants/routes'

export default function Signup () {
  return (
    <AuthLayout
      title='Create your account'
      subtitle='Join or organize an equb in minutes'
      footer={
        <p>
          Already have an account? <Link to={ROUTES.LOGIN}>Log in</Link>
        </p>
      }
    >
      <SignupForm />
    </AuthLayout>
  )
}
