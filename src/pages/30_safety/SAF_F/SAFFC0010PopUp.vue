
<script setup>
import { ref, reactive, onMounted, watch } from 'vue'

import SAFFC0010PopUp from '@/pages/30_safety/SAF_F/SAFFC0010PopUp2.vue'
const dialog = ref(false)
const searchData =ref({})
const popUp = ref(null)
const openPopup = (param)=>{
  searchData.value = ''
  dialog.value = true
  searchData.value = param
}

const close =()=>{
  dialog.value = false
}

const Open = (e)=>{
  popUp.value.openPopup(searchData.value,e)
}

defineExpose({
  openPopup
})

</script>

<template>
    
  <VDialog v-model="dialog"  persistent width="300" 
  class="draggable-dialog" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >    
    <div
      class="title-bar d-flex"
      @mousedown="startDragging"
      >
      SLI점수감점대상자 조회
      <v-spacer/>
     <span style="cursor: pointer !important;" @click="close">닫기</span>
    </div>
    <v-card>
      <v-card-text>
        <div class="mb-3" style="text-align: center;" >
          <v-btn @click="Open('PRE')" width="170px">전월 미이수 인원조회 </v-btn>
        </div>
        <div style="text-align: center;">
          <v-btn @click="Open('NOW')" width="170px">금월 계획 미수립 인원조회 </v-btn>
        </div>
      </v-card-text>
    </v-card> 
   
    <SAFFC0010PopUp ref="popUp"/>
  </VDialog>

</template>



<style scoped>
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }

</style>