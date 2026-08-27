<!-- 
  화면명   : Hi-SAFE 주제관리
  화면개요 : Hi-SAFE 주제를 사업부 의견 및 평가 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonSearchApi3 } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { VWindow, VWindowItem } from 'vuetify/lib/components/index.mjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import IUploadPopup01 from "@/components/popup/IUploadPopup.vue"
import IUploadPopup02 from "@/components/popup/IUploadPopup.vue"
import IUploadPopup03 from "@/components/popup/IUploadPopup.vue"
import SRMFA0010 from '@/pages/40_safety-risk/SRM_F/SRMFA0010.vue'
import EvalutionPopup from '@/pages/40_safety-risk/SRM_C/Popup/SRMCA0010_popup03.vue'
import WorkPopup from "@/components/popup/WorkPopup.vue"

defineOptions({
  name: "40_safety-risk-SRM_C-TAB-SRMCA0010_Tab02",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const props = defineProps(['transfer']) 
const emit = defineEmits(['selected', 'updated'])

const tab = ref(null)

const isAdmin = ref(userStore.authGrpCd.includes('SRMAA001') ? true : false)
// const isAdmin = ref(userStore.authGrpCd.includes('GRP00291') ? true : false)

// 파일업로드
const fileUploadPopup01 = ref(null) // STEP01
const fileUploadPopup02 = ref(null) // STEP02
const fileUploadPopup03 = ref(null) // STEP03

const evalutionPopup = ref(null)  // 평가기준팝업

const sRMFA0010 = ref(null)         // 안전긴급예산 신청
const workPopup = ref(null)           // 작업표준선택

const searchParams = reactive(props.transfer)

// 기존 진행상태 값
const EXIST_SAVE_FLAG = ref('')

const topicManage = reactive({
  mainData: {},   // 주제관리 상단 데이터
  // 주제평가
  STEP01: {
    DEPT_OPIN: '',
    RISK_1: '',
    ECONOMIC_1: '',
    DIFFICULTY_1: '',
    GRADE_1: '',
    CATE_SAFE_OPIN: '',
    RISK_2: '',
    ECONOMIC_2: '',
    DIFFICULTY_2: '',
    GRADE_2: '',
    SRM_OPIN: '',
    RISK_3: '',
    ECONOMIC_3: '',
    DIFFICULTY_3: '',
    GRADE_3: '',
    GRADE_F: '',
    OUTCOME: '',    
  },
  // 중간평가
  STEP02: {
    DEPT_OPIN: '',
    RATE_1: '',
    SCORE_1: '',
    CATE_SAFE_OPIN: '',
    RATE_2: '',
    SCORE_2: '',
    SRM_OPIN: '',
    RATE_3: '',
    SCORE_3: '',
    SCORE_F: '',
  },
  // 결과평가
  STEP03: {
    DEPT_OPIN: '',
    RATE_1: '',
    SCORE_1: '',
    CATE_SAFE_OPIN: '',
    RATE_2: '',
    SCORE_2: '',
    SRM_OPIN: '',
    RATE_3: '',
    SCORE_3: '',
    SCORE_F: '',
  },
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  SAVE_FLAG: [],
  GRADE : [],
  TASK_TYPE: [],
  CHECK_ACC: [],
  EVALUATION: [
    { COD: 3, TXT: '상' },
    { COD: 2, TXT: '중' },
    { COD: 1, TXT: '하' }
  ],
  FINAL: [
    { COD: 'A', TXT: '평가완료' },
    { COD: 'B', TXT: '재선정 필요' },
    { COD: 'C', TXT: '평가중' },
  ],
  RATE: [],
  RIVISION_STATUS: [
    { COD: 'A', TXT: '개정필요' },
    { COD: 'B', TXT: '개정 불필요' },
    { COD: 'C', TXT: '개정 중' },
    { COD: 'D', TXT: '개정완료' },
  ],
  IMP_RESULT: [],
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),
    // 사업부 [1]
    commonSearchApi({
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N',
      },
    }),
    // SAVE_FLAG[2]
    getCodeList('HHIJJA01', userStore.cmpnyDiv, 'Y'),
    // 위험등급[3]
    getCodeList('HHIJJC01'),
    // 과제분류[4]
    getCodeList('HHIJJA02'),
    // 사고유형[5]
    getCodeList('HHIJJC11'),
    // 개선결과
    getCodeList('HHIJJE07'),
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.SAVE_FLAG = res[2].ORESULT_CUR
    codeList.GRADE = res[3].ORESULT_CUR
    codeList.TASK_TYPE = res[4].ORESULT_CUR
    codeList.CHECK_ACC = res[5].ORESULT_CUR
    codeList.IMP_RESULT = res[6].ORESULT_CUR
  })

  codeList.IMP_RESULT.unshift({ COD: '', TXT: '' })

  // 비율 리스트 세팅
  for (let i = 100; i >= 10; i -= 10) {
    codeList.RATE.push(i);
  }
}

// 최초 조회
const searchMain = async val => {
  await commonSearchApi({
    queryId: 'SRMCA0010_SEARCH_01',
    param: { TASK_NO: val }
  }).then(res => {
    topicManage.mainData = res.ORESULT_CUR[0]

    let array = res.ORESULT_CUR[0].CHECK_ACC ? res.ORESULT_CUR[0].CHECK_ACC.split(',') : []
    topicManage.mainData.CHECK_ACC = array

    EXIST_SAVE_FLAG.value = res.ORESULT_CUR[0].SAVE_FLAG

    // 날짜 format 세팅 
    topicManage.mainData.INSERT_DATE = dayjs(topicManage.mainData.INSERT_DATE).format('YYYY-MM-DD')
    topicManage.mainData.IMPRO_PLN_FROM = dayjs(topicManage.mainData.IMPRO_PLN_FROM, 'YYYYMMDD').format('YYYY-MM-DD')
    topicManage.mainData.IMPRO_PLN_TO = dayjs(topicManage.mainData.IMPRO_PLN_TO, 'YYYYMMDD').format('YYYY-MM-DD')
  })
}

// 상세 조회
const searchStep = async val => {
  await commonSearchApi({
    queryId: 'SRMCA0010_search02',
    param: { TASK_NO: val }
  }).then(res => {
    topicManage.STEP01 = res.ORESULT_CUR1[0] ? res.ORESULT_CUR1[0] : topicManage.STEP01
    topicManage.STEP02 = res.ORESULT_CUR2[0] ? res.ORESULT_CUR2[0] : topicManage.STEP02
    topicManage.STEP03 = res.ORESULT_CUR3[0] ? res.ORESULT_CUR3[0] : topicManage.STEP03

    gradeOutput(topicManage.STEP01.GRADE_1, topicManage.STEP01.GRADE_2, topicManage.STEP01.GRADE_3)
  }).catch(err => {
    Message.err(err) 
  })
}

const onBudgetApplication = () => {
  let params = {
    CMPNY_DIV: userStore.cmpnyDiv,
    TASK_SEQ: topicManage.mainData.TASK_SEQ,
    EB_COD: '' 
  }
  sRMFA0010.value.openPopup(params) 
}

// 주제평가 각 등급 평가 출력
const updateStep01Opinion = async model => {
  console.log('updateStep01Opinion :: ')

  let result = null

  if (model === '1') {
    if (topicManage.STEP01.RISK_1 && topicManage.STEP01.ECONOMIC_1 && topicManage.STEP01.DIFFICULTY_1) {
      result = topicManage.STEP01.RISK_1 + topicManage.STEP01.ECONOMIC_1 + topicManage.STEP01.DIFFICULTY_1
    }
  } else if (model === '2') {
    if (topicManage.STEP01.RISK_2 && topicManage.STEP01.ECONOMIC_2 && topicManage.STEP01.DIFFICULTY_2) {
      result = topicManage.STEP01.RISK_2 + topicManage.STEP01.ECONOMIC_2 + topicManage.STEP01.DIFFICULTY_2
    }
  } else if (model === '3') {
    if (topicManage.STEP01.RISK_3 && topicManage.STEP01.ECONOMIC_3 && topicManage.STEP01.DIFFICULTY_3) {
      result = topicManage.STEP01.RISK_3 + topicManage.STEP01.ECONOMIC_3 + topicManage.STEP01.DIFFICULTY_3
    }
  }

  if (result >= 8) {
    if (model === '1') {
      topicManage.STEP01.GRADE_1 = 'A'
    } else if (model === '2') {
      topicManage.STEP01.GRADE_2 = 'A'
    } else if (model === '3') {
      topicManage.STEP01.GRADE_3 = 'A'
    }
  } else if (result >= 6 && result <= 7) {
    if (model === '1') {
      topicManage.STEP01.GRADE_1 = 'B'
    } else if (model === '2') {
      topicManage.STEP01.GRADE_2 = 'B'
    } else if (model === '3') {
      topicManage.STEP01.GRADE_3 = 'B'
    }
  } else if (result <= 5) {
    if (model === '1') {
      topicManage.STEP01.GRADE_1 = 'C'
    } else if (model === '2') {
      topicManage.STEP01.GRADE_2 = 'C'
    } else if (model === '3') {
      topicManage.STEP01.GRADE_3 = 'C'
    }
  }

  if (topicManage.STEP01.GRADE_1 && topicManage.STEP01.GRADE_2 && topicManage.STEP01.GRADE_3) {

    gradeOutput(topicManage.STEP01.GRADE_1, topicManage.STEP01.GRADE_2, topicManage.STEP01.GRADE_3)
    //topicManage.STEP01.OUTCOME = 'A'  // codeList.FINAL -> A: 평가완료, B: 재선정 검토 필요
    
  } else {    
    //topicManage.STEP01.OUTCOME = 'C' // 평가중
    gradeOutput(topicManage.STEP01.GRADE_1, topicManage.STEP01.GRADE_2, topicManage.STEP01.GRADE_3)
  }
}

// 의견 저장 및 평가결과 산출
const btnStep01OpinionSave = (btn, isConfirmed) => {
  let saveParams = {}

  if(btn != 'SRM') {
    topicManage.STEP01.GRADE_F = ''
    //topicManage.STEP01.OUTCOME = ''
  }


  if (btn === 'DEPT') {
    saveParams = {}

    if (!topicManage.STEP01.DEPT_OPIN) {
      return Message.warn(t('부서 의견을 입력해주세요.'))
    } else if (!topicManage.STEP01.RISK_1) {
      return Message.warn(t('위험성을 선택해주세요.'))
    } else if (!topicManage.STEP01.ECONOMIC_1) {
      return Message.warn(t('경제성을 선택해주세요.'))
    } else if (!topicManage.STEP01.DIFFICULTY_1) {
      return Message.warn(t('난이도을 선택해주세요.'))
    }

    const result = topicManage.STEP01.RISK_1 + topicManage.STEP01.ECONOMIC_1 + topicManage.STEP01.DIFFICULTY_1

    if (result >= 8) {
      topicManage.STEP01.GRADE_1 = 'A'
    } else if (result >= 6 && result <= 7) {
      topicManage.STEP01.GRADE_1 = 'B'
    } else if (result <= 5) {
      topicManage.STEP01.GRADE_1 = 'C'
    }

    // 저장
    saveParams.DEPT_OPIN = topicManage.STEP01.DEPT_OPIN
		saveParams.RISK_1 = topicManage.STEP01.RISK_1
		saveParams.ECONOMIC_1 = topicManage.STEP01.ECONOMIC_1
		saveParams.DIFFICULTY_1 = topicManage.STEP01.DIFFICULTY_1
		saveParams.GRADE_1 = topicManage.STEP01.GRADE_1
  } else if (btn == 'BSNS') {
    saveParams = {}

    if (!topicManage.STEP01.CATE_SAFE_OPIN) {
      return Message.warn(t('사업부 안전 의견을 입력해주세요.'))
    } else if (!topicManage.STEP01.RISK_2) {
      return Message.warn(t('위험성을 선택해주세요.'))
    } else if (!topicManage.STEP01.ECONOMIC_2) {
      return Message.warn(t('경제성을 선택해주세요.'))
    } else if (!topicManage.STEP01.DIFFICULTY_2) {
      return Message.warn(t('난이도을 선택해주세요.'))
    }

    // 저장
    saveParams.CATE_SAFE_OPIN = topicManage.STEP01.CATE_SAFE_OPIN
		saveParams.RISK_2 = topicManage.STEP01.RISK_2
		saveParams.ECONOMIC_2 = topicManage.STEP01.ECONOMIC_2
		saveParams.DIFFICULTY_2 = topicManage.STEP01.DIFFICULTY_2
		saveParams.GRADE_2 = topicManage.STEP01.GRADE_2

  } else if (btn === 'SRM') {
    saveParams = {}

    if (!topicManage.STEP01.SRM_OPIN) {
      return Message.warn(t('안전경영부 의견을 입력해주세요.'))
    } else if (!topicManage.STEP01.RISK_3) {
      return Message.warn(t('위험성을 선택해주세요.'))
    } else if (!topicManage.STEP01.ECONOMIC_3) {
      return Message.warn(t('경제성을 선택해주세요.'))
    } else if (!topicManage.STEP01.DIFFICULTY_3) {
      return Message.warn(t('난이도을 선택해주세요.'))
    }

    // 저장
    saveParams.SRM_OPIN = topicManage.STEP01.SRM_OPIN
		saveParams.RISK_3 = topicManage.STEP01.RISK_3
		saveParams.ECONOMIC_3 = topicManage.STEP01.ECONOMIC_3
		saveParams.DIFFICULTY_3 = topicManage.STEP01.DIFFICULTY_3
		saveParams.GRADE_3 = topicManage.STEP01.GRADE_3
  }

  // TASK_NO, USER_ID 추가
  saveParams.TASK_NO = searchParams.TASK_NO
  saveParams.USER_ID = userStore.userId

  if (isConfirmed === true) {
    commonExecuteApi({
      queryId : 'SRMCA0010_SAVE_02', 
      list: [saveParams] 
    }).then(res => {
      if (res.result.status === '200') {
        searchParams.TASK_NO = res.list[0].TASK_NO
        // 조회
        searchStep(searchParams.TASK_NO)
      }
    })
  } else {
    vm.$swal({ 
      title: t('저장 하시겠습니까?'), 
      showCancelButton: true,
    }).then(ck => {
      if (ck.isConfirmed === true) {
        commonExecuteApi({
          queryId : 'SRMCA0010_SAVE_02', 
          list: [saveParams] 
        }).then(res => {
          if (res.result.status === '200') {
            Message.success(t('저장 되었습니다.'))

            searchParams.TASK_NO = res.list[0].TASK_NO
            // 조회
            searchStep(searchParams.TASK_NO)
          }
        })
      }
    })
  }  
}

// 의견 확정
const btnStep01OpinionConfirm = async btn => {
  let saveParams = {}
  let confirmParams = {}

  if (btn === 'DEPT') {
    if (!topicManage.STEP01.GRADE_1) {
      return Message.warn(t('저장 후 확정해주세요.'))
    }

    if (!topicManage.STEP01.DEPT_OPIN) {
      return Message.warn(t('부서 의견을 입력해주세요.'))
    } else if (!topicManage.STEP01.RISK_1) {
      return Message.warn(t('위험성을 선택해주세요.'))
    } else if (!topicManage.STEP01.ECONOMIC_1) {
      return Message.warn(t('경제성을 선택해주세요.'))
    } else if (!topicManage.STEP01.DIFFICULTY_1) {
      return Message.warn(t('난이도을 선택해주세요.'))
    }

    confirmParams.TASK_NO = searchParams.TASK_NO
    confirmParams.USER_ID = userStore.userId
    confirmParams.GRADE_1 = topicManage.STEP01.GRADE_1

    saveParams.DEPT_OPIN = topicManage.STEP01.DEPT_OPIN
		saveParams.RISK_1 = topicManage.STEP01.RISK_1
		saveParams.ECONOMIC_1 = topicManage.STEP01.ECONOMIC_1
		saveParams.DIFFICULTY_1 = topicManage.STEP01.DIFFICULTY_1
		saveParams.GRADE_1 = topicManage.STEP01.GRADE_1
  } else if (btn === 'BSNS') {
    if (!topicManage.STEP01.GRADE_2) {
      return Message.warn(t('저장 후 확정해주세요.'))
    }

    if (!topicManage.STEP01.CATE_SAFE_OPIN) {
      return Message.warn(t('사업부 안전 의견을 입력해주세요.'))
    } else if (!topicManage.STEP01.RISK_2) {
      return Message.warn(t('위험성을 선택해주세요.'))
    } else if (!topicManage.STEP01.ECONOMIC_2) {
      return Message.warn(t('경제성을 선택해주세요.'))
    } else if (!topicManage.STEP01.DIFFICULTY_2) {
      return Message.warn(t('난이도을 선택해주세요.'))
    }

    confirmParams.TASK_NO = searchParams.TASK_NO
    confirmParams.USER_ID = userStore.userId
    confirmParams.GRADE_2 = topicManage.STEP01.GRADE_2

    saveParams.CATE_SAFE_OPIN = topicManage.STEP01.CATE_SAFE_OPIN
		saveParams.RISK_2 = topicManage.STEP01.RISK_2
		saveParams.ECONOMIC_2 = topicManage.STEP01.ECONOMIC_2
		saveParams.DIFFICULTY_2 = topicManage.STEP01.DIFFICULTY_2
		saveParams.GRADE_2 = topicManage.STEP01.GRADE_2
  } else if (btn === 'SRM') {
    if (!topicManage.STEP01.GRADE_3) {
      return Message.warn(t('저장 후 확정해주세요.'))
    }

    if (!topicManage.STEP01.SRM_OPIN) {
      return Message.warn(t('안전경영부 의견을 입력해주세요.'))
    } else if (!topicManage.STEP01.RISK_3) {
      return Message.warn(t('위험성을 선택해주세요.'))
    } else if (!topicManage.STEP01.ECONOMIC_3) {
      return Message.warn(t('경제성을 선택해주세요.'))
    } else if (!topicManage.STEP01.DIFFICULTY_3) {
      return Message.warn(t('난이도을 선택해주세요.'))
    }

    confirmParams.TASK_NO = searchParams.TASK_NO
    confirmParams.USER_ID = userStore.userId
    confirmParams.GRADE_3 = topicManage.STEP01.GRADE_3

    saveParams.SRM_OPIN = topicManage.STEP01.SRM_OPIN
		saveParams.RISK_3 = topicManage.STEP01.RISK_3
		saveParams.ECONOMIC_3 = topicManage.STEP01.ECONOMIC_3
		saveParams.DIFFICULTY_3 = topicManage.STEP01.DIFFICULTY_3
  }
  
  if (topicManage.STEP01.GRADE_1 && topicManage.STEP01.GRADE_2 && topicManage.STEP01.GRADE_3) {
    saveParams.GRADE_3 = topicManage.STEP01.GRADE_3
    confirmParams.GRADE_F = topicManage.STEP01.GRADE_F
    confirmParams.OUTCOME = topicManage.STEP01.OUTCOME
  }

  vm.$swal({
    title: t('저장 후 확정 하시겠습니까?'), 
    showCancelButton: true,
  }).then(async ck => {
    if (ck.isConfirmed === true) {
      await btnStep01OpinionSave(btn, ck.isConfirmed)
      await commonExecuteApi({
        queryId : 'SRMCA0010_CONFIRM_01', 
        list: [confirmParams]
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('확정 되었습니다.'))
          emit('updated', { mainTab: 'HisafeManagement', subTab: 'STEP01' })
        }
      })
    }
  })
}

// 중간평가 진행률 선택시 평가 자동 계산
const updateStep02Opinion = async model => {
  if (model === '1') {
    await autoCal(topicManage.STEP02.RATE_1).then(res => {
      topicManage.STEP02.SCORE_1 = res
    })
  } else if (model === '2') {
    await autoCal(topicManage.STEP02.RATE_2).then(res => {
      topicManage.STEP02.SCORE_2 = res
    })
  } else if (model === '3') {
    await autoCal(topicManage.STEP02.RATE_3).then(res => {
      topicManage.STEP02.SCORE_3 = res
    })
  }

  if (topicManage.STEP02.SCORE_1 && topicManage.STEP02.SCORE_2 && topicManage.STEP02.SCORE_3) {
    // 최종점수 = (점수 1차 평가 * 20%) + (점수 2차 평가 * 30%) + (점수 3차 평가 * 50%)
    topicManage.STEP02.SCORE_F = (topicManage.STEP02.SCORE_1 * 0.2) + (topicManage.STEP02.SCORE_2 * 0.3) + (topicManage.STEP02.SCORE_3 * 0.5)
  }
}

// 중간평가 저장
const btnStep02OpinionSave = (btn, isConfirmed) => {
  let saveParams = {}

  if (btn === 'DEPT') {

    if (!topicManage.STEP02.DEPT_OPIN) {
      return Message.warn(t('부서의견을 입력해주세요.'))
    } else if (!topicManage.STEP02.RATE_1) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    saveParams.TASK_NO = searchParams.TASK_NO
    saveParams.DEPT_OPIN = topicManage.STEP02.DEPT_OPIN
    saveParams.RATE_1 = topicManage.STEP02.RATE_1
    saveParams.SCORE_1 = topicManage.STEP02.SCORE_1
    saveParams.USER_ID = userStore.userId
  } else if (btn === 'BSNS') {

    if (!topicManage.STEP02.CATE_SAFE_OPIN) {
      return Message.warn(t('사업부 안전 의견을 입력해주세요.'))
    } else if (!topicManage.STEP02.RATE_2) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    saveParams.TASK_NO = searchParams.TASK_NO
    saveParams.CATE_SAFE_OPIN = topicManage.STEP02.CATE_SAFE_OPIN
    saveParams.RATE_2 = topicManage.STEP02.RATE_2
    saveParams.SCORE_2 = topicManage.STEP02.SCORE_2
    saveParams.USER_ID = userStore.userId
  } else if (btn === 'SRM') {

    if (!topicManage.STEP02.SRM_OPIN) {
      return Message.warn(t('안전경영부 의견을 입력해주세요.'))
    } else if (!topicManage.STEP02.RATE_3) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    saveParams.TASK_NO = searchParams.TASK_NO
    saveParams.SRM_OPIN = topicManage.STEP02.SRM_OPIN
    saveParams.RATE_3 = topicManage.STEP02.RATE_3
    saveParams.SCORE_3 = topicManage.STEP02.SCORE_3
    saveParams.USER_ID = userStore.userId
  }

  if (isConfirmed === true) {
    commonExecuteApi({
      queryId : 'SRMCA0010_SAVE_03', 
      list: [saveParams] 
    }).then(res => {
      if (res.result.status === '200') {
        searchParams.TASK_NO = res.list[0].TASK_NO
        // 조회
        searchStep(searchParams.TASK_NO)
      }
    })
  } else {
    vm.$swal({ 
      title: t('저장 하시겠습니까?'), 
      showCancelButton: true,
    }).then(ck => {
      if (ck.isConfirmed === true) {
        commonExecuteApi({
          queryId : 'SRMCA0010_SAVE_03', 
          list: [saveParams] 
        }).then(res => {
          if (res.result.status === '200') {
            Message.success(t('저장 되었습니다.'))

            searchParams.TASK_NO = res.list[0].TASK_NO
            // 조회
            searchStep(searchParams.TASK_NO)
          }
        })
      }
    })
  }
}

// 중간평가 확정 
const btnStep02OpinionConfirm = btn => {
  let confirmParams = {}

  if (btn === 'DEPT') {
    if (!topicManage.STEP02.SCORE_1) {
      return Message.warn(t('저장 후 확정해주세요.'))
    }

    if (!topicManage.STEP02.DEPT_OPIN) {
      return Message.warn(t('부서의견을 입력해주세요.'))
    } else if (!topicManage.STEP02.RATE_1) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    confirmParams.TASK_NO = searchParams.TASK_NO
    confirmParams.SCORE_1 = topicManage.STEP02.SCORE_1
    confirmParams.USER_ID = userStore.userId
  } else if (btn === 'BSNS') {
    if (!topicManage.STEP02.SCORE_2) {
      return Message.warn(t('저장 후 확정해주세요.'))
    }

    if (!topicManage.STEP02.CATE_SAFE_OPIN) {
      return Message.warn(t('사업부 안전 의견을 입력해주세요.'))
    } else if (!topicManage.STEP02.RATE_2) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    confirmParams.TASK_NO = searchParams.TASK_NO
    confirmParams.SCORE_2 = topicManage.STEP02.SCORE_2
    confirmParams.USER_ID = userStore.userId

  } else if (btn === 'SRM') {
    if (!topicManage.STEP02.SCORE_3) {
      return Message.warn(t('저장 후 확정해주세요.'))
    }

    if (!topicManage.STEP02.SRM_OPIN) {
      return Message.warn(t('안전경영부 의견을 입력해주세요.'))
    } else if (!topicManage.STEP02.RATE_3) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    confirmParams.TASK_NO = searchParams.TASK_NO
    confirmParams.SCORE_3 = topicManage.STEP02.SCORE_3
    confirmParams.USER_ID = userStore.userId
  }

  // 전체 평가가 완료되어 확정 시 최종 출력
  if (topicManage.STEP02.SCORE_1 && topicManage.STEP02.SCORE_2 && topicManage.STEP02.SCORE_3) {
    // 최종점수 = (점수 1차 평가 * 20%) + (점수 2차 평가 * 30%) + (점수 3차 평가 * 50%)
    topicManage.STEP02.SCORE_F = (topicManage.STEP02.SCORE_1 * 0.2) + (topicManage.STEP02.SCORE_2 * 0.3) + (topicManage.STEP02.SCORE_3 * 0.5)
    confirmParams.SCORE_F = topicManage.STEP02.SCORE_F
  }

  vm.$swal({
    title: t('저장 후 확정 하시겠습니까?'), 
    showCancelButton: true,
  }).then(async ck => {
    if (ck.isConfirmed === true) {
      await btnStep02OpinionSave(btn, ck.isConfirmed)
      await commonExecuteApi({
        queryId : 'SRMCA0010_CONFIRM_02', 
        list: [confirmParams] 
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('확정 되었습니다.'))
          emit('updated', { mainTab: 'HisafeManagement', subTab: 'STEP02' })
        }
      })
    }
  })
}

// 결과평가 진행률 선택시 평가 자동 계산
const updateStep03Opinion = async model => {
  if (model === '1') {
    await autoCal2(topicManage.STEP03.RATE_1).then(res => {
      topicManage.STEP03.SCORE_1 = res
    })
  } else if (model === '2') {
    await autoCal2(topicManage.STEP03.RATE_2).then(res => {
      topicManage.STEP03.SCORE_2 = res
    })
  } else if (model === '3') {
    await autoCal2(topicManage.STEP03.RATE_3).then(res => {
      topicManage.STEP03.SCORE_3 = res
    })
  }

  if (topicManage.STEP03.SCORE_1 && topicManage.STEP03.SCORE_2 && topicManage.STEP03.SCORE_3) {
    // 최종점수 = (점수 1차 평가 * 20%) + (점수 2차 평가 * 30%) + (점수 3차 평가 * 50%)
    topicManage.STEP03.SCORE_F = (topicManage.STEP03.SCORE_1 * 0.2) + (topicManage.STEP03.SCORE_2 * 0.3) + (topicManage.STEP03.SCORE_3 * 0.5)
  }
}

// 결과평가 저장 
const btnStep03OpinionSave = (btn, isConfirmed) => {
  let saveParams = {}

  if (btn === 'DEPT') {

    if (!topicManage.STEP03.DEPT_OPIN) {
      return Message.warn(t('부서의견을 입력해주세요.'))
    } else if (!topicManage.STEP03.RATE_1) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    saveParams.TASK_NO = searchParams.TASK_NO
    saveParams.DEPT_OPIN = topicManage.STEP03.DEPT_OPIN
    saveParams.RATE_1 = topicManage.STEP03.RATE_1
    saveParams.SCORE_1 = topicManage.STEP03.SCORE_1
    saveParams.USER_ID = userStore.userId
  } else if (btn === 'BSNS') {

    if (!topicManage.STEP03.CATE_SAFE_OPIN) {
      return Message.warn(t('사업부 안전 의견을 입력해주세요.'))
    } else if (!topicManage.STEP03.RATE_2) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    saveParams.TASK_NO = searchParams.TASK_NO
    saveParams.CATE_SAFE_OPIN = topicManage.STEP03.CATE_SAFE_OPIN
    saveParams.RATE_2 = topicManage.STEP03.RATE_2
    saveParams.SCORE_2 = topicManage.STEP03.SCORE_2
    saveParams.USER_ID = userStore.userId
  } else if (btn === 'SRM') {

    if (!topicManage.STEP03.SRM_OPIN) {
      return Message.warn(t('안전경영부 의견을 입력해주세요.'))
    } else if (!topicManage.STEP03.RATE_3) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    saveParams.TASK_NO = searchParams.TASK_NO
    saveParams.SRM_OPIN = topicManage.STEP03.SRM_OPIN
    saveParams.RATE_3 = topicManage.STEP03.RATE_3
    saveParams.SCORE_3 = topicManage.STEP03.SCORE_3
    saveParams.USER_ID = userStore.userId
  }

  if (isConfirmed === true) {
    commonExecuteApi({
      queryId : 'SRMCA0010_SAVE_04', 
      list: [saveParams] 
    }).then(res => {
      if (res.result.status === '200') {
        searchParams.TASK_NO = res.list[0].TASK_NO
        // 조회
        searchStep(searchParams.TASK_NO)
      }
    })
  } else {
    vm.$swal({ 
      title: t('저장 하시겠습니까?'), 
      showCancelButton: true,
    }).then(ck => {
      if (ck.isConfirmed === true) {
        commonExecuteApi({
          queryId : 'SRMCA0010_SAVE_04', 
          list: [saveParams] 
        }).then(res => {
          if (res.result.status === '200') {
            Message.success(t('저장 되었습니다.'))

            searchParams.TASK_NO = res.list[0].TASK_NO
            // 조회
            searchStep(searchParams.TASK_NO)
          }
        })
      }
    })
  }
}

// 결과평가 확정 
const btnStep03OpinionConfirm = btn => {
  let saveParams = {}
  let confirmParams = {}

  if (btn === 'DEPT') {
    if (!topicManage.STEP03.SCORE_1) {
      return Message.warn(t('저장 후 확정해주세요.')) 
    }

    if (!topicManage.STEP03.DEPT_OPIN) {
      return Message.warn(t('부서의견을 입력해주세요.'))
    } else if (!topicManage.STEP03.RATE_1) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    confirmParams.TASK_NO = searchParams.TASK_NO
    confirmParams.SCORE_1 = topicManage.STEP03.SCORE_1
    confirmParams.USER_ID = userStore.userId

  } else if (btn === 'BSNS') {
    if (!topicManage.STEP03.SCORE_2) {
      return Message.warn(t('저장 후 확정해주세요.'))
    }

    if (!topicManage.STEP03.CATE_SAFE_OPIN) {
      return Message.warn(t('사업부 안전 의견을 입력해주세요.'))
    } else if (!topicManage.STEP03.RATE_2) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    confirmParams.TASK_NO = searchParams.TASK_NO
    confirmParams.SCORE_2 = topicManage.STEP03.SCORE_2
    confirmParams.USER_ID = userStore.userId

  } else if (btn === 'SRM') {
    if (!topicManage.STEP03.SCORE_3) {
      return Message.warn(t('저장 후 확정해주세요.'))
    }

    if (!topicManage.STEP03.SRM_OPIN) {
      return Message.warn(t('안전경영부 의견을 입력해주세요.'))
    } else if (!topicManage.STEP03.RATE_3) {
      return Message.warn(t('진행률을 선택해주세요.'))
    }

    confirmParams.TASK_NO = searchParams.TASK_NO
    confirmParams.SCORE_3 = topicManage.STEP03.SCORE_3
    confirmParams.USER_ID = userStore.userId


    // 전체 평가가 완료되어 확정 시 최종 출력
    if (topicManage.STEP03.SCORE_1 && topicManage.STEP03.SCORE_2 && topicManage.STEP03.SCORE_3) {
      topicManage.STEP03.SCORE_F = (topicManage.STEP03.SCORE_1 * 0.2) + (topicManage.STEP03.SCORE_2 * 0.3) + (topicManage.STEP03.SCORE_3 * 0.5)
      confirmParams.SCORE_F = topicManage.STEP03.SCORE_F
    }
  }

  vm.$swal({ 
    title: t('저장 후 확정 하시겠습니까?'), 
    showCancelButton: true,
  }).then(async ck => {
    if (ck.isConfirmed === true) {
      await btnStep03OpinionSave(btn, ck.isConfirmed)
      await commonExecuteApi({
        queryId : 'SRMCA0010_CONFIRM_03', 
        list: [confirmParams] 
      }).then(async res => {
        if (res.result.status === '200') {
          Message.success(t('확정 되었습니다.'))
          emit('updated', { mainTab: 'HisafeManagement', subTab: 'STEP03' })
        }
      })
    }
  })
}

// 중간평가 진행률 점수 자동 계산
const autoCal = rate => {
  return new Promise((resolve, reject) => {
    let score = null

    if (topicManage.STEP01.GRADE_F === 'A') {
      if (rate >= 50) {
          score = 100
      } else if (rate < 50 && rate >= 40) {        
        score = 80
      } else if (rate < 40) {
        score = 60
      } else if (rete < 35) {
        score = 50
      } else if (rate < 30) {
        score = 40
      } else if (rate < 25) {
        score = 30
      } else if (rate < 20) {
        score = 20
      } else if (rate < 15) {
        score = 10
      }
    } else if (topicManage.STEP01.GRADE_F === 'B') {
      if (rate >= 50) {
        score = 80
      } else if (rate < 50 && rate >= 40) {        
        score = 60
      } else if (rate < 40) {
        score = 40
      } else if (rate < 35) {
        score = 30
      } else if (rate < 30) {
        score = 20
      } else if (rate < 25) {
        score = 10
      }
    } else if (topicManage.STEP01.GRADE_F === 'C') {
      if (rate >= 50) {
        score = 60
      } else if (rate < 50 && rate >= 40) {        
        score = 40
      } else if (rate < 40) {
        score = 20
      } else if (rate < 35) {
        score = 10
      }
    }

    resolve(score)
  }).catch(err => {
    reject(err)
  })
}

// 결과평가 진행률 점수 자동 계산
const autoCal2 = rate => {
  return new Promise((resolve, reject) => {
    let score = null

    if (topicManage.STEP01.GRADE_F === 'A') {
      if (rate >= 90) {
        score = 100
      } else if (rate >= 80) {        
        score = 80
      } else if (rate >= 70) {
        score = 60
      } else if (rate >= 60) {
        score = 50
      } else if (rate < 60) {
        score = 40
      }
    } else if (topicManage.STEP01.GRADE_F === 'B') {
      if (rate >= 90) {
        score = 80
      } else if (rate >= 80) {        
        score = 60
      } else if (rate >= 70) {
        score = 40
      } else if (rate >= 60) {
        score = 30
      } else if (rate < 60) {
        score = 20
      }
    } else if (topicManage.STEP01.GRADE_F === 'C') {
      if (rate >= 90) {
        score = 60
      } else if (rate >= 80) {        
        score = 40
      } else if (rate >= 70) {
        score = 20
      } else if (rate >= 60) {
        score = 10
      } else if (rate < 60) {
        score = 0
      }
    }

    resolve(score)
  }).catch(err => {
    reject(err)
  })
}

// 파일첨부
const onFileUpload = type => {
  if (type === 'STEP01') {
    fileUploadPopup01.value.openPopup(topicManage.STEP01.OTHE_FILE_ID)
  } else if (type === 'STEP02') {
    fileUploadPopup02.value.openPopup(topicManage.STEP02.OTHE_FILE_ID)
  } else if (type === 'STEP03') {
    fileUploadPopup03.value.openPopup(topicManage.STEP03.OTHE_FILE_ID)
  }
}

// 주제평가 파일첨부
const uploaded01 = val => {
  let saveParams = {
    FILE_ID: val.fileId,
    TASK_NO: searchParams.TASK_NO,
    STAG_NO: '1'  // 주제평가는 STAG_NO가 1
  }
  return commonExecuteApi({
    queryId : 'SRMCA0010_SAVE_05', 
    list: [saveParams]
  }).then(res => {
    if (res.result.status === '200') {
      // 조회
      searchMain(searchParams.TASK_NO)
      searchStep(searchParams.TASK_NO)
    }
  })
}

// 중간평가 파일첨부
const uploaded02 = val => {
  let saveParams = {
    FILE_ID: val.fileId,
    TASK_NO: searchParams.TASK_NO,
    STAG_NO: '2'  // 중간평가는 STAG_NO가 2
  }
  return commonExecuteApi({
    queryId : 'SRMCA0010_SAVE_05', 
    list: [saveParams]
  }).then(res => {
    if (res.result.status === '200') {
      // 조회
      searchMain(searchParams.TASK_NO)
      searchStep(searchParams.TASK_NO)
    }
  })
}

// 결과평가 파일첨부
const uploaded03 = val => {
  let saveParams = {
    FILE_ID: val.fileId,
    TASK_NO: searchParams.TASK_NO,
    STAG_NO: '3'  // 결과평가는 STAG_NO가 3
  }
  return commonExecuteApi({
    queryId : 'SRMCA0010_SAVE_05', 
    list: [saveParams]
  }).then(res => {
    if (res.result.status === '200') {
      // 조회
      searchMain(searchParams.TASK_NO)
      searchStep(searchParams.TASK_NO)
    }
  })
}

// 관리자일 때 진행상태 변경
const changeSaveFlag = () => {
  let TITLE = ''

  let saveParams = []
  let saveObj = {}

  // 타이틀 가져오기
  for (let i of codeList.SAVE_FLAG) {
    if (topicManage.mainData.SAVE_FLAG === i.COD) {
      TITLE = i.TXT
    }
  }

  // 임시저장은 변경 불가
  if (topicManage.mainData.SAVE_FLAG === '010') {
    return Message.warn(t('주제등록완료부터 변경 가능합니다.'))
  }

  // 다음 프로세스 변경 불가
  if (Number(topicManage.mainData.SAVE_FLAG) >= Number(EXIST_SAVE_FLAG.value)) {
    return Message.warn(t('다음 프로세스로 변경 불가능합니다.')) 
  }

  // 진행상태 세팅
  const setConfirm = async val => {
    return new Promise((resolve, reject) => {
      let params = {}
      if (['020', '050', '060', '100'].includes(val)) {
        params.CONFIRM_1 = ''
        params.CONFIRM_2 = ''
        params.CONFIRM_3 = ''
      } else if (['030', '070', '090', '110'].includes(val)) {
        params.CONFIRM_1 = 'Y'
        params.CONFIRM_2 = ''
        params.CONFIRM_3 = ''
      } else if (['040', '080', '120', '130'].includes(val)) {
        params.CONFIRM_1 = 'Y'
        params.CONFIRM_2 = 'Y'
        params.CONFIRM_3 = ''
      }

      resolve(params)
    }).catch(err => {
      reject(err)
    })
  }

  if (['020', '030', '040', '050'].includes(topicManage.mainData.SAVE_FLAG)) {
      setConfirm(topicManage.mainData.SAVE_FLAG).then(res => {
        for (let i = 1; i <= 3; i++) {
          saveObj = {}
          saveObj.STAG_NO = i.toString()
          saveObj.CONFIRM_1 = res.CONFIRM_1
          saveObj.CONFIRM_2 = res.CONFIRM_2
          saveObj.CONFIRM_3 = res.CONFIRM_3
          saveObj.TASK_NO = searchParams.TASK_NO
          saveObj.SAVE_FLAG = topicManage.mainData.SAVE_FLAG
          saveParams.push(saveObj)
        }
      })
  } else if (['060', '070', '080', '090'].includes(topicManage.mainData.SAVE_FLAG)) {
    setConfirm(topicManage.mainData.SAVE_FLAG).then(res => {
      for (let i = 2; i <= 3; i++) {
          saveObj = {}
          saveObj.STAG_NO = i.toString()
          saveObj.CONFIRM_1 = res.CONFIRM_1
          saveObj.CONFIRM_2 = res.CONFIRM_2
          saveObj.CONFIRM_3 = res.CONFIRM_3
          saveObj.TASK_NO = searchParams.TASK_NO
          saveObj.SAVE_FLAG = topicManage.mainData.SAVE_FLAG
          saveParams.push(saveObj)
        }
    })
  } else if (['100', '110', '120', '130'].includes(topicManage.mainData.SAVE_FLAG)) {
    setConfirm(topicManage.mainData.SAVE_FLAG).then(res => {
      saveObj.STAG_NO = '3'
      saveObj.CONFIRM_1 = res.CONFIRM_1
      saveObj.CONFIRM_2 = res.CONFIRM_2
      saveObj.CONFIRM_3 = res.CONFIRM_3
      saveObj.TASK_NO = searchParams.TASK_NO
      saveObj.SAVE_FLAG = topicManage.mainData.SAVE_FLAG
      saveParams.push(saveObj)
    })
  }

  vm.$swal({ 
    title: t(TITLE + ' (으)로 변경 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'SRMCA0010_SAVE_06', 
        list: saveParams 
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('진행상태가 ' + TITLE + '으로 변경되었습니다.'))
          emit('updated', { mainTab: 'HisafeManagement', subTab: 'STEP01' })
        }
      }).catch(err => {
        return Message.err(err)
      })
    }
  })
}

// 평가기준 설명 팝업
const onEvalutionDiscript = () => {
  evalutionPopup.value.openPopup()
}

// 작업표준 선택
const selectWork = () => {
  workPopup.value.openPopup()
}

const onSelectWork = val => {
  if (val) {
    topicManage.mainData.WORK_STANDARD_ID = val.WORK_STANDARD_ID
    topicManage.mainData.WORK_STANDARD_NM = val.WORK_STANDARD_NM

    vm.$swal({
      title: t('작업표준을 변경 하시겠습니까?'), 
      showCancelButton: true,
    }).then(ck => {
      if (ck.isConfirmed === true) {
        commonExecuteApi({
          queryId : 'SRMCA0010_SAVE_07', 
          list: [{
            TASK_NO: topicManage.mainData.TASK_NO,
            WORK_STANDARD_ID: topicManage.mainData.WORK_STANDARD_ID,
            WORK_STANDARD_NM: topicManage.mainData.WORK_STANDARD_NM,
            RIVISION_STATUS: topicManage.mainData.RIVISION_STATUS,
          }] 
        }).then(res => {
          if (res.result.status === '200') {
            Message.success(t('저장 되었습니다.'))
          }
        })
      }
    })
  }
}

// 작업표준 개정여부 변경
const changeRivisionStatus = () => {
  vm.$swal({
    title: t('작업표준을 변경 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'SRMCA0010_SAVE_07',
        list: [{
          TASK_NO: topicManage.mainData.TASK_NO,
          WORK_STANDARD_ID: topicManage.mainData.WORK_STANDARD_ID,
          WORK_STANDARD_NM: topicManage.mainData.WORK_STANDARD_NM,
          RIVISION_STATUS: topicManage.mainData.RIVISION_STATUS,
        }] 
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('저장 되었습니다.'))
        }
      })
    }
  })
}

// 개선결과 선택
const changeImpResult = () => {
  vm.$swal({
    title: t('개선 결과를 변경 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'SRMCA0010_SAVE_08',
        list: [{
          TASK_NO: topicManage.mainData.TASK_NO,
          IMP_RESULT: topicManage.mainData.IMP_RESULT
        }] 
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('저장 되었습니다.'))
        }
      })
    }
  })
}

// 사업부 변경 시 부서 변경 이벤트
watch(() => topicManage.mainData.BSNS_CD, (newValue, oldValue) => {
  commonSearchApi({
    queryId : 'searchDept3', 
    param : {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: newValue,
      USE_DIV:'Y' 
    }
  }).then(res => {
    codeList.DEPT_CD = res.ORESULT_CUR
  })
})

// 조회
watch(() => searchParams.TASK_NO, (newValue, oldValue) => {
  searchMain(newValue)  // 최초 조회
  searchStep(newValue)  // 상세 조회 
})

// 중요 : 주제평가에서 각 부서, 사업부, 안전경영부에서 위험성, 경제성, 난이도를 선택하면 등급 평가가 나옴.
// 값이 변경되는데 주제 선정평가에 반영이 안되는 경우가 있어 watch기능으로 대체(@update:modelValue는 무시)

const gradeOutput = (first, second, third) => {
  console.log('gradeOutput :: ' + first + ' ::: ' + second + ':::' + third)

  if(first && second && third) {
    const newArr = [first, second, third]
    const newArrVal = []
    let sum = null
    let sumItem = null

    for (let i of newArr) {
      if (i === 'A') {
        sumItem = 3
      } else if (i === 'B') {
        sumItem = 2
      } else if (i === 'C') {
        sumItem = 1
      }
      newArrVal.push(sumItem)    
    }

    sum = newArrVal[0] * 0.2 + newArrVal[1] * 0.3 + newArrVal[2] * 0.5

    if (sum < 1.5) {
      topicManage.STEP01.GRADE_F = 'C'
    } else if (sum >= 1.5 && sum < 2.5) {
      topicManage.STEP01.GRADE_F = 'B'
    } else {
      topicManage.STEP01.GRADE_F = 'A'
    }

    outcomeOutput(first, second, third)

    //const result = parseFloat((sum/3).toFixed(1))

    /*if (result >= 2.5) {
      topicManage.STEP01.GRADE_F = 'A'
      topicManage.STEP01.OUTCOME = 'A'  // codeList.FINAL -> A: 평가완료, B: 재선정 검토 필요
    } 
    
    if (result < 2.5) {
      topicManage.STEP01.GRADE_F = 'B'
      topicManage.STEP01.OUTCOME = 'A'
    } 
    
    if (result < 1.5) {
      topicManage.STEP01.GRADE_F = 'C'
      topicManage.STEP01.OUTCOME = 'A'
    }

    // 3개의 등급평가 중 'C'가 2개 이상인 경우 재선정 검토 필요로 출력
    let countC = newArr.filter(item => item === 'C').length
    if (countC > 1) {
      topicManage.STEP01.GRADE_F = 'C'
      topicManage.STEP01.OUTCOME = 'B'
    }*/
  } else {
    outcomeOutput(first, second, third)
  }

}

const outcomeOutput = (first, second, third) => {
  //console.log('outcomeOutput :: ')
  
  const newArr1 = [topicManage.STEP01.RISK_1, topicManage.STEP01.ECONOMIC_1, topicManage.STEP01.DIFFICULTY_1]
  const newArr2 = [topicManage.STEP01.RISK_2, topicManage.STEP01.ECONOMIC_2, topicManage.STEP01.DIFFICULTY_2]
  const newArr3 = [topicManage.STEP01.RISK_3, topicManage.STEP01.ECONOMIC_3, topicManage.STEP01.DIFFICULTY_3]

  let countC1 = newArr1.filter(item => item === 1).length
  let countC2 = newArr2.filter(item => item === 1).length
  let countC3 = newArr3.filter(item => item === 1).length

  console.log('outcomeOutput :: ' + countC1 + ' ::: ' + countC2 + ':::' + countC3)

  /* if(countC1 > 1 || countC2 > 1 || countC3 > 1) {
    topicManage.STEP01.OUTCOME = 'B' // 재선정필요
  } */

  //2025.05.20 배학진책임 요청으로 조건 변경
  if(topicManage.STEP01.GRADE_F === 'C') {
    topicManage.STEP01.OUTCOME = 'B' // 재선정필요
  }
  else {
    if(first && second && third) {
      topicManage.STEP01.OUTCOME = 'A' // 평가완료
    } else {
      topicManage.STEP01.OUTCOME = 'C' // 평가중
    }
  }  
}

// 등급 1차 평가
watch(() => topicManage.STEP01.GRADE_1, (newValue, oldValue) => {
  gradeOutput(newValue, topicManage.STEP01.GRADE_2, topicManage.STEP01.GRADE_3)
})

// 등급 2차 평가
watch(() => topicManage.STEP01.GRADE_2, (newValue, oldValue) => {
  gradeOutput(topicManage.STEP01.GRADE_1, newValue, topicManage.STEP01.GRADE_3)
})

// 등급 3차 평가
watch(() => topicManage.STEP01.GRADE_3, (newValue, oldValue) => {
  gradeOutput(topicManage.STEP01.GRADE_1, topicManage.STEP01.GRADE_2, newValue)
})

onMounted(() => {
  tab.value = searchParams.subTab ? searchParams.subTab : 'STEP01'
  initCodeList()
  searchMain(searchParams.TASK_NO)  // 최초 조회
  searchStep(searchParams.TASK_NO)  // 상세 조회
})
</script>

<template>
  <v-card class="ma-0 pa-0 fill-height">
    <v-tabs v-model="tab">
      <v-tab value="STEP01">주제평가</v-tab>
      <v-tab value="STEP02"
        :disabled="['010', '020', '030', '040', '050'].includes(topicManage.mainData.SAVE_FLAG) ? true : false"
      >
        중간평가
      </v-tab>
      <v-tab value="STEP03"
        :disabled="['010', '020', '030', '040', '050', '060', '070', '080', '090'].includes(topicManage.mainData.SAVE_FLAG) ? true : false"
      >
        결과평가
      </v-tab>
    </v-tabs>
    <v-card-text class="pa-3 pt-2 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <!-- 회사명 -->
            <i-select
              v-model="topicManage.mainData.CMPNY_DIV"
              :label="$t('회사명')"
              width="150px"
              topLabel
              :items="codeList.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <!-- 사업부 -->
            <i-input
              v-model="topicManage.mainData.BSNS_NM"
              :label="$t('사업부')"
              width="150px"
              topLabel
              readonly
            />
            <!-- 부서 -->
            <i-input
              v-model="topicManage.mainData.DEPT_NM"
              :label="$t('부서')"
              width="200px"
              topLabel
              readonly
            />
            <!-- 담당자 -->
            <i-input
              v-model="topicManage.mainData.EMP_NM"
              :label="$t('담당자')"
              width="150px"
              topLabel
              readonly
            />
          </div>
          <div class="d-flex mt-1">
            <!-- 등록일자 -->
            <i-input
              v-model="topicManage.mainData.INSERT_DATE"
              :label="$t('등록일자')"
              width="150px"
              topLabel
              type="date"
              readonly
            />
            <!-- Hi-SAFE 관리번호 -->
            <i-input
              v-model="topicManage.mainData.TASK_NO"
              :label="$t('Hi-SAFE 관리번호')"
              width="150px"
              topLabel
              readonly
            />
            <!-- 통합관리번호 -->
            <i-input
              v-model="topicManage.mainData.TASK_SEQ"
              :label="$t('통합관리번호')"
              width="200px"
              topLabel
              readonly
            />
            <!-- 진행상태 -->
            <i-select
              v-model="topicManage.mainData.SAVE_FLAG"
              :label="$t('진행상태')"
              width="180px"
              topLabel
              :items="codeList.SAVE_FLAG"
              item-value="COD"
              item-title="TXT"
              :readonly="!isAdmin"
            />
            <v-btn
              v-if="isAdmin"
              class="align-center mt-6"
              @click="changeSaveFlag"
            >
              변경
            </v-btn>
          </div>
        </v-sheet>
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-input
              v-model="topicManage.mainData.TITLE"
              :label="$t('제목')"
              width="320px"
              topLabel
              readonly
            />
            <!-------- 파일 첨부 (각 프로세스 별로 출력)-------->
            <!------------ STEP01 ------------>
            <i-input
              v-if="tab === 'STEP01'"
              v-model="topicManage.STEP01.FILE_NAME"
              :label="$t('파일첨부')"
              width="200px"
              topLabel
              append-inner-icon="mdi-magnify"
              @click:appendInner="onFileUpload('STEP01')"
              readonly
            />
            <i-input
              v-if="tab === 'STEP01'"
              v-model="topicManage.STEP01.REPT_DT"
              :label="$t('첨부제출일자')" 
              width="180px"
              topLabel
              type="date"
              readonly
            />
            <!------------ STEP02 ------------>
            <i-input
              v-if="tab === 'STEP02'"
              v-model="topicManage.STEP02.FILE_NAME"
              :label="$t('파일첨부')"
              width="200px"
              topLabel
              append-inner-icon="mdi-magnify"
              @click:appendInner="onFileUpload('STEP02')"
              :required="tab === 'STEP02'"
              readonly
            />
            <i-input
              v-if="tab === 'STEP02'"
              v-model="topicManage.STEP02.REPT_DT"
              :label="$t('첨부제출일자')" 
              width="180px"
              topLabel
              type="date"
              readonly
            />
            <!------------ STEP03 ------------>
            <i-input
              v-if="tab === 'STEP03'"
              v-model="topicManage.STEP03.FILE_NAME"
              :label="$t('파일첨부')"
              width="200px"
              topLabel
              append-inner-icon="mdi-magnify"
              @click:appendInner="onFileUpload('STEP03')"
              :required="tab === 'STEP03'"
              readonly
            />
            <i-input
              v-if="tab === 'STEP03'"
              v-model="topicManage.STEP03.REPT_DT"
              :label="$t('첨부제출일자')" 
              width="180px"
              topLabel
              type="date"
              readonly
            />
            <!------------------------>
            <!-- 위험등급 -->
            <i-select
              v-model="topicManage.mainData.GRADE"
              :label="$t('위험등급')"
              width="135px"
              topLabel
              :items="codeList.GRADE"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <!-- 직접비용 -->
            <i-input
              v-model="topicManage.mainData.DIRT_EXP_PLN"
              :label="$t('직접비용(계획)')"
              width="135px"
              topLabel 
              suffix="(천원)"
              readonly
            />
            <!-- 소요공수 -->
            <i-input
              v-model="topicManage.mainData.DUR_DEC_PLN"
              :label="$t('소요공수(계획)')"
              width="135px"
              topLabel 
              suffix="(M/H)"
              readonly
            />
            <!-- 기타비용 -->
            <i-input
              v-model="topicManage.mainData.OTHE_COST_PLN"
              :label="$t('기타비용(계획)')"
              width="135px"
              topLabel 
              suffix="(천원)"
              readonly
            />
          </div>
          <div class="d-flex mt-1">
            <!-- 문제점 -->
            <i-input
              v-model="topicManage.mainData.PROBLEM"
              :label="$t('문제점')"
              width="320px"
              topLabel
              readonly
            />
            <!-- 과제분류 -->
            <i-select
              v-model="topicManage.mainData.TASK_TYPE"
              :label="$t('과제분류')"
              width="200px"
              topLabel
              :items="codeList.TASK_TYPE"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <!-- 작업표준 -->
            <div class="d-flex">
              <i-select
                v-model="topicManage.mainData.RIVISION_STATUS"
                :label="$t('작업표준')"
                :items="codeList.RIVISION_STATUS"
                item-value="COD"
                item-title="TXT"
                width="150px"
                topLabel
                margin="0px"
                :readonly="tab !== 'STEP03'" 
                :required="tab === 'STEP03'"
                @update:modelValue="changeRivisionStatus"
              />
              <i-input
                v-model="topicManage.mainData.WORK_STANDARD_NM"
                :label="$t('')"
                width="185px"
                topLabel
                :append-inner-icon="tab === 'STEP03' ? 'mdi-magnify' : ''"
                @click:appendInner="selectWork"
                readonly
              />
            </div>
            <!-- 협업부서1 -->
            <i-input
            v-model="topicManage.mainData.COLLABO_DEPT1_NM"
            :label="$t('협업부서1')"
            width="135px"
            topLabel
            readonly
            />
            <!-- 협업부서2 -->
            <i-input
            v-model="topicManage.mainData.COLLABO_DEPT2_NM"
            :label="$t('협업부서2')"
            width="135px"
            topLabel
            readonly
            />
          </div>
          <!-- </v-sheet>
            <v-sheet class="searchArea flex-column"> -->
          <div class="mt-2 d-flex">
            <!-- 개선계획기간(시작) -->
            <i-input
              v-model="topicManage.mainData.IMPRO_PLN_FROM"
              :label="$t('개선계획기간(시작)')"
              width="150px"
              topLabel
              type="date"
              readonly
            />
            <!-- 개선계획기간(종료) -->
            <i-input
              v-model="topicManage.mainData.IMPRO_PLN_TO"
              :label="$t('개선계획기간(종료)')"
              width="150px"
              topLabel
              type="date"
              readonly
            />
            <i-select
              v-if="tab === 'STEP03'"
              v-model="topicManage.mainData.IMP_RESULT"
              :label="$t('개선 결과')"
              width="200px"
              topLabel
              :items="codeList.IMP_RESULT"
              item-value="COD"
              item-title="TXT"
              @update:modelValue="changeImpResult"
              required
            />
          </div>
          <div class="d-flex mt-1">
            <!-- 사고유형 -->
            <i-select
              v-model="topicManage.mainData.CHECK_ACC"
              :label="$t('사고유형')"
              width="320px"
              topLabel
              :items="codeList.CHECK_ACC"
              item-value="COD"
              item-title="TXT"
              multiple
              readonly
            />
            <i-input 
              v-model="topicManage.mainData.CHECK_ACC2"
              :label="$t('')"
              width="400px"
              topLabel
              readonly
            />
            <div class="mt-5">
              <v-btn 
                @click="onBudgetApplication"
                :disabled="topicManage.mainData.CHK_BUDGET > 0"
              >
                <p v-if="topicManage.mainData.CHK_BUDGET > 0">안전긴급예산이 신청된 제보입니다.</p>
                <p v-else>안전긴급예산 신청</p>
              </v-btn>
            </div>
          </div>
        </v-sheet>
        <!--<div class="d-flex">
          <p>평가기준</p>
          <v-icon
            icon="mdi-note-check"
            size="small"
            color="#6e6e6e"
            class="ml-2"
            @click="onEvalutionDiscript"
          />
        </div>-->
        <v-window v-model="tab" class="mt-2">
          <!-- 주제평가 -->
          <v-window-item value="STEP01">
            <v-sheet class="flex-column">
              <div class="d-flex justify-space-between">
                <!-- 부서의견 -->
                <v-card width="470">
                  <v-card-title class="d-flex justify-space-between">
                    <div class="align-center"><h5>부서의견</h5></div>
                    <div>
                      <v-btn 
                        @click="btnStep01OpinionSave('DEPT')"
                        :disabled="['020'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                      >
                        저장
                      </v-btn>
                      <v-btn 
                        @click="btnStep01OpinionConfirm('DEPT')"
                        :disabled="['020'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                      >
                        확정
                      </v-btn>
                      <v-icon
                        icon="mdi-help-circle-outline"
                        size="small"
                        color="#6e6e6e"
                        class="ml-2"
                        @click="onEvalutionDiscript"
                      />
                    </div>                    
                  </v-card-title>
                  <v-card-text>
                    <div>
                      <i-textarea
                        v-model="topicManage.STEP01.DEPT_OPIN"
                        :row="2"
                        width="100%"
                        :readonly="['020'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                      />
                    </div>
                    <div class="d-flex mt-2">
                      <i-select
                        v-model="topicManage.STEP01.RISK_1"
                        :label="$t('위험성')"
                        width="130px"
                        label-width="40px"
                        :items="codeList.EVALUATION"
                        item-value="COD"
                        item-title="TXT"
                        :readonly="['020'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                        @update:modelValue="updateStep01Opinion('1')"
                      />
                      <i-select
                        v-model="topicManage.STEP01.ECONOMIC_1"
                        :label="$t('경제성')"
                        width="130px"
                        label-width="40px"
                        :items="codeList.EVALUATION"
                        item-value="COD"
                        item-title="TXT"
                        :readonly="['020'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                        @update:modelValue="updateStep01Opinion('1')"
                      />
                      <i-select
                        v-model="topicManage.STEP01.DIFFICULTY_1"
                        :label="$t('난이도')"
                        width="130px"
                        label-width="40px"
                        :items="codeList.EVALUATION"
                        item-value="COD"
                        item-title="TXT"
                        :readonly="['020'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                        @update:modelValue="updateStep01Opinion('1')"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-input
                        v-model="topicManage.STEP01.GRADE_1"
                        :label="$t('등급 1차 평가')"
                        label-width="80px"
                        width="130px"
                        readonly
                      />
                    </div>
                  </v-card-text>
                </v-card>
                <!-- 사업부 안전 의견 -->
                <v-card width="470">
                  <v-card-title class="d-flex justify-space-between">
                    <div class="align-center"><h5>사업부 안전 의견</h5></div>
                    <div>
                      <v-btn 
                        @click="btnStep01OpinionSave('BSNS')"
                        :disabled="['030'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                      >
                        저장
                      </v-btn>
                      <v-btn 
                        @click="btnStep01OpinionConfirm('BSNS')"
                        :disabled="['030'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                      >
                        확정
                      </v-btn>
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <div>
                      <i-textarea
                        v-model="topicManage.STEP01.CATE_SAFE_OPIN"
                        :row="2"
                        width="100%"
                        :readonly="['030'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                      />
                    </div>
                    <div class="d-flex mt-2">
                      <i-select
                        v-model="topicManage.STEP01.RISK_2"
                        :label="$t('위험성')"
                        width="130px"
                        label-width="40px"
                        :items="codeList.EVALUATION"
                        item-value="COD"
                        item-title="TXT"
                        :readonly="['030'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                        @update:modelValue="updateStep01Opinion('2')"
                      />
                      <i-select
                        v-model="topicManage.STEP01.ECONOMIC_2"
                        :label="$t('경제성')"
                        width="130px"
                        label-width="40px"
                        :items="codeList.EVALUATION"
                        item-value="COD"
                        item-title="TXT"
                        :readonly="['030'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                        @update:modelValue="updateStep01Opinion('2')"
                      />
                      <i-select
                        v-model="topicManage.STEP01.DIFFICULTY_2"
                        :label="$t('난이도')"
                        width="130px"
                        label-width="40px"
                        :items="codeList.EVALUATION"
                        item-value="COD"
                        item-title="TXT"
                        :readonly="['030'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                        @update:modelValue="updateStep01Opinion('2')"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-input 
                        v-model="topicManage.STEP01.GRADE_2"
                        :label="$t('등급 2차 평가')"
                        label-width="80px"
                        width="130px"
                        readonly
                      />
                    </div>
                  </v-card-text>
                </v-card>
                <!-- 안전경영부 의견 -->
                <!-- 
                  disable, readonly
                  부서의견에서 확정이 되면 CONFIRM_1 = 'Y', 사업부 안전 의견이 확정되면 CONFIRM_2 = 'Y' 일 때 클릭, 입력 할 수 있음. 
                  안전경영부 의견이 확정이 아닐 때 클릭, 입력이 가능하고 확정이되면 disable, readonly 처리
                -->
                <v-card width="470">
                  <v-card-title class="d-flex justify-space-between">
                    <div class="align-center"><h5>안전경영부 의견</h5></div>
                    <div>
                      <v-btn 
                        @click="btnStep01OpinionSave('SRM')"
                        :disabled="['040'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                      >
                        저장
                      </v-btn>
                      <v-btn 
                        @click="btnStep01OpinionConfirm('SRM')"
                        :disabled="['040'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                      >
                        확정
                      </v-btn>
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <div>
                      <i-textarea
                        v-model="topicManage.STEP01.SRM_OPIN"
                        :row="2"
                        width="100%"
                        :readonly="['040'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                      />
                    </div>
                    <div class="d-flex mt-2">
                      <i-select
                        v-model="topicManage.STEP01.RISK_3"
                        :label="$t('위험성')"
                        width="130px"
                        label-width="40px"
                        :items="codeList.EVALUATION"
                        item-value="COD"
                        item-title="TXT"
                        :readonly="['040'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                        @update:modelValue="updateStep01Opinion('3')"
                      />
                      <i-select
                        v-model="topicManage.STEP01.ECONOMIC_3"
                        :label="$t('경제성')"
                        width="130px"
                        label-width="40px"
                        :items="codeList.EVALUATION"
                        item-value="COD"
                        item-title="TXT"
                        :readonly="['040'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                        @update:modelValue="updateStep01Opinion('3')"
                      />
                      <i-select
                        v-model="topicManage.STEP01.DIFFICULTY_3"
                        :label="$t('난이도')"
                        width="130px"
                        label-width="40px"
                        :items="codeList.EVALUATION"
                        item-value="COD"
                        item-title="TXT"
                        :readonly="['040'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                        @update:modelValue="updateStep01Opinion('3')"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-input
                        v-model="topicManage.STEP01.GRADE_3"                      
                        :label="$t('등급 3차 평가')"
                        label-width="80px"
                        width="130px" 
                        readonly
                      />
                    </div>
                  </v-card-text>
                </v-card>                
              </div>
              <v-divider />
              <div class="d-flex mt-2 justify-end">
                <div class="mt-2 mr-6">
                  <h3>주제 선정평가</h3>
                </div>
                <div>
                  <div>
                    <i-input
                      v-model="topicManage.STEP01.GRADE_F"
                      :label="$t('최종')"
                      width="200px"
                      readonly
                    />
                  </div>
                  <div class="mt-2">
                    <i-select
                      v-model="topicManage.STEP01.OUTCOME"
                      :label="$t('결과')"
                      width="200px"
                      :items="codeList.FINAL"
                      item-value="COD"
                      item-title="TXT"
                      readonly
                    />
                  </div>
                </div>
              </div>
            </v-sheet>
          </v-window-item>
          <!-- 중간평가 --> 
          <v-window-item value="STEP02">
            <v-sheet class="flex-column">
              <div>
                <i-input
                  v-model="topicManage.STEP01.GRADE_F"
                  :label="$t('주제등급')"
                  label-width="50px"
                  width="200px"
                  readonly
                />
              </div>
              <div class="d-flex justify-space-between">
                <v-card width="470">
                  <v-card-title class="d-flex justify-space-between">
                    <div class="align-center"><h5>부서 의견</h5></div>
                    <div>
                      <v-btn 
                        @click="btnStep02OpinionSave('DEPT')"
                        :disabled="topicManage.STEP01.GRADE_F === 'C' ? true : ['060'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                      >
                        저장
                      </v-btn>
                      <v-btn 
                        @click="btnStep02OpinionConfirm('DEPT')"
                        :disabled="topicManage.STEP01.GRADE_F === 'C' ? true : ['060'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                      >
                        확정
                      </v-btn>
                      <v-icon
                        icon="mdi-help-circle-outline"
                        size="small"
                        color="#6e6e6e"
                        class="ml-2"
                        @click="onEvalutionDiscript"
                      />
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <div>
                      <i-textarea
                        v-model="topicManage.STEP02.DEPT_OPIN"
                        :row="2"
                        width="100%"
                        :readonly="topicManage.STEP01.GRADE_F === 'C' ? true : ['060'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-select
                        v-model="topicManage.STEP02.RATE_1"
                        :label="$t('진행률')"
                        label-width="45px"
                        width="150px"
                        :items="codeList.RATE"
                        suffix="%"
                        :readonly="topicManage.STEP01.GRADE_F === 'C' ? true : ['060'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                        @update:modelValue="updateStep02Opinion('1')"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-input
                        v-model="topicManage.STEP02.SCORE_1"
                        :label="$t('점수 1차 평가')"
                        label-width="80px"
                        width="150px"
                        readonly
                      />
                    </div>
                  </v-card-text>
                </v-card>
                <v-card width="470">
                  <v-card-title class="d-flex justify-space-between">
                    <div class="align-center"><h5>사업부 안전 의견</h5></div>
                    <div>
                      <v-btn 
                        @click="btnStep02OpinionSave('BSNS')"
                        :disabled="['070'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                      >
                        저장
                      </v-btn>
                      <v-btn 
                        @click="btnStep02OpinionConfirm('BSNS')"
                        :disabled="['070'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                      >
                        확정
                      </v-btn>
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <div>
                      <i-textarea
                        v-model="topicManage.STEP02.CATE_SAFE_OPIN"
                        :row="2"
                        width="100%"
                        :readonly="['070'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-select
                        v-model="topicManage.STEP02.RATE_2"
                        :label="$t('진행률')"
                        label-width="45px"
                        width="150px"
                        :items="codeList.RATE"
                        suffix="%"
                        :readonly="['070'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                        @update:modelValue="updateStep02Opinion('2')"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-input
                        v-model="topicManage.STEP02.SCORE_2"
                        :label="$t('점수 2차 평가')"
                        label-width="80px"
                        width="150px"
                        readonly
                      />
                    </div>
                  </v-card-text>
                </v-card> 
                <v-card width="470">
                  <v-card-title class="d-flex justify-space-between">
                    <div class="align-center"><h5>안전경영부 의견</h5></div>
                    <div>
                      <v-btn 
                        @click="btnStep02OpinionSave('SRM')"
                        :disabled="['080'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                      >
                        저장
                      </v-btn>
                      <v-btn 
                        @click="btnStep02OpinionConfirm('SRM')"
                        :disabled="['080'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                      >
                        확정
                      </v-btn>
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <div>
                      <i-textarea
                        v-model="topicManage.STEP02.SRM_OPIN"
                        :row="2"
                        width="100%"
                        :readonly="['080'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-select
                        v-model="topicManage.STEP02.RATE_3"
                        :label="$t('진행률')"
                        label-width="45px"
                        width="150px"
                        :items="codeList.RATE"
                        suffix="%"
                        :readonly="['080'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true" 
                        @update:modelValue="updateStep02Opinion('3')"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-input
                        v-model="topicManage.STEP02.SCORE_3"
                        :label="$t('점수 3차 평가')"
                        label-width="80px"
                        width="150px"
                        readonly
                      />
                    </div>
                  </v-card-text>
                </v-card> 
              </div>
              <v-divider />
              <div class="d-flex mt-2 justify-end">
                <div class="mt-2 mr-6">
                  <h3>중간발표 평가</h3>
                </div>
                <div>
                  <div>
                    <i-input
                      v-model="topicManage.STEP02.SCORE_F"
                      :label="$t('최종')"
                      width="200px"
                      readonly
                    />
                  </div>
                </div>
              </div>
            </v-sheet>
          </v-window-item>
          <!-- 결과평가 -->
          <v-window-item value="STEP03">
            <v-sheet class="flex-column">
              <div>
                <i-input
                  v-model="topicManage.STEP01.GRADE_F"
                  :label="$t('주제등급')"
                  label-width="50px"
                  width="200px"
                  readonly
                />
              </div>
              <div class="d-flex justify-space-between">
                <v-card width="470">
                  <v-card-title class="d-flex justify-space-between">
                    <div class="align-center"><h5>부서 의견</h5></div>
                    <div>
                      <v-btn 
                        @click="btnStep03OpinionSave('DEPT')"
                        :disabled="['100'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                      >
                        저장
                      </v-btn>
                      <v-btn 
                        @click="btnStep03OpinionConfirm('DEPT')"
                        :disabled="['100'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                      >
                        확정
                      </v-btn>
                      <v-icon
                        icon="mdi-help-circle-outline"
                        size="small"
                        color="#6e6e6e"
                        class="ml-2"
                        @click="onEvalutionDiscript"
                      />
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <div>
                      <i-textarea
                        v-model="topicManage.STEP03.DEPT_OPIN"
                        :row="2"
                        width="100%"
                        :readonly="['100'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-select
                        v-model="topicManage.STEP03.RATE_1"
                        :label="$t('진행률')"
                        label-width="45px"
                        width="150px"
                        :items="codeList.RATE"
                        suffix="%"
                        :readonly="['100'].includes(topicManage.mainData.SAVE_FLAG) ? false : true"
                        @update:modelValue="updateStep03Opinion('1')"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-input
                        v-model="topicManage.STEP03.SCORE_1"
                        :label="$t('등급 1차 평가')"
                        label-width="80px"
                        width="150px"
                        readonly
                      />
                    </div>
                  </v-card-text>
                </v-card>
                <v-card width="470">
                  <v-card-title class="d-flex justify-space-between">
                    <div class="align-center"><h5>사업부 안전 의견</h5></div>
                    <div>
                      <v-btn 
                        @click="btnStep03OpinionSave('BSNS')"
                        :disabled="['110'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                      >
                        저장
                      </v-btn>
                      <v-btn 
                        @click="btnStep03OpinionConfirm('BSNS')"
                        :disabled="['110'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                      >
                        확정
                      </v-btn>
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <div>
                      <i-textarea
                        v-model="topicManage.STEP03.CATE_SAFE_OPIN"
                        :row="2"
                        width="100%"
                        :readonly="['110'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-select
                        v-model="topicManage.STEP03.RATE_2"
                        :label="$t('진행률')"
                        label-width="45px"
                        width="150px"
                        :items="codeList.RATE"
                        suffix="%"
                        :readonly="['110'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('GRP00381') ? false : true" 
                        @update:modelValue="updateStep03Opinion('2')"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-input 
                        v-model="topicManage.STEP03.SCORE_2"
                        :label="$t('등급 2차 평가')"
                        label-width="80px"
                        width="150px"
                        readonly
                      />
                    </div>
                  </v-card-text>
                </v-card> 
                <v-card width="470">
                  <v-card-title class="d-flex justify-space-between">
                    <div class="align-center"><h5>안전경영부 의견</h5></div>
                    <div>
                      <v-btn 
                        @click="btnStep03OpinionSave('SRM')"
                        :disabled="['120'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                      >
                        저장
                      </v-btn>
                      <v-btn 
                        @click="btnStep03OpinionConfirm('SRM')"
                        :disabled="['120'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                      >
                        확정
                      </v-btn> 
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <div>
                      <i-textarea
                        v-model="topicManage.STEP03.SRM_OPIN"
                        :row="2"
                        width="100%"
                        :readonly="['120'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-select
                        v-model="topicManage.STEP03.RATE_3"
                        :label="$t('진행률')"
                        label-width="45px"
                        width="150px"
                        :items="codeList.RATE"
                        suffix="%"
                        :readonly="['120'].includes(topicManage.mainData.SAVE_FLAG) && userStore.authGrpCd.includes('SRMAA001') ? false : isAdmin ? false : true"
                        @update:modelValue="updateStep03Opinion('3')"
                      />
                    </div>
                    <div class="d-flex mt-2 justify-end">
                      <i-input 
                        v-model="topicManage.STEP03.SCORE_3"
                        :label="$t('등급 3차 평가')"
                        label-width="80px"
                        width="150px"
                        readonly
                      />
                    </div>
                  </v-card-text>
                </v-card> 
              </div>
              <v-divider />
              <div class="d-flex mt-2 justify-end">
                <div class="mt-2 mr-6">
                  <h3>최종발표 평가</h3>
                </div>
                <div>
                  <div>
                    <i-input
                      v-model="topicManage.STEP03.SCORE_F"
                      :label="$t('최종')"
                      width="200px"
                      readonly
                    />
                  </div>
                </div>
              </div>
            </v-sheet>
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>

  <!-- 파일업로드 -->
  <IUploadPopup01 ref="fileUploadPopup01" @uploaded="uploaded01"/>
  <IUploadPopup02 ref="fileUploadPopup02" @uploaded="uploaded02"/>
  <IUploadPopup03 ref="fileUploadPopup03" @uploaded="uploaded03"/>

  <!-- 안전긴급예산 신청 -->
  <SRMFA0010 ref="sRMFA0010" editor-id="sRMCA0010" />

  <!-- 평가기준 -->
  <EvalutionPopup ref="evalutionPopup" />

  <!-- 작업표준 선택 -->
  <WorkPopup ref="workPopup" @selected="onSelectWork"/>
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

// 사진첨부 버튼 위치 설정
div.mb-1 {
  text-align: right;
}

.v-autocomplete__selection{
  flex-wrap: nowrap;
}

::v-deep(.v-field__input){
  min-height: 40px !important;
  flex-wrap: nowrap !important;
  color: #000 !important;
  //overflow: hidden !important;
}
</style>
