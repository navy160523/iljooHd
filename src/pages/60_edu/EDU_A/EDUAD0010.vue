<!--
  화면명 : 협력사 안전교육 기성/마감 등록
  화면개요 : 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from "@hiway/stores/logs"
import { commonSearchApi, getCodeList, commonExecuteApi, commonExecuteApi2 } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EDUAD0010Pop01 from '@/pages/60_edu/EDU_A/EDUAD0010Pop01.vue'
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import Message from "@hiway/utils/notify"
import dayjs from 'dayjs'

defineOptions({
  name:'60_edu-EDU_A-EDUAD0010',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const menuTitle = ref(null)
const closeTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const userStore = useUserStore()
const closeDte = ref(null)
const eDUAD0010Pop01 = ref(null)
const eDUAB0030Tab01Pop02Pop01 = ref(null)

//콤보모델 리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS: [],
  DEPT: [],
  ASGN: [],
  DIVISION: [],
  CLOSE_YN: [{ TXT: '전체', COD: '' }, { TXT: '마감 완료', COD: 'Y' }, { TXT: '마감 미완료', COD: 'N' }],
  CURR_ID: [],
  BSNS_C: [],
  DEPT_C: [],
  BASE_COST: [],
})

//조회 저장등 v-model 리스트
const paramList = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  DIVISION: '',
  CURR_ID: '',
  BSNS_CD_C: '',
  DEPT_CD_C: '',
  CLOSE_YYYYMM: dayjs().format("YYYY-MM"),
  CLOSE_YN: '',
  CLOSE_DTE: dayjs().format("YYYY-MM"),
  DATE_FR: dayjs().add(1 - dayjs().day(), 'day').format("YYYY-MM-DD"),
  DATE_TO: dayjs().add(-1, 'day').format("YYYY-MM-DD"),
  BASE_COST: '',
  BTN_CLOSE_YN: 'N',
  USE_DIV: 'Y',
})

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, checkBar: { visible: true }, header: { height : 45 } },
  keys : ['BSNS_NM', 'ORGN_CD', 'REG_NO'],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, editable: false, width: '100' },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, styleName: 'left-column', editable: false, width: '100' },
    { fieldName: 'ORGN_CD', dataType: 'text', header: { text: t('부서코드') }, editable: false, width: '60' },
    { fieldName: 'COMP_NM', dataType: 'text', header: { text: t('협력사명') }, styleName: 'left-column', editable: false, width: '120' },
    { fieldName: 'REG_NO', dataType: 'text', header: { text: t('사업자번호') }, editable: false, width: '120' },
    { fieldName: 'OWNER_NM', dataType: 'text', header: { text: t('대표자') }, editable: false, width: '60' },
    { fieldName: 'TERM_YN', dataType: 'text', header: { text: t('계약종료') }, editable: false, width: '40' },
    { fieldName: 'EDU_USER_CNT', dataType: 'number', header: { text: t('교육  인원수') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '48' },
    { fieldName: 'EDU_HOUR', dataType: 'number', header: { text: t('이수시간') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '40' },
    { fieldName: 'TOT_COST', dataType: 'number', header: { text: t('금액') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '100' },
    { fieldName: 'CHANGEABLE', dataType: 'text', header: { text: t('부서변경가능여부') }, editable: false, width: '60' },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD') }, visible: false },
    { fieldName: 'COMPANY', dataType: 'text', header: { text: t('COMPANY') }, visible: false },
    { fieldName: 'YYYYMM', dataType: 'text', header: { text: t('YYYYMM') }, visible: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('REMARK') }, visible: false },
    { fieldName: 'DATE_FR', dataType: 'text', header: { text: t('DATE_FR') }, visible: false },
    { fieldName: 'DATE_TO', dataType: 'text', header: { text: t('DATE_TO') }, visible: false },
    { fieldName: 'BASE_COST', dataType: 'text', header: { text: t('BASE_COST') }, visible: false },
    { fieldName: 'BSNS_CD_C', dataType: 'text', header: { text: t('BSNS_CD_C') }, visible: false },
    { fieldName: 'DEPT_CD_C', dataType: 'text', header: { text: t('DEPT_CD_C') }, visible: false },
  ],
  columns : [],
})

//그리드2 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { stateBar: { visible: false }, header: { height : 45 } },
  keys : [],
  fields : [ 
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('교육명') }, styleName: 'left-column', editable: false, width: '150' },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('일자') }, editable: false, width: '140' },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사번') }, editable: false, width: '80' },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('성명') }, editable: false, width: '60' },
    { fieldName: 'EDU_HOUR', dataType: 'number', header: { text: t('이수시간') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '30' },
    { fieldName: 'LUNCH_CNT', dataType: 'number', header: { text: t('중식횟수') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '30' },
    { fieldName: 'TOT_COST', dataType: 'number', header: { text: t('금액') }, styleName: 'right-column',numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" }, editable: false, width: '80' },
    { fieldName: 'VEND_CLOSE_KEY', dataType: 'text', header: { text: t('마감') }, editable: false, width: '60' },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

//콤보박스 설정
const initCombo = () => {
  //담당 가능 과목, 강의 이력 데이터 바인딩
  Promise.all([
    getCodeList('HHID140','HHI','N','0',null,'Y'),
    getCodeList('HHIZ000'),
    getCodeList('HHID010'),
  ]).then(res => { 
    codeList.BASE_COST = res[0].ORESULT_CUR
    paramList.BASE_COST = codeList.BASE_COST[0].CODE_DESC1
    codeList.CMPNY_DIV = res[1].ORESULT_CUR
    codeList.DIVISION = res[2].ORESULT_CUR
    codeList.DIVISION.unshift({ COD: '', TXT: '전체' })
  })
  //사업부 설정
  setBsnsCombo()

  //부서 설정
  setDeptMainCombo()
  setDeptAsgnCombo()

  //협력사 설정
  setAsgnCombo()

  codeList.CURR_ID.push({ COD: '', TXT: '전체' })
}

//사업부 설정
const setBsnsCombo = () =>{
  codeList.BSNS = []
  codeList.BSNS_C = []
  codeList.DEPT = []
  codeList.DEPT_C = []
  codeList.ASGN = [{ COD : '', TXT : '전체' }]
  codeList.BSNS.push({ BSNS_CD: '', BSNS_NM: '전체'  })
  codeList.BSNS_C.push({ BSNS_CD: '', BSNS_NM: '전체'  })
  commonSearchApi({ queryId : 'searchBSNS', param: paramList }).then(res => {
    res.ORESULT_CUR.forEach(element => {
      codeList.BSNS.push(element)
      codeList.BSNS_C.push(element)
    })
  })
}

//부서 설정
const setDeptMainCombo = () =>{ 
  let initTotal = { DEPT_CD: '', DEPT_NM: '전체'  }
  let paramDept = {
    CMPNY_DIV : paramList.CMPNY_DIV,
    BSNS_CD : '',
    USE_DIV : paramList.USE_DIV,
  }
  
  codeList.DEPT = []
  codeList.DEPT.push(initTotal)    
  paramDept.BSNS_CD = paramList.BSNS_CD    
  
  commonSearchApi({ queryId : 'searchDept3', param: paramDept }).then(res => {
    res.ORESULT_CUR.forEach(element => {
      codeList.DEPT.push(element)  
    })
  })
  
}

const setDeptAsgnCombo = () =>{ 
  let initTotal = { DEPT_CD: '', DEPT_NM: '전체'  }
  let paramDept = {
    CMPNY_DIV : paramList.CMPNY_DIV,
    BSNS_CD : '',
    USE_DIV : paramList.USE_DIV,
  }
  codeList.DEPT_C = []
  codeList.DEPT_C.push(initTotal)
  paramDept.BSNS_CD = paramList.BSNS_CD_C

  commonSearchApi({ queryId : 'searchDept3', param: paramDept }).then(res => {
    res.ORESULT_CUR.forEach(element => {     
      codeList.DEPT_C.push(element)
    })
  })
}

//협력사 설정
const setAsgnCombo = () =>{
  codeList.ASGN = [{ ASGN_CD : '', ASGN_NM : '전체' }]
  commonSearchApi({ queryId : 'searchTeam', param: paramList }).then(res => {
    res.ORESULT_CUR.forEach(element => {
      codeList.ASGN.push(element)
    })
  })
}

//회사구분 변경 이벤트
const updateCmpnyDiv = () =>{
  paramList.BSNS_CD = ''
  paramList.DEPT_CD = ''
  paramList.BSNS_CD_C = ''
  paramList.DEPT_CD_C = ''
  paramList.ASGN_CD = ''
  setBsnsCombo()
}

//사업부 변경 이벤트
const updateBsns = () =>{
  paramList.DEPT_CD = ''
  paramList.ASGN_CD = ''
  setDeptMainCombo()
  gridRefresh()
}

//부서 변경 이벤트
const updateDept = () =>{
  paramList.ASGN_CD = ''
  setAsgnCombo()
  gridRefresh()
}

//분류 변경 이벤트
const updateDivision = () =>{
  codeList.CURR_ID = []
  paramList.CURR_ID = ''
  commonSearchApi({ queryId : 'EDUAD0010_SEARCH_05', param: paramList }).then(res => {
    codeList.CURR_ID.push({ COD: '', TXT: '전체' })
    res.ORESULT_CUR.forEach(element => {
      codeList.CURR_ID.push(element)
    })
  })
  gridRefresh()
}

//협력사 사업부 변경 이벤트
const updateBsnsc = () =>{  
  paramList.DEPT_CD_C = ''
  setDeptAsgnCombo()
}

//상세정보 조회
const cellClickMain = (grid, data) => {
  if(data.cellType === 'check') return
  grdSubSelect(data.dataRow)
}

//상세정보 DB 조회
const grdSubSelect = rowIdx => {
  if(rowIdx != null){
    let row =  grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let parameter = {
      CMPNY_DIV 		:  row.CMPNY_DIV,
      BSNS_CD 			:  row.BSNS_CD,
      DEPT_CD 			:  row.ORGN_CD,
      ASGN_CD 			:  row.ASGN_CD,
      REG_NO 			  :  row.REG_NO,
      DATE_FR 			:  paramList.DATE_FR.replaceAll('-', ''),
      DATE_TO 			:  paramList.DATE_TO.replaceAll('-', ''),
      DIVISION 		  :  paramList.DIVISION,
      CURR_ID 			:  paramList.CURR_ID,
      CLOSE_YN 		  :  paramList.CLOSE_YN,
      CLOSE_DTE 		:  paramList.CLOSE_DTE.replaceAll('-', ''),
    }

    commonSearchApi({ queryId : 'EDUAD0010_SEARCH_03', param: parameter }).then(res =>{
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

//조회 전 유효성 및 사전준비
const beforeSearch = () => {
  if(grdSub.value.getDataProvider().rowCount > 0){ grdSub.value.getDataProvider().clearRows() }
  
  return true
}

//조회 실행
const searchMainData = id => {
  
  let params = {
    CMPNY_DIV   : paramList.CMPNY_DIV,
    BSNS_CD 	  : paramList.BSNS_CD,
    DEPT_CD 	  : paramList.DEPT_CD,
    ASGN_CD 	  : paramList.ASGN_CD,
    DATE_FR 	  : paramList.DATE_FR.replaceAll('-', ''),
    DATE_TO  	  : paramList.DATE_TO.replaceAll('-', ''),
    YYYYMM   	  : paramList.CLOSE_YYYYMM.replaceAll('-', ''),
    DIVISION    : paramList.DIVISION,
    CURR_ID 	  : paramList.CURR_ID,
    CLOSE_YN    : paramList.CLOSE_YN,
    CLOSE_DTE   : paramList.CLOSE_DTE.replaceAll('-', ''),
  }
  
  return commonSearchApi({ queryId : 'EDUAD0010_SEARCH_02', param: params })
}

//조회 후
const afterMainSearch = res => {
  console.log("메인 조회 후 레스",res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  if(res.ORESULT_CUR != null) { 
    grdMain.value.getGridView().setCurrent({ dataRow: 0, fieldIndex: 1 })
    grdSubSelect(grdMain.value.getGridView().getCurrent().dataRow)
  }
  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    var ret = {}
    var TERM_YN = grid.getValue(item.index, "TERM_YN")
    if(TERM_YN === 'Y'){
      ret.style = { background:"#FF3232" }
    }
    // res.ORESULT_CUR.forEach(val => {
    //   console.log("발확인 @@@@@ >>>>>> ",val)
    //   var TERM_YN = val.TERM_YN
    //   if(TERM_YN === 'Y'){
    //     ret.style = { background:"#FFBB00" }
    //   }
    // })
    return ret 
  })
}

//조회 버튼 클릭
const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchMainData)
      .setAfter(afterMainSearch)
      .run()    
  }
  else{
    
  }
}

//마감 데이터 확인
const closeValidationChk = () =>{
  if(paramList.BSNS_CD != '' || paramList.DEPT_CD != '' || paramList.ASGN_CD != '' ){    
    Message.warn(t('사업부, 부서, 협력사를 모두 전체로 조회 후 마감처리 바랍니다.'))

    return false
  }
  else if(paramList.DIVISION != '' || paramList.CURR_ID != ''){
    Message.warn(t('분류, 교육명을 모두 전체로 조회 후 마감처리 바랍니다.'))
    
    return false
  }
  else if(grdMain.value.getDataProvider().rowCount === 0){
    Message.warn(t('조회 후 마감 해 주시기 바랍니다.'))
    
    return false
  }
  else if(grdMain.value.getGridView().getCheckedRows(true).length === 0){
    Message.warn(t('마감할 항목을 체크 해 주세요.'))
    
    return false
  }

  return true
}

//마감 저장
const saveMainData = () => {
  let saveRows = grdMain.value.getGridView().getCheckedRows(true)
  if(saveRows.length === 0) return

  let saveList = []
  let yyyymm = paramList.CLOSE_YYYYMM.replaceAll('-', '')
  for(let i = 0; i < saveRows.length; i++){
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(saveRows[i])
    grdJsonRow.USER_ID = userStore.userId
    grdJsonRow.YYYYMM = yyyymm
    saveList.push(grdJsonRow)
  }  
  
  return commonExecuteApi({ queryId : 'EDUAD0010_SAVE_01', list: saveList })
}

//저장 후 조회
const afterCloseSave = () =>{
  onButtonsClick({ id : 'btnSearch' })
  if(grdSub.value.getDataProvider().rowCount > 0){ grdSub.value.getDataProvider().clearRows() }
  setCloseBtnStatus()
}

//마감
const onClickButtonClose = () => {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid : grdMain, row : 'check' }])
    .setGridList([grdMain])
    .setBefore(closeValidationChk)
    .setQuery(saveMainData)
    .setAfter(afterCloseSave)
    .run()
}

//마감 취소
const deleteMainData = () => {
  let delParams = {
    CMPNY_DIV : paramList.CMPNY_DIV,
    YYYYMM : paramList.CLOSE_YYYYMM.replaceAll('-', ''),
    USER_ID : userStore.userId,
  }

  return commonExecuteApi({ queryId : 'EDUAD0010_DELETE_01', list: [delParams] })
}

//마감 취소 후 알림 및 조회
const afterCloseDelete = () =>{
  Message.warn(t('마감취소가 완료되었습니다. 협력사지원시스템(SCMS)내 기성데이터는 별도 삭제하셔야 합니다.'))
  onButtonsClick({ id : 'btnSearch' })
  if(grdSub.value.getDataProvider().rowCount > 0){ grdSub.value.getDataProvider().clearRows() }
  setCloseBtnStatus()
}

//마감취소
const onClickButtonCloseCancel = () => {
  new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setConfirmMessage('마감취소 시 ' + paramList.CLOSE_YYYYMM + ' 마감 건 전체 취소됩니다. 진행하시겠습니까?')
    .setQuery(deleteMainData)
    .setAfter(afterCloseDelete)
    .run() 
}


//마감이력 팝업
const onClickButtonCloseHist = () => {
  eDUAD0010Pop01.value.openPopup({
  })
}

//마감 데이터 확인
const changeValidationChk = () =>{
  if(grdMain.value.getGridView().getCheckedRows(true).length === 0){
    Message.warn(t('부서 변경할 항목을 체크 해 주세요.'))
    
    return false
  }
  if(paramList.BSNS_CD_C === ''){
    Message.warn(t('변경할 사업부를 선택해 주세요.'))
    
    return false
  }
  if(paramList.DEPT_CD_C === ''){
    Message.warn(t('변경할 부서를 선택해 주세요.'))
    
    return false
  }

  return true
}

//마감 저장
const saveChangeData = () => {
  let saveRows = grdMain.value.getGridView().getCheckedRows(true)
  if(saveRows.length === 0) return

  let saveList = []
  for(let i = 0; i < saveRows.length; i++){
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(saveRows[i])
    grdJsonRow.BSNS_CD_C = paramList.BSNS_CD_C
    grdJsonRow.DEPT_CD_C = paramList.DEPT_CD_C
    grdJsonRow.USER_ID = userStore.userId
    saveList.push(grdJsonRow)
  }  

  return commonExecuteApi({ queryId : 'EDUAD0010_SAVE_03', list: saveList })
}

//마감 전체 버튼
const onClickButtonCloseList = btn =>{
  if(btn.id === 'btnSaveClose'){
    onClickButtonClose()
  }else if (btn.id === 'btnCancelClose'){
    onClickButtonCloseCancel()
  }else {
    onClickButtonCloseHist()
  }
}

//저장 후 조회
const afterChangeSave = () =>{
  onButtonsClick({ id : 'btnSearch' })
}

//부서 변경
const onClickButtonDeptChange = () => {
  let deptNmC = ''
  codeList.DEPT_C.forEach(element => {
    if(element.DEPT_CD === paramList.DEPT_CD_C){
      deptNmC = element.DEPT_NM
    }
  })

  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid : grdMain, row : null }])
    .setGridList([grdMain])
    .setBefore(changeValidationChk)
    .setConfirmMessage('주의!! 체크 된 항목의 부서를 ' + deptNmC + '로 변경합니다. 변경된 부서는 복구가 안됩니다.\n계속 진행하시겠습니까?')
    .setQuery(saveChangeData)
    .setAfter(afterChangeSave)
    .run()
}

//마감버튼 상태 확인 함수
const setCloseBtnStatus = () => {
  let parameter = {
    CMPNY_DIV : paramList.CMPNY_DIV,
    YYYY : paramList.CLOSE_YYYYMM.substring(0, 4),
    YYYYMM : paramList.CLOSE_YYYYMM.replaceAll('-', ''),
  }
  commonSearchApi({ queryId : 'EDUAD0010_SEARCH_01', param: parameter }).then(res => {
    if(res.ORESULT_CUR != null){
      if(res.ORESULT_CUR.length > 0){
        closeTitle.value.disableBtn('btnSaveClose', true)
        closeTitle.value.disableBtn('btnCancelClose', false)
      }
      else{
        closeTitle.value.disableBtn('btnSaveClose', false)
        closeTitle.value.disableBtn('btnCancelClose', true)
      }
    }
  })
}

//로우 더블 클릭시 발생하는 이벤트
const cellDbClick = (grid, data) => {
  let row =  grdSub.value.getDataProvider().getJsonRow(data.dataRow)
  if(row === null) return
  eDUAB0030Tab01Pop02Pop01.value.openPopup({
    CREATE_YN : 'N',
    EDU_DATE : row.EDU_DATE, 
    CON_DIV : '',   
    EDUTIME_SERIAL : '',    
    CMPNY_DIV  : paramList.CMPNY_DIV,  
    YEAR : row.YEAR,  
    SCHEDULE_ID : row.SCHEDULE_ID,    
    CURR_ID : '',
    EDU_DATE : row.EDU_DATE,    
    SAVE_YN : 'N',
  })
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
}


onMounted(() => {
  vm.$nextTick(() => {
    initCombo() 
    grdMain.value.getGridView().footer.visible = true
    grdSub.value.getGridView().footer.visible = true
    setCloseBtnStatus() 
  })  
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title>
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
      <!-- 조회조건 -->
      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex mb-2">
              <i-select
                :label="$t('회사구분')"
                labelWidth="52px"
                width="300px"
                v-model="paramList.CMPNY_DIV"
                :items="codeList.CMPNY_DIV"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="updateCmpnyDiv"
              />
              <i-select
                :label="$t('사업부')"
                labelWidth="39px"
                width="300px"
                v-model="paramList.BSNS_CD"
                :items="codeList.BSNS"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                @update:modelValue="updateBsns"
              />
              <i-select
                :label="$t('부서')"
                labelWidth="39px"
                width="300px"
                v-model="paramList.DEPT_CD"
                :items="codeList.DEPT"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
                @update:modelValue="updateDept"
              />
              <i-select
                :label="$t('협력사')"
                labelWidth="52px"
                width="300px"
                v-model="paramList.ASGN_CD"
                :items="codeList.ASGN"
                item-value="ASGN_CD"
                item-title="ASGN_NM"
                @update:modelValue="gridRefresh"
              />
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('교육기간')"
                labelWidth="52px"
                width="210px"
                class="ma-0 mr-3"
                v-model="paramList.DATE_FR"
                type="Date"
                @update:modelValue="gridRefresh"
              />
              <i-input
                :label="$t('~')"
                labelWidth="13px"
                width="171px"
                v-model="paramList.DATE_TO"
                type="Date"
                @update:modelValue="gridRefresh"
              />
              <i-select
                :label="$t('분류')"
                labelWidth="26px"
                width="207px"
                v-model="paramList.DIVISION"
                :items="codeList.DIVISION"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="updateDivision"
              />
              <i-select
                :label="$t('교육명')"
                labelWidth="39px"
                width="300px"
                v-model="paramList.CURR_ID"
                :items="codeList.CURR_ID"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="gridRefresh"
              />
              <i-select
                :label="$t('마감종류')"
                labelWidth="52px"
                width="300px"
                v-model="paramList.CLOSE_YN"
                :items="codeList.CLOSE_YN"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="gridRefresh"
              />
              <i-input
                width="200px"
                v-model="paramList.CLOSE_DTE"
                type="month"
                :readonly="paramList.CLOSE_YN != 'Y'"
                @update:modelValue="gridRefresh"
              />
            </div>
          </v-sheet>
          <v-sheet  class="d-flex">
            <div class="searchArea mr-2 d-flex" style="width:50%; justify-content:space-between">
              <div class="d-flex">
                <ILabel
                  :label="$t('협력사 부서변경')"
                  label-width="170"
                />
                <i-select
                  :label="$t('사업부')"
                  labelWidth="39px"
                  width="300px"
                  v-model="paramList.BSNS_CD_C"
                  :items="codeList.BSNS_C"
                  item-value="BSNS_CD"
                  item-title="BSNS_NM"
                  @update:modelValue="updateBsnsc"
                />
                <i-select
                  :label="$t('부서')"
                  labelWidth="26px"
                  width="300px"
                  v-model="paramList.DEPT_CD_C"
                  :items="codeList.DEPT_C"
                  item-value="DEPT_CD"
                  item-title="DEPT_NM"
                  @update:modelValue="gridRefresh"
                />
              </div>
              <IGridTitle
                class="ma-0"
                :use-permission="false"
                :button-list="['btnAsgnChange']"
                @click-button="onClickButtonDeptChange"
              />
            </div>
            <div class="searchArea d-flex" style="width:50%; justify-content: space-between;">
              <i-input
                :label="$t('마감기준월')"
                labelWidth="65px"
                width="230px"
                v-model="paramList.CLOSE_YYYYMM"
                type="month"
                @update:modelValue="setCloseBtnStatus"
              />
              <IGridTitle
                class="ma-0"
                ref="closeTitle"
                :use-permission="false"
                :button-list="['btnSaveClose', 'btnCancelClose', 'btnCloseHistory']"
                @click-button="onClickButtonCloseList"
              />
            </div>
          </v-sheet>
          <v-sheet class="d-flex" height="70%">
            <div class="mr-2" style="width:50%;">
              <IGridTitle :title="$t('■ 협력사 리스트')">
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMain"
                class="mt-2"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellClicked ="cellClickMain"
              />
            </div>
            <div class="flex-column" style="width:50%">
              <div class="d-flex" style="justify-content: space-between;">
                <div>
                  <IGridTitle :title="$t('■ 교육이수 리스트')" class="ma-0">
                    <template #editors />
                  </IGridTitle>
                </div>
                <div>
                  <VLabel 
                    :text="$t('수당기준 :' + paramList.BASE_COST.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',') + '원')"
                  />
                </div>
              </div>
              <RealGrid
                ref="grdSub"
                class="mt-2"
                :grid-view-option="grdSubProps.gridViewOption"
                :keys="grdSubProps.keys" 
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns"
                @onCellDblClicked ="cellDbClick"
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    <EDUAD0010Pop01
      ref="eDUAD0010Pop01"
    />
    <EDUAB0030Tab01Pop02Pop01
      ref="eDUAB0030Tab01Pop02Pop01"
    />
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>