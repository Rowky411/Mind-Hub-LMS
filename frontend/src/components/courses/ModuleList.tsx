/**
 * ModuleList component.
 *
 * Displays list of modules with reorder functionality.
 */
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ContentList } from './ContentList'
import { getModuleContent } from '@/api/content'
import type { Module, ContentItem } from '@/types/course'

interface ModuleListProps {
  modules: Module[]
  onModuleClick?: (module: Module) => void
  onReorder?: (modules: Module[]) => void
  onEdit?: (module: Module) => void
  onDelete?: (moduleId: string) => void
  onAddContent?: (module: Module) => void
  onDeleteContent?: (contentId: string) => void
  isEditable?: boolean
  showContent?: boolean
}

export const ModuleList = ({
  modules,
  onModuleClick,
  onReorder,
  onEdit,
  onDelete,
  onAddContent,
  onDeleteContent,
  isEditable = false,
  showContent = false,
}: ModuleListProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [moduleContent, setModuleContent] = useState<Record<string, ContentItem[]>>({})
  const [loadingContent, setLoadingContent] = useState<Set<string>>(new Set())

  const sortedModules = [...modules].sort((a, b) => a.order_index - b.order_index)

  const toggleModule = async (moduleId: string) => {
    const newExpanded = new Set(expandedModules)

    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)

      // Fetch content if not already loaded
      if (!moduleContent[moduleId] && showContent) {
        setLoadingContent(new Set(loadingContent).add(moduleId))
        try {
          const content = await getModuleContent(moduleId)
          setModuleContent({ ...moduleContent, [moduleId]: content })
        } catch (error) {
          console.error('Failed to load module content:', error)
        } finally {
          const newLoading = new Set(loadingContent)
          newLoading.delete(moduleId)
          setLoadingContent(newLoading)
        }
      }
    }

    setExpandedModules(newExpanded)
  }

  // Auto-expand all modules and fetch content if showContent is true
  useEffect(() => {
    if (showContent && modules.length > 0) {
      const allModuleIds = new Set(modules.map(m => m.id))
      setExpandedModules(allModuleIds)

      // Fetch content for all modules
      modules.forEach(async (module) => {
        if (!moduleContent[module.id]) {
          try {
            const content = await getModuleContent(module.id)
            setModuleContent(prev => ({ ...prev, [module.id]: content }))
          } catch (error) {
            console.error(`Failed to load content for module ${module.id}:`, error)
          }
        }
      })
    }
  }, [showContent, modules.length])

  const handleDragStart = (index: number) => {
    if (isEditable) {
      setDraggedIndex(index)
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (isEditable) {
      setHoveredIndex(index)
    }
  }

  const handleDragLeave = () => {
    setHoveredIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()

    if (!isEditable || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setHoveredIndex(null)
      return
    }

    const reorderedModules = [...sortedModules]
    const [draggedModule] = reorderedModules.splice(draggedIndex, 1)
    reorderedModules.splice(targetIndex, 0, draggedModule)

    // Update order_index for all modules
    const updatedModules = reorderedModules.map((module, index) => ({
      ...module,
      order_index: index,
    }))

    if (onReorder) {
      onReorder(updatedModules)
    }

    setDraggedIndex(null)
    setHoveredIndex(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return

    const reorderedModules = [...sortedModules]
    const temp = reorderedModules[index]
    reorderedModules[index] = reorderedModules[index - 1]
    reorderedModules[index - 1] = temp

    const updatedModules = reorderedModules.map((module, idx) => ({
      ...module,
      order_index: idx,
    }))

    if (onReorder) {
      onReorder(updatedModules)
    }
  }

  const handleMoveDown = (index: number) => {
    if (index === sortedModules.length - 1) return

    const reorderedModules = [...sortedModules]
    const temp = reorderedModules[index]
    reorderedModules[index] = reorderedModules[index + 1]
    reorderedModules[index + 1] = temp

    const updatedModules = reorderedModules.map((module, idx) => ({
      ...module,
      order_index: idx,
    }))

    if (onReorder) {
      onReorder(updatedModules)
    }
  }

  if (sortedModules.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-gray-600">No modules yet.</p>
          {isEditable && (
            <p className="text-sm text-gray-500 mt-2">
              Create modules to organize your course content.
            </p>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {sortedModules.map((module, index) => (
        <Card
          key={module.id}
          draggable={isEditable}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          className={`transition-all ${
            draggedIndex === index ? 'opacity-50' : ''
          } ${
            hoveredIndex === index ? 'border-blue-500 border-2' : ''
          } ${
            isEditable ? 'cursor-move' : ''
          }`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              {/* Module Info */}
              <div className="flex-1">
                <div
                  className={`flex items-center gap-2 mb-1 ${showContent ? 'cursor-pointer' : ''}`}
                  onClick={() => showContent && toggleModule(module.id)}
                >
                  {showContent && (
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        expandedModules.has(module.id) ? 'transform rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                  <span className="text-sm font-medium text-gray-500">Module {index + 1}</span>
                  {isEditable && (
                    <span className="text-xs text-gray-400">(Drag to reorder)</span>
                  )}
                  {showContent && moduleContent[module.id] && (
                    <span className="text-xs text-gray-500">
                      ({moduleContent[module.id].length} items)
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{module.title}</h3>
                {module.description && (
                  <p className="text-sm text-gray-600">{module.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {/* Add Content Button */}
                {onAddContent && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => onAddContent(module)}
                  >
                    Add Content
                  </Button>
                )}

                {isEditable && (
                  <>
                  {/* Move Up/Down Buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === sortedModules.length - 1}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg
                        className="w-4 h-4"
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
                  </div>

                  {/* Edit Button */}
                  {onEdit && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(module)}
                    >
                      Edit
                    </Button>
                  )}

                  {/* Delete Button */}
                  {onDelete && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete module "${module.title}"?`)) {
                          onDelete(module.id)
                        }
                      }}
                    >
                      Delete
                    </Button>
                  )}
                  </>
                )}
              </div>
            </div>

            {/* Content Items */}
            {showContent && expandedModules.has(module.id) && (
              <div className="mt-4 border-t pt-4">
                {loadingContent.has(module.id) ? (
                  <div className="pl-8 py-2">
                    <p className="text-sm text-gray-500">Loading content...</p>
                  </div>
                ) : (
                  <ContentList
                    content={moduleContent[module.id] || []}
                    isEditable={isEditable}
                    onDelete={onDeleteContent}
                  />
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
