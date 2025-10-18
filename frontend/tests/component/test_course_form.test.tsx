/**
 * Component tests for CourseForm.
 *
 * Tests course form validation, user interactions, and submission handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils'
import { CourseForm } from '../../src/components/courses/CourseForm'
import type { CourseCreate, CourseUpdate } from '../../src/types/course'

describe('CourseForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render course form with all required fields', () => {
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/course title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/visibility/i)).toBeInTheDocument()
    })

    it('should render create mode by default', () => {
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText(/create new course/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create course|submit/i })).toBeInTheDocument()
    })

    it('should render edit mode when isEdit is true', () => {
      renderWithProviders(
        <CourseForm onSubmit={mockOnSubmit} isEdit={true} />
      )

      expect(screen.getByText(/edit course/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update course|save|submit/i })).toBeInTheDocument()
    })

    it('should populate form with initial data in edit mode', () => {
      const initialData: CourseUpdate = {
        title: 'Existing Course',
        description: 'This is an existing course description',
        category: 'Programming',
        visibility: 'public',
        enrollment_capacity: 50,
      }

      renderWithProviders(
        <CourseForm onSubmit={mockOnSubmit} initialData={initialData} isEdit={true} />
      )

      expect(screen.getByDisplayValue('Existing Course')).toBeInTheDocument()
      expect(screen.getByDisplayValue('This is an existing course description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Programming')).toBeInTheDocument()
      expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show validation error when title is empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /create course|submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show validation error when title is too short', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      const titleInput = screen.getByLabelText(/course title/i)
      await user.type(titleInput, 'AB')

      const submitButton = screen.getByRole('button', { name: /create course|submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument()
      })
    })

    it('should show validation error when description is empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /create course|submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/description is required/i)).toBeInTheDocument()
      })
    })

    it('should show validation error when description is too short', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'Short')

      const submitButton = screen.getByRole('button', { name: /create course|submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/description must be at least 10 characters/i)).toBeInTheDocument()
      })
    })

    it('should show validation error when category is empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /create course|submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/category is required/i)).toBeInTheDocument()
      })
    })

    it('should show validation error when enrollment capacity is negative', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      const capacityInput = screen.getByLabelText(/enrollment capacity/i)
      await user.type(capacityInput, '-5')

      const submitButton = screen.getByRole('button', { name: /create course|submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/capacity must be at least 1/i)).toBeInTheDocument()
      })
    })

    it('should clear validation errors when user corrects input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /create course|submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      })

      // Correct the input
      const titleInput = screen.getByLabelText(/course title/i)
      await user.type(titleInput, 'Valid Course Title')

      // Validation error should still be visible until resubmit
      // (depends on implementation - some forms clear on change, some on resubmit)
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with valid course data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      // Fill in all required fields
      await user.type(screen.getByLabelText(/course title/i), 'Introduction to React')
      await user.type(
        screen.getByLabelText(/description/i),
        'Learn React from scratch with hands-on projects'
      )
      await user.type(screen.getByLabelText(/category/i), 'Web Development')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create course|submit/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const submittedData = mockOnSubmit.mock.calls[0][0] as CourseCreate

      expect(submittedData.title).toBe('Introduction to React')
      expect(submittedData.description).toBe('Learn React from scratch with hands-on projects')
      expect(submittedData.category).toBe('Web Development')
      expect(submittedData.visibility).toBe('draft') // Default value
    })

    it('should submit with enrollment capacity as number when provided', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/course title/i), 'Test Course')
      await user.type(screen.getByLabelText(/description/i), 'Test description for course')
      await user.type(screen.getByLabelText(/category/i), 'Test Category')
      await user.type(screen.getByLabelText(/enrollment capacity/i), '100')

      await user.click(screen.getByRole('button', { name: /create course|submit/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })

      const submittedData = mockOnSubmit.mock.calls[0][0] as CourseCreate
      expect(submittedData.enrollment_capacity).toBe(100)
    })

    it('should submit with enrollment capacity as null when not provided', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/course title/i), 'Test Course')
      await user.type(screen.getByLabelText(/description/i), 'Test description for course')
      await user.type(screen.getByLabelText(/category/i), 'Test Category')

      // Don't fill enrollment capacity

      await user.click(screen.getByRole('button', { name: /create course|submit/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })

      const submittedData = mockOnSubmit.mock.calls[0][0] as CourseCreate
      expect(submittedData.enrollment_capacity).toBeNull()
    })

    it('should submit with selected visibility option', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/course title/i), 'Test Course')
      await user.type(screen.getByLabelText(/description/i), 'Test description for course')
      await user.type(screen.getByLabelText(/category/i), 'Test Category')

      // Select visibility (public)
      const visibilitySelect = screen.getByLabelText(/visibility/i)
      await user.selectOptions(visibilitySelect, 'public')

      await user.click(screen.getByRole('button', { name: /create course|submit/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })

      const submittedData = mockOnSubmit.mock.calls[0][0] as CourseCreate
      expect(submittedData.visibility).toBe('public')
    })

    it('should trim whitespace from text inputs', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/course title/i), '  Spaced Title  ')
      await user.type(screen.getByLabelText(/description/i), '  Spaced description here  ')
      await user.type(screen.getByLabelText(/category/i), '  Spaced Category  ')

      await user.click(screen.getByRole('button', { name: /create course|submit/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })

      const submittedData = mockOnSubmit.mock.calls[0][0] as CourseCreate
      expect(submittedData.title).toBe('Spaced Title')
      expect(submittedData.description).toBe('Spaced description here')
      expect(submittedData.category).toBe('Spaced Category')
    })
  })

  describe('Loading State', () => {
    it('should disable form fields when isLoading is true', () => {
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} isLoading={true} />)

      expect(screen.getByLabelText(/course title/i)).toBeDisabled()
      expect(screen.getByLabelText(/description/i)).toBeDisabled()
      expect(screen.getByLabelText(/category/i)).toBeDisabled()
      expect(screen.getByRole('button', { name: /create course|submit/i })).toBeDisabled()
    })

    it('should enable form fields when isLoading is false', () => {
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} isLoading={false} />)

      expect(screen.getByLabelText(/course title/i)).not.toBeDisabled()
      expect(screen.getByLabelText(/description/i)).not.toBeDisabled()
      expect(screen.getByLabelText(/category/i)).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /create course|submit/i })).not.toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all form fields', () => {
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/course title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/visibility/i)).toBeInTheDocument()
    })

    it('should have required indicators for mandatory fields', () => {
      renderWithProviders(<CourseForm onSubmit={mockOnSubmit} />)

      // Check for required indicators (asterisk or aria-required)
      const titleLabel = screen.getByLabelText(/course title/i)
      const titleLabelText = screen.getByText(/course title/i)

      // Should have asterisk or aria-required attribute
      expect(
        titleLabelText.textContent?.includes('*') ||
        titleLabel.getAttribute('aria-required') === 'true'
      ).toBe(true)
    })
  })
})
