<!-- 
  화면명 : 안전화 신청/접수 이력 관리 
  화면개요 : 안전화 신청/접수 이력 관리 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { isEmpty } from "@/@core/utils";
import { useI18n } from "vue-i18n";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from "@/utils/saveFlowHelper";
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from "dayjs";
import Message from "@hiway/utils/notify";
import HLTHA0030Popup01 from "@/pages/100_health/HLT_H/HLTHA0030Popup01.vue";
import HLTHA0030Popup02 from "@/pages/100_health/HLT_H/HLTHA0030Popup02.vue";
import HLTHA0030Popup03 from "@/pages/100_health/HLT_H/HLTHA0030Popup03.vue";
import HLTHA0030Popup04 from "@/pages/100_health/HLT_H/HLTHA0030Popup04.vue";
import HLTHA0030Popup05 from "@/pages/100_health/HLT_H/HLTHA0030Popup05.vue";

defineOptions({
  name: "100_health-HLT_H-HLTHA0030",
});

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();

const isAdmin = ref(false);
const menuTitle = ref(null);
const grdMain = ref(null);
const hltha0030Popup01 = ref(null);
const hltha0030Popup02 = ref(null);
const hltha0030Popup03 = ref(null);
const hltha0030Popup04 = ref(null);
const hltha0030Popup05 = ref(null);
const receiveDuty = ref(false);
const regularData = ref(null);

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"), //new Date().getFullYear(),
  REQ_DIV: "B",
  REQ_CHA: (dayjs().get("year")+'-01-01' < dayjs().format("YYYY-MM-DD") && dayjs().format("YYYY-MM-DD") < dayjs().get("year")+'-06-30') ? '1' : '2',
  TMP_REQ_DT_FR: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
  TMP_REQ_DT_TO: dayjs().format("YYYY-MM-DD"),
  REQ_DT_FR: "",
  REQ_DT_TO: "",
  BSNS_CD: "",
  DEPT_CD: "",
  USER_DIV: "",
  RECEIVER: "",
  RECEIVER_YN: "",
  STATUS: 'A'
});

const codeList = reactive({
  REQ_CHA: [
    { COD: "1", TXT: "상반기" },
    { COD: "2", TXT: "하반기" },
  ],
  REQ_DIV: [
    { COD: "A", TXT: "정기" },
    { COD: "B", TXT: "수시" },
  ],
  SHOES_SIZE: [],
  REASON: [],
  SHOES_NAME: [],
  SHOES_KIND: [],
  BSNS_CD: [],
  DEPT_CD: [],
  RECEIVE_RULE: [],
  HLD_OFFI_GBN: [
    { COD: "1", TXT: "재직" },
    { COD: "2", TXT: "휴직" },
    { COD: "3", TXT: "퇴사" },
    { COD: "4", TXT: "군입영" },
  ],
  VEND_LIST: [],
  PLACE_CD: [],
  RECEIVE_TG: [
    { COD: "Y", TXT: "대상" },
    { COD: "N", TXT: "비대상" },
  ],
  RECEIVER: [
    { COD: "", TXT: "전체" },
    { COD: "A", TXT: "대상자" },
    { COD: "B", TXT: "신청자" },
    { COD: "C", TXT: "미신청자" },
  ],
  RECEIVE_YN: [
    { COD: "", TXT: "전체" },
    { COD: "Y", TXT: "지급" },
    { COD: "N", TXT: "미지급" },
  ],
  RECEIVE_YN_GRD: [
    { COD: "", TXT: "" },
    { COD: "Y", TXT: "지급" },
    { COD: "N", TXT: "미지급" },
  ],
  RECEIVE_TYPE: [
    { COD: "A", TXT: "지급" },
    { COD: "B", TXT: "대체지급" },
    { COD: "C", TXT: "선지급" },
  ],
  ORGN_DIV: [
    { COD: "", TXT: "전체" },
    { COD: "A", TXT: "직영" },
    { COD: "B", TXT: "사내협력사" },
    { COD: "C", TXT: "직영 외" },
  ],
  STATUS: [
    { COD: "A", TXT: "신청일자"},
    { COD: "B", TXT: "지급일자"}
  ],
});

/*  공통코드 세팅 */
onMounted(async () => {
  // admin 부여
  if (
    useLogsStore().isMenuAdmin === "Y" ||
    userStore.authGrpCd.includes("HLTH001") ||
    userStore.authGrpCd.includes("GRP00372")
  ) {
    isAdmin.value = true;
  }

  await setMenuTitle();

  await initCodeList();
  grdMain.value.getGridView().filterPanel.visible = true;
  onButtonsClick({ id: "btnSearch" });
});

const setMenuTitle = async () => {
  menuTitle.value.visibleBtn("btnRegularBulkUpload", false);
  menuTitle.value.visibleBtn("btnSearch", true);
  menuTitle.value.visibleBtn("btnUpdate", true);

  menuTitle.value.visibleBtn("btnNonRegularBulkUpload", true);
  menuTitle.value.visibleBtn("btnTurnBack", true);
  menuTitle.value.visibleBtn("btnApprove", true);
  menuTitle.value.visibleBtn("btnSendMail", true);
};

const initCodeList = async () => {
  Promise.all([
    // 품명(안전화)
    getCodeList("HHII710A"),
    // 안전화사이즈
    getCodeList("HHII720"),
    // 지급기준
    getCodeList("HHII740"),
    // 신청사유
    getCodeList("HHII730"),
    // // 종류
    // commonSearchApi({
    //   queryId: "HLTHA0030_SEARCH_02",
    //   param: { CMPNY_DIV: searchParams.CMPNY_DIV },
    // }),
    // 납품업체 목록
    commonSearchApi({
      queryId: "HLTHA0030_SEARCH_03",
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, DIVISION: "A" },
    }),
    // 수령장소 목록
    commonSearchApi({
      queryId: "HLTHF0030_SEARCH_01",
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, DIVISION: "B" },
    }),
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" },
    }), // 사업부
    commonSearchApi({
      queryId: "searchDept3",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV: "Y",
      },
    }), // 부서
  ]).then((res) => {
    codeList.SHOES_NAME = res[0].ORESULT_CUR;
    codeList.SHOES_SIZE = res[1].ORESULT_CUR;
    codeList.RECEIVE_RULE = res[2].ORESULT_CUR;
    codeList.REASON = res[3].ORESULT_CUR;
    // codeList.SHOES_KIND = res[4].ORESULT_CUR;
    codeList.VEND_LIST = res[4].ORESULT_CUR;
    codeList.PLACE_CD = res[5].ORESULT_CUR;

    codeList.BSNS_CD = res[6].ORESULT_CUR;
    codeList.DEPT_CD = res[7].ORESULT_CUR;

    if (!codeList.BSNS_CD.some((item) => item.BSNS_NM === "전체")) {
      codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" });
    }
    if (!codeList.DEPT_CD.some((item) => item.DEPT_NM === "전체")) {
      codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" });
    }

    grdMain.value.setBindingColumn(
      "HLD_OFFI_GBN",
      codeList.HLD_OFFI_GBN,
      "COD",
      "TXT"
    );
    grdMain.value.setBindingColumn(
      "SHOES_KIND",
      codeList.SHOES_NAME,
      "COD",
      "TXT"
    );
    grdMain.value.setBindingColumn(
      "VEND_NAME",
      codeList.VEND_LIST,
      "VEND_SEQ",
      "VEND_NAME"
    );
    grdMain.value.setBindingColumn(
      "PLACE_CD",
      codeList.PLACE_CD,
      "PLACE_SEQ",
      "PLACE_NAME"
    );
    grdMain.value.setBindingColumn(
      "DUTY_YN",
      codeList.RECEIVE_TG,
      "COD",
      "TXT"
    );
    grdMain.value.setBindingColumn(
      "RECEIVE_TG",
      codeList.RECEIVE_TG,
      "COD",
      "TXT"
    );
    grdMain.value.setBindingColumn(
      "RECEIVE_YN",
      codeList.RECEIVE_YN_GRD,
      "COD",
      "TXT"
    );
    grdMain.value.setBindingColumn(
      "RECEIVE_TYPE",
      codeList.RECEIVE_TYPE,
      "COD",
      "TXT"
    );
    grdMain.value.setBindingColumn("REASON", codeList.REASON, "COD", "TXT");
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

      if (fieldName === "RECEIVE_YN") {
        if (provider.getValue(row, "RECEIVE_YN") === "Y"){
          provider.setValue(row, "RECEIVE_TYPE", "A");
        }else{
          provider.setValue(row, "RECEIVE_DT", "");
          provider.setValue(row, "RECEIVE_TYPE", "");
        }

        // if (provider.getValue(row, "RECEIVE_YN") === "N") {
        //   provider.setValue(itemIndex, "RECEIVE_DT", "");
        //   provider.setValue(itemIndex, "RECEIVE_TYPE", "");
        // } else if (provider.getValue(row, "RECEIVE_YN") === "Y") {
          // provider.setValue(itemIndex, "RECEIVE_TYPE", "A");
        // }
      }
    }, 0);
  };
};

const updateBsnsCd = async () => {
  await setDeptList();
  onButtonsClick({ id: "btnSearch" });
};

const onReqDivChange = async (newValue) => {
  if (newValue == "A") {
    menuTitle.value.visibleBtn("btnRegularBulkUpload", true);

    menuTitle.value.visibleBtn("btnNonRegularBulkUpload", false);
    menuTitle.value.visibleBtn("btnTurnBack", false);
    menuTitle.value.visibleBtn("btnApprove", false);
    menuTitle.value.visibleBtn("btnSendMail", false);
    receiveDuty.value = true;
    //grdMain.value.getGridView().columnByName("RECEIVE_TG").visible = true;
  } else {
    menuTitle.value.visibleBtn("btnRegularBulkUpload", false);

    menuTitle.value.visibleBtn("btnNonRegularBulkUpload", true);
    menuTitle.value.visibleBtn("btnTurnBack", true);
    menuTitle.value.visibleBtn("btnApprove", true);
    menuTitle.value.visibleBtn("btnSendMail", true);
    receiveDuty.value = false;
    //grdMain.value.getGridView().columnByName("RECEIVE_TG").visible = false;
  }

  onButtonsClick({ id: "btnSearch" });

  // setTimeout(() => {
  //   grdMain.value.getGridView().refresh();
  // }, 100);
};

const setDeptList = async () => {
  codeList.DEPT_CD = [];
  searchParams.DEPT_CD = "";

  Promise.all([
    commonSearchApi({
      queryId: "searchDept3",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV: "Y",
      },
    }), // 부서
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR;
    if (!codeList.DEPT_CD.some((item) => item.DEPT_NM === "전체")) {
      codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" });
    }
  });
};

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true } },
  keys: [],
  fields: [
    {
      fieldName: "ASGN_FULL_NM",
      width: "200",
      dataType: "text",
      editable: false,
      styleName: "left-column",
      header: { text: t("소속") },
    },
    {
      fieldName: "EMP_NO",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("사번") },
    },
    {
      fieldName: "EMP_NM",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("성명") },
    },
    {
      fieldName: "JOB_TIT_NM",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("직위") },
    },
    {
      fieldName: "UNT_DUTY_NM",
      width: "100",
      dataType: "text",
      editable: false,
      header: { text: t("직무명") },
    },
    {
      fieldName: "KPWORK_CONF_DT",
      width: "100",
      dataType: "text",
      editable: false,
      header: { text: t("후생복지일") },
    },
    {
      fieldName: "DUTY_YN",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("대상여부\n(직무)"), styleName: "multiline-editor" },
      visible: false,
      lookupDisplay: true,
    },
    {
      fieldName: "HLD_OFFI_GBN",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("재직구분\n(현재)"), styleName: "multiline-editor" },

      lookupDisplay: true,
      styleCallback: function (grid, dataCell) {
        if (grid.getValue(dataCell.index.itemIndex, "HLD_OFFI_GBN") != "1") {
          return { style: { background: "#FFA500" } };
        }
        //  else {
        //   return { style: { background: null } }; //"#FFFFFF"
        // }
      },
    },
    {
      fieldName: "SHOES_COUNT_HIS",
      width: "80",
      dataType: "text",
      editable: false,
      styleName: "right-column",
      header: { text: t("총 지급수량") },
    },
    {
      fieldName: "RECEIVE_TG",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("지급대상\n여부"), styleName: "multiline-editor" },
      lookupDisplay: true,
      styleCallback: function (grid, dataCell) {
        // let column = dataCell.index.column.visible
        // //dataCell.index.column
        // console.log('뭘까나 : ', column)
        //if (!column.visible) return {}; // 컬럼 숨김 시 스타일 적용 안함
        return { style: { background: "#FFC0C0" } };
      },
    },
    {
      fieldName: "RECEIVE_RULE",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("지급기준") },
      lookupDisplay: true,
    },
    {
      fieldName: "REQ_DT",
      width: "100",
      dataType: "datetime",
      editable: false,
      datetimeFormat: "yyyy-MM-dd",
      header: { text: t("신청일자") },
    },
    {
      fieldName: "RECEIVE_APPROVAL_YN",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("메일발송\n여부"), styleName: "multiline-editor" },
      lookupDisplay: true,
    },
    {
      fieldName: "RECEIVE_YN",
      width: "60",
      dataType: "text",
      //styleName: "editable_column",
      header: { text: t("지급여부") },
      editor: { type: "dropdown" },
      lookupDisplay: true,
      styleCallback: function (grid, dataCell) {
        var ret = {
          editable: true,
          // styleName: "editable_column",
          enabled: true,
        };
        
          if (isEmpty(grid.getValue(dataCell.index.itemIndex, "REGIST").trim())) {
            ret.editable = false;
            ret.enabled = false;
            ret.style = { background: "#FFFFFF" }; //"#FFFFFF"
          } else {
            ret.editable = true;
            ret.enabled = true;
            ret.styleName = "editable_column";
            ret.style = { background: "#eff8fd" };
          }
          
          if (grid.getValue(dataCell.index.itemIndex, "REQ_DIV") === "A") {
            if(grid.getValue(dataCell.index.itemIndex, "RECEIVE_TG") === "Y"){
              ret.editable = true;
            }else{
              ret.editable = false;
            }
          }


        // if (grid.getValue(dataCell.index.itemIndex, "REQ_DIV") === "B") {
        //   if(grid.getValue(dataCell.index.itemIndex, "STATUS") === "3" //&&
        //      //grid.getValue(dataCell.index.itemIndex, "RECEIVE_APPROVAL_YN") === "Y"
        //   ) {
        //     ret.editable = true;
        //     ret.styleName = "editable_column";
        //     ret.style = { background: "#eff8fd"}; 
        //   }else{
        //     ret.editable = false;
        //     ret.styleName = null;
        //     if(grid.getValue(dataCell.index.itemIndex, "STATUS") != "3" ){
        //       ret.style = { background: "#D3D3D3"};
        //       return ret; 
        //     }
            
        //     if(grid.getValue(dataCell.index.itemIndex, "RECEIVE_APPROVAL_YN") === 'Y'){
        //       ret.style = { background: "#C0FFFF"}; 
        //     }else if(grid.getValue(dataCell.index.itemIndex, "RECEIVE_APPROVAL_YN") === 'N'){
        //       ret.style = { background: "#D3D3D3"};
        //     }else if(grid.getValue(dataCell.index.itemIndex, "APPROVAL") === 'Y'){
        //       ret.style = { background: "#FFF3C0"};
        //     }else{
        //       ret.style = { background: null};
        //     }
        //   }
        // }
        return ret;
      },
    },
    {
      fieldName: "RECEIVE_DT",
      width: "100",
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      //styleName: "editable_column",
      header: { text: t("지급일자") },
      editor: {
        type: "date",
        commitOnSelect: true,
        mask: {
          editMask: "9999-99-99",
          placeHolder: "yyyy-MM-dd",
          includedFormat: true,
        },
      },
      styleCallback: function (grid, dataCell) {
        var ret = {
          editable: true,
          //styleName: "editable_column",
          enabled: true,
        };
        if (isEmpty(grid.getValue(dataCell.index.itemIndex, "REGIST").trim())) {
          ret.editable = false;
          ret.enabled = false;
          ret.style = { background: "#FFFFFF" };
        } else {
          ret.editable = true;
          ret.enabled = true;
          ret.styleName = "editable_column",
          ret.style = { background: "#eff8fd" };
        }

        if(grid.getValue(dataCell.index.itemIndex, "RECEIVE_YN") === "Y"){
          ret.editable = true;
          ret.enabled = true;
        }else{
          ret.editable = false;
          ret.enabled = false;
        }


        // if(grid.getValue(dataCell.index.itemIndex, "REQ_DIV") === "A") {
        //   if(grid.getValue(dataCell.index.itemIndex, "RECEIVE_YN") === "Y"){
        //     ret.editable = true;
        //     ret.enabled = true;
        //   }else{
        //     ret.editable = false;
        //     ret.enabled = false;
        //   }
        // }


        // if (grid.getValue(dataCell.index.itemIndex, "REQ_DIV") === "B") {
        //   if(grid.getValue(dataCell.index.itemIndex, "STATUS") === "3" //&&
        //      //grid.getValue(dataCell.index.itemIndex, "RECEIVE_APPROVAL_YN") === "Y"
        //   ) {
        //     ret.editable = true;
        //     ret.styleName = "editable_column";
        //     ret.style = { background: "#eff8fd"}; 
        //   }else{
        //     ret.editable = false;
        //     ret.styleName = null;
        //     if(grid.getValue(dataCell.index.itemIndex, "STATUS") != "3" ){
        //       ret.style = { background: "#D3D3D3"};
        //       return ret; 
        //     }
            
        //     if(grid.getValue(dataCell.index.itemIndex, "RECEIVE_APPROVAL_YN") === 'Y'){
        //       ret.style = { background: "#C0FFFF"}; 
        //     }else if(grid.getValue(dataCell.index.itemIndex, "RECEIVE_APPROVAL_YN") === 'N'){
        //       ret.style = { background: "#D3D3D3"};
        //     }else if(grid.getValue(dataCell.index.itemIndex, "APPROVAL") === 'Y'){
        //       ret.style = { background: "#FFF3C0"};
        //     }else{
        //       ret.style = { background: null};
        //     }
        //   }
        // }

        return ret;
      },
    },
    {
      fieldName: "RECEIVE_TYPE",
      width: "80",
      dataType: "text",
      editor: { type: "dropdown" },
      editable: false,
      header: { text: t("지급방법") },
      lookupDisplay: true,
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (grid.getValue(dataCell.index.itemIndex, "RECEIVE_YN") === "N") {
          ret.editable = false;
        }

        return ret;
      },
    },
    {
      fieldName: "STATUS_NM",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("진행상태") },
    },
    {
      fieldName: "SHOES_KIND",
      width: "140",
      dataType: "text",
      editable: false,
      styleName: "left-column",
      header: { text: t("안전화종류") },
      lookupDisplay: true,
    },
    {
      fieldName: "SHOES_SIZE",
      width: "60",
      dataType: "text",
      editable: false,
      header: { text: t("사이즈") },
      lookupDisplay: true,
    },
    {
      fieldName: "SHOES_COUNT",
      width: "60",
      dataType: "text",
      editable: false,
      styleName: "right-column",
      header: { text: t("신청수량") },
    },
    {
      fieldName: "COUPON_YN",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("쿠폰여부") },
    },
    {
      fieldName: "INSORE_YN",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("보온깔창여부") },
    },
    {
      fieldName: "REASON",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("신청사유") },
      lookupDisplay: true,
    },
    {
      fieldName: "VEND_NAME",
      width: "120",
      dataType: "text",
      editable: false,
      styleName: "left-column",
      header: { text: t("납품업체") },
      lookupDisplay: true,
    },
    {
      fieldName: "EMP_NO_RECEIVER",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("수령자사번") },
    },
    {
      fieldName: "EMP_NM_RECEIVER",
      width: "80",
      dataType: "text",
      editable: false,
      header: { text: t("수령자") },
    },
    {
      fieldName: "RECEIVER_HND",
      width: "120",
      dataType: "text",
      editable: false,
      header: { text: t("수령자연락처") },
    },
    {
      fieldName: "PLACE_CD",
      width: "120",
      dataType: "text",
      styleName: "left-column",
      editable: false,
      header: { text: t("수령장소") },
      lookupDisplay: true,
    },
    {
      fieldName: "REMARK",
      width: "250",
      dataType: "text",
      styleName: "left-column editable_column",
      header: { text: t("비고") },
      styleCallback: function (grid, dataCell) {
        var ret = {
          editable: true,
          // styleName: "editable_column",
          enabled: true,
        };
        if (isEmpty(grid.getValue(dataCell.index.itemIndex, "REGIST").trim())) {
          ret.editable = false;
          ret.enabled = false;
          ret.style = { background: "#FFFFFF" };
        } else {
          ret.editable = true;
          ret.enabled = true;
          ret.style = { background: "#eff8fd" };
        }

        // if (grid.getValue(dataCell.index.itemIndex, "REQ_DIV") === "B") {
        //   if(grid.getValue(dataCell.index.itemIndex, "STATUS") === "3") {
        //     ret.editable = true;
        //     ret.styleName = "editable_column";
        //     ret.style = { background: "#eff8fd"}; 
        //   }else{
        //     ret.editable = false;
        //     ret.styleName = null;
        //     if(grid.getValue(dataCell.index.itemIndex, "STATUS") != "3" ){
        //       ret.style = { background: "#D3D3D3"};
        //       return ret; 
        //     }
            
        //     if(grid.getValue(dataCell.index.itemIndex, "RECEIVE_APPROVAL_YN") === 'Y'){
        //       ret.style = { background: "#C0FFFF"}; 
        //     }else if(grid.getValue(dataCell.index.itemIndex, "RECEIVE_APPROVAL_YN") === 'N'){
        //       ret.style = { background: "#D3D3D3"};
        //     }else if(grid.getValue(dataCell.index.itemIndex, "APPROVAL") === 'Y'){
        //       ret.style = { background: "#FFF3C0"};
        //     }else{
        //       ret.style = { background: null};
        //     }
        //   }
        // }

        return ret;
      },
    },

    // 안보이는거
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      header: { text: t("회사") },
      visible: false,
    },
    {
      fieldName: "YEAR",
      dataType: "text",
      header: { text: t("년도") },
      visible: false,
    },
    {
      fieldName: "USER_DIV",
      dataType: "text",
      header: { text: t("직영구분") },
      visible: false,
    },
    {
      fieldName: "REQ_DIV",
      dataType: "text",
      header: { text: t("신청구분") },
      visible: false,
    },
    {
      fieldName: "REQ_CHA",
      dataType: "text",
      header: { text: t("신청시기") },
      visible: false,
    },
    {
      fieldName: "STD_DUTY_NM",
      dataType: "text",
      header: { text: t("직군") },
      visible: false,
    },
    {
      fieldName: "JOB_ROW_NM",
      dataType: "text",
      header: { text: t("직렬") },
      visible: false,
    },
    {
      fieldName: "EMAIL",
      dataType: "text",
      header: { text: t("이메일") },
      visible: false,
    },
    {
      fieldName: "STATUS",
      dataType: "text",
      header: { text: t("진행상태코드") },
      visible: false,
    },
    {
      fieldName: "REGIST",
      dataType: "text",
      header: { text: t("신청여부") },
      visible: false,
    }, // NULL 이면 미신청
    {
      fieldName: "SAVE_YN",
      dataType: "text",
      header: { text: t("저장여부") },
      visible: false,
    },
    {
      fieldName: "APPROVAL",
      dataType: "text",
      header: { text: t("검토 비대상 여부") },
      visible: false,
    },
    {
      fieldName: "TO_EMAIL",
      dataType: "text",
      header: { text: t("발송 이메일") },
      visible: false,
    },
    {
      fieldName: "TO_EMP_NM",
      dataType: "text",
      header: { text: t("수신자 이름") },
      visible: false,
    },
  ],
  columns: [],
});

grd1Props.columns = grd1Props.fields;

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = async (btn) => {
  if (!isAdmin.value) {
    Message.warn(t("관리자만 사용가능합니다."));
    return;
  }

  if (btn.id === "btnSearch") {
    await getData();
    //await getDataRegular();
  } else if (btn.id === "btnCreate") {
    grdMain.value.getGridView().filterPanel.clearInput();
    grdMain.value.addRow(
      {
        CMPNY_DIV: userStore.cmpnyDiv,
        YEAR: searchParams.YEAR,
        HALF_DIV: searchParams.HALF_DIV,
        PROCESS_CD: "",
        PROCESS_NM: "",
        PROCESS_CONT: "",
        USE_YN: "Y",
      },
      false
    );
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: "check" }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run();
  } else if (btn.id === "btnRegularBulkUpload") {
    hltha0030Popup02.value.openPopup(searchParams);
  } else if (btn.id === "btnNonRegularBulkUpload") {
    vm.$swal({
      title: t(
        `미신청 건에 대한 지급 업로드이며, 지급처리됩니다.\r\n진행하시겠습니까?`
      ),
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed === true) {
        hltha0030Popup01.value.openPopup(searchParams);
      }
    });
  } else if (btn.id === "btnTurnBack") {
    let checkRow = grdMain.value.getGridView().getCheckedRows(true);
    if (checkRow.length !== 1) {
      return Message.warn(t("하나의 데이터를 선택하셔야합니다."));
    }
    let dt = grdMain.value.getDataProvider().getJsonRow(checkRow[0]);

    if (isEmpty(dt.REGIST.trim())) {
      return Message.warn(t("해당 인원은 신청하지 않았습니다."));
    } else if ("5" == dt.STATUS) {
      return Message.warn(t("이미 반려되었습니다."));
    }
    // else if (!['1','2','3','5'].includes(dt.STATUS)) {
    //   return Message.warn(t('신청, 결재완료인 인원만 가능합니다.'))
    // }
    hltha0030Popup03.value.openPopup(dt, "5");
  } else if (btn.id === "btnApprove") {
    let checkRow = grdMain.value.getGridView().getCheckedRows(true);
    if (checkRow.length !== 1) {
      return Message.warn(t("하나의 데이터를 선택하셔야합니다."));
    }
    let dt = grdMain.value.getDataProvider().getJsonRow(checkRow[0]);

    if (isEmpty(dt.REGIST.trim())) {
      return Message.warn(t("해당 인원은 신청하지 않았습니다."));
    }
    //  else if (!['1','2','3','5'].includes(dt.STATUS)) {
    //   return Message.warn(t('신청, 결재완료인 인원만 가능합니다.'))
    // }
    hltha0030Popup03.value.openPopup(dt, "3");
  } else if (btn.id == "btnSendMail") {
    let checkRow = grdMain.value.getGridView().getCheckedRows(true);
    let rowList = [];
    if (checkRow.length == 0) {
      return Message.warn(t("메일 발송 대상을 선택해주세요."));
    }

    //     if(dataSource.getValue(dataRow, "STATUS") != "3" ){
  //       return false;
  //     }

  //     if(dataSource.getValue(dataRow, "RECEIVE_APPROVAL_YN") === 'Y'){
  //       return false;
  //     }else if(dataSource.getValue(dataRow, "RECEIVE_APPROVAL_YN") === 'N'){
  //       return false;
  //     }else if(dataSource.getValue(dataRow, "APPROVAL") === 'Y'){
  //       return true;
  //     }else{
  //       return true;
  //     }
  //   }


    for (let rowIdx of checkRow) {
      let row = grdMain.value.getDataProvider().getJsonRow(rowIdx);
      // let sameList = rowList.filter(
      //   (item) => item.CMPNY_DIV === row.CMPNY_DIV && item.EMP_NO === row.EMP_NO   
      // );
      //isEmpty(sameList) && 
      if (row.STATUS === '3' && row.RECEIVE_APPROVAL_YN != 'Y' && row.RECEIVE_APPROVAL_YN != 'N') {
        // console.log(`1111?${rowIdx} : `, row)
        rowList.push(row);
      }
    }

    if(rowList.length > 0){
      hltha0030Popup05.value.openPopup(rowList);
    }else{
      return Message.warn(t("메일 발송 대상을 선택해주세요."));
    }
  } else if (btn.id == 'btnDelete'){
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
};

const getData = async () => {
  if (!isAdmin.value) {
    Message.warn(t("관리자만 사용가능합니다."));
    return;
  }

  const res = await Promise.all([searchDataRegular(), searchData()]);

  if (searchParams.REQ_DIV === "B") {
    regularData.value = res[0].ORESULT_CUR;
  }

  grdMain.value.getDataProvider().setRows(res[1].ORESULT_CUR);
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    const dataRow = dataCell.index.dataRow;
    if(dataRow < 0) return;

    if (receiveDuty.value) { //정기
      if (dataCell.dataColumn.name === "RECEIVE_TG") {
        return { style: { background: "#FFC0C0" } };
      }
    } else { // 수시
      // if (dataCell.dataColumn.name === "RECEIVE_RULE") {
      //   return { style: { background: null } }; //{ style: { background: "#FFFFFF" } };
      // }

      // if(dataCell.dataColumn.name === "HLD_OFFI_GBN"){
      //   if (grid.getValue(dataRow, "HLD_OFFI_GBN") != '1') {
      //     return { style: { background: "#FFA500" } };
      //   }
      // }

      if(grid.getValue(dataRow, "STATUS") != "3" ){
        return { style: { background: "#D3D3D3" } };
      }

      let temp = ["100", "101", "102", "108"].includes(grid.getValue(dataRow, "SHOES_KIND"))
      // console.log('1111 : ', grid.getValue(dataRow, "SHOES_KIND"))
      // console.log('2222 : ', temp)

      if(grid.getValue(dataRow, "RECEIVE_APPROVAL_YN") === 'Y'){
        return { style: { background: "#C0FFFF" } };
      }
      else if(grid.getValue(dataRow, "RECEIVE_APPROVAL_YN") === 'N'){
        return { style: { background: "#D3D3D3" } };
      }else if(grid.getValue(dataRow, "APPROVAL") === 'Y' && 
         ["100", "101", "102", "108"].includes(grid.getValue(dataRow, "SHOES_KIND")) &&
         grid.getValue(dataRow, "HLD_OFFI_GBN") === '1'){
        return { style: { background: "#FFF3C0" } };
      }else if(grid.getValue(dataRow, "APPROVAL") === 'Y' && 
         (!["100", "101", "102", "108"].includes(grid.getValue(dataRow, "SHOES_KIND")) || 
         grid.getValue(dataRow, "HLD_OFFI_GBN") != '1')){
        return { style: { background: null } };
      }
      else{
        return { style: { background: null } };
      }
    }
    return { style: { background: null } };
  });

  // var f = function(dataSource, item) {
  //   // const boss = dataSource.getValue(rowIndex, 'BOSS');
  //   // const divCd = dataSource.getValue(rowIndex, 'DIV_CD');

  //   const dataRow = item.dataRow;
  //   if(dataRow < 0) return;

  //   if (receiveDuty.value) { //정기
  //     return true;
  //   } else { // 수시
  //     if(dataSource.getValue(dataRow, "STATUS") != "3" ){
  //       return false;
  //     }

  //     if(dataSource.getValue(dataRow, "RECEIVE_APPROVAL_YN") === 'Y'){
  //       return false;
  //     }else if(dataSource.getValue(dataRow, "RECEIVE_APPROVAL_YN") === 'N'){
  //       return false;
  //     }else if(dataSource.getValue(dataRow, "APPROVAL") === 'Y'){
  //       return true;
  //     }else{
  //       return true;
  //     }
  //   }
  // }
 
  // grdMain.value.getGridView().setCheckBar({checkableCallback: f});


  grdMain.value.getGridView().columnByName("RECEIVE_TG").visible =
    receiveDuty.value;
};

const getDataRegular = async () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchDataRegular)
    .setAfter(afterSearchRegular)
    .run();
};

//  조회
const searchData = async () => {
  searchParams.REQ_DT_FR = searchParams.TMP_REQ_DT_FR.replaceAll("-", "");
  searchParams.REQ_DT_TO = searchParams.TMP_REQ_DT_TO.replaceAll("-", "");

  const res = await commonSearchApi({
    queryId: "HLTHA0030_SEARCH_01",
    param: searchParams,
  });

  return res;
  // if(searchParams.REQ_DIV === 'A'){

  // }else{
  //   return commonSearchApi({
  //     queryId: "HLTHA0030_SEARCH_01_2",
  //     param: searchParams,
  //   });
  // }
};

// 조회 후
const afterSearch = (res) => {
  // grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    if (receiveDuty.value) {
      if (dataCell.dataColumn.name === "RECEIVE_TG") {
        return { style: { background: "#FFC0C0" } };
      }
    } else {
      if (dataCell.dataColumn.name === "RECEIVE_RULE") {
        return { style: { background: "#FFFFFF" } };
      }
    }
  });

  grdMain.value.getGridView().columnByName("RECEIVE_TG").visible =
    receiveDuty.value;

  //console.log('데이타 : ', regularData.value)

  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);
};

const searchDataRegular = async () => {
  if (searchParams.REQ_DIV === "A") {
    return;
  }
  const res = await commonSearchApi({
    queryId: "HLTHA0030_SEARCH_REGULAR",
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      YEAR: searchParams.YEAR,
    },
  });
  return res;
};

const afterSearchRegular = (res) => {
  regularData.value = res.ORESULT_CUR;
};

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true);

  // validation 체크
  if (checkedRows.length == 0) {
    return Message.warn(t("저장할 데이터가 없습니다."));
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    if (isEmpty(data.CMPNY_DIV)) {
      return Message.warn(t("사업부는 필수 입력입니다."));
    } else if (isEmpty(data.YEAR)) {
      return Message.warn(t("년도는 필수 입력입니다."));
    } else if (isEmpty(data.REQ_DIV)) {
      return Message.warn(t("신청구분은 필수 입력입니다."));
    } else if (isEmpty(data.REQ_CHA)) {
      return Message.warn(t("신청시기는 필수 입력입니다."));
    } else if (isEmpty(data.EMP_NO)) {
      return Message.warn(t("사번은 필수 입력입니다."));
    }

    // if (isEmpty(data.RECEIVE_YN)) { //&& data.STATUS === '3'
    //   Message.warn(t("지급여부를 선택해주세요."));
    //   grdMain.value
    //     .getGridView()
    //     .setCurrent({ dataRow: rowIdx, column: "RECEIVE_YN" });
    //   grdMain.value.getGridView().setFocus(true);
    //   return false;
    // }

    if (isEmpty(data.RECEIVE_DT) && data.RECEIVE_YN == "Y") {
      Message.warn(t("지급일자를 선택해주세요."));
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: rowIdx, column: "RECEIVE_DT" });
      grdMain.value.getGridView().setFocus(true);
      return false;
    }

    //수시
    if (searchParams.REQ_DIV === "B") {
      let regular = {}
      let receiveDt
      if(!isEmpty(data.RECEIVE_DT)){
        receiveDt = `${data.RECEIVE_DT.getFullYear()}${String(
          data.RECEIVE_DT.getMonth() + 1
        ).padStart(2, "0")}${String(data.RECEIVE_DT.getDate()).padStart(2, "0")}`;
        let reqCha =
          `${data.YEAR}0101` <= receiveDt && receiveDt <= `${data.YEAR}0630`
            ? 1
            : 2;
        regular = regularData.value.filter(
          (row) => row.EMP_NO === data.EMP_NO && row.REQ_CHA === reqCha
        );
      }
      
      // console.log('111 : ', regularData.value.filter(row => row.EMP_NO === data.EMP_NO))
      // console.log('222 : ', regular)

      //console.log(`${rowIdx} as :`, regular)
      // const regularYn = Object.entries(regularData.value).some(
      //   ([key, value]) => (key === 'EMP_NO' && value === data.EMP_NO) &&
      //                     (key === 'REQ_CHA' && value === reqCha)
      // )
      // Object.entries(regular).some(
      //   ([key, value]) => (key === 'EMP_NO' && value === data.EMP_NO) &&
      //                     (key === 'REQ_CHA' && value === reqCha)
      // );

      //console.log('regular : ', regular)

      //정기신청 Y
      if (regular.length > 0) {
        if (
          data.REASON != "02" &&
          regular[0].ST_DATE <= receiveDt &&
          receiveDt <= regular[0].RECEIVE_EN_DATE
        ) {
          vm.$swal({
            title: t(
              `[${data.EMP_NM}(${data.EMP_NO}) ${data.JOB_TIT_NM}] 정기분 신청건이 있습니다.\r\n미지급으로 변경하시겠습니까?`
            ),
            //'안전화,안전장화 강제 대상여부 관리를 업로드 하시겠습니까?\r\n신규 대상이 아니면 이전 결과는 모두 갱신 됩니다.'
            showCancelButton: true,
          }).then((res) => {
            if (res.isConfirmed === true) {
              grdMain.value
                .getDataProvider()
                .setValue(rowIdx, "RECEIVE_YN", "N");
              grdMain.value
                .getDataProvider()
                .setValue(rowIdx, "RECEIVE_DT", "");
              grdMain.value
                .getDataProvider()
                .setValue(rowIdx, "RECEIVE_TYPE", "");
            }
          });
        } else if (data.REASON === "02") {
          //&& regular[0].COUPON_YN === 'N'
          let dateStr = regular[0].RECEIVE_ST_DATE;

          let year = parseInt(dateStr.slice(0, 4));
          let month = parseInt(dateStr.slice(4, 6)) - 1;
          let day = parseInt(dateStr.slice(6, 8));

          let dateObj = new Date(year, month, day);
          dateObj.setMonth(dateObj.getMonth() - 1);

          let newDateStr =
            dateObj.getFullYear().toString() +
            String(dateObj.getMonth() + 1).padStart(2, "0") +
            String(dateObj.getDate()).padStart(2, "0");

          if (newDateStr <= receiveDt && receiveDt <= dateStr) {
            vm.$swal({
              title: t(
                `[${data.EMP_NM}(${data.EMP_NO}) ${data.JOB_TIT_NM}] 대체지급 대상(지급일 한달 이내)건 입니다.\r\n대체지급으로 변경하시겠습니까?`
              ),
              showCancelButton: true,
            }).then((res) => {
              if (res.isConfirmed === true) {
                grdMain.value
                  .getDataProvider()
                  .setValue(rowIdx, "RECEIVE_YN", "N");
                grdMain.value
                  .getDataProvider()
                  .setValue(rowIdx, "RECEIVE_TYPE", "B");
              }
            });
          }
        } else if (
          data.REASON === "2" &&
          regular[0].COUPON_YN === "Y" &&
          regular[0].RECEIVE_EN_DATE < receiveDt
        ) {
          vm.$swal({
            title: t(
              `[${data.EMP_NM}(${data.EMP_NO}) ${data.JOB_TIT_NM}] 선지급 대상(쿠폰 지급 이후)건 입니다.\r\n선지급으로 변경하시겠습니까?`
            ),
            showCancelButton: true,
          }).then((res) => {
            if (res.isConfirmed === true) {
              grdMain.value
                .getDataProvider()
                .setValue(rowIdx, "RECEIVE_YN", "N");
              grdMain.value
                .getDataProvider()
                .setValue(rowIdx, "RECEIVE_TYPE", "C");
            }
          });
        }
      }
    }
  }
  return true;
};

const saveData = () => {
  let saveParams = [];
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true);

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    if (isEmpty(data.REGIST.trim())) continue;

    data.RECEIVE_DT = dayjs(data.RECEIVE_DT).format("YYYYMMDD");
    data.USER_ID = userStore.userId
    saveParams.push(data);
  }
  return commonExecuteApi({ queryId: "HLTHA0030_SAVE_05", list: saveParams });
};

const afterSaveData = () => {
  getData();
  Message.success(t("성공적으로 저장되었습니다"));
};

const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

const deleteData = async () => {
  let temp = null
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  //     if(dataSource.getValue(dataRow, "STATUS") != "3" ){
  //       return false;
  //     }

  //     if(dataSource.getValue(dataRow, "RECEIVE_APPROVAL_YN") === 'Y'){
  //       return false;
  //     }else if(dataSource.getValue(dataRow, "RECEIVE_APPROVAL_YN") === 'N'){
  //       return false;
  //     }else if(dataSource.getValue(dataRow, "APPROVAL") === 'Y'){
  //       return true;
  //     }else{
  //       return true;
  //     }
  //   }
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.RECEIVE_YN === 'Y'){
      let deleteParam = [{
        CMPNY_DIV : data.CMPNY_DIV,
        YEAR      : data.YEAR,
        REQ_DIV   : data.REQ_DIV,
        REQ_CHA   : data.REQ_CHA,
        EMP_NO    : data.EMP_NO,
        USER_ID   : userStore.userId,
      }]
      temp = commonExecuteApi({ queryId : 'HLTHA0030_DELETE_02', list: deleteParam }) 
    }
  }
  return temp
}

//삭제 후
const afterDelete = async () => {
  await onButtonsClick({ id: 'btnSearch' })
}





const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow);
  if (
    ["REMARK", "RECEIVE_DT", "RECEIVE_YN", "RECEIVE_TYPE"].includes(
      clickData.fieldName
    )
  )
    return;
  hltha0030Popup04.value.openPopup(data);
};

const afterPop = async (payYn) => {
  if (payYn) onButtonsClick({ id: "btnSearch" });
};

const approvalCheck = () =>{
  const dataProvider = grdMain.value.getDataProvider();
  const gridView = grdMain.value.getGridView();
  const rowCount = dataProvider.getRowCount();
  let checkList = [];

  for(let i = 0; i < rowCount; i++){
    const approvalValue = dataProvider.getValue(i, "APPROVAL")
    const statusValue = dataProvider.getValue(i, "STATUS")
    const hld = dataProvider.getValue(i, "HLD_OFFI_GBN")
    const shoes = ["100", "101", "102", "108"].includes(grid.getValue(i, "SHOES_KIND"))

    if(approvalValue === 'Y' && statusValue === '3' && hld === '1' && shoes){
      checkList.push(i);
      //gridView.checkRows([i], true);
    }
  }

  gridView.checkRows(checkList, true);
}

const sendMail = () =>{
  onButtonsClick({ id: "btnSearch" });
}

const allReceive = () =>{
  const dataProvider = grdMain.value.getDataProvider();
  const gridView = grdMain.value.getGridView();
  const rowCount = dataProvider.getRowCount();

  for(let i = 0; i < rowCount; i++){
    const approvalValue = dataProvider.getValue(i, "RECEIVE_APPROVAL_YN")
    const statusValue = dataProvider.getValue(i, "STATUS")

    if(approvalValue === 'Y' && statusValue === '3'){
      dataProvider.setValue(i, "RECEIVE_YN", "Y");
      dataProvider.setValue(i, "RECEIVE_TYPE", "A");
    }
  }
}

// watch(
//   () => searchParams.YEAR,
//   (newValue, oldValue) => {
//     grdMain.value.getDataProvider().setRows([]);
//     getData();
//   }
// );

// watch(
//   () => searchParams.REQ_DIV,
//   (newValue, oldValue) => {
//     if (newValue == "A") {
//       menuTitle.value.disableBtn("btnRegularBulkUpload", false);
//       menuTitle.value.disableBtn("btnNonRegularBulkUpload", true);
//       menuTitle.value.disableBtn("btnTurnBack", true);
//       menuTitle.value.disableBtn("btnApprove", true);
//     } else {
//       menuTitle.value.disableBtn("btnRegularBulkUpload", true);
//       menuTitle.value.disableBtn("btnNonRegularBulkUpload", false);
//       menuTitle.value.disableBtn("btnTurnBack", false);
//       menuTitle.value.disableBtn("btnApprove", false);
//     }
//     grdMain.value.getDataProvider().setRows([]);
//     getData();
//   }
// );
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnRegularBulkUpload',
          'btnNonRegularBulkUpload',
          'btnSearch',
          'btnSendMail',
          'btnUpdate',
          'btnDelete',
        ]"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
      <!-- 'btnTurnBack',
          'btnApprove', -->
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex flex-column">
          <div class="d-flex mb-2">
            <i-select
              v-model="searchParams.YEAR"
              :label="$t('해당년도')"
              label-width="50px"
              type="YEAR"
              width="200px"
            />
            <!-- <i-select
            v-model="searchParams.YEAR"
            :label="$t('해당년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />  -->
            <i-select
              v-model="searchParams.REQ_DIV"
              :label="$t('구분')"
              label-width="50px"
              :items="codeList.REQ_DIV"
              item-value="COD"
              item-title="TXT"
              width="200px"
              @update:modelValue="onReqDivChange"
            />
            <div v-if="searchParams.REQ_DIV == 'A'" class="d-flex">
              <i-select
                v-model="searchParams.REQ_CHA"
                :label="$t('신청시기')"
                label-width="50px"
                :items="codeList.REQ_CHA"
                item-value="COD"
                item-title="TXT"
                width="200px"
              />
              <VRadioGroup
                v-model="searchParams.RECEIVER"
                class="mt-auto pl-3 pr-3 radio radioStyle"
                inline
              >
                <VRadio
                  v-for="(item, i) in codeList.RECEIVER"
                  :key="i"
                  :value="item.COD"
                  :label="item.TXT"
                />
              </VRadioGroup>
            </div>
            <div v-else class="d-flex">
              <VRadioGroup
                v-model="searchParams.STATUS"
                class="mt-auto pl-3 pr-3 radio radioStyle"
                inline
              >
                <VRadio
                  v-for="(item, i) in codeList.STATUS"
                  :key="i"
                  :value="item.COD"
                  :label="item.TXT"
                />
              </VRadioGroup>
              <!-- <v-radio-group
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
              </v-radio-group> -->
              <i-input
                v-model="searchParams.TMP_REQ_DT_FR"
                type="date"
                width="160px"
                class="mr-2"
              />
              <i-input
                v-model="searchParams.TMP_REQ_DT_TO"
                label-width="20px"
                :label="$t('~')"
                type="date"
                width="180px"
              />
              <i-select
                v-model="searchParams.RECEIVER_YN"
                :label="$t('지급여부')"
                label-width="50px"
                :items="codeList.RECEIVE_YN"
                item-value="COD"
                item-title="TXT"
                width="200px"
              />
              <i-select
                v-model="searchParams.USER_DIV"
                :label="$t('회사구분')"
                label-width="50px"
                :items="codeList.ORGN_DIV"
                item-value="COD"
                item-title="TXT"
                width="200px"
              />
            </div>
          </div>
          <div class="d-flex flex-gap">
            <i-select
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              class="custom-flex-3"
              labelWidth="50px"
              v-model="searchParams.BSNS_CD"
              @update:modelValue="updateBsnsCd"
            />

            <i-select
              :label="$t('부서')"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              class="custom-flex-3"
              labelWidth="50px"
              v-model="searchParams.DEPT_CD"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
            <span class="custom-flex-3"/>
            <span class="custom-flex-3"/>
            <span class="custom-flex-1"/>
            <span class="custom-flex-1"/>
            <v-btn
              v-if="searchParams.REQ_DIV == 'B'"
              class="custom-flex-1"
              style="color: #fff; background: #1a40c7; padding: 4px"
              @click="approvalCheck"
            >
              검토 비대상 일괄 선택
            </v-btn>
            <span v-else class="custom-flex-1"/>
            <!-- <v-btn
              v-if="searchParams.REQ_DIV == 'B'"
              class="custom-flex-1"
              style="color: #fff; background: #1a40c7; padding: 4px"
              @click="allReceive"
            >
              일괄 지급 변경
            </v-btn>
            <span v-else class="custom-flex-1"/> -->
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys"
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
      <!-- 팝업존 -->
      <HLTHA0030Popup01 ref="hltha0030Popup01" @after-search="afterPop" />
      <HLTHA0030Popup02 ref="hltha0030Popup02" @after-search="afterPop" />
      <HLTHA0030Popup03
        ref="hltha0030Popup03"
        @after-search="onButtonsClick({ id: 'btnSearch' })"
      />
      <HLTHA0030Popup04 ref="hltha0030Popup04" />
      <HLTHA0030Popup05 ref="hltha0030Popup05" @send-notify="sendMail" />
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

.flex-gap {
  gap: 20px;
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

.radioStyle {
  padding-left: 5px;
  height: 35px;
  font-size: x-small;
  display: flex;
  align-items: center;
}

</style>