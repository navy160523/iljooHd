
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue";
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
import { useCommonStore } from "@hiway/stores/common";
import HLTHF0040Popup from "./HLTHF0040Popup.vue";
import dayjs from "dayjs";

const commonStore = useCommonStore();
const grdMain = ref(null);
const grdDetail = ref(null);
const grdExcel01 = ref(null);
const grdExcel02 = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const hLTHF0040Popup = ref(null);

const reCodeList = (list) => {
  const newArray = list.map((item) => ({
    value: item.COD,
    text: item.TXT,
  }));

  return newArray;
};

const codeList = reactive({
  ORGN_DIV: [
    { COD: "A", TXT: "직영" },
    { COD: "B", TXT: "사내협력사" },
  ],
  JOB_ROW_CD: [],

  SHOES_COUNT: [],
  SHOES_SEX: [
    { COD: "", TXT: "" },
    { COD: "A", TXT: "전체" },
    { COD: "M", TXT: "남성" },
    { COD: "F", TXT: "여성" },
  ],
  LONG_SHOES_COUNT: [],
  SHOES_COUNT_G: [],
  SHOES_SEX_G: [
    { COD: "", TXT: "" },
    { COD: "A", TXT: "전체" },
    { COD: "M", TXT: "남성" },
    { COD: "F", TXT: "여성" },
  ],
  LONG_SHOES_COUNT_G: [],
  TARGET_YN: [
    { COD: "", TXT: "" },
    { COD: "Y", TXT: "대상" },
    { COD: "N", TXT: "비대상" },
  ],
});

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  ORGN_DIV: "A",
  JOB_ROW_CD: "",
});

const itemField = reactive({
  SHOES_COUNT: "",
  SHOES_SEX: "",
  TARGET_YN: "",
});

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    headerHeight: 60,
    rowIndicator: {
      visible: false,
    },
  },
  fields: [
    {
      fieldName: "JOB_ROW_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직군") },
      styleName: "left-column",
      mergeRule: {
        criteria: "value",
      },
    },
    {
      fieldName: "STD_DUTY_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직렬") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
      header: { text: t("사업장") },
    },
    {
      fieldName: "JOB_ROW_CD",
      visible: false,
      header: { text: t("직군코드") },
    },
    {
      fieldName: "STD_DUTY_CD",
      visible: false,
      header: { text: t("직렬코드") },
    },
    {
      fieldName: "ORGN_DIV",
      visible: false,
      header: { text: t("직영구분") },
    },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

const grdDetailProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    displayOptions: {
      headerHeight: 60, // 여기로 이동!
      groupHeaderHeight: 60,
    },
  },
  fields: [
    {
      fieldName: "UNT_DUTY_NM",
      dataType: "text",
      width: "150",
      editable: false,
      header: { text: t("단위직무") },
      styleName: "left-column",
    },
    {
      fieldName: "SHOES_COUNT",
      dataType: "text",
      width: "80",
      header: { text: t("지급수량") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "SHOES_SEX",
      dataType: "text",
      width: "60",
      header: { text: t("성별") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "LONG_SHOES_COUNT",
      dataType: "text",
      width: "80",
      header: { text: t("지급수량") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "GLASSES_YN",
      dataType: "text",
      width: "100",
      header: { text: t("도수보안경 지급기준") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "300",
      header: { text: t("비고") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "YN",
      visible: false,
      header: { text: t("신규 여부") },
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
      header: { text: t("사업장구분") },
    },
    {
      fieldName: "JOB_ROW_CD",
      visible: false,
      header: { text: t("직군") },
    },
    {
      fieldName: "STD_DUTY_CD",
      visible: false,
      header: { text: t("직렬") },
    },
    {
      fieldName: "UNT_DUTY_CD",
      visible: false,
      header: { text: t("단위업무") },
    },
    {
      fieldName: "USER_DIV",
      visible: false,
      header: { text: t("직영구분") },
    },
  ],
  columns: [],
  columnLayout: [
    "UNT_DUTY_NM",
    {
      name: "안전화 지급기준",
      direction: "horizontal",
      items: ["SHOES_COUNT", "SHOES_SEX"],
    },
    {
      name: "안전장화 지급기준",
      direction: "horizontal",
      items: ["LONG_SHOES_COUNT"],
    },
    "GLASSES_YN",
    "REMARKS",
  ],
});

grdDetailProps.columns = grdDetailProps.fields;

const grdExcelProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    rowIndicator: {
      visible: false,
    },
  },
  fields: [
    {
      fieldName: "JOB_ROW_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직군") },
      styleName: "left-column",
      mergeRule: {
        criteria: "value",
      },
    },
    {
      fieldName: "STD_DUTY_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직렬") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "UNT_DUTY_NM",
      dataType: "text",
      width: "150",
      editable: false,
      header: { text: t("단위직무") },
      styleName: "left-column",
    },
    {
      fieldName: "SHOES_COUNT",
      dataType: "text",
      width: "80",
      header: { text: t("지급수량") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "SHOES_SEX",
      dataType: "text",
      width: "60",
      header: { text: t("성별") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "LONG_SHOES_COUNT",
      dataType: "text",
      width: "140",
      header: { text: t("지급수량") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "GLASSES_YN",
      dataType: "text",
      width: "100",
      header: { text: t("도수보안경 지급기준") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "300",
      header: { text: t("비고") },
      lookupDisplay: true,
      styleName: "left-column",
    },
  ],
  columns: [],
  columnLayout: [
    "JOB_ROW_NM",
    "STD_DUTY_NM",
    "UNT_DUTY_NM",
    {
      name: "안전화 지급기준",
      direction: "horizontal",
      items: ["SHOES_COUNT", "SHOES_SEX"],
    },
    {
      name: "안전장화 지급기준",
      direction: "horizontal",
      items: ["LONG_SHOES_COUNT"],
    },
    "GLASSES_YN",
    "REMARKS",
  ],
});

grdExcelProps.columns = grdExcelProps.fields;

onMounted(async () => {
  await initCodeList();
  await setRegisItem();
  await setGridItem();
  //onButtonsClick({ id: "btnSearch" });
  grdMain.value.getGridView().filterPanel.visible = true;
  grdDetail.value.getGridView().filterPanel.visible = true;
});

const initCodeList = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHF0040_OCCUPATION_COMBO",
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
        ORGN_DIV: searchParam.ORGN_DIV,
      },
    }), // 직군
  ]);

  //-------------------조회------------------------------
  codeList.JOB_ROW_CD = [...res[0].ORESULT_CUR];

  if (!codeList.JOB_ROW_CD.some((item) => item.TXT === "전체")) {
    codeList.JOB_ROW_CD.unshift({ TXT: "전체", COD: "" });
  }
};

const setRegisItem = async () => {
  const res = await Promise.all([
    getCodeList("HHII740"), // 지급수량
  ]);

  //-------------------등록------------------------------
  codeList.SHOES_COUNT = [...res[0].ORESULT_CUR];
  codeList.SHOES_COUNT_G = [...res[0].ORESULT_CUR];

  const tempList = [...res[0].ORESULT_CUR];

  codeList.LONG_SHOES_COUNT = tempList.filter((item) =>
    item.CODE_DESC1?.includes("C")
  );
  codeList.LONG_SHOES_COUNT_G = tempList.filter((item) =>
    item.CODE_DESC1?.includes("C")
  );

  // codeList.LONG_SHOES_COUNT = [...res[0].ORESULT_CUR];
  // codeList.LONG_SHOES_COUNT_G = [...res[0].ORESULT_CUR];

  if (!codeList.SHOES_COUNT.some((item) => item.TXT === "")) {
    codeList.SHOES_COUNT.unshift({ TXT: "", COD: "" });
  }

  if (!codeList.LONG_SHOES_COUNT.some((item) => item.TXT === "")) {
    codeList.LONG_SHOES_COUNT.unshift({ TXT: "", COD: "" });
  }

  if (!codeList.SHOES_COUNT_G.some((item) => item.TXT === "")) {
    codeList.SHOES_COUNT_G.unshift({ TXT: "", COD: "" });
  }

  if (!codeList.LONG_SHOES_COUNT_G.some((item) => item.TXT === "")) {
    codeList.LONG_SHOES_COUNT_G.unshift({ TXT: "", COD: "" });
  }
};

const setGridItem = async () => {
  // const lookupList = reCodeList(codeList.SHOES_COUNT);
  // console.log("lookupList:", lookupList);

  grdDetail.value
    .getGridView()
    .setColumnProperty(
      "SHOES_COUNT",
      "lookupData",
      reCodeList(codeList.SHOES_COUNT_G)
    );
  grdDetail.value.getGridView().setColumnProperty("SHOES_COUNT", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.SHOES_COUNT_G),
  });

  grdDetail.value
    .getGridView()
    .setColumnProperty(
      "SHOES_SEX",
      "lookupData",
      reCodeList(codeList.SHOES_SEX_G)
    );
  grdDetail.value.getGridView().setColumnProperty("SHOES_SEX", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.SHOES_SEX_G),
  });

  grdDetail.value
    .getGridView()
    .setColumnProperty(
      "LONG_SHOES_COUNT",
      "lookupData",
      reCodeList(codeList.LONG_SHOES_COUNT_G)
    );
  grdDetail.value
    .getGridView()
    .setColumnProperty("LONG_SHOES_COUNT", "editor", {
      type: "dropdown",
      domainOnly: true,
      list: reCodeList(codeList.LONG_SHOES_COUNT_G),
    });

  grdDetail.value
    .getGridView()
    .setColumnProperty(
      "GLASSES_YN",
      "lookupData",
      reCodeList(codeList.TARGET_YN)
    );
  grdDetail.value.getGridView().setColumnProperty("GLASSES_YN", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.TARGET_YN),
  });

  grdMain.value.getGridView().filterPanel.visible = true;
  grdMain.value.getGridView().header.height = 50;
  grdDetail.value.getGridView().filterPanel.visible = true;
  grdDetail.value.getGridView().header.height = 50;

  setTimeout(() => {
    grdDetail.value.getGridView().refresh();
  }, 100);
};

const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    await allSearch();
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run();
  } else if (btn.id === "btnNewJobSearch") {
    hLTHF0040Popup.value.openPopup();
  } else if (btn.id === "btnTotalStatusSearch") {
    await onExceldown();
  }
};

const btnSearch = async () => {
  await allSearch();
};

const btnUpdate = async () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(afterSave)
    .run();
};

const btnNewJobSearch = async () => {
  hLTHF0040Popup.value.openPopup();
};

const btnTotalStatusSearch = async () => {
  await onExceldown();
};

//저장관련 로직 시작
const beforeSave = () => {
  let checkedData = grdDetail.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("저장할 데이터를 선택해주세요."));
    return false;
  }
  return true;
};

const saveData = () => {
  let temp = null;
  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true);

  for (let rowIdx of checkedRows) {
    let data = grdDetail.value.getDataProvider().getJsonRow(rowIdx);
    let saveParam = [];
    let saveData = {
      CMPNY_DIV: searchParam.CMPNY_DIV,
      JOB_ROW_CD: data.JOB_ROW_CD,
      STD_DUTY_CD: data.STD_DUTY_CD,
      UNT_DUTY_CD: data.UNT_DUTY_CD,
      USER_DIV: data.USER_DIV,
      SHOES_COUNT: data.SHOES_COUNT,
      SHOES_SEX: data.SHOES_SEX,
      LONG_SHOES_COUNT: data.LONG_SHOES_COUNT,
      GLASSES_YN: data.GLASSES_YN,
      REMARKS: data.REMARKS,
      USER_ID: userStore.userId,
    };
    saveParam.push(saveData);

    // console.log("data : ", data);
    // console.log("saveData : ", saveData);

    temp = commonExecuteApi({
      queryId: "HLTHF0040_SAVE_01",
      list: saveParam,
    });
  }

  return temp;
};

const shoesBulkSaveData = () => {
  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true);

  if (checkedRows.length === 0) {
    Message.warn(t("일괄 변경할 데이터를 선택해주세요."));
    return false;
  }

  for (let rowIdx of checkedRows) {
    grdDetail.value
      .getDataProvider()
      .setValue(rowIdx, "SHOES_COUNT", itemField.SHOES_COUNT);
    grdDetail.value
      .getDataProvider()
      .setValue(rowIdx, "SHOES_SEX", itemField.SHOES_SEX);
  }

  return true;
};

const glassesBulkSaveData = () => {
  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true);

  if (checkedRows.length === 0) {
    Message.warn(t("일괄 변경할 데이터를 선택해주세요."));
    return false;
  }

  for (let rowIdx of checkedRows) {
    grdDetail.value
      .getDataProvider()
      .setValue(rowIdx, "GLASSES_YN", itemField.TARGET_YN);
  }

  return true;
};

const afterSave = (res) => {
  const gridView = grdDetail.value.getGridView();

  gridView.setAllCheck(false);
  gridView.checkAll(false);
  //onButtonsClick({ id: "btnSearch" });
};

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow);
  // hLTHF0040Popup.value.openPopup(data.DIVISION, '' ,data)
};

const allSearch = async () => {
  const mainRes = await commonSearchApi({
    queryId: "HLTHF0040_SEARCH_MAIN",
    param: searchParam,
  });

  // let data = grdMain.value.getDataProvider().getJsonRow(0);
  let data = mainRes.ORESULT_CUR[0];

  let detailParam = {
    CMPNY_DIV: searchParam.CMPNY_DIV,
    ORGN_DIV: data.ORGN_DIV,
    JOB_ROW_CD: data.JOB_ROW_CD,
    STD_DUTY_CD: data.STD_DUTY_CD,
  };
  const detailRes = await commonSearchApi({
    queryId: "HLTHF0040_SEARCH_DETAIL",
    param: detailParam,
  });

  await grdMain.value.getDataProvider().setRows(mainRes.ORESULT_CUR);
  await grdDetail.value.getDataProvider().setRows(detailRes.ORESULT_CUR);

  grdMain.value.getGridView().setCurrent({ dataRow: 0, column: "STD_DUTY_NM" });
  grdMain.value.getGridView().setFocus(true);

  grdDetail.value
    .getGridView()
    .setCurrent({ dataRow: 0, column: "UNT_DUTY_NM" });
  grdDetail.value.getGridView().setFocus(true);

  grdDetail.value
    .getGridView()
    .setRowStyleCallback(function (grid, item, fixed) {
      let ret = { style: {} }; // background: '#eff8fd'
      if (grid.getValue(item.index, "YN") == "N") {
        ret.style = { background: "#FF8888" };
      }
      return ret;
    });

  await nextTick();
};

const allSearchFind = async (selectRow) => {
  searchParam.ORGN_DIV = selectRow.USER_DIV;
  searchParam.JOB_ROW_CD = "";

  const mainRes = await commonSearchApi({
    queryId: "HLTHF0040_SEARCH_MAIN",
    param: searchParam,
  });

  const mainIndex = mainRes.ORESULT_CUR.findIndex(
    (item) =>
      item.STD_DUTY_CD === selectRow.STD_DUTY_CD &&
      item.STD_DUTY_NM === selectRow.STD_DUTY_NM
  );

  let dataDetail = mainRes.ORESULT_CUR[mainIndex >= 0 ? mainIndex : 0];

  let detailParam = {
    CMPNY_DIV: searchParam.CMPNY_DIV,
    ORGN_DIV: dataDetail.ORGN_DIV,
    JOB_ROW_CD: dataDetail.JOB_ROW_CD,
    STD_DUTY_CD: dataDetail.STD_DUTY_CD,
  };
  const detailRes = await commonSearchApi({
    queryId: "HLTHF0040_SEARCH_DETAIL",
    param: detailParam,
  });

  const detailIndex = detailRes.ORESULT_CUR.findIndex(
    (item) => item.UNT_DUTY_CD === selectRow.UNT_DUTY_CD
  );

  await grdMain.value.getDataProvider().setRows(mainRes.ORESULT_CUR);
  await grdDetail.value.getDataProvider().setRows(detailRes.ORESULT_CUR);

  grdMain.value
    .getGridView()
    .setCurrent({ dataRow: mainIndex, column: "STD_DUTY_NM" });
  grdMain.value.getGridView().setFocus(true);

  grdDetail.value
    .getGridView()
    .setCurrent({ dataRow: detailIndex, column: "UNT_DUTY_NM" });
  grdDetail.value.getGridView().setFocus(true);
};

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHF0040_SEARCH_MAIN",
    param: searchParam,
  });
};

const afterSearch = async (res, auto = true) => {
  await grdMain.value.getDataProvider().clearRows();
  await grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  if (auto) {
    new queryFlowHelper(vm, t)
      .setQuery(searchDataDetail)
      .setAfter(afterSearchDetail)
      .run();
  }
  grdMain.value.getGridView().setCurrent({ dataRow: 0, column: "STD_DUTY_NM" });
  grdMain.value.getGridView().setFocus(true);
};

const searchDataDetail = (row) => {
  let rodIndex = row ? row : 0;

  let data = grdMain.value.getDataProvider().getJsonRow(rodIndex);

  let detailParam = {
    CMPNY_DIV: searchParam.CMPNY_DIV,
    ORGN_DIV: data.ORGN_DIV,
    JOB_ROW_CD: data.JOB_ROW_CD,
    STD_DUTY_CD: data.STD_DUTY_CD,
  };

  return commonSearchApi({
    queryId: "HLTHF0040_SEARCH_DETAIL",
    param: detailParam,
  });
};

const afterSearchDetail = async (res) => {
  await grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR);
  grdDetail.value
    .getGridView()
    .setCurrent({ dataRow: 0, column: "UNT_DUTY_NM" });
  // grdDetail.value.getGridView().setFocus(true);

  grdDetail.value
    .getGridView()
    .setRowStyleCallback(function (grid, item, fixed) {
      let ret = { style: {} }; // background: '#eff8fd'
      if (grid.getValue(item.index, "YN") == "N") {
        ret.style = { background: "#FF8888" };
      }
      return ret;
    });

  await nextTick();
};

const changeOrgnDiv = async () => {
  searchParam.JOB_ROW_CD = "";
  await initCodeList();
  await onButtonsClick({ id: "btnSearch" });
  await nextTick();
};

const onCellClicked = async (grid, clickData) => {
  if (clickData.itemIndex) {
    const gridView = grdDetail.value.getGridView();

    gridView.setAllCheck(false);
    gridView.checkAll(false);

    await nextTick();

    // console.log("asdawdad : ", clickData.itemIndex);

    await new queryFlowHelper(vm, t)
      .setQuery(() => searchDataDetail(clickData.itemIndex))
      .setAfter(afterSearchDetail)
      .run();
  }
};

const selectedJOb = async (selectRow) => {
  //await findGrid(selectRow)
  await allSearchFind(selectRow);
  await nextTick();

  //Message.warn(t("검색 결과가 없습니다."));
};

const findGrid = async (selectRow) => {
  searchParam.ORGN_DIV = selectRow.USER_DIV;

  const matchMain = await findMainGrd(selectRow);
  let matchDetail = null;

  if (matchMain >= 0) {
    matchDetail = await findDetailGrd(selectRow, matchMain);
  }

  if (matchMain && matchDetail) {
    return true;
  }
  return false;
};

const runQueryFlowHelper = () => {
  return new Promise((resolve) => {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter((res) => {
        afterSearch(res, false); // ✅ 기존 처리 유지
        resolve(res); // ✅ `queryFlowHelper` 실행 완료 후 resolve 호출
      })
      .run();
  });
};

const runQueryFlowHelperDetail = (rowIndex) => {
  return new Promise((resolve) => {
    new queryFlowHelper(vm, t)
      .setQuery(() => searchDataDetail(rowIndex))
      .setAfter((res) => {
        afterSearchDetail(res); // ✅ 기존 처리 유지
        resolve(res); // ✅ `queryFlowHelper` 실행 완료 후 resolve 호출
      })
      .run();
  });
};

const findDetailGrd = async (selectRow, rowIndex) => {
  // ✅ queryFlowHelper 실행 후 완료될 때까지 대기
  await runQueryFlowHelperDetail(rowIndex);

  const fields = grdDetail.value.getDataProvider().getOrgFieldNames();
  const rowCnt = grdDetail.value.getGridView().getItemCount();

  for (let row = 0; row < rowCnt; row++) {
    let matchCode = false;
    let matchValue = false;

    for (const field of fields) {
      const cellValue = grdDetail.value.getDataProvider().getValue(row, field);

      if (cellValue === null) continue;

      if (field === "UNT_DUTY_CD" && cellValue === selectRow.UNT_DUTY_CD) {
        matchCode = true;
      }

      if (
        typeof cellValue === "string" &&
        cellValue.includes(selectRow.UNT_DUTY_NM)
      ) {
        matchValue = true;
      }

      if (matchCode && matchValue) {
        grdDetail.value
          .getGridView()
          .setCurrent({ dataRow: row, field: field });
        return true;
      }
    }
  }
  return false;
};

const onExceldown = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHF0040_SEARCH_EXCEL01",
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
      },
    }), // 직무
    commonSearchApi({
      queryId: "HLTHF0040_SEARCH_EXCEL02",
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
      },
    }), // 부서
  ]);

  grdExcel01.value.setBindingColumn(
    "SHOES_COUNT",
    codeList.SHOES_COUNT_G,
    "COD",
    "TXT"
  );
  grdExcel01.value.setBindingColumn(
    "SHOES_SEX",
    codeList.SHOES_SEX_G,
    "COD",
    "TXT"
  );
  grdExcel01.value.setBindingColumn(
    "LONG_SHOES_COUNT",
    codeList.LONG_SHOES_COUNT_G,
    "COD",
    "TXT"
  );
  grdExcel01.value.setBindingColumn(
    "GLASSES_YN",
    codeList.TARGET_YN,
    "COD",
    "TXT"
  );

  grdExcel02.value.setBindingColumn(
    "SHOES_COUNT",
    codeList.SHOES_COUNT_G,
    "COD",
    "TXT"
  );
  grdExcel02.value.setBindingColumn(
    "SHOES_SEX",
    codeList.SHOES_SEX_G,
    "COD",
    "TXT"
  );
  grdExcel02.value.setBindingColumn(
    "LONG_SHOES_COUNT",
    codeList.LONG_SHOES_COUNT_G,
    "COD",
    "TXT"
  );
  grdExcel02.value.setBindingColumn(
    "GLASSES_YN",
    codeList.TARGET_YN,
    "COD",
    "TXT"
  );

  await grdExcel01.value.getDataProvider().setRows(res[0].ORESULT_CUR);
  await grdExcel02.value.getDataProvider().setRows(res[1].ORESULT_CUR);

  // console.log(
  //   "grdExcel01.value.getGridView() : ",
  //   grdExcel01.value.getGridView()
  // );

  grdExcel01.value.getGridView().exportGrid({
    type: "excel",
    target: "local",
    lookupDisplay: true,
    fileName:
      "안전보호구_지급기준관리(직무관리)_" +
      dayjs(new Date()).format("YYYY-MM") +
      ".xlsx", // 저장될 파일 name
    progressMessage: "엑셀 다운로드중입니다.", // 엑셀 다운로드 하는 동안 progressMessage 표시
    indicator: "hidden", // indidator 영역 표시
    header: "visible", // 헤더 표시
    footer: "visible", // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    exportGrids: [
      { grid: grdExcel01.value.getGridView(), sheetName: "직영" },
      { grid: grdExcel02.value.getGridView(), sheetName: "사내협력사" },
    ],
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t("엑셀 다운로드가 완료되었습니다."));
    },
  });
};

defineExpose({
  btnSearch,
  btnUpdate,
  btnNewJobSearch,
  btnTotalStatusSearch,
});
</script>

<template>
  <v-card class="pa-0 fil-height">
    <v-card-text class="pa-3 pt-3 content-area">
      <div class="d-flex flex-column fill-height">
        <div class="d-flex flex-area-gap align-left titleArea">
          <v-sheet class="custom-flex-3 align-left">
            <span class="pa-1 menuTitle"> 조회조건 </span>
          </v-sheet>
          <v-sheet class="custom-flex-2 align-left titleArea">
            <span class="pa-1 menuTitle"> 안전화지급기준 일괄등록 </span>
          </v-sheet>
          <v-sheet class="custom-flex-1 align-left titleArea">
            <span class="pa-1 menuTitle"> 도수보안경지급기준 일괄등록 </span>
          </v-sheet>
        </div>
        <div class="d-flex flex-area-gap mb-1 align-left">
          <v-sheet class="searchArea d-flex flex-gap custom-flex-3">
            <div class="custom-flex-1 d-flex">
              <i-label class="flex-grow-1 d-flex">
                <span
                  class="form-label pr-2 pt-2"
                  :style="{
                    display: 'block',
                    width: '50px',
                    margin: '0 8px 0 0',
                  }"
                >
                  {{ $t("구분 ") }}
                </span>
                <v-radio-group
                  v-model="searchParam.ORGN_DIV"
                  inline
                  class="radioStyle"
                  @update:modelValue="changeOrgnDiv"
                >
                  <v-radio
                    v-for="item in codeList.ORGN_DIV"
                    :key="item"
                    :value="item.COD"
                    :label="item.TXT"
                  />
                </v-radio-group>
              </i-label>
            </div>
            <i-select
              :label="$t('직군')"
              :items="codeList.JOB_ROW_CD"
              item-title="TXT"
              item-value="COD"
              labelWidth="50px"
              v-model="searchParam.JOB_ROW_CD"
              class="custom-flex-1"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
            <span class="custom-flex-1" />
          </v-sheet>
          <v-sheet class="searchArea d-flex flex-gap custom-flex-2">
            <i-select
              :label="$t('지급수량')"
              :items="codeList.SHOES_COUNT"
              item-title="TXT"
              item-value="COD"
              labelWidth="50px"
              v-model="itemField.SHOES_COUNT"
              class="custom-flex-2"
            />
            <i-select
              :label="$t('성별')"
              :items="codeList.SHOES_SEX"
              item-title="TXT"
              item-value="COD"
              labelWidth="50px"
              v-model="itemField.SHOES_SEX"
              class="custom-flex-2"
            />
            <v-btn
              prepend-icon="mdi-plus"
              class="custom-flex-1"
              style="color: #fff; background: #1a40c7; padding: 4px"
              @click="shoesBulkSaveData"
            >
              일괄등록
            </v-btn>
          </v-sheet>
          <v-sheet class="searchArea d-flex flex-gap custom-flex-1">
            <i-select
              :label="$t('지급기준')"
              :items="codeList.TARGET_YN"
              item-title="TXT"
              item-value="COD"
              labelWidth="50px"
              class="custom-flex-2"
              v-model="itemField.TARGET_YN"
            />
            <span style="display: inline-block; width: 8px"></span>
            <v-btn
              prepend-icon="mdi-plus"
              class="custom-flex-1"
              style="color: #fff; background: #1a40c7; padding: 4px"
              @click="glassesBulkSaveData"
            >
              일괄등록
            </v-btn>
          </v-sheet>
        </div>
        <div class="h-grow d-flex flex-area-gap">
          <v-sheet class="pa-0 h-auto custom-flex-1">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            >
            </RealGrid>
          </v-sheet>
          <v-sheet class="pa-0 h-auto custom-flex-3">
            <RealGrid
              ref="grdDetail"
              :grid-view-option="grdDetailProps.gridViewOption"
              :fields="grdDetailProps.fields"
              :columns="grdDetailProps.columns"
              :column-layout="grdDetailProps.columnLayout"
              @onCellDblClicked="onCellDblClicked"
            />
            <RealGrid
              v-show="false"
              ref="grdExcel01"
              :grid-view-option="grdExcelProps.gridViewOption"
              :fields="grdExcelProps.fields"
              :columns="grdExcelProps.columns"
              :column-layout="grdExcelProps.columnLayout"
            />
            <RealGrid
              v-show="false"
              ref="grdExcel02"
              :grid-view-option="grdExcelProps.gridViewOption"
              :fields="grdExcelProps.fields"
              :columns="grdExcelProps.columns"
              :column-layout="grdExcelProps.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <HLTHF0040Popup @selected="selectedJOb" ref="hLTHF0040Popup"></HLTHF0040Popup>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // height: calc(100vh - (205px - 12px));
  height: calc(100vh - 215px);
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

.flex-area-gap {
  gap: 4px;
}

.flex-gap {
  gap: 10px;
  flex-wrap: wrap;
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 3 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 10px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-3 {
  /* width: calc(25% - 0px) !important; */
  flex: 5 1 0 !important;
  flex-basis: calc(0% + 10px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.form-label {
  color: #222;
  font-size: 14px;
  font-weight: 400;
}

::v-deep .v-radio__input {
  width: 20px !important;
  height: 20px !important; /* 버튼 크기 */
  margin-top: 0 !important; /* 버튼과 텍스트 높이 일치시키기 */
}

::v-deep .v-radio__input input {
  height: 20px !important;
  width: 20px !important;
}

::v-deep .v-label {
  font-size: 14px !important;
  line-height: 20px !important; /* 텍스트의 높이를 20px로 일치시킴 */
}

.menuTitle {
  text-align: left !important;
}

.align-left {
  justify-content: flex-start !important;
  align-items: flex-start !important;
}

.titleArea {
  padding-right: 12px;
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

v-sheet {
  width: 100%;
}
</style>