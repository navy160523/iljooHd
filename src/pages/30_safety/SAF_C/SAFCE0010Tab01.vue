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
import SAFCE0010Popup from './SAFCE0010Popup.vue'
import Message from '@hiway/utils/notify'
import saveFlowHelper from '@/utils/saveFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import causePopup from '@/components/popup/causePopup.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const menuTitle2 = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const userStore = useUserStore()
const tab = ref('점검항목등록')
const causepopup = ref(null)
const sAFCE0010Popup = ref(null)
const props = ref(true)
const codeList = reactive({
  useYn: [
    { TXT: 'Y', COD: 'Y' },
    { TXT: 'N', COD: 'N' },
  ],
})
//점검대상 조회 파라미터
const searchParam = {
  CMPNY_DIV: userStore.cmpnyDiv,
  CLSS_TITLE: '', //점검대상
  USE_YN: 'Y', //사용여부
}

const searchParam02 = {
  CMPNY_DIV: '',
  CLSS_SEQ: '', //점검대상 ID
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'CLSS_SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('점검대상ID') },
    },
    {
      fieldName: 'CLSS_TITLE',
      dataType: 'text',
      styleName: 'editable_column-left',
      header: { text: t('점검대상') },
    },
    {
      fieldName: 'USE_YN',
      dataType: 'text',
      width: '50',
      lookupDisplay: true,
      styleName: 'editable_column',
      editor: {
        type: 'dropdown',
        domainOnly: true, //dropdown에 있는 값들만 선택가능 옵션
      },
      header: { text: t('사용여부') },
    },
    {
      fieldName: 'USE_N_USER_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('사용N수정자') },
    },
    {
      fieldName: 'INSERT_USER_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('등록자') },
    },
    {
      fieldName: 'INSERT_DATE',
      dataType: 'text',
      visible: false,
      header: { text: t('등록일시') },
    },
    {
      fieldName: 'UPDATE_USER_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('수정자') },
    },
    {
      fieldName: 'UPDATE_DATE',
      dataType: 'text',
      visible: false,
      header: { text: t('수정일시') },
    },
  ],
  columns: [],
})

const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'CLSS_SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('점검대상ID') },
    },
    {
      fieldName: 'CHK_SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('점검항목ID') },
    },
    {
      fieldName: 'CHK_TITLE',
      dataType: 'text',
      width: '400',
      styleName: 'editable_column-left',
      header: { text: t('점검항목') },
    },
    {
      fieldName: 'CHK_RESULT',
      dataType: 'text',
      width: '40',
      styleName: 'editable_column-left',
      header: { text: t('점검결과') },
      visible: false,
    },
    {
      fieldName: 'REMARKS',
      dataType: 'text',
      styleName: 'editable_column-left',
      header: { text: t('비고') },
    },
    {
      fieldName: 'SRT_NO',
      dataType: 'text',
      width: '40',
      styleName: 'editable_column',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      header: { text: t('정렬순서') },
    },
    {
      fieldName: 'INSERT_USER_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('등록자') },
    },
    {
      fieldName: 'INSERT_DATE',
      dataType: 'text',
      visible: false,
      header: { text: t('등록일시') },
    },
    {
      fieldName: 'UPDATE_USER_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('수정자') },
    },
    {
      fieldName: 'UPDATE_DATE',
      dataType: 'text',
      visible: false,
      header: { text: t('수정일시') },
    },
    {
      fieldName: 'CHK_GBN',
      dataType: 'text',
      visible: false,
      header: { text: t('점검항목구분') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

//점검대상 버튼이벤트
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .run()
  } else if (btn.id === 'btnImport') {
    checkTargetImport()
  } else if (btn.id === 'btnCreate') {
    checkTargetAddRow()
  } else if (btn.id == 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave01)
      .setQuery(saveData01)
      .setAfter(afterSave01)
      .run()
  } else {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeDelete01)
      .setQuery(deleteData01)
      .setAfter(afterDelete01)
      .run()
  }
}

//점검항목 버튼 이벤트
const onButtonsClick2 = (btn) => {
  if (btn.id === 'btnImport') {
    checkListImport()
  } else if (btn.id === 'btnCreate') {
    checkListAddRow()
  } else if (btn.id == 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave02)
      .run()
  } else {
    new deleteFlowHelper(vm, t)
      .setGridList([grdSub])
      .setBefore(beforeDelete02)
      .setQuery(deleteData02)
      .setAfter(afterDelete02)
      .run()
  }
}

//점검대상 조회 관련 로직 시작
const searchData01 = () => {
  return commonSearchApi({
    queryId: 'SAFCE0010_SEARCH01',
    param: searchParam,
  })
}

const afterSearch01 = (res) => {
  if (res.ORESULT_CUR.length === 0) {
    grdSub.value.getDataProvider().setRows(null) //점검대상 조회값이 없을때 점검항목 그리드 비워주기
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//점검대상 조회 관련 로직 끝

//점검대상 불러오기 관련 로직 시작
const checkTargetImport = () => {
  causepopup.value.openPopup() //기인물 팝업 오픈
}
//점검대상 불러오기 관련 로직 끝

//점검대상 추가 관련 로직 시작
const checkTargetAddRow = () => {
  grdMain.value.getDataProvider().addRow({ USE_YN: 'Y' })
}
//점검대상 추가 관련 로직 끝

//점검대상 저장 관련 로직 시작
const beforeSave01 = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    if (!data.CLSS_TITLE) {
      Message.warn(t('점검대상은 필수입력 입니다.'))
      return false
    }
  }
  return true
}

const saveData01 = () => {
  let saveParam = []
  let checkedItem = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedItem.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedItem[i])
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
      CLSS_SEQ: data.CLSS_SEQ, //점검항목ID
      CLSS_TITLE: data.CLSS_TITLE, //점검대상
      USE_YN: data.USE_YN, //사용여부
      USER_ID: userStore.userId, //사용자 아이디
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFCE0010_SAVE01',
    list: saveParam,
  })
}

const afterSave01 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//점검대상 저장 관련 로직 끝

//점검대상 삭제 관련 로직 시작
const beforeDelete01 = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }

  return true
}

const deleteData01 = () => {
  let deleteParam = []
  let checkedItem = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedItem.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedItem[i])
    let deleteData = {
      CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
      CLSS_SEQ: data.CLSS_SEQ, //점검항목ID
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFCE0010_DELETE01',
    list: deleteParam,
  })
}

const afterDelete01 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//점검대상 삭제 관련 로직 끝

//점검항목 조회 관련 로직 시작

//점검대상 행 변경 이벤트
const onGrdMainCurrRowChanged = (grid, oldIndex, newIndex) => {
  if (newIndex === -1) {
    //처음에 데이터가 있다가 다른 조회조건으로 조회했을때 데이터가 없으면 rowIndex에러가 나서 조건추가
    return false
  }
  let newRow = grdMain.value.getDataProvider().getRowState(newIndex)
  //점검대상에 포커스된행이 신규행일때 점검항목 버튼 비활성화
  if (newRow === 'created') {
    menuTitle2.value.disableBtn('btnImport', true)
    menuTitle2.value.disableBtn('btnCreate', true)
    menuTitle2.value.disableBtn('btnUpdate', true)
    menuTitle2.value.disableBtn('btnDelete', true)
  }
  //점검대상의 행이 신규행이 아닐때 점검항목 조회
  else {
    menuTitle2.value.disableBtn('btnImport', false)
    menuTitle2.value.disableBtn('btnCreate', false)
    menuTitle2.value.disableBtn('btnUpdate', false)
    menuTitle2.value.disableBtn('btnDelete', false)
    let row = grdMain.value.getDataProvider().getJsonRow(newIndex)
    searchParam02.CMPNY_DIV = row.CMPNY_DIV
    searchParam02.CLSS_SEQ = row.CLSS_SEQ
    new queryFlowHelper(vm, t)
      .setGridList([grdSub])
      .setQuery(searchData02)
      .setAfter(afterSearch02)
      .run()
  }
}

const searchData02 = () => {
  return commonSearchApi({
    queryId: 'SAFCE0010_SEARCH02',
    param: searchParam02,
  })
}

const afterSearch02 = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//점검항목 조회 관련 로직 끝

//점검항목 불러오기 관련 로직 시작
const checkListImport = () => {
  sAFCE0010Popup.value.openPopup()
}
//점검항목 불러오기 관련 로직 끝

//점검항목 추가 관련 로직 시작
const checkListAddRow = () => {
  grdSub.value.getDataProvider().addRow({})
}
//점검항목 추가 관련 로직 끝

//점검항목 저장 관련 로직 시작
const beforeSave02 = () => {
  let chkNum = grdSub.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))
    return false
  }

  for (let i = 0; i < chkNum.length; i++) {
    let data = grdSub.value.getDataProvider().getJsonRow(chkNum[i])
    if (!data.CHK_TITLE) {
      Message.warn(t('점검항목은 필수입력 입니다.'))
      return false
    }
  }

  return true
}

const saveData02 = () => {
  let saveParam = []
  let checkedItem = grdSub.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedItem.length; i++) {
    let data = grdSub.value.getDataProvider().getJsonRow(checkedItem[i])
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
      CLSS_SEQ: searchParam02.CLSS_SEQ, //점검대상ID
      CHK_SEQ: data.CHK_SEQ, //점검항목ID
      CHK_TITLE: data.CHK_TITLE, //점검항목
      CHK_RESULT: data.CHK_RESULT, //점검결과
      REMARKS: data.REMARKS, //비고
      SRT_NO: data.SRT_NO, //정렬순서
      CHK_GBN: data.CHK_GBN, //점검항목구분
      USER_ID: userStore.userId, //유저아이디
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFCE0010_SAVE02',
    list: saveParam,
  })
}

const afterSave02 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//점검항목 저장 관련 로직 끝

//점검항목 삭제 관련 로직 시작
const beforeDelete02 = () => {
  let chkNum = grdSub.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }

  return true
}

const deleteData02 = () => {
  let deleteParam = []
  let checkedItem = grdSub.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedItem.length; i++) {
    let data = grdSub.value.getDataProvider().getJsonRow(checkedItem[i])
    let deleteData = {
      CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
      CLSS_SEQ: data.CLSS_SEQ, //점검대상ID
      CHK_SEQ: data.CHK_SEQ, //점검항목ID
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFCE0010_DELETE02',
    list: deleteParam,
  })
}

const afterDelete02 = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//점검항목 삭제 관련 로직 끝

//점검항목 불러오기 팝업 emit 이벤트 로직 시작
const daeCheckSelected = (val) => {
  let rowCount = grdSub.value.getGridView().getItemCount()
  let CHK_TITLE = []
  let daeCheckdata = []
  for (let i = 0; i < rowCount; i++) {
    if (!grdSub.value.getDataProvider().getJsonRow(i).CHK_TITLE) {
      continue
    }
    CHK_TITLE.push(
      grdSub.value.getDataProvider().getJsonRow(i).CHK_TITLE.replaceAll(' ', '')
    ) //점검항목에 입력된 모든값을 공백제거함
  }
  for (let i = 0; i < val.length; i++) {
    daeCheckdata.push(val[i].DAECHEK.replaceAll(' ', ''))
  }

  let addData = daeCheckdata.filter((value) => !CHK_TITLE.includes(value))
  Message.warn(t('중복된 점검항목을 제외하고 추가되었습니다.'))
  for (let i = 0; i < addData.length; i++) {
    grdSub.value
      .getDataProvider()
      .addRow({ CHK_TITLE: addData[i], CHK_GBN: 'R' })
  }
  let addRowCount = grdSub.value.getGridView().getItemCount() //추가된후 행개수
  let check = addRowCount - rowCount //기존행개수 - 추가된후 행개수
  for (let i = 0; i < check; i++) {
    //새로 추가된 행들 체크
    grdSub.value.getGridView().checkItem(rowCount + i)
  }
}

const ptwSelected = (val) => {
  let rowCount = grdSub.value.getGridView().getItemCount()
  let CHK_TITLE = []
  let daeCheckdata = []
  for (let i = 0; i < rowCount; i++) {
    if (!grdSub.value.getDataProvider().getJsonRow(i).CHK_TITLE) {
      continue
    }
    CHK_TITLE.push(
      grdSub.value.getDataProvider().getJsonRow(i).CHK_TITLE.replaceAll(' ', '')
    ) //점검항목에 입력된 모든값을 공백제거함
  }
  for (let i = 0; i < val.length; i++) {
    daeCheckdata.push(val[i].CHECK_DESC.replaceAll(' ', ''))
  }

  let addData = daeCheckdata.filter((value) => !CHK_TITLE.includes(value))
  Message.warn(t('중복된 점검항목을 제외하고 추가되었습니다.'))
  for (let i = 0; i < addData.length; i++) {
    grdSub.value
      .getDataProvider()
      .addRow({ CHK_TITLE: addData[i], CHK_GBN: 'P' })
  }
  let addRowCount = grdSub.value.getGridView().getItemCount() //추가된후 행개수
  let check = addRowCount - rowCount //기존행개수 - 추가된후 행개수
  for (let i = 0; i < check; i++) {
    //새로 추가된 행들 체크
    grdSub.value.getGridView().checkItem(rowCount + i)
  }
}

//점검항목 불러오기 팝업 emit 이벤트 로직 끝

//점검대상 셀변경 이벤트 관련 로직 시작
const onGrdMainCellEdited = (grid, itemIndex, row, field) => {
  let fieldName = grdMain.value.getGridView().getColumn(field).name //변경된 컬럼이름 가져오기
  if (fieldName === 'CLSS_TITLE') {
    let rowCount = grdMain.value.getGridView().getItemCount() //행개수 가져오기
    let CLSS_TITLE = []
    for (let i = 0; i < rowCount; i++) {
      if(grdMain.value.getDataProvider().getJsonRow(i).CLSS_TITLE !== undefined) {
        CLSS_TITLE.push(
          grdMain.value
            .getDataProvider()
            .getJsonRow(i)
            .CLSS_TITLE.replaceAll(' ', '')
        ) //점검대상에 입력된 모든값을 공백제거함
      }
    }
    let filteredData = new Set(CLSS_TITLE) //중복값을 Set함수로 제거
    if (CLSS_TITLE.length != filteredData.size) {
      //set에서 반환된값(중복이 제거된값)과 CLSS_TITLE(입력값)의 길이가 일치하지 않으면 중복값이 존재하는것
      Message.warn(t('점검대상은 중복될 수 없습니다.'))
      grdMain.value.getDataProvider().setValue(itemIndex, 'CLSS_TITLE', '') //입력한 행의 값을 지움
      return false
    }
  }
}
//점검대상 셀변경 이벤트 관련 로직 끝

//점검항목 셀변경 이벤트 관련 로직 시작
const onGrdSubCellEdited = (grid, itemIndex, row, field) => {
  let fieldName = grdSub.value.getGridView().getColumn(field).name //변경된 컬럼이름 가져오기
  if (fieldName === 'CHK_TITLE') {
    let rowCount = grdSub.value.getGridView().getItemCount() //행개수 가져오기
    let CHK_TITLE = []
    for (let i = 0; i < rowCount; i++) {
      if(grdSub.value.getDataProvider().getJsonRow(i).CHK_TITLE !== undefined) {
        CHK_TITLE.push(
          grdSub.value
            .getDataProvider()
            .getJsonRow(i)
            .CHK_TITLE.replaceAll(' ', '')
        ) //점검항목에 입력된 모든값을 공백제거함
      }
    }
    let filteredData = new Set(CHK_TITLE) //중복값을 Set함수로 제거
    if (CHK_TITLE.length != filteredData.size) {
      //set에서 반환된값(중복이 제거된값)과 CHK_TITLE(입력값)의 길이가 일치하지 않으면 중복값이 존재하는것
      Message.warn(t('점검항목은 중복될 수 없습니다.'))
      grdSub.value.getDataProvider().setValue(itemIndex, 'CHK_TITLE', '') //입력한 행의 값을 지움
      return false
    }
  }
}

//점검항목 셀변경 이벤트 관련 로직 끝

//점검대상 불러오기 팝업(기인물선택 팝업) 선택 이벤트 관련 로직 시작
const selectedData = (val) => {
  let rowCount = grdMain.value.getGridView().getItemCount()
  let CLSS_TITLE = []
  let giIndata = []
  for (let i = 0; i < rowCount; i++) {
    if (!grdMain.value.getDataProvider().getJsonRow(i).CLSS_TITLE) {
      continue
    }
    CLSS_TITLE.push(
      grdMain.value
        .getDataProvider()
        .getJsonRow(i)
        .CLSS_TITLE.replaceAll(' ', '')
    ) //점검항목에 입력된 모든값을 공백제거함
  }
  for (let i = 0; i < val.length; i++) {
    giIndata.push(val[i].TXT.replaceAll(' ', ''))
  }

  let addData = giIndata.filter((value) => !CLSS_TITLE.includes(value))
  Message.warn(t('중복된 점검대상을 제외하고 추가되었습니다.'))
  for (let i = 0; i < addData.length; i++) {
    grdMain.value
      .getDataProvider()
      .addRow({ CLSS_TITLE: addData[i], USE_YN: 'Y' })
  }
  let addRowCount = grdMain.value.getGridView().getItemCount() //추가된후 행개수
  let check = addRowCount - rowCount //기존행개수 - 추가된후 행개수
  for (let i = 0; i < check; i++) {
    //새로 추가된 행들 체크
    grdMain.value.getGridView().checkItem(rowCount + i)
  }
}

const selectedSingleRow = (val) => {
  let rowCount = grdMain.value.getGridView().getItemCount()
  let CLSS_TITLE = []
  let giIndata = []
  for (let i = 0; i < rowCount; i++) {
    if (!grdMain.value.getDataProvider().getJsonRow(i).CLSS_TITLE) {
      continue
    }
    CLSS_TITLE.push(
      grdMain.value
        .getDataProvider()
        .getJsonRow(i)
        .CLSS_TITLE.replaceAll(' ', '')
    ) //점검항목에 입력된 모든값을 공백제거함
  }
  giIndata.push(val[2].TXT.replaceAll(' ', ''))
  let addData = giIndata.filter((value) => !CLSS_TITLE.includes(value))
  Message.warn(t('중복된 점검대상을 제외하고 추가되었습니다.'))
  for (let i = 0; i < addData.length; i++) {
    grdMain.value
      .getDataProvider()
      .addRow({ CLSS_TITLE: addData[i], USE_YN: 'Y' })
  }
  let addRowCount = grdMain.value.getGridView().getItemCount() //추가된후 행개수
  let check = addRowCount - rowCount //기존행개수 - 추가된후 행개수
  for (let i = 0; i < check; i++) {
    //새로 추가된 행들 체크
    grdMain.value.getGridView().checkItem(rowCount + i)
  }
}
//점검대상 불러오기 팝업(기인물선택 팝업) 선택 이벤트 관련 로직 끝

onMounted(() => {
  grdMain.value.setBindingColumn('USE_YN', codeList.useYn, 'COD', 'TXT')
  onButtonsClick({ id: 'btnSearch' })
})

defineExpose({
  onButtonsClick,
})
</script>

<template>
  <v-card>
    <v-sheet class="searchArea d-flex">
      <i-input
        v-model="searchParam.CLSS_TITLE"
        :label="$t('점검대상')"
        width="200px"
      >
      </i-input>
      <i-select
        v-model="searchParam.USE_YN"
        :label="$t('사용여부')"
        :items="codeList.useYn"
        item-title="TXT"
        item-value="COD"
        width="200px"
      ></i-select>
    </v-sheet>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="h-grow">
        <v-sheet width="25%" class="pa-0 mr-3 h-auto">
          <IGridTitle
            :title="$t('점검대상')"
            :button-list="['btnImport', 'btnCreate', 'btnUpdate', 'btnDelete']"
            @click-button="onButtonsClick"
          />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCurrentRowChanged="onGrdMainCurrRowChanged"
            @onCellEdited="onGrdMainCellEdited"
          >
          </RealGrid>
        </v-sheet>
        <v-sheet width="75%" class="pa-0 h-auto">
          <IGridTitle
            :button-list="['btnImport', 'btnCreate', 'btnUpdate', 'btnDelete']"
            :title="$t('점검항목')"
            ref="menuTitle2"
            @click-button="onButtonsClick2"
          >
          </IGridTitle>
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps.gridViewOption"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            @onCellEdited="onGrdSubCellEdited"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <causePopup
    :check-bar="props"
    ref="causepopup"
    @selectedData="selectedData"
    @selectedArr="selectedSingleRow"
  ></causePopup>
  <SAFCE0010Popup
    ref="sAFCE0010Popup"
    @checkListSelected="daeCheckSelected"
    @ptwListSelected="ptwSelected"
  ></SAFCE0010Popup>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 131px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
