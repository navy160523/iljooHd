<!--
  화면명 : SAFCB0010 / 안전 점검 대상/체크리스트 관리

  화면개요 : ∙ 부서 관리 작업 대상 및 체크리스트를 관리(CRUD)한다.
            ∙ 타 부서의 ‘부서 관리 작업 대상’ 가져오기가 가능하다. (등록된 ‘체크리스트’ 포함)
-->

<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  watch,
  registerRuntimeCompiler,
} from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendApi,
  commonSendSMS,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from "dayjs"
import SAFCB0010PopUp from './SAFCB0010PopUp.vue'
defineOptions({
  name: '30_safety-SAF_B-SAFBD0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const searchParams = reactive({
  WRK_DIV: '',
  USE_YN: '',
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm, // 오류 수정
})
const grdMain = ref(null)
const grdSub = ref(null)
const ChangeRow = ref({})
const codeList = reactive({
  USE_YN: [
    { COD: '', TXT: '전체' },
    { COD: 'Y', TXT: '사용' },
    { COD: 'N', TXT: '미사용' },
  ],
  STATUS: [
    { COD: '부서관리작업', TXT: '부서관리작업' },
    { COD: '위험작업허가', TXT: '위험작업허가' },
  ],
  STATUSGRD: [{ COD: 'Y', TXT: '검토중' }],
})

const grdTitle = ref(null)
const subTitle = ref(null)
const deptPopup = ref(null)
const PopUp = ref(null)
const request = ref(false)
const requsetbtn = ref(false)
onMounted(() => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'Y' },
    }),
    getCodeList('HHIE150'),
    getCodeList('HHIE120', 'HHI', 'Y', '0', null, 'N'),
    getCodeList('HHIE160'),
    // getCodeList('HHIE100CODE018'),
    commonSearchApi({ queryId: 'SAFCB0010_SEARCH_03', param: { }, }),
  ]).then((res) => {
    codeList.WRK_DIV = res[1].ORESULT_CUR
    grdMain.value.setBindingColumn(
      'BSNS_CD',
      res[0].ORESULT_CUR,
      'BSNS_CD',
      'BSNS_NM'
    )
    grdMain.value.setBindingColumn('WRK_DIV', res[1].ORESULT_CUR, 'COD', 'TXT')
    grdMain.value.setBindingColumn('DANG_DIV', res[2].ORESULT_CUR, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CF_DIV', res[3].ORESULT_CUR, 'COD', 'TXT')
    grdMain.value.setBindingColumn('STATUS', codeList.STATUSGRD, 'COD', 'TXT')
    codeList.WRK_DIV.unshift({ TXT: '전체', COD: '' })
    codeList.STATUS.unshift({ TXT: '전체', COD: '' })
    codeList.MAIL = res[4].ORESULT_CUR
  })
  subTitle.value.disableBtn('btnCreate2', true)
  subTitle.value.disableBtn('btnUpdate2', true)
  subTitle.value.disableBtn('btnDelete2', true)
  grdMain.value.getGridView().checkBar.checkableExpression =
    "values['GBN'] <> '위험작업허가'"
  grdMain.value.getGridView().applyCheckables()
  grdSub.value.getGridView().checkBar.checkableExpression =
    "values['FLAG'] <> 'P'"
  grdSub.value.getGridView().applyCheckables()

  // 권한관리 ㅇ현재는 PTW 마스터만 가능
  vm.$nextTick(() => {
    if (userStore.authGrpCd.includes('GRP00380')) {
      grdTitle.value.setBtnProperty('btnPTWCMPNN', 'visible', true)
      grdTitle.value.setBtnProperty('btnPTWAPRVL', 'visible', true)
    } else {
      grdTitle.value.setBtnProperty('btnPTWCMPNN', 'visible', false)
      grdTitle.value.setBtnProperty('btnPTWAPRVL', 'visible', false)
      console.log(grdTitle.value, 'grdTitle.value')
    }
  })
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    checkBar: { visible: true },
    showAllCheck: false,
  },
  keys: [],
  fields: [
    {
      fieldName: 'GBN',
      styleName: 'left-column',
      dataType: 'text',
      header: { text: t('구분') },
      editable: false,
    },
    {
      fieldName: 'WRK_DIST',
      width: '200',
      dataType: 'text',
      header: { text: t('작업명') },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        var gender = grid.getValue(dataCell.index.itemIndex, 'GBN')
        // ret.styleName = "left-column editable_column"
        if (gender == '위험작업허가') {
          return (ret.styleName = 'left-column')
        } else {
          return (ret.styleName = 'left-column editable_column')
        }
      },
    },

    {
      fieldName: 'WRK_DIV',
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      dataType: 'text',
      header: { text: t('공종/계열') },
      editable: false,
    },

    {
      fieldName: 'DANG_DIV',
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      dataType: 'text',
      header: { text: t('위험작업분류') },
      editable: false,
    },
    {
      fieldName: 'CF_DIV',
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      dataType: 'text',
      header: { text: t('허가구분') },
      editable: false,
    },
    {
      fieldName: 'STATUS',
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      dataType: 'text',
      header: { text: t('PTW 등록 요청 상태') },
      editable: false,
    },
    {
      fieldName: 'USE_YN',
      width: '70',
      dataType: 'text',
      editable: false,
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      header: { text: t('사용유무') },
    },
    {
      fieldName: 'ORDER_NUM',
      width: '70',
      dataType: 'number',
      numberFormat: '#,###',
      header: { text: t('정렬순서') },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        var gender = grid.getValue(dataCell.index.itemIndex, 'GBN')
        // ret.styleName = "left-column editable_column"
        if (gender == '위험작업허가') {
          return (ret.styleName = 'right-column')
        } else {
          return (ret.styleName = 'right-column editable_column')
        }
      },
    },
    {
      fieldName: 'DESCRIPTION',
      dataType: 'text',
      header: { text: t('비고') },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        var gender = grid.getValue(dataCell.index.itemIndex, 'GBN')
        // ret.styleName = "left-column editable_column"
        if (gender == '위험작업허가') {
          return (ret.styleName = 'left-column')
        } else {
          return (ret.styleName = 'left-column editable_column')
        }
      },
    },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    // { fieldName: 'D_WRK_ID', dataType: 'text',  visible:false },
    { fieldName: 'WRK_ID', dataType: 'text', visible: false },
    { fieldName: 'isNew', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption: { stateBar: { visible: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: 'CHECK_DESC',
      width: '300',
      dataType: 'text',
      header: { text: t('점검내용') },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        var gender = grid.getValue(dataCell.index.itemIndex, 'FLAG')
        // ret.styleName = "left-column editable_column"
        if (gender == 'P') {
          return (ret.styleName = 'left-column')
        } else {
          return (ret.styleName = 'left-column editable_column')
        }
      },
    },
    {
      fieldName: 'CHECK_IMP',
      dataType: 'text',
      editable: false,
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      header: { text: t('핵심점검항목') },

      styleCallback: function (grid, dataCell) {
        var ret = {}
        var gender = grid.getValue(dataCell.index.itemIndex, 'FLAG')
        // ret.styleName = "left-column editable_column"
        if (gender == 'P') {
          return (ret.styleName = '')
        } else {
          return (ret.styleName = 'editable_column')
        }
      },
    },
    {
      fieldName: 'ORDER_NUM',
      width: '70',
      dataType: 'number',
      numberFormat: '#,###',
      header: { text: t('정렬순서') },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        var gender = grid.getValue(dataCell.index.itemIndex, 'FLAG')
        // ret.styleName = "left-column editable_column"
        if (gender == 'P') {
          return (ret.styleName = 'right-column')
        } else {
          return (ret.styleName = 'right-column editable_column')
        }
      },
    },
    {
      fieldName: 'USE_YN',
      dataType: 'text',
      editable: false,
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      header: { text: t('사용유무') },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        var gender = grid.getValue(dataCell.index.itemIndex, 'FLAG')
        // ret.styleName = "left-column editable_column"
        if (gender == 'P') {
          return (ret.styleName = '')
        } else {
          return (ret.styleName = 'editable_column')
        }
      },
    },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'WRK_ID', dataType: 'text', visible: false },
    { fieldName: 'CHECK_SEQ', dataType: 'text', visible: false },
    { fieldName: 'FLAG', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnPTWCMPNN') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(PTWbeforeSave)
      .setQuery(PTWsaveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }

  if (btn.id === 'btnPTWAPRVL') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setConfirmMessage('PTW화 승인하시겠습니까?')
      .setBefore(APRVLbeforeSave)
      .setQuery(APRVLsaveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .setResultMessage('PTW화 승인되었습니다.')
      .run()
  }

  if (btn.id === 'btnIMPR') {
    PopUp.value.openPopup(searchParams)
  }

  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearchData)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }

  if (btn.id === 'btnUpdate') {
    requsetbtn.value = false
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }

  if (btn.id === 'btnCreate') {
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      GBN: '부서관리 작업',
      USE_YN: 'Y',
      isNew: 'Y',
      // STATUS: "Y",
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD,
      CMPNY_DIV: searchParams.CMPNY_DIV,
    })
  }
  if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }
  if (btn.id === 'btnPTWRequest') {
    requsetbtn.value = true
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setConfirmMessage('PTW 등록요청 하시겠습니까?')
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
        request.value = false
        requsetbtn.value = false
      })
      .run()
  }

  // 서브그리드
  if (btn.id === 'btnCreate2') {
    console.log(ChangeRow.value, 'ChangasdeRow.value')
    grdSub.value.addRow({
      CMPNY_DIV: ChangeRow.value.CMPNY_DIV,
      BSNS_CD: ChangeRow.value.BSNS_CD,
      DEPT_CD: ChangeRow.value.DEPT_CD,
      WRK_ID: ChangeRow.value.WRK_ID,
      USE_YN: 'Y',
    })
  }
  if (btn.id === 'btnUpdate2') {
    new saveFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeSave2)
      .setQuery(saveData2)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }
  if (btn.id === 'btnDelete2') {
    new deleteFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeDelete2)
      .setQuery(deleteData2)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }
}

const beforeSearchData = () => {
  if (!searchParams.DEPT_CD) {
    Message.warn(t('부서는 필수입력입니다.'))
    return false
  }
  return true
}

// 메인조회
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFCB0010_SEARCH01',
    param: searchParams,
  })
}

const afterSearch = (res) => {
  grdMain.value.getGridView().setCheckBar({ showAll: false })
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 메인저장
const beforeSave = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }

  if (requsetbtn.value) {
    console.log(requsetbtn.value, 'requsetbtn.value')
    request.value = true
  } else {
    request.value = false
  }

  return true
}

const saveData = () => {
  let param = []
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }

  for (let i of param) {
    i.D_WRK_ID = i.WRK_ID

    if (request.value) {
      console.log('여기타면안됨')
      i.STATUS = 'Y'
    }
  }

  console.log('param1', param)
  return commonExecuteApi({ queryId: 'SAFCB0010_SAVE_01', list: param }).then(
    (res) => {
      console.log(request.value, 'request.value')
      if (request.value) {
        // let mailMsg =
        //   `부서관리작업에 대하여 PTW 등록 요청이 있었습니다. 검토 후 PTW 등록 승인 바랍니다. `
        
        var today = new Date()
        let date = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2)
        let workName = ''
        let workRank = ''

        for(let i of param){
          workName += i.WRK_DIST + ", "
          workRank += i.CF_DIV + ", "
        }

        let MailMsg = `
            PTW 등록 요청이 접수되었습니다. 
            <br/> 부서   : ${searchParams.DEPT_NM} 
            <br/> 신청일 : ${date} 
            <br/> 신청자 : ${userStore.empNm} 
            <br/> 작업명 : [ ${workName} ]
            <br/> 등급   : [ ${workRank} ]`

        let PhnMsg = `PTW 등록 요청이 접수되었습니다. 부서: ${searchParams.DEPT_NM} / 신청일: ${date} / 신청자: ${userStore.empNm} / 작업명: [ ${workName} ] / 등급: [ ${workRank} ]`
        for(let send of codeList.MAIL){
            let mail = {         
              EMAIL: [send.EMAIL], 
              SUBJECT: '[HiSEs] PTW 등록 요청 접수',              // 메일제목
              CONTENT: MailMsg,                                  // 메일내용
            }
          
            let smsParam = {
              EMPNO_FROM: userStore.empNo,  // 보내는사람 사번
              EMPNO_TO: send.EMP_NO,        // 받는사람 사번()
              SYSCODE: "000",               // 000고정
              FROM_P_NO: userStore.hndPhn,  // 보내는사람 폰번호(조치자)
              TO_P_NO: send.HND_PHN,        // 받는사람 폰번호(점검자)
              TITLE: PhnMsg,                // 제목,내용
            }

            if (send.HND_PHN){
            commonSendSMS(smsParam)
            }
            if (send.EMAIL){
            commonSendApi(mail).then((res) => {
              Message.success(t('메일이 전송되었습니다.'))
            })
            }

            console.log(send)
        }

        for(let send of codeList.MAIL){
        }
      }
    }
  )
}

const beforeDelete = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  if (grdSub.value.getDataProvider().getRows().length !== 0) {
    Message.warn(t('하위 데이터가 있으면 삭제할 수 없습니다..'))
    return false
  }
  return true
}

// 메인삭제
const deleteData = () => {
  let param = []
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }

  for (let i of param) {
    i.D_WRK_ID = i.WRK_ID
  }

  return commonExecuteApi({ queryId: 'SAFCB0010_DELETE_01', list: param })
}

// 서브 저장
const beforeSave2 = () => {
  let chekedRow = grdSub.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  return true
}

const saveData2 = () => {
  let param = []
  let chekedRow = grdSub.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdSub.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }
  for (let i of param) {
    i.D_WRK_ID = i.WRK_ID
  }
  return commonExecuteApi({ queryId: 'SAFCB0010_SAVE_02', list: param })
}

// 서브 삭제
const beforeDelete2 = () => {
  let chekedRow = grdSub.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  return true
}

const deleteData2 = () => {
  let param = []
  let chekedRow = grdSub.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdSub.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }

  for (let i of param) {
    if (i.FLAG === 'D') {
      i.D_WRK_ID = i.WRK_ID
      i.P_WRK_ID = ''
    } else {
      i.D_WRK_ID = ''
      i.P_WRK_ID = i.WRK_ID
    }
  }
  
  return commonExecuteApi({ queryId: 'SAFCB0010_DELETE_02', list: param })
}

// rowChanged 이벤트
const rowChanged = (grid, oldRow, newRow) => {
  if (newRow === -1) {
    ChangeRow.value = ''
    subTitle.value.disableBtn('btnCreate2', true)
    subTitle.value.disableBtn('btnUpdate2', true)
    subTitle.value.disableBtn('btnDelete2', true)
    return
  }
  let row = grdMain.value.getDataProvider().getJsonRow(newRow)
  if (row.isNew === 'Y') {
    ChangeRow.value = ''
    subTitle.value.disableBtn('btnCreate2', true)
    subTitle.value.disableBtn('btnUpdate2', true)
    subTitle.value.disableBtn('btnDelete2', true)
    return
  }

  ChangeRow.value = row
  if (row.GBN === '위험작업허가' && !row.isNew) {
    grdMain.value.getGridView().editOptions.editable = false
  } else {
    grdMain.value.getGridView().editOptions.editable = true
    grdMain.value.getGridView().columnByName('CF_DIV').editable = false
  }

  commonSearchApi({ queryId: 'SAFCB0010_SEARCH_02', param: row }).then(
    (res) => {
      grdSub.value.getGridView().setCheckBar({ showAll: false })
      subTitle.value.disableBtn('btnCreate2', false)
      subTitle.value.disableBtn('btnUpdate2', false)
      subTitle.value.disableBtn('btnDelete2', false)
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  )
}
const onCellClicked = (grid, clickData) => {
  if (clickData.cellType !== 'data') {
    return
  }
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  if (row.GBN === '위험작업허가' && !row.isNew) {
    grdMain.value.getGridView().editOptions.editable = false
  } else {
    grdMain.value.getGridView().editOptions.editable = true
    grdMain.value.getGridView().columnByName('CF_DIV').editable = false
  }
}

const rowChangedSub = (grid, oldRow, newRow) => {
  if (newRow === -1) {
    return
  }
  let row = grdSub.value.getDataProvider().getJsonRow(newRow)

  if (row.FLAG === 'P') {
    grdSub.value.getGridView().editOptions.editable = false
  } else {
    grdSub.value.getGridView().editOptions.editable = true
  }
}

// 체크아이템

// const onItemCheckedMain = (grid, items, checked)=>{
//   let row = grdMain.value.getDataProvider().getJsonRow(items)
//   if(row.STATUS ==='PTW' && checked && !row.isNew){
//     grdMain.value.getGridView().checkItem(items,false)
//   }
// }
// const onItemCheckedSub = (grid, items, checked)=>{
//   let row = grdSub.value.getDataProvider().getJsonRow(items)
//   if(row.FLAG ==='P'){
//     grdSub.value.getGridView().checkItem(items,false)
//   }
// }

// PTW 화 반려
const PTWbeforeSave = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  for (let i of chekedRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    if (data.isNew) {
      Message.warn(t('새로 추가한 행은 이용하실수없습니다'))
      return false
    }
    if (data.STATUS !== 'Y') {
      Message.warn(t('검토중 상태일때만 이용가능합니다.'))
      return false
    }
  }

  return true
}

const PTWsaveData = () => {
  let param = []
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    param.push(data)
  }

  for (let i of param) {
    i.STATUS = ''
    i.D_WRK_ID = i.WRK_ID
  }
  return commonExecuteApi({ queryId: 'SAFCB0010_SAVE_01', list: param })
}

// PTW 화승인
const APRVLbeforeSave = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  for (let i of chekedRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    if (data.isNew) {
      Message.warn(t('새로 추가한 행은 이용하실수없습니다'))
      return false
    }
    if (data.STATUS !== 'Y') {
      Message.warn(t('검토중 상태일때만 이용가능합니다.'))
      return false
    }
  }

  return true
}

const APRVLsaveData = () => {
  let param = []
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  for (let i of chekedRow) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    data.D_WRK_ID = data.WRK_ID
    param.push(data)
  }
  return commonExecuteApi({ queryId: 'SAFCB0010_SAVE_04', list: param })
}

const openPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    HSE_ONLY: 'Y',
    ASGN_NM: searchParams.DEPT_NM,
  })
}
// 부서

const onDeptSelected = (row) => {
  searchParams.DEPT_NM = row.ASGN_SHRT_NM
  searchParams.DEPT_CD = row.DEPT_CD
  searchParams.BSNS_CD = row.BSNS_CD
  searchParams.CMPNY_DIV = row.CMPNY_DIV
}

const update = () => {
  console.log('ggoggiggigi')
  onButtonsClick({ id: 'btnSearch' })
}
</script>
<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('부서')"
            width="350px"
            margin="4px"
            v-model="searchParams.DEPT_NM"
            append-inner-icon="mdi-magnify"
            @keydown.enter="
              (e) => {
                openPopup()
              }
            "
            @update:modelValue="
              (e) => {
                searchParams.DEPT_CD = null
              }
            "
            @click:appendInner="openPopup()"
            required
          />
          <i-input
            :label="$t('')"
            v-model="searchParams.DEPT_CD"
            width="100px"
            readonly
          />
          <i-select
            :label="$t('사용유무')"
            width="250px"
            v-model="searchParams.USE_YN"
            :items="codeList.USE_YN"
            item-value="COD"
            item-title="TXT"
          />
          <i-select
            :label="$t('구분')"
            width="250px"
            v-model="searchParams.STATUS"
            :items="codeList.STATUS"
            item-value="COD"
            item-title="TXT"
          />
        </v-sheet>

        <v-sheet class="h-auto">
          <div class="h-grow">
            <v-sheet width="60%" class="pa-0 h-auto mr-3">
              <IGridTitle
                :title="$t('안전점검 대상 현황')"
                :button-list="[
                  'btnPTWCMPNN',
                  'btnPTWAPRVL',
                  'btnIMPR',
                  'btnPTWRequest',
                  'btnCreate',
                  'btnUpdate',
                  'btnDelete',
                ]"
                ref="grdTitle"
                @click-button="onButtonsClick"
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCurrentRowChanged="rowChanged"
                @onCellClicked="onCellClicked"
              />
              <!-- @onItemChecked="onItemCheckedMain" -->
            </v-sheet>

            <v-sheet width="40%" class="pa-0 h-auto">
              <IGridTitle
                :title="$t('점검 체크리스트')"
                :button-list="['btnCreate2', 'btnUpdate2', 'btnDelete2']"
                ref="subTitle"
                @click-button="onButtonsClick"
              >
                <template #editors />
              </IGridTitle>

              <RealGrid
                ref="grdSub"
                :grid-view-option="grdSubProps.gridViewOption"
                :keys="grdSubProps.keys"
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns"
                @onCurrentRowChanged="rowChangedSub"
              />
              <!-- @onItemChecked="onItemCheckedSub" -->
            </v-sheet>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
    <SAFCB0010PopUp ref="PopUp" @update="update" />
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
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
