<!-- 
  화면명 : 작업환경측정 통계
  화면개요 : 년도별 현황 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonRequest2 } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Echart from 'vue-echarts'
import { excelDown } from "@/utils/excel"
import Message from '@hiway/utils/notify'

defineOptions({
  name:'100_health-HLT_F-HLTFC0020', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const chart1 = ref(null)
const chart2 = ref(null)
const chartTitle = ref([])

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FR_YEAR: String(dayjs().add(-4, 'year').get('year')),
  TO_YEAR: String(dayjs().get('year')),
  REG_DIV: 'A',
  ORGN_DIV: ''
})

const codeList = reactive({
  YEAR:[],
  REG_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  CLASSIFI: [],
  ORGN_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '협력사' },
  ],
})

const colorPaletteLine = ref([
  "#FF0000",
  "#FF5252",
  "#FF7637",
  "#FF983B",
  "#FEBF32",
  "#94C81B",
  "#0BB69C",
  "#0581FD",
  "#1A40C7"
])

// Chart(측정인자 분류별 현황)
const chartsOptions1 = ref({
  tooltip: {
      trigger: 'axis'
  },
  legend: {
      data: []
  },
  grid: {
    left: '6%',
    right: '6%', 
    bottom: '10%',
  },
  toolbox: {
      show: true,
      feature: {
          saveAsImage: {
              title: '사진저장',
          }
      }
  },
  xAxis: {
    type: 'category',
    data: [],
    axisLabel: {
      rotate: 25,
      interval: 0
    }
  },
  yAxis: {
      type: 'value',
      name: '건수',
  },
  series: []
  },
)

// Chart(위험분류별 위험성평가 현황)
const chartsOptions2 = ref({
  tooltip: {
      trigger: 'axis'
  },
  legend: {
      data: []
  },
  grid: {
    left: '6%',
    right: '6%', 
    bottom: '10%',
  },
  toolbox: {
      show: true,
      feature: {
          saveAsImage: {
              title: '사진저장',
          }
      }
  },
  xAxis: {
    type: 'category',
    data: [],
    axisLabel: {
      rotate: 25,
      interval: 0
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '건수',
    },
    {
      type: 'value',
      name: '%',
      interval: 20,
      axisLabel: {
        formatter: '{value} %'
      }
    }
  ],
  series: []
  },
)

/*  공통코드 세팅 */
onMounted(() => {
  // 보건관리자여부 확인
  if(useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes('HLTF001') || 
    userStore.authGrpCd.includes('HIWAYGRP00001') ||
    userStore.authGrpCd.includes('GRP00372')) {
      isAdmin.value = true
  }

  onButtonsClick({ id: 'btnSearch' })

  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }
  grdMain.value.getGridView().filterPanel.visible = false

  grdMain.value.getGridView().setRowGroup({
    mergeMode: true
  })
  // 그리드 헤더 설정
  setGrdHeader()

  Promise.all([
    // 분류
    getCodeList('HHII803'),
  ]).then((res) => {
    codeList.CLASSIFI = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('GBN2', codeList.CLASSIFI, 'COD', 'TXT')
  })

  window.addEventListener('resize', resizeHandler)
})

//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false },},
  keys : ['GBN1','GBN2'], 
  fields : [ 
    { fieldName: 'GBN1', width: '120', editable: false, dataType: 'text', styleName: 'pk_column', header: { text: t('NO') },  mergeRule: { criteria: 'value' }, },
    { fieldName: 'GBN2', width: '120', editable: false, dataType: 'text', styleName: 'pk_column', header: { text: t('차수') }, lookupDisplay: true },
    { fieldName: 'HI_0', width: '180', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('측정일자') } },
    { fieldName: 'LO_0', width: '180', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('사업부') } },
    { fieldName: 'HI_1', width: '180', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('사업부') } },
    { fieldName: 'LO_1', width: '180', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('사업부') } },
    { fieldName: 'HI_2', width: '180', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('사업부') } },
    { fieldName: 'LO_2', width: '180', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('사업부') } },
    { fieldName: 'HI_3', width: '180', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('사업부') } },
    { fieldName: 'LO_3', width: '180', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('사업부') } },
    { fieldName: 'HI_4', width: '180', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('사업부') } },
    { fieldName: 'LO_4', width: '180', editable: false, dataType: 'text', styleName: 'right-column', header: { text: t('사업부') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columnLayout: [
    {
          name: '구분',
          direction: 'horizontal',
          hideChildHeaders: true, 
          items: [ 'GBN1', 'GBN2' ],
          header: { text: t('구분') },
    },
    'HI_0',
    'LO_0',
    'HI_1',
    'LO_1',
    'HI_2',
    'LO_2',
    'HI_3',
    'LO_3',
    'HI_4',
    'LO_4',
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

// 그리드 헤더 설정
const setGrdHeader = () => {
  for(var i = 0; i <= 4; i++) {
    var headerYear = Number(searchParams.FR_YEAR) + i
    grdMain.value.getGridView().setColumnProperty('HI_' + i , 'header', { text: t(headerYear + '(상)') })
    grdMain.value.getGridView().setColumnProperty('LO_' + i , 'header', { text: t(headerYear + '(하)') })
  }
}

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  // if(!isAdmin.value) {
  //   return Message.warn(t('관리자만 사용가능합니다.'))
  // }

  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnPrint') {    
    // 이미지 다운로드를 위한 링크 생성
    const link1 = document.createElement('a');
    const link2 = document.createElement('a');
    link1.href = chart1.value.getDataURL({
      type: 'png',
      pixelRatio: 1,
      backgroundColor: '#fff', // 배경색 설정 (선택) 
    })

    link2.href = chart2.value.getDataURL({
      type: 'png',
      pixelRatio: 1,
      backgroundColor: '#fff', // 배경색 설정 (선택) 
    })
    
    var columnNames = {
      GBN1: '구분1', 
      GBN2: '구분2',
      HI_0: searchParams.FR_YEAR + '(상)',
      LO_0: searchParams.FR_YEAR + '(하)', 
      HI_1: searchParams.FR_YEAR + 1+ '(상)', 
      LO_1: searchParams.FR_YEAR + 1+ '(하)', 
      HI_2: searchParams.FR_YEAR + 2+ '(상)', 
      LO_2: searchParams.FR_YEAR + 2+ '(하)',
      HI_3: searchParams.FR_YEAR + 3+ '(상)',
      LO_3: searchParams.FR_YEAR + 3+ '(하)',
      HI_4: searchParams.FR_YEAR + 4+ '(상)',
      LO_4: searchParams.FR_YEAR + 4+ '(하)',
    } 
    
    commonRequest2('hse/excel/HLTFC0020_PRINT01', { 
        data: grdMain.value.getDataProvider().getJsonRows(0,-1),
        image: [link1.href, link2.href],
        param: [columnNames, {sheetName: '년도별 현황 관리'}, {fileName: '작업환경측정 통계 (년도별 현황 관리) ' + searchParams.FR_YEAR + '년_' + (searchParams.FR_YEAR + 4) + '년' }],
        offset: { row: grdMain.value.getDataProvider().getRowCount() + 3 }
      }).then((res) => {
      // 헤더에서 파일명 추출
      const contentDisposition = res.contentDisposition;
      let fileName = 'default.xlsx';  // 기본 파일명
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = decodeURIComponent(fileNameMatch[1]);
        }
      }
      // 파일 다운로드
      const blob = new Blob([res], { type: res.type });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    })
  }
}

// 그리드 데이터 조회
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTFC0020_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  let chartData1 = []
  let chartData2 = []
  let i = 0
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  console.log(chart1.value)
  chart1.value.clear()
  chart2.value.clear()

  chartTitle.value = []
  for(var result of res.ORESULT_CUR) {
    // 왼쪽 그래프
    if(result.GBN1 == '측정인자') {    
      var title = getArrayObject(codeList.CLASSIFI, 'COD', result.GBN2)[0].TXT
      chartsOptions1.value.legend.data.push(title)
      chartData1.push({ data: getChartData(result), type: 'line', name: title, label: { show: true, position: 'top' }, itemStyle: { color: colorPaletteLine.value[i % 9] } })
      i += 1
    } else if (result.GBN1 == '초과건수') {
      chartData2.push({ data: getChartData(result), type: 'line', name: '초과건수', label: { show: true, position: 'bottom' }, itemStyle: { color: "#FF0000" } })
    } else if (result.GBN1 == '초과율') {
      chartData2.push({ data: getChartData(result), type: 'bar', yAxisIndex: 1, name: '초과율(%)', label: { show: true, position: 'top' }, tooltip: {valueFormatter: function (value) { return value + ' %' }}, itemStyle: { color: "#0581FD" } })
    }
  } 

  // 왼쪽 그래프 데이터 삽입
  chartsOptions1.value.xAxis.data = chartTitle.value
  chartsOptions1.value.series = chartData1

  // 오른쪽 그래프 데이터 삽입
  chartsOptions2.value.xAxis.data = chartTitle.value
  chartsOptions2.value.series = chartData2
  chartsOptions2.value.legend.data.push('초과건수')
  chartsOptions2.value.legend.data.push('초과율(%)')
}

const getChartData = (result) => {
  var dataList = []
  for(var j = 0; j <= 4; j++) {
    var headerYear = Number(searchParams.FR_YEAR) + j
    
    dataList.push(result['HI_' + j])
    dataList.push(result['LO_' + j])
    if(!chartTitle.value.includes(headerYear + '(상)')) {
      chartTitle.value.push(headerYear + '(상)')
    }
    if(!chartTitle.value.includes(headerYear + '(하)')) {
      chartTitle.value.push(headerYear + '(하)')
    }
  }
  return dataList
}

const getArrayObject = (array, key, value) => {
  return array.filter(obj => obj[key] === value)
}

const resizeHandler = () => {
  chart1.value.resize()
  chart2.value.resize()
}

watch(() => searchParams.FR_YEAR, (newValue, oldValue) => {
  searchParams.TO_YEAR = Number(newValue) + 4
  setGrdHeader()
  getData()
})

watch(() => searchParams.REG_DIV, (newValue, oldValue) => {
  getData()
})

watch(() => searchParams.ORGN_DIV, (newValue, oldValue) => {
  getData()
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"        
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.FR_YEAR"
            :label="$t('년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            v-model="searchParams.TO_YEAR"
            :label="$t('~')"
            label-width="10px"
            :readonly="true"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="160px"
          />
          <i-select
            v-model="searchParams.REG_DIV"
            :label="$t('구분')"
            label-width="50px"
            :items="codeList.REG_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            class="ml-4"
            v-model="searchParams.ORGN_DIV"
            :label="$t('조직구분')"
            label-width="50px"
            :items="codeList.ORGN_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          /> 
        </v-sheet>
        <v-sheet height="40%">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
          />
        </v-sheet>
        <v-sheet class="mt-2" height="50%">
          <div class="d-flex fill-height">
            <v-sheet class="h-auto" width="50%">
              <IGridTitle
                :title="$t('측정인자 분류별 현황')"
              />
              <Echart
                ref="chart1" 
                :option="chartsOptions1" 
                class="pa-0 border rounded-sm echarts_style fill-height"
              />
            </v-sheet>
            <v-sheet class="h-auto ml-2" width="50%">
              <IGridTitle
                :title="$t('초과, 초과율 현황')"
              />
              <Echart
                ref="chart2" 
                :option="chartsOptions2" 
                class="pa-0 border rounded-sm echarts_style fill-height"
              />
            </v-sheet>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
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
    min-height: 400px;
  }
}

.echarts_style {
  width: 100%;
}
</style>