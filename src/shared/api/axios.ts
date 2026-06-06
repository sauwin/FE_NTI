import axios from 'axios'
import { useAuthStore } from '@/features/auth/stores/auth.ts'

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true,
})

api.interceptors.request.use((config) => {
    const auth = useAuthStore()
    if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
    }
    return config
})

export default api