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
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IUploadImage from '@/components/IUploadImage.vue'
import OZReport from '@/components/OZReport.vue'
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'

const reportParam = reactive(['IN_CMPNY_DIV=', 'IN_MNG_NO='])
const reportName = ref('/manage/hse/SAFDC0010.ozr')
// OzReport 팝업 여부
const showOz = ref(false)
const imageUpload = ref(null)
const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const userLogStore = useLogsStore()
const dialog = ref(false)
const grdMain = ref(null)
const locationPopup = ref(null)
const deptPopup = ref(null)
const emit = defineEmits(['closed'])
const menuTitle = ref(null)
const sagoDivPopup = ref(null) //잠재사고유형 팝업
const municipalField = reactive({
  CMPNY_DIV: '', //사업장구분
  MNG_NO: '', //관리번호
  BSNS_CD: '', //사업부코드
  REC_DEPT_CD: '', //수신부서코드
  NOTI_SCAN: '', //파일아이디
  NOTI_LPLC: '', //지적장소(대)
  NOTI_MPLC: '', //지적장소(중)
  NOTI_SPLC: '', //지적장소(소)
  SEND_ASGN_CD: '', //발신조직
  SEND_ASGN_NM: '', //발신
  SEND_DEPT_CD: '', //발신부서
  CHK_EMP_NM: '', //점검자
  CHK_EMP_NO: '', //점검자사번
  APPROVE_ID: '', //결재상신ID
  ACT_RSLT: '', //조치결과
  ACT_RSLT_SCAN: '', //조치결과 파일아이디
  ACT_DEPT_CD: '', //조치부서
  ACT_ASGN_CD: '', //조치조직
  ACT_EMP_NO: '', //조치자사번
  ACT_TEL_NO: '', //조치자전화
  STATUS: '', //진행상태
  CLOSE_DT: '', //종결일자
  CLOSE_ASGN_CD: '', //종결자소속
  CLOSE_EMP_NO: '', //종결자사번
  SAGO_DIV_LIST: '', //사고유형
  CLOSE_DEPT_CD: '', //종결자부서
  CHK_TEL_NO: '', //전화
  NOTI_DT: '', //점검일자
  REC_ASGN_NM: '', //수신
  REC_ASGN_CD: '', //수식조직
  REQ_REPLY_DT: '', //회신요구일
  NOTI_TITLE: '', //제목
  LOCATION_NM: '', //장소
  NOTI_PLC_DESC: '', //장소상세
  SHIP_NO: '', //호선NO
  PROBLEM_DESC: '', //문제점
  REQUIRE_DESC: '', //시정요구(안)
  COMPANY: '', //위반자 사업장구분
  APP_EMP_NO: '', //결재승인자
  INSERT_USER_ID: '', //작성자
  REJ_DESC: '', //반려사유
  SAGO_DIV_L_CODE: '', //잠재사고유형코드(대)
  SAGO_DIV_M_CODE: '', //잠재사고유형코드(중)
  SAGO_DIV_S_CODE: '', //잠재사고유형코드(소)
  SAGO_DIV_L_NM: '', //잠재사고유형이름(대)
  SAGO_DIV_M_NM: '', //잠재사고유형이름(중)
  SAGO_DIV_S_NM: '', //잠재사고유형이름(소)
})

const codeList = reactive({
  APP_EMP_NO: [], //결제자
  SHIP_NO: [], // 호선번호
})

const initCodList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_04',
      param: {
        CMPNY_DIV: municipalField.CMPNY_DIV,
        DANSOK_EMP_NO: municipalField.CHK_EMP_NO,
      },
    }),
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_17',
      param: {},
    }),
  ]).then((res) => {
    codeList.APP_EMP_NO = res[0].ORESULT_CUR
    codeList.SHIP_NO = res[1].ORESULT_CUR
  })
}

const openPopup = () => {
  dialog.value = true
  vm.$nextTick(() => {
    initField()
    initCodList()
  })
}

const openPopup2 = (rowData) => {
  console.log('받은데이터', rowData)
  dialog.value = true
  for (const [key, value] of Object.entries(rowData)) {
    if (municipalField.hasOwnProperty(key)) {
      municipalField[key] = value
    }
  }
  //이미지파일 관련 로직
  if (!rowData.NOTI_SCAN) {
    imageUpload.value.setGuid()
    municipalField.NOTI_SCAN = imageUpload.value.guid
  } else {
    imageUpload.value.setGuid(rowData.NOTI_SCAN)
    municipalField.NOTI_SCAN = imageUpload.value.guid
    imageUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
  setButtonStatus() //버튼상태 수정
  initCodList()
  // municipalField.CMPNY_DIV = rowData.CMPNY_DIV
  // municipalField.MNG_NO = rowData.MNG_NO
  // municipalField.SEND_ASGN_NM = rowData.SEND_ASGN_NM
  // municipalField.SEND_ASGN_CD = rowData.SEND_ASGN_CD
  // municipalField.SEND_DEPT_CD = rowData.SEND_DEPT_CD
  // municipalField.CHK_EMP_NM = rowData.CHK_EMP_NM
  // municipalField.CHK_EMP_NO = rowData.CHK_EMP_NO
  // municipalField.CHK_TEL_NO = rowData.CHK_TEL_NO
  // municipalField.NOTI_DT = rowData.NOTI_DT
  // municipalField.REC_ASGN_NM = rowData.REC_ASGN_NM
  // municipalField.REC_ASGN_CD = rowData.REC_ASGN_CD
  // municipalField.NOTI_LPLC = rowData.NOTI_LPLC
  // municipalField.NOTI_MPLC = rowData.NOTI_MPLC
  // municipalField.NOTI_SPLC = rowData.NOTI_SPLC
  // municipalField.NOTI_TITLE = rowData.NOTI_TITLE
  // municipalField.LOCATION_NM = rowData.LOCATION_NM
  // municipalField.NOTI_PLC_DESC = rowData.NOTI_PLC_DESC
  // municipalField.SHIP_NO = rowData.SHIP_NO
  // municipalField.PROBLEM_DESC = rowData.PROBLEM_DESC
  // municipalField.REQUIRE_DESC = rowData.REQUIRE_DESC
  // municipalField.REQ_REPLY_DT = rowData.REQ_REPLY_DT

  //
}

//각 컴포넌트에 초기값 세팅
const initField = () => {
  municipalField.SEND_ASGN_NM = userStore.asgnFullNm
  municipalField.SEND_ASGN_CD = userStore.asgnCd
  municipalField.SEND_DEPT_CD = userStore.deptCd
  municipalField.CHK_EMP_NM = userStore.empNm
  municipalField.CHK_EMP_NO = userStore.empNo
  municipalField.CHK_TEL_NO = userStore.hndPhn
  municipalField.CMPNY_DIV = userStore.cmpnyDiv
  imageUpload.value.setGuid()
  municipalField.NOTI_SCAN = imageUpload.value.guid
  menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화
  menuTitle.value.disableBtn('btnApply', true)

  defaultDate()
}

//결제상태(진행상태에 따른 버튼 활성화,비활성화 로직)
const setButtonStatus = () => {
  //작성자이면
  if (userStore.empNo === municipalField.INSERT_USER_ID) {
    //작성자이고 진행상태가 작성중일때
    if (municipalField.STATUS === '10') {
      console.log('작성자이고 진행상태가 작성중일때')
      menuTitle.value.disableBtn('btnUpdate', false) //저장 활성화
      menuTitle.value.disableBtn('btnReqApply', false) //결재상신 활성화
    }
    //작성자이고 진행상태가 반려일때
    else if (municipalField.STATUS === '11') {
      console.log('작성자이고 진행상태가 반려일때')
      menuTitle.value.disableBtn('btnUpdate', false) //저장 활성화
      menuTitle.value.disableBtn('btnReqApply', false) //결재상신 활성화
    }
    //작성자이고 승인대기 상태일때
    else if (municipalField.STATUS === '20') {
      console.log('작성자이고 진행상태가 승인대기 상태일때')
      menuTitle.value.disableBtn('btnUpdate', false) //저장 활성화
      menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화
    }
    //작성자이고 조치대기 상태일때
    else if (municipalField.STATUS === '30') {
      console.log('작성자이고 조치대기 상태일때')
      menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화
    }
    //작성자이고 재조치요청 상태일때
    else if (municipalField.STATUS === '31') {
      console.log('작성자이고 재조치요청 상태일때')
      menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화
    }
    //작성자이고 조치완료 상태일때
    else if (municipalField.STATUS === '40') {
      console.log('작성자이고 조치완료 상태일때')
      menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화
    }
    //작성자이고 종결상태일때
    else if (municipalField.STATUS === '50') {
      console.log('작성자이고 종결상태일때')
      menuTitle.value.disableBtn('btnUpdate', true) //저장 비활성화
      menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화
    }
  }
  //작성자가 아니면 출력버튼 제외 비활성화
  else {
    menuTitle.value.disableBtn('btnUpdate', true) //저장 비활성화
    menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화
  }
}

const defaultDate = () => {
  //디폴트 날짜 설정
  //점검일자 : 오늘날짜 회신요구일 오늘날짜 + 3일
  let date = dayjs()
  let REQ_REPLY_DT = dayjs().add(3, 'day')
  municipalField.REQ_REPLY_DT =
    REQ_REPLY_DT.$y +
    '-' +
    (REQ_REPLY_DT.$M + 1).toString().padStart(2, '0') +
    '-' +
    REQ_REPLY_DT.$D.toString().padStart(2, '0')

  municipalField.NOTI_DT =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

const closePopup = () => {
  dialog.value = false
  //팝업닫을때 초기화
  for (let i in municipalField) {
    municipalField[i] = ''
  }
  menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 활성화
  menuTitle.value.disableBtn('btnReqApply', false) //결재상신 활성화
  imageUpload.value.clearGrid()

  emit('closed')
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnReqApply') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeApproval)
      .setQuery(approval)
      .setAfter(afterApproval)
      .setConfirmMessage('결재상신 하시겠습니까?')
      .run()
  } else if (btn.id === 'btnPrint') {
    print()
  } else {
    closePopup()
  }
}

//출력관련 로직 시작
const print = () => {
  reportParam[0] = 'IN_CMPNY_DIV='
  reportParam[1] = 'IN_MNG_NO='
  reportParam[0] += municipalField.CMPNY_DIV
  reportParam[1] += municipalField.MNG_NO
  showOz.value = true
}
//출력관련 로직 끝

//결재관련 로직 시작
const beforeApproval = () => {
  if (!municipalField.MNG_NO) {
    Message.err(t('저장되지 않는 데이터는 결재상신 할 수 없습니다.'))
    return false
  }
  return true
}

const approval = () => {
  let day = dayjs()
  let approvalParam = {
    CMPNY_DIV: userStore.cmpnyDiv, //로그인유저 사업부
    YEAR: day.$y, //결재올리는 년도
    APPROVE_ID:
      'SAFDC0010' +
      '_' +
      userStore.userId +
      '_' +
      day.$y +
      (day.$M + 1).toString().padStart(2, '0') +
      day.$D.toString().padStart(2, '0') +
      day.$H.toString().padStart(2, '0') +
      day.$m.toString().padStart(2, '0') +
      day.$s.toString().padStart(2, '0'), //결재ID
    FORM_ID: 'SAFDC0010',
    APP_EMP_NO: municipalField.APP_EMP_NO,
    APPROVE_GBN: 'I', //I로고정(내부결재)
    APP_REQ_EMP_NO: userStore.userId, //결재상신자
    APP_STATUS: 'N', //결재상태는 미결로
    PATH: '/30_safety/SAF_A/SAFDC0010',
    USER_ID: userStore.userId, //로그인유저 아이디
  }
  return commonExecuteApi({
    queryId: 'OPRAB0010_SAVE_01',
    list: [approvalParam],
  }).then(() => {
    municipalField.APPROVE_ID = approvalParam.APPROVE_ID
    municipalField.APP_EMP_NO = municipalField.APP_EMP_NO
    municipalField.STATUS = '20' //진행상태를 승인대기로 변경
  })
}

const afterApproval = () => {
  saveData()
  closePopup()
}

//결재관련 로직 끝

//저장관련 로직 시작
const beforeSave = () => {
  //필수값 수신,제목,문제점
  if (!municipalField.NOTI_TITLE) {
    Message.err(t('제목은 필수값입니다.'))
    return false
  } else if (!municipalField.REC_ASGN_CD) {
    Message.err(t('수신조직은 필수값입니다.'))
    return false
  } else if (!municipalField.SAGO_DIV_L_CODE) {
    Message.err(t('잠재사고유형은 필수값입니다.'))
    return false
  } else if (!municipalField.PROBLEM_DESC) {
    Message.err(t('문제점은 필수값입니다.'))
    return false
  } else if (!municipalField.APP_EMP_NO) {
    Message.err(t('결제자는 필수값입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    MNG_NO: municipalField.MNG_NO,
    NOTI_DT: municipalField.NOTI_DT,
    BSNS_CD: userStore.bsnsCd,
    REC_DEPT_CD: municipalField.REC_DEPT_CD,
    NOTI_TITLE: municipalField.NOTI_TITLE,
    NOTI_SCAN: municipalField.NOTI_SCAN,
    PROBLEM_DESC: municipalField.PROBLEM_DESC,
    REQUIRE_DESC: municipalField.REQUIRE_DESC,
    NOTI_LPLC: municipalField.NOTI_LPLC,
    NOTI_MPLC: municipalField.NOTI_MPLC,
    NOTI_SPLC: municipalField.NOTI_SPLC,
    NOTI_PLC_DESC: municipalField.NOTI_PLC_DESC,
    SEND_ASGN_CD: municipalField.SEND_ASGN_CD,
    CHK_EMP_NO: municipalField.CHK_EMP_NO,
    CHK_TEL_NO: municipalField.CHK_TEL_NO,
    REQ_REPLY_DT: municipalField.REQ_REPLY_DT,
    APPROVE_ID: municipalField.APPROVE_ID,
    ACT_RSLT: '',
    ACT_RSLT_SCAN: '',
    ACT_DEPT_CD: '',
    ACT_ASGN_CD: '',
    ACT_EMP_NO: '',
    ACT_TEL_NO: '',
    STATUS: municipalField.MNG_NO === '' ? '10' : municipalField.STATUS, //신규저장이면 결재상태를 10(작성중)으로 변경
    CLOSE_DT: '',
    CLOSE_ASGN_CD: '',
    CLOSE_EMP_NO: '',
    SAGO_DIV_LIST: '',
    CLOSE_DEPT_CD: '',
    SEND_DEPT_CD: municipalField.SEND_DEPT_CD,
    REC_ASGN_CD: municipalField.REC_ASGN_CD,
    USER_ID: userStore.userId,
    SHIP_NO: municipalField.SHIP_NO,
    COMPANY: userStore.cmpnyDiv,
    APP_EMP_NO: municipalField.APP_EMP_NO, //municipalField.APP_EMP_NO,
    SAGO_DIV_L_CODE: municipalField.SAGO_DIV_L_CODE,
    SAGO_DIV_M_CODE: municipalField.SAGO_DIV_M_CODE,
    SAGO_DIV_S_CODE: municipalField.SAGO_DIV_S_CODE,
  }
  saveParam.push(saveData)
  console.log('세이브파람', saveParam)
  return commonExecuteApi({
    queryId: 'SAFDC0010_SAVE04',
    list: saveParam,
  })
}

const afterSave = () => {
  closePopup()
}
//저장관련 로직 끝

//장소클릭 이벤트
const openLocationPopup = () => {
  locationPopup.value.openPopup('장소')
}

//장소 선택이벤트
const selectedLocation = (val) => {
  municipalField.NOTI_LPLC = val[0].COD
  municipalField.NOTI_MPLC = val[1].COD
  municipalField.NOTI_SPLC = val[2].COD
  municipalField.LOCATION_NM = val[2].TXT
}

//잠재사고유형 오픈 이벤트
const openSagoDivPopup = () => {
  sagoDivPopup.value.openPopup('잠재사고')
}

//잠재사고유형 선택 이벤트
const selectedSagoDivPopup = (val) => {
  municipalField.SAGO_DIV_L_CODE = val[0].COD
  municipalField.SAGO_DIV_L_NM = val[0].TXT
  municipalField.SAGO_DIV_M_CODE = val[1].COD
  municipalField.SAGO_DIV_M_NM = val[1].TXT
  municipalField.SAGO_DIV_S_CODE = val[2].COD
  municipalField.SAGO_DIV_S_NM = val[2].TXT
}

//수신클릭 이벤트
const openDeptPopup = () => {
  deptPopup.value.openPopup()
}

//수신 선택 이벤트
const selectedDept = (val) => {
  municipalField.REC_ASGN_NM = val.ASGN_FULL_NM
  municipalField.REC_ASGN_CD = val.ASGN_CD
  municipalField.REC_DEPT_CD = val.DEPT_CD
  //municipalField.
}

//사진 업로드 이벤트
const uploadPicture = (val) => {
  municipalField.NOTI_SCAN = val.FILE_ID
}

watch(() => municipalField.CHK_EMP_NO, (newValue, oldValue) => {
    Promise.all([
      commonSearchApi({
        queryId: 'SAFDC0010_SEARCH_04', 
        param: {
          //CMPNY_DIV: 'HHI',
          CMPNY_DIV: municipalField.CMPNY_DIV,
          DANSOK_EMP_NO: municipalField.CHK_EMP_NO,
        },
      }),
    ]).then((res) => {
      codeList.APP_EMP_NO = res[0].ORESULT_CUR
    })
  }
)

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
    width="1500"
    height="1500"
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
      <span>안전/환경 시정통보서 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnReqApply', 'btnPrint', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <div class="d-flex flex-column fill-height">
          <IGridTitle
            class="pl-0"
            title="기본정보"/>
          <v-sheet class="searchArea mb-0">
            <div class="d-flex mb-2">
              <i-input
                :label="$t('발신')"
                width="400px"
                top-label
                readonly
                v-model="municipalField.SEND_ASGN_NM"
              ></i-input>
              <i-input
                :label="$t('점검자')"
                width="200px"
                top-label
                readonly
                v-model="municipalField.CHK_EMP_NM"
              ></i-input>
              <i-input
                :label="$t('전화')"
                width="200px"
                top-label
                v-model="municipalField.CHK_TEL_NO"
              ></i-input>
              <i-input
                :label="$t('점검일자')"
                width="150px"
                top-label
                type="date"
                v-model="municipalField.NOTI_DT"
              ></i-input>
              <i-input
                :label="$t('회신요구일')"
                width="150px"
                top-label
                type="date"
                v-model="municipalField.REQ_REPLY_DT"
              ></i-input>
              <i-select
                :label="$t('결재자')"
                width="200px"
                top-label
                :items="codeList.APP_EMP_NO"
                item-title="APP_EMP_NM"
                item-value="APP_EMP_NO"
                required
                v-model="municipalField.APP_EMP_NO"
              >
              </i-select>
            </div>
            <div class="d-flex mb-2">
              <i-input
                :label="$t('제목')"
                width="600px"
                top-label
                v-model="municipalField.NOTI_TITLE"
                required
              ></i-input>
              <i-input
                :label="$t('수신')"
                width="300px"
                top-label
                readonly
                append-inner-icon="mdi-magnify"
                @click:appendInner="openDeptPopup"
                required
                v-model="municipalField.REC_ASGN_NM"
              ></i-input>
            </div>
            <div class="d-flex mb-2">
              <i-input
                :label="$t('장소')"
                top-label
                width="200px"
                readonly
                append-inner-icon="mdi-magnify"
                @click:appendInner="openLocationPopup"
                v-model="municipalField.LOCATION_NM"
              ></i-input>
              <i-input
                :label="$t('장소상세')"
                top-label
                width="300px"
                v-model="municipalField.NOTI_PLC_DESC"
              ></i-input>
              <i-select
                :label="$t('호선No.')"
                top-label
                width="200px"
                v-model="municipalField.SHIP_NO"
                :items="codeList.SHIP_NO"
                item-value="WORK_NO"
                item-title="WORK_NO"
              ></i-select>
              <i-input
                :label="$t('잠재사고유형')"
                width="200px"
                top-label
                v-model="municipalField.SAGO_DIV_L_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openSagoDivPopup"
                required
                readonly
              >
              </i-input>
              <i-input
                width="200px"
                class="mt-5"
                v-model="municipalField.SAGO_DIV_M_NM"
                readonly
              ></i-input>
              <i-input
                width="200px"
                class="mt-5"
                v-model="municipalField.SAGO_DIV_S_NM"
                readonly
              ></i-input>
            </div>
            <div>
              <IUploadImageMulit
                title="사진첨부"
                ref="imageUpload"
                @uploaded="uploadPicture"
              ></IUploadImageMulit>
            </div>
          </v-sheet>
          <IGridTitle
            title="문제점 및 시정요구안"/>
          <v-sheet class="searchArea mb-0">
            <div class="d-flex mt-2">
              <i-textarea
                :label="$t('문제점')"
                width="54.5%"
                top-label
                class="mb-2"
                v-model="municipalField.PROBLEM_DESC"
                required
              ></i-textarea>
              <i-textarea
                :label="$t('시정요구안')"
                width="44.3%"
                v-model="municipalField.REQUIRE_DESC"
              ></i-textarea>
            </div>
          </v-sheet>
          <CommonCodePopUpSAF
            ref="locationPopup"
            @selected="selectedLocation"
          ></CommonCodePopUpSAF>
          <CommonCodePopUpSAF
            ref="sagoDivPopup"
            @selected="selectedSagoDivPopup"
          >
          </CommonCodePopUpSAF>
          <DeptPopup
            ref="deptPopup"
            @selected="selectedDept"
            check-bar="true"
          ></DeptPopup>
          <OZReport
            :showPop="showOz"
            :reportName="reportName"
            :params="reportParam"
            @close="showOz = $event"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
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
</style>
