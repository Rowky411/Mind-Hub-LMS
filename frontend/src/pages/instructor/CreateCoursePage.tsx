/**
 * CreateCoursePage.
 *
 * Page for instructors to create new courses.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CourseForm } from '@/components/courses/CourseForm'
import { createCourse } from '@/api/courses'
import type { CourseCreate } from '@/types/course'

export const CreateCoursePage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: CourseCreate) => {
    setIsLoading(true)
    setError(null)

    try {
      const course = await createCourse(data)
      // Redirect to edit page where instructor can add modules and content
      navigate(`/instructor/courses/${course.id}/edit`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create course'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <CourseForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
