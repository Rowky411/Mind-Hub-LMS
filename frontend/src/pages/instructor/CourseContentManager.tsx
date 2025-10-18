/**
 * CourseContentManager.
 *
 * Page for instructors to manage course content and modules.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ContentUpload } from '@/components/courses/ContentUpload'
import { ModuleList } from '@/components/courses/ModuleList'
import { getCourse } from '@/api/courses'
import type { Course, Module } from '@/types/course'

export const CourseContentManager = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      try {
        const courseData = await getCourse(courseId)
        setCourse(courseData)
        // TODO: Fetch modules when module API is implemented
        setModules([])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load course'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleUploadComplete = (contentId: string) => {
    setShowUpload(false)
    // TODO: Refresh content list when implemented
    console.log('Content uploaded:', contentId)
  }

  const handleUploadError = (error: string) => {
    alert(`Upload failed: ${error}`)
  }

  const handleModuleReorder = (reorderedModules: Module[]) => {
    setModules(reorderedModules)
    // TODO: Call API to update module order when implemented
    console.log('Modules reordered:', reorderedModules)
  }

  const handleModuleEdit = (module: Module) => {
    // TODO: Implement module edit dialog
    console.log('Edit module:', module)
  }

  const handleModuleDelete = (moduleId: string) => {
    // TODO: Call API to delete module when implemented
    setModules((prev) => prev.filter((m) => m.id !== moduleId))
    console.log('Delete module:', moduleId)
  }

  const handleCreateModule = () => {
    // TODO: Implement module creation dialog
    console.log('Create module')
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading course...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-sm text-red-600">{error || 'Course not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/instructor/courses')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Courses
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600">Manage your course content and modules</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(`/instructor/courses/${courseId}/edit`)}>
            Edit Details
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Modules Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Course Modules</h2>
              <Button onClick={handleCreateModule}>Create Module</Button>
            </div>

            <ModuleList
              modules={modules}
              onReorder={handleModuleReorder}
              onEdit={handleModuleEdit}
              onDelete={handleModuleDelete}
              isEditable
            />
          </div>

          {/* Content Upload Section */}
          {showUpload && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Upload Content</h2>
                <Button variant="secondary" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
              </div>

              <ContentUpload
                courseId={courseId!}
                moduleId={selectedModule}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </div>
          )}

          {!showUpload && (
            <Card>
              <div className="p-8 text-center">
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Course Content</h3>
                <p className="text-gray-600 mb-4">
                  Add videos, documents, or text content to your course
                </p>
                <Button onClick={() => setShowUpload(true)}>Upload Content</Button>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Stats */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Modules</span>
                  <span className="font-semibold">{modules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Content Items</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold">
                    {course.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => navigate(`/courses/${courseId}`)}
                >
                  Preview Course
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => console.log('Publish course')}
                >
                  {course.is_published ? 'Unpublish Course' : 'Publish Course'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
