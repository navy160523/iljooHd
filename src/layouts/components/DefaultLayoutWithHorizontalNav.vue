<script setup>
import { useThemeConfig } from '@core/composable/useThemeConfig'
import { themeConfig } from '@themeConfig'

// Components
import Footer from '@/layouts/components/Footer.vue'
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
import { useRoute, useRouter } from 'vue-router'


const { appRouteTransition } = useThemeConfig()

const { treeMenus, myMenus } = storeToRefs(useMenuStore())
const route = useRoute()

const tagsStore = useTagsStore()
</script>

<template>
  <HorizontalNavLayout
    :nav-items="treeMenus"
    :nav-my-menu-items="myMenus"
  >
    <template v-if="route.name !== 'index'" #tagview>
      <tagView />
    </template>
    <!-- 👉 navbar -->
    <template #navbar1>
      <VSpacer />
      <RouterLink
        to="/"
        class="d-flex align-center gap-x-3"
      >
      <!-- style="margin-top:5px;" -->
        <!-- <VNodeRenderer :nodes="themeConfig.app.logo" /> -->
        <!-- <img :src="themeConfig.app.logo"> -->
        <svg-icon name="logo1"/>

        <h1 class="font-weight-medium leading-normal text-xl">
          {{ themeConfig.app.title }}
        </h1>
      </RouterLink>
      <VSpacer />

    </template>
    <!-- 👉 navbar -->
    <template #navbar2>
      <VSpacer />

      <NavBarBookmark />
      <NavbarI18n />
      <!-- 테마변경 숨김 -->
      <!-- <NavbarThemeSwitcher /> -->
      <NavBarFullScreen />      
      <UserProfile />
      <VSpacer />
    </template>

    <!-- 👉 Pages -->
    <RouterView
      v-slot="{ Component }"      
    >            
  
        <KeepAlive :include="tagsStore.cachedViews">           
          <Component :is="Component" />
        </KeepAlive>

    </RouterView>    

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <TheCustomizer />
  </HorizontalNavLayout>
</template>
