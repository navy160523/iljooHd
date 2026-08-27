import { createVuetify } from 'vuetify'
import defaults from './defaults'
import { icons } from './icons'
import theme from './theme'

// Styles
import '@core/scss/template/libs/vuetify/index.scss'
import 'vuetify/styles'



//🐟 김성근 20240125 🐟 // 
// import * as components from 'vuetify/components'
// import * as directives from 'vuetify/directives'

// /** ✏️ CSS 추가  */
import '@/assets/style/index.scss'



export default createVuetify({
  defaults,
  icons,
  theme,

})
