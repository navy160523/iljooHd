<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 사고 세부사항 팝업 > 사고즉보    -->
<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  watch,
  nextTick,
} from "vue";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import { useLogsStore } from "@hiway/stores/logs";
import IMenuTitle from "@/components/IMenuTitle.vue";
import IGridTitle from "@/components/IGridTitle.vue";
import ILabel from "@/components/ILabel.vue";
import RealGrid from "@/components/RealGrid.vue";
import DeptPopup from "@/components/popup/DeptPopup.vue";
import dayjs from "dayjs";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";

import saveFlowHelper from "@/utils/saveFlowHelper";

import Message from "@hiway/utils/notify";
import deleteFlowHelper from "@/utils/deleteFlowHelper";
import SAFAB0020PopUp from "@/pages/30_safety/SAF_A/SAFAB0020PopUp.vue";
import IUploadImageSingle from "@/components/IUploadImageSingle.vue";
import SAFAF0010ManPopUp from "@/pages/30_safety/SAF_A/SAFAF0010ManPopUp.vue";
// 팝업존
import AcdtPopup from "@/components/popup/AcdtPopup.vue";
import causePopup from "@/components/popup/causePopup.vue";
import LocationPopup from "@/components/popup/LocationPopup.vue";
import { RowState } from "realgrid";
import SAFAB0020WRK_STD from "@/pages/30_safety/SAF_A/SAFAB0020WRK_STD.vue";
import SAFAB0020DisasterPopUp from "@/pages/30_safety/SAF_A/SAFAB0020DisasterPopUp.vue";
const vm = getCurrentInstance().proxy; //다이얼로그관련
const userStore = useUserStore();
const t = useI18n().t; //다국어
const menuTitle = ref(null);
const grdMain = ref(null);
const grdTwo = ref(null);
const grdTitle = ref(null); //인적사항 현황
const grdTitle2 = ref(null); //사고 개요
const grdTitle3 = ref(null); //재해원인 및 예방대책

//컴포넌트 (그리드,파일첨부...) 비활성화 함수
const disabledGridBtn = async () => {
  await nextTick();
  //인적사항 현황 버튼 비활성화
  grdTitle.value.disableBtn("btnCreate", true);
  grdTitle.value.disableBtn("btnDelete", true);
  //사고개요
  grdTitle2.value.disableBtn("btnUpdate", true);
  //재해원인 및 예방대책
  grdTitle3.value.disableBtn("btnSearch", true);
  grdTitle3.value.disableBtn("btnCreate", true);
  grdTitle3.value.disableBtn("btnUpdate", true);
  grdTitle3.value.disableBtn("btnDelete", true);
  //사고상황사진
  fileUpload1.value.setDisable([
    "btnAttach",
    "btnFileUpload",
    "btnDownLoad",
    "btnDelete",
  ]);
  fileUpload2.value.setDisable([
    "btnAttach",
    "btnFileUpload",
    "btnDownLoad",
    "btnDelete",
  ]);
  fileUpload3.value.setDisable([
    "btnAttach",
    "btnFileUpload",
    "btnDownLoad",
    "btnDelete",
  ]);
};

// 팝업관련
const deptPopup = ref(null);
const MainPopOpen = ref(null);
const emit = defineEmits(["close", "upData"]);
const Popdata = reactive({
  INJR_DEPT_NM1: "",
  INJR_DEPT_NM2: "",
  INJR_DEPT_NM3: "",
  INJR_DEPT_CD1: "",
  INJR_DEPT_CD2: "",
  INJR_DEPT_CD3: "",
});

const codeList = reactive({
  WRK_STD: [{ TXT: "없음", COD: "" }],
  WRK: [{ TXT: "없음", COD: "" }],
});
const WRK_STDPopUp = ref(null);
const Disaster = ref(null);
const acdtPopupRef = ref(null);
const locationPopup = ref(null);
const ManPopUp = ref(null);
const CausePopup = ref(null);
const INJRDEPT = ref([]);
const WRK_STD_NMNot = ref(false);
const props = defineProps({
  popupParam: {
    type: Object,
    required: false,
    default() {
      return {};
    },
  },
});

const fileSave = reactive([]);
const fileUpload1 = ref(null);
const fileUpload2 = ref(null);
const fileUpload3 = ref(null);
const readonly1 = ref(null);
const readonly2 = ref(null);
const readonly3 = ref(null);
const GuBunValue = ref(false);
const index = ref(null);
/*  공통코드 세팅 */
onMounted(() => {
  for (let i in props.popupParam) {
    Popdata[i] = props.popupParam[i];
  }

  if (Popdata.OCCUR_TIME) {
    const hours = Popdata.OCCUR_TIME.substring(0, 2);
    const minutes = Popdata.OCCUR_TIME.substring(2);
    Popdata.OCCUR_TIME = `${hours}:${minutes}`;
  }
  if (Popdata.OCCUR_DT) {
    Popdata.OCCUR_DT = dayjs(Popdata.OCCUR_DT).format("YYYY-MM-DD");
  }
  if (Popdata.SAGO_RCV_DT) {
    Popdata.SAGO_RCV_DT = dayjs(Popdata.SAGO_RCV_DT).format("YYYY-MM-DD");
  }
  if (Popdata.INJR_DEPT_NM1) {
    let valueContent = Popdata.INJR_DEPT_NM1.split(/[,\s]+/);
    INJRDEPT.value = valueContent;
    Popdata.INJR_DEPT_NM1 = valueContent[0];
    Popdata.INJR_DEPT_NM2 = valueContent[1];
    Popdata.INJR_DEPT_NM3 = valueContent[2];
  }
  if (Popdata.INJR_DEPT_CD1) {
    let valueContent = Popdata.INJR_DEPT_CD1.split(/[,\s]+/);
    Popdata.INJR_DEPT_CD1 = valueContent[0];
    Popdata.INJR_DEPT_CD2 = valueContent[1];
    Popdata.INJR_DEPT_CD3 = valueContent[2];
  }

  Promise.all([
    getCodeList("HHIB320"), //0
    getCodeList("HHIB010"), //1
    getCodeList("HHIB180"), //2
    getCodeList("HHIB050"), //3
    getCodeList("HHIB070"), //4
    getCodeList("HHIB080"), //5
  ]).then((res) => {
    codeList.GUGUP_USE = res[0].ORESULT_CUR;
    codeList.SAGOBURU = res[1].ORESULT_CUR;
    codeList.ChekIm = res[2].ORESULT_CUR;

    codeList.CheckGuBun = [
      { TXT: "사내", COD: "I" },
      { TXT: "사외", COD: "O" },
    ];
    codeList.gongjong = res[3].ORESULT_CUR;

    grdMain.value.setBindingColumn(
      "SJE_TYPE_CD",
      res[5].ORESULT_CUR,
      "COD",
      "TXT"
    );

    grdMain.value.setBindingColumn(
      "RPT_TYPE_CD",
      res[4].ORESULT_CUR,
      "COD",
      "TXT"
    );
  });

  console.log(props.popupParam, "props.popupParam");

  SagoSearch();
  setTimeout(() => {
    disabledGridBtn(); //그리드 버튼 비활성화 함수
  }, 1000);
});

// 조회
const searchData01 = (idx) => {
  let param = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    SAGO_SN: Popdata.SAGO_SN,
  };
  return commonSearchApi({ queryId: "SAFAB0020_search02", param: param });
};

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  console.log(res.ORESULT_CUR[0].EMP_NO, "res");
  if (res.ORESULT_CUR[0].EMP_NO) {
    // 작업지시서 조회
    let param = {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      EMPNO: res.ORESULT_CUR[0].EMP_NO,
      OCCUR_DT: Popdata.OCCUR_DT.replace(/-/g, ""),
    };
    commonSearchApi({ queryId: "SAFAB0020_search11", param: param }).then(
      (res) => {
        // 작업 표준서 조회
        console.log("res11", res);

        if (res.ORESULT_CUR[0]) {
          codeList.WRK = res.ORESULT_CUR;
          let params = {
            CMPNY_DIV: Popdata.CMPNY_DIV,
            WORKID: res.ORESULT_CUR[0].WORK_ID,
          };
          commonSearchApi({
            queryId: "SAFAB0020_search12",
            param: params,
          }).then((res) => {
            codeList.WRK_STD = res.ORESULT_CUR;
          });
        }
      }
    );
  }
};

const SagoSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData01)
    .setAfter(afterSearch01)
    .showMessage(true)
    .run();
};

// 부서선택팝업
const deptPopupOpen = (gbn, i) => {
  console.log(i);
  if (gbn == "INJR") {
    GuBunValue.value = false;

    if (i) {
      console.log(i, "55555");
      index.value = i;
      console.log(index.value, "44");
    } else {
      index.value = undefined;
    }
  } else GuBunValue.value = true;

  console.log(GuBunValue.value);
  deptPopup.value.openPopup();
};

const onDeptSelected = (row) => {
  console.log(row);
  let matchResult = row.ASGN_FULL_NM.match(/-(.*?)\(/);
  let resultString = matchResult ? matchResult[1] : "";
  resultString = resultString.replace(/-/g, "");

  if (!GuBunValue.value) {
    if (!index.value) {
      Popdata.INJR_DEPT_CD = row.BSNS_CD;
      Popdata.INJR_DEPT_NM = row.ASGN_SHRT_NM;
    }
    if (index.value) {
      let StringDept = `INJR_DEPT_CD${index.value}`;
      let StringDeptNM = `INJR_DEPT_NM${index.value}`;
      console.log(StringDept);
      console.log(StringDeptNM);
      Popdata[StringDept] = row.BSNS_CD;
      Popdata[StringDeptNM] = row.ASGN_SHRT_NM;
      console.log(Popdata.INJR_DEPT_CD1, "Popdata");
      console.log(INJRDEPT.value, "INJRDEPT");
    }
  } else {
    Popdata.RESP_DEPT_CD = row.DEPT_CD;
    Popdata.RESP_DEPT_NM =
      row.ORGN_DIV == "A" ? row.ASGN_SHRT_NM : resultString;
    Popdata.VNDR_NM = row.ORGN_DIV == "B" ? row.ASGN_SHRT_NM : "";
    Popdata.VNDR_CD = row.ORGN_DIV == "B" ? row.ASGN_CD : "";
    console.log("ggggg");
  }
};

const acdtOpen = () => {
  acdtPopupRef.value.openPopup();
};

const selectedArr = (row) => {
  Popdata.SAGO_DIV_L_NM = row[0].TXT;
  Popdata.SAGO_DIV_M_NM = row[1].TXT;
  Popdata.SAGO_DIV_S_NM = row[2].TXT;

  Popdata.SAGO_DIV_L = row[0].COD;
  Popdata.SAGO_DIV_M = row[1].COD;
  Popdata.SAGO_DIV_S = row[2].COD;
};

const locationPopupOpen = () => {
  locationPopup.value.openPopup(userStore.cmpnyDiv);
};

const selectedLocation = (row) => {
  Popdata.SAGO_LOC_L_NM = row[0].TXT;
  Popdata.SAGO_LOC_M_NM = row[1].TXT;
  Popdata.SAGO_LOC_S_NM = row[2].TXT;

  Popdata.SAGO_LOC_L = row[0].COD;
  Popdata.SAGO_LOC_M = row[1].COD;
  Popdata.SAGO_LOC_S = row[2].COD;
};

// 작업표준서 팝업

//  작업 표준서 로직 변경 추후 사용 할수있어서 주석처리

// const WRKSTDOpen = () => {
//   if (!WRK_STD_NMNot.value) {
//     WRK_STDPopUp.value.openPopup(Popdata.WRK_STD_ID);
//   }
// };

// const selectedWRKSTD = (param) => {
//   for (let i of param) {
//     if (Popdata.WRK_STD_NM == null) {
//       Popdata.WRK_STD_NM = "";
//     }

//     if (Popdata.WRK_STD_ID == null) {
//       Popdata.WRK_STD_ID = "";
//     }
//     Popdata.WRK_STD_NM += `${i.WS_NM},`;
//     Popdata.WRK_STD_NO += `${i.WS_ID},`;
//     console.log(param, Popdata.WRK_STD_NM, "sadasd");
//   }
//   Popdata.WRK_STD_NM = Popdata.WRK_STD_NM.slice(0, -1);
//   Popdata.WRK_STD_NO = Popdata.WRK_STD_NO.slice(0, -1);
// };

// 기인물 팝업오픈
const causePopupPopupOpen = () => {
  CausePopup.value.openPopup();
};
const onCauseSelected = (row) => {
  console.log(row, "row");
  Popdata.GIINMUL1_CD = row[0].COD;
  Popdata.GIINMUL1_NM = row[0].TXT;
  Popdata.GIINMUL2_CD = row[1].COD;
  Popdata.GIINMUL2_NM = row[1].TXT;
};

const selectedDisaster = (param) => {
  let arr = grdTwo.value.getDataProvider().getJsonRows();
  for (let i of param) {
    let checkItem = arr.some((row) => row.RSN_CD === i.RSN_CD);
    if (!checkItem) {
      grdTwo.value.addRow({
        RSN_GRP_NM1: i.RSN_GRP_NM1,
        RSN_GRP_NM2: i.RSN_GRP_NM2,
        RSN_NM: i.RSN_NM,
        RSN_DET: "",
        DAECHEK: "",
        RSN_CD: i.RSN_CD,
        RSN_GRP_CD1: i.RSN_GRP_CD1,
        RSN_GRP_CD2: i.RSN_GRP_CD2,
        SAGO_SN: i.SAGO_SN,
        CMPNY_DIV: "HHI",
        SAVE_YN: "",
        REMARK: "",
      });
    }
  }
};

const upDataRow = () => {
  SagoSearch();
};
// //  버튼이밴트

const onButtonsClick = (btn, gbn) => {
  console.log(btn, gbn, "sadsad");
  if (gbn === "인적사항현황") {
    if (btn === "btnCreate") {
      ManPopUp.value.openPopup(Popdata);
    }
    if (btn === "btnDelete") {
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdMain, row: "check" }])
        .setGridList([grdMain])
        .setBefore(DeltailChek)
        .setQuery(DeltailDelData)
        .setAfter(() => SagoSearch())
        .run();
    }
  }

  if (gbn === "재해원인") {
    if (btn === "btnSearch") {
      new queryFlowHelper(vm, t)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .showMessage(false)
        .run();
    }
    if (btn === "btnCreate") {
      console.log(Disaster.value);
      Disaster.value.openPopup(Popdata);
    }
    if (btn === "btnUpdate") {
      new saveFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdTwo, row: null }])
        .setGridList([grdTwo])
        .setBefore(validationCheck)
        .setQuery(saveData)
        .setAfter(() => {
          onButtonsClick("btnSearch", "재해원인");
        })
        .run();
    }

    if (btn === "btnDelete") {
      new deleteFlowHelper(vm, t)
        .setTargetGridRow([{ grid: grdTwo, row: null }])
        .setGridList([grdTwo])
        .setBefore(validationCheck)
        .setQuery(deleteData)
        .setAfter(() => {
          onButtonsClick("btnSearch", "재해원인");
        })
        .run();
    }
  }

  if (gbn === "사고개요") {
    if (btn === "btnUpdate") {
      console.log("sadsad");
      new saveFlowHelper(vm, t)
        .setBefore(saGoCheck)
        .setQuery(saGosaveData)
        .setAfter(() => {
          onButtonsClick("btnSearch", "재해원인");
          emit("upData");
        })
        .run();
    }
  } else if (btn.id === "btnClose") {
    emit("close", "close");
  }
};

// 저장 사고개요
const saGoCheck = () => {
  if (!Popdata.OCCUR_DT) {
    Message.warn(t("발생일시는 필수 입력입니다."));
    return false;
  }
  if (!Popdata.OCCUR_TIME) {
    Message.warn(t("발생일시는 필수 입력입니다."));
    return false;
  }
  if (!Popdata.INJR_DEPT_NM) {
    Message.warn(t("재해조직은 필수 입력입니다."));
    return false;
  }
  if (!Popdata.RESP_DEPT_NM) {
    Message.warn(t("책임조직은 필수 입력입니다."));
    return false;
  }
  if (!Popdata.SAGO_LOC_L_NM) {
    Message.warn(t("발생장소는 필수 입력입니다."));
    return false;
  }
  if (!Popdata.SAGO_DIV_L_NM) {
    Message.warn(t("사고형태는 필수 입력입니다."));
    return false;
  }
  if (!Popdata.GUGUP_USE) {
    Message.warn(t("구급차이용여부는 필수 입력입니다."));
    return false;
  }
  if (!Popdata.SAGO_RCV_DT) {
    Message.warn(t("사고접수일은 필수 입력입니다."));
    return false;
  }
  if (!Popdata.RESPON_DIV) {
    Message.warn(t("책임구분은 필수 입력입니다."));
    return false;
  }
  if (!Popdata.PROCESS_CD) {
    Message.warn(t("공정명은 필수 입력입니다."));
    return false;
  }
  if (!Popdata.GIINMUL1_NM) {
    Message.warn(t("기인물은 필수 입력입니다."));
    return false;
  }
  if (!Popdata.WIHEOM_YN) {
    Message.warn(t("위험성재평가는 필수 입력입니다."));
    return false;
  }
  if (!Popdata.SAGO_GAEYO) {
    Message.warn(t("사고내용은 필수 입력입니다."));
    return false;
  }
  return true;
};

const saGosaveData = () => {
  let saveParams = [];
  Popdata.SAGO_RCV_DT = Popdata.SAGO_RCV_DT.replace(/-/g, "");
  Popdata.OCCUR_DT = Popdata.OCCUR_DT.replace(/-/g, "");
  Popdata.OCCUR_TIME = Popdata.OCCUR_TIME.replace(/:/g, "");

  if (Popdata.INJR_DEPT_CD2) {
    Popdata.INJR_DEPT_CD1 += `,${Popdata.INJR_DEPT_CD2}`;
  }
  if (Popdata.INJR_DEPT_NM2) {
    Popdata.INJR_DEPT_NM1 += `,${Popdata.INJR_DEPT_NM2}`;
  }
  if (Popdata.INJR_DEPT_CD3) {
    Popdata.INJR_DEPT_CD1 += `,${Popdata.INJR_DEPT_CD3}`;
  }
  if (Popdata.INJR_DEPT_NM3) {
    Popdata.INJR_DEPT_NM1 += `,${Popdata.INJR_DEPT_NM3}`;
  }

  saveParams.push(Popdata);
  console.log(saveParams, "saveParams");
  return commonExecuteApi({ queryId: "SAFAB0020_save01", list: saveParams });
};
// 삭제 인적사항

const DeltailChek = async () => {
  let chekedRow = await grdMain.value.getGridView().getCheckedRows();

  if (chekedRow.length === 0) {
    Message.warn(t("선택한 데이터가 없습니다."));
    return false;
  }
  return true;
};

const DeltailDelData = async () => {
  let checkedRow = await grdMain.value.getGridView().getCheckedRows();
  let param = [];

  await checkedRow.forEach(async (item) => {
    let data = await grdMain.value.getDataProvider().getJsonRow(item);

    param.push(data);
  });

  console.log(param, "param");

  return commonExecuteApi({ queryId: "SAFAB0010_delete02", list: param });
};

// 조회 재해원인
const searchData = (idx) => {
  let param = {
    CMPNY_DIV: Popdata.CMPNY_DIV,
    SAGO_SN: Popdata.SAGO_SN,
  };
  return commonSearchApi({ queryId: "SAFAB0020_search07", param: param });
};

const afterSearch = (res) => {
  grdTwo.value.getDataProvider().setRows(res.ORESULT_CUR);
};

// 저장 재해원인
const validationCheck = () => {
  let checkedRows = grdTwo.value.getGridView().getCheckedRows();

  if (checkedRows.length === 0) {
    Message.warn(t("선택된 데이터가 없습니다."));

    return false;
  } else {
    return true;
  }
};

const saveData = () => {
  let saveParams = [];
  let checkedRows = grdTwo.value.getGridView().getCheckedRows(true);
  for (let rowIdx of checkedRows) {
    let data = grdTwo.value.getDataProvider().getJsonRow(rowIdx);
    console.log(data, "data");
    saveParams.push(data);
  }
  console.log(saveParams);

  return commonExecuteApi({ queryId: "SAFAB0020_save02", list: saveParams });
};

// 삭제 재해원인

const deleteData = () => {
  let delParams = [];
  let checkedRows = grdTwo.value.getGridView().getCheckedRows(true);

  for (let rowIdx of checkedRows) {
    let data = grdTwo.value.getDataProvider().getJsonRow(rowIdx);
    console.log(data, "data");
    delParams.push(data);
  }

  return commonExecuteApi({ queryId: "SAFAB0020_delete04", list: delParams });
};

//  시간 유효성검사

const formatTimeFromInput = (inputTime) => {
  const timePattern = /^([01]?[0-9]|2[0-3])([0-5][0-9])$/;
  if (!timePattern.test(inputTime)) {
    return "";
  }

  const hours = inputTime.substring(0, 2);
  const minutes = inputTime.substring(2);
  return `${hours}:${minutes}`;
};

const formatAndDisplayTime = () => {
  Popdata.OCCUR_TIME = formatTimeFromInput(Popdata.OCCUR_TIME);
};

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ["BIRTHDAY", "NAME", "SOSOG_DESC"],
  fields: [
    {
      fieldName: "PRSN_DIV_NM",
      dataType: "text",
      header: { text: t("구분") },
      editable: false,
    },
    {
      fieldName: "NAME",
      dataType: "text",
      header: { text: t("재해자") },
      editable: false,
    },
    {
      fieldName: "RPT_TYPE_CD",
      dataType: "text",
      header: { text: t("사고처리") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
    },
    {
      fieldName: "SOSOG_DIV_NM",
      dataType: "text",
      header: { text: t("소속구분") },
      editable: false,
    },
    {
      fieldName: "SOSOG_DESC",
      dataType: "text",
      header: { text: t("소속조직명") },
      editable: false,
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      header: { text: t("사번") },
      editable: false,
    },
    {
      fieldName: "GRD_DESC",
      dataType: "text",
      header: { text: t("직급") },
      editable: false,
    },
    {
      fieldName: "JIKJONG_NM",
      dataType: "text",
      header: { text: t("직종") },
      editable: false,
    },
    {
      fieldName: "AGE",
      dataType: "text",
      header: { text: t("나이") },
      editable: false,
    },
    {
      fieldName: "BIRTHDAY",
      header: { text: t("생년월일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },

    {
      fieldName: "IPSAIL",
      header: { text: t("입사일자") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },

    {
      fieldName: "HND_PHN",
      dataType: "text",
      header: { text: t("연락처(HP)") },
      editable: false,
    },

    {
      fieldName: "CONTACTING",
      header: { text: t("개인진정") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      editable: false,
    },
    {
      fieldName: "SJE_TYPE_CD",
      dataType: "text",
      header: { text: t("산재구분") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
    },

    // 안보이는거

    {
      fieldName: "REGTDTE",
      header: { text: t("총무부접수일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
      visible: false,
    },
    {
      fieldName: "OKDTE",
      header: { text: t("산재승인일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
      visible: false,
    },
    {
      fieldName: "HUDTE",
      header: { text: t("휴직일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
      visible: false,
    },
    {
      fieldName: "BOKDTE",
      header: { text: t("복직일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
      visible: false,
    },

    {
      fieldName: "DAYCNT",
      dataType: "text",
      header: { text: t("손실일수") },
      editable: false,
      visible: false,
    },
    {
      fieldName: "LOSTCOST",
      dataType: "number",
      header: { text: t("손실비용(원)") },
      numberFormat: "#,###",
      editable: false,
      visible: false,
    },

    {
      fieldName: "GRP_ENT_DATE",
      header: { text: t("그룹입사일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      visible: false,
    },
    {
      fieldName: "JINDAN_NM",
      dataType: "text",
      header: { text: t("진단") },
      visible: false,
    },
    { fieldName: "PRSN_DIV", dataType: "text", visible: false },
    { fieldName: "SEX", dataType: "text", visible: false },
    { fieldName: "JIKJONG_CD", dataType: "text", visible: false },
    { fieldName: "SOSOG_TEL", dataType: "text", visible: false },
    { fieldName: "UMJU_MSR_MTHD", dataType: "text", visible: false },
    { fieldName: "UMJU_ALCOL", dataType: "text", visible: false },
    { fieldName: "SOSOG_DIV", dataType: "text", visible: false },
    { fieldName: "INJURY_PART_LM", dataType: "text", visible: false },
    { fieldName: "INJURY_PART_SM", dataType: "text", visible: false },
    { fieldName: "INJURY_PART_L", dataType: "text", visible: false },
    { fieldName: "INJURY_PART_S", dataType: "text", visible: false },
    { fieldName: "INJURY_TYPE", dataType: "text", visible: false },
    { fieldName: "JINDAN_CD", dataType: "text", visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "SAGO_SN", dataType: "text", visible: false },
    { fieldName: "SEQ", dataType: "text", visible: false },
  ],
  columns: [],
});

grdProps1.columns = grdProps1.fields;

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption: { checkBar: { visible: true } },
  keys: ["RSN_GRP_NM2", "RSN_CD"],
  fields: [
    {
      fieldName: "RSN_GRP_NM1",
      dataType: "text",
      header: { text: t("구분") },
      mergeRule: { criteria: "value" },
      editable: false,
    },
    {
      fieldName: "RSN_GRP_NM2",
      dataType: "text",
      header: { text: t("구분") },
      editable: false,
    },
    {
      fieldName: "RSN_NM",
      dataType: "text",
      header: { text: t("원인") },
      editable: false,
    },
    {
      fieldName: "RSN_DET",
      dataType: "text",
      header: { text: t("상세원인") },
      styleName: "editable_column",
    },
    {
      fieldName: "DAECHEK",
      dataType: "text",
      header: { text: t("재발방지대책") },
      styleName: "editable_column",
    },
    {
      fieldName: "RSN_CD",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "RSN_GRP_CD1",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "RSN_GRP_CD2",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "SAGO_SN",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "SAVE_YN",
      dataType: "text",

      visible: false,
    },

    {
      fieldName: "REMARK",
      dataType: "text",

      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    {
      name: "구분",
      direction: "horizontal",
      hideChildHeaders: true,
      header: {
        text: t("구분"),
      },
      items: ["RSN_GRP_NM1", "RSN_GRP_NM2"],
    },
    "RSN_NM",
    "RSN_DET",
    "DAECHEK",
  ],
});

grdProps2.columns = grdProps2.fields;
// 파일 업로드
//  파일관련 메소드
const checkFileId = async () => {
  for (let i = 1; i <= 3; i++) {
    let PIC_FILE_ID = `PIC_FILE_ID${i}`;
    let fileUpload = eval(`fileUpload${i}.value`);
    let readonlyval = eval(`readonly${i}`);
    if (Popdata[PIC_FILE_ID] === null || Popdata[PIC_FILE_ID] === undefined) {
      fileUpload.setGuid();
      Popdata[PIC_FILE_ID] = fileUpload.guid;
      await fileUpload.onButtonsClick({ id: "btnSearch" });
      if (fileUpload.saveFile) {
        readonlyval.value = false;
      } else {
        readonlyval.value = true;
      }
    } else {
      //파일아이디 있을때
      fileUpload.setGuid(Popdata[PIC_FILE_ID]);
      Popdata[PIC_FILE_ID] = fileUpload.guid;
      await fileUpload.onButtonsClick({ id: "btnSearch" });
      if (fileUpload.saveFile) {
        readonlyval.value = false;
      } else {
        readonlyval.value = true;
      }
    }
  }
};

watch(
  () => fileUpload1.value,
  (newValue) => {
    if (newValue !== null && newValue !== "" && newValue !== undefined) {
      checkFileId();
    }
  }
);

const selected = (list, SEQ) => {
  console.log("iii");
  if (SEQ == 1) {
    fileSave.push("1");
    // if (!dblclick.value) {
    //   fileUpload1.value.setDisable(["btnFileUpload", "btnDownLoad"]);
    // }
    readonly1.value = false;
  }
  if (SEQ == 2) {
    fileSave.push("2");
    // if (!dblclick.value) {
    //   fileUpload2.value.setDisable(["btnFileUpload", "btnDownLoad"]);
    // }
    readonly2.value = false;
  }
  if (SEQ == 3) {
    fileSave.push("3");
    // if (!dblclick.value) {
    //   fileUpload3.value.setDisable(["btnFileUpload", "btnDownLoad"]);
    // }
    readonly3.value = false;
  }
};
const deleted = (list, index) => {
  for (let key in fileSave) {
    if (fileSave[key] == index) {
      delete fileSave[key];
    }
  }

  if (index == 1) {
    Popdata.PIC_1_DESC = "";
    readonly1.value = true;
  }
  if (index == 2) {
    Popdata.PIC_2_DESC = "";
    readonly2.value = true;
  }
  if (index == 3) {
    Popdata.PIC_3_DESC = "";
    readonly3.value = true;
  }
};

//  그리드 이벤트
const onCellDblClickedMain = (grd, data) => {
  if (data.cellType === "data") {
    let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow);
    console.log("인적사항 팝업 호출");
    ManPopUp.value.openPopup(row, true, "dblclick");
  }
};
//  파일관련 메소드

//  watch 모음집
watch(
  () => Popdata.RESPON_DIV,
  (newValue) => {
    Popdata.RESP_DEPT_CD = "";
    Popdata.RESP_ORGN_NM = "";
    Popdata.ASGN_FULL_NM = "";
  }
);

watch(
  () => Popdata.WIHEOM_YN,
  (newValue) => {
    console.log(newValue, "nee");
    if (newValue == "N") {
      console.log(WRK_STD_NMNot.value, "WRK_STD_NMNot");
      WRK_STD_NMNot.value = true;
      Popdata.WRK_STD_NM = "";
      Popdata.WRK_STD_NO = "";
      Popdata.WRK = "";
    } else {
      WRK_STD_NMNot.value = false;
    }
  }
);

//  기타 메서드
const plus = () => {
  let cnt = INJRDEPT.value.length;
  if (!cnt) {
    cnt = 1;
  } else {
    cnt += 1;
  }

  if (cnt === 4) {
    return Message.warn(t("최대 3개까지만 추가 가능합니다."));
  } else {
    INJRDEPT.value.push(`INJR_DEPT_NM${cnt}`);
  }
};
const minus = (item) => {
  console.log(item, "item");

  console.log(Popdata.INJR_DEPT_NM1, "item");
  if (item == "INJR_DEPT_NM1") {
    Popdata.INJR_DEPT_NM1 = "";
    Popdata.INJR_DEPT_CD1 = "";
  }
  if (item == "INJR_DEPT_NM2") {
    Popdata.INJR_DEPT_NM2 = "";
    Popdata.INJR_DEPT_CD2 = "";
  }
  if (item == "INJR_DEPT_NM3") {
    Popdata.INJR_DEPT_NM3 = "";
    Popdata.INJR_DEPT_CD3 = "";
  }
  INJRDEPT.value = Array.prototype.filter.call(
    INJRDEPT.value,
    (x) => x !== item
  );
};

const checkBoxWRK_STD_NEW = () => {
  console.log(Popdata.WRK_STD_NEW);
  if (Popdata.WRK_STD_NEW == "N") {
    Popdata.WRK_STD_NM = "신규작성필요";
    Popdata.WRK_STD_NO = "신규작성필요";
  } else if (Popdata.WRK_STD_NEW == "Y") {
    Popdata.WRK_STD_NM = "";
  }
};

//  watch 모음집
watch(
  () => props.popupParam,
  (newValue) => {
    for (let i in props.popupParam) {
      Popdata[i] = props.popupParam[i];
    }
    if (Popdata.OCCUR_TIME) {
      const hours = Popdata.OCCUR_TIME.substring(0, 2);
      const minutes = Popdata.OCCUR_TIME.substring(2);
      Popdata.OCCUR_TIME = `${hours}:${minutes}`;
    }
    if (Popdata.OCCUR_DT) {
      Popdata.OCCUR_DT = dayjs(Popdata.OCCUR_DT).format("YYYY-MM-DD");
    }
    if (Popdata.SAGO_RCV_DT) {
      Popdata.SAGO_RCV_DT = dayjs(Popdata.SAGO_RCV_DT).format("YYYY-MM-DD");
    }
    if (Popdata.INJR_DEPT_NM1) {
      let valueContent = Popdata.INJR_DEPT_NM1.split(/[,\s]+/);
      INJRDEPT.value = valueContent;
      Popdata.INJR_DEPT_NM1 = valueContent[0];
      Popdata.INJR_DEPT_NM2 = valueContent[1];
      Popdata.INJR_DEPT_NM3 = valueContent[2];
    }
    if (Popdata.INJR_DEPT_CD1) {
      let valueContent = Popdata.INJR_DEPT_CD1.split(/[,\s]+/);
      Popdata.INJR_DEPT_CD1 = valueContent[0];
      Popdata.INJR_DEPT_CD2 = valueContent[1];
      Popdata.INJR_DEPT_CD3 = valueContent[2];
    }

    SagoSearch();
    checkFileId();
  }
);
</script>

<template>
  <v-card>
    <v-card-title>
      <IMenuTitle ref="menuTitle" @click-button="onButtonsClick" />
    </v-card-title>
    <!-- 인적사항 -->
    <v-card-text class="overflowY">
      <v-card-title class="my-2">
        <IGridTitle
          ref="grdTitle"
          :title="$t('인적사항 현황')"
          :button-list="['btnCreate', 'btnDelete']"
          @click-button="onButtonsClick($event.id, '인적사항현황')"
        >
          <template #editors />
        </IGridTitle>
      </v-card-title>

      <div class="popUp-input-Form">
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
      </div>

      <v-card-title class="my-2">
        <IGridTitle
          ref="grdTitle2"
          :title="$t('사고 개요')"
          :button-list="['btnUpdate']"
          @click-button="onButtonsClick($event.id, '사고개요')"
        >
          <template #editors />
        </IGridTitle>
      </v-card-title>

      <div class="popUp-input-Form">
        <!-- 발생일시 -->
        <div class="d-flex">
          <i-input
            readonly
            :label="$t('발생일자')"
            v-model="Popdata.OCCUR_DT"
            label-width="90px"
            type="Date"
            width="230px"
            margin="10px"
            required
          />
          <i-input
            readonly
            v-model="Popdata.OCCUR_TIME"
            @change="formatAndDisplayTime"
            :label="$t('')"
            label-width="60px"
            type="Text"
            width="100px"
            margin="10px"
          />
        </div>

        <!-- 재해조직/ 책임조직 -->
        <div class="d-flex align-center">
          <i-input
            disabled
            :label="$t('재해조직')"
            label-width="90px"
            type="Text"
            width="230px"
            margin="10px"
            append-inner-icon="mdi-magnify"
            required
            v-model="Popdata.INJR_DEPT_NM"
            @click:appendInner="deptPopupOpen('INJR')"
          />
          <v-btn
            disabled
            class="mr-3"
            size="x-small"
            @click="plus"
            icon="mdi-plus"
          />

          <div v-for="(item, i) in INJRDEPT" class="d-flex align-center">
            <i-input
              readonly
              :label="$t('재해조직')"
              label-width="50px"
              type="Text"
              width="190px"
              margin="0px"
              append-inner-icon="mdi-magnify"
              v-model="Popdata[`INJR_DEPT_NM${i + 1}`]"
              @click:appendInner="deptPopupOpen(`INJR`, i + 1)"
              @click="deptPopupOpen(`INJR`, i + 1)"
            />
            <v-btn
              class="mr-3"
              size="x-small"
              @click="minus(item)"
              icon="mdi-minus"
            />
          </div>

          <i-input
            disabled
            :label="$t('책임조직')"
            label-width="90px"
            type="Text"
            width="230px"
            margin="10px"
            append-inner-icon="mdi-magnify"
            required
            v-model="Popdata.RESP_DEPT_NM"
            @click:appendInner="deptPopupOpen"
          />
        </div>
        <!-- 발생장소 -->
        <div class="d-flex">
          <i-input
            disabled
            :label="$t('발생장소')"
            label-width="90px"
            type="Text"
            width="300px"
            margin="10px"
            @click:appendInner="locationPopupOpen"
            append-inner-icon="mdi-magnify"
            required
            v-model="Popdata.SAGO_LOC_L_NM"
          />
          <i-input
            readonly
            :label="$t('')"
            label-width="60px"
            type="Text"
            width="100px"
            margin="10px"
            v-model="Popdata.SAGO_LOC_M_NM"
          />
          <i-input
            readonly
            :label="$t('')"
            label-width="60px"
            type="Text"
            width="100px"
            margin="10px"
            v-model="Popdata.SAGO_LOC_S_NM"
          />
          <i-input
            readonly
            :label="$t('')"
            label-width="60px"
            type="Text"
            width="150px"
            margin="10px"
            v-model="Popdata.SAGO_LOC_DTL"
          />
        </div>
        <!--사고형태 / 구급차이용여부 -->
        <div class="d-flex">
          <i-input
            disabled
            :label="$t('사고형태')"
            label-width="90px"
            type="Text"
            width="230px"
            margin="10px"
            @click:appendInner="acdtOpen"
            append-inner-icon="mdi-magnify"
            required
            v-model="Popdata.SAGO_DIV_L_NM"
          />
          <i-input
            :label="$t('')"
            label-width="60px"
            type="Text"
            width="100px"
            margin="10px"
            readonly
            v-model="Popdata.SAGO_DIV_M_NM"
          />
          <i-input
            :label="$t('')"
            label-width="60px"
            type="Text"
            width="100px"
            margin="10px"
            readonly
            v-model="Popdata.SAGO_DIV_S_NM"
          />
          <i-select
            readonly
            :label="$t('구급차이용 여부')"
            label-width="100px"
            type="Text"
            width="250px"
            margin="10px"
            v-model="Popdata.GUGUP_USE"
            :items="codeList.GUGUP_USE"
            item-value="COD"
            item-title="TXT"
            required
          />
        </div>
        <!-- 사고접수일/양식구분/책임구분 -->
        <div class="d-flex">
          <i-input
            readonly
            :label="$t('사고접수일')"
            label-width="90px"
            type="Date"
            width="230px"
            margin="10px"
            required
            v-model="Popdata.SAGO_RCV_DT"
          />

          <ILabel :label="$t('양식구분')" style="padding: 0" class="mr-4">
            <template #editor="editorProps">
              <v-radio-group disabled inline v-model="Popdata.FORM_DIV">
                <v-radio label="직영" value="J"></v-radio>
                <v-radio label="협력사" value="H"></v-radio>
              </v-radio-group>
            </template>
          </ILabel>
          <i-select
            readonly
            :label="$t('책임구분')"
            label-width="100px"
            type="Text"
            width="230px"
            margin="10px"
            :items="codeList.ChekIm"
            item-value="COD"
            item-title="TXT"
            required
            v-model="Popdata.RESPON_DIV"
          />
        </div>

        <!-- 공정명/ 기인물 /위험성재평가-->
        <div class="d-flex">
          <i-select
            readonly
            :label="$t('공정명')"
            label-width="90px"
            type="Text"
            width="230px"
            margin="10px"
            :items="codeList.gongjong"
            v-model="Popdata.PROCESS_CD"
            item-value="COD"
            item-title="TXT"
            required
          />
          <i-input
            disabled
            :label="$t('기인물')"
            label-width="90px"
            type="Text"
            width="230px"
            margin="10px"
            @click:appendInner="causePopupPopupOpen"
            append-inner-icon="mdi-magnify"
            readonly
            required
            v-model="Popdata.GIINMUL1_NM"
          />
          <i-input
            readonly
            :label="$t('')"
            label-width="60px"
            type="Text"
            width="100px"
            margin="10px"
            v-model="Popdata.GIINMUL2_NM"
          />
          <ILabel
            :label="$t('위험성재평가')"
            style="padding: 0"
            class="mr-4"
            :required="true"
          >
            <template #editor="editorProps">
              <v-radio-group disabled inline v-model="Popdata.WIHEOM_YN">
                <v-radio label="필요" value="Y"></v-radio>
                <v-radio label="불필요" value="N"></v-radio>
              </v-radio-group>
            </template>
          </ILabel>
        </div>
        <!-- 작업지시서/ 작업표쥰 -->
        <div class="d-flex">
          <i-select
            :label="$t('작업지시서')"
            label-width="90px"
            type="Text"
            width="230px"
            margin="10px"
            :items="codeList.WRK"
            readonly
            v-model="Popdata.WRK"
            item-value="COD"
            item-title="TXT"
          />

          <i-select
            :label="$t('작업표준')"
            label-width="90px"
            type="Text"
            width="400px"
            margin="10px"
            required
            readonly
            :items="codeList.WRK_STD"
            v-model="Popdata.WRK_STD_NM"
            item-value="COD"
            item-title="TXT"
          />

          <v-checkbox
            @click="checkBoxWRK_STD_NEW()"
            v-model="Popdata.WRK_STD_NEW"
            disabled
            :label="$t('신규작성필요')"
          />
        </div>

        <!-- 사고내용 -->
        <div class="d-flex">
          <ILabel
            :label="$t('사고 개요')"
            :required="true"
            style="padding: 0; width: 90px"
          >
            <template #editor="editorProps" />
          </ILabel>
          <v-textarea v-model="Popdata.SAGO_GAEYO" readonly class="mt-2" />
        </div>
      </div>

      <v-card-title class="my-2">
        <IGridTitle :title="$t('사고 상황 사진')">
          <template #editors />
        </IGridTitle>
      </v-card-title>

      <div class="popUp-input-Form">
        <div class="d-flex justify-space-between">
          <div class="fileDiv">
            <IUploadImageSingle
              @selected="selected($event, 1)"
              @deleted="deleted($event, 1)"
              ref="fileUpload1"
              style="height: 400px"
            />
            <v-textarea
              :readonly="readonly1"
              class="mt-2"
              rows="2"
              v-model="Popdata.PIC_1_DESC"
              placeholder="사진설명"
            />
          </div>
          <div class="fileDiv">
            <IUploadImageSingle
              ref="fileUpload2"
              @selected="selected($event, 2)"
              @deleted="deleted($event, 2)"
              style="height: 400px"
            />
            <v-textarea
              :readonly="readonly2"
              class="mt-2"
              rows="2"
              v-model="Popdata.PIC_2_DESC"
              placeholder="사진설명"
            />
          </div>
          <div class="fileDiv">
            <IUploadImageSingle
              ref="fileUpload3"
              @selected="selected($event, 3)"
              @deleted="deleted($event, 3)"
              style="height: 400px"
            />
            <v-textarea
              :readonly="readonly3"
              class="mt-2"
              v-model="Popdata.PIC_3_DESC"
              rows="2"
              placeholder="사진설명"
            />
          </div>
        </div>
      </div>

      <v-card-title class="my-2">
        <IGridTitle
          ref="grdTitle3"
          :title="$t('재해원인 및 예방대책(근본적 원인분석을 통한 사고 분석)')"
          :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
          @click-button="onButtonsClick($event.id, '재해원인')"
        >
          <template #editors />
        </IGridTitle>
      </v-card-title>

      <div class="popUp-input-Form">
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
      </div>
      <AcdtPopup ref="acdtPopupRef" @selectedArr="selectedArr" />
      <LocationPopup @selectedArr="selectedLocation" ref="locationPopup" />
      <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
      <causePopup ref="CausePopup" @selectedArr="onCauseSelected" />
      
      <SAFAF0010ManPopUp @upDataRow="upDataRow" ref="ManPopUp" />
      <SAFAB0020DisasterPopUp ref="Disaster" @selectedArr="selectedDisaster" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.popUp-input-Form > div {
  margin: 10px 0;
}
.fileDiv {
  width: 420px;
}
</style>
