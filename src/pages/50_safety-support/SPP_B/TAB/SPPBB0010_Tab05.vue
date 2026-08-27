<!--
  화면명 : 가스계 소화 설비 현황
  화면개요 : 펌프 및 소화설비 현황 조회 관리 화면
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
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import BuildingPopup from '@/pages/50_safety-support/SPP_B/SPPBB0010_Popup.vue'

// 변수 선언
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const grdSub = ref(null)
const Popup = ref(null)
const searchBuild = ref(0)

// 드롭다운 코드 리스트
const codeList = reactive({
  BSNS_CD: [],
})

// 검색조건 저장
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  BSNS_NM: '',
  BUILDING_NO: '',
  BUILDING_NAME: '',
  DONG_NAME: ''
})

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true }, footer: { visible:true }},
  keys : [],
  fields : [ 
    { fieldName: 'BUILDING_NAME', dataType: 'text', header: { text: t('건물명') }, styleName: 'left-column', width : '150', editable: false,
      'styleCallback': function(grid, dataCell){
        var ret = {style: {background:undefined}}
        if(grid.getValue(dataCell.index.itemIndex, 'BUILDING_NO') == '') {
          ret.style.background = '#e98f8f'
        }
        return ret
      }
    },
    { fieldName: 'DONG_NAME', dataType: 'text', header: { text: t('동명') }, width : '100', editable: false },
    { fieldName: 'SERIAL_NUM', dataType: 'text', header: { text: t('연번') }, styleName: 'editable_column', width : '100' },
    { fieldName: 'MANAGEMENT_NM', dataType: 'text', header: { text: t('관리명') }, width : '100', styleName: 'editable_column left-column' } ,
    { fieldName: 'EQUIPMENT_NM', dataType: 'text', header: { text: t('설비/약제명') }, styleName: 'left-column editable_column', width : '150', lookupDisplay: true, editor: { type: 'dropdown' } },
    { fieldName: 'PHARM_ROOM', dataType: 'text', header: { text: t('약제실') }, styleName: 'left-column editable_column', width: '100' },
    { fieldName: 'BY_TYPE', dataType: 'text', header: { text: t('형태별') }, styleName: 'left-column editable_column', width : '100', lookupDisplay: true, editor: { type: 'dropdown' } },
    { fieldName: 'UNIT', dataType: 'text', header: { text: t('용기단위') }, styleName: 'left-column editable_column', width : '100', footer: { styleName: 'right-column', text: '총 합계 : ' }  },
    { fieldName: 'CONTAINERS_NUM', dataType: 'number', header: { text: t('용기수') }, styleName: 'left-column editable_column', width : '100', footer: { numberFormat: '#.##',expression: 'sum' }  },
    { fieldName: 'RECEVIER_LOC', dataType: 'text', header: { text: t('수신기 위치') }, styleName: 'left-column editable_column', width: '150' },
    { fieldName: 'MAKER', dataType: 'text', header: { text: t('제조사') }, styleName: 'left-column editable_column', width: '100' },
    { fieldName: 'REMARKS', dataType: 'text', header: { text: t('비고') }, styleName: 'left-column editable_column', width: '150'},

    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible : false },
    { fieldName: 'BUILDING_NO', dataType: 'text',  header: { text: t('건물코드') }, visible : false },
    { fieldName: 'SEQ', dataType: 'text',  header: { text: t('SEQ') }, visible : false },
    { fieldName: 'CMPNY_DIV', dataType: 'text',  header: { text: t('회사구분') }, visible : false },
    { fieldName: 'DRUG_NAME', dataType: 'text',  header: { text: t('약명') }, visible : false },
    { fieldName: 'WRITE_YN', dataType: 'text',  header: { text: t('WRITE_YN') }, visible : false },
  ],
  columnLayout: [],
  columns : [],
})

//그리드 속성셋팅_sub
const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true }, footer: { visible:true } },
  keys : [],
  fields : [
    { fieldName: 'BUILDING_NAME', dataType: 'text', header: { text: t('건물명') }, styleName: 'left-column', width : '150', editable: false,
      'styleCallback': function(grid, dataCell){
        var ret = {style: {background:undefined}}
        if(grid.getValue(dataCell.index.itemIndex, 'BUILDING_NO') == '') {
          ret.style.background = '#e98f8f'
        }
        return ret
      }
    },
    { fieldName: 'DONG_NAME', dataType: 'text', header: { text: t('동명') }, width : '100', editable: false },
    { fieldName: 'FLOOR_NO', dataType: 'text', width: '60', header: { text: t('층별') }, editable: true, styleName: 'editable_column'  },
    { fieldName: 'AREA_NAME', dataType: 'text', width: '80',header: { text: t('구역명') }, editable: true, styleName: 'editable_column left-column', footer: { styleName: 'editable_column', text: '합계 : '} },
    { fieldName: 'VOLUME', dataType: 'number', width: '80', header: { text: t('체적') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: "#.##",expression: "sum" } },
    { fieldName: 'VESSEL', dataType: 'number', width: '80', header: { text: t('용기(EA)') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: "#.##",expression: "sum" } },
    { fieldName: 'HEAD', dataType: 'number', width: '80', header: { text: t('헤드(EA)') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: "#.##",expression: "sum" } },
    { fieldName: 'DIFFERENTIAL', dataType: 'number', width: '80', header: { text: t('차동식') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: "#.##",expression: "sum" } },
    { fieldName: 'TEMPERATURE', dataType: 'number', width: '80', header: { text: t('정온식') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: "#.##",expression: "sum" } },
    { fieldName: 'SMOKE', dataType: 'number', width: '80', header: { text: t('연기식') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: "#.##",expression: "sum" } },
    { fieldName: 'FLAME', dataType: 'number', width: '80', header: { text: t('불꽃') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: "#.##",expression: "sum" } },
    { fieldName: 'TARGET_NUMBER', dataType: 'number', width: '80', header: { text: t('대상연번') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: "#.##",expression: "sum" } },
    { fieldName: 'REMARKS', dataType: 'text', width: '150', header: { text: t('비고') }, editable: true, styleName: 'editable_column left-column'  },

    // 저장, 삭제시 필요 데이터
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장구분') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ') }, visible: false },
    { fieldName: 'BUILDING_NO', dataType: 'text', header: { text: t('BUILDING_NO') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
    { fieldName: 'WRITE_YN', dataType: 'text',  header: { text: t('WRITE_YN') }, visible : false },
  ],
  columnLayout: [
    'BUILDING_NAME', 
    'DONG_NAME',
    'FLOOR_NO',
    'AREA_NAME',
    'VOLUME',
    'VESSEL',
    'HEAD',
    {
      name: '감지기',
      direction: 'horizontal',
      items: [ 'DIFFERENTIAL', 'TEMPERATURE', 'SMOKE', 'FLAME' ],
      header: { text: t('감지기') },
    },
    'TARGET_NUMBER',
    'REMARKS'
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

// 조회 전 코드 조회
const initCodeList = () => {
  Promise.all([
       commonSearchApi({ queryId : 'searchBSNS', param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 부서
       getCodeList('HHIK090020'),// 약제
       getCodeList('HHIK090010'),// 타입
    ]).then(res => {
      codeList.BSNS_CD = res[0].ORESULT_CUR
      codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD:'' })

      grdMain.value.setBindingColumn("EQUIPMENT_NM", codeParsing('HHIK090020',res[1].ORESULT_CUR), "COD", "TXT")  
      grdMain.value.setBindingColumn("BY_TYPE", codeParsing('HHIK090010',res[2].ORESULT_CUR), "COD", "TXT")  
  })
}

// getCodeList로 가져온 코드들을 파싱한다
const codeParsing = (code, cdList) => {
  var codeList = []
  for(var cd of cdList) {
    codeList.push({COD: code + cd.COD, TXT: cd.TXT})
  }
  return codeList
}

// 상단 버튼 클릭
const onButtonsClick = (btn) => {
  if(btn.id === 'btnSearch') { 
    grdMain.value.getDataProvider().setRows([])
    searchData()
  }else if(btn.id === 'btnCreate') {
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: searchParams.BSNS_CD,
      SERIAL_NUM: '',
      MANAGEMENT_NM: '',
      EQUIPMENT_NM: '',
      PHARM_ROOM: '',
      BY_TYPE: '',
      UNIT: '',
      CONTAINERS_NUM: '',
      RECEVIER_LOC: '',
      MAKER: '',
      REMARKS: '',
      BUILDING_NO: searchParams.BUILDING_NO,
      SEQ: '',
      DRUG_NAME: '',
      BUILDING_NAME : searchParams.BUILDING_NAME,
      DONG_NAME: searchParams.DONG_NAME,
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
  }
}  

// 하단 그리드 버튼 클릭
const onSubButtonsClick = (btn) => {
  if(btn.id === 'btnCreate') {
    grdSub.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: searchParams.BSNS_CD,
      FLOOR_NO: '',
      AREA_NAME: '',
      VOLUME: '',
      VESSEL: '',
      HEAD: '',
      DIFFERENTIAL: '',
      TEMPERATURE: '',
      SMOKE: '',
      FLAME: '',
      TARGET_NUMBER: '',
      REMARKS: '',
      SEQ: '',
      BUILDING_NO: searchParams.BUILDING_NO,
      BUILDING_NAME : searchParams.BUILDING_NAME,
      DONG_NAME: searchParams.DONG_NAME,
    })
  }else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeSubSave)
      .setQuery(saveSubData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
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

const onCellClicked = (grid, clickData) => {
  console.log(clickData)
  if(clickData.dataRow == null) return

  if(clickData.fieldName == 'BUILDING_NAME') {
    if(grdMain.value.getGridView().getValue(clickData.dataRow, 'WRITE_YN') == 'Y') return
    searchBuild.value = 1
    Popup.value.openPopup({ BSNS_CD: searchParams.BSNS_CD, BUILDING_NAME: searchParams.BUILDING_NAME })
  }
}

const onSubCellClicked = (grid, clickData) => { 
  if(clickData.dataRow == null) return

  if(clickData.fieldName == 'BUILDING_NAME') {
    if(grdSub.value.getGridView().getValue(clickData.dataRow, 'WRITE_YN') == 'Y') return
    searchBuild.value = 2
    Popup.value.openPopup({ BSNS_CD: searchParams.BSNS_CD, BUILDING_NAME: searchParams.BUILDING_NAME })
  }
}
const openSearchBuilding = () => {
  searchBuild.value = 0
  Popup.value.openPopup({ BSNS_CD: searchParams.BSNS_CD, BUILDING_NAME: searchParams.BUILDING_NAME })
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
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB05_DELETE_01', list: deleteList })
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
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB05_DELETE_02', list: deleteList })
}

//삭제 후 그리드 삭제
const afterSubDelete = res => {
  let deleteRows = grdSub.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return
  grdSub.value.getDataProvider().removeRows(deleteRows)
}

// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (!data.BSNS_CD) {
      return Message.warn(t('사업부분을 입력해주세요.'))
    } else if (!data.BUILDING_NO) {
      return Message.warn(t('건물명을 확인해주세요.'))
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
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB05_SAVE_01', list: saveParams })
}


// 저장 전
const beforeSubSave = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    if (!data.BUILDING_NO) {
      return Message.warn(t('건물명을 확인해주세요.'))
    }
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
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB05_SAVE_02', list: saveParams })
}

const searchSub = () => {
  // subGrid 조회
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchSubData)
    .setAfter(afterSubSearch)
    .run()
}

// 건물검색 팝업 선택 시
const selectBuilding = (row) => {

  if(searchBuild.value === 0) {
    searchParams.BUILDING_NO = row[0].BUILDING_NO
    searchParams.BUILDING_NAME = row[0].BUILDING_NAME
    searchParams.DONG_NAME = row[0].DONG_NAME
    searchParams.BSNS_CD = row[0].BSNS_CD

    if(searchParams.BSNS_CD == '' && searchParams.BUILDING_NO == '') {
      grdMain.value.getDataProvider().setRows([])
      grdSub.value.getDataProvider().setRows([])
      return
    }
    onButtonsClick({ id: 'btnSearch' })
  } else if(searchBuild.value === 1) {
    let currentRowIdx = grdMain.value.getGridView().getCurrent().dataRow
    grdMain.value.getDataProvider().setValue(currentRowIdx,'BUILDING_NO', row[0].BUILDING_NO)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'BUILDING_NAME', row[0].BUILDING_NAME)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'DONG_NAME', row[0].DONG_NAME)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'BSNS_CD', row[0].BSNS_CD)
  } else if(searchBuild.value === 2) {
    let currentRowIdx = grdSub.value.getGridView().getCurrent().dataRow
    grdSub.value.getDataProvider().setValue(currentRowIdx,'BUILDING_NO', row[0].BUILDING_NO)
    grdSub.value.getDataProvider().setValue(currentRowIdx,'BUILDING_NAME', row[0].BUILDING_NAME)
    grdSub.value.getDataProvider().setValue(currentRowIdx,'DONG_NAME', row[0].DONG_NAME)
    grdSub.value.getDataProvider().setValue(currentRowIdx,'BSNS_CD', row[0].BSNS_CD)
  }
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
  return commonSearchApi({ queryId : 'SPPBB0010_TAB05_SEARCH_01', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  searchSub()
}

//층별 면적 조회
const searchSubData = () => { 
  return commonSearchApi({ queryId : 'SPPBB0010_TAB05_SEARCH_02', param: searchParams })
}

//층별 면적 조회 후 반영
const afterSubSearch = res =>{
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 사업부 콤보박스 변경 시 
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  for(var cd of codeList.BSNS_CD) {
    if(newValue == cd.BSNS_CD) {
      searchParams.BSNS_NM = cd.BSNS_NM
      return
    }
  }
})

defineExpose({
  onButtonsClick,
})

onMounted(() => {
  initCodeList()
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
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM" 
              width="250px"  
            />
            <ILabel
              :label="$t('건물명')" 
              class="w-25"
            >
              <template #editor="">
                <v-text-field
                  v-model="searchParams.BUILDING_NAME"
                  type="text"
                  variant="solo"
                  flat
                  class="mr-2"
                  width="250px"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openSearchBuilding"
                  @keypress.enter="openSearchBuilding"
                />
              </template>
            </ILabel>
            <i-input
              v-model="searchParams.DONG_NAME"
              :label="$t('동 명')"
              :disabled="true"
              width="250px"
            />
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet class="h-auto mr-2 mt-2" width="100%">
            <IGridTitle
              :title="$t('펌프현황')"
              :button-list="['btnSearch', 'btnCreate', 'btnDelete', 'btnUpdate']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              style="height: 40%;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellClicked="onCellClicked"
            />
            <IGridTitle
              class="mt-2"
              :title="$t('소화설비현황')"
              :button-list="['btnCreate', 'btnDelete', 'btnUpdate']"
              @click-button="onSubButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              style="height: 40%;"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout"
              @onCellClicked="onSubCellClicked"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <!-- 회사명 클릭 공장 선택 (탭2랑 같은 팝업 사용)-->
  <BuildingPopup ref="Popup" @selected="selectBuilding"></BuildingPopup>
  <!-- 출력 -->
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