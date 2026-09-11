<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'

import { useUserStore } from "@hiway/stores/user"

import { useLogsStore } from "@hiway/stores/logs"

import { useI18n } from "vue-i18n"

import dayjs from "dayjs"

import {

  commonPgExecuteApi,

  commonPgSearchApi,

  commonSendApi,

  getPgCodeList,

  nullToEmpty,

} from "@hiway/api/commonApi"

import queryFlowHelper from '@/utils/searchFlowHelper'

import saveFlowHelper from "@/utils/saveFlowHelper"

import Message from "@hiway/utils/notify"

import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"

import RealGrid from '@/components/RealGrid.vue'

import IMenuTitle from '@/components/IMenuTitle.vue'

import IGridTitle from "@/components/IGridTitle.vue"

import DeptPopup from "@/components/popup/DeptPopup.vue"

import EmpPopup from "@/components/popup/EmpPopup.vue"

import IUpload from "@/components/IUpload.vue"

import IUploadImageMulit from "@/components/IUploadImageMulit.vue"

import LocationPopup from "@/components/popup/LocationPopup.vue"

import CommonCodePopUpSAF from "@/components/popup/CommonCodePopUpSAF.vue"

const emit = defineEmits(['closed'])

// ==========================================

// ⚙️ 1. 시스템 변수 및 인스턴스 정의

// ==========================================

const vm = getCurrentInstance().proxy

const t = useI18n().t

const userStore = useUserStore()

const dialog = ref(false)

const grdMain = ref(null)

const menuTitle = ref(null)

const workCntMaxNumber = ref(4)

// 팝업 내부 컴포넌트 Refs

const locationPopup = ref(null)

const workStopLocation = ref(null)

const workStopEmpPopup = ref(null)

const workStopDeptPopup = ref(null)

const workStopProcessEmpPopup = ref(null)

// 파일/이미지 업로드 컴포넌트 Refs

const imageUpload = ref(null)          // 작업중지 사진첨부

const imageUpload2 = ref(null)         // 작업재개 조치사진

const workStopFileUpload = ref(null)    // 작업중지 일반파일

const workRestartFileUpload = ref(null) // 작업재개 일반파일

// ==========================================

// 📊 2. 데이터 상태 관리 (Reactive States)

// ==========================================

const workStopField = reactive({

  // 1. 일시 및 장소 정보

  CMPNY_DIV: "",                  // 사업장구분

  JSTOP_NO: "",                   // 중지NO

  JSTOP_DT1: "",                  // 중지일자

  JSTOP_TIME2: "",                // 중지시간

  JSTOP_TIME: "",                 // 중지일시(YYYYMMDDHH24MI)

  JSTOP_HM: "",                   // 중지시각

  JOB_LPLC: "",                   // 작업장소(대)

  JOB_MPLC: "",                   // 작업장소(중)

  JOB_SPLC: "",                   // 작업장소(소)

  JOB_PLC_DESC: "",               // 작업장소 상세

  JOB_LPLC_NM: '',                // 작업장소명(대)

  JOB_MPLC_NM: '',                // 작업장소명(중)

  JOB_SPLC_NM: '',                // 작업장소명(소)

  SHIP_NO: "",                    // 호선/프로젝트 No

  // 2. 작업중지 대상 정보

  CHG_EMP_NM: "",                 // 작업담당자 성명

  CHG_EMP_NO: "",                 // 작업담당자 사번

  JOB_TIT_NM: "",                 // 작업담당자 직위

  WORKER_CNT: "",                 // 작업인원

  BSNS_CD: "",                    // 사업본부

  DEPT_CD: "",                    // 부서 코드

  DEPT_NM: '',                    // 부서명

  ASGN_CD: "",                    // 소속조직 코드

  ASGN_NM: '',                    // 소속조직명

  VIO_EMP_ASGN: '',               // 작업담당소속 Full 명칭

  // 3. 작업중지 사유 및 파일 그룹 ID

  JSTOP_DESC: "",                 // 중지사유

  IMG_ID: "",                     // 작업중지 사진 그룹 ID

  FILE_ID: "",                    // 작업중지 파일 그룹 ID

  // 4. 작업 재개 및 조치 정보

  RESTART_TIME: "",               // 작업재개 일시

  RESTART_DT1: "",                // 재개일자

  RESTART_HM: "",                 // 재개시각

  RESTART_DIV: "",                // 작업재개 구분 코드

  RESTART_DESC: "",               // 작업재개 조치내용

  IMG_ID2: "",                    // 작업재개 사진 그룹 ID

  FILE_ID2: "",                   // 작업재개 파일 그룹 ID

  // 5. 단속자(발행자) 정보

  JSTOP_EMP_NO: userStore.empNo,  // 단속자 사번

  JSTOP_EMP_NM: userStore.empNm,  // 단속자 성명

  JSTOP_ASGN_CD: userStore.asgnCd, // 단속자 소속 코드

  JSTOP_ASGN_NM: userStore.asgnFullNm, // 단속자 소속명

  JSTOP_DEPT_CD: userStore.deptCd, // 단속자 부서코드

  JSTOP_JOB_TIT_NM: "",           // 단속자 직위

  JSTOP_BSNS_CD: userStore.bsnsCd, // 단속자 사업본부

  // 공통 및 제어 플래그

  INSERT_USER_ID: "",

  INSERT_DATE: "",

  UPDATE_USER_ID: "",

  UPDATE_DATE: "",

  COMPANY: "",                    // 사업장구분(위반자)

  SAVE_YN: "",

  JSTOP_DIV: "",                  // 중지구분(미사용)

})

const codeList = reactive({

  RESTART_DIV: [],

  SHIP_NO: [],

})

// ==========================================

// 🚀 3. 팝업 Lifecycle & 파일 싱크 오케스트레이션

// ==========================================

// 신규 등록용 팝업 로드

const openPopup = async () => {

  dialog.value = true

  initWorkStopCodeList()

  await nextTick()

  // 그리드 데이터 클리어 및 신규 단독 GUID 생성 발급

  imageUpload.value?.clearGrid?.()

  imageUpload2.value?.clearGrid?.()

  workStopFileUpload.value?.clearGrid?.()

  workRestartFileUpload.value?.clearGrid?.()

  imageUpload.value?.setGuid()

  imageUpload2.value?.setGuid()

  workStopFileUpload.value?.setGuid()

  workRestartFileUpload.value?.setGuid()

}

// 수정/상세 조회용 팝업 로드

const openPopup2 = rowData => {

  dialog.value = true

  // 행 데이터를 Reactive State 필드 구조에 안전하게 바인딩

  Object.keys(workStopField).forEach(key => {

    if (rowData[key] !== undefined) {

      workStopField[key] = rowData[key]

    }

  })

  // 일시 데이터 및 그리드 전전처리 포맷 보정

  workStopField.JSTOP_DT1 = rowData.JSTOP_DT

  if (rowData.JSTOP_TIME) workStopField.JSTOP_TIME2 = rowData.JSTOP_TIME.substr(0, 5)

  if (rowData.RESTART_DT) workStopField.RESTART_DT1 = rowData.RESTART_DT

  if (rowData.RESTART_TIME) workStopField.RESTART_TIME2 = rowData.RESTART_TIME.substr(0, 5)

  workStopField.SAVE_YN = 'Y'

  initWorkStopCodeList()

  loadAttachmentFiles()

}

// 마스터 데이터에 존재하는 첨부 파일 연동 및 초기 조회 실행

const loadAttachmentFiles = async () => {

  await nextTick()

  const targets = [

    { component: imageUpload.value, fileId: workStopField.IMG_ID },

    { component: imageUpload2.value, fileId: workStopField.IMG_ID2 },

    { component: workStopFileUpload.value, fileId: workStopField.FILE_ID },

    { component: workRestartFileUpload.value, fileId: workStopField.FILE_ID2 },

  ]

  targets.forEach(target => {

    if (!target.component) return

    target.component.clearGrid?.()

    if (target.fileId) {

      // 그룹 키가 유효하면 GUID 주입 후 실시간 서버 데이터 파일 바인딩 조회 실행

      target.component.setGuid(target.fileId)

      target.component.onButtonsClick({ id: "btnSearch" })

    } else {

      // 그룹 키가 없을 시 임시 독립 GUID만 생성 상태로 보류 대기

      target.component.setGuid()

    }

  })

}

const closePopup = () => {

  Object.keys(workStopField).forEach(key => {

    workStopField[key] = ""

  })

  emit("closed")

  dialog.value = false

}

// ==========================================

// 📥 4. 파일/이미지 업로드 컴포넌트 이벤트 헨들러 (Callbacks)

// ==========================================

const uploadPicture = val => {

  if (val?.FILE_ID) workStopField.IMG_ID = val.FILE_ID

}

const uploadPicture2 = val => {

  if (val?.FILE_ID) workStopField.IMG_ID2 = val.FILE_ID

}

const uploadWorkStopFile = val => {

  const fileId = val?.FILE_ID ?? val?.fileId ?? ""

  if (!fileId) return

  workStopField.FILE_ID = fileId

  // 수정 모드로 실데이터 수정 중일 경우 업로드 완료 즉시 마스터에 파일 키 실시간 업데이트 수행

  if (workStopField.JSTOP_NO) {

    commonPgExecuteApi({

      queryId: "SAFDC0010_SAVE16",

      list: [{

        CMPNY_DIV: userStore.cmpnyDiv,

        JSTOP_NO: workStopField.JSTOP_NO,

        COMPANY: workStopField.COMPANY,

        FILE_ID: fileId,

      }],

    })

  }

}

const uploadRestartFile = val => {

  const fileId = val?.FILE_ID ?? val?.fileId ?? ""

  if (!fileId) return

  workStopField.FILE_ID2 = fileId

  if (workStopField.JSTOP_NO) {

    commonPgExecuteApi({

      queryId: "SAFDC0010_SAVE16",

      list: [{

        CMPNY_DIV: userStore.cmpnyDiv,

        JSTOP_NO: workStopField.JSTOP_NO,

        COMPANY: workStopField.COMPANY,

        FILE_ID2: fileId,

        USER_ID: userStore.userId,

      }],

    })

  }

}

// ==========================================

// 💾 5. 비즈니스 트랜잭션 핵심 정의 (Save, Mail)

// ==========================================

const loadLocationPath = async () => {

  const cmpnyDiv = workStopField.COMPANY || userStore.cmpnyDiv

  const result = { LOC_LARGE_NM: "", LOC_MEDIUM_NM: "", LOC_SMALL_NM: "" }

  if (!workStopField.JOB_LPLC) return result

  const largeRes = await commonPgSearchApi(

    { queryId: "PTWA0010_SEARCH_LOC", param: { CMPNY_DIV: cmpnyDiv, LOCATION_LVL: "1", UP_CD: null } },

    { useProgress: false },

  )

  const large = (largeRes.ORESULT_CUR || []).find(row => row.LOCATION_CODE === workStopField.JOB_LPLC)

  result.LOC_LARGE_NM = large?.LOCATION_DESC || ""

  if (!large || !workStopField.JOB_MPLC) return result

  const mediumRes = await commonPgSearchApi(

    { queryId: "PTWA0010_SEARCH_LOC", param: { CMPNY_DIV: cmpnyDiv, LOCATION_LVL: "2", UP_CD: workStopField.JOB_LPLC } },

    { useProgress: false },

  )

  const medium = (mediumRes.ORESULT_CUR || []).find(row => row.LOCATION_CODE === workStopField.JOB_MPLC && row.ALL_UP_CD === large.ALL_LOCATION_COD)

  result.LOC_MEDIUM_NM = medium?.LOCATION_DESC || ""

  if (!medium || !workStopField.JOB_SPLC) return result

  const smallRes = await commonPgSearchApi(

    { queryId: "PTWA0010_SEARCH_LOC", param: { CMPNY_DIV: cmpnyDiv, LOCATION_LVL: "3", UP_CD: workStopField.JOB_MPLC } },

    { useProgress: false },

  )

  const small = (smallRes.ORESULT_CUR || []).find(row => row.LOCATION_CODE === workStopField.JOB_SPLC && row.ALL_UP_CD === medium.ALL_LOCATION_COD)

  result.LOC_SMALL_NM = small?.LOCATION_DESC || ""

  return result

}

const initWorkStopCodeList = () => {

  Promise.all([

    getPgCodeList('HHIG170'),

    commonPgSearchApi({ queryId: 'SAFDC0010_SEARCH_17', param: {} }),

  ]).then(res => {

    codeList.RESTART_DIV = res.ORESULT_CUR

    codeList.SHIP_NO = res.ORESULT_CUR.map(item => item.SHIP_COD)

  })

  if (!workStopField.JSTOP_DT1) {

    workStopField.JSTOP_DT1 = dayjs().format("YYYY-MM-DD")

    workStopField.JSTOP_TIME2 = dayjs().format("HH:mm")

  }

  if (workStopField.SAVE_YN != "Y") {

    workStopField.JSTOP_EMP_NM = userStore.empNm

    workStopField.JSTOP_EMP_NO = userStore.empNo

    workStopField.JSTOP_JOB_TIT_NM = userStore.jobTitNm

    workStopField.JSTOP_ASGN_NM = userStore.asgnFullNm

    workStopField.JSTOP_ASGN_CD = userStore.asgnCd

    workStopField.JSTOP_DEPT_CD = userStore.deptCd

    workStopField.JSTOP_BSNS_CD = userStore.bsnsCd

  }

}

const beforeSave = () => {

  const requires = [

    { target: workStopField.JOB_SPLC, msg: '작업장소는 필수값입니다.' },

    { target: workStopField.CHG_EMP_NO, msg: '작업담당자는 필수값입니다.' },

    { target: workStopField.ASGN_NM, msg: '작업담당조직은 필수값입니다.' },

    { target: workStopField.WORKER_CNT, msg: '작업인원은 필수값입니다.' },

    { target: workStopField.JSTOP_DESC, msg: '중지상세는 필수값입니다.' },

  ]

  for (const item of requires) {

    if (!item.target) {

      Message.warn(t(item.msg))

      return false

    }

  }

  return true

}

const saveData = () => {

  // 업로드 그리드 컴포넌트 내부에 최종 생성된 활성 GUID 키셋 동기화 보증

  workStopField.IMG_ID = imageUpload.value?.guid || workStopField.IMG_ID

  workStopField.IMG_ID2 = imageUpload2.value?.guid || workStopField.IMG_ID2

  workStopField.FILE_ID = workStopFileUpload.value?.guid || workStopField.FILE_ID

  workStopField.FILE_ID2 = workRestartFileUpload.value?.guid || workStopField.FILE_ID2

  const saveParam = [{

    CMPNY_DIV: userStore.cmpnyDiv,

    JSTOP_NO: workStopField.JSTOP_NO,

    JSTOP_DT1: workStopField.JSTOP_DT1,

    JSTOP_TIME2: workStopField.JSTOP_TIME2,

    BSNS_CD: workStopField.BSNS_CD,

    DEPT_CD: workStopField.DEPT_CD,

    ASGN_CD: workStopField.ASGN_CD,

    CHG_EMP_NO: workStopField.CHG_EMP_NO,

    CHG_EMP_NM: workStopField.CHG_EMP_NM,

    JSTOP_DIV: workStopField.JSTOP_DIV,

    JSTOP_DESC: workStopField.JSTOP_DESC,

    JOB_LPLC: workStopField.JOB_LPLC,

    JOB_MPLC: workStopField.JOB_MPLC,

    JOB_SPLC: workStopField.JOB_SPLC,

    JOB_PLC_DESC: workStopField.JOB_PLC_DESC,

    SHIP_NO: workStopField.SHIP_NO,

    WORKER_CNT: workStopField.WORKER_CNT,

    RESTART_DT1: workStopField.RESTART_DT1,

    RESTART_TIME2: workStopField.RESTART_TIME2,

    RESTART_DIV: workStopField.RESTART_DIV,

    RESTART_DESC: workStopField.RESTART_DESC,

    JSTOP_EMP_NO: workStopField.JSTOP_EMP_NO,

    JSTOP_ASGN_CD: workStopField.JSTOP_ASGN_CD,

    JSTOP_DEPT_CD: workStopField.JSTOP_DEPT_CD,

    USER_ID: userStore.userId,

    SAVE_YN: workStopField.SAVE_YN === 'Y' ? 'Y' : 'N',

    COMPANY: workStopField.COMPANY,

    FILE_ID: workStopField.FILE_ID,

    FILE_ID2: workStopField.FILE_ID2,

    IMG_ID: workStopField.IMG_ID,

    IMG_ID2: workStopField.IMG_ID2,

  }]

  return commonPgExecuteApi({

    queryId: 'SAFDC0010_SAVE06',

    list: saveParam,

  })

}

const sendMail = () => {

  const mailMsg = getMailMsg()

  const mailSubject = '[HiSEs] 작업중지 등록 안내'

  sendMailDetail(workStopField.COMPANY, workStopField.DEPT_CD, workStopField.ASGN_CD, mailSubject, mailMsg)

}

const getMailMsg = () => {

  // 인터페이스 컴포넌트 이스케이프 충돌 방지를 위해 문자열 결합 처리

  let html = '<he' + 'ad><st' + 'yle>table {width: 98%; border: 1px solid #444444; border-collapse: collapse; } th, td {border: 1px solid #444444; padding: 5px; font-size: 14px; } .title{background - color:lightsteelblue; font-weight: bold; text-align: center; } </st' + 'yle> </he' + 'ad> <bo' + 'dy>'

  html += '작업중지 등록 사항을 아래와 같이 안내 드립니다.'

  html += '   *작업중지 상세 내용 확인 : HiSEs [안전]–[안전수칙]–[안전수칙위반 현황/등록]–[작업중지 탭] 화면에서 해당 내용을 더블 클릭 후 확인'

  html += '◎ 작업중지 내용'

  html += '중지일자중지시간작업담당소속작업담당자장소분류작업장소호선번호중지사유조치구분작업중지 처리자'

  html += ''

  html += '' + nullToEmpty(workStopField.JSTOP_DT1) + ''

  html += '' + nullToEmpty(workStopField.JSTOP_TIME2) + ''

  html += '' + nullToEmpty(workStopField.ASGN_NM) + ''

  html += '' + nullToEmpty(workStopField.CHG_EMP_NM) + ''

  html += '' + nullToEmpty(workStopField.JOB_SPLC_NM) + ''

  html += '' + nullToEmpty(workStopField.JOB_PLC_DESC) + ''

  html += '' + nullToEmpty(workStopField.SHIP_NO) + ''

  html += '' + nullToEmpty(workStopField.JSTOP_DESC) + ''

  html += '' + nullToEmpty(getRESTART_DIV_NM(workStopField.RESTART_DIV)) + ''

  html += '' + nullToEmpty(workStopField.JSTOP_EMP_NM) + ''

  html += '</bo' + 'dy > '

  return html

}

const sendMailDetail = async (pCmpnyDiv, pDeptCd, pAsgnCd, pSubject, pMsg) => {

  const mailList = await commonPgSearchApi({

    queryId: 'SAFDD0010_SEARCH_04',

    param: { CMPNY_DIV: pCmpnyDiv, DEPT_CD: pDeptCd, ASGN_CD: pAsgnCd },

  })

  const mails1 = []

  mailList.ORESULT_CUR.forEach(mail => {

    if (mail.EMAIL) {

      mails1.push(mail.EMAIL)

    }

  })

  //const targets = (mailList.ORESULT_CUR || []).filter(item => item.EMAIL).map(item => item.EMAIL);

  await commonSendApi({

    EMAIL: mails1,

    SUBJECT: pSubject,

    CONTENT: pMsg,

  })

}

const afterSave = () => {

  sendMail()

  closePopup()

}

const getRESTART_DIV_NM = code => {

  const matched = codeList.RESTART_DIV.find(item => item.COD === code)

  return matched ? matched.TXT : ""

}

// ==========================================

// 🖱️ 6. 팝업 UI 컴포넌트 상호작용 (UI Actions)

// ==========================================

const onButtonsClick = btn => {

  if (btn.id === 'btnUpdate') {

    new saveFlowHelper(vm, t)

      .setBefore(beforeSave)

      .setQuery(saveData)

      .setAfter(afterSave)

      .run()

  } else {

    closePopup()

  }

}

const openLocationPopup = async () => {

  const locationPath = await loadLocationPath()

  locationPopup.value?.openPopup({

    CMPNY_DIV: workStopField.COMPANY || userStore.cmpnyDiv,

    JOB_LPLC: workStopField.VIO_LPLC,

    JOB_LPLC_NM: locationPath.LOC_LARGE_NM,

    JOB_MPLC: workStopField.VIO_MPLC,

    JOB_MPLC_NM: locationPath.LOC_MEDIUM_NM,

    JOB_SPLC: workStopField.VIO_SPLC,

    JOB_SPLC_NM: locationPath.LOC_SMALL_NM,

  })

}

const selectedWorkStopLocation = val => {

  workStopField.JOB_LPLC = val.LOC_LARGE

  workStopField.JOB_MPLC = val.LOC_MEDIUM

  workStopField.JOB_SPLC = val.LOC_SMALL

  workStopField.JOB_SPLC_NM = val.WORK_LOCATION

}

const openWorkStopEmpPopup = () => {

  workStopEmpPopup.value.openPopup({

    CMPNY_DIV: userStore.cmpnyDiv,

    HSE_ONLY: 'Y',

    EMP_NM: workStopField.CHG_EMP_NM,

  })

}

const selectedWorkStopEmpPopup = val => {

  workStopField.CHG_EMP_NM = val.EMP_NM

  workStopField.CHG_EMP_NO = val.EMP_NO

  workStopField.BSNS_CD = val.BSNS_CD

  workStopField.DEPT_CD = val.DEPT_CD

  workStopField.ASGN_CD = val.ASGN_CD

  workStopField.COMPANY = val.CMPNY_DIV

  workStopField.VIO_EMP_ASGN = val.ASGN_NM

  workStopField.ASGN_NM = val.USER_DIV === 'D' ? null : val.ASGN_NM

  workStopField.USER_DIV = val.USER_DIV

  workStopField.CHG_CMPNY_DIV = val.CMPNY_DIV

  workStopField.JOB_TIT_NM = val.JOB_TIT_NM

}

const openWorkStopDeptPopup = () => {

  workStopDeptPopup.value.openPopup()

}

const selectedWorkStopDeptPopup = val => {

  workStopField.ASGN_NM = val.ASGN_FULL_NM

  workStopField.ASGN_CD = val.ASGN_CD

  workStopField.BSNS_CD = val.BSNS_CD

  workStopField.DEPT_CD = val.DEPT_CD

  workStopField.COMPANY = val.CMPNY_DIV

}

const openWorkStopProcessEmpPopup = () => {

  workStopProcessEmpPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY: 'Y', EMP_NM: workStopField.JSTOP_EMP_NM })

}

const selectedWorkStopProcessEmpPopup = val => {

  workStopField.JSTOP_EMP_NM = val.EMP_NM

  workStopField.JSTOP_EMP_NO = val.EMP_NO

  workStopField.JSTOP_JOB_TIT_NM = val.JOB_TIT_NM

  workStopField.JSTOP_DEPT_CD = val.DEPT_CD

  workStopField.JSTOP_ASGN_NM = val.ASGN_NM

  workStopField.JSTOP_ASGN_CD = val.ASGN_CD

  workStopField.JSTOP_BSNS_CD = val.BSNS_CD

}

onMounted(() => {

  vm.$nextTick(() => {

    initWorkStopCodeList()

  })

})

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
      작업중지등록
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-3 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <!-- Section 1 -->

            <div class="d-flex mt-2">
              <v-avatar
                color="primary"
                size="24"
                class="text-white"
              >
                1
              </v-avatar>

              &nbsp;<b>일시 및 장소</b>
            </div>

            <div class="d-flex mt-2">
              <i-input
                v-model="workStopField.JSTOP_DT1"
                width="150px"
                :label="$t('중지일시')"
                top-label

                type="date"
              />

              <i-input
                v-model="workStopField.JSTOP_TIME2"
                width="150px"
                class="mt-5"
                type="time"
              />

              <i-input
                v-model="workStopField.JOB_SPLC_NM"
                :label="$t('장소')"
                width="400px"
                top-label

                append-inner-icon="mdi-magnify"
                readonly
                required
                @click:append-inner="openLocationPopup"
              />

              <i-input
                v-model="workStopField.JOB_PLC_DESC"
                :label="$t('장소상세')"
                width="400px"
                top-label
              />

              <i-select
                v-model="workStopField.SHIP_NO"
                :label="$t('호선/프로젝트No.')"
                top-label
                label-width="200px"

                width="200px"
                :items="codeList.SHIP_NO"
                item-value="WORK_NO"
                item-title="WORK_NO"
              />
            </div>

            <!-- Section 2 -->

            <div class="d-flex mt-2">
              <v-avatar
                color="primary"
                size="24"
                class="text-white"
              >
                2
              </v-avatar>

              &nbsp;<b>작업중지 정보</b>
            </div>

            <div class="d-flex mt-2">
              <i-input
                v-model="workStopField.CHG_EMP_NM"
                :label="$t('작업담당자성명')"
                top-label
                width="200px"

                append-inner-icon="mdi-magnify"
                required
                @click:append-inner="openWorkStopEmpPopup"
              />

              <i-input
                v-model="workStopField.CHG_EMP_NO"
                :label="$t('사번')"
                top-label
                width="200px"
                readonly
              />

              <i-input
                v-model="workStopField.JOB_TIT_NM"
                :label="$t('직위')"
                width="150px"
                top-label
                readonly
              />

              <i-input
                v-model="workStopField.WORKER_CNT"
                width="80px"
                :label="$t('작업인원')"
                top-label
                number
                required
              />
            </div>

            <div class="d-flex mt-2">
              <i-input
                v-model="workStopField.VIO_EMP_ASGN"
                :label="$t('소속조직')"
                width="200px"
                top-label

                readonly
              />

              <i-input
                v-model="workStopField.ASGN_NM"
                :label="$t('작업담당조직')"
                width="300px"
                top-label

                append-inner-icon="mdi-magnify"
                required
                @click:append-inner="openWorkStopDeptPopup"
              />
            </div>

            <!-- Section 3 -->

            <div class="d-flex mt-2">
              <v-avatar
                color="primary"
                size="24"
                class="text-white"
              >
                3
              </v-avatar>

              &nbsp;<b>작업중지내용</b>
            </div>

            <div>
              <i-textarea
                v-model="workStopField.JSTOP_DESC"
                :label="$t('중지사유')"
                width="100%"
                top-label

                required
              />
            </div>

            <div class="mb-6">
              <div class="mt-2">
                <IUploadImageMulit
                  ref="imageUpload"
                  title="사진첨부"
                  @uploaded="uploadPicture"
                />
              </div>

              <div style="height: 430px">
                <IUpload
                  ref="workStopFileUpload"
                  grid-title="파일첨부"
                  @uploaded="uploadWorkStopFile"
                />
              </div>
            </div>

            <!-- Section 4 -->

            <div class="d-flex mt-2">
              <v-avatar
                color="primary"
                size="24"
                class="text-white"
              >
                4
              </v-avatar>

              &nbsp;<b>작업 재개 및 조치 내용</b>
            </div>

            <div class="d-flex mt-2">
              <!-- 재개일자 -->

              <i-input
                v-model="workStopField.RESTART_DT1"
                :label="$t('재개일시')"
                top-label
                width="150px"

                type="date"
              />

              <!-- 재개시간 -->

              <i-input
                v-model="workStopField.RESTART_TIME2"
                width="150px"
                class="mt-5"
                type="time"
              />

              <!-- 조치구분 -->

              <i-select
                v-model="workStopField.RESTART_DIV"
                :label="$t('조치구분')"
                top-label
                width="200px"

                :items="codeList.RESTART_DIV"
                item-title="TXT"
                item-value="COD"
              />
            </div>

            <div class="d-flex flex-row">
              <div>
                <i-textarea
                  v-model="workStopField.RESTART_DESC"
                  :label="$t('조치내용')"
                  width="800px"

                  top-label
                />
              </div>

              <div class="d-flex justify-center align-center  text-red">
                <span>

                  ※ 문제점 조치 후 작업이 재개되었으나 정보기 입력되지 않은 경우, <br>

                  단속자에게 정보 입력을 요청하시기 바랍니다.

                </span>
              </div>
            </div>

            <div class="mt-2">
              <IUploadImageMulit
                ref="imageUpload2"
                title="사진첨부"
                @uploaded="uploadPicture2"
              />
            </div>

            <div class="mt-2">
              <div style="height: 430px">
                <IUpload
                  ref="workRestartFileUpload"
                  grid-title="파일첨부"
                  @uploaded="uploadRestartFile"
                />
              </div>
            </div>

            <!-- Section 5 -->

            <div class="d-flex mt-2">
              <v-avatar
                color="primary"
                size="24"
                class="text-white"
              >
                5
              </v-avatar>

              &nbsp;<b>단속자 정보</b>
            </div>

            <div class="d-flex mt-2">
              <i-input
                v-model="workStopField.JSTOP_EMP_NM"
                :label="$t('단속자 성명')"
                top-label
                width="200px"

                append-inner-icon="mdi-magnify"
                readonly
                @click:append-inner="openWorkStopProcessEmpPopup"
              />

              <i-input
                v-model="workStopField.JSTOP_EMP_NO"
                :label="$t('사번')"
                top-label
                width="200px"

                readonly
              />

              <i-input
                v-model="workStopField.JSTOP_JOB_TIT_NM"
                :label="$t('직위')"
                width="200px"
                top-label
                readonly
              />

              <i-input
                v-model="workStopField.JSTOP_ASGN_NM"
                :label="$t('소속')"
                top-label
                width="200px"
                readonly
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Child Popups -->

  <EmpPopup
    ref="workStopEmpPopup"
    @selected="selectedWorkStopEmpPopup"
  />

  <EmpPopup
    ref="workStopProcessEmpPopup"
    @selected="selectedWorkStopProcessEmpPopup"
  />

  <CommonCodePopUpSAF
    ref="workStopLocation"
    @selected="selectedWorkStopLocation"
  />

  <!-- 잠재사고유형 팝업 -->

  <!-- <CommonCodePopUpSAF ref="sagoDivPopup" @selected="selectedSagoDivPopup">  -->

  <!-- </CommonCodePopUpSAF> -->

  <!-- <IUploadPopup ref="fileUpload" @uploaded="fileUploaded"></IUploadPopup> -->

  <DeptPopup
    ref="workStopDeptPopup"
    @selected="selectedWorkStopDeptPopup"
  />

  <LocationPopup
    ref="locationPopup"
    @selected="selectedWorkStopLocation"
  />
</template>

<style scoped lang="scss">
.content-area {

  position: relative;

  height: calc(100vh - 180px);

  overflow-y: auto;

  >div {

    min-height: 500px;

  }

}

.sheetTitle {

  font-size: 16px;

  font-weight: bold;

}
</style>
