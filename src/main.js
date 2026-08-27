/* eslint-disable import/order */
import '@/@iconify/icons-bundle'
import App from '@/App.vue'
import layoutsPlugin from '@/plugins/layouts'
import vuetify from '@/plugins/vuetify'
import { loadFonts } from '@/plugins/webfontloader'
import router from '@/router'
import '@core/scss/template/index.scss'
import '@styles/styles.scss'
import '@styles/ckEditorStyles.scss'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import i18n from '@/plugins/i18n'
import Notifications from '@kyvg/vue3-notification'
import VueSweetalert2 from 'vue-sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import logger from '@hiway/utils/log'

// /** ✏️ echart  */
import ECharts from "vue-echarts";

import echartCore from "@/components/echart";

// import bus from '@/utils/eventHandler'
import directives from '@hiway/directives'



// 추가 🐟 김성근 20240125 🐟
/** ✏️ SVG Icon */
import SvgIcon from '@/components/svgicon/SvgIcon.vue'
/** ✏️ Common Components */
import iComponents from "@/components/index"
/** ✏️ RealGrid css */
import '@/assets/style/components/grid.scss'

// 추가 🐟 윤혜령 20240404 🐟
import store from '@/stores'

loadFonts()


// Create vue app
const app = createApp(App)

// app.config.globalProperties.$bus = bus
app.config.globalProperties.$echarts = echartCore;
app.component(ECharts)
// Use plugins
app.use(vuetify)
app.use(createPinia())
app.use(router)
app.use(layoutsPlugin)
app.use(iComponents)
app.use(i18n)
app.use(store)
app.component(`svg-icon`, SvgIcon)
app.use(Notifications)
app.use(VueSweetalert2, {
  confirmButtonText: '예',
  cancelButtonText: '아니오',
})
app.use(directives)

logger.init(app)

// Mount vue app
app.mount('#app')

window._vue = app