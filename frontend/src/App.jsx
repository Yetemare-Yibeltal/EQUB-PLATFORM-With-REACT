import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'
import LanguageProvider from './i18n/LanguageProvider'
import { router } from './router'

export default function App () {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <RouterProvider router={router} />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}
