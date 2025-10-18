/**
 * ModuleForm component.
 *
 * Form for creating and editing course modules.
 */
import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createModule } from '@/api/modules'
import type { Module, ModuleCreate } from '@/types/course'

interface ModuleFormProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  existingModulesCount: number
  onModuleCreated: (module: Module) => void
}

export const ModuleForm = ({
  isOpen,
  onClose,
  courseId,
  existingModulesCount,
  onModuleCreated,
}: ModuleFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const moduleData: ModuleCreate = {
        course_id: courseId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        order_index: existingModulesCount,
      }

      const newModule = await createModule(moduleData)
      onModuleCreated(newModule)

      // Reset form
      setFormData({ title: '', description: '' })
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create module'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ title: '', description: '' })
      setError(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Module"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.title.trim()}>
            {isSubmitting ? 'Creating...' : 'Create Module'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="module-title" className="block text-sm font-medium text-gray-700 mb-1">
            Module Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="module-title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Introduction to Python"
            maxLength={200}
            required
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="module-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (Optional)
          </label>
          <textarea
            id="module-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of what this module covers..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div className="text-sm text-gray-500">
          <p>This module will be added as Module #{existingModulesCount + 1}</p>
        </div>
      </form>
    </Modal>
  )
}
