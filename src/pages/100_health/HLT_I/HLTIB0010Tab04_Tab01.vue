<script setup>
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import _ from 'lodash'
const props = defineProps({
  tab01Data: {
    type: Object,
  },
  selectedEmpData: {
    type: Object,
  },
})

let previousValue = ''
const P1_Q3_C6_Y = ref(false)
const P1_Q3_C6_N = ref(false)
const hazardInvestigationFieldTab04_Tab01 = reactive({
  CMPNY_DIV: '', //사업장구분
  WORK_STANDARD_ID: '', //작업표준ID
  ES_SEQ: '', //순번
  ES_DATE: '', //조사일자
  ASGN_NM: '', // 부서,협력사명
  ASGN_CD: '', // 부서,협력사코드
  EMP_NM: '', //성명
  EMP_NO: '', //사번
  DUTY_CD: '', //직무코드
  DUTY_NM: '', //직무명
  SOSOG_DIV: '', //소속구분
  CMPNY_YEARS: '', //현 직장경력_년
  CMPNY_MNTH: '', //현 직장경력_개월
  AGE: '', //연령(만_세)
  SEX: '', //성별(M:남,F:여)
  MRY_YN: '', //결혼여부(Y:기혼,N:미혼)
  WRK_DESC: '', //작업내용
  WRK_YEARS: '', //현 작업기간_년
  WRK_MNTH: '', //현 작업기간_개월째
  WRK_TM_HH: '', //1일근무시간_시간
  BRK_TM_MM: '', //1일휴게시간_분씩
  BRK_TM_CNT: '', //1일휴게시간_회 휴식
  WRK_DESC_BFR: '', //이전 작업내용
  WRK_YEARS_BFR: '', //이전 작업기간_년
  WRK_MNTH_BFR: '', //이전 작업기간_개월
  P1_Q1_C1: '', //여가및취미유부_컴퓨터관련
  P1_Q1_C2: '', //여가및취미유무_악기연주
  P1_Q1_C3: '', //여가및취미유무_뜨게질붓글씨
  P1_Q1_C4: '', //여가및취미유무_스포츠활동
  P1_Q1_C5: '', //여가및취미유무_해당사항없음
  P1_Q2_I630: '0', //1일가사노동시간
  P1_Q3_C1: '', //과거병력종류_류머티스 관절염
  P1_Q3_C2: '', //과거병력종류_당뇨병
  P1_Q3_C3: '', //과거병력종류_류프스병
  P1_Q3_C4: '', //과거병력종류_통풍
  P1_Q3_C5: '', //과거병력종류_알코올중독
  P1_Q3_C6: 'N', //과거병력유무(Y:유,N:무)
  P1_Q3_C7: '', //과거병력_완치
  P1_Q3_C8: '', //과거병력_치료나 관찰중
  P1_Q4_C1: 'N', //과거병력_사고_유무(Y:유무,N:무)
  P1_Q4_C2: '', //과거병력_사고_부위_손/손가락/손목
  P1_Q4_C3: '', //과거병력_사고_부위_팔/팔꿈치
  P1_Q4_C4: '', //과거병력_사고_부위_어깨
  P1_Q4_C5: '', //과거병력_사고_부위_목
  P1_Q4_C6: '', //과거병력_사고_부위_허리
  P1_Q4_C7: '', //과거병력_사고_부위_다리/발
  P1_Q5_I631: '', //육체적부담정도코드
})

const codeList = reactive({
  P1_Q2_I630: [], //1일가사노동시간코드 (HHII630)
  P1_Q5_I631: [], //육체부담정도코드(HHII631)
})

const initCodeList = () => {
  Promise.all([getCodeList('HHII630'), getCodeList('HHII631')]).then((res) => {
    codeList.P1_Q2_I630 = res[0].ORESULT_CUR
    codeList.P1_Q5_I631 = res[1].ORESULT_CUR
  })
}

const saveTab01 = () => {
  return hazardInvestigationFieldTab04_Tab01
}

onMounted(() => {
  initCodeList()
})

//증상목록표 인원팝업에서 선택한 인원데이터 세팅하는 함수
const setEmpData = (val) => {
  //수정시에 인원선택시 수정 플래그 설정
  for (let i in hazardInvestigationFieldTab04_Tab01) {
    if (
      hazardInvestigationFieldTab04_Tab01[i] === 'WORK_STANDARD_ID' ||
      hazardInvestigationFieldTab04_Tab01[i] === 'ES_SEQ' ||
      hazardInvestigationFieldTab04_Tab01[i] === 'ES_DATE'
    ) {
      continue
    } else {
      hazardInvestigationFieldTab04_Tab01[i] = ''
    }
  }
  hazardInvestigationFieldTab04_Tab01.CMPNY_DIV = val.CMPNY_DIV
  hazardInvestigationFieldTab04_Tab01.ASGN_NM = val.ASGN_NM
  hazardInvestigationFieldTab04_Tab01.ASGN_CD = val.ASGN_CD
  hazardInvestigationFieldTab04_Tab01.EMP_NM = val.EMP_NM
  hazardInvestigationFieldTab04_Tab01.EMP_NO = val.EMP_NO
  hazardInvestigationFieldTab04_Tab01.DUTY_CD = val.UNT_DUTY_CD
  hazardInvestigationFieldTab04_Tab01.DUTY_NM = val.UNT_DUTY_NM
  hazardInvestigationFieldTab04_Tab01.SOSOG_DIV = val.USER_DIV
  hazardInvestigationFieldTab04_Tab01.CMPNY_YEARS = val.CMPNY_YEARS
  hazardInvestigationFieldTab04_Tab01.CMPNY_MNTH = val.CMPNY_MNTH
  hazardInvestigationFieldTab04_Tab01.AGE = val.AGE
  hazardInvestigationFieldTab04_Tab01.SEX = val.SEX
  hazardInvestigationFieldTab04_Tab01.MRY_YN = val.MARR_YN
  hazardInvestigationFieldTab04_Tab01.WRK_TM_HH = 8
  hazardInvestigationFieldTab04_Tab01.BRK_TM_MM = 10
  hazardInvestigationFieldTab04_Tab01.BRK_TM_CNT = 2
  hazardInvestigationFieldTab04_Tab01.WRK_MNTH_BFR = 0
  hazardInvestigationFieldTab04_Tab01.WRK_MNTH = 0
  hazardInvestigationFieldTab04_Tab01.P1_Q2_I630 = '0'
}

const initEmpData = () => {
  for (let i in hazardInvestigationFieldTab04_Tab01) {
    if (
      hazardInvestigationFieldTab04_Tab01[i] === 'WORK_STANDARD_ID' ||
      hazardInvestigationFieldTab04_Tab01[i] === 'ES_SEQ' ||
      hazardInvestigationFieldTab04_Tab01[i] === 'ES_DATE'
    ) {
      continue
    } else {
      hazardInvestigationFieldTab04_Tab01[i] = ''
    }
  }
}

//증사조사표 인원 변경시 데이터 세팅
const setFieldTab01 = (data) => {
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      if (hazardInvestigationFieldTab04_Tab01.hasOwnProperty(key)) {
        //디폴트값 설정 해주기 위한 코드(value가 null이면 디폴트값이 없어지므로 들어온값이 null일때는 건너뛰도록)
        if (key === 'P1_Q2_I630' && !value) {
          continue
        }
        if (key === 'P1_Q3_C6' && !value) {
          continue
        }
        if (key === 'P1_Q4_C1' && !value) {
          continue
        }

        hazardInvestigationFieldTab04_Tab01[key] = value
      }
    }
  }

  previousValue = _.cloneDeep(data)
}

const getModifyFlag = () => {
  return _.isEqual(hazardInvestigationFieldTab04_Tab01, previousValue)
}

const onClick_P1_Q3_C6_N = (e) => {
  let yArray = []
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q3_C1)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q3_C2)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q3_C3)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q3_C4)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q3_C5)
  let yCount = yArray.filter((x) => x === 'Y').length
  if (yCount > 0) {
    hazardInvestigationFieldTab04_Tab01.P1_Q3_C6 = 'Y'
  }
}

const onClick_P1_Q3_C6_Y = (e) => {
  let yArray = []
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q3_C1)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q3_C2)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q3_C3)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q3_C4)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q3_C5)
  let yCount = yArray.filter((x) => x === 'Y').length
  //해당질병이 아무것도 체크되지 않았으면 예 클릭 되지 않도록
  if (yCount === 0) {
    hazardInvestigationFieldTab04_Tab01.P1_Q3_C6 = 'N'
    return false
  }
}

//과거병력 아니오 클릭 이벤트
const onClick_P1_Q4_C1_N = () => {
  let yArray = []
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C2)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C3)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C4)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C5)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C6)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C7)
  let yCount = yArray.filter((x) => x === 'Y').length
  //해당질병이 아무것도 체크되지 않았으면 예 클릭 되지 않도록
  if (yCount > 0) {
    hazardInvestigationFieldTab04_Tab01.P1_Q4_C1 = 'Y'
    return false
  }
}

//과거병력 예 클릭 이벤트
const onClick_P1_Q4_C1_Y = () => {
  let yArray = []
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C2)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C3)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C4)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C5)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C6)
  yArray.push(hazardInvestigationFieldTab04_Tab01.P1_Q4_C7)
  let yCount = yArray.filter((x) => x === 'Y').length
  //해당질병이 아무것도 체크되지 않았으면 예 클릭 되지 않도록
  if (yCount === 0) {
    hazardInvestigationFieldTab04_Tab01.P1_Q4_C1 = 'N'
    return false
  }
}

//완치 라디오버튼 클릭 이벤트
const onClick_P1_Q3_C7_Y1 = () => {
  //'예' 일때만 클릭되도록
  if (hazardInvestigationFieldTab04_Tab01.P1_Q3_C6 !== 'Y') {
    hazardInvestigationFieldTab04_Tab01.P1_Q3_C7 = ''
    return false
  }
}

const onClick_P1_Q3_C7_Y2 = () => {
  //'예' 일때만 클릭되도록
  if (hazardInvestigationFieldTab04_Tab01.P1_Q3_C6 !== 'Y') {
    hazardInvestigationFieldTab04_Tab01.P1_Q3_C7 = ''
    return false
  }
}

watch(
  //해당질병 체크시 라디오 버튼 예로 변경
  // 체크가 전부 해제되면 아니오로 변경
  [
    () => hazardInvestigationFieldTab04_Tab01.P1_Q3_C1,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q3_C2,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q3_C3,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q3_C4,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q3_C5,
  ],
  (newValues, oldValues) => {
    let yCount = newValues.filter((x) => x === 'Y').length
    if (yCount > 0) {
      hazardInvestigationFieldTab04_Tab01.P1_Q3_C6 = 'Y'
    } else {
      hazardInvestigationFieldTab04_Tab01.P1_Q3_C6 = 'N'
      hazardInvestigationFieldTab04_Tab01.P1_Q3_C7 = ''
    }
  }
)

watch(
  //과거 병력 체크 감지 체크하면 Y로변경
  // 체크가 전부 해제되면 아니오로 변경
  [
    () => hazardInvestigationFieldTab04_Tab01.P1_Q4_C2,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q4_C3,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q4_C4,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q4_C5,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q4_C6,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q4_C7,
  ],
  (newValues, oldValues) => {
    let yCount = newValues.filter((x) => x === 'Y').length
    if (yCount > 0) {
      hazardInvestigationFieldTab04_Tab01.P1_Q4_C1 = 'Y'
    } else {
      hazardInvestigationFieldTab04_Tab01.P1_Q4_C1 = 'N'
    }
  }
)

//해당사항 없음 체크시 나머지 체크 해제
watch(
  () => hazardInvestigationFieldTab04_Tab01.P1_Q1_C5,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      hazardInvestigationFieldTab04_Tab01.P1_Q1_C1 = 'N'
      hazardInvestigationFieldTab04_Tab01.P1_Q1_C2 = 'N'
      hazardInvestigationFieldTab04_Tab01.P1_Q1_C3 = 'N'
      hazardInvestigationFieldTab04_Tab01.P1_Q1_C4 = 'N'
    }
  }
)

watch(
  [
    () => hazardInvestigationFieldTab04_Tab01.P1_Q1_C1,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q1_C2,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q1_C3,
    () => hazardInvestigationFieldTab04_Tab01.P1_Q1_C4,
  ],
  (newValues, oldValues) => {
    let yCount = newValues.filter((x) => x === 'Y').length
    if (yCount > 0) {
      hazardInvestigationFieldTab04_Tab01.P1_Q1_C5 = 'N'
    }
  }
)

//현 직장경력 년 키입력 이벤트
const onKeyDown_CMPNY_YEARS = (e) => {
  const value = e.target.value

  // 특수문자 막기: 숫자키, 백스페이스, 방향키 제외 전부 막기
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab']

  // 숫자키(0~9)는 따로 허용
  if (!allowedKeys.includes(e.key) && (e.key < '0' || e.key > '9')) {
    e.preventDefault()
    return false
  }

  // 2자리 이상이면 숫자 입력 막기 (단, 백스페이스/방향키는 허용)
  if (value.length >= 2 && e.key >= '0' && e.key <= '9') {
    e.preventDefault()
    return false
  }
}

//현 직장경력 월 키입력 이벤트
const onKeyDown_CMPNY_MNTH = (e) => {
  const value = e.target.value

  // 특수문자 막기: 숫자키, 백스페이스, 방향키 제외 전부 막기
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab']

  // 숫자키(0~9)는 따로 허용
  if (!allowedKeys.includes(e.key) && (e.key < '0' || e.key > '9')) {
    e.preventDefault()
    return false
  }

  // 2자리 이상이면 숫자 입력 막기 (단, 백스페이스/방향키는 허용)
  if (value.length >= 2 && e.key >= '0' && e.key <= '9') {
    e.preventDefault()
    return false
  }
}

// //현직장경력 마우스 클릭 이벤트
const onInput_CMPNY_YEARS = (e) => {
  let value = Number(e.target.value)

  if (isNaN(value)) {
    hazardInvestigationFieldTab04_Tab01.CMPNY_YEARS = 0
    return false
  }

  if (value < 0) {
    value = 0
  }
  if (value > 99) {
    value = 99
  }

  hazardInvestigationFieldTab04_Tab01.CMPNY_YEARS = value
}

//현직장경력 월 마우스 클릭 이벤트
const onInput_CMPNY_MNTH = (e) => {
  let value = Number(e.target.value)

  if (isNaN(value)) {
    hazardInvestigationFieldTab04_Tab01.CMPNY_MNTH = 0
    return false
  }

  if (value < 0) {
    value = 0
  }

  if (value > 12) {
    value = 12
  }
  hazardInvestigationFieldTab04_Tab01.CMPNY_MNTH = value
}

//작업기간 년 키입력 이벤트
const onKeyDown_WRK_YEARS = (e) => {
  const value = e.target.value

  // 특수문자 막기: 숫자키, 백스페이스, 방향키 제외 전부 막기
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab']

  // 숫자키(0~9)는 따로 허용
  if (!allowedKeys.includes(e.key) && (e.key < '0' || e.key > '9')) {
    e.preventDefault()
    return false
  }

  // 2자리 이상이면 숫자 입력 막기 (단, 백스페이스/방향키는 허용)
  if (value.length >= 2 && e.key >= '0' && e.key <= '9') {
    e.preventDefault()
    return false
  }
}

//작업기간 년 마우스 클릭 이벤트
const onInput_WRK_YEARS = (e) => {
  let value = Number(e.target.value)

  if (isNaN(value)) {
    hazardInvestigationFieldTab04_Tab01.WRK_YEARS = 0
    return false
  }

  if (value < 0) {
    value = 0
  }
  if (value > 99) {
    value = 99
  }

  hazardInvestigationFieldTab04_Tab01.WRK_YEARS = value
}

//작업기간 월 키입력 이벤트
const onKeyDown_WRK_MNTH = (e) => {
  const value = e.target.value

  // 특수문자 막기: 숫자키, 백스페이스, 방향키 제외 전부 막기
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab']

  // 숫자키(0~9)는 따로 허용
  if (!allowedKeys.includes(e.key) && (e.key < '0' || e.key > '9')) {
    e.preventDefault()
    return false
  }

  // 2자리 이상이면 숫자 입력 막기 (단, 백스페이스/방향키는 허용)
  if (value.length >= 2 && e.key >= '0' && e.key <= '9') {
    e.preventDefault()
    return false
  }
}

//작업기간 년 마우스 클릭 이벤트
const onInput_WRK_MNTH = (e) => {
  let value = Number(e.target.value)

  if (isNaN(value)) {
    hazardInvestigationFieldTab04_Tab01.WRK_MNTH = 0
    return false
  }

  if (value < 0) {
    value = 0
  }
  if (value > 12) {
    value = 12
  }

  hazardInvestigationFieldTab04_Tab01.WRK_MNTH = value
}

//이전 작업 작업기간 키입력 이벤트
const onKeyDown_WRK_YEARS_BFR = (e) => {
  const value = e.target.value

  // 특수문자 막기: 숫자키, 백스페이스, 방향키 제외 전부 막기
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab']

  // 숫자키(0~9)는 따로 허용
  if (!allowedKeys.includes(e.key) && (e.key < '0' || e.key > '9')) {
    e.preventDefault()
    return false
  }

  // 2자리 이상이면 숫자 입력 막기 (단, 백스페이스/방향키는 허용)
  if (value.length >= 2 && e.key >= '0' && e.key <= '9') {
    e.preventDefault()
    return false
  }
}

//작업기간 년 마우스 클릭 이벤트
const onInput_WRK_YEARS_BFR = (e) => {
  let value = Number(e.target.value)

  if (isNaN(value)) {
    hazardInvestigationFieldTab04_Tab01.WRK_YEARS_BFR = 0
    return false
  }

  if (value < 0) {
    value = 0
  }
  if (value > 99) {
    value = 99
  }

  hazardInvestigationFieldTab04_Tab01.WRK_YEARS_BFR = value
}

//이전 작업 작업기간 월 키입력 이벤트
const onKeyDown_WRK_MNTH_BFR = (e) => {
  const value = e.target.value

  // 특수문자 막기: 숫자키, 백스페이스, 방향키 제외 전부 막기
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab']

  // 숫자키(0~9)는 따로 허용
  if (!allowedKeys.includes(e.key) && (e.key < '0' || e.key > '9')) {
    e.preventDefault()
    return false
  }

  // 2자리 이상이면 숫자 입력 막기 (단, 백스페이스/방향키는 허용)
  if (value.length >= 2 && e.key >= '0' && e.key <= '9') {
    e.preventDefault()
    return false
  }
}

//이전작업기간 월 마우스 클릭 이벤트
const onInput_WRK_MNTH_BFR = (e) => {
  let value = Number(e.target.value)

  if (isNaN(value)) {
    hazardInvestigationFieldTab04_Tab01.WRK_MNTH_BFR = 0
    return false
  }

  if (value < 0) {
    value = 0
  }

  if (value > 12) {
    value = 12
  }

  hazardInvestigationFieldTab04_Tab01.WRK_MNTH_BFR = value
}

defineExpose({
  saveTab01,
  setEmpData,
  setFieldTab01,
  getModifyFlag,
  initEmpData,
})
</script>

<template>
  <v-sheet class="searchArea">
    <div class="d-flex mt-2">
      <i-input
        :label="$t('부서')"
        width="250px"
        readonly
        v-model="hazardInvestigationFieldTab04_Tab01.ASGN_NM"
      ></i-input>
      <i-input
        :label="$t('성명')"
        width="150px"
        readonly
        v-model="hazardInvestigationFieldTab04_Tab01.EMP_NM"
      ></i-input>
      <i-input
        :label="$t('사번')"
        width="150px"
        readonly
        v-model="hazardInvestigationFieldTab04_Tab01.EMP_NO"
      ></i-input>
      <i-input
        :label="$t('직무')"
        width="250px"
        readonly
        v-model="hazardInvestigationFieldTab04_Tab01.DUTY_NM"
      ></i-input>
    </div>
    <div class="d-flex mt-2">
      <i-input
        :label="$t('현 직장경력')"
        width="150px"
        label-width="80px"
        type="Number"
        style="margin-right: 0px"
        @keydown="onKeyDown_CMPNY_YEARS"
        @input="onInput_CMPNY_YEARS"
        v-model="hazardInvestigationFieldTab04_Tab01.CMPNY_YEARS"
      ></i-input>
      <span class="ml-1 mt-2 mr-4">년</span>
      <i-input
        width="60px"
        style="margin-right: 0px"
        type="Number"
        @keydown="onKeyDown_CMPNY_MNTH"
        @input="onInput_CMPNY_MNTH"
        v-model="hazardInvestigationFieldTab04_Tab01.CMPNY_MNTH"
      ></i-input>
      <div class="mt-2 mr-4 ml-1">개월 째 근무 중</div>
      <i-input
        :label="$t('연령 만')"
        width="120px"
        number
        maxlength="2"
        v-model="hazardInvestigationFieldTab04_Tab01.AGE"
        style="margin-right: 0px"
      ></i-input>
      <div class="mt-2 mr-2 ml-1">세</div>
      <div class="mt-2 mr-2">성별</div>
      <div>
        <v-radio-group inline class="mt-1" v-model="hazardInvestigationFieldTab04_Tab01.SEX">
          <v-radio label="남" value="M"></v-radio>
          <v-radio label="여" value="F"></v-radio>
        </v-radio-group>
      </div>
      <div class="mt-2 mx-2">결혼 여부</div>
      <div class="mt-1">
        <v-radio-group inline v-model="hazardInvestigationFieldTab04_Tab01.MRY_YN">
          <v-radio label="기혼" value="Y"></v-radio>
          <v-radio label="미혼" value="N"></v-radio>
        </v-radio-group>
      </div>
    </div>
    <div class="gridTitle mt-5">현재 하고 있는 작업</div>
    <div class="d-flex mt-2">
      <i-input
        :label="$t('작업내용(구체적으로)')"
        width="500px"
        v-model="hazardInvestigationFieldTab04_Tab01.WRK_DESC"
      ></i-input>
      <i-input
        label-width="50px"
        :label="$t('작업기간')"
        width="120px"
        type="Number"
        style="margin-right: 0px"
        @keydown="onKeyDown_WRK_YEARS"
        @input="onInput_WRK_YEARS"
        v-model="hazardInvestigationFieldTab04_Tab01.WRK_YEARS"
      ></i-input>
      <span class="mt-2 mr-4 ml-1">년</span>
      <i-input
        width="70px"
        type="Number"
        @keydown="onKeyDown_WRK_MNTH"
        @input="onInput_WRK_MNTH"
        v-model="hazardInvestigationFieldTab04_Tab01.WRK_MNTH"
        style="margin-right: 0px"
      ></i-input>
      <span class="mt-2 ml-1">개월째 하고 있음</span>
    </div>
    <div class="d-flex mt-2">
      <i-input
        :label="$t('1일 근무시간')"
        width="150px"
        label-width="80px"
        number
        maxlength="2"
        v-model="hazardInvestigationFieldTab04_Tab01.WRK_TM_HH"
        style="margin-right: 0px"
      ></i-input>
      <div class="mt-2 mr-2 ml-1">시간</div>
      <i-input
        :label="$t('근무 중 휴식시간(식사시간 제외)')"
        width="280px"
        number
        maxlength="2"
        v-model="hazardInvestigationFieldTab04_Tab01.BRK_TM_MM"
        style="margin-right: 0px"
      ></i-input>
      <div class="mt-2 mr-2 ml-1">분씩</div>
      <i-input
        width="50px"
        number
        maxlength="2"
        v-model="hazardInvestigationFieldTab04_Tab01.BRK_TM_CNT"
        style="margin-right: 0px"
      ></i-input>
      <div class="mt-2 ml-1">회 휴식</div>
    </div>
    <div class="gridTitle mt-5">현 작업을 하기 전에 했던 작업</div>
    <div class="d-flex mt-2">
      <i-input
        :label="$t('작업내용(구체적으로)')"
        width="500px"
        v-model="hazardInvestigationFieldTab04_Tab01.WRK_DESC_BFR"
      ></i-input>
      <i-input
        label-width="50px"
        :label="$t('작업기간')"
        width="120px"
        type="Number"
        @keydown="onKeyDown_WRK_YEARS_BFR"
        @input="onInput_WRK_YEARS_BFR"
        v-model="hazardInvestigationFieldTab04_Tab01.WRK_YEARS_BFR"
        style="margin-right: 0px"
      ></i-input>
      <div class="mt-2 mr-2 ml-1">년</div>
      <i-input
        width="60px"
        type="Number"
        @keydown="onKeyDown_WRK_MNTH_BFR"
        @input="onInput_WRK_MNTH_BFR"
        v-model="hazardInvestigationFieldTab04_Tab01.WRK_MNTH_BFR"
        style="margin-right: 0px"
      ></i-input>
      <div class="mt-2 ml-1">개월 했었음</div>
    </div>
    <div class="gridTitle mt-5">
      1.규칙적인(한번에 30분 이상, 1주일에 적어도 2-3회 이상) 여가 및 취미활동을 하고 계시는 곳에 표시(v)하여 주십시오.
    </div>
    <div class="d-flex mt-3">
      <v-checkbox
        :label="$t('게임 등 컴퓨터 관련 활동')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q1_C1"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('피아노, 트럼펫 등 악기연주')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q1_C2"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('뜨개질, 붓글씨 등')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q1_C3"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('테니스, 축구, 농구, 골프 등 스포츠 활동')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q1_C4"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('해당사항 없음')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q1_C5"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
    </div>
    <div class="gridTitle mt-5">
      2.귀하의 하루 평균 가사노동시간(밥하기, 빨래하기, 청소하기, 2살 미만의 아이 돌보기 등)은 얼마나 됩니까?
    </div>
    <div class="d-flex mt-3">
      <v-radio-group inline v-model="hazardInvestigationFieldTab04_Tab01.P1_Q2_I630">
        <v-radio
          :label="$t(item.TXT)"
          v-for="(item, index) in codeList.P1_Q2_I630"
          :key="index"
          class="mr-2"
          :value="item.COD"
        ></v-radio>
      </v-radio-group>
    </div>
    <div class="gridTitle mt-5">
      3.귀하는 의사로부터 다음과 같은 질병에 대해 진단을 받은 적이 있습니까? (해당 질병에 체크)
    </div>
    <div class="d-flex mt-3">
      <v-checkbox
        :label="$t('류머티스 관절염')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q3_C1"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('당뇨병')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q3_C2"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('루프스병')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q3_C3"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('통풍')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q3_C4"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('알코올중독')"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q3_C5"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
    </div>
    <div class="d-flex mt-2">
      <div>
        <v-radio-group inline v-model="hazardInvestigationFieldTab04_Tab01.P1_Q3_C6">
          <v-radio label="아니오" value="N" @change="onClick_P1_Q3_C6_N"></v-radio>
          <v-radio label="예" value="Y" @change="onClick_P1_Q3_C6_Y"></v-radio>
        </v-radio-group>
      </div>
      <span class="ml-2 mt-1 mr-4">'예'인 경우 상해 부위는?</span>
      <v-radio-group inline v-model="hazardInvestigationFieldTab04_Tab01.P1_Q3_C7" class="mr-2">
        <v-radio label="완치" value="Y1" @change="onClick_P1_Q3_C7_Y1"></v-radio>
        <v-radio label="치료나 관찰 중" value="Y2" @change="onClick_P1_Q3_C7_Y2"></v-radio>
      </v-radio-group>
    </div>
    <div class="gridTitle mt-5">
      4.과거에 운동 중 혹은 사고(교통사고, 넘어짐, 추락 등)로 인해 손/손가락/손목,팔/팔꿈치,어깨,목,허리,다리/발 부위를
      다친 적이 있습니까?
    </div>
    <div class="d-flex mt-3">
      <div>
        <v-radio-group inline v-model="hazardInvestigationFieldTab04_Tab01.P1_Q4_C1">
          <v-radio label="아니오" value="N" @change="onClick_P1_Q4_C1_N"></v-radio>
          <v-radio label="예" value="Y" @change="onClick_P1_Q4_C1_Y"></v-radio>
        </v-radio-group>
      </div>
      <span class="ml-2 mt-1">'예'인 경우 상해 부위는?</span>
      <v-checkbox
        :label="$t('손/손가락.손목')"
        class="mx-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q4_C2"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('팔/팔꿈치')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q4_C3"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('어깨')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q4_C4"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('목')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q4_C5"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('허리')"
        class="mr-2"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q4_C6"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
      <v-checkbox
        :label="$t('다리/발')"
        v-model="hazardInvestigationFieldTab04_Tab01.P1_Q4_C7"
        true-value="Y"
        false-value="N"
      ></v-checkbox>
    </div>
    <div class="gridTitle mt-5">5.현재 하시는 일의 육체적 부담 정도는 어느 정도라고 생각 합니까?</div>
    <div class="d-flex mt-3">
      <v-radio-group inline v-model="hazardInvestigationFieldTab04_Tab01.P1_Q5_I631">
        <v-radio
          :label="$t(item.TXT)"
          v-for="(item, index) in codeList.P1_Q5_I631"
          :key="index"
          class="mr-2"
          :value="item.COD"
        ></v-radio>
      </v-radio-group>
    </div>
  </v-sheet>
</template>

<style lang="scss" scoped></style>
