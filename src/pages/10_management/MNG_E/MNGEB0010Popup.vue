<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import {
  commonSearchApi,
  getCodeList,
  commonRequest,
  commonExecuteApi,
  commonExecuteApi2,
  commonSendApi,
} from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from '@/components/ILabel.vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import _ from 'lodash'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import MNGEB0010PopTab1Popup from './MNGEB0010PopTab1Popup.vue'
import MNGEB0010PopTab2Popup from './MNGEB0010PopTab2Popup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

//******************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const tab = ref(null)
const grdMain = ref(null)
const menuTitle1 = ref(null)
const menuTitle2 = ref(null)
const approvalPopup = ref(null)
const dialog = ref(false)
const empPopup = ref(null)
const deptPopup = ref(null)
const mNGEB0010PopTab1Popup = ref(null)
const mNGEB0010PopTab2Popup = ref(null)
// OzReport 팝업 여부
const showOz = ref(false)
const emit = defineEmits(['saved'])

//Tab Visible
const tabVisible = reactive({
  TAB1: true,
  TAB2: true,
  TAB3: true,
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YYYY: dayjs().format('YYYY'),
  PART_GUBN: '',
  LAW_CD: '',
  LAW_NM: '',
  BF_CONTENT: '',
  AF_CONTENT: '',
  ACQ_DATE: '',
  ER_DATE: '',
  PMG_DATE: '',
  ACT_DATE: '',
  SMNG_ID: '',
  SMNG_NM: '',
  SOL_DATE: '',
  REMARK: '',
  CHKLIST_YN: '',
  CIR_LIST_ID: [],
  CIR_LIST_NM: [],
  NOTICE_CONTENT: '',
  NOTICE_GUBN: '',
  WORK_YN: '',
  REV: -1,
  CLICK_ROW_IDX: -1,
  EXIST_LAW: '',
  EMAIL: '',
  STATUS: '',
})

//코드리스트
const codeList = reactive({
  PART_GUBN: [],
  NOTICE_GUBN: [],
  WORK_YN: [
    { COD: 'Y', TXT: '업무 반영' },
    { COD: 'N', TXT: '업무 미반영' },
  ],
  CYCLE: [],
})

const clearData = async (data) => {
  tab.value = data.STATUS <= '10' ? 'tab1' : 'tab2'
  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  searchParams.YYYY = dayjs().format('YYYY')
  searchParams.PART_GUBN = ''
  searchParams.LAW_CD = ''
  searchParams.LAW_NM = ''
  searchParams.BF_CONTENT = ''
  searchParams.AF_CONTENT = ''
  searchParams.ACQ_DATE = ''
  searchParams.ER_DATE = ''
  searchParams.PMG_DATE = ''
  searchParams.ACT_DATE = ''
  searchParams.SMNG_ID = ''
  searchParams.SMNG_NM = ''
  searchParams.SOL_DATE = ''
  searchParams.REMARK = ''
  searchParams.CHKLIST_YN = ''
  searchParams.CIR_LIST_ID = []
  searchParams.CIR_LIST_NM = []
  searchParams.NOTICE_CONTENT = ''
  searchParams.NOTICE_GUBN = ''
  searchParams.WORK_YN = ''
  searchParams.EMAIL = ''
  searchParams.REV = -1
  searchParams.STATUS = data.STATUS

  if (grdMain.value != null && grdMain.value.getDataProvider().rowCount > 0) {
    grdMain.value.getDataProvider().clearRows()
  }
}

const setData = (data) => {
  //법령 데이터 배치
  searchParams.PART_GUBN = data.PART_GUBN
  searchParams.LAW_CD = data.LAW_CD
  searchParams.LAW_NM = data.LAW_NM
  searchParams.BF_CONTENT = data.BF_CONTENT
  searchParams.AF_CONTENT = data.AF_CONTENT
  searchParams.ACQ_DATE = data.ACQ_DATE
  searchParams.ER_DATE = data.ER_DATE
  searchParams.PMG_DATE = data.PMG_DATE
  searchParams.ACT_DATE = data.ACT_DATE
  searchParams.SMNG_ID = data.SMNG_ID
  searchParams.SMNG_NM = data.SMNG_NM
  searchParams.SOL_DATE = data.SOL_DATE
  searchParams.REMARK = data.REMARK
  searchParams.CHKLIST_YN = data.CHKLIST_YN
  searchParams.CIR_LIST_ID = data.CIR_LIST_ID
  searchParams.CIR_LIST_NM = data.CIR_LIST_NM
  searchParams.NOTICE_CONTENT = data.NOTICE_CONTENT
  searchParams.NOTICE_GUBN = data.NOTICE_GUBN
  searchParams.WORK_YN = data.WORK_YN
  searchParams.REV = data.REV

  getEmail()

  tabVisible.TAB2 = data.STATUS !== '10'
  tabVisible.TAB3 = data.STATUS !== '10'
}

//법령팝업
const openLawPopup = () => {
  mNGEB0010PopTab1Popup.value.openPopup({
    SELECT_YN: 'Y',
  })
}

//법령 팝업 선택 결과
const onMNGEB0010PopTab1PopupSelected = (res) => {
  searchParams.LAW_CD = res[0].LAW_CD
  searchParams.LAW_NM =
    res[0].LAW_NM +
    ' ' +
    (res[0].LAW_NM1 === null ? '' : res[0].LAW_NM1 + '조 ') +
    (res[0].LAW_NM2 === null ? '' : res[0].LAW_NM2 + '항')
  searchParams.PART_GUBN = res[0].GUBN
  searchParams.BF_CONTENT = res[0].BF_CONTENT
  searchParams.REV = res[0].REV
}

//회람팝업
const openCirPopup = () => {
  mNGEB0010PopTab2Popup.value.openPopup({
    EMP_NO: searchParams.CIR_LIST_ID,
    EMP_NM: searchParams.CIR_LIST_NM,
  })
}

//회람 팝업 선택 결과
const onMNGEB0010PopTab2PopupSelected = (res) => {
  searchParams.CIR_LIST_ID = res.EMP_ID
  searchParams.CIR_LIST_NM = res.EMP_NM
}

//******************************세팅 영역(종료)***************************************************/
// 법규준수평가 체크리스트 그리드 셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: 'LAW_NM',
      dataType: 'text',
      header: { text: t('법령'), styleName: 'header_validit' },
      editable: false,
      required: true,
      requiredMessage: '[법령]은 필수입니다.',
      width: '200',
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      header: { text: t('평가주체부서') },
      button: 'action',
      width: '80',
    },
    {
      fieldName: 'CONTENT',
      dataType: 'text',
      header: { text: t('준수사항'), styleName: 'header_validit' },
      styleName: 'left-column multiline-editor',
      required: true,
      requiredMessage: '[준수사항]은 필수입니다.',
      width: '150',
    },
    {
      fieldName: 'CYCLE',
      dataType: 'text',
      header: { text: t('주기') },
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      lookupData: { value: 'COD', label: 'TXT', list: codeList.CYCLE },
      lookupDisplay: true,
      width: '80',
    },
    {
      fieldName: 'CHK_TARGET',
      dataType: 'text',
      header: { text: t('확인대상') },
      width: '60',
    },
    {
      fieldName: 'CHK_CONTENT',
      dataType: 'text',
      header: { text: t('확인내용') },
      styleName: 'left-column multiline-editor',
      width: '150',
    },
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '120', visible: false },
    { fieldName: 'LAW_CD', dataType: 'text', width: '120', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '120', visible: false },
    { fieldName: 'REV', dataType: 'text', width: '60', visible: false },
    { fieldName: 'IDX_KEY', dataType: 'text', width: '60', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//직원 정보 팝업
const openEmpPopup = () => {
  empPopup.value.openPopup({
    EMP_NM: searchParams.SMNG_NM,
    DISABLE: [],
  })
}

//직원 선택후 데이터
const selectedEmpData = (res) => {
  searchParams.SMNG_ID = res.EMP_NO
  searchParams.SMNG_NM = res.EMP_NM
  searchParams.EMAIL = res.EMAIL
}

//*****************************************오픈 팝업********************************************/

const openPopup = async (data) => {
  await clearData(data)

  await onButtonsTab3Click({ id: 'btnSearch' })
  if (data != null) {
    setData(data)
  }
  await controlBtn()
  //팝업 오픈
  dialog.value = true
}

let tab1ReadOnly = false

const controlBtn = () => {
  if (userStore.deptCd === 'N090' || userStore.empNo === 'BP22733')
    tab1ReadOnly = false
  else tab1ReadOnly = true

  console.log('체크', searchParams.STATUS, searchParams.STATUS > '10')

  menuTitle1.value.disableBtn('btnUpdate', searchParams.STATUS > '10')
  menuTitle1.value.disableBtn('btnCompleteSend', searchParams.STATUS > '10')
}
//****************************************오픈 팝업(종료)************************************************/
//널 체크 메서드
const isNullCheck = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const onButtonsClick = async (btn) => {
  emit('saved')
  onClose()
}

//tab1 버튼 이벤트
const onButtonsTab1Click = (btn) => {
  if (btn.id === 'btnUpdate') {
    saveTab1()
  } else {
    sendTab1MailAndSave()
  }
}

//메일 주소 검색
const getEmail = () => {
  if (isNullCheck(searchParams.SMNG_ID)) return

  commonSearchApi({
    queryId: 'searchEMP5',
    param: { EMP_NO: searchParams.SMNG_ID, EMP_NM: '', RETIRE_YN: 'Y' },
  }).then((res) => {
    searchParams.EMAIL = res.ORESULT_CUR[0].EMAIL
  })
}

//메일 발송
const sendTab1Mail = () => {
  if (isNullCheck(searchParams.SMNG_ID)) {
    Message.warn('조치담당자를 먼저 지정해주세요.')

    return false
  }

  let mailParamsData = {
    EMAIL: [searchParams.EMAIL],
    SUBJECT: '[알림] 법령 제·개정 변경 사항 안내',
    CONTENT: '',
  }
  mailParamsData.CONTENT = ''
  mailParamsData.CONTENT +=
    '법령 제·개정 사항이 있습니다. 법규 준수평가 체크리스트 개정이 필요합니다<br />'
  mailParamsData.CONTENT += '<br />'
  mailParamsData.CONTENT += '작성자:' + userStore.userName + '<br />'
  mailParamsData.CONTENT += '<br />'
  mailParamsData.CONTENT += '감사합니다.'

  commonSendApi(mailParamsData).then((res) => {
    Message.success(t('메일이 전송되었습니다.'))
  })

  return true
}

//메일 발송 및 상태 변경
const sendTab1MailAndSave = () => {
  new saveFlowHelper(vm, t)
    .setBefore(sendTab1Mail)
    .setQuery(updateTab1Data)
    .setAfter(updateTab1After)
    .run()
}

//상태 변경
//Tab1 DB 상태변경 메서드
const updateTab1Data = () => {
  let saveList = [
    {
      CMPNY_DIV: userStore.cmpnyDiv,
      LAW_CD: searchParams.LAW_CD,
      STATUS: '20',
      USER_ID: userStore.userId,
      REV: searchParams.REV,
    },
  ]

  return commonExecuteApi({ queryId: 'MNGEB0010_UPDATE_01', list: saveList })
}
//Tab1 저장 후 처리
const updateTab1After = () => {
  Message.success('메일 전송 완료.')
  // emit("saved")
  // onClose()
}

//Tab1 저장
const saveTab1 = () => {
  new saveFlowHelper(vm, t)
    .setBefore(saveTab1Check)
    .setQuery(saveTab1Data)
    .setAfter(saveTab1After)
    .run()
}

//Tab1 저장데이터 유효성 검사
const saveTab1Check = () => {
  if (
    isNullCheck(searchParams.LAW_CD) ||
    isNullCheck(searchParams.ACQ_DATE) ||
    isNullCheck(searchParams.ER_DATE) ||
    isNullCheck(searchParams.PMG_DATE) ||
    isNullCheck(searchParams.ACT_DATE)
  ) {
    Message.warn('법규 및 제·개정 관련 일자 선택바랍니다.')

    return false
  } else if (
    isNullCheck(searchParams.BF_CONTENT) ||
    isNullCheck(searchParams.AF_CONTENT)
  ) {
    Message.warn('제·개정 내용 입력바랍니다.')

    return false
  } else {
    return true
  }
}

//Tab1 DB저장 메서드
const saveTab1Data = () => {
  let saveList = [
    {
      CMPNY_DIV: userStore.cmpnyDiv,
      LAW_CD: searchParams.LAW_CD,
      PART_GUBN: searchParams.PART_GUBN,
      ACQ_DATE: searchParams.ACQ_DATE.replaceAll('-', ''),
      ER_DATE: searchParams.ER_DATE.replaceAll('-', ''),
      ACT_DATE: searchParams.ACT_DATE.replaceAll('-', ''),
      PMG_DATE: searchParams.PMG_DATE.replaceAll('-', ''),
      BF_CONTENT: searchParams.BF_CONTENT,
      AF_CONTENT: searchParams.AF_CONTENT,
      SMNG_ID: searchParams.SMNG_ID,
      USER_ID: userStore.userId,
      REV: searchParams.REV,
      OUT_RES_REV: '',
      OUT_RES_COD: '',
      OUT_RES_MSG: '',
      OUT_RES_COL: '',
    },
  ]

  return commonExecuteApi2({
    queryId: 'MNGEB0010_POP1_TAB1_SAVE_01',
    list: saveList,
  })
}
//Tab1 저장 후 처리
const saveTab1After = (res) => {
  searchParams.REV = res.OUT_RES_REV
  // emit("saved")
  // onClose()
}

//tab2 버튼 이벤트
const onButtonsTab2Click = (btn) => {
  if (btn.id === 'btnUpdate') {
    saveTab2()
  } else if (btn.id === 'btnReqApply') {
    applyTab2()
  } else {
    //출력물
    setPrint()
    showOz.value = true
  }
}

//출력물 셋팅
const reportName = ref('')

const params = ref([])

const setPrint = () => {
  reportName.value = '/manage/hse/MNGEB0010_01.ozr'

  params.value = [
    'IN_CMPNY_DIV=' + searchParams.CMPNY_DIV,
    'IN_LAW_CD=' + searchParams.LAW_CD,
    'IN_REV=' + searchParams.REV,
  ]
}

//TAb2 결재
const applyTab2 = () => {
  new saveFlowHelper(vm, t)
    .setBefore(saveTab2Check)
    .setQuery(saveTab2Data)
    .setAfter(applyTab2After)
    .run()
}

const applyTab2After = async () => {
  let searchParam = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    LAW_CD: searchParams.LAW_CD,
    REV: searchParams.REV,
  }

  let res = await commonSearchApi({
    queryId: 'MNGEB0010_PRINT_01',
    param: searchParam,
  })
  if (res.ORESULT_CUR.length === 0) {
    Message.warn('결재할 데이터가 없습니다.')
    return
  }

  approvalPopup.value.openPopup({
    CLSS_ID: 'MNGEB0010',
    TITLE: '법령 제개정 관리',
    CMPNY_DIV: userStore.cmpnyDiv,
    DATA_KEY:
      userStore.cmpnyDiv +
      ';' +
      userStore.bsnsCd +
      ';' +
      userStore.deptCd +
      ';' +
      userStore.asgnCd +
      ';' +
      searchParams.YYYY,
    REPORT: getApplyHtml(res), // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE: 'CLR_15', //결재라인
  })
}
//결재 내용 HTML 생성
const getApplyHtml = (res) => {
  let html = ''
  let data = res.ORESULT_CUR[0]
  html =
    `<html>
    <head>
    <title>OZ HTML</title>
    <style type="text/css">
    <!--
    div.offset{
    position:absolute;
    background-color:transparent;
    box-sizing: border-box;
    left:0px;
    top:0px;
    width:0px;
    height:0px;
    }
    div{
    position:relative;
    box-sizing: border-box;
    }
    table.one{
    width:100%;
    height:100%;
    border:0;
    }
    table.two{
    width:100%;
    height:100%;
    border:0;
    line-height:80%;
    }
    table.three{
    width:100%;
    height:100%;
    border:0;
    line-height:60%;
    }
    table.four{
    width:100%;
    height:100%;
    border:0;
    line-height:40%;
    }
    table.five{
    width:100%;
    height:100%;
    border:0;
    line-height:20%;
    }
    br{letter-spacing:0;}
    #center{
    text-align:center;
    }
    div.b_0{
    border-width:1px;
    border-color:#000000;
    border-style:solid;
    box-sizing: border-box;
    }
    #f_10w13s0{
    font-size:10pt;
    line-height:13pt;
    letter-spacing:0pt;
    }
    font.맑은_고딕{
    font-family:맑은 고딕;
    }
    #f_14w18s0{
    font-size:14pt;
    line-height:18pt;
    letter-spacing:0pt;
    }
    #f_12w15s0{
    font-size:12pt;
    line-height:15pt;
    letter-spacing:0pt;
    }
    #left{
    text-align:left;
    }
    #f_9w12s0{
    font-size:9pt;
    line-height:12pt;
    letter-spacing:0pt;
    }
    font.굴림{
    font-family:굴림;
    }
    -->
    </style>
    </head>
    <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
    <div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:793px;height:1123px">
    <div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:39px;width:105px;height:72px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.PART_GUBN) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:129px;top:39px;width:411px;height:72px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_14w18s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>법규&nbsp제·개정&nbsp내용&nbsp검토서</font></td></tr></table></div></div>
    <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:538px;top:39px;width:63px;height:72px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>문서<BR>번호</font></td></tr></table></div></div>
    <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:599px;top:39px;width:169px;height:72px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:109px;width:77px;height:66px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>제&nbsp&nbsp목</font></td></tr></table></div></div>
    <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:101px;top:109px;width:512px;height:66px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.LAW_NM) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:611px;top:109px;width:50px;height:43px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>입수일</font></td></tr></table></div></div>
    <div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:659px;top:109px;width:108px;height:43px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.ACQ_DATE) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:611px;top:150px;width:50px;height:42px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>제정일</font></td></tr></table></div></div>
    <div class=offset style="z-index:10"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:659px;top:150px;width:108px;height:42px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.ER_DATE) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:11"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:173px;width:77px;height:59px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>제·개정<BR>법규명</font></td></tr></table></div></div>
    <div class=offset style="z-index:12"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:101px;top:173px;width:396px;height:59px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.LAW_NM) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:13"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:495px;top:173px;width:35px;height:59px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>해당<BR>부문</font></td></tr></table></div></div>
    <div class=offset style="z-index:14"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:528px;top:173px;width:85px;height:59px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:15"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:611px;top:190px;width:50px;height:42px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>시행일</font></td></tr></table></div></div>
    <div class=offset style="z-index:16"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:659px;top:190px;width:108px;height:42px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.ACT_DATE) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:17"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:230px;width:741px;height:42px;overflow:hidden;background-color:#FFBF28"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_12w15s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>법규&nbsp입수내용</font></td></tr></table></div></div>
    <div class=offset style="z-index:18"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:270px;width:372px;height:39px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_12w15s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>개&nbsp&nbsp정&nbsp&nbsp전</font></td></tr></table></div></div>
    <div class=offset style="z-index:19"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:396px;top:270px;width:371px;height:39px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_12w15s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>개&nbsp&nbsp정&nbsp&nbsp후</font></td></tr></table></div></div>
    <div class=offset style="z-index:20"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:307px;width:372px;height:333px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.BF_CONTENT) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:21"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:396px;top:307px;width:371px;height:333px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.AF_CONTENT) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:22"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:638px;width:741px;height:45px;overflow:hidden;background-color:#FFBF28"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_12w15s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>법&nbsp&nbsp규&nbsp&nbsp조&nbsp&nbsp치&nbsp&nbsp내&nbsp&nbsp역</font></td></tr></table></div></div>
    <div class=offset style="z-index:23"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:681px;width:77px;height:211px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.WORK_YN) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:24"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:101px;top:681px;width:297px;height:211px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.REMARK) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:25"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:396px;top:681px;width:371px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>법&nbsp규&nbsp공&nbsp지&nbsp내&nbsp역</font></td></tr></table></div></div>
    <div class=offset style="z-index:26"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:396px;top:711px;width:134px;height:181px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.NOTICE_GUBN) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:27"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:528px;top:711px;width:239px;height:181px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.NOTICE_CONTENT) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:28"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:890px;width:77px;height:180px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>법규<BR><BR>회람</font></td></tr></table></div></div>
    <div class=offset style="z-index:29"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:101px;top:890px;width:62px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>대상자</font></td></tr></table></div></div>
    <div class=offset style="z-index:30"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:161px;top:890px;width:89px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>서&nbsp&nbsp명</font></td></tr></table></div></div>
    <div class=offset style="z-index:31"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:248px;top:890px;width:64px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>대상자</font></td></tr></table></div></div>
    <div class=offset style="z-index:32"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:310px;top:890px;width:88px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>서&nbsp&nbsp명</font></td></tr></table></div></div>
    <div class=offset style="z-index:33"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:396px;top:890px;width:54px;height:180px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>결<BR><BR><BR>재</font></td></tr></table></div></div>
    <div class=offset style="z-index:34"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:448px;top:890px;width:108px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>작&nbsp&nbsp성</font></td></tr></table></div></div>
    <div class=offset style="z-index:35"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:554px;top:890px;width:107px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:36"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:659px;top:890px;width:108px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>승&nbsp&nbsp인</font></td></tr></table></div></div>
    <div class=offset style="z-index:37"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:101px;top:920px;width:62px;height:33px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.CIR_NM1) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:38"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:161px;top:920px;width:89px;height:33px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:39"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:248px;top:920px;width:64px;height:33px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.CIR_NM2) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:40"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:310px;top:920px;width:88px;height:33px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:41"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:448px;top:920px;width:108px;height:33px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:42"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:554px;top:920px;width:107px;height:33px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:43"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:659px;top:920px;width:108px;height:33px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:44"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:101px;top:951px;width:62px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.CIR_NM3) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:45"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:161px;top:951px;width:89px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:46"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:248px;top:951px;width:64px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.CIR_NM4) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:47"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:310px;top:951px;width:88px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:48"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:448px;top:951px;width:108px;height:89px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:49"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:554px;top:951px;width:107px;height:89px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:50"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:659px;top:951px;width:108px;height:89px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:51"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:101px;top:981px;width:62px;height:31px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.CIR_NM5) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:52"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:161px;top:981px;width:89px;height:31px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:53"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:248px;top:981px;width:64px;height:31px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.CIR_NM6) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:54"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:310px;top:981px;width:88px;height:31px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:55"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:101px;top:1010px;width:62px;height:30px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.CIR_NM7) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:56"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:161px;top:1010px;width:89px;height:30px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:57"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:248px;top:1010px;width:64px;height:30px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.CIR_NM8) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:58"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:310px;top:1010px;width:88px;height:30px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:59"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:101px;top:1038px;width:62px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.CIR_NM9) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:60"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:161px;top:1038px;width:89px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:61"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:248px;top:1038px;width:64px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/>` +
    isNullAndEmpty(data.CIR_NM10) +
    `</font></td></tr></table></div></div>
    <div class=offset style="z-index:62"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:310px;top:1038px;width:88px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:63"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:448px;top:1038px;width:108px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:64"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:554px;top:1038px;width:107px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:65"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:659px;top:1038px;width:108px;height:32px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
    <div class=offset style="z-index:66"><div style=";padding-left:3px;padding-right:3px;left:27px;top:1070px;width:740px;height:27px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>1/1</font></td></tr></table></div></div>
    </div>
    </body>
    </html>`

  return html
}

const isNull = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}

const isNullAndEmpty = (data) => {
  return isNull(data) ? '' : data
}
//Tab2 저장
const saveTab2 = () => {
  new saveFlowHelper(vm, t)
    .setBefore(saveTab2Check)
    .setQuery(saveTab2Data)
    .setAfter(saveTab2After)
    .run()
}

//Tab2 저장 데이터 유효성 검사
const saveTab2Check = () => {
  if (
    isNullCheck(searchParams.WORK_YN) ||
    isNullCheck(searchParams.NOTICE_GUBN)
  ) {
    Message.warn('저장 전 업무반영여부와 법규공지내역 선택바랍니다.')

    return false
  } else {
    return true
  }
}

//Tab2 DB저장 메서드
const saveTab2Data = () => {
  let saveList = [
    {
      CMPNY_DIV: userStore.cmpnyDiv,
      LAW_CD: searchParams.LAW_CD,
      WORK_YN: searchParams.WORK_YN,
      CHKLIST_YN: searchParams.CHKLIST_YN,
      REMARK: searchParams.REMARK,
      NOTICE_GUBN: searchParams.NOTICE_GUBN,
      NOTICE_CONTENT: searchParams.NOTICE_CONTENT,
      CIR_LIST: searchParams.CIR_LIST_ID.toString(),
      SOL_DATE: searchParams.SOL_DATE,
      USER_ID: userStore.userId,
      REV: searchParams.REV,
    },
  ]

  return commonExecuteApi({
    queryId: 'MNGEB0010_POP1_TAB2_SAVE_01',
    list: saveList,
  })
}
//Tab2 저장 후 처리
const saveTab2After = async () => {
  if (searchParams.CHKLIST_YN === 'Y') {
    await chkCheckList()
    await setTab3Grid()
  }
}
//Tab3 데이터 셋팅
const setTab3Grid = async () => {
  let rowDatas = grdMain.value.getDataProvider().getJsonRows()
  let chkNew = true

  if (grdMain.value.getDataProvider().rowCount <= 0) {
    await onButtonsTab3Click({ id: 'btnSearch' })
  }

  for (let i = 0; i < grdMain.value.getDataProvider().rowCount; i++) {
    if (
      rowDatas[i].LAW_CD === searchParams.LAW_CD &&
      rowDatas[i].REV != searchParams.REV
    ) {
      chkNew = false
      grdMain.value.getGridView().checkRow(i, true)
      grdMain.value.getGridView().setCurrent({ dataRow: i })
      // grdMain.value.getDataProvider().setValue(i, 'DEPT_NM', '')
      // grdMain.value.getDataProvider().setValue(i, 'CONTENT', '')
      // grdMain.value.getDataProvider().setValue(i, 'CYCLE', '')
      // grdMain.value.getDataProvider().setValue(i, 'CHK_TARGET', '')
      // grdMain.value.getDataProvider().setValue(i, 'CHK_CONTENT', '')
      // grdMain.value.getDataProvider().setValue(i, 'DEPT_CD', '')
      grdMain.value.getDataProvider().setValue(i, 'REV', searchParams.REV)
    }
  }

  if (chkNew) {
    grdMain.value.addRow(
      {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        LAW_CD: searchParams.LAW_CD,
        LAW_NM: searchParams.LAW_NM,
        DEPT_NM: '',
        CONTENT: '',
        CYCLE: '',
        CHK_TARGET: '',
        CHK_CONTENT: '',
        DEPT_CD: '',
        IDX_KEY: -1,
        REV: searchParams.REV,
      },
      false
    )
  }
  grdMain.value.setBindingColumn('CYCLE', codeList.CYCLE, 'COD', 'TXT')
}

//tab3 버튼 이벤트
const onButtonsTab3Click = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setBefore(beforeTab3Search)
      .setQuery(searchTab3Data)
      .setAfter(afterTab3Search)
      .run()
  } else if (btn.id === 'btnUpdate') {
    saveTab3()
  } else if (btn.id === 'btnCreate') {
    addRowTab3()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(deleteGrdMainData)
      .run()
  } else {
    let excelFileNM =
      '법규 준수평가 체크리스트_' + dayjs().format('YYYY-MM') + '.xlsx'

    if (grdMain.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }

    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      fileName: excelFileNM,
      progressMessage: '엑셀 다운로드중입니다.',
      showProgress: true,
      indicator: 'visible',
      header: 'visible',
      footer: 'hidden',
      allColumns: false,
    })
  }
}
//행추가
const addRowTab3 = () => {
  let rowIdx = grdMain.value.getGridView().getCurrent().dataRow

  let rowData =
    rowIdx >= 0
      ? grdMain.value.getDataProvider().getJsonRow(rowIdx)
      : {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          LAW_CD: searchParams.LAW_CD,
          LAW_NM: searchParams.LAW_NM,
          DEPT_NM: '',
          CONTENT: '',
          CYCLE: '',
          CHK_TARGET: '',
          CHK_CONTENT: '',
          DEPT_CD: '',
          IDX_KEY: -1,
          REV: searchParams.REV,
        }

  grdMain.value.addRow({
    CMPNY_DIV: rowData.CMPNY_DIV,
    LAW_CD: rowData.LAW_CD,
    LAW_NM: rowData.LAW_NM,
    DEPT_NM: '',
    CONTENT: '',
    CYCLE: '',
    CHK_TARGET: '',
    CHK_CONTENT: '',
    DEPT_CD: '',
    IDX_KEY: -1,
    REV: rowData.REV,
  })
}
//Tab3 사전체크
const beforeTab3Search = () => {
  return true
}
//Tab3 DB 조회
const searchTab3Data = () => {
  return commonSearchApi({
    queryId: 'MNGEB0010_POP1_TAB3_SEARCH_01',
    param: searchParams,
  })
}
//Tab3 DB 조회후 그리드 입력
const afterTab3Search = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//Tab3 DB 삭제
const deleteGrdMainData = () => {
  return commonExecuteApi({
    queryId: 'MNGEB0010_POP1_TAB3_DELETE_01',
    list: deleteFunction(grdMain),
  })
}

//Delete 행 선택
const deleteFunction = (grd) => {
  let delParams = []
  let checkedRows = grd.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grd.value.getDataProvider().getJsonRow(rowIdx)
    delParams.push(data)
  }

  for (let i = checkedRows.length - 1; i >= 0; i--) {
    grd.value.getDataProvider().removeRow(checkedRows[i])
  }

  return delParams
}

//Tab3 저장
const saveTab3 = () => {
  new saveFlowHelper(vm, t)
    .setGridList([grdMain])
    .setBefore(saveTab3Check)
    .setQuery(saveTab3Data)
    .setAfter(() => {
      onButtonsTab3Click({ id: 'btnSearch' })
    })
    .run()
}

//Tab3 데이터 체크
const saveTab3Check = () => {
  if (grdMain.value.getDataProvider().rowCount > 0) return true
  else return false
}

//Tab3 DB 저장
const saveTab3Data = () => {
  let saveParams = []

  // 그리드 전체 저장
  let stateCheckedRows = grdMain.value.getDataProvider().getJsonRows()
  let idx = 0
  for (let row of stateCheckedRows) {
    row.USER_ID = userStore.userId
    row.IDX_KEY = idx
    saveParams.push(row)
    idx++
  }

  return commonExecuteApi({
    queryId: 'MNGEB0010_POP1_TAB3_SAVE_01',
    list: saveParams,
  })
}

//부서 정보 팝업
const popupDeptOpen = (grid, clickInfo, column) => {
  searchParams.CLICK_ROW_IDX = clickInfo.itemIndex
  let row = grdMain.value.getRowData(searchParams.CLICK_ROW_IDX)

  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    ASGN_NM: row.DEPT_NM,
  })
}

//부서 팝업 데이터 입력
const onDeptSelected = (data) => {
  grdMain.value
    .getDataProvider()
    .setValue(searchParams.CLICK_ROW_IDX, 'DEPT_CD', data.ASGN_CD)
  grdMain.value
    .getDataProvider()
    .setValue(searchParams.CLICK_ROW_IDX, 'DEPT_NM', data.ASGN_SHRT_NM)
}

//체크리스트 저장 확인
const chkCheckList = async () => {
  await commonSearchApi({
    queryId: 'MNGEB0010_POP1_TAB3_SEARCH_02',
    param: searchParams,
  }).then((res) => {
    if (res.ORESULT !== null || res.ORESULT !== undefined) {
      searchParams.EXIST_LAW = '0'
      tab.value = 'tab3'
    } else {
      searchParams.EXIST_LAW = '1'
    }
  })
}

//콤보박스 설정
const initCombo = async () => {
  Promise.all([getCodeList('HHIAF40')]).then((res) => {
    codeList.CYCLE = res[0].ORESULT_CUR
  })

  //해당부문 설정
  commonSearchApi({
    queryId: 'LAW_DIV_SEARCH',
    param: { CMPNY_DIV: 'HHI', ALL_UP_CD: 'HHI.B', UP_CD: 'A', USE_FLAG: 'Y' },
  }).then((res) => {
    codeList.PART_GUBN = res.ORESULT_CUR
  })

  //법규 공지
  commonSearchApi({
    queryId: 'LAW_DIV_SEARCH',
    param: { CMPNY_DIV: 'HHI', ALL_UP_CD: 'HHI.C', UP_CD: 'A', USE_FLAG: 'Y' },
  }).then((res) => {
    codeList.NOTICE_GUBN = res.ORESULT_CUR
  })

  grdMain.value.setBindingColumn('CYCLE', codeList.CYCLE, 'COD', 'TXT')
}

//탭변경 이벤트
const selectedChanged = (tab) => {
  if (tab === 'tab1') {
  } else if (tab === 'tab2') {
  } else {
    if (grdMain.value.getDataProvider().rowCount == 0) {
      onButtonsTab3Click({ id: 'btnSearch' })
    }
    grdMain.value.setBindingColumn('CYCLE', codeList.CYCLE, 'COD', 'TXT')
  }
}
const approvalAppkey = (appKey) => {}
onMounted(() => {
  vm.$nextTick(() => {
    initCombo()
  })
})

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
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
      <span>제·개정 내역 팝업</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-2 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 조회조건 -->
      <v-sheet class="mb-2">
        <v-tabs v-model="tab" @click="selectedChanged(tab)">
          <v-tab v-if="tabVisible.TAB1" value="tab1"> 제·개정 내역 </v-tab>
          <v-tab v-if="tabVisible.TAB2" value="tab2"> 법규조치 </v-tab>
          <v-tab v-if="tabVisible.TAB3" value="tab3">
            법규 준수평가 체크리스트 관리
          </v-tab>
        </v-tabs>
      </v-sheet>
      <v-sheet v-if="tabVisible.TAB1" v-show="tab == 'tab1'" class="h-auto">
        <v-card-title class="pb-2">
          <IGridTitle
            ref="menuTitle1"
            :use-permission="false"
            :button-list="['btnUpdate', 'btnCompleteSend']"
            @click-button="onButtonsTab1Click"
          />
        </v-card-title>
        <v-card-text class="pt-0 content-area">
          <div class="d-flex flex-column">
            <v-sheet class="searchArea flex-column">
              <div class="d-flex pb-2">
                <i-input
                  :label="$t('제·개정 법규명')"
                  width="520px"
                  label-width="90px"
                  v-model="searchParams.LAW_NM"
                  type="Text"
                  margin="10px"
                  required
                  :readonly="tab1ReadOnly"
                  append-inner-icon="mdi-magnify"
                  @keydown.enter="
                    (e) => {
                      openLawPopup
                    }
                  "
                  @click:appendInner="openLawPopup"
                />
                <i-select
                  :label="$t('해당 부문')"
                  width="255px"
                  label-width="80px"
                  v-model="searchParams.PART_GUBN"
                  :items="codeList.PART_GUBN"
                  :readonly="tab1ReadOnly"
                  required
                  item-title="TXT"
                  item-value="COD"
                />
              </div>
              <div class="d-flex pb-2">
                <i-input
                  v-model="searchParams.ACQ_DATE"
                  :label="$t('입수일')"
                  type="date"
                  margin="10px"
                  required
                  :readonly="tab1ReadOnly"
                  width="255px"
                  label-width="90px"
                />
                <i-input
                  v-model="searchParams.ER_DATE"
                  :label="$t('제·개정일')"
                  type="date"
                  margin="10px"
                  required
                  :readonly="tab1ReadOnly"
                  width="255px"
                  label-width="80px"
                />
                <i-input
                  v-model="searchParams.PMG_DATE"
                  :label="$t('공포일')"
                  type="date"
                  margin="10px"
                  required
                  :readonly="tab1ReadOnly"
                  width="255px"
                  label-width="80px"
                />
                <i-input
                  v-model="searchParams.ACT_DATE"
                  :label="$t('시행일')"
                  type="date"
                  margin="10px"
                  required
                  :readonly="tab1ReadOnly"
                  width="255px"
                  label-width="80px"
                />
              </div>
            </v-sheet>
            <IGridTitle :title="$t('법규 입수내용')" />
            <v-sheet class="searchArea flex-column">
              <div class="d-flex pb-2">
                <v-textarea
                  class="mt-2"
                  v-model="searchParams.BF_CONTENT"
                  rows="8"
                  placeholder="개 정 전"
                />
                <v-textarea
                  class="mt-2"
                  v-model="searchParams.AF_CONTENT"
                  rows="8"
                  placeholder="개 정 후"
                />
              </div>
              <div class="d-flex pb-2">
                <i-input
                  :label="$t('조치 담당자 지정')"
                  width="565px"
                  label-width="110px"
                  v-model="searchParams.SMNG_NM"
                  type="Text"
                  margin="10px"
                  required
                  append-inner-icon="mdi-magnify"
                  @keydown.enter="
                    (e) => {
                      openEmpPopup
                    }
                  "
                  @click:appendInner="openEmpPopup"
                />
              </div>
            </v-sheet>
          </div>
        </v-card-text>
      </v-sheet>
      <v-sheet v-if="tabVisible.TAB2" v-show="tab == 'tab2'" class="h-auto">
        <v-card-title class="pb-2">
          <IGridTitle
            ref="menuTitle2"
            :use-permission="false"
            :button-list="['btnUpdate', 'btnReqApply', 'btnPrint']"
            @click-button="onButtonsTab2Click"
          />
        </v-card-title>
        <v-card-text class="pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <div class="d-flex pb-2">
                <i-input
                  :label="$t('제·개정 법규명')"
                  width="520px"
                  label-width="90px"
                  v-model="searchParams.LAW_NM"
                  type="Text"
                  margin="10px"
                  readonly
                />
                <i-select
                  :label="$t('해당 부문')"
                  width="255px"
                  label-width="80px"
                  v-model="searchParams.PART_GUBN"
                  :items="codeList.PART_GUBN"
                  readonly
                  item-title="TXT"
                  item-value="COD"
                />
              </div>
              <div class="d-flex pb-2">
                <i-input
                  v-model="searchParams.ACQ_DATE"
                  :label="$t('입수일')"
                  type="date"
                  margin="10px"
                  readonly
                  width="255px"
                  label-width="90px"
                />
                <i-input
                  v-model="searchParams.ER_DATE"
                  :label="$t('제·개정일')"
                  type="date"
                  margin="10px"
                  readonly
                  width="255px"
                  label-width="80px"
                />
                <i-input
                  v-model="searchParams.PMG_DATE"
                  :label="$t('공포일')"
                  type="date"
                  margin="10px"
                  readonly
                  width="255px"
                  label-width="80px"
                />
                <i-input
                  v-model="searchParams.ACT_DATE"
                  :label="$t('시행일')"
                  type="date"
                  margin="10px"
                  readonly
                  width="255px"
                  label-width="80px"
                />
              </div>
            </v-sheet>
            <IGridTitle :title="$t('법규 조치내용')" />
            <v-sheet class="searchArea flex-column">
              <div class="d-flex pb-2">
                <i-select
                  :label="$t('업무 반영 여부')"
                  width="255px"
                  label-width="100px"
                  v-model="searchParams.WORK_YN"
                  :items="codeList.WORK_YN"
                  required
                  item-value="COD"
                  item-title="TXT"
                />
                <i-input
                  v-model="searchParams.REMARK"
                  :label="$t('내용')"
                  type="text"
                  margin="10px"
                  width="510px"
                  label-width="100px"
                />
                <v-checkbox
                  class="ml-1 mt-1"
                  label="법규준수평가 체크리스트 개정(안전&환경부서용)"
                  v-model="searchParams.CHKLIST_YN"
                  true-value="Y"
                  false-value="N"
                ></v-checkbox>
              </div>
              <div class="d-flex pb-2">
                <i-select
                  :label="$t('법규 공지내역')"
                  width="255px"
                  label-width="100px"
                  v-model="searchParams.NOTICE_GUBN"
                  :items="codeList.NOTICE_GUBN"
                  required
                  item-value="COD"
                  item-title="TXT"
                />
                <i-input
                  v-model="searchParams.NOTICE_CONTENT"
                  :label="$t('내용')"
                  type="text"
                  margin="10px"
                  width="510px"
                  label-width="100px"
                />
              </div>
              <div class="d-flex pb-2">
                <i-input
                  :label="$t('법규 회람 대상자')"
                  width="1100px"
                  label-width="100px"
                  v-model="searchParams.CIR_LIST_NM"
                  type="Text"
                  margin="10px"
                  readonly
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openCirPopup"
                />
              </div>
            </v-sheet>
          </div>
        </v-card-text>
      </v-sheet>
      <v-sheet v-if="tabVisible.TAB3" v-show="tab == 'tab3'" class="h-auto">
        <v-card-title class="pb-2">
          <IGridTitle
            ref="gridTitle1"
            :title="$t('안전&환경 부서용')"
            :use-permission="false"
            :button-list="[
              'btnSearch',
              'btnCreate',
              'btnDelete',
              'btnUpdate',
              'btnPrint',
            ]"
            @click-button="onButtonsTab3Click"
          />
        </v-card-title>
        <v-card-text class="pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="h-auto">
              <RealGrid
                ref="grdMain"
                class="mt-2"
                style="height: 400px"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellButtonClicked="popupDeptOpen"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </v-sheet>
    </v-card>
    <!-- 법규 선택 팝업 -->
    <MNGEB0010PopTab1Popup
      ref="mNGEB0010PopTab1Popup"
      @selected="onMNGEB0010PopTab1PopupSelected"
    />
    <!-- 결재 -->
    <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
    <!-- 임직원 선택 팝업 -->
    <EmpPopup ref="empPopup" @selected="selectedEmpData" />
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
    <!-- 회람인원 팝업 -->
    <MNGEB0010PopTab2Popup
      ref="mNGEB0010PopTab2Popup"
      @selected="onMNGEB0010PopTab2PopupSelected"
    />
    <!-- OZReport -->
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="params"
      @close="showOz = $event"
    />
  </VDialog>
</template>

<style lang="scss" scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.content-area {
  position: relative;
  height: calc(57vh - 180px);
  overflow-y: hidden;
  > div {
    min-height: 400px;
  }
}
</style>
