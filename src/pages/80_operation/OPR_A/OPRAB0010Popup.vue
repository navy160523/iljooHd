<!--
  화면명 : OPRAB0010Popup.vue
  화면개요 :  To-Do List 매부 결재 승인 팝업
  작 성 자 : 일주지앤에스 차동운
  최초 작성일 : 2024/02/07
  최종 수정자 : 일주지앤에스 차동운
  최종 수정일 : 2024/02/07
-->

<script setup>
import { ref, reactive, onMounted, onUpdated, watch } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { commonExecuteApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify' 

const emit = defineEmits(["closed"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)

// 결재팝업 호출 파라미터
let approvalParams = reactive({})

const applyParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : null,
  SCHEDULE_ID : null,
  APP_EMP_NO : null,
  MENU_ID : null,
  USER_ID : userStore.userId,
})

const openPopup = popupParam => {
  let year = ''

  applyParams.SCHEDULE_ID = popupParam.ID
  applyParams.MENU_ID = popupParam.MENU_ID

  if (popupParam.MENU_ID === 'EDUAB0070' || popupParam.MENU_ID === 'EDUAB0030') {
    year = popupParam.ID
    applyParams.YEAR = year.substring(0, 4)
  }

  applyParams.APP_EMP_NO = userStore.userId 

  approvalParams.TITLE = popupParam.TITLE

  var sb = []

  // 미결
  if (popupParam.STATUS === 'N') {
    sb.push("[결재요청]\n")
    sb.push("[결재상신자]" + popupParam.REQNM + "\n")
    sb.push("통합HSE관리시스템에서 하기 교육에 대해서 결재 승인 바랍니다.\n")

    approvalParams.CONTENTS = sb.join("")
    approvalParams.DESC = popupParam.DESC

  } else if(popupParam.STATUS === 'C') {
    sb.push("[결재결과]\n")
    sb.push("[결재상신자]" + popupParam.REQNM + "\n")
    sb.push("통합HSE관리시스템에서 하기 교육에 대해서 반려 되었습니다.\n")

    approvalParams.CONTENTS = sb.join("")
    approvalParams.DESC = popupParam.DESC
  } else {
    sb.push("[결재결과]\n")
    sb.push("[결재상신자]" + popupParam.REQNM + "\n")
    sb.push("통합HSE관리시스템에서 하기 교육에 대해서 결재 승인이 완료되었습니다.\n")

    approvalParams.CONTENTS = sb.join("")
    approvalParams.DESC = popupParam.DESC
  }

  dialog.value = true
}

const onButtonsClick = btn => {
  if (btn.id === 'btnApplyApprove') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('승인하시겠습니까?')
      .setQuery(saveApplyApproveData)
      .setAfter(afterApply)
      .run()
  } else if (btn.id === 'btnApplyTurnBack') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('반려하시겠습니까?')
      .setBefore(beforeApplyTurnBack)
      .setQuery(saveApplyTurnBackData)
      .setAfter(afterApply)
      .run()

  } else if (btn.id === 'btnApplyCancel') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('취소하시겠습니까?')
      .setQuery(saveApplyCancelData)
      .setAfter(afterApply)
      .run()

  } else if (btn.id === 'btnClose') {
    onClose()
  }
}

const afterApply = () => {
  onClose()
}

//결재 승인
const saveApplyApproveData = () => {
  let saveParams = {
    CMPNY_DIV : applyParams.CMPNY_DIV,
    YEAR : applyParams.YEAR,
    SCHEDULE_ID : applyParams.SCHEDULE_ID,
    DIV : 'Y',
    APP_EMP_NO : applyParams.APP_EMP_NO,
    USER_ID : applyParams.USER_ID,
    MENU_ID : applyParams.MENU_ID,
  }

  return commonExecuteApi({ queryId : 'OPRAB0010_SAVE_03', list: [saveParams] })
}

//결재 반려 전
const beforeApplyTurnBack = () => {
  if(isNullCheck(approvalParams.DESC)){
    return Message.warn(t('반려 사유를 입력해 주세요.'))
  }

  return true
}

//결재 반려
const saveApplyTurnBackData = () => {
  let saveParams = {
    CMPNY_DIV : applyParams.CMPNY_DIV,
    YEAR : applyParams.YEAR,
    SCHEDULE_ID : applyParams.SCHEDULE_ID,
    DIV : 'Y',
    APP_DESC : approvalParams.DESC,
    APP_EMP_NO : applyParams.APP_EMP_NO,
    USER_ID : applyParams.USER_ID,
    MENU_ID : applyParams.MENU_ID,
  }

  return commonExecuteApi({ queryId : 'OPRAB0010_SAVE_04', list: [saveParams] })
}

//결재 취소
const saveApplyCancelData = () => {
  return commonExecuteApi({ queryId : 'OPRAB0010_SAVE_02', list: [applyParams] })
}

//널 체크 이벤트
const isNullCheck = data => {
  return (data === undefined || data === null || data === '') ? true : false
}

const onClose = () => {
  dialog.value = false
  emit("closed")
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
    width="700px"
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
      <span>내부 결재 승인</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnApplyApprove', 'btnApplyTurnBack', 'btnApplyCancel', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class=" d-flex">
              <i-input
                v-model="approvalParams.TITLE"
                readonly
                :label="$t('결재 제목')"
                top-label
                label-width="100px" 
                width="600px"
              />
            </div>
            <div class="d-flex mt-2">
              <i-input 
                v-model="approvalParams.CONTENTS"
                class="mb-2"
                :label="$t('결재내용')"
                top-label
                label-width="100px"
                width="600px"
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-input 
                v-model="approvalParams.DESC"
                class="mb-2"
                :label="$t('반려사유')"
                top-label
                label-width="100px"
                width="600px"
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
