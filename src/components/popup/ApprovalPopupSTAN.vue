<script setup>
import { ref, reactive, onMounted, onUpdated } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonHiOfficeApproval, commonApprovalList, commonLogExecuteApi, commonPostApprovalApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import { isEmpty } from "@/@core/utils"

import ApprovalPopup01 from "./ApprovalPopup01.vue"

const emit = defineEmits(['approvalAppkey', 'result', 'approvalClrLine'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const grdEmp = ref(null)
const grdApprovalLine = ref(null)
const grdFixAppList = ref(null)
const grdCcLine = ref(null)
const grdLine = ref(null)
const tab1 = ref(null)
const tab2 = ref(null)
const approvalPopup01 = ref(null)
const safja = ref(false)
const containsHighManager = ref(false)

const userId = ref(userStore.userId)
const logsStore = useLogsStore()

// 결재 상신 파라미터
let approvalParams = reactive({
  FORM_ID: '',
  SUBJECT: '',
  AUTHOR_ID: '',
  BODY: '',
  APPROVER: '',
  SYSKEY1: '',
  SYSKEY2: '',
  SYSKEY3: '',
  SYSKEY4: '',
  SENDTO: '',
  COPYTO: '',
  CIRCULAR: '',
  FORMNAME: '',
})

let appDoc = reactive({
  aLinkToMedium: '',
})

//조회조건
let searchParams = reactive({
  COL1: '',
  COL2: '',
  COL3: '',
  COL4: '',
  COL5: '',
  COL6: '',
  COL7: '',
  COL8: '',
  BSNS_CD : '',
  EMAIL: '',
})

const paramApp = reactive({})
const applistParams = reactive({})

//코드리스트 선언
const codeList = reactive({
  company: [],
  bsnsCd: [],
  orgnDiv: [
    // { COD: "", TXT: "전체" },
    { COD: "A", TXT: "직영" },
    { COD: "B", TXT: "사내협력사" },
    { COD: "D", TXT: "단기공사" },
    { COD: "Z", TXT: "기타" },
  ],
  accdntType: [],
  proc: [],
})

// 결재팝업 호출 파라미터
let popupParams = reactive({})
let searchShortParams = reactive({
  CMPNY_DIV: '',
  CLRLINE: '',
  CCLINE: '',
})

// 조직도 부서 조회 파라미터
let searchDept01Params = reactive({})

// 조직도 사원 조회 파라미터
let searchEmplist01Params = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  COMPANY: userStore.company,
  EMPNM: '',
})

let searchLine01Params = reactive({})
let searchLine02Params = reactive({})

let strZZ_RES_ID = ''
let strCLSS_ID = ''
const rskSaveData = reactive({})  // 위험성 평가 수신 데이터 저장
const rskParam = reactive({})

// 조직도 부서 그리드
const grdMainProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false } },
  keys : ['ASGN_CD'],
  field : [
    { fieldName: 'C_PATH', dataType: 'text', visible: false  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false  },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false  },
    { fieldName: 'COMPANY', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', 
      header: { text: t('부서명') } ,
    },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.field

// 조직도 사원 그리드
const grdEmpProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false }, 
    display: { selectionStyle : 'rows' },
  },
  keys : ['EMP_NO'],
  field : [
    
    { fieldName: 'JOB_TIT_NM', dataType: 'text', 
      header: { text: t('직급') } ,
    },
    { fieldName: 'EMP_NM', dataType: 'text', 
      header: { text: t('이름') } ,
    },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', 
      header: { text: t('직책') } ,
    },
    { fieldName: 'ASGN_NM', dataType: 'text', 
      header: { text: t('부서명') } ,
    },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false  },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', visible: false  },
  ],
  columns : [],
})

grdEmpProps.columns = grdEmpProps.field

// 결재 라인 그리드
const grdApprovalLineProps = reactive({
  gridViewOption : { 
    edit: { 
      editable:false,
      movable:true, 
    },     
    stateBar: { visible: false },
    display: { selectionStyle : 'rows' },

  },
  keys : ['EMP_NO'],
  field : [
    
    { fieldName: 'JOB_TIT_NM', dataType: 'text', 
      header: { text: t('직급') } ,
    },
    { fieldName: 'EMP_NM', dataType: 'text', 
      header: { text: t('이름') } ,
    },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', 
      header: { text: t('직책') } ,
    },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_NM', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false  },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', visible: false  },
  ],
  columns : [],
})

grdApprovalLineProps.columns = grdApprovalLineProps.field

// 결재선보관함 라인 그리드
const grdLineProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  keys : ['PGM_ID', 'APPROVE_SAVENO'],
  field : [
    
    { 
      fieldName: 'PGM_ID', 
      dataType: 'text', 
      width: '120',
      styleName: "left-column",
      header: { text: t('메뉴ID') },
    },
    { 
      fieldName: 'APPROVE_SAVENO_NM', 
      dataType: 'text', 
      width: '500',
      styleName: "left-column",
      header: { text: t('결재선명') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let data = ''
          if(cell.value){
            data = cell.value
          }
            
          return `<div style="display: flex; justify-content: space-between;">
            <p style="width: auto; overflow-x: auto;">${data}</p>
            </div>`
        },
      },
    },

    // 출력 안함
    { fieldName: 'EMP_NO', dataType: 'text', visible: false  },
    { fieldName: 'APPROVE_SAVENO', dataType: 'text', visible: false  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false  },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', visible: false  },
  ],
  columns : [],
})

grdLineProps.columns = grdLineProps.field

// 참조 라인 그리드
const grdCcLineProps = reactive({
  gridViewOption : { 
    edit: { 
      editable:false,
      movable:true, 
    },     
    stateBar: { visible: false },
    display: { selectionStyle : 'rows' },

  },
  keys : ['COL01'],
  field : [
    
    { fieldName: 'JOB_TIT_NM', dataType: 'text', 
      header: { text: t('직급') } ,
    },
    { fieldName: 'EMP_NM', dataType: 'text', 
      header: { text: t('이름') } ,
    },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', 
      header: { text: t('직책') } ,
    },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_NM', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false  },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', visible: false  },
  ],
  columns : [],
})

grdCcLineProps.columns = grdCcLineProps.field


// 고정 결재 라인 그리드
const grdFixAppListProps = reactive({
  gridViewOption : { 
    edit: { 
      editable:false,
      movable:true, 
    },     
    stateBar: { visible: false },
    display: { selectionStyle : 'rows' },
  },
  keys : ['COL01'],
  field : [
    
    { fieldName: 'JOB_TIT_NM', dataType: 'text', 
      header: { text: t('직급') } ,
    },
    { fieldName: 'EMP_NM', dataType: 'text', 
      header: { text: t('이름') } ,
    },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', 
      header: { text: t('직책') } ,
    },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_NM', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false  },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', visible: false  },
  ],
  columns : [],
})

grdFixAppListProps.columns = grdFixAppListProps.field


const openPopup = popupParam =>
{
  //팝업 visible
  popupParams.CLSS_ID = popupParam.CLSS_ID
  popupParams.TITLE = popupParam.TITLE
  popupParams.CMPNY_DIV = popupParam.CMPNY_DIV
  popupParams.DATA_KEY = popupParam.DATA_KEY
  popupParams.REPORT = popupParam.REPORT
  popupParams.MODE = popupParam.MODE

  if(isEmpty(popupParam.FORM_ID)) {
    popupParams.FORM_ID = '421'
  }
  else {
    popupParams.FORM_ID = popupParam.FORM_ID
  }
  popupParams.REPLACE = popupParam.REPLACE
  popupParams.CCLINE = popupParam.CCLINE
  appDoc.aLinkToMedium = popupParam.REPORT

  popupParams.FIX_YN = popupParam.FIX_YN
  popupParams.FIX_CLRLINE = popupParam.FIX_CLRLINE

  console.log('[DUCHA] openPopup>>popupParams: ', popupParams)

  if (popupParam.CLRLINE === 'CLR_15') {
    // 부서장,팀장 이상 결재
    popupParams.CLRLEVEL = '15'
    popupParams.CLRLINE = ''
    popupParams.CLRLEVELMSG = '부서장'
  }
  else if (popupParam.CLRLINE === 'CLR_14') {
    // 임원 이상 결재
    popupParams.CLRLEVEL = '14'
    popupParams.CLRLINE = ''
    popupParams.CLRLEVELMSG = '담당임원'
  }
  else if (popupParam.CLRLINE === 'CLR_16') {
    // 임원 이상 결재
    popupParams.CLRLEVEL = '16'
    popupParams.CLRLINE = ''
    popupParams.CLRLEVELMSG = '직책과장'
  }
  else if (popupParam.CLRLINE === 'CLR_17') {
    // 부문장 이상 결재
    popupParams.CLRLEVEL = '17'
    popupParams.CLRLINE = ''
    popupParams.CLRLEVELMSG = '부문장'
  }
  else if(popupParam.CLRLINE === 'CLR_100') {
    // 단기공사 전용(직책과장 이상인 사람만 결재가 가능)
    popupParams.CLRLEVEL = '16'
    popupParams.CLRLINE = ''
    popupParams.CLRLEVELMSG = '직책과장'
    safja.value = true
  }
  else {
    popupParams.CLRLINE = popupParam.CCLINE
  }

  console.log("[chkStatus] CLRLEVELMSG : ", popupParams.CLRLEVELMSG)

  if (!isEmpty(popupParams.CLRLEVELMSG)) {
    popupParams.CLRLEVELMSG = '※ ' + popupParams.CLRLEVELMSG + '이상 결재선 지정 필요'
  }

  // 위험성 평가 체크용(RSK)
  if(popupParams.CLSS_ID.includes('RSK')) {
    popupParams.RSK_RES_ID = popupParam.RSK_RES_ID
  }
  else {
    popupParams.RSK_RES_ID = ''
  }

  popupParams.PARAM424 = popupParam.PARAM424

  dialog.value = true
  
  initCodeList()
  initData()
}

// 위험성 평가 결재(사용암함)
const openPopupRSK = popupParam => {
  console.log('[openPopupRSK] popupParams: ', popupParams)

  // 위험성 평가 체크용(RSK)
  strCLSS_ID = 'RSK'

  rskSaveData.info = popupParam.info
  rskSaveData.approver = popupParam.approver
  rskSaveData.worklist = popupParam.worklist

  rskParam.appr_comment = popupParam.appr_comment
  rskParam.work_desc = popupParam.work_desc
  rskParam.userId = popupParam.userId
  rskParam.origin = popupParam.origin

  console.log('[openPopupRSK] rskSaveData: ', rskSaveData)
  console.log('[openPopupRSK] rskParam: ', rskParam)

  dialog.value = true

  initData()
}

//초기 데이터셋팅
onMounted(() => {

})

// 화면이 다 뜨고 난 뒤 자동으로 조직도 조회
onUpdated(() => {

  // 테스트 용
  // new queryFlowHelper(vm, t)
  //   .setQuery(searchApprovalLine)
  //   .setAfter(afterApprovalLine)
  //   .run()
})

const initData = () => {
  if(!isEmpty(popupParams.CLRLINE) || !isEmpty(popupParams.CCLINE)) {
    new queryFlowHelper(vm, t)
      .setQuery(searchDataShort)
      .setAfter(afterSearchShort)
      .run()
  }

  // 고정 결재선
  if(popupParams.FIX_YN === 'Y' && !isEmpty(popupParams.FIX_CLRLINE)) {
    new queryFlowHelper(vm, t)
      .setQuery(searchDataFixShort)
      .setAfter(afterSearchFixShort)
      .run()
  }
}

// 결재자, 참조자 조회
const searchDataShort = () =>{
  searchShortParams.CMPNY_DIV = popupParams.CMPNY_DIV
  searchShortParams.CLRLINE = popupParams.CLRLINE
  searchShortParams.CCLINE = popupParams.CCLINE

  return commonSearchApi({ queryId : 'APPROVAL_SHORT_01', param: searchShortParams })
}

// 결재자, 참조자 조회
const searchDataFixShort = () =>{
  searchShortParams.CMPNY_DIV = popupParams.CMPNY_DIV
  searchShortParams.CLRLINE = popupParams.FIX_CLRLINE

  return commonSearchApi({ queryId : 'APPROVAL_SHORT_01', param: searchShortParams })
}

// 결재자, 참조자 조회 후
const afterSearchShort = res =>{
  console.log('afterSearchShort = ', res)
  grdApprovalLine.value.getDataProvider().setRows(res.ORESULT_CUR1)
  grdCcLine.value.getDataProvider().setRows(res.ORESULT_CUR2)
}

// 고정 결재자
const afterSearchFixShort = res =>{
  console.log('afterSearchFixShort = ', res)
  grdFixAppList.value.getDataProvider().setRows(res.ORESULT_CUR1)
}

const searchApprovalLine = () => {
  
  //테스트 용
  applistParams.CMPNY_DIV = 'HHI'
  applistParams.BUSINESS_UNIT = 'AX00'

  applistParams.ZZ_RES_ID = 'UIAJ1010C_A506106_20230131141459'

  // applistParams.ZZ_RES_ID = 'MNGAA0060_BP23200_20240318102045109'

  return commonApprovalList("APPROVAL_APPLIST_02", applistParams)
}

const afterApprovalLine = res => {

  console.log('[DUCHA] afterApprovalLine>>res: ',  res)
  appDoc.aLinkToMedium = res.ORESULT_CUR[0].ZZ_APPDOC
}

//메뉴버튼
const onButtonsClick = btn => { 
  if (btn.id === 'btnSearch') 
  {
    switch(tab1.value){
    case 'tab1' : 
      // 조직도탭
      new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchDataDept)
        .setAfter(afterSearchDept)
        .showMessage(false)
        .run()
      break
    case 'tab2' : 
      // 결재선보관함탭
      new queryFlowHelper(vm, t)
        .setGridList([grdLine])
        .setQuery(searchDataLine)
        .setAfter(afterSearchLine)
        .run()
      break
    }
    
  }
  else if (btn.id === 'btnReqApply') {
    new saveFlowHelper(vm, t)
      .setQuery(saveApprovalData)
      .setAfter(hiOfficeApproval)
      .showMessage(false)
      .run()

  }
  else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { 
        grdApprovalLine.value.getDataProvider().clearRows()
        grdCcLine.value.getDataProvider().clearRows()
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  }
  else if (btn.id === 'btnDelete') {

    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => {
        grdApprovalLine.value.getDataProvider().clearRows()
        grdCcLine.value.getDataProvider().clearRows()
        onButtonsClick({ id :'btnSearch' }) 
      })
      .run()
  }
  else if (btn.id === 'btnPreview') {
    console.log('미리보기')
    if(isEmpty(appDoc.aLinkToMedium)) {
      Message.warn('미리보기를 할 수 있는 결재 문서가 없습니다.')
    }
    else {
      approvalPopup01.value.openPopup(appDoc.aLinkToMedium)
    }
  }
  else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 결재선 지정 버튼
const onApprButtonsClick = btn => { 
  if (btn.id === 'btnSelectRemove') {
    btnDel('grdApprovalLine')
  }
  else if (btn.id === 'btnAllRemove') {
    btnDelAll('grdApprovalLine')
  }
  else if (btn.id === 'btnMoveUp') {
    btnUp('grdApprovalLine')
  }
  else if (btn.id === 'btnMoveDown') {
    btnDown('grdApprovalLine')
  }
}

// 참조선 지정 버튼
const onCcLineButtonsClick = btn => { 
  if (btn.id === 'btnSelectRemove') {
    btnDel('grdCcLine')
  }
  else if (btn.id === 'btnAllRemove') {
    btnDelAll('grdCcLine')
  }
  else if (btn.id === 'btnMoveUp') {
    btnUp('grdCcLine')
  }
  else if (btn.id === 'btnMoveDown') {
    btnDown('grdCcLine')
  }
}

const onButtonsEMPClick = btn => {
  if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchDataEmplist2)
      .setAfter(afterSearchEmplist)
      .showMessage(false)
      .run()
  }
  else if (btn.id === 'btnAddApp') {
    btnInsertApp()
  }
  else if (btn.id === 'btnAddCC') {
    btnInsertCC()
  }
}

const keyupSearch = event => {
  if(event.key === 'Enter'){
    onButtonsEMPClick({ id :'btnSearch' })
  }
}

//코드리스트 셋팅
const initCodeList = () => {

  Promise.all([
    getCompanyList(),
    
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }),
    getCodeList('HHIB010A'),
    getCodeList('HHII626D'),
  ]).then(res => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.accdntType = res[2].ORESULT_CUR
    codeList.proc = res[3].ORESULT_CUR
    
    searchParams.BSNS_CD = userStore.bsnsCd
    
    codeList.bsnsCd.push({ BSNS_CD:"04", BSNS_NM:"04" })

    onButtonsClick({ id : 'btnSearch' })
    onButtonsEMPClick({ id : 'btnSearch' })

    console.log('[Approval - initCodeList]')
  })

}

// 추가하기 (결재) 버튼
const btnInsertApp = () => { 
  let rowIdx = grdEmp.value.getGridView().getCurrent().dataRow
  let rtnData = grdEmp.value.getDataProvider().getJsonRow(rowIdx)
  let getGrdApprovalLine = null
  let approvalLineValue = 0
  let getGrdFixedlLine = null
  let approvalFixedValue = 0

  // 고정 결재라인 중복 방지  
  if(grdFixAppList.value){
    getGrdFixedlLine = grdFixAppList.value.getGridView().getJsonRows()

    console.log('[btnInsertApp] getGrdFixedlLine = ', getGrdFixedlLine)
    
    approvalFixedValue = getGrdFixedlLine.filter(obj => {
      return obj.EMP_NO === rtnData.EMP_NO      
    }).length
  }

  // 고정 결재탭
  if(approvalFixedValue > 0)
    return Message.err('고정 결재 라인에 이미 있는 인원입니다.')
  
  // 결재라인 중복 방지  
  if(grdApprovalLine.value){
    getGrdApprovalLine = grdApprovalLine.value.getGridView().getJsonRows()

    console.log('[btnInsertApp] getGrdApprovalLine = ', getGrdApprovalLine)
    
    approvalLineValue = getGrdApprovalLine.filter(obj => {
      return obj.EMP_NO === rtnData.EMP_NO      
    }).length
  }
  
  console.log('[btnInsertApp] approvalLineValue = ', approvalLineValue)

  // 단기공사일때는 직책과장 이상인 경우에만 결재자 목록에 올라갈 수 있다.
  if(safja.value) {
    if(isEmpty(rtnData.OFFI_RES_CD.trim()) || rtnData.OFFI_RES_CD == '15Z') {
      return Message.err(t('직책과장 이상만 결재가능합니다.'))
    }
  }

  // 결재탭
  if(approvalLineValue === 0)
    grdApprovalLine.value.getDataProvider().addRow(rtnData)
  else
    Message.err('이미 있는 인원입니다.')


}

// 추가하기 (참조) 버튼
const btnInsertCC = () => { 
  let rowIdx = grdEmp.value.getGridView().getCurrent().dataRow
  let rtnData = grdEmp.value.getDataProvider().getJsonRow(rowIdx)
  let ccLineValue = 0
  let getGrdCcLine = null
  let getGrdFixedlLine = null
  let approvalFixedValue = 0


  // 고정 결재라인 중복 방지  
  if(grdFixAppList.value){
    getGrdFixedlLine = grdFixAppList.value.getGridView().getJsonRows()

    console.log('[btnInsertApp] getGrdFixedlLine = ', getGrdFixedlLine)
    
    approvalFixedValue = getGrdFixedlLine.filter(obj => {
      return obj.EMP_NO === rtnData.EMP_NO      
    }).length
  }

  // 고정 결재탭
  if(approvalFixedValue > 0)
    return Message.err('고정 결재 라인에 이미 있는 인원입니다.')

  // 참조라인 중복 방지
  if(grdCcLine.value){
    getGrdCcLine= grdCcLine.value.getGridView().getJsonRows()
    ccLineValue = getGrdCcLine.filter(obj => {
      return obj.EMP_NO === rtnData.EMP_NO      
    }).length
  }
  
  if(ccLineValue === 0)
    grdCcLine.value.getDataProvider().addRow(rtnData)
  else
    Message.err('이미 있는 인원입니다.')


}

// 결재, 참조에서 제거 버튼
const btnDel = grdName => {
  if(grdName === 'grdApprovalLine'){
    // 결재 탭
    let rowIdx = grdApprovalLine.value.getGridView().getCurrent().dataRow
    let rtnData = grdApprovalLine.value.getDataProvider().getJsonRow(rowIdx)
    grdApprovalLine.value.deleteRow(rtnData) 
  }
  else if(grdName === 'grdCcLine'){
    // 참조 탭
    let rowIdx = grdCcLine.value.getGridView().getCurrent().dataRow
    let rtnData = grdCcLine.value.getDataProvider().getJsonRow(rowIdx)
    grdCcLine.value.deleteRow(rtnData) 
  }
}

// 결재, 참조 그리드 초기화
const btnDelAll = grdName => {  
  if(grdName === 'grdApprovalLine') // 결재 탭
    grdApprovalLine.value.getDataProvider().clearRows()

  if(grdName === 'grdCcLine') // 참조 탭
    grdCcLine.value.getDataProvider().clearRows()
}

// 결재, 참조 그리드 row 위로
const btnUp = grdName => {
  // 결재 탭
  if(grdName === 'grdApprovalLine'){
    let rowIdx = grdApprovalLine.value.getGridView().getCurrent().dataRow
    grdApprovalLine.value.getDataProvider().moveRow(rowIdx-1,rowIdx)
    grdApprovalLine.value.getGridView().setCurrent({ itemIndex: rowIdx-1 })
  }
  
  // 참조 탭
  if(grdName === 'grdCcLine') {
    let rowIdx = grdCcLine.value.getGridView().getCurrent().dataRow
    grdCcLine.value.getDataProvider().moveRow(rowIdx-1,rowIdx)
    grdCcLine.value.getGridView().setCurrent({ itemIndex: rowIdx-1 })
  }
}

// 결재, 참조 그리드 row 아래로
const btnDown = grdName => {
  // 결재 탭
  if(grdName === 'grdApprovalLine'){
    let rowIdx = grdApprovalLine.value.getGridView().getCurrent().dataRow
    grdApprovalLine.value.getDataProvider().moveRow(rowIdx+1,rowIdx)
    grdApprovalLine.value.getGridView().setCurrent({ itemIndex: rowIdx+1 })
  }
  
  // 참조 탭
  if(grdName === 'grdCcLine') {
    let rowIdx = grdCcLine.value.getGridView().getCurrent().dataRow
    grdCcLine.value.getDataProvider().moveRow(rowIdx+1,rowIdx)
    grdCcLine.value.getGridView().setCurrent({ itemIndex: rowIdx+1 })
  }
}

// 조회로직
const searchDataDept = () => {
  
  searchDept01Params.CMPNY_DIV = userStore.cmpnyDiv
  searchDept01Params.BSNS_CD = searchParams.BSNS_CD
  searchDept01Params.COMPANY = userStore.cmpnyDiv

  return commonSearchApi({ queryId : 'APPROVAL_DEPT_01', param : searchDept01Params })

}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const afterSearchDept = async res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, "C_PATH")

  await grdMain.value.getGridView().expandAll()

  // 로그인 사용자 부서로 포커스 이동
  await grdMain.value.goRow({
    ASGN_CD: userStore.asgnCd,
  })
}

// 결재선 보관 조회로직
const searchDataLine = () => {
  
  searchLine01Params.CMPNY_DIV = userStore.cmpnyDiv
  searchLine01Params.EMP_NO = userId.value
  searchLine01Params.PGM_ID = logsStore.vueId

  return commonSearchApi({ queryId : 'APPROVAL_LINE_01', param : searchLine01Params })

}

const afterSearchLine = res => {
  grdLine.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 결재선 보관 조회로직2
const searchDataLine2 = ( ) => {
  console.log('[searchDataLine2] Params : ', searchLine02Params)

  return commonSearchApi({ queryId : 'APPROVAL_LINE_02', param : searchLine02Params })

}

const afterSearchLine2 = res => {
  grdApprovalLine.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellClicked = (grid, clickData) => {
  console.log('[onCellClicked] clickData : ', clickData.cellType)
  if (clickData.cellType === "data") {
    let rtnData = grdLine.value.getDataProvider().getJsonRow(clickData.dataRow)

    searchLine02Params.CMPNY_DIV = userStore.cmpnyDiv
    searchLine02Params.EMP_NO = rtnData.EMP_NO
    searchLine02Params.PGM_ID = rtnData.PGM_ID
    searchLine02Params.APPROVE_SAVENO = rtnData.APPROVE_SAVENO
    searchParams.COL2 = rtnData.APPROVE_SAVENO_NM

    new queryFlowHelper(vm, t)
      .setGridList([grdApprovalLine])
      .setQuery(searchDataLine2)
      .setAfter(afterSearchLine2)
      .showMessage(false)
      .run()
  }
}

const onDeptSelect = (grid, clickData) => {
  if (clickData.cellType === "data") {
    searchEmp()
  }
}

const searchEmp = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchDataEmplist)
    .setAfter(afterSearchEmplist)
    .showMessage(false)
    .run()
}

const searchDataEmplist = () => {

  let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  let rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  console.log('[searchDataEmplist] rtnData = ', rtnData)

  searchEmplist01Params.CMPNY_DIV = rtnData.CMPNY_DIV
  searchEmplist01Params.BSNS_CD = rtnData.BSNS_CD
  searchEmplist01Params.ASGN_CD = rtnData.ASGN_CD
  searchEmplist01Params.COMPANY = rtnData.COMPANY
  searchEmplist01Params.EMPNM = ''

  return commonSearchApi({ queryId : 'APPROVAL_EMPLIST_01', param : searchEmplist01Params })

}

const searchDataEmplist2 = () => {
  searchEmplist01Params.EMPNM = searchParams.COL1

  return commonSearchApi({ queryId : 'APPROVAL_EMPLIST_01', param : searchEmplist01Params })
}

const afterSearchEmplist = res => {
  console.log(res.ORESULT_CUR)
  grdEmp.value.getDataProvider().setRows(res.ORESULT_CUR)
}

defineExpose({
  openPopup,
  openPopupRSK,
})

const onClose = () => {
  safja.value = false
  dialog.value = false
}

let formName = ''

const saveApprovalData = () => {
  let HiSEs = '[HiSEs]'

  containsHighManager.value = false

  if(grdApprovalLine.value.getDataProvider().rowCount === 0 && grdFixAppList.value.getDataProvider().rowCount === 0){

    Message.err(t('결재선을 지정하세요.'))

    return false
  }

  if(!isEmpty(popupParams.CLRLEVEL)) {
    let grdApprovalLineData = grdApprovalLine.value.getGridView().getJsonRows()
    let ClrLevelCnt = 0
    let applypass = false 

    if(grdApprovalLineData.length > 0) {
      for(let i=0; i <grdApprovalLineData.length;i++)
      {
        let val = grdApprovalLineData[i]

        if (val.EMP_NO == 'A526166'){
          applypass = true
        } 


        console.log('[saveApprovalData] val : ', val)
        console.log('[saveApprovalData] OFFI_RES_CD : ', val.OFFI_RES_CD)

        if((val.OFFI_RES_CD.trim() <= popupParams.CLRLEVEL) && !isEmpty(val.OFFI_RES_CD.trim())){
          ClrLevelCnt++
          containsHighManager.value = true
        }

        /*if(!isEmpty(val.OFFI_RES_CD.trim())) {
          ClrLevelCnt++
        }*/
      }
    }

    console.log('[saveApprovalData] ClrLevelCnt : ', ClrLevelCnt)

    if(ClrLevelCnt == 0 && !applypass) {
      return Message.err(popupParams.CLRLEVELMSG + "합니다.")
    }
  }

  // 일반결재시 [HiSEs]결재제목
  // if(popupParams.FORM_ID === '423') {
  //   formName = HiSEs + '단기공사 출입신청서'
  // }
  // else if(popupParams.FORM_ID === '424') {
  //   formName = HiSEs + '사고보고서'
  // }
  // else if(popupParams.FORM_ID === '421') {
  //   formName = HiSEs + popupParams.TITLE
  // }

  if(popupParams.TITLE.includes('단기공사')) {
    formName = HiSEs + '단기공사 출입신청서'
  }
  else {
    formName = HiSEs + popupParams.TITLE
  }

  const today = dayjs().format('YYYYMMDDHHmmssSSS')
  let resId = ''

  //위험성평가 WORK_ID 설정
  if(isEmpty(popupParams.RSK_RES_ID)) {
    resId = popupParams.CLSS_ID + "_" + userId.value + "_" + today
  }else {
    resId = popupParams.RSK_RES_ID
  }

  let saveApprovalParam = []
  let saveSearchData = {
    CMPNY_DIV : popupParams.CMPNY_DIV,
    BUSINESS_UNIT : userStore.bsnsCd,
    USER_ID : userId.value,
    ACCESS_IP : userStore.clientIp,
    PGM_ID : popupParams.CLSS_ID,
    ZZ_RES_ID : resId,
    ZZ_FORMID : popupParams.FORM_ID,
    ZZ_FORMNM : formName,
    ZZ_FORMTITLE : popupParams.TITLE,
    ZZ_SYSKEY1 : popupParams.FORM_ID,
    ZZ_SYSKEY2 : popupParams.CLSS_ID.substr(0,5),
    ZZ_SYSKEY3 : popupParams.CLSS_ID,
    ZZ_SYSKEY4 : popupParams.DATA_KEY,
    ZZ_APPDOC : appDoc.aLinkToMedium,
    ZZ_PRE_APPKEY : '',
    ZZ_CALLBACK1 : '',
    ZZ_CALLBACK2 : '',
    ZZ_CALLBACK3 : '',
    RES_COD : '',
    RES_MSG : '',
    RES_COL : '',
  }

  saveApprovalParam.push(saveSearchData)

  return commonRequest("/hse/common/APPROVAL_SAVE_01", {
    queryId : "APPROVAL_SAVE_01", 
    list : saveApprovalParam,
  })
}

const hiOfficeApproval = res => {
  
  let rcol = res.list.OUT_RES_COL
  let rmsg = res.list.OUT_RES_MSG
  let rcod = res.list.OUT_RES_COD
  let rDraft = res.list.USER_ID

  strZZ_RES_ID = rcol

  console.log('hiOfficeApproval>> strZZ_RES_ID: ', strZZ_RES_ID)
  console.log('hiOfficeApproval>> OUT_RES_COD: ', res.list.OUT_RES_COD)
  // 결재 부서장 포함 확인
  checkForHighManager()
  console.log('containsHighManager.value:', containsHighManager.value);
  if(containsHighManager.value===false){
    Message.err(t('부서장이 포함되어야 결재 가능합니다.'))

    return false
  }else{
    console.log('부서장 포함되어 있네')
  }
  if (rcod != '0') {
    Message.err(t(rmsg))
    strZZ_RES_ID = ''
    
    return  false
  }

  let fixlinedt = null
  let linedt = null
  let ccdt = null

  let clrLine = ''
  let appkey = ''
  let SENDTO = ''
  let COPYTO = ''
  let CIRCULAR = ''
  approvalParams.SENDTO = SENDTO
  approvalParams.COPYTO = COPYTO
  approvalParams.CIRCULAR = CIRCULAR

  if (!isEmpty(grdApprovalLine.value)) {
    linedt = grdApprovalLine.value.getGridView().getJsonRows()
  }

  if (!isEmpty(grdFixAppList.value)) {
    fixlinedt = grdFixAppList.value.getGridView().getJsonRows()
  }

  if (!isEmpty(grdCcLine.value)) {
    ccdt = grdCcLine.value.getGridView().getJsonRows()
  }

  // 회사별 결재 인터페이스 전송 
  if (userStore.cmpnyDiv === '1000' || userStore.cmpnyDiv === 'HYMS') {
    //자회사 결재
    Message.err(t('자회사 결재 미구현 입니다. 관련 부서 문의 바랍니다.'))

    return  false
  }
  else {
    console.log('현중오피스 결재 시작')
    console.log('현중오피스 결재>>ccdt: ', ccdt.length)

    if (linedt.length > 0) {
      for (let i = 0; i < linedt.length; i++) {
        if (linedt[i].EMP_NO != null) {
          clrLine = clrLine + linedt[i].EMP_NO + ";"
        }
      }
    }

    if (fixlinedt.length > 0) {
      for (let i = 0; i < fixlinedt.length; i++) {
        if (fixlinedt[i].EMP_NO != null) {
          clrLine = clrLine + fixlinedt[i].EMP_NO + ";"
        }
      } 
    }

    if (ccdt.length > 0) {
      for (let i = 0; i < ccdt.length; i++) {
        if (!isEmpty(ccdt[i].EMP_NO)) {
          CIRCULAR = CIRCULAR + ccdt[i].EMP_NO + ";"
        }
        else{
          CIRCULAR = CIRCULAR + ccdt[i].ASGN_CD + "A;"
        }
      } 
    }
    
    if(!isEmpty(clrLine)) {
      clrLine = clrLine.substring(0, clrLine.length - 1)
    }

    if(!isEmpty(SENDTO)) {
      SENDTO = SENDTO.substring(0, SENDTO.length - 1)
      approvalParams.SENDTO = SENDTO
    }

    if(!isEmpty(COPYTO)) {
      COPYTO = COPYTO.substring(0, COPYTO.length - 1)
      approvalParams.COPYTO = COPYTO
    }

    if(!isEmpty(CIRCULAR)) {
      CIRCULAR = CIRCULAR.substring(0, CIRCULAR.length - 1)
      approvalParams.CIRCULAR = CIRCULAR
    }

    console.log('현중오피스 결재>>clrLine: ', clrLine)
    console.log('현중오피스 결재>>CIRCULAR: ', CIRCULAR)

    // 테스트 정성근, 강원일 사번은 현중 오피스 상신시 없는 사번이라 나옴
    // 임시로 한매니저 사번으로 테스트 중
    // 향후 오픈 시엔 변경할 것
    // let USER_ID = 'A526166' // let USER_ID = userId.value 

    let USER_ID = userId.value 

    // var sb = []

    // console.log('현중오피스 결재>>FORM_ID: ', popupParams.FORM_ID)
    // console.log('현중오피스 결재>>TITLE: ', approvalParams.COL1)
    // console.log('현중오피스 결재>>userId: ', USER_ID)
    // console.log('현중오피스 결재>>CLSS_ID: ', popupParams.CLSS_ID)
    // console.log('현중오피스 결재>>CLSS_ID: ', popupParams.CLSS_ID.substr(0,5))
    // console.log('현중오피스 결재>>DATA_KEY: ', popupParams.DATA_KEY)


    // sb.push("<?xml version=\"1.0\" encoding=\"utf-8\" ?>\n")
    // sb.push("<CreateWorkflow>\n")
    // sb.push(" <Application>\n")
    // sb.push("     <FormID>" + popupParams.FORM_ID + "</FormID>\n")
    // sb.push("     <Title>" + approvalParams.COL1 + "</Title>\n")
    // sb.push("     <AuthorID>" + USER_ID + "</AuthorID>\n")
    // sb.push("     <BodyType>HTML</BodyType>\n")
    // sb.push("     <Body Type=\"html\">\n")
    // sb.push("         <FORMNAME>" + formName + "</FORMNAME>\n")
    // sb.push("         <CONTENTS>" + appDoc.aLinkToMedium + "</CONTENTS>\n")
    // sb.push("         <SYSKEY1>" + popupParams.FORM_ID + "</SYSKEY1>\n")
    // sb.push("         <SYSKEY2>" + popupParams.CLSS_ID.substr(0,5) + "</SYSKEY2>\n")
    // sb.push("         <SYSKEY3>" + popupParams.CLSS_ID + "</SYSKEY3>\n")
    // sb.push("         <SYSKEY4>" + popupParams.DATA_KEY + "</SYSKEY4>\n")
    // sb.push("     </Body>\n")
    // sb.push(" </Application>\n")

    // sb.push(" <Participant>\n")
    // sb.push(" </Participant>\n")
    // sb.push("</CreateWorkflow>")

    // let xmlSrc = sb.join("")

    // console.log('xmlSrc : ', xmlSrc)
    
    //첨부 파일 용 향후 테스트할 때 구현
    // if (popupParams.REPLACE != '') {

    // }
    
    // let USER_ID = userId.value

    approvalParams.FORM_ID = popupParams.FORM_ID
    approvalParams.SUBJECT = popupParams.TITLE
    approvalParams.AUTHOR_ID = USER_ID
    approvalParams.BODY = appDoc.aLinkToMedium
    approvalParams.APPROVER = clrLine
    approvalParams.SYSKEY1 = popupParams.FORM_ID
    approvalParams.SYSKEY2 = popupParams.CLSS_ID.substr(0,5)
    approvalParams.SYSKEY3 = popupParams.CLSS_ID
    approvalParams.SYSKEY4 = popupParams.DATA_KEY
    approvalParams.FORMNAME = formName

    console.log('현중오피스 결재>>approvalParams: ', approvalParams)
    

    Promise.all([
      commonHiOfficeApproval(approvalParams),
    ]).then(res => {
      let appret = res[0].body

      paramApp.CMPNY_DIV = userStore.cmpnyDiv
      paramApp.ZZ_FORMTITLE = popupParams.TITLE
      paramApp.ZZ_SYSKEY1 = popupParams.FORM_ID
      paramApp.ZZ_RES_ID = strZZ_RES_ID
      paramApp.appret = appret

      let afterparams = {
        userStore: userStore,
        params: paramApp,
        mgs: "결재상신 인터페이스 결과 로그 기록",
        crudGbn: "A", //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
        logDesc: "", //사유입력
        menuId: useLogsStore().menuId,
        menuNm: t(useLogsStore().menuId),
      }

      // 로그기록
      commonLogExecuteApi(afterparams)

      console.log('현중오피스 결재>>appret: ', appret)

      if (appret.substr(0, 1) != 'S') {
        Message.err(t('결재 상신 시 HD오피스 결재 전송 오류입니다'))
        strZZ_RES_ID = ''

        return false
      }

      appkey = appret.substring(2)

      console.log('현중오피스 결재>>appkey: ', appkey)

      // 결재선 데이터 저장
      // 헤더정보를 저장한다
      let approvalLineParam = {
        CMPNY_DIV: popupParams.CMPNY_DIV, //회사
        BUSINESS_UNIT: userStore.bsnsCd,
        USER_ID: USER_ID,
        ACCESS_IP: userStore.clientIp,
        PGM_ID: popupParams.CLSS_ID,
        ZZ_RES_ID: rcol,  // 화면ID_유저ID_시분초 : EX. XXNNNNX_AXXXXXXX_YYYYMMDDHH24MISS
        ZZ_APPKEY: appkey,  // 결재KEY
        ZZ_PRE_APPKEY: '',  // 이전 결재KEY 사용안함
        ZZ_CLRLINE: clrLine, // 결재선(;로 분리)
        ZZ_COMMENT: '', // 상신자 코멘트
        RES_COD: '',
        RES_MSG: '',
        RES_COL: '',
      }

      console.log('현중오피스 결재>>approvalLineParam: ', approvalLineParam)

      Promise.all([
        commonExecuteApi({ queryId: "APPROVAL_APPUP_01", list: [approvalLineParam] }),
      ]).then(res => {

        rcod = res[0].list[0].OUT_RES_COD
        rmsg = res[0].list[0].OUT_RES_MSG

        if (rcod != '0') {
          Message.err(t(rmsg))
          strZZ_RES_ID = ''

          return false
        }
        else {
          Message.info(t('결재를 상신 하였습니다.'))
          
          //2024.03.12 정성연 - 결재 성공 후 appkey 보내기
          emit('approvalAppkey', rcol)
          //2024.05.31 김홍규 - 결재 성공 후 결재라인,결재키 보내기
          //2024.07.04 김성현 - 기안자 추가
          emit('approvalClrLine', {appkey: rcol, clrLine: clrLine, draft: rDraft})

          dialog.value = false
        }
      })
    })
  }
}
// 부서장 결재 확인
const checkForHighManager = () => {
  // 로우 카운트
  const Apprawcnt=grdApprovalLine.value.getGridView().getItemCount()
  if (Apprawcnt===0){
    console.error('결재자가 등록 되어 있지 않습니다.');
    containsHighManager.value = false;
    return;
  }
    

  // Loop through each row and check for '부서장' in the 'OFFI_RES_NM' field
  for (let i = 0; i < Apprawcnt; i++) {
    const jobTitle = grdApprovalLine.value.getGridView().getValues(i)['OFFI_RES_NM']
    const username = grdApprovalLine.value.getGridView().getValues(i)['EMP_NM']

    let dd = grdApprovalLine.value.getGridView().getValues(i)
    
    console.log('username = ', username)
    console.log('dd = ', dd)

    if(username && username.includes('엄정준')) {
      containsHighManager.value = true; // Update the reactive state
      return;
    }

    if(username && username.includes('한민규')) {
      containsHighManager.value = true; // Update the reactive state
      return;
    }

    // Check if the job title contains the word '부서장'
    if (jobTitle && jobTitle.includes('부서장')) {
      containsHighManager.value = true; // Update the reactive state
      return;
    }
  }
  
  return;

};

const hiOfficeApproval_RSK = () => {
  console.log('위험성 평가 현중 오피스 결재 상신')

  if(grdApprovalLine.value.getDataProvider().rowCount === 0){
    Message.err(t('결재선을 지정하세요.'))

    return false
  }
  
  let approver = { draft: '', approver: '' }
  let linedt = null
  

  // approver.draft =  userStore.userId
  // 테스트 정성근, 강원일 사번은 현중 오피스 상신시 없는 사번이라 나옴
  // 임시로 한매니저 사번으로 테스트 중
  // 향후 오픈 시엔 변경할 것
  // approver.draft =  userStore.userId
  // approver.draft =  'A526166'

  approver.draft =  userStore.userId
  
  let clrLine = ''

  if (grdApprovalLine.value != null) {
    linedt = grdApprovalLine.value.getGridView().getJsonRows()
  }

  if (linedt != null) {
    for (let i = 0; i < linedt.length; i++) {
      if (linedt[i].EMP_NO != null) {
        clrLine = clrLine + linedt[i].EMP_NO + ";"
      }
    }
    clrLine = clrLine.substring(0, clrLine.length - 1)
    approver.approver = clrLine
  }
  else {
    return Message.err(t('결재선을 지정하세요.'))
  }

  rskSaveData.approver = approver

  console.log('[hiOfficeApproval_RSK] rskSaveData : ', rskSaveData)
  console.log('[hiOfficeApproval_RSK] rskParam : ', rskParam)

  commonPostApprovalApi(rskParam, rskSaveData).then(res => {
    console.log('res : ', res)
    if (res.postResult.resultStatus === 'ERROR') {
      console.log(res.postResult)
      Message.err(res.postResult.resultMessage)
    }
    else {
      Message.success('결재상신 완료되었습니다.')
      emit('result', res.postResult.resultStatus)
      dialog.value = false
    }
  })

}

const beforeDelete = () => {
  // 체크된 컬럼 확인 작업
  let rowNum = grdLine.value.getGridView().getCheckedRows(true)

  if (rowNum.length === 0) {
    return Message.err("삭제할 항목을 선택해 주세요.")
  }

  return true
}

const deleteData = () => { 
  // 선택한 row 데이터 가져와 deleteParams에 넣어줌
  let deleteParams = []

  let checkedRows = grdLine.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdLine.value.getDataProvider().getJsonRow(rowIdx)
    
    console.log('[DUCHA]deleteData:',data)
    deleteParams.push(
      {
        CMPNY_DIV : data.CMPNY_DIV,       
        EMP_NO : data.EMP_NO,   
        PGM_ID : data.PGM_ID, 
        APPROVE_SAVENO : data.APPROVE_SAVENO,    
      },
    )
  }

  console.log('[DUCHA]deleteData>>>>>>',deleteParams)

  return commonExecuteApi({ queryId : 'APPROVAL_DELETELINE_01', list: deleteParams })
} 

const beforeSave = () => {

  if (isEmpty(searchParams.COL2)) {
    return Message.err("결재선 이름을 입력하세요.")
  }

  if (grdApprovalLine.value.getDataProvider().rowCount === 0) {
    return Message.err("결재자를 추가해 주세요.")
  }

  return true
}

//저장버튼 눌렀을때 실행되는 함수
const saveData = () => {
  let saveParams = []
  let checkedRows = grdLine.value.getGridView().getCheckedRows(true)
  let approvalRows = grdApprovalLine.value.getGridView().getJsonRows()

  console.log('saveData>> checkedRows : ', checkedRows.length)

  if (checkedRows.length === 0) {
    let clrLine = ''

    for (let rowIdx2 of approvalRows) {
      clrLine = clrLine + rowIdx2.EMP_NO + ';'
    }

    // 마지막 ';' 제거 → 패키지 저장 시 SPLIT 처리 후 null 값 저장되는 문제
    clrLine = clrLine.substring(0, clrLine.length - 1)

    saveParams.push({
      CMPNY_DIV: userStore.cmpnyDiv,
      EMP_NO: userId.value,
      PGM_ID: logsStore.vueId,
      APPROVE_SAVENO: '',
      APPROVE_SAVENO_NM: searchParams.COL2,
      ZZ_CLRLINE: clrLine,

    })
  }
  else {
    for (let rowIdx of checkedRows) {
      let data = grdLine.value.getDataProvider().getJsonRow(rowIdx)

      console.log('saveData>> data: ', data)

      data.CMPNY_DIV = userStore.cmpnyDiv
      data.EMP_NO = userId.value
      data.PGM_ID = logsStore.vueId
      data.APPROVE_SAVENO = data.APPROVE_SAVENO
      data.APPROVE_SAVENO_NM = searchParams.COL2
  
      let clrLine = ''

      for (let rowIdx2 of approvalRows) {
        clrLine = clrLine + rowIdx2.EMP_NO + ';'
      }

      // 마지막 ';' 제거 → 패키지 저장 시 SPLIT 처리 후 null 값 저장되는 문제
      clrLine = clrLine.substring(0, clrLine.length - 1)
  
      data.ZZ_CLRLINE = clrLine

      saveParams.push(data)
    }
  }

  console.log('saveData>> saveParams: ', saveParams)

  return commonExecuteApi({ queryId: "APPROVAL_SAVELINE_01", list: saveParams })
}


//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

// 2024-06-13 ILJOO_DUCHA 더블 클릭 시 선택된 사원 추가
const onCellDblClicked = (grid, clickData) => {
  btnInsertApp()
}
</script>

<template style="margin:0px;">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1560"
    height="900"
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
      <span>결재창</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="[ 'btnPreview', 'btnReqApply', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <div class=" d-flex">
              <i-input
                v-model="popupParams.TITLE"
                :label="$t('결재 제목')"
                top-label
                label-width="100px"
              />
            </div>
          </v-sheet>
          <div class="fill-height d-flex mt-2">
            <v-sheet 
              width="70%" 
              class="pe-2"
            >
              <v-sheet class="mb-2">
                <v-tabs v-model="tab1">
                  <v-tab value="tab1">
                    조직도
                  </v-tab>
                  <v-tab value="tab2">
                    결재선 보관함
                  </v-tab>
                </v-tabs>
              </v-sheet>
              <!-- /조직도 -->
              <v-sheet 
                v-show="tab1 == 'tab1'"
                class="fill-height"
              >
                <div class="fill-height d-flex mt-2">
                  <v-sheet 
                    width="50%" 
                    class="pe-2"
                  >
                    <i-select 
                      v-model="searchParams.BSNS_CD"
                      :label="$t('사업부')"
                      top-label
                      label-width="100px"
                      width="525px"
                      append-inner-icon="mdi-magnify"
                      :items="codeList.bsnsCd"
                      item-value="BSNS_CD"
                      item-title="BSNS_NM"
                    />
                    <v-sheet class="fill-height mt-2">
                      <IGridTitle
                        :title="$t('조직도')"
                        :button-list="['btnSearch']"
                        @click-button="onButtonsClick"
                      >
                        <template #editors />
                      </IGridTitle>
                      <RealGrid
                        ref="grdMain"
                        is-tree
                        :grid-view-option="grdMainProps.gridViewOption" 
                        :fields="grdMainProps.field" 
                        :columns="grdMainProps.columns"
                        @on-cell-clicked="onDeptSelect"
                      />
                    </v-sheet>
                  </v-sheet>
                  <v-sheet 
                    width="50%" 
                    class="h-auto pe-2"
                  >
                    <i-input
                      v-model="searchParams.COL1"
                      :label="$t('이름 검색')"
                      top-label
                      label-width="100px"
                      width="525px"
                      @keyup="keyupSearch"
                    />
                    <v-sheet class="h-auto mt-2">
                      <IGridTitle
                        :title="$t('임직원 목록')"
                        :button-list="['btnSearch', 'btnAddApp', 'btnAddCC']"
                        @click-button="onButtonsEMPClick"
                      >
                        <template #editors />
                      </IGridTitle>
                      <RealGrid
                        ref="grdEmp"
                        :grid-view-option="grdEmpProps.gridViewOption" 
                        :fields="grdEmpProps.field" 
                        :columns="grdEmpProps.columns"
                        @on-cell-dbl-clicked="onCellDblClicked"
                      />
                    </v-sheet>
                  </v-sheet>
                </div>
              </v-sheet>
              <!-- 결재선 보관함 -->
              <v-sheet 
                v-show="tab1 == 'tab2'" 
                width="100%" 
                class="pe-2 h-auto"
              >
                <i-input
                  v-model="searchParams.COL2"
                  :label="$t('결재선 명')"
                  top-label
                  label-width="100px"
                />
                <IGridTitle
                  class="mt-2"
                  :title="$t('결재선 목록')"
                  :button-list="[ 'btnSearch', 'btnUpdate', 'btnDelete' ]"
                  @click-button="onButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
                <v-sheet 
                  height="100%"
                >
                  <RealGrid
                    ref="grdLine"
                    class="mt-2"
                    :grid-view-option="grdLineProps.gridViewOption" 
                    :keys="grdLineProps.keys" 
                    :fields="grdLineProps.field" 
                    :columns="grdLineProps.columns"
                    @on-cell-clicked="onCellClicked"
                  />
                </v-sheet>
              </v-sheet>
            </v-sheet>
            <!-- 제일 오른쪽 자리 (결재선 관리 / 결재,참조 / 고정결재선) -->
            <v-sheet width="30%">
              <span 
                class="formLabelText"
                style="color:red"
              >
                {{ popupParams.CLRLEVELMSG }}
              </span>
              <v-sheet class="h-auto">
                <IGridTitle
                  class="mt-2"
                  :title="$t('결재자')"
                  :button-list="[ 'btnSelectRemove', 'btnAllRemove', 'btnMoveUp', 'btnMoveDown' ]"
                  @click-button="onApprButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdApprovalLine"
                  :grid-view-option="grdApprovalLineProps.gridViewOption" 
                  :fields="grdApprovalLineProps.field" 
                  :columns="grdApprovalLineProps.columns"
                />
                <!-- 고정 결재선 -->
                <IGridTitle
                  :title="$t('고정 결재선')"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdFixAppList"
                  :grid-view-option="grdFixAppListProps.gridViewOption" 
                  :fields="grdFixAppListProps.field" 
                  :columns="grdFixAppListProps.columns"
                />
                <!-- 참조 -->
                <IGridTitle
                  class="mt-2"
                  :title="$t('참조자')"
                  :button-list="[ 'btnSelectRemove', 'btnAllRemove', 'btnMoveUp', 'btnMoveDown' ]"
                  @click-button="onCcLineButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdCcLine"
                  :grid-view-option="grdCcLineProps.gridViewOption" 
                  :fields="grdCcLineProps.field" 
                  :columns="grdCcLineProps.columns"
                />
              </v-sheet>
            </v-sheet>
          </div>
        </div>
        <!-- 미리보기 팝업 -->
        <ApprovalPopup01
          ref="approvalPopup01"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

