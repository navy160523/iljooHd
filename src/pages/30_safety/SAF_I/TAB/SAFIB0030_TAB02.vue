<!-- 
  * Vue 내 용 : 협력사 안전관리 수준 자체평가
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/09
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/09 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from "@hiway/utils/notify"
import { isEmpty } from "@/@core/utils"
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'

defineOptions({
  name:'30_safety-SAF_I-TAB-SAFIB0030_TAB02',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopUp = ref(null)

const isVisible = ref(false)

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
      fieldName: 'DSST_INDC', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '100',
      styleName: "right-column",
      header: { text: t('재해지표(20점)') },
    },
    { 
      fieldName: 'SFTY_MNGR_CMPT_ASSM', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('안전관리자역량평가(10점)') },
    },
    { 
      fieldName: 'FCFC_INTRV', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('대면인터뷰(10점)') },
    },
    { 
      fieldName: 'SFTY_ACTVT', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('안전활동 건수(가점)') },
    },
    { 
      fieldName: 'RISK_ASSMN', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('위험성평가(10점)') },

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
      header: { text: t('모바일 작업지시(10점)') },
    },
    { 
      fieldName: 'LGL_DOCS_CERTIFIED', 
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      header: { text: t('법적서류 및 인증(가점/감점)') },
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
      header: { text: t('제도준수(15점)') },
    },
    { 
      fieldName: 'SFTY_EDCT',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      header: { text: t('안전교육(5점)') },
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
      header: { text: t('현장점검(5점)') },
    },
    { 
      fieldName: 'SFTY_INTR_WORK',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '100',
      90: "right-column",
      header: { text: t('안전개입/안전작업 요구권(5점)') },
    },
    { 
      fieldName: 'ONST_ACTV',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('현장 개선활동(가점)') }, 
    },
    { 
      fieldName: 'HCARE_HSYS',
      dataType: 'number',
      numberFormat: "#,###.##",
      width: '90',
      styleName: "right-column",
      header: { text: t('건강관리/보건 시스템 활용(10점)') },
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

    // invisible
    { 
      fieldName: 'RANK', 
      dataType: 'text',
      width: '70',
      header: { text: t('순위') },
      visible: false,
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

onMounted(() => {
})

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setBefore(beforeSearch)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

// 조회
const beforeSearch = async () => {
  if (isEmpty(searchParams.COMP_CD)) {
    return Message.err("협력사를 입력해주세요.")
  }

  return true
}

const searchData = () =>{
  searchParams.START_DATE = getStartDate(searchParams.START_YEAR, searchParams.START_QUARTER)
  searchParams.END_DATE = getEndDate(searchParams.END_YEAR, searchParams.END_QUARTER)
  
  console.log('[searchData] param: ', searchParams)

  return commonSearchApi({ queryId : 'SAFIB0030_SEARCH_02', param: searchParams })
}

// 조회 후 데이터 처리
const afterSearch = res =>{
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

const openDeptPopup = ()=>{
  let popupParam = {
    DISABLE:true,
    ASGN_NM: searchParams.COMP_NM,
  }

  deptPopUp.value.openPopup(popupParam)
}

const onDeptSelected = row =>{
  console.log('onDeptSelected : ', row)
  searchParams.BSNS_CD = row.BSNS_CD
  searchParams.ASGN_CD = row.DEPT_CD
  searchParams.COMP_CD = row.ASGN_CD
  searchParams.COMP_NM = row.ASGN_SHRT_NM
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
  <v-card-text class="pa-3 pt-0 content-area">
    <div class="d-flex flex-column fill-height">
      <v-card-title class="pa-2 py-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-sheet class="searchArea d-flex">
        <i-select
          v-model="searchParams.PERIOD"
          append-inner-icon="mdi-magnify"
          :items="dtPeriod"
          item-title="TXT"
          item-value="COD"
          :label="$t('기간')"
          label-width="80px"
          width="235px"
          required
        />
        <i-input
          v-if="isVisible"
          v-model="searchParams.START_YEAR"
          :label="$t('년도')"
          label-width="50px"
          type="Number"
          width="150px"
          required
        />
        <i-select
          v-if="isVisible"
          v-model="searchParams.START_QUARTER"
          :label="$t('분기')"
          label-width="60px"
          append-inner-icon="mdi-magnify"
          :items="dtQuater"
          item-title="TXT"
          item-value="COD"
          width="200px"
          required
        />
        <i-input
          v-if="isVisible"
          v-model="searchParams.END_YEAR"
          :label="$t('~   년도')"
          label-width="50px"
          type="Number"
          width="150px"
          required
        />
        <i-select
          v-if="isVisible"
          v-model="searchParams.END_QUARTER"
          :label="$t('분기')"
          label-width="60px"
          append-inner-icon="mdi-magnify"
          :items="dtQuater"
          item-title="TXT"
          item-value="COD"
          width="200px"
          required
        />
        <i-input
          v-model="searchParams.COMP_NM" 
          :label="t('협력사')"
          width="280px"
          label-width="60px"
          append-inner-icon="mdi-magnify"
          required
          @click:append-inner="openDeptPopup"
          @keydown.enter="openDeptPopup"
        />
      </v-sheet>
      <v-sheet
        height="35%" 
        class="mb-3"
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
      <v-sheet
        height="42%"
      >
        <VCard
          color="inputDisabled"
          variant="outlined"
          width="100%"
          height="100%"
          min-height="300"
        >
          <e-chart 
            :option="lineChartsOptions"
            class="pa-2"
          />
        </VCard>
      </v-sheet>
    </div>
    <DeptPopup 
      ref="deptPopUp" 
      @selected="onDeptSelected"
    />
  </v-card-text>
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

.chartContainer{
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
}
</style>