/**
 * ContentUpload component.
 *
 * File upload component with drag-and-drop support.
 */
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { uploadContent } from '@/api/content'
import type { ContentType } from '@/types/course'

interface ContentUploadProps {
  courseId: string
  moduleId: string
  moduleName: string
  onUploadComplete?: (contentId: string) => void
  onUploadError?: (error: string) => void
}

export const ContentUpload = ({
  courseId,
  moduleId,
  moduleName,
  onUploadComplete,
  onUploadError,
}: ContentUploadProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState<ContentType>('video' as ContentType)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (file: File) => {
    const newErrors: Record<string, string> = {}

    // Size validation (2GB limit)
    const MAX_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
    if (file.size > MAX_SIZE) {
      newErrors.file = 'File size exceeds 2GB limit'
      setErrors(newErrors)
      return
    }

    // Type validation based on content type
    const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]

    if (contentType === 'video' && !videoTypes.includes(file.type)) {
      newErrors.file = 'Invalid video file type. Please upload MP4, MOV, AVI, or WebM'
      setErrors(newErrors)
      return
    }

    if (contentType === 'document' && !documentTypes.includes(file.type)) {
      newErrors.file = 'Invalid document file type. Please upload PDF, DOC, DOCX, PPT, or PPTX'
      setErrors(newErrors)
      return
    }

    setFile(file)
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '')) // Remove extension
    }
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!file && contentType !== 'text') {
      newErrors.file = 'Please select a file to upload'
    }

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    }

    if (!moduleId) {
      newErrors.module = 'Module is required for content upload'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('course_id', courseId)
      formData.append('module_id', moduleId)
      formData.append('title', title.trim())
      formData.append('content_type', contentType)
      formData.append('order_index', '0') // Will be updated by reordering

      if (file && contentType !== 'text') {
        formData.append('file', file)
      }

      if (description) {
        formData.append('description', description.trim())
      }

      if (contentType === 'text') {
        formData.append('text_content', description || title)
      }

      // Simulate progress (in production, use XMLHttpRequest or axios with progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await uploadContent(formData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Reset form
      setFile(null)
      setTitle('')
      setDescription('')
      setUploadProgress(0)
      setIsUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (onUploadComplete) {
        onUploadComplete(response.content_item.id)
      }
    } catch (error) {
      setIsUploading(false)
      setUploadProgress(0)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setErrors({ submit: errorMessage })

      if (onUploadError) {
        onUploadError(errorMessage)
      }
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div>
          <h3 className="text-xl font-bold mb-2">Upload Content</h3>
          <p className="text-gray-600">Add content to module: <strong>{moduleName}</strong></p>
        </div>

        {/* Content Type Selector */}
        <div>
          <label htmlFor="contentType" className="block text-sm font-medium mb-2">
            Content Type *
          </label>
          <select
            id="contentType"
            value={contentType}
            onChange={(e) => {
              setContentType(e.target.value as ContentType)
              setFile(null)
              setErrors({})
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          >
            <option value="video">Video</option>
            <option value="document">Document</option>
            <option value="text">Text Content</option>
          </select>
        </div>

        {/* File Upload (for video and document types) */}
        {contentType !== 'text' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              File *
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : errors.file
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept={
                  contentType === 'video'
                    ? 'video/mp4,video/quicktime,video/x-msvideo,video/webm'
                    : 'application/pdf,.doc,.docx,.ppt,.pptx'
                }
                className="hidden"
                disabled={isUploading}
              />

              {file ? (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600">
                    Drag and drop your file here, or
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Browse Files
                  </Button>
                  <p className="text-xs text-gray-500">
                    Maximum file size: 2GB
                  </p>
                </div>
              )}
            </div>
            {errors.file && (
              <p className="mt-1 text-sm text-red-600">{errors.file}</p>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Introduction to Variables"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.title
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={isUploading}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this content..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Content'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
