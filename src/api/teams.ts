import api from './axios'

export function createTeam(payload: { name: string; description?: string }) {
  return api.post('/teams', payload)
}

export function getTeams(params: any = {}) {
  return api.get('/teams', { params })
}

export function getTeamById(id: string) {
  return api.get(`/teams/${id}`)
}

export function updateTeam(id: string, payload: any) {
  return api.patch(`/teams/${id}`, payload)
}

export function deleteTeam(id: string) {
  return api.delete(`/teams/${id}`)
}

export default { createTeam, getTeams, getTeamById, updateTeam, deleteTeam }
