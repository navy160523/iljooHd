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
  commonSendSMS,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import SAFEA0010Popup from './SAFEA0010Popup.vue'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'

defineOptions({
  name: '30_safety-SAF_E-SAFEA0010',
})

// 작업표준 신규제정에서 팝업 호출시 (RSKBA0010)
const props = defineProps({
  dialog: 'N',
  val1: '',
  half: '',
})

const emit = defineEmits(['close'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)
const empPopup2 = ref(null)
const sAFEA0010Popup = ref(null)
const selectedData = reactive({})

//컴포넌트별 readonly 플래그값
const readOnlyValue = {
  CMPNY_DIV: false,
  BSNS_CD: false,
  DEPT_CD: false,
}

const name = reactive({
  INSERT_EMP_NM: '', // 작성자 이름
  ACT_EMP_NM: '', //조치자이름
  REQ_EMP_NM: '', //요청자이름
})

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DATE_YN: 'Y', //기간 체크박스
  FROM: '', //기간 FROM
  TO: '', //기간 TO
  COMPANY: '', //회사구분
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  ACT_EMP_NO: '', //조치자 사번
  EMP_NO: '', // 요청자 사번
  INSERT_EMP_NO: '', // 작성자 사번
  GBN: '3',
  ACTION_GBN: '',
  TEMP_SAVE:'Y',
  REQ_TYPE:'',
  CHANNEL: '', //
  END_YN: '', //
  USER_ID: userStore.empNo,
})

const codeList = reactive({
  company: [], //회사구분
  bsnscd: [], //사업부
  deptcd: [], //부서
  radiovalue: [
    { TXT: '전체', COD: '' },
    { TXT: '웹 페이지', COD: 'URL' },
    { TXT: '모바일 앱', COD: 'SNS' },
  ],
  gbn: [
    { TXT: '작성자', COD: '1' },
    { TXT: '요청자', COD: '3' },
    { TXT: '조치자', COD: '2' },    
  ],
  actionGbn: [
    { TXT: '전체', COD: '' },
    { TXT: '임시저장', COD: '1' },
    { TXT: '조치 미완료', COD: '2' },
    { TXT: '조치완료', COD: '3' },
  ],
  requesttarget:[],
})

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
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      //부서조회
      queryId: 'searchDept',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ORGN_DIV: 'A',
        BSNS_CD: '',
        ASGN_NM: '',
        DEPT_CD: '',
        HSE_ONLY: '',
        USE_ONLY: 'Y',
      },
    }),
    getCodeList('HHIZF30B'),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnscd = res[1].ORESULT_CUR
    codeList.deptcd = res[2].ORESULT_CUR
    codeList.requesttarget = res[3].ORESULT_CUR
    codeList.company.unshift({ TXT: '전체', COD: '' })
    codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptcd.unshift({ ASGN_SHRT_NM: '전체', ASGN_CD: '' })
    codeList.requesttarget.unshift({ TXT: '전체', COD: '' })
  })
}

//관리자 권한 체크하는 함수
const checkAdmin = () => {
  //관리자면 회사구분,사업부,부서 활성화
  if (userLogStore.isMenuAdmin === 'Y') {
    readOnlyValue.CMPNY_DIV = false
    readOnlyValue.BSNS_CD = false
    readOnlyValue.DEPT_CD = false
  }
  //관리자가 아니면 회사구분,사업부,부서 비활성화 및 본인이 속한 조직만 검색가능
  else {
    readOnlyValue.CMPNY_DIV = true
    //searchParam.COMPANY = userStore.cmpnyDiv
    searchParam.CMPNY_DIV = userStore.cmpnyDiv
    //searchParam.BSNS_CD = userStore.bsnsCd
    //searchParam.DEPT_CD = userStore.deptCd
  }
}

//-1달 ~ 오늘날짜
const defaultDate = () => {
  let today = dayjs()
  let toDay =
    today.get('year') +
    '-' +
    (today.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    today.get('date').toString().padStart(2, '0')
  let fromDay = dayjs().subtract(1, 'month')
  let from =
    fromDay.$y +
    '-' +
    (fromDay.$M + 1).toString().padStart(2, '0') +
    '-' +
    fromDay.$D.toString().padStart(2, '0')
  searchParam.FROM = from
  searchParam.TO = toDay
}

//그리드 속성셋
const grdMainProps = reactive({
  gridViewOption: {},
  fields: [
    {
      fieldName: 'REQ_DATETIME',
      editable: false,
      dataType: 'text',
      width: '110',
      header: { text: t('요구일시') },
    },
    {
      fieldName: 'ASGN_NM',
      editable: false,
      dataType: 'text',
      width: '130',
      styleName: 'left-column',
      header: { text: t('소속') },
    },
    {
      fieldName: 'EMP_NO',
      editable: false,
      dataType: 'text',
      width: '70',
      header: { text: t('사번') },
      visible: false,
    },
    {
      fieldName: 'EMP_NM',
      editable: false,
      dataType: 'text',
      width: '60',
      header: { text: t('성명') },
    },
    {
      fieldName: 'REQ_TYPE_NM',
      editable: false,
      dataType: 'text',
      width: '100',
      header: { text: t('요청대상') },
    },
    {
      fieldName: 'REQ_DESC',
      dataType: 'text',  
      width: '200',
      styleName: 'left-column',    
      header: { text: t('위험내용') },
    },
    {
      fieldName: 'JOB_PLC_NM',
      editable: false,
      dataType: 'text',
      width: '120',
      styleName: 'left-column',
      header: { text: t('장소(기본)') },
    },
    {
      fieldName: 'JOB_PLC_DETAIL',
      editable: false,
      dataType: 'text',
      styleName: 'left-column',
      header: { text: t('장소(상세)') },
    },
    {
      fieldName: 'CHANNEL_NM',
      editable: false,
      dataType: 'text',
      width: '70',
      header: { text: t('등록구분') },
    },    
    {
      fieldName: 'STATUS',
      editable: false,
      dataType: 'text',
      width: '90',
      header: { text: t('상태') },
    },
    {
      fieldName: 'ACTION_DATETIME',
      editable: false,
      dataType: 'text',
      width: '110',
      header: { text: t('조치일시') },
    },
    {
      fieldName: 'ACT_ASGN_NM',
      editable: false,
      dataType: 'text',
      width: '130',
      styleName: 'left-column',
      header: { text: t('소속') },
    },
    {
      fieldName: 'ACT_EMP_NO',
      editable: false,
      dataType: 'text',
      width: '70',
      header: { text: t('사번') },
      visible: false,
    },
    {
      fieldName: 'ACT_EMP_NM',
      editable: false,
      dataType: 'text',
      width: '60',
      header: { text: t('성명') },
    },
    {
      fieldName: 'SLI_ASGN_NM',
      editable: false,
      dataType: 'text',
      width: '130',
      styleName: 'left-column',
      header: { text: t('SLI소속') },
    },
    {
      fieldName: 'INSERT_USER_ID',
      editable: false,
      dataType: 'text',
      width: '70',
      header: { text: t('사번') },
      visible: false,
    },    
    {
      fieldName: 'INSERT_EMP_NM',
      editable: false,
      dataType: 'text',
      width: '60',
      header: { text: t('성명') },
    },
    {
      fieldName: 'INSERT_DATE',
      editable: false,
      dataType: 'text',
      width: '120',
      header: { text: t('작성일시') },
    },
    {
      fieldName: 'APPLY_YN',
      editable: false,
      visible: false,
      dataType: 'text',
      width: '60',
      header: { text: t('조치완료') },
    },
    {
      fieldName: 'INSERT_ASGN_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'APPLY_DATE',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACTION_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACTION_DIV_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACTION_ETC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACTION_ETC_DESC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACTION_DATE',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACTION_DESC',
      dataType: 'text',
      visible: false,
      header: { text: t('조치내용') },
    },
    {
      fieldName: 'ACTION_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACTION_TIME',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_COMPANY',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'APPLY_EMP',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHANNEL',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'INSERT_DT',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JOB_LPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JOB_MPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JOB_PLC_FULL_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'JOB_SPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REGIST_DATE',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REGIST_EMP',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REL_RULE_L',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REL_RULE_S',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REQ_DATE',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },    
    {
      fieldName: 'REQ_TIME',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REL_RULE_LNM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REL_RULE_SNM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAVE_YN',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SLI_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SLI_BSNS_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SLI_COMPANY',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SLI_DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ATTACH_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ATTACH_ID2',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'INSERT_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REQ_TYPE',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
  ],
  columnLayout: [
    'REQ_DATETIME',
    'REQ_TYPE_NM',
    'REQ_DESC',
    'JOB_PLC_NM', 
    'JOB_PLC_DETAIL',
    'STATUS',
    'ACTION_DATETIME',
    'CHANNEL_NM',
    {
      name: '요청자/작성자',
      direction: 'horizontal',
      items: ['ASGN_NM', 'EMP_NM'],
      header: { text: t('요청자') },
    },
    'SLI_ASGN_NM',
    {
      name: '조치자',
      direction: 'horizontal',
      items: ['ACT_ASGN_NM', 'ACT_EMP_NM'],
      header: { text: t('조치자') },
    },    
    {
      name: '작성자',
      direction: 'horizontal',
      items: ['INSERT_EMP_NM', 'INSERT_DATE'],
      header: { text: t('작성자') },
    },    
    'APPLY_YN',
    'ACTION_DESC',    
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  defaultDate()
  initCodeList()
  checkAdmin() //관리자 권한 체크 2025.04.10 윤찬양책임 요청으로 주석해제
  //초기조회조건값 세팅
  // searchParam.EMP_NO = userStore.empNo
  // name.EMP_NM = userStore.empNm

  //searchParam.ACT_EMP_NO = userStore.empNo //조치자 기본값 로그인 유저 사번
  //name.ACT_EMP_NM = userStore.empNm

  searchParam.DATE_YN = 'Y' //기간 체크박스 기본값 체크
  searchParam.END_YN = 'N' //기간 체크박스 기본값 미체크
  searchParam.CHANNEL = '' //등록구분 라디오그룹 기본값 전체

  // 작업표준 신규제정에서 팝업으로 호출시 -------------//
  if (props.dialog == 'Y') {
    menuTitle.value.setBtnProperty('btnCreate', 'visible', false)
    menuTitle.value.setBtnProperty('btnExtraction', 'visible', false)
    menuTitle.value.setBtnProperty('btnClose', 'visible', true)

    searchParam.FROM = props.half.from
    searchParam.TO = props.half.to

    //console.log('props.val1 = ', props.val1)

    searchParam.CMPNY_DIV = props.val1.COMPANY_CD
    searchParam.BSNS_CD = props.val1.BSNS_CD_ORIGIN
    searchParam.DEPT_CD = props.val1.DEPT_CD
  } else menuTitle.value.setBtnProperty('btnClose', 'visible', false)
  //-------------------------------------------------//

  onButtonsClick({ id: 'btnSearch' })
})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnCreate') {
    sAFEA0010Popup.value.addPopup()
  } else if (btn.id === 'btnClose') {
    emit('close', false)
  } else {
    //엑셀추출
    let now = dayjs()
    let title = '안전작업요구권_'
    let fullTitle =
      title +
      now.$y +
      (now.$M + 1).toString().padStart(2, '0') +
      now.$D.toString().padStart(2, '0') +
      now.$H.toString().padStart(2, '0') +
      now.$m.toString().padStart(2, '0') +
      now.$s.toString().padStart(2, '0')
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      fileName: fullTitle,
      progressMessage: '엑셀 다운로드중입니다.',
      showProgress: true,
      indicator: 'visible',
      header: 'visible',
      footer: 'hidden',
      allColumns: true,
    })
  }
}

//조회관련 로직시작
const searchData = () => {
  console.log(searchParam)
  return commonSearchApi({
    queryId: 'SAFEA0010_SEARCH01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  //console.log('조회값', res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//조회관련 로직 끝

//회사가 바뀌면 회사에 맞는 사업부 가져옴
//회사 바뀌면 사업부 가져옴 (회사변경 감지)
watch(
  () => searchParam.CMPNY_DIV,
  (newValue, oldValue) => {
    if (newValue === '') {
      searchParam.BSNS_CD = ''
      searchParam.DEPT_CD = ''
      codeList.bsnscd = []
      codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      codeList.deptcd = []
      codeList.deptcd.unshift({ ASGN_SHRT_NM: '전체', ASGN_CD: '' })
      return false
    }
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: newValue },
    }).then((res) => {
      searchParam.BSNS_CD = ''
      codeList.bsnscd = res.ORESULT_CUR
      codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    })
  }
)

//사업부변경 감지
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    if (newValue === '') {
      searchParam.DEPT_CD = ''
      codeList.deptcd = []
      codeList.deptcd.unshift({ ASGN_SHRT_NM: '전체', ASGN_CD: '' })
      return false
    }
    commonSearchApi({
      queryId: 'searchDept',
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
        ORGN_DIV: 'A',
        BSNS_CD: newValue,
        ASGN_NM: '',
        DEPT_CD: '',
        HSE_ONLY: '',
        USE_ONLY: 'Y',
      },
    }).then((res) => {
      searchParam.DEPT_CD = ''
      codeList.deptcd = res.ORESULT_CUR
      codeList.deptcd.unshift({ ASGN_SHRT_NM: '전체', ASGN_CD: '' })
    })
  }
)

//로우 더블클릭시 상세정보 팝업 출력
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  sAFEA0010Popup.value.openPopup(data)
}

//로우클릭시 해당로우 정보 get
const onCellClicked = (grid, clickData) => {
  let rowData = grdMain.value.getFocusedRowData()
  selectedData.value = rowData
}

//조치자 인원팝업 오픈
const openActEmpPopup = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: name.EMP_NM,
  })
}

//조치자 선택 이벤트
const onActEmpSelected = (val) => {
  searchParam.CMPNY_DIV = val.CMPNY_DIV
  searchParam.BSNS_CD = val.BSNS_CD
  searchParam.DEPT_CD = val.DEPT_CD
  searchParam.EMP_NO = val.EMP_NO
  name.EMP_NM = val.EMP_NM
}

//조치자 내부 X아이콘 클릭시 조치자 사번,성명 초기화
const clearInsert = () => {
  // searchParam.CMPNY_DIV = ''
  // searchParam.BSNS_CD = ''
  // searchParam.DEPT_CD = ''
  searchParam.EMP_NO = ''
  name.EMP_NM = ''
}

//팝업 닫혔을때 조회
const closedPopup = () => {
  onButtonsClick({ id: 'btnSearch' })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="props.dialog == 'Y' ? '' : $t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnExtraction', 'btnClose']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <VCheckbox
              true-value="Y"
              false-value="N"
              v-model="searchParam.DATE_YN"
            ></VCheckbox>
            <i-input
              label-width="30px"
              :label="$t('기간')"
              type="date"
              width="180px"
              v-model="searchParam.FROM"
              required
            />
            <i-input 
              label-width="20px" 
              :label="$t('~')" 
              width="170px" 
              type="date" 
              v-model="searchParam.TO" 
            />
            <i-select
            class="mr-1"
              label-width="50px"
              width="200px"
              :label="$t('조치구분')"
              v-model="searchParam.ACTION_GBN"
              :items="codeList.actionGbn"
              item-title="TXT"
              item-value="COD"
            />
            <VCheckbox
                class="ml-0 mr-2"                
                label="임시저장 포함"
                true-value="Y"
                false-value="N"
                v-model="searchParam.TEMP_SAVE"
              ></VCheckbox>
            <i-select
              class="ml-4"
              label-width="50px"
              width="200px"
              :label="$t('요청대상')"
              v-model="searchParam.REQ_TYPE"
              :items="codeList.requesttarget"
              item-title="TXT"
              item-value="COD"
            />
            <div class="d-flex ga-2">
              <p class="mt-1 mr-4" style="color: #222">{{ t('등록구분') }}</p>
              <VRadioGroup v-model="searchParam.CHANNEL" inline>
                <VRadio
                  v-for="(item, index) in codeList.radiovalue"
                  :label="item.TXT"
                  :value="item.COD"
                  :key="index"
                ></VRadio>
              </VRadioGroup>
              <!--<VCheckbox
                class="ml-4"
                label="조치 미완료 건"
                true-value="Y"
                false-value="N"
                v-model="searchParam.END_YN"
              ></VCheckbox>-->
            </div>
          </div>
          <div class="d-flex mt-2">
            <div class="d-flex ga-2 mr-5 mt-1">
              <p class="mt-1 mr-4" style="color: #222">{{ t('구분') }}</p>
              <VRadioGroup v-model="searchParam.GBN" inline>
                <VRadio
                  v-for="(item, index) in codeList.gbn"
                  :label="item.TXT"
                  :value="item.COD"
                  :key="index"
                ></VRadio>
              </VRadioGroup>
            </div>
            <i-select
              label-width="50px"
              width="240px"
              :label="$t('회사구분')"
              :disabled="readOnlyValue.CMPNY_DIV"
              v-model="searchParam.CMPNY_DIV"
              :items="codeList.company"
              item-title="TXT"
              item-value="COD"              
            />
            <i-select
              label-width="40px"
              width="210px"
              :label="$t('사업부')"
              :disabled="readOnlyValue.BSNS_CD"
              v-model="searchParam.BSNS_CD"
              :items="codeList.bsnscd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
            />
            <i-select
              label-width="30px"
              width="230px"
              :label="$t('부서')"
              :disabled="readOnlyValue.DEPT_CD"
              v-model="searchParam.DEPT_CD"
              :items="codeList.deptcd"
              item-title="ASGN_SHRT_NM"
              item-value="ASGN_CD"
            />
            <!--<i-select
              label-width="30px"
              width="200px"
              :label="$t('구분')"
              v-model="searchParam.GBN"
              :items="codeList.gbn"
              item-title="TXT"
              item-value="COD"
            />-->
            <i-input
              label-width="30px"
              :label="$t('성명')"
              width="200px"
              v-model="name.EMP_NM"
              readonly
            >
              <template v-slot:append-inner>
                <v-icon @click="openActEmpPopup" icon="mdi-magnify" />
                <v-icon
                  color="error"
                  @click="clearInsert"
                  icon="mdi-window-close"
                />
              </template>
            </i-input>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-1"
            style="height: calc(100vh - 340px)"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="onActEmpSelected"></EmpPopup>
  <SAFEA0010Popup ref="sAFEA0010Popup" @closed="closedPopup"></SAFEA0010Popup>
</template>
