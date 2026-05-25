import api from '@/shared/api/axios'
import type { AdminCall, AdminProgram, BulkNotificationPayload, CallPayload, CreateAdminPayload } from '@/features/admin/types/admin'

export function getDashboardStats() {
  return api.get('/admin/reporting/dashboard-stats')
}

export function getAdminUsers() {
  return api.get('/admin/users')
}

export function getPendingApprovals() {
  return api.get('/admin/approvals')
}

export function approveUser(userId: number | string) {
  return api.post(`/admin/approve/${userId}`)
}

export function blockUser(userId: number | string) {
  return api.post(`/admin/block/${userId}`)
}

export function unblockUser(userId: number | string) {
  return api.post(`/admin/unblock/${userId}`)
}

export function deleteAdminUser(userId: number | string) {
  return api.delete(`/admin/users/${userId}`)
}

export function removeUserRole(userId: number | string, role: string) {
  return api.delete(`/admin/users/${userId}/roles`, { data: { role } })
}

export function addUserRole(userId: number | string, role: string) {
  return api.post(`/admin/users/${userId}/roles`, { role })
}

export function createAdmin(payload: CreateAdminPayload) {
  return api.post('/admin/create-admin', payload)
}

export function getAdminPrograms() {
  return api.get<AdminProgram[]>('/admin/programs')
}

export function getAdminCalls() {
  return api.get<AdminCall[]>('/admin/calls')
}

export function getAdminCallById(id: number | string) {
  return api.get(`/admin/calls/${id}`)
}

export function createAdminCall(payload: CallPayload | Record<string, unknown>) {
  return api.post('/admin/calls', payload)
}

export function updateAdminCall(id: number | string, payload: CallPayload | Record<string, unknown>) {
  return api.put(`/admin/calls/${id}`, payload)
}

export function updateAdminCallStatus(id: number | string, status: string) {
  return api.patch(`/admin/calls/${id}/status`, { status })
}

export function deleteAdminCall(id: number | string) {
  return api.delete(`/admin/calls/${id}`)
}

export function exportCalls(params: Record<string, unknown>) {
  return api.get('/admin/export/calls', { params, responseType: 'blob' })
}

export function getAdminApplications(params?: Record<string, unknown>) {
  return api.get('/admin/applications', { params })
}

export function getAdminApplicationById(id: number | string) {
  return api.get(`/admin/applications/${id}`)
}

export function updateAdminApplicationStatus(id: number | string, status: string) {
  return api.patch(`/admin/applications/${id}/status`, { status })
}

export function exportApplications(params: Record<string, unknown>) {
  return api.get('/admin/export/applications', { params, responseType: 'blob' })
}

export function exportUsers(params: Record<string, unknown>) {
  return api.get('/admin/export/users', { params, responseType: 'blob' })
}

export function exportNotifications(params: Record<string, unknown>) {
  return api.get('/admin/export/notifications', { params, responseType: 'blob' })
}

export function getNotificationHistory() {
  return api.get('/admin/notifications/history')
}

export function sendBulkNotification(payload: BulkNotificationPayload) {
  return api.post('/admin/notifications/bulk', payload)
}

export function getAdminDocuments(params?: Record<string, unknown>) {
  return api.get('/admin/documents', { params })
}

export function getAdminLogs(params?: Record<string, unknown>) {
  return api.get('/admin/logs', { params })
}

export function getAdminUsersList() {
  return api.get('/admin/admin-users')
}

export function getAdminMentorships(params?: { application_id?: number }) {
  return api.get('/admin/mentorships', { params })
}

export function assignMentorship(payload: { application_id: number; mentor_id: number; student_id: number }) {
  return api.post('/mentorships/assign', payload)
}

export function deleteMentorship(mentorshipId: number | string) {
  return api.delete(`/mentorships/${mentorshipId}`)
}
