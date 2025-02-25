import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '@/access.ts'

// 图片裁切
import VueCropper from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const app = createApp(App)

app.use(VueCropper)

app.use(createPinia())
app.use(router)
app.use(Antd)

app.mount('#app')
