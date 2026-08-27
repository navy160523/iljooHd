<!-- 
  * Vue 내 용 : 협력사 안전관리 Dashboard 협력사별 평과결과 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/05/15
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/05/15 
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from "vue-i18n"
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)

const isVisible = ref(false)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  PERIOD: '1',
  START_YEAR:  dayjs().get("year"),
  END_YEAR:  dayjs().get("year"),
  START_QUARTER: '',
  END_QUARTER: '',
  START_DATE: dayjs().subtract(2, "year").format("YYYY-MM-DD"),
  END_DATE: dayjs().format("YYYY-MM-DD"),
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  COMP_CD: '',
})

/* 조회 구분 */
const dtPeriod = reactive([
  { COD: "1", TXT: "전체" },
  { COD: "2", TXT: "최근2년" },
  { COD: "3", TXT: "기간" },
])

const dtQuater = reactive([
  { COD: "1", TXT: "1분기" },
  { COD: "2", TXT: "2분기" },
  { COD: "3", TXT: "3분기" },
  { COD: "4", TXT: "4분기" },
])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    stateBar: { visible: false },
    edit: { editable: false },
    header: { height: 50 },
  },
  keys : ['YEAR','QUARTER','RANK'],
  fields : [ 
    { 
      fieldName: 'YEAR', 
      dataType: 'text',
      width: '70',
      header: { text: t('년도') },
    },
    { 
      fieldName: 'QUARTER', 
      dataType: 'text',
      width: '70',
      header: { text: t('분기') },
    },
    { 
      fieldName: 'RANK', 
      dataType: 'text',
      width: '70',
      header: { text: t('순위') },
    },
    { 
      fieldName: 'DSST_INDC', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
      header: { text: t('재해지표') },
    },
    { 
      fieldName: 'SFTY_MNGR_CMPT_ASSM', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('안전관리자역량평가') },
    },
    { 
      fieldName: 'FCFC_INTRV', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('대면인터뷰') },
    },
    { 
      fieldName: 'SFTY_ACTVT', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('안전활동 건수') },
    },
    { 
      fieldName: 'RISK_ASSMN', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('위험성평가') },

      styleCallback: function(grid,dataCell){
        let ret = {}

        if(dataCell.value < 10) {
          ret.styleName = "right-error-column"
        }
        else {
          ret.styleName = "right-column"
        }

        return ret
      },
    },
    { 
      fieldName: 'MBL_WRK_ORD',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('모바일 작업지시') },
    },
    { 
      fieldName: 'LGL_DOCS_CERTIFIED', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      header: { text: t('법적서류 및 인증') },
      styleCallback: function(grid,dataCell){
        let ret = {}

        if(dataCell.value < 0) {
          ret.styleName = "right-error-column"
        }
        else {
          ret.styleName = "right-column"
        }

        return ret
      },
    },
    { 
      fieldName: 'CMP_SYS', 
      dataType: 'number',
      numberFormat: "#,###.##", 
      width: '90',
      styleName: "right-column",
      header: { text: t('제도준수') },
    },
    { 
      fieldName: 'SFTY_EDCT',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      header: { text: t('안전교육') },
      styleCallback: function(grid,dataCell){
        let ret = {}

        if(dataCell.value < 5) {
          ret.styleName = "right-error-column"
        }
        else {
          ret.styleName = "right-column"
        }

        return ret
      },
    },
    { 
      fieldName: 'SITE_INSPC',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('현장점검') },
    },
    { 
      fieldName: 'SFTY_INTR_WORK',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '100',
      90: "right-column",
      header: { text: t('안전개입/안전작업 요구권') },
    },
    { 
      fieldName: 'ONST_ACTV',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('현장 개선활동') }, 
    },
    { 
      fieldName: 'HCARE_HSYS',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('건강관리/보건 시스템 활용') },
    },
    { 
      fieldName: 'TOTAL', 
      dataType: 'number', 
      width: '100',
      editable: false,
      styleName: "right-column",
      header: { text: t('합계(100점)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "avg",
        },
        {
          numberFormat: "#,###.##",
          expression: "max",
        },
      ],
    },
    { 
      fieldName: 'EVAL_RESULTS', dataType: 'text', 
      width: '90',
      header: { text: t('평가결과') },
    },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const lineChartsOptions = ref(
  {
    grid:{
      left:'7%',
      right:'7%',
      bottom:'7%',
    },
    tooltip: {
      trigger: 'axis',
    },
    toolbox: {
      show: true,
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
        },
        dataView: { readOnly: false },
        magicType: { type: ['line', 'bar'] },
        restore: {},
        saveAsImage: {},
      },
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: [],
      },
    ],
    yAxis: [
      {
        type: 'value',
        min: 0,
        max: 150,
        interval: 10,
      },
    ],
    series: [
      {
        name: 'Ranking',
        type: 'line',
        color:'#0BB69C',
        data: [],
        markPoint: {
          data: [
            { type: 'max', name: 'Max' },
            { type: 'min', name: 'Min' },
          ],
        },
        markLine: {
          data: [{ type: 'average', name: 'Avg' }],
        },
      },
    ],
  },
)

watch(() => searchParams.PERIOD, (newValue, oldValue) => {
  console.log('watch : ', newValue)

  if(newValue === '1') {
    isVisible.value = false
  }
  else if(newValue === '2') {
    isVisible.value = true
    searchParams.START_YEAR = dayjs().subtract(2, "year").format("YYYY")
    searchParams.END_YEAR = dayjs().format("YYYY")
    searchParams.START_QUARTER = getQuarter(new Date())
    searchParams.END_QUARTER = getQuarter(new Date())
  }
  else {
    isVisible.value = true
    searchParams.START_YEAR = dayjs().format("YYYY")
    searchParams.END_YEAR = dayjs().format("YYYY")
    searchParams.START_QUARTER = getQuarter(new Date())
    searchParams.END_QUARTER = getQuarter(new Date())
  }
})

const openPopup = val => {
  console.log("openPopup", val)
  dialog.value = true

  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.COMP_CD = val.COMP_CD
  
  onButtonsClick({ id :'btnSearch' })
}

const onClose = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if (btn.id === 'btnClose')
  {
    onClose()
  }
}

const searchData = () =>{
  searchParams.START_DATE = getStartDate(searchParams.START_YEAR, searchParams.START_QUARTER)
  searchParams.END_DATE = getEndDate(searchParams.END_YEAR, searchParams.END_QUARTER)

  console.log('[searchData] param: ', searchParams)

  return commonSearchApi({ queryId : 'SAFIB0030_SEARCH_02', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
  console.log('[afterSearch] res: ', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  loadChart()
}

const loadChart = () =>{
  let MonthArr = []
  let TotalArr = []

  grdMain.value.getGridView().getJsonRows().forEach(row => {
    let quarter = row.YEAR + '년 ' + row.QUARTER + '분기'
    MonthArr.push(quarter)
    TotalArr.push(row.TOTAL)
  })

  lineChartsOptions.value.xAxis[0].data = MonthArr
  lineChartsOptions.value.yAxis[0].max = Math.max.apply(null, TotalArr) + 5
  lineChartsOptions.value.series[0].data = TotalArr
}

const getQuarter  = date => {
  return Math.ceil((date.getMonth() + 1) / 3).toString()
}

const getStartDate  = (year, quarter) => {
  let firstDay = new Date()

  // 0 ~ 11 / 1월 ~ 12월
  if (quarter === '1') {
    firstDay = new Date(year, 0, 1)
  }
  else if(quarter === '2') {
    firstDay = new Date(year, 3, 1)
  }
  else if(quarter === '3') {
    firstDay = new Date(year, 6, 1)
  }
  else if(quarter === '4') {
    firstDay = new Date(year, 9, 1)
  }

  return dayjs(firstDay).format('YYYYMMDD')
}

const getEndDate  = (year, quarter) => {
  let lastDay = new Date()

  // 0 ~ 11 / 1월 ~ 12월
  if (quarter === '1') {
    lastDay = new Date(year, 3, 0)
  }
  else if(quarter === '2') {
    lastDay = new Date(year, 6, 0)
  }
  else if(quarter === '3') {
    lastDay = new Date(year, 9, 0)
  }
  else if(quarter === '4') {
    lastDay = new Date(year, 12, 0)
  }

  return dayjs(lastDay).format('YYYYMMDD')
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1050"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>협력사별 평과결과</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-select
              v-model="searchParams.PERIOD"
              append-inner-icon="mdi-magnify"
              :items="dtPeriod"
              item-title="TXT"
              item-value="COD"
              :label="$t('기간')"
              top-label
              label-width="100px"
              width="120px"
              required
            />
            <i-input
              v-if="isVisible"
              v-model="searchParams.START_YEAR"
              :label="$t('시작년도')"
              top-label
              label-width="100px"
              type="Number"
              width="120px"
              required
            />
            <i-select
              v-if="isVisible"
              v-model="searchParams.START_QUARTER"
              :label="$t('시작분기')"
              top-label
              label-width="100px"
              append-inner-icon="mdi-magnify"
              :items="dtQuater"
              item-title="TXT"
              item-value="COD"
              width="120px"
              required
            />
            <div 
              v-if="isVisible"
              class="pt-6 pr-4"
            >
              <span>~</span>
            </div>
            <i-input
              v-if="isVisible"
              v-model="searchParams.END_YEAR"
              :label="$t('종료년도')"
              top-label
              label-width="100px"
              type="Number"
              width="120px"
              required
            />
            <i-select
              v-if="isVisible"
              v-model="searchParams.END_QUARTER"
              :label="$t('종료분기')"
              top-label
              label-width="100px"
              append-inner-icon="mdi-magnify"
              :items="dtQuater"
              item-title="TXT"
              item-value="COD"
              width="120px"
              required
            />
          </v-sheet>
          <v-sheet
            height="30%" 
            class="mb-2"
          >
            <!-- 메인그리드 -->
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
          <v-sheet class="pa-0 h-auto">
            <v-card class="pa-0 h-auto">
              <v-card-text class="pa-0">
                <e-chart :option="lineChartsOptions" />
              </v-card-text>
            </v-card>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }
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
