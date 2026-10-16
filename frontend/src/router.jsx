import { createBrowserRouter, Navigate } from 'react-router-dom'
import GuestRoute from './components/common/GuestRoute'
import ProtectedRoute from './components/common/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import { ROUTES } from './constants/routes'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import ResetPassword from './pages/auth/ResetPassword'
import Signup from './pages/auth/Signup'
import NotFound from './pages/NotFound'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

export const router = createBrowserRouter([
  { path: ROUTES.HOME, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
  {
    element: <GuestRoute />,
    children: [
      { path: ROUTES.LOGIN, element: <Login /> },
      { path: ROUTES.SIGNUP, element: <Signup /> }
    ]
  },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },
  { path: ROUTES.RESET_PASSWORD, element: <ResetPassword /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: <Dashboard /> },
          { path: ROUTES.NOTIFICATIONS, element: <Notifications /> },
          { path: ROUTES.PROFILE, element: <Profile /> },
          { path: ROUTES.SETTINGS, element: <Settings /> }
        ]
      }
    ]
  },
  { path: '*', element: <NotFound /> }
])
