import { createBrowserRouter, Navigate } from 'react-router-dom'
import GuestRoute from './components/common/GuestRoute'
import ProtectedRoute from './components/common/ProtectedRoute'
import GroupShell from './components/group/GroupShell'
import AdminLayout from './components/layout/AdminLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import { ROUTES } from './constants/routes'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminGroups from './pages/admin/Groups'
import AdminPayments from './pages/admin/Payments'
import AuditLogs from './pages/admin/AuditLogs'
import SystemSettings from './pages/admin/SystemSettings'
import Users from './pages/admin/Users'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import ResetPassword from './pages/auth/ResetPassword'
import Signup from './pages/auth/Signup'
import VerifyEmail from './pages/auth/VerifyEmail'
import Contributions from './pages/contributions/Contributions'
import CycleHistory from './pages/cycles/CycleHistory'
import DrawPage from './pages/draws/DrawPage'
import GroupCreate from './pages/groups/GroupCreate'
import GroupDetail from './pages/groups/GroupDetail'
import GroupJoin from './pages/groups/GroupJoin'
import GroupLedger from './pages/groups/GroupLedger'
import GroupMembers from './pages/groups/GroupMembers'
import GroupReports from './pages/groups/GroupReports'
import GroupSettings from './pages/groups/GroupSettings'
import Groups from './pages/groups/Groups'
import PaymentResult from './pages/payments/PaymentResult'
import Payments from './pages/payments/Payments'
import GroupPayouts from './pages/payouts/GroupPayouts'
import Payouts from './pages/payouts/Payouts'

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
  { path: ROUTES.VERIFY_EMAIL, element: <VerifyEmail /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: <Dashboard /> },
          { path: ROUTES.NOTIFICATIONS, element: <Notifications /> },
          { path: ROUTES.PROFILE, element: <Profile /> },
          { path: ROUTES.SETTINGS, element: <Settings /> },
          { path: ROUTES.GROUPS, element: <Groups /> },
          { path: ROUTES.GROUP_CREATE, element: <GroupCreate /> },
          { path: ROUTES.GROUP_JOIN, element: <GroupJoin /> },
          {
            path: '/groups/:groupId',
            element: <GroupShell />,
            children: [
              { index: true, element: <GroupDetail /> },
              { path: 'members', element: <GroupMembers /> },
              { path: 'cycles', element: <CycleHistory /> },
              { path: 'draws', element: <DrawPage /> },
              { path: 'payouts', element: <GroupPayouts /> },
              { path: 'ledger', element: <GroupLedger /> },
              { path: 'reports', element: <GroupReports /> },
              { path: 'settings', element: <GroupSettings /> }
            ]
          },
          { path: ROUTES.CONTRIBUTIONS, element: <Contributions /> },
          { path: ROUTES.PAYMENTS, element: <Payments /> },
          { path: '/payments/result/:txRef', element: <PaymentResult /> },
          { path: ROUTES.PAYOUTS, element: <Payouts /> },
          {
            path: ROUTES.ADMIN,
            element: (
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: 'users', element: <Users /> },
              { path: 'groups', element: <AdminGroups /> },
              { path: 'payments', element: <AdminPayments /> },
              { path: 'audit-logs', element: <AuditLogs /> },
              { path: 'jobs', element: <SystemSettings /> }
            ]
          }
        ]
      }
    ]
  },
  { path: '*', element: <NotFound /> }
])
