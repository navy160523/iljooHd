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

// 결재 상신 파라미터

// 조직도 부서 조회 파라미터
let acdtParms = reactive({
  CMPNY_DIV: "HHI",
  ALL_UP_CD: "HHIZ010",
  USE_FLAG: "Y",
});

// 그리드 적용 파라미터(2024.05.30 이희원 추가)
const grdParams = reactive({
  dataRow: '',
  fieldIndex: ''
})

// 조직도 부서 그리드
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: ["TXT"],
  field: [
    { fieldName: "ALL_SYS_CD", dataType: "text", visible: false },
    { fieldName: "ALL_UP_CD", dataType: "text", visible: false },
    { fieldName: "COD", dataType: "text", visible: false },
    { fieldName: "UP_COD", dataType: "text", visible: false },
    { fieldName: "TXT", dataType: "text", header: { text: t("장소구분") } },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.field;

const openPopup = (popupParam) => {
  // 그리드에 데이터 적용 시 필요 (2024.05.30 이희원 추가)
  for (let i in popupParam) {
    grdParams[i] = popupParam[i]
  }

  dialog.value = true
  onButtonsClick({ id: "btnSearch" });
};

const onCellDblClicked = async (grd, data) => {
  let pushArr = [];

  let rowData = await grdMain.value.getDataProvider().getJsonRow(data.dataRow)
  let length = await rowData.ALL_SYS_CD.length
  if(length < 10){
    /* 노드 펼침 여부에 따라 동작(true = 열림, false = 닫힘) */
    if(grdMain.value.getGridView().getModelOfRow(data.dataRow).expanded){
      /* 노드가 펼쳐져 있어 닫아줌 */
      grdMain.value.getGridView().collapse(data.itemIndex, false)
    }else {
      /* 노드를 펼쳐줌 */
      grdMain.value.getGridView().expand(data.itemIndex, false)
    }
  }

  if (data.cellType === "data") {
    let index = grdMain.value.getGridView().getCurrent().itemIndex;
    let parent = grdMain.value.getGridView().getAncestors(index, true);
    parent.dataRow = grdParams.dataRow
    parent.sort();

    for (let i of parent) {
      let enterObj = grdMain.value.getGridView().getValues(i);

      if (enterObj) {
        pushArr.push(enterObj);
      }
    }
    let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow);

    innerData.dataRow = grdParams.dataRow

    pushArr.push(innerData)
    if(pushArr.length >= 2){
    if (pushArr.length == 3 || pushArr[1].UP_COD === 'J') {
      emit("selectedArr", pushArr)
      dialog.value = false
    } else return Message.warn("자세한 분류까지 선택해 주십시오");
  }
  }
};

//초기 데이터셋팅
onUpdated(() => {})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchDataDept)
      .setAfter(afterSearchDept)
      .run()
  } else if (btn.id === "btnSelect") {
    let index = grdMain.value.getGridView().getCurrent().itemIndex
    let parent = grdMain.value.getGridView().getAncestors(index, true)
    parent.sort()

    for (let i of parent) {
      let enterObj = grdMain.value.getGridView().getValues(i)

      if (enterObj) {
        pushArr.push(enterObj)
      }
    }
    let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)

    pushArr.push(innerData)

    if (pushArr.length == 3) {
      emit("selectedArr", pushArr)
      dialog.value = false
    } else return Message.warn("자세한 분류까지 선택해 주십시오")
  } else if (btn.id === "btnClose") {
    dialog.value = false
  }
}

// 조회로직
const searchDataDept = () => {
  return commonSearchApi({ queryId: "searchCommonCodeF", param: acdtParms });
}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const afterSearchDept = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, "ALL_SYS_CD")
}

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    persistent
    width="500"
    height="700"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">장소 검색</div>
    <VContainer style="background-color: white">
      <VRow>
        <VCol>
          <IGridTitle
            :use-permission="false"
            :button-list="['btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>

      <VRow>
        <RealGrid
          ref="grdMain"
          class="mt-2"
          style="height: 640px"
          :is-tree="true"
          :gridViewOption="grdMainProps.gridViewOption"
          :fields="grdMainProps.field"
          :columns="grdMainProps.columns"
          @onCellDblClicked="onCellDblClicked"
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
