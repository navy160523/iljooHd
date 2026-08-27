<!--
  화면명 : 수계 소화설비
  화면개요 : 수계 소화설비 조회 및 관리
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
import BuildingPopup from '@/pages/50_safety-support/SPP_B/SPPBB0010_Popup.vue'
import OZReport from '@/components/OZReport.vue'

// 변수 선언
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const grdSub = ref(null)
const Popup = ref(null)
const reportName = ref('/manage/hse/SPPBB0010_02.ozr');
const reportParam = ref([]);
const showOz = ref(false)

// 첨부파일 버튼 리스트
const buttonList = reactive(['btnFileUpload', 'btnDelete', 'btnDownLoad', 'btnClose'])

// 드롭다운 코드 리스트
const codeList = reactive({
  BSNS_CD: [],
  PUMP_CD: [],
  // 수조(전용/겸용)
  WATER_TANK: [
    { COD: '', TXT: ''},
    { COD: '1', TXT: '전용수조' },
    { COD: '2', TXT: '겸용수조' },
  ],
  GROUND_TANK:[
    { COD: '', TXT: ''},
    { COD: '1', TXT: '지상수조' },
    { COD: '2', TXT: '지하수조' },
  ],
  ROOFTOP_WATER: [
    { COD: '', TXT: ''},
    { COD: 'Y', TXT: '있음' },
    { COD: 'N', TXT: '없음' },
  ],
  // 스프링클러
  SPRINKLER_WAY: [
    { COD: '', TXT: ''},
    { COD: '1', TXT: '습식' },
    { COD: '2', TXT: '준비' },
    { COD: '3', TXT: '건식' },
    { COD: '4', TXT: '습식/준비' },
  ],
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

const detailInfo = reactive({
  PUMP_LOC: '',
  PUMP_DTL_LOC: '',
  EFFEC_WATER: '',
  WATER_TANK: '',
  GROUND_TANK: '',
  ROOFTOP_WATER: '',
})

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: false }, footer: { visible:true }},
  keys : ['NSEQ'],
  fields : [ 
    { fieldName: 'NSEQ', dataType: 'text', header: { text: t('순') }, width : '30' },
    { fieldName: 'BUILDING_NAME', dataType: 'text', header: { text: t('건물명') }, styleName: 'left-column', width: '50',  visible : true },
    { fieldName: 'DONG_NAME', dataType: 'text',  header: { text: t('동명') }, width : '30', visible : true },
    { fieldName: 'PUMP_NAME', dataType: 'text', header: { text: t('펌프명') }, styleName: 'left-column', width : '100', lookupDisplay: true, editor: { type: 'dropdown' }, footer: { styleName: 'right-column', text: '총 합계 : ' }  } ,
    { fieldName: 'FLUX', dataType: 'number', header: { text: t('유량') }, styleName: 'right-column', width : '100', footer: { numberFormat: '#.##',expression: 'sum' }, },
    { fieldName: 'SUCTION_HEAD', dataType: 'number', header: { text: t('양정') }, styleName: 'right-column', editable: false, width: '100', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'OUTPUT', dataType: 'number', header: { text: t('출력') }, styleName: 'right-column', width : '100', editable: false, footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'USE_INSIDE', dataType: 'text', header: { text: t('옥내') }, width : '30' },
    { fieldName: 'USE_OUTSIDE', dataType: 'text', header: { text: t('옥외') }, width : '30' },
    { fieldName: 'USE_SP', dataType: 'text', width: '30', header: { text: t('SP') } },
    { fieldName: 'USE_PO', dataType: 'text', width: '30', header: { text: t('포') } },
    { fieldName: 'USE_SPRINKLING', dataType: 'text', width: '30', header: { text: t('살수') } },
    { fieldName: 'USE_RCM', dataType: 'text', width: '30', header: { text: t('RCM') } },


    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible : false },
    { fieldName: 'BUILDING_NO', dataType: 'text',  header: { text: t('건물코드') }, visible : false },
    { fieldName: 'SEQ', dataType: 'text',  header: { text: t('SEQ') }, visible : false },
    { fieldName: 'CMPNY_DIV', dataType: 'text',  header: { text: t('회사구분') }, visible : false },
    { fieldName: 'TREE_STAIR', dataType: 'text',  header: { text: t('TREE_STAIR') }, visible : false },
  ],
  columnLayout: [
    'NSEQ',
    'BUILDING_NAME',
    'DONG_NAME',
    'PUMP_NAME',
    'FLUX',
    'SUCTION_HEAD',
    'OUTPUT',
    {
      name: '용도',
      direction: 'horizontal',
      items: [ 'USE_INSIDE', 'USE_OUTSIDE', 'USE_SP', 'USE_PO', 'USE_SPRINKLING' , 'USE_RCM' ],
      header: { text: t('용도') },
    },
  ],
  columns : [],
})

//그리드 속성셋팅_sub
const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true }, footer: { visible:true } },
  keys : [],
  fields : [
    { fieldName: 'BUILDING_NAME', dataType: 'text', header: { text: t('건물명') }, styleName: 'left-column', width: '120',  visible : true },
    { fieldName: 'DONG_NAME', dataType: 'text',  header: { text: t('동명') }, width : '100', visible : true },
    { fieldName: 'FLOOR_NO', dataType: 'text', width: '80', header: { text: t('층별') }, footer: { styleName: 'right-column', text: '합계 : ' } },
    { fieldName: 'EXT_POWDER', dataType: 'number', width: '80',header: { text: t('분말(4.5Kg)') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'EXT_POWDER20', dataType: 'number', width: '80', header: { text: t('분말(20Kg)') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'EXT_CO2', dataType: 'number', width: '80', header: { text: t('CO2') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'EXT_AUTO', dataType: 'number', width: '80', header: { text: t('자동식') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'EXT_K', dataType: 'number', width: '80', header: { text: t('K급') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'HYDR_INSIDE', dataType: 'number', width: '80', header: { text: t('옥내') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'HYDR_OUTSIDE', dataType: 'number', width: '80', header: { text: t('옥외') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'PO_INSIDE', dataType: 'number', width: '80', header: { text: t('옥내포') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'PO_OUTSIDE', dataType: 'number', width: '80', header: { text: t('옥외포') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'SPRINKLER_VALVE', dataType: 'number', width: '80', header: { text: t('밸브') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'SPRINKLER_HEAD', dataType: 'number', width: '80', header: { text: t('헤드') }, editable: true, styleName: 'editable_column right-column', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'SPRINKLER_WAY', dataType: 'text', width: '120', header: { text: t('방식') }, editable: true, styleName: 'editable_column', lookupDisplay: true, editor: { type: 'dropdown' } },

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
      name: '소화기',
      direction: 'horizontal',
      items: [ 'EXT_POWDER', 'EXT_POWDER20', 'EXT_CO2', 'EXT_AUTO', 'EXT_K' ],
      header: { text: t('소화기') },
    },
    {
      name: '소화전',
      direction: 'horizontal',
      items: [ 'HYDR_INSIDE', 'HYDR_OUTSIDE' ],
      header: { text: t('소화전') },
    },
    {
      name: '포',
      direction: 'horizontal',
      items: [ 'PO_INSIDE', 'PO_OUTSIDE' ],
      header: { text: t('포') },
    },
    {
      name: '스프링쿨러',
      direction: 'horizontal',
      items: [ 'SPRINKLER_VALVE', 'SPRINKLER_HEAD', 'SPRINKLER_WAY' ],
      header: { text: t('스프링쿨러') },
    },
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
  })
  getCodeList('HHIK080').then(res => {
    codeList.PUMP_CD = codeParsing('HHIK080', res.ORESULT_CUR)
    grdMain.value.setBindingColumn('PUMP_NAME', codeList.PUMP_CD, 'COD', 'TXT')  
  })

  grdSub.value.setBindingColumn('SPRINKLER_WAY', codeList.SPRINKLER_WAY, 'COD', 'TXT')  
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
    // if(searchParams.BUILDING_NO == '') {
    //   Message.warn(t('건물명을 선택해주십시오.'))
    //   return
    // }
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
    'IN_PUMP_LOC=' + detailInfo.PUMP_LOC,
    'IN_PUMP_DTL_LOC=' + detailInfo.PUMP_DTL_LOC,
    'IN_EFFEC_WATER=' + detailInfo.EFFEC_WATER,
    'IN_WATER_TANK=' + detailInfo.WATER_TANK,
    'IN_GROUND_TANK=' + detailInfo.GROUND_TANK,
    'IN_ROOFTOP_WATER=' + detailInfo.ROOFTOP_WATER,
  ]

  // if(searchParams.CMPNY_DIV == '' || searchParams.BUILDING_NO == '') {
  //   return Message.warn(t('건물을 선택해 주십시오.'))
  // }
  showOz.value = true
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
    if(data.CMPNY_DIV == '') data.CMPNY_DIV = userStore.cmpnyDiv
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB02_SAVE_01', list: saveParams })
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
  detailInfo.PUMP_LOC = row[0].PUMP_LOC
  detailInfo.PUMP_DTL_LOC = row[0].PUMP_DTL_LOC
  detailInfo.EFFEC_WATER = row[0].EFFEC_WATER
  detailInfo.WATER_TANK = row[0].WATER_TANK
  detailInfo.GROUND_TANK = row[0].GROUND_TANK
  detailInfo.ROOFTOP_WATER = row[0].ROOFTOP_WATER

  if(searchParams.BSNS_CD == '' && searchParams.BUILDING_NO == '') {
    grdMain.value.getDataProvider().setRows([])
    grdSub.value.getDataProvider().setRows([])
    return
  }
  onButtonsClick({ id: 'btnSearch' })
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
  return commonSearchApi({ queryId : 'SPPBB0010_TAB02_SEARCH_01', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  searchSub()
}

//층별 면적 조회
const searchSubData = () => { 
  return commonSearchApi({ queryId : 'SPPBB0010_TAB02_SEARCH_03', param: searchParams })
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
              :title="$t('펌프실 상세 정보')"
              :button-list="['btnSearch', 'btnUpdate', 'btnPrint']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <v-sheet class="searchArea d-flex flex-column mb-0">
              <div class="d-flex">
                <i-input
                  v-model="detailInfo.PUMP_LOC"
                  :label="$t('펌프실 위치')"
                  :disabled="true"
                  label-width="80px"
                  style="width:700px !important;"
                />
                <i-input
                  v-model="detailInfo.PUMP_DTL_LOC"
                  :label="$t('세부위치')"
                  :disabled="true"
                  class="w-25"
                />
              </div>
              <div class="d-flex mt-2"> 
                <div class="d-flex" style="width:720px;">
                  <i-input
                    v-model="detailInfo.EFFEC_WATER"
                    :label="$t('유효 수원')"
                    :disabled="true"
                    label-width="80px"
                    width="250px"
                  />
                  <i-select
                    v-model="detailInfo.WATER_TANK"
                    :items="codeList.WATER_TANK"
                    item-value="COD"
                    item-title="TXT" 
                    :disabled="true"
                    width="200px"
                  />
                  <i-select
                    v-model="detailInfo.GROUND_TANK"
                    :items="codeList.GROUND_TANK"
                    item-value="COD"
                    item-title="TXT" 
                    :disabled="true"
                    width="200px"
                  />
                </div>
                <i-select
                  v-model="detailInfo.ROOFTOP_WATER"
                  :label="$t('옥상수원')"
                  :items="codeList.ROOFTOP_WATER"
                  item-value="COD"
                  item-title="TXT" 
                  :disabled="true"
                  width="250px"
                />
              </div>
            </v-sheet>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 35%;"
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
              style="height: 35%;"
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
  <!-- 회사명 클릭 공장 선택 -->
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