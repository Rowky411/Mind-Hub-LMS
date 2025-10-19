/**
 * MyCoursesPage
 *
 * Displays all courses the student is enrolled in with progress tracking.
 */
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getMyEnrollments } from '@/api/enrollments'
import { CourseCard } from '@/components/courses/CourseCard'
import { Button } from '@/components/ui/Button'

export const MyCoursesPage = () => {
  const navigate = useNavigate()

  const {
    data: enrollments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['enrollments', 'my-courses'],
    queryFn: getMyEnrollments,
  })

  const handleContinueLearning = (courseId: string) => {
    navigate(`/courses/${courseId}/learn`)
  }

  const handleBrowseCourses = () => {
    navigate('/courses')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-600">Continue learning from where you left off</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to load your courses'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your courses...</p>
          </div>
        </div>
      )}

      {/* Courses List */}
      {!isLoading && enrollments && enrollments.length > 0 && (
        <div className="space-y-6">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row">
                {/* Course Thumbnail */}
                <div className="md:w-1/3">
                  {enrollment.course.thumbnail_url ? (
                    <img
                      src={enrollment.course.thumbnail_url}
                      alt={enrollment.course.title}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 md:h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-white opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {enrollment.course.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {enrollment.course.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {Math.round(enrollment.completion_percentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${enrollment.completion_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Completion Badge */}
                  {enrollment.is_completed && (
                    <div className="mb-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg
                        className="w-4 h-4 mr-1"
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
                      Completed
                    </div>
                  )}

                  {/* Enrollment Date */}
                  <p className="text-xs text-gray-500 mb-4">
                    Enrolled on {new Date(enrollment.enrollment_date).toLocaleDateString()}
                  </p>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleContinueLearning(enrollment.course.id)}
                    variant={enrollment.is_completed ? 'secondary' : 'default'}
                  >
                    {enrollment.is_completed ? 'Review Course' : 'Continue Learning'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && enrollments && enrollments.length === 0 && (
        <div className="text-center p-12 bg-white rounded-lg shadow-md">
          <svg
            className="w-20 h-20 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            You're not enrolled in any courses yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start your learning journey by exploring our course catalog
          </p>
          <Button onClick={handleBrowseCourses}>Browse Courses</Button>
        </div>
      )}
    </div>
  )
}
