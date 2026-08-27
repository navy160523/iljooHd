<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import MNGDA0030Popup from './MNGDA0030Popup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' // 결재팝업
import { commonExecuteApi, commonSearchApi, commonSendApi } from '@/@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

  defineOptions({
    name: '10_management-MNG_D-MNGDA0030',
  })

const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련

const menuTitle = ref(null)
const menuTitleSub = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const mNGDA0030Popup = ref(null)
const deptPopup = ref(null)
const userStore = useUserStore() //유저정보
const ASGN_FULL_NM = ref('')
const approvalPopup = ref(null) // 결재
const searchArea = ref(null)
const cert_email = ref(null)
const eva_email = ref(null)
const mainSelectRow = ref(null)

const searchParams = reactive({
  //세부심사일정 조회조건
  CMPNY_DIV: userStore.cmpnyDiv, //회사코드
  YEAR: '', //년도
  BSNS_CD: '',
  DEPT_CD: '', //부서코드
  ASGN_CD: '',
  IN_OUT: '', //내/외부
  ASGN_NM: '', //부서이름
  //내부 : IN 외부 : OT
})

const searchParams2 = reactive({
  //부적합목록 조회조건
  CMPNY_DIV: '',
  YEAR: '',
  BSNS_CD: '',
  ASGN_CD: '',
  IN_OUT: '',
  SEQ: '',
})

let searchPopupParam = reactive({
  //조치결과등록 조회조건
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: '',
  BSNS_CD: '',
  ASGN_CD: '',
  IN_OUT: '',
  SEQ: '',
  ASGN_FULL_NM: '',
  ACTION_ATT_ID: '',
  ACTION_CD: '',
  STATUS: '',           //진행상태

  //진행상태 코드 목록
  /*
  10 : 작성중
  20 : 조치결과 등록대기
  30 : 심사원 검토 중
  40 : 심사원 검토완료
  50 : 결재중
  60 : 인증심사 완료

  1. 조치결과 등록대기   - 최초 등록 상태
  2. 심사원 검토 중      - 검토요청 시
  3. 심사원 검토완료     - 검토 완료 시
  4. 조치결과 등록대기   - 심사원 보완 요청 시(재작성 요청)
  5. 결재 중            - 결재 상신 시
  6. 인증심사 완료       - 결재완료 시
  7. 조치결과 등록대기   - 결재 반려 시

  */
})

const IN_OUT = reactive([
  { title: '전체', value: '' },
  { title: '내부', value: 'IN' },
  { title: '외부', value: 'OT' },
])

const codeList = reactive({
  resultcd: [],
})

// 년도
let getNowYear = new Date().toJSON().slice(0, 4).replace(/-/g, '/')
searchParams.YEAR = getNowYear

let saveParams = [] //저장파라미터

let STATUS = ref('') // 진행상태 값에 따라 부적합목록 수정여부 판단
//결재완료(70)이면 수정불가

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
  },
  fields: [
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      header: { text: t('부서') },
      mergeRule: { criteria: 'value' },
      editable: false,
    },
    {
      fieldName: 'IN_OUT_NM',
      dataType: 'text',
      header: { text: t('내/외부') },
      editable: false,
    },
    {
      fieldName: 'CERT_DT',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('심사일') },
      editable: false,
    },
    {
      fieldName: 'CERT_EMP_NM',
      dataType: 'text',
      header: { text: t('HSE 추진자') },
      editable: false,
    },
    {
      fieldName: 'CERT_EMP_TEL',
      dataType: 'text',
      header: { text: t('연락처') },
      editable: false,
    },
    {
      fieldName: 'RESULT_NM',
      dataType: 'text',
      header: { text: t('심사결과') },
      editable: false,
    },
    {
      fieldName: 'ACTION_CD',
      dataType: 'text',
      header: { text: t('작성완료') },
      editable: false,
    },
    {
      fieldName: 'APP_STATUS',
      dataType: 'text',
      header: { text: t('결재완료') },
      editable: false,
    },
    {
      fieldName: 'REMARKS',
      dataType: 'text',
      header: { text: t('비고') },
      editable: false,
    },
    {
      fieldName: 'STATUS_NM',
      dataType: 'text',
      header: { text: t('진행상태') },
      editable: false,
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      header: { text: t(' ') },
      visible: false,
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t(' ') },
      visible: false,
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t(' ') },
      visible: false,
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      header: { text: t(' ') },
      visible: false,
    },
    {
      fieldName: 'IN_OUT',
      dataType: 'text',
      header: { text: t(' ') },
      visible: false,
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'RESULT_CD',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'CERT_EMAIL',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'EVA_EMAIL',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'CERT_EMP',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'EVA_EMP',
      dataType: 'text',
      visible: false,
    },
  ],
  columns: [],
})

//그리드2 속성셋팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields: [
    {
      fieldName: 'CERT_NM',
      dataType: 'text',
      header: { text: t('인증규격') },
      editable: false,
    },
    {
      fieldName: 'CERT_ITEM',
      dataType: 'text',
      header: { text: t('심사항목') },
      editable: false,
    },
    {
      fieldName: 'RESULT_CD',
      dataType: 'text',
      header: { text: t('부적합등급') },
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'RESULT_CONTENTS',
      dataType: 'text',
      header: { text: t('부적합내용') },
      editable: false,
    },
    {
      fieldName: 'SOLUTION_PLAN',
      dataType: 'text',
      header: { text: t('개선조치방안') },
      editable: false,
    },
    {
      fieldName: 'RECEIVE_DT',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('회신요구일') },
      editable: false,
    },
    {
      fieldName: 'ACTION_CONTENTS1',
      dataType: 'text',
      header: { text: t('조치결과') },
      editable: false,
    },
    {
      fieldName: 'ACTION_CONTENTS2',
      dataType: 'text',
      header: { text: t('발생원인') },
      editable: false,
    },
    {
      fieldName: 'ACTION_CONTENTS3',
      dataType: 'text',
      header: { text: t('재발방지대책') },
      editable: false,
    },
    {
      fieldName: 'SA_COMMENT',
      dataType: 'text',
      header: { text: t('검토의견') },
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      editable: false,
    },
    {
      fieldName: 'FILE_YN',
      dataType: 'text',
      header: { text: t('첨부여부') },
      editable: false,
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t(' ') },
      visible: false,
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      header: { text: t(' ') },
      visible: false,
    },
    {
      fieldName: 'IN_OUT',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'ACTION_ATT_ID',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'SEQ',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'ACTION_DT',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'ACTION_DT_DIV',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'ACTION_EMP',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'ACTION_CD',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
    {
      fieldName: 'USER_ID',
      dataType: 'text',
      header: { text: t('') },
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    if (searchParams.ASGN_NM === '') {
      Message.warn(t('부서를 선택해 주세요.'))
      return false
    } else {
      new queryFlowHelper(vm, t)
        .setGridList([grdMain, grdSub])
        .setSearchArea(searchArea)
        .setBefore(beforeSearch)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
    }
  
  // 검토요청
  } else if (btn.id === 'btnReqReview') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain, grdSub])
      .setBefore(beforeSaveReq)
      .setQuery(saveDataReq)
      .setAfter(afterSaveReq)
      .run()

  // 검토요청 취소
  } else if (btn.id === 'btnCancelReqReview') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain, grdSub])
      .setBefore(beforeSaveCan)
      .setQuery(saveDataCan)
      .setAfter(afterSaveCan)
      .run()

  // 보완요청    
  } else if (btn.id === 'btnReWrite') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain, grdSub])
      .setBefore(beforeSaveRe)
      .setQuery(saveDataRe)
      .setAfter(afterSaveRe)
      .run()

  // 검토완료    
  } else if (btn.id === 'btnFinishReview') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain, grdSub])
      .setBefore(beforeSaveFin)
      .setQuery(saveDataFin)
      .setAfter(afterSaveFin)
      .run()
  } else if (btn.id === 'btnReqApply') {
    setApply()
  } else {
    openPopup()
  }
}

const deptPopupOpen = (gbn) => {
  if (gbn === '부서조회') {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: 'Y',
      ASGN_NM: searchParams.ASGN_NM,
    })
  } else {
    deptPopup.value.openPopup()
  }
}
//조회관련 로직 시작
const beforeSearch = async () => {
  GrdSubCurrRowClear()

  return true
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'MNGDA0030_search01',
    param: searchParams,
  })
}

const afterSearch = (res) => {
  if (res.ORESULT_CUR.length === 0) {
    grdSub.value.getDataProvider().setRows('') //조회된 데이터 없을때 부적합목록 비우기
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const searchData02 = (index) => {
  let row = grdMain.value.getDataProvider().getJsonRow(index)
  searchParams2.CMPNY_DIV = row.CMPNY_DIV
  searchParams2.YEAR = row.YEAR
  searchParams2.BSNS_CD = row.BSNS_CD
  searchParams2.ASGN_CD = row.ASGN_CD
  searchParams2.IN_OUT = row.IN_OUT

  GrdSubCurrRowClear()

  // 데이터가 null 일경우 빈 Promise 반환
  if (!row) {
    return new Promise((resolve, reject) => resolve(null))
  }

  return commonSearchApi({
    queryId: 'MNGDA0030_search02',
    param: searchParams2,
  })
}

const afterSearch02 = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//조회관련 로직 끝

// 검토요청 시작
const beforeSaveReq = () => {
  if (STATUS.value !== '20') {
    Message.warn(t('진행상태가 조치결과 등록대기 상태에서 검토요청 가능합니다.'))
    return false
  }

  let rowcnt = grdSub.value.getDataProvider().rowCount
  for (let i = 0; i < rowcnt; i++) {
    let action_cd = grdSub.value.getDataProvider().getJsonRow(i).ACTION_CD
    // 부적합 건이 조치중 또는 조치완료 일 때 검토가능
    if (action_cd !== '1' && action_cd !== '3') {
      Message.warn(t('부적합 목록 중 미조치 건이 존재합니다. 조치 후 검토요청 가능합니다.'))
      return false
    }
  }

  return true
}

const saveDataReq = () => {

  let saveList = [
    {
      CMPNY_DIV: searchParams2.CMPNY_DIV,
      YEAR: searchParams2.YEAR,
      BSNS_CD: searchParams2.BSNS_CD,
      ASGN_CD: searchParams2.ASGN_CD,
      IN_OUT: searchParams2.IN_OUT,
      EVA_STATUS: '30',
      USER_ID: searchParams.USER_ID,
    },
  ]

  return commonExecuteApi({ queryId: 'MNGDA0030_SAVE_03', list: saveList })
}

const afterSaveReq = async () => {
  
  let mailParamsData = {
    EMAIL: [eva_email.value],
    SUBJECT: '[HiSEs] 인증심사 조치결과 검토 접수 건',
    CONTENT: mainSelectRow.value.YEAR + ' 년도 ' + mainSelectRow.value.ASGN_NM + ' ' + mainSelectRow.value.IN_OUT_NM
    + "조치결과가 등록 후 검토 요청이 접수되었습니다. <br />아래 경로에서 조치결과를 확인해  주시기 바랍니다. <br /><br />"
    + "   [경로]  HiSEs 접속 후  [HSE경영시스템] – [인증심사] – [조치결과 등록/관리]",
  }

  await commonSendApi(mailParamsData).then((res) => {
    Message.success(t('메일이 전송되었습니다.'))
  })

  onButtonsClick({ id: 'btnSearch' })
}

//검토요청 로직 끝

// ▼▼▼▼▼▼▼▼▼▼▼▼▼ 검토요청 취소 로직 ▼▼▼▼▼▼▼▼▼▼▼▼▼

const beforeSaveCan = () => {
  if (STATUS.value !== '30') {
    Message.warn(t('진행상태가 심사원 검토중 상태에서 검토요청 취소 가능합니다.'))
    return false
  }

  return true
}

const saveDataCan = () => {

  let saveList = [
    {
      CMPNY_DIV: searchParams2.CMPNY_DIV,
      YEAR: searchParams2.YEAR,
      BSNS_CD: searchParams2.BSNS_CD,
      ASGN_CD: searchParams2.ASGN_CD,
      IN_OUT: searchParams2.IN_OUT,
      EVA_STATUS: '20',
      USER_ID: searchParams.USER_ID,
    },
  ]

  return commonExecuteApi({ queryId: 'MNGDA0030_SAVE_03', list: saveList })
}

const afterSaveCan = async () => {
  
  // let mailParamsData = {
  //   EMAIL: [eva_email.value],
  //   SUBJECT: '[HiSEs] 인증심사 조치결과 검토 접수 건',
  //   CONTENT: mainSelectRow.value.YEAR + ' 년도 ' + mainSelectRow.value.ASGN_NM + ' ' + mainSelectRow.value.IN_OUT_NM
  //   + "조치결과가 등록 후 검토 요청이 접수되었습니다. <br />아래 경로에서 조치결과를 확인해  주시기 바랍니다. <br /><br />"
  //   + "   [경로]  HiSEs 접속 후  [HSE경영시스템] – [인증심사] – [조치결과 등록/관리]",
  // }

  // await commonSendApi(mailParamsData).then((res) => {
  //   Message.success(t('메일이 전송되었습니다.'))
  // })

  onButtonsClick({ id: 'btnSearch' })
}

// ▲▲▲▲▲▲▲▲▲▲▲▲▲ 검토요청 취소 로직 ▲▲▲▲▲▲▲▲▲▲▲▲▲

// ▼▼▼▼▼▼▼▼▼▼▼▼▼ 보완요청 로직 ▼▼▼▼▼▼▼▼▼▼▼▼▼

const beforeSaveRe = () => {
  if (STATUS.value !== '30') {
    Message.warn(t('진행상태가 심사원 검토중 상태에서 보완요청 가능합니다.'))
    return false
  }

  return true
}

const saveDataRe = () => {

  let saveList = [
    {
      CMPNY_DIV: searchParams2.CMPNY_DIV,
      YEAR: searchParams2.YEAR,
      BSNS_CD: searchParams2.BSNS_CD,
      ASGN_CD: searchParams2.ASGN_CD,
      IN_OUT: searchParams2.IN_OUT,
      EVA_STATUS: '20',
      USER_ID: searchParams.USER_ID,
    },
  ]

  return commonExecuteApi({ queryId: 'MNGDA0030_SAVE_03', list: saveList })
}

const afterSaveRe = async () => {
  
  let mailParamsData = {
    EMAIL: [cert_email.value],
    SUBJECT: '[HiSEs] 인증심사 조치결과 검토 완료 (보완 필요)',
    CONTENT: mainSelectRow.value.YEAR + ' 년도 ' + mainSelectRow.value.ASGN_NM + ' ' + mainSelectRow.value.IN_OUT_NM
    + "인증심사 조치결과의 심사원 검토가 완료되었습니다. <br /> 입력하신 조치결과의 보완이 필요하오니, 아래 경로에서 보완 후 ‘심사원 검토 요청’ 을 다시 해 주시기 바랍니다. <br /><br />"
    + "   [경로]  HiSEs 접속 후  [HSE경영시스템] – [인증심사] – [조치결과 등록/관리]",
  }
  
  await commonSendApi(mailParamsData).then((res) => {
    Message.success(t('메일이 전송되었습니다.'))
  })

  onButtonsClick({ id: 'btnSearch' })
}

// ▲▲▲▲▲▲▲▲▲▲▲▲▲ 보완요청 로직 ▲▲▲▲▲▲▲▲▲▲▲▲▲

// ▼▼▼▼▼▼▼▼▼▼▼▼▼ 검토완료 로직 ▼▼▼▼▼▼▼▼▼▼▼▼▼

const beforeSaveFin = () => {
  if (STATUS.value !== '30') {
    Message.warn(t('진행상태가 심사원 검토중 상태에서 검토완료 가능합니다.'))
    return false
  }

  let rowcnt = grdSub.value.getDataProvider().rowCount
  
  for (let i = 0; i < rowcnt; i++) {
    let sa_comment = grdSub.value.getDataProvider().getJsonRow(i).SA_COMMENT
    // 부적합 건이 조치중 또는 조치완료 일 때 검토가능
    if (isNullCheck(sa_comment)) {
      Message.warn(t('부적합 목록 중 검토의견이 작성되지 않은 건이 존재합니다. 검토의견 작성 후 검토완료 가능합니다.'))
      return false
    }
  }

  return true
}

const saveDataFin = () => {

  let saveList = [
    {
      CMPNY_DIV: searchParams2.CMPNY_DIV,
      YEAR: searchParams2.YEAR,
      BSNS_CD: searchParams2.BSNS_CD,
      ASGN_CD: searchParams2.ASGN_CD,
      IN_OUT: searchParams2.IN_OUT,
      EVA_STATUS: '40',
      USER_ID: searchParams.USER_ID,
    },
  ]

  return commonExecuteApi({ queryId: 'MNGDA0030_SAVE_03', list: saveList })
}

const afterSaveFin = async () => {
  
  let mailParamsData = {
    EMAIL: [cert_email.value],
    SUBJECT: '[HiSEs] 인증심사 조치결과 검토 완료 (적합)',
    CONTENT: mainSelectRow.value.YEAR + ' 년도 ' + mainSelectRow.value.ASGN_NM + ' ' + mainSelectRow.value.IN_OUT_NM
    + "인증심사 조치결과의 심사원 검토가 완료되었습니다. <br /> 결재를 진행해 주시기 바랍니다.  <br /><br />"
    + "   [경로]  HiSEs 접속 후  [HSE경영시스템] – [인증심사] – [조치결과 등록/관리]",
  }
  
  await commonSendApi(mailParamsData).then((res) => {
    Message.success(t('메일이 전송되었습니다.'))
  })

  onButtonsClick({ id: 'btnSearch' })
}

// ▲▲▲▲▲▲▲▲▲▲▲▲▲ 검토완료 로직 ▲▲▲▲▲▲▲▲▲▲▲▲▲

//결재 기능

//결재 팝업 실행
const setApply = async () =>{
  if(STATUS.value === '40'){
    await openReqApp()
  }else{
    Message.err('결재를 진행할 수 있는 단계가 아닙니다.')
  }
}

//결재 팝업데이터 생성
const openReqApp = async () =>{
  let focusedRow = grdMain.value.getFocusedRowData()

  let reqCon = await reqContents(focusedRow)

  if(reqCon === ''){
    Message.warn(t('결재할 내용이 없습니다.'))
    return
  } 

  await approvalPopup.value.openPopup({
    CLSS_ID: useLogsStore().vueId,
    TITLE: "안전보건환경 부적합 및 시정조치서 결재 건",
    CMPNY_DIV: userStore.cmpnyDiv,
    DATA_KEY:
      userStore.cmpnyDiv +
      ";" +
      reqCon.BSNS_CD +
      ";" +
      reqCon.ASGN_CD +
      ";" +
      reqCon.ASGN_CD +
      ";" +
      new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;YEAR',
    REPORT: reqCon, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE: "3", //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: "421", //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE: "CLR_15", //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  })

  onButtonsClick({ id: 'btnSearch' })
}

//결재 내용 생성
const reqContents = async focusedRow =>{

  searchParams2.CMPNY_DIV = focusedRow.CMPNY_DIV
  searchParams2.YEAR = focusedRow.YEAR
  searchParams2.BSNS_CD = focusedRow.BSNS_CD
  searchParams2.ASGN_CD = focusedRow.ASGN_CD
  searchParams2.IN_OUT = focusedRow.IN_OUT

  let res = await commonSearchApi({
    queryId: "MNGDA0030_search02",
    param: searchParams2,
  })
  console.log('결과',res)

  if(res.ORESULT_CUR.length === 0){
    return ''
  }

  let setGrid = `
  <html>
    <head>      
      <style>
        .tbl {                        
          border: 1px solid #444444;
          border-collapse: collapse;
          font-family:조선일보명조;
          width:100%;
        }                              
        .title2{
          background-color:lightsteelblue;
          font-weight: bold;
          text-align: center;  
          border: 1px solid #444444;
          padding: 5px;
          font-size: 14px;                             
        }
        .item{
          border: 1px solid #444444;
          padding: 5px;
          font-size: 14px;    
          text-align: center;                   
        }        
        .span_25 {
          font-size: 25px; 						
        }
        .span_15 {
          font-size: 15px; 						
        }
      </style>
    </head>
    <body>
      <center><div><span class="span_25"><b> 안전보건환경 부적합 및 시정조치서 </b></span></div></center>
      <br/>
      <div style="display:flex;margin-bottom:5px">
        <span class="span_15"><b>부서명: ${isNullAndEmpty(res.ORESULT_CUR[0].ASGN_NM)}</b></span>
        <span class="span_15" style="margin-left:auto"><b>작성일: ${isNullAndEmpty(res.ORESULT_CUR[0].INSERT_DATE)}</b></span>
      </div>                                   
      <table class="tbl" id="tableList"> 
        <thead>
          <tr>
            <th class="title2" style="width:10%">심사규격</th>
            <th class="title2" style="width:40%">부적합내용</th>
            <th class="title2" style="width:10%">조치상태</th>
            <th class="title2" style="width:40%">조치결과</th>
          </tr>
        </thead>
        <tbody class="grdTbody">  
  `

  for (let i = 0; i < res.ORESULT_CUR.length; i++){
    let data = res.ORESULT_CUR[i]

    setGrid += `
        <tr>
					<td class="item">${isNullAndEmpty(data.CERT_NM)}</td>
          <td class="item" style="text-align:left">${isNullAndEmpty(data.RESULT_CONTENTS)}</td>
				  <td class="item">${isNullAndEmpty(data.ACTION_NM)}</td>
          <td class="item" style="text-align:left">${isNullAndEmpty(data.ACTION_CONTENTS1)}</td>
				</tr>
    `
  }
  
  return setGrid
}

// 결재 상신 후, 처리 결과 리턴
const approvalAppkey = async (res) => {
  // 결재 상신 완료시, 저장/결재상신 버튼 비활성화
  
  await commonExecuteApi(
    { queryId : 'MNGDA0030_UPDATE_01',
      list  : [{ CMPNY_DIV : searchParams2.CMPNY_DIV ,
                  YEAR : searchParams2.YEAR ,
                  BSNS_CD : searchParams2.BSNS_CD ,
                  ASGN_CD :  searchParams2.ASGN_CD ,
                  IN_OUT : searchParams2.IN_OUT ,
                  APPROVE_ID : res,
                  USER_ID : userStore.userId}] 
    })  
}

const isNullCheck = data => {
  return (data === undefined || data === null || data === '') ? true : false
}

const isNullAndEmpty = (data) => {
  return isNullCheck(data) ? '' : data
}

//결재 끝

onMounted(() => {
  //부서정보 초기세팅
  searchParams.ASGN_NM = userStore.deptNm
  searchParams.ASGN_CD = userStore.deptCd
  //부적합등급 조회
  commonSearchApi({
    //신청구분조회
    queryId: 'searchCommonCode',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      ALL_UP_CD: 'HHIAF19',
      USE_FLAG: 'Y',
      CODE_NAME_TYPE: '0',
    },
  }).then((res) => {
    codeList.resultcd = res.ORESULT_CUR
    codeList.resultcd.unshift({ TXT: '부적합', COD: 'N' })
    grdSub.value.setBindingColumn('RESULT_CD', codeList.resultcd, 'COD', 'TXT')
  })

  // 처음에는 모든 버튼 숨김처리
  menuTitle.value.setBtnProperty('btnReqReview', 'visible', false)
  menuTitle.value.setBtnProperty('btnCancelReqReview', 'visible', false)
  menuTitle.value.setBtnProperty('btnReWrite', 'visible', false)
  menuTitle.value.setBtnProperty('btnFinishReview', 'visible', false)
  menuTitle.value.setBtnProperty('btnReqApply', 'visible', false)
  menuTitleSub.value.setBtnProperty('btnActionResultRegistraion', 'visible', false)
})

const onGrdMainCurrRowChanged = (grid, oldIndex, newIndex) => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData02, newIndex)
    .setAfter(afterSearch02)
    .showMessage(false)
    .run()
  let row = grdMain.value.getDataProvider().getJsonRow(newIndex)
  STATUS.value = row.STATUS
  cert_email.value = row.CERT_EMAIL
  eva_email.value = row.EVA_EMAIL
  mainSelectRow.value = row

  menuTitle.value.setBtnProperty('btnReqReview', 'visible', false)
  menuTitle.value.setBtnProperty('btnCancelReqReview', 'visible', false)
  menuTitle.value.setBtnProperty('btnReWrite', 'visible', false)
  menuTitle.value.setBtnProperty('btnFinishReview', 'visible', false)
  menuTitle.value.setBtnProperty('btnReqApply', 'visible', false)
  menuTitleSub.value.setBtnProperty('btnActionResultRegistraion', 'visible', true) // 항상 보이도록

  // 적합인 경우
  if (row.RESULT_CD === 'Y'){
    // menuTitle.value.disableBtn('btnReqApply', true)                       // 결재상신 비활성화
    // menuTitleSub.value.disableBtn('btnActionResultRegistraion', true)     // 조치결과 등록 비활성화

  // 부적합인 경우  
  } else {
    // 조치결과 등록대기
    if (STATUS.value === '20'){
      menuTitle.value.setBtnProperty('btnReqReview', 'visible', true)
      

    // 심사원 검토 중
    } else if (STATUS.value === '30'){

      // if (userStore.authGrpCd.includes('HIWAYGRP00001')){
      //   menuTitle.value.setBtnProperty('btnCancelReqReview', 'visible', true)        
      //   menuTitle.value.setBtnProperty('btnReWrite', 'visible', true)
      //   menuTitle.value.setBtnProperty('btnFinishReview', 'visible', true)
      //   menuTitleSub.value.setBtnProperty('btnActionResultRegistraion', 'visible', true)
      // }

      if (row.EVA_EMP === userStore.empNo){
        menuTitle.value.setBtnProperty('btnReWrite', 'visible', true)
        menuTitle.value.setBtnProperty('btnFinishReview', 'visible', true)
        menuTitleSub.value.setBtnProperty('btnActionResultRegistraion', 'text', '심사원 검토의견 등록')
      } else {
        menuTitle.value.setBtnProperty('btnCancelReqReview', 'visible', true)
      }
    // 심사원 검토완료
    } else if (STATUS.value === '40'){
      console.log('23', row.ASGN_CD, userStore.deptCd)

      menuTitle.value.setBtnProperty('btnReqApply', 'visible', true)
      if ( row.ASGN_CD === userStore.deptCd ){
        menuTitle.value.disableBtn('btnReqApply', false)
      }
      else{
        menuTitle.value.disableBtn('btnReqApply', true)
      }
   

    // 결재 중
    } else if (STATUS.value === '50'){

    // 인증심사 완료
    } else if (STATUS.value === '60'){

    }
  }
}

const GrdSubCurrRowClear = () =>{
  searchPopupParam.CMPNY_DIV = ''
  searchPopupParam.YEAR = ''
  searchPopupParam.BSNS_CD = ''
  searchPopupParam.ASGN_CD = ''
  searchPopupParam.IN_OUT = ''
  searchPopupParam.SEQ = -1
  searchPopupParam.ACTION_ATT_ID = ''
  searchPopupParam.ASGN_FULL_NM = ''
  searchPopupParam.STATUS = ''
  searchPopupParam.ACTION_CD = ''
}

const onGrdSubCurrRowChanged = (grid, oldIndex, newIndex) => {
  let row = grdSub.value.getDataProvider().getJsonRow(newIndex)
  searchPopupParam.CMPNY_DIV = row.CMPNY_DIV
  searchPopupParam.YEAR = row.YEAR
  searchPopupParam.BSNS_CD = row.BSNS_CD
  searchPopupParam.ASGN_CD = row.ASGN_CD
  searchPopupParam.IN_OUT = row.IN_OUT
  searchPopupParam.SEQ = row.SEQ//newIndex //부적합목록 팝업에 넘겨줄 로우 인덱스값(쿼리에 로우 인덱스값이 필요함)
  searchPopupParam.ACTION_ATT_ID = row.ACTION_ATT_ID
  searchPopupParam.ASGN_FULL_NM = searchParams.ASGN_NM
  searchPopupParam.STATUS = STATUS.value
  searchPopupParam.ACTION_CD = row.ACTION_CD
}

const openPopup = () => {
  if (searchPopupParam.SEQ < 0 || searchPopupParam.SEQ === '') {
    Message.warn(t('부적합 목록 데이터를 선택해주세요.'))
    return false
  }
  mNGDA0030Popup.value.openPopup(searchPopupParam)
}

//부서선택 이벤트
const onDeptSelected = (data) => {
  searchParams.BSNS_CD = data.BSNS_CD
  searchParams.ASGN_NM = data.ASGN_SHRT_NM
  searchParams.ASGN_CD = data.ASGN_CD
  ASGN_FULL_NM.value = data.ASGN_FULL_NM
  searchPopupParam.ASGN_FULL_NM = data.ASGN_FULL_NM
}
</script>

<template>
   <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnReqReview', 'btnCancelReqReview', 'btnReWrite', 'btnFinishReview', 'btnReqApply']"
        :use-permission="false"
        @click-button="onButtonsClick"
      />
      <div style="text-align: end">
        <span style="font-size: 17px; font-weight: bold; color: red"
          >※ 조치결과 등록 후 반드시 ‘검토요청’ 까지 해 주시기 바랍니다.
        </span>
      </div>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <!-- 조회조건 -->
        <VForm ref="searchArea" class="searchArea d-flex">
          <!--  년도  -->
          <i-input
          :label="$t('년도')"
          label-width="35px"
          width="150px"
          v-model="searchParams.YEAR"
          type="Number"
          oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
          />
          <!--부서-->
          <i-input 
            :label="$t('부서')"
            label-width="90px"
            width="410px"
            v-model="searchParams.ASGN_NM" 
            append-inner-icon="mdi-magnify" 
            @keydown.enter="e => {
              deptPopupOpen('부서조회')
            }"
            @update:modelValue="e => { searchParams.ASGN_CD = null }"
            @click:appendInner="deptPopupOpen('부서조회')"
            margin="4px"
          />
          <i-input
            v-model="searchParams.ASGN_CD" 
            readonly
            width="100px"
          />
          <!-- 내외 여부 -->
          <i-select
            :label="$t('내/외부')"
            label-width="70px"
            width="300px"
            v-model="searchParams.IN_OUT"
            :items="IN_OUT"
            item-value="value"
            item-title="title"
          /> 
        </VForm> 
        <div class="d-flex flex-column">
          <IGridTitle
            ref="grdMainTitle"
            :title="$t('세부 심사일정')"
          />
          <RealGrid
          ref="grdMain"
              class="mt-2"
              style="height: 130px"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCurrentRowChanged="onGrdMainCurrRowChanged"
          />
        </div>
        <div class="mt-3 d-flex flex-column">
          <IGridTitle
            ref="menuTitleSub"
            :title="$t('부적합 목록')"
            :button-list="['btnActionResultRegistraion']"
            :use-permission="false"
            @click-button="onButtonsClick"
          />
          <RealGrid
            ref="grdSub"
            class="mt-2"
            style="height: 320px"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            @onCurrentRowChanged="onGrdSubCurrRowChanged"
          />
        </div>
      </div>
    </v-card-text>
    <MNGDA0030Popup ref="mNGDA0030Popup" @popupExit="() => {onButtonsClick({ id: 'btnSearch' })}" />
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
    <!-- 결재 팝업-->
    <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey"/>
  </v-card>
</template>
