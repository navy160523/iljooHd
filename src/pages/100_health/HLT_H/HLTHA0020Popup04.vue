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
import Message from "@hiway/utils/notify";
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js";
import dayjs from "dayjs";
import queryFlowHelper from "@/utils/searchFlowHelper";
import RealGrid from "@/components/RealGrid.vue";
import IGridTitle from "@/components/IGridTitle.vue";
import { useUserStore } from "@hiway/stores/user";
import { commonDownloadFilesApi } from "@hiway/api/commonFileApi";

const dialog = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const grdMain = ref(null);

const codeList = reactive({
  REQ_DIV: [
    { COD: "A", TXT: "정기" },
    { COD: "B", TXT: "수시" },
  ],
  REQ_CHA:[],
  GRID_STATUS: [
    { COD: "%", TXT: "전체" },
    { COD: " ", TXT: "미신청" },
    { COD: "3", TXT: "신청완료" },
    { COD: "4", TXT: "확정완료" },
    { COD: "5", TXT: "반려" },
    { COD: "9", TXT: "지급완료" },
  ],
  SHOES_KIND: [],
});

const searchParam = reactive({
  CMPNY_DIV: "",
  YEAR: "",
  REQ_DIV: "",
  REQ_CHA: "",
  REQ_DT: "",
  BSNS_CD: "",
  DEPT_CD: "",
  ASGN_CD: "",
  OUT_YN: "",
  USER_DIV: "",
});

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
  },
  fields: [
    {
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      width: "200",
      editable: false,
      header: { text: t("소속") },
      styleName: "left-column",
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "80",
      editable: false,
      header: { text: t("사번") },
      styleName: "center-column",
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("이름") },
      styleName: "center-column",
    },
    {
      fieldName: "JOB_TIT_NM",
      dataType: "text",
      width: "100",
      editable: false,
      styleName: "center-column",
      header: {
        text: t("직위"),
      },
    },
    {
      fieldName: "UNT_DUTY_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직무") },
      styleName: "left-column",
    },
    {
      fieldName: "SHOES_VEND",
      dataType: "text",
      width: "200",
      header: {
        text: t("안전화 종류"),
        //styleName: "custom-header"
      },
      lookupDisplay: true,
      styleName: "left-column",
    },
    {
      fieldName: "STATUS",
      dataType: "text",
      width: "70",
      editable: false,
      lookupDisplay: true,
      header: { text: t("신청상태") },
      styleName: "center-column",
    },
    {
      fieldName: "SHOES_SIZE",
      dataType: "text",
      width: "60",
      header: {
        text: t("사이즈"),
      },
      lookupDisplay: true,
      styleName: "center-column",
    },
    {
      fieldName: "SHOES_COUNT",
      dataType: "text",
      width: "60",
      editable: false,
      header: {
        text: t("신청수량"),
      },
      styleName: "center-column",
    },
    {
      fieldName: "COUPON_YN",
      width: "60",
      header: {
        text: t("쿠폰여부"),
      },
      styleName: "center-column",
    },
    {
      fieldName: "INSORE_YN",
      width: "60",
      header: {
        text: t("보온 깔창여부"),
      },
      styleName: "center-column",
    },
    {
      fieldName: "RECEIVE_YN",
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("지급여부") },
      styleName: "center-column",
    },
    {
      fieldName: "BE_RECEIVE_DT",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("지급일자") },
      styleName: "center-column",
    },
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("비고") },
      styleName: "left-column",
    },
  ],
  columns: [],
});

grdMainProps.columns = grdMainProps.fields;

const initCodeList = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHA0020_SEARCH_SHOES",
      param: {
        CMPNY_DIV: searchParam.CMPNY_DIV,
      },
    }), // 안전화
    getCodeList("HHII809"), // 805에서 운영과 코스 충돌로 809로 변경
  ]);
  
  codeList.SHOES_KIND = [...res[0].ORESULT_CUR];
  codeList.REQ_CHA = [...res[1].ORESULT_CUR];

  grdMain.value.setBindingColumn("STATUS", codeList.GRID_STATUS, "COD", "TXT");
  grdMain.value.setBindingColumn(
    "SHOES_VEND",
    codeList.SHOES_KIND,
    "COD",
    "TXT"
  );
};

const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run();
  } else if (btn.id === "btnClose") {
    closePopup();
  }
};

const searchData = () => {
  return commonSearchApi({
    queryId: "HLTHA0020_SEARCH_06",
    param: searchParam,
  });
};

const afterSearch = (res) => {

  const gridView = grdMain.value.getGridView();

  gridView.setAllCheck(false);
  gridView.checkAll(false);

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

const openPopup = async (data) => {
  searchParam.CMPNY_DIV = data.CMPNY_DIV;
  searchParam.YEAR = data.YEAR;
  searchParam.REQ_DIV = data.REQ_DIV;
  searchParam.REQ_CHA = data.REQ_CHA;
  searchParam.REQ_DT = data.REQ_DT;
  searchParam.BSNS_CD = data.BSNS_CD;
  searchParam.DEPT_CD = data.DEPT_CD;
  searchParam.ASGN_CD = data.ASGN_CD;
  searchParam.OUT_YN = data.USER_DIV === 'A' ? 'N' : 'Y';
  searchParam.ASGN_FULL_NM = data.ASGN_FULL_NM
  searchParam.USER_DIV = data.USER_DIV

  await initCodeList();

  await onButtonsClick({ id: "btnSearch" });

  dialog.value = true;
};

const closePopup = () => {
  dialog.value = false;
  //초기화
  //   readOnlyValue.BSNS_CD = false; //년도 readonly 해제
  //   for (let i in itemField) {
  //     itemField[i] = "";
  //   }
};

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
      <span>안전화 신청 상세내역</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
          :use-permission="true"
        />
      </v-card-title>

      <v-card-text class="pa-2 pt-0">
        <div class="d-flex flex-column mt-2" :style="{ height: '500px' }">
          <v-sheet class="d-flex flex-column searchArea">
            <div class="d-flex flex-gap mb-2">
              <i-input
                :label="$t('해당년도')"
                class="custom-flex-1"
                labelWidth="60px"
                v-model="searchParam.YEAR"
                :disabled="true"
              />
              <div class="custom-flex-none d-flex">
                <i-label class="flex-grow-1 d-flex">
                  <span
                    class="form-label pr-2 pt-2"
                    :style="{
                      display: 'block',
                      width: '60px',
                      margin: '0 8px 0 0',
                    }"
                  >
                    {{ $t("구분 ") }}
                  </span>
                  <v-radio-group
                    v-model="searchParam.REQ_DIV"
                    inline
                    class="radioStyle"
                    :disabled="true"
                  >
                    <v-radio
                      v-for="item in codeList.REQ_DIV"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </v-radio-group>
                </i-label>
              </div>
              <i-input v-if="searchParam.REQ_DIV != 'A'"
                :label="$t('신청일자')"
                class="custom-flex-1"
                labelWidth="60px"
                v-model="searchParam.REQ_DT"
                :disabled="true"
              />
              <i-select
                v-else-if="searchParam.REQ_DIV === 'A'"
                :label="$t('신청시기')"
                :items="codeList.REQ_CHA"
                item-title="TXT"
                item-value="COD"
                labelWidth="60px"
                class="custom-flex-1"
                v-model="searchParam.REQ_CHA"
                :disabled="true" 
              />
              <span class="custom-flex-1" />
            </div>
            <div class="d-flex flex-gap">
              <i-input
                :label="$t('소속')"
                class="custom-flex-2"
                labelWidth="60px"
                v-model="searchParam.ASGN_FULL_NM"
                :disabled="true"
              />
              <span class="custom-flex-2" />
            </div>
          </v-sheet>
          <v-sheet class="h-auto pa-2 pt-0 custom-flex-2">
            <RealGrid
              ref="grdMain"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.form-row {
  display: flex;
  flex-wrap: wrap; /* 요소가 넘치면 자동으로 줄 바꿈 */
  gap: 10px; /* 요소 간격 */
}

.image-container {
  display: flex;
  max-width: 100%;
  height: 300px;
  align-items: stretch;
  gap: 10px;
}

.image-item {
  flex: 1;
  width: 0;
  flex-basis: 0;
  height: 100%;
}
/* overflow: hidden; */

.image-item span {
  display: block;
  text-align: center;
  line-height: 300px;
}

.viewer-img {
  width: 100%;
  height: 100%;
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
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-none {
  /* width: calc(25% - 0px) !important; */
  flex: 2 0 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 40px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.flex-gap {
  gap: 20px;
  flex-wrap: wrap;
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
</style>