import { createRouter, createWebHashHistory } from 'vue-router'
import { createApp } from 'vue'
import App from './App.vue'
import routes from '~pages'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'
import './flow/config'

const router = createRouter({
  routes,
  history: createWebHashHistory(),
})

createApp(App)
  .use(router)
  .use(ElementPlus)
  .mount('#app')
