<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  computed,
  onBeforeMount,
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
import ApprovalPopup from "@/components/popup/ApprovalPopup.vue"; //결재

const grdMain = ref(null);
const grdDetail = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const clickIndex = ref(null);
const subTitle = ref("");
const approvalPopup = ref(null);

const props = defineProps({
  bsnsCd: String,
  deptCd: String,
  cmpnyCd: String,
  asgnCd: String,
  outYn: String,
  dutyYn: String,
  isAdmin: Number,
});

const codeList = reactive({
  STATUS: [
    { COD: "%", TXT: "전체" },
    { COD: " ", TXT: "미신청" },
    { COD: "1", TXT: "신청중" },
    { COD: "2", TXT: "결재중" },
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
  GLASSES_KIND: [],
  EYESIGHT_PLACE: [],
  GLASSES_MODEL: [],
  USER_DIV: [
    { COD: "A", TXT: "직영" },
    { COD: "B", TXT: "사내협력사" },
  ],
  REASON: [],
});

const searchParam = reactive({
  CMPNY_DIV: props.cmpnyCd,
  BSNS_CD: "",
  YEAR: "",
  REQ_DIV: "B",
  REQ_DT: "",
  STATUS: "%",
  DUTY_YN: "N",
  OUT_YN: (userStore.userDiv = "A" ? "N" : "Y"),
});

const periodParam = reactive({
  ST_DATE: "",
  EN_DATE: "",
  RECEIVE_ST_DATE: "",
  RECEIVE_EN_DATE: "",
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
      header: { text: t("대상여부") },
      styleName: "center-column",
    },
    {
      fieldName: "BE_REMARKS",
      dataType: "text",
      width: "40",
      editable: false,
      visible: false,
      header: { text: t("지급 이력") },
      styleName: "center-column",
      button: "action",
      buttonVisibility: "always",
    },
    {
      fieldName: "STATUS",
      dataType: "text",
      width: "70",
      editable: false,
      lookupDisplay: true,
      header: { text: t("신청상태") },
      styleName: "center-column",
    },
    {
      fieldName: "REQ_DT",
      dataType: "text",
      width: "70",
      editable: false,
      visible: false,
      lookupDisplay: true,
      header: { text: t("신청일자") },
      styleName: "center-column",
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
    },
    {
      fieldName: "GLASSES_VEND",
      dataType: "text",
      width: "200",
      header: {
        text: t("도수보안경 종류"),
      },
      lookupDisplay: true,
      styleName: "left-column editable_column",
    },
    // {
    //   fieldName: "GLASSES_COUNT",
    //   dataType: "text",
    //   width: "60",
    //   editable: false,
    //   //visible: false,
    //   header: {
    //     text: t("신청수량"),
    //   },
    //   styleName: "center-column",
    // },
    {
      fieldName: "REASON",
      dataType: "text",
      width: "100",
      header: {
        text: t("신청 사유"),
      },
      lookupDisplay: true,
      styleName: "center-column editable_column",
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
      fieldName: "ASGN_CD",
      visible: false,
      header: { text: t("조직코드") },
    },
    {
      fieldName: "REQ_DIV",
      visible: false,
      header: { text: t("신청구분") },
    },
    {
      fieldName: "YEAR",
      visible: false,
      header: { text: t("년도") },
    },
    {
      fieldName: "GLASSES_KIND",
      visible: false,
      header: { text: t("도수보안경코드") },
    },
    {
      fieldName: "VEND_NAME",
      visible: false,
      header: { text: t("납품처코드") },
    },
    {
      fieldName: "REQ_CHA",
      visible: false,
      header: { text: t("신청시기") },
    },
    {
      fieldName: "COM_ENT_DATE",
      visible: false,
      header: { text: t("입사일자") },
    },
    {
      fieldName: "GLASSES_COUNT",
      visible: false,
      header: { text: t("신청수량") },
    },
    {
      fieldName: "EYESIGHT_YN",
      visible: false,
      header: { text: t("시력검사여부") },
    },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

const grdDetailProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    headerHeight: 60,
    rowIndicator: {
      visible: false,
    },
  },
  fields: [
    {
      fieldName: "REQ_DT",
      dataType: "text",
      width: "80",
      editable: false,
      header: { text: t("신청일자") },
      styleName: "center-column",
    },
    {
      fieldName: "STATUS_DES",
      dataType: "text",
      width: "80",
      editable: false,
      lookupDisplay: true,
      header: { text: t("진행상태") },
      styleName: "center-column",
    },
    {
      fieldName: "REASON",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("신청사유") },
      styleName: "center-column",
    },
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("비고") },
      styleName: "left-column",
    },

    {
      fieldName: "CMPNY_DIV",
      visible: false,
      header: { text: t("사업장") },
    },
    {
      fieldName: "YEAR",
      visible: false,
      header: { text: t("년도") },
    },
    {
      fieldName: "REQ_DIV",
      visible: false,
      header: { text: t("신청구분") },
    },
    {
      fieldName: "REQ_CHA",
      visible: false,
      header: { text: t("신청시기") },
    },
    {
      fieldName: "USER_DIV",
      visible: false,
      header: { text: t("직영구분") },
    },
    {
      fieldName: "EMP_NO",
      visible: false,
      header: { text: t("사원번호") },
    },
    {
      fieldName: "STATUS",
      visible: false,
      header: { text: t("진행상태 코드") },
    },
    {
      fieldName: "COM_ENT_DATE",
      visible: false,
      header: { text: t("입사일자") },
    },
    {
      fieldName: "HISTORY_CNT",
      visible: false,
      header: { text: t("지급이력") },
    },
  ],
  columns: [],
});

grdDetailProps.columns = grdDetailProps.fields;

const onCellClicked = async (grid, clickData) => {
  if (clickIndex.value === clickData.itemIndex) {
    return;
  }

  clickIndex.value = clickData.itemIndex;
  const gridView = grdDetail.value.getGridView();

  gridView.setAllCheck(false);
  gridView.checkAll(false);

  await nextTick();

  const res = await searchDataDetail(clickData.itemIndex);

  console.log('detail : ', res)

  await grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR);
  subTitle.value =
    "개인별 신청이력 - " +
    grdMain.value.getDataProvider().getValue(clickData.itemIndex, "EMP_NM");
};

const searchDataDetail = async (row) => {

  let rodIndex = row ? row : 0;

  let data = grdMain.value.getDataProvider().getJsonRow(rodIndex);
  let detailParam = {
    CMPNY_DIV: props.cmpnyCd,
    YEAR: data.YEAR,
    REQ_DIV: data.REQ_DIV,
    EMP_NO: data.EMP_NO,
  };
  return commonSearchApi({
    queryId: "HLTHC0010_SEARCH_10",
    param: detailParam,
  });
};

const cancelApllication = async () => {
    if (props.isAdmin <= 0) {
    return Message.warn(
      t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
    );
  }
  new deleteFlowHelper(vm, t)
    .setBefore(beforeDelete)
    .setQuery(deleteData)
    .setAfter(afterDelete)
    .run();
};

const beforeDelete = () => {
  let checkedData = grdDetail.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("신청취소 할 데이터를 선택해주세요."));

    return false;
  }

  const provider = grdDetail.value.getDataProvider();

  for (let itemIndex of checkedData) {
    if (
      (Number(provider.getValue(
        grdDetail.value.getGridView().getDataRow(itemIndex),
        "STATUS"
      )) >= 2 ) 
    ) {
      Message.warn(t("결재상신 이후에는 신청취소를 할 수 없습니다."));
      return false;
    }
  }

  return true;
};

const deleteData = async () => {
  let temp = null;
  let checkedRows = grdDetail.value.getGridView().getCheckedRows(true);
  for (let rowIdx of checkedRows) {
    let data = grdDetail.value.getDataProvider().getJsonRow(rowIdx);
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
  return temp;
};

const afterDelete = async () => {
  const gridView = grdMain.value.getGridView();
  const orignIndex = gridView.getCurrent().itemIndex;
  await searchData(orignIndex);
};

const displaySubTitle = computed(() => subTitle.value);

const initCodeList = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_GLASSES",
      param: {
        CMPNY_DIV: props.cmpnyCd,
      },
    }), // 도수보안경
    getCodeList("HHIIG30C"), // 신청 사유
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_PLACE",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv
      },
    }),
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_GLASSES_MODEL",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv
      },
    }),
  ]);

  codeList.GLASSES_KIND = [...res[0].ORESULT_CUR];

  if (!codeList.GLASSES_KIND.some((item) => item.TXT === "")) {
    codeList.GLASSES_KIND.unshift({ TXT: "", COD: "" });
  }

  codeList.EYESIGHT_PLACE = [...res[2].ORESULT_CUR];
  codeList.GLASSES_MODEL = res[3].ORESULT_CUR;

  const tempList = [...res[1].ORESULT_CUR];
 
  codeList.REASON = tempList.filter(
    (item) => item.CODE_DESC1?.includes("B")
  );

  grdMain.value.setBindingColumn("STATUS", codeList.GRID_STATUS, "COD", "TXT");
  grdMain.value.setBindingColumn("USER_DIV", codeList.USER_DIV, "COD", "TXT");
  grdDetail.value.setBindingColumn("REASON", codeList.REASON, "COD", "TXT");
};

const reCodeList = (list) => {
  const newArray = list.map((item) => ({
    value: item.COD,
    text: item.TXT,
  }));

  return newArray;
};

const setGridItem = async () => {
  grdMain.value
    .getGridView()
    .setColumnProperty(
      "GLASSES_VEND",
      "lookupData",
      reCodeList(codeList.GLASSES_KIND)
    );
  grdMain.value.getGridView().setColumnProperty("GLASSES_VEND", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.GLASSES_KIND),
  });

  grdMain.value
    .getGridView()
    .setColumnProperty("EYESIGHT_PLACE", "lookupData", reCodeList(codeList.EYESIGHT_PLACE));
  grdMain.value.getGridView().setColumnProperty("EYESIGHT_PLACE", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.EYESIGHT_PLACE),
  });

  grdMain.value
    .getGridView()
    .setColumnProperty("REASON", "lookupData", reCodeList(codeList.REASON));
  grdMain.value.getGridView().setColumnProperty("REASON", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.REASON),
  });


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
      if (
        //fieldName === "GLASSES_VEND" ||
        fieldName === "EYESIGHT_PLACE"
      ) {
        provider.setValue(itemIndex, "checked", "Y");
      }

      if (fieldName === "GLASSES_VEND") {
        if(provider.getValue(row, "GLASSES_VEND") === ''){
          provider.setValue(itemIndex, "GLASSES_MODEL", '');
        }else{
          const shoes = provider.getValue(row, "GLASSES_VEND").split("-");
          provider.setValue(itemIndex, "GLASSES_KIND", shoes[0]);
          provider.setValue(itemIndex, "VEND_NAME", shoes[1]);
        }
        provider.setValue(itemIndex, "checked", "Y");
      }

    }, 0);
  };

  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);
};

onMounted(async () => {
  grdMain.value.getGridView().filterPanel.visible = true;
  grdDetail.value.getGridView().filterPanel.visible = true;
});

const searchData = async (index) => {
  grdMain.value.getDataProvider().clearRows();
  grdDetail.value.getDataProvider().clearRows();

  const mainRes = await commonSearchApi({
    queryId: "HLTHC0010_SEARCH_04",
    param: {
      CMPNY_DIV: props.cmpnyCd,
      DEPT_CD: props.deptCd,
      YEAR: searchParam.YEAR,
      REQ_DIV: searchParam.REQ_DIV,
      REQ_DT: searchParam.REQ_DT.replaceAll("-", ""),
      STATUS: searchParam.STATUS,
    },
  });

  if (mainRes.ORESULT_CUR.length > 0) {
    let data = mainRes.ORESULT_CUR[index ? index : 0];
    let detailParam = {
      CMPNY_DIV: props.cmpnyCd,
      YEAR: data.YEAR,
      REQ_DIV: data.REQ_DIV,
      EMP_NO: data.EMP_NO,
    };
    const detailRes = await commonSearchApi({
      queryId: "HLTHC0010_SEARCH_10",
      param: detailParam,
    });

    await grdMain.value.getDataProvider().setRows(mainRes.ORESULT_CUR);
    await grdDetail.value.getDataProvider().setRows(detailRes.ORESULT_CUR);

    grdMain.value
      .getGridView()
      .setCurrent({ dataRow: index ? index : 0, column: "EMP_NO" });
    grdMain.value.getGridView().setFocus(true);
    clickIndex.value = index ? index : 0;
    subTitle.value =
      "개인별 신청이력 - " +
      grdMain.value.getDataProvider().getValue(index ? index : 0, "EMP_NM");

    grdDetail.value.getGridView().setCurrent({ dataRow: 0, column: "REQ_DT" });
    grdDetail.value.getGridView().setFocus(true);
  } else {
    await grdMain.value.getDataProvider().setRows(mainRes.ORESULT_CUR);
    Message.warn(t("데이터가 없습니다."));
  }

  await nextTick();
};

const setGrid = async () => {
  await initCodeList();
  await setGridItem();
};

const setPriod = async () => {
  searchParam.YEAR = dayjs().year();
  searchParam.REQ_DT = dayjs().format("YYYY-MM-DD");

  await getReqestPriod();
};

const getReqestPriod = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHB0010_SEARCH_03",
      param: {
        CMPNY_DIV: props.cmpnyCd,
      },
    }),
  ]);

  periodParam.ST_DATE = res[0].ORESULT_CUR[0].ST_DATE;
  periodParam.EN_DATE = res[0].ORESULT_CUR[0].EN_DATE;
  periodParam.RECEIVE_ST_DATE = res[0].ORESULT_CUR[0].RECEIVE_ST_DATE;
  periodParam.RECEIVE_EN_DATE = res[0].ORESULT_CUR[0].RECEIVE_EN_DATE;
};

const saveData = async () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveDatas)
    .setAfter(afterSave)
    .run();
};

const beforeSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("저장할 데이터를 선택해주세요."));
    return false;
  }
  const provider = grdMain.value.getDataProvider();

  for (let index of checkedData) {
    let rowIndex = grdMain.value.getGridView().getDataRow(index)

    if (
      provider.getValue(
        rowIndex,
        "EYESIGHT_PLACE"
      ) === "" ||
      provider.getValue(
        rowIndex,
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
        rowIndex,
        "GLASSES_VEND"
      ) === "" ||
      provider.getValue(
        rowIndex,
        "GLASSES_VEND"
      ) === null
    ) {
      Message.warn(t("도수보안경을 선택해주세요."));
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: index, column: "GLASSES_VEND" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }

    if (
      provider.getValue(
        rowIndex,
        "REASON"
      ) === "" ||
      provider.getValue(
        rowIndex,
        "REASON"
      ) === null
    ) {
      Message.warn(t("신청사유를 입력해주세요."));
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: index, column: "REASON" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }

    // 직영이거나 협력사일 경우 협력사 코드가 'A'로 시작되는 협력사만 신청 가능

    // if(!(provider.getValue(rowIndex, 'USER_DIV') === 'A' ||
    //    provider.getValue(rowIndex, 'ASGN_CD').substring(0,1) === 'A')
    // ){
    //   Message.warn(t("사내협력사/프로젝트 협력사만 신청가능합니다."));  
    //   return false;
    // }
    if (
      (Number(provider.getValue(grdMain.value.getGridView().getDataRow(index),"STATUS"))
        >= 2 ) 
    ) {
      Message.warn(t("결재상신 이후에는 수정 할 수 없습니다."));
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: index, column: "STATUS" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }
  }

  return true;
};

const saveDatas = () => {
  let temp = null;
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true);

  let saveParam = [];
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    
    let saveData = {
      CMPNY_DIV: searchParam.CMPNY_DIV,
      YEAR: searchParam.YEAR,
      REQ_DIV: searchParam.REQ_DIV,
      REQ_CHA: data.REQ_CHA,
      EMP_NO: data.EMP_NO,
      BSNS_CD: props.bsnsCd,
      DEPT_CD: props.deptCd,
      DIVISION: "B",
      GLASSES_KIND: data.GLASSES_KIND,
      EYESIGHT_PLACE: data.EYESIGHT_PLACE,
      GLASSES_COUNT: data.GLASSES_COUNT,
      DUTY_YN: data.DUTY_YN,
      USER_DIV: data.USER_DIV,
      EYESIGHT_YN: data.EYESIGHT_YN,
      EYESIGHT_PLACE: data.EYESIGHT_PLACE,
      REASON: data.REASON,
      SUPPLIES: null,
      VEND_NAME: data.VEND_NAME,
      USER_ID: userStore.userId,
    };
    saveParam.push(saveData);
  }
  temp = commonExecuteApi({
      queryId: "HLTHC0010_SAVE_01",
      list: saveParam,
    });

  console.log('temp : ', temp)

  return temp;
};

const afterSave = async (res) => {
  const gridView = grdMain.value.getGridView();

  let detailParam = {
    CMPNY_DIV: props.cmpnyCd,
    YEAR: res.list[0].YEAR,
    REQ_DIV: res.list[0].REQ_DIV,
    EMP_NO: res.list[0].EMP_NO,
  };
  const detailRes = await commonSearchApi({
    queryId: "HLTHC0010_SEARCH_10",
    param: detailParam,
  });

  await grdDetail.value.getDataProvider().setRows(detailRes.ORESULT_CUR);

  grdDetail.value.getGridView().setCurrent({ dataRow: 0, column: "REQ_DT" });
  grdDetail.value.getGridView().setFocus(true);

  grdMain.value
    .getDataProvider()
    .setValue(gridView.getCurrent().itemIndex, "STATUS", "1");

  //   grdMain.value
  //     .getGridView()
  //     .setCurrent({ dataRow: orignIndex, column: "EMP_NO" });
  //   grdMain.value.getGridView().setFocus(true);

  gridView.setAllCheck(false);
  gridView.checkAll(false);
};

const btnApproval = async () => {
  const before = await beforeApproval();

  if (!before) return;

  const res = await searchApproval();

  await afterApproval(res);
};

const beforeApproval = async () => {
  const rowCnt = grdMain.value.getDataProvider().getRowCount();

  if (rowCnt <= 0) {
    Message.warn(t("데이터가 없습니다."));
    return false;
  }

  const statusYn = grdMain.value.getDataProvider().searchDataRow({
    fields: ["STATUS"],
    values: ["1"],
  });

  if (statusYn < 0) {
    Message.warn(t("신청할 대상이 없습니다."));
    return false;
  }

  return true;
};

const searchApproval = async () => {
  return commonSearchApi({
    queryId: "HLTHC0010_SEARCH_07",
    param: {
      CMPNY_DIV: props.cmpnyCd,
      YEAR: searchParam.YEAR,
      REQ_DIV: searchParam.REQ_DIV,
      REQ_DT: searchParam.REQ_DT.replaceAll("-", ""),
      DEPT_CD: props.deptCd,
    },
  });
};

const afterApproval = async (res) => {
  approvalPopup.value.openPopup({
    CLSS_ID: "HLTHC0010",
    TITLE: "부서별 도수보안경 수시신청",
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
  const asgnArray = data[0].ASGN_FULL_NM.split("-");

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
      <span>도수보안경 수시 신청서</span>
      <span>(수시)</span>
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
        <th class="Content_header" style="width: 15%">시력검사장소</th>
        <th class="Content_header" style="width: 15%">보안경종류</th>
        <th class="Content_header" style="width: 5%">수량</th>
        <th class="Content_header" style="width: 10%">사유</th>
        <th class="Content_header" style="width: 15%">비고</th>
      </tr>`;

  for (let i in data) {
    htmlReport +=
      `<tr>
        <td class="Content" style="width : 5%" >` +
      1 +
      `</td>
        <td class="Content" style="width: 20%; justify-items: start;">` +
      asgnArray[i] +
      `</td>
        <td class="Content" style="width: 10%">` +
      isNullAndEmpty(data[i].EMP_NM) +
      `</td>
        <td class="Content" style="width: 10%">` +
      isNullAndEmpty(data[i].JOB_TIT_NM) +
      `</td>
        <td class="Content" style="width: 15%">` +
      data[i].EYESIGHT_PLACE_NAME +
      `</td>
        <td class="Content" style="width: 15%">` +
      data[i].GLASSES_KIND +
      `</td>
        <td class="Content" style="width: 5%; justify-items: end;">` +
      data[i].GLASSES_COUNT +
      `</td>
        <td class="Content" style="width: 10%">` +
      data[i].REASON_NM +
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
    USER_DIV: 'B',
    APPROVE_ID: appKey,
    USER_ID: userStore.userId,
  };
  saveParam.push(saveData);

  const res = await commonExecuteApi({
    queryId: "HLTHC0010_SAVE_02",
    list: saveParam,
  });

  await searchData();
};

defineExpose({
  searchData,
  setGrid,
  setPriod,
  saveData,
  btnApproval,
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
          :label="$t('신청일자')"
          class="custom-flex-1"
          labelWidth="60px"
          v-model="searchParam.REQ_DT"
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
        <span class="custom-flex-3" />
      </div>
    </v-card-text>
    <v-card-text class="pa-0 pt-3 content-area">
      <div class="d-flex flex-column fill-height">
        <div class="h-grow d-flex flex-area-gap">
          <v-sheet class="pa-0 h-auto custom-flex-2">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            >
            </RealGrid>
          </v-sheet>
          <div class="pl-2 h-auto d-flex custom-flex-1 content-area">
            <div class="pb-0 d-flex justify-space-between align-center w-100">
              <div class="d-flex">
                <span class="menuTitle blackLabel">
                  {{ $t(displaySubTitle) }}
                </span>
              </div>
              <div>
                <v-btn @click="cancelApllication">신청취소</v-btn>
              </div>
            </div>
            <v-sheet
              class="pa-0 pt-1 w-100 flex-grow-1"
              style="min-height: 300px"
            >
              <RealGrid
                ref="grdDetail"
                :grid-view-option="grdDetailProps.gridViewOption"
                :fields="grdDetailProps.fields"
                :columns="grdDetailProps.columns"
                :column-layout="grdDetailProps.columnLayout"
              />
            </v-sheet>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <!-- <HLTHA0020Popup02 ref="hLTHA0020Popup02" /> -->
  <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (390px));
  overflow-y: auto;
  //   > div {
  //     min-height: 300px;
  //   }
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
  color: darkred !important;
  font-size: 14px !important;
}

.blackLabel {
  color: black !important;
  font-size: 14px !important;
}

::v-deep(.rg-button-action) {
  background: none !important; /* 기본 이미지 제거 */
  font-family: "Material Design Icons"; /* mdi 폰트 지정 */
  font-size: 20px;
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

::v-deep(.rg-button-action::before) {
  content: "\F0349"; /* mdi-magnify 유니코드 */
}
</style>