<!-- eslint-disable sonarjs/no-identical-functions -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, provide } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from 'dayjs'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import Message from '@hiway/utils/notify'
import causePopup from '@/components/popup/causePopup.vue'
import OZReport from '@/components/OZReport.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'


const props = defineProps({
  id: {
    Type: String,
    required: true,
  },
}) 

const emit = defineEmits(["after-search"])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const dialog = ref(false)
const menuVisible = ref(false)
const ckEditor = ref(null)
const isCreate = ref(false)
const userLogStore = useLogsStore()
const empPopup = ref(null)
const isAdmin = ref(userStore.authGrpCd.includes('GRP00369') ? true : false)

const SaveParams = reactive({
  REQ_ID: '', //요청번호
  STATUS: '', //진행상태
  CMPNY_DIV: '', //요청자 부서
  REQ_EMP_NO: '', //요청자 사번
  REQ_DATE: '', //요청일시
  ACC_CMPNY_DIV: '', //접수자 회사
  ACC_EMP_NO: '', //접수자 사번
  ACC_DATE: '', //접수일시
  ACT_CMPNY_DIV: '', //조치자 회사
  ACT_EMP_NO: '', //조치자 사번
  START_PLAN_DATE: '', //착수예정일
  START_DATE: '', //착수일
  ACT_PLAN_DATE: '', //조치예정일
  ACT_DATE: '', //조치일시
  REQ_TITLE: '', //제목
  REQ_DESCR: '', //내용
  REMARK: '', //반려사유(비고)
})

const StatusList = ref(
  [
    { COD: '10' , TXT: '작성중' },
    { COD: '20' , TXT: '접수대기' },
    { COD: '21' , TXT: '접수반려' },
    { COD: '30' , TXT: '접수완료' },
    { COD: '40' , TXT: '작업중' },
    { COD: '50' , TXT: '조치완료' },
  ],
)

const readOnlyValue = reactive({   ////컴포넌트별 readonly 플래그값
  ACT_CMPNY_DIV: true,
  ACT_EMP_NO: true,
  START_PLAN_DATE: true,
  ACT_PLAN_DATE: true,
})


const openPopup = gbn => {    //셀 클릭시 팝업오픈

  for (const [key, value] of Object.entries(gbn)) {
    if (SaveParams.hasOwnProperty(key)) {
      SaveParams[key] = value
    }
  }

  if(SaveParams.REQ_EMP_NO !== userStore.userName) {    //로그인한 사람이 아니면
    setTimeout(() => {
    menuTitle.value.disableBtn('btnDelete', true)
  })  //삭제버튼 비활성화
  }
 
  setTimeout(() => {
    menuTitle.value.disableBtn('btnReqCancel', true)
  }) 

  dialog.value = true;
  nextTick(() => {
    checkAdmin()
  })
}

const openPopup2 = gbn => {    //신규 팝업오픈
  SaveParams.CMPNY_DIV = userStore.asgnFullNm
  SaveParams.REQ_EMP_NO = userStore.userName
  SaveParams.REQ_DATE = dayjs().format("YYYY-MM-DD")
  dialog.value = true

  setTimeout(() => {
    menuTitle.value.disableBtn('btnDelete', true) //삭제버튼 비활성화
    menuTitle.value.disableBtn('btnReqCancel', true)
    menuTitle.value.visibleBtn('btnApprove', false)
    menuTitle.value.visibleBtn('btnApproveCancel', false)
    menuTitle.value.visibleBtn('btnTurnBack', false)
    menuTitle.value.visibleBtn('btnConfirm', false)
    menuTitle.value.visibleBtn('btnCancelConfirm', false)
    menuTitle.value.visibleBtn('btnFinish', false)
    menuTitle.value.visibleBtn('btnReAction', false)
  }) 
}

// 인원 조회 팝업 오픈
const openEmpPopup = () => {
  empPopup.value.openPopup({
    ACT_CMPNY_DIV: SaveParams.ACT_CMPNY_DIV,
    ACT_EMP_NO:SaveParams.ACT_EMP_NO,
  })
}

// 인원 조회 팝업 선택 이벤트
const onEmpSelected = (val) => {
  SaveParams.ACT_CMPNY_DIV = val.ASGN_NM
  SaveParams.ACT_EMP_NO = val.EMP_NO
}

//관리자 권한 체크하는 함수
const checkAdmin = () => {
  if (userStore.authGrpCd.includes('GRP00369')) {   //IT관리자일 경우
    readOnlyValue.ACT_CMPNY_DIV = false
    readOnlyValue.ACT_EMP_NO =  false
    readOnlyValue.START_PLAN_DATE = false
    readOnlyValue.ACT_PLAN_DATE = false

    menuTitle.value.visibleBtn('btnApplication', false)
    menuTitle.value.visibleBtn('btnReqCancel', false)
    menuTitle.value.visibleBtn('btnDelete', false)
  } else {
    readOnlyValue.ACT_CMPNY_DIV = true
    readOnlyValue.ACT_EMP_NO =  true
    readOnlyValue.START_PLAN_DATE = true
    readOnlyValue.ACT_PLAN_DATE = true

    menuTitle.value.visibleBtn('btnApprove', false)
    menuTitle.value.visibleBtn('btnApproveCancel', false)
    menuTitle.value.visibleBtn('btnTurnBack', false)
    menuTitle.value.visibleBtn('btnConfirm', false)
    menuTitle.value.visibleBtn('btnCancelConfirm', false)
    menuTitle.value.visibleBtn('btnFinish', false)
    menuTitle.value.visibleBtn('btnReAction', false)
  }
}

onMounted(async () => {
  onButtonsClick({ id: 'btnSearch' })  
})

const onButtonsClick = btn => {   //저장
  if (btn.id === 'btnUpdate') {
    
    menuTitle.value.disableBtn('btnDelete', false)
    SaveParams.REQ_DESCR = ckEditor.value.getContent()

    new saveFlowHelper(vm, t)
      .setBefore(mainCheck)
      .setQuery(mainSaveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()

  } else if (btn.id === 'btnApplication') {    //신청 (클릭시 상태 20)
    menuTitle.value.disableBtn('btnApplication', true)
    menuTitle.value.disableBtn('btnReqCancel', false)
    menuTitle.value.disableBtn('btnDelete', true)
    menuTitle.value.disableBtn('btnReceipt', false)
    menuTitle.value.disableBtn('btnTurnBack', false)
    
    SaveParams.STATUS = '접수대기'

  } else if (btn.id === 'btnReqCancel') {    //신청취소 (클릭시 상태 10)
    menuTitle.value.disableBtn('btnApplication', false)
    menuTitle.value.disableBtn('btnReqCancel', true)
    menuTitle.value.disableBtn('btnDelete', false)

    SaveParams.STATUS = '작성중'

  } else if (btn.id === 'btnDelete') {    //삭제
    new deleteFlowHelper(vm, t)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()

  } else if (btn.id === 'btnClose') {   //닫기
    SaveParams.REQ_ID = '',
    SaveParams.STATUS = '',
    SaveParams.CMPNY_DIV =  '', //요청자 부서
    SaveParams.REQ_EMP_NO =  '', //요청자 사번
    SaveParams.REQ_DATE = '',
    SaveParams.ACC_CMPNY_DIV = '',
    SaveParams.ACC_EMP_NO = '',
    SaveParams.ACC_DATE = '',
    SaveParams.ACT_CMPNY_DIV = '',
    SaveParams.ACT_EMP_NO = '',
    SaveParams.START_PLAN_DATE = '',
    SaveParams.START_DATE = '',
    SaveParams.ACT_PLAN_DATE = '',
    SaveParams.ACT_DATE = '',
    SaveParams.REQ_TITLE = '',
    SaveParams.REQ_DESCR = '',
    SaveParams.REMARK = '',
    dialog.value = false

  } else if (btn.id === 'btnApprove') {   //승인/접수 (클릭시 상태 30)
    SaveParams.ACC_CMPNY_DIV = userStore.asgnFullNm
    SaveParams.ACC_EMP_NO = userStore.userName
    SaveParams.ACC_DATE = dayjs().format("YYYY-MM-DD")
    
    menuTitle.value.disableBtn('btnApprove', true)
    menuTitle.value.disableBtn('btnApproveCancel', false)
    menuTitle.value.disableBtn('btnConfirm', false)
    menuTitle.value.disableBtn('btnTurnBack', true)

    SaveParams.STATUS = '접수완료'

  } else if (btn.id === 'btnApproveCancel') {  //승인취소/접수취소 (클릭시 상태 20)
    menuTitle.value.disableBtn('btnApprove', false)
    menuTitle.value.disableBtn('btnApproveCancel', true)
    menuTitle.value.disableBtn('btnTurnBack', false)
    SaveParams.STATUS = '접수대기'

  } else if (btn.id === 'btnTurnBack') {    //반려 (클릭시 상태 21)
    menuTitle.value.disableBtn('btnTurnBack', true)
    SaveParams.STATUS = '접수반려'

  } else if (btn.id === 'btnConfirm') {   //확정/착수 (클릭시 상태 40)
    SaveParams.START_DATE = dayjs().format("YYYY-MM-DD")

    menuTitle.value.disableBtn('btnFinish', false)
    menuTitle.value.disableBtn('btnCancelConfirm', false)
    menuTitle.value.disableBtn('btnConfirm', true)
    SaveParams.STATUS = '작업중'

  } else if (btn.id === 'btnCancelConfirm') {   //확정취소/착수취소 (클릭시 상태 30)
    menuTitle.value.disableBtn('btnConfirm', false)
    menuTitle.value.disableBtn('btnCancelConfirm', true)
    SaveParams.STATUS = '접수완료'

  } else if (btn.id === 'btnFinish') {    //완료 (클릭시 상태 50)
   SaveParams.ACT_DATE = dayjs().format("YYYY-MM-DD")
    menuTitle.value.disableBtn('btnReAction', false)
    menuTitle.value.disableBtn('btnFinish', true)
    
    SaveParams.STATUS = '조치완료'

  } else if (btn.id === 'btnReAction') {    //재조치요청/완료취소 (클릭시 상태 40)
    menuTitle.value.disableBtn('btnFinish', false)
    menuTitle.value.disableBtn('btnReAction', true)
    SaveParams.STATUS = '작업중'
    SaveParams.ACT_DATE = ''
  }
}



const closePopup = () => {

  dialog.value = false
}

const beforeSave = () => {
  return true
}

const mainSaveData = () => {    //저장버튼 눌렀을때
  let popupParams = []

  popupParams.push({
    REQ_ID: SaveParams.REQ_ID,
    STATUS: SaveParams.STATUS,
    CMPNY_DIV: SaveParams.CMPNY_DIV,
    REQ_EMP_NO: SaveParams.REQ_EMP_NO,
    REQ_DATE: SaveParams.REQ_DATE,
    ACC_CMPNY_DIV: SaveParams.ACC_CMPNY_DIV,
    ACC_EMP_NO: SaveParams.ACC_EMP_NO,
    ACC_DATE: SaveParams.ACC_DATE,
    ACT_CMPNY_DIV: SaveParams.ACT_CMPNY_DIV,
    ACT_EMP_NO: SaveParams.ACT_EMP_NO,
    START_PLAN_DATE: SaveParams.START_PLAN_DATE,
    START_DATE: SaveParams.START_DATE,
    ACT_PLAN_DATE: SaveParams.ACT_PLAN_DATE,
    ACT_DATE: SaveParams.ACT_DATE,
    REQ_TITLE: SaveParams.REQ_TITLE,
    REQ_DESCR: SaveParams.REQ_DESCR,
    REMARK: SaveParams.REMARK,
  })

  dialog.value = false

  return commonExecuteApi({ queryId : 'TSYSAA0030_SAVE_01', list : popupParams }) 
}

const onChange = () => {
  setTimeout(checkContent, 1000)
}

const mainCheck = () => {   //저장 전 
  if(SaveParams.STATUS === "접수반려") {
    if (!SaveParams.REQ_TITLE) {
      Message.warn(t('제목을 입력해주세요.'))

      menuTitle.value.disableBtn('btnDelete', true)
    
      return false
    } else if(!SaveParams.REQ_DESCR) {
      Message.warn(t('내용을 입력해주세요.'))

      menuTitle.value.disableBtn('btnDelete', true)
    
      return false
    } else if(!SaveParams.REMARK) {
      Message.warn(t('반려사유를 입력해주세요.'))

      return false
    }
  } else {
    if (!SaveParams.REQ_TITLE) {
      Message.warn(t('제목을 입력해주세요.'))

      menuTitle.value.disableBtn('btnDelete', true)
    
      return false
    } else if(!SaveParams.REQ_DESCR) {
      Message.warn(t('내용을 입력해주세요.'))

      menuTitle.value.disableBtn('btnDelete', true)
    
      return false
  }
}

  menuTitle.value.disableBtn('btnDelete', false)

  return true
}

const beforeDelete = () => {    //삭제 전
  return true
}

/* ********** 삭제 ********** */
const deleteData = () => {
  let popupParams = []

  popupParams.push({
    REQ_ID: SaveParams.REQ_ID,
  })

  return commonExecuteApi({ queryId : 'TSYSAA0030_DELETE_01', list: popupParams })
}


defineExpose({
  openPopup,
  openPopup2,
})


</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1600"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
      <span> 시스템 작업 요청 </span>
    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnApplication', 'btnReqCancel', 'btnDelete', 'btnApprove','btnApproveCancel',
          'btnTurnBack','btnConfirm', 'btnCancelConfirm', 'btnFinish', 'btnReAction', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="overflowY">
        <v-sheet>
          <v-card class="mb-3 mr-1 popUp-input-Form">
            <v-card-text class="pa-0">
              <div>
                <div class="d-flex my-2">
                  <i-input
                    v-model="SaveParams.REQ_ID"
                    :label="$t('요청번호')"
                    top-label
                    type="Text"
                    width="300px"
                    margin="4px"
                    readonly
                  />
                  <i-input
                    v-model="SaveParams.STATUS"
                    :label="$t('진행상태')"
                    top-label
                    type="Text"
                    width="300px"
                    margin="4px"
                    readonly
                  />
                </div>
                <div class="d-flex my-2">
                  <i-input
                    v-model="SaveParams.CMPNY_DIV"
                    :label="$t('요청자')"
                    top-label
                    type="Text"
                    width="300px"
                    margin="4px"
                    readonly
                  />
                  <i-input
                    v-model="SaveParams.REQ_EMP_NO"
                    :label="$t('')"
                    top-label
                    type="Text"
                    width="300px"
                    margin="4px"
                    readonly
                  />
                  <i-input
                    v-model="SaveParams.REQ_DATE"
                    :label="$t('요청일시')"
                    top-label
                    type="date"
                    width="300px"
                    margin="10px"
                    readonly
                  />
                </div>
                <div class="d-flex my-2">
                  <i-input
                    v-model="SaveParams.ACC_CMPNY_DIV"
                    :label="$t('접수자')"
                    top-label
                    type="Text"
                    width="300px"
                    margin="4px"
                    readonly
                  />
                  <i-input
                    v-model="SaveParams.ACC_EMP_NO"
                    :label="$t('')"
                    top-label
                    type="Text"
                    width="300px"
                    margin="4px"
                    readonly
                  />
                  <i-input
                    v-model="SaveParams.ACC_DATE"
                    :label="$t('접수일시')"
                    top-label
                    type="date"
                    width="300px"
                    margin="10px"
                    readonly
                  />
                </div>
                <div class="d-flex my-2">
                  <i-input
                    v-model="SaveParams.ACT_CMPNY_DIV"
                    :label="$t('조치자')"
                    top-label
                    :append-inner-icon="isAdmin ? 'mdi-magnify' : null"
                    @click:appendInner="openEmpPopup"
                    @keydown.enter="e => { openEmpPopup('search') }"
                    type="Text"
                    width="300px"
                    margin="4px"
                    :readonly="readOnlyValue.ACT_CMPNY_DIV"
                  />
                  <i-input
                    v-model="SaveParams.ACT_EMP_NO"
                    :label="$t('')"
                    top-label
                    type="Text"
                    width="300px"
                    margin="4px"
                    :readonly="readOnlyValue.ACT_EMP_NO"
                  />
                </div>
                <div class="d-flex my-2">
                  <i-input
                    v-model="SaveParams.START_PLAN_DATE"
                    :label="$t('착수예정일')"
                    top-label
                    type="date"
                    width="300px"
                    margin="4px"
                    :readonly="readOnlyValue.START_PLAN_DATE"
                  />
                  <i-input
                    v-model="SaveParams.START_DATE"
                    :label="$t('착수일')"
                    top-label
                    type="date"
                    width="300px"
                    margin="4px"
                    readonly
                  />
                  <i-input
                    v-model="SaveParams.ACT_PLAN_DATE"
                    :label="$t('조치예정일')"
                    top-label
                    type="date"
                    width="300px"
                    margin="4px"
                    :readonly="readOnlyValue.ACT_PLAN_DATE"
                  />
                  <i-input
                    v-model="SaveParams.ACT_DATE"
                    :label="$t('조치일')"
                    top-label
                    type="date"
                    width="300px"
                    margin="4px"
                    readonly
                  />
                </div>
                <div>
                  <i-input
                    v-model="SaveParams.REQ_TITLE"
                    :label="$t('제목')"
                    top-label
                    type="Text"
                    margin="4px"
                    width="100%"
                    required
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-sheet>
        <v-sheet
          class="mb-2"
        >
          <CKEditor
            :id="props.id"
            ref="ckEditor"
            v-model="SaveParams.REQ_DESCR"
            class="mt-2"
            @change="onChange"
            height="350px" 
          />
        </v-sheet>
        <div
          v-if="SaveParams.STATUS === '21'" class="d-flex my-2" >
          <i-textarea
            v-model="SaveParams.REMARK"
            top-label
            :label="$t('반려사유')"
            width="100%"
            required
          />
        </div>
        <EmpPopup ref="empPopup" @selected="onEmpSelected" />
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>


