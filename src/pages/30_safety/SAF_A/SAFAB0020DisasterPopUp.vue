<!-- si2팀김성근 기인물 공통팝업 -->
<script setup>
import { ref, reactive, onMounted, onUpdated, watch } from "vue";
import { useUserStore } from "@hiway/stores/user";
import { commonRequest } from "@hiway/api/commonApi";
import RealGridFactory from "@/utils/realgrid2";
import IGridTitle from "@/components/IGridTitle.vue";
import ILabel from "@/components/ILabel.vue";
import RealGrid from "@/components/RealGrid.vue";
import queryFlowHelper from "@/utils/searchFlowHelper";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi";
import { useI18n } from "vue-i18n";
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js";
import { VWindow, VWindowItem } from "vuetify/lib/components/index.mjs";
import Message from "@hiway/utils/notify";

const emit = defineEmits(["selectedArr"]);
const vm = getCurrentInstance().proxy; //다이얼로그관련
const UserStore = useUserStore();
const t = useI18n().t; //다국어
const dialog = ref(false);
const grdMain = ref(null);

let param = reactive({
  CMPNY_DIV: "HHI",
  SAGO_SN: "",
});

const grdProps2 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ["RSN_GRP_NM1"],
  fields: [
    {
      fieldName: "RSN_GRP_NM1",
      dataType: "text",
      header: { text: t("구분") },
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "RSN_GRP_NM2",
      dataType: "text",
      header: { text: t("구분") },
    },
    {
      fieldName: "RSN_NM",
      dataType: "text",
      header: { text: t("원인") },
    },
    {
      fieldName: "RSN_CD",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "RSN_GRP_CD1",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "RSN_GRP_CD2",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "SAGO_SN",
      dataType: "text",

      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    {
      name: "구분",
      direction: "horizontal",
      hideChildHeaders: true,
      header: {
        text: t("구분"),
      },
      items: ["RSN_GRP_NM1", "RSN_GRP_NM2"],
    },
    "RSN_NM",
  ],
});

grdProps2.columns = grdProps2.fields;

const openPopup = (popupParam) => {
  console.log(popupParam, "popupParam");
  param.SAGO_SN = popupParam.SAGO_SN;
  dialog.value = true;
  onButtonsClick({ id: "btnSearch" });
};

//초기 데이터셋팅
onUpdated(() => {});

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchDataDept)
      .setAfter(afterSearchDept)
      .run();
  }
  if (btn.id === "btnCreate") {
    let checkedRow = grdMain.value.getGridView().getCheckedRows();
    console.log(checkedRow, "checkedRow");
    if (checkedRow.length == 0) {
      return Message.warn(t("선택된 데이터가 없습니다."));
    }
    let param = [];

    checkedRow.forEach((item) => {
      let data = grdMain.value.getDataProvider().getJsonRow(item);

      param.push(data);
    });
    emit("selectedArr", param);
    dialog.value = false;
  } else if (btn.id === "btnClose") {
    dialog.value = false;
  }
};

// 조회로직
const searchDataDept = () => {
  return commonSearchApi({ queryId: "SAFAB0020_search06", param: param });
};

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const afterSearchDept = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

defineExpose({
  openPopup,
});
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    persistent
    width="800"
    height="700"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">재해원인 검색</div>
    <VContainer style="background-color: white">
      <VRow>
        <VCol>
          <IGridTitle
            :use-permission="false"
            :button-list="['btnCreate', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>

      <VRow>
        <RealGrid
          ref="grdMain"
          class="mt-2"
          style="height: 640px"
          :grid-view-option="grdProps2.gridViewOption"
          :keys="grdProps2.keys"
          :fields="grdProps2.fields"
          :columns="grdProps2.columns"
          :column-layout="grdProps2.columnLayout"
        />
      </VRow>
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
