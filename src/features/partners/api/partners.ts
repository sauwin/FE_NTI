import api from '@/shared/api/axios'

export function getPartners() {
    return api.get('/partners')
}