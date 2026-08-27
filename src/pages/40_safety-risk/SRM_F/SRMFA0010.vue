<!--
  화면명 : 안전긴급예산 등록 팝업
  화면개요 : 안전긴급예산 내용을 등록하고 결제진행 하는 화면
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import { commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import { commonSearchApi, getCodeList, commonRequest, commonExecuteApi, commonExecuteApi2,commonSendApi, commonRequest3 } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import { useI18n } from "vue-i18n"
import dayjs from 'dayjs'
import _ from "lodash"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import OZReport from '@/components/OZReport.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' // 결재팝업
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useLogsStore } from '@hiway/stores/logs'

//******************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const grdTitle = ref(null)
const t = useI18n().t //다국어
const grdMain = ref(null)
const grdSub = ref(null)
const grdPic1 = ref(null)
const dialog = ref(false)
const empPopup = ref(null)
const approvalPopup = ref(null) // 결재
const ckEditor = ref(null)
const interTextArea = ref(null)
// OzReport 팝업 여부
const showOz = ref(false)
const fileUploadPopup = ref(null)
const emit = defineEmits(['saved'])

const props = defineProps({
  editorId: {
    type: String, 
    default: "srmfa0010",
  },
})

//Area Visible
const areaVisible = reactive({
  SAFETY : true,
})

//등록데이터
const popupDatas = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YYYY : dayjs().format("YYYY"),
  EB_COD : '',
  SOL_CONTENT : '',
  EX_EFFECT : '',
  EX_GUBN_BF : '',
  EX_GUBN : '',
  BG_FAC_INV : '',
  BG_CUR_EXP : '',
  BG_TOTAL : '',
  EB_SDATE : '',
  EB_EDATE : '',
  MANAGER_ID : '',
  COST_RESULT : '',
  SA_OPIN : '',
  SOL_RESULT : '',
  SRM_ID : '',
  SRM_NM: '',
  INTER_OPIN : '',
  REV_DATE : '',
  EXEC_DATE : '',
  BSNS_CD : '',
  DEPT_CD : '',
  PART_GUBN : '',
  LGUBN : '',
  SGUBN : '',
  STATUS : '',
  USER_ID : '',
  TASK_SEQ : '',
  RISK_NM : '',
  CUR_PROB : '',
  FILE_ID_1 : '',
  FILE_ID_2 : '',
  FILE_ID_3 : '',
  FILE_ID_4 : '',
  FILE_GUBN : '',
  AD_FILE_ID : '',

  RD_FILE_ID : '',
  RK_FILE_LIST :  {
                    src: [],
                    art: [],
                    fileName: [],
                    idx : 0,
                  },
  RP_FILE_ID : '',
  BG_FILE_LIST :  {
                    src: [],
                    art: [],
                    fileName: [],
                    idx : 0,
                  },
  MANAGER_NM : '',
  BSNS_NM : '',
  DEPT_NM : '',
  RESULT_POINT : 0,
  RESULT_MESSAGE : '지원가능',
  RESULT_PIC_NM : 'numeric-9-circle-outline',
  RESULT_PIC_COLOR : 'blue',
  TEXT_INPUT:'',
  FAC_CNT : 11,
  POP_DIV : 'REG',
  SGUBN_DESC : '',
})

//코드리스트
const codeList = reactive({
  EX_GUBN : [],
  COST_RESULT:[{ COD : 'BS', TXT : '사업부 원가 예산 지원' }, { COD : 'DS', TXT : '부서 내 자체 예산 활용' }, { COD : 'SS', TXT : '안전긴급예산 지원' }],
  LGUBN : [],
  SGUBN : [],
  SOL_RESULT:[{ COD : 'A', TXT : '수용' }, { COD : 'D', TXT : '보류' }, { COD : 'R', TXT : '반려' }],
  SRM_NM:[],
  FAC01:[{COD : '1', TXT : '1'},
         {COD : '2', TXT : '2'},
         {COD : '3', TXT : '3'},
         {COD : '4', TXT : '4'},
         {COD : '5', TXT : '5'}],
  FAC02:[{COD : '1', TXT : '1'},
         {COD : '2', TXT : '2'},
         {COD : '3', TXT : '3'},
         {COD : '4', TXT : '4'},
         {COD : '5', TXT : '5'}],
  FAC03:[{COD : '1', TXT : '1'},
         {COD : '2', TXT : '2'},
         {COD : '3', TXT : '3'},
         {COD : '4', TXT : '4'},
         {COD : '5', TXT : '5'}],
  FAC04:[{COD : '1', TXT : '1'},
         {COD : '2', TXT : '2'},
         {COD : '3', TXT : '3'},
         {COD : '4', TXT : '4'},
         {COD : '5', TXT : '5'}],
  FAC05:[{COD : '2', TXT : '없음'},
         {COD : '1', TXT : '미흡'},
         {COD : '0', TXT : '완료'}],
  FAC06:[{COD : '0', TXT : '있음'},
         {COD : '1', TXT : '없음'}],
  FAC07:[{COD : '0', TXT : '있음'},
         {COD : '1', TXT : '없음'}],
  FAC08:[{COD : '0', TXT : '개선없음'},
         {COD : '0.5', TXT : '1단계 개선'},
         {COD : '1', TXT : '2단계 개선'},
         {COD : '2', TXT : '3단계 개선'}],
  FAC09:[{COD : '1', TXT : '1천만원 이하'},
         {COD : '1.25', TXT : '1~5천만원'},
         {COD : '1.75', TXT : '5천만원~2억원'},
         {COD : '2', TXT : '2억원이상'}],
  FAC10:[{COD : '0', TXT : '해당없음'},
         {COD : '1', TXT : '해당'}],
  FAC11:[{COD : '0', TXT : '해당없음'},
         {COD : '1', TXT : '해당'}],
  CAL_DATA:[],
})

//결재단계 opacity변수
const appLvOpacitys = reactive({
  OPA1 : 1,
  OPA2 : 1,
  OPA3 : 1,
  OPA4 : 1,
  OPA5 : 1,
})

//결재단계 결과변수
const appLvResult = reactive({
  RES1 : '',
  RES2 : '',
  RES3 : '',
  RES4 : '',
  RES5 : '',
})

//데이터 초기화
const clearData = async () => {
  popupDatas.SOL_CONTENT = ''
  popupDatas.EX_EFFECT = ''
  popupDatas.EX_GUBN_BF = ''
  popupDatas.EX_GUBN = ''
  popupDatas.BG_FAC_INV = ''
  popupDatas.BG_CUR_EXP = ''
  popupDatas.BG_TOTAL = ''
  popupDatas.EB_SDATE = ''
  popupDatas.EB_EDATE = ''
  popupDatas.MANAGER_ID = ''
  popupDatas.COST_RESULT = ''
  popupDatas.SA_OPIN = ''
  popupDatas.SOL_RESULT = ''
  popupDatas.SRM_ID = ''
  popupDatas.SRM_NM= ''
  popupDatas.INTER_OPIN = ''
  popupDatas.REV_DATE = ''
  popupDatas.EXEC_DATE = ''
  popupDatas.BSNS_CD = ''
  popupDatas.DEPT_CD = ''
  popupDatas.PART_GUBN = ''
  popupDatas.LGUBN = ''
  popupDatas.SGUBN = ''
  popupDatas.STATUS = ''
  popupDatas.USER_ID = ''
  popupDatas.RISK_NM = ''
  popupDatas.CUR_PROB = ''
  popupDatas.FILE_ID_1 = ''
  popupDatas.FILE_ID_2 = ''
  popupDatas.FILE_ID_3 = ''
  popupDatas.FILE_ID_4 = ''
  popupDatas.MANAGER_NM = ''
  popupDatas.BSNS_NM = ''
  popupDatas.DEPT_NM = ''
  popupDatas.AD_FILE_ID = ''
  popupDatas.RD_FILE_ID = ''
  popupDatas.RESULT_PIC_NM = ''
  popupDatas.RK_FILE_LIST =  {
    src: [],
    art: [],
    fileName: [],
    idx : 0,
  }
  popupDatas.RP_FILE_ID = '',
  popupDatas.BG_FILE_LIST =  {
    src: [],
    art: [],
    fileName: [],
    idx : 0,
  }
  popupDatas.MANAGER_NM = ''
  popupDatas.BSNS_NM = ''
  popupDatas.DEPT_NM = ''

  if(grdMain.value != null && grdMain.value.getDataProvider().rowCount > 0){ grdMain.value.getDataProvider().clearRows() }
  if(grdSub.value != null && grdSub.value.getDataProvider().rowCount > 0){ grdSub.value.getDataProvider().clearRows() }
  if(grdPic1.value != null && grdPic1.value.getDataProvider().rowCount > 0){ grdPic1.value.getDataProvider().clearRows() }
  grdMain.value.getDataProvider().addRow({
    FAC01 : '',FAC02 : '',FAC03 : '',FAC04 : '',FAC05 : '',FAC06 : '',FAC07 : '',FAC08 : '',FAC09 : '',FAC10 : '',FAC11 : ''
  })
  grdSub.value.getDataProvider().addRow({
    RISK : '',URGENCY : '',COST_EFFECT : '',ETC_ELEMENT : ''
  })
}

const CardNewsImg = reactive([])
const CardEduImg = reactive([])

//******************************세팅 영역(종료)***************************************************/
// 투자타당성 검토 요소 그리드 셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'FAC01', dataType: 'text', header: { text: t('강도(개선전)') }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC01 }, lookupDisplay: true,width: '70' },
    { fieldName: 'FAC02', dataType: 'text', header: { text: t('빈도(개선전)') }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC02 }, lookupDisplay: true,width: '70' },
    { fieldName: 'FAC03', dataType: 'text', header: { text: t('강도(개선후)') }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC03 }, lookupDisplay: true,width: '70' },
    { fieldName: 'FAC04', dataType: 'text', header: { text: t('빈도(개선후)') }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC04 }, lookupDisplay: true, width: '70' },
    { fieldName: 'FAC05', dataType: 'text', header: { text: t('방호조치도') }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC05 }, lookupDisplay: true,width: '70' },
    { fieldName: 'FAC06', dataType: 'text', header: { text: t('법규위반사항') }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC06 }, lookupDisplay: true,width: '70' },
    { fieldName: 'FAC07', dataType: 'text', header: { text: t('중대성사고이력') }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC07 }, lookupDisplay: true,width: '70' },
    { fieldName: 'FAC08', dataType: 'text', header: { text: t('위험성점수\n감소분'), styleName : 'orange-column multiline-editor' }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC08 }, lookupDisplay: true,width: '70' },
    { fieldName: 'FAC09', dataType: 'text', header: { text: t('투입비용') }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC09 }, lookupDisplay: true,width: '70' },
    { fieldName: 'FAC10', dataType: 'text', header: { text: t('고질적 안전문제') }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC10 }, lookupDisplay: true,width: '70' },
    { fieldName: 'FAC11', dataType: 'text', header: { text: t('기타 지적사항') }, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true },
     lookupData:  { value: "COD", label: "TXT", list: codeList.FAC11 }, lookupDisplay: true,width: '70' },
  ],
  columns : [],
  columnLayout: [
    'FAC01', 
    'FAC02', 
    'FAC03', 
    'FAC04', 
    'FAC05', 
    'FAC06', 
    'FAC07', 
    'FAC08', 
    'FAC09', 
    'FAC10', 
    'FAC11', 
  ],
})

// 투자타당성 검토 점수 결과 그리드 셋팅
const grdSubProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'RISK', dataType: 'text', header: { text: t('위험성') }, editable: false, width: '200' },
    { fieldName: 'URGENCY', dataType: 'text', header: { text: t('긴급성') }, editable: false, width: '200' },
    { fieldName: 'COST_EFFECT', dataType: 'text', header: { text: t('비용대비 효과') }, editable: false, width: '200' },
    { fieldName: 'ETC_ELEMENT', dataType: 'text', header: { text: t('기타요소') }, editable: false, width: '200' },],
  columns : [],
})
// 첨부사진 그리드 셋팅
const grdPic1Props = reactive({
  gridViewOption : {stateBar: { visible: false }, edit: { editable: false }, checkBar: { visible: true }},
  keys : [],
  fields : [
    { fieldName: 'OPINION_CMPNY', dataType: 'text', header: { text: t('파일명'), styleName: 'header_color'}},

    { fieldName: 'FILE_ID', dataType: 'text', visible: false }, 
    { fieldName: 'FILE_NO', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'cnt', dataType: 'text', visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields
grdPic1Props.columns = grdPic1Props.fields

//팝업 이벤트
const openPopupPop = gbn => {
  if(gbn === 'EMP'){
    empPopup.value.openPopup({
      EMP_NM : popupDatas.MANAGER_NM,
    })
  }else if(gbn === 'ebADUp'){
    uploadPop(gbn)
  }else if(gbn === 'ebRPUp'){
    uploadPop(gbn)
  }else if(gbn === 'ebRDUp'){
    uploadPop(gbn)
  }
}

//업로드 팝업 처리 함수
const uploadPop = gbn =>{
  let fileInfo = {}
  if(gbn === 'ebADUp'){
    fileInfo = popupDatas.AD_FILE_ID
  }else if(gbn === 'ebRPUp'){
    fileInfo = popupDatas.RP_FILE_ID
  }else if(gbn === 'ebRDUp'){
    fileInfo = popupDatas.RD_FILE_ID
  }
  popupDatas.FILE_GUBN = gbn
  if (isNullCheck(fileInfo)) {
    fileUploadPopup.value.setGuid()
    fileInfo = fileUploadPopup.value.guid
  } 
  fileUploadPopup.value.openPopup(fileInfo)
}

const afterFileSearch = res => {
  if(popupDatas.FILE_GUBN === 'ebADUp'){
    popupDatas.AD_FILE_ID = res.fileId
  }else if(popupDatas.FILE_GUBN === 'ebRPUp'){
    popupDatas.RP_FILE_ID = res.fileId
    fileSet(res.fileId)
  }else if(popupDatas.FILE_GUBN === 'ebRDUp'){
    popupDatas.RD_FILE_ID = res.fileId
  }
}

//직원 선택후 데이터
const selectedEmpData = res => {
  popupDatas.MANAGER_ID = res.EMP_NO
  popupDatas.MANAGER_NM = res.EMP_NM
  popupDatas.BSNS_CD = res.BSNS_CD
  popupDatas.BSNS_NM = res.BSNS_NM
  popupDatas.DEPT_CD = res.DEPT_CD
  popupDatas.DEPT_NM = res.DEPT_NM
}

//데이터 조회 시작 
const search = async () =>{
  new queryFlowHelper(vm, t)
    .setBefore(beforeSearch1)
    .setQuery(searchData01)
    .setAfter(afterSearch01)
    .showMessage(false)
    .run()
}

//데이터 조회 전 팝업데이터 정리
const beforeSearch1 = () =>{
  clearData()

  return true
}

//데이터 조회
const searchData01 = async () =>{
  return commonSearchApi({
    queryId: "SRMFA0010_SEARCH_01",
    param: { CMPNY_DIV : popupDatas.CMPNY_DIV, EB_COD : popupDatas.EB_COD, TASK_SEQ : popupDatas.TASK_SEQ },
  })
}

//조회 데이터 입력
const afterSearch01 = async res =>{
  if(res.ORESULT_CUR.length > 0){
    let dataRow = res.ORESULT_CUR[0]
    if(dataRow.EB_COD){
      if(areaVisible.SAFETY){
        let grdProvider = grdMain.value.getDataProvider()
        for(let i = 1 ; i <= popupDatas.FAC_CNT ; i++){
          if(i < 10){
            grdProvider.setValue(0, 'FAC0' + i, isNullAndEmpty(dataRow['FAC0' + i]))
          }else{
            grdProvider.setValue(0, 'FAC' + i, isNullAndEmpty(dataRow['FAC' + i]))
          }
        }        
        grdProvider = grdSub.value.getDataProvider()
        grdProvider.setValue(0, 'RISK', isNullAndZero(dataRow.RISK))
        grdProvider.setValue(0, 'URGENCY', isNullAndZero(dataRow.URGENCY))
        grdProvider.setValue(0, 'COST_EFFECT', isNullAndZero(dataRow.COST_EFFECT))
        grdProvider.setValue(0, 'ETC_ELEMENT', isNullAndZero(dataRow.ETC_ELEMENT))
      }

      popupDatas.FILE_ID_1 = dataRow.FILE_ID_1
      if(popupDatas.FILE_ID_1){
        await fileInput('rk', popupDatas.FILE_ID_1)
      }
      
      popupDatas.RESULT_POINT = Math.round(isNullAndZero(dataRow.RISK) + isNullAndZero(dataRow.URGENCY) 
        + isNullAndZero(dataRow.COST_EFFECT) + isNullAndZero(dataRow.ETC_ELEMENT))
      popupDatas.AD_FILE_ID = dataRow.AD_FILE_ID
      popupDatas.BG_CUR_EXP = dataRow.BG_CUR_EXP
      popupDatas.BG_FAC_INV = dataRow.BG_FAC_INV      
      popupDatas.BSNS_CD = dataRow.BSNS_CD
      popupDatas.BSNS_NM = dataRow.BSNS_NM
      popupDatas.CMPNY_DIV = dataRow.CMPNY_DIV
      popupDatas.DEPT_CD = dataRow.DEPT_CD
      popupDatas.DEPT_NM = dataRow.DEPT_NM
      popupDatas.EX_GUBN = dataRow.EX_GUBN
      popupDatas.INTER_OPIN = isNullAndEmpty(dataRow.INTER_OPIN)
      popupDatas.LGUBN = dataRow.LGUBN
      popupDatas.SGUBN = dataRow.SGUBN
      popupDatas.SGUBN_DESC = dataRow.SGUBN_DESC
      popupDatas.MANAGER_ID = dataRow.MANAGER_ID
      popupDatas.MANAGER_NM = dataRow.MANAGER_NM
      popupDatas.SA_OPIN = dataRow.SA_OPIN
      popupDatas.SRM_ID = dataRow.SRM_ID
      popupDatas.SRM_NM = dataRow.SRM_NM
      popupDatas.STATUS = dataRow.STATUS      
      popupDatas.RD_FILE_ID = dataRow.RD_FILE_ID
      popupDatas.RP_FILE_ID = dataRow.RP_FILE_ID
      popupDatas.SOL_CONTENT = dataRow.SOL_CONTENT
      if(!isNullCheck(dataRow.SOL_CONTENT)){
        ckEditor.value.setContent(dataRow.SOL_CONTENT.replaceAll('&lt;', '<').replaceAll('&gt;', '>'))
      }
      popupDatas.SOL_RESULT = dataRow.SOL_RESULT
      popupDatas.COST_RESULT = dataRow.COST_RESULT
      popupDatas.EX_EFFECT = dataRow.EX_EFFECT
      setBgTotal()      
      if(popupDatas.RP_FILE_ID){
        await fileInput('ebRPUp', popupDatas.RP_FILE_ID)
      }
      setResultPoint()
    }
    setStatus()
    popupDatas.TASK_SEQ = dataRow.TASK_SEQ
    popupDatas.CUR_PROB = dataRow.CUR_PROB
    popupDatas.RISK_NM = dataRow.RISK_NM
    popupDatas.EX_GUBN_BF = dataRow.EX_GUBN_BF
    popupDatas.EB_SDATE = dataRow.EB_SDATE
    popupDatas.EB_EDATE = dataRow.EB_EDATE
    if(areaVisible.SAFETY && isNullCheck(grdMain.value.getDataProvider().getValue(0, 'FAC08'))){
      calRisk()
    }
  }
  chkTemp()
}

const fileInput = async (gubn, fileId) =>{
  popupDatas.FILE_GUBN = gubn
  await fileSet(fileId)
}
//*****************************************오픈 팝업********************************************/

const openPopup = async data => {
  vm.$nextTick(() => {
    initCombo()  
  })  

  popupDatas.CMPNY_DIV = data.CMPNY_DIV
  popupDatas.EB_COD = data.EB_COD
  if(popupDatas.EB_COD){
    popupDatas.POP_DIV = 'UPD'
  }
  popupDatas.TASK_SEQ = data.TASK_SEQ

  await search()
  //팝업 오픈
  dialog.value = true 
}

//****************************************오픈 팝업(종료)************************************************/
//널 체크 메서드
const isNullCheck = data => {
  return (data === undefined || data === null || data === '') ? true : false
}

const isNullAndEmpty = data =>{
  return isNullCheck(data) ? '' : data
}

const isNullAndZero = data =>{
  return isNullCheck(data) ? 0 : parseFloat(data)
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const onButtonsClick = async btn => {  
  if (btn.id === 'btnTemporaryStorage') {
    if (isNullAndEmpty(popupDatas.STATUS) === '')
      saveData('')
  } else if (btn.id === 'btnUpdate') {
    saveData('1')
  } else if (btn.id === 'btnReqApply') {
    setApply()
  } else if (btn.id === 'btnClose') {
    emit("saved")
    onClose()
  }
}
//상태표시
const setStatus = () =>{
  let point = [0.5,0.5,0.5,0.5,0.5]
  let message = ['','','','','']
  let status = isNullAndZero(popupDatas.STATUS)
  if(status < 1){

  }else if(status < 5){
    point = [1,0.5,0.5,0.5,0.5]
    message = ['中','','','','']
  }else if(status < 7){
    point = [1,1,0.5,0.5,0.5]
    message = ['完','中','','','']
  }else if(status < 8){
    point = [1,1,1,0.5,0.5]
    message = ['完','完','中','','']
  }else if(status < 9){
    point = [1,1,1,1,0.5]
    message = ['完','完','完','中','']
  }else{
    point = [1,1,1,1,1]
    if(status < 10){
      message = ['完','完','完','完','中']
    }else{
      message = ['完','完','完','完','完']
    }    
  }

  appLvOpacitys.OPA1 = point[0]
  appLvOpacitys.OPA2 = point[1]
  appLvOpacitys.OPA3 = point[2]
  appLvOpacitys.OPA4 = point[3]
  appLvOpacitys.OPA5 = point[4]

  appLvResult.RES1 = message[0]
  appLvResult.RES2 = message[1]
  appLvResult.RES3 = message[2]
  appLvResult.RES4 = message[3]
  appLvResult.RES5 = message[4]
}

//결재 팝업 실행
const setApply = async () =>{
  if(popupDatas.STATUS === '1' || popupDatas.STATUS === '4'){
    await openReqApp()
  }else{
    Message.err('결재를 진행할 수 있는 단계가 아닙니다.')
  }
}

//결재 팝업데이터 생성
const openReqApp = async () =>{
  let reqCon = await reqContents()

  await approvalPopup.value.openPopup({
    CLSS_ID: useLogsStore().vueId,
    TITLE: "안전긴급예산 결재 건",
    CMPNY_DIV: userStore.cmpnyDiv,
    DATA_KEY:
      userStore.cmpnyDiv +
      ";" +
      popupDatas.BSNS_CD +
      ";" +
      popupDatas.DEPT_CD +
      ";" +
      popupDatas.DEPT_CD +
      ";" +
      new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;YEAR',
    REPORT: reqCon, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE: "3", //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: "421", //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE: "CLR_15", //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  })
}

//결재 내용 생성
const reqContents = async () =>{
  let res = await commonSearchApi({
    queryId: "SRMFA0020_POP01_SEARCH_01",
    param: { CMPNY_DIV : popupDatas.CMPNY_DIV, YEAR : dayjs().get("year") },
  })
  console.log('결과',res)
  let reqCon = ''

  // if(popupDatas.STATUS === '1'){
  //   reqCon = `
  //     <html>
      
  //     </html>`
  // }else if(popupDatas.STATUS === '4'){
    reqCon = `
      <html>
      <head>
      <title>OZ HTML</title>
      <style type="text/css">
      <!--
      div.offset{
      position:absolute;
      background-color:transparent;
      left:0px;
      top:0px;
      width:0px;
      height:0px;
      }
      div{
      position:relative;
      box-sizing: border-box;
      -moz-box-sizing: border-box;
      -ms-box-sizing: border-box;
      -webkit-box-sizing: border-box;
      }
      table.one{
      width:100%;
      height:100%;
      border:0;
      }
      table.two{
      width:100%;
      height:100%;
      border:0;
      line-height:80%;
      }
      table.three{
      width:100%;
      height:100%;
      border:0;
      line-height:60%;
      }
      table.four{
      width:100%;
      height:100%;
      border:0;
      line-height:40%;
      }
      table.five{
      width:100%;
      height:100%;
      border:0;
      line-height:20%;
      }
      br{letter-spacing:0;}
      #right{
      text-align:right;
      }
      #f_010w013P000s000P000{
      font-size:10pt;
      line-height:13.0pt;
      letter-spacing:0.0pt;
      }
      font.굴림{
      font-family:굴림;
      }
      #bottom{
      vertical-align:bottom;
      }
      #center{
      text-align:center;
      }
      div.b_0{
      border-width:1px;
      border-color:#000000;
      border-style:solid;
      box-sizing: border-box;
      -moz-box-sizing: border-box;
      -ms-box-sizing: border-box;
      -webkit-box-sizing: border-box;
      }
      #f_012w015P000s000P000{
      font-size:12pt;
      line-height:15.0pt;
      letter-spacing:0.0pt;
      }
      -->
      </style>
      </head>
      <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
      <div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:793px;height:1123px">
      <div class=offset style="z-index:1"><div style=";padding-left:3px;padding-right:3px;left:634px;top:83px;width:133px;height:45px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr id=bottom><td id=right><font id=f_010w013P000s000P000 class=굴림><nobr/>(금액:천원)</font></td></tr></table></div></div>
      <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:128px;width:186px;height:39px;overflow:hidden;background-color:#f2f2f2"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_012w015P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>구&nbsp;&nbsp;&nbsp;분</font></td></tr></table></div></div>
      <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:128px;width:209px;height:39px;overflow:hidden;background-color:#f2f2f2"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_012w015P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>FROM</font></td></tr></table></div></div>
      <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:128px;width:217px;height:39px;overflow:hidden;background-color:#f2f2f2"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_012w015P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>TO</font></td></tr></table></div></div>
      <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:636px;top:128px;width:132px;height:39px;overflow:hidden;background-color:#f2f2f2"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_012w015P000s000P000 class=굴림 style=";font-weight:bold"><nobr/>비&nbsp;&nbsp;&nbsp;고</font></td></tr></table></div></div>
      <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:166px;width:186px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>부서(팀)명</font></td></tr></table></div></div>
      <div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:166px;width:209px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>안전경영부</font></td></tr></table></div></div>
      <div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:166px;width:217px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>`+userStore.deptNm+`</font></td></tr></table></div></div>
      <div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:636px;top:166px;width:132px;height:895px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/></font></td></tr></table></div></div>
      <div class=offset style="z-index:10"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:245px;width:186px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>항&nbsp;&nbsp;&nbsp;목</font></td></tr></table></div></div>
      <div class=offset style="z-index:11"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:245px;width:209px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>소모품-기타소모-상담실</font></td></tr></table></div></div>
      <div class=offset style="z-index:12"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:245px;width:217px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/></font></td></tr></table></div></div>
      <div class=offset style="z-index:13"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:323px;width:186px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>세목(예산코드)</font></td></tr></table></div></div>
      <div class=offset style="z-index:14"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:323px;width:209px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>5339549194</font></td></tr></table></div></div>
      <div class=offset style="z-index:15"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:323px;width:217px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/></font></td></tr></table></div></div>
      <div class=offset style="z-index:16"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:402px;width:186px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>예&nbsp;&nbsp;산&nbsp;&nbsp;명<BR>(투&nbsp;자&nbsp;명)</font></td></tr></table></div></div>
      <div class=offset style="z-index:17"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:402px;width:209px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>소모품-부재료소모품</font></td></tr></table></div></div>
      <div class=offset style="z-index:18"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:402px;width:217px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>`+popupDatas.RISK_NM+`</font></td></tr></table></div></div>
      <div class=offset style="z-index:19"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:480px;width:186px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>연&nbsp;간&nbsp;예&nbsp;산<BR>(A)</font></td></tr></table></div></div>
      <div class=offset style="z-index:20"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:480px;width:209px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>`+res.ORESULT_CUR1[0]['BG_CUR_EXP'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+`</font></td></tr></table></div></div>
      <div class=offset style="z-index:21"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:480px;width:217px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/></font></td></tr></table></div></div>
      <div class=offset style="z-index:22"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:558px;width:186px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>기&nbsp;실&nbsp;적<BR>(B)</font></td></tr></table></div></div>
      <div class=offset style="z-index:23"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:558px;width:209px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>`+res.ORESULT_CUR2[0]['EB_EXE_BG_CUR_EXP'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+`</font></td></tr></table></div></div>
      <div class=offset style="z-index:24"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:558px;width:217px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/></font></td></tr></table></div></div>
      <div class=offset style="z-index:25"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:637px;width:186px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>잔&nbsp;예&nbsp;산<BR>(C=A-B)</font></td></tr></table></div></div>
      <div class=offset style="z-index:26"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:637px;width:209px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>`+ (parseInt(res.ORESULT_CUR1[0]['BG_CUR_EXP']) - parseInt(res.ORESULT_CUR2[0]['EB_EXE_BG_CUR_EXP'])).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +`</font></td></tr></table></div></div>
      <div class=offset style="z-index:27"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:637px;width:217px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/></font></td></tr></table></div></div>
      <div class=offset style="z-index:28"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:715px;width:186px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>변&nbsp;동&nbsp;금&nbsp;액<BR>(D)</font></td></tr></table></div></div>
      <div class=offset style="z-index:29"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:715px;width:209px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>`+ popupDatas.BG_CUR_EXP +`</font></td></tr></table></div></div>
      <div class=offset style="z-index:30"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:715px;width:217px;height:80px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/></font></td></tr></table></div></div>
      <div class=offset style="z-index:31"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:794px;width:186px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>변동후&nbsp;잔예산<BR>(C+D)</font></td></tr></table></div></div>
      <div class=offset style="z-index:32"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:794px;width:209px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>`+ (parseInt(res.ORESULT_CUR1[0]['BG_CUR_EXP']) - parseInt(res.ORESULT_CUR2[0]['EB_EXE_BG_CUR_EXP'])- parseInt(popupDatas.BG_CUR_EXP)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +`</font></td></tr></table></div></div>
      <div class=offset style="z-index:33"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:794px;width:217px;height:79px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/></font></td></tr></table></div></div>
      <div class=offset style="z-index:34"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:27px;top:872px;width:186px;height:189px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/>변동&nbsp;사유</font></td></tr></table></div></div>
      <div class=offset style="z-index:35"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:212px;top:872px;width:209px;height:189px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/></font></td></tr></table></div></div>
      <div class=offset style="z-index:36"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:420px;top:872px;width:217px;height:189px;overflow:hidden;background-color:#ffffff"><table class=one cellPadding=0 cellSpacing=0><tr><td id=center><font id=f_010w013P000s000P000 class=굴림><nobr/></font></td></tr></table></div></div>
      </div>
      </body>
      </html>`
  //}

  return reqCon
}

// 결재 상신 후, 처리 결과 리턴
const approvalResult = (res) => {
  // 결재 상신 완료시, 저장/결재상신 버튼 비활성화
  if(res.toUpperCase() === 'OK')
  {
    commonExecuteApi({ queryId : 'SRMFA0010_UPDATE_01',
                        list  : [{ EB_COD : popupDatas.EB_COD, 
                                CMPNY_DIV : userStore.cmpnyDiv, 
                                STATUS : popupDatas.STATUS === '1' ? '2' : '5', 
                                USER_ID : userStore.userId}] 
                    }).then(()=>{
                              popupDatas.STATUS = popupDatas.STATUS === '1' ? '2' : '5'
                            })
  }
}

//데이터 저장
const saveData = (gubn) => {
  popupDatas.STATUS = gubn
  if (isNullCheck(gubn)) {
    new saveFlowHelper(vm, t)
      .setResultMessage('임시저장이 완료되었습니다.')
      .setBefore(beforeSaveData1)
      .setQuery(saveDataQuery1)
      .setAfter(afterSaveData1)
      .run()
  } else {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSaveData1)
      .setQuery(saveDataQuery1)
      .setAfter(afterSaveData1)
      .run()
  }
}

//저장 전 데이터 체크
const beforeSaveData1 = () =>{
  if(popupDatas.STATUS){

    let itemsResult = ''
    let chkItems = [ckEditor.value.getContent().trim(), popupDatas.EX_EFFECT, popupDatas.EX_GUBN, popupDatas.LGUBN, popupDatas.SGUBN, 
                    popupDatas.BG_FAC_INV, popupDatas.BG_CUR_EXP,
                    popupDatas.EB_SDATE.replaceAll('-', ''), popupDatas.EB_EDATE.replaceAll('-', ''), popupDatas.MANAGER_ID]
    let chkItemsNm = ['개선방안', '기대효과(효과내용)', '기대효과(위험도)', '대구분', '소구분', '시설투자금액', '경상비', 
                      '일정(시작)', '일정(종료)', '담당자']
    for(let i = 0 ; i < chkItems.length ; i++){
      if(isNullCheck(chkItems[i])){
        Message.warn(t('필수값(' + chkItemsNm[i] + ')을 입력해 주세요.'))

        return false
      }
    }    
  }

  return true
}

//저장 전 데이터 체크
const saveDataQuery1 = () =>{
  let saveData = []
  let queryId = ''

  if(areaVisible.SAFETY){

    let mainGrdData = grdMain.value.getDataProvider().getJsonRow(0)
    let subGrdData = grdSub.value.getDataProvider().getJsonRow(0)
    queryId = 'SRMFA0010_SAVE_01'
    saveData.push({
      EB_COD : popupDatas.EB_COD, 		
      CMPNY_DIV : popupDatas.CMPNY_DIV, 	
      SOL_CONTENT : ckEditor.value.getContent(),
      EX_EFFECT : popupDatas.EX_EFFECT, 	
      EX_GUBN : popupDatas.EX_GUBN, 		
      BG_FAC_INV : popupDatas.BG_FAC_INV, 
      BG_CUR_EXP : popupDatas.BG_CUR_EXP, 
      EB_SDATE : popupDatas.EB_SDATE.replaceAll('-', ''), 	
      EB_EDATE : popupDatas.EB_EDATE.replaceAll('-', ''), 	
      MANAGER_ID : popupDatas.MANAGER_ID, 
      COST_RESULT : popupDatas.COST_RESULT,
  
      SA_OPIN : popupDatas.SA_OPIN, 		
      SOL_RESULT : popupDatas.SOL_RESULT, 
      SRM_ID : popupDatas.SRM_ID, 		
      INTER_OPIN : popupDatas.INTER_OPIN,     
      FAC01 : mainGrdData['FAC01'], 			
      FAC02 : mainGrdData['FAC02'], 			
      FAC03 : mainGrdData['FAC03'], 			
      FAC04 : mainGrdData['FAC04'], 			
      FAC05 : mainGrdData['FAC05'], 			
      FAC06 : mainGrdData['FAC06'], 			
      FAC07 : mainGrdData['FAC07'], 			
      FAC08 : mainGrdData['FAC08'], 			
      FAC09 : mainGrdData['FAC09'], 			
      FAC10 : mainGrdData['FAC10'], 			
      FAC11 : mainGrdData['FAC11'], 			
      RISK : subGrdData['RISK'], 			
      URGENCY : subGrdData['URGENCY'], 		
      COST_EFFECT : subGrdData['COST_EFFECT'],
      ETC_ELEMENT : subGrdData['ETC_ELEMENT'],
      REV_DATE : '', 	
      EXEC_DATE : '', 	
      BSNS_CD : popupDatas.BSNS_CD, 		
      DEPT_CD : popupDatas.DEPT_CD, 		
      PART_GUBN : '', 	 
      LGUBN : popupDatas.LGUBN, 			
      SGUBN : popupDatas.SGUBN, 
      SGUBN_DESC : popupDatas.SGUBN_DESC,			
      STATUS : popupDatas.STATUS, 		
      USER_ID : userStore.userId, 		
      TASK_SEQ : popupDatas.TASK_SEQ, 	
      AD_FILE_ID : popupDatas.AD_FILE_ID, 
      RD_FILE_ID : popupDatas.RD_FILE_ID, 
      RP_FILE_ID : popupDatas.RP_FILE_ID, 
    })
  } else {
    queryId = 'SRMFA0010_SAVE_02'
    saveData.push({
      EB_COD : popupDatas.EB_COD, 		
      CMPNY_DIV : popupDatas.CMPNY_DIV, 	
      SOL_CONTENT : ckEditor.value.getContent(),
      EX_EFFECT : popupDatas.EX_EFFECT, 	
      EX_GUBN : popupDatas.EX_GUBN, 		
      BG_FAC_INV : popupDatas.BG_FAC_INV, 
      BG_CUR_EXP : popupDatas.BG_CUR_EXP, 
      EB_SDATE : popupDatas.EB_SDATE.replaceAll('-', ''), 	
      EB_EDATE : popupDatas.EB_EDATE.replaceAll('-', ''), 	
      MANAGER_ID : popupDatas.MANAGER_ID, 
      COST_RESULT : popupDatas.COST_RESULT,
      BSNS_CD : popupDatas.BSNS_CD, 		
      DEPT_CD : popupDatas.DEPT_CD, 		
      PART_GUBN : '', 	
      LGUBN : popupDatas.LGUBN, 			
      SGUBN : popupDatas.SGUBN,
      SGUBN_DESC : popupDatas.SGUBN_DESC,
      STATUS : popupDatas.STATUS, 		
      USER_ID : userStore.userId, 		
      TASK_SEQ : popupDatas.TASK_SEQ, 	
      AD_FILE_ID : popupDatas.AD_FILE_ID, 
      RD_FILE_ID : popupDatas.RD_FILE_ID,
      RP_FILE_ID : popupDatas.RP_FILE_ID, 
    })
  }
  return commonExecuteApi2({ queryId : queryId, list: saveData })
}

//저장 전 데이터 체크
const afterSaveData1 = res =>{
  popupDatas.EB_COD = res.OUT_EB_COD

  // 메일 발송
  afterSaveMailSend(popupDatas.SOL_RESULT)
}

// 안전긴급예산 신청 후 메일 발송
const afterSaveMailSend = async val => {
  let contentArea = ``  // val 값에 따른 내용
  let subjectArea = ''

  if (!val) { // 그냥 저장
    subjectArea = '지원 요청 접수 완료'
    contentArea = `
      <div>
        <span style="font-size:12.0pt;line-height:115%;font-family:'HD현대체 Medium',serif;color:#002554">
          귀하의 <b>안전긴급예산 요청</b>이 접수되었습니다.
          <br/>
          <br/>
          SRM<추진과 담당자 검토 후, 결과 회신 예정입니다.
          <br/>
          자세한 사항은 아래를 참고하여 주시기 바랍니다.
          <br/>
          <br/>
          1. 안전긴급예산 지원 목적: 중대(성) 재해로 이어질 수 있는 현장에 잠재된 만성적 고위험에 대한 "긴급" 개선사항 지원<br/>
          2. 평가요소: <b>위험성, 긴급성, 경제성</b>
          <br/>
          <br/>
          안전에 대한 귀하의 관심에 깊이 감사드립니다.
          <br/>
          <br/>
          안전 안전긴급예산 담당자 안전경영부 유승훈 매니저 (2-3613)
        </span>
      </div>
    `
  } else if (val === 'A') { // 수용
    subjectArea = '지원 요청 검토결과'
    contentArea = `
      <div>
        <span style="font-size:12.0pt;line-height:115%;font-family:'HD현대체 Medium',serif;color:#002554">
          귀하의 <b>안전긴급예산 지원 요청 검토 결과</b>를 아래와 같이 회신 드립니다.
          <br/>
          <br/>
          1. 안전긴급예산 지원 목적: 중대(성) 재해로 이어질 수 있는 현장에 잠재된 만성적 고위험에 대한 "긴급" 개선사항 지원 
          <br/>
          2. 검토 결과: 안전긴급예산 지원
          <br/>
          3. 지원 대상 항목: %SRM_BUDG_COMMENT%
          <br/>
          <br/>
          ※ 안전긴급예산 업무절차: %SRM_BUDG_FLOW% 
          <br/>
          업무절차 후속진행을 위하여, 상기 내용에 대하여 양식 작성 및 HiSEs에서 기안 상신하여 주시기 바랍니다.  
          <br/>
          <br/>
          안전 안전긴급예산 담당자 안전경영부 유승훈 매니저 (2-3613)
        </span>
      </div>
    `
  } else if (val === 'R') { // 반려
    subjectArea = '지원 요청 검토결과'
    contentArea = `
      <div>
        <span style="font-size:12.0pt;line-height:115%;font-family:'HD현대체 Medium',serif;color:#002554">
          귀하의 <b>안전긴급예산 지원 요청 검토 결과</b>를 아래와 같이 회신 드립니다.
          <br/>
          <br/>
          1. 안전긴급예산 지원 목적: 중대(성) 재해로 이어질 수 있는 현장에 잠재된 만성적 고위험에 대한 "긴급" 개선사항 지원 
          <br/>
          2. 검토 결과: 안전긴급예산 지원 반려
          <br/>
          3. 검토 의견: %SRM_BUDG_COMMENT%
          <br/>
          <br/>
          ※ 안전긴급예산 집행 타당성 평가요소: 위험성, 긴급성, 경제성
          <br/>
          비록 귀하의 안전긴급예산 지원 요청이 수용되지 않았으나, 귀하께서 보여주신 안전개선에 대한 관심에 깊은 감사를 표합니다. 
          <br/>
          <br/>
          안전 안전긴급예산 담당자 안전경영부 유승훈 매니저 (2-3613)
        </span>
      </div>
    `
  }

  let mailParams = {
    EMAIL: [],
    SUBJECT: '',
    CONTENT: `
      <div style="text-align: center;">
        <div>
          <span style="font-size:22.0pt;font-family:'HD현대체 Bold',serif;color:#FDB813">“안전긴급예산”</span>
          <br/><br/>
          <span style="font-size:16.0pt;font-family:'HD현대체 Bold',serif;color:#002554">[안전긴급예산] ${subjectArea}</span>
        </div>
        <div style="margin-top: 12px;">
          <table width="500" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td height="3" bgcolor="#76FF03"></td>
            </tr>
          </table>
        </div>
        <div>
          <img 
            width="308"
            height="446" 
            src="http://10.25.17.129:5173/src/assets/images/hiro/04.gif"
          />
        </div>
        ${ contentArea }
        <div style="margin-top: 16px">
          <img 
              width="180" 
              height="50" 
              src="http://10.25.17.129:5173/src/assets/images/ci/HHI_color_ko.png"
          />
          <img 
              width="180" 
              height="50" 
              src="http://10.25.17.129:5173/src/assets/images/ci/SRM.png"
          />
        </div>
      </div>
    `
  }

  let safetyReporter = ''// 제보자

  // 인원 조회
  const data1 = { 
    queryId: "SRMAA0040_SEARCH_01",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      TASK_SEQ: popupDatas.TASK_SEQ,
    }
  }

  const meta = { useProgress: false }

  // 부서장, 운영위원, SRM 추진과 전원 가져오기
  await commonRequest3("/hse/common/selectList", data1, meta).then(res => {
    safetyReporter = res.ORESULT_CUR[0].EMP_NO  // 제보자 지정

    const data2 = { 
      queryId: "SRMAA0030_SEARCH_05",
      param: {
        CMPNY_DIV: res.ORESULT_CUR[0].CMPNY_DIV,
        DEPT_CD_IMP: res.ORESULT_CUR[0].DEPT_CD_IMP,
        DEPT_CD_REL: res.ORESULT_CUR[0].DEPT_CD_REL,
      }
    }
    commonRequest3("/hse/common/selectList", data2, meta).then(res2 => {
      res2.ORESULT_CUR.forEach(item => {
        mailParams.EMAIL.push(item.EMAIL)
      })
    })
  })

  // 이메일 가져오기(제안자)
  for (let i of [popupDatas.MANAGER_ID, safetyReporter]) {
    await commonSearchApi({ 
      queryId: 'searchEMP', 
      param: {
        FLAG: 'N',
        EMP_NO: i
      } 
    }).then(res => {
      mailParams.EMAIL.push(res.ORESULT_CUR[0].EMAIL)
    })
  }

  // 중복값 제거
  mailParams.EMAIL = [...new Set(mailParams.EMAIL)]

  await commonSendApi(mailParams)
}

//내부의견 추가
const addTextInterOpin = () => {
  if(popupDatas.INTER_OPIN) popupDatas.INTER_OPIN += '\r\n'
  popupDatas.INTER_OPIN += '[' + dayjs().format('YY-MM-DD HH:MM') + '] ' + userStore.userName + ' : ' + popupDatas.TEXT_INPUT
  popupDatas.TEXT_INPUT = ''
}


//예산 합계 계산
const setBgTotal = () =>{
  popupDatas.BG_TOTAL = isNullAndZero(popupDatas.BG_CUR_EXP) + isNullAndZero(popupDatas.BG_FAC_INV)
  if(areaVisible.SAFETY && isNullCheck(grdMain.value.getDataProvider().getValue(0, 'FAC09'))){
    if(popupDatas.BG_TOTAL < 10000){
      grdMain.value.getDataProvider().setValue(0, 'FAC09', '1')
    }
    else if(popupDatas.BG_TOTAL < 50000){
      grdMain.value.getDataProvider().setValue(0, 'FAC09', '1.25')
    }
    else if(popupDatas.BG_TOTAL < 200000){
      grdMain.value.getDataProvider().setValue(0, 'FAC09', '1.75')
    }
    else{
      grdMain.value.getDataProvider().setValue(0, 'FAC09', '2')
    }
  }
}

//콤보박스 설정
const initCombo = async () => {  
  Promise.all([
    getCodeList("HHIJJE13"), // 계산식[0]    
    getCodeList('HHIJJC01'),  // 위험등급[1]
    getCodeList("HHIJJE10"), // 대구분[2]    
    getCodeList("HHIJJE11"), // 소구분[3]    
  ]).then(res => {
    codeList.CAL_DATA = res[0].ORESULT_CUR
    codeList.EX_GUBN = res[1].ORESULT_CUR
    codeList.LGUBN = res[2].ORESULT_CUR
    codeList.SGUBN = res[3].ORESULT_CUR
  })

  if(userStore.bsnsCd === 'AN00' || userStore.empNo === 'BP22733'){
    areaVisible.SAFETY = true
  }
  else{
    areaVisible.SAFETY = false
  }

  commonSearchApi({queryId: "searchEMP", param: {CMPNY_DIV:popupDatas.CMPNY_DIV, USER_DIV:'', BSNS_CD:'AN00', DEPT_CD:'N090', EMP_NM:'', EMP_NO:'', FLAG:'N'} })
  .then(async res => {
    let EMP_RESULT = []
    res.ORESULT_CUR.forEach(ele => {
      EMP_RESULT.push( {COD : ele.EMP_NO, TXT : ele.EMP_NM + ' ' + isNullAndEmpty(ele.JOB_TIT_NM)} )
    })
    codeList.SRM_NM = EMP_RESULT
  })
}

//이미지 입력
const fileSet = async fileId => {
  if(popupDatas.FILE_GUBN === 'ebRPUp'){
    grdPic1.value.getDataProvider().setRows([])
    popupDatas.BG_FILE_LIST.src = []
    popupDatas.BG_FILE_LIST.fileName = []
    popupDatas.BG_FILE_LIST.idx = -1
  } else {
    popupDatas.RK_FILE_LIST.src = []
    popupDatas.RK_FILE_LIST.fileName = []    
    popupDatas.RK_FILE_LIST.idx = -1
  }
  let cnt = 0
  await commonSearchApi({queryId: "searchFile", param: {CMPNY_DIV: popupDatas.CMPNY_DIV, FILE_ID : fileId} }).then(async res => {
    /* ********** IMAGE 파일만 따로 분리 ********** */
    await res.ORESULT_CUR.forEach(e => {
      let type = e.FILE_TYPE.toUpperCase()
      if(type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF'){
        cnt++
        if(popupDatas.FILE_GUBN === 'ebRPUp'){
          popupDatas.BG_FILE_LIST.fileName.push(e)
        }
        else{ 
          popupDatas.RK_FILE_LIST.fileName.push(e)
        }
      }
      /* ********** grid row 추가 ********** */
      if(popupDatas.FILE_GUBN === 'ebRPUp') grdPic1.value.addRow({OPINION_CMPNY: e.FILE_TITLE ,FILE_ID: e.FILE_ID, FILE_NO: e.FILE_NO, CMPNY_DIV: e.CMPNY_DIV, cnt: cnt})
    })

    /* ********** IMAGE 파일 다운로드 및 URL 변경 ********** */
    let files = popupDatas.FILE_GUBN === 'ebRPUp' ? popupDatas.BG_FILE_LIST.fileName : popupDatas.RK_FILE_LIST.fileName
    files.forEach((e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성

      commonDownloadFilesApi(e).then(res2 => {
        contentDisposition = res2.contentDisposition
        fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

        blob = new Blob([res2])
        imageURL = URL.createObjectURL(blob)

        img = new Image() // 이미지 요소 생성

        img.src = imageURL // 이미지 URL 설정
        img.alt = fileName

      }).finally(() => {
        if(popupDatas.FILE_GUBN === 'ebRPUp' && imageURL){
          popupDatas.BG_FILE_LIST.idx++
          popupDatas.BG_FILE_LIST.src[idx] = imageURL
          grdPic1.value.getGridView().checkAll(false)
          grdPic1.value.getGridView().resetCurrent()
        }
        else if(popupDatas.FILE_GUBN === 'rk' && imageURL){
          popupDatas.RK_FILE_LIST.idx++
          popupDatas.RK_FILE_LIST.src[idx] = imageURL
        }
      })
    })
  })
}

/* 그리드 파일명 선택시 해당 파일 이미지로 변경 */
const imageChange = async (grid, clickData) => {
  let rowData = await grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)
  carouselIdx.value = rowData.cnt - 1
}

//안전 긴급예산 집행 타당성 계산식 동적 구현
const facData = reactive({
  FAC01 : 0,
  FAC02 : 0,
  FAC03 : 0,
  FAC04 : 0,
  FAC05 : 0,
  FAC06 : 0,
  FAC07 : 0,
  FAC08 : 0,
  FAC09 : 0,
  FAC10 : 0,
  FAC11 : 0,
})

const onCellEdited = async (grid, itemIndex, row, field) => {
  await calPoint()
}

const calPoint = async () => {  
  let resultVal = 0
  let mainGrdData = await grdMain.value.getDataProvider().getJsonRow(0)
  facData.FAC01 = isNullAndZero(mainGrdData['FAC01'])
  facData.FAC02 = isNullAndZero(mainGrdData['FAC02'])
  facData.FAC03 = isNullAndZero(mainGrdData['FAC03'])
  facData.FAC04 = isNullAndZero(mainGrdData['FAC04'])
  facData.FAC05 = isNullAndZero(mainGrdData['FAC05'])
  facData.FAC06 = isNullAndZero(mainGrdData['FAC06'])
  facData.FAC07 = isNullAndZero(mainGrdData['FAC07'])
  facData.FAC08 = isNullAndZero(mainGrdData['FAC08'])
  facData.FAC09 = isNullAndZero(mainGrdData['FAC09']) === 0 ? 1 : isNullAndZero(mainGrdData['FAC09'])
  facData.FAC10 = isNullAndZero(mainGrdData['FAC10'])
  facData.FAC11 = isNullAndZero(mainGrdData['FAC11'])

  for(const el of grdSubProps.fields) {
    let formula = await extractCal(el.fieldName)
    let calData = formula.split(' ')

    let calResult = await calFormula(calData)
    resultVal = resultVal + isNullAndZero(calResult)
    grdSub.value.getDataProvider().setValue(0, el.fieldName, Math.round(isNullAndZero(calResult)))
  }
  popupDatas.RESULT_POINT = Math.round(resultVal)
  await setResultPoint()
}

//7점 이상이면 지원 가능
const setResultPoint = () =>{
  if(popupDatas.RESULT_POINT > 9){
    popupDatas.RESULT_PIC_NM = 'numeric-9-plus-circle-outline'
  }else {
    popupDatas.RESULT_PIC_NM = 'numeric-'+ popupDatas.RESULT_POINT +'-circle-outline'
  }
  
  if(popupDatas.RESULT_POINT > 6){
    popupDatas.RESULT_MESSAGE = '지원가능'
    popupDatas.RESULT_PIC_COLOR = 'green'
  }else{
    popupDatas.RESULT_MESSAGE = '지원불가'
    popupDatas.RESULT_PIC_COLOR = 'red'
  }
}

const sampleFileInfoDev = ref([
  {CMPNY_DIV:'HHI',FILE_ID:'7dc53fae-39c5-471d-b89b-d4b45beabb2a',FILE_NO:'2',FILE_PATH:'/user_home/xx08/HSE/HSE/XX08/40_safety-risk/SRM_F/SRMFA0020/',FILE_NAME:'8ae015ad-985e-4f53-87dd-501f83b3395f.pptx',FILE_TITLE:'24년도 개선 과제수행 보고서 양식.pptx',FILE_NAME_ORIGINAL:'24년도 개선 과제수행 보고서 양식.pptx',FILE_SIZE:'182',STATUS:'U'},
  {CMPNY_DIV:'HHI',FILE_ID:'7dc53fae-39c5-471d-b89b-d4b45beabb2a',FILE_NO:'1',FILE_PATH:'/user_home/xx08/HSE/HSE/XX08/40_safety-risk/SRM_F/SRMFA0020/',FILE_NAME:'a2450cf8-8e23-4e5f-bdc7-9faf11e2c7e6.xlsx',FILE_TITLE:'24년도 예산변동요청서 양식.xlsx',FILE_NAME_ORIGINAL:'24년도 예산변동요청서 양식.xlsx',FILE_SIZE:'319',STATUS:'U'}
])

const sampleFileInfoOp = ref([
  {CMPNY_DIV:'HHI',FILE_ID:'f6aed041-25fd-4648-87b4-2e8aa3ddea7c',FILE_NO:'2',FILE_PATH:'/user_home/xx08/HSE/HSE/XX08/40_safety-risk/SRM_A/SRMAA0030/',FILE_NAME:'9955dd81-a509-43d2-a423-916449085103.pptx',FILE_TITLE:'24년도 개선 과제수행 보고서 양식.pptx',FILE_NAME_ORIGINAL:'24년도 개선 과제수행 보고서 양식.pptx',FILE_SIZE:'182',STATUS:'U'},
  {CMPNY_DIV:'HHI',FILE_ID:'f6aed041-25fd-4648-87b4-2e8aa3ddea7c',FILE_NO:'1',FILE_PATH:'/user_home/xx08/HSE/HSE/XX08/40_safety-risk/SRM_A/SRMAA0030/',FILE_NAME:'90fbd358-ea55-4939-b7f1-54c51239ce3f.xlsx',FILE_TITLE:'24년도 예산변동요청서 양식.xlsx',FILE_NAME_ORIGINAL:'24년도 예산변동요청서 양식.xlsx',FILE_SIZE:'319',STATUS:'U'}
])

const clickSample = () =>{
  let sampleFileInfo = window.location.hostname === 'hises.hd.com' ? sampleFileInfoOp.value : sampleFileInfoDev.value
  for(let i = 0 ; i < sampleFileInfo.length ; i++){
    commonDownloadFilesApi(sampleFileInfo[i]).then(res => {
          const file = res.contentDisposition.split('fileName="')
          const blob = new Blob([res])
          const link = document.createElement("a")

          link.href = URL.createObjectURL(blob)

          link.download = decodeURI(file[1].replace('";', ""))
          link.click()
          URL.revokeObjectURL(link.href)
    })
  }
}

const extractCal = async val =>{
  let result = ''
  codeList.CAL_DATA.forEach(el => {
    if(el.COD === val){
      result = el.TXT
    }
  })
  
  return result
}

const calFormula = async val=>{
  let resultVal = facData[val[0]]
  let cnt = 1
  for(let i = 0 ; i < val.length ; i += cnt){
    cnt = 1
    if(val[i] === '*'){
      resultVal = resultVal * facData[val[i+1]]
      cnt = 2
    }
    else if(val[i] === '/'){
      resultVal = resultVal / facData[val[i+1]]
      cnt = 2
    }
    else if(val[i] === '+'){
      resultVal += facData[val[i+1]]
      cnt = 2
    }
    else if(val[i] === ']='){
      if(resultVal >= val[i+1]){
        return val[i+2]
      }
      cnt = 3
    }
  }
  return resultVal
}

const calRisk = async () =>{
  let score = { A : 3, B : 2, C : 1}
  switch(score[popupDatas.EX_GUBN_BF] - score[popupDatas.EX_GUBN]){    
    case 1 :
      grdMain.value.getDataProvider().setValue(0, "FAC08", '0.5')
      break;
    case 2 :
      grdMain.value.getDataProvider().setValue(0, "FAC08", '1')
      break;
    case 0 :
      grdMain.value.getDataProvider().setValue(0, "FAC08", '0')
      break;
  }
  calPoint() 
}

const chkTemp = () =>{
  if(popupDatas.STATUS)
    grdTitle.value.disableBtn("btnTemporaryStorage", true)
}

watch(() => popupDatas.SGUBN, async (newValue, oldValue) => {
  if(newValue !== 'S08'){
    popupDatas.SGUBN_DESC = ''
  }
})

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1200"
    class="p-absolute user-select-none"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="60"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>안전긴급예산신청</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="grdTitle"
          :use-permission="false"
          :button-list="['btnTemporaryStorage','btnUpdate', 'btnReqApply', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <IGridTitle
            :title="$t('리스크 데이터')"
          />
          <v-sheet class="searchArea flex-column">            
            <div class="d-flex flex-column">
              <div class="title formLabelText d-flex">안전긴급예산 (Emergency Budget for Safety)</div>
              <v-sheet class="d-flex" style="background-color : white; justify-content: center;">
                <div 
                  class="d-flex flex-column" 
                  :style="{
                    flexBasis :'15%',
                    maxWidth:'15%',
                    justifyContent: 'center',
                    opacity:`${appLvOpacitys.OPA1}`,
                  }"
                >
                  <svg-icon 
                    :name="'numeric-1-circle-outline'" 
                    class="pt-5"
                    style=" fill : yellowgreen; max-height:70%;"
                  />
                  <div class="title formLabelText d-flex align-start" style="justify-content: center;">
                    {{ 'SRM추진과 검토 ' + isNullAndEmpty(appLvResult.RES1) }}
                  </div>
                  <div class="title formLabelText d-flex" style="height : 21px; justify-content: center;">
                    {{ '결과 : ' + (popupDatas.SOL_RESULT === 'A'? '수용' : (popupDatas.SOL_RESULT === 'D'? '보류' : (popupDatas.SOL_RESULT === 'R'? '반려' : ''))) }}
                  </div>
                </div>
                <div class="d-flex align-center" style="flex-basis: 5%; max-width:5%; justify-content: center;">
                  <svg-icon 
                    :name="'arrowRight'" 
                    :style="{
                      opacity:`${appLvOpacitys.OPA2}`,
                    }"
                  />
                </div>
                <div 
                  class="d-flex flex-column pl-3" 
                  :style="{
                    flexBasis :'15%',
                    maxWidth:'15%',
                    justifyContent: 'center',
                    opacity:`${appLvOpacitys.OPA2}`,
                  }"
                >
                  <svg-icon 
                    :name="'numeric-2-circle-outline'" 
                    class="pt-5"
                    style=" fill : yellowgreen; max-height:70%;"
                  />
                  <div class="title formLabelText d-flex align-start" style="justify-content: center;">
                    {{ '안전경영부 결재 ' + isNullAndEmpty(appLvResult.RES2) }}
                  </div>
                  <div style="height : 21px">
                  </div>
                </div>
                <div class="d-flex align-center" style="flex-basis: 5%; max-width:5%; justify-content: center;">
                  <svg-icon 
                    :name="'arrowRight'" 
                    :style="{
                      opacity:`${appLvOpacitys.OPA3}`,
                    }"
                  />
                </div>
                <div 
                  class="d-flex flex-column pl-3" 
                  :style="{
                    flexBasis :'15%',
                    maxWidth:'15%',
                    justifyContent: 'center',
                    opacity:`${appLvOpacitys.OPA3}`,
                  }"
                >
                  <svg-icon 
                    :name="'numeric-3-circle-outline'" 
                    class="pt-5"
                    style=" fill : yellowgreen; max-height:70%;"
                  />
                  <div class="title formLabelText d-flex align-start" style="justify-content: center;">
                    {{ '원가 결재 ' + isNullAndEmpty(appLvResult.RES3) }}
                  </div>
                  <div style="height : 21px">                    
                  </div>
                </div>
                <div class="d-flex align-center" style="flex-basis: 5%; max-width:5%; justify-content: center;">
                  <svg-icon 
                    :name="'arrowRight'" 
                    :style="{
                      opacity:`${appLvOpacitys.OPA4}`,
                    }"
                  />
                </div>
                <div 
                  class="d-flex flex-column pl-3" 
                  :style="{
                    flexBasis :'15%',
                    maxWidth:'15%',
                    justifyContent: 'center',
                    opacity:`${appLvOpacitys.OPA4}`,
                  }"
                >
                  <svg-icon 
                    :name="'numeric-4-circle-outline'" 
                    class="pt-5"
                    style=" fill : yellowgreen; max-height:70%;"
                  />
                  <div class="title formLabelText d-flex align-start" style="justify-content: center;">
                    {{ '재무 결재 ' + isNullAndEmpty(appLvResult.RES4) }}
                  </div>
                  <div style="height : 21px">                    
                  </div>
                </div>
                <div class="d-flex align-center" style="flex-basis: 5%; max-width:5%; justify-content: center;">
                  <svg-icon 
                    :name="'arrowRight'" 
                    :style="{
                      opacity:`${appLvOpacitys.OPA5}`,
                    }"
                  />
                </div>
                <div 
                  class="d-flex flex-column pl-3" 
                  :style="{
                    flexBasis :'15%',
                    maxWidth:'15%',
                    justifyContent: 'center',
                    opacity:`${appLvOpacitys.OPA5}`,
                  }"
                >
                  <svg-icon 
                    :name="'numeric-5-circle-outline'" 
                    class="pt-5"
                    style=" fill : yellowgreen; max-height:70%;"
                  />
                  <div class="title formLabelText d-flex align-start" style="justify-content: center;">
                    {{ '예산 이관 ' + isNullAndEmpty(appLvResult.RES5) }}
                  </div>
                  <div style="height : 21px">                    
                  </div>
                </div>
              </v-sheet>
            </div>
            <div class="d-flex pt-3">
              <div class="d-flex flex-column fill-height" style="flex-basis: 45%;">
                <i-input
                  :label="$t('연계 Risk No.')"
                  top-label
                  v-model="popupDatas.TASK_SEQ"
                  readonly
                />
                <i-input
                  :label="$t('제  목')"
                  top-label
                  v-model="popupDatas.RISK_NM"
                  readonly
                />
                <i-textarea
                  :label="$t('문제점 및 필요성 위험요인 상세내용')"
                  top-label
                  readonly  
                  v-model="popupDatas.CUR_PROB" 
                  style="height: 100%"
                />
              </div>
              <div class="d-flex flex-column" style="flex-basis: 55%;">
                <div class="title formLabelText d-flex">연계 Risk 사진</div>                
                <v-carousel                 
                  v-model="popupDatas.RK_FILE_LIST.idx"
                  hide-delimiters
                  height="225px"
                  class="border"
                  show-arrows="hover"
                  hide-delimiter-background
                >
                  <v-carousel-item v-for="(item, i) in popupDatas.RK_FILE_LIST.src" :key="i" :src="item"/>
                </v-carousel>
              </div>              
            </div>
          </v-sheet>   
          <IGridTitle
            :title="$t('안전긴급예산신청 내용')"
          />       
          <v-sheet  class="searchArea flex-column">
            <div class="d-flex">
              <div class="d-flex  flex-column fill-height" style="flex-basis: 50%; max-width:50%">
                <div class="title formLabelText d-flex" required>개선방안 <svg-icon class="dot" name="redDot"></svg-icon></div>
                <CKEditor               
                  ref="ckEditor"
                  :id="props.editorId"
                  v-model="popupDatas.SOL_CONTENT" 
                />
              </div>
              <div class="d-flex flex-column fill-height pl-5" style="flex-basis: 30%; max-width:30%">
                <div class="d-flex flex-column" style="height : 210px; ">
                  <div class="title formLabelText d-flex ">개선방안 설명사진</div>
                  <v-carousel
                    v-model="popupDatas.BG_FILE_LIST.idx"
                    hide-delimiters 
                    height="210px"
                    class="border"
                    show-arrows="hover"
                    hide-delimiter-background
                  >
                    <v-carousel-item v-for="(item, i) in popupDatas.BG_FILE_LIST.src" :key="i" :src="item"/>
                  </v-carousel>
                </div>
                <div class="d-flex pt-2" style="height : 50px">
                  <v-btn style="height : 40px" @click="openPopupPop('ebADUp')">별첨문서</v-btn>
                  <v-btn style="height : 40px" @click="clickSample">개선과제 보고서<br/> 양식 다운로드</v-btn>
                  <v-btn style="height : 40px" @click="openPopupPop('ebRPUp')">관련사진 첨부</v-btn>
                </div>
              </div>
              <v-sheet class="h-auto ml-2 pt-5" style="flex-basis: 20%; max-width:20%">
                <RealGrid
                  ref="grdPic1"
                  class="border"
                  :grid-view-option="grdPic1Props.gridViewOption"
                  :keys="grdPic1Props.keys" 
                  :fields="grdPic1Props.fields"
                  :columns="grdPic1Props.columns"
                  @onCellClicked="imageChange"
                />
              </v-sheet>
            </div>          
            <div class="d-flex pt-2">
              <i-input
                :label="$t('기대효과')"
                width="490px"
                required
                top-label
                v-model="popupDatas.EX_EFFECT"
              />
              <i-select
                width="120px"
                class="pt-5"
                v-model="popupDatas.EX_GUBN_BF"
                :items="codeList.EX_GUBN"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="calRisk()"
              />
              <i-select
                width="140px"
                class="pt-5"
                :label="$t('->')"
                v-model="popupDatas.EX_GUBN"
                :items="codeList.EX_GUBN"
                item-value="COD"
                item-title="TXT"
                @update:modelValue="calRisk()"
              />
            </div>
            <div class="d-flex flex-column fill-height">
              <div class="d-flex pt-2">
                <div class="title formLabelText d-flex">구분</div>
              </div>
              <div class="d-flex">
                <i-select
                  width="235px"
                  :label="$t('대구분')"
                  required
                  class="pt-2"
                  v-model="popupDatas.LGUBN"
                  :items="codeList.LGUBN"
                  item-value="COD"
                  item-title="TXT"
                />
                <i-select
                  width="235px"
                  :label="$t('소구분')"
                  required
                  class="pt-2"
                  v-model="popupDatas.SGUBN"
                  :items="codeList.SGUBN"
                  item-value="COD"
                  item-title="TXT"
                />
                <i-input
                  class="pt-2"
                  style="width : 130px"
                  v-model="popupDatas.SGUBN_DESC"
                  :readonly="popupDatas.SGUBN !== 'S08'"
                />
              </div>              
            </div>
            <div class="d-flex flex-column fill-height pt-5">
              <div class="d-flex">
                <div class="title formLabelText d-flex">예산</div>
              </div>
              <div class="d-flex">
                <div class="align-center d-flex">
                  <div
                    class="formLabelText d-flex pr-1"
                  >
                    시설투자(천원)
                    <svg-icon class="dot" name="redDot"/>
                  </div>
                </div>
                <i-number
                  class="pr-5"
                  required
                  type="number"
                  style="width : 163px"
                  v-model="popupDatas.BG_FAC_INV"
                  @update:modelValue="setBgTotal"
                />
                <div class="align-center d-flex">
                  <div
                    class="formLabelText d-flex pr-1"
                  >
                    경상비(천원)
                    <svg-icon class="dot" name="redDot"/>
                  </div>
                </div>
                <i-number
                  class="pr-5"
                  required
                  type="number"
                  style="width : 175px"
                  v-model="popupDatas.BG_CUR_EXP"
                  @update:modelValue="setBgTotal"
                />
                <div class="align-center d-flex">
                  <div
                    class="formLabelText d-flex pr-1"
                  >
                    합계(천원)
                    <svg-icon class="dot" name="redDot"/>
                  </div>
                </div>
                <i-number
                  class="pr-5"
                  type="number"
                  style="width : 165px"
                  v-model="popupDatas.BG_TOTAL"
                  readonly
                />
                <v-btn style="align-self: center;" @click="openPopupPop('ebRDUp')">관련서류 첨부</v-btn>
                <!-- <svg-icon 
                  class="ml-2 align-center manuel-button"
                  style="align-self: center;"
                  name="manuelBtn"
                  @click="clickSample"
                /> -->
              </div>
            </div>
            <div class="d-flex mt-2">
              <!-- 일정 -->
              <i-input
                v-model="popupDatas.EB_SDATE"
                label-width="50px" 
                width="150px" 
                :label="$t('일정')" 
                type="date" 
                top-label
                required
              />
              <i-input 
                class="pt-5"
                v-model="popupDatas.EB_EDATE"
                label-width="20px"
                width="170px" 
                :label="$t('~')" 
                type="date"
              />      
            </div>
            <div class="d-flex pt-2">
              <i-input
                :label="$t('담당자')"
                required
                top-label
                width="150px" 
                v-model="popupDatas.BSNS_NM"
                readonly
              />
              <i-input
                v-model="popupDatas.DEPT_NM"
                class="pt-5"
                width="170px" 
                readonly
              />
              <i-input
                v-model="popupDatas.MANAGER_NM"
                class="pt-5"
                width="150px" 
                margin="10px"
                append-inner-icon="mdi-magnify"
                @keydown.enter="e => {
                  openPopupPop('EMP')
                }"
                @update:modelValue="e => { popupDatas.MANAGER_ID = null }"
                @click:appendInner="openPopupPop('EMP')"
              />
            </div>
            <div class="d-flex pt-2">
              <i-select
                :label="$t('원가협의결과')"
                top-label
                width="340px"
                v-model="popupDatas.COST_RESULT"
                :items="codeList.COST_RESULT"
                item-value="COD"
                item-title="TXT"
              />
            </div>
          </v-sheet>
          <IGridTitle
            :title="$t('SRM 데이터')"            
          />
          <v-sheet class="searchArea flex-column">
            <div>
              <div class="d-flex">
                <i-textarea
                  :label="$t('안전 의견')"
                  width="1000px"
                  top-label
                  :row="4"
                  v-model="popupDatas.SA_OPIN"
                  :readonly="!areaVisible.SAFETY"                  
                  style="width: 100%"
                />
              </div>
              <div class="d-flex">
                <i-select
                  :label="$t('처리결과')"
                  top-label
                  width="300px"
                  v-model="popupDatas.SOL_RESULT"
                  :items="codeList.SOL_RESULT"
                  :readonly="!areaVisible.SAFETY"
                  item-value="COD"
                  item-title="TXT"
                />
                <i-select
                  :label="$t('SRM 담당자 지정')"
                  top-label
                  width="300px"
                  v-model="popupDatas.SRM_ID"
                  :items="codeList.SRM_NM"
                  :readonly="!areaVisible.SAFETY"
                  item-value="COD"
                  item-title="TXT"
                />
              </div>
              <div class="d-flex" v-if="areaVisible.SAFETY">
                <i-textarea
                  ref="interTextArea"
                  :label="$t('내부 의견')"
                  width="1000px"
                  top-label
                  v-model="popupDatas.INTER_OPIN" 
                />                
                <svg-icon 
                  :name="popupDatas.RESULT_PIC_NM" 
                  class="pt-5"
                  :style="{fill:`${popupDatas.RESULT_PIC_COLOR}`, width : '100%', height : '100%' }"
                />
              </div>      
              <div class="d-flex" v-if="areaVisible.SAFETY">
                <i-input
                  v-model="popupDatas.TEXT_INPUT"
                  class="pt-2"
                  width="1000px"
                  @keydown="e => { if(e.keyCode == 13) addTextInterOpin() }"
                />
                <div class="pt-3 pl-7 gridTitle">{{popupDatas.RESULT_MESSAGE}}</div>
              </div>                      
              <div class="h-auto" v-if="areaVisible.SAFETY">
                <div class="flex-column">
                  <div class="title formLabelText d-flex">투자타당성검토(내부)</div>
                  <RealGrid
                    ref="grdMain"
                    class="border"
                    style="height: 70px; overflow: hidden;"
                    :grid-view-option="grdMainProps.gridViewOption"
                    :keys="grdMainProps.keys" 
                    :fields="grdMainProps.fields"
                    :columns="grdMainProps.columns"
                    :column-layout="grdMainProps.columnLayout"
                    @onCellEdited="onCellEdited"
                  />
                  <RealGrid
                    ref="grdSub"
                    class="border"
                    style="height: 70px; overflow: hidden;"
                    :grid-view-option="grdSubProps.gridViewOption"
                    :keys="grdSubProps.keys" 
                    :fields="grdSubProps.fields"
                    :columns="grdSubProps.columns"
                  />
                </div>
              </div>
            </div>
          </v-sheet>          
        </div>
      </v-card-text>    
    </v-card>
    <!-- 임직원 선택 팝업 -->
    <EmpPopup ref="empPopup" @selected ="selectedEmpData" />
    <!-- 업로드 팝업-->
    <IUploadPopup ref="fileUploadPopup" @uploaded="afterFileSearch"/>
    <!-- OZReport -->
    <!-- <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" /> -->
    <!-- 결재 팝업-->
    <ApprovalPopup ref="approvalPopup" @result="approvalResult"/>
  </VDialog>
</template>

<style scoped  lang="scss">
.dot {
  align-items: flex-start;
}
::v-deep(.rg-head-cell) {
  background-color: #e4e4e4 !important;
}
::v-deep(.rg-header .rg-table tr td) {
  background-color: #e4e4e4 !important;
}
.manuel-button { 
  cursor: pointer;
}
</style>
