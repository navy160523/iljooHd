<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, onBeforeMount } from "vue";
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
import queryFlowHelper from '@/utils/searchFlowHelper'
import HLTHC0010Popup04 from "./HLTHC0010Popup04.vue";

const props = defineProps({
  bsnsCd: String,
  deptCd: String,
  cmpnyCd: String,
  asgnCd: String,
  outYn: String,
  dutyYn: String,
});

const grdMain = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const hLTHC0010Popup04 = ref(null);
const glassesKindArray = ref([]);

const codeList = reactive({
    USER_DIV: [
    { COD: 'A', TXT: '직영', DISABLE: false },
    { COD: 'B', TXT: '사내협력사', DISABLE: false },
    { COD: 'Z', TXT: '직영외', DISABLE: false },
  ],
  GLASSES_KIND: [],
})

const grdMainProps = reactive({
  gridViewOption: { 
    checkBar: { visible: false },
  },
  fields: [],
  fields_info: [
    {
      fieldName: "YEAR",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("년도") },
      styleName: "center-column",
    },
    {
      fieldName: "REQ_DIV_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("구분") },
      styleName: "center-column",
    },
    {
      fieldName: "USER_DIV",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("직영구분") },
      styleName: "center-column",
    },
    {
      fieldName: "REQ_CHA_DT_NM",
      dataType: "text",
      width: "100",
      editable: false,
      styleName: "center-column",
      header: {
        text: t("신청시기\n(신청일자)"),
        styleName: "multiline-editor",
      },
    },
    {
      fieldName: "RCV_SUM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("지급수량") },
      styleName: "right-column",
    },
    {
      fieldName: "GLASSES_SUM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("신청수량") },
      styleName: "right-column",
    },

    {
      fieldName: "REQ_DIV",
      visible: false,
      header: { text: t("신청구분") },
    },
    {
      fieldName: "REQ_CHA_DT",
      visible: false,
      header: { text: t("신청일자") },
    },
    {
      fieldName: "ASGN_FULL_NM",
      visible: false,
      header: { text: t("소속") },
    },
  ],
  fields_glasses: [],
  columns: [],
  columnLayout: [],
});

grdMainProps.columns = grdMainProps.fields;

const initCodeList = async () => {
  const res = await Promise.all([
    getCodeList('HHII710B'), // 도수보안경
    // commonSearchApi({
    //   queryId: "HLTHC0010_SEARCH_GLASSES",
    //   param: {
    //     CMPNY_DIV: userStore.cmpnyDiv
    //   },
    // }),
  ])

  codeList.GLASSES_KIND = res[0].ORESULT_CUR;
};

onMounted(async() => {

})

const setSizeColumn = async () => {

  let glassesArray = [];

  codeList.GLASSES_KIND.forEach((item) => {
    glassesArray.push(t(item.COD));
    console.log('item.COD : ',item.COD)
    console.log('item.TXT : ',item.TXT)
    grdMainProps.fields_glasses.push({
      name: item.COD,
      fieldName: item.COD,
      dataType: "number",
      numberFormat: "#,###",
      width: "100",
      editable: false,
      header: { text: t(item.TXT) },
      styleName: "right-column",
      zeroText: "",
    })
  });
  grdMainProps.columnLayout = [
    "YEAR",
    "REQ_DIV_NM",
    "USER_DIV",
    "REQ_CHA_DT_NM",
    "RCV_SUM",
    "GLASSES_SUM",
    {
      name: "도수보안경 종류별 신청수량",
      direction: "horizontal",
      header: { text: "도수보안경 종류별 신청수량" },
      items: glassesArray,
    }
  ];
  
};

grdMainProps.columns = grdMainProps.fields;

const setGrid = async() => {
  await initCodeList()
  await setSizeColumn();
  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);

  const cols = [
    ...grdMainProps.fields_info,
    ...grdMainProps.fields_glasses
  ];

   
   grdMainProps.columns = grdMainProps.fields = cols;
   grdMain.value.getDataProvider().setFields(grdMainProps.fields);
   grdMain.value.getGridView().setColumns(grdMainProps.columns);
   grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout);
   grdMain.value.getGridView().filterPanel.visible = true;
   grdMain.value.setBindingColumn("USER_DIV", codeList.USER_DIV, "COD", "TXT");
}

const searchData = async(userData) =>{
    new queryFlowHelper(vm, t).setQuery(() => searchDatas(userData)).setAfter(afterSearch).run()
}

const searchDatas = (userData) => {
  return commonSearchApi({
    queryId: 'HLTHC0010_SEARCH_01',
    param: {
        CMPNY_DIV   : userData.CMPNY_DIV,
        DEPT_CD     : userData.DEPT_CD,
        ASGN_CD     : userData.ASGN_CD,
        OUT_YN      : userData.OUT_YN,
        //USER_DIV    : userData.USER_DIV
    }
  })
}

const afterSearch = (res) => {
  console.log('res : ',res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellDblClicked = async(grid, clickData) =>{
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  const dataParam = {
    CMPNY_DIV : props.cmpnyCd,
    YEAR      : data.YEAR,
    REQ_DIV   : data.REQ_DIV,
    REQ_CHA   : data.REQ_CHA_DT.replaceAll('-',''),
    REQ_DT    : data.REQ_CHA_DT.replaceAll('-',''),
    BSNS_CD   : props.bsnsCd,
    DEPT_CD   : props.deptCd,
    ASGN_CD   : props.asgnCd,
    //OUT_YN    : data.USER_DIV = 'A' ? 'N' : 'Y',
    ASGN_FULL_NM : data.ASGN_FULL_NM,
    USER_DIV  : data.USER_DIV
  }

  hLTHC0010Popup04.value.openPopup(dataParam);
}

defineExpose({
  searchData,
  setGrid
})
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
              @onCellDblClicked = "onCellDblClicked"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <HLTHC0010Popup04 ref="hLTHC0010Popup04" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (290px));
  overflow-y: auto;
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

</style>