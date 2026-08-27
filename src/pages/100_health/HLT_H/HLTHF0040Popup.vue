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
  ORGN_DIV: "A",
  JOB_ROW_CD: "",
});

const codeList = reactive({
  ORGN_DIV: [
    { COD: "A", TXT: "직영" },
    { COD: "B", TXT: "사내협력사" },
  ],
  JOB_ROW_CD: [],
});

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    headerHeight: 60,
    // rowIndicator: {
    //   visible: false
    // },
  },
  fields: [
    {
      fieldName: "JOB_ROW_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직군") },
      styleName: "left-column",
      mergeRule: {
        criteria: "value",
      },
    },
    {
      fieldName: "STD_DUTY_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직렬") },
      styleName: "left-column",
      mergeRule: {
        criteria: "value",
      },
    },
    {
      fieldName: "UNT_DUTY_NM",
      dataType: "text",
      width: "150",
      editable: false,
      header: { text: t("단위직무") },
      styleName: "left-column",
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
      header: { text: t("사업장") },
    },
    {
      fieldName: "JOB_ROW_CD",
      visible: false,
      header: { text: t("직군코드") },
    },
    {
      fieldName: "STD_DUTY_CD",
      visible: false,
      header: { text: t("직렬코드") },
    },
    {
      fieldName: "UNT_DUTY_CD",
      visible: false,
      header: { text: t("단위업무코드") },
    },
    {
      fieldName: "USER_DIV",
      visible: false,
      header: { text: t("직영구분") },
    },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

const closePopup = () => {
  dialog.value = false
  //초기화
  searchParam.ORGN_DIV = 'A' 
  searchParam.JOB_ROW_CD = ''
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
    queryId: "HLTHF0040_SEARCH_POPUP",
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
      queryId: "HLTHF0040_OCCUPATION_COMBO",
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
        ORGN_DIV: searchParam.ORGN_DIV,
      },
    }), // 직군
  ]);

//-------------------조회------------------------------
  codeList.JOB_ROW_CD = [...res[0].ORESULT_CUR];

  if (!codeList.JOB_ROW_CD.some((item) => item.TXT === "전체")) {
    codeList.JOB_ROW_CD.unshift({ TXT: "전체", COD: "" });
  }

  grdMain.value.setBindingColumn('JOB_ROW_CD', codeList.JOB_ROW_CD, 'COD', 'TXT')
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
      <span>신규 직무 조회</span>
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
              <div class="custom-flex-1 d-flex">
                <i-label class="flex-grow-1 d-flex">
                  <span
                    class="form-label pr-2 pt-2"
                    :style="{
                      display: 'block',
                      width: '50px',
                      margin: '0 8px 0 0',
                    }"
                  >
                    {{ $t("구분 ") }}
                  </span>
                  <v-radio-group
                    v-model="searchParam.ORGN_DIV"
                    inline
                    class="radioStyle"
                    @update:modelValue="changeOrgnDiv"
                  >
                    <v-radio
                      v-for="item in codeList.ORGN_DIV"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </v-radio-group>
                </i-label>
              </div>
              <i-select
                :label="$t('직군')"
                :items="codeList.JOB_ROW_CD"
                item-title="TXT"
                item-value="COD"
                labelWidth="50px"
                v-model="searchParam.JOB_ROW_CD"
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