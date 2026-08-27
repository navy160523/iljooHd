<!--
  화면명 : 교육 신청 등록(신청분)
  화면개요 : 교육 일정을 신청하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import IButtonList from '@/components/IButtonList.vue'
import EmpPopup from '@/components/popup/EmpPopupMultiDept.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import EDUAB0030Tab01Pop01Pop08 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop08.vue'
import EDUAB0030Tab01Pop01Pop09 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop09.vue'
import EDUAB0030Tab01Pop01Pop11 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop11.vue'
import EDUAB0030Tab01Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01.vue'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import SendSMSPopUp from '@/components/popup/SendSMSPopUp.vue'
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'
import { ButtonVisibility } from 'realgrid'

//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const grdTime = ref(null)
const popupButtons1 = ref(null)
const popupButtons2 = ref(null)
const grdTimeButtons = ref(null)
const grdTimeButtons2 = ref(null)
const grdMainButtons = ref(null)
const eDUAB0030Tab01Pop01Pop08 = ref(null)//교육장소 팝업
const eDUAB0030Tab01Pop01Pop09 = ref(null)//교육강사 팝업
const eDUAB0030Tab01Pop01Pop11 = ref(null)//리스크
const sendMailPopup = ref(null)//메일 발송 팝업
const sendSMSPopup = ref(null)//문자 발송 팝업
const empPopup = ref(null)//사원검색 팝업
const grdTimeFocusedRowIdx = ref(null)
const grdTimeButtonUseYn = ref(null)
const TARGET_CNT = ref('교육대상자(0명)')
const eDUAB0030Tab01Pop01 = ref(null)
const _Parameters = reactive({CMPNY_DIV : '', YEAR : '', SCHEDULE_ID : '', EDU_DIV : '', CURR_ID : '', MORGN_ID : '',
                              MORGN_EMP_NO : '', MORGN_BSNSCD : '', MORGN_DEPTCD : '', MORGN_DEPTNM : '',
                              EDU_TITLE : '', TARGET_DIV : '', TARGET_DETAIL : '', EDATE_FROM : '', EDATE_TO : '',
                              LEAD_TIME : '', EPLACE_DIV : '', EPLACE_ID : '', EPLACE_ETC : '', EDUPOSSIBLE_NUM : '',
                              LECTURER_ID : '', EDU_CONTENT : '', ATTACH_KEY : '', LECTURER_NM : '', CON_DIV : '',
                              EPLACE_NM : '', EPLACE_NUM : '', DIVISION : '', EDU_DATE : '', INSERT_USER_ID : '',
                              SEND_YN : '', REQ_YN : '', SAVE_YN : '', APP_EMP_NO : '', APP_REQ_EMP_NO : '',
                              APP_STATUS : '', APPEMPNO_NM : '', APPSTATUS_NM : '', ATTACH_YN : '', CURR_NM : '',
                              EDATE : '', EDUTIME_SERIAL : '', EDU_DESC : '', EDU_INTRO : '', INSERT_USER_ID : '',
                              OPEN_DATE : '', PASS_CNT : '', REQ_DUR_FROM : '', REQ_DUR_TO : '', STATUS : '',
                              TARGET : '', TARGET_CNT : '', TARGET_DETAIL : '', WORK_STD_ID : '', WORK_STD_NM : ''})
const _openType = ref(null)
const control = reactive({
  DIVISION : true,
  CURR_ID : true,
  MORGN_ID : true
})
const emit = defineEmits([])

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const printParams = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// #1 END ------------------------------------------------------

const AUTH_GRP_CD = ref(null) //권한그룹
const popupData = reactive({
  SCHEDULE_ID : '',
  DIVISION : null,      //분류
  CURR_ID : '',         //교육명
  MORGN_ID : '',        //주관부서
  EDU_TITLE : '',       //제목
  EDU_DATE : '',        //교육기간(시작)
  EDU_DATE_END : '',    //교육기간(종료)
  LEAD_TIME : '',       //소요시간
  REQ_DUR_FROM : '',    //신청기간(시작)
  REQ_DUR_TO : '',      //신청기간(종료)
  EDUPOSSIBLE_NUM : '', //가능인원
  TARGET : '',          //대상
  EDU_INTRO : '',       //과정소개
  EDU_DESC : '',        //교육내용상세
  REMARK : '',          //비고
  STATUS : '',          //진행상태
  OPEN_DATE : '',       //개설일
  WORK_STD_ID : '',     //작업표준ID
  WORK_STD_NM : '',     //작업표준명
  AGE : '',             //연령제한
})

//일별 교시 상세 데이터
const timePopupData = reactive({
  EPLACE_DIV_YN : 'N',   //교육장소 구분 여부
  EPLACE_DIV : '',        //교육장소 구분
  EPLACE_ETC : '',        //교육장소
  LECTURER_ID_YN : 'N',  //강사 여부
  LECTURER_ID : ''        //강사
})

//레이아웃 visible 여부 설정
const visible = reactive({
  MORGN_DIV : true,       //주관부서
  EDU_CONTENT : true,     //교육내용
  VR_CATEGORY1 : true,    //교육내용1
  VR_CATEGORY2 : true,    //교육내용2
  WORK_STD_NM : false     //위험성평가
})

//레이아웃 disable 여부 설정
const disable = reactive({
  SCHEDULE_ID : false,
  DIVISION : false,        //분류
  CURR_ID : false,         //교육명
  MORGN_ID : false,        //주관부서
  EDU_TITLE : false,       //제목
  EDU_DATE : false,        //교육기간(시작)
  EDU_DATE_END : false,    //교육기간(종료)
  LEAD_TIME : false,       //소요시간
  REQ_DUR_FROM : false,    //신청기간(시작)
  REQ_DUR_TO : false,      //신청기간(종료)
  EDUPOSSIBLE_NUM : false, //가능인원
  TARGET : true,           //대상
  EPLACE_DIV : false,      //교육장 구분
  EPLACE_ETC : false,      //교육장소
  LECTURER_ID : false      //강사
})


const codeList = reactive({
  division : [],   //분류
  currId : [],     //교육명
  morgnId : [],    //주관부서
  eplaceDiv : [],  //교육장소
  status : [],     //진행상태
  remark : [],     //비고(제외사유)
  auth_currId: [], // 개설제한 교육 체크
  auth_deptCd: [], // 개설제한 부서 체크
})

let init_status = true

//그룹 목록
const grdTimeProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false }, footer: {visible:true} },
  fields : [
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육일자'), styleName: 'header_validit' }, editable: true,
      'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
      editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
      mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} }  },
    { fieldName: 'EDUTIME_SEQ', dataType: 'text', header: { text: t('교시') }, editable: false },
    { fieldName: 'EDU_TIME', dataType: 'te  xt',  width:'50', header: { text: t('시작'), styleName: 'header_validit' }, styleName: 'editable_column',
      editor: {
        mask: { 
          definitions: {
            "b" : '[0-2]', 
            "c" : '[0-9]', 
            "d": '[0-5]', 
            "e": "[0-9]"
          },
        editMask: 'bc:de',
        includedFormat: true,
        overWrite: true,
        allowEmpty: true,
        }
      }, 
      textFormat: "([0-9]{2})([0-9]{2});$1:$2", editable: true},
    { fieldName: 'EDU_TIME_FN', dataType: 'minute', width:'50', header: { text: t('종료'), styleName: 'header_validit' }, styleName: 'editable_column',
      editor: {
        mask: { 
          definitions: {
            "b" : '[0-2]', 
            "c" : '[0-9]', 
            "d": '[0-5]', 
            "e": "[0-9]"
          },
        editMask: 'bc:de',
        includedFormat: true,
        overWrite: true,
        allowEmpty: true,
        }
      }, 
      textFormat: "([0-9]{2})([0-9]{2});$1:$2", editable: true},
    { fieldName: 'LEAD_TIME', dataType: 'text', header: { text: t('시간(분)') }, editable: false },
    { fieldName: 'EPLACE_DIV', dataType: 'text', header: { text: t('구분'), styleName: 'header_validit' }, editable: true, styleName: 'editable_column', lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'EPLACE_ETC', dataType: 'text', header: { text: t('장소'), styleName: 'header_validit' }, styleName: 'left-column editable_column', lookupDisplay: true,
      button:"action", buttonVisibility: "always", textReadOnly: true },
    { fieldName: 'LECTURER_NM', dataType: 'text', header: { text: t('강사명'), styleName: 'header_validit' }, editable: false, styleName: 'left-column editable_column', lookupDisplay: true,
      button:"action", buttonVisibility: "always", textReadOnly: true },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('차수') }, editable: false, visible: false },
    { fieldName: 'TIME_SEQ', dataType: 'text', header: { text: t('일련번호') }, editable: false, visible: false },
    { fieldName: 'EDU_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EPLACE_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'CON_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'REQ_YN', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'LECTURER_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'OLD_EDU_DATE', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('') }, editable: false, visible: false },

  ],
  columns: [],
  columnLayout: [
    'EDU_DATE',
    'EDUTIME_SEQ',
    {
      name:'교육시각',
      direction: 'horizontal',
      items: ['EDU_TIME', 'EDU_TIME_FN', 'LEAD_TIME'],
      header: { text : t('교육시각')}
    },
    {
      name:'교육장소',
      direction: 'horizontal',
      items: ['EPLACE_DIV', 'EPLACE_ETC'],
      header: { text : t('교육장소')}
    },
    'LECTURER_NM'
  ],
})

// //대상자 목록
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false }, footer: {visible:true} },
  fields : [
    { fieldName: 'ORGN_NM', dataType: 'text', header: { text: t('소속') }, editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사용자 ID') }, editable: false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('교육차수') }, editable: false },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육시작일') }, editable: false },
    { fieldName: 'EDU_DATE_END', dataType: 'text', header: { text: t('교육종료일') }, editable: false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable: false },
    { fieldName: 'NON_YN', dataType: 'text', header: { text: t('제외') }, editable: false },//chkNON_YN
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고(제외사유)') }, editable: false, lookupDisplay: true,
      editor: { type: 'list' }, editable: false },//rpsREMARK
    { fieldName: 'EDU_DIV', dataType: 'text', header: { text: t('이수여부') }, editable: false },
    { fieldName: 'EDU_SCORE', dataType: 'text', header: { text: t('교육점수') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'ORGN_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EMAIL', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'FINISH_YN', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'VIO_NO', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'VIO_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'VIO_DESC', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'VIO_TIME', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'COMPANY', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'HND_PHN', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
  ],
  columns: [],
  columnLayout: [
    'EDU_DATE',
    'EDUTIME_SEQ',
    {
      name:'교육시간',
      direction: 'horizontal',
      items: ['EDU_TIME', 'EDU_TIME_FN', 'LEAD_TIME'],
      header: { text : t('교육시간')}
    },
    'LECTURER_NM', 
    'EPLACE_ETC'
  ],
})

grdMainProps.columns = grdMainProps.fields
grdTimeProps.columns = grdTimeProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'),
    getCodeList('HHID070'),
    getCodeList('HHID260')
  ])
  .then(res => {
    console.log("레스 확인",res)
    codeList.division = res[0].ORESULT_CUR
    codeList.division.unshift({TXT : '선택', COD : ''})
    popupData.DIVISION = ''

    //codeList.remark = res[1].ORESULT_CUR //불합격사유
    res[1].ORESULT_CUR.forEach(val => {
      codeList.remark.push({TXT : val.TXT, COD : val.COD})
    })
    grdMain.value.setBindingColumn("REMARK", codeList.remark, "COD", "TXT")

    codeList.auth_currId = res[2].ORESULT_CUR

    //일별 교시 상세 > 교육장소 데이터 바인딩
    codeList.eplaceDiv = []
    codeList.eplaceDiv.push({COD : 'A', TXT : '안전교육장'}, {COD : 'B', TXT : '기타'})
    timePopupData.EPLACE_DIV = codeList.eplaceDiv[0].COD
    grdTime.value.setBindingColumn("EPLACE_DIV",[], "COD", "TXT")
    grdTime.value.setBindingColumn("EPLACE_DIV",codeList.eplaceDiv, "COD", "TXT")

    codeList.status.push({COD : '1', TXT : '임시저장'}, {COD : '2', TXT : '개설'}, {COD : '3', TXT : '확정'},
                         {COD : '4', TXT : '완료'}, {COD : '5', TXT : '완료'})
    popupData.EDU_DIV = ''                    
  })
  popupButtons1.value.setBtnProperty('btnDelete', 'visible', false) //삭제버튼

  if(!isNullCheck(userStore.authGrpCd)){
    AUTH_GRP_CD.value === null
    userStore.authGrpCd.forEach(val => {
      if(AUTH_GRP_CD.value === null){
        AUTH_GRP_CD.value = val
      }else{
        AUTH_GRP_CD.value += ', ' + val
      }
    })
  }
}

//분류 변경시 이벤트
watch(() => popupData.DIVISION, (newValue, oldValue) => {
  // if(popupData.DIVISION === 'T'){
  //   visible.WORK_STD_NM = true
  // }else{
  //   visible.WORK_STD_NM = false
  // }
  if(!isNullCheck(codeList.currId)){
    codeList.currId = []
    if(!init_status){
      popupData.CURR_ID = ''
    }
  }
  if(!isNullCheck(codeList.morgnId)){
    codeList.morgnId = []
    popupData.MORGN_ID = ''
  }

  popupData.TARGET = ''
  popupData.EDU_INTRO = ''
  popupData.EDU_DESC = ''
  popupData.REMARK = ''
   
  let searchParams = {
    CMPNY_DIV: userStore.cmpnyDiv, 
    DIVISION : newValue, 
    USER_ID : userStore.empNo,
    AUTH_GRP_CD : AUTH_GRP_CD.value
  }

  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP02_POP02_SEARCH_02', param : searchParams }).then(res => {
    console.log("교육명 조회 :::: >>>> ",res)
    if(res.ORESULT_CUR.length > 0){
      codeList.currId = res.ORESULT_CUR
      if(!init_status){
        popupData.CURR_ID = codeList.currId[0].COD
      }
      makeGrid()
      init_status = false
    }
  })
})

//교육명 변경시 이벤트
watch(() => popupData.CURR_ID, (newValue, oldValue) => {

  
  grdMain.value.getDataProvider().setRows([])

  //연령제한 입력
  codeList.currId.forEach(val => {
    if(popupData.CURR_ID === val.COD){
      popupData.AGE = val.AGE_RESTRICTION === null ? '0' : val.AGE_RESTRICTION  
    }
  })

  if(!isNullCheck(codeList.morgnId)){
    codeList.morgnId = []
    popupData.MORGN_ID = ''
  }

  popupData.TARGET = ''
  popupData.EDU_INTRO = ''
  popupData.EDU_DESC = ''
  popupData.REMARK = ''

  if(codeList.currId.findIndex(e => e.COD === newValue) < 0){
    return
  }

  let searchParams = {
    CMPNY_DIV: userStore.cmpnyDiv, 
    DIVISION : popupData.DIVISION, 
    CURR_ID : newValue 
  }

  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP02_POP02_SEARCH_03', param : searchParams }).then(res => {
    console.log("주관부서 :::: >>>> ",res.ORESULT_CUR)
    if(res.ORESULT_CUR.length > 0){
      codeList.morgnId = res.ORESULT_CUR
      codeList.morgnId.unshift({TXT : '선택', COD : ''})
      popupData.MORGN_ID =codeList.morgnId[0].COD
    }
    if(!isNullCheck(_Parameters.MORGN_ID)){
      codeList.morgnId.forEach(val => {
        if(val.EMP_NO === _Parameters.MORGN_EMP_NO){
          popupData.MORGN_ID = val.COD
        }
      })
    }
  })
})

//주관부서 변경시 이벤트
watch(() => popupData.MORGN_ID, (newValue, oldValue) => {
  popupData.TARGET = ''
  popupData.EDU_INTRO = ''
  popupData.EDU_DESC = ''
  popupData.REMARK = ''
  let MORGN_ID_INDEX = codeList.morgnId.findIndex(e => e.COD === popupData.MORGN_ID)
  if(MORGN_ID_INDEX < 0){
    return
  }
  if(!isNullCheck(popupData.CURR_ID) && !isNullCheck(codeList.currId)){
    popupData.TARGET = codeList.morgnId[MORGN_ID_INDEX].TARGET
    popupData.EDU_INTRO = codeList.morgnId[MORGN_ID_INDEX].EDU_INTRO
    popupData.EDU_DESC = codeList.morgnId[MORGN_ID_INDEX].EDU_DESC
    popupData.REMARK = codeList.morgnId[MORGN_ID_INDEX].REMARK

    _Parameters.MORGN_ID = codeList.morgnId[MORGN_ID_INDEX].MNG_ORGN
    _Parameters.MORGN_EMP_NO = codeList.morgnId[MORGN_ID_INDEX].EMP_NO
    _Parameters.MORGN_BSNSCD = codeList.morgnId[MORGN_ID_INDEX].BSNS_CD
    _Parameters.MORGN_DEPTCD = codeList.morgnId[MORGN_ID_INDEX].DEPT_CD
    _Parameters.MORGN_DEPTNM = codeList.morgnId[MORGN_ID_INDEX].DEPT_NM
  }
})


const makeGrid = () => {
  grdMainProps.fields = [] 
  try{
    grdMainProps.fields.push([
      { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName:'left-column', editable: false },
      { fieldName: 'ORGN_NM', dataType: 'text', header: { text: t('부서') }, styleName:'left-column', editable: false },
      { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, styleName:'left-column', editable: false },
      { fieldName: 'ORI_ORGN_NM', dataType: 'text', header: { text: t('신청당시소속') }, styleName:'left-column', editable: false },
      { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
      { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사용자 아이디') }, editable: false },
      { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
      //2024.06.14 이규호 책임 요청으로 차수 visible false 처리
      { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('차수') }, editable: false, visible:false },
      { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육시작일') }, editable: false },
      { fieldName: 'EDU_DATE_END', dataType: 'text', header: { text: t('교육종료일') }, editable: false },
      { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable: false },
      { fieldName: 'NON_YN', dataType: 'text', header: { text: t('제외') }, editable: false },
      { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고(제외사유)') }, styleName: 'left-column', editable : false, width: '200', lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: false }   },
      { fieldName: 'EDU_DIV', dataType: 'text', header: { text: t('이수여부') }, editable: false },
      { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직구분') }, editable: false },
      { fieldName: 'EDU_SCORE', dataType: 'text', header: { text: t('이수점수') }, editable: false },
      { fieldName: 'ATTEND_TIME', dataType: 'text', header: { text: t('출석시간') }, editable: false },
    ])
    if(popupData.CURR_ID === 'C001' || popupData.CURR_ID === 'C002'){
      grdMainProps.fields[0].push(
        { fieldName: 'COM_ENT_DATE', dataType: 'text', header: { text: t('당사최초 입사일자') }, editable: false },
        { fieldName: 'JOB_PRMT_DATE', dataType: 'text', header: { text: t('승진일자') }, editable: false },
        { fieldName: 'OFFI_RES_DATE', dataType: 'text', header: { text: t('직책보임 일자') }, editable: false },
        { fieldName: 'ORI_OFFI_RES_NM', dataType: 'text', header: { text: t('원소속 직책') }, editable: false },
        { fieldName: 'USER_DIV', dataType: 'text', header: { text: t('고용 형태') }, editable: false },
        { fieldName: 'JOB_DEPT_NM', dataType: 'text', header: { text: t('사원 유형') }, editable: false },
        { fieldName: 'GRP_ENT_DATE', dataType: 'text', header: { text: t('그룹 입사일자') }, editable: false },
        { fieldName: 'WRK_PLC_NM', dataType: 'text', header: { text: t('근무지') }, editable: false },
      )
    }

    //비활성화
    grdMainProps.fields[0].push(
      { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'YEAR', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'OFFI_RES_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'ORGN_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'EMAIL', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'FINISH_YN', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'VIO_NO', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'VIO_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'COMPANY', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'BIRTH_YEAR', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    ) 

    grdMainProps.columns = grdMainProps.fields[0]
    grdMain.value.getDataProvider().setFields(grdMainProps.fields[0])
    grdMain.value.getGridView().setColumns(grdMainProps.columns)
    grdMain.value.setBindingColumn("REMARK", codeList.remark, "COD", "TXT")
  }
  catch(err){
    Message.err(err)
  }
}
//*************************************************************************************************************************/
//*************************************************세팅 영역(종료)*********************************************************/
//*************************************************************************************************************************/

//***********************************************************************************************************************/
//***************************************************이벤트 영역*********************************************************/
//***********************************************************************************************************************/
const openPopup = async (data , openType) => {
  openRefresh()
  for(const key in await data){
    _Parameters[key] = data[key]
  }
  _openType.value = openType
  console.log("전역변수",_Parameters)
  console.log("오픈타입 확인",openType)
  await initCodeList()
  await grdControl()
  onButtonsClick({id : 'btnSearch'})

  dialog.value = true
}

//팝업 오픈 시 모든 데이터 초기화
const openRefresh = () => {
  Object.keys(popupData).forEach(key => {
    popupData[key] = ''
  })
  Object.keys(timePopupData).forEach(key => {
    timePopupData[key] = ''
  })
  grdTime.value.getDataProvider().setRows([])
  grdTime.value.getGridView().checkAll(false)
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().checkAll(false)

}

//버튼 클릭 이벤트
const onButtonsClick = async btn => {
  //'btnSendSms', 'btnUpdate', 'btnOpen', 'btnConfirm', 'btnSendMail', 'btnEduCopy', 'btnInitNew', 'btnClose'
  if(btn.id === 'btnDelete'){//삭제
    onBtnDelete()
  }
  else if(btn.id === 'btnQrCodePrint'){//QR코드출력
    onBtnQrCodePrint()
  }
  else if(btn.id === 'btnSearch'){//조회
    onBtnSearch()
  }
  else if(btn.id === 'btnSendSms'){//SMS발송
    onBtnSendSms()
  }
  else if(btn.id === 'btnUpdate'){//저장
    onBtnUpdate()
  }
  else if(btn.id === 'btnOpen'){//개설
    onBtnOpen()
  }
  else if(btn.id === 'btnConfirm'){//확정
    onBtnConfirm()
  }
  else if(btn.id === 'btnSendMail'){//통보
    onbtnSendMail()
  }
  else if(btn.id === 'btnEduCopy'){//교육복사
    onBtnEduCopy()
  }
  else if(btn.id === 'btnInitNew'){//초기화(신규)
    onBtnInitNew()
  }
  else if(btn.id === 'btnClose'){//닫기

    let grdMainState = ''
    let titleTxt = ''

    for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
      if(grdMain.value.getDataProvider().getRowState(i) === 'created'){
        grdMainState = 'created'
        titleTxt = '대상자 목록 그리드에서 수정되고 저장되지 않은 데이터가 존재합니다.\n저장 하시겠습니까?'
      }
    }
    if(grdMainState === 'created'){
      let ck = await vm.$swal({ 
      title: titleTxt, 
      showCancelButton: true,
      })
      console.log("식케이 확인",ck)
      if(ck.isConfirmed === true){
        onBtnUpdate('close')
        return 
      }
    }
    emit('onClose', '')
    init_status = true
    dialog.value = false
  }
}

const grdControl = () => {
  //if(_openType.value === 'Page'){
    // grdTime.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    //   var ret = {}
    //   if(dataCell.dataColumn.fieldName === 'EDU_DATE' || dataCell.dataColumn.fieldName === 'EDU_TIME' ||
    //       dataCell.dataColumn.fieldName === 'EDU_TIME_FN' || dataCell.dataColumn.fieldName === 'EPLACE_DIV'){
    //       ret.editable = true
    //       ret.styleName = 'editable_column'
    //   }
    //   if(dataCell.dataColumn.fieldName === 'EPLACE_ETC' || dataCell.dataColumn.fieldName === 'LECTURER_NM'){
    //     ret.styleName = 'editable_column'
    //   }
    //   return ret
    // })
  //}
}

const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}
const onBtnDelete = async () => {
  let ck = ''
  ck = await vm.$swal({ 
  title: t('데이터를 삭제하시겠습니까?'), 
  showCancelButton: true,
  })
  if(ck.isConfirmed === false){
    return
  }

  let deleteParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID
  }

  commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP02_POP02_DELETE_01', list: [deleteParams] }).then(res => {
    console.log("삭제 후 확인",res)
    Message.success(t("삭제되었습니다."))
    onBtnInitNew()
  })
}
//교육계획 상세 조회
const onBtnSearch = async () => {
  if(!isNullCheck(_Parameters)){
    let searchParams = {
      CMPNY_DIV : _Parameters.CMPNY_DIV,
      YEAR : _Parameters.YEAR,
      SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    }
    commonSearchApi({queryId : 'EDUAB0030_TAB01_POP02_POP02_SEARCH_01', param : searchParams}).then(res => {
      if(res.ORESULT_CUR.length > 0){
        console.log("전체 데이터 조회 :::: >>>>",res)
        for(const key in res.ORESULT_CUR[0]){
          _Parameters[key] = res.ORESULT_CUR[0][key]
        }
        if(isNullCheck(_Parameters.DIVISION)){
          popupData.DIVISION = codeList.division[0].COD
        }else{
          popupData.DIVISION = _Parameters.DIVISION
        } 
        
        console.log('null check', _Parameters.CURR_ID)
        if(isNullCheck(_Parameters.CURR_ID)){
          popupData.CURR_ID = codeList.currId[0].COD
        }else{
          popupData.CURR_ID = _Parameters.CURR_ID
          
        console.log('not null check', popupData.CURR_ID)
        }
        if(isNullCheck(_Parameters.MORGN_ID)){
          popupData.MORGN_ID = codeList.morgnId[0].COD
        }
        if(codeList.morgnId.length > 0 && MORGN_ID_INDEX >= 0){
          _Parameters.MORGN_ID = codeList.mogrnId[MORGN_ID_INDEX].COD
          _Parameters.MORGN_EMP_NO = codeList.mogrnId[MORGN_ID_INDEX].EMP_NO
        }

        popupData.EDU_DATE = isNullCheck(_Parameters.EDU_DATE) == true ?  dayjs(new Date()).format('YYYY-MM-DD') : dayjs(_Parameters.EDU_DATE).format('YYYY-MM-DD')
        popupData.EDU_DATE_END = isNullCheck(_Parameters.EDU_DATE_END) == true ?  dayjs(new Date()).format('YYYY-MM-DD') : dayjs(_Parameters.EDU_DATE_END).format('YYYY-MM-DD')
        popupData.REQ_DUR_FROM  = isNullCheck(_Parameters.REQ_DUR_FROM) == true ?  dayjs().add(7, 'day').format('YYYY-MM-DD') : dayjs(_Parameters.REQ_DUR_FROM).format('YYYY-MM-DD')
        popupData.REQ_DUR_TO  = isNullCheck(_Parameters.REQ_DUR_TO) == true ?  dayjs().add(7, 'day').format('YYYY-MM-DD') : dayjs(_Parameters.REQ_DUR_TO).format('YYYY-MM-DD')

        popupData.LEAD_TIME = _Parameters.LEAD_TIME
        popupData.EDU_TITLE = _Parameters.EDU_TITLE
        popupData.STATUS = _Parameters.STATUS
        popupData.OPEN_DATE = _Parameters.OPEN_DATE
        popupData.EDUPOSSIBLE_NUM = _Parameters.EDUPOSSIBLE_NUM
        popupData.SCHEDULE_ID = _Parameters.SCHEDULE_ID
        popupData.AGE = isNullCheck(_Parameters.AGE_RESTRICTION) == true ? '0' : _Parameters.AGE_RESTRICTION  

        onSetButtons(_Parameters.STATUS)
        searchEduSavedTargetList()
        onTimeBtnSearch()
        console.log('popupData',popupData)
      }else{
        onBtnInitNew()
      }
    })
  }else{
    onBtnInitNew()
  }
}


//QR코드 출력 버튼 클릭 이벤트
const onBtnQrCodePrint = async () => {
  console.log("printParams.value ",printParams.value )
  reportName.value = '/manage/hse/EDUAB0030_TAB01_POP01_03.ozr'

  let curr_nm = ''
  codeList.currId.forEach((e)=>{
    if(popupData.CURR_ID === e.COD){
      curr_nm = e.TXT
    }
  })

  let sTITLE = _Parameters.YEAR + '년 ' + curr_nm 
  let sEDATE_FROM = isNullCheck(_Parameters.EDATE_FROM) === true ? '' : _Parameters.EDATE_FROM
  let sEDATE_TO = isNullCheck(_Parameters.EDATE_TO) === true ? '' : _Parameters.EDATE_TO
  let sEDU_DATE = ''
  let sURL = ''


  if(sTITLE.includes('단기')){

  }else{
    // var jsonParameters = {
    //   CMPNY_DIV : _Parameters.CMPNY_DIV,
    //   SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    //   YEAR : _Parameters.YEAR,
    // }

    // var jsonString = JSON.stringify(jsonParameters)
    // var encodedParams = btoa(jsonString)
    // sURL = 'https://hse.hhi.co.kr/Pages/WD/DC1042W.aspx?p='+encodedParams
    sURL = _Parameters.SCHEDULE_ID
  }

  if(sEDATE_TO.length > 0 && sEDATE_FROM !== sEDATE_TO){
    sEDU_DATE = '교육일자 : ' + sEDATE_FROM + ' ~ ' + sEDATE_TO
  }else{
    sEDU_DATE = '교육일자 : ' + sEDATE_FROM
  }


  printParams.value = [
    "TITLE="+sTITLE,
    "EDU_DATE="+sEDU_DATE,
    "URL="+sURL
  ]
  console.log('에스타이틀',sTITLE)
  console.log('에스에듀데이트',sEDU_DATE)
  console.log('에스유알엘',sURL)
  showOz.value = true
}

const onSetButtons = _STATUS => {
  //$$$모든 버튼 기능 테스트 후 주석 해제
  //최상위 호출 화면이 신청교육이 아니면 수정 불가
  console.log("온 셋 버튼",_Parameters.STATUS)
  console.log("오픈타입",_openType.value)
  // if(_openType.value !== 'Page'){
  //   popupButtons2.value.disableBtn("btnSendMail", true)   //통보
  //   popupButtons2.value.disableBtn("btnConfirm", true)  //확정
  //   popupButtons2.value.disableBtn("btnOpen", true)     //개설
  //   popupButtons2.value.disableBtn("btnUpdate", true)   //저장
  //   popupButtons2.value.disableBtn("btnSendSms", true)  //SMS 발송
  //   popupButtons2.value.disableBtn("btnEduCopy", true)  //교육복사
  //   popupButtons2.value.disableBtn("btnInitNew", true)  //초기화(신규)

  //   grdTimeButtons.value.disableBtn("btnSearch", true)    //일별 교시 상세 - 조회
  //   grdTimeButtons.value.disableBtn("btnCreate", true)    //일별 교시 상세 - 추가
  //   grdTimeButtons.value.disableBtn("btnDelete", true)    //일별 교시 상세 - 삭제
  //   grdTimeButtons2.value.disableBtn("btnAllApply", true) //일별 교시 상세 - 모두적용

  //   grdMainButtons.value.disableBtn("btnTargetAdd", true)     //대상자 목록 - 대상자추가
  //   grdMainButtons.value.disableBtn("btnTargetDelete", true)  //대상자 목록 - 대상자삭제

  //   popupButtons1.value.setBtnProperty('btnDelete', 'visible', false) //삭제버튼

  //   disable.DIVISION = true,      //분류
  //   disable.CURR_ID = true         //교육명
  //   disable.MORGN_ID = true        //주관부서
  //   disable.EDU_TITLE = true       //제목
  //   disable.EDU_DATE = true        //교육기간(시작)
  //   disable.EDU_DATE_END = true    //교육기간(종료)
  //   disable.LEAD_TIME = true       //소요시간
  //   disable.REQ_DUR_FROM = true    //신청기간(시작)
  //   disable.REQ_DUR_TO = true      //신청기간(종료)
  //   disable.EDUPOSSIBLE_NUM = true //가능인원
  //   disable.TARGET = false         //대상
  //   disable.OPEN_DATE = true       //개설일

  //   grdTimeButtonUseYn.value = false
  //   return
  // }
  if(_Parameters.INSERT_USER_ID === userStore.empNo && _STATUS !== 'N'){
    popupButtons2.value.disableBtn('btnEduCopy', false)
  }else{
    popupButtons2.value.disableBtn('btnEduCopy', true)
  }
  switch(_STATUS){
    case 'N':
      popupButtons2.value.disableBtn("btnSendMail", true)    //통보
      popupButtons2.value.disableBtn("btnConfirm", true)   //확정
      popupButtons2.value.disableBtn("btnQrCodePrint", true)   //QR코드 출력
      popupButtons2.value.disableBtn("btnOpen", true)      //개설
      popupButtons2.value.disableBtn("btnUpdate", false)   //저장
      popupButtons2.value.disableBtn("btnSendSms", true)   //SMS 발송
      popupButtons2.value.disableBtn("btnInitNew", false)  //초기화(신규)

      grdMainButtons.value.disableBtn("btnTargetAdd", false)     //대상자 목록 - 대상자추가
      grdMainButtons.value.disableBtn("btnTargetDelete", false)  //대상자 목록 - 대상자삭제

      popupButtons1.value.setBtnProperty('btnDelete', 'visible', false) //삭제버튼
    

      break
    case '1':
      popupButtons2.value.disableBtn("btnSendMail", true)    //통보
      popupButtons2.value.disableBtn("btnConfirm", true)   //확정
      popupButtons2.value.disableBtn("btnQrCodePrint", true)   //QR코드 출력
      popupButtons2.value.disableBtn("btnOpen", false)     //개설
      popupButtons2.value.disableBtn("btnUpdate", false)   //저장
      popupButtons2.value.disableBtn("btnSendSms", false)   //SMS 발송
      popupButtons2.value.disableBtn("btnInitNew", false)  //초기화(신규)

      grdTimeButtons.value.disableBtn("btnSearch", false)    //일별 교시 상세 - 조회
      grdTimeButtons.value.disableBtn("btnCreate", false)    //일별 교시 상세 - 추가
      grdTimeButtons.value.disableBtn("btnDelete", false)    //일별 교시 상세 - 삭제
      grdTimeButtons2.value.disableBtn("btnAllApply", false) //일별 교시 상세 - 모두적용

      grdMainButtons.value.disableBtn("btnTargetAdd", false)     //대상자 목록 - 대상자추가
      grdMainButtons.value.disableBtn("btnTargetDelete", false)  //대상자 목록 - 대상자삭제

      popupButtons1.value.setBtnProperty('btnDelete', 'visible', true) //삭제버튼
      break
    case '2':
      popupButtons2.value.disableBtn("btnSendMail", true)    //통보
      popupButtons2.value.disableBtn("btnConfirm", false)   //확정
      popupButtons2.value.disableBtn("btnQrCodePrint", true)   //QR코드 출력
      popupButtons2.value.disableBtn("btnOpen", true)      //개설
      popupButtons2.value.disableBtn("btnUpdate", false)   //저장
      popupButtons2.value.disableBtn("btnSendSms", false)   //SMS 발송
      popupButtons2.value.disableBtn("btnInitNew", false)  //초기화(신규)

      grdTimeButtons.value.disableBtn("btnSearch", false)    //일별 교시 상세 - 조회
      grdTimeButtons.value.disableBtn("btnCreate", false)    //일별 교시 상세 - 추가
      grdTimeButtons.value.disableBtn("btnDelete", false)    //일별 교시 상세 - 삭제
      grdTimeButtons2.value.disableBtn("btnAllApply", false) //일별 교시 상세 - 모두적용

      grdMainButtons.value.disableBtn("btnTargetAdd", false)     //대상자 목록 - 대상자추가
      grdMainButtons.value.disableBtn("btnTargetDelete", false)  //대상자 목록 - 대상자삭제

      popupButtons1.value.setBtnProperty('btnDelete', 'visible', true) //삭제버튼
      break
    case '3':
      popupButtons2.value.disableBtn("btnSendMail", false)    //통보
      popupButtons2.value.disableBtn("btnConfirm", true)   //확정
      popupButtons2.value.disableBtn("btnOpen", true)      //개설
      popupButtons2.value.disableBtn("btnQrCodePrint", false)   //QR코드 출력
      popupButtons2.value.disableBtn("btnUpdate", false)   //저장
      popupButtons2.value.disableBtn("btnSendSms", false)   //SMS 발송
      popupButtons2.value.disableBtn("btnInitNew", false)  //초기화(신규)

      grdTimeButtons.value.disableBtn("btnSearch", false)    //일별 교시 상세 - 조회
      grdTimeButtons.value.disableBtn("btnCreate", false)    //일별 교시 상세 - 추가
      grdTimeButtons.value.disableBtn("btnDelete", false)    //일별 교시 상세 - 삭제
      grdTimeButtons2.value.disableBtn("btnAllApply", false) //일별 교시 상세 - 모두적용

      grdMainButtons.value.disableBtn("btnTargetAdd", false)     //대상자 목록 - 대상자추가
      grdMainButtons.value.disableBtn("btnTargetDelete", false)  //대상자 목록 - 대상자삭제

      popupButtons1.value.setBtnProperty('btnDelete', 'visible', false) //삭제버튼
      break
    case '4':
      popupButtons2.value.disableBtn("btnSendMail", true)    //통보
      popupButtons2.value.disableBtn("btnConfirm", true)   //확정
      popupButtons2.value.disableBtn("btnOpen", true)      //개설
      popupButtons2.value.disableBtn("btnQrCodePrint", false)   //QR코드 출력
      popupButtons2.value.disableBtn("btnUpdate", false)   //저장
      popupButtons2.value.disableBtn("btnSendSms", false)   //SMS 발송
      popupButtons2.value.disableBtn("btnInitNew", false)  //초기화(신규)

      grdTimeButtons.value.disableBtn("btnSearch", false)    //일별 교시 상세 - 조회
      grdTimeButtons.value.disableBtn("btnCreate", false)    //일별 교시 상세 - 추가
      grdTimeButtons.value.disableBtn("btnDelete", false)    //일별 교시 상세 - 삭제
      grdTimeButtons2.value.disableBtn("btnAllApply", false) //일별 교시 상세 - 모두적용

      grdMainButtons.value.disableBtn("btnTargetAdd", false)     //대상자 목록 - 대상자추가
      grdMainButtons.value.disableBtn("btnTargetDelete", false)  //대상자 목록 - 대상자삭제

      popupButtons1.value.setBtnProperty('btnDelete', 'visible', false) //삭제버튼
      break
    case '5':
      popupButtons2.value.disableBtn("btnSendMail", true)    //통보
      popupButtons2.value.disableBtn("btnConfirm", true)   //확정
      popupButtons2.value.disableBtn("btnOpen", true)      //개설
      popupButtons2.value.disableBtn("btnQrCodePrint", false)   //QR코드 출력
      popupButtons2.value.disableBtn("btnUpdate", false)   //저장
      popupButtons2.value.disableBtn("btnSendSms", false)   //SMS 발송
      popupButtons2.value.disableBtn("btnInitNew", false)  //초기화(신규)

      grdTimeButtons.value.disableBtn("btnSearch", false)    //일별 교시 상세 - 조회
      grdTimeButtons.value.disableBtn("btnCreate", false)    //일별 교시 상세 - 추가
      grdTimeButtons.value.disableBtn("btnDelete", false)    //일별 교시 상세 - 삭제
      grdTimeButtons2.value.disableBtn("btnAllApply", false) //일별 교시 상세 - 모두적용

      grdMainButtons.value.disableBtn("btnTargetAdd", false)     //대상자 목록 - 대상자추가
      grdMainButtons.value.disableBtn("btnTargetDelete", false)  //대상자 목록 - 대상자삭제

      popupButtons1.value.setBtnProperty('btnDelete', 'visible', false) //삭제버튼
      break
    default:
      break
  }
}

const searchEduSavedTargetList = () => {
  let searchParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID
  }
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_07', param : searchParams }).then(res => {
    console.log("07레스 확인",res)
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    TARGET_CNT.value ='(대상자 목록 총 ' + grdMain.value.getDataProvider().getRows().length + '명)' 
  })
}

//SMS발송 버튼 클릭 이벤트
const onBtnSendSms = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  let grdMainData = ''
  for(let i = 0; i < checkedRows.length; i++){
    if(grdMainData === ''){
      // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
      // grdMainData = grdMain.value.getGridView().getValues(checkedRows[i]).TARGET_ID
      grdMainData = grdMain.value.getRowData(checkedRows[i]).TARGET_ID
    }else{
      // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
      // grdMainData += ';' + grdMain.value.getGridView().getValues(checkedRows[i]).TARGET_ID
      grdMainData += ';' + grdMain.value.getRowData(checkedRows[i]).TARGET_ID
    }
  }
  console.log("샌드팝업 보낼 타겟 아이디들",grdMainData)
  if(isNullCheck(grdMainData)){
    Message.warn(t('메세지를 전송할 데이터를 선택해 주세요.'))
    return
  }
  sendSMSPopup.value.openPopup(grdMainData, false)
}

//저장 버튼 클릭 이벤트
const onBtnUpdate = async (sit) => {
  if(isNullCheck(popupData.DIVISION)){
    Message.warn(t('분류를 선택해 주십시오.'))
    return
  }
  if(isNullCheck(popupData.CURR_ID)){
    Message.warn(t('교육명을 선택해 주십시오.'))
    return
  }

  if ((popupData.CURR_ID === 'C298' || popupData.CURR_ID === 'C299' || popupData.CURR_ID === 'C300')
   && !userStore.authGrpCd.includes('GRP00432')){
    Message.warn(t('통합 보수 교육 개설 권한이 없습니다.'))
    return
  }

  // 특정 보수 교육 생성시 등록 된 부서 외 등록 불가 처리
  if (codeList.auth_currId.filter(x => x.COD === popupData.CURR_ID).length > 0){
    let cnt = 0
    Promise.all([
      getCodeList('HHID260' + popupData.CURR_ID)
    ]).then(res => {
      if (res.length > 0){
        cnt = res[0].ORESULT_CUR.filter(x => x.COD === userStore.deptCd).length
      }

      // 공통코드에 등록된 부서 외엔 개설 불가
      if (cnt === 0 || !userStore.authGrpCd.includes('GRP00432')){
        Message.warn(t('보수 교육 개설 권한이 없습니다.'))
        return
      }
    })
  }

  if(isNullCheck(popupData.EDU_TITLE)){
    Message.warn(t('제목을 입력해 주십시오.'))
    return
  }
  if(isNullCheck(popupData.LEAD_TIME)){
    Message.warn(t('소요시간을 입력해 주십시오.'))
    return
  }
  console.log("팝업데이터EDUPOSSIBLE_NUM : ",popupData.EDUPOSSIBLE_NUM)
  if(isNullCheck(popupData.EDUPOSSIBLE_NUM) || popupData.EDUPOSSIBLE_NUM < 1){
    Message.warn(t('가능인원을 입력해 주십시오.'))
    return
  }
  if(grdTime.value.getDataProvider().getRows().length < 1){
    Message.warn(t('일별 교시가 하나 이상 입력이 되어야 합니다.'))
    return
  }
  console.log("저장할데이터 가공 전",_Parameters)
  if(sit !== 'close'){
    let ck = ''
    ck = await vm.$swal({ 
    title: t('교육 일정 정보를 저장 하시겠습니까?'), 
    showCancelButton: true,
    })
    if(ck.isConfirmed === false){
      return
    }
  }

  SetSaveDataToDataTable()
  let dt = _.cloneDeep(_Parameters)
  console.log("저장할데이터 가공 후",dt)

  await commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP02_POP02_SAVE_01', list: [dt] }).then(res => {
    console.log("레스 확확인",res)
    console.log('저장후 파라미터 확인',_Parameters.STATUS)
    if(_Parameters.STATUS === 'N'){
      _Parameters.STATUS = '1'
      popupData.STATUS = '1'
    }
    onSetButtons(_Parameters.STATUS)

    dt.SCHEDULE_ID = res.list[0].OUT_RES_SCHEDULE_ID
    _Parameters.SCHEDULE_ID = isNullCheck(dt.SCHEDULE_ID) === true ? '' : dt.SCHEDULE_ID
    popupData.SCHEDULE_ID = _Parameters.SCHEDULE_ID
    //popupButtons1.value.setBtnProperty('btnDelete', 'visible', true) //삭제버튼

    /////////////////////////////////////////////////////////////////////////////////////
    // 확정 전에는 그리드의 모든 데이타 저장, 확정 후에는 선택된 행만 저장
    /////////////////////////////////////////////////////////////////////////////////////
    // 2024.08.23 박용훈 확정 여부는 순수하게 CON_DIV 라서 CON_DIV로 변경함 
    // if(_Parameters.STATUS !== '3'){
    if(_Parameters.CON_DIV !== 'Y'){
      grdMain.value.getGridView().checkAll(true)
    }
    let timeCheckedRows = grdTime.value.getGridView().getCheckedRows()
    let mainCheckedRows = grdMain.value.getGridView().getCheckedRows()


    let timeSaveDataRows =[]  //일별교시상세
    let mainSaveDataRows = [] //메인그리드
    if(_Parameters.STATUS === 'N' || _Parameters.STATUS === '1' || _Parameters.STATUS === '2'){
      if(grdMain.value.getDataProvider().getRows().length > 0){
        for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
          // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
          // mainSaveDataRows.push(grdMain.value.getGridView().getValues(i))
          mainSaveDataRows.push(grdMain.value.getRowData(i))
          mainSaveDataRows[i].SCHEDULE_ID = _Parameters.SCHEDULE_ID
          mainSaveDataRows[i].YEAR = _Parameters.YEAR
          mainSaveDataRows[i].EDUTIME_SERIAL = '1'
        }
      }

      if(grdTime.value.getDataProvider().getRows().length > 0){
        for(let i = 0; i < grdTime.value.getDataProvider().getRows().length; i++){
          // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
          // timeSaveDataRows.push(grdTime.value.getGridView().getValues(i))
          timeSaveDataRows.push(grdTime.value.getRowData(i))
          timeSaveDataRows[i].SCHEDULE_ID = _Parameters.SCHEDULE_ID
          timeSaveDataRows[i].YEAR = _Parameters.YEAR
          timeSaveDataRows[i].EDU_DATE = dayjs(timeSaveDataRows[i].EDU_DATE).format('YYYYMMDD')
        }
      }
    }else{
      //console.log('mainCheckedRows : ', mainCheckedRows)
      if(grdMain.value.getDataProvider().getRows().length > 0){
        if(mainCheckedRows.length > 0){
          for(let i = 0; i < mainCheckedRows.length; i++){
            // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
            // mainSaveDataRows.push(grdMain.value.getGridView().getValues(mainCheckedRows[i]))
            mainSaveDataRows.push(grdMain.value.getRowData(mainCheckedRows[i]))
            mainSaveDataRows[i].SCHEDULE_ID = _Parameters.SCHEDULE_ID
            mainSaveDataRows[i].YEAR = _Parameters.YEAR
          }
        }
      }
      if(grdTime.value.getDataProvider().getRows().length > 0){
        if(timeCheckedRows.length > 0){
          for(let i = 0; i < timeCheckedRows.length; i++){
            // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
            // timeSaveDataRows.push(grdTime.value.getGridView().getValues(timeCheckedRows[i]))
            timeSaveDataRows.push(grdTime.value.getRowData(timeCheckedRows[i]))
            timeSaveDataRows[i].SCHEDULE_ID = _Parameters.SCHEDULE_ID
            timeSaveDataRows[i].YEAR = _Parameters.YEAR
            timeSaveDataRows[i].EDU_DATE = dayjs(timeSaveDataRows[i].EDU_DATE).format('YYYYMMDD')
          }
        }
      }
    }

    // 운전보수 교육 일 때 자격 취소자 제외 (연결된 자격 모두 취소일 때만 교육신청 불가)
    if(popupData.DIVISION === 'M'){
      let msg4 = '아래 인원은 장비자격 취소로 인하여 수강신청이 불가하므로 제외 후 저장 바랍니다.\n'
      let errCnt4 = 0

      for(let i = 0; i < mainSaveDataRows.length; i++){
        let liceSearchParams = {
          CMPNY_DIV : userStore.cmpnyDiv,
          CURR_ID : popupData.CURR_ID,        
          TARGET_ID : mainSaveDataRows[i].TARGET_ID,
          USER_ID : userStore.userId
        }

        commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_18', param : liceSearchParams }).then(res2 => {
        // console.log("자격증 체크 조회",res2)
          if(res2.ORESULT_CUR[0].POINT === 0){
            if(errCnt4 === 0){
              msg4 += '' + mainSaveDataRows[i].TARGET_NM + '(' + mainSaveDataRows[i].TARGET_ID + ')'
            // console.log("지금 msg2", msg2)
            }else{
              msg4 += ', ' + mainSaveDataRows[i].TARGET_NM + '(' + mainSaveDataRows[i].TARGET_ID + ')'
            }
            errCnt4++          
          }
        })
      }

      if(errCnt4 > 0){
        ck = vm.$swal({ 
          title: t(msg4), 
        })
        
        return
      }
    }

    if(timeCheckedRows.length <= 0 && mainCheckedRows.length <= 0){
      Message.success(t('저장되었습니다.'))
      return
    }
    console.log("대상자목록저장", mainSaveDataRows)
    if(mainCheckedRows.length > 0){
      commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP02_POP02_SAVE_02', list: mainSaveDataRows }).then(res => {
        console.log("대상자 목록 저장 레스",res)
        searchEduSavedTargetList()
      })
    }else{
      //대상자 목록 저장 안 할 시 그리드 초기화
      grdMain.value.getDataProvider().setRows([])
    }
    console.log("일별 교시 상세 저장", timeSaveDataRows)
    if(timeCheckedRows.length > 0){
      let itime = 300

      if(mainCheckedRows.length > 0){
        itime = 1000
      }

      setTimeout(() => {
        commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP02_POP02_SAVE_05', list: timeSaveDataRows }).then(res => {
          console.log("일별 교시 상세 저장 레스",res)
          onTimeBtnSearch()
        })
      }, itime)      
    }
    Message.success(t('저장되었습니다.'))
  })

}

//저장할 데이터 가공
const SetSaveDataToDataTable = () => {
  if(isNullCheck(_Parameters)){
    return
  }
  let dr = _Parameters
  if(!isNullCheck(dr)){
    dr.DIVISION = popupData.DIVISION
    dr.CURR_ID = popupData.CURR_ID

    dr.MORGN_ID = isNullCheck(dr.MORGN_ID) !== true ? dr.MORGN_ID : userStore.deptCd
    dr.MORGN_EMP_NO = isNullCheck(dr.MORGN_EMP_NO) !== true ? dr.MORGN_EMP_NO : userStore.empNo
    dr.MORGN_BSNSCD = isNullCheck(dr.MORGN_BSNSCD) !== true ? dr.MORGN_BSNSCD : userStore.bsnsCd
    dr.MORGN_DEPTCD = isNullCheck(dr.MORGN_DEPTCD) !== true ? dr.MORGN_DEPTCD : userStore.deptCd
    dr.MORGN_DEPTNM = isNullCheck(dr.MORGN_DEPTNM) !== true ? dr.MORGN_DEPTNM : userStore.deptNm

    dr.SCHEDULE_ID = _Parameters.SCHEDULE_ID
    dr.EDUPOSSIBLE_NUM = isNullCheck(popupData.EDUPOSSIBLE_NUM) === true ? 0 : popupData.EDUPOSSIBLE_NUM

    dr.EDU_TITLE = popupData.EDU_TITLE
    dr.EDU_DATE = isNullCheck(popupData.EDU_DATE) === true ? '' : dayjs(popupData.EDU_DATE).format('YYYYMMDD')
    dr.EDU_DATE_END = isNullCheck(popupData.EDU_DATE_END) === true ? '' : dayjs(popupData.EDU_DATE_END).format('YYYYMMDD')
    dr.REQ_DUR_FROM = isNullCheck(popupData.REQ_DUR_FROM) === true ? '' : dayjs(popupData.REQ_DUR_FROM).format('YYYYMMDD')
    dr.REQ_DUR_TO = isNullCheck(popupData.REQ_DUR_TO) === true ? '' : dayjs(popupData.REQ_DUR_TO).format('YYYYMMDD')
    dr.LEAD_TIME = popupData.LEAD_TIME

    dr.EDU_DIV = 'A'
    dr.EDU_CONTENT = isNullCheck(popupData.EDU_CONTENT) === true ? '' : popupData.EDU_CONTENT
    dr.SEND_YN = isNullCheck(popupData.SEND_YN) === true ? 'N' : popupData.SEND_YN
    dr.SAVE_YN = isNullCheck(_Parameters.SAVE_YN) === true ? 'N' : _Parameters.SAVE_YN

    dr.WORK_STD_ID = isNullCheck(popupData.WORK_STD_ID) === true ? '' : popupData.WORK_STD_ID
    dr.WORK_STD_NM = isNullCheck(popupData.WORK_STD_NM) === true ? '' : popupData.WORK_STD_NM
  }
}
//개설 버튼 클릭 이벤트
const onBtnOpen = async () => {
  let ck = ''
  ck = await vm.$swal({ 
  title: t('해당 교육을 개설 하시겠습니까?'), 
  showCancelButton: true,
  })
  if(ck.isConfirmed === false){
    return
  }

  let saveParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    USER_ID : userStore.empNo
  }
  commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP02_POP02_SAVE_06', list: [saveParams] }).then(res => {
    console.log("개설 레스 :::: >>>> ",res)
    if(res.list.length > 0){
      let iRES_COD = 0;
      if(res.list[0].OUT_RES_COD !== '0'){
        iRES_COD = -99999
      }
      if(iRES_COD >= 0){
        _Parameters.CON_DIV = 'Y'
        _Parameters.STATUS = '2'
        popupData.STATUS = '2'
        onSetButtons(_Parameters.STATUS)
        Message.success(t('개설되었습니다.'))
      }
    }
  })
}
//확정 버튼 클릭 이벤트
const onBtnConfirm = async () => {
  let ck = ''
  ck = await vm.$swal({ 
  title: t('해당 교육을 확정 하시겠습니까?'), 
  showCancelButton: true,
  })
  if(ck.isConfirmed === false){
    return
  }

  let saveParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    USER_ID : userStore.empNo
  }

  commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP02_POP02_SAVE_04', list: [saveParams] }).then(res => {
    console.log("확정????",res)
    if(res.list.length > 0){
      let iRES_COD = 0;
      if(isNullCheck(res.list[0].OUT_RES_COD)){
        iRES_COD = -99999
      }
      if(iRES_COD >= 0){
        console.log("확정완료됨")
        _Parameters.CON_DIV = 'Y'
        _Parameters.STATUS = '3'
        popupData.STATUS = '3'
        onSetButtons(_Parameters.STATUS)
      }
      Message.success(t('확정되었습니다.'))
    }
  })
}
//통보 버튼 클릭 이벤트
const onbtnSendMail = () => {
  if(_Parameters.CON_DIV === 'Y'){
    SendEMailToTarget()
  }else{
    Message.warn(t('확정되지 않은 교육 일정은 통보할 수 없습니다.'))
    return
  }
}

const SendEMailToTarget = () => {
  if(grdMain.value.getDataProvider().getRows().length == 0){
    Message.warn(t('대상자가 존재하지 않습니다.'))
    return
  }
  if(grdMain.value.getGridView().getCheckedRows(true).length == 0){
    Message.warn(t('통보하고자 하는 대상자를 선택하시기 바랍니다.'))
    return
  }
  console.log("샌드메일타겟")
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let EMP_NO = []
  let EMP_NM = []
  for(let i = 0; i < checkedRows.length; i++){
    // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
    // EMP_NO.push(grdMain.value.getGridView().getValues(checkedRows[i]).TARGET_ID)
    // EMP_NM.push(grdMain.value.getGridView().getValues(checkedRows[i]).TARGET_NM)
    EMP_NO.push(grdMain.value.getRowData(checkedRows[i]).TARGET_ID)
    EMP_NM.push(grdMain.value.getRowData(checkedRows[i]).TARGET_NM)
  }
  console.log("이엠피엔오",EMP_NO)
  console.log("이엠피엔엠",EMP_NM)
  sendMailPopup.value.openPopup({
    TO_EMP_NO : EMP_NO,
    TO_EMP_NM : EMP_NM
  })
}

//교육복사 버튼 클릭 이벤트
const onBtnEduCopy = () => {
  _Parameters.CMPNY_DIV = userStore.cmpnyDiv
  _Parameters.YEAR = dayjs(new Date()).format('YYYY')
  _Parameters.SCHEDULE_ID = ''

  popupData.SCHEDULE_ID = ''
  popupData.STATUS = ''
  popupData.OPEN_DATE = ''
  _Parameters.STATUS = 'N'

  grdMain.value.getDataProvider().setRows([])
  TARGET_CNT.value = '대상자 목록 (총 0명)'

  if(grdTime.value.getDataProvider().getRows().length > 0){
    for(let i = 0; i < grdTime.value.getDataProvider().getRows().length; i++){
      grdTime.value.getGridView().setValues(i, {SCHEDULE_ID : _Parameters.SCHEDULE_ID}, true)
    } 
  }
  grdTime.value.getGridView().checkAll(true)
  onSetButtons(_Parameters.STATUS)
  Message.success(t('복사되었습니다.'))
}
//초기화(신규) 버튼 클릭 이벤트
const onBtnInitNew = () => {
  let sCMPNY_DIV = ''
  let sYEAR = ''
  _Parameters.CMPNY_DIV = userStore.cmpnyDiv
  _Parameters.YEAR = dayjs(new Date()).format('YYYY')
  sCMPNY_DIV = _Parameters.CMPNY_DIV
  sYEAR = _Parameters.YEAR
  _Parameters.SCHEDULE_ID = ''
  _Parameters.DIVISION = ''
  _Parameters.MORGN_ID = ''
  _Parameters.MORGN_EMP_NO = ''
  _Parameters.CURR_ID = ''
  _Parameters.EDU_DATE = ''
  _Parameters.EDU_DATE_END = ''
  _Parameters.REQ_DUR_FROM = ''
  _Parameters.REQ_DUR_TO = ''
  _Parameters.LEAD_TIME = ''
  _Parameters.EPLACE_ID = ''
  _Parameters.LECTURER_ID = ''
  _Parameters.CON_DIV = ''
  _Parameters.ELPACE_NUM = 0
  _Parameters.EDUPOSSIBLE_NUM = '0'
  popupData.EDUPOSSIBLE_NUM = _Parameters.EDUPOSSIBLE_NUM
  _Parameters.EDU_TITLE = ''
  _Parameters.EDU_INTRO = ''
  _Parameters.EDU_DESC = ''
  _Parameters.STATUS = 'N'
  _Parameters.OPEN_DATE = ''
  _Parameters.INSERT_USER_ID = userStore.empNo
  _Parameters.SEND_YN = 'N'
  _Parameters.SAVE_YN = ''
  if(isNullCheck(_Parameters.DIVISION)){
    popupData.DIVISION = ''
  }else{
    _Parameters.DIVISION = popupData.DIVISION
  }

  if(isNullCheck(_Parameters.CURR_ID)){
    popupData.CURR_ID = ''
  }else{
    _Parameters.CURR_ID = popupData.CURR_ID
  }

  if(isNullCheck(_Parameters.MORGN_ID)){
    popupData.MORGN_ID = ''
  }else{
    popupData.MORGN_ID = _Parameters.MORGN_ID + _Parameters.MORGN_EMP_NO
  }

  if(codeList.morgnId.length > 0 ){
    let MORGN_ID_INDEX = codeList.morgnId.findIndex(e => e.COD === popupData.MORGN_ID)
    if(MORGN_ID_INDEX >= 1){
      _Parameters.MORGN_ID = codeList.mogrnId[MORGN_ID_INDEX].MNG_ORGN
      _Parameters.MORGN_EMP_NO = codeList.mogrnId[MORGN_ID_INDEX].EMP_NO
    }else{
      _Parameters.MORGN_ID = ''
      _Parameters.MORGN_EMP_NO = ''
    }
  }

  popupData.EDU_DATE = isNullCheck(_Parameters.EDU_DATE) == true ?  dayjs().add(7, 'day').format('YYYY-MM-DD') : dayjs(_Parameters.EDU_DATE).format('YYYY-MM-DD')
  popupData.EDU_DATE_END = isNullCheck(_Parameters.EDU_DATE) == true ?  dayjs().add(7, 'day').format('YYYY-MM-DD') : dayjs(_Parameters.EDU_DATE).format('YYYY-MM-DD')
  popupData.REQ_DUR_FROM  = isNullCheck(_Parameters.REQ_DUR_FROM) == true ?  dayjs(new Date()).format('YYYY-MM-DD') : dayjs(_Parameters.REQ_DUR_FROM).format('YYYY-MM-DD')
  popupData.REQ_DUR_TO  = isNullCheck(_Parameters.REQ_DUR_TO) == true ?  dayjs().add(6, 'day').format('YYYY-MM-DD') : dayjs(_Parameters.REQ_DUR_TO).format('YYYY-MM-DD')
  popupData.LEAD_TIME = _Parameters.LEAD_TIME
  popupData.EDU_TITLE = _Parameters.EDU_TITLE
  popupData.STATUS = _Parameters.STATUS
  popupData.OPEN_DATE = _Parameters.OPEN_DATE
  popupData.SEND_YN = _Parameters.SEND_YN
  popupData.SCHEDULE_ID = ''


  
  Object.keys(_Parameters).forEach(key => {
    _Parameters[key] = ''
  })
  _Parameters.CMPNY_DIV = sCMPNY_DIV
  _Parameters.YEAR = sYEAR
  _Parameters.SEND_YN = 'N'
  _Parameters.STATUS = 'N'
  _Parameters.INSERT_USER_ID = userStore.empNo
  TARGET_CNT.value = '대상자 목록 (총 0명)'

  //이규호 책임 요청으로 일별 교시 상세 데이터도 초기화/2024-06-14
  grdTime.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows([])

  popupButtons1.value.setBtnProperty('btnDelete', 'visible', false) //삭제버튼

  onSetButtons(_Parameters.STATUS)

}

//소요시간 입력시 이벤트
const leadTimeValueChanged = () => {
  let numChk = [...popupData.LEAD_TIME]
  let removeCount = 0
  let removeEnd = false
  numChk.forEach(val => {
    if(val == 0 && removeEnd == false){
      removeCount++
    }else{
      removeEnd = true
    }
  })
  popupData.LEAD_TIME = popupData.LEAD_TIME.toString().substr(removeCount, (numChk.length - removeCount))
}

//가능인원 입력시 이벤트
const eduPossibleNumValueChanged = () => {
  let numChk = [...popupData.EDUPOSSIBLE_NUM]
  let removeCount = 0
  let removeEnd = false
  numChk.forEach(val => {
    if(val == 0 && removeEnd == false){
      removeCount++
    }else{
      removeEnd = true
    }
  })
  popupData.EDUPOSSIBLE_NUM = popupData.EDUPOSSIBLE_NUM.toString().substr(removeCount, (numChk.length - removeCount))
}

// 교육기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const eduDateFrChanged = data => {
  if(isNullCheck(data.target.value)){
    return
  }
  if(data.target.value > popupData.EDU_DATE_END){
    popupData.EDU_DATE_END = popupData.EDU_DATE
  }
}

// 교육기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const eduDateToChanged = data => {
  if(isNullCheck(data.target.value)){
    return
  }
  if(data.target.value < popupData.EDU_DATE){
    popupData.EDU_DATE = popupData.EDU_DATE_END
  }
}

// 신청기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const reqDurFromChanged = data => {
  if(isNullCheck(data.target.value)){
    return
  }
  if(data.target.value > popupData.REQ_DUR_TO){
    popupData.REQ_DUR_TO = popupData.REQ_DUR_FROM
  }
}

// 신청기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const reqDurToChanged = data => {
  if(isNullCheck(data.target.value)){
    return
  }
  if(data.target.value < popupData.REQ_DUR_FROM){
    popupData.REQ_DUR_FROM = popupData.REQ_DUR_TO
  }
}

//작업표준명 버튼 클릭 시 이벤트
const workStdNmClick = () => {
  eDUAB0030Tab01Pop01Pop11.value.openPopup()
}

//정기위험성 평가 팝업 데이터 선택 후
const onWorkStdNmSelect = (data) => {
  console.log("선택한 데이터 확인",data)
  popupData.WORK_STD_ID = ''
  popupData.WORK_STD_NM = ''
  let WORK_ID = ''
  let WORK_NM = ''
  data.forEach(val => {
    if(WORK_ID === ''){
      WORK_ID = val.WORK_STANDARD_ID
    }else{
      WORK_ID += ', ' + val.WORK_STANDARD_ID
    }
    if(WORK_NM === ''){
      WORK_NM = val.WORK_STANDARD_NM
    }else{
      WORK_NM += ', ' + val.WORK_STANDARD_NM
    }
  })
  popupData.WORK_STD_ID = WORK_ID
  popupData.WORK_STD_NM = WORK_NM
  console.log("작업표준ID :::: ",popupData.WORK_STD_ID)
  console.log("작업표준명 :::: ",popupData.WORK_STD_NM)
}

//**************************************************************************************************************************/
//************************************************이벤트 영역(종료)*********************************************************/
//**************************************************************************************************************************/


//**************************************************************************************************************************/
//***********************************************일별 교시 상세 영역********************************************************/
//**************************************************************************************************************************/
//일별 교시 상세 버튼 클릭 이벤트
const onTimeButtonsClick = btn => {
  if(btn.id === 'btnSearch'){//조회
    onTimeBtnSearch()
  }
  else if(btn.id === 'btnCreate'){//추가
    onTimeBtnCreate()
  }
  else if(btn.id === 'btnDelete'){//삭제
    onTimeBtnDelete()
  }
  else if(btn.id === 'btnAllApply'){//모두적용
    onTimeBtnAllApply()
  }
}

//일별 교시 상세 데이터 조회
const onTimeBtnSearch = () => {
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    EDUTIME_SERIAL : 1,
  }

  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_11', param : searchParams }).then(res => {
    console.log("일별 교시 상세 조회 후 :::: >>>> ",res)
    if(res.ORESULT_CUR.length > 0){
      grdTime.value.getDataProvider().setRows(res.ORESULT_CUR)
      grdTime.value.getGridView().setCurrent({dataRow : 0})
      Message.success(t('조회되었습니다.'))
    }else{
      grdTime.value.getDataProvider().setRows([])
      Message.warn(t('데이터가 없습니다.'))
    }
    grdTime.value.getGridView().setColumnProperty('EPLACE_ETC', "readOnly", true)
  })
}

//일별 교시 상세 데이터 추가
const onTimeBtnCreate = () => {

  let newRow = {
    SAVE_YN : 'N',
    CMPNY_DIV : userStore.cmpnyDiv,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    EDUTIME_SERIAL : '1',
    EDU_DATE : isNullCheck(popupData.EDU_DATE) === true ? '' : dayjs(popupData.EDU_DATE).format('YYYY-MM-DD'),
    EPLACE_DIV : 'A',
  }
  let vMax = 1
  let grdTimeRows = grdTime.value.getDataProvider().getRows()
  if(grdTimeRows.length > 0){
    let grdTimeData = []
    for(let i = 0; i < grdTimeRows.length; i++){
      // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
      // grdTimeData.push(grdTime.value.getGridView().getValues(i))
      grdTimeData.push(grdTime.value.getRowData(i))
    }
    grdTimeData.forEach(val => {
      if(vMax <= val.TIME_SEQ){
        vMax++
      }
    })
  }
  newRow.TIME_SEQ = vMax
  console.log("일별 교시 상세 newRow ::::>>>>", newRow)
  grdTime.value.addRow(newRow)
  grdTime.value.getGridView().setColumnProperty('EPLACE_ETC', "readOnly", true)
}

//일별 교시 상세 데이터 삭제
const onTimeBtnDelete = () => {
  let checkedRows = grdTime.value.getGridView().getCheckedRows(true)
  let deleteParams = []
  checkedRows.forEach(val => {
    for(let i = 0; i < checkedRows.length; i++){
      // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
      // deleteParams.push(grdTime.value.getGridView().getValues(checkedRows[i]))
      deleteParams.push(grdTime.value.getRowData(checkedRows[i]))
      deleteParams[i].EDU_DATE = dayjs(deleteParams[i].EDU_DATE).format('YYYYMMDD')
    }
    
    
  })
  for(let i = 0; i < checkedRows.length; i++){
    if(grdTime.value.getDataProvider().getRowState(i) === 'created'){
      Message.err(t('저장되지 않은 교육 일정입니다.'))
      return
    }
  }
  if(isNullCheck(popupData.SCHEDULE_ID)){
    Message.err(t('저장되지 않은 교육 일정입니다.'))
    return
  }
  if(checkedRows.length <= 0){
    Message.err(t('삭제할 데이터를 선택해 주세요.'))
    return
  }
  if(checkedRows.length === grdTime.value.getDataProvider().getRows().length){
    Message.err(t('모든 차시를 삭제할 수 없습니다. 반드시 하나 이상의 차시가 존재해야 합니다.'))
    return
  }
  console.log("삭제할 파람",deleteParams)
  commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP01_DELETE_05', list: deleteParams }).then(res => {
    onTimeBtnSearch()
  })
}

//일별 교시 상세 모두적용 버튼 이벤트
const onTimeBtnAllApply = () => {
  let checkedRows = grdTime.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('적용할 데이터를 선택해 주세요'))
    return
  }

  if(timePopupData.EPLACE_DIV_YN === 'N' && timePopupData.LECTURER_ID_YN === 'N'){
    console.log("적용할 교육장소 또는 강사를 체크해 주세요.")
    return
  }
  console.log("timePopupData.EPLACE_DIV_YN",timePopupData.EPLACE_DIV_YN)
  checkedRows.forEach(val => {
    console.log("발 확인",val)
    let setValue_EPLACE = {
      EPLACE_DIV : timePopupData.EPLACE_DIV,
      EPLACE_ID : _Parameters.EPLACE_ID,
      EPLACE_ETC : timePopupData.EPLACE_ETC,
    }
    let setValue_LECTURER_ID = {
      LECTURER_ID : _Parameters.LECTURER_ID,
      LECTURER_NM : timePopupData.LECTURER_ID
    }
    if(timePopupData.EPLACE_DIV_YN === 'Y'){
      if(setValue_EPLACE.EPLACE_DIV === 'A'){
        grdTime.value.getGridView().setColumnProperty('EPLACE_ETC', "readOnly", true)
      }else{
        grdTime.value.getGridView().setColumnProperty('EPLACE_ETC', "readOnly", false)
      }
      grdTime.value.getGridView().setValues(val, setValue_EPLACE, true)
    }
    if(timePopupData.LECTURER_ID_YN === 'Y'){
      grdTime.value.getGridView().setValues(val, setValue_LECTURER_ID, true)
    }
  })
}

//일별 교시 상세 셀 값 변경 시 발생 이벤트
const grdTimeValueChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  console.log("itemIndex",itemIndex)
  console.log("dataRow",dataRow)
  console.log("field",field)
  console.log("newValue",newValue)
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  // let row = grdTime.value.getGridView().getValues(dataRow)
  let row = grdTime.value.getRowData(dataRow)
  grdTime.value.getGridView().checkItem(itemIndex, true)
  console.log("row",row)
  if(field === 2 || field === 3){
    if((newValue.charAt(0) === '2' && Number(newValue.charAt(1)) >= '4') || newValue === '00:00'){
      Message.warn(t('잘못된 시간 유형입니다. 올바른 시간을 입력해 주세요.'))
      grid.cancel()
    }
    grid.commit()
    timeCalc(dataRow)
  }
  if(row.EPLACE_DIV === 'B'){//교육장소 - 구분이 기타일 경우
    grdTimeProps.columns.forEach(val => {
      if(val.fieldName === 'EPLACE_ETC'){
        grdTime.value.getGridView().setColumnProperty('EPLACE_ETC', "readOnly", false)
      }
      if(field === 5){
        grdTime.value.getGridView().setValues(dataRow, {EPLACE_ETC : ''}, true)
      }
    })
    _Parameters.EPLACE_ID = ''
    _Parameters.EPLACE_NM = ''
    _Parameters.EPLACE_NUM = ''
  }
  else if(row.EPLACE_DIV === 'A'){//교육장소 - 구분이 안전교육장일 경우
    grdTimeProps.columns.forEach(val => {
      if(val.fieldName === 'EPLACE_ETC'){
        grdTime.value.getGridView().setColumnProperty('EPLACE_ETC', "readOnly", true)
      }
    })
    if(field === 5){
      grdTime.value.getGridView().setValues(dataRow, {EPLACE_ETC : ''}, true)
    }
  }
}

//교육시각의 시작시각과 종료시각의 차를 구하는 이벤트
const timeCalc = rowIdx => {
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  // if(!isNullCheck(grdTime.value.getGridView().getValues(rowIdx).EDU_TIME) && !isNullCheck(grdTime.value.getGridView().getValues(rowIdx).EDU_TIME_FN)){
  //   let TIME = grdTime.value.getGridView().getValues(rowIdx).EDU_TIME
  //   let TIME_FN = grdTime.value.getGridView().getValues(rowIdx).EDU_TIME_FN
 if(!isNullCheck(grdTime.value.getRowData(rowIdx).EDU_TIME) && !isNullCheck(grdTime.value.getRowData(rowIdx).EDU_TIME_FN)){
    let TIME = grdTime.value.getRowData(rowIdx).EDU_TIME
    let TIME_FN = grdTime.value.getRowData(rowIdx).EDU_TIME_FN
    let HOUR =  (TIME_FN.substr(0, 2) - TIME.substr(0, 2)) * 60
    let MINUTE = (TIME_FN.substr(3, 2) - TIME.substr(3, 2))
    let RESULT = String(Number(HOUR) + Number(MINUTE)) 
    if(RESULT < 0){
      grdTime.value.getGridView().setValues(rowIdx, {EDU_TIME_FN : ''}, true)
      Message.warn(t('시작 시각보다 적은 값은 입력할 수 없습니다.'))
      return
    }
    grdTime.value.getDataProvider().setValue(rowIdx, "LEAD_TIME", RESULT)
  }
}

//일별 교시 상세 그리드 버튼 클릭 이벤트
const grdTimeButtonClicked = (grid, item, fixed) => {
  if(grdTimeButtonUseYn.value === false){
    return
  }
  console.log("클릭한 item",item)
  grdTimeFocusedRowIdx.value = item.dataRow
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  // let clickRowValue = grdTime.value.getGridView().getValues(item.dataRow)
  let clickRowValue = grdTime.value.getRowData(item.dataRow)
  if(item.fieldName === 'EPLACE_ETC'){
    if(clickRowValue.EPLACE_DIV !== 'B'){
    eplaceEtcClick()
    }
  }
  else if(item.fieldName === 'LECTURER_NM'){
    lecturerIdClick()
  }
}

//교육장 팝업 오픈
const eplaceEtcClick = OPEN_TYPE => {
  eDUAB0030Tab01Pop01Pop08.value.openPopup({
    DATE_FROM : isNullCheck(popupData.EDU_DATE) === true ? '' : popupData.EDU_DATE,
    DATE_TO : isNullCheck(popupData.EDU_DATE_END) === true ? '' : popupData.EDU_DATE_END,
    EPLACE_ID : timePopupData.EPLACE_ETC,
    OPEN_TYPE : OPEN_TYPE
  })
}

//교육장 팝업에서 데이터 선택 후
const onEplaceSelect = (data) => {
  console.log('데이타',data)
  _Parameters.EPLACE_ID = data.EPLACE_ID
  _Parameters.EPLACE_NM = data.EPLACE_NM
  _Parameters.EPLACE_NUM = data.EPLACE_NUM

  console.log("전역변수 확인",_Parameters)
  timePopupData.EPLACE_DIV = 'A'
  
  if(!isNullCheck(grdTimeFocusedRowIdx.value)){
    console.log("grdTimeFocusedRowIdx은 널이 아님")
    let setValue_EPLACE = {
      EPLACE_DIV : 'A',
      EPLACE_ID : data.EPLACE_ID,
      EPLACE_ETC : _Parameters.EPLACE_NM,
    }
    console.log("grdTimeFocusedRowIdx.value", grdTimeFocusedRowIdx.value)
    grdTime.value.getGridView().setValues(grdTimeFocusedRowIdx.value, setValue_EPLACE , true)
    grdTimeFocusedRowIdx.value = null
    return
  }else{
    timePopupData.EPLACE_ETC = _Parameters.EPLACE_NM
  }
  if(isNullCheck(popupData.EDUPOSSIBLE_NUM) || popupData.EDUPOSSIBLE_NUM === '0'){
    popupData.EDUPOSSIBLE_NUM = _Parameters.EPLACE_NUM
  }
}

//강사 팝업 오픈
const lecturerIdClick = () => {
  eDUAB0030Tab01Pop01Pop09.value.openPopup({
    LECTURER_ID : timePopupData.LECTURER_ID
  })
}

//강사 팝업에서 데이터 선택 후
const onLecturerSelect = (data) => {
  console.log("전역변수 확인",_Parameters)
  console.log("강사 데이터 확인",data)
  _Parameters.LECTURER_ID = ''
  let LECTURER_NM = ''
  data.forEach(val => {
    console.log("발 확인",val)
    let LEC_ID = val.LECTURER_ID
    let LEC_NM = val.NAME

    if(isNullCheck(_Parameters.LECTURER_ID)){
      _Parameters.LECTURER_ID = LEC_ID
      LECTURER_NM = LEC_NM
    }else{
      _Parameters.LECTURER_ID += ',' + LEC_ID 
      LECTURER_NM += ',' + LEC_NM
    }
  })
  if(!isNullCheck(grdTimeFocusedRowIdx.value)){
    let setValue_LECTURER_ID = {
      LECTURER_ID : _Parameters.LECTURER_ID,
      LECTURER_NM : LECTURER_NM
    }
    grdTime.value.getGridView().setValues(grdTimeFocusedRowIdx.value, setValue_LECTURER_ID, true)
    grdTimeFocusedRowIdx.value = null
    return
  }
  timePopupData.LECTURER_ID = LECTURER_NM
}


//교육장소를 변경했을 때 데이터
const eplaceDivChanged = () => {
  _Parameters.EPLACE_ID = ''
  timePopupData.EPLACE_ETC = ''
}
//**************************************************************************************************************************/
//*********************************************일별 교시 상세 영역(종료)*****************************************************/
//**************************************************************************************************************************/

//**************************************************************************************************************************/
//************************************************대상자 목록 영역**********************************************************/
//**************************************************************************************************************************/
const onMainButtonsClick = btn => {
  if(btn.id === 'btnPointListPrint'){//대상자 목록 출력
    onMainBtnPointListPrint()
  }
  else if(btn.id === 'btnTargetAdd'){//대상자 추가
    onMainBtnTargetAdd()
  }
  else if(btn.id === 'btnTargetDelete'){//대상자 삭제
    onMainBtnTargetDelete()
  }
}

//대상자 목록 출력 버튼 클릭 이벤트
const onMainBtnPointListPrint = () => {
  if(grdMain.value.getDataProvider().getRows().length == 0){
    Message.warn(t('교육 대상자가 지정되지 않았습니다.'))
    return
  }
  reportName.value = '/manage/hse/EDUAB0030_TAB01_POP01_02.ozr'
  let focusedRow = grdTime.value.getFocusedRowData()
  console.log("포커스 로우 데이터 확인",focusedRow)
  let TITLE = ''
  TITLE = _Parameters.YEAR + '년 ' + (isNullCheck(_Parameters.EDU_TITLE) === true ? '' : _Parameters.EDU_TITLE)
  let sCMPNY_DIV = focusedRow.CMPNY_DIV
  let sYEAR = focusedRow.YEAR
  let sSCHEDULE_ID = focusedRow.SCHEDULE_ID
  let sEDUTIME_SERIAL = '1'

  printParams.value = [
    "IN_TITLE="+TITLE,
    "IN_CMPNY_DIV="+sCMPNY_DIV,
    "IN_YEAR="+sYEAR,
    "IN_SCHEDULE_ID="+sSCHEDULE_ID,
    "IN_EDUTIME_SERIAL="+sEDUTIME_SERIAL
  ]
  showOz.value = true
}

//대상자 추가 버튼 클릭 이벤트
const onMainBtnTargetAdd = () => {
  if(isNullCheck(popupData.DIVISION)){
    Message.warn(t('분류는 필수 입력 항목입니다.'))
    return
  }

  if(isNullCheck(popupData.CURR_ID)){
    Message.warn(t('교육명은 필수 입력 항목입니다.'))
    return
  }
  empPopup.value.openPopup({MULTI:true})
}

//사원 검색 팝업 데이터 선택 후
const onEmpSelected = async data => {
  if(data.length < 0){
    return
  }
  console.log("선택한 대상자 데이터 확인",data)

  let grdMainDataRows = []
  for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
    // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
    // grdMainDataRows.push(grdMain.value.getGridView().getValues(i))
    grdMainDataRows.push(grdMain.value.getRowData(i))
  }
  let errCnt = 0
  let errCnt2 = 0
  let errCnt3 = 0
  let errCnt4 = 0
  let msg = '아래 인원은 사전학습과정 미 이수로 인하여 수강신청이 불가하여 제외 됩니다.\n'
  let msg2 = '아래 인원은 해당 과정의 운전자격을 이미 취득하여 제외 됩니다.\n'
  let msg3 = '아래 인원은 연령이 제한이 되어 수강신청이 불가하여 제외 됩니다.\n'
  let msg4 = '아래 인원은 장비자격 취소로 인하여 수강신청이 불가하여 제외 됩니다.\n'
  let sDisplayText = ''

  const promises = data.map(async data => {
    return await data
  })
  Promise.all(promises).then(async data => {
    data.forEach(async val => {
      let dupCheck = 0
      let cnt = 0
      grdMainDataRows.forEach(grdMain => {
        if(grdMain.TARGET_ID === val.EMP_NO){
          dupCheck++
        }
      })
      if(dupCheck > 0){
        return
      }

      let liceSearchParams = {
        CMPNY_DIV : userStore.cmpnyDiv,
        YEAR : _Parameters.YEAR,
        CURR_ID : popupData.CURR_ID,
        MORGN_ID : _Parameters.MORGN_ID,
        TARGET_ID : val.EMP_NO,
        USER_ID : userStore.userId
      }
      if(popupData.DIVISION === 'C'){
        //자격증 체크 조회
        await commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_15', param : liceSearchParams }).then(res2 => {
          if(res2.ORESULT_CUR[0].POINT === 0){
            if(errCnt2 === 0){
              msg2 += '' + val.EMP_NM + '(' + val.EMP_NO + ')'
            }else{
              msg2 += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
            }
            errCnt2++
            cnt++
          }
        })
      }

      // 운전보수 교육 일 때 자격 취소자 제외 (연결된 자격 모두 취소일 때만 교육신청 불가)
      if(popupData.DIVISION === 'M'){
        //자격증 체크 조회
        await commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_18', param : liceSearchParams }).then(res2 => {
        // console.log("자격증 체크 조회",res2)
          if(res2.ORESULT_CUR[0].POINT === 0){
            if(errCnt4 === 0){
              msg4 += '' + val.EMP_NM + '(' + val.EMP_NO + ')'
            // console.log("지금 msg2", msg2)
            }else{
              msg4 += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
            }
            errCnt4++
            cnt++
          }
        })
      }

      //사전학습 체크 조회
      await commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_13', param: liceSearchParams }).then(res3 => {
        if(res3.ORESULT_CUR[0].POINT === 0){
          if(popupData.DIVISION === 'C'){
            //자격증 체크 조회
            commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP01_SEARCH_14', param: liceSearchParams }).then(res4 => {
              if(res4.ORESULT_CUR.length > 0){
                if(res4.ORESULT_CUR[0].POINT === 0){
                  if(errCnt === 0){
                    msg += val.EMP_NM + '(' + val.EMP_NO + ')'
                  }else{
                    msg += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
                  }
                  errCnt++
                  cnt++
                }
              }else{
                if(errCnt === 0){
                  msg += val.EMP_NM + '(' + val.EMP_NO + ')'
                }else{
                  msg += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
                }
              }

            })
          }else{
            if(errCnt === 0){
              msg += val.EMP_NM + '(' + val.EMP_NO + ')'
            }else{
              msg += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
            }
            errCnt++
            cnt++
          }
        }
      })

      if(val.HLD_OFFI_GBN === '2'){
        val.HLD_OFFI_GBN = '휴직'
      }
      else if(val.HLD_OFFI_GBN === '3'){
        val.HLD_OFFI_GBN = '퇴직'
      }

      let newRow = {
        CMPNY_DIV : userStore.cmpnyDiv,
        YEAR : _Parameters.YEAR,
        SCHEDULE_ID : _Parameters.SCHEDULE_ID,
        TARGET_ID : val.EMP_NO,
        TARGET_NM : val.EMP_NM,
        EDUTIME_SERIAL : '1',
        JOB_TIT_CD : val.JOB_TIT_CD,
        JOB_TIT_NM : val.JOB_TIT_NM,
        OFFI_RES_CD : val.OFFI_RES_CD,
        OFFI_RES_NM : val.OFFI_RES_NM,
        ASGN_CD : val.ASGN_CD,
        ASGN_NM : val.ASGN_SHRT_NM,
        ORI_ORGN_NM : val.ASGN_SHRT_NM,
        ORGN_CD : val.DEPT_CD,
        ORGN_NM : val.DEPT_NM,
        BSNS_CD : val.BSNS_CD,
        BSNS_NM : val.BSNS_NM,
        EMAIL : val.EMAIL,
        BIRTH_YEAR : isNullCheck(val.BIRTH_DAY) === true ? '' : val.BIRTH_DAY.substr(0, 4),
        COMPANY : val.COMPANY,
        HLD_OFFI_GBN_NM : val.HLD_OFFI_GBN,
        HND_PHN : val.HND_PHN,
        DUTY_NM : val.UNT_DUTY_NM
      }
      //console.log("뉴로우 확인",newRow)

      //연령제한 로직 추가 연령제한이 0인것은 체크안함.
      if(Number(popupData.AGE) != 0 && Number(val.AGE) >= Number(popupData.AGE)){
        if(errCnt3 === 0){
          msg3 += val.EMP_NM + '(' + val.EMP_NO + ')'
        }else{
          msg3 += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
        }
        errCnt3++
      }

      if(errCnt3 > 0){
        ck = vm.$swal({ 
          title: t(msg3), 
        })
        return
      }

      if(cnt === 0){
        grdMain.value.addRow(newRow)
      }
      if(errCnt > 0 && errCnt2 > 0){
        msg = msg + '\n' + msg2
      }
      else if(errCnt2 > 0){
        msg = msg2
      }
      if(errCnt > 0 || errCnt2 > 0){
        let ck = ''
        ck = vm.$swal({ 
        title: t(msg), 
        })
      }
      if(errCnt4 > 0){
        ck = vm.$swal({ 
          title: t(msg4), 
        })      
      }
      if(!isNullCheck(sDisplayText)){
        let ck = ''
        ck = vm.$swal({ 
        title: t(sDisplayText), 
        })
      }
    })
  })
}

//대상자 삭제 버튼 클릭 이벤트
const onMainBtnTargetDelete = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  let stateList = []
  let PASS = 'Y'
  console.log("선택한 데이터 확인",checkedRows)
  if(checkedRows.length < 1){
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))
    return
  }
  let deleteParams = []
  for(let i = 0; i < checkedRows.length; i++){
    deleteParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    stateList.push(grdMain.value.getDataProvider().getRowState(checkedRows[i]))
  }
  stateList.forEach(val => {
    if(val == 'created'){
      PASS = 'N'
    }
  })
  grdMain.value.getDataProvider().removeRows(checkedRows)
  console.log("삭제할 데이터 확인",deleteParams)
  if(PASS === 'Y'){
    commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP02_POP02_DELETE_03', list: deleteParams }).then(() => {
      Message.success(t('삭제되었습니다.'))
      searchEduSavedTargetList()
    }).finally(() => {
      searchEduSavedTargetList()
    })
  }
}
//**************************************************************************************************************************/
//**********************************************대상자 목록 영역(종료)*******************************************************/
//**************************************************************************************************************************/

defineExpose({
  openPopup
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1500"
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
  <!-- @mousemove="handleDragging" 
    @mouseup="stopDragging" -->
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>교육 신청 등록(신청분)</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <v-card-title class="d-flex pa-4 pb-2" style="justify-content: space-between;">
        <div class="d-flex">
          <span>{{ popupData.SCHEDULE_ID }}</span>
          <IGridTitle
            ref="popupButtons1"
            :use-permission="false"
            :button-list="['btnDelete']"
            @click-button="onButtonsClick"
          />
        </div>
        <IGridTitle
          ref="popupButtons2"
          :use-permission="false"
          :button-list="['btnQrCodePrint','btnSendSms', 'btnSendMail', 'btnUpdate', 'btnOpen', 'btnConfirm', 'btnEduCopy', 'btnInitNew', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">

        <div class="d-flex" style="height:100%">
          <div class="flex-column mr-2" style="width:35%">
            <v-sheet width="100%" height="100%" class="flex-column searchArea">
              <div class="d-flex" style="justify-content: space-between;">
                <i-select
                  :label="$t('분류')"
                  leftLabel
                  v-model="popupData.DIVISION"
                  :items="codeList.division"
                  item-title="TXT"
                  item-value="COD"
                  labelWidth="80px"
                  width="350px"
                  class="mb-4"
                  :required="true"
                  :disabled="disable.DIVISION"
                />
                <VCheckbox
                  :label="$t('알림문자발송')"
                  v-model="popupData.SEND_YN"
                  class=mr-4
                />
              </div>
              <div class=d-flex v-if="visible.WORK_STD_NM">
                <i-input
                  class="mb-4"
                  :label="$t('작업표준명')"
                  leftLabel
                  v-model="popupData.WORK_STD_NM"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="workStdNmClick"
                  width="480px"
                  labelWidth="80px"
                  readonly
                />
              </div>
              <i-select
                :label="$t('교육명')"
                leftLabel
                v-model="popupData.CURR_ID"
                :items="codeList.currId"
                item-title="TXT"
                item-value="COD"
                labelWidth="80px"
                width="480px"
                class="mb-4"
                :required="true"
                :disabled="disable.CURR_ID"
              />
              <i-select
              :label="$t('주관부서')"
                leftLabel
                v-model="popupData.MORGN_ID"
                :items="codeList.morgnId"
                item-title="TXT"
                item-value="COD"
                labelWidth="80px"
                width="480px"
                class="mb-4"
                :disabled="disable.MORGN_ID"
              />
              <i-input
                :label="$t('제목')"
                leftLabel
                v-model="popupData.EDU_TITLE"
                labelWidth="80px"
                width="480px"
                class="ma-0 mb-4"
                :required="true"
                :disabled="disable.EDU_TITLE"
              />
              <div class="d-flex mb-4">
                <i-input
                  :label="$t('교육기간')"
                  leftLabel
                  v-model="popupData.EDU_DATE"
                  type="date"
                  labelWidth="80px"
                  width="235px"
                  class="ma-0 mr-2"
                  :disabled="disable.EDU_DATE"
                  @focusout="eduDateFrChanged"
                />
                <i-input
                  :label="$t('-')"
                  leftLabel
                  v-model="popupData.EDU_DATE_END"
                  type="date"
                  width="160px"
                  class="ma-0"
                  :disabled="disable.EDU_DATE_END"
                  @focusout="eduDateToChanged"
                />
              </div>
              <div class="d-flex mb-4">
                <i-input
                  :label="$t('소요시간')"
                  leftLabel
                  v-model="popupData.LEAD_TIME"
                  labelWidth="80px"
                  width="235px"
                  class="ma-0 mr-1"
                  reverse
                  number
                  :required="true"
                  :disabled="disable.LEAD_TIME"
                  @focusout="leadTimeValueChanged"
                />
                <span style="margin-top:6px">분</span>
              </div>
              <div class="d-flex mb-4">
                <i-input
                  :label="$t('신청기간')"
                  leftLabel
                  v-model="popupData.REQ_DUR_FROM"
                  type="date"
                  labelWidth="80px"
                  width="235px"
                  class="ma-0 mr-2"
                  :disabled="disable.REQ_DUR_FROM"
                  @focusout="reqDurFromChanged"
                />
                <i-input
                  :label="$t('-')"
                  leftLabel
                  v-model="popupData.REQ_DUR_TO"
                  type="date"
                  width="160px"
                  class="ma-0"
                  :disabled="disable.REQ_DUR_TO"
                  @focusout="reqDurToChanged"
                />
              </div>
              <div class="d-flex mb-4">
                <i-input
                  :label="$t('가능인원')"
                  leftLabel
                  v-model="popupData.EDUPOSSIBLE_NUM"
                  labelWidth="80px"
                  width="235px"
                  class="ma-0 mr-1"
                  reverse
                  number
                  :required="true"
                  :disabled="disable.EDUPOSSIBLE_NUM"
                  @focusout="eduPossibleNumValueChanged"
                />
                <span style="margin-top:6px">명</span>
              </div>
              <i-input
                :label="$t('대상')"
                leftLabel
                v-model="popupData.TARGET"
                labelWidth="80px"
                width="480px"
                class="ma-0 mb-4"
                :disabled="disable.TARGET"
              />
              <i-input
                :label="$t('과정소개')"
                leftLabel
                v-model="popupData.EDU_INTRO"
                labelWidth="80px"
                width="480px"
                rows="2"
                class="ma-0 mb-4"
                disabled
              />
              <i-input
                :label="$t('교육내용상세')"
                leftLabel
                v-model="popupData.EDU_DESC"
                labelWidth="80px"
                width="480px"
                rows="2"
                class="ma-0 mb-4"
                disabled
              />
              <i-input
                :label="$t('비고')"
                leftLabel
                v-model="popupData.REMARK"
                labelWidth="80px"
                width="480px"
                rows="2"
                class="ma-0 mb-4"
                disabled
              />
              <div class="d-flex mb-4">
                <i-select
                  :label="$t('진행상태')"
                  leftLabel
                  v-model="popupData.STATUS"
                  :items="codeList.status"
                  item-title="TXT"
                  item-value="COD"
                  labelWidth="80px"
                  width="235px"
                  class="ma-0 mr-2"
                  disabled
                />
                <i-input
                  :label="$t('개설일')"
                  leftLabel
                  v-model="popupData.OPEN_DATE"
                  labelWidth="80px"
                  width="235px"
                  class="ma-0"
                  disabled
                />
              </div>
            </v-sheet>
          </div>
          <div class="flex-column" style="width:65%">
            <div style="width:100%; height:40%">
              <v-sheet width="100%" height="100%">
                <div>
                  <IGridTitle
                    :title="$t('일별 교시 상세')"
                    ref="grdTimeButtons"
                    :use-permission="false"
                    :button-list="['btnSearch', 'btnCreate', 'btnDelete']"
                    @click-button="onTimeButtonsClick"
                  >
                    <template #editors />
                  </IGridTitle>
                </div>
                <div class="d-flex mb-2" style="justify-content:flex-end">
                  <VCheckbox
                    v-model="timePopupData.EPLACE_DIV_YN"
                    class="ma-0 mt-1"
                  />
                  <i-select
                    :label="$t('교육장소')"
                    leftLabel
                    v-model="timePopupData.EPLACE_DIV"
                    :items="codeList.eplaceDiv"
                    item-title="TXT"
                    item-value="COD"
                    width="200px"
                    class="mr-2"
                    :disabled="disable.EPLACE_DIV"
                    @update:model-value="eplaceDivChanged"
                  />
                  <i-input
                    leftLabel
                    v-model="timePopupData.EPLACE_ETC"
                    append-inner-icon="mdi-magnify"
                    @click:appendInner="eplaceEtcClick()"
                    @update:model-value="_Parameters.EPLACE_ID = null"
                    width="150px"
                    rows="2"
                    class="mr-2"
                    v-if="timePopupData.EPLACE_DIV === 'A'"
                  />
                  <i-input
                    leftLabel
                    v-model="timePopupData.EPLACE_ETC"
                    @update:model-value="_Parameters.EPLACE_ID = null"
                    width="150px"
                    rows="2"
                    class="mr-2"
                    v-if="timePopupData.EPLACE_DIV === 'B'"
                  />
                  <VCheckbox
                    v-model="timePopupData.LECTURER_ID_YN"
                    class="ma-0 mt-1"
                  />
                  <i-input
                    :label="$t('강사')"
                    leftLabel
                    v-model="timePopupData.LECTURER_ID"
                    append-inner-icon="mdi-magnify"
                    @click:appendInner="lecturerIdClick"
                    @update:model-value="_Parameters.LECTURER_ID = null"
                    width="150px"
                    rows="2"
                  />
                  <IButtonList
                    ref="grdTimeButtons2"
                    :button-list="['btnAllApply']"
                    @click-button="onTimeButtonsClick"
                  />
                </div>
                <RealGrid
                  ref="grdTime"
                  :grid-view-option="grdTimeProps.gridViewOption"
                  :fields="grdTimeProps.fields"
                  :columns="grdTimeProps.columns"
                  :column-layout="grdTimeProps.columnLayout"
                  @onCellButtonClicked ="grdTimeButtonClicked"
                  @onEditRowChanged="grdTimeValueChanged"
                />
              </v-sheet>
            </div>
            <div class="mt-2" style="width:100%; height:58%">
              <v-sheet width="100%" height="100%">
                <IGridTitle
                  :title="TARGET_CNT"
                  ref="grdMainButtons"
                  :use-permission="false"
                  :button-list="['btnPointListPrint', 'btnTargetAdd', 'btnTargetDelete']"
                  @click-button="onMainButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                />
              </v-sheet>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <EDUAB0030Tab01Pop01 ref="eDUAB0030Tab01Pop01"/>
  <SendMailPopup ref="sendMailPopup" />
  <SendSMSPopUp ref="sendSMSPopup" />
  <EDUAB0030Tab01Pop01Pop08 ref="eDUAB0030Tab01Pop01Pop08" @onSelect="onEplaceSelect"/>
  <EDUAB0030Tab01Pop01Pop09 ref="eDUAB0030Tab01Pop01Pop09" @onSelect="onLecturerSelect"/>
  <EDUAB0030Tab01Pop01Pop11 ref="eDUAB0030Tab01Pop01Pop11" @onSelect="onWorkStdNmSelect"/>
  <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
  <OZReport :showPop="showOz" :reportName="reportName" :params="printParams" @close="showOz = $event" />
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>
