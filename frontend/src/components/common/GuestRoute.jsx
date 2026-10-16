import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import ErrorMessage from './ErrorMessage'
import Loader from './Loader'

export default function GuestRoute () {
  const { status, retry } = useAuth()
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

  if (status === 'authenticated') {
    return (
      <Navigate
        to={location.state?.from?.pathname || ROUTES.DASHBOARD}
        replace
      />
    )
  }

  return <Outlet />
}
