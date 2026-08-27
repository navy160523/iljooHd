<script setup>
import { useWindowScroll } from "@vueuse/core"
const route = useRoute()
const { y } = useWindowScroll()

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
}
// const currentZoomLevel = ref(100)
// const increaseZoom = () => {
//   console.log("ggg")
//   if (currentZoomLevel.value < 250) {
//     currentZoomLevel.value += 10
//     console.log(currentZoomLevel.value)
//     document.body.style.zoom = currentZoomLevel.value + "%"
//   }
// }
// // 줌아웃
// const decreaseZoom = () => {
//   if (currentZoomLevel.value > 70) {
//     currentZoomLevel.value -= 10
//     console.log(currentZoomLevel.value)
//     document.body.style.zoom = currentZoomLevel.value + "%"
//   }
// }
</script>

<template>
  <VScaleTransition
    style="transform-origin: center"
    class="scroll-to-top d-print-none"
  >
    <VBtn v-show="y > 200" icon @click="scrollToTop">
      <VIcon size="22" icon="mdi-arrow-up" />
    </VBtn>
  </VScaleTransition>

  <!-- <VScaleTransition
    style="transform-origin: center"
    class="scroll-to-top d-print-none"
  >
    <div class="zoom" v-if="route.name == 'index'">
      <button class="zoom-btn" @click="decreaseZoom">-</button>
      <button class="zoom-btn" @click="increaseZoom">+</button>
    </div>
  </VScaleTransition> -->
</template>

<style lang="scss">
.scroll-to-top {
  position: fixed !important;
  z-index: 999;
  inset-block-end: 5%;
  inset-inline-end: 25px;
}

.zoom {
  position: relative;
  z-index: 999;
  color: #fff;
  inset-block-end: 5%;
  inset-inline-end: 55px;
}
.zoom-btn {
  border: none;
  background-color: #1d43ca;
  padding: 6px 15px;
  cursor: pointer;
  font-size: 16px;
  outline: none;
  border-top-right-radius: 25px;
  border-bottom-right-radius: 25px;
  border-right: 1px solid #ddd;
}

.zoom-btn:first-child {
  border-top-right-radius: 0px;
  border-bottom-right-radius: 0px;
  border-top-left-radius: 25px;
  border-bottom-left-radius: 25px;
}
.zoom-btn:nth-child(2) {
  margin-right: 15px;
}

.zoom-btn:hover {
  background-color: #1d43caad;
}
</style>
