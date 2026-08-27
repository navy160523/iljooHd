<!--
  화면명 : 교육대상 그룹 등록
  화면개요 : 교육대상 그룹 등록 조회 추가 저장 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopupMultiDept.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IButtonList from '@/components/IButtonList.vue'

defineOptions({
  name: '60_edu-EDU_A-EDUAA0040',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
//const searchArea = ref(null)
const empPopup = ref(null) //인원 조회 POP
const randNum = ref(null)
var grdMainData = ''
let groupId = ''
const saveParams2= ref([])

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  BSNS_CD : userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: userStore.asgnCd,
  USER_DIV: userStore.userDiv,
  GROUP_NM: '',
  // CMPNY_DIV : 'HHI',
  // BSNS_CD : 'AX00',
  // DEPT_CD: 'XBS0',
  // ASGN_CD: 'XBS1',
  //USER_DIV: 'A',
  GROUP_ID: '',
  
})

//메인 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [ 
    { fieldName: 'GROUP_ID', dataType: 'text', header: { text: t('그룹 ID') }, editable:false, visible:false, styleName: 'left-column' },
    { fieldName: 'GROUP_NM', dataType: 'text', header: { text: t('그룹명') }, styleName: 'editable_column left-column',
      required: true, requiredMessage: '그룹명은 필수입니다.', editor: { maxLength: 50 } },
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('수정자명') }, editable: false },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('수정시각') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false, header: { text: t('회사구분') } },
    { fieldName: 'SAVE_YN', dataType: 'text', visible:false, header: { text: t('저장여부') } },
    { fieldName: 'ASGN_CD', dataType: 'text', visible:false, header: { text: t('조직(작성자)') } },
    { fieldName: 'BSNS_CD', dataType: 'text', visible:false, header: { text: t('조직(작성자)') } },

    
    
  ],
  columns: [],
})

//디테일 그리드 세팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar : { visible:false } }, 
  fields : [ 
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, styleName: 'left-column',editable:false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable:false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable:false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번/ID') }, required: true,
      requiredMessage: '사용자 ID는 필수입니다.', editable:false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('이름') }, editable:false },
    { fieldName: 'BIRTH_DAY', dataType: 'text', header: { text: t('생년월일') }, editable:false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'number', numberFormat: "#,##0", header: { text: t('차수') },
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 3 }, styleName: 'editable_column' },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false, header: { text: t('회사구분') } },
    { fieldName: 'GROUP_ID', dataType: 'text',visible:false, header: { text: t('그룹 ID') } },
    { fieldName: 'ASGN_CD', dataType: 'text', visible:false, header: { text: t('소속코드') }, editable:false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', visible:false, header: { text: t('직위코드') }, editable:false }, 
    { fieldName: 'SAVE_YN', dataType: 'text', visible:false, header: { text: t('저장여부') } },
    // 2024.08.26 박용훈 컬럼 추가
    { fieldName: 'BSNS_CD', dataType: 'text', visible:false, header: { text: t('저장여부') } },
    { fieldName: 'DEPT_CD', dataType: 'text', visible:false, header: { text: t('저장여부') } },
    // { fieldName: 'SAVE_YN', dataType: 'text', visible:false, header: { text: t('저장여부') } },
    // { fieldName: 'SAVE_YN', dataType: 'text', visible:false, header: { text: t('저장여부') } },
    // { fieldName: 'SAVE_YN', dataType: 'text', visible:false, header: { text: t('저장여부') } },
  ],
  columns: [],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields



//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = () => {      //조회
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    //.setSearchArea(searchArea)
    .setBefore(beforeSearch)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(false)
    .run()
}

//그룹 목록 리스트 버튼 이벤트
const onMainButtonsClick = btn => {
  if(btn.id === 'btnGroupCreate'){
    let newRow = {
      CMPNY_DIV: searchParams.CMPNY_DIV, //회사구분
      USER_ID: userStore.userId,         //유저ID
    }
    grdMain.value.addRow(newRow)
  }else if(btn.id === 'btnGroupUpdate'){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }else if(btn.id === 'btnGroupDelete'){
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

//그룹 대상자 리스트 버튼 이벤트
const onSubButtonsClick = btn => {
  if(btn.id === 'btnPersonCreate'){
    if(grdMainData === 'Y'){
      empPopup.value.openPopup({ MULTI:true })
    } else {
      Message.warn(t('그룹이 존재하지 않습니다. 먼저 그룹 목록 데이터를 저장해 주세요.'))
    }
  }else if(btn.id === 'btnUpdate'){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeSubSave)
      .setQuery(saveSubData)
      .setAfter(afterSubSave)
      .run()
  }else if(btn.id === 'btnDelete'){
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeSubDelete)
      .setQuery(deleteSubData)
      .setAfter(afterSubDelete)
      .run()
  } else if (btn.id === 'btnExcelUpload') {
    const input = document.createElement('input')
    if(grdMainData !== 'Y'){
      Message.warn(t('그룹이 존재하지 않습니다. 먼저 그룹 목록 데이터를 저장해 주세요.'))

      return
    }
    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]

      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()

  } else if(btn.id === 'btnSampleDown'){
    let params = {
      FILE_PATH: 'DB',
      FILE_NAME: 'DB1031.xlsx',  
    }
    commonSampleDownFilesApi(params)
  }
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {
  var mappedData = excelData.map(item => {
    return {
      ASGN_CD: item.부서코드,
      ASGN_NM: item.부서명,
      EMP_NO: item.사번,
      KOR_NM: item.이름,
      EDUTIME_SERIAL: item.차수,
    }
  })
  for(let i = 0; i < mappedData.length; i++){
    grdSub.value.addRow(mappedData[i])
  }

  vm.$swal({
    title: t('데이터 저장 시, 등록된 사용자 ID에 따라 \n소속, 직위, 직책, 이름, 생년월일이 \n자동으로 저장됩니다.'),
    showCancelButton:false,
  }) 
}


//강사명을 선택했을 때 실행되는 이벤트
const onEmpSelected = row => {
  let getGrdData = []
  getGrdData.push(grdSub.value.getDataProvider().getRows())
  row.forEach(item => {
    for(let i = 0; i < getGrdData[0].length; i++){
      if(getGrdData[0][i][3] == item.EMP_NO){
        return
      }
    }
    grdSub.value.addRow(item)
  })
}

//그룹 목록 로우 변경 이벤트
const rowChanged = async (grid, oldIdx, newIdx) => {
  if(newIdx === -1){
    return
  }
  let rowData = await grdMain.value.getDataProvider().getJsonRow(newIdx)

  console.log('rowData :',rowData)


  if(!rowData.GROUP_ID || rowData.SAVE_YN !== 'Y'){
    grdSub.value.getDataProvider().setRows([])
    grdMainData = 'N'
    groupId = ''

    return
  }

  searchParams.GROUP_ID = rowData.GROUP_ID

  // 2024.07.25 박용훈 선택한 데이터의 asgn/bsns 가 입력 되도록 수정
  searchParams.ASGN_CD = rowData.ASGN_CD
  searchParams.BSNS_CD = rowData.BSNS_CD

  groupId = rowData.GROUP_ID
  grdMainData = 'Y'
  grdSubSearch()

}

//그룹 대상자 리스트 조회
const grdSubSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData2)
    .setAfter(afterSearch2)
    .run()
}

//차수 유효성 검사
const inputNum = (data) => {
  randNum.value = randNum.value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}]/g, '')
}

//랜덤차수 버튼 이벤트
const btnRandNum = () => {
  var numList = []
  var chkNum = grdSub.value.getGridView().getCheckedRows(true)
  if(chkNum.length === 0){
    Message.warn(t('차수를 변경할 인원을 선택해 주십시오.'))
  }
  for(let i = 0; i < chkNum.length; i++){
    
    numList.push(Math.floor(Math.random() * randNum.value))
    grdSub.value.getDataProvider().setValue(chkNum[i], "EDUTIME_SERIAL", numList[i] + 1)
  }
}

//그룹 ID 랜덤 생성
const create_UUID = () => {
  let dt = new Date().getTime()

  return "xxxxxxxx-xxxx-4xxx-y".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

//차수 유효성 검사
const editRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {  
  grdSub.value.getGridView().checkItem(dataRow, true)
  if(field == 6 && newValue == 0){
    grdSub.value.getDataProvider().setValue(dataRow, "EDUTIME_SERIAL", null)
    Message.warn(t('0은 차수로 사용할 수 없습니다.'))
  }
  grid.commit()
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
}
//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//그룹 목록 조회
const searchData = idx => {
  return commonSearchApi({ queryId : 'EDUAA0040_SEARCH_01', param: searchParams })
}


//그룹 목록 조회 후
const afterSearch = res => {
  if(res.ORESULT_CUR.length === 0){
    grdSub.value.getDataProvider().setRows([])
  }
  
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain.value.getGridView().setAllCheck(false)
  grdSub.value.getGridView().setAllCheck(false)
}

//그룹 대상자 조회
const searchData2 = idx => {
  return commonSearchApi({ queryId : 'EDUAA0040_SEARCH_02', param: searchParams })
}


//그룹 대상사 조회 후
const afterSearch2 = res => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역**************************************************************/
//그룹 목록 저장 전 유효성 검사
const beforeSave = () => {
  let result = true
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    result = false
  }

  return result
}

//그룹 목록 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for(let i = 0; i < checkedRows.length; i++){
    saveParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    saveParams[i].BSNS_CD = userStore.bsnsCd
    saveParams[i].DEPT_CD = userStore.deptCd
    saveParams[i].ASGN_CD = userStore.asgnCd
    saveParams[i].USER_ID = userStore.userId
    if(saveParams[i].SAVE_YN !== 'Y'){
      saveParams[i].GROUP_ID = create_UUID()
    }
  }

  return commonExecuteApi({ queryId : 'EDUAA0040_SAVE_01', list: saveParams })
}

//그룹 목록 저장 후
const afterSave = () => {
  grdMain.value.getGridView().setAllCheck(false)
  commonSearchApi({ queryId : 'EDUAA0040_SEARCH_01', param: searchParams }).then(res => {
    grdMain.value.getDataProvider().setRows([])
    if(res.ORESULT_CUR.length > 0){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}

//그룹 대상자 리스트 저장 전 유효성 검사
const beforeSubSave = () => {
  let result = true
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    result = false
  }

  var checkedList = []
  for(let i = 0; i < checkedRows.length; i++){
    checkedList.push(grdSub.value.getDataProvider().getJsonRow(checkedRows[i]))
    if(checkedList[i].EDUTIME_SERIAL){
      if(checkedList[i].EDUTIME_SERIAL.length > 3){
        Message.warn(t('차수는 3자리 이하로 입력해 주세요.'))
        result = false
      }
    }
  }

  return result
}

//그룹 대상자 리스트 저장
const saveSubData = () => {
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++){
    saveParams.push(grdSub.value.getDataProvider().getJsonRow(checkedRows[i]))
    
    //저장시 그룹목록에 클릭한 목록에 해당하는 회사, 사업부, 부서, 소석 코드 세팅
    saveParams[i].CMPNY_DIV = searchParams.CMPNY_DIV
    saveParams[i].BSNS_CD = searchParams.BSNS_CD
    saveParams[i].DEPT_CD = searchParams.DEPT_CD
    saveParams[i].ASGN_CD = searchParams.ASGN_CD
    saveParams[i].USER_ID = userStore.userId
    saveParams[i].GROUP_ID = groupId

    console.log("저장 파라메트", saveParams[i])
  }
  
  return commonExecuteApi({ queryId : 'EDUAA0040_SAVE_02', list: saveParams })
}

//그룹 대상자 리스트 저장 후
const afterSubSave = () => {
  grdSub.value.getGridView().setAllCheck(false)
  commonSearchApi({ queryId : 'EDUAA0040_SEARCH_02', param: searchParams }).then(res => {
    grdSub.value.getDataProvider().setRows([])
    if(res.ORESULT_CUR.length > 0){
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}

//*****************************************저장 영역(종료)***********************************************************/
//********************************************삭제 영역*************************************************************//
//그룹 목록 삭제전 유효성 검사
const beforeDelete = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))

    return false
  }
  
  return true
}

//그룹 목록 삭제
const deleteData = () => {
  let checkedRowIndex = grdMain.value.getGridView().getCheckedRows()
  var deleteParams =[]
  for(let i = 0; i < checkedRowIndex.length; i++){
    deleteParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRowIndex[i]))
  }
  for(let i = 0; i < deleteParams.length; i++){
    deleteParams[i].BSNS_CD = userStore.bsnsCd
    deleteParams[i].DEPT_CD = userStore.deptCd
    deleteParams[i].ASGN_CD = userStore.asgnCd
    deleteParams[i].USER_ID = userStore.userId
  }

  return commonExecuteApi({ queryId : 'EDUAA0040_DELETE_01', list: deleteParams })
}

//그룹 목록 삭제 후
const afterDelete = () => {
  grdMain.value.getGridView().setAllCheck(false)
  commonSearchApi({ queryId : 'EDUAA0040_SEARCH_01', param: searchParams }).then(res => {
    grdMain.value.getDataProvider().setRows([])
    if(res.ORESULT_CUR.length > 0){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}

//그룹 대상자 삭제전 유효성 검사
// 2024.08.26 박용훈 삭제 변경
// const beforeSubDelete = () => {
const beforeSubDelete = async value => {
  // let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  // if(checkedRows.length === 0){
  //   Message.warn(t('삭제할 데이터를 선택해 주세요.'))

  //   return false
  // }
  
  // return true
  let chekedRow = ref([])
  let bCheck = true
  chekedRow = await grdSub.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams2.value = []
  let data = ref([])

  chekedRow.forEach(val => {
    data = grdSub.value.getDataProvider().getJsonRow(val)
    data.UPDATE_USER_ID = userStore.userId // 수정자
    saveParams2.value.push(data)
  })
  //console.log("저장 파라메트", saveParams.value)
  return bCheck
}

//그룹 대상자 과목 삭제
const deleteSubData = () => {
  // 2024.08.26 박용훈 삭제 변경
  // let checkedRowIndex = grdSub.value.getGridView().getCheckedRows()
  // var deleteParams =[]
  // for(let i = 0; i < checkedRowIndex.length; i++){
  //   deleteParams.push(grdSub.value.getDataProvider().getJsonRow(checkedRowIndex[i]))
  // }
  // for(let i = 0; i < deleteParams.length; i++){
  //   deleteParams[i].BSNS_CD = userStore.bsnsCd
  //   deleteParams[i].DEPT_CD = userStore.deptCd
  //   deleteParams[i].ASGN_CD = userStore.asgnCd
  //   deleteParams[i].USER_ID = userStore.userId
  //   deleteParams[i].GROUP_ID = groupId
  // }

  // return commonExecuteApi({ queryId : 'EDUAA0040_DELETE_02', list: deleteParams })
  return commonExecuteApi({ queryId : 'EDUAA0040_DELETE_02', list: saveParams2.value })
}

//그룹 대상자 과목 삭제 후
const afterSubDelete = () => {
  grdSub.value.getGridView().setAllCheck(false)
  commonSearchApi({ queryId : 'EDUAA0040_SEARCH_02', param: searchParams }).then(res => {
    grdSub.value.getDataProvider().setRows([])
    if(res.ORESULT_CUR.length > 0){
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}


//********************************************삭제 영역(종료)**********************************************************//
onMounted(() => {
  onButtonsClick()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
        타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('그룹명')"
            v-model="searchParams.GROUP_NM"
            @keydown.enter="() => onButtonsClick()"
            width="250px"
            @update:model-value="gridRefresh"
          />
        </v-sheet>
        <!-- 메인그리드 -->
        <div class="h-grow">
          <v-sheet width="30%" class="h-auto mr-3">
            <IGridTitle 
              :title="$t('그룹 목록')"
              :button-list="['btnGroupCreate', 'btnGroupUpdate', 'btnGroupDelete']"
              @click-button="onMainButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCurrentRowChanged="rowChanged"
            />
          </v-sheet>
          <v-sheet width="70%" class="pa-0 h-auto">
            <div class="d-flex justify-space-between mB-5">
              <!-- 그리드 타읻틀쪽에 추가 동작 작업을 추가 하기 위해서 
              <div class="d-flex"> -> <div class="d-flex justify-space-between mB-5"> 해야하고
              <IGridTitle 에는 class="mb-0 mr-2 h-grow" 를 추가 해야 한다.
              -->
              <IGridTitle class="mb-0 mr-2 h-grow"
                :title="$t('그룹 대상자 리스트')"
                :button-list="['btnPersonCreate', 'btnUpdate', 'btnDelete', 'btnExcelUpload', 'btnSampleDown']"
                @click-button="onSubButtonsClick"
              >
                <template #editors />
              </IGridTitle>
              <v-sheet class="d-flex justify-end" width="240px">
                <!-- 변수입력(차수)와 버튼(랜덤차수)를 하나로 묶어서 화면 끝으로 보낼때
                v-sheet를 이용하여 class="d-flex justify-end" width="240px" 넣고
                i-input에 마진을 0으로 준다 -->
                <i-input
                  :label="$t('차수')"
                  v-model="randNum"
                  maxlength="3"
                  oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}]/, '' );"
                  @input="inputNum"
                  width="150px"
                  margin="0px"
                />
                <IButtonList
                  :button-list="['btnRandomNum']"
                  @click-button="btnRandNum"
                />
              </v-sheet>
            </div>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              @onEditRowChanged="editRowChanged"
            />
          </v-sheet>
        </div>
      </div>
   </v-card-text>
  <EmpPopup ref="empPopup" @selected="onEmpSelected" />
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
