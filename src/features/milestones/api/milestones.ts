import api from '@/shared/api/axios'

export interface MilestonePayload {
    title: string
    due_date: string
    description?: string
}

export interface MilestoneStatusPayload {
    status: 'pending' | 'in_progress' | 'completed' | 'overdue'
}

export function getMilestones(applicationId: number | string) {
    return api.get(`/applications/${applicationId}/milestones`)
}

export function getMilestoneById(id: number | string) {
    return api.get(`/milestones/${id}`)
}

export function createMilestone(applicationId: number | string, payload: MilestonePayload) {
    return api.post(`/applications/${applicationId}/milestones`, payload)
}

export function updateMilestone(id: number | string, payload: Partial<MilestonePayload> & Partial<MilestoneStatusPayload>) {
    return api.patch(`/milestones/${id}`, payload)
}

export function uploadMilestoneDocument(id: number | string, formData: FormData) {
    return api.post(`/milestones/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}