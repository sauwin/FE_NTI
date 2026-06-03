import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import { createPinia } from 'pinia'
import { i18n } from '@/app/plugins/i18n'
import App from '@/app/App.vue'
import '@/app/styles/main.css'
import router from '@/app/router/index'


const app = createApp(App)
const head = createHead()

app.use(createPinia())
app.use(i18n)
app.use(router)
app.use(head)
app.mount('#app')