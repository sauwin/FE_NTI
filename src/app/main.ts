import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import { createPinia } from 'pinia'
import App from '@/app/App.vue'
import '@/app/styles/main.css'
import router from '@/app/router/index'


const app = createApp(App)
const head = createHead()

app.use(createPinia())
app.use(router)
app.use(head)
app.mount('#app')