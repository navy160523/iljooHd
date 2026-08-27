
<!-- 
  * Vue 내 용 : 평가지 등록/수정 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/26
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/26 
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import saveFlowHelper from '@/utils/saveFlowHelper'
import { commonExecuteApi, getCodeList } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from "vue-i18n"
import _ from "lodash"
import { isEmpty } from "@/@core/utils"
import Message from '@hiway/utils/notify'

const emit = defineEmits(["closed"])

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

//팝업 정보
const popupParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  YEAR: '',
  EVAL_ID : '',
  TITLE : '',
  EVAL_DESC : '',
  KIND : '',
  DIVISION : '',
  USE_YN : 'Y',
  SAVE_GBN : '',
})

//코드리스트
const codeList = reactive({
  DIVISION : [],
  KIND : [],
})

//초기 데이터셋팅
onMounted(() => {

})

const openPopup = val => {
  console.log("openPopup", val)

  popupParams.CMPNY_DIV = val.CMPNY_DIV
  popupParams.BSNS_CD = val.BSNS_CD
  popupParams.DEPT_CD = val.DEPT_CD
  popupParams.ASGN_CD = val.ASGN_CD
  popupParams.YEAR = val.YEAR
  popupParams.TITLE = val.TITLE
  popupParams.EVAL_DESC = val.EVAL_DESC
  popupParams.KIND = val.KIND
  popupParams.DIVISION = val.DIVISION
  popupParams.USE_YN = val.USE_YN
  popupParams.SAVE_GBN = val.SAVE_GBN
  popupParams.EVAL_ID = val.EVAL_ID

  initCombo()

  dialog.value = true
}

//콤보박스 셋팅
const initCombo = () => {

  Promise.all([
    // getCodeList(popupParams.CMPNY_DIV + 'ZE00'), // 종류
    getCodeList(popupParams.CMPNY_DIV + 'ZE10'), // 구분
  ]).then(res => {
    // codeList.KIND = res[0].ORESULT_CUR
    codeList.DIVISION = res[0].ORESULT_CUR

    if (isEmpty(popupParams.DIVISION)) {
      popupParams.DIVISION = 'A'
    }
    
    // if (isEmpty(popupParams.KIND)) {
    //   popupParams.KIND = 'A'
    // }
  })
}


const onClose = () => {
  dialog.value = false
  emit("closed")
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if (btn.id === 'btnClose')
  {
    onClose()
  }
}

//유효성 검사
const beforeSave = () => {
  if (isEmpty(popupParams.TITLE)) {
    return Message.err("평가지 제목을 입력해 주세요.")
  }

  // if (isEmpty(popupParams.KIND)) {
  //   return Message.err("평가지 구분을 선택해 주세요.")
  // }

  if (isEmpty(popupParams.DIVISION)) {
    return Message.err("평가지 종류를 선택해 주세요.")
  }

  return true
}

//저장
const saveData = () => {
  if (popupParams.SAVE_GBN === 'NEW') { // 추가
    popupParams.EVAL_ID = 'NEW'
  }

  let saveParams = []

  saveParams.push({
    CMPNY_DIV: popupParams.CMPNY_DIV, // 회사 코드
    EVAL_ID: popupParams.EVAL_ID, // 평가지코드
    BSNS_CD: popupParams.BSNS_CD, // 사업부코드
    DEPT_CD: popupParams.DEPT_CD, // 부서코드(A:직영일경우)
    ASGN_CD: popupParams.ASGN_CD, // 조직코드(B:협력사일경우)
    YEAR: popupParams.YEAR, // 년도
    KIND: popupParams.KIND, // 종류
    DIVISION: popupParams.DIVISION, // 구분
    TITLE: popupParams.TITLE,  // 제목
    DESC: popupParams.EVAL_DESC,   // 설명
    USE_YN: popupParams.USE_YN, // 삭제여부
    USER_ID: userStore.userId, // 로그인 사용자 정보
  })

  return commonExecuteApi({
    queryId: "OPRAH0030_SAVE_01", list: saveParams,
  })
}

//저장 후
const afterSave = () => {
  onClose()
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="560px"
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
      <span>평가지 등록/수정</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <i-input 
            v-model="popupParams.TITLE"
            class="mb-2"
            :label="$t('평가지 제목')"
            label-width="100px"
            top-label
            required
          />
          <i-input
            v-model="popupParams.EVAL_DESC"
            class="mb-2"
            :label="$t('평가지 설명')"
            label-width="100px" 
            top-label
          />
          <i-select
            v-model="popupParams.DIVISION"
            class="mb-2"
            :label="$t('평가지 구분')"
            label-width="100px"
            top-label
            append-inner-icon="mdi-magnify"
            width="300px"
            :items="codeList.DIVISION"
            item-value="COD"
            item-title="TXT"
            required
          />
          <!-- 
            <i-select
            v-model="popupParams.KIND"
            class="mb-2"
            :label="$t('평가지 종류')"
            label-width="100px"
            append-inner-icon="mdi-magnify"
            width="300px"
            :items="codeList.KIND"
            item-value="COD"
            item-title="TXT"
            required
            /> 
          -->
          <div class=" d-flex mb-2">
            <span 
              class="pe-2 formLabelText" 
              style="width:100px"
            >
              평가지
            </span>
            <VRadioGroup
              v-model="popupParams.USE_YN"
              style="margin: auto"
              inline
            >
              <v-radio 
                label="사용" 
                value="Y"
              />
              <v-radio 
                label="미사용" 
                value="N"
              />
            </VRadioGroup>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
