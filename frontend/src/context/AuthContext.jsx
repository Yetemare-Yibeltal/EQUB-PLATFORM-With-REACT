import { useCallback, useEffect, useMemo } from 'react'
import LanguageSync from '../i18n/LanguageSync'
import { refreshSession } from '../services/api'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { USER_ROLES } from '../constants/roles'
import { AuthContext } from './contexts'

const endSession = () => {
  useAuthStore.getState().clearSession()
  useNotificationStore.getState().reset()
}

export function AuthProvider ({ children }) {
  const status = useAuthStore(state => state.status)
  const user = useAuthStore(state => state.user)

  const bootstrap = useCallback(async () => {
    try {
      await refreshSession()
    } catch (error) {
      const code = error.response?.status

      if (code !== 401 && code !== 403) {
        useAuthStore.getState().setStatus('unreachable')
      }
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const retry = useCallback(() => {
    useAuthStore.getState().setStatus('loading')
    return bootstrap()
  }, [bootstrap])

  const login = useCallback(async credentials => {
    const data = await authService.login(credentials)
    useAuthStore.getState().setSession(data)
    return data.user
  }, [])

  const register = useCallback(async payload => {
    const data = await authService.register(payload)
    useAuthStore.getState().setSession(data)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await authService.logout().catch(() => null)
    endSession()
  }, [])

  const logoutAll = useCallback(async () => {
    await authService.logoutAll()
    endSession()
  }, [])

  const changePassword = useCallback(async payload => {
    const data = await authService.changePassword(payload)
    useAuthStore.getState().setSession(data)
    return data.user
  }, [])

  const updateProfile = useCallback(async payload => {
    const data = await userService.updateMe(payload)
    useAuthStore.getState().setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === USER_ROLES.ADMIN,
      login,
      register,
      logout,
      logoutAll,
      changePassword,
      updateProfile,
      retry
    }),
    [
      status,
      user,
      login,
      register,
      logout,
      logoutAll,
      changePassword,
      updateProfile,
      retry
    ]
  )

  return (
    <AuthContext.Provider value={value}>
      <LanguageSync />
      {children}
    </AuthContext.Provider>
  )
}
