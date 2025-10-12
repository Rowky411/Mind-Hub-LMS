/**
 * Component tests for LoginForm.
 *
 * Tests user interactions, validation, and form submission.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils'
import LoginForm from '../../src/components/auth/LoginForm'

// Mock the auth API
vi.mock('../../src/api/auth', () => ({
  login: vi.fn(),
}))

import { login } from '../../src/api/auth'

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with all required fields', () => {
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in|sign in/i })).toBeInTheDocument()
  })

  it('should render a link to the registration page', () => {
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />)

    const registerLink = screen.getByText(/sign up|register|create account/i)
    expect(registerLink).toBeInTheDocument()
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
  })

  it('should show validation errors for empty fields on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />)

    const submitButton = screen.getByRole('button', { name: /log in|sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email.*required/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/password.*required/i)).toBeInTheDocument()
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should show validation error for invalid email format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText(/valid email|invalid email/i)).toBeInTheDocument()
    })
  })

  it('should successfully submit with valid credentials', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
      },
    }

    vi.mocked(login).mockResolvedValueOnce(mockResponse)

    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')

    // Submit form
    await user.click(screen.getByRole('button', { name: /log in|sign in/i }))

    // Wait for API call and success callback
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123!',
      })
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse)
    })
  })

  it('should show error message on failed login', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Invalid email or password'

    vi.mocked(login).mockRejectedValueOnce({
      response: {
        data: {
          detail: errorMessage,
        },
      },
    })

    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword123!')

    // Submit form
    await user.click(screen.getByRole('button', { name: /log in|sign in/i }))

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
    if (mockOnError) {
      expect(mockOnError).toHaveBeenCalled()
    }
  })

  it('should disable submit button while request is in progress', async () => {
    const user = userEvent.setup()

    // Mock a delayed response
    vi.mocked(login).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                accessToken: 'token',
                refreshToken: 'refresh',
                user: { id: '123', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'student' },
              }),
            100
          )
        })
    )

    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /log in|sign in/i })
    await user.click(submitButton)

    // Button should be disabled while loading
    expect(submitButton).toBeDisabled()

    // Wait for request to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('should show loading state with appropriate text/spinner', async () => {
    const user = userEvent.setup()

    // Mock a delayed response
    vi.mocked(login).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                accessToken: 'token',
                refreshToken: 'refresh',
                user: { id: '123', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'student' },
              }),
            100
          )
        })
    )

    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')

    // Submit form
    await user.click(screen.getByRole('button', { name: /log in|sign in/i }))

    // Should show loading text or spinner
    await waitFor(() => {
      expect(
        screen.getByText(/logging in|loading/i) || screen.getByRole('status')
      ).toBeInTheDocument()
    })
  })

  it('should clear password field on failed login attempt', async () => {
    const user = userEvent.setup()

    vi.mocked(login).mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Invalid credentials',
        },
      },
    })

    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />)

    // Fill in form
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'WrongPassword')

    // Submit form
    await user.click(screen.getByRole('button', { name: /log in|sign in/i }))

    // Wait for error and check password is cleared
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })

    // Password should be cleared for security
    expect(passwordInput.value).toBe('')
    // Email should remain filled
    expect(emailInput.value).toBe('test@example.com')
  })

  it('should allow password visibility toggle', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />)

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Look for show/hide password button
    const toggleButton = screen.getByRole('button', { name: /show|hide|toggle.*password/i })
    await user.click(toggleButton)

    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Click again to hide
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup()

    vi.mocked(login).mockRejectedValueOnce(new Error('Network Error'))

    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')

    // Submit form
    await user.click(screen.getByRole('button', { name: /log in|sign in/i }))

    // Should show generic error message
    await waitFor(() => {
      expect(
        screen.getByText(/network error|connection|try again/i)
      ).toBeInTheDocument()
    })
  })
})
