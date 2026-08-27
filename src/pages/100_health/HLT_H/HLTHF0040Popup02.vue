<script setup>
import IMenuTitle from "@/components/IGridTitle.vue";
import { ref, reactive, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from "@hiway/api/commonApi";
import RealGrid from "@/components/RealGrid.vue";
import Message from "@hiway/utils/notify";
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js";
import queryFlowHelper from "@/utils/searchFlowHelper";
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";

const grdMain = ref(null);
const dialog = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const emit = defineEmits(["Saved"]);

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
});

const codeList = reactive({
  BSNS_CD : [],
});

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    headerHeight: 60,
    rowIndicator: {
      visible: false
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
      styleName: "left-column",
      mergeRule: {
        criteria: "value",
      },
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
      header: { text: t("사업장") },
    },
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

grdMainProps.columns = grdMainProps.fields;

const closePopup = () => {
  dialog.value = false
  //초기화
  searchParam.BSNS_CD = '' 
}

const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    await Promise.all([
      await new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run(),
    ]);
  } else if (btn.id === 'btnSelect') {
    onSelect()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
};

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHF0040_SEARCH_POPUP02",
    param: searchParam,
  });
};

const afterSearch = async (res) => {
  await grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

const changeOrgnDiv = async () => {
  searchParam.JOB_ROW_CD = "";
  await initCodeList();
  await onButtonsClick({ id: "btnSearch" });
  await nextTick();
};

const initCodeList = async () => {
  const res = await Promise.all([
    commonSearchApi({
        queryId: "searchBSNS",
        param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" },
    }), // 사업부
  ]);

//-------------------조회------------------------------
  codeList.BSNS_CD = [...res[0].ORESULT_CUR];

  if (!codeList.BSNS_CD.some((item) => item.BSNS_NM === "전체")) {
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" });
  }

};

const onSelect = (clickData) => {
  if (grdMain.value.getGridView().getCurrent().dataRow === -1) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  }
  var rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  emit('selected', rtnData)
  closePopup()
}

onMounted(() => {});

const openPopup = () => {
  dialog.value = true;
  initCodeList();
  onButtonsClick({ id: "btnSearch" });
};

const onCellDblClicked = (grid, clickData) => {
   onSelect(clickData)
}


defineExpose({
  openPopup,
});
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>신규 부서 조회</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="true"
          :button-list="[
            'btnSelect', //선택
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <div class="d-flex flex-area-gap mb-1 align-left">
            <v-sheet class="searchArea d-flex flex-gap custom-flex-1">
              
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
            </v-sheet>
          </div>
          <div class="h-grow d-flex flex-area-gap">
          <v-sheet class="pa-0 h-auto custom-flex-1">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            >
            </RealGrid>
          </v-sheet>
        </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
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

.form-label {
  color: #222;
  font-size: 14px;
  font-weight: 400;
}

.radioStyle {
  padding-left: 5px;
  height: 35px;
  background-color: rgb(255, 255, 255);
  border: 1px solid;
  border-radius: 2px;
  border-color: #e0e0e0;
  font-size: x-small;
  display: flex;
  align-items: center;
}

v-sheet {
  width: 100%;
}
</style>