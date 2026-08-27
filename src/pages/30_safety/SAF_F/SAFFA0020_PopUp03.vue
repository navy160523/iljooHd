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
const mainTitle = ref(null)
const tabMainTitle1 = ref(null)
const tabMainTitle2 = ref(null)
const saveArea = ref(null)
const tab = ref('tab')
let CREATE_YN = ''

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

const button = reactive(['btnDownLoad'])
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
      header: { text: t('출결인원') },
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
      editable: false,
      width: '60',
    },
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


// 그리드 컬럼 세팅
grdMainProps.columns = grdMainProps.fields
grdTab1MainProps.columns = grdTab1MainProps.fields

//*****************************************오픈 팝업********************************************/
const openPopup = async (data) => {
  console.log('부서/협력사 교육 실적 팝업창 받아온 데이터', data)
  clearData()
  //주관부서, 교육주기, 교육시간 데이터 바인딩
  await Promise.all([ 
    getCodeList('HHID010'),
    getCodeList('HHID070'),
    commonSearchApi({ queryId: 'EDUAB0070_SEARCH_02', param: {} }),
  ]).then((res) => {
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
    // popupData.EDU_DATE = data.EDU_DATE.substring(0, 10).replaceAll('.', '-') //교육일자
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

  // 부서별 안전교육 현황
  appEmpNmVisible.value = false
  appEmpNoVisible.value = false
  appStatusNm.value = false
}

//창 닫음
const onClose = () => {
  fileUpload.value.clearGrid() //팝업 닫을때 파일업로드 그리드 초기화
  dialog.value = false
}

const onButtonsClickMain = (btn) => {
  if (btn.id === 'btnClose') {
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
    queryId: 'SAFFA0020_SEARCH_15',
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
  })

  //첨부파일
  commonSearchApi({
    queryId: 'SAFFA0020_SEARCH_08',
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
    queryId: 'SAFFA0020_SEARCH_09',
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
    queryId: 'SAFFA0020_SEARCH_07',
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
    queryId: 'SAFFA0020_SEARCH_07',
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

//상세정보 조회
const cellClickMain = (grid, data) => {
  console.log('상세정보 조회 확인')
  onSearchTab1MainGridData()
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
}

//팝업 오픈
const openEmpPopup = () => {
  if (readOnlyAPP_EMP_NO.value === false) {
    empPopup.value.openPopup({ EMP_NM: popupData.APP_EMP_NM })
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
    height="800px"
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
          :button-list="['btnClose']"
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
              <div v-if="!appDescVisible" style="height: 15px"></div>
            </v-sheet>
            <v-sheet width="100%" height="81%">
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
                  :is-visibled="false"
                />
              </div>
            </v-sheet>
          </div>

          <div style="height: 100%; width: 100%">
            <VTabs v-model="tab" >
              <VTab value="tab1"> 이수확인 </VTab>
            </VTabs>
            <VWindow v-model="tab">
              <VWindowItem value="tab1">
                <div class="flex-column">
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
            </VWindow>
          </div>
        </div>
      </v-card-text>
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
