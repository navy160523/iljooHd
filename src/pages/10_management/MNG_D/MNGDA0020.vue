<!--
  화면명 : 심사결과 등록
  화면개요 : 인증심사 내용을 등록하는 화면
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
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

defineOptions({
  name: '10_management-MNG_D-MNGDA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMainTitle = ref(null)
const menuSubTitle1 = ref(null)
const menuSubTitle2 = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const empPopup = ref(null)

const InOutSearch = ref([
  { Text: '전체', Code: '' },
  { Text: '내부', Code: 'IN' },
  { Text: '외부', Code: 'OT' },
])

const subButtonlist = ref([
  ['btnModify'],
  ['btnCreate', 'btnDelete', 'btnUpdate'],
  ['btnCollectiveApp'],
])

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  YEAR: dayjs().format('YYYY'),
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.deptCd,
  ASGN_SHRT_NM: '',
  IN_OUT: '',
  CERT_ID: '',
  RECEIVE_DT: '',
  USE_DIV: 'Y',
  SUB_SEARCH: 'Y',
  MAIN_ROW_IDX: -1,
})

//팝업 파라미터
const popupParams = reactive({
  EMP_CD: '',
  EMP_NM: '',
  ROW_IDX: 0,
  COL_NM: '',
  COL_CD_NM: '',
})

// 조회조건(년도) 조건
const validationInputDate = ref({
  required: (value) => value?.length == 4 || '올바른 년도를 입력해주세요',
})

//코드리스트 선언
const codeList = reactive({
  BSNS: [],
  ORGN_DIV: [
    { COD: 'A', TXT: '직영' },
    { COD: 'B', TXT: '사내협력사' },
  ],
  ASGN: [],
  ACCDNT_TYPE: [],
  PROC: [],
  CERT_CODE: [], // 인증심사
  CERT_ITEM: [],
  RESULT_CD: [],
})

//메인그리드 컬럼 세팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '50',
      header: { text: t('부서') },
      mergeRule: { criteria: 'value' },
      editable: false,
    },
    {
      fieldName: 'IN_OUT_NM',
      dataType: 'text',
      width: '50',
      header: { text: t('내/외부') },
      editable: false,
    },
    {
      fieldName: 'CERT_DT',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
      width: '50',
      styleName: 'editable_column',
      header: { text: t('심사일'), styleName: 'header_validit' },
    },    
    { 
      fieldName: 'CERT_EMP_NM', 
      dataType: 'text', 
      header: { text:'추진자', styleName: 'header_validit' }, 
      readonly: true,
      width: '50',      
      editable: false,
      renderer: {
          type: "html",
          callback: function (grid, cell, w, h) {
            var cellVal = cell.value
            if(cellVal === null){
              cellVal = ''
            }
            var str = 
            `<div style="display: flex; justify-content: space-between;">
              <p style="display: flex; align-items: center; justify-content: center; width: -webkit-fill-available; overflow-x: hidden;">
                ${cellVal}
              </p>
              <button id="cellButton" style="height: 30px;">
                <span class="mdi mdi-magnify text-light-blue-darken-1"
                style="font-size: 22px ;display: flex; align-items: center;"/>
              </button>
            </div>`
            return str;
          },
        },
    },
    {
      fieldName: 'CERT_EMP_TEL',
      dataType: 'text',
      width: '50',
      styleName: 'editable_column',
      header: { text: t('연락처'), styleName: 'header_validit' },
    },    
    { 
      fieldName: 'EVA_EMP_NM', 
      dataType: 'text', 
      header: { text:'심사원', styleName: 'header_validit' }, 
      readonly: true,
      width: '50',      
      editable: false,
      renderer: {
          type: "html",
          callback: function (grid, cell, w, h) {
            var cellVal = cell.value
            if(cellVal === null){
              cellVal = ''
            }
            var str = 
            `<div style="display: flex; justify-content: space-between;">
              <p style="display: flex; align-items: center; justify-content: center; width: -webkit-fill-available; overflow-x: hidden;">
                ${cellVal}
              </p>
              <button id="cellButton" style="height: 30px;">
                <span class="mdi mdi-magnify text-light-blue-darken-1"
                style="font-size: 22px ;display: flex; align-items: center;"/>
              </button>
            </div>`
            return str;
          },
        },
    },
    {
      fieldName: 'RESULT_CD',
      dataType: 'text',
      width: '50',
      styleName: 'editable_column',
      lookupDisplay: true,
      editor: { type: 'dropdown', domainOnly: true, partialMatch: true },
      values: ['Y', 'N'],
      labels: ['적합', '부적합'],
      header: { text: t('심사결과'), styleName: 'header_validit' },      
    },
    {
      fieldName: 'ACTION_CD',
      dataType: 'text',
      width: '50',
      header: { text: t('조치유무') },
      editable: false,
    },
    {
      fieldName: 'STATUS_NM',
      dataType: 'text',
      width: '50',
      header: { text: t('상태') },
      editable: false,
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'IN_OUT',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'ASGN_CD',
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
    {
      fieldName: 'RECEIVE_DT',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'EVA_STATUS',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'CERT_TIME',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'CERT_PLACE',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'SAVE_YN',
      dataType: 'text',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CERT_ID',
      dataType: 'text',
      width: '25',
      lookupDisplay: true,
      editor: { type: 'dropdown', domainOnly: true, partialMatch: true },
      header: { text: t('인증규격'), styleName: 'header_validit' },
    },
    {
      fieldName: 'CERT_ITEM',
      dataType: 'text',
      width: '60',
      styleName: 'editable_multiline_column-left',
      header: { text: t('심사항목'), styleName: 'header_validit' },
      editor: {
        type: 'dropdown',
        dropDownWhenClick: true,
        values: [
          '부서 조직도',
          '안전 보건 환경 방침 목표',
          '업무 분장',
          '위험성 평가',
          '기타',
        ],
        labels: [
          '부서 조직도',
          '안전 보건 환경 방침 목표',
          '업무 분장',
          '위험성 평가',
          '기타',
        ],
      },
    },
    {
      fieldName: 'RESULT_CD',
      dataType: 'text',
      width: '25',
      lookupDisplay: true,
      styleName: 'editable_column',
      header: { text: t('부적합등급'), styleName: 'header_validit' },
      editor: { type: 'dropdown', domainOnly: true, partialMatch: true },
    },
    {
      fieldName: 'RESULT_CONTENTS',
      dataType: 'text',
      width: '60',
      header: { text: t('부적합내용'), styleName: 'header_validit' },
      styleName: 'editable_multiline_column-left',
    },
    {
      fieldName: 'SOLUTION_PLAN',
      dataType: 'text',
      width: '60',
      header: { text: t('개선조치방안'), styleName: 'header_validit' },
      styleName: 'editable_multiline_column-left',
    },
    {
      fieldName: 'RECEIVE_DT',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
      width: '25',
      styleName: 'editable_column',
      header: { text: t('조치기한'), styleName: 'header_validit' },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'IN_OUT',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'SAVE_YN',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'SEQ',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'ORD_NUM',
      dataType: 'text',
      visible: false,
    },
  ],
})

grdSubProps.columns = grdSubProps.fields

// 코드리스트 셋팅
const initCodeList = () => {
  Promise.all([getCodeList('HHIAF20'), getCodeList('HHIAF19')]).then((res) => {
    codeList.CERT_CODE = res[0].ORESULT_CUR.slice(0, 3) //조회값은 5개이지만 cs에서 3개만 사용하므로 3개만 넣음 추후 인증심사 코드 필요시 slice값 조정 및 삭제
    codeList.RESULT_CD = res[1].ORESULT_CUR
    grdSub.value.setBindingColumn('CERT_ID', codeList.CERT_CODE, 'COD', 'TXT')
    grdSub.value.setBindingColumn('RESULT_CD', codeList.RESULT_CD, 'COD', 'TXT')
  })

  //사업부 설정
  setBsnsCombo()

  //부서 설정
  setDeptMainCombo()
}

//메뉴버튼
const onButtonsClick = (btn) => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain, grdSub])
    .setSearchArea(searchArea)
    .setBefore(beforeSearch)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}

//메인 그리드 버튼
const onButtonsClickMain = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSaveMain)
      .setQuery(saveMainData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnCompleteSAF') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeCompMain)
      .setQuery(saveCompData)
      .setAfter(afterSaveCompData)
      .run()
  } else if (btn.id === 'btnModify') {
    updateCertStat()
  }
}

//서브 그리드 버튼
const onButtonsClickSub = (btn) => {
  if (btn.id === 'btnCreate') {
    addSubGrdRow()
  } else if (btn.id === 'btnDelete') {
    delSubGrdRow()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdSub, row: null }])
      .setGridList([grdSub])
      .setBefore(beforeSubSave)
      .setQuery(saveSubData)
      .setAfter(searchMainFocus)
      .run()
  } else if (btn.id === 'btnCollectiveApp') {
    setSubGrdData()
  }
}

//서브그리드 행추가 기능
const addSubGrdRow = () => {
  let rowData = grdMain.value.getFocusedRowData()
  let newRowData = {
    CMPNY_DIV: rowData.CMPNY_DIV,
    YEAR: rowData.YEAR,
    BSNS_CD: rowData.BSNS_CD,
    ASGN_CD: rowData.ASGN_CD,
    IN_OUT: rowData.IN_OUT,
    SEQ: '',
    CERT_ID: searchParams.CERT_ID,
    CERT_ITEM: '',
    RESULT_CD: rowData.IN_OUT === 'IN' ? 'N' : '',
    RESULT_CONTENTS: '',
    SOLUTION_PLAN: '',
    RECEIVE_DT: searchParams.RECEIVE_DT,
    SAVE_YN: '',
  }
  grdSub.value.addRow(newRowData, false)
}

//서브그리드 행삭제 기능
const delSubGrdRow = () => {
  new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdSub, row: null }])
    .setGridList([grdSub])
    .setBefore(beforeDelete)
    .setQuery(deleteData)
    .setAfter(afterDelete)
    .run()
}

//서브그리드 삭제기능 체크된 데이터 확인
const beforeDelete = () => {
  return grdSub.value.getGridView().getCheckedRows().length > 0
}

//서브 그리드 데이터 삭제 DB 실행
const deleteData = () => {
  let deleteParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows()
  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getRowData(rowIdx)
    data.USER_ID = searchParams.USER_ID
    if (data.SEQ != '') deleteParams.push(data)
  }

  return commonExecuteApi({
    queryId: 'MNGDA0020_DELETE_01',
    list: deleteParams,
  })
}

//서브그리드 데이터 삭제후 그리드에서 삭제
const afterDelete = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows()
  for (let i = checkedRows.length - 1; i >= 0; i--) {
    grdSub.value.getDataProvider().removeRow(checkedRows[i])
  }
  grdSub.value.getGridView().checkAll(false)
}

//서브그리드 저장 DB데이터 저장
const saveSubData = () => {
  let rowIdxs = grdSub.value.getGridView().getCheckedRows()
  let saveList = []
  rowIdxs.forEach((idx) => {
    let rowData = grdSub.value.getRowData(idx)
    let offset = new Date().getTimezoneOffset() * 60000
    saveList.push({
      CMPNY_DIV: rowData.CMPNY_DIV,
      YEAR: rowData.YEAR,
      BSNS_CD: rowData.BSNS_CD,
      ASGN_CD: rowData.ASGN_CD,
      IN_OUT: rowData.IN_OUT,
      SEQ: rowData.SEQ,
      CERT_ID: rowData.CERT_ID,
      CERT_ITEM: rowData.CERT_ITEM,
      RESULT_CD: rowData.RESULT_CD,
      RESULT_CONTENTS: rowData.RESULT_CONTENTS,
      SOLUTION_PLAN: rowData.SOLUTION_PLAN,
      RECEIVE_DT: new Date(rowData.RECEIVE_DT - offset).toISOString()
        .substring(0, 10)
        .replaceAll('-', ''),
      ORD_NUM: rowData.ORD_NUM,
      SAVE_YN: rowData.SAVE_YN,
      USER_ID: searchParams.USER_ID,
    })
  })

  return commonExecuteApi({ queryId: 'MNGDA0020_SAVE_02', list: saveList })
}

//수정버튼 기능
const updateCertStat = () => {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid: grdMain, row: null }])
    .setGridList([grdMain])
    .setResultMessage('수정했습니다.')
    .setConfirmMessage('수정하시겠습니까?')
    .setBefore(beforeSave)
    .setQuery(saveModifyData)
    .setAfter(searchMainFocus)
    .run()
}

//수정버튼 기능 데이터 DB 저장
const saveModifyData = () => {
  let rowData = grdMain.value.getFocusedRowData()

  let saveList = [
    {
      CMPNY_DIV: rowData.CMPNY_DIV,
      YEAR: rowData.YEAR,
      BSNS_CD: rowData.BSNS_CD,
      ASGN_CD: rowData.ASGN_CD,
      IN_OUT: rowData.IN_OUT,
      EVA_STATUS: '10',
      USER_ID: searchParams.USER_ID,
    },
  ]

  return commonExecuteApi({ queryId: 'MNGDA0020_UPDATE_01', list: saveList })
}

//메인그리드 포커스 유지한 채로 조회
const searchMainFocus = () => {
  grdSub.value.getGridView().checkAll(false)
  // searchParams.SUB_SEARCH = 'N'
  // onButtonsClick({ id: 'btnSearch' })
  // searchParams.SUB_SEARCH = 'Y'
  grdMain.value.getGridView().setCurrent({ dataRow: searchParams.MAIN_ROW_IDX })

  // 저장 후 부적합 목록 재조회
  new queryFlowHelper(vm, t)
    .setUseDefaultBefore(false)
    .setQuery(searchData02, searchParams.MAIN_ROW_IDX)
    .setAfter(afterSearch02)
    .showMessage(false)
    .run()
}

//적용버튼 기능
const setSubGrdData = () => {
  let rowIdxs = grdSub.value.getGridView().getCheckedRows()

  if (rowIdxs.length === 0) {
    Message.warn('(일괄)적용하고자 하는 부적합 사항을 선택해 주세요')    
    return false
  }

  rowIdxs.forEach((idx) => {
    grdSubSetValue(idx, 'CERT_ID', searchParams.CERT_ID)
    grdSubSetValue(idx, 'RECEIVE_DT', searchParams.RECEIVE_DT)
  })
}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const beforeSearch = async () => {
  return true
}

// 조회로직
const searchData = () => {
  return commonSearchApi({
    queryId: 'MNGDA0020_SEARCH_01',
    param: searchParams,
  })
}

const afterSearch = (res) => {
  res.ORESULT_CUR.forEach((row) => {
    row.SAVE_YN = 'Y'
  })
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/*/메뉴버튼 조회*********************************************/

//서브데이터 저장전 정렬값 부여
const beforeSubSave = async () => {
  let rowData = grdSub.value.getDataProvider().getJsonRows()
  let result = true

  //console.log('rowData',rowData)

  for (let i = 0; i < rowData.length; i++) {
    grdSubSetValue(i, 'ORD_NUM', i + 1)
  }

  let rowIdxs = grdSub.value.getGridView().getCheckedRows()

  if (rowIdxs.length === 0) {
    Message.warn('저장 할 항목을 선택해 주세요')    
    return false
  }

  rowIdxs.forEach((idx) => {
    let rowData = grdSub.value.getRowData(idx)

    //console.log('rowData', rowData)
    //console.log('rowData.CERT_ID', rowData.CERT_ID)

    if (isNull(rowData.CERT_ID)) {
      Message.warn((idx+1) + '행의 인증규격을 입력해주세요.')
      result = false
    }else if (isNull(rowData.CERT_ITEM)) {
      Message.warn((idx+1) + '행의 심사항목을 입력해주세요.')
      result = false
    }else if (isNull(rowData.RESULT_CD)) {
      Message.warn((idx+1) + '행의 부적합등급을 입력해주세요.')
      result = false
    }else if (isNull(rowData.RESULT_CONTENTS)) {
      Message.warn((idx+1) + '행의 부적합내용을 입력해주세요.')
      result = false
    }else if (isNull(rowData.SOLUTION_PLAN)) {
      Message.warn((idx+1) + '행의 개선조치방안을 입력해주세요.')
      result = false
    }else if (isNull(rowData.RECEIVE_DT)) {
      Message.warn((idx+1) + '행의 조치기한을 입력해주세요.')
      result = false
    }
  })

  return result
}

//저장 전 체크
const beforeSave = () => {
  return true
}

//메인 그리드 저장 전 체크
const beforeSaveMain = () => {
  grdMain.value.getGridView().commit()

  return chkValMain()
}

//메인 데이터 체크
const chkValMain = () => {
  let rowIdxs = grdMain.value.getGridView().getCheckedRows()

  //console.log('chkValMain', rowIdxs)

  let result = true
  if (rowIdxs.length === 0) {
    Message.warn('저장할 데이터가 없습니다.')
    return false
  }
  rowIdxs.forEach((idx) => {
    let rowData = grdMain.value.getRowData(idx)
    if (isNull(rowData.CERT_DT)) {
      Message.warn('심사일을 입력해주세요.')

      result = false
    } else if (isNull(rowData.CERT_EMP)) {
      Message.warn('추진자를 입력해주세요.')

      result = false
    } else if (isNull(rowData.CERT_EMP_TEL)) {
      Message.warn('연락처를 입력해주세요.')

      result = false
    } else if (isNull(rowData.EVA_EMP_NM)) {
      Message.warn('심사원을 입력해주세요.')

      result = false
    } else if (isNull(rowData.RESULT_CD)) {
      Message.warn('심사결과를 선택해주세요.')

      result = false
    }
  })

  return result
}

//메인그리드 - 저장
const saveMainData = () => {
  let rowIdxs = grdMain.value.getGridView().getCheckedRows()
  let saveList = []
  rowIdxs.forEach((idx) => {
    let rowData = grdMain.value.getRowData(idx)
    let offset = new Date().getTimezoneOffset() * 60000
    saveList.push({
      CMPNY_DIV: rowData.CMPNY_DIV,
      YEAR: rowData.YEAR,
      BSNS_CD: rowData.BSNS_CD,
      ASGN_CD: rowData.ASGN_CD,
      IN_OUT: rowData.IN_OUT,
      CERT_DT: new Date(rowData.CERT_DT - offset)
        .toISOString()
        .substring(0, 10)
        .replaceAll('-', ''),
      CERT_ITEM: rowData.CERT_ITEM,
      CERT_PLACE: rowData.CERT_PLACE,
      CERT_EMP: rowData.CERT_EMP,
      CERT_EMP_TEL: rowData.CERT_EMP_TEL,
      RESULT_CD: rowData.RESULT_CD,
      EVA_EMP: rowData.EVA_EMP,
      EVA_EMP_NM: rowData.EVA_EMP_NM,
      REMARKS: rowData.REMARKS,
      SAVE_YN: rowData.SAVE_YN,
      USER_ID: searchParams.USER_ID,
    })
  })

  return commonExecuteApi({ queryId: 'MNGDA0020_SAVE_01', list: saveList })
}

//메인 그리드 작성완료 전 체크
const beforeCompMain = () => {
  grdMain.value.getGridView().commit()

  return chkValMainComp()
}

//메인 데이터 체크
const chkValMainComp = async () => {
  let rowIdxs = grdMain.value.getGridView().getCheckedRows()
  let saveYN = 'Y'

  let result = true
  if (rowIdxs.length === 0) {
    Message.warn('작성완료 처리 할 데이터가 없습니다.')
    result = false
    return false
  }
  else{
  
    for (const idx of rowIdxs) {
      let rowData = grdMain.value.getRowData(idx)

      if(isNull(rowData.STATUS)) {
        saveYN = 'N'
        Message.warn((idx+1) + '행이 저장 안되었습니다. 저장 후 작성완료처리 바랍니다.')
        result = false
        return false
      }
      
      if(rowData.RESULT_CD === 'N'){
        // 부적합이면 부적합목록이 저장되어 있는지 체크
        let searchParams2 = {
          CMPNY_DIV: rowData.CMPNY_DIV,
          YEAR: rowData.YEAR,
          BSNS_CD: rowData.BSNS_CD,
          ASGN_CD: rowData.ASGN_CD,
          IN_OUT: rowData.IN_OUT,
        } 

        let rowCnt = 0

        await commonSearchApi({
          queryId: 'MNGDA0020_SEARCH_02',
          param: searchParams2,
        }).then((res) => {
          console.log('res',res)
          rowCnt = res.ORESULT_CUR.length
        })
        
        //let rowCnt = searchData02_chk(idx)
        console.log('rowCnt',rowCnt) 
        
        if(rowCnt === 0){
          Message.warn((idx+1) + '행의 부적합 목록이 작성 안되었습니다.')
          result = false
          return false
        } 
      }    
    }
  }

  console.log('result',result)
  return result
}

//메인그리드 - 작성완료
const saveCompData = () => {
  let rowIdxs = grdMain.value.getGridView().getCheckedRows()
  let saveList = []  

  rowIdxs.forEach((idx) => {
    let rowData = grdMain.value.getRowData(idx)    

    if (rowData.STATUS === '10') {
      saveList.push({
        CMPNY_DIV: rowData.CMPNY_DIV,
        YEAR: rowData.YEAR,
        BSNS_CD: rowData.BSNS_CD,
        DEPT_CD: rowData.ASGN_CD,
        ASGN_CD: rowData.ASGN_CD,
        IN_OUT: rowData.IN_OUT,
        EVA_STATUS: rowData.RESULT_CD === 'Y'?'60':'20',
        USER_ID: searchParams.USER_ID,
      })
    }
  })

  return commonExecuteApi({ queryId: 'MNGDA0020_UPDATE_01', list: saveList })
}

//메인그리드 - 작성완료 후처리
const afterSaveCompData = async () => {
  
  let rowIdxs = grdMain.value.getGridView().getCheckedRows()
  if (rowIdxs.length === 0) return

  let mailParamsData = {
    EMAIL: [],
    SUBJECT: '[HiSEs] HSE경영시스템 심사 결과 및 조치결과 등록 안내 건',
    CONTENT: '',
  }

  await rowIdxs.forEach(async (idx) => {
    let rowData = grdMain.value.getRowData(idx)
    if (rowData.STATUS === '10' && rowData.RESULT_CD === 'N') {
      mailParamsData.EMAIL = []

      // 개발중에는 담당자 정보기능 비활성화
      await commonSearchApi({
        queryId: 'MNGDA0020_SEARCH_06',
        param: {
          CMPNY_DIV: rowData.CMPNY_DIV,
          YEAR: rowData.YEAR,
          BSNS_CD: rowData.BSNS_CD,
          DEPT_CD: rowData.ASGN_CD,
          ASGN_CD: rowData.ASGN_CD,
          IN_OUT: rowData.IN_OUT,
        },
      }).then(async (res) => {
        if (res.ORESULT_CUR.length > 0) {
          await res.ORESULT_CUR.forEach((row) => {
            mailParamsData.EMAIL.push(row.EMAIL)
          })
        }
      })

      mailParamsData.CONTENT = ''
      mailParamsData.CONTENT +=
        // "<a href='{url}'>심사결과</a> 가 등록되었습니다. 조치 기한을 엄수하시어 조치 결과 전산(HiSEs) 등록 바랍니다<br />"
        "담당 심사원을 통해 HSE경영시스템 심사 결과가 등록되었습니다. 아래 경로에서 조치결과를 등록해 주시기 바랍니다.<br/>[경로]  HiSEs 접속 후  [HSE경영시스템]-[인증심사]-[조치결과 등록/관리]<br />"
      

      await commonSendApi(mailParamsData).then((res) => {
        Message.success(t('메일이 전송되었습니다.'))
      })
    }
  })
  onButtonsClick({ id: 'btnSearch' })
}

/*/메뉴버튼 저장*********************************************/

/*서브 grid*****************************************************/
const searchData02 = (idx) => {
  let searchParams2 = {}
  let row = null

  if (idx >= 0) {
    row = grdMain.value.getDataProvider().getJsonRow(idx)
  }

  // 데이터가 null 일경우 빈 Promise 반환
  if (!row) {
    return new Promise((resolve, reject) => resolve(null))
  }

  searchParams2 = {
    CMPNY_DIV: row.CMPNY_DIV,
    YEAR: row.YEAR,
    BSNS_CD: row.BSNS_CD,
    ASGN_CD: row.ASGN_CD,
    IN_OUT: row.IN_OUT,
  }
  setSubButtonSet(row.RESULT_CD, row.STATUS)

  return commonSearchApi({
    queryId: 'MNGDA0020_SEARCH_02',
    param: searchParams2,
  })
}

const searchData02_chk = async (idx) => {
  let searchParams2 = {}
  let row = null
  let rowCnt = 0

  if (idx >= 0) {
    row = grdMain.value.getDataProvider().getJsonRow(idx)
  }

  // 데이터가 null 일경우 빈 Promise 반환
  if (!row) {
    return new Promise((resolve, reject) => resolve(null))
  }

  searchParams2 = {
    CMPNY_DIV: row.CMPNY_DIV,
    YEAR: row.YEAR,
    BSNS_CD: row.BSNS_CD,
    ASGN_CD: row.ASGN_CD,
    IN_OUT: row.IN_OUT,
  } 

  let res = await commonSearchApi({
    queryId: 'MNGDA0020_SEARCH_02',
    param: searchParams2,
  })

  console.log('res',res)

  return res.ORESULT_CUR.length
}

//  팝업 조회 데이터 바인딩
const afterSearch02 = (res) => {
  res.ORESULT_CUR.forEach((row) => {
    row.SAVE_YN = 'Y'
  })
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/*/서브 grid*****************************************************/

/*이벤트*****************************************************/
const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
  let row = grdMain.value.getDataProvider().getJsonRow(newIdx)

  if (searchParams.SUB_SEARCH === 'Y') {    
    if (row.IN_OUT === 'IN') {
      grdSub.value.setBindingColumn(
        'RESULT_CD',
        [{ COD: 'N', TXT: '부적합' }],
        'COD',
        'TXT'
      )
    } else {
      grdSub.value.setBindingColumn(
        'RESULT_CD',
        codeList.RESULT_CD,
        'COD',
        'TXT'
      )
    }

    searchParams.MAIN_ROW_IDX = newIdx
    new queryFlowHelper(vm, t)
      .setUseDefaultBefore(false)
      .setQuery(searchData02, newIdx)
      .setAfter(afterSearch02)
      .showMessage(false)
      .run()
  }

  setSubButtonSet(row.RESULT_CD, row.STATUS)
}

//직원 정보 팝업
const popupEmpOpen = (grid, clickInfo, column) => {
  popupParams.ROW_IDX = clickInfo.itemIndex
  popupParams.COL_NM = clickInfo.fieldName

  let row = grdMain.value.getRowData(clickInfo.itemIndex)
  if (clickInfo.fieldName === 'CERT_EMP_NM') {
    popupParams.EMP_NM = row.CERT_EMP_NM
    popupParams.COL_CD_NM = 'CERT_EMP'
    empPopup.value.openPopup({
      EMP_NM: popupParams.EMP_NM,
      BSNS_CD: row.BSNS_CD,
      DEPT_CD: row.ASGN_CD,
      DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    })
  } else {
    popupParams.EMP_NO = isNull(row.EVA_EMP) ? userStore.empNo : row.EVA_EMP
    popupParams.EMP_NM = isNull(row.EVA_EMP_NM) ? userStore.empNm : row.EVA_EMP_NM
    popupParams.COL_CD_NM = 'EVA_EMP'
    empPopup.value.openPopup({
      EMP_NO: popupParams.EMP_NO,
      EMP_NM: popupParams.EMP_NM,
      DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    })
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
  if (field === 3) {
    grid.commit()
    let row = grdMain.value.getRowData(dataRow)
    popupParams.EMP_NM = row.CERT_EMP_NM
    popupParams.COL_CD_NM = 'CERT_EMP'

    empPopup.value.openPopup({
      EMP_NM: popupParams.EMP_NM,
      BSNS_CD: row.BSNS_CD,
      DEPT_CD: row.ASGN_CD,
      DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    })
  } else if (field === 5) {
    grid.commit()
    let row = grdMain.value.getRowData(dataRow)
    popupParams.EMP_NM = row.EVA_EMP_NM
    popupParams.COL_CD_NM = 'EVA_EMP'

    empPopup.value.openPopup({
      EMP_NM: popupParams.EMP_NM,
      DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    })
  }
}

//직원 팝업 데이터 셋팅
const selectedEmpData = (val) => {
  grdMainSetValue(popupParams.ROW_IDX, popupParams.COL_NM, val.EMP_NM)
  grdMainSetValue(popupParams.ROW_IDX, popupParams.COL_CD_NM, val.EMP_NO)
  grdMainSetValue(popupParams.ROW_IDX, 'CERT_EMP_TEL', val.TEL_NO)
  // if (popupParams.COL_NM === 'CERT_EMP_NM') {
  //   grdMainSetValue(popupParams.ROW_IDX, 'CERT_EMP_TEL', val.TEL_NO)
  // }

  grdMain.value.getGridView().checkRow(popupParams.ROW_IDX, true)
}

//메인그리드 데이터 입력
const grdMainSetValue = (rowIdx, fieldNM, val) => {
  grdMain.value.getDataProvider().setValue(rowIdx, fieldNM, val)
}

//서브그리드 데이터 입력
const grdSubSetValue = (rowIdx, fieldNM, val) => {
  grdSub.value.getDataProvider().setValue(rowIdx, fieldNM, val)
}

//사업부 설정
const setBsnsCombo = () => {
  codeList.BSNS = []
  codeList.ASGN = []
  codeList.BSNS.push({ BSNS_CD: '', BSNS_NM: '전체' })
  commonSearchApi({ queryId: 'searchBSNS', param: searchParams }).then(
    (res) => {
      res.ORESULT_CUR.forEach((element) => {
        codeList.BSNS.push(element)
      })
    }
  )
}

//사업부 변경 이벤트
const updateBsns = () => {
  searchParams.ASGN_CD = ''
  setDeptMainCombo()
}

//상세정보 조회시 버튼 활성화 조절
const setSubButtonSet = (resCd, statCD) => {
  let resYn = (resCd === 'Y' || isNull(resCd)) // 적합:true, 부적합:false
  let statYn = isNull(statCD) || (statCD === '10') // 저장 안되었거나 상태가 작성중일 때

  console.log('resYn',resYn)
  console.log('statYn',statYn)


  if(statYn) {
    // 작성중일 때
    grdMainTitle.value.getButtonItems().forEach((btn) => {      
      grdMainTitle.value.disableBtn(btn.id, !statYn)      
    })

    subButtonlist.value[1].forEach((btnId) => {
      menuSubTitle2.value.disableBtn(btnId, resYn)
    })

    // 부적합목록 적용버튼
    subButtonlist.value[2].forEach((btnId) => {
      menuSubTitle1.value.disableBtn(btnId, resYn)
    })

    grdSub.value.getGridView().editOptions.editable = !resYn
    grdMain.value.getGridView().editOptions.editable = true
  } else {
    // 작성중 이상일 때
    grdMainTitle.value.getButtonItems().forEach((btn) => {      
      grdMainTitle.value.disableBtn(btn.id, true)      
    })

    // 부적합목록 추가, 삭제, 저장
    subButtonlist.value[1].forEach((btnId) => {
      menuSubTitle2.value.disableBtn(btnId, true)
    })

    // 부적합목록 적용버튼
    subButtonlist.value[2].forEach((btnId) => {
      menuSubTitle1.value.disableBtn(btnId, true)
    })


    // 25.04.04 인증심사 모듈 관리자는 언제나 추진자 수정 가능하게 수정
    if (userStore.authGrpCd.includes('MNGDA001') || userStore.empNo === 'A526166' ) {
      
      grdMainTitle.value.disableBtn('btnUpdate', false)

      // 부적합목록 추가, 삭제, 저장
      subButtonlist.value[1].forEach((btnId) => {
        menuSubTitle2.value.disableBtn(btnId, false)
      })
    }

    grdMain.value.getGridView().editOptions.editable = false
    grdSub.value.getGridView().editOptions.editable = false
  }  
}

//부서 설정
const setDeptMainCombo = () => {
  let paramDept = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    USE_DIV: searchParams.USE_DIV,
  }

  codeList.ASGN = [{ DEPT_CD: '', DEPT_NM: '전체' }]

  commonSearchApi({ queryId: 'searchDept3', param: paramDept }).then((res) => {
    res.ORESULT_CUR.forEach((element) => {
      codeList.ASGN.push(element)
    })
  })
}

const isNull = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}

const isNullAndEmpty = (data) => {
  return isNull(data) ? '' : data
}

// 사업부 변경 시 부문, 부서 변경 이벤트
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    Promise.all([
      // 부서[0]
      commonSearchApi({
        queryId: 'searchDept3',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: newValue,
          USE_DIV: 'Y',
        },
      }),
    ]).then((res) => {
      codeList.ASGN = res[0].ORESULT_CUR // 부서

      codeList.ASGN.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

      if (newValue !== oldValue) {
        searchParams.ASGN_CD = ''
      }
    })
  }
)

/*/이벤트*****************************************************/

//초기 데이터셋팅
onMounted(() => {
  vm.$nextTick(() => {
    initCodeList()
  })
})
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
          <!-- 사업부 -->
          <i-select
            :label="$t('사업부')"
            label-width="60px"
            width="230px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
          />
          <!-- 부서 -->
          <i-select
            :label="$t('부서')"
            label-width="70px"
            width="300px"
            v-model="searchParams.ASGN_CD"
            :items="codeList.ASGN"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
          />
          <!-- 내외 여부 -->
          <i-select
            :label="$t('내/외부')"
            label-width="70px"
            width="300px"
            v-model="searchParams.IN_OUT"
            :items="InOutSearch"
            item-value="Code"
            item-title="Text"
          />
        </VForm>
        <!-- /조회조건 -->
        <!-- 메인그리드 -->
        <div class="d-flex flex-column">
          <IGridTitle
            ref="grdMainTitle"
            :title="$t('세부 심사일정')"
            :button-list="['btnUpdate', 'btnCompleteSAF']"
            @click-button="onButtonsClickMain"
          >
          <template #editors>※부적합 사항은 작성완료 버튼 클릭 시 해당 부서에 관련 내용 메일 발송</template>
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-0"
            style="height: 250px"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellButtonClicked="popupEmpOpen"
            @onCurrentRowChanged="onGrdMainCurrRowChanged"
            @onEditRowChanged="onEditRowChanged"
            @onCellItemClicked="popupEmpOpen"
          />
        </div>
        <!-- /메인그리드 -->
        <!-- 디테일그리드 -->
        <div class="d-flex flex-column mt-2">
          <IGridTitle :title="$t('부적합 목록')" />
          <VForm
            ref="searchArea"
            class="searchArea d-flex justify-space-between"
          >
            <div class="d-flex align-center">
              <i-select
                :label="$t('인증규격')"
                label-width="70px"
                width="330px"
                v-model="searchParams.CERT_ID"
                :items="codeList.CERT_CODE"
                item-value="COD"
                item-title="TXT"
              />
              <i-input
                :label="$t('조치기한')"
                v-model="searchParams.RECEIVE_DT"
                label-width="80px"
                type="Date"
                width="230px"
                margin="10px"
              />
              <IGridTitle
                ref="menuSubTitle1"
                class="mt-2"
                :button-list="['btnCollectiveApp']"
                @click-button="onButtonsClickSub"
              />
            </div>
            <div class="d-flex align-center">
              <IGridTitle
                ref="menuSubTitle2"
                class="mt-2"
                :button-list="['btnCreate', 'btnDelete', 'btnUpdate']"
                @click-button="onButtonsClickSub"
              />
            </div>
          </VForm>
          <RealGrid
            ref="grdSub"
            class="mt-2"
            style="height: 250px"
            :grid-view-option="grdSubProps.gridViewOption"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
          />
        </div>
      </div>
    </v-card-text>
    <!-- 팝업 -->
    <EmpPopup ref="empPopup" @selected="selectedEmpData" />
  </v-card>
</template>

<style lang="scss" scoped>
.realgrid-pre-wrap {
  white-space: pre-wrap !important;
}
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
