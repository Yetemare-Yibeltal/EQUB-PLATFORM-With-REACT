import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

export default function NotFound () {
  return (
    <div className='center-screen'>
      <div className='not-found'>
        <p className='not-found-code'>404</p>
        <h1>Page not found</h1>
        <p className='muted'>
          The page you are looking for does not exist or has moved.
        </p>
        <Link to={ROUTES.HOME} className='btn btn-primary btn-md'>
          Back to home
        </Link>
      </div>
    </div>
  )
}
