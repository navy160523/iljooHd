<script setup>
import {
  computePosition,
  flip,
  shift,
} from '@floating-ui/dom'
import { useLayouts } from '@layouts/composable/useLayouts'
import { config } from '@layouts/config'
import { themeConfig } from '@themeConfig'

const props = defineProps({
  popperInlineEnd: {
    type: Boolean,
    required: false,
    default: false,
  },
  tag: {
    type: String,
    required: false,
    default: 'div',
  },
  contentContainerTag: {
    type: String,
    required: false,
    default: 'div',
  },
  isRtl: {
    type: Boolean,
    required: false,
  },
  isHovers:{
    type: Boolean,
    required: false,
  }
})

const refPopperContainer = ref()
const refPopper = ref()

const popperContentStyles = ref({
  left: '0px',
  top: '0px',

  // strategy: 'fixed',
})

const updatePopper = async () => {
  const { x, y } = await computePosition(refPopperContainer.value, refPopper.value, {
    placement: props.popperInlineEnd ? props.isRtl ? 'left-start' : 'right-start' : props.isRtl ? 'bottom-end' : 'bottom-start',
    middleware: [
      flip({ boundary: document.querySelector('body') }),
      shift({ boundary: document.querySelector('body') }),
    ],

    
    // strategy: 'fixed',
  })


  popperContentStyles.value.top = `46.5938px`
}

until(config.horizontalNav.type).toMatch(type => type === 'static').then(() => {
  useEventListener('scroll', updatePopper)

  // strategy: 'fixed',
})

const isContentShown = ref(false)

const showContent = () => {
  isContentShown.value = true
  updatePopper()
  disableScroll()
}

const hideContent = () => {
  isContentShown.value = false
  enableScroll()
}

onMounted(updatePopper)

const { isAppRtl, appContentWidth } = useLayouts()



const preventDefault = e => {
  e.preventDefault()
}

const disableScroll=()=> {
  document.addEventListener('touchmove', preventDefault, { passive: false });
  document.addEventListener('wheel', preventDefault, { passive: false });
  document.addEventListener('scroll', preventDefault, { passive: false });
}

// 스크롤 잠금 해제
const enableScroll= () => {
  document.removeEventListener('touchmove', preventDefault);
  document.removeEventListener('wheel', preventDefault);
  document.removeEventListener('scroll', preventDefault);
}


watch([
  isAppRtl,
  appContentWidth,
], updatePopper)

// Watch for route changes and close popper content if route is changed
const route = useRoute()

watch(() => route.fullPath, hideContent)
</script>

<template>

  <div
    class="nav-popper"
    :class="[{
      'popper-inline-end': popperInlineEnd,
      'show-content': isContentShown,
      'activeNavBtn': isHovers
    }]"
  >
    <div
      ref="refPopperContainer"
      class="popper-triggerer"
      @mouseenter="showContent"
      @mouseleave="hideContent"
    >
      <slot />
    </div>

    <!-- SECTION Popper Content -->
    <!-- 👉 Without transition -->

    <!-- 👉 CSS Transition -->
    <template v-if="typeof themeConfig.horizontalNav.transition === 'string'">
      
        <div
          v-show="isContentShown"
          ref="refPopper"
          class="popper-content"
          :style="popperContentStyles"
       
        >
          <div style="background: #fff; margin-top: -4px;" @mouseenter="showContent" @mouseleave="hideContent">
            <slot name="reContent"/>
          </div>

        </div>
 
    </template>

    <!-- 👉 Transition Component -->
  

        <!-- 👉 madeByIljoo -->



  </div>
</template>

<style lang="scss">
.popper-content {
  position: absolute;
}

.activeNavBtn{
  font-weight: 700 !important;
  color: #1A40C7 !important;
}
</style>
