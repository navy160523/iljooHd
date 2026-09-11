<script setup>

import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue";

import { useUserStore } from "@hiway/stores/user";

import { useI18n } from "vue-i18n";

import {

  commonPgExecuteApi,

  commonPgSearchApi,

  commonSendApi,

  getPgCodeList,

} from "@hiway/api/commonApi";

import RealGrid from "@/components/RealGrid.vue";

import queryFlowHelper from "@/utils/searchFlowHelper";

import saveFlowHelper from "@/utils/saveFlowHelper";

import dayjs from "dayjs";

import IGridTitle from "@/components/IGridTitle.vue";

import SAFDC0010_02Popup01 from "./SAFDC0010_02Popup01.vue";

import SAFDC0010_01Popup02 from "./SAFDC0010_01Popup02.vue";

import EmpPopup from "@/pages/COM/components/EmpPopup.vue";

import Message from "@hiway/utils/notify";

const vehicleTypeOptions = [

  { value: "A", label: "차량" },

  { value: "B", label: "오토바이" },

  { value: "C", label: "자전거" },

  { value: "D", label: "보행자" },

  { value: "Z", label: "기타" },

];

const normalizeVehicleType = (value) => {

  const option = vehicleTypeOptions.find(

    ({ value: code, label }) => code === value || label === value

  );

  return option?.value ?? String(value ?? "").trim().toUpperCase();

};

defineOptions({

  name: "30_safety-SAF_D-SAFDC0010_02",

});

const vm = getCurrentInstance().proxy;

const t = useI18n().t;

const gridTitle = ref(null);

const grdMain = ref(null);

const userStore = useUserStore();

const sAFDC0010Popup01 = ref(null);

const sAFDC0010Popup02 = ref(null);

const empPopup = ref(null);

const { sliSAFDC0010_02Tab01 } = history.state;

const codeList = reactive({

  company: [],

  bsnsCd: [],

  deptCd: [],

  dansokCompany: [],

  dansokBsnsCd: [],

  dansokDeptCd: [],

  gubun: [],

  status: [],

  searchStatus: [],

  actDiv: [],

});

const rowStyleCallback = (grid, item) => {

  const status = String(grid.getValue(item.index, "STATUS") ?? "").trim();

  const actionDivision = String(

    grid.getValue(item.index, "ACT_DIV") ?? ""

  ).trim();

  const isApproved = status === "30" || status === "승인";

  const needsAction = actionDivision === "10" || actionDivision === "조치필요";

  if (isApproved && needsAction) {

    return {

      style: {

        background: "#ffcdd2",

      },

    };

  }

  return {};

};

const searchField = reactive({

  PAST_ORG: "N",

  CHK_DAY: "Y",

});

const searchParam = reactive({

  VIO_DATE_FR: "",

  VIO_DATE_TO: "",

  COMPANY:

    sliSAFDC0010_02Tab01 === undefined

      ? userStore.cmpnyDiv

      : sliSAFDC0010_02Tab01.CMPNY_DIV,

  BSNS_CD:

    sliSAFDC0010_02Tab01 === undefined ? userStore.bsnsCd : sliSAFDC0010_02Tab01.BSNS_CD,

  DEPT_CD:

    sliSAFDC0010_02Tab01 === undefined ? userStore.deptCd : sliSAFDC0010_02Tab01.DEPT_CD,

  ASGN_CD: "",

  VIO_GDIV: sliSAFDC0010_02Tab01 === undefined ? "" : sliSAFDC0010_02Tab01.GUBUN,

  CMPNY_DIV: sliSAFDC0010_02Tab01 === undefined ? userStore.cmpnyDiv : "",

  DANSOK_BSNS_CD: "",

  DANSOK_ASGN_CD: "",

  DANSOK_EMP_NM: "",

  DANSOK_EMP_NO: "",

  STATUS: sliSAFDC0010_02Tab01 === undefined ? "" : "30",

});

const initCodeList = async () => {

  await Promise.all([

    commonPgSearchApi({

      queryId: "searchCommonCode",

      param: {

        CMPNY_DIV: userStore.cmpnyDiv,

        ALL_UP_CD: "HHIZ000",

        USE_FLAG: "Y",

        CODE_NAME_TYPE: "0",

      },

    }),

    commonPgSearchApi({

      queryId: "searchBSNS",

      param: { CMPNY_DIV: searchParam.COMPANY },

    }),

    commonPgSearchApi({

      queryId: "searchDept3",

      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: "", USE_DIV: "Y" },

    }),

    getPgCodeList("HHIG110"),

    getPgCodeList("HHIG180"),

    commonPgSearchApi({

      queryId: "searchBSNS",

      param: { CMPNY_DIV: searchParam.CMPNY_DIV },

    }),

    getPgCodeList("HHIG170"),

  ]).then((res) => {

    codeList.company = res[0].ORESULT_CUR.slice();

    codeList.dansokCompany = res[0].ORESULT_CUR;

    codeList.bsnsCd = res[1].ORESULT_CUR.slice();

    codeList.dansokBsnsCd = res[5].ORESULT_CUR;

    codeList.gubun = res[3].ORESULT_CUR.filter((x) => !x.COD.includes("S"));

    codeList.status = res[4].ORESULT_CUR;

    codeList.searchStatus = res[4].ORESULT_CUR;

    codeList.actDiv = res[6].ORESULT_CUR;

    codeList.company.unshift({ TXT: "전체", COD: "" });

    codeList.dansokCompany.unshift({ TXT: "전체", COD: "" });

    codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" });

    codeList.dansokBsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" });

    codeList.gubun.unshift({ TXT: "전체", COD: "" });

    codeList.searchStatus.unshift({ TXT: "전체", COD: "" });

    grdMain.value.setBindingColumn("STATUS", codeList.status, "COD", "TXT");

    grdMain.value.setBindingColumn("ACT_DIV", codeList.actDiv, "COD", "TXT");

  });

};

const formatGridDate = (value) => {

  if (value === null || value === undefined || value === "") return "";

  const raw = String(value).trim();

  if (!raw) return "";

  if (/^\d{12}$/.test(raw)) {

    const year = raw.substring(0, 4);

    const month = raw.substring(4, 6);

    const day = raw.substring(6, 8);

    const hour = raw.substring(8, 10);

    const minute = raw.substring(10, 12);

    return `${year}-${month}-${day} ${hour}:${minute}`;

  }

  if (/^\d{8}$/.test(raw)) {

    const year = raw.substring(0, 4);

    const month = raw.substring(4, 6);

    const day = raw.substring(6, 8);

    return `${year}-${month}-${day}`;

  }

  if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?$/.test(raw)) {

    return raw.replace("T", " ").slice(0, 16);

  }

  return raw;

};

const normalizeGridRow = (row = {}) => {

  const normalized = { ...row };

  const assignFromAliases = (target, aliases) => {

    if (

      normalized[target] !== undefined &&

      normalized[target] !== null &&

      normalized[target] !== ""

    ) {

      return;

    }

    for (const alias of aliases) {

      const value = normalized[alias];

      if (value !== undefined && value !== null && value !== "") {

        normalized[target] = value;

        break;

      }

    }

    if (normalized[target] === undefined || normalized[target] === null || normalized[target] === "") {

      const normalizedTarget = target.replaceAll("_", "").toUpperCase();

      const matchingKey = Object.keys(normalized).find(

        (key) => key.replaceAll("_", "").toUpperCase() === normalizedTarget

      );

      if (matchingKey) normalized[target] = normalized[matchingKey];

    }

  };

  const majorAliases = {

    STATUS: ["STATUS", "status"],

    IO_DIV_NM: ["IO_DIV_NM", "io_div_nm"],

    BSNS_NM: ["BSNS_NM", "bsns_nm"],

    DEPT_NM: ["DEPT_NM", "dept_nm"],

    DTL_ASGN_NM: ["DTL_ASGN_NM", "dtl_asgn_nm"],

    VIOLATOR: ["VIOLATOR", "violator"],

    ACT_DIV: ["ACT_DIV", "act_div"],

    VIO_GDIV_NM: ["VIO_GDIV_NM", "vio_gdiv_nm"],

    VIO_MDIV_NM: ["VIO_MDIV_NM", "vio_mdiv_nm"],

    VIO_SPLC_NM: ["VIO_SPLC_NM", "vio_splc_nm"],

    VIO_PLC_DESC: ["VIO_PLC_DESC", "vio_plc_desc"],

    VIO_DESC: ["VIO_DESC", "vio_desc"],

    DANSOK_EMP_NM: ["DANSOK_EMP_NM", "dansok_emp_nm"],

    DANSOK_ASGN_NM: ["DANSOK_ASGN_NM", "dansok_asgn_nm"],

    DANSOK_JOB_TIT_NM: ["DANSOK_JOB_TIT_NM"],

    DANSOK_DEPT_CD: ["DANSOK_DEPT_CD"],

    ACTOR: ["ACTOR"],

    ACT_EMP_NO: ["ACT_EMP_NO"],

    ACT_DEPT_CD: ["ACT_DEPT_CD"],

    ACT_PHONE: ["ACT_PHONE"],

    ACT_JOB_TIT_NM: ["ACT_JOB_TIT_NM"],

    ACT_RESULT: ["ACT_RESULT", "ACT_RSLT"],

    VEHICLE_TYPE: ["VEHICLE_TYPE"],

    VEHICLE_CAR_NO: ["VEHICLE_CAR_NO"],

    VEHICLE_REG_NO: ["VEHICLE_REG_NO"],

    VEHICLE_SPEED: ["VEHICLE_SPEED"],

    RG_DATE: ["RG_DATE", "rg_date", "INSERT_DATE", "insert_date"],

    COMPANY: ["COMPANY", "company"],

    GUBUN: ["GUBUN", "gubun"],

    CMPNY_DIV: ["CMPNY_DIV", "cmpny_div"],

    BSNS_CD: ["BSNS_CD", "bsns_cd"],

    DEPT_CD: ["DEPT_CD", "dept_cd"],

    ASGN_CD: ["ASGN_CD", "asgn_cd"],

    VIO_EMP_NO: ["VIO_EMP_NO", "vio_emp_no"],

    VIO_NO: ["VIO_NO", "vio_no"],

    VIO_TIME: ["VIO_TIME", "vio_time"],

    ACT_TIME: ["ACT_TIME", "act_time"],

    ACT_DATE: ["ACT_DATE"],

    APP_SAME: ["APP_SAME"],

    APP_EMP_NM: ["APP_EMP_NM"],

    APP_EMP_NO: ["APP_EMP_NO"],

    APP_JOB_TIT_NM: ["APP_JOB_TIT_NM"],

    APP_ASGN_CD: ["APP_ASGN_CD"],

    APP_DEPT: ["APP_DEPT"],

    FILE_ID1: ["FILE_ID1", "file_id1"],

    FILE_ID2: ["FILE_ID2", "file_id2"],

    VIO_PHOTO: ["VIO_PHOTO", "vio_photo"],

    VIO_FILE: ["VIO_FILE", "vio_file"],

    ACT_PHOTO: ["ACT_PHOTO", "act_photo"],

    ACT_FILE: ["ACT_FILE", "act_file"],

    VEND_NAME: ["VEND_NAME", "vend_name"],

    SHIP_NO: ["SHIP_NO", "ship_no"],

  };

  Object.entries(majorAliases).forEach(([target, aliases]) => {

    assignFromAliases(target, aliases);

  });

  normalized.VEHICLE_TYPE = normalizeVehicleType(normalized.VEHICLE_TYPE);

  normalized.VEHICLE_TYPE_NM =

    vehicleTypeOptions.find(({ value }) => value === normalized.VEHICLE_TYPE)?.label ??

    normalized.VEHICLE_TYPE;

  normalized.VEHICLE_SPEED_NM = normalized.VEHICLE_SPEED

    ? `${normalized.VEHICLE_SPEED}`

    : "";

  const vioTimeText =

    normalized.VIO_TIME_DS ?? normalized.vio_time_ds ?? normalized.VIO_TIME ?? normalized.vio_time;

  if (vioTimeText !== undefined && vioTimeText !== null && vioTimeText !== "") {

    normalized.VIO_TIME_DS =

      normalized.VIO_TIME_DS || normalized.vio_time_ds || formatGridDate(vioTimeText);

  }

  const actTimeText =

    normalized.ACT_DATE ??

    normalized.ACT_TIME_DS ??

    normalized.act_time_ds ??

    normalized.ACT_TIME ??

    normalized.act_time;

  if (actTimeText !== undefined && actTimeText !== null && actTimeText !== "") {

    normalized.ACT_TIME_DS =

      normalized.ACT_TIME_DS || normalized.act_time_ds || formatGridDate(actTimeText);

  }

  return normalized;

};

const grdMainProps = reactive({

  gridViewOption: { checkBar: true },

  fields: [

    { fieldName: "VIO_TIME_DS", dataType: "text", width: "150", editable: false, header: { text: t("위반일시") } },

    { fieldName: "STATUS", dataType: "text", width: "100", editable: false, lookupDisplay: true, editor: { type: "dropdown" }, header: { text: t("진행상태") } },

    { fieldName: "IO_DIV_NM", dataType: "text", editable: false, header: { text: t("소속구분") } },

    { fieldName: "BSNS_NM", dataType: "text", editable: false, styleName: "left-column", width: "100", header: { text: t("사업부") } },

    { fieldName: "DEPT_NM", dataType: "text", editable: false, styleName: "left-column", width: "150", header: { text: t("부서") } },

    { fieldName: "DTL_ASGN_NM", dataType: "text", styleName: "left-column", width: "150", editable: false, header: { text: t("상세소속") } },

    { fieldName: "VEND_NAME", dataType: "text", editable: false, header: { text: t("사외협력사") } },

    { fieldName: "VIO_EMP_NO", dataType: "text", editable: false, header: { text: t("위반자사번") }, visible: false },

    { fieldName: "VIOLATOR", dataType: "text", editable: false, header: { text: t("성명") } },

    { fieldName: "ACT_DIV", dataType: "text", editable: false, lookupDisplay: true, editor: { type: "dropdown" }, header: { text: t("조치구분") } },

    { fieldName: "VIO_GDIV_NM", dataType: "text", editable: false, header: { text: t("위반구분") } },

    { fieldName: "VIO_MDIV_NM", dataType: "text", styleName: "left-column", width: "250", editable: false, header: { text: t("위반항목") } },

    { fieldName: "VIO_SPLC_NM", dataType: "text", editable: false, width: "250", styleName: "left-column", header: { text: t("위반장소") } },

    { fieldName: "VIO_PLC_DESC", dataType: "text", width: "250", editable: false, styleName: "left-column", header: { text: t("위반장소상세") } },

    { fieldName: "SHIP_NO", dataType: "text", width: "150", editable: false, header: { text: t("호선No/프로젝트 No.") } },

    { fieldName: "VIO_DESC", dataType: "text", styleName: "left-column", width: "300", editable: false, header: { text: t("위반내용") } },

    { fieldName: "DANSOK_EMP_NM", dataType: "text", editable: false, header: { text: t("단속자") } },

    { fieldName: "DANSOK_ASGN_NM", dataType: "text", styleName: "left-column", width: "250", editable: false, header: { text: t("단속자 조직") } },

    { fieldName: "VIO_PHOTO", dataType: "text", editable: false, isFile: { value: true, showAlways: true }, header: { text: t("사진") } },

    { fieldName: "VIO_FILE", dataType: "text", editable: false, isFile: { value: true, showAlways: true }, header: { text: t("자료") } },

    { fieldName: "ACT_RESULT", dataType: "text", styleName: "left-column", width: "250", editable: false, header: { text: t("조치내용") } },

    { fieldName: "ACTOR", dataType: "text", editable: false, visible: false, header: { text: t("조치자") } },

    { fieldName: "ACT_EMP_NO", dataType: "text", editable: false, visible: false, header: { text: t("조치자사번") } },

    { fieldName: "ACT_JOB_TIT_NM", dataType: "text", editable: false, visible: false, header: { text: t("조치자직위") } },

    { fieldName: "ACT_DATE", dataType: "text", visible: false, header: { text: t("조치일시") } },

    { fieldName: "ACT_DEPT_CD", dataType: "text", editable: false, visible: false, header: { text: t("조치자소속") } },

    { fieldName: "ACT_PHONE", dataType: "text", editable: false, visible: false, header: { text: t("조치자연락처") } },

    { fieldName: "ACT_RSLT", dataType: "text", visible: false, header: { text: t("조치내용") } },

    { fieldName: "FILE_ID1", dataType: "text", visible: false, isFile: { value: true, showAlways: true }, header: { text: t("위반첨부") } },

    { fieldName: "FILE_ID2", dataType: "text", visible: false, isFile: { value: true, showAlways: true }, header: { text: t("조치첨부") } },

    { fieldName: "ACT_PHOTO", dataType: "text", editable: false, isFile: { value: true, showAlways: true }, header: { text: t("사진") } },

    { fieldName: "ACT_FILE", dataType: "text", editable: false, isFile: { value: true, showAlways: true }, header: { text: t("자료") } },

    { fieldName: "ACT_TIME_DS", dataType: "text", styleName: "left-column", width: "250", editable: false, header: { text: t("조치일자") } },

    { fieldName: "VEHICLE_TYPE_NM", dataType: "text", styleName: "center-column", width: "250", editable: false, header: { text: t("차량구분") } },

    { fieldName: "VEHICLE_CAR_NO", dataType: "text", styleName: "left-column", width: "200", editable: false, visible: false, header: { text: t("차량번호") } },

    { fieldName: "VEHICLE_REG_NO", dataType: "text", styleName: "left-column", width: "200", editable: false, visible: false, header: { text: t("등록번호") } },

    { fieldName: "VEHICLE_SPEED_NM", dataType: "text", styleName: "center-column", width: "250", editable: false, header: { text: t("속도") } },

    { fieldName: "RG_DATE", dataType: "text", editable: false, header: { text: t("등록날짜") } },

    { fieldName: "APP_EMP_NM", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "APP_EMP_NO", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "APP_SAME", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "APP_JOB_TIT_NM", dataType: "text", visible: false, header: { text: t("승인자직위") } },

    { fieldName: "VIO_EMP_ASGN", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "VEND_CD", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "JOB_TIT_CD", dataType: "text", visible: false, header: { text: t("직급코드") } },

    { fieldName: "BSNS_CD", dataType: "text", visible: false, header: { text: t("사업부코드") } },

    { fieldName: "ASGN_CD", dataType: "text", visible: false, header: { text: t("소속조직코드") } },

    { fieldName: "ASGN_NM", dataType: "text", visible: false, header: { text: t("소속조직명Full") } },

    { fieldName: "CMPNY_DIV", dataType: "text", visible: false, header: { text: t("사업장구분") } },

    { fieldName: "DANSOK_ASGN_CD", dataType: "text", visible: false, header: { text: t("단속자조직코드") } },

    { fieldName: "DANSOK_EMP_NO", dataType: "text", visible: false, header: { text: t("단속자사번") } },

    { fieldName: "DANSOK_JOB_TIT_NM", dataType: "text", visible: false, header: { text: t("단속자직위") } },

    { fieldName: "DANSOK_DEPT_CD", dataType: "text", visible: false, header: { text: t("단속자부서코드") } },

    { fieldName: "DEPT_CD", dataType: "text", visible: false, header: { text: t("소속부서코드") } },

    { fieldName: "IO_DIV", dataType: "text", visible: false, header: { text: t("직영/협력구분") } },

    { fieldName: "JOB_TIT_NM", dataType: "text", visible: false, header: { text: t("직급") } },

    { fieldName: "TEAM_NM", dataType: "text", visible: false, header: { text: t("소속조직명") } },

    { fieldName: "VIO_DT1", dataType: "text", visible: false, header: { text: t("위반일자") } },

    { fieldName: "VIO_GDIV", dataType: "text", visible: false, header: { text: t("위반구분(대)") } },

    { fieldName: "VIO_LPLC", dataType: "text", visible: false, header: { text: t("위반장소(대)") } },

    { fieldName: "VIO_MDIV", dataType: "text", visible: false, header: { text: t("위반구분(소)") } },

    { fieldName: "VIO_MPLC", dataType: "text", visible: false, header: { text: t("위반장소(중)") } },

    { fieldName: "VIO_NO", dataType: "text", visible: false, header: { text: t("위반번호") } },

    { fieldName: "VIO_SPLC", dataType: "text", visible: false, header: { text: t("위반장소(소)") } },

    { fieldName: "VIO_TIME", dataType: "text", visible: false, header: { text: t("위반일시") } },

    { fieldName: "VIO_TIME2", dataType: "text", visible: false, header: { text: t("위반시간") } },

    { fieldName: "COMPANY", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "GUBUN", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "CHECK_TARGET_OBJ1", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "CHECK_TARGET_OBJ2", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "CHECK_TARGET_OBJ3", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "CHECK_TARGET_OBJ1_NM", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "CHECK_TARGET_OBJ2_NM", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "CHECK_TARGET_OBJ3_NM", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "SAGO_DIV_L", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "SAGO_DIV_M", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "SAGO_DIV_S", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "SAGO_DIV_L_NM", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "SAGO_DIV_M_NM", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "SAGO_DIV_S_NM", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "INSERT_USER_ID", dataType: "text", visible: false, header: { text: t("") } },

    { fieldName: "VIO_CNT_A", dataType: "text", editable: false, styleName: "right-column", header: { text: t("1년 건수") } },

    { fieldName: "EDU_YN_A", dataType: "text", editable: false, header: { text: t("교육이수") } },

    { fieldName: "VIO_CNT_B", dataType: "text", editable: false, styleName: "right-column", header: { text: t("1년 건수") } },

    { fieldName: "EDU_YN_B", dataType: "text", editable: false, header: { text: t("교육이수") } },

    { fieldName: "VIO_CNT_C", dataType: "text", editable: false, styleName: "right-column", header: { text: t("교통위반 - 1년건수") } },

  ],

  columns: [],

  columnLayout: [

    "VIO_TIME_DS",

    "STATUS",

    "IO_DIV_NM",

    "BSNS_NM",

    "DEPT_NM",

    "DTL_ASGN_NM",

    "VIO_EMP_NO",

    "ACT_DIV",

    "VIOLATOR",

    "VIO_GDIV_NM",

    "VIO_MDIV_NM",

    "VIO_DESC",

    "VIO_SPLC_NM",

    "VIO_PLC_DESC",

    "SHIP_NO",

    { name: "위반", direction: "horizontal", items: ["VIO_PHOTO", "VIO_FILE"] },

    "ACT_RESULT",

    { name: "조치", direction: "horizontal", items: ["ACT_PHOTO", "ACT_FILE"] },

    "DANSOK_ASGN_NM",

    "ACT_TIME_DS",

    "VEHICLE_TYPE_NM",

    "VEHICLE_CAR_NO",

    "VEHICLE_REG_NO",

    "VEHICLE_SPEED_NM",

    "RG_DATE",

  ],

});

grdMainProps.columns = grdMainProps.fields;

const searchData = () => {

  return commonPgSearchApi({

    queryId: "SAFDC0010_SEARCH_01",

    param: searchParam,

  });

};

const afterSearch = (res) => {

  if (!res || !res.ORESULT_CUR) {

    return;

  }

  const rows = (res.ORESULT_CUR || []).map((row) => normalizeGridRow(row));

  grdMain.value.getDataProvider().setRows(rows);

  grdMain.value.getGridView().setRowStyleCallback(rowStyleCallback);

};

const defaultDate = () => {

  if (sliSAFDC0010_02Tab01 !== undefined) {

    searchParam.VIO_DATE_FR = sliSAFDC0010_02Tab01.FROM_DT;

    searchParam.VIO_DATE_TO = sliSAFDC0010_02Tab01.TO_DT;

    return;

  }

  const date = dayjs();

  const dateFrom = dayjs().subtract(3, "month");

  searchParam.VIO_DATE_FR =

    dateFrom.$y +

    "-" +

    (dateFrom.$M + 1).toString().padStart(2, "0") +

    "-" +

    dateFrom.$D.toString().padStart(2, "0");

  searchParam.VIO_DATE_TO =

    date.get("year") +

    "-" +

    (date.get("month") + 1).toString().padStart(2, "0") +

    "-" +

    date.get("date").toString().padStart(2, "0");

};

const onButtonsClick = (btn) => {

  if (btn.id === "btnSearch") {

    new queryFlowHelper(vm, t)

      .setGridList([grdMain])

      .setQuery(searchData)

      .setAfter(afterSearch)

      .run();

  } else if (btn.id === "btnReject") {

    // 반려 상태: 11

    changeSelectedStatus("11", "반려하시겠습니까?");

  } else if (btn.id === "btnApprove") {

    // 승인 상태: 30

    changeSelectedStatus("30", "승인하시겠습니까?");

  } else if (btn.id === "btnApproveCancel") {

    // 승인취소 상태: 20

    changeSelectedStatus("20", "승인을 취소하시겠습니까?");

  }

};

// 체크된 그리드 행을 원본 데이터 배열로 변환

const getSelectedRows = () => {

  const checkedRows = grdMain.value.getGridView().getCheckedRows(true);

  if (checkedRows.length === 0) {

    Message.warn(t("선택된 데이터가 없습니다."));

    return [];

  }

  return checkedRows.map((rowIndex) =>

    grdMain.value.getDataProvider().getJsonRow(rowIndex)

  );

};

// 체크된 행을 상태 변경 API의 list 배열로 변환

const getSelectedStatusData = (status) => {

  return getSelectedRows().map((row) => {

    return {

      CMPNY_DIV: row.CMPNY_DIV,

      VIO_NO: row.VIO_NO,

      USER_ID: userStore.userId,

      STATUS: status,

    };

  });

};

// 팝업과 동일한 승인 요청 메일을 목록 승인 후 발송

const sendApprovalMail = async (rows) => {

  await Promise.all(

    rows.map(async (row) => {

      const approverResult = await commonPgSearchApi({

        queryId: "SAFDC0010_SEARCH_04",

        param: {

          CMPNY_DIV: userStore.cmpnyDiv,

          DANSOK_EMP_NO: row.DANSOK_EMP_NO,

        },

      });

      const approver = (approverResult.ORESULT_CUR || []).find(

        (item) => String(item.APP_EMP_NO) === String(row.APP_EMP_NO)

      );

      const email = String(approver?.EMAIL || "").trim();

      if (!email) return;

      await commonSendApi({

        EMAIL: [email],

        SUBJECT: "[HiSEs]안전수칙위반등록 승인 요청 메일",

        CONTENT: `

          <!doctype html>

          <html>

            <head><meta charset='utf-8'></head>

            <body>

              위반일시: ${row.VIO_DT1 || row.VIO_TIME_DS || ""} ${row.VIO_TIME2 || ""}<br />

              위반자: ${row.VIOLATOR || ""}<br />

              소속조직: ${row.VIO_EMP_ASGN || row.ASGN_NM || ""}<br />

              단속자성명: ${row.DANSOK_EMP_NM || ""}<br />

              내용: ${row.VIO_DESC || ""}<br />

            </body>

          </html>`,

      });

    })

  );

};

// 선택 행들의 STATUS를 일괄 변경

const changeSelectedStatus = (status, confirmMessage) => {

  const selectedRows = getSelectedRows();

  if (selectedRows.length === 0) return;

  new saveFlowHelper(vm, t)

    .setBefore(() => true)

    .setQuery(() =>

      commonPgExecuteApi({

        queryId: "SAFDC0010_APPROVE01",

        list: getSelectedStatusData(status),

      })

    )

    .setAfter(async () => {

      if (status === "30") {

        await sendApprovalMail(selectedRows);

      }

      onButtonsClick({ id: "btnSearch" });

    })

    .setConfirmMessage(confirmMessage)

    .run();

};

const onCellDblClicked = (grid, clickData) => {

  if (!clickData || !grdMain.value) {

    return;

  }

  const itemIndex = clickData.itemIndex ?? clickData.index?.itemIndex;

  const dataRow =

    clickData.dataRow ??

    clickData.index?.dataRow ??

    (itemIndex !== undefined

      ? grid.getDataSource().getDataRow(itemIndex)

      : undefined);

  if (dataRow === undefined || dataRow === null || dataRow < 0) {

    return;

  }

  const data = grdMain.value.getDataProvider().getJsonRow(dataRow);

  const rawDateTime = String(

    data.VIO_TIME ?? data.vio_time ?? data.VIO_TIME_DS ?? data.vio_time_ds ?? ""

  ).trim();

  const dateTimeMatch = rawDateTime.match(

    /^(\d{4})[-./](\d{2})[-./](\d{2})(?:[T\s]?(\d{2})?:?(\d{2})?)?/

  );

  const compactDateTime = /^\d{12}$/.test(rawDateTime)

    ? {

        date: `${rawDateTime.substring(0, 4)}-${rawDateTime.substring(4, 6)}-${rawDateTime.substring(6, 8)}`,

        time: `${rawDateTime.substring(8, 10)}:${rawDateTime.substring(10, 12)}`,

      }

    : null;

  const popupPayload = {

    ...data,

    CMPNY_DIV: data.CMPNY_DIV ?? data.company ?? data.COMPANY ?? "",

    COMPANY: data.COMPANY ?? data.company ?? data.CMPNY_DIV ?? "",

    BSNS_CD: data.BSNS_CD ?? data.bsns_cd ?? "",

    DEPT_CD: data.DEPT_CD ?? data.dept_cd ?? "",

    ASGN_CD: data.ASGN_CD ?? data.asgn_cd ?? "",

    VIO_NO: data.VIO_NO ?? data.vio_no ?? "",

    VIO_DT1: compactDateTime?.date ?? (dateTimeMatch

      ? `${dateTimeMatch[1]}-${dateTimeMatch[2]}-${dateTimeMatch[3]}`

      : data.VIO_DT1 ?? data.vio_dt1 ?? ""),

    VIO_TIME2:

      data.VIO_TIME2 ||

      data.vio_time2 ||

      (compactDateTime?.time ?? (dateTimeMatch?.[4] && dateTimeMatch?.[5]

        ? `${dateTimeMatch[4]}:${dateTimeMatch[5]}`

        : "")),

    VIO_GDIV: data.VIO_GDIV ?? data.vio_gdiv ?? "",

    VIO_GDIV_NM: data.VIO_GDIV_NM ?? data.vio_gdiv_nm ?? "",

    VIO_MDIV: data.VIO_MDIV ?? data.vio_mdiv ?? "",

    VIO_MDIV_NM: data.VIO_MDIV_NM ?? data.vio_mdiv_nm ?? "",

    VIO_SPLC: data.VIO_SPLC ?? data.vio_splc ?? "",

    VIO_SPLC_NM: data.VIO_SPLC_NM ?? data.vio_splc_nm ?? "",

    VIO_PLC_DESC: data.VIO_PLC_DESC ?? data.vio_plc_desc ?? "",

    VIO_DESC: data.VIO_DESC ?? data.vio_desc ?? "",

    VIOLATOR: data.VIOLATOR ?? data.violator ?? "",

    DANSOK_EMP_NO: data.DANSOK_EMP_NO ?? data.dansok_emp_no ?? "",

    DANSOK_EMP_NM: data.DANSOK_EMP_NM ?? data.dansok_emp_nm ?? "",

    DANSOK_ASGN_CD: data.DANSOK_ASGN_CD ?? data.dansok_asgn_cd ?? "",

    DANSOK_ASGN_NM: data.DANSOK_ASGN_NM ?? data.dansok_asgn_nm ?? "",

    DANSOK_JOB_TIT_NM: data.DANSOK_JOB_TIT_NM ?? "",

    DANSOK_DEPT_CD: data.DANSOK_DEPT_CD ?? data.dansok_dept_cd ?? "",

    IMG_ID1: data.IMG_ID1 ?? data.VIO_PHOTO ?? data.vio_photo ?? "",

    FILE_ID1: data.FILE_ID1 ?? data.VIO_FILE ?? data.vio_file ?? "",

    IMG_ID2: data.IMG_ID2 ?? data.ACT_PHOTO ?? data.act_photo ?? "",

    FILE_ID2: data.FILE_ID2 ?? data.ACT_FILE ?? data.act_file ?? "",

    ACT_ASGN_CD: data.ACT_ASGN_CD ?? data.act_asgn_cd ?? "",

    ACT_ASGN_NM: data.ACT_ASGN_NM ?? data.act_asgn_nm ?? "",

    ACTOR: data.ACTOR ?? data.actor ?? "",

    ACT_EMP_NO: data.ACT_EMP_NO ?? data.act_emp_no ?? "",

    ACT_JOB_TIT_NM: data.ACT_JOB_TIT_NM ?? "",

    ACT_DEPT_CD: data.ACT_DEPT_CD ?? data.act_dept_cd ?? "",

    ACT_PHONE: data.ACT_PHONE ?? data.act_phone ?? "",

    ACT_RSLT: data.ACT_RSLT ?? data.ACT_RESULT ?? data.act_rslt ?? data.act_result ?? "",

    ACT_DIV: data.ACT_DIV ?? data.act_div ?? "",

    ACT_DATE: data.ACT_DATE ?? data.act_date ?? "",

    ACT_BSNS_CD: data.ACT_BSNS_CD ?? data.act_bsns_cd ?? "",

    APP_SAME: data.APP_SAME ?? data.app_same ?? "N",

    APP_JOB_TIT_NM: data.APP_JOB_TIT_NM ?? "",

    APP_ASGN_CD: data.APP_ASGN_CD ?? data.app_asgn_cd ?? "",

    APP_DEPT: data.APP_DEPT ?? data.app_dept ?? "",

    DANSOK_DEPT_CD: data.DANSOK_DEPT_CD ?? data.dansok_dept_cd ?? "",

    VEHICLE_TYPE: data.VEHICLE_TYPE ?? "",

    VEHICLE_SPEED: data.VEHICLE_SPEED ?? "",

    STATUS: data.STATUS ?? data.status ?? "",

    INSERT_USER_ID: data.INSERT_USER_ID ?? data.insert_user_id ?? "",

  };

  sAFDC0010Popup01.value.openPopup2(popupPayload);

};

const openDansokEmpPopup = () => {

  empPopup.value.openPopup({

    CMPNY_DIV: userStore.cmpnyDiv,

    EMP_NM: searchParam.DANSOK_EMP_NM,

  });

};

const onDansokEmpSelected = (val) => {

  searchParam.DANSOK_EMP_NM = val.EMP_NM;

  searchParam.DANSOK_EMP_NO = val.EMP_NO;

};

const clearInsert = () => {

  searchParam.DANSOK_EMP_NM = "";

  searchParam.DANSOK_EMP_NO = "";

};

const deleteInfoDialog = ref(false);

const closedPopup = () => {

  onButtonsClick({ id: "btnSearch" });

};

watch(

  () => searchParam.COMPANY,

  (newValue) => {

    commonPgSearchApi({

      queryId: "searchBSNS",

      param: { CMPNY_DIV: newValue },

    }).then((res) => {

      codeList.bsnsCd = res.ORESULT_CUR;

      codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" });

      searchParam.BSNS_CD = "";

      searchParam.DEPT_CD = "";

    });

  }

);

watch(

  () => searchParam.BSNS_CD,

  (newValue, oldValue) => {

    commonPgSearchApi({

      queryId: "searchDept3",

      param: {

        CMPNY_DIV: searchParam.COMPANY,

        BSNS_CD: newValue,

        USE_DIV: searchField.PAST_ORG === "Y" ? "" : "Y",

      },

    }).then((res) => {

      if (oldValue !== undefined) {

        searchParam.DEPT_CD = "";

      }

      codeList.deptCd = res.ORESULT_CUR;

      codeList.deptCd.unshift({ DEPT_NM: "전체", DEPT_CD: "" });

    });

  },

  { immediate: true }

);

watch(

  () => searchField.PAST_ORG,

  (newValue) => {

    commonPgSearchApi({

      queryId: "searchBSNS3",

      param: {

        CMPNY_DIV: searchParam.COMPANY,

        USE_DIV: newValue === "Y" ? "" : "Y",

      },

    }).then((res) => {

      codeList.bsnsCd = res.ORESULT_CUR;

      codeList.bsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" });

      searchParam.BSNS_CD = userStore.bsnsCd;

    });

  }

);

watch(

  () => searchParam.CMPNY_DIV,

  (newValue) => {

    commonPgSearchApi({

      queryId: "searchBSNS",

      param: { CMPNY_DIV: newValue },

    }).then((res) => {

      searchParam.DANSOK_BSNS_CD = "";

      searchParam.DANSOK_ASGN_CD = "";

      codeList.dansokBsnsCd = res.ORESULT_CUR;

      codeList.dansokBsnsCd.unshift({ BSNS_NM: "전체", BSNS_CD: "" });

    });

  }

);

watch(

  () => searchParam.DANSOK_BSNS_CD,

  (newValue) => {

    commonPgSearchApi({

      queryId: "SAFDC0010_SEARCH_00",

      param: {

        CMPNY_DIV: searchParam.CMPNY_DIV,

        DANSOK_BSNS_CD: newValue,

      },

    }).then((res) => {

      searchParam.DANSOK_ASGN_CD = "";

      codeList.dansokDeptCd = res.ORESULT_CUR;

      codeList.dansokDeptCd.unshift({

        DANSOK_ASGN_NM: "전체",

        DANSOK_ASGN_CD: "",

      });

    });

  }

);

onMounted(async () => {

  defaultDate();

  await initCodeList();

  onButtonsClick({ id: "btnSearch" });

});

</script>

<template>

  <v-card class="pa-0 fill-height">

    <v-card-title class="pa-3 pb-0">

      <IGridTitle

        ref="gridTitle"

        :button-list="['btnSearch', 'btnReject', 'btnApprove', 'btnApproveCancel']"

        @click-button="onButtonsClick"

      />

    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">

      <div class="d-flex flex-column fill-height">

        <v-sheet class="searchArea d-flex mb-0">

          <v-checkbox

            v-model="searchField.CHK_DAY"

            class="mt-1"

            true-value="Y"

            false-value="N"

          ></v-checkbox>

          <i-input

            v-model="searchParam.VIO_DATE_FR"

            label-width="25px"

            :label="$t('일자')"

            width="170px"

            class="mr-1"

            type="date"

          ></i-input>

          <span class="mt-2">~</span>

          <i-input

            v-model="searchParam.VIO_DATE_TO"

            class="ml-1"

            type="date"

            width="150px"

          ></i-input>

          <i-select

            v-model="searchParam.COMPANY"

            :label="$t('위반조직')"

            label-width="50px"

            width="250px"

            :items="codeList.company"

            item-title="TXT"

            item-value="COD"

          ></i-select>

          <i-select

            v-model="searchParam.BSNS_CD"

            width="200px"

            :items="codeList.bsnsCd"

            item-title="BSNS_NM"

            item-value="BSNS_CD"

          ></i-select>

          <i-select

            v-model="searchParam.DEPT_CD"

            width="300px"

            :items="codeList.deptCd"

            item-title="DEPT_NM"

            item-value="DEPT_CD"

          ></i-select>

          <v-checkbox

            v-model="searchField.PAST_ORG"

            true-value="Y"

            false-value="N"

          ></v-checkbox>

          <span class="mt-1 mr-5">과거조직포함</span>

          <div class="d-flex align-center ml-5">

            <h3>※교통수칙 담당 : 안전보건지원부 김영남 기감(2-1601).</h3>

          </div>

        </v-sheet>

        <v-sheet class="searchArea d-flex">

          <i-select

            v-model="searchParam.CMPNY_DIV"

            :label="$t('단속조직')"

            label-width="50px"

            width="250px"

            :items="codeList.dansokCompany"

            item-title="TXT"

            item-value="COD"

          ></i-select>

          <i-select

            v-model="searchParam.DANSOK_BSNS_CD"

            width="200px"

            :items="codeList.dansokBsnsCd"

            item-title="BSNS_NM"

            item-value="BSNS_CD"

          ></i-select>

          <i-select

            width="270px"

            v-model="searchParam.DANSOK_ASGN_CD"

            :items="codeList.dansokDeptCd"

            item-title="DANSOK_ASGN_NM"

            item-value="DANSOK_ASGN_CD"

          >

          </i-select>

          <i-select

            v-model="searchParam.VIO_GDIV"

            :label="$t('구분')"

            width="200px"

            :items="codeList.gubun"

            item-title="TXT"

            item-value="COD"

          ></i-select>

          <i-select

            v-model="searchParam.STATUS"

            :label="$t('진행상태')"

            width="250px"

            :items="codeList.status"

            item-title="TXT"

            item-value="COD"

          >

          </i-select>

          <i-input

            :label="$t('단속자')"

            width="250px"

            v-model="searchParam.DANSOK_EMP_NM"

            readonly

          >

            <template v-slot:append-inner>

              <v-icon @click="openDansokEmpPopup" icon="mdi-magnify" />

              <v-icon

                color="error"

                @click="clearInsert"

                icon="mdi-window-close"

              />

            </template>

          </i-input>

        </v-sheet>

        <div class="d-flex align-center mb-2">

           <v-btn

            size="small"

            prepend-icon="mdi-information-outline"

            variant="text"

            @click="deleteInfoDialog = true"

          !>

            삭제 관련 안내

          </v-btn>

        </div>

        <v-sheet style="height: -webkit-fill-available">

          <!--그리드 표출 위치-->

          <RealGrid

            ref="grdMain"

            :grid-view-option="grdMainProps.gridViewOption"

            :keys="grdMainProps.keys"

            :fields="grdMainProps.fields"

            :columns="grdMainProps.columns"

            :column-layout="grdMainProps.columnLayout"

            :row-style-callback="rowStyleCallback"

            @onCellDblClicked="onCellDblClicked"

    $     />

        </v-sheet>

      </div>

    </v-card-text>

    <SAFDC0010_02Popup01

      ref="sAFDC0010Popup01"

      @closed="closedPopup"

    ></SAFDC0010_02Popup01>

    <v-dialog v-model="deleteInfoDialog" max-width="500">

      <v-card>

        <v-card-title class="d-flex align-center">

          <v-icon color="primary" class="mr-2">mdi-information-outline</v-icon>

          삭제 관련 안내

        </v-card-title>

        <v-divider />

        <v-card-text class="pt-4">

          <p>

            안전수칙위반 개별 건에 대한 삭제 요청은<br />

            아래와 같이 각 사업부에서 조치하는 프로세스로 운영됩니다.

          </p>

          <p>

            아래에 안내된 <strong>권한 보유 인원</strong>에게 요청

            부탁드립니다.<br />

          </p>

          <p class="mt-4 font-weight-bold">삭제 가능 인원</p>

          <p class="mt-2">

            <strong>조선사업부*</strong><br />

            정윤구(2-5067), 홍태우(2-6292)

          </p>

          <p class="mt-2">

            <strong>엔진기계사업부</strong><br />

            하성민(3-5846), 김도호(2-7203)

          </p>

          <p class="mt-2">

            <strong>해양에너지사업본부</strong><br />

            문수익(2-1480), 곽진섭(2-9213)

          </p>

          <p class="mt-2">

            <strong>중형선</strong><br />

            정도훈(3411), 송채린(2342)

          </p>

          <p class="mt-2">

            <strong>함정</strong.><br />

            이상현(3-6615), 송봉근(2-5217)

          </p>

          <p class="mt-2">

            <strong>안전경영실</strong><br />

            문령훈(3-9992), 강현웅(3-6101), 김성일(3-5826), 장믿음(3-0359),

            최동해(2-5674), 윤상원(3-9993)

          </p>

          <p class="mt-4 text-caption">

            ※ 상기 권한 인원을 통해서 삭제가 가능하오니, 담당자에게 문의

            부탁드립니다.

          </p>

        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-end">

          <v-btn

            class1="mt-2"

            variant="elevated"

            color="primary"

            @click="deleteInfoDialog = false"

            >확인</v-btn

          >

        </v-card-actions>

      </v-card>

    </v-dialog>

    <SAFDC0010_01Popup02

      ref="sAFDC0010Popup02"

      @closed="closedPopup"

    ></SAFDC0010_01Popup02>

    <EmpPopup ref="empPopup" @selected="onDansokEmpSelected"></EmpPopup>

  </v-card>

</template>

<style scoped lang="scss">

.tableBackGround {

  background-color: #f2fe8a;

}

table,

th,

td {

  border: 1px solid black;

  border-collapse: collapse;

  text-align: center;

  font-size: 17px;

}

.content-area {

  position: relative;

  // 만약 타이틀 영역에 컴포넌트를 추가한다면

  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.

  height: calc(100vh - 293px);

  overflow-y: auto;

  > div {

    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.

    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.

    min-height: 500px;

  }

}

</style>
