<template>
  <div class="svg-icon">
    <component v-if="props.name !== undefined" :is="icon" />
  </div>
</template>

<script setup>
/**
 * ============================================================================================================================================================
 * 👉 SVG 파일을 활용하기 위한 적용 컴포넌트
 * -> @/assets/svgicon/ 하위 svg 파일 적용
 * -> ex) 사용 컴포넌트 <svg-icon name="svg file name" />
 * ============================================================================================================================================================
 * 작성자 : 연구기술팀 김성준
 * 작성일 : 2023-02-13
 * ============================================================================================================================================================
 */

import { defineAsyncComponent } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

let icon = defineAsyncComponent(() => import(`../../assets/icons/svg/${props.name}.svg`))

watch(() => props.name, () => {
  icon = defineAsyncComponent(() => import(`../../assets/icons/svg/${props.name}.svg`))
})
</script>

<style scoped>
.svg-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  /* width: 100%; */
  /* height: 100%; */
}
</style>
