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
  selectFunction,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import SAFCD0010Tab03Popup01 from './SAFCD0010Tab03Popup01_ELEC.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

import EmpPopup from '@/components/popup/EmpPopup.vue'
defineOptions({
  name: '30_safety-SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const sAFCD0010Tab03Popup01 = ref(null)
const mngEmpPopup = ref(null)
const checkEmpPopup = ref(null)
const { sliSAFCD0010Tab03 } = history.state
const isMounted = ref(false)
const foc_data = ref({})
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  WORK_DATE_FROM: '', //점검일자FROM
  WORK_DATE_TO: '', //점검일자 TO
  BSNS_CD: userStore.bsnsCd, //작업사업부
  DEPT_CD: userStore.deptCd, //작업부서
  ASGN_CD: '', //협력사
  ASGN_YN: 'N', //협력사포함 여부
  MNGR_EMP_NO: '', //관리감독자
  CHECK_EMP_NO: '', //점검자
  YARD_APP_YN: 'N', //3중점검여부
  SHIP_NO: '', //호선
  DN_DIV: '', // 주야구분
})

//사용자에게 보여지기만 하고 조회조건에는 포함되지 않는 값들
const showValue = reactive({
  MNG_CHECK_EMP_NM: '', //관리감독자 이름
  CHECK_EMP_NM: '', //점검자 이름
})

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  WRK_PLC: [],
  ASGN_CD: [], //협력사
  SHIP_NO: [], //호선
  DN_DIV : [{ TXT: '전체', COD: '' },{ TXT: '주간', COD: 'D' },{ TXT: '야간', COD: 'N' }]
})

const readOnlyValue = reactive({
  BSNS_CD: false, //테스트하려고 false로함 나중에 true로 변경해야함 2024.07.05 김현재 작성
  DEPT_CD: false,
  ASGN_CD: true, //협력사 셀렉트박스 disable 플래그값
})

//그리드 속성셋팅
const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'WORK_DATE',
      dataType: 'text',
      editable: false,
      header: { text: t('작업일') },
    },
    {
      fieldName: 'WORK_TIME',
      dataType: 'text',
      editable: false,
      header: { text: t('작업시간') },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('부서') },
    },
    {
      fieldName: 'ASGN_FULL_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('조직') },
      styleName: 'left-column',
    },
    {
      fieldName: 'VEND_NM',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('협력사명') },
      styleName: 'left-column',
    },    
    {
      fieldName: 'AREA_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('기본') },
    },
    {
      fieldName: 'AREA_DETAIL',
      dataType: 'text',
      editable: false,
      header: { text: t('상세') },
    },
    {
      fieldName: 'DANG_DIV_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('위험작업분류') },
    },

    {
      fieldName: 'CF_DIV_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('허가구분') },
    },
    {
      fieldName: 'CHECK_CURRENT',
      dataType: 'text',
      editable: false,
      header: { text: t('점검현황') },
    },
    {
      fieldName: 'CHECK_DIV',
      dataType: 'text',
      editable: false,
      header: { text: t('점검여부') },
    },
   
    {
      fieldName: 'WORK_ID',
      dataType: 'text',
      editable: false,
      width: '150',
      visible: false,
      header: { text: t('작업지시No') },
    },
    // {
    //   fieldName: 'SHORT_WORK_NO',
    //   dataType: 'text',
    //   editable: false,
    //   width: '100',
    //   header: { text: t('단기공사여부') },
    // },
    {
      fieldName: 'GROUP_A',
      dataType: 'text',
      renderer: {
        type: 'check',
        trueValues: '0',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        var groupA = grid.getValue(dataCell.index.itemIndex, 'GROUP_A')
        if (groupA === '0') {
          ret.renderer = { type: 'check', readonly: true }
        } else {
          ret.renderer = { editable: false }
        }
        return ret
      },

      // displayCallback: function (grid, dataCell) { 

      //   if (!dataCell || !dataCell.index || dataCell.index.itemIndex === undefined) {
      //     return '';  // 기본 빈 문자열 반환
      //   }
      //   var value = grid.getValue(dataCell.index.itemIndex, 'GROUP_A');
      //     return value === '0' ? '0' : 'N';
      // }
      //,

      header: { text: t('관리감독자') },
    },
    
    {
      fieldName: 'GROUP_B',
      dataType: 'text',
      visible: false, 
      renderer: {
        type: 'check',
        trueValues: '1',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        var groupB = grid.getValue(dataCell.index.itemIndex, 'GROUP_B')
        if (groupB === '1') {
          ret.renderer = { type: 'check', readonly: true }
        } else {
          ret.renderer = { editable: false }
        }
        return ret
      },
      header: { text: t('세잎클로버/협안') },
    },
    {
      fieldName: 'GROUP_C',
      dataType: 'text',
      
      renderer: {
        type: 'check',
        trueValues: '2',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        var groupC = grid.getValue(dataCell.index.itemIndex, 'GROUP_C')
        if (groupC === '2') {
          ret.renderer = { type: 'check', readonly: true }
        } else {
          ret.renderer = { editable: false }
        }
        return ret
      },
      header: { text: t('안전요원') },
    },
    {
      fieldName: 'GROUP_D',
      dataType: 'text',
      renderer: {
        type: 'check',
        trueValues: '3',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        var groupD = grid.getValue(dataCell.index.itemIndex, 'GROUP_D')
        if (groupD === '3') {
          ret.renderer = { type: 'check', readonly: true }
        } else {
          ret.renderer = { editable: false }
        }
        return ret
      },

      header: { text: t('기타') },
      visible: false, 
    },

    {
      fieldName: 'WORK_TITLE',
      dataType: 'text',
      width: '200',
      editable: false,
      styleName: 'left-column',
      header: { text: t('작업명') },
    },
    {
      fieldName: 'WRK_PLC',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      visible: false, 
      editor: {
        type: 'dropdown',
      },
      header: { text: t('공종/계열') },
    },
    {
      fieldName: 'DGR_TYPE_CODES',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('위험유형') },
    },
    {
      fieldName: 'RESP_EMP_NM',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('작업책임자(정)-이름') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('소속부서') },
    },
    {
      fieldName: 'RESP_EMP_NO',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('작업책임자(정)-사번') },
    },
    {
      fieldName: 'MNGR_EMP_NO',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('관리감독자-사번') },
    },
    {
      fieldName: 'MNGR_EMP_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('관리감독자') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('사업장') },
    },
    {
      fieldName: 'DANG_DIV',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('위험작업 분류') },
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('소속조직(사내 or 사외업체)') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('사업본부') },
    },
    {
      fieldName: 'CF_DIV',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('대면/현장허가 여부') },
    },
    {
      fieldName: 'PLC_TYPE',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('장소구분') },
    },
    {
      fieldName: 'SHPNO',
      dataType: 'text',
      editable: false,
      visible: false, 
      header: { text: t('호선') },
    },
    {
      fieldName: 'P_WRK_ID',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('PTW대상 ID') },
    },
    {
      fieldName: 'SHORT_WORK_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('단기공사 여부') },
    },
     {
      fieldName: 'RCV_NO',
      dataType: 'text',
      editable: false,
      width: '180',
      visible: true,
      header: { text: t('허가서 번호') },
    },
  ],
  columns: [],
  columnLayout: [
    'WORK_DATE',
    'WORK_TIME',
    'BSNS_NM',
    'DEPT_NM',
    'ASGN_FULL_NM',
    'VEND_NM',
    'SHPNO',
    {
      name: '장소',
      direction: 'horizontal',
      items: ['AREA_NM', 'AREA_DETAIL'],
    },
    {
      name: '작업',
      direction: 'horizontal',
      items: [
        'MNGR_EMP_NM',
        'WORK_TITLE',
        'WRK_PLC',
        'DANG_DIV_NM',
        'CF_DIV_NM',
        'CHECK_DIV',
      ],
    },
    'WORK_ID',
    'SHORT_WORK_YN',
    'CHECK_CURRENT',
    {
      name: '점검여부',
      direction: 'horizontal',
      items: ['GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D'],
    },    
    'RCV_NO',
  ],
})

grdMainProps.columns = grdMainProps.fields

const initCodeList = async () => {
  await Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParam.BSNS_CD,
        USE_DIV: 'Y',
      },
    }), // 부서
    getCodeList('HHIE150'),
    //협력사
    commonSearchApi({
      queryId: 'searchVend',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParam.BSNS_CD,
        DEPT_CD: searchParam.DEPT_CD,
      },
    }),
    //호선조회
    commonSearchApi({ queryId: 'SAFCD0010_ELEC_SEARCH81', param: {} }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    //codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' }) --2024.08.21 김현재 작성(한민규 매니저와 협의해서) DB부하로인한 사업부 전체 제외
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.WRK_PLC = res[2].ORESULT_CUR
    codeList.ASGN_CD = res[3].ORESULT_CUR
    codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    codeList.SHIP_NO = res[4].ORESULT_CUR
    codeList.SHIP_NO.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('WRK_PLC', codeList.WRK_PLC, 'COD', 'TXT')
  })
}

const setSliParams = () => {
  if(sliSAFCD0010Tab03 !== undefined) {
    searchParam.WORK_DATE_FROM = sliSAFCD0010Tab03.FROM_DT
    searchParam.WORK_DATE_TO = sliSAFCD0010Tab03.TO_DT
    searchParam.BSNS_CD = sliSAFCD0010Tab03.BSNS_CD
    searchParam.DEPT_CD = sliSAFCD0010Tab03.DEPT_CD
  }
}

onMounted(async () => {
  defaultDate()
  setSliParams()
  await initCodeList()
  checkSafeTyManage()
  checkVend()
  onButtonsClick({ id: 'btnSearch' })

  menuTitle.value.disableBtn('btnRegist', true) //등록버튼 비활성화
  grdMain.value.getGridView().filterPanel.visible = true
  grdMain.value.getGridView().setFocus(0) //행 0으로

  isMounted.value = true
})

//로그인 유저가 협력사이면 협력사여부 체크박스에 자동체크
const checkVend = () => {
  //2024.09.23 기본값 체크상태로 변경
  // if (userStore.userDiv === 'B') {
  //   searchParam.ASGN_YN = 'Y'
  // }
  searchParam.ASGN_YN = 'Y'
}

//디폴트 날짜 설정 오늘~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //오늘날짜
  let date = dayjs()
  searchParam.WORK_DATE_FROM =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')

  searchParam.WORK_DATE_TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

//메뉴버튼
const onButtonsClick = (btn) => {
    if (btn.id === 'btnSearch') {
      new queryFlowHelper(vm, t)
        .setBefore(beforeSearch)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
    } 
  
    // 출력
    else if (btn.id === 'btnPrint') {
        onExceldown()
    }
  
    else {
    let data = grdMain.value.getFocusedRowData()

    // let today = dayjs();
    // if (today.diff(dayjs(data.WORK_DATE), 'day') >= 7 ){
    //   Message.warn(t('일주일 이전의 데이터는 수정 불가능합니다.'))
    //   return false
    // }
    
    console.log('포커스 데이터 ', foc_data.value)
    sAFCD0010Tab03Popup01.value.openPopup(foc_data.value)
  }

}
//그리드 셀 더블클릭 이벤트 (수정)
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  foc_data.value = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  console.log('data', data)
  console.log('Test', foc_data.value)


  //  let today = dayjs();

  // if (today.diff(dayjs(data.WORK_DATE), 'day') >= 7 ){
  //   Message.warn(t('일주일 이전의 데이터는 수정 불가능합니다.'))
  //   return false

  // }

  if ((data.GROUP_A === 'N') && (data.GROUP_B === 'N')  && (data.GROUP_C === 'N')  && (data.GROUP_D === 'N') ) {
    Message.warn(t('점검내역이 없어 수정할 수 없습니다.'))
    return false
  } else {
    sAFCD0010Tab03Popup01.value.openPopup2(data)
  }





}

//조회관련 로직 시작
const beforeSearch = () => {
  let from = dayjs(searchParam.WORK_DATE_FROM)
  let to = dayjs(searchParam.WORK_DATE_TO)
  let dayDiff = to.diff(from, 'day')

  let PeroidLimit = 7

  // 안전과 admin 그룹만 가능 
  if (userStore.authGrpCd.includes('GRP00381')|| userStore.authGrpCd.includes('HIWAYGRP00001') ) {
    PeroidLimit = 30
  }


  if (dayDiff > PeroidLimit) {

    // Message.warn( t( `조회기간은 최대 ${PeroidLimit}일 입니다.`))

    // return false
  }


  return true
}

const searchData = () => {
  // grdMain.value.getGridView().filterPanel.clearInput()
  return commonSearchApi({
    queryId: searchParam.BSNS_CD === 'AE00' ? 'SAFCD0010_SEARCH07_AE00' : 'SAFCD0010_ELEC_SEARCH07',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  setFontStyle()
}

const setFontStyle = () => {
  //  스타일 지정
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    if (dataCell.value === '점검 완료') {
      ret.style = { color: '#1A40C7' } // ret.style = {background:"#ffff00"} 직접 스타일 적용 가능
    } else if (dataCell.value === '점검 진행중') {
      ret.style = { color: '#009900' }
    } else {
      ret.style = { color: '#000000' }
    }
    return ret
  })
}

//조회관련 로직 끝

//행변경시 작업에 대한 점검결과를 등록한 사람이 있는지 확인
//점검결과를 등록한 사람이 있으면 등록버튼 비활성화, 등록한 사람이 없으면 등록버튼 활성화
const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
  
  let data = grdMain.value.getDataProvider().getJsonRow(newIdx)
  foc_data.value = grdMain.value.getDataProvider().getJsonRow(newIdx)
  console.log('FOCUS', foc_data.value)
  //점검결과를 등록한 사람을 조회 등록한사람이 있으면 등록버튼 비활성화
  let param = {
    CMPNY_DIV: data.CMPNY_DIV,
    WORK_ID: data.WORK_ID,
    RCV_NO: data.RCV_NO,
  }
  commonSearchApi({
    queryId: 'SAFCD0010_ELEC_SEARCH92',
    param: param,
  }).then((res) => {
    let checkEmp = res.ORESULT_CUR.filter(
      (x) => x.CHECK_EMP_NO === userStore.userId
    )
    console.log('checkEmp', checkEmp)
    if (checkEmp.length > 0) {
      menuTitle.value.disableBtn('btnRegist', true) //등록버튼 비활성화
      return false
    } else {
      menuTitle.value.disableBtn('btnRegist', false) //등록버튼 활성화
    }
  })

  //2024.06.14김현재작성 로그인유저가 관리감독자,세잎클로버,안전요원,기타일때 등록버튼 활성화로직 제거
  //추후 필요시 추가요망
  // if (data.MNGR_EMP_NO === userStore.empNo) {
  //   menuTitle.value.disableBtn('btnRegist', false) //등록버튼 활성화
  // }
  // //로그인유저가 세잎클로버일때
  // else if (userStore.authGrpCd.includes('GRP00393')) {
  //   menuTitle.value.disableBtn('btnRegist', false) //등록버튼 활성화
  // }
  // //로그인유저가 안전경영부일때 (안전요원)
  // else if (userStore.deptCd === 'N090' && userStore.bsnsCd === 'AN00') {
  //   menuTitle.value.disableBtn('btnRegist', false) //등록버튼 활성화
  // } else {
  //   menuTitle.value.disableBtn('btnRegist', true) //등록버튼 비활성화
  // }
}

//로그인 유저가  IT관리자,안전직원인지 확인하는 함수
const checkSafeTyManage = () => {
  //로그인 유저가  IT관리자,안전직원인지 확인
  if (
    userStore.authGrpCd.includes('GRP00381') ||
    userStore.authGrpCd.includes('GRP00369')
  ) {
    readOnlyValue.BSNS_CD = false
    readOnlyValue.DEPT_CD = false
  }
}

//관리감독자 인원 팝업 오픈 이벤트
const mngEmpOpenPopup = () => {
  mngEmpPopup.value.openPopup({
    EMP_NM: showValue.MNG_CHECK_EMP_NM,
  })
}

//관리감독자 선택 이벤트
const selectedMngEmp = (val) => {
  showValue.MNG_CHECK_EMP_NM = val.EMP_NM
  searchParam.MNGR_EMP_NO = val.EMP_NO
}

//점검자 인원 팝업 오픈 이벤트
const checkEmpOpenPopup = () => {
  checkEmpPopup.value.openPopup({
    EMP_NM: showValue.CHECK_EMP_NM,
  })
}

//점검자 인원 선택 이벤트
const selectedCheckEmp = (val) => {
  showValue.CHECK_EMP_NM = val.EMP_NM
  searchParam.CHECK_EMP_NO = val.EMP_NO
}

//팝업 닫혔을때 재조회
const closedPopup = () => {
  console.log('이거탐?')
  
  // 운찬양/박용섭 책임 요청으로 닫기시 재조회 해제
   onButtonsClick({ id: 'btnSearch' })
}


// 엑셀다운
const onExceldown = () => {
  grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: 'PTW 점검내역_' + searchParam.WORK_DATE_FROM +'_'+  searchParam.WORK_DATE_TO+ '.xlsx', // 저장될 파일 name
      // documentTitle: { 
      //    //제목
      //   //message: "",
      //   visible: true,
      //   spaceTop: 1,
      //   spaceBottom: 0,
      //   height: 50,
      //   styleName: "excelTitle",
      // },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      indicator: 'hidden', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: true, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    })

}

//사업부변경 감지
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    if(isMounted.value) {
      console.log('newValue', newValue)
      commonSearchApi({
        queryId: 'searchDept3',
        param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
      }).then((res) => {
        if (oldValue) {
          searchParam.DEPT_CD = ''
          codeList.DEPT_CD = res.ORESULT_CUR
          codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        } else {
          codeList.DEPT_CD = res.ORESULT_CUR
          codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        }
      }) // 부서
    }
  }
)

//관리감독자 이름 변경시 관리감독자 사번 초기화
watch(
  () => showValue.MNG_CHECK_EMP_NM,
  (newValue, oldValue) => {
    if (!oldValue) {
      return false
    }
    searchParam.MNGR_EMP_NO = ''
  }
)
//점검자 이름 변경시 점검자 사번 초기화
watch(
  () => showValue.CHECK_EMP_NM,
  (newValue, oldValue) => {
    if (!oldValue) {
      return false
    }
    searchParam.CHECK_EMP_NO = ''
  }
)

//부서변경감지
//부서변경시 부서에 해당하는 협력사  조회
watch(
  () => searchParam.DEPT_CD,
  (newValue, oldValue) => {
    if(isMounted.value) {
      commonSearchApi({
        queryId: 'searchVend',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: searchParam.BSNS_CD,
          DEPT_CD: newValue,
        },
      }).then((res) => {
        searchParam.ASGN_CD = ''
        codeList.ASGN_CD = res.ORESULT_CUR
        codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      })
    }
  }
)

//협력사 포함 체크박스 감지
//체크가되면 협력사 셀렉트박스 활성화
//체크가 해제되면 협력사 셀렉트박스 비활성화
watch(
  () => searchParam.ASGN_YN,
  (newValue) => {
    if (newValue === 'Y') {
      readOnlyValue.ASGN_CD = false
    } else {
      readOnlyValue.ASGN_CD = true
    }
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnRegist', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              label-width="60px"
              :label="$t('작업기간')"
              type="date"
              width="210px"
              v-model="searchParam.WORK_DATE_FROM"
              class="mr-0"
              required
            />
            <span class="mx-2 mt-1">~</span>
            <i-input
              type="date"
              width="155px"
              class="ml-0"
              v-model="searchParam.WORK_DATE_TO"
              required
            />
            <i-select
              label-width="80px"
              :label="$t('사업부')"
              width="250px"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              v-model="searchParam.BSNS_CD"
              :readonly="readOnlyValue.BSNS_CD"
              required
            />
            <i-select
              label-width="40px"
              :label="$t('부서')"
              width="250px"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              v-model="searchParam.DEPT_CD"
              :readonly="readOnlyValue.DEPT_CD"
            />

            <i-select
              label-width="50px"
              :label="$t('협력사')"
              width="250px"
              :items="codeList.ASGN_CD"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              v-model="searchParam.ASGN_CD"
              :disabled="readOnlyValue.ASGN_CD"
            >
            </i-select>
            <v-checkbox
              label="협력사 포함"
              true-value="Y"
              false-value="N"
              class="mr-2"
              style="margin-top: 3px"
              v-model="searchParam.ASGN_YN"
            >
            </v-checkbox>
          </div>

          <div class="d-flex mt-2">
            <i-input
              :label="$t('관리감독자')"
              append-inner-icon="mdi-magnify"
              width="210px"
              @click:appendInner="mngEmpOpenPopup"
              @keydown.enter="mngEmpOpenPopup"
              v-model="showValue.MNG_CHECK_EMP_NM"
            >
            </i-input>
            <i-input
              :label="$t('점검자')"
              width="160px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="checkEmpOpenPopup"
              @keydown.enter="checkEmpOpenPopup"
              v-model="showValue.CHECK_EMP_NM"
            >
            </i-input>
            <i-select
              label-width="80px"
              v-model="searchParam.SHIP_NO"
              :label="$t('호선/프로젝트')"
              :items="codeList.SHIP_NO"
              item-title="TXT"
              item-value="COD"              
              width="250px"
              v-if="false"
            >
            </i-select>
            <i-select
              label-width="80px"
              v-model="searchParam.DN_DIV"
              :label="$t('주/야구분')"
              :items="codeList.DN_DIV"
              item-title="TXT"
              item-value="COD"
              width="250px"
            />

            <v-checkbox
              label="3중점검여부"
              true-value="Y"
              false-value="N"
              class="mr-2"
              style="margin-top: 3px"
              v-model="searchParam.YARD_APP_YN"
              v-if="false"
            >
            </v-checkbox>
            <span style="font-size: 15px; font-weight: bold; color: red" class="mt-2"
                ><!--※ 단기공사 PTW의 경우 3중점검 대상에서 제외 -->
            </span>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <IGridTitle :title="$t('위험작업허가 점검 현황')">
            <template v-slot:editors
              ><span style="font-size: 15px; font-weight: bold; color: red"
                ><!--※ 3중점검 대상은 3중 점검 주체 중 점검 결과 기입 시 점검 진행중으로 표시(기타 그룹 제외) / ※ 3중점검 미대상은 관리감독자, 세잎클로버/협안, 기타 그룹 중 점검 결과 기입 시 점검 완료(안전요원 제외) -->
              </span>
            </template>
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCurrentRowChanged="onCurrentRowChanged"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SAFCD0010Tab03Popup01
    ref="sAFCD0010Tab03Popup01"
    @closePopup="closedPopup"
  ></SAFCD0010Tab03Popup01>
  <EmpPopup ref="mngEmpPopup" @selected="selectedMngEmp"></EmpPopup>
  <EmpPopup ref="checkEmpPopup" @selected="selectedCheckEmp"></EmpPopup>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 280px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
