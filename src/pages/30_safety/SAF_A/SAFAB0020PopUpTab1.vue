<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 사고 세부사항 팝업 > 사고즉보    -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { useLogsStore } from '@hiway/stores/logs'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import dayjs from 'dayjs'
import _ from 'lodash'
import { chkEmpty } from '@/utils/common'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
  commonRskSaveApi,
  commonSendSMS,
  commonSendFirebase,
  commonRequest,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'

import saveFlowHelper from '@/utils/saveFlowHelper'

import Message from '@hiway/utils/notify'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import SAFAB0020PopUp from '@/pages/30_safety/SAF_A/SAFAB0020PopUp.vue'
import IUploadImageSingle from '@/components/IUploadImageSingle.vue'
import SAFAB0020ManPopUp from '@/pages/30_safety/SAF_A/SAFAB0020ManPopUp.vue'
// 팝업촌
import AcdtPopup from '@/components/popup/AcdtPopup.vue'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import EmpPopup2 from '@/pages/30_safety/SAF_A/SAFAB0010EMP.vue'
import { RowState } from 'realgrid'
import SAFAB0020WRK_STD from '@/pages/30_safety/SAF_A/SAFAB0020WRK_STD.vue'
import SAFAB0020WRKID from '@/pages/30_safety/SAF_A/SAFAB0020WRKID.vue'
import SAFAB0020DisasterPopUp from '@/pages/30_safety/SAF_A/SAFAB0020DisasterPopUp.vue'
import IUpload from '@/components/IUpload.vue'
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import SAFAB0020_Reason from './SAFAB0020_Reason.vue'
import WorkRiskList from '@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0010Popup03.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdTwo = ref(null)
const RESPDEPTCD = ref(null)
const SAGOORGTYPE = ref(null)
const COMESERIOUSYN = ref(null)
const isSafeUser = ref(userStore.authGrpCd.includes('GRP00381'))
// 팝업관련
const workRiskList = ref(null)
const deptPopup = ref(null)
const MainPopOpen = ref(null)
const emit = defineEmits(['close', 'upData', 'useBtn', 'img1', 'img2', 'img3', 'upDngTab1'])
const Popdata = reactive({
  INJR_DEPT_NM1: '',
  INJR_DEPT_NM2: '',
  INJR_DEPT_NM3: '',
  INJR_DEPT_CD1: '',
  INJR_DEPT_CD2: '',
  INJR_DEPT_CD3: '',
})
const empPopup = ref(null)
const empPopup2 = ref(null)
const chkItems = reactive({
  PEOPLE: 'N',
  DESC: 'N',
  INFO: 'N',
  PICTURE: 'N',
  LATE: 'N',
  AMBUL: 'N',
})

const isadmin = userStore.authGrpCd.includes('SAFAA001')
// console.log('isadmin', isadmin)
// console.log('userStore.authGrpCd', userStore.authGrpCd)

const RCAUpload = ref(null)
const fileUpload = ref(null)
const codeList = reactive({
  WRK_STD: [{ TXT: '없음', COD: '' }],
  WORK_ID: [{ TXT: '없음', COD: '' }],
  DNG_LVL: [
    { COD: 'H', TXT: '상', },
    { COD: 'M', TXT: '중', },
    { COD: 'L', TXT: '하', },
  ],
})
const WRK_STDPopUp = ref(null)
const Disaster = ref(null)
const acdtPopupRef = ref(null)
const locationPopup = ref(null)
const ManPopUp = ref(null)
const CausePopup = ref(null)
const INJRDEPT = ref([])
const WRK_STD_NMNot = ref(false)
const props = defineProps({
  popupParam: {
    type: Object,
    required: false,
    default() {
      return {}
    },
  },
})
const files = ref([])
const WhyNot = ref(true)

const Url1 = ref(null)
const Url2 = ref(null)
const Url3 = ref(null)
const GridTitle8 = ref(null)
const isNoDown = ref(true)
const fileSave = reactive([])
const fileUpload1 = ref(null)
const fileUpload2 = ref(null)
const fileUpload3 = ref(null)
const readonly1 = ref(null)
const readonly2 = ref(null)
const readonly3 = ref(null)
const GuBunValue = ref(false)
const index = ref(null)
const mailParams = reactive({
  EMAIL: [],
  REFERER: [],
  // HIDDEN_REFERER: [],
  SUBJECT: '',
  CONTENT: '',
})
// const NOEdit = ref(false)
//  버튼 disable
// 인적사항
const GridTitle1 = ref(null)
// 사고개요
const GridTitle2 = ref(null)
// 재해원인
const GridTitle3 = ref(null)
const GridTitle5 = ref(null)
const GridTitle6 = ref(null)
//  그리드이벤트
const fileIndexgrd = ref('')
const fileDatagrd = ref('')
const fileUploadgrd = ref(null)
const injugsahang = ref(null)
// 작업표준서 저장로직
const joUpload =ref(null)
const etcFile = ref(null)
//계층(상세정보) 초기화
const ArrayList = ref([])
const isNoN   =ref(false)
// UNIT, ACT, RISK 초기화
const WORK_STANDARD_UNIT = ref([])
const WORK_STANDARD_ACT = ref([])
const WORK_STANDARD_RISK = ref([])
const NOEdit = ref(false)
const LATEReadonly = ref(false)
const WWRKIDPopUp = ref(null)
const empNoWrkID = ref('')
const commonPopUp = ref('')
const sagoEmpNo  = 'A524835'    // 사고 담당자 지정 (김성일 매니저: A524835)
const sagoEmpNo2 = 'A523481'    // 사고 담당자 지정 (강현웅 선임  : A523481)
const gridTitleDng = ref(null)
const grdDng1 = ref(null)
const grdDng2 = ref(null)

//WORK_STANDARD_MASTER 초기화
const WORK_STANDARD_MASTER = reactive({
  WORK_STANDARD_ID: '',
  WORK_ID: '',
  SAVE_TYPE: '',
  SAVE_STATUS: '',
  COMPANY_CD: '',
  CORP_ASGN_CD: '',
  CORP_ASGN_NM: '',
  BSNS_CD: '',
  USR_ID: userStore.empNo,
  DEPT_CD: '',
  DEPT_NM: '',
  USER_INFO: '',
  GUBUN_NM: '',
  GUBUN_CD: '',
  WORK_STANDARD_NO: '',
  WORK_STANDARD_REVISION: '',
  WORK_STANDARD_NM: '',
  WORK_TOOLS: '',
  EQUIPMENT_TYPE: '',
  USE_CHEMICAL: '',
  REVIEWER: '',
  PROGRESS_STATUS: '',
  WORK_STANDARD_KIND: 'C',
  RISK_TYPE: '',
  RISK_TYPE_NM: '',
  C_DATE: '',
  U_DATE: '',
  WORK_DATE: '',
  WORK_STANDARD_DESC: '',
  APPR_DT: '',
  IS_SAVE: '',
  WORK_STANDARD_RISK_COUNT: 0,
  WORK_STANDARD_RISK_OVER_COUNT: 0,
  WORK_STANDARD_AVG_RISK: 0,
  SRSRM_ALL: 0,
  SRSRM_COMPLETE: 0,
  RATE: 0,
  A_SAGO_COUNT: '',
  B_SAGO_COUNT: '',
  C_SAGO_COUNT: '',
  D_SAGO_COUNT: '',
  TRANS_CD: 'ko',
  CHK_REQUIRED: '',
})

const isLATE = ref(false)
const isGU   = ref(false)
const isInjuSahang = ref(false)
const isUpload = ref(false)
const injuSahang = ref([])
const isSearchST = ref(null)

// 산업재해 조사표 작성여부
const RPT_CANT = ref(false)
const RPT_CANTBTN = ref(false)
const RPT_isNoDown = ref(false)

const FILE_BTN = reactive({
  RPT_BTN: ['btnDownLoad', 'btnDelete'],
})

const sAFAB0020_Reason = ref(null)
const m_dialog = ref(false)
const m_dialog2 = ref(false)
const dialog_text = ref("근태지원 : 재해발생일 포함 3일(주말/공휴일 제외)<br>" +
                "→ 수요일 사고(수, 목, 금 근태지원) / 금, 토, 일요일 사고(사고당일, 월, 화 근태지원)<br><br>" +
                "※화상, 골절, 치아 파단, 수술이 필요한 경우 지원불가 (장해, 후유증 가능성 존재)")

/*  공통코드 세팅 */
onMounted(() => {
  console.log('onMounted', props.popupParam)
  console.log('isadmin', isadmin)

  for (let i in props.popupParam) {
    Popdata[i] = props.popupParam[i]
  }

  // 산업재해 조사표 버튼 및 다운로드 가능 여부
  if (isNullCheck(Popdata.RPT_FILE_ID)){
    FILE_BTN.RPT_BTN = ['btnDownLoad', 'btnDelete']
    RPT_isNoDown.value = true
  } else {
    // 파일키가 있지만 업로드 된 파일이 없는경우 버튼 활성화
    if (Popdata.RPT_CNT === 0){
      FILE_BTN.RPT_BTN = ['btnDownLoad', 'btnDelete']
      RPT_isNoDown.value = true
    } else {
      // 사고 담당자 & 파일 업로드 유저 & 등록 된 안전 담당 과장
      if (userStore.userId === sagoEmpNo || userStore.empNo === sagoEmpNo2 
      || userStore.userId === Popdata.RPT_USER_ID || userStore.userId === Popdata.SAFE_GAMGR_EMP || userStore.authGrpCd.includes('GRP00268')
      // || userStore.userId === 'BP21926'
      ){
        FILE_BTN.RPT_BTN = ['btnDownLoad', 'btnDelete']
        RPT_isNoDown.value = true
      } else {
        FILE_BTN.RPT_BTN = []
        RPT_isNoDown.value = false
      }
    }
  }

  if (Popdata.OCCUR_TIME) {
    const hours = Popdata.OCCUR_TIME.substring(0, 2)
    const minutes = Popdata.OCCUR_TIME.substring(2)
    Popdata.OCCUR_TIME = `${hours}:${minutes}`
  }
  if (Popdata.OCCUR_DT) {
    Popdata.OCCUR_DT = dayjs(Popdata.OCCUR_DT).format('YYYY-MM-DD')
  }
  if(Popdata.WRK_STD_NM ==='신규작성필요' || Popdata.WRK_STD_NM_E ==='신규작성필요'){
    isSearchST.value = true
    Popdata.WRK_STD_NEW = 'Y'
  }
  else{
    isSearchST.value = false 
  }
  // if (Popdata.SAGO_RCV_DT) {
    // Popdata.SAGO_RCV_DT = dayjs(Popdata.SAGO_RCV_DT).format('YYYY-MM-DD')
  // }
  if (!Popdata.LATE_TYPE || Popdata.LATE_TYPE === '0') {
    isLATE.value = false
    Popdata.LATE_TYPE = '0'
  }

  if (Popdata.LATE_TYPE === '1') {
    isLATE.value = true
  }
// console.log('Popdata.GUGUP_USE', Popdata.GUGUP_USE)
// console.log('Popdata.AMBUL_NOT_DESC', Popdata.AMBUL_NOT_DESC)
  // if (Popdata.GUGUP_USE == 'O' || !Popdata.AMBUL_NOT_DESC) {
  if (Popdata.GUGUP_USE == 'O') {
    isGU.value = false
    // console.log('aaa')
  } else {
    isGU.value = true
    // console.log('bbb')
  }

  if (!Popdata.FORM_DIV) {
    Popdata.FORM_DIV = 'J'
  }
  console.log(';asdmasdl')

  console.log("COME_SERIOUS_YN=" + Popdata.COME_SERIOUS_YN)  
  if (!Popdata.COME_SERIOUS_YN) {    
    if (userStore.cmpnyDiv == 'HHI') {
      Popdata.COME_SERIOUS_YN = 'N'    
    } else if (userStore.cmpnyDiv == '200') {      
      // 일렉일 경우에는 N1을 디폴트로 선택함.
      Popdata.COME_SERIOUS_YN = 'N1'    
    } else {
      Popdata.COME_SERIOUS_YN = 'N'   
    }
    
    
  }
  if (Popdata.INJR_DEPT_NM1) {
    INJRDEPT.value = []
    let valueContent = Popdata.INJR_DEPT_NM1.split(/[,\s]+/)
    let cnt = 0
    for (let i in valueContent) {
      cnt++
      INJRDEPT.value.push(`INJR_DEPT_NM${cnt}`)
      let INJR_DEPT_NMDummy = `INJR_DEPT_NM${cnt}`
      Popdata[INJR_DEPT_NMDummy] = valueContent[i]
    }
  }
  if (Popdata.INJR_DEPT_CD1) {
    let valueContent = Popdata.INJR_DEPT_CD1.split(/[,\s]+/)

    let cnt = 0
    for (let i in valueContent) {
      cnt++

      let INJR_DEPT_NMDummy = `INJR_DEPT_CD${cnt}`
      Popdata[INJR_DEPT_NMDummy] = valueContent[i]
    }
  }
// 권한
console.log(userStore,'userStore')
vm.$nextTick(() => {
  console.log("PSJ 사고 확인", Popdata)

  grdDng2.value.setBindingColumn(
    'DNG_LVL',
    codeList.DNG_LVL,
    'COD',
    'TXT',
  )
  
  // if(isadmin || userStore.userId === sagoEmpNo){
  //   isNoDown.value = false 
  // }

  //if(userStore.empNo === 'A524835' || userStore.empNo === Popdata.SAFE_GAMGR_EMP){
  if(userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2){
      console.log('관리자')
      menuTitle.value.setBtnProperty("btnComplete", "visible", true)
      menuTitle.value.setBtnProperty("btnCancelComplete", "visible", true)
      // menuTitle.value.setBtnProperty("btnSafetyCheck", "visible", true)
      // menuTitle.value.setBtnProperty("btnSafetyCancel", "visible", true)

  } else{
     console.log('비관리자')
      menuTitle.value.setBtnProperty("btnComplete", "visible", false)
      menuTitle.value.setBtnProperty("btnCancelComplete", "visible", false)
      // menuTitle.value.setBtnProperty("btnSafetyCheck", "visible", false)
      // menuTitle.value.setBtnProperty("btnSafetyCancel", "visible", false)
    }
})
  // 종결버튼
//   vm.$nextTick(() => {
//   if (Popdata.SAGO_TYPE_CD === 'HRS' || Popdata.SAGO_TYPE_CD === 'SNE' && Popdata.SAGO_DIV_L  =='B') {
//       menuTitle.value.disableBtn('btnComplete', false)
//       menuTitle.value.disableBtn('btnCancelComplete', false)
//   } else {
//       menuTitle.value.disableBtn('btnComplete', true)
//       menuTitle.value.disableBtn('btnCancelComplete', true)
//   }
// })
  if(Popdata.SAGO_TYPE_CD ==='NON'){
    isNoN.value = true
  }
  else{
    isNoN.value = false
  }

  if(Popdata.SAGO_TYPE_CD){
    SAGOORGTYPE.value = Popdata.SAGO_TYPE_CD
  }
  else{
    SAGOORGTYPE.value = null
  }
  if(Popdata.COME_SERIOUS_YN) {
    COMESERIOUSYN.value = Popdata.COME_SERIOUS_YN
  } else {
    COMESERIOUSYN.value = null
  }
  if(Popdata.RESP_DEPT_CD) {
    RESPDEPTCD.value = Popdata.RESP_DEPT_CD
  } else {
    RESPDEPTCD.value = null
  }
  console.log(Popdata.SAGO_TYPE_CD ,' Popdata.SAGO_TYPE_CD')
  console.log(isNoN.value)
  Promise.all([
    getCodeList('HHIB320'), //0
    getCodeList('HHIB010'), //1
    getCodeList('HHIB180'), //2
    getCodeList('HHIB050'), //3
    getCodeList('HHIB070'), //4
    getCodeList('HHIB080'), //5
  ]).then((res) => {
    codeList.GUGUP_USE = res[0].ORESULT_CUR
    codeList.SAGOBURU = res[1].ORESULT_CUR
    codeList.ChekIm = res[2].ORESULT_CUR

    codeList.CheckGuBun = [
      { TXT: '사내', COD: 'I' },
      { TXT: '사외', COD: 'O' },
    ]
    codeList.gongjong = res[3].ORESULT_CUR

    grdMain.value.setBindingColumn(
      'SJE_TYPE_CD',
      res[5].ORESULT_CUR,
      'COD',
      'TXT'
    )

    grdMain.value.setBindingColumn(
      'RPT_TYPE_CD',
      res[4].ORESULT_CUR,
      'COD',
      'TXT'
    )
  })
  NOEdit.value = false
  isUpload.value = false

  if(Popdata.ETC_FILE_ID == undefined || Popdata.ETC_FILE_ID == null || Popdata.ETC_FILE_ID === '') {
    etcFile.value.setGuid()
    Popdata.ETC_FILE_ID = etcFile.value.guid
    commonExecuteApi({ queryId: 'SAFAB0020_SAVE_ETC_FILE_ID', list: [Popdata] })
  } else {
    searchEtcFile()
  }

  SagoSearch()

  // popup open 시 재해원인 및 예방대책 그리드 조회
  onButtonsClick('btnSearch', '재해원인')
  searchDNG()
})

const searchEtcFile = () => {
  etcFile.value.setGuid(Popdata.ETC_FILE_ID)
  etcFile.value.onButtonsClick({ id: 'btnSearch' })
}

// 조회
const searchData01 = (idx) => {
  let param = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    SAGO_SN: Popdata.SAGO_SN,
  }
  return commonSearchApi({ queryId: 'SAFAB0020_search02', param: param })
}

const afterSearch01 = (res) => {
  console.log(res,'res')
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  injuSahang.value = res.ORESULT_CUR[0]

  
  // 2025.06.24 파일 코드 옮기기전 임시
  // if (userStore.userId === sagoEmpNo || userStore.userId === Popdata.SAFE_GAMGR_EMP || userStore.userId === injuSahang.value.RPT_USER_ID) {
  //   isNoDown.value = false 
  // }
  
  // if (res.ORESULT_CUR.length !== 0) {
    // console.log('dddmdk')
  // }

  if (res.ORESULT_CUR[0].EMP_NO) {
    empNoWrkID.value = res.ORESULT_CUR[0].EMP_NO
  }
  if (injuSahang.value.length !== 0) {
    onButtonsClick('btnSearch', '산재불인정')
  }
  console.log(injuSahang.value,'injuSahang.value')

  // 사고 형태가 물적 또는 아차인 경우 재해원인 조회
  if (Popdata.SAGO_DIV_L === 'E' || Popdata.SAGO_DIV_L === 'D'){
    onButtonsClick('btnSearch', '재해원인')
  }
}

const SagoSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData01)
    .setAfter(afterSearch01)
    .showMessage(false)
    .run()
}
const ManUpDataRow = () => {
  let param = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    SAGO_SN: Popdata.SAGO_SN,
  }

  commonSearchApi({ queryId: 'SAFAB0020_search02', param: param }).then(
    (res) => {
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  )
}
// 부서선택팝업
const deptPopupOpen = (gbn, i) => {
  if (gbn == 'INJR') {
    GuBunValue.value = false

    if (i) {
      index.value = i
    } else {
      index.value = undefined
    }
  } else GuBunValue.value = true

  deptPopup.value.openPopup()
}

const onDeptSelected = (row) => {
  let str = row.ASGN_FULL_NM.split("-")
  console.log('onDeptSelected', row)
  if (!GuBunValue.value) {
    if (!index.value) {
      Popdata.BSNS_CD = row.BSNS_CD
      Popdata.INJR_DEPT_CD = row.DEPT_CD
      Popdata.INJR_DEPT_NM = row.ASGN_FULL_NM
      Popdata.INJR_ORGN_CD = row.ASGN_CD

    }
    if (index.value) {
      let StringDept = `INJR_DEPT_CD${index.value}`
      let StringDeptNM = `INJR_DEPT_NM${index.value}`

      Popdata[StringDept] = row.DEPT_CD
      Popdata[StringDeptNM] = row.ASGN_FULL_NM
    }
  } else {
    const orgRespDeptCd = Popdata?.RESP_DEPT_CD
    Popdata.RESP_ORGN_DIV = row.ORGN_DIV
    Popdata.RESP_DEPT_CD = row.DEPT_CD
    Popdata.RESP_BSNS_CD = row.BSNS_CD
    Popdata.RESP_ORGN_CD = row.ASGN_CD
    Popdata.RESP_DEPT_NM = row.ASGN_FULL_NM
    Popdata.VNDR_NM = row.ORGN_DIV == 'B' ? row.ASGN_FULL_NM : ''
    Popdata.VNDR_CD = row.ORGN_DIV == 'B' ? row.ASGN_CD : ''

    // console.log('orgRespDeptCd', orgRespDeptCd)
    // console.log('Popdata.RESP_DEPT_CD', Popdata.RESP_DEPT_CD)

    // 책임부서 변경 시
    if(orgRespDeptCd !== Popdata?.RESP_DEPT_CD) {
      // 선택전 책임부서가 특수선 아니고, 새로 선택된 책임부서가 특수선일 때
      if(orgRespDeptCd?.substr(0, 1) !== 'E' && Popdata?.RESP_DEPT_CD?.substr(0, 1) === 'E') {
        Popdata.WRK_STD_NM = ''
        Popdata.WRK_STD_NO = ''

        if(Popdata.WRK_STD_NEW === 'Y') {
          Popdata.WRK_STD_NM_E = '신규작성필요'
        }
      }
      // 선택전 책임부서가 특수선 이고, 새로 선택된 책임부서가 특수선이 아닐 때
      else if(orgRespDeptCd?.substr(0, 1) === 'E' && Popdata?.RESP_DEPT_CD?.substr(0, 1) !== 'E') {
        Popdata.WRK_STD_NM_E = ''

        if(Popdata.WRK_STD_NEW === 'Y') {
          commonSearchApi({
            queryId: 'GET_WORK_STANDARD_NO',
            param: { DEPT_CD: Popdata.INJR_DEPT_CD },
          }).then((res) => {
            Popdata.WRK_STD_NM = '신규작성필요'
            Popdata.WRK_STD_NO = `${res.OUT_DATA}-01`
          })
        }
      }
    }
  }
}

// // 인원팝업
// const empPopupOpen = () => {
//   empPopup.value.openPopup({ EMP_NM: Popdata.SAFE_GAMGR_EMPKORNM })
// }

// const selectedemp = (row) => {
//   Popdata.SAFE_GAMGR_EMPKORNM = row.EMP_NM
//   Popdata.SAFE_GAMGR_EMP = row.EMP_NO
// }

const acdtOpen = () => {
  CausePopup.value.openPopup('사고분류')
  commonPopUp.value = '사고'
}

const locationPopupOpen = () => {
  CausePopup.value.openPopup('장소')
  commonPopUp.value = '장소'
}

// 작업표준서 팝업

const WRKSTDOpen = () => {
  // if (!WRK_STD_NMNot.value) {
  // }
  // Popdata.WIHEOM_YN = 'Y'
    console.log('hhh')
  Popdata.WRK_STD_NEW = 'N'
    WRK_STDPopUp.value.openPopup(Popdata.WRK_STD_NM)
}

const selectedWRKSTD = (param) => {
  Popdata.WRK_STD_NM = param.WS_NM
  Popdata.WRK_STD_NO = param.WS_ID
  Popdata.WRK_STD_NEW = 'N'
}

// 기인물 팝업오픈
const causePopupPopupOpen = () => {
  CausePopup.value.openPopup('기인물')
  commonPopUp.value = '기인물'
}
const onCauseSelected = (row) => {
  if (commonPopUp.value === '기인물') {
    Popdata.GIINMUL1_CD = row[0].COD
    Popdata.GIINMUL1_NM = row[0].TXT
    Popdata.GIINMUL2_CD = row[1].COD
    Popdata.GIINMUL2_NM = row[1].TXT
    Popdata.GIINMUL3_CD = row[2].COD
    Popdata.GIINMUL3_NM = row[2].TXT
  }
  if (commonPopUp.value === '사고') {
    Popdata.SAGO_DIV_L_NM = row[0].TXT
    Popdata.SAGO_DIV_M_NM = row[1].TXT
    Popdata.SAGO_DIV_S_NM = row[2].TXT

    Popdata.SAGO_DIV_L = row[0].COD
    Popdata.SAGO_DIV_M = row[1].COD
    Popdata.SAGO_DIV_S = row[2].COD
    if (Popdata.SAGO_DIV_L === 'E' || Popdata.SAGO_DIV_L === 'D') {
      Popdata.SAGO_TYPE_CD = null
      Popdata.GUGUP_USE = null
    }
  }
  if (commonPopUp.value === '장소') {
    Popdata.SAGO_LOC_L_NM = row[0].TXT
    Popdata.SAGO_LOC_M_NM = row[1].TXT
    Popdata.SAGO_LOC_S_NM = row[2].TXT

    Popdata.SAGO_LOC_L = row[0].COD
    Popdata.SAGO_LOC_M = row[1].COD
    Popdata.SAGO_LOC_S = row[2].COD
  }
}

const selectedDisaster = (param) => {
  let arr = grdTwo.value.getDataProvider().getJsonRows()
  for (let i of param) {
    let checkItem = arr.some((row) => row.RSN_CD === i.RSN_CD)
    if (!checkItem) {
      grdTwo.value.addRow({
        RSN_GRP_NM1: i.RSN_GRP_NM1,
        RSN_GRP_NM2: i.RSN_GRP_NM2,
        RSN_NM: i.RSN_NM,
        RSN_DET: '',
        DAECHEK: '',
        RSN_CD: i.RSN_CD,
        RSN_GRP_CD1: i.RSN_GRP_CD1,
        RSN_GRP_CD2: i.RSN_GRP_CD2,
        SAGO_SN: i.SAGO_SN,
        CMPNY_DIV: userStore.cmpnyDiv,  // 일렉일 경우 저장이 안되는 문제가 발생하여 userStore로 수정함. (2024.12.26)
        SAVE_YN: '',
        REMARK: '',
      })
    }
  }
}

const upDataRow = () => {
  SagoSearch()
}
// //  버튼이밴트

const onButtonsClick = (btn, gbn) => {
  if (gbn === '메인') {
    if (btn == 'btnCompleteSAF') {
      CompleteSend()
    }
    if (btn == 'btnCancelWrite') {
      CancelWrite()
    }

    // 안전확인
    if (btn == 'btnSafetyCheck') {
      SafetyCheck()
    }
    // 안전확인 취소
    if(btn=='btnSafetyCancel'){
      SafetyCancel()
    }

    // 종결
    if (btn == 'btnComplete') {
      // 사고 담당자가 아니면 return
      if(!(userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2))
        return
      
      Complete()
    }
    // 종결 취소
    if (btn == 'btnCancelComplete') {
      // 사고 담당자가 아니면 return
      if(!(userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2))
        return
        
      CancelComplete()
    }
  }
  if (gbn == '사고관리') {
    if (btn === 'btnUpdate') {
      new saveFlowHelper(vm, t)
        .setQuery(SagoMSave)
        .setAfter(() => {
          SagoSearch()
        })
        .run()
    }
  }
  if (gbn === '지연') {
    if (btn === 'btnUpdate') {
      new saveFlowHelper(vm, t)
        .setBefore(LATECheck)
        .setQuery(LATESaveData)
        .setAfter(() => {
          // emit('upData')
        })
        .run()
    }
  }
  if (gbn === '구급차') {
    if (btn === 'btnUpdate') {
      new saveFlowHelper(vm, t)
        .setBefore(GUGUPCheck)
        .setQuery(GUGUPaveData)
        .setAfter(() => {
          // emit('upData')
        })
        .run()
    }
  }
  if (gbn === '인적사항현황') {
    if (btn === 'btnCreate') {
      ManPopUp.value.openPopup(Popdata)
    }
    if (btn === 'btnDelete') {
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdMain, row: 'check' }])
        .setGridList([grdMain])
        .setBefore(DeltailChek)
        .setQuery(DeltailDelData)
        .setAfter(() => SagoSearch())
        .run()
    }
  }

  if (gbn === '재해원인') {
    if (btn === 'btnSearch') {
      new queryFlowHelper(vm, t)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .showMessage(false)
        .run()
    }
    if (btn === 'btnCreate') {
      Disaster.value.openPopup(Popdata)
    }

    if (btn === 'btnSetRCA') {
      grdTwo.value.addRow({
        RSN_GRP_NM1: 'RCA',
        RSN_GRP_NM2: '',
        RSN_NM: '',
        RSN_DET: '',
        DAECHEK: '',
        RSN_CD: 'A',
        RSN_GRP_CD1: 'C',
        RSN_GRP_CD2: 'A',
        SAGO_SN: Popdata.SAGO_SN,
        CMPNY_DIV: Popdata.CMPNY_DIV,
        SAVE_YN: 'N',
        REMARK: '',
      })
    }

    if (btn === 'btnUpdate') {
      new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdTwo, row: null }])
        .setGridList([grdTwo])
        .setBefore(validationCheck)
        .setQuery(saveData)
        .setAfter(() => {
          onButtonsClick('btnSearch', '재해원인')
        })
        .run()
    }

    if (btn === 'btnDelete') {
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdTwo, row: null }])
        .setGridList([grdTwo])
        .setBefore(validationCheck)
        .setQuery(deleteData)
        .setAfter(() => {
          onButtonsClick('btnSearch', '재해원인')
        })
        .run()
    }
  }

  if (gbn === '사고개요') {
    if (btn === 'btnUpdate') {
      console.log('dmndkd')
      new saveFlowHelper(vm, t)
        .setBefore(saGoCheck)
        .setQuery(saGosaveData)
        .setAfter(() => {
          
          emit('upData')
        })
        .run()
    }
  }
  if (gbn === '조사표') {
    if (btn === 'btnPrintHandwriting') {
      let params = {
        FILE_PATH: 'SAFA',
        FILE_NAME: '산업재해조사표.xlsx',
      }
      commonSampleDownFilesApi(params)
    }
  }
  if(gbn === '수시위험성평가') {
    if (btn === 'btnUpdate') {
      new saveFlowHelper(vm, t)
        //.setBefore(chkSaveDNG)
        .setQuery(saveDNG)
        .setAfter(() => {
          searchDNG()
          emit('upDngTab1')
        })
        .run()
    }
  }
  if(gbn === '수시위험성평가자') {
    if(btn === 'btnCreate') {
      empPopupOpen()
    } else if(btn === 'btnDelete') {
      const checkedRows = grdDng1.value.getGridView().getCheckedRows(true)
      const deleteParams = []

      if(checkedRows.length < 1) {
        Message.warn(t('선택한 데이터가 없습니다.'))
        return
      }

      for (const rowIdx of checkedRows) {
        const data = grdDng1.value.getDataProvider().getJsonRow(rowIdx)
        deleteParams.push(data)
      }

      if(!_.some(deleteParams, item => item.STATUS !== 'I' )) {
        grdDng1.value.getDataProvider().removeRows(checkedRows)
        grdDng1.value.getGridView().checkRows(checkedRows, false)
      } else {
        new deleteFlowHelper(vm, t)
          .setTargetGridRow([{ grid: grdDng1, row: 'check' }])
          .setGridList([grdDng1])
          .setQuery(() => { return commonExecuteApi({ queryId : 'SAFAB0020_DELETE_41', list: deleteParams }) })
          .setAfter(searchDNG1)
          .run()
      }
    }
  }
  if(gbn === '수시위험성평가내용') {
    if(btn === 'btnCreate') {
      if(Popdata.WRK_STD_NEW === 'Y' || Popdata?.RESP_DEPT_CD?.substr(0, 1) === 'E') {
        const row = grdDng2.value.getDataProvider().addRow({
          CMPNY_DIV: Popdata.CMPNY_DIV,
          SAGO_SN: Popdata.SAGO_SN,
          DNG_LVL: 'M',
        })

        grdDng2.value.getGridView().setCurrent({ dataRow: row })
        grdDng2.value.getGridView().checkRow(row)
      } else {
        workRiskList.value.openPopup({
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: userStore.bsnsCd,
          DEPT_CD: userStore.deptCd,
          WORK_STANDARD_NM: Popdata.WRK_STD_NM,
        })
      }
    } else if(btn === 'btnDelete') {
      const checkedRows = grdDng2.value.getGridView().getCheckedRows(true)
      const deleteParams = []

      if(checkedRows.length < 1) {
        Message.warn(t('선택한 데이터가 없습니다.'))
        return
      }

      for (const rowIdx of checkedRows) {
        const data = grdDng2.value.getDataProvider().getJsonRow(rowIdx)
        deleteParams.push(data)
      }

      if(!_.some(deleteParams, item => item.SEQ != null )) {
        grdDng2.value.getDataProvider().removeRows(checkedRows)
        grdDng2.value.getGridView().checkRows(checkedRows, false)
      } else {
        new deleteFlowHelper(vm, t)
          .setTargetGridRow([{ grid: grdDng2, row: 'check' }])
          .setGridList([grdDng2])
          .setQuery(() => { return commonExecuteApi({ queryId : 'SAFAB0020_DELETE_42', list: deleteParams }) })
          .setAfter(searchDNG2)
          .run()
      }
    }
  }
}

const saveDNG = () => {
  const chk1 = grdDng1.value.getGridView().getCheckedRows(true)
  const chk2 = grdDng2.value.getGridView().getCheckedRows(true)
  const params1 = []
  const params2 = []

  for (const rowIdx of chk1) {
    const data = grdDng1.value.getDataProvider().getJsonRow(rowIdx)
    params1.push(data)
  }

  for (const rowIdx of chk2) {
    const data = grdDng2.value.getDataProvider().getJsonRow(rowIdx)
    params2.push(data)
  }

  const params = {
    SAVE_40: {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      WRK_STD_NO: Popdata.WRK_STD_NO,
      WRK_STD_NM_E: Popdata.WRK_STD_NM_E,
      // WIHEOM_YN: Popdata.WIHEOM_YN,
      // WIHEOM_DESC: Popdata.WIHEOM_DESC,
    },
    SAVE_41: params1,
    SAVE_42: params2,
  }

  return commonRequest('/hse/safety/SAFAB0020/SAVE_DNG', {
    param: params,
  })
}

const chkSaveDNG = () => {
  if((Popdata.SAGO_DIV_L === 'A'||Popdata.SAGO_DIV_L === 'D'||Popdata.SAGO_DIV_L === 'E')
     && Popdata?.RESP_DEPT_CD?.substr(0, 1) !== 'E' && !Popdata.WRK_STD_NO){
    Message.warn(t('사고분류가 작업성, 물적, 아차이면 작업표준은 필수입력입니다.'))
    return false
  }

  if((Popdata.SAGO_DIV_L === 'A'||Popdata.SAGO_DIV_L === 'D'||Popdata.SAGO_DIV_L === 'E')
     && Popdata?.RESP_DEPT_CD?.substr(0, 1) === 'E' && chkEmpty(Popdata.WRK_STD_NM_E)){
    Message.warn(t('사고분류가 작업성, 물적, 아차이면 작업표준은 필수입력입니다.'))
    return false
  }

  return true
}


const SagoMSave = () => {
  if (Popdata.COME_SERIOUS_YN === 'S') {
    Popdata.JUNGDAE_YN = 'Y'
  } else {
    Popdata.JUNGDAE_YN = 'N'
  }
  let saveParams = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      SAGO_TYPE_CD: Popdata.SAGO_TYPE_CD,
      COME_SERIOUS_YN: Popdata.COME_SERIOUS_YN,
      RCA_FILE_ID: Popdata.RCA_FILE_ID,
      JEWE_YN: Popdata.JEWE_YN,
      OPEN_SCOPE: Popdata.OPEN_SCOPE,
      SLI_YN: Popdata.SLI_YN,
      JUNGDAE_YN: Popdata.JUNGDAE_YN,
      SAGO_HIDE_YN: Popdata.SAGO_HIDE_YN,
      SAGO_NM: Popdata.SAGO_NM,
      TONG_CHK : Popdata.TONG_CHK,
      RPT_CHK : Popdata.RPT_CHK
    },
  ]

  return commonExecuteApi({ queryId: 'SAFAB0020_save25', list: saveParams })
         .then((res)=>{
          commonExecuteApi({ queryId: 'SAFAB0020_save29', list: saveParams })
          .then((res)=>{console.log(res,'res')})
         })
}


//  메인버튼 이벤트
//  작성완료 / 발송 WRT_FN_DT
const CompleteSend = () => {  
  SagoSearch()
  let name = ''
  let SOSOG_DESC = ''
  let sago = `${Popdata.SAGO_DIV_M_NM}`
  let Date = `${dayjs(Popdata.OCCUR_DT).format('YYYY')}년 ${dayjs(
    Popdata.OCCUR_DT
  ).format('MM')}월 ${dayjs(Popdata.OCCUR_DT).format('DD')}일`

  console.log(injuSahang.value, 'injuSahang.value')
  // 지연 보고/등록 사유 자동 선택
  if(dayjs().diff(dayjs(Popdata.OCCUR_DT), 'day') > 2) {
    isLATE.value = true
  } else {
    isLATE.value = false
    Popdata.LATE_RSN = ''
  }

  if (injuSahang.value) {
    name = injuSahang.value.NAME ? injuSahang.value.NAME : ''
    SOSOG_DESC = injuSahang.value.SOSOG_DESC ? injuSahang.value.SOSOG_DESC : ''
  }
  // console.log('작성완료')
  if (Popdata.WRT_FN_EMP) {
    Message.warn(t('이미 작성완료 된 사안입니다.'))
    return ''
  }
  if (!saGoCheck()) {
    //Message.warn(t('사고 개요를 재대로 입력해주십시오.'))
    return ''
  }

  if (Popdata.SAGO_DIV_L === 'A' || Popdata.SAGO_DIV_L === 'B'){
    const peopleData = grdMain.value.getDataProvider().getJsonRows()
    const cnt = _.filter(peopleData, { PRSN_DIV: '1' }).length
    if (cnt < 1){
      Message.warn(t('사고형태가 작업성/비작업성인 경우 인적사항 현황 필수입니다.'))
      return ''
    }
  }

  // 사고형태가 물적 또는 아차인 경우 재해원인 및 예방 대책 필수 입력
  if (Popdata.SAGO_DIV_L === 'E' || Popdata.SAGO_DIV_L === 'D'){
    if (preCheck()){
      Message.warn(t('재해원인 및 예방대책은 필수 입력 입니다.'))
      return ''
    }
  }

  if (!Popdata.SAFE_GAMGR_EMPEMAIL) {
    Message.warn(t('등록된 안전과장의 메일이 없습니다.개별 연락 부탁드립니다.'))
   }
   if(isLATE.value){
    if(!LATECheck()){
      // Message.warn(t('지연보고시 지연사유는 필수입니다.'))
      return ''
    }
   }
  
  if(!chkSaveDNG()) {
    return ''
  }
  vm.$swal({
    title: t(
      '작성완료 요청 하시겠습니까? <br> ※주의 <br> 지금까지 작성한 사고개요 / 사고 상황 사진 <br> 모두 저장됩니다 <br> 팝업창이 닫힙니다.'
    ),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      let saveParams = []
      // Popdata.SAGO_RCV_DT = Popdata.SAGO_RCV_DT.replace(/-/g, '')
      Popdata.OCCUR_DT = Popdata.OCCUR_DT.replace(/-/g, '')
      Popdata.OCCUR_TIME = Popdata.OCCUR_TIME.replace(/:/g, '')
      // Popdata.WRT_FN_DT = Popdata.WRT_FN_DT ?? dayjs().format('YYYYMMDD')
      Popdata.WRT_FN_DT = dayjs().format('YYYYMMDD')
      Popdata.WRT_FN_EMP = userStore.empNo

      if (Popdata.SAGO_DIV_L === 'A' || Popdata.SAGO_DIV_L === 'D' || Popdata.SAGO_DIV_L === 'E') {
        Popdata.SLI_DATE = dayjs().format('YYYYMMDD') 
        Popdata.SLI_YN = 'Y'
      }

      if (Popdata.INJR_DEPT_CD2) {
        Popdata.INJR_DEPT_CD1 += `,${Popdata.INJR_DEPT_CD2}`
      }
      if (Popdata.INJR_DEPT_NM2) {
        Popdata.INJR_DEPT_NM1 += `,${Popdata.INJR_DEPT_NM2}`
      }
      if (Popdata.INJR_DEPT_CD3) {
        Popdata.INJR_DEPT_CD1 += `,${Popdata.INJR_DEPT_CD3}`
      }
      if (Popdata.INJR_DEPT_NM3) {
        Popdata.INJR_DEPT_NM1 += `,${Popdata.INJR_DEPT_NM3}`
      }
       if(Popdata.LATE_TYPE != '1' || !Popdata.LATE_TYPE){
        Popdata.LATE_TYPE = '0'
       } 

      saveParams.push(Popdata)
      console.log('saveParams', saveParams)

      // 저장
      commonExecuteApi({ queryId: 'SAFAB0020_save01', list: saveParams })
        .then((res) => {
          if (Popdata.SAFE_GAMGR_HNO) {
            Popdata.SAFE_GAMGR_HNO = Popdata.SAFE_GAMGR_HNO.replace(/-/g, '')
          }
          //SMS 발송

          // 사고 
          if(Popdata.SAFE_GAMGR_EMPEMAIL){
          if(isNoN.value && Popdata.SAGO_TYPE_CD !=='NON'){
            let sendSMSParams = {
              EMPNO_FROM: sagoEmpNo, // 김성일 매니저
              EMPNO_TO: Popdata.SAFE_GAMGR_EMP,
              SYSCODE: '156',
              FROM_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
              TO_P_NO: Popdata.SAFE_GAMGR_HNO,
              TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 사고 분류가 변경되었으니 확인 부탁드립니다.`,
            }


            let sendSMSParams2 = {
              EMPNO_FROM: sagoEmpNo2, // 강현웅 선임
              EMPNO_TO: Popdata.SAFE_GAMGR_EMP,
              SYSCODE: '156',
              FROM_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
              TO_P_NO: Popdata.SAFE_GAMGR_HNO,
              TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 사고 분류가 변경되었으니 확인 부탁드립니다.`,
            }
            
          commonSendSMS(sendSMSParams)
          commonSendSMS(sendSMSParams2)

          // 메일 발송
          mailParams.EMAIL = [Popdata.SAFE_GAMGR_EMPEMAIL]
          mailParams.SUBJECT = '사고 즉보 작성완료건'
          mailParams.CONTENT = `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 사고 분류가 변경되었으니 확인 부탁드립니다.`
          commonSendApi(mailParams).then((res) => {
            Message.success(t('메일이 전송되었습니다.'))
          })

          }
          else{
            let sendSMSParams = {
              EMPNO_FROM: sagoEmpNo, // 김성일 매니저
              EMPNO_TO: Popdata.SAFE_GAMGR_EMP,
              SYSCODE: '156',
              FROM_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
              TO_P_NO: Popdata.SAFE_GAMGR_HNO,
              TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 사고 즉보 작성완료를 했으니 확인 부탁드립니다.`,
            }

            let sendSMSParams2 = {
              EMPNO_FROM: sagoEmpNo2, // 김성일 매니저
              EMPNO_TO: Popdata.SAFE_GAMGR_EMP,
              SYSCODE: '156',
              FROM_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
              TO_P_NO: Popdata.SAFE_GAMGR_HNO,
              TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 사고 즉보 작성완료를 했으니 확인 부탁드립니다.`,
            }

          commonSendSMS(sendSMSParams)
          commonSendSMS(sendSMSParams2)

          // 메일 발송
          mailParams.EMAIL = [Popdata.SAFE_GAMGR_EMPEMAIL]
          mailParams.SUBJECT = '사고 즉보 작성완료건'
          mailParams.CONTENT = `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 사고 즉보 작성완료를 했으니 확인 부탁드립니다.`
          commonSendApi(mailParams).then((res) => {
            Message.success(t('메일이 전송되었습니다.'))
          })
          }
        }
        else{
          Message.warn(t('등록된 안전과장의 메일이 없습니다 직접연락 부탁드립니다.'))
        }



          // 지연
          if (isLATE.value) {
        
            LATESaveData()
          }
          if (isGU.value) {
            GUGUPaveData()
          }

          // 모바일 Hises APP PUSH 발송
          let empNoParram = {
            CMPNY_DIV: Popdata.CMPNY_DIV,
            EMP_NO_LIST: Popdata.INJR_DEPT_CD + ',' + Popdata.RESP_DEPT_CD,
          }

          // console.log('empNoParram', empNoParram)
          commonSearchApi({
            queryId: 'GET_PUSH_EMP_ID',
            param: empNoParram,
          }).then((res) => {
            // console.log('GET_PUSH_EMP_ID', res)
            let pushParam = {
              list: res.ORESULT_CUR,
              TITLE: '안전사고 즉보',
              BODY: `${Popdata.OCCUR_DT}, ${Popdata.SAGO_LOC_S_NM}, ${Popdata.SAGO_DIV_L_NM}-${Popdata.SAGO_DIV_M_NM}-${Popdata.SAGO_DIV_S_NM} 사고가 발생한 이력이 있습니다. 안전사고 즉보 확인하여 교육 부탁드립니다.`,
              PATH: '/mobile/SAF/SAF0010',
            }
            commonSendFirebase(pushParam)
          })
          emit('close')
        })
        .catch((err) => {
          console.log(err, ';;;err')
        })
    }
  })
}

//  작성완료 취소
const CancelWrite = () => {
  if (!Popdata.WRT_FN_EMP) {
    return Message.warn(t('작성완료 후 이용해주시기 바랍니다.'))
  }
  if (Popdata.WRT_CNFM_DT) {
    return Message.warn(t('이미 안전확인 된 사항입니다.'))
  }
  vm.$swal({
    title: t('작성취소 요청 하시겠습니까? <br> ※주의 <br> 팝업창이 닫힙니다.'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      // 취소 사유 입력 팝업 Open
      sAFAB0020_Reason.value.openPopup()
    }
  })
}

// 작성완료 취소 처리
const InputReason = (val) => {

  Popdata.CANCEL_REASON1 = val

  let saveParams = []
  saveParams.push(Popdata)
  let name = ''
  let SOSOG_DESC = ''
  let sago = `${Popdata.SAGO_DIV_M_NM}`
  let Date = `${dayjs(Popdata.OCCUR_DT).format('YYYY')}년 ${dayjs(
    Popdata.OCCUR_DT
  ).format('MM')}월 ${dayjs(Popdata.OCCUR_DT).format('DD')}일`

  if (injuSahang.value) {
    name = injuSahang.value.NAME ? injuSahang.value.NAME : ''
    SOSOG_DESC = injuSahang.value.SOSOG_DESC ? injuSahang.value.SOSOG_DESC : ''
  }

  // 메일 발송
  commonExecuteApi({ queryId: 'SAFAB0020_save12', list: saveParams }).then(
    (res) => {

      // 메일 발송
      mailParams.EMAIL = [Popdata.WRT_FN_EMP_EMAIL]
      mailParams.SUBJECT = '사고 즉보 작성완료 취소 건'
      mailParams.CONTENT = `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전사고 즉보 작성이 취소되었으니, 내용 확인 후 재작성 요청드립니다.` +
                           `<br> 취소사유 : ${val}`
                            
      // commonSendApi(mailParams).then((res) => {
      //   Message.success(t('메일이 전송되었습니다.'))
      // })

      emit('close')
    }
  )
}

//  안전확인
const SafetyCheck = () => {
  // if(chkItems.PEOPLE === 'N' || chkItems.DESC === 'N' || chkItems.INFO === 'N' || chkItems.PICTURE === 'N' ||
  //    (isLATE.value && chkItems.LATE === 'N') || (isGU.value && chkItems.AMBUL === 'N')) {
  //   vm.$swal({
  //     title: t(
  //       `즉보/보고서 작성내용이 확인되지 않았습니다.
  //       내용 확인 후 안전확인 부탁드립니다.

  //       <확인 필요 항목>
  //       인적사항 현황, 안전 사고 개요, 사고 정보, 사고 상황 사진,
  //       지연 보고/등록 사유(해당할 경우), 구급차 미이용 경위서(해당할 경우)`
  //     ),
  //   })

  //   return
  // }

  SagoSearch()
  let name = ''
  let SOSOG_DESC = ''
  let sago = `${Popdata.SAGO_DIV_M_NM} `
  let Date = `${dayjs(Popdata.OCCUR_DT).format('YYYY')}년 ${dayjs(
    Popdata.OCCUR_DT
  ).format('MM')}월 ${dayjs(Popdata.OCCUR_DT).format('DD')}일`

  if (injuSahang.value) {
    name = injuSahang.value.NAME ? injuSahang.value.NAME : ''
    SOSOG_DESC = injuSahang.value.SOSOG_DESC
      ? injuSahang.value.SOSOG_DESC
      : ''
  }
  vm.$swal({
    title: t('안전확인 하시겠습니까? <br> ※주의 <br> 팝업창이 닫힙니다. '),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      if (!Popdata.WRT_FN_EMP) {
        return Message.warn(t('작성완료 후 이용해주시기 바랍니다.'))
      }

      if (Popdata.WRT_CNFM_DT) {
        return Message.warn(t('이미 안전확인이 되어있습니다.'))
      }
      let saveParams = []

      Popdata.WRT_CNFM_DT = dayjs().format('YYYYMMDD')
      Popdata.WRT_CNFM_EMP = userStore.empNo

      saveParams.push(Popdata)

      //  .책임부서 구하기
      let mail = ''
      let hno = ''
      let empno = ''

      // 메일 발송

      console.log(Popdata.SAGODEMAIL, 'Popdata.SAGODEasdMAIL')
      console.log(mail, 'mail')
      console.log(hno, 'hno')
      console.log(empno, 'empno')
      if (Popdata.SAFE_GAMGR_HNO) {
        Popdata.SAFE_GAMGR_HNO = Popdata.SAFE_GAMGR_HNO.replace(/-/g, '')
      }
      console.log(Popdata.SAFE_GAMGR_HNO, 'Popdata.SAFE_GAMGR_HNO')
      console.log(Popdata.SAFE_GAMGR_EMPEMAIL, 'Popdata.SAFE_GAMGR_EMPEMAIL')
      commonExecuteApi({ queryId: 'SAFAB0020_save13', list: saveParams }).then(
        (res) => {
          commonSearchApi({
            queryId: 'SAFAB0010_search04',
            param: {
              CMPNY_DIV: Popdata.CMPNY_DIV,
              DEPT_CD: Popdata.RESP_DEPT_CD,
            },
          }).then((res) => {
            console.log(res, '안전확인 그것')
            if (res.ORESULT_CUR.length !== 0) {
              mail = res.ORESULT_CUR[0].EMAIL
              if (res.ORESULT_CUR[0].HND_PHN) {
                hno = res.ORESULT_CUR[0].HND_PHN.replace(/-/g, '')
              }
              empno = res.ORESULT_CUR[0].EMP_NO
              if (
                Popdata.SAGO_TYPE_CD == 'SJE' ||
                Popdata.SAGO_TYPE_CD == 'GMS' ||
                Popdata.SAGO_TYPE_CD == 'HRS' 
              ) {
                if(Popdata.SAGO_DIV_L ==='B'){
                  console.log('알람 비작업성')
                  let sendSMSParams = {
                    EMPNO_FROM: Popdata.SAFE_GAMGR_EMP,
                    EMPNO_TO: sagoEmpNo,
                    SYSCODE: '156',
                    FROM_P_NO: Popdata.SAFE_GAMGR_HNO.replace(/-/g, ''),
                    TO_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
                    TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전 즉보 종결 부탁드립니다.`,
                  }

                  let sendSMSParams2 = {
                    EMPNO_FROM: Popdata.SAFE_GAMGR_EMP,
                    EMPNO_TO: sagoEmpNo2,
                    SYSCODE: '156',
                    FROM_P_NO: Popdata.SAFE_GAMGR_HNO.replace(/-/g, ''),
                    TO_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
                    TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전 즉보 종결 부탁드립니다.`,
                  }

                commonSendSMS(sendSMSParams)
                commonSendSMS(sendSMSParams2)

                // 메일 발송
                if (Popdata.SAGODEMAIL) {
                  mailParams.EMAIL = [Popdata.SAGODEMAIL]
                  mailParams.SUBJECT = '안전 즉보 종결 안내'
                  mailParams.CONTENT = `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전 즉보 종결 부탁드립니다.`
                  commonSendApi(mailParams).then((res) => {
                    Message.success(t('메일이 전송되었습니다.'))
                  })
                } else {
                  console.log('알람 비작업성')
                  Message.warn(
                    t(
                      '사고담당자의 메일 정보가 없습니다 개별연락 부탁드립니다.'
                    )
                  )
                }
                }
                else{
                  console.log('알람 사고성')
                let number = [hno, Popdata.SAFE_GAMGR_HNO]
                let empnoList = [empno, Popdata.SAFE_GAMGR_EMP]
                for (let i in number) {
                  let sendSMSParams = {
                    EMPNO_FROM: sagoEmpNo, // 김성일 매니저
                    EMPNO_TO: empnoList[i],
                    SYSCODE: '156',
                    FROM_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
                    TO_P_NO: number[i],
                    TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전사고 보고서 등록을 해주시기 바랍니다.`,
                  }

                  let sendSMSParams2 = {
                    EMPNO_FROM: sagoEmpNo2, // 강현웅 선임
                    EMPNO_TO: empnoList[i],
                    SYSCODE: '156',
                    FROM_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
                    TO_P_NO: number[i],
                    TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전사고 보고서 등록을 해주시기 바랍니다.`,
                  }

                  commonSendSMS(sendSMSParams)
                  commonSendSMS(sendSMSParams2)
                }

                // 메일 발송
                mailParams.EMAIL = [mail, Popdata.SAFE_GAMGR_EMPEMAIL]
                mailParams.SUBJECT = '안전사고보고서 등록 필요 안내 '
                mailParams.CONTENT = `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전사고 보고서 등록을 해주시기 바랍니다.`
                commonSendApi(mailParams).then((res) => {
                  Message.success(t('메일이 전송되었습니다.'))
                })
                }
               
              }
              // 일반사고일경우  휴업 3일 미만 일반사고 (직영/협력사)
              if (
                Popdata.SAGO_TYPE_CD == 'SNE' ||
                Popdata.SAGO_TYPE_CD == null ||
                Popdata.SAGO_TYPE_CD == ''
              ) {
                
                let sendSMSParams = {
                  EMPNO_FROM: Popdata.SAFE_GAMGR_EMP,
                  EMPNO_TO: sagoEmpNo,
                  SYSCODE: '156',
                  FROM_P_NO: Popdata.SAFE_GAMGR_HNO.replace(/-/g, ''),
                  TO_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
                  TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전 즉보 종결 부탁드립니다.`,
                }

                let sendSMSParams2 = {
                  EMPNO_FROM: Popdata.SAFE_GAMGR_EMP,
                  EMPNO_TO: sagoEmpNo2,
                  SYSCODE: '156',
                  FROM_P_NO: Popdata.SAFE_GAMGR_HNO.replace(/-/g, ''),
                  TO_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
                  TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전 즉보 종결 부탁드립니다.`,
                }

                commonSendSMS(sendSMSParams)
                commonSendSMS(sendSMSParams2)

                // 메일 발송
                if (Popdata.SAGODEMAIL) {
                  mailParams.EMAIL = [Popdata.SAGODEMAIL]
                  mailParams.SUBJECT = '안전 즉보 종결 안내'
                  mailParams.CONTENT = `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전 즉보 종결 부탁드립니다.`
                  commonSendApi(mailParams).then((res) => {
                    Message.success(t('메일이 전송되었습니다.'))
                  })
                } else {
                  Message.warn(
                    t(
                      '사고담당자의 메일 정보가 없습니다 개별연락 부탁드립니다.'
                    )
                  )
                }
              }

              // 사고처리 구분이 미정인경우
              if (Popdata.SAGO_TYPE_CD == 'NON') {
                let sendSMSParams = {
                  EMPNO_FROM: Popdata.SAFE_GAMGR_EMP,
                  EMPNO_TO: empno,
                  SYSCODE: '156',
                  FROM_P_NO: Popdata.SAFE_GAMGR_HNO.replace(/-/g, ''),
                  TO_P_NO: hno,
                  TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 사고 처리 구분이 미정입니다 24시간이내 결정후 작성부탁드립니다.`,
                }

                commonSendSMS(sendSMSParams)

                // 메일 발송

                mailParams.EMAIL = [mail]
                mailParams.SUBJECT = '사고 처리 구분 미정 안내'
                mailParams.CONTENT = `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 사고 처리 구분이 미정입니다 24시간이내 결정후 작성부탁드립니다.`
                commonSendApi(mailParams).then((res) => {
                  Message.success(t('메일이 전송되었습니다.'))
                })
              }

              emit('close')
            }
            if (res.ORESULT_CUR.length == 0) {
              Message.warn(
                t(
                  '책임부서의 연락처가 없습니다.안전과장 과 책임부서의 부서장에게 개별연락 부탁드립니다.'
                )
              )
              emit('close')
            }
          })
          // 사고처리구분이 없을경우
          // if (!Popdata.SAGO_TYPE_CD) {
          //   let sendSMSParams = {
          //     EMPNO_FROM: Popdata.SAFE_GAMGR_EMP,
          //     EMPNO_TO: empno,
          //     SYSCODE: "000",
          //     FROM_P_NO: Popdata.SAFE_GAMGR_HNO,
          //     TO_P_NO: hno,
          //     TITLE: `사고번호 :${Popdata.SAGO_SN} 발생일자:${Popdata.OCCUR_DT} <br> 사고 처리 구분 결정을 해주시기바랍니다.`,
          //   }

          //   commonSendSMS(sendSMSParams)

          //   // 메일 발송
          //   mailParams.EMAIL = [mail]
          //   mailParams.SUBJECT = "사고 처리 구분 결정 안내"
          //   mailParams.CONTENT = `사고번호 :${Popdata.SAGO_SN} 발생일자:${Popdata.OCCUR_DT} <br> 사고 처리 구분 결정을 해주시기바랍니다.`
          //   commonSendApi(mailParams)
          // }
          // 사고 처리구분이 산재/ 경미공상일경우
        }
      )
    }
  })
}

const Complete = () => {
  vm.$swal({
    title: t(
      '종결처리 하시겠습니까? <br> ※주의 <br> 더이상 수정을 하지못합니다.<br> 팝업창이 닫힙니다.'
    ),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      if (!Popdata.WRT_FN_EMP) {
        return Message.warn(t('작성완료 후 이용해주시기 바랍니다.'))
      }

      if (!Popdata.WRT_CNFM_DT) {
        return Message.warn(t('안전확인 후 이용바랍니다.'))
      }

      if (Popdata.HSE_CLS_DT) {
        return Message.warn(t('이미 종결처리 되어있습니다.'))
      }
      let saveParams = []

      Popdata.HSE_CLS_DT = dayjs().format('YYYYMMDD')
      Popdata.HSE_CLS_NM = userStore.empNo

      saveParams.push(Popdata)

      // 메일 발송

      commonExecuteApi({ queryId: 'SAFAB0020_save14', list: saveParams }).then(
        (res) => {
          emit('close')
        }
      )
    }
  })
}

const CancelComplete = () => {
  vm.$swal({
    title: t('종결을 취소 하시겠습니까? <br> ※주의 <br> 팝업창이 닫힙니다.'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      if (!Popdata.WRT_FN_EMP) {
        return Message.warn(t('작성완료 후 이용해주시기 바랍니다.'))
      }

      if (!Popdata.WRT_CNFM_DT) {
        return Message.warn(t('안전확인 후 이용바랍니다.'))
      }

      if (!Popdata.HSE_CLS_DT) {
        return Message.warn(t('종결처리 후 이용바랍니다.'))
      }
      let saveParams = []

      saveParams.push(Popdata)

      // 메일 발송

      commonExecuteApi({ queryId: 'SAFAB0020_save15', list: saveParams }).then(
        (res) => {
          emit('close')
        }
      )
    }
  })
}

// 저장 사고개요
const saGoCheck = () => {
// if(Popdata.SAGO_DIV_L === 'A'){
//   if(!Popdata.WRK_STD_NM){
//     Message.warn(t('사고분류가 작업성이면 작업표준은 필수입력입니다.'))
//     return false
//   }
// }
//   if(Popdata.WIHEOM_YN ==='N'){
//     if(!Popdata.WIHEOM_DESC){
//       Message.warn(t('개정 필요여부가 불필요 일경우 불필요 사유는 필수 입력입니다.'))
//     return false
//     }
//   }

console.log('사고개요 : ', Popdata)

  if (!Popdata.OCCUR_DT) {
    Message.warn(t('발생일시는 필수 입력입니다.'))
    return false
  }
  if (!Popdata.OCCUR_TIME) {
    Message.warn(t('발생일시는 필수 입력입니다.'))
    return false
  }
  if (!Popdata.INJR_DEPT_NM) {
    Message.warn(t('재해조직은 필수 입력입니다.'))
    return false
  }
  if (!Popdata.RESP_DEPT_NM) {
    Message.warn(t('책임조직은 필수 입력입니다.'))
    return false
  }
  if (!Popdata.SAGO_LOC_L_NM) {
    Message.warn(t('발생장소는 필수 입력입니다.'))
    return false
  }
  if (!Popdata.SAGO_LOC_DTL) {
    Message.warn(t('상세장소는 필수 입력입니다.'))
    return false
  }
  if (!Popdata.SAGO_DIV_L_NM) {
    Message.warn(t('사고형태는 필수 입력입니다.'))
    return false
  }
  
  if(Popdata.SAGO_DIV_L !== 'E' && Popdata.SAGO_DIV_L !== 'D'){
    if (!Popdata.GUGUP_USE) {
    Message.warn(t('구급차이용여부는 필수 입력입니다.'))
    return false
  }
  }
  
  // if (!Popdata.SAGO_RCV_DT) {
    // Message.warn(t('사고접수일은 필수 입력입니다.'))
    // return false
  // }
  if (!Popdata.RESPON_DIV) {
    Message.warn(t('책임소속은 필수 입력입니다.'))
    return false
  }
  if (!Popdata.PROCESS_CD) {
    Message.warn(t('공정명은 필수 입력입니다.'))
    return false
  }
  if (!Popdata.GIINMUL1_NM) {
    Message.warn(t('기인물은 필수 입력입니다.'))
    return false
  }

  // if (!Popdata.WIHEOM_YN) {
  //   Message.warn(t('위험성재평가는 필수 입력입니다.'))
  //   return false
  // }

  if(Popdata.SAGO_DIV_L === 'A'){
    if(!Popdata.SAGO_TYPE_CD){
      Message.warn(t('사고처리 구분은 필수입니다.'))
      return false
    }
    // if(Popdata?.RESP_DEPT_CD?.substr(0, 1) !== 'E' && !Popdata.WRK_STD_NO){
    //   Message.warn(t('사고분류가 작업성이면 작업표준은 필수입력입니다.'))
    //   return false
    // }
  } else {
    // 사고 분류가 작업성, 물적, 아차가 아닐 떄 사고처리 구분 체크
    if (Popdata.SAGO_DIV_L !== 'D' && Popdata.SAGO_DIV_L !== 'E'){
      if(!Popdata.SAGO_TYPE_CD){
        Message.warn(t('사고처리 구분은 필수입니다.'))
        return false
      } 
    }
  }

  if (!Popdata.SAGO_GAEYO) {
    Message.warn(t('사고내용은 필수 입력입니다.'))
    return false
  } else {
    const gaeyoRow = Popdata.SAGO_GAEYO.split('\n')

    if(gaeyoRow.length > 12) {
      Message.warn(t('사고내용은 12줄 이하 입력 가능합니다.'))
      return false
    }

    // console.log('Popdata.SAGO_GAEYO.length', Popdata.SAGO_GAEYO.length)
    if(Popdata.SAGO_GAEYO.length > 1100) {
      Message.warn(t('사고내용은 1100자 이하 입력 가능합니다.'))
      return false
    }
  }

  if(Popdata.GUGUP_USE === 'X'){
    console.log(Popdata.AMBUL_NOT_DESC,'Popdata.AMBUL_NOT_DESC')
    if(!Popdata.AMBUL_NOT_DESC){
      Message.warn(t('구급차를 이용하지않았으면 구급차 미이용 경위서 작성은 필수입니다.'))
    return false
    }
    
  }
  console.log('asdfjksdafksdfk')
  return true
}

// 재해 원인 및 예방대책 입력 체크 (사고형태가 물적, 아차인 경우만)
const preCheck = () => {
  if (grdTwo.value.getDataProvider().getJsonRows().length === 0){
    return true
  }

  return false
}

const saGosaveData = async () => {
  WORK_STANDARD_UNIT.value = []
  WORK_STANDARD_ACT.value = []
  WORK_STANDARD_RISK.value = []
  let saveParams = []
  // Popdata.SAGO_RCV_DT = Popdata.SAGO_RCV_DT.replace(/-/g, '')
  Popdata.OCCUR_DT = Popdata.OCCUR_DT.replace(/-/g, '')
  Popdata.OCCUR_TIME = Popdata.OCCUR_TIME.replace(/:/g, '')
  if (Popdata.COME_SERIOUS_YN == 'S') {
    Popdata.JUNGDAE_YN = 'Y'
  }
  if (Popdata.INJR_DEPT_CD2) {
    Popdata.INJR_DEPT_CD1 += `,${Popdata.INJR_DEPT_CD2}`
  }
  if (Popdata.INJR_DEPT_NM2) {
    Popdata.INJR_DEPT_NM1 += `,${Popdata.INJR_DEPT_NM2}`
  }
  if (Popdata.INJR_DEPT_CD3) {
    Popdata.INJR_DEPT_CD1 += `,${Popdata.INJR_DEPT_CD3}`
  }
  if (Popdata.INJR_DEPT_NM3) {
    Popdata.INJR_DEPT_NM1 += `,${Popdata.INJR_DEPT_NM3}`
  }

  if (!Popdata.SAGO_PLAN_CHK) {
    if (Popdata.SAGO_TYPE_CD === 'SJE') {
      Popdata.SAGO_PLAN_CHK = 'N'
    } else {
      Popdata.SAGO_PLAN_CHK = ''
    }
  }
  if((SAGOORGTYPE.value !== Popdata.SAGO_TYPE_CD)||(COMESERIOUSYN.value !== Popdata.COME_SERIOUS_YN)||(RESPDEPTCD.value !== Popdata.RESP_DEPT_CD)){
      Popdata.SLI_DATE = dayjs().format('YYYYMMDD') 
    console.log('사고타입변경일어남')
    }
  else{
    console.log('사고타입변경안일어남')
  }

    console.log(Popdata.SLI_DATE,'Popdata.SLI_DATE')

  saveParams.push(Popdata)
  console.log(saveParams, 'saveParams')
  return commonExecuteApi({
    queryId: 'SAFAB0020_save01',
    list: saveParams,
  }).then((res) => {


    /*
    2024.12 김성일 매니저
    사고즉보가 아닌 사고보고서 작성 시 작업표준을 입력하고 Hi-Standard 개정 필요 여부를 필요로 체크한 후 작성완료가 되면 해당 작업표준의 위험성평가 진행현황이 개정작업중으로 변경될 수 있도록 수정 요청
    */
   /*
    if (Popdata.WRK_STD_NEW === 'Y' || !isSearchST.value) {
      let params = [
        {
          SAVE_STATUS: 'C',
          WORK_STANDARD_ID: Popdata.workStandardID,
          COMPANY_CD: Popdata.CMPNY_DIV,
          DEPT_CD: Popdata.INJR_DEPT_CD,
          DEPT_NM: Popdata.INJR_DEPT_NM,
          CORP_ASGN_CD: Popdata.RESP_DEPT_CD,
          CORP_ASGN_NM: Popdata.RESP_DEPT_NM,
          GUBUN_CD: ' ',
          WORK_STANDARD_NO: Popdata.workStandardNo,
          WORK_STANDARD_REVISION: 1,
          WORK_STANDARD_NM: Popdata.WRK_STD_NM,
          PROGRESS_STATUS: 'CP_AW',
          WORK_STANDARD_KIND: 'C',
          RISK_TYPE: 'RISK_TYPE-02',
          WORK_STANDARD_DESC: '',
          PRODUCTION_MANAGER: '',
          POSITION_MANAGER: '',
          WORK_TOOLS: '',
          EQUIPMENT_TYPE: '',
          USE_CHEMICAL: '',
          REVIEWER: '',
          CHK_REQUIRED: '',
          USR_ID: userStore.empNo,
        },
      ]
      console.log('params')
      commonExecuteApi({ queryId: 'RSKBA0010_SAVE_01', list: params }).then(
        (res) => {
          console.log(params, '신규작성')
        }
      )
    }
    if (Popdata.WIHEOM_YN === 'Y') {
      if (!Popdata.WRK_STD_NO) {
        return
      }
      let id = Popdata.WRK_STD_NO
      let transCd = 'ko'

      const searchunit = async () => {
        commonSearchApi({
          queryId: 'RSKBA0010_SEARCH_05',
          param: { WORK_STANDARD_ID: id },
        }).then(async (res) => {
          WORK_STANDARD_UNIT.value = res.ORESULT_CUR
          WORK_STANDARD_UNIT.value.map((row) => (row.STATUS = 'C'))

          await searchAct(id)
          console.log(WORK_STANDARD_UNIT.value, '2....WORK_STANDARD_UNIT')
        })
      }
      const searchAct = async (id) => {
        await commonSearchApi({
          queryId: 'RSKBA0010_SEARCH_06',
          param: { WORK_STANDARD_ID: id, TRANS: 'ko' },
        }).then(async (res) => {
          WORK_STANDARD_ACT.value = res.ORESULT_CUR
          WORK_STANDARD_ACT.value.map((row) => (row.STATUS = 'C'))

          await searchRisk(id, res)
          console.log(WORK_STANDARD_ACT.value, '3.....WORK_STANDARD_ACT.value')
        })
      }
      const searchRisk = async (id, data) => {
        // PKG_RSKBA0010.WORK_STANDARD_RISK_S
        await commonSearchApi({
          queryId: 'RSKBA0010_SEARCH_07',
          param: { WORK_STANDARD_ID: id, TRANS: 'ko' },
        }).then(async (res) => {
          WORK_STANDARD_RISK.value = res.ORESULT_CUR
          WORK_STANDARD_RISK.value.map((row) => (row.STATUS = 'C'))
          saveData()
          console.log(WORK_STANDARD_RISK.value, '4....WORK_STANDARD_RISK')
        })
      }

      commonSearchApi({
        queryId: 'RSKBA0010_SEARCH_04',
        param: { WORK_STANDARD_ID: id, TRANS: transCd },
      }).then(async (res) => {
        let data = res.ORESULT_CUR[0]
        // return console.log(data)
        WORK_STANDARD_MASTER.WORK_STANDARD_ID = data.WORK_STANDARD_ID
        WORK_STANDARD_MASTER.SAVE_TYPE = 'U'
        WORK_STANDARD_MASTER.SAVE_STATUS = 'C'
        WORK_STANDARD_MASTER.COMPANY_CD = data.COMPANY_CD
        WORK_STANDARD_MASTER.DEPT_CD = data.DEPT_CD
        WORK_STANDARD_MASTER.DEPT_NM = data.DEPT_NM
        WORK_STANDARD_MASTER.CORP_ASGN_CD = data.CORP_ASGN_CD
        WORK_STANDARD_MASTER.CORP_ASGN_NM = data.CORP_ASGN_NM
        WORK_STANDARD_MASTER.GUBUN_NM = data.GUBUN_NM
        WORK_STANDARD_MASTER.GUBUN_CD = data.GUBUN_CD
        WORK_STANDARD_MASTER.WORK_STANDARD_NO = data.WORK_STANDARD_NO
        WORK_STANDARD_MASTER.WORK_STANDARD_REVISION =
          data.WORK_STANDARD_REVISION
        WORK_STANDARD_MASTER.WORK_STANDARD_NM = data.WORK_STANDARD_NM
        WORK_STANDARD_MASTER.WORK_TOOLS = data.WORK_TOOLS
        WORK_STANDARD_MASTER.EQUIPMENT_TYPE = data.EQUIPMENT_TYPE
        WORK_STANDARD_MASTER.USE_CHEMICAL = data.USE_CHEMICAL
        WORK_STANDARD_MASTER.REVIEWER = data.REVIEWER
        WORK_STANDARD_MASTER.CHK_REQUIRED = data.CHK_REQUIRED
        WORK_STANDARD_MASTER.PROGRESS_STATUS = 'UP_AW'
        WORK_STANDARD_MASTER.WORK_STANDARD_KIND = 'U'
        WORK_STANDARD_MASTER.RISK_TYPE = 'RISK_TYPE-02'
        WORK_STANDARD_MASTER.C_DATE = data.C_DATE
        WORK_STANDARD_MASTER.U_DATE = dayjs().format('YYYY-MM-DD')
        WORK_STANDARD_MASTER.WORK_DATE = dayjs().format('YYYY-MM-DD')
        WORK_STANDARD_MASTER.APPR_DT = ''
        WORK_STANDARD_MASTER.WORK_STANDARD_RISK_COUNT =
          data.WORK_STANDARD_RISK_COUNT
        WORK_STANDARD_MASTER.WORK_STANDARD_RISK_OVER_COUNT =
          data.WORK_STANDARD_RISK_OVER_COUNT
        WORK_STANDARD_MASTER.WORK_STANDARD_AVG_RISK =
          data.WORK_STANDARD_AVG_RISK
        WORK_STANDARD_MASTER.SRSRM_ALL = data.SRSRM_ALL
        WORK_STANDARD_MASTER.SRSRM_COMPLETE = data.SRSRM_COMPLETE
        WORK_STANDARD_MASTER.RATE = data.RATE
        WORK_STANDARD_MASTER.WORK_STANDARD_DESC = ''
        WORK_STANDARD_MASTER.USER_INFO = data.USER_INFO
        WORK_STANDARD_MASTER.IS_SAVE = ''
        console.log(WORK_STANDARD_MASTER, 'WORK_STANDARD_MASTER')
        await searchunit(id)
        console.log(WORK_STANDARD_MASTER, '1....WORK_STANDARD_MASTER')
      })

      const saveData = (res) => {
        commonRskSaveApi({
          WORK_STANDARD_ID: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
          DEPT_CD: WORK_STANDARD_MASTER.DEPT_CD,
          USR_ID: WORK_STANDARD_MASTER.USR_ID,
          MASTER: WORK_STANDARD_MASTER,
          unitList: WORK_STANDARD_UNIT.value,
          actList: WORK_STANDARD_ACT.value,
          riskList: WORK_STANDARD_RISK.value,
        }).then((res) => {
          console.log(res, 'resdlkdl')
          // 재평가 저장
          let param = [
            {
              CMPNY_DIV: Popdata.CMPNY_DIV,
              SAGO_SN: Popdata.SAGO_SN,
              WRK_STD_NO: WORK_STANDARD_MASTER.WORK_STANDARD_ID,
            },
          ]
          commonExecuteApi({ queryId: 'SAFAB0020_save23', list: param }).then(
            (res) => {
              console.log('여 기까지 데이터', res, 'res')
            }
          )
        })
      }
    }
    */

    
          // 지연
  if (isLATE.value) {
    LATESaveData()
  }
  if (isGU.value) {
    GUGUPaveData()
  }

  })
}

// 삭제 인적사항
const DeltailChek = async () => {
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()

  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  return true
}

const DeltailDelData = async () => {
  let checkedRow = await grdMain.value.getGridView().getCheckedRows()
  let param = []

  await checkedRow.forEach(async (item) => {
    let data = await grdMain.value.getDataProvider().getJsonRow(item)

    param.push(data)
  })

  return commonExecuteApi({ queryId: 'SAFAB0010_delete02', list: param })
}

// 조회 재해원인
const searchData = (idx) => {
  let param = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    SAGO_SN: Popdata.SAGO_SN,
  }
  return commonSearchApi({ queryId: 'SAFAB0020_search07', param: param })
}

const afterSearch = (res) => {
  grdTwo.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 저장 재해원인
const validationCheck = () => {
  let checkedRows = grdTwo.value.getGridView().getCheckedRows()

  let valD = []
  if (Popdata.COME_SERIOUS_YN == 'Y' || Popdata.COME_SERIOUS_YN == 'S') {
    for (let rowIdx of checkedRows) {
      let data = grdTwo.value.getDataProvider().getJsonRow(rowIdx)
      if (data.RSN_GRP_CD1 === 'C') {
        valD.push(data)
      }
    }
    console.log(valD, 'vv')
    if (valD.length === 0) {
      Message.warn(
        t('사고강도가 중대성 사고 / 중대재해일시 RCA등록 1건이상은 필수입니다.')
      )
      return false
    }
  }

  if (checkedRows.length === 0) {
    Message.warn(t('선택된 데이터가 없습니다.'))

    return false
  } else {
    return true
  }
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdTwo.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdTwo.value.getDataProvider().getJsonRow(rowIdx)

    saveParams.push(data)
  }

  return commonExecuteApi({
    queryId: 'SAFAB0020_save02',
    list: saveParams,
  }).then((res) => {
    let param = [
      {
        CMPNY_DIV: Popdata.CMPNY_DIV,
        SAGO_SN: Popdata.SAGO_SN,
        RCA_FILE_ID: Popdata.RCA_FILE_ID,
      },
    ]

    commonExecuteApi({ queryId: 'SAFAB0020_save09', list: param })
  })
}

// 삭제 재해원인

const deleteData = () => {
  let delParams = []
  let checkedRows = grdTwo.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdTwo.value.getDataProvider().getJsonRow(rowIdx)
    delParams.push(data)
  }

  return commonExecuteApi({ queryId: 'SAFAB0020_delete04', list: delParams })
}

//  시간 유효성검사

const formatTimeFromInput = (inputTime) => {
  const timePattern = /^([01]?[0-9]|2[0-3])([0-5][0-9])$/
  if (!timePattern.test(inputTime)) {
    return ''
  }

  const hours = inputTime.substring(0, 2)
  const minutes = inputTime.substring(2)
  return `${hours}:${minutes}`
}

const formatAndDisplayTime = () => {
  Popdata.OCCUR_TIME = formatTimeFromInput(Popdata.OCCUR_TIME)
}

//그리드1 속성셋팅
const grdProps1_admin = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ['BIRTHDAY', 'NAME', 'SOSOG_DESC'],
  fields: [
    {
      fieldName: 'PRSN_DIV_NM',
      dataType: 'text',
      header: { text: t('구분') },
      editable: false,
    },
    {
      fieldName: 'NAME',
      dataType: 'text',
      header: { text: t('재해자/유발자') },
      editable: false,
    },
    {
      fieldName: 'RPT_TYPE_CD',
      dataType: 'text',
      header: { text: t('사고처리') },
      lookupDisplay: true,
      editor: { type: 'dropdown' },
    },
    {
      fieldName: 'SOSOG_DIV_NM',
      dataType: 'text',
      header: { text: t('소속구분') },
      editable: false,
    },
    {
      fieldName: 'SOSOG_DESC',
      dataType: 'text',
      header: { text: t('소속조직명') },
      editable: false,
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      header: { text: t('사번') },
      editable: false,
    },
    {
      fieldName: 'GRD_DESC',
      dataType: 'text',
      header: { text: t('직급') },
      editable: false,
    },
    {
      fieldName: 'JIKJONG_NM',
      dataType: 'text',
      header: { text: t('직종') },
      editable: false,
    },
    {
      fieldName: 'AGE',
      dataType: 'text',
      header: { text: t('나이') },
      editable: false,
    },
    {
      fieldName: 'BIRTHDAY',
      header: { text: t('생년월일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
    },

    {
      fieldName: 'IPSAIL',
      header: { text: t('입사일자') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
    },

    {
      fieldName: 'HND_PHN',
      dataType: 'text',
      header: { text: t('연락처(HP)') },
      editable: false,
    },

    {
      fieldName: 'CONTACTING',
      header: { text: t('개인진정') },
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      editable: false,
    },
    {
      fieldName: 'SJE_TYPE_CD',
      dataType: 'text',
      header: { text: t('산재구분') },
      lookupDisplay: true,
      editor: { type: 'dropdown' },
    },

    // 안보이는거

    {
      fieldName: 'REGTDTE',
      header: { text: t('총무부접수일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      visible: false,
    },
    {
      fieldName: 'OKDTE',
      header: { text: t('산재승인일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      visible: false,
    },
    {
      fieldName: 'HUDTE',
      header: { text: t('휴직일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      visible: false,
    },
    {
      fieldName: 'BOKDTE',
      header: { text: t('복직일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      visible: false,
    },

    {
      fieldName: 'DAYCNT',
      dataType: 'text',
      header: { text: t('손실일수') },
      editable: false,
      visible: false,
    },
    {
      fieldName: 'LOSTCOST',
      dataType: 'number',
      header: { text: t('손실비용(원)') },
      numberFormat: '#,###',
      editable: false,
      visible: false,
    },

    {
      fieldName: 'GRP_ENT_DATE',
      header: { text: t('그룹입사일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      visible: false,
    },
    {
      fieldName: 'JINDAN_NM',
      dataType: 'text',
      header: { text: t('진단') },
      visible: false,
    },
    { fieldName: 'PRSN_DIV', dataType: 'text', visible: false },
    { fieldName: 'SEX', dataType: 'text', visible: false },
    { fieldName: 'JIKJONG_CD', dataType: 'text', visible: false },
    { fieldName: 'SOSOG_TEL', dataType: 'text', visible: false },
    { fieldName: 'UMJU_MSR_MTHD', dataType: 'text', visible: false },
    { fieldName: 'UMJU_ALCOL', dataType: 'text', visible: false },
    { fieldName: 'SOSOG_DIV', dataType: 'text', visible: false },
    { fieldName: 'INJURY_PART_LM', dataType: 'text', visible: false },
    { fieldName: 'INJURY_PART_SM', dataType: 'text', visible: false },
    { fieldName: 'INJURY_PART_L', dataType: 'text', visible: false },
    { fieldName: 'INJURY_PART_S', dataType: 'text', visible: false },
    { fieldName: 'INJURY_TYPE', dataType: 'text', visible: false },
    { fieldName: 'JINDAN_CD', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'SAGO_SN', dataType: 'text', visible: false },
    { fieldName: 'SEQ', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdProps1_admin.columns = grdProps1_admin.fields



//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ['BIRTHDAY', 'NAME', 'SOSOG_DESC'],
  fields: [
    {
      fieldName: 'PRSN_DIV_NM',
      dataType: 'text',
      header: { text: t('구분') },
      editable: false,
    },
    {
      fieldName: 'NAME',
      dataType: 'text',
      header: { text: t('재해자/유발자') },
      editable: false,
    },
    {
      fieldName: 'RPT_TYPE_CD',
      dataType: 'text',
      header: { text: t('사고처리') },
      lookupDisplay: true,
      editor: { type: 'dropdown' },
    },
    {
      fieldName: 'SOSOG_DIV_NM',
      dataType: 'text',
      header: { text: t('소속구분') },
      editable: false,
    },
    {
      fieldName: 'SOSOG_DESC',
      dataType: 'text',
      header: { text: t('소속조직명') },
      editable: false,
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      header: { text: t('사번') },
      editable: false,
    },
    {
      fieldName: 'GRD_DESC',
      dataType: 'text',
      header: { text: t('직급') },
      editable: false,
    },
    {
      fieldName: 'JIKJONG_NM',
      dataType: 'text',
      header: { text: t('직종') },
      editable: false,
    },
    {
      fieldName: 'AGE',
      dataType: 'text',
      header: { text: t('나이') },
      editable: false,
      visible: false 
    },
    {
      fieldName: 'BIRTHDAY',
      header: { text: t('생년월일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      visible: false 
    },

    {
      fieldName: 'IPSAIL',
      header: { text: t('입사일자') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      visible: false 
    },

    {
      fieldName: 'HND_PHN',
      dataType: 'text',
      header: { text: t('연락처(HP)') },
      editable: false,
      visible: false 
    },

    {
      fieldName: 'CONTACTING',
      header: { text: t('개인진정') },
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      editable: false,
    },
    {
      fieldName: 'SJE_TYPE_CD',
      dataType: 'text',
      header: { text: t('산재구분') },
      lookupDisplay: true,
      editor: { type: 'dropdown' },
    },

    // 안보이는거

    {
      fieldName: 'REGTDTE',
      header: { text: t('총무부접수일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      visible: false,
    },
    {
      fieldName: 'OKDTE',
      header: { text: t('산재승인일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      visible: false,
    },
    {
      fieldName: 'HUDTE',
      header: { text: t('휴직일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      visible: false,
    },
    {
      fieldName: 'BOKDTE',
      header: { text: t('복직일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      visible: false,
    },

    {
      fieldName: 'DAYCNT',
      dataType: 'text',
      header: { text: t('손실일수') },
      editable: false,
      visible: false,
    },
    {
      fieldName: 'LOSTCOST',
      dataType: 'number',
      header: { text: t('손실비용(원)') },
      numberFormat: '#,###',
      editable: false,
      visible: false,
    },

    {
      fieldName: 'GRP_ENT_DATE',
      header: { text: t('그룹입사일') },
      editor: { datetimeFormat: 'yyyy-MM-dd' },
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      visible: false,
    },
    {
      fieldName: 'JINDAN_NM',
      dataType: 'text',
      header: { text: t('진단') },
      visible: false,
    },
    { fieldName: 'PRSN_DIV', dataType: 'text', visible: false },
    { fieldName: 'SEX', dataType: 'text', visible: false },
    { fieldName: 'JIKJONG_CD', dataType: 'text', visible: false },
    { fieldName: 'SOSOG_TEL', dataType: 'text', visible: false },
    { fieldName: 'UMJU_MSR_MTHD', dataType: 'text', visible: false },
    { fieldName: 'UMJU_ALCOL', dataType: 'text', visible: false },
    { fieldName: 'SOSOG_DIV', dataType: 'text', visible: false },
    { fieldName: 'INJURY_PART_LM', dataType: 'text', visible: false },
    { fieldName: 'INJURY_PART_SM', dataType: 'text', visible: false },
    { fieldName: 'INJURY_PART_L', dataType: 'text', visible: false },
    { fieldName: 'INJURY_PART_S', dataType: 'text', visible: false },
    { fieldName: 'INJURY_TYPE', dataType: 'text', visible: false },
    { fieldName: 'JINDAN_CD', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'SAGO_SN', dataType: 'text', visible: false },
    { fieldName: 'SEQ', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields












//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys: ['RSN_GRP_NM2', 'RSN_CD'],
  fields: [
    {
      fieldName: 'RSN_GRP_NM1',
      dataType: 'text',
      header: { text: t('구분') },
      mergeRule: { criteria: 'value' },
      editable: false,
    },
    {
      fieldName: 'RSN_GRP_NM2',
      dataType: 'text',
      header: { text: t('구분') },
      editable: false,
    },
    {
      fieldName: 'RSN_NM',
      dataType: 'text',
      header: { text: t('원인') },
      editable: false,
    },
    {
      fieldName: 'RSN_DET',
      dataType: 'text',
      header: { text: t('상세원인') },
      styleName: 'multiline-editor editable_column',
      editor: { type: 'multiline', altEnterNewLine: true },
    },
    {
      fieldName: 'DAECHEK',
      dataType: 'text',
      header: { text: t('재발방지대책') },
      styleName: 'multiline-editor editable_column',
      editor: { type: 'multiline', altEnterNewLine: true },
    },

    // {
    //   fieldName: "FILE_ID",
    //   dataType: "text",
    //   editable: false,
    //   header: { text: t("사진") },
    //   isFile: { value: true, align: "right", showAlways: true },
    //   displayCallback: function (grd, idx, val) {
    //     let data = grdTwo.value.getDataProvider().getJsonRow(idx.itemIndex)

    //     return !data.FILE_TITLE ? "" : data.FILE_TITLE
    //   },
    // },

    {
      fieldName: 'RSN_CD',
      dataType: 'text',

      visible: false,
    },
    {
      fieldName: 'RSN_GRP_CD1',
      dataType: 'text',

      visible: false,
    },
    {
      fieldName: 'RSN_GRP_CD2',
      dataType: 'text',

      visible: false,
    },
    {
      fieldName: 'SAGO_SN',
      dataType: 'text',

      visible: false,
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',

      visible: false,
    },
    {
      fieldName: 'SAVE_YN',
      dataType: 'text',

      visible: false,
    },

    {
      fieldName: 'REMARK',
      dataType: 'text',

      visible: false,
    },
    { fieldName: 'FILE_TITLE', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    {
      name: '구분',
      direction: 'horizontal',
      hideChildHeaders: true,
      header: {
        text: t('구분'),
      },
      items: ['RSN_GRP_NM1', 'RSN_GRP_NM2'],
    },
    'RSN_NM',
    'RSN_DET',
    'DAECHEK',
    // "FILE_ID",
  ],
})

grdProps2.columns = grdProps2.fields

const grdDng1Props = reactive({
  gridViewOption: {
    checkBar: { visible: true },
  },
  keys: ['CMPNY_DIV', 'SAGO_SN', 'CMPNY_DIV_EMP', 'EMP_NO'],
  fields: [
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속조직명') }, editable: false, },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, editable: false, },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false, },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직급') }, editable: false, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false, },
    { fieldName: 'SAGO_SN', dataType: 'text', visible: false, },
    { fieldName: 'CMPNY_DIV_EMP', dataType: 'text', visible: false, },
    { fieldName: 'BSNS_CD_EMP', dataType: 'text', visible: false, },
    { fieldName: 'DEPT_CD_EMP', dataType: 'text', visible: false, },
    { fieldName: 'ASGN_CD_EMP', dataType: 'text', visible: false, },
    { fieldName: 'STATUS', dataType: 'text', visible: false, },
  ],
  columns: [],
})

grdDng1Props.columns = grdDng1Props.fields

const grdDng2Props = reactive({
  gridViewOption: {
    checkBar: { visible: true },
  },
  keys: ['CMPNY_DIV', 'SAGO_SN', 'SEQ'],
  fields: [
    { fieldName: 'UNIT_DESC', dataType: 'text', header: { text: t('단위작업') }, styleName: 'left-column editable_column', width: '320', },
    { fieldName: 'WORK_DESC', dataType: 'text', header: { text: t('작업행동') }, styleName: 'left-column editable_column', width: '320', },
    { fieldName: 'FACTOR_DESC', dataType: 'text', header: { text: t('위험요인') }, styleName: 'left-column multiline-editor editable_column',
      editor: { type: 'multiline' }, width: '450', },
    { fieldName: 'DNG_LVL', dataType: 'text', header: { text: t('위험성(상/중/하)') }, styleName: 'editable_column',
      lookupDisplay: true, editor: { type: 'dropdown', }, width: '125', },
    { fieldName: 'MEASURE', dataType: 'text', header: { text: t('위험감소대책') }, styleName: 'left-column multiline-editor editable_column',
      editor: { type: 'multiline' }, width: '450', },

    { fieldName: 'CMPNY_DIV', visible: false, },
    { fieldName: 'SAGO_SN', visible: false, },
    { fieldName: 'SEQ', visible: false, },
  ],
  columns: [],
})

grdDng2Props.columns = grdDng2Props.fields

// 그리드 이벤트 재해원인
//  파일 업로드fileDatagrd
// const onCellItemClicked = (grid, index, col) => {
//   fileIndexgrd.value = ""
//   fileDatagrd.value = ""

//   if (Popdata.APPROVAL_STATUS === "종결") {
//     return ""
//   } else {
//     if (index.fieldName == "FILE_ID") {
//       let data = grdTwo.value.getDataProvider().getJsonRow(index.dataRow)
//       fileIndexgrd.value = index.dataRow
//       fileDatagrd.value = "FILE_ID"
//       fileUploadgrd.value.openPopup(data.FILE_ID)
//     }
//   }
// }

const uploaded = (val) => {
  if (fileDatagrd.value == 'FILE_ID') {
    grdTwo.value
      .getDataProvider()
      .setValue(fileIndexgrd.value, 'FILE_ID', val.fileId)
    grdTwo.value
      .getDataProvider()
      .setValue(fileIndexgrd.value, 'FILE_TITLE', '업로드완료')
  }
}

// 파일 업로드
//  파일관련 메소드
const checkFileId = async () => {
  for (let i = 1; i <= 1; i++) {
    let PIC_FILE_ID = `PIC_FILE_ID${i}`
    let fileUpload = eval(`fileUpload${i}.value`)

    if (Popdata[PIC_FILE_ID] === null || Popdata[PIC_FILE_ID] === undefined) {
      fileUpload.setGuid()
      Popdata[PIC_FILE_ID] = fileUpload.guid
      await fileUpload.onButtonsClick({ id: 'btnSearch' })
    } else {
      //파일아이디 있을때
      fileUpload.setGuid(Popdata[PIC_FILE_ID])
      Popdata[PIC_FILE_ID] = fileUpload.guid
      await fileUpload.onButtonsClick({ id: 'btnSearch' })
    }
  }
}

watch(
  () => fileUpload1.value,
  (newValue) => {
    if (newValue !== null && newValue !== '' && newValue !== undefined) {
      checkFileId()
    }
  }
)

const URL = (e, seq) => {
  if (seq == 1) {
    Url1.value = e
    emit('img1', Url1.value)
    if (Popdata.APPROVAL_STATUS === '종결') {
    }
  }
  if (seq == 2) {
    Url2.value = e
    emit('img2', Url2.value)
  }
  if (seq == 3) {
    Url3.value = e
    emit('img3', Url3.value)
  }
}

const uploadedpic = (list, index) => {
  let SaveParam = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      SEQ: index,
      PIC_1_DESC: Popdata.PIC_1_DESC,
      PIC_2_DESC: Popdata.PIC_2_DESC,
      PIC_3_DESC: Popdata.PIC_3_DESC,
    },
  ]
  return commonExecuteApi({ queryId: 'SAFAB0020_save22', list: SaveParam })
}

//  그리드 이벤트
const onCellDblClickedMain = (grd, data) => {
  if (data.cellType === 'data') {
    let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    ManPopUp.value.openPopup(row, true, 'dblclick')
  }
}

// 위험성 재평가 watch
watch(
  () => Popdata.WIHEOM_YN,
  (newValue) => {
    if (newValue == 'N') {
      WRK_STD_NMNot.value = true
      Popdata.WIHEOM_DESC = ''
      // Popdata.WRK_STD_NEW = "Y"
    } else {
      WRK_STD_NMNot.value = false
      // Popdata.WRK_STD_NEW = "N"
    }
  }
)

// 신규작성 watch
watch(
  () => Popdata.WRK_STD_NEW,
  (newValue) => {
    if (Popdata.WRK_STD_NEW == 'N') {
      Popdata.WRK_STD_NM = ''
      Popdata.WRK_STD_NM_E = ''
      Popdata.WRK_STD_NO = ''
      Popdata.workStandardNo = ''
      Popdata.workStandardID = ''
      //Popdata.WIHEOM_YN = 'Y'
    } else if (Popdata.WRK_STD_NEW == 'Y' && !isSearchST.value) {
      if(Popdata?.RESP_DEPT_CD?.length > 0 && Popdata.RESP_DEPT_CD.substr(0, 1) === 'E') {
        Popdata.WRK_STD_NM_E = '신규작성필요'
      } else {
        commonSearchApi({
          queryId: 'GET_WORK_STANDARD_NO',
          param: { DEPT_CD: Popdata.INJR_DEPT_CD },
        }).then((res) => {
          // console.log('asdasdasd', res)
          Popdata.WRK_STD_NM = '신규작성필요'
          Popdata.WRK_STD_NO = `${res.OUT_DATA}-01`
          Popdata.workStandardNo = res.OUT_DATA
          Popdata.workStandardID = `${res.OUT_DATA}-01`
          //Popdata.WIHEOM_YN = 'N'
        })
      }
    }
  }
)
//  기타 메서드
const plus = () => {
  let cnt = INJRDEPT.value.length
  if (!cnt) {
    cnt = 1
  } else {
    cnt += 1
  }

  if (cnt === 4) {
    return Message.warn(t('최대 3개까지만 추가 가능합니다.'))
  } else {
    INJRDEPT.value.push(`INJR_DEPT_NM${cnt}`)
  }
}
const minus = (item) => {
  if (item == 'INJR_DEPT_NM1') {
    Popdata.INJR_DEPT_NM1 = ''
    Popdata.INJR_DEPT_CD1 = ''
  }
  if (item == 'INJR_DEPT_NM2') {
    Popdata.INJR_DEPT_NM2 = ''
    Popdata.INJR_DEPT_CD2 = ''
  }
  if (item == 'INJR_DEPT_NM3') {
    Popdata.INJR_DEPT_NM3 = ''
    Popdata.INJR_DEPT_CD3 = ''
  }
  INJRDEPT.value = Array.prototype.filter.call(
    INJRDEPT.value,
    (x) => x !== item
  )
}

// 안전 담당과장 선택 (사고 담당자만 가능)
const empPopupOpen2 = (e) => {
  console.log(e, 'e')
  empPopup2.value.openPopup({
    BSNS_CD: 'AN00',
    EMP_NM: Popdata.SAFE_GAMGR_EMPKORNM,
  })
}

const selectSAFE_GAMGR = (row) => {

  console.log(row, 'row')
  Popdata.INSERT_USER = row.BSNS_NM + ' ' + row.EMP_NM
  Popdata.SAFE_GAMGR_EMP = row.EMP_NO
}

//  watch 모음집
watch(
  () => props.popupParam,
  (newValue) => {

    for (let i in props.popupParam) {
      Popdata[i] = props.popupParam[i]
    }
    if(Popdata.SAGO_TYPE_CD){
      SAGOORGTYPE.value = Popdata.SAGO_TYPE_CD
    }
    else{
      SAGOORGTYPE.value = null
    }
    if(Popdata.COME_SERIOUS_YN){
      COMESERIOUSYN.value = Popdata.COME_SERIOUS_YN
    }
    else{
      COMESERIOUSYN.value = null
    }
    if(Popdata.RESP_DEPT_CD){
      RESPDEPTCD.value = Popdata.RESP_DEPT_CD
    }
    else{
      RESPDEPTCD.value = null
    }
    // console.log(SAGOORGTYPE.value,'SAGOORGTYPE.value')
    if (Popdata.OCCUR_TIME) {
      const hours = Popdata.OCCUR_TIME.substring(0, 2)
      const minutes = Popdata.OCCUR_TIME.substring(2)
      Popdata.OCCUR_TIME = `${hours}:${minutes}`
    }
    if (Popdata.OCCUR_DT) {
      Popdata.OCCUR_DT = dayjs(Popdata.OCCUR_DT).format('YYYY-MM-DD')
    }
    // if (Popdata.SAGO_RCV_DT) {
      // Popdata.SAGO_RCV_DT = dayjs(Popdata.SAGO_RCV_DT).format('YYYY-MM-DD')
    // }
    if (Popdata.INJR_DEPT_NM1) {
      INJRDEPT.value = []
      let valueContent = Popdata.INJR_DEPT_NM1.split(/[,\s]+/)
      let cnt = 0
      for (let i in valueContent) {
        cnt++

        INJRDEPT.value.push(`INJR_DEPT_NM${cnt}`)
        let INJR_DEPT_NMDummy = `INJR_DEPT_NM${cnt}`
        Popdata[INJR_DEPT_NMDummy] = valueContent[i]
      }
    }
    if (Popdata.INJR_DEPT_CD1) {
      let valueContent = Popdata.INJR_DEPT_CD1.split(/[,\s]+/)

      let cnt = 0
      for (let i in valueContent) {
        cnt++

        let INJR_DEPT_NMDummy = `INJR_DEPT_CD${cnt}`
        Popdata[INJR_DEPT_NMDummy] = valueContent[i]
      }
    }
    // 종결버튼
    console.log(Popdata.SAGO_TYPE_CD, 'Popdata.SAGO_TYPE_CD')

    if (Popdata.APPROVAL_STATUS === '즉보안전확인 완료') {
      console.log(Popdata.SAGO_TYPE_CD,Popdata.SAGO_DIV_L)
      vm.$nextTick(() => {
        menuTitle.value.disableBtn('btnCompleteSAF', true)
        menuTitle.value.disableBtn('btnCancelWrite', true)

        // 사고 모듈 담당자 외 안전확인 버튼 비활성화
        if (userStore.authGrpCd.includes('GRP00381')){
          menuTitle.value.disableBtn('btnSafetyCancel', false)
          menuTitle.value.disableBtn('btnSafetyCheck', true)
        } else {
          menuTitle.value.disableBtn('btnSafetyCancel', true)
          menuTitle.value.disableBtn('btnSafetyCheck', true)
        }
        
        if (
          Popdata.SAGO_TYPE_CD === 'HRS' ||
          Popdata.SAGO_TYPE_CD === 'SNE' ||
          Popdata.SAGO_TYPE_CD === null ||
          Popdata.SAGO_TYPE_CD === '' 
        ) {
          vm.$nextTick(() => {
            console.log('여기 true')
            menuTitle.value.disableBtn('btnComplete', false)
            menuTitle.value.disableBtn('btnCancelComplete', false)
          })
        } else {
          if( Popdata.SAGO_DIV_L ==='B'){
            console.log('여기 false === B')
            menuTitle.value.disableBtn('btnComplete', false)
            menuTitle.value.disableBtn('btnCancelComplete', false)
          }
          else{
            vm.$nextTick(() => {
              console.log('여기 false213')
            menuTitle.value.disableBtn('btnComplete', true)
            menuTitle.value.disableBtn('btnCancelComplete', true)
          })
          }
          
        }
      })
    }


    SagoSearch()
    checkFileId()
  }
)
const disabledGridBtn = async () => {
  await nextTick()

  fileUpload1.value.disableButton('btnAttach')
  fileUpload1.value.disableButton('btnDownLoad')
  fileUpload1.value.disableButton('btnDelete')
  // fileUpload2.value.setDisable(['btnAttach', 'btnFileUpload', 'btnDelete'])
  // fileUpload3.value.setDisable(['btnAttach', 'btnFileUpload', 'btnDelete'])
}

watch(
  () => Popdata.APPROVAL_STATUS,
  (newValue) => {
    if (Popdata.APPROVAL_STATUS === '종결') {
      // 메인
      vm.$nextTick(() => {
        menuTitle.value.disableBtn('btnCompleteSAF', true)
        menuTitle.value.disableBtn('btnCancelWrite', true)
        menuTitle.value.disableBtn('btnSafetyCheck', true)
        menuTitle.value.disableBtn('btnSafetyCancel', true)
        menuTitle.value.disableBtn('btnComplete', true)
         
        // menuTitle.value.disableBtn('btnComplete', true)
        if(Popdata.SAGO_DIV_L ==='B' || userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2 || userStore.empNo === Popdata.SAFE_GAMGR_EMP){
          menuTitle.value.disableBtn('btnCancelComplete', false)
        }
        else{
          menuTitle.value.disableBtn('btnCancelComplete',true)
        }
        // menuTitle.value.disableBtn("btnCancelComplete", true);
        // 인적사항
        GridTitle1.value.disableBtn('btnCreate', true)
        GridTitle1.value.disableBtn('btnDelete', true)
        // 사고개요
        GridTitle2.value.disableBtn('btnUpdate', true)

        if(GridTitle3.value){
        GridTitle3.value.disableBtn('btnSearch', true)
        GridTitle3.value.disableBtn('btnCreate', true)
        GridTitle3.value.disableBtn('btnUpdate', true)
        GridTitle3.value.disableBtn('btnDelete', true)
        GridTitle5.value.disableBtn('btnUpdate', true)
       
        }
        // 재해원인
        // GridTitle5.value.disableBtn("btnDelete", true)
        // 구급차 미이용 경위서
        GridTitle6.value.disableBtn('btnUpdate', true)
        if (userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2) {
          GridTitle8.value.disableBtn('btnUpdate', false)
        }
        // 이미지 업로드
        setTimeout(() => {
          disabledGridBtn() //그리드 버튼 비활성화 함수
        }, 3000)
      })
    }
    if (newValue == '즉보작성 진행') {
      vm.$nextTick(() => {
        menuTitle.value.disableBtn('btnCompleteSAF', false)

        menuTitle.value.disableBtn('btnCancelWrite', true)
        menuTitle.value.disableBtn('btnSafetyCheck', true)
        menuTitle.value.disableBtn('btnSafetyCancel', true)
 
        menuTitle.value.disableBtn('btnComplete', true)
        menuTitle.value.disableBtn('btnCancelComplete', true)
   
      })
    }
    if (newValue === '즉보작성 완료') {
      vm.$nextTick(() => {
        if(Popdata.SAGO_TYPE_CD === 'NON'){
          menuTitle.value.disableBtn('btnSafetyCheck', true)
          
        }else{
          if (userStore.authGrpCd.includes('GRP00381')){
            menuTitle.value.disableBtn('btnSafetyCheck', false)
          }else{
            menuTitle.value.disableBtn('btnSafetyCheck', true)
          }
        }

        menuTitle.value.disableBtn('btnSafetyCancel', true)
        menuTitle.value.disableBtn('btnCompleteSAF', true)
        menuTitle.value.disableBtn('btnCancelWrite', false) 
        menuTitle.value.disableBtn('btnComplete', true)
        menuTitle.value.disableBtn('btnCancelComplete', true)   
      })
    }

    if (newValue == '즉보안전확인 완료') {
      console.log(Popdata.SAGO_TYPE_CD,Popdata.SAGO_DIV_L)
      vm.$nextTick(() => {
        menuTitle.value.disableBtn('btnCompleteSAF', true)
        menuTitle.value.disableBtn('btnCancelWrite', true)
        
        // 사고 모듈 담당자 외 안전확인 버튼 비활성화
        if (userStore.authGrpCd.includes('GRP00381')){
          menuTitle.value.disableBtn('btnSafetyCancel', false)
          menuTitle.value.disableBtn('btnSafetyCheck', true)
        } else{
          menuTitle.value.disableBtn('btnSafetyCancel', true)
          menuTitle.value.disableBtn('btnSafetyCheck', true)
        }

        
        if (
          Popdata.SAGO_TYPE_CD === 'HRS' ||
          Popdata.SAGO_TYPE_CD === 'SNE' ||
          Popdata.SAGO_TYPE_CD === null ||
          Popdata.SAGO_TYPE_CD === '' 
        ) {
          vm.$nextTick(() => {
            console.log('여기 true')
            menuTitle.value.disableBtn('btnComplete', false)
            menuTitle.value.disableBtn('btnCancelComplete', false)
          })
        } else {
          if( Popdata.SAGO_DIV_L ==='B'){
            console.log('여기 false === B')
            menuTitle.value.disableBtn('btnComplete', false)
            menuTitle.value.disableBtn('btnCancelComplete', false)
          }
          else{
            vm.$nextTick(() => {
              console.log('여기 false213')
            menuTitle.value.disableBtn('btnComplete', true)
            menuTitle.value.disableBtn('btnCancelComplete', true)
          })
          }
          
        }
      })
    }
    if (newValue.includes('보고서')) {
      vm.$nextTick(() => {
        menuTitle.value.disableBtn('btnCompleteSAF', true)
        menuTitle.value.disableBtn('btnCancelWrite', true)
        menuTitle.value.disableBtn('btnSafetyCheck', true)
        menuTitle.value.disableBtn('btnSafetyCancel', true)

      })
    }
  }
)

// 신규추가

// 안전 passPort 오픈시

watch(
  () => Popdata.passPort,
  (newValue) => {
    if (newValue == 'Y') {
      vm.$nextTick(() => {
        console.log('tㅇㅇ')
        menuTitle.value.disableBtn('btnCompleteSAF', true)
        menuTitle.value.disableBtn('btnCancelWrite', true)
        menuTitle.value.disableBtn('btnSafetyCheck', true)
        menuTitle.value.disableBtn('btnComplete', true)
        menuTitle.value.disableBtn('btnCancelComplete', true)

        // 인적사항
        GridTitle1.value.disableBtn('btnCreate', true)
        GridTitle1.value.disableBtn('btnDelete', true)
        // 사고개요
        GridTitle2.value.disableBtn('btnUpdate', true)

        // 재해원인 및 예방대책
        GridTitle3.value.disableBtn('btnSearch', true)
        GridTitle3.value.disableBtn('btnCreate', true)
        GridTitle3.value.disableBtn('btnUpdate', true)
        GridTitle3.value.disableBtn('btnDelete', true)
        GridTitle3.value.disableBtn('btnSetRCA', true)
        GridTitle8.value.disableBtn('btnUpdate', true)
        GridTitle5.value.disableBtn('btnUpdate', true)
        // GridTitle5.value.disableBtn("btnDelete", true)
        // 구급차 미이용 경위서
        GridTitle6.value.disableBtn('btnUpdate', true)
        NOEdit.value = true
      })
    }
  }
)
// const WORKIDOpen = () => {
//   WWRKIDPopUp.value.openPopup(empNoWrkID.value)
// }
const selectedWRKID = (row) => {
  Popdata.WORK_ID = row.WORK_ID
  Popdata.WORK_TITLE = row.WORK_TITLE
}

watch(
  () => Popdata.COME_SERIOUS_YN,
  (newValue) => {
    console.log(newValue, 'nee')
    if (Popdata.SAGO_DIV_L === 'D' || Popdata.SAGO_DIV_L === 'E') {
      if (newValue == 'Y' || newValue == 'S') {
        if (newValue == 'S') {
          Popdata.JUNGDAE_YN = 'Y'
        }
        RCAUpload.value = true
      } else {
        RCAUpload.value = false
      }
    }
  }
)
watch(
  () => fileUpload.value,
  (newValue) => {
    if (newValue !== null && newValue !== '' && newValue !== undefined) {
      // console.log(fileUpload.value, "fileUpload")
      checkFileIdRCA()
    }
  }
)
//  진술 파일 업로드
const checkFileIdRCA = () => {
  console.log('업로드 ')
  if (Popdata.RCA_FILE_ID === null || Popdata.RCA_FILE_ID === undefined) {
    fileUpload.value.setGuid()
    Popdata.RCA_FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
    console.log(Popdata.RCA_FILE_ID, 'RCA_FILE_ID')
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(Popdata.RCA_FILE_ID)
    Popdata.RCA_FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
}

// 드래그기능
const test = (e) => {
  if (!NOEdit.value){
    files.value = e.dataTransfer.files
  }
}


const LATECheck = () => {
  console.log(isLATE.value, 'isLate')

  if (isLATE.value) {
    Popdata.LATE_USER_IDM =  userStore.userName 
    Popdata.LATE_USER_ID =  userStore.empNo 
    Popdata.LATE_DT =  dayjs().format('YYYYMMDD') 
    Popdata.LATE_TIME =  dayjs().format('HHmm') 
    // console.log(Popdata.LATE_TIME,Popdata.LATE_DT,'ㅇㅇㅇㅇ')

  
    // if (!Popdata.LATE_USER_IDM) {
    //   Message.warn(t('작성자는 필수 입력입니다.'))
    //   return false
    // }
    // if (!Popdata.LATE_DT) {
    //   Message.warn(t('작성일시는 필수 입력입니다.'))
    //   return false
    // }
    // if (!Popdata.LATE_TIME) {
    //   Message.warn(t('작성 시간은 필수 입력입니다.'))
    //   return false
    // }
    if (!Popdata.LATE_RSN) {
      // Message.warn(t('지연사유는 필수입력입니다.'))
      Message.warn(t('지연보고시 지연사유는 필수입니다.'))
      return false
    }
  }

  return true
}

const LATESaveData = () => {
  if (isLATE.value) {
    Popdata.LATE_TYPE = '1'
  } else {
    Popdata.LATE_TYPE = '0'
  }
  let param = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      LATE_TYPE: Popdata.LATE_TYPE,
      LATE_RSN: Popdata.LATE_RSN,
      LATE_USER_ID: Popdata.LATE_USER_ID,
      LATE_DT: Popdata.LATE_DT ,
      LATE_TIME: Popdata.LATE_TIME 
    },
  ]

  console.log('hihiasdasd', param)

  return commonExecuteApi({ queryId: 'SAFAB0020_save07', list: param })
}
watch(
  () => isLATE.value,
  (newValue) => {
    if (newValue) {
      GridTitle5.value.disableBtn('btnUpdate', false)
      // GridTitle5.value.disableBtn("btnDelete", false)
    } else {
      // GridTitle5.value.disableBtn("btnDelete", true)
      Popdata.LATE_USER_IDM = ''
      Popdata.LATE_USER_ID = ''
      Popdata.LATE_DT = ''
      Popdata.LATE_TIME = ''
      Popdata.LATE_RSN = ''
    }
  }
)

const GUGUPCheck = () => {
  if (Popdata.GUGUP_USE == 'O') {
    Message.warn(t('구급차 이용 한 인원입니다. 저장하실수 없습니다.'))
    return false
  }

  return true
}

const GUGUPaveData = () => {
  let param = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      AMBUL_NOT_DESC: Popdata.AMBUL_NOT_DESC,
      AMBUL_NOT_RSN: Popdata.AMBUL_NOT_RSN,
      AMBUL_NOT_PLN: Popdata.AMBUL_NOT_PLN,
    },
  ]

  console.log('구급차', param)

  return commonExecuteApi({ queryId: 'SAFAB0020_save08', list: param })
}
watch(
  () => isGU.value,
  (newValue) => {
    if (newValue) {
      if (Popdata.GUGUP_USE == 'O') {
        Message.warn(t('구급차 이용 한 인원입니다.'))
        return (isGU.value = true)
      }
      GridTitle6.value.disableBtn('btnUpdate', false)
      GridTitle6.value.disableBtn('btnDelete', false)
    } else {
      GridTitle6.value.disableBtn('btnDelete', true)
    }
  }
)

const empPopupOpen = () => {
  // if (!LATEReadonly.value) {
  //   empPopup.value.openPopup({ EMP_NM: Popdata.LATE_USER_IDM })
  // }
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    DEPT_CD: userStore.deptCd,
    AUTO_CLOSE: 'N',
    MULTI: true,
  })
}
// 인원 검색 선택
const selectedemp = (emps) => {
  console.log(emps)

  emps.forEach(emp => {
    const row = grdDng1.value.getDataProvider().addRow({
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      CMPNY_DIV_EMP: emp.CMPNY_DIV,
      BSNS_CD_EMP: emp.BSNS_CD,
      DEPT_CD_EMP: emp.DEPT_CD,
      ASGN_CD_EMP: emp.ASGN_CD,
      ASGN_NM: emp.ASGN_NM,
      EMP_NO: emp.EMP_NO,
      EMP_NM: emp.EMP_NM,
      JOB_TIT_NM: emp.JOB_TIT_NM,
      STATUS: 'I',
    })

    grdDng1.value.getGridView().setCurrent({ dataRow: row })
    grdDng1.value.getGridView().checkRow(row)
  })

  // Popdata.LATE_USER_IDM = emp.EMP_NM
  // Popdata.LATE_USER_ID = emp.EMP_NO
}

watch(
  () => [joUpload.value, injuSahang.value],
  ([newValue, newValue2]) => {
    console.log(newValue2,'newValue2')
    if (newValue2 === null || newValue2 === '' || newValue2 === undefined || newValue2.length === 0 ) {
      isInjuSahang.value = true
    }

    if (
      newValue !== null &&
      newValue !== '' &&
      newValue !== undefined &&
      newValue2 !== null &&
      newValue2 !== '' &&
      newValue2 !== undefined &&
      newValue2.length !== 0
    ) {
      checkFilejoUp()
      isInjuSahang.value = false
    }
  }
)

const joUploaded = () => {
  isUpload.value = true
  let param = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      RPT_FILE_ID: Popdata.RPT_FILE_ID,
      RPT_CANT_CHK: Popdata.RPT_CANT_CHK,
      RPT_CANT_DESC: Popdata.RPT_CANT_DESC,
    },
  ]
    
  commonExecuteApi({ queryId: 'SAFAB0020_save35', list: param })
}
const checkFilejoUp = async () => {
  if (
    Popdata.RPT_FILE_ID === null ||
    Popdata.RPT_FILE_ID === undefined
  ) {
    joUpload.value.setGuid()
    Popdata.RPT_FILE_ID = joUpload.value.guid
    joUpload.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    joUpload.value.setGuid(Popdata.RPT_FILE_ID)
    Popdata.RPT_FILE_ID = joUpload.value.guid

    joUpload.value.onButtonsClick({ id: 'btnSearch' })

    console.log(joUpload.value)
    // if (joUpload.value.cherckGridDataLength() !== 0) {
    //   isUpload.value = true
    // } else {
    //   isUpload.value = false
    // }
  }
}
const joLengthcheck = (e) => {
  if (e !== 0) {
    isUpload.value = true
  } else {
    isUpload.value = false
  }
}


// 안전확인 취소
const SafetyCancel =()=>{
  vm.$swal({
    title: t('안전확인 취소 하시겠습니까? <br> ※주의 <br> 팝업창이 닫힙니다.'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      if (!Popdata.WRT_CNFM_DT) {
        return Message.warn(t('안전확인 후 이용해주시기 바랍니다.'))
      }
      let saveParams = []

      saveParams.push(Popdata)

      // 메일 발송

      commonExecuteApi({ queryId: 'SAFAB0020_SAVE_30', list: saveParams }).then(
        (res) => {
          emit('close')
        }
      )
    }
  })
}

//널 체크 메서드
const isNullCheck = (data) => {
  return data === undefined || data === null || data === '' ? true : false
}

const textareaLineLimit = (obj, e) => {
  let maxRows = 12
  let maxLength = 1100
  let rows = Popdata.SAGO_GAEYO.split('\n').length
  let length = Popdata.SAGO_GAEYO.length
  let modText = ''

  if (length > maxLength){
    modText = Popdata.SAGO_GAEYO.substr(0, maxLength)
    Popdata.SAGO_GAEYO = modText
  }

  if (rows > maxRows){
    modText = Popdata.SAGO_GAEYO.split('\n').slice(0, maxRows)
    Popdata.SAGO_GAEYO = modText.join('\n')
  }
}

const radio_changed = () =>{
  // console.log('Popdata.SAGO_TYPE_CD ', Popdata.SAGO_TYPE_CD )

  if (Popdata.SAGO_TYPE_CD === 'GMS'){
    m_dialog.value = true 
  } else if(Popdata.SAGO_TYPE_CD === 'NON') {
    m_dialog2.value = true 
  }
}

const updateGugupUse = () => {
  if(Popdata.GUGUP_USE === 'X') {
    console.log('ccc')
    isGU.value = true
  } else {
    console.log('ddd')
    isGU.value = false
  }
}

const downloadSample = () => {
  const params = {
    FILE_PATH: 'SAFA',
    FILE_NAME: '경미공상신청서 양식.xlsx',
  }
  commonSampleDownFilesApi(params)
}

const searchDNG = () => {
  searchDNG1()
  searchDNG2()
}

const searchDNG1 = () => {
  commonSearchApi({ queryId: 'SAFAB0020_search16', param: Popdata, }).then(res => {
    grdDng1.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const searchDNG2 = () => {
  commonSearchApi({ queryId: 'SAFAB0020_search17', param: Popdata, }).then(res => {
    grdDng2.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const onWorkRiskList = (val) => {
  for (let i of val) {
    const row = grdDng2.value.getDataProvider().addRow({
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      DNG_LVL: 'M',
      UNIT_DESC: i.UNIT_NM,
      WORK_DESC: i.ACT_NM,
    })

    grdDng2.value.getGridView().setCurrent({ dataRow: row })
    grdDng2.value.getGridView().checkRow(row)
  }
}

defineExpose({
  searchDNG,
})
</script>

<template>
  <v-card class="h-full">
    <v-card-title>
      <IMenuTitle
        ref="menuTitle"
        :button-list="[
          'btnCompleteSAF',
          'btnCancelWrite',
          'btnSafetyCheck',
          'btnSafetyCancel',
          'btnComplete',
          'btnCancelComplete',
        ]"
        @click-button="onButtonsClick($event.id, '메인')"
      />
    </v-card-title>
    <!-- 인적사항 -->
    <v-card-text class="wrap">
      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle
            ref="GridTitle1"
            :title="$t('인적사항 현황')"
            :button-list="['btnCreate', 'btnDelete']"
            @click-button="onButtonsClick($event.id, '인적사항현황')"
          >
            <template #editors>
              <!-- <v-checkbox v-if="isSafeUser" v-model="chkItems.PEOPLE" label="작성내용 확인" class="chk-confirm" /> -->
            </template>
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <RealGrid
            v-if = "!isadmin"
            ref="grdMain"
            class="mt-2"
            style="height: 160px"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            @onCellDblClicked="onCellDblClickedMain"
          />

          <RealGrid
            v-if = "isadmin"
            ref="grdMain"
            class="mt-2"
            style="height: 160px"
            :grid-view-option="grdProps1_admin.gridViewOption"
            :keys="grdProps1_admin.keys"
            :fields="grdProps1_admin.fields"
            :columns="grdProps1_admin.columns"
            @onCellDblClicked="onCellDblClickedMain"
          />

        </v-card-text>
      </v-card>

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle
            ref="GridTitle2"
            :title="$t('안전 사고 개요')"
            :button-list="['btnUpdate']"
            @click-button="onButtonsClick($event.id, '사고개요')"
          >
            <template #editors>
              <!-- <v-checkbox v-if="isSafeUser" v-model="chkItems.DESC" label="작성내용 확인" class="chk-confirm" /> -->
            </template>
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <!-- 발생일시 -->
            <!-- 발생장소 -->
            <div class="d-flex">
              <i-input
                top-label
                :label="$t('발생일자')"
                v-model="Popdata.OCCUR_DT"
                type="Date"
                width="150px"
                margin="10px"
                required
              />
              <i-input
                placeholder="HH:MM"
                top-label
                v-model="Popdata.OCCUR_TIME"
                @change="formatAndDisplayTime"
                :label="$t('')"
                type="Text"
                width="80px"
                margin="10px"
              />

              <i-input
                top-label
                :label="$t('발생장소')"
                type="Text"
                width="150px"
                margin="10px"
                @click:appendInner="locationPopupOpen"
                append-inner-icon="mdi-magnify"
                readonly
                required
                v-model="Popdata.SAGO_LOC_L_NM"
              />
              <i-input
                top-label
                :label="$t('')"
                type="Text"
                width="150px"
                margin="10px"
                readonly
                v-model="Popdata.SAGO_LOC_M_NM"
              />
              <i-input
                top-label
                :label="$t('')"
                type="Text"
                width="150px"
                margin="10px"
                readonly
                v-model="Popdata.SAGO_LOC_S_NM"
              />
              <i-input
                top-label
                :label="$t('상세장소')"
                type="Text"
                width="200px"
                margin="10px"
                required
                v-model="Popdata.SAGO_LOC_DTL"
              />
            </div>
            <div class="d-flex">
              <i-input
               :label="$t('재해부서 / 협력사')"
                top-label
                type="Text"
                width="200px"
                margin="10px"
                readonly
                append-inner-icon="mdi-magnify"
                required
                v-model="Popdata.INJR_DEPT_NM"
                @click:appendInner="deptPopupOpen('INJR')"
              />
              <v-btn
                class="mr-3"
                style="margin-top: 23px"
                size="x-small"
                @click="plus"
                icon="mdi-plus"
              />

              <div
                v-for="(item, i) in INJRDEPT"
                :key="i"
                class="d-flex align-center ma-0"
              >
                <i-input
                  top-label
                  :label="$t('재해부서 / 협력사')"
                  type="Text"
                  width="200px"
                  margin="10px"
                  readonly
                  append-inner-icon="mdi-magnify"
                  v-model="Popdata[`INJR_DEPT_NM${i + 1}`]"
                  @click:appendInner="deptPopupOpen(`INJR`, i + 1)"
                />
                <v-btn
                  class="mr-3"
                  size="x-small"
                  @click="minus(item)"
                  icon="mdi-minus"
                  style="margin-top: 16px"
                />
              </div>

              <!-- <i-input
                top-label
                :label="$t('책임조직')"
                type="Text"
                width="200px"
                margin="10px"
                readonly
                append-inner-icon="mdi-magnify"
                required
                v-model="Popdata.RESP_DEPT_NM"
                @click:appendInner="deptPopupOpen"
              /> -->

              <i-input
                top-label
                :label="$t('책임부서 / 협력사')"
                type="Text"
                width="200px"
                margin="10px"
                readonly
                append-inner-icon="mdi-magnify"
                required
                v-model="Popdata.RESP_DEPT_NM"
                @click:appendInner="deptPopupOpen"
              />

              <i-input
              v-if = "!isadmin"
                top-label
                :label="$t('담당 안전과장')"
                type="Text"
                width="200px"
                margin="10px"
                readonly
                v-model="Popdata.INSERT_USER"
                />
                <!-- 사고 담당자는 안전과장 변경 가능하도록 수정 -->
              <i-input
              v-if = "isadmin"
                top-label
                :label="$t('담당 안전과장')"
                type="Text"
                width="200px"
                margin="10px"
                readonly
                v-model="Popdata.INSERT_USER"
                append-inner-icon="mdi-magnify"
                @click:appendInner="empPopupOpen2"
                @keydown.enter="(e) => empPopupOpen2(e)"
                />
              </div>
              <!-- @click:appendInner="deptPopupOpen" -->

            <div class="d-flex mb-3">
              <i-textarea
                label-width="120px"
                top-label
                :label="$t('사고 개요')"
                required
                v-model="Popdata.SAGO_GAEYO"
                width="100%"
                @keydown="textareaLineLimit(this, event)"
              />
            </div>

            <!-- 재해조직/ 책임조직 /안전과장 -->
            <div class="d-flex align-center">
              <span class="mR-10" style="color: #222222; font-size: 18px; font-weight: bold;">사고 정보</span>
              <!-- <v-checkbox v-if="isSafeUser" v-model="chkItems.INFO" label="작성내용 확인" class="chk-confirm" /> -->
            </div>
            <div class="d-flex mt-3 mb-3">
              <i-input
                top-label
                :label="$t('사고형태')"
                type="Text"
                width="150px"
                margin="10px"
                @click:appendInner="acdtOpen"
                append-inner-icon="mdi-magnify"
                readonly
                required
                v-model="Popdata.SAGO_DIV_L_NM"
              />
              <i-input
                top-label
                :label="$t('')"
                type="Text"
                width="150px"
                margin="10px"
                readonly
                v-model="Popdata.SAGO_DIV_M_NM"
              />
              <i-input
                top-label
                :label="$t('')"
                type="Text"
                width="150px"
                margin="10px"
                readonly
                v-model="Popdata.SAGO_DIV_S_NM"
              />
              <div v-if="userStore.cmpnyDiv === 'HHI'">
                <div class="d-flex ma-0">
                  <p style="color: #222">{{ $t('사고처리 구분 ( ※ 사고처리 구분 변경 시 SLI 감점기간 재적용 )') }}</p>
                  <!-- <span class="reddotSago"></span>  -->
                </div>
                <v-radio-group
                  inline
                  v-model="Popdata.SAGO_TYPE_CD"
                  class="radio-box"
                  :disabled="
                    Popdata.SAGO_DIV_L === 'E' || Popdata.SAGO_DIV_L === 'D'
                  "
                  @change="radio_changed"
                >
                  <v-radio label="산재(직영/협력사)" value="SJE"></v-radio>
                  <!-- <v-radio label="경미공상(직영)" value="GMS" v-if="Popdata.SAGO_DIV_L !== 'B'"></v-radio> -->
                  <v-radio label="경미공상(직영)" value="GMS" :readonly="Popdata.SAGO_DIV_L === 'B' ? true : false"></v-radio>
                  <v-radio label="휴업 3일 이상 사고(협력사)" value="HRS"></v-radio>
                  <v-radio label="휴업 3일 미만 일반사고 (직영/협력사)" value="SNE"></v-radio>
                  <v-radio label="미정" value="NON"></v-radio>
                </v-radio-group>
              </div>
              <div v-else="userStore.cmpnyDiv === '200'">
                <div class="d-flex ma-0">
                  <p style="color: #222">{{ $t('사고처리 구분 ( ※ 사고처리 구분 변경 시 SLI 감점기간 재적용 )') }}</p>
                  <!-- <span class="reddotSago"></span>  -->
                </div>
                <v-radio-group
                  inline
                  v-model="Popdata.SAGO_TYPE_CD"
                  class="radio-box"
                  :disabled="
                    Popdata.SAGO_DIV_L === 'E' || Popdata.SAGO_DIV_L === 'D'
                  "
                >
                  <v-radio label="산재" value="SJE"></v-radio>
                  <v-radio label="경미공상" value="GMS"></v-radio>
                  <v-radio
                    label="휴업 3일 이상 사고"
                    value="HRS"
                  ></v-radio>
                  <v-radio
                    label="휴업 3일 미만 사고"
                    value="SNE"
                  ></v-radio>
                  <v-radio label="미정" value="NON"></v-radio>
                </v-radio-group>
              </div>

              <div style="margin: 0 12px" v-if="userStore.cmpnyDiv === 'HHI'">
                <p style="color: #222">{{ $t('사고강도') }}</p>
                <v-radio-group
                  inline
                  v-model="Popdata.COME_SERIOUS_YN"
                  class="radio-box"
                >
                  <v-radio label="일반사고" value="N"></v-radio>
                  <v-radio label="중대성 사고" value="Y"></v-radio>
                  <v-radio label="중대재해" value="S"></v-radio>
                </v-radio-group>
              </div>
              <div style="margin: 0 12px" v-else="userStore.cmpnyDiv === '200'">
                <p style="color: #222">{{ $t('사고강도') }}</p>
                <v-radio-group
                  inline
                  v-model="Popdata.COME_SERIOUS_YN"
                  class="radio-box"
                >
                  <v-radio label="경미상1" value="N1"></v-radio>
                  <v-radio label="경미상2" value="N2"></v-radio>
                  <v-radio label="중대성 사고" value="Y"></v-radio>
                  <v-radio label="중대재해" value="S"></v-radio>
                </v-radio-group>
              </div>
            </div>

            <!-- <i-input
                top-label
                :label="$t('안전과장')"
                v-model="Popdata.SAFE_GAMGR_EMPKORNM"
                type="Text"
                width="100px"
                margin="10px"
                append-inner-icon="mdi-magnify"
                @click:appendInner="empPopupOpen"
              /> -->
          </div>
          <!-- 수정중 -->
          <!-- <span><h3>기타 정보</h3></span> -->
          <div class="d-flex mt-3 mb-3" style="align-items: flex-end;">
            <i-select
              top-label
              :label="$t('구급차이용 여부')"
              type="Text"
              width="120px"
              margin="10px"
              v-model="Popdata.GUGUP_USE"
              :items="codeList.GUGUP_USE"
              :disabled="
                  Popdata.SAGO_DIV_L === 'E' || Popdata.SAGO_DIV_L === 'D'
                "
              item-value="COD"
              item-title="TXT"
              required
              @update:model-value="updateGugupUse"
            />
            <i-select
              top-label
              :label="$t('책임소속')"
              type="Text"
              width="120px"
              margin="10px"
              :items="codeList.ChekIm"
              item-value="COD"
              item-title="TXT"
              required
              v-model="Popdata.RESPON_DIV"
            />
            <div>
              <p style="color: #222">{{ $t('재해 소속') }}</p>
              <v-radio-group
                inline
                v-model="Popdata.FORM_DIV"
                class="radio-box"
              >
                <v-radio label="직영" value="J"></v-radio>
                <v-radio label="협력사" value="H"></v-radio>
                <v-radio label="단기공사" value="Z"></v-radio>
              </v-radio-group>
            </div>
          </div>

          <!--사고형태 / 사고접수일  /공정명 /기인물-->
          <div class="d-flex">
            <!-- <i-input
              top-label
              :label="$t('사고접수일')"
              type="Date"
              width="150px"
              required
              v-model="Popdata.SAGO_RCV_DT"
            /> -->
            <i-input
              top-label
              :label="$t('기인물')"
              type="Text"
              width="120px"
              margin="10px"
              @click:appendInner="causePopupPopupOpen"
              append-inner-icon="mdi-magnify"
              readonly
              required
              v-model="Popdata.GIINMUL1_NM"
            />
            <i-input
              top-label
              :label="$t('')"
              type="Text"
              width="120px"
              margin="10px"
              readonly
              v-model="Popdata.GIINMUL2_NM"
            />
            <i-input
              top-label
              :label="$t('')"
              type="Text"
              width="120px"
              margin="10px"
              readonly
              v-model="Popdata.GIINMUL3_NM"
            />
            <i-select
              top-label
              :label="$t('공정명')"
              type="Text"
              width="120px"
              margin="10px"
              :items="codeList.gongjong"
              v-model="Popdata.PROCESS_CD"
              item-value="COD"
              item-title="TXT"
              required
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- <v-card
        class="mb-3 mr-1 popUp-input-Form"
        v-if="Popdata.SAGO_DIV_L === 'E' || Popdata.SAGO_DIV_L === 'D'"
      > -->
      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle
            ref="GridTitle3"
            :title="
              $t('재해원인 및 예방대책(근본적 원인분석을 통한 사고 분석)')
            "
            :button-list="[
              'btnSearch',
              'btnSetRCA',
              'btnCreate',
              'btnUpdate',
              'btnDelete',
            ]"
            @click-button="onButtonsClick($event.id, '재해원인')"
          >
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <RealGrid
              ref="grdTwo"
              class="mt-2"
              style="height: 160px"
              :grid-view-option="grdProps2.gridViewOption"
              :keys="grdProps2.keys"
              :fields="grdProps2.fields"
              :columns="grdProps2.columns"
              :column-layout="grdProps2.columnLayout"
            />
            <!-- @onCellItemClicked="onCellItemClicked" -->
            <div
              style="
                padding: 12px;
                background-color: #fff;
                margin: 12px 0;
                border-radius: 8px;
              "
              v-if="RCAUpload"
            >
              <IUpload
                gridTitle="RCA등록"
                :showSearchMessage="false"
                ref="fileUpload"
                :gridOnly="NOEdit"
                @uploaded="uploaded"
                fix-height
                style="height: 400px"
              />
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle :title="$t('사고 상황 사진')">
            <template #editors>
              <!-- <v-checkbox v-if="isSafeUser" v-model="chkItems.PICTURE" label="작성내용 확인" class="chk-confirm" /> -->
            </template>
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <IUploadImageMulit
              ref="fileUpload1"
              :fileValue="files"
              :isVisibled="NOEdit"
              :cnt="3"
              @drop.prevent="test"
            />
          </div>
        </v-card-text>
      </v-card>
<!-- 지연/미이행 사유 -->

<v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle
            ref="GridTitle5"
            :title="$t('지연 보고/등록 사유(육하원칙에의거)')"
            :button-list="['btnUpdate']"
            @click-button="onButtonsClick($event.id, '지연')"
          >
            <!-- 'btnDelete' -->
            <template #editors>
              <!-- <v-checkbox v-if="isLATE && isSafeUser" v-model="chkItems.LATE" label="작성내용 확인" class="chk-confirm" /> -->
            </template>
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <v-radio-group inline v-model="isLATE" :disabled="NOEdit || !isSafeUser">
              <v-radio label="해당" :value="true"></v-radio>
              <v-radio label="해당없음" :value="false"></v-radio>
            </v-radio-group>
            <div v-if="isLATE">
              <!-- <div class="d-flex align-center">
                 <i-input
                  top-label
                  :label="$t('작성자')"
                  type="Text"
                  width="150px"
                  :append-inner-icon="LATEReadonly ? '' : 'mdi-magnify'"
                  @click:appendInner="empPopupOpen"
                  @keypress.enter="empPopupOpen"
                  v-model="Popdata.LATE_USER_IDM"
                  required
                />
                <i-input
                  top-label
                  :label="$t('작성일시')"
                  type="Date"
                  width="150px"
                  v-model="Popdata.LATE_DT"
                  required
                /> -->
                <!-- <i-input
                  top-label
                  :label="$t('')"
                  type="Text"
                  width="80px"
                  v-model="Popdata.LATE_TIME"
                  @change="LATETIME"
                  placeholder="HH:MM"
                />
              </div> -->

              <div class="d-flex align-center">
                <i-textarea
                  label-width="300x"
                  top-label
                  :label="$t('지연사유')"
                  v-model="Popdata.LATE_RSN"
                  width="100%"
                />
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle
            ref="GridTitle6"
            :title="$t('구급차 미이용 경위서')"
            :button-list="['btnUpdate']"
            @click-button="onButtonsClick($event.id, '구급차')"
          >
            <!-- 'btnDelete' -->
            <template #editors>
              <!-- <v-checkbox v-if="isGU && isSafeUser" v-model="chkItems.AMBUL" label="작성내용 확인" class="chk-confirm" /> -->
            </template>
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <v-radio-group inline v-model="isGU" :disabled="NOEdit || !isSafeUser">
              <v-radio label="해당" :value="true"></v-radio>
              <v-radio label="해당없음" :value="false"></v-radio>
            </v-radio-group>
            <div v-if="isGU">
              <v-col>
                <i-textarea
                  label-width="300px"
                  top-label
                  :label="$t('사고 및 후송 경위서')"
                  v-model="Popdata.AMBUL_NOT_DESC"
                  width="100%"
                />
              </v-col>

              <v-col>
                <i-textarea
                  label-width="300px"
                  top-label
                  :label="$t('미 신고(구급차 미 이용)사유')"
                  v-model="Popdata.AMBUL_NOT_RSN"
                  width="100%"
                />
              </v-col>

              <v-col>
                <i-textarea
                  label-width="300px"
                  top-label
                  :label="$t('안전사고 미 신고 재발방지 대책')"
                  v-model="Popdata.AMBUL_NOT_PLN"
                  width="100%"
                />
              </v-col>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <div style="height: 42px; padding-top: 6px; margin-bottom: 18px">
            <IGridTitle
              :title="$t('산업재해 조사표(재해자 서명본)')"
              :button-list="['btnPrintHandwriting']"
              @click-button="onButtonsClick($event.id, '조사표')"
            />
          </div>

          <div class="popUp-input-Form mt-3">
            <div
              style="
                padding: 12px;
                background-color: #fff;
                margin: 12px 0;
                border-radius: 8px;
              "
            >
              <div class="my-2" v-if="isInjuSahang">
                <p>
                  등록된 인적사항이 없습니다. 인적사항 진행후
                  이용해주시기바랍니다.
                </p>
              </div>

              <IUpload
                ref="joUpload"
                :gridOnly="isInjuSahang"
                @uploaded="joUploaded($event)"
                @dataLength="joLengthcheck($event)"
                :download-off="isNoDown"
                :button-list="FILE_BTN.RPT_BTN"
                fix-height
                style="height: 200px"
              />
            </div>
          </div>
      </v-card>

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <IGridTitle
          :title="$t('기타 자료(필요 시 첨부)')"
        />

        <div class="popUp-input-Form">
          <div
            style="
              padding: 12px;
              background-color: #fff;
              border-radius: 8px;
            "
          >
            <IUpload
              ref="etcFile"
              fix-height
              style="height: 250px"
            />
          </div>
        </div>
      </v-card>

      <v-card
      class="mb-3 mt-3 mr-1 popUp-input-Form"
      v-if="userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2"
      >
        <v-card-title class="pa-0">
          <IGridTitle
            ref="GridTitle8"
            :title="$t('사고 관리 정보')"
            :button-list="['btnUpdate']"
            @click-button="onButtonsClick($event.id, '사고관리')"
          >
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <div class="d-flex">
          <v-card-text class="pa-0">
            <div class="sago">
              <p class="mb-2">통계 반영</p>
              <div>
                <v-radio-group inline v-model="Popdata.JEWE_YN">
                  <v-radio label="미해당" value="Y"></v-radio>
                  <v-radio label="해당" value="N"></v-radio>
                </v-radio-group>
              </div>
            </div>
            <div class="sago ml-3">
              <p class="mb-2">SLI 집계</p>
              <div>
                <v-radio-group inline v-model="Popdata.SLI_YN">
                  <v-radio label="미해당" value="N"></v-radio>
                  <v-radio label="해당" value="Y"></v-radio>
                </v-radio-group>
              </div>
            </div>

            <div class="sago ml-3">
              <p class="mb-2">통계 확인</p>
              <div>
                <v-radio-group inline v-model="Popdata.TONG_CHK">
                  <v-radio label="확인" value="Y"></v-radio>
                  <v-radio label="미확인" value="N"></v-radio>
                </v-radio-group>
              </div>
            </div>

            <div class="sago2 ml-3">
              <p class="mb-2">산업재해조사표 제출여부</p>
              <div>
                <v-radio-group inline v-model="Popdata.RPT_CHK">
                  <v-radio label="제출 완료" value="Y"></v-radio>
                  <v-radio label="대상 아님" value="X"></v-radio>
                  <v-radio label="미제출"    value="N"></v-radio>
                </v-radio-group>
              </div>
            </div>

          </v-card-text>
        </div>
      </v-card>


      <div class="popUp-input-Form pa-6">
        <IGridTitle
          ref="gridTitleDng"
          class="mt-0 mb-3"
          :button-list="['btnUpdate']"
          @click-button="onButtonsClick($event.id, '수시위험성평가')"
        />
        <v-card class="pa-3 rounded-lg">
          <!-- 작업지시서/ 작업표쥰 -->
          <div class="d-flex mt-0 mx-0 mb-3"> 
          <!-- <div class="d-flex ma-0"> -->
            <!-- <i-input
              top-label
              :label="$t('작업지시서')"
              type="Text"
              width="230px"
              margin="10px"
              v-model="Popdata.WORK_TITLE"
              append-inner-icon="mdi-magnify"
              @click="WORKIDOpen"
              readonly
            /> -->
            <i-input
              v-show="Popdata?.RESP_DEPT_CD?.substr(0, 1) !== 'E'"
              top-label
              :label="$t('작업표준')"
              :required="(Popdata.SAGO_DIV_L === 'A'||Popdata.SAGO_DIV_L === 'D'||Popdata.SAGO_DIV_L === 'E') && Popdata?.RESP_DEPT_CD?.substr(0, 1) !== 'E'"
              type="Text"
              width="230px"
              margin="10px"
              v-model="Popdata.WRK_STD_NM"
              append-inner-icon="mdi-magnify"
              @click:appendInner="WRKSTDOpen"
              @keydown.enter="
                (e) => {
                  WRKSTDOpen()
                }
              "
            />

            <i-input
              v-show="Popdata?.RESP_DEPT_CD?.substr(0, 1) === 'E'"
              top-label
              :label="$t('작업표준')"
              :required="(Popdata.SAGO_DIV_L === 'A'||Popdata.SAGO_DIV_L === 'D'||Popdata.SAGO_DIV_L === 'E') && Popdata?.RESP_DEPT_CD?.substr(0, 1) === 'E'"
              type="Text"
              width="230px"
              margin="10px"
              v-model="Popdata.WRK_STD_NM_E"
            />

            <v-checkbox
              style="margin-top: 23px"
              top-label
              v-model="Popdata.WRK_STD_NEW"
              true-value="Y"
              false-value="N"
              :label="$t('신규작성필요')"
            />
            <!-- <div class="mx-5">
              <p style="color: #222">
                {{ $t('Hi-Standard 개정 필요 여부') }}
              </p>
              <v-radio-group
                inline
                v-model="Popdata.WIHEOM_YN"
                class="radio-box"
                disabled
              >
                <v-radio label="필요" value="Y"></v-radio>
                <v-radio label="불필요" value="N"></v-radio>
              </v-radio-group>
            </div>
            <i-input
              top-label
              :label="$t('불필요 사유입력')"
              type="Text"
              width="460px"
              margin="10px"
              disabled
              v-model="Popdata.WIHEOM_DESC"
            /> -->
          </div>
          <div
            class="d-flex justify-center align-center ma-0"
            style="width: 120px; padding: 8px 0; font-size: 14px; color: #1a40c7; font-weight: bold; background-color: #eeeeee;"
          >
            수시 위험성평가
          </div>
          <div
            class="pa-3"
            style="border-top: 1px solid #bbddff;"
          >
            <IGridTitle
              class="mt-0"
              title="평가자"
              :button-list="['btnCreate', 'btnDelete']"
              @click-button="onButtonsClick($event.id, '수시위험성평가자')"
            >
              <template #editors>
                <div>
                  사고 발생 작업에 종사하는 근로자를 평가자에 포함하여 수시 위험성평가 진행
                </div>
              </template>
            </IGridTitle>
            <RealGrid
              ref="grdDng1"
              style="height: 115px;"
              :grid-view-option="grdDng1Props.gridViewOption"
              :keys="grdDng1Props.keys"
              :fields="grdDng1Props.fields"
              :columns="grdDng1Props.columns"
            />
            <IGridTitle
              class="mt-3"
              title="평가내용"
              :button-list="['btnCreate', 'btnDelete']"
              @click-button="onButtonsClick($event.id, '수시위험성평가내용')"
            >
              <template #editors>
                <div>
                  단위작업 및 작업행동에 대한 위험요인/위험성/위험감소대책 검토 필요 
                  <br/>
                  * [위험요인, 위험감소대책] 입력 중 줄바꿈 필요 시 Ctrl+enter키를 이용하여 줄바꿈 가능
                </div>
              </template>
            </IGridTitle>
            <RealGrid
              ref="grdDng2"
              style="height: 175px;"
              :grid-view-option="grdDng2Props.gridViewOption"
              :keys="grdDng2Props.keys"
              :fields="grdDng2Props.fields"
              :columns="grdDng2Props.columns"
            />
          </div>
        </v-card>
      </div>
      <!-- <div class="d-flex">
        <div class="mx-5">
          <p style="color: #222">
            {{ $t('Hi-Standard 개정 필요 여부') }}
          </p>
          <v-radio-group
            inline
            v-model="Popdata.WIHEOM_YN"
            class="radio-box"
          >
            <v-radio label="필요" value="Y"></v-radio>
            <v-radio label="불필요" value="N"></v-radio>
          </v-radio-group>
        </div>
        <i-input
          top-label
          :label="$t('불필요 사유입력')"
          type="Text"
          width="460px"
          margin="10px"
          :disabled="Popdata.WIHEOM_YN !== 'N'"
          v-model="Popdata.WIHEOM_DESC"
        />
      </div> -->

      <v-dialog
        v-model="m_dialog"
        width="auto"
      >
        <v-card
          max-width="700"
          style="padding: 20px; position: relative;"
          prepend-icon="mdi-information"
          title="경미공상 기준"
        >
          <v-btn @click.stop="downloadSample" style="position: absolute; top: 20px; right: 20px;">
            경미공상 신청서 다운로드
          </v-btn>
          <v-card-text v-html="dialog_text">
          </v-card-text>

          <template v-slot:actions>
            <v-btn
              class="ms-auto"
              text="Ok"
              @click="m_dialog = false"
            ></v-btn>
          </template>
        </v-card>
      </v-dialog>

      <v-dialog
        v-model="m_dialog2"
        width="auto"
      >
        <v-card
          max-width="700"
          style="padding: 20px;"
          prepend-icon="mdi-information"
          title="사고처리 구분 미정 선택"
        >
          <v-card-text>
            <br/>사고처리 구분을 ‘미정’으로 선택하셨습니다.
            <br/>사고 발생일로부터 14일 이내 반드시 확정해 주셔야 합니다.
            <br/>* 해당 기간 내 미확정 및 사고 즉보/보고서 미종결 시, 지연 등록으로 인한 SLI 추가 감점이 적용됩니다.
          </v-card-text>

          <template v-slot:actions>
            <v-btn
              class="ms-auto"
              text="Ok"
              @click="m_dialog2 = false"
            ></v-btn>
          </template>
        </v-card>
      </v-dialog>


      <!-- 팝업촌 -->
      <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
      <CommonCodePopUpSAF ref="CausePopup" @selected="onCauseSelected" />
      <SAFAB0020ManPopUp @upData="ManUpDataRow" ref="ManPopUp" />
      <SAFAB0020DisasterPopUp ref="Disaster" @selectedArr="selectedDisaster" />
      <SAFAB0020WRK_STD ref="WRK_STDPopUp" @selected="selectedWRKSTD" />
      <SAFAB0020WRKID ref="WWRKIDPopUp" @selected="selectedWRKID" />
      <EmpPopup ref="empPopup" @selected="selectedemp" />
      <EmpPopup2 ref="empPopup2" @selected="selectSAFE_GAMGR" />
      <IUploadPopup ref="fileUploadgrd" :fileDan="true" @uploaded="uploaded" />
      <SAFAB0020_Reason ref="sAFAB0020_Reason" @InputReason="InputReason"></SAFAB0020_Reason>
      <WorkRiskList ref="workRiskList" @selected="onWorkRiskList" />

    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
/* .popUp-input-Form > div {
  margin: 10px 0;
} */

.d-flex {
  margin: 6px 0;
}
.fileDiv {
  width: 420px;
  padding: 12px;
  background: #fff;
}
.wrap {
  height: calc(100vh - 50px - 66.7px - 50px);
  overflow-y: scroll;
  padding: 0px;
}

.radio-box {
  background-color: #fff;
  padding: 3px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
}
.sago {
  background: #fff;
  padding: 8px;
  width: 250px;
  border-radius: 12px;
  display: inline-block;
}
.sago2 {
  background: #fff;
  padding: 8px;
  width: 300px;
  border-radius: 12px;
  display: inline-block;
}
.reddotSago{
  width: 5px;
  height: 5px;
  border-radius: 10px ;
  background: red;

} 

::v-deep(.chk-confirm) {
  margin-left: 8px;

  input {
    width: 28px !important;
    height: 28px !important;
  }

  input::after {
    width: 28px !important;
    height: 28px !important;
    background-size: 28px;
  }

  label {
    margin-left: 6px;
    font-size: 18px !important;
  }
}
</style>
