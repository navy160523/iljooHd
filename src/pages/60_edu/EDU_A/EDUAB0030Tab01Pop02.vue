<!--
  화면명 : 교육계획 일자별 상세(팝업)
  화면개요 : 교육계획에 대한 상세한 정보를 확인하고 계획수정, 실적등록 및 출력이 가능한 팝업이다.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import EDUAB0030Tab01Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop01.vue'
import EDUAB0030Tab01Pop02Pop02 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop02.vue'
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'
import { ButtonVisibility } from 'realgrid'

//***************************************************세팅 영역*********************************************************/
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
const dialog = ref(false)
const grdMain = ref(null)
const grdTime = ref(null)
const grdTarget = ref(null)
const popupButtons = ref(null)
const grdMainFocusIdx = ref(null)
//const REQ_TEXT = ref('')
const TARGET_CNT = ref('교육대상자(0명)')
const eDUAB0030Tab01Pop01 = ref(null)
const eDUAB0030Tab01Pop02Pop01 = ref(null)
const eDUAB0030Tab01Pop02Pop02 = ref(null)
let _Parameters = reactive({})
const emit = defineEmits([])
const popupData = reactive({
  CURR_ID : '',     //교육명
  MORGN_ID : '',    //주관부서
  EDU_DATE : '',    //교육기간(시작)
  EDU_DATE_END : '' //교육기간(종료)
})

const codeList = reactive({
  currId : [], //교육명
  yn : [],     //교육
})

//그룹 목록
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false }, footer: {visible:true} },
  fields : [
    { fieldName: 'EDU_TIME', dataType: 'text', width:'30', header: { text: t('　') }, editable: false },
    { fieldName: 'TIME_MIDDLE', dataType: 'text', width:'10', header: { text: t('　') }, editable: false },
    { fieldName: 'EDU_TIME_FN', dataType: 'text', width:'30', header: { text: t('　') }, editable: false },
    { fieldName: 'REQ_YN', dataType: 'text', width:'30',header: { text: t('신청교육') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('교육명') }, styleName:'left-column', editable: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', width:'30', header: { text: t('차수') }, editable: false },
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'MORGN_EMP_NO', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'MORGN_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EPLACE_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EPLACE_ETC', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EPLACE_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'LECTURER_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'MORGN_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'MORGN_EMP_DESC', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EDU_CONTENT', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EXAM_YN', dataType: 'text', header: { text: t('해당 강좌 평가여부') }, editable: false, visible: false },
    { fieldName: 'EDU_DATE_END', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'CON_DIV', dataType: 'text', header: { text: t('확정여부') }, editable: false, visible: false },
    { fieldName: 'APP_EMP_NM', dataType: 'text', header: { text: t('결재승인자') }, editable: false, visible: false },
    { fieldName: 'APP_DATE', dataType: 'text', header: { text: t('결재일자') }, editable: false, visible: false },
    { fieldName: 'INSERT_DEPT_CD', dataType: 'text', header: { text: t('INSERT_DEPT_CD') }, editable: false, visible: false },
    { fieldName: 'INSERT_ASGN_CD', dataType: 'text', header: { text: t('INSERT_ASGN_CD') }, editable: false, visible: false },

  ],
  columns: [],
  columnLayout: [
    {
      name:'교육시간',
      direction: 'horizontal',
      items: ['EDU_TIME', 'TIME_MIDDLE', 'EDU_TIME_FN'],
      header: { text : t('교육시간')}
    },
    'REQ_YN', 'CURR_NM', 'EDUTIME_SERIAL', 'CMPNY_DIV',
    'SCHEDULE_ID', 'YEAR', 'EDU_DATE', 'DIVISION',
    'CURR_ID', 'MORGN_EMP_NO', 'MORGN_ID', 'EPLACE_NM',
    'EPLACE_ETC', 'EPLACE_ID', 'LECTURER_ID', 'MORGN_NM',
    'MORGN_EMP_DESC', 'EDU_CONTENT','EXAM_YN', 
    'EDU_DATE_END','INSERT_DEPT_CD','INSERT_ASGN_CD'
  ],
})

// //대상자 목록
const grdTimeProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육일자') }, editable: false },
    { fieldName: 'EDUTIME_SEQ', dataType: 'text', header: { text: t('교시') }, editable: false },
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('시작') }, editable: false },
    { fieldName: 'EDU_TIME_FN', dataType: 'text', header: { text: t('종료') }, editable: false },
    { fieldName: 'LEAD_TIME', dataType: 'text', header: { text: t('시간(분)') }, editable: false },
    { fieldName: 'LECTURER_NM', dataType: 'text', header: { text: t('강사명') }, editable: false },
    { fieldName: 'EPLACE_ETC', dataType: 'text', header: { text: t('교육장소') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'TIME_SEQ', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EDU_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EPLACE_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'EPLACE_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'CON_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'REQ_YN', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'LECTURER_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
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

const grdTargetProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('소속') }, editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable: false },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사용자ID(사번)') }, editable: false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('교육차수') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'ORGN_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'ORGN_NM', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
    { fieldName: 'NON_YN', dataType: 'text', header: { text: t('') }, editable: false, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdTimeProps.columns = grdTimeProps.fields
grdTargetProps.columns = grdTargetProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({queryId : 'EDUAB0030_TAB01_POP02_SEARCH_03', param : { CMPNY_DIV : userStore.cmpnyDiv}})
  ])
  .then(res => {
    console.log("인잇 코드 리스트",res)
    codeList.currId = res[0].ORESULT_CUR
    codeList.yn.push({TXT : 'Y', COD : 'Y'}, {TXT : '', COD : 'N'})
    grdMain.value.setBindingColumn("DIVISION", codeList.yn, "COD", "TXT")
  })
}

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = (data) => {
  _Parameters = data
  console.log("전역변수",_Parameters)
  initCodeList()
  gridRefresh()
  onButtonsClick({id : 'btnSearch'})

  dialog.value = true
}

//버튼 클릭 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){//조회
    onBtnSearch()
  }
  else if(btn.id === 'btnModPlan'){//계획수정
    onBtnModPlan()
  }
  else if(btn.id === 'btnPerfReg'){//실적등록
    onBtnPerfReg()
  }
  else if(btn.id === 'btnPrint'){//출력
    onBtnPrint()
  }
  else if(btn.id === 'btnClose'){//닫기
    emit('onClose', '')
    dialog.value = false
  }
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdTime.value.getDataProvider().setRows([])
  grdTarget.value.getDataProvider().setRows([])
}

//계획수정 버튼 클릭 이벤트
const onBtnModPlan = () => {
  if(grdMain.value.getDataProvider().getRows().length < 1){
    return
  }
  if(isNullCheck(grdMainFocusIdx.value)){
    return
  }
  let focusedRow = grdMain.value.getFocusedRowData()
  let newRow = createNewEduDataTable()
  newRow.CMPNY_DIV = isNullCheck(focusedRow.CMPNY_DIV) === true ? '' : focusedRow.CMPNY_DIV
  newRow.YEAR = isNullCheck(focusedRow.YEAR) === true ? '' : focusedRow.YEAR
  newRow.SCHEDULE_ID = isNullCheck(focusedRow.SCHEDULE_ID) === true ? '' : focusedRow.SCHEDULE_ID
  newRow.DIVISION = isNullCheck(focusedRow.DIVISION) === true ? '' : focusedRow.DIVISION 
  newRow.CURR_ID = isNullCheck(focusedRow.CURR_ID) === true ? '' : focusedRow.CURR_ID
  newRow.EDU_DATE = isNullCheck(focusedRow.EDU_DATE) === true ? '' : dayjs(focusedRow.EDU_DATE).format('YYYYMMDD')

  if(focusedRow.REQ_YN === 'Y'){
    eDUAB0030Tab01Pop02Pop02.value.openPopup(newRow, 'Popup')
  }else{
    eDUAB0030Tab01Pop01.value.openPopup(newRow)
  }
  
}

//실적등록 버튼 클릭 이벤트
const onBtnPerfReg = () => {
  if(grdMain.value.getDataProvider().getRows().length < 1){
    return
  }
  let focusData = grdMain.value.getGridView().getCurrent().dataRow
  let focusedRow = grdMain.value.getDataProvider().getJsonRow(focusData)

  if(isNullCheck(focusedRow)){
    return
  }
  //let focusedRow = grdMain.value.getFocusedRowData()
  console.log("포커스 메인 로우",focusedRow)
  if(focusedRow.CON_DIV !== 'Y'){
    Message.warn(t('확정되지 않은 교육은 실적 입력을 할 수 없습니다.'))
    return
  }

  let dt = createNewEduDataTable()

  dt.CMPNY_DIV = isNullCheck(focusedRow.CMPNY_DIV) === true ? '' : focusedRow.CMPNY_DIV
  dt.YEAR = isNullCheck(focusedRow.YEAR) === true ? '' : focusedRow.YEAR
  dt.SCHEDULE_ID = isNullCheck(focusedRow.SCHEDULE_ID) === true ? '' : focusedRow.SCHEDULE_ID
  dt.CURR_ID = _Parameters.CURR_ID
  dt.EDU_DATE = _Parameters.EDU_DATE
  dt.REQ_YN = focusedRow.REQ_YN

  dt.EDUTIME_SERIAL = focusedRow.EDUTIME_SERIAL
  console.log("디티확인",dt)
  dt.EDATE_FROM = popupData.EDU_DATE
  dt.EDATE_TO = popupData.EDU_DATE_END
  dt.SAVE_YN = 'Y'
  eDUAB0030Tab01Pop02Pop01.value.openPopup(dt)
}

//부서/협력사 교육 실적 팝업창 오픈 파라미터 세팅
const createNewEduDataTable = () => {
  let newRow = {CMPNY_DIV : '', YEAR : '', SCHEDULE_ID : '', EDU_DIV : '', CURR_ID : '', MORGN_ID : '',
                MORGN_EMP_NO : '', MORGN_BSNSCD : '', MORGN_DEPTCD : '', MORGN_DEPTNM : '',
                EDU_TITLE : '', TARGET_DIV : '', TARGET_DETAIL : '', EDATE_FROM : '', EDATE_TO : '',
                LEAD_TIME : '', EPLACE_DIV : '', EPLACE_ID : '', EPLACE_ETC : '', EDUPOSSIBLE_NUM : '',
                LECTURER_ID : '', EDU_CONTENT : '', ATTACH_KEY : '', LECTURER_NM : '', CON_DIV : '',
                EPLACE_NM : '', EPLACE_NUM : '', DIVISION : '', EDU_DATE : '', INSERT_USER_ID : '',
                SEND_YN : '', REQ_YN : '', SAVE_YN : '', APP_EMP_NO : '', APP_REQ_EMP_NO : '',
                APP_STATUS : '', APPEMPNO_NM : '', APPSTATUS_NM : ''}
 
  return newRow
}

//출력 버튼 클릭 이벤트
const onBtnPrint = () => {
  reportName.value = '/manage/hse/EDUAB0030_TAB01_POP02_01.ozr'
  let focusedRow = grdMain.value.getFocusedRowData()
  console.log("포커스드 로우 데이터!",focusedRow)
  let currIdIndex = codeList.currId.findIndex(e => e.CURR_ID === popupData.CURR_ID)
  let grdTimeLength = grdTime.value.getDataProvider().getRows().length
  let grdMainLength = grdMain.value.getDataProvider().getRows().length
  let grdTargetLength = grdTarget.value.getDataProvider().getRows().length
  if(isNullCheck(focusedRow)){
    return
  }
  let sCURR_NM = codeList.currId[currIdIndex].CURR_NM
  let sMORGN_NM = popupData.MORGN_ID
  let sEDU_DATE = ''
  let sEDU_TIME = ''
  let sEPLACE_DIV = ''
  let sEPLACE_NM = ''
  let sLECTURER_NM = ''
  let sEDU_CONTENT = ''
  let sAPP_EMP_NM = ''
  let sAPP_DATE = ''
  let sTARGET_TITLE = ''
  if(isNullCheck(popupData.EDU_DATE) || isNullCheck(popupData.EDU_DATE_END)){
    sEDU_DATE = ''
  }else{
    if(popupData.EDU_DATE === popupData.EDU_DATE_END){
      sEDU_DATE = popupData.EDU_DATE
    }else{
      sEDU_DATE = popupData.EDU_DATE + ' ~ ' + popupData.EDU_DATE_END
    }
  }

  if(grdTimeLength < 1){
    sEDU_TIME = ''
  }else{
    let minEDU_TIME = ''
    let maxEDU_TIME_FN = ''
    for(let i = 0; i < grdTimeLength; i++){
      // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
      // if(minEDU_TIME === ''){
      //   minEDU_TIME = grdTime.value.getGridView().getValues(i).EDU_TIME
      // }
      // if(Number(minEDU_TIME) > Number(grdTime.value.getGridView().getValues(i).EDU_TIME)){
      //   minEDU_TIME = grdTime.value.getGridView().getValues(i).EDU_TIME
      // }

      // if(maxEDU_TIME_FN === ''){
      //   maxEDU_TIME_FN = grdTime.value.getGridView().getValues(i).EDU_TIME_FN
      // }
      // if(Number(maxEDU_TIME_FN) < Number(grdTime.value.getGridView().getValues(i).EDU_TIME_FN)){
      //   maxEDU_TIME_FN = grdTime.value.getGridView().getValues(i).EDU_TIME_FN
      // }
      if(minEDU_TIME === ''){
        minEDU_TIME = grdTime.value.getRowData(i).EDU_TIME
      }
      if(Number(minEDU_TIME) > Number(grdTime.value.getRowData(i).EDU_TIME)){
        minEDU_TIME = grdTime.value.getRowData(i).EDU_TIME
      }

      if(maxEDU_TIME_FN === ''){
        maxEDU_TIME_FN = grdTime.value.getRowData(i).EDU_TIME_FN
      }
      if(Number(maxEDU_TIME_FN) < Number(grdTime.value.getRowData(i).EDU_TIME_FN)){
        maxEDU_TIME_FN = grdTime.value.getRowData(i).EDU_TIME_FN
      }
    }
    sEDU_TIME = minEDU_TIME + ' ~ ' + maxEDU_TIME_FN
  }
  if(grdTimeLength > 0){
    // if(grdTime.value.getGridView().getValues(0).EPLACE_DIV === 'A'){
    if(grdTime.value.getRowData(0).EPLACE_DIV === 'A'){
      sEPLACE_DIV = '■안전교육장 □기타'
    }else{
      sEPLACE_DIV = '□안전교육장 ■기타'
    }
    // sEPLACE_NM = grdTime.value.getGridView().getValues(0).EPLACE_ETC
    sEPLACE_NM = grdTime.value.getRowData(0).EPLACE_ETC

    for(let i = 0; i < grdTimeLength; i++){
      if(sLECTURER_NM === ''){
        // sLECTURER_NM = grdTime.value.getGridView().getValues(i).LECTURER_NM
        sLECTURER_NM = grdTime.value.getRowData(i).LECTURER_NM
      }else{
        //sLECTURER_NM += '/ ' + grdTime.value.getGridView().getValues(i).LECTURER_NM
        sLECTURER_NM += '/ ' + grdTime.value.getRowData(i).LECTURER_NM
      }
      
    }
  }

  if(grdMainLength > 0 && !isNullCheck(focusedRow)){
    sEDU_CONTENT = isNullCheck(focusedRow.EDU_CONTENT) === true ? '' : focusedRow.EDU_CONTENT
    sAPP_EMP_NM = isNullCheck(focusedRow.APP_EMP_NM) === true ? '' : focusedRow.APP_EMP_NM
    sAPP_DATE = isNullCheck(focusedRow.APP_DATE) === true ? '' : focusedRow.APP_DATE

    sTARGET_TITLE = '※ 교육대상자( ' + grdTargetLength + '명)'
  }else{
    sTARGET_TITLE = '※ 교육대상자'
  }
  //2024-04-05 리포트 추가, 리포트 데이터 쿼리 추가필요함

  printParams.value = [
    "IN_CMPNY_DIV="+focusedRow.CMPNY_DIV,
    "IN_YEAR="+focusedRow.YEAR,
    "IN_SCHEDULE_ID="+focusedRow.SCHEDULE_ID,
    "IN_EDUTIME_SERIAL="+focusedRow.EDUTIME_SERIAL,
    "IN_CURR_NM="+sCURR_NM,
    "IN_MORGN_NM="+sMORGN_NM,
    "IN_EDU_DATE="+sEDU_DATE,
    "IN_EDU_TIME="+sEDU_TIME,
    "IN_EPLACE_DIV="+sEPLACE_DIV,
    "IN_EPLACE_NM="+sEPLACE_NM,
    "IN_LECTURER_NM="+sLECTURER_NM,
    "IN_EDU_CONTENT="+sEDU_CONTENT,
    "IN_APP_EMP_NM="+sAPP_EMP_NM,
    "IN_APP_DATE="+sAPP_DATE,
    "IN_TARGET_TITLE="+sTARGET_TITLE
  ]
  console.log("CURR_NM=",sCURR_NM)
  console.log("MORGN_NM=",sMORGN_NM)
  console.log("EDU_DATE=",sEDU_DATE)
  console.log("EDU_TIME=",sEDU_TIME)
  console.log("EPLACE_DIV=",sEPLACE_DIV)
  console.log("EPLACE_NM=",sEPLACE_NM)
  console.log("LECTURER_NM=",sLECTURER_NM)
  console.log("EDU_CONTENT=",sEDU_CONTENT)
  console.log("APP_EMP_NM=",sAPP_EMP_NM)
  console.log("APP_DATE=",sAPP_DATE)
  console.log("TARGET_TITLE=",sTARGET_TITLE)
  console.log("CMPNY_DIV=",focusedRow.CMPNY_DIV)
  console.log("YEAR=",focusedRow.YEAR)
  console.log("SCHEDULE_ID=",focusedRow.SCHEDULE_ID)
  console.log("EDUTIME_SERIAL=",focusedRow.EDUTIME_SERIAL)

  showOz.value = true
}

//교육계획 상세 포커스 변경 시 이벤트
const onGrdMainRowChanged = (grid, oldIdx, newIdx) => {

  if(grdMainFocusIdx == ''){
    grdMainFocusIdx.value = newIdx
  }
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  // let grdMainDataRow = grdMain.value.getGridView().getValues(newIdx)
  let grdMainDataRow = grdMain.value.getRowData(newIdx)

  // if(_Parameters.EDU_GUBUN === 'B' && grdMainDataRow.REQ_YN === 'Y'){
  //   REQ_TEXT.value = '신청교육은 계획 실적 조회만 가능(신청교육=\"Y\"인 교육)'
  // }else{
  //   REQ_TEXT.value = ''
  // }
  let sINSERT_DEPT_CD = grdMainDataRow.INSERT_DEPT_CD
  let sINSERT_ASGN_CD = grdMainDataRow.INSERT_ASGN_CD
  let suserDiv = userStore.userDiv
  let sdeptCd = userStore.deptCd
  let sasgnCd = userStore.asgnCd
  

  console.log("sINSERT_DEPT_CD=",sINSERT_DEPT_CD)
  console.log("sINSERT_ASGN_CD=",sINSERT_ASGN_CD)
  console.log("suserDiv=",suserDiv)
  console.log("sdeptCd=",sdeptCd)
  console.log("sasgnCd=",sasgnCd)

  if(grdMainFocusIdx.value !== newIdx){
    setControlValues(grdMainDataRow)
  }

  if(suserDiv === 'A' && sINSERT_DEPT_CD === sdeptCd) {  
    popupButtons.value.disableBtn('btnModPlan', false)  
    popupButtons.value.disableBtn('btnPerfReg', false)
  } else if(suserDiv === 'B' && sINSERT_ASGN_CD === sasgnCd){
    popupButtons.value.disableBtn('btnModPlan', false)  
    popupButtons.value.disableBtn('btnPerfReg', false)
  } else if(userStore.authGrpCd.includes('GRP00414')){
    popupButtons.value.disableBtn('btnModPlan', false)  
    popupButtons.value.disableBtn('btnPerfReg', false)
  } else {
    popupButtons.value.disableBtn('btnModPlan', true)  
    popupButtons.value.disableBtn('btnPerfReg', true)
  }

  grdMainFocusIdx.value = newIdx
  
}

//일별 교시 상세, 대상자 목록 조회 파라미터 데이터 바인딩
const setControlValues = dr => {
  console.log("셋 컨트롤 밸류",dr)
  if(isNullCheck(dr)){
    return
  }
  let sCURR_ID = isNullCheck(dr.CURR_ID) === true ? '' : dr.CURR_ID
  popupData.CURR_ID = sCURR_ID

  let sFN_YN = isNullCheck(dr.FINISH_YN) === true ? '' : dr.FINISH_YN
  // let sMORGN_ID = isNullCheck(dr.MORGN_ID) === true ? '' : dr.MORGN_ID
  // let sMORGN_EMP_NO = isNullCheck(dr.MORGN_EMP_NO) === true ? '' : dr.MORGN_EMP_NO
  // let sMORGN_EMP_DESC = isNullCheck(dr.MORGN_EMP_DESC) === true ? '' : dr.MORGN_EMP_DESC

  popupData.MORGN_ID = isNullCheck(dr.MORGN_NM) === true ? '' : dr.MORGN_NM
  popupData.EDU_DATE = isNullCheck(dr.EDU_DATE) === true ? '' : dr.EDU_DATE
  popupData.EDU_DATE_END = isNullCheck(dr.EDU_DATE_END) === true ? '' : dr.EDU_DATE_END

  onGrdTargetSearch(dr)
  onGrdTimeSearch(dr)
}

const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}
//************************************************이벤트 영역(종료)*********************************************************/
//***************************************************조회 영역**************************************************************/

//교육계획 상세 조회
const onBtnSearch = () => {
  let searchParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    EDU_DATE : _Parameters.EDU_DATE,
    BSNS_CD : _Parameters.BSNS_CD,
    DEPT_CD : _Parameters.DEPT_CD,
    ASGN_CD : _Parameters.ASGN_CD,
    USER_ID : userStore.userId,
  }
  if(_Parameters.REQ_YN === 'Y'){
    searchParams.REQ_YN = _Parameters.REQ_YN
  }else{
    searchParams.REQ_YN = ''
  }
  commonSearchApi({queryId : 'EDUAB0030_TAB01_POP02_SEARCH_01', param : searchParams}).then(res => {
    console.log("메인 그리드 조회 RES :::: >>>>", res)
    if(res.ORESULT_CUR.length > 0){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      Message.success(t('조회되었습니다.'))
      grdMain.value.getGridView().setFocus(grdMainFocusIdx.value)
      // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
      // onGrdTimeSearch(grdMain.value.getGridView().getValues(grdMainFocusIdx.value))
      onGrdTimeSearch(grdMain.value.getRowData(grdMainFocusIdx.value))
    }else{
      Message.warn(t('데이터가 없습니다.'))
    }

  })
}

//일별 교시 상세 조회
const onGrdTimeSearch = grdMainDataRow => {
  let searchParams = {
    CMPNY_DIV : grdMainDataRow.CMPNY_DIV,
    YEAR : grdMainDataRow.YEAR,
    SCHEDULE_ID : grdMainDataRow.SCHEDULE_ID,
    EDUTIME_SERIAL : grdMainDataRow.EDUTIME_SERIAL
  }

  commonSearchApi({queryId : 'EDUAB0030_TAB01_POP02_SEARCH_07', param : searchParams}).then(res => {
    console.log("일별 교시 상세 조회 후 : ",res)
    grdTime.value.getDataProvider().setRows(res.ORESULT_CUR)
    onGrdTargetSearch(res.ORESULT_CUR[0])
  })
}

//교육 대상자 조회
const onGrdTargetSearch = grdMainDataRow => {
  let searchParams = {
    CMPNY_DIV : grdMainDataRow.CMPNY_DIV,
    YEAR : grdMainDataRow.YEAR,
    SCHEDULE_ID : grdMainDataRow.SCHEDULE_ID,
    EDUTIME_SERIAL : grdMainDataRow.EDUTIME_SERIAL
  }

  commonSearchApi({queryId : 'EDUAB0030_TAB01_POP02_SEARCH_02', param : searchParams}).then(res => {
    console.log("교육 대상자 조회 : ",res)
    if(res.ORESULT_CUR.length > 0){
      res.ORESULT_CUR.forEach(val => {
        if(isNullCheck(val.ASGN_FULL_NM) && !isNullCheck(val.ASGN_NM)){
          val.ASGN_FULL_NM = val.ASGN_NM
        }
      })
      grdTarget.value.getDataProvider().setRows(res.ORESULT_CUR)
      TARGET_CNT.value = '교육대상자(' + res.ORESULT_CUR.length + '명)'
    }else{
      grdTarget.value.getDataProvider().setRows([])
      TARGET_CNT.value = '교육대상자(0명)'
    }
  })
}


//*************************************************조회 영역(종료)**********************************************************/

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
      <span>교육계획 일자별 상세</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <v-card-title class="d-flex pa-4 pb-2" style="justify-content: space-between;">
        <div></div>
        <!-- <div>{{ REQ_TEXT }}</div> -->
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :button-list="['btnModPlan', 'btnPerfReg', 'btnPrint','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">

        <div class="d-flex" style="height:100%">
          <div class="flex-column mr-2" style="width:35%">
            <v-sheet width="100%" height="65%" class="flex-column mr-10">
              <div class="flex-column" style="width:100%; height:100%">
                <IGridTitle
                  :title="$t('교육계획 상세')"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  :column-layout="grdMainProps.columnLayout"
                  @onCurrentRowChanged="onGrdMainRowChanged"
                />
              </div>
            </v-sheet>
            <v-sheet width="100%" height="20%" class="flex-column mt-12">
              <IGridTitle
                :title="$t('상세')"
              >
                <template #editors />
              </IGridTitle>
              <div class="searchArea">
                <div class="d-flex mb-2 ">
                  <i-select
                    :label="$t('분류/교육명')"
                    leftLabel
                    v-model="popupData.CURR_ID"
                    :items="codeList.currId"
                    item-title="CURR_NM"
                    item-value="CURR_ID"
                    labelWidth="70px"
                    width="380px"
                    readonly
                  />
                </div>
                <div class="d-flex mb-2">
                  <i-input
                    :label="$t('주관부서')"
                    leftLabel
                    v-model="popupData.MORGN_ID"
                    labelWidth="70px"
                    width="380px"
                    readonly
                  />
                </div>
                <div class="d-flex">
                  <i-input
                    :label="$t('교육기간')"
                    leftLabel
                    v-model="popupData.EDU_DATE"
                    labelWidth="70px"
                    width="216px"
                    class="ma-0 mr-2"
                    readonly
                  />
                  <i-input
                    :label="$t('-')"
                    leftLabel
                    v-model="popupData.EDU_DATE_END"
                    width="156px"
                    class="ma-0"
                    readonly
                  />
                </div>
              </div>
            </v-sheet>
          </div>
          <div class="flex-column" style="width:65%">
            <v-sheet width="100%" height="30%" class="flex-column ">
              <div class="flex-column" style="width:100%; height:100%">
                <IGridTitle
                  :title="$t('일별 교시 상세')"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdTime"
                  :grid-view-option="grdTimeProps.gridViewOption"
                  :fields="grdTimeProps.fields"
                  :columns="grdTimeProps.columns"
                  :column-layout="grdTimeProps.columnLayout"
                />
              </div>
            </v-sheet>
            <v-sheet width="100%" height="55%" class="flex-column mt-12">
              <div class="flex-column" style="width:100%; height:100%">
                <IGridTitle
                  :title="TARGET_CNT"
                >
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grdTarget"
                  :grid-view-option="grdTargetProps.gridViewOption"
                  :fields="grdTargetProps.fields"
                  :columns="grdTargetProps.columns"
                />
              </div>
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  
  <EDUAB0030Tab01Pop01 ref="eDUAB0030Tab01Pop01" @onClose="onBtnSearch"/>
  <EDUAB0030Tab01Pop02Pop01 ref="eDUAB0030Tab01Pop02Pop01" @onClose="onBtnSearch"/>
  <EDUAB0030Tab01Pop02Pop02 ref="eDUAB0030Tab01Pop02Pop02" @onClose="onBtnSearch"/>
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
