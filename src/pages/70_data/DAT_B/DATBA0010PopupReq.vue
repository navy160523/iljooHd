<!-- 
  * Vue 내 용 : 안전지침서 제개정 요청 팝업
  * 작 성 자 : HNIX 이규호
  * 최초 작성일 : 2025/10/23 
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
import RealGrid from '@/components/RealGrid.vue'
import IUpload from '@/components/IUpload.vue'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
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
const fileCount = ref(0);
const fileUpload = ref(null)
const fileUpload2 = ref(null)
const fileReadOnly = ref(false)
const fileUploadButton = reactive(['btnDownLoad', 'btnDelete'])
const fileUploadPopup = ref(null)
const approvalPopup = ref(null)
const logsStore = useLogsStore()

//mouse coordinate
const x = ref(0)
const y = ref(0)

const IsAdmin = ref('N')
const popGBN = ref('')

const isEditTitleVisible = ref(false)
const isRejectVisible = ref(true) // 반려사유
const isNoteReadOnly = ref('false')
const strFileID = ref('')
const strFileID2 = ref('')
const strNOTICE_TITLE = ref('')

const mailList = reactive([])

let CURRENT_CMPNY_DIV = ''
let CURRENT_SEQ = ''
let CURRENT_EMP_NO = ''
let CURRENT_NOTICE_DIV = ''
let CURRENT_NOTICE_NO = ''

const grdMain2 = ref(null)

const mouseUpdate = (event) => {
  x.value = event.pageX
  y.value = event.pageY
}

const popupParam = reactive({
  CMPNY_DIV: '',
  SEQ: '',
  EMP_NO: '',
  ER_GUBUN: '',

  NOTICE_TITLE: '',
  GUBUN1: [],
  GUBUN2: '',
  NOTICE_DOC_NO: '',
  CATEGORY1: '', // 개정번호
  NOTICE_DOC_REV: '', // 개정번호
  STATUS: '',
  APPLY_DATE: '',
  INSERT_DATE: '',
  EMP_NM: '',
  TEL_NO: '',
  REQ_NOTICE_NOTE: '',
  REJECT_DESC: '',

  NOTICE_DIV: '',
  NOTICE_NO: '',
  NOTICE_FILEID: '',
  NOTICE_FILEID2: '',

  HIS_TYPE: '',
  
  USER_ID: userStore.userId,
})

const statusParam = reactive({
  GUBUN_READONLY1: false,
  GUBUN_READONLY2: false,
  GUBUN_REQUIRE: true,  
  NOTICE_TITLE_READONLY: false,
  NOTICE_TITLE_REQUIRE: true,
  REJECT_DESC_READONLY: false,
  //STATUS_READONLY: false,  
})

//코드리스트
const codeList = reactive({
  GUBUN1: [],
  GUBUN2: [],
  STATUS: [],
})

//그리드2 속성셋팅
const grdMain2Props = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : ['CMPNY_DIV','NOTICE_DIV','NOTICE_NO'],
  fields : [ 
    { fieldName: 'CATEGORY1', dataType: 'text', width: '50', header: { text: t('개정No.') }, editable:false },
    { fieldName: 'CATEGORY4', dataType: 'text', width: '90', header: { text: t('제개정일') }, editable:false },
    //{ fieldName: 'CATEGORY2', dataType: 'text', width: '300', header: { text: t('제개정 사유') } },
    { fieldName: 'NOTICE_NOTE', dataType: 'text', width: '300', 
      header: { text: t('제개정 사유') }, editable:false, 
      styleName: 'multiline-editor-pre', 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          var str = `<div class="d-flex  justify-start">
            <div></div>
            <div>${cell.value}</div>            
          </div>`
          return str
        },
      },
    },
    { fieldName: 'INSERT_DATE', dataType: 'text', width: '90', header: { text: t('등록일') }, editable:false },
    { fieldName: 'FILE_OPEN', dataType: 'text', width: '60', editable: false, header: { text: t('열람') }, editable:false,
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20

        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/detailSearch.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }

        return ret
      },
    },
    { fieldName: 'FILE_NAME', dataType: 'text', width: '200', type: 'data', header: { text: t('파일명') }, editable:false },
    { fieldName: 'NOTICE_REG_EMPNM', dataType: 'text', width: '90', header: { text: t('담당자') }, editable:false },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text' , visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_FILEID_ORG', dataType: 'text' , visible: false },
    { fieldName: 'FILE_NO', dataType: 'text' , visible: false },
    { fieldName: 'LOCAL_PATH', dataType: 'text' , visible: false },
    { fieldName: 'DIV_CD', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMain2Props.columns = grdMain2Props.fields

//초기 데이터셋팅
onMounted(() => {})

const openPopup = (val, isAdmin, gbn) => {
  initData()
  initCombo()

  IsAdmin.value = isAdmin
  popGBN.value = gbn

  console.log(val) 
  console.log('popGBN.value ::: ', popGBN.value) 

  if(popGBN.value === 'NEW') {
    //제정요청    
    popupParam.EMP_NM = userStore.userName
    popupParam.CMPNY_DIV = userStore.cmpnyDiv
    popupParam.USER_ID = userStore.userId
    popupParam.EMP_NO = userStore.userId
    popupParam.TEL_NO = userStore.telNo
    popupParam.STATUS = 'A'
    popupParam.ER_GUBUN = 'E'
    popupParam.APPLY_DATE = dayjs().format('YYYY-MM-DD')

    isEditTitleVisible.value = false

  }else if(popGBN.value === 'REV'){
    //개정요청
    popupParam.EMP_NM = userStore.userName    
    popupParam.USER_ID = userStore.userId
    popupParam.EMP_NO = userStore.userId
    popupParam.TEL_NO = userStore.telNo
    popupParam.STATUS = 'A'
    popupParam.ER_GUBUN = 'R'

    if (!isEmpty(val)) {
      popupParam.NOTICE_TITLE = val.NOTICE_TITLE
      popupParam.GUBUN1 = val.GUBUN1.replaceAll(' ', '').split(',')
      popupParam.GUBUN2 = val.GUBUN2
      popupParam.NOTICE_DOC_NO = val.NOTICE_DOC_NO
      popupParam.APPLY_DATE = dayjs().format('YYYY-MM-DD')

      popupParam.CMPNY_DIV = val.CMPNY_DIV
      popupParam.NOTICE_DIV = val.NOTICE_DIV
      popupParam.NOTICE_NO = val.NOTICE_NO 
      popupParam.HIS_TYPE = '' // 전체

      Promise.all([
        commonRequest("/hse/data/DATBA0010_SELECT_CLOB02", 
          { 
            queryId: "DATBA0010_SELECT_03", 
            param: popupParam,
          }),
      ]).then(res => {        
        grdMain2.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      })
    }else{
      return
    }

    statusParam.NOTICE_TITLE_READONLY = true
    statusParam.GUBUN_READONLY2 = true
    isEditTitleVisible.value = true

  }else if(popGBN.value === 'EDIT'){
    
    //제.개정요청에서 더블클릭 시
    if (!isEmpty(val)) {
      popupParam.CMPNY_DIV = val.CMPNY_DIV
      popupParam.SEQ = val.SEQ
      popupParam.EMP_NO = val.REQ_EMP_NO

      popupParam.NOTICE_TITLE = val.REQ_NOTICE_TITLE
      popupParam.GUBUN1 = val.GUBUN1.replaceAll(' ', '').split(',')
      popupParam.GUBUN2 = val.GUBUN2
      popupParam.NOTICE_DOC_NO = val.NOTICE_DOC_NO
      popupParam.NOTICE_DOC_REV = val.NOTICE_DOC_REV
      popupParam.STATUS = val.STATUS
      popupParam.ER_GUBUN = val.ER_GUBUN
      popupParam.APPLY_DATE = val.APPLY_DATE
      popupParam.EMP_NM = val.REQ_EMP_NM    
      popupParam.USER_ID = userStore.userId      
      popupParam.TEL_NO = val.REQ_TEL_NO
      popupParam.REQ_NOTICE_NOTE = val.REQ_NOTICE_NOTE
      popupParam.REJECT_DESC = val.REJECT_DESC
      popupParam.NOTICE_FILEID = val.REQ_NOTICE_FILEID
      popupParam.NOTICE_FILEID2 = val.REQ_NOTICE_FILEID2
      strFileID.value = val.REQ_NOTICE_FILEID
      strFileID2.value = val.REQ_NOTICE_FILEID2

      if(isEmpty(popupParam.REQ_NOTICE_NOTE)) {
        ckEditor.value.setContent("")
      }
      else {
        ckEditor.value.setContent(popupParam.REQ_NOTICE_NOTE)
      }

      popupParam.NOTICE_DIV = val.NOTICE_DIV
      popupParam.NOTICE_NO = val.NOTICE_NO 
      popupParam.HIS_TYPE = '' // 전체

      Promise.all([
        commonRequest("/hse/data/DATBA0010_SELECT_CLOB02", 
          { 
            queryId: "DATBA0010_SELECT_03", 
            param: popupParam,
          }),
      ]).then(res => {   
        console.log('res[0].ORESULT_CUR', res[0].ORESULT_CUR)     
        grdMain2.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      })
    }

    statusParam.NOTICE_TITLE_READONLY = true
    if(popupParam.ER_GUBUN === 'R'){
      statusParam.GUBUN_READONLY2 = true
    }
    isEditTitleVisible.value = true
  }else{
    //비정상 접속

  }
  
  dialog.value = true

  chkStatus()
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

  if (isEmpty(strFileID2.value)) {
    fileUpload2.value.setGuid()
    strFileID2.value = fileUpload2.value.guid
    fileUpload2.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    fileUpload2.value.setGuid(strFileID2.value)
    strFileID2.value = fileUpload2.value.guid
    fileUpload2.value.onButtonsClick({ id: 'btnSearch' })
  }
}

// 페이지 레이아웃 세팅
const chkStatus = () => {
  menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
  menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
  menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
  menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제
  menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
  isRejectVisible.value = false // 반려사유
  //statusParam.STATUS_READONLY = true 
  fileReadOnly.value = false  

  console.log('[chkStatus] STATUS : ', popupParam.STATUS)
  console.log('[chkStatus] IsAdmin : ', IsAdmin.value)

  switch (popupParam.STATUS) {
    case 'A': // 작성중      
      isNoteReadOnly.value = false
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', true) // 저장
      menuTitle.value.setBtnProperty('btnReqApply', 'visible', true) // 결재상신
      if (IsAdmin.value === 'Y') {
        menuTitle.value.setBtnProperty('btnFinish', 'visible', true) // 완료
      }else{
        menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      }
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      if (popGBN.value === 'EDIT') {
        menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제
      } else {
        menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제
      }      
      isRejectVisible.value = false // 반려사유
      statusParam.NOTICE_TITLE_REQUIRE = true // 제목
      break
    case 'B': // 승인대기중
      
      isNoteReadOnly.value = true

      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제      
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
      isRejectVisible.value = false // 반려사유
      statusParam.NOTICE_TITLE_REQUIRE = false // 제목

      fileReadOnly.value = true 
      isEditTitleVisible.value = false   

      if (IsAdmin.value === 'Y') {
        menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
        menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
        menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제        
        menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
        isRejectVisible.value = false // 반려사유
      }
      break    
    case 'D': // 제개정중
      
      isNoteReadOnly.value = true

      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제      
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
      isRejectVisible.value = false // 반려사유
      fileReadOnly.value = true
      statusParam.NOTICE_TITLE_REQUIRE = false // 제목

      if (IsAdmin.value === 'Y') {
        menuTitle.value.setBtnProperty('btnFinish', 'visible', true) // 완료
        menuTitle.value.setBtnProperty('btnTurnBack', 'visible', true) // 반려
        menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제        
        menuTitle.value.setBtnProperty('btnUpdate', 'visible', true) // 저장
        isRejectVisible.value = true // 반려사유
        fileReadOnly.value = false
      }
      break
    case 'E': // 접수반려
      menuTitle.value.setBtnProperty('btnReqApply', 'visible', true) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제      
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', true) // 저장
      //fileReadOnly.value = true
      isEditTitleVisible.value = false
      isRejectVisible.value = true // 반려사유
      statusParam.REJECT_DESC_READONLY = true
      break
    case 'F': // 결재반려      

    menuTitle.value.setBtnProperty('btnReqApply', 'visible', true) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', true) // 삭제      
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', true) // 저장
      //fileReadOnly.value = true
      isEditTitleVisible.value = false
      isRejectVisible.value = true // 반려사유
      statusParam.REJECT_DESC_READONLY = true
      break
    case 'G': // 개정완료
      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제      
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
      isRejectVisible.value = false // 반려사유
      statusParam.GUBUN_READONLY1 = true
      statusParam.GUBUN_READONLY2 = true
      statusParam.GUBUN_REQUIRE = false
      statusParam.NOTICE_TITLE_READONLY = true
      statusParam.NOTICE_TITLE_REQUIRE = false
      statusParam.REJECT_DESC_READONLY = true
      isNoteReadOnly.value = 'true' 
      
      fileReadOnly.value = true
      isEditTitleVisible.value = false     
      break
    default: // 처음 작성 상태
      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
      menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
      menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제      

      isRejectVisible.value = false // 반려사유
      break
  }

  if(IsAdmin.value === 'Y' || popupParam.EMP_NO  === userStore.userId) {      
      
  } 
  else {
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) // 결재상신
    menuTitle.value.setBtnProperty('btnFinish', 'visible', false) // 완료
    menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
    menuTitle.value.setBtnProperty('btnDelete', 'visible', false) // 삭제
    menuTitle.value.setBtnProperty('btnUpdate', 'visible', false) // 저장
    isRejectVisible.value = false // 반려사유
    fileReadOnly.value = true    
    isEditTitleVisible.value = false
  }

  console.log('fileReadOnly.value',fileReadOnly.value)

  if(fileReadOnly.value){
    fileUpload.value.diableFileUploadButton(['btnDelete'])
    fileUpload2.value.diableFileUploadButton(['btnDelete'])
  }else{
    fileUpload.value.enableFileUploadButton(['btnDelete'])
    fileUpload2.value.enableFileUploadButton(['btnDelete'])
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
    
    if (isEmpty(popupParam.STATUS)) {
      popupParam.STATUS = 'A' // 작성중
    }     
  })
}

const onClose = () => {
  grdMain2.value.getDataProvider().setRows(null)
  emit('closed')
  dialog.value = false
}

const initData = () => {  

  popupParam.CMPNY_DIV = ''
  popupParam.SEQ = ''
  popupParam.EMP_NO = ''

  popupParam.NOTICE_TITLE = ''
  popupParam.GUBUN1 = []
  popupParam.GUBUN2 = ''
  popupParam.NOTICE_DOC_NO = ''
  popupParam.CATEGORY1 = ''
  popupParam.NOTICE_DOC_REV = ''
  popupParam.STATUS = ''
  popupParam.APPLY_DATE = ''
  popupParam.INSERT_DATE = ''
  popupParam.EMP_NM = ''
  popupParam.TEL_NO = ''
  popupParam.REQ_NOTICE_NOTE = ckEditor.value.setContent('')
  popupParam.REJECT_DESC = ''

  popupParam.NOTICE_DIV = ''
  popupParam.NOTICE_NO = ''
  popupParam.NOTICE_FILEID = ''
  popupParam.NOTICE_FILEID2 = ''
  popupParam.HIS_TYPE = ''
    
  popupParam.USER_ID = ''
  
  statusParam.GUBUN_READONLY1 = false
  statusParam.GUBUN_READONLY2 = false
  statusParam.GUBUN_REQUIRE = true
  
  statusParam.NOTICE_TITLE_READONLY = false
  statusParam.NOTICE_TITLE_REQUIRE = true
  statusParam.REJECT_DESC_READONLY = false
  //statusParam.STATUS_READONLY = true

  IsAdmin.value = 'N'
  popGBN.value = ''
  
  isRejectVisible.value = true
  isNoteReadOnly.value = 'false'
  strFileID.value = ''
  strFileID2.value = ''  

  fileUpload.value.clearGrid()
  fileUpload2.value.clearGrid()
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
  } else if (btn.id === 'btnTurnBack') {
    if (isEmpty(popupParam.REJECT_DESC)) {
      return Message.warn('반려 사유를 입력해주세요.')
    }
    Reject()
  } else if (btn.id === 'btnDelete') {
    Delete()
  } else if (btn.id === 'btnUpdate') {
    saveData('btnUpdate', true)
  } else if (btn.id === 'btnClose') {
    onClose()
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
      EMP_NO: isEmpty(CURRENT_EMP_NO) ? popupParam.EMP_NO : CURRENT_EMP_NO,
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
      EMP_NO: isEmpty(CURRENT_EMP_NO) ? popupParam.EMP_NO : CURRENT_EMP_NO,
      STATUS: 'E',
      REJECT_DESC: popupParam.REJECT_DESC,
      MGR_COMPANY: userStore.cmpnyDiv,
      MGR_EMP_NO: userStore.userId,
      MGR_UPDATE_DATE: dayjs().format('YYYYMMDD'),
      USER_ID: userStore.userId,
    })

    console.log('[Reject] saveParams: ', saveParams)

    Promise.all([
      commonExecuteApi({ queryId: 'DATBA0010_SAVE_04', list: saveParams }),
    ]).then((res) => {
      console.log('[Reject] res: ', res)

      let rcod = res[0].list[0].OUT_RES_COD

      if (rcod === '0') {
        popupParam.STATUS = 'E'
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
    saveData('Complete',false)
    
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
    saveData('ReqApply', false)
  }
}

const saveData = (btnId, showMessage) => {
  popupParam.REQ_NOTICE_NOTE = ckEditor.value.getContent()
  //let bShowConfirmMessage = true

  console.log('btnId ', btnId)

  /*if (btnId === 'ReqApply') {
    //console.log('bShowConfirmMessage ', '111111')
    bShowConfirmMessage = false
  }*/

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
        

        const splStr = rmsg.split(',')

        console.log('[saveData] splStr : ', splStr)

        CURRENT_CMPNY_DIV = splStr[0]
        CURRENT_SEQ = splStr[1]
        CURRENT_EMP_NO = splStr[2]
        CURRENT_NOTICE_DIV = splStr[3]
        CURRENT_NOTICE_NO = splStr[4]

        console.log('[saveData] CURRENT_CMPNY_DIV : ', CURRENT_CMPNY_DIV)

        if (btnId === 'ReqApply') {
          saveApproval()
        } else if(btnId === 'Complete') {
          console.log('Complete')
          let saveParams = []

          saveParams.push({
            CMPNY_DIV: isEmpty(CURRENT_CMPNY_DIV)
              ? popupParam.CMPNY_DIV
              : CURRENT_CMPNY_DIV,
            SEQ: isEmpty(CURRENT_SEQ) ? popupParam.SEQ : CURRENT_SEQ,
            EMP_NO: isEmpty(CURRENT_EMP_NO) ? popupParam.EMP_NO : CURRENT_EMP_NO,
            STATUS: 'G',
            USER_ID: userStore.userId,
          })

          console.log('[Finish] saveParams: ', saveParams)

          Promise.all([
            commonExecuteApi({ queryId: 'DATBA0010_UPDATE_03', list: saveParams }),
          ]).then((res) => {
            console.log('[Finish] res: ', res)

            let rcod = res[0].list[0].OUT_RES_COD

            if (rcod === '0') {
              popupParam.STATUS = 'G'
              chkStatus()
            }
          })
        }
      } else {
        Message.err(t(rmsg))
      }
    })
    .showMessage(showMessage)
    .run()
}

// 저장 전 체크
const beforeSaveQue = () => {
  if (isEmpty(popupParam.NOTICE_TITLE)) {
    return Message.warn('지침서명을 입력해주세요.')
  }

  if (isEmpty(popupParam.STATUS)) {
    return Message.warn('진행상태를 확인해주세요.')
  }

  if (isEmpty(popupParam.GUBUN1)) {
    return Message.warn('적용사업부를 선택해주세요.')
  }

  if (isEmpty(popupParam.GUBUN2)) {
    return Message.warn('작업구분을 선택해주세요.')
  }

  if (isEmpty(popupParam.REQ_NOTICE_NOTE)) {
    return Message.warn('제/개정사유를 입력해주세요.')
  }

  console.log('[beforeSaveQue] 내용: ', popupParam)  

  console.log("fileCount.value", fileCount.value)

  if (fileCount.value === 0) {    
    return Message.warn('지침서자료는 필수입니다.')
  }

  return true
}

// 저장
const saveDataQue = () => {
  let saveParams = []

  let gubun1 = popupParam.GUBUN1

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
    ER_GUBUN: popupParam.ER_GUBUN,
    NOTICE_TITLE: popupParam.NOTICE_TITLE,
    NOTICE_NOTE: popupParam.REQ_NOTICE_NOTE,
    NOTICE_FILEID: strFileID.value,
    NOTICE_FILEID2: strFileID2.value,
    APPLY_DATE: popupParam.APPLY_DATE ? popupParam.APPLY_DATE.replaceAll('-', '') : dayjs().format('YYYYMMDD'),
    NOTICE_DIV: popupParam.NOTICE_DIV,
    NOTICE_NO: popupParam.NOTICE_NO,
    GUBUN1: gubun1.join(','),
    GUBUN2: popupParam.GUBUN2,
    USER_ID: userStore.userId,

    RES_COD: '', // return 값
    RES_MSG: '', // return 값
    RES_COL: '', // return 값
  })
  console.log('[saveDataQue] 결재 데이터 저장 >>>> ', saveParams)

  return commonRequest('/hse/data/DATBA0010_UPDATE_CLOB03', {
    queryId: 'DATBA0010_UPDATE_02',
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
    commonRequest('/hse/data/DATBA0010_SELECT_CLOB01', {
      queryId: 'DATBA0010_SELECT_05',
      param: printParams,
    }),
  ]).then((res) => {
    console.log('결재상신 저장 후 : ', res[0].ORESULT_CUR.length)

    var sb = []
    let reqDT = dayjs().format('YYYY년 MM월 DD일')

    console.log('[saveApproval] GUBUN1 : ', res[0].ORESULT_CUR[0].GUBUN1)
    console.log('[saveApproval] GUBUN2 : ', res[0].ORESULT_CUR[0].GUBUN2)
    console.log('[saveApproval] GUBUN1NM : ', res[0].ORESULT_CUR[0].GUBUN1NM)
    console.log('[saveApproval] GUBUN2NM : ', res[0].ORESULT_CUR[0].GUBUN2NM)

    if (res[0].ORESULT_CUR.length === 0) {
      return false
    }

    console.log(
      '[saveApproval] REQ_NOTICE_NOTE : ',
      res[0].ORESULT_CUR[0].REQ_NOTICE_NOTE
    )
    

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
        popupParam.EMP_NM +
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
        res[0].ORESULT_CUR[0].GUBUN1NM +
        '</nobr></td>\n'
    )
    sb.push(
      "			<td class='csFEB6DE' style='width:81px;height:23px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>작업구분</nobr></td>\n"
    )
    sb.push(
      "			<td class='cs646CAD4E' colspan='3' style='width:221px;height:23px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>" +
        res[0].ORESULT_CUR[0].GUBUN2NM +
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
      "			<td class='csA4B31CBB' style='width:67px;height:23px;line-height:14px;text-align:center;vertical-align:middle;'><nobr>제/개정사유</nobr></td>\n"
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
      EMP_NO: isEmpty(popupParam.EMP_NO)
        ? CURRENT_EMP_NO
        : popupParam.EMP_NO,
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

const editTitleChanged = () => {  
  if(popupParam.EDIT_TITLE === 'Y'){
    statusParam.NOTICE_TITLE_READONLY = false    
  } else {
    statusParam.NOTICE_TITLE_READONLY = true
  }  
}

const onGrdMain2CellItemClicked = (grid, index, col) => {
  if(col.cellType !== 'data'){
    return
  }
  
  let data = grdMain2.value.getDataProvider().getJsonRow(col.dataRow)

  if (col.fieldName === 'FILE_OPEN') {
    fileUploadPopup.value.openPopup(data.NOTICE_FILEID_ORG)
  }
}

const onDataLength1 = (length) => {
  fileCount.value = length;  
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
            'btnTurnBack',
            'btnUpdate',
            'btnDelete',
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
                v-model="popupParam.NOTICE_TITLE"
                :label="$t('지침서명')"
                top-label
                label-width="200px"
                width="800px"
                :required="statusParam.NOTICE_TITLE_REQUIRE"
                :readonly="statusParam.NOTICE_TITLE_READONLY"
              />
              <VCheckbox
                v-if="isEditTitleVisible"
                v-model="popupParam.EDIT_TITLE"
                :label="$t('* 수정 필요시')"
                class="mt-5"
                true-value="Y"
                false-value="N"
                @change="editTitleChanged"
              />
            </div>
            
            <div class="d-flex mt-2">             
              
              <i-select
                v-model="popupParam.GUBUN1"
                :label="$t('적용사업부')"
                top-label
                label-width="80px"
                append-inner-icon="mdi-magnify"
                :items="codeList.GUBUN1"
                item-value="COD"
                item-title="TXT"
                width="400px"
                :required="statusParam.GUBUN_REQUIRE"
                :readonly="statusParam.GUBUN_READONLY1"
                multiple
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
                :readonly="statusParam.GUBUN_READONLY2"
              />
              <i-input
                v-model="popupParam.NOTICE_DOC_NO"
                :label="$t('문서번호')"
                top-label
                width="150px"
                label-width="80px"
                disabled
              />
              <i-input
                v-model="popupParam.NOTICE_DOC_REV"
                :label="$t('개정 No.')"
                top-label
                width="100px"
                label-width="80px"
                disabled
              />
            </div>
            <div class="d-flex mt-2">
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
                disabled
              />
              <i-input
                v-model="popupParam.APPLY_DATE"
                :label="$t('신청일')"
                top-label
                width="150px"
                label-width="80px"
                disabled
              />
              <i-input
                v-model="popupParam.EMP_NM"
                :label="$t('신청자')"
                top-label
                width="150px"
                label-width="80px"
                disabled
              />
              <i-input
                v-model="popupParam.TEL_NO"
                :label="$t('Tel')"
                top-label
                width="150px"
                label-width="80px"
                disabled
              />              
            </div>            
          </v-sheet>
          
          <v-sheet class="mb-2">
            <div class="title d-flex" required>제/개정 사유 <svg-icon class="dot ml-2" name="redDot"></svg-icon></div>
            <CKEditor              
              :id="props.editorId"
              ref="ckEditor"
              v-model="popupParam.REQ_NOTICE_NOTE"
              class="mt-2"
              :is-read-only="isNoteReadOnly"
              height="120px"
            />
          </v-sheet>
          <v-sheet height="10%" class="mb-2">
            <i-input
              v-if="isRejectVisible"
              v-model="popupParam.REJECT_DESC"
              :label="$t('반려 사유')"
              label-width="80px"
              width="980px"
              :readonly="statusParam.REJECT_DESC_READONLY"
            />
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload"
              :max-file-size="300"
              :button-list="fileUploadButton"
              :gridTitle="$t('지침서자료')"
              :isVisibled="!fileReadOnly"
              auto-upload
              style="height:200px"
              fixHeight
              @dataLength="onDataLength1"
            />
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload2"
              :max-file-size="300"
              :button-list="fileUploadButton"
              :gridTitle="$t('참고자료')"
              :isVisibled="!fileReadOnly"
              auto-upload
              style="height:200px"
              fixHeight
            />
          </v-sheet>
          <v-sheet 
            height="200px"
            class="mt-2"
          >            
            <IGridTitle :title="$t('구버전 이력')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain2"
              :grid-view-option="grdMain2Props.gridViewOption"
              :keys="grdMain2Props.keys" 
              :fields="grdMain2Props.fields"
              :columns="grdMain2Props.columns"
              @on-cell-item-clicked="onGrdMain2CellItemClicked"              
            />
          </v-sheet>
        </div>
        <ApprovalPopup ref="approvalPopup" @approvalAppkey="onApprovalClosed" />
        <IUploadPopup 
          ref="fileUploadPopup" 
          :cmpnyUseYn = "false"
          :readOnly = true
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
