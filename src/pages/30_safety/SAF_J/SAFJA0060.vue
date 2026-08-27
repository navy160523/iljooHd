<!--
  화면명 : 단기공사 위험작업허가 등록/관리
  화면개요 : 단기공사 위험작업허가 등록/관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'

import {
  commonRequest3,
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  getCompanyList,
  commonSendSMS,
  commonRequest2,
} from '@hiway/api/commonApi'

import DeptPopup from '@/components/popup/DeptPopup.vue'
import SAFCE0040Popup01 from './SAFJA0040Popup01.vue'
import Message from '@hiway/utils/notify'

import SAFJA0060Popup from '@/pages/30_safety/SAF_J/SAFJA0060Popup.vue'

defineOptions({
  name: '30_safety-SAF_J-SAFJA0060',
})

onMounted(() => {
  // grdMain.value.getDataProvider().setRows(data);
  initCodeList()

  // vm.$nextTick(() => {
    /* ***** 통합안전경영실 만 버튼 활성화 및 조회조건 변경 가능 ***** */
    // console.log('logsStore ', logsStore.isMenuAdmin)
    // const aaa = userStore.authGrpCd.join(',')
    // alert(`logsStore.isMenuAdmin: ${logsStore.isMenuAdmin}`)
    // alert(`userStore.authGrpCd: ${aaa}`)

    console.log('logsStore.isMenuAdmin ', logsStore.isMenuAdmin)
    
    if (logsStore.isMenuAdmin === 'Y') {
      subMenuTitle.value.disableBtn('btnConfirm', false)
      isReadonly.value = false
    } else {
      subMenuTitle.value.disableBtn('btnConfirm', true)
      isReadonly.value = true
    }

    grdMain.value.getDataProvider().onValueChanged((provider, row, field) => {})
  // })
})

const vm = getCurrentInstance().proxy //다이얼로그관련

const logsStore = useLogsStore()
const deptPopup = ref(null)
const deptPopup2 = ref(null)
const SAFCE0040Pop01 = ref(null)
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const subMenuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const sAFJA0060Popup = ref(null)
const deptReadonly = ref(false)
const m_dialog = ref(false)

const isReadonly = ref(false)

//조회조건 v-model
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  // BSNS_CD: '',  //사업부
  // DEPT_CD: '',  //부서
  PROD_DIV: '', //부문
  CHK_YN01: 'N', //안전검토 건 조회
  USER_ID: userStore.userId, //유저 ID
  // USER_ID : 'BP23091', //유저 ID
  APROVE_USER_ID: null, // 안전검토자(안전과장)
  APROVE_USER_NM: null, // 안전검토자(안전과장)
})

// 안전검토자 조회 및 확정
const searchParams2 = reactive({
  KOR_NM: null,
  EMP_NO: null,
  EMAIL: null,
  HND_PHN: null,
})

//메인 그리드
const grdProps1 = reactive({
  gridViewOption: {
    header: { height: 60 },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  keys: ['COL01'],
  fields: [
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('회사구분') },
      editable: false,
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      visible: false,
    },
    
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t('사업부') },
      editable: false,
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      header: { text: t('관리부서') },
      editable: false,
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: 'PROD_DIV',
      dataType: 'text',
      header: { text: t('생산/비생산') },
      editable: true,
      width: 60,
      visible: false,
    },

    { 
      fieldName: 'DANG_DIV',
      dataType: 'text',
      header: { text: t('작업구분') },
      editable: true,
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      'styleCallback': function (grid, dataCell) {
        var ret = { editable : false, styleName : '' }
        ret.editor ={ type: 'list', editable: false, textReadOnly: true, dropDownWhenClick: true }
        if(grid.getValue(dataCell.index.itemIndex, 'P_WRK_ID') == null || grid.getValue(dataCell.index.itemIndex, 'P_WRK_ID') == '') {
          ret.editable = true
          ret.editor.editable = true
          ret.styleName = 'editable_column'
        }
        return ret
      }
    },
    {
      fieldName: 'P_WRK_ID',
      dataType: 'text',
      header: { text: t('작업 코드') },
      editable: true,
      visible: false,
    },
    {
      fieldName: 'WRK_DIST',
      dataType: 'text',
      header: { text: t('작업명') },
      editable: true,
      styleName: 'left-column editable_column',
    },
    {
      fieldName: 'SAVE_GBN',
      dataType: 'text',
      header: { text: t('SAVE_GBN') },
      editable: true,
      visible: false,
    },
    {
      fieldName: 'APROVE_REQ_YN',
      dataType: 'text',
      header: { text: t('안전검토 필요') },
      editable: false,
    },
    {
      fieldName: 'APROVE_REQ_CNT',
      dataType: 'text',
      header: { text: t('안전검토 요청 건') },
      editable: false,
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    'CMPNY_DIV',
    'BSNS_CD',
    'DEPT_CD',
    'PROD_DIV',
    'DANG_DIV',
    'P_WRK_ID',
    'WRK_DIST',
    'APROVE_REQ_YN',
  ],
})

grdProps1.columns = grdProps1.fields

//서브 그리드
const grdProps2 = reactive({
  gridViewOption: {
    header: { height: 60 },
    stateBar: { visible: false },
    checkBar: { visible: true },
  },
  keys: ['COL01'],
  fields: [
    {
      fieldName: 'P_WRK_ID',
      dataType: 'text',
      header: { text: t('WRK_ID') },
      editable: false,
      visible: false,
    },
    {
      fieldName: 'LOC_CD',
      dataType: 'text',
      header: { text: t('장소/공정') },
      editable: false,
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: 'CF_DIV',
      dataType: 'text',
      header: { text: t('허가등급') },
      editable: true,
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
      'styleCallback': function (grid, dataCell) {
        var ret = { editable : false, styleName : '' }
        ret.editor ={ type: 'list', editable: false, textReadOnly: true, dropDownWhenClick: true }
        if((grid.getValue(dataCell.index.itemIndex, 'APROVE_STATUS') == null || grid.getValue(dataCell.index.itemIndex, 'APROVE_STATUS') == '') || logsStore.isMenuAdmin ==='Y') {
          ret.editable = true
          ret.editor.editable = true
          ret.styleName = 'editable_column'
        }
        return ret
      }
    },
    {
      fieldName: 'APROVE_STATUS',
      dataType: 'text',
      header: { text: t('검토상태') },
      editable: false,
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: 'APROVE_USER_NM',
      dataType: 'text',
      header: { text: t('검토자') },
      editable: false,
      visible: true,
    },
    {
      fieldName: 'APROVE_USER_ID',
      dataType: 'text',
      header: { text: t('검토자') },
      editable: false,
      visible: false,
    },
    {
      fieldName: 'APROVE_DEPT_CD',
      dataType: 'text',
      header: { text: t('검토자 부서') },
      editable: false,
      visible: true,
    },
    {
      fieldName: 'APROVE_DATE',
      dataType: 'text',
      header: { text: t('검토일') },
      editable: false,
      visible: true,
    },
    {
      fieldName: 'REQ_USER_NM',
      dataType: 'text',
      header: { text: t('요청자') },
      editable: false,
      visible: true,
    },
    {
      fieldName: 'REQ_USER_ID',
      dataType: 'text',
      header: { text: t('요청자') },
      editable: false,
      visible: false,
    },
    {
      fieldName: 'REQ_DEPT_CD',
      dataType: 'text',
      header: { text: t('요청자 부서') },
      editable: false,
      visible: true,
    },
    {
      fieldName: 'REQ_DATE',
      dataType: 'text',
      header: { text: t('요청일') },
      editable: false,
      visible: true,
    },
    {
      fieldName: 'GUBUN',
      dataType: 'text',
      header: { text: t('GUBUN') },
      editable: false,
      visible: false,
    },
    {
      fieldName: 'SAVE_YN',
      dataType: 'text',
      header: { text: t('SAVE_YN') },
      editable: false,
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    'P_WRK_ID',
    'LOC_CD',
    'CF_DIV',
    'APROVE_STATUS',
    {
      name: '안전',
      direction: 'horizontal',
      items: ['APROVE_DEPT_CD', 'APROVE_USER_NM'],
      header: { text: t('안전') },
    },
    // "APROVE_USER_NM",
    // "APROVE_USER_ID",
    // "APROVE_DEPT_CD",
    'APROVE_DATE',
    'REQ_USER_NM',
    'REQ_USER_ID',
    'REQ_DEPT_CD',
    'REQ_DATE',
    'GUBUN',
  ],
})

grdProps2.columns = grdProps2.fields

const codeList = reactive({
  dataList1: [], //회사구분
  dataList2: [], //사업부
  dataList3: [], //부서
  dataList4: [], //작업구분
  dataList5: [], //메일전용 부서 조회
})

// const onValueChanged = (provider , row, field) => {
//   console.log('provider , row, field ', provider , row, field)
// }

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    //회사구분
    getCompanyList(),
    //사업부
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: searchParams.CMPNY_DIV },
    }),
    //부서
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV: 'Y',
      },
    }),
    //부문
    getCodeList('HHIS040'),
    //위험작업분류코드
    getCodeList('HHIE120'),

    //위험작업 요청 상태코드
    getCodeList('HHIQ040'),
    //전산/대면
    getCodeList('HHIE160'),
    //위험작업 장소
    getCodeList('HHIE150'),
    //전체
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: '', USE_DIV: 'Y' },
    }),
  ]).then((res) => {
    //main 그리드 lookup 데이터 바인딩
    grdMain.value.setBindingColumn(
      'CMPNY_DIV',
      res[0].ORESULT_CUR,
      'COD',
      'TXT'
    )
    grdMain.value.setBindingColumn(
      'BSNS_CD',
      res[1].ORESULT_CUR,
      'BSNS_CD',
      'BSNS_NM'
    )
    grdMain.value.setBindingColumn('DANG_DIV', res[4].ORESULT_CUR, 'COD', 'TXT')

    //sub 그리드 lookup 데이터 바인딩
    grdSub.value.setBindingColumn(
      'APROVE_STATUS',
      res[5].ORESULT_CUR,
      'COD',
      'TXT'
    )
    grdSub.value.setBindingColumn('CF_DIV', res[6].ORESULT_CUR, 'COD', 'TXT')
    grdSub.value.setBindingColumn('LOC_CD', res[7].ORESULT_CUR, 'COD', 'TXT')

    grdMain.value.getGridView().filterPanel.visible = true 
    grdSub.value.getGridView().filterPanel.visible = true 

    //회사구분 콤보박스
    codeList.dataList1 = res[0].ORESULT_CUR

    //사업부 콤보박스
    codeList.dataList2 = res[1].ORESULT_CUR
    codeList.dataList2.unshift({ BSNS_NM: '전체', BSNS_CD: '' })

    //부서
    codeList.dataList3 = res[2].ORESULT_CUR
    codeList.dataList3.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    grdMain.value.setBindingColumn('DEPT_CD', res[8].ORESULT_CUR, 'DEPT_CD', 'DEPT_NM')
    codeList.dataList5 = res[8].ORESULT_CUR

    //위험 작업구분
    codeList.dataList4 = res[4].ORESULT_CUR
    // searchParams.ASGN_CD = ''
  })
}

const reqReview = () => {
  let checkRows = grdSub.value.getGridView().getCheckedRows()
  const dataSet = []

  if (!searchParams2.EMP_NO) {
    Message.warn('안전 검토자(안전과장)을 지정 해 주시기 바랍니다.')
    return
  }

  for (let rowIdx of checkRows) {
    const rowdata = grdSub.value.getDataProvider().getJsonRow(rowIdx)

    if(rowdata.SAVE_YN != 'Y') {
      return Message.warn(t('검토요청 전 저장을 해주십시오.'))
    }
    if(rowdata.CF_DIV == null || rowdata.CF_DIV == '') {
      return Message.warn(t('허가등급을 지정하지 않은 장소/공정이 있습니다.'))
    }

    rowdata.APROVE_STATUS = '20'
    rowdata.GUBUN = 'R'
    rowdata.REQ_DEPT_CD = userStore.deptCd
    rowdata.REQ_USER_ID = userStore.userId
    rowdata.INSERT_ID = userStore.userId
    dataSet.push(rowdata)
  }

  if (dataSet.length > 0) {
    //저장
    commonExecuteApi({
      queryId: 'SAFJA0060_SAVE_02',
      list: dataSet,
    }).then((res) => {
      console.log('btnReqReview ', res)
      send()
      Message.success('검토요청 하였습니다.')
      onButtonsClick({ id: 'btnSearch' })
    })
  } else {
    Message.warn('선택된 데이터가 없습니다.')
  }
}

const onSubButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    //메인 그리드 저장
    new saveFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeSubSave)
      .setQuery(saveSubData)
      .setAfter(() => {
        //관리자 권한 있는 사람은 검토 상태와 상관없이 수정 처리 가능 하도록 변경 2024.07.26 - 김우빈(특수선쪽 요청 받음)
        // if (logsStore.isMenuAdmin !== 'Y') {
          m_dialog.value = true
        // }
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnReqReview') {
    //검토요청
    reqReview()
  } else if (btn.id === 'btnConfirm') {
    //확정
    let checkRows = grdSub.value.getGridView().getCheckedRows()

    const dataSet = []

    for (let rowIdx of checkRows) {
      const rowdata = grdSub.value.getDataProvider().getJsonRow(rowIdx)
      rowdata.APROVE_STATUS = '30'
      rowdata.APROVE_DEPT_CD = userStore.deptCd
      rowdata.APROVE_USER_ID = userStore.userId
      rowdata.GUBUN = 'A'
      dataSet.push(rowdata)
    }
    
    console.log('dataSet ', dataSet)

    if (dataSet.length > 0) {
      //저장
      commonExecuteApi({
        queryId: 'SAFJA0060_SAVE_02',
        list: dataSet,
      }).then((res) => {
        onButtonsClick({ id: 'btnSearch' })
      })
    } else {
      Message.warn('선택된 데이터가 없습니다.')
    }
  }
}

// 버튼 Event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    //조회
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id == 'btnPrint') {
    const printParams = {}
    printParams.CMPNY_DIV = searchParams.CMPNY_DIV
    printParams.BSNS_CD = searchParams.BSNS_CD
    printParams.DEPT_CD = searchParams.DEPT_CD
    printParams.PROD_DIV = searchParams.PROD_DIV
    printParams.APROVE_REQ_YN = searchParams.CHK_YN01

    //엑셀출력
    new queryFlowHelper(vm, t)
      commonRequest2('hse/excel/SAFJA0060_PRINT01', printParams).then((res) => {
      const blob = new Blob([res], { type: res.type })
      const link = document.createElement('a')
      const fileName = '단기공사 위험작업허가 작업 현황'      

      link.href = URL.createObjectURL(blob)
      link.download = fileName
      link.click()
      URL.revokeObjectURL(link.href)
    })
    
  } else if (btn.id === 'btnReqReview') {
    //검토요청
    let checkRows = grdSub.value.getGridView().getCheckedRows()

    const dataSet = []

    if (!searchParams2.EMP_NO) {
      Message.warn('안전 검토자(안전과장)을 지정 해 주시기 바랍니다.')
      return
    }

    for (let rowIdx of checkRows) {
      const rowdata = grdSub.value.getDataProvider().getJsonRow(rowIdx)
      rowdata.APROVE_STATUS = '20'
      rowdata.REQ_DEPT_CD = userStore.deptCd
      rowdata.REQ_USER_ID = userStore.userId
      rowdata.APROVE_USER_ID = searchParams2.EMP_NO
      rowdata.APROVE_DEPT_CD = searchParams2.DEPT_CD
      dataSet.push(rowdata)
    }

    if (dataSet.length > 0) {
      //저장
      commonExecuteApi({
        queryId: 'SAFJA0060_SAVE_02',
        list: dataSet,
      }).then((res) => {
        console.log('res ',res)
        send()
        Message.success('검토요청 하였습니다.')
        onButtonsClick({ id: 'btnSearch' })
      })
    } else {
      Message.warn('선택된 데이터가 없습니다.')
    }
  } else if (btn.id === 'btnConfirm') {
    //확정
    let checkRows = grdSub.value.getGridView().getCheckedRows()

    const dataSet = []

    for (let rowIdx of checkRows) {
      const rowdata = grdSub.value.getDataProvider().getJsonRow(rowIdx)
      rowdata.APROVE_STATUS = '30'
      rowdata.APROVE_DEPT_CD = userStore.deptCd
      rowdata.APROVE_USER_ID = userStore.userId
      dataSet.push(rowdata)
    }

    if (dataSet.length > 0) {
      //저장
      commonExecuteApi({
        queryId: 'SAFJA0060_SAVE_02',
        list: dataSet,
      }).then((res) => {})
    } else {
      Message.warn('선택된 데이터가 없습니다.')
    }
  } else if (btn.id === 'btnCreate') {
    let deptCd = searchParams.DEPT_CD
    if(searchParams.BSNS_CD == 'AK00') {
      deptCd = 'N1I0'
    }
    //메인 그리드 추가
    if (searchParams.BSNS_CD === '') {
      return Message.warn(t('조회조건의 부서를 먼저 선택 해주세요'))
    }
    if (deptCd === '') {
      return Message.warn(t('조회조건의 부서를 먼저 선택 해주세요'))
    }
    addMainRowData()
  } else if (btn.id === 'btnUpdate') {
    //메인 그리드 저장
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeMainSave)
      .setQuery(saveMainData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnDelete') {
    //서브 그리드 삭제
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeMainDel)
      .setQuery(delMainData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()

    //메인 그리드 삭제
  } else if (btn.id === 'btnCreate2') {
    //서브 그리드 추가
    const focusData = grdMain.value.getFocusedRowData()
    if (focusData === null) {
      return Message.warn(t('선택된 데이터가 없습니다.'))
    } else if (focusData.SAVE_GBN === 'N') {
      return Message.warn(
        t('위험작업 데이터를 먼저 저장 후 데이터를 추가해야합니다.')
      )
    }
    //서브 그리드
    addSubRowData(focusData)
  } else if (btn.id === 'btnUpdate2') {
    //메인 그리드 저장
    new saveFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeSubSave)
      .setQuery(saveSubData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
    // //서브 그리드 저장
    // let checkRows = grdSub.value.getGridView().getCheckedRows()

    // const dataSet = []

    // for (let rowIdx of checkRows) {
    //   dataSet.push(grdSub.value.getDataProvider().getJsonRow(rowIdx))
    // }

    // if (dataSet.length > 0) {
    //   //저장
    //   // dataSet.USER_ID = userStore.userId
    //   console.log('dataSet ', dataSet)
    //   commonExecuteApi({
    //       queryId: "SAFJA0060_SAVE_02",
    //     list: dataSet
    //   }).then(res => {
    //       console.log('res ', res)
    //   })
    // } else {
    //   Message.warn('선택된 데이터가 없습니다.')
    // }
  } else if (btn.id === 'btnDelete2') {
    //서브 그리드 삭제
    new deleteFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeSubDel)
      .setQuery(delSubData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  }
}

const send = () => {
  //SMS 발송
  let sendSMSParams = {
    EMPNO_FROM: userStore.userId,
    EMPNO_TO: searchParams2.EMP_NO,
    SYSCODE: '156',
    FROM_P_NO: searchParams2.HND_PHN.replace(/-/g, ''),
    TO_P_NO: searchParams2.HND_PHN.replace(/-/g, ''),
    TITLE: `단기공사 위험작업허가 작업 검토 요청이 있습니다.`,
  }
 
  commonSendSMS(sendSMSParams)
  
  //메인그리드 인뎃스
  const focusRow = grdMain.value.getGridView().getCurrent().dataRow
  //메인그리드 정보
  const mainFocus = grdMain.value.getDataProvider().getJsonRow(focusRow)

  //그리드 데이터의 코드값 이름으로 전달
  const bsnsCd = codeList.dataList2.filter(x => x.BSNS_CD === mainFocus.BSNS_CD)
  const deptCd = codeList.dataList5.filter(x => x.DEPT_CD === mainFocus.DEPT_CD)
  const dangDiv = codeList.dataList4.filter(x => x.COD === mainFocus.DANG_DIV)

  // res.ORESULT_CUR.filter(row => row.RISK_TYPE == 'RISK_TYPE-02')
  // 메일 발송
  let mailParams = {
    EMAIL: [searchParams2.EMAIL],
    SUBJECT: '[HiSEs] 단기공사 위험작업허가 작업 등급 검토',
    CONTENT: `</br>
                아래의 단기공사 위험작업허가 작업이 수정/추가되었습니다. 아래 경로로 접속하시어 내용 검토 및 등급을 확정하여 주시기 바랍니다.
              </br>
              <table class="" style="border-collapse: collapse;">
                <tbody>
                  <tr>
                    <td style=" border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:200px; text-align: center;">사업부 </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:200px; text-align: center;">부서</td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:150px; text-align: center;"> 작업분류 </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; background-color:#D9D6FF; width:370px; text-align: center;"> 작업명 </td>
                  </tr>
                  <tr>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;">${bsnsCd[0].BSNS_NM ? bsnsCd[0].BSNS_NM : ''}</td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${deptCd[0].DEPT_NM ? deptCd[0].DEPT_NM : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${dangDiv[0].TXT ? dangDiv[0].TXT : ''} </td>
                    <td style="border-width: 1px 1px 1px 1px; border-color:black; border-style:solid; text-align: center;"> ${mainFocus.WRK_DIST ? mainFocus.WRK_DIST : ''} </td>
                  </tr>
                  
                </tbody>
              </table>
              
              </br > (HiSEs 접속 - 안전 - 단기공사 관리 - 단기공사 위험작업허가 작업 등록/관리)
       `
       
  }
  commonSendApi(mailParams).then((res) => {
    Message.success(t('메일이 전송되었습니다.'))
  })
}

/***************************************************************** */
/* 메인 데이터 저장 */
const beforeMainSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedRows.length === 0) {
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    return false
  }
  return true
}
const saveMainData = () => {
  let dataSet = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedData) {
    dataSet.push(grdMain.value.getDataProvider().getJsonRow(rowIdx))
  }

  return commonExecuteApi({
    queryId: 'SAFJA0060_SAVE_01',
    list: dataSet,
  })
}
/* 메인 데이터 삭제 */
const beforeMainDel = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let del_flag = true
  let del_flag_cnt = true

  if (checkedRows.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))
    return false
  }

  for (let rowIdx of checkedRows) {
    const dataRow = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(dataRow.P_WRK_ID === 'S999999'){
      del_flag = false
    }

    if(dataRow.APROVE_REQ_CNT != '0'){
      del_flag_cnt = false
    }
  }

  if(del_flag === false){
    Message.warn(t('안전경영부 단기공사 기타/비일상(복합)작업은 삭제 불가능 합니다.'))
    return false
  }

  if(logsStore.isMenuAdmin === 'Y'){
    del_flag_cnt === true
  }

  console.log('auth : ',userStore.authGrpCd)
  console.log('Test : ',!userStore.authGrpCd.includes('GRP00380') || !userStore.authGrpCd.includes('HIWAYGRP00001'))


  if (!userStore.authGrpCd.includes('GRP00380') && !userStore.authGrpCd.includes('HIWAYGRP00001')){
    if(del_flag_cnt === false){
      Message.warn(t('검토요청 또는 검토완료건이 존재합니다. 삭제 불가능 합니다.'))
      return false
    }
  }
  
  return true
}
const delMainData = () => {
  let dataSet = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedData) {
    dataSet.push(grdMain.value.getDataProvider().getJsonRow(rowIdx))
  }

  return commonExecuteApi({
    queryId: 'SAFJA0060_DELETE_01',
    list: dataSet,
  })
}

/* 서브 데이터 저장 */
const beforeSubSave = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  if (checkedRows.length === 0) {
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    return false
  }
  return true
}
const saveSubData = () => {
  let dataSet = []
  let checkedData = grdSub.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedData) {
    const dataRow = grdSub.value.getDataProvider().getJsonRow(rowIdx)

    //관리자 권한 있는 사람은 검토 상태와 상관없이 수정 처리 가능 하도록 변경 2024.07.26 - 김우빈(특수선쪽 요청 받음)
    if (logsStore.isMenuAdmin === 'Y' && dataRow.SAVE_YN === 'Y') {
      dataRow.GUBUN = 'R'
      dataRow.REQ_USER_ID = ''
    }
    dataRow.INSERT_ID = userStore.userId
    console.log('dataRow ', dataRow)
    dataSet.push(dataRow)
  }

  return commonExecuteApi({
    queryId: 'SAFJA0060_SAVE_02',
    list: dataSet,
  })
}
/* 서브 데이터 삭제 */
const beforeSubDel = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  if (checkedRows.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))
    return false
  }
  return true
}
const delSubData = () => {
  let dataSet = []
  let checkedData = grdSub.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedData) {
    dataSet.push(grdSub.value.getDataProvider().getJsonRow(rowIdx))
  }

  return commonExecuteApi({
    queryId: 'SAFJA0060_DELETE_02',
    list: dataSet,
  })
}

/****************************************************************** */

//mainGrid 로우 추가하는 함수
const addMainRowData = async () => {
  let deptCd = searchParams.DEPT_CD
  if(searchParams.BSNS_CD == 'AK00') {
    deptCd = 'N1I0'
  }

  const acdtParms = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: deptCd,
  }
  const data = {
    queryId: 'SAFJA0060_SEARCH_03',
    param: acdtParms,
  }

  const meta = {
    useProgress: false,
  }

  let prodDiv = ''

  await commonRequest3('/hse/common/selectList', data, meta).then((res) => {
    if (res.ORESULT_CUR.length > 0) {
      prodDiv = res.ORESULT_CUR[0].PROD_DIV
    }
  })

  let newRow = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: deptCd,
    PROD_DIV: prodDiv,
    DANG_DIV: '',
    WRK_DIST_SEQ: '',
    WRK_DIST_NM: '',
    SAVE_GBN: 'N',
    P_WRK_ID: '',
  }
  await grdMain.value.addRow(newRow)
}

//subGrud 로우 추가하는 함수
const addSubRowData = (rowData) => {
  let newRow = {
    P_WRK_ID: rowData.P_WRK_ID,
    CF_DIV: '',
    LOC_CD: '',
    APROVE_STATUS: '10',
    APROVE_USER_ID: '',
    APROVE_DEPT_CD: '',
    APROVE_DATE: '',
    REQ_USER_ID: '',
    REQ_DEPT_CD: '',
    REQ_DATE: '',
    GUBUN: 'N',
  }
  grdSub.value.addRow(newRow)
}

const onGrdMainRowChanged = (grid, oldRow, newRow) => {
  // let acol = grdMain.value.getGridView().columnByName("GUBN2")
  console.log('newRow ', newRow)
  if (newRow === -1) {
    grdSub.value.getDataProvider().setRows()
  }
  let rowData = grdMain.value.getDataProvider().getJsonRow(newRow)
  grdSub.value.getGridView().filterPanel.clearInput()

  const data = {
    queryId: 'SAFJA0060_SEARCH_02',
    param: {
      P_WRK_ID: rowData.P_WRK_ID,
    },
  }
  const meta = {
    useProgress: false,
  }

  commonRequest3('/hse/common/selectList', data, meta).then((res) => {

    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    cellStyle()
    // grdMain.value.getGridView().setColumn(acol)
  })

}

const comboList2 = () => {
  //중분류
  commonSearchApi({
    queryId: 'searchBSNS',
    param: { CMPNY_DIV: searchParams.CMPNY_DIV },
  }).then((res) => {
    codeList.dataList2 = res.ORESULT_CUR
    codeList.dataList2.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.dataList3 = [{ DEPT_NM: '전체', DEPT_CD: '' }]
    searchParams.BSNS_CD = ''
    searchParams.DEPT_CD = ''
  })
}
//부서 조회
const comboList3 = () => {
  if(searchParams.BSNS_CD == 'AK00') {
    deptReadonly.value = true
    searchParams.DEPT_CD = ''
    return
  } else {
    deptReadonly.value = false
  }
  //중분류
  commonSearchApi({
    queryId: 'searchDept3',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: searchParams.BSNS_CD,
      USE_DIV: 'Y',
    },
  }).then((res) => {
    codeList.dataList3 = res.ORESULT_CUR
    codeList.dataList3.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    searchParams.DEPT_CD = ''
  })
}

const openPopup = () => {
  sAFJA0060Popup.value.openPopup(searchParams2.KOR_NM)
}

const selected = (val) => {
  for (let i in val) {
    searchParams2[i] = val[i]
  }
  console.log('val ', val)
  console.log('searchParams2 ', searchParams2)
}

//부서 조회 팝업 오픈
// const openDeptPopup = () => {
//   deptPopup.value.openPopup({
//     disabled: {
//       ORGN_DIV: true,
//     },
//     ORGN_DIV: "A",
//     CMPNY_DIV: userStore.cmpnyDiv,
//     ASGN_NM : searchParams.ASGN_NM,
//     HSE_SYS : 'N',
//   })
// }

// //부서 조회 팝업 오픈
// const openDeptPopup3 = (data) => {
//   SAFCE0040Pop01.value.openPopup(data)
// }

//그리드 dblClick Event
// const onCellDblClicked = (grid, data) => {
//   if (data.cellType === 'data') {
//     const rowData = grdMain.value.getRowData(data.dataRow)
//     console.log('data :: ', data, ' rowData ::: ', rowData)
//     const getData = {
//       CMPNY_DIV: userStore.cmpnyDiv,
//       BIZ_REG_NO: rowData.BIZ_REG_NO,
//       VEND_CD: rowData.VEND_CD,
//       WORK_NO: rowData.WORK_NO_ORI,
//       REV_NO: rowData.REV_NO,
//     }
//     openDeptPopup3(getData)
//   }
// }

//부서 팝업에서 선택한 데이터 바인딩
const onDeptSelected = (item) => {
  searchParams.ASGN_NM = item.ASGN_SHRT_NM
  searchParams.ASGN_CD = item.ASGN_CD
}

const onDeptSelected2 = (item) => {
  searchParams.VND_NM = item.ASGN_SHRT_NM
  searchParams.VND_CD = item.ASGN_CD
}

//안전팀(확인)
const getItemText = (item) => {
  let str = ''
  if (item.CMPNY_DIVNM === '') {
    str = `${item.CMPNY_DIVNM} ${item.DISP_NM}`
  } else {
    str = `${item.CMPNY_DIVNM} - ${item.DISP_NM}`
  }
  return str
}

// 조직도 부서 조회 파라미터

// 조회로직
const searchData = () => {

  grdMain.value.getGridView().filterPanel.clearInput()

  const acdtParms = {}
  acdtParms.CMPNY_DIV = searchParams.CMPNY_DIV
  acdtParms.BSNS_CD = searchParams.BSNS_CD
  acdtParms.DEPT_CD = searchParams.DEPT_CD
  acdtParms.PROD_DIV = searchParams.PROD_DIV
  acdtParms.APROVE_REQ_YN = searchParams.CHK_YN01
  return commonSearchApi({
    queryId: 'SAFJA0060_SEARCH_01',
    param: acdtParms,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, "ALL_SYS_CD")
}

const cellStyle = (val) => {
  grdSub.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    if (dataCell.dataColumn.fieldName === 'APROVE_STATUS') {
      let data = grid.getValue(dataCell.index.itemIndex, 'APROVE_STATUS')
      if (data === '20') {
        // ret.style = { background: 'red', color: 'white' }
      } else {
        ret.style = { background: 'white', color: 'black' }
      }
    }
    return ret
  })
}

const onCellClicked = async (grid, clickData) => {
  let focus = await grdMain.value.getGridView().getCurrent()
  let rowState = await grdMain.value
    .getDataProvider()
    .getRowState(focus.dataRow)

  /* ****** 좌측 그리드 신규 또는 수정 상태 일때 저장후 입력 가능 ****** */
  if (rowState === 'created' || rowState === 'updated') {
    Message.warn(t('좌측 그리드의 작업을 저장후 입력 가능 합니다.'))
    /* 우측 그리드 수정 금지 */
    cellStyle2(false)
  } else {
    /* 우측 그리드 수정 가능 */
    cellStyle2(true)
  }
}

const cellStyle2 = (val) => {
  grdSub.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    if (dataCell.dataColumn.fieldName === 'CF_DIV') {
      if (val) {
        ret.editable = true
      } else {
        ret.editable = false
      }
    }
    return ret
  }) 
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        title="단기공사 위험작업허가 작업 등록/관리"
        :button-list="['btnSearch','btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <div class="notice1" v-if="userStore.bsnsCd == 'AK00'">
      ※ 엔진기계사업부의 단기공사 위험작업허가 대상 작업 등록/수정은 엔진기계안전부에서만 가능합니다. 
    </div>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex pb-2">
            <i-select
              :label="$t('회사구분')"
              :items="codeList.dataList1"
              v-model="searchParams.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
              label-width="60px"
              width="230px"
              @update:model-value="comboList2()"
              :readonly="isReadonly"
            />

            <i-select
              :label="$t('사업부')"
              :items="codeList.dataList2"
              v-model="searchParams.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              label-width="50px"
              width="230px"
              @update:model-value="comboList3()"
              :readonly="isReadonly"
            />

            <i-select
              :label="$t('부서')"
              :disabled="searchParams.BSNS_CD == ''"
              :items="codeList.dataList3"
              v-model="searchParams.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              label-width="40px"
              width="300px"
              :readonly="isReadonly || deptReadonly"
            />

            <VCheckbox
              class="ma-0 mt-1"
              :label="$t('안전검토 건 조회')"
              v-model="searchParams.CHK_YN01"
              :disabled="isReadonly"
            />
          </div>
        </v-sheet>
        <!-- 메인그리드 -->
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
          <div class="d-flex flex-columns fill-height">
            <v-sheet class="mr-4" width="50%">
              <IGridTitle
                ref="menuTitle"
                :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                @click-button="onButtonsClick"
                class="mb-0"
              />
              <RealGrid
                ref="grdMain"
                class="mt-2"
                :grid-view-option="grdProps1.gridViewOption"
                :keys="grdProps1.keys"
                :fields="grdProps1.fields"
                :columns="grdProps1.columns"
                :column-layout="grdProps1.columnLayout"
                @onCurrentRowChanged="onGrdMainRowChanged"
              />
            </v-sheet>
            <v-sheet class="" width="50%">
              <div class="d-flex">
                <v-sheet width="80%" class="d-flex">
                  <i-input
                    :label="$t('검토자(안전과장)')"
                    label-width="140px"
                    width="250px"
                    v-model="searchParams2.KOR_NM"
                    append-inner-icon="mdi-magnify"
                    class="ml-2"
                    @keydown.enter="
                      (e) => {
                        openPopup()
                      }
                    "
                    @click:appendInner="openPopup()"
                  />
                  <div class="notice2 mt-1">
                    ※ 저장 후 검토자(안전과장) 지정하여 검토요청까지 해 주시기 바랍니다.
                  </div>
                </v-sheet>
                <v-sheet width="210px">
                  <IGridTitle
                    ref="subMenuTitle"
                    :button-list="['btnUpdate', 'btnReqReview', 'btnConfirm']"
                    @click-button="onSubButtonsClick"
                    class="mb-0"
                  />
                </v-sheet>
              </div>
              <RealGrid
                ref="grdSub"
                class="mt-1"
                :grid-view-option="grdProps2.gridViewOption"
                :keys="grdProps2.keys"
                :fields="grdProps2.fields"
                :columns="grdProps2.columns"
                :column-layout="grdProps2.columnLayout"
                @onCellClicked="onCellClicked"
              />
            </v-sheet>
          </div>
          <!-- @onCellDblClicked="onCellDblClicked" -->
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>

  <v-dialog
    v-model="m_dialog"
    width="auto"
  >
    <v-card
      max-width="600"
      style="padding: 20px;"
      prepend-icon="mdi-information"
      text="※ 저장 완료 후 안전 검토자(안전과장) 기입 및 검토요청을 해야 업체(단기공사)의 위험작업허가 리스트에 발생되오니, 반드시 검토요청을 해 주시기 바랍니다. "
      title="알림"
    >
      <template v-slot:actions>
        <v-btn
          class="ms-auto"
          text="Ok"
          @click="m_dialog = false"
        ></v-btn>
      </template>
    </v-card>
  </v-dialog>

  <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
  <DeptPopup ref="deptPopup2" @selected="onDeptSelected2" />
  <SAFCE0040Popup01 ref="SAFCE0040Pop01" />

  <SAFJA0060Popup ref="sAFJA0060Popup" @selected="selected" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 190px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}

.v-text-field--outlined fieldset {
  border-color: #fff !important;
}
.notice1 {
  position: fixed;
  z-index: 9999;
  color: blue;
  font-size: 0.85rem;
  left: 60px; 
  top: 245px;
  font-weight: bold;
}
.notice2 {
  z-index: 9999;
  color: blue; 
  font-weight: bold;
}
</style>
