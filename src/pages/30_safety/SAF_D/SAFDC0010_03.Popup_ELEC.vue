<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import {
  commonExecuteApi,
  commonSearchApi,
  getCodeList,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IGridTitle from '@/components/IGridTitle.vue'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const workStopLocation = ref(null) //작업장소
const workStopEmpPopup = ref(null) //작업담당
const workStopDeptPopup = ref(null) //작업담당소속
const workStopProcessEmpPopup = ref(null) //작업중지처리자
const fileUpload = ref(null) //파일첨부
const emit = defineEmits(['closed'])
const workCntMaxNumber = ref(4)
const sagoDivPopup = ref(null)
const workStopField = reactive({
  CMPNY_DIV: '', //사업장구분
  JSTOP_NO: '', //중지NO
  JSTOP_DT1: '', //중지일자
  JSTOP_TIME2: '', //중지시간
  BSNS_CD: '', //사업부코드
  DEPT_CD: '', //부서코드
  DEPT_NM: '', //부서이름
  ASGN_NM: '', //소속조직
  VIO_EMP_ASGN: '', //작업담당소속
  ASGN_CD: '', //조직코드
  CHG_EMP_NO: '', //작업담당자사번
  CHG_EMP_NM: '', //작업담당자성명
  CHG_CMPNY_DIV: '', //작업담당자 사업부
  USER_DIV: '', //작업담당자 소속(A = 직영 B = 협력사)
  JSTOP_DIV: '', //중지구분
  JSTOP_DESC: '', //작업중지사유
  JOB_LPLC: '', //작업장소(대)
  JOB_MPLC: '', //작업장소(중)
  JOB_SPLC: '', //작업장소(소)
  JOB_LPLC_NM: '', //작업장소이름(대)
  JOB_MPLC_NM: '', //작업장소이름(중)
  JOB_SPLC_NM: '', //작업장소이름(소)
  JOB_PLC_DESC: '', //작업장소상세
  SHIP_NO: '', //호선
  WORKER_CNT: '', //작업인원
  RESTART_DT1: '', //작업재개일
  RESTART_TIME2: '', //작업재개시간
  RESTART_DIV: '', //작업재개구분
  RESTART_DESC: '', //작업재개조치내용
  JSTOP_EMP_NM: '', //중지처리자
  JSTOP_EMP_NO: '', //중지처리자사번
  JSTOP_ASGN_NM: '', ////중지처리자조직
  JSTOP_ASGN_CD: '', //중지처리자조직코드
  JSTOP_DEPT_CD: '', //중지처리자부서코드
  USER_ID: '', //로그인유저아이디
  SAVE_YN: '', //저장여부
  COMPANY: '', //위반자회사
  FILE_ID: '', //파일아이디
  SAGO_DIV_L: '', //잠재사고유형(대)
  SAGO_DIV_M: '', //잠재사고유형(중)
  SAGO_DIV_S: '', //잠재사고유형(소)
  SAGO_DIV_L_NM: '', //잠재사고유형이름(대)
  SAGO_DIV_M_NM: '', //잠재사고유형이름(중)
  SAGO_DIV_S_NM: '', //잠재사고유형이름(소)
})

const codeList = reactive({
  RESTART_DIV: [],
  SHIP_NO: [], //호선
})

const initWorkStopCodeList = () => {
  //초기값 설정
  Promise.all([
    getCodeList('HHIF170'),
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_17',
      param: {},
    }),
  ]).then((res) => {
    codeList.RESTART_DIV = res[0].ORESULT_CUR
    codeList.SHIP_NO = res[1].ORESULT_CUR
  })
  let date = dayjs()
  workStopField.JSTOP_DT1 =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
  workStopField.JSTOP_TIME2 = '00:00'
  workStopField.JSTOP_EMP_NM = userStore.empNm
  workStopField.JSTOP_EMP_NO = userStore.empNo
  workStopField.JSTOP_ASGN_NM = userStore.asgnFullNm
  workStopField.JSTOP_ASGN_CD = userStore.asgnCd
  workStopField.JSTOP_DEPT_CD = userStore.deptCd
}

const openPopup = () => {
  dialog.value = true
  initWorkStopCodeList()
}
//로우 더블클릭 했을때 실행 (수정시)
const openPopup2 = (rowData) => {
  console.log('받은데이터', rowData)
  dialog.value = true
  // workStopField.JSTOP_DT1 =
  //   rowData.JSTOP_DT.substr(0, 4) +
  //   '-' +
  //   rowData.JSTOP_DT.substr(4, 2) +
  //   '-' +
  //   rowData.JSTOP_DT.substr(6, 2)
  workStopField.JSTOP_DT1 = rowData.JSTOP_DT
  workStopField.JSTOP_TIME2 = rowData.JSTOP_TIME.substr(0, 5)
  workStopField.SHIP_NO = rowData.SHIP_NO
  workStopField.JSTOP_NO = rowData.JSTOP_NO
  workStopField.JOB_LPLC_NM = rowData.JOB_LPLC_NM
  workStopField.JOB_MPLC_NM = rowData.JOB_MPLC_NM
  workStopField.JOB_SPLC_NM = rowData.JOB_SPLC_NM
  workStopField.JOB_LPLC = rowData.JOB_LPLC
  workStopField.JOB_MPLC = rowData.JOB_MPLC
  workStopField.JOB_SPLC = rowData.JOB_SPLC
  workStopField.JOB_PLC_DESC = rowData.JOB_PLC_DESC
  workStopField.JSTOP_DESC = rowData.JSTOP_DESC
  workStopField.CHG_EMP_NM = rowData.CHG_EMP_NM
  workStopField.CHG_EMP_NO = rowData.CHG_EMP_NO
  workStopField.ASGN_NM = rowData.ASGN_NM
  workStopField.VIO_EMP_ASGN = rowData.VIO_EMP_ASGN 
  if (rowData.RESTART_DT) {
    workStopField.RESTART_DT1 = rowData.RESTART_DT
    // workStopField.RESTART_DT1 =
    //   rowData.RESTART_DT.substr(0, 4) +
    //   '-' +
    //   rowData.RESTART_DT.substr(4, 2) +
    //   '-' +
    //   rowData.RESTART_DT.substr(6, 2)
  }
  if (rowData.RESTART_TIME) {
    workStopField.RESTART_TIME2 = rowData.RESTART_TIME.substr(0, 5)
  }

  workStopField.RESTART_DIV = rowData.RESTART_DIV
  workStopField.RESTART_DESC = rowData.RESTART_DESC
  workStopField.JSTOP_EMP_NM = rowData.JSTOP_EMP_NM
  workStopField.JSTOP_EMP_NO = rowData.JSTOP_EMP_NO
  workStopField.JSTOP_ASGN_NM = rowData.ASGN_SHRT_NM
  workStopField.SAVE_YN = 'Y'
  workStopField.ASGN_NM = rowData.ASGN_NM
  workStopField.ASGN_CD = rowData.ASGN_CD
  workStopField.BSNS_CD = rowData.BSNS_CD
  workStopField.DEPT_CD = rowData.DEPT_CD
  workStopField.FILE_ID = rowData.FILE_ID
  workStopField.WORKER_CNT = rowData.WORKER_CNT
  workStopField.SAGO_DIV_L = rowData.SAGO_DIV_L
  workStopField.SAGO_DIV_M = rowData.SAGO_DIV_M
  workStopField.SAGO_DIV_S = rowData.SAGO_DIV_S
  workStopField.SAGO_DIV_L_NM = rowData.SAGO_DIV_L_NM
  workStopField.SAGO_DIV_M_NM = rowData.SAGO_DIV_M_NM
  workStopField.SAGO_DIV_S_NM = rowData.SAGO_DIV_S_NM
}

const closePopup = () => {
  dialog.value = false
  //팝업닫을때 초기화
  for (let i in workStopField) {
    workStopField[i] = ''
  }
  emit('closed')
}

const onButtonsClick = (btn) => {
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

//저장관련 로직 시작
const beforeSave = () => {
  if (!workStopField.JOB_SPLC) {
    Message.warn(t('작업장소는 필수값입니다.'))
    return false
  } else if (!workStopField.WORKER_CNT) {
    Message.warn(t('작업인원은 필수값입니다.'))
    return false
  } else if (!workStopField.SAGO_DIV_L_NM) {
    Message.warn(t('잠재사고유형은 필수값입니다.'))
    return false
  } else if (!workStopField.JSTOP_DESC) {
    Message.warn(t('중지상세는 필수값입니다.'))
    return false
  } else if (!workStopField.CHG_EMP_NO) {
    Message.warn(t('작업담당자는 필수값입니다.'))
    return false
  } else if (!workStopField.ASGN_NM) {
    Message.warn(t('소속조직은 필수값입니다.'))
    return false
  } else if (!workStopField.BSNS_CD) {
    Message.warn(t('소속조직은 필수값입니다.'))
    return false
  } else if (!workStopField.SAGO_DIV_L) {
    Message.warn(t('잠재사고유형은 필수값입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    JSTOP_NO: workStopField.JSTOP_NO,
    JSTOP_DT1: workStopField.JSTOP_DT1, //중지일자
    JSTOP_TIME2: workStopField.JSTOP_TIME2.substring(0, 5), //중지시간
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
    RESTART_TIME2: workStopField.RESTART_TIME2.substring(0, 5),
    RESTART_DIV: workStopField.RESTART_DIV,
    RESTART_DESC: workStopField.RESTART_DESC,
    JSTOP_EMP_NO: workStopField.JSTOP_EMP_NO,
    JSTOP_ASGN_CD: workStopField.JSTOP_ASGN_CD,
    JSTOP_DEPT_CD: workStopField.JSTOP_DEPT_CD,
    USER_ID: userStore.userId,
    SAVE_YN: workStopField.SAVE_YN === 'Y' ? 'Y' : 'N',
    COMPANY: userStore.cmpnyDiv,
    FILE_ID: workStopField.FILE_ID,
    SAGO_DIV_L: workStopField.SAGO_DIV_L,
    SAGO_DIV_M: workStopField.SAGO_DIV_M,
    SAGO_DIV_S: workStopField.SAGO_DIV_S,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE06',
    list: saveParam,
  })
}

const afterSave = () => {
  setHdPayStop()
  closePopup()
}

//저장관련 로직 끝

//안전페이 지급중단 로직 시작
const setHdPayStop = async () => {
  if(workStopField.CHG_CMPNY_DIV !== '') {
    let saveParam = []
    let day = dayjs()
    let setHdPayStopParam = {
      CMPNY_DIV: workStopField.CHG_CMPNY_DIV, //사업장구분
      YEAR: dayjs().$y, //현재년도
      MNTH: (dayjs().$M + 1).toString().padStart(2, '0'), //현재월
      EMP_NO: workStopField.CHG_EMP_NO, //지급중단 대상자 사번
      PAYMENT_STOP_SEQ: 0, //지급중단 SEQ
      BSNS_CD: workStopField.BSNS_CD, //지급중단 대상자 사업부
      DEPT_CD: workStopField.DEPT_CD, //지급중단 대상자 부서코드
      ASGN_CD: workStopField.ASGN_CD, //지급중단 대상자 소속코드
      ASGN_NAME: workStopField.ASGN_NM, //지급중단 대상자 소속명
      EMP_NAME: workStopField.CHG_EMP_NM, //지급중단 대상자 성명
      ORGN_DIV: workStopField.USER_DIV, //지급중단 대상자 조직구분(A=직업,B=사내협력사)
      PAYMENT_STOP_TYPE: 'A', //지급중단타입(A:개인,B:조직)
      PAYMENT_STOP_CD: '30', //지급중단구분(HHIC40)
      PAYMENT_STOP_DETAIL_CD: '80', //지급중단상세(HHIC50)
      PAYMENT_STOP_INSERT_DATE: '', //지급중단 등록일
      PAYMENT_STOP_FROM: day.format('YYYY-MM-DD'), //지급중단 시작일
      PAYMENT_STOP_TO: day.add(1, 'day').format('YYYY-MM-DD'), //지급중단 종료일
      PAYMENT_YN: 'Y', //지급중단 여부
      REMARK: '', //비고
      INSERT_USER_ID: userStore.userId, //등록자
      INSERT_USER_IP: userStore.clientIp, //등록자 IP
      UPDATE_USER_ID: '', //수정자
      UPDATE_USER_IP: '', //수정자IP
    }
    saveParam.push(setHdPayStopParam)
    console.log('안전페이', saveParam)
    await commonExecuteApi({
      queryId: 'EDUDB0040_TAB01_SAVE_01',
      list: saveParam,
    })
  }
}
//안전페이 지급중단 로직 끝

//잠재사고유형 오픈 이벤트
const openSagoDivPopup = () => {
  sagoDivPopup.value.openPopup('잠재사고')
}

//잠재사고유형 선택 이벤트
const selectedSagoDivPopup = (val) => {
  workStopField.SAGO_DIV_L = val[0].COD
  workStopField.SAGO_DIV_L_NM = val[0].TXT
  workStopField.SAGO_DIV_M = val[1].COD
  workStopField.SAGO_DIV_M_NM = val[1].TXT
  workStopField.SAGO_DIV_S = val[2].COD
  workStopField.SAGO_DIV_S_NM = val[2].TXT
}

//작업장소 클릭 이벤트
const openWorkStopLocation = () => {
  workStopLocation.value.openPopup('장소')
}

//작업장소 선택 이벤트
const selectedWorkStopLocation = (val) => {
  workStopField.JOB_LPLC = val[0].COD
  workStopField.JOB_LPLC_NM = val[0].TXT
  workStopField.JOB_MPLC = val[1].COD
  workStopField.JOB_MPLC_NM = val[1].TXT
  workStopField.JOB_SPLC = val[2].COD
  workStopField.JOB_SPLC_NM = val[2].TXT
}

//작업담당자성명 클릭 이벤트
const openWorkStopEmpPopup = () => {
  workStopEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    EMP_NM: workStopField.CHG_EMP_NM,
  })
}

//작업담당자성명 선택 이벤트
const selectedWorkStopEmpPopup = (val) => {
  workStopField.CHG_EMP_NM = val.EMP_NM
  workStopField.CHG_EMP_NO = val.EMP_NO
  workStopField.BSNS_CD = val.BSNS_CD
  workStopField.DEPT_CD = val.DEPT_CD
  workStopField.ASGN_CD = val.ASGN_CD
  workStopField.VIO_EMP_ASGN = val.ASGN_NM
  if(val.USER_DIV === 'D'){
    workStopField.ASGN_NM = null //위반조직
  }else{
    workStopField.ASGN_NM = val.ASGN_NM //위반조직
  }
  workStopField.USER_DIV = val.USER_DIV
  workStopField.CHG_CMPNY_DIV = val.CMPNY_DIV
}

//작업담당소속 클릭 이벤트
const openWorkStopDeptPopup = () => {
  workStopDeptPopup.value.openPopup()
}

//작업담당소속 선택 이벤트
const selectedWorkStopDeptPopup = (val) => {
  workStopField.ASGN_NM = val.ASGN_FULL_NM
  workStopField.ASGN_CD = val.ASGN_CD
  workStopField.BSNS_CD = val.BSNS_CD
  workStopField.DEPT_CD = val.DEPT_CD
}

//작업중지처리자 성명 클릭 이벤트
const openWorkStopProcessEmpPopup = () => {
  workStopProcessEmpPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    EMP_NM: workStopField.JSTOP_EMP_NM,
  })
}

//작업중지처리자 선택 이벤트
const selectedWorkStopProcessEmpPopup = (val) => {
  workStopField.JSTOP_EMP_NM = val.EMP_NM
  workStopField.JSTOP_EMP_NO = val.EMP_NO
  workStopField.JSTOP_DEPT_CD = val.DEPT_CD
  workStopField.JSTOP_ASGN_NM = val.ASGN_NM
  workStopField.JSTOP_ASGN_CD = val.ASGN_CD
}

//파일첨부 클릭 이벤트
const openFileUpload = () => {
  if (!workStopField.FILE_ID) {
    fileUpload.value.openPopup()
  } else {
    fileUpload.value.openPopup(workStopField.FILE_ID)
  }
}

//파일첨부 이벤트
const fileUploaded = (val) => {
  if (!workStopField.FILE_ID) {
    workStopField.FILE_ID = val.fileId
  }
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
    eager
    persistent
    width="1200"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>작업중지조치</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea mb-0">
            <span class="sheetTitle">작업중지</span>
            <div class="d-flex mt-2">
              <i-input
                width="150px"
                :label="$t('중지일시')"
                top-label
                type="date"
                v-model="workStopField.JSTOP_DT1"
              ></i-input>
              <i-input
                width="150px"
                class="mt-5"
                type="time"
                v-model="workStopField.JSTOP_TIME2"
              ></i-input>
              <!-- <i-input
                width="150px"
                :label="$t('호선')"
                top-label
                v-model="workStopField.SHIP_NO"
              ></i-input> -->
              <i-select 
                v-model="workStopField.SHIP_NO"
                :label="$t('호선No.')"
                top-label
                label-width="50px"
                width="200px"
                :items="codeList.SHIP_NO"
                item-value="WORK_NO"
                item-title="WORK_NO"
              />
              <i-input
                width="80px"
                :label="$t('작업인원')"
                top-label
                v-model="workStopField.WORKER_CNT"
                number
                required
              >
              </i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="200px"
                :label="$t('작업장소')"
                top-label
                v-model="workStopField.JOB_LPLC_NM"
                readonly
                required
                append-inner-icon="mdi-magnify"
                @click:appendInner="openWorkStopLocation"
              ></i-input>
              <i-input
                width="200px"
                class="mt-5"
                v-model="workStopField.JOB_MPLC_NM"
                readonly
              ></i-input>
              <i-input
                width="200px"
                class="mt-5"
                v-model="workStopField.JOB_SPLC_NM"
                readonly
              ></i-input>
              <i-input
                :label="$t('작업장소상세')"
                top-label
                width="300px"
                v-model="workStopField.JOB_PLC_DESC"
              ></i-input>
              <v-btn class="mt-5" @click="openFileUpload">파일첨부</v-btn>
            </div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('잠재사고유형')"
                width="200px"
                top-label
                v-model="workStopField.SAGO_DIV_L_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openSagoDivPopup"
                required
                readonly
              >
              </i-input>
              <i-input
                width="200px"
                class="mt-5"
                v-model="workStopField.SAGO_DIV_M_NM"
                readonly
              ></i-input>
              <i-input
                width="200px"
                class="mt-5"
                v-model="workStopField.SAGO_DIV_S_NM"
                readonly
              ></i-input>
            </div>
            <div class="d-flex mt-2">
              <i-textarea
                width="100%"
                :label="$t('중지중지사유')"
                top-label
                required
                v-model="workStopField.JSTOP_DESC"
              ></i-textarea>
            </div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('작업담당자성명')"
                top-label
                width="200px"
                v-model="workStopField.CHG_EMP_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openWorkStopEmpPopup"
                required
              ></i-input>
              <i-input
                :label="$t('사번')"
                top-label
                width="200px"
                v-model="workStopField.CHG_EMP_NO"
                readonly
              ></i-input>
              <i-input
                  v-model="workStopField.VIO_EMP_ASGN"
                  :label="$t('소속조직')"
                  width="200px"
                  top-label
                  readonly
              ></i-input>
            </div>
            <div class="d-flex mt-2">
              
               <i-input
                :label="$t('작업담당소속')"
                width="300px"
                top-label
                v-model="workStopField.ASGN_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openWorkStopDeptPopup"
                required
              ></i-input>
              <span class="mt-5"
                >(작업담당소속이 다를 경우 수정 바랍니다.)</span
              >
            </div>
            <span class="sheetTitle mt-2">작업재개</span>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('작업재개')"
                top-label
                width="150px"
                type="date"
                v-model="workStopField.RESTART_DT1"
              ></i-input>
              <i-input
                width="150px"
                class="mt-5"
                type="time"
                v-model="workStopField.RESTART_TIME2"
              ></i-input>
              <i-select
                :label="$t('작업재개구분')"
                top-label
                width="200px"
                v-model="workStopField.RESTART_DIV"
                :items="codeList.RESTART_DIV"
                item-title="TXT"
                item-value="COD"
              ></i-select>
            </div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('조치내용')"
                top-label
                width="90%"
                v-model="workStopField.RESTART_DESC"
              ></i-input>
            </div>
            <span class="sheetTitle mt-2">작업중지처리자</span>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('성명')"
                top-label
                width="200px"
                v-model="workStopField.JSTOP_EMP_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openWorkStopProcessEmpPopup"
                readonly
              ></i-input>
              <i-input
                :label="$t('사번')"
                top-label
                width="200px"
                v-model="workStopField.JSTOP_EMP_NO"
                readonly
              ></i-input>
              <i-input
                :label="$t('단속자소속')"
                top-label
                width="200px"
                v-model="workStopField.JSTOP_ASGN_NM"
                readonly
              >
              </i-input>
            </div>
          </v-sheet>
        </div>
        <EmpPopup
          ref="workStopEmpPopup"
          @selected="selectedWorkStopEmpPopup"
        ></EmpPopup>
        <EmpPopup
          ref="workStopProcessEmpPopup"
          @selected="selectedWorkStopProcessEmpPopup"
        ></EmpPopup>
        <CommonCodePopUpSAF
          ref="workStopLocation"
          @selected="selectedWorkStopLocation"
        ></CommonCodePopUpSAF>
        <CommonCodePopUpSAF ref="sagoDivPopup" @selected="selectedSagoDivPopup">
        </CommonCodePopUpSAF>
        <IUploadPopup ref="fileUpload" @uploaded="fileUploaded"></IUploadPopup>
        <DeptPopup
          ref="workStopDeptPopup"
          @selected="selectedWorkStopDeptPopup"
        ></DeptPopup>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style>
.sheetTitle {
  font-size: 20px;
  font-weight: bold;
}
</style>
