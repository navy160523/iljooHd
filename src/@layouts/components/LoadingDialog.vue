<template>
  <VOverlay  
    id="loading-overlay"
    v-model="loading"
    scroll-strategy="none"
    opacity="0"
    class="align-center justify-center text-center"    
    z-index="99999"    
    persistent
  >
    <div class="loadingAnimation">
      <div class="logoWrap">
        <img :src="getImgUrl('logoH.png')" class="logoH" />
      </div>
    </div>
  </VOverlay>
</template>
  
<script setup>
import { useCommonStore } from '@hiway/stores/common'
import { storeToRefs } from 'pinia'

const { loading } = storeToRefs(useCommonStore())

const getImgUrl = imgNm => {
  return new URL(`/src/assets/images/ci/${imgNm}`, import.meta.url).href
}
</script>

<style lang="scss">
#loading-overlay {
  .v-overlay__scrim {
    background: no-repeat !important
  }

  .loadingAnimation {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100vw;
    height: 100vh;
    z-index: 2000;
    &::before {
      position: absolute;
      content: '';
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.1);
    }

    .logoWrap {
      background-color: #fff;
      width: 6vw;
      height: 6vw;
      border-radius: 40px;
      border: 1px solid #fff;
      overflow: hidden;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      // &::before,
      &::after {
        content: '';
        position: absolute;
        width: 150%;
        height: 150%;
        top: 0;
        left: 50%;
        transform: translate(-50%, -100%);
      }
      &::after {
        border-radius: 30%;
        background: rgba(255, 255, 255, 0.7);
        animation: animate 6s linear infinite;
        animation-delay: 0.5s;
      }
      .logoH {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: calc(3vw); // 200 * 219
        height: calc(3vw * 1.095);
      }
    }
  }
  @keyframes animate {
    0% {
      transform: translate(-50%, -40%) rotate(720deg);
    }
    80%,
    100% {
      transform: translate(-50%, -100%) rotate(360deg);
    }
  }
}    
</style>