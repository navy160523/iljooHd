<!--
  화면명 : 부서/협력사 교육 실적 팝업창
  화면개요 : 부서/협력사 교육의 이수확인 및 평가관리를 하는 화면
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  getCodeList,
  commonRequest,
  commonExecuteApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import ILabel from '@/components/ILabel.vue'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'
import IUpload from '@/components/IUpload.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import EDUAB0030Tab01Pop02Pop01Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01Pop01.vue'

//부서/협력사 교육 실적 팝업창
//협력사 안전교육 기성/마감 등록화면에서 필요해서 데이터 보는 기능만 구현해둠

//******************************세팅 영역***************************************************/
const emit = defineEmits()

const vm = getCurrentInstance().proxy //다이얼로그관련

const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const searchArea1 = ref(null)
const tab2 = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const fileUpload = ref(null)
const grdMain = ref(null)
const grdTab1Main = ref(null)
const grdTab2Main = ref(null)
const mainTitle = ref(null)
const tabMainTitle1 = ref(null)
const tabMainTitle2 = ref(null)
const saveArea = ref(null)
const tab = ref('tab')
let CREATE_YN = ''
const empPopup = ref(null)
const eDUAB0030Tab01Pop02Pop01Pop01 = ref(null)

let _Parameters = reactive({})

const applyParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: null,
  SCHEDULE_ID: null,
  APP_EMP_NO: null,
  USER_ID: userStore.userId,
})

// 결재승인자명
const appEmpNmVisible = ref(true)
// 결재승인자
const appEmpNoVisible = ref(true)
// 결재상태
const appStatusNm = ref(true)
//반려사유
const appDescVisible = ref(true)
//참석여부
const attendYnVisible = ref(true)

const readOnlyAPP_EMP_NO = ref(false)
const readOnlyAPP_STATUS = ref(false)
const readOnlyAPP_DESC = ref(false)

const button = reactive(['btnFileUpload','btnDelete','btnDownLoad'])
const isvisible = ref(false)
const arrCURR_ID = ref(null)
//EDUAB0050에서 사용
const ONLY_SEARCH = ref(null)
let file_yn = true
let applyState = true

//코드 리스트 세팅
const codeList = reactive({
  DIVISION: [], //교육분류
  REMARK: [], //불합격사유
  CURR_ID: [], //교육리스트
  ATTEND_YN: [
    { COD: ' ', TXT: ' ' },
    { COD: 'Y', TXT: '참석' },
    { COD: 'N', TXT: '불참' },
  ], //참석여부
  PASS_YN: [
    { COD: ' ', TXT: ' ' },
    { COD: 'Y', TXT: '합격' },
    { COD: 'N', TXT: '불합격' },
  ], //합격여부
})

//******************************세팅 영역(종료)***************************************************/

//********************************교육 상세정보 데이터***************************************//
const popupData = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_ID: userStore.userId,
  YEAR: '', //연도
  SCHEDULE_ID: '', //일정 ID
  EDU_DATE: '', //교육일자
  EDUTIME_SERIAL: '', //교육시간 SERIAL
  MENU_ID: '', //메뉴 ID
  DIVISION: '', //분류
  CURR_ID: '', //교육명
  EDU_CONTENT: '', //교육내용
  APP_EMP_NM: '', //결재승인자
  APP_EMP_NO: '', //결재승인자 사번
  APP_STATUS: '', //결재상태
  EXAM_YN: '', //시험여부
  ATTEND_YN: '', //참석여부
  BASE_SCORE: '', //기준점수
  SAVE_YN: 'Y', //저장가능 여부
  ATTACH_ID: '', //첨부파일 ID
  USE_DIV: 'Y',
  PATH: '', // 화면 경로
  FILE_COUNT: '' //파일갯수
})

//********************************/주관부서 상세정보 데이터(종료)***********************************//
const clearData = () => {
  Object.keys(popupData).forEach((key) => {
    popupData[key] = ''
  })
  popupData.CMPNY_DIV = userStore.cmpnyDiv
  popupData.USER_ID = userStore.userId
  // popupData.YEAR = '',                       //연도
  // popupData.SCHEDULE_ID = '',                //일정 ID
  // popupData.EDU_DATE = '',                   //교육일자
  // popupData.EDUTIME_SERIAL = '',             //교육시간 SERIAL
  // popupData.DIVISION = '',                   //분류
  // popupData.CURR_ID = '',                    //교육명
  // popupData.EDU_CONTENT = '',                //교육내용
  // popupData.APP_EMP_NM = '',                 //결재승인자
  // popupData.APP_EMP_NO = '',                 //결재승인자 사번
  // popupData.APP_REQ_EMP_NO = '',             //결재상신자 사번
  // popupData.APP_STATUS = '',                 //결재상태
  popupData.EXAM_YN = 'Y' //시험여부
  // popupData.ATTEND_YN = '',                  //참석여부
  // popupData.BASE_SCORE = ''                  //기준점수
  // popupData.APP_DESC = ''                    //반려사유

  if (grdMain.value.getDataProvider().rowCount > 0) {
    grdMain.value.getDataProvider().clearRows()
  }
  if (grdTab1Main.value.getDataProvider().rowCount > 0) {
    grdTab1Main.value.getDataProvider().clearRows()
  }

  if (grdTab2Main.value != null) {
    if (grdTab2Main.value.getDataProvider().rowCount > 0) {
      grdTab2Main.value.getDataProvider().clearRows()
    }
  }
}
//********************************이메일 파라미터 세팅***********************************//
const emailSearchParams = reactive({
  CMPNY_DIV: '',
  YEAR: '',
  SCHEDULE_ID: '',
  EMAIL_STATUS: '', // [C : 반려], [Y : 승인], [ELSE : 상신]
})
//********************************이메일 파라미터 세팅(종료)***********************************//

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    display: { selectionStyle: 'singleRow' },
    stateBar: { visible: false },
  },
  keys: ['YEAR', 'SCHEDULE_ID', 'EDUTIME_SERIAL'],
  fields: [
    {
      fieldName: 'EDUTIME_SERIAL',
      dataType: 'text',
      header: { text: t('차수') },
      editable: false,
      width: '30',
    },
    {
      fieldName: 'EDU_DATE',
      dataType: 'text',
      header: { text: t('교육일자') },
      editable: false,
      width: '80',
    },
    {
      fieldName: 'EDU_TIME',
      dataType: 'text',
      header: { text: t('시작') },
      editable: false,
      width: '50',
    },
    {
      fieldName: 'EDU_TIME_FN',
      dataType: 'text',
      header: { text: t('종료') },
      editable: false,
      width: '50',
    },
    {
      fieldName: 'EPLACE_ETC',
      dataType: 'text',
      header: { text: t('교육장소') },
      editable: false,
      width: '100',
    },
    {
      fieldName: 'LECTURER_NM',
      dataType: 'text',
      header: { text: t('강사명') },
      editable: false,
      width: '60',
    },
    {
      fieldName: 'TARGET_CNT',
      dataType: 'text',
      header: { text: t('대상인원') },
      editable: false,
      width: '30',
    },
    {
      fieldName: 'EDU_CNT',
      dataType: 'text',
      header: { text: t('참석인원') },
      editable: false,
      width: '30',
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('CMPNY_DIV') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      header: { text: t('YEAR') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'SCHEDULE_ID',
      dataType: 'text',
      header: { text: t('SCHEDULE_ID') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'DIVISION',
      dataType: 'text',
      header: { text: t('DIVISION') },
      visible: false,
      width: '60',
    },
  ],
  columns: [],
  columnLayout: [
    'EDUTIME_SERIAL',
    'EDU_DATE',
    {
      name: '교육시각',
      direction: 'horizontal',
      items: ['EDU_TIME', 'EDU_TIME_FN'],
      header: { text: t('교육시각') },
    },
    'EPLACE_ETC',
    'LECTURER_NM',
    'TARGET_CNT',
    'EDU_CNT',
  ],
})

//이수확인
const grdTab1MainProps = reactive({
  gridViewOption: {
    display: { selectionStyle: 'singleRow' },
    checkBar: { visible: true },
    stateBar: { visible: false },
  },
  keys: [],
  fields: [
    {
      fieldName: 'ATTEND_YN',
      dataType: 'text',
      header: { text: t('참석여부') },
      editor: { type: 'dropdown', domainOnly: true, partialMatch: true },
      lookupDisplay: true,
      lookupData: { value: 'COD', label: 'TXT', list: codeList.ATTEND_YN },
      styleName: 'editable_column',
      width: '60',
    },
    {
      fieldName: 'ORGN_NM',
      dataType: 'text',
      header: { text: t('소속') },
      styleName: 'left-column',
      editable: false,
      width: '250',
    },
    {
      fieldName: 'TARGET_ID',
      dataType: 'text',
      header: { text: t('사용자 아이디') },
      editable: false,
      width: '100',
    },
    {
      fieldName: 'TARGET_NM',
      dataType: 'text',
      header: { text: t('이름') },
      editable: false,
      width: '100',
    },
    {
      fieldName: 'JOB_TIT_NM',
      dataType: 'text',
      header: { text: t('직위') },
      editable: false,
      width: '100',
    },       
    {
      fieldName: 'HLD_OFFI_GBN_NM',
      dataType: 'text',
      header: { text: t('재직여부') },      
      width: '80',
    },
    // {
    //   fieldName: 'PASS_YN',
    //   dataType: 'text',
    //   header: { text: t('합격여부') },      
    //   width: '80',
    // },
    {
      fieldName: 'TXT',
      dataType: 'text',
      header: { text: t('당일근태') },
      editable: false,
      width: '60',
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      header: { text: t('비고(사유기재)') },
      styleName: 'editable_column',
      width: '200',
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: 'ADD_EDU_DATE',
      dataType: 'text',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
      header: { text: t('추가교육일') },
      styleName: 'editable_column',
      width: '120',
    },
    {
      fieldName: 'ADD_EDU_CNFM_USER_NM',
      dataType: 'text',
      header: { text: t('추가교육확인자') },
      editable: false,
      width: '60',
    },
    {
      fieldName: 'ORI_ORGN_NM',
      dataType: 'text',
      header: { text: t('신청당시소속') },
      styleName: 'left-column',
      editable: false,
      width: '200',
    },
    {
      fieldName: 'ATTEND_TIME',
      dataType: 'text',
      header: { text: t('출석 확인') },
      editable: false,
      width: '100',
    },
    {
      fieldName: 'EDU_CNFM_USER_NM',
      dataType: 'text',
      header: { text: t('교육 확인자') },
      editable: false,
      width: '50',
    },
    {
      fieldName: 'CONFIRM_DIV',
      dataType: 'text',
      header: { text: t('대상자 변경이수') },
      width: '60',
    },

    //비활성화
    {
      fieldName: 'CONFIRM_SIGN_YN',
      dataType: 'text',
      header: { text: t('전자서명') },
      visible: false,
      editable: false,
      width: '100',
    },
    {
      fieldName: 'WARNNING_YN',
      dataType: 'text',
      header: { text: t('WARNNING_YN') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'VIO_DESC',
      dataType: 'text',
      header: { text: t('위반내용') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'VIO_TIME',
      dataType: 'text',
      header: { text: t('위반일시') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'EDUTIME_SERIAL',
      dataType: 'text',
      header: { text: t('EDUTIME_SERIAL') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'OFFI_RES_NM',
      dataType: 'text',
      header: { text: t('직책') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('CMPNY_DIV') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      header: { text: t('YEAR') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'SCHEDULE_ID',
      dataType: 'text',
      header: { text: t('SCHEDULE_ID') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t('BSNS_CD') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'JOB_TIT_CD',
      dataType: 'text',
      header: { text: t('JOB_TIT_CD') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'OFFI_RES_CD',
      dataType: 'text',
      header: { text: t('OFFI_RES_CD') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'ORGN_CD',
      dataType: 'text',
      header: { text: t('ORGN_CD') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'SAVE_YN',
      dataType: 'text',
      header: { text: t('SAVE_YN') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'EDU_DIV',
      dataType: 'text',
      header: { text: t('이수구분') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'CONFIRM_DATE',
      dataType: 'text',
      header: { text: t('CONFIRM_DATE') },
      visible: false,
      width: '60',
    },
    
    {
      fieldName: 'BASE_SCORE',
      dataType: 'text',
      header: { text: t('BASE_SCORE') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'EDU_SCORE',
      dataType: 'text',
      header: { text: t('EDU_SCORE') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'CONFIRM_SIGN',
      dataType: 'text',
      header: { text: t('CONFIRM_SIGN') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'ADD_EDU_CNFM_USER',
      dataType: 'text',
      header: { text: t('추가교육확인자사번') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'UPDATE_USER_ID',
      dataType: 'text',
      header: { text: t('UPDATE_USER_ID') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'APP_EMP_NO',
      dataType: 'text',
      header: { text: t('결재승인자') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'APP_REQ_EMP_NO',
      dataType: 'text',
      header: { text: t('결재상신자') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'APP_REQ_DATE',
      dataType: 'text',
      header: { text: t('상신일시') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'APP_DATE',
      dataType: 'text',
      header: { text: t('승인일시') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'APP_STATUS',
      dataType: 'text',
      header: { text: t('APP_STATUS') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'ATTEND',
      dataType: 'text',
      header: { text: t('ATTEND') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'NON_ATTEND',
      dataType: 'text',
      header: { text: t('NON_ATTEND') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'NON_YN',
      dataType: 'text',
      header: { text: t('NON_YN') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'EDU_CNFM_USER',
      dataType: 'text',
      header: { text: t('EDU_CNFM_USER') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'EDU_DATE',
      dataType: 'text',
      header: { text: t('EDU_DATE') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'SAVE_ATTEND_YN',
      dataType: 'text',
      header: { text: t('SAVE_ATTEND_YN') },
      visible: false,
      width: '60',
    },
  ],
  columns: [],
})

//평가관리
const grdTab2MainProps = reactive({
  gridViewOption: {
    display: { selectionStyle: 'singleRow' },
    checkBar: { visible: true },
    stateBar: { visible: false },
  },
  keys: [],
  fields: [
    {
      fieldName: 'PASS',
      dataType: 'text',
      header: { text: t('합격여부') },
      width: '80',
      editable: popupData.SAVE_YN === 'Y',
      editor: { type: 'dropdown', domainOnly: true, partialMatch: true },
      lookupDisplay: true,
      lookupData: { value: 'COD', label: 'TXT', list: codeList.PASS_YN },
      styleName: 'editable_column',
      width: '60',
    },
    {
      fieldName: 'ORGN_NM',
      dataType: 'text',
      header: { text: t('소속') },
      styleName: 'left-column',
      editable: false,
      width: '250',
    },
    {
      fieldName: 'ORI_ORGN_NM',
      dataType: 'text',
      header: { text: t('신청당시 소속') },
      editable: false,
      width: '200',
    },
    {
      fieldName: 'TARGET_ID',
      dataType: 'text',
      header: { text: t('사용자 아이디') },
      editable: false,
      width: '100',
    },
    {
      fieldName: 'TARGET_NM',
      dataType: 'text',
      header: { text: t('이름') },
      editable: false,
      width: '100',
    },
    {
      fieldName: 'JOB_TIT_NM',
      dataType: 'text',
      header: { text: t('직위') },
      editable: false,
      width: '60',
    },
    {
      fieldName: 'EDU_SCORE',
      dataType: 'text',
      header: { text: t('점수') },
      editor: { ignoreCharacters: 'ㄱ-힣A-Za-z~!@#$%^&*()_+|<>?:{}' },
      styleName: 'editable_column',
      width: '40',
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      header: { text: t('비고(사유기재)') },
      styleName: 'editable_column',
      width: '200',
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: 'HND_PHN',
      dataType: 'text',
      header: { text: t('핸드폰 번호') },
      editable: false,
      width: '150',
    },

    //비활성화
    {
      fieldName: 'EDUTIME_SERIAL',
      dataType: 'text',
      header: { text: t('EDUTIME_SERIAL') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'OFFI_RES_NM',
      dataType: 'text',
      header: { text: t('직책') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('CMPNY_DIV') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      header: { text: t('YEAR') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'SCHEDULE_ID',
      dataType: 'text',
      header: { text: t('SCHEDULE_ID') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t('BSNS_CD') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'JOB_TIT_CD',
      dataType: 'text',
      header: { text: t('JOB_TIT_CD') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'OFFI_RES_CD',
      dataType: 'text',
      header: { text: t('OFFI_RES_CD') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'ORGN_CD',
      dataType: 'text',
      header: { text: t('ORGN_CD') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'SAVE_YN',
      dataType: 'text',
      header: { text: t('SAVE_YN') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'EDU_DIV',
      dataType: 'text',
      header: { text: t('이수구분') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'CONFIRM_DATE',
      dataType: 'text',
      header: { text: t('CONFIRM_DATE') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'PASS_YN',
      dataType: 'text',
      header: { text: t('PASS_YN') },
      visible: false,
      width: '30',
    },
    {
      fieldName: 'BASE_SCORE',
      dataType: 'text',
      header: { text: t('BASE_SCORE') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'CONFIRM_DIV',
      dataType: 'text',
      header: { text: t('CONFIRM_DIV') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'EDU_DATE',
      dataType: 'text',
      header: { text: t('CONFIRM_DIV') },
      visible: false,
      width: '60',
    },
    {
      fieldName: 'FAILURE',
      dataType: 'text',
      header: { text: t('FAILURE') },
      visible: false,
      width: '60',
    },
  ],
  columns: [],
})

// 그리드 컬럼 세팅
grdMainProps.columns = grdMainProps.fields
grdTab1MainProps.columns = grdTab1MainProps.fields
grdTab2MainProps.columns = grdTab2MainProps.fields

//*****************************************오픈 팝업********************************************/
const openPopup = async (data) => {
  console.log('부서/협력사 교육 실적 팝업창 받아온 데이터', data)
  _Parameters = data
  clearData()
  //주관부서, 교육주기, 교육시간 데이터 바인딩
  await Promise.all([
    getCodeList('HHID010'),
    getCodeList('HHID070'),
    commonSearchApi({ queryId: 'EDUAB0070_SEARCH_02', param: {} }),
  ]).then((res) => {
    console.log('레스 확인!', res)
    codeList.DIVISION = res[0].ORESULT_CUR //교육분류
    codeList.REMARK = res[1].ORESULT_CUR //불합격사유
    codeList.REMARK.unshift({ TXT: '', COD: '' })
    arrCURR_ID.value = res[2].ORESULT_CUR

    //평가관리 그리드의 비고(사유기재) 컬럼 데이터 바인딩
    grdTab1Main.value.setBindingColumn(
      'REMARK',
      res[1].ORESULT_CUR,
      'COD',
      'TXT'
    )
  })

  //CREATE_YN = 'Y' : 신규버튼 클릭
  //CREATE_YN = 'N' : 기존데이터 정보 받아와서 띄움
  if (data.CREATE_YN === 'Y') {
    CREATE_YN = data.CREATE_YN
  } else {
    popupData.CMPNY_DIV = data.CMPNY_DIV
    popupData.CURR_ID = data.CURR_ID
    popupData.YEAR = data.YEAR //연도
    popupData.SCHEDULE_ID = data.SCHEDULE_ID //일정 ID
    if(data.EDU_DATE != null) {
      popupData.EDU_DATE = data.EDU_DATE.substring(0, 10).replaceAll('.', '-') //교육일자
    }
    popupData.EDUTIME_SERIAL = data.EDUTIME_SERIAL //교육시간 SERIAL
    popupData.SAVE_YN = data.SAVE_YN
    popupData.EXAM_YN = data.EXAM_YN
    popupData.PATH = data.PATH // 20240207 [차동운] To-Do-List 화면 경로
    if (popupData.SAVE_YN === 'N') {
      mainTitle.value.getButtonItems().forEach((btn) => {
        btn.visible = btn.id === 'btnClose'
      })
    }
    tab.value = 'tab1'
    CREATE_YN = 'N'
  }
  onLoad(data)
  onSearchData(data)

  ONLY_SEARCH.value = data.ONLY_SEARCH
  //팝업 오픈
  dialog.value = true

  // 2024.07.25 박용훈 소속 이름 자동 필터 설정
  // 이수 확인
  grdTab1Main.value.getGridView().setColumnProperty("ORGN_NM", "autoFilter", true)
  grdTab1Main.value.getGridView().setColumnProperty("TARGET_NM", "autoFilter", true)

  
}

//****************************************오픈 팝업(종료)************************************************/

// 팝업창 화면 레이아웃 수정
const onLoad = (data) => {
  if (popupData.SAVE_YN === 'N') {
    // 부서별 안전교육 현황
    appEmpNmVisible.value = false
    appEmpNoVisible.value = false
    appStatusNm.value = false
  }
  if (popupData.CMPNY_DIV !== 'HHI') {
    appEmpNmVisible.value = false
    appEmpNoVisible.value = false
    appStatusNm.value = false
  } else {
    appEmpNmVisible.value = true
    appEmpNoVisible.value = true
    appStatusNm.value = true
  }
}

//창 닫음
const onClose = () => {
  fileUpload.value.clearGrid() //팝업 닫을때 파일업로드 그리드 초기화
  dialog.value = false
}

//추가 버튼 이벤트
const onAddButtonClick = () => {
  if (CREATE_YN === 'Y') {
    emit('selected', popupData)
  } else {
    emit('modified', popupData)
  }
  onClose()
}

//탭변경 이벤트
const selectedChanged = (tab) => {
  if (tab === 'tab1') {
  } else {
    onSearchTab2MainGridData()
    grdTab2Main.value.setBindingColumn('REMARK', codeList.REMARK, 'COD', 'TXT')
    // 평가 관리
  grdTab2Main.value.getGridView().setColumnProperty("ORGN_NM", "autoFilter", true)
  grdTab2Main.value.getGridView().setColumnProperty("TARGET_NM", "autoFilter", true)
  }
}

//이수확인 버튼 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === 'btnCollectiveApp') {
    let checkedRows = grdTab1Main.value.getGridView().getCheckedRows()
    if (checkedRows.length <= 0) {
      Message.warn(t('일괄적용할 데이터를 선택해주세요.'))
    }
    for (let i = 0; i < checkedRows.length; i++) {
      grdTab1Main.value
        .getDataProvider()
        .setValue(checkedRows[i], 0, popupData.ATTEND_YN)
    }
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdTab1Main])
      .setBefore(beforeTab1MainSave)
      .setQuery(saveTab1MainData)
      .setAfter(afterTab1MainSave)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdTab1Main, row: 'check' }])
      .setGridList([grdTab1Main])
      .setBefore(beforeTab1MainDelete)
      .setQuery(deleteTab1MainData)
      .setAfter(afterTab1MainDelete)
      .run()
  }
}

const onButtonsClickMain = (btn) => {
  if (btn.id === 'btnReqApply') {
    // 2024.07.04 박용훈 메세지 내용 추가
    //결재 상신
    new saveFlowHelper(vm, t)
      //.setConfirmMessage('상신하시겠습니까?')
      .setConfirmMessage('상신하시겠습니까?\r\n상신전 이수확인 및 평가관리에서 수정된 데이터는 꼭 저장후 상신을 하셔야 합니다.\r\n결재승인은 메인화면 ‘나의 할 일’에서 승인하시기 바랍니다')
      .setBefore(beforeApply)
      .setQuery(saveApplyData)
      .setAfter(afterApply)
      .run()
  } else if (btn.id === 'btnCompleteConfirm') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('이수확정하시겠습니까?')
      .setBefore(beforeApply)
      .setQuery(saveApplyData)
      .setAfter(afterApply)
      .run()
  } else if (btn.id === 'btnApplyCancel' || btn.id === 'btnCancelConfirm') {
    //결재 취소
    new saveFlowHelper(vm, t)
      .setConfirmMessage('취소하시겠습니까?')
      .setBefore(beforeApplyCancel)
      .setQuery(saveApplyCancelData)
      .setAfter(afterApplyCancel)
      .run()
  } else if (btn.id === 'btnApplyApprove') {
    //결재 승인
    new saveFlowHelper(vm, t)
      .setConfirmMessage('승인하시겠습니까?')
      .setBefore(beforeApplyApprove)
      .setQuery(saveApplyApproveData)
      .setAfter(afterApplyApprove)
      .run()
  } else if (btn.id == 'btnApplyTurnBack') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('반려하시겠습니까?')
      .setBefore(beforeApplyTurnBack)
      .setQuery(saveApplyTurnBackData)
      .setAfter(afterApplyTurnBack)
      .run()
  } else if (btn.id === 'btnSendSurvey') {
    let focusedRow = grdMain.value.getFocusedRowData()
    let CURR_IDX = codeList.CURR_ID.findIndex(
      (e) => e.COD === popupData.CURR_ID
    )
    let CURR_NM = codeList.CURR_ID[CURR_IDX].TXT
    let CURR_ID = codeList.CURR_ID[CURR_IDX].COD
    _Parameters.EDUTIME_SERIAL = focusedRow.EDUTIME_SERIAL
    _Parameters.CURR_NM = CURR_NM
    _Parameters.CURR_ID = CURR_ID
    _Parameters.DIVISION = popupData.DIVISION

    eDUAB0030Tab01Pop02Pop01Pop01.value.openPopup(_Parameters)
  } else if (btn.id === 'btnApplyLiceStatus') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('자격상태반영 하시겠습니까?\r\n반영전 이수확인 및 평가관리에서 수정된 데이터는 꼭 저장후 반영하셔야 합니다.')
      .setBefore(beforeApplyLiceStatus)
      .setQuery(saveApplyLiceStatus)
      .setAfter(afterApplyLiceStatus)
      .run()

  }else if (btn.id === 'btnClose') {
    onClose()
  }
}

const checkFileId = () => {
  console.log('popupData.ATTACH_ID 1',popupData.ATTACH_ID)
  if (popupData.ATTACH_ID != null) {
    fileUpload.value.setGuid(popupData.ATTACH_ID)
    popupData.ATTACH_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    fileUpload.value.setGuid()
    popupData.ATTACH_ID = fileUpload.value.guid
    file_yn = false
    // fileUpload.value.onButtonsClick({ id: 'btnSearch' })
    // console.log('popupData 2',popupData)  
    // console.log('popupData.ATTACH_ID 2',popupData.ATTACH_ID)
   
    
   
  }
}

const onSearchData = (Parameters) => {
  console.log('팝업데이터 확인', popupData)
  if (popupData.CMPNY_DIV === null) {
    popupData.CMPNY_DIV = ''
  }
  if (popupData.YEAR === null) {
    popupData.YEAR = dayjs().format('YYYY')
  }
  if (popupData.SCHEDULE_ID === null) {
    popupData.SCHEDULE_ID = ''
  }

  //메인데이터
  commonSearchApi({
    queryId: 'EDUAB0030_TAB01_POP2_POP1_SEARCH_01',
    param: popupData,
  }).then((res) => {
    console.log('메인데이터 조회 ', res)
    let existCURR_ID = false
    if (res.ORESULT_CUR.length > 0) {
      popupData.SCHEDULE_ID = res.ORESULT_CUR[0].SCHEDULE_ID //일정 ID
      popupData.DIVISION = res.ORESULT_CUR[0].DIVISION //분류
      updateDivision()
      popupData.CURR_ID = res.ORESULT_CUR[0].CURR_ID //교육명
      popupData.EDU_CONTENT = res.ORESULT_CUR[0].EDU_CONTENT //교육내용
      popupData.APP_EMP_NM = res.ORESULT_CUR[0].APP_EMP_NM //결재승인자
      popupData.APP_EMP_NO = res.ORESULT_CUR[0].APP_EMP_NO //결재승인자 사번
      popupData.APP_REQ_EMP_NO = res.ORESULT_CUR[0].APP_REQ_EMP_NO //결재상신자
      popupData.APP_STATUS = res.ORESULT_CUR[0].APP_STATUS //결재상태
      popupData.ATTACH_ID = res.ORESULT_CUR[0].ATTACH_KEY //결재상태
      popupData.EXAM_YN = res.ORESULT_CUR[0].EXAM_YN //시험여부
      popupData.APP_DESC = res.ORESULT_CUR[0].APP_DESC //반려사유
      //popupData.SAVE_YN = res.ORESULT_CUR[0].SAVE_YN                 //저장가능 여부 - 팝업과 저장데이터 별도인지 확인해야함
      applyParams.SCHEDULE_ID = res.ORESULT_CUR[0].SCHEDULE_ID //결재 상신시 필요한 데이터
      popupData.FILE_COUNT = res.ORESULT_CUR[0].FILE_COUNT

      if (res.ORESULT_CUR[0].CMPNY_DIV === 'HHI') {
        appEmpNmVisible.value = true
        appEmpNoVisible.value = true
        appStatusNm.value = true
      }

      for (let i = 0; i < arrCURR_ID.value.length; i++) {
        //arrCURR_ID에 res.ORESULT_CUR[0]이 포함되어 있다면 true
        if (res.ORESULT_CUR[0].CURR_ID === arrCURR_ID.value[i].CURR_ID) {
          existCURR_ID = true
        }
      }
    }
    if (existCURR_ID && res.ORESULT_CUR[0].CMPNY_DIV === 'HHI') {
      mainTitle.value.setBtnProperty('btnCompleteConfirm', 'visible', false) //이수확정
      mainTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false) //확정취소
      attendYnVisible.value = true //참석여부, 일괄적용, 저장, 삭제
      appDescVisible.value = false //반려사유
      //결재상신 이전
      if (isNullCheck(res.ORESULT_CUR[0].APP_EMP_NO)) {
        //결재승인자 여부
        console.log('결재상신 이전 널')
        mainTitle.value.setBtnProperty('btnReqApply', 'visible', true) //결재상신
        mainTitle.value.setBtnProperty('btnApplyApprove', 'visible', false) //결재승인
        mainTitle.value.setBtnProperty('btnApplyTurnBack', 'visible', false) //결재반려
        mainTitle.value.setBtnProperty('btnApplyCancel', 'visible', false) //결재취소
        appDescVisible.value = false //반려사유
        attendYnVisible.value = true //참석여부, 일괄적용, 저장, 삭제
        readOnlyAPP_EMP_NO.value = false //결재승인자 readOnly
      } else {
        if (res.ORESULT_CUR[0].APP_STATUS === '반려') {
          //반려
          console.log('결재상신 이후 반려임')
          mainTitle.value.setBtnProperty('btnReqApply', 'visible', true) //결재상신
          mainTitle.value.setBtnProperty('btnApplyApprove', 'visible', false) //결재승인
          mainTitle.value.setBtnProperty('btnApplyTurnBack', 'visible', false) //결재반려
          mainTitle.value.setBtnProperty('btnApplyCancel', 'visible', false) //결재취소
          appDescVisible.value = true //반려사유
          readOnlyAPP_DESC.value = true //반려사유 readOnly
          attendYnVisible.value = true //참석여부, 일괄적용, 저장, 삭제
          //popupData.EXAM_YN = 'Y'                                              //평가관리 탭 유무
          readOnlyAPP_EMP_NO.value = true //결재승인자 readOnly
        } else {
          //승인 또는 미결
          console.log('결재상신 이후 반려 아님')
          mainTitle.value.setBtnProperty('btnReqApply', 'visible', false) //결재상신
          mainTitle.value.setBtnProperty('btnApplyApprove', 'visible', false) //결재승인
          mainTitle.value.setBtnProperty('btnApplyTurnBack', 'visible', false) //결재반려
          mainTitle.value.setBtnProperty('btnApplyCancel', 'visible', true) //결재취소
          appDescVisible.value = false //반려사유
          attendYnVisible.value = false //참석여부, 일괄적용, 저장, 삭제
          //popupData.EXAM_YN = 'N'                                              //평가관리 탭 유무
          readOnlyAPP_EMP_NO.value = true //결재승인자 readOnly
        }
      }
      //본인이 결재승인자 일 경우
      if (userStore.empNo === res.ORESULT_CUR[0].APP_EMP_NO) {
        readOnlyAPP_EMP_NO.value = true //결재승인자 readOnly
        if (popupData.APP_STATUS === '미결') {
          //미결
          console.log('본인이 결재승인자에다 미결임')
          mainTitle.value.setBtnProperty('btnReqApply', 'visible', false) //결재상신
          mainTitle.value.setBtnProperty('btnApplyApprove', 'visible', true) //결재승인
          mainTitle.value.setBtnProperty('btnApplyTurnBack', 'visible', true) //결재반려
          mainTitle.value.setBtnProperty('btnApplyCancel', 'visible', true) //결재취소
          appDescVisible.value = true //반려사유
          readOnlyAPP_DESC.value = false //반려사유 readOnly
          attendYnVisible.value = false //참석여부, 일괄적용, 저장, 삭제
          //popupData.EXAM_YN = 'N'                                              //평가관리 탭 유무
          //readOnlyAPP_EMP_NO.value = true                                      //결재승인자 readOnly
        } //반려, 본인이 본인을 결재승인자로 지정하고 결재상신하고 반려했을경우 버튼이 안보이는 현상으로 추가
        else if (res.ORESULT_CUR[0].APP_STATUS === '반려') {
          console.log('본인이 결재승인자에다 반려임')
          mainTitle.value.setBtnProperty('btnReqApply', 'visible', true) //결재상신
          mainTitle.value.setBtnProperty('btnApplyApprove', 'visible', false) //결재승인
          mainTitle.value.setBtnProperty('btnApplyTurnBack', 'visible', false) //결재반려
          mainTitle.value.setBtnProperty('btnApplyCancel', 'visible', true) //결재취소
          appDescVisible.value = true //반려사유
          readOnlyAPP_DESC.value = true //반려사유 readOnly
          readOnlyAPP_EMP_NO.value = false //결재승인자 readOnly
          attendYnVisible.value = true //참석여부, 일괄적용, 저장, 삭제
          //popupData.EXAM_YN = 'Y'                                              //평가관리 탭 유무
          readOnlyAPP_DESC.value = true //반려사유 사용 여부
        } else {
          console.log('본인이 결재승인자에다 미결,반려가 아님')
          mainTitle.value.setBtnProperty('btnReqApply', 'visible', false) //결재상신
          mainTitle.value.setBtnProperty('btnApplyApprove', 'visible', false) //결재승인
          mainTitle.value.setBtnProperty('btnApplyTurnBack', 'visible', false) //결재반려
          mainTitle.value.setBtnProperty('btnApplyCancel', 'visible', true) //결재취소
          appDescVisible.value = false //반려사유
          attendYnVisible.value = false //참석여부, 일괄적용, 저장, 삭제
          //readOnlyAPP_EMP_NO.value = true                                        //결재승인자 readOnly
          //popupData.EXAM_YN = 'N'                                              //평가관리 탭 유무
        }
      }

      //단기공사 통합안전교육센터 교육
      if (res.ORESULT_CUR[0].CURR_ID === 'C120') {
        if (res.ORESULT_CUR[0].APP_STATUS === '결재완료') {
          mainTitle.value.setBtnProperty('btnCompleteConfirm', 'visible', false) //이수확정(결재상신)
          mainTitle.value.setBtnProperty('btnCancelConfirm', 'visible', true) //확정취소(결재취소)
        } else {
          mainTitle.value.setBtnProperty('btnCompleteConfirm', 'visible', true) //이수확정(결재상신)
          mainTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false) //확정취소(결재취소)
        }
        
        mainTitle.value.setBtnProperty('btnReqApply', 'visible', false) //확정취소(결재취소)
        appEmpNmVisible.value = false //결재승인자
        appEmpNoVisible.value = false //결재승인자 코드
        appStatusNm.value = false //결재상태
        appDescVisible.value = false //반려사유
      }
    } else {
      console.log('완전 엘스')
      mainTitle.value.setBtnProperty('btnCompleteConfirm', 'visible', false) //이수확정
      mainTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false) //확정취소
      mainTitle.value.setBtnProperty('btnReqApply', 'visible', false) //결재상신
      mainTitle.value.setBtnProperty('btnApplyApprove', 'visible', false) //결재승인
      mainTitle.value.setBtnProperty('btnApplyTurnBack', 'visible', false) //결재반려
      mainTitle.value.setBtnProperty('btnApplyCancel', 'visible', false) //결재취소
      appEmpNmVisible.value = false //결재승인자
      appEmpNoVisible.value = false //결재승인자 코드
      appStatusNm.value = false //결재상태
      appDescVisible.value = false //반려사유
      attendYnVisible.value = true //참석여부, 일괄적용, 저장, 삭제
      //popupData.EXAM_YN = 'N'                                              //평가관리 탭 유무
    }

    //메뉴이름으로 판별하는 경우를 ONLY_SEARCH로 대체함
    if (ONLY_SEARCH.value === 'Y') {
      attendYnVisible.value = false
      mainTitle.value.setBtnProperty('btnCompleteConfirm', 'visible', false) //이수확정
      mainTitle.value.setBtnProperty('btnCancelConfirm', 'visible', false) //확정취소
      mainTitle.value.setBtnProperty('btnReqApply', 'visible', false) //결재상신
      mainTitle.value.setBtnProperty('btnApplyApprove', 'visible', false) //결재승인
      mainTitle.value.setBtnProperty('btnApplyTurnBack', 'visible', false) //결재반려
      mainTitle.value.setBtnProperty('btnApplyCancel', 'visible', false) //결재취소
      mainTitle.value.setBtnProperty('btnSendSurvey', 'visible', false) //설문지전송
      popupData.EXAM_YN = 'N'
    }
    // if(Parameters.REQ_YN === 'Y'){
    //   mainTitle.value.setBtnProperty('btnApplyApprove', 'visible', false)    //결재승인
    //   attendYnVisible.value = false
    //   //$$$mainTitle.value.disableBtn("btnSendSurvey", true)   //설문지전송
    //   popupData.SAVE_YN = 'N'
    // }

    //결재 승인, 반려, 취소 내부 결재로 옮김
    mainTitle.value.setBtnProperty('btnApplyApprove', 'visible', false) //결재승인
    mainTitle.value.setBtnProperty('btnApplyTurnBack', 'visible', false) //결재반려
    mainTitle.value.setBtnProperty('btnApplyCancel', 'visible', false) //결재취소

    //로그인자와 결재상신자가 같으면 결재취소 버튼 활성화
    if(userStore.userId === popupData.APP_REQ_EMP_NO){
      mainTitle.value.setBtnProperty('btnApplyCancel', 'visible', true) //결재취소
    }

    // 운전보수 교육일 때 자격상태반영 버튼 표시
    if(popupData.DIVISION === 'M'){
      mainTitle.value.setBtnProperty('btnApplyLiceStatus', 'visible', true) //자격상태반영
    } else {
      mainTitle.value.setBtnProperty('btnApplyLiceStatus', 'visible', false) //자격상태반영
    }


  })

  //첨부파일
  commonSearchApi({
    queryId: 'EDUAB0030_TAB01_POP2_POP1_SEARCH_02',
    param: popupData,
  }).then((res2) => {
    if (res2.ORESULT_CUR.length > 0) {
      popupData.ATTACH_ID = res2.ORESULT_CUR[0].ATTACH_KEY
      checkFileId()
    }
  })

  if (popupData.SCHEDULE_ID != null) {
    //좌측 교육 그리드
    onSearchMainGridData()

    //첫번째 탭 그리드
    onSearchTab1MainGridData()
  }
}

const onSearchMainGridData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

const searchMainData = () => {
  return commonSearchApi({
    queryId: 'EDUAB0030_TAB01_POP2_POP1_SEARCH_03',
    param: popupData,
  })
}

const afterMainSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  if (res.ORESULT_CUR != null) {
    let eduDate = 0
    let idx = 0
    res.ORESULT_CUR.forEach((row) => {
      if (row.EDU_DATE === popupData.EDU_DATE) {
        eduDate = idx
      } else {
        idx++
      }
    })
    grdMain.value.getGridView().setCurrent({ dataRow: eduDate, fieldIndex: 0 })
    searchTab1MainDataRow(eduDate)
  }
}

const onSearchTab1MainGridData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdTab1Main])
    .setBefore(beforeTab1Search)
    .setQuery(searchTab1MainData)
    .setAfter(afterTab1MainSearch)
    .run()
}

const beforeTab1Search = () => {
  if (grdMain.value.getDataProvider().rowCount === 0) {
    return false
  }
  let selectedRowIndex = grdMain.value.getGridView().getSelectedRows(true)

  return !(selectedRowIndex === null)
}

const searchTab1MainData = () => {
  let rowIdx = grdMain.value.getGridView().getSelectedRows()
  let selectedRow = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  let searchList = {
    CMPNY_DIV: popupData.CMPNY_DIV,
    YEAR: popupData.YEAR,
    SCHEDULE_ID: popupData.SCHEDULE_ID,
    EDUTIME_SERIAL: selectedRow.EDUTIME_SERIAL,
    EDU_DATE: selectedRow.EDU_DATE.replaceAll('-', ''),
  }
  return commonSearchApi({
    queryId: 'EDUAB0030_TAB01_POP2_POP1_TAB01_SEARCH_01',
    param: searchList,
  })
}

const searchTab1MainDataRow = (rowIdx) => {
  let selectedRow = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  let searchList = {
    CMPNY_DIV: popupData.CMPNY_DIV,
    YEAR: popupData.YEAR,
    SCHEDULE_ID: popupData.SCHEDULE_ID,
    EDUTIME_SERIAL: selectedRow.EDUTIME_SERIAL,
    EDU_DATE: selectedRow.EDU_DATE.replaceAll('-', ''),
  }
  commonSearchApi({
    queryId: 'EDUAB0030_TAB01_POP2_POP1_TAB01_SEARCH_01',
    param: searchList,
  }).then((res) => {
    if (res === null) return
    res.ORESULT_CUR.forEach((element) => {
      if (element.EDU_DIV === 'Y') {
        element.ATTEND_YN = 'Y'
      } else if (element.EDU_DIV === 'N') {
        element.ATTEND_YN = 'N'
      } else {
        element.ATTEND_YN = ''
      }
    })

    grdTab1Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const afterTab1MainSearch = (res) => {
  if (res === null) return
  res.ORESULT_CUR.forEach((element) => {
    if (element.EDU_DIV === 'Y') {
      element.ATTEND_YN = 'Y'
    } else if (element.EDU_DIV === 'N') {
      element.ATTEND_YN = 'N'
    } else {
      element.ATTEND_YN = ''
    }
  })

  grdTab1Main.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onSearchTab2MainGridData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdTab2Main])
    .setBefore(beforeTab2Search)
    .setQuery(searchTab2MainData)
    .setAfter(afterTab2MainSearch)
    .run()
}

const beforeTab2Search = () => {
  if (grdMain.value.getDataProvider().rowCount === 0) {
    return false
  }
  let selectedRowIndex = grdMain.value.getGridView().getSelectedRows(true)

  return !(selectedRowIndex === null)
}

const searchTab2MainData = () => {
  let rowIdx = grdMain.value.getGridView().getSelectedRows()
  let selectedRow = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  if (selectedRow != null) {
    let searchList = {
      CMPNY_DIV: popupData.CMPNY_DIV,
      YEAR: popupData.YEAR,
      SCHEDULE_ID: popupData.SCHEDULE_ID,
      EDUTIME_SERIAL: selectedRow.EDUTIME_SERIAL,
      EDU_DATE: selectedRow.EDU_DATE.replaceAll('-', ''),
    }

    return commonSearchApi({
      queryId: 'EDUAB0030_TAB01_POP2_POP1_TAB02_SEARCH_01',
      param: searchList,
    })
  }
}

const afterTab2MainSearch = (res) => {
  if (res === null) return
  console.log('애프터 탭 메인 서치', res)
  res.ORESULT_CUR.forEach((element) => {
    if (element.PASS === 'Y') {
      element.PASS_YN = 'Y'
    } else {
      element.PASS_YN = 'N'
      element.PASS = 'N'
    }
  })

  grdTab2Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  popupData.BASE_SCORE = res.ORESULT_CUR[0].MAX_BASE_SCORE
}

//평가관리 재적용 버튼
const ApplyBtn = async () => {
  let grdTab2MainData = grdTab2Main.value.getDataProvider().getRows()
  if (grdTab2MainData.length === 0) {
    Message.warn(t('재적용할 데이터가 없습니다.'))
    return false
  }
  if (isNullCheck(popupData.BASE_SCORE)) {
    Message.warn(t('기준점수를 입력해 주세요.'))
    return false
  } else if (popupData.BASE_SCORE <= 0) {
    Message.warn(t('기준점수는 0점 이상이어야 합니다.'))
    return false
  }
  let ck = await vm.$swal({
    title: t('재적용하시겠습니까?'),
    showCancelButton: true,
  })
  if (ck.isConfirmed) {
    for (let i = 0; i < grdTab2MainData.length; i++) {
      if (Number(grdTab2MainData[i][6]) < Number(popupData.BASE_SCORE)) {
        grdTab2Main.value.getDataProvider().setValue(i, 'PASS', 'N')
        grdTab2Main.value.getDataProvider().setValue(i, 'FAILURE', 'Y')
        grdTab2Main.value.getDataProvider().setValue(i, 'REMARK', 'A')
      } else {
        grdTab2Main.value.getDataProvider().setValue(i, 'PASS', 'Y')
        grdTab2Main.value.getDataProvider().setValue(i, 'FAILURE', 'N')
        grdTab2Main.value.getDataProvider().setValue(i, 'REMARK', '')
      }
    }
  }
}

//평가관리 선택인원 합격 버튼
const SelectPassBtn = () => {
  let checkedRows = grdTab2Main.value.getGridView().getCheckedRows()
  if (checkedRows.length === 0) {
    Message.warn(t('합격입력할 데이터를 선택해 주세요.'))
    return false
  }
  for (let i = 0; i < checkedRows.length; i++) {
    grdTab2Main.value.getDataProvider().setValue(checkedRows[i], 0, 'Y')
    grdTab2Main.value.getDataProvider().setValue(checkedRows[i], 7, '')
    grdTab2Main.value.getDataProvider().setValue(i, 'FAILURE', 'N')
  }
}

const onButtonsClick2 = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdTab2Main])
      .setBefore(beforeTab2MainSave)
      .setQuery(saveTab2MainData)
      .setAfter(afterTab2MainSave)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdTab2Main, row: 'check' }])
      .setGridList([grdTab2Main])
      .setBefore(beforeTab2MainDelete)
      .setQuery(deleteTab2MainData)
      .setAfter(afterTab2MainDelete)
      .run()
  }
}

//평가관리 점수가 변경될 때 마다 발생하는 이벤트
const grdTab2MainEditRowChanged = (
  grid,
  itemIndex,
  dataRow,
  field,
  oldValue,
  newValue
) => {
  console.log('데이터 로우 : ', dataRow)
  console.log('누ㅠ밸류', newValue)
  console.log('필드 확인 : ', field)
  if (field === 0) {
    if (newValue === 'Y') {
      grdTab2Main.value
        .getGridView()
        .setValues(dataRow, { FAILURE: 'N', REMARK: '' }, true)
    } else if (newValue === 'N') {
      grdTab2Main.value.getGridView().setValues(dataRow, { FAILURE: 'Y' }, true)
    }
  }
  if (field === 6) {
    grid.commit()
    if (Number(newValue) < Number(popupData.BASE_SCORE)) {
      grdTab2Main.value.getDataProvider().setValue(dataRow, 7, 'A')
      grdTab2Main.value.getDataProvider().setValue(dataRow, 0, 'N')
    } else if (Number(newValue) > Number(popupData.BASE_SCORE)) {
      grdTab2Main.value.getDataProvider().setValue(dataRow, 7, '')
      grdTab2Main.value.getDataProvider().setValue(dataRow, 0, 'Y')
    }
  }
  grdTab2Main.value.getGridView().checkItem(dataRow, true)
}

//기준점수 유효성 검사
const requiredBASE_SCORE = (val) => {
  const regex = /^[0-9]*$/
  if (!regex.test(val)) {
    popupData.BASE_SCORE = popupData.BASE_SCORE.slice(0, -1)
  }
}

const mailSend = () => {
  commonSearchApi({
    queryId: 'EDUAB0030_SEARCH_08',
    param: emailSearchParams,
  }).then((res) => {
    
    let EMAIL = '' //이메일
    let EDU_TITLE = res.ORESULT_CUR[0].EDU_TITLE //교육명
    let EDATE_FROM = res.ORESULT_CUR[0].EDATE_FROM //시작일
    let EDATE_TO = res.ORESULT_CUR[0].EDATE_TO //종료일
    let APP_DESC = res.ORESULT_CUR[0].APP_DESC //반려사유
    let APP_EMP_NM = res.ORESULT_CUR[0].APPEMP_NM //수신자
    let APP_EMP_JOB_TIT = res.ORESULT_CUR[0].APPEMP_JOBTIT //수신자 직위
    let APP_REQ_EMP_NM = res.ORESULT_CUR[0].APPREQEMP_NM //요청자
    let APP_REQ_EMP_JOB_TIT = res.ORESULT_CUR[0].APPREQEMP_JOBTIT //요청자 직위
    let EDU_CNT = res.ORESULT_CUR[0].EDU_CNT //교육 대상 인원
    let EMAIL_TITLE = '' //이메일 제목
    let MAIN_CONTENT = '' //이메일 메인 내용
    let IN_PERSON = '' //받는 사람
    let OUT_PERSON = '' //보낸 사람
    let TIP = '' //이메일 팁
    APP_EMP_JOB_TIT = APP_EMP_JOB_TIT === null ? '' : APP_EMP_JOB_TIT
    APP_REQ_EMP_JOB_TIT =
      APP_REQ_EMP_JOB_TIT === null ? '' : APP_REQ_EMP_JOB_TIT

    if (emailSearchParams.EMAIL_STATUS === 'C') {
      //반려
      // 2024.08.12 박용훈 반려일때는 결재 상신자 한테 가야함
      //EMAIL = res.ORESULT_CUR[0].APPEMP_EMAIL
      EMAIL = res.ORESULT_CUR[0].APPREQEMP_EMAIL
      EMAIL_TITLE =
        '[HiSEs]' + EDU_TITLE + '(' + EDATE_FROM + '~' + EDATE_TO + ') 결재결과'
      MAIN_CONTENT = '통합HSE관리시스템에서 하기 교육에 대해서 반려 되었습니다.'
      IN_PERSON = APP_EMP_NM + ' ' + APP_EMP_JOB_TIT
      OUT_PERSON = APP_REQ_EMP_NM + ' ' + APP_REQ_EMP_JOB_TIT
      TIP += '- 반려사유 : ' + APP_DESC
    } else if (emailSearchParams.EMAIL_STATUS === 'Y') {
      //승인
      // 2024.08.12 박용훈 승인일때는 결재 상산지에게 가야됨
      //EMAIL = res.ORESULT_CUR[0].APPEMP_EMAIL
      EMAIL = res.ORESULT_CUR[0].APPREQEMP_EMAIL
      EMAIL_TITLE =
        '[HiSEs]' + EDU_TITLE + '(' + EDATE_FROM + '~' + EDATE_TO + ') 결재결과'
      MAIN_CONTENT =
        '통합HSE관리시스템에서 하기 교육에 대해서 결재 승인이 완료되었습니다.'
      IN_PERSON = APP_EMP_NM + ' ' + APP_EMP_JOB_TIT
      OUT_PERSON = APP_REQ_EMP_NM + ' ' + APP_REQ_EMP_JOB_TIT
    } else {
      //상신
      // 2024.08.12 박용훈  상신일때는 결재자에게 가야함
      //EMAIL = res.ORESULT_CUR[0].APPREQEMP_EMAIL
      EMAIL = res.ORESULT_CUR[0].APPEMP_EMAIL
      EMAIL_TITLE =
        '[HiSEs]' + EDU_TITLE + '(' + EDATE_FROM + '~' + EDATE_TO + ') 결재요청'
      MAIN_CONTENT =
        '통합HSE관리시스템에서 하기 교육에 대해서 결재 승인 바랍니다.' //메인 내용
      IN_PERSON = APP_REQ_EMP_NM + ' ' + APP_REQ_EMP_JOB_TIT
      OUT_PERSON = APP_EMP_NM + ' ' + APP_EMP_JOB_TIT
    }
    TIP +=
      '<br/> >결재방법 <br/> 통합HSE관리시스템(HiSEs)접속-> 메인화면 ‘나의 할 일’에서 승인하시기 바랍니다'

    let emailParams = {
      // 2024.07.26 박용훈 메일 주소 변경
      //EMAIL: [OUT_PERSON],
      EMAIL: [EMAIL],
      SUBJECT: EMAIL_TITLE,
      CONTENT: '',
    }
    console.log('emailParams :', emailParams)
    emailParams.CONTENT += '<!doctype html>'
    emailParams.CONTENT += ' <html>'
    emailParams.CONTENT += '  <body>'
    emailParams.CONTENT += "  <meta charset='utf-8'>"
    //2024.08.12 박용훈 발신자 수신자 잘못 가서 변경함
    emailParams.CONTENT += '발신 ' + IN_PERSON
    emailParams.CONTENT += '</br>'
    emailParams.CONTENT += '수신 ' + OUT_PERSON
    emailParams.CONTENT += '</br>'
    emailParams.CONTENT += '</br>'
    emailParams.CONTENT += MAIN_CONTENT + '</br>'
    emailParams.CONTENT += '</br>'
    emailParams.CONTENT += '- 교육명 : ' + EDU_TITLE
    emailParams.CONTENT += '</br>'
    emailParams.CONTENT += '- 교육일정 : ' + EDATE_FROM + '~' + EDATE_TO
    emailParams.CONTENT += '</br>'
    emailParams.CONTENT += '- 교육대상인원 : ' + EDU_CNT + '명'
    emailParams.CONTENT += '</br>'
    emailParams.CONTENT += TIP
    emailParams.CONTENT += '  </body>'
    emailParams.CONTENT += '</html>'

    // 2024.08.26 박용훈 메일주소가 없는 경우 메일 발송 안하도록 수정
    if(EMAIL.trim() !== ''){
      commonSendApi(emailParams).then((res) => {
        Message.success(t('메일이 전송되었습니다.'))
      })
    }
    else{
        Message.success(t('메일주소가 없어서 메일발송은 되지 않습니다.'))
    }
  })
}

const baseScoreChanged = () => {
  let grdTab2MainData = grdTab2Main.value.getDataProvider().getRows()
  for (let i = 0; i < grdTab2MainData.length; i++) {
    if (Number(grdTab2MainData[i][6]) < Number(popupData.BASE_SCORE)) {
      grdTab2Main.value.getDataProvider().setValue(i, 'PASS', 'N')
      grdTab2Main.value.getDataProvider().setValue(i, 'FAILURE', 'Y')
      grdTab2Main.value.getDataProvider().setValue(i, 'REMARK', 'A')
    } else {
      grdTab2Main.value.getDataProvider().setValue(i, 'PASS', 'Y')
      grdTab2Main.value.getDataProvider().setValue(i, 'FAILURE', 'N')
      grdTab2Main.value.getDataProvider().setValue(i, 'REMARK', '')
    }
  }
}

//********************************************저장 영역**************************************************************/
//결재 상신 전
const beforeApply = async () => {
  let saveParams = []
  saveParams.push(grdTab1Main.value.getDataProvider().getRows())
  
  console.log('saveParams.length',saveParams[0].length)
  if (saveParams.length <= 0) {
    Message.warn(t('조회 후 진행해 주세요.'))
    return false
  }
  console.log('saveParams',saveParams)
  let errCode = 0
  
  if (saveParams[0].length <= 0) {
    Message.warn(t('대상자를 추가해 주세요.'))
    return false
  }
  await saveParams[0].forEach((val) => {
    if (isNullCheck(val[0])) {
      errCode = 1
      return false
    }
  })
  await saveParams[0].forEach((val) => {
  
    if (val[45] !== 'Y') {
      errCode = 2
      return false
    }
  })
  if (errCode === 1) {
    Message.warn(t('참석여부를 모두 선택해 주세요.'))
    return false
  }
  if (errCode === 2) {
    Message.warn(t('참석여부를 저장해 주세요.'))
    return false
  }
  console.log('popupData.APP_EMP_NO',popupData.APP_EMP_NO)
  if (isNullCheck(popupData.APP_EMP_NO) && appEmpNmVisible.value) {
    Message.warn(t('결재승인자를 추가해 주세요.'))
    return false
  }
  applyParams.YEAR = saveParams[0][0][21]
  applyParams.APP_EMP_NO = popupData.APP_EMP_NO

  //결재 전 결재승인자와 교육확인자가 같을때 첨부파일 확인

  const gridComponent = grdTab1Main.value; // ✅ 이 줄이 있어야 함!
  
  const gridView = gridComponent.getGridView(); // RealGrid의 gridView 객체
  const dataProvider = gridView.getDataSource(); // dataProvider 객체
  const allRows = dataProvider.getJsonRows(); // 전체 행 데이터 가져오기

  const isInvalid = allRows.some((row) => { 

  //변경 교육확인자와 결재담당자가 같을 경우가 있다.
  // if (row.EDU_CNFM_USER === applyParams.APP_EMP_NO) {
  // 교육대상과 교육확인자가 다를 경우 첨부파일 체크
  if(row.EDU_CNFM_USER_NM !== row.TARGET_NM){
    if(row.ATTEND_YN === 'Y'){
      if (fileUpload.value.cherckGridDataLength() < 1) {
        Message.warn(t('첨부파일을 등록해주세요.'));
        return true;
      }
    }
  }
    return false;
  });

  if (isInvalid) return; // 첨부파일 없으면 이후 로직 중단

  // allRows.forEach((row, index) => {
  //   if (row.EDU_CNFM_USER === applyParams.APP_EMP_NO) {
      
  //     if (fileUpload.value.cherckGridDataLength() < 1) {
  //       Message.warn(t('첨부파일을 등록해주세요.'))
  //       return false
  //     }
  //   }
  // });

  //내부 결재 이력 저장 차동운 2024-01-31
  const today = dayjs().format('YYYYMMDDHHmmssSSS')

  // let approvalParams = {
  //   CMPNY_DIV: applyParams.CMPNY_DIV,
  //   APPROVE_ID: applyParams.SCHEDULE_ID,
  //   APPROVE_GBN: 'I',
  //   FORM_ID: 'EDUAB0030',
  //   APP_EMP_NO: applyParams.APP_EMP_NO,
  //   APP_REQ_EMP_NO: applyParams.USER_ID,
  //   APP_REQ_DATE: dayjs(new Date()).format('YYYY-MM-DD'),
  //   PATH: '/60_edu/EDU_A/EDUAB0030',
  //   USER_ID: applyParams.USER_ID,
  // }
  // console.log('결재 상신 전 내부결재 데이터 확인', approvalParams)
  // commonExecuteApi({ queryId: 'OPRAB0010_SAVE_01', list: [approvalParams] })

  return true
}
//결재 상신
const saveApplyData = () => {
  // beforeApply 쿼리 작동 구문 가져와서 여기서 실행 시키기
  
  if(popupData.CURR_ID !== 'C120'){
    let approvalParams = {
      CMPNY_DIV: applyParams.CMPNY_DIV,
      APPROVE_ID: applyParams.SCHEDULE_ID,
      APPROVE_GBN: 'I',
      FORM_ID: 'EDUAB0030',
      APP_EMP_NO: applyParams.APP_EMP_NO,
      APP_REQ_EMP_NO: applyParams.USER_ID,
      APP_REQ_DATE: dayjs(new Date()).format('YYYY-MM-DD'),
      PATH: '/60_edu/EDU_A/EDUAB0030',
      APP_STATUS: 'N',
      USER_ID: applyParams.USER_ID,
    }
    console.log('결재 상신 전 내부결재 데이터 확인', approvalParams)
    commonExecuteApi({ queryId: 'OPRAB0010_SAVE_01', list: [approvalParams] }).then(res=>{
    
      
    })
  }

  let saveParams = {
      CMPNY_DIV: applyParams.CMPNY_DIV,
      YEAR: applyParams.YEAR,
      SCHEDULE_ID: applyParams.SCHEDULE_ID,
      APP_EMP_NO: applyParams.APP_EMP_NO,
      USER_ID: applyParams.USER_ID,
    }
  emailSearchParams.CMPNY_DIV = userStore.cmpnyDiv
  emailSearchParams.YEAR = saveParams.YEAR
  emailSearchParams.SCHEDULE_ID = saveParams.SCHEDULE_ID
  emailSearchParams.EMAIL_STATUS = 'ELSE'
  return commonExecuteApi({ queryId: 'EDUAB0030_SAVE_02', list: [saveParams] })
  
  // 추후 
}

//결재 상신 후
const afterApply = (res) => {
  console.log('res',res.list[0].OUT_RES_COD)
  //res.list[0].OUT_RES_COD === '0' 이상없이 쿼리문이 작동했을 때 상태값
  if(res.list[0].OUT_RES_COD === '0'){
    mailSend()
    onSearchData() 
  } else {
    // 결재 내용 초기화 진행
    console.log('applyParams',applyParams)
    let saveParams = {
        CMPNY_DIV: applyParams.CMPNY_DIV,
        SCHEDULE_ID: applyParams.SCHEDULE_ID,
      }
    commonExecuteApi({ queryId: 'EDUAB0030_TAB1_POP2_POP1_DELETE_01', list: [saveParams] }).then((res)=>{    
      onSearchData() 
    })
    
  }
  
}

//결재취소 전
const beforeApplyCancel = () => {
  let saveParams = []
  saveParams.push(grdTab1Main.value.getDataProvider().getRows())
  if (saveParams.length <= 0) {
    Message.warn(t('조회 후 진행해 주세요.'))
    return false
  }
  applyParams.YEAR = saveParams[0][0][21]
  applyParams.APP_EMP_NO = popupData.APP_EMP_NO
  return true
}

//결재취소
const saveApplyCancelData = () => {
  return commonExecuteApi({ queryId: 'EDUAB0030_TAB1_POP2_POP1_UPDATE_01', list: [applyParams] })
  //return commonExecuteApi({ queryId: 'EDUAB0030_SAVE_03', list: [applyParams] })
}

//결재취소 후
const afterApplyCancel = () => {
  onSearchData()
}

//결재 승인 전
const beforeApplyApprove = () => {
  let saveParams = []
  saveParams.push(grdTab1Main.value.getDataProvider().getRows())
  if (saveParams.length <= 0) {
    Message.warn(t('조회 후 진행해 주세요.'))
    return false
  }

  applyParams.YEAR = saveParams[0][0][21]
  applyParams.APP_EMP_NO = popupData.APP_EMP_NO
  return true
}

//결재 승인
const saveApplyApproveData = () => {
  let saveParams = {
    CMPNY_DIV: applyParams.CMPNY_DIV,
    YEAR: applyParams.YEAR,
    SCHEDULE_ID: applyParams.SCHEDULE_ID,
    DIV: 'Y',
    APP_EMP_NO: applyParams.APP_EMP_NO,
    USER_ID: applyParams.USER_ID,
  }
  emailSearchParams.CMPNY_DIV = userStore.cmpnyDiv
  emailSearchParams.YEAR = saveParams.YEAR
  emailSearchParams.SCHEDULE_ID = saveParams.SCHEDULE_ID
  emailSearchParams.EMAIL_STATUS = 'Y'
  return commonExecuteApi({ queryId: 'EDUAB0030_SAVE_04', list: [saveParams] })
}

//결재 승인 후
const afterApplyApprove = () => {
  mailSend()
  onSearchData()
}

//결재 반려 전
const beforeApplyTurnBack = () => {
  let saveParams = []
  saveParams.push(grdTab1Main.value.getDataProvider().getRows())
  if (saveParams.length <= 0) {
    Message.warn(t('조회 후 진행해 주세요.'))
    return false
  }
  if (isNullCheck(popupData.APP_DESC)) {
    Message.warn(t('반려 사유를 입력해 주세요.'))
    return false
  }

  applyParams.YEAR = saveParams[0][0][21]
  applyParams.APP_EMP_NO = popupData.APP_EMP_NO
  return true
}

//결재 반려
const saveApplyTurnBackData = () => {
  let saveParams = {
    CMPNY_DIV: applyParams.CMPNY_DIV,
    YEAR: applyParams.YEAR,
    SCHEDULE_ID: applyParams.SCHEDULE_ID,
    DIV: 'Y',
    APP_DESC: popupData.APP_DESC,
    APP_EMP_NO: applyParams.APP_EMP_NO,
    USER_ID: applyParams.USER_ID,
  }
  emailSearchParams.CMPNY_DIV = userStore.cmpnyDiv
  emailSearchParams.YEAR = saveParams.YEAR
  emailSearchParams.SCHEDULE_ID = saveParams.SCHEDULE_ID
  emailSearchParams.EMAIL_STATUS = 'C'
  return commonExecuteApi({ queryId: 'EDUAB0030_SAVE_05', list: [saveParams] })
}

//결재 반려 후
const afterApplyTurnBack = () => {
  mailSend()
  onSearchData()
}

//자격상태반영 전
const beforeApplyLiceStatus = () => {
  let saveParams = []
  saveParams.push(grdTab1Main.value.getDataProvider().getRows())
  if (saveParams.length <= 0) {
    Message.warn(t('조회 후 진행해 주세요.'))
    return false
  }  

  return true
}

//자격상태반영
const saveApplyLiceStatus = () => {
  let saveParams = {
    CMPNY_DIV: _Parameters.CMPNY_DIV,
    SCHEDULE_ID: _Parameters.SCHEDULE_ID,
    YEAR: _Parameters.YEAR,    
    EDUTIME_SERIAL: _Parameters.EDUTIME_SERIAL,    
    USER_ID: applyParams.USER_ID,
  }
  
  return commonExecuteApi({ queryId: 'EDUAB0030_TAB1_POP2_POP1_UPDATE_02', list: [saveParams] })
}

//자격상태반영 후
const afterApplyLiceStatus = () => {  
  
}

//이수확인 저장 전 유효성 검사
const beforeTab1MainSave = () => {
  let saveParams = []
  let checkedRows = grdTab1Main.value.getGridView().getCheckedRows()
  if (checkedRows.length === 0) {
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    return false
  }
  for (let i = 0; i < checkedRows.length; i++) {
    saveParams.push(
      grdTab1Main.value.getDataProvider().getJsonRow(checkedRows[i])
    )
    if (saveParams[i].ATTEND_YN === 'N' && isNullCheck(saveParams[i].REMARK)) {
      Message.warn(t('비고(사유기재)를 입력해 주세요.'))

      return false
    }
  }
  return true
}

//이수확인 저장
const saveTab1MainData = () => {
  let saveParams = []
  let checkedRows = grdTab1Main.value.getGridView().getCheckedRows()
  for (let i = 0; i < checkedRows.length; i++) {
    saveParams.push(
      grdTab1Main.value.getDataProvider().getJsonRow(checkedRows[i])
    )
    saveParams[i].USER_ID = userStore.userId
    saveParams[i].ATTEND = saveParams[i].ATTEND_YN
  }

  return commonExecuteApi({
    queryId: 'EDUAB0030_TAB01_POP2_POP1_TAB01_SAVE_01',
    list: saveParams,
  })
}

//이수확인 저장 후
const afterTab1MainSave = () => {
  grdTab1Main.value.getGridView().setAllCheck(false)
  onSearchData()
}

//평가관리 저장 전
const beforeTab2MainSave = () => {
  let saveParams = []
  let checkedRows = grdTab2Main.value.getGridView().getCheckedRows()
  if (checkedRows.length === 0) {
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    return false
  }
  for (let i = 0; i < checkedRows.length; i++) {
    saveParams.push(grdTab2Main.value.getGridView().getValues(i))
    console.log('저장할 파람 ::::::::::: ', saveParams[i])
    if (saveParams[i].FAILURE === 'Y' && isNullCheck(saveParams[i].REMARK)) {
      Message.warn(t('불합격인 데이터는 비고(사유기재)를 입력해 주세요.'))
      return false
    }
  }
  return true
}

//평가관리 저장
const saveTab2MainData = () => {
  let saveParams = []
  let checkedRows = grdTab2Main.value.getGridView().getCheckedRows()

  if (checkedRows.length === 0) {
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    return false
  }
  for (let i = 0; i < checkedRows.length; i++) {
    saveParams.push(
      grdTab2Main.value.getDataProvider().getJsonRow(checkedRows[i])
    )
    saveParams[i].USER_ID = userStore.userId
    saveParams[i].BASE_SCORE = popupData.BASE_SCORE
  }
  console.log('저장될 데이터 확인', saveParams)
  return commonExecuteApi({
    queryId: 'EDUAB0030_TAB01_POP2_POP1_TAB02_SAVE_01',
    list: saveParams,
  })
}

//평가관리 저장 후
const afterTab2MainSave = () => {
  grdTab2Main.value.getGridView().setAllCheck(false)
  onSearchMainGridData()
}

//********************************************저장 영역(종료)**************************************************************/
//***********************************************삭제 영역*****************************************************************/
//이수확인 삭제 전
const beforeTab1MainDelete = () => {
  return true
}

//이수확인 삭제
const deleteTab1MainData = () => {
  let deleteParams = []
  let checkedRows = grdTab1Main.value.getGridView().getCheckedRows()
  if (checkedRows.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))
    return false
  }
  for (let i = 0; i < checkedRows.length; i++) {
    deleteParams.push(
      grdTab1Main.value.getDataProvider().getJsonRow(checkedRows[i])
    )
    deleteParams[i].USER_ID = userStore.userId
    deleteParams[i].ATTEND = deleteParams[i].ATTEND_YN
  }

  return commonExecuteApi({
    queryId: 'EDUAB0030_TAB01_POP2_POP1_TAB01_DELETE_01',
    list: deleteParams,
  })
}

//이수확인 삭제 후
const afterTab1MainDelete = () => {
  grdTab1Main.value.getGridView().setAllCheck(false)
  onSearchData()
}

//평가관리 삭제 전
const beforeTab2MainDelete = () => {
  return true
}

//평가관리 삭제
const deleteTab2MainData = () => {
  let deleteParams = []
  let checkedRows = grdTab2Main.value.getGridView().getCheckedRows()
  if (checkedRows.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))
    return false
  }
  for (let i = 0; i < checkedRows.length; i++) {
    deleteParams.push(
      grdTab2Main.value.getDataProvider().getJsonRow(checkedRows[i])
    )
    deleteParams[i].USER_ID = userStore.userId
    deleteParams[i].ATTEND = deleteParams[i].ATTEND_YN
  }

  return commonExecuteApi({
    queryId: 'EDUAB0030_TAB01_POP2_POP1_TAB02_DELETE_01',
    list: deleteParams,
  })
}

//평가관리 삭제 후
const afterTab2MainDelete = () => {
  grdTab2Main.value.getGridView().setAllCheck(false)
  onSearchTab2MainGridData()
}

//********************************************삭제 영역(종료)**************************************************************/

//상세정보 조회
const cellClickMain = (grid, data) => {
  console.log('상세정보 조회 확인')
  onSearchTab1MainGridData()
  onSearchTab2MainGridData()
}

//분류 변경 이벤트
const updateDivision = () => {
  codeList.CURR_ID = []
  popupData.CURR_ID = ''
  commonSearchApi({ queryId: 'EDUAD0010_SEARCH_05', param: popupData }).then(
    (res) => {
      console.log('교육명 조회 :::: >>>>', res)
      codeList.CURR_ID.push({ COD: '', TXT: '전체' })
      res.ORESULT_CUR.forEach((element) => {
        codeList.CURR_ID.push(element)
      })
    }
  )

  // 운전보수 교육일 때 자격상태반영 버튼 표시
  if(popupData.DIVISION === 'M'){
    mainTitle.value.setBtnProperty('btnApplyLiceStatus', 'visible', true) //자격상태반영
  } else {
    mainTitle.value.setBtnProperty('btnApplyLiceStatus', 'visible', false) //자격상태반영
  }
}

//팝업 오픈
const openEmpPopup = () => {
  if (readOnlyAPP_EMP_NO.value === false) {
    empPopup.value.openPopup({ EMP_NM: popupData.APP_EMP_NM })
  }
}

const onEmpSelected = (row) => {
  popupData.APP_EMP_NM = row.EMP_NM
  popupData.APP_EMP_NO = row.EMP_NO
}

//널 체크 이벤트
const isNullCheck = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}

//파일 업로드
const uploaded = (val) => {
  console.log('file upload',val)
  console.log(' popupData',popupData) 
  
  if(!file_yn){
    console.log('파일 초회 추가')
    const saveData = [{
      CMPNY_DIV: popupData.CMPNY_DIV
      ,SCHEDULE_ID: popupData.SCHEDULE_ID
      ,YEAR: popupData.YEAR
      ,ATTACH_ID: fileUpload.value.guid
      ,USER_ID: userStore.empNo
    }]
    commonExecuteApi({ queryId: 'EDUAB0030_TAB01_POP2_POP1_TAB01_SAVE_02', list: saveData })
    console.log('saveData',saveData)
    file_yn = true
  }
}

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1600px"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>부서/협력사 교육 실적</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title>
        <IGridTitle
          ref="mainTitle"
          :use-permission="false"
          :button-list="[
            'btnCompleteConfirm', //이수확정
            'btnCancelConfirm', //확정취소
            'btnApplyCancel', //결재취소
            'btnReqApply', //결재상신
            'btnApplyApprove',//결재승인
            'btnApplyTurnBack',//결재반려
            'btnSendSurvey',//설문지전송
            'btnApplyLiceStatus',//자격상태반영
            'btnClose',
          ]"
          @click-button="onButtonsClickMain"
        />
      </v-card-title>
      <!-- 조회조건 -->
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex" style="width: 100%; height: 100%">
          <div>
            <v-sheet class="flex-column searchArea mr-2">
              <div class="d-flex mb-2">
                <i-select
                  :label="$t('분류')"
                  labelWidth="72px"
                  width="320px"
                  v-model="popupData.DIVISION"
                  :items="codeList.DIVISION"
                  item-value="COD"
                  item-title="TXT"
                  readonly
                  @update:modelValue="updateDivision"
                />
                <i-select
                  :label="$t('교육명')"
                  labelWidth="50px"
                  width="250px"
                  v-model="popupData.CURR_ID"
                  :items="codeList.CURR_ID"
                  item-value="COD"
                  item-title="TXT"
                  readonly
                />
              </div>
              <div class="mb-2">
                <i-input
                  :label="$t('교육내용')"
                  labelWidth="72px"
                  width="590px"
                  v-model="popupData.EDU_CONTENT"
                  rows="3"
                  readonly
                />
              </div>
              <div class="d-flex mb-2" v-if="appEmpNmVisible">
                <i-input
                  :label="$t('결재승인자')"
                  labelWidth="72px"
                  width="200px"
                  v-model="popupData.APP_EMP_NM"
                  :readonly="readOnlyAPP_EMP_NO"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openEmpPopup()"
                  @keydown.enter="
                    (e) => {
                      openEmpPopup()
                    }
                  "
                  @update:modelValue="
                    (e) => {
                      popupData.APP_EMP_NO = null
                    }
                  "
                />
                <i-input
                  v-if="appEmpNoVisible"
                  width="100px"
                  v-model="popupData.APP_EMP_NO"
                  readonly
                />
                <i-input
                  v-if="appStatusNm"
                  :label="$t('결재상태')"
                  labelWidth="50px"
                  width="250px"
                  v-model="popupData.APP_STATUS"
                  readonly
                />
              </div>
              <div
                class="mb-2"
                v-if="!appEmpNmVisible"
                style="height: 59px"
              ></div>
              <div class="d-flex" v-if="appDescVisible">
                <i-input
                  :label="$t('반려사유')"
                  labelWidth="72px"
                  width="590px"
                  v-model="popupData.APP_DESC"
                  :readonly="readOnlyAPP_DESC"
                />
              </div>
              <div v-if="!appDescVisible" style="height: 15px"></div>
            </v-sheet>
            <v-sheet width="100%" height="72%">
              <div class="mb-2 pr-2" style="width: 100%; height: 100%">
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  @onCellClicked="cellClickMain"
                />
              </div>
              <div class="pr-2" style="width: 100%; height: 100%">
                <IUpload
                  ref="fileUpload"
                  class="pa-0"
                  :button-list="button"
                  @uploaded="uploaded"
                  :is-visibled="true"
                />
              </div>
            </v-sheet>
          </div>

          <div style="height: 100%; width: 100%">
            <VTabs v-model="tab" @click="selectedChanged(tab)">
              <VTab value="tab1"> 이수확인 </VTab>
              <VTab v-if="popupData.EXAM_YN === 'Y'" value="tab2">
                평가관리
              </VTab>
            </VTabs>
            <VWindow v-model="tab">
              <VWindowItem value="tab1">
                <div class="flex-column">
                  <v-sheet
                    class="searchArea d-flex"
                    v-if="attendYnVisible"
                    style="justify-content: space-between"
                  >
                    <div class="d-flex">
                      <i-select
                        :label="$t('참석여부:')"
                        labelWidth="60px"
                        width="200px"
                        class="ma-0"
                        v-model="popupData.ATTEND_YN"
                        :items="codeList.ATTEND_YN"
                        item-value="COD"
                        item-title="TXT"
                      />
                      <IGridTitle
                        ref="tabMainTitle1"
                        class="ma-0"
                        :use-permission="false"
                        :button-list="['btnCollectiveApp']"
                        @click-button="onButtonsClick"
                      />
                    </div>
                    <div>
                      <IGridTitle
                        ref="tabMainTitle2"
                        class="ma-0"
                        :use-permission="false"
                        :button-list="['btnUpdate', 'btnDelete']"
                        @click-button="onButtonsClick"
                      />
                    </div>
                  </v-sheet>
                  <v-sheet
                    class="searchArea d-flex"
                    v-if="!attendYnVisible"
                    style="height: 59px"
                  />
                  <div style="height: 630px; width: 100%">
                    <RealGrid
                      ref="grdTab1Main"
                      :grid-view-option="grdTab1MainProps.gridViewOption"
                      :fields="grdTab1MainProps.fields"
                      :columns="grdTab1MainProps.columns"
                    />
                  </div>
                </div>
              </VWindowItem>

              <VWindowItem v-if="popupData.EXAM_YN === 'Y'" value="tab2">
                <div class="flex-column">
                  <v-sheet
                    class="d-flex searchArea"
                    v-if="popupData.SAVE_YN === 'Y'"
                    width="100%"
                    style="justify-content: space-between"
                  >
                    <div class="d-flex">
                      <i-input
                        :label="$t('기준점수:')"
                        type="number"
                        labelWidth="60px"
                        width="130px"
                        class="ma-0 mr-1"
                        v-model="popupData.BASE_SCORE"
                        :rules="[requiredBASE_SCORE]"
                        @update:model-value="baseScoreChanged"
                      />
                      <span class="mt-1 mr-2">점</span>
                      <VBtn text="재적용" class="ma-0 mr-2" @click="ApplyBtn" />
                      <VBtn
                        text="선택인원 합격"
                        class="ma-0"
                        @click="SelectPassBtn"
                      />
                    </div>
                    <div>
                      <IGridTitle
                        class="ma-0 mr-2"
                        :use-permission="false"
                        :button-list="['btnUpdate', 'btnDelete']"
                        @click-button="onButtonsClick2"
                      />
                    </div>
                  </v-sheet>
                  <v-sheet
                    class="searchArea d-flex"
                    v-if="popupData.SAVE_YN === 'N'"
                    style="height: 59px"
                  />
                  <div style="height: 630px; width: 100%">
                    <RealGrid
                      ref="grdTab2Main"
                      :grid-view-option="grdTab2MainProps.gridViewOption"
                      :fields="grdTab2MainProps.fields"
                      :columns="grdTab2MainProps.columns"
                      @onEditRowChanged="grdTab2MainEditRowChanged"
                    />
                  </div>
                </div>
              </VWindowItem>
            </VWindow>
          </div>
        </div>
      </v-card-text>
      <EmpPopup ref="empPopup" @selected="onEmpSelected" />
      <EDUAB0030Tab01Pop02Pop01Pop01 ref="eDUAB0030Tab01Pop02Pop01Pop01" />
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>
