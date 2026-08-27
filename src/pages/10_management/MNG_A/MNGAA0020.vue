<!--
  화면명 : MNGAA0020.vue
  화면개요 :HSE 방침/목표/중점추진사항
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import OZReport from '@/components/OZReport.vue'
import MNGAA0020Popup1 from './MNGAA0020Popup1.vue'
import MNGAA0020Popup2 from './MNGAA0020Popup2.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

defineOptions({
  name: '10_management-MNG_A-MNGAA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const logsStore = useLogsStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const approvalPopup = ref(null)
const copyPopup = ref(null)
const mNGAA0020Popup1 = ref(null)
const mNGAA0020Popup2 = ref(null)
const userId = ref(userStore.userId)
const btnPopup2 = ref(null)
const fileUploadPopup = ref(null)
const file = ref([])
const buttonList = reactive([])

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// Oz 출력 세팅
const setPrint = () => {
  reportName.value = '/manage/hse/MNGAA0020.ozr'
  // reportName.value = '/manage/hse/MNGAA0020_1.ozr'

  params.value = [
    'IN_ASGN_NM=' + searchParams.ASGN_NM, // 소속부서
    'IN_INSERT_EMP_NM=' +
      (!info.value.insertEmpNm ? '' : info.value.insertEmpNm), // 작성자
    'IN_INSERT_DATE=' + (!info.value.insertDate ? '' : info.value.insertDate), // 작성일
    'IN_CMPNY_DIV=' + searchParams.CMPNY_DIV,
    'IN_BSNS_CD=' + searchParams.BSNS_CD,
    'IN_DEPT_CD=' + searchParams.DEPT_CD,
    'IN_ASGN_CD=' + searchParams.ASGN_CD,
    'IN_YEAR=' + searchParams.YEAR,
  ]
}

// #1 END ------------------------------------------------------

// 복사 팝업 닫고나서 재 조회
const closeCopy = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const info = ref({
  year: null,
  insertDate: null,
  insertEmpNm: null,
  statusNm: null,
  cnfmDate: null,
  prodDiv: null,
  vendYN: null,
  INSERT_USER_EMAIL: null,
})

const HSE_DIVLookup = reactive([
  { value: '1', label: '안전' },
  { value: '2', label: '보건' },
  { value: '3', label: '환경' },
])

const STATUS_NM = reactive([
  { code: '10', text: '작성중' },
  { code: '11', text: '재작성요청' },
  { code: '20', text: '검토요청' },
  { code: '30', text: '검토완료' },
  { code: '40', text: '결재진행중' },
  { code: '50', text: '수정요청중' },
  { code: '60', text: '수정승인' },
  { code: '70', text: '결재완료/확정' },
])

const confirmParam = reactive({
  CMPNY_DIV: null,
  BSNS_CD: null,
  DEPT_CD: null,
  ASGN_CD: null,
  YEAR: null,
  STATUS: null,
  USER_ID: null,
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,

  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  ASGN_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm,
  ASGN_FULL_NM: userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm,

  YEAR: dayjs().get('year'),
  EMP_NO: userStore.userId
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    header: { height: 60 },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  keys: ['COL01'],
  fields: [
    {
      fieldName: 'HSE_DIV',
      dataType: 'text',
      width: '50',
      lookupDisplay: true,
      lookupData: HSE_DIVLookup,
      editable: false,
      header: { text: t('구분') },
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'GOAL_TITLE',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('목표') },
      mergeRule: { criteria: 'prevvalues + value' },
      styleName: 'left-column multiline-editor',
    },
    {
      fieldName: 'AHEAD_ORD',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('No.') },
      mergeRule: { criteria: 'prevvalues + value' },
    },
    {
      fieldName: 'AHEAD_ITEM',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('중점항목') },
      mergeRule: { criteria: 'prevvalues + value' },
      styleName: 'left-column multiline-editor',
    },
    {
      fieldName: 'PLAN_NO',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('No.') },
      mergeRule: { criteria: 'prevvalues + value' },
    },
    {
      fieldName: 'PLAN_ITEM',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('실행방안') },
      styleName: 'left-column multiline-editor',
    },
    {
      fieldName: 'PLAN_DESC',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('주기') },
      styleName: 'left-column multiline-editor',
    },
    {
      fieldName: 'PLAN_DOCU',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('기록관리') },
      styleName: 'left-column multiline-editor',
    },
    {
      fieldName: 'PERSON_NAME',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('담당자') },
      styleName: 'left-column multiline-editor',
    },
    {
      fieldName: 'DETAIL_COMMENT',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('검토의견') },
      styleName: 'multiline-editor left-column',
    },

    // 출력 안함
    // { fieldName: 'DETAIL_ORD', dataType: 'text', width: '50',editable: false,
    //   header: { text: t('No.') }, mergeRule: { "criteria": "prevvalues + value" } },
    // { fieldName: 'DETAIL_ITEM', dataType: 'text', width: '400',  editable: false,
    //   header: { text: t('세부내용') }, styleName: "left-column multiline-editor" },
    { fieldName: 'RESULT_MEASUREMENT', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'AHEAD_NO', dataType: 'text', visible: false },
    { fieldName: 'DETAIL_NO', dataType: 'text', visible: false },
    { fieldName: 'PLAN_CYCLE', dataType: 'text', visible: false },
    { fieldName: 'PLAN_ORD', dataType: 'text', visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    'HSE_DIV',
    'GOAL_TITLE',
    // {
    //   name: '중점 추진 사항(중대재해 차단대책 반영)',
    //   direction: 'horizontal',
    //   items: [
    //     'AHEAD_ORD',
    //     'AHEAD_ITEM',
    //     'DETAIL_ORD',
    //     'DETAIL_ITEM',
    //   ],
    // },
    'AHEAD_ORD',
    'AHEAD_ITEM',
    // 'DETAIL_ORD',
    // 'DETAIL_ITEM',

    'PLAN_NO',
    'PLAN_ITEM',
    'PLAN_DESC',
    'RESULT_MEASUREMENT',
    'PLAN_DOCU',
    'PERSON_NAME',
    'DETAIL_COMMENT',
  ],
})

grdMainProps.columns = grdMainProps.fields


// 결재 상신 시 테스트
const isValidFormat = (str) => {
  // 정규 표현식: ^\d.*\/\d+$ 
  const regex = /^\d.*\/.+$/; 
  return ((str ==='작성불필요') || regex.test(str));
}


//메뉴버튼
const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    if (!searchParams.ASGN_NM) {
      Message.warn('부서/협력사를 선택해주세요.')

      return
    }
    stateSearch()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnCopy') {
    openPopup('복사')
  } else if (btn.id === 'btnPrint') {
    showOz.value = true
  }  else if (btn.id === 'btnReqApply') {
    
    const rowCount = grdMain.value.getDataProvider().getRowCount()

    for (let i = 0; i < rowCount; i++) {
      const cellValue = grdMain.value.getDataProvider().getValue(i, "PLAN_DESC");
      const cellValue2 = grdMain.value.getDataProvider().getValue(i, "PLAN_CYCLE");

      if (isValidFormat(cellValue)|| cellValue2 === 'Z'){
        console.log('주기 PASS')
      }
      else {
        Message.err('주기 데이터가 없는 실행방안이 있습니다. 주기를 수정해 주세요.')
        return;
      }
        }

    new queryFlowHelper(vm, t)
      .setQuery(searchApplyData)
      .setAfter(afterSearchApply)
      .run()

      onButtonsClick({ id: 'btnSearch' })
      
  }  else if (btn.id === 'btnReqModify') {
    reqModify()
  } else if (btn.id === 'btnAcceptModify') {
    acceptModify()
  } else if (btn.id === 'btnFinishModify') {
    finishModify()
  }else if (btn.id === 'btnConfirm') {
    Confirm()
  } else if (btn.id === 'btnCancelConfirm') {
    CancelConfirm()
  }






}

/* -------------- 조회 -------------- */
// 상태값 조회
const stateSearch = async () => {
  commonSearchApi({ queryId: 'MNGAA0020_SEARCH_01', param: searchParams })
    .then((res) => {
      if (res.ORESULT_CUR.length < 1) {
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
        info.value.year = ''
        info.value.insertDate = ''
        info.value.insertEmpNm = ''
        info.value.cnfmDate = ''
        info.value.statusNm = ''
        info.value.prodDiv = ''
        info.value.vendYN = ''
        info.value.INSERT_USER_EMAIL = ''

        disableBtnPopup2.value = false

        setButton()
        return
      }

      info.value.year = res.ORESULT_CUR[0].YEAR
      info.value.insertDate = res.ORESULT_CUR[0].INSERT_DATE
        ? dayjs(res.ORESULT_CUR[0].INSERT_DATE).format('YYYY-MM-DD')
        : ''
      info.value.insertEmpNm = res.ORESULT_CUR[0].INSERT_EMP_NM
      info.value.cnfmDate = res.ORESULT_CUR[0].CNFM_DATE
      info.value.statusNm = res.ORESULT_CUR[0].STATUS
        ? STATUS_NM.filter(
            (status) => status.code === res.ORESULT_CUR[0].STATUS
          )[0].text
        : ''
      //info.value.prodDiv = res.ORESULT_CUR[0].PROD_DIV
      info.value.vendYN = res.ORESULT_CUR[0].VEND_YN
      info.value.INSERT_USER_EMAIL = res.ORESULT_CUR[0].INSERT_USER_EMAIL

      setButton(res.ORESULT_CUR[0])
      setPrint()
    })
    .finally(async () => {
      let searchData = ''
      await commonSearchApi({
        queryId: 'MNGAA0060_SEARCH_04',
        param: searchParams,
      }).then((res) => {
        searchData = res.ORESULT_CUR
      }) // kpi 데이터 가져옴
      if (searchData.length > 0) {
        for (let i = 0; i < searchData.length; i++) {
          searchData[i].ASGN_CD = searchParams.ASGN_CD
          searchData[i].DEPT_CD = searchParams.DEPT_CD
        }
        await commonExecuteApi({
          queryId: 'MNGAA0020_SAVE_03',
          list: searchData,
        }).then((res) => {}) // 중점항목
        await commonExecuteApi({
          queryId: 'MNGAA0020_SAVE_04',
          list: searchData,
        }).then((res) => {}) // 세부내용
        await commonExecuteApi({
          queryId: 'MNGAA0020_SAVE_05',
          list: searchData,
        }).then((res) => {}) // 세부계획(실행방안)
      }

      new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchData01)
        .setAfter(afterSearch01)
        .run()
    })
}

// 하단 그리드 조회
const searchData01 = (idx) => {
  return commonSearchApi({
    queryId: 'MNGAA0020_SEARCH_02',
    param: searchParams,
  })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* -------------- 저장 -------------- */
const beforeSave = () => {
  return validationCheck()
}

const saveData = () => {
  let saveParams = []

  // 상태바가 체크된 항목
  let stateCheckedRows = grdMain.value.getDataProvider().getStateRows('updated')

  for (let rowIdx of stateCheckedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userId.value
    data.COMMENT = data.DETAIL_COMMENT
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: 'MNGAA0020_SAVE_01', list: saveParams })
}

// 저장, 삭제전 사용자 정의 validation
const validationCheck = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  } else {
    return true
  }
}


/* -------------- 결재 -------------- */
const searchApplyData = () => {
  return commonSearchApi({ queryId: 'MNGAA0020_PRINT_01', param: searchParams })
}

const appData = reactive({})

const afterSearchApply = (res) => {

  appData.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
  appData.BSNS_CD = res.ORESULT_CUR[0].BSNS_CD
  appData.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
  appData.ASGN_CD = res.ORESULT_CUR[0].ASGN_CD
  appData.YEAR = res.ORESULT_CUR[0].YEAR
  appData.STATUS = '40'
  appData.USER_ID = userStore.userId

  if (res.length === 0) {
    Message.warn('결재할 데이터가 없습니다.')
    return
  }

  let zindex = 12
  let idx = 1
  let top = 97
  let height = 262

  let d = `<html>
  <head>
  <title>OZ HTML</title>
  <style type="text/css">
  <!--
  div.offset{
  position:absolute;
  background-color:transparent;
  box-sizing: border-box;
  -moz-box-sizing: border-box;
  -ms-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  left:0px;
  top:0px;
  width:0px;
  height:0px;
  }
  div{
  position:relative;
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
  -moz-box-sizing: border-box;
  -ms-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  }
  #f_9w12s0{
  font-size:9pt;
  line-height:12pt;
  letter-spacing:0pt;
  }
  font.맑은_고딕{
  font-family:맑은 고딕;
  }
  #f_10w13s0{
  font-size:10pt;
  line-height:13pt;
  letter-spacing:0pt;
  }
  font.굴림{
  font-family:굴림;
  }
  -->
  </style>
  </head>
  <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
  <div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:1123px;height:${
    res.ORESULT_CUR.length * height + top
  }px">
  <div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:37px;top:37px;width:47px;height:60px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>No.</font></td></tr></table></div></div>
  <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:82px;top:37px;width:48px;height:60px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>구&nbsp분</font></td></tr></table></div></div>
  <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:128px;top:37px;width:126px;height:60px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>목&nbsp표</font></td></tr></table></div></div>
  <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:252px;top:37px;width:350px;height:31px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>중점&nbsp추진&nbsp사항</font></td></tr></table></div></div>
  <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:600px;top:37px;width:161px;height:60px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>실&nbsp행&nbsp&nbsp방&nbsp안</font></td></tr></table></div></div>
  <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:759px;top:37px;width:70px;height:60px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>주&nbsp기</font></td></tr></table></div></div>
  
  <div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:827px;top:37px;width:77px;height:60px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>기&nbsp록&nbsp관&nbsp리</font></td></tr></table></div></div>
  <div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:903px;top:37px;width:78px;height:60px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>담&nbsp당&nbsp자</font></td></tr></table></div></div>
  
  <div class=offset style="z-index:10"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:252px;top:66px;width:349px;height:31px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>세&nbsp부&nbsp내&nbsp용</font></td></tr></table></div></div>`

  for (let i = 0; i < res.ORESULT_CUR.length; i++) {
    d += `<div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:37px;top:${top}px;width:47px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림>${idx++}</font></td></tr></table></div></div>
          <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:82px;top:${top}px;width:48px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림>${
      res.ORESULT_CUR[i].HSE_DIV_NM
    }</font></td></tr></table></div></div>
          <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:128px;top:${top}px;width:126px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림>${
      res.ORESULT_CUR[i].GOAL_TITLE
    }</font></td></tr></table></div></div>
          <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:252px;top:${top}px;width:349px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림>${
      res.ORESULT_CUR[i].AHEAD_ITEM
    }</font></td></tr></table></div></div>
          <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:600px;top:${top}px;width:161px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림>${
      res.ORESULT_CUR[i].PLAN_ITEM
    }</font></td></tr></table></div></div>
          <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:759px;top:${top}px;width:70px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림>${
      res.ORESULT_CUR[i].PLAN_DESC
    }</font></td></tr></table></div></div>

          <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:827px;top:${top}px;width:77px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림>${
      res.ORESULT_CUR[i].PLAN_DOCU
    }</font></td></tr></table></div></div>
          <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:903px;top:${top}px;width:78px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림>${
      res.ORESULT_CUR[i].PERSON_NAME
    }</font></td></tr></table></div></div>`

    top = top + height - 2
  }
  d += `</div>
    </body>
    </html>`

  approvalPopup.value.openPopup({
    CLSS_ID: 'MNGAA0020',
    TITLE: 'HSE 방침/목표/중점추진사항',
    CMPNY_DIV: userStore.cmpnyDiv,
    DATA_KEY:
      userStore.cmpnyDiv +
      ';' +
      searchParams.BSNS_CD +
      ';' +
      searchParams.DEPT_CD +
      ';' +
      searchParams.ASGN_CD +
      ';' +
      searchParams.YEAR, // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
    REPORT: d, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE: 'CLR_15', //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  })
  
}

/* -------------- 재작성요청 -------------- */
const reWrite = async () => {
  let dataCount = grdMain.value.getDataProvider().getRowCount()
  if (dataCount === 0) {
    Message.warn('데이터가 없습니다.')
    return false
  }

  let ck = await vm.$swal({
    title: t('재작성요청 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    Message.warn('취소되었습니다.')

    return
  }

  mailSet('reWrite')
}

/* -------------- 안전검토완료 -------------- */
const finishReview = async () => {
  let ck = await vm.$swal({
    title: t('안전검토완료 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    Message.warn('취소되었습니다.')

    return
  }

  mailSet('finishReview')
}

/* -------------- 수정요청 -------------- */

// 수정요청 메세지
const modifyMsg = ref(null)
const modifyDialog = ref(false)
const mailList = reactive([])

const reqModify = async () => {
  let ck = await vm.$swal({
    title: t('수정요청 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    Message.warn('취소되었습니다.')

    return
  }
  
  modifyMsg.value = null
  modifyDialog.value = true
}

/* -------------- 수정승인 -------------- */
const acceptModify = async () => {
  let ck = await vm.$swal({
    title: t('수정승인 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    Message.warn('취소되었습니다.')

    return
  }

  mailSet('acceptModify')
}

const finishModify = async () => {
  let ck = await vm.$swal({
    title: t('수정완료 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    Message.warn('취소되었습니다.')

    return
  }

  ;(confirmParam.STATUS = '70'),
    (confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV),
    (confirmParam.BSNS_CD = searchParams.BSNS_CD),
    (confirmParam.DEPT_CD = searchParams.DEPT_CD),
    (confirmParam.ASGN_CD = searchParams.ASGN_CD),
    (confirmParam.YEAR = searchParams.YEAR),
    (confirmParam.USER_ID = userId.value)

  await commonExecuteApi({
    queryId: 'MNGAA0020_UPDATE_01',
    list: [confirmParam],
  })
  onButtonsClick({ id: 'btnSearch' })
}

const CancelConfirm = async () => {

 let dataCount = grdMain.value.getDataProvider().getRowCount()
  if (dataCount === 0) {
    Message.warn('데이터가 없습니다.')
    return false
  }

  let ck = await vm.$swal({
    title: t('확정(완료)취소 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    Message.warn('취소되었습니다.')

    return
  }

  mailSet('cancelConfirm')
}



const Confirm = () => {

 // 70으로 변경  
  confirmParam.STATUS = '70'
  confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV
  confirmParam.BSNS_CD = searchParams.BSNS_CD
  confirmParam.DEPT_CD = searchParams.DEPT_CD
  confirmParam.ASGN_CD = searchParams.ASGN_CD
  confirmParam.YEAR = searchParams.YEAR
  confirmParam.USER_ID = userId.value


 commonExecuteApi({ queryId: 'MNGAA0020_UPDATE_01', list: [confirmParam] })
      .then((res) => {
        if (res.list[0].OUT_RES_COD === '0') {
          try {
            // 협력사만 확정하기 때문에 굳이 메일 보낼 필요 없음
            // commonSendApi(mailParams).then((res) => {
            //   Message.success(t('메일이 전송되었습니다.'))
            // })
          } catch (e) {
            
          }
        }
      })
      .finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })

}














/* ******************************** 메일 발송 ******************************* */
const mailSet = async (gbn) => {
  modifyDialog.value = false
  let send = true

  /* ******************** 메일 SET ******************* */
  const mailParams = reactive({
    EMAIL: [],
    SUBJECT: '',
    CONTENT: '',
  })

  let url = 'http://10.100.45.205:49220/#/'

  if (gbn === 'confirm') {
    mailParams.SUBJECT = '[알림] HSE중점추진사항 계획 작성 완료'
    mailParams.CONTENT = `
    <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>
          <a href="${url}">HSE 중점추진사항 계획</a> 작성이 완료되었습니다. 작성 내용 검토바랍니다.
          <br />
          <br />
          부서/협력사: ${searchParams.ASGN_CD} ${searchParams.ASGN_NM} <br />
          <br />
          년도: ${searchParams.YEAR} <br />
          <br />
          작성자: ${info.value.insertEmpNm} <br />
          <br />
          <br />
          감사합니다.
        </body>
      </html>`
  } else if (gbn === 'cancelConfirm') {
    mailParams.SUBJECT = '[알림] HSE중점추진사항 계획 작성 완료 취소'
    mailParams.CONTENT = `
    <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>
          <a href="${url}">HSE 중점추진사항 계획</a> 작성이 완료가 취소되었습니다. 작성 내용 검토바랍니다.
          <br />
          <br />
          부서/협력사: ${searchParams.ASGN_CD} ${searchParams.ASGN_NM} <br />
          <br />
          년도: ${searchParams.YEAR} <br />
          <br />
          작성자: ${info.value.insertEmpNm} <br />
          <br />
          <br />
          감사합니다.
        </body>
      </html>`
  } else if (gbn === 'reWrite') {
    mailParams.SUBJECT =
      '[알림] HSE중점추진사항 계획 검토 의견 확인 및 재작성 요청'
    mailParams.CONTENT = `
    <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>
          <a href="${url}">HSE 중점추진사항 계획</a> 검토가 완료되었습니다. 검토 의견 확인 후 재작성 바랍니다.
          <br />
          <br />
          부서/협력사: ${searchParams.ASGN_CD} ${searchParams.ASGN_NM} <br />
          <br />
          년도: ${searchParams.YEAR} <br />
          <br />
          요청자: ${userStore.userName} <br />
          <br />
          <br />
          감사합니다.
        </body>
      </html>`
  } else if (gbn === 'finishReview') {
    mailParams.SUBJECT = '[알림] HSE중점추진사항 계획 검토 완료'
    mailParams.CONTENT = `
    <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>
          <a href="${url}">HSE 중점추진사항 계획</a> 검토가 완료되었습니다. 결재 진행바랍니다.
          <br />담당인원 또는 부문장 전결 
          <br />
          <br />
          부서/협력사: ${searchParams.ASGN_CD} ${searchParams.ASGN_NM} <br />
          <br />
          년도: ${searchParams.YEAR} <br />
          <br />
          검토자: ${userStore.userName} <br />
          <br />
          <br />
          감사합니다.
        </body>
      </html>`
  } else if (gbn === 'modify') {
    mailParams.SUBJECT = '[알림] HSE중점추진사항 계획 수정 승인 요청'
    mailParams.CONTENT =
      `
    <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>
          <a href="${url}">HSE 중점추진사항 계획</a> 수정 요청 승인 바랍니다.
          <br />
          <br />` +
      `${gbn === 'modify' ? modifyMsg.value + '<br /><br /> ' : ''}` +
      `부서/협력사: ${searchParams.ASGN_CD} ${searchParams.ASGN_NM} <br />
          <br />
          년도: ${searchParams.YEAR} <br />
          <br />
          작성자: ${info.value.insertEmpNm} <br />
          <br />
          <br />
          감사합니다.
        </body>
      </html>`
  } else if (gbn === 'acceptModify') {
    mailParams.SUBJECT = '[HSEs] HSE 중점추진사항 계획 수정승인 알림'
    mailParams.CONTENT = `
    <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>
          <a href="${url}">HSE 중점추진사항 계획</a> 수정 요청 승인되었습니다.
          <br />
          <br />
          부서/협력사: ${searchParams.ASGN_CD} ${searchParams.ASGN_NM} <br />
          <br />
          년도: ${searchParams.YEAR} <br />
          <br />
          승인자: ${userStore.userName} <br />
          <br />
          <br />
          감사합니다.
        </body>
      </html>`
  }

  /* ******************** 수정사유 입력 확인 ******************* */
  if (gbn === 'modify') {
    if (!modifyMsg.value) {
      let confirmYn = await vm.$swal({
        title: t(
          '수정요청 사유가 입력되지 않았습니다. 수정요청 사유없이\n진행 하시겠습니까?'
        ),
        showCancelButton: true,
      })
      if (!confirmYn.isConfirmed) {
        send = false
        return
      }
    }
  } else if (gbn === 'confirm') {
    /* ******************** 확정(작성완료) ******************* */
    if (info.value.prodDiv === 'Y' && info.value.vendYN === 'N') {
      confirmParam.STATUS = '20'
    } else {
      confirmParam.STATUS = '70'
    }
    ;(confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV),
      (confirmParam.BSNS_CD = searchParams.BSNS_CD),
      (confirmParam.DEPT_CD = searchParams.DEPT_CD),
      (confirmParam.ASGN_CD = searchParams.ASGN_CD),
      (confirmParam.YEAR = searchParams.YEAR),
      (confirmParam.USER_ID = userId.value)
    mailParams.EMAIL = mailList
    commonExecuteApi({ queryId: 'MNGAA0020_UPDATE_01', list: [confirmParam] })
      .then((res) => {
        if (res.list[0].OUT_RES_COD === '0') {
          try {
            commonSendApi(mailParams).then((res) => {
              Message.success(t('메일이 전송되었습니다.'))
            })
          } catch (e) {
            
          }
        }
      })
      .finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
  } else if (gbn === 'cancelConfirm') {
    /* ******************** 완료취소 ******************* */
    ;(searchParams.STATUS = '10'),
      (mailParams.EMAIL = [info.value.INSERT_USER_EMAIL])
    commonExecuteApi({ queryId: 'MNGAA0020_UPDATE_01', list: [searchParams] })
      .then((res) => {
        if (res.list[0].OUT_RES_COD === '0') {
          // 협력사만 확정하기 때문에 굳이 메일 보낼 필요 없음
          // commonSendApi(mailParams).then((res) => {
          //   Message.success(t('메일이 전송되었습니다.'))
          // })
        }
      })
      .finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
  }  else if (gbn === 'acceptModify') {
    /* ******************** 수정승인 ******************* */
    searchParams.STATUS = '60' // 수정요청(50)를 수정승인(60)으로 변경
    mailParams.EMAIL = [info.value.INSERT_USER_EMAIL]
    commonExecuteApi({ queryId: 'MNGAA0020_UPDATE_01', list: [searchParams] })
      .then((res) => {
        if (res.list[0].OUT_RES_COD === '0') {
          commonSendApi(mailParams).then((res) => {
            Message.success(t('메일이 전송되었습니다.'))
          })
        }
      })
      .finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
  }
  /* ******************** 수정요청 ******************* */
  if (send && gbn === 'modify') {
    searchParams.STATUS = '50' // 확정상태(70)를 수정요청(50)으로 변경
    mailParams.EMAIL = mailList


    commonExecuteApi({ queryId: 'MNGAA0020_UPDATE_01', list: [searchParams] })
      .then((res) => {
        if (res.list[0].OUT_RES_COD === '0') {
          
          console.log("searchParams : ", searchParams)
          console.log("searchParams : ", searchParams.YEAR !== 2024)
          // 2024년 작성 건은 수정요청 없이 수정가능하게 하여 메일 발송도 X
          // 로그인 유저 소속이 직영만 수정요청 메일 발송
          if ((searchParams.YEAR.toString().trim() !== 2024 && searchParams.YEAR.toString().trim() !== '2024') && userStore.userDiv === 'A')
            //  && searchParams.YEAR.toString().trim() !== 2025 && searchParams.YEAR.toString().trim() !== '2025')
             {
            commonSendApi(mailParams).then((res) => {
              Message.success(t('메일이 전송되었습니다.'))
            })
          }
        }
      })
      .finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
  }
}

const setButton = async (res) => {
  
  // // disable은 true 안보임, false 보임 (cs와 반대)
  // // visible은 true 보임, false 안보임 (cs와 같음)
  // menuTitle.value.disableBtn('btnUpdate', true)         // 저장
  // menuTitle.value.disableBtn('btnReqApply', true)       // 결재상신
  // menuTitle.value.disableBtn('btnFinishReview', true)   // 검토완료
  // //menuTitle.value.disableBtn('btnReqModify', true)    // 수정요청
  // menuTitle.value.disableBtn('btnAcceptModify', true)   // 수정승인
  // menuTitle.value.disableBtn('btnFinishModify', true)   // 수정완료


  // 수정승인버튼
  menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', false)    // 수정승인버튼 기본적으론 숨기기 
  menuTitle.value.setBtnProperty('btnCopy', 'visible', false)            // 복사 버튼 숨기기 (이전 구조와 변경되어 복사가 불가능)

  /*
   * 상태코드(F30)
   * 10 : 작성중
   * 40 : 결재진행중
   * 50 : 수정요청중
   * 60 : 수정승인
   * 70 : 결재완료/확정
   
   * [목표/계획 작성버튼]
     : 상태가 10,60, 일때만 가능
  
   *  [상단 버튼]
   *  btn결재상신(btnReqApply)         : 직영 : 10 일때 활성, 40으로 변경, 하이오피스 결재되면 70이 됨.
   *                                     협력사 : 안보임
   *  btn확정 (btnConfirm)             : 직영 : 안보임
   *                                     협력사 : 10 일때 활성, 70으로 변경
   *  btn수정요청(btnReqModify)        : 70상태일때만 활성화 => 50으로 변경
   *  btn수정승인(btnAcceptModify)     : 50일때만 활성화, 관리자만 가능 => 60으로 변경
   *  btn수정완료(btnFinishModify)     : 60일때만 활성화 => 70으로 변경
   */

  /*조직별 추진담당자만 수정할수 있다.
   * dtauth=>
   */



  // let editable = false

  // await commonSearchApi({
  //   queryId: 'MNGAA0020_SEARCH_03',
  //   param: searchParams,
  // }).then((res) => {
  //   if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
  //     res.ORESULT_CUR.forEach((element) => {
  //       console.log('추진자:',  element.EMP_NO)
  //       if (element.EMP_NO === userId.value) {
  //         editable = true
  //       }
  //     })
  //   }
  // })

  // HSE 추진자 여부
  let auth = false
  await commonSearchApi({ queryId: 'searchHseAuth', param: searchParams }).then(
    async (res) => {
      auth = res.ORESULT_CUR[0].AUTH === 'Y' ? true : false
    }
  )

  if(logsStore.isMenuAdmin === 'Y'){
    auth = true
  }



  let status = ''
  let vend_yn = ''
  let allowNew = 'N'

  if (res) {
    //prod_div = 'Y'          // 2024.10.08 이정현 책임 요청으로 생산/비생산 구분 없이 적용하기 위해 전부 생산으로 처리
    status = res.STATUS     // 결재 상태
    vend_yn =  res.VEND_YN   // 협력사 여부 
    console.log("status, vend_yn:", status ,vend_yn)
  }


  if (
    (status === '' && searchParams.ASGN_CD != '') ||
    status === '10' ||
    status === '60'
  ) {
    disableBtnPopup2.value = false
  } else {
    disableBtnPopup2.value = true
  }

  // 업무 담당자가 아닌 경우 목표/계획 작성 버튼 비 활성화
  if (!auth) {
    disableBtnPopup2.value = true
  }


  //  * 10 : 작성중
  //  * 40 : 결재진행중
  //  * 50 : 수정요청중
  //  * 60 : 수정승인
  //  * 70 : 결재완료/확정



  
  // *  [상단 버튼]
  //  *  btn결재상신(btnReqApply)         : 직영 : 10 일때 활성, 40으로 변경, 하이오피스 결재되면 70이 됨.
  //  *                                     협력사 : 안보임
  //  *  btn확정 (btnConfirm)             : 직영 : 안보임
  //  *                                     협력사 : 10 일때 활성, 70으로 변경
  //  *  btn확정취소 (btnCancelConfirm)    : 직영 : 안보임
  //  *                                     협력사 : 70 일때 활성, 10으로 변경

  //  *  btn수정요청(btnReqModify)        : 70상태일때만 활성화 => 50으로 변경
  //  *  btn수정승인(btnAcceptModify)     : 50일때만 활성화, 관리자만 가능 => 60으로 변경
  //  *  btn수정완료(btnFinishModify)     : 60일때만 활성화 => 70으로 변경
  //  */



  // 직영
  if (vend_yn === 'N' ) {

    menuTitle.value.setBtnProperty('btnReqApply', 'visible', true)                // 결재상신 보이기
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', false)                // 확정버튼 숨기기
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false)          // 확정취소버튼 숨기기


    // 작성중: btnReqApply 만 있으면 됨
    if (status === '10'){
      menuTitle.value.disableBtn('btnReqApply',  false) // 결재상신 활성화

      menuTitle.value.setBtnProperty('btnReqModify', 'visible', false)             //  수정 관련 버튼 숨기기
      menuTitle.value.setBtnProperty('btnFinishModify', 'visible', false)          //  수정 관련 버튼 숨기기


    }

    // 결재진행중
    else if (status === '40'){
      menuTitle.value.disableBtn('btnReqApply',  true) // 결재상신 비활성화

      menuTitle.value.setBtnProperty('btnReqModify', 'visible', false)             //  수정 관련 버튼 숨기기
      menuTitle.value.setBtnProperty('btnFinishModify', 'visible', false)          //  수정 관련 버튼 숨기기

    }

    // 수정요청중
    else if (status === '50'){

     // 결재상신 비활성화
      menuTitle.value.disableBtn('btnReqApply',  true)

      //  수정 요청 버튼 보이기 & 비활성화
      menuTitle.value.setBtnProperty('btnReqModify', 'visible', true)              
      menuTitle.value.disableBtn('btnReqModify',  true)      

      //  수정 완료 버튼 숨기기
      menuTitle.value.setBtnProperty('btnFinishModify', 'visible', false)          


      // 관리자는 수정승인버튼 보이기 
      if (userStore.authGrpCd.includes('HIWAYGRP00001') || userStore.authGrpCd.includes('MNGAA001') ){
        menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', true)
      }

    }
    // 수정승인
    else if (status === '60'){
      // 결재상신 비활성화
      menuTitle.value.disableBtn('btnReqApply',  true) 

      //  수정 요청 버튼 숨기기
      menuTitle.value.setBtnProperty('btnReqModify', 'visible', false)              

      //  수정 완료 버튼 보이기 & 활성화
      menuTitle.value.setBtnProperty('btnFinishModify', 'visible', true) 
      menuTitle.value.disableBtn('btnReqModify',  false)      


    }
    // 결재완료/확정
    else if (status === '70'){

      // 결재상신 비활성화
      menuTitle.value.disableBtn('btnReqApply',  true) 

      //  수정 요청 버튼 보이기 & 활성화
      menuTitle.value.setBtnProperty('btnReqModify', 'visible', true)              
      menuTitle.value.disableBtn('btnReqModify',  false) 

      //  수정 완료 버튼 숨기기
      menuTitle.value.setBtnProperty('btnFinishModify', 'visible', false)  


    }

    // 그 밖에 상태 (현재 사용하지 않는 상태)
    else{
      menuTitle.value.setBtnProperty('btnReqApply', 'visible', false)              
      menuTitle.value.setBtnProperty('btnConfirm', 'visible', false)       
      menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false)       
      menuTitle.value.setBtnProperty('btnReqModify', 'visible', false)       
      menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', false)       
      menuTitle.value.setBtnProperty('btnFinishModify', 'visible', false)       

    }


  }

  // 협력사
  else {

    menuTitle.value.setBtnProperty('btnReqApply', 'visible', false)          // 결재상신 숨기기
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', true)            // 확정버튼 보이기
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', true)      // 확정취소버튼 숨기기

    // 협력사는 수정 필요 X
    menuTitle.value.setBtnProperty('btnReqModify', 'visible', false)      // 수정요청버튼 숨기기 
    menuTitle.value.setBtnProperty('btnFinishModify', 'visible', false)   // 수정완료버튼 숨기기 

    // 작성중
    if (status === '10'){

      // 확정 활성화
      menuTitle.value.disableBtn('btnConfirm',  false) 
      // 확정취소 비활성화
      menuTitle.value.disableBtn('btnCancelConfirm',  true) 
    }


    // 결재완료
    else if (status === '70'){

      // 확정 비활성화
      menuTitle.value.disableBtn('btnConfirm',  true) 
      // 확정취소 활성화
      menuTitle.value.disableBtn('btnCancelConfirm',  false)
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false)      // 저장
    }else{
      // 작성중 이전인 경우 확정 버튼 숨김 처리
      menuTitle.value.setBtnProperty('btnConfirm', 'visible', false)            // 확정버튼 숨김
      menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false)      // 확정취소버튼 숨김
    }

  }


  // btn disable 상태 확인해서 못쓰면 invisible 해버리기
  let btnList = menuTitle.value.getButtonItems()
  btnList.forEach((e) => {
    if (e.disable === true) {
      menuTitle.value.setBtnProperty(e.id, 'visible', false)
    }
  })





}

/* -------------- 팝업 오픈 -------------- */
const openPopup = (gbn) => {
  if (gbn === '부서조회') {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: 'Y',
      ASGN_NM: searchParams.ASGN_NM,
    })
  } else if (gbn === 'click') {
    deptPopup.value.openPopup({})
  } else if (gbn === '복사') {
    let path = useLogsStore().path.split('/')
    let menuId = path[path.length - 1]
    copyPopup.value.openCopyPopup(menuId, searchParams)
  }
  // else if(gbn === '메뉴얼 관리'){
  //   //이건 관리자만 보여야한다

  //   // guid 만듬
  //   let fileID = 'MNGAA0020'
  //   fileUploadPopup.value.openPopup(fileID)
  // }
  // else if(gbn === '메뉴얼 다운로드'){
  //   manualDownload()
  // }
  else if (gbn === '방침/목표 관리') {
    if (logsStore.isMenuAdmin === 'Y') {
      buttonList.push(['btnDownLoad'])
    } else {
      buttonList.push(['btnCreate', 'btnDelete', 'btnDownLoad'])
    }
    mNGAA0020Popup1.value.openPopup()
  } else if (gbn === '목표/계획 작성') {
    mNGAA0020Popup2.value.openPopup(searchParams)
  }
}

// const manualDownload =  async () => {
//   Promise.all([commonSearchApi({ queryId: "searchFile", param: {CMPNY_DIV: 'HHI', FILE_ID: 'MNGAA0020'} })]).then(res => {
//     file.value = res[0].ORESULT_CUR
//     if(file.value.length < 1){
//       Message.info('저장된 메뉴얼이 없습니다.')
//       return
//     }
//     for(let i=0;i<file.value.length;i++){

//       commonDownloadFilesApi(file.value[i]).then((res) => {
//         const file = res.contentDisposition.split('fileName="')
//         const blob = new Blob([res])
//         const link = document.createElement("a")

//         link.href = URL.createObjectURL(blob)

//         link.download = decodeURI(file[1].replace('";', ""))
//         link.click()
//         URL.revokeObjectURL(link.href)
//       })
//     }

//   })

// }

const initCodeList = () => {
  Promise.all([getCodeList('HHIAF31', userStore.cmpnyDiv, 'Y', '0', null, 'Y')]).then((res) => {
    res[0].ORESULT_CUR.forEach((item) => {
      if (item.CODE_DESC2 === userStore.cmpnyDiv){
        mailList.push(item.CODE_DESC1)
      }    
    })
  })
  console.log("수정요청 MailList: ", mailList)
}

onMounted(() => {
  setButton() // 새로고침 시 가끔 부서가 없어지는 버그가 있는데 이럴 때 버튼이 안 뜨게 막아주려고 있음
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })

  // 관계자(안전)의 경우에만 그리드에서 검토의견 수정 활성화
  if (logsStore.isMenuAdmin === 'Y') {
    let DETAIL_COMMENT = { name: 'DETAIL_COMMENT' }
    DETAIL_COMMENT.editable = true
    ;(DETAIL_COMMENT.editor = {
      type: 'multiline',
      maxLength: 0, //입력길이제한 x
      height: 200,
    }),
      grdMain.value.getGridView().setColumn(DETAIL_COMMENT)
  }
})

const disableBtnPopup2 = ref(null)

watch(
  () => [searchParams.YEAR, searchParams.ASGN_NM],
  ([newValueYEAR, newValueASGN_NM], [oldValueYEAR, oldValueASGN_NM]) => {
    ;(info.value.year = ''),
      (info.value.insertDate = ''),
      (info.value.insertEmpNm = ''),
      (info.value.statusNm = ''),
      (info.value.cnfmDate = ''),
      grdMain.value.getDataProvider().setRows()
    // disableBtnPopup2.value = true // 조회가 안되면 목표/계획 작성 버튼을 비 활성화 했는데 이러면 데이터 입력이 안되어 주석처리함
  }
)

/* -------------- 팝업 선택 이벤트 -------------- */
const onDeptSelected = (val) => {
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM
  searchParams.ASGN_FULL_NM = val.ASGN_FULL_NM
  onButtonsClick({ id: 'btnSearch' })
}

/* ------------ 결재 후 결재ID 저장 ------------ */
const approvalAppkey = (appKey) => {
  appData.APPROVE_ID = appKey
  commonExecuteApi({ queryId: 'MNGAA0020_UPDATE_02', list: [appData] })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnSearch',        // 조회
          'btnUpdate',        // 저장
          'btnReqApply',      // 결재상신
          'btnReqModify',     // 수정요청
          'btnAcceptModify',  // 수정승인
          'btnFinishModify',  // 수정완료
          'btnPrint',         // 출력
          'btnCopy',          // 복사
          'btnConfirm',       // 확정
          'btnCancelConfirm', //확정취소

          //'btnReWrite', // 재작성 요청
          //'btnFinishReview', // 검토완료
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>


        



    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <!-- 조회조건 -->
        <v-sheet class="searchArea d-flex justify-space-between pt-2 pb-2">
          <div class="d-flex">
            <!-- <i-input
              :label="$t('년도')"
              label-width="35px"
              width="150px"
              v-model="searchParams.YEAR"
              type="Number"
              required
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
            /> -->

            <i-select
              :label="$t('년도')"
              type="YEAR"
              label-width="35px"
              width="150px"
              v-model="searchParams.YEAR"
              required
            />

            <i-input
              :label="$t('부서/ 협력사')"
              label-width="80px"
              width="350px"
              v-model="searchParams.ASGN_NM"
              append-inner-icon="mdi-magnify"
              @keydown.enter="
                (e) => {
                  openPopup('부서조회')
                }
              "
              @update:modelValue="
                (e) => {
                  searchParams.DEPT_CD = null
                }
              "
              @click:appendInner="openPopup('부서조회')"
              required
              class="ma-0"
            />
            <i-input v-model="searchParams.ASGN_CD" readonly width="100px" />
          </div>

          <div class="d-flex flex-column">
            <div class="d-flex">
              <i-input
                :label="$t('작성일')"
                labelWidth="70px"
                v-model="info.insertDate"
                readonly
                width="250px"
              />
              <i-input
                :label="$t('작성자(사번)')"
                labelWidth="100px"
                v-model="info.insertEmpNm"
                readonly
                width="270px"
              />
            </div>
            <div class="d-flex">
              <i-input
                :label="$t('진행상태')"
                labelWidth="70px"
                v-model="info.statusNm"
                readonly
                width="250px"
              />
              <i-input
                :label="$t('결재/확정일')"
                labelWidth="100px"
                v-model="info.cnfmDate"
                readonly
                width="270px"
              />
            </div>
          </div>
        </v-sheet>
        <v-sheet>
          <strong>※ HSE경영시스템 메뉴는 부서 내 HSE추진자만 입력 가능하며, HSE추진자는 부서에서 직접 관리합니다.</strong>
           &nbsp; - HSE추진자 등록 메뉴 : [운영관리 - 담당자 관리 - 부서별 담당자 등록/관리] 
          <br> &nbsp; - HSE추진자 등록 권한:  부서 내 HSE 추진자, 운영과장 
        </v-sheet>
        <!-- 버튼 -->
        <v-sheet class="d-flex justify-end">
          <div class="d-flex justify-end">
            <!-- <VBtn v-show="logsStore.isMenuAdmin === 'Y'" class="titleBtn" @click="openPopup('메뉴얼 관리')">메뉴얼 관리</VBtn> -->
            <!-- <VBtn class="titleBtn" @click="openPopup('메뉴얼 다운로드')">메뉴얼 다운로드</VBtn> -->
            <VBtn class="titleBtn" @click="openPopup('방침/목표 관리')"
              >전사 방침/목표</VBtn
            >
            <VBtn
              v-model="btnPopup2"
              :disabled="disableBtnPopup2"
              class="titleBtn"
              @click="openPopup('목표/계획 작성')"
              >목표/계획 작성</VBtn
            >
          </div>
        </v-sheet>

        <!-- 그리드 -->
        <v-sheet class="h-auto mt-2">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet>

        <!-- <RealGrid
              ref="grdMain"
              style="height: calc(100vh - 420px)"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            /> -->
      </div>
    </v-card-text>

    <!-- UPLOAD 팝업 -->
    <IUploadPopup
      ref="fileUploadPopup"
      @uploaded="uploaded"
      :buttonList="['btnDownLoad', 'btnDelete', 'btnClose']"
      :autoUpload="true"
    />

    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />

    <!-- 방침/목표 팝업 -->
    <!-- <MNGAA0020Popup1 ref="mNGAA0020Popup1" :buttonList="['btnCreate']" /> -->
    <MNGAA0020Popup1 ref="mNGAA0020Popup1" :buttonList="buttonList" />

    <!-- 목표/계획 팝업 -->
    <MNGAA0020Popup2
      ref="mNGAA0020Popup2"
      @popup2Exit="
        () => {
          onButtonsClick({ id: 'btnSearch' })
        }
      "
    />

    <!-- 복사 팝업 -->
    <CopyPopup ref="copyPopup" @closeCopy="closeCopy" />

    <!-- OZReport -->
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="params"
      @close="showOz = $event"
    />

    <v-dialog
      v-model="modifyDialog"
      eager
      persistent
      width="500"
      class="draggable-dialog"
    >
      <div class="title-bar">수정요청</div>
      <VContainer style="background-color: white">
        <VRow class="pa-2">
          <VCol cols="12 pa-2">수정요청 사유를 입력하세요</VCol>
          <VCol cols="12">
            <VTextField v-model="modifyMsg" />
          </VCol>
        </VRow>
        <VRow>
          <VCol align="right">
            <v-btn @click="mailSet('modify')">확인</v-btn>
            <v-btn
              class="ml-2"
              @click="
                () => {
                  modifyDialog = false
                }
              "
              >취소</v-btn
            >
          </VCol>
        </VRow>
      </VContainer>
    </v-dialog>

    <!-- 결재 -->
    <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
  </v-card>
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
