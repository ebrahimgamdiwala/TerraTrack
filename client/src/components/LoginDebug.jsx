import { useAuth } from '../context/AuthContext'

export default function LoginDebug() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <div className="p-4 text-white">Loading...</div>
  }

  return (
    <div className="p-4 bg-black/20 text-white rounded-lg backdrop-blur">
      <h3 className="text-lg font-bold mb-2">Auth Debug Info:</h3>
      <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
      <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'No user data'}</p>
      <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Not found'}</p>
    </div>
  )
}