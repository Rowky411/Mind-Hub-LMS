/**
 * Component tests for RegisterForm.
 *
 * Tests user registration flow, validation, and form submission.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils'
import RegisterForm from '../../src/components/auth/RegisterForm'

// Mock the auth API
vi.mock('../../src/api/auth', () => ({
  register: vi.fn(),
}))

import { register } from '../../src/api/auth'

describe('RegisterForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render registration form with all required fields', () => {
    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register|sign up|create account/i })).toBeInTheDocument()
  })

  it('should render a link to the login page', () => {
    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    const loginLink = screen.getByText(/already have.*account|log in|sign in/i)
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('should show validation errors for empty fields on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email.*required/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/first name.*required/i)).toBeInTheDocument()
    expect(screen.getByText(/last name.*required/i)).toBeInTheDocument()
    expect(screen.getAllByText(/password.*required/i)).toHaveLength(1)
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should show validation error for invalid email format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText(/valid email|invalid email/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for weak password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    const passwordInput = screen.getByLabelText(/^password$/i)
    await user.type(passwordInput, 'weak')
    await user.tab()

    await waitFor(() => {
      expect(
        screen.getByText(/password must.*8 characters|password too weak/i)
      ).toBeInTheDocument()
    })
  })

  it('should show validation error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmInput = screen.getByLabelText(/confirm password/i)

    await user.type(passwordInput, 'SecurePass123!')
    await user.type(confirmInput, 'DifferentPass123!')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/passwords.*match|passwords must be the same/i)).toBeInTheDocument()
    })
  })

  it('should display password strength indicator', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    const passwordInput = screen.getByLabelText(/^password$/i)

    // Weak password
    await user.type(passwordInput, 'weak')
    expect(screen.getByText(/weak/i)).toBeInTheDocument()

    // Clear and type medium password
    await user.clear(passwordInput)
    await user.type(passwordInput, 'Medium123')
    await waitFor(() => {
      expect(screen.getByText(/medium|fair/i)).toBeInTheDocument()
    })

    // Clear and type strong password
    await user.clear(passwordInput)
    await user.type(passwordInput, 'StrongPass123!')
    await waitFor(() => {
      expect(screen.getByText(/strong/i)).toBeInTheDocument()
    })
  })

  it('should successfully submit with valid data', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '123',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'student',
      },
    }

    vi.mocked(register).mockResolvedValueOnce(mockResponse)

    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'New')
    await user.type(screen.getByLabelText(/last name/i), 'User')
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!')

    // Submit form
    await user.click(screen.getByRole('button', { name: /register|sign up|create account/i }))

    // Wait for API call and success callback
    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'SecurePass123!',
        role: 'student',
      })
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse)
    })
  })

  it('should show error message when email is already registered', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Email already registered'

    vi.mocked(register).mockRejectedValueOnce({
      response: {
        data: {
          detail: errorMessage,
        },
      },
    })

    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'Test')
    await user.type(screen.getByLabelText(/last name/i), 'User')
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!')

    // Submit form
    await user.click(screen.getByRole('button', { name: /register|sign up|create account/i }))

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
    vi.mocked(register).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                accessToken: 'token',
                refreshToken: 'refresh',
                user: {
                  id: '123',
                  email: 'test@example.com',
                  firstName: 'Test',
                  lastName: 'User',
                  role: 'student',
                },
              }),
            100
          )
        })
    )

    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'Test')
    await user.type(screen.getByLabelText(/last name/i), 'User')
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /register|sign up|create account/i })
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
    vi.mocked(register).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                accessToken: 'token',
                refreshToken: 'refresh',
                user: {
                  id: '123',
                  email: 'test@example.com',
                  firstName: 'Test',
                  lastName: 'User',
                  role: 'student',
                },
              }),
            100
          )
        })
    )

    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'Test')
    await user.type(screen.getByLabelText(/last name/i), 'User')
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!')

    // Submit form
    await user.click(screen.getByRole('button', { name: /register|sign up|create account/i }))

    // Should show loading text or spinner
    await waitFor(() => {
      expect(
        screen.getByText(/creating|registering|loading/i) || screen.getByRole('status')
      ).toBeInTheDocument()
    })
  })

  it('should allow password visibility toggle for both password fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement
    const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmInput).toHaveAttribute('type', 'password')

    // Look for show/hide password buttons
    const toggleButtons = screen.getAllByRole('button', { name: /show|hide|toggle.*password/i })
    expect(toggleButtons.length).toBeGreaterThanOrEqual(1)

    // Toggle first password field
    await user.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Toggle back
    await user.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should handle role selection if available', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} showRoleSelector={true} />)

    // Check if role selector exists (might be optional)
    const roleSelect = screen.queryByLabelText(/role/i)

    if (roleSelect) {
      await user.selectOptions(roleSelect, 'instructor')

      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: '123',
          email: 'instructor@example.com',
          firstName: 'John',
          lastName: 'Instructor',
          role: 'instructor',
        },
      }

      vi.mocked(register).mockResolvedValueOnce(mockResponse)

      // Fill in form
      await user.type(screen.getByLabelText(/email/i), 'instructor@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Instructor')
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!')

      // Submit form
      await user.click(screen.getByRole('button', { name: /register|sign up|create account/i }))

      await waitFor(() => {
        expect(register).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'instructor',
          })
        )
      })
    }
  })

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup()

    vi.mocked(register).mockRejectedValueOnce(new Error('Network Error'))

    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/first name/i), 'Test')
    await user.type(screen.getByLabelText(/last name/i), 'User')
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!')

    // Submit form
    await user.click(screen.getByRole('button', { name: /register|sign up|create account/i }))

    // Should show generic error message
    await waitFor(() => {
      expect(
        screen.getByText(/network error|connection|try again/i)
      ).toBeInTheDocument()
    })
  })

  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
      },
    }

    vi.mocked(register).mockResolvedValueOnce(mockResponse)

    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />)

    // Fill in form with extra whitespace
    await user.type(screen.getByLabelText(/email/i), '  test@example.com  ')
    await user.type(screen.getByLabelText(/first name/i), '  Test  ')
    await user.type(screen.getByLabelText(/last name/i), '  User  ')
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!')

    // Submit form
    await user.click(screen.getByRole('button', { name: /register|sign up|create account/i }))

    // Verify trimmed values were sent
    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        })
      )
    })
  })
})
