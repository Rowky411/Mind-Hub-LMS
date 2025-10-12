/**
 * RegisterForm component for user registration.
 *
 * Provides registration form with validation, password strength indicator, and error handling.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { register, AuthTokens, RegisterData, UserRole } from '../../api/auth'
import { ApiError } from '../../api/client'

interface RegisterFormProps {
  onSuccess?: (data: AuthTokens) => void
  onError?: (error: ApiError) => void
  showRoleSelector?: boolean
}

interface RegisterFormData {
  email: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
  role: UserRole
}

interface FormErrors {
  email?: string
  firstName?: string
  lastName?: string
  password?: string
  confirmPassword?: string
  general?: string
}

type PasswordStrength = 'weak' | 'medium' | 'strong'

export default function RegisterForm({
  onSuccess,
  onError,
  showRoleSelector = false,
}: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    role: UserRole.STUDENT,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)

  // Register mutation
  const registerMutation = useMutation<AuthTokens, ApiError, RegisterData>({
    mutationFn: register,
    onSuccess: (data) => {
      setErrors({})
      onSuccess?.(data)
    },
    onError: (error) => {
      const errorMessage =
        error.message || 'An error occurred during registration. Please try again.'

      if (error.code === 'NETWORK_ERROR') {
        setErrors({ general: 'Network error. Please check your connection and try again.' })
      } else {
        setErrors({ general: errorMessage })
      }

      onError?.(error)
    },
  })

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let strength = 0

    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    if (strength <= 2) return 'weak'
    if (strength <= 4) return 'medium'
    return 'strong'
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Update password strength indicator
    if (name === 'password') {
      if (value) {
        setPasswordStrength(calculatePasswordStrength(value))
      } else {
        setPasswordStrength(null)
      }
    }

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter'
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one digit'
    } else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Clear general error
    setErrors((prev) => ({ ...prev, general: undefined }))

    // Validate form
    if (!validateForm()) {
      return
    }

    // Submit registration
    registerMutation.mutate({
      email: formData.email.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      password: formData.password,
      role: formData.role,
    })
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target

    // Validate individual fields on blur
    if (name === 'email' && formData.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setErrors((prev) => ({
          ...prev,
          email: 'Please enter a valid email address',
        }))
      }
    }

    if (name === 'password' && formData.password) {
      if (formData.password.length < 8) {
        setErrors((prev) => ({
          ...prev,
          password: 'Password must be at least 8 characters long',
        }))
      }
    }

    if (name === 'confirmPassword' && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: 'Passwords do not match',
        }))
      }
    }
  }

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return ''
    if (passwordStrength === 'weak') return 'bg-red-500'
    if (passwordStrength === 'medium') return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthWidth = () => {
    if (!passwordStrength) return '0%'
    if (passwordStrength === 'weak') return '33%'
    if (passwordStrength === 'medium') return '66%'
    return '100%'
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Join Mind Hub LMS and start learning today
          </p>
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
            role="alert"
          >
            <p className="text-sm">{errors.general}</p>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={registerMutation.isPending}
            className={`
              w-full px-4 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${errors.email ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={formData.firstName}
              onChange={handleChange}
              disabled={registerMutation.isPending}
              className={`
                w-full px-4 py-2 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors.firstName ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={formData.lastName}
              onChange={handleChange}
              disabled={registerMutation.isPending}
              className={`
                w-full px-4 py-2 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors.lastName ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Role Selector (Optional) */}
        {showRoleSelector && (
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Account type
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={registerMutation.isPending}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value={UserRole.STUDENT}>Student</option>
              <option value={UserRole.INSTRUCTOR}>Instructor</option>
            </select>
          </div>
        )}

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={registerMutation.isPending}
              className={`
                w-full px-4 py-2 pr-12 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors.password ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              disabled={registerMutation.isPending}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Password strength:</span>
                <span className={`text-xs font-medium ${passwordStrength === 'weak' ? 'text-red-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: getPasswordStrengthWidth() }}
                ></div>
              </div>
            </div>
          )}

          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={registerMutation.isPending}
              className={`
                w-full px-4 py-2 pr-12 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              disabled={registerMutation.isPending}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className={`
            w-full flex justify-center py-2 px-4 border border-transparent
            rounded-md shadow-sm text-sm font-medium text-white
            bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2
            focus:ring-offset-2 focus:ring-blue-500
            disabled:bg-blue-400 disabled:cursor-not-allowed
            transition-colors duration-200
          `}
        >
          {registerMutation.isPending ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                role="status"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
