<script setup>
import { HorizontalNav } from '@layouts/components'

// import { useLayouts } from '@layouts'
import { useLayouts } from '@layouts/composable/useLayouts'

import { useCommonStore } from '@hiway/stores/common'
import { onMounted, watch } from 'vue'
import SubMeun from'@layouts/components/SubMeun.vue'


const props = defineProps({
  navItems: {
    type: null,
    required: true,
  },
  navMyMenuItems: {
    type: Array,
    required: true,
  },
})

const { y: windowScrollY } = useWindowScroll()
const { width: windowWidth } = useWindowSize()
const router = useRouter()
const route = useRoute()
const shallShowPageLoading = ref(false)
const commonStore = useCommonStore()


router.beforeEach(() => {

  shallShowPageLoading.value = true
})
router.afterEach(() => {
  shallShowPageLoading.value = false
})



const {
  _layoutClasses: layoutClasses,
  isNavbarBlurEnabled,
} = useLayouts()


const SubMeunRef = ref(false)
const isSubMeunOpen = ref(false)

const SubMeunOpen = () =>{
  SubMeunRef.value.openSubMeun()
  isSubMeunOpen.value = true

}
const SubMeunClose = () =>{
  SubMeunRef.value.closeSubMeum()
  isSubMeunOpen.value = false
  
}

onMounted(()=>{
  isSubMeunOpen.value = false
})
watch(() => route.path, () => {
  if(route.path === '/'){
    isSubMeunOpen.value = false
  }
})

</script>

<template>
  <div
    class="layout-wrapper"
    :class="[...layoutClasses(windowWidth, windowScrollY), { 'layout-full-screen': commonStore.isFullScreen}]"
  >
    <div
      class="layout-navbar-and-nav-container"
      :class="isNavbarBlurEnabled && 'header-blur'"
    >
      <!-- 👉 Navbar -->
      <div class="layout-navbar">
        <div class="navbar-content-container">
          <slot name="navbar1" />
          
          <!-- 👉 Navigation -->
          <div class="layout-horizontal-nav">
            <div class="horizontal-nav-content-container">
              <HorizontalNav
                :nav-items="navItems"
                :nav-my-menu-items="navMyMenuItems"
              />
            </div>
          </div>
          
          <slot name="navbar2" />
        </div>
      </div>
    </div>
    
    <v-row no-gutters>
    <v-col v-if="route.name !='index'" :class="['SubMeunWapperAtivce',{'SubMeunWapper':isSubMeunOpen}]" >
   <div :class="['SubMeunOpen',{'SubMeunOpenAtivce':isSubMeunOpen}]" @click="isSubMeunOpen ? SubMeunClose() : SubMeunOpen()">
      <svg-icon name="subMeunBtn"></svg-icon>
   </div>
      <SubMeun ref="SubMeunRef" 
      :nav-items="navItems"
      :nav-my-menu-items="navMyMenuItems"/>
    </v-col>
 
  <v-col>
    <div v-if="route.name !='index'" class="layout-tagview" style="padding: 0 30px;">
      <slot name="tagview" />
    </div>    




    <template v-if="route.name === 'index'">
      <main class="layout-page-content__index">
        <template v-if="$slots['content-loading']">
          <template v-if="shallShowPageLoading">
            <slot name="content-loading" />
          </template>
          <template v-else>
            <slot />
          </template>
        </template>
        <template v-else>
          <slot />
        </template>
      </main>
    </template>
    <template v-else>
      <main class="layout-page-content">
        <template v-if="$slots['content-loading']">
          <template v-if="shallShowPageLoading">
            <slot name="content-loading" />
          </template>
          <template v-else>
            <slot />
          </template>
        </template>
        <template v-else>
          <slot />
        </template>
      </main>
    </template>
    <!-- <main :class="route.name === 'index' ? 'layout-page-content__index' : 'layout-page-content'">
      <template v-if="$slots['content-loading']">
        <template v-if="shallShowPageLoading">
          <slot name="content-loading" />
        </template>
        <template v-else>
          <slot />
        </template>
      </template>
      <template v-else>
        <slot />
      </template>
    </main> -->
  </v-col>
  </v-row>


    <!-- 👉 Footer -->
    <footer v-if="route.name =='index' " class="layout-footer">
      <div class="footer-content-container" style="background-color: #fff;">
        <slot name="footer" />
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
@use "@configured-variables" as variables;
@use "@layouts/styles/placeholders";
@use "@layouts/styles/mixins";

.layout-wrapper {
  z-index: 1000 !important;
  &.layout-nav-type-horizontal {
    overflow: hidden;
    display: flex;
    flex-direction: column;

    //todo: 전체 백그라운드 컬러
    background-color: #fff;

    // // TODO(v2): Check why we need height in vertical nav & min-height in horizontal nav
    min-height: 100vh;
    // min-block-size: calc(var(--vh, 1vh) * 100);

    .layout-navbar-and-nav-container {
      z-index: 1;
    }

    .layout-navbar {
      z-index: variables.$layout-horizontal-nav-layout-navbar-z-index;
      block-size: variables.$layout-horizontal-nav-navbar-height;

      // ℹ️ For now we are not independently managing navbar and horizontal nav so we won't use below style to avoid conflicting with combo style of navbar and horizontal nav
      // If we add independent style of navbar & horizontal nav then we have to add :not for avoiding conflict with combo styles
      // .layout-navbar-sticky & {
      //   @extend %layout-navbar-sticky;
      // }

      // ℹ️ For now we are not independently managing navbar and horizontal nav so we won't use below style to avoid conflicting with combo style of navbar and horizontal nav
      // If we add independent style of navbar & horizontal nav then we have to add :not for avoiding conflict with combo styles
      // .layout-navbar-hidden & {
      //   @extend %layout-navbar-hidden;
      // }
    }

    .layout-tagview {
      z-index: variables.$layout-horizontal-nav-tagview-z-index;
      @include mixins.boxed-content;
    }

    // 👉 Navbar
    .navbar-content-container {
      @include mixins.boxed-content;
    }

    // 👉   Content height fixed
    &.layout-content-height-fixed {
      max-block-size: calc(var(--vh) * 100);

      .layout-page-content {
        overflow: hidden;

        > :first-child {
          max-block-size: 100%;
          overflow-y: auto;
        }
      }
    }

    // 👉 Footer
    // Boxed content
    .layout-footer {
      .footer-content-container {
        @include mixins.boxed-content;
      }
    }
  }

  // If both navbar & horizontal nav sticky
  &.layout-navbar-sticky.horizontal-nav-sticky {
    .layout-navbar-and-nav-container {
      position: sticky;
      inset-block-start: 0;
      will-change: transform;
    }
  }

  &.layout-navbar-hidden.horizontal-nav-hidden {
    .layout-navbar-and-nav-container {
      display: none;
    }    
  }

  &.layout-tagview-sticky {
    .layout-tagview {
      position: sticky;            
    }
  }

  &.layout-tagview-sticky.layout-navbar-sticky {
    .layout-tagview {      
      inset-block-start: calc(variables.$layout-horizontal-nav-navbar-height + 0.19px);      
    }
  }

  &.layout-tagview-sticky.layout-navbar-hidden {
    .layout-tagview {
      inset-block-start: 0
    }    
  }
  &.layout-tagview-sticky.layout-navbar-static {
    .layout-tagview {
      inset-block-start: 0
    }    
  }
  &.layout-tagview-hidden .layout-tagview{
    display: none
  }  
}

// 👉 Horizontal nav nav
.layout-horizontal-nav {
  z-index: variables.$layout-horizontal-nav-z-index;

  // .horizontal-nav-sticky & {
  //   width: 100%;
  //   will-change: transform;
  //   position: sticky;
  //   top: 0;
  // }

  // .horizontal-nav-hidden & {
  //   display: none;
  // }

  .horizontal-nav-content-container {
    @include mixins.boxed-content(true);
  }
}
</style>
