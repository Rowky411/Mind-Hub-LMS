/**
 * EnrollButton component
 *
 * Displays an enrollment button that allows students to enroll in courses.
 * Shows different states: not enrolled, enrolled, loading, and error.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enrollInCourse } from '@/api/enrollments'
import { Button } from '@/components/ui/Button'

interface EnrollButtonProps {
  courseId: string
  isEnrolled: boolean
  enrollmentId?: string
  onEnrollSuccess?: () => void
}

export default function EnrollButton({
  courseId,
  isEnrolled,
  enrollmentId,
  onEnrollSuccess,
}: EnrollButtonProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const enrollMutation = useMutation({
    mutationFn: () => enrollInCourse(courseId),
    onSuccess: () => {
      // Invalidate queries to refresh enrollment status
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['courses', courseId] })

      setSuccessMessage('Successfully enrolled in the course!')
      setErrorMessage(null)

      // Call callback if provided
      if (onEnrollSuccess) {
        onEnrollSuccess()
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail || 'Failed to enroll in course'
      setErrorMessage(detail)
      setSuccessMessage(null)
    },
  })

  const handleEnroll = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    enrollMutation.mutate()
  }

  // If already enrolled, show enrolled state
  if (isEnrolled) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center text-green-600">
          <svg
            className="h-5 w-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">Enrolled</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleEnroll}
        disabled={enrollMutation.isPending}
        isLoading={enrollMutation.isPending}
        size="lg"
      >
        {enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Course'}
      </Button>

      {/* Success message */}
      {successMessage && (
        <div className="flex items-center text-sm text-green-600">
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center text-sm text-red-600">
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {errorMessage}
        </div>
      )}
    </div>
  )
}
