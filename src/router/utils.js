/**
 * Return if user is logged in
 * This is completely up to you and how you want to store the token in your frontend application
 * e.g. If you are using cookies to store the application please update this function
 */
import { useMenuStore } from "@hiway/stores/menu"
import { useUserStore } from '@hiway/stores/user'
import Message from '@hiway/utils/notify'
import EventHandler from '@hiway/utils/eventHandler'
import { getToken, removeToken, getIsBeforeRemoveToken, removeIsBeforeRemoveToken } from '@hiway/utils/token'
import { themeConfig } from '@themeConfig'

export const isUserLoggedIn = () => !!(localStorage.getItem('userData') && localStorage.getItem('accessToken'))

// eslint-disable-next-line sonarjs/cognitive-complexity
export const canNavigator = to => {  
  if (themeConfig.app.onlyMockup) return true

  const menuStore = useMenuStore()
  const permittedMenus = menuStore.menus
  
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return permittedMenus.some(menu => {    
    if (menu.mnu_act === 'H') {
      const permittedPathArr = menu.href.split('/')
      const asteriskIndexArr = []
      let idx = permittedPathArr.indexOf('*')
      while (idx !== -1) {
        asteriskIndexArr.push(idx)
        idx = permittedPathArr.indexOf('*', idx + 1)
      }
      if (asteriskIndexArr.length > 0) {
        const checkingPathArr = to.path.split('/')
        if (permittedPathArr.length === checkingPathArr.length) {
          for (let i = 0; i < permittedPathArr.length; i++) {
            if (!asteriskIndexArr.includes(i) && permittedPathArr[i] !== checkingPathArr[i]) {              
              return false              
            }
          }
          
          return true
        }
      }

      // if (permittedPathArr[permittedPathArr.length - 1] === '**') {
      //   const checkingPathArr = to.path.split('/')
      //   const arrLength = permittedPathArr.length
      //   for (const i = 0; i < arrLength; i++) {
      //     if (permittedPathArr[i] !== checkingPathArr[i]) {
      //       return false
      //     }
      //   }
      //   return true
      // }
    }
    
    return menu.href === to.path
  })  

}
export const isMenuLoaded = () => {
  const menuStore = useMenuStore()

  return menuStore.menus.length > 0    
}

export const authCheck = async (to, from, next) => {

  const menuStore = useMenuStore()
  const userStore = useUserStore()

  if(getIsBeforeRemoveToken()) {
    removeIsBeforeRemoveToken()
  }

  if (to.meta.removeToken) {            
    removeToken()
  }

  // chkAuthIp
  if (to.meta.chkAuthIp) {
    
    let menuInfo = menuStore.menus.find(x => x.path === to.path)

    let authYn = false
    if (menuInfo) {

      let userAuthMenus = await userStore.getAuthIpMenus()
      console.log('userAuthMenus', userAuthMenus)
      console.log('menuInfo', menuInfo)

      if (userAuthMenus.find(x => x.PGM_ID == menuInfo.menu_id)) {
        authYn = true
      }
    }

    if (!authYn) {
      Message.err("해당화면에 대한 IP 권한이 없습니다. 시스템관리자에게 문의하세요.")
      
      return next(from.path)
    }    
  }

  // 권한 체크 안하는 화면
  if(to.meta.noAuth) {           
    return next()
  }
  
  // login시 접근 못하는 화면
  if(to.meta.redirectIfLoggedIn) {    
    if(getToken()) {
      return next('/')
    } else {
      return next()
    }
  }

  // 로그인 시
  if(getToken()) {  
    if(isMenuLoaded()) {
      if(canNavigator(to)) {
        // 권한있는 메뉴
        return next()
      } else {
        // 권한없는 메뉴
        return next('/not-authorized')
      }
    } else {
      EventHandler.once(() => {
        if(canNavigator(to)) {
          // 권한있는 메뉴
          return next()
        } else {
          // 권한없는 메뉴
          return next('/not-authorized')
        }
      }, 'loaded-menu')
    }    
  } else {
    // 비로그인    
    //return next('/login')
    if(to.path){
      return next(`/login?return_url=${to.path}`)
    }else{
      return next('/login')
    }
  }
}