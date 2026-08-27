<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import Message from "@hiway/utils/notify";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from "@/utils/saveFlowHelper";
import deleteFlowHelper from "@/utils/deleteFlowHelper";
import RealGrid from "@/components/RealGrid.vue";
import IGridTitle from "@/components/IGridTitle.vue";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from "@hiway/api/commonApi";
import EmpPopup from "@/components/popup/EmpPopup.vue";

defineOptions({
  name: "100_health-HLT_H-HLTHF0070",
});

const grdMain = ref(null);
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();
const userLogStore = useLogsStore();
const menuTitle = ref(null);
const dataRes = ref();
const empPopup = ref(null);
const selectDiv = ref("");
const isAdmin = ref(0);

const codeList = reactive({
  //사업부
  BSNS_CD: [],
  REGIST_YN: [
    { TXT: "전체", COD: "N" },
    { TXT: "등록부서만", COD: "Y" },
  ],
});

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: "",
  REGIST_YN: "N",
});

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: "BSNS_CD",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("사업부") },
      lookupDisplay: true,
      styleName: "left-column",
      mergeRule: {
        criteria: "value",
      },
    },
    {
      fieldName: "ASGN_CD",
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("코드") },
      lookupDisplay: true,
      styleName: "center-column",
      mergeRule: {
        criteria: "value",
      },
    },
    {
      fieldName: "ASGN_DESC",
      dataType: "text",
      width: "150",
      editable: false,
      styleName: "left-column",
      header: { text: t("부서명/협력사명") },
      mergeRule: {
        criteria: "value",
      },
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "60",
      editable: false,
      styleName: "center-column",
      header: { text: t("성명") },
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      width: "60",
      editable: false,
      styleName: "left-column",
      header: { text: t("성명") },
    },
    {
      fieldName: "JOB_TIT_NM",
      dataType: "text",
      width: "60",
      editable: false,
      styleName: "left-column",
      header: { text: t("직위") },
    },
    {
      fieldName: "TEL_NO",
      dataType: "text",
      width: "60",
      editable: false,
      styleName: "left-column",
      header: { text: t("사내전화번호") },
    },
    {
      fieldName: "UPDATE_DT",
      dataType: "text",
      width: "80",
      editable: false,
      styleName: "center-column",
      header: { text: t("등록(변경)일") },
    },
    {
      fieldName: "REMARK",
      dataType: "text",
      width: "150",
      editable: true,
      styleName: "left-column editable_column",
      header: { text: t("비고") },
    },
    {
      fieldName: "ORI_ASGN_NM",
      dataType: "text",
      width: "100",
      editable: false,
      styleName: "left-column",
      header: {
        text: t("원소속부서"), //저장 일시\n(최종 저장 일시)
        styleName: "multiline-editor",
      },
    },

    //안보이는컬럼
    {
      fieldName: "CMPNY_DIV",
      visible: false,
      header: { text: t("사업장") },
    },
    {
      fieldName: "SEQ_NO",
      visible: false,
      header: { text: t("연번") },
    },
    {
      fieldName: "ORGN_CD",
      visible: false,
      header: { text: t("조직구분") },
    },
    {
      fieldName: "JOB_TIT_CD",
      visible: false,
      header: { text: t("직위") },
    },
    {
      fieldName: "ORI_ASGN_CD",
      visible: false,
      header: { text: t("원소속부서") },
    },
  ],
  columns: [],
  columnLayout: [
    "BSNS_CD",
    {
      name: "부서/협력사",
      direction: "horizontal",
      items: ["ASGN_CD", "ASGN_DESC"],
    },
    {
      name: "담당자",
      direction: "horizontal",
      items: [
        {
          name: "성명",
          direction: "horizontal",
          hideChildHeaders: true,
          items: ["EMP_NO", "EMP_NM"],
        },
        "JOB_TIT_NM",
        "TEL_NO",
        "UPDATE_DT",
        "REMARK",
        "ORI_ASGN_NM",
      ],
    },
  ],
});

grdMainProps.columns = grdMainProps.fields;

const initCodeList = async () => {
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" },
    }), // 사업부
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR;
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" });

    grdMain.value.setBindingColumn(
      "BSNS_CD",
      codeList.BSNS_CD,
      "BSNS_CD",
      "BSNS_NM"
    );
  });
};

onMounted(async () => {
  if (userStore.authGrpCd.includes("GRP00372")) isAdmin.value = 2;
  else isAdmin.value = 0;

  await initCodeList();

  grdMain.value.getGridView().filterPanel.visible = true;
});

const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
  } else if (btn.id === "btnCreate") {
    openEmpPopup();
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run();
    //HLTHF0070_SAVE_01
  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run();
  }
};

//삭제 전 유효성 검사
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("삭제할 데이터를 선택해주세요."));

    return false;
  }
  return true;
};

//삭제 이벤트
const deleteData = async () => {
  let temp = null;
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true);
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    let deleteParam = [
      {
        CMPNY_DIV: data.CMPNY_DIV,
        BSNS_CD: data.BSNS_CD,
        ASGN_CD: data.ASGN_CD,
        SEQ_NO: data.SEQ_NO,
      },
    ];
    temp = commonExecuteApi({
      queryId: "HLTHF0070_DELETE_01",
      list: deleteParam,
    });
  }
  return temp;
};

//삭제 후
const afterDelete = async () => {
  await onButtonsClick({ id: "btnSearch" });
};

const beforeSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("저장할 데이터를 선택해주세요."));
    return false;
  }
  const provider = grdMain.value.getDataProvider();
  for (const row of checkedData) {
    const empNo = provider.getValue(row, "EMP_NO");
    const empNm = provider.getValue(row, "EMP_NM");

    if (!empNo || !empNm) {
      Message.warn(t("담당자 정보를 입력해주세요."));
      return false;
    }
  }
  return true;
};

const saveData = async () => {
  let temp = null;
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true);
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    let saveParam = [
      {
        CMPNY_DIV: data.CMPNY_DIV,
        BSNS_CD: data.BSNS_CD,
        ASGN_CD: data.ASGN_CD,
        SEQ_NO: data.SEQ_NO,
        EMP_NO: data.EMP_NO,
        REMARK: data.REMARK,
        ORI_ASGN_CD: data.ORI_ASGN_CD,
        USER_ID: userStore.userId,
      },
    ];
    temp = await commonExecuteApi({ queryId: "HLTHF0070_SAVE_01", list: saveParam });
  }
  return temp;
};

const afterSave = (res) => {
  new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
};

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHF0070_SEARCH_01",
    param: searchParam,
  });
};

const afterSearch = (res) => {
  const gridView = grdMain.value.getGridView();

  gridView.setAllCheck(false);
  gridView.checkAll(false);
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  grdMain.value.getGridView().setCurrent({ dataRow: 0, column: "EMP_NO" });
  grdMain.value.getGridView().setFocus(true); 
};

//인원팝업 오픈 이벤트
const openEmpPopup = () => {
  const current = grdMain.value.getGridView().getCurrent();
  const dataProvider = grdMain.value.getDataProvider();
  let rowData;

  if (current.dataRow >= 0) {
    rowData = dataProvider.getJsonRow(current.dataRow);
  } else {
    Message.warn(t("부서를 선택해주세요."));
    return false;
  }

  empPopup.value.openPopup({
    readonly: false,
    CMPNY_DIV_D: true,
    // 2025-06-04 사업부, 부서 활성화(마환구 수정)
    // BSNS_CD_D: true,
    // DEPT_CD_D: true,
    FLAG_D: true,
    DISABLE: ["전체", "사내협력사", "단기공사"],
    BSNS_CD: rowData.BSNS_CD,
    DEPT_CD: rowData.ASGN_CD,
  });
};

const onEmpSelected = (row) => {

  const currentRow = grdMain.value.getGridView().getCurrent().dataRow;

  if (
    grdMain.value
      .getDataProvider()
      .getJsonRows()
      .some(data => data.EMP_NO === row.EMP_NO && data.ASGN_CD === 
      grdMain.value.getDataProvider().getJsonRow(currentRow).ASGN_CD)
  ) {
    return Message.err("이미 등록된 사원입니다.");
  }

  if (currentRow >= 0) {
    if (grdMain.value.getDataProvider().getJsonRow(currentRow).EMP_NO === null) {
      grdMain.value
        .getDataProvider()
        .setValue(currentRow, "EMP_NO", row.EMP_NO);
      grdMain.value
        .getDataProvider()
        .setValue(currentRow, "EMP_NM", row.EMP_NM);
      grdMain.value
        .getDataProvider()
        .setValue(currentRow, "JOB_TIT_NM", row.JOB_TIT_NM);
      grdMain.value
        .getDataProvider()
        .setValue(currentRow, "TEL_NO", row.TEL_NO);
      grdMain.value
        .getDataProvider()
        // .setValue(currentRow, "ORI_ASGN_NM", row.ASGN_SHRT_NM);
        //2025-06-04 추가시에는 원소속부서 풀네임이 보이도록 수정(마환구)
        .setValue(currentRow, "ORI_ASGN_NM", row.ASGN_NM);
      grdMain.value
        .getDataProvider()
        .setValue(currentRow, "ORI_ASGN_CD", row.ASGN_CD);

        grdMain.value.getGridView().checkRow(currentRow, true);
    } else {
        grdMain.value.getDataProvider().insertRow(currentRow+1, {
            CMPNY_DIV: grdMain.value.getDataProvider().getJsonRow(currentRow).CMPNY_DIV,
            BSNS_CD: grdMain.value.getDataProvider().getJsonRow(currentRow).BSNS_CD,
            ASGN_CD: grdMain.value.getDataProvider().getJsonRow(currentRow).ASGN_CD,
            ASGN_DESC: grdMain.value.getDataProvider().getJsonRow(currentRow).ASGN_DESC,
            EMP_NO: row.EMP_NO,
            EMP_NM: row.EMP_NM,
            JOB_TIT_NM: row.JOB_TIT_NM,
            TEL_NO: row.TEL_NO,
            // ORI_ASGN_NM: row.ASGN_SHRT_NM,
            //2025-06-04 추가시에는 원소속부서 풀네임이 보이도록 수정(마환구)
            ORI_ASGN_NM: row.ASGN_NM,
            ORI_ASGN_CD: row.ASGN_CD
        })
        grdMain.value.getGridView().checkRow(currentRow+1, true);
        grdMain.value.getGridView().setCurrent({ dataRow: currentRow+1, column: "EMP_NO" });
        grdMain.value.getGridView().setFocus(true);
    }

    
  }
};
</script>


<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              width="300px"
              labelWidth="50px"
              v-model="searchParam.BSNS_CD"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            >
            </i-select>

            <v-checkbox
              v-model="searchParam.REGIST_YN"
              true-value="Y"
              false-value="N"
              label="등록부서만"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet class="pa-0 h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellDblClicked="onCellDblClicked"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
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
</style>