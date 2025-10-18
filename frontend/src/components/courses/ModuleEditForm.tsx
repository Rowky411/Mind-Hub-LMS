/**
 * ModuleEditForm component.
 *
 * Form for editing existing course modules.
 */
import { useState, FormEvent, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { updateModule } from '@/api/modules'
import type { Module, ModuleUpdate } from '@/types/course'

interface ModuleEditFormProps {
  isOpen: boolean
  onClose: () => void
  module: Module
  onModuleUpdated: (module: Module) => void
}

export const ModuleEditForm = ({
  isOpen,
  onClose,
  module,
  onModuleUpdated,
}: ModuleEditFormProps) => {
  const [formData, setFormData] = useState({
    title: module.title,
    description: module.description || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update form when module changes
  useEffect(() => {
    setFormData({
      title: module.title,
      description: module.description || '',
    })
  }, [module])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const moduleData: ModuleUpdate = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
      }

      const updatedModule = await updateModule(module.id, moduleData)
      onModuleUpdated(updatedModule)

      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update module'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: module.title,
        description: module.description || '',
      })
      setError(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Module"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.title.trim()}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
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
          <label htmlFor="edit-module-title" className="block text-sm font-medium text-gray-700 mb-1">
            Module Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="edit-module-title"
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
            htmlFor="edit-module-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (Optional)
          </label>
          <textarea
            id="edit-module-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of what this module covers..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  )
}
