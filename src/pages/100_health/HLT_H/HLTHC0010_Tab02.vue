<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  computed,
  onBeforeMount,
  onBeforeUnmount,
} from "vue";
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  getCompanyList,
} from "@hiway/api/commonApi";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import Message from "@hiway/utils/notify";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@hiway/stores/user";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from "@/utils/saveFlowHelper";
import deleteFlowHelper from "@/utils/deleteFlowHelper";
import dayjs from "dayjs";
import EmpPopup from "@/components/popup/EmpPopup.vue";
import ApprovalPopup from "@/components/popup/ApprovalPopup.vue"; //결재
import HLTHC0010Popup02 from "./HLTHC0010Popup02.vue";
import HLTHC0010Popup03 from "./HLTHC0010Popup03.vue";

const props = defineProps({
  bsnsCd: String,
  deptCd: String,
  cmpnyCd: String,
  asgnCd: String,
  outYn: String,
  dutyYn: String,
  isAdmin: Number,
  userDiv: String,
  codeList: {},
});

const grdMain = ref(null);
const grdSub = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const empPopup = ref(null);
const hLTHC0010Popup02 = ref(null);
const hLTHC0010Popup03 = ref(null);
const priodYn = ref(true);
const approvalPopup = ref(null);
const suppliesDutyY = ref(true);
const suppliesDutyN = ref(true);
const duty = ref("Y");
const userDivYn = ref(null);
const menuTitle = ref(null);
const menuTitle01 = ref(null);
const menuTitle02 = ref(null);

const tab = ref("tab01");
const tab01 = ref();
const tab02 = ref();
const grdData = ref();

const areaDiv = ref(null);
let resizeObserver = null;

const codeList = reactive({
  STATUS: [
    { COD: "%", TXT: "전체" },
    { COD: " ", TXT: "미신청" },
    { COD: "3", TXT: "결재완료" },
  ],
  GRID_STATUS: [
    { COD: "%", TXT: "전체" },
    { COD: " ", TXT: "미신청" },
    { COD: "1", TXT: "신청중" },
    { COD: "2", TXT: "결재중" },
    { COD: "3", TXT: "결재완료" },
    { COD: "4", TXT: "확정완료" },
    { COD: "5", TXT: "반려" },
    { COD: "9", TXT: "지급완료" },
  ],
  PLACE_CD: [],
  GLASSES_KIND: [],
  GLASSES_MODEL: [],
  RECEIVE_PLACE_CD: [],
  ADD: [],
  REASON: [],
  USER_DIV: [
    { COD: "A", TXT: "직영" },
    { COD: "B", TXT: "사내협력사" },
  ],
});

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: "",
  YEAR: "",
  REQ_DIV: "A",
  REQ_CHA: "",
  REQ_CHA_NM: "",
  REQ_DT: "",
  EN_DT: "",
  STATUS: "%",
  DUTY_YN: "N",
});

const inputParam = reactive({
  EYESIGHT_PLACE_DUTY_Y: "",
  REASON_DUTY_Y: "",
  SUPPLIES_DUTY_Y: "",
  EYESIGHT_PLACE_DUTY_N: "",
  REASON_DUTY_N: "",
  SUPPLIES_DUTY_N: "",
});

const placeParam = reactive({
  MANAGER_EMP_NO: "",
  MANAGER_EMP_NM: "",
  MANAGER_TEL_NO: "",
  RECEIVE_EMP_NO: "",
  RECEIVE_EMP_NM: "",
  RECEIVE_TEL_NO: "",
  PLACE_CD: "",
  POPUP_USER: "",
});

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: {
      visible: false,
    },
  },
  fields: [
    {
      name: "rowCheck",
      fieldName: "checked",
      type: "data",
      width: 50,
      header: {
        text: " ", // 텍스트 대신 체크박스로 대체
        checkLocation: "left",
      },
      sortable: false,
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N",
      },
      editor: {
        type: "check",
        trueValues: "Y",
        falseValues: "N",
      },
      // styleCallback: function (grid, dataCell) {
      //   const dataRow = dataCell.index.dataRow;
      //   if (dataRow < 0) return;

      //   const dutyYn = grid.getValue(dataRow, "DUTY_YN");
      //   const cmpnyDiv = grid.getValue(dataRow, "CMPNY_DIV");

      //   const isEditable = !(dutyYn === "N" || cmpnyDiv === "320");

      //   const ret = {
      //     editable: true, // 항상 true 유지 → 회색 안 됨
      //   };

      //   if (!isEditable) {
      //     //ret.editor = null; // ✅ 체크 불가 처리 (UI는 회색 아님)
      //     ret.renderer = { type: "check", editable: false };
      //   } else {
      //     ret.renderer = { type: "check", editable: true };
      //   }

      //   return ret;
      // },
    },

    {
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      width: "200",
      editable: false,
      header: { text: t("소속") },
      styleName: "left-column",
    },
    {
      fieldName: "USER_DIV",
      dataType: "text",
      width: "80",
      editable: false,
      lookupDisplay: true,
      header: { text: t("직영구분") },
      styleName: "center-column",
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "80",
      editable: false,
      header: { text: t("사번") },
      styleName: "center-column",
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("이름") },
      styleName: "center-column",
    },
    {
      fieldName: "JOB_TIT_NM",
      dataType: "text",
      width: "100",
      editable: false,
      styleName: "center-column",
      header: {
        text: t("직위"),
      },
    },
    {
      fieldName: "UNT_DUTY_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직무") },
      styleName: "left-column",
    },
    {
      fieldName: "DUTY_YN",
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("대상여부(직무)") },
      styleName: "center-column",
    },
    {
      fieldName: "STATUS",
      dataType: "text",
      width: "70",
      editable: false,
      lookupDisplay: true,
      header: { text: t("신청상태") },
      styleName: "center-column",
      // displayCallback: function (grid, index, value) {
      //   return value === "0" ? "" : value;
      // },
    },
    {
      fieldName: "EYESIGHT_PLACE",
      dataType: "text",
      width: "200",
      header: {
        text: t("시력검사장소"),
      },
      lookupDisplay: true,
      styleName: "left-column editable_column",
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (
          ["2", "3", "4", "9"].includes(
            grid.getValue(dataCell.index.itemIndex, "STATUS")
          )
        ) {
          ret.editable = false;
        }
        return ret;
      },
      // styleCallback: function (grid, dataCell) {
      //   var ret = {};
      //   if (
      //     grid.getValue(dataCell.index.itemIndex, "DUTY_YN") === "N" ||
      //     grid.getValue(dataCell.index.itemIndex, "STATUS") === "4" ||
      //     grid.getValue(dataCell.index.itemIndex, "STATUS") === "9"
      //   ) {
      //     ret.editable = false;
      //   }
      //   return ret;
      // },
    },
    {
      fieldName: "GLASSES_VEND",
      dataType: "text",
      width: "200",
      header: {
        text: t("보안경 종류"),
        //styleName: "custom-header"
      },
      lookupDisplay: true,
      styleName: "left-column editable_column",
      // displayCallback: function (grid, index, value) {
      //   return value === "0" ? "" : value;
      // },
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (
          grid.getValue(dataCell.index.itemIndex, "DUTY_YN") === "N" ||
          ["2", "3", "4", "9"].includes(
            grid.getValue(dataCell.index.itemIndex, "STATUS")
          )
        ) {
          ret.editable = false;
        }
        return ret;
      },
      displayCallback: function (grid, index, value) {
        return value === "-" ? "" : value;
      },
    },
    {
      fieldName: "GLASSES_MODEL",
      dataType: "text",
      width: "150",
      editable: false,
      lookupDisplay: true,
      header: { text: t("보안경 모델") },
      styleName: "center-column",
      // displayCallback: function (grid, index, value) {
      //   return value === "0" ? "" : value;
      // },
    },
    {
      fieldName: "REASON",
      dataType: "text",
      width: "100",
      header: {
        text: t("신청 사유"),
      },
      lookupDisplay: true,
      styleName: "center-column editable_column",
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (
          ["2", "3", "4", "9"].includes(
            grid.getValue(dataCell.index.itemIndex, "STATUS")
          )
        ) {
          ret.editable = false;
        }
        return ret;
      },
    },
    {
      fieldName: "SUPPLIES",
      dataType: "text",
      width: "200",
      header: {
        text: t("추가지급"),
      },
      lookupDisplay: true,
      styleName: "left-column editable_column",
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (grid.getValue(dataCell.index.itemIndex, "REASON") === "09") {
          ret.editable = true;
        } else {
          ret.editable = false;
        }

        if (
          ["2", "3", "4", "9"].includes(
            grid.getValue(dataCell.index.itemIndex, "STATUS")
          )
        ) {
          ret.editable = false;
        }
        return ret;
      },
    },
    {
      fieldName: "RECEIVE_YN",
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("지급여부") },
      styleName: "center-column",
    },
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("비고") }, //미지급 사유
      styleName: "left-column",
    },
    {
      fieldName: "BE_REMARKS",
      dataType: "text",
      width: "40",
      editable: false,
      header: { text: t("지급 이력") },
      styleName: "center-column",
      button: "action",
      buttonVisibility: "always",
    },
    {
      fieldName: "REQ_CHA_DT",
      visible: false,
      header: { text: t("신청일자") },
    },
    {
      fieldName: "GLASSES_KIND",
      visible: false,
      header: { text: t("보안경 종류") },
    },
    {
      fieldName: "DUTY_COUNT",
      visible: false,
      header: { text: t("지급기준") },
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
      header: { text: t("사업장") },
    },
    {
      fieldName: "EYESIGHT_YN",
      visible: false,
      header: { text: t("시력검사여부") },
    },
    {
      fieldName: "VEND_NAME",
      visible: false,
      header: { text: t("납품업체") },
    },
    {
      fieldName: "YEAR",
      visible: false,
    },
    {
      fieldName: "REQ_DIV",
      visible: false,
    },
    {
      fieldName: "REQ_CHA",
      visible: false,
    },
    {
      fieldName: "BEAF",
      visible: false,
    },
    {
      fieldName: "REASON_B",
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    "rowCheck",
    "ASGN_FULL_NM",
    "USER_DIV",
    "EMP_NO",
    "EMP_NM",
    "JOB_TIT_NM",
    "UNT_DUTY_NM",
    "DUTY_YN",
    "BE_REMARKS",
    "STATUS",
    "EYESIGHT_PLACE",
    "REASON",
    "SUPPLIES",
    // "GLASSES_VEND",
    // "GLASSES_MODEL",
    "RECEIVE_YN",
    "REMARKS",
  ],
});

grdMainProps.columns = grdMainProps.fields;

const initCodeList = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_PLACE",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }),
    getCodeList("HHIIG30A"),
    getCodeList("HHIIG30C"),
    // commonSearchApi({
    //   queryId: "HLTHC0010_SEARCH_GLASSES",
    //   param: {
    //     CMPNY_DIV: userStore.cmpnyDiv,
    //   },
    // }),
    // commonSearchApi({
    //   queryId: "HLTHC0010_SEARCH_GLASSES_MODEL",
    //   param: {
    //     CMPNY_DIV: userStore.cmpnyDiv,
    //   },
    // }),
    commonSearchApi({
      queryId: "HLTHF0060_SEARCH_PLACE",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: props.bsnsCd,
      },
    }),
  ]);

  codeList.PLACE_CD = res[0].ORESULT_CUR;
  if (!codeList.PLACE_CD.some((item) => item.TXT === "")) {
    codeList.PLACE_CD.unshift({ TXT: "", COD: "" });
  }

  codeList.ADD = res[1].ORESULT_CUR;
  if (!codeList.ADD.some((item) => item.TXT === "")) {
    codeList.ADD.unshift({ TXT: "", COD: "" });
  }

  codeList.REASON = res[2].ORESULT_CUR;
  if (!codeList.REASON.some((item) => item.TXT === "")) {
    codeList.REASON.unshift({ TXT: "", COD: "" });
  }

  codeList.RECEIVE_PLACE_CD = res[3].ORESULT_CUR;

  // codeList.GLASSES_KIND = res[3].ORESULT_CUR;
  // if (!codeList.GLASSES_KIND.some((item) => item.TXT === "")) {
  //   codeList.GLASSES_KIND.unshift({ TXT: "", COD: "" });
  // }

  // codeList.GLASSES_MODEL = res[4].ORESULT_CUR;

  if (tab.value === "tab01") {
    grdMain.value.setBindingColumn(
      "EYESIGHT_PLACE",
      codeList.PLACE_CD,
      "COD",
      "TXT"
    );
    grdMain.value.setBindingColumn(
      "STATUS",
      codeList.GRID_STATUS,
      "COD",
      "TXT"
    );
    grdMain.value.setBindingColumn("REASON", codeList.REASON, "COD", "TXT");
    grdMain.value.setBindingColumn("SUPPLIES", codeList.ADD, "COD", "TXT");
    grdMain.value.setBindingColumn("USER_DIV", codeList.USER_DIV, "COD", "TXT");
  } else {
    grdSub.value.setBindingColumn(
      "EYESIGHT_PLACE",
      codeList.PLACE_CD,
      "COD",
      "TXT"
    );
    grdSub.value.setBindingColumn("STATUS", codeList.GRID_STATUS, "COD", "TXT");
    grdSub.value.setBindingColumn("REASON", codeList.REASON, "COD", "TXT");
    grdSub.value.setBindingColumn("SUPPLIES", codeList.ADD, "COD", "TXT");
    grdSub.value.setBindingColumn("USER_DIV", codeList.USER_DIV, "COD", "TXT");
  }
};

const getReqestPriod = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_03",
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
      },
    }),
  ]);
  return res[0].ORESULT_CUR;
};

const setReqestPriod = async (res) => {
  searchParam.YEAR = res[0].YEAR;
  searchParam.REQ_CHA = res[0].REQ_CHA;
  searchParam.REQ_CHA_NM = res[0].REQ_CHA + "차수";
  searchParam.EN_DT = dayjs(res[0].EN_DATE).format("YYYY-MM-DD");
};

const setLoad = async () => {
  await initCodeList();

  const res = await getReqestPriod();
  if (res != null && res.length > 0) {

    // if(dayjs().year().toString() === res[0].YEAR &&
    //    res[0].ST_DATE <=  dayjs().format("YYYYMMDD") &&
    //    res[0].EN_DATE >=  dayjs().format("YYYYMMDD")
    //   ){
    //   await setReqestPriod(res);
    // }else{
    //   priodYn.value = false;
    //   return false;
    // }
    await setReqestPriod(res);
  } else {
    priodYn.value = false;
    return false;
  }

  await setGridItem();
  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);
  priodYn.value = true;
  return true;
};

const reCodeList = (list) => {
  const newArray = list.map((item) => ({
    value: item.COD,
    text: item.TXT,
  }));

  return newArray;
};

const setGridItem = async () => {
  // grdMain.value
  //   .getGridView()
  //   .setColumnProperty(
  //     "GLASSES_VEND",
  //     "lookupData",
  //     reCodeList(codeList.GLASSES_KIND)
  //   );
  // grdMain.value.getGridView().setColumnProperty("GLASSES_VEND", "editor", {
  //   type: "dropdown",
  //   domainOnly: true,
  //   list: reCodeList(codeList.GLASSES_KIND),
  // });
  if (tab.value === "tab01") {
    grdMain.value
      .getGridView()
      .setColumnProperty(
        "EYESIGHT_PLACE",
        "lookupData",
        reCodeList(codeList.PLACE_CD)
      );
    grdMain.value.getGridView().setColumnProperty("EYESIGHT_PLACE", "editor", {
      type: "dropdown",
      domainOnly: true,
      list: reCodeList(codeList.PLACE_CD),
    });

    grdMain.value
      .getGridView()
      .setColumnProperty("REASON", "lookupData", reCodeList(codeList.REASON));
    grdMain.value.getGridView().setColumnProperty("REASON", "editor", {
      type: "dropdown",
      domainOnly: true,
      list: reCodeList(codeList.REASON),
    });

    grdMain.value
      .getGridView()
      .setColumnProperty("SUPPLIES", "lookupData", reCodeList(codeList.ADD));
    grdMain.value.getGridView().setColumnProperty("SUPPLIES", "editor", {
      type: "dropdown",
      domainOnly: true,
      list: reCodeList(codeList.ADD),
    });

    grdMain.value.getGridView().onShowEditor = function (grid, index) {
      if (index.column == "rowCheck") {
        return false;
      }
    };

    grdMain.value.getGridView().onEditCommit = function (
      grid,
      index,
      oldValue,
      newValue
    ) {
      setTimeout(() => {
        const fieldName = grid.getColumn(index.fieldIndex).fieldName;
        const itemIndex = index.itemIndex;
        const row = index.dataRow;
        const provider = grdMain.value.getDataProvider();

        if (fieldName === "checked") {
          if (provider.getValue(itemIndex, "checked") === "Y") {
            grdMain.value.getGridView().checkRow(itemIndex);
          } else {
            grdMain.value.getGridView().checkRow(itemIndex, false);
          }
        }

        if (
          fieldName === "GLASSES_VEND" ||
          fieldName === "EYESIGHT_PLACE" ||
          fieldName === "SUPPLIES" ||
          fieldName === "REASON"
        ) {
          provider.setValue(row, "checked", "Y");
        }

        if (fieldName === "REASON") {
          if (provider.getValue(row, "REASON") != "09")
            provider.setValue(row, "SUPPLIES", "");
        }

        if (fieldName === "GLASSES_VEND") {
          if (provider.getValue(row, "GLASSES_VEND") === "") {
            provider.setValue(row, "GLASSES_MODEL", "");
          } else {
            const shoes = provider.getValue(row, "GLASSES_VEND").split("-");
            const model = codeList.GLASSES_MODEL.find(
              (item) => item.COD === shoes[0]
            );
            provider.setValue(row, "GLASSES_KIND", shoes[0]);
            provider.setValue(row, "VEND_NAME", shoes[1]);
            provider.setValue(row, "GLASSES_MODEL", model.TXT);
          }
        }
      }, 0);
    };

    grdMain.value.getGridView().onCellButtonClicked = function (
      grid,
      index,
      column
    ) {
      const param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        EMP_NO: grdMain.value
          .getDataProvider()
          .getValue(index.dataRow, "EMP_NO"),
      };

      hLTHC0010Popup02.value.openPopup(param);
    };

    grdMain.value.getGridView().onColumnCheckedChanged = function (
      grid,
      column,
      checked
    ) {
      const dataProvider = grdMain.value.getDataProvider();
      var rowCount = dataProvider.getRowCount();

      if (checked) {
        dataProvider.beginUpdate();
        try {
          for (var i = 0; i < rowCount; i++) {
            if (dataProvider.getValue(i, "DUTY_YN") === "Y")
              dataProvider.setValue(i, column.fieldName, "Y");
          }
        } finally {
          dataProvider.endUpdate();
        }
      } else {
        dataProvider.beginUpdate();
        try {
          for (var i = 0; i < rowCount; i++) {
            dataProvider.setValue(i, column.fieldName, "N");
          }
        } finally {
          dataProvider.endUpdate();
        }
      }
    };
  } else {
    grdSub.value
      .getGridView()
      .setColumnProperty(
        "EYESIGHT_PLACE",
        "lookupData",
        reCodeList(codeList.PLACE_CD)
      );
    grdSub.value.getGridView().setColumnProperty("EYESIGHT_PLACE", "editor", {
      type: "dropdown",
      domainOnly: true,
      list: reCodeList(codeList.PLACE_CD),
    });

    grdSub.value
      .getGridView()
      .setColumnProperty("REASON", "lookupData", reCodeList(codeList.REASON));
    grdSub.value.getGridView().setColumnProperty("REASON", "editor", {
      type: "dropdown",
      domainOnly: true,
      list: reCodeList(codeList.REASON),
    });

    grdSub.value
      .getGridView()
      .setColumnProperty("SUPPLIES", "lookupData", reCodeList(codeList.ADD));
    grdSub.value.getGridView().setColumnProperty("SUPPLIES", "editor", {
      type: "dropdown",
      domainOnly: true,
      list: reCodeList(codeList.ADD),
    });

    grdSub.value.getGridView().onShowEditor = function (grid, index) {
      if (index.column == "rowCheck") {
        return false;
      }
    };

    grdSub.value.getGridView().onEditCommit = function (
      grid,
      index,
      oldValue,
      newValue
    ) {
      setTimeout(() => {
        const fieldName = grid.getColumn(index.fieldIndex).fieldName;
        const itemIndex = index.itemIndex;
        const row = index.dataRow;
        const provider = grdSub.value.getDataProvider();

        if (fieldName === "checked") {
          if (provider.getValue(row, "checked") === "Y") {
            grdSub.value.getGridView().checkRow(row);
          } else {
            grdSub.value.getGridView().checkRow(row, false);
          }
        }

        if (
          fieldName === "GLASSES_VEND" ||
          fieldName === "EYESIGHT_PLACE" ||
          fieldName === "SUPPLIES"
        ) {
          provider.setValue(row, "checked", "Y");
        }

        if (fieldName === "REASON") {
          if (provider.getValue(row, "REASON") != "09")
            provider.setValue(row, "SUPPLIES", "");
        }

        if (fieldName === "GLASSES_VEND") {
          if (provider.getValue(row, "GLASSES_VEND") === "") {
            provider.setValue(row, "GLASSES_MODEL", "");
          } else {
            const shoes = provider.getValue(row, "GLASSES_VEND").split("-");
            const model = codeList.GLASSES_MODEL.find(
              (item) => item.COD === shoes[0]
            );
            provider.setValue(row, "GLASSES_KIND", shoes[0]);
            provider.setValue(row, "VEND_NAME", shoes[1]);
            provider.setValue(row, "GLASSES_MODEL", model.TXT);
          }
        }
      }, 0);
    };

    grdSub.value.getGridView().onCellButtonClicked = function (
      grid,
      index,
      column
    ) {
      const param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        EMP_NO: grdSub.value
          .getDataProvider()
          .getValue(index.dataRow, "EMP_NO"),
      };

      hLTHC0010Popup02.value.openPopup(param);
    };

    grdSub.value.getGridView().onColumnCheckedChanged = function (
      grid,
      column,
      checked
    ) {
      const dataProvider = grdSub.value.getDataProvider();
      var rowCount = dataProvider.getRowCount();

      if (checked) {
        dataProvider.beginUpdate();
        try {
          for (var i = 0; i < rowCount; i++) {
            if (dataProvider.getValue(i, "DUTY_YN") === "Y")
              dataProvider.setValue(i, column.fieldName, "Y");
          }
        } finally {
          dataProvider.endUpdate();
        }
      } else {
        dataProvider.beginUpdate();
        try {
          for (var i = 0; i < rowCount; i++) {
            dataProvider.setValue(i, column.fieldName, "N");
          }
        } finally {
          dataProvider.endUpdate();
        }
      }
    };
  }

  // grdMain.value.getGridView().onCellEdited = function (grid, itemIndex, row, field) {
  //    console.log('Edit done! at ' + itemIndex + ', ' + field);
  // }
};

onMounted(async () => {
  // 최초 계산
  // updateAreaHeight();

  // 윈도우 리사이즈 대응
  // window.addEventListener("resize", updateAreaHeight);

  // 요소 내부 변화(예: 내용이 동적으로 바뀜)도 자동 감지하려면 ResizeObserver 사용
  // if (window.ResizeObserver) {
  //   resizeObserver = new ResizeObserver(updateAreaHeight);
  //   resizeObserver.observe(areaDiv.value);
  // }
  //menuTitle.value.visibleBtn("btnReqApply", true);
  await nextTick();

  console.log('asdadawd : ', tab.value)

  if(props.userDiv === 'A'){
    if(tab.value === "tab01"){
      menuTitle01.value.disableBtn("btnReqApply", false);
      menuTitle01.value.visibleBtn("btnReqApply", true);
    }else{
      menuTitle02.value.disableBtn("btnReqApply", false);
      menuTitle02.value.visibleBtn("btnReqApply", true);
    }
  }else{
    if(tab.value === "tab01"){
      menuTitle01.value.disableBtn("btnReqApply", true);
      menuTitle01.value.visibleBtn("btnReqApply", false);
    }else{
      menuTitle02.value.disableBtn("btnReqApply", true);
      menuTitle02.value.visibleBtn("btnReqApply", false);
    }
  }
  
  if (tab.value === "tab01") {
    grdMain.value.getGridView().filterPanel.visible = true;
  } else {
    grdSub.value.getGridView().filterPanel.visible = true;
  }
  // grdMain.value.getGridView().filterPanel.visible = true;
  // grdSub.value.getGridView().filterPanel.visible = true;
});

onBeforeUnmount(() => {
  // window.removeEventListener("resize", updateAreaHeight);
  // if (resizeObserver) {
  //   resizeObserver.disconnect();
  // }
});

const beforeSave = () => {
  if (placeParam.PLACE_CD === "") {
    Message.warn(t("수령장소를 선택해주세요."));
    return false;
  }

  if (placeParam.MANAGER_EMP_NO === "") {
    Message.warn(t("담당자를 선택해주세요."));
    return false;
  }

  if (placeParam.RECEIVE_EMP_NO === "") {
    Message.warn(t("수령자를 선택해주세요."));
    return false;
  }

  return true;
};

const saveData = () => {
  let temp = null;

  let saveParam = [];
  let saveData = {
    CMPNY_DIV: props.cmpnyCd,
    REQ_DIV: searchParam.REQ_DIV,
    BSNS_CD: props.bsnsCd,
    DEPT_CD: props.deptCd,
    ASGN_CD: props.asgnCd,
    MANAGER_EMP_NO: placeParam.MANAGER_EMP_NO,
    RECEIVE_EMP_NO: placeParam.RECEIVE_EMP_NO,
    RECEIVE_PLACE: placeParam.PLACE_CD,
    USER_ID: userStore.userId,
  };
  saveParam.push(saveData);

  temp = commonExecuteApi({
    queryId: "HLTHC0010_SAVE_RECEIVE",
    list: saveParam,
  });
  return temp;
};

//인원팝업 오픈 이벤트
const openEmpPopup = (user) => {
  placeParam.POPUP_USER = user;
  empPopup.value.openPopup({
    readonly: false,
    CMPNY_DIV_D: true,
    FLAG_D: true,
    BSNS_CD_D: true,
    DEPT_CD_D: true,
    BSNS_CD: props.bsnsCd,
    DEPT_CD: props.deptCd,
  });
};

const onEmpSelected = async (row) => {
  if (placeParam.POPUP_USER === "M") {
    placeParam.MANAGER_EMP_NO = row.EMP_NO;
    placeParam.MANAGER_EMP_NM = row.EMP_NM;
    placeParam.MANAGER_TEL_NO = row.TEL_NO;

    if (placeParam.RECEIVE_EMP_NO === "") {
      placeParam.RECEIVE_EMP_NO = row.EMP_NO;
      placeParam.RECEIVE_EMP_NM = row.EMP_NM;
      placeParam.RECEIVE_TEL_NO = row.TEL_NO;
    }
  } else {
    placeParam.RECEIVE_EMP_NO = row.EMP_NO;
    placeParam.RECEIVE_EMP_NM = row.EMP_NM;
    placeParam.RECEIVE_TEL_NO = row.TEL_NO;
  }
};

const selectedData = async (data) => {
  console.log("asdqawdq : ", data);
  if (duty.value == "Y") {
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true);

    for (let rowIdx of checkedRows) {
      grdMain.value
        .getDataProvider()
        .setValue(rowIdx, "EYESIGHT_PLACE", data.EYESIGHT_PLACE);
      grdMain.value.getDataProvider().setValue(rowIdx, "REASON", data.REASON);
      grdMain.value
        .getDataProvider()
        .setValue(rowIdx, "SUPPLIES", data.SUPPLIES);
    }
  } else {
    let checkedRows = grdSub.value.getGridView().getCheckedRows(true);

    for (let rowIdx of checkedRows) {
      grdSub.value
        .getDataProvider()
        .setValue(rowIdx, "EYESIGHT_PLACE", data.EYESIGHT_PLACE);
      grdSub.value.getDataProvider().setValue(rowIdx, "REASON", data.REASON);
      grdSub.value
        .getDataProvider()
        .setValue(rowIdx, "SUPPLIES", data.SUPPLIES);
    }
  }
};

const searchData = async () => {
  if (tab.value === "tab01") {
    grdMain.value.getDataProvider().clearRows();
  } else {
    grdSub.value.getDataProvider().clearRows();
  }
  grdData.value = [];

  await initCodeList();

  placeParam.PLACE_CD = "";
  placeParam.MANAGER_EMP_NO = "";
  placeParam.MANAGER_EMP_NM = "";
  placeParam.MANAGER_TEL_NO = "";
  placeParam.RECEIVE_EMP_NO = "";
  placeParam.RECEIVE_EMP_NM = "";
  placeParam.RECEIVE_TEL_NO = "";

  const res = await Promise.all([
    getReceivePlace(),
    searchDatasY(),
    searchDatasN(),
  ]); //getReceivePlace(),

  if (!res[0][0].ORESULT_CUR[0]) {
    Message.warn(t("수령정보를 등록해주세요."));
    return false;
  }

  if (res[0] != null && res[0].length > 0) {
    placeParam.MANAGER_EMP_NO = res[0][0].ORESULT_CUR[0].MANAGER_EMP_NO;
    placeParam.MANAGER_EMP_NM = res[0][0].ORESULT_CUR[0].MANAGER_EMP_NM;
    placeParam.MANAGER_TEL_NO = res[0][0].ORESULT_CUR[0].MANAGER_TEL_NO;
    placeParam.RECEIVE_EMP_NO = res[0][0].ORESULT_CUR[0].RECEIVE_EMP_NO;
    placeParam.RECEIVE_EMP_NM = res[0][0].ORESULT_CUR[0].RECEIVE_EMP_NM;
    placeParam.RECEIVE_TEL_NO = res[0][0].ORESULT_CUR[0].RECEIVE_TEL_NO;
    placeParam.PLACE_CD = res[0][0].ORESULT_CUR[0].RECEIVE_PLACE;
  }

  if (tab.value === "tab01") {
    await grdMain.value.getDataProvider().setRows(res[1].ORESULT_CUR);
  } else {
    await grdSub.value.getDataProvider().setRows(res[2].ORESULT_CUR);
  }

  grdData.value.push(res[1].ORESULT_CUR);
  grdData.value.push(res[2].ORESULT_CUR);

  // await grdMain.value.getDataProvider().setRows(res[1].ORESULT_CUR);
  // await grdSub.value.getDataProvider().setRows(res[2].ORESULT_CUR);

  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);
};

const getReceivePlace = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_05",
      param: {
        CMPNY_DIV: props.cmpnyCd,
        YEAR: searchParam.YEAR,
        REQ_DIV: searchParam.REQ_DIV,
        REQ_CHA: searchParam.REQ_CHA,
        BSNS_CD: props.bsnsCd,
        DEPT_CD: props.deptCd,
        ASGN_CD: props.asgnCd,
      },
    }),
  ]);

  return res;
};

const searchDatasY = async () => {
  return commonSearchApi({
    queryId: "HLTHC0010_SEARCH_02",
    param: {
      CMPNY_DIV: props.cmpnyCd,
      USER_DIV: props.userDiv,
      DEPT_CD: props.deptCd,
      ASGN_CD: props.asgnCd,
      YEAR: searchParam.YEAR,
      REQ_DIV: searchParam.REQ_DIV,
      REQ_CHA: searchParam.REQ_CHA,
      REQ_DT: "",
      STATUS: searchParam.STATUS,
      DUTY_YN: "Y",
      ADMIN: props.isAdmin.toString(),
    },
  });
};

const searchDatasN = async () => {
  return commonSearchApi({
    queryId: "HLTHC0010_SEARCH_02",
    param: {
      CMPNY_DIV: props.cmpnyCd,
      USER_DIV: props.userDiv,
      DEPT_CD: props.deptCd,
      ASGN_CD: props.asgnCd,
      YEAR: searchParam.YEAR,
      REQ_DIV: searchParam.REQ_DIV,
      REQ_CHA: searchParam.REQ_CHA,
      REQ_DT: "",
      STATUS: searchParam.STATUS,
      DUTY_YN: "N",
      ADMIN: props.isAdmin.toString(),
    },
  });
};

const saveGlassesData = async (dutyYn) => {
  new saveFlowHelper(vm, t)
    .setBefore(() => beforeGlassesSave(dutyYn))
    .setQuery(() => saveGlassesDatas(dutyYn))
    .setAfter((res) => afterGlassesSave(res, dutyYn))
    .run();
};

const getCustomCheckedRows = async (dutyYn) => {
  let dataProvider;

  if (dutyYn === "Y") {
    dataProvider = grdMain.value.getDataProvider();
  } else {
    dataProvider = grdSub.value.getDataProvider();
  }

  const rowCount = dataProvider.getRowCount();
  const checkedIndexes = [];

  for (let i = 0; i < rowCount; i++) {
    const value = dataProvider.getValue(i, "checked");
    if (value === "Y") {
      // || value === true
      checkedIndexes.push(i); // ✅ 인덱스만 push
    }
  }
  return checkedIndexes;
};

const beforeGlassesSave = async (dutyYn) => {
  let checkedData = await getCustomCheckedRows(dutyYn);
  if (checkedData.length === 0) {
    Message.warn(t("저장할 데이터를 선택해주세요."));
    return false;
  }

  let provider;

  if (dutyYn === "Y") {
    provider = grdMain.value.getDataProvider();
    
    for (let index of checkedData) {
      if (
        provider.getValue(
          index,
          "EYESIGHT_PLACE"
        ) === "" ||
        provider.getValue(
          index,
          "EYESIGHT_PLACE"
        ) === null
      ) {
        Message.warn(t("시력검사장소를 선택해주세요."));
        grdMain.value
          .getGridView()
          .setCurrent({ dataRow: index, column: "EYESIGHT_PLACE" });
        grdMain.value.getGridView().setFocus(true);
        return false;
      }

      if (
        provider.getValue(
          index,
          "REASON"
        ) === "" ||
        provider.getValue(
          index,
          "REASON"
        ) === null
      ) {
        Message.warn(t("신청사유를 선택해주세요."));
        grdMain.value
          .getGridView()
          .setCurrent({ dataRow: index, column: "REASON" });
        grdMain.value.getGridView().setFocus(true);
        return false;
      }

      if (
        Number(
          provider.getValue(
            index,
            "STATUS"
          )
        ) >= 2 &&
        Number(
          provider.getValue(
            index,
            "STATUS"
          )
        ) != 5
      ) {
        Message.warn(t("신청 이후에는 수정 할 수 없습니다."));
        grdMain.value
          .getGridView()
          .setCurrent({ dataRow: index, column: "STATUS" });
        grdMain.value.getGridView().setFocus(true);
        return false;
      }

      // console.log('index : ', index)

      // let dataRow = grdMain.value.getGridView().getDataRow(index)

      // var dataRow = gridView.getDataRow(0)
      // dataProvider.getJsonRow(dataRow)
      
      if (provider.getValue(index,"REASON") === '09' &&
          provider.getValue(index,"BEAF") === 'N') {
        Message.warn(t("이번 년도 정기신청 내역이 존재합니다. 정기신청을 진행할 수 없습니다."));
        grdMain.value
          .getGridView()
          .setCurrent({ dataRow: index, column: "EYESIGHT_PLACE" });
        grdMain.value.getGridView().setFocus(true);
        return false;
      }
    }
  } else {
    provider = grdSub.value.getDataProvider();
    for (let index of checkedData) {
      if (
        provider.getValue(
          index,
          "EYESIGHT_PLACE"
        ) === "" ||
        provider.getValue(
          index,
          "EYESIGHT_PLACE"
        ) === null
      ) {
        Message.warn(t("시력검사장소를 선택해주세요."));
        grdSub.value
          .getGridView()
          .setCurrent({ dataRow: index, column: "EYESIGHT_PLACE" });
        grdSub.value.getGridView().setFocus(true);
        return false;
      }

      if (
        provider.getValue(
          index,
          "REASON"
        ) === "" ||
        provider.getValue(
          index,
          "REASON"
        ) === null
      ) {
        Message.warn(t("신청사유를 선택해주세요."));
        grdSub.value
          .getGridView()
          .setCurrent({ dataRow: index, column: "REASON" });
        grdSub.value.getGridView().setFocus(true);
        return false;
      }

      if (
        Number(
          provider.getValue(
            index,
            "STATUS"
          )
        ) >= 2 &&
        Number(
          provider.getValue(
            index,
            "STATUS"
          )
        ) != 5
      ) {
        Message.warn(t("신청 이후에는 수정 할 수 없습니다."));
        grdSub.value
          .getGridView()
          .setCurrent({ dataRow: index, column: "STATUS" });
        grdSub.value.getGridView().setFocus(true);
        return false;
      }

      if (provider.getValue(index,"REASON") === '09' &&
          provider.getValue(index,"BEAF") === 'N') {
        Message.warn(t("이번 년도 정기신청 내역이 존재합니다. 정기신청을 진행할 수 없습니다."));
        grdSub.value
          .getGridView()
          .setCurrent({ dataRow: index, column: "GLASSES_VEND" });
        grdSub.value.getGridView().setFocus(true);
        return false;
      }
    }
  }

  // for (let index of checkedData) {
  //   if (
  //     (
  //       provider.getValue(
  //         grdMain.value.getGridView().getDataRow(index),
  //         "EYESIGHT_PLACE"
  //       ) === "") ||
  //     provider.getValue(
  //       grdMain.value.getGridView().getDataRow(index),
  //       "EYESIGHT_PLACE"
  //     ) === null
  //   ) {
  //     Message.warn(t("시력검사장소를 선택해주세요."));
  //     grdMain.value
  //       .getGridView()
  //       .setCurrent({ dataRow: index, column: "EYESIGHT_PLACE" });
  //     grdMain.value.getGridView().setFocus(true);
  //     return false;
  //   }

  //   if (
  //     (Number(provider.getValue(grdMain.value.getGridView().getDataRow(index),"STATUS"))
  //       >= 2 )
  //   ) {
  //     Message.warn(t("신청 이후에는 수정 할 수 없습니다."));
  //     grdMain.value
  //       .getGridView()
  //       .setCurrent({ dataRow: index, column: "STATUS" });
  //     grdMain.value.getGridView().setFocus(true);
  //     return false;
  //   }
  // }
  return true;
};

const saveGlassesDatas = (dutyYn) => {
  let checkedRows;

  if (dutyYn === "Y") {
    checkedRows = grdMain.value.getGridView().getCheckedRows(true);
  } else {
    checkedRows = grdSub.value.getGridView().getCheckedRows(true);
  }

  let saveParam = [];
  for (let rowIdx of checkedRows) {
    let data;

    if (dutyYn === "Y") {
      data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    } else {
      data = grdSub.value.getDataProvider().getJsonRow(rowIdx);
    }

    let saveData = {
      CMPNY_DIV: searchParam.CMPNY_DIV,
      YEAR: searchParam.YEAR,
      REQ_DIV: searchParam.REQ_DIV,
      REQ_CHA: searchParam.REQ_CHA,
      EMP_NO: data.EMP_NO,
      BSNS_CD: props.bsnsCd,
      DEPT_CD: props.deptCd,
      DIVISION: "B",
      GLASSES_KIND: data.GLASSES_KIND,
      GLASSES_MODEL: data.GLASSES_MODEL,
      GLASSES_COUNT: data.GLASSES_COUNT,
      DUTY_YN: data.DUTY_YN,
      USER_DIV: data.USER_DIV,
      EYESIGHT_YN: data.EYESIGHT_YN,
      EYESIGHT_PLACE: data.EYESIGHT_PLACE,
      REASON: data.REASON,
      SUPPLIES: data.SUPPLIES,
      VEND_NAME: data.VEND_NAME,
      USER_ID: userStore.userId,
    };
    saveParam.push(saveData);
  }

  return commonExecuteApi({
    queryId: "HLTHC0010_SAVE_01",
    list: saveParam,
  });
};

const afterGlassesSave = async (res, dutyYn) => {
  await searchData();
  // if (dutyYn === "Y") {
  //   const gridView = grdMain.value.getGridView();
  //   const checkedRows = gridView.getCheckedRows(true);

  //   // for (let rowIdx of checkedRows) {
  //   //   grdMain.value.getDataProvider().setValue(rowIdx, "STATUS", "1");
  //   // }
  //   if (res.list[0].USER_DIV === "A") {
  //     grdMain.value
  //       .getDataProvider()
  //       .setValue(gridView.getCurrent().itemIndex, "STATUS", "1");
  //   } else {
  //     grdMain.value
  //       .getDataProvider()
  //       .setValue(gridView.getCurrent().itemIndex, "STATUS", "3");
  //   }
  //   uncheckAll(dutyYn);
  // } else {
  //   const gridView = grdSub.value.getGridView();
  //   const checkedRows = gridView.getCheckedRows(true);

  //   // for (let rowIdx of checkedRows) {
  //   //   grdSub.value.getDataProvider().setValue(rowIdx, "STATUS", "1");
  //   // }
  //   if (res.list[0].USER_DIV === "A") {
  //     grdSub.value
  //       .getDataProvider()
  //       .setValue(gridView.getCurrent().itemIndex, "STATUS", "1");
  //   } else {
  //     grdSub.value
  //       .getDataProvider()
  //       .setValue(gridView.getCurrent().itemIndex, "STATUS", "3");
  //   }
  //   uncheckAll(dutyYn);
  // }
};

const uncheckAll = async (dutyYn) => {
  let dataProvider;
  let grdView;
  if (dutyYn === "Y") {
    dataProvider = grdMain.value.getDataProvider();
    grdView = grdMain.value.getGridView();
  } else {
    dataProvider = grdSub.value.getDataProvider();
    grdView = grdSub.value.getGridView();
  }

  const rowCount = dataProvider.getRowCount();

  for (let i = 0; i < rowCount; i++) {
    dataProvider.setValue(i, "checked", "N");
    grdView.checkRow(i, false);
  }
};

const cancelApllication = async (dutyYn) => {

  if(props.isAdmin === 3){
    if (!priodYn.value) {
        Message.warn(t("정기신청 기간이 아닙니다."));
        return;
      }

      new deleteFlowHelper(vm, t)
        .setBefore(() => beforeDelete(dutyYn))
        .setQuery(async () => await deleteData(dutyYn))
        .setAfter(afterDelete)
        .run();
  }else if(disabled === 'A'){
    if (props.isAdmin <= 0) {
      return Message.warn(
        t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
      );
    }

    const isIncluded = props.codeList.isSearchAdmin.some(
      (item) => item.DEPT_CD === props.asgnCd
    );

    if (isIncluded || props.isAdmin == 2) {
      if (!priodYn.value) {
        Message.warn(t("정기신청 기간이 아닙니다."));
        return;
      }

      new deleteFlowHelper(vm, t)
        .setBefore(() => beforeDelete(dutyYn))
        .setQuery(async () => await deleteData(dutyYn))
        .setAfter(afterDelete)
        .run();
    }
  }else{
    if (!priodYn.value) {
      Message.warn(t("정기신청 기간이 아닙니다."));
      return;
    }

    new deleteFlowHelper(vm, t)
      .setBefore(() => beforeDelete(dutyYn))
      .setQuery(async () => await deleteData(dutyYn))
      .setAfter(afterDelete)
      .run();
  }
  

  

  
};

const beforeDelete = async (dutyYn) => {
  //let checkedData = grdMain.value.getGridView().getCheckedRows(true);
  let checkedData = await getCustomCheckedRows(dutyYn);
  //console.log('checkedData : ', checkedData)
  if (checkedData.length === 0) {
    Message.warn(t("신청취소 할 데이터를 선택해주세요."));

    return false;
  }
  let provider;
  if (dutyYn === "Y") {
    provider = grdMain.value.getDataProvider();
  }else{
    provider = grdSub.value.getDataProvider();
  }

  for (let itemIndex of checkedData) {
    if (
      Number(
        provider.getValue(
          itemIndex,
          "STATUS"
        )
      ) >= 2 &&
      props.userDiv != 'B'
    ) {
      Message.warn(t("결재상신 이후에는 신청취소를 할 수 없습니다."));
      return false;
    }
  }

  return true;
};

const deleteData = async (dutyYn) => {
  let temp = null;
  let checkedRows;
  if (dutyYn === "Y") {
    checkedRows = grdMain.value.getGridView().getCheckedRows(true);
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
      let deleteParam = [
        {
          CMPNY_DIV: data.CMPNY_DIV,
          YEAR: data.YEAR,
          REQ_DIV: data.REQ_DIV,
          REQ_CHA: data.REQ_CHA,
          EMP_NO: data.EMP_NO,
          USER_DIV: data.USER_DIV,
          USER_ID: userStore.userId,
        },
      ];
      temp = commonExecuteApi({
        queryId: "HLTHC0010_DELETE_01",
        list: deleteParam,
      });
    }
  } else {
    checkedRows = grdSub.value.getGridView().getCheckedRows(true);
    for (let rowIdx of checkedRows) {
      let data = grdSub.value.getDataProvider().getJsonRow(rowIdx);
      let deleteParam = [
        {
          CMPNY_DIV: data.CMPNY_DIV,
          YEAR: data.YEAR,
          REQ_DIV: data.REQ_DIV,
          REQ_CHA: data.REQ_CHA,
          EMP_NO: data.EMP_NO,
          USER_DIV: data.USER_DIV,
          USER_ID: userStore.userId,
        },
      ];
      temp = commonExecuteApi({
        queryId: "HLTHC0010_DELETE_01",
        list: deleteParam,
      });
    }
  }

  return temp;
};

const afterDelete = async () => {
  await searchData();
};

const btnApproval = async (dutyYn) => {
  const before = await beforeApproval(dutyYn);

  if (!before) return;

  const res = await searchApproval(dutyYn)
  // console.log('??? : ',res[0].ORESULT_CUR)
  if(res[0].ORESULT_CUR.length){
    await afterApproval(res[0], dutyYn);
  }else{
    Message.warn(t("결재대상자 조회 오류, 관리자에게 문의해주세요."));
    return false;
  }
};

const beforeApproval = async (dutyYn) => {
  let rowCnt;
  let provider;

  if (dutyYn === "Y") {
    provider = grdMain.value.getDataProvider();
    rowCnt = provider.getRowCount();
  } else {
    provider = grdSub.value.getDataProvider();
    rowCnt = provider.getRowCount();
  }

  if (rowCnt <= 0) {
    Message.warn(t("데이터가 없습니다."));
    return false;
  }

  const statusYn = provider.searchDataRow({
    fields: ["STATUS"],
    values: ["1"],
  });

  if (statusYn < 0) {
    Message.warn(t("신청할 대상이 없습니다."));
    return false;
  }

  return true;
};

const searchApproval = async (dutyYn) => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_07",
      param: {
        CMPNY_DIV: props.cmpnyCd,
        YEAR: searchParam.YEAR,
        REQ_DIV: searchParam.REQ_DIV,
        REQ_CHA: searchParam.REQ_CHA,
        REQ_DT: searchParam.REQ_DT.replaceAll("-", ""),
        DEPT_CD: props.deptCd,
        DUTY_YN: dutyYn == "Y" ? "Y" : "N",
      },
    })
  ]);
  return res;
};

const afterApproval = async (res, dutyYn) => {
  approvalPopup.value.openPopup({
    CLSS_ID: "HLTHC0010",
    TITLE: "부서별 도수보안경 정기신청",
    CMPNY_DIV: props.cmpnyCd,
    DATA_KEY:
      props.cmpnyCd +
      ";" +
      searchParam.YEAR +
      ";" +
      searchParam.REQ_DIV +
      ";" +
      searchParam.REQ_CHA +
      ";" +
      userStore.empNo,
    REPORT: setReport(res.ORESULT_CUR), // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE: "3", //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: "421", //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE: "CLR_15", //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  });
};

const isNullAndEmpty = (data) => {
  let dataYn =
    data === undefined || data === null || data === "" ? true : false;
  return dataYn ? "" : data;
};

const setReport = (data) => {
  let htmlReport;
  const asgnArray = data[0].ASGN_FULL_NM?.split("-");

  htmlReport =
    `<html>
  <head>
    <style>
        /* .div_style */
        #approval
        {
          width: 95%;
          align-items:center;
        }
        .Report_Header
        {
          width: 100%;
          height: 100px;
          border: 1px solid black;
          font-size: 25px;
          font-weight: bold;
          padding: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        
        #approval table {
          border-collapse: collapse;
          width: 100%;
          border: 1px solid black;
          table-layout: fixed;
        }

        #approval .table_head {
          padding: 4px;
          text-align: center; /* 가로 가운데 정렬 */
          vertical-align: middle; /* 세로 가운데 정렬 */
          border: 1px solid black;
          margin-top: 2px;
          margin-bottom: 2px;
          font-weight: bold;
        }
        
        #approval .Content_header
        {
          padding: 4px;
          text-align: center; /* 가로 가운데 정렬 */
          vertical-align: middle; /* 세로 가운데 정렬 */
          border: 1px solid black;
          margin-top: 2px;
          margin-bottom: 2px;
          font-size: 16px;
          font-weight: bold;
        }

        #approval .Content
        {
          padding: 4px;
          vertical-align: middle; /* 세로 가운데 정렬 */
          border: 1px solid black;
          margin-top: 2px;
          margin-bottom: 2px;
          font-size: 16px;
        }

        .table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
        }

        #appbody
        {
          justify-items: center;
          padding-top: 40px;
          padding-bottom: 40px;
          border-collapse: collapse;
          border: 1px solid black;
          width: 210mm;
          height: 297mm;
        }
    </style>
  </head>
  <body id="appbody">
  <div id='approval'>     
    <div class="Report_Header">
      <span>도수보안경 정기 신청서</span>
      <span>(정기)</span>
    </div>
    <table class="table">
      <tr>
        <td class="table_head" style="width: 10%">사업부</td>
        <td class="table_head" style="width: 30%">` +
    asgnArray[0] +
    `</td>
        <td class="table_head" style="width: 10%">부서</td>
        <td class="table_head" style="width: 30%">` +
    asgnArray[1] +
    `</td>
        <td class="table_head" style="width: 15%">신청일자</td>
        <td class="table_head" style="width: 30%">` +
    dayjs(data[0].REQ_DT.split("T")[0]).format("YYYY년 MM월 DD일") +
    `</td>
      </tr>
    </table>
    <table class="table">
      <tr>
        <th class="Content_header" style="width : 5%" >No.</th>
        <th class="Content_header" style="width: 20%">소속</th>
        <th class="Content_header" style="width: 10%">이름</th>
        <th class="Content_header" style="width: 10%">직위</th>
        <th class="Content_header" style="width: 20%">시력검사장소</th>
        <th class="Content_header" style="width: 5%">수량</th>
        <th class="Content_header" style="width: 10%">사유</th>
        <th class="Content_header" style="width: 10%">추가지급</th>
        <th class="Content_header" style="width: 10%">비고</th>
      </tr>`;

  for (let i in data) {
    let SUPPLIES = data[i].SUPPLIES ? data[i].SUPPLIES : "";

    htmlReport +=
      `<tr>
        <td class="Content" style="width : 5%" >` +
      (parseInt(i) + 1).toString() +
      `</td>
        <td class="Content" style="width: 20%; justify-items: start;">` +
      asgnArray[0] + '-' + asgnArray[1] +
      `</td>
        <td class="Content" style="width: 10%">` +
      isNullAndEmpty(data[i].EMP_NM) +
      `</td>
        <td class="Content" style="width: 10%">` +
      isNullAndEmpty(data[i].JOB_TIT_NM) +
      `</td>
        <td class="Content" style="width: 20%">` +
      data[i].EYESIGHT_PLACE_NAME +
      `</td>
        <td class="Content" style="width: 5%; justify-items: end;">` +
      data[i].GLASSES_COUNT +
      `</td>
        <td class="Content" style="width: 10%">` +
      data[i].REASON_NM +
      `</td>
        <td class="Content" style="width: 10%">` +
      SUPPLIES +
      `</td>
        <td class="Content" style="width: 10%">` +
      isNullAndEmpty(data[i].REMARKS) +
      `</td>
      </tr>`;
  }

  htmlReport += `</div>
  </body>
</html>`;

  return htmlReport;
};

const approvalAppkey = async (appKey) => {
  let saveParam = [];
  let saveData = {
    CMPNY_DIV: searchParam.CMPNY_DIV,
    YEAR: searchParam.YEAR.toString(),
    REQ_DIV: searchParam.REQ_DIV,
    REQ_DT: searchParam.REQ_DT.replaceAll("-", ""),
    DEPT_CD: props.deptCd,
    USER_DIV: "A",
    APPROVE_ID: appKey,
    DUTY_YN: duty.value,
    USER_ID: userStore.userId,
  };
  saveParam.push(saveData);
  //{CMPNY_DIV=HHI, YEAR=2025, REQ_DIV=A, REQ_DT=, DEPT_CD=G2O0, USER_DIV=B, APPROVE_ID=HLTHC0010_A526166_20250604164753556, USER_ID=BP22612, OUT_RES_COD=0, OUT_RES_MSG=null, OUT_RES_COL=null}

  const res = await commonExecuteApi({
    queryId: "HLTHC0010_SAVE_02",
    list: saveParam,
  });

  await searchData();
};

const changeReasonY = async (val) => {
  if (val === "09") {
    suppliesDutyY.value = false;
  } else {
    suppliesDutyY.value = true;
    inputParam.SUPPLIES_DUTY_Y = "";
  }
};

const getsuppliesDutyY = computed(() => {
  return suppliesDutyY.value;
});

const changeReasonN = async (val) => {
  if (val === "09") {
    suppliesDutyN.value = false;
  } else {
    suppliesDutyN.value = true;
    inputParam.SUPPLIES_DUTY_N = "";
  }
};

const getsuppliesDutyN = computed(() => {
  return suppliesDutyN.value;
});

//'btnSelectListCollApply', 'btnApplication', 'btnReqCancel', 'btnReqApply'
const onButtonsClickY = (btn) => {
  if(props.isAdmin === 3){
    if (!priodYn.value) {
        Message.warn(t("정기신청 기간이 아닙니다."));
        return;
      }

      if (btn.id === "btnSelectListCollApply") {
        let checkedRows = grdMain.value.getGridView().getCheckedRows(true);
        if (checkedRows.length === 0) {
          Message.warn(t("일괄 변경할 데이터를 선택해주세요."));
          return false;
        }
        duty.value = "Y";
        hLTHC0010Popup03.value.openPopup();
      } else if (btn.id === "btnApplication") {
        saveGlassesData("Y");
      } else if (btn.id === "btnReqCancel") {
        cancelApllication("Y");
      } else if (btn.id === "btnReqApply") {
        duty.value = "Y";
        btnApproval("Y");
      }
  }else if(disabled === 'A'){
    if (props.isAdmin <= 0) {
      return Message.warn(
        t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
      );
    }

    const isIncluded = props.codeList.isSearchAdmin.some(
      (item) => item.DEPT_CD === props.asgnCd
    );

    if (isIncluded || props.isAdmin == 2) {
      if (!priodYn.value) {
        Message.warn(t("정기신청 기간이 아닙니다."));
        return;
      }

      if (btn.id === "btnSelectListCollApply") {
        let checkedRows = grdMain.value.getGridView().getCheckedRows(true);
        if (checkedRows.length === 0) {
          Message.warn(t("일괄 변경할 데이터를 선택해주세요."));
          return false;
        }
        duty.value = "Y";
        hLTHC0010Popup03.value.openPopup();
        // for (let rowIdx of checkedRows) {
        //   grdMain.value
        //     .getDataProvider()
        //     .setValue(rowIdx, "EYESIGHT_PLACE", inputParam.EYESIGHT_PLACE_DUTY_Y);
        //   grdMain.value
        //     .getDataProvider()
        //     .setValue(rowIdx, "REASON", inputParam.REASON_DUTY_Y);
        //   grdMain.value
        //     .getDataProvider()
        //     .setValue(rowIdx, "SUPPLIES", inputParam.SUPPLIES_DUTY_Y);
        // }
      } else if (btn.id === "btnApplication") {
        saveGlassesData("Y");
      } else if (btn.id === "btnReqCancel") {
        cancelApllication("Y");
      } else if (btn.id === "btnReqApply") {
        duty.value = "Y";
        btnApproval("Y");
      }
    } else {
      return Message.warn(
        t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
      );
    }
  }else{
    if (!priodYn.value) {
      Message.warn(t("정기신청 기간이 아닙니다."));
      return;
    }

    if (btn.id === "btnSelectListCollApply") {
        let checkedRows = grdMain.value.getGridView().getCheckedRows(true);
        if (checkedRows.length === 0) {
          Message.warn(t("일괄 변경할 데이터를 선택해주세요."));
          return false;
        }
        duty.value = "Y";
        hLTHC0010Popup03.value.openPopup();
      } else if (btn.id === "btnApplication") {
        saveGlassesData("Y");
      } else if (btn.id === "btnReqCancel") {
        cancelApllication("Y");
      } else if (btn.id === "btnReqApply") {
        duty.value = "Y";
        btnApproval("Y");
      }
  }
  
};

const onButtonsClickN = (btn) => {
  if(props.isAdmin === 3){
    if (!priodYn.value) {
        Message.warn(t("정기신청 기간이 아닙니다."));
        return;
      }

      if (btn.id === "btnSelectListCollApply") {
        let checkedRows = grdSub.value.getGridView().getCheckedRows(true);
        if (checkedRows.length === 0) {
          Message.warn(t("일괄 변경할 데이터를 선택해주세요."));
          return false;
        }
        duty.value = "N";
        hLTHC0010Popup03.value.openPopup();
      } else if (btn.id === "btnApplication") {
        saveGlassesData("N");
      } else if (btn.id === "btnReqCancel") {
        cancelApllication("N");
      } else if (btn.id === "btnReqApply") {
        duty.value = "N";
        btnApproval("N");
      }
  }else if(disabled === 'A'){
    if (props.isAdmin <= 0) {
      return Message.warn(
        t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
      );
    }

    const isIncluded = props.codeList.isSearchAdmin.some(
      (item) => item.DEPT_CD === props.asgnCd
    );

    if (isIncluded || props.isAdmin == 2) {
      if (!priodYn.value) {
        Message.warn(t("정기신청 기간이 아닙니다."));
        return;
      }

      if (btn.id === "btnSelectListCollApply") {
        let checkedRows = grdSub.value.getGridView().getCheckedRows(true);
        if (checkedRows.length === 0) {
          Message.warn(t("일괄 변경할 데이터를 선택해주세요."));
          return false;
        }
        duty.value = "N";
        hLTHC0010Popup03.value.openPopup();
      } else if (btn.id === "btnApplication") {
        saveGlassesData("N");
      } else if (btn.id === "btnReqCancel") {
        cancelApllication("N");
      } else if (btn.id === "btnReqApply") {
        duty.value = "N";
        btnApproval("N");
      }
    } else {
      return Message.warn(
        t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
      );
    }
  }else{
    if (!priodYn.value) {
      Message.warn(t("정기신청 기간이 아닙니다."));
      return;
    }

    if (btn.id === "btnSelectListCollApply") {
      let checkedRows = grdSub.value.getGridView().getCheckedRows(true);
      if (checkedRows.length === 0) {
        Message.warn(t("일괄 변경할 데이터를 선택해주세요."));
        return false;
      }
      duty.value = "N";
      hLTHC0010Popup03.value.openPopup();
    } else if (btn.id === "btnApplication") {
      saveGlassesData("N");
    } else if (btn.id === "btnReqCancel") {
      cancelApllication("N");
    } else if (btn.id === "btnReqApply") {
      duty.value = "N";
      btnApproval("N");
    }
  }
};

const onButtonsClick = async (btn) => {
  if (btn.id === "btnReceiveSave") {
    if (props.userDiv === "A") {
      if (props.isAdmin <= 0) {
        return Message.warn(
          t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
        );
      }

      const isIncluded = props.codeList.isSearchAdmin.some(
        (item) => item.DEPT_CD === props.asgnCd
      );

      if (isIncluded || props.isAdmin == 2) {
        if (!priodYn.value) {
          Message.warn(t("정기신청 기간이 아닙니다."));
          return;
        }

        if (!disabled) {
          return Message.warn(
            t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
          );
        }

        new saveFlowHelper(vm, t)
          .setBefore(beforeSave)
          .setQuery(saveData)
          .run();
      } else {
        return Message.warn(
          t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
        );
      }
    }
  }
};

const setRecevieData = async (userDiv) => {
  if (userDiv === "A") {
    userDivYn.value = false;
    menuTitle.value.disableBtn("btnReceiveSave", false);
  } else {
    userDivYn.value = true;
    menuTitle.value.disableBtn("btnReceiveSave", true);
  }
  // await nextTick("userDivYn.value : ", userDivYn.value);
  // await nextTick("menuTitle.value : ", menuTitle.value);
  await nextTick();
};

const disabled = computed(() => {
  console.log('userDivYn.value : ', userDivYn.value)
  return userDivYn.value;
});

function updateAreaHeight() {
  if (!areaDiv.value) return;
  const h = areaDiv.value.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--area-height", `${h}px`);
}

const onTabChange = async () => {
  console.log('props.userDiv : ', props.userDiv)

  await nextTick();

  if(props.userDiv === 'A'){
    menuTitle01.value.visibleBtn("btnReqApply", true);
    menuTitle01.value.disableBtn("btnReqApply", false);

    menuTitle02.value.visibleBtn("btnReqApply", true);
    menuTitle02.value.disableBtn("btnReqApply", false);
  }else{
    menuTitle01.value.visibleBtn("btnReqApply", false);
    menuTitle01.value.disableBtn("btnReqApply", true);

    menuTitle02.value.visibleBtn("btnReqApply", false);
    menuTitle02.value.disableBtn("btnReqApply", true);
  }

  if (
    tab.value === "tab01" &&
    !grdMain.value.getDataProvider().getRowCount() > 0
  ) {
    await initCodeList();
    await setGridItem();
    await grdMain.value.getDataProvider().setRows(grdData.value[0]);
    grdMain.value.getGridView().filterPanel.visible = true;
  } else if (
    tab.value === "tab02" &&
    !grdSub.value.getDataProvider().getRowCount() > 0
  ) {
    await initCodeList();
    await setGridItem();
    await grdSub.value.getDataProvider().setRows(grdData.value[1]);
    grdSub.value.getGridView().filterPanel.visible = true;
  }
};

const clearManager = () => {
  placeParam.MANAGER_EMP_NO = "";
  placeParam.MANAGER_EMP_NM = "";
  placeParam.MANAGER_TEL_NO = "";
};

const clearReceive = () => {
  placeParam.RECEIVE_EMP_NO = "";
  placeParam.RECEIVE_EMP_NM = "";
  placeParam.RECEIVE_TEL_NO = "";
};

defineExpose({
  searchData,
  setLoad,
  saveGlassesData,
  btnApproval,
  setRecevieData,
  initCodeList,
});
</script>

<template>
  <v-card class="pa-0 fil-height">
    <div ref="areaDiv" class="area-div">
      <v-card-text class="pa-3 mb-0 searchArea">
        <div class="d-flex flex-gap">
          <i-input
            :label="$t('해당년도')"
            class="custom-flex-1"
            labelWidth="60px"
            v-model="searchParam.YEAR"
            :disabled="true"
          />
          <i-input
            :label="$t('신청시기')"
            class="custom-flex-1"
            labelWidth="60px"
            v-model="searchParam.REQ_CHA_NM"
            :disabled="true"
          />
          <i-input
            :label="$t('마감기한')"
            class="custom-flex-1"
            labelWidth="60px"
            v-model="searchParam.EN_DT"
            :disabled="true"
          />
          <div class="custom-flex-2 d-flex">
            <i-label class="flex-grow-1 d-flex">
              <span
                class="form-label pr-2 pt-2"
                :style="{
                  display: 'block',
                  width: '60px',
                  margin: '0 8px 0 0',
                }"
              >
                {{ $t("신청상태 ") }}
              </span>
              <v-radio-group
                v-model="searchParam.STATUS"
                inline
                class="radioStyle"
              >
                <v-radio
                  v-for="item in codeList.STATUS"
                  :key="item"
                  :value="item.COD"
                  :label="item.TXT"
                />
              </v-radio-group>
            </i-label>
          </div>
          <span class="custom-flex-2" />
        </div>
      </v-card-text>

      <v-card-title class="pa-3 pb-0" style="justify-content: space-between">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('수령정보')"
          :button-list="['btnReceiveSave']"
          :hiddenManuel="true"
          @click-button="onButtonsClick"
          :usePermission="true"
        />
      </v-card-title>

      <v-card-text class="pa-3 mb-0 searchArea">
        <div class="d-flex flex-gap">
          <i-select
            :label="$t('수령장소')"
            :items="codeList.RECEIVE_PLACE_CD"
            item-title="TXT"
            item-value="COD"
            labelWidth="60px"
            v-model="placeParam.PLACE_CD"
            class="custom-flex-2"
            :disabled="disabled"
          />
          <i-input
            :label="$t('담당자')"
            :class="disabled ? 'custom-flex-1' : 'custom-flex-1 no-click'"
            labelWidth="60px"
            v-model="placeParam.MANAGER_EMP_NM"
            appendInnerIcon="mdi-magnify"
            :readonly="true"
            @click:appendInner="openEmpPopup('M')"
            :disabled="disabled"
          >
            <template #append-inner v-if="placeParam.MANAGER_EMP_NM != ''">
              <v-icon icon="mdi-window-close" @click="clearManager" />
            </template>
          </i-input>
          <i-input
            :label="$t('담당자 연락처')"
            class="custom-flex-1"
            labelWidth="80px"
            v-model="placeParam.MANAGER_TEL_NO"
            :disabled="true"
          ></i-input>
          <i-input
            :label="$t('수령자')"
            :class="disabled ? 'custom-flex-1' : 'custom-flex-1 no-click'"
            labelWidth="60px"
            v-model="placeParam.RECEIVE_EMP_NM"
            appendInnerIcon="mdi-magnify"
            :readonly="true"
            @click:appendInner="openEmpPopup('R')"
            :disabled="disabled"
          >
            <template #append-inner v-if="placeParam.RECEIVE_EMP_NM != ''">
              <v-icon icon="mdi-window-close" @click="clearReceive" />
            </template>
          </i-input>
          <i-input
            :label="$t('수령자 연락처')"
            class="custom-flex-1"
            labelWidth="80px"
            v-model="placeParam.RECEIVE_TEL_NO"
            :disabled="true"
          />
          <span class="custom-flex-1" />
        </div>
      </v-card-text>
    </div>

    <v-sheet>
      <v-card class="pa-0 fill-height">
        <v-tabs v-model="tab" @update:modelValue="onTabChange">
          <v-tab value="tab01">대상자</v-tab>
          <v-tab value="tab02">비대상자</v-tab>
          <!-- <v-tab value="tab03">수시신청</v-tab> -->
          <!-- <v-tab value="tab04">직영외 신청</v-tab> -->
        </v-tabs>
        <v-window
          v-model="tab"
          class="h-window"
          style="overflow-y: auto; max-height: calc(100vh - 150px)"
        >
          <v-window-item value="tab01">
            <div class="content-area d-flex flex-column">
              <v-card-title
                class="pa-3 pb-0"
                style="justify-content: space-between"
              >
                <IMenuTitle
                  ref="menuTitle01"
                  :title="$t('대상자')"
                  :button-list="[
                    'btnSelectListCollApply',
                    'btnApplication',
                    'btnReqCancel',
                    'btnReqApply',
                  ]"
                  :hiddenManuel="true"
                  @click-button="onButtonsClickY"
                />
              </v-card-title>

              <!-- <v-card-text class="pa-3 searchArea">
      <div class="d-flex flex-gap">
        <i-select
          :label="$t('시력검사장소')"
          :items="codeList.PLACE_CD"
          item-title="TXT"
          item-value="COD"
          labelWidth="80px"
          v-model="inputParam.EYESIGHT_PLACE_DUTY_Y"
          class="custom-flex-2"
        />
        <i-select
          :label="$t('신청사유')"
          :items="codeList.REASON"
          item-title="TXT"
          item-value="COD"
          labelWidth="80px"
          v-model="inputParam.REASON_DUTY_Y"
          class="custom-flex-1"
          @update:model-value="changeReasonY"
        />
        <i-select
          :label="$t('추가지급')"
          :items="codeList.ADD"
          item-title="TXT"
          item-value="COD"
          labelWidth="80px"
          v-model="inputParam.SUPPLIES_DUTY_Y"
          class="custom-flex-1"
          :disabled="getsuppliesDutyY"
        />
        <span class="custom-flex-2" />
      </div>
    </v-card-text> -->

              <!-- <v-card-title class="pa-3 pb-0 d-flex justify-space-between align-center">
      <IMenuTitle
        ref="menuTitle01"
        :title="$t('일괄등록')"
        :button-list="['btnSelectListCollApply']"
        :hiddenManuel="true"
        @click-button="onButtonsClick"
      />
      <div>
        <v-btn @click="cancelApllication">신청취소</v-btn>
      </div>
    </v-card-title> -->

              <v-card-text class="pa-0 pt-0 custom-flex-1">
                <div class="d-flex flex-column fill-height">
                  <div class="h-grow">
                    <v-sheet class="pa-0 h-auto">
                      <RealGrid
                        ref="grdMain"
                        :grid-view-option="grdMainProps.gridViewOption"
                        :fields="grdMainProps.fields"
                        :columns="grdMainProps.columns"
                        :column-layout="grdMainProps.columnLayout"
                      />
                    </v-sheet>
                  </div>
                </div>
              </v-card-text>
            </div>
          </v-window-item>
          <v-window-item value="tab02">
            <div class="content-area d-flex flex-column">
              <v-card-title
                class="pa-3 pb-0"
                style="justify-content: space-between"
              >
                <IMenuTitle
                  ref="menuTitle02"
                  :title="$t('비대상자')"
                  :button-list="[
                    'btnSelectListCollApply',
                    'btnApplication',
                    'btnReqCancel',
                    'btnReqApply',
                  ]"
                  :use-permission="true"
                  @click-button="onButtonsClickN"
                />
              </v-card-title>

              <!-- <v-card-text class="pa-3 searchArea">
      <div class="d-flex flex-gap">
        <i-select
          :label="$t('시력검사장소')"
          :items="codeList.PLACE_CD"
          item-title="TXT"
          item-value="COD"
          labelWidth="80px"
          v-model="inputParam.EYESIGHT_PLACE_DUTY_N"
          class="custom-flex-2"
        />
        <i-select
          :label="$t('신청사유')"
          :items="codeList.REASON"
          item-title="TXT"
          item-value="COD"
          labelWidth="80px"
          v-model="inputParam.REASON_DUTY_N"
          class="custom-flex-1"
          @update:model-value="changeReasonN"
        />
        <i-select
          :label="$t('추가지급')"
          :items="codeList.ADD"
          item-title="TXT"
          item-value="COD"
          labelWidth="80px"
          v-model="inputParam.SUPPLIES_DUTY_N"
          class="custom-flex-1"
          :disabled="getsuppliesDutyN"
        />
        <span class="custom-flex-2" />
      </div>
    </v-card-text> -->
              <v-card-text class="pa-0 pt-0 custom-flex-1">
                <div class="d-flex flex-column fill-height">
                  <div class="h-grow">
                    <v-sheet class="pa-0 h-auto">
                      <RealGrid
                        ref="grdSub"
                        :grid-view-option="grdMainProps.gridViewOption"
                        :fields="grdMainProps.fields"
                        :columns="grdMainProps.columns"
                        :column-layout="grdMainProps.columnLayout"
                      />
                    </v-sheet>
                  </div>
                </div>
              </v-card-text>
            </div>
          </v-window-item>
        </v-window>
      </v-card>
    </v-sheet>
  </v-card>
  <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
  <HLTHC0010Popup02 ref="hLTHC0010Popup02" />
  <HLTHC0010Popup03 ref="hLTHC0010Popup03" @selected="selectedData" />
  <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
</template>


<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (520px));
  // height: calc(100vh - (400px + (var(--area-height) / 2)));
  // height: calc(100vh - (300px + var(--area-height)));
  overflow-y: auto;
  // > div {
  //   min-height: 700px;
  // }
}

.area-div {
  /* 예시: 높이가 컨텐츠에 따라 유동적으로 결정 */
  padding: 0px;
  //background: #fafafa;
}

.tooltip-wrapper {
  position: absolute;
}
.tooltip {
  position: relative; /* 화살표가 툴팁 아래에 위치하도록 */
  background-color: #424242;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  z-index: 1000; /* 툴팁이 다른 요소 위에 보이도록 */
  pointer-events: none; /* 툴팁이 마우스 이벤트를 받지 않도록 */
  white-space: nowrap; /* 내용이 줄바꿈되지 않도록 */
}

.tooltip-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent; /* 화살표의 왼쪽 부분 */
  border-right: 5px solid transparent; /* 화살표의 오른쪽 부분 */
  border-top: 5px solid #424242; /* 화살표의 색상 */
  position: absolute;
  left: 50%; /* 가운데 정렬 */
  transform: translateX(-50%); /* 수평 중심으로 이동 */
  top: 100%; /* 툴팁 아래에 위치 */
}

.flex-gap {
  gap: 20px;
  flex-wrap: wrap;
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 1 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 20px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}
.custom-flex-3 {
  /* width: calc(25% - 0px) !important; */
  flex: 3 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 40px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.radioStyle {
  padding-left: 5px;
  height: 35px;
  background-color: rgb(255, 255, 255);
  border: 1px solid;
  border-radius: 2px;
  border-color: #e0e0e0; //#CCCCCC;
  // width: 80%;
  font-size: x-small;
  display: flex;
  align-items: center;
}

.redLabel {
  color: red !important;
}

.grd-flex {
  flex: 1 1 auto;
  min-height: 0;
}

.custom-header {
  background-color: orange !important; /* ✅ 원하는 헤더 배경색 */
  color: #000;
  font-weight: bold;
}

.rg-data-readonly-cell {
  background: #ffffff;
}

::v-deep(.rg-button-action) {
  background: none !important; /* 기본 이미지 제거 */
  font-family: "Material Design Icons"; /* mdi 폰트 지정 */
  font-size: 20px;
  color: #ccc;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: none;
}

::v-deep(.rg-button-action::before) {
  content: "\F0349"; /* mdi-magnify 유니코드 */
}

.no-click {
  color: black !important;
  -webkit-text-fill-color: black !important;
}
</style>