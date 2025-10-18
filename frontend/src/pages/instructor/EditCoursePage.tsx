/**
 * EditCoursePage.
 *
 * Page for instructors to edit existing courses.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CourseForm } from '@/components/courses/CourseForm'
import { getCourse, updateCourse } from '@/api/courses'
import type { CourseUpdate } from '@/types/course'

export const EditCoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<CourseUpdate & { id: string } | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      try {
        const course = await getCourse(courseId)
        setInitialData({
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          visibility: course.visibility,
          enrollment_capacity: course.enrollment_capacity,
          thumbnail_url: course.thumbnail_url,
          is_featured: course.is_featured,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load course'
        setError(errorMessage)
      } finally {
        setIsFetching(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleSubmit = async (data: CourseUpdate) => {
    if (!courseId) return

    setIsLoading(true)
    setError(null)

    try {
      await updateCourse(courseId, data)
      // Redirect to course content manager
      navigate(`/instructor/courses/${courseId}/content`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update course'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading course...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !initialData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {initialData && (
        <CourseForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isEdit
        />
      )}
    </div>
  )
}
