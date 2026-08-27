<!--
작성자 :SI3팀 김현재
화면명 : 안전수칙위반 Dashboard
화면개요 : 안전수칙위반의 통계값을 보여준다.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Echart from 'vue-echarts'
defineOptions({
  name: '30_safety-SAF_D-SAFDA0010',
})
const userStore = useUserStore()
const userLogStore = useLogsStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const yearReadOnly = ref(false) //년도 셀렉트박스 readonly
const monthReadOnly = ref(false) //일자 셀렉트박스 readonly
const chartDraw3 = ref(0) //안전수칙위반 건수 차트 리랜더링 하는 key 값
const chartDraw2 = ref(0) //시간대별 위반현황  차트 리랜더링 하는 key 값
let ioDivLength = 0 //항목구분 선택할때는 선택한값 조회하고, 선택한값들을 해제할때는 해제한값이 해제되어야 하는데 이 로직을 구현하기 위해서 필요한 변수(선택된 항목구분에 대한 길이값)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //회사구분
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  YEAR: dayjs().$y, //년도
  YEAR_YN: 'Y', //년도 체크박스
  MONTH_YN: 'N', //월 체크박스
  FROM: '', //일자 FROM
  TO: '', //일자 TO
  IO_DIV: '', //조직구분
  PROD_DIV: '', //생산/비생산
  VIO_GDIV: '', //수칙구분
  VIO_MDIV: '', //항목구분
})

const codeList = reactive({
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  VIO_GDIV: [], //수칙구분
  VIO_MDIV: [], //항목구분
})

const VIO_COUNT = reactive({
  VIO_TOTAL: 0, //수칙위반 전체건수
  VIO_A: 0, //절대수칙 전체건수
  VIO_B: 0, //일반수칙 전체건수
  VIO_D: 0, //중대성수칙 전체건수
})
//안전수칙위반 건수 series 선언(항목구분이 전체일때와 아닐때 보여지는 데이터가 달라서 항목구분 변경시 차트 데이터 변경시켜줄려고 선언함)
const chart3Series = reactive([
  {
    name: '전체',
    type: 'line',
    lineStyle: {
      width: '4',
      color: '#1A40C7',
    },
    data: [],
  },
  {
    name: '평균',
    type: 'line',
    lineStyle: {
      width: '2',
      color: '#1A40C7',
    },
    data: [],
  },
  {
    name: '추이',
    type: 'line',
    lineStyle: {
      width: '2',
      color: '#D3D3D3',
    },
    data: [],
  },
  {
    name: '절대수칙',
    type: 'line',
    lineStyle: {
      width: '2',
      color: '#FF0000',
    },
    data: [],
  },
  {
    name: '일반수칙',
    type: 'line',
    lineStyle: {
      width: '2',
      color: '#008000',
    },
    data: [],
  },
  {
    name: '중대성수칙',
    type: 'line',
    lineStyle: {
      width: '2',
      color: '#000000',
    },
    data: [],
  },
])

//차트초기화 하는 함수
const initChart = () => {
  //소속별 위반현황 초기화
  for (let i = 0; i < chartsOptions1.series.length; i++) {
    chartsOptions1.series[i].data = []
  }
  // //시간대별 위반현황 초기화
  chartsOptions2.series = []
  chartsOptions2.xAxis[0].data = []
  //안전수칙위반 건수 초기화
  chartsOptions3.series = []
  chartsOptions3.xAxis.data = []
}

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
    //수칙구분조회
    getCodeList('HHIF110'),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.VIO_GDIV = res[2].ORESULT_CUR.filter((x) => !x.COD.includes('S'))
    codeList.VIO_GDIV.unshift({ TXT: '전체', COD: '' })
  })
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    if (searchParam.MONTH_YN === 'Y') {
      //월을 선택했을때 최대 조회기간은 1년
      let dayFrom = dayjs(searchParam.FROM + '-' + '01')
      let dayTo = dayjs(searchParam.TO + '-' + '01')
      let dayDiff = dayTo.diff(dayFrom, 'month')
      if (dayDiff > 12) {
        Message.warn(t('조회기간은 최대 1년 입니다.'))
        return false
      }
    }
    //차트초기화
    initChart()
    Promise.all([
      //수칙위반 합계
      commonSearchApi({
        queryId: 'SAFDA010_SEARCH01',
        param: searchParam,
      }),
      //소속별 수칙위반 합계
      commonSearchApi({
        queryId: 'SAFDA010_SEARCH02',
        param: searchParam,
      }),
      //수칙위반 시간대별 현황 조회
      commonSearchApi({
        queryId: 'SAFDA010_SEARCH03',
        param: searchParam,
      }),
      //안전수칙위반 건수 조회
      commonSearchApi({
        queryId: 'SAFDA010_SEARCH04',
        param: searchParam,
      }),
    ]).then((res) => {
      ioDivLength = 0
      setVioCount(res[0].ORESULT_CUR)
      setIoDivCount(res[1].ORESULT_CUR)
      setPerTimeCount(res[2].ORESULT_CUR)
      setPerYearVioCount(res[3].ORESULT_CUR)
      if (searchParam.YEAR_YN === 'Y') {
        trendLineYear(res[3].ORESULT_CUR)
      } else {
        trendLineMonth(res[3].ORESULT_CUR)
      }
    })
  }
}
//수칙위반 합계 세팅하는 함수
const setVioCount = (res) => {
  VIO_COUNT.VIO_TOTAL = res[0].VIO_TOTAL
  VIO_COUNT.VIO_A = res[0].VIO_A
  VIO_COUNT.VIO_B = res[0].VIO_B
  VIO_COUNT.VIO_C = res[0].VIO_D
}

//소속별 위반현황 차트 세팅하는 함수
const setIoDivCount = (res) => {
  let IO_DIV_TOTAL = 0 //소속별 위반현황 전체
  //소속별 위반구분 넣어주는 부분
  for (let i = 0; i < res.length; i++) {
    IO_DIV_TOTAL += res[i].TOTAL_DIV_COUNT
  }

  chartsOptions1.series[0].data.push({
    value: IO_DIV_TOTAL,
    itemStyle: { color: '#1A40C7' },
  }) //소속별위반현황 전체
  chartsOptions1.series[0].data.push({
    value: res[0].TOTAL_DIV_COUNT,
    itemStyle: { color: '#1A40C7' },
  }) //소속별위반현황 직영
  chartsOptions1.series[0].data.push({
    value: res[1].TOTAL_DIV_COUNT,
    itemStyle: { color: '#1A40C7' },
  }) //소속별위반현황 협력사
  chartsOptions1.series[0].data.push({
    value: res[2].TOTAL_DIV_COUNT + res[3].TOTAL_DIV_COUNT,
    itemStyle: { color: '#1A40C7' },
  }) //소속별위반현황 기타
}
//시간대별 위반현황 세팅하는 함수
const setPerTimeCount = (res) => {
  chartsOptions2.series = []
  chartsOptions2.series.push({
    name: '전체',
    type: 'line',
    lineStyle: {
      width: '4',
      color: '#1A40C7',
    },
    data: [],
  })
  chartsOptions2.series.push({
    name: '절대수칙',
    type: 'line',
    lineStyle: {
      color: '#FF0000',
    },
    data: [],
  })
  chartsOptions2.series.push({
    name: '일반수칙',
    type: 'line',
    lineStyle: {
      color: '#008000',
    },
    data: [],
  })
  chartsOptions2.series.push({
    name: '중대성수칙',
    type: 'line',
    lineStyle: {
      color: '#000000',
    },
    data: [],
  })
  for (let i = 0; i < res.length; i++) {
    chartsOptions2.xAxis[0].data.push(res[i].VIO_RANGE) //시간
    chartsOptions2.series[0].data.push(res[i].COUNT_TOTAL) //전체
    chartsOptions2.series[1].data.push(res[i].VIO_A) //절대수칙
    chartsOptions2.series[2].data.push(res[i].VIO_B) //일반수칙
    chartsOptions2.series[3].data.push(res[i].VIO_D) //중대성수칙
  }
  chartDraw2.value += 1
}

//안전수칙위반 전체조회시 건수 세팅하는 함수
const setPerYearVioCount = (res) => {
  //왼쪽에 버튼이 클릭되어 있는 상태면 배경값 초기화
  const vioColorA = document.getElementById('VIO_A') //절대수칙 버튼
  const vioColorB = document.getElementById('VIO_B') //일반수칙 버튼
  const vioColorD = document.getElementById('VIO_D') //중대성수칙 버튼
  vioColorA.style.background = '#FFFFFF' //절대수칙 배경색 흰색으로 변경
  vioColorA.style.color = '#222222' // 절대수칙 검정색으로 폰트 색상 변경
  vioColorD.style.background = '#FFFFFF' //중대성수칙 배경색 흰색으로 변경
  vioColorD.style.color = '#222222' // 중대성수칙 검정색으로 폰트 색상 변경
  vioColorB.style.background = '#FFFFFF' //일반수칙 배경색 흰색으로 변경
  vioColorB.style.color = '#222222' // 일반수칙 검정색으로 폰트 색상 변경
  //수칙위반 차트 데이터 초기화 후 새로 세팅
  chartsOptions3.xAxis.data = []
  chartsOptions3.series = []
  chartsOptions3.series.push({
    name: '전체',
    type: 'line',
    lineStyle: { width: '4', color: '#1A40C7' },
    data: [],
  })
  chartsOptions3.series.push({
    name: '절대수칙',
    type: 'line',
    lineStyle: { width: '2', color: '#FF0000' },
    data: [],
  })
  chartsOptions3.series.push({
    name: '일반수칙',
    type: 'line',
    lineStyle: { width: '2', color: '#008000' },
    data: [],
  })
  chartsOptions3.series.push({
    name: '중대성수칙',
    type: 'line',
    lineStyle: { width: '2', color: '#000000' },
    data: [],
  })
  chartsOptions3.series.push({
    name: '평균',
    type: 'line',
    lineStyle: { width: '2', color: '#1A40C7' },
    data: [],
  })
  chartsOptions3.series.push({
    name: '추이',
    type: 'line',
    lineStyle: { width: '2', color: '#D3D3D3', type: 'dashed' },
    data: [],
  })
  //chartsOptions3.series = chart3Series
  for (let i = 0; i < res.length; i++) {
    chartsOptions3.xAxis.data.push(res[i].VIO_TIME) //YYYY-MM

    chartsOptions3.series[0].data.push({
      value: res[i].MONTH_COUNT,
    }) //전체
    chartsOptions3.series[1].data.push({ value: res[i].VIO_A }) //절대수칙
    chartsOptions3.series[2].data.push({ value: res[i].VIO_B }) //일반수칙
    chartsOptions3.series[3].data.push({ value: res[i].VIO_D }) //중대성수칙
    chartsOptions3.series[4].data.push({ value: res[i].MONTH_AVG }) //월별 평균
  }
  chartDraw3.value += 1
}

const defaultDate = () => {
  //일자 기본값 -1월 ~ 오늘월
  searchParam.FROM = dayjs().$y + '-' + dayjs().$M.toString().padStart(2, '0')
  searchParam.TO =
    dayjs().$y + '-' + (dayjs().$M + 1).toString().padStart(2, '0')
}

//소속별 위반현황 bar차트
const chartsOptions1 = reactive({
  legend: {
    bottom: 20,
  },
  grid: {
    top: '4%',
    width: '100%',
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
    data: ['전체', '직영', '협력사', '기타'], //x축
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      type: 'bar',
      barWidth: '20%',
      data: [],
    },
  ],
})
//시간대별 위반현황 line 차트
const chartsOptions2 = reactive({
  legend: {
    bottom: 30,
  },
  grid: {
    top: '4%',
    width: '100%',
    left: '4%',
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
  xAxis: [
    {
      type: 'category',
      boundaryGap: true,
      data: [], //x축
      yOffset: 20,
      axisLabel: {
        show: true,
        interval: 0,
        rotate: 15,
      },
    },
  ],
  yAxis: {
    type: 'value',
  },
  series: [],
})

//안전수칙위반 건수 line 차트
const chartsOptions3 = reactive({
  legend: {
    bottom: 30,
  },
  grid: {
    top: '4%',
    width: '93%',
    left: '4%',
    bottom: '108',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  // toolbox: {
  //   show: true,
  // },
  xAxis: {
    type: 'category',
    //boundaryGap: true,
    data: [], //x축
  },
  yAxis: {
    type: 'value',
  },
  series: [],
})

onMounted(() => {
  initCodeList()
  defaultDate()
  onButtonsClick({ id: 'btnSearch' })
})

//항목구분 선택 이벤트
const selectedVioMdiv = (e) => {
  console.log('선택된값', e)
  if (ioDivLength > e.length) {
    console.log('체크해제div', ioDivLength)
    console.log('체크해제e', e.length)
    //항목구분 체크가 해제 되었을경우 안전수칙위반건수의 차트에 조회된값중에서 체크를 해제한값에 대한 데이터를 없앤다.
    ioDivLength = e.length
    let filterArray = codeList.VIO_MDIV.filter((x) => e.includes(x.COD)) //체크해제한 값들을 제외하고 체크된값의 코드에 대한 객체를 얻는다.
    let series = [] //체크해제후 차트에 존재하는 데이터만 있는 변수
    //체크된값의 객체값들과 차트에 있는 데이터들을 비교하여 체크된값의 객체와 일치하는 시리즈만 얻는다.
    for (let i = 0; i < chartsOptions3.series.length; i++) {
      for (let j = 0; j < filterArray.length; j++) {
        if (chartsOptions3.series[i].name === filterArray[j].TXT) {
          series.push(chartsOptions3.series[i])
        }
      }
    }
    //안전수칙위반 건수 차트 초기화 및 필터링된 데이터 다시 넣어주고 차트 리렌더링
    chartsOptions3.series = []
    for (let i = 0; i < series.length; i++) {
      //차트에 필터링된 데이터 넣어줌
      chartsOptions3.series.push(series[i])
    }
    chartDraw3.value += 1 //차트 리랜더링
  } else if (ioDivLength === 0 && e.length === 0) {
    //처음 화면 켰을때 전체가 선택되어 있는데 그 전체를 해제했을 경우
  } else {
    console.log('체크div', ioDivLength)
    console.log('체크e', e.length)
    //항목구분의 항목을 체크했을경우 안전수칙위반건수의 차트에 체크한 항목에 대한 데이터를 표시한다.
    ioDivLength = e.length
    //전체만 선택되어 있을때, 다른 항목을 선택하면 전체 선택 체크해제후 선택한 항목 조회
    if (e[0] === '') {
      e = e.filter((x) => x !== '')
      searchParam.VIO_MDIV = e
      //차트 데이터 초기화(항목데이터 조회해야해서)
      chartsOptions3.series = []
      chartsOptions3.xAxis.data = []
      chartDraw3.value += 1 //차트 리랜더링
    } else {
      //다른항목이 선택되어 있을때 전체를 선택하면 전체만 체크되고 나머지 체크해제 후 전체조회
      if (e.includes('')) {
        e = e.filter((x) => x === '')
        searchParam.VIO_MDIV = e
        //차트 데이터 초기화(항목데이터 조회해야해서)
        chartsOptions3.series = []
        chartsOptions3.xAxis.data = []
        chartDraw3.value += 1 //차트 리랜더링
        for (let i = 0; i < chart3Series.length; i++) {
          chartsOptions3.series.push(chart3Series[i]) //전체조회시 필요한 데이터 넣어줌
        }
        onButtonsClick({ id: 'btnSearch' })
      }
    }
    // //항목구분은 최대 5개까지만 조회 가능
    if (e.length > 5) {
      Message.warn(t('항목구분은 최대 5개 까지 선택 가능합니다.'))
      let newE = e.slice(0, e.length - 1)
      searchParam.VIO_MDIV = newE
      return false
    } else {
      let VIO_MDIV_COPY = e.slice(-1) //선택된 마지막값 추출
      console.log('선택된값?', VIO_MDIV_COPY)
      if (VIO_MDIV_COPY[0] === '') {
        return false
      }
      let param = {
        CMPNY_DIV: searchParam.CMPNY_DIV,
        BSNS_CD: searchParam.BSNS_CD,
        DEPT_CD: searchParam.DEPT_CD,
        YEAR: searchParam.YEAR,
        YEAR_YN: searchParam.YEAR_YN,
        MONTH_YN: searchParam.MONTH_YN,
        FROM: searchParam.FROM,
        TO: searchParam.TO,
        IO_DIV: searchParam.IO_DIV,
        PROD_DIV: searchParam.PROD_DIV,
        VIO_GDIV: searchParam.VIO_GDIV,
        VIO_MDIV: VIO_MDIV_COPY[0],
      }
      commonSearchApi({
        queryId: 'SAFDA010_SEARCH05',
        param: param,
      }).then((res) => {
        let name = codeList.VIO_MDIV.filter((x) => x.COD === VIO_MDIV_COPY[0])
        chartsOptions3.series.push({
          name: name[0].TXT,
          type: 'line',
          lineStyle: { width: '2' },
          data: [],
        })
        let lastSeriesLength = chartsOptions3.series.length - 1
        for (let i = 0; i < res.ORESULT_CUR.length; i++) {
          chartsOptions3.series[lastSeriesLength].data.push(
            res.ORESULT_CUR[i].MONTH_COUNT
          )
          if (chartsOptions3.series.length <= 1) {
            //x축은 한번만 넣음
            chartsOptions3.xAxis.data.push(res.ORESULT_CUR[i].VIO_TIME)
          }
        }
      })
    }
  }
}
//절대수칙 시트 클릭 이벤트
const clickVioA = () => {
  const vioColorA = document.getElementById('VIO_A') //절대수칙 버튼
  const vioColorB = document.getElementById('VIO_B') //일반수칙 버튼
  const vioColorD = document.getElementById('VIO_D') //중대성수칙 버튼
  vioColorB.style.background = '#FFFFFF' //일반수칙 배경색 흰색으로 변경
  vioColorB.style.color = '#222222' // 일반수칙 검정색으로 폰트 색상 변경
  vioColorD.style.background = '#FFFFFF' //중대성수칙 배경색 흰색으로 변경
  vioColorD.style.color = '#222222' // 중대성수칙 검정색으로 폰트 색상 변경
  if (vioColorA.style.background === 'rgb(26, 64, 199)') {
    //버튼이 선택된상태라면
    vioColorA.style.background = '#FFFFFF' //배경색 흰색으로 변경
    vioColorA.style.color = '#222222' // 검정색으로 폰트 색상 변경
  } else {
    //수칙구분이 전체 일때만 클릭시 조회
    if (searchParam.VIO_GDIV === '') {
      vioColorA.style.background = '#1A40C7' //절대수칙 배경색 파란색으로 변경
      vioColorA.style.color = '#FFFFFF' // 흰색으로 폰트 색상 변경

      let param = {
        CMPNY_DIV: searchParam.CMPNY_DIV,
        BSNS_CD: searchParam.BSNS_CD,
        DEPT_CD: searchParam.DEPT_CD,
        YEAR: searchParam.YEAR,
        YEAR_YN: searchParam.YEAR_YN,
        MONTH_YN: searchParam.MONTH_YN,
        FROM: searchParam.FROM,
        TO: searchParam.TO,
        IO_DIV: searchParam.IO_DIV,
        PROD_DIV: searchParam.PROD_DIV,
        VIO_GDIV: 'A', //절대수칙만 조회
        VIO_MDIV: '',
      }
      Promise.all([
        //소속별위반 조회
        commonSearchApi({
          queryId: 'SAFDA010_SEARCH02',
          param: param,
        }),
        //시간대별 위반 조회
        commonSearchApi({
          queryId: 'SAFDA010_SEARCH03',
          param: param,
        }),
        //수칙위반건수 조회
        commonSearchApi({
          queryId: 'SAFDA010_SEARCH05',
          param: param,
        }),
      ]).then((res) => {
        initChart() //차트초기화
        setIoDivCount(res[0].ORESULT_CUR)
        chartsOptions2.series.push({
          name: '절대수칙',
          type: 'line',
          lineStyle: { width: '2', color: '#FF0000' },
          data: [],
        })
        for (let i = 0; i < res[1].ORESULT_CUR.length; i++) {
          chartsOptions2.series[0].data.push(res[1].ORESULT_CUR[i].VIO_A)
          chartsOptions2.xAxis[0].data.push(res[1].ORESULT_CUR[i].VIO_RANGE)
        }
        chartsOptions3.series.push({
          name: '절대수칙',
          type: 'line',
          lineStyle: { width: '2', color: '#FF0000' },
          data: [],
        })
        for (let i = 0; i < res[2].ORESULT_CUR.length; i++) {
          chartsOptions3.series[0].data.push(res[2].ORESULT_CUR[i].MONTH_COUNT)
          chartsOptions3.xAxis.data.push(res[2].ORESULT_CUR[i].VIO_TIME)
        }
        chartDraw2.value += 1
        chartDraw3.value += 1
      })
    } else {
      Message.warn(t('수칙구분이 전체일때만 조회 가능합니다.'))
      return false
    }
  }
}
//중대성수칙 시트 클릭 이벤트
const clickVioD = () => {
  const vioColorA = document.getElementById('VIO_A') //절대수칙 버튼
  const vioColorB = document.getElementById('VIO_B') //일반수칙 버튼
  const vioColorD = document.getElementById('VIO_D') //중대성수칙 버튼
  vioColorA.style.background = '#FFFFFF' //절대수칙 배경색 흰색으로 변경
  vioColorA.style.color = '#222222' // 절대수칙 검정색으로 폰트 색상 변경
  vioColorB.style.background = '#FFFFFF' //일반수칙 배경색 흰색으로 변경
  vioColorB.style.color = '#222222' // 일반수칙 검정색으로 폰트 색상 변경
  if (vioColorD.style.background === 'rgb(26, 64, 199)') {
    vioColorD.style.background = '#FFFFFF'
    vioColorD.style.color = '#222222' // 검정색으로 폰트 색상 변경
  } else {
    if (searchParam.VIO_GDIV === '') {
      //수칙구분이 전체 일때만 클릭시 조회
      vioColorD.style.background = '#1A40C7'
      vioColorD.style.color = '#FFFFFF' // 흰색으로 폰트 색상 변경
      let param = {
        CMPNY_DIV: searchParam.CMPNY_DIV,
        BSNS_CD: searchParam.BSNS_CD,
        DEPT_CD: searchParam.DEPT_CD,
        YEAR: searchParam.YEAR,
        YEAR_YN: searchParam.YEAR_YN,
        MONTH_YN: searchParam.MONTH_YN,
        FROM: searchParam.FROM,
        TO: searchParam.TO,
        IO_DIV: searchParam.IO_DIV,
        PROD_DIV: searchParam.PROD_DIV,
        VIO_GDIV: 'D', //중대성수칙만 조회
        VIO_MDIV: '',
      }
      Promise.all([
        //소속별위반 조회
        commonSearchApi({
          queryId: 'SAFDA010_SEARCH02',
          param: param,
        }),
        //시간대별 위반 조회
        commonSearchApi({
          queryId: 'SAFDA010_SEARCH03',
          param: param,
        }),
        //수칙위반건수 조회
        commonSearchApi({
          queryId: 'SAFDA010_SEARCH06',
          param: param,
        }),
      ]).then((res) => {
        //소속별 위반현황 초기화
        initChart() //차트초기화
        setIoDivCount(res[0].ORESULT_CUR)
        chartsOptions2.series.push({
          name: '중대성수칙',
          type: 'line',
          lineStyle: { width: '2', color: '#000000' },
          data: [],
        })
        for (let i = 0; i < res[1].ORESULT_CUR.length; i++) {
          chartsOptions2.series[0].data.push(res[1].ORESULT_CUR[i].VIO_D)
          chartsOptions2.xAxis[0].data.push(res[1].ORESULT_CUR[i].VIO_RANGE)
        }

        chartsOptions3.series.push({
          name: '중대성수칙',
          type: 'line',
          lineStyle: { width: '2', color: '#000000' },
          data: [],
        })

        for (let i = 0; i < res[2].ORESULT_CUR.length; i++) {
          chartsOptions3.series[0].data.push(res[2].ORESULT_CUR[i].MONTH_COUNT)
          chartsOptions3.xAxis.data.push(res[2].ORESULT_CUR[i].VIO_TIME)
        }
        chartDraw2.value += 1
        chartDraw3.value += 1
      })
    } else {
      Message.warn(t('수칙구분이 전체일때만 조회 가능합니다.'))
      return false
    }
  }
}
//일반수칙 시트 클릭 이벤트
const clickVioB = () => {
  const vioColorA = document.getElementById('VIO_A') //절대수칙 버튼
  const vioColorB = document.getElementById('VIO_B') //일반수칙 버튼
  const vioColorD = document.getElementById('VIO_D') //중대성수칙 버튼
  vioColorA.style.background = '#FFFFFF' //절대수칙 배경색 흰색으로 변경
  vioColorA.style.color = '#222222' // 절대수칙 검정색으로 폰트 색상 변경
  vioColorD.style.background = '#FFFFFF' //일반수칙 배경색 흰색으로 변경
  vioColorD.style.color = '#222222' // 중대성수칙 검정색으로 폰트 색상 변경
  if (vioColorB.style.background === 'rgb(26, 64, 199)') {
    vioColorB.style.background = '#FFFFFF'
    vioColorB.style.color = '#222222' // 검정색으로 폰트 색상 변경
  } else {
    if (searchParam.VIO_GDIV === '') {
      vioColorB.style.background = '#1A40C7' //절대수칙 배경색 파란색으로 변경
      vioColorB.style.color = '#FFFFFF' // 흰색으로 폰트 색상 변경
      let param = {
        CMPNY_DIV: searchParam.CMPNY_DIV,
        BSNS_CD: searchParam.BSNS_CD,
        DEPT_CD: searchParam.DEPT_CD,
        YEAR: searchParam.YEAR,
        YEAR_YN: searchParam.YEAR_YN,
        MONTH_YN: searchParam.MONTH_YN,
        FROM: searchParam.FROM,
        TO: searchParam.TO,
        IO_DIV: searchParam.IO_DIV,
        PROD_DIV: searchParam.PROD_DIV,
        VIO_GDIV: 'B', //일반수칙만 조회
        VIO_MDIV: '',
      }
      Promise.all([
        //소속별위반 조회
        commonSearchApi({
          queryId: 'SAFDA010_SEARCH02',
          param: param,
        }),
        //시간대별 위반 조회
        commonSearchApi({
          queryId: 'SAFDA010_SEARCH03',
          param: param,
        }),
        //수칙위반건수 조회
        commonSearchApi({
          queryId: 'SAFDA010_SEARCH05',
          param: param,
        }),
      ]).then((res) => {
        initChart() //차트초기화
        setIoDivCount(res[0].ORESULT_CUR)
        chartsOptions2.series.push({
          name: '일반수칙',
          type: 'line',
          lineStyle: { width: '2', color: '#008000' },
          data: [],
        })
        for (let i = 0; i < res[1].ORESULT_CUR.length; i++) {
          chartsOptions2.series[0].data.push(res[1].ORESULT_CUR[i].VIO_B)
          chartsOptions2.xAxis[0].data.push(res[1].ORESULT_CUR[i].VIO_RANGE)
        }

        chartsOptions3.series.push({
          name: '일반수칙',
          type: 'line',
          lineStyle: { width: '2', color: '#008000' },
          data: [],
        })

        for (let i = 0; i < res[2].ORESULT_CUR.length; i++) {
          chartsOptions3.series[0].data.push(res[2].ORESULT_CUR[i].MONTH_COUNT)
          chartsOptions3.xAxis.data.push(res[2].ORESULT_CUR[i].VIO_TIME)
        }
        chartDraw2.value += 1
        chartDraw3.value += 1
      })
    } else {
      Message.warn(t('수칙구분이 전체일때만 조회 가능합니다.'))
      return false
    }
  }
}

//조회조건 년도 추이선 방정식 만들어 주는 함수
const trendLineYear = (res) => {
  // //최소제곱법으로 추이선 방정식 만듬
  let data = []
  for (let i = 0; i < res.length; i++) {
    data.push(res[i].MONTH_COUNT)
  }
  let x = []
  for (let i = 0; i < 12; i++) {
    x.push(i + 1)
  }
  let y = data
  const sum = (arr) => arr.reduce((acc, val) => acc + val, 0)

  // x와 y의 합 계산
  const sumX = sum(x)
  const sumY = sum(y)

  // x^2의 합 계산
  const sumXSquared = sum(x.map((val) => val * val))

  // xy의 합 계산
  const sumXY = sum(x.map((val, index) => val * y[index]))

  // 기울기 계산
  const slope =
    (data.length * sumXY - sumX * sumY) /
    (data.length * sumXSquared - sumX ** 2)

  // y 절편 계산
  const intercept =
    (sumY * sumXSquared - sumX * sumXY) /
    (data.length * sumXSquared - sumX ** 2)

  // 추이선 그리기
  const trendline = x.map((val) => slope.toFixed(4) * val + intercept) //y = m*x +b m은 소수점 5자리에서 반올림(엑셀 추세선 공식과 같게)
  for (let i = 0; i < trendline.length; i++) {
    chartsOptions3.series[5].data.push(trendline[i])
  }
}
//조회조건 월 추이선 방정식 만들어 주는 함수
const trendLineMonth = (res) => {
  let data = []
  let x = []
  for (let i = 0; i < res.length; i++) {
    data.push(res[i].MONTH_COUNT)
    x.push(i + 1)
  }
  let y = data
  const sum = (arr) => arr.reduce((acc, val) => acc + val, 0)

  // x와 y의 합 계산
  const sumX = sum(x)
  const sumY = sum(y)

  // x^2의 합 계산
  const sumXSquared = sum(x.map((val) => val * val))

  // xy의 합 계산
  const sumXY = sum(x.map((val, index) => val * y[index]))

  // 기울기 계산
  const slope =
    (data.length * sumXY - sumX * sumY) /
    (data.length * sumXSquared - sumX ** 2)

  // y 절편 계산
  const intercept =
    (sumY * sumXSquared - sumX * sumXY) /
    (data.length * sumXSquared - sumX ** 2)

  // 추이선 그리기
  const trendline = x.map((val) => slope.toFixed(4) * val + intercept) //y = m*x +b m은 소수점 5자리에서 반올림(엑셀 추세선 공식과 같게)
  for (let i = 0; i < trendline.length; i++) {
    chartsOptions3.series[5].data.push(trendline[i])
  }
}

//사업부 바뀌면 부서 가져옴(사업부변경 감지)
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
        USE_DIV: 'Y',
      },
    }).then((res) => {
      searchParam.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)
//수칙구분 변경시 수칙구분에 해당하면 항목 가져옴
watch(
  () => searchParam.VIO_GDIV,
  (newValue, oldValue) => {
    if (newValue === '') {
      searchParam.VIO_MDIV = ''
      codeList.VIO_MDIV = []
      codeList.VIO_MDIV.unshift({ TXT: '전체', COD: '' })
      //onButtonsClick({ id: 'btnSearch' })
    } else {
      getCodeList(`HHIF110${newValue}`).then((res) => {
        searchParam.VIO_MDIV = ''
        codeList.VIO_MDIV = res.ORESULT_CUR
        codeList.VIO_MDIV.unshift({ TXT: '전체', COD: '' })
        onButtonsClick({ id: 'btnSearch' })
      })
    }
  },
  {
    immediate: true,
  }
)
//년도 체크박스 감지
//년도 체크박스 체크시 일자 비활성화
watch(
  () => searchParam.YEAR_YN,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      searchParam.MONTH_YN = 'N'
      yearReadOnly.value = false
      monthReadOnly.value = true
    } else {
      searchParam.MONTH_YN = 'Y'
    }
  },
  {
    immediate: true,
  }
)

//일자 체크박스 감지
//일자 체크박스 체크시 년도 비활성화
watch(
  () => searchParam.MONTH_YN,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      searchParam.YEAR_YN = 'N'
      yearReadOnly.value = true
      monthReadOnly.value = false
    } else {
      searchParam.YEAR_YN = 'Y'
    }
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              width="300px"
              label-width="50px"
              :label="$t('사업부')"
              v-model="searchParam.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
            ></i-select>
            <i-select
              width="240px"
              label-width="50px"
              :label="$t('부서')"
              v-model="searchParam.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
            ></i-select>
            <v-checkbox
              class="mt-1"
              true-value="Y"
              false-value="N"
              v-model="searchParam.YEAR_YN"
            ></v-checkbox>
            <i-select
              width="200px"
              :label="$t('년도')"
              v-model="searchParam.YEAR"
              type="YEAR"
              true-value="Y"
              false-value="N"
              :disabled="yearReadOnly"
            ></i-select>
            <v-checkbox
              class="mt-1"
              true-value="Y"
              false-value="N"
              v-model="searchParam.MONTH_YN"
            ></v-checkbox>
            <i-input
              :label="$t('월')"
              width="180px"
              class="mr-0"
              type="month"
              v-model="searchParam.FROM"
              :disabled="monthReadOnly"
            ></i-input>
            <span class="mx-1 mt-1">~</span>
            <i-input
              width="155px"
              type="month"
              v-model="searchParam.TO"
              :disabled="monthReadOnly"
            ></i-input>
          </div>
          <div class="d-flex mt-2">
            <i-select
              width="300px"
              label-width="50px"
              :label="$t('수칙구분')"
              v-model="searchParam.VIO_GDIV"
              :items="codeList.VIO_GDIV"
              item-title="TXT"
              item-value="COD"
            ></i-select>
            <i-select
              width="400px"
              label-width="50px"
              :label="$t('항목구분')"
              v-model="searchParam.VIO_MDIV"
              :items="codeList.VIO_MDIV"
              item-title="TXT"
              item-value="COD"
              multiple
              @update:modelValue="selectedVioMdiv"
              clearable
            ></i-select>

            <span class="mt-1 mr-2">조직구분</span>
            <div>
              <v-radio-group inline v-model="searchParam.IO_DIV">
                <v-radio label="전체" value=""></v-radio>
                <v-radio label="직영" value="A"></v-radio>
                <v-radio label="협력사" value="B"></v-radio>
                <v-radio label="단기공사" value="D"></v-radio>
              </v-radio-group>
            </div>

            <span class="ml-4 mr-2" style="margin-top: 4px">생산/비생산</span>
            <div>
              <v-radio-group inline v-model="searchParam.PROD_DIV">
                <v-radio label="전체" value=""></v-radio>
                <v-radio label="생산" value="Y"></v-radio>
                <v-radio label="비생산" value="N"></v-radio>
              </v-radio-group>
            </div>
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet width="10%" class="pa-0 h-auto mr-3">
            <div>
              <v-sheet
                class="gridTitle d-flex align-center justify-center flex-column sheetStyle chart_border"
                style="margin-left: 4px; width: 184px"
              >
                <div>전체</div>
                <span class="mt-5">{{ VIO_COUNT.VIO_TOTAL }}건</span>
              </v-sheet>
            </div>
            <div>
              <v-btn
                id="VIO_A"
                class="gridTitle d-flex align-center justify-center flex-column sheetStyle chart_border"
                style="margin-left: 4px; width: 184px"
                @click="clickVioA"
                color="#FFFFFF"
              >
                <div>
                  <div>절대수칙</div>
                  <div class="mt-5">{{ VIO_COUNT.VIO_A }}건</div>
                </div>
              </v-btn>
            </div>
            <div>
              <v-btn
                id="VIO_D"
                class="gridTitle d-flex align-center justify-center flex-column sheetStyle chart_border"
                style="margin-left: 4px; width: 184px"
                @click="clickVioD"
                color="#FFFFFF"
              >
                <div>
                  <div>중대성수칙</div>
                  <div class="mt-5">{{ VIO_COUNT.VIO_D }}건</div>
                </div>
              </v-btn>
            </div>
            <div>
              <v-btn
                id="VIO_B"
                class="gridTitle d-flex align-center justify-center flex-column sheetStyle chart_border mr-3"
                style="margin-left: 4px; width: 184px"
                @click="clickVioB"
                color="#FFFFFF"
              >
                <div>
                  <div>일반수칙</div>
                  <div class="mt-5">{{ VIO_COUNT.VIO_B }}건</div>
                </div>
              </v-btn>
            </div>
          </v-sheet>

          <v-sheet width="30%" height="380px" class="pa-0 h-auto mr-3">
            <div class="chart_border mb-3 pa-2">
              <span class="gridTitle d-flex justify-center">
                소속별 위반현황</span
              >
              <Echart
                :option="chartsOptions1"
                ref="echart"
                class="echarts_style"
                autoresize
              ></Echart>
            </div>
            <div class="chart_border pa-2">
              <span class="gridTitle d-flex justify-center"
                >시간대별 위반현황</span
              >
              <Echart
                :option="chartsOptions2"
                :key="chartDraw2"
                ref="echart"
                class="echarts_style"
                autoresize
              ></Echart>
            </div>
          </v-sheet>
          <v-sheet width="60%" class="pa-0 h-auto">
            <div class="chart_border">
              <span class="gridTitle d-flex justify-center mt-2"
                >안전수칙위반 건수</span
              >
              <Echart
                :option="chartsOptions3"
                :key="chartDraw3"
                ref="echart"
                class="main_echarts_style"
                autoresize
              ></Echart>
            </div>
          </v-sheet>
        </div>
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
//소속별위반현황,시간대별위반현황 class
.echarts_style {
  height: 320px;
  width: 100%;
}
//안전수칙 위반건수 class
.main_echarts_style {
  height: 700px;
  width: 100%;
}

.v-autocomplete__selection {
  flex-wrap: nowrap;
}

::v-deep(.v-field__input) {
  min-height: 40px !important;
  flex-wrap: nowrap !important;
  color: #000 !important;
  overflow: hidden !important;
}
//테두리 class
.chart_border {
  border: #f4f5f9 solid 2px;
}
//왼쪽 건수 sheet class
.sheetStyle {
  width: 100%;
  height: 183px;
}

.sheetBackGound {
  background-color: #f4f5f6;
}
</style>
