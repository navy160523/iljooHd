<script setup>
import { ref, reactive, onMounted, nextTick, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useRoute, useRouter } from 'vue-router'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { isEmpty } from "@/@core/utils"

defineOptions({
  name:'30_safety-SAF_F-SAFFA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
 
// SLI Dashboard 현황
const router = useRouter() 
const stateSLI = ref('total')
const selectPart = ref('')
const selectPartNm = ref('')
const selectDept = ref('')
const weakMonth = ref('') // 취약월(to_date의 이전달)
const dbData = ref([])

const searchParams = reactive({
  CMPNY_DIV: 'HHI',  // userStore.cmpnyDiv
  BSNS_CD: '',
  DEPT_CD: '',
  PART_CD: '',
  TMP_FROM_DT: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), //dayjs().format('YYYY-MM-DD'),
  TMP_TO_DT: dayjs().format('YYYY-MM-DD'),
  FROM_DT: '',
  TO_DT: '',
})

const cardName = reactive({
  total: '전사',
  AC00: '조선', // 조선
  AQ00: '해양에너지', // 해양에너지
  AE00: '함정·중형선', // 특수선
  AK00: '엔진기계', // 엔진기계
})

const data = reactive({
  AC00: {}, // 조선
  AQ00: {}, // 해양에너지
  AE00: {}, // 특수선
  AK00: {}, // 엔진기계
})

const partData = reactive({
  DATA: {}
})

const cardData = reactive({ // 왼쪽 카드 데이터(부문 미선택시)
  AC00: { L: [], R: [], OPEN : false, POINT: 0 }, // 조선
  AQ00: { L: [], R: [], OPEN : false, POINT: 0 }, // 해양에너지
  AE00: { L: [], R: [], OPEN : false, POINT: 0 }, // 특수선
  AK00: { L: [], R: [], OPEN : false, POINT: 0 }, // 엔진기계
})

const cardResult = ref([]) // 왼쪽카드의 사업부별 최종 데이터(버튼에 다라 달라짐)
const partResult = reactive({  // 왼쪽 카드에서 부문 선택시 데이터(사업부 선택할때마다 달라짐)
  DATA: {}
})

const rightResult = reactive({ // 오른쪽 카드 데이터
  TITLE: '전사',
  AVR_SCORE: '',
  RUL_POINT: 0,
  ACC_POINT: 0,
  EDU_POINT: 0,
  DNG_POINT: 0,
  CHK_POINT: 0,
  RUL_RESULT_POINT: 0,
  ACC_RESULT_POINT: 0,
  EDU_RESULT_POINT: 0,
  DNG_RESULT_POINT: 0,
  CHK_RESULT_POINT: 0,
  WEAK_LIST: [],
})

const cards = ref([
  { id: 'total', name: '전사' },
  { id: 'AC00', name: '조선' },
  { id: 'AQ00', name: '해양에너지' },
  { id: 'AE00', name: '함정·중형선' },
  { id: 'AK00', name: '엔진기계' },
])

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

const safetyList = ref([
  { id: "RUL_RESULT_POINT", name: "안전수칙" },
  { id: "ACC_RESULT_POINT", name: "안전사고" },
  { id: "EDU_RESULT_POINT", name: "안전교육" },
  { id: "DNG_RESULT_POINT", name: "위험성평가" },
  { id: "CHK_RESULT_POINT", name: "안전점검/개입" },
])

const notSafety = ref(['safety001', 'safety002'])

// SLI 카드 [전사/조선해양/특수선/엔진기계] 클릭 이벤트 
const onSLIstateCard = (param) => {
  stateSLI.value = param
  rightResult.TITLE = cardName[param]
  selectDept.value = ''
  onButtonsClick({ id: 'btnSearch' })
}

const radarState = ref({
  radar: {
    indicator: [
      { text: '안전수칙' },
      { text: '안전사고' },
      { text: '안전교육' },
      { text: '위험성평가' },
      { text: '안전점검/개입' },
    ],
    axisName: {
      color: "#051537",
      fontFamily: "pretendard",
      fontSize: 14,
      formatter: (value, param) => {
        const isNotSafety = notSafety.value.some(el => el == param.id)
        return `{default|${value}\n} {${isNotSafety ? 'warn' : 'normal' }|${param.value}}`;
      },
      rich: {
        default: {
          align: 'center',
          lineHeight: 16.71
        },
        normal: {
          align: 'center',
          padding: [6, 0, 0, 0],
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 19.09
        },
        warn: {
          color: '#FF5252',
          align: 'center',
          padding: [6, 0, 0, 0],
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 19.09
        }
      }
    },
    center: ["50%", "50%"],
  },
  series: [
    {
      type: "radar",
      label: {
        show: true,
        position: "bottom",
      },
      data: [
        {
          value: [10,15,13,8,5],
          areaStyle: {
            color: "rgba(26, 64, 199, 0.10)",
          },
          symbol: "none",
        },
      ],
    },
  ],
})

//메뉴버튼
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnSliMyDetail') {
    router.push({path: '/30_safety/SAF_F/SAFFA0020', state: { data: null, myDetail: true, setDept: true }})
    window.history.replaceState({ data: null, myDetail: true, setDept: true }, '')
  } else if (btn.id === 'btnSliDetail') {
    if(isEmpty(selectDept.value)) return Message.err(t('부서를 선택해 주시기 바랍니다.'))

    let routerData = {
      TMP_FROM_DT: searchParams.TMP_FROM_DT,
      TMP_TO_DT: searchParams.TMP_TO_DT,
      BSNS_CD: selectPart.value.split('_')[0],
      PART_CD: selectPart.value.split('_')[1],
      DEPT_CD: selectDept.value,
    }
    router.push({path: '/30_safety/SAF_F/SAFFA0020', state: { data: routerData, myDetail: false, setDept: true }})
    window.history.replaceState({ data: routerData, myDetail: false, setDept: true }, '')
  }
}

//조회 함수
const searchData = () =>{
  searchParams.FROM_DT = searchParams.TMP_FROM_DT.replaceAll('-','')
  searchParams.TO_DT = searchParams.TMP_TO_DT.replaceAll('-','')
  return commonSearchApi({ queryId : 'SAFFA0010_SEARCH_03', param: searchParams })
}

const getGrade = (score) => {
  if (90 <= score) return '양호'
  else if (80 <= score) return '주의'
  else if (70 <= score) return '경고'
  else return '위험'
}

//조회 후 반영
const afterSearch = res =>{
  console.log(selectPartNm.value)
  console.log(selectDept.value)
  // 데이터 초기화
  data.AC00 = {}
  data.AQ00 = {}
  data.AK00 = {}
  data.AE00 = {} 
  partData.DATA = {}
  cardData.AC00 = { L: [], R: [] }
  cardData.AQ00 = { L: [], R: [] }
  cardData.AK00 = { L: [], R: [] }
  cardData.AE00 = { L: [], R: [] }
  // 뒤늦게 부서를 선택하면 해당부서만 데이터가 나와야 한다고 하여... DB임시저장 변수
  dbData.value = res.ORESULT_CUR
  
  selectPart.value = ''
  for(let dt of res.ORESULT_CUR) {
    let bsnsPartCd = dt.BSNS_CD + '_' + dt.PART_CD
    
    // 처음엔 사업부 > 부문까지만 선택하고 부서를 선택하면 상세 부서보기로 이동하여 이렇게짰다....
    if(dt.BSNS_CD in data) {
      if(dt.PART_CD in data[dt.BSNS_CD]){
        data[dt.BSNS_CD][dt.PART_CD].SUM_TOT_POINT = Number(data[dt.BSNS_CD][dt.PART_CD].SUM_TOT_POINT) + Number(dt.TOT_POINT)
        data[dt.BSNS_CD][dt.PART_CD].ACC_POINT = Number(data[dt.BSNS_CD][dt.PART_CD].ACC_POINT) + Number(dt.ACC_POINT)
        data[dt.BSNS_CD][dt.PART_CD].EDU_POINT = Number(data[dt.BSNS_CD][dt.PART_CD].EDU_POINT) + Number(dt.EDU_POINT)
        data[dt.BSNS_CD][dt.PART_CD].RUL_POINT = Number(data[dt.BSNS_CD][dt.PART_CD].RUL_POINT) + Number(dt.RUL_POINT)
        data[dt.BSNS_CD][dt.PART_CD].DNG_POINT = Number(data[dt.BSNS_CD][dt.PART_CD].DNG_POINT) + Number(dt.DNG_POINT)
        data[dt.BSNS_CD][dt.PART_CD].CHK_POINT = Number(data[dt.BSNS_CD][dt.PART_CD].CHK_POINT) + Number(dt.CHK_POINT)
        data[dt.BSNS_CD][dt.PART_CD].CNT = Number(data[dt.BSNS_CD][dt.PART_CD].CNT) + 1
        data[dt.BSNS_CD][dt.PART_CD].TOT_POINT = Math.round(Number(data[dt.BSNS_CD][dt.PART_CD].SUM_TOT_POINT) / Number(data[dt.BSNS_CD][dt.PART_CD].CNT))
        data[dt.BSNS_CD][dt.PART_CD].TOT_GRADE = getGrade(data[dt.BSNS_CD][dt.PART_CD].TOT_POINT)
        if(!isEmpty(dt.WEAK_NM)) {
          for(var weak of dt.WEAK_NM.split('||')) {
            data[dt.BSNS_CD][dt.PART_CD].WEAK_LIST.push(weak)
          }
        }
      } else {
        data[dt.BSNS_CD][dt.PART_CD] = {
          TOT_GRADE: dt.TOT_GRADE,
          SUM_TOT_POINT: dt.TOT_POINT, 
          TOT_POINT: dt.TOT_POINT, 
          BSNS_CD: dt.BSNS_CD,
          BSNS_NM: dt.BSNS_NM,
          PART_CD: dt.PART_CD,
          PART_NM: dt.PART_NM,
          ACC_POINT: Number(dt.ACC_POINT),
          EDU_POINT: Number(dt.EDU_POINT),
          RUL_POINT: Number(dt.RUL_POINT),
          DNG_POINT: Number(dt.DNG_POINT),
          CHK_POINT: Number(dt.CHK_POINT),
          CNT : 1,
          WEAK_LIST: [],
        }
        if(!isEmpty(dt.WEAK_NM)) {
          for(var weak of dt.WEAK_NM.split('||')) {
            data[dt.BSNS_CD][dt.PART_CD].WEAK_LIST.push(weak)
          }
        }
      }
    }

    if(bsnsPartCd in partData.DATA) {
      partData.DATA[bsnsPartCd].push(dt)
    } else {
      partData.DATA[bsnsPartCd] = [dt]
    }
  } 
  
  Object.entries(data).forEach(([key, value]) => {
    let cnt = 0
    Object.entries(value).forEach(([k, v]) => {
      if(cnt % 2 === 0) {
        cardData[v.BSNS_CD].L.push(v)
      } else {
        cardData[v.BSNS_CD].R.push(v)
      }
      cnt += 1
    })
  })
  cardDataProcess()
}

const cardDataProcess = () => {
  cardResult.value = []

  if(stateSLI.value === 'total') {
    cardResult.value.push({NAME: '조선', CD: 'AC00', DATA:cardData.AC00, DATA2:data.AC00})
    cardResult.value.push({NAME: '해양에너지', CD: 'AQ00', DATA:cardData.AQ00, DATA2:data.AQ00})
    cardResult.value.push({NAME: '함정·중형선', CD: 'AE00', DATA:cardData.AE00, DATA2:data.AE00})
    cardResult.value.push({NAME: '엔진기계', CD: 'AK00', DATA:cardData.AK00, DATA2:data.AK00})
  } else {
    cardResult.value.push({NAME: cardName[stateSLI.value], CD: stateSLI.value, DATA:cardData[stateSLI.value], DATA2:data[stateSLI.value]})
  }

  if(Object.keys(cardResult.value[0].DATA).length != 0) {
    // selectPart.value = cardResult.value[0].CD + '_' + Object.keys(cardResult.value[0].DATA)[0]
    if(cardResult.value[0].DATA[Object.keys(cardResult.value[0].DATA)[0]].PART_NM == null) selectPartNm.value = cardName[stateSLI.value]
    else selectPartNm.value = cardResult.value[0].DATA[Object.keys(cardResult.value[0].DATA)[0]].PART_NM
    // partResult.DATA = partData.DATA[selectPart.value]
    if(selectPart.value !== '') rightResult.TITLE = cardResult.value[0].NAME + ' ' + selectPartNm.value
  } else {
    partResult.DATA = []
    rightResult.TITLE = ''
  }

  makeRightData()
} 

// v-chip 문구 결정
const setChipContent = (score) => {
  if(90 <= score) return '양호'
  else if(80 <= score) return '주의'
  else if(70 <= score) return '경고'
  else return '위험'
}

// v-chip 색 결정
const setChipColor = (score) => {
  if(90 <= score) return 'info'
  else if(80 <= score) return 'success'
  else if(70 <= score) return 'warning'
  else return 'error'
}

// 동시에 깜빡이게 하기 위함
const setHighlight = () => {
  const highlightList = document.querySelectorAll('.highlight-background')
  const tmpHigh = document.querySelectorAll('.tmp-highlight-background')
  highlightList.forEach(hl => {
    hl.classList.remove('highlight-background')
  })
  setTimeout(() => {
    tmpHigh.forEach(tmp => {
      tmp.classList.add('highlight-background')
    })
  }, 10)
}

// 부문 클릭
const clickPart = (part) => {
  selectPart.value = part.BSNS_CD + '_' + part.PART_CD
  partResult.DATA = partData.DATA[selectPart.value]
  selectDept.value = ''
  if(part.PART_NM == null) { 
    selectPartNm.value = part.BSNS_NM
    rightResult.TITLE = part.BSNS_NM
  } else {
    selectPartNm.value = part.PART_NM
    rightResult.TITLE = part.BSNS_NM + ' ' + part.PART_NM
  }

  makeRightData()

  nextTick(() => {
    const element = document.getElementById(String(part.PART_CD))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    } 
    setHighlight()
  })
}

// 부서 클릭
const clickDept = (dept) => {
  selectDept.value = dept.DEPT_CD
  rightResult.TITLE = dept.DEPT_NM
  makeRightData()

  nextTick(() => {
    setHighlight()
  })
}

const makeRightData = () => {
  let sumScore = 0  // 점수합
  let scoreCnt = 0  // 점수갯수
  let max = 0 // 최대치
  
  rightResult.AVR_SCORE = '' // data 초기화
  rightResult.RUL_POINT = 0
  rightResult.ACC_POINT = 0
  rightResult.EDU_POINT = 0
  rightResult.DNG_POINT = 0
  rightResult.CHK_POINT = 0

  if(selectDept.value != '') { // 부서 선택
    for(var card of dbData.value) {
      if(selectDept.value == card.DEPT_CD) {
        sumScore += card.TOT_POINT
        scoreCnt += 1
        rightResult.ACC_POINT = Number(rightResult.ACC_POINT) + Number(card.ACC_POINT)
        rightResult.EDU_POINT = Number(rightResult.EDU_POINT) + Number(card.EDU_POINT)
        rightResult.RUL_POINT = Number(rightResult.RUL_POINT) + Number(card.RUL_POINT)
        rightResult.DNG_POINT = Number(rightResult.DNG_POINT) + Number(card.DNG_POINT)
        rightResult.CHK_POINT = Number(rightResult.CHK_POINT) + Number(card.CHK_POINT)
      }
    }
  } else if(selectPart.value !== '') { // 부문 선택
    for(var card of partResult.DATA) {
      sumScore += card.TOT_POINT
      scoreCnt += 1
      rightResult.ACC_POINT = Number(rightResult.ACC_POINT) + Number(card.ACC_POINT)
      rightResult.EDU_POINT = Number(rightResult.EDU_POINT) + Number(card.EDU_POINT)
      rightResult.RUL_POINT = Number(rightResult.RUL_POINT) + Number(card.RUL_POINT)
      rightResult.DNG_POINT = Number(rightResult.DNG_POINT) + Number(card.DNG_POINT)
      rightResult.CHK_POINT = Number(rightResult.CHK_POINT) + Number(card.CHK_POINT)
    }
  } else { // 부문 미선택
    for(var card of cardResult.value) {
      let bsnsScore = 0
      let bsnsCnt = 0
      for(var dt of card.DATA.L) {
        let dataCnt = Number(dt.CNT)
        sumScore += dt.TOT_POINT
        scoreCnt += 1
        rightResult.ACC_POINT = Number(rightResult.ACC_POINT) + Number(dt.ACC_POINT/dataCnt)
        rightResult.EDU_POINT = Number(rightResult.EDU_POINT) + Number(dt.EDU_POINT/dataCnt)
        rightResult.RUL_POINT = Number(rightResult.RUL_POINT) + Number(dt.RUL_POINT/dataCnt)
        rightResult.DNG_POINT = Number(rightResult.DNG_POINT) + Number(dt.DNG_POINT/dataCnt)
        rightResult.CHK_POINT = Number(rightResult.CHK_POINT) + Number(dt.CHK_POINT/dataCnt)
        bsnsCnt += 1
        bsnsScore += Number(dt.TOT_POINT)
      } 
      for(var dt of card.DATA.R) {
        let dataCnt = Number(dt.CNT)
        sumScore += dt.TOT_POINT
        scoreCnt += 1
        rightResult.ACC_POINT = Number(rightResult.ACC_POINT) + Number(dt.ACC_POINT/dataCnt)
        rightResult.EDU_POINT = Number(rightResult.EDU_POINT) + Number(dt.EDU_POINT/dataCnt)
        rightResult.RUL_POINT = Number(rightResult.RUL_POINT) + Number(dt.RUL_POINT/dataCnt)
        rightResult.DNG_POINT = Number(rightResult.DNG_POINT) + Number(dt.DNG_POINT/dataCnt)
        rightResult.CHK_POINT = Number(rightResult.CHK_POINT) + Number(dt.CHK_POINT/dataCnt)
        bsnsCnt += 1
        bsnsScore += Number(dt.TOT_POINT)
      }

      if(bsnsCnt === 0) cardData[card.CD].POINT = 0
      else cardData[card.CD].POINT = Math.round(bsnsScore / bsnsCnt)
    }
  }
  if(scoreCnt === 0) {
    rightResult.AVR_SCORE = 0
    rightResult.ACC_RESULT_POINT = 0
    rightResult.EDU_RESULT_POINT = 0
    rightResult.RUL_RESULT_POINT = 0
    rightResult.DNG_RESULT_POINT = 0
    rightResult.CHK_RESULT_POINT = 0
  }
  else {
    rightResult.AVR_SCORE = Math.round(sumScore / scoreCnt)
    rightResult.ACC_RESULT_POINT = oneRound(rightResult.ACC_POINT / scoreCnt)
    rightResult.EDU_RESULT_POINT = oneRound(rightResult.EDU_POINT / scoreCnt)
    rightResult.RUL_RESULT_POINT = oneRound(rightResult.RUL_POINT / scoreCnt)
    rightResult.DNG_RESULT_POINT = oneRound(rightResult.DNG_POINT / scoreCnt)
    rightResult.CHK_RESULT_POINT = oneRound(rightResult.CHK_POINT / scoreCnt)
  }
  radarState.value.series[0].data[0].value = [rightResult.RUL_RESULT_POINT, rightResult.ACC_RESULT_POINT, rightResult.EDU_RESULT_POINT, rightResult.DNG_RESULT_POINT, rightResult.CHK_RESULT_POINT]
  // for(var i of radarState.value.series[0].data[0].value) {
  //   if(max < i) {
  //     max = i
  //   }
  // }
  radarState.value.radar.indicator = safetyList.value.map(el => ({
    id: el.id,
    name: el.name,
    max: 20,
    value: rightResult[el.id]
  }))
  setWeakList()
}

const setWeakList = () => {
  rightResult.WEAK_LIST = []
  if(selectDept.value != '') { // 부서 선택
    for(var card of dbData.value) {
      if(selectDept.value == card.DEPT_CD) {
        if(isEmpty(card.WEAK_NM)) continue
        for(const weak of card.WEAK_NM.split('||')) {
          if(rightResult.WEAK_LIST.indexOf(weak) < 0) {
            rightResult.WEAK_LIST.push(weak)
          }
        }
      }
    }
  } else if(selectPart.value != '') { // 부문 선택 시 
    const bsns = selectPart.value.split('_')[0]
    const part = selectPart.value.split('_')[1]

    for(const weak of data[bsns][part].WEAK_LIST) {
      if(rightResult.WEAK_LIST.indexOf(weak) < 0) {
        rightResult.WEAK_LIST.push(weak)
      }
    }
  } else if(stateSLI.value === 'total') { // 부문 선택하지 않았고 전사 일 시
    for (const key in data) {
      for(const k in data[key]) {
        for(const weak of data[key][k].WEAK_LIST) {
          if(rightResult.WEAK_LIST.indexOf(weak) < 0) {
            rightResult.WEAK_LIST.push(weak)
          }
        }
      }
    }
  } else {
    for(const k in data[stateSLI.value]) { // 부문 선택하지 않았고 사업부 선택시
      for(const weak of data[stateSLI.value][k].WEAK_LIST) {
        if(rightResult.WEAK_LIST.indexOf(weak) < 0) {
          rightResult.WEAK_LIST.push(weak)
        }
      }
    }
  }
}

const lineLegendColor = (index) => {
  const score = (index + 12) * 5
  if(index == 0 && rightResult.AVR_SCORE < 60) {
    return colorPaletteLine.value[index] 
  }
  if(score - 5 <= rightResult.AVR_SCORE && rightResult.AVR_SCORE < score) {
    return colorPaletteLine.value[index]
  }
  if(rightResult.AVR_SCORE == 100 && index == 8) {
    return colorPaletteLine.value[index]
  }
  return '#80808060' 
}

// 선택된 부문 강조
const highlightPart = (part) => {
  if(selectPart.value.split('_')[1] == part.PART_CD) {
    return 'tmp-highlight-background'
  }
  return ''
}

// 선택된 부서 강조
const highlightDept = (dept) => {
  if(selectDept.value == dept.DEPT_CD) {
    return 'tmp-highlight-background'
  }
  return ''
}

const getFrom = (value) => {
  // Date 객체로 변환
  let date = new Date(value)

  // 현재 일(day)을 기억해둠
  let originalDay = date.getDate()

  // 한 달 전으로 설정 (month는 0부터 시작하므로 -1을 사용)
  date.setMonth(date.getMonth() - 1)

  // 만약 날짜가 넘어갔다면, 마지막 날로 조정
  if (date.getDate() !== originalDay) {
      date.setDate(0) // 이전 달의 마지막 날로 설정
  }

  // 하루 추가
  date.setDate(date.getDate() + 1)

  // YYYY-MM-DD 형식으로 다시 변환
  let year = date.getFullYear()
  let month = ('0' + (date.getMonth() + 1)).slice(-2) // 월은 0부터 시작하므로 +1
  let day = ('0' + date.getDate()).slice(-2)

  searchParams.TMP_FROM_DT = `${year}-${month}-${day}`

  // 취약 월 계산(to_date의 이전달)
  date = new Date(value)
  date.setMonth(date.getMonth() - 1)
  weakMonth.value = date.getMonth() + 1
}

const oneRound = (value) => {
  return Math.round(value*10) / 10
}

// 카드 오픈, 닫음
const clickOpen = (card) => {
  cardData[card.CD].OPEN = !cardData[card.CD].OPEN
}

// 부서 변경 시 자동 조회
watch(() => searchParams.TMP_TO_DT, (newValue, oldValue) => {
  getFrom(newValue)
})

onMounted(() => {
  onSLIstateCard('total')
  var yesterday = dayjs().subtract(1,'day')
  searchParams.TMP_TO_DT = yesterday.format('YYYY-MM-DD')
  searchParams.TMP_FROM_DT = yesterday.subtract(1,'month').add(1,'day').format('YYYY-MM-DD')
})
 
</script>

<template>
  <v-card class="pa-3">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnSliMyDetail']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.TMP_FROM_DT"
            :label="$t('조회기간')"
            type="date"
            width="250px"
            :disabled="true"
          />
          <i-input
            v-model="searchParams.TMP_TO_DT"
            :label="$t('~')"
            type="date"
            width="250px"
          />
        </v-sheet>
        <v-sheet no-gutters class="dashboard-contents mt-4 h-auto">
          <div class="chart-contents h-grow">
            <v-sheet width="50%" class="pr-2 gauge-chart">
              <!-- 버튼(전사, 조선해양, 특수선, 엔진기계) -->
              <VCard
                color="inputDisabled"
                variant="outlined"
                width="100%"
                height="100%"
              >
                <div class="btn-contents d-flex ma-4">
                  <v-hover v-for="(item, i) in cards" :key="i">
                    <template v-slot:default="{ isHovering, props }">
                      <v-spacer v-if="i !== 0" style="width: 16px" />
                      <VCard
                        hover
                        v-bind="props"
                        :color="isHovering|| stateSLI == item.id ? 'primary' : 'inputDisabled'"
                        :elevation="isHovering|| stateSLI == item.id ? '3' : '0'"
                        variant="outlined"
                        height="55"
                        width="25%"
                        class="scoreCard pY-20 pX-24 f-16 w-400 d-flex align-center justify-center"
                        :class="{'cardHover' : isHovering || stateSLI == item.id}"
                        @click="onSLIstateCard(item.id)"
                      >
                        <p>{{ item.name }}</p>
                      </VCard>
                    </template>
                  </v-hover>
                </div>
                <!-- 전사 -->
                <div v-if="selectPart === ''" style="overflow-y: auto; height:calc(100vh - (378px));">
                  <div class="ma-4" v-for="(card, i) in cardResult" :key="i">
                    <div class="d-flex mb-3">
                      <div class="card-title" @click="clickOpen(card)" :class="stateSLI==='total'? 'cursor-point':''">
                        {{ card.NAME }}
                      </div>
                      <div class="card-open align-center" @click="clickOpen(card)" v-if="stateSLI === 'total'">
                        {{ cardData[card.CD].OPEN ? '∧':'∨' }}
                      </div>
                      <div class="d-flex ml-auto align-center" v-if="stateSLI === 'total'">
                        <v-chip label :color="setChipColor(cardData[card.CD].POINT)" density>
                          <span> {{ setChipContent(cardData[card.CD].POINT) }} </span>
                        </v-chip>
                        <span class="score mr-5" style="width:3rem; text-align: right;">{{ cardData[card.CD].POINT }}</span>
                      </div>
                    </div>
                    <div class="safe-card pa-5" v-if="cardData[card.CD].OPEN || stateSLI !== 'total'"> 
                      <div class="d-flex">
                        <div class="content">
                          <div 
                            class="d-flex pa-2 ma-1 align-center part-name" 
                            v-for="(cardContent, j) in card.DATA.L" 
                            :key="j" 
                            @click="clickPart(cardContent)" 
                            :class="highlightPart(cardContent)"
                          >
                            <v-chip :color="setChipColor(cardContent.TOT_POINT)" label density>
                              <span class="ma-1">{{ setChipContent(cardContent.TOT_POINT) }}</span>
                            </v-chip>
                            <span class="text-card ml-4">{{ cardContent.PART_NM }}</span>
                            <span class="text-card ml-auto mr-4">{{ cardContent.TOT_POINT }}</span>
                          </div>
                        </div>
                        <v-divider 
                          class="mr-2"
                          vertical
                          style="color: #d8d8d8; opacity: 1 !important" 
                        />
                        <div class="content">
                          <div class="d-flex ma-3 align-center part-name" v-for="(cardContent, j) in card.DATA.R" :key="j" @click="clickPart(cardContent)">
                            <v-chip :color="setChipColor(cardContent.TOT_POINT)" label density>
                              <span class="ma-1">{{ setChipContent(cardContent.TOT_POINT) }}</span>
                            </v-chip>
                            <span class="text-card ml-4">{{ cardContent.PART_NM }}</span>
                            <span class="text-card ml-auto mr-4">{{ cardContent.TOT_POINT }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 그외-->
                <div class="d-flex" v-else>
                  <div class="w-50" style="overflow-y: auto; height:calc(100vh - (378px));">
                    <div class="ma-4" v-for="(card, i) in cardResult" :key="i">
                      <IGridTitle
                        :title="$t(card.NAME)"
                      >
                      </IGridTitle>
                      <div class="safe-card w-100 pa-4" >
                        <div 
                          class="d-flex pa-2 ma-1 align-center part-name" 
                          v-for="(cardContent, j) in card.DATA2" 
                          :key="j" 
                          @click="clickPart(cardContent)"
                          :class="highlightPart(cardContent)"
                          :id="cardContent.PART_CD"
                        >
                          <v-chip :color="setChipColor(cardContent.TOT_POINT)" label density>
                            <span class="ma-1">{{ setChipContent(cardContent.TOT_POINT) }}</span>
                          </v-chip>
                          <span class="text-card ml-4">{{ cardContent.PART_NM }}</span>
                          <span class="text-card ml-auto mr-4">{{ cardContent.TOT_POINT }}</span>
                        </div>
                      </div>                     
                    </div>
                  </div>
                  <div class="w-50 pa-4" style="overflow-y: auto; height:calc(100vh - (378px));">
                    <IGridTitle
                      :title="$t(selectPartNm)"
                      :button-list="['btnSliDetail']"
                      @click-button="onButtonsClick"
                    >  
                    </IGridTitle> 
                    <div class="safe-card w-100 pa-4" >
                      <div 
                        class="d-flex ma-1 pa-2 align-center dept-name" 
                        v-for="(cardContent, j) in partResult.DATA" 
                        :key="j" 
                        @click="clickDept(cardContent)"
                        :class="highlightDept(cardContent)"
                      >
                        <v-chip :color="setChipColor(cardContent.TOT_POINT)" label density>
                          <span class="ma-1">{{ setChipContent(cardContent.TOT_POINT) }}</span>
                        </v-chip>
                        <span class="text-card ml-4">{{ cardContent.DEPT_NM }}</span>
                        <span class="text-card ml-auto mr-4">{{ cardContent.TOT_POINT }}</span>
                      </div>
                    </div>   
                  </div>
                </div>
              </VCard>
            </v-sheet>
            <v-sheet width="50%" class="pr-2 radar-chart">
              <VCard
                color="inputDisabled"
                variant="outlined"
                width="100%"
                height="100%"
              >
                <v-sheet height="25%">
                  <div class="d-flex">
                    <v-sheet class="ma-4 right-card" width="25%" height="90%">
                      <div class="title"> {{ rightResult.TITLE }}</div>
                      <div class="d-flex align-center mt-3" style="justify-content: center;"> 
                        <v-chip label :color="setChipColor(rightResult.AVR_SCORE)" density>
                          <span> {{ setChipContent(rightResult.AVR_SCORE) }} </span>
                        </v-chip>
                        <span class="ml-1 score">{{ rightResult.AVR_SCORE }}</span>
                      </div>
                    </v-sheet>
                    <v-sheet width="75%">
                      <div class="d-flex mt-4 mr-4">
                        <v-chip class="mr-2 h-grow justify-center align-center" color="error" label density>
                          <span> 위험 : 70점 미만</span>
                        </v-chip>
                        <v-chip class="mr-2 h-grow justify-center align-center" color="warning" label density>
                          <span> 경고 : 80점 미만</span>
                        </v-chip>
                        <v-chip class="mr-2 h-grow justify-center align-center" color="success" label density>
                          <span> 주의 : 90점 미만</span>
                        </v-chip>
                        <v-chip class="h-grow justify-center align-center" color="info" label density>
                          <span> 양호 : 90점 이상</span>
                        </v-chip>
                      </div>
                      <v-sheet class="d-flex flex-row p-relative lineLegend mt-8 ml-4 mr-8" width="100%" height="10px">
                        <span class="lineLabelStart">
                          55
                        </span>
                        <v-sheet :color=item class="h-grow p-relative mR-2" v-for="(item,index) in colorPaletteLine" :key="index">
                          <span class="lineLabel">
                            {{ (index+12)*5 }}
                          </span>
                        </v-sheet>
                        <v-sheet width=30></v-sheet> 
                      </v-sheet>
                      <v-sheet class="d-flex flex-row p-relative lineLegend mt-3 ml-4 mr-8" width="100%" height="10px">
                        <v-sheet 
                          :color="lineLegendColor(index)" 
                          class="h-grow p-relative mR-2" 
                          v-for="(item,index) in colorPaletteLine" 
                          :key="index">
                        </v-sheet>
                        <v-sheet width=30></v-sheet>
                      </v-sheet>
                    </v-sheet>
                  </div>
                  <div class="d-flex ma-5 align-center" v-if="stateSLI !== 'total' || !isEmpty(selectPart) || !isEmpty(selectDept)">
                    <div class="mr-3 weak-list"> {{ weakMonth }}월 안전관리 취약항목 </div>
                    <v-chip class="mr-2" v-for="(weak,i) in rightResult.WEAK_LIST" :key="i" label density color="error">
                      <span>{{ weak }}</span>
                    </v-chip>
                  </div>
                </v-sheet>
                <v-sheet height="75%">
                  <e-chart :option="radarState" />
                </v-sheet>
              </VCard>
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
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    min-height: 550px;
  }
}
.dashboard-contents {
  position: relative;
  .v-chip {
    padding: 2px 8px !important;
    font-size: 14px !important;
    font-weight: bold;
  }
  .btn-contents {
    height: 55px;
  }
  .scoreCard p {
    color: #051537;
  }
  .cardHover {
    box-shadow: 0px 2px 4px 0px rgba(26, 64, 199, 0.15) !important;
    p {
      color: #1a40c7 !important;
    }
  }
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: rgb(var(--v-theme-textMain));
}

.safe-card {
  background: #F7F7F7;
  .part-name {
    cursor: pointer;
  }
  .dept-name {
    cursor: pointer;
  }
  .text-card {
    color:rgb(24, 24, 24);
    font-size: 1rem;
    font-weight: 600;
  }
}

.card-open {
  font-size: 1.8rem;
  color: #c9c9c9;
  font-weight: 500;
  margin-left: 8px;
  cursor: pointer;
  transform: scaleX(1.5) scaleY(0.7);
}
.right-card {
  background: #F7F7F7;
  justify-content: center;
  text-align: center;
  .title {
    font-size: 1.0rem;
    font-weight: bold;
  }
}
.score {
  font-size: 1.2rem;
  font-weight: bold;
  color: black;
}
.weak-list {
  font-size: 1.2rem;
  font-weight: 600;
}
.lineLegend {
  .lineLabel{
    position:absolute;
    top:-24px;
    right:-8px;
  }
  .lineLabelStart{
    position:absolute;
    top:-24px;
    left:-8px;
  }
}

.cursor-point {
  cursor:pointer !important;
}

@keyframes blink {
  0%, 100% {
    background-color: #F7F7F7; /* 초기 배경색 */
  }
  50% {
    background-color: #abb0ff; /* 깜박거릴 때의 배경색 */
  }
}

.highlight-background {
  animation: blink 1s infinite; /* 1초 동안 깜박이고 무한 반복 */
  border-radius: 50px;
}
</style>