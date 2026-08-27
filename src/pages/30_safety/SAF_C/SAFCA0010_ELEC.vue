<!--
작성자 : 일주지앤에스 SI3팀 김현재 선임
화면명 : 안전점검 대시보드 (일렉용)
화면개요 : 안전점검 결과등록 현황을 차트로 보여주는 화면
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi } from '@hiway/api/commonApi'
import Echart from 'vue-echarts'
import IGridTitle from '@/components/IGridTitle.vue'
defineOptions({
  name: '30_safety-SAF_C-SAFCA0010',
})
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const yearReadOnly = ref(false) //년도 셀렉트박스 readonly
const monthReadOnly = ref(false) //일자 셀렉트박스 readonly
const emit = defineEmits(['close'])
// 작업표준 신규제정에서 팝업 호출시 (RSKBA0010)
const props = defineProps({
  dialog: {
    type: String,
    default: 'N',
  },
  val1: '',
  half: '',
})

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //로그인 유저 회사구분
  BSNS_CD: userStore.bsnsCd, //로그인유저 사업부
  DEPT_CD: userStore.deptCd, //로그인유저 부서
  CHECK_DATE_FROM: '', //월 FROM
  CHECK_DATE_TO: '', //월 TO
  ORGN_DIV: '', //조직구분
  PROD_DIV: '', //생산,비생산
})

const codeList = reactive({
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
})

//일상점검 좌측 전체,양호,미흡
const dailyCheckCount = reactive({
  TOTAL_COUNT: '', //전체
  OK_COUNT: '', // 우수사례
  NG_COUNT: '', // 불안전사례
  NG_COMPLETE_COUNT: '', // 조치완료(불안전사례)
})

//부서관리,고위험점검 점검률
const persent = reactive({
  deptCheckPersent: 0,
  ptwCheckPersent: 0,
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: 'Y' },
    }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  })
}

//일상점검 차트 관련 로직 시작
//일상점검 차트 옵션
const chartsOptions1 = reactive({
  legend: {
    left: '10%',
    data: ['우수사례', '불안전사례', '조치완료(불안전사례)'],
  },
  grid: {
    top: '13%',
    //width: '100%',
    left: '5%',
    //containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  toolbox: {
    show: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: true,
    data: [], //x축
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      // 불안전사례
      data: [],
      name: '불안전사례',
      type: 'bar',
      itemStyle: { color: '#FF0000' },
      lineStyle: {
        color: '#FF0000',
      },
    },
    {
      // 불안전사례
      data: [],
      name: '조치완료(불안전사례)',
      type: 'bar',
      itemStyle: { color: '#FFA500' },
      lineStyle: {
        color: '#FFA500',
      },
    },
    {
      //양호
      data: [],
      name: '우수사례',
      type: 'bar',
      itemStyle: { color: '#1A40C7' },
      lineStyle: {
        color: '#1A40C7',
      },
    },
  ],
})
//일상점검 차트 관련 로직 끝

//부서관리작업점검 관련 로직 시작
//부서관리작업검점 왼쪽 bar 차트 옵션
const chartsOptions2 = reactive({
  title: {
    text: '',
    textStyle: { fontSize: 13 },
    left: '5%',
    top: '17%',
  },
  legend: {
    icon: 'circle',
    data: ['계획', '실적'],
    left: '5%',
  },
  grid: {
    //top: '20%',
    //width: '100%',
    //left: '5%',
    bottom: '5%',
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  toolbox: {
    show: true,
  },
  xAxis: {
    show: false,
    type: 'category',
    boundaryGap: true,
  },
  yAxis: {
    type: 'value',
    show: false,
  },
  series: [
    {
      name: '계획',
      type: 'bar',
      barGap: '80%',
      barWidth: '30%',
      data: [],
      color: '#F4F5F9',
      label: {
        show: true,
        position: 'top',
      },
    },
    {
      name: '실적',
      type: 'bar',
      barWidth: '30%',
      data: [],
      color: '#1A40C7',
      label: {
        show: true,
        position: 'top',
      },
    },
  ],
})

// 실적(미흡은 따로)
const chartsOptions2_sub = reactive({
  title: {
    text: '',
    textStyle: { fontSize: 13 },
    left: '5%',
    top: '17%',
  },
  legend: {
    icon: 'circle',
    data: ['실적(미흡)'],
    left: '5%',
  },
  grid: {
    //top: '20%',
    //width: '100%',
    //left: '5%',
    bottom: '5%',
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  toolbox: {
    show: true,
  },
  xAxis: {
    show: false,
    type: 'category',
    boundaryGap: true,
  },
  yAxis: {
    type: 'value',
    show: false,
  },
  series: [
    {
      name: '실적(미흡)',
      type: 'bar',
      barWidth: '30%',
      data: [],
      color: '#FF0000',
      label: {
        show: true,
        position: 'top',
      },
    },
  ],
})

//부서관리작업점검 우측 라인차트
const chartsOptions3 = reactive({
  legend: {
    left: '10%',
    data: ['양호', '미흡'],
  },
  grid: {
    top: '13%',
    //width: '100%',
    left: '5%',
    //containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  toolbox: {
    show: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: true,
    data: [], //x축
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      type: 'bar',
      data: [],
      name: '양호',
      itemStyle: { color: '#1A40C7' },
      lineStyle: {
        color: '#1A40C7',
      },
    },
    {
      type: 'bar',
      data: [],
      name: '미흡',
      itemStyle: { color: '#FF0000' },
      lineStyle: {
        color: '#FF0000',
      },
    },
  ],
})
//부서관리작업 차트 옵션 관련 로직 끝

//PTW 점검 차트 관련 로직 시작
//PTW 점검 왼쪽 bar 차트 옵션
const chartsOptions4 = reactive({
  title: {
    text: '점검률' + persent.ptwCheckPersent,
    textStyle: { fontSize: 15 },
    left: '5%',
    top: '10%',
  },
  legend: {
    icon: 'circle',
    data: ['계획', '실적'],
    left: '10%',
  },
  grid: {
    bottom: '5%',
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  toolbox: {
    show: true,
  },
  xAxis: {
    show: false,
    type: 'category',
    boundaryGap: true,
  },
  yAxis: {
    type: 'value',
    show: false,
  },
  series: [
    {
      name: '계획',
      type: 'bar',
      barGap: '80%',
      barWidth: '20%',
      data: [],
      color: '#F4F5F9',
      label: {
        show: true,
        position: 'top',
      },
    },
    {
      name: '실적',
      type: 'bar',
      barWidth: '20%',
      data: [],
      color: '#1A40C7',
      label: {
        show: true,
        position: 'top',
      },
    },
  ],
})

const chartsOptions4_sub = reactive({
  title: {
    textStyle: { fontSize: 15 },
    left: '5%',
    top: '10%',
  },
  legend: {
    icon: 'circle',
    data: ['실적(미흡)'],
    left: '10%',
  },
  grid: {
    bottom: '5%',
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  toolbox: {
    show: true,
  },
  xAxis: {
    show: false,
    type: 'category',
    boundaryGap: true,
  },
  yAxis: {
    type: 'value',
    show: false,
  },
  series: [
    {
      name: '실적(미흡)',
      type: 'bar',
      barWidth: '20%',
      data: [],
      color: '#FF0000',
      label: {
        show: true,
        position: 'top',
      },
    },
  ],
})

//안전현장허가 바차트
const chartOptions5 = reactive({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: '0%',
    right: '0%',
    bottom: '0%',
    top: '20%',
    width: '360px',
    containLabel: true,
  },
  xAxis: {
    show: false,
    type: 'value',
    boundaryGap: [0, 0.01],
  },
  yAxis: {
    show: false,
    type: 'category',
    data: ['실적', '계획'],
  },
  series: [
    {
      type: 'bar',
      data: [],
      name: '안전현장허가',
      label: {
        show: true,
        position: 'right',
      },
    },
  ],
})

//안전현장허가 미흡 바차트
const chartOptions5_1 = reactive({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: '0%',
    right: '0%',
    bottom: '0%',
    top: '20%',
    width: '210px',
    containLabel: true,
  },
  xAxis: {
    show: false,
    type: 'value',
    boundaryGap: [0, 0.01],
  },
  yAxis: {
    show: false,
    type: 'category',
    data: ['미흡'],
  },
  series: [
    {
      name: '안전현장허가',
      type: 'bar',
      data: [],
      itemStyle: {
        borderRadius: [0, 5, 5, 0], //시계방향으로 좌측위,우측위,우측밑,좌측아래
      },
      barWidth: 15,
      label: {
        show: true,
        position: 'right',
      },
    },
  ],
})

//안전대면허가 바차트
const chartOptions6 = reactive({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: '0%',
    right: '0%',
    bottom: '0%',
    top: '20%',
    width: '360px',
    containLabel: true,
  },
  xAxis: {
    show: false,
    type: 'value',
    boundaryGap: [0, 0.01],
  },
  yAxis: {
    show: false,
    type: 'category',
    data: ['계획', '실적'],
  },
  series: [
    {
      name: '안전대면허가',
      type: 'bar',
      data: [],
      label: {
        show: true,
        position: 'right',
      },
      // itemStyle: {
      //   borderRadius: [0, 5, 5, 0], //시계방향으로 좌측위,우측위,우측밑,좌측아래
      // },
    },
  ],
})

//안전대면허가 미흡 바차트
const chartOptions6_1 = reactive({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: '0%',
    right: '0%',
    bottom: '0%',
    top: '20%',
    width: '210px',
    containLabel: true,
  },
  xAxis: {
    show: false,
    type: 'value',
    boundaryGap: [0, 0.01],
  },
  yAxis: {
    show: false,
    type: 'category',
    data: ['미흡'],
  },
  series: [
    {
      name: '안전대면허가',
      type: 'bar',
      data: [],
      label: {
        show: true,
        position: 'right',
      },
      // itemStyle: {
      //   borderRadius: [0, 5, 5, 0], //시계방향으로 좌측위,우측위,우측밑,좌측아래
      // },
      barWidth: 15,
    },
  ],
})

//전산허가 바차트
const chartOptions7 = reactive({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: '0%',
    right: '0%',
    bottom: '0%',
    top: '20%',
    width: '360px',
    containLabel: true,
  },
  xAxis: {
    show: false,
    type: 'value',
    boundaryGap: [0, 0.01],
  },
  yAxis: {
    show: false,
    type: 'category',
    data: ['계획', '실적'],
  },
  series: [
    {
      name: '전산허가',
      type: 'bar',
      data: [],
      label: {
        show: true,
        position: 'right',
      },
      // itemStyle: {
      //   borderRadius: [0, 5, 5, 0], //시계방향으로 좌측위,우측위,우측밑,좌측아래
      // },
      barWidth: 15,
    },
  ],
})

//전산허가 미흡 바차트
const chartOptions7_1 = reactive({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: '0%',
    right: '0%',
    bottom: '0%',
    top: '20%',
    width: '210px',
    containLabel: true,
  },
  xAxis: {
    show: false,
    type: 'value',
    boundaryGap: [0, 0.01],
  },
  yAxis: {
    show: false,
    type: 'category',
    data: ['미흡'],
  },
  series: [
    {
      name: '전산허가',
      type: 'bar',
      data: [],
      label: {
        show: true,
        position: 'right',
      },
      // itemStyle: {
      //   borderRadius: [0, 5, 5, 0], //시계방향으로 좌측위,우측위,우측밑,좌측아래
      // },
      barWidth: 15,
    },
  ],
})

//PTW우측 라인 차트 옵션 관련 로직 시작
//고위험점검 우측 라인차트
const chartsOptions8 = reactive({
  legend: {
    left: '10%',
    data: ['양호', '미흡'],
  },
  grid: {
    //width: '100%',
    height: '70%',
    left: '5%',
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  toolbox: {
    show: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: true,
    data: [], //x축
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      type: 'bar',
      data: [],
      name: '양호',
      itemStyle: { color: '#1A40C7' },
      lineStyle: {
        color: '#1A40C7',
      },
    },
    {
      type: 'bar',
      data: [],
      name: '미흡',
      itemStyle: { color: '#FF0000' },
      lineStyle: {
        color: '#FF0000',
      },
    },
  ],
})
//부서관리작업 차트 옵션 관련 로직 끝

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    emit('close', false)
  } else if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

//조회관련 로직 시작
const beforeSearch = () => {
  let from = dayjs(searchParam.CHECK_DATE_FROM)
  let to = dayjs(searchParam.CHECK_DATE_TO)
  let monthDiff = to.diff(from, 'month')
  console.log('monthDiff', monthDiff)
  if (monthDiff + 1 > 6) {
    Message.warn(t('조회기간은 최대 6개월 입니다.'))
    return false
  }
  return true
}

//조회버튼을 눌렀을때 실행되는 함수
//각차트의 데이터를 조회하는 쿼리를 실행하여 DB에서 데이터를 받아온후 차트에 데이터를 넣어준다.
const searchData = () => {
  console.log('서치파람', searchParam)
  return Promise.all([
    //일상점검 좌측 전체,양호,미흡 조회
    commonSearchApi({
      queryId: 'SAFCA0010_SEARCH01_ELEC',
      param: searchParam,
    }),
    //일상점검 우측 라인차트 조회
    commonSearchApi({
      queryId: 'SAFCA0010_SEARCH02_ELEC',
      param: searchParam,
    }),
    //부서관리작업점검 좌측 바차트 계획건수 조회
    commonSearchApi({
      queryId: 'SAFCA0010_SEARCH03_ELEC',
      param: searchParam,
    }),
    //부서관리작업 실적,미흡 건수 조회
    commonSearchApi({
      queryId: 'SAFCA0010_SEARCH04_ELEC',
      param: searchParam,
    }),
    // 부서관리작업 월별 실적,미흡(건)
    commonSearchApi({
      queryId: 'SAFCA0010_SEARCH05_ELEC',
      param: searchParam,
    }),
    //PTW 계획건수 조회
    commonSearchApi({
      queryId: 'SAFCA0010_SEARCH06_ELEC',
      param: searchParam,
    }),
    //PTW 실적,미흡 건수 조회
    commonSearchApi({
      queryId: 'SAFCA0010_SEARCH07_ELEC',
      param: searchParam,
    }),
    //PTW 안전현장,안전대면,전산 계획건수 조회
    commonSearchApi({
      queryId: 'SAFCA0010_SEARCH08_ELEC',
      param: searchParam,
    }),
    //PTW 안전현장,안전대면,전산 실적,미흡건수 조회
    commonSearchApi({
      queryId: 'SAFCA0010_SEARCH09_ELEC',
      param: searchParam,
    }),
    //PTW 월별 실적,미흡건수 조회
    commonSearchApi({
      queryId: 'SAFCA0010_SEARCH10_ELEC',
      param: searchParam,
    }),
  ])
}

const afterSearch = async (res) => {
  console.log('조회값', res)
  await setDailyCheckCount(res[0].ORESULT_CUR[0]) //일상점검 좌측 전체,양호,미흡 세팅
  await setDailyCheckLineChart(res[1].ORESULT_CUR) //일상점검 우측 라인차트 세팅
  await setDeptWorkPlanCountBarChart(res[2].ORESULT_CUR) //부서관리작업 좌측 바차트 계획건수 세팅
  await setDeptWorkCheckCountBarChart(res[3].ORESULT_CUR) //부서관리작업 좌측 바차트 실적,미흡건수 세팅
  await setDeptWorkPerMonthCountLineChart(res[4].ORESULT_CUR) //부서관리작업 우측 라인차트 월별 실적,미흡건수 세팅
  await setPtwWorkPlanCount(res[5].ORESULT_CUR) //고위험점검 좌측 바차트 계획건수 세팅
  await setPtwCheckCountBarChar(res[6].ORESULT_CUR) //고위험점검 좌측 바차트 실적,미흡건수 세팅
  await setPtwCheckPermitCountBarChart(res[7].ORESULT_CUR, res[8].ORESULT_CUR) //고위험점검 중간 허가 바차트 계획건수 세팅
  await setPtwCheckPerMonthCountLintChart(res[9].ORESULT_CUR) //고위험점검 우측 라인차트 월별 실적,미흡건수 세팅
}
//조회관련 로직 끝

//일상점검 좌측 전체,양호,미흡 세팅해주는 함수
const setDailyCheckCount = (res) => {
  dailyCheckCount.TOTAL_COUNT = res.TOTAL_COUNT //전체
  dailyCheckCount.OK_COUNT = res.OK_COUNT // 우수사례
  dailyCheckCount.NG_COUNT = res.NG_COUNT // 불안전사례
  dailyCheckCount.NG_COMPLETE_COUNT = res.NG_COMPLETE_COUNT // 조치완료(불안전사례)
}

//일상점검 우측 라인차트 세팅해주는 함수
const setDailyCheckLineChart = (res) => {
  chartsOptions1.xAxis.data = [] //x축 초기화
  chartsOptions1.series[0].data = [] //불안전사례 라인차트 데이터 초기화
  chartsOptions1.series[1].data = [] //조치완료(불안전사례) 라인차트 데이터 초기화
  chartsOptions1.series[2].data = [] //우수사례 라인차트 데이터 초기화
  console.log('일상점검 라인차트 데이터', res)
  for (let i = 0; i < res.length; i++) {
    chartsOptions1.xAxis.data.push(res[i].MONTH) //X축
    chartsOptions1.series[0].data.push({
      //불안전사례 라인차트
      value: res[i].NG_COUNT,
      itemStyle: { color: '#FF0000' },
    })
    chartsOptions1.series[1].data.push({
      //조치완료(불안전사례) 라인차트
      value: res[i].NG_COMPLETE_COUNT,
      itemStyle: { color: '#FFA500' },
    })
    chartsOptions1.series[2].data.push({
      //우수사례 라인차트
      value: res[i].OK_COUNT,
      itemStyle: { color: '#1A40C7' },
    })
  }
}

//부서관리작업점검 좌측 바차트 계획건수 세팅 해주는 함수
const setDeptWorkPlanCountBarChart = (res) => {
  console.log('부서관리작업점검 좌측 바차트 계획건수', res)
  chartsOptions2.series[0].data = [] //데이터 초기화
  chartsOptions2.series[0].data.push(res[0].PLAN_COUNT)
}

//부서관리작업점검 좌측 바차트 실적,미흡 건수 세팅해주는 함수
const setDeptWorkCheckCountBarChart = (res) => {
  console.log('부서관리작업점검 좌측 바차트 실적,미흡 건수', res)
  chartsOptions2.series[1].data = []
  chartsOptions2_sub.series[0].data = []
  chartsOptions2.series[1].data.push(res[0].OK_COUNT) //실적
  chartsOptions2_sub.series[0].data.push(res[0].NG_COUNT) //미흡

  if(chartsOptions2.series[0].data[0] == 0 || chartsOptions2.series[0].data[0] == null) {
    persent.deptCheckPersent = 0
  } else {
    persent.deptCheckPersent = Math.floor(
      (chartsOptions2.series[1].data[0] / chartsOptions2.series[0].data[0]) * 100
    )
  }
  chartsOptions2.title.text = '점검률 ' + persent.deptCheckPersent + '%'
}

//부서관리작업점검 우측 라인차트 월별 실적,미흡건수 세팅해주는 함수
const setDeptWorkPerMonthCountLineChart = (res) => {
  console.log('부서관리작업점검 우측 라인차트 월별 실적,미흡건수', res)
  chartsOptions3.xAxis.data = []
  chartsOptions3.series[0].data = []
  chartsOptions3.series[1].data = []
  for (let i = 0; i < res.length; i++) {
    chartsOptions3.xAxis.data.push(res[i].MONTH)
    chartsOptions3.series[0].data.push({
      value: res[i].OK_COUNT,
      itemStyle: { color: '#1A40C7' },
    }) //실적
    chartsOptions3.series[1].data.push({
      value: res[i].NG_COUNT,
      itemStyle: { color: '#FF0000' },
    }) //미흡
  }
}

const setPtwWorkPlanCount = (res) => {
  //고위험점검 좌측 바차트 계획건수 세팅
  console.log('고위험점검 좌측 바차트 계획건수', res)
  chartsOptions4.series[0].data = []
  chartsOptions4.series[0].data.push(res[0].PLAN_COUNT)
}
const setPtwCheckCountBarChar = (res) => {
  //고위험점검 좌측 바차트 실적,미흡건수 세팅
  console.log('고위험점검 좌측 바차트 실적,미흡건수', res)
  chartsOptions4.series[1].data = []
  chartsOptions4_sub.series[0].data = []
  chartsOptions4.series[1].data.push(res[0].OK_COUNT) //실적
  chartsOptions4_sub.series[0].data.push(res[0].NG_COUNT) //미흡

  if(chartsOptions4.series[0].data[0] == 0 || chartsOptions4.series[0].data[0] == null) {
    persent.ptwCheckPersent = 0 
  } else {
    persent.ptwCheckPersent = Math.floor(
      (chartsOptions4.series[1].data[0] / chartsOptions4.series[0].data[0]) * 100
    )
  }
  chartsOptions4.title.text = '점검률' + persent.ptwCheckPersent + '%'
}

//고위험점검 중간 허가 바차트 계획건수 세팅
const setPtwCheckPermitCountBarChart = (res1, res2) => {
  console.log('고위험점검 중간 허가 바차트 계획건수', res1)
  console.log('고위험점검 중간 허가 바차트 실적,미흡 건수', res2)
  chartOptions5.series[0].data = [] //안전현장허가 계획,실적
  chartOptions6.series[0].data = [] //안전대면허가 계획,실적
  chartOptions7.series[0].data = [] //3중점검 미대상 계획,실적
  chartOptions5_1.series[0].data = [] //안전현장허가 미흡
  chartOptions6_1.series[0].data = [] //안전대면허가 미흡
  chartOptions7_1.series[0].data = [] //3중점검 미대상 미흡
  //안전현장허가 실적
  chartOptions5.series[0].data.push({
    value: res2[0].OK_COUNT,
    itemStyle: { borderRadius: [0, 5, 5, 0], color: '#1A40C7' },
  })
  //안전현장허가 계획
  chartOptions5.series[0].data.push({
    value: res1[0].PLAN_COUNT,
    itemStyle: { borderRadius: [0, 5, 5, 0], color: '#F4F5F9' },
  })
  //안전현장허가 미흡
  chartOptions5_1.series[0].data.push({
    value: res2[0].NG_COUNT,
    itemStyle: { borderRadius: [0, 5, 5, 0], color: '#FF0000' },
  })

  //안전대면허가 실적
  chartOptions6.series[0].data.push({
    value: res2[0].OK_COUNT,
    itemStyle: { borderRadius: [0, 5, 5, 0], color: '#1A40C7' },
  })
  //안전대면허가 계획건수
  chartOptions6.series[0].data.push({
    value: res1[1].PLAN_COUNT,
    itemStyle: { borderRadius: [0, 5, 5, 0], color: '#F4F5F9' },
  })

  //안전대면허가 미흡
  chartOptions6_1.series[0].data.push({
    value: res2[1].NG_COUNT,
    itemStyle: { borderRadius: [0, 5, 5, 0], color: '#FF0000' },
  })
  //3중점검 미대상 실적
  chartOptions7.series[0].data.push({
    value: res2[2].OK_COUNT,
    itemStyle: { borderRadius: [0, 5, 5, 0], color: '#1A40C7' },
  })
  //3중점검 미대상 계획건수
  chartOptions7.series[0].data.push({
    value: res1[2].PLAN_COUNT,
    itemStyle: { borderRadius: [0, 5, 5, 0], color: '#F4F5F9' },
  })
  //3중점검 미대상 미흡
  chartOptions7_1.series[0].data.push({
    value: res2[2].NG_COUNT,
    itemStyle: { borderRadius: [0, 5, 5, 0], color: '#FF0000' },
  })
}

//고위험점검 중간 허가 바차트 실적,미흡건수 세팅
// const setPtwCheckPermitCountBarChart = (res) => {
//   console.log('고위험점검 중간 허가 바차트 실적,미흡건수', res)
//   chartOptions5_1.series[0].data = []
//   chartOptions6_1.series[0].data = []
//   chartOptions7_1.series[0].data = []
//   chartOptions5.series[1].data.push({
//     value: res[0].OK_COUNT,
//     itemStyle: { borderRadius: [0, 5, 5, 0], color: '#1A40C7' },
//   }) //안전현장허가 실적
//   chartOptions5_1.series[0].data.push({
//     value: 100,
//     itemStyle: { borderRadius: [0, 5, 5, 0], color: '#FF0000' },
//   }) //안전현장허가 미흡
//   //chartOptions5_1.series[0].data.push(res[0].NG_COUNT) //안전현장허가 미흡
//   chartOptions6.series[0].data.push({
//     value: res[1].OK_COUNT,
//     itemStyle: { borderRadius: [0, 5, 5, 0], color: '#1A40C7' },
//   }) //안전대면허가 실적
//   chartOptions6_1.series[0].data.push({
//     value: 57,
//     itemStyle: { borderRadius: [0, 5, 5, 0], color: '#FF0000' },
//   }) //안전대면허가 미흡
//   //chartOptions6_1.series[0].data.push(res[1].NG_COUNT) //안전대면허가 미흡
//   chartOptions7.series[0].data.push({
//     value: res[2].OK_COUNT,
//     itemStyle: { borderRadius: [0, 5, 5, 0], color: '#1A40C7' },
//   }) //3중점검 미대상 실적
//   chartOptions7_1.series[0].data.push({
//     value: 33,
//     itemStyle: { borderRadius: [0, 5, 5, 0], color: '#FF0000' },
//   }) //3중점검 미대상 미흡
//   //chartOptions7_1.series[0].data.push(res[2].NG_COUNT) //3중점검 미대상 미흡
//   console.log('차트옵션', chartOptions5.series)
// }

//고위험점검 우측 라인차트 월별 실적,미흡건수 세팅
const setPtwCheckPerMonthCountLintChart = (res) => {
  console.log('고위험점검 우측 라인차트 월별 실적,미흡건수', res)
  chartsOptions8.xAxis.data = []
  chartsOptions8.series[0].data = []
  chartsOptions8.series[1].data = []
  for (let i = 0; i < res.length; i++) {
    chartsOptions8.xAxis.data.push(res[i].MONTH)
    chartsOptions8.series[0].data.push({
      value: res[i].OK_COUNT,
      itemStyle: { color: '#1A40C7' },
    }) //실적
    chartsOptions8.series[1].data.push({
      value: res[i].NG_COUNT,
      itemStyle: { color: '#FF0000' },
    }) //미흡
  }
}

onMounted(() => {
  initCodeList()
  defaultDate()
  callSafetyRskModule()
  onButtonsClick({ id: 'btnSearch' })
})

//월 조회 기본값 세팅
const defaultDate = () => {
  //월 기본값 -1월 ~ 오늘월
  console.log("dayjs().$M.toString()", dayjs().$M.toString())
  searchParam.CHECK_DATE_FROM =
    dayjs().$y + '-' + "01"
  searchParam.CHECK_DATE_TO =
    dayjs().$y + '-' + (dayjs().$M + 1).toString().padStart(2, '0')
}

//사업부 바뀌면 부서 가져옴(사업부변경 감지)
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)

//작업표준 신규제정 화면에서 호출을 체크하는 함수
const callSafetyRskModule = () => {
  // 작업표준 신규제정에서 팝업으로 호출시 -------------//
  if (props.dialog == 'Y') {
    menuTitle.value.setBtnProperty('btnClose', 'visible', true)
    // 추후 화면 개발완료 시 시작, 종료일을 half.from ~ half.to 로 적용 필요
    searchParam.FROM = props.half.from.slice(0, 7)
    searchParam.TO = props.half.to.slice(0, 7)
    // 추후 화면 개발완료시 회사, 사업부, 부서를 바인딩
    searchParam.CMPNY_DIV = props.val1.COMPANY_CD
    searchParam.BSNS_CD = props.val1.BSNS_CD_ORIGIN
    //searchParams.ASGN_NM = props.val1.DEPT_NM
    searchParam.DEPT_CD = props.val1.DEPT_CD

    onButtonsClick({ id: 'btnSearch' })
  } else {
    menuTitle.value.setBtnProperty('btnClose', 'visible', false)
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="props.dialog == 'Y' ? '' : $t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnClose']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex mb-0">
          <i-select
            width="200px"
            :label="$t('사업부')"
            label-width="40px"
            :items="codeList.BSNS_CD"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            v-model="searchParam.BSNS_CD"
          ></i-select>
          <i-select
            width="200px"
            :label="$t('부서')"
            label-width="40px"
            :items="codeList.DEPT_CD"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            v-model="searchParam.DEPT_CD"
          ></i-select>
          <i-input
            width="150px"
            type="month"
            class="mr-0"
            v-model="searchParam.CHECK_DATE_FROM"
          ></i-input>
          <span class="mt-2 mx-2">~</span>
          <i-input
            width="150px"
            type="month"
            class="ml-0"
            v-model="searchParam.CHECK_DATE_TO"
          ></i-input>
          <span class="mt-1 mr-2">조직구분</span>
          <div>
            <v-radio-group inline v-model="searchParam.ORGN_DIV">
              <v-radio label="전체" value=""></v-radio>
              <v-radio label="직영" value="A"></v-radio>
              <v-radio label="협력사" value="B"></v-radio>
            </v-radio-group>
          </div>
          <span class="ml-4 mr-2" style="margin-top: 3px">생산/비생산</span>
          <div>
            <v-radio-group inline v-model="searchParam.PROD_DIV">
              <v-radio label="전체" value=""></v-radio>
              <v-radio label="생산" value="Y"></v-radio>
              <v-radio label="비생산" value="N"></v-radio>
            </v-radio-group>
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <div class="flex-column h-auto">
            <v-sheet height="43%">
              <div class="d-flex fill-height">
                <v-sheet width="50%" class="pa-2">
                  <IGridTitle :title="$t('일상 점검')" />
                  <v-card class="border flex-column h-full pa-2">
                    <div class="titleStyle">점검 현황</div>
                    <div class="d-flex h-full">
                      <v-sheet
                        width="30%"
                        height="90%"
                        class="ma-2 bgblue d-flex flex-column justify-space-around"
                      >
                        <div
                          class="align-center pa-2 d-flex justify-space-between searchArea"
                          style="height: 30%"
                        >
                          <p class="countStyle">전체</p>
                          <p class="countStyle">
                            {{ dailyCheckCount.TOTAL_COUNT }}
                          </p>
                        </div>
                        <div
                          class="align-center pa-2 d-flex justify-space-between searchArea"
                          style="height: 30%"
                        >
                          <p class="countStyle">우수사례</p>
                          <p class="countStyle" style="color: blue">
                            {{ dailyCheckCount.OK_COUNT }}
                          </p>
                        </div>
                        <div
                          class="align-center pa-2 d-flex justify-space-between searchArea"
                          style="height: 30%"
                        >
                          <p class="countStyle">불안전사례</p>
                          <p class="countStyle" style="color: red">
                            {{ dailyCheckCount.NG_COUNT }}
                          </p>
                        </div>
                        <div
                          class="align-center pa-2 d-flex justify-space-between searchArea"
                          style="height: 30%"
                        >
                          <p class="countStyle">조치완료(불안전사례)</p>
                          <p class="countStyle" style="color: orange">
                            {{ dailyCheckCount.NG_COMPLETE_COUNT }}
                          </p>
                        </div> 
                      </v-sheet>
                      <v-sheet width="70%">
                        <div class="h-full">
                          <Echart
                            :option="chartsOptions1"
                            ref="echart1"
                            autoresize
                          ></Echart>
                        </div>
                      </v-sheet>
                    </div>
                  </v-card>
                </v-sheet>
                <v-sheet width="50%" class="pa-2">
                  <IGridTitle :title="$t('부서관리작업 점검')" />
                  <v-card class="border flex-column h-full pa-2">
                    <div class="titleStyle">점검 현황</div>
                    <div class="d-flex h-full">
                      <v-sheet width="32%" height="100%">
                        <div class="flex-column h-auto">
                          <v-sheet class="d-flex" height="80%">
                            <Echart 
                              :option="chartsOptions2"
                              ref="echart2"
                              autoresize
                            ></Echart>
                            <Echart
                              :option="chartsOptions2_sub"
                              ref="echart2_sub"
                              autoresize
                            ></Echart>
                          </v-sheet>
                          <v-sheet class="searchArea">
                            <!-- <div style="color: red; font-weight: bold; letter-spacing:-1px">
                              *관리감독자,세잎클로버중 점검시 실적으로 집계
                            </div>
                            <div >
                              (협력사 조회 시, 관리감독자, 협력사 안전관리자 중
                              점검 시 실적으로 집계)
                            </div> -->
                          </v-sheet>
                        </div>
                      </v-sheet>
                      <v-sheet width="68%"
                        ><Echart
                          :option="chartsOptions3"
                          ref="echart3"
                          autoresize
                        ></Echart
                      ></v-sheet>
                    </div>
                  </v-card>
                </v-sheet>
              </div>
            </v-sheet>
            <IGridTitle :title="$t('PTW 점검')" class="pl-2 pr-2" />
            <v-sheet height="48%" class="border ml-2 mr-2">
              <div class="titleStyle pa-2">점검 현황</div>
              <v-sheet width="100%" class="d-flex h-full">
                <v-sheet width="70%" height="95%">
                  <div class="d-flex h-full">
                    <v-sheet class="d-flex" width="30%">
                      <Echart
                        :option="chartsOptions4"
                        ref="echart4"
                        autoresize
                      ></Echart>
                      <Echart
                        :option="chartsOptions4_sub"
                        ref="echart4_sub"
                        autoresize
                      ></Echart>
                    </v-sheet>
                    <v-sheet width="70%" height="100%">
                      <!-- <div> -->
                        <table style="height: 100%;">
                          <!-- <tr style="height: 33%;">
                            <td class="searchArea" style="width: 15%;">
                              3중 점검대상
                            </td>
                            <td class="tableFontStyle" style="width: 15%; text-align: center;">
                              안전현장허가
                            </td>
                            <td style="width: 30%">
                              <Echart :option="chartOptions5" ref="echart5">
                              </Echart>
                            </td>
                            <td style="width: 20%">
                              <Echart :option="chartOptions5_1" ref="echart5_1">
                              </Echart>
                            </td>
                          </tr> -->
                          <tr style="height: 50%;">
                            <td class="searchArea">점검대상</td>
                            <td class="tableFontStyle" style="text-align: center;">안전대면허가</td>
                            <td style="width: 30%">
                              <Echart :option="chartOptions6" ref="echart6">
                              </Echart>
                            </td>
                            <td style="width: 20%">
                              <Echart :option="chartOptions6_1" ref="echart6_1">
                              </Echart>
                            </td>
                          </tr>
                          <tr style="height: 50%;">
                            <td class="searchArea">점검 미대상</td>
                            <td class="tableFontStyle" style="text-align: center;">전산허가</td>
                            <td style="width: 30%">
                              <Echart :option="chartOptions7" ref="echart7">
                              </Echart>
                            </td>
                            <td style="width: 20%">
                              <Echart :option="chartOptions7_1" ref="echart7_1">
                              </Echart>
                            </td>
                          </tr>
                        </table>
                      <!-- </div> -->
                    </v-sheet>
                  </div>
                </v-sheet>
                <v-sheet width="30%">
                  <div class="h-full">
                    <Echart 
                      :option="chartsOptions8" 
                      ref="echart8" 
                      autoresize
                    >
                    </Echart>
                  </div>                      
                </v-sheet>
              </v-sheet>
              
              <div
                class="searchArea"
                style="font-weight: bold; margin-bottom: 0px"
              >
                <!-- <span style="color: red"
                  >*관리감독자,세잎클로버중 점검시 실적으로 집계</span
                >
                <span
                  >(협력사 조회 시,관리감독자,협력사 안전관리자중 점검 시
                  실적으로 집계)</span
                > -->
              </div>
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

//각 차트내부 현황 글자 스타일
.titleStyle {
  font-size: 16px;
  font-weight: bold;
  color: #000000
}

//건수 스타일
.countStyle {
  font-size: 20px;
  font-weight: bold;
}

//하단 3중,2중 점검대상 테이블 폰트 스타일
.tableFontStyle {
  font-family: Pretendard;
  font-weight: bold;
  font-size: 16px;
}

//테이블 테두리,높이 스타일
th,
td {
  border: #f4f5f9 solid 1px;
}
</style>
