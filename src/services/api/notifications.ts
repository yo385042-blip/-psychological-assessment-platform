/**
 * 通知管理 API
 * 包括获取通知列表、标记已读、删除通知等
 */

import apiClient from './client'
import { Notification, NotificationType } from '@/types'

export interface NotificationListParams {
  page?: number
  pageSize?: number
  type?: NotificationType
  read?: boolean
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  page: number
  pageSize: number
}

export interface MarkReadRequest {
  notificationIds: string[]
}

export interface MarkAllReadResponse {
  markedCount: number
}

/**
 * 获取通知列表
 */
export async function getNotificationList(
  params?: NotificationListParams
): Promise<{ success: boolean; data?: NotificationListResponse; message?: string }> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
  if (params?.type) queryParams.append('type', params.type)
  if (params?.read !== undefined) queryParams.append('read', params.read.toString())

  const endpoint = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await apiClient.get<NotificationListResponse>(endpoint)

  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount(): Promise<{
  success: boolean
  data?: { count: number }
  message?: string
}> {
  const response = await apiClient.get<{ count: number }>('/notifications/unread-count')
  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 标记通知为已读
 */
export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch(`/notifications/${notificationId}/read`)
  return {
    success: response.success,
    message: response.message || (response.success ? '已标记为已读' : '标记失败'),
  }
}

/**
 * 批量标记通知为已读
 */
export async function markNotificationsRead(
  data: MarkReadRequest
): Promise<{ success: boolean; message?: string; data?: MarkAllReadResponse }> {
  const response = await apiClient.patch<MarkAllReadResponse>('/notifications/mark-read', data)
  return {
    success: response.success,
    message: response.message || (response.success ? '批量标记成功' : '批量标记失败'),
    data: response.data,
  }
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsRead(): Promise<{
  success: boolean
  message?: string
  data?: MarkAllReadResponse
}> {
  const response = await apiClient.post<MarkAllReadResponse>('/notifications/mark-all-read')
  return {
    success: response.success,
    message: response.message || (response.success ? '已标记全部为已读' : '标记失败'),
    data: response.data,
  }
}

/**
 * 删除通知
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.delete(`/notifications/${notificationId}`)
  return {
    success: response.success,
    message: response.message || (response.success ? '通知删除成功' : '通知删除失败'),
  }
}

/**
 * 批量删除通知
 */
export async function batchDeleteNotifications(
  notificationIds: string[]
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post('/notifications/batch-delete', { notificationIds })
  return {
    success: response.success,
    message: response.message || (response.success ? '批量删除成功' : '批量删除失败'),
  }
}

