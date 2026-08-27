<!-- 
  * Vue 내 용 : 안전지침서 제개정 요청 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/14
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/14 
-->

<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonRequest,
  commonSendApi,
  getCodeList,
} from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import IUpload from '@/components/IUpload.vue'
import { toUpper } from 'lodash-es'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'

import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'

const props = defineProps({
  editorId: {
    type: String,
    default: 'editor',
  },
})

const emit = defineEmits(['closed'])
const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
const fileUploadButton = reactive(['btnDownLoad', 'btnDelete'])
const approvalPopup = ref(null)
const logsStore = useLogsStore()

//mouse coordinate
const x = ref(0)
const y = ref(0)

const IsAdmin = ref('N')
const bChk = ref(true)
const isVisible = ref(true)
const isRejectVisible = ref(true) // 반려사유
const isNoteReadOnly = ref('false')
const strFileID = ref('')
const strNOTICE_TITLE = ref('')
const strREQ_NOTICE_TITLE = ref('')
const mailList = reactive([])

let CURRENT_CMPNY_DIV = ''
let CURRENT_SEQ = ''
let CURRENT_EMP_NO = ''
let CURRENT_NOTICE_DIV = ''
let CURRENT_NOTICE_NO = ''

const mouseUpdate = (event) => {
  x.value = event.pageX
  y.value = event.pageY
}

const popupParam = reactive({
  CMPNY_DIV: '',
  NOTICE_DIV: '',
  NOTICE_DOC_NO: '',
  INSERT_DATE: '',
  NOTICE_PERIOD: '',
  NOTICE_CNT: '',
  NOTICE_REG_EMPNO: '',
  NOTICE_NO: '',
  NOTICE_RANGE: '',
  NOTICE_TAG: '',
  NOTICE_FILEID: '',
  SAVE_YN: '',
  REPLY_DATE: '',
  SEQ: '',
  STATUS: '',
  REJECT_DESC: '',
  GUBUN1: '',
  GUBUN2: '',
  NOTICE_TITLE: '',
  CATEGORY1: '',
  FILE_CNT: '',
  TEL_NO: '',
  CATEGORY3: '',
  CATEGORY4: '',
  FAVORITE_CHK: '',
  REQ_STATUS: '',
  REQUEST: '',
  REJECT_DESC: '',
  REQ_NOTICE_TITLE: '',
  REQ_NOTICE_NOTE: '',
  REQ_REJECT_DESC: '',
  REQ_NOTICE_FILEID: '',
  REQ_EMP_NO: '',
  REQ_EMP_NM: '',
  EMP_NO: '',
  CONTENT: '',
  ER_GUBUN: '',
  USER_ID: userStore.userId,
})

const statusParam = reactive({
  GUBUN_READONLY: false,
  GUBUN_REQUIRE: false,
  NOTICE_TITLE_READONLY: false,
  REQ_NOTICE_TITLE_READONLY: false,
  REQ_NOTICE_TITLE_REQUIRE: true,
  REQ_REJECT_DESC_READONLY: false,
  STATUS_READONLY: false,
})

//코드리스트
const codeList = reactive({
  GUBUN1: [],
  GUBUN2: [],
  STATUS: [],
})

//초기 데이터셋팅
onMounted(() => {})

const openPopup = (val, isAdmin, chk) => {
  initData()

  IsAdmin.value = isAdmin

  if (!isEmpty(val)) {
    popupParam.CMPNY_DIV = val.CMPNY_DIV
    popupParam.NOTICE_DIV = val.NOTICE_DIV
    popupParam.NOTICE_DOC_NO = val.NOTICE_DOC_NO
    popupParam.INSERT_DATE = val.INSERT_DATE
    popupParam.NOTICE_PERIOD = val.NOTICE_PERIOD
    popupParam.NOTICE_CNT = val.NOTICE_CNT
    popupParam.NOTICE_REG_EMPNO = val.NOTICE_REG_EMPNO
    popupParam.NOTICE_NO = val.NOTICE_NO
    popupParam.NOTICE_RANGE = val.NOTICE_RANGE
    popupParam.NOTICE_TAG = val.NOTICE_TAG
    popupParam.NOTICE_FILEID = val.NOTICE_FILEID
    popupParam.SAVE_YN = val.SAVE_YN
    popupParam.REPLY_DATE = val.REPLY_DATE
    popupParam.SEQ = val.SEQ
    popupParam.STATUS = val.STATUS
    popupParam.REJECT_DESC = val.REJECT_DESC
    popupParam.GUBUN1 = val.NOTICE_TAG.substring(9, 10)
    popupParam.GUBUN2 = val.NOTICE_TAG.substring(10, 11)
    popupParam.NOTICE_TITLE = val.NOTICE_TITLE
    popupParam.CATEGORY1 = val.CATEGORY1
    popupParam.FILE_CNT = val.FILE_CNT
    popupParam.TEL_NO = val.TEL_NO
    popupParam.CATEGORY3 = val.CATEGORY3
    popupParam.CATEGORY4 = val.CATEGORY4
    popupParam.FAVORITE_CHK = val.FAVORITE_CHK
    popupParam.REQ_STATUS = val.REQ_STATUS
    popupParam.REQUEST = val.REQUEST
    popupParam.REJECT_DESC = val.REJECT_DESC
    popupParam.REQ_NOTICE_TITLE = val.REQ_NOTICE_TITLE
    popupParam.REQ_NOTICE_NOTE = val.REQ_NOTICE_NOTE
    popupParam.REQ_REJECT_DESC = val.REQ_REJECT_DESC
    popupParam.REQ_NOTICE_FILEID = val.REQ_NOTICE_FILEID
    popupParam.ER_GUBUN = val.ER_GUBUN

    if (isEmpty(val.REQ_EMP_NM)) {
      popupParam.REQ_EMP_NM = userStore.userName
    } else {
      popupParam.REQ_EMP_NM = val.REQ_EMP_NM
    }

    if (isEmpty(val.REQ_EMP_NO) || val.REQ_EMP_NO === 'undefined') {
      popupParam.EMP_NO = userStore.userId
      popupParam.REQ_EMP_NO = userStore.userId
      CURRENT_EMP_NO = userStore.userId
    } else {
      popupParam.EMP_NO = val.REQ_EMP_NO
      popupParam.REQ_EMP_NO = val.REQ_EMP_NO
      CURRENT_EMP_NO = val.REQ_EMP_NO
    }

    statusParam.GUBUN_REQUIRE = false
    statusParam.NOTICE_TITLE_READONLY = true
    strFileID.value = val.REQ_NOTICE_FILEID

    if (isEmpty(popupParam.REQ_NOTICE_NOTE)) {
      ckEditor.value.setContent('')
    } else {
      ckEditor.value.setContent(popupParam.REQ_NOTICE_NOTE)
    }

    if (isEmpty(val.NOTICE_DIV) || isEmpty(val.NOTICE_NO)) {
      isVisible.value = false
      statusParam.GUBUN_REQUIRE = true
    }

    if(popupParam.EMP_NO == userStore.userId || useLogsStore().isMenuAdmin == 'Y') {
      menuTitle.value.disableBtn('btnReqApply', false)
      menuTitle.value.disableBtn('btnFinish', false)
      menuTitle.value.disableBtn('btnReceipt', false)
      menuTitle.value.disableBtn('btnTurnBack', false)
      menuTitle.value.disableBtn('btnDelete', false)
      menuTitle.value.disableBtn('btnApplication', false)
      menuTitle.value.disableBtn('btnReqCancel', false)
      menuTitle.value.disableBtn('btnUpdate', false)
    } else {
      menuTitle.value.disableBtn('btnReqApply', true)
      menuTitle.value.disableBtn('btnFinish', true)
      menuTitle.value.disableBtn('btnReceipt', true)
      menuTitle.value.disableBtn('btnTurnBack', true)
      menuTitle.value.disableBtn('btnDelete', true)
      menuTitle.value.disableBtn('btnApplication', true)
      menuTitle.value.disableBtn('btnReqCancel', true)
      menuTitle.value.disableBtn('btnUpdate', true)
    }
    // 작성중: A
    // 승인대기중: B
    // 접수대기: C
    // 제개정중: D
    // 접수반려: E
    // 결재반려: F
    // 개정완료: G
    // 제정완료: H
    if (popupParam.STATUS === 'A' || isEmpty(popupParam.STATUS)) {
      isNoteReadOnly.value = 'false'

      if (isEmpty(popupParam.NOTICE_DIV) || isEmpty(popupParam.NOTICE_NO)) {
        statusParam.GUBUN_REQUIRE = true
      }
    } else if (
      popupParam.STATUS === 'B' ||
      popupParam.STATUS === 'C' ||
      popupParam.STATUS === 'D'
    ) {
      //제목
      statusParam.REQ_NOTICE_TITLE_READONLY = true
      statusParam.REQ_NOTICE_TITLE_REQUIRE = false

      statusParam.GUBUN_READONLY = true
      statusParam.GUBUN_REQUIRE = false
    } else {
      //제목
      statusParam.REQ_NOTICE_TITLE_READONLY = true
      statusParam.REQ_NOTICE_TITLE_REQUIRE = false

      //반려사유
      statusParam.REQ_REJECT_DESC_READONLY = true

      statusParam.GUBUN_READONLY = true
      statusParam.GUBUN_REQUIRE = false
    }
  } else {
    bChk.value = chk
    popupParam.REQ_EMP_NM = userStore.userName
    popupParam.CMPNY_DIV = userStore.cmpnyDiv
    popupParam.USER_ID = userStore.userId
    popupParam.EMP_NO = userStore.userId

    statusParam.GUBUN_REQUIRE = true
    statusParam.NOTICE_TITLE_READONLY = false

    isNoteReadOnly.value = 'false'
    isVisible.value = false

    menuTitle.value.disableBtn('btnReqApply', false)
    menuTitle.value.disableBtn('btnFinish', false)
    menuTitle.value.disableBtn('btnReceipt', false)
    menuTitle.value.disableBtn('btnTurnBack', false)
    menuTitle.value.disableBtn('btnDelete', false)
    menuTitle.value.disableBtn('btnApplication', false)
    menuTitle.value.disableBtn('btnReqCancel', false)
    menuTitle.value.disableBtn('btnUpdate', false)
  }

  strNOTICE_TITLE.value = '지침서명'

  if (isEmpty(popupParam.ER_GUBUN)) {
    strREQ_NOTICE_TITLE.value = '안전지침서명'
  } else {
    strREQ_NOTICE_TITLE.value = '(' + popupParam.ER_GUBUN + ')안전지침서명'
  }

  console.log('[DATBA0010Popup03] popupParam : ', popupParam)

  dialog.value = true

  initCombo()
  checkFileId()
}

const checkFileId = () => {
  if (isEmpty(strFileID.value)) {
    fileUpload.value.setGuid()
    strFileID.value = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(strFileID.value)
    strFileID.value = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
}

// 페이지 레이아웃 세팅
const chkStatus = () => {
  menuTitle.value.setBtnProperty('btnReqApply', 'visible', true) // 결재상신
  menuTitle.value.setBtnProperty('btnFinish', 'visible', true) // 완료
  menuTitle.value.setBtnProperty('btnReceipt', 'visible', true) // 접수
  menuTitle.value.setBtnProperty('btnTurnBack', 'visible', true) // 반려
  menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제
  menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
  menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소
  menuTitle.value.setBtnProperty('btnUpdate', 'visible', true) // 저장
  isRejectVisible.value = true // 반려사유
  statusParam.STATUS_READONLY = true

  console.log('[chkStatus] STATUS : ', popupParam.STATUS)
  console.log('[chkStatus] IsAdmin : ', IsAdmin.value)

  switch (popupParam.STATUS) {
    case 'A': // 작성중
      statusParam.REQ_NOTICE_TITLE_READONLY = false
      isNoteReadOnly.value = false

      menuTitle.value.setBtnProperty('btnReqApply', 'visible', true) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnReceipt', 'visible', false) // 접수
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      if (bChk.value) {
        menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제
      } else {
        menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제
      }
      menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
      menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소
      isRejectVisible.value = false // 반려사유
      statusParam.REQ_NOTICE_TITLE_REQUIRE = true // 제목
      break
    case 'B': // 승인대기중
      statusParam.REQ_NOTICE_TITLE_READONLY = true
      isNoteReadOnly.value = true

      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnReceipt', 'visible', false) // 접수
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제
      menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
      menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
      isRejectVisible.value = false // 반려사유
      statusParam.REQ_NOTICE_TITLE_REQUIRE = false // 제목

      if (IsAdmin.value === 'Y') {
        menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
        menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
        menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제
        menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
        menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소
        menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
        isRejectVisible.value = false // 반려사유
      }
      break
    case 'C': // 접수대기
      statusParam.REQ_NOTICE_TITLE_READONLY = true
      isNoteReadOnly.value = true

      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnReceipt', 'visible', false) // 접수
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제
      menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
      menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
      isRejectVisible.value = false // 반려사유
      statusParam.REQ_NOTICE_TITLE_REQUIRE = false // 제목

      if (IsAdmin.value === 'Y') {
        menuTitle.value.setBtnProperty('btnReceipt', 'visible', true) // 접수
        menuTitle.value.setBtnProperty('btnTurnBack', 'visible', true) // 반려
        menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제
        menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
        menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소
        menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
        isRejectVisible.value = true // 반려사유
      }
      break
    case 'D': // 제개정중
      statusParam.REQ_NOTICE_TITLE_READONLY = true
      isNoteReadOnly.value = true

      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnReceipt', 'visible', false) // 접수
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제
      menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
      menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
      isRejectVisible.value = false // 반려사유
      statusParam.REQ_NOTICE_TITLE_REQUIRE = false // 제목

      if (IsAdmin.value === 'Y') {
        menuTitle.value.setBtnProperty('btnFinish', 'visible', true) // 완료
        menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제
        menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
        menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소
        menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
        isRejectVisible.value = true // 반려사유
      }
      break
    case 'E': // 접수반려
    case 'F': // 결재반려
      statusParam.REQ_NOTICE_TITLE_READONLY = true

      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnReceipt', 'visible', false) // 접수
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제
      menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
      menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
      isRejectVisible.value = true // 반려사유
      break
    case 'G': // 개정완료
      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnReceipt', 'visible', false) // 접수
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제
      menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
      menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
      isRejectVisible.value = false // 반려사유
      break
    default: // 처음 작성 상태
      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnReceipt', 'visible', false) // 접수
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제
      menuTitle.value.setBtnProperty('btnApplication', 'visible', false) // 신청
      menuTitle.value.setBtnProperty('btnReqCancel', 'visible', false) // 신청취소

      isRejectVisible.value = false // 반려사유
      break
  }
}

// 콤보박스 셋팅
const initCombo = () => {
  Promise.all([
    
    // cmpnyDiv가 일렉일 경우 데이터가 조회되지 않아서 HHI로 고정함 (2024.10.23 by kykim)
    getCodeList('HHI' + 'Z090C'), //요청 콤보
    getCodeList('HHI' + 'Z090BA'), //분류1 콤보
    getCodeList('HHI' + 'Z090BB'), //분류2 콤보
    
    // getCodeList(userStore.cmpnyDiv + 'Z090C'), //요청 콤보
    // getCodeList(userStore.cmpnyDiv + 'Z090BA'), //분류1 콤보
    // getCodeList(userStore.cmpnyDiv + 'Z090BB'), //분류2 콤보
  ]).then((res) => {
    codeList.STATUS = res[0].ORESULT_CUR
    codeList.GUBUN1 = res[1].ORESULT_CUR
    codeList.GUBUN2 = res[2].ORESULT_CUR

    console.log('[initCombo] res: ', res)

    console.log('[initCombo] STATUS : ', popupParam.STATUS)
    console.log('[initCombo] NOTICE_TAG : ', popupParam.NOTICE_TAG)

    if (isEmpty(popupParam.STATUS)) {
      popupParam.STATUS = 'A' // 작성중
    } else {
      if (
        popupParam.NOTICE_TAG.indexOf('HHIZ090BA') === 0 &&
        popupParam.NOTICE_TAG.length === 11
      ) {
        popupParam.GUBUN1 = popupParam.NOTICE_TAG.substring(9, 10)
        popupParam.GUBUN2 = popupParam.NOTICE_TAG.substring(10, 11)
      }
    }

    statusParam.STATUS_READONLY = true

    chkStatus()
  })
}

const onClose = () => {
  emit('closed')
  dialog.value = false
}

const initData = () => {
  popupParam.CMPNY_DIV = ''
  popupParam.NOTICE_DIV = ''
  popupParam.NOTICE_DOC_NO = ''
  popupParam.INSERT_DATE = ''
  popupParam.NOTICE_PERIOD = ''
  popupParam.NOTICE_CNT = ''
  popupParam.NOTICE_REG_EMPNO = ''
  popupParam.NOTICE_NO = ''
  popupParam.NOTICE_RANGE = ''
  popupParam.NOTICE_TAG = ''
  popupParam.NOTICE_FILEID = ''
  popupParam.SAVE_YN = ''
  popupParam.REPLY_DATE = ''
  popupParam.SEQ = ''
  popupParam.STATUS = ''
  popupParam.REJECT_DESC = ''
  popupParam.GUBUN1 = ''
  popupParam.GUBUN2 = ''
  popupParam.NOTICE_TITLE = ''
  popupParam.CATEGORY1 = ''
  popupParam.FILE_CNT = ''
  popupParam.TEL_NO = ''
  popupParam.CATEGORY3 = ''
  popupParam.CATEGORY4 = ''
  popupParam.FAVORITE_CHK = ''
  popupParam.REQ_STATUS = ''
  popupParam.REQUEST = ''
  popupParam.REJECT_DESC = ''
  popupParam.REQ_NOTICE_TITLE = ''
  popupParam.REQ_NOTICE_NOTE = ckEditor.value.setContent('')
  popupParam.REQ_REJECT_DESC = ''
  popupParam.USER_ID = ''
  popupParam.EMP_NO = ''

  statusParam.GUBUN_READONLY = false
  statusParam.GUBUN_REQUIRE = false
  statusParam.NOTICE_TITLE_READONLY = false
  statusParam.REQ_NOTICE_TITLE_READONLY = false
  statusParam.REQ_NOTICE_TITLE_REQUIRE = true
  statusParam.REQ_REJECT_DESC_READONLY = false
  statusParam.STATUS_READONLY = false

  IsAdmin.value = 'N'
  bChk.value = false
  isVisible.value = true
  isRejectVisible.value = true
  isNoteReadOnly.value = 'false'
  strFileID.value = ''

  CURRENT_CMPNY_DIV = ''
  CURRENT_SEQ = ''
  CURRENT_EMP_NO = ''
  CURRENT_NOTICE_DIV = ''
  CURRENT_NOTICE_NO = ''

  fileUpload.value.clearGrid()
}

defineExpose({
  openPopup,
})

const onButtonsClick = (btn) => {
  console.log('onButtonsClick', btn.id)

  if (btn.id === 'btnReqApply') {
    ReqApply()
  } else if (btn.id === 'btnFinish') {
    Complete()
  } else if (btn.id === 'btnReceipt') {
    Regist()
  } else if (btn.id === 'btnTurnBack') {
    if (isEmpty(popupParam.REQ_REJECT_DESC)) {
      return Message.warn('반려 사유를 입력해주세요.')
    }

    Reject()
  } else if (btn.id === 'btnDelete') {
    Delete()
  } else if (btn.id === 'btnApplication') {
    Apply()
  } else if (btn.id === 'btnReqCancel') {
    Cancel()
  } else if (btn.id === 'btnUpdate') {
    saveData('btnUpdate')
  } else if (btn.id === 'btnClose') {
    onClose()
  }
}

/* ************ 신청취소 *************** */
const Cancel = async () => {
  let result = await vm.$swal({
    title: t('신청을 취소하시겠습니까?'),
    showCancelButton: true,
  })

  if (!result.isConfirmed) {
    return
  } else {
    let saveParams = []

    saveParams.push({
      CMPNY_DIV: isEmpty(CURRENT_CMPNY_DIV)
        ? popupParam.CMPNY_DIV
        : CURRENT_CMPNY_DIV,
      SEQ: isEmpty(CURRENT_SEQ) ? popupParam.SEQ : CURRENT_SEQ,
      EMP_NO: isEmpty(CURRENT_EMP_NO) ? popupParam.REQ_EMP_NO : CURRENT_EMP_NO,
      STATUS: 'A', // 작성중
      USER_ID: userStore.userId,
    })

    console.log('[Cancel] saveParams: ', saveParams)

    Promise.all([
      commonExecuteApi({ queryId: 'DATBA0010_SAVE_05', list: saveParams }),
    ]).then((res) => {
      console.log('[Cancel] res: ', res)

      let rcod = res[0].list[0].OUT_RES_COD

      if (rcod === '0') {
        popupParam.STATUS = 'A'
        chkStatus()
      }
    })
  }
}

/* ************ 신청 *************** */
const Apply = async () => {
  let result = await vm.$swal({
    title: t('신청을 진행하시겠습니까?'),
    showCancelButton: true,
  })

  if (!result.isConfirmed) {
    return
  } else {
    let saveParams = []

    saveParams.push({
      CMPNY_DIV: isEmpty(CURRENT_CMPNY_DIV)
        ? popupParam.CMPNY_DIV
        : CURRENT_CMPNY_DIV,
      SEQ: isEmpty(CURRENT_SEQ) ? popupParam.SEQ : CURRENT_SEQ,
      EMP_NO: isEmpty(CURRENT_EMP_NO) ? popupParam.REQ_EMP_NO : CURRENT_EMP_NO,
      STATUS: 'B', // 승인대기중
      USER_ID: userStore.userId,
    })

    console.log('[Apply] saveParams: ', saveParams)

    Promise.all([
      commonExecuteApi({ queryId: 'DATBA0010_SAVE_05', list: saveParams }),
    ]).then((res) => {
      console.log('[Apply] res: ', res)

      let rcod = res[0].list[0].OUT_RES_COD

      if (rcod === '0') {
        popupParam.STATUS = 'E'
        chkStatus()
      }
    })
  }
}

/* ************ 삭제처리 *************** */
const Delete = async () => {
  let result = await vm.$swal({
    title: t('삭제처리 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!result.isConfirmed) {
    return
  } else {
    let deleteParams = []

    deleteParams.push({
      CMPNY_DIV: isEmpty(CURRENT_CMPNY_DIV)
        ? popupParam.CMPNY_DIV
        : CURRENT_CMPNY_DIV,
      SEQ: isEmpty(CURRENT_SEQ) ? popupParam.SEQ : CURRENT_SEQ,
      EMP_NO: isEmpty(CURRENT_EMP_NO) ? popupParam.REQ_EMP_NO : CURRENT_EMP_NO,
    })

    console.log('[Delete] saveParams: ', deleteParams)

    Promise.all([
      commonExecuteApi({ queryId: 'DATBA0010_DELETE_02', list: deleteParams }),
    ]).then((res) => {
      console.log('[Delete] res: ', res)

      let rcod = res[0].list[0].OUT_RES_COD

      if (rcod === '0') {
        onClose()
      }
    })
  }
}

/* ************ 반려처리 *************** */
const Reject = async () => {
  let result = await vm.$swal({
    title: t('반려처리 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!result.isConfirmed) {
    return
  } else {
    let saveParams = []

    saveParams.push({
      CMPNY_DIV: isEmpty(CURRENT_CMPNY_DIV)
        ? popupParam.CMPNY_DIV
        : CURRENT_CMPNY_DIV,
      SEQ: isEmpty(CURRENT_SEQ) ? popupParam.SEQ : CURRENT_SEQ,
      EMP_NO: isEmpty(CURRENT_EMP_NO) ? popupParam.REQ_EMP_NO : CURRENT_EMP_NO,
      STATUS: 'E',
      REJECT_DESC: popupParam.REQ_REJECT_DESC,
      MGR_COMPANY: userStore.cmpnyDiv,
      MGR_EMP_NO: userStore.userId,
      MGR_UPDATE_DATE: dayjs().format('YYYYMMDD'),
      USER_ID: userStore.userId,
    })

    console.log('[Reject] saveParams: ', saveParams)

    Promise.all([
      commonExecuteApi({ queryId: 'DATBA0010_SAVE_04', list: saveParams }),
    ]).then((res) => {
      console.log('[Regist] res: ', res)

      let rcod = res[0].list[0].OUT_RES_COD

      if (rcod === '0') {
        popupParam.STATUS = 'E'
        chkStatus()
      }
    })
  }
}

/* ************ 접수처리 *************** */
const Regist = async () => {
  let result = await vm.$swal({
    title: t('접수 처리 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!result.isConfirmed) {
    return
  } else {
    let saveParams = []

    saveParams.push({
      CMPNY_DIV: isEmpty(CURRENT_CMPNY_DIV)
        ? popupParam.CMPNY_DIV
        : CURRENT_CMPNY_DIV,
      SEQ: isEmpty(CURRENT_SEQ) ? popupParam.SEQ : CURRENT_SEQ,
      EMP_NO: isEmpty(CURRENT_EMP_NO) ? popupParam.REQ_EMP_NO : CURRENT_EMP_NO,
      STATUS: 'D',
      USER_ID: userStore.userId,
    })

    console.log('[Regist] saveParams: ', saveParams)

    Promise.all([
      commonExecuteApi({ queryId: 'DATBA0010_SAVE_05', list: saveParams }),
    ]).then((res) => {
      console.log('[Regist] res: ', res)

      let rcod = res[0].list[0].OUT_RES_COD

      if (rcod === '0') {
        popupParam.STATUS = 'D'
        chkStatus()
      }
    })
  }
}

/* ************ 완료처리 *************** */
const Complete = async () => {
  let result = await vm.$swal({
    title: t('완료처리 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!result.isConfirmed) {
    return
  } else {
    let saveParams = []

    saveParams.push({
      CMPNY_DIV: isEmpty(CURRENT_CMPNY_DIV)
        ? popupParam.CMPNY_DIV
        : CURRENT_CMPNY_DIV,
      SEQ: isEmpty(CURRENT_SEQ) ? popupParam.SEQ : CURRENT_SEQ,
      EMP_NO: isEmpty(CURRENT_EMP_NO) ? popupParam.REQ_EMP_NO : CURRENT_EMP_NO,
      STATUS: 'G',
      USER_ID: userStore.userId,
    })

    console.log('[Finish] saveParams: ', saveParams)

    Promise.all([
      commonExecuteApi({ queryId: 'DATBA0010_SAVE_05', list: saveParams }),
    ]).then((res) => {
      console.log('[Finish] res: ', res)

      let rcod = res[0].list[0].OUT_RES_COD

      if (rcod === '0') {
        popupParam.STATUS = 'G'
        chkStatus()
      }
    })
  }
}

/* ************ 결재상신 *************** */
const ReqApply = async () => {
  let result = await vm.$swal({
    title: t('결재상신을 진행하시겠습니까?'),
    showCancelButton: true,
  })

  if (!result.isConfirmed) {
    return
  } else {
    saveData('ReqApply')
  }
}

const saveData = (btnId) => {
  popupParam.REQ_NOTICE_NOTE = ckEditor.value.getContent()
  let bShowConfirmMessage = true

  console.log('btnId ', btnId)

  if (btnId === 'ReqApply') {
    //console.log('bShowConfirmMessage ', '111111')
    bShowConfirmMessage = false
  }

  //console.log('bShowConfirmMessage ', '333333')

  new saveFlowHelper(vm, t)
    .setBefore(beforeSaveQue)
    .setQuery(saveDataQue)
    .setAfter((result) => {
      console.log('[saveData] result : ', result)
      let rcod = result.OUT_RES_COD
      let rmsg = result.OUT_RES_MSG

      if (rcod === '0') {
        popupParam.STATUS = 'A'
        bChk.value = true

        const splStr = rmsg.split(',')

        console.log('[saveData] splStr : ', splStr)

        CURRENT_CMPNY_DIV = splStr[0]
        CURRENT_SEQ = splStr[1]
        CURRENT_EMP_NO = splStr[2]
        CURRENT_NOTICE_DIV = splStr[3]
        CURRENT_NOTICE_NO = splStr[4]

        console.log('[saveData] btnId : ', CURRENT_CMPNY_DIV)

        if (btnId === 'ReqApply') {
          saveApproval()
        }
      } else {
        Message.err(t(rmsg))
      }
    })
    .showMessage(bShowConfirmMessage)
    .run()
}

// 저장 전 체크
const beforeSaveQue = () => {
  if (isEmpty(popupParam.STATUS)) {
    return Message.warn('진행상태를 확인해주세요.')
  }

  if (isEmpty(popupParam.GUBUN1)) {
    return Message.warn('적용사업부를 선택해주세요.')
  }

  if (isEmpty(popupParam.GUBUN2)) {
    return Message.warn('작업구분을 선택해주세요.')
  }

  if (isEmpty(popupParam.REQ_NOTICE_TITLE)) {
    return Message.warn('제목을 입력해주세요.')
  }

  console.log('[beforeSaveQue] 내용: ', popupParam)

  if (isEmpty(popupParam.REQ_NOTICE_NOTE)) {
    return Message.warn('내용을 입력해주세요.')
  }

  return true
}

// 저장
const saveDataQue = () => {
  let saveParams = []

  saveParams.push({
    CMPNY_DIV: isEmpty(popupParam.CMPNY_DIV)
      ? isEmpty(CURRENT_CMPNY_DIV)
        ? userStore.cmpnyDiv
        : CURRENT_CMPNY_DIV
      : popupParam.CMPNY_DIV,
    SEQ: isEmpty(CURRENT_SEQ)
      ? isEmpty(popupParam.SEQ)
        ? ''
        : popupParam.SEQ
      : CURRENT_SEQ,
    EMP_NO: isEmpty(CURRENT_EMP_NO) ? userStore.userId : CURRENT_EMP_NO,
    STATUS: 'A',
    NOTICE_TITLE: popupParam.REQ_NOTICE_TITLE,
    NOTICE_NOTE: popupParam.REQ_NOTICE_NOTE,
    NOTICE_FILEID: strFileID.value,
    APPLY_DATE: dayjs().format('YYYYMMDD'),
    NOTICE_DIV: popupParam.NOTICE_DIV,
    NOTICE_NO: popupParam.NOTICE_NO,
    GUBUN1: popupParam.GUBUN1,
    GUBUN2: popupParam.GUBUN2,
    USER_ID: userStore.userId,

    RES_COD: '', // return 값
    RES_MSG: '', // return 값
    RES_COL: '', // return 값
  })
  console.log('[saveDataQue] 결재 데이터 저장 >>>> ', saveParams)

  return commonRequest('/hse/data/DATBA0010_SAVE_03', {
    queryId: 'DATBA0010_SAVE_03',
    list: saveParams,
  })
}

// 결재 저장 후 결재 팝업 호출
const saveApproval = () => {
  console.log('[saveApproval] 결재 상신 데이터 처리 ..... ')

  let printParams = {
    CMPNY_DIV: CURRENT_CMPNY_DIV,
    SEQ: CURRENT_SEQ,
    EMP_NO: CURRENT_EMP_NO,
    NOTICE_DIV: CURRENT_NOTICE_DIV,
    NOTICE_NO: CURRENT_NOTICE_NO,
  }

  Promise.all([
    commonRequest('/hse/data/DATBA0010_PRINT_01', {
      queryId: 'DATBA0010_PRINT_01',
      param: printParams,
    }),
  ]).then((res) => {
    console.log('결재상신 저장 후 : ', res[0].ORESULT_CUR.length)

    var sb = []
    let reqDT = dayjs().format('YYYY년 MM월 DD일')

    console.log('[saveApproval] GUBUN1 : ', popupParam.GUBUN1)
    console.log('[saveApproval] GUBUN2 : ', popupParam.GUBUN2)
    console.log('[saveApproval] codeList1 : ', codeList.GUBUN1)

    const strGUBUN1 = _.find(codeList.GUBUN1, { COD: popupParam.GUBUN1 })
    const strGUBUN2 = _.find(codeList.GUBUN2, { COD: popupParam.GUBUN2 })

    if (res[0].ORESULT_CUR.length === 0) {
      return false
    }

    console.log(
      '[saveApproval] REQ_NOTICE_NOTE : ',
      res[0].ORESULT_CUR[0].REQ_NOTICE_NOTE
    )
    console.log('[saveApproval] strGUBUN1 : ', strGUBUN1)
    console.log('[saveApproval] strGUBUN2 : ', strGUBUN2)

    popupParam.REQ_NOTICE_NOTE = res[0].ORESULT_CUR[0].REQ_NOTICE_NOTE

    sb.push(
      "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>\n"
    )
    sb.push('<!-- saved from url=(0016)http://localhost -->\n')
    sb.push('<html>\n')
    sb.push('<head>\n')
    sb.push('	<title>Document</title>\n')
    sb.push(
      "	<meta HTTP-EQUIV='Content-Type' CONTENT='text/html; charset=utf-8'/>\n"
    )
    sb.push("	<style type='text/css'>\n")
    sb.push(
      '		.csBDC6B565 {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top:#000000 1px solid;border-right:#000000 1px solid;border-bottom:#000000 1px solid;font-family:굴림; font-size:24px; font-weight:bold; font-style:normal; padding-top:3px;padding-left:2px;padding-right:2px;}\n'
    )
    sb.push(
      '		.cs646CAD4E {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right:#000000 1px solid;border-bottom:#000000 1px solid;font-family:굴림; font-size:12px; font-weight:bold; font-style:normal; }\n'
    )
    sb.push(
      '		.csC4373936 {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right:#000000 1px solid;border-bottom:#000000 1px solid;font-family:굴림; font-size:12px; font-weight:bold; font-style:normal; padding-left:2px;}\n'
    )
    sb.push(
      '		.csC30264BF {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right:#000000 1px solid;border-bottom:#000000 1px solid;font-family:굴림; font-size:12px; font-weight:bold; font-style:normal; padding-top:2px;padding-left:2px;padding-bottom:2px;}\n'
    )
    sb.push(
      '		.csFEB6DE {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right-style: none;border-bottom:#000000 1px solid;font-family:굴림; font-size:12px; font-weight:bold; font-style:normal; }\n'
    )
    sb.push(
      '		.csA4B31CBB {color:#000000;background-color:transparent;border-left:#000000 1px solid;border-top-style: none;border-right-style: none;border-bottom:#000000 1px solid;font-family:굴림; font-size:12px; font-weight:bold; font-style:normal; padding-left:2px;padding-right:2px;}\n'
    )
    sb.push(
      "		.cs55559FD6 {color:#000000;background-color:transparent;border-left-style: none;border-top-style: none;border-right-style: none;border-bottom-style: none;font-family:'Times New Roman'; font-size:13px; font-weight:normal; font-style:normal; padding-left:2px;padding-right:2px;}\n"
    )
    sb.push(
      '		.csF7D3565D {height:0px;width:0px;overflow:hidden;font-size:0px;line-height:0px;}\n'
    )
    sb.push('	</style>\n')
    sb.push('</head>\n')
    sb.push(
      '<body leftMargin=10 topMargin=10 rightMargin=10 bottomMargin=10>\n'
    )
    sb.push(
      "<div style='border-left:#000000 1px solid;border-top:#000000 1px solid;border-right:#000000 1px solid;border-bottom:#000000 1px solid;background-color:#FFFFFF;width:665px;height:945px;'>\n"
    )
    sb.push(
      "	<table cellpadding='0' cellspacing='0' border='0' style='border-width:0px;empty-cells:show;width:637px;height:912px;position:relative;'>\n"
    )
    sb.push("		<tr style='vertical-align:top;'>\n")
    sb.push("			<td style='width:29px;height:95px;'></td>\n")
    sb.push("			<td style='width:72px;'></td>\n")
    sb.push("			<td style='width:142px;'></td>\n")
    sb.push("			<td style='width:56px;'></td>\n")
    sb.push("			<td style='width:33px;'></td>\n")
    sb.push("			<td style='width:82px;'></td>\n")
    sb.push("			<td style='width:34px;'></td>\n")
    sb.push("			<td style='width:68px;'></td>\n")
    sb.push("			<td style='width:121px;'></td>\n")
    sb.push('		</tr>\n')
    sb.push("		<tr style='vertical-align:top;'>\n")
    sb.push("			<td style='height:106px;'></td>\n")
    sb.push(
      "			<td class='csBDC6B565' colspan='8' style='width:602px;height:101px;line-height:29px;text-align:center;vertical-align:middle;'><nobr>안전지침서&nbsp;제개정&nbsp;요청</nobr></td>\n"
    )
    sb.push('		</tr>\n')
    sb.push("		<tr style='vertical-align:top;'>\n")
    sb.push("			<td style='height:38px;'></td>\n")
    sb.push(
      "			<td class='csFEB6DE' style='width:71px;height:37px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>신청일자</nobr></td>\n"
    )
    sb.push(
      "			<td class='csFEB6DE' style='width:141px;height:37px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>" +
        reqDT +
        '</nobr></td>\n'
    )
    sb.push(
      "			<td class='csFEB6DE' style='width:55px;height:37px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>사번</nobr></td>\n"
    )
    sb.push(
      "			<td class='csFEB6DE' colspan='3' style='width:148px;height:37px;line-height:12px;text-align:center;vertical-align:middle;'><nobr>" +
        popupParam.EMP_NO +
        '</nobr></td>\n'
    )
    sb.push(
      "			<td class='csFEB6DE' style='width:67px;height:37px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>이름</nobr></td>\n"
    )
    sb.push(
      "			<td class='cs646CAD4E' style='width:119px;height:37px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>" +
        popupParam.REQ_EMP_NM +
        '</nobr></td>\n'
    )
    sb.push('		</tr>\n')
    sb.push("		<tr style='vertical-align:top;'>\n")
    sb.push("			<td style='height:24px;'></td>\n")
    sb.push(
      "			<td class='csFEB6DE' style='width:71px;height:23px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>적용사업부</nobr></td>\n"
    )
    sb.push(
      "			<td class='csFEB6DE' colspan='3' style='width:230px;height:23px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>" +
        strGUBUN1.TXT +
        '</nobr></td>\n'
    )
    sb.push(
      "			<td class='csFEB6DE' style='width:81px;height:23px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>작업구분</nobr></td>\n"
    )
    sb.push(
      "			<td class='cs646CAD4E' colspan='3' style='width:221px;height:23px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>" +
        strGUBUN2.TXT +
        '</nobr></td>\n'
    )
    sb.push('		</tr>\n')
    sb.push("		<tr style='vertical-align:top;'>\n")
    sb.push("			<td style='height:24px;'></td>\n")
    sb.push(
      "			<td class='csFEB6DE' style='width:71px;height:23px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>지침서명</nobr></td>\n"
    )
    sb.push(
      "			<td class='csC30264BF' colspan='7' style='width:532px;height:19px;'>" +
        popupParam.NOTICE_TITLE +
        '</td>\n'
    )
    sb.push('		</tr>\n')
    sb.push("		<tr style='vertical-align:top;'>\n")
    sb.push("			<td style='height:24px;'></td>\n")
    sb.push(
      "			<td class='csA4B31CBB' style='width:67px;height:23px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>제목</nobr></td>\n"
    )
    sb.push(
      "			<td class='csC4373936' colspan='7' style='width:532px;height:23px;line-height:14px;text-align:left;vertical-align:middle;'><nobr>" +
        popupParam.REQ_NOTICE_TITLE +
        '</nobr></td>\n'
    )
    sb.push('		</tr>\n')
    sb.push("		<tr style='vertical-align:top;'>\n")
    sb.push("			<td style='height:24px;'></td>\n")
    sb.push(
      "			<td class='csA4B31CBB' style='width:67px;height:23px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>내용</nobr></td>\n"
    )
    sb.push(
      "			<td class='csC4373936' colspan='7' style='width:532px;height:23px;line-height:14px;text-align:left;vertical-align:middle;'><nobr>" +
        popupParam.REQ_NOTICE_NOTE +
        '</nobr></td>\n'
    )
    sb.push('		</tr>\n')
    sb.push("		<tr style='vertical-align:top;'>\n")
    sb.push("			<td style='height:555px;'></td>\n")
    sb.push('			<td></td>\n')
    sb.push('			<td></td>\n')
    sb.push('			<td></td>\n')
    sb.push('			<td></td>\n')
    sb.push('			<td></td>\n')
    sb.push('			<td></td>\n')
    sb.push('			<td></td>\n')
    sb.push('			<td></td>\n')
    sb.push('		</tr>\n')
    sb.push("		<tr style='vertical-align:top;'>\n")
    sb.push("			<td style='height:22px;'></td>\n")
    sb.push(
      "			<td class='cs55559FD6' colspan='8' style='width:604px;height:22px;line-height:15px;text-align:center;vertical-align:middle;'><nobr>1/1</nobr></td>\n"
    )
    sb.push('		</tr>\n')
    sb.push('	</table>\n')
    sb.push('</div>\n')
    sb.push('</body>\n')
    sb.push('</html>\n')

    let xmlSrc = sb.join('')

    popupParam.CONTENT = xmlSrc

    approvalPopup.value.openPopup({
      CLSS_ID: logsStore.vueId,
      TITLE: '안전지침서 제개정신청',
      CMPNY_DIV: popupParam.CMPNY_DIV,
      DATA_KEY:
        popupParam.CMPNY_DIV +
        ';' +
        userStore.bsnsCd +
        ';' +
        userStore.deptCd +
        ';' +
        userStore.asgnCd +
        ';' +
        new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
      REPORT: popupParam.CONTENT,
      MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      CLRLINE: 'CLR_15', //결재라인
    })
  })
}

// 결재 상신 팝업창이 닫혔을때 리로드.
const onApprovalClosed = (appKey) => {
  console.log('[ApprovalPopup] onApprovalClosed: ', appKey)
  let saveParams = []

  if (!isEmpty(appKey)) {
    saveParams.push({
      CMPNY_DIV: isEmpty(popupParam.CMPNY_DIV)
        ? CURRENT_CMPNY_DIV
        : popupParam.CMPNY_DIV,
      SEQ: isEmpty(popupParam.SEQ) ? CURRENT_SEQ : popupParam.SEQ,
      EMP_NO: isEmpty(popupParam.REQ_EMP_NO)
        ? CURRENT_EMP_NO
        : popupParam.REQ_EMP_NO,
      APPROVE_ID: appKey,
      USER_ID: userStore.userId,
      RES_COD: '', // return 값
      RES_MSG: '', // return 값
      RES_COL: '', // return 값
    })

    Promise.all([
      commonExecuteApi({ queryId: 'DATBA0010_SAVE_06', list: saveParams }),
    ]).then((res) => {
      console.log('[onApprovalClosed] res: ', res)

      let rcod = res[0].list[0].OUT_RES_COD
      let rmsg = res[0].list[0].OUT_RES_MSG

      if (rcod != '0') {
        return Message.err(t(rmsg))
      } else {
        popupParam.STATUS = 'B'
        chkStatus()
        sendMail()
      }
    })
  }
}

/* ********** 메일 상신 ********** */
const sendMail = () => {
  const mailParams = reactive({
    EMAIL: [],
    SUBJECT: '안전지침서 제개정신청',
    CONTENT: '',
  })

  Promise.all([
    commonSearchApi({
      queryId: 'PKG_DATBA0010_SEARCH_EMP_01',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_SYS_CD: 'HHIZ090D',
        USE_FLAG: 'Y',
        RETIRE_YN: 'N',
      },
    }),
  ]).then((res) => {
    if (res[0].ORESULT_CUR.length > 0) {
      res[0].ORESULT_CUR.forEach((item) => {
        mailParams.EMAIL.push(item.EMAIL)
      })

      let str = ''

      if (isEmpty(CURRENT_NOTICE_DIV) || isEmpty(CURRENT_NOTICE_NO)) {
        str += '안녕하십니까?<br><br>'
        str +=
          '안전지침서 제정신청 관련 결재상신을 하였습니다. <br> 확인 부탁드립니다.<br><br>'
        str += popupParam.CONTENT
      } else {
        str += '안녕하십니까?<br><br>'
        str +=
          '안전지침서 개정신청 관련 결재상신을 하였습니다. <br> 확인 부탁드립니다.<br><br>'
        str += popupParam.CONTENT
      }

      mailParams.CONTENT = str

      console.log('[sendMail] mailParams: ', mailParams)

      commonSendApi(mailParams).then((res) => {
        Message.success(t('메일이 전송되었습니다.'))
      })
    }
  })
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1000"
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
      <span> 안전지침서 제개정 요청</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnReqApply',
            'btnFinish',
            'btnReceipt',
            'btnTurnBack',
            'btnUpdate',
            'btnDelete',
            'btnApplication',
            'btnReqCancel',
            'btnClose',
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area" style="max-height:800px; overflow-y: auto;">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="popupParam.REQ_EMP_NM"
                :label="$t('신청자')"
                top-label
                width="150px"
                label-width="80px"
                readonly
              />
              <i-select
                v-model="popupParam.STATUS"
                :label="$t('진행상태')"
                top-label
                label-width="80px"
                append-inner-icon="mdi-magnify"
                :items="codeList.STATUS"
                item-value="COD"
                item-title="TXT"
                width="150px"
                :readonly="statusParam.STATUS_READONLY"
              />
              <i-select
                v-model="popupParam.GUBUN1"
                :label="$t('적용사업부')"
                top-label
                label-width="80px"
                append-inner-icon="mdi-magnify"
                :items="codeList.GUBUN1"
                item-value="COD"
                item-title="TXT"
                width="150px"
                :required="statusParam.GUBUN_REQUIRE"
                :readonly="statusParam.GUBUN_READONLY"
              />
              <i-select
                v-model="popupParam.GUBUN2"
                :label="$t('작업구분')"
                top-label
                label-width="80px"
                append-inner-icon="mdi-magnify"
                :items="codeList.GUBUN2"
                item-value="COD"
                item-title="TXT"
                width="150px"
                :required="statusParam.GUBUN_REQUIRE"
                :readonly="statusParam.GUBUN_READONLY"
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-if="isVisible"
                v-model="popupParam.NOTICE_TITLE"
                :label="strNOTICE_TITLE"
                top-label
                label-width="200px"
                width="840px"
                :readonly="statusParam.NOTICE_TITLE_READONLY"
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="popupParam.REQ_NOTICE_TITLE"
                :label="strREQ_NOTICE_TITLE"
                top-label
                label-width="200px"
                width="840px"
                :required="statusParam.REQ_NOTICE_TITLE_REQUIRE"
                :readonly="statusParam.REQ_NOTICE_TITLE_READONLY"
              />
            </div>
          </v-sheet>
          <v-sheet height="40%" class="mb-2">
            <CKEditor
              :id="props.editorId"
              ref="ckEditor"
              v-model="popupParam.REQ_NOTICE_NOTE"
              class="mt-2"
              :is-read-only="isNoteReadOnly"
            />
          </v-sheet>
          <v-sheet height="10%" class="mb-2">
            <i-input
              v-if="isRejectVisible"
              v-model="popupParam.REQ_REJECT_DESC"
              :label="$t('반려 사유')"
              label-width="80px"
              width="980px"
              :readonly="statusParam.REQ_REJECT_DESC_READONLY"
            />
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload"
              :max-file-size="300"
              :button-list="fileUploadButton"
              auto-upload
              style="height: 370px"
            />
          </v-sheet>
        </div>
        <ApprovalPopup ref="approvalPopup" @approvalAppkey="onApprovalClosed" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
