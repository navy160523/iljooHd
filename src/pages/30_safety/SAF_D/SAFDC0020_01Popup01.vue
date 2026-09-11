<script setup>
import { ref, reactive, nextTick, getCurrentInstance, watch } from 'vue'

import { useUserStore } from '@hiway/stores/user'

import { useI18n } from 'vue-i18n'

import { commonPgExecuteApi, commonPgSearchApi, getPgCodeList } from '@hiway/api/commonApi'

import saveFlowHelper from '@/utils/saveFlowHelper'

import deleteFlowHelper from '@/utils/deleteFlowHelper'

import Message from '@hiway/utils/notify'

import IGridTitle from "@/components/IGridTitle.vue"

import dayjs from 'dayjs'

import DeptPopup from '@/components/popup/DeptPopup.vue'

import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'

import EmpPopup from '@/components/popup/EmpPopup.vue'

import IUpload from "@/components/IUpload.vue"

import IUploadImageMulit from "@/components/IUploadImageMulit.vue"

import LocationPopup from "@/components/popup/LocationPopup.vue"

const emit = defineEmits(['closed'])

defineOptions({

  name: 'SAFDC0020_01Popup01',

})

// ==========================================

// 시스템 및 컴포넌트 인스턴스 정의

// ==========================================

const isEntryMode = ref(false)     // 신규 등록 모드 여부 (MNG_NO 없음)

const isActionWaiting = ref(false) // STATUS가 조치대기(30) 상태인지 여부

const vm = getCurrentInstance().proxy

const t = useI18n().t

const userStore = useUserStore()

const menuTitle = ref(null)

const dialog = ref(false)

// 업로드 컴포넌트 Ref 정의

const imageUpload = ref(null)     // 1. 위반내용 사진

const imageUpload2 = ref(null)    // 2. 조치내용 사진

const vioFileUpload = ref(null)   // 3. 위반내용 일반파일

const actFileUpload = ref(null)   // 4. 조치내용 일반파일

// 팝업 내부 컴포넌트 Ref 정의

const locationPopup = ref(null)

const deptPopup = ref(null)

const notiActEmpPopup = ref(null)

const notiChkEmpPopup = ref(null)

const notiAppEmpPopup = ref(null)
const notiCloseEmpPopup = ref(null) //2026.09.11 수정 (종결자)

const approvalReadOnly = ref(true) // 승인자 필드 활성/비활성 제어 플래그

// ==========================================

// 팝업 데이터 상태 관리 (Reactive States)

// ==========================================

const municipalField = reactive({

  CMPNY_DIV: userStore.cmpnyDiv,

  MNG_NO: '',

  BSNS_CD: userStore.bsnsCd,

  // 1. 일시 및 장소

  NOTI_DT: '',         // 점검일자

  REQ_REPLY_DT: '',    // 회신요구일

  NOTI_LPLC: '',       // 장소(대)

  NOTI_MPLC: '',       // 장소(중)

  NOTI_SPLC: '',       // 장소(소)

  NOTI_SPLC_NM: '',    // 장소명

  NOTI_PLC_DESC: '',   // 장소상세

  SHIP_NO: '',         // 호선/프로젝트 No

  NOTI_TIME: '',       // 점검시간

  // 2. 위반정보

  NOTI_TITLE: '',      // 제목

  REC_DEPT_CD: '',     // 수신부서

  REC_ASGN_CD: '',     // 수신조직

  REC_ASGN_NM: '',     // 수신조직명

  // 3. 위반내용 및 파일 연동 ID

  PROBLEM_DESC: '',    // 문제점

  REQUIRE_DESC: '',    // 시정요구안

  IMG_ID1: '',         // 위반내용 사진 그룹 ID

  FILE_ID1: '',        // 위반내용 일반파일 그룹 ID

  // 4. 조치내용 및 파일 연동 ID

  ACT_EMP_NM: '',      // 조치자 성명

  ACT_EMP_NO: '',      // 조치자 사번

  ACT_DEPT_CD: '',     // 조치부서

  ACT_ASGN_CD: '',     // 조치조직

  ACT_ASGN_NM: '',     // 조치조직명

  ACT_BSNS_CD: '',     // 조치사업본부

  ACT_JOB_TIT_NM: '',  // 조치자 직위

  ACT_TEL_NO: '',      // 조치자 전화번호

  ACT_RSLT: '',        // 조치내용

  ACT_DIV: '',         // 조치구분

  IMG_ID2: '',         // 조치내용 사진 그룹 ID

  FILE_ID2: '',        // 조치내용 일반파일 그룹 ID

  // 5. 단속자/승인자 정보

  CHK_EMP_NM: '',      // 점검자 성명

  CHK_EMP_NO: '',      // 점검자 사번

  CHK_TEL_NO: '',      // 점검자 전화번호

  CHK_DEPT_CD: '',     // 점검자 발신부서

  CHK_ASGN_CD: '',     // 점검자 조직코드

  CHK_ASGN_NM: '',     // 점검자 조직명

  CHK_BSNS_CD: '',     // 점검자 사업본부

  CHK_JOB_TIT_NM: '',  // 점검자 직위

  APP_SAME: 'N',       // 승인자 동일 체크여부

  APP_EMP_NO: '',      // 승인자 사번

  APP_EMP_NM: '',      // 승인자 성명

  STATUS: '10',        // 진행상태 (기본값: 작성중)

  COMPANY: '',         // 사업장구분

  // 공통 기본 고정값 및 미사용 필드

  APPROVE_ID: '',

  CLOSE_DT: '', //2026.09.11 수정 (종결자)

  CLOSE_ASGN_CD: '', //2026.09.11 수정 (종결자)

  CLOSE_EMP_NO: '', //2026.09.11 수정 (종결자)

  CLOSE_DEPT_CD: '', //2026.09.11 수정 (종결자)

  CLOSE_EMP_NM: '', //2026.09.11 수정 (종결자)

  CLOSE_JOB_TIT_NM: '', //2026.09.11 수정 (종결자)

  CLOSE_ASGN_NM: '', //2026.09.11 수정 (종결자)

  CLOSE_TEL_NO: '', //2026.09.11 수정 (종결자)

  LOCATION_NM: '',

})

const codeList = reactive({

  CHK_EMP_NO: [],

  APP_EMP_NO: [],

  SHIP_NO: [],

  ACT_DIV: [],

})

// ==========================================

// 팝업 제어 및 초기화/로드 흐름 (Lifecycle & Setup)

// ==========================================

// 신규 등록 팝업 호출 (초기화 핵심)

const openPopup = async () => {

  dialog.value = true

  initField()

  initCodList()

  isEntryMode.value = true

  isActionWaiting.value = false

  // 렌더링 완료 시점에 업로드 그리드를 비우고 고유한 신규 업로드 GUID를 새로 발급합니다.

  await nextTick()

  imageUpload.value?.clearGrid?.()

  imageUpload2.value?.clearGrid?.()

  vioFileUpload.value?.clearGrid?.()

  actFileUpload.value?.clearGrid?.()

  imageUpload.value?.setGuid()

  imageUpload2.value?.setGuid()

  vioFileUpload.value?.setGuid()

  actFileUpload.value?.setGuid()

}

// 수정 및 상세조회 팝업 호출 (기존 파일 로드 핵심)

const openPopup2 = rowData => {

  dialog.value = true

  console.log("받은 데이터 : ", rowData)

  // 넘겨받은 그리드 행 데이터를 데이터 모델에 바인딩

  for (const [key, value] of Object.entries(rowData)) {

    if (municipalField.hasOwnProperty(key)) {

      municipalField[key] = value

    }

  }

  // 종결자 정보 바인딩 //2026.09.11 수정 (종결자)
  municipalField.CLOSE_EMP_NM = rowData.CLOSE_EMP_NM || rowData.close_emp_nm || municipalField.CLOSE_EMP_NM || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_EMP_NO = rowData.CLOSE_EMP_NO || rowData.close_emp_no || municipalField.CLOSE_EMP_NO || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_JOB_TIT_NM = rowData.CLOSE_JOB_TIT_NM || rowData.close_job_tit_nm || municipalField.CLOSE_JOB_TIT_NM || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_ASGN_NM = rowData.CLOSE_ASGN_NM || rowData.close_asgn_nm || municipalField.CLOSE_ASGN_NM || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_ASGN_CD = rowData.CLOSE_ASGN_CD || rowData.close_asgn_cd || municipalField.CLOSE_ASGN_CD || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_DEPT_CD = rowData.CLOSE_DEPT_CD || rowData.close_dept_cd || municipalField.CLOSE_DEPT_CD || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_TEL_NO = rowData.CLOSE_TEL_NO || rowData.close_tel_no || municipalField.CLOSE_TEL_NO || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_DT = rowData.CLOSE_DT || rowData.close_dt || municipalField.CLOSE_DT || '' //2026.09.11 수정 (종결자)

  isEntryMode.value = false

  isActionWaiting.value = municipalField.STATUS === '30' // 조치대기(30) 판별

  initCodList()

  // 데이터 모델에 세팅된 파일 ID 그룹들을 기반으로 첨부파일 컴포넌트 로드를 수행합니다.

  loadAttachmentFiles()

}

// 기존에 저장된 사진 및 파일 리스트 바인딩 명령

const loadAttachmentFiles = async () => {

  await nextTick()

  await nextTick()

  const attachmentTargets = [

    { component: imageUpload.value, fileId: municipalField.IMG_ID1 },

    { component: imageUpload2.value, fileId: municipalField.IMG_ID2 },

    { component: vioFileUpload.value, fileId: municipalField.FILE_ID1 },

    { component: actFileUpload.value, fileId: municipalField.FILE_ID2 },

  ]

  for (const target of attachmentTargets) {

    if (!target.component) continue

    // 컴포넌트에 이전에 맵핑된 내역이 남아있지 않도록 리셋

    target.component.clearGrid?.()

    if (target.fileId) {

      // 마스터 ID(그룹 키)가 존재할 경우에만 GUID를 심고 실서버 데이터를 조회 호출합니다.

      target.component.setGuid(target.fileId)

      target.component.onButtonsClick({ id: "btnSearch" })

    } else {

      // 매핑된 파일 ID가 없을 경우에는 컴포넌트 자체 독립 GUID만 새롭게 생성해 대기시킵니다.

      target.component.setGuid()

    }

  }

}

const closePopup = () => {

  for (let i in municipalField) {

    municipalField[i] = ""

  }

  municipalField.APP_SAME = "N"

  isEntryMode.value = false

  isActionWaiting.value = false

  menuTitle.value?.disableBtn("btnDelete", false)

  menuTitle.value?.disableBtn("btnUpdate", false)

  emit('closed')

  dialog.value = false

}

// 신규 작성 기본값 맵핑

const initField = () => {

  municipalField.MNG_NO = ''

  municipalField.NOTI_DT = dayjs().format('YYYY-MM-DD')

  municipalField.REQ_REPLY_DT = dayjs().add(3, 'day').format('YYYY-MM-DD')

  municipalField.NOTI_LPLC = ''

  municipalField.NOTI_MPLC = ''

  municipalField.NOTI_SPLC = ''

  municipalField.NOTI_SPLC_NM = ''

  municipalField.NOTI_PLC_DESC = ''

  municipalField.SHIP_NO = ''

  municipalField.NOTI_TITLE = ''

  municipalField.REC_ASGN_NM = ''

  municipalField.REC_ASGN_CD = ''

  municipalField.REC_DEPT_CD = ''

  municipalField.PROBLEM_DESC = ''

  municipalField.REQUIRE_DESC = ''

  // 파일 상태 변수 리셋

  municipalField.IMG_ID1 = ''

  municipalField.FILE_ID1 = ''

  municipalField.ACT_EMP_NO = ''

  municipalField.ACT_EMP_NM = ''

  municipalField.ACT_DEPT_CD = ''

  municipalField.ACT_ASGN_CD = ''

  municipalField.ACT_ASGN_NM = ''

  municipalField.ACT_BSNS_CD = ''

  municipalField.ACT_JOB_TIT_NM = ''

  municipalField.ACT_TEL_NO = ''

  municipalField.ACT_RSLT = ''

  municipalField.ACT_DIV = ''

  municipalField.IMG_ID2 = ''

  municipalField.FILE_ID2 = ''

  // 사용자 정보 기준 기본값 할당

  municipalField.NOTI_TIME = dayjs().format("HH:mm")

  municipalField.CHK_EMP_NM = userStore.empNm

  municipalField.CHK_EMP_NO = userStore.empNo

  municipalField.CHK_JOB_TIT_NM = userStore.jobTitNm

  municipalField.CHK_ASGN_NM = userStore.asgnFullNm

  municipalField.CHK_ASGN_CD = userStore.asgnCd

  municipalField.CHK_DEPT_CD = userStore.deptCd

  municipalField.CHK_BSNS_CD = userStore.bsnsCd

  municipalField.APP_SAME = 'N'

  municipalField.APP_EMP_NO = ''

  municipalField.APP_EMP_NM = ''

  municipalField.STATUS = '10'

  municipalField.COMPANY = ''

  municipalField.APPROVE_ID = ''

  municipalField.CLOSE_DT = '' //2026.09.11 수정 (종결자)

  municipalField.CLOSE_ASGN_CD = '' //2026.09.11 수정 (종결자)

  municipalField.CLOSE_EMP_NO = '' //2026.09.11 수정 (종결자)

  municipalField.CLOSE_DEPT_CD = '' //2026.09.11 수정 (종결자)

  municipalField.CLOSE_EMP_NM = '' //2026.09.11 수정 (종결자)

  municipalField.CLOSE_JOB_TIT_NM = '' //2026.09.11 수정 (종결자)

  municipalField.CLOSE_ASGN_NM = '' //2026.09.11 수정 (종결자)

  municipalField.CLOSE_TEL_NO = '' //2026.09.11 수정 (종결자)

}

const loadLocationPath = async () => {

  const cmpnyDiv = municipalField.COMPANY || userStore.cmpnyDiv

  const result = { LOC_LARGE_NM: "", LOC_MEDIUM_NM: "", LOC_SMALL_NM: "" }

  if (!municipalField.VIO_LPLC) return result

  const largeRes = await commonPgSearchApi({

    queryId: "PTWA0010_SEARCH_LOC",

    param: { CMPNY_DIV: cmpnyDiv, LOCATION_LVL: "1", UP_CD: null },

  }, { useProgress: false })

  const large = (largeRes.ORESULT_CUR || []).find(row => row.LOCATION_CODE === municipalField.VIO_LPLC)

  result.LOC_LARGE_NM = large?.LOCATION_DESC || ""

  if (!large || !municipalField.VIO_MPLC) return result

  const mediumRes = await commonPgSearchApi({

    queryId: "PTWA0010_SEARCH_LOC",

    param: { CMPNY_DIV: cmpnyDiv, LOCATION_LVL: "2", UP_CD: municipalField.VIO_LPLC },

  }, { useProgress: false })

  const medium = (mediumRes.ORESULT_CUR || []).find(row => row.LOCATION_CODE === municipalField.VIO_MPLC && row.ALL_UP_CD === large.ALL_LOCATION_COD)

  result.LOC_MEDIUM_NM = medium?.LOCATION_DESC || ""

  if (!medium || !municipalField.VIO_SPLC) return result

  const smallRes = await commonPgSearchApi({

    queryId: "PTWA0010_SEARCH_LOC",

    param: { CMPNY_DIV: cmpnyDiv, LOCATION_LVL: "3", UP_CD: municipalField.VIO_MPLC },

  }, { useProgress: false })

  const small = (smallRes.ORESULT_CUR || []).find(row => row.LOCATION_CODE === municipalField.VIO_SPLC && row.ALL_UP_CD === medium.ALL_LOCATION_COD)

  result.LOC_SMALL_NM = small?.LOCATION_DESC || ""

  return result

}

const initCodList = () => {

  Promise.all([

    getPgCodeList('HHIG190'),

    commonPgSearchApi({ queryId: 'SAFDC0010_SEARCH_17', param: {} }),

    getPgCodeList("HHIG170"),

  ]).then(res => {

    codeList.RESTART_DIV = res[0].ORESULT_CUR

    codeList.SHIP_NO = res[1].ORESULT_CUR.map(item => item.SHIP_COD)

    codeList.ACT_DIV = res[2].ORESULT_CUR

  })

}

// ==========================================

// 파일 및 이미지 업로드 컴포넌트 콜백 (Upload Callbacks)

// ==========================================

// 1. 위반내용 다중 이미지 업로드 완료 콜백

const uploadPicture = val => {

  if (val?.FILE_ID) {

    municipalField.IMG_ID1 = val.FILE_ID

  }

}

// 2. 조치내용 다중 이미지 업로드 완료 콜백

const uploadPicture2 = val => {

  if (val?.FILE_ID) {

    municipalField.IMG_ID2 = val.FILE_ID

  }

}

// 3. 위반내용 일반파일 업로드 완료 콜백

const uploadViolationFile = val => {

  const fileId = val?.FILE_ID ?? val?.fileId ?? ""

  if (!fileId) return

  municipalField.FILE_ID1 = fileId

  // 이미 서버에 등록되어 키값이 존재하는 데이터라면 파일 업로드 성공 즉시 마스터 테이블에 파일 ID를 즉시 업데이트 처리합니다.

  if (municipalField.MNG_NO) {

    commonPgExecuteApi({

      queryId: "SAFDC0010_SAVE15",

      list: [{

        CMPNY_DIV: userStore.cmpnyDiv,

        VIO_NO: municipalField.MNG_NO,

        COMPANY: municipalField.COMPANY,

        FILE_ID1: fileId,

      }],

    })

  }

}

// 4. 조치내용 일반파일 업로드 완료 콜백

const uploadActionFile = val => {

  const fileId = val?.FILE_ID ?? val?.fileId ?? ""

  if (!fileId) return

  municipalField.FILE_ID2 = fileId

  // 이미 서버에 등록되어 키값이 존재하는 데이터라면 파일 업로드 성공 즉시 마스터 테이블에 파일 ID를 즉시 업데이트 처리합니다.

  if (municipalField.MNG_NO) {

    commonPgExecuteApi({

      queryId: "SAFDC0010_SAVE16",

      list: [{

        CMPNY_DIV: userStore.cmpnyDiv,

        VIO_NO: municipalField.MNG_NO,

        COMPANY: municipalField.COMPANY,

        FILE_ID2: fileId,

        DIV: municipalField.DIV,

        USER_ID: userStore.userId,

      }],

    })

  }

}

// ==========================================

// 비즈니스 트랜잭션 정의 (Save, Complete, Delete)

// ==========================================

// 임시저장 Validation 검증

const beforeSave = () => {

  if (!municipalField.NOTI_DT) {

    Message.warn(t('점검일자는 필수값입니다.'))

    return false

  } else if (!municipalField.NOTI_SPLC_NM) {

    Message.warn(t('장소는 필수값입니다.'))

    return false

  } else if (!municipalField.NOTI_TITLE) {

    Message.warn(t('제목은 필수값입니다.'))

    return false

  } else if (!municipalField.REC_ASGN_CD) {

    Message.warn(t('수신조직은 필수값입니다.'))

    return false

  } else if (!municipalField.PROBLEM_DESC) {

    Message.warn(t('문제점은 필수값입니다.'))

    return false

  } else if (!municipalField.CHK_EMP_NM) {

    Message.warn(t('점검자는 필수값입니다.'))

    return false

  }

  return true

}

// 임시저장 실행 데이터 구성

const saveNotiData = () => {

  let saveParam = []

  // 파일 업로드 컴포넌트가 가지고 있는 최종 발급 상태의 guid 그룹 키를 마스터 파라미터에 최종적으로 주입 보증합니다.

  municipalField.IMG_ID1 = imageUpload.value?.guid || municipalField.IMG_ID1

  municipalField.IMG_ID2 = imageUpload2.value?.guid || municipalField.IMG_ID2

  municipalField.FILE_ID1 = vioFileUpload.value?.guid || municipalField.FILE_ID1

  municipalField.FILE_ID2 = actFileUpload.value?.guid || municipalField.FILE_ID2

  let saveData = {

    CMPNY_DIV: userStore.cmpnyDiv,

    MNG_NO: municipalField.MNG_NO,

    BSNS_CD: userStore.bsnsCd,

    NOTI_DT: municipalField.NOTI_DT,

    REQ_REPLY_DT: municipalField.REQ_REPLY_DT,

    NOTI_LPLC: municipalField.NOTI_LPLC,

    NOTI_MPLC: municipalField.NOTI_MPLC,

    NOTI_SPLC: municipalField.NOTI_SPLC,

    NOTI_PLC_DESC: municipalField.NOTI_PLC_DESC,

    SHIP_NO: municipalField.SHIP_NO,

    NOTI_TITLE: municipalField.NOTI_TITLE,

    REC_DEPT_CD: municipalField.REC_DEPT_CD,

    REC_ASGN_CD: municipalField.REC_ASGN_CD,

    PROBLEM_DESC: municipalField.PROBLEM_DESC,

    REQUIRE_DESC: municipalField.REQUIRE_DESC,

    IMG_ID1: municipalField.IMG_ID1,

    FILE_ID1: municipalField.FILE_ID1,

    ACT_EMP_NO: municipalField.ACT_EMP_NO,

    ACT_DEPT_CD: municipalField.ACT_DEPT_CD,

    ACT_ASGN_CD: municipalField.ACT_ASGN_CD,

    ACT_BSNS_CD: municipalField.ACT_BSNS_CD,

    ACT_TEL_NO: municipalField.ACT_TEL_NO,

    ACT_RSLT: municipalField.ACT_RSLT,

    ACT_DIV: municipalField.ACT_DIV,

    IMG_ID2: municipalField.IMG_ID2,

    FILE_ID2: municipalField.FILE_ID2,

    CHK_EMP_NO: municipalField.CHK_EMP_NO,

    CHK_TEL_NO: municipalField.CHK_TEL_NO,

    CHK_DEPT_CD: municipalField.CHK_DEPT_CD,

    CHK_ASGN_CD: municipalField.CHK_ASGN_CD,

    CHK_BSNS_CD: municipalField.CHK_BSNS_CD,

    APP_SAME: municipalField.APP_SAME,

    APP_EMP_NO: municipalField.APP_EMP_NO,

    STATUS: municipalField.MNG_NO === '' ? '10' : municipalField.STATUS,

    COMPANY: userStore.cmpnyDiv,

    APPROVE_ID: municipalField.APPROVE_ID,

    CLOSE_DT: municipalField.CLOSE_DT || (municipalField.CLOSE_EMP_NO ? dayjs().format('YYYY-MM-DD') : ''), //2026.09.11 수정 (종결자)

    CLOSE_ASGN_CD: municipalField.CLOSE_ASGN_CD, //2026.09.11 수정 (종결자)

    CLOSE_EMP_NO: municipalField.CLOSE_EMP_NO, //2026.09.11 수정 (종결자)

    CLOSE_DEPT_CD: municipalField.CLOSE_DEPT_CD, //2026.09.11 수정 (종결자)

    CLOSE_EMP_NM: municipalField.CLOSE_EMP_NM, //2026.09.11 수정 (종결자)

    CLOSE_JOB_TIT_NM: municipalField.CLOSE_JOB_TIT_NM, //2026.09.11 수정 (종결자)

    CLOSE_ASGN_NM: municipalField.CLOSE_ASGN_NM, //2026.09.11 수정 (종결자)

    CLOSE_TEL_NO: municipalField.CLOSE_TEL_NO, //2026.09.11 수정 (종결자)

  }

  saveParam.push(saveData)

  return commonPgExecuteApi({

    queryId: 'SAFDC0010_SAVE04',

    list: saveParam,

  })

    .then(res => {

      if (!municipalField.MNG_NO && res.list && res.list) {

        municipalField.MNG_NO = res.list.OUT_RES_MNG_NO || res.list.MNG_NO

      }

      Message.success(t('정상적으로 임시저장 되었습니다.'))

    })

}

const afterSave = () => {

  closePopup()

}

// 조치완료 처리 전 Validation 검증

const beforeActionComplete = () => {

  if (!municipalField.MNG_NO) {

    Message.warn(t('먼저 임시저장을 진행해주십시오.'))

    return false

  } else if (!municipalField.ACT_RSLT) {

    Message.warn(t('조치내용을 입력하십시오.'))

    return false

  } else if (!municipalField.ACT_EMP_NO) {

    Message.warn(t('조치자를 지정하십시오.'))

    return false

  }

  return true

}

// 조치완료 실행 쿼리 빌드 및 트랜잭션 호출

const actionCompleteQuery = () => {

  let saveParam = []

  // 완료 트랜잭션 발생 시에도 현재 컴포넌트가 들고 있는 업로드 GUID 관계를 강제 동기화 보증합니다.

  municipalField.IMG_ID2 = imageUpload2.value?.guid || municipalField.IMG_ID2

  municipalField.FILE_ID2 = actFileUpload.value?.guid || municipalField.FILE_ID2

  let saveData = {

    CMPNY_DIV: userStore.cmpnyDiv,

    MNG_NO: municipalField.MNG_NO,

    ACT_DT: dayjs().format('YYYY-MM-DD'),

    ACT_RSLT: municipalField.ACT_RSLT,

    IMG_ID2: municipalField.IMG_ID2,

    FILE_ID2: municipalField.FILE_ID2,

    ACT_DEPT_CD: municipalField.ACT_DEPT_CD,

    ACT_ASGN_CD: municipalField.ACT_ASGN_CD,

    ACT_EMP_NO: municipalField.ACT_EMP_NO,

    ACT_TEL_NO: municipalField.ACT_TEL_NO,

    STATUS: '40', // 40: 조치완료 상향 조정

    USER_ID: userStore.userId,

  }

  saveParam.push(saveData)

  return commonPgExecuteApi({

    queryId: 'SAFDC0010_SAVE07',

    list: saveParam,

  })

}

const onActionComplete = () => {

  new saveFlowHelper(vm, t)

    .setBefore(beforeActionComplete)

    .setQuery(actionCompleteQuery)

    .setAfter(() => {

      Message.success(t('조치 완료 처리가 되었습니다.'))

      municipalField.STATUS = '40'

      municipalField.ACT_DIV = '조치완료'

      closePopup()

    })

    .setConfirmMessage("조치완료하시겠습니까?")

    .run()

}

const beforeDelete = () => {

  if (!municipalField.MNG_NO) {

    Message.warn(t('저장되지 않은 지저서는 삭제할 수 없습니다.'))

    return false

  }

  return true

}

const deleteQuery = () => {

  return commonPgExecuteApi({

    queryId: 'SAFDC0010_DELETE01',

    list: [{

      CMPNY_DIV: userStore.cmpnyDiv,

      MNG_NO: municipalField.MNG_NO,

      REASON: '',

      USER_ID: userStore.userId,

    }],

  })

}

const onDelete = () => {

  new deleteFlowHelper(vm, t)

    .setBefore(beforeDelete)

    .setQuery(deleteQuery)

    .setAfter(() => {

      Message.success(t('삭제되었습니다.'))

      closePopup()

    })

    .run()

}

// ==========================================

// 팝업 선택창 상호작용 오케스트레이션 (UI Actions)

// ==========================================

const onButtonsClick = btn => {

  if (btn.id === "btnUpdate") {

    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveNotiData).setAfter(afterSave).run()

  } else if (btn.id === "btnActionComplete") {

    onActionComplete()

  } else if (btn.id === "btnDelete") {

    onDelete()

  } else {

    closePopup()

  }

}

const openLocationPopup = async () => {

  const locationPath = await loadLocationPath()

  locationPopup.value?.openPopup({

    CMPNY_DIV: municipalField.COMPANY || userStore.cmpnyDiv,

    LOC_LARGE: municipalField.NOTI_LPLC,

    LOC_LARGE_NM: locationPath.LOC_LARGE_NM,

    LOC_MEDIUM: municipalField.NOTI_MPLC,

    LOC_MEDIUM_NM: locationPath.LOC_MEDIUM_NM,

    LOC_SMALL: municipalField.NOTI_SPLC,

    LOC_SMALL_NM: locationPath.LOC_SMALL_NM,

  })

}

const selectedNotiLocation = val => {

  municipalField.NOTI_LPLC = val.LOC_LARGE

  municipalField.NOTI_MPLC = val.LOC_MEDIUM

  municipalField.NOTI_SPLC = val.LOC_SMALL

  municipalField.NOTI_SPLC_NM = val.WORK_LOCATION

}

const openDeptPopup = () => {

  deptPopup.value.openPopup()

}

const selectedDept = val => {

  municipalField.REC_ASGN_NM = val.ASGN_FULL_NM

  municipalField.REC_ASGN_CD = val.ASGN_CD

  municipalField.REC_DEPT_CD = val.DEPT_CD

}

const openSafetyActEmpPopup = () => {

  notiActEmpPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY: 'Y', readonly: true })

}

const selectedNotiActEmp = val => {

  municipalField.ACT_EMP_NM = val.EMP_NM

  municipalField.ACT_EMP_NO = val.EMP_NO

  municipalField.ACT_JOB_TIT_NM = val.JOB_TIT_NM

  municipalField.ACT_ASGN_NM = val.ASGN_NM

  municipalField.ACT_TEL_NO = val.TEL_NO || val.HND_PHN

  municipalField.ACT_BSNS_CD = val.BSNS_CD

  municipalField.ACT_DEPT_CD = val.DEPT_CD

}

const openNotiChkEmpPopup = () => {

  notiChkEmpPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY: 'Y', readonly: true })

}

const selectedNotiChkEmp = val => {

  municipalField.CHK_EMP_NM = val.EMP_NM

  municipalField.CHK_EMP_NO = val.EMP_NO

  municipalField.CHK_JOB_TIT_NM = val.JOB_TIT_NM

  municipalField.CHK_ASGN_NM = val.ASGN_NM

  municipalField.CHK_TEL_NO = val.TEL_NO || val.HND_PHN

  municipalField.CHK_BSNS_CD = val.BSNS_CD

  municipalField.CHK_DEPT_CD = val.DEPT_CD

}

const openAppEmpPopup = async gbn => {

  if (gbn === "승인자인원조회") {

    notiAppEmpPopup.value.openPopup({

      CMPNY_DIV: userStore.cmpnyDiv,

      HSE_ONLY: 'Y',

      EMP_NM: municipalField.APP_EMP_NM,

      readonly: true,

    })

  }

}

const selectedAppEmp = val => {

  municipalField.APP_EMP_NM = val.EMP_NM

  municipalField.APP_EMP_NO = val.EMP_NO

}

const openCloseEmpPopup = () => { //2026.09.11 수정 (종결자)
  notiCloseEmpPopup.value.openPopup({ //2026.09.11 수정 (종결자)
    CMPNY_DIV: userStore.cmpnyDiv, //2026.09.11 수정
    HSE_ONLY: 'Y', //2026.09.11 수정
    EMP_NM: municipalField.CLOSE_EMP_NM, //2026.09.11 수정 (종결자)
    readonly: true, //2026.09.11 수정
  }) //2026.09.11 수정
} //2026.09.11 수정

const selectedCloseEmp = val => { //2026.09.11 수정 (종결자)
  municipalField.CLOSE_EMP_NM = val.EMP_NM || val.KOR_NM || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_EMP_NO = val.EMP_NO || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_JOB_TIT_NM = val.JOB_TIT_NM || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_ASGN_NM = val.ASGN_NM || val.ASGN_FULL_NM || val.DEPT_NM || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_ASGN_CD = val.ASGN_CD || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_DEPT_CD = val.DEPT_CD || '' //2026.09.11 수정 (종결자)
  municipalField.CLOSE_TEL_NO = val.TEL_NO || val.HND_PHN || '' //2026.09.11 수정 (종결자)
} //2026.09.11 수정

const onApproval = () => { //2026.09.11 수정
  if (!municipalField.MNG_NO) { //2026.09.11 수정
    Message.warn(t('먼저 임시저장을 진행해주십시오.')) //2026.09.11 수정
    return //2026.09.11 수정
  } //2026.09.11 수정
  if (!municipalField.APP_EMP_NO) { //2026.09.11 수정
    Message.warn(t('승인자가 지정되지 않았습니다.')) //2026.09.11 수정
    return //2026.09.11 수정
  } //2026.09.11 수정
  const day = dayjs() //2026.09.11 수정
  const list = [{ //2026.09.11 수정
    CMPNY_DIV: userStore.cmpnyDiv, //2026.09.11 수정
    YEAR: day.format('YYYY'), //2026.09.11 수정
    APPROVE_ID: 'SAFDC0020_' + userStore.userId + '_' + day.format('YYYYMMDDHHmmss') + '_0', //2026.09.11 수정
    FORM_ID: 'SAFDC0020', //2026.09.11 수정
    APP_EMP_NO: municipalField.APP_EMP_NO, //2026.09.11 수정
    APPROVE_GBN: 'I', //2026.09.11 수정
    APP_REQ_EMP_NO: userStore.userId, //2026.09.11 수정
    APP_STATUS: 'N', //2026.09.11 수정
    PATH: '/30_safety/SAF_D/SAFDC0020', //2026.09.11 수정
    USER_ID: userStore.userId, //2026.09.11 수정
    MNG_NO: municipalField.MNG_NO, //2026.09.11 수정
  }] //2026.09.11 수정
  commonPgExecuteApi({ //2026.09.11 수정
    queryId: 'OPRAB0010_SAVE_01', //2026.09.11 수정
    list: list, //2026.09.11 수정
  }).then(() => { //2026.09.11 수정
    Message.success(t('승인신청 되었습니다.')) //2026.09.11 수정
  }) //2026.09.11 수정
} //2026.09.11 수정

const onCancelApproval = () => { //2026.09.11 수정
  if (!municipalField.MNG_NO) { //2026.09.11 수정
    Message.warn(t('저장되지 않은 문서는 취소할 수 없습니다.')) //2026.09.11 수정
    return //2026.09.11 수정
  } //2026.09.11 수정
  const list = [{ //2026.09.11 수정
    CMPNY_DIV: userStore.cmpnyDiv, //2026.09.11 수정
    VIO_NO: municipalField.MNG_NO, //2026.09.11 수정
    MNG_NO: municipalField.MNG_NO, //2026.09.11 수정
    USER_ID: userStore.userId, //2026.09.11 수정
  }] //2026.09.11 수정
  commonPgExecuteApi({ //2026.09.11 수정
    queryId: 'SAFDC0010_CANCEL01', //2026.09.11 수정
    list: list, //2026.09.11 수정
  }).then(() => { //2026.09.11 수정
    Message.success(t('결재 신청이 취소되었습니다.')) //2026.09.11 수정
  }) //2026.09.11 수정
} //2026.09.11 수정

const setApprovalStatus = () => {

  approvalReadOnly.value = municipalField.APP_SAME !== "N"

}

// ==========================================

// 동기화 감시자 지정 (Reactive Watchers)

// ==========================================

watch(() => municipalField.APP_SAME, newValue => {

  municipalField.APP_SAME = String(newValue).trim().toUpperCase() === "Y" ? "Y" : "N"

  setApprovalStatus()

}, { immediate: true })

defineExpose({

  openPopup,

  openPopup2,

})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1600"
    height="800"
    eager
    class="draggable-dialog"

    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"

      @mousedown="startDragging"
    >
      {{ t('시정통보등록') }}
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnActionComplete', 'btnDelete', 'btnClose']"

          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <!-- 🌟 [마스킹 시작] 조치대기(isActionWaiting) 상태일 때 1, 2, 3번 영역 전체를 잠금 -->

            <div :class="{ 'readonly-form': isActionWaiting }">
              <!-- 1. 일시 및 장소 영역 -->

              <div class="d-flex mt-2">
                <v-avatar
                  color="primary"
                  size="24"
                  class="text-white"
                >
                  1
                </v-avatar>

                &nbsp;<b>{{ t('일시 및 장소') }}</b>
              </div>

              <div class="d-flex mt-2 mb-4 flex-wrap">
                <i-input
                  v-model="municipalField.NOTI_DT"
                  :label="$t('점검일자')"
                  width="150px"
                  top-label
                  type="date"

                  required
                />

                <i-input
                  v-model="municipalField.REQ_REPLY_DT"
                  :label="$t('회신요구일')"
                  width="150px"
                  top-label
                  type="date"

                  required
                />

                <i-input
                  v-model="municipalField.NOTI_SPLC_NM"
                  :label="$t('장소')"
                  top-label
                  width="200px"
                  readonly

                  append-inner-icon="mdi-magnify"
                  required
                  @click:append-inner="openLocationPopup"
                />

                <i-input
                  v-model="municipalField.NOTI_PLC_DESC"
                  :label="$t('장소상세')"
                  top-label
                  width="300px"
                />

                <i-select
                  v-model="municipalField.SHIP_NO"
                  :label="$t('호선/프로젝트No.')"
                  top-label
                  width="250px"

                  :items="codeList.SHIP_NO"
                  item-value="WORK_NO"
                  item-title="WORK_NO"
                />
              </div>

              <!-- 2. 위반 정보 영역 -->

              <div class="d-flex mt-2">
                <v-avatar
                  color="primary"
                  size="24"
                  class="text-white"
                >
                  2
                </v-avatar>

                &nbsp;<b>{{ t('위반 정보') }}</b>
              </div>

              <div class="d-flex mt-2 mb-4 flex-wrap">
                <i-input
                  v-model="municipalField.NOTI_TITLE"
                  :label="$t('제목')"
                  width="600px"
                  top-label

                  required
                />

                <i-input
                  v-model="municipalField.REC_ASGN_NM"
                  :label="$t('수신조직')"
                  width="300px"
                  top-label
                  readonly

                  append-inner-icon="mdi-magnify"
                  required
                  @click:append-inner="openDeptPopup"
                />
              </div>

              <!-- 3. 위반 내용 영역 -->

              <div class="d-flex mt-2">
                <v-avatar
                  color="primary"
                  size="24"
                  class="text-white"
                >
                  3
                </v-avatar>

                &nbsp;<b>{{ t('위반 내용') }}</b>
              </div>

              <div class="d-flex mt-2 mb-4">
                <i-textarea
                  v-model="municipalField.PROBLEM_DESC"
                  :label="$t('문제점')"
                  width="50%"
                  top-label
                  required

                  class="mr-2"
                />

                <i-textarea
                  v-model="municipalField.REQUIRE_DESC"
                  :label="$t('시정요구안')"
                  width="50%"

                  top-label
                />
              </div>

              <div class="mb-6">
                <IUploadImageMulit
                  ref="imageUpload"
                  title="사진첨부(위반)"
                  @uploaded="uploadPicture"
                />

                <div style="height: 430px">
                  <IUpload
                    ref="vioFileUpload"
                    grid-title="파일첨부(위반)"
                    @uploaded="uploadViolationFile"
                  />
                </div>
              </div>
            </div>

            <!-- 🌟 [마스킹 끝] 1, 2, 3번 잠금 영역 종료 -->

            <!-- 🟢 4. 조치 내용 영역 (마스킹 외부에 두어 항시 조작 가능) -->

            <div class="d-flex mt-2">
              <v-avatar
                color="primary"
                size="24"
                class="text-white"
              >
                4
              </v-avatar>

              &nbsp;<b>{{ t('조치 내용') }}</b>
            </div>

            <!-- 신규 등록 및 조치대기 상태가 아닐 때(즉 조치 작성 가능 상태) 폼 오픈 -->

            <div v-if="!isEntryMode && !isActionWaiting">
              <div class="d-flex mt-2 mb-2 flex-wrap">
                <i-input
                  v-model="municipalField.ACT_EMP_NM"
                  :label="$t('조치자성명')"
                  width="200px"
                  top-label

                  append-inner-icon="mdi-magnify"
                  @click:append-inner="openSafetyActEmpPopup"
                />

                <i-input
                  v-model="municipalField.ACT_EMP_NO"
                  :label="$t('사번')"
                  width="200px"
                  top-label

                  readonly
                />

                <i-input
                  v-model="municipalField.ACT_JOB_TIT_NM"
                  :label="$t('직위')"
                  width="150px"
                  top-label

                  readonly
                />

                <i-input
                  v-model="municipalField.ACT_ASGN_NM"
                  :label="$t('소속')"
                  width="250px"
                  top-label

                  readonly
                />

                <i-input
                  v-model="municipalField.ACT_TEL_NO"
                  :label="$t('전화번호')"
                  width="200px"
                  top-label

                  readonly
                />
              </div>

              <div class="d-flex mb-4 flex-wrap">
                <i-textarea
                  v-model="municipalField.ACT_RSLT"
                  :label="$t('조치내용')"
                  class="mt-2 flex-grow-1"

                  top-label
                />

                <i-select
                  v-model="municipalField.ACT_DIV"
                  :label="$t('조치구분')"
                  width="200px"
                  top-label

                  :items="codeList.ACT_DIV"
                  item-title="TXT"
                  item-value="COD"
                  class="mt-2 ml-2"
                />
              </div>

              <div class="mb-6">
                <IUploadImageMulit
                  ref="imageUpload2"
                  title="사진첨부(조치)"
                  @uploaded="uploadPicture2"
                />

                <div style="height: 430px">
                  <IUpload
                    ref="actFileUpload"
                    grid-title="파일첨부(조치)"
                    @uploaded="uploadActionFile"
                  />
                </div>
              </div>
            </div>

            <!-- 숨김 가이드 메시지 영역 -->

            <div
              v-else
              class="pa-4 text-grey-darken-1 text-body-2"
            >
              <span v-if="isEntryMode">※ 신규 등록 시점에는 조치 결과를 입력할 수 없습니다. 시정 통보 등록을 먼저 진행하십시오.</span>

              <span v-else-if="isActionWaiting">※ 조치대기 상태이므로 조치 결과 내용을 입력할 수 없습니다. 상단의 '조치완료' 버튼을 통해 프로세스를

                진행하십시오.</span>
            </div>

            <!-- 🌟 [마스킹 시작] 조치대기(isActionWaiting) 상태일 때 5번 영역 전체를 잠금 -->

            <div :class="{ 'readonly-form': isActionWaiting }">
              <!-- 5. 단속자/승인자 정보 영역 -->

              <div class="d-flex mt-2">
                <v-avatar
                  color="primary"
                  size="24"
                  class="text-white"
                >
                  5
                </v-avatar>

                &nbsp;<b>{{ t('단속자/승인자 정보') }}</b>
              </div>

              <div class="d-flex mt-2 mb-4 align-center">
                <i-input
                  v-model="municipalField.CHK_EMP_NM"
                  :label="$t('점검자성명')"
                  width="200px"
                  top-label

                  append-inner-icon="mdi-magnify"
                  required
                  @click:append-inner="openNotiChkEmpPopup"
                />

                <i-input
                  v-model="municipalField.CHK_EMP_NO"
                  :label="$t('사번')"
                  width="150px"
                  top-label

                  readonly
                />

                <i-input
                  v-model="municipalField.CHK_JOB_TIT_NM"
                  :label="$t('직위')"
                  width="150px"
                  top-label

                  readonly
                />

                <i-input
                  v-model="municipalField.CHK_ASGN_NM"
                  :label="$t('발신조직')"
                  width="250px"
                  top-label

                  readonly
                />

                <i-input
                  v-model="municipalField.CHK_TEL_NO"
                  :label="$t('전화번호')"
                  width="200px"
                  top-label

                  readonly
                />

                <div class="d-flex align-center h-14 mt-5 mr-10">
                  <v-checkbox
                    v-model="municipalField.APP_SAME"
                    true-value="Y"
                    false-value="N"
                    density="compact"

                    hide-details
                    class="ma-0 flex-shrink-0"
                  />

                  <span class="ml-1 flex-shrink-0 text-no-wrap text-body-2">{{ t('승인자 동일') }}</span>
                </div>

                <i-input
                  v-model="municipalField.APP_EMP_NM"
                  :label="$t('승인자성명')"
                  width="200px"
                  top-label

                  append-inner-icon="mdi-magnify"
                  :readonly="approvalReadOnly"

                  required
                  @click:append-inner="openAppEmpPopup('승인자인원조회')"
                />

                <v-btn
                  class="mt-5"
                  @click="onApproval"
                >
                  승인신청
                </v-btn>

                <v-btn
                  class="mt-5"
                  @click="onCancelApproval"
                >
                  승인신청취소
                </v-btn>
              </div>
            </div>

            <!-- 🌟 [마스킹 끝] 5번 잠금 영역 종료 -->

            <!-- 6. 종결자 정보 영역 --> <!-- 2026.09.11 수정 -->
            <div>
              <div class="d-flex mt-2">
                <v-avatar
                  color="primary"
                  size="24"
                  class="text-white"
                >
                  6
                </v-avatar>
                &nbsp;<b>{{ t('종결자정보') }}</b>
              </div>

              <div class="d-flex mt-2 mb-4 align-center">
                <i-input
                  v-model="municipalField.CLOSE_EMP_NM"
                  :label="$t('종결자성명')"
                  width="200px"
                  top-label
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="openCloseEmpPopup"
                />

                <i-input
                  v-model="municipalField.CLOSE_EMP_NO"
                  :label="$t('사번')"
                  width="150px"
                  top-label
                  readonly
                />

                <i-input
                  v-model="municipalField.CLOSE_JOB_TIT_NM"
                  :label="$t('직위')"
                  width="150px"
                  top-label
                  readonly
                />

                <i-input
                  v-model="municipalField.CLOSE_ASGN_NM"
                  :label="$t('소속')"
                  width="250px"
                  top-label
                  readonly
                />

                <i-input
                  v-model="municipalField.CLOSE_TEL_NO"
                  :label="$t('전화번호')"
                  width="200px"
                  top-label
                  readonly
                />
              </div>
            </div> <!-- 2026.09.11 수정 -->
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <DeptPopup
    ref="deptPopup"
    check-bar="true"
    @selected="selectedDept"
  />

  <LocationPopup
    ref="locationPopup"
    @selected="selectedNotiLocation"
  />

  <EmpPopup
    ref="notiActEmpPopup"
    @selected="selectedNotiActEmp"
  />

  <EmpPopup
    ref="notiChkEmpPopup"
    @selected="selectedNotiChkEmp"
  />

  <EmpPopup
    ref="notiAppEmpPopup"
    @selected="selectedAppEmp"
  />
</template>

<style scoped lang="scss">
.readonly-form {

  pointer-events: none !important;

  /* 모든 마우스 클릭, 돋보기 팝업 오픈을 원천 차단 */

  opacity: 0.65;

  /* 화면을 흐리게 만들어 수정 불가 상태임을 시각적으로 표시 */

  user-select: none;

  /* 마우스로 글자를 긁거나 복사하는 것 차단 */

}

.content-area {

  position: relative;

  max-height: calc(85vh);

  overflow-y: auto;

  &>div {

    min-height: 800px;

  }

}

.sticky-toolbar {

  position: sticky;

  top: 0;

  z-index: 10;

}

.border-b {

  border-bottom: 1px solid #e0e0e0;

}
</style>
