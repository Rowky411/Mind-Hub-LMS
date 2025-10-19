/**
 * CoursePlayerPage
 *
 * Main course learning interface where students can:
 * - View course modules and content
 * - Play videos
 * - Read documents
 * - Track progress
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCourse } from '@/api/courses'
import { getCourseModules } from '@/api/modules'
import { getModuleContent } from '@/api/content'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Button } from '@/components/ui/Button'
import type { Module, ContentItem, ContentType } from '@/types/course'

interface ModuleWithContent extends Module {
  content: ContentItem[]
}

export const CoursePlayerPage = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Fetch course details
  const {
    data: course,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => getCourse(courseId!),
    enabled: !!courseId,
  })

  // Fetch modules
  const {
    data: modules,
    isLoading: isLoadingModules,
  } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => getCourseModules(courseId!),
    enabled: !!courseId,
  })

  // Fetch content for all modules
  const {
    data: modulesWithContent,
    isLoading: isLoadingContent,
  } = useQuery({
    queryKey: ['course-content', courseId],
    queryFn: async () => {
      if (!modules) return []

      const modulesWithContent: ModuleWithContent[] = await Promise.all(
        modules.map(async (module) => {
          const content = await getModuleContent(module.id)
          return { ...module, content }
        })
      )
      return modulesWithContent
    },
    enabled: !!modules && modules.length > 0,
  })

  // Auto-select first video content when modules load
  useEffect(() => {
    if (modulesWithContent && modulesWithContent.length > 0 && !selectedContent) {
      // Find first video content
      for (const module of modulesWithContent) {
        const firstVideo = module.content.find((item) => item.content_type === 'video')
        if (firstVideo) {
          setSelectedContent(firstVideo)
          setExpandedModules(new Set([module.id]))
          break
        }
      }
    }
  }, [modulesWithContent, selectedContent])

  const handleBackToCourses = () => {
    navigate('/my-courses')
  }

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const handleContentSelect = (content: ContentItem) => {
    setSelectedContent(content)
  }

  const getContentIcon = (contentType: ContentType) => {
    switch (contentType) {
      case 'video':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'document':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
      case 'text':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )
    }
  }

  const isLoading = isLoadingCourse || isLoadingModules || isLoadingContent
  const error = courseError

  if (!courseId) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center p-12">
          <p className="text-red-600">Course ID not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToCourses}>
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to My Courses
            </Button>
            {course && (
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {course.title}
              </h1>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : 'Failed to load course'}
            </p>
            <Button onClick={handleBackToCourses}>Back to My Courses</Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading course content...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && course && (
        <div className="flex-1 flex overflow-hidden">
          {/* Content Player - Left Side (2/3) */}
          <div className="flex-1 bg-gray-900 flex items-center justify-center p-6">
            {selectedContent ? (
              <div className="w-full max-w-5xl">
                {selectedContent.content_type === 'video' && selectedContent.file_url ? (
                  <VideoPlayer videoUrl={selectedContent.file_url} title={selectedContent.title} />
                ) : selectedContent.content_type === 'document' && selectedContent.file_url ? (
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">{selectedContent.title}</h3>
                    {selectedContent.description && (
                      <p className="text-gray-600 mb-4">{selectedContent.description}</p>
                    )}
                    <a
                      href={selectedContent.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Document
                    </a>
                  </div>
                ) : selectedContent.content_type === 'text' && selectedContent.text_content ? (
                  <div className="bg-white rounded-lg p-6 max-h-full overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">{selectedContent.title}</h3>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{selectedContent.text_content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-white text-center">
                    <p>Content type not supported or content unavailable</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 p-8">
                <svg
                  className="w-20 h-20 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-lg">Select a lesson to start learning</p>
              </div>
            )}
          </div>

          {/* Course Sidebar - Right Side (1/3) */}
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Course Content</h2>

              {/* Course description */}
              <div className="mb-6">
                <p className="text-sm text-gray-600">{course.description}</p>
              </div>

              {/* Modules and Content */}
              {modulesWithContent && modulesWithContent.length > 0 ? (
                <div className="space-y-3">
                  {modulesWithContent.map((module, moduleIndex) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-500">
                            {moduleIndex + 1}
                          </span>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {module.title}
                            </h3>
                            {module.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                {module.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            expandedModules.has(module.id) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Module Content Items */}
                      {expandedModules.has(module.id) && (
                        <div className="divide-y divide-gray-100">
                          {module.content.length > 0 ? (
                            module.content.map((content) => (
                              <button
                                key={content.id}
                                onClick={() => handleContentSelect(content)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                                  selectedContent?.id === content.id
                                    ? 'bg-blue-50 border-l-4 border-blue-600'
                                    : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`mt-0.5 ${
                                      selectedContent?.id === content.id
                                        ? 'text-blue-600'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {getContentIcon(content.content_type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm font-medium ${
                                        selectedContent?.id === content.id
                                          ? 'text-blue-900'
                                          : 'text-gray-900'
                                      }`}
                                    >
                                      {content.title}
                                    </p>
                                    {content.duration_seconds && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {Math.floor(content.duration_seconds / 60)} min
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 italic">
                              No content available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm">No modules available yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
