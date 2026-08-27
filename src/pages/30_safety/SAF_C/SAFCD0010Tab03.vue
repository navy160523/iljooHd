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
import SAFCD0010Tab03Popup01_NEW from './SAFCD0010Tab03Popup01_NEW.vue'
import SAFCD0010Tab03Popup01_TYPE_E from './SAFCD0010Tab03Popup01_TYPE_E.vue'
import SAFCD0010Tab03Popup02 from './SAFCD0010Tab03Popup02.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

import EmpPopup from '@/components/popup/EmpPopup.vue'
import OZReport from '@/components/OZReport.vue'

defineOptions({
  name: '30_safety-SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const sAFCD0010Tab03Popup01_NEW = ref(null)
const sAFCD0010Tab03Popup01_TYPE_E = ref(null)
const sAFCD0010Tab03Popup02 = ref(null)
const mngEmpPopup = ref(null)
const checkEmpPopup = ref(null)
const { sliSAFCD0010Tab03 } = history.state
const { routerSAFCD0010Tab03 } = history.state
const isMounted = ref(false)
const foc_data = ref({})

const showDeletePop = ref(false)
const CancelRemark = ref('')
const reportName = ref('/manage/hse/SAFCD0010Tab3_2.ozr')
const reportParam = ref([])
const showOz = ref(false)
const isMulti = ref(true)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,  // 사업장구분
  WORK_DATE_FROM: '',             // 점검일자FROM
  WORK_DATE_TO: '',               // 점검일자 TO
  BSNS_CD: userStore.bsnsCd,      // 작업사업부
  DEPT_CD: userStore.deptCd,      // 작업부서
  ASGN_CD: '',                    // 협력사
  ASGN_YN: 'N',                   // 협력사포함 여부
  MNGR_EMP_NO: '',                // 관리감독자
  CHECK_EMP_NO: '',               // 점검자
  YARD_APP_YN: 'N',               // 3중점검대상
  SHIP_NO: '',                    // 호선
  DN_DIV: '',                     // 주야구분
  DEPT_GBN: '2',                  // 조회 조직 구분
  REL_DEPT_CD: '',                // 안전부
  REL_GWA_CD: '',                 // 안전과
  REL_TEAM_CD: '',                // 안전팀
  PRINT_DIV:'',
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
  DN_DIV : [{ TXT: '전체', COD: '' },{ TXT: '주간', COD: 'D' },{ TXT: '야간', COD: 'N' }],
  DEPT_GBN: [{ TXT: '일반 기준', COD: '2' }, { TXT: '안전조직 기준', COD: '1' }],
  REL_DEPT_CD : [],
  REL_GWA_CD : [],
  REL_TEAM_CD : [],
  CHECK_TYPE : [],
  PRINT_DIV: [],
})


const open_check_info = () => {

  sAFCD0010Tab03Popup02.value.openPopup()

}


const readOnlyValue = reactive({
  BSNS_CD: false, //테스트하려고 false로함 나중에 true로 변경해야함 2024.07.05 김현재 작성
  DEPT_CD: false,
  ASGN_CD: true, //협력사 셀렉트박스 disable 플래그값
})

const allCodeList =  reactive({
  DEPT_CD: [],
  GWA_CD: [],
  TEAM_CD: [],
})

const refresh_svg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" 
                stroke="#be2e22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                style="display: block; margin: auto;">
          <path d="M21 3v6h-6"></path>
          <path d="M3 21v-6h6"></path>
          <path d="M3.51 9a9 9 0 0 1 14.36-5.36L21 9"></path>
          <path d="M20.49 15a9 9 0 0 1-14.36 5.36L3 15"></path>
          </svg>`


//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
  {
      fieldName: 'REFRESH',
      editable: false,
      header: { text: t('업데이트') },
      dataType: 'text',
      width: '60',
      renderer: {
        type: 'html',
        callback: (grid, model, field) => {
          return refresh_svg
        },
      },
    },
    {
      fieldName: 'CHECK_TYPE',
      dataType: 'text',
      editable: false,
      width: '180',
      visible: true,
      lookupDisplay: true,
      header: { text: t('점검 유형') },
    },
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
      visible: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('부서') },
    },
    {
      fieldName: 'ASGN_FULL_NM',
      dataType: 'text',
      editable: false,
      width: '200',
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
      width: '200',
      header: { text: t('상세') },
      styleName: 'left-column',
    },
    {
      fieldName: 'DANG_DIV_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('위험작업분류') },
    },
    {
      fieldName: 'WRK_DIST',
      dataType: 'text',
      editable: false,
      width: '200',
      styleName: 'left-column',
      header: { text: t('작업명') },      
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
      fieldName: 'FST_INSERT_DATE',
      dataType: 'text',
      editable: false,
      width: '130',
      header: { text: t('최초점검시간') },
    },
    {
      fieldName: 'CHECK_DIV',
      dataType: 'text',
      editable: false,
      header: { text: t('3중점검 대상') },
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
        trueValues: 'Y',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = { style: {background: undefined}}
        var groupA = grid.getValue(dataCell.index.itemIndex, 'GROUP_A')
        var MIN_RESULT = grid.getValue(dataCell.index.itemIndex, 'MIN_RESULT_A')
        if (groupA === 'Y') {
          ret.renderer = { type: 'check', readonly: true };
          if (MIN_RESULT === '0') { ret.style.background = '#ff8080'} 
        } else {
          ret.renderer = { editable: false }
        }
        return ret
      },
      header: { text: t('관리감독자') },
    },
    
    {
      fieldName: 'GROUP_B',
      dataType: 'text',
      renderer: {
        type: 'check',
        trueValues: 'Y',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = { style: {background: undefined}}
        var groupB = grid.getValue(dataCell.index.itemIndex, 'GROUP_B')
        var MIN_RESULT = grid.getValue(dataCell.index.itemIndex, 'MIN_RESULT_B')
        if (groupB === 'Y') {
          ret.renderer = { type: 'check', readonly: true };
          if (MIN_RESULT === '0') { ret.style.background = '#ff8080'} 
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
        trueValues: 'Y',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = { style: {background: undefined}}
        var groupC = grid.getValue(dataCell.index.itemIndex, 'GROUP_C')
        var MIN_RESULT = grid.getValue(dataCell.index.itemIndex, 'MIN_RESULT_C')
        if (groupC === 'Y') {
          ret.renderer = { type: 'check', readonly: true };
          if (MIN_RESULT === '0') { ret.style.background = '#ff8080'} 
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
        trueValues: 'Y',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = { style: {background: undefined}}
        var groupD = grid.getValue(dataCell.index.itemIndex, 'GROUP_D')
        var MIN_RESULT = grid.getValue(dataCell.index.itemIndex, 'MIN_RESULT_D')
        if (groupD === 'Y') {
          ret.renderer = { type: 'check', readonly: true };
          if (MIN_RESULT === '0') { ret.style.background = '#ff8080'} 
        } else {
          ret.renderer = { editable: false }
        }
        return ret
      },
      header: { text: t('기타') },
    },

    {
      fieldName: 'WORK_TITLE',
      dataType: 'text',
      width: '400',
      editable: false,
      styleName: 'left-column',
      header: { text: t('작업상세') },
    },
    {
      fieldName: 'WRK_PLC',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
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
      width: '170',
      visible: true,
      header: { text: t('허가서 번호') },
    },
    {
      fieldName: 'WORK_ID_NM',
      dataType: 'text',
      editable: false,
      width: '170',
      visible: true,
      header: { text: t('작업지시서 번호') },
    },

    {
      fieldName: 'DELETE_YN',
      dataType: 'text',
      editable: false,
      width: '60',
      visible: true,
      header: { text: t('삭제여부') },
    },

    {
      fieldName: 'DELETE_REASON',
      dataType: 'text',
      editable: false,
      width: '170',
      visible: true,
      header: { text: t('삭제사유') },
    },



    {
      fieldName: 'WORK_ID',
      dataType: 'text',
      editable: false,
      visible: false,
    },




    { fieldName: 'MIN_RESULT_A',      dataType: 'text',      editable: false,      visible: false},
    { fieldName: 'MIN_RESULT_B',      dataType: 'text',      editable: false,      visible: false},
    { fieldName: 'MIN_RESULT_C',      dataType: 'text',      editable: false,      visible: false},
    { fieldName: 'MIN_RESULT_D',      dataType: 'text',      editable: false,      visible: false},
    { fieldName: 'STD_WORK_NM',      dataType: 'text',      editable: false,      visible: false},




  ],
  columns: [],
  columnLayout: [
    'REFRESH',
    'CHECK_TYPE',
    'WORK_DATE',
    'WORK_TIME',
    {
      name: '장소',
      direction: 'horizontal',
      items: ['AREA_NM', 'AREA_DETAIL'],
    },
  
    'SHPNO',
    'ASGN_FULL_NM',
    {
      name: '점검여부',
      direction: 'horizontal',
      items: ['GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D'],
    },  

    'CHECK_CURRENT',
    'FST_INSERT_DATE',
    {
      name: '작업',
      direction: 'horizontal',
      items: [
        'CHECK_DIV',
        'DANG_DIV_NM',
        'WRK_DIST',
        'WORK_TITLE',
        'WRK_PLC',        
        'MNGR_EMP_NM',
        'CF_DIV_NM',

      ],
    },

    'SHORT_WORK_YN',
    'RCV_NO',
    'WORK_ID_NM',
    'DELETE_YN',
    'DELETE_REASON'

  ],
})

grdMainProps.columns = grdMainProps.fields

const initCodeList = async () => {
  await Promise.all([
    //사업부조회
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: userStore.cmpnyDiv } }),

    // 부서
    commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: 'Y' } }), 
    getCodeList('HHIE150'),

    //협력사
    commonSearchApi({ queryId: 'searchVend',param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, DEPT_CD: searchParam.DEPT_CD } }),

    //호선조회
    commonSearchApi({ queryId: 'SAFCD0010_SEARCH81', param: {} }),
    commonSearchApi({ queryId : 'SEARCH_DEPT_SAFE', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV:'Y' } }), // 부서
    commonSearchApi({ queryId : 'OPRAC0010_SEARCH_04', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV:'Y' } }), // 부서
    commonSearchApi({ queryId : 'OPRAC0010_SEARCH_05', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV:'Y' } }), // 부서
    // 점검유형
    getCodeList('HHIP070'),
  ]).then(res => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' }) // 시스템 개선으로 인해 사업부 전체 풀기
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.WRK_PLC = res[2].ORESULT_CUR
    codeList.ASGN_CD = res[3].ORESULT_CUR
    codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    codeList.SHIP_NO = res[4].ORESULT_CUR
    codeList.SHIP_NO.unshift({ TXT: '전체', COD: '' })

    /* var orderList = ['조선안전부', '해양안전부', '엔진기계안전부', '특수선안전과', '자산안전/기획과', '안전경영부', '안전보건지원부' ]
    for(var i = 0; i < orderList.length; i++) {
      for(var j = 0; j < res[5].ORESULT_CUR.length; j++) {
        if(res[5].ORESULT_CUR[j].DEPT_NM.indexOf('안전') !== -1
          && res[5].ORESULT_CUR[j].BSNS_NM === '안전통합경영실' 
          && res[5].ORESULT_CUR[j].DEPT_NM == orderList[i]) {
          allCodeList.DEPT_CD.push(res[5].ORESULT_CUR[j])
        }
      }
    } */

    allCodeList.DEPT_CD = res[5].ORESULT_CUR
    allCodeList.GWA_CD = res[6].ORESULT_CUR
    allCodeList.TEAM_CD = res[7].ORESULT_CUR
    codeList.REL_DEPT_CD = allCodeList.DEPT_CD
      
    // 처음에는 일단 모든 팀 다가져와서 보여준다.
    codeList.REL_GWA_CD = allCodeList.GWA_CD
    codeList.REL_TEAM_CD = allCodeList.TEAM_CD
    codeList.REL_DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD:'' })
    codeList.REL_GWA_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
    codeList.REL_TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })

    codeList.CHECK_TYPE = res[8].ORESULT_CUR

    codeList.PRINT_DIV.unshift(      
      { TXT: '관리감독자', COD: 'A' },
      { TXT: '세잎클로버/협안', COD: 'B' },
      { TXT: '안전요원', COD: 'C' },
      { TXT: '기타', COD: 'D' },
      { TXT: '전체', COD: '' },
    )

    grdMain.value.setBindingColumn('WRK_PLC', codeList.WRK_PLC, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CHECK_TYPE', codeList.CHECK_TYPE, 'COD', 'TXT')
    
    // 로그인 유저 소속이 안전이면 안전조직 기준으로 설정
    //searchParam.DEPT_GBN = userStore.bsnsCd === 'AN00' ? '1' : '2'
  })
}

const setSliParams = () => {
  if(sliSAFCD0010Tab03 !== undefined) {
    searchParam.WORK_DATE_FROM = sliSAFCD0010Tab03.FROM_DT
    searchParam.WORK_DATE_TO = sliSAFCD0010Tab03.TO_DT
    searchParam.BSNS_CD = sliSAFCD0010Tab03.BSNS_CD
    searchParam.DEPT_CD = sliSAFCD0010Tab03.DEPT_CD
    searchParam.YARD_APP_YN = sliSAFCD0010Tab03.YARD_APP_YN
  }
}

const setRouterParams = () => {
  if(routerSAFCD0010Tab03 !== undefined) {
    searchParam.WORK_DATE_FROM = routerSAFCD0010Tab03.FROM_DT
    searchParam.WORK_DATE_TO = routerSAFCD0010Tab03.TO_DT
    searchParam.BSNS_CD = routerSAFCD0010Tab03.BSNS_CD
    searchParam.DEPT_CD = routerSAFCD0010Tab03.DEPT_CD
    searchParam.ASGN_CD = routerSAFCD0010Tab03.ASGN_CD
    searchParam.ASGN_YN = routerSAFCD0010Tab03.ASGN_YN
    searchParam.SHIP_NO = routerSAFCD0010Tab03.SHIP_NO
    searchParam.DN_DIV = routerSAFCD0010Tab03.DN_DIV
    searchParam.YARD_APP_YN = routerSAFCD0010Tab03.THR_YN
    showValue.CHECK_EMP_NM = routerSAFCD0010Tab03.EMP_NM
    searchParam.CHECK_EMP_NO = routerSAFCD0010Tab03.EMP_NO
  }
}

onMounted(async () => {
  defaultDate()
  setSliParams()
  setRouterParams()
  await initCodeList()
  checkSafeTyManage()
  checkVend()
  onButtonsClick({ id: 'btnSearch' })

  //menuTitle.value.disableBtn('btnRegist', true) //등록버튼 비활성화
  grdMain.value.getGridView().filterPanel.visible = true
  grdMain.value.getGridView().setFocus(0) //행 0으로

  //열고정
  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 6,
    })
  })

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

const closeModal = ()  => {
  showDeletePop.value = false
}
    
const onDelete = async()  => {

  if (CancelRemark.value.trim() === '') {
    Message.warn('사유를 입력해주세요.')
    return
  }

  let saveparam = {
    RCV_NO: foc_data.value.RCV_NO,
    WORK_NO: foc_data.value.WORK_ID,
    DELETE_YN: 'Y',
    DELETE_REASON: CancelRemark.value,
    USER_ID: userStore.empNo
  }

  commonExecuteApi({ queryId : 'SAFCD0010_DELETE03', list: [ saveparam ] }).then(res => {
        showDeletePop.value = false
        onButtonsClick({ id: 'btnSearch' })
        return
  })




}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  
  // 전체 리스트 출력
  else if (btn.id === 'btnPrintAllList') {
    const rowCnt = grdMain.value.getDataProvider().getRowCount();

    if (rowCnt <= 0) {
      Message.warn(t("출력할 데이터가 없습니다."));
      return false;
    }
    onExceldown()
  }

  // 출력
  else if (btn.id === 'btnPrint') {
    ozPrint()
  }

  // 삭제
    else if (btn.id === 'btnDelete') {
      if (!userStore.authGrpCd.includes('GRP00380') &&  !userStore.authGrpCd.includes('GRP00431') ){
        Message.warn(t("점검건 삭제는 PTW모듈관리자만 가능합니다."));
        return false;
      }


      // 이 부분에 삭제로직을 넣어야함
      if (foc_data.value.DELETE_YN === 'Y'){
        Message.warn(t("이미 삭제된 건입니다."));
        return false;
      }

      showDeletePop.value = true


  }

  // 등록 
  else if (btn.id === 'btnRegist') {

    if (grdMain.value.getGridView().getCurrent().dataRow === -1) {
      Message.warn(t("고위험작업을 선택 후 누르세요"))
      return
    }

    console.log('foc_data.value.WORK_DATE',foc_data.value.WORK_DATE)
    if (dayjs(getToday()).diff(dayjs(foc_data.value.WORK_DATE), 'day') < 0){
      Message.warn(t('미래의 작업은 미리 점검 할 수 없습니다.'))
      return
    }

    //if (userStore.userId === 'A526166'|| userStore.userId === 'BP16992' || userStore.userId === 'A490342'){
    if(foc_data.value.CHECK_TYPE === 'E'){
      // 등록 불가
      //sAFCD0010Tab03Popup01_TYPE_E.value.openPopup(foc_data.value)
    } else {
      sAFCD0010Tab03Popup01_NEW.value.openPopup(foc_data.value)
    }


  }

}

// 현재 날짜 자동 입력
const getToday = () => {
  // 현재 날짜 객체 생성
  var today = new Date()
  // 년, 월, 일을 가져오기
  var year = today.getFullYear()
  // 월은 0부터 시작하기 때문에 1을 더해줌
  var month = (today.getMonth() + 1).toString().padStart(2, '0') // 1자리 숫자는 앞에 0을 붙여 두 자리로 만듦
  var day = today.getDate().toString().padStart(2, '0') // 위와 동일
  return year + '-' + month + '-' + day
}

//출력관련 로직 시작
const ozPrint = () => {
  reportName.value = []
  reportParam.value = []
  let ozParam = []
  //let chkNum = grdMain.value.getGridView().getCheckedRows(true)

  const gridView = grdMain.value.getGridView();
  const dataProvider = grdMain.value.getDataProvider();

  const chkNum = [];

  const rowCount = gridView.getItemCount(); // 정렬/필터된 결과 기준
  for (let i = 0; i < rowCount; i++) {
    if (gridView.isCheckedItem(i)) { // i번째 표시된 행이 체크되어 있다면
      const dataRow = gridView.getDataRow(i); // 실제 dataProvider의 행 번호
      //const rowData = dataProvider.getJsonRow(dataRow); // 실제 데이터 가져오기
      chkNum.push(dataRow);
    }
  }

  console.log('chkNum',chkNum)
  if (chkNum.length === 0) {
    Message.warn(t('출력할 데이터를 선택해주세요.'))    
    return false
  }

  const sPRINT_DIV = searchParam.PRINT_DIV
  console.log('sPRINT_DIV',sPRINT_DIV)
  /*
 { TXT: '관리감독자', COD: 'A' },
      { TXT: '세잎클로버/협안', COD: 'B' },
      { TXT: '안전요원', COD: 'C' },
      { TXT: '기타', COD: 'D' },
      { TXT: '전체', COD: '' },
  */

  for (let i = 0; i < chkNum.length; i++) {
    let data = dataProvider.getJsonRow(chkNum[i])
    //console.log('===========================>', chkNum[i])
    //console.log('data', data)

    let param = {
      CMPNY_DIV: data.CMPNY_DIV,
      WORK_ID: data.WORK_ID,
      RCV_NO: data.RCV_NO,
      CHECK_TYPE: data.CHECK_TYPE,
    }
    commonSearchApi({
      queryId: 'SAFCD0010_PRINT_04',
      param: param,
    }).then(res => {
      //console.log('res.ORESULT_CUR ::::::::: ', res.ORESULT_CUR)
      let resData = res.ORESULT_CUR

      // 출력조건이 전체가 아닐 때
      if(sPRINT_DIV !== ''){
        resData = res.ORESULT_CUR.filter(
          x => x.PRINT_DIV === sPRINT_DIV,
        )
      }     

      //console.log('resData ::::::::: ', resData)
      
      if(resData.length > 0){
        for(let j = 0;j < resData.length; j++){
          let rptData = resData[j]

          //console.log('rptData.CHECK_RESULT ::::::::: ', rptData.CHECK_RESULT) 
          
          let sCHECK_RESULT = '1'

          if(rptData.CHECK_RESULT === "X"){
            // 불량일 경우
            reportName.value = '/manage/hse/SAFCD0010Tab3_1.ozr'
            sCHECK_RESULT = '0'
          } else {
            // 양호일 경우
            reportName.value = '/manage/hse/SAFCD0010Tab3_2.ozr'
            sCHECK_RESULT = '1'
          }

          if(data.CHECK_TYPE === "E"){
            ozParam = [
              'IN_KEY=' +
                `${
                  rptData.CMPNY_DIV + rptData.WORK_ID + rptData.YYYYMM + rptData.SEQ
                }`,
              'IN_CHECK_TYPE=' + data.CHECK_TYPE,
              'IN_CHECK_RESULT=' + sCHECK_RESULT, 
            ]

          } else {
            ozParam = [
              'IN_KEY=' +
                `${
                  rptData.CMPNY_DIV + rptData.WORK_ID + rptData.RCV_NO + rptData.CHECK_EMP_NO + rptData.HISTORY_SEQ
                }`,
              'IN_CHECK_TYPE=' + data.CHECK_TYPE,
              'IN_CHECK_RESULT=' + sCHECK_RESULT,
            ]

          }

          reportParam.value.push({ reportName: reportName.value, args: ozParam })
          isMulti.value = true
          showOz.value = true          

        } 
      } else {
        Message.warn(t('출력할 항목이 없습니다.'))
      }

    })
    
  }
  console.log('레포트 파람', reportParam.value)

 
}


const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === "data" ){
    foc_data.value = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    console.log(foc_data.value.RCV_NO)

    if(foc_data.value.CHECK_TYPE === 'E'){
      //엔진QR점검은 등록 불가
      menuTitle.value.disableBtn('btnRegist', true) //등록버튼 비활성화
    } else {
      menuTitle.value.disableBtn('btnRegist', false) //등록버튼 활성화
    }
    
  }

  if (clickData.cellType === "data" && clickData.fieldName === "REFRESH") {
    
    let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    console.log("data", data )

    let searchParams = {}
    
    searchParams.RCV_NO = data.RCV_NO
    searchParams.WORK_NO = data.WORK_ID
    searchParams.WORK_DATE = data.WORK_DATE
    searchParams.USER_ID = userStore.empNo

    vm.$swal({
      title: t('본 기능은 점검실적이 이상하거나 삭제가 안되었을 때 사용하는 기능입니다.  <br>  점검/삭제여부를 업데이트하시겠습니까?'),
      showCancelButton: true,
    }).then((ck) => {
      if(ck.isConfirmed === true){
        commonExecuteApi({ queryId : 'SAFCD0010_SAVE13', list: [ searchParams ] }).then(res => {
          onButtonsClick({id:'btnSearch'})
          return
        })
      }
    })
      
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
    Message.warn(t('점검내역이 없습니다. 점검을 하려면 등록 버튼을 누르세요'))
    
    return false
  } else {
    //if (userStore.userId === 'A526166'|| userStore.userId === 'BP16992' || userStore.userId === 'A490342'){
    if(foc_data.value.CHECK_TYPE === 'E'){
      sAFCD0010Tab03Popup01_TYPE_E.value.openPopup2(data)
    } else {  
      sAFCD0010Tab03Popup01_NEW.value.openPopup2(data)
    }

  }

}

//조회관련 로직 시작
const beforeSearch = () => {
  let from = dayjs(searchParam.WORK_DATE_FROM)
  let to = dayjs(searchParam.WORK_DATE_TO)
  let dayDiff = to.diff(from, 'day')

  let PeroidLimit = 14

  // 안전과 admin 그룹만 가능 
  if (userStore.authGrpCd.includes('GRP00381')|| userStore.authGrpCd.includes('HIWAYGRP00001') ) {
    PeroidLimit = 31
  }


  if (dayDiff > PeroidLimit) {

    Message.warn( t( `조회기간은 최대 ${PeroidLimit}일 입니다.`))

    return false
  }


  return true
}

const searchData = () => {
  let query = ''

  // if(searchParam.DEPT_GBN === '1'){
  //   query = searchParam.REL_DEPT_CD === 'N1H0' ? 'SAFCD0010_SEARCH07_AE00' : 'SAFCD0010_SEARCH07'
  // }else{
  //   query = searchParam.BSNS_CD === 'AE00' ? 'SAFCD0010_SEARCH07_AE00' : 'SAFCD0010_SEARCH07'
  // }
  
  query = 'SAFCD0010_SEARCH07_MASTER'

  grdMain.value.getGridView().filterPanel.clearInput()
  
  return commonSearchApi({
    queryId: query,
    param: searchParam,
  })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  foc_data.value = grdMain.value.getDataProvider().getJsonRow(0)
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

  // 삭제여부 Y 음영처리
  grdMain.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
    var retVal = {}

    var val = grid.getValue(item.index, "DELETE_YN")

    if (val === 'Y') {
      retVal.style = {background: "#c2c3c4",
                      textDecoration: "line-through",
                    
    }}

    return retVal
  })

}

//조회관련 로직 끝



//행변경시 작업에 대한 점검결과를 등록한 사람이 있는지 확인

const onCurrentRowChanged = ( grid, oldIdx, newIdx) => {
  


  let data       = grdMain.value.getDataProvider().getJsonRow(newIdx)
  foc_data.value = grdMain.value.getDataProvider().getJsonRow(newIdx)
  console.log('FOCUS', foc_data.value)

  //점검결과를 등록한 사람을 조회 등록한사람이 있으면 등록버튼 비활성화
  let param = {
    CMPNY_DIV: data.CMPNY_DIV,
    WORK_ID: data.WORK_ID,
    RCV_NO: data.RCV_NO,
  }
  commonSearchApi({
    queryId: 'SAFCD0010_SEARCH92',
    param: param,
  }).then(res => {
    let checkEmp = res.ORESULT_CUR.filter(
      x => x.CHECK_EMP_NO === userStore.userId,
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
const selectedMngEmp = val => {
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
const selectedCheckEmp = val => {
  showValue.CHECK_EMP_NM = val.EMP_NM
  searchParam.CHECK_EMP_NO = val.EMP_NO
}

//팝업 닫혔을때 재조회
const closedPopup = () => {
  console.log('이거탐?')
  
  // 운찬양/박용섭 책임 요청으로 닫기시 재조회 해제
  onButtonsClick({ id: 'btnSearch' })
}


const clearable = (clnm) => {
  searchParam[clnm] = ''
  if (clnm === 'CHECK_EMP_NO'){
    showValue.CHECK_EMP_NM = ''
  }
  else if (clnm === 'MNGR_EMP_NO'){
    showValue.MNG_CHECK_EMP_NM = ''
  }
 
}


// 엑셀다운
const onExceldown = () => {
  grdMain.value.getGridView().exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '고위험작업 점검 내역_' + searchParam.WORK_DATE_FROM +'_'+  searchParam.WORK_DATE_TO+ '.xlsx', // 저장될 파일 name
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

const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
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
      }).then(res => {
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
  },
)

//관리감독자 이름 변경시 관리감독자 사번 초기화
watch(
  () => showValue.MNG_CHECK_EMP_NM,
  (newValue, oldValue) => {
    if (!oldValue) {
      return false
    }
    searchParam.MNGR_EMP_NO = ''
  },
)

//점검자 이름 변경시 점검자 사번 초기화
watch(
  () => showValue.CHECK_EMP_NM,
  (newValue, oldValue) => {
    if (!oldValue) {
      return false
    }
    searchParam.CHECK_EMP_NO = ''
  },
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
      }).then(res => {
        searchParam.ASGN_CD = ''
        codeList.ASGN_CD = res.ORESULT_CUR
        codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      })
    }
  },
)

//협력사 포함 체크박스 감지
//체크가되면 협력사 셀렉트박스 활성화
//체크가 해제되면 협력사 셀렉트박스 비활성화
watch(
  () => searchParam.ASGN_YN,
  newValue => {
    if (newValue === 'Y') {
      readOnlyValue.ASGN_CD = false
    } else {
      readOnlyValue.ASGN_CD = true
    }
  },
)

// 안전부 변경 시 부서 변경 이벤트
watch(() => searchParam.REL_DEPT_CD, (newValue, oldValue) => {
  if(searchParam.REL_DEPT_CD === '') {
    searchParam.REL_GWA_CD = ''
    searchParam.REL_TEAM_CD = ''
  }
  
  commonSearchApi({ queryId : 'OPRAC0010_SEARCH_04', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: searchParam.REL_DEPT_CD, USE_DIV:'Y' } })
    .then(res => {
      codeList.REL_GWA_CD = res.ORESULT_CUR
      codeList.REL_GWA_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })

      if (newValue !== oldValue) {
        searchParam.REL_GWA_CD = codeList.REL_GWA_CD[0].ASGN_CD
      }
    })
})

// 안전과 바뀌면 안전팀 데이터 가져옴
watch(() => searchParam.REL_GWA_CD, (newValue, oldValue) => {
  searchParam.REL_TEAM_CD = ''
  commonSearchApi({ queryId : 'OPRAC0010_SEARCH_05', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', ASGN_CD: searchParam.REL_GWA_CD } })
    .then(res => {
      codeList.REL_TEAM_CD = res.ORESULT_CUR
      
      if(codeList.REL_TEAM_CD.length == 1) {
        searchParam.REL_TEAM_CD = res.ORESULT_CUR[0].ASGN_CD
        codeList.REL_TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
        
        return
      }

      codeList.REL_TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
      if (codeList.REL_TEAM_CD.length !== 0) {
        searchParam.TEAM_CD = ''
      }
    })
})
</script>

<template>
  <v-card class="pa-0 fill-height">    
    <div class="d-flex align-self-end justify-space-between pt-3 pl-3 pr-3 pb-0">    
      <div class="align-self-center">
        
      </div>
      <div class="align-center d-flex mb-3">
        <v-btn class="mr-1" @click="onButtonsClick({id: 'btnSearch'})">조회</v-btn>
        <v-btn class="mr-1" @click="onButtonsClick({id: 'btnRegist'})">등록</v-btn>
        <v-btn class="mr-1" @click="onButtonsClick({id: 'btnDelete'})">삭제</v-btn>
        <v-btn class="mr-3" @click="onButtonsClick({id: 'btnPrintAllList'})">전체 목록 추출</v-btn>
        <i-select
                :label="$t('출력조건')"
                width="250px"              
                placeholder="출력조건"
                v-model="searchParam.PRINT_DIV"
                :items="codeList.PRINT_DIV"
                item-value="COD"
                item-title="TXT"
                class="ml-1 mr-0"
              />
        <v-btn class="ml-1" @click="onButtonsClick({id: 'btnPrint'})">리포트 출력</v-btn>
      </div>
    </div>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              v-model="searchParam.WORK_DATE_FROM"
              label-width="60px"
              :label="$t('작업기간')"
              type="date"
              width="210px"
              class="mr-0"
              required
            />
            <span class="mx-2 mt-1">~</span>
            <i-input
              v-model="searchParam.WORK_DATE_TO"
              type="date"
              width="155px"
              class="ml-0"
              required
            />

            <div
              v-if="userStore.authGrpCd.includes('GRP00381') || userStore.authGrpCd.includes('HIWAYGRP00001')"
              style="margin-top: 5px;width: 270px;"
            > 
              <v-radio-group
                v-model="searchParam.DEPT_GBN" 
                inline
              >
                <v-radio
                  v-for="item in codeList.DEPT_GBN"
                  :key="item"
                  :value="item.COD"
                  :label="item.TXT"
                />
              </v-radio-group>
            </div>

            <i-select
              v-if="searchParam.DEPT_GBN === '2'"
              v-model="searchParam.BSNS_CD"
              label-width="80px"
              :label="$t('사업부')"
              width="250px"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :readonly="readOnlyValue.BSNS_CD"
              required
            />
            <i-select
              v-if="searchParam.DEPT_GBN === '2'"
              v-model="searchParam.DEPT_CD"
              label-width="40px"
              :label="$t('부서')"
              width="250px"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :readonly="readOnlyValue.DEPT_CD"
            />

            <i-select
              v-if="searchParam.DEPT_GBN === '2'"
              v-model="searchParam.ASGN_CD"
              label-width="50px"
              :label="$t('협력사')"
              width="250px"
              :items="codeList.ASGN_CD"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              :disabled="readOnlyValue.ASGN_CD"
            />
            <v-checkbox
              v-if="searchParam.DEPT_GBN === '2'"
              v-model="searchParam.ASGN_YN"
              label="협력사 포함"
              true-value="Y"
              false-value="N"
              class="mr-2"
              style="margin-top: 3px"
            />

            <i-select
              v-if="searchParam.DEPT_GBN === '1'"
              v-model="searchParam.REL_DEPT_CD"
              :label="$t('안전부')"
              :items="codeList.REL_DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM" 
              width="250px"  
            />
            <i-select 
              v-if="searchParam.DEPT_GBN === '1'"
              v-model="searchParam.REL_GWA_CD"
              :label="$t('안전과')"
              :disabled="searchParam.REL_DEPT_CD === '' ? true : false"
              :items="codeList.REL_GWA_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM" 
              width="250px" 
            />
            <i-select 
              v-if="searchParam.DEPT_GBN === '1'"
              v-model="searchParam.REL_TEAM_CD"
              :label="$t('안전팀')"
              :disabled="searchParam.REL_GWA_CD === '' ? true : false"
              :items="codeList.REL_TEAM_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM" 
              width="250px" 
            />
          </div>

          <div class="d-flex mt-2">
            <i-input
              v-model="showValue.MNG_CHECK_EMP_NM"
              :label="$t('관리감독자')"
              append-inner-icon="mdi-magnify"
              width="210px"
              clearable
              @click:clearable="clearable('MNGR_EMP_NO')"
              @click:appendInner="mngEmpOpenPopup"
              @keydown.enter="mngEmpOpenPopup"
            />
            <i-input
              v-model="showValue.CHECK_EMP_NM"
              :label="$t('점검자')"
              width="160px"
              append-inner-icon="mdi-magnify"
              clearable
              @click:clearable="clearable('CHECK_EMP_NO')"
              @click:appendInner="checkEmpOpenPopup"
              @keydown.enter="checkEmpOpenPopup"
            />
            <i-select
              v-model="searchParam.SHIP_NO"
              label-width="80px"
              :label="$t('호선/프로젝트')"
              :items="codeList.SHIP_NO"
              item-title="TXT"
              item-value="COD"              
              width="250px"
            />
            <i-select
              v-model="searchParam.DN_DIV"
              label-width="80px"
              :label="$t('주/야구분')"
              :items="codeList.DN_DIV"
              item-title="TXT"
              item-value="COD"
              width="250px"
            />

            <v-checkbox
              v-model="searchParam.YARD_APP_YN"
              label="3중점검 대상"
              true-value="Y"
              false-value="N"
              class="mr-2"
              style="margin-top: 3px"
            />
            <span
              style="font-size: 15px; font-weight: bold; color: red"
              class="mt-2"
            >※ 단기공사 PTW의 경우 3중점검 대상에서 제외
            </span>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <IGridTitle :title="$t('고위험작업 점검 현황')" class="d-flex justify-between">
            <template #editors>
              <div class="d-flex justify-between align-center">
                <span class = "d-flex justify-end">
                  <v-btn @click="open_check_info"> 고위험점검 기준 설명 </v-btn>
                </span>
                <div style=" width: 50px; height:25px ; background-color: #ff8080; margin-left: 20px; border-color: grey;" />
                <div style ="color: black; margin-left: 10px;"> : 점검결과 '불량' 건 존재</div>
                                <div style=" width: 50px; height:25px ; background-color: #c2c3c4; margin-left: 20px; border-color: grey;" />
                <div style ="color: black; margin-left: 10px;"> : 점검계획에서 삭제됨</div>
              </div>

            </template>
          </IGridTitle>

          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
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

    <!-- 모달 창 -->
    <div
      v-if="showDeletePop"
      class="modal-overlay"
    >
      <div class="modal">
        <div class="modal-header">
          <h3 style="color: white; font-size: 18px;">
            삭제 사유를 입력해주세요.
          </h3>
        </div>
        <div class="modal-body">
          <input
            v-model="CancelRemark"
            placeholder="사유를 입력하세요..."
          >
          <div class="modal-actions">
            <v-btn @click="onDelete">
              제출
            </v-btn>
            <v-btn @click="closeModal">
              취소
            </v-btn>
          </div>
        </div>
      </div>
    </div>


  <SAFCD0010Tab03Popup01_NEW
    ref="sAFCD0010Tab03Popup01_NEW"
    @closePopup="closedPopup"
  />
  <SAFCD0010Tab03Popup01_TYPE_E
    ref="sAFCD0010Tab03Popup01_TYPE_E"
    @closePopup="closedPopup"
  />
  <EmpPopup
    ref="mngEmpPopup"
    @selected="selectedMngEmp"
  />
  <EmpPopup
    ref="checkEmpPopup"
    @selected="selectedCheckEmp"
  />
  <SAFCD0010Tab03Popup02 ref="sAFCD0010Tab03Popup02" />
  <OZReport
    :showPop="showOz"
    :MultiArr="reportParam"
    :isMulti="isMulti"
    @close="showOz = $event"
  />
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


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  width: 50%;  /* 모달의 가로 크기를 50%로 설정 */
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  background-color:  rgba(6, 47, 135); /* 파란색 배경 */
  align-items: center;
  height: 50px;
  color: white;
  padding: 15px;
  font-size: 1.2em;
  text-align: left; /* 제목을 좌측 정렬 */
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.modal-body input {
  padding: 10px;
  margin-bottom: 20px;
  font-size: 1em;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;


  
}
</style>
