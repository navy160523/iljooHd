<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  computed,
  onBeforeMount,
} from "vue";
import RealGrid from "@/components/RealGrid.vue";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";
import { useUserStore } from "@hiway/stores/user";
import { gridLicenseCode } from "realgrid";
import dayjs from "dayjs";

const props = defineProps({
  cmpnyDiv: String,
  year: String,
});

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const grdMain = ref(null);
const userStore = useUserStore();

const grdMainProps = reactive({
  gridViewOption: {
    header: { height: 45 },
    headerSummaries: { visible: true },
  },
  fields: [
    {
      name: "BSNS_CD",
      fieldName: "BSNS_CD",
      dataType: "text",
      width: "80",
      editable: false,
      lookupDisplay: true,
      header: { text: t("사업부") },
      styleName: "center-column",
      mergeRule: {
        criteria: "value",
      },
      headerSummary: {
        text: "사업부",
        styleName: "center-column",
      },
    },
    {
      name: "FRAME",
      fieldName: "FRAME",
      dataType: "text",
      width: "150",
      editable: false,
      header: { text: t(" ") },
      styleName: "left-column",
      headerSummary: {
        text: "계",
        styleName: "center-column",
      },
    },
  ],
  fields_month: [],
  columns: [],
  columnLayout: [
    {
      name: "구분",
      direction: "horizontal",
      items: [
        {
          column: "BSNS_CD",
        },
        "FRAME",
      ],
      hideChildHeaders: true,
    },
  ],
});

grdMainProps.columns = grdMainProps.fields;

const setGrid = async () => {
  
  //await setYearColumn();
  await setMonthColumn();
  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);

  const cols = [...grdMainProps.fields, ...grdMainProps.fields_month];

  grdMainProps.columns = grdMainProps.fields = cols;
  grdMain.value.getDataProvider().setFields(grdMainProps.fields);
  grdMain.value.getGridView().setColumns(grdMainProps.columns);
  grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout);
  grdMain.value.getGridView().displayOptions.editItemMerging = true;
  grdMain.value.getGridView().filterPanel.visible = true;
  //grdMain.value.setBindingColumn("USER_DIV", codeList.USER_DIV, "COD", "TXT");
};

const setMonthColumn = async() =>{
  grdMain.value.getGridView().setOptions({
    summaryMode: "expand",
  });

  codeList.REQ_CHA.forEach((item) => {
    grdMainProps.fields_month.push({
      name: "CHA_" + item.COD + "_USER_A",
      fieldName: "CHA_" + item.COD + "_USER_A",
      dataType: "number",
      numberFormat: "#,###",
      width: "50",
      editable: false,
      header: { text: t("직영") },
      styleName: "right-column",
      zeroText: "",
      headerSummary: {
        expression: "sum",
        zeroText: "",
      },
    });

    grdMainProps.fields_month.push({
      name: "CHA_" + item.COD + "_USER_B",
      fieldName: "CHA_" + item.COD + "_USER_B",
      dataType: "number",
      numberFormat: "#,###",
      width: "50",
      editable: false,
      header: { text: t("협력사") },
      styleName: "right-column",
      zeroText: "",
      headerSummary: {
        expression: "sum",
        zeroText: "",
      },
    });

    grdMainProps.columnLayout.push(
      {
        name: item.COD + "월",
        direction: "horizontal",
        header: { text: item.COD + "월" },
        items: ["CHA_" + item.COD + "_USER_A", "CHA_" + item.COD + "_USER_B"],
      },
    );
  })
}

// const setYearColumn = async () => {

//   for (let i = parseInt(props.startYaer); i < parseInt(props.endYaer); i++) {

//     // yearArray.push(t())
//     grdMainProps.fields_year.push({
//       name: i.toString() + "AA",
//       fieldName: i.toString() + "AA",
//       dataType: "number",
//       numberFormat: "#,###",
//       width: "50",
//       editable: false,
//       header: { text: t("직영") },
//       styleName: "right-column",
//       zeroText: "",
//     });

//     grdMainProps.fields_year.push({
//       name: i.toString() + "AB",
//       fieldName: i.toString() + "AB",
//       dataType: "number",
//       numberFormat: "#,###",
//       width: "50",
//       editable: false,
//       header: { text: t("협력사") },
//       styleName: "right-column",
//       zeroText: "",
//     });

//     grdMainProps.fields_year.push({
//       name: i.toString() + "BA",
//       fieldName: i.toString() + "BA",
//       dataType: "number",
//       numberFormat: "#,###",
//       width: "50",
//       editable: false,
//       header: { text: t("직영") },
//       styleName: "right-column",
//       zeroText: "",
//     });

//     grdMainProps.fields_year.push({
//       name: i.toString() + "BB",
//       fieldName: i.toString() + "BB",
//       dataType: "number",
//       numberFormat: "#,###",
//       width: "50",
//       editable: false,
//       header: { text: t("협력사") },
//       styleName: "right-column",
//       zeroText: "",
//     });

//     grdMainProps.columnLayout.push(
//       {
//         name: i.toString() + "년 상반기",
//         direction: "horizontal",
//         header: { text: i.toString() + "년 상반기" },
//         items: [i.toString() + "AA", i.toString() + "AB"],
//       },
//       {
//         name: i.toString() + "년 하반기",
//         direction: "horizontal",
//         header: { text: i.toString() + "년 하반기" },
//         items: [i.toString() + "BA", i.toString() + "BB"],
//       }
//     );
//   }
// };

const codeList = reactive({
  REQ_CHA: [], //신청시기
  BSNS_CD: [],
});

const initCodeList = async () => {
  const res = await Promise.all([
    getCodeList("HHII806"),
    commonSearchApi({
      queryId: 'HLTHC0060_BSNS_SEARCH',
      param: {
        CMPNY_DIV: props.cmpnyDiv
      }
    }), 
  ]);

  codeList.REQ_CHA = res[0].ORESULT_CUR;
  codeList.BSNS_CD = res[1].ORESULT_CUR;
};

onMounted(async () => {
  await initCodeList();
  await setGrid();
  grdMain.value.setBindingColumn("BSNS_CD", codeList.BSNS_CD, "COD", "TXT");
  
  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);
});

const searchDatas = async() =>{
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}

const searchData = async () =>{
  console.log('props', props)

  return commonSearchApi({
    queryId: 'HLTHC0060_SEARCH_02',
    param: {
        CMPNY_DIV   : props.cmpnyDiv,
        YEAR  : props.year,
    }
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

defineExpose({
  searchDatas,
});
</script>

<template>
  <v-card class="pa-0 fil-height">
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <div class="h-grow">
          <v-sheet class="pa-0 h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            >
            <!-- :column-layout="grdMainProps.columnLayout" -->
            </RealGrid>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 290px);
  overflow-y: auto;
}
</style>