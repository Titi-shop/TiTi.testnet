'use client'
import { useAuth } from '../../../contexts/AuthContext'
import ProtectedRoute from '../../../components/Auth/ProtectedRoute'

export default function LoginPage() {
  const { login } = useAuth()

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="login-page">
        <h1>Login with Pi Network</h1>
        <button onClick={login}>🔐 Login</button>
      </div>
    </ProtectedRoute>
  )
}
