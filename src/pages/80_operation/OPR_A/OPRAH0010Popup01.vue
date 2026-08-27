<!-- 
  * Vue 내 용 : 설문지 등록/수정 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/02/15
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/02/15 
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
import ImageViewerPopup from '@/components/popup/ImageViewerPopup.vue'
import { isEmpty } from "@/@core/utils"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

const emit = defineEmits(["closed"])
const imageViewerPopup = ref(null)

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

//팝업 설문지 정보
const popupParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  YEAR: '',
  SUVY_ID : '',
  TITLE : '',
  SUVY_DESC : '',
  KIND : '',
  DIVISION : '',
  RSPN_PER_FROM : '',
  RSPN_PER_TO : '',
  USE_YN : 'Y',
  LOGIN_YN : '',
  REG_YN : '',
  DEPT_YN: 'N',
  FILE_ID : '',
  SAVE_GBN : '',
})

const fileMsg = reactive({
  FILE_ID_MSG : '',
})

//코드리스트
const codeList = reactive({
  DIVISION : [],
  KIND : [],
})

const openPopup = val => {
  console.log("openPopup", val)
  popupParams.CMPNY_DIV = val.CMPNY_DIV
  popupParams.BSNS_CD = val.BSNS_CD
  popupParams.DEPT_CD = val.DEPT_CD
  popupParams.ASGN_CD = val.ASGN_CD
  popupParams.YEAR = val.YEAR
  popupParams.TITLE = val.TITLE
  popupParams.SUVY_DESC = val.SUVY_DESC
  popupParams.KIND = val.KIND
  popupParams.DIVISION = val.DIVISION
  popupParams.RSPN_PER_FROM = dayjs(val.RSPN_PER_FROM).format("YYYY-MM-DD")
  popupParams.RSPN_PER_TO = dayjs(val.RSPN_PER_TO).format("YYYY-MM-DD")
  popupParams.USE_YN = val.USE_YN
  popupParams.LOGIN_YN = val.LOGIN_YN
  popupParams.REG_YN = val.REG_YN
  popupParams.DEPT_YN = val.DEPT_YN
  popupParams.FILE_ID = val.FILE_ID
  popupParams.SAVE_GBN = val.SAVE_GBN
  popupParams.SUVY_ID = val.SUVY_ID

  if (popupParams.FILE_ID) {
    fileMsg.FILE_ID_MSG = '첨부된 파일이 있습니다.'
  } else {
    fileMsg.FILE_ID_MSG = '첨부된 파일이 없습니다.'
  }

  initCombo()

  dialog.value = true
}

//콤보박스 셋팅
const initCombo = () => {

  Promise.all([
    getCodeList(popupParams.CMPNY_DIV + 'ZS10'), //설문지 구분
  ]).then(res => {
    codeList.DIVISION = res[0].ORESULT_CUR
  })
}

watch(() => popupParams.DIVISION, (newValue, oldValue) => {
  console.log('watch=>DIVISION : ', newValue)
  resetCode(newValue)
})

const resetCode = val =>{
  console.log('[resetCode] val: ', val)
  Promise.all([
    getCodeList(popupParams.CMPNY_DIV + 'ZS00'), //설문지 종류
  ]).then(res => {
    console.log('[resetCode] res: ', res)
    codeList.KIND = res[0].ORESULT_CUR.filter(data => data.CODE_DESC1 === val)
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
    return Message.err("설문지 제목을 입력해 주세요.")
  }

  if (isEmpty(popupParams.KIND)) {
    return Message.err("설문지 구분을 선택해 주세요.")
  }

  if (isEmpty(popupParams.DIVISION)) {
    return Message.err("설문지 종류를 선택해 주세요.")
  }

  if (isEmpty(popupParams.RSPN_PER_FROM) || isEmpty(popupParams.RSPN_PER_TO)) {
    return Message.err("응답기간을 입력해 주세요.")
  }

  return true
}

//저장
const saveData = () => {

  if (popupParams.SAVE_GBN === 'NEW') { //설문지 추가
    // popupParams.SUVY_ID = dayjs().format("YYYYMMDD") + popupParams.CMPNY_DIV + popupParams.DIVISION + popupParams.KIND
    popupParams.SUVY_ID = 'NEW'
  }

  console.log("저장>>params : ", popupParams)

  let saveParams = []
  
  saveParams.push({
    CMPNY_DIV: popupParams.CMPNY_DIV, // 회사 코드
    SUVY_ID: popupParams.SUVY_ID, // 설문지코드
    BSNS_CD: popupParams.BSNS_CD, // 사업부코드
    DEPT_CD: popupParams.DEPT_CD, // 부서코드(A:직영일경우)
    ASGN_CD: popupParams.ASGN_CD, // 조직코드(B:협력사일경우)
    YEAR: popupParams.YEAR, // 년도
    KIND: popupParams.KIND, // 설문지종류
    DIVISION: popupParams.DIVISION, // 설문지구분
    TITLE: popupParams.TITLE,  // 설문지제목
    DESC: popupParams.SUVY_DESC,   // 설문지설명
    RSPN_PER_FROM: popupParams.RSPN_PER_FROM, // 응답기간(FROM)
    RSPN_PER_TO: popupParams.RSPN_PER_TO, // 응답기간(TO)
    USE_YN: popupParams.USE_YN, // 사용여부
    LOGIN_YN: popupParams.LOGIN_YN, // 로그인여부
    REG_YN: popupParams.REG_YN, // 기명여부
    DEPT_YN: popupParams.DEPT_YN, // 부서사용여부
    FILE_ID: popupParams.FILE_ID, // 첨부파일 ID(GUID)
    USER_ID: userStore.userId, // 로그인 사용자 정보
    RES_COD: "", // return 값
    RES_MSG: "", // return 값
    RES_COL: "", // return 값
  })

  return commonExecuteApi({
    queryId: "OPRAH0010_SAVE_01", list: saveParams,
  })
}

//저장 후
const afterSave = () => {
  onClose()
}

const openImgFilePopup = () => {
  console.log('이미지 첨부')
  alert('개발 예정입니다')

  //테스트
  // imageViewerPopup.value.openPopup(popupParams.FILE_ID)
}

// 파일 업로드 후 저장 
const uploaded = param => {
  console.log('upload after : ',param)
  console.log('param.fileId : ',param.fileId)

  popupParams.FILE_ID = param.fileId

  if (param.fileId) {
    popupParams.FILE_ID = param.fileId
  } else {
    popupParams.FILE_ID = ''
  }
  fileMsg.FILE_ID_MSG = popupParams.FILE_ID
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
      <span>설문지 등록/수정</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <i-input 
              v-model="popupParams.TITLE"
              class="mb-2"
              :label="$t('설문지 제목')"
              label-width="100px"
              top-label
              required
            />
            <i-input
              v-model="popupParams.SUVY_DESC"
              class="mb-2"
              :label="$t('설문지 설명')"
              label-width="100px" 
              top-label
            />
            <i-select
              v-model="popupParams.DIVISION"
              class="mb-2"
              :label="$t('설문지구분')"
              label-width="100px"
              top-label
              append-inner-icon="mdi-magnify"
              width="300px"
              :items="codeList.DIVISION"
              item-value="COD"
              item-title="TXT"
              required
            />
            <i-select
              v-model="popupParams.KIND"
              class="mb-2"
              :label="$t('설문지종류')"
              label-width="100px"
              top-label
              append-inner-icon="mdi-magnify"
              width="300px"
              :items="codeList.KIND"
              item-value="COD"
              item-title="TXT"
              required
            />
            <div class=" d-flex mb-2">
              <i-input
                v-model="popupParams.RSPN_PER_FROM"
                :label="$t('응답기간')"
                top-label
                label-width="100px"
                type="date"
                width="200px"
                required
              />
              <i-input
                v-model="popupParams.RSPN_PER_TO"
                :label="$t('~')"
                width="200px"
                class="mt-5"
                type="date"
              />
            </div>
            <div class=" d-flex mb-2">
              <span 
                class="mr-2 formLabelText" 
                style="width:100px"
              >
                설문지
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
            <div class=" d-flex mb-2">
              <span 
                class="mr-2 formLabelText" 
                style="width:100px"
              >
                통합인증
              </span>
              <VRadioGroup
                v-model="popupParams.LOGIN_YN"
                style="margin: auto"
                inline
              >
                <v-radio 
                  label="필요" 
                  value="Y"
                />
                <v-radio 
                  label="불필요" 
                  value="N"
                />
              </VRadioGroup>
            </div>
            <div class=" d-flex mb-2">
              <span 
                class="mr-2 formLabelText" 
                style="width:100px"
              >
                익명
              </span>
              <VRadioGroup
                v-model="popupParams.REG_YN"
                style="margin: auto"
                inline
              >
                <v-radio 
                  label="기명" 
                  value="Y"
                />
                <v-radio 
                  label="익명" 
                  value="N"
                />
              </VRadioGroup>
            </div>
            <div class=" d-flex mb-2">
              <span 
                class="mr-2 formLabelText" 
                style="width:100px"
              >
                부서사용여부
              </span>
              <VRadioGroup
                v-model="popupParams.DEPT_YN"
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
            <div class=" d-flex mb-2">
              <span 
                class="mr-2 formLabelText" 
                style="width:100px"
              >
                포스터
              </span>
              <span 
                class="ml-3 formLabelText" 
                style="width:200px"
              >
                {{ fileMsg.FILE_ID_MSG }}
              </span>
              <v-btn
                v-model="popupParams.FILE_ID"
                @click="openImgFilePopup"
              >
                이미지 첨부
              </v-btn>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <ImageViewerPopup
    ref="imageViewerPopup"
    @uploaded="uploaded($event)"
  />
</template>
