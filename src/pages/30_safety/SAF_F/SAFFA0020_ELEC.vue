<!--
  화면명 : 부서별 SLI 세부현황(일렉용)
  화면개요 : 
-->
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
import ILabel from '@/components/ILabel.vue'
import dayjs from 'dayjs'
import { isEmpty } from "@/@core/utils"
import SAFFA0020_PopUp01 from "@/pages/30_safety/SAF_F/SAFFA0020_PopUp01.vue"
import SAFFA0020_PopUp04 from "@/pages/30_safety/SAF_F/SAFFA0020_PopUp04.vue"
import SAFFA0020_PopUp05 from "@/pages/30_safety/SAF_F/SAFFA0020_PopUp05.vue"
import SAFFA0020_PopUp06 from "@/pages/30_safety/SAF_F/SAFFA0020_PopUp06.vue"
import SAFFA0020_PopUp07 from "@/pages/30_safety/SAF_F/SAFFA0020_PopUp07.vue"
import SAFFA0020_PopUp08 from "@/pages/30_safety/SAF_F/SAFFA0020_PopUp08.vue"

defineOptions({
  name:'30_safety-SAF_F-SAFFA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const router = useRouter() 
const partList = ref([]) // 같은 부문데이터 리스트
const weakMonth = ref('')
const saffa0020_popup01 = ref(null)
const saffa0020_popup04 = ref(null)
const saffa0020_popup05 = ref(null)
const saffa0020_popup06 = ref(null)
const saffa0020_popup07 = ref(null)
const saffa0020_popup08 = ref(null)

const resultData = reactive({
  BSNS_CD_POINT: 0,
  PART_CD_POINT: 0,
  DEPT_CD_POINT: 0,
  BSNS_NM: '사업부',
  PART_NM: '부문',
  DEPT_NM: '부서',
  PART_RANK: 1,
  PERSNAL_WEIGHT: 0,
  WEAK_LIST: [],
})

const resultBottom = reactive({
  ACC: [],
  ACC_POINT: 0,
  ACC_MAX_POINT: 0,
  ACC_CALC: '',
  RUL: [],
  RUL_POINT: 0,
  RUL_MAX_POINT: 0,
  RUL_CALC: '',
  EDU: [],
  EDU_POINT: 0,
  EDU_MAX_POINT: 0,
  EDU_CALC: '',
  DNG: [],
  DNG_POINT: 0,
  DNG_MAX_POINT: 0,
  DNG_CALC: '',
  CHK: [],
  CHK_POINT: 0,
  CHK_MAX_POINT: 0,
  CHK_CALC: '',

  PPOINT_MAX_POINT: 4,    
  PPOINT_POINT:0,
  CPN_POINT: 0,
  ENV_POINT: 0,
  DSN_POINT: 0,
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  TMP_FROM_DT: dayjs().subtract(1, 'month').add(1,'day').format('YYYY-MM-DD'),
  TMP_TO_DT: dayjs().format('YYYY-MM-DD'),
  FROM_DT: '',
  TO_DT: '',
  BSNS_CD: '',
  DEPT_CD: '',
  PART_CD: '',
  VENDER_YN: 'Y',
  YYYYMMDD: '',
  DIV: '',
})

const codeList = reactive({
  BSNS_CD: [],
  PART_CD: [],
  DEPT_CD: [],
  ALL_PART_CD: [],
  ALL_DEPT_CD: [], 
})

//메뉴버튼
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

const beforeSearch = () => {
  if(searchParams.BSNS_CD == null || searchParams.BSNS_CD == '') {
    return Message.err(t('사업부는 필수 입력값입니다.'))
  }
  if(searchParams.PART_CD == null || searchParams.PART_CD == '') {
    return Message.err(t('부문는 필수 입력값입니다.'))
  }
  if(searchParams.DEPT_CD == null || searchParams.DEPT_CD == '') {
    return Message.err(t('부서는 필수 입력값입니다.'))
  }
  return true
}

//조회 함수
const searchData = () => {
  searchParams.FROM_DT = searchParams.TMP_FROM_DT.replaceAll('-','')
  searchParams.TO_DT = searchParams.TMP_TO_DT.replaceAll('-','')
  return commonSearchApi({ queryId : 'SAFFA0020_ELEC_SEARCH_03', param: searchParams })
}

//조회 후 반영
const afterSearch = res =>{
  console.log("afterSearch start")
  partList.value = []
  let sumBsnsPoint = 0
  let sumPartPoint = 0

  console.log('res ', res.ORESULT_CUR)
  
  for(var dt of res.ORESULT_CUR) {

    console.log("dt=" + dt)
    sumBsnsPoint += Number(dt.TOT_POINT)
    // 부문 점수
    if(searchParams.PART_CD == dt.PART_CD) {
      partList.value.push(dt.TOT_POINT)
      sumPartPoint += Number(dt.TOT_POINT)
    }
    // 조회결과는 팀코드이므로 팀코드랑 비교한다.
    if(searchParams.DEPT_CD == dt.TEAM_CD) {
      resultData.DEPT_CD_POINT = dt.TOT_POINT
      resultData.PERSNAL_WEIGHT = dt.PERSONAL_WEIGHT

      resultBottom.ACC_POINT = dt.ACC_POINT
      resultBottom.ACC_MAX_POINT = dt.ACC_MAX_POINT
      resultBottom.RUL_POINT = dt.RUL_POINT
      resultBottom.RUL_MAX_POINT = dt.RUL_MAX_POINT
      // 안전교육 포인트
      resultBottom.EDU_POINT = dt.EDU_POINT
      // 안전교육 최대 포인트
      resultBottom.EDU_MAX_POINT = dt.EDU_MAX_POINT
      // 안전개선활동 포인트
      resultBottom.DNG_POINT = dt.DNG_POINT
      // 안전개선활동 최대 포인트
      resultBottom.DNG_MAX_POINT = dt.DNG_MAX_POINT
      // 안전업무
      resultBottom.CHK_POINT = dt.CHK_POINT
      resultBottom.CHK_MAX_POINT = dt.CHK_MAX_POINT

      // 칭찬쿠폰 포인트      
      resultBottom.PPOINT_MAX_POINT = 4
      resultBottom.PPOINT_POINT = dt.PPOINT_POINT
      
      if(!isEmpty(dt.WEAK_NM)) {
        resultData.WEAK_LIST = dt.WEAK_NM.split('||')
      } else {
        resultData.WEAK_LIST = []
      }
    }    
  }

  // 사업부 점수
  console.log("sumBsnsPoint=" + sumBsnsPoint)
  console.log("res.ORESULT_CUR.length=" + res.ORESULT_CUR.length)
  resultData.BSNS_CD_POINT = Math.round(sumBsnsPoint / res.ORESULT_CUR.length)
  // 부문 점수
  resultData.PART_CD_POINT = Math.round(sumPartPoint / partList.value.length)

  // 부문 순위
  partList.value = partList.value.sort((a, b) => b - a)
  resultData.PART_RANK = partList.value.indexOf(resultData.DEPT_CD_POINT) + 1

  // 사업부명, 부문명, 부서명 표시
  resultData.BSNS_NM = matchNM(searchParams.BSNS_CD, codeList.BSNS_CD, 'BSNS_CD', 'BSNS_NM')
  //resultData.BSNS_NM = "TEST"
  resultData.PART_NM = matchNM(searchParams.PART_CD, codeList.PART_CD, 'PART_CD', 'PART_NM')
  resultData.DEPT_NM = matchNM(searchParams.DEPT_CD, codeList.DEPT_CD, 'ASGN_CD', 'ASGN_NM')

  // 각 항목별 표시
  resultBottom.ACC = res.ORESULT_ACC
  console.log("res.ORESULT_ACC=" + res.ORESULT_ACC)
  resultBottom.RUL = res.ORESULT_RUL
  console.log("res.ORESULT_RUL=" + res.ORESULT_RUL)
  resultBottom.EDU = res.ORESULT_EDU
  resultBottom.DNG = res.ORESULT_DNG
  resultBottom.CHK = res.ORESULT_CHK

  

  // 칭찬쿠폰
  if (res.ORESULT_CPN.length > 0) {
    resultBottom.CPN_POINT = res.ORESULT_CPN[0].PPOINT
  }

  // 환경정화
  if (res.ORESULT_ENV.length > 0) {
    resultBottom.ENV_POINT = res.ORESULT_ENV[0].PPOINT
  }

  // 안전설계
  if (res.ORESULT_DSN.length > 0) {
    resultBottom.DSN_POINT = res.ORESULT_DSN[0].PPOINT
  }

  // SLI 대시보드 계산식 조회
  Promise.all([
    commonSearchApi({ queryId: "SAFFA0020_SEARCH_04",param: searchParams}),
  ]).then((res) => { 
    // 안전사고 계산식 
    for(var accCal of res[0].ORESULT_ACC_CAL) {
      for(var i = 0; i < resultBottom.ACC.length; i++) {
        if(resultBottom.ACC[i].ACC_TYPE == accCal.ACC_TYPE) {
          
          if('CALC_COL' in resultBottom.ACC[i]) {
            resultBottom.ACC[i].CALC_COL.push(accCal.CALC_COL)
            resultBottom.ACC[i].SUM_POINT = oneRound(Number(resultBottom.ACC[i].SUM_POINT) + Number(accCal.ACC_MPOINT))
            // resultBottom.ACC[i].SUM_POINT = oneRound(Number(accCal.ACC_MPOINT))
          } else {
            resultBottom.ACC[i].CALC_COL = [accCal.CALC_COL]
            resultBottom.ACC[i].SUM_POINT = oneRound(accCal.ACC_MPOINT)
            resultBottom.ACC[i].EXPAND = false
            resultBottom.ACC[i].EXPAND_POINT = false
            resultBottom.ACC[i].ADDITION = '-1'
          }          
          break
        }
      }
    }
    
    // 안전수칙 계산식
    for(var rulCal of res[0].ORESULT_RUL_CAL) {
      for(var i = 0; i < resultBottom.RUL.length; i++) {
        if(resultBottom.RUL[i].RUL_TYPE == rulCal.RUL_TYPE) {
          if('CALC_COL' in resultBottom.RUL[i]) {
            resultBottom.RUL[i].CALC_COL.push(rulCal.CALC_COL)
            resultBottom.RUL[i].SUM_POINT = oneRound(Number(resultBottom.RUL[i].SUM_POINT) + Number(rulCal.RUL_MPOINT))
          } else {
            resultBottom.RUL[i].CALC_COL = [rulCal.CALC_COL]
            resultBottom.RUL[i].SUM_POINT = oneRound(rulCal.RUL_MPOINT)
            resultBottom.RUL[i].EXPAND = false
            resultBottom.RUL[i].EXPAND_POINT = false
            resultBottom.RUL[i].ADDITION = '-1'
          }          
          break
        }
      }
    }

    let eduACalc = {
      a1Point: 0,
      a2Point: 0,
      a1Title: '',
      a2Title: '',
    }
    console.log('res[0].ORESULT_EDU_CAL ', res[0].ORESULT_EDU_CAL)
    // 안전교육 계산식
    for(var eduCal of res[0].ORESULT_EDU_CAL) {
      for(var i = 0; i < resultBottom.EDU.length; i++) {
        if(resultBottom.EDU[i].EDU_TYPE == eduCal.EDU_TYPE) {
          if('CALC_COL' in resultBottom.EDU[i]) {
            resultBottom.EDU[i].CALC_COL.push(eduCal.CALC_COL)
            // 관리감독자 안전보건교육, 단기공사 안전교육
            if(eduCal.EDU_TYPE === 'B' || eduCal.EDU_TYPE === 'C') {
              resultBottom.EDU[i].SUM_POINT = oneRound(Number(resultBottom.EDU[i].SUM_POINT) + Number(eduCal.EDU_MPOINT))
              if(Number(resultBottom.EDU[i].SUM_POINT) < -10) {
                resultBottom.EDU[i].SUM_POINT = -10
              } 
            }
          } else {
            resultBottom.EDU[i].CALC_COL = [eduCal.CALC_COL] 
            resultBottom.EDU[i].EXPAND = false
            resultBottom.EDU[i].EXPAND_POINT = false
            resultBottom.EDU[i].ADDITION = '-1'
            resultBottom.EDU[i].EDU_COUNT = eduCal.EDU_COUNT
            if(eduCal.EDU_TYPE == 'A-1' || eduCal.EDU_TYPE == 'A-2') {
              resultBottom.EDU[i].ADDITION = ''
            } else if (eduCal.EDU_TYPE == 'D' || eduCal.EDU_TYPE == 'E' || eduCal.EDU_TYPE == 'B-1') {
              resultBottom.EDU[i].ADDITION = '1'
            }
            // 관리감독자 안전보건교육, 단기공사 안전교육
            if(eduCal.EDU_TYPE === 'B' || eduCal.EDU_TYPE === 'C') {
              resultBottom.EDU[i].SUM_POINT = oneRound(eduCal.EDU_MPOINT)
              if(Number(resultBottom.EDU[i].SUM_POINT) < -10) {
                resultBottom.EDU[i].SUM_POINT = -10
              }
            } else {
              resultBottom.EDU[i].SUM_POINT = oneRound(eduCal.RESULT_POINT)
            }
          }  

          if(eduCal.EDU_TYPE == 'A-1') {
            eduACalc.a1Point = resultBottom.EDU[i].SUM_POINT
            eduACalc.a1Title = eduCal.COL_TYPE.split('(')[1].replaceAll(')','')
          } else if(eduCal.EDU_TYPE == 'A-2') {
            eduACalc.a2Point = resultBottom.EDU[i].SUM_POINT
            eduACalc.a2Title = eduCal.COL_TYPE.split('(')[1].replaceAll(')','')
          }
          break
        }
      }
    }
    // 교육 A타입 계산식 교체
    for(var i = 0; i < resultBottom.EDU.length; i++) {
      if(resultBottom.EDU[i].EDU_TYPE === 'A') {
        let resultPoint = eduACalc.a1Point + eduACalc.a2Point < -10 ? -10 : eduACalc.a1Point + eduACalc.a2Point
        resultBottom.EDU[i].CALC_COL = 
          [eduACalc.a1Point + '(' + eduACalc.a1Title + ') + ' + eduACalc.a2Point + '(' + eduACalc.a2Title + ') = ' 
          + resultPoint + '(최대감점 -10점)']
        break
      }
    }

    // 위험성평가 계산식
    for(var dngCal of res[0].ORESULT_DNG_CAL) {
      for(var i = 0; i < resultBottom.DNG.length; i++) {
        if(resultBottom.DNG[i].DNG_TYPE == dngCal.DNG_TYPE) {
          if('CALC_COL' in resultBottom.DNG[i]) {
            resultBottom.DNG[i].CALC_COL.push(dngCal.CALC_COL)
            // resultBottom.DNG[i].SUM_POINT = oneRound(Number(resultBottom.DNG[i].SUM_POINT) + Number(dngCal.DNG_MPOINT))
          } else {
            resultBottom.DNG[i].CALC_COL = [dngCal.CALC_COL]
            resultBottom.DNG[i].SUM_POINT = oneRound(dngCal.RESULT_POINT)
            resultBottom.DNG[i].EXPAND = false
            resultBottom.DNG[i].EXPAND_POINT = false
          }          
          break
        }
      }
    }

    let weakPoint = 0
    // 안전업무 계산식
    for(var chkCal of res[0].ORESULT_CHK_CAL) {
      for(var i = 0; i < resultBottom.CHK.length; i++) {
        if(resultBottom.CHK[i].CHK_TYPE == chkCal.CHK_TYPE) {
          if('CALC_COL' in resultBottom.CHK[i]) {
            resultBottom.CHK[i].CALC_COL.push(chkCal.CALC_COL)
            // resultBottom.CHK[i].SUM_POINT = oneRound(Number(resultBottom.CHK[i].SUM_POINT) + Number(chkCal.CHK_MPOINT))
          } else {
            resultBottom.CHK[i].CALC_COL = [chkCal.CALC_COL]
            resultBottom.CHK[i].SUM_POINT = oneRound(chkCal.RESULT_POINT)
            resultBottom.CHK[i].EXPAND = false
            resultBottom.CHK[i].EXPAND_POINT = false
            
          }        
          break
        }
      }
      // 취약항목 점수 저장
      if(chkCal.CHK_TYPE == 'C') {
        weakPoint = Number(chkCal.CHK_MPOINT)
      }
    }

    for(var i = 0; i < resultBottom.CHK.length; i++) {
      if(resultBottom.CHK[i].CHK_TYPE == 'A') {
        for(var j = 0; j < resultBottom.CHK[i].CALC_COL.length; j++) {
          resultBottom.CHK[i].CALC_COL[j] = resultBottom.CHK[i].CALC_COL[j] + ' + ' + weakPoint + '(취약항목 점수)'
        }
      }
    }
    setResultPointCalc()
  })
} 

const setResultPointCalc = () => {
  resultBottom.ACC_CALC = '20(기본점수)'
  resultBottom.RUL_CALC = '20(기본점수)'
  resultBottom.EDU_CALC = '20(기본점수)'
  resultBottom.DNG_CALC = '20(기본점수)'
  resultBottom.CHK_CALC = '20(기본점수)'
    
  for(var i = 0; i < resultBottom.ACC.length; i++) {
    if(resultBottom.ACC[i].ACC_TYPE != 'F') resultBottom.ACC_CALC += ' + ' + nullZero(resultBottom.ACC[i].SUM_POINT)
    resultBottom.ACC[i].ADDITION = '-1'
  }
  resultBottom.ACC_CALC += ' = ' + resultBottom.ACC_POINT + '(최대점수 20점)'
  for(var i = 0; i < resultBottom.RUL.length; i++) {
    resultBottom.RUL_CALC += ' + ' + nullZero(resultBottom.RUL[i].SUM_POINT)
    resultBottom.RUL[i].ADDITION = '-1'
  }
  resultBottom.RUL_CALC += ' = ' + resultBottom.RUL_POINT + '(최대점수 20점)'
  for(var i = 0; i < resultBottom.EDU.length; i++) {
    if(resultBottom.EDU[i].EDU_TYPE.indexOf('-') >= 0) continue
    resultBottom.EDU_CALC += ' + ' + nullZero(resultBottom.EDU[i].SUM_POINT)
    resultBottom.EDU[i].ADDITION = '-1'
    if(resultBottom.EDU[i].EDU_TYPE.indexOf('-') >= 0) {
      resultBottom.EDU[i].ADDITION = ''
    } else if (resultBottom.EDU[i].EDU_TYPE == 'D' || resultBottom.EDU[i].EDU_TYPE == 'E') {
      resultBottom.EDU[i].ADDITION = '1'
    }
  }
  resultBottom.EDU_CALC += ' = ' + resultBottom.EDU_POINT + '(최대점수 20점)'
  resultBottom.DNG_POINT = 20 // 위험성평가에 비일상점검이 빠져서...
  for(var i = 0; i < resultBottom.DNG.length; i++) {
    resultBottom.DNG_CALC += ' + ' + nullZero(resultBottom.DNG[i].SUM_POINT)
    resultBottom.DNG_POINT = Number(resultBottom.DNG_POINT) + Number(nullZero(resultBottom.DNG[i].SUM_POINT))
    resultBottom.DNG[i].ADDITION = '-1'
    if (resultBottom.DNG[i].DNG_TYPE == 'B' || resultBottom.DNG[i].DNG_TYPE == 'C') {
      resultBottom.DNG[i].ADDITION = '1'
    }
  }
  resultBottom.DNG_POINT = Number(resultBottom.DNG_POINT.toFixed(1));
  resultBottom.DNG_CALC += ' = ' + resultBottom.DNG_POINT + '(최대점수 20점)'
  for(var i = 0; i < resultBottom.CHK.length; i++) {
    if(resultBottom.CHK[i].CHK_TYPE == 'C') continue
    resultBottom.CHK_CALC += ' + ' + nullZero(resultBottom.CHK[i].SUM_POINT)
    resultBottom.CHK[i].ADDITION = '1'
    if (resultBottom.CHK[i].CHK_TYPE == 'D') {
      resultBottom.CHK[i].ADDITION = '0'
    } else if (resultBottom.CHK[i].CHK_TYPE == 'E') {
      resultBottom.CHK[i].ADDITION = '-1'
    }
  }
  resultBottom.CHK_CALC += ' = ' + resultBottom.CHK_POINT + '(최대점수 20점)'

  console.log(resultBottom)
}

const matchNM = (cd, list, code, name) => {
  for(var codeData of list) {
    if(codeData[code] === cd) {
      return codeData[name]
    }
  }
  return ''
}

const setChipContent = (score) => {
  if(90 <= score) return '양호'
  else if(80 <= score) return '주의'
  else if(70 <= score) return '경고'
  else return '위험'
}

const setChipColor = (score) => {
  if(90 <= score) return 'info'
  else if(80 <= score) return 'success'
  else if(70 <= score) return 'warning'
  else return 'error'
}

// 하단 v-chip 색 결정
const setBottomChipColor = (score) => {
  if(14 > score) return 'error'
  else if(16 > score) return 'warning'
  else if(18 > score) return 'success'
  else return 'info'
}

// 사업부 콤보박스 변경 시 
const updateBsns = () =>{
  searchParams.PART_CD = ''
  searchParams.DEPT_CD = ''
  if(searchParams.BSNS_CD === '') {
    codeList.PART_CD = [{PART_NM:'전체',PART_CD:''}]
    codeList.DEPT_CD = [{DEPT_NM:'전체',DEPT_CD:''}]
    return
  }
  codeList.PART_CD = []
  for(var cd of codeList.ALL_PART_CD) {
    if(searchParams.BSNS_CD === cd.BSNS_CD) {
      codeList.PART_CD.push(cd)
    }
  }
  codeList.PART_CD.unshift({PART_NM:'전체',PART_CD:''}) 
}

// 부문 콤보박스 변경 시
const updatePart = () => {
  searchParams.DEPT_CD = ''
  codeList.DEPT_CD = []
  for(var cd of codeList.ALL_DEPT_CD) {
    if(searchParams.PART_CD === cd.PART_CD) {
      codeList.DEPT_CD.push(cd)
    }
  }
  codeList.DEPT_CD.unshift({DEPT_NM:'전체',DEPT_CD:''}) 
}

const toggleAcc = (i) => {  
  if(resultBottom.ACC[i].EXPAND == null) return
  resultBottom.ACC[i].EXPAND = !resultBottom.ACC[i].EXPAND
}

const toggleRul = (i) => {
  if(resultBottom.RUL[i].EXPAND == null) return
  resultBottom.RUL[i].EXPAND = !resultBottom.RUL[i].EXPAND
}

const toggleEdu = (i) => {
  if(resultBottom.EDU[i].EXPAND == null) return
  resultBottom.EDU[i].EXPAND = !resultBottom.EDU[i].EXPAND
}

const toggleDng = (i) => {
  if(resultBottom.DNG[i].EXPAND == null) return
  resultBottom.DNG[i].EXPAND = !resultBottom.DNG[i].EXPAND
}
const toggleChk = (i) => {
  if(resultBottom.CHK[i].EXPAND == null) return
  resultBottom.CHK[i].EXPAND = !resultBottom.CHK[i].EXPAND
}
 
const movePageAcc = (acc) => {
  let paraMap = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    DEPT_NM: resultData.DEPT_NM,
    YYYYMMDD: searchParams.TMP_TO_DT.replaceAll('-',''),
    FROM_DT: searchParams.TMP_FROM_DT,
    TO_DT: searchParams.TMP_TO_DT,
    SLICHECK: 'Y'
  }
  Promise.all([
    commonSearchApi({ queryId: "SAFFA0020_SEARCH_17",param: paraMap}),
    ])
    .then((res) => { 
      paraMap.FROM_DT = res[0].ORESULT_CUR[0].FROM_DT
      paraMap.TO_DT = res[0].ORESULT_CUR[0].TO_DT
      router.push({path: '/30_safety/SAF_A/SAFAB0020', state: { sliSAFAB0020: paraMap } })
  })
}

const movePageRul = (rul) => {
  let paraMap = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    GUBUN: '',
    FROM_DT: searchParams.TMP_FROM_DT,
    TO_DT: searchParams.TMP_TO_DT,
  }
  if (rul.RUL_TYPE == 'A' || rul.RUL_TYPE == 'B' || rul.RUL_TYPE == 'E') {
    if (rul.RUL_TYPE == 'A') paraMap.GUBUN = 'A'
    else if (rul.RUL_TYPE == 'B') paraMap.GUBUN = ''
    else if (rul.RUL_TYPE == 'E') paraMap.GUBUN = 'B'
    router.push({path: '/30_safety/SAF_D/SAFDC0010', state: { sliSAFDC0010: { GUBUN: 'A' }, sliSAFDC0010_01: paraMap } })
  } else if (rul.RUL_TYPE == 'D') {
    router.push({path: '/30_safety/SAF_D/SAFDC0010', state: { sliSAFDC0010: { GUBUN: 'B' }, sliSAFDC0010_02Tab01: paraMap } })
  } else if (rul.RUL_TYPE == 'C') {
    router.push({path: '/30_safety/SAF_D/SAFDC0010', state: { sliSAFDC0010: { GUBUN: 'C' }, sliSAFDC0010_03: paraMap } })
  }
} 

const movePageEdu = (edu) => {
  if(edu.EDU_TYPE == 'A-1') {
    let dateObj = new Date(searchParams.TMP_TO_DT) 
    dateObj.setDate(1)
    dateObj.setDate(dateObj.getDate() - 1)
    searchParams.YYYYMMDD = dateObj.toISOString().slice(0, 10) 
    searchParams.DIV = 'R'
    saffa0020_popup01.value.openPopup(searchParams, resultData.DEPT_NM)
  } else if(edu.EDU_TYPE == 'A-2') {
    searchParams.YYYYMMDD = searchParams.TMP_TO_DT
    searchParams.DIV = 'P'
    saffa0020_popup01.value.openPopup(searchParams, resultData.DEPT_NM)
  } else if (edu.EDU_TYPE == 'B') {
    //관리감독자 안전보건교육
    console.log('saffa0020 popup param ',searchParams)
    // resultData.BSNS_NM
    saffa0020_popup06.value.openPopup(searchParams,resultData.DEPT_NM)
  } else if(edu.EDU_TYPE == 'B-1') {
    //관리감독자 추가교육
    saffa0020_popup07.value.openPopup(searchParams,resultData.DEPT_NM)
  } else if(edu.EDU_TYPE == 'C') {
    //단기공사 안전교육
    saffa0020_popup08.value.openPopup(searchParams,resultData.DEPT_NM)
  } else if(edu.EDU_TYPE == 'A') {
    return
  } else {
    let paraMap = {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD,
      DIVISION: 'A',
      FROM_DT: searchParams.TMP_FROM_DT,
      TO_DT: searchParams.TMP_TO_DT,
    }
    router.push({path: '/60_edu/EDU_A/EDUAA0010', state: { sliEDUAA0010: paraMap }})
  }
}

const movePageDng = (dng) => {
  
  let paraMap = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    DEPT_NM: resultData.DEPT_NM,
    SLICHECK: '',
    FROM_DT: searchParams.TMP_FROM_DT,
    TO_DT: searchParams.TMP_TO_DT,
    YEAR: searchParams.TMP_TO_DT.substring(0,4),
    HALF: searchParams.TMP_TO_DT.substring(5,7) < 7 ? '1' : '2',
  } 

  if(dng.DNG_TYPE == 'A') {
    let dateObj = new Date(searchParams.TMP_TO_DT) 
    dateObj.setDate(dateObj.getDate() - 15) // -15일
    paraMap.TO_DT = dateObj.toISOString().slice(0, 10) 
    dateObj.setDate(dateObj.getDate() - 30) // -15 -30 = -45일
    paraMap.FROM_DT = dateObj.toISOString().slice(0, 10) 
    router.push({ path: '/30_safety/SAF_A/SAFAB0020', state: { sliSAFAB0020: paraMap }})
  } else if (dng.DNG_TYPE == 'B') {
    router.push({ path: '/20_risk-assessment/RSK_C/RSKCA0010', state: { sliRSKCA0010: paraMap }})
  } else if(dng.DNG_TYPE == 'C') {
    saffa0020_popup04.value.openPopup(searchParams)
  } else if (dng.DNG_TYPE == 'D') { 
    saffa0020_popup05.value.openPopup(searchParams)
  }
}

const movePageChk = (chk) => {
  let paraMap = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    DEPT_NM: resultData.DEPT_NM,
    YYYYMMDD: searchParams.TMP_TO_DT.replaceAll('-',''),
    FROM_DT: searchParams.TMP_FROM_DT,
    TO_DT: searchParams.TMP_TO_DT,
    SAFE_YN: 'N'
  } 
  Promise.all([
  commonSearchApi({ queryId: "SAFFA0020_SEARCH_16",param: paraMap}),
  ])
  .then((res) => { 
    paraMap.FROM_DT = res[0].ORESULT_CUR[0].FROM_DT
    paraMap.TO_DT = res[0].ORESULT_CUR[0].TO_DT
    if(chk.CHK_TYPE == 'A') {
      paraMap.FROM_DT = paraMap.TO_DT
      router.push({ path: '/30_safety/SAF_C/SAFCD0010', state: { sliSAFCD0010: { tab: 'DAILY' }, sliSAFCD0010Tab01: paraMap }})
    } else if(chk.CHK_TYPE == 'B') {
      router.push({ path: '/30_safety/SAF_C/SAFCD0010', state: { sliSAFCD0010: { tab: 'DAILY' }, sliSAFCD0010Tab01: paraMap }})
    } else if(chk.CHK_TYPE == 'D') { 
      paraMap.FROM_DT = paraMap.TO_DT
      paraMap.SAFE_YN = 'Y'
      router.push({ path: '/30_safety/SAF_C/SAFCD0010', state: { sliSAFCD0010: { tab: 'DAILY' }, sliSAFCD0010Tab01: paraMap }})
    } else if(chk.CHK_TYPE == 'E') {
      paraMap.FROM_DT = paraMap.TO_DT
      router.push({ path: '/30_safety/SAF_C/SAFCD0010', state: { sliSAFCD0010: { tab: 'PTW' }, sliSAFCD0010Tab03: paraMap }})
    } else if(chk.CHK_TYPE == 'F') { 
      paraMap.FROM_DT = paraMap.TO_DT
      router.push({ path: '/30_safety/SAF_C/SAFCD0010', state: { sliSAFCD0010: { tab: 'DEPT' }, sliSAFCD0010Tab04: paraMap }})
    }
  })  
}

const nullZero = (value) => {
  if(value == null || value == '') return '0'
  return value
}

const oneRound = (value) => {
  return Math.round(value*10) / 10
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

const subEduContent = (edu) => {
  if(edu.EDU_TYPE == 'A-1' || edu.EDU_TYPE == 'A-2') {
    return 'sub-edu'
  }
  return ''
}

// 다른화면에서 매개변수를 받았을 때
const getState = () => {
  // 다른화면 갔다가 다시 돌아온거면 refresh 하지 않음
  if(isEmpty(window.history.state.setDept)) return 
  // 다른화면(전사sli대시보드) 화면에서 파라미터를 받았을 경우
  if(!window.history.state.myDetail && window.history.state.data){ 
    let data = window.history.state.data
    
    searchParams.BSNS_CD = data.BSNS_CD
    searchParams.PART_CD = data.PART_CD
    searchParams.DEPT_CD = data.DEPT_CD      
    searchParams.TMP_TO_DT = data.TMP_TO_DT
    getFrom(data.TMP_TO_DT)
  } else {
    if(codeList.ALL_DEPT_CD.indexOf(userStore.deptCd) >= 0) {
      searchParams.BSNS_CD = userStore.bsnsCd
      searchParams.PART_CD = codeList.ALL_DEPT_CD[codeList.ALL_DEPT_CD.indexOf(userStore.deptCd)].PART_CD
      searchParams.DEPT_CD = userStore.deptCd
    } else {
      searchParams.BSNS_CD = ''
      searchParams.PART_CD = ''
      searchParams.DEPT_CD = ''
      return Message.warn(t(userStore.deptNm + '부서는 데이터가 존재하지 않습니다.'))
    }
  }
}

// 범례 색
const setLegendColor = (addition) => {
  if(addition == '1') {
    return 'legend-addition-add'
  } else if(addition == '0') {
    return 'legend-addition-both'
  } else if(addition == '-1') {
    return 'legend-addition-sub '
  }
  return ''
}

watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  codeList.PART_CD = []
  for(var cd of codeList.ALL_PART_CD) {
    if(newValue === cd.BSNS_CD) {
      codeList.PART_CD.push(cd)
    }
  }
  codeList.PART_CD.unshift({PART_NM:'전체',PART_CD:''}) 
})

watch(() => searchParams.PART_CD, (newValue, oldValue) => {
  codeList.DEPT_CD = []
  for(var cd of codeList.ALL_DEPT_CD) {
    if(newValue === cd.PART_CD) {
      codeList.DEPT_CD.push(cd)
    }
  }
  codeList.DEPT_CD.unshift({DEPT_NM:'전체',DEPT_CD:''}) 
})
 
// 부서 변경 시 자동 조회
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  if(newValue === '' || newValue == null) return
  onButtonsClick({ id: 'btnSearch' })
})

// 부서 변경 시 자동 조회
watch(() => searchParams.TMP_TO_DT, (newValue, oldValue) => {
  getFrom(newValue)
})

onMounted(() => {
  initCodeList()
})

const initCodeList = () => {
  Promise.all([    
    // 사업부 
    commonSearchApi({queryId : 'SAFFB0010_ELEC_search02', param : searchParams }),
    // 부문
    commonSearchApi({queryId : 'SAFFB0010_ELEC_search03', param : searchParams }),
    // 부서
    commonSearchApi({queryId : 'SAFFB0010_ELEC_search04', param : searchParams }),
  ]).then(res => {
    codeList.BSNS_CD = res[0].ORESULT_CUR

    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.ALL_PART_CD.unshift({ PART_NM: '전체', PART_CD: '' })
    codeList.ALL_DEPT_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })

    // 일렉을 디폴트로 선택
    searchParams.BSNS_CD = "AW00"
    // 부문 데이터 로드
    bsnsChange()
  
  })
}

const bsnsChange = e => {
  searchParams.PART_CD = ''
  searchParams.DEPT_CD = ''
  codeList.DEPT_List = [{ ASGN_NM: '전체', ASGN_CD: '' }]
  Promise.all([
    commonSearchApi({queryId : 'SAFFB0010_ELEC_search03', param : searchParams }),
  ]).then(res => {
    codeList.PART_CD = res[0].ORESULT_CUR
    codeList.PART_CD.unshift({ PART_NM: '전체', PART_CD: '' })
  })
}

/**
 * 부문 변경시 팀목록을 불러온다.
 */
const partChange = e => {
  searchParams.DEPT_CD = ''
  Promise.all([
    commonSearchApi({queryId : 'SAFFB0010_ELEC_search04', param : searchParams }),
  ]).then(res => {
    codeList.DEPT_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
  })
}


// onMounted(() => {
//   var yesterday = dayjs().subtract(1,'day')
//   searchParams.TMP_TO_DT = yesterday.format('YYYY-MM-DD')
//   searchParams.TMP_FROM_DT = yesterday.subtract(1,'month').add(1,'day').format('YYYY-MM-DD')
//   Promise.all([
//     commonSearchApi({ queryId: "SAFFA0020_SEARCH_01",param: {}}),
//     commonSearchApi({ queryId: "SAFFA0020_SEARCH_02",param: {}}),
//   ])
//   .then((res) => { 
//     codeList.BSNS_CD = [
//       {BSNS_NM:'전체',BSNS_CD:''},
//       {BSNS_NM:'조선사업부',BSNS_CD:'AC00'},
//       {BSNS_NM:'해양에너지사업부',BSNS_CD:'AQ00'},
//       {BSNS_NM:'엔진기계사업부',BSNS_CD:'AK00'},
//       {BSNS_NM:'특수선사업부',BSNS_CD:'AE00'},
//     ]
    
//     codeList.ALL_PART_CD = res[0].ORESULT_CUR
//     codeList.PART_CD.unshift({PART_NM:'전체',PART_CD:''}) 
//     codeList.ALL_DEPT_CD = res[1].ORESULT_CUR
//     codeList.DEPT_CD.unshift({DEPT_NM:'전체',DEPT_CD:''}) 

//     // onMount시 아예 새로 들어온 경우
//     if(isEmpty(window.history.state.setDept)) {
//       if(codeList.ALL_DEPT_CD.indexOf(userStore.deptCd) >= 0) {
//         searchParams.BSNS_CD = userStore.bsnsCd
//         searchParams.PART_CD = codeList.ALL_DEPT_CD[codeList.ALL_DEPT_CD.indexOf(userStore.deptCd)].PART_CD
//         searchParams.DEPT_CD = userStore.deptCd
//       } else {
//         searchParams.BSNS_CD = ''
//         searchParams.PART_CD = ''
//         searchParams.DEPT_CD = ''
//         return Message.warn(t(userStore.deptNm + '부서는 데이터가 존재하지 않습니다.'))
//       }
//     } else {
//       // onMount 시 전사 sli대시보드에서 파라미터를 받아온 경우
//       getState()
//     }
//   })
//   .catch((err) => {
    
//   })

//   // 취약 월 계산(to_date의 이전달)
//   let date = new Date(searchParams.TMP_TO_DT)
//   date.setMonth(date.getMonth() - 1)
//   weakMonth.value = date.getMonth() + 1
// })

router.beforeEach((to,from) => {
  getState()
})
</script>

<template>
  <v-card class="pa-3">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.TMP_FROM_DT"
            :label="$t('조회기간')"
            :disabled="true"
            type="date"
            width="250px"
          />
          <i-input
            v-model="searchParams.TMP_TO_DT"
            :label="$t('~')"
            type="date"
            width="250px"
          />
          <i-select
            v-model="searchParams.BSNS_CD"
            :label="$t('사업부')"
            label-width="60px"
            append-inner-icon="mdi-magnify"
            :items="codeList.BSNS_CD"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            width="250px"
            @update:modelValue="updateBsns()"
            required
          />
          <i-select
            v-model="searchParams.PART_CD"
            :label="$t('부문')"
            label-width="60px"
            append-inner-icon="mdi-magnify"
            :disabled="searchParams.BSNS_CD === ''"
            :items="codeList.PART_CD"
            item-title="PART_NM"
            item-value="PART_CD"
            width="250px"
            @update:modelValue="partChange()"
            required
          />
          <i-select
            v-model="searchParams.DEPT_CD"
            :label="$t('부서')"
            label-width="60px"
            append-inner-icon="mdi-magnify"
            :disabled="searchParams.BSNS_CD === '' || searchParams.PART_CD === ''"
            :items="codeList.DEPT_CD"
            item-title="ASGN_NM"
            item-value="ASGN_CD"
            width="250px"
            required
          />
        </v-sheet>
        <v-sheet no-gutters class="dashboard-contents mt-4">
          <div class="d-flex">
            <VCard
              color="inputDisabled"
              variant="outlined"
              width="30%"
              height="90%"
              class="ml-2 mt-2 mr-2"
            >
              <div class="d-flex pa-5">
                <div class="w-50">
                  <IGridTitle
                    :title="$t(resultData.BSNS_NM)"
                  >
                  </IGridTitle>
                  <div class="d-flex safe-card pa-4 mr-2 justify-space-between">
                    <v-chip :color="setChipColor(resultData.BSNS_CD_POINT)" label density>
                      <span>{{ setChipContent(resultData.BSNS_CD_POINT) }}</span>
                    </v-chip>
                    <div class="text-card ml-auto">{{ resultData.BSNS_CD_POINT }} 점</div>
                  </div>
                </div>
                <div class="w-50">
                  <IGridTitle
                    :title="$t(resultData.PART_NM)"
                  >
                  </IGridTitle>
                  <div class="d-flex safe-card pa-4 justify-space-between">
                    <v-chip :color="setChipColor(resultData.PART_CD_POINT)" label density>
                      <span>{{ setChipContent(resultData.PART_CD_POINT) }}</span>
                    </v-chip>
                    <div class="text-card ml-auto">{{ resultData.PART_CD_POINT }} 점</div>
                  </div>
                </div>
              </div>
              
            </VCard>
            <VCard
              color="inputDisabled"
              variant="outlined"
              width="70%"
              height="90%"
              class="ma-2 pa-5"
            >
              <IGridTitle
                :title="$t(resultData.DEPT_NM)"
              >
              </IGridTitle>
              <div class="d-flex">
                <div class="safe-card pa-4 d-flex mr-2 h-grow align-center justify-space-between">
                  <v-chip :color="setChipColor(resultData.DEPT_CD_POINT)" label density>
                    <span>{{ setChipContent(resultData.DEPT_CD_POINT) }}</span>
                  </v-chip>
                  <div class="text-card ml-auto">{{ resultData.DEPT_CD_POINT }} 점</div>
                </div> 
                <!--
                <div class="safe-card pa-4 d-flex mr-2 h-grow align-center justify-space-between">
                  <div class="text-card">상위 {{ resultData.PART_RANK }}위</div>
                  <div class="text-card2 ml-auto">{{ resultData.PART_NM }}부문</div>
                </div>
                <div class="safe-card pa-4 d-flex mr-2 h-grow align-center justify-space-between">
                  <div class="text-card2">인원 가중치</div>
                  <div class="text-card ml-auto"> {{ resultData.PERSNAL_WEIGHT }}</div>
                </div>
                <div class="safe-card pa-4 d-flex mr-2 h-grow align-center justify-space-between">
                  <div class="text-card2">{{ weakMonth }}월 안전관리 취약항목</div>
                  <v-chip color="error" label density v-for="(weak, i) in resultData.WEAK_LIST" :key="i">
                    {{ weak }}
                  </v-chip>
                </div>
                -->
              </div>
            </VCard>
          </div>
        </v-sheet>
        <v-sheet no-gutters class="mr-4 h-auto" style="height: 66% !important;">
          <VCard
            color="inputDisabled"
            variant="outlined"
            width="100%"
            height="100%"
            class="ma-2"
          >
            <div class="d-flex" style="height:90%;">

              <div class="ma-5 bottom-card" style="width: 17%;">
                <div class="d-flex">
                  <div class="bottom-title">안전사고</div>
                  <p class="ml-auto" >
                    <v-chip :color="setBottomChipColor(resultBottom.ACC_POINT)" label density>
                      <span class="bottom-chip-text">{{ resultBottom.ACC_POINT }} / {{ resultBottom.ACC_MAX_POINT }}</span>
                    </v-chip>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      {{ resultBottom.ACC_CALC }}
                    </v-tooltip>
                  </p>
                </div>
                <div class="count-card mt-2 pa-2">
                  <div class="ma-2 mt-4 cursor-pointer" v-for="(acc,i) in resultBottom.ACC" :key="i">
                    <div class="mb-3" style="text-align:center; color: #515151;;" v-if="acc.ACC_TYPE == 'F'">--------------------------------</div>
                    <div class="d-flex">
                      <div class="legend-additon mr-1" :class="setLegendColor(-1)" v-if="acc.ADDITION != ''"></div>
                      <span class="text-card3" >{{ acc.ACC_TYPE_NM }}</span>
                      <div class="d-flex ml-auto"> 
                        <span class="text-card4 w-50" >{{ acc.ACC_COUNT }} 건</span>
                        <span class="text-card5 ml-auto" >{{ nullZero(acc.ACC_MPOINT) }} 점</span>
                      </div>
                    </div>
                    <div class="card-cal" v-if="acc.EXPAND">
                      <div class="cal-detail" v-for="(accCal,j) in acc.CALC_COL" :key="j">{{ accCal }}</div>
                    </div>
                  </div>
                  <div class="ma-2">
                    <div class="text-label">※ 산재사고 : 산재 발생 : -25점</div>
                    <div class="text-label">※ 경미상1 : -15점/건, 경미상2 : -5점/건</div>
                    <div class="text-label">※ 일반사고 : 물적피해 : -5점/건, 아차사고 : -2점/건</div>
                    <!--
                    <div class="text-label">※ 사고 지연보고 항목 : 사고 지연보고에 따른 감점 합계 표시</div>
                    -->
                  </div>
                </div>
              </div>
              <v-divider
                vertical
                class="mt-5"
                style="color: #d8d8d8; opacity: 1 !important; height:90%;"
              />

              
              <div class="ma-5 bottom-card" style="width: 17%;">
                <div class="d-flex">
                  <div class="bottom-title">안전수칙</div>
                  <p class="ml-auto">
                    <v-chip :color="setBottomChipColor(resultBottom.RUL_POINT)" label density>
                      <span class="bottom-chip-text">{{ resultBottom.RUL_POINT }} / {{ resultBottom.RUL_MAX_POINT }}</span>
                    </v-chip>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      {{ resultBottom.RUL_CALC }}
                    </v-tooltip>
                  </p>
                </div>
                <div class="count-card mt-2 pa-2">
                  <div class="ma-2 mt-4 cursor-pointer" v-for="(rul,i) in resultBottom.RUL" :key="i">
                    <div class="d-flex">
                      <div class="legend-additon mr-1" :class="setLegendColor(-1)" v-if="rul.ADDITION != ''"></div>
                      <span class="text-card3" >{{ rul.RUL_TYPE_NM }}</span>
                      <div class="d-flex ml-auto">
                        <span class="text-card4 w-50" >{{ rul.RUL_COUNT }} 건</span>
                        <span class="text-card5 ml-auto" >{{ nullZero(rul.RUL_MPOINT) }} 점</span>
                      </div>
                    </div>
                    <div class="card-cal" v-if="rul.EXPAND">
                      <div class="cal-detail" v-for="(rulCal,j) in rul.CALC_COL" :key="j">{{ rulCal }}</div>
                    </div>
                  </div>
                  <div class="ma-2">
                    <div class="text-label">※ 절대수칙/작업중지 (-5점)</div>
                    <div class="text-label">※ 일반수칙 (-3점)</div>
                    <div class="text-label">※ 시정통보/사용중지 (-2점)</div>
                    <div class="text-label">※ 권고사항 (미조치시 -1점)</div>
                    
                    <!--
                    <div class="text-label">※ 사고 지연보고 항목 : 사고 지연보고에 따른 감점 합계 표시</div>
                    -->
                  </div>
                </div>
              </div>
              <v-divider
                vertical
                class="mt-5"
                style="color: #d8d8d8; opacity: 1 !important; height:90%;"
              />
              
              
              <div class="ma-5 bottom-card" style="width: 22%;height: 40%">
                <div class="d-flex">
                  <div class="bottom-title">안전개선활동</div>
                  <p class="ml-auto">
                    <v-chip :color="setBottomChipColor(resultBottom.DNG_POINT)" label density>
                      <span class="bottom-chip-text">{{ resultBottom.DNG_POINT }} / {{ resultBottom.DNG_MAX_POINT }}</span>
                    </v-chip>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      {{ resultBottom.DNG_CALC }}
                    </v-tooltip>
                  </p>
                </div>
                <div class="count-card mt-2 pa-2">
                  <div class="ma-2 mt-4 cursor-pointer" v-for="(dng,i) in resultBottom.DNG" :key="i">
                    <div class="d-flex">
                      <div class="legend-additon mr-1" :class="setLegendColor('1')" v-if="dng.ADDITION != ''"></div>
                      <span class="text-card3" >{{ dng.DNG_TYPE_NM }}</span>
                      <div class="d-flex ml-auto">
                        <span class="text-card4 w-50" >{{ dng.DNG_COUNT }} 건</span>
                        <span class="text-card5 ml-auto" >{{ nullZero(dng.DNG_MPOINT) }} 점</span>
                      </div>
                    </div>
                    <div class="card-cal" v-if="dng.EXPAND">
                      <div class="cal-detail" v-for="(dngCal,j) in dng.CALC_COL" :key="j">{{ dngCal }}</div>
                    </div>
                  </div>
                </div>
                <div class="d-flex mt-3">
                  <div class="bottom-title">자율안전</div>
                  <p class="ml-auto">
                    <v-chip :color="setBottomChipColor(resultBottom.DNG_POINT)" label density>
                      <span class="bottom-chip-text">10 / 10</span>
                    </v-chip>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      {{ resultBottom.DNG_CALC }}
                    </v-tooltip>
                  </p>
                </div>      
                <div class="count-card mt-2 pa-2" style="height:20%">
                  <div class="ma-2 mt-4 cursor-pointer" >
                    <div class="d-flex">
                      
                    </div>                    
                  </div>
                </div>          
                <div class="d-flex mt-3">
                  <div class="bottom-title">TBM</div>
                  <p class="ml-auto">
                    <v-chip :color="setBottomChipColor(resultBottom.DNG_POINT)" label density>
                      <span class="bottom-chip-text">10 / 10</span>
                    </v-chip>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      {{ resultBottom.DNG_CALC }}
                    </v-tooltip>
                  </p>
                </div>  
                <div class="count-card mt-2 pa-2" style="height:20%">
                  <div class="ma-2 mt-4 cursor-pointer" >
                    <div class="d-flex">
                      
                    </div>                    
                  </div>
                </div>       
              </div>              
                          
              <v-divider
                vertical
                class="mt-5"
                style="color: #d8d8d8; opacity: 1 !important; height:90%;"
              />
              
              <div class="ma-5 bottom-card">
                <div class="d-flex">
                  <div class="bottom-title">안전업무</div>
                  <p class="ml-auto">
                    <v-chip :color="setBottomChipColor(resultBottom.CHK_POINT)" label density>
                      <span class="bottom-chip-text">{{ resultBottom.CHK_POINT }} / {{ resultBottom.CHK_MAX_POINT }}</span>
                    </v-chip>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      {{ resultBottom.CHK_CALC }}
                    </v-tooltip>
                  </p>
                </div>
                <div class="count-card mt-2 pa-2">
                  <div class="ma-2 mt-4 cursor-pointer" v-for="(chk,i) in resultBottom.CHK" :key="i">
                    <div class="d-flex" v-if="chk.CHK_TYPE != ''">
                      <div class="legend-additon mr-1" :class="setLegendColor(-1)" v-if="chk.ADDITION != ''"></div>
                      <span class="text-card3" @click="toggleChk(i)">{{ chk.CHK_TYPE_NM }}</span>
                      <div class="d-flex ml-auto">
                        <span class="text-card4 w-50" @click="movePageChk(chk)">{{ chk.CHK_COUNT }} 건</span>
                        <span class="text-card5 ml-auto" @click="toggleChk(i)">{{ nullZero(chk.SUM_POINT) }} 점</span>
                      </div>
                    </div>
                    <div class="card-cal" v-if="chk.EXPAND">
                      <div class="cal-detail" v-for="(chkCal,j) in chk.CALC_COL" :key="j">{{ chkCal }}</div>
                    </div>
                    
                    
                    <!--
                    <div class="text-label">※ 사고 지연보고 항목 : 사고 지연보고에 따른 감점 합계 표시</div>
                    -->
                  </div>
                  <div class="ma-2">
                    <div class="text-label">※ 시정통보 미조치 : -1점/건 </div>
                    <div class="text-label">※ 개선계획서 미제출 : -2점/건</div>
                    <div class="text-label">※ 안전수칙위반자 교육 : -1점/건</div>
                    <div class="text-label">※ 요청자료 미제출 : -2점/건</div>
                  </div>
                </div>
              </div>
              <v-divider
                vertical
                class="mt-5"
                style="color: #d8d8d8; opacity: 1 !important; height:90%;"
              />
              <div class="ma-5 bottom-card" style="width: 24%; height:40%;">
                <div class="d-flex">
                  <div class="bottom-title">안전교육</div>
                  <p class="ml-auto">
                    <v-chip :color="setBottomChipColor(resultBottom.EDU_POINT)" label density>
                      <span class="bottom-chip-text">{{ resultBottom.EDU_POINT }} / {{ resultBottom.EDU_MAX_POINT }}</span>
                    </v-chip>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      {{ resultBottom.EDU_CALC }}
                    </v-tooltip>
                  </p>
                </div>
                <div class="count-card mt-2 pa-2">
                  <div class="ma-2 mt-4 cursor-pointer" :class="subEduContent(edu)" v-for="(edu,i) in resultBottom.EDU" :key="i">
                    <div class="d-flex">
                      <div class="legend-additon mr-1" :class="setLegendColor(-1)" v-if="edu.ADDITION != ''"></div>
                      <span class="text-card3" @click="toggleEdu(i)">{{ edu.EDU_TYPE_NM }}</span>
                      <div class="d-flex ml-auto">
                        <span class="text-card4 w-50" @click="movePageEdu(edu)">{{ edu.EDU_COUNT }}</span>
                        <span class="text-card5 ml-auto" @click="toggleEdu(i)">{{ nullZero(edu.SUM_POINT) }} 점</span>
                      </div>
                    </div>
                    <div class="card-cal" v-if="edu.EXPAND">
                      <div class="cal-detail" v-for="(eduCal,j) in edu.CALC_COL" :key="j">{{ eduCal }}</div>
                    </div>
                  </div>                  
                </div>
                <div class="d-flex mt-3">
                  <div class="bottom-title">기타 가점항목</div>
                  <p class="ml-auto">
                    <v-chip :color="setBottomChipColor(resultBottom.EDU_POINT)" label density>
                      <span class="bottom-chip-text">{{ resultBottom.PPOINT_POINT }} /{{ resultBottom.PPOINT_MAX_POINT }} </span>
                    </v-chip>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      {{ resultBottom.EDU_CALC }}
                    </v-tooltip>
                  </p>
                </div>
                <div class="count-card mt-2 pa-2">
                  <div class="ma-2 mt-4 cursor-pointer" >
                    <div class="d-flex">
                      <div class="legend-additon mr-1" :class="setLegendColor('1')" ></div>
                      <span class="text-card3" >칭찬쿠폰</span>
                      <div class="d-flex ml-auto">
                        <span class="text-card4 w-50" ></span>
                        <span class="text-card5 ml-auto" >{{ resultBottom.CPN_POINT }}점</span>
                      </div>                      
                    </div>    
                  </div>                                      
                  <div>
                    <div class="d-flex">
                        <div class="legend-additon mr-1" :class="setLegendColor('1')" ></div>
                        <span class="text-card3" >환경정화활동 OR 교통봉사</span>
                        <div class="d-flex ml-auto">
                          <span class="text-card4 w-50" ></span>
                          <span class="text-card5 ml-auto" >{{ resultBottom.ENV_POINT }}점</span>
                        </div>                      
                      </div>    
                    </div> 
                  <div>
                    <div class="d-flex">
                      <div class="legend-additon mr-1" :class="setLegendColor('1')" ></div>
                      <span class="text-card3" >안전설계 OR 우수사례</span>
                        <div class="d-flex ml-auto">
                          <span class="text-card4 w-50" ></span>
                          <span class="text-card5 ml-auto" >{{ resultBottom.DSN_POINT }}점</span>
                        </div>                      
                      </div>  
                    </div>   
                  </div>                  
                </div>
              </div>
              <v-divider
                vertical
                class="mt-5"
                style="color: #d8d8d8; opacity: 1 !important; height:90%;"
              /> 
                          
            
            <div class="d-flex ml-4">
              <!--일단 주석 처리함. (2024.12.20)-->
              <!--
              <div>
                <span class="legend-title ml-2 mb-1 mr-2">SLI 등급 기준</span>
                <span class="bottom-chip ma-2"> 14점 미만 </span>
                <v-chip class="ma-2" color="error" label density>
                  <span class="bottom-chip-text">위험</span>
                </v-chip>
                <span class="bottom-chip ma-2"> 16점 미만 </span>
                <v-chip class="ma-2" color="warning" label density>
                  <span class="bottom-chip-text">경고</span>
                </v-chip>
                <span class="bottom-chip ma-2"> 18점 미만 </span>
                <v-chip class="ma-2" color="success" label density>
                  <span class="bottom-chip-text">주의</span>
                </v-chip>
                <span class="bottom-chip ma-2"> 18점 이상</span>
                <v-chip class="ma-2" color="info" label density>
                  <span class="bottom-chip-text">양호</span>
                </v-chip>
              </div>
              -->
              
              <div class="ml-5">
                <div class="d-flex" style="align-items: center;">
                  <div class="legend-title ml-2 mb-1 mr-2">감점/가점 항목 구분</div>
                  <div class="legend-additon-big legend-addition-sub ma-2"></div>
                  <span class="bottom-chip ma-2">감점항목</span>
                  <div class="legend-additon-big legend-addition-add ma-2"></div>
                  <span class="bottom-chip ma-2">가점항목</span>
                  <div class="legend-additon-big legend-addition-both ma-2"></div>
                  <span class="bottom-chip ma-2">감점/가점 항목</span>
                </div>
              </div>
            </div>
          </VCard>
        </v-sheet> 
      </div>
      <!-- 업체 안전관리자 자체평가 팝업 -->
      <SAFFA0020_PopUp01
        ref="saffa0020_popup01"
      />
      <SAFFA0020_PopUp04
        ref="saffa0020_popup04"
      />
      <SAFFA0020_PopUp05
        ref="saffa0020_popup05"
      />
      <SAFFA0020_PopUp06
        ref="saffa0020_popup06"
      />
      <SAFFA0020_PopUp07
        ref="saffa0020_popup07"
      />
      <SAFFA0020_PopUp08
        ref="saffa0020_popup08"
      />
      
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
.safe-card {
  background: #F7F7F7;
  .content {
    width: 50%;
  }
  .text-card {
    color:rgb(24, 24, 24);
    font-size: 1rem;
    font-weight: 600;
  }
  .text-card2 {
    color:rgb(65, 65, 65);
    font-size: 1rem;
    font-weight: 450;
  }
}
.count-card {
  height: 95%;
  background: #F7F7F7;
  overflow-y: auto;
  .text-card {
    color:rgb(24, 24, 24);
    font-size: 1rem;
    font-weight: 600;
  }
  .text-card3 {
    color:rgb(96, 95, 95);
    font-size: 1rem;
    font-weight: 450;
  }
  .text-card4 {
    color:rgb(24, 24, 24);
    font-size: 1rem;
    font-weight: 600;
    text-align: right;
  }
  .text-card5 {
    color:#737070;
    font-size: 1rem;
    font-weight: 600;
    text-align: right;
    width: 70px;
  }
  .cursor-pointer {
    cursor: pointer !important;
  }
  .card-cal {
    color: #636363;
    font-size: 0.9rem;
    font-weight: 400; 
    .cal-detail {
      background: #ebfcff66;
      border: #c2dbff;
      border-width: 2px;
      border-style: solid;
      border-radius: 5px;
      margin-top: 8px;
      padding-left: 8px;
      padding-right: 8px;
      padding-top: 4px;
      padding-bottom: 4px;
    }
  }
}
.legend-additon {
  width:7px;
  height: 7px;
  border-radius: 5px;
  background-color: black;
}
.legend-additon-big {
  width:15px;
  height: 15px;
  border-radius: 15px;
  background-color: black;
  align-items: center;
}
.legend-addition-add {
  background-color: rgb(0,176,80);
}
.legend-addition-both {
  background-color: rgb(255,192,0);
}
.legend-addition-sub {
  background-color: rgb(255,0,0);
}
.legend-title {
  font-weight: 700;
  color: black;
  font-size: 1.1rem;
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

.text-label {
  color:#838383;
  margin-bottom: 4px;
}

.bottom-card {
  flex: 1 1 auto;
  width: 20%;
  .bottom-title {
    color:#051537;
    font-weight: 650;
    font-size: 1.2rem;
  }
}
.bottom-chip{
  color:rgb(54, 54, 54);
  font-weight: 600;
}

.bottom-chip-text {
  font-weight: 600;
}

.sub-edu {
  transform: scaleX(0.9) scaleY(0.9);
  margin-top: 8px !important;
}
</style>
  
