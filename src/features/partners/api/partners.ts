import api from '@/shared/api/axios'

export function getPartners() {
    return api.get('/partners')
}

export function getContactMembers(partnerId: number) {
    return api.get(`/contacts/${partnerId}`)
}