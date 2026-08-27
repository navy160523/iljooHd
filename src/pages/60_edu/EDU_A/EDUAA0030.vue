<!--
  화면명 : 안전교육장 관리
  화면개요 : 안전교육장 관리 조회 추가 저장 하는 화면
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
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

defineOptions({
  name: '60_edu-EDU_A-EDUAA0030',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const searchArea = ref(null)
const equipList = reactive([])
let clickedRowIndex = ''
let openCheck = reactive({})

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  EPLACE_ORGNNM : '',
  EPLACE_ORGN: '',
  EPLACE_NM : '',
})


//코드 리스트 세팅
const codeList = ref({
  YN: [                     //삭제, 퇴직 여부
    { TXT: 'Y', COD: 'Y' },
    { TXT: 'N', COD: 'N' },
  ],

})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, display: { selectionStyle : 'block' }, stateBar: { visible:false } }, 
  keys : ['EPLACE_ID'],
  fields : [ 
    { fieldName: 'EPLACE_NM', dataType: 'text'
      , header: { text: t('교육장 명'), styleName: 'header_validit' }
      // , header: {
      //   template: "${headerText}<img src='/src/assets/images/required.png'width='15' height='15'>",
      //   values: { "headerText":t('교육장 명')}}
      , required: true,
      requiredMessage: '교육장 명은 필수입니다.', styleName: 'left-column editable_column' },
    { fieldName: 'EPLACE_ORGN', dataType: 'text'
      , header: { text: t('관리부서 코드'), styleName: 'header_validit' }
      // , header: {
      //   template: "${headerText}<img src='/src/assets/images/required.png'width='15' height='15'>",
      //   values: { "headerText":t('관리부서 코드')}}
      , editable:false , required: true,
      requiredMessage: '관리부서 코드는 필수입니다.' },
    { fieldName: 'EPLACE_ORGNNM', dataType: 'text'
      , header: { text: t('관리부서명'), styleName: 'header_validit' }
      // , header: {
      //   template: "${headerText}<img src='/src/assets/images/required.png'width='15' height='15'>",
      //   values: { "headerText":t('관리부서명')}}
      , editable:false, lookupDisplay: true,
      button:"action", buttonVisibility: "always", required: true, requiredMessage: '관리부서 명은 필수입니다.', styleName: 'left-column editable_column' },
    { fieldName: 'EPLACE_ADDRESS', dataType: 'text'
      , header: { text: t('교육장 장소'), styleName: 'header_validit' }
      // , header: {
      //   template: "${headerText}<img src='/src/assets/images/required.png'width='15' height='15'>",
      //   values: { "headerText":t('교육장 장소')}}
      , required: true,
      requiredMessage: '교육장 장소는 필수입니다.', styleName: 'left-column editable_column' },
    { fieldName: 'EPLACE_TEL', dataType: 'text', header: { text: t('교육장 연락처') }, styleName: 'editable_column', 
      editor: { type: "line", ignoreCharacters: "ㄱ-힣A-Za-z", maxLength: 15} },
    { fieldName: 'EPLACE_EQUIP', dataType: 'text', header: { text: t('교육가능장비') },lookupDisplay: true,
      editor: { type: 'checklist', textReadOnly: true, dropDownWhenClick: true }, styleName: 'left-column editable_column' },
    { fieldName: 'EPLACE_NUM', dataType: 'text', header: { text: t('가능인원(명)') }, 
      editor: { type: "line", ignoreCharacters: "ㄱ-힣A-Za-z", maxLength: 15 }, styleName: 'right-column editable_column' },
    { fieldName: 'MANAGE_YN', dataType: 'text', header: { text: t('사용현황 관리대상 여부') },lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, visible:false },
    { fieldName: 'MEDIA_YN', dataType: 'text', header: { text: t('VR교육장 여부') }, lookupDisplay: true , styleName: 'editable_column',
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    // 2024.08.07 박용훈 추가
    { fieldName: 'EPLACE_DIV', dataType: 'text', header: { text: t('할당된 교육장 여부') },},
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, styleName: 'left-column editable_column' },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false, header: { text: t('비고') } },
    { fieldName: 'EPLACE_ID', dataType: 'text', visible:false, header: { text: t('비고') } },
    { fieldName: 'SAVE_YN', dataType: 'text', visible:false, header: { text: t('비고') } },
  ],
  columns: [],
  columnLayout: [
    'EPLACE_NM',
    {
      name: '부서',
      direction: 'horizontal',
      items: [ 'EPLACE_ORGN', 'EPLACE_ORGNNM' ],
      header: { text: t('부서') },
    },
    'EPLACE_ADDRESS',
    'EPLACE_TEL',
    'EPLACE_EQUIP',
    'EPLACE_NUM',
    'MANAGE_YN',
    'MEDIA_YN',
    // 2024.08.07 박용훈 추가
    'EPLACE_DIV',
    'REMARK',
  ]
})

// 그리드 세팅
grdMainProps.columns = grdMainProps.fields

getCodeList('HHID170').then(res => {
  equipList.value = res.ORESULT_CUR
  grdMain.value.setBindingColumn("EPLACE_EQUIP", equipList.value, "COD", "TXT")
  grdMain.value.setBindingColumn("MANAGE_YN", codeList.value.YN, "COD", "TXT")
  grdMain.value.setBindingColumn("MEDIA_YN", codeList.value.YN, "COD", "TXT")
})



//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {       //조회
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnCreate') {  //추가
    let newRow = {
      CMPNY_DIV: searchParams.CMPNY_DIV, //회사구분
      USER_ID: userStore.userId,         //유저ID
    }
    grdMain.value.addRow(newRow)
  }
  else if(btn.id === 'btnUpdate'){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id === 'btnDelete'){    //삭제
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

//관리부서 조회 팝업 오픈
const openDeptPopup = (data) => {
  openCheck = data
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv, 
    ASGN_NM : searchParams.EPLACE_ORGNNM,
    HSE_SYS : 'N',
  })
}

//관리부서 팝업에서 선택한 데이터 바인딩
const onDeptSelected = item => {
  if(openCheck === 'column'){
    grdMain.value.getDataProvider().setValue(clickedRowIndex, 'EPLACE_ORGN', item.DEPT_CD)
    grdMain.value.getDataProvider().setValue(clickedRowIndex, 'EPLACE_ORGNNM', item.ASGN_SHRT_NM)
    grdMain.value.getGridView().checkRow(clickedRowIndex)
  } else if(openCheck === 'search'){
    searchParams.EPLACE_ORGNNM = item.ASGN_SHRT_NM
    searchParams.EPLACE_ORGN = item.ASGN_CD
    onButtonsClick({ id : 'btnSearch' })
  }
}

//관리부서 컬럼의 버튼 클릭 이벤트
const buttonClicked = (grid, item, fixed) => {
  clickedRowIndex = item.dataRow

  openDeptPopup('column')
}

//그리드 초기화 이벤트
const gridRefresh = (data) => {
  if(data === 'EPLACE_ORGNNM'){
    searchParams.EPLACE_ORGN = ''
  }
  grdMain.value.getDataProvider().setRows([])
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//조회
const searchData = idx => {
  console.log("조회 파람 확인 :::: >>>>", searchParams)
  return commonSearchApi({ queryId : 'EDUAA0030_SEARCH_01', param: searchParams })
}

//조회 후
const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//*****************************************조회 영역(종료)***********************************************************/

//********************************************저장 영역****************************************************************/

//저장 전 유효성 검사
const beforeSave = () => {
  let saveParams = []
  let result = true
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    result = false
  }
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  saveParams.forEach(val => {
    if(!val.EPLACE_ADDRESS || !val.EPLACE_NM || !val.EPLACE_ORGN){
      Message.warn(t('교육장 명, 관리부서, 교육장 장소는 필수 입력입니다.'))
      result = false

    }
  })

  return result
}

//저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  
  for(let i = 0; i < checkedRows.length; i++){
    let data = grdMain.value.getDataProvider().getJsonRow(checkedRows[i])
    saveParams.push(data)
    saveParams[i].USER_ID = userStore.userId
  }

  return commonExecuteApi({ queryId : 'EDUAA0030_SAVE_01', list: saveParams })
}

const afterSave = () => {
  commonSearchApi({ queryId : 'EDUAA0030_SEARCH_01', param: searchParams }).then(res => {
    if(res.ORESULT_CUR.length > 0){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}

//*******************************************저장 영역(종료)***********************************************************/

//********************************************삭제 영역****************************************************************/

//삭제 전
const beforeDelete = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(!checkedRows){
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  } else {return true}
}

//삭제
const deleteData = () => {
  let deleteParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }

  return commonExecuteApi({ queryId : 'EDUAA0030_DELETE_01', list: deleteParams })
}

const afterDelete = () => {
  commonSearchApi({ queryId : 'EDUAA0030_SEARCH_01', param: searchParams }).then(res => {
    if(res.ORESULT_CUR.length > 0){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}
//*******************************************삭제 영역(종료)***********************************************************/
onMounted(() => {
  onButtonsClick({ id:'btnSearch' })
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
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
      다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input 
            :label="$t('관리부서')"
            v-model="searchParams.EPLACE_ORGNNM"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openDeptPopup('search')"
            @keydown.enter="e => {openDeptPopup('search')}"
            @update:modelValue="gridRefresh('EPLACE_ORGNNM')"
            labelWidth="52px"
            width="250px"
          />
          <i-input
            v-model="searchParams.EPLACE_ORGN"
            readonly
            width="150px"
          />
          <i-input
            :label="$t('안전교육장 명')"
            @keydown.enter=" e => { onButtonsClick({id:'btnSearch'}) }"
            v-model="searchParams.EPLACE_NM"
            @update:modelValue="gridRefresh('')"
            labelWidth="85px"
            width="300px"
          />
        </v-sheet>
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                  만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        <v-sheet height="90%" class="mb-2">
        <!-- 메인그리드 -->
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellButtonClicked ="buttonClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  <DeptPopup ref="deptPopup" @selected="onDeptSelected" /> 
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
  
