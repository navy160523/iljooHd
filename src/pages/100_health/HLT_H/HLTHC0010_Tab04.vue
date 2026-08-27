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
import HLTHB0010Popup03 from "./HLTHB0010Popup03.vue";
import ApprovalPopup from "@/components/popup/ApprovalPopup.vue"; //결재

const grdMain = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const hLTHB0010Popup03 = ref(null);
const approvalPopup = ref(null);

const props = defineProps({
  bsnsCd: String,
  bsnsNm: String,
  deptCd: String,
  deptNm: String,
  cmpnyCd: String,
  asgnCd: String,
  outYn: String,
  dutyYn: String,
  isAdmin: Number
});

const searchParam = reactive({
  CMPNY_DIV: props.cmpnyCd,
  BSNS_CD: "",
  YEAR: "",
  REQ_DIV: "B",
  REQ_DT: "",
  STATUS: "%",
});

const codeList = reactive({
  STATUS: [
    { COD: "%", TXT: "전체" },
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
  SHOES_KIND: [],
  SIZE: [],
  REASON: [],
  USER_TYPE: [],
  USER_DIV: [
    { COD: "A", TXT: "직영" },
    { COD: "B", TXT: "사내협력사" },
    { COD: "Z", TXT: "직영외" },
  ],
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
      lookupDisplay: true,
      header: { text: t("신청일자") },
      styleName: "center-column",
    },
    {
      fieldName: "SHOES_VEND",
      dataType: "text",
      width: "200",
      header: {
        text: t("안전장화 종류"),
      },
      lookupDisplay: true,
      styleName: "left-column editable_column",
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
    },
    {
      fieldName: "SHOES_COUNT",
      dataType: "text",
      width: "60",
      header: {
        text: t("신청수량"),
      },
      styleName: "center-column editable_column",
      editor: {
        type: "number", // ✅ 숫자 전용 에디터
        editFormat: "#", // 소수점 없이 정수만
        maxLength: 3, // 예: 최대 3자리까지 입력
        positiveOnly: true, // ✅ 음수 방지 (선택)
      },
    },
    {
      fieldName: "USER_TYPE",
      dataType: "text",
      width: "100",
      header: {
        text: t("분류"),
      },
      lookupDisplay: true,
      styleName: "left-column editable_column",
    },
    {
      fieldName: "REASON",
      dataType: "text",
      width: "100",
      header: {
        text: t("신청 사유"),
      },
      lookupDisplay: true,
      styleName: "left-column editable_column",
    },
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "100",
      header: { text: t("비고") },
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
      fieldName: "ORGN_DIV",
      visible: false,
      header: { text: t("직영구분") },
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
      fieldName: "SHOES_KIND",
      visible: false,
      header: { text: t("안전장화코드") },
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
      fieldName: "DUTY_YN",
      visible: false,
      header: { text: t("대상여부") },
    },
    {
      fieldName: "BSNS_CD",
      visible: false,
      header: { text: t("사업부코드") },
    },
    {
      fieldName: "DEPT_CD",
      visible: false,
      header: { text: t("부서코드") },
    },
    {
      fieldName: "USER_DIV",
      visible: false,
      header: { text: t("직영구분") },
    },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

const reCodeList = (list) => {
  const newArray = list.map((item) => ({
    value: item.COD,
    text: item.TXT,
  }));

  return newArray;
};

const initCodeList = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHB0010_SEARCH_LONG_SHOES",
      param: {
        CMPNY_DIV: props.cmpnyCd,
      },
    }), // 안전장화
    getCodeList("HHII720"), // 안전장화 사이즈
    getCodeList("HHII730"), // 신청 사유
    getCodeList("HHII780"), // 직영외 사용자 유형
  ]);

  codeList.SHOES_KIND = [...res[0].ORESULT_CUR];
  codeList.SIZE = [...res[1].ORESULT_CUR];

  if (!codeList.SHOES_KIND.some((item) => item.TXT === "")) {
    codeList.SHOES_KIND.unshift({ TXT: "", COD: "" });
  }

  if (!codeList.SIZE.some((item) => item.TXT === "")) {
    codeList.SIZE.unshift({ TXT: "", COD: "" });
  }

  const tempList = [...res[2].ORESULT_CUR];

  codeList.REASON = tempList.filter(
    (item) => item.CODE_DESC1?.includes("Z") || item.CODE_DESC2?.includes("Z")
  );

  codeList.USER_TYPE = [...res[3].ORESULT_CUR];

  grdMain.value.setBindingColumn("STATUS", codeList.GRID_STATUS, "COD", "TXT"); //GRID_STATUS
  grdMain.value.setBindingColumn("REASON", codeList.REASON, "COD", "TXT");
  grdMain.value.setBindingColumn("USER_TYPE", codeList.USER_TYPE, "COD", "TXT");
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
    .setColumnProperty(
      "USER_TYPE",
      "lookupData",
      reCodeList(codeList.USER_TYPE)
    );
  grdMain.value.getGridView().setColumnProperty("USER_TYPE", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.USER_TYPE),
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

      if (fieldName === "SHOES_VEND") {
        const shoes = provider.getValue(row, "SHOES_VEND").split("-");
        provider.setValue(itemIndex, "SHOES_KIND", shoes[0]);
        provider.setValue(itemIndex, "VEND_NAME", shoes[1]);
      }
    }, 0);
  };

  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);
};

const setGrid = async () => {
  await initCodeList();
  await setGridItem();
};

const setPriod = async () => {
  searchParam.YEAR = dayjs().year();
  searchParam.REQ_DT = dayjs().format("YYYY-MM-DD");
};

const searchData = async (index) => {
  grdMain.value.getDataProvider().clearRows();

  const mainRes = await commonSearchApi({
    queryId: "HLTHB0010_SEARCH_08",
    param: {
      CMPNY_DIV: props.cmpnyCd,
      DEPT_CD: props.deptCd,
      YEAR: searchParam.YEAR,
      REQ_DIV: searchParam.REQ_DIV,
      REQ_DT: searchParam.REQ_DT.replaceAll("-", ""),
      STATUS: searchParam.STATUS,
    },
  });

  await grdMain.value.getDataProvider().setRows(mainRes.ORESULT_CUR);
  grdMain.value.getGridView().setCurrent({ dataRow: 0, column: "EMP_NO" });
  grdMain.value.getGridView().setFocus(true);

  await nextTick();
};

const btnAdd = async () => {
  if (props.isAdmin <= 0) {
    return Message.warn(
      t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
    );
  }
  hLTHB0010Popup03.value.openPopup({
    readonly: false,
    CMPNY_DIV_D: true,
    FLAG_D: true,
    //BSNS_CD_D: true,
    //DEPT_CD_D: true,
    BSNS_CD: props.bsnsCd,
    DEPT_CD: props.deptCd,
    //DISABLE:["사내협력사"]
  });
};

const onEmpSelected = async (row) => {

  let userDiv

  if(row){
    userDiv = 'Z' + row.USER_DIV
  }else{
    userDiv = 'ZZ'
  }

  const provider = grdMain.value.getDataProvider();
  provider.addRows([
    {
      ASGN_FULL_NM: row ? row.ASGN_NM : "",
      EMP_NO: row ? row.EMP_NO : "ZZ99999",
      EMP_NM: row ? row.EMP_NM : "외부인사/기타",
      JOB_TIT_NM: row ? row.JOB_TIT_NM : "",
      SHOES_VEND: "",
      SHOES_SIZE: "",
      SHOES_COUNT: "",
      USER_TYPE: "",
      REASON: "",
      REMARKS: "",
      REQ_CHA: "",
      DUTY_YN: 'N',
      BSNS_CD: row ? row.BSNS_CD : props.bsnsCd,
      DEPT_CD: row ? row.DEPT_CD : props.deptCd,
      USER_DIV: userDiv
    },
  ]);
};

const saveShoesData = async () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeShoesSave)
    .setQuery(saveShoesDatas)
    .setAfter(afterShoesSave)
    .run();
};

const beforeShoesSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("저장할 데이터를 선택해주세요."));
    return false;
  }
  const provider = grdMain.value.getDataProvider();

  for (let index of checkedData) {
    if (
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
        "SHOES_VEND"
      ) === "" ||
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
        "SHOES_VEND"
      ) === null
    ) {
      Message.warn(t("안전장화를 선택해주세요."));
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: index, column: "SHOES_VEND" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }

    if (
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
        "SHOES_SIZE"
      ) === "" ||
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
        "SHOES_SIZE"
      ) === null
    ) {
      Message.warn(t("안전장화 사이즈를 선택해주세요."));
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: index, column: "SHOES_SIZE" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }

    if (
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
        "SHOES_COUNT"
      ) === "" ||
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
        "SHOES_COUNT"
      ) === null ||
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
        "SHOES_COUNT"
      ) < 1
    ) {
      Message.warn(t("신청수량을 입력해주세요."));
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: index, column: "SHOES_COUNT" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }

    if (
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
        "USER_TYPE"
      ) === "" ||
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
        "USER_TYPE"
      ) === null
    ) {
      Message.warn(t("분류를 선택해주세요."));
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: index, column: "USER_TYPE" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }

    if (
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
        "REASON"
      ) === "" ||
      provider.getValue(
        grdMain.value.getGridView().getDataRow(index),
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
      REQ_CHA: data.REQ_CHA,
      EMP_NO: data.EMP_NO,
      BSNS_CD: data.BSNS_CD,
      DEPT_CD: data.DEPT_CD,
      DIVISION: "B",
      SHOES_KIND: data.SHOES_KIND,
      SHOES_SIZE: data.SHOES_SIZE,
      SHOES_COUNT: data.SHOES_COUNT,
      DUTY_YN: data.DUTY_YN,
      USER_DIV: data.USER_DIV,
      REASON: data.REASON,
      VEND_NAME: data.VEND_NAME,
      USER_ID: userStore.userId,
      USER_TYPE: data.USER_TYPE,
      REMARKS: data.REMARKS
    };
    saveParam.push(saveData);

    temp = commonExecuteApi({
      queryId: "HLTHB0010_SAVE_01",
      list: saveParam,
    });
  }

  return temp;
};

const afterShoesSave = async (res) => {
  await searchData();
};

const btnCancel = async () => {
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
  let checkedData = grdMain.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("신청취소 할 데이터를 선택해주세요."));

    return false;
  }

  const provider = grdMain.value.getDataProvider();

  for (let itemIndex of checkedData) {
    if (
      (Number(provider.getValue(grdMain.value.getGridView().getDataRow(itemIndex),"STATUS"))
        >= 2 ) 
    ) {
      Message.warn(t("결재상신 이후에는 신청취소를 할 수 없습니다."));
      return false;
    }
  }

  return true;
};

const deleteData = async () => {
  let temp = null;
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true);
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
      queryId: "HLTHB0010_DELETE_01",
      list: deleteParam,
    });
  }
  return temp;
};

const afterDelete = async () => {
    await searchData();
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
    queryId: "HLTHB0010_SEARCH_09",
    param: {
      CMPNY_DIV: props.cmpnyCd,
      YEAR: searchParam.YEAR,
      REQ_DIV: searchParam.REQ_DIV,
      REQ_DT: searchParam.REQ_DT.replaceAll("-", ""),
    },
  });
};

const afterApproval = async (res) => {
  approvalPopup.value.openPopup({
    CLSS_ID: "HLTHB0010",
    TITLE: "부서별 안전장화 수시신청",
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
  const asgnArray = data.map(item => item.ASGN_FULL_NM);

  const bsnsNm = props.bsnsNm ? props.bsnsNm : ''
  const deptNm = props.deptNm ? props.deptNm : ''

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
      <span>안전장화 수시 신청서</span>
      <span>(직영외)</span>
    </div>
    <table class="table">
      <tr>
        <td class="table_head" style="width: 10%">사업부</td>
        <td class="table_head" style="width: 30%">` +
    bsnsNm +    //asgnArray[0]
    `</td>
        <td class="table_head" style="width: 10%">부서</td>
        <td class="table_head" style="width: 30%">` +
    deptNm +    //asgnArray[1]
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
        <th class="Content_header" style="width: 15%">안전장화 종류</th>
        <th class="Content_header" style="width: 10%">사이즈</th>
        <th class="Content_header" style="width: 5%">수량</th>
        <th class="Content_header" style="width: 10%">사유</th>
        <th class="Content_header" style="width: 15%">비고</th>
      </tr>`;

  for (let i in data) {
    htmlReport +=
      `<tr>
        <td class="Content" style="width : 5%" >` +
      (Number(i)+1).toString() +
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
      data[i].SHOES_KIND +
      `</td>
        <td class="Content" style="width: 10%">` +
      data[i].SHOES_SIZE +
      `</td>
        <td class="Content" style="width: 5%; justify-items: end;">` +
      data[i].SHOES_COUNT +
      `</td>
        <td class="Content" style="width: 10%">` +
      data[i].REASON_NM +
      `</td>
        <td class="Content" style="width: 15%">` +
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
    USER_DIV: 'Z',
    APPROVE_ID: appKey,
    USER_ID: userStore.userId,
  };
  saveParam.push(saveData);

  const res = await commonExecuteApi({
    queryId: "HLTHB0010_SAVE_02",
    list: saveParam,
  });

  await searchData();
};

onMounted(async () => {
  grdMain.value.getGridView().filterPanel.visible = true
});

defineExpose({
  searchData,
  setGrid,
  setPriod,
  saveShoesData,
  btnApproval
});
</script>


<template>
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex flex-gap">
            <i-select
              :label="$t('해당년도')"
              class="custom-flex-1"
              labelWidth="60px"
              type="YEAR"
              v-model="searchParam.YEAR"
            />
            <i-input
              :label="$t('신청일자')"
              class="custom-flex-1"
              labelWidth="60px"
              v-model="searchParam.REQ_DT"
              type="date"
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
            <div>
              <v-btn @click="btnAdd">추가</v-btn>
              <v-btn @click="btnCancel">신청취소</v-btn>
            </div>
            <!-- <span class="custom-flex-1" /> -->
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet class="pa-0 h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <HLTHB0010Popup03
    ref="hLTHB0010Popup03"
    @selected="onEmpSelected"
  ></HLTHB0010Popup03>
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
</style>