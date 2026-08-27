<script setup>
import { ref, reactive, onMounted, getCurrentInstance, onUpdated } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import Message from '@hiway/utils/notify'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
import SAFAG0060Popup from './SAFAG0060Popup.vue'
import SAFAG0060PopupApproval from './SAFAG0060PopupApproval.vue'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import OZReport from '@/components/OZReport.vue'
import consolationPrizeCalc from '@/utils/sanJeGradeCalc'

defineOptions({
  name: '30_safety-SAF_A-SAFAG0060',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const empPopup = ref(null)
const sAFAG0060Popup = ref(null)
const fileUploadPopup = ref(null)
const sAFAG0060PopupApproval = ref(null)
const reportName = ref('/manage/hse/SAFAG0060_01.ozr')
const rowData = ref(null) //셀 클릭을 할때마다 합의상태를 저장하고 있는 변수
// OzReport 팝업 여부
const showOz = ref(false)
const reportParam = reactive(['IN_EMP_NO=', 'IN_NAME='])
const codeList = reactive({
  company: [],      //회사
  searchdate: [],   //조회기간
  dateGbn: [],      //합의상태
  status: [],       //합의상태
  grdstatus: [],    //그리드내부 합의상태
  grade: [],        //장해등급
  injurypart: [],   //상해부위
})

const searchParam = reactive({
  CMPNY_DIV: '',    // 회사
  DATE_YN: 'N',     // 조회기간YN
  DATE_GBN: 'A',    // 조회기간 구분
  FROM: '',         // 조회기간 FROM
  TO: '',           // 조회기간 TO
  STATUS: '',       // 합의상태
  EMP_NO: '',       // 산재자 사번
  NAME: '',         // 산재자 성명
  USER_ID: userStore.cmpnyDiv,
  IP_ADDRESS: userStore.IP_ADDRESS,
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
      //회사조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIZ000',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //조회기간 조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250090',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //조회기간 합의상태 조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250080',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //그리드 내부합의상태 조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250080',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //장해등급 조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250040',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //상해부위
      queryId: 'SAFAG0020_SEARCH02',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR.filter(
      (x) => x.COD === 'HHI' || x.COD === '100' || x.COD === '230'
    )
    codeList.searchdate = res[1].ORESULT_CUR
    codeList.status = res[2].ORESULT_CUR
    codeList.grdstatus = res[3].ORESULT_CUR
    codeList.grade = res[4].ORESULT_CUR
    codeList.injurypart = res[5].ORESULT_CUR
    codeList.company.unshift({ TXT: '전체', COD: '' })
    // codeList.searchdate.unshift({ TXT: '전체', COD: '' })
    codeList.status.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn(
      'HAP_STATUS',
      codeList.grdstatus,
      'COD',
      'TXT'
    )
    grdMain.value.setBindingColumn('GRADE', codeList.grade, 'COD', 'TXT')
    grdMain.value.setBindingColumn(
      'INJURYPART',
      codeList.injurypart,
      'COD',
      'TXT'
    )

    searchParam.STATUS = 'A'

    onButtonsClick({ id: "btnSearch" })
  })
}

const grdMainProps = reactive({
  gridViewOption: { 
    checkBar: { visible: true },
    footers: {
      visible: true,
      items:[
        {},
        { height: 30,styleName:"text-primary" },
      ],
    },
 },
  fields: [
    {
      fieldName: 'RECEIPTDTE',
      styleName: 'editable_column',
      dataType: 'text',
      width: '110',
      datetimeFormat: 'yyyy-MM-dd',
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
      header: { text: t('접수일자') },
    },
    {
      fieldName: 'HAP_STATUS',
      styleName: 'editable_column',
      dataType: 'text',
      width: '50',
      lookupDisplay: true,
      required: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('합의상태') },
    },
    {
      fieldName: 'HAPPLANDTE',
      styleName: 'editable_column',
      dataType: 'text',
      width: '110',
      datetimeFormat: 'yyyy-MM-dd',
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
      header: { text: t('합의예정일') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "count",
        },
      ],
    },
    {
      fieldName: 'FILE_ID',
      styleName: 'editable_column',
      dataType: 'text',
      editable: false,
      width: '50',
      isFile: { value: true, showAlways: true },
      header: { text: t('유첨') },
      footers:[
        {},
        {
          text:" 건",
          visible:"true",
          align:"center",
        }
      ],
    },
    {
      fieldName: 'GRADE',
      styleName: 'editable_column',
      dataType: 'text',
      width: '65',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('등급') },
      footers:[
        {},
        {
          text:"위로금 계 : ",
          visible:"true",
          align:"center",
        }
      ],
    },
    {
      fieldName: 'HAPAMT',
      styleName: 'editable_column-right',
      dataType: 'number',
      numberFormat: '#,##0.###',
      width: '80',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
        maxLength: 10,
      },
      header: { text: t('위로금(천원)') },
      footers:[
        {},
        {
          numberFormat: "#,###.##",
          expression: "sum",
        },
      ],
    },
    {
      fieldName: 'FILENUM',
      editable: false,
      dataType: 'text',
      width: '50',
      header: { text: t('파일번호') },
      footers:[
        {},
        {
          text:"(천원)",
          visible:"true",
          align:"center",
        }
      ],
    },
    {
      fieldName: 'HLD_OFFI_GBNNM',
      editable: false,
      dataType: 'text',
      width: '50',
      header: { text: t('재직여부') },
    },
    {
      fieldName: 'BSNS_NM',
      editable: false,
      dataType: 'text',
      width: '60',
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_NM',
      editable: false,
      dataType: 'text',
      width: '70',
      header: { text: t('부서') },
    },
    {
      fieldName: 'EMPLNO',
      editable: false,
      dataType: 'text',
      width: '70',
      header: { text: t('사번') },
    },
    {
      fieldName: 'KOR_NM',
      editable: false,
      dataType: 'text',
      width: '60',
      header: { text: t('성명') },
    },
    {
      fieldName: 'REG_NO',
      editable: false,
      width: '80',
      dataType: 'text',
      header: { text: t('주민번호') },
    },
    {
      fieldName: 'OCCURDATE',
      editable: false,
      dataType: 'text',
      width: '90',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('재해일자') },
    },
    {
      fieldName: 'ENDDTE',
      editable: false,
      dataType: 'datetime',
      width: '90',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('요양종료일') },
    },
    {
      fieldName: 'INJURYPART',
      editable: false,
      dataType: 'text',
      lookupDisplay: true,
      width: '90',
      editor: {
        type: 'dropdown',
      },
      header: { text: t('상해부위') },
    },
    {
      fieldName: 'SANGBYUNG',
      editable: false,
      dataType: 'text',
      width: '90',
      header: { text: t('상병명') },
    },
    {
      fieldName: 'BANK',
      styleName: 'editable_column',
      dataType: 'text',
      width: '60',
      header: { text: t('거래은행') },
    },
    {
      fieldName: 'TELNO1',
      styleName: 'editable_column',
      width: '90',
      dataType: 'text',
      header: { text: t('연락처') },
    },
    {
      fieldName: 'DOCUMENT',
      styleName: 'editable_column',
      dataType: 'text',
      width: '70',
      header: { text: t('구비서류') },
    },
    {
      fieldName: 'HAPDTE',
      styleName: 'editable_column',
      dataType: 'text',
      datetimeFormat: 'yyyy-MM-dd',
      width: '110',
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
      header: { text: t('합의일자') },
    },
    {
      fieldName: 'RATINGDTE',
      styleName: 'editable_column',
      dataType: 'text',
      datetimeFormat: 'yyyy-MM-dd',
      width: '110',
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
      header: { text: t('등급판정일') },
    },
    {
      fieldName: 'INGAMDTE',
      styleName: 'editable_column',
      dataType: 'text',
      datetimeFormat: 'yyyy-MM-dd',
      editButtonVisibility: 'always',
      width: '110',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
      header: { text: t('인감일자') },
    },
    {
      fieldName: 'INGAMENDDTE',
      editable: false,
      dataType: 'text',
      width: '100',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('인감종료일자') },
    },
    {
      fieldName: 'ORGBELNR',
      styleName: 'editable_column',
      dataType: 'text',
      width: '100',
      header: { text: t('전표번호') },
    },
    {
      fieldName: 'ORGBELNRDTE',
      styleName: 'editable_column',
      dataType: 'text',
      width: '110',
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
      header: { text: t('전표입력') },
    },
    {
      fieldName: 'NOTARIZATIONDTE',
      styleName: 'editable_column',
      dataType: 'text',
      datetimeFormat: 'yyyy-MM-dd',
      width: '110',      
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
      header: { text: t('공증일자') },
    },
    {
      fieldName: 'HAPBIGO',
      styleName: 'editable_column',
      dataType: 'text',
      width: '90',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('비고') },
    },
    {
      fieldName: 'SAGOGAEYO',
      editable: false,
      dataType: 'text',
      width: '100',
      header: { text: t('사고개요') },
    },
    { fieldName: 'CMPNY_DIV', visible: false, header: { text: t('') } },
    { fieldName: 'SANNO', visible: false, header: { text: t('') } },
    { fieldName: 'APPROVEDTE', visible: false, header: { text: t('') } },
    { fieldName: 'SANGBN', visible: false, header: { text: t('') } },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  defaultDate()
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnCreate') {
    sAFAG0060Popup.value.openPopup()
  } else if (btn.id === 'btnPrintAgreement') {
    printAgreement()
  } else {
    printApproval()
  }
}
//조회관련 로직 시작
const searchData = () => {
  console.log(searchParam)
  return commonSearchApi({
    queryId: 'SAFAG0060_SEARCH01',
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
    if (
      data.HAP_STATUS === null ||
      data.HAP_STATUS === '' ||
      data.HAP_STATUS === undefined
    ) {
      Message.warn(t('합의상태는 필수 입력값 입니다.'))
      return false
    }
    if (!data.RATINGDTE) {
      //등급판정일 입력하지 않으면 재해일자가 들어가도록
      //2024.06.27김민선 사원 요청으로 기본은 재해일자 = 등급판정일
      //등급판정일이 변경되면 변경된 날짜로 들어가고, 등급판정일이 변경되면 장해위로금등급도 변경 되어야함 (수정예정)
      data.RATINGDTE = data.OCCURDATE
    }
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      SANNO: data.SANNO,
      HAPAMT: data.HAPAMT,
      HAPPLANDTE: data.HAPPLANDTE,
      HAPDTE: data.HAPDTE,
      GRADE: data.GRADE,
      RECEIPTDTE: data.RECEIPTDTE,
      HAP_STATUS: data.HAP_STATUS,
      BANK: data.BANK,
      ORGBELNR: data.ORGBELNR,
      ORGBELNRDTE: data.ORGBELNRDTE,
      APPROVEDTE: data.APPROVEDTE,
      INGAMDTE: data.INGAMDTE,
      HAPBIGO: data.HAPBIGO,
      TELN01: data.TELN01,
      DOCUMENT: data.DOCUMENT,
      RATINGDTE: data.RATINGDTE,
      NOTARIZATIONDTE: data.NOTARIZATIONDTE,
    }
    saveParam.push(saveData)
  }

  return commonExecuteApi({
    queryId: 'SAFAG0060_SAVE01',
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
  //onButtonsClick({ id: 'btnSearch' })
  let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '개인정보관련 저장했습니다.',
    crudGbn: 'CU', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

//저장관련 로직 끝

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
        USER_ID: userStore.userId,
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
    queryId: 'SAFAG0060_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  //2024.07.26 요청으로 저장또는 삭제시 재조회 하지 않도록 변경
  // onButtonsClick({ id: 'btnSearch' })
  let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '개인정보관련 삭제했습니다.',
    crudGbn: 'D', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}
//삭제관련 로직 끝

//파일첨부 관련 로직 시작
const onCellButtonClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  let fileID = data.FILE_ID
  //파일아이디 없을때 파일아이디 저장
  if (data.FILE_ID === null) {
    fileUploadPopup.value.setGuid()
    fileID = fileUploadPopup.value.guid
    grdMain.value.getDataProvider().setValue(col.dataRow, 'FILE_ID', fileID)
    grdMain.value.getGridView().checkItem(col.dataRow, true)
    fileUploadPopup.value.openPopup(fileID)
  } else {
    fileUploadPopup.value.openPopup(data.FILE_ID)
  }

  let fileData = []

  let fileVal = {
    CMPNY_DIV: data.CMPNY_DIV, 
    FILE_ID: fileID,
    SANNO: data.SANNO,
  }
  fileData.push(fileVal)

  saveData02(fileData)
}

const saveData02 = (fileData) => {
  return commonExecuteApi({
    queryId: 'SAFAG0060_SAVE02',
    list: fileData,
  })
}
//파일첨부 관련 로직 끝

//추가버튼 관련 로직
const addData = async (data) => {
  console.log('data', data)
  let date = dayjs()
  for (let i = 0; i < data.length; i++) {
    let addRowData = {
      //접수일자
      RECEIPTDTE:
        date.get('year') +
        '-' +
        (date.get('month') + 1).toString().padStart(2, '0') +
        '-' +
        date.get('date').toString().padStart(2, '0'),
      CMPNY_DIV: data[i].CMPNY_DIV, //회사구분
      FILENUM: data[i].FILENUM, //파일번호
      HAP_STATUS: 'A', //합의상태
      DEPT_NM: data[i].DEPT_NM, //부서이름
      EMPLNO: data[i].EMPLNO, //사번
      KOR_NM: data[i].KOR_NM, //성명
      REG_NO: data[i].REG_NO, //주민등록번호
      GRADE: data[i].GRADE, //등급
      HAPAMT: '', //위로금
      OCCURDATE: data[i].OCCURDATE,
      RATINGDTE: data[i].OCCURDATE, //등급판정일 = 재해일자
      INJURYPART: data[i].INJURYPART, //
      TELNO1: data[i].TELNO1,
      SANNO: data[i].SANNO,
      SANGBN: data[i].SANGBN,
    }
    //등급이 존재하면 등급에 해당하는 위로금을 계산해서 넣어줌
    if (addRowData.GRADE) {
      let param = {
        OCCURDATE: addRowData.OCCURDATE, //재해일자
        SANGBN: addRowData.SANGBN, //산재구분
        RATINGDTE: addRowData.RATINGDTE, //장해등급 판정일자
      }
      let HAPAMT = await consolationPrizeCalc(param)
      addRowData.HAPAMT = HAPAMT.ORESULT_CUR.filter(
        (x) => x.COD === addRowData.GRADE
      )[0].CODE_DESC1
    }
    grdMain.value.addRow(addRowData)
  }
}
//추가버튼 관련 로직 끝

//합의서출력 관련 로직 시작
const printAgreement = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)

  if (chkNum.length === 0) {
    Message.warn(t('합의서를 출력할 사람을 선택해주세요.'))
    return false
  } else if (chkNum.length > 1) {
    Message.warn(t('합의서출력은 1명의 인원만 출력가능합니다.'))
    return false
  }
  reportParam[0] = 'IN_EMP_NO='
  reportParam[1] = 'IN_NAME='
  let data = grdMain.value.getDataProvider().getJsonRow(chkNum[0])

  reportParam[0] += data.EMPLNO
  reportParam[1] += data.KOR_NM
  showOz.value = true
}
//합의서출력 관련 로직 끝

//품의서출력 관련 로직 시작
const printApproval = () => {
  sAFAG0060PopupApproval.value.openPopup()
}
//품의서출력 관련 로직 끝

//인원조회 팝업 관련 로직 시작
const openEmpPopup = async (gbn) => {
  empPopup.value.openPopup({
    CMPNY_DIV: searchParam.CMPNY_DIV == '' ? 'HHI' : searchParam.CMPNY_DIV,
    HSE_ONLY: 'Y',
    EMP_NM: searchParam.NAME,
    EMP_NO: searchParam.EMP_NO,
    DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    SANJE: true,
  })
}
const onEmpSelected = (val) => {
  searchParam.EMP_NO = val.EMP_NO
  searchParam.NAME = val.EMP_NM
}
//인원조회 팝업 관련 로직 끝

//셀변경 이벤트
const onCellEdited = async (grid, itemIndex, row, field) => {
  console.log('row', row)
  console.log('itemIndex', itemIndex)
  let fieldName = grdMain.value.getGridView().getColumn(field)
  console.log('필드네임', fieldName)
  if (fieldName.name === 'GRADE') {
    //변경된 컬럼이 등급 컬럼일때만 로직 타도록
    let data = grdMain.value.getDataProvider().getJsonRow(row)
    if (!data.RATINGDTE) {
      //장해등급판정일자를 입력 안했을때 재해발생일이 들어가도록
      data.RATINGDTE = data.OCCURDATE
    }
    let param = {
      OCCURDATE: data.OCCURDATE, //재해일자
      SANGBN: data.SANGBN, //산재구분
      //GRADE: data.GRADE, //장해등급
      //RECIPTDTE: data.RECEIPTDTE, //산재접수일자
      RATINGDTE: data.RATINGDTE, //장해등급 판정일자
    }
    let HAPAMT = await consolationPrizeCalc(param)
    let AMT = HAPAMT.ORESULT_CUR.filter((x) => x.COD === data.GRADE)
    grdMain.value.getDataProvider().setValue(row, 'HAPAMT', AMT[0].CODE_DESC1)
  }
  //변경된 컬럼이 등급판정일이면 등급판정일에 맞는 위로금 조회
  else if (fieldName.name === 'RATINGDTE') {
    let data = grdMain.value.getDataProvider().getJsonRow(row)
    let param = {
      OCCURDATE: data.OCCURDATE, //재해일자
      SANGBN: data.SANGBN, //산재구분
      //GRADE: data.GRADE, //장해등급
      //RECIPTDTE: data.RECEIPTDTE, //산재접수일자
      RATINGDTE: data.RATINGDTE, //장해등급 판정일자
    }
    let HAPAMT = await consolationPrizeCalc(param)
    let AMT = HAPAMT.ORESULT_CUR.filter((x) => x.COD === data.GRADE)
    grdMain.value.getDataProvider().setValue(row, 'HAPAMT', AMT[0].CODE_DESC1)
  }

  //합의상태의값이 접수 -> 합의로 변경되면 체크된 로우들의 합의상태 값을 합의로 변경
  if (fieldName.name === 'HAP_STATUS' && rowData.value === 'A') {
    let checkedData = grdMain.value.getGridView().getCheckedRows(true)
    for (let i = 0; i < checkedData.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
      //체크된 데이터가 접수상태인지 확인
      if (data.HAP_STATUS === 'A') {
        //접수상태인 데이터를 합의로 변경
        grdMain.value
          .getDataProvider()
          .setValue(checkedData[i], 'HAP_STATUS', 'H')
        if (data.HAPPLANDTE) {
          //합의예정일이 합의일자에 들어감
          grdMain.value
            .getDataProvider()
            .setValue(checkedData[i], 'HAPDTE', data.HAPPLANDTE)
        }
      }
    }
  }

  //합의상태가 합의로 변경되면 합의 예정일이 합의일자에 들어감
  if (fieldName.name === 'HAP_STATUS') {
    let data = grdMain.value.getDataProvider().getJsonRow(row)
    //변경된 데이터가 합의상태이고, 합의예정일이 존재하면
    if (data.HAP_STATUS === 'H' && data.HAPPLANDTE) {
      grdMain.value.getDataProvider().setValue(row, 'HAPDTE', data.HAPPLANDTE)
    }
  }

  //합의예정일 변경시 합의일자에 합의예정일 값이 들어가도록
  if (fieldName.name === 'HAPPLANDTE') {
    let data = grdMain.value.getDataProvider().getJsonRow(row)
    //합의상태가 합의가 아니면 합의예정일 넣지않음
    if (data.HAP_STATUS === 'H') {
      console.log('합의예정일', data)
      grdMain.value.getDataProvider().setValue(row, 'HAPDTE', data.HAPPLANDTE)
    }
  }
}
//셀변경 이벤트 끝

//합의상태셀을 클릭할때마다 클릭한 로우의 합의상태값을 가져옴
//합의상태가 접수 -> 합의로 변경될때마다 체크된 로우의 합의상태를 합의로 변경하기 위해 합의상태가 합의로 변경되기전 합의상태를 가지고 있기위해
//watch로는 그리드셀의 데이터 변경을 감지하지 못하기 때문에...
const onCellClicked = (grid, clickData) => {
  if (clickData.column === 'HAP_STATUS') {
    rowData.value = grdMain.value
      .getDataProvider()
      .getJsonRow(clickData.dataRow).HAP_STATUS
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
          'btnPrintAgreement',
          'btnPrintApproval',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('회사구분')"
            label-width="50px"
            width="200px"
            :items="codeList.company"
            item-title="TXT"
            item-value="COD"
            v-model="searchParam.CMPNY_DIV"
          >
          </i-select>
          <i-select
            :label="$t('조회조건')"
            v-model="searchParam.DATE_GBN"
            :items="codeList.searchdate"
            item-title="TXT"
            item-value="COD"
            width="200px"
          > 
          </i-select>
          <v-checkbox
            label="조회기간"
            true-value="Y"
            false-value="N"
            v-model="searchParam.DATE_YN"
            class="mr-2 mt-1"
          ></v-checkbox>
          <i-input
            class="mr-1"
            v-model="searchParam.FROM"
            type="date"
            width="150px"
          >
          </i-input>
          <span class="mt-2"> ~ </span>
          <i-input
            class="ml-1"
            v-model="searchParam.TO"
            type="date"
            width="150px"
          ></i-input>
          <i-select
            :label="$t('합의상태')"
            v-model="searchParam.STATUS"
            :items="codeList.status"
            item-title="TXT"
            item-value="COD"
            width="200px"
          >
          </i-select>
          <i-input
            :label="$t('산재자 사번/성명')"
            v-model="searchParam.EMP_NO"
            @click:appendInner="openEmpPopup()"
            @keydown.enter="
              (e) => {
                onButtonsClick({ id: 'btnSearch' })
              }
            "
            append-inner-icon="mdi-magnify"
            width="250px"
          >
          </i-input>
          <i-input
            v-model="searchParam.NAME"
            @keydown.enter="
              (e) => {
                onButtonsClick({ id: 'btnSearch' })
              }
            "
            width="160px"
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
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <OZReport
    :showPop="showOz"
    :reportName="reportName"
    :params="reportParam"
    @close="showOz = $event"
  />
  <!-- 인원조회 팝업 -->
  <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
  <SAFAG0060Popup ref="sAFAG0060Popup" @selected="addData"></SAFAG0060Popup>
  <!-- 파일업로드팝업 -->
  <IUploadPopup ref="fileUploadPopup" :cmpnyUseYn = "false"></IUploadPopup>
  <!-- 품의서출력 팝업 -->
  <SAFAG0060PopupApproval ref="sAFAG0060PopupApproval"></SAFAG0060PopupApproval>
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
