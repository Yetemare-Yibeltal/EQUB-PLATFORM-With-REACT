import { Link } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'
import AuthLayout from '../../components/layout/AuthLayout'
import { ROUTES } from '../../constants/routes'

export default function Login () {
  return (
    <AuthLayout
      title='Welcome back'
      subtitle='Log in to manage your equb groups'
      footer={
        <p>
          New here? <Link to={ROUTES.SIGNUP}>Create an account</Link>
        </p>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
