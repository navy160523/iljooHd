<!--     일주지앤에스 SI2팀 김성근    -->
<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 안전사고 등록현황 추가 팝업 (일렉용)   -->

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
  commonSendSMS,
} from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { value } from 'lodash-es'
import Message from '@hiway/utils/notify'
import AcdtPopup from '@/components/popup/AcdtPopup.vue'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'
import LocationPopup from '@/components/popup/LocationPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'

import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import EmpPopup from '@/pages/30_safety/SAF_A/SAFAB0010EMP.vue'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF_ELEC.vue'

import OZReport from '@/components/OZReport.vue'

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow'])
const menuTitle = ref(null)

const dialog = ref(false)
const rskba0010Dialog = ref(false)  // 작업표준 신규제정 > 안전사고 > 팝업으로 호출시

const popEmp = ref()
const fileUpload1 = ref(null)
const fileUpload2 = ref(null)
const fileUpload3 = ref(null)
const empPopup = ref(null)
const isNew = ref(false)
const popupParam = reactive({
  SaveData: {},
})
const codeList = reactive({
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴직' },
    { COD: '4', TXT: '입대' },
  ],
})
const mailParams = reactive({
  EMAIL: [],
  REFERER: [],
  // HIDDEN_REFERER: [],
  SUBJECT: '',
  CONTENT: '',
})
// 공통팝업

const SendMailPopupRef = ref(null)
const deptPopup = ref(null)
const dblclick = ref(false)
// 데이터 바인딩
const ED0010PopUpData = ref({})
const ResData = reactive({})
const saveForms = ref(null)
const SaveData = reactive({})
const DoSave = ref(true)
const fileSave = reactive([])
const readonly1 = ref(true)
const readonly2 = ref(true)
const readonly3 = ref(true)
const GuBunValue = ref(true)
const CCPGuBn = ref('')
const EMAILPushSAFE = ref('')
const EMAILPushCHECK = ref('')
const PhePushCHECK = ref('')
const PhePushSAFE = ref('')
const EMP_NOPushCHECK = ref('')
const files = ref([])

const CCP = ref(null)
//팝업 오픈

const intCode = () => {
  Promise.all([
    getCodeList('HHIB320'), //0
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
    }), // 사업부
  ]).then((res) => {
    console.log(res[0], 'res')
    codeList.GUGUP_USE = res[0].ORESULT_CUR
    codeList.BSNS = res[1].ORESULT_CUR
    if (popupParam.SaveData.OCCUR_TIME) {
      const hours = popupParam.SaveData.OCCUR_TIME.substring(0, 2)
      const minutes = popupParam.SaveData.OCCUR_TIME.substring(2)
      return (popupParam.SaveData.OCCUR_TIME = `${hours}:${minutes}`)
    }
  })
}

//  팝업 관련

const openPopup = (param, dblclickOpen, propDialog) => {

  fileSave.length = 0
  dblclick.value = false

  if (dblclickOpen) {
    dblclick.value = true
  }

  if (param) {
    popupParam.SaveData = param
    
    isNew.value = false
    popupParam.SaveData.INJR_DEPT_CD = param.INJR_DEPT_CD
    popupParam.SaveData.INJR_DEPT_NM = param.INJR_ORGN_FULL_NM
    popupParam.SaveData.OCCUR_DT = popupParam.SaveData.OCCUR_DT
      ? popupParam.SaveData.OCCUR_DT.substring(0, 10).replace('T', '')
      : ''
    vm.$nextTick(() => {
      if (param.APPROVAL_STATUS !== '즉보작성 진행') {
        menuTitle.value.disableBtn('btnUpdate', true)
      }
    })
    console.log('ddmdk')
  } else {
    console.log(userStore, 'userStore')

    popupParam.SaveData = {}
    popupParam.SaveData.CMPNY_DIV = userStore.cmpnyDiv
    popupParam.SaveData.BSNS_CD = userStore.bsnsCd
    popupParam.SaveData.BSNS_CDM = userStore.bsnsNm
    // popupParam.SaveData.INJR_DEPT_NM = userStore.asgnFullNm
    // popupParam.SaveData.INJR_DEPT_CD = userStore.deptCd
    // popupParam.SaveData.RESP_DEPT_NM = userStore.asgnFullNm
    // popupParam.SaveData.RESP_DEPT_CD = userStore.deptCd
    // popupParam.SaveData.RESP_BSNS_CD = userStore.bsnsCd
    // popupParam.SaveData.SAFE_GAMGR_EMPKORNM = userStore.empNm
    // popupParam.SaveData.SAFE_GAMGR_EMP = userStore.empNo
    // popupParam.SaveData.SAFE_GAMGR_DEPT = userStore.asgnNm
    // popupParam.SaveData.SAFE_GAMGR_BSNS = userStore.bsnsNm
    EMAILPushSAFE.value = userStore.email
    PhePushSAFE.value = userStore.hndPhn
    popupParam.SaveData.OCCUR_DT = dayjs().format('YYYY-MM-DD')
    popupParam.SaveData.GUGUP_USE = 'X'
    isNew.value = true
  }

  intCode()

  dialog.value = true

  vm.$nextTick(() => {
    // [김성현 추가] 작업표준 신규제정 > 안전사고 > 더블클릭 팝업으로 화면 호출시 저장/사진업로드 비활성화
    if(propDialog === 'Y')
    {
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false)
      menuTitle.value.setBtnProperty('btnFileUpload', 'visible', false)
      fileUpload1.value.disableButton('btnFileUpload')
    }
  })
}

const locationPopupOpen = () => {
  CCP.value.openPopup('장소')
  CCPGuBn.value = '장소'
}
const acdtOpen = () => {
  CCP.value.openPopup('사고분류')
  CCPGuBn.value = '사고'
}

const deptPopupOpen = (GuBun) => {
  console.log(GuBun)
  if (GuBun == 'INJR') {
    GuBunValue.value = false
  } else GuBunValue.value = true
  deptPopup.value.openPopup()
  console.log(GuBunValue.value)
}

const selectedCOM = (row) => {
  if (CCPGuBn.value === '장소') {
    popupParam.SaveData.SAGO_LOC_LM = row[0].TXT
    popupParam.SaveData.SAGO_LOC_MM = row[1].TXT
    popupParam.SaveData.SAGO_LOC_SM = row[2].TXT

    popupParam.SaveData.SAGO_LOC_L = row[0].COD
    popupParam.SaveData.SAGO_LOC_M = row[1].COD
    popupParam.SaveData.SAGO_LOC_S = row[2].COD
  } else if (CCPGuBn.value === '사고') {
    popupParam.SaveData.SAGO_DIV_L_NM = row[0].TXT
    popupParam.SaveData.SAGO_DIV_M_NM = row[1].TXT
    popupParam.SaveData.SAGO_DIV_S_NM = row[2].TXT

    popupParam.SaveData.SAGO_DIV_L = row[0].COD
    popupParam.SaveData.SAGO_DIV_M = row[1].COD
    popupParam.SaveData.SAGO_DIV_S = row[2].COD

    if(popupParam.SaveData.SAGO_DIV_L === 'E' || popupParam.SaveData.SAGO_DIV_L === 'D'){
      popupParam.SaveData.GUGUP_USE = null
    }
                  
}
}
// 부서팝업 선택

const onDeptSelected = (row) => {
  console.log(row, 'row')
  let str = row.ASGN_FULL_NM.split("-")

  if (!GuBunValue.value) {
    console.log(str)
    popupParam.SaveData.BSNS_CD = row.BSNS_CD
    popupParam.SaveData.BSNS_CDM = row.PART_NM
    popupParam.SaveData.INJR_DEPT_NM = row.ASGN_FULL_NM
    popupParam.SaveData.INJR_DEPT_CD = row.DEPT_CD
    // 책임조직
    popupParam.SaveData.RESP_BSNS_CD = row.BSNS_CD
    popupParam.SaveData.RESP_DEPT_CD = row.DEPT_CD
    popupParam.SaveData.RESP_DEPT_NM = row.ASGN_FULL_NM
    popupParam.SaveData.VNDR_NM = row.ORGN_DIV == 'B' ? row.ASGN_FULL_NM : ''
    popupParam.SaveData.VNDR_CD = row.ORGN_DIV == 'B' ? row.ASGN_CD : ''
  } else {
    console.log(str)

    popupParam.SaveData.RESP_BSNS_CD = row.BSNS_CD
    popupParam.SaveData.RESP_DEPT_CD = row.DEPT_CD
    popupParam.SaveData.RESP_DEPT_NM = row.ASGN_FULL_NM
    popupParam.SaveData.VNDR_NM = row.ORGN_DIV == 'B' ? row.ASGN_FULL_NM : ''
    popupParam.SaveData.VNDR_CD = row.ORGN_DIV == 'B' ? row.ASGN_CD : ''
    console.log(
      popupParam.SaveData.RESP_BSNS_CD,
      'popupParam.SaveData.RESP_BSNS_CD'
    )
    commonSearchApi({
      queryId: 'SAFAB0010_search04',
      param: { CMPNY_DIV: row.CMPNY_DIV, DEPT_CD: row.DEPT_CD },
    }).then((res) => {
      console.log(res, 'res')
      EMAILPushCHECK.value = res.ORESULT_CUR[0].EMAIL
      PhePushCHECK.value = res.ORESULT_CUR[0].HND_PHN
      EMP_NOPushCHECK.value = res.ORESULT_CUR[0].EMP_NO
    })
  }
}
// 인원검색 팝업

const empPopupOpen = (e) => {
  console.log(e, 'e')
  empPopup.value.openPopup({
    // 회사코드가 HHI일 경우는 안전통합부, 일렉일 경우에는 일렉 사업본부를 설정한다. (2024.10.22 kykim)
    BSNS_CD: userStore.cmpnyDiv === 'HHI' ? 'AN00' : 'AW00',
    EMP_NM: popupParam.SaveData.SAFE_GAMGR_EMPKORNM,
  })
}

const selectedemp = (row) => {
  console.log(row, 'row')
  popupParam.SaveData.SAFE_GAMGR_EMPKORNM = row.EMP_NM
  popupParam.SaveData.SAFE_GAMGR_EMP = row.EMP_NO
  let part = row.ASGN_NM.split('-')
  popupParam.SaveData.SAFE_GAMGR_BSNS = part[0]
  popupParam.SaveData.SAFE_GAMGR_DEPT = part[1]

  EMAILPushSAFE.value = row.EMAIL
  PhePushSAFE.value = row.HND_PHN 
}

watch(
  () => fileUpload1.value,
  (newValue) => {
    if (newValue !== null && newValue !== '' && newValue !== undefined) {
      checkFileId()
    }
  }
)

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
  popupParam.SaveData.OCCUR_TIME = formatTimeFromInput(
    popupParam.SaveData.OCCUR_TIME
  )
}

//그리드 셋팅
const grdPopUpProps = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: [],
  fields: [
    {
      fieldName: 'STATUS',
      dataType: 'text',
      header: { text: t('진행상태') },
      lookupDisplay: true,
    },
    {
      fieldName: 'INPUTDTE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('접수일'), editor: { datetimeFormat: 'yyyy-MM-dd' } },
    },
    {
      fieldName: 'FINISHDTE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('완료일'), editor: { datetimeFormat: 'yyyy-MM-dd' } },
    },
    { fieldName: 'ADESC', dataType: 'text', header: { text: t('진료비내용') } },
    { fieldName: 'AMT', dataType: 'text', header: { text: t('금액') } },
    { fieldName: 'HOSPITAL', dataType: 'text', header: { text: t('병원') } },
    { fieldName: 'BANK', dataType: 'text', header: { text: t('은행') } },
  ],
  columns: [],
})

grdPopUpProps.columns = grdPopUpProps.fields

const grdPop1prop = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: ['COMPANY_NM'],
  fields: [
    {
      fieldName: 'COMPANY_NM',
      dataType: 'text',
      header: { text: t('회사구분') },
    },
    {
      fieldName: 'HLD_OFFI_NM',
      dataType: 'text',
      header: { text: t('재직상태') },
    },
    {
      fieldName: 'RETI_TMP_DATE',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      header: { text: t('퇴직일'), editor: { datetimeFormat: 'yyyy-MM-dd' } },
    },
  ],
  columns: [],
})

grdPop1prop.columns = grdPop1prop.fields

//  저장관련

const mainCheck = () => {
  if (!popupParam.SaveData.OCCUR_DT || !popupParam.SaveData.OCCUR_TIME) {
    Message.warn(t(' 발생일시를 입력해주세요.'))
    return false
  }
  if (
    !popupParam.SaveData.SAGO_DIV_L_NM ||
    !popupParam.SaveData.SAGO_DIV_M_NM ||
    !popupParam.SaveData.SAGO_DIV_S_NM
  ) {
    Message.warn(t(' 사고형태를  선택해주세요.'))
    return false
  }
  if (
    !popupParam.SaveData.SAGO_LOC_LM ||
    !popupParam.SaveData.SAGO_LOC_MM ||
    !popupParam.SaveData.SAGO_LOC_SM
  ) {
    Message.warn(t(' 발생장소를 선택해주세요.'))
    return false
  }
  if (!popupParam.SaveData.SAFE_GAMGR_EMP) {
    Message.warn(t('안전과장을 입력해주세요.'))
    return false
  }
  return true
}

const mainSaveData = () => {
  // return uploaded();

  let param = [
    // {
    //   CMPNY_DIV: popupParam.SaveData.CMPNY_DIV,
    //   SAGO_SN: popupParam.SaveData.SAGO_SN,
    //   BSNS_CD: popupParam.SaveData.BSNS_CD,
    //   JEWE_YN: "Y",
    //   JUNGDAE_YN: popupParam.SaveData.JUNGDAE_YN,
    //   SAGO_RCV_DT: popupParam.SaveData.SAGO_RCV_DT,
    //   OCCUR_DT: popupParam.SaveData.OCCUR_DT
    //     ? popupParam.SaveData.OCCUR_DT.replace(/-/g, "")
    //     : "",
    //   OCCUR_TIME: popupParam.SaveData.OCCUR_TIME
    //     ? popupParam.SaveData.OCCUR_TIME.replace(/:/g, "")
    //     : "",
    //   FORM_DIV: popupParam.SaveData.FORM_DIV,
    //   PRNT_SAGO_SN: popupParam.SaveData.PRNT_SAGO_SN,
    //   OPEN_SCOPE: popupParam.SaveData.OPEN_SCOPE,
    //   SAGO_DIV_L: popupParam.SaveData.SAGO_DIV_L,
    //   SAGO_DIV_M: popupParam.SaveData.SAGO_DIV_M,
    //   SAGO_DIV_S: popupParam.SaveData.SAGO_DIV_S,
    //   SAGO_LOC_L: popupParam.SaveData.SAGO_LOC_L,
    //   SAGO_LOC_M: popupParam.SaveData.SAGO_LOC_M,
    //   SAGO_LOC_S: popupParam.SaveData.SAGO_LOC_S,
    //   SAGO_LOC_DTL: popupParam.SaveData.SAGO_LOC_DTL,
    //   RESPON_DIV: popupParam.SaveData.RESPON_DIV,
    //   INJR_ORGN_CD: popupParam.SaveData.INJR_ORGN_CD,
    //   INJR_ORGN_NM: popupParam.SaveData.INJR_ORGN_NM,
    //   VNDR_CD: popupParam.SaveData.VNDR_CD,
    //   VNDR_NM: popupParam.SaveData.VNDR_NM,
    //   INJR_DEPT_CD: popupParam.SaveData.INJR_DEPT_CD,
    //   INJR_DEPT_NM: popupParam.SaveData.INJR_DEPT_NM,
    //   INJR_TMMGR_NM: popupParam.SaveData.INJR_TMMGR_NM,
    //   INJR_GAMGR_NM: popupParam.SaveData.INJR_GAMGR_NM,
    //   INJR_BSMGR_NM: popupParam.SaveData.INJR_BSMGR_NM,
    //   INJR_DDMGR_NM: popupParam.SaveData.INJR_DDMGR_NM,
    //   INJR_BMMGR_NM: popupParam.SaveData.INJR_BMMGR_NM,
    //   RESP_ORGN_GBN: popupParam.SaveData.RESP_ORGN_GBN,
    //   RESP_ORGN_CD: popupParam.SaveData.RESP_ORGN_CD,
    //   RESP_ORGN_NM: popupParam.SaveData.RESP_ORGN_NM,
    //   RESP_DEPT_CD: popupParam.SaveData.RESP_DEPT_CD,
    //   RESP_DEPT_NM: popupParam.SaveData.RESP_DEPT_NM,
    //   RESP_TMMGR_NM: popupParam.SaveData.RESP_TMMGR_NM,
    //   RESP_GAMGR_NM: popupParam.SaveData.RESP_GAMGR_NM,
    //   RESP_BSMGR_NM: popupParam.SaveData.RESP_BSMGR_NM,
    //   RESP_DDMGR_NM: popupParam.SaveData.RESP_DDMGR_NM,
    //   RESP_BMMGR_NM: popupParam.SaveData.RESP_BMMGR_NM,
    //   SAGO_NM: popupParam.SaveData.SAGO_NM,
    //   WIHEOM_YN: popupParam.SaveData.WIHEOM_YN,
    //   WRK_GUD_NO: popupParam.SaveData.WRK_GUD_NO,
    //   WITH_YN: popupParam.SaveData.WITH_YN,
    //   SAGO_GAEYO: popupParam.SaveData.SAGO_GAEYO,
    //   PIC_FILE_ID: popupParam.SaveData.PIC_FILE_ID,
    //   PIC_FILE_ID1: popupParam.SaveData.PIC_FILE_ID1,
    //   PIC_FILE_ID2: popupParam.SaveData.PIC_FILE_ID2,
    //   PIC_FILE_ID3: popupParam.SaveData.PIC_FILE_ID3,
    //   PIC_1_DESC: popupParam.SaveData.PIC_1_DESC,
    //   PIC_2_DESC: popupParam.SaveData.PIC_2_DESC,
    //   PIC_3_DESC: popupParam.SaveData.PIC_3_DESC,
    //   GIINMUL1_CD: popupParam.SaveData.GIINMUL1_CD,
    //   GIINMUL2_CD: popupParam.SaveData.GIINMUL2_CD,
    //   PROCESS_CD: popupParam.SaveData.PROCESS_CD,
    //   GUGUP_USE: popupParam.SaveData.GUGUP_USE,
    //   DOLGUAN_YN: popupParam.SaveData.DOLGUAN_YN,
    //   SUCHIC_DIV_CD: popupParam.SaveData.SUCHIC_DIV_CD,
    //   FILE_ID: popupParam.SaveData.FILE_ID,
    //   LATE_TYPE: popupParam.SaveData.LATE_TYPE,
    //   LATE_RSN: popupParam.SaveData.LATE_RSN,
    //   AMBUL_NOT_DESC: popupParam.SaveData.AMBUL_NOT_DESC,
    //   AMBUL_NOT_RSN: popupParam.SaveData.AMBUL_NOT_RSN,
    //   AMBUL_NOT_PLN: popupParam.SaveData.AMBUL_NOT_PLN,
    //   HSE_CLS_DT: popupParam.SaveData.HSE_CLS_DT
    //     ? dayjs(popupParam.SaveData.HSE_CLS_DT).format("YYYYMMDD")
    //     : "",
    //   HSE_CLS_NM: popupParam.SaveData.HSE_CLS_NM,
    //   APPROVE_ID: popupParam.SaveData.APPROVE_ID,
    //   WRT_FN_DT: popupParam.SaveData.WRT_FN_DT
    //     ? dayjs(popupParam.SaveData.WRT_FN_DT).format("YYYYMMDD")
    //     : "",
    //   WRT_FN_EMP: popupParam.SaveData.WRT_FN_EMP,
    //   WRT_CNFM_DT: popupParam.SaveData.WRT_CNFM_DT
    //     ? dayjs(popupParam.SaveData.WRT_CNFM_DT).format("YYYYMMDD")
    //     : "",
    //   WRT_CNFM_EMP: popupParam.SaveData.WRT_CNFM_EMP,
    //   WRT_FILE_ID: popupParam.SaveData.WRT_FILE_ID,
    //   WRK_STD_NO: popupParam.SaveData.WRK_STD_NO,
    //   SAFE_GAMGR_EMP: popupParam.SaveData.SAFE_GAMGR_EMP,
    //   SAVE_YN: "Y",
    //   USER_ID: userStore.userId,
    //   RESP_BSNS_CD: popupParam.SaveData.RESP_BSNS_CD,
    // },
  ]

  // console.log(popupParam.SaveData, "popupParam.SaveData")
  popupParam.SaveData.OCCUR_DT = popupParam.SaveData.OCCUR_DT
    ? popupParam.SaveData.OCCUR_DT.replace(/-/g, '')
    : ''
  popupParam.SaveData.OCCUR_TIME = popupParam.SaveData.OCCUR_TIME
    ? popupParam.SaveData.OCCUR_TIME.replace(/:/g, '')
    : ''

  param.push(popupParam.SaveData)

  // return console.log(param, "param")

  return commonExecuteApi({ queryId: 'SAFAB0010_save02', list: param }).then(
    (res) => {
      if (isNew.value) {
        commonSearchApi({
          queryId: 'SAFAB0010_search04',
          param: {
            CMPNY_DIV: popupParam.SaveData.CMPNY_DIV,
            DEPT_CD: popupParam.SaveData.RESP_DEPT_CD,
          },
        }).then((res) => {
          console.log(res, 'res')
          if (res.ORESULT_CUR.length !== 0) {
            let hours = popupParam.SaveData.OCCUR_TIME.substring(0, 2)
            let minutes = popupParam.SaveData.OCCUR_TIME.substring(2)

            EMAILPushCHECK.value = res.ORESULT_CUR[0].EMAIL
            PhePushCHECK.value = res.ORESULT_CUR[0].HND_PHN
            EMP_NOPushCHECK.value = res.ORESULT_CUR[0].EMP_NO

            
        
             
            // SMS 발송
            let isSMS = false
            //1.문자 전송
            if (PhePushSAFE.value) {
              PhePushSAFE.value = PhePushSAFE.value.replace(/-/g, '')
              isSMS = true
            }
            if (PhePushCHECK.value) {
              PhePushCHECK.value = PhePushCHECK.value.replace(/-/g, '')
              isSMS = true
            }
            if (!PhePushSAFE.value) {
              Message.warn('안전과장의 핸드폰이 등록이안되어있습니다.')
              isSMS = false
            }
            if (!PhePushCHECK.value) {
              Message.warn('책임부서장의 핸드폰이 등록이안되어있습니다.')
              isSMS = false
            }
            if (isSMS) {
              let number = [PhePushSAFE.value, PhePushCHECK.value]
              let empno = [
                popupParam.SaveData.SAFE_GAMGR_EMP,
                EMP_NOPushCHECK.value,
              ]
              for (let i in number) {
                let sendSMSParams = {
                  EMPNO_FROM: popupParam.SaveData.SAFE_GAMGR_EMP,
                  EMPNO_TO: empno[i],
                  SYSCODE: '156',
                  FROM_P_NO: PhePushCHECK.value,
                  TO_P_NO: number[i],
                  TITLE: `${dayjs(popupParam.SaveData.OCCUR_DT).format(
                    'YYYY'
                  )}년 ${dayjs(popupParam.SaveData.OCCUR_DT).format(
                    'MM'
                  )}월 ${dayjs(popupParam.SaveData.OCCUR_DT).format('DD')}일 ${hours}:${minutes} 에 발생한  사고즉보 등록을 요청드립니다.`,
                }

                commonSendSMS(sendSMSParams)
              }
            }
            // 메일 발송
            if(EMAILPushSAFE.value){
              mailParams.EMAIL = [EMAILPushSAFE.value, EMAILPushCHECK.value]
              mailParams.SUBJECT = '사고 즉보 작성등록 완료'
              mailParams.CONTENT = `${dayjs(popupParam.SaveData.OCCUR_DT).format(
                'YYYY'
              )}년 ${dayjs(popupParam.SaveData.OCCUR_DT).format('MM')}월 ${dayjs(
                popupParam.SaveData.OCCUR_DT
              ).format('DD')}일 ${hours}:${minutes}에 발생한  사고즉보 등록을 요청드립니다.`
              commonSendApi(mailParams).then((res) => {
                Message.success(t('메일이 전송되었습니다.'))
              })
            }
            else{
              Message.warn(
              t(
                '책임부서의 연락처가 없습니다.안전과장 과 책임부서의 부서장에게 개별연락 부탁드립니다.'
              )
            )
            emit('close')
            }
          
          
          }
          if (res.ORESULT_CUR.length === 0) {
            Message.warn(
              t(
                '책임부서의 연락처가 없습니다.안전과장 과 책임부서의 부서장에게 개별연락 부탁드립니다.'
              )
            )
            emit('close')
          }
        })
      }
    }
  )
}

const uploaded = () => {
  if (fileSave && !dblclick.value) {
    let SaveArry = [...new Set(fileSave)]
    for (let i of SaveArry) {
      if (i != undefined) {
        let fileUpload = eval(`fileUpload${i}.value`)
        console.log(fileUpload, 'fileUpload')
        fileUpload.onButtonsClick({ id: 'btnFileUpload' })
      }
    }
  }
  onButtonsClick({ id: 'btnClose' })
  upDataRow()
}

//버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(mainCheck)
      .setQuery(mainSaveData)
      .setAfter(uploaded)
      .run()
  } else if (btn.id === 'btnClose') {
    dialog.value = false
  } else {
    return Message.warn(t('개발중입니다.'))
    //  btnApplicationForMedicalCareOutput 요양신청서 출력 , btnIndustrialAccidentCompensationCardOutput 산재자카드 출력,btnOfficialPaperOutput 보고서출력
  }
}

const upDataRow = () => {
  emit('upDataRow', 'upDataRow')
}

const searchData01 = (idx) => {
  let param = {
    CMPNY_DIV: popupParam.SaveData.CMPNY_DIV,
    SANGBN: popupParam.SaveData.SANGBN,
  }

  return commonSearchApi({ queryId: 'SAF_AG0010_search13', param: param })
}

const afterSearch01 = (res) => {
  popupParam.SaveData.FILENUM = res.ORESULT_CUR[0].FILENUM
  popupParam.SaveData.OKDTE = dayjs().format('YYYY-MM-DD')
  popupParam.SaveData.SANOK = 'Y'
}

watch(
  () => popupParam.SaveData.STATUS,
  (newValue) => {
    if (popupParam.SaveData.STATUS) {
      if (newValue == 'A') {
        popupParam.SaveData.FILENUM = ''
        popupParam.SaveData.OKDTE = ''
        popupParam.SaveData.SANOK = ''
      } else if (newValue == 'D') {
        popupParam.SaveData.FILENUM = ''
        popupParam.SaveData.OKDTE = dayjs().format('YYYY-MM-DD')
        popupParam.SaveData.SANOK = 'N'
      } else if (newValue == 'C') {
        new queryFlowHelper(vm, t)
          .setQuery(searchData01)
          .setAfter(afterSearch01)
          .showMessage(false)
          .run()
      }
    }
  }
)

//  파일관련 메소드
const checkFileId = async () => {
  for (let i = 1; i <= 1; i++) {
    let PIC_FILE_ID = `PIC_FILE_ID${i}`
    let fileUpload = eval(`fileUpload${i}.value`)
    if (
      popupParam.SaveData[PIC_FILE_ID] === null ||
      popupParam.SaveData[PIC_FILE_ID] === undefined
    ) {
      fileUpload.setGuid()
      popupParam.SaveData[PIC_FILE_ID] = fileUpload.guid
      await fileUpload.onButtonsClick({ id: 'btnSearch' })
    } else {
      //파일아이디 있을때
      fileUpload.setGuid(popupParam.SaveData[PIC_FILE_ID])
      popupParam.SaveData[PIC_FILE_ID] = fileUpload.guid
      console.log(fileUpload.guid, 'fileUpload.guid')
      await fileUpload.onButtonsClick({ id: 'btnSearch' })
    }
  }
}



const test = (e) => {
  files.value = e.dataTransfer.files
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1440"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">
      <span> 안전사고 등록 </span>
    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 인적사항 -->
      <v-card-text class="overflowY">
        <v-card class="mb-3 mr-1 popUp-input-Form">
          <v-card-text class="pa-0">
            <div>
              <div class="d-flex my-2">
                <i-input
                  top-label
                  :label="$t('발생일자')"
                  v-model="popupParam.SaveData.OCCUR_DT"
                  type="Date"
                  width="150px"
                  margin="4px"
                  required
                />
                <i-input
                  placeholder="HH:MM"
                  top-label
                  v-model="popupParam.SaveData.OCCUR_TIME"
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
                  margin="4px"
                  @click:appendInner="locationPopupOpen"
                  @click="locationPopupOpen"
                  append-inner-icon="mdi-magnify"
                  readonly
                  required
                  v-model="popupParam.SaveData.SAGO_LOC_LM"
                />
                <i-input
                  top-label
                  :label="$t('')"
                  type="Text"
                  width="150px"
                  margin="4px"
                  readonly
                  v-model="popupParam.SaveData.SAGO_LOC_MM"
                />
                <i-input
                  top-label
                  :label="$t('')"
                  type="Text"
                  width="150px"
                  margin="4px"
                  readonly
                  v-model="popupParam.SaveData.SAGO_LOC_SM"
                />
                <i-input
                  top-label
                  :label="$t('')"
                  type="Text"
                  width="200px"
                  margin="10px"
                  v-model="popupParam.SaveData.SAGO_LOC_DTL"
                />
              </div>

              <!-- 사고내용 -->

              <div class="d-flex my-2">
                <i-textarea
                  label-width="120px"
                  top-label
                  :label="$t('사고 내용')"
                  
                  v-model="popupParam.SaveData.SAGO_GAEYO"
                  width="100%"
                />
              </div>

              <div class="d-flex justify-space-between">
                <div class="d-flex my-2 box">
                  <div>
                    <p class="mb-1">재해/책임 조직 정보</p>
                    <!-- <i-input
                      top-label
                      :label="$t('재해조직 / 사업부')"
                      width="412px"
                      margin="4px"
                      v-model="popupParam.SaveData.BSNS_CDM"
                    
                      required
                    /> -->
                    <i-input
                      top-label
                      :label="$t('재해부서 / 협력사')"
                      type="Text"
                      width="412px"
                      margin="10px"
                      readonly
                      v-model="popupParam.SaveData.INJR_DEPT_NM"
                      append-inner-icon="mdi-magnify"
                      @click:appendInner="deptPopupOpen('INJR')"
                      required
                    />
                    <div class="my-2">
                      <i-input
                        top-label
                        :label="$t('책임부서 / 협력사')"
                        type="Text"
                        width="412px"
                        margin="10px"
                        append-inner-icon="mdi-magnify"
                        @click:appendInner="deptPopupOpen('RESP')"
                        v-model="popupParam.SaveData.RESP_DEPT_NM"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div class="d-flex my-2 box">
                  <div>
                    <p class="mb-1">안전조직 정보</p>
                    <i-input
                      top-label
                      :label="$t('안전과장')"
                      type="Text"
                      width="412px"
                      margin="10px"
                      v-model="popupParam.SaveData.SAFE_GAMGR_EMPKORNM"
                      append-inner-icon="mdi-magnify"
                      @click:appendInner="empPopupOpen"
                      @keydown.enter="(e) => empPopupOpen(e)"
                      required
                    />
                    <div class="d-flex my-2">
                      <i-input
                        top-label
                        :label="$t('안전부서')"
                        type="Text"
                        width="200px"
                        margin="10px"
                        readonly
                        v-model="popupParam.SaveData.SAFE_GAMGR_DEPT"
                      />

                      <i-input
                        top-label
                        :label="$t('사업부')"
                        width="200px"
                        margin="4px"
                        v-model="popupParam.SaveData.SAFE_GAMGR_BSNS"
                        readonly
                      />
                    </div>
                  </div>
                </div>

                <div class="my-2 box">
                  <p class="mb-1">기타 정보</p>
                  <div class="d-flex">
                    <i-input
                      top-label
                      :label="$t('사고형태')"
                      type="Text"
                      width="150px"
                      margin="4px"
                      v-model="popupParam.SaveData.SAGO_DIV_L_NM"
                      readonly
                      @click:appendInner="acdtOpen"
                      @click="acdtOpen"
                      append-inner-icon="mdi-magnify"
                      required
                    />
                    <i-input
                      top-label
                      :label="$t('')"
                      type="Text"
                      width="150px"
                      margin="4px"
                      readonly
                      v-model="popupParam.SaveData.SAGO_DIV_M_NM"
                    />
                    <i-input
                      top-label
                      :label="$t('')"
                      type="Text"
                      width="150px"
                      margin="0px"
                      readonly
                      v-model="popupParam.SaveData.SAGO_DIV_S_NM"
                    />
                  </div>

                  <div class="my-2">
                    <p style="color: #222">{{ $t('구급차이용 여부') }}</p>
                    <v-radio-group
                      inline
                      v-model="popupParam.SaveData.GUGUP_USE"
                      class="radio-box"
                      :disabled="popupParam.SaveData.SAGO_DIV_L === 'E' || popupParam.SaveData.SAGO_DIV_L === 'D'"
                    >
                      <v-radio label="예" value="O"></v-radio>
                      <v-radio label="아니요" value="X"></v-radio>
                      <v-radio label="의무실방문" value="N"></v-radio>
                    </v-radio-group>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <img />
        <v-card class="mb-3 mr-1 popUp-input-Form">
          <v-card-text class="pa-0">
            <div>
              <div class="d-flex justify-space-between">
                <div class="fileDiv">
                  <IUploadImageMulit
                    title="사고사진"
                    ref="fileUpload1"
                    :isVisibled="true"
                    :fileValue="files"
                    :cnt="3"
                    @drop.prevent="test"
                  />
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- 팝업 -->
        <CommonCodePopUpSAF ref="CCP" @selected="selectedCOM" />

        <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
        <EmpPopup ref="empPopup" @selected="selectedemp" />
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.fileDiv {
  width: 100%;
  padding: 12px;
  background: #fff;
}

.radio-box {
  background-color: #fff;
  padding: 3px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
  width: 250px;
}
.box {
  background: #fff;
  padding: 8px;
  border-radius: 12px;
}
</style>
