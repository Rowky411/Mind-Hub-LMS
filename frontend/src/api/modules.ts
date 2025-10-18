/**
 * Modules API client.
 *
 * Handles all module-related API calls.
 */
import { apiClient } from './client'
import type { Module, ModuleCreate, ModuleUpdate } from '@/types/course'

/**
 * Create a new module.
 */
export const createModule = async (moduleData: ModuleCreate): Promise<Module> => {
  const response = await apiClient.post<Module>('/modules', moduleData)
  return response.data
}

/**
 * Get all modules for a course.
 */
export const getCourseModules = async (courseId: string): Promise<Module[]> => {
  const response = await apiClient.get<Module[]>('/modules', {
    params: { course_id: courseId }
  })
  return response.data
}

/**
 * Get module by ID.
 */
export const getModule = async (moduleId: string): Promise<Module> => {
  const response = await apiClient.get<Module>(`/modules/${moduleId}`)
  return response.data
}

/**
 * Update an existing module.
 */
export const updateModule = async (
  moduleId: string,
  moduleData: ModuleUpdate
): Promise<Module> => {
  const response = await apiClient.put<Module>(`/modules/${moduleId}`, moduleData)
  return response.data
}

/**
 * Delete a module.
 */
export const deleteModule = async (moduleId: string): Promise<void> => {
  await apiClient.delete(`/modules/${moduleId}`)
}
