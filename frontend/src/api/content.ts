/**
 * Content API client.
 *
 * Handles content upload and retrieval.
 */
import { apiClient } from './client'
import type { ContentItem, ContentItemUploadResponse } from '@/types/course'

/**
 * Upload content item (video or document).
 */
export const uploadContent = async (formData: FormData): Promise<ContentItemUploadResponse> => {
  const response = await apiClient.post<ContentItemUploadResponse>('/content', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

/**
 * Get all content items for a module.
 */
export const getModuleContent = async (moduleId: string): Promise<ContentItem[]> => {
  const response = await apiClient.get<ContentItem[]>('/content', {
    params: { module_id: moduleId }
  })
  return response.data
}

/**
 * Get content item by ID.
 */
export const getContent = async (contentId: string): Promise<ContentItem> => {
  const response = await apiClient.get<ContentItem>(`/content/${contentId}`)
  return response.data
}

/**
 * Delete a content item.
 */
export const deleteContent = async (contentId: string): Promise<void> => {
  await apiClient.delete(`/content/${contentId}`)
}
