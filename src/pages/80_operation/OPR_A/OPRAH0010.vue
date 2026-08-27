<!-- 
  * Vue 내 용 : 설문지 관리
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/02/15
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/02/15 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import OZReport from '@/components/OZReport.vue'

import OPRAH0010Popup01 from "./OPRAH0010Popup01.vue"
import OPRAH0010Popup02 from "./OPRAH0010Popup02.vue"
import OPRAH0020Popup01 from "./OPRAH0020Popup01.vue"
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import { isEmpty } from "@/@core/utils"
import { getQDomain } from "@/utils/common"

defineOptions({
  name:'80_operation-OPR_A-OPRAH0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub1 = ref(null)
const grdSub2 = ref(null)
const oPRAH0010Popup01 = ref(null)
const oPRAH0010Popup02 = ref(null)
const oPRAH0020Popup01 = ref(null)
const subgridTitle1 = ref(null)
const subgridTitle2 = ref(null)

const reportName = ref('')
const printParams = ref([])
let _Parameters = reactive({})
const showOz = ref(false)
const sub1Data = ref([])
const remainReply = ref(false)

// 메인 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,

  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  YEAR: dayjs().get("year"),
  TITLE : '',
  KIND : '',
  DIVISION : '',
  USE_YN : 'Y',
})

// 서브 그리드 조회조건
const searchSubParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  CATEGORY : '',
  SUVY_DIV : '',
})

// 메인그리드 선택 행 설문지 ID 저장
const selectMainParam = reactive({
  SUVY_ID : '',
  KIND : '',
  DIVISION : '',
  TITLE : '',
  SUVY_DESC : '',
  CMPNY_DIV : '',
  REG_YN: '',
  DEPT_YN: '',
})

const mainParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,

  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  ASGN_CD: true? userStore.deptCd : userStore.asgnCd,
  YEAR: dayjs().get("year"),
  TITLE : '',
  SUVY_DESC : '',
  KIND : null,
  DIVISION : null,
  RSPN_PER_FROM : dayjs().subtract(1, "year").format("YYYY-MM-DD"),
  RSPN_PER_TO : dayjs().format("YYYY-MM-DD"),
  USE_YN : 'Y',
  LOGIN_YN : 'N',
  REG_YN : 'N',
  FILE_ID : '', 
  SUVY_ID : '',
  SAVE_GBN : '',
  MODIFY_YN : 'N',
  DEPT_YN: 'N',
})

//코드리스트
const codeList = reactive({
  DIVISION : [],
  KIND : [],
  CATEGORY : [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : 
  {
    checkBar: { visible: true },
    header: { height: 50 }, 
    stateBar: { visible: false } ,
    edit: { editable: false },
  },
  keys : ['YEAR','SUVY_ID','CMPNY_DIV'],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', width: '100', header: { text: t('사업부명') }  },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '100', header: { text: t('부서명') }  },
    { fieldName: 'DIVISION_NM', dataType: 'text', width: '100', header: { text: t('설문지 구분') }  },
    { fieldName: 'KIND_NM', dataType: 'text', width: '100', header: { text: t('설문지 종류') } },
    { 
      fieldName: 'TITLE', 
      dataType: 'text', 
      width: '200', 
      styleName: "left-column",
      header: { text: t('설문지 제목') },
    },
    { 
      fieldName: 'SUVY_DESC', 
      dataType: 'text', 
      width: '250', 
      styleName: "left-column",
      header: { text: t('설문지 설명') },
    },
    { fieldName: 'RSPN_PER_FROM', dataType: 'datetime', width: '90', lookupDisplay: true, datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('시작일'), editor: { datetimeFormat: 'yyyy-MM-dd' } }  },
    { fieldName: 'RSPN_PER_TO', dataType: 'datetime', width: '90', lookupDisplay: true, datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('종료일'), editor: { datetimeFormat: 'yyyy-MM-dd' } }  },  
    { fieldName: 'KOR_NM', dataType: 'text', width: '70', header: { text: t('최종작성자') } },
    { fieldName: 'USE_YN_NM', dataType: 'text', width: '70', type: 'data', header: { text: t('설문지') } },
    { fieldName: 'LOGIN_YN_NM', dataType: 'text', width: '70', type: 'data', header: { text: t('통합인증') } },
    { fieldName: 'REG_YN_NM', dataType: 'text', width: '70', type: 'data', header: { text: t('익명') } },
    { fieldName: 'DEPT_YN', dataType: 'text', width: '90', type: 'data', header: { text: t('부서사용여부') } },
    { fieldName: 'FILE_YN', dataType: 'text', width: '70', type: 'data', header: { text: t('첨부파일') } },

    // 출력 안함
    { fieldName: 'YEAR', dataType: 'text' , visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'SUVY_ID', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text' , visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text' , visible: false },
    { fieldName: 'KIND', dataType: 'text' , visible: false },
    { fieldName: 'DIVISION', dataType: 'text' , visible: false },
    { fieldName: 'FILE_ID', dataType: 'text' , visible: false },
    { fieldName: 'MODIFY_YN', dataType: 'text' , visible: false },
    { fieldName: 'USE_YN', dataType: 'text' , visible: false },
    { fieldName: 'LOGIN_YN', dataType: 'text' , visible: false },
    { fieldName: 'REG_YN', dataType: 'text' , visible: false },
  ],
  columns : [],
  columnLayout: [
    'YEAR', 
    'BSNS_NM',
    'DEPT_NM',
    'DIVISION_NM',
    'KIND_NM',
    'TITLE',
    'SUVY_DESC',
    {
      name: '응답기간',
      direction: 'horizontal',
      items: [
        'RSPN_PER_FROM',
        'RSPN_PER_TO',                          
      ],
      header: {
        text: t('응답기간'),
      },
    },
    'KOR_NM',
    'USE_YN_NM',
    'LOGIN_YN_NM',
    'REG_YN_NM',
    'DEPT_YN',
    'FILE_YN',
  ],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSub1Props = reactive({
  gridViewOption : 
  { 
    stateBar: { visible: false }, 
    checkBar: { visible: true },
    edit: { editable: false },
  },
  keys : ['CMPNY_DIV','QSTN_ID'],
  fields : [ 
    { 
      fieldName: 'SUVY_DIV_NM',
      dataType: 'text', 
      editable: false,
      width: '120',
      header: { text: t('설문지 구분') },
    },
    { 
      fieldName: 'QSTN_TITLE', 
      dataType: 'text',
      editable: false, 
      width: '150', 
      styleName: "left-column",
      header: { text: t('문항 제목') },
    },
    { 
      fieldName: 'QSTN_DESC', 
      dataType: 'text', 
      editable: false,
      width: '200', 
      styleName: "left-column",
      header: { text: t('문항 설명') }, 
    },
    { 
      fieldName: 'QSTN_TYPE_NM', 
      dataType: 'text',
      editable: false,
      width: '100', 
      header: { text: t('문항 유형') }, 
    },
    { 
      fieldName: 'QSTN_CATEGORY_NM', 
      dataType: 'text',
      editable: false, 
      width: '80', 
      header: { text: t('카테고리') },
    },
    { 
      fieldName: 'DISP_YN_NM', 
      dataType: 'text',
      editable: false,
      width: '70', 
      type: 'data', 
      header: { text: t('화면표시') }, 
    },
    { 
      fieldName: 'ESNTL_YN_NM', 
      dataType: 'text',
      editable: false,
      width: '70', 
      type: 'data', 
      header: { text: t('필수') },
    },

    // 출력 안함
    { fieldName: 'QSTN_TYPE', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_CATEGORY', dataType: 'text' , visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_ID', dataType: 'text' , visible: false },
    { fieldName: 'SUVY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'FILE_ID', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_CONTENTS', dataType: 'text' , visible: false },
    { fieldName: 'DISP_YN', dataType: 'text' , visible: false },
    { fieldName: 'ESNTL_YN', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdSub1Props.columns = grdSub1Props.fields

//그리드 속성셋팅
const grdSub2Props = reactive({
  gridViewOption : 
  { 
    stateBar: { visible: false }, 
    checkBar: { visible: true },
    edit: { editable: false },
  },
  keys : ['CMPNY_DIV','QSTN_ID'],
  fields : [ 
    { 
      fieldName: 'QSTN_TITLE', 
      dataType: 'text', 
      editable: false,
      width: '150', 
      styleName: "left-column",
      header: { text: t('문항 제목') },
    },
    { 
      fieldName: 'QSTN_DESC', 
      dataType: 'text', 
      width: '200', 
      styleName: "left-column",
      header: { text: t('문항 설명') },
    },
    { 
      fieldName: 'QSTN_TYPE_NM', 
      dataType: 'text', 
      editable: false,
      width: '100', 
      header: { text: t('문항 유형') },
    },
    { 
      fieldName: 'QSTN_CATEGORY_NM', 
      dataType: 'text',
      editable: false,
      width: '100', 
      header: { text: t('카테고리') },
    },
    { 
      fieldName: 'QSTN_SEQ', 
      dataType: 'text',
      editable: false,
      width: '70',
      header: { text: t('순서') },
    },
    { 
      fieldName: 'DISP_YN_NM', 
      dataType: 'text',
      editable: false,
      width: '70', 
      type: 'data', 
      header: { text: t('화면표시') },
    },
    { 
      fieldName: 'ESNTL_YN_NM', 
      dataType: 'text',
      editable: false,
      width: '70', 
      type: 'data', 
      header: { text: t('필수') },
    },

    // 출력 안함
    { fieldName: 'QSTN_CONTENTS', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_CATEGORY', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_TYPE', dataType: 'text' , visible: false },
    { fieldName: 'INDV_ID', dataType: 'text' , visible: false },
    { fieldName: 'QSTN_ID', dataType: 'text' , visible: false },
    { fieldName: 'SUVY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'FILE_ID', dataType: 'text' , visible: false },
    { fieldName: 'ESNTL_YN', dataType: 'text' , visible: false },
    { fieldName: 'DISP_YN', dataType: 'text' , visible: false },
    { fieldName: 'SUVY_ID', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdSub2Props.columns = grdSub2Props.fields

onMounted(() => {  
  vm.$nextTick(() => {
    initCombo()
  })  
})

//콤보박스 셋팅
const initCombo = () => {
  //담당 가능 과목, 강의 이력 데이터 바인딩
  Promise.all([
    getCodeList(userStore.cmpnyDiv + 'ZS10'), //설문지 구분
  ]).then(res => {
    codeList.DIVISION = res[0].ORESULT_CUR

    searchParams.DIVISION = 'A'
  })
} 

watch(() => searchParams.DIVISION, (newValue, oldValue) => {
  resetCode(newValue)
})

const resetCode = val =>{
  Promise.all([
    getCodeList(userStore.cmpnyDiv + 'ZS00'), //설문지 종류
    getCodeList(userStore.cmpnyDiv + 'ZS20'), //카테고리
  ]).then(res => {
    codeList.KIND = res[0].ORESULT_CUR.filter(data => data.CODE_DESC1 === val)
    codeList.CATEGORY = res[1].ORESULT_CUR.filter(data => data.CODE_DESC1 === val)

    codeList.KIND.unshift({ TXT: "전체", COD: "0" })
    searchParams.KIND = '0'
    codeList.CATEGORY.unshift({ TXT: "전체", COD: "0" })
    searchSubParams.CATEGORY = '0'

    onButtonsClick({ id :'btnSearch' })
    onSubButtonsClick({ id :'btnSearch' })
    onButtonsClick({ id :'btnSearchSub2' })
  })
}

// 메인 그리드 메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setQuery(searchDataGrdMain)
      .setAfter(afterSearchGrdMain)
      .run()
  }
  else if (btn.id === 'btnCreate') {
    openPopup('NEW')
  } 
  else if (btn.id === 'btnUpdate') {
    openPopup('UPDATE')
  } 
  else if (btn.id === 'btnCopy') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeCopyData)
      .setQuery(copyData)
      .setConfirmMessage('복사 하시겠습니까?')
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearch' })
        onSubButtonsClick({ id :'btnSearch' })
        onButtonsClick({ id :'btnSearchSub2' }) 
      })
      .run()

  } 
  else if (btn.id === 'btnPreview') {
    if (grdMain.value.getDataProvider().rowCount === 0) {
      return Message.err("설문지 목록에 데이터가 없습니다.")
    }

    if (isEmpty(selectMainParam.SUVY_ID)) {
      return Message.err("설문지를 선택해주세요.")
    }

    oPRAH0010Popup02.value.openPopup({ 
      CMPNY_DIV : selectMainParam.CMPNY_DIV,
      SUVY_ID : selectMainParam.SUVY_ID,
      TITLE : selectMainParam.TITLE,
      SUVY_DESC : selectMainParam.SUVY_DESC,
      REG_YN: selectMainParam.REG_YN,
      DEPT_YN: selectMainParam.DEPT_YN,
    })
  }
  else if (btn.id === 'btnSearchSub2') 
  { 
    new queryFlowHelper(vm, t)
      .setGridList([grdSub2])
      .setQuery(searchDataGrdSub2)
      .setAfter(afterSearchGrdSub2)
      .run()
  } else if (btn.id === 'btnQrCodePrint') {
    if (isEmpty(mainParams.SUVY_ID)) {
      return Message.err('QR코드를 생성할 설문지 항목을 선택해 주세요.')
    } else if (mainParams.LOGIN_YN === 'Y') {
      return Message.err('통합인증이 필요한 설문지는 교육/문화/포상 화면에서 확인 바랍니다.')
    }
    onBtnQrCodePrint()
  }
}

// 설문지 목록 조회
const searchDataGrdMain = () =>{
  return commonSearchApi({ queryId : 'OPRAH0010_SEARCH_01', param: searchParams })
}

// 설문지 목록 조회 후 데이터 처리
const afterSearchGrdMain = res =>{
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
} 

// 설문지 복사전 체크
const beforeCopyData = () =>{
  if (grdMain.value.getDataProvider().rowCount === 0) {
    return Message.err("설문지 목록에 데이터가 없습니다.")
  }

  if (isEmpty(selectMainParam.SUVY_ID)) {
    return Message.err("복사할 설문지를 선택해주세요.")
  }

  return true
} 

// 설문지 복사
const copyData = () =>{
  let copyParams = []

  copyParams.push({
    CMPNY_DIV: userStore.cmpnyDiv, // 회사 코드
    SUVY_ID: selectMainParam.SUVY_ID,
    BSNS_CD: userStore.bsnsCd, // 사업부코드
    DEPT_CD: userStore.deptCd, // 부서코드(A:직영일경우)
    ASGN_CD: true? userStore.deptCd : userStore.asgnCd,
    YEAR: dayjs().get("year"), // 년도
    KIND: selectMainParam.KIND, // 설문지종류
    DIVISION: selectMainParam.DIVISION, // 설문지구분
    USER_ID: userStore.userId, // 로그인 사용자 정보
    RES_COD: "", // return 값
    RES_MSG: "", // return 값
    RES_COL: "", // return 값
  })
  
  return commonExecuteApi({
    queryId: "OPRAH0010_SAVE_03", list: copyParams,
  })
}

// 선택된 설문지 문항 목록 조회
const searchDataGrdSub2 = () =>{
  return commonSearchApi({ queryId : 'OPRAH0010_SEARCH_03', param: selectMainParam })
}

// 선택된 설문지 문항 조회 후 데이터 처리
const afterSearchGrdSub2 = res =>{
  grdSub1.value.getDataProvider().setRows(sub1Data.value)
  grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
  filterGrdSub1()
} 

// 선택된 설문지 문항에 있는 문항을 전체 문항목록에서 제거한다.
const filterGrdSub1 = () => {
  let qstnIdList = []
  let deleteIdx = []

  for(var i = 0; i < grdSub2.value.getDataProvider().getRowCount(); i++) {
    let data = grdSub2.value.getDataProvider().getJsonRow(i)
    if(data == null) continue
    qstnIdList.push(data.QSTN_ID)
  }
  for(var i = 0; i < grdSub1.value.getDataProvider().getRowCount(); i++) {
    let data = grdSub1.value.getDataProvider().getJsonRow(i)
    if(data == null) continue
    if(qstnIdList.indexOf(data.QSTN_ID) >= 0) deleteIdx.push(i)
  }
  grdSub1.value.getDataProvider().removeRows(deleteIdx)
}

// 서브 그리드 메뉴버튼
const onSubButtonsClick = async btn => {
  if (btn.id === 'btnSearch'){

    new queryFlowHelper(vm, t)
      .setGridList([grdSub1])
      .setQuery(searchDataGrdSub1)
      .setAfter(afterSearchGrdSub1)
      .run()
  }
  else if (btn.id === 'btnAddQu') {

    oPRAH0020Popup01.value.openPopup({ 
      CMPNY_DIV: mainParams.CMPNY_DIV,
      QSTN_ID: '',
      SUVY_DIV: 'A',
      QSTN_TITLE: '',
      QSTN_DESC: '',
      QSTN_TYPE : '',
      QSTN_CONTENTS : '',
      QSTN_CATEGORY : '',
      DISP_YN : 'N',
      USE_YN : 'Y',
      ESNTL_YN : 'N',
      FILE_ID : '',
      SAVE_GBN : 'NEW',
    })

  } 
  else if (btn.id === 'btnUseQu') {

    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub1, row: null }])
      .setGridList([grdSub1])
      .setBefore(beforeSaveQue)
      .setQuery(saveDataQue)
      .setConfirmMessage('사용 하시겠습니까?')
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearch' })
        onSubButtonsClick({ id :'btnSearch' })
        onButtonsClick({ id :'btnSearchSub2' }) 
      })
      .run()
  } 
  else if (btn.id === 'btnExclusionQu') {

    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub2, row: null }])
      .setGridList([grdSub2])
      .setQuery(deleteSub2Data)
      .setConfirmMessage('제외 하시겠습니까?')
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearch' })
        onSubButtonsClick({ id :'btnSearch' })
        onButtonsClick({ id :'btnSearchSub2' }) 
      })
      .run()
  }
  else if (btn.id === 'btnMoveUp') {
    let rowIdx = grdSub2.value.getGridView().getCurrent().dataRow
    let grdData = grdSub2.value.getDataProvider().getJsonRows()

    if(grdData.length > 1 && rowIdx > 0) {
      grdSub2.value.getDataProvider().moveRow(rowIdx-1,rowIdx)
      grdSub2.value.getGridView().setCurrent({ itemIndex: rowIdx-1 })
      grdSub2.value.getGridView().checkAll(true)
    }

    for(let i=0; i <grdData.length;i++){
      grdSub2.value.getDataProvider().setValue(i, 'QSTN_SEQ', i + 1)
    }
  }
  else if (btn.id === 'btnMoveDown') {
    let rowIdx = grdSub2.value.getGridView().getCurrent().dataRow
    let grdData = grdSub2.value.getDataProvider().getJsonRows()

    if(grdData.length > 1 && grdData.length > rowIdx + 1) {
      grdSub2.value.getDataProvider().moveRow(rowIdx+1,rowIdx)
      grdSub2.value.getGridView().setCurrent({ itemIndex: rowIdx+1 })
      grdSub2.value.getGridView().checkAll(true)
    }

    for(let i=0; i <grdData.length;i++){
      grdSub2.value.getDataProvider().setValue(i, 'QSTN_SEQ', i + 1)
    }
  }
  else if (btn.id === 'btnSaveSeq') {

    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub2, row: null }])
      .setGridList([grdSub2])
      .setBefore(beforeSaveQue)
      .setQuery(saveSub2Data)
      .setAfter(() => { 
        onButtonsClick({ id :'btnSearch' })
        onSubButtonsClick({ id :'btnSearch' })
        onButtonsClick({ id :'btnSearchSub2' }) 
      })
      .run()
  } 
}

const parsingDate = (dt) => { 
  return new Date(dt).toISOString().slice(0, 10)
}

// null값인지 아닌지 확인
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}

//QR코드 출력 버튼 클릭 이벤트
const onBtnQrCodePrint = async () => {
  reportName.value = '/manage/hse/EDUAB0030_TAB01_POP01_01.ozr'

  let sTITLE = mainParams.YEAR + '년 ' + mainParams.TITLE 
  let sEDATE_FROM = isNullCheck(mainParams.RSPN_PER_FROM) === true ? '' : parsingDate(mainParams.RSPN_PER_FROM)
  let sEDATE_TO = isNullCheck(mainParams.RSPN_PER_TO) === true ? '' : parsingDate(mainParams.RSPN_PER_TO)
  let sEDU_DATE = ''
  let sURL = ''

  var userOs = navigator.userAgent.replace(/ /g, '')
  var osVersion = false
  if(userOs.includes("WindowsNT10.0") == true){
    osVersion = true
  }
  if(osVersion){
    sURL = getQDomain()
    sURL += '/#/survey?CMPNY_DIV=' + mainParams.CMPNY_DIV +
            //'&SCHEDULE_ID=' + mainParams.SCHEDULE_ID +
            '&YEAR=' + mainParams.YEAR +
            //'&EDUTIME_SERIAL=' + mainParams.EDUTIME_SERIAL + // 아마 필요없는듯
            '&DIVISION=' + mainParams.DIVISION +
            '&SUVY_ID=' + mainParams.SUVY_ID


    await commonRequest(
      '/hse/slm/',
      {
        orgLinkUrl: sURL,
        shortLinkUrl: getQDomain(),
      },
      "post", // HTTP 메서드
      "application/json;charset=utf8", // Content-Type
      { apiVersion: "1.0.0" } // meta 정보
    ).then(res => {
      sURL = res.body
    })
    if(sEDATE_TO.length > 0 && sEDATE_FROM !== sEDATE_TO){
      sEDU_DATE = '응답일자 : ' + sEDATE_FROM + ' ~ ' + sEDATE_TO
    }else{
      sEDU_DATE = '응답일자 : ' + sEDATE_FROM
    }
  }else{
    MessageBox.Show("지원하지 않는 OS입니다. Windows 10 PC에서 출력하세요.");
    return;
  }



  printParams.value = [
    "TITLE="+sTITLE,
    "EDU_DATE="+sEDU_DATE,
    "URL="+sURL
  ]
  showOz.value = true
}

// 전체 문항 목록 조회 
const searchDataGrdSub1 = () =>{
  searchSubParams.SUVY_DIV = searchParams.DIVISION
  
  return commonSearchApi({ queryId : 'OPRAH0010_SEARCH_02', param: searchSubParams })
}

// 전체 문항 목록 조회 후 데이터 처리
const afterSearchGrdSub1 = res =>{
  sub1Data.value = res.ORESULT_CUR
  grdSub1.value.getDataProvider().setRows(sub1Data.value)

  filterGrdSub1()
}

// 전체 문항 목록에서 선택 문항 사용 저장 전 체크
const beforeSaveQue = () => {

  if (grdMain.value.getDataProvider().rowCount === 0) {
    return Message.err("설문지 목록에 데이터가 없습니다.")
  }

  if (isEmpty(selectMainParam.SUVY_ID)) {
    return Message.err("문항을 저장할 설문지를 선택해주세요.")
  }

  return true
}

const onCellDblClicked = (grid, clickData) => {
  if(remainReply.value) return
  openPopup('UPDATE')
}

// 전체 문항 목록에서 선택 문항 사용 저장
const saveDataQue = () => {
  let saveParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdSub1.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 설문지 문항이 없습니다.")
  }
  else {
    for (let rowIdx of checkedRows) {
      let data = grdSub1.value.getDataProvider().getJsonRow(rowIdx)
      let dup = false

      // 이미 선택된 설문지에 있을 시 dup = true
      for(var i = 0; i < grdSub2.value.getDataProvider().getRowCount(); i++) {
        let data2 = grdSub2.value.getDataProvider().getJsonRow(i)
        if(data.QSTN_ID == data2.QSTN_ID) {
          dup = true
          break
        }
      }

      // 이미 선택된 설문지 문항일 시 continue
      if(dup) continue
      saveParams.push(
        {
          SUVY_ID : selectMainParam.SUVY_ID,       
          QSTN_ID : data.QSTN_ID,
          USER_ID : userStore.userId,
          RES_COD : '',               // return 값
          RES_MSG : '',               // return 값
          RES_COL : '',               // return 값
        },
      )
    }

    return commonExecuteApi({ queryId : 'OPRAH0010_SAVE_02', list: saveParams })
  }
}

// 전체 문항 목록에서 선택 문항 사용 저장
const saveSub2Data = () => {
  let saveParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdSub2.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 설문지 문항이 없습니다.")
  }
  else {
    for (let rowIdx of checkedRows) {
      let data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
      
      saveParams.push(
        {
          INDV_ID : data.INDV_ID,
          SUVY_ID : data.SUVY_ID,       
          QSTN_ID : data.QSTN_ID,
          QSTN_SEQ : data.QSTN_SEQ,
          USER_ID : userStore.userId,   
          RES_COD : '',               // return 값
          RES_MSG : '',               // return 값
          RES_COL : '',               // return 값
        },
      )
    }

    return commonExecuteApi({ queryId : 'OPRAH0010_SAVE_04', list: saveParams })
  }
}

// 선택된 설문지 문항 목록 제외
const deleteSub2Data = () => {
  let deleteParams = []

  // 상태바가 체크된 항목
  let checkedRows = grdSub2.value.getGridView().getCheckedRows(true) 
  
  if (checkedRows.length === 0) {
    return Message.err("선택된 설문지 문항이 없습니다.")
  }
  else {
    for (let rowIdx of checkedRows) {
      let data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
      
      deleteParams.push(
        {
          INDV_ID : data.INDV_ID,
        },
      )
    }

    return commonExecuteApi({ queryId : 'OPRAH0010_DELETE_01', list: deleteParams })
  }
}

const saveMainParams = () => {
  let row = grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)
  mainParams.CMPNY_DIV = row.CMPNY_DIV
  mainParams.BSNS_CD = row.BSNS_CD
  mainParams.DEPT_CD = row.DEPT_CD
  mainParams.DEPT_YN = row.DEPT_YN
  mainParams.ASGN_CD = row.ASGN_CD
  mainParams.YEAR = row.YEAR
  mainParams.TITLE = row.TITLE
  mainParams.SUVY_DESC = row.SUVY_DESC
  mainParams.KIND = row.KIND
  mainParams.DIVISION = row.DIVISION
  mainParams.RSPN_PER_FROM = row.RSPN_PER_FROM
  mainParams.RSPN_PER_TO = row.RSPN_PER_TO
  mainParams.USE_YN = row.USE_YN
  mainParams.LOGIN_YN = row.LOGIN_YN
  mainParams.REG_YN = row.REG_YN
  mainParams.FILE_ID = row.FILE_ID
  mainParams.SUVY_ID = row.SUVY_ID
  mainParams.MODIFY_YN = row.MODIFY_YN
}

// 설문지 목록에서 설문지 선택
const onCellClicked = (grid, clickData) => {
  if(clickData.dataRow == null) return
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  
  saveMainParams()

  if(selectMainParam.SUVY_ID == row.SUVY_ID) return
  selectMainParam.SUVY_ID = row.SUVY_ID
  selectMainParam.DIVISION = row.DIVISION
  selectMainParam.KIND = row.KIND
  selectMainParam.TITLE = row.TITLE
  selectMainParam.SUVY_DESC = row.SUVY_DESC
  selectMainParam.CMPNY_DIV = row.CMPNY_DIV
  selectMainParam.DEPT_YN = row.DEPT_YN
  selectMainParam.REG_YN = row.REG_YN

  checkReplyCnt(row.SUVY_ID) 
  onButtonsClick({ id :'btnSearchSub2' })
}

// 해당 설문지에 대한 답변이 있는 지 확인하고 답변이 있으면 수정 불가능
const checkReplyCnt = (suvyId) => {
  commonSearchApi({ queryId: "OPRAH0010_SEARCH_08", param: {SUVY_ID: suvyId }
  }).then(res => {
    if(res.ORESULT_CUR.length > 0) {
      if(res.ORESULT_CUR[0].CNT > 0) {
        remainReply.value = true
        menuTitle.value.disableBtn('btnUpdate', true)
        subgridTitle1.value.disableBtn('btnAddQu', true)
        subgridTitle1.value.disableBtn('btnUseQu', true)
        subgridTitle2.value.disableBtn('btnMoveUp', true)
        subgridTitle2.value.disableBtn('btnMoveDown', true)
        subgridTitle2.value.disableBtn('btnSaveSeq', true)
        subgridTitle2.value.disableBtn('btnExclusionQu', true)
        return
      }
    }

    remainReply.value = false
    menuTitle.value.disableBtn('btnUpdate', false)
    subgridTitle1.value.disableBtn('btnAddQu', false)
    subgridTitle1.value.disableBtn('btnUseQu', false)
    subgridTitle2.value.disableBtn('btnMoveUp', false)
    subgridTitle2.value.disableBtn('btnMoveDown', false)
    subgridTitle2.value.disableBtn('btnSaveSeq', false)
    subgridTitle2.value.disableBtn('btnExclusionQu', false)
  })
}

/* -------------- 팝업 오픈 -------------- */
const openPopup = gbn => {
  if(gbn === 'NEW'){
    oPRAH0010Popup01.value.openPopup({ 
      CMPNY_DIV: mainParams.CMPNY_DIV,
      BSNS_CD: mainParams.BSNS_CD,
      DEPT_CD: mainParams.DEPT_CD,
      ASGN_CD: mainParams.ASGN_CD,
      YEAR:  searchParams.YEAR, //2025.01.16 조회조건의 년도 기준으로 등록되도록 처리   
      TITLE : '',
      SUVY_DESC : '',
      KIND : '',
      DIVISION : searchParams.DIVISION,
      RSPN_PER_FROM : mainParams.RSPN_PER_FROM,
      RSPN_PER_TO : mainParams.RSPN_PER_TO,
      USE_YN : 'Y',
      LOGIN_YN : 'N',
      REG_YN : 'N',
      DEPT_YN : 'N',
      FILE_ID : '',
      SUVY_ID : '',
      SAVE_GBN : gbn,
    })
  } else if (gbn === 'UPDATE') {
    if (isEmpty(mainParams.SUVY_ID)) {
      return Message.err("수정할 설문지 항목을 선택해 주세요.")
    }

    if (mainParams.MODIFY_YN === 'N') {
      return Message.err("설문 답변된 설문지는 수정할 수 없습니다.")
    }

    saveMainParams()
    oPRAH0010Popup01.value.openPopup({ 
      CMPNY_DIV: mainParams.CMPNY_DIV,
      BSNS_CD: mainParams.BSNS_CD,
      DEPT_CD: mainParams.DEPT_CD,
      ASGN_CD: mainParams.ASGN_CD,
      YEAR:  mainParams.YEAR,   
      TITLE : mainParams.TITLE,
      SUVY_DESC : mainParams.SUVY_DESC,
      KIND : mainParams.KIND,
      DIVISION : mainParams.DIVISION,
      RSPN_PER_FROM : mainParams.RSPN_PER_FROM,
      RSPN_PER_TO : mainParams.RSPN_PER_TO,
      USE_YN : mainParams.USE_YN,
      LOGIN_YN : mainParams.LOGIN_YN,
      REG_YN : mainParams.REG_YN,
      FILE_ID : mainParams.FILE_ID,
      SUVY_ID : mainParams.SUVY_ID,
      DEPT_YN : mainParams.DEPT_YN,
      SAVE_GBN : gbn,
    })
  }
}

// 팝업에서 저장 종료 후 재조회
const afterSaveData = () => {
  onButtonsClick({ id: "btnSearch" })
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnQrCodePrint', 'btnSearch', 'btnCreate', 'btnUpdate', 'btnCopy', 'btnPreview']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.YEAR"
            :label="$t('년도')"
            label-width="100px"
            type="Number"
            width="200px"
            required
          />
          <i-select
            v-model="searchParams.DIVISION" 
            :label="$t('설문지구분')"
            label-width="100px"
            append-inner-icon="mdi-magnify"
            :items="codeList.DIVISION"
            item-value="COD"
            item-title="TXT"
            width="300px"
            required
          />
          <i-select
            v-model="searchParams.KIND" 
            :label="$t('설문지종류')"
            label-width="100px"
            append-inner-icon="mdi-magnify"
            :items="codeList.KIND"
            item-value="COD"
            item-title="TXT"
            width="300px"
          />
          <i-input
            v-model="searchParams.TITLE" 
            :label="$t('설문지 제목 검색')"
            label-width="100px"
          />
          <VCheckbox
            v-model="searchParams.USE_YN"
            :label="$t('설문지 사용 여부')"
          />
        </v-sheet>
        <v-sheet 
          class="mb-3" 
          height="40%"
        >
          <!-- 메인그리드 -->
          <IGridTitle :title="$t('설문지 목록')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @on-cell-clicked="onCellClicked"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet 
            width="48%" 
            class="pa-0 h-auto pe-2"
          >
            <!-- 서브그리드1 -->
            <IGridTitle
              ref="subgridTitle1"
              :title="$t('전체 문항 목록')"
              :button-list="['btnSearch', 'btnAddQu', 'btnUseQu']"
              @click-button="onSubButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <div class="content mb-1">
              <VForm
                ref="searchArea"
                class="searchArea d-flex"
              >
                <i-select
                  v-model="searchSubParams.CATEGORY"
                  :label="$t('카테고리')"
                  label-width="100px"
                  append-inner-icon="mdi-magnify"
                  :items="codeList.CATEGORY"
                  item-value="COD"
                  item-title="TXT"
                  width="300px"
                />
              </VForm>
            </div>
            <RealGrid
              ref="grdSub1"
              :grid-view-option="grdSub1Props.gridViewOption"
              :keys="grdSub1Props.keys" 
              :fields="grdSub1Props.fields"
              :columns="grdSub1Props.columns"
              :column-layout="grdSub1Props.columnLayout"
            />
          </v-sheet>
          <v-sheet 
            width="48%" 
            class="pa-0 h-auto"
          >
            <!-- 서브그리드2 --> 
            <IGridTitle
              ref="subgridTitle2"
              :title="$t('선택된 설문지 문항')"
              :button-list="['btnMoveUp', 'btnMoveDown', 'btnSaveSeq', 'btnExclusionQu']"
              @click-button="onSubButtonsClick"
            />
            <RealGrid
              ref="grdSub2"
              :grid-view-option="grdSub2Props.gridViewOption"
              :keys="grdSub2Props.keys" 
              :fields="grdSub2Props.fields"
              :columns="grdSub2Props.columns"
              :column-layout="grdSub2Props.columnLayout"
            />
          </v-sheet>
        </div>
        <!-- 설문지 등록/수정 팝업 -->
        <OPRAH0010Popup01 
          ref="oPRAH0010Popup01" 
          @closed="afterSaveData"
        />
        <!-- 설문지 미리보기 팝업 -->
        <OPRAH0010Popup02 ref="oPRAH0010Popup02" />
        <!-- 설문지 신규 문항 추가 팝업 -->
        <OPRAH0020Popup01 
          ref="oPRAH0020Popup01" 
          @closed="afterSaveData"
        /> 
      </div>
      <OZReport :showPop="showOz" :reportName="reportName" :params="printParams" @close="showOz = $event" />
    </v-card-text>
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
    min-height: 400px;
  }
}
</style>
