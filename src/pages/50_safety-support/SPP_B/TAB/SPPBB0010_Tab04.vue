<!--
  화면명 : 피난설비, 소화활동 설비 현황
  화면개요 : 피난설비/ 소화활동 설비 현황 조회 및 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import Message from "@hiway/utils/notify"
import ILabel from '@/components/ILabel.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import BuildingPopup from '@/pages/50_safety-support/SPP_B/SPPBB0010_Popup.vue'

// 변수 선언
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const Popup = ref(null)
const selectedRow = ref(0)

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
    { fieldName: 'BUILDING_NAME', dataType: 'text', header: { text: t('건물명') }, styleName: 'left-column', width : '100', editable: false } ,
    { fieldName: 'DONG_NAME', dataType: 'text', header: { text: t('동명') }, width : '60', editable: false }, 
    { fieldName: 'FLOOR_NO', dataType: 'text', header: { text: t('층별') }, editable: false, width : '60', footer: { styleName: 'right-column', text: '총 합계 : ' }  },
    { fieldName: 'REFUGE', dataType: 'number', header: { text: t('피난구') }, styleName: 'editable_column right-column', width : '100', footer: { numberFormat: '#.##',expression: 'sum' } } ,
    { fieldName: 'PASSAGE', dataType: 'number', header: { text: t('통로') }, styleName: 'editable_column right-column', width : '100', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'STIFFNESS', dataType: 'number', header: { text: t('완강기') }, styleName: 'editable_column right-column', width: '100', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'EMERGENCY_LIGHTING', dataType: 'number', header: { text: t('비상조명') }, styleName: 'editable_column right-column', width : '100', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'VENT', dataType: 'number', header: { text: t('제연') }, styleName: 'editable_column right-column', width : '100', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'CONNECT_WATER_HOLE', dataType: 'number', header: { text: t('방수구') }, styleName: 'editable_column right-column', width : '100', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'CONNECT_TRANSMISSION', dataType: 'number', header: { text: t('송수구') }, styleName: 'editable_column right-column', width: '100', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'WATERING_HEAD', dataType: 'number', header: { text: t('헤드') }, styleName: 'editable_column right-column', width: '100', footer: { numberFormat: '#.##',expression: 'sum' } },
    { fieldName: 'WATERING_SENDING', dataType: 'number', header: { text: t('송수구') }, styleName: 'editable_column right-column', width: '100', footer: { numberFormat: '#.##',expression: 'sum' }},
    { fieldName: 'EMERGENCY_OUTLET', dataType: 'number', header: { text: t('비상콘센트') }, styleName: 'editable_column right-column', width: '100', footer: { numberFormat: '#.##',expression: 'sum' }},
    { fieldName: 'WATERWORKS', dataType: 'number', header: { text: t('상수도') }, styleName: 'editable_column right-column', width: '100', footer: { numberFormat: '#.##',expression: 'sum' }},
    { fieldName: 'FIRE_SHUTTER', dataType: 'number', header: { text: t('방화셔터') }, styleName: 'editable_column right-column', width: '100', footer: { numberFormat: '#.##',expression: 'sum' }},

    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible : false },
    { fieldName: 'BUILDING_NO', dataType: 'text',  header: { text: t('건물코드') }, visible : false },
    { fieldName: 'SEQ', dataType: 'text',  header: { text: t('SEQ') }, visible : false },
    { fieldName: 'CMPNY_DIV', dataType: 'text',  header: { text: t('회사구분') }, visible : false },
  ],
  columnLayout: [
    'BUILDING_NAME',
    'DONG_NAME',
    'FLOOR_NO',
    {
      name: '유도등/표지',
      direction: 'horizontal',
      items: [ 'REFUGE', 'PASSAGE' ],
      header: { text: t('유도등/표지') },
    },
    'STIFFNESS',
    'EMERGENCY_LIGHTING',
    'VENT',
    {
      name: '연결송수',
      direction: 'horizontal',
      items: [ 'CONNECT_WATER_HOLE', 'CONNECT_TRANSMISSION' ],
      header: { text: t('연결송수') },
    },
    {
      name: '연결살수',
      direction: 'horizontal',
      items: [ 'WATERING_HEAD', 'WATERING_SENDING' ],
      header: { text: t('연결살수') },
    },
    'EMERGENCY_OUTLET',
    'WATERWORKS',
    'FIRE_SHUTTER'
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

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
}

// 상단 버튼 클릭
const onButtonsClick = (btn) => {
  //'btnCreate', 'btnUpdate', 'btnDelete'
  if(btn.id === 'btnSearch') { 
    grdMain.value.getDataProvider().setRows([])
    searchData()
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
  }
}  

const openSearchBuilding = () => {
  Popup.value.openPopup({ BSNS_CD: searchParams.BSNS_CD, BUILDING_NAME: searchParams.BUILDING_NAME })
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
  return commonExecuteApi({ queryId : 'SPPBB0010_TAB04_SAVE_01', list: saveParams })
}

// 건물검색 팝업 선택 시
const selectBuilding = (row) => {
  searchParams.BUILDING_NO = row[0].BUILDING_NO
  searchParams.BUILDING_NAME = row[0].BUILDING_NAME
  searchParams.DONG_NAME = row[0].DONG_NAME

  if(searchParams.BSNS_CD == '' && searchParams.BUILDING_NO == '') {
    grdMain.value.getDataProvider().setRows([])
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
  return commonSearchApi({ queryId : 'SPPBB0010_TAB04_SEARCH_01', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  searchSub()
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
              :title="$t('피난설비, 소화활동 설비 현황')"
              :button-list="['btnSearch', 'btnUpdate']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 85%;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <!-- 회사명 클릭 공장 선택 (탭2랑 같은 팝업 사용)-->
  <BuildingPopup ref="Popup" @selected="selectBuilding"></BuildingPopup>
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