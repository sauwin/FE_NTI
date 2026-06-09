import api from '@/shared/api/axios'
import type { 
  AdminCall, 
  AdminProgram, 
  BulkNotificationPayload, 
  CallPayload, 
  CreateAdminPayload, 
  EvaluationCriterionPayload, 
  FinalizeEvaluationPayload 
} from '@/features/admin/types/admin'

export function getDashboardStats() {
  return api.get('/admin/reporting/dashboard-stats')
}

export function getAdminUsers(params?: Record<string, any>) {
  return api.get('/admin/users', { params })
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

export function addUserRole(userId: number | string, payload: { 
  role: string, 
  registration_number?: string, 
  role_in_org?: string 
}) {
  return api.post(`/admin/users/${userId}/roles`, payload)
}

export function createAdmin(payload: CreateAdminPayload) {
  return api.post('/admin/create-admin', payload)
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
  return api.patch(`/applications/${id}/status`, { status })
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
  return api.delete(`admin/mentorships/${mentorshipId}`)
}

export function scheduleCallEvaluation(callId: number, payload: { evaluation_scheduled_at: string }) {
  return api.patch(`/admin/calls/${callId}/schedule-evaluation`, payload)
}

export function moveApplicationsUnderEvaluation(callId: number) {
  return api.post(`/admin/calls/${callId}/move-applications`)
}

export function getCallEvaluationInfo(callId: number) {
  return api.get(`/admin/calls/${callId}/evaluation-info`)
}

export function changeCallEvaluationCriteria(callId: number, payload: EvaluationCriterionPayload) {
  return api.put(`admin/calls/${callId}/criteria`, payload)
}

export function getApplicationEvaluations(applicationId: number) {
  return api.get(`admin/applications/${applicationId}/evaluations`)
}

export function finalizeEvaluation(applicationId: number, payload: FinalizeEvaluationPayload) {
  return api.post(`admin/applications/${applicationId}/finalize-evaluation`, payload)
}

export function getAdminCompanies(params?: Record<string, unknown>) {
  return api.get('admin/company', { params })
}

export function approveCompany(companyId: number) {
  return api.post(`admin/company/approve/${companyId}`)
}

export function rejectCompany(companyId: number) {
  return api.post(`admin/company/reject/${companyId}`)
}

export function activateCompany(companyId: number) {
  return api.post(`admin/company/activate/${companyId}`)
}

export function deactivateCompany(companyId: number) {
  return api.post(`admin/company/deactivate/${companyId}`)
}

export function deleteCompany(companyId: number) {
  return api.delete(`admin/company/delete/${companyId}`)
}

export function exportCompanies(params: Record<string, unknown>) {
  return api.get('/admin/export/company', { params, responseType: 'blob' })
}

export function updateCompanyPartnerStatus(companyId: number, payload: Record<string, unknown>) {
  return api.post(`/admin/company/partner-status/${companyId}`, payload)
}

export function getAdminTasks(params?: { status?: string; search?: string; page?: number; per_page?: number }) {
  return api.get('/admin/tasks', { params })
}

export function adminAdvanceTaskStatus(taskId: number | string, productOwnerUserId?: number) {
  return api.patch(`/admin/tasks/${taskId}/advance`, {
    ...(productOwnerUserId ? { product_owner_user_id: productOwnerUserId } : {}),
  })
}

export function adminSetTaskStatus(taskId: number | string, status: string, productOwnerUserId?: number) {
  return api.patch(`/admin/tasks/${taskId}/status`, {
    status,
    ...(productOwnerUserId ? { product_owner_user_id: productOwnerUserId } : {}),
  })
}

export function exportTasks(params: Record<string, unknown>) {
  return api.get('/admin/export/tasks', { params, responseType: 'blob' })
}