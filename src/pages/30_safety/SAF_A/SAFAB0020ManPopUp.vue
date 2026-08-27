<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 안전사고보고서 등록 현황 인적현황 추가팝업   -->

<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { value } from "lodash-es"
import SAFAG0010DblClickPopupYoYang from "@/pages/30_safety/SAF_A/SAFAG0010DblClickPopupYoYang.vue"
import SAFAG0010SaupjangPopup from "@/pages/30_safety/SAF_A/SAFAG0010SaupjangPopup.vue"
import Message from "@hiway/utils/notify"
import AcdtPopup from "@/components/popup/AcdtPopup.vue"
import SendMailPopup from "@/components/popup/SendMailPopup.vue"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { useUserStore } from "@hiway/stores/user"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import IUploadImage from "@/components/IUploadImage.vue"
import LocationPopup from "@/components/popup/LocationPopup.vue"
import INJURYPARTPopup from "@/components/popup/INJURYPARTPopup.vue"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import IUpload from "@/components/IUpload.vue"
import { commonSampleDownFilesApi } from "@hiway/api/commonFileApi"
import CommonCodePopUpSAF from "@/components/popup/CommonCodePopUpSAF.vue"
import OZReport from "@/components/OZReport.vue"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(["selected", "upData"])

const dialog = ref(false)

const popEmp = ref()

const codeZ = ref(true)
const fileUpload = ref(null)
const popupParam = reactive({
  SaveData: {},
})
const codeList = reactive({
  HLD_OFFI_GBN: [
    { COD: "1", TXT: "재직" },
    { COD: "2", TXT: "휴직" },
    { COD: "3", TXT: "퇴직" },
    { COD: "4", TXT: "입대" },
  ],
})

const dblclick = ref(false)

// 공통팝업
const acdtPopupRef = ref(null)
const locationPopup = ref(null)
const empPopup = ref(null)
const inpartPopup = ref(null)

// 데이터 바인딩
const ED0010PopUpData = ref({})
const ResData = reactive({})
const saveForms = ref(null)
const SaveData = reactive({})

const menuTitle = ref(null)

const sagoEmpNo  = 'A524835'    // 사고 담당자 지정 (김성일 매니저: A524835)
const sagoEmpNo2 = 'A523481'    // 사고 담당자 지정 (강현웅 선임  : A523481)

//팝업 오픈
const openPopEmp = () => {
  popEmp.value.openPopup("openPop from parent")
}

const intCode = () => {
  Promise.all([
    getCodeList("HHIB190"), //0
    getCodeList("HHIZ020"), //1
    getCodeList("HHIB060"), //2
    getCodeList("HHIB200"), //3
    getCodeList("HHIB120"), //4
    getCodeList("HHIB030"), //5
    getCodeList("HHIB070"), //6
    getCodeList("HHIB080"), //7
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), // 5
  ]).then((res) => {
    codeList.PRSN_DIV = res[0].ORESULT_CUR
    codeList.SOSOG_DIV = res[1].ORESULT_CUR
    codeList.JIKJONG_CD = res[2].ORESULT_CUR
    codeList.UMJU_MSR_MTHD = res[3].ORESULT_CUR
    codeList.JINDAN_CD = res[4].ORESULT_CUR
    codeList.INJURY_TYPE = res[5].ORESULT_CUR
    codeList.RPT_TYPE_CD = res[6].ORESULT_CUR
    codeList.SJE_TYPE_CD = res[7].ORESULT_CUR
  })
}

//  팝업 관련

const openPopup = (param, goodun, dblclickOpen) => {
  dblclick.value = false
  popupParam.SaveData = {}
  popupParam.NRoIAData = {}
  if (dblclickOpen) {
    dblclick.value = true
  }
  console.log(param, "param")

  if (goodun) {
    popupParam.SaveData = param
    popupParam.SaveData.IPSAIL = popupParam.SaveData.IPSAIL
      ? dayjs(popupParam.SaveData.IPSAIL).format("YYYY-MM-DD")
      : ""
    popupParam.SaveData.BIRTHDAY = popupParam.SaveData.BIRTHDAY
      ? dayjs(popupParam.SaveData.BIRTHDAY).format("YYYY-MM-DD")
      : ""
    popupParam.SaveData.JOB_TIT_NM = popupParam.SaveData.GRD_DESC
  } else {
    if (param) {
      popupParam.SaveData = []
      popupParam.SaveData.CMPNY_DIV = param.CMPNY_DIV
      popupParam.SaveData.SAGO_SN = param.SAGO_SN
    }
  }
  onButtonsClick("btnSearch", "산재불인정")

  intCode()

  dialog.value = true
}

const INJURYPARTPopupOpen = () => {
  inpartPopup.value.openPopup("상해부위")
}

const selectedINJURYPAR = (row) => {
  popupParam.SaveData.INJURY_PART_LM = row[0].TXT
  popupParam.SaveData.INJURY_PART_SM = row[1].TXT

  popupParam.SaveData.INJURY_PART_L = row[0].COD
  popupParam.SaveData.INJURY_PART_S = row[1].COD
}

const empPopupOpen = () => {
  popupParam.SaveData.EMP_NM = popupParam.SaveData.NAME
  empPopup.value.openPopup(popupParam.SaveData)
}

const selectedemp = (row) => {
  console.log(row, "row")

  popupParam.SaveData.NAME = row.EMP_NM
  popupParam.SaveData.EMP_NO = row.EMP_NO
  popupParam.SaveData.JIKJONG_CD = row.JIKJONG_CD
  popupParam.SaveData.SOSOG_DESC = row.ASGN_NM
  popupParam.SaveData.SOSOG_TEL = row.TEL_NO
  popupParam.SaveData.SOSOG_CD = row.ASGN_CD
  popupParam.SaveData.JOB_TIT_NM = row.JOB_TIT_NM
  popupParam.SaveData.JOB_TIT_CD = row.JOB_TIT_CD
  popupParam.SaveData.BIRTHDAY = row.BIRTH_DAY
  popupParam.SaveData.IPSAIL = row.GRP_ENT_DATE
    ? row.GRP_ENT_DATE.substring(0, 10)
    : ""
  // popupParam.SaveData.IPSAIL = row.COM_ENT_DATE
  //   ? row.COM_ENT_DATE.substring(0, 10)
  //   : ""
  popupParam.SaveData.CMPNY_DIV = row.CMPNY_DIV
  popupParam.SaveData.BSNS_CD = row.BSNS_CD
  popupParam.SaveData.SOSOG_DEPT_CD = row.DEPT_CD
  popupParam.SaveData.ASGN_CD = row.ASGN_CD
  popupParam.SaveData.GRD_CD = row.GRD_CD
  popupParam.SaveData.HND_PHN = row.HND_PHN
  popupParam.SaveData.SOSOG_DEPT_DESC = row.DEPT_NM
  popupParam.SaveData.SEX = row.SEX
}

//  시간 유효성검사

const formatTimeFromInput = (inputTime) => {
  const timePattern = /^([01]?[0-9]|2[0-3])([0-5][0-9])$/
  if (!timePattern.test(inputTime)) {
    return ""
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
      fieldName: "STATUS",
      dataType: "text",
      header: { text: t("진행상태") },
      lookupDisplay: true,
    },
    {
      fieldName: "INPUTDTE",
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      header: { text: t("접수일"), editor: { datetimeFormat: "yyyy-MM-dd" } },
    },
    {
      fieldName: "FINISHDTE",
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      header: { text: t("완료일"), editor: { datetimeFormat: "yyyy-MM-dd" } },
    },
    { fieldName: "ADESC", dataType: "text", header: { text: t("진료비내용") } },
    { fieldName: "AMT", dataType: "text", header: { text: t("금액") } },
    { fieldName: "HOSPITAL", dataType: "text", header: { text: t("병원") } },
    { fieldName: "BANK", dataType: "text", header: { text: t("은행") } },
  ],
  columns: [],
})

grdPopUpProps.columns = grdPopUpProps.fields

const grdPop1prop = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: ["COMPANY_NM"],
  fields: [
    {
      fieldName: "COMPANY_NM",
      dataType: "text",
      header: { text: t("회사구분") },
    },
    {
      fieldName: "HLD_OFFI_NM",
      dataType: "text",
      header: { text: t("재직상태") },
    },
    {
      fieldName: "RETI_TMP_DATE",
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      header: { text: t("퇴직일"), editor: { datetimeFormat: "yyyy-MM-dd" } },
    },
  ],
  columns: [],
})

grdPop1prop.columns = grdPop1prop.fields

//  저장관련

const mainCheck = () => {
  if (!popupParam.SaveData.PRSN_DIV) {
    Message.warn(t("재해자 / 유발자를 선택해주세요."))
    return false
  }
  if (!popupParam.SaveData.NAME) {
    Message.warn(t("성명을 선택해주세요."))
    return false
  }
  if (!popupParam.SaveData.JIKJONG_CD) {
    Message.warn(t(" 직종을 선택해주세요."))
    return false
  }
  if (
    !popupParam.SaveData.INJURY_PART_LM ||
    !popupParam.SaveData.INJURY_PART_SM
  ) {
    Message.warn(t(" 상해부위를 선택해주세요."))
    return false
  }
  if (!popupParam.SaveData.INJURY_TYPE) {
    Message.warn(t(" 상해종류를 선택해주세요."))
    return false
  }

  return true
}

const mainSaveData = () => {
  let param = [
    {
      CMPNY_DIV: popupParam.SaveData.CMPNY_DIV,
      SAGO_SN: popupParam.SaveData.SAGO_SN,
      SEQ: popupParam.SaveData.SEQ,
      BSNS_CD: popupParam.SaveData.BSNS_CD,
      PRSN_DIV: popupParam.SaveData.PRSN_DIV,
      SAGO_JOCHI_CD: popupParam.SaveData.SAGO_JOCHI_CD,
      RPT_TYPE_CD: popupParam.SaveData.RPT_TYPE_CD,
      EMP_NO: popupParam.SaveData.EMP_NO,
      BIRTHDAY: popupParam.SaveData.BIRTHDAY
        ? popupParam.SaveData.BIRTHDAY.replace(/-/g, "")
        : "",
      NAME: popupParam.SaveData.NAME,
      SEX: popupParam.SaveData.SEX,
      GRD_CD: popupParam.SaveData.GRD_CD,
      GRD_DESC: popupParam.SaveData.JOB_TIT_NM,
      HND_PHN: popupParam.SaveData.HND_PHN,
      SOSOG_CD: popupParam.SaveData.SOSOG_CD,
      SOSOG_DESC: popupParam.SaveData.SOSOG_DESC,
      SOSOG_DEPT_CD: popupParam.SaveData.SOSOG_DEPT_CD,
      SOSOG_DEPT_DESC: popupParam.SaveData.SOSOG_DEPT_DESC,
      SOSOG_DIV: popupParam.SaveData.SOSOG_DIV,
      SOSOG_TEL: popupParam.SaveData.SOSOG_TEL,
      IPSAIL: popupParam.SaveData.IPSAIL
        ? popupParam.SaveData.IPSAIL.replace(/-/g, "")
        : "",
      JOB_DEPT_CD: popupParam.SaveData.JOB_DEPT_CD,
      JOB_ROW_CD: popupParam.SaveData.JOB_ROW_CD,
      JIKJONG_CD: popupParam.SaveData.JIKJONG_CD,
      ADDRESS: popupParam.SaveData.ADDRESS,
      ADDRESS2: popupParam.SaveData.ADDRESS2,
      INJURY_TYPE: popupParam.SaveData.INJURY_TYPE,
      INJURY_PART_L: popupParam.SaveData.INJURY_PART_L,
      INJURY_PART_S: popupParam.SaveData.INJURY_PART_S,
      JINDAN_CD: popupParam.SaveData.JINDAN_CD,
      UMJU_MSR_MTHD: popupParam.SaveData.UMJU_MSR_MTHD,
      UMJU_ALCOL: popupParam.SaveData.UMJU_ALCOL
        ? popupParam.SaveData.UMJU_ALCOL
        : 0,
      KYNGMI_STUS: popupParam.SaveData.KYNGMI_STUS,
      INTER_SAGO: popupParam.SaveData.INTER_SAGO,
      INTER_DESC: popupParam.SaveData.INTER_DESC,
      NOWORK_DAYS: popupParam.SaveData.NOWORK_DAYS,
      JINRYO_SOGYEN: popupParam.SaveData.JINRYO_SOGYEN,
      INTER_DT: popupParam.SaveData.INTER_DT,
      INTER_TM: popupParam.SaveData.INTER_TM,
      INTER_PLACE: popupParam.SaveData.INTER_PLACE,
      INTER_SOSOG_NM: popupParam.SaveData.INTER_SOSOG_NM,
      INTER_GRD_DESC: popupParam.SaveData.INTER_GRD_DESC,
      INTER_NM: popupParam.SaveData.INTER_NM,
      INTER_CNFM_DT: popupParam.SaveData.INTER_CNFM_DT,
      INTER_CNFM_NM: popupParam.SaveData.INTER_CNFM_NM,
      CHIRYO_REQRPT_DT: popupParam.SaveData.CHIRYO_REQRPT_DT,
      CHIRYO_REQRPT_NM: popupParam.SaveData.CHIRYO_REQRPT_NM,
      CHIRYO_RPTRCV_NM: popupParam.SaveData.CHIRYO_RPTRCV_NM,
      CHIRYO_RPTRCV_TEL: popupParam.SaveData.CHIRYO_RPTRCV_TEL,
      KYNGMI_CLOSE_DT: popupParam.SaveData.KYNGMI_CLOSE_DT,
      KYNGMI_CLOSE_NM: popupParam.SaveData.KYNGMI_CLOSE_NM,
      CHIRYO_ADD_DAYS: popupParam.SaveData.CHIRYO_ADD_DAYS,
      RPT_SEND_DT: popupParam.SaveData.RPT_SEND_DT,
      HOSP_NO: popupParam.SaveData.HOSP_NO,
      JINRYOGUA_CD: popupParam.SaveData.JINRYOGUA_CD,
      FILE_ID: popupParam.SaveData.FILE_ID,
      SOSOG_CMPNY_DIV: popupParam.SaveData.SOSOG_CMPNY_DIV,
      SAVE_YN: "Y",
      USER_ID: userStore.userId,
      RPT_FILE_ID: popupParam.SaveData.RPT_FILE_ID,
      CONTACTING: popupParam.SaveData.CONTACTING,
      SJE_TYPE_CD: popupParam.SaveData.SJE_TYPE_CD,
    },
  ]

  return commonExecuteApi({ queryId: "SAFAB0010_save03", list: param })
}

const uploaded = (item) => {
  let param = [
    {
      CMPNY_DIV: popupParam.SaveData.CMPNY_DIV,
      SAGO_SN: popupParam.SaveData.SAGO_SN,
      SEQ: popupParam.SaveData.SEQ,
      RPT_FILE_ID: popupParam.SaveData.RPT_FILE_ID,
    },
  ]
  commonExecuteApi({ queryId: "SAFAB0010_save01", list: param })
}

//버튼
const onButtonsClick = async (btn, gubun) => {
  console.log(btn, gubun)
  if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(mainCheck)
      .setQuery(mainSaveData)
      .setAfter(() => {
        onButtonsClick({ id: "btnClose" })
        upDataRow()
      })
      .run()
  } else if (btn.id === "btnClose") {
    dialog.value = false
  }

  if (gubun == "산재불인정") {
    if (btn == "btnSearch") {
      let param = {
        CMPNY_DIV: popupParam.SaveData.CMPNY_DIV,
        SAGO_SN: popupParam.SaveData.SAGO_SN,
        SEQ: popupParam.SaveData.SEQ,
      }
      await commonSearchApi({
        queryId: "SAFAB0020_search08",
        param: param,
      }).then((res) => {
        if (res.ORESULT_CUR.length != 0) {
          if (res.ORESULT_CUR[0].OCCUR_TIME) {
            const hours = res.ORESULT_CUR[0].OCCUR_TIME.substring(0, 2)
            const minutes = res.ORESULT_CUR[0].OCCUR_TIME.substring(2)
            res.ORESULT_CUR[0].OCCUR_TIME = `${hours}:${minutes}`
          }
          if (res.ORESULT_CUR[0].OCCUR_DT) {
            res.ORESULT_CUR[0].OCCUR_DT = dayjs(
              res.ORESULT_CUR[0].OCCUR_DT
            ).format("YYYY-MM-DD")
          }
          popupParam.NRoIAData = res.ORESULT_CUR[0]
        }
      })
    }
    if (btn == "btnUpdate2") {
      new saveFlowHelper(vm, t)
        .setBefore(SanBulCheck)
        .setQuery(SanBulData)
        .setAfter(() => {
          onButtonsClick({ id: "btnClose" })
          upDataRow()
        })
        .run()
    }
    if (btn == "btnDelete2") {
      new deleteFlowHelper(vm, t)
        .setBefore(SanBulDelChek)
        .setQuery(SanBulDel)
        .setAfter(() => {
          onButtonsClick({ id: "btnClose" })
          upDataRow()
        })
        .run()
    }
  }
  if (gubun == "조사표") {
    if (btn == "btnPrintHandwriting") {
      let params = {
        FILE_PATH: "SAFA",
        FILE_NAME: "산업재해조사표.xlsx",
      }
      commonSampleDownFilesApi(params)
    }
  }
}

// 산재불인정 저장

const SanBulCheck = () => {
  if (!popupParam.SaveData.SEQ) {
    Message.warn(t("저장되지않은 인적현황은 저장하실수 없습니다."))
    return false
  }

  if (!popupParam.NRoIAData.REQUEST_DETAILS) {
    Message.warn(t("산재요청 경위는 필수입력입니다."))
    return false
  }

  if (!popupParam.NRoIAData.STATUS) {
    Message.warn(t("경과 및 현재상태는 필수입력입니다."))
    return false
  }

  if (!popupParam.NRoIAData.COMMENTS) {
    Message.warn(t("부서의견은 필수입력입니다."))
    return false
  }
  return true
}

const SanBulData = () => {
  let param = [
    {
      CMPNY_DIV: popupParam.SaveData.CMPNY_DIV,
      SAGO_SN: popupParam.SaveData.SAGO_SN,
      SEQ: popupParam.SaveData.SEQ,
      REQUEST_DETAILS: popupParam.NRoIAData.REQUEST_DETAILS,
      STATUS: popupParam.NRoIAData.STATUS,
      COMMENTS: popupParam.NRoIAData.COMMENTS,
      ETC: popupParam.NRoIAData.ETC,
      JUDGE_REVIEW: popupParam.NRoIAData.JUDGE_REVIEW,
    },
  ]

  return commonExecuteApi({ queryId: "SAFAB0020_save04", list: param })
}

const SanBulDelChek = () => {
  if (!popupParam.SaveData.SEQ) {
    Message.warn(t("저장되지않은 인적현황은 저장하실수 없습니다."))
    return false
  }
  return true
}

// 산재불인정 삭제
const SanBulDel = () => {
  let param = [
    {
      CMPNY_DIV: popupParam.SaveData.CMPNY_DIV,
      SAGO_SN: popupParam.SaveData.SAGO_SN,
      SEQ: popupParam.SaveData.SEQ,
    },
  ]

  return commonExecuteApi({ queryId: "SAFAB0020_delete05", list: param })
}

const onSelect = () => {
  emit("selected", "selected")
}

const upDataRow = () => {
  emit("upData", "upData")
}

const searchData01 = (idx) => {
  let param = {
    CMPNY_DIV: popupParam.SaveData.CMPNY_DIV,
    SANGBN: popupParam.SaveData.SANGBN,
  }

  return commonSearchApi({ queryId: "SAF_AG0010_search13", param: param })
}

const afterSearch01 = (res) => {
  popupParam.SaveData.FILENUM = res.ORESULT_CUR[0].FILENUM
  popupParam.SaveData.OKDTE = dayjs().format("YYYY-MM-DD")
  popupParam.SaveData.SANOK = "Y"
}

watch(
  () => popupParam.SaveData.STATUS,
  (newValue) => {
    if (popupParam.SaveData.STATUS) {
      if (newValue == "A") {
        popupParam.SaveData.FILENUM = ""
        popupParam.SaveData.OKDTE = ""
        popupParam.SaveData.SANOK = ""
      } else if (newValue == "D") {
        popupParam.SaveData.FILENUM = ""
        popupParam.SaveData.OKDTE = dayjs().format("YYYY-MM-DD")
        popupParam.SaveData.SANOK = "N"
      } else if (newValue == "C") {
        new queryFlowHelper(vm, t)
          .setQuery(searchData01)
          .setAfter(afterSearch01)
          .showMessage(false)
          .run()
      }
    }
  }
)

watch(
  () => popupParam.SaveData.UMJU_ALCOL,
  (newValue) => {
    let regex = /^[0-9.]+$/
    let numberOnly = regex.test(newValue)

    if (!numberOnly) {
      return (popupParam.SaveData.UMJU_ALCOL = "")
    }
    if (newValue > 100) {
      Message.warn(t("음주농도가 100% 보다 높을순없습니다."))
      return (popupParam.SaveData.UMJU_ALCOL = 0)
    }
  }
)

watch(
  () => popupParam.SaveData.SOSOG_DIV,
  (newValue) => {
    if (newValue == "Z") {
      codeZ.value = false
    } else {
      codeZ.value = true
    }
  }
)

// 업로드 관련

// watch(
//   () => fileUpload.value,
//   (newValue) => {
//     if (newValue !== null && newValue !== "" && newValue !== undefined) {
//       checkFileId()
//     }
//   }
// )

//  파일관련 메소드
// const checkFileId = () => {
//   if (
//     popupParam.SaveData.RPT_FILE_ID === null ||
//     popupParam.SaveData.RPT_FILE_ID === undefined
//   ) {
//     fileUpload.value.setGuid()
//     popupParam.SaveData.RPT_FILE_ID = fileUpload.value.guid
//     fileUpload.value.onButtonsClick({ id: "btnSearch" })
//   } else {
//     //파일아이디 있을때
//     fileUpload.value.setGuid(popupParam.SaveData.RPT_FILE_ID)
//     popupParam.SaveData.RPT_FILE_ID = fileUpload.value.guid
//     console.log(fileUpload.value.guid, "fileUpload.value.guidddd")
//     fileUpload.value.onButtonsClick({ id: "btnSearch" })
//   }
// }

// 팝업관련
const locationPopupOpen = () => {
  locationPopup.value.openPopup(userStore.cmpnyDiv)
}

const acdtOpen = () => {
  acdtPopupRef.value.openPopup(userStore.cmpnyDiv)
}

const selectedArr = (row) => {
  popupParam.SaveData.SAGO_DIV_L_NM = row[0].TXT
  popupParam.SaveData.SAGO_DIV_M_NM = row[1].TXT
  popupParam.SaveData.SAGO_DIV_S_NM = row[2].TXT

  popupParam.SaveData.SAGO_DIV_L = row[0].COD
  popupParam.SaveData.SAGO_DIV_M = row[1].COD
  popupParam.SaveData.SAGO_DIV_S = row[2].COD
}

const selectedLocation = (row) => {
  popupParam.SaveData.SAGO_LOC_LM = row[0].TXT
  popupParam.SaveData.SAGO_LOC_MM = row[1].TXT
  popupParam.SaveData.SAGO_LOC_SM = row[2].TXT

  popupParam.SaveData.SAGO_LOC_L = row[0].COD
  popupParam.SaveData.SAGO_LOC_M = row[1].COD
  popupParam.SaveData.SAGO_LOC_S = row[2].COD
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="880"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">
      <span v-if="dblclick"> 인적사항 수정</span>
      <span v-else> 인적사항 등록</span>
    </div>
    <VContainer style="background-color: white">
      <VForm ref="saveForms">
        <!-- 최상단 -->
        <VRow class="my-1">
          <VCol>
            <IMenuTitle
              ref="menuTitle"
              :use-permission="false"
              :button-list="['btnUpdate', 'btnClose']"
              @click-button="onButtonsClick"
            />
          </VCol>
        </VRow>

        <v-row style="overflow-x: hidden; height: 590px">
          <!--  신청 / 요양정보 -->
          <v-card-title> 인적 사항</v-card-title>
          <VRow class="popUp-input-Form">
            <!-- 첫번째 -->
            <v-col cols="12">
              <v-row>
                <VCol cols="12" md="4">
                  <ILabel :label="$t('구분')" labelLoc="top" :required="true">
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="12">
                          <v-select
                            v-model="popupParam.SaveData.PRSN_DIV"
                            :items="codeList.PRSN_DIV"
                            item-value="COD"
                            item-title="TXT"
                            variant="solo"
                            flat
                          />
                        </v-col>
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>

                <VCol cols="12" md="4">
                  <ILabel
                    :label="$t('소속구분')"
                    labelLoc="top"
                    :required="true"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="12">
                          <v-select
                            v-model="popupParam.SaveData.SOSOG_DIV"
                            :items="codeList.SOSOG_DIV"
                            item-value="COD"
                            item-title="TXT"
                            variant="solo"
                            flat
                          />
                        </v-col>
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>

                <VCol cols="12" md="4">
                  <ILabel :label="$t('성별')" labelLoc="top" :required="true">
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="12">
                          <v-radio-group
                            v-model="popupParam.SaveData.SEX"
                            inline
                          >
                            <v-radio label="남자" value="M"></v-radio>
                            <v-radio label="여자" value="F"></v-radio>
                          </v-radio-group>
                        </v-col>
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
              </v-row>
            </v-col>

            <!-- 두번째 -->
            <v-col cols="12">
              <v-row>
                <VCol cols="12" md="6">
                  <ILabel :label="$t('성명')" labelLoc="top" :required="true">
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="6">
                          <i-input
                            width="100%"
                            @click:appendInner="empPopupOpen"
                            @keypress.enter="empPopupOpen"
                            :append-inner-icon="codeZ ? 'mdi-magnify' : ''"
                            v-model="popupParam.SaveData.NAME"
                          />
                        </v-col>
                        <v-col cols="6">
                          <i-input
                            width="100%"
                            v-model="popupParam.SaveData.EMP_NO"
                            readonly
                            flat
                          />
                        </v-col>
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>

                <VCol cols="12" md="4">
                  <ILabel :label="$t('직종')" labelLoc="top" :required="true">
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="12">
                          <v-select
                            v-model="popupParam.SaveData.JIKJONG_CD"
                            :items="codeList.JIKJONG_CD"
                            item-value="COD"
                            item-title="TXT"
                            variant="solo"
                            flat
                          />
                        </v-col>
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
              </v-row>
            </v-col>

            <!-- 세번째 -->
            <v-col cols="12">
              <v-row>
                <VCol cols="12" md="9">
                  <ILabel
                    :label="$t('소속/조직')"
                    labelLoc="top"
                    :required="true"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-col cols="12">
                          <v-text-field
                            v-model="popupParam.SaveData.SOSOG_DESC"
                            variant="solo"
                            flat
                          />
                        </v-col>
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>

                <VCol cols="12" md="3">
                  <ILabel :label="$t('사내전화')" labelLoc="top">
                    <template #editor="editorProps">
                      <v-text-field
                        v-model="popupParam.SaveData.SOSOG_TEL"
                        variant="solo"
                        flat
                      />
                    </template>
                  </ILabel>
                </VCol>
              </v-row>
            </v-col>

            <!-- 네번째 -->
            <v-col cols="12">
              <v-row>
                <VCol cols="12" md="4">
                  <ILabel :label="$t('직급명')" labelLoc="top">
                    <template #editor="editorProps">
                      <v-row>
                        <v-text-field
                          v-model="popupParam.SaveData.JOB_TIT_NM"
                          :readonly="codeZ"
                          variant="solo"
                          flat
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>

                <VCol cols="12" md="4">
                  <ILabel :label="$t('생년월일')" labelLoc="top">
                    <template #editor="editorProps">
                      <v-row>
                        <v-text-field
                          type="Date"
                          format="yyyy-MM-dd"
                          v-model="popupParam.SaveData.BIRTHDAY"
                          variant="solo"
                          flat
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>

                <VCol cols="12" md="4">
                  <ILabel :label="$t('입사일')" labelLoc="top">
                    <template #editor="editorProps">
                      <v-row>
                        <v-text-field
                          type="Date"
                          format="yyyy-MM-dd"
                          v-model="popupParam.SaveData.IPSAIL"
                          variant="solo"
                          flat
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
              </v-row>
            </v-col>

            <!-- 다섯번째 -->
            <v-col cols="12" style="display: none;">
              <v-row>
                <VCol cols="12" md="4">
                  <ILabel :label="$t('음주측정')" labelLoc="top">
                    <template #editor="editorProps">
                      <v-row>
                        <v-select
                          v-model="popupParam.SaveData.UMJU_MSR_MTHD"
                          :items="codeList.UMJU_MSR_MTHD"
                          item-value="COD"
                          item-title="TXT"
                          variant="solo"
                          flat
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>

                <VCol cols="12" md="4">
                  <ILabel :label="$t('알콜농도(%)')" labelLoc="top">
                    <template #editor="editorProps">
                      <v-row>
                        <i-input
                          v-model="popupParam.SaveData.UMJU_ALCOL"
                          type="Number"
                          width="250px"
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
              </v-row>
            </v-col>
          </VRow>
          <v-col cols="12" class="my-3">
            <v-card-title> 재해 정도</v-card-title>
          </v-col>
          <VRow class="popUp-input-Form">
            <!-- 여섯번재 -->
            <v-col cols="12">
              <v-row>
                <VCol cols="12" md="4">
                  <ILabel
                    :label="$t('상해부위')"
                    labelLoc="top"
                    :required="true"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-col>
                          <i-input
                            width="100%"
                            readonly
                            v-model="popupParam.SaveData.INJURY_PART_LM"
                          />
                        </v-col>
                        <v-col>
                          <i-input
                            width="100%"
                            @click:appendInner="INJURYPARTPopupOpen"
                            @click="INJURYPARTPopupOpen"
                            readonly
                            v-model="popupParam.SaveData.INJURY_PART_SM"
                            append-inner-icon="mdi-magnify"
                          />
                        </v-col>
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>

                <VCol cols="12" md="4">
                  <ILabel
                    :label="$t('상해종류')"
                    labelLoc="top"
                    :required="true"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-select
                          v-model="popupParam.SaveData.INJURY_TYPE"
                          :items="codeList.INJURY_TYPE"
                          item-value="COD"
                          item-title="TXT"
                          variant="solo"
                          flat
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>

                <VCol cols="12" md="4">
                  <ILabel :label="$t('진단:주')" labelLoc="top">
                    <template #editor="editorProps">
                      <v-row>
                        <v-select
                          v-model="popupParam.SaveData.JINDAN_CD"
                          :items="codeList.JINDAN_CD"
                          item-value="COD"
                          item-title="TXT"
                          variant="solo"
                          flat
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
              </v-row>
            </v-col>
          </VRow>

          <v-col cols="12" class="my-3" v-if="userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2">
            <v-card-title> 사고처리</v-card-title>
          </v-col>
          <VRow class="popUp-input-Form" v-if="userStore.empNo === sagoEmpNo || userStore.empNo === sagoEmpNo2">
            <!-- 여섯번재 -->
            <v-col cols="12">
              <v-row>
                <VCol cols="12" md="4">
                  <ILabel :label="$t('사고 처리')" labelLoc="top">
                    <template #editor="editorProps">
                      <v-row>
                        <v-col>
                          <v-select
                            v-model="popupParam.SaveData.RPT_TYPE_CD"
                            :items="codeList.RPT_TYPE_CD"
                            item-value="COD"
                            item-title="TXT"
                            variant="solo"
                            flat
                          />
                        </v-col>
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
                <!-- 김성일 매니저 요청건으로 삭제 -->
                <!-- <VCol cols="12" md="4">
                  <ILabel
                    :label="$t('사고 처리')"
                    labelLoc="top"
                    :required="true"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-select
                          v-model="popupParam.SaveData.SJE_TYPE_CD"
                          :items="codeList.SJE_TYPE_CD"
                          item-value="COD"
                          item-title="TXT"
                          variant="solo"
                          flat
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol> -->

                <VCol
                  cols="12"
                  md="4"
                  class="d-flex align-center"
                  style="margin-top: 21px"
                >
                  <v-checkbox
                    label="개인진정"
                    v-model="popupParam.SaveData.CONTACTING"
                  />
                </VCol>
              </v-row>
            </v-col>
          </VRow>

          <!-- <v-col cols="12" class="my-3">
            <IGridTitle
              :title="$t('산업재해 조사표')"
              :button-list="['btnPrintHandwriting']"
              @click-button="onButtonsClick($event.id, '조사표')"
            />
          </v-col> -->
          <!-- <VRow class="popUp-input-Form">
            <IUpload
              ref="fileUpload"
              @uploaded="uploaded($event)"
              style="height: 300px"
            />
          </VRow> -->

          <!-- <v-col cols="12" class="my-3">
            <IGridTitle
              :title="$t('산재불인정 부서의견서')"
              :button-list="['btnSearch', 'btnUpdate2', 'btnDelete2']"
              @click-button="onButtonsClick($event.id, '산재불인정')"
            />
          </v-col> -->
          <!-- <VRow class="popUp-input-Form">
            <v-col cols="12">
              <v-row>
                <VCol cols="12" md="12">
                  <ILabel
                    :label="$t('산재요청 경위')"
                    labelLoc="top"
                    :required="true"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-textarea
                          v-model="popupParam.NRoIAData.REQUEST_DETAILS"
                          variant="solo"
                          flat
                          class="mt-2"
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
              </v-row>

              <v-row>
                <VCol cols="12" md="12">
                  <ILabel
                    :label="$t('경과 및 현재상태')"
                    labelLoc="top"
                    :required="true"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-textarea
                          v-model="popupParam.NRoIAData.STATUS"
                          variant="solo"
                          flat
                          class="mt-2"
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
              </v-row>

              <v-row>
                <VCol cols="12" md="12">
                  <ILabel
                    :label="$t('부서의견')"
                    labelLoc="top"
                    :required="true"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-textarea
                          v-model="popupParam.NRoIAData.COMMENTS"
                          variant="solo"
                          flat
                          class="mt-2"
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
              </v-row>

              <v-row>
                <VCol cols="12" md="12">
                  <ILabel
                    :label="$t('산재심사시 검토사항 ')"
                    labelLoc="top"
                    :required="true"
                  >
                    <template #editor="editorProps">
                      <v-row>
                        <v-textarea
                          v-model="popupParam.NRoIAData.JUDGE_REVIEW"
                          variant="solo"
                          flat
                          class="mt-2"
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
              </v-row>

              <v-row>
                <VCol cols="12" md="12">
                  <ILabel :label="$t('기타')" labelLoc="top" :required="true">
                    <template #editor="editorProps">
                      <v-row>
                        <v-textarea
                          v-model="popupParam.NRoIAData.ETC"
                          variant="solo"
                          flat
                          class="mt-2"
                        />
                      </v-row>
                    </template>
                  </ILabel>
                </VCol>
              </v-row>
            </v-col>
          </VRow> -->
          <!-- 팝업 -->
          <EmpPopup ref="empPopup" @selected="selectedemp" />
          <AcdtPopup ref="acdtPopupRef" @selectedArr="selectedArr" />

          <LocationPopup @selectedArr="selectedLocation" ref="locationPopup" />
          <CommonCodePopUpSAF @selected="selectedINJURYPAR" ref="inpartPopup" />
        </v-row>
      </VForm>
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
