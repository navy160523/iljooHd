<script setup>
import { useTheme } from 'vuetify'
import { useThemeConfig } from '@core/composable/useThemeConfig'
import { hexToRgb } from '@layouts/utils'
import { getToken, getIsBeforeRemoveToken } from '@hiway/utils/token'
import { useUserStore } from '@hiway/stores/user'
import { useMenuStore } from '@hiway/stores/menu'
import { storedLocale, loadLanguageAsync } from '@/plugins/i18n'
import { useI18n } from 'vue-i18n'
import LoadingDialog from '@layouts/components/LoadingDialog.vue'
import { useCommonStore } from '@hiway/stores/common'
import { getCurrentInstance } from 'vue'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import { i18nInit } from '@hiway/utils/validation'

const vm = getCurrentInstance().proxy

const {
  syncInitialLoaderTheme,
  syncVuetifyThemeWithTheme: syncConfigThemeWithVuetifyTheme,
  isAppRtl,
} = useThemeConfig()

const { global } = useTheme()

const getUserAuth = () => {
  const token = getToken()
  const userStore = useUserStore()
  const url = window.location.href
  userStore.url = url.substring(url.indexOf('?') + 1) // get방식으로 파라미터를 담을 경우 userStore.url에 파라미터를 저장
  const { getMenus, getMyMenus } = useMenuStore()

  // 새로 화면이 불러오면 user Info 정보를 가져온다.
  // (토큰 값이 있어도 조회가 안될 수 있는 경우) request 상위에서 에러가 발생하면 무시된다.
  if (token && !getIsBeforeRemoveToken()) {
    userStore.setUserInfo().then(res => {
      getMenus()
      getMyMenus()
    })
  }
}

const commonStore = useCommonStore()

commonStore.addFullScreenListener()

onMounted(() => {
  document.body.id = commonStore.systemCode
})

// ℹ️ Sync current theme with initial loader theme
syncInitialLoaderTheme()
syncConfigThemeWithVuetifyTheme()
loadLanguageAsync(useI18n(),storedLocale)
getUserAuth()
i18nInit()
</script>

<template>
  <VLocaleProvider :rtl="isAppRtl">    
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp      
      :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`"
    >      
      <LoadingDialog />      
      <RouterView />
      <ScrollToTop />      
    </VApp>         
  </VLocaleProvider>                        
  <notifications 
    group="hiway"
    position="top center"
    :durations="2000"
    :width="300"
    style="top: 50px;"
  />
</template>
