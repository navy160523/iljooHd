
<!-- 
  * Vue 내 용 : 표준서 등록 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/22
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/22 
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import _ from "lodash"
import { isEmpty } from "@/@core/utils"
import Message from '@hiway/utils/notify'
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import dayjs from "dayjs"
import IUpload from "@/components/IUpload.vue"

const emit = defineEmits(["closed"])

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)

const menuTitle = ref(null)
const ckEditor = ref(null)
const empPopup = ref(null)
const fileUpload = ref(null)
const fileUploadSub = ref(null)
const fileVisible = ref(false)
const fileUploadButton = reactive(["btnDownLoad", "btnDelete"])

const popupParam = reactive(
  {
    CMPNY_DIV: userStore.cmpnyDiv,
    NOTICE_DIV: '',
    NOTICE_NO: '',
    NOTICE_TITLE: '',
    NOTICE_NOTE: '',
    NOTICE_REG_EMPNO: userStore.userId,
    NOTICE_REG_EMP_NM: userStore.userName,
    NOTICE_REG_DATE: dayjs().format("YYYY-MM-DD"),
    NOTICE_FILEID: '',
    NOTICE_FILEID_ORG: '',
    CLSFC:'',
    ECM_YN:'N',
    NOTICE_NO1:'',
    SAVE_CHK: '',
  },
)

const ClassificationList = ref(
  [
    { COD: 'C' , TXT: '공통' },
    { COD: 'S' , TXT: '안전' },
    { COD: 'H' , TXT: '보건' },
    { COD: 'E' , TXT: '환경' },
  ],
)

/* ECM 표준서 제(개정) 결재완료여부 */
const dtECM = reactive([
  { COD: "Y", TXT: "예" },
  { COD: "N", TXT: "아니오" },
])

const openPopup = (data, div) => {
  if(isEmpty(data)) {
    popupParam.SAVE_CHK = 'new'
    popupParam.CLSFC = "C" 
    popupParam.CMPNY_DIV = userStore.cmpnyDiv
    popupParam.NOTICE_REG_EMPNO = userStore.userId
    popupParam.NOTICE_REG_EMP_NM = userStore.userName
    popupParam.NOTICE_REG_DATE = dayjs().format("YYYY-MM-DD")
    ckEditor.value.setContent("")
    menuTitle.value.disableBtn('btnUpdate', false)
    fileVisible.value = true
    fileUpload.value.enableFileUploadButton(['btnDelete'])
    fileUploadSub.value.enableFileUploadButton(['btnDelete'])
  }
  else {
    popupParam.NOTICE_NO1 = data.NOTICE_NO1
    popupParam.SAVE_CHK = 'update'
    popupParam.CMPNY_DIV = data.CMPNY_DIV
    popupParam.NOTICE_DIV = data.NOTICE_DIV
    popupParam.NOTICE_NO = data.NOTICE_NO
    popupParam.NOTICE_TITLE = data.NOTICE_TITLE
    popupParam.NOTICE_REG_EMPNO = data.NOTICE_REG_EMPNO
    popupParam.NOTICE_REG_EMP_NM = data.KOR_NM
    popupParam.NOTICE_REG_DATE = dayjs(data.INSERT_DATE).format('YYYY-MM-DD')
    popupParam.NOTICE_FILEID = data.NOTICE_FILEID
    popupParam.NOTICE_FILEID_ORG = data.NOTICE_FILEID_ORG
    popupParam.CLSFC = data.CLSFC

    ckEditor.value.setContent(data.NOTICE_NOTE)
    if(popupParam.NOTICE_REG_EMPNO == userStore.userId || useLogsStore().isMenuAdmin == 'Y') {
      menuTitle.value.disableBtn('btnUpdate', false)
      fileVisible.value = true
      fileUpload.value.enableFileUploadButton(['btnDelete'])
      fileUploadSub.value.enableFileUploadButton(['btnDelete'])
    } else {
      menuTitle.value.disableBtn('btnUpdate', true)
      fileVisible.value = false
      fileUpload.value.diableFileUploadButton(['btnDelete'])
      fileUploadSub.value.diableFileUploadButton(['btnDelete'])
    }
  }

  popupParam.NOTICE_DIV = div
  
  dialog.value = true

  checkFileId()
  initPage()
}

const initPage = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: popupParam.CMPNY_DIV,
    NOTICE_DIV: popupParam.NOTICE_DIV,
    NOTICE_NO: popupParam.NOTICE_NO,
    USER_ID: popupParam.NOTICE_REG_EMPNO,
  })

  return commonExecuteApi({ queryId : 'DATAA0010_SAVE_03', list: saveParams }) 
}

const checkFileId = () => {
  if (isEmpty(popupParam.NOTICE_FILEID)) {
    fileUpload.value.setGuid()
    popupParam.NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(popupParam.NOTICE_FILEID)
    popupParam.NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }

  if (isEmpty(popupParam.NOTICE_FILEID_ORG)) {
    fileUploadSub.value.setGuid()
    popupParam.NOTICE_FILEID_ORG = fileUploadSub.value.guid
    fileUploadSub.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUploadSub.value.setGuid(popupParam.NOTICE_FILEID_ORG)
    popupParam.NOTICE_FILEID_ORG = fileUploadSub.value.guid
    fileUploadSub.value.onButtonsClick({ id: "btnSearch" })
  }
}

const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { 
        onClose()
      })
      .run()   
  }
  else if (btn.id === 'btnClose')
  {
    onClose()
  }
}

// 저장 전 체크
const beforeSave = () => {
  popupParam.NOTICE_NOTE = ckEditor.value.getContent()

  if (isEmpty(popupParam.NOTICE_TITLE)) {
    return Message.warn("표준서명은 필수 입력 항목입니다.")
  }

  if (isEmpty(popupParam.NOTICE_NOTE)) {
    return Message.warn("내용은 필수 입력 항목입니다.")
  }

  if (isEmpty(popupParam.NOTICE_REG_EMPNO)) {
    return Message.warn("등록(수정)자는 필수 입력 항목입니다.")
  }

  if (isEmpty(popupParam.NOTICE_REG_DATE)) {
    return Message.warn("등록(수정)일은 필수 입력 항목입니다.")
  }

  if (isEmpty(popupParam.NOTICE_NO1)) {
    return Message.warn("표준서번호는 필수 입력 항목입니다.")
  }

  if (popupParam.ECM_YN === 'N') {
    return Message.warn("HD오피스 ECM 표준서에서 제/개정 결재 완료 후 등록해 주시기 바랍니다.")
  }

  return true
}

// 저장
const saveData = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: popupParam.CMPNY_DIV,
    NOTICE_DIV: popupParam.NOTICE_DIV,
    NOTICE_NO: popupParam.NOTICE_NO,
    NOTICE_TITLE: popupParam.NOTICE_TITLE,
    NOTICE_NOTE: popupParam.NOTICE_NOTE,
    NOTICE_FILEID: popupParam.NOTICE_FILEID,
    NOTICE_FILEID_ORG: popupParam.NOTICE_FILEID_ORG,
    CLSFC: popupParam.CLSFC,
    ECM_YN: popupParam.ECM_YN,
    REG_DATE: popupParam.NOTICE_REG_DATE,
    NOTICE_NO1: popupParam.NOTICE_NO1,
    USER_ID: popupParam.NOTICE_REG_EMPNO,
  })
  return commonExecuteApi({ queryId : 'DATAA0010_SAVE_01', list: saveParams }) 
}

const deptValidation = () => {
  popupParam.NOTICE_REG_EMP_NM = popupParam.NOTICE_REG_EMP_NM.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, "")
}

// 인원 조회 팝업 오픈
const openEmpPopup = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: popupParam.NOTICE_REG_EMP_NM,
  })
}

// 인원 조회 팝업 선택 이벤트
const onEmpSelected = val => {
  popupParam.NOTICE_REG_EMP_NM = val.EMP_NM
  popupParam.NOTICE_REG_EMPNO = val.EMP_NO
}

const onClose = () => {

  popupParam.CMPNY_DIV = ''
  popupParam.NOTICE_DIV = ''
  popupParam.NOTICE_NO = ''
  popupParam.NOTICE_TITLE = ''
  popupParam.NOTICE_NOTE = ckEditor.value.setContent("")
  popupParam.NOTICE_REG_EMPNO = ''
  popupParam.NOTICE_REG_EMP_NM = ''
  popupParam.NOTICE_REG_DATE = ''
  popupParam.NOTICE_FILEID = ''
  popupParam.NOTICE_FILEID_ORG = ''
  popupParam.NOTICE_NO1 = ''
  popupParam.CLSFC = ''

  fileUpload.value.clearGrid()
  fileUploadSub.value.clearGrid()

  dialog.value = false
  emit("closed")
}

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="900"
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
      <span>표준서등록</span>
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
          <v-sheet class="searchArea flex-column">
            <i-input
              v-model="popupParam.NOTICE_TITLE"
              :label="$t('표준서명')"
              label-width="80px"
              top-label
              width="840px"
              required
            />
            <div class="d-flex mt-2">
              <i-select
                v-model="popupParam.CLSFC"
                :label="$t('분류')"
                top-label
                :items="ClassificationList"
                item-title="TXT"
                item-value="COD"
                label-width="80px"
                append-inner-icon="mdi-magnify"
                width="150px"
                required
              />
              <i-input
                v-model="popupParam.NOTICE_REG_EMP_NM"
                width="155px"
                :label="$t('등록(수정)자')"
                top-label
                append-inner-icon="mdi-magnify"
                :rules="[deptValidation]"
                required
                @click:append-inner="openEmpPopup"
                @keydown.enter="() => openEmpPopup('인원조회')"
              />
              <i-input
                v-model="popupParam.NOTICE_REG_DATE"
                :label="$t('등록(수정)일')"
                top-label
                label-width="80px"
                type="date"
                width="150px"
                required
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="popupParam.NOTICE_NO1" 
                :label="$t('표준서번호')"
                top-label
                label-width="80px"
                width="300px"
                required
              />
              <i-select
                v-model="popupParam.ECM_YN"
                :label="$t('ECM 표준서 제(개정) 결재완료여부')"
                top-label
                label-width="220px"
                append-inner-icon="mdi-magnify"
                :items="dtECM"
                item-title="TXT"
                item-value="COD"
                width="150px"
                required
              />
            </div>
          </v-sheet>
          <v-sheet 
            height="50%" 
            class="mb-2"
          > 
            <CKEditor
              id="DATAA0010"
              ref="ckEditor" 
              v-model="popupParam.NOTICE_NOTE"
              class="mt-2 "
            />
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload"
              grid-title="파일첨부"
              :max-file-size="300"
              :is-visibled="fileVisible"
              :button-list="fileUploadButton"
              :isCmpnyDiv="false"
              auto-upload
              style="height: 370px"
            />
          </v-sheet> 
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUploadSub"
              grid-title="서식파일첨부"
              :max-file-size="300"
              :is-visibled="fileVisible"
              :button-list="fileUploadButton"
              :isCmpnyDiv="false"
              auto-upload
              style="height: 370px"
            />
          </v-sheet> 
        </div>
        <!-- 인원조회팝업 -->
        <EmpPopup 
          ref="empPopup" 
          @selected="onEmpSelected" 
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
