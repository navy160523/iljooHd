<!--
  화면명 : MNGAA0030.vue
  화면개요 :HSE 중점추진사항 실적
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import MNGAA0030Popup from './MNGAA0030Popup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import OZReport from '@/components/OZReport.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import Message from '@hiway/utils/notify'

defineOptions({
  name:'10_management-MNG_A-MNGAA0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어


const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)
const mNGAA0030Popup = ref(null)
const detailParam = ref(null)
const userId = ref(userStore.userId)
const userLogStore = useLogsStore()
const focusRow = ref(0)
const approvalPopup = ref(null)

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// #1 END ------------------------------------------------------

// 복사 팝업 닫고나서 재 조회
const closeCopy = () => {
  onButtonsClick({ id :'btnSearch' })
}

// Oz 출력 세팅
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
  // { code: '1', text: '1분기' },
  // { code: '2', text: '2분기' },
  // { code: '3', text: '3분기' },
  // { code: '4', text: '4분기' },
  { code: '2', text: '상반기' },
  { code: '4', text: '하반기' },
])

// 코드리스트 선언
const codeList = reactive({
  YEAR: [], //년도
})


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
  QUARTER : dayjs().get("month") > 6 ? '4' : '2',

  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  ASGN_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm,
  EMP_NO: userStore.userId,
  VEND_YN: userStore.userDiv === "A" ? "N" : "Y"
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
    { 
      fieldName: 'AHEAD_ITEM', dataType: 'text', width: '200', required: true, header: { text: t('중점항목') }, editable : false, styleName: 'multiline-editor left-column' ,
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let result = ""
          let val = cell.value.split(' ')
          
          result = `<div style='padding: 10px 4px;'>${cell.value}</div>`
          return result
        },
      }, mergeRule: { "criteria": "value" },
    },
    { fieldName: 'PLAN_ITEM', dataType: 'text', width: '200', header: { text: t('실행방안') }, editable : false, styleName: 'multiline-editor left-column',
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let result = ""
          let val = cell.value.split(' ')
          
          result = `<div style='padding: 10px 4px;'>${cell.value}</div>`
          return result
        },
      }
    },
    { fieldName: 'PLAN_DESC', dataType: 'text', width: '100', header: { text: t('관리기준') }, editable : false },
    { fieldName: 'M01', dataType: 'text', width: '20', header: { text: t('1') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer'},
    { fieldName: 'M02', dataType: 'text', width: '20', header: { text: t('2') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
    { fieldName: 'M03', dataType: 'text', width: '20', header: { text: t('3') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
    { fieldName: 'M04', dataType: 'text', width: '20', header: { text: t('4') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
    { fieldName: 'M05', dataType: 'text', width: '20', header: { text: t('5') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
    { fieldName: 'M06', dataType: 'text', width: '20', header: { text: t('6') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
    { fieldName: 'M07', dataType: 'text', width: '20', header: { text: t('7') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
    { fieldName: 'M08', dataType: 'text', width: '20', header: { text: t('8') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
    { fieldName: 'M09', dataType: 'text', width: '20', header: { text: t('9') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
    { fieldName: 'M10', dataType: 'text', width: '20', header: { text: t('10') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
    { fieldName: 'M11', dataType: 'text', width: '20', header: { text: t('11') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
    { fieldName: 'M12', dataType: 'text', width: '20', header: { text: t('12') }, editable : false, styleName: 'rg_blue rg_underLine rg_pointer' },
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
    { fieldName: 'CYCLEINYEAR', dataType: 'text', width: '30', header: { text: t('목표') }, editable : false, visible: false },
    { fieldName: 'M1TO12', dataType: 'text', width: '30', header: { text: t('실적') }, editable : false, visible: false },
  ],
  columns : [],
  columnLayout: [
    'HSE_DIV', 
    'AHEAD_ITEM',
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
    'RATE',
  ],
})

grdMainProps.columns = grdMainProps.fields

const onCellClicked = (grid, clickData) => {
  grdMain.value.getGridView().columnByName("RATE").editable = false
  if(clickData.column === 'RATE' && grdMain.value.getDataProvider().getJsonRow(clickData.dataRow).PLAN_CYCLE ==='Z'){
    grdMain.value.getGridView().columnByName("RATE").editable = true
  }
  if(clickData.column.includes('M0') || clickData.column.includes('M1')){
    let month = clickData.column.slice(1)
    detailParam.value = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    detailParam.value.MONTH = month
    
    openPopup('등록')
  }
}

// const onCellDblClicked = (grid, clickData) => {
//   if(clickData.column.includes('M0') || clickData.column.includes('M1')){
//     let month = clickData.column.slice(1)
//     detailParam.value = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
//     detailParam.value.MONTH = month
    
//     openPopup('등록')
//   }
//   // if(clickData.column === 'PERFORMANCE'){
//   //   detailParam.value = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
//   //   openPopup('등록')
//   // }
// }

const onEditRowChanged = ( grid, itemIndex, dataRow, field, oldValue, newValue ) => {
  grid.commit()

  if(newValue > 100){
    grdMain.value.getDataProvider().setValue(dataRow, 'RATE' , 100)
  }
  if(newValue < 0){
    grdMain.value.getDataProvider().setValue(dataRow, 'RATE' , 0)
  }
}

onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
})

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
const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch')
  {
    if (!searchParams.ASGN_NM) {
    Message.warn('부서/협력사를 선택해주세요.')
    return
    }
    stateSearch()
  } 
  else if( btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnCopy') {
    openPopup('복사')
  }
  else if(btn.id === 'btnPrint'){
    commonSearchApi({ queryId : 'MNGAA0030_PRINT_CHK', param: searchParams }).then( res => {
    if(res.ORESULT_CUR && res.ORESULT_CUR.length > 0){
      if (res.ORESULT_CUR[0].CYCLE_YN === 0){
        Message.warn('관리기준 주기 값이 입력이 안된 행이 있습니다. 방침/목표/중점추진사항 등록/관리 화면에서 수정요청 버튼을 누른 뒤 주기값을 입력 해주세요.')
        return
      }else{
        showOz.value = true
      }
    }else{
      Message.warn('출력 가능한 값이 없습니다.')
      return
    }
    })
  }
  // 결재 버튼
  else if(btn.id === 'btnReqApply') {
    let month = dayjs().get("month") + 1

    // // 2025.02.03 이정현 책임 요청으로 6월~7월 / 12월~2월에만 결재 가능하도록 수정
    // if (month !== 6 && month !== 7 && month !== 12 && month !== 1 && month !== 2){
    //   if( 2 < month && month < 6){
    //     Message.warn('실적 보고 주기가 분기에서 반기로 변경되어, 결재상신은 6월부터 7월까지 가능합니다.')
    //   } else if ( 7 < month && month < 12){
    //     Message.warn('실적 보고 주기가 분기에서 반기로 변경되어, 결재상신은 12월부터 2월까지 가능합니다.')
    //   }
    //   return    
    // }

    commonSearchApi({ queryId : 'MNGAA0030_PRINT_CHK', param: searchParams }).then( res => {
    if(res.ORESULT_CUR && res.ORESULT_CUR.length > 0){
      if (res.ORESULT_CUR[0].CYCLE_YN === 0){
        Message.warn('관리기준 주기 값이 입력이 안된 행이 있습니다. 방침/목표/중점추진사항 등록/관리 화면에서 수정요청 버튼을 누른 뒤 주기값을 입력 해주세요.')
        return
      }else{
        reqApply()
      }
    }else{
      Message.warn('출력 가능한 값이 없습니다.')
      return
    }
    })
  }

  // 결재 취소
  else if(btn.id === 'btnApplyCancel') {

    let uParam = {}
    uParam.CMPNY_DIV = searchParams.CMPNY_DIV
    uParam.BSNS_CD = searchParams.BSNS_CD
    uParam.DEPT_CD = searchParams.DEPT_CD
    uParam.ASGN_CD = searchParams.ASGN_CD
    uParam.YEAR = searchParams.YEAR
    uParam.QUARTER = searchParams.QUARTER
    uParam.STATUS = '10'
    uParam.USER_ID = userStore.empNo

    let ck = await vm.$swal({ 
      title: t('작성중 상태로 돌리시겠습니까? <br> (해당 버튼은 안전경영부 담당자만 가능) '), 
      showCancelButton: true,
    })

    if(!ck.isConfirmed){
      Message.warn('취소되었습니다.')
      return 
    } 


    commonExecuteApi({ queryId: "MNGAA0030_UPDATE_03", list: [uParam] }).then( res => {
      if ( res.list[0].RES_COD === '200') {
        onButtonsClick({ id: 'btnSearch' })
      }

    })

  }


  else if(btn.id === 'btnConfirm') {
    confirm()
  }
  else if(btn.id === 'btnCancelConfirm'){
    cancelConfirm()
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
  console.log('stateSearch searchParams ', searchParams )

  commonSearchApi({ queryId : 'MNGAA0030_SEARCH_01', param: searchParams }).then( res => {
    if(res.ORESULT_CUR.length < 1){
      statusData.INSERT_DATE = ''
      statusData.CNFM_DATE = ''
      statusData.STATUS1 = ''
      statusData.STATUS1_NM = ''
      statusData.CNFM_DATE1 = ''
      statusData.STATUS2 = ''
      statusData.STATUS2_NM = ''
      statusData.CNFM_DATE2 = ''
      statusData.STATUS3 = ''
      statusData.STATUS3_NM = ''
      statusData.CNFM_DATE3 = ''
      statusData.STATUS4 = ''
      statusData.STATUS4_NM = ''
      statusData.CNFM_DATE4 = ''

      statusData.PROD_DIV = "Y"
      setButton()
      return
    }
      

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
  console.log('searchParams.QUARTER ', searchParams.QUARTER )
  if(searchParams.QUARTER === '1' || searchParams.QUARTER === '2'){
    matchedStatus = STATUS_NM.find((e) => e.code === statusData.STATUS1)
    if(matchedStatus){
      statusData.FINAL_STATUS_NM = matchedStatus ? '상반기 '+ matchedStatus.text : ''
      statusData.FIANL_DATE = statusData.CNFM_DATE1
    }
    
    matchedStatus = STATUS_NM.find((e) => e.code === statusData.STATUS2)
    if(matchedStatus){
      statusData.FINAL_STATUS_NM = matchedStatus ? '상반기 '+ matchedStatus.text : ''
      statusData.FIANL_DATE = statusData.CNFM_DATE2
    }
  }
  else if(searchParams.QUARTER === '3' || searchParams.QUARTER === '4'){  
    matchedStatus = STATUS_NM.find((e) => e.code === statusData.STATUS3)
    if(matchedStatus){
      statusData.FINAL_STATUS_NM = matchedStatus ? '하반기 '+ matchedStatus.text : ''
      statusData.FIANL_DATE = statusData.CNFM_DATE3
    }
    
    matchedStatus = STATUS_NM.find((e) => e.code === statusData.STATUS4)
    if(matchedStatus){
      statusData.FINAL_STATUS_NM = matchedStatus ? '하반기 '+ matchedStatus.text : ''
      statusData.FIANL_DATE = statusData.CNFM_DATE4
    }
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
const openPopup = gbn => {
  if(gbn === '부서조회'){
    deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams.ASGN_NM })
  }
  if(gbn === '등록'){
    focusRow.value = grdMain.value.getGridView().getCurrent().dataRow
    //console.log('등록 시 focusRow.value:',focusRow.value)
    mNGAA0030Popup.value.openPopup(detailParam.value)
  }
  if(gbn === '복사'){
    let path = useLogsStore().path.split('/')
    let menuId = path[path.length -1] 
    copyPopup.value.openCopyPopup(menuId, searchParams)
  }
}

const reqApply = () => {
  new queryFlowHelper(vm, t)
      .setQuery(searchApplyData)
      .setAfter(afterSearchApply)
      .run()

      // 결재 후 재조회
      onButtonsClick({ id: 'btnSearch' })
}

/* -------------- 확정 -------------- */
const confirm = async () => {
  
  // if(statusData.PROD_DIV === 'Y' && statusData.VEND_YN === 'N') { 
    //직영,생산
    // let ck = await vm.$swal({ 
    //   title: t('작성완료(확정) 시 안전검토요청을 진행합니다. 완료처리 하시겠습니까?'), 
    //   showCancelButton: true,
    // })

  //   if(!ck.isConfirmed){
  //    Message.warn('취소되었습니다.')
  //   return 
  //  } 
  // }
  // else{
  //   let ck = await vm.$swal({ 
  //     title: t('확정(작성완료) 하시겠습니까?'), 
  //     showCancelButton: true,
  //   })

  //   if(!ck.isConfirmed){
  //    Message.warn('취소되었습니다.')
  //   return 
  //  } 
  // }

  let ck = await vm.$swal({ 
      title: t('확정(작성완료) 하시겠습니까?'), 
      showCancelButton: true,
    })

    if(!ck.isConfirmed){
     Message.warn('취소되었습니다.')
    return 
   } 

  confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV,
  confirmParam.BSNS_CD = searchParams.BSNS_CD,
  confirmParam.DEPT_CD = searchParams.DEPT_CD,
  confirmParam.ASGN_CD = searchParams.ASGN_CD,
  confirmParam.YEAR = searchParams.YEAR,
  confirmParam.QUARTER = searchParams.QUARTER,
  confirmParam.USER_ID = userId.value
  
  if(statusData.PROD_DIV === 'Y' && statusData.VEND_YN === 'N') {
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

/* -------------- 결재 -------------- */
const searchApplyData = () => {
  
  console.log('결재 확인', searchParams)
  return commonSearchApi({ queryId : 'MNGAA0030_PRINT_01', param: searchParams })
}

const appData = reactive({})

const afterSearchApply = res => {
  console.log('결재 res:',res)

  if(res.length === 0){ 
    Message.warn('결재할 데이터가 없습니다.')
    return 
  }

  appData.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
  appData.BSNS_CD = res.ORESULT_CUR[0].BSNS_CD
  appData.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
  appData.ASGN_CD = res.ORESULT_CUR[0].ASGN_CD
  appData.YEAR = res.ORESULT_CUR[0].YEAR
  appData.STATUS = '40'
  appData.QUARTER = res.ORESULT_CUR[0].QUARTER
  appData.USER_ID = userStore.userId

  let d = `<html>
<head>
<title>OZ HTML</title>
<style type="text/css">
<!--
div.offset{
position:absolute;
background-color:transparent;
box-sizing: border-box;
-moz-box-sizing: border-box;
-ms-box-sizing: border-box;
-webkit-box-sizing: border-box;
left:0px;
top:0px;
width:0px;
height:0px;
}
div{
position:relative;
}
table.one{
width:100%;
height:100%;
border:0;
}
table.two{
width:100%;
height:100%;
border:0;
line-height:80%;
}
table.three{
width:100%;
height:100%;
border:0;
line-height:60%;
}
table.four{
width:100%;
height:100%;
border:0;
line-height:40%;
}
table.five{
width:100%;
height:100%;
border:0;
line-height:20%;
}
br{letter-spacing:0;}
#center{
text-align:center;
}
div.b_0{
border-width:1px;
border-color:#000000;
border-style:solid;
box-sizing: border-box;
-moz-box-sizing: border-box;
-ms-box-sizing: border-box;
-webkit-box-sizing: border-box;
}
#f_20w24s0{
font-size:20pt;
line-height:24pt;
letter-spacing:0pt;
}
font.맑은_고딕{
font-family:맑은 고딕;
}
#f_10w13s0{
font-size:10pt;
line-height:13pt;
letter-spacing:0pt;
}
font.굴림{
font-family:굴림;
}
#left{
text-align:left;
}
-->
</style>
</head>
<body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
<div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:1123px;height:793px">
<!--<div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:75px;width:472px;height:98px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_20w24s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>분기별&nbspHSE&nbsp중점&nbsp추진&nbsp실적&nbsp분석</font></td></tr></table></div></div>
<div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:496px;top:75px;width:86px;height:98px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>소속부서<BR>(협력사)</font></td></tr></table></div></div>
<div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:580px;top:75px;width:244px;height:98px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>전산테스트부서(선택금지)</font></td></tr></table></div></div>
<div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:822px;top:75px;width:32px;height:98px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>결&nbsp&nbsp재</font></td></tr></table></div></div>
<div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:852px;top:75px;width:83px;height:24px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>작&nbsp성</font></td></tr></table></div></div>
<div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:933px;top:75px;width:83px;height:24px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>검&nbsp토</font></td></tr></table></div></div>
<div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1014px;top:75px;width:83px;height:24px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>승&nbsp인</font></td></tr></table></div></div>
<div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:852px;top:97px;width:83px;height:54px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
<div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:933px;top:97px;width:83px;height:54px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
<div class=offset style="z-index:10"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1014px;top:97px;width:83px;height:54px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
<div class=offset style="z-index:11"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:852px;top:149px;width:83px;height:24px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
<div class=offset style="z-index:12"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:933px;top:149px;width:83px;height:24px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
<div class=offset style="z-index:13"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1014px;top:149px;width:83px;height:24px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
-->
<div class=offset style="z-index:14"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:75px;width:51px;height:59px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>구분</font></td></tr></table></div></div>
<div class=offset style="z-index:15"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:75px;top:75px;width:352px;height:59px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>중점&nbsp추진&nbsp사항</font></td></tr></table></div></div>
<div class=offset style="z-index:16"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:425px;top:75px;width:429px;height:59px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>실행&nbsp방안</font></td></tr></table></div></div>
<div class=offset style="z-index:17"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:852px;top:75px;width:164px;height:59px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>관리&nbsp기준</font></td></tr></table></div></div>
<div class=offset style="z-index:18"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1014px;top:75px;width:83px;height:59px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>이행율(%)</font></td></tr></table></div></div>`
  let zindex = 19
  // let idx = 1
  let top = 132
  let height = 54
  for(let i=0;i<res.ORESULT_CUR.length;i++){
    d+=`<div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:${top}px;width:51px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].HSE_DIV_NM}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:75px;top:${top}px;width:352px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].DETAIL_ITEM}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:425px;top:${top}px;width:429px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].PLAN_ITEM}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:852px;top:${top}px;width:164px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].PLAN_DESC}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1014px;top:${top}px;width:83px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].RATE}</font></td></tr></table></div></div>`
    top = top + height - 2
  }
  d+=`</div>
  </body>
  </html>`

  approvalPopup.value.openPopup({
    CLSS_ID: 'MNGAA0030',
    TITLE: 'HSE 중점추진사항 실적',
    CMPNY_DIV : userStore.cmpnyDiv,
    DATA_KEY : userStore.cmpnyDiv+';'+searchParams.BSNS_CD+';'+searchParams.DEPT_CD+';'+searchParams.ASGN_CD+';'+searchParams.YEAR, // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
    REPORT : d, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE : '3', //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE : 'CLR_15', //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  })
}

// 실적 버튼 Set
const setButton = async res => {
  
  console.log("RES : ", res)
  let month = dayjs().get("month") + 1
  menuTitle.value.disableBtn('btnConfirm', true)
  menuTitle.value.disableBtn('btnCancelConfirm', true)
  menuTitle.value.disableBtn('btnReqApply', true)
  menuTitle.value.disableBtn('btnUpdate', true)
  menuTitle.value.disableBtn('btnApplyCancel', true)
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

  await commonSearchApi({ queryId : 'MNGAA0020_SEARCH_03', param: searchParams }).then( res => {
    if(res.ORESULT_CUR && res.ORESULT_CUR.length > 0){
      res.ORESULT_CUR.forEach(element => {
        if(element.EMP_NO === userId.value){
          editable = true
        }
      })
    }
  })

  //true면 보임, false면 안보임
  //menuTitle.value.setBtnProperty('btnSearch', 'visible', false)
  if(searchParams.VEND_YN === 'N'){
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', false)
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false)
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', true)
  }
  else if(searchParams.VEND_YN === 'Y'){
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', true)
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', true)
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', false)
  }

  // 결재취소는 김민수사원한테만 있음
  // 시스템관리에서 적용

  if (res !== undefined){
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
    await commonSearchApi({ queryId : 'searchHseAuth', param: searchParams }).then(res => {
      auth = res.ORESULT_CUR[0].AUTH === 'Y' ? true : false
    })

    if (status === '10'  && vend_yn === 'Y')
      menuTitle.value.disableBtn('btnConfirm', (editable && auth && true && (beforeStatus == "70" ? true : false)) ? false : true)
    if (status === '70' && vend_yn === 'Y')
      menuTitle.value.disableBtn('btnCancelConfirm', (editable && auth && true) ? false : true)


    if (status === '10' && vend_yn === 'N')
      menuTitle.value.disableBtn('btnReqApply', (editable && auth && true && (beforeStatus == "70" ? true : false)) ? false : true)
    else
      menuTitle.value.disableBtn('btnReqApply', true)

    if (status === '70'){
      menuTitle.value.disableBtn('btnUpdate', true)
      menuTitle.value.disableBtn('btnApplyCancel', false)
    }
    else
      menuTitle.value.disableBtn('btnUpdate', false)

    console.log('editable: ', editable)
    console.log('auth: ', auth)
    console.log('beforeStatus: ', beforeStatus)    
  }  

}

//팝업 선택 이벤트
const onDeptSelected = val => {
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM
  searchParams.VEND_YN = val.ORGN_DIV === "A" ? "N" : "Y"

  onButtonsClick({ id: 'btnSearch' })
}

/* ------------ 결재 후 결재ID 저장 ------------ */
const approvalAppkey = (appKey) => {
  appData.APPROVE_ID = appKey
  commonExecuteApi({ queryId: 'MNGAA0030_UPDATE_02', list: [appData] })
}

// 결재 / 출력 전에 주기 값 확인

</script>

<template>
  <v-card class="pa-0 fill-height">
    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnConfirm', 'btnCancelConfirm', 'btnReqApply', 'btnApplyCancel', 'btnPrint', 'btnCopy']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

      <!-- 조회조건 -->
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex justify-space-between pt-2 pb-2" >
            <div class="d-flex">
              <i-select 
                :label="$t('년도')"
                type='YEAR'
                label-width="35px"
                width="150px"
                v-model="searchParams.YEAR"
                required
              />
            
              <i-input 
                :label="$t('부서/ 협력사')"
                label-width="80px"
                width="350px"
                v-model="searchParams.ASGN_NM" 
                append-inner-icon="mdi-magnify" 
                @keydown.enter="e => {
                  openPopup('부서조회')
                }"
                @update:modelValue="e => { searchParams.DEPT_CD = null }"
                @click:appendInner="openPopup('부서조회')"
                required
                class="ma-0"
              />
              <i-input
                v-model="searchParams.ASGN_CD" 
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
          <v-sheet>
          <strong>※ HSE경영시스템 메뉴는 부서 내 HSE추진자만 입력 가능하며, HSE추진자는 부서에서 직접 관리합니다.</strong>
           &nbsp; - HSE추진자 등록 메뉴 : [운영관리 - 담당자 관리 - 부서별 담당자 등록/관리] 
          <br> &nbsp; - HSE추진자 등록 권한:  부서 내 HSE 추진자, 운영과장 
        </v-sheet>
          <v-sheet class="h-auto">
             <RealGrid
               ref="grdMain"
               :grid-view-option="grdMainProps.gridViewOption"
               :keys="grdMainProps.keys" 
               :fields="grdMainProps.fields"
               :columns="grdMainProps.columns"
               :column-layout="grdMainProps.columnLayout"
               @onCellDblClicked="onCellDblClicked"
               @onCellClicked="onCellClicked"
               @onEditRowChanged="onEditRowChanged"
             />
           </v-sheet>
        </div>
      </v-card-text>


    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>

    <!-- 실적 등록 팝업 -->
    <MNGAA0030Popup
      ref="mNGAA0030Popup" 
      @afterSearch="() => { onButtonsClick({ id: 'btnSearch' }) }"
    />

    <!-- 복사 팝업 -->
    <CopyPopup ref="copyPopup" @closeCopy="closeCopy"/>

    <!-- OZReport -->
    <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
    <!-- 결재 -->
    <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
  </v-card>
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

.rg-renderer{
  padding-top: 20px !important;  
}
</style>

