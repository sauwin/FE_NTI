import api from '@/shared/api/axios'

export function getTeams() {
  return api.get('/teams')
}

export function createTeam(data: { name: string; description?: string }) {
  return api.post('/teams', data)
}

export function updateTeam(teamId: number, data: { name: string; description?: string }) {
  return api.put(`/teams/${teamId}`, data)
}

export function deleteTeam(teamId: number) {
  return api.delete(`/teams/${teamId}`)
}

export function inviteMember(teamId: number, email: string) {
  return api.post(`/teams/${teamId}/invite`, { email })
}

export function removeMember(teamId: number, userId: number) {
  return api.delete(`/teams/${teamId}/members/${userId}`)
}

export function getMyInvitations() {
  return api.get('/user/invitations')
}

export function respondToInvitation(teamId: number, status: 'accepted' | 'rejected') {
  return api.post(`/teams/${teamId}/invitation/respond`, { status })
}