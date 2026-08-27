<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 허가서 작성 팝업 (일렉용)   -->

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
  commonSendSMS,
  commonShortenUrl
} from "@hiway/api/commonApi"
import dayjs from "dayjs"
import { isEmpty, value } from "lodash-es"
import { getQDomain } from '@/utils/common'
import Message from "@hiway/utils/notify"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { useUserStore } from "@hiway/stores/user"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import _ from "lodash"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import SAFBA0010DAN_WRK_STD from "@/pages/30_safety/SAF_B/SAFBA0010DAN_WRK_STD.vue"
import SAFBA0010WRK_STD from "@/pages/30_safety/SAF_B/SAFBA0010WRK_STD.vue"
import SAFBA0010WRK_STD2 from "@/pages/30_safety/SAF_B/SAFBA0010WRK_STD2.vue"
import SAFBA0010LikeWrkPlace from "@/pages/30_safety/SAF_B/SAFBA0010LikeWrkPlace.vue"
import WorkPlace from "@/pages/30_safety/SAF_B/SAFBA0010WorkPlace.vue"
import DatePopUp from "@/pages/30_safety/SAF_B/SAFBA0010DatePopUp.vue"
import SafeAppPopUp from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1_SafeApp.vue"
import dangi from "@/pages/30_safety/SAF_B/SAFBA0010dangi.vue"
import CommonCodePopUpSAF from "@/components/popup/CommonCodePopUpSAF_ELEC.vue"
import OZReport from "@/components/OZReport.vue"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const emit = defineEmits(["upData"])
const grdTitle = ref(null)
const grdTitle2 = ref(null)
const grdMain = ref(null)
const WrkPopup = ref(null)
const DatePop = ref(null)
const SafeAppPop =  ref(null)
const DateInt = ref([{ date: "", dt: "", time: "", DN_DIV: "" }])
const CCP = ref(null)
const grdSub1 = ref(null)
const grdSub1_1 = ref(null)
const grdSub1_2 = ref(null)
const grdSub2 = ref(null)
const grdSub3 = ref(null)
const codeList = reactive({})
const deptPopup = ref(null)
const empPopup = ref(null)
const gbnEmp = ref("")
const WrkPopup2 = ref(null)
const DanWrkPopup = ref(null)
const dataRow = ref(null)
const LocationType = ref(null)
const workPlacePopUp = ref(null)
const isSearch = ref(false)
const isDateint = ref(false)
const isGrdint = ref(false)
const isRowChanged = ref(null)
const disabledSTATUS = ref(false)
const menuTitle = ref(null)
const SafetyOpen = ref(false)
const rowChValue = ref("")
const isDan = ref("")
const isGan = ref(false)
const GanArr = ref([])
const dangiPopUp = ref(null)
// Report Name Name.ozr
const reportName = ref([])
const isMulti = ref(false)
const params = ref([])
const LocationDisable = ref(true)
// OzReport 팝업 여부
const showOz = ref(false)
// 데이터 담아두는 변수
const ALLDATA = ref([])
const samEmpNo = ref(false)
const isJob = ref(false)



const CanBeCanceld = ref(true)

// 장소 즐겨찾기
const LikeWrkPlace = ref(null)
// 초기데이터 세팅
const datainer = ref({
  DEPT_CD: userStore.deptCd,
  CMPNY_DIV: userStore.cmpnyDiv,
  // JOB_BSNS_CD: userStore.bsnsCd,
  DEPT_NM: userStore.asgnFullNm,
  RESP_EMP_NM: userStore.empNm,
  RESP_EMP_NO: userStore.empNo,
  RESP_HP_NO: userStore.hndPhn
    ? userStore.hndPhn.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
    : "",
  RESP_TRS_NO: userStore.TRS_NO,
  CONFINED_YN: "N",
  ARGN_YN: "N",
  ELEC_YN: "N",
  HEIGHT_YN: "N",
  HEIGHT: "",
  PRESSURE_YN: "N",
  PRESSURE: "",
  PIPE_DIA_YN: "N",
  PIPE_DIA: "",
  JOB_BSNS_NM: "",
  USER_ID: userStore.userId,
  URGENT_YN : 'N',
  DNAG_TYPE: 'H',
  PSM_YN : 'N',
})

// 위험 작업분류 searchParams
const DangSearch = reactive({
  CMPNY_DIV: datainer.value.CMPNY_DIV,
  BSNS_CD: "",
  RCV_TYPE: datainer.value.RCV_TYPE,
  SHIP_TYPE: "",
  WRK_DIST: "",
  GBN :'1',
  // 단기공사
  JOB_LPLC: "",
  JOB_MPLC: "",
  JOB_SPLC: "",
  DEPT_CD: "",
})

// 초기 관리감독자 
const init_mngr_emp_no = ref('')

// 장소
const Location = reactive({
  CMPNY_DIV: datainer.value.CMPNY_DIV,
  JOB_LMPLC: "",
  DOCK: "",
})
const isValueSearch = ref(false)
const nonHEIGHT = ref(true)
const nonPRESSURE = ref(true)
const nonPIPE_DIA = ref(true)
const isH = ref(false) // 협력사 admin인지 여부 -> PKG_SAFBA0010.SEARCH_18 로 찾음
const intCode = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), // 사업부
    getCodeList("HHIE160"), // 허가구분21
    getCodeList("HHIE100CODE000"), // 진행상태
    getCodeList("200E150", userStore.cmpnyDiv), // 작업구분
    getCodeList("200E120", userStore.cmpnyDiv), //위험구분
    commonSearchApi({
       queryId: "SAFBA0010_ELEC_SEARCH_04",
       param: DangSearch,
     }),

    // 작업준비사항(일렉용)
    commonSearchApi({
      queryId: "SAFBA0010_ELEC_SEARCH_24",
      param: { CMPNY_DIV: userStore.cmpnyDiv, RCV_NO: '', },
    }),
    
  ]).then((res) => {
    codeList.company = res[0].ORESULTCUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    grdMain.value.setBindingColumn("CF_DIV", res[2].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("STATUS", res[3].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("DANG_DIV", res[5].ORESULT_CUR, "COD", "TXT")
    console.log(res[4].ORESULT_CUR, "ddd")
    codeList.WRK_PLC = res[4].ORESULT_CUR.filter((x) => x.CODE_DESC1 !== "Y")
    codeList.WRK_PLC.unshift({ COD: "", TXT: "전체" })
    console.log('res[5].ORESULT_CUR ', res[5].ORESULT_CUR)
    codeList.DANG_DIV1 = res[5].ORESULT_CUR.filter((x) => x.COD !== "E03" )
    codeList.DANG_DIV1.unshift({ COD: "", TXT: "전체" })
    codeList.DANG_DIV2 = res[5].ORESULT_CUR
    codeList.DANG_DIV2.unshift({ COD: "", TXT: "전체" })

    
    grdSub2.value.getDataProvider().setRows(res[6].ORESULT_CUR)
    grdSub3.value.getDataProvider().setRows(res[7].ORESULT_CUR)

    // 작업준비 및 안전조치사항에 필터 적용함.
    grdSub3.value.getGridView().setColumnProperty("GUBUN_DESC", "autoFilter", true);
   
  })
}


//  팝업 관련

const ReSetData = () => {
  datainer.value = {}
  DateInt.value = [{ date: "", dt: "", time: "", DN_DIV: "" }]
  LocationType.value = ""
  datainer.value.DEPT_NM = userStore.asgnFullNm
  datainer.value.DEPT_CD = userStore.deptCd
  datainer.value.CMPNY_DIV = userStore.cmpnyDiv
  datainer.value.COMPANY = userStore.cmpnyDiv
  // datainer.value.JOB_BSNS_NM = userStore.asgnFullNm
  datainer.value.JOB_BSNS_CD = userStore.bsnsCd
  datainer.value.JOB_DEPT_CD = userStore.deptCd
  datainer.value.BSNS_CD = userStore.bsnsCd
  DangSearch.BSNS_CD = userStore.bsnsCd
  DangSearch.DANG_DIV = ""
  datainer.value.ASGN_CD = userStore.asgnCd
  datainer.value.STATUS = null
  // datainer.value.RESP_EMP_NM = userStore.empNm
  // datainer.value.RESP_EMP_NO = userStore.empNo
  // datainer.value.RESP_HP_NO = userStore.hndPhn
  // ? userStore.hndPhn.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
  // : ""
  console.log(userStore,'userStore')
  // datainer.value.RESP_TRS_NO = userStore.TRS_NO
  datainer.value.CONFINED_YN = "N"
  datainer.value.ARGN_YN = "N"
  datainer.value.ELEC_YN = "N"
  datainer.value.HEIGHT_YN = "N"
  datainer.value.PRESSURE_YN = "N"
  datainer.value.PIPE_DIA_YN = "N"
  datainer.value.HEIGHT = ""
  datainer.value.PRESSURE = ""
  datainer.value.PIPE_DIA = ""
  datainer.value.GBN = "1"
  datainer.value.ORGN_DIV = userStore.userDiv
  datainer.value.RCV_TYPECheck = true
  datainer.value.USER_ID = userStore.userId
  datainer.value.URGENT_YN = 'N'

  datainer.value.DANG_TYPE = 'H'
  datainer.value.PSM_YN = 'N'

  //isDan.value = false // Grid 초기화시에도 변경되어 여기서 변경 X



    // : ""
  console.log('****** datainer.value', datainer.value)
  // vm.$nextTick(() => {
    // LocationDisable.value = true

  // commonSearchApi({
  //   queryId: "SAFBA0010_SEARCH_16",
  //   param: datainer.value,
  // }).then((Gan) => {
  //   if (Gan.ORESULT_CUR.length != 0) {
  //     isGan.value = true
  //     codeList.MNGR_EMP_NO = Gan.ORESULT_CUR
  //   } else {
  //     isGan.value = false
  //   }
  // })
  // isDan.value = false
  // isValueSearch.value = false

  if (true) {
    DangSearch.BSNS_CD = datainer.value.BSNS_CD
    DangSearch.DEPT_CD = datainer.value.DEPT_CD
    commonSearchApi({
      queryId: "SAFBA0010_ELEC_SEARCH_04",
      param: DangSearch,
    }).then((res) => {
      grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  } else {
    DangSearch.JOB_LPLC = datainer.value.JOB_LPLC
    DangSearch.JOB_MPLC = datainer.value.JOB_MPLC
    DangSearch.JOB_SPLC = datainer.value.JOB_SPLC
    DangSearch.DEPT_CD = datainer.value.DEPT_CD
    DangSearch.BSNS_CD = datainer.value.BSNS_CD

    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_18",
      param: DangSearch,
    }).then((res) => {
      console.log("res", res)
      grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

const SafetyOpenDO = (Safety) => {
  if (Safety === "안전") {
    SafetyOpen.value = true
    console.log("gmgkgkgmgk", Safety)
    vm.$nextTick(() => {
      disabledSTATUS.value = true
      // 메인
      menuTitle.value.disableBtn("btnSteelApproved", true)
      menuTitle.value.disableBtn("btnApprove", true)
      menuTitle.value.disableBtn("btnTurnBack", true)
      menuTitle.value.disableBtn("btnApplication", true)
      menuTitle.value.disableBtn("btnReqCancel", true)
      menuTitle.value.disableBtn("btnPrintOutPermit", true)
      menuTitle.value.disableBtn("btnUpdate", true)
      // 위험작업 허가서 상세
      grdTitle.value.disableBtn("btnDelete", true)
      grdTitle.value.disableBtn("btnRowCopy", true)
      grdTitle.value.disableBtn("btnCreate", true)
      // 상세위치
      LocationDisable.value = true
      // grdTitle2.value.disableBtn("btnADD_LOCATION", true)
      // grdTitle2.value.disableBtn("btnDELETE_LOCATION", true)
    })
  }
  if (Safety === "현황") {
    SafetyOpen.value = true
    vm.$nextTick(() => {
      disabledSTATUS.value = true
      // 메인
      menuTitle.value.disableBtn("btnSteelApproved", true)
      menuTitle.value.disableBtn("btnApproveCancel", true)
      menuTitle.value.disableBtn("btnApprove", true)
      menuTitle.value.disableBtn("btnTurnBack", true)
      menuTitle.value.disableBtn("btnApplication", true)
      menuTitle.value.disableBtn("btnReqCancel", true)
      menuTitle.value.disableBtn("btnPrintOutPermit", false)
      // 위험작업 허가서 상세
      menuTitle.value.disableBtn("btnUpdate", true)
      grdTitle.value.disableBtn("btnDelete", true)
      grdTitle.value.disableBtn("btnRowCopy", true)
      grdTitle.value.disableBtn("btnCreate", true)
      // 상세위치
      LocationDisable.value = true
      // grdTitle2.value.disableBtn("btnADD_LOCATION", true)
      // grdTitle2.value.disableBtn("btnDELETE_LOCATION", true)
    })
  } else {
    SafetyOpen.value = false
  }
}

const openPopup = async (popupParam, Safety) => {
  console.log("popupParam", popupParam)
  console.log("Safety", Safety)
  console.log(userStore, "user")
  dialog.value = true
  rowChValue.value = null
  ALLDATA.value = []
  isRowChanged.value = null
  dataRow.value = null
  isValueSearch.value = true
  isDan.value = false

  // 관리
  vm.$nextTick(() => {
    intCode()
    SafetyOpenDO(Safety)
  })
  if (popupParam) {
    console.log("d,d")
    searchData(popupParam)
  } else {
    isValueSearch.value = false

    ReSetData()
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_16",
      param: datainer.value,
    }).then((Gan) => {
      if (Gan.ORESULT_CUR.length != 0) {
        isGan.value = true
        codeList.MNGR_EMP_NO = Gan.ORESULT_CUR
      } else {
        isGan.value = false
      }
    })
  }
}

// 권한관리
// const IsAdmin =()=>{
//   if(userStore.empNo !== )
//   menuTitle.value.disableBtn("btnSteelApproved", true)
//   menuTitle.value.disableBtn("btnApprove", true)
//   menuTitle.value.disableBtn("btnTurnBack", true)
// }

//
const openDept = (e) => {
  if (e === "작업") {
    isJob.value = true
  } else {
    isJob.value = false
  }
  deptPopup.value.openPopup({})
}
const openEmpPopup = (gbn) => {
  if (gbn === "작업") {
    gbnEmp.value = "job"
    empPopup.value.openPopup({ EMP_NM: datainer.value.RESP_EMP_NM })
  }
  if (gbn === "관리자") {
    gbnEmp.value = "gwan"
    empPopup.value.openPopup({ EMP_NM: datainer.value.MNGR_EMP_NM , BSNS_CD: datainer.value.BSNS_CD ,   ASGN_CD: datainer.value.ASGN_CD,
                            //DEPT_CD: datainer.value.DEPT_CD, 
                            IS_SAFBA0010: true })
  }
} 

const onDeptSelected = (row) => {
  if (!isJob.value) {
    datainer.value.DEPT_NM = row.ASGN_FULL_NM
    datainer.value.DEPT_CD = row.DEPT_CD
    datainer.value.CMPNY_DIV = row.CMPNY_DIV
    datainer.value.ORGN_DIV = row.ORGN_DIV
    datainer.value.BSNS_CD = row.BSNS_CD
    datainer.value.ASGN_CD = row.ASGN_CD
    DangSearch.BSNS_CD = row.BSNS_CD
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_16",
      param: datainer.value,
    }).then((Gan) => {
      if (Gan.ORESULT_CUR.length != 0) {
        isGan.value = true
        codeList.MNGR_EMP_NO = Gan.ORESULT_CUR
      } else {
        isGan.value = false
      }
    })
    isValueSearch.value = true

    datainer.value.MNGR_TRS_NO = ""
    datainer.value.MNGR_EMP_NM = ""
    datainer.value.MNGR_EMP_NO = ""
    datainer.value.MNGR_HP_NO = ""
  } 
  // else {
  //   // datainer.value.JOB_BSNS_CD = row.BSNS_CD
  //   // datainer.value.JOB_BSNS_NM = row.ASGN_FULL_NM
  //   // datainer.value.JOB_DEPT_CD =
  //   //   row.ORGN_DIV === "A" ? row.DEPT_CD : row.ASGN_CD 
  //   // if(row.ORGN_DIV === 'A'){
  //   //   isOUTCM.value = false
  //   // }
  //   // else{
  //   //   isOUTCM.value = true
  //   // }
  // }
}

const onEmpSelected = (row) => {
  console.log(row)
  // if (gbnEmp.value === "job") {
  //   datainer.value.RESP_EMP_NM = row.EMP_NM
  //   datainer.value.RESP_EMP_NO = row.EMP_NO
  //   datainer.value.RESP_HP_NO = row.HND_PHN
  //     ? row.HND_PHN.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
  //     : ""
  // }
  if (gbnEmp.value === "gwan") {
    datainer.value.MNGR_EMP_NM = row.EMP_NM
    datainer.value.MNGR_EMP_NO = row.EMP_NO
    datainer.value.MNGR_HP_NO = row.HND_PHN
      ? row.HND_PHN.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
      : ""
  }
  if (gbnEmp.value === "grd") {
    datainer.value.RESP_EMP_NM = row.EMP_NM
    datainer.value.RESP_EMP_NO = row.EMP_NO
    datainer.value.RESP_HP_NO = row.HND_PHN
      ? row.HND_PHN.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
      : ""
    console.log("row.EMP_NM", row.EMP_NM)
    grdMain.value
      .getDataProvider()
      .setValue(rowChValue.value, "RESP_EMP_NM", row.EMP_NM)
    grdMain.value
      .getDataProvider()
      .setValue(rowChValue.value, "RESP_EMP_NO", row.EMP_NO)
    grdMain.value
      .getDataProvider()
      .setValue(rowChValue.value, "RESP_HP_NO", datainer.value.RESP_HP_NO)
  
    // grdMain.value
    //   .getDataProvider()
    //   .setValue(rowChValue.value, "APP_JOB_TIT", row.JOB_TIT_CD)
  }
}

const openCCP = () => {
  let rowLength = grdMain.value.getGridView().getItemCount()
  if (rowLength === 0) {
    return Message.warn(t("상단 그리드에서 행추가 이후 이용해주시기바랍니다."))
  }
  if (
    datainer.value.STATUS == 20 ||
    datainer.value.STATUS == 21 ||
    !datainer.value.STATUS
  ) {
    CCP.value.openPopup("장소")
  } else {
    return Message.warn(t("신청전 에만 변경이 가능합니다."))
  }
}

const selected = (row) => {
  if (
    datainer.value.STATUS == 20 ||
    datainer.value.STATUS == 21 ||
    !datainer.value.STATUS
  ) {
    datainer.value.JOB_LPLC = row[0].COD
    datainer.value.JOB_MPLC = row[1].COD
    datainer.value.JOB_SPLC = row[2].COD
    datainer.value.JOB_PLC = row[2].TXT
    datainer.value.WRK_PLC = row[2].CODE_DESC6
    console.log(row, "rowrowrowrowrowrow")
    if (
      rowChValue.value !== "" ||
      rowChValue.value !== null ||
      rowChValue.value !== undefined
    ) {
      grdMain.value
        .getDataProvider()
        .setValue(rowChValue.value, "WRK_PLCNM", row[2].TXT)
      grdMain.value
        .getDataProvider()
        .setValue(rowChValue.value, "WRK_PLC", row[2].CODE_DESC6)
    }

    Location.DOCK = row[2].CODE_DESC2
    Location.JOB_PLC_DTL_YN = row[2].CODE_DESC4
    datainer.value.JOB_PLC_DTL_YN = row[2].CODE_DESC4
    console.log(datainer.value.JOB_PLC_DTL_YN, "JOB_PLC_DTL_YN")
    if (isDan.value) {
      DangSearch.JOB_LPLC = datainer.value.JOB_LPLC
      DangSearch.JOB_MPLC = datainer.value.JOB_MPLC
      DangSearch.JOB_SPLC = datainer.value.JOB_SPLC
      DangSearch.DEPT_CD = datainer.value.JOB_BSNS_CD

      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_18",
        param: DangSearch,
      }).then((res) => {
        grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }
  }
}

watch(
  () => datainer.value.WORK_NO,
  (newValue) => {
    if (newValue) {
      grdMain.value
        .getDataProvider()
        .setValue(
          rowChValue.value,
          "WRK_PLCNM",
          `${datainer.value.JOB_PLC} - ${newValue}`
        )
    }
  }
)




const DateCheck = () => {

  // 신청 및 승인 가능 여부 

  let flag = true

  const nowDt = dayjs() // 현재 날짜
  const WorkDay = dayjs(datainer.value.WORK_DT) // 작업 날짜
  let row = grdMain.value.getDataProvider().getJsonRow(rowChValue.value)
  if (!isDan.value) {
    if (datainer.value.WRK_PLC === "01") {
      if (datainer.value.JOB_BSNS_CD === "AK00") {
        if (
          nowDt.hour() >= 15 &&
          nowDt.add(1, "day").isSame(WorkDay, "day")
        ) {
          Message.warn(
            "내업작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
          )
          return flag = false
        }
      } else {
        if (
          nowDt.hour() >= 15 &&
          nowDt.add(1, "day").isSame(WorkDay, "day")
        ) {
          Message.warn(
            "내업작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
          )
          return flag = false
        }
      }
    } else {
      if (datainer.value.DN_DIV === "D") {
        if (datainer.value.JOB_BSNS_CD === "AK00") {
          if (
            nowDt.hour() >= 15 &&
            nowDt.add(1, "day").isSame(WorkDay, "day")
          ) {
            Message.warn(
              "주간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
            )
            return flag = false
          }
        } else {
          if (
            nowDt.hour() >= 15 &&
            nowDt.add(1, "day").isSame(WorkDay, "day")
          ) {
            Message.warn(
              "주간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
            )
            return flag = false
          }
        }
      } else {
        if (
          nowDt.hour() >= 15 &&
          nowDt.add(1, "day").isSame(WorkDay, "day")
        ) {
          Message.warn(
            "야간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
          )
          return flag = false
        }
      }
    }

    // 작업일이 내일인 경우
    if (nowDt.add(1, "day").isSame(WorkDay, "day")) {
      if (datainer.value.WRK_PLC === "01") {
        if (datainer.value.JOB_BSNS_CD === "AK00") {
          if (
            nowDt.hour() >= 15 &&
            nowDt.add(1, "day").isSame(WorkDay, "day")
          ) {
            Message.warn(
              "내업작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
            )
            return flag = false
          }
        } else {
          if (
            nowDt.hour() >= 15 &&
            nowDt.add(1, "day").isSame(WorkDay, "day")
          ) {
            Message.warn(
              "내업작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
            )
            return flag = false
          }
        }
      } else {
        if (datainer.value.DN_DIV === "D") {
          if (datainer.value.JOB_BSNS_CD === "AK00") {
            if (
              nowDt.hour() >= 15 &&
              nowDt.add(1, "day").isSame(WorkDay, "day")
            ) {
              Message.warn(
                "주간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
              )
              return flag = false
            }
          } else {
            if (
              nowDt.hour() >= 15 &&
              nowDt.add(1, "day").isSame(WorkDay, "day")
            ) {
              Message.warn(
                "주간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
              )
              return flag = false
            }
          }
        } else {
          if (
            nowDt.hour() >= 15 &&
            nowDt.add(1, "day").isSame(WorkDay, "day")
          ) {
            Message.warn(
              "야간작업 승인은 작업전일 15:00까지 입니다. 작업일시를 확인하세요!"
            )
            return flag = false
          }
        }
      }
    }

    // 내업인 경우 위험작업 허가신청 마감시간 확인
    if (datainer.value.WRK_PLC === "01") {
      if (datainer.value.JOB_BSNS_CD === "AK00") {
        if (
          nowDt.hour() > 15 &&
          nowDt.add(1, "day").isAfter(WorkDay, "day")
        ) {
          Message.warn(
            "내업 위험작업 허가신청 마감시간은 작업 전일 15:00까지 입니다."
          ) 
          return flag = false
        }
      } else {
        if (
          nowDt.hour() > 15 &&
          nowDt.add(1, "day").isAfter(WorkDay, "day")
        ) {
          Message.warn(
            "내업 위험작업 허가신청 마감시간은 작업 전일 15:00까지 입니다."
          )
          return flag = false
        }
      }
    }

    // 과거일자가 포함된 공사인 경우
    if (nowDt.isAfter(WorkDay, "day")) {
      Message.warn("과거일자가 포함된 공사는 승인할 수 없습니다.")
      return flag = false
    }
  }

  return flag 


}
















//  작업 표준서

const WrkSelected1 = (row) => {
  const WSNM = row.map((i) => i.WS_NM).join(",")
  const WSNO = row.map((i) => i.WS_ID).join(",")

  grdMain.value.getDataProvider().setValue(rowChValue.value, "WRK_STD_NM", WSNM)
  grdMain.value.getDataProvider().setValue(rowChValue.value, "WRK_STD_NO", WSNO)
  grdMain.value.getDataProvider().setValue(rowChValue.value, "DAN_WORK_ID", null)
}
const WrkSelected2 = (row) => {
  const WSNM = row.map((i) => i.WRK_TITLE).join(",")
  const WSNO = row.map((i) => i.WRK_GUD_NO).join(",")

  grdMain.value.getDataProvider().setValue(rowChValue.value, "WRK_STD_NM", WSNM)
  grdMain.value.getDataProvider().setValue(rowChValue.value, "WRK_STD_NO", WSNO)
  grdMain.value.getDataProvider().setValue(rowChValue.value, "DAN_WORK_ID", null)
}

// 단기공사 작업 표준
const WrkSelected3 = (row) => {

  console.log('row ', row)
  console.log('datainer.value ', datainer.value)
  console.log('rowChValue.value :: ' , rowChValue.value)
  datainer.value.WRK_STD_NM = row.WRK_STD_NM
  datainer.value.DAN_WORK_ID = row.FILE_ID
  grdMain.value.getDataProvider().setValue(rowChValue.value, "WRK_STD_NM", row.WRK_STD_NM)
  grdMain.value.getDataProvider().setValue(rowChValue.value, "DAN_WORK_ID", row.FILE_ID)
  grdMain.value.getDataProvider().setValue(rowChValue.value, "WRK_STD_NO", null)
}



//  최초 실행시
const searchData = async (popupParam) => {

  console.log("searchData start")
  datainer.value = []
  DateInt.value = [{ DN_DIV: "" }]
  ALLDATA.value = []
  isRowChanged.value = null

  console.log("popupParam= " + popupParam.value)
  console.log("RCV_NO= " + popupParam.RCV_NO)
  
  // 상세조회
  await commonSearchApi({
    queryId: "SAFBA0010_ELEC_SEARCH_03",
    param: popupParam,
  }).then((res) => {

    let today = dayjs();
    let work_start_date = dayjs(res.ORESULT_CUR[0].WRK_DATE.split('~')[0].trim().split('~')[0].trim());
      
    if( today.diff(dayjs(work_start_date), 'day') >= 0) {
      CanBeCanceld.value = false
    }


    if (!res.ORESULT_CUR[0].DANG_DIV) {
      DangSearch.DANG_DIV = ""
    } else {
      DangSearch.DANG_DIV = res.ORESULT_CUR[0].DANG_DIV
    }

    console.log(res, "res")
    isSearch.value = true
    isValueSearch.value = false
    // isDan 단기공사 여부
    if (!res.ORESULT_CUR[0].SHORT_WORK_NO) {
      isDan.value = false
    } else {
      isDan.value = true
    }

    // 작업준비사항(일렉용)
    commonSearchApi({
      queryId: "SAFBA0010_ELEC_SEARCH_24",
      param: { CMPNY_DIV: userStore.cmpnyDiv, RCV_NO: popupParam.RCV_NO, },
    }).then((res) => {
      console.log("24res=" + res)
      grdSub3.value.getDataProvider().setRows(res.ORESULT_CUR)
    })


    commonSearchApi({
      queryId: "SAFBA0010_ELEC_SEARCH_19",   // SAFBA0010_SEARCH_18 을 탐
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        DEPT_CD: userStore.deptCd,
        EMP_NO: userStore.empNo,
      }
    })
    
  .then((Hres)=>{
    if(Hres.ORESULT_CUR.length !== 0){
      if(res.ORESULT_CUR[0].ASGN_CD === Hres.ORESULT_CUR[0].ASGN_CD){
        isH.value = true
      }
      }
      }),
      console.log(isH.value,'isH.value')





    res.ORESULT_CUR[0].WRKCHK = popupParam.WRKCHK
    console.log(res.ORESULT_CUR[0], "res.ORESULT_CUR[0]")
    // 상태 범위 (1 : 전체, 2 : 20이상, 3 : 30이상)
    datainer.value = res.ORESULT_CUR[0]

    init_mngr_emp_no.value = res.ORESULT_CUR[0].MNGR_EMP_NO
    console.log("init_mngr_emp_no: ", init_mngr_emp_no.value)

    DangSearch.BSNS_CD = res.ORESULT_CUR[0].BSNS_CD
    console.log(DangSearch.BSNS_CD, "DangSearch.BSNS_CDcheck")
    if (datainer.value.RCV_TYPE === "Q" && datainer.value.CON_YN === "Y") {
      datainer.value.RCV_TYPECheck = true
    }
    if (datainer.value.RCV_TYPE === "Q" && datainer.value.CON_YN === "N") {
      datainer.value.RCV_TYPECheck = false
    }
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    let cnt = -1
    let startarr = []
    let endTime = []

    if (res.ORESULT_CUR[0].ALL_START_TIME) {
      startarr = res.ORESULT_CUR[0].ALL_START_TIME.split(",")
      for (let i of startarr) {
        cnt++
        if (!DateInt.value[cnt]) {
          DateInt.value[cnt] = {}
        }
        DateInt.value[cnt].dt = dayjs(i).format("MM/DD")
      }
    }
    if (res.ORESULT_CUR[0].ALL_END_TIME) {
      endTime = res.ORESULT_CUR[0].ALL_END_TIME.split(",")
    }
    if (res.ORESULT_CUR[0].RESP_HP_NO) {
      res.ORESULT_CUR[0].RESP_HP_NO = res.ORESULT_CUR[0].RESP_HP_NO.replace(
        /(\d{3})(\d{4})(\d{4})/,
        "$1-$2-$3"
      )
    }

    startarr.forEach(
      (x, i) =>
        (DateInt.value[i].time = `${dayjs(x).format("HH:mm")} ~ ${dayjs(
          endTime[i]
        ).format("HH:mm")}`)
    )

    DateInt.value[0].DN_DIV = res.ORESULT_CUR[0].DN_DIV
    grdMain.value.getGridView().setCurrent(0)
    // 권한분류
    if (datainer.value.MNGR_EMP_NO !== userStore.empNo || !isH.value) {
      vm.$nextTick(() => {
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", false)
        menuTitle.value.setBtnProperty("btnApprove", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
      })
    } else {
      vm.$nextTick(() => {
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", true)
        menuTitle.value.setBtnProperty("btnApprove", "visible", true)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", true)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
      })
    }

    console.log("datainer.value.STATUS", datainer.value.STATUS)

    // if (datainer.value.RESP_EMP_NO !== userStore.empNo) {
    //   menuTitle.value.disableBtn("btnApplication", true)
    //   menuTitle.value.disableBtn("btnReqCancel", true)
    // } else {
    //   menuTitle.value.disableBtn("btnApplication", false)
    //   menuTitle.value.disableBtn("btnReqCancel", false)
    // }

    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_16",
      param: res.ORESULT_CUR[0],
    }).then((Gan) => {
      if (Gan.ORESULT_CUR.length != 0) {
        isGan.value = true
        codeList.MNGR_EMP_NO = Gan.ORESULT_CUR
      } else {
        isGan.value = false
      }
    })

    // if (DangSearch.DANG_DIV === 'E03') {
    //   let complexCd = res.ORESULT_CUR[0].WORK_COMPLEX_CD.split(',')
    //   console.log('complexCd ', complexCd)
    //   console.log('codeList. ', codeList.WORK_COMPLEX_CD)
    //   for(let i = 0; i < codeList.WORK_COMPLEX_CD.length; i++)  {
    //     for (let j = 0; j < complexCd.length; j++){
    //       if (codeList.WORK_COMPLEX_CD[i].COD === complexCd[j]) {
    //         codeList.WORK_COMPLEX_CD[i].VAL = 'Y'
    //       }
    //     }
    //   }
    // }
  })

  // 장소 조회 D / E
  if (LocationType.value === "D" || LocationType.value === "E") {
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_13",
      param: popupParam,
    }).then((res) => {
      if (LocationType.value === "D") {
        grdSub1_1.value.getDataProvider().setRows(res.ORESULT_CUR)
      }
      if (LocationType.value === "E") {
        grdSub1_2.value.getDataProvider().setRows(res.ORESULT_CUR)
      }
    })
  }

  if (LocationType.value === "B") {
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_14",
      param: popupParam,
    }).then((res) => {
      console.log(res, "resb")
      grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }

}

// SMS
const SmsSend = () => {
  let msg = `신청하신 위험작업허가서가 승인 취소 되었습니다.`
  let smsParam = {
    EMPNO_FROM: datainer.value.MNGR_EMP_NO, //보내는사람 사번
    EMPNO_TO: datainer.value.RESP_EMP_NO, //받는사람 사번()
    SYSCODE: "000", //000고정
    FROM_P_NO: datainer.value.MNGR_HP_NO, //보내는사람 폰번호(조치자)
    TO_P_NO: datainer.value.RESP_HP_NO, //받는사람 폰번호(점검자)
    TITLE: msg, //제목,내용
  }
  commonSendSMS(smsParam)
}

// 버튼이벤트
const onButtonsClick = async (e, gubn) => {
  // console.log(e, gubn)
  if (gubn == "메인") {
    if (e == "btnClose") {
      close()
    }
    // 신청

    if (e == "btnApplication") {
      console.log('datainer.value.URGENT_YN', datainer.value.URGENT_YN)


      let row = grdMain.value.getDataProvider().getJsonRow(rowChValue.value)
      if (rowChValue.value === null || rowChValue.value === undefined) {
        Message.warn("신청할 행을 클릭하여 주십시오.")
        return
      }
      console.log("init_mngr_emp_no:  :  ", init_mngr_emp_no.value)
      if (init_mngr_emp_no.value === null){
        Message.warn("저장후 이용해주시기바랍니다.")
        return
      }
      if (!datainer.value.RCV_NO) {
        Message.warn("저장후 이용해주시기바랍니다.")
        return
      }
      if (!datainer.value.MNGR_EMP_NO) {
        Message.warn("저장후 이용해주시기바랍니다.")
        return
      }
      if (isDan.value) {
        if (beforeSave() === false) {
          return
        }
      }

      // 현재 날짜를 dayjs로 가져오기      

      if (!isDan.value) {
        if (datainer.value.STATUS !== "20" && datainer.value.STATUS !== "21") {
          Message.warn("작성중 / 부서 반려일때만 신청할수있습니다") 
          return
        }
        const nowDt = dayjs()
        const WorkDate = dayjs(datainer.value.WORK_DT)
        // 긴급작업이 아닐 때
        
        if(datainer.value.URGENT_YN === 'N' ){
          if (datainer.value.WRK_PLC === "01" ) {
            // 엔진 사업부인 경우 17시 까지 신청 / 승인 가능
            if (datainer.value.JOB_BSNS_CD === "AK00") {
              // 내업일 때 17시까지
              if (
                nowDt.hour() > 15 &&
                !nowDt.isSame(WorkDate, "day") &&
                nowDt.add(1, "day").isAfter(WorkDate)
              ) {
                Message.warn(
                  "[내업]위험작업 허가신청 마감시간은 작업 전일 15:00까지 입니다."
                )
                return
              }
            } else {
              // 내업일 때 18시까지
              if (
                nowDt.hour() > 15 &&
                !nowDt.isSame(datainer.value.WORK_DT, "day") &&
                nowDt.add(1, "day").isAfter(WorkDate)
              ) {
                Message.warn(
                  "[내업]위험작업 허가신청 마감시간은 작업 전일 15:00까지 입니다."
                )
                return
              }
            }
          } else {
            if (datainer.value.DN_DIV === "D") {
              // 엔진 사업부인 경우 17시 까지 신청 / 승인 가능
              if (datainer.value.JOB_BSNS_CD === "AK00") {
                if ( 
                  nowDt.hour() > 15 &&
                  !nowDt.isSame(WorkDate, "day") &&
                  nowDt.add(1, "day").isAfter(WorkDate)
                ) {
                  Message.warn(
                    "[주간]위험작업 허가신청 마감시간은 작업 전일 15:00까지 입니다."
                  )
                  return
                }
              } else {
                // 주간일 때 12시까지
                if (
                  nowDt.hour() > 15 &&
                  !nowDt.isSame(datainer.value.WORK_DT, "day") &&
                  nowDt.add(1, "day").isAfter(WorkDate)
                ) {
                  Message.warn(
                    "[주간]위험작업 허가신청 마감시간은 작업 전일 15:00까지 입니다"
                  )
                  return
                }
              }
            } else {
              // 야간일 때 18시까지
              if (
                nowDt.hour() > 15 &&
                !nowDt.isSame(WorkDate, "day") &&
                nowDt.add(1, "day").isAfter(WorkDate)
              ) {
                Message.warn(
                  "[야간]위험작업 허가신청 마감시간은 작업 전일 15:00까지 입니다."
                )
                return
              }
            }
          }
        }

        if (datainer.value.URGENT_YN === 'N' ){
          if (nowDt.isAfter(WorkDate, "day") || nowDt.isSame(WorkDate, "day")) {
            Message.warn("작업일자는 금일 또는 과거일자를 입력할 수 없습니다.")
            return
          }
        }

        // 단기공사일 경우 과거일자는 신청 금지
        
        if (nowDt.isAfter(WorkDate, "day")) {
          Message.warn("작업일자는 과거일자를 입력할 수 없습니다.")
          return
        }
      

      }
      // 날짜 끝
      // 허가서 신청 할 행을 선택
      if (
        rowChValue.value === null ||
        rowChValue.value === "" ||
        rowChValue.value === undefined
      ) {
        Message.warn("허가서 신청을 할 행을 클릭한다음 이용해주세요.")
        return
      }

      console.log('datainer.value ', datainer.value)
      console.log('datainer.value.URGENT_YN ', datainer.value.URGENT_YN)


      let saveParams = []
      saveParams.push(datainer.value)
      // 저장로직시작
      

      // if ((!isUrgent.value) && (DateCheck() === false)){
      //   return 
      // }         
      
   
      // onbtnsave()





      vm.$swal({
        title: t(`신청 하시겠습니까? <br>※주의※<br> 현재 선택되어있는 행만 신청이됩니다.<br> 그후 팝업이 닫히니 그리드안에 다른내용이 있다면 자동저장 되지않으니 <br>저장 후 이용하십시오.`),
        showCancelButton: true,
      }).then(async(swalRes) => {
        
  
        if (swalRes.isConfirmed === true) {
          await commonExecuteApi({
          queryId: "SAFBA0010_DELETE_08",
          list: [{CMPNY_DIV : datainer.value.CMPNY_DIV , RCV_NO : datainer.value.RCV_NO}],
        })


        saveData('신청')
        
          saveParams[0].USER_ID = userStore.userId
          commonExecuteApi({
            queryId: "SAFBA0010_SAVE_05",
            list: saveParams,
          })
            .then((res) => {
              if ((userStore.empNo === datainer.value.MNGR_EMP_NO) || isH.value) {
                samEmpNo.value = true
                onButtonsClick("btnApprove", "메인")
              } else {
                samEmpNo.value = false
                let approvalParams = {
                  CMPNY_DIV: datainer.value.CMPNY_DIV,
                  APPROVE_ID: datainer.value.RCV_NO,
                  APPROVE_GBN: "I",
                  FORM_ID: "SAFBA0010",
                  APP_EMP_NO: datainer.value.MNGR_EMP_NO,
                  // APP_REQ_DATE: dayjs(new Date()).format("YYYY-MM-DD"),
                  PATH: "/30_safety/SAF_B/SAFBA0010",
                  USER_ID: userStore.userId,
                  APP_REQ_EMP_NO: userStore.userId,
                }
                console.log("내부 결재 상신 전 내부결재 데이터 확인", approvalParams)
                commonExecuteApi({
                  queryId: "OPRAB0010_SAVE_01",
                  list: [approvalParams],
                }).then((APres) => {
                  close()
                })
              }
              // grdMain.value
              //   .getDataProvider()
              //   .setValue(rowChValue.value, "STATUS", "25")
              // datainer.value.STATUS = "25"
            })
            .catch((err) => {
              console.log(err)
            })
        }
      })

    }
    // 신청취소
    if (e == "btnReqCancel") {
      if (!datainer.value.RCV_NO) {
        Message.warn("저장후 이용해주시기바랍니다.")
        return
      }
      if (datainer.value.STATUS !== "25") {
        Message.warn("승인대기일때만 허가 가능합니다.")
        return
      }
      if (
        rowChValue.value === null ||
        rowChValue.value === "" ||
        rowChValue.value === undefined
      ) {
        Message.warn("허가서 신청취소를 할 행을 클릭한다음 이용해주세요.")
        return
      }
      let saveParams = []
      saveParams.push(datainer.value)
      // 저장로직시작
      vm.$swal({
        title: t("허가서 신청을 취소하시겠습니까?"),
        showCancelButton: true,
      }).then((swalRes) => {
        if (swalRes.isConfirmed === true) {
          commonExecuteApi({
            queryId: "SAFBA0010_DELETE04",
            list: saveParams,
          })
            .then((res) => {
              grdMain.value
                .getDataProvider()
                .setValue(rowChValue.value, "STATUS", "20")
              datainer.value.STATUS = "20"
              close()
            })
            .catch((err) => {
              console.log(err)
            })
        }
      })
    }

    // 승인
    if (e == "btnApprove") {
      if (
        rowChValue.value === null ||
        rowChValue.value === "" ||
        rowChValue.value === undefined
      ) {
        Message.warn("허가서 승인 할 행을 클릭한다음 이용해주세요.")
        return
      }
    
      if (datainer.value.URGENT_YN === 'N'){
        if(DateCheck() === false){
          return 
        }
    }

      // 내업인 경우 작업일시 확인

      if ((userStore.empNo !== datainer.value.MNGR_EMP_NO) && (!isH.value) ) {
        if (datainer.value.STATUS !== "25" && datainer.value.STATUS !== "41") {
          Message.warn("승인대기 / 승인취소 일때만 승인 가능합니다.")
          return
        }
      }
      let saveParams = []
      saveParams.push(datainer.value)



      vm.$swal({
        title: t("허가서를 승인 하시겠습니까?"),
        showCancelButton: true,
      }).then(async(swalRes) => {
        if (swalRes.isConfirmed === true) {

          let isCrossed = 'N'  // 병행 여부

          // 2. 병행 여부 체크 
          let oresult = await commonSearchApi({queryId: "SAFBA0010_SEARCH_15", param: datainer.value})
          if (oresult.ORESULT_CUR.length === 0) {
            isCrossed = 'N' // 병행 여부
          }
          else {
            isCrossed = 'Y' // 병행 여부
          }

          console.log('oresult2', oresult)
          console.log('병행작업 여부2', isCrossed)
          console.log('긴급작업 여부2', datainer.value.URGENT_YN)
          console.log('datainer.value', datainer.value)

          // 병행작업 또는 긴급작업의 경우 안전승인 절차
          if ( isCrossed === 'Y' || datainer.value.URGENT_YN === 'Y'){

            SafeAppPop.value.openPopup(isCrossed, datainer.value.URGENT_YN, datainer.value.CMPNY_DIV, datainer.value.RCV_NO)
          }

          else {
              commonExecuteApi({
                queryId: "SAFBA0010_SAVE_06",
                list: saveParams,
              })
                .then((res) => {
                  grdMain.value
                    .getDataProvider()
                    .setValue(rowChValue.value, "STATUS", "50")
                  datainer.value.STATUS = "50"
                  close()
                })
                .catch((err) => {
                  console.log(err)
                })
          }
          // // 병행 체크
          // commonSearchApi({
          //   queryId: "SAFBA0010_SEARCH_15",
          //   param: datainer.value,
          // }).then((res) => {
          //   // console.log(res, "res")
          //   if (res.ORESULT_CUR.length === 0) {
          //     commonExecuteApi({
          //       queryId: "SAFBA0010_SAVE_06",
          //       list: saveParams,
          //     })
          //       .then((res) => {
          //         grdMain.value
          //           .getDataProvider()
          //           .setValue(rowChValue.value, "STATUS", "50")
          //         datainer.value.STATUS = "50"
          //         close()
          //       })
          //       .catch((err) => {
          //         console.log(err)
          //       })
          //   } else {
          //     saveParams[0].GBN = '3'
              
          //     commonExecuteApi({
          //       queryId: "SAFBA0010_SAVE_09",
          //       list: [{
          //        CMPNY_DIV : selectRow.CMPNY_DIV,
          //        RCV_NO : selectRow.RCV_NO,
          //        STATUS : '35', // 안전승인대기
          //        USER_ID : userStore.empNo
          //       }],
          //     })
          //       .then((res) => {
          //         grdMain.value
          //           .getDataProvider()
          //           .setValue(rowChValue.value, "STATUS", "35")
          //         datainer.value.STATUS = "35"
          //         Message.warn(
          //           " 신청하신 작업 공간에 병행되는 작업이 계획되어 있습니다. 해당 작업팀과 사전에 협의하시어 혼재작업 없이 진행해 주시기 바랍니다."
          //         )
          //         close()
          //       })
          //       .catch((err) => {
          //         console.log(err)
          //       })

          //   }
          //  }
          // )  }
          // if (swalRes.isConfirmed === false) {
          //   if (samEmpNo.value) {
          //     let approvalParams = {
          //       CMPNY_DIV: datainer.value.CMPNY_DIV,
          //       APPROVE_ID: datainer.value.RCV_NO,
          //       APPROVE_GBN: "I",
          //       FORM_ID: "SAFBA0010",
          //       APP_EMP_NO: datainer.value.MNGR_EMP_NO,
          //       // APP_REQ_DATE: dayjs(new Date()).format("YYYY-MM-DD"),
          //       PATH: "/30_safety/SAF_B/SAFBA0010",
          //       USER_ID: userStore.userId,
          //       APP_REQ_EMP_NO: userStore.userId,
          //     }
          //     console.log("결재 상신 전 내부결재 데이터 확인", approvalParams)
          //     commonExecuteApi({
          //       queryId: "OPRAB0010_SAVE_01",
          //       list: [approvalParams],
          //     }).then((APres) => {
          //       close()
          //     })
          //   }
          //  }

      }})
    }

    if (e == "btnTurnBack") {



      if (
        rowChValue.value === null ||
        rowChValue.value === "" ||
        rowChValue.value === undefined
      ) {
        Message.warn("허가서 반려 할 행을 클릭한다음 이용해주세요.")
        return
      }
      if (datainer.value.STATUS !== "25") {
        Message.warn("승인대기 일때만 반려 가능합니다.")
        return
      }

      console.log("hmhl")
      let saveParams = []
      saveParams.push(datainer.value)
      vm.$swal({
        title: t("허가서 신청을 반려하시겠습니까?"),
        showCancelButton: true,
      }).then((swalRes) => {
        if (swalRes.isConfirmed === true) {
          commonExecuteApi({
            queryId: "SAFBA0010_DELETE05",
            list: saveParams,
          })
            .then((res) => {
              datainer.value.STATUS = "21"
              grdMain.value
                .getDataProvider()
                .setValue(rowChValue.value, "STATUS", "21")

              close()
            })
            .catch((err) => {
              console.log(err)
            })
        }
      })
    }

    if (e == "btnApproveCancel") {


      if (
        rowChValue.value === null ||
        rowChValue.value === "" ||
        rowChValue.value === undefined
      ) {
        Message.warn("승인취소 할 행을 클릭한다음 이용해주세요.")
        return
      }
      if (datainer.value.STATUS !== "50") {
        Message.warn("승인완료 일때만 반려 가능합니다.")
        return
      }
      datainer.value.GBN ='3'
      let saveParams = []
      saveParams.push(datainer.value)
      vm.$swal({
        title: t("승인취소를 하시겠습니까?"),
        showCancelButton: true,
      }).then((swalRes) => {
        if (swalRes.isConfirmed === true) {
          commonExecuteApi({
            queryId: "SAFBA0010_DELETE05",
            list: saveParams,
          })
            .then((res) => {
              
              if (res.list[0].RES_COD === '-100'){
                Message.warn("작업 시작일이 금일 또는 금일 이전인 허가서는 승인 취소가 불가능합니다. ")
                return
              }

              datainer.value.STATUS = "41"
              grdMain.value
                .getDataProvider()
                .setValue(rowChValue.value, "STATUS", "41")
              SmsSend()
              close()
            })
            .catch((err) => {
              console.log(err)
            })
        }
      })
    }

    if (e == "btnSteelApproved") {
      if (
        rowChValue.value === null ||
        rowChValue.value === "" ||
        rowChValue.value === undefined
      ) {
        Message.warn("허가서 승인 할 행을 클릭한다음 이용해주세요.")
        return
      }
      if (datainer.value.STATUS !== "25" && datainer.value.STATUS !== "41") {
        Message.warn("승인대기 / 승인취소 일때만 승인 가능합니다.")
        return
      }
      let saveParams = []
      saveParams.push(datainer.value)
      vm.$swal({
        title: t("허가서를 승인 하시겠습니까?"),
        showCancelButton: true,
      }).then((swalRes) => {
        if (swalRes.isConfirmed === true) {
          commonExecuteApi({
            queryId: "SAFBA0010_SAVE_06",
            list: saveParams,
          })
            .then((res) => {
              grdMain.value
                .getDataProvider()
                .setValue(rowChValue.value, "STATUS", "50")
              datainer.value.STATUS = "50"
              close()
            })
            .catch((err) => {
              console.log(err)
            })
        }
      })
    }

    if (e == "btnPrintOutPermit") {
      if (datainer.value.STATUS != "50" && datainer.value.STATUS != "35") {
        Message.warn("승인완료/ 승인확정대기 상태일때만 신청할수있습니다")
        return
      }
      if (
        rowChValue.value === null ||
        rowChValue.value === undefined ||
        rowChValue.value === ""
      ) {
        Message.warn("출력할행을 지정해주십시오.")
        return
      }
      setPrint()
    }

    if (e === "btnUpdate") {
      console.log("btnuuu")
      new saveFlowHelper(vm, t)
        .setBefore(beforeSave)
        .setQuery(saveData)
        .setAfter(() => {init_mngr_emp_no.value = datainer.value.MNGR_EMP_NO})
        .run()


    }
  }

  if (gubn == "위험작업허가서상세") {
    if (e == "btnCreate") {
      rowChValue.value = ""
      console.log(isRowChanged.value, "isRowChanged")
      // 기존데이터를 추가하고 기존 데이터가 있으면 그 데이터를 덮어씌운다.
      if (isRowChanged.value !== null) {
        console.log(DateInt.value, "DateInt.asdasdasvalue")
        if (
          ALLDATA.value[isRowChanged.value] &&
          ALLDATA.value[isRowChanged.value].Main
        ) {
          ALLDATA.value[isRowChanged.value].Main = datainer.value
          ALLDATA.value[isRowChanged.value].Date = DateInt.value
          ALLDATA.value[isRowChanged.value].LocationType = LocationType.value
          ALLDATA.value[isRowChanged.value].Dan = isDan.value
          if (LocationType.value === "D") {
            ALLDATA.value[isRowChanged.value].Location = grdSub1_1.value
              .getDataProvider()
              .getJsonRows()
          }
          if (LocationType.value === "E") {
            ALLDATA.value[isRowChanged.value].Location = grdSub1_2.value
              .getDataProvider()
              .getJsonRows()
          }
          if (LocationType.value === "B") {
            ALLDATA.value[isRowChanged.value].Location = grdSub1.value
              .getDataProvider()
              .getJsonRows()
          }
        } else {
          let Location = []
          if (LocationType.value === "D") {
            let rowLength = grdSub1_1.value.getGridView().getItemCount()
            if(rowLength !== 0){
              Location = grdSub1_1.value.getDataProvider().getJsonRows()
            }
          }
          if (LocationType.value === "E") {
            let rowLength = grdSub1_2.value.getGridView().getItemCount()
            if(rowLength !== 0){
              Location = grdSub1_2.value.getDataProvider().getJsonRows()
            }
          }
          if (LocationType.value === "B") {
            let rowLength = grdSub1.value.getGridView().getItemCount()
            if(rowLength !== 0){
              Location = grdSub1.value.getDataProvider().getJsonRows()

            }
          }
          let SaveData = {
            Main: { ...datainer.value },
            Date: { ...DateInt.value },
            LocationType: LocationType.value,
            Location: Location,
            Dan: isDan.value,
          }
          ALLDATA.value.push(SaveData)
        }
      }
      let grdCount = grdMain.value.getGridView().getItemCount()
      //포커스 마지막 행으로
      if (grdCount !== 0) {
        grdMain.value
          .getGridView()
          .setCurrent({ itemIndex: grdCount - 1, column: "WRK_PLCNM" })
        grdMain.value.getGridView().setFocus()
      }

      console.log(ALLDATA.value, "ALLDATA.value")
      grdMain.value.addRow({}, true)
      if (grdSub1.value) {
        grdSub1.value.getDataProvider().setRows(null)
      }
      if (grdSub1_1.value) {
        grdSub1.value.getDataProvider().setRows(null)
      }
      if (grdSub1_2.value) {
        grdSub1_2.value.getDataProvider().setRows(null)
      }
    }
    if (e === "btnRowCopy") {
      if (dataRow.value === null) {
        return Message.warn(t("복사할 행을 클릭한다음 이용해주세요."))
      }
      if (!datainer.value.DANG_DIV) {
        return Message.warn(
          t("아무것도 입력되지않은 데이터는 복사할 수 없습니다.")
        )
      }
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_16",
        param: datainer.value,
      }).then((Gan) => {
        if (Gan.ORESULT_CUR.length != 0) {
          isGan.value = true
          codeList.MNGR_EMP_NO = Gan.ORESULT_CUR
        } else {
          isGan.value = false
        }
      })

      if (ALLDATA.value[dataRow.value] && ALLDATA.value[dataRow.value].Main) {
        ALLDATA.value[dataRow.value].Main = datainer.value
        ALLDATA.value[dataRow.value].Date = DateInt.value
        ALLDATA.value[dataRow.value].LocationType = LocationType.value
        if (LocationType.value === "D") {
          ALLDATA.value[dataRow.value].Location = grdSub1_1.value
            .getDataProvider()
            .getJsonRows()
        }
        if (LocationType.value === "E") {
          ALLDATA.value[dataRow.value].Location = grdSub1_2.value
            .getDataProvider()
            .getJsonRows()
        }
        if (LocationType.value === "B") {
          ALLDATA.value[dataRow.value].Location = grdSub1.value
            .getDataProvider()
            .getJsonRows()
        }
      } else {
        let Location = []
        if (LocationType.value === "D") {
          Location = grdSub1_1.value.getDataProvider().getJsonRows()
        }
        if (LocationType.value === "E") {
          Location = grdSub1_2.value.getDataProvider().getJsonRows()
        }
        if (LocationType.value === "B") {
          Location = grdSub1.value.getDataProvider().getJsonRows()
        }
        let SaveData = {
          Main: { ...datainer.value },
          Date: { ...DateInt.value },
          LocationType: LocationType.value,
          Location: Location,
        }
        ALLDATA.value.push(SaveData)
      }

      let row = grdMain.value.getDataProvider().getJsonRow(dataRow.value)
      grdMain.value.addRow(
        {
          DANG_DIV: row.DANG_DIV,
          WRK_DIST: row.WRK_DIST,
          WRK_PLCNM: row.WRK_PLCNM,
          WRK_DATE: row.WRK_DATE,
          WRKCHK: row.WRKCHK,
          THREECHECKYN: row.THREECHECKYN,
          CF_DIV: row.CF_DIV,
          WORKER_CNT: row.WORKER_CNT,
          ADD_IN: row.ADD_IN,
          DNGR_RSN: row.DNGR_RSN,
          WRK_STD_NM: row.WRK_STD_NM,
          RESP_EMP_NM: row.RESP_EMP_NM,
          RESP_EMP_NO: row.RESP_EMP_NO,
          RESP_HP_NO: row.RESP_HP_NO,
          P_WRK_ID: row.P_WRK_ID,
          WRK_PLC: row.WRK_PLC,
          APP_EMP_NO: row.APP_EMP_NO,
          APP_TEL_NO: row.APP_TEL_NO,
          APP_JOB_TIT: row.APP_JOB_TIT,
          WRK_STD_NO: row.WRK_STD_NO,
          WORK_DETAIL: row.WORK_DETAIL,
          WORK_COMPLEX_CD: row.WORK_COMPLEX_CD
        },
        true
      )

      let Mobj = JSON.parse(JSON.stringify(ALLDATA.value[dataRow.value].Main))
      Mobj.STATUS = ""
      Mobj.RCV_NO = ""

      let Lobj = JSON.parse(
        JSON.stringify(ALLDATA.value[dataRow.value].Location)
      )
      if (Lobj.length !== 0) {
        Lobj[0].RCV_NO = ""
      }

      datainer.value = Mobj
      DateInt.value = ALLDATA.value[dataRow.value].Date
      LocationType.value = ALLDATA.value[dataRow.value].LocationType
      vm.$nextTick(() => {
        if (LocationType.value === "D") {
          grdSub1_1.value.getDataProvider().setRows([...Lobj])
        }
        if (LocationType.value === "E") {
          grdSub1_2.value.getDataProvider().setRows([...Lobj])
        }
        if (LocationType.value === "B") {
          grdSub1.value.getDataProvider().setRows([...Lobj])
        }
      })

      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_16",
        param: datainer.value,
      }).then((Gan) => {
        if (Gan.ORESULT_CUR.length != 0) {
          isGan.value = true
          codeList.MNGR_EMP_NO = Gan.ORESULT_CUR
        } else {
          isGan.value = false
        }
      })
    }
    if (e == "btnDelete") {
      let dataLength = grdMain.value.getGridView().getItemCount()
      if (rowChValue.value === null) {
        return Message.warn(t("선택된 행이없습니다."))
      }
      if (dataLength === 0) {
        return Message.warn(t("선택된 행이없습니다."))
      }

      if (
        ALLDATA.value[rowChValue.value] &&
        ALLDATA.value[rowChValue.value].Main
      ) {
        ALLDATA.value[rowChValue.value].Main = datainer.value
        ALLDATA.value[rowChValue.value].Date = DateInt.value
        ALLDATA.value[rowChValue.value].LocationType = LocationType.value
        ALLDATA.value[rowChValue.value].isDel = true
        if (LocationType.value === "D") {
          ALLDATA.value[rowChValue.value].Location = grdSub1_1.value
            .getDataProvider()
            .getJsonRows()
        }
        if (LocationType.value === "E") {
          ALLDATA.value[rowChValue.value].Location = grdSub1_2.value
            .getDataProvider()
            .getJsonRows()
        }
        if (LocationType.value === "B") {
          ALLDATA.value[rowChValue.value].Location = grdSub1.value
            .getDataProvider()
            .getJsonRows()
        }
      } else {
        let Location = []
        if (LocationType.value === "D") {
          Location = grdSub1_1.value.getDataProvider().getJsonRows()
        }
        if (LocationType.value === "E") {
          Location = grdSub1_2.value.getDataProvider().getJsonRows()
        }
        if (LocationType.value === "B") {
          Location = grdSub1.value.getDataProvider().getJsonRows()
        }
        let SaveData = {
          Main: { ...datainer.value },
          Date: { ...DateInt.value },
          LocationType: LocationType.value,
          Location: Location,
          isDel: true,
        }
        ALLDATA.value.push(SaveData)
      }

      grdMain.value.getDataProvider().hideRows(rowChValue.value)
    }
  }
  if (gubn == "상세위치") {
    if (e === "btnADD_LOCATION") {
      if (LocationType.value == "B") {
        let code =
          datainer.value.JOB_LPLC +
          datainer.value.JOB_MPLC +
          datainer.value.JOB_SPLC

        grdSub1.value.addRow({
          DIV_M: "",
          DIV_S: "",
          DIV_L: code,
        })
      }
      console.log(LocationType.value, "LocationType.value")
      if (LocationType.value == "D") {
        if (!datainer.value.WORK_NO || !datainer.value.JOB_PLC) {
          return Message.warn(t("호선/공사 와 장소를 선택해주세요."))
        }
        workPlacePopUp.value.openPopup(datainer.value, "D")
      }
      if (LocationType.value == "E") {
        if (!datainer.value.WORK_NO || !datainer.value.JOB_PLC) {
          return Message.warn(t("호선/공사 와 장소를 선택해주세요."))
        }
        workPlacePopUp.value.openPopup(datainer.value, "E")
      }
    }

    if (e == "btnDELETE_LOCATION") {
      if (LocationType.value == "B") {
        grdSub1.value.getDataProvider().setOptions({softDeleting:false})
        
        let checkedRows = grdSub1.value.getGridView().getCheckedRows(true)


        

        if (checkedRows.length == 0) {
          return Message.warn(t("선택된 행이없습니다."))
        }
        if(datainer.value.RCV_NO){
          new deleteFlowHelper(vm, t)
          .setQuery(deleteDataB)
          .setAfter(() => {
            grdSub1.value.getDataProvider().removeRows(checkedRows )
          })
          .run()
        }
        else{

          grdSub1.value.getDataProvider().removeRows(checkedRows)
        }
        
      }
      if (LocationType.value == "D") {
        grdSub1_1.value.getDataProvider().setOptions({softDeleting:false})
        let checkedRows = grdSub1_1.value.getGridView().getCheckedRows(true)
        if (checkedRows.length == 0) {
          return Message.warn(t("선택된 행이없습니다."))
        }
        if(datainer.value.RCV_NO){
          new deleteFlowHelper(vm, t)
          .setQuery(deleteData)
          .setAfter(() => {
            grdSub1_1.value.getDataProvider().removeRows(checkedRows)
          })
          .run()
        }
        else{

          grdSub1_1.value.getDataProvider().removeRows(checkedRows)
        }

       
      }
      if (LocationType.value == "E") {
        grdSub1_2.value.getDataProvider().setOptions({softDeleting:false})
        let checkedRows = grdSub1_2.value.getGridView().getCheckedRows(true)
        let Rows = grdSub1_2.value.getDataProvider().getJsonRows()
        if (checkedRows.length == 0) {
          return Message.warn(t("선택된 행이없습니다."))
        }
        if(datainer.value.RCV_NO){
          new deleteFlowHelper(vm, t)
          .setQuery(deleteData)
          .setAfter(() => {
            grdSub1_2.value.getDataProvider().removeRows(checkedRows)
          })
          .run()
        }
        else{
       
          grdSub1_2.value.getDataProvider().removeRows(checkedRows)
        }
        
      }

    }
  }
}




const close = () => {
  DangSearch.DANG_DIV = ''
  dialog.value = false
  emit("upData")
}

const clearable = () => {}

//복합공정 신청
const radioList = async () => {
    //대분류
    commonSearchApi({
      queryId: "OUTBA0020_SEARCH_01",
      param: {
        CMPNY_DIV: 'HHI',
        ALL_UP_CD: 'HHIQ070',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
        PAGE_GBN: 'false',
        PAGE_NUM: '',
        PAGE_IDX: '',
      },
    }).then(res => { 
      if (res.ORESULT_CUR.length > 0) {

        console.log('res.HHIQ070 ', res.ORESULT_CUR)
        codeList.WORK_COMPLEX_CD = res.ORESULT_CUR

        for (let i = 0; i < codeList.WORK_COMPLEX_CD.length; i++){
          // console.log( 'comboData.radioList[i] : ',comboData.radioList[i])
          codeList.WORK_COMPLEX_CD[i].VAL = ''
        }

        let rowData = grdMain.value.getDataProvider().getJsonRow(rowChValue.value)
        console.log('rowData ', rowData)

        let complexCd = rowData.WORK_COMPLEX_CD.split(',')
        for(let i = 0; i < codeList.WORK_COMPLEX_CD.length; i++)  {
          for (let j = 0; j < complexCd.length; j++){
            if (codeList.WORK_COMPLEX_CD[i].COD === complexCd[j]) {
              codeList.WORK_COMPLEX_CD[i].VAL = 'Y'
            }
          }
        }

      }
  })
}

// 그리드
const grdProps1 = reactive({
  gridViewOption: { checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "WRK_DIST",
      dataType: "text",
      header: { text: t("위험작업분류") },
      editable: false,
      width: "300",
      // lookupDisplay: true,
      // editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        ret.styleName = "non-editable-add-DataRow"
        if (!dataCell.value) {
          return ret
        }
      },
    },
    {
      fieldName: "WORK_DETAIL",
      dataType: "text",
      header: { text: t("작업상세내용") },
      styleName: "left-column editable_column",
      styleCallback: function (grid, dataCell) {
        var ret = {}
        ret.styleName = "non-editable-add-DataRow"
        if (!dataCell.value) {
          return ret
        }
      },
    },
    {
      fieldName: "WRK_PLCNM",
      dataType: "text",
      header: { text: t("장소") },
      editable: false,
      styleCallback: function (grid, dataCell) {
        var ret = {}
        ret.styleName = "non-editable-add-DataRow"
        if (!dataCell.value) {
          return ret
        }
      },
    },
    {
      fieldName: "WRK_DATE",
      dataType: "text",
      header: { text: t("기간") },
      width: "200",
      editable: false,
      styleCallback: function (grid, dataCell) {
        var ret = {}
        ret.styleName = "non-editable-add-DataRow"
        if (!dataCell.value) {
          return ret
        }
      },
    },
    {
      fieldName: "WRKCHK",
      dataType: "text",
      header: { text: t("병행유무") },
      editable: false,
      displayCallback: function (grid, index, value) {
        return value === "Y1" || value === "Y2" ? "Y" : "N"
      },
    },
    {
      fieldName: "CF_DIV",
      dataType: "text",
      header: { text: t("허가구분") },
      editable: false,
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: "THREECHECKYN",
      dataType: "text",
      header: { text: t("점검대상") },
      editable: false,
    },

    {
      fieldName: "WORKER_CNT",
      dataType: "number",
      numberFormat: "#,###",
      styleName: "editable_column right-column",
      header: { text: t("인원") },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        ret.styleName = "non-editable-add-DataRow"
        if (!dataCell.value) {
          return ret
        }
      },
    },
    {
      fieldName: "RESP_EMP_NM",
      dataType: "text",
      header: { text: t("작업책임자") },
      editable: false,
      styleName: "editable_column",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          // console.log('cell',cell)
          // console.log('grid',grid)
          let data = ""
          if (cell.value) {
            data = cell.value
          }
          var str = `<div style="display: flex; justify-content: space-between;">
        <p style="width: 150px; overflow-x: auto;">${data}</p>
        <button id="cellButton"><span class="mdi mdi-magnify" style="font-size: 21px color:#666"></span></button>
        </div>`
          return str
        },
      },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        ret.styleName = "non-editable-add-DataRow"
        if (!dataCell.value) {
          return ret
        }
      },
    },
    {
      fieldName: "RESP_HP_NO",
      dataType: "text",
      header: { text: t("핸드폰 번호") },
      editable: false,
    },
    {
      fieldName: "DNGR_RSN",
      dataType: "text",
      header: { text: t("유해위험요소(전달사항)") },
      styleName: "editable_column left-column",
      width: "200",
      styleCallback: function (grid, dataCell) {
        var ret = {}
        ret.styleName = "non-editable-add-DataRow left-column"
        if (!dataCell.value) {
          return ret
        }
      },
    },
    {
      fieldName: "ADD_IN",
      dataType: "text",
      header: { text: t("추가정보") },
      editable: false,
      width: "60",
    },

    {
      fieldName: "WRK_STD_NM",
      dataType: "text",
      header: { text: t("작업표준") },
      editable: false,
      styleName: "editable_column",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          // console.log('cell',cell)
          // console.log('grid',grid)
          let data = ""
          if (cell.value) {
            data = cell.value
          }
          var str = `<div style="display: flex; justify-content: space-between;">
        <p style="width: 150px; overflow-x: auto;">${data}</p>
        <button id="cellButton"><span class="mdi mdi-magnify" style="font-size: 21px color:#666"></span></button>
        </div>`
          return str
        },
      },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        ret.styleName = "non-editable-add-DataRow"
        if (!dataCell.value) {
          return ret
        }
      },
    },

    {
      fieldName: "STATUS",
      dataType: "text",
      header: { text: t("진행상태") },
      lookupDisplay: true,
      editable: false,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
      visible: false,
    },
    {
      fieldName: "RCV_NO",
      dataType: "text",
      header: { text: t("작업허가번호") },
      editable: false,
      visible: false,
    },
    {
      fieldName: "SHORT_WORK_NO",
      dataType: "text",
      header: { text: t("단기공사번호") },
      editable: false,
      visible: false,
    },
    
    { fieldName: "WRK_PLC", visible: false, dataType: "text" },
    { fieldName: "APP_EMP_NO", visible: false, dataType: "text" },
    { fieldName: "APP_TEL_NO", visible: false, dataType: "text" },
    { fieldName: "APP_JOB_TIT", visible: false, dataType: "text" },
    { fieldName: "WRK_STD_NO", visible: false, dataType: "text" },
    { fieldName: "P_WRK_ID", visible: false, dataType: "text" },
    { fieldName: "RESP_EMP_NO", visible: false, dataType: "text" },
    { fieldName: "DANG_DIV", visible: false, dataType: "text" },
    { fieldName: "DAN_WORK_ID", visible: false, dataType: "text" },
    { fieldName: "WORK_COMPLEX_CD", visible: false, dataType: "text" },
    
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

// 그리드 이벤트
const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === "data") {
    dataRow.value = clickData.dataRow

    console.log('dataRow.value ', dataRow.value)
    isGrdint.value = true
  }
  if (!disabledSTATUS.value) {
    if (clickData.cellType === "data" && clickData.column === "WRK_DIST") {
      Message.warn(
        t("위험작업 분류에서 해당 작업을 더블클릭하여 입력해주시기 바랍니다")
      )
      isGrdint.value = true
    }
    if (clickData.cellType === "data" && clickData.column == "RESP_EMP_NM") {
      gbnEmp.value = "grd"
      empPopup.value.openPopup({})
      isGrdint.value = true
    }
    if (clickData.cellType === "data" && clickData.column == "WRK_STD_NM") {
      if (isDan.value) {
        console.log('datainer.value ', datainer.value)

        if (isEmpty(datainer.value.SHORT_WORK_NO)) {

          console.log('isEmpty(datainer.value.SHORT_WORK_NO) ', isEmpty(datainer.value.SHORT_WORK_NO), ' ::: ', datainer.value.SHORT_WORK_NO)
          
          Message.warn(t("단기공사번호 추가 후에 입력해 주시기 바랍니다."))
          return
        }

        console.log('clickData.dataRow :: ', clickData.dataRow)
          const getMainRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
          console.log('getMainRow :: ', getMainRow)
        // console.log('dataRow.value ', dataRow.value)
        //단기공사 일 경우 단기공사 회사에서 등록한 작업 표준 호출
        DanWrkPopup.value.openPopup(datainer.value)
        
      } else {
        //단기공사가 아닐 경우 HiSEs 작업표준 호출
        if (userStore.cmpnyDiv === "HHI" || userStore.cmpnyDiv === "230") {
          WrkPopup.value.openPopup(datainer.value)
          isGrdint.value = true
        } else {
          WrkPopup2.value.openPopup(datainer.value)
          isGrdint.value = true
        }
      }
    }
    if (clickData.cellType === "data" && clickData.column === "WRK_PLCNM") {
      Message.warn(t("작업장소에서 장소를 추가해 주시기 바랍니다"))
      isGrdint.value = true
    }
    if (clickData.cellType === "data" && clickData.column === "WRK_DATE") {
      Message.warn(t("작업일시에서 선택 해주시기 바랍니다."))
      isGrdint.value = true
    }
  }
}

const onCellDblClicked = (grid, clickData) => {
  console.log("onCellDblClicked start")
  if (clickData.cellType === "data") {
    let row = grdSub2.value.getDataProvider().getJsonRow(clickData.dataRow)
    console.log(row, "row")
    if (
      (rowChValue.value !== null && datainer.value.STATUS == 20) ||
      datainer.value.STATUS == 21 ||
      !datainer.value.STATUS
    ) {

      datainer.value.DANG_DIV = row.DANG_DIV
      // datainer.value.WRK_PLC = row.WRK_PLC
      datainer.value.P_WRK_ID = row.P_WRK_ID
      datainer.value.WRK_DIST = row.WRK_DIST

      let workComplexCd = ''

      console.log('datainer.value ', datainer.value)
      console.log('datainer.value.P_WRK_ID ', datainer.value.P_WRK_ID)
      // console.log('datainer.value ', datainer.value)

      if (datainer.value.P_WRK_ID === 'S999999') {

        let valChk = false
        

        console.log('codeList.WORK_COMPLEX_CD ', codeList.WORK_COMPLEX_CD)

        for (let i = 0; i < codeList.WORK_COMPLEX_CD.length; i++){
          console.log('codeList.WORK_COMPLEX_CD[i].VAL ', codeList.WORK_COMPLEX_CD[i].VAL)
          if (!isEmpty(codeList.WORK_COMPLEX_CD[i].VAL)) {
            workComplexCd = workComplexCd + ',' + codeList.WORK_COMPLEX_CD[i].COD
            valChk = true
          }
        }

        if (!isEmpty(workComplexCd)) {
          workComplexCd = workComplexCd.substring(1)
        }

        if (!valChk) {
          return Message.warn(t("한개 이상의 작업이 선택되어야 합니다."))
        }
      }



      console.log('workComplexCd ', workComplexCd)
      if (!isEmpty(workComplexCd)) {
        grdMain.value
        .getDataProvider()
        .setValue(rowChValue.value, "WORK_COMPLEX_CD", workComplexCd)
      }

      grdMain.value
        .getDataProvider()
        .setValue(rowChValue.value, "CF_DIV", row.CF_DIV)
      grdMain.value
        .getDataProvider()  
        .setValue(rowChValue.value, "DANG_DIV", row.DANG_DIV)
      // grdMain.value
      // .getDataProvider()
      // .setValue(rowChValue.value, "WRK_PLC", row.WRK_PLC)
      grdMain.value
        .getDataProvider()
        .setValue(rowChValue.value, "P_WRK_ID", row.P_WRK_ID)
      grdMain.value
        .getDataProvider()
        .setValue(rowChValue.value, "WRK_DIST", row.WRK_DIST)
      if (row.CF_DIV === "F" || row.CF_DIV === "S") {
        grdMain.value
          .getDataProvider()
          .setValue(rowChValue.value, "THREECHECKYN", "Y")
      } else {
        grdMain.value
          .getDataProvider()
          .setValue(rowChValue.value, "THREECHECKYN", "N")
      }
    } else {
      return Message.warn(t("신청전 에만 변경이 가능합니다. "))
    }
  }
}

const rowChanged = (grid, oldRow, newRow) => {
  if (newRow === -1) {
    return
  }
  rowChValue.value = newRow
  if (oldRow != -1) {
    if (ALLDATA.value[oldRow] && ALLDATA.value[oldRow].Main) {
      ALLDATA.value[oldRow].Main = datainer.value
      ALLDATA.value[oldRow].Date = DateInt.value
      ALLDATA.value[oldRow].LocationType = LocationType.value
      ALLDATA.value[oldRow].Dan = isDan.value

      if (LocationType.value === "D") {
        ALLDATA.value[oldRow].Location = grdSub1_1.value
          .getDataProvider()
          .getJsonRows()
      }
      if (LocationType.value === "E") {
        ALLDATA.value[oldRow].Location = grdSub1_2.value
          .getDataProvider()
          .getJsonRows()
      }
      if (LocationType.value === "B") {
        ALLDATA.value[oldRow].Location = grdSub1.value
          .getDataProvider()
          .getJsonRows()
      }
    } else {
      let Location = []
      if (LocationType.value === "D") {
        let rowLength = grdSub1_1.value.getGridView().getItemCount()
            if(rowLength !== 0){
              Location = grdSub1_1.value.getDataProvider().getJsonRows()
            }
      }
      if (LocationType.value === "E") {
        let rowLength = grdSub1_2.value.getGridView().getItemCount()
            if(rowLength !== 0){
              Location = grdSub1_2.value.getDataProvider().getJsonRows()
            }
      }
      if (LocationType.value === "B") {
        let rowLength = grdSub1.value.getGridView().getItemCount()
            if(rowLength !== 0){
              Location = grdSub1.value.getDataProvider().getJsonRows()
            }
      }
      let SaveData = {
        Main: { ...datainer.value },
        Date: { ...DateInt.value },
        LocationType: LocationType.value,
        Location: Location,
        Dan: isDan.value,
      }
      ALLDATA.value.push(SaveData)
    }
  }

  // 기존데이터가 있으면 데이터 보여주고 없으면 ReSet
  if (ALLDATA.value.length !== 0) {
    isRowChanged.value = newRow
    if (ALLDATA.value[newRow] && ALLDATA.value[newRow].Main) {
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_16",
        param: ALLDATA.value[newRow].Main,
      }).then((Gan) => {
        if (Gan.ORESULT_CUR.length != 0) {
          isGan.value = true
          codeList.MNGR_EMP_NO = Gan.ORESULT_CUR
        } else {
          isGan.value = false
        }
      })

      datainer.value = ALLDATA.value[newRow].Main
      DateInt.value = ALLDATA.value[newRow].Date
      LocationType.value = ALLDATA.value[newRow].LocationType
      isDan.value = ALLDATA.value[newRow].Dan
      vm.$nextTick(() => {
        if (LocationType.value === "D") {
          grdSub1_1.value
            .getDataProvider()
            .setRows(ALLDATA.value[newRow].Location)
        }
        if (LocationType.value === "E") {
          grdSub1_2.value
            .getDataProvider()
            .setRows(ALLDATA.value[newRow].Location)
        }
        if (LocationType.value === "B") {
          grdSub1.value
            .getDataProvider()
            .setRows(ALLDATA.value[newRow].Location)
        }
      })
    } else {
      ReSetData()
    }
  }

  let rowData = grdMain.value.getDataProvider().getJsonRow(newRow)
  datainer.value.DANG_DIV = rowData.DANG_DIV
}

//장소 그리드 B
const grdProps2 = reactive({
  gridViewOption: { edit: { editable: true }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: "DIV_M",
      dataType: "text",
      header: { text: t("장소 中") },
      lookupDisplay: true,
      editor: { type: "list", textReadOnly: true, dropDownWhenClick: true },
    },
    {
      fieldName: "DIV_S",
      dataType: "text",
      header: { text: t("장소 小") },
    },
    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "RCV_NO", visible: false },
    { fieldName: "SEQ_NO", visible: false },
    { fieldName: "DIV_L", visible: false },
  ],
  columns: [],
})

grdProps2.columns = grdProps2.fields

//장소 그리드 D
const grdProps2_1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: "DIV_L_NM",
      dataType: "text",
      header: { text: t("대분류") },
    },
    {
      fieldName: "DIV_M_NM",
      dataType: "text",
      header: { text: t("중분류") },
    },
    {
      fieldName: "DIV_S",
      dataType: "text",
      header: { text: t("블록") },
    },
    {
      fieldName: "DIV_DESC",
      dataType: "text",
      header: { text: t("상세위치") },
    },
    {
      fieldName: "PCS_DIV",
      dataType: "text",
      header: { text: t("P/C/S") },
    },
    {
      fieldName: "FMA_DIV",
      dataType: "text",
      header: { text: t("F/M/A") },
    },
    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "RCV_NO", visible: false },
    { fieldName: "SEQ_NO", visible: false },
    { fieldName: "DIV_L", visible: false },
    { fieldName: "DIV_M", visible: false },
    { fieldName: "DIV_S2", visible: false },
    { fieldName: "DIV_S3", visible: false },
  ],
  columns: [],
})

grdProps2_1.columns = grdProps2_1.fields

//장소 그리드 E
const grdProps2_2 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: [],
  fields: [
    {
      fieldName: "DIV_L_NM",
      dataType: "text",
      header: { text: t("구조물") },
    },
    {
      fieldName: "DIV_M_NM",
      dataType: "text",
      header: { text: t("대분류") },
    },
    {
      fieldName: "DIV_S_NM",
      dataType: "text",
      header: { text: t("중분류") },
    },
    {
      fieldName: "DIV_S2_NM",
      dataType: "text",
      header: { text: t("소분류") },
    },
    {
      fieldName: "DIV_S3_NM",
      dataType: "text",
      header: { text: t("세분류") },
    },
    {
      fieldName: "DIV_DESC",
      dataType: "text",
      header: { text: t("상세위치") },
    },

    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "RCV_NO", visible: false },
    { fieldName: "SEQ_NO", visible: false },
    { fieldName: "DIV_L", visible: false },
    { fieldName: "DIV_M", visible: false },
    { fieldName: "DIV_S2", visible: false },
    { fieldName: "DIV_S", visible: false },
    { fieldName: "DIV_S3", visible: false },
    { fieldName: "SEALED_CD", visible: false },
    { fieldName: "PSC", visible: false },
    { fieldName: "PCS_DIV", visible: false },
    { fieldName: "FMA_DIV", visible: false },
  ],
  columns: [],
})

grdProps2_2.columns = grdProps2_2.fields

//위험작업 구분 그리드
const grdProps3 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "WRK_PLC_NM",
      dataType: "text",
      header: { text: t("공종/계열") },
      editable: false,
      width:'120'
    },
    {
      fieldName: "WRK_DIST",
      dataType: "text",
      header: { text: t("위험작업 분류") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
      styleName: "left-column",
      width:'300'
    },
    {
      fieldName: "DANG_DIV_NM",
      dataType: "text",
      header: { text: t("작업종류") },
      editable: false,
      width:'150'
    },

    {
      fieldName: "CF_DIV_NM",
      dataType: "text",
      header: { text: t("허가구분") },
      editable: false,
    },
    {
      fieldName: "CMPNY_DIV",
      editable: false,
      visible: false,
    },
    {
      fieldName: "SEQ",
      editable: false,
      visible: false,
    },
    {
      fieldName: "WRK_PLC",
      editable: false,
      visible: false,
    },
    {
      fieldName: "DANG_DIV",
      editable: false,
      visible: false,
    },
    {
      fieldName: "CF_DIV",
      editable: false,
      visible: false,
    },
    {
      fieldName: "P_WRK_ID",
      editable: false,
      visible: false,
    },
  ],
  columns: [],
})

grdProps3.columns = grdProps3.fields

// 위험작업 작업준비 / 안전조치사항(일렉용)
const grdProps4 = reactive({
  gridViewOption: { edit: { editable: true }, checkBar: { visible: false } },
  keys: [],
  fields: [
  { fieldName: 'CMPNY_DIV' , dataType: 'text',  width: '80' , visible: false,  readOnly: false, header: { text: t('사업장구분')  }  }, 
	{ fieldName: 'RCV_NO' , dataType: 'text',  width: '80' , visible: false, readOnly: false, header: { text: t('허가번호')  }  }, 
  { fieldName: 'GUBUN' , dataType: 'text',  width: '80' , visible: true, readOnly: false, header: { text: t('GUBUN')  }  }, 
  { fieldName: 'GUBUN_DESC' , dataType: 'text',  width: '80' , readOnly: false, header: { text: t('구분')  } , 
      mergeRule: { criteria:"values['GUBUN_DESC'] + value" },
  }, 
	{ fieldName: 'ITEM_CD' , dataType: 'text',  width: '40' , readOnly: false, header: { text: t('항목코드')  }  }, 
	{ fieldName: 'ITEM_DESC' , dataType: 'text',  width: '250' , readOnly: false, header: { text: t('항목명')  }, styleName: "left-column",  }, 
	{ fieldName: 'WORK_YN' , dataType: 'text',  width: '40' , readOnly: false, header: { text: t('작업여부')  }, 
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }
    }, 
	
	{ fieldName: 'INSERT_USER_ID' , dataType: 'text',  width: '80' , visible: false,  readOnly: false, header: { text: t('작성자')  }  }, 
	{ fieldName: 'INSERT_DATE' , dataType: 'text',  width: '80' , visible: false, readOnly: false, header: { text: t('작성일')  } }, 
  ],
  columns: [],
})

grdProps4.columns = grdProps4.fields

const openDate = () => {
  let cnt = ""
  console.log(rowChValue.value, "rowChValue.value")
  if (
    rowChValue.value === null ||
    rowChValue.value === "" ||
    rowChValue.value === undefined
  ) {
    Message.warn(
      t("위험작업 허가서 상세에서 작업일시를 설정할 행을 클릭후 이용해주세요.")
    )
    return false
  }
  // let row = grdMain.value.getDataProvider().getJsonRow(rowChValue.value)
  var rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  let row = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  console.log("row=" + rowIdx)
  console.log("row.WRK_PLCNM=" + row.WRK_PLCNM)
  console.log("row.WRK_PLC=" + row.WRK_PLC)
  if (row.WRK_PLCNM === '' || row.WRK_PLCNM === undefined) {
    Message.warn(t("위험작업 허가서 상세에서 장소 부터 선택해주십시오."))
    return
  }

  if (!datainer.value.JOB_BSNS_CD) {
    Message.warn(t("작업 사업부/ 사업부를 선택후에 이용해주십시오."))
    return
  }

  //   // 해양 사업부 추가
  //   // 공통(99), 내업(01), 단기공사(10), 기타(09), 해양공사(13)
  console.log(datainer.value.JOB_BSNS_CD, datainer.value.WRK_PLC, "djmdnmdjk")
  if (
    datainer.value.JOB_BSNS_CD === "AC00" ||
    datainer.value.JOB_BSNS_CD === "AE00" ||
    datainer.value.JOB_BSNS_CD === "AQ00"
  ) {
    if (
      datainer.value.WRK_PLC === "01" ||
      datainer.value.WRK_PLC === "09" ||
      datainer.value.WRK_PLC === "10" ||
      datainer.value.WRK_PLC === "99" ||
      datainer.value.WRK_PLC === "13"
    ) {
      cnt = "7"
    } else {
      cnt = "3"
    }
  } else {
    cnt = "7"
  }

  DatePop.value.openPopup(cnt, isDan.value, datainer.value.URGENT_YN)

}

const DateInner = (e) => {
  let stratTime = []
  let OT = []

  DateInt.value = e.obj
  isDateint.value = true
  let endTime = []
  let workDt = dayjs(DateInt.value[0].ALL_START_TIME).format("YYYYMMDD")
  //
  let workint = dayjs(DateInt.value[0].ALL_START_TIME).format("YYYY-MM-DD")
  let workend = dayjs(
    DateInt.value[DateInt.value.length - 1].ALL_START_TIME
  ).format("YYYY-MM-DD")
  //
  DateInt.value.forEach((x) => {
    stratTime.push(x.ALL_START_TIME)
    endTime.push(x.ALL_END_TIME)
    OT.push(x.OT)
  })
  datainer.value.ALL_START_TIME = stratTime.join(",")
  datainer.value.ALL_END_TIME = endTime.join(",")
  datainer.value.ALL_OVERTIME_YN = OT.join(",")
  datainer.value.WORK_DT    = workDt
  datainer.value.DN_DIV     = DateInt.value[0].DN_DIV
  datainer.value.URGENT_YN  = (e.urgent === 'Y')?  'Y' : 'N'
  
  grdMain.value
    .getDataProvider()
    .setValue(rowChValue.value, "WRK_DATE", `${workint} ~ ${workend}`)

  console.log(DateInt.value, "DateInt.value")
}


const SafeAppComplished = (e) => {
  //datainer.value.STATUS = "41"
  close()
}




const itemProps = (item) => {
  return {
    title: item.WORK_NO,
    subtitle: `${item.SHIP_KIND_NM}　　　　　${
      !item.SHIP_CAPA ? "" : item.SHIP_CAPA
    }`,
  }
}

const workPlaceSelected = (e) => {
  if (LocationType.value === "D") {
    console.log(e, "e")
    if (grdSub1_1.value.getDataProvider().getRowCount() >= 5){
      Message.warn('5개 이상은 추가가 불가능합니다.')
      return
    }
    
    grdSub1_1.value.addRow(e)
    
  }
  if (LocationType.value === "E") {
    console.log(e, "1111e")
    if (grdSub1_2.value.getDataProvider().getRowCount() >= 5){
      Message.warn('5개 이상은 추가가 불가능합니다.')
      return
    }

    grdSub1_2.value.addRow(e)

  }
}

// 저장 메인

const beforeSave = () => {
  console.log(ALLDATA.value, "ALLDATA.value")
  grdMain.value.getGridView().resetCurrent()

  if (ALLDATA.value.length === 0) {
    // 위험허가서 상세 부분
    if (
      rowChValue.value === null ||
      rowChValue.value === "" ||
      rowChValue.value === undefined
    ) {
      Message.warn(t("위험작업 허가서 상세 데이터가 없습니다."))
      return false
    }
    let rowData = grdMain.value.getDataProvider().getJsonRow(rowChValue.value)


    if (isDan.value && !rowData.SHORT_WORK_NO){
      Message.warn(t( "기본정보 부분의 단기공사 번호가 입력되어있지 않습니다."))
      return false
    }

    // !rowData.WORK_DETAIL ||
    if (!rowData.DANG_DIV || !rowData.WORKER_CNT || !rowData.DNGR_RSN || !rowData.WRK_DATE) {
      console.log(
        rowData.WORK_DETAIL,
        rowData.DANG_DIV,
        rowData.WORKER_CNT,
        rowData.DNGR_RSN,
        rowData.WRK_DATE
      )
      Message.warn(
        t(
          "위험서가서상세 부분의 필수입력값이 입력되있지않습니다.<br> 필수입력 : 위험작업구분 , 인원, 유해위험요소 , 승인자,날짜"
        )
      )
      return false
    }
    // ||
    //   !rowData.APP_EMP_NM
    //   기본정보 부분

    if (
      !datainer.value.DANG_DIV ||
      !datainer.value.CMPNY_DIV ||
      !datainer.value.JOB_BSNS_CD ||
      !datainer.value.RESP_EMP_NM ||
      !datainer.value.RESP_HP_NO ||
      !datainer.value.MNGR_EMP_NO ||
      !datainer.value.MNGR_HP_NO
    ) {
      Message.warn(t("기본정보 부분의 필수입력값이 입력되있지않습니다."))
      console.log(datainer.value, "datainer.value")
      return false
    }

    if (
      datainer.value.RESP_HP_NO.length <= 8 &&
      datainer.value.MNGR_HP_NO <= 8
    ) {
      Message.warn(t("올바른 핸드폰 번호를 입력해주세요."))
      return false
    }

    // 추가정보
    if (
      !datainer.value.CONFINED_YN ||
      !datainer.value.ARGN_YN ||
      !datainer.value.ELEC_YN ||
      !datainer.value.HEIGHT_YN ||
      !datainer.value.PRESSURE_YN ||
      !datainer.value.PIPE_DIA_YN
    ) {
      Message.warn(t("추가정보 부분의 필수입력값이 입력되있지않습니다."))
      return false
    }
    if (datainer.value.HEIGHT_YN === "Y" && !datainer.value.HEIGHT) {
      Message.warn(t("고소작업를 입력해주세요"))
      return false
    }

    if (datainer.value.PRESSURE_YN === "Y" && !datainer.value.PRESSURE) {
      Message.warn(t("압력테스트를 입력해주세요"))
      return false
    }

    if (datainer.value.PIPE_DIA_YN === "Y" && !datainer.value.PIPE_DIA) {
      Message.warn(t("압력테스트PIPE직경을 입력해주세요"))
      return false
    }

    // 작업장소

    if (!datainer.value.JOB_PLC) {
      Message.warn(t("작업장소 부분의 필수입력값이 입력되있지않습니다."))
      return false
    }

    let checkRows = grdSub3.value.getGridView().getCheckedRows()
    if (checkRows.length === 0) {
      Message.warn(t("작업준비 및 안전조치사항 목록에서 작업여부를 선택하셔야 합니다."))
      return false
    }


    return true
  } else {
    let cnt = -1
    for (let i of ALLDATA.value) {
      cnt++
      if (!i.isDel) {
        let rowData = grdMain.value.getDataProvider().getJsonRow(cnt)


        if (isDan.value && !rowData.SHORT_WORK_NO){
          Message.warn(
            t(
              `${
                cnt + 1
              } 번째로 생성된 지시서의 기본정보 부분의 단기공사 번호가 입력되어있지 않습니다.`
            )
          )
          return false
        }

        // !rowData.WORK_DETAIL ||
        if (!rowData.DANG_DIV || !rowData.WORKER_CNT || !rowData.DNGR_RSN || !rowData.WRK_DATE) {
          Message.warn(
            t(
              `${
                cnt + 1
              } 번째로 생성된 위험서가서상세 부분의 필수입력값이 입력되있지않습니다.<br> 필수입력 : 위험작업구분,인원, 유해위험요소,날짜 `
            )
          )
          return false
        }
        // ||

        if (
          !i.Main.DANG_DIV ||
          !i.Main.CMPNY_DIV ||
          !i.Main.JOB_BSNS_CD ||
          !i.Main.RESP_EMP_NM ||
          !i.Main.RESP_HP_NO ||
          !i.Main.MNGR_EMP_NO ||
          !i.Main.MNGR_HP_NO
        ) {
          Message.warn(
            t(`${cnt + 1} 번째 의기본정보 필수입력값이 입력되있지않습니다.`)
          )
          return false
        }

        // 추가정보
        if (
          !i.Main.CONFINED_YN ||
          !i.Main.ARGN_YN ||
          !i.Main.ELEC_YN ||
          !i.Main.HEIGHT_YN ||
          !i.Main.PRESSURE_YN ||
          !i.Main.PIPE_DIA_YN
        ) {
          Message.warn(t("추가정보 부분의 필수입력값이 입력되있지않습니다."))
          return false
        }
        if (i.Main.HEIGHT_YN === "Y" && !i.Main.HEIGHT) {
          Message.warn(t("고소작업를 입력해주세요"))
          return false
        }

        if (i.Main.PRESSURE_YN === "Y" && !i.Main.PRESSURE) {
          Message.warn(t("고소작업를 입력해주세요"))
          return false
        }

        if (i.Main.PIPE_DIA_YN === "Y" && !i.Main.PIPE_DIA) {
          Message.warn(t("고소작업를 입력해주세요"))
          return false
        }

        if (!i.Main.JOB_PLC) {
          Message.warn(t(`${cnt + 1} 번째 작업장소 입력되있지않습니다.`))
          return false
        }
      }
    }

    return true
  }
}




const onbtnsave = () => {
  console.log("btnuuu")
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(() => {init_mngr_emp_no.value = datainer.value.MNGR_EMP_NO})
    .run()

}


const saveData = async(e) => {




  // 단건저장
  console.log('e',e)
  console.log('ALLDATA.value.length',ALLDATA.value.length)

  //saveParams[0].URGENT  = (datainer.value.URGENT_YN) ? 'Y' : 'N' 
  //saveParams[0].USER_ID = userStore.userId

  if (ALLDATA.value.length <= 1 || e === "신청") {
    console.log('신청 또는 단건저장 시작')
    let saveParams = []
    let stratTime = []
    let endTime = []
    let OT = []
    let objAssign = {}

    let workDt = dayjs(DateInt.value[0].ALL_START_TIME).format("YYYYMMDD") 
    if (isDateint.value) {
      isDateint.value = false
      DateInt.value.forEach((x) => {
        stratTime.push(x.ALL_START_TIME)
        endTime.push(x.ALL_END_TIME)
        OT.push(x.OT)
      })
      datainer.value.ALL_START_TIME = stratTime.join(",")
      datainer.value.ALL_END_TIME = endTime.join(",")
      datainer.value.ALL_OVERTIME_YN = OT.join(",")
      datainer.value.WORK_DT = workDt
      datainer.value.DN_DIV = DateInt.value[0].DN_DIV

    }

    if (datainer.value.JOB_BSNS_CD !== "AE00"  && 
        datainer.value.JOB_BSNS_CD !== "AC00"  && 
        datainer.value.JOB_BSNS_CD !== "AQ00") {
        datainer.value.WORK_NO = ""
        }


    // 도장 화기일 경우 PARA_CHK_YN Y
    if (
      datainer.value.DANG_DIV === "H00" ||
      datainer.value.DANG_DIV === "P00"
    ) {
      datainer.value.PARA_CHK_YN = "Y"
    } else {
      datainer.value.PARA_CHK_YN = "N"
    }

    if (datainer.value.RCV_TYPECheck === true) {
      datainer.value.CON_YN = "Y"
    }
    if (datainer.value.RCV_TYPECheck === false) {
      datainer.value.CON_YN = "N"
    }
    if (
      datainer.value.RCV_TYPECheck === null ||
      datainer.value.RCV_TYPECheck === undefined ||
      datainer.value.RCV_TYPECheck === ""
    ) {
      datainer.value.CON_YN = null
    }

    datainer.value.REQ_EMP_NO = userStore.empNo
    datainer.value.FORM_TYPE = "R2"
    if (
      datainer.value.STATUS === "" ||
      datainer.value.STATUS === null ||
      datainer.value.STATUS === undefined
    ) {
      datainer.value.STATUS = "20"
    }
    if (!isDan.value) {
      datainer.value.SHORT_WORK_NO = ""
    }

    let row = grdMain.value.getDataProvider().getJsonRow(rowChValue.value)
    objAssign = Object.assign({}, datainer.value, row)
    saveParams.push(objAssign)

    console.log('saveParams ', saveParams)

    //saveParams[0].URGENT  = (datainer.value.URGENT_YN) ? 'Y' : 'N' 
    //saveParams[0].USER_ID = userStore.userId

    return commonExecuteApi({
      queryId: "SAFBA0010_ELEC_SAVE_01",
      list: saveParams,
    }).then((mainres) => {


      isGrdint.value = false
      datainer.value.RCV_NO = mainres.list[0].RES_RCV_NO

      if (LocationType.value === "D" || LocationType.value === "E") {
        let checkedRows =
          LocationType.value === "D"
            ? grdSub1_1.value.getGridView().getCheckedRows(true)
            : grdSub1_2.value.getGridView().getCheckedRows(true)

        if (checkedRows.length === 0) {
          LocationType.value === "D"
            ? grdSub1_1.value.getGridView().checkAll()
            : grdSub1_2.value.getGridView().checkAll()

          checkedRows =
            LocationType.value === "D"
              ? grdSub1_1.value.getGridView().getCheckedRows(true)
              : grdSub1_2.value.getGridView().getCheckedRows(true)
        }
        let saveParams = []
        checkedRows.forEach((x) => {
          let row =
            LocationType.value === "D"
              ? grdSub1_1.value.getDataProvider().getJsonRow(x)
              : grdSub1_2.value.getDataProvider().getJsonRow(x)
          row.RCV_NO = mainres.list[0].RES_RCV_NO
          row.CMPNY_DIV = mainres.list[0].CMPNY_DIV
          saveParams.push(row)
          console.log(saveParams, "saveParams")
        })

   


        commonExecuteApi({
          queryId: "SAFBA0010_SAVE_02",
          list: saveParams,
        }).then((res) => {
          console.log("장소저장 D / E RES-----------", res)
          commonSearchApi({
            queryId: "SAFBA0010_SEARCH_13",
            param: datainer.value,
          }).then((res) => {
            console.log("TYPE D E ------------------")
            if (LocationType.value === "D") {
              grdSub1_1.value.getDataProvider().setRows(res.ORESULT_CUR)
            }
            if (LocationType.value === "E") {
              grdSub1_2.value.getDataProvider().setRows(res.ORESULT_CUR)
            }
          })
        })

      }

      if (LocationType.value === "B") {
        let checkedRows = grdSub1.value.getGridView().getCheckedRows(true)

        if (checkedRows.length === 0) {
          grdSub1.value.getGridView().checkAll()
          checkedRows = grdSub1.value.getGridView().getCheckedRows(true)
        }

        let saveParams = []
        checkedRows.forEach((x) => {
          let row = grdSub1.value.getDataProvider().getJsonRow(x)
          row.RCV_NO = mainres.list[0].RES_RCV_NO
          row.CMPNY_DIV = mainres.list[0].CMPNY_DIV
          saveParams.push(row)
        })
        console.log(row, "row")
        commonExecuteApi({
          queryId: "SAFBA0010_SAVE_03",
          list: saveParams,
        }).then((res) => {
          console.log("장소저장 B  RES-----------", res)
          commonSearchApi({
            queryId: "SAFBA0010_SEARCH_14",
            param: datainer.value,
          }).then((res) => {
            console.log("TYPE B ---------------")

            console.log(res, "resb")
            grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
          })
        })
      }

      // 작업준비 및 안전조치사항 목록 저장
      let saveParams2 = []

      // let checkedRows = grdSub3.value.getGridView().getCheckedRows(true)
      let checkedRows = grdSub3.value.getDataProvider().getRows()      

      console.log("checkedRows start")
      for (let row in checkedRows) {
        
        console.log("row=" + row)
        let jsonData = grdSub3.value.getDataProvider().getJsonRow(row)          

        jsonData.RCV_NO = mainres.list[0].RES_RCV_NO
        jsonData.CMPNY_DIV = mainres.list[0].CMPNY_DIV
        saveParams2.push(jsonData)
      }

      //checkedRows.forEach((x) => {
      //  console.log("x=" + x)
        // let row = grdSub3.value.getDataProvider().getJsonRow(x)          
        // row.RCV_NO = mainres.list[0].RES_RCV_NO
        // row.CMPNY_DIV = mainres.list[0].CMPNY_DIV

        // saveParams2.push(row)
      //})

      console.log("row", saveParams2)
        commonExecuteApi({
          queryId: "SAFBA0010_ELEC_SAVE_11",
          list: saveParams2,
        }).then((res) => {
          console.log("작업준비 및 안전조치사항 목록 저장", res)          
        })




      vm.$nextTick(() => {
        grdMain.value
          .getDataProvider()
          .setValue(rowChValue.value, "RCV_NO", mainres.list[0].RES_RCV_NO)
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", false)
        menuTitle.value.setBtnProperty("btnApprove", "visible", false)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
        menuTitle.value.setBtnProperty("btnApplication", "visible", true)
        menuTitle.value.setBtnProperty("btnReqCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnPrintOutPermit", "visible", false)

        if (!datainer.value.STATUS) {
          datainer.value.STATUS = "20"
        }
      })
      console.log(datainer.value.STATUS, "datainer.value.STATUS")
      console.log(datainer.value.RCV_NO, "datainer.value.RCV_NO")
    })
  } else {
    console.log('신청이 아니고, 다건저장 ')


    // 다건 저장
    let saveParam = []
    let cnt = -1
    for (let i of ALLDATA.value) {
      let stratTime = []
      let endTime = []
      let OT = []
      let objAssign = {}

     
      if (i.Main.JOB_BSNS_CD !== "AE00"  && i.Main.JOB_BSNS_CD !== "AC00" && i.Main.JOB_BSNS_CD !== "AQ00") {
        i.Main.WORK_NO = ""
      }
      // 시간구하기
      if (!i.isDel) {
        cnt++
        let row = grdMain.value.getDataProvider().getJsonRow(cnt)
        console.log(cnt, "번째")
        console.log(cnt, "번째rowrr", row)
        console.log(cnt, "번째Main", i.Main)
        if (
          !i.Main.ALL_END_TIME ||
          !i.Main.ALL_OVERTIME_YN ||
          !i.Main.ALL_START_TIME
        ) {
          Object.entries(i.Date).forEach(([K, V]) => {
            stratTime.push(V.ALL_START_TIME)
            endTime.push(V.ALL_END_TIME)
            OT.push(V.OT)
          })
          i.Main.ALL_START_TIME = stratTime.join(",")
          i.Main.ALL_END_TIME = endTime.join(",")
          i.Main.ALL_OVERTIME_YN = OT.join(",")
          i.Main.WORK_DT = dayjs(i.Date[0].ALL_START_TIME).format("YYYYMMDD")
          i.Main.DN_DIV = i.Date[0].DN_DIV
        }
        if (!i.Dan) {
          i.Main.SHORT_WORK_NO = ""
        }
        //기타데이터
        // i.Main.BSNS_CD = userStore.bsnsCd
        // i.Main.ASGN_CD = userStore.asgnCd

        // 수정중
        // 도장 화기일 경우 PARA_CHK_YN Y
        if (i.Main.DANG_DIV === "H00" || i.Main.DANG_DIV === "P00") {
          i.Main.PARA_CHK_YN = "Y"
        } else {
          i.Main.PARA_CHK_YN = "N"
        }
        if (i.Main.RCV_TYPECheck === true) {
          i.Main.CON_YN = "Y"
        }
        if (i.Main.RCV_TYPECheck === false) {
          i.Main.CON_YN = "N"
        }
        if (
          i.Main.RCV_TYPECheck === null ||
          i.Main.RCV_TYPECheck === undefined ||
          i.Main.RCV_TYPECheck === ""
        ) {
          i.Main.CON_YN = null
        }

        i.Main.REQ_EMP_NO = userStore.empNo
        i.Main.FORM_TYPE = "R2"
        if (
          i.Main.STATUS === "" ||
          i.Main.STATUS === null ||
          i.Main.STATUS === undefined
        ) {
          i.Main.STATUS = "20"
        }
        i.Main.WORK_DT = dayjs(i.Main.WORK_DT).format("YYYYMMDD")
        // 그리드 데이터
        let mergedObj = _.merge(i.Main, row)
        // objAssign = Object.assign()
        console.error(mergedObj, "mergedObj")
        saveParam.push(mergedObj)
      }
    }
    console.log("saveParam after loop", saveParam )
    // 저장후
    return commonExecuteApi({
      queryId: "SAFBA0010_ELEC_SAVE_01",
      list: saveParam,
    }).then((res) => {
      console.log(saveParam, "saveParam")
      console.log(res, "res")
      let cnt = -1
      console.log(isDateint.value, "res")

      isDateint.value = false
      for (let i of res.list) {
        cnt++
        grdMain.value.getDataProvider().setValue(cnt, "RCV_NO", i.RES_RCV_NO)
        if (!ALLDATA.value[cnt].Main.RCV_NO) {
          ALLDATA.value[cnt].Main.RCV_NO = i.RES_RCV_NO
        }
        if (!ALLDATA.value[cnt].Main.STATUS) {
          ALLDATA.value[cnt].Main.STATUS = "20"
        }
        console.log(
          ALLDATA.value[cnt].Main.STATUS,
          "ALLDATA.value[cnt].Main.STATUS"
        )
        console.log(
          ALLDATA.value[cnt].Main.RCV_NO,
          "ALLDATA.value[cnt].Main.RCV_NO"
        )

        if (ALLDATA.value[cnt].LocationType === "B") {
          for (let L of ALLDATA.value[cnt].Location) {
      
              L.RCV_NO = i.RES_RCV_NO
              L.CMPNY_DIV = i.CMPNY_DIV
   
          }
          console.log(ALLDATA.value[cnt].Location, "dmdldm", cnt)
          commonExecuteApi({
            queryId: "SAFBA0010_SAVE_03",
            list: ALLDATA.value[cnt].Location,
          })
        }

        if (
          ALLDATA.value[cnt].LocationType === "D" ||
          ALLDATA.value[cnt].LocationType === "E"
        ) {
          for (let L of ALLDATA.value[cnt].Location) {
    
              L.RCV_NO = i.RES_RCV_NO
              L.CMPNY_DIV = i.CMPNY_DIV
     
          }
          console.log(ALLDATA.value[cnt].Location, "dmdldm", cnt)


          commonExecuteApi({
            queryId: "SAFBA0010_SAVE_02",
            list: ALLDATA.value[cnt].Location,
          })
          

 
        }
      }
      vm.$nextTick(() => {
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", false)
        menuTitle.value.setBtnProperty("btnApprove", "visible", false)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
        menuTitle.value.setBtnProperty("btnApplication", "visible", true)
        menuTitle.value.setBtnProperty("btnReqCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnPrintOutPermit", "visible", false)
      })
    })
  }
}

// 위치 삭제
const deleteDataB = () => {
  let chekedRow = grdSub1.value.getGridView().getCheckedRows(true)

  let delParams = []
  chekedRow.forEach((val) => {
    let data = grdSub1.value.getDataProvider().getJsonRow(val)
    delParams.push(data)
  })

  return commonExecuteApi({
    queryId: "SAFBA0010_DELETE03",
    list: delParams,
  })
}

const deleteData = () => {
  let chekedRow =
    LocationType.value === "D"
      ? grdSub1_1.value.getGridView().getCheckedRows(true)
      : grdSub1_2.value.getGridView().getCheckedRows(true)

  let delParams = []
  chekedRow.forEach((val) => {
    let data =
      LocationType.value === "D"
        ? grdSub1_1.value.getDataProvider().getJsonRow(val)
        : grdSub1_2.value.getDataProvider().getJsonRow(val)
    delParams.push(data)
  })

  return commonExecuteApi({
    queryId: "SAFBA0010_DELETE02",
    list: delParams,
  })
}

watch(
  () => datainer.value.CMPNY_DIV,
  (newValue) => {
    if (newValue) {
      if (!isSearch) {
        datainer.value.JOB_BSNS_CD = ""
      }
      commonSearchApi({
        queryId: "searchBSNS",
        param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
      }).then((res) => {
        codeList.bsnsCd = res.ORESULT_CUR
      })
    }
  }
)

watch(
  () => DangSearch.WRK_PLC,
  (newValue) => {
    DangSearch.WRK_PLC = newValue
    if (!isDan.value) {
      DangSearch.BSNS_CD = datainer.value.BSNS_CD
      DangSearch.DEPT_CD = datainer.value.DEPT_CD
      commonSearchApi({
        queryId: "SAFBA0010_ELEC_SEARCH_04",
        param: DangSearch,
      }).then((res) => {
        grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    } else {
      DangSearch.JOB_LPLC = datainer.value.JOB_LPLC
      DangSearch.JOB_MPLC = datainer.value.JOB_MPLC
      DangSearch.JOB_SPLC = datainer.value.JOB_SPLC
      DangSearch.BSNS_CD = datainer.value.BSNS_CD
      DangSearch.DEPT_CD = datainer.value.DEPT_CD

      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_18",
        param: DangSearch,
      }).then((res) => {
        grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }
  }
)

watch(
  () => DangSearch.DANG_DIV,
  (newValue) => {
    console.log('newValue :LL:: ', newValue)
    DangSearch.DANG_DIV = newValue
    if (!isDan.value) {
      // DangSearch.BSNS_CD = datainer.value.BSNS_CD
      // DangSearch.DEPT_CD = datainer.value.DEPT_CD
      // commonSearchApi({
      //   queryId: "SAFBA0010_SEARCH_04",
      //   param: DangSearch,
      // }).then((res) => {
      //   // 일단 주석 처리함.(2024.12.16)
      //   grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)  //여기서 오류
      // })
    } else {
      DangSearch.JOB_LPLC = datainer.value.JOB_LPLC
      DangSearch.JOB_MPLC = datainer.value.JOB_MPLC
      DangSearch.JOB_SPLC = datainer.value.JOB_SPLC
      DangSearch.BSNS_CD = datainer.value.BSNS_CD
      DangSearch.DEPT_CD = datainer.value.DEPT_CD
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_18",
        param: DangSearch,
      }).then((res) => {
        // // 일단 주석 처리함.(2024.12.16)
        grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
      })

      if(newValue === 'E03'){
        radioList()
      }
    }
  }
)

watch(
  () => DangSearch.GBN,
  (newValue) => {
    if (!isDan.value) {
      DangSearch.BSNS_CD = datainer.value.BSNS_CD
      DangSearch.DEPT_CD = datainer.value.DEPT_CD
      commonSearchApi({
        queryId: "SAFBA0010_ELEC_SEARCH_04",
        param: DangSearch,
      }).then((res) => {
        grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    } else {
      DangSearch.JOB_LPLC = datainer.value.JOB_LPLC
      DangSearch.JOB_MPLC = datainer.value.JOB_MPLC
      DangSearch.JOB_SPLC = datainer.value.JOB_SPLC
      DangSearch.BSNS_CD = datainer.value.BSNS_CD
      DangSearch.DEPT_CD = datainer.value.DEPT_CD
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_18",
        param: DangSearch,
      }).then((res) => {
        grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }
  }
)

watch(
  () => [
    datainer.value.CONFINED_YN,
    datainer.value.ARGN_YN,
    datainer.value.ELEC_YN,
    datainer.value.HEIGHT_YN,
    datainer.value.PRESSURE_YN,
    datainer.value.PIPE_DIA_YN,
  ],
  ([CONFINED, ARGN, ELEC, HEIGHT, PRESSURE, PIPE_DIA]) => {
    if (
      CONFINED === "Y" ||
      ARGN === "Y" ||
      ELEC === "Y" ||
      HEIGHT === "Y" ||
      PRESSURE === "Y" ||
      PIPE_DIA === "Y"
    ) {
      if (rowChValue.value !== null) {
        console.log("hihhi")
        grdMain.value
          .getDataProvider()
          .setValue(rowChValue.value, "ADD_IN", "Y")
      }
    }
    if (
      CONFINED === "N" &&
      ARGN === "N" &&
      ELEC === "N" &&
      HEIGHT === "N" &&
      PRESSURE === "N" &&
      PIPE_DIA === "N"
    ) {
      if (rowChValue.value !== null) {
        grdMain.value
          .getDataProvider()
          .setValue(rowChValue.value, "ADD_IN", "N")
      }
    }

    // if (PRESSURE === "Y") {
    //   datainer.value.PIPE_DIA_YN = "Y"
    // } else {
    //   datainer.value.PIPE_DIA_YN = "N"
    //   datainer.value.PIPE_DIA = ""
    //   datainer.value.PRESSURE = ""
    // }

    HEIGHT === "Y"
      ? (nonHEIGHT.value = false)
      : ((nonHEIGHT.value = true), (datainer.value.HEIGHT = "")),
      PRESSURE === "Y"
        ? (nonPRESSURE.value = false)
        : ((nonPRESSURE.value = true) ,(datainer.value.PRESSURE))

    PIPE_DIA === "Y" ? (nonPIPE_DIA.value = false) : ((nonPIPE_DIA.value = true),(  datainer.value.PIPE_DIA = "") )
  }
)

watch(
  () => [
    datainer.value.BSNS_CD,
    datainer.value.JOB_BSNS_CD,
    datainer.value.RCV_TYPECheck,
    datainer.value.JOB_PLC,
  ],
  ([BSNS_CD, JOB_BSNS_CD, RCV_TYPE, PLC]) => {
    console.log(LocationType.value, RCV_TYPE)

    // 장소 조회 D / E
    // if (LocationType.value === "D" || LocationType.value === "E") {
    //   commonSearchApi({
    //     queryId: "SAFBA0010_SEARCH_13",
    //     param: datainer.value,
    //   }).then((res) => {
    //     if (LocationType.value === "D") {
    //       grdSub1_1.value.getDataProvider().setRows(res.ORESULT_CUR)
    //     }
    //     if (LocationType.value === "E") {
    //       grdSub1_2.value.getDataProvider().setRows(res.ORESULT_CUR)
    //     }
    //   })
    // }

    // if (LocationType.value === "B") {
    //   commonSearchApi({
    //     queryId: "SAFBA0010_SEARCH_14",
    //     param: datainer.value,
    //   }).then((res) => {
    //     console.log(res, "resb")
    //     grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
    //   })
    // }
    if (JOB_BSNS_CD) {
      if (JOB_BSNS_CD === "AE00") {
        datainer.value.RCV_TYPE = "E"
        commonSearchApi({
          queryId: "SAFBA0010_SEARCH_06",
          param: Location,
        }).then((res) => {
          let filter = res.ORESULT_CUR.filter((x) => x.LOCOD === "E")
          codeList.WorkNo = filter
          codeList.WorkNo.unshift({
            SHIP_KIND_NM: "",
            WORK_NO: "",
            SHIP_CAPA: "",
          })
        })
      }
      if (JOB_BSNS_CD === "AC00") {
        RCV_TYPE = datainer.value.RCV_TYPE = "C"

        commonSearchApi({
          queryId: "SAFBA0010_SEARCH_06",
          param: Location,
        }).then((res) => {
          let filter = res.ORESULT_CUR.filter(
            (x) => x.LOCOD === datainer.value.RCV_TYPE
          )
          codeList.WorkNo = filter
          codeList.WorkNo.unshift({
            SHIP_KIND_NM: "",
            WORK_NO: "",
            SHIP_CAPA: "",
          })
        })
      }
      if (JOB_BSNS_CD === "AQ00") {
        RCV_TYPE = datainer.value.RCV_TYPE = "Q"
        if (datainer.value.RCV_TYPECheck) {
          commonSearchApi({
            queryId: "SAFBA0010_SEARCH_06",
            param: Location,
          }).then((res) => {
            let filter = res.ORESULT_CUR.filter(
              (x) => x.LOCOD === datainer.value.RCV_TYPE
            )
            codeList.WorkNo = filter
            codeList.WorkNo.unshift({
              SHIP_KIND_NM: "",
              WORK_NO: "",
              SHIP_CAPA: "",
            })
          })
        } else {
          commonSearchApi({
            queryId: "SAFBA0010_SEARCH_06",
            param: Location,
          }).then((res) => {
            let filter = res.ORESULT_CUR.filter((x) => x.LOCOD === "C")
            codeList.WorkNo = filter
            codeList.WorkNo.unshift({
              SHIP_KIND_NM: "",
              WORK_NO: "",
              SHIP_CAPA: "",
            })
          })
        }
      } else {
        datainer.value.RCV_TYPE = JOB_BSNS_CD.substring(1, 2)
      }
      DangSearch.BSNS_CD = JOB_BSNS_CD
      DangSearch.RCV_TYPE = datainer.value.RCV_TYPE
    }

    if (PLC) {
      // JOB_LPLC가 "B"인 경우

      if (datainer.value.JOB_LPLC === "B") {
        // JOB_MPLC가 "A", "B", "C" 중 하나이고 JOB_BSNS_CD가 "AC00" 또는 "AE00"인 경우
        if (
          ["A", "B", "C"].includes(datainer.value.JOB_MPLC) &&
          ["AC00", "AQ00", "AE00"].includes(datainer.value.JOB_BSNS_CD)
        ) {
          datainer.value.RCV_TYPE === "C" ||
          datainer.value.RCV_TYPE === "E"
            ? (LocationType.value = "D")
            : datainer.value.RCV_TYPE === "Q" &&
              datainer.value.RCV_TYPECheck === false
            ? (LocationType.value = "D")
            : (LocationType.value = "E")
          // if(datainer.value.RCV_TYPE === "E"){
          //   LocationType.value = "D"
          // }
        }

        // 그렇지 않은 경우 LocationType을 "C"로 설정
        else {
          LocationType.value = "C"
        }
      }
      // JOB_LPLC가 "B"가 아닌 경우
      else {
        // JOB_LPLC가 "A"이고 JOB_MPLC가 "C"이며 JOB_SPLC가 "140"인 경우 LocationType을 "D"로 설정
        if (
          datainer.value.JOB_LPLC === "A" &&
          datainer.value.JOB_MPLC === "C" &&
          datainer.value.JOB_SPLC === "140"
        ) {
          LocationType.value = "D"
        }
        // 그렇지 않은 경우
        else {
          // datainer.RCV_TYPECheck이 "Y"인 경우 LocationType을 "B"로 설정, 그렇지 않으면 "C"로 설정
          console.log("hmlhl")
          console.log(datainer.value.JOB_PLC_DTL_YN, "Location.JOB_PLC_DTL_YN")
          LocationType.value = datainer.value.JOB_PLC_DTL_YN === "Y" ? "B" : "C"
          console.log(LocationType.value, "LocationType.value")
          if (LocationType.value === "B") {
            let code =
              datainer.value.JOB_LPLC +
              datainer.value.JOB_MPLC +
              datainer.value.JOB_SPLC

            getCodeList(`HHIZ011${code}`).then((res) => {
              grdSub1.value.setBindingColumn(
                "DIV_M",
                res.ORESULT_CUR,
                "COD",
                "TXT"
              )
            })
          }
        }
      }
    }
  }
)

//  수정중
watch(
  () => LocationType.value,
  (newValue) => {
    // 통신
    if (!newValue) {
      LocationDisable.value = true
      console.log(LocationDisable.value, "LocationDisable.value")
      console.log(LocationType.value, "LocationType.value")
    }
    // 장소 바인딩
    if (newValue === "B") {
      // 상세위치
      LocationDisable.value = false
      // grdTitle2.value.disableBtn("btnADD_LOCATION", false)
      // grdTitle2.value.disableBtn("btnDELETE_LOCATION", false)
    }

    if (newValue === "D") {
      LocationDisable.value = false
      // grdTitle2.value.disableBtn("btnADD_LOCATION", false)
      // grdTitle2.value.disableBtn("btnDELETE_LOCATION", false)
    }

    if (newValue === "E") {
      LocationDisable.value = false
      // grdTitle2.value.disableBtn("btnADD_LOCATION", false)
      // grdTitle2.value.disableBtn("btnDELETE_LOCATION", false)
    }
    if (newValue === "C") {
      LocationDisable.value = true
      // grdTitle2.value.disableBtn("btnADD_LOCATION", true)
      // grdTitle2.value.disableBtn("btnDELETE_LOCATION", true)
    }
  }
)

watch(
  () => datainer.value.DEPT_NM,
  (newValue) => {
    if (newValue) {
      if (!isDan.value) {
        DangSearch.BSNS_CD = datainer.value.BSNS_CD
        DangSearch.DEPT_CD = datainer.value.DEPT_CD
        commonSearchApi({
          queryId: "SAFBA0010_ELEC_SEARCH_04",
          param: DangSearch,
        }).then((res) => {
          grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
        })
      } else {
        DangSearch.JOB_LPLC = datainer.value.JOB_LPLC
        DangSearch.JOB_MPLC = datainer.value.JOB_MPLC
        DangSearch.JOB_SPLC = datainer.value.JOB_SPLC
        DangSearch.BSNS_CD = datainer.value.BSNS_CD
        DangSearch.DEPT_CD = datainer.value.DEPT_CD
        commonSearchApi({
          queryId: "SAFBA0010_SEARCH_18",
          param: DangSearch,
        }).then((res) => {
          grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
        })
      }
    }
  }
)

// watch(
//   () => isRowChanged.value,
//   (newValue, oldValue) => {
//     if (oldValue) {
//       if (ALLDATA.value[oldValue] && ALLDATA.value[oldValue].Main) {
//         ALLDATA.value[oldValue].Main = datainer.value
//         ALLDATA.value[oldValue].Date = DateInt.value
//         ALLDATA.value[oldValue].LocationType = LocationType.value
//       } else {
//         let SaveData = {
//           Main: { ...datainer.value },
//           Date: { ...DateInt.value },
//           LocationType: LocationType.value,
//         }
//         ALLDATA.value.push(SaveData)
//       }
//     }
//   console.log(ALLDATA.value,'ALLDATA.value')ㅕ
//   }
// )

watch(
  () => datainer.value.STATUS,
  (newValue) => {
    console.log(SafetyOpen.value, "SafetyOpen.value")
    if (newValue && !SafetyOpen.value) {
      if (newValue >= 20 && newValue < 30) {
        datainer.value.GBN = "2"
      } else if (newValue > 20 && newValue <= 50) {
        datainer.value.GBN = "3"
      } else {
        datainer.value.GBN = "1"
      }

      Number(newValue) > 21
        ? (disabledSTATUS.value = true)
        : (disabledSTATUS.value = false)

      if (disabledSTATUS.value) {
        vm.$nextTick(() => {
          // 위험작업 허가서 상세

          menuTitle.value.disableBtn("btnUpdate", true)
          grdTitle.value.disableBtn("btnDelete", true)
          // 상세위치
          LocationDisable.value = true
          // grdTitle2.value.disableBtn("btnADD_LOCATION", true)
          // grdTitle2.value.disableBtn("btnDELETE_LOCATION", true)
        })
      } else {
        // 위험작업 허가서 상세

        menuTitle.value.disableBtn("btnUpdate", false)
        grdTitle.value.disableBtn("btnDelete", false)
        // 상세위치
        LocationDisable.value = false
        // grdTitle2.value.disableBtn("btnADD_LOCATION", false)
        // grdTitle2.value.disableBtn("btnDELETE_LOCATION", false)
      }
    } else if (!SafetyOpen.value) {
      vm.$nextTick(() => {
        // 위험작업 허가서 상세
        disabledSTATUS.value = false
        menuTitle.value.disableBtn("btnUpdate", false)
        grdTitle.value.disableBtn("btnDelete", false)
        // 상세위치
        LocationDisable.value = false
        // grdTitle2.value.disableBtn("btnADD_LOCATION", false)
        // grdTitle2.value.disableBtn("btnDELETE_LOCATION", false)
      })
    }

    console.log(newValue, "newValue Stater")
    // 초기 상태
    if (!newValue) {
      vm.$nextTick(() => {
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", false)
        menuTitle.value.setBtnProperty("btnPrintOutPermit", "visible", false)
        menuTitle.value.setBtnProperty("btnApprove", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnReqCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnApplication", "visible", false)
      })
    }
    // 신청전
    if (newValue == 20) {
      vm.$nextTick(() => {
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", false)
        menuTitle.value.setBtnProperty("btnApprove", "visible", false)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
        menuTitle.value.setBtnProperty("btnApplication", "visible", true)
        menuTitle.value.setBtnProperty("btnReqCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnPrintOutPermit", "visible", false)
      })
    }
    // 부서반려
    if (newValue == 21) {
      vm.$nextTick(() => {
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", false)
        menuTitle.value.setBtnProperty("btnApprove", "visible", false)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
        menuTitle.value.setBtnProperty("btnApplication", "visible", true)
        menuTitle.value.setBtnProperty("btnReqCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnPrintOutPermit", "visible", false)
      })
    }
    // 신청후 상태
    if (newValue == 25) {
      vm.$nextTick(() => {
        if (datainer.value.MNGR_EMP_NO === userStore.empNo || isH.value) {
          menuTitle.value.setBtnProperty("btnApprove", "visible", true)
        } else {
          menuTitle.value.setBtnProperty("btnApprove", "visible", false)
        }
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", false)
        menuTitle.value.setBtnProperty("btnApplication", "visible", false)
        menuTitle.value.setBtnProperty("btnReqCancel", "visible", true)
        menuTitle.value.setBtnProperty("btnPrintOutPermit", "visible", false)
      })
    }



    // 승인거절 상태
    if (newValue == 41) {
      vm.$nextTick(() => {
        if (datainer.value.MNGR_EMP_NO === userStore.empNo || isH.value) {
          menuTitle.value.setBtnProperty("btnApprove", "visible", true)
        } else {
          menuTitle.value.setBtnProperty("btnApprove", "visible", false)
        }
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", false)
        menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
        //  권한 확정되면 수정하기
        menuTitle.value.setBtnProperty("btnApplication", "visible", false)
        menuTitle.value.setBtnProperty("btnReqCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnPrintOutPermit", "visible", false)
      })
    }
     //  C#승인
     if (newValue == 40) {
      vm.$nextTick(() => {
        if (datainer.value.MNGR_EMP_NO === userStore.empNo || isH.value) {
          menuTitle.value.setBtnProperty("btnApproveCancel", "visible", true)
        } else {
          menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        }
        //  권한 확정되면 수정하기
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", false)
        //
        menuTitle.value.setBtnProperty("btnApprove", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
        menuTitle.value.setBtnProperty("btnApplication", "visible", false)
        menuTitle.value.setBtnProperty("btnReqCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnPrintOutPermit", "visible", true)
      })
    }
    // 승인
    if (newValue == 50) {
      vm.$nextTick(() => {
        if (datainer.value.MNGR_EMP_NO === userStore.empNo || isH.value) {
          menuTitle.value.setBtnProperty("btnApproveCancel", "visible", true)
        } else {
          menuTitle.value.setBtnProperty("btnApproveCancel", "visible", false)
        }
        //  권한 확정되면 수정하기
        menuTitle.value.setBtnProperty("btnSteelApproved", "visible", false)
        //
        menuTitle.value.setBtnProperty("btnApprove", "visible", false)
        menuTitle.value.setBtnProperty("btnTurnBack", "visible", false)
        menuTitle.value.setBtnProperty("btnApplication", "visible", false)
        menuTitle.value.setBtnProperty("btnReqCancel", "visible", false)
        menuTitle.value.setBtnProperty("btnPrintOutPermit", "visible", true)
      })
    }
  }
)
// 프린트
const setPrint = () => {
  // 프린트
  console.log("hmhgl")

  let checkRows = grdMain.value.getGridView().getCheckedRows()
  let dataRort = []
  params.value = []
  reportName.value = []
  let urlArr =''
  let visible = ""
  let param = {
      originalURL:
        getQDomain() +
        `#/ptw_qr?RCV_NO=${datainer.value.RCV_NO}&SHORT_WORK_NO=`,
    }
    commonShortenUrl(param).then((res) => {
      console.log('res : ', res)
      urlArr = res.ORESULT_CUR.url

  if (
      datainer.value.BSNS_CD === "AC00" ||
      datainer.value.BSNS_CD === "AQ00" ||
      datainer.value.BSNS_CD === "AE00"
    ) {
      if (datainer.value.DANG_DIV_CD === "C01" && datainer.value.CF_DIV === "S") {
        datainer.value.CF_DIV === "F" ? (visible = "Y") : (visible = "N")
        
        dataRort = [
          "CF_DIV_NM=" + `[안전현장허가]`,
          "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
            ? "병행"
            : "",
          "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
          "IN_RCV_NO=" + datainer.value.RCV_NO,
          "IN_THREECHECKYN" + THREECHECKYN,
          "QR=" + urlArr,
          "visible=" + visible,
        ]
        reportName.value = "/manage/hse/RETA3015C.ozr"
      }
      if (datainer.value.DANG_DIV_CD === "C01" && datainer.value.CF_DIV === "C") {
        datainer.value.CF_DIV === "F" ? (visible = "Y") : (visible = "N")

        dataRort = [
          "CF_DIV_NM=" + `[전산허가]`,
          "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
            ? "병행"
            : "",
          "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
          "IN_RCV_NO=" + datainer.value.RCV_NO,
          "IN_THREECHECKYN" + THREECHECKYN,
          "QR=" + urlArr,
          "visible=" + visible,
        ]
        reportName.value = "/manage/hse/RETA3014C.ozr"
      }

      if (
        datainer.value.WRK_PLC === "99" ||
        datainer.value.WRK_PLC === "01" ||
        datainer.value.WRK_PLC === "10" ||
        datainer.value.WRK_PLC === "09"
      ) {
        //F 대면 C 전산 S 현장
        if (datainer.value.CF_DIV === "F") {
          reportName.value = "/manage/hse/RETA3011C.ozr"
          dataRort = [
            "CF_DIV_NM=" + `[안전대면허가]`,
            "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
              ? "병행"
              : "",
            "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
            "IN_RCV_NO=" + datainer.value.RCV_NO,
            "QR=" + urlArr,
          ]
        }
        if (datainer.value.CF_DIV === "S") {
          reportName.value = "/manage/hse/RETA3013C.ozr"
          dataRort = [
            "CF_DIV_NM=" + `[안전현장허가]`,
            "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
              ? "병행"
              : "",
            "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
            "IN_RCV_NO=" + datainer.value.RCV_NO,
            "QR=" + urlArr,
          ]
        }
        if (datainer.value.CF_DIV === "C") {
          reportName.value = "/manage/hse/RETA3012C.ozr"
          dataRort = [
            "CF_DIV_NM=" + `[전산허가]`,
            "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
              ? "병행"
              : "",
            "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
            "IN_RCV_NO=" + datainer.value.RCV_NO,
            "QR=" + urlArr,
          ]
        }
      } else {
        if (datainer.value.CF_DIV === "F") {
          reportName.value = "/manage/hse/RETA3011_04C.ozr"
          dataRort = [
            "CF_DIV_NM=" + `[안전대면허가]`,
            "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
              ? "병행"
              : "",
            "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
            "IN_RCV_NO=" + datainer.value.RCV_NO,
            "QR=" + urlArr,
          ]
        }
        if (datainer.value.CF_DIV === "S") {
          reportName.value = "/manage/hse/RETA3011_06C.ozr"
          dataRort = [
            "CF_DIV_NM=" + `[안전현장허가]`,
            "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
              ? "병행"
              : "",
            "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
            "IN_RCV_NO=" + datainer.value.RCV_NO,
            "QR=" + urlArr,
          ]
        }
        if (datainer.value.CF_DIV === "C") {
          reportName.value = "/manage/hse/RETA3011_05C.ozr"
          dataRort = [
            "CF_DIV_NM=" + `[전산허가]`,
            "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
              ? "병행"
              : "",
            "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
            "IN_RCV_NO=" + datainer.value.RCV_NO,
            "QR=" + urlArr,
          ]
        }
      }
    } else {
      if (datainer.value.DANG_DIV_CD === "C01" && datainer.value.CF_DIV === "S") {
        datainer.value.CF_DIV === "F" ? (visible = "Y") : (visible = "N")

        dataRort = [
          "CF_DIV_NM=" + `[안전대면허가]`,
          "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
            ? "병행"
            : "",
          "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
          "IN_RCV_NO=" + datainer.value.RCV_NO,
          "QR=" + urlArr,
          "visible=" + visible,
        ]
        reportName.value = "/manage/hse/RETA3014C_B.ozr"
      }
      if (datainer.value.DANG_DIV_CD === "C01" && datainer.value.CF_DIV === "C") {
        datainer.value.CF_DIV === "F" ? (visible = "Y") : (visible = "N")

        dataRort = [
          "CF_DIV_NM=" + `[전산허가]`,
          "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
            ? "병행"
            : "",
          "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
          "IN_RCV_NO=" + datainer.value.RCV_NO,
          "QR=" + urlArr,
          "visible=" + visible,
        ]
        reportName.value = "/manage/hse/RETA3015C_B.ozr"
      }

      if (datainer.value.DANG_DIV_CD === "E03") {

        if (datainer.value.CF_DIV === "F") {
        reportName.value = "/manage/hse/RETA3016C.ozr"
        dataRort = [
            "CF_DIV_NM=" + `[안전대면허가]`,
            "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
              ? "병행"
              : "",
            "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
            "IN_RCV_NO=" + datainer.value.RCV_NO,
            "QR=" + urlArr,
          ]
        }

      } else {

        if (datainer.value.CF_DIV === "F") {
          reportName.value = "/manage/hse/RETA3011C_B.ozr"
          dataRort = [
            "CF_DIV_NM=" + `[안전대면허가]`,
            "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
              ? "병행"
              : "",
            "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
            "IN_RCV_NO=" + datainer.value.RCV_NO,
            "QR=" + urlArr,
          ]
        }
        if (datainer.value.CF_DIV === "S") {
          reportName.value = "/manage/hse/RETA3013C_B.ozr"
          dataRort = [
            "CF_DIV_NM=" + `[안전현장허가]`,
            "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
              ? "병행"
              : "",
            "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
            "IN_RCV_NO=" + datainer.value.RCV_NO,
            "QR=" + urlArr,
          ]
        }
        if (datainer.value.CF_DIV === "C") {
          reportName.value = "/manage/hse/RETA3012C_B.ozr"
          dataRort = [
            "CF_DIV_NM=" + `[전산허가]`,
            "WRKCHK=" + datainer.value.WRKCHK === "Y1" || datainer.value.WRKCHK === "Y2"
              ? "병행"
              : "",
            "IN_CMPNY_DIV=" + datainer.value.CMPNY_DIV,
            "IN_RCV_NO=" + datainer.value.RCV_NO,
            "QR=" + urlArr,
          ]
        }
      }
      




    }
  params.value.push({ reportName: reportName.value, args: dataRort })
  // params.value.param.push(reportName.value)
  console.log(params.value)
})

  isMulti.value = true

  showOz.value = true
}

// 신규 추가로직
const dangiSelect = (row) => {
  console.log('row ', row)
  grdMain.value
    .getDataProvider()
    .setValue(rowChValue.value, "SHORT_WORK_NO", row.SHORT_WORK_NO)
  datainer.value.SHORT_WORK_NO = row.SHORT_WORK_NO
}
const opendangiPopUp = () => {
  let cnt = grdMain.value.getGridView().getItemCount()
  if (cnt <= 0){
    return Message.warn(t("허가서 목록 상세에서 허가서를 추가 후 조회해 주시기 바랍니다."))
  }

  dangiPopUp.value.openPopup(datainer.value.DEPT_CD)
}

// 허가서 작성 구분
async function applyDan(e){
  
  let cnt = grdMain.value.getGridView().getItemCount()
  if (cnt > 0){
    vm.$swal({
        title: t("현재 작성중인 허가서 목록이 초기화 됩니다. 초기화 하시겠습니까?"),
        showCancelButton: true,
      }).then((swalRes) => {
        if (swalRes.isConfirmed === true) {
          grdMain.value.getDataProvider().setRows("")
          ALLDATA.value = []
        }else{
          
          e.preventDefault();
          isDan.value = !isDan.value
          return
        }
      })
  }
}

watch(
  () => datainer.value.MNGR_EMP_NO,
  (newValue) => {
    if (isGan) {
      if (codeList.MNGR_EMP_NO) {
        let filter = codeList.MNGR_EMP_NO.filter(
          (x) => x.APP_EMP_NO === newValue
        )
        // console.log(filter, "filter")
        if (filter.length !== 0) {
          datainer.value.MNGR_HP_NO = filter[0].APP_TEL_NO
          datainer.value.MNGR_TRS_NO = filter[0].APPRO60
        }
      }
    }
  }
)

watch(
  () => isDan.value,
  (newValue) => {
    console.log('isDan' ,newValue)
    // console.log('DangSearch.DANG_DIV' ,DangSearch.DANG_DIV)
    if (!newValue) {
      if(DangSearch.DANG_DIV === 'E03'){
        DangSearch.DANG_DIV = ''
      }
      DangSearch.BSNS_CD = datainer.value.BSNS_CD
      DangSearch.DEPT_CD = datainer.value.DEPT_CD
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_04",
        param: DangSearch,
      }).then((res) => {
        grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    } else {
      DangSearch.JOB_LPLC = datainer.value.JOB_LPLC
      DangSearch.JOB_MPLC = datainer.value.JOB_MPLC
      DangSearch.JOB_SPLC = datainer.value.JOB_SPLC
      DangSearch.BSNS_CD = datainer.value.BSNS_CD
      DangSearch.DEPT_CD = datainer.value.DEPT_CD
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_18",
        param: DangSearch,
      }).then((res) => {
        grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }
  }
)

const LWPClick = () => {
  
  let param =[
    // USER_ID  :userStore.userId,
		// JOB_LPLC  :'', 
		// JOB_MPLC  :'', 
		// JOB_SPLC  :'', 
		// WRK_PLC  :'',
		// WORK_NO  :'', 
		// CMPNY_DIV  :userStore.cmpnyDiv, 
		// DIV_L  :'',
		// DIV_L_NM  :'', 
		// DIV_M  :'', 
		// DIV_M_NM  :'', 
		// DIV_S  :'', 
		// DIV_S_NM  :'', 
		// DIV_DESC  :'',
		// PCS_DIV  :'', 
		// FMA_DIV  :'', 
		// DIV_S2  :'',
		// DIV_S2_NM  :'', 
		// DIV_S3  :'', 
		// DIV_S3_NM  :'',
		// LOCATIONTYPE  :'', 
		// JOB_PLC_DTL     :'',    
  ]
  
  console.log(LocationType.value)

  if(!LocationType.value){
    return Message.warn(t("장소 입력후 이용해주시기바랍니다."))
  }

  if(LocationType.value === "D" || LocationType.value === "E"){
  let checkedRows =
          LocationType.value === "D"
            ? grdSub1_1.value.getGridView().getCheckedRows(true)
            : grdSub1_2.value.getGridView().getCheckedRows(true)
  
  if(checkedRows.length === 0 ){
    return Message.warn(t("선택된 데이터가 없습니다."))
  }
    checkedRows.forEach((x) => {
          let row =
            LocationType.value === "D"
              ? grdSub1_1.value.getDataProvider().getJsonRow(x)
              : grdSub1_2.value.getDataProvider().getJsonRow(x)

          row.USER_ID = userStore.userId
          row.CMPNY_DIV = userStore.cmpnyDiv
          row.LOCATIONTYPE = LocationType.value
          row.JOB_LPLC = datainer.value.JOB_LPLC
          row.JOB_MPLC = datainer.value.JOB_MPLC
          row.JOB_SPLC = datainer.value.JOB_SPLC
          row.WORK_NO = datainer.value.WORK_NO
          row.BSNS_CD = datainer.value.JOB_BSNS_CD
          param.push(row)
        })
  }
  if (LocationType.value === "B") {
  let checkedRows = grdSub1.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0 ){
    return Message.warn(t("선택된 데이터가 없습니다."))
  }
  checkedRows.forEach((x) => {
          let row = grdSub1.value.getDataProvider().getJsonRow(x)
          row.USER_ID = userStore.userId
          row.CMPNY_DIV = userStore.cmpnyDiv
          row.JOB_PLC_DTL = datainer.value.JOB_PLC_DTL
          row.LOCATIONTYPE = LocationType.value
          row.JOB_LPLC = datainer.value.JOB_LPLC
          row.JOB_MPLC = datainer.value.JOB_MPLC
          row.JOB_SPLC = datainer.value.JOB_SPLC
          row.WORK_NO = datainer.value.WORK_NO
          row.BSNS_CD = datainer.value.JOB_BSNS_CD
          param.push(row)
        })
  }
  if(LocationType.value === "C"){
  if(!datainer.value.JOB_PLC_DTL){
    return Message.warn(t("입력된 데이터가 없습니다."))
  }

    let data = {
          JOB_LPLC : datainer.value.JOB_LPLC,
          JOB_MPLC : datainer.value.JOB_MPLC,
          JOB_SPLC : datainer.value.JOB_SPLC,
          JOB_PLC_DTL : datainer.value.JOB_PLC_DTL,
          CMPNY_DIV : userStore.cmpnyDiv,
          USER_ID : userStore.userId,
          WORK_NO : datainer.value.WORK_NO,
          LOCATIONTYPE : LocationType.value,
          BSNS_CD : datainer.value.JOB_BSNS_CD
    }
    
    param.push(data)
  }
  



  

  console.log(param,'param')
  // Message.warn(t("현재 개발중입니다. 추후에 이용 부탁드립니다."))
  vm.$swal({
        title: t(`즐겨찾기 등록을 하시겠습니까?`),
        showCancelButton: true,
      }).then((swalRes) => {
        if (swalRes.isConfirmed === true) {
          commonExecuteApi({
            queryId: "SAFBA0010_SAVE_08",
            list: param,
          })
        }
      })

}
// 장소 즐겨찾기 로직

const LWPOpen =()=>{
  LikeWrkPlace.value.openPopup(datainer.value,LocationType.value)
}

const WRKLIKE = (e) =>{
 
  let rowLength = grdMain.value.getGridView().getItemCount()
  if (rowLength === 0) {
    return Message.warn(t("상단 그리드에서 행추가 이후 이용해주시기바랍니다."))
  }

  if(!e){
    return ''
  }
  else{
    console.log(e,'e')
    let setRow = []
    setRow.push(e)
    if(e.LOCATIONTYPE === 'B' && e.BSNS_CD ==='AC00'){
      datainer.value.JOB_PLC_DTL_YN ='Y'
    }
    LocationType.value = e.LOCATIONTYPE
    datainer.value.WORK_NO = e.WORK_NO
    datainer.value.JOB_LPLC = e.JOB_LPLC
    datainer.value.JOB_MPLC = e.JOB_MPLC
    datainer.value.JOB_SPLC = e.JOB_SPLC
    datainer.value.JOB_PLC = e.JOB_PLC
    datainer.value.JOB_BSNS_CD = e.BSNS_CD
    if(e.BSNS_CD ==='AQ00'){
      if(e.LOCATIONTYPE ==='E'){
        datainer.value.RCV_TYPECheck = true
      }
      else{
        datainer.value.RCV_TYPECheck = false
      }
    }

    let place = `${e.JOB_PLC}  ${e.WORK_NO ? '-' + e.WORK_NO: ''}`
    if (
      rowChValue.value !== "" ||
      rowChValue.value !== null ||
      rowChValue.value !== undefined
    ) {
      grdMain.value
        .getDataProvider()
        .setValue(rowChValue.value, "WRK_PLCNM", place)
    }
    vm.$nextTick(()=>{
    if(e.LOCATIONTYPE === 'B'){
     
      console.log(grdSub1.value,'B')
      grdSub1.value.getDataProvider().setRows(setRow)
      datainer.value.JOB_PLC_DTL = e.JOB_PLC_DTL
    }
    if(e.LOCATIONTYPE === 'D'){
      console.log(grdSub1_1.value,'D')

      grdSub1_1.value.getDataProvider().setRows(setRow)
    }
    if(e.LOCATIONTYPE === 'E'){
      console.log(grdSub1_2.value,'E')

      grdSub1_2.value.getDataProvider().setRows(setRow)
    }
    if(e.LOCATIONTYPE === 'C'){
      datainer.value.JOB_PLC_DTL = e.JOB_PLC_DTL
    }
    })
    
    // console.log(e,'e')
  }
} 

// watch(
//   () => ALLDATA.value,
//   (newValue) => {
   
//     console.log("ALLDATA.value", ALLDATA.value)

//   }
// )






defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    transition="dialog-bottom-transition"
    fullscreen
  >
    <div class="title-bar" @mousedown="startDragging">위험작업 허가서작성</div>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2 d-flex align-center">
        <!--단기인지 아닌지 -->
        <v-radio-group
          :readonly="disabledSTATUS"
          inline
          style="width: 300px"
          v-model="isDan"
          @change="applyDan"
        >
          <v-radio
            label="일반"
            :value="false"
            style="margin-right: 20px !important"
          />
          <v-radio label="단기공사" :value="true" />
        </v-radio-group>
        <IMenuTitle
          ref="menuTitle"
          :button-list="[
            'btnSteelApproved',
            'btnApprove',
            'btnApproveCancel',
            'btnTurnBack',
            'btnUpdate',
            'btnApplication',
            'btnReqCancel',
            'btnPrintOutPermit',
            'btnClose',
          ]"
          @click-button="onButtonsClick($event.id, '메인')"
        />
      </v-card-title>
      <v-card class="content-area">
        <!-- 기본정보 --> 
        <v-card class="mb-3 mx-3 popUp-input-Form">
          <v-card-title class="pa-0">
            <v-sheet class="d-flex flex-row mt-3">
              <h4 style="width: 388px;">기본정보</h4>

              <span style="color: #ef5350; font-size: 13px;">
                ※ 다른 사업부의 장소에서 작업이 이루어지는 경우 '작업 사업부' 변경바랍니다.
              </span>
            </v-sheet>
          </v-card-title>
          
          <v-card-text class="pa-0">
            <v-sheet class="d-flex flex-row mt-3">
              <!-- <i-select
                width="150px"
                top-label
                :label="t('회사')"
                v-model="datainer.COMPANY"
                :items="codeList.company"
                @click="isSearch = false"
                item-title="TXT"
                item-value="COD"
                margin="4px"
                required
                :readonly="disabledSTATUS"
              /> -->
              <i-input
                width="388px"
                top-label
                :label="
                  datainer.DANG_DIV === 'C01'
                    ? t('공사발주조직')
                    : t('소속조직')
                "
                append-inner-icon="mdi-magnify"
                v-model="datainer.DEPT_NM"
                @keydown.enter="
                  (e) => {
                    openDept('소속')
                  }
                "
                @click:appendInner="openDept('소속')"
                required
                :readonly="disabledSTATUS"
                margin="4px"
              />
              <!-- <i-input
                width="388px"
                top-label
                :label="t(`작업 조직`)"
                v-model="datainer.JOB_BSNS_NM"
                @click="isSearch = false"
                margin="20px"
                required
                :readonly="disabledSTATUS"
                append-inner-icon="mdi-magnify"
                @keydown.enter="
                  (e) => {
                    openDept('작업')
                  }
                "
                @click:appendInner="openDept('작업')"
              /> -->
              <i-select
                width="150px"
                top-label
                :label="t(`작업 사업부`)"
                v-model="datainer.JOB_BSNS_CD"
                :items="codeList.bsnsCd"
                @click="isSearch = false"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                margin="20px"
                required
                :readonly="disabledSTATUS"
              />
              <div v-if="datainer.JOB_BSNS_CD === 'AQ00'" style="width: 175px">
                <v-radio-group
                  v-model="datainer.RCV_TYPECheck"
                  :readonly="disabledSTATUS"
                  inline
                  style="margin-top: 20px; width: "
                >
                  <v-radio
                    label="해양공사"
                    :value="true"
                    style="margin-right: 20px !important"
                  />
                  <v-radio label="호선" :value="false" />
                </v-radio-group>
              </div>

              <!-- <v-checkbox
                    v-if="datainer.JOB_BSNS_CD === 'AC00'"
                    style="margin-top: 20px"
                    :label="t('해양공사')"
                    v-model="datainer.RCV_TYPECheck"
                    :true-value="true"
                    :false-value="false"
                  /> -->
              <!-- 관리 감독자 값이 없을경우 -->

              <i-input
                v-if="!isGan"
                v-model="datainer.MNGR_EMP_NM"
                width="140px"
                top-label
                :label="
                  datainer.DANG_DIV === 'C01'
                    ? t('공사감독자(승인자)')
                    : t('관리감독자(승인자)')
                "
                append-inner-icon="mdi-magnify"
                @keydown.enter="
                  (e) => {
                    openEmpPopup('관리자')
                  }
                "
                @click:appendInner="openEmpPopup('관리자')"
                margin="4px"
                required
                :readonly="disabledSTATUS"
              />
              <!--   값이 있을경우 -->
              <i-select
                v-if="isGan"
                required
                v-model="datainer.MNGR_EMP_NO"
                width="140px"
                top-label
                :label="
                  datainer.DANG_DIV === 'C01'
                    ? t('공사감독자(승인자)')
                    : t('관리감독자(승인자)')
                "
                :items="codeList.MNGR_EMP_NO"
                item-title="APP_EMP_NM"
                item-value="APP_EMP_NO"
                margin="4px"
              />
              <i-input
                v-model="datainer.MNGR_HP_NO"
                width="130px"
                top-label
                :label="t('휴대폰기입')"
                phone
                margin="4px"
                required
                :readonly="disabledSTATUS || isGan"
              />
              <i-input
                v-model="datainer.MNGR_TRS_NO"
                width="130px"
                top-label
                :label="t('TRS기입')"
                :readonly="disabledSTATUS"
              />

              <i-input
                v-if="isDan"
                v-model="datainer.SHORT_WORK_NO"
                width="220px"
                top-label
                :label="t('단기공사번호')"
                append-inner-icon="mdi-magnify"
                @keydown.enter="
                  (e) => {
                    opendangiPopUp()
                  }
                "
                @click:appendInner="opendangiPopUp()"
                :readonly="disabledSTATUS"
              />
              
            </v-sheet>
        
            <!-- 작업책임자 삭제 -->
            <!-- <v-sheet class="d-flex flex-row">
            <i-input
              width="100px"
              top-label
              :label="t('작업책임자')"
              append-inner-icon="mdi-magnify"
              v-model="datainer.RESP_EMP_NM"
              @keydown.enter="
                (e) => {
                  openEmpPopup('작업')
                }
              "
              @click:appendInner="openEmpPopup('작업')"
              margin="4px"
              required
              :readonly="disabledSTATUS"
            />
            <i-input
              width="130px"
              top-label
              :label="t('휴대폰기입')"
              phone
              v-model="datainer.RESP_HP_NO"
              margin="4px"
              required
              :readonly="disabledSTATUS"
            />
            <i-input
              v-model="datainer.RESP_TRS_NO"
              width="130px"
              top-label
              :label="t('TRS기입')"
              :readonly="disabledSTATUS"
            />
          </v-sheet> -->
          </v-card-text>
        </v-card>
        <!-- 허가서 목록 -->
        <v-card class="mb-3 mx-3 popUp-input-Form">
          <v-card-title class="pa-0">
            <IGridTitle
              ref="grdTitle"
              :title="$t('허가서 목록 상세')"
              :button-list="['btnRowCopy', 'btnCreate', 'btnDelete']"
              @click-button="onButtonsClick($event.id, '위험작업허가서상세')"
            >
              <template #editors />
            </IGridTitle>
          </v-card-title>
          <v-card-text class="pa-0">
            <RealGrid
              class="mt-1"
              ref="grdMain"
              style="height: 160px"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              @onCellClicked="onCellClicked"
              @onCurrentRowChanged="rowChanged"
            />
          </v-card-text>
        </v-card>
        <!-- 장소 작업지시서 -->
        <div class="h-grow">
          <v-sheet class="pa-3 mr-3 h-auto ">
            <div class="d-flex">
              <h4>위험작업 분류</h4>
              <p v-if="isDan" style="margin-left: 12px;
              color: #1a40c7;
              font-size: 15px;
              margin-top: 4px;">
              ※우측의 작업장소 입력이 완료되어야 위험작업 분류가 활성화됩니다.
              </p>
            </div>
            <div class="d-flex">
              <i-select
                :label="t('분류')"
                v-model="DangSearch.WRK_PLC"
                width="240px"
                :items="codeList.WRK_PLC"
                item-title="TXT"
                item-value="COD"
                v-if="!isDan"
              />
              <!-- 일반 -->
              <i-select
                v-model="DangSearch.DANG_DIV"
                :label="t('위험작업 분류')"
                width="300px"
                :items="codeList.DANG_DIV1"
                item-title="TXT"
                item-value="COD"
                v-if="!isDan"
              />
              <!-- 단기공사 -->
              <i-select
                v-model="DangSearch.DANG_DIV"
                :label="t('위험작업 분류')"
                width="300px"
                :items="codeList.DANG_DIV2"
                item-title="TXT"
                item-value="COD"
                v-if="isDan"
              />
              <div
              class="d-flex align-center"
              style="width: 150px; margin-right: 10px"
            >
              <v-checkbox
                v-model="DangSearch.GBN"
                true-value="1"
                false-value="2"
                :label="t('공통 리스트 포함')"
              />
            </div>
            </div>
            <div v-if ="DangSearch.DANG_DIV === 'E03'" class="" style="width: 800px; height: 50px; overflow-x: scroll; overflow-y: hidden;">
              <div class="d-flex px-3" style="width: 1000px; height: 100%;">
                <v-checkbox class="mr-6" v-for="(radioItem, index) in codeList.WORK_COMPLEX_CD" v-model="radioItem.VAL" :key="radioItem.ALL_SYS_CD" :label="radioItem.TXT" :value="radioItem.COD" />
              </div>
            </div>  
            <v-card-title> </v-card-title>
            <v-card-text class="pa-0" >
              <RealGrid
                class="mt-1"
                style="height: 100px;"
                ref="grdSub2"
                :grid-view-option="grdProps3.gridViewOption"
                :keys="grdProps3.keys"
                :fields="grdProps3.fields"
                :columns="grdProps3.columns"
                @onCellDblClicked="onCellDblClicked"
              />
            </v-card-text>      
            <div class="d-flex h-auto">
              <h4>작업준비 및 안전조치사항 목록</h4>
              <RealGrid
                class="mt-1"
                style="height: 450px;"
                ref="grdSub3"
                :grid-view-option="grdProps4.gridViewOption"
                :keys="grdProps4.keys"
                :fields="grdProps4.fields"
                :columns="grdProps4.columns"
                @onCellDblClicked="onCellDblClicked"
              />
            </div>                    
          </v-sheet>

          <v-sheet width="54%" class="pa-3 mr-3">
            <!-- 장소 -->
            <v-card class="popUp-input-Form">
              <div class="d-flex" style="justify-content: space-between">
                <h4>작업 장소</h4>
                <div>
                  <v-btn @click="LWPClick" >즐겨찾기 장소 등록</v-btn>
                  <v-btn @click="LWPOpen">즐겨찾기 불러오기</v-btn>
                </div>
              </div>
              <div class="d-flex mt-3 align-center">
                <i-input
                  v-model="datainer.JOB_PLC"
                  :label="t('장소')"
                  width="240px"
                  append-inner-icon="mdi-magnify"
                  @keydown.enter="
                    (e) => {
                      openCCP()
                    }
                  "
                  @click:appendInner="openCCP()"
                  required
                  readonly
                  :disabled="disabledSTATUS"
                />
                <div class="d-flex align-center" style="width: 300px">
                  <p class="mr-2" style="font-size: 14px; color: #222">
                    {{ $t("호선/공사") }}
                  </p>
                  <v-select
                    v-model="datainer.WORK_NO"
                    :items="codeList.WorkNo"
                    item-value="WORK_NO"
                    :item-props="itemProps"
                    :disabled="
                      (datainer.JOB_BSNS_CD === 'AE00' ||
                      datainer.JOB_BSNS_CD === 'AC00' ||
                      datainer.JOB_BSNS_CD === 'AQ00'
                        ? false
                        : true) || disabledSTATUS
                    "
                  />
                </div>

                <div class="d-flex" style="margin-left: auto">
                  <v-btn
                    @click="onButtonsClick('btnADD_LOCATION', '상세위치')"
                    :disabled="LocationDisable"
                    >위치 추가</v-btn
                  >
                  <v-btn
                    @click="onButtonsClick('btnDELETE_LOCATION', '상세위치')"
                    :disabled="LocationDisable"
                    >위치 삭제</v-btn
                  >
                </div>

                <!-- <IGridTitle
                ref="grdTitle2"
                :button-list="['btnADD_LOCATION', 'btnDELETE_LOCATION']"
                @click-button="onButtonsClick($event.id, '상세위치')"
              >
                <template #editors />
              </IGridTitle> -->
              </div>

              <v-card-text class="pa-0">
                <!-- TYPE B  -->
                <RealGrid
                  v-if="LocationType == 'B' || LocationType == ''"
                  class="mt-1"
                  ref="grdSub1"
                  style="height: 160px"
                  :grid-view-option="grdProps2.gridViewOption"
                  :keys="grdProps2.keys"
                  :fields="grdProps2.fields"
                  :columns="grdProps2.columns"
                />
                <!-- TYPE D -->
                <RealGrid
                  v-if="LocationType == 'D'"
                  class="mt-1"
                  ref="grdSub1_1"
                  style="height: 160px"
                  :grid-view-option="grdProps2_1.gridViewOption"
                  :keys="grdProps2_1.keys"
                  :fields="grdProps2_1.fields"
                  :columns="grdProps2_1.columns"
                />
                <!-- TYPE E -->
                <RealGrid
                  v-if="LocationType == 'E'"
                  class="mt-1"
                  ref="grdSub1_2"
                  style="height: 160px"
                  :grid-view-option="grdProps2_2.gridViewOption"
                  :keys="grdProps2_2.keys"
                  :fields="grdProps2_2.fields"
                  :columns="grdProps2_2.columns"
                />
                <i-textarea
                  v-if="LocationType == 'B' || LocationType == 'C'"
                  :label="$t('위치 상세내용')"
                  width="100%"
                  topLabel
                  v-model="datainer.JOB_PLC_DTL"
                  class="mt-2"
                />
              </v-card-text>
            </v-card>

            <!-- 작업일시 -->
            <v-card class="mt-3 popUp-input-Form">
              <v-card-title class="pa-0">
                <div class="d-flex align-center">
                  <h4>작업일시</h4>
                  <div
                  v-if = "datainer.URGENT_YN === 'Y'"
                  style = "font-size: 14px ;color: red; margin-left: 20px; margin-bottom: 5px; "> 
                    ※ 긴급작업 ※ </div>
                </div>
                

              </v-card-title>
              <v-card-text class="pa-0 d-flex align-center">
                <v-btn
                  @click="openDate"
                  class="mr-5"
                  style="font-size: 14px"
                  :disabled="disabledSTATUS"
                  >설정</v-btn
                >

                <div>
                  <div class="d-flex mb-1" style="width: 826px !important">
                    <i-input
                      v-for="(i, index) in !DateInt[0].dt ? 7 : DateInt"
                      :key="index"
                      width="115px"
                      margin="8px"
                      style="text-align: center"
                      v-model="i.dt"
                      readonly
                    />
                  </div>
                  <div class="d-flex">
                    <i-input
                      v-for="(i, index) in !DateInt[0].time ? 7 : DateInt"
                      :key="index"
                      width="115px"
                      margin="8px"
                      v-model="i.time"
                      readonly
                    />
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="mt-3 popUp-input-Form" >
              <h4>추가정보</h4>

              <div class="mt-3 d-flex" v-if="false">
                <div class="addInfo">
                  <span style="font-size: 14px; font-weight: bold"
                    >밀폐구역여부</span
                  >
                  <v-radio-group
                    inline
                    style="margin-top: 4px"
                    v-model="datainer.CONFINED_YN"
                    :disabled="disabledSTATUS"
                  >
                    <v-radio label="해당" value="Y"></v-radio>
                    <v-radio label="미해당" value="N"></v-radio>
                  </v-radio-group>
                </div>

                <div class="addInfo">
                  <span style="font-size: 14px; font-weight: bold"
                    >아르곤이용작업</span
                  >
                  <v-radio-group
                    style="margin-top: 4px"
                    inline
                    v-model="datainer.ARGN_YN"
                    :disabled="disabledSTATUS"
                  >
                    <v-radio label="해당" value="Y"></v-radio>
                    <v-radio label="미해당" value="N"></v-radio>
                  </v-radio-group>
                </div>

                <div class="addInfo">
                  <span style="font-size: 14px; font-weight: bold"
                    >수전구역여부</span
                  >
                  <v-radio-group
                    inline
                    style="margin-top: 4px"
                    v-model="datainer.ELEC_YN"
                    :disabled="disabledSTATUS"
                  >
                    <v-radio label="해당" value="Y"></v-radio>
                    <v-radio label="미해당" value="N"></v-radio>
                  </v-radio-group>
                </div>
              </div>
              <div class="mt-3 d-flex" v-if="false">
                <div class="addInfo">
                  <span style="font-size: 14px; font-weight: bold"
                    >고소작업</span
                  >
                  <div class="d-flex align-center">
                    <div style="width: 134px" class="mr-5">
                      <v-radio-group
                        inline
                        v-model="datainer.HEIGHT_YN"
                        :disabled="disabledSTATUS"
                      >
                        <v-radio label="해당" value="Y"></v-radio>
                        <v-radio label="미해당" value="N"></v-radio>
                      </v-radio-group>
                    </div>
                    <i-input
                      width="130px"
                      v-model="datainer.HEIGHT"
                      number
                      :disabled="nonHEIGHT || disabledSTATUS"
                      margin="4px"
                    /><span>미터</span>
                  </div>
                </div>
              </div>
              <div class="mt-3 d-flex">
                <div class="addInfo">
                  <span style="font-size: 14px; font-weight: bold"
                    >위험구분</span
                  >
                  <div class="d-flex align-center">
                    <div style="width: 300px" class="mr-5">
                      <v-radio-group
                        inline
                        v-model="datainer.DANG_TYPE"
                        
                      >
                        <v-radio label="화기위험" value="F"></v-radio>
                        <v-radio label="고위험" value="H"></v-radio>
                        <v-radio label="저위험(단순 A/S)" value="L"></v-radio>
                      </v-radio-group>
                    </div>                   
                  </div>
                </div>
              </div>
              <div class="mt-3 d-flex">
                <div class="addInfo">
                  <span style="font-size: 14px; font-weight: bold"
                    >허가서 구분</span
                  >
                  <div class="d-flex align-center">
                    <div style="width: 134px" class="mr-5">
                      <v-radio-group
                        inline
                        v-model="datainer.PSM_YN"                        
                      >
                        <v-radio label="일반" value="N"></v-radio>
                        <v-radio label="PSM" value="Y"></v-radio>                        
                      </v-radio-group>
                    </div>                    
                  </div>
                </div>
              </div>
              <div class="mt-3 d-flex" v-if="false">
                <div class="addInfo">
                  <span style="font-size: 14px; font-weight: bold"
                    >압력테스트</span
                  >
                  <div class="d-flex align-center">
                    <div style="width: 134px" class="mr-5">
                      <v-radio-group
                        inline
                        v-model="datainer.PRESSURE_YN"
                        :disabled="disabledSTATUS"
                      >
                        <v-radio label="해당" value="Y"></v-radio>
                        <v-radio label="미해당" value="N"></v-radio>
                      </v-radio-group>
                    </div>
                    <i-input
                      v-model="datainer.PRESSURE"
                      width="130px"
                      number
                      :disabled="nonPRESSURE || disabledSTATUS"
                      margin="4px"
                    />
                    <span>Bar/Kg</span>
                  </div>
                </div>

                <div class="addInfo">
                  <span style="font-size: 14px; font-weight: bold"
                    >압력테스트PIPE직경</span
                  >
                  <div class="d-flex align-center">
                    <div style="width: 134px" class="mr-5">
                      <v-radio-group
                        inline
                        v-model="datainer.PIPE_DIA_YN"
                        :disabled="disabledSTATUS"
                      >
                        <v-radio label="해당" value="Y"></v-radio>
                        <v-radio label="미해당" value="N"></v-radio>
                      </v-radio-group>
                    </div>
                    <i-input
                      v-model="datainer.PIPE_DIA"
                      width="130px"
                      number
                      :disabled="nonPIPE_DIA || disabledSTATUS"
                      margin="4px"
                    />
                    <span>인치</span>
                  </div>
                </div>
                
                
              </div>              
            </v-card>
          </v-sheet>
        </div>
      </v-card>
    </v-card>
    
    <SAFBA0010WRK_STD ref="WrkPopup" @selected="WrkSelected1($event)" />
    <SAFBA0010WRK_STD2 ref="WrkPopup2" @selected="WrkSelected2($event)" />
    <!-- 단기공사 작업표준 -->
    <SAFBA0010DAN_WRK_STD ref="DanWrkPopup" @selected="WrkSelected3($event)" />

    <WorkPlace ref="workPlacePopUp" @selected="workPlaceSelected($event)" />
    <SAFBA0010LikeWrkPlace ref="LikeWrkPlace" @seleted="WRKLIKE($event)"  />
    <DatePopUp ref="DatePop" @upData="DateInner($event)" />
    <SafeAppPopUp ref="SafeAppPop" @upData="SafeAppComplished($event)" />
    <dangi ref="dangiPopUp" @selected="dangiSelect($event)" />
    <CommonCodePopUpSAF ref="CCP" @selected="selected" />
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
    <!--담당자 팝업-->
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />
    <!-- OZReport -->


    <OZReport
      :showPop="showOz"
      :MultiArr="params"
      :isMulti="(isMulti = true)"
      @close="showOz = $event"
      @falseMulti="isMulti = $event"
    />
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 139px);
  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
h4 {
  font-size: 18px;
  font-weight: 700;
  color: #222;
}

.addInfo {
  margin-right: 30px;
  height: 71px;
}
</style>
