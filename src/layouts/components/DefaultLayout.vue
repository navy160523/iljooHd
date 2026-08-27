<script setup>
import { useThemeConfig } from '@core/composable/useThemeConfig'
import { themeConfig } from '@themeConfig'

// Components
// import DefaultFooter from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import { HorizontalNavLayout } from '@layouts'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'

import { storeToRefs } from 'pinia'

import { useMenuStore } from '@hiway/stores/menu'
import { useTagsStore } from '@hiway/stores/tags'

import NavbarI18n from '@/layouts/components/NavBarI18n.vue'
import NavBarFullScreen from '@/layouts/components/NavBarFullScreen.vue'
import tagView from '@/layouts/components/AppTagView.vue'
import NavBarBookmark from '@/layouts/components/NavBarBookmark.vue'
import AppBarSearchPC from '@core/components/AppBarSearchPC.vue'
import TheCustomizer from '@core/components/TheCustomizer.vue'
import DefaultHeader from '@/layouts/components/DefaultHeader.vue'
import SideMenu from '@/layouts/components/SideMenu.vue'
import { useRoute, useRouter } from 'vue-router'
import { ref, nextTick } from 'vue'

const { appRouteTransition } = useThemeConfig()

const { treeMenus, myMenus } = storeToRefs(useMenuStore())
const route = useRoute()

const tagsStore = useTagsStore()


const isMenuClick = ref(false)
const closeMenu = ref(false)
const handleMenu = (e) => {
  isMenuClick.value = e
  nextTick(() => handleScrollX())
}
const defaultHeader = ref()
const scrollLeft = ref(0)
const handleScrollX = () => {
  defaultHeader.value.$el.style.transform = `translateX(-${scrollLeft.value}px)`
}
window.addEventListener('scroll', (e) => {
  scrollLeft.value = e.srcElement.scrollingElement.scrollLeft
  handleScrollX()
})

const close = () => {
  closeMenu.value = !closeMenu.value
}
</script>

<template>
  <v-layout class="default-layouts">
    <DefaultHeader :closeMenu="closeMenu" :menuList="treeMenus" @handle-menu="handleMenu" ref="defaultHeader" />
    <SideMenu v-if="route.name !='index'" :isMainMenu="isMenuClick" :menuList="treeMenus" />
    <v-main class="default-main" :class="{'page-tag-view' : route.name !== 'index' }">
      <div v-if="isMenuClick" class="main-overlay" @click="close" />
      <template v-if="route.name !== 'index'">
        <v-col cols="12" class="py-1 pL-42 pR-20">
          <tagView />
        </v-col>
      </template>
      <v-container :class="route.name !='index' ? 'pb-3 pL-42 pt-0 pR-20' : 'pa-0'">
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="tagsStore.cachedViews">           
            <Component :is="Component" />
          </KeepAlive>
        </RouterView>
      </v-container>
        <!-- 👉 Customizer -->
      <TheCustomizer />
    </v-main>
  </v-layout>
</template>

<style lang="scss">

</style>