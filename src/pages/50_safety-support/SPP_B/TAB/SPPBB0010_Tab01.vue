<!--
  화면명 : 건축물 기본 정보
  화면개요 : 건축물 기본 정보 관리 화면
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import ILabel from '@/components/ILabel.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import SPPBB0010_TAB01Popup from '@/pages/50_safety-support/SPP_B/TAB/SPPBB0010_Tab01_Popup.vue'
import OZReport from '@/components/OZReport.vue';

// 변수 선언
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const exPanVal = ref(0)
const grdMain = ref(null)
const grdSub = ref(null)
const fileUploadPopup = ref(null)
const Popup = ref(null)
const selectedRow = ref(0)
const reportName = ref('/manage/hse/SPPBB0010_01.ozr');
const reportParam = ref([]);
const showOz = ref(false)

// 첨부파일 버튼 리스트
const buttonList = reactive(['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose'])

// 드롭다운 코드 리스트
const codeList = reactive({
  BSNS_CD : [],
  BSNS_CD_custom:[],
  BSNS_NM_custom:[],
})

// 검색조건 저장
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
})

const subSearchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  BUILDING_NO: '',
})

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true }, footer: { visible:true }},
  keys : [],
  fields : [ 
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, width : '100', styleName: 'editable_column', lookupDisplay: true, editor: { type: 'dropdown' } },
    { fieldName: 'BUILDING_NAME', dataType: 'text', header: { text: t('건물명') }, styleName: 'left-column editable_column', width : '120' } ,
    { fieldName: 'DONG_NAME', dataType: 'text', header: { text: t('동명') }, styleName: 'editable_column', width : '30' },
    { fieldName: 'COMPANY_NAME', dataType: 'text', header: { text: t('회사명') }, styleName: 'left-column', editable: false, width: '80',
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },
    { fieldName: 'USE_APP_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('사용승인일') }, width : '50', styleName: 'editable_column',
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      } 
    },
    { fieldName: 'ADDRESS', dataType: 'text', header: { text: t('주소') }, styleName: 'left-column', width : '200', editable: false },
    { fieldName: 'STRUCTURE', dataType: 'text', header: { text: t('주구조') }, styleName: 'left-column editable_column', width : '60' },
    { fieldName: 'ROOF', dataType: 'text', header: { text: t('지붕') }, styleName: 'left-column editable_column', width : '60', footer: { styleName: 'right-column', text: '총 합계 : ' }, },
    { fieldName: 'BUILDING_AREA', dataType: 'number', width: '40', header: { text: t('건축면적') }, styleName: 'right-column editable_column', footer: { numberFormat: '#.##',expression: 'sum' }, },
    { fieldName: 'FLOOR_AREA', dataType: 'number', width: '40', header: { text: t('연면적') }, styleName: 'right-column editable_column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'HEIGHT', dataType: 'number', width: '40', header: { text: t('높이') }, styleName: 'right-column editable_column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'FILE_INSERT_DATE', dataType: 'text', width: '30', header: { text: t('건축물대장') }, editable: false,
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },

    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '103', header: { text: t('회사구분') }, styleName: 'left-column', width : '60', visible : false },
    { fieldName: 'BSNS_NM', dataType: 'text', width: '103', header: { text: t('사업부명') }, styleName: 'left-column', width : '60', visible : false },
    { fieldName: 'PRT_APP_DATE', dataType: 'text', width: '120', header: { text: t('PRT_APP_DATE') }, styleName: 'left-column', width : '100' , visible : false },
    { fieldName: 'ATTACH_KEY', dataType: 'text', width: '120', header: { text: t('ATTACH_KEY') }, styleName: 'left-column', width : '100', visible : false },
    { fieldName: 'COMPANY_NO', dataType: 'text', width: '120', header: { text: t('COMPANY_NO') }, styleName: 'left-column', width : '100', visible : false },
    { fieldName: 'BUILDING_NO', dataType: 'text', width: '120', header: { text: t('BUILDING_NO') }, styleName: 'left-column', width : '100', visible : false },
  ],
  columns : [],
})

//그리드 속성셋팅_sub
const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true }, footer: { visible:true } },
  keys : [],
  fields : [
    { fieldName: 'FLOOR_NO', dataType: 'text', width: '80', header: { text: t('해당층') }, styleName: 'editable_column' },
    { fieldName: 'SORT', dataType: 'text', width: '40',header: { text: t('순서') }, styleName: 'editable_column right-column', footer: { styleName: 'right-column', text: '합계 : ' } },
    { fieldName: 'FLOOR_AREA', dataType: 'number', width: '60', header: { text: t('층별면적') }, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'PURPOSE', dataType: 'text', width: '120', header: { text: t('용도') }, styleName: 'editable_column left-column' },
    { fieldName: 'STRUCTURE', dataType: 'text', width: '80', header: { text: t('구조') }, editable: true,styleName: 'editable_column left-column' },
    { fieldName: 'REMARKS', dataType: 'text', width: '200', header: { text: t('비고') }, editable: true, styleName: 'editable_column left-column' },

    // 저장, 삭제시 필요 데이터
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장구분') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ') }, visible: false },
    { fieldName: 'BUILDING_NO', dataType: 'text', header: { text: t('BUILDING_NO') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const initCodeList = () => {
  commonSearchApi({
    queryId: 'searchBSNS',
    param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
  }).then(res => {
    codeList.BSNS_CD = res.ORESULT_CUR;
  }).finally(() => {
    grdMain.value.setBindingColumn('BSNS_CD', codeList.BSNS_CD, 'BSNS_CD', 'BSNS_NM')  
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD:'' })
    searchData()
  })
}

const parsingDate = (date) => {
  if(date == null) return ''
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2) // 월은 0부터 시작하므로 1을 더하고, 두 자리로 표현하기 위해 slice 사용
  var day = ('0' + date.getDate()).slice(-2) // 일도 두 자리로 표현하기 위해 slice 사용

  return '' + year + month + day
}

// 상단 버튼 클릭
const onButtonsClick = (btn) => {
  //'btnCreate', 'btnUpdate', 'btnDelete'
  if(btn.id === 'btnSearch') {  
    grdMain.value.getDataProvider().setRows([])
    searchData()
  }else if(btn.id === 'btnCreate') {
    if(searchParams.BSNS_CD == '') {
      Message.warn(t('사업본부는 필수 입력사항입니다.'))
      return
    }
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: searchParams.BSNS_CD,
      BUILDING_NAME: '',
      DONG_NAME: '',
      COMPANY_NAME: '',
      PRT_APP_DATE: '',
      ADDRESS: '',
      STRUCTURE: '',
      ROOF: '',
      BUILDING_AREA: '',
      FLOOR_AREA: '',
      HEIGHT: '',
      FILE_INSERT_DATE: '',
      USE_APP_DATE: '',
      ATTACH_KEY: '',
      COMPANY_NO: '',
      BUILDING_NO: '',
    })
  }else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()

  }else if(btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setConfirmMessage('삭제시 데이터 베이스에서도 바로 삭제됩니다. 진행하시겠습니까?')
    .setQuery(deleteMainData)
    .setAfter(afterDelete)
    .run()
  }else if(btn.id === 'btnPrint') {
    print()
  }
}  

//출력 관련 로직 시작
const print = () => {
  if(subSearchParams.CMPNY_DIV == '' && subSearchParams.BSNS_CD == '' && subSearchParams.BUILDING_NO == '') {
    Message.warn(t('건물을 선택해 주십시오.'))
    return
  }
  showOz.value = true
}

const onSubButtonsClick = (btn) => {
  if(subSearchParams.CMPNY_DIV == '' || subSearchParams.BUILDING_NO == '' || subSearchParams.BSNS_CD == '') {
    return Message.warn(t('건물을 선택해 주십시오.'))
  }

  if(btn.id === 'btnSearch') {
    searchSub()
  }else if(btn.id === 'btnCreate') {
    grdSub.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: subSearchParams.BSNS_CD,
      SEQ: '',
      SORT: '',
      FLOOR_NO: '',
      FLOOR_AREA: '',
      PURPOSE: '',
      STRUCTURE: '',
      REMARKS: '',      
      BUILDING_NO: subSearchParams.BUILDING_NO,
    })
  }else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeSubSave)
      .setQuery(saveSubData)
      .setAfter(() => {
        onSubButtonsClick({ id: 'btnSearch' })
      })
      .run()

  }else if(btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdSub, row: 'check' }])
    .setGridList([grdSub])
    .setConfirmMessage('삭제시 데이터 베이스에서도 바로 삭제됩니다. 진행하시겠습니까?')
    .setQuery(deleteSubData)
    .setAfter(afterSubDelete)
    .run()
  }
}

// 저장 전
const beforeSubSave = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  if(checkedRows.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  } 
  return true
}

// 저장
const saveSubData = () => {
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    if(data.CMPNY_DIV == '') data.CMPNY_DIV = userStore.cmpnyDiv
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB01_SAVE_02', list: saveParams })
}

// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (!data.BSNS_CD) {
      return Message.warn(t('사업부분을 입력해주세요.'))
    }
  }
  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.CMPNY_DIV == '') data.CMPNY_DIV = userStore.cmpnyDiv
    data.USE_APP_DATE = parsingDate(data.USE_APP_DATE)
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB01_SAVE_01', list: saveParams })
}

//DB 삭제
const deleteMainData = () =>{
  let deleteRows = grdMain.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return
  let deleteList = []
  for(let i = 0; i < deleteRows.length; i++){
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(deleteRows[i])
    deleteList.push(grdJsonRow)
  }  
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB01_DELETE_01', list: deleteList })
}

//삭제 후 그리드 삭제
const afterDelete = res => {
  let deleteRows = grdMain.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return
  grdMain.value.getDataProvider().removeRows(deleteRows)
}

//DB 삭제
const deleteSubData = () =>{
  let deleteRows = grdSub.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return
  let deleteList = []
  for(let i = 0; i < deleteRows.length; i++){
    let grdJsonRow = grdSub.value.getDataProvider().getJsonRow(deleteRows[i])
    deleteList.push(grdJsonRow)
  }  
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB01_DELETE_02', list: deleteList })
}

//삭제 후 그리드 삭제
const afterSubDelete = res => {
  let deleteRows = grdSub.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return
  grdSub.value.getDataProvider().removeRows(deleteRows)
}

// 메인 그리드 값 클릭 시 층별 면적 조회
const onCellClicked = (grid, clickData) => {
  if(clickData.dataRow == null) return

  // 회사명 열 클릭 시 회사 선택 팝업
  if(clickData.fieldIndex == 3) {
    selectedRow.value = clickData.dataRow
    Popup.value.openPopup({})
  }
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  // 이전 조회와 똑같을 시엔 return
  if(subSearchParams.BSNS_CD === data.BSNS_CD && subSearchParams.BUILDING_NO === data.BUILDING_NO) return
  subSearchParams.BSNS_CD = data.BSNS_CD
  subSearchParams.BUILDING_NO = data.BUILDING_NO

  reportParam.value = [
    'IN_CMPNY_DIV=' + data.CMPNY_DIV,
    'IN_BSNS_CD=' + data.BSNS_CD,
    'IN_BUILDING_NO=' + data.BUILDING_NO,
    'IN_BUILDING_NAME=' + data.BUILDING_NAME,
    'IN_DONG_NAME=' + data.DONG_NAME,
    'IN_BSNS_NM=' + data.BSNS_NM,
    'IN_COMPANY_NAME=' + data.COMPANY_NAME,
    'IN_PRT_APP_DATE=' + data.PRT_APP_DATE,
    'IN_ADDRESS=' + data.ADDRESS,
    'IN_STRUCTURE=' + data.STRUCTURE,
    'IN_ROOF=' + data.ROOF,
    'IN_BUILDING_AREA=' + data.BUILDING_AREA,
    'IN_FLOOR_AREA=' + data.FLOOR_AREA,
    'IN_HEIGHT=' + data.HEIGHT
  ]

  searchSub()
}

const searchSub = () => {
  // subGrid 조회
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchSubData)
    .setAfter(afterSubSearch)
    .run()
}

// Main 특정 열 더블클릭 시 
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  // 건축물대장 열 클릭 시 첨부파일
  if(clickData.fieldIndex == 11) {
    selectedRow.value = clickData.dataRow
    fileUploadPopup.value.openPopup(data.ATTACH_KEY)
  }
}

// 공장명 팝업 선택 시
const selectFactory = (row) => {
  grdMain.value.getDataProvider().setValue(selectedRow.value, 'ADDRESS', row[0].ADDRESS)
  grdMain.value.getDataProvider().setValue(selectedRow.value, 'COMPANY_NO', row[0].COMPANY_NO)
  grdMain.value.getDataProvider().setValue(selectedRow.value, 'COMPANY_NAME', row[0].COMPANY_NAME)
  grdMain.value.getDataProvider().setValue(selectedRow.value, 'CMPNY_DIV', row[0].CMPNY_DIV)
  let checked = grdMain.value.getGridView().getCheckedRows(true)
  if(checked.indexOf(selectedRow.value) < 0) {
    checked.push(selectedRow.value)
    grdMain.value.getGridView().checkRows(checked, true, true, true)
  }
}

/* ****************** 파일첨부 선택 ******************* */
const uploaded = val => {
  grdMain.value.getDataProvider().setValue(selectedRow.value, 'ATTACH_KEY', val.fileId)

  grdMain.value.getGridView().checkRow(selectedRow.value, true)
}

//조회 함수
const searchData = () =>{
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

//DB 조회
const searchMainData = () => { 
  return commonSearchApi({ queryId : 'SPPBB0010_TAB01_SEARCH_01', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  subSearchParams.BSNS_CD = ''
  subSearchParams.BUILDING_NO = ''
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdSub.value.getDataProvider().setRows([])
  onCellClicked(grdMain, {dataRow: 0, fieldIndex: 1})
}

//층별 면적 조회
const searchSubData = () => { 
  return commonSearchApi({ queryId : 'SPPBB0010_TAB01_SEARCH_02', param: subSearchParams })
}

//층별 면적 조회 후 반영
const afterSubSearch = res =>{
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

defineExpose({
  onButtonsClick,
})

onMounted(() => {
  initCodeList()
})

// 사업부 콤보박스 변경 시 자동 조회
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  if(newValue != oldValue) onButtonsClick({ id: 'btnSearch' })
})

// Sub 그리드 숨겼다가 다시 등장시 재 조회
watch([grdSub], ([grdSubValue]) => {
  if(subSearchParams.CMPNY_DIV == '' && subSearchParams.BSNS_CD == '' && subSearchParams.BUILDING_NO == '') return
  if(grdSubValue == null) return
  searchSub()
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex flex-column mb-0">
          <!-- 근무일자, 안전부, 안전과, 안전팀, 안전요원 -->
          <div class="d-flex">
            <i-select
              :label="$t('사업부')"
              v-model='searchParams.BSNS_CD'
              :items='codeList.BSNS_CD'
              item-value="BSNS_CD"
              item-title="BSNS_NM" 
              width="250px"  
            />
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet class="h-auto mr-2 mt-2" width="100%">
            <IGridTitle
              :title="$t('건물정보')"
              :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnPrint']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              :style="{ height: exPanVal === 0 ? '40%' : '80%' }"
              :grid-view-option='grdMainProps.gridViewOption'
              :keys='grdMainProps.keys'
              :fields='grdMainProps.fields'
              :columns='grdMainProps.columns'
              @onCellClicked='onCellClicked'
              @onCellDblClicked='onCellDblClicked'
            />
            <VExpansionPanels
            v-model='exPanVal'
            class="mt-2"
            >
              <VExpansionPanel elevation="0">
                <VExpansionPanelTitle
                class="font-weight-bold"
                color="base"
                >
                  {{ t(" ") }}
                </VExpansionPanelTitle>
                <VExpansionPanelText>
                  <IGridTitle
                    class= "mt-2"
                    :title="$t('층별 면적')"
                    :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                    @click-button="onSubButtonsClick"
                  >
                    <template #editors />
                  </IGridTitle>
                  <RealGrid
                    ref="grdSub"
                    class="mt-2"
                    style="height: 23vh;"
                    :grid-view-option="grdSubProps.gridViewOption"
                    :keys="grdSubProps.keys"
                    :fields="grdSubProps.fields"
                    :columns="grdSubProps.columns"
                  />

                </VExpansionPanelText>
              </VExpansionPanel>
            </VExpansionPanels>    
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <!-- 첨부파일 관리 -->
  <IUploadPopup ref="fileUploadPopup" @uploaded="uploaded" :buttonList="buttonList" />
  <!-- 회사명 클릭 공장 선택 -->
  <SPPBB0010_TAB01Popup ref="Popup" @selected="selectFactory"></SPPBB0010_TAB01Popup>
  <!-- 출력 -->
  <OZReport
    :showPop="showOz"
    :reportName="reportName"
    :params="reportParam"
    @close="showOz = $event"
  ></OZReport>
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