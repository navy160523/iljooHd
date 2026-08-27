<!--
  화면명 : 장비자격증 재발급 신청 및 출력
  화면개요 : 장비자격증 재발급 신청 또는 자격증을 출력할 수 있는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonExecuteApi2 } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUBA0010Popup_01 from '@/pages/60_edu/EDU_B/EDUBA0010Pop01.vue'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import _ from 'lodash'

defineOptions({
  name: '60_edu-EDU_B-EDUBA0030',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const searchArea = ref(null)
let BSNS_NM = ref(null)
let DEPT_NM = ref(null) 
const eDUBA0010Popup_01 = ref(null)
const gridLock = ref(0) //그리드 조회시
const firstLock = ref(0)
const fileUploadPopup = ref(null) //파일 업로드 팝업
const fieldIndex = ref(null)
const fieldName = reactive('FILE_ID')

const printEMP_NO = ref('')
const picFronts = reactive({})  //자격증 앞면 이미지
const picBacks = reactive({})   //자격증 뒷면 이미지
const picIds = reactive({})     //사원 이미지
const userStats = reactive({})  //사원 정보
const licGetDts = reactive({})  //자격증 취득 일자
const licKindsNm = reactive({}) //자격 종류

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const printParams = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

const setPrint = () => {
  reportName.value = reportName.value
  printParams.value = [
    "IN_CMPNY_DIV="+userStore.cmpnyDiv,        // 회사구분
    "IN_EMP_NO="+printEMP_NO.value,            // 사번
  ]
}

// #1 END ------------------------------------------------------

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD : '',   //사업부
  DEPT_CD : '',   //부서
  ORGN_DIV : '',  //소속구분
  GBN : '',       //자격종류
  EMP_NO : '',    //사번
  EMP_NM : '',    //성명
  RREQ_YN : '',   //신청중
  REQ_DIV_NM : '',//신청구분
})

//자격종류별 보유자 현황
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  keys : ['CMPNY_DIV', 'ORGN_DIV', 'EMP_NO', 'EMP_NM', 'JOB_TIT_NM', 'EMP_NM', 'REQ_DT', 'CONFIRM_DT', 'ISSUE_DT'],
  fields : [
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('소속') }, styleName: 'left-column', editable: false },
    { fieldName: 'ORGN_DIV', dataType: 'text',  header: { text: t('소속구분') },lookupDisplay: true,
      editor: { type: 'list' }, editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('사원명') }, editable: false },
    { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직여부') }, editable: false },
    { fieldName: 'REQ_DIV_NM', dataType: 'text', header: { text: t('신청구분') }, editable: false },
    { fieldName: 'LIC_KIND_NM', dataType: 'text', header: { text: t('자격종류') }, editable: false },
    { fieldName: 'REQ_DT', dataType: 'text', header: { text: t('신청일') }, editable: false,
      'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null } },
    { fieldName: 'CONFIRM_DT', dataType: 'text', header: { text: t('확정일') }, editable: false,
      'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null } },
    { fieldName: 'ISSUE_DT', dataType: 'text', header: { text: t('출력일') }, editable: false,
      'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null } },
    { fieldName: 'REQ_REASON', dataType: 'text', header: { text: t('재발급사유'), styleName: 'header_validit' }, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, styleName: 'editable_column' },
    { fieldName: 'FILE_ID_YN', dataType: 'text', header: { text: t('사유서 첨부') }, editable: false,
      button:"action", buttonVisibility: "always", styleName: 'editable_column' },
    { fieldName: 'REISSUE_DESC', dataType: 'text', width: '120', header: { text: t('비고(재발급사유)') }, editor: { maxLength: 100 }, styleName: ' editable_column-left' },
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('진행상태') }, editable: false ,lookupDisplay: true,
      editor: { type: 'list' }, editable: false },
    { fieldName: 'REJECT_DESC', dataType: 'text', header: { text: t('반려사유') }, styleName: 'left-column', editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'REQ_SEQ', dataType: 'text', header: { text: t('REQ_SEQ') }, editable: false, visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('FILE_ID') }, editable: false, visible: false },
    { fieldName: 'REQ_DIV', dataType: 'text', header: { text: t('REQ_DIV') }, editable: false, visible: false },

  ],
  columns: [],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields

const codeList = reactive({
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  orgnDiv : [], //소속구분
  gbn : [],     //자격종류
  reqDivNm : [],//신청구분
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
    getCodeList('HHID210'), //소속구분
    getCodeList('HHID240'), //자격종류
    getCodeList('HHID230'), //재발급사유
    getCodeList('HHIF320'), //진행상태
  ]).then(res => {
    //사업부 데이터 세팅
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    let findIndex = res[0].ORESULT_CUR.findIndex(item => item.BSNS_CD === userStore.bsnsCd)
    searchParams.BSNS_CD = res[0].ORESULT_CUR[findIndex].BSNS_CD

    //부서 데이터 세팅
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

    //소속구분 데이터 세팅
    codeList.orgnDiv = res[2].ORESULT_CUR
    codeList.orgnDiv.unshift({ TXT: "전체", COD: "" })
    searchParams.ORGN_DIV = codeList.orgnDiv[0].COD

    //자격종류 데이터 세팅
    codeList.gbn = res[3].ORESULT_CUR
    searchParams.GBN = codeList.gbn[0].COD

    //신청구분 데이터 세팅(하드코딩)
    codeList.reqDivNm.push({ TXT: '전체', COD: '' }, { TXT: '신규', COD: 'NW' }, { TXT: '재발급', COD: 'R' })

    //소속 구분 컬럼 데이터 바인딩
    grdMain.value.setBindingColumn("ORGN_DIV", res[2].ORESULT_CUR, "COD", "TXT")

    //재발급사유 컬럼 데이터 바인딩
    grdMain.value.setBindingColumn("REQ_REASON", res[4].ORESULT_CUR, "COD", "TXT")

    //진행상태 컬럼 데이터 바인딩
    grdMain.value.setBindingColumn("STATUS", res[5].ORESULT_CUR, "COD", "TXT")


  })
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  searchParams.DEPT_CD = ''
  if(newValue === ''){
    codeList.deptCd = []
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    
    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

      if(firstLock.value === 0){
        let findIndex = res.ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
        searchParams.DEPT_CD = res.ORESULT_CUR[findIndex].DEPT_CD
        firstLock.value = 1
      } else {
        searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
      }
    }).finally(() => {
      // if(firstLock.value === 1){
      //   onButtonsClick({ id : 'btnSearch' })
      //   firstLock.value = 2
      // }
      gridRefresh()
    })
})


//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {//조회
  gridRefresh()
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }

  // } else if(btn.id === 'btnPrint'){
  //   showOz.value = true
  // }
}

//
const btnMainGrd = btn => {
  if( btn.id === 'btnReissueReq'){
    new saveFlowHelper(vm, t)
      .setConfirmMessage('재발급 신청하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }else if(btn.id === 'btnReqCancel'){
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('신청 취소하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .showMessage(false)
      .run()
  }else if(btn.id === 'btnLicePrint'){
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    if(checkedRows.length < 1){
      Message.warn(t('자격증을 출력할 데이터를 선택해 주세요.'))
      return
    }
    setPrintForm()
  }else if(btn.id === 'btnLossFileForm'){
    let params = {
      PATH : 'Excel',
      FILE_PATH: 'EDU_B',
      FILE_NAME: '분실사유서.xlsx',  
    }
    commonSampleDownFilesApi(params)
  }
}

//자격증 출력 데이터 가공 이벤트
const setPrintForm = () => {
  if(searchParams.GBN === 'N'){
    reportName.value = '/manage/hse/EDUBA0030.ozr'
  }
  else{
    reportName.value = '/manage/hse/EDUBA0031.ozr'
  }
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    let checkedParams = []
    for(let i = 0; i < checkedRows.length; i++ ){
      checkedParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
      if(checkedParams[i].STATUS !== '20'){
        Message.warn(t('진행상태가 안전확정인 데이터만 출력 가능합니다.'))
        return
      }
      printEMP_NO.value += grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).EMP_NO + ';'
    }
    printEMP_NO.value = printEMP_NO.value.slice(0, -1)
    
    setPrint()
    showOz.value = true
  printEMP_NO.value = ''
}


//퇴사자 포함 체크 및 체크 해제 시 발생 이벤트
const RREQ_YNChkYn = () => {
  gridRefresh()
  onButtonsClick({ id : 'btnSearch' })
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().setAllCheck(false)
}

//사유서 첨부 컬럼의 버튼 클릭 이벤트
const buttonClicked = (grid, index, fixed) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  fieldIndex.value = index.dataRow
  if(data.REQ_REASON !== 'R3'){
    Message.warn(t('사유서 첨부는 재발급사유가 분실일 경우 가능합니다.'))

    return
  }
  fileUploadPopup.value.openPopup(data["FILE_ID"])
}

const uploaded = val => {
  if(val.fileId){
    grdMain.value.getDataProvider().setValue(fieldIndex.value, 'FILE_ID_YN', 'Y')  
  }
  grdMain.value.getDataProvider().setValue(fieldIndex.value, fieldName, val.fileId)
}

const editRowChange = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  grdMain.value.getGridView().checkRow(dataRow, true)
  let data = grdMain.value.getDataProvider().getJsonRow(dataRow)
  grid.commit()
  if(field === 11 && newValue === 'R3'){  
    if(data.FILE_ID !== null){
      grdMain.value.getDataProvider().setValue(dataRow, 'FILE_ID_YN', 'Y')
    }else {
      grdMain.value.getDataProvider().setValue(dataRow, 'FILE_ID_YN', 'N')
    }
  }else {
    grdMain.value.getDataProvider().setValue(dataRow, 'FILE_ID_YN', '')
  }
}

//사번 유효성 검사
const requiredEMP_NO = val => {
  const regex = /^[a-zA-Z0-9]*$/;
  if(!regex.test(val)){
    searchParams.EMP_NO = searchParams.EMP_NO.slice(0, -1)
  }
}

//성명 유효성 검사
const requiredEMP_NM = val => {
  const regex = /^[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]*$/;
  if(!regex.test(val)){
    searchParams.EMP_NM = searchParams.EMP_NM.slice(0, -1)
  }
}

//널 체크 이벤트
const isNullCheck = data => {
return (data === undefined || data === null || data === '') ? true : false
}

// 2024.02.14 류원진 ozreport8.html 에서 메세지 전달 하는 내용을 받아서 다시 상위로 메세지 전달
const receiveMsgFromParent = (e) => {
  // 여기서 e.data.params 0=정상출력, 1=정상출력 아님
  // 정상출력일때 출력일 등록
  // 발급일자 업데이트
  let checkedData = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for(let i = 0; i < checkedRows.length; i++){
    checkedData.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    // 2024.07.29 박용훈 쿼리 가져올때 수순한 REQ_DIV 값 가져 오도록 수정
    //checkedData[i].REQ_DIV = grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).REQ_REASON
    checkedData[i].REQ_EMP_NO = grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).EMP_NO
    checkedData[i].USER_ID = userStore.userId
  }

  console.log("체크된 데이터들",checkedData)
  //
  if(e.data.params[0] === '0'){
    commonExecuteApi({ queryId : 'EDUBA0040_SAVE_03', list: checkedData }).then(() => {
      onButtonsClick({ id : 'btnSearch' })
    })
  }
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
// 조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

// 리스트 조회
const searchData = () => {
  console.log("조회조건 확인",searchParams)
  return commonSearchApi({ queryId : 'EDUBA0030_SEARCH_01', param: searchParams })
}


// 리스트 조회 후
const afterSearch = res => {
  //재발급사유가 분실이 아닐경우 사유서 첨부 YN 숨김
  res.ORESULT_CUR.forEach(val => {
    if(val.REQ_REASON !== 'R3'){
      val.FILE_ID_YN = ''
    }
  })
  console.log("조회된 데이터 확인",res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


//*****************************************조회 영역(종료)***********************************************************/
//*******************************************저장 영역***********************************************************/
//저장 전 유효성 검사
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    return false
  }
  for(let i = 0; i < checkedRows.length; i++){
    let data = grdMain.value.getDataProvider().getJsonRow(checkedRows[i])
    if(data.REQ_REASON === null){
      Message.warn(t('재발급사유를 선택해 주세요.'))
      return false
    }
    if(data.REQ_REASON === 'R1' && (data.REISSUE_DESC === null || data.REISSUE_DESC === '')){
      Message.warn(t('재발급사유(소속변경) : 비고(재발급사유)를 작성해 주세요.'))
      return false
    }else if(data.REQ_REASON === 'R3' && data.FILE_ID === null){
      Message.warn(t('재발급사유(분실) : 사유서를 첨부해 주세요.'))
      return false
    }
    if(!isNullCheck(data.STATUS)){
      Message.warn(t('이미 신청 완료된 데이터 입니다.'))
      return false
    }
  }
  return true
}

//저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for(let i = 0; i < checkedRows.length; i++){
    saveParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    saveParams[i].USER_ID = userStore.userId
    saveParams[i].SAVE_YN = 'Y'
  }
  return commonExecuteApi({ queryId : 'EDUBA0030_SAVE_01', list: saveParams })
}

//저장 후
const afterSave = () => {
  grdMain.value.getGridView().setAllCheck(false)
  onButtonsClick({ id : 'btnSearch' })
}

//*****************************************저장 영역(종료)***********************************************************/

//******************************************신청취소 영역***********************************************************/
//신청취소 전 유효성 검사
const beforeDelete = () => {
  let result = true
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let deleteData = []
  checkedRows.forEach(val => {
    deleteData.push(grdMain.value.getDataProvider().getJsonRow(val))
  })
  if(checkedRows.length === 0){
    Message.warn(t('취소할 데이터를 선택해 주세요.'))

    result = false
  }
  deleteData.forEach(val => {
    if(val.STATUS === null){
      Message.warn(t('신청되지 않은 데이터는 신청취소할 수 없습니다.'))
      result = false

    }else if(val.STATUS === '20' || val.STATUS === '30'){
      Message.warn(t('확정된 데이터는 취소할 수 없습니다.'))
      result = false
    }
  })
  return result
}

//신청취소
const deleteData = () => {
  let checkedRowIndex = grdMain.value.getGridView().getCheckedRows()
  var deleteParams =[]
  for(let i = 0; i < checkedRowIndex.length; i++){
    deleteParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRowIndex[i]))
  }
  return commonExecuteApi({ queryId : 'EDUBA0030_DELETE_01', list: deleteParams })
}

//신청취소 후
const afterDelete = () => {
  grdMain.value.getGridView().setAllCheck(false)
  Message.success(t('신청 취소되었습니다.'))
  onButtonsClick({ id : 'btnSearch' })
}

//*****************************************신청취소 영역(종료)********************************************************/

onMounted( () => {
  initCodeList()
  onButtonsClick({ id : 'btnSearch' })

  // 2024.02.14 류원진 ozreport8.html 에서 메세지 전달 하는 내용을 받아서 다시 상위로 메세지 전달
  window.addEventListener('message', receiveMsgFromParent)
})
</script>

<template>
  <v-card class="pa-0 fill-height">
      <!-- 타이틀 -->    
      <v-card-title class="pa-3 pb-0">    
            <IMenuTitle
              ref="menuTitle"
              :title="$t(useLogsStore().menuId)"
              :button-list="['btnSearch']"
              @click-button="onButtonsClick"
            />
        <!-- 조회조건 -->
      </v-card-title>
        <v-card-text class="pa-3 pt-0 content-area" >
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <div class=d-flex>
                <i-select
                  :label="$t('사업부')"
                    width="300px"
                    v-model="searchParams.BSNS_CD"
                    :items="codeList.bsnsCd"
                    item-title="BSNS_NM"
                    item-value="BSNS_CD"
                    @update:model-value="gridRefresh"
                  />
                  <i-select
                    :label="$t('부서')"
                    width="300px"
                    v-model="searchParams.DEPT_CD"
                    :items="codeList.deptCd"
                    item-title="DEPT_NM"
                    item-value="DEPT_CD"
                    @update:model-value="gridRefresh"
                  />
                  <i-select
                    :label="$t('소속구분')"
                    width="200px"
                    v-model="searchParams.ORGN_DIV"
                    :items="codeList.orgnDiv"
                    item-title="TXT"
                    item-value="COD"
                    @update:model-value="gridRefresh"
                  />
                  <i-select
                    :label="$t('자격종류')"
                    width="300px"
                    v-model="searchParams.GBN"
                    :items="codeList.gbn"
                    item-title="TXT"
                    item-value="COD"
                    @update:model-value="gridRefresh"
                  />
                  <v-checkbox 
                    v-model="searchParams.RREQ_YN"
                    label="신청중"
                    false-value="N"
                    true-value="Y"
                    @update:model-value="RREQ_YNChkYn"
                  />
              </div>
              <div class="d-flex mt-2">
                <i-input
                  :label="$t('사ㅤ번')"
                  width="200px"
                  v-model="searchParams.EMP_NO"
                  :rules="[requiredEMP_NO]"
                  maxlength="20"
                  @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
                  @update:model-value="gridRefresh"
                />
                <i-input
                  :label="$t('성명')"
                  width="200px"
                  v-model="searchParams.EMP_NM"
                  :rules="[requiredEMP_NM]"
                  maxlength="500"
                  @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
                  @update:model-value="gridRefresh"
                />
                <i-select
                  :label="$t('신청구분')"
                  width="200px"
                  v-model="searchParams.REQ_DIV_NM"
                  :items="codeList.reqDivNm"
                  item-title="TXT"
                  item-value="COD"
                  @update:model-value="gridRefresh"
                /> 
              </div>
            </v-sheet>
            <div style="height:80%">
            <!-- 메인그리드 -->
              <IGridTitle 
                :button-list="['btnReissueReq', 'btnReqCancel', 'btnLicePrint', 'btnLossFileForm']"
                @click-button="btnMainGrd"
              >
                <template #editors />
              </IGridTitle> 
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellButtonClicked ="buttonClicked"
                @onEditRowChanged="editRowChange"
              />
            </div>
          </div>
        </v-card-text> 
    <!-- OZReport -->
    <OZReport :showPop="showOz" :reportName="reportName" :params="printParams" @close="showOz = $event" />
    <!-- 부서/ 협력사 팝업 -->
    <EDUBA0010Popup_01
      ref="eDUBA0010Popup_01"
    />

    <!-- 첨부파일 관리 -->
    <IUploadPopup 
      ref="fileUploadPopup" 
      @uploaded="uploaded" 
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
  
