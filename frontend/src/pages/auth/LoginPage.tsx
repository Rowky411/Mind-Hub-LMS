/**
 * LoginPage component.
 *
 * Provides the login page layout with LoginForm component.
 */
import { useNavigate } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'
import { AuthTokens } from '../../api/auth'

export default function LoginPage() {
  const navigate = useNavigate()

  const handleLoginSuccess = (data: AuthTokens) => {
    // Redirect based on user role
    const { user } = data

    if (user.role === 'admin') {
      navigate('/dashboard/admin')
    } else if (user.role === 'instructor') {
      navigate('/dashboard/instructor')
    } else {
      navigate('/dashboard/student')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="text-4xl font-bold text-blue-600">Mind Hub</div>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          Learning Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>
  )
}
