<!--
  화면명 : 교육 일정 등록(팝업)
  화면개요 :교육 일정을 등록하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from "@hiway/stores/common"
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
import EmpPopup from '@/components/popup/EmpPopupMultiDept.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
dayjs.locale('ko')
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'
import IButtonList from '@/components/IButtonList.vue'
import IUpload from "@/components/IUpload.vue"
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import SendSMSPopUp from '@/components/popup/SendSMSPopUp.vue'
import EDUAB0030Tab01Pop01Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop01.vue'
import EDUAB0030Tab01Pop01Pop03 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop03.vue'
import EDUAB0030Tab01Pop01Pop04 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop04.vue'
import EDUAB0030Tab01Pop01Pop06 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop06.vue'
import EDUAB0030Tab01Pop01Pop08 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop08.vue'
import EDUAB0030Tab01Pop01Pop09 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop09.vue'
import EDUAB0030Tab01Pop01Pop10 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop10.vue'
import EDUAB0030Tab01Pop01Pop11 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01Pop11.vue'

//*********************************************************************************************************************/
//***************************************************세팅 영역*********************************************************/
//*********************************************************************************************************************/
// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const printParams = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// #1 END ------------------------------------------------------
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const commonStore = useCommonStore()
const dialog = ref(false)
const grdEdu = ref(null)
const grdTime = ref(null)
const grdMain = ref(null)
const popupButtons1 = ref(null)  //팝업 메인 버튼(왼쪽)
const popupButtons2 = ref(null)  //팝업 메인 버튼(오른쪽)
const grdEduButtons = ref(null) //교육차수 관련 버튼
const grdTimeButtons1 = ref(null)//일별 교시 상세 관련 버튼(위)
const grdTimeButtons2 = ref(null)//일별 교시 상세 관련 버튼(아래)
const grdMainButtons = ref(null)//메인 그리드 관련 버튼
const eDUAB0030Tab01Pop01Pop01 = ref(null)//불참인원 조회 팝업
const eDUAB0030Tab01Pop01Pop03 = ref(null)//작업중지 해제인원 조회 팝업
//사내협력사 신규채용자 교육, 단기공사 교육 대상자, 일자별 대상자, 절대수칙 위반자 단기공사 교육 대상자_안전부대면 조회 팝업
const eDUAB0030Tab01Pop01Pop04 = ref(null)
const eDUAB0030Tab01Pop01Pop06 = ref(null)//실습/체험형 안전교육 대상자 조회 팝업
const eDUAB0030Tab01Pop01Pop08 = ref(null)//교육장소 팝업
const eDUAB0030Tab01Pop01Pop09 = ref(null)//교육강사 팝업
const eDUAB0030Tab01Pop01Pop10 = ref(null)//교육대상그룹 팝업
const eDUAB0030Tab01Pop01Pop11 = ref(null)//위험성평가
const sendMailPopup = ref(null)//메일 발송 팝업
const sendSMSPopup = ref(null)//문자 발송 팝업
const empPopup = ref(null)//사원검색 팝업
const TARGET_CNT = ref('대상자 목록(총 0명)')
const emit = defineEmits() 
const fileUpload = ref(null)
let _Parameters = reactive({})
let _REQ_ID = ref('')
let _REQ_TABLE = reactive({})
let grdEduFocusedRowIdx = ref(null)
let grdTimeFocusedRowIdx = ref(null)
let keyStatus = ref(true)
const selectAll = ref('Y')
const popupData = reactive({
  SCHEDULE_ID : '',     //일정 ID
  DIVISION : null,      //분류
  WORK_STD_ID : '',     //작업 표준 ID
  WORK_STD_NM : '',     //작업 표준명
  SEND_YN : 'N',        //알림문자발송
  CURR_ID  : '',        //교육 ID
  CURR_NM : '',         //교육명
  LINK_CODE : '',       //링크코드
  MORGN_ID : '',        //주관부서
  EDATE_FROM : '',      //교육기간(시작)
  EDATE_TO : '',        //교육기간(종료)
  EDUPOSSIBLE_NUM : '', //가능인원
  LEAD_TIME : '',       //소요시간
  EDU_CONTENT : '',     //교육내용
  VR_CATEGORY1 : '',    //교육내용1
  VR_CATEGORY2 : '',    //교육내용2
  AGE : '', //나이제한
  CMPNY_DIV: '', // 회사구분
  BSNS_CD: '', // 사업부
  DEPT_CD: '' // 부서
})

//확정버튼 휴무 체크
const btnVisibleState = reactive({
  btnConfirm : '',

})

//교육차수 데이터
const eduPopupData = reactive({
  CNT : '' //차수
})

//일별 교시 상세 데이터
const timePopupData = reactive({
  EPLACE_DIV_YN : true,   //교육장소 구분 여부
  EPLACE_DIV : '',        //교육장소 구분
  EPLACE_ETC : '',        //교육장소
  LECTURER_ID_YN : true,  //강사 여부
  LECTURER_ID : ''        //강사
})

//메인 그리드 데이터
const mainPopupData = reactive({
  GROUP : '',   //대상그룹선택 명
  GROUP_ID : '' // 대상그룹선택 ID
})

const codeList = reactive({
  division : [], //분류
  currId   : [], //교육명
  group    : [], //대상 그룹 선택
  eplaceDiv: [], //교육장소 구분
  auth_currId: [], // 개설제한 교육 체크
  auth_deptCd: [], // 개설제한 부서 체크
})

//레이아웃 visible 여부 설정
const visible = reactive({
  MORGN_DIV : true,       //주관부서
  EDU_CONTENT : true,     //교육내용
  VR_CATEGORY1 : true,    //교육내용1
  VR_CATEGORY2 : true,    //교육내용2
  WORK_STD_NM : false,    //작업표준명
})

//레이아웃 disable 여부 설정
const disable = reactive({
  EPLACE_DIV : false,     //교육장소(구분)
  EPLACE_DIV_YN : false,  //교육장소 사용 여부
  GROUP : false,          //대상그룹선택
  GROUP_BTN : false,      //대상그룹조회 버튼
})

//레이아웃 labelWidth 설정
const labelWidthes = reactive({
  division : '54px',  //분류
  currId : '54px',    //교육명
  eDate : '54px',     //기간
})

const AUTH_GRP_CD = ref(null) //권한그룹

//교육차수
const grdEduProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false }, footer: {visible: true} },
  fields : [
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', width:'50', header: { text: t('차수') }, editable: false},
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('시작일'), styleName: 'header_validit' }, styleName: 'editable_column',
      'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
      editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
      mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} }, required : true  },
    { fieldName: 'EDU_DATE_END', dataType: 'text', header: { text: t('종료일'), styleName: 'header_validit' }, styleName: 'editable_column',
      'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
      editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
      mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} }  },
    { fieldName: 'EDU_TARGET_CNT',  dataType: 'number', width:'50', header: { text: t('대상인원') }, styleName:'right-column', editable: false,
      numberFormat:"#,###" , footer: { numberFormat: "#,###",expression: "sum" } },
    { fieldName: 'SETEACH', dataType: 'text', width:'50', header: { text: t('대상설정') }, renderer:{ type:"button" }, editable : false  },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('SAVE_YN') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('일정 ID') }, editable: false, visible: false },
    { fieldName: 'FINISH_YN', dataType: 'text', header: { text: t('FINISH_YN') }, editable: false, visible: false },
    { fieldName: 'CHA_NUM', dataType: 'text', header: { text: t('CHA_NUM') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, editable: false, visible: false },
  ],
  columns: [],
  columnLayout: [
    'EDUTIME_SERIAL',
    {
      name:'교육기간',
      direction: 'horizontal',
      items: ['EDU_DATE', 'EDU_DATE_END'],
      header: { text : t('교육기간')}
    },
    'EDU_TARGET_CNT',
    'SETEACH'
  ],
})

//일별 교시 상세
const grdTimeProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false }, footer: {visible: false} },
  fields : [
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', width:'50', header: { text: t('차수') }, editable: false },
    { fieldName: 'EDU_DATE', dataType: 'text', width:'50', header: { text: t('교육일자'), styleName: 'header_validit' }, styleName: 'editable_column',
      'displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
      editor: { type:'date', datetimeFormat:'yyyy-MM-dd', 
      mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} } },
    { fieldName: 'EDUTIME_SEQ', dataType: 'Time', width:'50', header: { text: t('교시') }, editable: false },
    { fieldName: 'EDU_TIME', dataType: 'text',  width:'50', header: { text: t('시작'), styleName: 'header_validit' }, styleName: 'editable_column',
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
        allowEmpty: true 
        }
      }, 
      textFormat: "([0-9]{2})([0-9]{2});$1:$2"},
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
        allowEmpty: true 
        }
      }, 
      textFormat: "([0-9]{2})([0-9]{2});$1:$2"},
    { fieldName: 'LEAD_TIME', dataType: 'text', width:'50', header: { text: t('시간(분)') }, editable: false },
    { fieldName: 'EPLACE_DIV', dataType: 'text', width:'50', header: { text: t('구분'), styleName: 'header_validit' }, styleName: 'editable_column', lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true, editable: false } },
    { fieldName: 'EPLACE_ETC', dataType: 'text', width:'50', header: { text: t('장소'), styleName: 'header_validit' }, styleName: 'left-column editable_column', lookupDisplay: true,
      button:"action", buttonVisibility: "always"},
    { fieldName: 'LECTURER_NM', dataType: 'text', width:'50', header: { text: t('강사명'), styleName: 'header_validit' }, styleName: 'left-column editable_column', editable: false, lookupDisplay: true,
      button:"action", buttonVisibility: "always" },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, editable: false, visible: false },
    { fieldName: 'EDU_DIV', dataType: 'text', header: { text: t('EDU_DIV') }, editable: false, visible: false },
    { fieldName: 'EPLACE_ID', dataType: 'text', header: { text: t('EPLACE_ID') }, editable: false, visible: false },
    { fieldName: 'CON_DIV', dataType: 'text', header: { text: t('CON_DIV') }, editable: false, visible: false },
    { fieldName: 'REQ_YN', dataType: 'text', header: { text: t('REQ_YN') }, editable: false, visible: false },
    { fieldName: 'LECTURER_ID', dataType: 'text', header: { text: t('LECTURER_ID') }, editable: false, visible: false },
    { fieldName: 'OLD_EDU_DATE', dataType: 'text', header: { text: t('OLD_EDU_DATE') }, editable: false, visible: false },
    { fieldName: 'TIME_SEQ', dataType: 'text', header: { text: t('TIME_SEQ') }, editable: false, visible: false },
  ],
  columns: [],
  columnLayout: [
    'EDUTIME_SERIAL',
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
      header: {text : t('교육장소')}
    },
    'LECTURER_NM'
  ],
})

//대상자 목록(grdMain)
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false }, footer: {visible: false} },
  fields : [
    { fieldName: 'ORGN_NM', dataType: 'text', width:'50', header: { text: t('소속') }, editable: false},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', width:'50', header: { text: t('직위') }, editable: false },
    { fieldName: 'TARGET_ID', dataType: 'text', width:'70', header: { text: t('사용자 ID') }, editable: false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
    { fieldName: 'DUTY_NM', dataType: 'text', header: { text: t('인사직무') }, editable: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('차수'), styleName: 'header_validit' }, editable: false },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육시작일') }, editable: false },
    { fieldName: 'EDU_DATE_END', dataType: 'text', header: { text: t('교육종료일') }, editable: false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable: false },
    // 2024.08.22 박용훈 제외는 없어졌으므로 화면에서 표시 안되도록 수정함.
    // { fieldName: 'NON_YN', dataType: 'text', header: { text: t('제외') }, editable: false },
    // { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고(제외사유)') }, editable: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, editable: false },
    { fieldName: 'EDU_DIV', dataType: 'text', header: { text: t('이수여부') }, editable: false },
    { fieldName: 'EDU_SCORE', dataType: 'text', header: { text: t('교육점수') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('SAVE_YN') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('FINISH_YN') }, editable: false, visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('JOB_TIT_CD') }, editable: false, visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', header: { text: t('OFFI_RES_CD') }, editable: false, visible: false },
    { fieldName: 'ORGN_CD', dataType: 'text', header: { text: t('ORGN_CD') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, editable: false, visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('BSNS_NM') }, editable: false, visible: false },
    { fieldName: 'EMAIL', dataType: 'text', header: { text: t('EMAIL') }, editable: false, visible: false },
    { fieldName: 'FINISH_YN', dataType: 'text', header: { text: t('FINISH_YN') }, editable: false, visible: false },
    { fieldName: 'VIO_NO', dataType: 'text', header: { text: t('VIO_NO') }, editable: false, visible: false },
    { fieldName: 'VIO_DIV', dataType: 'text', header: { text: t('VIO_DIV') }, editable: false, visible: false },
    { fieldName: 'VIO_DESC', dataType: 'text', header: { text: t('VIO_DESC') }, editable: false, visible: false },
    { fieldName: 'VIO_TIME', dataType: 'text', header: { text: t('VIO_TIME') }, editable: false, visible: false },
    { fieldName: 'COMPANY', dataType: 'text', header: { text: t('COMPANY') }, editable: false, visible: false },
    { fieldName: 'HND_PHN', dataType: 'text', header: { text: t('HND_PHN') }, editable: false, visible: false },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', header: { text: t('UPDATE_USER_ID') }, editable: false, visible: false },
    { fieldName: 'CERT_VNO', dataType: 'text', header: { text: t('CERT_VNO') }, editable: false, visible: false },
    { fieldName: 'REG_REQ_SEQ', dataType: 'text', header: { text: t('REG_REQ_SEQ') }, editable: false, visible: false },
    { fieldName: 'MEDIA_CD_1', dataType: 'text', header: { text: t('MEDIA_CD_1') }, editable: false, visible: false },
    { fieldName: 'MEDIA_CD_2', dataType: 'text', header: { text: t('MEDIA_CD_2') }, editable: false, visible: false },
    { fieldName: 'DUPL_CHK', dataType: 'text', header: { text: t('DUPL_CHK') }, editable: false, visible: false },
  ],
  columns: [],

})

grdEduProps.columns = grdEduProps.fields
grdTimeProps.columns = grdTimeProps.fields
grdMainProps.columns = grdMainProps.fields

const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'), //분류
    getCodeList('HHID150'),
    getCodeList('HHID260')
  ]).then(res => {
    // console.log('initCodeList ::::>>>>', res)
    //분류 데이터 바인딩
    codeList.division = res[0].ORESULT_CUR
    codeList.division.unshift({COD : '', TXT : ''})
    //popupData.DIVISION = codeList.division[0].COD
    codeList.auth_currId = res[2].ORESULT_CUR
    
    //일별 교시 상세 > 교육장소 데이터 바인딩
    codeList.eplaceDiv = []
    codeList.eplaceDiv.push({COD : 'A', TXT : '안전교육장'}, {COD : 'B', TXT : '기타'})
    timePopupData.EPLACE_DIV = codeList.eplaceDiv[0].COD
    grdTime.value.setBindingColumn("EPLACE_DIV",[], "COD", "TXT")
    grdTime.value.setBindingColumn("EPLACE_DIV",codeList.eplaceDiv, "COD", "TXT")
  })

  if(!isNullCheck(userStore.authGrpCd)){
    AUTH_GRP_CD.value = null
    userStore.authGrpCd.forEach(val => {
      if(AUTH_GRP_CD.value === null){
        AUTH_GRP_CD.value = val
      }else{
        AUTH_GRP_CD.value += ', ' + val
      }
    })
  }
}

// 분류가 바뀌면 분류에 따른 교육명 데이터 가져옴
watch(() => popupData.DIVISION, (newValue, oldValue) => {
  if(newValue === ''){
    codeList.currId = []
    codeList.currId.unshift({ TXT:"선택", COD:"" })
    popupData.CURR_ID =codeList.currId[0].COD
    mainPopupData.GROUP_NM = ''
    codeList.group = []
    grdMain.value.getDataProvider().setRows([])
    return
  }
  // console.log("교육명 조회 데이터",newValue)
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_02', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : newValue, USER_ID : userStore.userId, AUTH_GRP_CD : AUTH_GRP_CD.value} })
    .then(res => {
      codeList.currId = []
      // console.log("교육명 레스",res)
      codeList.currId = res.ORESULT_CUR
      codeList.currId.unshift({ TXT:"선택", COD:"" })
      if(isNullCheck(_Parameters.CURR_ID)){
        popupData.CURR_ID =codeList.currId[0].COD

      }else{
        popupData.CURR_ID = _Parameters.CURR_ID
      }
      grdMain.value.getDataProvider().setRows([])
      mainPopupData.GROUP_NM = ''
      codeList.group = []
      currIdChanged()
    })
})
//*******************************************************************************************************************************/
//*************************************************세팅 영역(종료)***************************************************************/
//*******************************************************************************************************************************/

//*******************************************************************************************************************************/
//***************************************************이벤트 영역*****************************************************************/
//*******************************************************************************************************************************/

//팝업 오픈 시 모든 데이터 초기화
const openRefresh = () => {
  Object.keys(popupData).forEach(key => {
    popupData[key] = ''
  })
  Object.keys(eduPopupData).forEach(key => {
    eduPopupData[key] = ''
  })
  Object.keys(timePopupData).forEach(key => {
    timePopupData[key] = ''
  })
  Object.keys(mainPopupData).forEach(key => {
    mainPopupData[key] = ''
  })
  grdEdu.value.getDataProvider().setRows([])
  grdEdu.value.getGridView().checkAll(false)
  grdTime.value.getDataProvider().setRows([])
  grdTime.value.getGridView().checkAll(false)
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().checkAll(false)
  popupData.EDATE_FROM = isNullCheck(_Parameters.EDATE_FROM) === true ? dayjs(new Date()).format('YYYY-MM-DD') : _Parameters.EDATE_FROM
  popupData.EDATE_TO = isNullCheck(_Parameters.EDATE_TO) === true ? dayjs().add(7, 'day').format('YYYY-MM-DD') : _Parameters.EDATE_TO
}

//팝업 시작
const openPopup = async data => {
  // console.log("내 권한 그룹 확인",userStore.authGrpCd)
  // console.log('grdMainProps.fields ::::: ><>>>> ',grdMainProps.fields)
  openRefresh()
  _Parameters = null
  _Parameters = data
  // console.log("파라미터(전역변수) 확인",_Parameters)
  initCodeList()
  initPage()

  if(!isNullCheck(_Parameters)){
    let searchParams = {
      CMPNY_DIV : _Parameters.CMPNY_DIV == null ? '' : _Parameters.CMPNY_DIV,
      YEAR : _Parameters.YEAR == null ? '' : _Parameters.YEAR,
      SCHEDULE_ID : _Parameters.SCHEDULE_ID == null ? '' : _Parameters.SCHEDULE_ID,
    }
    //<!--str => _Parameters.ORESULT_CUR-->
    await commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_01', param : searchParams }).then(res => {
      // console.log("메인 데이터 조회 결과 ::::>>>> ",res)
      if(res.ORESULT_CUR.length > 0){
        _Parameters = res.ORESULT_CUR[0]
        popupButtons1.value.setBtnProperty('btnDelete', 'visible', true) //삭제버튼
      }
      // console.log("메인데이터 조회 후",_Parameters)
      popupData.SEND_YN = _Parameters.SEND_YN
      popupData.DIVISION = _Parameters.DIVISION
      popupData.CURR_ID = _Parameters.CURR_ID
      popupData.MORGN_ID = _Parameters.MORGN_ID + _Parameters.MORGN_EMP_NO
      popupData.EDATE_FROM = isNullCheck(_Parameters.EDATE_FROM) === true ? dayjs(new Date()).format('YYYY-MM-DD') : _Parameters.EDATE_FROM
      popupData.EDATE_TO = isNullCheck(_Parameters.EDATE_TO) === true ? dayjs().add(7, 'day').format('YYYY-MM-DD') : _Parameters.EDATE_TO
      popupData.EDUPOSSIBLE_NUM = isNullCheck(_Parameters.EDUPOSSIBLE_NUM) === true ? '0' : _Parameters.EDUPOSSIBLE_NUM
      popupData.LEAD_TIME = _Parameters.LEAD_TIME
      _Parameters.SAVE_YN = isNullCheck(_Parameters.SCHEDULE_ID) === true ? 'N' : 'Y'

      if(popupData.DIVISION === 'T'){
        divisionChanged()
        if(!isNullCheck(_Parameters.WORK_STD_ID)){
          popupData.WORK_STD_NM = _Parameters.WORK_STD_ID
        }
      }
      if(isNullCheck(_Parameters.SCHEDULE_ID) === true){
        popupButtons2.value.disableBtn("btnSendSms", true)     //SMS발신 버튼
        popupButtons2.value.disableBtn("btnEduCopy", true)     //교육복사 버튼
      }else{  
        popupButtons2.value.disableBtn("btnSendSms", false)    //SMS발신 버튼
        popupButtons2.value.disableBtn("btnEduCopy", false)    //교육복사 버튼
      }

      if(_Parameters.MEDIA_CD_1 !== '' && _Parameters.MEDIA_CD_2 !== ''){
        popupData.VR_CATEGORY1 = _Parameters.MEDIA_CD_1
        popupData.VR_CATEGORY2 = _Parameters.MEDIA_CD_2

        visible.EDU_CONTENT = false     //교육내용
        visible.VR_CATEGORY1 = true     //교육내용1
        visible.VR_CATEGORY2 = true     //교육내용2
      }else{    
        visible.EDU_CONTENT = true      //교육내용
        visible.VR_CATEGORY1 = false    //교육내용1
        visible.VR_CATEGORY2 = false    //교육내용2
      }

      if(isNullCheck(_Parameters.ATTACH_KEY)){
        fileUpload.value.setGuid()
        _Parameters.ATTACH_KEY = fileUpload.value.guid
        fileUpload.value.clearGrid()
      }else{
        fileUpload.value.setGuid(_Parameters.ATTACH_KEY)
        fileUpload.value.onButtonsClick({ id: "btnSearch" })
      }
      let chkVR = checkVR(_Parameters)
      // console.log("chkVR",chkVR)

      if(chkVR){
        visible.EDU_CONTENT = false     //교육내용
        visible.VR_CATEGORY1 = true     //교육내용1
        visible.VR_CATEGORY2 = true     //교육내용2

        disable.EPLACE_DIV_YN = true    //교육장소 체크박스
        disable.EPLACE_DIV = true       //교육장소
        grdTime.value.getGridView().setColumnProperty('EPLACE_DIV', "readOnly", true) //교육장소 컬럼
      }else{
        visible.EDU_CONTENT = true      //교육내용
        visible.VR_CATEGORY1 = false    //교육내용1
        visible.VR_CATEGORY2 = false    //교육내용2

        disable.EPLACE_DIV_YN = false   //교육장소 체크박스
        disable.EPLACE_DIV = false      //교육장소

        grdTime.value.getGridView().setColumnProperty('EPLACE_DIV', "readOnly", false) //교육장소 컬럼
      }

      popupData.EDU_CONTENT =  _Parameters.EDU_CONTENT
      if(!isNullCheck(_Parameters.SCHEDULE_ID)){
        popupData.SCHEDULE_ID = _Parameters.SCHEDULE_ID

        //교육차수 조회
        searchEduSchedule() 
        if(grdEdu.value.getDataProvider().getRows().length > 0){
          grdEdu.value.getGridView().setFocus(0)
        }

        //저장된 대상자 목록 조회
        searchEduSavedTargetList()
        
        searchParams = {}
        searchParams.CMPNY_DIV = _Parameters.CMPNY_DIV
        searchParams.YEAR = _Parameters.YEAR
        searchParams.SCHEDULE_ID = _Parameters.SCHEDULE_ID
        commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_06', param : searchParams }).then(res => {
          // console.log("TAB01_POP01_SEARCH_06 조회 후",res)
        })
      }else if(isNullCheck(_Parameters.SCHEDULE_ID) && !isNullCheck(_REQ_ID.value)){
        _Parameters.DIVISION = _REQ_TABLE[0].DIVISION == null ? '' : _REQ_TABLE[0].DIVISION
        _Parameters.CURR_ID = _REQ_TABLE[0].CURR_ID == null ? '' : _REQ_TABLE[0].CURR_ID
        popupData.DIVISION = _Parameters.DIVISION
        popupData.CURR_ID = _Parameters.CURR_ID

        searchParams.CMPNY_DIV = _Parameters.DIVISION
        searchParams.YEAR = _Parameters.YEAR
        searchParams.SCHEDULE_ID = _Parameters.SCHEDULE_ID
        searchParams.REQ_ID = _REQ_ID.value

        commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_12', param : searchParams }).then(res => {
          // console.log("대상자 교육 그리드 조회 후 :::: >>>> ",res)
          TARGET_CNT.value = '대상자 목록 (총 ' + res.ORESULT_CUR.length + '명)'
          grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
        })
        
      }
      //교육 확정이면 수정 금지
      if(_Parameters.CON_DIV === 'Y' || _Parameters.APP_STATUS === 'Y'){
        setControlEnable(false)
      }else{
        setControlEnable(true)
      }

      popupData.CMPNY_DIV = _Parameters.CMPNY_DIV
      popupData.BSNS_CD = _Parameters.BSNS_CD
      popupData.DEPT_CD = _Parameters.DEPT_CD

      if(_Parameters.APP_STATUS === 'Y'){
        // console.log("앱스테이터스가 Y임")
        popupButtons2.value.disableBtn("btnUpdate", true) //저장
        disable.GROUP = true  //대상 그룹 선택
        disable.GROUP_BTN = true  //대상 그룹 조회 버튼
        grdMainButtons.value.disableBtn("btnTargetAdd", true)    //대상자 추가
        grdMainButtons.value.disableBtn("btnTargetDelete", true) //대상자 삭제
      }else{
        popupButtons2.value.disableBtn("btnUpdate", false)
      }
      dialog.value = true
    })
  }else{
    popupData.DIVISION = ''     //분류
    popupData.CURR_ID = ''      //교육명
    popupData.EDATE_FROM = ''   //교육기간(시작)
    popupData.EDATE_TO = ''     //교육기간(종료)
    popupData.LEAD_TIME = ''    //소요시간
    popupData.SCHEDULE_ID = ''  //일정 ID
    popupData.CMPNY_DIV = ''
    popupData.BSNS_CD = ''
    popupData.DEPT_CD = ''

    popupButtons2.value.disableBtn("btnEduCopy", true) //교육 복사 버튼
  }
  // 2024.07.25 박용훈 소속 이름 자동 필터 설정
  // 대상자 목록
  grdMain.value.getGridView().setColumnProperty("ASGN_NM", "autoFilter", true)
  grdMain.value.getGridView().setColumnProperty("TARGET_NM", "autoFilter", true)
}

//팝업 오픈 시 초기 설정
const initPage = () => {
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD : userStore.bsnsCd,
    DEPT_CD : userStore.deptCd,
    ASGN_CD : userStore.asgnCd,
    USER_DIV : userStore.userDiv,
  }
  // console.log("비지블 확인",visible.MORGN_DIV)
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_08', param : searchParams }).then(res => {
    // console.log("대상그룹선택 콤보박스 조회 결과 ::::>>>> ",res)
    codeList.group = []
    // res.ORESULT_CUR.forEach(val => {
    //   codeList.group.push({TXT : val.TXT, COD : val.COD})
    // })
  })
  disable.GROUP = true
  visible.MORGN_DIV = false   //주관부서
  visible.WORK_STD_NM = false //작업표준명
  popupButtons1.value.setBtnProperty('btnDelete', 'visible', false) //삭제
  grdMainButtons.value.setBtnProperty('btnCutOffTargetAdd', 'visible', false) //컷오프대상자조회
  grdMainButtons.value.setBtnProperty('btnAbsPersonAdd', 'visible', false)    //불참인원조회
  grdMainButtons.value.setBtnProperty('btnSOSRelPersSearch', 'visible', false)   //작업중지해지인원
  grdMainButtons.value.setBtnProperty('btnByDutyTargetAdd', 'visible', false) //직무별 대상자추가

  //QR코드는 안전 경영실만 보이도록
  // if(userStore.bsnsCd === 'AN00' || userStore.deptCd === 'C740' || userStore.deptCd === 'C5V0' ||
  //    userStore.bsnsCd === 'C630' || userStore.empNo === 'BP16992'){
      popupButtons2.value.setBtnProperty('btnQrCodePrint', 'visible', true)
  //}

}

//VR 교육체크 여부 확인
const checkVR = data => {
  let result = false
  let searchParams = {
    CMPNY_DIV : data.CMPNY_DIV,
    CURR_ID : data.CURR_ID
  }
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_16', param : searchParams }).then(res => {
    // console.log("교육체크 여부 확인 데이터 ::::>>>>",res)
    if(res.ORESULT_CUR.length > 0 && !isNullCheck(res.ORESULT_CUR[0])){
      if(res.ORESULT_CUR[0].MEDIA_YN === 'Y'){
        result = true
      }
    }
  })

  return result
}

//교육 차수 조회
const searchEduSchedule = () => {
  let searchParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
  }

  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_04', param : searchParams }).then(res => {
    // console.log("교육 차수 조회 :::: >>>>",res)
    grdEdu.value.getDataProvider().setRows(res.ORESULT_CUR)
    if(res.ORESULT_CUR.length > 0){
      grdEdu.value.getGridView().setFocus(0)
    }
  })
}

//저장된 대상자 목록 조회
const searchEduSavedTargetList = () => {
  let searchParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
  }

  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_07', param : searchParams }).then(res => {
    // console.log("07레스 확인",res)
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    TARGET_CNT.value ='대상자 목록 (총 ' + grdMain.value.getDataProvider().getRows().length + '명)' 
  }).finally(()=>{
    searchEduSchedule()
  })
}

//확정 되었을때 컨트롤 상태 변경
//확정일 경우 false, 미확정일 경우 true
const setControlEnable = blnYn => {
// console.log("blnYn :::::::: >>>>>>>>>>>>>",blnYn)
  if(blnYn){//미확정일 경우
  // console.log("미확정")
    popupButtons2.value.setBtnProperty('btnConfirm', 'visible', true)  //확정 버튼
    btnVisibleState.btnConfirm = true
  }else{//확정일 경우
  // console.log("확정")
    popupButtons2.value.setBtnProperty('btnConfirm', 'visible', false) //확정 버튼
    btnVisibleState.btnConfirm = false
  }
  //통보 버튼 확정되면 활성화
  popupButtons2.value.disableBtn("btnSendMail", blnYn)
  //QR출력 버튼 확정되면 활성화
  popupButtons2.value.disableBtn("btnQrCodePrint", blnYn)
  //모든 차수 적용 버튼
  grdTimeButtons1.value.disableBtn("btnAllNumApply", !blnYn)
}

//메인 버튼 이벤트
const onButtonsClick = async btn => {
  // console.log('작동 버튼 ',btn)
  if(btn.id === 'btnDelete'){//삭제
    if(keyStatus.value){
      // console.log('버튼 클릭 작동')
      onBtnDelete()
    }else{   
      // console.log('엔터 키 작동')
      keyStatus.value = true
    }
  } 
  else if(btn.id === 'btnQrCodePrint'){//QR코드출력
    onBtnQrCodePrint()
  }
  else if(btn.id === 'btnSendSms'){//SMS발신
    onBtnSendSms()
  }
  else if(btn.id === 'btnUpdate'){//저장
    onBtnSave(true)
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
  else if(btn.id === 'btnClose'){//닫기
  // console.log('닫기버튼 누름')
    let grdEduState = ''
    let grdTimeState = ''
    let grdMainState = ''
    let titleTxt = ''

    for(let i = 0; i < grdEdu.value.getDataProvider().getRows().length; i++){
      if(grdEdu.value.getDataProvider().getRowState(i) === 'created'){
        if(grdEdu.value.getRowData(i).SAVE_YN === 'Y'){
          continue
        }
        grdEduState = 'created'
        titleTxt = '교육 차수 그리드에서 수정되고 저장되지 않은 데이터가 존재합니다.\n저장 하시겠습니까?'
      }
    }
    for(let i = 0; i < grdTime.value.getDataProvider().getRows().length; i++){
      if(grdTime.value.getDataProvider().getRowState(i) === 'created'){
        grdTimeState = 'created'
        titleTxt = '일별 교시 상세 그리드에서 수정되고 저장되지 않은 데이터가 존재합니다.\n저장 하시겠습니까?'
      }
    }
    for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
      if(grdMain.value.getDataProvider().getRowState(i) === 'created'){
        grdMainState = 'created'
        titleTxt = '대상자 목록 그리드에서 수정되고 저장되지 않은 데이터가 존재합니다.\n저장 하시겠습니까?'
      }
    }
    let ck = ''
    if(grdEduState === 'created'){
      ck = await vm.$swal({ 
      title: titleTxt, 
      showCancelButton: true,
      })
      if(ck.isConfirmed === true){
        onBtnSave()
        return
      }
    }
    else if(grdTimeState === 'created'){
      ck = await vm.$swal({ 
      title: titleTxt, 
      showCancelButton: true,
      })
      if(ck.isConfirmed === true){
        onBtnSave()
        return
      }
    }
    else if(grdMainState === 'created'){
      ck = await vm.$swal({ 
      title: titleTxt, 
      showCancelButton: true,
      })
      if(ck.isConfirmed === true){
        onBtnSave()
        return
      }
    }
    grdEduFocusedRowIdx.value = null
    grdTimeFocusedRowIdx.value = null
    emit('onClose', '')
    dialog.value = false
  }
}

//교육차수 버튼 이벤트
const onEduButtonsClick = btn => {
  if(btn.id === 'btnCreate'){//추가
    onEduBtnCreate()
  }
  else if(btn.id === 'btnDelete'){//삭제
    onEduBtnDelete()
  }
  else if(btn.id === 'btnPointListPrint'){//대상자 목록 출력
    onEduBtnPointListPrint()
  }
  else if(btn.id === 'btnAutoAddNum'){// 차수 자동추가
    onEduBtnAutoAddNum()
  }
}

//일별 교시 상세 버튼 이벤트
const onTimeButtonsClick = btn => {
  if(btn.id === 'btnAllTimeSearch'){//전체 차시 조회
    onTimeBtnAllTimeSearch()
  }
  else if(btn.id === 'btnAllNumApply'){//모든 차수 적용
    onTimeBtnAllNumApply()
  }
  else if(btn.id === 'btnSearch'){//조회
    onTimeBtnSearch()     
  }     
  else if(btn.id === 'btnCreate'){//추가
    onTimeBtnCreate()     
  }     
  else if(btn.id === 'btnDelete'){//삭제
    onTimeBtnDelete()
  }
  else if(btn.id === 'btnAllApply'){//모두 적용
    onTimeBtnAllApply()
  }
}

//분류 변경 이벤트
const divisionChanged = () => {
  if(popupData.DIVISION === 'T'){
    visible.WORK_STD_NM = true
    labelWidthes.division = '61px'
    labelWidthes.currId = '61px'
    labelWidthes.eDate = '61px'
  }else{
    visible.WORK_STD_NM = false
    labelWidthes.division = '54px'
    labelWidthes.currId = '54px'
    labelWidthes.eDate = '54px'
  }
}

//작업표준명 버튼 클릭 시 이벤트
const workStdNmClick = () => {
  eDUAB0030Tab01Pop01Pop11.value.openPopup()
}

//정기위험성 평가 팝업 데이터 선택 후
const onWorkStdNmSelect = (data) => {
// console.log("선택한 데이터 확인",data)
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
// console.log("작업표준ID :::: ",popupData.WORK_STD_ID)
// console.log("작업표준명 :::: ",popupData.WORK_STD_NM)
}

//교육명 변경 이벤트
const currIdChanged = () => {
  codeList.currId.forEach(val => {
    if(popupData.CURR_ID === val.COD){
    // console.log("교육명 val",val)
      popupData.LINK_CODE = val.LINK_CODE
      popupData.CURR_NM = val.TXT
      popupData.AGE = val.AGE_RESTRICTION === null ? 0 : val.AGE_RESTRICTION
    }
    if(popupData.CURR_ID === 'C243'){//법정-신규입사자 법정안전보건교육(채용시교육)일 경우 SMS발신 및 통보 비활성화 => EMP_NO가 없음
      popupButtons2.value.disableBtn("btnSendSms", true)      //SMS발신
      popupButtons2.value.disableBtn("btnSendMail", true)      //통보
    }else{
      if(isNullCheck(_Parameters.SCHEDULE_ID)){
        popupButtons2.value.disableBtn("btnSendSms", true)      //SMS발신
        popupButtons2.value.disableBtn("btnSendMail", true)       //통보
      }else{
        popupButtons2.value.disableBtn("btnSendSms", false)      //SMS발신
        popupButtons2.value.disableBtn("btnSendMail", false)      //통보
      }
    }
  })

  grdMainButtons.value.setBtnProperty('btnByDutyTargetAdd', 'visible', false)  //직무별 대상자 추가 버튼
// console.log("링크코드",popupData.LINK_CODE)
// console.log("교육아이디",popupData.CURR_ID)

  let chkVR = checkVR(_Parameters)
// console.log("체크 VR",chkVR)
  if(chkVR){
    visible.EDU_CONTENT = false //교육내용
    visible.VR_CATEGORY1 = true //교육내용1
    visible.VR_CATEGORY2 = true //교육내용2

    //교육장소 선택
    disable.EPLACE_DIV_YN = true
    //안전교육장 구분
    disable.EPLACE_DIV = true
    //그리드-교육장소-구분
    grdTime.value.getGridView().setColumnProperty('EPLACE_DIV', "readOnly", true)
  }else{
    visible.EDU_CONTENT = true   //교육내용
    visible.VR_CATEGORY1 = false //교육내용1
    visible.VR_CATEGORY2 = false //교육내용2

    //교육장소 선택
    disable.EPLACE_DIV_YN = false
    //안전교육장 구분
    disable.EPLACE_DIV = false
    //그리드-교육장소-구분
    grdTime.value.getGridView().setColumnProperty('EPLACE_DIV', "readOnly", false)
  }
// console.log("popupData.LINK_CODE",popupData.LINK_CODE)
// console.log("popupData.CURR_ID",popupData.CURR_ID)
  if(popupData.LINK_CODE === '04'){
    grdMainButtons.value.disableBtn("btnTargetAdd", false) //대상자 추가 버튼
    disable.GROUP = false      //대상그룹선택
    disable.GROUP_BTN = false  //대상그룹조회 버튼

    grdMainButtons.value.setBtnProperty('btnCutOffTargetAdd', 'visible', true)  //컷오프 대상자 추가 버튼
    grdMainButtons.value.setBtnProperty('btnAbsPersonAdd', 'visible', false)    //불참인원 추가 버튼
    grdMainButtons.value.setBtnProperty('btnSOSRelPersSearch', 'visible', false)   //작업중지 해제인원 조회 버튼
    grdMainButtons.value.setBtnProperty('btnCutOffTargetAdd', 'text', '컷오프 대상자 추가')
  }
  else if(popupData.LINK_CODE === '07'){  
    grdMainButtons.value.disableBtn("btnTargetAdd", true) //대상자 추가 버튼
    disable.GROUP = true      //대상그룹선택
    disable.GROUP_BTN = true  //대상그룹조회 버튼

    grdMainButtons.value.setBtnProperty('btnCutOffTargetAdd', 'visible', true)  //컷오프 대상자 추가 버튼
    grdMainButtons.value.setBtnProperty('btnAbsPersonAdd', 'visible', false)    //불참인원 추가 버튼
    grdMainButtons.value.setBtnProperty('btnSOSRelPersSearch', 'visible', false)   //작업중지 해제인원 조회 버튼
    grdMainButtons.value.setBtnProperty('btnCutOffTargetAdd', 'text', '교육대상조회')
  }
  else if(popupData.LINK_CODE === '08'){
    grdMainButtons.value.disableBtn("btnTargetAdd", false)    //대상자 추가 버튼
    grdMainButtons.value.setBtnProperty('btnByDutyTargetAdd', 'visible', true)  //직무별 대상자 추가 버튼
    grdMainButtons.value.setBtnProperty('btnSOSRelPersSearch', 'visible', false)   //작업중지 해제인원 조회 버튼
  }
  else{
    if(popupData.CURR_ID === 'C179'){
      grdMainButtons.value.disableBtn("btnTargetAdd", false) //대상자 추가 버튼
      disable.GROUP = false     //대상그룹선택
      disable.GROUP_BTN = false //대상그룹조회 버튼
      grdMainButtons.value.setBtnProperty('btnCutOffTargetAdd', 'visible', true)  //컷오프 대상자 추가 버튼
      grdMainButtons.value.setBtnProperty('btnAbsPersonAdd', 'visible', true)     //불참인원 추가 버튼
      grdMainButtons.value.setBtnProperty('btnSOSRelPersSearch', 'visible', true)    //작업중지 해제인원 조회 버튼
      grdMainButtons.value.setBtnProperty('btnCutOffTargetAdd', 'text', '일자별 대상자 추가')
    }
    else if(popupData.CURR_ID === 'C120' || popupData.CURR_ID === 'C227'){
      grdMainButtons.value.disableBtn("btnTargetAdd", true) //대상자 추가 버튼
      disable.GROUP = true     //대상그룹선택
      disable.GROUP_BTN = true //대상그룹조회 버튼
      grdMainButtons.value.setBtnProperty('btnCutOffTargetAdd', 'visible', true)  //컷오프 대상자 추가 버튼
      grdMainButtons.value.setBtnProperty('btnAbsPersonAdd', 'visible', false)    //불참인원 추가 버튼
      grdMainButtons.value.setBtnProperty('btnSOSRelPersSearch', 'visible', false)   //작업중지 해제인원 조회 버튼
      grdMainButtons.value.setBtnProperty('btnCutOffTargetAdd', 'text', '단기 공사 교육 대상')
    }
    else{
      grdMainButtons.value.disableBtn("btnTargetAdd", false)    //대상자 추가 버튼
      grdMainButtons.value.disableBtn("btnTargetDelete", false) //대상자 삭제 버튼
      disable.GROUP = false     //대상그룹선택
      disable.GROUP_BTN = false //대상그룹조회 버튼
      grdMainButtons.value.setBtnProperty('btnCutOffTargetAdd', 'visible', false) //컷오프 대상자 추가 버튼
      grdMainButtons.value.setBtnProperty('btnAbsPersonAdd', 'visible', false)    //불참인원 추가 버튼
      grdMainButtons.value.setBtnProperty('btnSOSRelPersSearch', 'visible', false)   //작업중지 해제인원 조회 버튼
    }
  }
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().commit()
  makeMainGrid(popupData.CURR_ID, popupData.LINK_CODE)
  
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

// 기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const dateFrChanged = data => {
  if(isNullCheck(data.target.value)){
    return
  }
  if(data.target.value > popupData.EDATE_TO){
    popupData.EDATE_TO = popupData.EDATE_FROM
    Message.warn(t('종료일은 시작일보다 낮을 수 없으므로 동일한 값으로 수정하였습니다.'))
  }
}

// 기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const dateToChanged = data => {
  if(isNullCheck(data.target.value)){
    return
  }
  if(data.target.value < popupData.EDATE_FROM){
    popupData.EDATE_FROM = popupData.EDATE_TO
    Message.warn(t('시작일은 종료일보다 높을 수 없으므로 동일한 값으로 수정하였습니다.'))
  }
}


//널 체크 이벤트
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}

// 2024.08.05 박용훈 추가
//널값체크후 숫자 리턴
const isNullCheck2 = val => {
  return (val === undefined || val === null || val === '') ? 0 : Number(val)
}

//*******************************************************************************************************************************/
//************************************************이벤트 영역(종료)**************************************************************/
//*******************************************************************************************************************************/

//*******************************************************************************************************************************/
//***************************************************메인팝업 영역***************************************************************/
//*******************************************************************************************************************************/
//삭제 버튼 클릭 이벤트
const onBtnDelete = async () => {
// console.log("삭제 전 전역변수 확인하기 ",_Parameters)
  if(isNullCheck(popupData.SCHEDULE_ID)){
    Message.warn('저장되지 않은 교육 일정입니다.')
    return
  }
  let ck = ''
  ck = await vm.$swal({ 
  title: t('선택된 데이터를 삭제하시겠습니까?'), 
  showCancelButton: true,
  })
  if(ck.isConfirmed === false){
    return
  }
  
  let deleteParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    USER_ID : userStore.empNo,
    AUTH_GRP_CD : AUTH_GRP_CD.value
  }
// console.log("삭제할 파람",deleteParams)

  await commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP01_DELETE_01', list: [deleteParams] }).then(() => {
    openRefresh()
    Object.keys(_Parameters).forEach(key => {
      _Parameters[key] = ''
    })
    popupData.EDATE_FROM = dayjs(new Date()).format('YYYY-MM-DD')
    popupData.EDATE_TO = dayjs().add(7, 'day').format('YYYY-MM-DD')    
    _Parameters.CMPNY_DIV = userStore.cmpnyDiv
    _Parameters.YEAR = dayjs(new Date()).format('YYYY')
    _Parameters.EDU_DIV = 'A'
    _Parameters.SAVE_YN = 'N'

  // console.log("삭제후 전역변수 확인",_Parameters)
    Message.success(t('데이터 삭제가 완료되었습니다.'))
    popupButtons1.value.setBtnProperty('btnDelete', 'visible', false)
  })
  openRefresh()
}

//QR코드 출력 버튼 클릭 이벤트
const onBtnQrCodePrint = async () => {
  
// console.log("printParams.value ",printParams.value )
  reportName.value = '/manage/hse/EDUAB0030_TAB01_POP01_03.ozr'

  let sTITLE = _Parameters.LECTURER_ID.substr(0,4) + '년 ' + popupData.CURR_NM 
  let sEDATE_FROM = isNullCheck(_Parameters.EDATE_FROM) === true ? '' : _Parameters.EDATE_FROM
  let sEDATE_TO = isNullCheck(_Parameters.EDATE_TO) === true ? '' : _Parameters.EDATE_TO
  let sEDU_DATE = ''
  let sURL = ''
  // 2024.07.22 박용훈 필요 없는 부분 주석
  // sURL += 'https://hse.hhi.co.kr/Pages/WD/DC1040W.aspx?'
  // sURL += 'CMPNY_DIV=' + _Parameters.cmpnyDiv +
  //         '&SCHEDULE_ID=' + _Parameters.SCHEDULE_ID +
  //         '&YEAR=' + _Parameters.YEAR


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
// console.log('에스타이틀',sTITLE)
// console.log('에스에듀데이트',sEDU_DATE)
// console.log('에스유알엘',sURL)
  showOz.value = true
}

//SMS발송 버튼 클릭 이벤트
const onBtnSendSms = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  let rowLength = grdMain.value.getGridView().getCheckedRows().length
  let grdMainData = ''
  let temp = []
  console.log('checkedRows',checkedRows)

  for(let i = 0; i < checkedRows.length; i++){
    temp.push(grdMain.value.getRowData(checkedRows[i])) 
   
  }
  console.log('temp',temp)
  for(let i = 0; i < checkedRows.length; i++){
    
    if(grdMainData === ''){
      grdMainData = grdMain.value.getRowData(checkedRows[i]).TARGET_ID
    }else{
      grdMainData += ';' + grdMain.value.getRowData(checkedRows[i]).TARGET_ID
    }
  }

  let parts = grdMainData.split(';')
  let result = []
  if(rowLength > 100){
    // 100번째마다 분리하여 배열에 추가
    for (let i = 0; i < checkedRows.length; i += 100) {
        let subset = parts.slice(i, i + 100).join(';');
        result.push(subset);
    }
  }
  

// console.log("샌드팝업 보낼 타겟 아이디들",grdMainData)
  if(isNullCheck(grdMainData)){
    Message.warn(t('메세지를 전송할 데이터를 선택해 주세요.'))
    return
  }
  if(rowLength > 100){
    sendSMSPopup.value.openPopup({grdMainData: result, TYPE: 'EDU', ROWS: rowLength}, false)
  } else{
    sendSMSPopup.value.openPopup(grdMainData, false)
  }
  
}

//저장 버튼 클릭 이벤트
const onBtnSave = async showMessage => {

  if(isNullCheck(popupData.DIVISION)){
    Message.warn(t('분류는 필수 입력 항목입니다.'))
    return
  }

  if(isNullCheck(popupData.CURR_ID)){
    Message.warn(t('교육과정(교육명)은 필수 입력 항목입니다.'))
    return
  }

  //console.log('userStore.authGrpCd', userStore.authGrpCd)
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

  let iLEAD_TIME = 0
  iLEAD_TIME = popupData.LEAD_TIME === '' ? 0 : Number(popupData.LEAD_TIME)
  if(iLEAD_TIME === 0){
    Message.warn(t('소요시간은 필수 입력 항목입니다.'))
    return
  }

  if(isNullCheck(popupData.EDU_CONTENT) && visible.EDU_CONTENT === true){
    Message.warn(t('교육내용은 필수 입력 항목입니다.'))
    return
  }

  let grdTimeCheckedRows = grdTime.value.getGridView().getCheckedRows()
  let grdTimeReqChk = []
  for(let i = 0; i < grdTimeCheckedRows.length; i++){
    grdTimeReqChk.push(grdTime.value.getRowData(grdTimeCheckedRows[i]))
  // console.log("grdTimeReqChk",grdTimeReqChk)
    if(isNullCheck(grdTimeReqChk[i].EDU_TIME) || isNullCheck(grdTimeReqChk[i].EDU_TIME_FN) ||
       isNullCheck(grdTimeReqChk[i].EPLACE_ETC) || isNullCheck(grdTimeReqChk[i].LECTURER_NM)){
      Message.warn(t('시작, 종료, 장소, 강사명은 필수 입력입니다.'))
      return
    }
    if(grdTimeReqChk[i].LEAD_TIME < 0){
      Message.warn(t('교육 종료 시각이 교육 시작 시각보다 이전 시각입니다.'))
      return
    }
  }

  if(showMessage){
    let ck = ''
    ck = await vm.$swal({ 
    title: t('교육 일정 정보를 저장 하시겠습니까?'), 
    showCancelButton: true,
    })
    if(ck.isConfirmed === false){
      console.log('취소')
      return
    }
  }
  if(grdEdu.value.getDataProvider().getRows().length <= 0){
    Message.warn(t('교육 차수가 하나 이상 입력이 되어야 합니다.'))
    return
  }

  if(grdTime.value.getDataProvider().getRows().length <= 0){
    Message.warn(t('일별 교시가 하나 이상 입력이 되어야 합니다.'))
    return
  }

  if(checkVR(_Parameters) && isNullCheck(popupData.VR_CATEGORY1) && isNullCheck(popupData.VR_CATEGORY2)){
    Message.warn(t('VR강의를 선택해주세요.'))
    return
  }

  if(!isNullCheck(popupData.VR_CATEGORY1) && !isNullCheck(popupData.VR_CATEGORY2) && popupData.VR_CATEGORY1 == popupData.VR_CATEGORY2){
    Message.warn(t('같은 강의를 선택할 수 없습니다.'))
    return
  }

  await SetSaveDataToDataTable()

  let dt = _.cloneDeep(_Parameters)
  dt.USER_ID = userStore.empNo
  dt.REQ_ID = ''

  let sqlID = 'EDUAB0030_TAB01_POP01_SAVE_01'
  if(!isNullCheck(_REQ_ID.value)){
    dt.REQ_ID = _REQ_ID.value
    sqlID = 'EDUAB0030_TAB01_POP01_SAVE_07'
  }

  dt.EDATE_FROM = dayjs(dt.EDATE_FROM).format('YYYYMMDD')
  dt.EDATE_TO =  dayjs(dt.EDATE_TO).format('YYYYMMDD')

// console.log("sqlID = ",sqlID)
// console.log("저장될 데이터 확인",dt)
  await commonExecuteApi({ queryId : sqlID, list: [dt] }).then(res => {
  // console.log("첫번째 res :::: >>>>",res)
    dt.SCHEDULE_ID = res.list[0].OUT_RES_SCHEDULE_ID
    _Parameters.SCHEDULE_ID = isNullCheck(dt.SCHEDULE_ID) === true ? '' : dt.SCHEDULE_ID
    _Parameters.SCHEDULE_ID = _Parameters.SCHEDULE_ID
    popupData.SCHEDULE_ID = _Parameters.SCHEDULE_ID

    //삭제버튼 보이게
    popupButtons1.value.setBtnProperty('btnDelete', 'visible', true)
  })

  /////////////////////////////////////////////////////////////////////////////////////
  // 확정 전에는 그리드의 모든 데이터 저장, 확정 후에는 선택된 행만 저장
  /////////////////////////////////////////////////////////////////////////////////////
  let eduCheckedRows = grdEdu.value.getGridView().getCheckedRows()
  let timeCheckedRows = grdTime.value.getGridView().getCheckedRows()
  let mainCheckedRows = grdMain.value.getGridView().getCheckedRows()

  let eduSaveDataRows = []//교육차수
  let timeSaveDataRows =[]//일별교시상세
  let mainSaveDataRows = []//메인그리드
  if(btnVisibleState.btnConfirm === true){
    if(grdEdu.value.getDataProvider().getRows().length > 0){
      for(let i = 0; i < grdEdu.value.getDataProvider().getRows().length; i++){
        eduSaveDataRows.push(grdEdu.value.getRowData(i))
        eduSaveDataRows[i].SCHEDULE_ID = _Parameters.SCHEDULE_ID
        eduSaveDataRows[i].EDU_DATE = dayjs(eduSaveDataRows[i].EDU_DATE).format('YYYYMMDD')
        eduSaveDataRows[i].EDU_DATE_END = dayjs(eduSaveDataRows[i].EDU_DATE_END).format('YYYYMMDD')

        grdEdu.value.getGridView().setValues(i, {SCHEDULE_ID : _Parameters.SCHEDULE_ID}, true)
        
      }
    }
    if(grdTime.value.getDataProvider().getRows().length > 0){
      for(let i = 0; i < grdTime.value.getDataProvider().getRows().length; i++){
        timeSaveDataRows.push(grdTime.value.getRowData(i))
        timeSaveDataRows[i].SCHEDULE_ID = _Parameters.SCHEDULE_ID
        timeSaveDataRows[i].EDU_DATE = dayjs(timeSaveDataRows[i].EDU_DATE).format('YYYYMMDD')
        grdTime.value.getGridView().setValues(i, {SCHEDULE_ID : _Parameters.SCHEDULE_ID}, true)
      }
    }
    if(grdMain.value.getDataProvider().getRows().length > 0){
      for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
        mainSaveDataRows.push(grdMain.value.getRowData(i))
      // console.log("파라미터 스케줄아이디",_Parameters.SCHEDULE_ID)
        mainSaveDataRows[i].SCHEDULE_ID = _Parameters.SCHEDULE_ID
        mainSaveDataRows[i].YEAR = !isNullCheck(_Parameters.YEAR) ? _Parameters.YEAR : dayjs(new Date()).format('YYYY')
        grdMain.value.getGridView().setValues(i, {SCHEDULE_ID : _Parameters.SCHEDULE_ID}, true)
      }
    }
  }else{
    if(grdEdu.value.getDataProvider().getRows().length > 0){   
      for(let i = 0; i < eduCheckedRows.length; i++){
          eduSaveDataRows.push(grdEdu.value.getDataProvider().getJsonRow(eduCheckedRows[i]))
          eduSaveDataRows[i].SCHEDULE_ID = _Parameters.SCHEDULE_ID
          eduSaveDataRows[i].USER_ID = userStore.userId
          eduSaveDataRows[i].EDU_DATE = dayjs(eduSaveDataRows[i].EDU_DATE).format('YYYYMMDD')
          eduSaveDataRows[i].EDU_DATE_END = dayjs(eduSaveDataRows[i].EDU_DATE_END).format('YYYYMMDD')

          grdEdu.value.getGridView().setValues(i, {SCHEDULE_ID : _Parameters.SCHEDULE_ID}, true)
      }
    }
    if(grdTime.value.getDataProvider().getRows().length > 0){        
      for(let i = 0; i < timeCheckedRows.length; i++){
        timeSaveDataRows.push(grdTime.value.getDataProvider().getJsonRow(timeCheckedRows[i]))
        timeSaveDataRows[i].SCHEDULE_ID = _Parameters.SCHEDULE_ID
        timeSaveDataRows[i].EDU_DATE = dayjs(timeSaveDataRows[i].EDU_DATE).format('YYYYMMDD')

        grdTime.value.getGridView().setValues(i, {SCHEDULE_ID : _Parameters.SCHEDULE_ID}, true)
      }
    }
    if(grdMain.value.getDataProvider().getRows().length > 0){        
      for(let i = 0; i < mainCheckedRows.length; i++){
        mainSaveDataRows.push(grdMain.value.getDataProvider().getJsonRow(mainCheckedRows[i]))
        mainSaveDataRows[i].SCHEDULE_ID = _Parameters.SCHEDULE_ID

        grdMain.value.getGridView().setValues(i, {SCHEDULE_ID : _Parameters.SCHEDULE_ID}, true)
      }
    }
  }


// console.log("eduSaveDataRows",eduSaveDataRows)
// console.log("timeSaveDataRows",timeSaveDataRows)
// console.log("mainSaveDataRows",mainSaveDataRows)

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

      await commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_18', param : liceSearchParams }).then(res2 => {
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

  //교육 차수와 교육 대상자, 교육 차시 그리드에 저장 할 사항이 없으면 저장 완료 메세지를 띄운다.
  if(eduSaveDataRows.length <= 0 && timeSaveDataRows.length <= 0 && mainSaveDataRows.length <= 0){
    Message.success(t('저장되었습니다'))
    return true
  }

  //교육 차수 저장
  if(eduSaveDataRows.length > 0){
    // console.log("저장할 에듀 데이터 확인 ", eduSaveDataRows)
      await commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP01_SAVE_03', list: eduSaveDataRows }).then(res => {
      // console.log("'EDUAB0030_TAB01_POP01_SAVE_03 저장 후 :::: >>>>", res)
        for(let i = 0; i < grdEdu.value.getDataProvider().getRows().length; i++){
          grdEdu.value.getGridView().setValues(i, {SAVE_YN : 'Y'}, true)
          grdEdu.value.getGridView().checkAll(false)
          grdEdu.value.getDataProvider().setRowState(i, 'none')
        }
      })
  }

  //교육 대상자 저장
  if(mainSaveDataRows.length > 0){
      if(popupData.CURR_ID === 'C120' || popupData.CURR_ID === 'C227'){
      // console.log("이프문!!!!@!@!")
        await commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP01_SAVE_02', list: mainSaveDataRows }).then(res => {
        // console.log("'EDUAB0030_TAB01_POP01_SAVE_02 저장 후 :::: >>>>", res)
          grdMain.value.getGridView().checkAll(false)
        }).then(() => {
          searchEduSavedTargetList()
        })
      }else{
        await commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP01_SAVE_02A', list: mainSaveDataRows }).then(res => {
        // console.log("'EDUAB0030_TAB01_POP01_SAVE_02A 저장 후 :::: >>>>", res)
          grdMain.value.getGridView().checkAll(false)
        }).then(() => {
          searchEduSavedTargetList()
        })
        
      }
  }

  //일별 교시 상세 저장
  if(timeSaveDataRows.length > 0){
    await commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP01_SAVE_05', list: timeSaveDataRows }).then(res => {
    // console.log("'EDUAB0030_TAB01_POP01_SAVE_05 저장 후 :::: >>>>", res)
      grdTime.value.getGridView().checkAll(false)
    })
    onTimeBtnSearch()
  }

  popupButtons2.value.disableBtn("btnSendSms", false)   //SMS발신 버튼
  popupButtons2.value.disableBtn("btnEduCopy", false)   //교육복사 버튼

  // MSDS교육대상 자재관리에 SCHEDULE_ID 업데이트
  emit('saveSchedule', dt)

  Message.success(t('저장되었습니다.'))
  return true
}

const SetSaveDataToDataTable = () => {
  if(isNullCheck(_Parameters)){
    Message.warn(t('교육일정 MASTER 정보 생성에 실패했습니다.'))
    return
  }

  let dr = _Parameters
  if(!isNullCheck(dr)){
    dr.DIVISION = popupData.DIVISION
    dr.CURR_ID = popupData.CURR_ID
    dr.EDU_TITLE = ''
    dr.MORGN_ID = isNullCheck(dr.MORGN_ID) !== true ? dr.MORGN_ID : userStore.deptCd
    dr.MORGN_EMP_NO = isNullCheck(dr.MORGN_EMP_NO) !== true ? dr.MORGN_EMP_NO : userStore.empNo
    dr.MORGN_BSNSCD = isNullCheck(dr.MORGN_BSNSCD) !== true ? dr.MORGN_BSNSCD : userStore.bsnsCd
    dr.MORGN_DEPTCD = isNullCheck(dr.MORGN_DEPTCD) !== true ? dr.MORGN_DEPTCD : userStore.deptCd
    dr.MORGN_DEPTNM = isNullCheck(dr.MORGN_DEPTNM) !== true ? dr.MORGN_DEPTNM : userStore.deptNm
    dr.WORK_STD_ID = isNullCheck(dr.WORK_STD_ID) !== true ? dr.WORK_STD_ID : popupData.WORK_STD_ID
    dr.WORK_STD_NM = isNullCheck(dr.WORK_STD_NM) !== true ? dr.WORK_STD_NM : popupData.WORK_STD_NM
    dr.SCHEDULE_ID = _Parameters.SCHEDULE_ID
    dr.EDUPOSSIBLE_NUM = isNullCheck(popupData.EDUPOSSIBLE_NUM) === true ? '0' : popupData.EDUPOSSIBLE_NUM
    dr.EDATE_FROM = isNullCheck(popupData.EDATE_FROM) === true ? '' : dayjs(popupData.EDATE_FROM).format('YYYY-MM-DD')
    dr.EDATE_TO = isNullCheck(popupData.EDATE_TO) === true ? '' : dayjs(popupData.EDATE_TO).format('YYYY-MM-DD')
    dr.LEAD_TIME = popupData.LEAD_TIME
    dr.MEDIA_CD_1 = popupData.VR_CATEGORY1
    dr.MEDIA_CD_2 = popupData.VR_CATEGORY2
    dr.EDU_DIV = 'A'
    dr.EDU_CONTENT = isNullCheck(popupData.EDU_CONTENT) === true ? '' : popupData.EDU_CONTENT
    dr.SEND_YN = popupData.SEND_YN
    dr.SAVE_YN = _Parameters.SAVE_YN 
  }
}

//확정 버튼 클릭 이벤트
const onBtnConfirm = async () => {
  //확정 시 먼저 저장하고 확정처리

  if(!onBtnSave(false)){
    return
  }

  let ck = ''
  ck = await vm.$swal({ 
  title: t('선택된 대상자에 대해 선택한 교육 차수로 일괄 설정됩니다. \n 설정하시겠습니까?'), 
  showCancelButton: true,
  })
  if(ck.isConfirmed === false){
    return
  }

  let grdEduLength =  grdEdu.value.getDataProvider().getRows().length
  let grdEduDataRows = []
  let result = true
  let msg = ''
  for(let i = 0; i < grdEduLength; i++){
    grdEduDataRows.push(grdEdu.value.getRowData(i))
  }
// console.log("grdEduDataRow 확정전 확인",grdEduDataRows)

  for(let i = 0; i < grdEduDataRows.length ; i++){
    let searchParams = {
      CMPNY_DIV : userStore.cmpnyDiv,
      YEAR : grdEduDataRows[i].YEAR,
      SCHEDULE_ID : grdEduDataRows[i].SCHEDULE_ID,
      EDUTIME_SERIAL : grdEduDataRows[i].EDUTIME_SERIAL
    }
    await commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_11', param : searchParams }).then(res =>{ 
    // console.log("확정전 일별 교시 상세 데이터 확인",res)
      
      if(res.ORESULT_CUR.length < 1){
        result = false
        msg='교육차수의 차수가 ' + grdEduDataRows[i].EDUTIME_SERIAL + '인 데이터의 일별 교시 상세 데이터가 없습니다.'
      } 
    })
  }
// console.log("리절트 상황",result)
  if(await !result){
    ck = await vm.$swal({ 
      title: msg, 
      })
    return
  }

  let saveParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    USER_ID : userStore.empNo
  }
// console.log("확정 전 파람",saveParams)
  commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP01_SAVE_04', list: [saveParams] }).then(res => {
  // console.log("확정 후 RES :::: >>>>", res)
    _Parameters.CON_DIV = 'Y'
    setControlEnable(false)
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

  // console.log("샌드메일타겟")
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  let EMP_NO = []
  let EMP_NM = []
  for(let i = 0; i < checkedRows.length; i++) {
    // 2024.07.22 박용훈 메일 발송시 아이디가 아니라 메일 주소를 넣어야 되서 수정함.
    //EMP_NO.push(grdMain.value.getRowData(checkedRows[i]).TARGET_ID)
    // 2025.09.09 메일 발송시 메일 수신 주소가 없으면 오류 발생하여 메일 주소 null 값이면 제외
    if (!isNullCheck(grdMain.value.getRowData(checkedRows[i]).EMAIL)){
      EMP_NO.push(grdMain.value.getRowData(checkedRows[i]).EMAIL)
      EMP_NM.push(grdMain.value.getRowData(checkedRows[i]).TARGET_NM)
    }
  }
// console.log("이엠피엔오",EMP_NO)
// console.log("이엠피엔엠",EMP_NM)
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

  grdMain.value.getDataProvider().setRows([])
  TARGET_CNT.value = '대상자 목록 (총 0명)'

  let grdEduValues = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    SAVE_YN : 'N',
    EDU_TARGET_CNT : ''
  }

  let grdTimeValues = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
  }
  for(let i = 0; i < grdEdu.value.getDataProvider().getRows().length; i++){
    grdEdu.value.getGridView().setValues(i, grdEduValues, true)
  }
  grdEdu.value.getGridView().checkAll(true)

  for(let i = 0; i < grdTime.value.getDataProvider().getRows().length; i++){
    grdEdu.value.getGridView().setValues(i, grdTimeValues, true)
  }
  grdTime.value.getGridView().checkAll(true)

  popupButtons1.value.setBtnProperty('btnDelete', 'visible', false) //삭제
  popupButtons2.value.disableBtn("btnQrCodePrint", true)  //QR코드출력
  popupButtons2.value.disableBtn("btnSendSms", true)      //SMS발신
  popupButtons2.value.disableBtn("btnSendMail", true)       //통보
  popupButtons2.value.setBtnProperty('btnConfirm', 'visible', true) //확정
}

//*******************************************************************************************************************************/
//************************************************메인팝업 영역(종료)***********************************************************/
//*******************************************************************************************************************************/

//*******************************************************************************************************************************/
//***************************************************교육차수 영역**************************************************************/
//*******************************************************************************************************************************/
//교육차수 추가 이벤트
const onEduBtnCreate = () => {
  // console.log("교육추가시 파라미터 확인",_Parameters)
    let rowCount = grdEdu.value.getDataProvider().getRows().length
    let newRow = {
      CMPNY_DIV : userStore.cmpnyDiv,
      YEAR : _Parameters.YEAR,
      SCHEDULE_ID : _Parameters.SCHEDULE_ID,
      EDUTIME_SERIAL: '1', 
      EDU_DATE:popupData.EDATE_FROM, 
      EDU_DATE_END: popupData.EDATE_TO, 
      EDU_TARGET_CNT: '',
      SETEACH : '설정',
      SAVE_YN : 'N'
    }

    let grdEduDataRows = []
    if(rowCount > 0){
      for(let i = 0; i < rowCount; i++){
        grdEduDataRows.push(grdEdu.value.getRowData(i))
      }
    }
    let serialNum = 0
    grdEduDataRows.forEach(val => {
      if(Number(serialNum) <= Number(val.EDUTIME_SERIAL)){
        serialNum = Number(val.EDUTIME_SERIAL) + 1
      }
      newRow.EDUTIME_SERIAL = serialNum
    })
  // console.log("grdEduDataRows확인",grdEduDataRows)
  // console.log("뉴로우 확인",newRow)

    grdEdu.value.addRow(newRow)
    // grdEduFocusCell.value = grdEdu.value.getGridView().getCurrent()
    // console.log("포커스셀 확인",grdEduFocusCell.value)
}

//교육차수 선택된 데이터 대상설정 이벤트
const eduGrdBtnClick = async (grid, index, clickData) => {
// console.log("클릭 데이터 확인",clickData)
  if(clickData.cellType === 'data' && clickData.column === 'SETEACH'){
    let ck = ''
    ck = await vm.$swal({ 
    title: t('선택된 대상자에 대해 선택한 교육 차수로 일괄 설정됩니다. \n 설정하시겠습니까?'), 
    showCancelButton: true,
    })
    if(ck.isConfirmed === true){
      let rowCount = grdMain.value.getDataProvider().getRows().length
      let checkedRows = grdMain.value.getGridView().getCheckedRows()
      let eduRowClickData = grdEdu.value.getRowData(clickData.dataRow);

      if(rowCount.length === 0 || checkedRows.length === 0){
        Message.warn(t('분배 하고자 하는 대상자 없습니다.'))
        return
      }else{
        for(let i = 0; i < checkedRows.length; i++){
          if(grdMain.value.getRowData(i).EDU_DIV === 'Y'){ //교육 이수한 사람은 건너뛴다.
            continue
          }
          if(grdMain.value.getRowData(i).NON_YN === 'Y'){  //교육 이수한 사람은 건너뛴다.
            continue
          }
          grdMain.value.getGridView().setValues(checkedRows[i], {EDUTIME_SERIAL : eduRowClickData.EDUTIME_SERIAL}, true)
        }
        SetCountTargetByTimeSerail()
      }
    }
  }
}

//대상자 목록 출력 버튼 이벤트
const onEduBtnPointListPrint = () => {
  let checkedRows = grdEdu.value.getGridView().getCheckedRows()
  if(checkedRows.length < 1){
    Message.warn(t('출력할 데이터를 선택해 주세요.'))
    return
  }

  let grdEduDataRows = []
  let sEDUTIME_SERIAL = ''
  for(let i = 0; i < checkedRows.length; i++){
    grdEduDataRows.push(grdEdu.value.getRowData(checkedRows[i]))
    if(sEDUTIME_SERIAL === ''){
      sEDUTIME_SERIAL = grdEduDataRows[i].EDUTIME_SERIAL
    }else{
      sEDUTIME_SERIAL += ', ' + grdEduDataRows[i].EDUTIME_SERIAL
    }
  }
  

  reportName.value = '/manage/hse/EDUAB0030_TAB01_POP01_02.ozr'
  grdEduDataRows.forEach(val => {
    
    let TITLE = ''
    TITLE = _Parameters.LECTURER_ID.substr(0,4) + '년 ' + (isNullCheck(_Parameters.EDU_TITLE) === true ? '' : _Parameters.EDU_TITLE)
    let EDU_DATE = ''
    let sEDU_DATE = dayjs(val.EDU_DATE).format('YYYY.MM.DD(ddd)')
    let sEDU_DATE_END = dayjs(val.EDU_DATE_END).format('YYYY.MM.DD(ddd)')
  // console.log("sEDU_DATE",sEDU_DATE)
  // console.log("sEDU_DATE_END",sEDU_DATE_END)
    if(sEDU_DATE === sEDU_DATE_END){
      EDU_DATE = '교육일자 : ' + sEDU_DATE
    }else{
      EDU_DATE = '교육일자 : ' + sEDU_DATE + ' ~ ' + sEDU_DATE_END
    }

  // console.log("발 확인",val)
  // console.log("타이틀 확인",TITLE)
  // console.log()
    printParams.value = [
      "IN_TITLE="+TITLE,
      "IN_CMPNY_DIV="+val.CMPNY_DIV,
      "IN_YEAR="+val.YEAR,
      "IN_SCHEDULE_ID="+val.SCHEDULE_ID,
      "IN_EDUTIME_SERIAL="+sEDUTIME_SERIAL
    ]
    showOz.value = true
  })

}

//교육차수 차수자동추가 이벤트
const onEduBtnAutoAddNum = () => {
  let count = eduPopupData.CNT
  let rowCount = grdEdu.value.getDataProvider().getRows().length
  let grdEduDataRows = []

  let newRow = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    EDUTIME_SERIAL: '1', 
    EDU_DATE: dayjs(new Date()).format('YYYY-MM-DD'), 
    EDU_DATE_END: dayjs().format('YYYY-MM-DD'), 
    EDU_TARGET_CNT: '',
    SETEACH : '설정',
    SAVE_YN : 'N'
  }

  if(rowCount > 0){
    for(let i = 0; i < rowCount; i++){
      if(grdEdu.value.getRowData(i).EDU_DIV === 'Y'){ //교육 이수한 사람은 건너뛴다.
        continue
      }
      if(grdEdu.value.getRowData(i).NON_YN === 'Y'){  //교육 이수한 사람은 건너뛴다.
        continue
      }
      grdEduDataRows.push(grdEdu.value.getRowData(i))
    }
  }
  let serialNum = 0
  grdEduDataRows.forEach(val => {
    if(Number(serialNum) <= Number(val.EDUTIME_SERIAL)){
      serialNum = Number(val.EDUTIME_SERIAL) + 1
    }
    newRow.EDUTIME_SERIAL = serialNum
  })

  for(let i = 0; i < count; i++ ){
    grdEdu.value.addRow(newRow)
    newRow.EDUTIME_SERIAL++
  }
}

//각 차수별 대상인원 값을 넣어주는 이벤트
const SetCountTargetByTimeSerail = () => {
  let grdMainLength = grdMain.value.getDataProvider().getRows().length
  let grdEduLength = grdEdu.value.getDataProvider().getRows().length
  let grdMainDataRows = []
  let grdEduDataRows = []
  for(let i = 0; i < grdMainLength; i++){
    grdMainDataRows.push(grdMain.value.getRowData(i))
  }
  for(let i = 0; i < grdEduLength; i++){
    grdEduDataRows.push(grdEdu.value.getRowData(i))
  }
// console.log("grdEduLength 확인",grdEduLength)
  for(let i = 0; i < grdEduLength; i++){
    let cnt = 0
    for(let j = 0; j < grdMainLength; j++){
      if(grdEduDataRows[i].EDUTIME_SERIAL === grdMainDataRows[j].EDUTIME_SERIAL){
        cnt++
      }
    }
    grdEdu.value.getGridView().setValues(i, {EDU_TARGET_CNT : cnt}, true)
    grdEdu.value.getDataProvider().setRowState(i, 'none')
  }
}

//교육차수 삭제
const onEduBtnDelete = async () => {
  let checkedRows = grdEdu.value.getGridView().getCheckedRows()
  let deleteData = []

  if(checkedRows.length === 0){
    return
  }
  if(checkedRows.length === grdEdu.value.getDataProvider().getRows().length){
    Message.err(t('모든 차수를 삭제할 수 없습니다. \n 반드시 하나 이상의 차수가 존재해야 합니다.'))
    return
  }

  let ck = ''
  ck = await vm.$swal({ 
  title: t('선택된 교육차수를 삭제하시겠습니까?<br/> 해당 교육 차수의 일별 교시 삭제 되고 대상자 차수가 초기화 됩니다.'), 
  showCancelButton: true,
  })
  if(ck.isConfirmed === true){
    grdEdu.value.getDataProvider().removeRows(checkedRows)
    checkedRows.forEach((e)=>{
      deleteData.push(grdEdu.value.getRowData(e))
    })
    commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP01_DELETE_04', list: deleteData }).then(res => {
      Message.success(t('삭제되었습니다.'))
      // searchEduSchedule()
      searchEduSavedTargetList()
    })
  }
}

//교육차수 컬럼 데이터 변경 이벤트
const grdEduValueChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  let grdEduDataRows = grdEdu.value.getRowData(dataRow)
  if(field === 1){
    if(grdEduDataRows.EDU_DATE > grdEduDataRows.EDU_DATE_END){
      grdEdu.value.getGridView().setValues(dataRow, {EDU_DATE_END : newValue}, true)
    }
  }
  if(field === 2){
    if(grdEduDataRows.EDU_DATE > grdEduDataRows.EDU_DATE_END){
      grdEdu.value.getGridView().setValues(dataRow, {EDU_DATE : newValue}, true)
    }
  }
}

//교육차수 로우 변경 이벤트
const onGrdEduRowChanged = async (grid, oldIdx, newIdx) => {
  console.log('onGrdEduRowChanged 작동')
  if(newIdx < 0){
    return
  }
  let oldIndex = _.cloneDeep(grdEduFocusedRowIdx)
  if(grdEduFocusedRowIdx.value == '' && grdEduFocusedRowIdx.value != '0'){
    grdEduFocusedRowIdx.value = newIdx
  }
  let state = 'none'
  state = grdEdu.value.getDataProvider().getRowState(newIdx)
  if(grdEduFocusedRowIdx.value !== newIdx){
    
  console.log("이프문 탐")
    for(let i = 0; i < grdTime.value.getDataProvider().getRows().length; i++){
      if(grdTime.value.getDataProvider().getRowState(i) === 'created'){
        state = 'timeCreated'
      }
    }
  console.log('슽테이터',state)
    if(state === 'timeCreated'){
      let ck = ''
      ck = await vm.$swal({ 
      title: t('교육 차수 그리드에서 수정되고 저장되지 않은 데이터가 존재합니다.\n저장 하시겠습니까?'), 
      showCancelButton: true,
      showDenyButton: true,
      denyButtonText:'취소',
      })
      if(ck.isConfirmed === true){
        grdEdu.value.getGridView().setCurrent({dataRow : oldIndex.value})
        onBtnSave()
        return
      }
      else if(ck.isDenied === true){
        grdEdu.value.getGridView().setCurrent({dataRow : oldIndex.value})
        return
      }
      else if(ck.isDismissed === true){
        grdTime.value.getDataProvider().setRows([])
      }
    }else if(state === 'none'){
      console.log('')
      onTimeBtnSearch()
      // searchEduSavedTargetList()
    }else if(state === 'created'){
      grdTime.value.getDataProvider().setRows([])
    }

  }
  grdEduFocusedRowIdx.value = newIdx
}

//*******************************************************************************************************************************/
//*************************************************교육차수 영역(종료)**********************************************************/
//*******************************************************************************************************************************/

//*******************************************************************************************************************************/
//***************************************************일별 교시 상세 영역********************************************************/
//*******************************************************************************************************************************/
//전체 차시 조회 이벤트
const onTimeBtnAllTimeSearch = () => {
  let focusedRow = grdEdu.value.getFocusedRowData()
  if(isNullCheck(focusedRow)){
    return
  }
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YEAR : focusedRow.YEAR,
    SCHEDULE_ID : focusedRow.SCHEDULE_ID,
    EDUTIME_SERIAL : ''
  }
// console.log("전체 차시 조회 전 :::: >>>>", searchParams)
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_11', param : searchParams }).then(res => {
  // console.log("전체 차시 조회 후 :::: >>>> ",res)
    if(res.ORESULT_CUR.length > 0){
      grdTime.value.getDataProvider().setRows(res.ORESULT_CUR)
      Message.success(t('조회되었습니다.'))
    }else{
      grdTime.value.getDataProvider().setRows([])
      Message.warn(t('데이터가 없습니다.'))
    }

  })
}

//모든 차수 적용 이벤트
const onTimeBtnAllNumApply = () => {
  let focusedRow = grdEdu.value.getFocusedRowData()
  if(isNullCheck(focusedRow)){
    return
  }
  if(focusedRow.SAVE_YN === 'N'){
    Message.warn(t('수정되거나 추가된 차수 정보를 먼저 저장 후 사용하세요.'))
    return
  }

  if(grdTime.value.getDataProvider().getRows().length > 0){
    let checkedRows = grdTime.value.getGridView().getCheckedRows()
    let state = 0
    for(let i = 0; i < checkedRows.length; i++){
      if(grdTime.value.getDataProvider().getRowState(i) !== 'none'){
        state++
      }
    }
    if(checkedRows.length > 0 && state > 0){
      Message.warn(t('수정되거나 추가된 차수 정보를 먼저 저장 후 사용하세요.'))
      return
    }
  }
  let grdTimeDataRow = []
  for(let i = 0; i < grdTime.value.getDataProvider().getRows().length; i++){
    grdTimeDataRow.push(grdTime.value.getRowData(i))
  }

  grdTime.value.getDataProvider().setRows([])
  grdTime.value.getGridView().checkAll(false)

  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YEAR : focusedRow.YEAR,
    SCHEDULE_ID : focusedRow.SCHEDULE_ID,
    EDUTIME_SERIAL : focusedRow.EDUTIME_SERIAL
  }

  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_11', param : searchParams }).then(res => {
    let newTable = []
    let grdEduDataRows = []
    for(let i = 0; i < grdEdu.value.getDataProvider().getRows().length; i++){
      grdEduDataRows.push(grdEdu.value.getRowData(i))
    }

    grdEduDataRows.forEach(val => {
      newTable = []
      let sEDUTIME_SERIAL = val.EDUTIME_SERIAL
      let dupChk = []
    // console.log("발확인",val)
    // console.log("뉴테이블",newTable)
      if(newTable.length > 0){
        let cnt = 0
        newTable.forEach(val => {
          if(val.EDUTIME_SERIAL === sEDUTIME_SERIAL){
            dupChk.push(grdTimeDataRow[cnt])
            cnt++
          }
        })
      }
      if(dupChk.length > 0){
        return
      }
      if(sEDUTIME_SERIAL === focusedRow.EDUTIME_SERIAL){
        res.ORESULT_CUR.forEach(val => {
        // console.log("이프")
          let newRow = {
            EDUTIME_SERIAL : sEDUTIME_SERIAL,
            EDU_DATE : val.EDU_DATE,
            EDUTIME_SEQ : val.EDUTIME_SEQ,
            EDU_TIME : val.EDU_TIME,
            EDU_TIME_FN : val.EDU_TIME_FN,
            LEAD_TIME : val.LEAD_TIME,
            EPLACE_DIV : val.EPLACE_DIV,
            EPLACE_ETC : val.EPLACE_ETC,
            LECTURER_NM : val.LECTURER_NM,
            CMPNY_DIV : val.CMPNY_DIV,
            YEAR : val.YEAR,
            SCHEDULE_ID : val.SCHEDULE_ID,
            EDU_DIV : val.EDU_DIV,
            EPLACE_ID : val.EPLACE_ID,
            CON_DIV : val.CON_DIV,
            REQ_YN : val.REQ_YN,
            LECTURER_ID : val.LECTURER_ID,
            OLD_EDU_DATE : val.OLD_EDU_DATE,
            TIME_SEQ : val.TIME_SEQ
          }
          newTable.push(newRow)
        })
      }
      else{
        res.ORESULT_CUR.forEach(val => {
        // console.log("엘스")
          let newRow = {
            EDUTIME_SERIAL : sEDUTIME_SERIAL,
            EDU_DATE : val.EDU_DATE,
            EDUTIME_SEQ : val.EDUTIME_SEQ,
            EDU_TIME : val.EDU_TIME,
            EDU_TIME_FN : val.EDU_TIME_FN,
            LEAD_TIME : val.LEAD_TIME,
            EPLACE_DIV : val.EPLACE_DIV,
            EPLACE_ETC : val.EPLACE_ETC,
            LECTURER_NM : val.LECTURER_NM,
            CMPNY_DIV : val.CMPNY_DIV,
            YEAR : val.YEAR,
            SCHEDULE_ID : val.SCHEDULE_ID,
            EDU_DIV : val.EDU_DIV,
            EPLACE_ID : val.EPLACE_ID,
            CON_DIV : val.CON_DIV,
            REQ_YN : val.REQ_YN,
            LECTURER_ID : val.LECTURER_ID,
            OLD_EDU_DATE : val.OLD_EDU_DATE,
            TIME_SEQ : val.TIME_SEQ
          }
          newTable.push(newRow)
        })
      }
      newTable.forEach(newRow => {
        grdTime.value.addRow(newRow)
      })
    })

    //이미 추가되있던 데이터는 체크 해제
    for(let i = 0; i < grdTime.value.getDataProvider().getRows().length; i++){
      if(grdTime.value.getRowData(i).EDUTIME_SERIAL === focusedRow.EDUTIME_SERIAL){
        grdTime.value.getGridView().checkItem(i, false)
      }
    }
  })
}

//일별교시상세 조회
const onTimeBtnSearch = () => {
  let focusedRow = grdEdu.value.getFocusedRowData()
  if(isNullCheck(focusedRow)){
    return
  }
  let searchParams = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YEAR : focusedRow.YEAR,
    SCHEDULE_ID : focusedRow.SCHEDULE_ID,
    EDUTIME_SERIAL : focusedRow.EDUTIME_SERIAL
  }
  // console.log('일별교시상세 조회 파람',searchParams)
  commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_11', param : searchParams }).then(res => {
    if(res.ORESULT_CUR.length > 0){
      grdTime.value.getDataProvider().setRows(res.ORESULT_CUR)
      Message.success(t('조회되었습니다.'))
    }else{
      grdTime.value.getDataProvider().setRows([])
      Message.warn(t('데이터가 없습니다.'))
    }
    // grdTime.value.getGridView().setColumnProperty('EPLACE_DIV', "readOnly", true) //교육장소 컬럼
  })
}

//일별교시상세 Row 추가
const onTimeBtnCreate = () => {
  let focusedRow = grdEdu.value.getFocusedRowData()
// console.log("focusedRow",focusedRow)

  if(isNullCheck(focusedRow)){
    Message.warn(t('교육차수의 Row를 하나 선택해 주세요.'))
    return
  }

  let newRow = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    EDUTIME_SERIAL : focusedRow.EDUTIME_SERIAL,
    EDU_DATE : dayjs(focusedRow.EDU_DATE).format('YYYY-MM-DD'),
    EDU_TIME : null,
    EDU_TIME_FN : null,
    EPLACE_DIV : 'A',
    EPLACE_ID : null,
    LECTURER_ID :null,
    SAVE_YN : 'N'
  }
  let vMax = 1
  let grdTimeRows = grdTime.value.getDataProvider().getRows()
  if(grdTimeRows.length > 0){
    let grdTimeData = []
    for(let i = 0; i < grdTimeRows.length; i++){
      grdTimeData.push(grdTime.value.getRowData(i))
    }
    grdTimeData.forEach(val => {
      if(vMax <= val.TIME_SEQ){
        vMax++
      }
    })
  }
  newRow.TIME_SEQ = vMax
// console.log("일별 교시 상세 newRow ::::>>>>", newRow)
  grdTime.value.addRow(newRow)
  grdTime.value.getGridView().setColumnProperty('EPLACE_ETC', "readOnly", true)
}

//교육장 팝업 오픈
const eplaceEtcClick = () => {
  let focusedRow = grdEdu.value.getFocusedRowData()
  let chkVR = checkVR(_Parameters)
  let strVR = ''
  if(chkVR){
    strVR = 'Y'
  }
  eDUAB0030Tab01Pop01Pop08.value.openPopup({
    EPLACE_ETC : timePopupData.EPLACE_ETC,
    DATE_FROM : focusedRow.EDU_DATE,
    DATE_TO : focusedRow.EDU_DATE_END,
    chkVR : strVR
  })
}

//교육장 팝업에서 데이터 선택 후
const onEplaceSelect = (data) => {
// console.log('데이타',data)
  _Parameters.EPLACE_ID = data.EPLACE_ID
  _Parameters.EPLACE_NM = data.EPLACE_NM
  _Parameters.EPLACE_NUM = data.EPLACE_NUM

// console.log("전역변수 확인",_Parameters)
  timePopupData.EPLACE_DIV = 'A'
  
  if(!isNullCheck(grdTimeFocusedRowIdx.value)){
  // console.log("grdTimeFocusedRowIdx은 널이 아님")
    let setValue_EPLACE = {
      EPLACE_DIV : 'A',
      EPLACE_ID : _Parameters.EPLACE_ID,
      EPLACE_ETC : _Parameters.EPLACE_NM,
    }
  // console.log("grdTimeFocusedRowIdx.value", grdTimeFocusedRowIdx.value)
    grdTime.value.getGridView().setValues(grdTimeFocusedRowIdx.value, setValue_EPLACE, true)
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
// console.log("전역변수 확인",_Parameters)
// console.log("강사 데이터 확인",data)
  _Parameters.LECTURER_ID = ''
  let LECTURER_NM = ''
  data.forEach(val => {
  // console.log("발 확인",val)
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

const searchEduTargetList = () => {
  let searchParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    BSNS_CD : userStore.bsnsCd,
    DEPT_CD : userStore.deptCd,
    ASGN_CD : userStore.asgnCd,
    GROUP_ID : mainPopupData.GROUP_ID
  }

  // 2024.08.05 박용훈 추가 대상자 목록을 계산하기 위해 추가
  let nowCnt = grdMain.value.getDataProvider().getRows().length
  let dataCnt = 0
  let errCnt3 = 0
  let msg3 = '아래 인원은 연령이 제한이 되어 수강신청이 불가하여 제외 됩니다.\n'

  if(grdMain.value.getDataProvider().getRows().length < 1){
  // console.log("이프")
    commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_05', param : searchParams }).then(res => {
      //console.log("레스 확인 ::::>>>>>::::>>>>>",res)
      //console.log("res.ORESULT_CUR.length",res.ORESULT_CUR.length)
      // 2024.08.05 박용훈 추가 대상자 목록을 계산하기 위해 추가  
      //dataCnt = res.ORESULT_CUR.length
      //console.log("dataCnt1",dataCnt)
      //2024.08.12 박용훈 교육차수를 공백화 시키는데 주석함.
      // res.ORESULT_CUR.forEach(val => {
      //   val.EDUTIME_SERIAL = ''
      // })

      for(let i=0; i <res.ORESULT_CUR.length;i++){
        //대상자 나이가 연령제한 기준보다 크거나 같으면 신청불가.
        if(Number(popupData.AGE) != 0 && Number(res.ORESULT_CUR[i].AGE) >= Number(popupData.AGE)){
          //Message.err(res.ORESULT_CUR[i].TARGET_ID + '은 연령제한(' + popupData.AGE +'세)이 되어 교육 신청이 불가능합니다.')
          
        if(errCnt3 === 0){
          msg3 += res.ORESULT_CUR[i].TARGET_NM + '(' + res.ORESULT_CUR[i].TARGET_ID + ')'
          }else{
            msg3 += ', ' + res.ORESULT_CUR[i].TARGET_NM + '(' + res.ORESULT_CUR[i].TARGET_ID + ')'
          }
          errCnt3++
        }    
      }

      if(errCnt3 > 0){
        ck = vm.$swal({ 
          title: t(msg3), 
        })
        return
      }

      
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      grdMain.value.getGridView().checkAll()
      // 2024.08.05 박용훈 추가 
      TARGET_CNT.value = '대상자 목록 (총 ' + (isNullCheck2(res.ORESULT_CUR.length) + isNullCheck2(nowCnt)) + '명)'
      // grdMain.value.getGridView().commit()
    })
  }else{
  // console.log("엘스")
    commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_05', param : searchParams }).then(res => {
      //console.log("엘스레스 확인",res)
      //console.log("res.ORESULT_CUR.length",res.ORESULT_CUR.length)
      // 2024.08.05 박용훈 추가 대상자 목록을 계산하기 위해 추가
      //dataCnt = res.ORESULT_CUR.length
      //console.log("dataCnt1",dataCnt)
      if(res.ORESULT_CUR.length > 0){
        let cnt = 0
        let grdMainDataRows = []
        for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
          grdMainDataRows.push(grdMain.value.getRowData(i))
        }
        res.ORESULT_CUR.forEach(val => {
          //2024.08.12 박용훈 교육차수를 공백화 시키는데 주석함.
          //val.EDUTIME_SERIAL = ''
          let dupCheck = 0
          let cnt = 0
          for(let i = 0; i < grdMainDataRows.length; i++){
            if(grdMainDataRows[i].TARGET_ID === val.TARGET_ID){
              dupCheck++
            }
          }
          if(dupCheck > 0){
            return
          }
          grdMain.value.addRow(val)
        })
        res.ORESULT_CUR.forEach(val => {
          // console.log("grdMain.value.getRowData(cnt).TARGET_ID",grdMain.value.getRowData(cnt).TARGET_ID)
          // console.log("val.TARGET_ID",val.TARGET_ID)
          if(grdMain.value.getRowData(cnt).TARGET_ID === val.TARGET_ID){
            grdMain.value.getGridView().checkItem(cnt, true)
          }
          cnt++
        })
      }
      // 2024.08.05 박용훈 추가 
      TARGET_CNT.value = '대상자 목록 (총 ' + (isNullCheck2(res.ORESULT_CUR.length) + isNullCheck2(nowCnt)) + '명)'
    })
  }
}

//삭제 이벤트
const onTimeBtnDelete = async () => {
// console.log("전역 변수 확인",_Parameters)
  if(isNullCheck(_Parameters.SCHEDULE_ID)){
    Message.err(t('저장 되지 않은 교육 일정입니다.'))
    return
  }

  let checkedRows = grdTime.value.getGridView().getCheckedRows()
  if(checkedRows.length <= 0){
    Message.err(t('데이터를 선택하세요.'))
    return
  }
  if(checkedRows.length === grdTime.value.getDataProvider().getRows().length){
    Message.err(t('모든 차시를 삭제할 수 없습니다. 반드시 하나 이상의 차시가 존재해야 합니다.'))
    return
  }
  let deleteParams = []
  for(let i = 0; i < checkedRows.length; i++){
    deleteParams.push(grdTime.value.getDataProvider().getJsonRow(checkedRows[i]))
    deleteParams[i].EDU_DATE = dayjs(deleteParams[i].EDU_DATE).format('YYYYMMDD')
  }

  let ck = ''
    ck = await vm.$swal({ 
    title: t('삭제하시겠습니까?'), 
    showCancelButton: true,
    })
    if(ck.isConfirmed === true){
  // console.log("삭제할 데이터 파람",deleteParams)
      commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP01_DELETE_05', list: deleteParams }).then(res => {
        Message.success(t('삭제되었습니다.'))
        onTimeBtnSearch()
      })
    }
}

//모두 적용 버튼 클릭 이벤트
const onTimeBtnAllApply = () => {
  let checkedRows = grdTime.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('적용할 데이터를 선택해 주세요'))
    return
  }

  if(timePopupData.EPLACE_DIV_YN === 'N' && timePopupData.LECTURER_ID_YN === 'N'){
  // console.log("적용할 교육장소 또는 강사명을 체크해 주세요.")
    return
  }
// console.log("timePopupData.EPLACE_DIV_YN",timePopupData.EPLACE_DIV_YN)
  checkedRows.forEach(val => {
  // console.log("발 확인",val)
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
  Message.success(t('적용되었습니다.'))
}

//일별 교시 상세 셀 버튼 클릭 시 발생 이벤트
const grdTimeButtonClicked = (grid, item, fixed) => {
// console.log("클릭한 item",item)
  grdTimeFocusedRowIdx.value = item.dataRow
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
//일별 교시 상세 셀 값 변경 시 발생 이벤트
const grdTimeValueChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
console.log("itemIndex",itemIndex)
console.log("dataRow",dataRow)
console.log("field",field)
console.log("newValue",newValue)
console.log("oldValue",oldValue)
console.log("컬럼 화긴", grdMainProps.columns)
  let row = grdTime.value.getRowData(dataRow)
  grdTime.value.getGridView().checkItem(itemIndex, true)
// console.log("row",row)
  if(field === 3 || field === 4){
    if((newValue.charAt(0) === '2' && Number(newValue.charAt(1)) >= '4') || newValue === '00:00'){
      Message.warn(t('잘못된 시간 유형입니다. 올바른 시간을 입력해 주세요.'))
      grid.cancel()
    }
    grid.commit()
    timeCalc(dataRow)
  }
  // console.log('row.EPLACE_DIV',row.EPLACE_DIV)
  if(field === 6){
    if(newValue === 'B'){//교육장소 - 구분이 기타일 경우
      
      if(field === 6){
        grdTime.value.getGridView().setValues(dataRow, {EPLACE_ETC : ''}, true)
        grdTime.value.getGridView().setColumnProperty('EPLACE_ETC', "readOnly", false)
      }
      _Parameters.EPLACE_ID = ''
      _Parameters.EPLACE_NM = ''
      _Parameters.EPLACE_NUM = ''
    }
    else if(newValue === 'A'){//교육장소 - 구분이 안전교육장일 경우
      
      if(field === 6){
        grdTime.value.getGridView().setValues(dataRow, {EPLACE_ETC : ''}, true)
        grdTime.value.getGridView().setColumnProperty('EPLACE_ETC', "readOnly", true)

      }
    }
  }
}

//교육시각의 시작시각과 종료시각의 차를 구하는 이벤트
const timeCalc = rowIdx => {
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

//교육장소를 변경했을 때 데이터
const eplaceDivChanged = () => {
  _Parameters.EPLACE_ID = ''
  timePopupData.EPLACE_ETC = ''
}
//*******************************************************************************************************************************/
//*************************************************일별 교시 상세 영역(종료)*****************************************************/
//*******************************************************************************************************************************/

//*******************************************************************************************************************************/
//************************************************메인그리드 영역****************************************************************/
//*******************************************************************************************************************************/
//메인 그리드 버튼 이벤트
const onMainButtonsClick = btn => {
  if(btn.id === 'btnSOSRelPersSearch'){//작업중지해제 인원추가
    onMainBtnSOSRelPersSearch()
  }     
  else if(btn.id === 'btnCutOffTargetAdd'){//컷오프 대상자 추가
    onMainBtnCutOffTargetAdd()
  }     
  else if(btn.id === 'btnAbsPersonAdd'){//불참인원 추가
    onMainBtnAbsPersonAdd()
  }
  else if(btn.id === 'btnTargetAutoAddNum'){//대상자 차수 자동 분배
    onMainBtnTargetAutoAddNum()
  }
  else if(btn.id === 'btnByDutyTargetAdd'){//직무별 대상자 추가
    onMainBtnByDutyTargetAdd()
  }
  else if(btn.id === 'btnTargetAdd'){//대상자 추가
    onMainBtnTargetAdd()
  }
  else if(btn.id === 'btnTargetDelete'){//대상자 삭제
    onMainBtnTargetDelete()
  }
}

//대상그룹선택 팝업 오픈
const groupClick = () => {
  eDUAB0030Tab01Pop01Pop10.value.openPopup()
}

//대상그룹선택 데이터 선택 후
const onGroupSelect = (data) => {
// console.log("대상그룹선택 데이터 확인",data)
  mainPopupData.GROUP_NM = ''
  mainPopupData.GROUP_ID = ''
  codeList.group = []
  //let groupData = ''
  data.forEach(val => {
    // 2024.08.05 박용훈 수정 사용하지 않는 groupData 제외
    //if(groupData === ''){
    if(mainPopupData.GROUP_ID === ''){
      mainPopupData.GROUP_NM = val.GROUP_NM
      mainPopupData.GROUP_ID = val.GROUP_ID
    }
    else{
      mainPopupData.GROUP_NM += ',' + val.GROUP_NM
      mainPopupData.GROUP_ID += ',' + val.GROUP_ID
    }
    //codeList.group.push({GROUP_ID : val.GROUP_ID, GROUP_NM : val.GROUP_NM})
  })
  searchEduTargetList()
}

//컷오프 대상자 추가
const onMainBtnCutOffTargetAdd = () => {
  if(popupData.LINK_CODE === '07'){//법정-신규채용자 안전보건교육(협력사/통합안전교육센터)
    eDUAB0030Tab01Pop01Pop04.value.openPopup({
      OPEN_CODE : '07',
      YEAR : _Parameters.YEAR,
    })
  }else{
    if(popupData.CURR_ID === 'C120'){//법정-신규채용자 안전보건교육(단기공사-사업부안전) 
      eDUAB0030Tab01Pop01Pop04.value.openPopup({
       OPEN_CODE : 'C120',
       YEAR : _Parameters.YEAR,
       CURR_ID : popupData.CURR_ID
      })
    }
    else if(popupData.CURR_ID === 'C227'){//법정-신규채용자 안전보건교육(단기공사-생산부서)
      eDUAB0030Tab01Pop01Pop04.value.openPopup({
       OPEN_CODE : 'C227',
       YEAR : _Parameters.YEAR,
       CURR_ID : popupData.CURR_ID
      })
    }
    else if(popupData.CURR_ID === 'C179'){//법정-신규채용자 안전보건교육(협력사/통합안전교육센터)
      eDUAB0030Tab01Pop01Pop04.value.openPopup({
       OPEN_CODE : 'C179',
       YEAR : _Parameters.YEAR
      })
    }
    else{
      eDUAB0030Tab01Pop01Pop04.value.openPopup({//의무-안전 아카데미
       OPEN_CODE : 'ELSE',
       YEAR : _Parameters.YEAR
      })
    }
  }
}

//불참인원추가 버튼 클릭 이벤트
const onMainBtnAbsPersonAdd = () => {
// console.log("불참인원추가 버튼 클릭")
  eDUAB0030Tab01Pop01Pop01.value.openPopup({
    YEAR : _Parameters.YEAR
  })
}

//불참인원추가 팝업 데이터 선택 후
const onAbsPersonSelect = (data) => {
  if(data.length < 1){
    return
  }
  let grdMainDataRows = []
  for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
    grdMainDataRows.push(grdMain.value.getRowData(i))
  }
  data.forEach(val => {
    let result = true
    let newRow = {
      CMPNY_DIV : val.CMPNY_DIV,
      YEAR : val.YEAR,
      TARGET_ID : val.EMP_NO,
      TARGET_NM : val.EMP_NM,
      ORGN_CD : val.DEPT_CD,
      ORGN_NM : val.DEPT_NM,      
      ASGN_NM : val.ASGN_NM,
      BSNS_CD : val.BSNS_CD,
      BSNS_NM : val.BSNS_NM,
      JOB_TIT_NM : val.JOB_TIT_NM,
      JOB_TIT_CD : val.JOB_TIT_CD,
      SAVE_YN : 'N',
    }
    for(let i = 0; i < grdMainDataRows.length; i++){
      if(newRow.CMPNY_DIV === grdMainDataRows[i].CMPNY_DIV && newRow.TARGET_ID === grdMainDataRows[i].TARGET_ID){
        result = false
      }
    }
    if(result){
      grdMain.value.addRow(newRow)
    }
    
  })
}
//작업중지해제 인원 조회
const onMainBtnSOSRelPersSearch= () => {
  eDUAB0030Tab01Pop01Pop03.value.openPopup({
    YEAR : _Parameters.YEAR
  })
}

const onPop04Select = (data, CLOSE_CODE) => {
  let grdMainDataRows = []
  for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
    grdMainDataRows.push(grdMain.value.getRowData(i))
  }
// console.log()
// console.log("Pop04 선택 데이터", data)
// console.log("Pop04 선택 오픈코드", CLOSE_CODE)
  if(CLOSE_CODE === '07'){
    data.forEach(val => {
      let result = true
      let newRow = {
        CMPNY_DIV : val.CMPNY_DIV,
        COMPANY : val.COMPANY,
        YEAR : _Parameters.YEAR,
        TARGET_ID : val.REG_REQ_SEQ,
        TARGET_NM : val.EMP_NM,
        ORGN_CD : val.DEPT_CD,
        ORGN_NM : val.DEPT_NM,
        ASGN_CD : val.ASGN_CD,
        ASGN_NM : val.ASGN_NM,
        BSNS_CD : val.BSNS_CD,
        BSNS_NM : val.BSNS_NM,
        REG_REQ_SEQ : val.REG_REQ_SEQ,
        CERT_VNO : val.CERT_VNO,
        SAVE_YN : 'N',
      }
    // console.log("가져온 데이터 확인",newRow)
      for(let i = 0; i < grdMainDataRows.length; i++){
      // console.log("grdMainDataRows 데이터 확인 :::: >>>> :::: >>>> ",grdMainDataRows[i])
        if(newRow.CMPNY_DIV === grdMainDataRows[i].CMPNY_DIV && newRow.TARGET_ID === grdMainDataRows[i].TARGET_ID){
          result = false
        }
      }
      if(result){
        grdMain.value.addRow(newRow)
      }
    })
  }
  else if(CLOSE_CODE === 'C120'){
    data.forEach(val => {
    // console.log("C120 포이치")
      let result = true
      let newRow = {
        CMPNY_DIV : val.CMPNY_DIV,
        YEAR : _Parameters.YEAR,
        TARGET_ID : val.EMP_NO,
        TARGET_NM : val.EMP_NM,
        ORGN_CD : val.DEPT_CD,
        ORGN_NM : val.DEPT_NM,
        BSNS_CD : val.BSNS_CD,
        BSNS_NM : val.BSNS_NM,
        DANGI_DIV : val.DANGI_DIV,
        ORI_ORGN_NM : val.VNDNAME,
        SAVE_YN : 'N',
      }
      for(let i = 0; i < grdMainDataRows.length; i++){
        if(newRow.CMPNY_DIV === grdMainDataRows[i].CMPNY_DIV && newRow.TARGET_ID === grdMainDataRows[i].TARGET_ID){
          result = false
        }
      }
      if(result){
        grdMain.value.addRow(newRow)
      }
    })
  }
  else if(CLOSE_CODE === 'C227'){
    data.forEach(val => {
      let result = true
      let newRow = {
        CMPNY_DIV : val.CMPNY_DIV,
        YEAR : val.YEAR,
        TARGET_ID : val.EMP_NO,
        TARGET_NM : val.EMP_NM,
        ORGN_CD : val.DEPT_CD,
        ORGN_NM : val.DEPT_NM,
        BSNS_CD : val.BSNS_CD,
        BSNS_NM : val.BSNS_NM,
        DANGI_DIV : val.DANGI_DIV,
        ORI_ORGN_NM : val.VNDNAME,
        SAVE_YN : 'N',
      }
      for(let i = 0; i < grdMainDataRows.length; i++){
        //console.log("grdMainDataRows 데이터 확인 :::: >>>> :::: >>>> ",grdMainDataRows[i])
        if(newRow.CMPNY_DIV === grdMainDataRows[i].CMPNY_DIV && newRow.TARGET_ID === grdMainDataRows[i].TARGET_ID){
          result = false
        }
      }
      if(result){
        grdMain.value.addRow(newRow)
      }
    })
  }else if(CLOSE_CODE === 'C179'){
    data.forEach(val => {
      let result = true
      let newRow = {
        CMPNY_DIV : val.CMPNY_DIV,
        TARGET_ID : val.EMP_NO,
        TARGET_NM : val.EMP_NM,
        ORGN_CD : val.DEPT_CD,
        ORGN_NM : val.DEPT_NM,
        BSNS_CD : val.BSNS_CD,
        BSNS_NM : val.BSNS_NM,
        ASGN_NM : val.ASGN_NM,
        JOB_TIT_CD : val.JOB_TIT_CD,
        JOB_TIT_NM : val.JOB_TIT_NM,
        SAVE_YN : 'N',
      }
      for(let i = 0; i < grdMainDataRows.length; i++){
        //console.log("grdMainDataRows 데이터 확인 :::: >>>> :::: >>>> ",grdMainDataRows[i])
        if(newRow.CMPNY_DIV === grdMainDataRows[i].CMPNY_DIV && newRow.TARGET_ID === grdMainDataRows[i].TARGET_ID){
          result = false
        }
      }
      if(result){
        grdMain.value.addRow(newRow)
      }
    })
  }else if(CLOSE_CODE === 'ELSE'){
    data.forEach(val => {
      let result = true
      let newRow = {
        CMPNY_DIV : userStore.cmpnyDiv,
        YEAR : _Parameters.YEAR,
        SCHEDULE_ID : val.SCHEDULE_ID,
        TARGET_ID : val.EMP_NO,
        TARGET_NM : val.EMP_NM,
        JOB_TIT_CD : val.JOB_TIT_CD,
        JOB_TIT_NM : val.JOB_TIT_NM,
        OFFI_RES_CD : val.OFFI_RES_CD,
        OFFI_RES_NM : val.OFFI_RES_NM,
        ORGN_CD : val.DEPT_CD,
        ORGN_NM : val.DEPT_NM,
        BSNS_CD : val.BSNS_CD,
        BSNS_NM : val.BSNS_NM,
        ASGN_NM : val.ASGN_NM,
        EMAIL : val.EMAIL,
        EDU_DIV : val.EDU_DIV,
        NATN_CD : val.NATN_CD,
        SEX : val.SEX,
        TEL_NO : val.TEL_NO,
        HND_PHN : val.HND_PHN,
        VIO_NO : val.VIO_NO,
        VIO_DIV : val.VIO_DIV,
        VIO_TIME : val.VIO_TIME,
        VIO_DESC : val.VIO_DESC,
      }
      for(let i = 0; i < grdMainDataRows.length; i++){
        //console.log("grdMainDataRows 데이터 확인 :::: >>>> :::: >>>> ",grdMainDataRows[i])
        if(val.VIO_EMP_NO === grdMainDataRows[i].TARGET_ID){
          //중복으로 들어감 확인 필요...
          result = false
        }
      }
      if(result){
        grdMain.value.addRow(newRow)
      }
    })
  }

}

//대상자 차수 자동 분배 버튼 클릭 이벤트
const onMainBtnTargetAutoAddNum = () => {
  let eduCheckedRows = grdEdu.value.getGridView().getCheckedRows()
  let mainCheckedRows = grdMain.value.getGridView().getCheckedRows()
  let eduNum = []

  for(let i = 0; i < eduCheckedRows.length; i++){
    // if((isNullCheck(grdEdu.value.getRowData(i).FINISH_YN) ||  
    //     grdEdu.value.getRowData(i).FINISH_YN !== 'Y')){
    eduNum.push(grdEdu.value.getRowData(eduCheckedRows[i]).EDUTIME_SERIAL)
    //}
  }
  if(eduNum.length < 1){
    Message.warn(t('분배 하고자 하는 교육 차수를 선택해 주세요.'))
    return
  }
  if(mainCheckedRows.length < 1){
    Message.warn(t('분배하고자 하는 대상자를 선택해 주세요.'))
    return
  }

  let cnt = 0
  for(let i = 0; i < mainCheckedRows.length; i++){
    grdMain.value.getGridView().setValues(mainCheckedRows[i], {EDUTIME_SERIAL : eduNum[cnt++]}, true)
    if(cnt === eduNum.length){
      cnt = 0
    }
  }
  SetCountTargetByTimeSerail()
}

//직무별 대상자 버튼 클릭 이벤트
const onMainBtnByDutyTargetAdd = () => {
  if(popupData.LINK_CODE === '08'){
    eDUAB0030Tab01Pop01Pop06.value.openPopup({
      YEAR : _Parameters.YEAR
    })
  }
}

//직무별 대상자 팝업 데이터 선택 후
const onByDutyTargetSelect = (data) => {
// console.log("직무별 선택 데이터",data)
  if(data.length < 1){
    return
  }
  let grdMainDataRows = []
  for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
    grdMainDataRows.push(grdMain.value.getRowData(i))
  }
  data.forEach(val => {
      let result = true
      let newRow = {
        CMPNY_DIV : val.CMPNY_DIV,
        COMPANY : val.CMPNY_DIV,
        YEAR : _Parameters.YEAR,
        TARGET_ID : val.EMP_NO,
        TARGET_NM : val.KOR_NM,
        ORGN_CD : val.DEPT_CD,
        ORGN_NM : val.DEPT_NM,
        BSNS_CD : val.BSNS_CD,
        BSNS_NM : val.BSNS_NM,
        ASGN_CD : val.ASGN_CD,
        ASGN_NM : val.ASGN_NM,
        JOB_TIT_NM : val.JOB_TIT_NM,
        DUTY_NM : val.DUTY_NM,
        SAVE_YN : 'N',
      }
      for(let i = 0; i < grdMainDataRows.length; i++){
        if(newRow.CMPNY_DIV === grdMainDataRows[i].CMPNY_DIV && newRow.TARGET_ID === grdMainDataRows[i].TARGET_ID){
          result = false
        }
      }
      if(result){
        grdMain.value.addRow(newRow)
      }
    })
}

//대상자 추가 버튼 클릭
const onMainBtnTargetAdd = () => {
  if(isNullCheck(popupData.DIVISION)){
    Message.warn(t('분류는 필수 입력 항목입니다.'))
    return
  }
  
  if(isNullCheck(popupData.CURR_ID)){
    Message.warn(t('교육명은 필수 입력 항목입니다.'))
    return
  }
  empPopup.value.openPopup({MULTI:true, CMPNY_DIV: popupData.CMPNY_DIV, BSNS_CD: popupData.BSNS_CD, DEPT_CD: popupData.DEPT_CD})
}

//사원 검색 팝업 데이터 선택 후
const onEmpSelected = async data => {
  if(data.length < 0){
    return
  }

 console.log("선택한 데이터",data)
 console.log("인원선택후 파라미터",_Parameters)
 console.log("인원선택후 팝업 데이터",popupData)
  const nowRows = grdMain.value.getDataProvider().getRows().length
  let grdMainDataRows = []
  for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
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
  let chkVR = checkVR({CMPNY_DIV: _Parameters.CMPNY_DIV, CURR_ID: popupData.CURR_ID})

  data.forEach(async (val,idx) => {

    let dupCheck = 0
    let cnt = 0
    for(let j = 0; j < grdMainDataRows.length; j++){
      if(grdMainDataRows[j].TARGET_ID === val.EMP_NO){
        dupCheck++
      }
    }
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

    // 운전자격 교육일 때 이미 자격증 소지자 제외
    if(popupData.DIVISION === 'C'){
      //자격증 체크 조회
      await commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_15', param : liceSearchParams }).then(res2 => {
      // console.log("자격증 체크 조회",res2)
        if(res2.ORESULT_CUR[0].POINT === 0){
          if(errCnt2 === 0){
            msg2 += '' + val.EMP_NM + '(' + val.EMP_NO + ')'
          // console.log("지금 msg2", msg2)
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

    await commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_13', param: liceSearchParams }).then(res3 => {
      console.log("사전학습 체크 조회",res3)
      if(res3.ORESULT_CUR[0].POINT === 0){
        console.log("popupData ▶ ",popupData)
        if(popupData.DIVISION === 'C'){
          //자격증 체크 조회
          commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_POP01_SEARCH_14', param: liceSearchParams }).then(res4 => {
            console.log("자격증 체크 조회",res4)
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


    if(chkVR){
      //VR교육 수강 내역 확인
      let searchParams = {
        CMPNY_DIV : val.CMPNY_DIV,
        TARGET_ID : val.EMP_NO,
        MEDIA_CD_1 : popupData.MEDIA_CD_1,
        MEDIA_CD_2 : popupData.MEDIA_CD_2,
      }

      await commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_17', param: searchParams }).then(res => {
        let LECTURER_INFO = ''

        if(res.ORESULT_CUR.length > 0){
          let sMEDIA_CD_1 = res.ORESULT_CUR[0].CD_1
          let sMEDIA_CD_2 = res.ORESULT_CUR[0].CD_2
          let sLECTURER_ID_1 = res.ORESULT_CUR[0].LECTURER_ID_1
          let sLECTURER_ID_2 = res.ORESULT_CUR[0].LECTURER_ID_2

          if(!isNullCheck(sMEDIA_CD_1) && !isNullCheck(sLECTURER_ID_1)){
            LECTURER_INFO += '[' + val.EMP_NM + ']' + popupData.VR_CATEGORY1 + ' : ' + sLECTUER_ID_1 + '\n'  
          }
          if(!isNullCheck(sMEDIA_CD_2) && !isNullCheck(sLECTURER_ID_2) && sMEDIA_CD_1 !== sMEDIA_CD_2){
            LECTURER_INFO += '[' + val.EMP_NM + ']' + popupData.VR_CATEGORY2 + ' : ' + sLECTUER_ID_2 + '\n'  
          }
        }

        if(!isNullCheck(LECTURER_INFO)){
          sDisplayText += LECTURER_INFO + '\n'
          cnt++
        }
      })
    }else{
      sDisplayText = ''
      popupData.VR_CATEGORY1 = ''
      popupData.VR_CATEGORY2 = ''
    }

    let newRow = {
      CMPNY_DIV : userStore.cmpnyDiv,
      YEAR : _Parameters.YEAR,
      SCHEDULE_ID : _Parameters.SCHEDULE_ID,
      TARGET_ID : val.EMP_NO,
      TARGET_NM : val.EMP_NM,
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
    // console.log("뉴로우",newRow)


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
    // console.log("sDisplayText :::: ",sDisplayText)
    if(!isNullCheck(sDisplayText)){
      let ck = ''
      ck = vm.$swal({ 
      title: t(sDisplayText), 
      })
    }
    // console.log(grdMain.value.getDataProvider().getRows().length)
    const grdlen = grdMain.value.getDataProvider().getRows().length
    
    if(grdlen === data.length+nowRows){
        commonStore.loading = false
        TARGET_CNT.value = '대상자 목록 (총 ' + grdlen + '명)'
        // console.log('로딩취소')
    }
    
    
  })

  
  
  grdMain.value.getGridView().commit()
  
}

//대상자 삭제 버튼 클릭 이벤트
const onMainBtnTargetDelete = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  let deleteParams = []
  let stateList = []
  let PASS = 'Y'
  if(checkedRows.length < 1){
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))
    return
  }
  for(let i = 0; i < checkedRows.length; i++){
    deleteParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    stateList.push(grdMain.value.getDataProvider().getRowState(checkedRows[i]))
  }
  stateList.forEach(val => {
    if(val == 'created'){
      PASS = 'N'
    }
  })
  console.log('pass',PASS)
  grdMain.value.getDataProvider().removeRows(checkedRows)
  if(PASS === 'Y'){
    commonExecuteApi({ queryId : 'EDUAB0030_TAB01_POP01_DELETE_03', list: deleteParams }).then(() => {
      searchEduSavedTargetList()
    })
  }else{
    const grdlen = grdMain.value.getDataProvider().getRows().length
    TARGET_CNT.value = '대상자 목록 (총 ' + grdlen + '명)'
  } 
}

// 삭제 버튼 enter,space 반응 방지
const checkKey = (val) =>{
  // console.log('checkKey val',val)
  if(val.code === 'Enter'||val.code === 'Space'){
    keyStatus.value = false
  }
}


//메인그리드 데이터 변경 시 이벤트
const grdMainValueChange = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  let maxLength = 0
  for(let i = 0; i < grdEdu.value.getDataProvider().getRows().length; i++){
    if(maxLength < Number(grdEdu.value.getRowData(i).EDUTIME_SERIAL)){
      maxLength = Number(grdEdu.value.getRowData(i).EDUTIME_SERIAL)
    }
  }
  if(newValue > maxLength){
    Message.warn(t('교육차수보다 높은 차수를 입력할 수 없습니다.'))
    grid.cancel()
  }
  if(newValue == 0){
    Message.warn(t('교육차수는 1 이상이여야 합니다.'))
    grid.cancel()
  }
  SetCountTargetByTimeSerail()
}

//메인그리드 재생성
const makeMainGrid = (_CURR_ID, _LINK_CD) => {
  grdMainProps.fields = [] 
  grdMainProps.columns = [] 
  try{
    grdMainProps.fields.push(
      { fieldName: 'DUPL_CHK', dataType: 'text', header: { text: t('타교육 시간중복') }, editable: false },
      { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, styleName:'left-column', editable: false },
      { fieldName: 'ORGN_NM', dataType: 'text', header: { text: t('부서') }, styleName:'left-column', editable: false },
      { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, styleName:'left-column', editable: false },
      { fieldName: 'ORI_ORGN_NM', dataType: 'text', header: { text: t('신청당시소속') }, styleName:'left-column', editable: false },
      { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
      { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사용자 아이디') }, editable: false },
      { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
      { fieldName: 'DUTY_NM', dataType: 'text', header: { text: t('인사직무') }, styleName:'left-column', editable: false },
    )
    // console.log('1',grdMainProps.fields)
    if(_LINK_CD === '04'){
      grdMainProps.fields.push(
        { fieldName: 'VIO_DESC', dataType: 'text', header: { text: t('위반내용') }, editable: false },
        { fieldName: 'VIO_TIME', dataType: 'text', header: { text: t('위반일시') }, editable: false },
      )
      // console.log('2')
    }
    grdMainProps.fields.push(
      { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('교육차수'), styleName: 'header_validit' },
        editor: { type: "line", ignoreCharacters: "ㄱ-힣A-Za-z" }, editable : true, styleName : 'editable_column' },
      { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육시작일') }, editable: false },
      { fieldName: 'EDU_DATE_END', dataType: 'text', header: { text: t('교육종료일') }, editable: false },
      { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable: false },
      // { fieldName: 'NON_YN', dataType: 'text', header: { text: t('제외') }, editable: false },
      // { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고(제외사유)') }, styleName:'left-column', editable: false },
      { fieldName: 'EDU_DIV', dataType: 'text', header: { text: t('이수여부') }, editable: false },
      { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직구분') }, editable: false },
      { fieldName: 'EDU_SCORE', dataType: 'text', header: { text: t('이수점수') }, editable: false },
      { fieldName: 'ATTEND_TIME', dataType: 'text', header: { text: t('출석시간') }, editable: false },
    )
    // console.log('3')
    if(_LINK_CD === '04'){
      grdMainProps.fields.push(
        { fieldName: 'NATN_CD', dataType: 'text', header: { text: t('국적') }, editable: false },
        { fieldName: 'SEX', dataType: 'text', header: { text: t('성별') }, editable: false },
        { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('전화번호') }, editable: false },
        { fieldName: 'HND_PHN', dataType: 'text', header: { text: t('핸드폰번호') }, editable: false },
      )
      
    }
    if(_CURR_ID === 'C001' || _LINK_CD === 'C002'){
      grdMainProps.fields.push(
        { fieldName: 'COM_ENT_DATE', dataType: 'text', width:'180', header: { text: t('당사최초 입사일자') }, editable: false },
        { fieldName: 'JOB_PRMT_DATE', dataType: 'text', header: { text: t('승진일자') }, editable: false },
        { fieldName: 'OFFI_RES_DATE', dataType: 'text', header: { text: t('직책보임 일자') }, editable: false },
        { fieldName: 'ORI_OFFI_RES_NM', dataType: 'text', header: { text: t('원소속 직책') }, editable: false },
        { fieldName: 'USER_DIV', dataType: 'text', header: { text: t('고용형태') }, editable: false },
        { fieldName: 'JOB_DEPT_NM', dataType: 'text', header: { text: t('사원유형') }, editable: false },
        { fieldName: 'GRP_ENT_DATE', dataType: 'text', header: { text: t('그룹입사일자') }, editable: false },
        { fieldName: 'WRK_PLC_NM', dataType: 'text', header: { text: t('근무지') }, styleName:'left-column', editable: false },
      )
    }

    //이하 비활성화 컬럼
    grdMainProps.fields.push(
      { fieldName: 'UPDATE_USER_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
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
      { fieldName: 'DANGI_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'REG_REQ_SEQ', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
      { fieldName: 'CERT_VNO', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    )
    grdMainProps.columns = grdMainProps.fields
    grdMain.value.getDataProvider().setFields(grdMainProps.fields)
    grdMain.value.getGridView().setColumns(grdMainProps.columns)
    // 2024.07.25 박용훈 소속 이름 자동 필터 설정
  // 대상자 목록
  grdMain.value.getGridView().setColumnProperty("ASGN_NM", "autoFilter", true)
  grdMain.value.getGridView().setColumnProperty("TARGET_NM", "autoFilter", true)
  }
  catch(err){
    Message.err(err)
  }
}
//*******************************************************************************************************************************/
//**********************************************메인그리드 영역(종료)************************************************************/
//*******************************************************************************************************************************/

defineExpose({
  openPopup,
})
</script>
<!--d-flex : 요소를 수평으로 배치-->
<!--flex-column : 요소를 수직으로 배치-->
<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1600"
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
      <span>교육 일정 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="d-flex pa-4 pb-2" style="justify-content: space-between;">
        <div class="d-flex">
          <span>{{ popupData.SCHEDULE_ID }}</span>
          <IGridTitle
            ref="popupButtons1"
            :use-permission="false"
            :button-list="['btnDelete']"
            @click-button="onButtonsClick"
            @keydown="e=> checkKey(e)"
          />
        </div>
        <IGridTitle
          ref="popupButtons2"
          :use-permission="false"
          :button-list="['btnQrCodePrint', 'btnSendSms', 'btnSendMail', 'btnUpdate', 'btnConfirm', 'btnEduCopy', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="flex-column fill-height">
          <div class="d-flex">
            <v-sheet width="35%" height="40%" class="flex-column searchArea mr-10">
              <div class="d-flex">
                <i-select
                  class="mb-2 mr-10"
                  :label="$t('분　류​')"
                  leftLabel
                  v-model="popupData.DIVISION"
                  :items="codeList.division"
                  item-title="TXT"
                  item-value="COD"
                  :labelWidth="labelWidthes.division"
                  width="280px"
                  :required="true"
                  @update:model-value="divisionChanged"
                />
                <VCheckbox
                  :label="$t('알림문자발송')"
                  v-model="popupData.SEND_YN"
                />
              </div>
              <div class=d-flex v-if="visible.WORK_STD_NM">
                <i-input
                  class="mb-2"
                  :label="$t('작업표준명')"
                  leftLabel
                  v-model="popupData.WORK_STD_NM"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="workStdNmClick"
                  width="420px"
                  readonly
                />
              </div>
              <i-select
                  class="ma-0 mb-2"
                  :label="$t('교육명')"
                  leftLabel
                  v-model="popupData.CURR_ID"
                  :items="codeList.currId"
                  item-title="TXT"
                  item-value="COD"
                  :required="true"
                  @update:model-value="currIdChanged"
                  :labelWidth="labelWidthes.currId"
                  width="420px"
                />
                <i-input
                  class="mb-2"
                  :label="$t('주관부서')"
                  leftLabel
                  v-model="popupData.MORGN_ID"
                  width="400px"
                  v-if="visible.MORGN_DIV"
                />
                <div class="d-flex">
                  <i-input 
                    width="232px" 
                    :label="$t('기　간 ')" 
                    type="date"
                    v-model="popupData.EDATE_FROM"
                    @focusout="dateFrChanged"
                    :labelWidth="labelWidthes.eDate"
                    class="ma-0 mr-2"
                  />
                  <i-input 
                    width="180px"
                    :label="$t('-')" 
                    type="date"
                    v-model="popupData.EDATE_TO"
                    @focusout="dateToChanged"
                  />
                </div>
            </v-sheet>
            <v-sheet width="65%"  class="flex-column fill-height searchArea">
              <div class="d-flex mb-2">
                <i-input
                  :label="$t('가능인원')"
                  leftLabel
                  v-model="popupData.EDUPOSSIBLE_NUM"
                  labelWidth="55px"
                  width="240px"
                  number
                />
                <i-input
                  :label="$t('소요시간(분)')"
                  leftLabel
                  v-model="popupData.LEAD_TIME"
                  width="240px"
                  :required="true"
                  @focusout="leadTimeValueChanged"
                  number
                />
              </div>
              <div class="mb-0">
                <!-- <i-input 
                  :label="$t('교육내용')"
                  leftLabel
                  v-model="popupData.EDU_CONTENT"
                  rows="2"
                  v-if="visible.EDU_CONTENT"
                  :required="true"
                /> -->
                <i-textarea
                  :label="$t('교육내용')"
                  width="100%"
                  :row="3"
                  v-model="popupData.EDU_CONTENT"
                  v-if="visible.EDU_CONTENT"
                  :required="true"
                /> 
              </div>
              <!-- <div class="d-flex">
                <i-input
                  :label="$t('교육내용1')"
                  leftLabel
                  v-model="popupData.VR_CATEGORY1"
                  width="300px"
                  rows="2"
                  v-if="visible.VR_CATEGORY1"
                />
                <i-input
                  :label="$t('교육내용2')"
                  leftLabel
                  v-model="popupData.VR_CATEGORY1"
                  width="300px"
                  rows="2"
                  v-if="visible.VR_CATEGORY2"
                />
              </div> -->
            </v-sheet>
          </div>
          <div class="d-flex"> 
            <!--교육차수 영역-->
            <v-sheet width="35%" height="40%" class="flex-column mr-10">
              <div>
                <IGridTitle
                  ref="grdEduButtons"
                  :title="$t('교육차수')"
                  :button-list="['btnCreate','btnDelete','btnPointListPrint']"
                  @click-button="onEduButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
              </div>
              <div class="d-flex" style="justify-content:flex-end">
                <i-input
                  :label="$t('차수')"
                  leftLabel
                  v-model="eduPopupData.CNT"
                  width="100px"
                  rows="2"
                  class="ma-0 mb-2"
                  maxlength="3"
                  number
                />
                <IGridTitle
                  ref="grdEduButtons"
                  :button-list="['btnAutoAddNum']"
                  @click-button="onEduButtonsClick"
                />
              </div>         
            </v-sheet>
            <!--일별 교시 상세 영역-->
            <v-sheet width="63%" height="40%" class="d-flex flex-column">
              <div>
                <IGridTitle
                  :title="$t('일별 교시 상세')"
                  ref="grdTimeButtons1"
                  :button-list="['btnAllTimeSearch', 'btnAllNumApply','btnSearch','btnCreate', 'btnDelete', ]"
                  @click-button="onTimeButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
              </div>
              <div class="d-flex mb-2" style="justify-content:flex-end">
                <VCheckbox
                  v-model="timePopupData.EPLACE_DIV_YN"
                  class="ma-0 mt-1"
                  :disabled="disable.EPLACE_DIV_YN"
                />
                <i-select
                  :label="$t('교육장소')"
                  leftLabel
                  v-model="timePopupData.EPLACE_DIV"
                  :items="codeList.eplaceDiv"
                  item-title="TXT"
                  item-value="COD"
                  labelWidth="55px"
                  width="200px"
                  class="mr-2"
                  :disabled="disable.EPLACE_DIV"
                  @update:model-value="eplaceDivChanged"
                />
                <i-input
                  leftLabel
                  v-model="timePopupData.EPLACE_ETC"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="eplaceEtcClick"
                  @update:model-value="_Parameters.EPLACE_ID = null"
                  width="150px"
                  rows="2"
                  class="mr-2"
                  readonly
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
            </v-sheet>
          </div>
          <div class="d-flex" style="height:25%">
            <!--교육차수 그리드-->
            <v-sheet width="35%" class="d-flex flex-column mr-10">
              <RealGrid
                ref="grdEdu"
                :grid-view-option="grdEduProps.gridViewOption"
                :fields="grdEduProps.fields"
                :columns="grdEduProps.columns"
                :column-layout="grdEduProps.columnLayout"
                @onCellItemClicked = eduGrdBtnClick
                @onEditRowChanged="grdEduValueChanged"
                @onCurrentRowChanged="onGrdEduRowChanged"
              />
            </v-sheet>
            <!--일별 교시 상세 그리드-->
            <v-sheet width="63%" class="d-flex flex-column">
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
          <!--메인 그리드 영역-->
          <div class="d-flex mt-2" style="justify-content: space-between;">
            <IGridTitle
              :title="TARGET_CNT"
              class="mt-1"
            >
              <template #editors />
            </IGridTitle>
            <div class=d-flex>
              <i-input
              :label="$t('대상그룹선택')"
                v-model="mainPopupData.GROUP_NM"
                labelWidth="80px"
                width="400px"
                class="ma-0 mb-2"
                />
                <!-- :items="codeList.group"
                item-title="GROUP_NM"
                item-value="GROUP_ID"
                :disabled="disable.GROUP" -->
                <v-btn  
                class="mr-8"
                @click="groupClick"
                :disabled="disable.GROUP_BTN"
                style="width:30px; height:30px; position: relative; top: 2px;"
              >
                <v-icon large>mdi-magnify</v-icon>
              </v-btn>

              <IButtonList
                ref="grdMainButtons"
                style="float:right"
                :button-list="['btnSOSRelPersSearch', 'btnCutOffTargetAdd',
                                'btnAbsPersonAdd', 'btnTargetAutoAddNum', 'btnByDutyTargetAdd', 'btnTargetAdd', 
                                'btnTargetDelete']"
                @click-button="onMainButtonsClick"
              />
            </div>
          </div>
          <v-sheet height="25%" class="d-flex flex-column mt-2" style="z-index: 9;">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onEditRowChanged="grdMainValueChange"
            />
          </v-sheet>
          <IUpload
            class="mt-2"
            ref="fileUpload"
            style="height: 200px"
            :button-list="['btnFileUpload','btnDelete','btnDownLoad']"
            :is-visibled="true"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <EDUAB0030Tab01Pop01Pop01 ref="eDUAB0030Tab01Pop01Pop01" @onSelect="onAbsPersonSelect"/>
  <EDUAB0030Tab01Pop01Pop03 ref="eDUAB0030Tab01Pop01Pop03"/>
  <EDUAB0030Tab01Pop01Pop04 ref="eDUAB0030Tab01Pop01Pop04" @onSelect="onPop04Select"/>
  <EDUAB0030Tab01Pop01Pop06 ref="eDUAB0030Tab01Pop01Pop06" @onSelect="onByDutyTargetSelect"/>
  <EDUAB0030Tab01Pop01Pop08 ref="eDUAB0030Tab01Pop01Pop08" @onSelect="onEplaceSelect"/>
  <EDUAB0030Tab01Pop01Pop09 ref="eDUAB0030Tab01Pop01Pop09" @onSelect="onLecturerSelect"/>
  <EDUAB0030Tab01Pop01Pop10 ref="eDUAB0030Tab01Pop01Pop10" @onSelect="onGroupSelect"/>
  <EDUAB0030Tab01Pop01Pop11 ref="eDUAB0030Tab01Pop01Pop11" @onSelect="onWorkStdNmSelect"/>
  <SendMailPopup ref="sendMailPopup" />
  <SendSMSPopUp ref="sendSMSPopup" />
  <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
  <OZReport :showPop="showOz" :reportName="reportName" :params="printParams" @close="showOz = $event" />
</template>
<style scoped lang="scss">
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

// ::v-deep(.test>.v-input__control>.v-field>.v-field__v-field) {
//   overflow-y: auto;
// }
::v-deep(.v-field__field) {
  //overflow-y: 35px;
  // overflow-y: hidden;
  max-height: 80px;
  // overflow-x: auto;
}
</style>
