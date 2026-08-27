<!--
  화면명 : 자탐, 경보설비
  화면개요 : 수신기 조회 및 관리
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
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import BuildingPopup from '@/pages/50_safety-support/SPP_B/SPPBB0010_Popup.vue'
import OZReport from '@/components/OZReport.vue'

// 변수 선언
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const grdSub = ref(null)
const fileUploadPopup = ref(null)
const Popup = ref(null)
const selectedRow = ref(0)
const reportName = ref('/manage/hse/SPPBB0010_03.ozr');
const reportParam = ref([]);
const showOz = ref(false)

// 첨부파일 버튼 리스트
const buttonList = reactive(['btnDelete','btnDownLoad', 'btnClose'])

// 드롭다운 코드 리스트
const codeList = reactive({
  BSNS_CD: [],
  KIND: [],
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
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: false }, footer: { visible:true }},
  keys : [],
  fields : [ 
    { fieldName: 'BUILDING_NAME', dataType: 'text', header: { text: t('건물명') }, styleName: 'left-column', width: '100',  visible : true },
    { fieldName: 'DONG_NAME', dataType: 'text',  header: { text: t('동명') }, width : '60', visible : true },
    { fieldName: 'RECEIVE_LOC', dataType: 'text', header: { text: t('수신기위치') }, styleName: 'left-column', width : '100' },
    { fieldName: 'KIND', dataType: 'text', header: { text: t('종류') }, width : '80', lookupDisplay: true, editor: { type: "dropdown" }, footer: { styleName: 'right-column', text: '총 합계 : ' }  } ,
    { fieldName: 'CIRCUIT', dataType: 'number', header: { text: t('총회로') }, styleName: 'right-column', width : '100', footer: { numberFormat: '#.##',expression: 'sum' }, },
    { fieldName: 'DETAIL_LOC', dataType: 'text', header: { text: t('상세위치') }, styleName: 'left-column', editable: false, width: '100' },
    { fieldName: 'MAKER', dataType: 'text', header: { text: t('제조사') }, styleName: 'left-column', width : '100', editable: false },
    { fieldName: 'USE_CIRCUIT', dataType: 'text', header: { text: t('사용회로') }, styleName: 'left-column', width : '100' },
    { fieldName: 'AMP_LOC', dataType: 'text', header: { text: t('AMP위치') }, styleName: 'left-column', width : '100' },
    { fieldName: 'AMP_MAKER', dataType: 'text', header: { text: t('AMP제조사') }, styleName: 'left-column', width: '100' },
    { fieldName: 'OUTPUT', dataType: 'number', header: { text: t('출력') }, styleName: 'right-column', width: '100', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'FILE_INSERT_DATE', dataType: 'text', header: { text: t('경계구역일람도') }, width: '150',
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },

    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible : false },
    { fieldName: 'BUILDING_NO', dataType: 'text',  header: { text: t('건물코드') }, visible : false },
    { fieldName: 'SEQ', dataType: 'text',  header: { text: t('SEQ') }, visible : false },
    { fieldName: 'CMPNY_DIV', dataType: 'text',  header: { text: t('회사구분') }, visible : false },
    { fieldName: 'ATTACH_KEY', dataType: 'text',  header: { text: t('ATTACH_KEY') }, visible : false },
  ],
  columnLayout: [],
  columns : [],
})

//그리드 속성셋팅_sub
const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true }, footer: { visible:true } },
  keys : [],
  fields : [
    { fieldName: 'BUILDING_NAME', dataType: 'text', header: { text: t('건물명') }, styleName: 'left-column', width: '100',  visible : true },
    { fieldName: 'DONG_NAME', dataType: 'text',  header: { text: t('동명') }, width : '60', visible : true },
    { fieldName: 'FLOOR_NO', dataType: 'text', width: '100', header: { text: t('층별') }, editable: true, footer: { styleName: 'editable_column', text: '합계 : ' } },
    { fieldName: 'SENSOR_DIFF', dataType: 'number', width: '80',header: { text: t('차동식') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'SENSOR_TEMP', dataType: 'number', width: '80', header: { text: t('정온식') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'SENSOR_SMOKE', dataType: 'number', width: '80', header: { text: t('연기식') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'SENSOR_FLAME', dataType: 'number', width: '80', header: { text: t('불꽃') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'SENSOR_ETC', dataType: 'number', width: '80', header: { text: t('기타') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'TRANSMITTER', dataType: 'number', width: '80', header: { text: t('발신기') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'BORDER_ZONE', dataType: 'number', width: '80', header: { text: t('경계구역') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'VISUAL_ALARM', dataType: 'number', width: '80', header: { text: t('시각경보') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'BROAD_SPEAKER', dataType: 'number', width: '80', header: { text: t('방송스피커') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'ETC', dataType: 'number', width: '80', header: { text: t('기타') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' }  },

    // 저장, 삭제시 필요 데이터
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장구분') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ') }, visible: false },
    { fieldName: 'BUILDING_NO', dataType: 'text', header: { text: t('BUILDING_NO') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
  ],
  columnLayout: [
    'BUILDING_NAME',
    'DONG_NAME',
    'FLOOR_NO',
    {
      name: '감지기',
      direction: 'horizontal',
      items: [ 'SENSOR_DIFF', 'SENSOR_TEMP', 'SENSOR_SMOKE', 'SENSOR_FLAME', 'SENSOR_ETC' ],
      header: { text: t('감지기') },
    },
    'TRANSMITTER',
    'BORDER_ZONE',
    'VISUAL_ALARM',
    'BROAD_SPEAKER',
    'ETC'
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

// 조회 전 코드 조회
const initCodeList = () => {
  commonSearchApi({
    queryId: 'searchBSNS',
    param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
  }).then(res => {
    codeList.BSNS_CD = res.ORESULT_CUR;
  }).finally(() => {
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD:'' })
    console.log(codeList.BSNS_CD)
  })

  // HHIK120 하위 코드들 콤보박스
  getCodeList('HHIK120').then(res => {
    codeList.KIND = codeParsing('HHIK120', res.ORESULT_CUR)
    grdMain.value.setBindingColumn('KIND', codeList.KIND, 'COD', 'TXT')  
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
  //'btnCreate', 'btnUpdate', 'btnDelete'
  if(btn.id === 'btnSearch') { 
    grdMain.value.getDataProvider().setRows([])
    searchData()
  }else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }else if(btn.id === 'btnPrint') {
    print()
  }
}  

//출력 관련 로직 시작
const print = () => {
  
  reportParam.value = [
    'IN_CMPNY_DIV=' + userStore.cmpnyDiv,
    'IN_BSNS_CD=' + searchParams.BSNS_CD,
    'IN_BUILDING_NO=' + searchParams.BUILDING_NO,
    'IN_BUILDING_NAME=' + searchParams.BUILDING_NAME,
    'IN_DONG_NAME=' + searchParams.DONG_NAME,
    'IN_BSNS_NM=' + searchParams.BSNS_NM,
  ]

  showOz.value = true
}

// Main 특정 열 더블클릭 시 
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  // 
  if(clickData.fieldName == 'FILE_INSERT_DATE') {
    selectedRow.value = clickData.dataRow
    fileUploadPopup.value.openPopup(data.ATTACH_KEY)
  }
}

const openSearchBuilding = () => {
  Popup.value.openPopup({ BSNS_CD: searchParams.BSNS_CD, BUILDING_NAME: searchParams.BUILDING_NAME })
}

// 저장 전
const beforeSave = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
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
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    if(data.CMPNY_DIV == "") data.CMPNY_DIV = userStore.cmpnyDiv
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB03_SAVE_01', list: saveParams })
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
  searchParams.BUILDING_NO = row[0].BUILDING_NO
  searchParams.BUILDING_NAME = row[0].BUILDING_NAME
  searchParams.DONG_NAME = row[0].DONG_NAME

  if(searchParams.BSNS_CD == '' && searchParams.BUILDING_NO == '') {
    grdMain.value.getDataProvider().setRows([])
    grdSub.value.getDataProvider().setRows([])
    return
  }
  onButtonsClick({ id: "btnSearch" })
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
  return commonSearchApi({ queryId : 'SPPBB0010_TAB03_SEARCH_01', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  searchSub()
}

//층별 면적 조회
const searchSubData = () => { 
  return commonSearchApi({ queryId : 'SPPBB0010_TAB03_SEARCH_02', param: searchParams })
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
              :title="$t('수신기 목록')"
              :button-list="['btnSearch', 'btnUpdate', 'btnPrint']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 40%;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellClicked="onCellClicked"
              @onCellDblClicked="onCellDblClicked"
            />
            <RealGrid
              ref="grdSub"
              class="mt-2"
              style="height: 45%;"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <!-- 첨부파일 관리 -->
  <IUploadPopup ref="fileUploadPopup" @uploaded="uploaded" :buttonList="buttonList" />
  <!-- 회사명 클릭 공장 선택 (탭2랑 같은 팝업 사용)-->
  <BuildingPopup ref="Popup" @selected="selectBuilding"></BuildingPopup>
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