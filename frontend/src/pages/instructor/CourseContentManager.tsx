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
import { ModuleForm } from '@/components/courses/ModuleForm'
import { ModuleEditForm } from '@/components/courses/ModuleEditForm'
import { getCourse } from '@/api/courses'
import { getCourseModules, deleteModule } from '@/api/modules'
import { deleteContent } from '@/api/content'
import type { Course, Module } from '@/types/course'

export const CourseContentManager = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showModuleEditForm, setShowModuleEditForm] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      try {
        const [courseData, modulesData] = await Promise.all([
          getCourse(courseId),
          getCourseModules(courseId),
        ])
        setCourse(courseData)
        setModules(modulesData)
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
    setEditingModule(module)
    setShowModuleEditForm(true)
  }

  const handleModuleUpdated = (updatedModule: Module) => {
    setModules((prev) =>
      prev.map((m) => (m.id === updatedModule.id ? updatedModule : m))
    )
  }

  const handleModuleDelete = async (moduleId: string) => {
    try {
      await deleteModule(moduleId)
      setModules((prev) => prev.filter((m) => m.id !== moduleId))
    } catch (err) {
      alert('Failed to delete module')
    }
  }

  const handleCreateModule = () => {
    setShowModuleForm(true)
  }

  const handleModuleCreated = (newModule: Module) => {
    setModules((prev) => [...prev, newModule])
  }

  const handleAddContent = (module: Module) => {
    setSelectedModule(module)
    setShowUpload(true)
  }

  const handleDeleteContent = async (contentId: string) => {
    try {
      await deleteContent(contentId)
      // Refresh modules to update content display
      const modulesData = await getCourseModules(courseId!)
      setModules(modulesData)
    } catch (err) {
      alert('Failed to delete content')
    }
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
      {/* Module Creation Form */}
      <ModuleForm
        isOpen={showModuleForm}
        onClose={() => setShowModuleForm(false)}
        courseId={courseId!}
        existingModulesCount={modules.length}
        onModuleCreated={handleModuleCreated}
      />

      {/* Module Edit Form */}
      {editingModule && (
        <ModuleEditForm
          isOpen={showModuleEditForm}
          onClose={() => {
            setShowModuleEditForm(false)
            setEditingModule(null)
          }}
          module={editingModule}
          onModuleUpdated={handleModuleUpdated}
        />
      )}

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
              onAddContent={handleAddContent}
              onDeleteContent={handleDeleteContent}
              isEditable
              showContent
            />
          </div>

          {/* Content Upload Section */}
          {showUpload && selectedModule && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Upload Content</h2>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowUpload(false)
                    setSelectedModule(null)
                  }}
                >
                  Cancel
                </Button>
              </div>

              <ContentUpload
                courseId={courseId!}
                moduleId={selectedModule.id}
                moduleName={selectedModule.title}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </div>
          )}

          {!showUpload && modules.length > 0 && (
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Add Content
                </h3>
                <p className="text-gray-600 mb-4">
                  Click "Add Content" on any module to upload videos, documents, or text content
                </p>
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
