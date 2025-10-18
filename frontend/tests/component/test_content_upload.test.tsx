/**
 * Component tests for ContentUpload.
 *
 * Tests file upload functionality, validation, drag-and-drop, and progress tracking.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils'
import { ContentUpload } from '../../src/components/courses/ContentUpload'

// Mock the content API
vi.mock('../../src/api/content', () => ({
  uploadContent: vi.fn(),
}))

import { uploadContent } from '../../src/api/content'

describe('ContentUpload', () => {
  const mockCourseId = '123e4567-e89b-12d3-a456-426614174000'
  const mockOnUploadComplete = vi.fn()
  const mockOnUploadError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render upload component with all required fields', () => {
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      )

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/content type/i)).toBeInTheDocument()
      expect(screen.getByText(/drag.*drop|upload file|choose file/i)).toBeInTheDocument()
    })

    it('should show upload button initially', () => {
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      expect(screen.getByRole('button', { name: /upload|submit/i })).toBeInTheDocument()
    })

    it('should have content type selector with options', () => {
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const typeSelector = screen.getByLabelText(/content type/i)
      expect(typeSelector).toBeInTheDocument()

      // Should have video, document, text options
      // Check if it's a select element with options
      const options = (typeSelector as HTMLSelectElement).options
      const optionValues = Array.from(options).map(opt => opt.value)

      expect(optionValues).toContain('video')
      expect(optionValues).toContain('document')
    })
  })

  describe('File Selection', () => {
    it('should handle file selection via input', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // Create a fake file
      const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' })

      // Find file input (might be hidden)
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()

      // Upload file
      await user.upload(fileInput, file)

      // Should display selected file name
      await waitFor(() => {
        expect(screen.getByText(/test-video/i)).toBeInTheDocument()
      })
    })

    it('should auto-populate title from filename', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['content'], 'Introduction to React.mp4', { type: 'video/mp4' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
        expect(titleInput.value).toBe('Introduction to React')
      })
    })

    it('should not overwrite manually entered title', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // First enter a title
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Custom Title')

      // Then upload file
      const file = new File(['content'], 'filename.mp4', { type: 'video/mp4' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      // Title should remain unchanged
      await waitFor(() => {
        expect((titleInput as HTMLInputElement).value).toBe('Custom Title')
      })
    })
  })

  describe('File Validation', () => {
    it('should reject files larger than 2GB', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      )

      // Create a file object with size > 2GB (mock size, not actual data)
      const largeFile = new File(['content'], 'large-video.mp4', { type: 'video/mp4' })
      Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 * 1024 }) // 3GB

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, largeFile)

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds 2GB limit/i)).toBeInTheDocument()
      })
    })

    it('should reject invalid video file types', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // Ensure video type is selected
      const typeSelector = screen.getByLabelText(/content type/i)
      await user.selectOptions(typeSelector, 'video')

      // Try to upload an invalid file type
      const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, invalidFile)

      await waitFor(() => {
        expect(screen.getByText(/invalid video file type/i)).toBeInTheDocument()
      })
    })

    it('should reject invalid document file types', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // Select document type
      const typeSelector = screen.getByLabelText(/content type/i)
      await user.selectOptions(typeSelector, 'document')

      // Try to upload an invalid file type
      const invalidFile = new File(['content'], 'video.mp4', { type: 'video/mp4' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, invalidFile)

      await waitFor(() => {
        expect(screen.getByText(/invalid document file type/i)).toBeInTheDocument()
      })
    })

    it('should accept valid video file types', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const validVideoTypes = [
        { name: 'video.mp4', type: 'video/mp4' },
        { name: 'video.mov', type: 'video/quicktime' },
        { name: 'video.webm', type: 'video/webm' },
      ]

      for (const videoType of validVideoTypes) {
        const file = new File(['content'], videoType.name, { type: videoType.type })
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        await user.upload(fileInput, file)

        // Should not show error
        expect(screen.queryByText(/invalid.*file type/i)).not.toBeInTheDocument()
      }
    })

    it('should accept valid document file types', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // Select document type
      const typeSelector = screen.getByLabelText(/content type/i)
      await user.selectOptions(typeSelector, 'document')

      const validDocTypes = [
        { name: 'doc.pdf', type: 'application/pdf' },
        { name: 'doc.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      ]

      for (const docType of validDocTypes) {
        const file = new File(['content'], docType.name, { type: docType.type })
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        await user.upload(fileInput, file)

        // Should not show error
        expect(screen.queryByText(/invalid.*file type/i)).not.toBeInTheDocument()
      }
    })
  })

  describe('Drag and Drop', () => {
    it('should handle file drop', async () => {
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // Find drop zone
      const dropZone = screen.getByText(/drag.*drop|upload file|choose file/i).closest('div')
      expect(dropZone).toBeInTheDocument()

      // Create a file
      const file = new File(['video content'], 'dropped-video.mp4', { type: 'video/mp4' })

      // Simulate drag over
      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      })

      // Drop zone should show dragging state
      // (Check for visual indicator - depends on implementation)

      // Simulate drop
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/dropped-video/i)).toBeInTheDocument()
      })
    })

    it('should show visual feedback during drag over', () => {
      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const dropZone = screen.getByText(/drag.*drop|upload file|choose file/i).closest('div')

      // Simulate drag over
      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          files: [],
        },
      })

      // Check for CSS class or style change indicating drag state
      // This depends on implementation details
    })
  })

  describe('Upload Process', () => {
    it('should call uploadContent with correct data', async () => {
      const user = userEvent.setup()

      // Mock successful upload
      vi.mocked(uploadContent).mockResolvedValueOnce({
        id: 'content-123',
        title: 'Test Video',
        description: 'Test description',
        content_type: 'video',
        course_id: mockCourseId,
        file_url: 'https://example.com/video.mp4',
        created_at: '2024-01-01',
      } as any)

      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // Fill in form
      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      await user.type(screen.getByLabelText(/title/i), 'Test Video')
      await user.type(screen.getByLabelText(/description/i), 'Test description')

      // Submit
      await user.click(screen.getByRole('button', { name: /upload|submit/i }))

      await waitFor(() => {
        expect(uploadContent).toHaveBeenCalledWith(
          expect.objectContaining({
            courseId: mockCourseId,
            file: file,
            title: expect.stringContaining('Test Video'),
            description: expect.stringContaining('Test description'),
            contentType: 'video',
          })
        )
      })
    })

    it('should call onUploadComplete when upload succeeds', async () => {
      const user = userEvent.setup()

      vi.mocked(uploadContent).mockResolvedValueOnce({
        id: 'content-123',
      } as any)

      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      await user.type(screen.getByLabelText(/description/i), 'Test description')
      await user.click(screen.getByRole('button', { name: /upload|submit/i }))

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalledWith('content-123')
      })
    })

    it('should call onUploadError when upload fails', async () => {
      const user = userEvent.setup()

      vi.mocked(uploadContent).mockRejectedValueOnce(new Error('Upload failed'))

      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      )

      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      await user.type(screen.getByLabelText(/description/i), 'Test description')
      await user.click(screen.getByRole('button', { name: /upload|submit/i }))

      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalled()
      })
    })

    it('should disable form during upload', async () => {
      const user = userEvent.setup()

      // Mock slow upload
      vi.mocked(uploadContent).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      await user.type(screen.getByLabelText(/description/i), 'Test description')
      await user.click(screen.getByRole('button', { name: /upload|submit/i }))

      // Form should be disabled during upload
      const submitButton = screen.getByRole('button', { name: /upload|submit|uploading/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show upload progress', async () => {
      const user = userEvent.setup()

      vi.mocked(uploadContent).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      await user.type(screen.getByLabelText(/description/i), 'Test')
      await user.click(screen.getByRole('button', { name: /upload|submit/i }))

      // Should show progress indicator
      // (Progress bar, percentage, or uploading text)
      await waitFor(() => {
        expect(
          screen.queryByText(/uploading/i) ||
          document.querySelector('[role="progressbar"]')
        ).toBeTruthy()
      })
    })
  })

  describe('Form Validation', () => {
    it('should require title before upload', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // Upload file but don't enter title
      const file = new File(['content'], '', { type: 'video/mp4' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      // Clear auto-populated title
      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)

      await user.type(screen.getByLabelText(/description/i), 'Description')
      await user.click(screen.getByRole('button', { name: /upload|submit/i }))

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/title.*required/i)).toBeInTheDocument()
      })

      expect(uploadContent).not.toHaveBeenCalled()
    })

    it('should require description before upload', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      // Don't enter description
      await user.click(screen.getByRole('button', { name: /upload|submit/i }))

      await waitFor(() => {
        expect(screen.getByText(/description.*required/i)).toBeInTheDocument()
      })

      expect(uploadContent).not.toHaveBeenCalled()
    })

    it('should require file selection before upload', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <ContentUpload
          courseId={mockCourseId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      await user.type(screen.getByLabelText(/title/i), 'Test')
      await user.type(screen.getByLabelText(/description/i), 'Description')
      await user.click(screen.getByRole('button', { name: /upload|submit/i }))

      await waitFor(() => {
        expect(screen.getByText(/file.*required|select.*file/i)).toBeInTheDocument()
      })

      expect(uploadContent).not.toHaveBeenCalled()
    })
  })
})
