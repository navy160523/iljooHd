<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import dayjs from "dayjs";
import Message from "@hiway/utils/notify";
import queryFlowHelper from "@/utils/searchFlowHelper";
import deleteFlowHelper from "@/utils/deleteFlowHelper";
import RealGrid from "@/components/RealGrid.vue";
import IGridTitle from "@/components/IGridTitle.vue";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from "@hiway/api/commonApi";
import CLDAB0010Popup01 from "./CLDAB0010Popup01.vue";

defineOptions({
  name: "110_cladding-CLD_A-CLDAB0010",
});

const userStore = useUserStore();
const userLogStore = useLogsStore();
const menuTitle = ref(null);
const t = useI18n().t; //다국어
const vm = getCurrentInstance().proxy; //다이얼로그관련
const grdMain = ref(null);
const cLDAB0010Popup01 = ref(null);

const codeList = reactive({
  REQ_CHA: [], //신청시기
});

const initCodeList = () => {
  Promise.all([getCodeList("HHIT050")]).then((res) => {
    codeList.REQ_CHA = res[0].ORESULT_CUR;
    grdMain.value.setBindingColumn("REQ_CHA", codeList.REQ_CHA, "COD", "TXT");
  });
};

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: "YEAR",
      dataType: "text",
      width: "20",
      editable: false,
      header: { text: t("연도") },
    },
    {
      fieldName: "REQ_CHA",
      dataType: "text",
      width: "20",
      editable: false,
      header: { text: t("반기구분") },
      lookupDisplay: true,
      editor: {
        type: "dropdown",
      },
    },
    {
      fieldName: "ST_DATE",
      dataType: "text",
      width: "30",
      editable: false,
      header: { text: t("시작일") },
    },
    {
      fieldName: "EN_DATE",
      dataType: "text",
      width: "30",
      editable: false,
      header: { text: t("마감일") },
    },
    {
      fieldName: "SUSI_ST_DATE",
      dataType: "text",
      width: "30",
      editable: false,
      header: { text: t("시작일") },
    },
    {
      fieldName: "SUSI_EN_DATE",
      dataType: "text",
      width: "30",
      editable: false,
      header: { text: t("마감일") },
    },
    {
      fieldName: "FOCUS_PRD",
      dataType: "text",
      width: "70",
      editable: false,
      header: { text: t("집중운영기간") },
    },
    {
      fieldName: "NORM_PRD",
      dataType: "text",
      width: "70",
      editable: false,
      header: { text: t("일반운영기간") },
    },
    {
      fieldName: "REMARKS",
      width: "150",
      styleName: "left-column",
      editable: false,
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t("비고") },
    },

    //안보이는컬럼
    {
      fieldName: "CMPNY_DIV",
      visible: false,
      header: { text: t("사업장구분") },
    },
  ],
  columns: [],
  columnLayout: [
    "YEAR",
    "REQ_CHA",
    {
      name: "정기신청 기간",
      direction: "horizontal",
      items: ["ST_DATE", "EN_DATE"],
    },
    {
      name: "수시신청 기간",
      direction: "horizontal",
      items: ["SUSI_ST_DATE", "SUSI_EN_DATE"],
    },
    "FOCUS_PRD",
    "NORM_PRD",
    "REMARKS",
  ],
});

grdMainProps.columns = grdMainProps.fields;

onMounted(() => {
  initCodeList();
  grdMain.value.getGridView().filterPanel.visible = true;
  //onButtonsClick({ id: 'btnSearch' })
});

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
  } else if (btn.id === "btnCreate") {
    cLDAB0010Popup01.value.openPopup();
  } else if (btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run();
  }
};

//삭제관련 로직 시작
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("삭제할 데이터를 선택해주세요."));

    return false;
  }
  return true;
};

const deleteData = () => {
  let deleteParam = [];
  let chkNum = grdMain.value.getGridView().getCheckedRows(true);

  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i]);
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV,
      YEAR: data.YEAR,
      REQ_CHA: data.REQ_CHA,
    };
    deleteParam.push(deleteData);
  }

  return commonExecuteApi({
    queryId: "CLDAB0010_DELETE_01",
    list: deleteParam,
  });
};

const afterDelete = () => {
  onButtonsClick({ id: "btnSearch" });
};
//삭제관련 로직 끝

const searchData = () => {
  return commonSearchApi({
    queryId: "CLDAB0010_SEARCH_01",
    param: {},
  });
};

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

//그리드 셀 더블클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow);
  cLDAB0010Popup01.value.openPopup2(data);
};
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
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
    </v-card-text>
  </v-card>
  <CLDAB0010Popup01
    @Saved="() => onButtonsClick({ id: 'btnSearch' })"
    ref="cLDAB0010Popup01"
  ></CLDAB0010Popup01>
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
