<!--
  화면명 : MNGAA0040.vue
  화면개요 :HSE 중점추진사항 분석
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
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import OZReport from '@/components/OZReport.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'

defineOptions({
  name: '10_management-MNG_A-MNGAA0040',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)
const userId = ref(userStore.userId)
const logsStore = useLogsStore()
const approvalPopup = ref(null)
const ASSELookup = reactive([])

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

const setPrint = () => {
  reportName.value = '/manage/hse/MNGAA0040.ozr'

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

const info = ref({
  year: null,
  insertDate: null,
  insertEmpNm: null,
  statusNm: null,
  cnfmDate: null,
  planCnfmDate: null,
  prodDiv: null,
  vendYN: null,
})

const HSE_DIVLookup = reactive([
  { value: '1', label: '안전' },
  { value: '2', label: '보건' },
  { value: '3', label: '환경' },
])

let ASSE_items = reactive([
  {COD : '',  TXT: '',   },
  {COD : '1', TXT: '미흡',},
  {COD : '2', TXT: '달성',},
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
  ASGN_FULL_NM: '',

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
      fieldName: 'PLAN_ITEM',
      dataType: 'text',
      width: '350',
      editable: false,
      header: { text: t('실행방안') },
      styleName: 'left-column',
    },
    {
      fieldName: 'PLAN_DESC',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('주기') },
    },
    {
      fieldName: 'RATE',
      dataType: 'text',
      width: '50',
      header: { text: t('이행율(%)') },
      styleCallback: function (grid, dataCell) {
        let ret = {style: { background: '#FFFFFF' },}
        const val = grid.getValue(dataCell.index.itemIndex, 'PLAN_CYCLE')

        // 주기 별도 기준 - 입력가능
        if (val === 'Z'){
          ret.style = { background: '#EFF8FD'}
        } 

        return ret
      }
    },
    {
      fieldName: 'ASSE',
      dataType: 'text',
      width: '70',
      lookupDisplay: true, 
      lookupData: ASSELookup,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      editable: false,
      header: { text: t('달성여부') },
      styleCallback: function (grid, dataCell) {
        let ret = {style: { background: '#FFFFFF' },}
        const val = grid.getValue(dataCell.index.itemIndex, 'PLAN_CYCLE')

        if (dataCell.value === '1') {
          ret.style = { background: '#FFFACD' }
        }

        return ret
      },
    },
    {
      fieldName: 'REASON',
      dataType: 'text',
      width: '200',
      header: { text: t('사유') },
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      styleName: 'editable_column multiline-editor',
    },
    {
      fieldName: 'IMP_DIRECTION',
      dataType: 'text',
      width: '200',
      header: { text: t('향후개선방향') },
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      styleName: 'editable_column multiline-editor',
    },

    // 출력 안함
    {
      fieldName: 'YEAR_ATTAIN_RATE',
      dataType: 'number',
      width: '70',
      numberFormat: '#,##0.###',
      visible: false,
    },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'AHEAD_NO', dataType: 'text', visible: false },
    { fieldName: 'DETAIL_NO', dataType: 'text', visible: false },
    { fieldName: 'PLAN_CYCLE', dataType: 'text', visible: false },
    { fieldName: 'PLAN_NO', dataType: 'text', visible: false },
    { fieldName: 'PLAN_ORD', dataType: 'text', visible: false },
    { fieldName: 'YEAR', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    'HSE_DIV',
    'PLAN_ITEM',
    'PLAN_DESC',
    'RATE',
    'YEAR_ATTAIN_RATE',
    'ASSE',
    'REASON',
    'IMP_DIRECTION',
  ],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    if (!searchParams.ASGN_NM) {
      Message.warn('부서/협력사를 선택해주세요.')

      return
    }
    stateSearch()
  } else if (btn.id === 'btnCreate') {
    addData()
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
  } else if (btn.id === 'btnConfirm') {
    confirm()
  } else if (btn.id === 'btnCancelConfirm') {
    cancelConfirm()
  } else if (btn.id === 'btnReqApply') {
    reqApply()
  } else if (btn.id === 'btnReqModify') {
    reqModify()
  } else if (btn.id === 'btnAcceptModify') {
    acceptModify()
  } else if (btn.id === 'btnFinishModify') {
    finishModify()
  } else if (btn.id === 'btnCopy') {
    openPopup('복사')
  } else if (btn.id === 'btnPrint') {
    showOz.value = true
  }
}

/* -------------- 조회 -------------- */

const stateSearch = () => {
  commonSearchApi({ queryId: 'MNGAA0040_SEARCH_01', param: searchParams })
    .then((res) => {
      if (res.ORESULT_CUR.length < 1) {
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
        info.value.year = ''
        info.value.insertDate = ''
        info.value.insertEmpNm = ''
        info.value.cnfmDate = ''
        info.value.statusNm = ''
        info.value.planCnfmDate = ''
        info.value.prodDiv = ''
        info.value.vendYN = ''
        info.value.INSERT_USER_EMAIL = ''

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
      info.value.planCnfmDate = res.ORESULT_CUR[0].PLAN_CNFM_DATE
      info.value.prodDiv = res.ORESULT_CUR[0].PROD_DIV
      info.value.vendYN = res.ORESULT_CUR[0].PROD_DIV
      info.value.vendYN = res.ORESULT_CUR[0].VEND_YN
      info.value.INSERT_USER_EMAIL = res.ORESULT_CUR[0].INSERT_USER_EMAIL

      setButton(res.ORESULT_CUR[0])
      setPrint()
    })
    .finally(() => {
      new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchData01)
        .setAfter(afterSearch01)
        .run()
    })
}

// 서브 그리드
const searchData01 = (idx) => {
  return commonSearchApi({
    queryId: 'MNGAA0040_SEARCH_02',
    param: searchParams,
  })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  let rowData =  grdMain.value.getDataProvider().getJsonRow(0) 
  console.log("rowData", rowData)

  if(rowData.PLAN_CYCLE !== 'Z'){
    grdMain.value.getGridView().setColumn({name: 'RATE', editable: false})
  }
  else{
    grdMain.value.getGridView().setColumn({name: 'RATE', editable: true})
  }


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
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: 'MNGAA0040_SAVE_01', list: saveParams })
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

/* -------------- 확정(작성완료) -------------- */
const confirm = async () => {
  // 협력사만 상태를 70으로 변경
  if (info.value.prodDiv === 'Y' && info.value.vendYN === 'N') {
    return
  }

  let ck = await vm.$swal({
    title: t('작성완료(확정) 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    Message.warn('취소되었습니다.')
    return
  }

  ;(confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV),
    (confirmParam.BSNS_CD = searchParams.BSNS_CD),
    (confirmParam.DEPT_CD = searchParams.DEPT_CD),
    (confirmParam.ASGN_CD = searchParams.ASGN_CD),
    (confirmParam.YEAR = searchParams.YEAR),
    (confirmParam.STATUS = '70') // 협력사
  confirmParam.USER_ID = userId.value

  await commonExecuteApi({
    queryId: 'MNGAA0040_UPDATE_01',
    list: [confirmParam],
  })
  onButtonsClick({ id: 'btnSearch' })
}

/* -------------- 완료 취소 -------------- */
const cancelConfirm = async () => {
  // 협력사만 가능, 70을 10으로
  let ck = await vm.$swal({
    title: t('확정취소 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    Message.warn('취소되었습니다.')
    return
  }

  ;(confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV),
    (confirmParam.BSNS_CD = searchParams.BSNS_CD),
    (confirmParam.DEPT_CD = searchParams.DEPT_CD),
    (confirmParam.ASGN_CD = searchParams.ASGN_CD),
    (confirmParam.YEAR = searchParams.YEAR),
    (confirmParam.STATUS = '10')
  confirmParam.USER_ID = userId.value

  await commonExecuteApi({
    queryId: 'MNGAA0040_UPDATE_01',
    list: [confirmParam],
  })
  onButtonsClick({ id: 'btnSearch' })
}

/* -------------- 수정 요청 -------------- */

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

  // confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV,
  // confirmParam.BSNS_CD = searchParams.BSNS_CD,
  // confirmParam.DEPT_CD = searchParams.DEPT_CD,
  // confirmParam.ASGN_CD = searchParams.ASGN_CD,
  // confirmParam.YEAR = searchParams.YEAR,
  // confirmParam.STATUS = '50',
  // confirmParam.USER_ID = userId.value

  // await commonExecuteApi({ queryId: "MNGAA0040_UPDATE_01", list: [confirmParam] })
  // onButtonsClick({ id :'btnSearch' })
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

/* -------------- 수정 완료 -------------- */
const finishModify = async () => {
  let ck = await vm.$swal({
    title: t('수정완료 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!ck.isConfirmed) {
    Message.warn('취소되었습니다.')

    return
  }

  ;(confirmParam.CMPNY_DIV = searchParams.CMPNY_DIV),
    (confirmParam.BSNS_CD = searchParams.BSNS_CD),
    (confirmParam.DEPT_CD = searchParams.DEPT_CD),
    (confirmParam.ASGN_CD = searchParams.ASGN_CD),
    (confirmParam.YEAR = searchParams.YEAR),
    (confirmParam.STATUS = '70'), //수정승인(60)를 확정상태(70)으로 변경
    (confirmParam.USER_ID = userId.value)

  await commonExecuteApi({
    queryId: 'MNGAA0040_UPDATE_01',
    list: [confirmParam],
  })
  onButtonsClick({ id: 'btnSearch' })
}

/* -------------- 팝업 오픈 -------------- */
const openPopup = (gbn) => {
  if (gbn === '부서조회') {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: 'Y',
      ASGN_NM: searchParams.ASGN_NM,
      pageGbn: 'MNG',
    })
  } else if (gbn === '복사') {
    let path = useLogsStore().path.split('/')
    let menuId = path[path.length - 1]
    copyPopup.value.openCopyPopup(menuId, searchParams)
  }
}

// 복사 팝업 닫고나서 재 조회
const closeCopy = () => {
  onButtonsClick({ id: 'btnSearch' })
}

// 결재
const reqApply = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchApplyData)
    .setAfter(afterSearchApply)
    .run()

    // 결재 후 재조회
    onButtonsClick({ id: 'btnSearch' })
}

const searchApplyData = () => {
  return commonSearchApi({ queryId: 'MNGAA0040_PRINT_01', param: searchParams })
}

const appData = reactive({})

const afterSearchApply = (res) => {
  // console.log('결재 res:',res)

  if (res.length === 0) {
    Message.warn('결재할 데이터가 없습니다.')
    return
  }

  appData.CMPNY_DIV = res.ORESULT_CUR[0].CMPNY_DIV
  appData.BSNS_CD = res.ORESULT_CUR[0].BSNS_CD
  appData.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
  appData.ASGN_CD = res.ORESULT_CUR[0].ASGN_CD
  appData.YEAR = res.ORESULT_CUR[0].YEAR
  appData.STATUS = '40'
  appData.USER_ID = userStore.userId

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
  #f_18w22s0{
  font-size:18pt;
  line-height:22pt;
  letter-spacing:0pt;
  }
  font.맑은_고딕{
  font-family:맑은 고딕;
  }
  #f_9w12s0{
  font-size:9pt;
  line-height:12pt;
  letter-spacing:0pt;
  }
  #f_10w13s0{
  font-size:10pt;
  line-height:13pt;
  letter-spacing:0pt;
  }
  font.굴림{
  font-family:굴림;
  }
  #left{
  text-align:left;
  }
  -->
  </style>
  </head>
  <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
  <div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:1123px;height:793px">
  <!--
  <div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:37px;width:617px;height:96px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_18w22s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>2023년&nbspHSE&nbsp중점&nbsp추진&nbsp실적&nbsp분석</font></td></tr></table></div></div>
  <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:641px;top:37px;width:115px;height:49px;overflow:hidden;background-color:#FFFFFF"><table class=two cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>소속부서<BR>(협력사)</font></td></tr></table></div></div>
  <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:754px;top:37px;width:116px;height:49px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/>팔란티어추진팀</font></td></tr></table></div></div>
  <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:868px;top:37px;width:115px;height:96px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>작성일</font></td></tr></table></div></div>
  <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:981px;top:37px;width:116px;height:96px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
  <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:641px;top:84px;width:115px;height:49px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>작성자</font></td></tr></table></div></div>
  <div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:754px;top:84px;width:116px;height:49px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
  -->
<div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:131px;width:48px;height:78px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>구분</font></td></tr></table></div></div>
<div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:72px;top:131px;width:309px;height:78px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>실행&nbsp방안</font></td></tr></table></div></div>
<div class=offset style="z-index:10"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:379px;top:131px;width:120px;height:78px;overflow:hidden;background-color:#FFFFFF"><table class=two cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>주기<BR>(실행주기&nbsp등&nbsp실적&nbsp<BR>관리&nbsp기준)</font></td></tr></table></div></div>
<div class=offset style="z-index:11"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:497px;top:131px;width:67px;height:78px;overflow:hidden;background-color:#FFFFFF"><table class=two cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>이행율<BR>(%)</font></td></tr></table></div></div>
<div class=offset style="z-index:12"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:562px;top:131px;width:81px;height:78px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>달성여부</font></td></tr></table></div></div>
<div class=offset style="z-index:13"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:641px;top:131px;width:180px;height:78px;overflow:hidden;background-color:#FFFFFF"><table class=two cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>사유<BR>(추진실적에&nbsp대한&nbsp사유&nbsp작성)</font></td></tr></table></div></div>
<div class=offset style="z-index:14"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:819px;top:131px;width:278px;height:78px;overflow:hidden;background-color:#FFFFFF"><table class=two cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>향후&nbsp개선&nbsp방향<BR>(실적&nbsp사유에&nbsp따른&nbsp개선&nbsp방안&nbsp작성,&nbsp<BR>내년년도&nbsp목표&nbsp및&nbsp중점&nbsp추진사항&nbsp작성시&nbsp반영)</font></td></tr></table></div></div>`

  let zindex = 15
  // let idx = 1
  let top = 113
  let height = 54
  for (let i = 0; i < res.ORESULT_CUR.length; i++) {
    // d+=`<div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:${top}px;width:48px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].HSE_DIV_NM}</font></td></tr></table></div></div>
    //     <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:72px;top:${top}px;width:244px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].PLAN_ITEM}</font></td></tr></table></div></div>
    //     <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:314px;top:${top}px;width:119px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].PLAN_DESC}</font></td></tr></table></div></div>
    //     <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:431px;top:${top}px;width:68px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].RATE}</font></td></tr></table></div></div>
    //     <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:497px;top:${top}px;width:67px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].}0</font></td></tr></table></div></div>
    //     <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:562px;top:${top}px;width:81px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].ASSE}</font></td></tr></table></div></div>
    //     <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:641px;top:${top}px;width:180px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].REASON}</font></td></tr></table></div></div>
    //     <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:819px;top:${top}px;width:278px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].}</font></td></tr></table></div></div>`

    d += `<div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:${top}px;width:48px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${
      res.ORESULT_CUR[i].HSE_DIV_NM
    }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:72px;top:${top}px;width:309px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=굴림><nobr/>${
      res.ORESULT_CUR[i].PLAN_ITEM
    }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:379px;top:${top}px;width:120px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${
      res.ORESULT_CUR[i].PLAN_DESC
    }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:497px;top:${top}px;width:67px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${
      res.ORESULT_CUR[i].RATE
    }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:562px;top:${top}px;width:81px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${
      res.ORESULT_CUR[i].ASSE
    }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:641px;top:${top}px;width:180px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=굴림><nobr/>${
      res.ORESULT_CUR[i].REASON
    }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:819px;top:${top}px;width:278px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_10w13s0 class=굴림><nobr/>${
      res.ORESULT_CUR[i].IMP_DIRECTION
    }</font></td></tr></table></div></div>`
    top = top + height - 2
  }
  d += `</div>
  </body>
  </html>`

  approvalPopup.value.openPopup({
    CLSS_ID: 'MNGAA0040',
    TITLE: 'HSE 중점추진사항 분석',
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

  if (gbn === 'modify') {
    mailParams.SUBJECT = '[알림] HSE중점추진사항 분석 수정 승인 요청'
    mailParams.CONTENT =
      `
    <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>
          <a href="${url}">HSE 중점추진사항 분석</a> 수정 요청 승인 바랍니다.
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
    mailParams.SUBJECT = '[HSEs] HSE 중점추진사항 분석 수정승인 알림'
    mailParams.CONTENT = `
    <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>
          <a href="${url}">HSE 중점추진사항 분석</a> 수정요청이 승인되었습니다.
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
  } else if (gbn === 'acceptModify') {
    /* ******************** 수정승인 ******************* */
    searchParams.STATUS = '60' // 수정요청(50)를 수정승인(60)으로 변경
    mailParams.EMAIL = [info.value.INSERT_USER_EMAIL]
    // console.log('수정승인 mailParams:',mailParams)
    // console.log('수정승인 searchParams:',searchParams)
    commonExecuteApi({ queryId: 'MNGAA0040_UPDATE_01', list: [searchParams] })
      .then((res) => {
        if (res.list[0].OUT_RES_COD === '0') {
          commonSendApi(mailParams).then((res) => {
            Message.success(t('메일이 전송되었습니다.'))
          })
          // console.log('수정승인 메일 보내졌다고 하자')
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
    // console.log('modify searchParam:',searchParams)
    // console.log('수정요청 보내기 전 mailParams:',mailParams)
    commonExecuteApi({ queryId: 'MNGAA0040_UPDATE_01', list: [searchParams] })
      .then((res) => {
        if (res.list[0].OUT_RES_COD === '0') {
          commonSendApi(mailParams).then((res) => {
            Message.success(t('메일이 전송되었습니다.'))
          })
          // console.log('수정요청 메일 보내졌다고 하자')
        }
      })
      .finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
  }
}

/* -------------- 버튼 세팅 -------------- */
const setButton = async (res) => {
  // disable은 true 안보임, false 보임 (cs와 반대)
  // visible은 true 보임, false 안보임 (cs와 같음)

  menuTitle.value.disableBtn('btnConfirm', true) //확정
  menuTitle.value.disableBtn('btnCancelConfirm', true) //확정취소
  menuTitle.value.disableBtn('btnReqApply', true) //결재상신
  menuTitle.value.disableBtn('btnUpdate', true) //저장

  menuTitle.value.disableBtn('btnReqModify', true) //수정요청
  menuTitle.value.disableBtn('btnAcceptModify', true) //수정승인
  menuTitle.value.disableBtn('btnFinishModify', true) //수정완료

  /*
   * 상태코드(F30)
   * 10 : 작성중
   * 40 : 결재진행중
   * 70 : 결재완료/확정
   *
   *
   * 상단 버튼
   *  btn수정요청     :직영 만, 70상태일때만 활성화 => 50으로 변경
   *  btn수정승인     :직영 만, 50일때만 활성화, 관리자만 가능 => 60으로 변경
   *  btn수정완료     :직영 만, 60일때만 활성화 => 70으로 변경
   *
   *  btn확정         :협력사 만: 10 => 70으로 변경
   *  btn확정취소     :협력사 만: 70 => 10으로 변경
   *  btn결재상신     :직영만 : 10 일때 활성, 40으로 변경
   *                   협력사 : x
   */

  let editable = false
  await commonSearchApi({
    queryId: 'MNGAA0040_SEARCH_03',
    param: searchParams,
  }).then((res) => {
    if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
      res.ORESULT_CUR.forEach((element) => {
        if (element.EMP_NO === userId.value) {
          editable = true
        }
      })
    }
  })

  let planStatus = res.PLAN_STATUS
  let vend_yn = res.VEND_YN
  let status = res.STATUS

  if (!planStatus === '70') {
    return
  }

  let auth = 'N'
  await commonSearchApi({ queryId: 'searchHseAuth', param: searchParams }).then(
    (res) => {
      auth = res.ORESULT_CUR[0].AUTH === 'Y' ? true : false
    }
  )


  // 버튼 숨김
  if (vend_yn === 'N') {
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', false) //확정
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false) //확정취소
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', true) //결재상신
  } else if (vend_yn === 'Y') {
    menuTitle.value.setBtnProperty('btnConfirm', 'visible', true) //확정
    menuTitle.value.setBtnProperty('btnCancelConfirm', 'visible', true) //확정취소
    menuTitle.value.setBtnProperty('btnReqApply', 'visible', false) //결재상신
  }

  if (status === '10' && vend_yn === 'Y') {
    menuTitle.value.disableBtn(
      'btnConfirm',
      (editable ? false : true) && (auth ? false : true)
    ) //확정
  }
  if (status === '70' && vend_yn === 'Y') {
    menuTitle.value.disableBtn(
      'btnCancelConfirm',
      (editable ? false : true) && (auth ? false : true)
    ) //확정
  }
  if (status === '10' && vend_yn === 'N') {
    menuTitle.value.disableBtn(
      'btnReqApply',
      (editable ? false : true) && (auth ? false : true)
    ) //결재상신
  } else {
    menuTitle.value.disableBtn('btnReqApply', true) //결재상신
  }

  if (status === '10' || status === '60') {
    //작성중, 수정승인 상태일때 저장가능.
    menuTitle.value.disableBtn('btnUpdate', false) //저장
  } else {
    menuTitle.value.disableBtn('btnUpdate', true) //저장
  }

  if (vend_yn === 'N') {
    //직영일때
    menuTitle.value.setBtnProperty('btnReqModify', 'visible', true) //수정요청
    menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', true) //수정승인
    menuTitle.value.setBtnProperty('btnFinishModify', 'visible', true) //수정완료
    if (status === '70') {
      menuTitle.value.disableBtn(
        'btnReqModify',
        (editable ? false : true) && (auth ? false : true)
      ) //수정요청
      menuTitle.value.disableBtn('btnAcceptModify', true) //수정승인
      menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', false) //수정승인
      menuTitle.value.disableBtn('btnAcceptModify', true) //수정완료
    } else if (status === '50') {
      menuTitle.value.disableBtn('btnReqModify', true) //수정요청
      menuTitle.value.disableBtn(
        'btnAcceptModify',
        logsStore.isMenuAdmin ? false : true
      ) //수정승인
      menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', true) //수정승인
      menuTitle.value.disableBtn('btnAcceptModify', true) //수정완료
    } else if (status === '60') {
      menuTitle.value.disableBtn('btnReqModify', true) //수정요청
      menuTitle.value.disableBtn('btnAcceptModify', true) //수정승인
      menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', false) //수정승인
      menuTitle.value.disableBtn(
        'btnAcceptModify',
        (editable ? false : true) && (auth ? false : true)
      ) //수정완료
    } else {
      menuTitle.value.disableBtn('btnReqModify', true) //수정요청
      menuTitle.value.disableBtn('btnAcceptModify', true) //수정승인
      menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', false) //수정승인
      menuTitle.value.disableBtn('btnAcceptModify', true) //수정완료
    }
  } else {
    // 직영 아닌 부서는 사용하지 않음
    menuTitle.value.setBtnProperty('btnReqModify', 'visible', false) //수정요청
    menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', false) //수정승인
    menuTitle.value.setBtnProperty('btnFinishModify', 'visible', false) //수정완료
  }
}

const onEditRowChanged = (
  grid,
  itemIndex,
  dataRow,
  field,
  oldValue,
  newValue
) => {
  grid.commit()

  let rowData = grdMain.value.getDataProvider().getJsonRow(dataRow)
  let fieldName = grdMain.value.getDataProvider().getFieldName(field)

  if (fieldName === 'RATE') {
    grdMain.value
      .getDataProvider()
      .setValue(dataRow, 'YEAR_ATTAIN_RATE', rowData.RATE)
  }

  grdMain.value.getGridView().checkItem(dataRow, true)

  let cycle_val = grid.getValue(dataCell.index.itemIndex, 'PLAN_CYCLE')
  
  if (fieldName === 'RATE' && cycle_val !== 'Z'){
    grdMain.value.getGridView().setColumn({name: 'RATE', editable: false})
  }
}

const rowChanged = (grid, oldRow, newRow)=> {
  if(newRow === -1){
    return
  }


  let rowData = grdMain.value.getDataProvider().getJsonRow(newRow)
  if(rowData.PLAN_CYCLE !== 'Z'){
    grdMain.value.getGridView().setColumn({name: 'RATE', editable: false})

  }
  else{
    grdMain.value.getGridView().setColumn({name: 'RATE', editable: true})
  }
}

const initCodeList = () => {
  Promise.all([getCodeList('HHIAF31')]).then((res) => {

    grdMain.value.setBindingColumn('ASSE', ASSE_items, 'COD', 'TXT')

    if (res[0].ORESULT_CUR.length > 0) {
      res[0].ORESULT_CUR.forEach((item) => {
        mailList.push(item.CODE_DESC1)
      })
    }
  })
}

onMounted(() => {
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})

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

/* ------------ 결재 후 결재ID 저장 ------------ */
const approvalAppkey = (appKey) => {
  appData.APPROVE_ID = appKey
  commonExecuteApi({ queryId: 'MNGAA0040_UPDATE_02', list: [appData] })
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnSearch',
          'btnUpdate',
          'btnConfirm',
          'btnCancelConfirm',
          'btnReqApply',
          'btnReqModify',
          'btnAcceptModify',
          'btnFinishModify',
          'btnPrint',
          'btnCopy',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
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
            <i-input v-model="searchParams.DEPT_CD" readonly width="100px" />
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
                :label="$t('상태')"
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
          <br> ※ 주기가 '별도기준'인 경우 이행율을 입력 후 저장해주세요.
        </v-sheet>

        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            style="height: calc(100vh - 330px)"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onEditRowChanged="onEditRowChanged"
            @onCurrentRowChanged="rowChanged"
          />
        </v-sheet>
      </div>
    </v-card-text>

    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />

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
      <v-sheet
        color="primarySub"
        height="50"
        class="px-4 d-flex align-center rounded-t-5 cursor-move"
        @mousedown="startDragging"
      >
        <span>수정요청</span>
      </v-sheet>

      <v-card class="pa-0 fill-height rounded-b-5">
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="mt-7 mb-2" style="color: black">
            수정요청 사유를 입력하세요
          </div>
          <i-input v-model="modifyMsg" readonly width="100%" />
          <div class="d-flex mt-4 justify-end">
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
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 결재 -->
    <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
  </v-card>
</template>
