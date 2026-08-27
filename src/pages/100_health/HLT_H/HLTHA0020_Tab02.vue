<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  computed,
  onBeforeMount,
  nextTick,
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
import HLTHA0020Popup02 from "./HLTHA0020Popup02.vue";
import { value } from "lodash-es";

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
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const empPopup = ref(null);
const hLTHA0020Popup02 = ref(null);
const priodYn = ref(true);
const userDivYn = ref(null);
const menuTitle = ref(null);

const codeList = reactive({
  STATUS: [
    { COD: "%", TXT: "전체" },
    { COD: " ", TXT: "미신청" },
    { COD: "3", TXT: "신청완료" },
  ],
  GRID_STATUS: [
    { COD: "%", TXT: "전체" },
    { COD: " ", TXT: "미신청" },
    { COD: "3", TXT: "신청완료" },
    { COD: "4", TXT: "확정완료" },
    { COD: "5", TXT: "반려" },
    { COD: "9", TXT: "지급완료" },
  ],
  PLACE_CD: [],
  SHOES_KIND: [],
  SIZE: [],
  USER_DIV: [
    { COD: "A", TXT: "직영" },
    { COD: "B", TXT: "사내협력사" },
  ],
  DUTY_YN: [
    { COD: "Y", TXT: "대상" },
    { COD: "N", TXT: "비대상" },
  ],
  REASON: [],
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
        // checked: 'N'
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
      styleCallback: function (grid, dataCell) {
        // const dataRow = dataCell.index.dataRow;
        //const dataIndex = dataCell.index.itemIndex;
        const dataIndex = dataCell.index.itemIndex;
        if (dataIndex < 0) return;

        const dutyYn = grid.getValue(dataIndex, "DUTY_YN");
        const cmpnyDiv = grid.getValue(dataIndex, "CMPNY_DIV");

        const isEditable = !(dutyYn === "N" || cmpnyDiv === "320");

        const ret = {
          editable: true, // 항상 true 유지 → 회색 안 됨
        };

        if (!isEditable) {
          //ret.editor = null; // ✅ 체크 불가 처리 (UI는 회색 아님)
          ret.renderer = { type: "check", editable: false };
        } else {
          ret.renderer = { type: "check", editable: true };
        }

        return ret;
      },
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
      lookupDisplay: true,
      header: { text: t("대상여부(직무)") },
      styleName: "center-column",
    },

    {
      fieldName: "DUTY_COUNTNM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("지급기준") },
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
      fieldName: "SHOES_VEND",
      dataType: "text",
      width: "200",
      header: {
        text: t("안전화 종류"),
        //styleName: "custom-header"
      },
      lookupDisplay: true,
      styleName: "left-column editable_column",
      // displayCallback: function (grid, index, value) {
      //   return value === "0" ? "" : value;s
      // },
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (
          grid.getValue(dataCell.index.itemIndex, "DUTY_YN") === "N" || //index.itemIndex
          ["2", "3", "4", "9"].includes(
            grid.getValue(dataCell.index.itemIndex, "STATUS") //itemIndex
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
      fieldName: "SHOES_SIZE",
      dataType: "text",
      width: "60",
      header: {
        text: t("사이즈"),
      },
      lookupDisplay: true,
      styleName: "center-column editable_column",
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (
          grid.getValue(dataCell.index.itemIndex, "DUTY_YN") === "N" || //itemIndex
          ["2", "3", "4", "9"].includes(
            grid.getValue(dataCell.index.itemIndex, "STATUS") //itemIndex
          ) ||
          grid.getValue(dataCell.index.itemIndex, "SHOES_VEND") === "" || //itemIndex
          grid.getValue(dataCell.index.itemIndex, "SHOES_VEND") === null //itemIndex
        ) {
          ret.editable = false;
        }
        return ret;
      },
    },
    {
      fieldName: "SHOES_COUNT",
      dataType: "text",
      width: "60",
      editable: false,
      header: {
        text: t("신청수량"),
      },
      styleName: "center-column",
      // displayCallback: function (grid, index, value) {
      //   return value === "0" ? "" : value;
      // },
    },
    {
      fieldName: "COUPON_YN",
      width: "60",
      header: {
        text: t("쿠폰여부"),
      },
      styleName: "center-column editable_column",
      renderer: {
        type: "check", // ✅ 셀 내부에 체크박스 표시
        trueValues: "Y",
        falseValues: "N",
      },
      editor: {
        type: "check", // ✅ 클릭하면 체크 상태 토글 가능
        trueValues: "Y",
        falseValues: "N",
      },
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (
          grid.getValue(dataCell.index.itemIndex, "DUTY_YN") === "N" || //itemIndex
          ["2", "3", "4", "9"].includes(
            grid.getValue(dataCell.index.itemIndex, "STATUS") //itemIndex
          )
        ) {
          ret.renderer = { type: "check", editable: false };
          return ret;
        } else {
          ret.renderer = { type: "check", editable: true };
        }

        if (grid.getValue(dataCell.index.itemIndex, "CMPNY_DIV") === "320") { //itemIndex
          ret.renderer = { type: "check", editable: false };
          return ret;
        } else {
          ret.renderer = { type: "check", editable: true };
        }

        return ret;
      },
    },
    {
      fieldName: "INSORE_YN",
      width: "60",
      header: {
        text: t("보온 깔창여부"),
      },
      styleName: "center-column editable_column",
      renderer: {
        type: "check", // ✅ 셀 내부에 체크박스 표시
        trueValues: "Y",
        falseValues: "N",
        editable: false,
      },
      editor: {
        type: "check", // ✅ 클릭하면 체크 상태 토글 가능
        trueValues: "Y",
        falseValues: "N",
      },
      styleCallback: function (grid, dataCell) {
        const dataRow = dataCell.index.itemIndex;
        if (dataRow < 0) return;

        const dutyYn = grid.getValue(dataRow, "DUTY_YN");
        const cmpnyDiv = grid.getValue(dataRow, "CMPNY_DIV");

        const isEditable = !(
          dutyYn === "N" ||
          cmpnyDiv === "320" ||
          ["2", "3", "4", "9"].includes(
            grid.getValue(dataCell.index.itemIndex, "STATUS") //itemIndex
          )
        );

        const ret = {
          editable: true, // 항상 true 유지 → 회색 안 됨
        };

        if (!isEditable) {
          ret.renderer = { type: "check", editable: false };
          return ret;
        } else {
          ret.renderer = { type: "check", editable: true };
        }

        if (searchParam.REQ_CHA != "2") {
          ret.renderer = { type: "check", editable: false };
          return ret;
        } else {
          ret.renderer = { type: "check", editable: true };
        }

        if (
          grid.getValue(dataCell.index.itemIndex, "SHOES_VEND") === "" || //itemIndex
          grid.getValue(dataCell.index.itemIndex, "SHOES_VEND") === null //itemIndex
        ) {
          ret.renderer = { type: "check", editable: false };
          return ret;
        } else {
          ret.renderer = { type: "check", editable: true };
        }

        const SHOES_KIND = ["100", "101", "102", "108"];
        if (
          !SHOES_KIND.includes(
            grid.getValue(dataCell.index.itemIndex, "SHOES_KIND") //itemIndex
          )
        ) {
          //ret.renderer = { type: "check", editable: false };
          //ret.editor = null;
          ret.renderer = { type: "check", editable: false };
          return ret;
        } else {
          ret.renderer = { type: "check", editable: true };
        }

        if (grid.getValue(dataCell.index.itemIndex, "DUTY_COUNT") != "12") { //itemIndex
          //ret.renderer = { type: "check", editable: false };
          ret.renderer = { type: "check", editable: false };
          return ret;
        } else {
          ret.renderer = { type: "check", editable: true };
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
      // displayCallback: function (grid, index, value) {
      //   return value === "0" ? "" : value;
      // },
    },
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("비고") }, //미지급 사유
      styleName: "left-column",
      // displayCallback: function (grid, index, value) {
      //   return value === "0" ? "" : value;
      // },
    },
    {
      fieldName: "BE_REQ_DIV",
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("신청구분") },
      styleName: "center-column",
      // displayCallback: function (grid, index, value) {
      //   return value === "0" ? "" : value;
      // },
    },
    {
      fieldName: "BE_RECEIVE_DT",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("지급일자") },
      styleName: "center-column",
      // displayCallback: function (grid, index, value) {
      //   return value === "0" ? "" : value;
      // },
    },
    {
      fieldName: "BE_SHOES_NM",
      dataType: "text",
      width: "200",
      editable: false,
      header: { text: t("안전화 종류") },
      styleName: "left-column",
      // displayCallback: function (grid, index, value) {
      //   return value === "0" ? "" : value;
      // },
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
      fieldName: "SHOES_KIND",
      visible: false,
      header: { text: t("안전화 코드") },
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
      fieldName: "REASON",
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
    // {
    //   fieldName: "STATUS_B",
    //   visible: false,
    //   header: { text: t("수시 신청상태") },
    // },
    // {
    //   fieldName: "REQ_DT_B",
    //   visible: false,
    //   header: { text: t("수시 신청일자") },
    // },
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
    "DUTY_COUNTNM",
    "STATUS",
    "SHOES_VEND",
    "SHOES_SIZE",
    "SHOES_COUNT",
    "COUPON_YN",
    "INSORE_YN",
    "RECEIVE_YN",
    "REMARKS",
    // {
    //   name: "이전 지급 정보",
    //   direction: "horizontal",
    //   items: ["BE_REQ_DIV", "BE_RECEIVE_DT", "BE_SHOES_NM", "BE_REMARKS"],
    //   header: {
    //     text: t("이전 지급 정보"),
    //   },
    // },
  ],
});

grdMainProps.columns = grdMainProps.fields;

const initCodeList = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHF0060_SEARCH_PLACE",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: props.bsnsCd,
      },
    }),
    getCodeList("HHII710A"), // 안전화 8인치
  ]);

  codeList.PLACE_CD = res[0].ORESULT_CUR;
  codeList.PLACE_CD.unshift({ TXT: "선택", COD: "" });
  // console.log("codeList.PLACE_CD : ", codeList.PLACE_CD);

  const tempList = [...res[1].ORESULT_CUR];

  codeList.REASON = tempList.filter(
    (item) => {
      return (
        item.CODE_DESC1 != null && item.CODE_DESC1.toString().trim() !== ""
      );
    } //item.CODE_DESC1 != '' || item.CODE_DESC1 != null
  );

  // console.log('codeList.REASON : ', codeList.REASON)

  grdMain.value.setBindingColumn("STATUS", codeList.GRID_STATUS, "COD", "TXT");
  grdMain.value.setBindingColumn("USER_DIV", codeList.USER_DIV, "COD", "TXT");
  grdMain.value.setBindingColumn("DUTY_YN", codeList.DUTY_YN, "COD", "TXT");
};

const getReqestPriod = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHA0020_SEARCH_03",
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
      },
    }),
  ]);

  return res[0].ORESULT_CUR;
};

const getReceivePlace = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHA0020_SEARCH_05",
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

const searchData = async () => {
  grdMain.value.getDataProvider().clearRows();

  await initCodeList();

  placeParam.PLACE_CD = "";
  placeParam.MANAGER_EMP_NO = "";
  placeParam.MANAGER_EMP_NM = "";
  placeParam.MANAGER_TEL_NO = "";
  placeParam.RECEIVE_EMP_NO = "";
  placeParam.RECEIVE_EMP_NM = "";
  placeParam.RECEIVE_TEL_NO = "";

  const res = await Promise.all([getReceivePlace(), searchDatas()]);

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

  await grdMain.value.getDataProvider().setRows(res[1].ORESULT_CUR);

  //grdMain.value.getGridView().setColumnProperty('checked').header.text = 'N'
  //grdMain.value.getGridView().checked = false//  grdMain.value.getGridView().onColumnCheckedChanged
  //const header = grdMain.value.getGridView().getColumnProperty("rowCheck", "header");
  //grdMain.value.getGridView().setColumnProperty("rowCheck", "header", { ...header, checked: 'N' });

  grdMain.value.getGridView().columnByName('rowCheck').checked = false

  // grdMain.value.getGridView().setAllCheck(false);

  // syncHeadCheck 



  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);
};

const getQuery = async () => {
  new queryFlowHelper(vm, t)
    .setQuery(() => searchDatas())
    .setAfter(afterSearch)
    .run();
};

const searchDatas = async () => {
  return commonSearchApi({
    queryId: "HLTHA0020_SEARCH_02",
    param: {
      CMPNY_DIV: props.cmpnyCd,
      USER_DIV: props.userDiv,
      DEPT_CD: props.deptCd,
      ASGN_CD: props.asgnCd,
      OUT_YN: props.outYn,
      YEAR: searchParam.YEAR,
      REQ_DIV: searchParam.REQ_DIV,
      REQ_CHA: searchParam.REQ_CHA,
      REQ_DT: "",
      STATUS: searchParam.STATUS,
      DUTY_YN: props.dutyYn,
      ADMIN: props.isAdmin.toString(),
    },
  });
};

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  // grdMain.value.getGridView().columnByName('checked').header.checked = false
  // grdMain.value.getGridView().checked = false//  grdMain.value.getGridView().onColumnCheckedChanged

  // const col = grdMain.value.getGridView().columnByName("rowCheck");
  // console.log(' col : ', col)
  // grdMain.value.getGridView().setColumnProperty(col, "checked", 'N');
};

const saveShoesData = async () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeShoesSave)
    .setQuery(saveShoesDatas)
    .setAfter(afterShoesSave)
    .run();
};

const getCustomCheckedRows = async () => {
  const dataProvider = grdMain.value.getDataProvider();
  const rowCount = dataProvider.getRowCount();

  const checkedIndexes = [];

  for (let i = 0; i < rowCount; i++) {
    //let dataRow = grdMain.value.getGridView().getDataRow(i)

    const value = dataProvider.getValue(i, "checked");
    if (value === "Y" || value === true) {
      checkedIndexes.push(i); // ✅ 인덱스만 push
    }
  }

  return checkedIndexes;
};

const beforeShoesSave = async () => {
  let checkedData = await getCustomCheckedRows(); //grdMain.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("저장할 데이터를 선택해주세요."));
    return false;
  }

  if (userStore.userDiv === "A") {
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
  }

  const provider = grdMain.value.getDataProvider();

  for (let index of checkedData) {
    if (
      (provider.getValue(
        //grdMain.value.getGridView().getDataRow(index),
        index,
        "COUPON_YN"
      ) === "N" &&
        provider.getValue(
          index,//grdMain.value.getGridView().getDataRow(index),
          "SHOES_VEND"
        ) === "") ||
      provider.getValue(
        index,//grdMain.value.getGridView().getDataRow(index),
        "SHOES_VEND"
      ) === null
    ) {
      Message.warn(t("안전화를 선택해주세요."));
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: index, column: "SHOES_VEND" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }

    if (
      (provider.getValue(
       index,// grdMain.value.getGridView().getDataRow(index),
        "COUPON_YN"
      ) === "N" &&
        provider.getValue(
          index,//grdMain.value.getGridView().getDataRow(index),
          "SHOES_SIZE"
        ) === "") ||
      provider.getValue(
        index,//grdMain.value.getGridView().getDataRow(index),
        "SHOES_SIZE"
      ) === null
    ) {
      Message.warn(t("안전화 사이즈를 선택해주세요."));
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: index, column: "SHOES_SIZE" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }
    //const arrayStatus = [1, 2, 3, 4, 9];
    // 1: 신청중, 2: 결재중, 3: 결재완료, 4: 확정완료, 9: 지급완료

    let reasonList = [];
    if (
      provider.getValue(
        index,//grdMain.value.getGridView().getDataRow(index),
        "REASON_B"
      )
    ) {
      reasonList = provider
        .getValue( index,//grdMain.value.getGridView().getDataRow(index)
        "REASON_B")
        .split(",");
    }
    if (
      reasonList.some((val) => val !== "02") &&
      provider.getValue(
        index,//grdMain.value.getGridView().getDataRow(index),
        "BEAF"
      ) === "2"
    ) {
      Message.warn(
        t(
          "이번 분기 수시신청 내역이 존재합니다. 정기신청을 진행할 수 없습니다."
        )
      );
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: index, column: "SHOES_VEND" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }

    // if (
    //   !arrayStatus.includes(
    //     provider.getValue(
    //       grdMain.value.getGridView().getDataRow(index),
    //       "STATUS_B"
    //     )
    //   )
    // ) {
    //   Message.warn(
    //     t(
    //       "이번 분기 수시신청 내역이 존재합니다. 정기신청을 진행할 수 없습니다."
    //     )
    //   );
    //   return false;
    // }

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
  }

  return true;
};

const saveShoesDatas = () => {
  let temp = null; 
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true);

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    let saveParam = [];
    let saveData = {
      CMPNY_DIV: searchParam.CMPNY_DIV,
      YEAR: searchParam.YEAR,
      REQ_DIV: searchParam.REQ_DIV,
      REQ_CHA: searchParam.REQ_CHA,
      EMP_NO: data.EMP_NO,
      BSNS_CD: props.bsnsCd,
      DEPT_CD: props.deptCd,
      DIVISION: "B",
      SHOES_KIND: data.SHOES_KIND,
      SHOES_SIZE: data.SHOES_SIZE,
      SHOES_COUNT: data.SHOES_COUNT,
      COUPON_YN: data.COUPON_YN,
      INSORE_YN: data.INSORE_YN,
      DUTY_YN: data.DUTY_YN,
      USER_DIV: data.USER_DIV,
      REASON: "09", //data.REASON,
      REMARKS: data.REMARKS,
      VEND_NAME: data.VEND_NAME,
      USER_ID: userStore.userId,
    };
    saveParam.push(saveData);

    console.log(saveParam);

    temp = commonExecuteApi({
      queryId: "HLTHA0020_SAVE_01",
      list: saveParam,
    });
  }

  return temp;
};

const afterShoesSave = async (res) => {
  // let checkedRows = grdMain.value.getGridView().getCheckedRows(true);
  // if (res.list[0].USER_DIV === "A") {
  //   for (let rowIdx of checkedRows) {
  //     grdMain.value
  //     .getDataProvider()
  //     .setValue(rowIdx, "STATUS", "1");
  //   }
  // } else {
  //   for (let rowIdx of checkedRows) {
  //     grdMain.value
  //     .getDataProvider()
  //     .setValue(rowIdx, "STATUS", "3");
  //   }
  // }
  // uncheckAll();

  await searchData();
};

const reCodeList = (list) => {
  const newArray = list.map((item) => ({
    value: item.COD,
    text: item.TXT,
  }));

  return newArray;
};

const setRegisItem = async (user) => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHA0020_SEARCH_SHOES",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }), // 안전화
    getCodeList("HHII720"), // 안전화 사이즈
  ]);

  //-------------------등록------------------------------

  codeList.SHOES_KIND = [...res[0].ORESULT_CUR];
  codeList.SIZE = [...res[1].ORESULT_CUR];

  if (!codeList.SHOES_KIND.some((item) => item.TXT === "")) {
    codeList.SHOES_KIND.unshift({ TXT: "", COD: "" });
  }

  if (!codeList.SIZE.some((item) => item.TXT === "")) {
    codeList.SIZE.unshift({ TXT: "", COD: "" });
  }
};

const setGridItem = async () => {
  grdMain.value
    .getGridView()
    .setColumnProperty(
      "SHOES_VEND",
      "lookupData",
      reCodeList(codeList.SHOES_KIND)
    );
  grdMain.value.getGridView().setColumnProperty("SHOES_VEND", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.SHOES_KIND),
  });

  grdMain.value
    .getGridView()
    .setColumnProperty("SHOES_SIZE", "lookupData", reCodeList(codeList.SIZE));
  grdMain.value.getGridView().setColumnProperty("SHOES_SIZE", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.SIZE),
  });

  grdMain.value.getGridView().onShowEditor = function (grid, index) {
    const provider = grdMain.value.getDataProvider();

    if (
      index.column == "COUPON_YN" ||
      index.column == "INSORE_YN" ||
      index.column == "rowCheck"
    ) {
      return false;
    }
    // if(provider.getValue(index.dataRow,'CMPNY_DIV') === '320'){
    //   if(index.column === 'COUPON_YN' || index.column === 'INSORE_YN'){
    //   }
    // }
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
        // console.log('index : ', index)
        if (provider.getValue(itemIndex, "checked") === "Y") {
          grdMain.value.getGridView().checkRow(itemIndex);
        } else {
          grdMain.value.getGridView().checkRow(itemIndex, false);
        }
      }

      if (
        fieldName === "SHOES_VEND" ||
        fieldName === "SHOES_SIZE" ||
        fieldName === "COUPON_YN" ||
        fieldName === "INSORE_YN"
      ) {
        provider.setValue(row, "checked", "Y");
      }

      if (fieldName === "SHOES_VEND") {
        const shoes = provider.getValue(row, "SHOES_VEND").split("-");
        provider.setValue(row, "SHOES_KIND", shoes[0]);
        provider.setValue(row, "VEND_NAME", shoes[1]);
      }

      if (fieldName === "SHOES_VEND" || fieldName === "SHOES_SIZE") {
        if (
          (provider.getValue(row, "SHOES_VEND") === "" ||
            provider.getValue(row, "SHOES_VEND") == null) &&
          (provider.getValue(row, "SHOES_SIZE") === "" ||
            provider.getValue(row, "SHOES_SIZE") == null)
        ) {
          provider.setValue(row, "SHOES_COUNT", "");
        } else {
          provider.setValue(row, "SHOES_COUNT", "1");
        }

        const SHOES_KIND = provider.getValue(row, "SHOES_KIND");

        if (fieldName === "SHOES_VEND" && SHOES_KIND !== "") {
          provider.setValue(row, "COUPON_YN", "N");
        }

        if (!["100", "101", "102", "108"].includes(SHOES_KIND)) {
          provider.setValue(itemIndex, "INSORE_YN", "N");
        }
      }

      if (fieldName === "COUPON_YN") {
        const COUPON_YN = provider.getValue(row, "COUPON_YN");

        if (COUPON_YN === "Y") {
          provider.setValue(row, "SHOES_VEND", "");
          provider.setValue(row, "SHOES_KIND", "");
          provider.setValue(row, "VEND_NAME", "");
          provider.setValue(row, "SHOES_SIZE", "");
          provider.setValue(row, "SHOES_COUNT", "");
          provider.setValue(row, "INSORE_YN", "N");
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
      EMP_NO: grdMain.value.getDataProvider().getValue(index.dataRow, "EMP_NO"),
    };

    hLTHA0020Popup02.value.openPopup(param);
    // alert(
    //     "CellButton Clicked: itemIndex=" +
    //     index.itemIndex +
    //     ", fieldName=" +
    //     column.fieldName
    // );
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
};

const uncheckAll = async () => {
  const dataProvider = grdMain.value.getDataProvider();
  const rowCount = dataProvider.getRowCount();

  for (let i = 0; i < rowCount; i++) {
    dataProvider.setValue(i, "checked", "N");
  }
};

const setReqestPriod = async (res) => {
  //const res = await getReqestPriod();
  // YEAR: '2025', REQ_CHA: '2', EN_DATE: '2025-04-15T00:00:00.000+00:00', ST_DATE: '2025-03-28T00:00:00.000+00:00'
  //if (res != null && res.length > 0) {
  searchParam.YEAR = res[0].YEAR;
  searchParam.REQ_CHA = res[0].REQ_CHA;
  searchParam.REQ_CHA_NM = res[0].REQ_CHA === "1" ? "상반기" : "하반기";
  searchParam.EN_DT = dayjs(res[0].EN_DATE).format("YYYY-MM-DD");
  //} else {
  // searchParam.YEAR = dayjs().year().toString();
  // searchParam.REQ_CHA = dayjs().month() <= 6 ? "1" : "2";
  // searchParam.REQ_CHA_NM = dayjs().month() <= 6 ? "상반기" : "하반기";
  // searchParam.EN_DT = "";
  // }
};

const setLoad = async () => {
  await initCodeList();

  const res = await getReqestPriod();

  if (res != null && res.length > 0) {
    await setReqestPriod(res);
  } else {
    priodYn.value = false;
    return false;
  }
  await setRegisItem();
  await setGridItem();
  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);
  priodYn.value = true;
  return true;
};

onMounted(async () => {
  // await initCodeList();
  // await setReqestPriod();
  // await setRegisItem();
  // await setGridItem();
  grdMain.value.getGridView().filterPanel.visible = true;
});

const onButtonsClick = async (btn) => {
  if (btn.id === "btnReceiveSave") {
    if(props.isAdmin === 3){
      if (!priodYn.value) {
        Message.warn(t("정기신청 기간이 아닙니다."));
        return;
      }

      new saveFlowHelper(vm, t)
        .setBefore(beforeSave)
        .setQuery(saveData)
        .run();
    }else if (props.userDiv === "A") {
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
    queryId: "HLTHA0020_SAVE_RECEIVE",
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
    DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
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

const cancelApllication = async () => {
  if(props.isAdmin === 3){
    if (!priodYn.value) {
      Message.warn(t("정기신청 기간이 아닙니다."));
      return;
    }

    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
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
        .setBefore(beforeDelete)
        .setQuery(deleteData)
        .setAfter(afterDelete)
        .run();
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

    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run();
  }

  
};

const beforeDelete = async () => {
  let checkedData = await getCustomCheckedRows();
  if (checkedData.length === 0) {
    Message.warn(t("신청취소 할 데이터를 선택해주세요."));

    return false;
  }
  return true;
};

const deleteData = async () => {
  let temp = null;
  let checkedRows = await getCustomCheckedRows();// grdMain.value.getGridView().getCheckedRows(true);
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    if(data.STATUS === '3'){
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

      console.log(`??? ${rowIdx}`, data)
      temp = commonExecuteApi({
        queryId: "HLTHA0020_DELETE_01",
        list: deleteParam,
      });
    }
  }
  return temp;
};

const afterDelete = async () => {
  await searchData();
};

const setRecevieData = async (userDiv) => {
  if (userDiv === "A") {
    userDivYn.value = false;
    menuTitle.value.disableBtn("btnReceiveSave", false);
  } else {
    userDivYn.value = true;
    menuTitle.value.disableBtn("btnReceiveSave", true);
  }
  await nextTick();
};

const disabled = computed(() => {
  return userDivYn.value;
});

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
  saveShoesData,
  setRecevieData,
  initCodeList,
});
</script>

<template>
  <v-card class="pa-0 fil-height">
    <v-card-text class="pa-3 searchArea">
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
        <span class="custom-flex-2-span" />
      </div>
    </v-card-text>
    <v-card-title class="pa-3 pb-0" style="justify-content: space-between">
      <IMenuTitle
        ref="menuTitle"
        :title="$t('수령정보')"
        :button-list="['btnReceiveSave']"
        :hiddenManuel="true"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
    </v-card-title>

    <v-card-text class="pa-3 searchArea">
      <div class="d-flex flex-gap">
        <i-select
          :label="$t('수령장소')"
          :items="codeList.PLACE_CD"
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

    <v-card-title class="pa-3 pb-0 d-flex justify-space-between align-center">
      <div class="d-flex align-center">
        <span class="menuTitle redLabel">
          {{
            $t(
              "※ 보온깔창 선택가능 조건 : 하반기, 8인치 안전화, 1년 2착 대상 일 때만 선택가능"
            )
          }}
        </span>
      </div>
      <div>
        <v-btn @click="cancelApllication">신청취소</v-btn>
      </div>
    </v-card-title>

    <v-card-text class="pa-0 pt-3 content-area">
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
  </v-card>
  <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
  <HLTHA0020Popup02 ref="hLTHA0020Popup02" />
</template>


<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (545px));
  overflow-y: auto;
  // > div {
  //   min-height: 700px;
  // }
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

.custom-flex-2-span {
  /* width: calc(25% - 0px) !important; */
  flex: 2 5 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 20px) !important;
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

.realgrid-section {
  flex-grow: 1;
  overflow: auto;
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