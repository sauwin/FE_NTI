import api from '@/shared/api/axios'
import type { CompanyProfile, CompanyUser } from '@/features/company/types/company'

export function getCompanyProfile() {
  return api.get<CompanyProfile>('/company-profile')
}

export function updateCompanyProfile(payload: CompanyProfile) {
  return api.put('/company-profile', payload)
}

export function getCompanyTasks() {
  return api.get('/company/tasks')
}

export function getPendingMembers() {
  return api.get<CompanyUser[]>('/company/members/pending')
}

export function getActiveMembers() {
  return api.get<CompanyUser[]>('/company/members/active')
}

export function approveMember(userId: number | string) {
  return api.post(`/company/members/${userId}/approve`, {})
}

export function rejectMember(userId: number | string) {
  return api.post(`/company/members/${userId}/reject`, {})
}

export function kickMember(userId: number | string) {
  return api.delete(`/company/members/${userId}/kick`)
}

export function updateMemberRole(userId: number | string, roleInOrg: string) {
  return api.patch(`/organization/members/${userId}/role`, { role_in_org: roleInOrg })
}

export function getOrganizationApplications() {
  return api.get('/applications')
}

export function updateApplicationStatus(applicationId: number | string, status: string, comment?: string) {
  return api.patch(`/applications/${applicationId}/status`, { 
    status, 
    comment: comment || '' 
  })
}
