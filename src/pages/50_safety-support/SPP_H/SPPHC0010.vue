<!-- 화면명 : SPPHB0010 태풍기본정보 관리 -->
<!-- 화면개요 : 해당년도에 발생한 태풍에 대한 기본정보관리 -->
<!-- SI2팀 마환구 2025-02-04 -->

<script setup>
import { useUserStore } from '@hiway/stores/user'
import { nextTick } from 'vue'

const userStore = useUserStore()
onMounted(() => {
  let userid = userStore.userId
  window.open('http://hms.hhi.co.kr/#/loginpass?userid='+ userid +'&menu_gubun=hse0060') 
  
  window.history.back();
})


</script>
<template>
</template> 
