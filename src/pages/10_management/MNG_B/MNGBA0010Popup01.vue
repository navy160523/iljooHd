<!-- MNGAA0030 HSE 중점추진사항 실적 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어


const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)
const detailParam = ref(null)
const userId = ref(userStore.userId)
const focusRow = ref(0)
const dialog = ref(false)

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// #1 END ------------------------------------------------------


const setPrint = () => {
  reportName.value = '/manage/hse/HSE_MNGAA0030.ozr'

  params.value = [
    "IN_CMPNY_DIV="+searchParams.CMPNY_DIV,
    "IN_BSNS_CD="+searchParams.BSNS_CD,
    "IN_DEPT_CD="+searchParams.DEPT_CD,
    "IN_ASGN_CD="+searchParams.ASGN_CD,
    "IN_YEAR="+searchParams.YEAR,
    "IN_QUARTER="+searchParams.QUARTER,
  ]
}

const STATUS_NM = reactive([
  { code: '10', text: '작성중' },
  { code: '11', text: '재작성요청' },
  { code: '20', text: '검토요청' },
  { code: '30', text: '건토완료' },
  { code: '40', text: '결재진행중' },
  { code: '50', text: '수정요청중' },
  { code: '60', text: '수정승인' },
  { code: '70', text: '결재완료/확정' },
])

const quarterList = reactive([
  { code: '2', text: '상반기' },
  { code: '4', text: '하반기' },
])


const HSE_DIVLookup = reactive([
  { value: '1', label: '안전' },
  { value: '2', label: '보건' },
  { value: '3', label: '환경' },
])

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  YEAR: dayjs().get("year"),
  QUARTER : '2',

  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  ASGN_CD: true? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: true? userStore.deptNm : userStore.deptNm,
  EMP_NO: userStore.userId
})


const confirmParam = reactive({
  CMPNY_DIV : null,
  BSNS_CD : null,
  DEPT_CD : null,
  ASGN_CD : null,
  YEAR : null,
  QUARTER : null,
  STATUS : null,
  USER_ID : null,
})

// 상태 data
const statusData = reactive({
  INSERT_DATE : '', //목표 작성일
  CNFM_DATE : '', // 목표 결재 / 확정일
  STATUS1 : '', // 1분기 상태
  STATUS1_NM : '', // 1분기 상태 한글
  CNFM_DATE1 : '', // 1분기 결재 / 확정일
  STATUS2 : '', // 2분기 상태
  STATUS2_NM : '', // 2분기 상태 한글
  CNFM_DATE2 : '', // 2분기 결재 / 확정일
  STATUS3 : '', // 3분기 상태
  STATUS3_NM : '', // 3분기 상태 한글
  CNFM_DATE3 : '', // 3분기 결재 / 확정일
  STATUS4 : '', // 4분기 상태
  STATUS4_NM : '', // 4분기 상태 한글
  CNFM_DATE4 : '',// 4분기 결재 / 확정일

  PROD_DIV : '',
  VEND_YN : '',
  FINAL_STATUS_NM : '', // 최신 상태
  FIANL_DATE : '', // 최신 결재/확정일

})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false } },
  keys : ['COL01'],
  fields : [
    { fieldName: 'HSE_DIV', dataType: 'text', width: '70', required: true, header: { text: t('구분') }, lookupDisplay: true, lookupData: HSE_DIVLookup, mergeRule: { "criteria": "value" }, editable : false  },
    { fieldName: 'DETAIL_ITEM', dataType: 'text', width: '200', required: true, header: { text: t('세부내용') }, editable : false, styleName: 'multiline-editor left-column' },
    { fieldName: 'PLAN_ITEM', dataType: 'text', width: '200', header: { text: t('실행내용') }, editable : false, styleName: 'multiline-editor left-column' },
    { fieldName: 'PLAN_DESC', dataType: 'text', width: '100', header: { text: t('관리기준') }, editable : false },
    { fieldName: 'M01', dataType: 'text', width: '20', header: { text: t('1') }, editable : false, styleName: 'rg_blue rg_underLine'},
    { fieldName: 'M02', dataType: 'text', width: '20', header: { text: t('2') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'M03', dataType: 'text', width: '20', header: { text: t('3') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'M04', dataType: 'text', width: '20', header: { text: t('4') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'M05', dataType: 'text', width: '20', header: { text: t('5') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'M06', dataType: 'text', width: '20', header: { text: t('6') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'M07', dataType: 'text', width: '20', header: { text: t('7') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'M08', dataType: 'text', width: '20', header: { text: t('8') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'M09', dataType: 'text', width: '20', header: { text: t('9') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'M10', dataType: 'text', width: '20', header: { text: t('10') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'M11', dataType: 'text', width: '20', header: { text: t('11') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'M12', dataType: 'text', width: '20', header: { text: t('12') }, editable : false, styleName: 'rg_blue rg_underLine' },
    { fieldName: 'CYCLEINYEAR', dataType: 'text', width: '30', header: { text: t('목표') }, editable : false },
    { fieldName: 'M1TO12', dataType: 'text', width: '30', header: { text: t('실적') }, editable : false },
    { fieldName: 'RATE', dataType: 'number', numberFormat: "#,##0.##", width: '100', header: { text: t('이행률(%)') }, 
      styleName: 'editable_column',
      max: 100, min: 0, 
      editor: {
        type: 'number',
        editFormat: "#,##0.##",
      },
    },
    { fieldName: 'PLAN_CYCLE', dataType: 'text', visible: false  },
    { fieldName: 'PLAN_CYCLE_DESC', dataType: 'text', visible: false  },
    { fieldName: 'CYCLE_DESC', dataType: 'text', visible: false  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false  },
    { fieldName: 'YEAR', dataType: 'text', visible: false  },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false  },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false  },
    { fieldName: 'QUARTER', dataType: 'text', visible: false  },
    { fieldName: 'AHEAD_NO', dataType: 'text', visible: false  },
    { fieldName: 'DETAIL_NO', dataType: 'text', visible: false  },
    { fieldName: 'PLAN_NO', dataType: 'text', visible: false  },
    { fieldName: 'USER_ID', dataType: 'text', visible: false  },
  ],
  columns : [],
  columnLayout: [
    'HSE_DIV', 
    'DETAIL_ITEM',
    'PLAN_ITEM',
    'PLAN_DESC',
    {
      name: '1분기',
      direction: 'horizontal',
      items: [
        'M01',
        'M02',
        'M03',
      ],
    },
    {
      name: '2분기',
      direction: 'horizontal',
      items: [
        'M04',
        'M05',
        'M06',
      ],
    },
    {
      name: '3분기',
      direction: 'horizontal',
      items: [
        'M07',
        'M08',
        'M09',
      ],
    },
    {
      name: '4분기',
      direction: 'horizontal',
      items: [
        'M10',
        'M11',
        'M12',
      ],
    },
    'CYCLEINYEAR',
    'M1TO12',
    'RATE',
  ],
})

grdMainProps.columns = grdMainProps.fields

watch(() => [searchParams.YEAR, searchParams.ASGN_NM, searchParams.QUARTER],([newValueYEAR, newValueASGN_NM, newValueQUARTER], [oldValueYEAR, oldValueASGN_NM, oldValueQUARTER]) => {

  statusData.INSERT_DATE = ''
  statusData.CNFM_DATE = ''
  statusData.STATUS1_NM = ''
  statusData.CNFM_DATE1 = ''
  statusData.STATUS2_NM = ''
  statusData.CNFM_DATE2 = ''
  statusData.STATUS3_NM = ''
  statusData.CNFM_DATE3 = ''
  statusData.STATUS4_NM = ''
  statusData.CNFM_DATE4 = ''

  statusData.PROD_DIV = ''
  statusData.VEND_YN = ''
  statusData.FINAL_STATUS_NM = ''
  statusData.FIANL_DATE = ''
  
  grdMain.value.getDataProvider().setRows()
})

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch')
  {
    if (!searchParams.ASGN_NM) {
    Message.warn('부서/협력사를 선택해주세요.')
    return
    }
    stateSearch()
  } 
  else if(btn.id === 'btnPrint'){
    showOz.value = true
  }
  else if(btn.id === 'btnClose'){
    onClose()
  }
}


const stateSearch = () => {
  grdMain.value.getDataProvider().setRows()
  statusData.INSERT_DATE = null
  statusData.CNFM_DATE = null
  statusData.STATUS1 = null
  statusData.STATUS1_NM = null
  statusData.CNFM_DATE1 = null
  statusData.STATUS2 = null
  statusData.STATUS2_NM = null
  statusData.CNFM_DATE2 = null
  statusData.STATUS3 = null
  statusData.STATUS3_NM = null
  statusData.CNFM_DATE3 = null
  statusData.STATUS4 = null
  statusData.STATUS4_NM = null
  statusData.CNFM_DATE4 = null

  statusData.PROD_DIV = null
  statusData.VEND_YN = null
  statusData.FINAL_STATUS_NM = null
  statusData.FIANL_DATE = null
  
  commonSearchApi({ queryId : 'MNGAA0030_SEARCH_01', param: searchParams }).then( res => {
    if(res.ORESULT_CUR.length < 1)
      return

    if(res.ORESULT_CUR.length > 0){
      console.log('MNGAA0030_SEARCH_01 res:',res)
      statusData.INSERT_DATE = res.ORESULT_CUR[0].INSERT_DATE
      statusData.CNFM_DATE = res.ORESULT_CUR[0].CNFM_DATE
      statusData.STATUS1 = res.ORESULT_CUR[0].STATUS1 
      statusData.STATUS1_NM = res.ORESULT_CUR[0].STATUS1 ? STATUS_NM.filter(status => status.code === res.ORESULT_CUR[0].STATUS1 )[0].text : ''
      statusData.CNFM_DATE1 = res.ORESULT_CUR[0].CNFM_DATE1
      statusData.STATUS2 = res.ORESULT_CUR[0].STATUS2
      statusData.STATUS2_NM = res.ORESULT_CUR[0].STATUS2 ? STATUS_NM.filter(status => status.code === res.ORESULT_CUR[0].STATUS2 )[0].text : ''
      statusData.CNFM_DATE2 = res.ORESULT_CUR[0].CNFM_DATE2
      statusData.STATUS3 = res.ORESULT_CUR[0].STATUS3
      statusData.STATUS3_NM = res.ORESULT_CUR[0].STATUS3 ? STATUS_NM.filter(status => status.code === res.ORESULT_CUR[0].STATUS3 )[0].text : ''
      statusData.CNFM_DATE3 = res.ORESULT_CUR[0].CNFM_DATE3
      statusData.STATUS4 = res.ORESULT_CUR[0].STATUS4
      statusData.STATUS4_NM = res.ORESULT_CUR[0].STATUS4 ? STATUS_NM.filter(status => status.code === res.ORESULT_CUR[0].STATUS4 )[0].text : ''
      statusData.CNFM_DATE4 = res.ORESULT_CUR[0].CNFM_DATE4
      
      statusData.PROD_DIV = res.ORESULT_CUR[0].PROD_DIV
      statusData.VEND_YN = res.ORESULT_CUR[0].VEND_YN
      
      chkStatus()

      searchParams.QUARTER

      setButton(res.ORESULT_CUR[0])

      setPrint()
    }
  }).finally(()=> {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .run()
  })
  
}


const chkStatus = ()=>{
  
  let matchedStatus = ''

  matchedStatus = STATUS_NM.find((e) => e.code === statusData.STATUS1)
  if(matchedStatus){
    statusData.FINAL_STATUS_NM = matchedStatus ? '1 분기 '+ matchedStatus.text : ''
    statusData.FIANL_DATE = statusData.CNFM_DATE1
  }
  
  matchedStatus = STATUS_NM.find((e) => e.code === statusData.STATUS2)
  if(matchedStatus){
    statusData.FINAL_STATUS_NM = matchedStatus ? '2 분기 '+ matchedStatus.text : ''
    statusData.FIANL_DATE = statusData.CNFM_DATE2
  }
  
  matchedStatus = STATUS_NM.find((e) => e.code === statusData.STATUS3)
  if(matchedStatus){
    statusData.FINAL_STATUS_NM = matchedStatus ? '3 분기 '+ matchedStatus.text : ''
    statusData.FIANL_DATE = statusData.CNFM_DATE3
  }
  
  matchedStatus = STATUS_NM.find((e) => e.code === statusData.STATUS4)
  if(matchedStatus){
    statusData.FINAL_STATUS_NM = matchedStatus ? '4 분기 '+ matchedStatus.text : ''
    statusData.FIANL_DATE = statusData.CNFM_DATE4
  }

}

const searchData01 = () => {
  return commonSearchApi({ queryId : 'MNGAA0030_SEARCH_02', param: searchParams }) 
}

const afterSearch01 = async res => {
  // 0을 공백으로 바꾸기
  res.ORESULT_CUR.forEach(e => {
    e.M01 = e.M01 === 0 ? '' : e.M01
    e.M02 = e.M02 === 0 ? '' : e.M02
    e.M03 = e.M03 === 0 ? '' : e.M03
    e.M04 = e.M04 === 0 ? '' : e.M04
    e.M05 = e.M05 === 0 ? '' : e.M05
    e.M06 = e.M06 === 0 ? '' : e.M06
    e.M07 = e.M07 === 0 ? '' : e.M07
    e.M08 = e.M08 === 0 ? '' : e.M08
    e.M09 = e.M09 === 0 ? '' : e.M09
    e.M10 = e.M10 === 0 ? '' : e.M10
    e.M11 = e.M11 === 0 ? '' : e.M11
    e.M12 = e.M12 === 0 ? '' : e.M12
  })
  Promise.all([
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR),
  ]).then(() => {
    grdMain.value.getGridView().setCurrent({ itemIndex: focusRow.value })
    focusRow.value = 0

  })
  
}

const saveData = () => {
  let saveParams = []

  // 상태바가 체크된 항목
  let stateCheckedRows = grdMain.value.getDataProvider().getStateRows("updated")

  for (let rowIdx of stateCheckedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.AHEAD_NO = data.AHEAD_NO*1
    data.DETAIL_NO = data.DETAIL_NO*1
    data.PLAN_NO = data.PLAN_NO*1
    data.USER_ID = userId.value
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId : 'MNGAA0030_SAVE_01', list: saveParams })
}

//팝업 오픈
const openSubPopup = async gbn => {
  if(gbn === '부서조회'){
    deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams.ASGN_NM })
  }
}

const reqApply = () => {
  Message.warn('기능 개발 중입니다.')
  return
}

/* -------------- 확정 -------------- */
const confirm = async () => {
  
  if(info.value.prodDiv === 'Y' && info.value.vendYN === 'N') { 
    //직영,생산
    let ck = await vm.$swal({ 
      title: t('작성완료(확정) 시 안전검토요청을 진행합니다. 완료처리 하시겠습니까?'), 
      showCancelButton: true,
    })

    if(!ck.isConfirmed){
     Message.warn('취소되었습니다.')
    return 
   } 
  }
  else{
    let ck = await vm.$swal({ 
      title: t('확정(작성완료) 하시겠습니까?'), 
      showCancelButton: true,
    })

    if(!ck.isConfirmed){
     Message.warn('취소되었습니다.')
    return 
   } 
  }

  confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV,
  confirmParam.BSNS_CD = searchParams.BSNS_CD,
  confirmParam.DEPT_CD = searchParams.DEPT_CD,
  confirmParam.ASGN_CD = searchParams.ASGN_CD,
  confirmParam.YEAR = searchParams.YEAR,
  confirmParam.QUARTER = searchParams.QUARTER,
  confirmParam.USER_ID = userId.value
  
  if(info.value.prodDiv === 'Y' && info.value.vendYN === 'N') {
    confirmParam.STATUS = '20'
  }
  else {
    confirmParam.STATUS = '70'
  }

  await commonExecuteApi({ queryId: "MNGAA0030_UPDATE_01", list: [confirmParam] })
  onButtonsClick({ id :'btnSearch' })
}

/* -------------- 확정 취소 -------------- */
const cancelConfirm = async () => {
  let ck = await vm.$swal({ 
    title: t('완료취소 하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!ck.isConfirmed){
    Message.warn('취소되었습니다.')

    return 
  }

  confirmParam.STATUS = '10',
  confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV,
  confirmParam.BSNS_CD = searchParams.BSNS_CD,
  confirmParam.DEPT_CD = searchParams.DEPT_CD,
  confirmParam.ASGN_CD = searchParams.ASGN_CD,
  confirmParam.YEAR = searchParams.YEAR,
  confirmParam.QUARTER = searchParams.QUARTER,
  confirmParam.USER_ID = userId.value

  await commonExecuteApi({ queryId: "MNGAA0030_UPDATE_01", list: [confirmParam] })
  onButtonsClick({ id :'btnSearch' })
}

const setButton = res => {

  menuTitle.value.disableBtn('btnConfirm', true)
  menuTitle.value.disableBtn('btnCancelConfirm', true)
  menuTitle.value.disableBtn('btnReqApply', true)
  menuTitle.value.disableBtn('btnUpdate', true)

  /*
  * 상태코드(F30)
  * 10 : 작성중
  * 40 : 결재진행중
  * 70 : 결재완료/확정
  * 
  * 계획작성버튼 : 상태가 10,11,60, 일때만 가능
  * 
  * 상단 버튼
  *  btn확정         :협력사 만: 10 => 70으로 변경
  *  btn확정취소     :협력사 만: 70 => 10으로 변경
  *  btn결재상신     :직영만 : 10 일때 활성, 40으로 변경
  *                   협력사 : x           
  */


  // 조직별 추진담당자만 수정
  let editable = false
  commonSearchApi({ queryId : 'MNGAA0020_SEARCH_03', param: searchParams }).then( res => {
    if(res.ORESULT_CUR && res.ORESULT_CUR.length > 0){
      res.ORESULT_CUR.forEach(element => {
        if(element.EMP_NO === userId.value){
          editable = true
        }
      })
    }
  })
  
  let planStatus = res.PLAN_STATUS
  let quarter = res.QUARTER * 1
  let beforeStatus = "70"
  let status = res.STATUS
  let vend_yn = res.VEND_YN

  if(planStatus !== '70'){
    return
  }

  if(quarter === 4){
    beforeStatus = res["STATUS" + (quarter - 2)]
  }
  searchParams.EMP_NO = userId.value
  let auth = ''
  commonSearchApi({ queryId : 'searchHseAuth', param: searchParams }).then(res => {
    auth = res.ORESULT_CUR[0].AUTH
  })

  //true면 보임, false면 안보임
  //menuTitle.value.setBtnProperty('btnSearch', 'visible', false)

  if(vend_yn === 'N'){
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', false)
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false)
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', true)
  }
  else if(vend_yn === 'Y'){
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', true)
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', true)
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', false)
  }
  
  if (status === '10'  && vend_yn === 'Y')
    menuTitle.value.disableBtn('btnConfirm', (editable && auth && true && (beforeStatus == "70" ? true : false)) ? false : true)
  if (status === '70' && vend_yn === 'Y')
    menuTitle.value.disableBtn('btnCancelConfirm', (editable && auth && true) ? false : true)
  if (status === '10' && vend_yn === 'N')
    menuTitle.value.disableBtn('btnReqApply', (editable && auth && true && (beforeStatus == "70" ? true : false)) ? false : true)
  else
    menuTitle.value.disableBtn('btnReqApply', true)
  if (status === '70')
    menuTitle.value.disableBtn('btnUpdate', true)
  else
    menuTitle.value.disableBtn('btnUpdate', false)
}

//팝업 선택 이벤트
const onDeptSelected = val => {
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM

  onButtonsClick({ id: 'btnSearch' })
}


const openPopup = async data => {  
  await onButtonsClick({ id :'btnSearch' })
  //팝업 오픈
  dialog.value = true 
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1600"
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
      <span>{{'중점추진사항 이행현황 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="'중점추진사항 이행현황'"
          :button-list="['btnSearch', 'btnPrint', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <!-- 조회조건 -->
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex justify-space-between pt-2 pb-2" >
            <div class="d-flex">
              <i-input
                :label="$t('년도')"
                label-width="35px"
                width="150px"
                v-model="searchParams.YEAR"
                type="Number"
                required
                oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
              />
            
              <i-input 
                :label="$t('부서/ 협력사')"
                label-width="80px"
                width="350px"
                v-model="searchParams.ASGN_NM" 
                append-inner-icon="mdi-magnify" 
                @keydown.enter="e => {
                  openSubPopup('부서조회')
                }"
                @update:modelValue="e => { searchParams.DEPT_CD = null }"
                @click:appendInner="openSubPopup('부서조회')"
                required
                class="ma-0"
              />
              <i-input
                v-model="searchParams.DEPT_CD" 
                readonly 
                width="100px"
              />

              <!-- 조치여부 -->
              <i-select 
                :label="$t('반기')"
                labelWidth="55px"
                width="180px"
                v-model="searchParams.QUARTER"
                :items="quarterList"
                item-value="code"
                item-title="text"
                required
              />
            </div>

            <div class="d-flex flex-column">
              <div class="d-flex">
                <i-input
                  :label="$t('목표작성일')"
                  labelWidth="70px"
                  v-model="statusData.INSERT_DATE"
                  readonly
                  width="250px"
                />
                <i-input
                  :label="$t('목표결재/확정일')"
                  labelWidth="100px"
                  v-model="statusData.CNFM_DATE"
                  readonly
                  width="270px"
                />
              </div>
              <div class="d-flex">
                <i-input
                  :label="$t('상태')"
                  labelWidth="70px"
                  v-model="statusData.FINAL_STATUS_NM"
                  readonly
                  width="250px"
                />
                <i-input
                  :label="$t('결재/확정일')"
                  labelWidth="100px"
                  v-model="statusData.FIANL_DATE"
                  readonly
                  width="270px"
                />
              </div>
            </div>

          </v-sheet>
        
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
        </div>
      </v-card-text>

      <!-- 부서/ 협력사 팝업 -->
      <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
      <!-- OZReport -->
      <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
    </v-card>
  </VDialog>
</template>

  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>

