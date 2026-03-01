import { Navigate, useLocation } from 'react-router-dom'

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = getToken()
  if (!token && location.pathname !== '/login') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
