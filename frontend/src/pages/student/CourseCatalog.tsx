/**
 * CourseCatalog.
 *
 * Page displaying all published courses with filtering and pagination.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { CourseCard } from '@/components/courses/CourseCard'
import { getCourses } from '@/api/courses'
import type { Course } from '@/types/course'

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'personal-development', label: 'Personal Development' },
  { value: 'other', label: 'Other' },
]

export const CourseCatalog = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  )
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || ''
  )
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(
    searchParams.get('featured') === 'true'
  )

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await getCourses({
          page: currentPage,
          per_page: 12,
          category: selectedCategory || undefined,
          is_featured: showFeaturedOnly || undefined,
        })

        setCourses(response.courses)
        setTotalPages(response.total_pages)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load courses'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [currentPage, selectedCategory, showFeaturedOnly])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    const params = new URLSearchParams()
    params.set('page', '1')
    if (category) params.set('category', category)
    if (showFeaturedOnly) params.set('featured', 'true')
    setSearchParams(params)
  }

  const handleFeaturedToggle = () => {
    const newValue = !showFeaturedOnly
    setShowFeaturedOnly(newValue)
    setCurrentPage(1)
    const params = new URLSearchParams()
    params.set('page', '1')
    if (selectedCategory) params.set('category', selectedCategory)
    if (newValue) params.set('featured', 'true')
    setSearchParams(params)
  }

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Catalog</h1>
        <p className="text-gray-600">Explore our collection of courses</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        {/* Category Filter */}
        <div className="flex-1">
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Featured Filter */}
        <div className="flex items-end">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showFeaturedOnly}
              onChange={handleFeaturedToggle}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Featured courses only
            </span>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading courses...</p>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {!isLoading && courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => handleCourseClick(course.id)}
                showInstructor
                showEnrollment
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and adjacent pages
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1

                  if (!showPage) {
                    // Show ellipsis
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <span key={page} className="px-3 py-2 text-gray-500">
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-md ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <Button
                variant="secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && courses.length === 0 && (
        <div className="text-center p-12">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">
            {selectedCategory || showFeaturedOnly
              ? 'Try adjusting your filters'
              : 'Check back later for new courses'}
          </p>
        </div>
      )}
    </div>
  )
}
