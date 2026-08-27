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
import HLTHA0020Popup04 from "./HLTHA0020Popup04.vue";

const props = defineProps({
  bsnsCd: String,
  deptCd: String,
  cmpnyCd: String,
  asgnCd: String,
  outYn: String,
  dutyYn: String,
  isAdmin: Number,
});

const grdMain = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const hLTHA0020Popup04 = ref(null);

// const searchParam = reactive({
//   CMPNY_DIV: userStore.cmpnyDiv,
//   ASGN_CD: '',
//   YN: "N",
// });

const codeList = reactive({
    USER_DIV: [
    { COD: 'A', TXT: '직영', DISABLE: false },
    { COD: 'B', TXT: '사내협력사', DISABLE: false },
    { COD: 'ZA', TXT: '직영외', DISABLE: false },
    { COD: 'ZB', TXT: '직영외', DISABLE: false },
    { COD: 'ZZ', TXT: '직영외', DISABLE: false },
    { COD: 'Z', TXT: '직영외', DISABLE: false },
  ],
  SHOES_KIND:[],
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
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("소속") },
      styleName: "left-column",
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
      fieldName: "SHOES_SUM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("신청수량") },
      styleName: "right-column",
    },

    // {
    //   fieldName: "SHOES_SUM_103",
    //   dataType: "text",
    //   width: "100",
    //   editable: false,
    //   header: { text: t('4"절연단화') },
    //   styleName: "right-column",
    //   displayCallback: function (grid, index, value) {
    //       return value === '0' ? "" : value;
    //   }
    // },
    // {
    //   fieldName: "SHOES_SUM_106",
    //   dataType: "text",
    //   width: "100",
    //   editable: false,
    //   header: { text: t('4"백색단화') },
    //   styleName: "right-column",
    //   displayCallback: function (grid, index, value) {
    //       return value === '0' ? "" : value;
    //   }
    // },
    // {
    //   fieldName: "SHOES_SUM_107",
    //   dataType: "text",
    //   width: "100",
    //   editable: false,
    //   header: { text: t('4"정전기단화') },
    //   styleName: "right-column",
    //   displayCallback: function (grid, index, value) {
    //       return value === '0' ? "" : value;
    //   }
    // },
    // {
    //   fieldName: "SHOES_SUM_105",
    //   dataType: "text",
    //   width: "100",
    //   editable: false,
    //   header: {
    //     text: t('6"일반화\n(지퍼부착)'),
    //     styleName: "multiline-editor",
    //   },
    //   styleName: "right-column",
    //   displayCallback: function (grid, index, value) {
    //       return value === '0' ? "" : value;
    //   }
    // },
    // {
    //   fieldName: "SHOES_SUM_100",
    //   dataType: "text",
    //   width: "100",
    //   editable: false,
    //   header: {
    //     text: t('8"일반화\n(지퍼부착형)'),
    //     styleName: "multiline-editor",
    //   },
    //   styleName: "right-column",
    //   displayCallback: function (grid, index, value) {
    //       return value === '0' ? "" : value;
    //   }
    // },
    // {
    //   fieldName: "SHOES_SUM_101",
    //   dataType: "text",
    //   width: "100",
    //   editable: false,
    //   header: {
    //     text: t('8"절연화\n(지퍼 미부착형)'),
    //     styleName: "multiline-editor",
    //   },
    //   styleName: "right-column",
    // },
    // {
    //   fieldName: "SHOES_SUM_108",
    //   dataType: "text",
    //   width: "100",
    //   editable: false,
    //   header: {
    //     text: t('8"논슬립\n(지퍼부착)'),
    //     styleName: "multiline-editor",
    //   },
    //   styleName: "right-column",
    //   displayCallback: function (grid, index, value) {
    //       return value === '0' ? "" : value;
    //   }
    // },
    // {
    //   fieldName: "SHOES_SUM_102",
    //   dataType: "text",
    //   width: "100",
    //   editable: false,
    //   header: { text: t('8"블라스팅') },
    //   styleName: "right-column",
    //   displayCallback: function (grid, index, value) {
    //       return value === '0' ? "" : value;
    //   }
    // },

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
    // {
    //   fieldName: "ASGN_FULL_NM",
    //   visible: false,
    //   header: { text: t("소속") },
    // },

    {
      fieldName: "BSNS_CD",
      visible: false,
    },
    {
      fieldName: "DEPT_CD",
      visible: false,
    },
    {
      fieldName: "ASGN_CD",
      visible: false,
    },
  ],
  fields_shoes: [],
  columns: [],
  columnLayout: [],
});

grdMainProps.columns = grdMainProps.fields;

const initCodeList = async () => {
  //grdMain.value.setBindingColumn("USER_DIV", codeList.USER_DIV, "COD", "TXT");
  const res = await Promise.all([
    getCodeList('HHII710A'), // 도수보안경
  ])

  codeList.SHOES_KIND = res[0].ORESULT_CUR;
};

onMounted(async() => {
    // await initCodeList()

    // grdMain.value.getGridView().header.height = 70;
    // grdMain.value.getGridView().filterPanel.visible = true;
})

const setSizeColumn = async () => {

  let shoesArray = [];

  codeList.SHOES_KIND.forEach((item) => {
    shoesArray.push(t(item.COD));
    // console.log('item.COD : ',item.COD)
    // console.log('item.TXT : ',item.TXT)
    grdMainProps.fields_shoes.push({
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
    "ASGN_FULL_NM",
    "REQ_DIV_NM",
    "USER_DIV",
    "REQ_CHA_DT_NM",
    "RCV_SUM",
    "SHOES_SUM",
    {
      name: "안전화 종류별 신청수량",
      direction: "horizontal",
      header: { text: "안전화 종류별 신청수량" },
      items: shoesArray,
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
    ...grdMainProps.fields_shoes
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
  grdMain.value.getDataProvider().clearRows();
  return commonSearchApi({
    queryId: 'HLTHA0020_SEARCH_01',
    param: {
        CMPNY_DIV   : userData.CMPNY_DIV,
        USER_DIV    : userData.USER_DIV,
        USER_ID     : userData.USER_ID,
        DEPT_CD     : userData.DEPT_CD,
        ASGN_CD     : userData.ASGN_CD,
        OUT_YN      : userData.OUT_YN,
        ADMIN       : props.isAdmin,
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
    BSNS_CD   : data.BSNS_CD,
    DEPT_CD   : data.DEPT_CD,
    ASGN_CD   : data.ASGN_CD,
    OUT_YN    : data.USER_DIV === "A" ? "N" : "Y",
    ASGN_FULL_NM : data.ASGN_FULL_NM,
    USER_DIV  : data.USER_DIV
  }

  hLTHA0020Popup04.value.openPopup(dataParam);
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
              :column-layout="grdMainProps.columnLayout"
              @onCellDblClicked = "onCellDblClicked"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <HLTHA0020Popup04 ref="hLTHA0020Popup04" />
</template>

<style scoped lang="scss">
// .content-area {
//   position: relative;
//   height: calc(100vh - (205px - 12px));
//   overflow-y: auto;
//   > div {
//     min-height: 700px;
//   }
// }
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