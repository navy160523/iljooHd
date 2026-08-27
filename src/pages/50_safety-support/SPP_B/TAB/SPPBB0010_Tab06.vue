<!--
  화면명 : 전체 소화설비
  화면개요 : 모든 소화설비 조회
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
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: true } },
  keys : [],
  fields : [ 
    { fieldName: 'BUILDING_NAME', dataType: 'text', header: { text: t('건물별') }, styleName: 'left-column', editable: false, width : '150' },
    { fieldName: 'FLOOR_NO', dataType: 'text', header: { text: t('층별') }, width : '70' } ,
    { fieldName: 'BFLOOR_AREA', dataType: 'text', header: { text: t('바닥면적') }, styleName: 'right-column', width : '70' },
    { fieldName: 'EXT_POWDER', dataType: 'text', header: { text: t('분말(4.5Kg)') }, styleName: 'right-column', width: '70' },
    { fieldName: 'EXT_POWDER20', dataType: 'text', header: { text: t('분말(20Kg)') }, styleName: 'right-column', width : '70' },
    { fieldName: 'EXT_CO2', dataType: 'text', header: { text: t('CO2') }, styleName: 'right-column', width : '70' },
    { fieldName: 'EXT_AUTO', dataType: 'text', header: { text: t('자동식') }, styleName: 'right-column', width : '70' },
    { fieldName: 'EXT_K', dataType: 'text', header: { text: t('K급') }, styleName: 'right-column', width: '70' },
    { fieldName: 'HYDR_INSIDE', dataType: 'text', header: { text: t('옥내') }, styleName: 'right-column', width: '70' },
    { fieldName: 'HYDR_OUTSIDE', dataType: 'text', header: { text: t('옥외') }, styleName: 'right-column', width: '70' },
    { fieldName: 'PO_INSIDE', dataType: 'text', header: { text: t('옥내포') }, styleName: 'right-column', width: '70' },
    { fieldName: 'PO_OUTSIDE', dataType: 'text', header: { text: t('옥외포') }, styleName: 'right-column', width: '70' },
    { fieldName: 'SPRINKLER_VALVE', dataType: 'text', header: { text: t('밸브') }, styleName: 'right-column', width: '70' },
    { fieldName: 'SPRINKLER_HEAD', dataType: 'text', header: { text: t('헤드') }, styleName: 'right-column', width: '70' },
    { fieldName: 'SPRINKLER_WAY', dataType: 'text', header: { text: t('방식') }, width: '70' },
    { fieldName: 'SENSOR_DIFF', dataType: 'text', header: { text: t('차동식') }, styleName: 'right-column', width: '70' },
    { fieldName: 'SENSOR_TEMP', dataType: 'text', header: { text: t('정온식') }, styleName: 'right-column', width: '70' },
    { fieldName: 'SENSOR_SMOKE', dataType: 'text', header: { text: t('연기식') }, styleName: 'right-column', width: '70' },
    { fieldName: 'SENSOR_FLAME', dataType: 'text', header: { text: t('불꽃') }, styleName: 'right-column', width: '70' },
    { fieldName: 'SENSOR_ETC', dataType: 'text', header: { text: t('기타') }, styleName: 'right-column', width: '70' },
    { fieldName: 'TRANSMITTER', dataType: 'text', header: { text: t('발신기') }, styleName: 'right-column', width: '70' },
    { fieldName: 'BORDER_ZONE', dataType: 'text', header: { text: t('경계구역') }, styleName: 'right-column', width: '70' },
    { fieldName: 'VISUAL_ALARM', dataType: 'text', header: { text: t('시각경보') }, styleName: 'right-column', width: '70' },
    { fieldName: 'BROAD_SPEAKER', dataType: 'text', header: { text: t('방송스피커') }, styleName: 'right-column', width: '80' },
    { fieldName: 'ETC', dataType: 'text', header: { text: t('기타') }, styleName: 'right-column', width: '70' },
    { fieldName: 'VOLUME', dataType: 'text', header: { text: t('체적') }, styleName: 'right-column', width: '70' },
    { fieldName: 'VESSEL', dataType: 'text', header: { text: t('용기(EA)') }, styleName: 'right-column', width: '70' },
    { fieldName: 'HEAD', dataType: 'text', header: { text: t('헤드(EA)') }, styleName: 'right-column', width: '70' },
    { fieldName: 'DIFFERENTIAL', dataType: 'text', header: { text: t('차동식') }, styleName: 'right-column', width: '70' },
    { fieldName: 'TEMPERATURE', dataType: 'text', header: { text: t('정온식') }, styleName: 'right-column', width: '70' },
    { fieldName: 'SMOKE', dataType: 'text', header: { text: t('연기식') }, styleName: 'right-column', width: '70' },
    { fieldName: 'FLAME', dataType: 'text', header: { text: t('불꽃') }, styleName: 'right-column', width: '70' },
    { fieldName: 'REFUGE', dataType: 'text', header: { text: t('피난구') }, styleName: 'right-column', width: '70' },
    { fieldName: 'PASSAGE', dataType: 'text', header: { text: t('통로') }, styleName: 'right-column', width: '70' },
    { fieldName: 'STIFFNESS', dataType: 'text', header: { text: t('완강기') }, styleName: 'right-column', width: '70' },
    { fieldName: 'EMERGENCY_LIGHTING', dataType: 'text', header: { text: t('비상조명') }, styleName: 'right-column', width: '70' },
    { fieldName: 'VENT', dataType: 'text', header: { text: t('제연') }, styleName: 'right-column', width: '70' },
    { fieldName: 'CONNECT_WATER_HOLE', dataType: 'text', header: { text: t('방수구') }, styleName: 'right-column', width: '70' },
    { fieldName: 'CONNECT_TRANSMISSION', dataType: 'text', header: { text: t('송수구') }, styleName: 'right-column', width: '70' },
    { fieldName: 'WATERING_HEAD', dataType: 'text', header: { text: t('헤드') }, styleName: 'right-column', width: '70' },
    { fieldName: 'WATERING_SENDING', dataType: 'text', header: { text: t('송수구') }, styleName: 'right-column', width: '70' },
    { fieldName: 'EMERGENCY_OUTLET', dataType: 'text', header: { text: t('비상콘센트') }, styleName: 'right-column', width: '80' },
    { fieldName: 'WATERWORKS', dataType: 'text', header: { text: t('상수도') }, styleName: 'right-column', width: '70' },
    { fieldName: 'FIRE_SHUTTER', dataType: 'text', header: { text: t('방화셔터') }, styleName: 'right-column', width: '70' },


    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible : false },
    { fieldName: 'BUILDING_NO', dataType: 'text',  header: { text: t('건물코드') }, visible : false },
    { fieldName: 'SEQ', dataType: 'text',  header: { text: t('SEQ') }, visible : false },
    { fieldName: 'BSEQ', dataType: 'text',  header: { text: t('BSEQ') }, visible : false },
    { fieldName: 'CMPNY_DIV', dataType: 'text',  header: { text: t('회사구분') }, visible : false },
  ],
  columnLayout: [
    {
      name: '구분',
      direction: 'horizontal',
      items: [ 'BUILDING_NAME', 'FLOOR_NO', 'BFLOOR_AREA' ],
      header: { text: t('구분') }
    },
    {
      name: '수계 소화설비 현황',
      direction: 'horizontal',
      items: [
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
          name: '스프링클러',
          direction: 'horizontal',
          items: [ 'SPRINKLER_VALVE', 'SPRINKLER_HEAD', 'SPRINKLER_WAY' ],
          header: { text: t('스프링클러') },
        },
      ],
      header: { text: t('수계 소화설비 현황') },
    },
    {
      name: '자탐, 경보설비 현황',
      direction: 'horizontal',
      items: [ 
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
      header: { text: t('자탐, 경보설비 현황') }
    },
    {
      name: '가스계 소화설비 현황',
      direction: 'horizontal',
      items: [ 
        'VOLUME',
        'VESSEL',
        'HEAD',
        {
          name: '감지기',
          direction: 'horizontal',
          items: [ 'DIFFERENTIAL', 'TEMPERATURE', 'SMOKE', 'FLAME' ],
          header: { text: t('감지기') },
        }
      ],
      header: { text: t('가스계 소화설비 현황') }
    },
    {
      name: '피난설비, 소화활동설비',
      direction: 'horizontal',
      items: [ 
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
      header: { text: t('피난설비, 소화활동설비') },
    }
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
  if(btn.id === 'btnSearch') { 
    grdMain.value.getDataProvider().setRows([])
    searchData()
  }
}  

const openSearchBuilding = () => {
  Popup.value.openPopup({ BSNS_CD: searchParams.BSNS_CD, BUILDING_NAME: searchParams.BUILDING_NAME })
}

// 건물검색 팝업 선택 시
const selectBuilding = (row) => {
  searchParams.BUILDING_NO = row[0].BUILDING_NO
  searchParams.BUILDING_NAME = row[0].BUILDING_NAME
  searchParams.DONG_NAME = row[0].DONG_NAME

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
  return commonSearchApi({ queryId : 'SPPBB0010_TAB06_SEARCH_01', param: searchParams })
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
              :title="$t('소화설비 현황')"
              :button-list="['btnSearch' ]"
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