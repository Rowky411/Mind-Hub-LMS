/**
 * CourseForm component.
 *
 * Form for creating or editing a course.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import type { CourseCreate, CourseUpdate, CourseVisibility } from '@/types/course'

interface CourseFormProps {
  initialData?: CourseUpdate & { id?: string }
  onSubmit: (data: CourseCreate | CourseUpdate) => void | Promise<void>
  isLoading?: boolean
  isEdit?: boolean
}

export const CourseForm = ({ initialData, onSubmit, isLoading = false, isEdit = false }: CourseFormProps) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    visibility: (initialData?.visibility || 'draft') as CourseVisibility,
    enrollment_capacity: initialData?.enrollment_capacity?.toString() || '',
    thumbnail_url: initialData?.thumbnail_url || '',
    is_featured: initialData?.is_featured || false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (formData.enrollment_capacity && parseInt(formData.enrollment_capacity) < 1) {
      newErrors.enrollment_capacity = 'Capacity must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const submitData: CourseCreate | CourseUpdate = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      visibility: formData.visibility,
      enrollment_capacity: formData.enrollment_capacity ? parseInt(formData.enrollment_capacity) : null,
      thumbnail_url: formData.thumbnail_url.trim() || null,
      is_featured: formData.is_featured,
    }

    await onSubmit(submitData)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            {isEdit ? 'Edit Course' : 'Create New Course'}
          </h2>
          <p className="text-gray-600">
            {isEdit ? 'Update your course details' : 'Fill in the details to create a new course'}
          </p>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Course Title *
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Introduction to Python Programming"
            error={errors.title}
            disabled={isLoading}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what students will learn in this course..."
            rows={5}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category *
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.category
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={isLoading}
          >
            <option value="">Select a category</option>
            <option value="programming">Programming</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
            <option value="marketing">Marketing</option>
            <option value="data-science">Data Science</option>
            <option value="personal-development">Personal Development</option>
            <option value="other">Other</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        {/* Visibility */}
        <div>
          <label htmlFor="visibility" className="block text-sm font-medium mb-2">
            Visibility
          </label>
          <select
            id="visibility"
            value={formData.visibility}
            onChange={(e) => setFormData({ ...formData, visibility: e.target.value as CourseVisibility })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="draft">Draft (only visible to you)</option>
            <option value="private">Private (invitation only)</option>
            <option value="public">Public (visible to everyone)</option>
          </select>
        </div>

        {/* Enrollment Capacity */}
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium mb-2">
            Enrollment Capacity
          </label>
          <Input
            id="capacity"
            type="number"
            value={formData.enrollment_capacity}
            onChange={(e) => setFormData({ ...formData, enrollment_capacity: e.target.value })}
            placeholder="Leave empty for unlimited"
            min="1"
            error={errors.enrollment_capacity}
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Maximum number of students (leave empty for unlimited)
          </p>
        </div>

        {/* Thumbnail URL */}
        <div>
          <label htmlFor="thumbnail" className="block text-sm font-medium mb-2">
            Thumbnail URL
          </label>
          <Input
            id="thumbnail"
            type="url"
            value={formData.thumbnail_url}
            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
            placeholder="https://example.com/image.jpg"
            disabled={isLoading}
          />
        </div>

        {/* Featured */}
        <div className="flex items-center">
          <input
            id="featured"
            type="checkbox"
            checked={formData.is_featured}
            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
            Feature this course on the homepage
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
