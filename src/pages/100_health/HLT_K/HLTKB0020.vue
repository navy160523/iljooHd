<!-- HLTKB0020 보건관리계획서 작성 -->
<!-- SI2팀 손상규 2025-04-22 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonRequest2,
  commonLogExecuteApi,
} from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import VendTreePopup from '@/components/popup/VendTreePopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import HLTKB0020Popup01 from '@/pages/100_health/HLT_K/HLTKB0020Popup01.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import PdfView from '@/pages/99_indexPopUp/PdfViewPopup.vue'
defineOptions({
  name: '100_health-HLT_K-HLTKB0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)
const vendTreePopup = ref(null)
const empPopup = ref(null)
const hltkb0020Popup01 = ref(null)
const tab = ref(0)
const pdfPopup = ref(null)

// 파일업로드
const agencyFileUploadPopup = ref(null)
const agencyFileTitle = ref('')
const agreeFileUploadPopup = ref(null)
const agreeFileTitle = ref('')
const confirmFileUploadPopup = ref(null)
const downloadFoamUploadPopup = ref(null)

// 엑셀
const content1 = ref(null)
const content2 = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get('year'),
  REQ_CHA: '',
  VEND_CD: userStore.asgnCd || '',
  BSNS_CD: '',
  DEPT_CD: '',
})

watch(tab, (newVal, oldVal) => {
  // 기초 건강상담(0) → 사후관리 계획(1) 이동할 때만 메시지
  if (oldVal === 0 && newVal === 1) {
    Message.warn('임시저장 후 개인정보동의서를 첨부해주세요.')
  }
})

// 년도별 주기값
watch(
  () => searchParams.YEAR,
  (newYear) => {
    const yearNum = Number(newYear)
    if (yearNum >= 2025) {
      searchParams.REQ_CHA = '12'
    } else if (yearNum == '2024') {
      searchParams.REQ_CHA = '07'
    } else {
      searchParams.REQ_CHA = ''
    }
  },
  { immediate: true }
)

const codeList = reactive({
  YEAR: [],
  REQ_CHA: [
    { COD: '01', TXT: '상반기' },
    { COD: '07', TXT: '하반기' },
  ],
  AGENCYLIST: [
    { COD: '대한산업보건협회', TXT: '대한산업보건협회' },
    { COD: '울산대학병원', TXT: '울산대학병원' },
    { COD: '미대행', TXT: '미대행' },
    { COD: '기타', TXT: '기타' },
  ],
})

// 보건관리 기본정보 담당자 데이터
const manageParams = reactive({
  SAVE_YN: '',
})

const isReadOnly = computed(() => {
  return (dataParams.STD_CONFIRM_YN === 'Y' && dataParams.AFT_CONFIRM_YN === 'Y') || dataParams.EMP_NO == null
})

// 설문 readonly
const smokeReadonly = ref(true)
const drunkReadonly = ref(true)
const exrcReadonly = ref(true)
const familyReadonly = ref(true)
const aleReadonly = ref(true)
const pastReadonly = ref(true)
const surgReadonly = ref(true)
const underReadonly = ref(true)
const sickReadonly = ref(true)
const pillReadonly = ref(true)
const stressReadonly = ref(true)
const pworkReadonly = ref(true)
const switchReadonly = ref(true)
const unfitDirectInput = ref(false)

// 설문데이터
const dataParams = reactive({
  IDX_SEQ: '',
  UNFIT_RES_NAME_YN: 'N',
  SAVE_YN: 'N',
})

const workTimeModel = ref(dataParams.WORK_TIME)
const workMngModel = ref(dataParams.WORK_MNG ? dataParams.WORK_MNG.split(',') : [])
const mediTrmModel = ref(dataParams.MEDI_TRM ? dataParams.MEDI_TRM.split(',') : [])
const mediCycleModel = ref(dataParams.MEDI_CYCLE)
const healthCareModel = ref(dataParams.HEALTH_CARE ? dataParams.HEALTH_CARE.split(',') : [])
const protectModel = ref(dataParams.PROTECT ? dataParams.PROTECT.split(',') : [])

/*  공통코드 세팅 */
onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true

  codeList.YEAR = []
  for (var i = dayjs().get('year') + 1; i >= dayjs().get('year') - 10; i--) {
    codeList.YEAR.push({ COD: i, TXT: i })
  }
})

// 협력사 팝업
const openVendPopup = () => {
  vendTreePopup.value.openPopup({ ORGN_DIV: 'B' })
}

// 현력사선택 팝업이벤트
const selectedVend = (data) => {
  console.log(data)
  searchParams.BSNS_CD = data.BSNS_CD
  searchParams.DEPT_CD = data.DEPT_CD
  searchParams.VEND_CD = data.ASGN_CD
  searchParams.VEND_NAME = data.ASGN_NM

  // 보건관리계획서 작성율 때문에 추가함
  // 협력사 선택시 이전 담당자 정보가 남아서 자동으로 계산됨 방지
  Object.keys(manageParams).forEach((key) => {
    manageParams[key] = ''
  })
  Object.keys(dataParams).forEach((key) => {
    dataParams[key] = ''
  })
  onButtonsClick({ id: 'btnSearch' })
}

// 인원 팝업
const openEmpPopup = () => {
  const managerAuth = {
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    USER_DIV: 'B',
  }
  const normal = {
    CMPNY_DIV_D: true,
    USER_DIV_D: true,
    BSNS_CD_D: true,
    DEPT_CD_D: true,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    USER_DIV: 'B',
  }
  empPopup.value.openPopup(userStore.authGrpCd.includes('HLTK001') ? managerAuth : normal)
}

// 인원선택팝업 이벤트
const selectedEmp = (data) => {
  manageParams.CMPNY_DIV = data.CMPNY_DIV
  manageParams.EMP_NO = data.EMP_NO
  manageParams.EMP_NM = data.EMP_NM
  manageParams.TEL_NO = data.HND_PHN
  manageParams.POSITION_NM = data.JOB_TIT_NM
  manageParams.VEND_CD = data.ASGN_CD
  manageParams.VEND_NAME = data.ASGN_NM
  manageParams.YEAR = searchParams.YEAR
  manageParams.AGENCY = ''
  manageParams.FILE_ID = ''
  manageParams.AGENCY_FILE_DT = ''
  manageParams.SAVE_YN = ''
  if (manageParams.YEAR < '2025') {
    manageParams.REQ_CHA = searchParams.REQ_CHA
  } else {
    manageParams.REQ_CHA = '12'
  }
}

// 상세정보 보기 팝업
const openDetailInfo = () => {
  hltkb0020Popup01.value.openPopup({ searchParams })
}

// 체크박스 단일, 복수선택
watch(workTimeModel, (newVal) => {
  dataParams.WORK_TIME = newVal
})
// watch(workMngModel, (val) => {
//   dataParams.WORK_MNG = val.join(',');
// });
// watch(mediTrmModel, (val) => {
//   dataParams.MEDI_TRM = val.join(',');
// });
watch(mediCycleModel, (newVal) => {
  dataParams.MEDI_CYCLE = newVal
})
// watch(healthCareModel, (val) => {
//   dataParams.HEALTH_CARE = val.join(',');
// });
// watch(protectModel, (val) => {
//   dataParams.PROTECT = val.join(',');
// });

const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV: 'Y' },
    }),
    getCodeList('HHIR020'),
    getCodeList('HHIR030'),
    getCodeList('HHIR040'),
    getCodeList('HHIR050'),
    getCodeList('HHIR060'),
    getCodeList('HHIR070'),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.deptCd = res[2].ORESULT_CUR

    codeList.list1 = res[3].ORESULT_CUR
    codeList.list2 = res[4].ORESULT_CUR
    codeList.list3 = res[5].ORESULT_CUR
    codeList.list4 = res[6].ORESULT_CUR
    codeList.list5 = res[7].ORESULT_CUR
    codeList.list6 = res[8].ORESULT_CUR
  })
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption: { checkBar: { visible: false }, edit: { editable: true } },
  keys: [],
  fields: [
    {
      fieldName: 'EMP_ID',
      width: '80',
      styleName: 'center-column',
      dataType: 'text',
      header: { text: t('사번') },
      editable: false,
    },
    {
      fieldName: 'ENTER_NAME',
      width: '80',
      styleName: 'center-column',
      dataType: 'text',
      header: { text: t('이름') },
      editable: false,
    },
    {
      fieldName: 'UNFIT_RES_NAME',
      width: '200',
      styleName: 'left-column',
      dataType: 'text',
      header: { text: t('건강상태 관리항목') },
      editable: false,
    },
    {
      fieldName: 'WRITE_YN',
      width: '80',
      styleName: 'center-column',
      dataType: 'text',
      header: { text: t('작성상태') },
      editable: false,
      valueCallback: function (prod, dataRow, fieldName, fieldNames, values) {
        let std = values[fieldNames.indexOf('STD_CONFIRM_YN')]
        let aft = values[fieldNames.indexOf('AFT_CONFIRM_YN')]

        if (std === 'Y' && aft === 'Y') {
          return '작성완료'
        } else if (std === 'A' && aft === 'A') {
          return '작성중'
        } else {
          return '미작성'
        }
      },
    },

    { fieldName: 'VEND_CD', dataType: 'text', header: { text: t('협력사') }, visible: false },
    { fieldName: 'VEND_NAME', dataType: 'text', header: { text: t('협력사명') }, visible: false },
    { fieldName: 'COMPANY', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'JOIN_DT', dataType: 'text', header: { text: t('입사일') }, visible: false },
    { fieldName: 'JOB_NM', dataType: 'text', header: { text: t('현재직무') }, visible: false },
    { fieldName: 'STD_CONFIRM_YN', dataType: 'text', header: { text: t('기초건강상담 작성상태') }, visible: false },
    { fieldName: 'AFT_CONFIRM_YN', dataType: 'text', header: { text: t('사후관리계획 작성상태') }, visible: false },
  ],
  columns: [],
})

grd1Props.columns = grd1Props.fields

// 보건관리계획서 조회
const rowChanged = async (grid, oldIdx, newIdx) => {
  if (newIdx === -1) return

  const rowData = await grdMain.value.getDataProvider().getJsonRow(newIdx)

  // 설문 데이터 우선 조회
  const [res] = await Promise.all([
    commonSearchApi({
      queryId: 'HLTKB0020_SEARCH_05',
      param: {
        EMP_NO: rowData.EMP_ID,
        VEND_CD: rowData.VEND_CD,
        YEAR: searchParams.YEAR,
      },
    }),
  ])

  let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)

  const searchData = res.ORESULT_CUR?.[0]
  console.log('조회된것임??', searchData)

  if (searchData) {
    // 설문 결과 있으면 해당 내용으로 덮어쓰기
    Object.assign(dataParams, searchData)
    workTimeModel.value = searchData.WORK_TIME
    workMngModel.value = searchData.WORK_MNG ? searchData.WORK_MNG.split(',') : []
    mediTrmModel.value = searchData.MEDI_TRM ? searchData.MEDI_TRM.split(',') : []
    mediCycleModel.value = searchData.MEDI_CYCLE
    healthCareModel.value = searchData.HEALTH_CARE ? searchData.HEALTH_CARE.split(',') : []
    protectModel.value = searchData.PROTECT ? searchData.PROTECT.split(',') : []
    dataParams.YEAR = searchParams.YEAR
  } else {
    // 초기화
    Object.keys(dataParams).forEach((key) => {
      dataParams[key] = ''
    })

    dataParams.SAVE_YN = 'N'
    dataParams.YEAR = searchParams.YEAR
    unfitDirectInput.value = false
    workTimeModel.value = ''
    workMngModel.value = []
    mediTrmModel.value = []
    mediCycleModel.value = ''
    healthCareModel.value = []
    protectModel.value = []
    console.log('dataParams', dataParams)

    // 설문 결과 없으면 인원 기본정보만 채움
    const empRes = await commonSearchApi({
      queryId: 'searchEMP3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        USER_DIV: 'B',
        EMP_NO: rowData.EMP_ID,
        EMP_NM: rowData.ENTER_NAME,
        ASGN_CD: rowData.VEND_CD,
        DEPT_CD: '',
      },
    })

    const empData = empRes.ORESULT_CUR?.[0] || {}

    dataParams.VEND_NM = rowData.VEND_NAME
    dataParams.VEND_CD = rowData.VEND_CD
    dataParams.EMP_NO = rowData.EMP_ID
    dataParams.KOR_NM = rowData.ENTER_NAME
    dataParams.JOIN_DT = rowData.JOIN_DT
    dataParams.PRE_JOB = rowData.JOB_NM
    dataParams.SEX = empData.SEX
    dataParams.BIRTH_DAY = formatBirthWithAge(empData.BIRTH_DAY)
    dataParams.UNFIT_RES_NAME = rowData.UNFIT_RES_NAME
  }
}

// 일자, 시간 가공
const displayDate = computed(() => {
  const raw = dataParams.UPDATE_DATE || dataParams.INSERT_DATE || ''
  return raw ? raw.split('T')[0] : ''
})

const displayTime = computed(() => {
  const raw = dataParams.UPDATE_DATE || dataParams.INSERT_DATE || ''
  if (!raw.includes('T')) return ''
  const timePart = raw.split('T')[1]
  return timePart.slice(0, 5) // "10:42"
})

// 나이붙이기
const formatBirthWithAge = (birthStr) => {
  if (!birthStr || birthStr.length !== 8) return birthStr

  const birthYear = Number(birthStr.substring(0, 4))
  const birthMonth = Number(birthStr.substring(4, 6)) - 1
  const birthDay = Number(birthStr.substring(6, 8))

  const birthDate = new Date(birthYear, birthMonth, birthDay)
  const today = new Date()

  let age = today.getFullYear() - birthYear
  const hasHadBirthday =
    today.getMonth() > birthMonth || (today.getMonth() === birthMonth && today.getDate() >= birthDay)

  if (!hasHadBirthday) {
    age--
  }

  return `${birthStr} (만 ${age}세)`
}

//readonly Event
// 흡연
watch(
  () => dataParams.SMOKE_YN,
  (newVal) => {
    smokeReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.SMOKE_FRE = ''
      dataParams.SMOKE_AMT = ''
      dataParams.SMOKE_DESC = ''
    }
  }
)

// 음주
watch(
  () => dataParams.DRUNK_YN,
  (newVal) => {
    drunkReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.DRUNK_FRE = ''
      dataParams.DRUNK_AMT = ''
      dataParams.DRUNK_TYPE = ''
      dataParams.DRUNK_DESC = ''
    }
  }
)

// 운동
watch(
  () => dataParams.EXRC_YN,
  (newVal) => {
    exrcReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.EXRC_FRE = ''
      dataParams.EXRC_AMT = ''
      dataParams.EXRC_TYPE = ''
      dataParams.EXRC_DESC = ''
    }
  }
)

// 가족력
watch(
  () => dataParams.FAMILY_YN,
  (newVal) => {
    familyReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.FAMILY_REL = ''
      dataParams.FAMILY_NM = ''
      dataParams.FAMILY_OCC = ''
      dataParams.FAMILY_DESC = ''
    }
  }
)

// 알레르기
watch(
  () => dataParams.ALE_YN,
  (newVal) => {
    aleReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.ALE_NM = ''
      dataParams.ALE_OCC = ''
      dataParams.ALE_DESC = ''
    }
  }
)

// 과거질환
watch(
  () => dataParams.PAST_YN,
  (newVal) => {
    pastReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.PAST_DT = ''
      dataParams.PAST_NM = ''
      dataParams.PAST_RESULT = ''
    }
  }
)

// 수술력
watch(
  () => dataParams.SURG_YN,
  (newVal) => {
    surgReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.SURG_DT = ''
      dataParams.SURG_NM = ''
      dataParams.SURG_RESULT = ''
    }
  }
)

// 기저질환
watch(
  () => dataParams.UNDER_YN,
  (newVal) => {
    underReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.UNDER_DT = ''
      dataParams.UNDER_DESC = ''
      dataParams.UNDER_RESULT = ''
    }
  }
)

// 주로 아프거나 불편한 부위
watch(
  () => dataParams.SICK_YN,
  (newVal) => {
    sickReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.SICK_DT = ''
      dataParams.SICK_DESC = ''
      dataParams.SICK_RESULT = ''
    }
  }
)

// 복용 중인 약
watch(
  () => dataParams.PILL_YN,
  (newVal) => {
    pillReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.PILL_DT = ''
      dataParams.PILL_DESC = ''
      dataParams.PILL_RESULT = ''
    }
  }
)

// 심리적으로 힘든 요인
watch(
  () => dataParams.STRESS_YN,
  (newVal) => {
    stressReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.STRESS_DT = ''
      dataParams.STRESS_RESULT = ''
    }
  }
)

// 현 작업 지장 여부
watch(
  () => dataParams.PWORK_YN,
  (newVal) => {
    pworkReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.PWORK_DESC = ''
    }
  }
)

// 작업 전환
watch(
  () => dataParams.WORK_SWITCH_YN,
  (newVal) => {
    switchReadonly.value = newVal != 'Y'
    if (newVal === 'N') {
      dataParams.SWITCH_WORK = ''
      dataParams.SWITCH_DESC = ''
    }
  }
)

// BMI지수 계산
watch(
  () => [dataParams.WEIGHT, dataParams.STATURE],
  ([weight, stature]) => {
    const w = parseFloat(weight)
    const h = parseFloat(stature)

    if (!isNaN(w) && !isNaN(h) && h > 0) {
      const bmi = w / (h / 100) ** 2
      dataParams.BMI = bmi.toFixed(1) // 소수점 한 자리
    } else {
      dataParams.BMI = ''
    }
  }
)

// 조회 버튼
//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSaveData).run()
  } else if (btn.id === 'btnDownloadingAForm') {
    //운영
    let params = {
      FILE_PATH: 'HLTK',
      FILE_NAME: ' test.xlsx',
    }

    commonSampleDownFilesApi(params).catch((res) => {
      Message.err(res)
    })
    // 양식등록 팝업
    //downloadFoamUploadPopup.value.openPopup()
  } else if (btn.id === 'btnPersonalInfo') {
    if (!dataParams.EMP_NO) {
      Message.warn('건강관리위험 대상자를 선택해주세요.')
      return
    }
    // if (dataParams.SAVE_YN === 'N') {
    //   // 아직 저장되지 않은 상태 → INSERT 먼저 실행
    //   commonExecuteApi({ queryId: 'HLTKB0020_SAVE_02', list: [{ ...dataParams }] }).then(res => {
    //     onButtonsClick({id:"btnSearch"});
    //     agreeFileTitle.value = `개인정보동의서 파일첨부 - ${dataParams.KOR_NM}`;
    //     agreeFileUploadPopup.value.openPopup();

    //   });
    // } else
    if (dataParams.SAVE_YN === 'Y' && (dataParams.STD_CONFIRM_YN != 'Y' || dataParams.AFT_CONFIRM_YN != 'Y')) {
      // 이미 저장된 상태라면 그냥 팝업 열기
      agreeFileTitle.value = `개인정보동의서 파일첨부 - ${dataParams.KOR_NM}`
      agreeFileUploadPopup.value.openPopup(dataParams.FILE_ID)
    } else if (dataParams.SAVE_YN === 'Y' && dataParams.STD_CONFIRM_YN == 'Y' && dataParams.AFT_CONFIRM_YN == 'Y') {
      // 확정된 상태에서 팝업 열기
      agreeFileTitle.value = `개인정보동의서 파일첨부 - ${dataParams.KOR_NM}`
      // confirmFileUploadPopup.value.openPopup(dataParams.FILE_ID);
      agreeFileUploadPopup.value.openPopup(dataParams.FILE_ID)
    }
  } else if (btn.id === 'btnTemporaryStorage') {
    if (dataParams.STD_CONFIRM_YN == 'Y' && dataParams.STD_CONFIRM_YN == 'Y' && dataParams.AFT_CONFIRM_YN == 'Y') {
      Message.warn('이미 작성 완료 된 계획서 입니다.')
      return
    }
    new saveFlowHelper(vm, t)
      .setConfirmMessage('임시저장 하시겠습니까?')
      .setBefore(beforeSavePlanner)
      .setQuery(savePlannerData)
      .setAfter(afterSavePlannerData)
      .run()
  } else if (btn.id === 'btnCompleteSAF') {
    if (dataParams.STD_CONFIRM_YN == 'Y' && dataParams.AFT_CONFIRM_YN == 'Y') {
      Message.warn('이미 작성 완료 된 계획서 입니다.')
      return
    }
    new saveFlowHelper(vm, t)
      .setConfirmMessage('작성완료 하시겠습니까? 이후 수정이 불가능합니다.')
      .setBefore(beforeConfirmPlanner)
      .setQuery(confirmPlannerData)
      .setAfter(afterConfirmPlannerData)
      .run()
  } else if (btn.id === 'btnPrint') {
    // if (dataParams.STD_CONFIRM_YN != 'Y' && dataParams.AFT_CONFIRM_YN != 'Y') {
    //   Message.warn('작성완료된 계힉서만 출력이 가능합니다.');
    //   return;
    // }

    const tableClone1 = content1.value.cloneNode(true)
    const tableClone2 = content2.value.cloneNode(true)

    const commonTable = (table) => {
      const inputs = table.querySelectorAll('input')
      inputs.forEach((input) => {
        input.setAttribute('value', input.value) // 최신 입력값을 value 속성에 설정
      })

      // 괄호 텍스트 안에 input
      const switchFields = table.querySelectorAll('td')

      switchFields.forEach((td) => {
        const hasSwitchWork = td.innerHTML.includes('변경된 작업')
        const hasSwitchDesc = td.innerHTML.includes('변경 사유')

        if (hasSwitchWork || hasSwitchDesc) {
          let text = td.innerHTML

          // input 값 추출
          const inputs = td.querySelectorAll('input')
          inputs.forEach((input) => {
            const value = input.value?.trim() || ''
            // input 태그를 해당 값으로 치환
            text = text.replace(input.outerHTML, value)
          })

          // 줄바꿈 정리: <div>나 줄바꿈 성격 요소 제거 후, 적절한 \n 처리
          const div = document.createElement('div')
          div.innerHTML = text

          const lines = Array.from(div.childNodes)
            .map((node) => node.textContent?.trim())
            .filter(Boolean)

          td.innerHTML = lines.join('\n') // 줄바꿈은 하나만
        }
      })

      // readonly 처리된 input
      const vuetifyTextFields = table.querySelectorAll('.v-text-field')
      vuetifyTextFields.forEach((fieldWrapper) => {
        const inputElement = fieldWrapper.querySelector('input')

        if (inputElement && inputElement.value) {
          const value = inputElement.value.trim()
          const parentTd = fieldWrapper.closest('td')
          if (parentTd) {
            parentTd.innerHTML = value
          }
        }
      })

      // 2. 체크박스 포함된 '직접입력' 행 처리
      const healthTdList = table.querySelectorAll('td[colspan="8"]')
      healthTdList.forEach((td) => {
        if (td.innerHTML.includes('직접입력')) {
          const textField = td.querySelector('.v-field__input')
          if (textField) {
            td.innerHTML = textField.textContent?.trim() || ''
          }
        }
      })
      // 라디오버튼
      const radioGroups = {}
      const radios = table.querySelectorAll('input[type="radio"]')
      radios.forEach((radio) => {
        const name = radio.name
        if (!radioGroups[name]) radioGroups[name] = []

        radioGroups[name].push(radio)
      })

      Object.values(radioGroups).forEach((group) => {
        const checked = group.find((radio) => radio.checked)
        const td = group[0]?.closest('td') // 첫번째 라디오 기준으로 td 찾기

        if (td) {
          if (checked) {
            // 선택된 라디오가 있으면 해당 라벨만 표시
            const label = td.querySelector(`label[for="${checked.id}"]`)
            const labelText = label ? label.textContent.trim() : checked.value
            td.textContent = labelText
          } else {
            td.textContent = ''
          }
        }
      })

      //체크박스
      const checkBox = table.querySelectorAll('.checkbox-group')
      checkBox.forEach((group) => {
        const codeListName = group.dataset.codeList // 예: 'list2'
        const codeListData = codeList[codeListName] // 예: codeList.list2

        const checkedBoxes = group.querySelectorAll('input[type="checkbox"]:checked')
        const selectedCodes = Array.from(checkedBoxes).map((input) => input.value)

        const selectedLabels = codeListData
          .map((item) => {
            if (!selectedCodes.includes(item.COD)) return null

            // TXT가 '기타'인 경우 input 값 포함
            console.log(item.COD)
            console.log(item.TXT)
            if (selectedCodes.includes(item.COD) && item.TXT === '기타') {
              const codeListName = group.dataset.codeList

              // 같은 data-code-list 가진 input 찾기
              const inputBox = document.querySelector(`.etc-input[data-code-list="${codeListName}"]`)
              const etcValue = inputBox ? inputBox.value : ''

              return etcValue ? `${item.TXT}(${etcValue})` : item.TXT
            }

            // 기타가 아니면 TXT만 표시
            return item.TXT
          })
          .filter(Boolean) // null 제거

        const td = group.closest('td')
        if (td) td.textContent = selectedLabels.join(', ')
      })
    }

    commonTable(tableClone1)
    commonTable(tableClone2)
    // 3. 반영된 HTML 가져오기
    let htmlContent = [
      { code: tableClone1.outerHTML, name: '기초 건강상담' },
      { code: tableClone2.outerHTML, name: '사후관리 계획' },
    ]

    commonRequest2('hse/excel/HLTJB0010_PRINT01', {
      data: {
        htmlCode: htmlContent,
        fileId: searchParams.FILE_ID,
      },
    }).then(async (res) => {
      // 헤더에서 파일명 추출
      const contentDisposition = res.contentDisposition
      let fileName = `보건관리계획서(${searchParams.YEAR}년)_${dataParams.KOR_NM}.xlsx` // 기본 파일명
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = decodeURIComponent(fileNameMatch[1])
        }
      }
      // 파일 다운로드
      const blob = new Blob([res], { type: res.type })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      URL.revokeObjectURL(link.href)
      console.log(link)
      console.log(blob)
      document.body.removeChild(link)
    })
  } else if (btn.id == 'btnRiskEmpGuide') {
    pdfPopup.value.openPopupUrl('https://hises.hd.com/HiSEsFiles/Manual/UIIH2010C_2.pdf')
  }
}

// 작성완료된 건에는 임시저장,작성완료 비활성화 처리
watch(
  () => [dataParams.STD_CONFIRM_YN, dataParams.AFT_CONFIRM_YN],
  ([stdYn, aftYn]) => {
    if (stdYn === 'Y' && aftYn === 'Y') {
      nextTick(() => {
        menuTitle.value?.disableBtn('btnTemporaryStorage', true)
        menuTitle.value?.disableBtn('btnCompleteSAF', true)
      })
    } else {
      nextTick(() => {
        menuTitle.value?.disableBtn('btnTemporaryStorage', false)
        menuTitle.value?.disableBtn('btnCompleteSAF', false)
      })
    }
  },
  { immediate: true }
)
// 임시저장 하지않은 경우에는 개인정보동의서 첨부 비활성화
watch(
  () => dataParams.SAVE_YN,
  (newValue) => {
    if (newValue == 'N') {
      nextTick(() => {
        menuTitle.value?.disableBtn('btnPersonalInfo', true)
      })
    } else {
      nextTick(() => {
        menuTitle.value?.disableBtn('btnPersonalInfo', false)
      })
    }
  },
  { immediate: true }
)

const openAgencyPopup = () => {
  if (!manageParams.EMP_NM) {
    Message.warn('보건관리 담당자를 선택해주세요.')
    return
  } else if (manageParams.SAVE_YN != 'Y') {
    Message.warn('보건관리 담당자정보를 저장 후 등록하세요.')
    return
  }
  agencyFileTitle.value = '보건대행 계약서 파일첨부'
  agencyFileUploadPopup.value.openPopup(manageParams.FILE_ID)
}

const uploaded = (val) => {
  let saveParams = []

  if (val.fileId == null) return

  // DB에 파일정보 저장
  let param = {
    EMP_NO: manageParams.EMP_NO,
    FILE_ID: val.fileId,
  }
  saveParams.push(param)
  commonExecuteApi({ queryId: 'HLTKB0020_SAVE_04', list: saveParams }).then((res) => {
    onButtonsClick({ id: 'btnSearch' })
  })
}

const uploaded2 = (val) => {
  let saveParams = []

  if (val.fileId == null) return

  // DB에 파일정보 저장
  let param = {
    EMP_NO: dataParams.EMP_NO,
    YEAR: searchParams.YEAR,
    FILE_ID: val.fileId,
  }
  console.log(param)
  saveParams.push(param)
  commonExecuteApi({ queryId: 'HLTKB0020_SAVE_05', list: saveParams }).then((res) => {
    onButtonsClick({ id: 'btnSearch' })
  })
}

const agencyFilePopupClosed = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const getData = () => {
  new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).showMessage(true).run()
}

const gridRows = ref([])
const afterSearch = (res) => {
  console.log('대상자 메인그리드', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  gridRows.value = [...res.ORESULT_CUR] // 반응형 감지를 위한 복사
  let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

// 보건관리계획서 작성율 계산
watch(
  () => gridRows.value,
  (rows) => {
    if (!manageParams.EMP_NM) return

    const total = rows.length
    if (total === 0) {
      manageParams.PLANNER_PER = '0%'
      return
    }

    const confirmedCount = rows.filter((row) => row.STD_CONFIRM_YN === 'Y' && row.AFT_CONFIRM_YN === 'Y').length

    const percent = ((confirmedCount / total) * 100).toFixed(2)
    manageParams.PLANNER_PER = ''
    nextTick(() => {
      manageParams.PLANNER_PER = `${percent}%`
    })
  },
  {
    deep: true,
    immediate: true,
  }
)

//  조회 ---------------------------------------------------
const searchData = () => {
  console.log(searchParams)
  Promise.all([
    commonSearchApi({ queryId: 'HLTKB0020_SEARCH_01', param: searchParams }),
    commonSearchApi({ queryId: 'HLTKB0020_SEARCH_02', param: searchParams }),
  ]).then(([res1, res2]) => {
    afterSearch(res1)

    if (res2.ORESULT_CUR && res2.ORESULT_CUR.length > 0) {
      Object.assign(manageParams, res2.ORESULT_CUR[0])
    } else {
      // 초기화
      Object.keys(manageParams).forEach((key) => {
        manageParams[key] = ''
      })
    }
  })
}

// 담당자 저장 ---------------------------------------------------
const beforeSave = () => {
  const requiredFields = [{ key: 'EMP_NM', message: '담당자 성명은 필수 입력입니다.' }]

  // 필수 항목 체크
  for (const field of requiredFields) {
    if (isEmpty(manageParams[field.key])) {
      Message.warn(t(field.message))
      return false
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let data = { ...manageParams }
  saveParams.push(data)

  console.log(saveParams)
  return commonExecuteApi({ queryId: 'HLTKB0020_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

watch(
  () => manageParams.AGENCY,
  (newVal) => {
    const requiresContract = ['대한산업보건협회', '울산대학병원']
    if (requiresContract.includes(newVal)) {
      Message.warn(t('저장 후 계약서를 반드시 첨부해주세요.'))
    }
  }
)

// 보건관리계획서 임시저장 ---------------------------------------------------
const beforeSavePlanner = () => {
  const requiredManageParams = [{ key: 'EMP_NM', message: '담당자 정보를 먼저 저장하세요.' }]

  const requiredDataParams = [{ key: 'EMP_NO', message: '건강관리위험 대상자를 선택하세요.' }]

  const requiredManageFileParams = [{ key: 'AGENCY_FILE_DT', message: '보건대행계약서 파일을 첨부하세요.' }]

  // 필수 항목 체크 (담당자 없을때)
  for (const field of requiredManageParams) {
    if (isEmpty(manageParams[field.key])) {
      Message.warn(t(field.message))
      return false
    }
  }
  // 필수 항목 체크 (대상자 없을때)
  for (const field of requiredDataParams) {
    if (isEmpty(dataParams[field.key])) {
      Message.warn(t(field.message))
      return false
    }
  }

  // 필수 항목 체크 (대행기관이 대한산보협이거나 울대병원인경우 계약서필수)
  if (['대한산업보건협회', '울산대학병원'].includes(manageParams.AGENCY)) {
    for (const field of requiredManageFileParams) {
      console.log(manageParams[field.key])
      if (isEmpty(manageParams[field.key])) {
        Message.warn(t(field.message))
        return false
      }
    }
  }
  return true
}

const savePlannerData = () => {
  let saveParams = []
  let data = { ...dataParams }
  saveParams.push(data)

  console.log(saveParams)
  return commonExecuteApi({ queryId: 'HLTKB0020_SAVE_02', list: saveParams })
}

const afterSavePlannerData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()

  let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '개인정보관련 저장했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

// 보건관리계획서 작성완료 ---------------------------------------------------
const beforeConfirmPlanner = () => {
  const requiredManageParams = [{ key: 'EMP_NM', message: '담당자 정보를 먼저 저장하세요.' }]

  const requiredDataParams = [{ key: 'EMP_NO', message: '건강관리위험 대상자를 선택하세요.' }]

  // 필수 항목 체크 (담당자 없을때)
  for (const field of requiredManageParams) {
    if (isEmpty(manageParams[field.key])) {
      Message.warn(t(field.message))
      return false
    }
  }
  // 필수 항목 체크 (대상자 없을때)
  for (const field of requiredDataParams) {
    if (isEmpty(dataParams[field.key])) {
      Message.warn(t(field.message))
      return false
    }
  }

  // ----------------------- 설문 유효성 검사 -----------------------

  // 키
  if (isEmpty(dataParams.STATURE)) {
    Message.warn(t('키를 입력하세요.'))
    return false
  }

  // 몸무게
  if (isEmpty(dataParams.WEIGHT)) {
    Message.warn(t('몸무게를 입력하세요.'))
    return false
  }

  // 흡연
  const smokeYn = dataParams.SMOKE_YN
  if (smokeYn === 'Y') {
    if (isEmpty(dataParams.SMOKE_FRE) || isEmpty(dataParams.SMOKE_AMT)) {
      Message.warn(t('흡연자일 경우 흡연빈도와 흡연량을 입력하세요.'))
      return false
    }
  } else if (smokeYn === null || smokeYn === '') {
    Message.warn(t('흡연 여부를 선택하세요.'))
    return false
  }

  // 음주
  const drunkYn = dataParams.DRUNK_YN
  if (drunkYn === 'Y') {
    if (isEmpty(dataParams.DRUNK_FRE) || isEmpty(dataParams.DRUNK_AMT) || isEmpty(dataParams.DRUNK_TYPE)) {
      Message.warn(t('음주자일 경우 음주 빈도, 양, 종류를 모두 입력하세요.'))
      return false
    }
  } else if (drunkYn === null || drunkYn === '') {
    Message.warn(t('음주 여부를 선택하세요.'))
    return false
  }

  // 운동
  const exrcYn = dataParams.EXRC_YN
  if (exrcYn === 'Y') {
    if (isEmpty(dataParams.EXRC_FRE) || isEmpty(dataParams.EXRC_AMT)) {
      Message.warn(t('운동을 하실경우 운동빈도와 운동량을 입력하세요.'))
      return false
    }
  } else if (exrcYn === null || exrcYn === '') {
    Message.warn(t('운동 여부를 선택하세요.'))
    return false
  }

  // 식사
  if (isEmpty(dataParams.MEAL_FRE) || isEmpty(dataParams.MEAL_AMT)) {
    Message.warn(t('식사빈도와 식사시간을 입력하세요.'))
    return false
  }

  // 수면
  if (isEmpty(dataParams.SLEEP_AMT)) {
    Message.warn(t('하루 수면 시간을 입력하세요.'))
    return false
  }

  // 가족력
  const familyYn = dataParams.FAMILY_YN
  if (familyYn === 'Y') {
    if (isEmpty(dataParams.FAMILY_REL) || isEmpty(dataParams.FAMILY_NM) || isEmpty(dataParams.FAMILY_OCC)) {
      Message.warn(t('가족력이 있을경우 가족관계, 질환명, 발생시점을 모두 입력하세요.'))
      return false
    }
  } else if (familyYn === null || familyYn === '') {
    Message.warn(t('가족력 여부를 선택하세요.'))
    return false
  }

  // 특이질환
  const aleYn = dataParams.ALE_YN
  if (aleYn === 'Y') {
    if (isEmpty(dataParams.ALE_NM) || isEmpty(dataParams.ALE_OCC)) {
      Message.warn(t('알레르기 및 특이질환이 있을 경우 질환명, 발생시점을 모두 입력하세요.'))
      return false
    }
  } else if (aleYn === null || aleYn === '') {
    Message.warn(t('알레르기 및 특이질환 여부를 선택하세요.'))
    return false
  }

  // 과거질환
  const pastYn = dataParams.PAST_YN
  if (pastYn === 'Y') {
    if (isEmpty(dataParams.PAST_DT) || isEmpty(dataParams.PAST_NM) || isEmpty(dataParams.PAST_RESULT)) {
      Message.warn(t('과거에 질환이 있었다면 발생시점, 질환명, 경과를 모두 입력하세요.'))
      return false
    }
  } else if (pastYn === null || pastYn === '') {
    Message.warn(t('과거질환 여부를 선택하세요.'))
    return false
  }

  // 수술력
  const surgYn = dataParams.SURG_YN
  if (surgYn === 'Y') {
    if (isEmpty(dataParams.SURG_DT) || isEmpty(dataParams.SURG_NM) || isEmpty(dataParams.SURG_RESULT)) {
      Message.warn(t('수술력이 있다면 발생시점, 수술명, 경과를 모두 입력하세요.'))
      return false
    }
  } else if (surgYn === null || surgYn === '') {
    Message.warn(t('수술력 여부를 선택하세요.'))
    return false
  }

  // 기저질환
  const underYn = dataParams.UNDER_YN
  if (underYn === 'Y') {
    if (isEmpty(dataParams.UNDER_DT) || isEmpty(dataParams.UNDER_DESC) || isEmpty(dataParams.UNDER_RESULT)) {
      Message.warn(t('기저질환이 있다면 발생시점, 내용, 경과를 모두 입력하세요.'))
      return false
    }
  } else if (underYn === null || underYn === '') {
    Message.warn(t('기저질환 여부를 선택하세요.'))
    return false
  }

  // 아프거나 불편한 부위
  const sickYn = dataParams.SICK_YN
  if (sickYn === 'Y') {
    if (isEmpty(dataParams.SICK_DT) || isEmpty(dataParams.SICK_DESC) || isEmpty(dataParams.SICK_RESULT)) {
      Message.warn(t('아프거나 불편한 부위가 있다면 발생시점, 내용, 경과를 모두 입력하세요.'))
      return false
    }
  } else if (sickYn === null || sickYn === '') {
    Message.warn(t('아프거나 불편한 부위 여부를 선택하세요.'))
    return false
  }

  // 복용중인 약
  const pillYn = dataParams.PILL_YN
  if (pillYn === 'Y') {
    if (isEmpty(dataParams.PILL_DT) || isEmpty(dataParams.PILL_DESC) || isEmpty(dataParams.PILL_RESULT)) {
      Message.warn(t('복용중인 약이 있다면 복용시점, 내용, 경과를 모두 입력하세요.'))
      return false
    }
  } else if (pillYn === null || pillYn === '') {
    Message.warn(t('복용중인 약 여부를 선택하세요.'))
    return false
  }

  // 스트레스
  const stressYn = dataParams.STRESS_YN
  if (stressYn === 'Y') {
    if (isEmpty(dataParams.STRESS_DT) || isEmpty(dataParams.STRESS_RESULT)) {
      Message.warn(t('심리적으로 힘든 요인이 있다면 발생시점, 경과를 모두 입력하세요.'))
      return false
    }
  } else if (stressYn === null || stressYn === '') {
    Message.warn(t('심리적으로 힘든 요인 여부를 선택하세요.'))
    return false
  }

  // 현 작업 지장 여부
  const pworkYn = dataParams.PWORK_YN
  if (pworkYn === 'Y') {
    if (isEmpty(dataParams.PWORK_DESC)) {
      Message.warn(t('현 작업 지장 여부가 있다면 내용을 입력하세요.'))
      return false
    }
  } else if (pworkYn === null || pworkYn === '') {
    Message.warn(t('현 작업 지장 여부를 선택하세요.'))
    return false
  }

  // 작업전환
  const workswitchYn = dataParams.WORK_SWITCH_YN
  if (workswitchYn === 'Y') {
    if (isEmpty(dataParams.SWITCH_WORK) || isEmpty(dataParams.SWITCH_DESC)) {
      Message.warn(t('작업전환 여부가 있다면 변경된 작업, 변경사유를 모두 입력하세요.'))
      return false
    }
  } else if (workswitchYn === null || workswitchYn === '') {
    Message.warn(t('작업전환 여부를 선택하세요.'))
    return false
  }

  // 작업시간 조정
  if (isEmpty(dataParams.WORK_TIME)) {
    Message.warn(t('작업시간 조정 항목을 선택하세요.'))
    return false
  }

  // 작업관리 강화
  if (isEmpty(dataParams.WORK_MNG)) {
    Message.warn(t('작업관리 강화 항목을 선택하세요.'))
    return false
  }

  // 의학적조치 (치료)
  if (isEmpty(dataParams.MEDI_TRM)) {
    Message.warn(t('의학적조치 (치료) 항목을 선택하세요.'))
    return false
  }

  // 의학적조치 (주기)
  if (isEmpty(dataParams.MEDI_CYCLE)) {
    Message.warn(t('의학적조치 (주기) 항목을 선택하세요.'))
    return false
  }

  // 건강증진활동
  if (isEmpty(dataParams.HEALTH_CARE)) {
    Message.warn(t('건강증진활동 항목을 선택하세요.'))
    return false
  }

  // 보호구 지급
  if (isEmpty(dataParams.PROTECT)) {
    Message.warn(t('보호구 지급 항목을 선택하세요.'))
    return false
  }

  // 개인정보동의서 파일첨부
  // if (
  //     isEmpty(dataParams.FILE_ID) || (dataParams.FILE_YN === 0)
  //   ) {
  //     Message.warn(t('개인정보동의서 파일을 첨부해주세요.'));
  //     return false;
  // }

  return true
}

const confirmPlannerData = () => {
  let saveParams = []
  let data = { ...dataParams }
  saveParams.push(data)

  console.log(saveParams)
  return commonExecuteApi({ queryId: 'HLTKB0020_SAVE_03', list: saveParams })
}

const afterConfirmPlannerData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()

  let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '개인정보관련 저장했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

// 숫자입력 조건 체크
const checkInputNumberLength = (e, key) => {
  let inputValue = e.target.value
  let maxLength = e.target.getAttribute('maxlength')
  let minValue = e.target.getAttribute('min')

  // 최대자리 체크
  if (inputValue.length > maxLength) {
    e.target.value = inputValue.slice(0, maxLength)
  }

  // 최솟값 체크
  if (inputValue < minValue) {
    e.target.value = minValue
  }

  // model 객체도 변경해야 정상 작동
  dataParams[key] = e.target.value
}
//작업 관리 강화
const onWorkMngUpdate = (next) => {
  const arr = (next ?? []).filter((v) => v != null).map(String)

  let fixed
  if (arr.length >= 2 && arr[0] === 'G') {
    fixed = [arr[arr.length - 1]]
  } else if (arr.length >= 2 && arr[arr.length - 1] === 'G') {
    fixed = ['G']
  } else {
    fixed = arr
  }
  workMngModel.value = fixed
  dataParams.WORK_MNG = fixed.join(',')
}

//보호구 지급
const onProtectUpdate = (next) => {
  const arr = (next ?? []).filter((v) => v != null).map(String)

  let fixed
  if (arr.length >= 2 && arr[0] === 'K') {
    fixed = [arr[arr.length - 1]]
  } else if (arr.length >= 2 && arr[arr.length - 1] === 'K') {
    fixed = ['K']
  } else {
    fixed = arr
  }
  protectModel.value = fixed
  dataParams.PROTECT = fixed.join(',')
}

//건강증진 활동
const onHealthCareUpdate = (next) => {
  const arr = (next ?? []).filter((v) => v != null).map(String)

  let fixed
  if (arr.length >= 2 && arr[0] === 'G') {
    fixed = [arr[arr.length - 1]]
  } else if (arr.length >= 2 && arr[arr.length - 1] === 'G') {
    fixed = ['G']
  } else {
    fixed = arr
  }
  healthCareModel.value = fixed
  dataParams.HEALTH_CARE = fixed.join(',')
}
//의학적 조치
const onMediTrmUpdate = (next) => {
  const arr = (next ?? []).filter((v) => v != null).map(String)

  let fixed
  if (arr.length >= 2 && arr[0] === 'H') {
    fixed = [arr[arr.length - 1]]
  } else if (arr.length >= 2 && arr[arr.length - 1] === 'H') {
    fixed = ['H']
  } else {
    fixed = arr
  }
  mediTrmModel.value = fixed
  dataParams.MEDI_TRM = fixed.join(',')
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.YEAR"
            :label="$t('해당년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT"
            width="200px"
          />

          <i-input
            v-model="searchParams.VEND_NAME"
            label-width="30px"
            :label="$t('소속')"
            width="180px"
            :readonly="true"
          />
          <i-input
            v-model="searchParams.VEND_CD"
            width="150px"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openVendPopup"
            @keydown.enter="openVendPopup"
            :readonly="true"
          >
          </i-input>

          <div v-if="Number(searchParams.YEAR) < '2025'">
            <i-select
              v-model="searchParams.REQ_CHA"
              :label="$t('주기')"
              label-width="30px"
              :items="codeList.REQ_CHA"
              item-value="COD"
              item-title="TXT"
              width="200px"
            />
          </div>
          <div v-if="Number(searchParams.YEAR) == '2024' && searchParams.REQ_CHA == '07'">
            <v-btn color="primary" variant="outlined" class="mt-1" @click="openDetailInfo"> 상세정보 보기 </v-btn>
          </div>
        </v-sheet>
        <div class="d-flex">
          <v-sheet width="35%">
            <IMenuTitle
              ref="menuTitle"
              :title="$t('보건관리 기본정보')"
              :button-list="['btnUpdate']"
              @click-button="onButtonsClick"
              :hiddenManuel="true"
            >
              <div style="color: orange">{{ $t('※ 반드시 보건관리 기본정보를 저장 후 설문지를 작성해주세요.') }}</div>
            </IMenuTitle>
            <v-sheet class="searchArea d-flex">
              <table style="width: 100%; border-collapse: collapse; table-layout: fixed">
                <!-- 첫 번째 행: 3칸 -->
                <tr>
                  <td style="border: 1px solid #ccc; padding: 8px; width: 33.33%">
                    <div class="d-flex align-center">
                      <div style="width: 45%">담당자 성명</div>
                      <v-text-field
                        v-model="manageParams.EMP_NM"
                        density="compact"
                        hide-details
                        variant="outlined"
                        style="width: 70%"
                        append-inner-icon="mdi-magnify"
                        @click:appendInner="openEmpPopup"
                        @keydown.enter="openEmpPopup"
                        readonly
                        class="emp-readonly-field"
                      />
                    </div>
                  </td>
                  <td style="border: 1px solid #ccc; padding: 8px; width: 30%">
                    <div class="d-flex align-center">
                      <div style="width: 25%">직위</div>
                      <v-text-field
                        v-model="manageParams.POSITION_NM"
                        density="compact"
                        hide-details
                        variant="outlined"
                        readonly
                        style="width: 70%"
                      />
                    </div>
                  </td>
                  <td style="border: 1px solid #ccc; padding: 8px; width: 36.66%">
                    <div class="d-flex align-center">
                      <div style="width: 30%">연락처</div>
                      <v-text-field
                        v-model="manageParams.TEL_NO"
                        density="compact"
                        hide-details
                        variant="outlined"
                        readonly
                        style="width: 70%"
                      />
                    </div>
                  </td>
                </tr>

                <!-- 두번째 행: 2칸 -->
                <tr>
                  <td colspan="3" style="border: 1px solid #ccc; padding: 0">
                    <div style="display: flex">
                      <!-- 왼쪽 영역 -->
                      <div style="width: 50%; border-right: 1px solid #ccc; padding: 8px">
                        <div class="d-flex align-center">
                          <div style="width: 40%">보건관리 대행기관</div>
                          <i-select
                            v-model="manageParams.AGENCY"
                            :items="codeList.AGENCYLIST"
                            item-value="COD"
                            item-title="TXT"
                            width="160px"
                          />
                        </div>
                      </div>

                      <!-- 오른쪽 영역 -->
                      <div style="width: 50%; padding: 8px">
                        <div class="d-flex align-center">
                          <div style="width: 40%">보건대행계약서 첨부</div>
                          <v-text-field
                            v-model="manageParams.AGENCY_FILE_DT"
                            density="compact"
                            hide-details
                            readonly
                            variant="outlined"
                            style="width: 60%"
                            append-inner-icon="mdi-magnify"
                            @click:append-inner="openAgencyPopup"
                            class="emp-readonly-field"
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- 세번째 행: 2칸 -->
                <tr>
                  <td colspan="3" style="border: 1px solid #ccc; padding: 0px">
                    <div style="display: flex">
                      <div style="width: 50%; border-right: 1px solid #ccc; padding: 8px">
                        <div class="d-flex align-center">
                          <div style="width: 50%">보건관리계획서 작성율</div>
                          <v-text-field
                            v-model="manageParams.PLANNER_PER"
                            density="compact"
                            hide-details
                            variant="outlined"
                            readonly
                            style="width: 45%"
                          />
                        </div>
                      </div>

                      <div style="width: 50%; padding: 8px">
                        <div class="d-flex align-center">
                          <div style="width: 50%">상태</div>
                          <v-text-field
                            v-model="manageParams.SCMS"
                            density="compact"
                            hide-details
                            variant="outlined"
                            readonly
                            style="width: 45%"
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </v-sheet>
            <!-- 보건관리 기본정보 -->
            <v-sheet class="pa-0">
              <IGridTitle :title="$t('건강관리위험 대상자')" />
              <div class="content-area-grid">
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grd1Props.gridViewOption"
                  :keys="grd1Props.keys"
                  :fields="grd1Props.fields"
                  :columns="grd1Props.columns"
                  @onCurrentRowChanged="rowChanged"
                  class="custom-grid"
                />
              </div>
            </v-sheet>
          </v-sheet>
          <!-- 그리드 및 설문 -->
          <v-sheet width="65%" class="pl-3">
            <v-sheet class="pa-0 h-auto">
              <v-row align="center" justify="space-between" class="mb-2">
                <v-tabs v-model="tab">
                  <v-tab>기초 건강상담</v-tab>
                  <v-tab>사후관리 계획</v-tab>
                </v-tabs>

                <!-- 오른쪽 정렬 버튼 -->
                <div>
                  <IGridTitle
                    ref="menuTitle"
                    :button-list="[
                      'btnRiskEmpGuide',
                      'btnDownloadingAForm',
                      'btnPersonalInfo',
                      'btnTemporaryStorage',
                      'btnCompleteSAF',
                      'btnPrint',
                    ]"
                    @click-button="onButtonsClick"
                    :use-permission="false"
                  />
                  <span style="color: red; font-size: 18px; font-weight: bold; display: flex; justify-content: end"
                    >※개인정보동의서는 개인별 최초 1회 반드시 첨부 요망</span
                  >
                </div>
              </v-row>

              <v-window v-model="tab">
                <v-window-item eager>
                  <div class="pa-4 content-area-foam">
                    <fieldset :disabled="isReadOnly">
                      <table
                        ref="content1"
                        border="1"
                        cellspacing="0"
                        cellpadding="5"
                        style="border-collapse: collapse; width: 100%; text-align: center"
                      >
                        <thead>
                          <tr style="background-color: #f4f5f9" class="trHeight1">
                            <th>협력사명</th>
                            <th colspan="2">
                              <input type="text" v-model="dataParams.VEND_NM" readonly />
                            </th>
                            <th>일자</th>
                            <th colspan="2">
                              <input type="text" v-model="displayDate" readonly />
                            </th>
                            <th>시간</th>
                            <th colspan="1">
                              <input type="text" v-model="displayTime" readonly />
                            </th>
                          </tr>
                          <tr style="background-color: #d9d9d9">
                            <td colspan="8">인적사항</td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">성 명</td>
                            <td colspan="2">
                              <input type="text" v-model="dataParams.KOR_NM" readonly />
                            </td>
                            <td class="title2">사번</td>
                            <td colspan="2">
                              <input type="text" v-model="dataParams.EMP_NO" readonly />
                            </td>
                            <td class="title2">현재 직무</td>
                            <td colspan="1">
                              <input type="text" v-model="dataParams.PRE_JOB" />
                            </td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr class="trHeight1">
                            <td class="title2">생년월일(나이)</td>
                            <td colspan="2">
                              <input type="text" v-model="dataParams.BIRTH_DAY" readonly />
                            </td>
                            <td class="title2">성 별</td>
                            <td colspan="2">
                              <v-radio-group inline v-model="dataParams.SEX" class="ml-3">
                                <v-radio label="남" value="M"></v-radio>
                                <v-radio label="여" value="F"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>입사일</td>
                            <td colspan="1">
                              <input type="date" v-model="dataParams.JOIN_DT" />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">키</td>
                            <td colspan="2">
                              <input type="number" v-model="dataParams.STATURE" />
                            </td>
                            <td class="title2">몸무게</td>
                            <td colspan="2">
                              <input type="number" v-model="dataParams.WEIGHT" />
                            </td>
                            <td class="title2">BMI</td>
                            <td colspan="1">
                              <!-- bmi자동계산 -->
                              <input type="text" v-model="dataParams.BMI" readonly />
                            </td>
                          </tr>
                          <tr style="background-color: #d9d9d9">
                            <td colspan="8">상담 내용</td>
                          </tr>
                          <tr style="background-color: #f4f5f9" class="trHeight1">
                            <td style="background-color: #d9d9d9">생활 습관</td>
                            <td>여부</td>
                            <td>빈도</td>
                            <td>양</td>
                            <td>종류</td>
                            <td colspan="3">비고</td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">흡연</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.SMOKE_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>
                              (
                              <input
                                type="number"
                                v-model="dataParams.SMOKE_FRE"
                                min="0"
                                maxlength="2"
                                style="width: 30px"
                                :readonly="smokeReadonly"
                                @input="checkInputNumberLength($event, 'SMOKE_FRE')"
                              />
                              )회/일
                            </td>
                            <td>
                              (
                              <input
                                type="number"
                                v-model="dataParams.SMOKE_AMT"
                                min="0"
                                maxlength="2"
                                style="width: 30px"
                                :readonly="smokeReadonly"
                                @input="checkInputNumberLength($event, 'SMOKE_AMT')"
                              />
                              )개피/일
                            </td>
                            <td>-</td>
                            <td colspan="3">
                              <v-text-field
                                v-model="dataParams.SMOKE_DESC"
                                dense
                                outlined
                                width="100%"
                                :readonly="smokeReadonly"
                              />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">음주</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.DRUNK_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>
                              (
                              <input
                                type="number"
                                v-model="dataParams.DRUNK_FRE"
                                min="0"
                                maxlength="2"
                                style="width: 30px"
                                :readonly="drunkReadonly"
                                @input="checkInputNumberLength($event, 'DRUNK_FRE')"
                              />
                              )회/주
                            </td>
                            <td>
                              (
                              <input
                                type="number"
                                v-model="dataParams.DRUNK_AMT"
                                min="0"
                                maxlength="2"
                                style="width: 30px"
                                :readonly="drunkReadonly"
                                @input="checkInputNumberLength($event, 'DRUNK_AMT')"
                              />
                              )잔/회
                            </td>
                            <td>
                              <v-radio-group
                                inline
                                v-model="dataParams.DRUNK_TYPE"
                                class="d-flex justify-center"
                                :readonly="drunkReadonly"
                              >
                                <v-radio label="소주" value="A"></v-radio>
                                <v-radio label="맥주" value="B"></v-radio>
                                <v-radio label="기타" value="C"></v-radio>
                              </v-radio-group>
                            </td>
                            <td colspan="3">
                              <v-text-field
                                v-model="dataParams.DRUNK_DESC"
                                dense
                                outlined
                                width="100%"
                                :readonly="drunkReadonly"
                              />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">운동</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.EXRC_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>
                              (
                              <input
                                type="number"
                                v-model="dataParams.EXRC_FRE"
                                min="0"
                                maxlength="2"
                                style="width: 30px"
                                :readonly="exrcReadonly"
                                @input="checkInputNumberLength($event, 'EXRC_FRE')"
                              />
                              )회/주
                            </td>
                            <td>
                              (
                              <input
                                type="number"
                                v-model="dataParams.EXRC_AMT"
                                min="0"
                                maxlength="2"
                                style="width: 30px"
                                :readonly="exrcReadonly"
                                @input="checkInputNumberLength($event, 'EXRC_AMT')"
                              />
                              )분/회
                            </td>
                            <td>
                              <v-text-field
                                v-model="dataParams.EXRC_TYPE"
                                dense
                                outlined
                                width="100%"
                                :readonly="exrcReadonly"
                              />
                            </td>
                            <td colspan="3">
                              <v-text-field
                                v-model="dataParams.EXRC_DESC"
                                dense
                                outlined
                                width="100%"
                                :readonly="exrcReadonly"
                              />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">식사</td>
                            <td>-</td>
                            <td>
                              (
                              <input
                                type="number"
                                v-model="dataParams.MEAL_FRE"
                                min="0"
                                maxlength="2"
                                style="width: 30px"
                                @input="checkInputNumberLength($event, 'MEAL_FRE')"
                              />
                              )회/일
                            </td>
                            <td class="title2">식사 시간</td>
                            <td>
                              (
                              <input
                                type="number"
                                v-model="dataParams.MEAL_AMT"
                                min="0"
                                maxlength="2"
                                style="width: 30px"
                                @input="checkInputNumberLength($event, 'MEAL_AMT')"
                              />
                              )분/회
                            </td>
                            <td colspan="3">
                              <v-text-field v-model="dataParams.MEAL_DESC" dense outlined width="100%" />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">수면</td>
                            <td>-</td>
                            <td>-</td>
                            <td class="title2">하루 수면 시간</td>
                            <td>
                              (
                              <input
                                type="number"
                                v-model="dataParams.SLEEP_AMT"
                                min="0"
                                maxlength="2"
                                style="width: 30px"
                                @input="checkInputNumberLength($event, 'SLEEP_AMT')"
                              />
                              )시간/일
                            </td>
                            <td colspan="3">
                              <v-text-field v-model="dataParams.SLEEP_DESC" dense outlined width="100%" />
                            </td>
                          </tr>
                          <tr style="background-color: #f4f5f9" class="trHeight1">
                            <td style="background-color: #d9d9d9">가족력 및 특이질환</td>
                            <td>유무</td>
                            <td>관계</td>
                            <td>질환명</td>
                            <td>발생시점</td>
                            <td colspan="3">비고</td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">가족력<br />(고혈압, 당뇨, 뇌심혈관 질환, 기타)</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.FAMILY_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>
                              <v-text-field
                                v-model="dataParams.FAMILY_REL"
                                dense
                                outlined
                                width="100%"
                                :readonly="familyReadonly"
                              />
                            </td>
                            <td>
                              <v-text-field
                                v-model="dataParams.FAMILY_NM"
                                dense
                                outlined
                                width="100%"
                                :readonly="familyReadonly"
                              />
                            </td>
                            <td>
                              <v-text-field
                                v-model="dataParams.FAMILY_OCC"
                                dense
                                outlined
                                width="100%"
                                :readonly="familyReadonly"
                              />
                            </td>
                            <td colspan="3">
                              <v-text-field
                                v-model="dataParams.FAMILY_DESC"
                                dense
                                outlined
                                width="100%"
                                :readonly="familyReadonly"
                              />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">알레르기 및 특이 질환</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.ALE_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>-</td>
                            <td>
                              <v-text-field
                                v-model="dataParams.ALE_NM"
                                dense
                                outlined
                                width="100%"
                                :readonly="aleReadonly"
                              />
                            </td>
                            <td>
                              <v-text-field
                                v-model="dataParams.ALE_OCC"
                                dense
                                outlined
                                width="100%"
                                :readonly="aleReadonly"
                              />
                            </td>
                            <td colspan="3">
                              <v-text-field
                                v-model="dataParams.ALE_DESC"
                                dense
                                outlined
                                width="100%"
                                :readonly="aleReadonly"
                              />
                            </td>
                          </tr>
                          <tr style="background-color: #f4f5f9" class="trHeight1">
                            <td style="background-color: #d9d9d9">과거</td>
                            <td>유무</td>
                            <td>발생시점</td>
                            <td>질환/수술명</td>
                            <td colspan="4">경과</td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">과거 질환</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.PAST_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>
                              <input v-if="!pastReadonly" type="date" v-model="dataParams.PAST_DT" />
                              <input v-else type="date" v-model="dataParams.PAST_DT" readonly />
                            </td>
                            <td>
                              <v-text-field
                                v-model="dataParams.PAST_NM"
                                dense
                                outlined
                                width="100%"
                                :readonly="pastReadonly"
                              />
                            </td>
                            <td colspan="4">
                              <v-text-field
                                v-model="dataParams.PAST_RESULT"
                                dense
                                outlined
                                width="100%"
                                :readonly="pastReadonly"
                              />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">수술력</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.SURG_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>
                              <input v-if="!surgReadonly" type="date" v-model="dataParams.SURG_DT" />
                              <input v-else type="date" v-model="dataParams.SURG_DT" readonly />
                            </td>
                            <td>
                              <v-text-field
                                v-model="dataParams.SURG_NM"
                                dense
                                outlined
                                width="100%"
                                :readonly="surgReadonly"
                              />
                            </td>
                            <td colspan="4">
                              <v-text-field
                                v-model="dataParams.SURG_RESULT"
                                dense
                                outlined
                                width="100%"
                                :readonly="surgReadonly"
                              />
                            </td>
                          </tr>
                          <tr style="background-color: #f4f5f9" class="trHeight1">
                            <td style="background-color: #d9d9d9">현재</td>
                            <td>유무</td>
                            <td>발생시점</td>
                            <td>내용</td>
                            <td colspan="4">경과</td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">기저 질환<br />(고혈압, 당뇨, 뇌심혈관 질환, 기타)</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.UNDER_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>
                              <input v-if="!underReadonly" type="date" v-model="dataParams.UNDER_DT" />
                              <input v-else type="date" v-model="dataParams.UNDER_DT" readonly />
                            </td>
                            <td>
                              <v-text-field
                                v-model="dataParams.UNDER_DESC"
                                dense
                                outlined
                                width="100%"
                                :readonly="underReadonly"
                              />
                            </td>
                            <td colspan="4">
                              <v-text-field
                                v-model="dataParams.UNDER_RESULT"
                                dense
                                outlined
                                width="100%"
                                :readonly="underReadonly"
                              />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">주로 아프거나 불편한 부위</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.SICK_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>
                              <input v-if="!sickReadonly" type="date" v-model="dataParams.SICK_DT" />
                              <input v-else type="date" v-model="dataParams.SICK_DT" readonly />
                            </td>
                            <td>
                              <v-text-field
                                v-model="dataParams.SICK_DESC"
                                dense
                                outlined
                                width="100%"
                                :readonly="sickReadonly"
                              />
                            </td>
                            <td colspan="4">
                              <v-text-field
                                v-model="dataParams.SICK_RESULT"
                                dense
                                outlined
                                width="100%"
                                :readonly="sickReadonly"
                              />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">복용 중인 약</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.PILL_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>
                              <input v-if="!pillReadonly" type="date" v-model="dataParams.PILL_DT" />
                              <input v-else type="date" v-model="dataParams.PILL_DT" readonly />
                            </td>
                            <td>
                              <v-text-field
                                v-model="dataParams.PILL_DESC"
                                dense
                                outlined
                                width="100%"
                                :readonly="pillReadonly"
                              />
                            </td>
                            <td colspan="4">
                              <v-text-field
                                v-model="dataParams.PILL_RESULT"
                                dense
                                outlined
                                width="100%"
                                :readonly="pillReadonly"
                              />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td class="title2">심리적으로 힘든 요인(스트레스)</td>
                            <td>
                              <v-radio-group inline v-model="dataParams.STRESS_YN" class="d-flex justify-center">
                                <v-radio label="예" value="Y"></v-radio>
                                <v-radio label="아니오" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                            <td>
                              <input v-if="!stressReadonly" type="date" v-model="dataParams.STRESS_DT" />
                              <input v-else type="date" v-model="dataParams.STRESS_DT" readonly />
                            </td>
                            <td colspan="5">
                              <v-text-field
                                v-model="dataParams.STRESS_RESULT"
                                dense
                                outlined
                                width="100%"
                                :readonly="stressReadonly"
                              />
                            </td>
                          </tr>
                          <tr class="trHeight1">
                            <td style="background-color: #d9d9d9">현 작업 지장 여부<br />(본인 주관적 판단)</td>
                            <td colspan="7">
                              <div>
                                <v-radio-group
                                  inline
                                  v-model="dataParams.PWORK_YN"
                                  class="d-flex justify-left"
                                  style="padding-left: 18px"
                                >
                                  <v-radio label="예" value="Y"></v-radio>
                                  <v-radio label="아니오" value="N"></v-radio>
                                </v-radio-group>
                              </div>
                              <div>
                                <v-text-field
                                  v-model="dataParams.PWORK_DESC"
                                  dense
                                  outlined
                                  label="직접 입력"
                                  :readonly="pworkReadonly"
                                  width="100%"
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </fieldset>
                  </div>
                </v-window-item>
                <v-window-item eager>
                  <div class="pa-4 content-area-foam">
                    <fieldset :disabled="isReadOnly">
                      <table
                        ref="content2"
                        border="1"
                        cellspacing="0"
                        cellpadding="5"
                        style="border-collapse: collapse; width: 100%; height: 100%; text-align: center"
                      >
                        <!-- <thead>

                        </thead> -->
                        <tbody>
                          <tr style="background-color: #f4f5f9" class="trHeight2">
                            <th>협력사명</th>
                            <th colspan="2">
                              <input type="text" v-model="dataParams.VEND_NM" readonly />
                            </th>
                            <th>일자</th>
                            <th colspan="2">
                              <input type="text" v-model="displayDate" readonly />
                            </th>
                            <th>시간</th>
                            <th colspan="1">
                              <input type="text" v-model="displayTime" readonly />
                            </th>
                          </tr>
                          <tr style="background-color: #d9d9d9">
                            <td colspan="8">인적사항</td>
                          </tr>
                          <tr class="trHeight2">
                            <td class="title2">성 명</td>
                            <td colspan="2">
                              <input type="text" v-model="dataParams.KOR_NM" readonly />
                            </td>
                            <td class="title2">사번</td>
                            <td colspan="2">
                              <input type="text" v-model="dataParams.EMP_NO" readonly />
                            </td>
                            <td class="title2">현재 직무</td>
                            <td colspan="1">
                              <input type="text" v-model="dataParams.PRE_JOB" />
                            </td>
                          </tr>
                          <tr class="trHeight2">
                            <td class="title2">생년월일(나이)</td>
                            <td colspan="2">
                              <input type="text" v-model="dataParams.BIRTH_DAY" readonly />
                            </td>
                            <td class="title2">성 별</td>
                            <td colspan="2">
                              <v-radio-group inline v-model="dataParams.SEX" class="ml-3">
                                <v-radio label="남" value="M"></v-radio>
                                <v-radio label="여" value="F"></v-radio>
                              </v-radio-group>
                            </td>
                            <td class="title2">입사일</td>
                            <td colspan="1">
                              <input type="date" v-model="dataParams.JOIN_DT" />
                            </td>
                          </tr>
                          <tr class="trHeight2">
                            <td class="title2">키</td>
                            <td colspan="2">
                              <input type="number" v-model="dataParams.STATURE" />
                            </td>
                            <td class="title2">몸무게</td>
                            <td colspan="2">
                              <input type="number" v-model="dataParams.WEIGHT" />
                            </td>
                            <td class="title2">BMI</td>
                            <td colspan="1">
                              <!-- bmi자동계산 -->
                              <input type="text" v-model="dataParams.BMI" readonly />
                            </td>
                          </tr>
                          <tr style="background-color: #d9d9d9">
                            <td colspan="8">건강관리 항목</td>
                          </tr>
                          <td colspan="8">
                            <div style="display: flex; gap: 12px; padding-left: 10px; align-items: center">
                              <v-checkbox
                                v-model="unfitDirectInput"
                                label="직접입력"
                                :true-value="true"
                                :false-value="false"
                                hide-details
                                density="compact"
                              />
                              <v-text-field
                                v-model="dataParams.UNFIT_RES_NAME"
                                :readonly="!unfitDirectInput"
                                dense
                                outlined
                                style="flex: 1"
                              />
                            </div>
                          </td>
                          <tr style="background-color: #d9d9d9">
                            <td colspan="8">사후관리 계획</td>
                          </tr>

                          <tr class="trHeight2">
                            <td rowspan="2" class="title2">작업 전환</td>
                            <td colspan="7">
                              <v-radio-group
                                inline
                                v-model="dataParams.WORK_SWITCH_YN"
                                class="d-flex justify-left"
                                style="padding-left: 10px"
                              >
                                <v-radio label="있음" value="Y"></v-radio>
                                <v-radio label="없음" value="N"></v-radio>
                              </v-radio-group>
                            </td>
                          </tr>
                          <tr class="trHeight2">
                            <td colspan="7">
                              <div style="text-align: left; padding-left: 10px">
                                변경된 작업: (
                                <input
                                  type="text"
                                  class="long-input switch-field"
                                  v-model="dataParams.SWITCH_WORK"
                                  :readonly="switchReadonly"
                                />
                                )
                              </div>
                              <div style="text-align: left; padding-left: 10px">
                                변경 사유: (
                                <input
                                  type="text"
                                  class="long-input switch-field"
                                  v-model="dataParams.SWITCH_DESC"
                                  :readonly="switchReadonly"
                                />
                                )
                              </div>
                            </td>
                          </tr>
                          <tr class="trHeight2">
                            <td class="title2">작업 시간 조정</td>
                            <td colspan="7">
                              <div class="checkbox-group" data-code-list="list1">
                                <v-checkbox
                                  v-for="(item, idx) in codeList.list1"
                                  :key="idx"
                                  v-model="workTimeModel"
                                  :label="item.TXT"
                                  :value="item.COD"
                                  :true-value="item.COD"
                                  :false-value="null"
                                  hide-details
                                  density="compact"
                                />
                              </div>
                              <div
                                v-if="dataParams.WORK_TIME === 'E'"
                                class="d-flex items-center gap-1"
                                style="padding-left: 10px"
                              >
                                <span>기타입력: (</span>
                                <input
                                  type="text"
                                  v-model="dataParams.TIME_ETC"
                                  style="width: 300px"
                                  class="etc-input"
                                  data-code-list="list1"
                                />
                                <span>)</span>
                              </div>
                            </td>
                          </tr>
                          <tr class="trHeight2">
                            <td class="title2">작업 관리 강화<br /><span style="color: red">(고령자 필수)</span></td>
                            <td colspan="7">
                              <div class="checkbox-group" data-code-list="list2">
                                <v-checkbox
                                  v-for="(item, idx) in codeList.list2"
                                  :key="idx"
                                  v-model="workMngModel"
                                  :label="item.TXT"
                                  :value="item.COD"
                                  :true-value="item.COD"
                                  :false-value="null"
                                  hide-details
                                  density="compact"
                                  @update:modelValue="onWorkMngUpdate"
                                />
                              </div>
                              <div
                                v-if="dataParams.WORK_MNG === 'F' || workMngModel.includes('F')"
                                class="d-flex items-center gap-1"
                                style="padding-left: 10px"
                              >
                                <span>기타입력: (</span>
                                <input
                                  type="text"
                                  v-model="dataParams.MNG_ETC"
                                  style="width: 300px"
                                  class="etc-input"
                                  data-code-list="list2"
                                />
                                <span>)</span>
                              </div>
                            </td>
                          </tr>
                          <tr class="trHeight2">
                            <td rowspan="2" class="title2">의학적 조치</td>
                            <td colspan="7">
                              <div class="checkbox-group" data-code-list="list3">
                                <v-checkbox
                                  v-for="(item, idx) in codeList.list3"
                                  :key="idx"
                                  v-model="mediTrmModel"
                                  :label="item.TXT"
                                  :value="item.COD"
                                  :true-value="item.COD"
                                  :false-value="null"
                                  hide-details
                                  @update:modelValue="onMediTrmUpdate"
                                  density="compact"
                                />
                              </div>
                              <div
                                v-if="dataParams.MEDI_TRM === 'G' || mediTrmModel.includes('G')"
                                class="d-flex items-center gap-1"
                                style="padding-left: 10px"
                              >
                                <span>기타입력: (</span>
                                <input
                                  type="text"
                                  v-model="dataParams.TRM_ETC"
                                  style="width: 300px"
                                  class="etc-input"
                                  data-code-list="list3"
                                />
                                <span>)</span>
                              </div>
                            </td>
                          </tr>
                          <tr class="trHeight2">
                            <td colspan="7">
                              <div class="checkbox-group" data-code-list="list4">
                                <v-checkbox
                                  v-for="(item, idx) in codeList.list4"
                                  :key="idx"
                                  v-model="mediCycleModel"
                                  :label="item.TXT"
                                  :value="item.COD"
                                  :true-value="item.COD"
                                  :false-value="null"
                                  hide-details
                                  density="compact"
                                />
                              </div>
                              <div
                                v-if="dataParams.MEDI_CYCLE === 'E'"
                                class="d-flex items-center gap-1"
                                style="padding-left: 10px"
                              >
                                <span>기타입력: (</span>
                                <input
                                  type="text"
                                  v-model="dataParams.CYCLE_ETC"
                                  style="width: 300px"
                                  class="etc-input"
                                  data-code-list="list4"
                                />
                                <span>)</span>
                              </div>
                            </td>
                          </tr>
                          <tr class="trHeight2">
                            <td class="title2">건강증진활동</td>
                            <td colspan="7">
                              <div class="checkbox-group" data-code-list="list5">
                                <v-checkbox
                                  v-for="(item, idx) in codeList.list5"
                                  :key="idx"
                                  v-model="healthCareModel"
                                  :label="item.TXT"
                                  :value="item.COD"
                                  :true-value="item.COD"
                                  :false-value="null"
                                  hide-details
                                  @update:modelValue="onHealthCareUpdate"
                                  density="compact"
                                />
                              </div>
                              <div
                                v-if="dataParams.HEALTH_CARE === 'F' || healthCareModel.includes('F')"
                                class="d-flex items-center gap-1"
                                style="padding-left: 10px"
                              >
                                <span>기타입력: (</span>
                                <input
                                  type="text"
                                  v-model="dataParams.CARE_ETC"
                                  style="width: 300px"
                                  class="etc-input"
                                  data-code-list="list5"
                                />
                                <span>)</span>
                              </div>
                            </td>
                          </tr>
                          <tr class="trHeight2">
                            <td class="title2">보호구 지급</td>
                            <td colspan="7">
                              <div class="checkbox-group" data-code-list="list6">
                                <v-checkbox
                                  v-for="(item, idx) in codeList.list6"
                                  :key="idx"
                                  v-model="protectModel"
                                  :label="item.TXT"
                                  :value="item.COD"
                                  :true-value="item.COD"
                                  :false-value="null"
                                  hide-details
                                  @update:modelValue="onProtectUpdate"
                                  density="compact"
                                />
                              </div>
                              <div
                                v-if="dataParams.PROTECT === 'J' || protectModel.includes('J')"
                                class="d-flex items-center gap-1"
                                style="padding-left: 10px"
                              >
                                <span>기타입력: (</span>
                                <input
                                  type="text"
                                  v-model="dataParams.PROTECT_ETC"
                                  style="width: 300px"
                                  class="etc-input"
                                  data-code-list="list6"
                                />
                                <span>)</span>
                              </div>
                            </td>
                          </tr>
                          <tr class="trHeight2">
                            <td class="title2">기타</td>
                            <td colspan="7">
                              <v-text-field v-model="dataParams.ATC" dense outlined />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </fieldset>
                  </div>
                </v-window-item>
              </v-window>
            </v-sheet>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <VendTreePopup ref="vendTreePopup" @selected="selectedVend" />
  <EmpPopup ref="empPopup" @selected="selectedEmp" />
  <PdfView ref="pdfPopup" />
  <HLTKB0020Popup01 ref="hltkb0020Popup01" />
  <IUploadPopup
    ref="agencyFileUploadPopup"
    :gridTitle="agencyFileTitle"
    @uploaded="uploaded"
    @closed="agencyFilePopupClosed"
  />
  <IUploadPopup ref="agreeFileUploadPopup" :gridTitle="agreeFileTitle" @uploaded="uploaded2" />
  <IUploadPopup
    ref="confirmFileUploadPopup"
    :gridTitle="agreeFileTitle"
    :isVisibled="false"
    :buttonList="['btnDownLoad', 'btnClose']"
  />
  <IUploadPopup ref="downloadFoamUploadPopup" @uploaded="uploaded3" />
</template>

<style scoped lang="scss">
.content-area-foam {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 305px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

.content-area-grid {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 530px);
  // overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 375px;
  }
}
.custom-grid {
  // height: 375px !important;
}

.checkbox-group {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 12px;
  height: 50%;
  padding-left: 10px;
}

:deep(.emp-readonly-field.v-input--readonly .v-field) {
  background-color: white !important;
}

.long-input {
  width: 500px;
}

.title2 {
  background-color: #f4f5f9;
  font-weight: bold;
}

.trHeight1 {
  height: 40px;
}

.trHeight2 {
  height: 50px;
}
</style>
