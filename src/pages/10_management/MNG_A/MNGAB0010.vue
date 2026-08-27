<!-- 
  화면명 : 내외부 이슈 및 리스크/기회 평가
  화면개요 : 내외부 이슈 및 리스크/기회 평가 관리 및 작성, 출력, 복사하는 화면
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
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import OZReport from '@/components/OZReport.vue'
import CompPopup from './MNGAB0010Popup.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'

defineOptions({
  name: '10_management-MNG_A-MNGAB0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)
const compPopup = ref(null)
const approvalPopup = ref(null)

// master 데이터 입력 권한자: 안전경영부, 안전보건지원부, ESG 추진부, 관리자그룹
const IsMaster = userStore.deptCd === 'N090' || userStore.deptCd === 'N1K0' || userStore.deptCd === 'N1L0' || userStore.authGrpCd.includes('HIWAYGRP00001')
const MasterMode = ref(false)


const btnAuthParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  EMP_NO: userStore.empNo,
})

const btnAuth = ref(false)
const isSearch = ref(false)
const dtAuth = reactive({
  list: [],
})

let korean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/

//조회조건 - 직영: DEPT_CD / 협력사: ASGN_CD
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get('year'),
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm,
  // DEPT_CD: 'XBS0',
  DEPT_CD: userStore.deptCd,
  YN_OUT: 'Y',
  STATUS: null,
  HSEAUTH: 'N',
  USER_ID: userStore.userId,
})

//조회조건
const state = reactive({
  INSERT_DATE: null,        // 작성일
  EDTR_NAME: null,          // 작성자
  EDTR_NAME2: null,         // 작성자
  PLAN_CNFM_DATE: null,     // 결재완료일
  STATUS: null,             // 진행상태
  STATUS_CD: null,
  INSERT_USER_EMAIL: null,  // 이메일
  UPDATE_EMP_NM2: '',
  UPDATE_DATE: null,        // 작성일(최신)
  UPDATE_DATE2: null,        // 작성일(최신)
})

const stateLength = ref(0)

// Grid SelectCheckBox
const deleteParam = ref(null)
const saveParam = ref(null)

const reportName = ref('/manage/hse/MNGAB0010.ozr')

// IN Parameters [ "PARAM1='AA'", "PARAM2='BB'"]
const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// 수정요청
const dialog = ref(false)

// 메일발송
const mailYn = ref(false)

// 수정요청 메세지
const modifyMsg = ref(null)

const HHIAF30 = reactive([]) // 결재상태코드
const HHIAJA = reactive([]) // 분류
const COMPList = reactive([
  // { value: '', label: '' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
])

const mailList = reactive([])

const initCodeList = () => {
  Promise.all([
    // 버튼 disable (해당부서의 HSE경영시스템 담당자)
    commonSearchApi({ queryId: 'searchHseAuth', param: btnAuthParam }),
    getCodeList('HHIAF30'),
    getCodeList('HHIAJA'),
    getCodeList('HHIAF31'),
  ]).then((res) => {
    
    // 해당부서의 HSE경영시스템 담당자면 true
    btnAuth.value = res[0].ORESULT_CUR[0].AUTH === 'Y' ? true : false
    //searchParams.HSEAUTH = res[0].ORESULT_CUR[0].AUTH
    setBtn()

    HHIAF30.value = res[1].ORESULT_CUR
    HHIAJA.value = res[2].ORESULT_CUR

    if (res[3].ORESULT_CUR.length > 0) {
      res[3].ORESULT_CUR.forEach((item) => {
        mailList.push(item.CODE_DESC1)
      })
    }

    grdMain.value.setBindingColumn('ISSUE_DIV', HHIAJA.value, 'COD', 'TXT')

    onButtonsClick({ id: 'btnSearch' })
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    header: { height: 60 },
    stateBar: { visible: false },
  },
  keys: [],
  fields: [
    {
      fieldName: 'ISSUE_DIV',
      dataType: 'text',
      width: '150',
      header: { text: t('분류') },
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      styleName: 'editable_column',
    },
    {
      fieldName: 'ISSUE_DESC',
      dataType: 'text',
      width: '250',
      header: { text: t('경영환경(이슈) / 이해관계자 니즈 및 기대사항 결정') },
      styleName: 'left-column multiline-editor editable_column',
      editor: { type: 'multiline', altEnterNewLine: true },
    },
    {
      fieldName: 'C_DIV',
      dataType: 'text',
      width: '50',
      header: { text: t('기회') },
      editable: false,
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      styleName: 'editable_column',
    },
    {
      fieldName: 'R_DIV',
      dataType: 'text',
      width: '50',
      header: { text: t('리스크') },
      editable: false,
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      styleName: 'editable_column',
    },
    {
      fieldName: 'ACTION_DESC',
      dataType: 'text',
      width: '150',
      header: { text: t('현재 조치 방법 / 영향') },
      styleName: 'left-column multiline-editor editable_column',
      editor: { type: 'multiline', altEnterNewLine: true },
    },
    {
      fieldName: 'FREQ',
      dataType: 'text',
      width: '60',
      header: { text: t('빈도') },
      lookupDisplay: true,
      lookupData: COMPList,
      editor: {
        type: 'dropdown',
        domainOnly: true,
        dropDownWhenClick: true,
        textReadOnly: true,
      },
      styleName: 'editable_column',
    },
    {
      fieldName: 'STRENGTH',
      dataType: 'text',
      width: '60',
      header: { text: t('강도') },
      lookupDisplay: true,
      lookupData: COMPList,
      editor: {
        type: 'dropdown',
        domainOnly: true,
        dropDownWhenClick: true,
        textReadOnly: true,
      },
      styleName: 'editable_column',
    },
    {
      fieldName: 'TOTAL',
      dataType: 'text',
      width: '60',
      header: { text: t('평점') },
      editable: false,
    },
    {
      fieldName: 'RANK',
      dataType: 'text',
      width: '60',
      header: { text: t('등급') },
      editable: false,
      styleCallback: function (grid, dataCell) {
        return styleCallback(grid, dataCell)
      },
    },
    {
      fieldName: 'APPLY_YN',
      dataType: 'text',
      width: '60',
      header: {
        text: t('개선계획서\n반영여부'),
        styleName: 'multiline-editor',
      },
      editable: false,
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      styleName: 'editable_column change_back_check',
    },

    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('회사') },
      visible: false,
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t('사업부') },
      visible: false,
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      header: { text: t('부서') },
      visible: false,
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      header: { text: t('조직') },
      visible: false,
    },
    {
      fieldName: 'CR_DIV',
      dataType: 'text',
      header: { text: t('CR_DIV') },
      visible: false,
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      header: { text: t('YEAR') },
      visible: false,
    },
    {
      fieldName: 'SEQ',
      dataType: 'text',
      header: { text: t('SEQ') },
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    'ISSUE_DIV',
    'ISSUE_DESC',
    {
      name: '기회/리스크 구분',
      direction: 'horizontal',
      items: ['C_DIV', 'R_DIV'],
      header: { text: t('기회/리스크 구분') },
    },
    'ACTION_DESC',
    {
      name: 'popupBtn',
      direction: 'horizontal',
      items: ['FREQ', 'STRENGTH', 'TOTAL', 'RANK'],
      header: {
        text: t('기회/리스크 평가'),
        template:
          "<div style='width: 100%; height: 30px;'><button style='width: 100%; height: 95%;' class='v-btn v-theme--light bg-primary titleBtn'><span>기회/리스크 평가</span><span class='mdi mdi-help-circle text-white text-h6 pl-2'></span> </ button> </div>",
        // template: "<div style='width: 100%; height: 30px;'><input type='button' value='기회/리스크 평가' style='width: 100%; height: 95%;' class='v-btn v-theme--light bg-primary titleBtn' /> </div>",
      },
    },
    'APPLY_YN',
  ],
})

grdMainProps.columns = grdMainProps.fields

/* ****************************** cell data 수정시 실행 ****************************** */
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

  if(fieldName !== 'APPLY_YN'){

    /* ******** 평점 계산 (빈도 * 강도) ******** */
    let TOTAL = rowData.FREQ * rowData.STRENGTH
    let RANK = null

    /* ******** 평점 변경 및 평점에 따라 등급 자동 변경 ******** */
    if (TOTAL === 0 || isNaN(TOTAL)) {
      RANK = null
      TOTAL = null
    } else if (TOTAL < 5) {
      RANK = 'L'
      grdMain.value.getDataProvider().setValue(dataRow, 'APPLY_YN', 'N')
    } else if (TOTAL >= 5 && TOTAL < 12) {
      RANK = 'M'
      grdMain.value.getDataProvider().setValue(dataRow, 'APPLY_YN', 'N')
    } else {
      RANK = 'H'
      grdMain.value.getDataProvider().setValue(dataRow, 'APPLY_YN', 'Y')
    }

    grdMain.value.getDataProvider().setValue(dataRow, 'TOTAL', TOTAL)
    grdMain.value.getDataProvider().setValue(dataRow, 'RANK', RANK)
    grdMain.value.getGridView().checkRow(dataRow, true)
  

    /* ************************ 기회 / 리스크 체크 ************************ */
    if (newValue === 'Y') {
      if (fieldName === 'C_DIV') {
        grdMain.value.getDataProvider().setValue(dataRow, 'R_DIV', 'N')
        grdMain.value.getDataProvider().setValue(dataRow, 'CR_DIV', 'C')
      } else if (fieldName === 'R_DIV') {
        grdMain.value.getDataProvider().setValue(dataRow, 'C_DIV', 'N')
        grdMain.value.getDataProvider().setValue(dataRow, 'CR_DIV', 'R')
      }
    } else if (newValue === 'N') {
      if (fieldName === 'C_DIV') {
        grdMain.value.getDataProvider().setValue(dataRow, 'CR_DIV', '')
      } else if (fieldName === 'R_DIV') {
        grdMain.value.getDataProvider().setValue(dataRow, 'CR_DIV', '')
      }
    }

    if (fieldName === 'APPLY_YN' && dataRow.RANK === 'H') {
      grdMain.value.getDataProvider().setValue(dataRow, 'APPLY_YN', 'Y')
    }
  } else {
    // 위험등급이 H가 아닐때만 체크 해제 가능
    if(rowData.RANK !== 'H'){
      grdMain.value.getDataProvider().setValue(dataRow, 'APPLY_YN', newValue)
      grdMain.value.getGridView().checkItem(itemIndex, true)
    }else {
      grdMain.value.getDataProvider().setValue(dataRow, 'APPLY_YN', 'Y')
    }
  }
}



/* ************* 등급 cell color 변경 ************* */
const styleCallback = (grid, dataCell) => {
  let ret = {}

  if (dataCell.value === 'L') {
    ret.style = { background: 'rgb(0,128,0)' }
  } else if (dataCell.value === 'M') {
    ret.style = { background: 'rgb(255,255,0)' }
  } else if (dataCell.value === 'H') {
    ret.style = { background: 'rgb(255,0,0)' }
  }
  
  return ret
}

//메뉴버튼
const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    stateSearch()
  } else if (btn.id === 'btnCreate') {
    addRowData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnCopy') {
    let path = useLogsStore().path.split('/')
    let menuId = path[path.length - 1]

    copyPopup.value.openCopyPopup(menuId, searchParams)
  } else if (btn.id === 'btnPrint') {
    if (params.value.length === 0) {
      Message.warn(t('조회 후 진행 하십시오.'))

      return
    }

    showOz.value = true
  } else if (btn.id === 'btnReqModify') {
    /* ********** 수정요청 ********** */
    let confirmYn = await vm.$swal({
      title: t('수정요청 하시겠습니까?'),
      showCancelButton: true,
    })
    if (!confirmYn.isConfirmed) {
      return
    } else {
      modifyMsg.value = null
      dialog.value = true
    }
  } else if (btn.id === 'btnAcceptModify') {
    /* ********** 수정승인 ********** */
    let confirmYn = await vm.$swal({
      title: t('수정승인 하시겠습니까?'),
      showCancelButton: true,
    })
    if (!confirmYn.isConfirmed) {
      return
    } else {
      mailSet('acceptModify')
    }
  } else if (btn.id === 'btnFinishModify') {
    /* ********** 수정완료 ********** */
    let confirmYn = await vm.$swal({
      title: t('수정완료 하시겠습니까?'),
      showCancelButton: true,
    })
    if (!confirmYn.isConfirmed) {
      return
    } else {
      mailSet('finishModify')
    }
  } else if (btn.id === 'btnReqApply') {
    reqApply()
  }
}

// 작성일, 작성자, 결재완료일, 진행상태
const stateSearch = () => {
  state.EDTR_NAME = null
  state.INSERT_DATE = null

  state.PLAN_CNFM_DATE = null
  state.STATUS = null
  state.STATUS_CD = null
  state.INSERT_USER_EMAIL = null
  isSearch.value = false

  stateLength.value = 0

  params.value = []

  commonSearchApi({ queryId: 'MNGAB0010_SEARCH_01', param: searchParams })
    .then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        // console.log(' RES1 : ' , res.ORESULT_CUR[0])
        state.EDTR_NAME = res.ORESULT_CUR[0].UPDATE_EMP_NM  // 최초작성자
          ? res.ORESULT_CUR[0].UPDATE_EMP_NM 
          : res.ORESULT_CUR[0].INSERT_EMP_NM
        state.EDTR_NAME2 = res.ORESULT_CUR[0].INSERT_EMP_NM2
        state.INSERT_DATE = res.ORESULT_CUR[0].INSERT_DATE
          ? dayjs(res.ORESULT_CUR[0].INSERT_DATE).format('YYYY-MM-DD')
          : null
        state.UPDATE_DATE = res.ORESULT_CUR[0].UPDATE_DATE
          ? res.ORESULT_CUR[0].UPDATE_DATE
          : null

        state.PLAN_CNFM_DATE = res.ORESULT_CUR[0].PLAN_CNFM_DATE
        state.INSERT_USER_EMAIL = res.ORESULT_CUR[0].INSERT_USER_EMAIL
        state.UPDATE_EMP_NM2 = res.ORESULT_CUR[0].UPDATE_EMP_NM2
        state.UPDATE_DATE2 = res.ORESULT_CUR[0].UPDATE_DATE2
        

        HHIAF30.value.forEach((item) => {
          if (item.COD === res.ORESULT_CUR[0].PLAN_STATUS) {
            state.STATUS = item.TXT
            state.STATUS_CD = item.COD
          }
        })

        stateLength.value = res.ORESULT_CUR.length

        setPrint(res.ORESULT_CUR[0])
        // }else {
        isSearch.value = true

      }

        /* ********************************** 추진담당자 조회 ************************************** */
          commonSearchApi({ queryId: 'MNGAB0010_SEARCH_03', param: searchParams })
        .then((res) => {
          if (res.ORESULT_CUR.length > 0) {
            dtAuth.list = res.ORESULT_CUR
            searchParams.HSEAUTH = 'Y'
          }
        })
        .finally(() => {
          setBtn()
        })

      new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchData02)
        .setAfter(afterSearch)
        .run()
        
    })
    .finally(() => {
      // new queryFlowHelper(vm, t)
      //   .setGridList([grdMain])
      //   .setQuery(searchData02)
      //   .setAfter(afterSearch)
      //   .run()

      setBtn()
    })
}

// 로우 추가
const addRowData = async () => {

  let seq = 1
  let rowCnt = await grdMain.value.getDataProvider().getRowCount()

  let newRow = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
    ASGN_CD: searchParams.ASGN_CD,
    YEAR: searchParams.YEAR,
  }
  grdMain.value.addRow(newRow)
}

const searchData02 = () => {
  return commonSearchApi({
    queryId: 'MNGAB0010_SEARCH_02',
    param: searchParams,
  })
}

const afterSearch = async (res) => {
  // console.log(' RES2 : ' , res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ************** 저장데이터 체크 ************** */
const beforeSave = async () => {
  saveParam.value = []

  let result = true
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    result = false
  } else {
    chekedRow.forEach((val) => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.USER_ID = userStore.empNo
      if (
        (!data.C_DIV || data.C_DIV === 'N') &&
        (!data.R_DIV || data.R_DIV === 'N')
      ) {
        Message.warn(t('기회/리스크중 하나를 선택하세요.'))

        result = false
      }

      saveParam.value.push(data)
    })
  }
  return result
}

/* ************** 삭제데이터 체크 ************** */
const beforeDelete = async () => {
  saveParam.value = []

  let result = true
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    result = false
  } else {
    chekedRow.forEach((val) => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      saveParam.value.push(data)
    })
  }
  return result
}

/* ******************************** 저장 ********************************* */
const saveData = () => {
  return commonExecuteApi({
    queryId: 'MNGAB0010_SAVE_01',
    list: saveParam.value,
  })
}

/* ******************************** 삭제 ********************************* */
const deleteData = () => {
  return commonExecuteApi({
    queryId: 'MNGAB0010_DELETE_01',
    list: saveParam.value,
  })
}

const reqApply = async () => {
  let rowCount = await grdMain.value.getDataProvider().getRowCount()
  let result = await vm.$swal({
    title: t('결재상신 하시겠습니까? '),
    showCancelButton: true,
  })
  if (!result.isConfirmed) {
    return
  }

  let setGrid = `
  <html>
    <head>
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
    #f_10w13s0{
    font-size:10pt;
    line-height:13pt;
    letter-spacing:0pt;
    }
    font.맑은_고딕{
    font-family:맑은 고딕;
    }
    #f_18w22s0{
    font-size:18pt;
    line-height:22pt;
    letter-spacing:0pt;
    }
    div.b_1{
    border-left-width:1px;
    border-right-width:1px;
    border-bottom-width:1px;
    border-top-width:1px;
    border-color:#000000;
    border-style:solid;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -ms-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    }
    div.b_2{
    border-left-width:1px;
    border-right-width:1px;
    border-bottom-width:0px;
    border-top-width:1px;
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
    #left{
    text-align:left;
    }
    font.굴림{
    font-family:굴림;
    }
    -->
    </style>
    </head>
    <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
    <div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:1123px; height:${
      rowCount * 35 + 100
    }px;">
    <div class=offset style="z-index:15"><div class=b_1 style=";padding-left:2px;padding-right:3px;left:26px;top:68px;width:32px;height:55px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>순</font></td></tr></table></div></div>
    <div class=offset style="z-index:16"><div class=b_1 style=";padding-left:2px;padding-right:3px;left:57px;top:68px;width:139px;height:55px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>분&nbsp&nbsp류</font></td></tr></table></div></div>
    <div class=offset style="z-index:17"><div class=b_1 style=";padding-left:2px;padding-right:3px;left:195px;top:68px;width:286px;height:55px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>경영환경(이슈)&nbsp/&nbsp<BR>이해관계자&nbsp니즈&nbsp및&nbsp기대사항&nbsp결정</font></td></tr></table></div></div>
    <div class=offset style="z-index:18"><div class=b_2 style=";padding-left:2px;padding-right:3px;left:480px;top:68px;width:113px;height:28px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>기회/리스크&nbsp구분</font></td></tr></table></div></div>
    <div class=offset style="z-index:19"><div class=b_1 style=";padding-left:2px;padding-right:3px;left:592px;top:68px;width:275px;height:55px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>현재&nbsp조치&nbsp방법&nbsp/&nbsp영향</font></td></tr></table></div></div>
    <div class=offset style="z-index:20"><div class=b_2 style=";padding-left:2px;padding-right:3px;left:866px;top:68px;width:154px;height:28px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>리스크&nbsp및&nbsp기회&nbsp평가</font></td></tr></table></div></div>
    <div class=offset style="z-index:21"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1019px;top:68px;width:78px;height:55px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>개선계획서<BR>반영여부</font></td></tr></table></div></div>
    <div class=offset style="z-index:22"><div class=b_1 style=";padding-left:2px;padding-right:3px;left:480px;top:95px;width:57px;height:28px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>기회</font></td></tr></table></div></div>
    <div class=offset style="z-index:23"><div class=b_1 style=";padding-left:2px;padding-right:3px;left:536px;top:95px;width:57px;height:28px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>리스크</font></td></tr></table></div></div>
    <div class=offset style="z-index:24"><div class=b_1 style=";padding-left:2px;padding-right:3px;left:866px;top:95px;width:38px;height:28px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>빈도</font></td></tr></table></div></div>
    <div class=offset style="z-index:25"><div class=b_1 style=";padding-left:2px;padding-right:3px;left:903px;top:95px;width:38px;height:28px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>강도</font></td></tr></table></div></div>
    <div class=offset style="z-index:26"><div class=b_1 style=";padding-left:2px;padding-right:3px;left:940px;top:95px;width:38px;height:28px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>평점</font></td></tr></table></div></div>
    <div class=offset style="z-index:27"><div class=b_1 style=";padding-left:2px;padding-right:3px;left:977px;top:95px;width:43px;height:28px;overflow:hidden;background-color:#A9A9A9"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>등급</font></td></tr></table></div></div>
  `

  commonSearchApi({ queryId: 'MNGAB0010_PRINT_01', param: searchParams })
    .then((res) => {
      let height = 35
      let top = 121
      let index = 28

      res.ORESULT_CUR.forEach((e, idx) => {
        setGrid += `
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:${top}px;width:33px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/>${
          idx + 1
        }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:57px;top:${top}px;width:140px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=two cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_9w12s0 class=맑은_고딕>${
          e.ISSUE_DIV_NM
        }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:195px;top:${top}px;width:287px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_9w12s0 class=맑은_고딕>${
          e.ISSUE_DESC
        }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:480px;top:${top}px;width:58px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/>${
          e.C_DIV ? e.C_DIV : ''
        }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:536px;top:${top}px;width:58px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/>${
          e.R_DIV ? e.R_DIV : ''
        }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:592px;top:${top}px;width:276px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=left><font id=f_9w12s0 class=맑은_고딕>${
          e.ACTION_DESC
        }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:866px;top:${top}px;width:39px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/>${
          e.FREQ
        }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:903px;top:${top}px;width:39px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/>${
          e.STRENGTH
        }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:940px;top:${top}px;width:39px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/>${
          e.TOTAL
        }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:977px;top:${top}px;width:44px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/>${
          e.RANK
        }</font></td></tr></table></div></div>
        <div class=offset style="z-index:${index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1019px;top:${top}px;width:78px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/>${
          e.ZZ_APP_STATUS
        }</font></td></tr></table></div></div>
      `
        top = top + height - 1
      })
    })
    .finally(() => {
      setGrid += `
      </div>
      </body>
      </html>
    `

      approvalPopup.value.openPopup({
        CLSS_ID: userLogStore.vueId,
        TITLE: '내외부 이슈 및 리스크/기회 평가',
        CMPNY_DIV: userStore.cmpnyDiv,
        DATA_KEY:
          searchParams.CMPNY_DIV +
          ';' +
          searchParams.BSNS_CD +
          ';' +
          searchParams.BSNS_CD +
          ';' +
          new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
        REPORT: setGrid,
        MODE: '3', //'오프라인 1, 온라인 2, 양쪽 3'
        FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
        CLRLINE: 'CLR_15', //결재라인
      })
    })
}

/* ******************************** 메일 발송 ******************************* */
const mailSet = async (gbn) => {
  dialog.value = false
  let send = true

  /* ******************** 메일 SET ******************* */
  const mailParams = reactive({
    EMAIL: [],
    SUBJECT: '[HiSEs]내/외부 이슈 및 리스크/기회 평가 작성 수정승인 알림',
    CONTENT: '',
  })

  let url = 'http://10.100.45.205:49220/#/'

  mailParams.CONTENT =
    `
    <!doctype html>
      <html>
        <head>
          <meta charset='utf-8'>
        </head>
        <body>
          <a href="${url}">내/외부 이슈 및 리스크/기회 평가 작성</a> 수정요청이 승인되었습니다
          <br />
          <br />` +
    `${gbn === 'modify' ? modifyMsg.value + '<br /><br /> ' : ''}` +
    `부서: ${searchParams.ASGN_CD} ${searchParams.ASGN_NM} <br />
          <br />
          년도: ${searchParams.YEAR} <br />
          <br />
          승인자: ${userStore.userName} <br />
          <br />
          <br />
          감사합니다.
        </body>
      </html>`

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
    mailParams.EMAIL = [state.INSERT_USER_EMAIL]
    commonExecuteApi({ queryId: 'MNGAB0010_UPDATE_01', list: [searchParams] })
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
  } else if (gbn === 'finishModify') {
    /* ******************** 수정완료 ******************* */
    searchParams.STATUS = '70' // 수정승인(60)를 확정상태(70)으로 변경
    commonExecuteApi({
      queryId: 'MNGAB0010_UPDATE_01',
      list: [searchParams],
    }).finally(() => {
      onButtonsClick({ id: 'btnSearch' })
    })
  }

  /* ******************** 수정요청 ******************* */
  if (send && gbn === 'modify') {
    searchParams.STATUS = '50' // 확정상태(70)를 수정요청(50)으로 변경
    mailParams.EMAIL = mailList
    commonExecuteApi({ queryId: 'MNGAB0010_UPDATE_01', list: [searchParams] })
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
}

/* -------------- 팝업 오픈 -------------- */
const openPopup = (gbn) => {
  if (gbn === '부서조회') {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: 'Y',
      ASGN_NM: searchParams.ASGN_NM,
    })
  } else {
    deptPopup.value.openPopup({})
  }
}

const popup = (grid, clickData) => {
  if (clickData.column === 'popupBtn' && clickData.cellType === 'header') {
    compPopup.value.openPopup()
  }
  // if(clickData.dataRow >= 0 && clickData.column ==='APPLY_YN'){
  //   let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  //   grdMain.value.getDataProvider().setValue(clickData.dataRow, 'APPLY_YN', rowData.APPLY_YN === 'Y' ? 'N' : 'Y')
  // }
}

/* -------------- 팝업 선택 이벤트(부서/협력사) -------------- */
const onDeptSelected = (val) => {
  
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ORGN_DIV === 'A' ? val.DEPT_CD : val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM

  isSearch.value = false
  onButtonsClick({ id: 'btnSearch' })
}

const yearChange = async (e) => {
  searchParams.YEAR = await searchParams.YEAR.replace(korean, '')
  if (searchParams.YEAR.length > 4) {
    searchParams.YEAR = await searchParams.YEAR.slice(0, 4)
  }
}

const setPrint = (val) => {
  let TODAY = dayjs(new Date()).format('MM/DD')
  params.value = [
    'IN_CMPNY_DIV=' + searchParams.CMPNY_DIV,
    'IN_BSNS_CD=' + searchParams.BSNS_CD,
    'IN_ASGN_CD=' + searchParams.ASGN_CD,
    'IN_DEPT_CD=' + searchParams.DEPT_CD,
    'IN_DEPT_NM=' + searchParams.ASGN_NM,
    'IN_USER_NM=' + state.UPDATE_EMP_NM2,
    'IN_YEAR=' + searchParams.YEAR,
    'IN_TODAY=' + state.UPDATE_DATE2,
  ]
}

const setBtn = () => {
  /* ******************* true: 비활성화 , false: 활성화 ******************** */

  menuTitle.value.disableBtn('btnUpdate', true) // 저장
  // menuTitle.value.disableBtn('btnReqApply', true)           // 결재상신
  menuTitle.value.disableBtn('btnReqModify', true) // 수정요청
  menuTitle.value.disableBtn('btnAcceptModify', true) // 수정승인
  menuTitle.value.disableBtn('btnFinishModify', true) // 수정완료

  // 2025년 데이터는 복사 버튼 숨김
  menuTitle.value.setBtnProperty('btnCopy', 'visible', false)

  let editable = false
  let allowNew = false

  if (dtAuth.list.length > 0) {
    dtAuth.list.forEach((item) => {
      if (item.EMP_NO === userStore.empNo) {
        editable = true
        return
      }
    })
  }

  if (btnAuth.value) {
    // menuTitle.value.disableBtn('btnReqApply', false)           // 결재상신
    menuTitle.value.disableBtn('btnCopy', false) // 복사
  }

  // 10이거나 조회하였으나 등록된 데이터가 없을때 추가저장삭제 가능(권한,안전추진자 체크), 수정승인상태일때 저장가능
  if (
    state.STATUS_CD === '10' ||
    (state.STATUS_CD === '' && isSearch.value) ||
    state.STATUS_CD === '60'
  ) {
    allowNew = editable && btnAuth.value && isSearch.value ? false : true
    menuTitle.value.disableBtn('btnUpdate', allowNew) // 저장
    menuTitle.value.disableBtn('btnDelete', allowNew) // 삭제
    menuTitle.value.disableBtn('btnCreate', allowNew) // 추가
  } else {
    allowNew = true
    menuTitle.value.disableBtn('btnUpdate', allowNew) // 저장
    menuTitle.value.disableBtn('btnDelete', allowNew) // 삭제
    menuTitle.value.disableBtn('btnCreate', allowNew) // 추가
  }

  // 작성중
  if (state.STATUS_CD === '10') {
    if (editable && btnAuth.value) {
      // menuTitle.value.disableBtn('btnReqApply', false)           // 결재상신
    }
  } else {
    // menuTitle.value.disableBtn('btnReqApply', true)           // 결재상신
  }

  if (state.STATUS_CD === '70') {
    if (editable && btnAuth.value) {
      menuTitle.value.disableBtn('btnReqModify', false) // 수정요청
    }
    menuTitle.value.disableBtn('btnAcceptModify', true) // 수정승인
    // menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', true)

    menuTitle.value.disableBtn('btnFinishModify', true) // 수정완료
  } else if (state.STATUS_CD === '50') {
    menuTitle.value.disableBtn('btnReqModify', true) // 수정요청

    /* ADMIN 이면 */
    if (userLogStore.isMenuAdmin === 'Y') {
      // menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', false)
      menuTitle.value.disableBtn('btnAcceptModify', false) // 수정승인
    }

    menuTitle.value.disableBtn('btnFinishModify', true) // 수정완료
  } else if (state.STATUS_CD === '60') {
    menuTitle.value.disableBtn('btnReqModify', true) // 수정요청
    menuTitle.value.disableBtn('btnAcceptModify', true) // 수정승인
    // menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', true)
    if (editable && btnAuth.value) {
      menuTitle.value.disableBtn('btnFinishModify', false) // 수정완료
    }
  } else {
    menuTitle.value.disableBtn('btnReqModify', true) // 수정요청
    menuTitle.value.disableBtn('btnAcceptModify', true) // 수정승인
    // menuTitle.value.setBtnProperty('btnAcceptModify', 'visible', true)
    menuTitle.value.disableBtn('btnFinishModify', true) // 수정완료
  }

  /* *************** TEST용 사용자 추가(무조건 버튼 활성화) **************** */
  let empNoList = [
    'A490342',
    'A444960',
    'A448494',
    'A512811',
    'BP23200',
    'A512183',
    'A526166',
    'BP23198',
  ]
  empNoList.forEach((e) => {
    if (userStore.empNo === e) {
      menuTitle.value.disableBtn('btnUpdate', false) // 저장
      // menuTitle.value.disableBtn('btnReqApply', false)           // 결재상신
      menuTitle.value.disableBtn('btnReqModify', false) // 수정요청
      menuTitle.value.disableBtn('btnAcceptModify', false) // 수정승인
      menuTitle.value.disableBtn('btnFinishModify', false) // 수정완료
      menuTitle.value.disableBtn('btnDelete', false) // 삭제
      menuTitle.value.disableBtn('btnCreate', false) // 추가
    }
  })
}


watch(
  () => MasterMode.value,
  (newValue) => {
    if (newValue ==='Y') {
      searchParams.BSNS_CD = 'MASTER'
      searchParams.DEPT_CD = 'MASTER'
      searchParams.ASGN_CD = 'MASTER'
      searchParams.ASGN_NM = '전사 표준'
    }
  }
)




onMounted(() => {
  

  initCodeList()
})





</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnSearch',
          'btnCreate',
          'btnUpdate',
          'btnDelete',
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
            <i-input
              :label="$t('년도')"
              labelWidth="35px"
              v-model="searchParams.YEAR"
              @update:modelValue="yearChange"
              type="Number"
              width="150px"
            />

            <i-input
              :label="$t('부서')"
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
              @click:appendInner="openPopup('click')"
              class="ma-0"
            />
            <i-input v-model="searchParams.ASGN_CD" readonly width="100px" />

            <VCheckbox
              true-value="Y"
              false-value="N"
              v-model="MasterMode"
              v-show = "IsMaster"
              label="전사 표준 작성(MASTER) "
            > 
  
            </VCheckbox>

          </div>
          <div class="d-flex flex-column">
            <div class="d-flex">
              <i-input
                :label="$t('작성일')"
                labelWidth="70px"
                v-model="state.UPDATE_DATE"
                readonly
                width="250px"
              />
              <i-input
                :label="$t('작성자(최종 수정자)')"
                labelWidth="120px"
                v-model="state.EDTR_NAME"
                readonly
                width="310px"
              />
            </div>
            <!-- <div class="d-flex">
              <i-input
                :label="$t('결재완료일')"
                labelWidth="70px"
                v-model="state.PLAN_CNFM_DATE"
                readonly
                width="250px"
              />
              <i-input
                :label="$t('진행상태')"
                labelWidth="60px"
                v-model="state.STATUS"
                readonly
                width="250px"
              />
            </div> -->
          </div>
        </v-sheet>
        <v-sheet>
          <strong>※ HSE경영시스템 메뉴는 부서 내 HSE추진자만 입력 가능하며, HSE추진자는 부서에서 직접 관리합니다.</strong>
           &nbsp; - HSE추진자 등록 메뉴 : [운영관리 - 담당자 관리 - 부서별 담당자 등록/관리] 
          <br> &nbsp; - HSE추진자 등록 권한:  부서 내 HSE 추진자, 운영과장 
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onEditRowChanged="onEditRowChanged"
            @onCellClicked="popup"
          />
        </v-sheet>
      </div>
    </v-card-text>

    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />

    <!-- 복사 팝업 -->
    <CopyPopup
      ref="copyPopup"
      @closeCopy="onButtonsClick({ id: 'btnSearch' })"
    />

    <!-- OZReport -->
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="params"
      @close="showOz = $event"
    />

    <VDialog
      v-model="dialog"
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
                  dialog = false
                }
              "
              >취소</v-btn
            >
          </VCol>
        </VRow>
      </VContainer>
    </VDialog>

    <!-- 환경영향평가 기준 팝업 -->
    <CompPopup ref="compPopup" />

    <ApprovalPopup ref="approvalPopup" />
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
