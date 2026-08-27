import { Icon } from '@iconify/vue'
import { aliases } from 'vuetify/lib/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

export const iconify = {
  component: props => h(Icon, props),
}
export const icons = {
  defaultSet: 'iconify',
  aliases: {
    ...aliases,
    helpCircle : 'mdi-help-circle'
  },
  sets: {
    iconify,
  },
}



// import { Icon } from '@iconify/vue'
// // import { aliases, mdi } from 'vuetify/lib/iconsets/mdi-svg'
// import { aliases } from 'vuetify/lib/iconsets/mdi'
// import'@mdi/font/css/materialdesignicons.css'

// export const iconify = {
//   component: props => h(Icon, props),
// }
// export const icons = {
//   defaultSet: 'mdi',
//   aliases,
//   sets: {
//     mdi,
//     iconify,
//   },
// }
