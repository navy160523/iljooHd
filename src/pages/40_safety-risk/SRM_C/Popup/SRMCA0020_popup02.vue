<!-- 
  화면명   : Hi-SAFE 주제 우수 등록 팝업
  화면개요 : Hi-SAFE 주제 현황에서 주제 선택 후 메일 발송 클릭 시 열림
            옵션에 따라 수신인 결정이 가능함
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, readonly, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonExecuteApi,
  commonSendApi,
  commonSearchApi
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import IButtonList from '@/components/IButtonList.vue'
import ILabel from "@/components/ILabel.vue"
import dayjs from "dayjs"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { isNull } from "lodash-es"

//변수선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(["closed"])
const userStore = useUserStore()

const menuTitle = ref(null)

let SELECT_EMP = ref('Y')
let icon = ''
let closeIcon = ''
let isOpen = ref(false)


const dialog = ref(null)
const popupParams = reactive({
  CONTENT: '',
  TASK_NO: '',
  EXCELLENT: '',
  USER_ID: userStore.userId
})

/* 코드 리스트 */
const codeList = reactive({
  EXCELLENT: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '대상' },
    { COD: 'B', TXT: '최우수상' },
    { COD: 'C', TXT: '우수상' },
    { COD: 'D', TXT: '장려상' },
    { COD: 'E', TXT: '안전개선상' },
  ]
})

let mainData = ref(null)

const openPopup = (rowData) => {
  console.log('rowData',rowData)
  popupParams.TASK_NO = rowData.TASK_NO
  dialog.value = true
  onButtonsClick({ id :'btnSearch' })
}


// onMounted(()=>{
// })
//초기 코드값 세팅로직 시작
const initCodeList = () => {

}


//팝업닫을때 팝업내부 변수 초기화
const closePopup = () => {
  popupParams.CONTENT = ''
  isOpen.value= false
  SELECT_EMP.value = 'Y' 
  mainData= []
  emit("closed")
  dialog.value = false
}

// 팝업 버튼
const onButtonsClick = (btn) => {
  if(btn.id === "btnSearch"){
    commonSearchApi({ queryId: "SRMCA0020_SEARCH02", param: popupParams }).then((res) => {
      if (res.ORESULT_CUR.length === 1) {
        console.log('res.ORESULT_CUR',res.ORESULT_CUR[0])
        popupParams.EXCELLENT = res.ORESULT_CUR[0].EXCELLENT
        popupParams.CONTENT = res.ORESULT_CUR[0].EXCELLENT_REMARK
      }
      console.log('popupParams',popupParams)
    })
  }else if (btn.id === "btnUpdate") {
    // console.log('EXCELLENT', popupParams.EXCELLENT)
    new saveFlowHelper(vm, t)
    .setQuery(saveData)
    .setAfter(() => onButtonsClick({ id :'btnSearch' }))
    .run();
  
  } else if(btn.id === "btnClose"){
    closePopup()
  }
}

const saveData = () =>{
  let saveParams = []
  saveParams.push(popupParams)
  // console.log('saveParams',saveParams)
  return commonExecuteApi({
    queryId: "SRMCA0020_SAVE_01",
    list: saveParams,
  })
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="600"
    height="320"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">Hi-SAFE 포상 관리</div>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
          <IMenuTitle
            ref="menuTitle"
            :button-list="['btnUpdate','btnClose']"
            @click-button="onButtonsClick"
          />
        </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <div style="display: flex; padding-left: 15px;">
            <i-select 
              :label="$t('등급')"
              width="220px"
              :items="codeList.EXCELLENT"
              item-title="TXT"
              item-value="COD"
              v-model="popupParams.EXCELLENT"
              marginBetween="20px"
            />
            <ILabel :label="$t('주제 번호')" style="width: 100%;">
                  <template #editor="editorProps">
                    <VTextField
                      v-model="popupParams.TASK_NO"
                      readonly
                    />
                  </template>
                </ILabel>
          </div>
          <div style="padding-top: 10px;">
            <ILabel :label="$t('비고')" labelLoc="top">
                  <template #editor="editorProps">
                    <VTextarea
                      v-model="popupParams.CONTENT"
                    />
                  </template>
                </ILabel>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>
