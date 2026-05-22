import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user') || 'null'),
    }),

    getters: {
        isLoggedIn: (state) => !!state.token,
        role: (state) => state.user?.role_slug ?? null,
        isStudent: (state) => state.user?.role_slug === 'student',
        isCompany: (state) => state.user?.role_slug === 'company',
        isAdmin: (state) => ['nti_admin', 'super_admin'].includes(state.user?.role_slug),
        roleInOrg: (state) => state.user?.organization.role_in_org ?? null,
    },

    actions: {
        login(token: string, user: object) {
            this.token = token
            this.user = user
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
        },
        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        },
    },
})