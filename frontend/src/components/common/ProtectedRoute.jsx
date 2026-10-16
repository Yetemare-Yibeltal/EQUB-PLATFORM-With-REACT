import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import ErrorMessage from './ErrorMessage'
import Loader from './Loader'

export default function ProtectedRoute ({ roles, children }) {
  const { status, user, retry } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <Loader fullScreen label='Restoring your session' />
  }

  if (status === 'unreachable') {
    return (
      <div className='center-screen'>
        <ErrorMessage
          message='Cannot reach the server, check your connection and try again'
          onRetry={retry}
        />
      </div>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children ?? <Outlet />
}
