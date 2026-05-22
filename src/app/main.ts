import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/app/App.vue'
import '@/app/styles/main.css'
import router from '@/app/router/router.ts'


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')