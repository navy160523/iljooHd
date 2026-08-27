<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { commonExecuteApi, commonSearchApi } from '@/@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import SAFAG0050Popup from './SAFAG0050Popup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import OZReport from '@/components/OZReport.vue'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
defineOptions({
  name: '30_safety-SAF_A-SAFAG0050',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)
const fileUploadPopup = ref(null)
const sAFAG0050Popup = ref(null)
const isVisibled = ref(false)
const reportName = ref('/manage/hse/SAFAG0050.ozr')

// OzReport 팝업 여부
const showOz = ref(false)

const searchParam = reactive({
  CMPNY_DIV: '', //회사
  STATUS: '', //상태
  DATE_YN: 'N', //조회기간 체크박스
  FROM: '', //기간 FROM
  TO: '', //기간 TO
  EMP_NO: '', //산재자번호
  NAME: '', //산재자 이름
  USER_ID: userStore.userId, //유저아이디
  IP_ADDRESS: userStore.clientIp, //유저아이피
})

const reportParam = reactive([
  'IN_CMPNY_DIV=',
  'IN_EMP_NO=',
  'IN_NAME=',
  'IN_SANNO=',
  'IN_INPUTDTE=',
])

const codeList = reactive({
  company: [], //회사
  status: [
    //상태
    { TXT: '전체', COD: '' },
    { TXT: '접수', COD: 'A' },
    { TXT: '완료', COD: 'C' },
  ],
  statusInGrid: [
    { TXT: '접수', COD: 'A' },
    { TXT: '완료', COD: 'C' },
  ],
  hldoffigbn: [
    { TXT: '재직', COD: '1' },
    { TXT: '재직', COD: '2' },
    { TXT: '퇴직', COD: '3' },
    { TXT: '재직', COD: '4' },
  ], //재직구분
  yogbn: [], //요양구분
  sagotype: [], //사고형태
})

const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -1달 ~ TO : 오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(1, 'month')
  searchParam.FROM =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIZ000',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //요양구분조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250020',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //사고형태조회
      queryId: 'SAFAG0050_POP_SEARCH02',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }),
  ]).then((res) => {
    //현대중공업,한국조선해양,모스
    codeList.company = res[0].ORESULT_CUR.filter(
      (x) => x.COD === 'HHI' || x.COD === '100' || x.COD === '230'
    )
    // if (userStore.cmpnyDiv === 'HHI' || userStore.company === '100') {
    //   codeList.company = res[0].ORESULT_CUR.slice(0, 2)
    // } else {
    //   codeList.company = res[0].ORESULT_CUR.slice(0, 1)
    // }
    codeList.company.unshift({ TXT: '전체', COD: '' })
    codeList.yogbn = res[1].ORESULT_CUR
    codeList.sagotype = res[2].ORESULT_CUR
    grdMain.value.setBindingColumn('YOGBN', codeList.yogbn, 'COD', 'TXT')

    grdMain.value.setBindingColumn(
      'SAGOTYPE_NM2',
      codeList.sagotype,
      'COD',
      'TXT'
    )
    grdMain.value.setBindingColumn(
      'STATUS',
      codeList.statusInGrid,
      'COD',
      'TXT'
    )
    grdMain.value.setBindingColumn(
      'HLD_OFFI_GBN',
      codeList.hldoffigbn,
      'COD',
      'TXT'
    )
    console.log('코드리스트', codeList)
  })
}

const openEmpPopup = (gbn) => {
  empPopup.value.openPopup({
    CMPNY_DIV: searchParam.CMPNY_DIV == '' ? 'HHI' : searchParam.CMPNY_DIV,
    EMP_NM: searchParam.NAME,
    DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    SANJE: true,
  })
}

const onEmpSelected = (val) => {
  searchParam.NAME = val.EMP_NM
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'STATUS',
      dataType: 'text',
      lookupDisplay: true,
      styleName: 'editable_column',
      width: '60',
      editor: {
        type: 'dropdown',
      },
      header: { text: t('진행상태') },
    },
    {
      fieldName: 'INPUTDTE',
      dataType: 'text',
      styleName: 'editable_column',
      datetimeFormat: 'yyyy-MM-dd',
      width: '110',
      header: { text: t('접수일') },
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
    },
    {
      fieldName: 'FILENUM',
      dataType: 'text',
      editable: false,
      width: '60',
      header: { text: t('파일번호') },
    },
    {
      fieldName: 'HLD_OFFI_GBN',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      width: '60',
      editor: {
        type: 'dropdown',
      },
      header: { text: t('재직구분') },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '70',
      editable: false,
      styleName: 'left-column',
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      width: '80',
      header: { text: t('부서') },
    },
    {
      fieldName: 'EMPLNO',
      dataType: 'text',
      editable: false,
      width: '60',
      header: { text: t('사번') },
    },
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      editable: false,
      width: '60',
      header: { text: t('성명') },
    },
    {
      fieldName: 'BIRTH_DAY',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      width: '80',
      header: { text: t('생년월일') },
    },
    {
      fieldName: 'OCCURDATE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      width: '90',
      header: { text: t('재해일') },
    },
    {
      fieldName: 'FINISHDTE',
      dataType: 'text',
      styleName: 'editable_column',
      datetimeFormat: 'yyyy-MM-dd',
      width: '70',
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
      header: { text: t('완료일') },
    },
    {
      fieldName: 'ADESC',
      dataType: 'text',
      styleName: 'editable_column-left',
      width: '100',
      header: { text: t('진료비내용') },
    },
    {
      fieldName: 'AMT',
      dataType: 'number',
      styleName: 'editable_column-right',
      footer: { numberFormat: '#,###', expression: 'sum' },
      header: { text: t('금액') },
      width: '60',
      numberFormat: '#,###',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
        maxLength: 10,
      },
    },
    {
      fieldName: 'HOSPITAL',
      dataType: 'text',
      styleName: 'editable_column-left',
      header: { text: t('병원') },
      width: '60',
    },
    {
      fieldName: 'BANK',
      dataType: 'text',
      styleName: 'editable_column-left',
      header: { text: t('은행') },
      width: '60',
    },
    {
      fieldName: 'FILE_ID',
      dataType: 'text',
      styleName: 'editable_column',
      isFile: { value: true, showAlways: true },
      header: { text: t('유첨') },
      width: '60',
    },
    {
      fieldName: 'TELNO1',
      dataType: 'text',
      width: '130',
      editable: false,
      width: '80',
      header: { text: t('연락처') },
    },
    {
      fieldName: 'YOGBN',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      width: '80',
      styleName: 'left-column',
      editor: {
        type: 'dropdown',
      },
      header: { text: t('요양구분') },
    },
    {
      fieldName: 'SAGOTYPE_NM2',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      styleName: 'left-column',
      width: '80',
      editor: {
        type: 'dropdown',
      },
      header: { text: t('사고형태') },
    },
    {
      fieldName: 'OKDTE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      width: '100',
      header: { text: t('승인일자') },
    },
    {
      fieldName: 'FROMDTE2',
      dataType: 'text',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      width: '100',
      header: { text: t('요양시작일') },
    },
    {
      fieldName: 'ENDDTE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      width: '100',
      header: { text: t('종결일자') },
    },
    {
      fieldName: 'SANGBYUNG',
      dataType: 'text',
      styleName: 'left-column',
      width: '90',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('상병명') },
    },
    {
      fieldName: 'SAGOGAEYO',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      width: '90',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('사고개요') },
    },
    {
      fieldName: 'BIGO',
      dataType: 'text',
      styleName: 'editable_column-left',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('비고') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SANNO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SERNO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGONO',
      dataType: 'text',
      editable: false,
      visible: false,
      styleName: 'left-column',
      header: { text: t('사고번호') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  defaultDate()
  //기본값 세팅
  searchParam.CMPNY_DIV = ''
  vm.$nextTick(() => {
    grdMain.value.getGridView().footer.visible = true
  })
  //2024.06.27 김민선사원 요청으로 화면 마운트시 자동조회 안하도록 설정
  //onButtonsClick({ id: 'btnSearch' })
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnCreate') {
    sAFAG0050Popup.value.openPopup()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else {
    ozPrint()
  }
}
//조회관련 로직시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFAG0050_SEARCH01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}
//조회관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}
const deleteData = async () => {
  let deleteParam = []
  let chkNum = await grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < chkNum.length; i++) {
    let data = await grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    let state = await grdMain.value.getDataProvider().getRowState(chkNum[i])

    /* 기존 저장 되어 있는 행만 리스트 push후  DB삭제 신규 추가 행은 바로 삭제 */
    if (state !== 'created') {
      let deleteData = {
        CMPNY_DIV: data.CMPNY_DIV,
        SANNO: data.SANNO,
        SERNO: data.SERNO,
      }
      deleteParam.push(deleteData)
    }
  }

  /* realgrid 기본 설정이 softDeleting: true로 되어 있기 때문에 
     removeRows시 상태값만 변경되어 실제 삭제 되지 않아 softDeleting: false 변경후 로우 삭제 진행 */
  grdMain.value.getDataProvider().setOptions({ softDeleting: false })
  /* ********* 체크된 로우 삭제 ********* */
  grdMain.value.getDataProvider().removeRows(chkNum)

  return commonExecuteApi({
    queryId: 'SAFAG0050_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  //2024.06.30 김민선사원 요청으로 저장또는 삭제시 재조회 하지 않도록 변경
  //onButtonsClick({ id: 'btnSearch' })
  let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '개인정보관련 삭제했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}
//삭제관련 로직 끝

//저장관련 로직 시작

const beforeSave = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV, //넣기
      STATUS: 'A', //진행상태 접수
      SANNO: data.SANNO, //넣기
      SERNO: data.SERNO, //넣기
      INPUTDTE: data.INPUTDTE,
      AMT: data.AMT,
      FILE_ID: data.FILE_ID,
      ADESC: data.ADESC,
      HOSPITAL: data.HOSPITAL,
      BIGO: data.BIGO,
      STATUS: data.STATUS,
      FINISHDTE: data.FINISHDTE,
      BANK: data.BANK,
      USER_ID: userStore.cmpnyDiv,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFAG0050_SAVE01',
    list: saveParam,
  })
}

const afterSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < checkedData.length; i++) {
    grdMain.value.getDataProvider().setRowState(checkedData[i], 'none')
  }
  grdMain.value.getGridView().checkAll(false)
  //2024.06.25 김민선 사원 요청으로 저장후 재조회 하지 않도록 수정
  // onButtonsClick({ id: 'btnSearch' })
  let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '개인정보관련 저장했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}
//저장관련 로직 끝

//출력관련 로직 시작
const ozPrint = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('출력할 데이터를 선택해주세요.'))
    return false
  }

  reportParam[0] = 'IN_CMPNY_DIV='
  reportParam[1] = 'IN_EMP_NO='
  reportParam[2] = 'IN_NAME='
  reportParam[3] = 'IN_SANNO='
  reportParam[4] = 'IN_INPUTDTE='
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    reportParam[0] += data.CMPNY_DIV + ','
    reportParam[1] += data.EMPLNO + ','
    reportParam[2] += data.KOR_NM + ','
    reportParam[3] += data.SANNO + ','
    reportParam[4] += data.INPUTDTE.replaceAll('-', '') + ','
    if (i == chkNum.length - 1) {
      reportParam[0] += data.CMPNY_DIV
      reportParam[1] += data.EMPLNO
      reportParam[2] += data.KOR_NM
      reportParam[3] += data.SANNO
      reportParam[4] += data.INPUTDTE.replaceAll('-', '')
    }
  }
  showOz.value = true
}
//출력관련 로직 끝

//파일첨부 관련 로직 시작
const onCellButtonClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  //파일아이디 없을때 파일아이디 저장
  if (data.FILE_ID === null) {
    fileUploadPopup.value.setGuid()
    let fileID = fileUploadPopup.value.guid
    grdMain.value.getDataProvider().setValue(col.dataRow, 'FILE_ID', fileID)
    grdMain.value.getGridView().checkItem(col.dataRow, true)
    fileUploadPopup.value.openPopup(fileID)
  } else {
    fileUploadPopup.value.openPopup(data.FILE_ID)
  }
}
//파일첨부 관련 로직 끝

const addData = (data) => {
  let date = dayjs()
  for (let i = 0; i < data.length; i++) {
    let addRowData = {
      CMPNY_DIV: data[i].CMPNY_DIV,
      STATUS: 'A',
      INPUTDTE:
        date.get('year') +
        '-' +
        (date.get('month') + 1).toString().padStart(2, '0') +
        '-' +
        date.get('date').toString().padStart(2, '0'),
      DEPT_NM: data[i].DEPT_NM,
      FILENUM: data[i].FILENUM,
      KOR_NM: data[i].KOR_NM,
      SANNO: data[i].SANNO,
      EMPLNO: data[i].EMPLNO,
      BSNS_NM: data[i].BSNS_NM,
      SAGONO: data[i].SAGONO,
      BIRTH_DAY: data[i].BIRTH_DAY,
      OCCURDATE: data[i].OCCURDATE,
      TELNO1: data[i].TELNO1,
      YOGBN: data[i].YOGBN,
      SAGOTYPE_NM2: data[i].SAGOTYPE,
      OKDTE: data[i].OKDTE,
      ENDDTE: data[i].ENDDTE,
      SANGBYUNG: data[i].SANGBYUNG,
      SAGOGAEYO: data[i].SAGOGAEYO,
      HLD_OFFI_GBN: data[i].HLD_OFFI_GBN,
    }
    grdMain.value.addRow(addRowData)
  }
}

//진행상태가 '완료'로 변경시 완료일에 오늘날짜 넣음
const onCellEdited = (grid, itemIndex, row, field) => {
  let fileName = grdMain.value.getGridView().getColumn(field)
  if (fileName.name === 'STATUS') {
    let data = grdMain.value.getDataProvider().getJsonRow(itemIndex)
    if (data.STATUS === 'C') {
      //진행상태 완료의 코드값은 C
      //진행상태가 완료로 변경되면
      let date = dayjs()
      let toDay =
        date.get('year') +
        '-' +
        (date.get('month') + 1).toString().padStart(2, '0') +
        '-' +
        date.get('date').toString().padStart(2, '0')
      grdMain.value.getDataProvider().setValue(row, 'FINISHDTE', toDay) //완료일을 오늘날짜로 설정
    }
  }
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
          'btnCreate',
          'btnUpdate',
          'btnDelete',
          'btnPrint',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('회사')"
            v-model="searchParam.CMPNY_DIV"
            :items="codeList.company"
            item-title="TXT"
            item-value="COD"
            width="200px"
          >
          </i-select>
          <i-select
            :label="$t('진행상태')"
            v-model="searchParam.STATUS"
            :items="codeList.status"
            item-title="TXT"
            item-value="COD"
            width="200px"
          >
          </i-select>
          <span class="mt-2">조회기간</span>
          <v-checkbox
            class="mt-1 ml-2"
            v-model="searchParam.DATE_YN"
            true-value="Y"
            false-value="N"
          ></v-checkbox>
          <i-input
            class="mr-1"
            v-model="searchParam.FROM"
            type="date"
            width="170px"
          ></i-input>
          <span class="mt-2 mr-1">~</span>
          <i-input v-model="searchParam.TO" type="date" width="170px"></i-input>
          <i-input
            :label="$t('산재자')"
            v-model="searchParam.NAME"
            @click:appendInner="openEmpPopup()"
            @keydown.enter="
              (e) => {
                openEmpPopup('인원조회')
              }
            "
            append-inner-icon="mdi-magnify"
            width="200px"
          >
          </i-input>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellItemClicked="onCellButtonClicked"
            @onCellEdited="onCellEdited"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="onEmpSelected" />

  <!-- 파일업로드팝업 -->
  <IUploadPopup ref="fileUploadPopup"></IUploadPopup>
  <!-- 추가팝업 -->
  <SAFAG0050Popup ref="sAFAG0050Popup" @selected="addData"></SAFAG0050Popup>
  <!-- 레포트 -->
  <OZReport
    :showPop="showOz"
    :reportName="reportName"
    :params="reportParam"
    @close="showOz = $event"
  />
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
