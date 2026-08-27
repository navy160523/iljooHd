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
import HLTHF0040Popup from "./HLTHF0040Popup02.vue";
import dayjs from "dayjs";

const grdMain = ref(null);
const grdExcel = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const hLTHF0040Popup = ref(null);

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: "",
});

const codeList = reactive({
  BSNS_CD: [],
  YN: [
    { COD: "", TXT: "" },
    { COD: "Y", TXT: "대상" },
    { COD: "N", TXT: "비대상" },
  ],
});

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    //headerHeight: 60,
    rowIndicator: {
      visible: false,
    },
  },
  fields: [
    {
      fieldName: "BSNS_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("사업부") },
      styleName: "left-column",
      mergeRule: {
        criteria: "value",
      },
    },
    {
      fieldName: "ASGN_SHRT_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("부서") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "SHOES_YN",
      dataType: "text",
      width: "100",
      header: { text: t("안전화 대상여부") },
      lookupDisplay: true,
      styleName: "left-column",
      //   'styleCallback': function(grid, dataCell){
      //     var ret = {style: {background: undefined}}
      //     ret.style.background = '#eff8fd'
      //     return ret
      //   }
    },
    {
      fieldName: "LONG_SHOES_YN",
      dataType: "text",
      width: "100",
      header: { text: t("안전장화 대상여부") },
      lookupDisplay: true,
      styleName: "left-column",
      //   'styleCallback': function(grid, dataCell){
      //     var ret = {style: {background: undefined}}
      //     ret.style.background = '#eff8fd'
      //     return ret
      //   }
    },
    {
      fieldName: "GLASSES_YN",
      dataType: "text",
      width: "100",
      header: { text: t("도수보안경 대상여부") },
      lookupDisplay: true,
      styleName: "left-column",
      //   'styleCallback': function(grid, dataCell){
      //     var ret = {style: {background: undefined}}
      //     ret.style.background = '#eff8fd'
      //     return ret
      //   }
    },
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "300",
      header: { text: t("비고") },
      lookupDisplay: true,
      styleName: "left-column",
      //   'styleCallback': function(grid, dataCell){
      //     var ret = {style: {background: undefined}}
      //     ret.style.background = '#eff8fd'
      //     return ret
      //   }
    },
    //--------------------
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
      fieldName: "ASGN_CD",
      visible: false,
      header: { text: t("조직코드") },
    },
    {
      fieldName: "YN",
      visible: false,
      header: { text: t("신규 여부") },
    },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

const grdExcelProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    //headerHeight: 60,
    rowIndicator: {
      visible: false,
    },
  },
  fields: [
    {
      fieldName: "BSNS_NM",
      dataType: "text",
      width: "150",
      editable: false,
      header: { text: t("사업부") },
      styleName: "left-column",
      mergeRule: {
        criteria: "value",
      },
    },
    {
      fieldName: "ASGN_SHRT_NM",
      dataType: "text",
      width: "200",
      editable: false,
      header: { text: t("부서") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "SHOES_YN",
      dataType: "text",
      width: "100",
      header: { text: t("안전화 대상여부") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "LONG_SHOES_YN",
      dataType: "text",
      width: "100",
      header: { text: t("안전장화 대상여부") },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "GLASSES_YN",
      dataType: "text",
      width: "100",
      header: { text: t("도수보안경 대상여부") },
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
    //--------------------
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
      fieldName: "ASGN_CD",
      visible: false,
      header: { text: t("조직코드") },
    },
    
  ],
  columns: [],
});

grdExcelProps.columns = grdExcelProps.fields;

const reCodeList = (list) => {
  const newArray = list.map((item) => ({
    value: item.COD,
    text: item.TXT,
  }));

  return newArray;
};

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" },
    }), // 사업부
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR;
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" });
  });
};

const setGridItem = async () => {
  //eff8fd
  grdMain.value
    .getGridView()
    .setColumnProperty("SHOES_YN", "lookupData", reCodeList(codeList.YN));

  grdMain.value.getGridView().setColumnProperty("SHOES_YN", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.YN),
  });

  grdMain.value
    .getGridView()
    .setColumnProperty("LONG_SHOES_YN", "lookupData", reCodeList(codeList.YN));
  grdMain.value.getGridView().setColumnProperty("LONG_SHOES_YN", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.YN),
  });

  grdMain.value
    .getGridView()
    .setColumnProperty("GLASSES_YN", "lookupData", reCodeList(codeList.YN));
  grdMain.value.getGridView().setColumnProperty("GLASSES_YN", "editor", {
    type: "dropdown",
    domainOnly: true,
    list: reCodeList(codeList.YN),
  });

  grdMain.value.getGridView().filterPanel.visible = true;
  //#FFDD57
  //   setTimeout(() => {
  //     grdMain.value.getGridView().refresh();
  //   }, 100);
};

onMounted(async () => {
  initCodeList();
  await setGridItem();
});

const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    await Promise.all([
      await new queryFlowHelper(vm, t)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run(),
    ]);
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run();
  } else if (btn.id === "btnNewDeptSearch") {
    hLTHF0040Popup.value.openPopup();
  } else if (btn.id === "btnTotalStatusSearch") {
    await onExceldown();
  }
};

const btnSearch = async () => {
  await Promise.all([
    await new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run(),
  ]);
};

const btnUpdate = async () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(afterSave)
    .run();
};

const btnNewDeptSearch = async () => {
  hLTHF0040Popup.value.openPopup();
};

const btnTotalStatusSearch = async () => {
  await onExceldown();
};

const beforeSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("저장할 데이터를 선택해주세요."));
    return false;
  }
  return true;
};

const saveData = () => {
  let temp = null;
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true);

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    let saveParam = [];
    let saveData = {
      CMPNY_DIV: searchParam.CMPNY_DIV,
      BSNS_CD: data.BSNS_CD,
      DEPT_CD: data.DEPT_CD,
      ASGN_CD: data.ASGN_CD,
      SHOES_YN: data.SHOES_YN,
      LONG_SHOES_YN: data.LONG_SHOES_YN,
      GLASSES_YN: data.GLASSES_YN,
      REMARKS: data.REMARKS,
      USER_ID: userStore.userId,
    };
    saveParam.push(saveData);

    temp = commonExecuteApi({
      queryId: "HLTHF0040_SAVE_02",
      list: saveParam,
    });
  }

  return temp;
};

const afterSave = (res) => {
  const gridView = grdMain.value.getGridView();

  gridView.setAllCheck(false);
  gridView.checkAll(false);
  //onButtonsClick({ id: "btnSearch" });
};

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHF0040_SEARCH_DEPT",
    param: searchParam,
  });
};

const afterSearch = async (res, auto = true) => {
  const gridView = grdMain.value.getGridView();

  gridView.setAllCheck(false);
  gridView.checkAll(false);

  await grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  //   if(auto){
  //     new queryFlowHelper(vm, t)
  //     .setQuery(searchDataDetail)
  //     .setAfter(afterSearchDetail)
  //     .run();
  //   }

  grdMain.value
    .getGridView()
    .setCurrent({ dataRow: 0, column: "ASGN_SHRT_NM" });
  grdMain.value.getGridView().setFocus(true);

  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = { style:{  } } // background: '#eff8fd'
    if(grid.getValue(item.index, 'YN') == 'N') {
      ret.style = { background: '#FF8888' }
    }
    return ret
  })

  await nextTick();
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

const selectedDept = async (selectRow) => {
  searchParam.BSNS_CD = "";

  // ✅ queryFlowHelper 실행 후 완료될 때까지 대기
  await runQueryFlowHelper();

  const fields = grdMain.value.getDataProvider().getOrgFieldNames();
  const rowCnt = grdMain.value.getGridView().getItemCount();

  for (let row = 0; row < rowCnt; row++) {
    let matchCode = false;
    let matchValue = false;

    for (const field of fields) {
      const cellValue = grdMain.value.getDataProvider().getValue(row, field);

      if (field === "DEPT_CD" && cellValue === selectRow.DEPT_CD) {
        matchCode = true;
      }
      if (cellValue === selectRow.ASGN_SHRT_NM) {
        matchValue = true;
      }
      if (matchCode && matchValue) {
        grdMain.value.getGridView().setCurrent({ dataRow: row, field: field });
        return row;
      }
    }
  }
  //await nextTick();

  //Message.warn(t("검색 결과가 없습니다."));
};

const onExceldown = async () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: "",
  };

  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHF0040_SEARCH_DEPT",
      param: param,
    }),
  ]);

  await grdExcel.value.getDataProvider().setRows(res[0].ORESULT_CUR);

  grdExcel.value.getGridView().exportGrid({
    type: "excel",
    target: "local",
    lookupDisplay: true,
    fileName:
      "안전보호구_지급기준관리(부서관리)_" +
      dayjs(new Date()).format("YYYY-MM") +
      ".xlsx", // 저장될 파일 name
    progressMessage: "엑셀 다운로드중입니다.", // 엑셀 다운로드 하는 동안 progressMessage 표시
    indicator: "hidden", // indidator 영역 표시
    header: "visible", // 헤더 표시
    footer: "visible", // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t("엑셀 다운로드가 완료되었습니다."));
    },
  });
};

defineExpose({
  btnSearch,
  btnUpdate,
  btnNewDeptSearch,
  btnTotalStatusSearch,
});
</script>

<template>
  <v-card class="pa-0 fil-height">
    <!-- <v-card-title class="pa-3 pb-0" style="justify-content: space-between">
      <IMenuTitle
        :title="$t('지급기준관리(부서관리)')"
        :button-list="['btnSearch', 'btnUpdate', 'btnNewDeptSearch', 'btnTotalStatusSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title> -->
    <v-card-text class="pa-3 pt-3 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex flex-gap">
            <i-select
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              labelWidth="50px"
              v-model="searchParam.BSNS_CD"
              class="custom-flex-1"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
            <span class="custom-flex-1" />
            <span class="custom-flex-3" />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
          <RealGrid
            v-show="false"
            ref="grdExcel"
            :grid-view-option="grdExcelProps.gridViewOption"
            :fields="grdExcelProps.fields"
            :columns="grdExcelProps.columns"
          />
          <!-- @onCellClicked="onCellClicked" -->
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <HLTHF0040Popup
    @selected="selectedDept"
    ref="hLTHF0040Popup"
  ></HLTHF0040Popup>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 215px);
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 400px;
  // }
}

.multi-line-css {
  white-space: pre;
}

.form-row {
  display: flex;
  flex-wrap: wrap; /* 요소가 넘치면 자동으로 줄 바꿈 */
  gap: 10px; /* 요소 간격 */
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
  flex: 1 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  flex-basis: calc(0% + 10px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-3 {
  /* width: calc(25% - 0px) !important; */
  flex: 3 1 0 !important;
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
