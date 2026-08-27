import { defineStore } from 'pinia'
import { saveExecuteMenu } from '../api/user'
import { getToken } from '../utils/token'
import { useMenuStore } from './menu'
import { useTagsStore } from './tags'
import { getAgentType } from '@hiway/utils/check'
import { useUserStore } from '@hiway/stores/user'
import { find, includes, filter } from 'lodash-es'

export const useLogsStore = defineStore('logs', {
  state: () => ({
    path: '',
    name: '',
    fullPath: '',    
    menuId: '',
    vueId: '',
    agentType: getAgentType(),
    isMenuAdmin: 'N',
  }),
  getters: {},
  actions: {
    setCurrentRoute(to) {
      const menuStore = useMenuStore()
      const tagsSotre = useTagsStore()

      this.isMenuAdmin = 'N'
      this.path = to.path
      this.name = to.name
      this.fullPath = to.fullPath

      const pathList = this.fullPath.split('/')
      
      this.vueId = pathList.length > 0 ? pathList[pathList.length - 1] : ''
      
      const currentMenu = menuStore.menus.find(menu => menu.href === to.path) || { menu_id: to.name }

      this.menuId = currentMenu?currentMenu.menu_id:to.name

      const userStore = useUserStore()

      // const target = find(userStore.buttonPermission, {
      //   menu_id: this.menuId,
      // })

      const target = filter(userStore.buttonPermission, {
        menu_id: this.menuId,
      })

      // console.log('userStore.buttonPermission', userStore.buttonPermission)

      // console.log('target', target)
      // alert(`target: ${target}`)

      for(let i = 0; i < target.length; i++) {
        // console.log('target', target[i])
        // alert(`target: ${target[i]}`)
        if(target[i].actions !== undefined && target[i].actions !== null && target[i].actions.length > 0) {
          const permissions = target[i].actions
          // alert(`1: ${permissions}`)
          // console.log('permissions', permissions)
          if(includes(permissions, 'ADMIN')) {
            // alert(`2: ${permissions}`)
            // console.log('permissions2', permissions)
            this.isMenuAdmin = 'Y'
          }
        }
      }

      // const permissions = target ? target.actions : []

      // if(includes(permissions, 'ADMIN')) {
      //   // console.log('buttonPermission', permissions)

      //   this.isMenuAdmin = 'Y'
      // }

      if(getToken() && !tagsSotre.visitedViews.some(tag => { return tag.path === to.path})) saveExecuteMenu(currentMenu.menu_id)                            
        
    },
    
  },
})