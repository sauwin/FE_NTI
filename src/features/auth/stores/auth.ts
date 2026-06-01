import { defineStore } from 'pinia'
import { getMe } from '@/features/auth/api/auth'
import type { AuthUser } from '@/features/auth/types/auth'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        authReady: false,
    }),

    getters: {
        isLoggedIn: (state) => !!state.token,
        role: (state) => state.user?.role_slug ?? null,
        isStudent: (state) => state.user?.role_slug === 'student',
        isCompany: (state) => state.user?.role_slug === 'company',
        isAdmin: (state) => ['nti_admin', 'super_admin'].includes(state.user?.role_slug),
        isContentEditor: (state) => state.user?.role_slug === 'content_editor',
        roleInOrg: (state) => state.user?.role_in_org ?? null,

        //Todo: check whether all that idea with different names is relevant
        dashboardLabel: (state) => {
            switch (state.user?.role_slug) {
                case 'student':
                    return 'My Applications'

                case 'mentor':
                    return 'My Mentorship'

                case 'evaluator':
                    return 'My Evaluations'

                case 'content_editor':
                    return 'My Editing'

                case 'company':
                    return 'My Company'

                case 'nti_admin':
                case 'super_admin':
                    return 'Admin Panel'

                default:
                    return 'Dashboard'
            }
    },
},

    actions: {
        login(token: string, user: AuthUser) {
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
        async restoreSession() {
            if (this.token) {
                try {
                    const res = await getMe()
                    this.login(this.token, res.data)
                } catch {
                    this.logout()
                } 
            }
            this.authReady = true
        }
    },
})