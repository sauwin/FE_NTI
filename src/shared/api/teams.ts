import api from './axios'

export function createTeam(payload: { name: string; description?: string }) {
  return api.post('/teams', payload)
}

export function getTeams(params: any = {}) {
  return api.get('/teams', { params })
}

export default { createTeam, getTeams }
