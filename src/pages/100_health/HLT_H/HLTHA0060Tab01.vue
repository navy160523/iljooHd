<script setup>
import { defineComponent } from "vue";
import IGridTitle from "@/components/IGridTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from "@/utils/saveFlowHelper";
import { useUserStore } from "@hiway/stores/user";
import { gridLicenseCode } from "realgrid";
import dayjs from "dayjs";
import Message from "@hiway/utils/notify";

const menuTitle = ref(null);
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const grdMain = ref(null);
const userStore = useUserStore();
const shoesSizeArray = ref([]);

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: new Date().getFullYear().toString(),
  REQ_CHA: "1",
});

const codeList = reactive({
  REQ_CHA: [], //신청시기
  SHOES_SIZE: [], //안전화 사이즈
  INSORE_GROUP: [
    { COD: "COMMON", TXT: "일반" },
    { COD: "INSOLE", TXT: "보온" },
    { COD: "SPARE", TXT: "여유분" },
    { COD: "TOTAL", TXT: "소계" },
  ],
});

const initCodeList = async () => {
  const res = await Promise.all([
    getCodeList("HHII808A"), // 신청시기
    getCodeList("HHII720"), // 안전화 사이즈
  ]);

  codeList.REQ_CHA = res[0].ORESULT_CUR;
  codeList.SHOES_SIZE = res[1].ORESULT_CUR;
  //codeList.REQ_CHA.unshift({ TXT: "전체", COD: "" });
};

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
  } else if (btn.id === "btnUpdate") {
    //console.log('213131 : ', getSpareRows())
    new saveFlowHelper(vm, t)
      //.setBefore(beforeSave)
      .setQuery(saveDatas)
      .setAfter(afterSave)
      .run();
    //new queryFlowHelper(vm, t).setQuery(saveDatas).setAfter(afterSave).run();
  } else if (btn.id === "btnPrint") {
    onExceldown();
  }
};

const getSpareRows = async () => {
  // 여유분 rowIndex 탐지 로직
  const dataProvider = grdMain.value.getDataProvider();
  const rowCount = dataProvider.getRowCount();

  const spareIndexs = [];

  for (let i = 0; i < rowCount; i++) {
    const value = dataProvider.getValue(i, "INSORE_GROUP");

    if (value === "SPARE") {
      spareIndexs.push(i);
    }
  }

  return spareIndexs;
};

const beforeSave = async () => {};

const saveDatas = async () => {
  let spareRows = await getSpareRows();

  let saveParam = [];

  for (let rowIdx of spareRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);

    const infoKeys = [
      "CMPNY_DIV",
      "YEAR",
      "REQ_CHA",
      "INSORE_GROUP",
      "SHOES_KIND",
      "SHOES_NAME",
      "VEND_NAME",
      "TOTAL_CNT",
      "REMARKS",
    ];
    const shoesKeys = Object.keys(data).filter(
      (item) => !infoKeys.includes(item)
    );

    const shoesHeader = shoesKeys.join(",");
    const shoesValues = shoesKeys.map((k) => data[k]).join(",");

    const names = shoesHeader.split(",");
    const values = shoesValues.split(",");

    const headerResult = names.map((val) => `"${val}"`).join(", ");
    const valueResult = values
      .map((val, idx) => `${val || 0} AS "${names[idx]}"`)
      .join(", ");

    console.log("headerResult : ", headerResult);
    console.log("valueResult : ", valueResult);

    let saveData = {
      CMPNY_DIV: searchParam.CMPNY_DIV,
      YEAR: searchParam.YEAR,
      REQ_CHA: searchParam.REQ_CHA,
      VEND_NAME: data.VEND_NAME,
      SHOES_KIND: data.SHOES_KIND,
      SHOES_SIZE_HEADER: headerResult,
      SHOES_SIZE_VALUE: valueResult,
      REMARKS: data.REMARKS,
    };
    saveParam.push(saveData);
  }

  return commonExecuteApi({
    queryId: "HLTHA0060_SAVE_01",
    list: saveParam,
  });
};
const afterSave = async () => {};

const onExceldown = async () => {
  if (grdMain.value.getGridView().getItemCount() < 1) {
    Message.warn(t("출력할 데이터가 없습니다."));
    return;
  }

  let std = "";

  if (searchParam.REQ_CHA !== "") {
    std =
      codeList.REQ_CHA.find((item) => item.COD === searchParam.REQ_CHA)?.TXT +
      "_";
  }

  grdMain.value.getGridView().exportGrid({
    type: "excel",
    target: "local",
    lookupDisplay: true,
    fileName:
      "안전보호구_안전화신청 지급 현황(가수량)_" +
      dayjs(new Date()).format("YYYY") +
      "_" +
      std +
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

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHA0060_SEARCH_01",
    param: searchParam,
  });
};

const afterSearch = async(res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

const footersValueCallback = [
  {
    valueCallback: function (grid, column, footerIndex, columnFooter, value) {
      let sum = 0;
      for (var i = 0; i < grdMain.value.getDataProvider().getRowCount(); i++) {
        if (grdMain.value.getDataProvider().getValue(i, "연료명") == "휘발유") {
          sum += grdMain.value
            .getDataProvider()
            .getValue(i, columnFooter.column.fieldName);
        }
      }
      return sum;
    },
    numberFormat: "#,##0.0",
  },
];

const grdMainProps = reactive({
  gridViewOption: {
    header: { height: 45 },
    headerSummaries: { visible: true },
  },
  fields: [],
  fields_shoes: [
    {
      name: "SHOES_NAME",
      fieldName: "SHOES_NAME",
      dataType: "text",
      width: 70,
      editable: false,
      header: { text: " " },
      styleName: "left-column",
      headerSummary: {
        text: "계",
      },
      mergeRule: {
        criteria: "value",
      },
      summaryUserSpans: [{ colspan: 3 }, { colspan: 3 }],
    },
    {
      name: "SHOES_KIND",
      fieldName: "SHOES_KIND",
      dataType: "text",
      width: "50",
      editable: false,
      header: { text: t(" ") },
      styleName: "left-column",
    },
    {
      name: "INSORE_GROUP",
      fieldName: "INSORE_GROUP",
      lookupDisplay: true,
      dataType: "text",
      width: "30",
      editable: false,
      header: { text: t(" ") },
      styleName: "left-column",
    },
    {
      fieldName: "VEND_NAME",
      dataType: "text",
      width: "50",
      editable: false,
      mergeRule: "values['SHOES_NAME'] + value",
      header: { text: t(" ") },
      styleName: "left-column",
    },
    {
      fieldName: "TOTAL_CNT",
      dataType: "number",
      numberFormat: "#,###",
      width: "30",
      editable: false,
      header: { text: t("계") },
      //headerSummary: { numberFormat: "#,###", expression: "sum" },
      headerSummary: {
        expression: "sum",
        numberFormat: "#,##0",
        zeroText: "",
        valueCallback: function (grid, column, childIndex, summary, value) {
          const dataSource = grid.getDataSource();
          const rowCount = dataSource.getRowCount();
          let sum = 0;

          for (let i = 0; i < rowCount; i++) {
            const insoreGroup = grid.getValue(i, "INSORE_GROUP");
            const val = grid.getValue(i, column.fieldName);

            if (insoreGroup !== "TOTAL" && val != null) {
              sum += val;
            }
          }
          if (sum == 0) {
            return null;
          } else {
            return sum;
          }
        },
      },
      styleName: "right-column",
    },
  ],
  fields_size: [],
  fields_remarks: [
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "30",
      editable: true,
      header: { text: t("비고") },
      styleName: "left-column editable_column",
      mergeRule: {
        criteria: "values['VEND_NAME']",
        useValue: false,
      },
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (
          grid.getValue(dataCell.index.itemIndex, "INSORE_GROUP") === "SPARE"
        ) {
          ret = {
            editable: true,
          };
        } else {
          ret = {
            editable: false,
          };
        }
        return ret;
      },
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
      header: { text: t("사업장구분") },
    },
    {
      fieldName: "YEAR",
      visible: false,
      header: { text: t("년도") },
    },
    {
      fieldName: "REQ_CHA",
      visible: false,
      header: { text: t("신청시기") },
    },
  ],

  columns: [],
  columnLayout: [],
});

grdMainProps.columns = grdMainProps.fields;

const setSizeColumn = async () => {
  grdMain.value.getGridView().setOptions({
    summaryMode: "expand",
  });

  let sizeArray = [];
  codeList.SHOES_SIZE.forEach((item) => {
    shoesSizeArray.value.push(t(item.TXT));
    sizeArray.push(t(item.TXT));
    grdMainProps.fields_size.push({
      name: item.COD,
      fieldName: item.COD,
      dataType: "number",
      numberFormat: "#,###",
      width: "30",
      editable: false,
      header: { text: t(item.TXT) },
      styleName: "right-column",
      zeroText: "",
      headerSummary: {
        expression: "sum",
        numberFormat: "#,##0",
        zeroText: "",
        valueCallback: function (grid, column, childIndex, summary, value) {
          const dataSource = grid.getDataSource();
          const rowCount = dataSource.getRowCount();
          let sum = 0;

          for (let i = 0; i < rowCount; i++) {
            const insoreGroup = grid.getValue(i, "INSORE_GROUP");
            const val = grid.getValue(i, column.fieldName);

            if (insoreGroup !== "TOTAL" && val != null) {
              sum += val;
            }
          }
          if (sum == 0) {
            return null;
          } else {
            return sum;
          }
        },
      },
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (
          grid.getValue(dataCell.index.itemIndex, "INSORE_GROUP") === "SPARE"
        ) {
          ret = {
            editable: true,
            styleName: "right-column editable_column",
          };
        } else {
          ret = {
            editable: false,
            styleName: "right-column",
          };
        }
        return ret;
      },
      editor: {
        type: "number", // ✅ 숫자 전용 에디터
        editFormat: "#", // 소수점 없이 정수만
        maxLength: 5, // 예: 최대 3자리까지 입력
        positiveOnly: true, // ✅ 음수 방지 (선택)
      },
    });
  });

  grdMainProps.columnLayout = [
    {
      name: "업체별/종류별",
      direction: "horizontal",
      items: [
        {
          column: "SHOES_NAME",
          summaryUserSpans: [{ colspan: 3 }, { colspan: 3 }],
        },
        "VEND_NAME",
        "INSORE_GROUP",
      ],
      hideChildHeaders: true,
    },
    "TOTAL_CNT",
    {
      name: "사이즈별",
      direction: "horizontal",
      items: sizeArray,
    },
    "REMARKS",
  ];
};

const setGridItem = async () => {
  grdMain.value.getGridView().onEditCommit = function (
    grid,
    index,
    oldValue,
    newValue
  ) {
    setTimeout(() => {
      const fieldName = grid.getColumn(index.fieldIndex).fieldName;
      const provider = grdMain.value.getDataProvider();
      const inputIndex = index.itemIndex;
      const row = index.dataRow;
      const inputShoes = provider.getValue(row, "SHOES_NAME");
      const inputVend = provider.getValue(row, "VEND_NAME");

      if (fieldName === "REMARKS") {
        let span = grdMain.value
          .getGridView()
          .getMergedItems(inputIndex, fieldName, true, true);
        var sel = {
          startItem: span[0],
          endItem: span[span.length - 1],
          style: "rows",
        };

        provider.setValue(sel.startItem, fieldName, newValue);

        // for (let rows = sel.startItem; rows <= sel.endItem; rows++) {
        //   dataProvider.setValue(rows, fieldName, newValue);
        // }
      } else {
        const rowCnt = provider.getRowCount();
        let findIndex = -1;
        let sum = 0;

        for (let i = 0; i < rowCnt; i++) {
          const val1 = provider.getValue(i, "SHOES_NAME");
          const val2 = provider.getValue(i, "INSORE_GROUP");
          const val3 = provider.getValue(i, "VEND_NAME");
          if (val1 === inputShoes && val2 === "TOTAL" && val3 === inputVend) {
            findIndex = i;
          }

          if (val1 === inputShoes && val3 === inputVend && val2 !== "TOTAL") {
            sum += provider.getValue(i, fieldName);
          }
        }

        provider.setValue(findIndex, fieldName, sum);

        let rowSum = 0;
        let totalSum = 0;

        for (let size of shoesSizeArray.value) {
          rowSum += provider.getValue(inputIndex, size);
          totalSum += provider.getValue(findIndex, size);
        }

        provider.setValue(inputIndex, "TOTAL_CNT", rowSum);
        provider.setValue(findIndex, "TOTAL_CNT", totalSum);
      }
    }, 0);
  };
};

const onCellClicked = async (grid, clickData) => {
  const fieldName = clickData.fieldName; //grid.getColumn(clickData.itemIndex).fieldName;

  if (fieldName === "REMARKS") {
    const provider = grdMain.value.getDataProvider();
    const inputIndex = clickData.itemIndex;
    const row = clickData.itemIndex.dataRow;

    let span = grdMain.value
      .getGridView()
      .getMergedItems(inputIndex, fieldName, true, true);
    var sel = {
      startItem: span[0],
      endItem: span[span.length - 1],
      style: "rows",
    };

    let spareIndexs = -1;

    for (let rows = sel.startItem; rows <= sel.endItem; rows++) {
      if (provider.getValue(rows, "INSORE_GROUP") === "SPARE") {
        spareIndexs = rows;
        break;
      }
    }

    if (spareIndexs >= 0) {
      grdMain.value
        .getGridView()
        .setCurrent({ dataRow: spareIndexs, column: "REMARKS" });
      grdMain.value.getGridView().setFocus(true);
    }
  }
};

onMounted(async () => {
  await initCodeList();
  await setSizeColumn();
  await setGridItem();
  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);
  const cols = [
    ...grdMainProps.fields_shoes,
    ...grdMainProps.fields_size,
    ...grdMainProps.fields_remarks,
  ];
  grdMainProps.columns = grdMainProps.fields = cols;
  grdMain.value.getDataProvider().setFields(grdMainProps.fields);
  grdMain.value.getGridView().setColumns(grdMainProps.columns);
  grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout);
  grdMain.value.getGridView().displayOptions.editItemMerging = true;
  grdMain.value.setBindingColumn(
    "INSORE_GROUP",
    codeList.INSORE_GROUP,
    "COD",
    "TXT"
  );
  grdMain.value.getGridView().filterPanel.visible = true;
  grdMain.value.getGridView().displayOptions.editItemMerging = true;
});
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnUpdate', 'btnPrint']"
        @click-button="onButtonsClick"
        :use-permission="false"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('해당년도')"
              width="200px"
              type="YEAR"
              v-model="searchParam.YEAR"
            >
            </i-select>
            <i-select
              :label="$t('신청시기')"
              width="200px"
              item-title="TXT"
              item-value="COD"
              :items="codeList.REQ_CHA"
              v-model="searchParam.REQ_CHA"
            >
            </i-select>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellClicked="onCellClicked"
          >
            <!-- :column-layout="grdMainProps.columnLayout" -->
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 280px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
