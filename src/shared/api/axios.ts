import axios from 'axios'
import { useAuthStore } from '../../features/auth/stores/auth'

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true,
})

api.interceptors.request.use((config) => {
    const auth = useAuthStore()
    if (auth.token) {
        config.headers = {
            ...(config.headers as Record<string, string>),
            Authorization: `Bearer ${auth.token}`,
        }
    }
    return config
})

export default api