import { createRouter, createWebHashHistory } from 'vue-router'
import { createApp } from 'vue'
import App from './App.vue'
import routes from '~pages'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

const router = createRouter({
  routes,
  history: createWebHashHistory(),
})

createApp(App)
  .use(router)
  .mount('#app')
