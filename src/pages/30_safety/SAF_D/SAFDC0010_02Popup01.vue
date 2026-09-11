<script setup>
import { ref, reactive, computed, onMounted, nextTick, getCurrentInstance } from "vue"

import { useUserStore } from "@hiway/stores/user"

import { useLogsStore } from "@hiway/stores/logs"

import {

  commonPgExecuteApi,

  commonPgSearchApi,

  getPgCodeList,

  commonSendApi,

} from "@hiway/api/commonApi"

import Message from "@hiway/utils/notify"

import IGridTitle from "@/components/IGridTitle.vue"

import { useI18n } from "vue-i18n"

import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"

import { isEmpty } from "lodash-es"

import dayjs from "dayjs"

import EmpPopup from "@/components/popup/EmpPopup.vue"

import SafeRuleGbnPopup from "@/components/popup/SafeRuleGbnPopup.vue"

import DeptPopup from "@/components/popup/DeptPopup.vue"

import saveFlowHelper from "@/utils/saveFlowHelper"

import deleteFlowHelper from "@/utils/deleteFlowHelper"

import SAFDC0010BikeNoPopup from "./SAFDC0010BikeNoPopup.vue"

import SAFDC0010CarNoPopup from "./SAFDC0010CarNoPopup.vue"

import SAFDC0010VioCntPopup from "./SAFDC0010VioCntPopup.vue"

import CommonCodePopUpSAF from "@/components/popup/CommonCodePopUpSAF.vue"

import SAFDC0010VioDivPopup from "./SAFDC0010VioDivPopup.vue"

import IUpload from "@/components/IUpload.vue"

import IUploadImageMulit from "@/components/IUploadImageMulit.vue"

import LocationPopup from "@/components/popup/LocationPopup.vue"

const props = defineProps({

  autoQuery: { type: Boolean, default: false },

  maxFileSize: { type: Number, default: 20 },

  gridTitle: { type: String, default: "파일첨부" },

  buttonList: {

    type: Array,

    default() {

      return ["btnApplyApprove", "btnApplyCancel", "btnApplyTurnBack", "btnClose"]

    },

  },

  fileInputText: { type: String, default: "여기에 파일을 끌어놓으세요." },

  isVisibled: { type: Boolean, default: true },

  showSearchMessage: { type: Boolean, default: true },

  guid2: { type: String, default: "" },

  imgOnly: { type: Boolean, default: false },

  pdfOnly: { type: Boolean, default: false },

  autoUpload: { type: Boolean, default: true },

  fileDan: { type: Boolean, default: false },

  cmpnyUseYn: { type: Boolean, default: true },

  previewOnDblClick: { type: Boolean, default: false },

  readOnly: { type: Boolean, default: false },

  width: { type: [Number, String], default: 800 },

})

const emit = defineEmits(["uploaded", "deleted", "closed"])

const vehicleTypeOptions = [

  { value: "A", label: "차량" },

  { value: "B", label: "오토바이" },

  { value: "C", label: "자전거" },

  { value: "D", label: "보행자" },

  { value: "Z", label: "기타" },

]

const normalizeVehicleType = value => {

  const option = vehicleTypeOptions.find(

    ({ value: code, label }) => code === value || label === value,

  )

  return option?.value ?? String(value ?? "").trim().toUpperCase()

}

const trafficReg = ref(false)

const vm = getCurrentInstance().proxy

const userStore = useUserStore()

const userLogStore = useLogsStore()

const dialog = ref(false)

const grdMain = ref(null)

const t = useI18n().t

const menuTitle = ref(null)

const approvalReadOnly = ref(true) //승인신청 disabled

// const approvalCancelDisabled = ref(true);

const locationPopup = ref(null) // 장소 선택

const imageUpload = ref(null)

//수칙위반 관련 로직 시작

const safetyEmpPopup = ref(null) //성명

const safetyFileUpload = ref(null) //위반사항 파일첨부

const safetyActionFileUpload = ref(null) //조치사항 파일첨부

const imageUpload2 = ref(null) //조치사항 사진첨부

const safetyActEmpPopup = ref(null) //조치자성명

const safetyDansokEmpPopup = ref(null) //단속자성명

const checkTargetPopup = ref(null) //점검대상물 팝업

const vioDivPopup = ref(null) //위반종류 팝업

const sagoDivPopup = ref(null) //잠재사고유형 팝업

const safetyVioDeptPopup = ref(null) //위반조직 팝업

const appEmail = ref("")

const fileBtnVisible = ref("")

const onload = ref(false)

const readOnlyValue = reactive({

  VEHICLE_CAR_NO: true,

  RESIST_NO: true,

  ICON: false,

  CAR_NO_ICON: "",

  RESIST_NO_ICON: "",

})

const vehicleInfoEnabled = computed(() => trafficReg.value)

const safetyField = reactive({

  VIO_NO: "",                   // 위반No

  VIO_TIME: "",                 // 위반일시 원본

  VIO_DT1: "",                  // 위반일시

  VIO_TIME2: "",                // 위반시각

  VIO_LPLC: "",                 // 위반장소(대)

  VIO_MPLC: "",                 // 위반장소(중)

  VIO_SPLC: "",                 // 위반장소(소)

  VIO_SPLC_NM: "",              // 위반장소명

  VIO_PLC_DESC: "",             // 위반장소상세

  SHIP_NO: "",                  // 호선/프로젝트 No.

  BSNS_CD: "",                  // 위반자 사업부

  VIOLATOR: "",                 // 위반자 성명

  VIO_EMP_NO: "",               // 위반자 사번

  JOB_TIT_NM: "",               // 위반자 직위

  DEPT_CD: "",                  // 위반자 부서

  VIO_EMP_ASGN: "",             // 위반자 소속조직

  ASGN_CD: "",                  // 위반자 조직 코드

  IO_DIV: "",                   // 위반자 대상구분(직영/협력사)

  VEND_NAME: "",                // 수기입력 업체명

  VIO_GDIV_NM: "",              // 위반종류명

  VIO_GDIV: "",                 // 위반종류 코드

  VIO_MDIV_NM: "",              // 위반종류상세명

  VIO_MDIV: "",                 // 위반종류상세 코드

  // CHECK_TARGET_OBJ1: "",     // 점검대상물(대) - 사용 안함

  // CHECK_TARGET_OBJ1_NM: "",  // 점검대상물(대)명 - 사용 안함

  // CHECK_TARGET_OBJ2: "",     // 점검대상물(중) - 사용 안함

  // CHECK_TARGET_OBJ2_NM: "",  // 점검대상물(중)명 - 사용 안함

  // CHECK_TARGET_OBJ3: "",     // 점검대상물(소) - 사용 안함

  // CHECK_TARGET_OBJ3_NM: "",  // 점검대상물(소)명 - 사용 안함

  // SAGO_DIV_L: "",            // 잠재사고유형LV1 - 사용 안함

  // SAGO_DIV_L_NM: "",         // 잠재사고유형LV1명 - 사용 안함

  // SAGO_DIV_M: "",            // 잠재사고유형LV2 - 사용 안함

  // SAGO_DIV_M_NM: "",         // 잠재사고유형LV2명 - 사용 안함

  // SAGO_DIV_S: "",            // 잠재사고유형LV3 - 사용 안함

  // SAGO_DIV_S_NM: "",         // 잠재사고유형LV3명 - 사용 안함

  VIO_DESC: "",                 // 위반 내용

  IMG_ID1: "",                  // 위반내용 사진첨부 아이디

  FILE_ID1: "",                 // 위반 내용 파일첨부 아이디

  //ACT_BSNS_CD: "",    // 조치자 사업부

  ACT_BSNS_CD: "",      // 조치자 사업부

  ACT_ASGN_CD: "",      // 조치자 조직 코드

  ACT_ASGN_NM: "",      // 조치자 조직명

  ACTOR: "",            // 조치자 성명

  ACT_EMP_NO: "",       // 조치자 사번

  ACT_JOB_TIT_NM: "",   // 조치자 직위

  ACT_DEPT_CD: "",      // 조치자 소속

  ACT_PHONE: "",        // 조치자 전화번호

  ACT_RSLT: "",         // 조치내용

  ACT_DIV: "",          // 조치구분

  ACT_DATE: "",         // 조치일시

  ACT_TIME: "",         // 조치일시 원본

  IMG_ID2: "",          // 조치내용 사진첨부 아이디

  FILE_ID2: "",         // 조치내용 파일첨부 아이디

  DANSOK_EMP_NM: userStore.empNm,       // 단속자 성명

  DANSOK_ASGN_CD: userStore.asgnCd,     // 단속자 조직 코드

  DANSOK_ASGN_NM: userStore.asgnFullNm, // 단속자 조직명

  DANSOK_JOB_TIT_NM: "",               // 단속자 직위

  DANSOK_DEPT_CD: userStore.deptCd,     // 단속자 부서 코드

  DANSOK_EMP_NO: userStore.empNo,       // 단속자 사번

  APP_SAME: "N",                        // 승인자 동일 체크여부

  APP_EMP_NM: "",                       // 승인자 성명

  APP_EMP_NO: "",                       // 승인자 사번

  APP_JOB_TIT_NM: "",                   // 승인자 직위

  APP_ASGN_CD: "",                   // 승인자 조직

  APP_DEPT: "",                      // 승인자 부서

  VEHICLE_TYPE: "A",                    // 차량 종류

  VEHICLE_CAR_NO: "",                   // 차량번호

  VEHICLE_REG_NO: "",                   // 등록번호(내부)

  VEHICLE_SPEED: "",                    // 주행속도

  SIGN_ID: "",                          // 결재 서명 ID

  CHECK_TARGET_OBJ1: "",

  CHECK_TARGET_OBJ1_NM: "",

  CHECK_TARGET_OBJ2: "",

  CHECK_TARGET_OBJ2_NM: "",

  CHECK_TARGET_OBJ3: "",

  CHECK_TARGET_OBJ3_NM: "",

  SAGO_DIV_L: "",

  SAGO_DIV_L_NM: "",

  SAGO_DIV_M: "",

  SAGO_DIV_M_NM: "",

  SAGO_DIV_S: "",

  SAGO_DIV_S_NM: "",

  INSERT_USER_ID: "", // 등록자 아이디

  STATUS: "", // 상태

  COMPANY: "", // 위반자 회사

  ASGN_NM: "", // 위반조직명

  VEND_CD: "", // 업체코드

  DIV: "A", // 위반 구분 (A: 수칙위반, B: 교통위반)

})

const vehicleFieldsDisabled = computed(() =>

  ["C", "D"].includes(safetyField.VEHICLE_TYPE),

)

// 안전수칙 팝업에서 사용하는 대상구분/승인자/위반종류/호선 목록

const codeList = reactive({

  GUBUN: [],

  APP_EMP_NO: [],

  VIO_GDIV: [],

  VIO_MDIV: [],

  SHIP_NO: [],

  ACT_DIV: [],

})

// 저장된 장소 코드를 LocationPopup 조회 규칙으로 명칭에 복원한다.

const loadLocationPath = async () => {

  const cmpnyDiv = safetyField.COMPANY || userStore.cmpnyDiv

  const result = {

    LOC_LARGE_NM: "",

    LOC_MEDIUM_NM: "",

    LOC_SMALL_NM: "",

  }

  if (!safetyField.VIO_LPLC) return result

  const largeRes = await commonPgSearchApi(

    {

      queryId: "PTWA0010_SEARCH_LOC",

      param: { CMPNY_DIV: cmpnyDiv, LOCATION_LVL: "1", UP_CD: null },

    },

    { useProgress: false },

  )

  const large = (largeRes.ORESULT_CUR || []).find(

    row => row.LOCATION_CODE === safetyField.VIO_LPLC,

  )

  result.LOC_LARGE_NM = large?.LOCATION_DESC || ""

  if (!large || !safetyField.VIO_MPLC) return result

  const mediumRes = await commonPgSearchApi(

    {

      queryId: "PTWA0010_SEARCH_LOC",

      param: { CMPNY_DIV: cmpnyDiv, LOCATION_LVL: "2", UP_CD: safetyField.VIO_LPLC },

    },

    { useProgress: false },

  )

  const medium = (mediumRes.ORESULT_CUR || []).find(

    row =>

      row.LOCATION_CODE === safetyField.VIO_MPLC &&

      row.ALL_UP_CD === large.ALL_LOCATION_COD,

  )

  result.LOC_MEDIUM_NM = medium?.LOCATION_DESC || ""

  if (!medium || !safetyField.VIO_SPLC) return result

  const smallRes = await commonPgSearchApi(

    {

      queryId: "PTWA0010_SEARCH_LOC",

      param: { CMPNY_DIV: cmpnyDiv, LOCATION_LVL: "3", UP_CD: safetyField.VIO_MPLC },

    },

    { useProgress: false },

  )

  const small = (smallRes.ORESULT_CUR || []).find(

    row =>

      row.LOCATION_CODE === safetyField.VIO_SPLC &&

      row.ALL_UP_CD === medium.ALL_LOCATION_COD,

  )

  result.LOC_SMALL_NM = small?.LOCATION_DESC || ""

  return result

}

//안전수칙위반 코드 초기화

const initcodeList = () => {

  Promise.all([

    //대상구분

    getPgCodeList("HHIZ020"),

    //승인자

    commonPgSearchApi({

      queryId: "SAFDC0010_SEARCH_04",

      param: {

        // CMPNY_DIV: 'HHI',

        // 일렉일 경우 승인자가 나오지 않아서, 사용자의 회사구분 코드를 넘김.

        CMPNY_DIV: userStore.cmpnyDiv,

        DANSOK_EMP_NO: safetyField.DANSOK_EMP_NO,

      },

    }),

    //위반종류

    getPgCodeList("HHIG110"),

    //호선/프로젝트 No 목록

    commonPgSearchApi({

      queryId: "SAFDC0010_SEARCH_17",

      param: {},

    }),

    //조치구분

    getPgCodeList("HHIG170"),

  ]).then(res => {

    // console.log(res);

    // console.log("호선 받는중!");

    // console.log(res[1].ORESULT_CUR);

    codeList.GUBUN = res[0].ORESULT_CUR

    codeList.APP_EMP_NO = res[1].ORESULT_CUR

    codeList.VIO_GDIV = res[2].ORESULT_CUR.filter(x => !x.COD.includes('S') && !x.COD.includes('C'))

    codeList.SHIP_NO = res[3].ORESULT_CUR.map(item => item.SHIP_COD)

    codeList.ACT_DIV = res[4].ORESULT_CUR

  })

  safetyField.VIO_TIME2 = "00:00" //위반일시 옆 시간에 자정

}

// 작업장소 팝업 열기: 현재 선택된 대/중/소 코드와 명칭을 복원해서 전달한다.

const openLocationPopup = async () => {

  const locationPath = await loadLocationPath()

  locationPopup.value?.openPopup({

    CMPNY_DIV: safetyField.COMPANY || userStore.cmpnyDiv,

    LOC_LARGE: safetyField.VIO_LPLC,

    LOC_LARGE_NM: locationPath.LOC_LARGE_NM,

    LOC_MEDIUM: safetyField.VIO_MPLC,

    LOC_MEDIUM_NM: locationPath.LOC_MEDIUM_NM,

    LOC_SMALL: safetyField.VIO_SPLC,

    LOC_SMALL_NM: locationPath.LOC_SMALL_NM,

  })

}

const openPopup = () => {

  if (isEmpty(safetyField.VIO_NO)) {

    safetyField.VIO_DT1 = dayjs().format("YYYY-MM-DD")

    safetyField.VIO_TIME2 = dayjs().format("HH:mm")

    safetyField.DANSOK_EMP_NO = userStore.empNo || ""

    safetyField.DANSOK_EMP_NM = userStore.empNm || ""

    safetyField.DANSOK_ASGN_CD = userStore.asgnCd || ""

    safetyField.DANSOK_ASGN_NM = userStore.asgnFullNm || ""

    safetyField.DANSOK_DEPT_CD = userStore.deptCd || ""

    safetyField.APP_EMP_NO = userStore.empNo || ""

    // 신규 등록은 승인자 동일을 해제하고 승인신청/취소 버튼을 활성화한다.

    safetyField.APP_SAME = "N"

    approvalReadOnly.value = false

    //approvalCancelDisabled.value = true;

  }

  dialog.value = true

}

const mapRowToSafetyField = (rowData = {}) => {

  const aliasMap = {

    // 조회 컬럼명이 화면 필드명과 다른 경우만 정의한다.

    ACT_TIME_DS: "ACT_TIME",

    act_time_ds: "ACT_TIME",

    ACT_DATE: "ACT_DATE",

    act_date: "ACT_DATE",

    cmpny_div: "COMPANY",

    COMPNY_DIV: "COMPANY",

    compny_div: "COMPANY",

    BSNS_NM: "BSNS_CD",

    bsns_nm: "BSNS_CD",

    DEPT_CD: "DEPT_CD",

    dept_cd: "DEPT_CD",

    DEPT_NM: "DEPT_CD",

    dept_nm: "DEPT_CD",

    JOB_TIT_NM: "JOB_TIT_NM",

    job_tit_nm: "JOB_TIT_NM",

    VIO_EMP_ASGN: "VIO_EMP_ASGN",

    vio_emp_asgn: "VIO_EMP_ASGN",

    VEND_NAME: "VEND_NAME",

    vend_name: "VEND_NAME",

    DTL_ASGN_NM: "ASGN_CD",

    dtl_asgn_nm: "ASGN_CD",

    ACT_RESULT: "ACT_RSLT",

    act_result: "ACT_RSLT",

    VIO_PHOTO: "IMG_ID1",

    vio_photo: "IMG_ID1",

    ACT_PHOTO: "IMG_ID2",

    act_photo: "IMG_ID2",

    VIO_FILE: "FILE_ID1",

    vio_file: "FILE_ID1",

    ACT_FILE: "FILE_ID2",

    act_bsns_cd: "ACT_BSNS_CD",

    app_same: "APP_SAME",

    app_asgn_cd: "APP_ASGN_CD",

    app_dept: "APP_DEPT",

    sign_id: "SIGN_ID",

    act_file: "FILE_ID2",

    file_id1: "FILE_ID1",

    file_id2: "FILE_ID2",

    img_id1: "IMG_ID1",

    img_id2: "IMG_ID2",

    VEHICLE_TYPE: "VEHICLE_TYPE",

    VEHICLE_CAR_NO: "VEHICLE_CAR_NO",

    VEHICLE_REG_NO: "VEHICLE_REG_NO",

    VEHICLE_SPEED: "VEHICLE_SPEED",

  }

  Object.entries(rowData).forEach(([key, value]) => {

    const normalizedKey = aliasMap[key] ?? key.toUpperCase()

    if (!Object.prototype.hasOwnProperty.call(safetyField, normalizedKey)) return

    if (normalizedKey === "VIO_TIME" && value) {

      const vioTime = String(value)

      if (/^\d{12}$/.test(vioTime)) {

        safetyField.VIO_DT1 = `${vioTime.substring(0, 4)}-${vioTime.substring(4, 6)}-${vioTime.substring(6, 8)}`

        safetyField.VIO_TIME2 = `${vioTime.substring(8, 10)}:${vioTime.substring(10, 12)}`

      } else if (vioTime.length >= 10) {

        safetyField.VIO_DT1 = vioTime.substring(0, 10).replaceAll(".", "-")

        safetyField.VIO_TIME2 = vioTime.length >= 16 ? vioTime.substring(11, 16) : ""

      }

      return

    }

    if (normalizedKey === "ACT_TIME" && typeof value === "string" && value.length >= 10) {

      return

    }

    safetyField[normalizedKey] = value ?? ""

  })

  const rawViolationTime = String(

    rowData.VIO_TIME ??

    rowData.vio_time ??

    rowData.VIO_TIME_DS ??

    rowData.vio_time_ds ??

    safetyField.VIO_TIME ??

    "",

  ).trim()

  if (/^\d{12}$/.test(rawViolationTime)) {

    safetyField.VIO_DT1 = `${rawViolationTime.substring(0, 4)}-${rawViolationTime.substring(4, 6)}-${rawViolationTime.substring(6, 8)}`

    safetyField.VIO_TIME2 = `${rawViolationTime.substring(8, 10)}:${rawViolationTime.substring(10, 12)}`

  } else {

    const violationTimeMatch = rawViolationTime.match(

      /^(\d{4})[-./](\d{2})[-./](\d{2})(?:[T\s]+(\d{2}):?(\d{2}))?/,

    )

    if (violationTimeMatch) {

      safetyField.VIO_DT1 = `${violationTimeMatch[1]}-${violationTimeMatch[2]}-${violationTimeMatch[3]}`

      if (violationTimeMatch[4] && violationTimeMatch[5]) {

        safetyField.VIO_TIME2 = `${violationTimeMatch[4]}:${violationTimeMatch[5]}`

      }

    }

  }

  const rawViolationTime2 = String(

    rowData.VIO_TIME2 ?? rowData.vio_time2 ?? safetyField.VIO_TIME2 ?? "",

  ).trim()

  if (/^\d{4}$/.test(rawViolationTime2)) {

    safetyField.VIO_TIME2 = `${rawViolationTime2.substring(0, 2)}:${rawViolationTime2.substring(2, 4)}`

  }

  if (safetyField.VIO_TIME && !safetyField.VIO_DT1) {

    safetyField.VIO_DT1 = String(safetyField.VIO_TIME).substring(0, 10)

  }

  if (safetyField.VIO_TIME && !safetyField.VIO_TIME2) {

    safetyField.VIO_TIME2 = String(safetyField.VIO_TIME).length >= 16

      ? String(safetyField.VIO_TIME).substring(11, 16)

      : ""

  }

  if (safetyField.ACT_TIME && !safetyField.ACT_RSLT) {

    safetyField.ACT_RSLT = String(safetyField.ACT_TIME)

  }

  if (!safetyField.ACT_ASGN_NM && safetyField.ACT_DEPT_CD) {

    safetyField.ACT_ASGN_NM = safetyField.ACT_DEPT_CD

  }

}

//로우 더블클릭시 안전수칙위반 데이터 바인딩

const openPopup2 = async rowData => {

  console.log("받은데이터", rowData)

  dialog.value = true

  const mappedRow = { ...rowData }

  mapRowToSafetyField(mappedRow)

  safetyField.VEHICLE_TYPE = normalizeVehicleType(safetyField.VEHICLE_TYPE)

  trafficReg.value = safetyField.VIO_GDIV === "C"

  // 기존 행에 승인자 동일 값이 없던 데이터는 미선택 상태로 연다.

  safetyField.APP_SAME = String(

    rowData.APP_SAME ?? rowData.app_same ?? safetyField.APP_SAME ?? "N",

  ).trim().toUpperCase() === "Y" ? "Y" : "N"

  safetyField.APP_EMP_NO =

    rowData.APP_EMP_NO ?? rowData.app_emp_no ?? safetyField.APP_EMP_NO ?? ""

  // 그리드 조회 결과의 대소문자 차이와 관계없이 위반 파일 ID를 직접 확정한다.

  const violationFileId = String(

    rowData.FILE_ID1 ?? rowData.file_id1 ?? safetyField.FILE_ID1 ?? "",

  ).trim()

  safetyField.FILE_ID1 = violationFileId

  // 조회 결과에 장소명이 없으면 장소 코드로 대/중/소 명칭을 복원한다.

  if (!safetyField.VIO_SPLC_NM && safetyField.VIO_LPLC) {

    const locationPath = await loadLocationPath()

    const locationNames = [

      locationPath.LOC_LARGE_NM,

      locationPath.LOC_MEDIUM_NM,

      locationPath.LOC_SMALL_NM,

    ].filter(Boolean)

    safetyField.VIO_SPLC_NM = locationNames.join(" › ")

  }

  // 다이얼로그와 업로드 컴포넌트가 렌더링된 다음 기존 첨부를 조회한다.

  loadAttachmentFiles()

  //대상구분,승인자 조회

  Promise.all([

    getPgCodeList("HHIZ020"),

    commonPgSearchApi({

      queryId: "SAFDC0010_SEARCH_04",

      param: {

        CMPNY_DIV: userStore.cmpnyDiv,

        DANSOK_EMP_NO: safetyField.DANSOK_EMP_NO, //단속자 사번

      },

    }),

    //위반종류

    getPgCodeList('HHIG110'),

    //조치구분

    getPgCodeList("HHIG170"),

  ]).then(res => {

    codeList.GUBUN = res[0].ORESULT_CUR

    codeList.APP_EMP_NO = res[1].ORESULT_CUR

    safetyField.APP_EMP_NO = rowData.APP_EMP_NO ?? rowData.app_emp_no ?? safetyField.APP_EMP_NO

    codeList.VIO_GDIV = res[2].ORESULT_CUR.filter(x => !x.COD.includes('S') && !x.COD.includes('C'))

    codeList.ACT_DIV = res[3].ORESULT_CUR

  })

  console.log("Safety Field:", safetyField)

  setSafetyButtonStatus() //상태에 따른 버튼 활성화,비활성화 처리

  onload.value = true

}

// 조회 전용 팝업의 차량 영역에서 사용하는 이벤트 핸들러

const changeVioDiv = () => { }

const openCarPopup = () => { }

const checkResistCarNo = () => { }

// 저장된 사진/파일 ID로 각 업로드 그리드의 기존 목록을 조회한다.

const loadAttachmentFiles = async () => {

  await nextTick()

  await nextTick()

  const attachmentTargets = [

    { component: imageUpload.value, fileId: safetyField.IMG_ID1 },

    { component: imageUpload2.value, fileId: safetyField.IMG_ID2 },

    { component: safetyFileUpload.value, fileId: safetyField.FILE_ID1 },

    { component: safetyActionFileUpload.value, fileId: safetyField.FILE_ID2 },

  ]

  for (const target of attachmentTargets) {

    if (!target.component) continue

    // 이전 행의 첨부 목록을 제거한 뒤 현재 행의 ID를 주입한다.

    target.component.clearGrid?.()

    // 저장된 ID가 있을 때만 COM_FILE_SEARCH_01 조회를 실행한다.

    // ID가 없으면 새 업로드용 GUID만 준비하고 불필요한 조회는 하지 않는다.

    if (target.fileId) {

      target.component.setGuid(target.fileId)

      target.component.onButtonsClick({ id: "btnSearch" })

    } else {

      target.component.setGuid()

    }

  }

}

onMounted(() => {

  initcodeList()

})

const setSafetyButtonStatus = () => {

  //안전수칙 삭제 관리자면 삭제 버튼 활성화(2026.05.07)

  if (

    userStore.authGrpCd.includes("GRP00528") ||

    userStore.authGrpCd.includes("GRP00609")

  ) {

    console.log("안전수칙 삭제 관리자임")

    menuTitle.value.disableBtn("btnDelete", false) // 삭제버튼 활성화

  }

  //데이터를 저장한 사람이 로그인 유저와 일치하면 삭제,승인신청 활성화 일치하지 않으면 비활성화, 2026.01.22 단속자 조건 추가

  else if (

    (userStore.userId === safetyField.INSERT_USER_ID ||

      userStore.userId === safetyField.DANSOK_EMP_NO) &&

    safetyField.STATUS

  ) {

    console.log("로그인유저와 일치함")

    menuTitle.value.disableBtn("btnDelete", false) //삭제버튼활성화

    approvalReadOnly.value = false //승인신청 활성화

    //승인대기상태 일때는 승인신청,삭제 비활성화

    if (safetyField.STATUS === "20") {

      console.log("2")

      approvalReadOnly.value = true //승인신청 비활성화

      //approvalCancelDisabled.value = false;

      menuTitle.value.disableBtn("btnDelete", true) //삭제버튼 비활성화

    }

    //승인상태일때는 승인신청,승인취소,삭제 비활성화

    else if (safetyField.STATUS === "30") {

      console.log("3")

      approvalReadOnly.value = true

      //approvalCancelDisabled.value = true;

      menuTitle.value.disableBtn("btnDelete", true)

    } else if (safetyField.STATUS === "11") {

      console.log("반려")

      approvalReadOnly.value = true

      //approvalCancelDisabled.value = true;

      menuTitle.value.disableBtn("btnUpdate", true) //저장버튼 비활성화

      menuTitle.value.disableBtn("btnDelete", false) //삭제버튼 활성화

    }

  } else {

    console.log("로그인유저와 일치하지 않음")

    menuTitle.value.disableBtn("btnDelete", true) //삭제버튼 비활성화

    menuTitle.value.disableBtn("btnUpdate", true) //저장버튼 비활성화

    approvalReadOnly.value = true //승인신청 비활성화

    //approvalCancelDisabled.value = true;

  }

  if (safetyField.STATUS === "30") {

    fileBtnVisible.value = true

  } else {

    fileBtnVisible.value = false

  }

  setApprovalStatus()

}

const setApprovalStatus = () => {

  approvalReadOnly.value = safetyField.APP_SAME !== "N"

}

const onButtonsClick = btn => {

  if (btn.id === "btnApprove") {

    approval()

  } else if (btn.id === "btnApproveCancel") {

    cancelApproval()

  } else if (btn.id === "btnReject") {

    reject()

  } else {

    closePopup()

    //팝업 닫을때 초기화

  }

}

const closePopup = () => {

  for (let i in safetyField) {

    safetyField[i] = ""

  }

  safetyField.APP_SAME = "N"

  menuTitle.value?.disableBtn("btnDelete", false) //삭제버튼활성화

  menuTitle.value?.disableBtn("btnUpdate", false) //저장버튼활성화

  imageUpload.value?.clearGrid?.()

  imageUpload2.value?.clearGrid?.()

  safetyFileUpload.value?.clearGrid?.()

  safetyActionFileUpload.value?.clearGrid?.()

  emit("closed")

  dialog.value = false

}

//안전수칙위반 삭제관련 로직 시작

const beforeDelete = () => {

  if (

    userStore.authGrpCd.includes("GRP00528") ||

    userStore.authGrpCd.includes("GRP00609")

  ) {

    return true

  } else if (userStore.userId != safetyField.INSERT_USER_ID) {

    Message.warn(t("수칙위반 삭제는 등록자 본인만 가능합니다."))

    return false

  }

  return true

}

// 데이터 삭제

const deleteData = () => {

  let deleteParam = []

  let deleteData = {

    CMPNY_DIV: userStore.cmpnyDiv,

    VIO_NO: safetyField.VIO_NO,

    REASON: "",

    USER_ID: userStore.userId,

  }

  deleteParam.push(deleteData)

  return commonPgExecuteApi({

    queryId: "SAFDC0010_DELETE02",

    list: deleteParam,

  })

}

const afterDelete = () => {

  closePopup()

}

//안전수칙위반 삭제관련 로직 끝

//안전수칙위반 저장 Validation

const beforeSafetySave = () => {

  if (!safetyField.VIO_DT1 || !safetyField.VIO_TIME2) {

    Message.warn(t("위반일시,시각은 필수값입니다."))

    return false

  }

  else if (!safetyField.VIOLATOR) {

    Message.warn(t("위반자성명은 필수값입니다."))

    return false

  }

  else if (!safetyField.ASGN_NM) {

    Message.warn(t("위반조직은 필수값입니다."))

    return false

  }

  else if (!safetyField.VIO_GDIV || !safetyField.VIO_GDIV_NM) {

    Message.warn(t("위반종류는 필수값입니다."))

    return false

  }

  else if (!safetyField.VIO_MDIV || !safetyField.VIO_MDIV_NM) {

    Message.warn(t("위반종류 상세는 필수값입니다."))

    return false

  }

  else if (!safetyField.VIO_SPLC_NM) {

    Message.warn(t("장소는 필수값입니다."))

    return false

  }

  else if (!safetyField.DANSOK_EMP_NM) {

    Message.warn(t("단속자는 필수값입니다."))

    return false

  }

  // else if (!safetyField.APP_EMP_NO) {

  //   Message.warn(t("승인자는 필수값입니다."));

  //   return false;

  // }

  return true

}

//안전수칙위반 저장

const saveSafetyData = () => {

  let saveParam = []

  let saveData = {

    //TFA1010C01(안전수칙위반 master)

    CMPNY_DIV: userStore.cmpnyDiv,    //사업장구분(HHI) |

    VIO_NO: safetyField.VIO_NO,       //위반No |

    VIO_DT1: safetyField.VIO_DT1,     //위반일시 |

    VIO_TIME2: safetyField.VIO_TIME2, //위반일시 옆 시간 |

    VIO_LPLC: safetyField.VIO_LPLC,         //위반장소(대)  |

    VIO_MPLC: safetyField.VIO_MPLC,         //위반장소(중)  |

    VIO_SPLC: safetyField.VIO_SPLC,         //위반장소(소)  |

    VIO_PLC_DESC: safetyField.VIO_PLC_DESC, //위반장소상세  |

    SHIP_NO: safetyField.SHIP_NO,           //호선/프로젝트 No. |

    //위반정보

    BSNS_CD: safetyField.BSNS_CD,           //위반자 사업부 | (사업본부)

    VIOLATOR: safetyField.VIOLATOR,         //위반자 성명 |

    VIO_EMP_NO: safetyField.VIO_EMP_NO,     //위반자 사번 |

    //JOB_TIT_NM :safetyField.JOB_TIT_NM,     //위반자 직위 (불필요한듯)

    DEPT_CD: safetyField.DEPT_CD,           //위반자 부서(소속조직) |

    ASGN_CD: safetyField.ASGN_CD,           //위반 조직 |

    IO_DIV: safetyField.IO_DIV,             //위반자 대상구분(직영,협력사) |

    VEND_NAME: safetyField.VEND_NAME,       //수기입력 (위반조직으로 검색되지 않는 경우에 수기입력하세요) |

    //위반 내용

    VIO_GDIV: safetyField.VIO_GDIV, //위반 종류 |

    VIO_MDIV: safetyField.VIO_MDIV, //위반 종류 상세 |

    VIO_DESC: safetyField.VIO_DESC, //위반 내용 |

    IMG_ID1: safetyField.IMG_ID1,   //위반내용 사진첨부 아이디

    FILE_ID1: safetyField.FILE_ID1, //위반 내용 파일첨부 아이디 |

    //조치 내용

    //ACT_BSNS_CD: safetyField.ACT_BSNS_CD,     //조치자 사업부

    ACT_ASGN_CD: safetyField.ACT_ASGN_CD,       //조치자 조직 코드

    ACT_ASGN_NM: safetyField.ACT_ASGN_NM,       //조치자 조직명

    ACTOR: safetyField.ACTOR,                   //조치자 성명

    ACT_EMP_NO: safetyField.ACT_EMP_NO,        //조치자 사번

    //ACT_JOB_TIT_NM: safetyField.ACT_JOB_TIT_NM, //조치자 직위 (불필요한듯)

    ACT_DEPT_CD: safetyField.ACT_DEPT_CD,       //조치자 소속

    ACT_PHONE: safetyField.ACT_PHONE,           //조치자 전화번호

    ACT_RSLT: safetyField.ACT_RSLT,             //조치내용

    ACT_DIV: safetyField.ACT_DIV,               //조치구분

    IMG_ID2: safetyField.IMG_ID2,               //조치내용 사진첨부 아이디 X

    FILE_ID2: safetyField.FILE_ID2,             //조치내용 파일첨부 아이디 |

    //단속자/승인자 정보

    DANSOK_ASGN_CD: safetyField.DANSOK_ASGN_CD,   //단속자 조직 |

    DANSOK_EMP_NO: safetyField.DANSOK_EMP_NO,     //단속자 사번 |

    DANSOK_DEPT_CD: safetyField.DANSOK_DEPT_CD,   //단속자 부서 코드|

    APP_SAME: safetyField.APP_SAME,               //승인자 동일 체크여부

    APP_ASGN_CD: safetyField.APP_ASGN_CD,         //승인자 조직

    APP_EMP_NO: safetyField.APP_EMP_NO,           //승인자 사번 |

    APP_DEPT: safetyField.APP_DEPT,               //승인자 부서

    //차량정보(교통수칙, VEHICLE)

    VEHICLE_TYPE: safetyField.VEHICLE_TYPE,          //차량 종류

    VEHICLE_CAR_NO: safetyField.VEHICLE_CAR_NO,      //차량번호

    VEHICLE_REG_NO: safetyField.VEHICLE_REG_NO,      //등록번호(내부)

    VEHICLE_SPEED: safetyField.VEHICLE_SPEED,       //주행속도

    USER_ID: userStore.userId,                      //유저아이디 |

    COMPANY: safetyField.COMPANY,                   //위반자 회사 |

    // 제외!!! (잠재사고유형, 점검대상물, 조치사항 파일 첨부)

    // CHECK_TARGET_OBJ1: safetyField.CHECK_TARGET_OBJ1, //점검대상물(대)

    // CHECK_TARGET_OBJ2: safetyField.CHECK_TARGET_OBJ2, //점검대상물(중)

    // CHECK_TARGET_OBJ3: safetyField.CHECK_TARGET_OBJ3, //점검대상물(소)

    // SAGO_DIV_L: safetyField.SAGO_DIV_L,               //잠재사고유형LV1

    // SAGO_DIV_M: safetyField.SAGO_DIV_M,               //잠재사고유형LV2

    // SAGO_DIV_S: safetyField.SAGO_DIV_S,               //잠재사고유형LV3

    //SAVE_YN: safetyField.VIO_NO === "" ? "N" : "Y", //저장여부 (필요없음)

  }

  console.log("data")

  console.log(saveData)

  saveParam.push(saveData)

  return commonPgExecuteApi({

    queryId: "SAFDC0010_SAVE01",

    list: saveParam,

  })

}

//안전수칙위반 저장 관련 로직 끝

//성명(위반자) 클릭 이벤트

const openSafetyEmpPopup = async gbn => {

  if (gbn === "인원조회") {

    safetyEmpPopup.value.openPopup({

      CMPNY_DIV: userStore.cmpnyDiv,

      HSE_ONLY: "Y",

      EMP_NM: safetyField.VIOLATOR,

      readonly: true,

    })

  }

}

//성명(위반자) 선택 이벤트

const selectedSafetyEmp = val => {

  safetyField.VIOLATOR = val.EMP_NM        //성명에 이름

  safetyField.VIO_EMP_NO = val.EMP_NO      //사번에 사번

  safetyField.JOB_TIT_NM = val.JOB_TIT_NM  //직위에 직위

  safetyField.VIO_EMP_ASGN = val.ASGN_NM   //소속조직에 조직

  //단기공사일대 위반조직 매핑 null 처리(직접선택하게 반영)

  if (val.USER_DIV === "D") {

    safetyField.ASGN_NM = null             //위반조직

  } else {

    safetyField.ASGN_NM = val.ASGN_NM      //위반조직

  }

  safetyField.IO_DIV = val.USER_DIV        //대상구분(직영,협력사)

  safetyField.DEPT_CD = val.DEPT_CD        //위반자 부서

  safetyField.BSNS_CD = val.BSNS_CD        //위반자 사업부

  safetyField.ASGN_CD = val.ASGN_CD        //위반자 조직

  safetyField.COMPANY = val.CMPNY_DIV      //위반자 회사

  safetyField.VIO_GDIV = ""

  safetyField.VIO_GDIV_NM = ""

  safetyField.VIO_MDIV = ""

  safetyField.VIO_MDIV_NM = ""

  /* Promise.all([

    getPgCodeList('HHIF110'),

  ]).then((res) => {

    codeList.VIO_GDIV = res[0].ORESULT_CUR.filter((x) => !x.COD.includes('S') && !x.COD.includes('C'))

  }) */

}

//팝업 종료 후 장소 선택된거 가져오기

const selectedSafetyLocation = val => {

  // console.log("장소!!");

  // console.log(val);

  //console.log("대 : ", val.LOC_LARGE);

  safetyField.VIO_LPLC = val.LOC_LARGE //장소구분(대)

  safetyField.VIO_MPLC = val.LOC_MEDIUM //장소구분(중)

  safetyField.VIO_SPLC = val.LOC_SMALL //장소구분(소)

  safetyField.VIO_SPLC_NM = val.WORK_LOCATION

}

//조치자 인원팝업 오픈 이벤트

const openActEmpPopup = async gbn => {

  if (gbn === "조치자인원조회") {

    safetyActEmpPopup.value.openPopup({

      CMPNY_DIV: userStore.cmpnyDiv,

      HSE_ONLY: "Y",

      EMP_NM: safetyField.ACT_EMP_NM,

      readonly: true,

    })

  }

}

//조치자 인원팝업 선택 이벤트

const selectedActEmp = val => {

  console.log("조치자 인원팝업")

  console.log(val)

  safetyField.ACTOR = val.EMP_NM               //조치자 성명

  safetyField.ACT_EMP_NO = val.EMP_NO          //조치자 사번

  safetyField.ACT_JOB_TIT_NM = val.JOB_TIT_NM   //조치자 직위

  safetyField.ACT_ASGN_NM = val.ASGN_NM        //조치자 조직명

  safetyField.ACT_ASGN_CD = val.ASGN_CD        //조치자 조직 코드

  safetyField.ACT_DEPT_CD = val.ASGN_NM        //조치자 부서

  safetyField.ACT_PHONE = val.HND_PHN          //조치자 전화번호

}

//단속자 인원팝업 오픈 이벤트

const openDansokEmpPopup = async gbn => {

  if (gbn === "단속자인원조회") {

    safetyDansokEmpPopup.value.openPopup({

      CMPNY_DIV: userStore.cmpnyDiv,

      HSE_ONLY: "Y",

      EMP_NM: safetyField.DANSOK_EMP_NM,

      readonly: true,

    })

  }

}

//단속자 인원팝업 선택 이벤트

const selectedDansokEmp = val => {

  console.log("단속자 인원 팝업")

  console.log(val)

  safetyField.DANSOK_EMP_NM = val.EMP_NM         //단속자 성명

  safetyField.DANSOK_EMP_NO = val.EMP_NO         //단속자 사번

  safetyField.DANSOK_JOB_TIT_NM = val.JOB_TIT_NM //단속자 직위

  safetyField.DANSOK_ASGN_NM = val.ASGN_NM       //단속자 소속

  safetyField.DANSOK_ASGN_CD = val.ASGN_CD       //단속자 조직 코드

  safetyField.DANSOK_DEPT_CD = val.DEPT_CD       //단속자 부서

}

//승인자 인원팝업 오픈 이벤트

const openAppEmpPopup = async gbn => {

  if (gbn === "승인자인원조회") {

    safetyAppEmpPopup.value.openPopup({

      CMPNY_DIV: userStore.cmpnyDiv,

      HSE_ONLY: "Y",

      EMP_NM: safetyField.DANSOK_EMP_NM,

      readonly: true,

    })

  }

}

// 승인자 인원팝업 선택 이벤트

const selectedAppEmp = val => {

  console.log("승인자 인원 팝업")

  console.log(val)

  safetyField.APP_EMP_NM = val.EMP_NM         //승인자 성명

  safetyField.APP_EMP_NO = val.EMP_NO         //승인자 사번

  safetyField.APP_JOB_TIT_NM = val.JOB_TIT_NM //승인자 직위

}

//파일첨부 관련 로직 시작

// 1. 위반내용 사진 업로드: IMG_ID1

const uploadPicture = val => {

  if (val?.FILE_ID) {

    safetyField.IMG_ID1 = val.FILE_ID

  }

}

// 2. 조치내용 사진 업로드: IMG_ID2

const uploadPicture2 = val => {

  if (val?.FILE_ID) {

    safetyField.IMG_ID2 = val.FILE_ID

  }

}

// 사진 업로드 컴포넌트 이벤트를 저장 필드에 연결한다.

const uploadCheckPicture = val => {

  uploadPicture(val)

}

// 조치내용 사진 업로드 컴포넌트 이벤트를 저장 필드에 연결한다.

const uploadJoChiPicture = val => {

  uploadPicture2(val)

}

// 1. 위반내용 파일 첨부: FILE_ID1

const uploadViolationFile = val => {

  const fileId = val?.FILE_ID ?? val?.fileId ?? ""

  if (!fileId) return

  safetyField.FILE_ID1 = fileId

  // 이미 저장된 위반 건은 파일 업로드 후 파일 ID도 즉시 master에 반영한다.

  if (safetyField.VIO_NO) {

    commonPgExecuteApi({

      queryId: "SAFDC0010_SAVE15",

      list: [{

        CMPNY_DIV: userStore.cmpnyDiv,

        VIO_NO: safetyField.VIO_NO,

        COMPANY: safetyField.COMPANY,

        FILE_ID1: fileId,

      }],

    })

  }

}

// 2. 조치내용 파일 첨부: FILE_ID2

const uploadActionFile = val => {

  const fileId = val?.FILE_ID ?? val?.fileId ?? ""

  if (!fileId) return

  safetyField.FILE_ID2 = fileId

  // 이미 저장된 위반 건은 조치 파일 ID도 업로드 직후 master에 반영한다.

  if (safetyField.VIO_NO) {

    commonPgExecuteApi({

      queryId: "SAFDC0010_SAVE16",

      list: [{

        CMPNY_DIV: userStore.cmpnyDiv,

        VIO_NO: safetyField.VIO_NO,

        COMPANY: safetyField.COMPANY,

        FILE_ID2: fileId,

        DIV: safetyField.DIV,

        USER_ID: userStore.userId,

      }],

    })

  }

}

//파일첨부 관련 로직 끝

//수칙위반 위반조직 오픈 이벤트

const openSafetyVioDeptPopup = () => {

  safetyVioDeptPopup.value.openPopup({

    CMPNY_DIV: safetyField.COMPANY || userStore.cmpnyDiv,

    CMP_DISABLE: false,

  })

}

//위반조직 선택 이벤트

const selectedVioDept = val => {

  safetyField.ASGN_NM = val.ASGN_FULL_NM

  safetyField.ASGN_CD = val.ASGN_CD

  safetyField.DEPT_CD = val.DEPT_CD

  safetyField.BSNS_CD = val.BSNS_CD

  console.log("위반조직 선택 이벤트", val)

  /* Promise.all([

    getPgCodeList('HHIF110'),

  ]).then((res) => {

    codeList.VIO_GDIV = res[0].ORESULT_CUR.filter((x) => !x.COD.includes('S') && !x.COD.includes('C'))

  }) */

  safetyField.VIO_GDIV = ""

  safetyField.VIO_GDIV_NM = ""

  safetyField.VIO_MDIV = ""

  safetyField.VIO_MDIV_NM = ""

}

//점검 대상물 오픈 이벤트

const openCheckTargetPopup = () => {

  checkTargetPopup.value.openPopup("점검대상물")

}

//점검 대상물 선택 이벤트

const selectedTarget = val => {

  safetyField.CHECK_TARGET_OBJ1 = val[0].COD

  safetyField.CHECK_TARGET_OBJ1_NM = val[0].TXT

  safetyField.CHECK_TARGET_OBJ2 = val[1].COD

  safetyField.CHECK_TARGET_OBJ2_NM = val[1].TXT

  safetyField.CHECK_TARGET_OBJ3 = val[2].COD

  safetyField.CHECK_TARGET_OBJ3_NM = val[2].TXT

  console.log("점검대상물 선택", val)

}

//위반종류 오픈 이벤트

const openVioDivPopup = () => {

  if (!safetyField.ASGN_NM) {

    Message.warn(t("위반자 및 위반조직 먼저 선택 바랍니다."))

    return false

  }

  vioDivPopup.value.openPopup(safetyField.BSNS_CD)

}

//위반종류 선택 이벤트

const selectedVioDivPopup = val => {

  console.log("위반종류 선택", val)

  safetyField.VIO_GDIV = val.VIO_GDIV //위반종류(대) 코드

  safetyField.VIO_GDIV_NM = val.VIO_GDIV_NM //위반종류(대) 이름

  safetyField.VIO_MDIV = val.VIO_MDIV //위반종류(중)코드

  safetyField.VIO_MDIV_NM = val.VIO_MDIV_NM //위반종류(중) 이름

}

//잠재사고유형 오픈 이벤트

const openSagoDivPopup = () => {

  sagoDivPopup.value.openPopup("잠재사고")

}

//잠재사고유형 선택 이벤트

const selectedSagoDivPopup = val => {

  safetyField.SAGO_DIV_L = val[0].COD //잠재사고유형(대) 코드

  safetyField.SAGO_DIV_L_NM = val[0].TXT //잠재사고유형(대) 이름

  safetyField.SAGO_DIV_M = val[1].COD //잠재사고유형(중)코드

  safetyField.SAGO_DIV_M_NM = val[1].TXT //잠재사고유형(중) 이름

  safetyField.SAGO_DIV_S = val[2].COD //잠재사고유형(소) 코드

  safetyField.SAGO_DIV_S_NM = val[2].TXT //잠재사고유형(소) 이름

  console.log("잠재사고 선택", val)

}

//승인 관련 로직 시작

const approval = () => {

  new saveFlowHelper(vm, t)

  //.setBefore(saveSafetyData)

    .setQuery(saveApprovalData)

    .setAfter(afterApproval)

    .setConfirmMessage("승인하시겠습니까?")

    .run()

}

const saveApprovalData = () => {

  let approvalParam = []

  let approvalData = {

    CMPNY_DIV: userStore.cmpnyDiv,      //사업장구분

    VIO_NO: safetyField.VIO_NO,         //위반No

    APP_EMP_NO: safetyField.VIO_EMP_NO, //단속자 사번

    USER_ID: userStore.userId,          //로그인유저 아이디

    STATUS: '30',

  }

  approvalParam.push(approvalData)

  mailSet()

  return commonPgExecuteApi({

    queryId: "SAFDC0010_APPROVE01",

    list: approvalParam,

  })

}

const mailSet = async () => {

  dialog.value = false

  /* ******************** 메일 SET ******************* */

  const mailParams = reactive({

    EMAIL: [],

    SUBJECT: "[HiSEs]안전수칙위반등록 승인 요청 메일",

    CONTENT: "",

  })

  mailParams.CONTENT =

    `

    <!doctype html>

      <html>

        <head>

          <meta charset='utf-8'>

        </head>

        <body>` +

    `위반일시: ${safetyField.VIO_DT1} ${safetyField.VIO_TIME2} <br />` +

    `위반자: ${safetyField.VIOLATOR} <br />` +

    `소속조직: ${safetyField.VIO_EMP_ASGN} <br />` +

    `단속자성명: ${safetyField.DANSOK_EMP_NM} <br />` +

    `내용: ${safetyField.VIO_DESC} <br />` +

    `

        </body>

      </html>`

  mailParams.EMAIL = [appEmail.value]

  commonSendApi(mailParams).then(res => {

    Message.success(t("메일이 전송되었습니다."))

  })

}

const afterApproval = () => {

  closePopup()

}

//승인 관련 로직 끝

//승인취소 관련 로직 시작

const cancelApproval = () => {

  new saveFlowHelper(vm, t)

    .setQuery(cancelApprovalSaveData)

    .setAfter(afterCancelApproval)

    .setConfirmMessage(

      `승인을 취소합니다.

  수정후 재 신청할 수 있습니다!!`,

    )

    .run()

}

const cancelApprovalSaveData = () => {

  let cencelApprovalParam = []

  let cencelApprovalData = {

    CMPNY_DIV: userStore.cmpnyDiv,

    VIO_NO: safetyField.VIO_NO,

    USER_ID: userStore.userId,

    STATUS: '20',

  }

  cencelApprovalParam.push(cencelApprovalData)

  return commonPgExecuteApi({

    queryId: "SAFDC0010_APPROVE01",

    list: cencelApprovalParam,

  })

}

const afterCancelApproval = () => {

  closePopup()

}

const changeback = () => { }

//승인취소 관련 로직 끝

//반려 관련 로직 시작

const reject = () => {

  new saveFlowHelper(vm, t)

  //.setBefore(saveSafetyData)

    .setQuery(rejectData)

    .setAfter(afterReject)

    .setConfirmMessage("반려하시겠습니까?")

    .run()

}

const rejectData = () => {

  let rejectParam = []

  let rejectData = {

    CMPNY_DIV: userStore.cmpnyDiv,      //사업장구분

    VIO_NO: safetyField.VIO_NO,         //위반No

    APP_EMP_NO: safetyField.VIO_EMP_NO, //단속자 사번

    USER_ID: userStore.userId,          //로그인유저 아이디

    STATUS: '11',

  }

  rejectParam.push(rejectData)

  return commonPgExecuteApi({

    queryId: "SAFDC0010_APPROVE01",

    list: rejectParam,

  })

}

const afterReject = () => {

  closePopup()

}

//반려 관련 로직 끝

//권한에 따른 버튼 활성화 여부 설정 함수

const setButtonStatus = () => {

  if (!safetyField.VIO_NO) {

    menuTitle.value.disableBtn("btnDelete", true)

  }

}

//수칙위반 관련 로직 끝

//위반종류 변경감지

/* watch(

  () => safetyField.VIO_GDIV,

  (newValue, oldValue) => {

    // let systemCode = 'HHIF110' + newValue

    // getPgCodeList(systemCode).then((res) => {

    //   if (oldValue) {

    //     safetyField.VIO_MDIV = ''

    //   }

    //   codeList.VIO_MDIV = res.ORESULT_CUR

    // })

    //safetyField.VIO_MDIV = ''

    codeList.VIO_MDIV = []

    const bsnscd = ''

    commonPgSearchApi({

      queryId: 'SAFDC0010_SEARCH_03',

      param: {

        CMPNY_DIV: userStore.cmpnyDiv,

        BSNS_CD: safetyField.BSNS_CD,

      },

    }).then((res) => {

      codeList.VIO_MDIV = res.ORESULT_CUR.filter((x) => x.UP_COD.includes(newValue))

    })

  }

) */

// 단속자 변경시

watch(

  () => safetyField.DANSOK_EMP_NO,

  (newValue, oldValue) => {

    commonPgSearchApi({

      queryId: "SAFDC0010_SEARCH_04",

      param: {

        CMPNY_DIV: "HHI",

        DANSOK_EMP_NO: newValue,

      },

    }).then(res => {

      if (onload.value === true) {

        safetyField.APP_EMP_NO = ''

        codeList.APP_EMP_NO = res.ORESULT_CUR

      }

    })

  },

)

// 단속자 변경시

watch(

  () => safetyField.APP_EMP_NO,

  (newValue, oldValue) => {

    for (var appEmp of codeList.APP_EMP_NO) {

      if (appEmp.APP_EMP_NO == newValue) {

        appEmail.value = appEmp.EMAIL

        break

      }

    }

  },

)

//위반종류 변경감지(2026.08.26 신규 추가)

watch(

  () => safetyField.VIO_GDIV,

  (newValue, oldValue) => {

    // console.log("값1 : " + safetyField.VIO_GDIV);

    if (safetyField.VIO_GDIV === "C") {

      trafficReg.value = true

    } else {

      trafficReg.value = false

    }

  },

)

//승인자 동일 체크박스 변경 시

watch(

  () => safetyField.APP_SAME,

  (newValue, oldValue) => {

    safetyField.APP_SAME = String(newValue).trim().toUpperCase() === "Y" ? "Y" : "N"

    setApprovalStatus()

  },

)

defineExpose({

  openPopup,

  openPopup2,

  initcodeList,

})
</script>

<template>
  <!-- 헤더 좁아지면 height 주면 된다 -->

  <v-dialog
    v-model="dialog"
    persistent
    width="1600"
    height="800"
    eager
    class="draggable-dialog"

    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"

      @mousedown="startDragging"
    >
      안전수칙위반등록
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnApprove', 'btnApproveCancel', 'btnReject', 'btnClose']"

          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-3 pt-0">
        <fieldset class="view-only-fields">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea">
              <div class="d-flex mt-2">
                <v-avatar
                  color="primary"
                  size="24"
                  class="text-white"
                >
                  1
                </v-avatar>

                &nbsp;<b>일시 및 장소</b>
              </div>

              <div class="d-flex mt-2">
                <i-input
                  v-model="safetyField.VIO_DT1"
                  :disabled="true"
                  :label="$t('위반일시')"
                  width="150px"
                  top-label

                  type="date"
                  required
                />

                <i-input
                  v-model="safetyField.VIO_TIME2"
                  :disabled="true"
                  width="130px"
                  class="mt-5"
                  type="time"

                  append-inner-icon="mdi-clock-time-outline"
                  readonly
                  required
                />

                <i-input
                  v-model="safetyField.VIO_SPLC_NM"
                  :disabled="true"
                  :label="$t('장소')"
                  width="400px"
                  top-label

                  append-inner-icon="mdi-magnify"
                  readonly
                  required
                />

                <i-input
                  v-model="safetyField.VIO_PLC_DESC"
                  :disabled="true"
                  :label="$t('장소상세')"
                  width="400px"

                  top-label
                />

                <i-select
                  v-model="safetyField.SHIP_NO"
                  :disabled="true"
                  :label="$t('호선/프로젝트No.')"
                  top-label

                  label-width="200px"
                  width="200px"
                  :items="codeList.SHIP_NO"
                  item-value="WORK_NO"

                  item-title="WORK_NO"
                />
              </div>

              <div class="d-flex mt-2">
                <v-avatar
                  color="primary"
                  size="24"
                  class="text-white"
                >
                  2
                </v-avatar>

                &nbsp;<b>위반 정보</b>
              </div>

              <div class="d-flex mt-2">
                <i-input
                  v-model="safetyField.VIOLATOR"
                  :disabled="true"
                  :label="$t('위반자 성명')"
                  width="200px"
                  top-label

                  required
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="openSafetyEmpPopup('인원조회')"

                  @keydown.enter="

                    (e) => {

                      openSafetyEmpPopup('인원조회');

                    }

                  "
                />

                <i-input
                  v-model="safetyField.VIO_EMP_NO"
                  :disabled="true"
                  :label="$t('사번')"
                  width="200px"
                  top-label

                  readonly
                />

                <i-input
                  v-model="safetyField.JOB_TIT_NM"
                  :disabled="true"
                  :label="$t('직위')"
                  width="150px"
                  top-label

                  readonly
                />

                <i-input
                  v-model="safetyField.VIO_EMP_ASGN"
                  :disabled="true"
                  :label="$t('소속조직')"
                  width="250px"
                  top-label

                  readonly
                />
              </div>

              <div class="d-flex mt-2">
                <i-input
                  v-model="safetyField.ASGN_NM"
                  :disabled="true"
                  :label="$t('위반조직')"
                  width="350px"
                  top-label

                  required
                  readonly
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="openSafetyVioDeptPopup"
                />

                <i-select
                  v-model="safetyField.IO_DIV"
                  :disabled="true"
                  :label="$t('대상구분')"
                  width="200px"
                  top-label

                  readonly
                  :items="codeList.GUBUN"
                  item-title="TXT"
                  item-value="COD"
                  required
                />

                <i-input
                  v-model="safetyField.VEND_NAME"
                  :disabled="true"
                  class="mt-5"
                  width="250px"
                />

                <span class="mt-6">위반조직으로 검색되지 않는 경우에 수기입력하세요.</span>
              </div>

              <div class="d-flex mt-2">
                <v-avatar
                  color="primary"
                  size="24"
                  class="text-white"
                >
                  3
                </v-avatar>

                &nbsp;<b>위반 내용</b>
              </div>

              <div class="d-flex mt-2">
                <i-input
                  :label="$t('위반 종류')"
                  top-label
                  v-model="safetyField.VIO_GDIV_NM"
                  width="350px"
                  required
                  readonly

                  append-inner-icon="mdi-magnify"
                  :disabled="true"
                  @click:append-inner="openVioDivPopup"
                />

                <i-input
                  v-model="safetyField.VIO_MDIV_NM"
                  width="470px"
                  readonly
                  class="mt-5"
                  :disabled="true"
                />

                <!--
                  <span

                  class="sheetTitle"

                  style="margin-left: 480px; margin-top: 20px"

                  v-if="!isEmpty(safetyField.VIO_NO)"

                  >

                  위반정보 {{ safetyField.VIO_NO }}

                  </span> 
                -->
              </div>

              <div>
                <i-textarea
                  v-model="safetyField.VIO_DESC"
                  :disabled="true"
                  :label="$t('내용')"
                  width="100%"

                  class="mt-2"
                />
              </div>

              <div v-if="!trafficReg">
                <div class="mb-6">
                  <!-- 위반내용 - 사진첨부 start -->

                  <div class="mt-2">
                    <IUploadImageMulit
                      ref="imageUpload"
                      :button-list="[]"
                      title="사진첨부"

                      @uploaded="uploadCheckPicture"
                    />
                  </div>

                  <!-- 위반내용 - 사진첨부 end -->

                  <!-- 위반내용 - 파일첨부 start -->

                  <div style="height: 430px">
                    <IUpload
                      ref="safetyFileUpload"
                      :button-list="[]"
                      :grid-only="true"
                      grid-title="파일첨부"

                      @uploaded="uploadViolationFile"
                    />
                  </div>

                  <!-- 위반내용 - 파일첨부 end -->
                </div>
              </div>

              <!-- 교통수칙 start -->

              <div v-else>
                <div class="sheetTitle mt-2">
                  차량정보
                </div>

                <div class="&quoJt;d-flex&quot;">
                  <div class="mt-4">
                    <v-radio-group
                      v-model="safetyField.VEHICLE_TYPE"
                      inline
                      :disabled="true"

                      @update:model-value="changeVioDiv"
                    >
                      <v-radio
                        v-for="option in vehicleTypeOptions"
                        :key="option.value"
                        :label="option.label"

                        :value="option.value"
                      />
                    </v-radio-group>
                  </div>

                  <div
                    class="d-flex ml-4"
                    style="position: relative; bottom: 6px"
                  >
                    <i-input
                      v-model="safetyField.VEHICLE_CAR_NO"
                      :label="$t('차량번호')"
                      width="200px"
                      top-label
                      required

                      :disabled="true"
                      :append-inner-icon="readOnlyValue.CAR_NO_ICON"

                      @click:append-inner="openCarPopup"
                    />

                    <i-input
                      v-model="safetyField.VEHICLE_REG_NO"
                      :label="$t('등록번호')"
                      width="200px"
                      top-label
                      required

                      :disabled="true"
                    >
                      <template
                        v-if="readOnlyValue.ICON === true"
                        #append-inner
                      >
                        <v-icon
                          :icon="readOnlyValue.RESIST_NO_ICON"
                          @click="checkResistCarNo"
                        />
                      </template>
                    </i-input>

                    <template v-if="vehicleInfoEnabled">
                      <i-input
                        v-model="safetyField.VEHICLE_SPEED"
                        :label="$t('주행속도')"
                        width="100px"
                        top-label
                        number

                        :disabled="true"
                      />

                      <span style="margin-top: 24px">Km/h</span>
                    </template>
                  </div>
                </div>
              </div>

              <!-- 교통수칙 end -->

              <div v-if="!trafficReg">
                <div class="d-flex mt-2">
                  <v-avatar
                    col-uor="primary"
                    size="24"
                    class="text-white"
                  >
                    4
                  </v-avatar>&nbsp;<b>조치 내용</b>
                </div>

                <!-- <div class="sheetTitle my-5">조치자 정보</div> -->

                <div class="d-flex mt-2">
                  <i-input
                    v-model="safetyField.ACTOR"
                    :disabled="true"
                    :label="$t('조치자 성명')"
                    width="200px"
                    top-label

                    append-inner-icon="mdi-magnify"
                    required
                    @click:append-inner="openActEmpPopup('조치자인원조회')"
                    @keydown.enter="

                      (e) => {

                        openActEmpPopup('조치자인원조회');

                      }

                    "
                  />

                  <i-input
                    v-model="safetyField.ACT_EMP_NO"
                    :disabled="true"
                    :label="$t('사번')"
                    width="200px"
                    top-label

                    readonly
                  />

                  <i-input
                    v-model="safetyField.ACT_JOB_TIT_NM"
                    :disabled="true"
                    :label="$t('직위')"
                    width="200px"

                    top-label
                    readonly
                    required
                  />

                  <i-input
                    v-model="safetyField.ACT_ASGN_NM"
                    :disabled="true"
                    :label="$t('소속')"
                    width="200px"
                    top-label

                    readonly
                    required
                  />

                  \                 <i-input
                    v-model="safetyField.ACT_PHONE"
                    :disabled="true"
                    :label="$t('전화번호')"
                    width="200px"
                    top-label

                    readonly
                    required
                  >
                    ];
                  </i-input>
                </div>

                <div class="d-flex flex-row">
                  <i-textarea
                    v-model="safetyField.ACT_RSLT"
                    :disabled="true"
                    :label="$t('조치내용')"

                    class="mt-2 flex-grow-1"
                  />

                  <i-select
                    v-model="safetyField.ACT_DIV"
                    :disabled="true"
                    :label="$t('조치구분')"
                    width="200px"
                    top-label

                    :items="codeList.ACT_DIV"
                    item-title="TXT"
                    item-value="COD"
                    class="mt-2 "
                    required
                  />
                </div>

                <!-- 조치내용 - 사진첨부 start -->

                <div class="mt-2">
                  <IUploadImageMulit
                    ref="imageUpload2"
                    :button-list="[]"
                    title="사진첨부"

                    @uploaded="uploadJoChiPicture"
                  />
                </div>

                <!-- 조치내용 - 사진첨부 end -->

                <!-- 조치내용 - 파일첨부 start -->

                <div class="mt-2">
                  <div style="height: 430px">
                    <IUpload
                      ref="safetyActionFileUpload"
                      :button-list="[]"
                      :grid-only="true"
                      grid-title="파일첨부"

                      @uploaded="uploadActionFile"
                    />
                  </div>
                </div>

                <!-- 조치내용 - 파일첨부 end -->

                <div class="d-flex mt-2">
                  <v-avatar
                    color="primary"
                    size="24"
                    class="text-white"
                  >
                    5
                  </v-avatar>&nbsp;<b>단속자 / 승인자 정보</b>
                </div>

                <div class="d-flex mt-2">
                  <i-input
                    v-model="safetyField.DANSOK_EMP_NM"
                    :disabled="true"
                    :label="$t('단속자 성명')"
                    width="200px"

                    top-label
                    append-inner-icon="mdi-magnify"
                    required

                    @click:append-inner="openDansokEmpPopup('단속자인원조회')"
                    @keydown.enter="

                      (e) => {

                        openDansokEmpPopup('단속자인원조회');

                      }

                    "
                  />

                  <i-input
                    v-model="safetyField.DANSOK_EMP_NO"
                    :disabled="true"
                    :label="$t('사번')"
                    width="200px"

                    top-label
                    readonly
                  />

                  <i-input
                    v-model="safetyField.DANSOK_JOB_TIT_NM"
                    :disabled="true"
                    :label="$t('직위')"
                    width="200px"

                    top-label
                    readonly
                    required
                  />

                  <i-input
                    v-model="safetyField.DANSOK_ASGN_NM"
                    :disabled="true"
                    :label="$t('소속')"
                    width="200px"

                    top-label
                    readonly
                    required
                  />

                  <!-- 승인자 동일 체크박스 -->

                  <div
                    class="d-flex align-center mr-5"
                    style="height: 56px; margin-top: 5px;"
                  >
                    <v-checkbox
                      v-model="safetyField.APP_SAME"
                      :disabled="true"
                      true-value="Y"
                      false-value="N"

                      class="ma-0 pa-0"
                      hide-details

                      style="margin-top: 0; margin-bottom: 0; transform: translateY(0);n"
                    />

                    <span
                      class="ml-1 d-flex align-center"
                      style="line-height: 1; transform: translateY(0);"
                    >승인자

                      동일</span>
                  </div>

                  <i-input
                    v-model="safetyField.APP_EMP_NM"
                    :disabled="true"
                    :label="$t('승인자')"
                    width="200px"
                    top-label

                    append-inner-icon="mdi-magnify"
                    @click:append-inner="openAppEmpPopup('승인자인원조회')"
                    @keydown.enter="

                      (e) => {

                        openAppEmpPopup('승인자인원조회');

                      }

                    "
                  />

                  <!-- 승인신청 -->

                  <v-btn
                    class="mt-5"
                    :disabled="true"
                    @click="approval"
                  >
                    승인신청
                  </v-btn>

                  <!-- 승인신청취소 -->

                  <v-btn
                    class="mt-5"
                    :disabled="true"
                    @click="cancelApproval"
                  >
                    승인신청취소
                  </v-btn>
                </div>
              </div>
            </v-sheet>
          </div>
        </fieldset>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 팝업 -->

  <EmpPopup
    ref="safetyEmpPopup"
    @selected="selectedSafetyEmp"
  />

  <EmpPopup
    ref="safetyActEmpPopup"
    @selected="selectedActEmp"
  />

  <EmpPopup
    ref="safetyDansokEmpPopup"
    @selected="selectedDansokEmp"
  />

  <EmpPopup
    ref="safetyAppEmpPopup"
    @selected="selectedAppEmp"
  />

  <SAFDC0010VioDivPopup
    ref="vioDivPopup"
    @selected="selectedVioDivPopup"
  />

  <DeptPopup
    ref="safetyVioDeptPopup"
    :auto-disabled="false"
    @selected="selectedVioDept"
  />

  <CommonCodePopUpSAF
    ref="sagoDivPopup"
    @selected="selectedSagoDivPopup"
  />

  <CommonCodePopUpSAF
    ref="checkTargetPopup"
    @selected="selectedTarget"
  />

  <LocationPopup
    ref="locationPopup"
    @selected="selectedSafetyLocation"
  />
</template>

<style scoped lang="scss">
.content-area {

  position: relative;

  // 만약 타이틀 영역에 컴포넌트를 추가한다면

  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.

  height: calc(100vh -{ 180px);

  overflow-y: auto;

  >div {

    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.

    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.

    min-height: 500px;

  }

}

.sheetTitle {

  font-size: 16px;

  font-weight: bold;

}

.view-only-fields {

  border: 0;

  margin: 0;

  padding: 0;

  min-width: 0;

  user-select: text;

}
</style>
