<!--
  화면명 : 작업환경측정 공정관리 반기 복사
  화면개요 : 특정 반기에 있는 공정을 복사한다.
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, chatbotTranslateLn, commonExecuteApi, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const visibleGubun = ref(false)
const title = ref('작업환경측정 반기 복사')

// 어떤 쿼리를 돌릴 지 결정
const queryId = reactive({
  CONFIRM: '',
  SAVE: ''
})

/* 복사 조건 */
const searchParams = reactive({
  sLANG: 'en',
  sText: ''
})

const openPopup = () => {

  dialog.value = true
}


// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnCopy') {

    let param = {
      sLang: 'en', //번역할언어
      sText: searchParams.sText, //번역할말
    }
    for(let i = 0 ; i< 100; i++ ){
      chatbotTranslateLn(param).then((res) => {
        console.log('응답값?', res)
      })
    }
    
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

/* ********** 닫기 ********** */
const closePopup = () => {
  dialog.value = false 
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="700"
    height="400"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span> {{ title }}</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnCopy', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
            
          <div class="d-flex">
            <i-input
              v-model="searchParams.sText"
              :label="$t('말')"
              label-width="50px"
              width="200px"
            />
          </div>
        </v-sheet>
      </div>
      
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
