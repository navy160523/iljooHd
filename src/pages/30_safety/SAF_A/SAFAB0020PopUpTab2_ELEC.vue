<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 사고 세부사항 팝업 > 사고보고서    -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { useLogsStore } from '@hiway/stores/logs'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import IUpload from '@/components/IUpload.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonRskSaveApi,
  commonSendApi,
  commonSendSMS,
} from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import SAFAB0020PopUp from '@/pages/30_safety/SAF_A/SAFAB0020PopUp.vue'

import SAFAB0020ManPopUp from '@/pages/30_safety/SAF_A/SAFAB0020ManPopUp.vue'
import IUploadImageSingle from '@/components/IUploadImageSingle.vue'
// 팝업촌
import AcdtPopup from '@/components/popup/AcdtPopup.vue'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF_ELEC.vue'
import SAFAB0020WRK_STD from '@/pages/30_safety/SAF_A/SAFAB0020WRK_STD.vue'
import SAFAB0020DisasterPopUp from '@/pages/30_safety/SAF_A/SAFAB0020DisasterPopUp.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import SAFAB0020WRKID from '@/pages/30_safety/SAF_A/SAFAB0020WRKID.vue'
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'
const SAGOORGTYPE = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdDetail = ref(null)
const grdTwo = ref(null)
const NOEdit = ref(false)
const files = ref([])
const INJRDEPT = ref([])
const WRK_STD_NMNot = ref(false)
const GuBunValue = ref(false)
const index = ref(null)
const disableYn = ref(false)
const gan = ref(null)
const mok = ref(null)
const isUpload1 = ref(false)
const isUpload2 = ref(false)
const isUpload3 = ref(false)
// 팝업관련
const deptPopup = ref(null)
const MainPopOpen = ref(null)
const emit = defineEmits(['close', 'upData'])
const Popdata = reactive({})
const codeList = reactive({
  WRK_STD: [{ TXT: '없음', COD: '' }],
  WORK_ID: [{ TXT: '없음', COD: '' }],
})
const CausePopup = ref(null)
const acdtPopupRef = ref(null)
const locationPopup = ref(null)
const ManPopUp = ref(null)
const WRK_STDPopUp = ref(null)
const Disaster = ref(null)
const CostMoney = ref(0)
const JINSUL_CANT = ref(false)
const JINSUL_CANTBTN = ref(false)
const empPopup = ref(null)
const props = defineProps({
  popupParam: {
    type: Object,
    required: false,
    default() {
      return {}
    },
  },
})

const mailParams = reactive({
  EMAIL: [],
  REFERER: [],
  // HIDDEN_REFERER: [],
  SUBJECT: '',
  CONTENT: '',
})

//계층(상세정보) 초기화
const ArrayList = ref([])
const isUpload = ref(false)
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
// UNIT, ACT, RISK 초기화
const WORK_STANDARD_UNIT = ref([])
const WORK_STANDARD_ACT = ref([])
const WORK_STANDARD_RISK = ref([])

const WhyNot = ref(true)
const WWRKIDPopUp = ref(null)
// 파일관련
const fileSave = reactive([])
const fileUpload = ref(null)
const fileUpload1 = ref(null)
const fileUpload2 = ref(null)
const fileUpload3 = ref(null)
const readonly1 = ref(null)
const readonly2 = ref(null)
const readonly3 = ref(null)
const RCAUpload = ref(null)
const JINSUL = ref(null)
const joUpload = ref(null)
const LATEReadonly = ref(false)
const jinUpload = ref(null)
const isJinUpload = ref(false)
const endCheck = ref(false)
//  재해원인
const fileIndexgrd = ref('')
const fileDatagrd = ref('')
const fileUploadgrd = ref(null)
const isInjuSahang = ref(false)
const commonPopUp = ref('')
// disable 관련
const GridTitle1 = ref(null)
const GridTitle2 = ref(null)
const GridTitle3 = ref(null)
const GridTitle4 = ref(null)
const GridTitle5 = ref(null)
const GridTitle6 = ref(null)
const GridTitle7 = ref(null)
const injuSahang = ref([])
const bullinjung = ref({
  REQUEST_DETAILS: '',
  STATUS: '',
  COMMENTS: '',
  JUDGE_REVIEW: '',
  ETC: '',
})
const isBull = ref('')
const empNoWrkID = ref('')
// 지연 미이행 사유
const isLATE = ref()
// 구급차
const isGU = ref()
const isSearchST =ref(null)

const sagoEmpNo = 'A524835'    // 사고 담당자 지정 (김성일 매니저: A524835)

// 버튼
const CompleteSendbtn = ref(false)
const CancelWritebtn = ref(false)
const SafetyCheckbtn = ref(false)
const Completebtn = ref(false)
const CancelCompletebtn = ref(true)
const CancelSafety = ref(true)
onMounted(() => {
  Promise.all([
    getCodeList('HHIB320'), //0
    getCodeList('HHIB010'), //1
    getCodeList('HHIB180'), //2
    getCodeList('HHIB050'), //3
    getCodeList('HHIB070'), //4
    getCodeList('HHIB080'), //5
    getCodeList('HHIB100'), //6
    getCodeList('HHIB120'), //7
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
    codeList.SUCHIC_DIV_CD = res[6].ORESULT_CUR
    codeList.JINDAN_CD = res[7].ORESULT_CUR
  })

  for (let i in props.popupParam) {
    Popdata[i] = props.popupParam[i]
  }

  SagoSearch()
  if (Popdata.OCCUR_TIME) {
    const hours = Popdata.OCCUR_TIME.substring(0, 2)
    const minutes = Popdata.OCCUR_TIME.substring(2)
    Popdata.OCCUR_TIME = `${hours}:${minutes}`
  }

  if (Popdata.LATE_TIME) {
    const hours = Popdata.LATE_TIME.substring(0, 2)
    const minutes = Popdata.LATE_TIME.substring(2)
    Popdata.LATE_TIME = `${hours}:${minutes}`
  }

  if (Popdata.OCCUR_DT) {
    Popdata.OCCUR_DT = dayjs(Popdata.OCCUR_DT).format('YYYY-MM-DD')
  }

  if (!Popdata.FORM_DIV) {
    Popdata.FORM_DIV = 'J'
  }

  if(Popdata.WRK_STD_NM ==='신규작성필요'){
    isSearchST.value = true
    Popdata.WRK_STD_NEW = 'Y'
  }
  else{
    isSearchST.value = false 
  }
  // if (!Popdata.WIHEOM_YN) {
  //   Popdata.WIHEOM_YN = "Y"
  // }
  if (Popdata.LATE_DT) {
    Popdata.LATE_DT = dayjs(Popdata.LATE_DT).format('YYYY-MM-DD')
  }
  // if (Popdata.SAGO_RCV_DT) {
  //   Popdata.SAGO_RCV_DT = dayjs(Popdata.SAGO_RCV_DT).format('YYYY-MM-DD')
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

  if (!Popdata.LATE_TYPE || Popdata.LATE_TYPE === '0') {
    isLATE.value = false
    Popdata.LATE_TYPE = '0'
  }

  if (Popdata.LATE_TYPE === '1') {
    isLATE.value = true
  }

  // if (Popdata.GUGUP_USE == 'O' || !Popdata.AMBUL_NOT_DESC) {
  //   isGU.value = false
  // } else {
  //   isGU.value = true
  // }

  if(Popdata.SAGO_TYPE_CD){
    SAGOORGTYPE.value = Popdata.SAGO_TYPE_CD
  }
  else{
    SAGOORGTYPE.value = null
  }

  console.log(Popdata.GUGUP_USE, 'Popdata.GUGUP_USE')

  let CostParam = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    YEAR: dayjs().year(),
    // YEAR: 2018,
  }
  commonSearchApi({
    queryId: 'SAFAB0020_search10',
    param: CostParam,
  })
    .then((res) => {
      if (res.ORESULT_CUR.length != 0) {
        CostMoney.value = res.ORESULT_CUR[0].PRC_PER_MH
      } else {
        CostMoney.value = 0
      }
    })
    .finally(() => {
      LostCostSearch()
    })

  isUpload.value = false
  isJinUpload.value = false
  NOEdit.value = false
  onButtonsClick('btnSearch', '재해원인')
})

const SagoSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData01)
    .setAfter(afterSearch01)
    .showMessage(false)
    .run()
}

const upDataRow = () => {
  SagoSearch()
}

// //  버튼이밴트

const onButtonsClick = (btn, gbn) => {
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


  if (gbn == '산재불인정') {
    if (btn == 'btnSearch') {
      let param = {
        CMPNY_DIV: injuSahang.value.CMPNY_DIV,
        SAGO_SN: injuSahang.value.SAGO_SN,
        SEQ: injuSahang.value.SEQ,
      }
      commonSearchApi({
        queryId: 'SAFAB0020_search08',
        param: param,
      }).then((res) => {
        // console.log(res, "res산재불인정")
        if (res.ORESULT_CUR.length != 0) {
          if (res.ORESULT_CUR[0].OCCUR_TIME) {
            const hours = res.ORESULT_CUR[0].OCCUR_TIME.substring(0, 2)
            const minutes = res.ORESULT_CUR[0].OCCUR_TIME.substring(2)
            res.ORESULT_CUR[0].OCCUR_TIME = `${hours}:${minutes}`
          }
          if (res.ORESULT_CUR[0].OCCUR_DT) {
            res.ORESULT_CUR[0].OCCUR_DT = dayjs(
              res.ORESULT_CUR[0].OCCUR_DT
            ).format('YYYY-MM-DD')
          }
          bullinjung.value = res.ORESULT_CUR[0]
          isBull.value = true
        } else {
          isBull.value = false
        }
      })
    }
    if (btn == 'btnUpdate2') {
      new saveFlowHelper(vm, t)
        .setBefore(SanBulCheck)
        .setQuery(SanBulData)
        .setAfter(() => {})
        .run()
    }
    if (btn == 'btnDelete2') {
      new deleteFlowHelper(vm, t)
        .setBefore(SanBulDelChek)
        .setQuery(SanBulDel)
        .setAfter(() => {})
        .run()
    }
  }

  if (gbn === '사고개요') {
    if (btn === 'btnUpdate') {
      new saveFlowHelper(vm, t)
        .setBefore(saGoCheck)
        .setQuery(saGosaveData)
        .setAfter(() => {
          onButtonsClick('btnSearch', '재해원인')
          emit('upData')
        })
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
  if (gbn === '손실') {
    if (btn === 'btnUpdate') {
      new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdDetail, row: null }])
        .setGridList([grdDetail])
        .setBefore(CostCheck)
        .setQuery(CostSaveData)
        .setAfter(() => {
          LostCostSearch()
        })
        .run()
    }
    if (btn === 'btnDelete') {
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdDetail, row: null }])
        .setGridList([grdDetail])
        .setBefore(CostCheckDel)
        .setQuery(CostDeleteData)
        .setAfter(() => {
          LostCostSearch()
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
          emit('upData')
        })
        .run()
    }

    if (btn === 'btnDelete') {
      new deleteFlowHelper(vm, t)
        .setBefore(LATECheckDel)
        .setQuery(LATEDeleteData)
        .setAfter(() => {
          emit('upData')
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
          emit('upData')
        })
        .run()
    }
    if (btn === 'btnDelete') {
      new deleteFlowHelper(vm, t)
        .setBefore(GUGUPCheckDel)
        .setQuery(GUGUPDeleteData)
        .setAfter(() => {
          emit('upData')
        })
        .run()
    }
  }



  if (btn.id === 'btnUpdate') {
  } else if (btn.id === 'btnApply') {
  } else if (btn.id === 'btnPrint') {
  } else if (btn.id === 'btnClose') {
    emit('close', 'close')
  }
}

// 인적사항 이벤트

// 조회
const searchData01 = (idx) => {
  let param = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    SAGO_SN: Popdata.SAGO_SN,
  }
  return commonSearchApi({ queryId: 'SAFAB0020_search02', param: param })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  injuSahang.value = res.ORESULT_CUR[0]
  

  console.log(injuSahang.value, 'injuSahang')
  if (res.ORESULT_CUR[0].EMP_NO) {
    if (res.ORESULT_CUR[0].EMP_NO) {
      empNoWrkID.value = res.ORESULT_CUR[0].EMP_NO
    }
  }

  if (injuSahang.value.length !== 0) {
    onButtonsClick('btnSearch', '산재불인정')
  }
}

//  그리드 이벤트
const onCellDblClickedMain = (grd, data) => {
  if (data.cellType === 'data') {
    let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    ManPopUp.value.openPopup(row, true, 'dblclick')
  }
}

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
const LATETIME = () => {
  Popdata.LATE_TIME = formatTimeFromInput(Popdata.LATE_TIME)
}

//인적사항 속성셋팅
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
      header: { text: t('재해자') },
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

//  손실비용 조회

const grdProps3 = reactive({
  gridViewOption: { checkBar: { visible: true }, footer: { visible: true } },
  keys: ['COL1', 'COL2'],
  fields: [
    {
      fieldName: 'DEPT_DIV_NM',
      dataType: 'text',
      header: { text: t('구분') },
      mergeRule: { criteria: 'value' },
      editable: false,
    },
    {
      fieldName: 'ITEM_NM',
      dataType: 'text',
      header: { text: t('구분') },
      editable: false,
    },
    {
      fieldName: 'INWONSU',
      dataType: 'number',
      header: { text: t('인원(명)') },
      styleName: 'editable_column right-column',
      numberFormat: '#,###',
      footer: { numberFormat: '#,###', expression: 'sum' },
    },
    {
      fieldName: 'DAECHEK',
      dataType: 'number',
      header: { text: t('시간(HR)') },
      styleName: 'editable_column right-column',
      numberFormat: '#,###',
      footer: { numberFormat: '#,###', expression: 'sum' },
    },
    {
      fieldName: 'MH',
      dataType: 'number',
      header: { text: t('소요M/H') },
      editable: false,
      styleName: 'right-column',
      numberFormat: '#,###',
      footer: { numberFormat: '#,###', expression: 'sum' },
      valueExpression: "values['INWONSU'] * values['DAECHEK']",
    },

    {
      fieldName: 'SUMVAL',
      dataType: 'number',
      header: { text: t('비용(원)') },
      editable: false,
      styleName: 'right-column',
      numberFormat: '#,###',
      footer: { numberFormat: '#,###', expression: 'sum' },
      valueCallback: function (prod, dataRow, fieldName, fieldNames, values) {
        let TestCount = values[fieldNames.indexOf('MH')]
        return TestCount * CostMoney.value
      },
    },

    {
      fieldName: 'DEPT_DIV_CD',
      dataType: 'text',

      visible: false,
    },
    {
      fieldName: 'ITEM_CD',
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
      items: ['DEPT_DIV_NM', 'ITEM_NM'],
    },
    'INWONSU',
    'DAECHEK',
    'MH',
    'SUMVAL',
  ],
})

grdProps3.columns = grdProps3.fields

const LostCostSearch = () => {
  let LostCostParam = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    SAGO_SN: Popdata.SAGO_SN,
  }

  commonSearchApi({
    queryId: 'SAFAB0020_search09',
    param: LostCostParam,
  }).then((res) => {
    console.log(res, '09')
    grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

// 사고개요 이벤트
// 부서선택팝업
const deptPopupOpen = (gbn, i) => {
  console.log(i)
  if (gbn == 'INJR') {
    GuBunValue.value = false

    if (i) {
      console.log(i, '55555')
      index.value = i
      console.log(index.value, '44')
    } else {
      index.value = undefined
    }
  } else GuBunValue.value = true

  console.log(GuBunValue.value)
  deptPopup.value.openPopup()
}
const onDeptSelected = (row) => {
  console.log(row)
    let str = row.ASGN_FULL_NM.split("-")

  if (!GuBunValue.value) {
    if (!index.value) {
      Popdata.INJR_DEPT_CD = row.DEPT_CD
      Popdata.INJR_DEPT_NM = row.ASGN_SHRT_NM
    }
    if (index.value) {
      let StringDept = `INJR_DEPT_CD${index.value}`
      let StringDeptNM = `INJR_DEPT_NM${index.value}`
      console.log(StringDept)
      console.log(StringDeptNM)
      Popdata[StringDept] = row.DEPT_CD
      Popdata[StringDeptNM] = row.ASGN_SHRT_NM
    }
  } else {
    Popdata.RESP_DEPT_CD = row.DEPT_CD
    Popdata.RESP_BSNS_CD = row.BSNS_CD
    Popdata.RESP_DEPT_NM = row.ASGN_FULL_NM
    Popdata.VNDR_NM = row.ORGN_DIV == 'B' ? row.ASGN_SHRT_NM : ''
    Popdata.VNDR_CD = row.ORGN_DIV == 'B' ? row.ASGN_CD : ''
  }
}

// 사고 팝업오픈
const acdtOpen = () => {
  CausePopup.value.openPopup('사고분류')
  commonPopUp.value = '사고'
}

const selectedArr = (row) => {
  Popdata.SAGO_DIV_L_NM = row[0].TXT
  Popdata.SAGO_DIV_M_NM = row[1].TXT
  Popdata.SAGO_DIV_S_NM = row[2].TXT

  Popdata.SAGO_DIV_L = row[0].COD
  Popdata.SAGO_DIV_M = row[1].COD
  Popdata.SAGO_DIV_S = row[2].COD
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

// 장소 팝업
const locationPopupOpen = () => {
  CausePopup.value.openPopup('장소')
  commonPopUp.value = '장소'
}

// 작업표준서 팝업
//  작업 표준서 로직 변경 추후 사용 할수있어서 주석처리
const WRKSTDOpen = () => {
  if (!WRK_STD_NMNot.value) {
    WRK_STDPopUp.value.openPopup(Popdata.WRK_STD_NM)
  }
}

const selectedWRKSTD = (param) => {
  Popdata.WRK_STD_NM = param.WS_NM
  Popdata.WRK_STD_NO = param.WS_ID
  Popdata.WRK_STD_NEW = 'N'
}

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
const minus = (item, seq) => {
  console.log(item, 'item')

  console.log(Popdata.INJR_DEPT_NM1, 'item')
  if (item == 'INJR_DEPT_NM1' || seq == '1') {
    Popdata.INJR_DEPT_NM1 = ''
    Popdata.INJR_DEPT_CD1 = ''
  }
  if (item == 'INJR_DEPT_NM2' || seq == '2') {
    Popdata.INJR_DEPT_NM2 = ''
    Popdata.INJR_DEPT_CD2 = ''
  }
  if (item == 'INJR_DEPT_NM3' || seq == '3') {
    Popdata.INJR_DEPT_NM3 = ''
    Popdata.INJR_DEPT_CD3 = ''
  }
  INJRDEPT.value = Array.prototype.filter.call(
    INJRDEPT.value,
    (x) => x !== item
  )
}

// 저장 사고개요
const saGoCheck = () => {
if(Popdata.SAGO_DIV_L === 'A'){
  if(!Popdata.WRK_STD_NM){
    Message.warn(t('사고분류가 작업성이면 작업표준은 필수입력입니다.'))
    return false
  }
}
if(Popdata.WIHEOM_YN ==='N'){
    if(!Popdata.WIHEOM_DESC){
      Message.warn(t('개정 필요여부가 불필요 일경우 불필요 사유는 필수 입력입니다.'))
    return false
    }
  }

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

  if (!Popdata.SAGO_LOC_L_NM) {
    Message.warn(t('발생장소는 필수 입력입니다.'))
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
  //   Message.warn(t('사고접수일은 필수 입력입니다.'))
  //   return false
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

  if (!Popdata.SAGO_GAEYO) {
    Message.warn(t('사고내용은 필수 입력입니다.'))
    return false
  }
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
  if(SAGOORGTYPE.value !== Popdata.SAGO_TYPE_CD){
      Popdata.SLI_DATE = dayjs().format('YYYYMMDD') 
    console.log('사고타입변경일어남')
    }
  else{
    console.log('사고타입변경안일어남')
  }


  saveParams.push(Popdata)
  console.log(saveParams, 'saveParams')
  return commonExecuteApi({
    queryId: 'SAFAB0020_save01',
    list: saveParams,
  }).then((res) => {
    // 신규 작업표준 추가되는것 막기 : 김성일 매니저 요청 241113
    // if (Popdata.WRK_STD_NEW === 'Y' && !isSearchST.value) {
    //   let params = [
    //     {
    //       SAVE_STATUS: 'C',
    //       WORK_STANDARD_ID: Popdata.workStandardID,
    //       COMPANY_CD: Popdata.CMPNY_DIV,
    //       DEPT_CD: Popdata.INJR_DEPT_CD,
    //       DEPT_NM: Popdata.INJR_DEPT_NM,
    //       CORP_ASGN_CD: Popdata.RESP_DEPT_CD,
    //       CORP_ASGN_NM: Popdata.RESP_DEPT_NM,
    //       GUBUN_CD: ' ',
    //       WORK_STANDARD_NO: Popdata.workStandardNo,
    //       WORK_STANDARD_REVISION: 1,
    //       WORK_STANDARD_NM: Popdata.WRK_STD_NM,
    //       PROGRESS_STATUS: 'CP_AW',
    //       WORK_STANDARD_KIND: 'C',
    //       RISK_TYPE: 'RISK_TYPE-02',
    //       WORK_STANDARD_DESC: '',
    //       PRODUCTION_MANAGER: '',
    //       POSITION_MANAGER: '',
    //       WORK_TOOLS: '',
    //       EQUIPMENT_TYPE: '',
    //       USE_CHEMICAL: '',
    //       REVIEWER: '',
    //       CHK_REQUIRED: '',
    //       USR_ID: userStore.empNo,
    //     },
    //   ]
    //   console.log('params')
    //   commonExecuteApi({ queryId: 'RSKBA0010_SAVE_01', list: params }).then(
    //     (res) => {
    //       console.log(params, '신규작성')
    //     }
    //   )
    // }
    
  })
}
// 재해원인 이벤트

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
    console.log(data, 'data')
    saveParams.push(data)
  }
  console.log(saveParams)

  return commonExecuteApi({ queryId: 'SAFAB0020_save02', list: saveParams })
}

// 삭제 재해원인

const deleteData = () => {
  let delParams = []
  let checkedRows = grdTwo.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdTwo.value.getDataProvider().getJsonRow(rowIdx)
    console.log(data, 'data')
    delParams.push(data)
  }

  return commonExecuteApi({ queryId: 'SAFAB0020_delete04', list: delParams })
}

// 저장 손실비용
const CostCheck = async () => {
  let checkedRow = await grdDetail.value.getGridView().getCheckedRows()
  if (checkedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  if (CostMoney.value == 0) {
    Message.warn(
      t(
        `${dayjs().year()}년도분 노무비 기준단가가 없어서 손실비용 산출이 불가합니다. 안전경영부 사고 담당자에게 입력 요청 하십시요.`
      )
    )
    return false
  }

  return true
}

const CostSaveData = () => {
  let param = []
  let checkedRow = grdDetail.value.getGridView().getCheckedRows()
  checkedRow.forEach((item) => {
    let data = grdDetail.value.getDataProvider().getJsonRow(item)

    param.push(data)
  })

  console.log(param, 'param')

  return commonExecuteApi({ queryId: 'SAFAB0020_save05', list: param })
}

// 삭제 손실비용
const CostCheckDel = () => {
  let checkedRow = grdDetail.value.getGridView().getCheckedRows()
  if (checkedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  return true
}

const CostDeleteData = () => {
  let param = []
  let checkedRow = grdDetail.value.getGridView().getCheckedRows()
  checkedRow.forEach((item) => {
    let data = grdDetail.value.getDataProvider().getJsonRow(item)

    param.push(data)
  })

  console.log(param, 'param')

  return commonExecuteApi({ queryId: 'SAFAB0020_delete01', list: param })
}
// 위험성 재평가 watch
watch(
  () => Popdata.WIHEOM_YN,
  (newValue) => {
    if (newValue == 'N') {
      WRK_STD_NMNot.value = true
      // Popdata.WIHEOM_DESC = ''
      // Popdata.WRK_STD_NEW = "Y"
    } else {
      WRK_STD_NMNot.value = false
      Popdata.WRK_STD_NEW = ''
    }
  }
)

// 신규작성 watch

// 신규작성 watch
watch(
  () => Popdata.WRK_STD_NEW,
  (newValue) => {
    if (Popdata.WRK_STD_NEW == 'N') {
      Popdata.WRK_STD_NM = ''
      Popdata.WRK_STD_NO = ''
      Popdata.workStandardNo = ''
      Popdata.workStandardID = ''
      Popdata.WIHEOM_YN = 'Y'
    } else if (Popdata.WRK_STD_NEW == 'Y' && !isSearchST.value) {
      commonSearchApi({
        queryId: 'GET_WORK_STANDARD_NO',
        param: { DEPT_CD: Popdata.INJR_DEPT_CD },
      }).then((res) => {
        console.log('asdasdasd', res)
        Popdata.WRK_STD_NM = '신규작성필요'
        Popdata.WRK_STD_NO = `${res.OUT_DATA}-01`
        Popdata.workStandardNo = res.OUT_DATA
        Popdata.workStandardID = `${res.OUT_DATA}-01`
        Popdata.WIHEOM_YN = 'N'
      })
    }
  }
)
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

watch(
  () => fileUpload1.value,
  (newValue) => {
    if (newValue !== null && newValue !== '' && newValue !== undefined) {
      checkFileId()
    }
  }
)

watch(
  () => JINSUL.value,
  (newValue) => {
    if (newValue !== null && newValue !== '' && newValue !== undefined) {
      checkFileIdJINSUL()
    }
  }
)

//  진술 파일 업로드
const checkFileIdJINSUL = () => {
  console.log('업로드 ')
  if (Popdata.JINSUL_FILE_ID === null || Popdata.JINSUL_FILE_ID === undefined) {
    JINSUL.value.setGuid()
    Popdata.JINSUL_FILE_ID = JINSUL.value.guid
    console.log('JINSUL.value ', JINSUL.value)
    JINSUL.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    JINSUL.value.setGuid(Popdata.JINSUL_FILE_ID)
    Popdata.JINSUL_FILE_ID = JINSUL.value.guid
    console.log('JINSUL.valueㅇㅇㅇ ', JINSUL.value)
    JINSUL.value.onButtonsClick({ id: 'btnSearch' })
  }
}

const JINSULUploaded = (e) => {
  let param = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      JINSUL_CANT_CHK: Popdata.JINSUL_CANT_CHK,
      JINSUL_CANT_DESC: Popdata.JINSUL_CANT_DESC,
      JINSUL_FILE_ID: Popdata.JINSUL_FILE_ID,
      JINSUL_FILE_ID2: Popdata.JINSUL_FILE_ID2,
      JINSUL_FILE_ID3: Popdata.JINSUL_FILE_ID3,
    },
  ]

  console.log(param, 'paramw진술서 업44444로드')

  return commonExecuteApi({ queryId: 'SAFAB0020_save06', list: param })
}

watch(
  () => Popdata.JINSUL_CANT_CHK,
  (newValue) => {
    if (newValue == null || newValue == '' || newValue == undefined) {
      Popdata.JINSUL_CANT_CHK = 'N'
    }
    if (newValue == 'Y') {
      JINSUL.value.diableFileUploadButton([
        'btnFileUpload',
        'btnDownLoad',
        'btnDelete',
      ])
      gan.value.diableFileUploadButton([
        'btnFileUpload',
        'btnDownLoad',
        'btnDelete',
      ])
      mok.value.diableFileUploadButton([
        'btnFileUpload',
        'btnDownLoad',
        'btnDelete',
      ])
      JINSUL_CANT.value = false
      JINSUL_CANTBTN.value = true
      console.log('hgmhlk')
    }
    if (newValue == 'N') {
      JINSUL.value.enableFileUploadButton([
        'btnFileUpload',
        'btnDownLoad',
        'btnDelete',
      ])
      gan.value.enableFileUploadButton([
        'btnFileUpload',
        'btnDownLoad',
        'btnDelete',
      ])
      mok.value.enableFileUploadButton([
        'btnFileUpload',
        'btnDownLoad',
        'btnDelete',
      ])
      JINSUL_CANT.value = true
      Popdata.JINSUL_CANT_DESC = ''
      JINSUL_CANTBTN.value = false
    }
  }
)

// 진술서 양식받기
const JINSULYoungSick = () => {
  let params = {
    FILE_PATH: 'SAFA',
    FILE_NAME: '진술서.xlsx',
  }
  commonSampleDownFilesApi(params)
}

// 지연 사유
// 지연사유 저장
// 인원검색 팝업
const empPopupOpen = () => {
  if (!LATEReadonly.value) {
    empPopup.value.openPopup({ EMP_NM: Popdata.LATE_USER_IDM })
  }
}
// 인원 검색 선택
const selectedemp = (row) => {
  console.log(row)
  Popdata.LATE_USER_IDM = row.EMP_NM
  Popdata.LATE_USER_ID = row.EMP_NO
}

const LATECheck = () => {
  console.log(isLATE.value, 'isLate')

  if (isLATE.value) {
    if (!Popdata.LATE_USER_IDM) {
      Message.warn(t('작성자는 필수 입력입니다.'))
      return false
    }
    if (!Popdata.LATE_DT) {
      Message.warn(t('작성일시는 필수 입력입니다.'))
      return false
    }
    if (!Popdata.LATE_TIME) {
      Message.warn(t('작성 시간은 필수 입력입니다.'))
      return false
    }
    if (!Popdata.LATE_RSN) {
      Message.warn(t('지연사유는 필수입력입니다.'))
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
      LATE_DT: Popdata.LATE_DT ? Popdata.LATE_DT.replace(/-/g, '') : '',
      LATE_TIME: Popdata.LATE_DT ? Popdata.LATE_TIME.replace(/:/g, '') : '',
    },
  ]

  console.log('hihiasdasd', param)

  return commonExecuteApi({ queryId: 'SAFAB0020_save07', list: param })
}

// 지연사유 삭제
const LATECheckDel = () => {
  return true
}

const LATEDeleteData = () => {
  let param = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
    },
  ]

  console.log('삭제')
  return commonExecuteApi({ queryId: 'SAFAB0020_delete06', list: param })
}

// 지연사유 watch
// watch(
//   () => Popdata.LATE_TYPE,
//   (newValue) => {
//     if (newValue == "1") {
//       LATEReadonly.value = true
//       Popdata.LATE_USER_IDM = ""
//       Popdata.LATE_USER_ID = ""
//       Popdata.LATE_DT = ""
//       Popdata.LATE_TIME = ""
//       Popdata.LATE_RSN = ""
//       Popdata.AMBUL_NOT_DESC = ""
//       Popdata.AMBUL_NOT_RSN = ""
//       Popdata.AMBUL_NOT_PLN = ""
//     } else {
//       LATEReadonly.value = false
//       Popdata.AMBUL_NOT_DESC = Popdata.SAGO_GAEYO
//     }
//   }
// )

// 구급차 이벤트

// 구급차 저장
// const GUGUPCheck = () => {
//   if (Popdata.GUGUP_USE == 'O') {
//     Message.warn(t('구급차 이용 한 인원입니다. 저장하실수 없습니다.'))
//     return false
//   }

//   return true
// }

// const GUGUPaveData = () => {
//   let param = [
//     {
//       CMPNY_DIV: Popdata.CMPNY_DIV,
//       SAGO_SN: Popdata.SAGO_SN,
//       AMBUL_NOT_DESC: Popdata.AMBUL_NOT_DESC,
//       AMBUL_NOT_RSN: Popdata.AMBUL_NOT_RSN,
//       AMBUL_NOT_PLN: Popdata.AMBUL_NOT_PLN,
//     },
//   ]

//   console.log('구급차', param)

//   return commonExecuteApi({ queryId: 'SAFAB0020_save08', list: param })
// }

// 구급차 삭제

// const GUGUPCheckDel = () => {
//   return true
// }
// const GUGUPDeleteData = () => {
//   let param = [
//     {
//       CMPNY_DIV: Popdata.CMPNY_DIV,
//       SAGO_SN: Popdata.SAGO_SN,
//     },
//   ]

//   console.log('구급차')
//   return commonExecuteApi({ queryId: 'SAFAB0020_delete07', list: param })
// }

//  watch 모음집
watch(
  () => props.popupParam,
  (newValue) => {
    for (let i in props.popupParam) {
      Popdata[i] = props.popupParam[i]
    }
    if (Popdata.OCCUR_TIME) {
      const hours = Popdata.OCCUR_TIME.substring(0, 2)
      const minutes = Popdata.OCCUR_TIME.substring(2)
      Popdata.OCCUR_TIME = `${hours}:${minutes}`
    }
    
    if(Popdata.SAGO_TYPE_CD){
      SAGOORGTYPE.value = Popdata.SAGO_TYPE_CD
    }
    else{
      SAGOORGTYPE.value = null
    }
    if (Popdata.OCCUR_DT) {
      Popdata.OCCUR_DT = dayjs(Popdata.OCCUR_DT).format('YYYY-MM-DD')
    }
    // if (Popdata.SAGO_RCV_DT) {
    //   Popdata.SAGO_RCV_DT = dayjs(Popdata.SAGO_RCV_DT).format('YYYY-MM-DD')
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

    SagoSearch()
    checkFileId()
    console.log('뭔가가일어남')
    LostCostSearch()

    if (Popdata.LATE_TIME) {
      const hours = Popdata.LATE_TIME.substring(0, 2)
      const minutes = Popdata.LATE_TIME.substring(2)
      Popdata.LATE_TIME = `${hours}:${minutes}`
    }

    if (Popdata.OCCUR_DT) {
      Popdata.OCCUR_DT = dayjs(Popdata.OCCUR_DT).format('YYYY-MM-DD')
    }

    if (Popdata.LATE_DT) {
      Popdata.LATE_DT = dayjs(Popdata.LATE_DT).format('YYYY-MM-DD')
    }
    // if (Popdata.SAGO_RCV_DT) {
    //   Popdata.SAGO_RCV_DT = dayjs(Popdata.SAGO_RCV_DT).format('YYYY-MM-DD')
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

    if (!Popdata.LATE_TYPE) {
      Popdata.LATE_TYPE = '0'
    }
  }
)

//  종결시 disable
watch(
  () => Popdata.APPROVAL_STATUS,
  (newValue) => {
    if (newValue == '종결') {
      vm.$nextTick(() => {
        endCheck.value = true
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
        // 재해자 및 관리감독자 진술서
        GridTitle4.value.disableBtn('btnUpdate', true)
        GridTitle4.value.disableBtn('btnDelete', true)
        // 지연/미이행 사유
        // GridTitle5.value.disableBtn('btnUpdate', true)
        // GridTitle5.value.disableBtn("btnDelete", true)
        // 구급차 미이용 경위서
        // GridTitle6.value.disableBtn('btnUpdate', true)
        // GridTitle6.value.disableBtn("btnDelete", true)
        // 산재
        GridTitle7.value.disableBtn('btnSearch', true)
        GridTitle7.value.disableBtn('btnUpdate2', true)
        // GridTitle7.value.disableBtn("btnDelete2", true)
        // 사고관리
        GridTitle7.value.disableBtn('btnUpdate', true)
  
        NOEdit.value = true
        CancelCompletebtn.value = false
        // 파일업로드
        let disableBtn = ['btnFileUpload', 'btnDelete']
        JINSUL.value.diableFileUploadButton(disableBtn)
      })
    }
    if (newValue == '즉보안전확인 완료') {
      CompleteSendbtn.value = false
      CancelWritebtn.value = true
      SafetyCheckbtn.value = true
      Completebtn.value = true
      CancelCompletebtn.value = true
      CancelSafety.value = true
    }
    if (newValue === '보고서 작성 완료') {
      CompleteSendbtn.value = true
      CancelWritebtn.value = false
      SafetyCheckbtn.value = false
      Completebtn.value = true
      CancelCompletebtn.value = true
      CancelSafety.value = true
    }

    if (newValue == '보고서 안전확인 완료') {
      CompleteSendbtn.value = true
      CancelWritebtn.value = true
      SafetyCheckbtn.value = true
      Completebtn.value = false
      CancelCompletebtn.value = false
      CancelSafety.value = false
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
        // 재해자 및 관리감독자 진술서
        GridTitle4.value.disableBtn('btnUpdate', true)
        GridTitle4.value.disableBtn('btnDelete', true)
        // 지연/미이행 사유
        // GridTitle5.value.disableBtn('btnUpdate', true)
        // GridTitle5.value.disableBtn("btnDelete", true)
        // 구급차 미이용 경위서
        // GridTitle6.value.disableBtn('btnUpdate', true)
        // GridTitle6.value.disableBtn("btnDelete", true)
        // 산재
        GridTitle7.value.disableBtn('btnSearch', true)
        GridTitle7.value.disableBtn('btnUpdate2', true)
        // GridTitle7.value.disableBtn("btnDelete2", true)


        // 파일업로드
        let disableBtn = ['btnFileUpload', 'btnDelete']
        JINSUL.value.diableFileUploadButton(disableBtn)
        JINSUL_CANT.value = true
        NOEdit.value = true
      })
    }
  }
)

const WORKIDOpen = () => {
  WWRKIDPopUp.value.openPopup(empNoWrkID.value)
  console.log('hmhkㅁㄴㅇㅁㄴㅇㅁㄴㅇ')
}
const selectedWRKID = (row) => {
  Popdata.WORK_ID = row.WORK_ID
  Popdata.WORK_TITLE = row.WORK_TITLE
}

watch(
  () => Popdata.COME_SERIOUS_YN,
  (newValue) => {
    console.log(newValue, 'nee')
    if (newValue == 'Y' || newValue == 'S') {
      if (newValue == 'S') {
        Popdata.JUNGDAE_YN = 'Y'
      }
      RCAUpload.value = true
      GridTitle3.value.disableBtn('btnSetRCA', false)
    } else {
      RCAUpload.value = false
      GridTitle3.value.disableBtn('btnSetRCA', true)
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
//  RCA 파일 업로드
const checkFileIdRCA = () => {
  console.log('업로드 ')
  if (Popdata.RCA_FILE_ID === null || Popdata.RCA_FILE_ID === undefined) {
    fileUpload.value.setGuid()
    Popdata.RCA_FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(Popdata.RCA_FILE_ID)
    Popdata.RCA_FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }
}

// 조사표

watch(
  () => [joUpload.value, injuSahang.value],
  ([newValue, newValue2]) => {
    if (newValue2 === null || newValue2 === '' || newValue2 === undefined || newValue2.length === 0) {
      isInjuSahang.value = true
    }

    if (
      newValue !== null &&
      newValue !== '' &&
      newValue !== undefined &&
      newValue2 !== null &&
      newValue2 !== '' &&
      newValue2 !== undefined 
    ) {
      checkFilejoUp()
      isInjuSahang.value = false
    }
  }
)

//  파일관련 메소드
const checkFilejoUp = async () => {
  if (
    injuSahang.value.RPT_FILE_ID === null ||
    injuSahang.value.RPT_FILE_ID === undefined
  ) {
    joUpload.value.setGuid()
    injuSahang.value.RPT_FILE_ID = joUpload.value.guid
    joUpload.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    joUpload.value.setGuid(injuSahang.value.RPT_FILE_ID)
    injuSahang.value.RPT_FILE_ID = joUpload.value.guid

    joUpload.value.onButtonsClick({ id: 'btnSearch' })

    console.log(joUpload.value)
    // if (joUpload.value.cherckGridDataLength() !== 0) {
    //   isUpload.value = true
    // } else {
    //   isUpload.value = false
    // }
  }
}

const joUploaded = () => {
  isUpload.value = true
  let param = [
    {
      CMPNY_DIV: injuSahang.value.CMPNY_DIV,
      SAGO_SN: injuSahang.value.SAGO_SN,
      SEQ: injuSahang.value.SEQ,
      RPT_FILE_ID: injuSahang.value.RPT_FILE_ID,
    },
  ]
  commonExecuteApi({ queryId: 'SAFAB0010_save01', list: param })
}

const joLengthcheck = (e) => {
  if (e !== 0) {
    isUpload.value = true
  } else {
    isUpload.value = false
  }

}

const JHEJALength = (e) =>{
  console.log(e,'e')
  if (e !== 0) {
    isUpload1.value = true
  } else {
    isUpload1.value = false
  }

}

const MOKLength = (e) =>{
  console.log(e,'e')
  if (e !== 0) {
    isUpload2.value = true
  } else {
    isUpload2.value = false
  }
}

const GANLength = (e) =>{
  console.log(e,'e')
  if (e !== 0) {
    isUpload3.value = true
  } else {
    isUpload3.value = false
  }
}
// 진단서

watch(
  () => [jinUpload.value, injuSahang.value],
  ([newValue, newValue2]) => {
    if (
      newValue !== null &&
      newValue !== '' &&
      newValue !== undefined &&
      newValue2 !== null &&
      newValue2 !== '' &&
      newValue2 !== undefined
    ) {
      checkFilejinUp()
    }
  }
)

//  파일관련 메소드
const checkFilejinUp = async () => {
  if (
    injuSahang.value.GINDANS_FILE_ID === null ||
    injuSahang.value.GINDANS_FILE_ID === undefined
  ) {
    jinUpload.value.setGuid()
    injuSahang.value.GINDANS_FILE_ID = jinUpload.value.guid
    await jinUpload.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때

    jinUpload.value.setGuid(injuSahang.value.GINDANS_FILE_ID)
    injuSahang.value.GINDANS_FILE_ID = jinUpload.value.guid
    await jinUpload.value.onButtonsClick({ id: 'btnSearch' })
    // if (jinUpload.value.cherckGridDataLength() !== 0) {
    //   isJinUpload.value = true
    // } else {
    //   isJinUpload.value = false
    // }
  }
}

// 진단서

const jinUploaded = () => {
  isJinUpload.value = true
  let param = [
    {
      CMPNY_DIV: injuSahang.value.CMPNY_DIV,
      SAGO_SN: injuSahang.value.SAGO_SN,
      SEQ: injuSahang.value.SEQ,
      GINDANS_FILE_ID: injuSahang.value.GINDANS_FILE_ID,
      JINDAN_CD: injuSahang.value.JINDAN_CD,
    },
  ]
  commonExecuteApi({ queryId: 'SAFAB0020_save24', list: param })
}

const jinLengthcheck = (e) => {
  if (e !== 0) {
    isJinUpload.value = true
  } else {
    isJinUpload.value = false
  }
}
const drop = (e) => {
  if (!NOEdit.value) {
    files.value = e.dataTransfer.files
  }
}
// 구급차
// watch(
//   () => isGU.value,
//   (newValue) => {
//     if (newValue) {
//       if (Popdata.GUGUP_USE == 'O') {
//         Message.warn(t('구급차 이용 한 인원입니다.'))
//         return (isGU.value = true)
//       }
//       GridTitle6.value.disableBtn('btnUpdate', false)
//       GridTitle6.value.disableBtn('btnDelete', false)
//     } else {
//       GridTitle6.value.disableBtn('btnDelete', true)
//     }
//   }
// )
// watch(
//   () => isLATE.value,
//   (newValue) => {
//     if (newValue) {
//       GridTitle5.value.disableBtn('btnUpdate', false)
//       // GridTitle5.value.disableBtn("btnDelete", false)
//     } else {
//       // GridTitle5.value.disableBtn("btnDelete", true)
//       Popdata.LATE_USER_IDM = ''
//       Popdata.LATE_USER_ID = ''
//       Popdata.LATE_DT = ''
//       Popdata.LATE_TIME = ''
//       Popdata.LATE_RSN = ''
//     }
//   }
// )

// 산재불인정
watch(
  () => isBull.value,
  (newValue) => {
    if (newValue) {
      Popdata.SAGO_NM = 'Y'
      GridTitle7.value.disableBtn('btnSearch', false)
      GridTitle7.value.disableBtn('btnUpdate2', false)
      // GridTitle7.value.disableBtn("btnDelete2", false)
    } else {
      Popdata.SAGO_NM = 'N'
      GridTitle7.value.disableBtn('btnSearch', true)
      GridTitle7.value.disableBtn('btnUpdate2', true)
      // GridTitle7.value.disableBtn("btnDelete2", true)
    }
  }
)

// 산재불인정 저장

const SanBulCheck = () => {
  if (!injuSahang.value.SEQ) {
    Message.warn(t('저장되지않은 인적현황은 저장하실수 없습니다.'))
    return false
  }

  if (!isBull.value) {
    return true
  }

  if (isBull.value) {
    if (!bullinjung.value.REQUEST_DETAILS) {
      Message.warn(t('산재요청 경위는 필수입력입니다.'))
      return false
    }

    if (!bullinjung.value.STATUS) {
      Message.warn(t('경과 및 현재상태는 필수입력입니다.'))
      return false
    }

    if (!bullinjung.value.COMMENTS) {
      Message.warn(t('부서의견은 필수입력입니다.'))
      return false
    }
  }

  return true
}

const SanBulData = () => {
  let param = [
    {
      CMPNY_DIV: injuSahang.value.CMPNY_DIV,
      SAGO_SN: injuSahang.value.SAGO_SN,
      SEQ: injuSahang.value.SEQ,
      REQUEST_DETAILS: bullinjung.value.REQUEST_DETAILS,
      STATUS: bullinjung.value.STATUS,
      COMMENTS: bullinjung.value.COMMENTS,
      ETC: bullinjung.value.ETC,
      JUDGE_REVIEW: bullinjung.value.JUDGE_REVIEW,
    },
  ]

  return commonExecuteApi({ queryId: 'SAFAB0020_save04', list: param })
}

const SanBulDelChek = () => {
  if (!injuSahang.value.SEQ) {
    Message.warn(t('저장되지않은 인적현황은 저장하실수 없습니다.'))
    return false
  }
  return true
}

// 산재불인정 삭제
const SanBulDel = () => {
  let param = [
    {
      CMPNY_DIV: injuSahang.value.CMPNY_DIV,
      SAGO_SN: injuSahang.value.SAGO_SN,
      SEQ: injuSahang.value.SEQ,
    },
  ]

  return commonExecuteApi({ queryId: 'SAFAB0020_delete05', list: param })
}


const plescroll = ref('')
const jecroll = ref('')
const jinscroll = ref('')
const sagoscroll = ref('')

const scrollToSection = (sectionId) => {
  // const bigbro = document.querySelector(`#scrollTaget`)

  // const tt = document.querySelector(`#${sectionId}`).getBoundingClientRect().top
  // console.log(tt, "ttasdasdt")
  document
    .getElementById(sectionId)
    .scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(
  () => gan.value,
  (newValue) => {
    if (newValue !== null && newValue !== '' && newValue !== undefined) {
      checkFileIdgan()
    }
  }
)

//  관리감독자 파일 업로드
const checkFileIdgan = () => {
  console.log('업로드 ')
  if (
    Popdata.JINSUL_FILE_ID2 === null ||
    Popdata.JINSUL_FILE_ID2 === undefined
  ) {
    gan.value.setGuid()
    Popdata.JINSUL_FILE_ID2 = gan.value.guid
    console.log('JINSUL.value ', gan.value)
    gan.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    gan.value.setGuid(Popdata.JINSUL_FILE_ID2)
    Popdata.JINSUL_FILE_ID2 = gan.value.guid
    console.log('JINSUL.valueㅇㅇㅇ ', gan.value)
    gan.value.onButtonsClick({ id: 'btnSearch' })
  }
}

watch(
  () => mok.value,
  (newValue) => {
    if (newValue !== null && newValue !== '' && newValue !== undefined) {
      checkFileIdmok()
    }
  }
)

//  목격자 파일 업로드
const checkFileIdmok = () => {
  console.log('업로드 ')
  if (
    Popdata.JINSUL_FILE_ID3 === null ||
    Popdata.JINSUL_FILE_ID3 === undefined
  ) {
    mok.value.setGuid()
    Popdata.JINSUL_FILE_ID3 = mok.value.guid
    console.log('JINSUL.value ', mok.value)
    mok.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    mok.value.setGuid(Popdata.JINSUL_FILE_ID3)
    Popdata.JINSUL_FILE_ID3 = mok.value.guid
    console.log('JINSUL.valueㅇㅇㅇ ', mok.value)
    mok.value.onButtonsClick({ id: 'btnSearch' })
  }
}

// 작성완료
const CompleteSend = () => {
  SagoSearch()
  
  console.log('작성완료')
  let name = ''
  let SOSOG_DESC = ''
  let sago = `${Popdata.SAGO_DIV_M_NM} `
  let Date = `${dayjs(Popdata.OCCUR_DT).format('YYYY')}년 ${dayjs(
    Popdata.OCCUR_DT
  ).format('MM')}월 ${dayjs(Popdata.OCCUR_DT).format('DD')}일`

  if (Popdata.SFTRP_CM_DT) {
    Message.warn(t('이미 작성완료 된 사안입니다.'))
    return
  }
  if (!saGoCheck()) {
    Message.warn(t('안전 사고 개요가 재대로입력되어있지않습니다.'))
    return
  }

  // 사고형태가 물적 또는 아차인 경우 재해원인 및 예방 대책 필수 입력
  if (Popdata.SAGO_DIV_L === 'E' || Popdata.SAGO_DIV_L === 'D'){
    if (preCheck()){
      Message.warn(t('재해원인 및 예방대책은 필수 입력 입니다.'))
      return ''
    }
  }

  if (!Popdata.SAFE_GAMGR_EMPEMAIL) {
    Message.warn(t('등록된 안전과장의 메일이 없습니다. 확인부탁드립니다.'))
  }
  let lengthgrdTwo = grdTwo.value.getGridView().getItemCount()
  if(lengthgrdTwo === 0){
    Message.warn(t('재해원인 및 예방대책이 입력되지않았습니다.'))
    return
  }

  if(injuSahang.value){
  if(injuSahang.value.SOSOG_DIV_NM ==='직영'){
    if(!isUpload.value){
    Message.warn(t('산업재해 조사표에 첨부된 파일이없습니다.'))
    return
  }
  }
}

  console.log(isUpload2.value,isUpload3.value,isUpload1.value)
  console.log(Popdata.JINSUL_CANT_CHK,'Popdata.JINSUL_CANT_CHK')
  if(Popdata.JINSUL_CANT_CHK !=='Y'){
    if(!isUpload1.value){
    Message.warn(t('재해자 진술서에 첨부된 파일이 없습니다.'))
    return
  }

  if(!isUpload3.value){
    Message.warn(t('관리감독자 진술서에 첨부된 파일이 없습니다.'))
    return
  }
  if(!isUpload2.value){
    Message.warn(t('목격자 진술서에 첨부된 파일이 없습니다.'))
    return
  }
  }
  else{
    if(!Popdata.JINSUL_CANT_DESC){
      Message.warn(t('진술서 작성불가 사유를 입력해주십시오.'))
    return
    }
  }
  console.log('dmddk')
  


  if (injuSahang.value) {
    name = injuSahang.value.NAME ? injuSahang.value.NAME : ''
    SOSOG_DESC = injuSahang.value.SOSOG_DESC ? injuSahang.value.SOSOG_DESC : ''
  }
  vm.$swal({
    title: t('작성완료 요청 하시겠습니까? <br> ※주의 <br> 팝업창이 닫힙니다.'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      let saveParams = []
      Popdata.SFTRP_CM_DT = dayjs().format('YYYYMMDD')
      Popdata.SFTRP_CM_EMP = userStore.empNo
      Popdata.GBN = '0'

      saveParams.push(Popdata)

      // 저장
      commonExecuteApi({ queryId: 'SAFAB0020_save26', list: saveParams })
        .then((res) => {
          if (Popdata.SAFE_GAMGR_HNO) {
            Popdata.SAFE_GAMGR_HNO = Popdata.SAFE_GAMGR_HNO.replace(/-/g, '')
          }

          //SMS 발송
          let sendSMSParams = {
            EMPNO_FROM: sagoEmpNo, // 김성일 매니저
            EMPNO_TO: Popdata.SAFE_GAMGR_EMP,
            SYSCODE: '156',
            FROM_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
            TO_P_NO: Popdata.SAFE_GAMGR_HNO,
            TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전사고 보고서가 작성완료되었습니다. 안전확인바랍니다 . `,
          }

          commonSendSMS(sendSMSParams)

          // 메일 발송
          if(Popdata.SAFE_GAMGR_EMPEMAIL){

            mailParams.EMAIL = [Popdata.SAFE_GAMGR_EMPEMAIL]
            mailParams.SUBJECT = '사고 보고서 작성완료건'
            mailParams.CONTENT = `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전사고 보고서가 작성완료되었습니다. 안전확인바랍니다 .`
            commonSendApi(mailParams).then((res) => {
              Message.success(t('메일이 전송되었습니다.'))
            })
          }
          else{
                Message.warn(t('등록된 안전과장의 메일이 없습니다. 확인부탁드립니다.'))
              }
            
          // 사고관리
       
          // 산재불인정

          //  사고개요
          saGosaveData()
          //  재해원인 및 예방대책
          saveData()
          //  손실비용
          if (CostMoney.value != 0) {
            CostSaveData()
          }
  
          // 지연
          // if (isLATE.value) {
          //   LATESaveData()
          // }
          // 구급차
          // if (isGU.value) {
          //   GUGUPaveData()
          // }
          if (injuSahang.value) {
            if (isBull.value) {
              SanBulData()
            } else if (!isBull.value) {
              SanBulDel()
            }
          }
          // 산재불인정


          // Hi-Standard 개정 필요 시
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




          emit('close')
        })
        .catch((err) => {
          console.log(err, ';;;err')
        })
    }
  })
}

// 작성완료 취소

const CancelWrite = () => {
  if (!Popdata.SFTRP_CM_DT) {
    return Message.warn(t('작성완료 후 이용해주시기 바랍니다.'))
  }
  if (Popdata.SFTRP_CNFRM_DT) {
    return Message.warn(t('이미 안전확인 된 사항입니다.'))
  }
  vm.$swal({
    title: t('작성취소 요청 하시겠습니까? <br> ※주의 <br> 팝업창이 닫힙니다.'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      Popdata.GBN = '1'
      let saveParams = []
      saveParams.push(Popdata)

      // 메일 발송

      commonExecuteApi({ queryId: 'SAFAB0020_save26', list: saveParams }).then(
        (res) => {
          emit('close')
        }
      )
    }
  })
}

// 안전확인

const SafetyCheck = () => {
  vm.$swal({
    title: t('안전확인 하시겠습니까? <br> ※주의 <br> 팝업창이 닫힙니다.'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
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
      if (!Popdata.SFTRP_CM_DT) {
        return Message.warn(t('작성완료 후 이용해주시기 바랍니다.'))
      }

      if (Popdata.SFTRP_CNFRM_DT) {
        return Message.warn(t('이미 안전확인이 되어있습니다.'))
      }
      let saveParams = []

      Popdata.SFTRP_CNFRM_DT = dayjs().format('YYYYMMDD')
      Popdata.SFTRP_CNFRM_EMP = userStore.empNo
      Popdata.GBN = '0'

      saveParams.push(Popdata)
      console.log(Popdata.RESP_DEPT_CD, 'Popdata.RESP_DEPT')
      //  .책임부서 구하기
      let mail = ''
      let hno = ''
      let empno = ''

      // 메일 발송
      if (Popdata.SAFE_GAMGR_HNO) {
        Popdata.SAFE_GAMGR_HNO = Popdata.SAFE_GAMGR_HNO.replace(/-/g, '')
      }

      commonExecuteApi({ queryId: 'SAFAB0020_save27', list: saveParams }).then(
        (res) => {
          commonSearchApi({
            queryId: 'SAFAB0010_search04',
            param: {
              CMPNY_DIV: Popdata.CMPNY_DIV,
              DEPT_CD: Popdata.RESP_DEPT_CD,
            },
          }).then((res) => {
            console.log('resTEstEMP:', res)
            if (res.ORESULT_CUR.length !== 0) {
              mail = res.ORESULT_CUR[0].EMAIL
              if (res.ORESULT_CUR[0].HND_PHN) {
                hno = res.ORESULT_CUR[0].HND_PHN.replace(/-/g, '')
              }
              empno = res.ORESULT_CUR[0].EMP_NO
              let number = [hno, Popdata.SAFE_GAMGR_HNO]
              let empnoList = [empno, Popdata.SAFE_GAMGR_EMP]
              for (let i in number) {
                let sendSMSParams = {
                  EMPNO_FROM: sagoEmpNo, // 김성일 매니저
                  EMPNO_TO: empnoList[i],
                  SYSCODE: '156',
                  FROM_P_NO: Popdata.SAGODHND.replace(/-/g, ''),
                  TO_P_NO: number[i],
                  TITLE: `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전사고 보고서 결재바랍니다. `,
                }

                commonSendSMS(sendSMSParams)
              }

              // 메일 발송
              if(Popdata.SAFE_GAMGR_EMPEMAIL && mail){
              mailParams.EMAIL = [mail, Popdata.SAFE_GAMGR_EMPEMAIL]
              mailParams.SUBJECT = '안전사고보고서 결재 필요 안내 '
              mailParams.CONTENT = `${Date} ${SOSOG_DESC} ${name} ${sago} 사고의 안전사고 보고서 결재바랍니다. `
              commonSendApi(mailParams).then((res) => {
                Message.success(t('메일이 전송되었습니다.'))
              })
             }
              emit('close')
            }
            if (res.ORESULT_CUR.length == 0 || !Popdata.SAFE_GAMGR_EMPEMAIL) {
              Message.warn(
                t(
                  '책임부서의 연락처가 없습니다.안전과장 과 책임부서의 부서장에게 개별연락 부탁드립니다.'
                )
              )
              emit('close')
            }
          })
        }
      )
    }
  })
}

const CancelSafetyCheck = () => {
  vm.$swal({
    title: t('안전확인 취소하시겠습니까? <br> ※주의 <br> 팝업창이 닫힙니다.'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      if (!Popdata.SFTRP_CM_DT) {
        return Message.warn(t('작성완료 후 이용해주시기 바랍니다.'))
      }

      if (!Popdata.SFTRP_CNFRM_DT) {
        return Message.warn(t('안전확인 후 이용부탁드립니다.'))
      }
      let saveParams = []

      Popdata.SFTRP_CNFRM_DT = dayjs().format('YYYYMMDD')
      Popdata.SFTRP_CNFRM_EMP = userStore.empNo
      Popdata.GBN = '1'

      saveParams.push(Popdata)

      commonExecuteApi({ queryId: 'SAFAB0020_save27', list: saveParams }).then(
        (res) => {
          emit('close')
        }
      )
    }
  })
}
// 종결
const Complete = () => {
  vm.$swal({
    title: t(
      '종결처리 하시겠습니까? <br> ※주의 <br> 더이상 수정을 하지못합니다.<br> 팝업창이 닫힙니다.'
    ),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      if (!Popdata.SFTRP_CM_DT) {
        return Message.warn(t('작성완료 후 이용해주시기 바랍니다.'))
      }

      if (!Popdata.SFTRP_CNFRM_DT) {
        return Message.warn(t('안전확인 후 이용바랍니다.'))
      }

      if (Popdata.SFTRP_CNCLD_DT) {
        return Message.warn(t('이미 종결처리 되어있습니다.'))
      }
      let saveParams = []

      Popdata.SFTRP_CNCLD_DT = dayjs().format('YYYYMMDD')
      Popdata.SFTRP_CNCLD_EMP = userStore.empNo
      Popdata.GBN = '0'
      saveParams.push(Popdata)

      // 메일 발송

      commonExecuteApi({ queryId: 'SAFAB0020_save28', list: saveParams }).then(
        (res) => {
          emit('close')
        }
      )
    }
  })
}
const CancelComplete = () => {
  vm.$swal({
    title: t('종결취소 하겠습니까?'),
    showCancelButton: true,
  }).then((swalRes) => {
    if (swalRes.isConfirmed === true) {
      if (!Popdata.SFTRP_CM_DT) {
        return Message.warn(t('작성완료 후 이용해주시기 바랍니다.'))
      }

      if (!Popdata.SFTRP_CNFRM_DT) {
        return Message.warn(t('안전확인 후 이용바랍니다.'))
      }

      if (!Popdata.SFTRP_CNCLD_DT) {
        return Message.warn(t('종결 후 이용 바랍니다.'))
      }
      let saveParams = []

      Popdata.SFTRP_CNCLD_DT = dayjs().format('YYYYMMDD')
      Popdata.SFTRP_CNCLD_EMP = userStore.empNo
      Popdata.GBN = '1'
      saveParams.push(Popdata)

      // 메일 발송

      commonExecuteApi({ queryId: 'SAFAB0020_save28', list: saveParams }).then(
        (res) => {
          emit('close')
        }
      )
    }
  })
}
</script>

<template>
  <div class="my-3 d-flex" style="justify-content: space-between">
    <div>
      <v-btn class="scrollBtn" @click="scrollToSection('plescroll')"
        >인적사항 / 안전사고 개요</v-btn
      >
      <v-btn class="scrollBtn" @click="scrollToSection('jecroll')"
        >재해원인 및 예방대책</v-btn
      >
      <v-btn class="scrollBtn" @click="scrollToSection('jinscroll')"
        >진술서</v-btn
      >
      <v-btn class="scrollBtn" @click="scrollToSection('sagoscroll')"
        >사고에 따른 생산 손실</v-btn
      >
    </div>
    <div>
      <v-btn @click="CompleteSend" :disabled="endCheck || CompleteSendbtn" 
        >작성완료</v-btn
      >
      <v-btn @click="CancelWrite" :disabled="endCheck || CancelWritebtn"
        >작성완료 취소</v-btn
      >
      <!-- 사고 모듈 담당자들만 안전확인 및 취소 가능 -->
      <v-btn @click="SafetyCheck"  v-if="userStore.authGrpCd.includes('GRP00381')"
      :disabled="endCheck || SafetyCheckbtn"
        >안전확인</v-btn
      >
      <v-btn @click="CancelSafetyCheck" v-if="userStore.authGrpCd.includes('GRP00381')"
       :disabled="endCheck || CancelSafety"
        >안전확인 취소</v-btn
      >
      <!-- 사고 담당자만 종결 및 종결 취소 가능 -->
      <v-btn @click="Complete" :disabled="endCheck || Completebtn" v-if="userStore.empNo === sagoEmpNo">종결</v-btn>
      <v-btn @click="CancelComplete" :disabled="CancelCompletebtn" v-if="userStore.empNo === sagoEmpNo"
        >종결취소</v-btn
      >
    </div>
  </div>

  <v-card class="h-full">
    <!-- 인적사항 -->

    <v-card-text class="wrap">
      <v-card class="mb-3 mr-1 popUp-input-Form" id="plescroll">
        <v-card-title class="pa-0">
          <IGridTitle
            ref="GridTitle1"
            :title="$t('인적사항 현황')"
            :button-list="['btnCreate', 'btnDelete']"
            @click-button="onButtonsClick($event.id, '인적사항현황')"
          >
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 160px"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
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
            <template #editors />
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
                :label="$t('')"
                type="Text"
                width="200px"
                margin="10px"
                v-model="Popdata.SAGO_LOC_DTL"
              />
            </div>
            <div class="d-flex">
              <i-input
                top-label
                :label="$t('재해부서/협력사')"
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
                  :label="$t('재해부서/협력사')"
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

              <i-input
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
              />
            </div>

            <div class="d-flex mb-3">
              <i-textarea
                label-width="120px"
                top-label
                :label="$t('사고 개요')"
                required
                v-model="Popdata.SAGO_GAEYO"
                width="100%"
              />
            </div>

            <!-- 재해조직/ 책임조직 /안전과장 -->
            <span><h3>재해/책임조직 정보</h3></span>
            <div class="d-flex mt-3 mb-3">
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
          <span><h3>기타 정보</h3></span>
          <div class="d-flex mt-3 mb-3">
            <div>
              <p style="color: #222">{{ $t('사고처리 구분') }}</p>
              <v-radio-group
                inline
                v-model="Popdata.SAGO_TYPE_CD"
                class="radio-box"
                :disabled="
                  Popdata.SAGO_DIV_L === 'E' || Popdata.SAGO_DIV_L === 'D'
                "
              >
                <v-radio label="산재(직영/협력사)" value="SJE"></v-radio>
                <v-radio label="경미공상(직영)" value="GMS"></v-radio>
                <v-radio
                  label="휴업 3일 이상 사고(협력사)"
                  value="HRS"
                ></v-radio>
                <v-radio
                  label="휴업 3일 미만 일반사고 (직영/협력사)"
                  value="SNE"
                ></v-radio>
              </v-radio-group>
            </div>

            <div style="margin: 0 12px">
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
            <div>
              <p style="color: #222">{{ $t('재해 소속') }}</p>
              <v-radio-group
                inline
                v-model="Popdata.FORM_DIV"
                class="radio-box"
              >
                <v-radio label="직영" value="J"></v-radio>
                <v-radio label="협력사" value="H"></v-radio>
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
            <i-select
              top-label
              :label="$t('구급차이용 여부')"
              type="Text"
              :disabled="
                  Popdata.SAGO_DIV_L === 'E' || Popdata.SAGO_DIV_L === 'D'
                "
              width="120px"
              margin="10px"
              v-model="Popdata.GUGUP_USE"
              :items="codeList.GUGUP_USE"
              item-value="COD"
              item-title="TXT"
              required
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

          <!-- 작업지시서/ 작업표쥰 -->
          <div class="d-flex">
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
              top-label
              :label="$t('작업표준')"
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

            <v-checkbox
              style="margin-top: 23px"
              top-label
              v-model="Popdata.WRK_STD_NEW"
              true-value="Y"
              false-value="N"
              :label="$t('신규작성필요')"
            />
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
          </div>
        </v-card-text>
      </v-card>

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle
            id="jecroll"
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
                :gridOnly="NOEdit"
                ref="fileUpload"
                @uploaded="uploaded"
                style="height: 400px"
              />
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle :title="$t('사고 상황 사진')">
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <IUploadImageMulit
              ref="fileUpload1"
              :fileValue="files"
              :isVisibled="NOEdit"
              :cnt="3"
              @drop.prevent="drop"
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="d-flex mb-3">
        <v-sheet width="50%" class="pa-0 h-auto mr-3">
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
                :gridOnly="isInjuSahang || NOEdit"
                @uploaded="joUploaded($event)"
                @dataLength="joLengthcheck($event)"
                style="height: 400px"
              />
            </div>
          </div>
        </v-sheet>
        <v-sheet width="50%" class="pa-0 h-auto mr-3">
          <div class="d-flex align-center">
            <IGridTitle :title="$t('진단서')" />
            <div class="mr-3">
              <i-select
                v-if="!isInjuSahang && injuSahang"
                :label="$t('진단 :주')"
                type="Text"
                width="180px"
                margin="10px"
                :items="codeList.JINDAN_CD"
                item-value="COD"
                item-title="TXT"
                v-model="injuSahang.JINDAN_CD"
              />
            </div>
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
                ref="jinUpload"
                :gridOnly="isInjuSahang || NOEdit"
                @uploaded="jinUploaded($event)"
                @dataLength="jinLengthcheck($event)"
                style="height: 400px"
              />
            </div>
          </div>
        </v-sheet>
      </div>

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title
          class="pa-0 d-flex"
          style="justify-content: space-between"
        >
          <IGridTitle
            id="jinscroll"
            :title="$t('재해자 및 관리감독자 진술서')"
            ref="jintop"
          >
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0 d-flex" style="justify-content: space-around">
          <div
            style="
              padding: 12px;
              background-color: #fff;
              margin: 12px 0;
              border-radius: 8px;
            "
          >
            <IUpload
              :gridTitle="t('재해자')"
              ref="JINSUL"
              class="fileClass"
              :gridOnly="NOEdit"
              :isVisibled="JINSUL_CANT"
              @uploaded="JINSULUploaded($event)"
              @dataLength='JHEJALength($event)'
            />
          </div>
          <div
            style="
              padding: 12px;
              background-color: #fff;
              margin: 12px 0;
              border-radius: 8px;
            "
          >
            <IUpload
              :gridTitle="t('관리감독자')"
              ref="gan"
              :gridOnly="NOEdit"
              class="fileClass"
              :isVisibled="JINSUL_CANT"
              @uploaded="JINSULUploaded($event)"
              @dataLength='GANLength($event)'
            />
          </div>
          <div
            style="
              padding: 12px;
              background-color: #fff;
              margin: 12px 0;
              border-radius: 8px;
            "
          >
            <IUpload
              :gridTitle="t('목격자 / 기타')"
              ref="mok"
              class="fileClass"
              :gridOnly="NOEdit"
              :isVisibled="JINSUL_CANT"
              @uploaded="JINSULUploaded($event)"
              @dataLength='MOKLength($event)'
            />
          </div>
        </v-card-text>
        <div class="d-flex align-center">
          <v-btn
            @click="JINSULYoungSick"
            class="mx-2"
            :disabled="JINSUL_CANTBTN"
            >양식받기</v-btn
          >
          <v-checkbox
            class="mx-2"
            v-model="Popdata.JINSUL_CANT_CHK"
            label="작성 불가"
          />
          <i-input
            :label="$t('작성불가 사유 입력')"
            v-model="Popdata.JINSUL_CANT_DESC"
            label-width="110px"
            type="Text"
            width="460px"
            :disabled="JINSUL_CANT"
          />
          <v-btn @click="JINSULUploaded()" v-if="JINSUL_CANTBTN">
            작성 불가 사유입력 저장
          </v-btn>
        </div>
      </v-card>

 <!-- <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle
            ref="GridTitle5"
            :title="$t('지연/미이행 사유(육하원칙에의거)')"
            :button-list="['btnUpdate']"
            @click-button="onButtonsClick($event.id, '지연')"
          >
            
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <v-radio-group inline v-model="isLATE" :disabled="NOEdit">
              <v-radio label="해당" :value="true"></v-radio>
              <v-radio label="해당없음" :value="false"></v-radio>
            </v-radio-group>
            <div v-if="isLATE">
              <div class="d-flex align-center">
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
                />
                <i-input
                  top-label
                  :label="$t('')"
                  type="Text"
                  width="80px"
                  v-model="Popdata.LATE_TIME"
                  @change="LATETIME"
                  placeholder="HH:MM"
                />
              </div>

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
        
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <v-radio-group inline v-model="isGU" :disabled="NOEdit">
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
      </v-card>  -->

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle
            ref="GridTitle7"
            :title="$t('산재불인정 부서의견서')"
            :button-list="['btnUpdate2']"
            @click-button="onButtonsClick($event.id, '산재불인정')"
          />
          <!-- 'btnDelete2' -->
        </v-card-title>
        <v-radio-group
          inline
          v-model="isBull"
          v-if="injuSahang"
          :disabled="NOEdit"
        >
          <v-radio label="해당" :value="true"></v-radio>
          <v-radio label="해당없음" :value="false"></v-radio>
        </v-radio-group>

        <p v-if="!injuSahang">인적사항 등록후 이용해주세요.</p>

        <v-col cols="12" v-if="isBull">
          <v-row>
            <VCol cols="12" md="12">
              <i-textarea
                label-width="300px"
                top-label
                :label="$t('산재요청 경위')"
                v-model="bullinjung.REQUEST_DETAILS"
                width="100%"
                required
              />
            </VCol>
          </v-row>

          <v-row>
            <VCol cols="12" md="12">
              <i-textarea
                label-width="300px"
                top-label
                :label="$t('경과 및 현재상태')"
                v-model="bullinjung.STATUS"
                width="100%"
                required
              />
            </VCol>
          </v-row>

          <v-row>
            <VCol cols="12" md="12">
              <i-textarea
                label-width="300px"
                top-label
                :label="$t('부서의견')"
                v-model="bullinjung.COMMENTS"
                width="100%"
                required
              />
            </VCol>
          </v-row>

          <v-row>
            <VCol cols="12" md="12">
              <i-textarea
                label-width="300px"
                top-label
                :label="$t('산재심사시 검토사항')"
                v-model="bullinjung.JUDGE_REVIEW"
                width="100%"
              />
            </VCol>
          </v-row>

          <v-row>
            <VCol cols="12" md="12">
              <i-textarea
                label-width="300px"
                top-label
                :label="$t('기타')"
                v-model="bullinjung.ETC"
                width="100%"
              />
            </VCol>
          </v-row>
        </v-col>
      </v-card>

      <v-card class="mb-3 mt-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle
            id="sagoscroll"
            ref="GridTitle4"
            :title="$t('사고에 따른 생산 손실(비용,시간)')"
            :button-list="['btnUpdate', 'btnDelete']"
            @click-button="onButtonsClick($event.id, '손실')"
          >
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <RealGrid
              ref="grdDetail"
              class="mt-2"
              style="height: 340px"
              :grid-view-option="grdProps3.gridViewOption"
              :keys="grdProps3.keys"
              :fields="grdProps3.fields"
              :columns="grdProps3.columns"
              :column-layout="grdProps3.columnLayout"
            />
          </div>
        </v-card-text>
      </v-card>

    

      <!-- 팝업촌 -->

      <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
      <CommonCodePopUpSAF ref="CausePopup" @selected="onCauseSelected" />

      <SAFAB0020ManPopUp @upDataRow="upDataRow" ref="ManPopUp" />
      <SAFAB0020DisasterPopUp ref="Disaster" @selectedArr="selectedDisaster" />
      <EmpPopup ref="empPopup" @selected="selectedemp" />
      <SAFAB0020WRKID ref="WWRKIDPopUp" @selected="selectedWRKID" />
      <IUploadPopup ref="fileUploadgrd" :fileDan="true" @uploaded="uploaded" />
      <SAFAB0020WRK_STD ref="WRK_STDPopUp" @selected="selectedWRKSTD" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.d-flex {
  margin: 6px 0;
}

.fileDiv {
  width: 420px;
  padding: 12px;
  background: #fff;
}

.radio-box {
  background-color: #fff;
  padding: 3px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
}
.wrap {
  height: calc(100vh - 50px - 66.7px);
  overflow-y: scroll;
  padding: 0px;
}
.sago {
  background: #fff;
  padding: 8px;
  width: 250px;
  border-radius: 12px;
  display: inline-block;
}
.fileClass {
  height: 400px !important;
  width: 560px;
}
.scrollBtn {
  background: #fff !important;
  color: #222 !important;
  border: 1px solid #222 !important; 
}
</style>
