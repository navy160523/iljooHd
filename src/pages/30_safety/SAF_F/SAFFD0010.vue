<!-- SAFFD0010 SLI 시뮬레이션 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import { yearMonthDay } from '@/utils/common.js'
import Echart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { color, use } from 'echarts/core'
import { LineChart , BarChart , PieChart } from 'echarts/charts'  
import { TooltipComponent , LegendComponent, GridComponent, ToolboxComponent } from 'echarts/components'
import _ from 'lodash'

defineOptions({
  name:'30_safety-SAF_F-SAFFD0010',
})

const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy 
const menuTitle = ref(null)
const gridTitle = ref(null)
const userStore = useUserStore()
const commonStore = useCommonStore()
const router = useRouter()

const grdMain = ref(null)  
const isPoint = ref(true)    // 배점관리표 영역
const chart = ref(null)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  PART_CD: '',
  DEPT_CD: '',
  USE_DIV: 'Y',
  REV: '',
  REV_DESCR: '',
  APPLY_DT: null,
  SLI_GBN: '',
  USER_ID: userStore.userId,
  FROM_DT: '',
  TO_DT: '',
  REV_SM: '',
  CHK_LIMIT: 'N'
})

//조회 버튼 조회 조건.
const params = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM_DT: yearMonthDay(0),
  TO_DT: yearMonthDay(0),
})

const codeList = reactive({
  BSNS_List: [],
  DEPT_List: [],
  PART_List: [],
  REVList: [],
  SLI_LIST: []
})

const headers = reactive({
  header01: ['적용일자',' 비고 ','비율(%)'],                    // 기간별 감률
  header02: ['위험도 등급','현장 위험도(%)','가중치(%)'],      // 위험도 등급별
  header03: ['부서인원(인)', '가중치(%)'],                    // 인원별
  header04: ['기간(월)', '가중치(%)'],                       // 취약항목 반복
  header05: ['유형', '감점'],                        // 안전수칙
  header06: ['사고유형', '감점'],                     // 안전사고
  header07: ['유형', '감/가점'],                             // 안전교육
  header08: ['유형', '감/가점'],                             // 위험성평가
  header09: ['확인율(%)', '감점'],                           // 현장 위험성평가(전일)
  header10: ['실적 기준', '비고', '값'],                     // 안전점검
  // header11: ['실적 기준', '비고', '점수'],            // 안전점검2
  header11: ['실적 기준', '가점'],            // 안전점검2
  // header12: ['실적 기준', '감/가점'],                        // 안전점검3
  header12: ['실적 기준', '점수'],                        // 안전점검3
})

const dataList = reactive({
  data1: [],
  data2: [],
  data3: [],
  data4: [],
  data5: [],
  data6: [],
  data7: [],
  data8: [],
  data9: [],
  data10: [],
  data11: [],
})

const chartsOptions = reactive({
  title: {
    text: '',
    left: 'center',
    top: '5%',
    textStyle: {
      fontSize: 26
    }
  },
  grid: {
    top: '20%',
    height: '67%',
    containLabel: true
  },
  legend: {
    data: ['위반[건]', 'R', 'SM', '증감율'],
    bottom: '1%'
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: [
    {
      type: 'value',
      name: '건',
      position: 'left',
      alignTicks: true,
      axisLine: {
        show: true
      },
      // axisLabel: {
      //   formatter: '{value} ml'
      // }
    },
    {
      type: 'value',
      name: '감점',
      position: 'right',
      axisLine: {
        show: true,
      },
    },
    {
      type: 'value',
      name: '증감울',
      position: 'right',
      offset: 35,
      axisLine: {
        show: true,
      },
    }
  ],
  series: [
    {
      name: '위반[건]',
      type: 'bar',
      data: [],
      yAxisIndex: 0,
    },
    {
      name: 'R',
      type: 'line',
      data: [],
      yAxisIndex: 1,
      label: {
        show: true,
        position: 'top'
      },
    },
    {
      name: 'SM',
      type: 'line',
      data: [],
      yAxisIndex: 1,
      label: {
        show: true,
        position: 'top'
      },
    },
    {
      name: '증감율',
      type: 'line',
      data: [],
      yAxisIndex: 2,
      label: {
        show: true,
        position: 'top'
      },
    }
  ],
})

// 그리드 fields, column, layout 
const gridSetList = reactive({
  fieldsAll: [
    { fieldName: 'YYYYMMDD', dataType: 'text', header: { text: t('일자') }, mergeRule: { criteria: 'value' }, width:'90'},
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, mergeRule: { criteria: 'value' }, width:'100'},
    { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문') }, mergeRule: { criteria: 'value' }, width:'100'},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, mergeRule: { criteria: 'value' }, width:'135'},
    { fieldName: 'REV', dataType: 'text', header: { text: t('배점\n기준'), styleName: 'header_column' }, width:'60'},
    { fieldName: 'GRADE', dataType: 'text', header: { text: t('등급') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width:'50'},
    { fieldName: 'PERSONNEL', dataType: 'text', header: { text: t('인원') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width:'60'},

    /* *********************************** 안전사고 *********************************** */
    { fieldName: 'ACC_COUNT_A', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'ACC_MPOINT_A', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'ACC_COUNT_B', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'ACC_MPOINT_B', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'ACC_COUNT_C', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'ACC_MPOINT_C', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'ACC_COUNT_D', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'ACC_MPOINT_D', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'ACC_COUNT_E', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'ACC_MPOINT_E', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'ACC_COUNT_F', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'ACC_MPOINT_F', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'ACC_COUNT_TOT', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'ACC_MPOINT_TOT', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'ACC_POINT', dataType: 'text', header: { text: t('점수') }, width: '80'},
    { fieldName: 'ACC_MAX_POINT', dataType: 'text', header: { text: t('배점') }, width: '80'},

    /* *********************************** 안전수칙 *********************************** */
    { fieldName: 'RUL_COUNT_A', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'RUL_MPOINT_A', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'RUL_COUNT_B', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'RUL_MPOINT_B', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'RUL_COUNT_F', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'RUL_MPOINT_F', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'RUL_COUNT_C', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'RUL_MPOINT_C', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'RUL_COUNT_D', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'RUL_MPOINT_D', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'RUL_COUNT_E', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'RUL_MPOINT_E', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'RUL_COUNT_TOT', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'RUL_MPOINT_TOT', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'RUL_POINT', dataType: 'text', header: { text: t('점수') }, width: '80'},
    { fieldName: 'RUL_MAX_POINT', dataType: 'text', header: { text: t('배점') }, width: '80'},

    /* *********************************** 안전교육 *********************************** */
    { fieldName: 'EDU_COUNT_A', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'EDU_MPOINT_A', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'EDU_COUNT_B', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'EDU_MPOINT_B', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'EDU_COUNT_C', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'EDU_MPOINT_C', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'EDU_COUNT_D', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'EDU_MPOINT_D', dataType: 'text', header: { text: t('가점') }, width: '80'},
    { fieldName: 'EDU_COUNT_E', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'EDU_MPOINT_E', dataType: 'text', header: { text: t('가점') }, width: '80'},
    { fieldName: 'EDU_COUNT_TOT', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'EDU_MPOINT_TOT', dataType: 'text', header: { text: t('감/가점') }, width: '80'},
    { fieldName: 'EDU_POINT', dataType: 'text', header: { text: t('점수') }, width: '80'},
    { fieldName: 'EDU_MAX_POINT', dataType: 'text', header: { text: t('배점') }, width: '80'},

    /* *********************************** 위험성평가 *********************************** */
    { fieldName: 'DNG_COUNT_A', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'DNG_MPOINT_A', dataType: 'text', header: { text: t('감점') }, width: '80'},
    // { fieldName: 'DNG_COUNT_B', dataType: 'text', header: { text: t('건수') },
    //   mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
    //   width: '85'},
    // { fieldName: 'DNG_MPOINT_B', dataType: 'text', header: { text: t('가점') }, width: '85'},
    { fieldName: 'DNG_COUNT_D', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'DNG_MPOINT_D', dataType: 'text', header: { text: t('감점') }, width: '80'},
    { fieldName: 'DNG_COUNT_C', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'DNG_MPOINT_C', dataType: 'text', header: { text: t('가점') },width: '80'},
    { fieldName: 'DNG_COUNT_TOT', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'DNG_MPOINT_TOT', dataType: 'text', header: { text: t('감/가점') }, width: '80'},
    { fieldName: 'DNG_POINT', dataType: 'text', header: { text: t('점수') }, width: '80'},
    { fieldName: 'DNG_MAX_POINT', dataType: 'text', header: { text: t('배점') }, width: '80'},

    /* *********************************** 안전점검 *********************************** */
    { fieldName: 'CHK_COUNT_A', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'CHK_MPOINT_A', dataType: 'text', header: { text: t('가점') }, width: '80'},
    { fieldName: 'CHK_COUNT_B', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'CHK_MPOINT_B', dataType: 'text', header: { text: t('가점') }, width: '80'},
    { fieldName: 'CHK_COUNT_C', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'CHK_MPOINT_C', dataType: 'text', header: { text: t('감점') }, width: '80'},
    // { fieldName: 'CHK_COUNT_D', dataType: 'text', header: { text: t('건수') },
    //   mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
    //   width: '80'},
    // { fieldName: 'CHK_MPOINT_D', dataType: 'text', header: { text: t('감/가점') }, width: '80'},
    { fieldName: 'CHK_COUNT_E', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'CHK_MPOINT_E', dataType: 'text', header: { text: t('점수') }, width: '80'},
    { fieldName: 'CHK_COUNT_F', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'CHK_MPOINT_F', dataType: 'text', header: { text: t('가점') }, width: '80'},
    { fieldName: 'CHK_COUNT_TOT', dataType: 'text', header: { text: t('건수') },
      mergeRule: { criteria: "values['YYYYMMDD'] + values['BSNS_NM'] + values['PART_NM'] + values['DEPT_NM'] + value" },
      width: '80'},
    { fieldName: 'CHK_MPOINT_TOT', dataType: 'text', header: { text: t('감/가점') }, width: '80'},
    { fieldName: 'CHK_POINT', dataType: 'text', header: { text: t('점수') }, width: '80'},
    { fieldName: 'CHK_MAX_POINT', dataType: 'text', header: { text: t('배점') }, width: '80'},
  ],
  /* *********************************** 전체 선택 layout *********************************** */
  columnLayoutAll: [
    'YYYYMMDD', 'BSNS_NM', 'PART_NM', 'DEPT_NM', 'REV', 
    {
      direction: 'horizontal',
      items: ['GRADE', 'PERSONNEL'],
      header: { text: t('가중치') },
    },
    {
      direction: 'horizontal',
      items: [
        { direction: 'horizontal', items: ['ACC_COUNT_A' , 'ACC_MPOINT_A'], header: { text: t('중대재해')}},
        { direction: 'horizontal', items: ['ACC_COUNT_B' , 'ACC_MPOINT_B'], header: { text: t('중대성사고')}},
        { direction: 'horizontal', items: ['ACC_COUNT_C' , 'ACC_MPOINT_C'], header: { text: t('산재사고')}},
        { direction: 'horizontal', items: ['ACC_COUNT_D' , 'ACC_MPOINT_D'], header: { text: t('휴업사고')}},
        { direction: 'horizontal', items: ['ACC_COUNT_E' , 'ACC_MPOINT_E'], header: { text: t('일반사고')}},
        { direction: 'horizontal', items: ['ACC_COUNT_F' , 'ACC_MPOINT_F'], header: { text: t('사고지연보고')}},
        { direction: 'horizontal', items: ['ACC_COUNT_TOT' , 'ACC_MPOINT_TOT'], header: { text: t('총')}},
        'ACC_POINT'
        // { direction: 'horizontal', items: ['ACC_POINT' , 'ACC_MAX_POINT'], header: { text: t('환산점수')}},
      ],
      header: { text: t('안전사고(20)') },
    },
    {
      direction: 'horizontal',
      items: [
        { direction: 'horizontal', items: ['RUL_COUNT_A' , 'RUL_MPOINT_A'], header: { text: t('절대수칙')}},
        { direction: 'horizontal', items: ['RUL_COUNT_B' , 'RUL_MPOINT_B'], header: { text: t('중대성수칙')}},
        { direction: 'horizontal', items: ['RUL_COUNT_F' , 'RUL_MPOINT_F'], header: { text: t('크레인 특별안전수칙')}},
        { direction: 'horizontal', items: ['RUL_COUNT_C' , 'RUL_MPOINT_C'], header: { text: t('작업중지')}},
        { direction: 'horizontal', items: ['RUL_COUNT_D' , 'RUL_MPOINT_D'], header: { text: t('시정통보')}},
        { direction: 'horizontal', items: ['RUL_COUNT_E' , 'RUL_MPOINT_E'], header: { text: t('일반수칙')}},
        { direction: 'horizontal', items: ['RUL_COUNT_TOT' , 'RUL_MPOINT_TOT'], header: { text: t('총')}},
        'RUL_POINT'
        // { direction: 'horizontal', items: ['RUL_POINT' , 'RUL_MAX_POINT'], header: { text: t('환산점수')}},
      ],
      header: { text: t('안전수칙(20)') },
    },
    {
      direction: 'horizontal',
      items: [
        { direction: 'horizontal', items: ['EDU_COUNT_A' , 'EDU_MPOINT_A'], header: { text: t('정기안전보건교육')}},
        { direction: 'horizontal', items: ['EDU_COUNT_B' , 'EDU_MPOINT_B'], header: { text: t('관리감독자 안전보건교육')}},
        { direction: 'horizontal', items: ['EDU_COUNT_C' , 'EDU_MPOINT_C'], header: { text: t('단기공사 안전교육')}},
        { direction: 'horizontal', items: ['EDU_COUNT_D' , 'EDU_MPOINT_D'], header: { text: t('사내강사(내국인) 등록')}},
        { direction: 'horizontal', items: ['EDU_COUNT_E' , 'EDU_MPOINT_E'], header: { text: t('사내강사(외국인) 등록')}},
        { direction: 'horizontal', items: ['EDU_COUNT_TOT' , 'EDU_MPOINT_TOT'], header: { text: t('총')}},
        'EDU_POINT'
        // { direction: 'horizontal', items: ['EDU_POINT' , 'EDU_MAX_POINT'], header: { text: t('환산점수')}},
      ],
      header: { text: t('안전교육(20)') },
    },
    {
      direction: 'horizontal',
      items: [
        { direction: 'horizontal', items: ['DNG_COUNT_A' , 'DNG_MPOINT_A'], header: { text: t('수시 위험성평가(안전사고)')}},
        //{ direction: 'horizontal', items: ['DNG_COUNT_B' , 'DNG_MPOINT_B'], header: { text: t('수시 위험성평가(비일상작업)')}},
        { direction: 'horizontal', items: ['DNG_COUNT_D' , 'DNG_MPOINT_D'], header: { text: t('현장 위험성평가')}},
        { direction: 'horizontal', items: ['DNG_COUNT_C' , 'DNG_MPOINT_C'], header: { text: t('안전작업요구권/안전제보')}},
        { direction: 'horizontal', items: ['DNG_COUNT_TOT' , 'DNG_MPOINT_TOT'], header: { text: t('총')}},
        'DNG_POINT'
        // { direction: 'horizontal', items: ['DNG_POINT' , 'DNG_MAX_POINT'], header: { text: t('환산점수')}},
      ],
      header: { text: t('위험성평가(20)') },
    },
    {
      direction: 'horizontal',
      items: [
        { direction: 'horizontal', items: ['CHK_COUNT_A' , 'CHK_MPOINT_A'], header: { text: t('일상점검')}},
        { direction: 'horizontal', items: ['CHK_COUNT_C' , 'CHK_MPOINT_C'], header: { text: t('취약항목 실적 미달')}},
        { direction: 'horizontal', items: ['CHK_COUNT_B' , 'CHK_MPOINT_B'], header: { text: t('일상(3일평균)')}},
        //{ direction: 'horizontal', items: ['CHK_COUNT_D' , 'CHK_MPOINT_D'], header: { text: t('일상점검(안전요원)')}},
        { direction: 'horizontal', items: ['CHK_COUNT_E' , 'CHK_MPOINT_E'], header: { text: t('PTW 점검(3중)')}},
        { direction: 'horizontal', items: ['CHK_COUNT_F' , 'CHK_MPOINT_F'], header: { text: t('부서관리작업 점검')}},
        { direction: 'horizontal', items: ['CHK_COUNT_TOT' , 'CHK_MPOINT_TOT'], header: { text: t('총')}},
        'CHK_POINT'
        // { direction: 'horizontal', items: ['CHK_POINT' , 'CHK_MAX_POINT'], header: { text: t('환산점수')}},
      ],
      header: { text: t('안전점검/개입(20)') },
    },
  ],
  columnLayoutA: [
  'YYYYMMDD', 'BSNS_NM', 'PART_NM', 'DEPT_NM', 'REV', 
    {
      direction: 'horizontal',
      items: ['GRADE', 'PERSONNEL'],
      header: { text: t('가중치') },
    },
    {
      direction: 'horizontal',
      items: [
        { direction: 'horizontal', items: ['ACC_COUNT_A' , 'ACC_MPOINT_A'], header: { text: t('중대재해')}},
        { direction: 'horizontal', items: ['ACC_COUNT_B' , 'ACC_MPOINT_B'], header: { text: t('중대성사고')}},
        { direction: 'horizontal', items: ['ACC_COUNT_C' , 'ACC_MPOINT_C'], header: { text: t('산재사고')}},
        { direction: 'horizontal', items: ['ACC_COUNT_D' , 'ACC_MPOINT_D'], header: { text: t('휴업사고')}},
        { direction: 'horizontal', items: ['ACC_COUNT_E' , 'ACC_MPOINT_E'], header: { text: t('일반사고')}},
        { direction: 'horizontal', items: ['ACC_COUNT_F' , 'ACC_MPOINT_F'], header: { text: t('사고지연보고')}},
        { direction: 'horizontal', items: ['ACC_COUNT_TOT' , 'ACC_MPOINT_TOT'], header: { text: t('총')}},
        { direction: 'horizontal', items: ['ACC_POINT' , 'ACC_MAX_POINT'], header: { text: t('환산점수')}},
      ],
      header: { text: t('안전사고') },
    },
  ],
  columnLayoutB: [
  'YYYYMMDD', 'BSNS_NM', 'PART_NM', 'DEPT_NM', 'REV', 
    {
      direction: 'horizontal',
      items: ['GRADE', 'PERSONNEL'],
      header: { text: t('가중치') },
    },
    {
      direction: 'horizontal',
      items: [
        { direction: 'horizontal', items: ['RUL_COUNT_A' , 'RUL_MPOINT_A'], header: { text: t('절대수칙')}},
        { direction: 'horizontal', items: ['RUL_COUNT_B' , 'RUL_MPOINT_B'], header: { text: t('중대성수칙')}},
        { direction: 'horizontal', items: ['RUL_COUNT_F' , 'RUL_MPOINT_F'], header: { text: t('크레인 특별안전수칙')}},
        { direction: 'horizontal', items: ['RUL_COUNT_C' , 'RUL_MPOINT_C'], header: { text: t('작업중지')}},
        { direction: 'horizontal', items: ['RUL_COUNT_D' , 'RUL_MPOINT_D'], header: { text: t('시정통보')}},
        { direction: 'horizontal', items: ['RUL_COUNT_E' , 'RUL_MPOINT_E'], header: { text: t('일반수칙')}},
        { direction: 'horizontal', items: ['RUL_COUNT_TOT' , 'RUL_MPOINT_TOT'], header: { text: t('총')}},
        { direction: 'horizontal', items: ['RUL_POINT' , 'RUL_MAX_POINT'], header: { text: t('환산점수')}},
      ],
      header: { text: t('안전수칙') },
    },
  ],
  columnLayoutC: [
  'YYYYMMDD', 'BSNS_NM', 'PART_NM', 'DEPT_NM', 'REV', 
    {
      direction: 'horizontal',
      items: ['GRADE', 'PERSONNEL'],
      header: { text: t('가중치') },
    },
    {
      direction: 'horizontal',
      items: [
        { direction: 'horizontal', items: ['EDU_COUNT_A' , 'EDU_MPOINT_A'], header: { text: t('정기')}},
        { direction: 'horizontal', items: ['EDU_COUNT_B' , 'EDU_MPOINT_B'], header: { text: t('관리감독자')}},
        { direction: 'horizontal', items: ['EDU_COUNT_C' , 'EDU_MPOINT_C'], header: { text: t('단기공사')}},
        { direction: 'horizontal', items: ['EDU_COUNT_D' , 'EDU_MPOINT_D'], header: { text: t('사내강사(내국인)')}},
        { direction: 'horizontal', items: ['EDU_COUNT_E' , 'EDU_MPOINT_E'], header: { text: t('사내강사(외국인)')}},
        { direction: 'horizontal', items: ['EDU_COUNT_TOT' , 'EDU_MPOINT_TOT'], header: { text: t('총')}},
        { direction: 'horizontal', items: ['EDU_POINT' , 'EDU_MAX_POINT'], header: { text: t('환산점수')}},
      ],
      header: { text: t('안전교육') },
    },
  ],
  columnLayoutD: [  
  'YYYYMMDD', 'BSNS_NM', 'PART_NM', 'DEPT_NM', 'REV', 
    {
      direction: 'horizontal',
      items: ['GRADE', 'PERSONNEL'],
      header: { text: t('가중치') },
    },
    {
      direction: 'horizontal',
      items: [
        { direction: 'horizontal', items: ['DNG_COUNT_A' , 'DNG_MPOINT_A'], header: { text: t('수시(안전사고)')}},
        //{ direction: 'horizontal', items: ['DNG_COUNT_B' , 'DNG_MPOINT_B'], header: { text: t('수시(비일상)')}},
        { direction: 'horizontal', items: ['DNG_COUNT_D' , 'DNG_MPOINT_D'], header: { text: t('현장 위험성평가')}},
        { direction: 'horizontal', items: ['DNG_COUNT_C' , 'DNG_MPOINT_C'], header: { text: t('안전작업요구권')}},
        { direction: 'horizontal', items: ['DNG_COUNT_TOT' , 'DNG_MPOINT_TOT'], header: { text: t('총')}},
        { direction: 'horizontal', items: ['DNG_POINT' , 'DNG_MAX_POINT'], header: { text: t('환산점수')}},
      ],
      header: { text: t('위험성평가') },
    },
  ],
  columnLayoutE: [
  'YYYYMMDD', 'BSNS_NM', 'PART_NM', 'DEPT_NM', 'REV', 
    {
      direction: 'horizontal',
      items: ['GRADE', 'PERSONNEL'],
      header: { text: t('가중치') },
    },
    {
      direction: 'horizontal',
      items: [
        { direction: 'horizontal', items: ['CHK_COUNT_A' , 'CHK_MPOINT_A'], header: { text: t('일상점검')}},
        { direction: 'horizontal', items: ['CHK_COUNT_B' , 'CHK_MPOINT_B'], header: { text: t('일상(3일평균)')}},
        { direction: 'horizontal', items: ['CHK_COUNT_C' , 'CHK_MPOINT_C'], header: { text: t('취약항목 실적등록')}},
        //{ direction: 'horizontal', items: ['CHK_COUNT_D' , 'CHK_MPOINT_D'], header: { text: t('일상(안전요원)')}},
        { direction: 'horizontal', items: ['CHK_COUNT_E' , 'CHK_MPOINT_E'], header: { text: t('PTW 점검(3중)')}},
        { direction: 'horizontal', items: ['CHK_COUNT_F' , 'CHK_MPOINT_F'], header: { text: t('부서관리작업')}},
        { direction: 'horizontal', items: ['CHK_COUNT_TOT' , 'CHK_MPOINT_TOT'], header: { text: t('총')}},
        { direction: 'horizontal', items: ['CHK_POINT' , 'CHK_MAX_POINT'], header: { text: t('환산점수')}},
      ],
      header: { text: t('안전점검/개입') },
    },
  ]
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [],
  columns : [],
  columnLayout: [],
})

grdMainProps.fields = gridSetList.fieldsAll
grdMainProps.columns = gridSetList.fieldsAll
grdMainProps.columnLayout = gridSetList.columnLayoutAll

//버튼 클릭이벤트
const onButtonsClick = async btn => {

  //조회
  if (btn.id === 'btnSearch') {
    console.log('psrams ', params)
    searchParam.FROM_DT = params.FROM_DT.replace(/-/g, "")
    searchParam.TO_DT = params.TO_DT.replace(/-/g, "")
    commonSearchApi({ queryId: 'SAFFD0010_SEARCH_02', param: searchParam }).then(res => {
      console.log('SAFFD0010_SEARCH_02 :::: ', res)
      const data = res.ORESULT_CUR
      for(let i = 0; i < data.length; i++) {
        data[i].REV = data[i].REV + ''
      }
      if(data.length > 1) {
        Message.info(t('조회기간에 버전이 여러개 존재합니다.<br/>버전을 선택해 주세요.'))
      }
      codeList.REVList = data
      searchParam.REV = ''
      searchParam.APPLY_DT = ''

      if (res.ORESULT_CUR.length === 1) {
        searchParam.REV = res.ORESULT_CUR[0].REV
      }

      pointeSearch()
    })
    
  }else if(btn.id === 'btnRskCopyApp'){
    // 배점관리표 적용
    console.log('dataList ', dataList)
    const saveData = []

    for (let i = 1; i <= 11; i++) { 
      saveData.push(...dataList['data' + i])
    }

    console.log('saveData ', saveData)
    console.log('searchParam ', searchParam)

    searchParam.FROM_DT = params.FROM_DT.replace(/-/g, "")
    searchParam.TO_DT = params.TO_DT.replace(/-/g, "")
    await commonExecuteApi({ queryId: 'SAFFD0010_SAVE_01', list: saveData }).then(res => {

      console.log('SAFFD0010_SAVE_01 ::: ', res)

    })     


    //조회
    await commonSearchApi({ queryId: 'SAFFD0010_SEARCH_03', param: searchParam }).then(res => {
      console.log('SAFFD0010_SEARCH_03 :::: ', res)
      if (res.ORESULT_CUR.length > 0) {
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      } else {
        grdMain.value.getDataProvider().setRows(null)
      }
    })
  } else if(btn.id === 'btnRowCopy') {
    // console.log('dataList.data1', dataList.data1)

    for(let i = 1; i <= 11; i++) {
      for(let j = 0; j < dataList['data' + i].length; j++) {
        dataList['data' + i][j].SIMULATION = dataList['data' + i][j].VALUE01
      }
    }
  } else if(btn.id === 'btnCreate') {
    let dialogResult = await vm.$swal({ 
      title: t('현재 시뮬레이션 값으로 배점관리표 새 버전을 생성하시겠습니까?'), 
      showCancelButton: true,
    })
      
    if(!dialogResult.isConfirmed) {
      return false
    }

    const saveData = []

    for (let i = 1; i <= 11; i++) {
      saveData.push(...dataList['data' + i])
    }

    // console.log('saveData', saveData)
    
    commonExecuteApi({ queryId: 'SAFFD0010_SAVE_01', list: saveData }).then(res => {
      commonExecuteApi({ queryId: 'SAFFD0010_SAVE_02', list: [{ CMPNY_DIV: searchParam.CMPNY_DIV, REV: searchParam.REV, REV_SM: searchParam.REV_SM }] }).then(res => {
        Message.success(t('배점관리표가 생성되었습니다.'))

        router.push('/30_safety/SAF_F/SAFFD0020')
      })
    })
  }
}

/* ******************** 버전 선택시 ******************** */
const pointeSearch = () => {

  console.log('codeList.REVList ', codeList.REVList)

  console.log('length ', codeList.REVList.length)

  // if (codeList.REVList.length === 0) {
  //   return;
  // }


  commonSearchApi({ queryId : 'SAFFD0020_SEARCH_02', param: searchParam }).then(res => {
    // console.log('SAFFD0020_SEARCH_02 res', res)
    for (let i = 1; i <= 11; i++){
      for (let j = 0; j < res['ORESULT_CUR' + i].length; j++){
        res['ORESULT_CUR' + i][j].REV_SM = searchParam.REV_SM
      }
      dataList['data' + i] = res['ORESULT_CUR' + i]
    }

    // console.log('dataList', dataList)
  })

  

  codeList.REVList.forEach(e => {
    if(searchParam.REV === e.REV){
      searchParam.APPLY_DT = e.APPLY_DT ? dayjs(e.APPLY_DT).format('YYYY-MM-DD') : ''

      if (codeList.REVList.length > 1) {
        console.log('if(codeList.REVList.length >) ', codeList.REVList)
        console.log('dayjs(e.FROM_DT_ALL).format ', dayjs(e.FROM_DT_ALL).format('YYYY-MM-DD'))
        params.FROM_DT = e.FROM_DT_ALL ? dayjs(e.FROM_DT_ALL).format('YYYY-MM-DD') : ''
        params.TO_DT = e.TO_DT_ALL ? dayjs(e.TO_DT_ALL).format('YYYY-MM-DD') : ''
      }
    }
  })
}

/* ******************** SLI항목 선택시 ******************** */
const sliSelect = e => {
  /* ******************** SLI항목에 따라 그리드 layout 변경 ******************** */
  if(e === 'A'){
    grdMain.value.getGridView().setColumnLayout(gridSetList.columnLayoutA)  // 안전사고
  }else if(e === 'B'){
    grdMain.value.getGridView().setColumnLayout(gridSetList.columnLayoutB)  // 안전수칙
  }else if(e === 'C'){
    grdMain.value.getGridView().setColumnLayout(gridSetList.columnLayoutC)  // 안전교육
  }else if(e === 'D'){
    grdMain.value.getGridView().setColumnLayout(gridSetList.columnLayoutD)  // 위험성평가
  }else if(e === 'E'){
    grdMain.value.getGridView().setColumnLayout(gridSetList.columnLayoutE)  // 안전점검
  }else {
    grdMain.value.getGridView().setColumnLayout(gridSetList.columnLayoutAll)  // 전체
  }
}

const bsnsChange = e => {
  searchParam.PART_CD = ''
  searchParam.DEPT_CD = ''
  codeList.DEPT_List = [{ ASGN_NM: '전체', ASGN_CD: '' }]
  Promise.all([
    commonSearchApi({queryId : 'SAFFB0010_search03', param : searchParam }),
  ]).then(res => {
    codeList.PART_List = res[0].ORESULT_CUR
    codeList.PART_List.unshift({ PART_NM: '전체', PART_CD: '' })
  })
}

const partChange = e => {
  searchParam.DEPT_CD = ''
  Promise.all([
    commonSearchApi({queryId : 'SAFFB0010_search04', param : searchParam }),
  ]).then(res => {
    codeList.DEPT_List = res[0].ORESULT_CUR
    codeList.DEPT_List.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
  })
}

const initCodeList = () => {
  Promise.all([
    //사업부조회
    commonSearchApi({queryId : 'SAFFB0010_search02', param : searchParam }),
    //부문조회
    commonSearchApi({queryId : 'SAFFB0010_search03', param : searchParam }),
    //부서조회
    commonSearchApi({queryId : 'SAFFB0010_search04', param : searchParam }),
    // 버전 리스트 조회
    commonSearchApi({
      queryId: 'SAFFD0010_SEARCH_02'
      , param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        FROM_DT: searchParam.FROM_DT,
        TO_DT: searchParam.TO_DT,
      }
    }),

    // SLI 항목
    getCodeList('HHIS310010'),

    // SLI 키값 조회
    commonSearchApi({ queryId : 'SAFFD0010_SEARCH_01', param: {} }),
  ]).then((res) => {
    codeList.BSNS_List = res[0].ORESULT_CUR
    codeList.PART_List.unshift({ PART_NM: '전체', PART_CD: '' })
    codeList.DEPT_List.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    // codeList.PART_List = res[1].ORESULT_CUR
    // codeList.DEPT_List = res[2].ORESULT_CUR
    console.log('res[3].ORESULT_CUR ', res[3].ORESULT_CUR)
    codeList.REVList = res[3].ORESULT_CUR
    codeList.SLI_LIST = res[4].ORESULT_CUR

    searchParam.REV_SM = res[5].ORESULT_CUR[0].REV_SM

    console.log('searchParam.REV_SM ', searchParam.REV_SM)

    codeList.BSNS_List.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.PART_List.unshift({ ASGN_SHRT_NM: '전체', ASGN_CD: '' })
    codeList.DEPT_List.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.SLI_LIST.unshift({ TXT: '전체', COD: '' })

    /* 마지막 버전으로 초기값 세팅 */
    if (res[3].ORESULT_CUR.length > 0) {
      
      searchParam.REV = res[3].ORESULT_CUR[res[3].ORESULT_CUR.length - 1].REV
      searchParam.REV_DESCR = res[3].ORESULT_CUR[res[3].ORESULT_CUR.length - 1].REV_DESCR
      searchParam.APPLY_DT = res[3].ORESULT_CUR[res[3].ORESULT_CUR.length - 1].APPLY_DT ? dayjs(res[3].ORESULT_CUR[res[3].ORESULT_CUR.length - 1].APPLY_DT).format('YYYY-MM-DD') : ''
    }

    pointeSearch()
    chart.value.setOption(chartsOptions)

    // 그리드 인원(가중치)열 까지 고정
    grdMain.value.getGridView().setFixedOptions({ colCount: 6 })



    // onButtonsClick({id: 'btnSearch'})
  })
}

 
const rowChanged = (grid, oldRow, newRow) => {
  // grdMain.value.getDataProvider().setRows(null)
  if (oldRow === -1) {
    newRow = 0
  }

  console.log('grid ', grid)
  let rowData = grdMain.value.getDataProvider().getJsonRow(newRow)

  let r2RowData = ''
  let smRowData = ''
  // if (rowData.REV === 'R0') {
    
  // } else

    if (rowData.REV === 'SM') {
      r2RowData = grdMain.value.getDataProvider().getJsonRow(newRow-1)
      smRowData = grdMain.value.getDataProvider().getJsonRow(newRow)
    } else {
      r2RowData = grdMain.value.getDataProvider().getJsonRow(newRow)
      smRowData = grdMain.value.getDataProvider().getJsonRow(newRow+1)
    }

  console.log('smRowData ', smRowData)
  console.log('r2RowData ', r2RowData)
  console.log('codeList.SLI_LIST ', codeList.SLI_LIST)

  let barData = []
  let lineData1 = []
  let lineData2 = []
  let lineData3 = []

  //R0~ RowData
  Object.keys(r2RowData).forEach(key => {
    if (searchParam.SLI_GBN === 'A') {
      //안전사고
      if (key.indexOf('ACC_COUNT_') > -1) {
        barData.push(r2RowData[key])
      }
      if (key.indexOf('ACC_MPOINT_') > -1) {
        lineData1.push(r2RowData[key])
      }
    } else if (searchParam.SLI_GBN === 'B') {
      //안전수칙
      if (key.indexOf('RUL_COUNT_') > -1) {
        barData.push(r2RowData[key])
      }
      if (key.indexOf('RUL_MPOINT_') > -1) {
        lineData1.push(r2RowData[key])
      }
      
    } else if (searchParam.SLI_GBN === 'C') {
      //안전교육
      if (key.indexOf('EDU_COUNT_') > -1) {
        barData.push(r2RowData[key])
      }
      if (key.indexOf('EDU_MPOINT_') > -1) {
        lineData1.push(r2RowData[key])
      }
    } else if (searchParam.SLI_GBN === 'D') {
      //위험성평가
      if (key.indexOf('DNG_COUNT_') > -1) {
        barData.push(r2RowData[key])
      }
      if (key.indexOf('DNG_MPOINT_') > -1) {
        lineData1.push(r2RowData[key])
      }
    } else if (searchParam.SLI_GBN === 'E') {
      //안전점검
      if (key.indexOf('CHK_COUNT_') > -1) {
        barData.push(r2RowData[key])
      }
      if (key.indexOf('CHK_MPOINT_') > -1) {
        lineData1.push(r2RowData[key])
      }
    } else if (searchParam.SLI_GBN === '') {
      if (key.indexOf('COUNT_TOT') > -1) {
        barData.push(r2RowData[key])
      }
      if (key.indexOf('MPOINT_TOT') > -1) {
        lineData1.push(r2RowData[key])
      }
      
    }
    
   })

   //SM~ RowData
   Object.keys(smRowData).forEach(key => {
     if (searchParam.SLI_GBN === 'A') { 
        //안전사고
        if (key.indexOf('ACC_MPOINT_') > -1) {
          lineData2.push(smRowData[key])
        }
     }else if (searchParam.SLI_GBN === 'B') { 
        //안전수칙
        if (key.indexOf('RUL_MPOINT_') > -1) {
          lineData2.push(smRowData[key])
        }
     }else if (searchParam.SLI_GBN === 'C') { 
        //안전교육
        if (key.indexOf('EDU_MPOINT_') > -1) {
          lineData2.push(smRowData[key])
        }
     }else if (searchParam.SLI_GBN === 'D') { 
        //위험성평가
        if (key.indexOf('DNG_MPOINT_') > -1) {
          lineData2.push(smRowData[key])
        }
     }else if (searchParam.SLI_GBN === 'E') { 
        //안전점검
        if (key.indexOf('CHK_MPOINT_') > -1) {
          lineData2.push(smRowData[key])
        }
     } else if (searchParam.SLI_GBN === '') {
       if (key.indexOf('MPOINT_TOT') > -1) {
          lineData2.push(smRowData[key])
        }
     }
   })

  console.log('barData ', barData)
  console.log('barData.length ', barData.length)

   let sum1 = 0
   let sum2 = 0
   let sum3 = 0
   let sum4 = 0

  for (let i = 0; i < barData.length; i++){

    let cal = 0

    cal = Number(lineData1[i]) === 0 ? 0 : (Number(lineData2[i]) - Number(lineData1[i])) / Math.abs(Number(lineData1[i])) * 100
    cal = cal.toFixed(2)
    console.log('cal ', cal)

    lineData3.push(cal)
    sum1 = Number(sum1) + Number(barData[i])
    sum2 = Number(sum2) + Number(lineData1[i])//).toFixed(2)
    sum3 = Number(sum3) + Number(lineData2[i])//).toFixed(2)
    // sum4 = Number(sum4) + Number(lineData3[i])//).toFixed(2)
  }

  // console.log('chart ', chart)
  console.log('lineData2 ', lineData1)
  console.log('lineData2 ', lineData2)
  console.log('lineData2 ', lineData3)
  console.log('r2RowData.REV ', r2RowData.REV)


  // barData.push(sum1)
  // lineData1.push(sum2)
  // lineData2.push(sum3)
  // lineData3.push(sum4)
  chartsOptions.series[1].name = r2RowData.REV
  chartsOptions.legend.data[1] = r2RowData.REV

  chartsOptions.series[0].data = barData
  chartsOptions.series[1].data = lineData1
  chartsOptions.series[2].data = lineData2
  chartsOptions.series[3].data = lineData3

  //안전사고
  if (searchParam.SLI_GBN === 'A') {
    chartsOptions.xAxis.data = ['중대재해', '중대성사고', '산재사고', '휴업사고', '일반사고', '사고지연보고', '합계']
  }else if (searchParam.SLI_GBN === 'B') {
    chartsOptions.xAxis.data = ['절대수칙', '중대성수칙', '크레인 특별안전수칙', '작업중지', '시정통보', '일반수칙', '합계']
  }else if (searchParam.SLI_GBN === 'C') {
    chartsOptions.xAxis.data = ['정기', '관리감독자', '단기공사', '사내강사(내국인)', '사내강사(외국인)', '합계']
  }else if (searchParam.SLI_GBN === 'D') {
    chartsOptions.xAxis.data = ['수시(안전사고)', '현장 위험성평가', '안전작업요구권', '합계']
  }else if (searchParam.SLI_GBN === 'E') {
    chartsOptions.xAxis.data = ['일상점검', '일상(3일평균)', '취약항목 실적등록', 'PTW 점검(3중)', '부서관리작업', '합계']
  }else if (searchParam.SLI_GBN === '') {
    chartsOptions.xAxis.data = ['안전사고', '안전수칙', '안전교육', '위험성평가', '안전점검/개입']
  }

  chart.value.setOption(chartsOptions)
}

const setRowColor = () => {
  grdMain.value.getGridView().setRowStyleCallback((grid, item, fixed) => {
    let retVal = {}
    let val = grid.getValue(item.index, 'REV')

    if (val === 'SM') {
      retVal.style = { background: '#ecfcff'}
    }

    return retVal
  })
}

onMounted(() => {
  vm.$nextTick(() => {
    gridTitle.value.setBtnProperty('btnRowCopy', 'text', '버전값 복사')
    gridTitle.value.setBtnProperty('btnCreate', 'text', '배점관리표 버전 생성')
    setRowColor()
  })

  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[ 'btnSearch', 'btnPrint' ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex"> 
            <i-select
              :label="$t('사업부')"
              labelWidth="50px"
              width="250px"
              v-model="searchParam.BSNS_CD"
              :items="codeList.BSNS_List"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              @update:modelValue="bsnsChange"
            />
            <i-select
              :label="$t('부문')"
              labelWidth="50px"
              width="250px"
              v-model="searchParam.PART_CD"
              :items="codeList.PART_List"
              item-value="PART_CD"
              item-title="PART_NM"
              @update:modelValue="partChange"
            />
            <i-select
              :label="$t('부서')"
              labelWidth="50px"
              width="280px"
              v-model="searchParam.DEPT_CD"
              :items="codeList.DEPT_List"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
            />
            <i-input
              :label="$t('조회기간')"
              labelWidth="60px"
              width="230px"
              v-model="params.FROM_DT"
              type="date"
              margin="4px"
            />
            <i-input
              :label="$t('~')"
              type="date"
              width="180px"
              v-model="params.TO_DT"
            />
          </div>
          <div class="d-flex pt-1"> 
            <i-select
              v-model="searchParam.REV"
              :items="codeList.REVList"
              :label="$t('버전')"
              labelWidth="50px"
              width="250px"
              item-value="REV"
              item-title="REV_DESC"
              @update:model-value="pointeSearch"
            />
            <!-- <i-input
              v-model="searchParam.REV"
              :label="$t('버전')"
              width="250px"
              labelWidth="50px"
              @update:model-value="pointeSearch"
              readonly
            /> -->
            <i-input
              v-model="searchParam.APPLY_DT"
              :label="$t('적용일자')"
              width="250px"
              labelWidth="50px"
              readonly
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <div class="d-flex fill-height">
            <v-slide-x-reverse-transition> 
              <v-sheet width="30%" v-show="isPoint">
                <v-card class="h-auto" border>
                  <div class="d-flex justify-end align-center">
                    <v-checkbox label="배점제한" v-model="searchParam.CHK_LIMIT" true-value="Y" false-value="N" />
                    <IGridTitle
                      ref="gridTitle"
                      :button-list="['btnRowCopy', 'btnRskCopyApp', 'btnCreate']"
                      @click-button="onButtonsClick"
                      class="mt-2 mr-4"
                    />  
                  </div>
                  <div class="flex-column h-auto table_area">
                    <v-sheet width="100%" class="pa-2">
                      <div class="title">기간별 감률</div>
                      <table>
                        <tr>
                          <th v-for="(header, i) in headers.header01" :key="header">
                            <div v-if="i < 2">
                              {{ header }}
                            </div>
                            <div v-else>
                              <div>{{ header }}</div>
                              <v-divider />
                              <div class="d-flex">
                                <v-sheet width="50%">버전값</v-sheet>
                                <v-divider vertical />
                                <v-sheet width="50%">시뮬레이션</v-sheet>
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr v-for="content in dataList.data1" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td>{{ content.DESCR }}</td>
                          <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE01 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </v-sheet>

                    <v-sheet width="100%" class="pa-2">
                      <div class="title">위험도 등급별</div>
                      <table>
                        <tr>
                          <th v-for="(header, i) in headers.header02" :key="header">
                            <div v-if="i < 2">
                              {{ header }}
                            </div>
                            <div v-else>
                              <div>{{ header }}</div>
                              <v-divider />
                              <div class="d-flex">
                                <v-sheet width="50%">버전값</v-sheet>
                                <v-divider vertical />
                                <v-sheet width="50%">시뮬레이션</v-sheet>
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr v-for="content in dataList.data2" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td>{{ content.DESCR }}</td>
                          <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE01 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </v-sheet>

                    <v-sheet width="100%" class="pa-2">
                      <div class="title">인원별</div>
                      <table>
                        <tr>
                          <th v-for="(header, i) in headers.header03" :key="header">
                            <div v-if="i < 1">
                              {{ header }}
                            </div>
                            <div v-else>
                              <div>{{ header }}</div>
                              <v-divider />
                              <div class="d-flex">
                                <v-sheet width="50%">버전값</v-sheet>
                                <v-divider vertical />
                                <v-sheet width="50%">시뮬레이션</v-sheet>
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr v-for="content in dataList.data3" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE01 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </v-sheet>

                    <v-sheet width="100%" class="pa-2">
                      <div class="title">취약항목 반복</div>
                      <table>
                        <tr>
                          <th v-for="(header, i) in headers.header04" :key="header">
                            <div v-if="i < 1">
                              {{ header }}
                            </div>
                            <div v-else>
                              <div>{{ header }}</div>
                              <v-divider />
                              <div class="d-flex">
                                <v-sheet width="50%">버전값</v-sheet>
                                <v-divider vertical />
                                <v-sheet width="50%">시뮬레이션</v-sheet>
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr v-for="content in dataList.data4" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE01 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </v-sheet>

                    <v-sheet width="100%" class="pa-2">
                      <div class="title">안전수칙</div>
                      <table>
                        <tr>
                          <th v-for="(header, i) in headers.header05" :key="header">
                            <div v-if="i < 1">
                              {{ header }}
                            </div>
                            <div v-else>
                              <div>{{ header }}</div>
                              <v-divider />
                              <div class="d-flex">
                                <v-sheet width="50%">버전값</v-sheet>
                                <v-divider vertical />
                                <v-sheet width="50%">시뮬레이션</v-sheet>
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr v-for="content in dataList.data5" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE01 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td>
                          <!-- <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE02 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td> -->
                        </tr>
                      </table>
                    </v-sheet>

                    <v-sheet width="100%" class="pa-2">
                      <div class="title">안전사고</div>
                      <table>
                        <tr>
                          <th v-for="(header, i) in headers.header06" :key="header">
                            <div v-if="i < 1">
                              {{ header }}
                            </div>
                            <div v-else>
                              <div>{{ header }}</div>
                              <v-divider />
                              <div class="d-flex">
                                <v-sheet width="50%">버전값</v-sheet>
                                <v-divider vertical />
                                <v-sheet width="50%">시뮬레이션</v-sheet>
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr v-for="content in dataList.data6" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE01 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td>
                          <!-- <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE02 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td> -->
                        </tr>
                      </table>
                    </v-sheet>

                    <v-sheet width="100%" class="pa-2">
                      <div class="title">안전교육</div>
                      <table>
                        <tr>
                          <th v-for="(header, i) in headers.header07" :key="header">
                            <div v-if="i < 1">
                              {{ header }}
                            </div>
                            <div v-else>
                              <div>{{ header }}</div>
                              <v-divider />
                              <div class="d-flex">
                                <v-sheet width="50%">버전값</v-sheet>
                                <v-divider vertical />
                                <v-sheet width="50%">시뮬레이션</v-sheet>
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr v-for="content in dataList.data7" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE01 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </v-sheet>

                    <v-sheet width="100%" class="pa-2">
                      <div class="title">위험성평가</div>
                      <table>
                        <tr>
                          <th v-for="(header, i) in headers.header08" :key="header">
                            <div v-if="i < 1">
                              {{ header }}
                            </div>
                            <div v-else>
                              <div>{{ header }}</div>
                              <v-divider />
                              <div class="d-flex">
                                <v-sheet width="50%">버전값</v-sheet>
                                <v-divider vertical />
                                <v-sheet width="50%">시뮬레이션</v-sheet>
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr v-for="content in dataList.data8" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE01 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </v-sheet>
                    
                    <v-sheet width="100%" class="pa-2">
                      <div class="title">현장 위험성평가 (최근 1주일 누적)</div>
                      <table>
                        <tr>
                          <th v-for="(header, i) in headers.header09" :key="header">
                            <div v-if="i < 1">
                              {{ header }}
                            </div>
                            <div v-else>
                              <div>{{ header }}</div>
                              <v-divider />
                              <div class="d-flex">
                                <v-sheet width="50%">버전값</v-sheet>
                                <v-divider vertical />
                                <v-sheet width="50%">시뮬레이션</v-sheet>
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr v-for="content in dataList.data9" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE01 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </v-sheet>

                    <v-sheet width="100%" class="pa-2">
                      <div class="flex-column">
                        <v-sheet>
                          <div class="title">안전점검/개입</div>
                          <table>
                            <tr>
                              <th v-for="(header, i) in headers.header10" :key="header">
                                <div v-if="i < 2">
                                  {{ header }}
                                </div>
                                <div v-if="i === 2">
                                  <div>{{ header }}</div>
                                  <v-divider />
                                  <div class="d-flex">
                                    <v-sheet width="50%">버전값</v-sheet>
                                    <v-divider vertical />
                                    <v-sheet width="50%">시뮬레이션</v-sheet>
                                  </div>
                                </div>
                              </th>
                            </tr>
                            <tr v-for="(content, i) in dataList.data10" :key="content">
                              <td v-if="i < 3">{{ content.POINT_NM }}</td>
                              <td v-if="i < 3">{{ content.DESCR }}</td>
                              <td class="edit pa-0" v-if="i < 3">
                                <div class="d-flex">
                                  <v-sheet width="50%" class="bg-white align-end pa-2">
                                    {{ content.VALUE01 }}
                                  </v-sheet>
                                  <v-divider vertical />
                                  <v-sheet width="50%">
                                    <v-text-field 
                                      :maxlength="4" 
                                      oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                      v-model="content.SIMULATION"/>
                                  </v-sheet>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </v-sheet>

                        <v-sheet>
                          <table>
                            <tr>
                              <th v-for="(header, i) in headers.header11" :key="header" >
                                <div v-if="i < 1">
                                  {{ header }}
                                </div>
                                <div v-if="i > 0">
                                  <div>{{ header }}</div>
                                  <v-divider />
                                  <div class="d-flex">
                                    <v-sheet width="50%">버전값</v-sheet>
                                    <v-divider vertical />
                                    <v-sheet width="50%">시뮬레이션</v-sheet>
                                  </div>
                                </div>
                              </th>
                            </tr>
                            <tr v-for="(content, i) in _.filter(dataList.data10, { POINT_DIV2: 'F' })" :key="content">
                              <td>{{ content.POINT_NM }}</td>
                              <td class="edit pa-0">
                                <div class="d-flex">
                                  <v-sheet width="50%" class="bg-white align-end pa-2">
                                    {{ content.VALUE01 }}
                                  </v-sheet>
                                  <v-divider vertical />
                                  <v-sheet width="50%">
                                    <v-text-field 
                                      :maxlength="4" 
                                      oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                      v-model="content.SIMULATION"/>
                                  </v-sheet>
                                </div>
                              </td>
                            </tr>
                            <!-- <tr v-for="(content, i) in dataList.data10" :key="content"  v-show="i === 3">
                              <td v-if="i === 3">{{ content.POINT_NM }}</td>
                              <td v-if="i === 3">{{ content.DESCR }}</td>
                              <td class="edit pa-0" v-if="i === 3">
                                <div class="d-flex">
                                  <v-sheet width="50%" class="bg-white align-end pa-2">
                                    {{ content.VALUE01 }}
                                  </v-sheet>
                                  <v-divider vertical />
                                  <v-sheet width="50%">
                                    <v-text-field 
                                      :maxlength="4" 
                                      oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                      v-model="content.SIMULATION"/>
                                  </v-sheet>
                                </div>
                              </td>
                            </tr> -->
                          </table>
                        </v-sheet>
                      </div>
                    </v-sheet>
                    <v-sheet width="100%" class="pa-2">
                      <div class="title">PTW 점검(3중)</div>
                      <table>
                        <tr>
                          <th v-for="(header, i) in headers.header12" :key="header" >
                            <div v-if="i < 1">
                              {{ header }}
                            </div>
                            <div v-if="i > 0">
                              <div>{{ header }}</div>
                              <v-divider />
                              <div class="d-flex">
                                <v-sheet width="50%">버전값</v-sheet>
                                <v-divider vertical />
                                <v-sheet width="50%">시뮬레이션</v-sheet>
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr v-for="(content, i) in dataList.data11" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td class="edit pa-0">
                            <div class="d-flex">
                              <v-sheet width="50%" class="bg-white align-end pa-2">
                                {{ content.VALUE01 }}
                              </v-sheet>
                              <v-divider vertical />
                              <v-sheet width="50%">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.SIMULATION"/>
                              </v-sheet>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </v-sheet>
                  </div>
                </v-card>
              </v-sheet>
            </v-slide-x-reverse-transition>
            <v-btn 
              class="isBtn" 
              height="calc(100% - 4px)" 
              @click="!isPoint ? isPoint = true : isPoint = false "
            >
              <v-icon v-if="!isPoint">mdi-arrow-forward</v-icon>
              <v-icon v-if="isPoint">mdi-arrow-back</v-icon>
              &nbsp;&nbsp;
              배&nbsp;&nbsp;점&nbsp;&nbsp;관&nbsp;&nbsp;리&nbsp;&nbsp;표
            </v-btn>
            <v-sheet class="w-full ml-2">
              <v-card class="flex-column h-auto" border>
                <div class="align-self-end pt-1">
                  <i-select
                    :label="$t('SLI 항목')"
                    labelWidth="60px"
                    width="250px"
                    v-model="searchParam.SLI_GBN"
                    :items="codeList.SLI_LIST"
                    item-value="COD"
                    item-title="TXT"
                    @update:model-value="sliSelect"
                  />
                </div>
                <v-sheet height="40%" class="pt-2"> 
                  <RealGrid
                    ref="grdMain"
                    :grid-view-option="grdMainProps.gridViewOption"
                    :keys="grdMainProps.keys" 
                    :fields="grdMainProps.fields"
                    :columns="grdMainProps.columns"
                    :column-layout="grdMainProps.columnLayout"
                    @onCurrentRowChanged="rowChanged"
                  />
                </v-sheet>
                <v-sheet height="60%">
                  <Echart ref="chart" class="echarts_style" autoresize />
                </v-sheet>
              </v-card>
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
    min-height: 700px;
  }
}

// 배점관리표 버튼 세로 표시
::v-deep(.isBtn > .v-btn__content) {
  writing-mode: vertical-rl !important;
}
.slide-x-reverse-transition-enter-active, .slide-x-reverse-transition-leave-active {
  transition: all 1.0s ease; /* 트랜지션 속도를 여기서 조절합니다 */
}

.title {
  text-align: center;
  padding: 6px;
  margin: 0 2px 0px 2px;
  font-weight: bold;
  font-size: 12pt;
  border: 1px solid #ccc;
}
th {
  padding: 6px;
  border: 1px solid #ccc;
  background-color: #f4f5f9;
}

td {
  padding: 6px;
  border: 1px solid #ccc;
  text-align: center;
}
.table_area{
  overflow-y: auto;
  max-height: calc(100vh - 340px);
} 
.edit{
  background-color: #eff8fd;
}

::v-deep(.edit > div > div > .v-input > .v-input__control > .v-field > .v-field__field){
  height: 30px;
  background-color: #eff8fd;
  font-weight: bold;
}
::v-deep(.edit > div > div > .v-input > .v-input__control > .v-field > .v-field__field>.v-field__input){
  text-align: end;
}
</style>