<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  computed,
  onBeforeMount,
  nextTick,
} from "vue";
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
import queryFlowHelper from "@/utils/searchFlowHelper";
import HLTHC0020Popup from "./HLTHC0020Popup.vue";

const grdMain = ref(null);
const grdPlace = ref(null);
const grdEyesight = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const hLTHC0020Popup = ref(null);

const props = defineProps({
  year: String,
  reqDiv: String,
  reqCha: String,
});

const grdPlaceProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
  },
  fields: [
    {
      fieldName: "PLACE_NAME",
      dataType: "text",
      width: "150",
      editable: false,
      header: { text: t("검사장소") },
      styleName: "left-column",
    },
    {
      fieldName: "REQ_COUNT",
      dataType: "text",
      width: "80",
      header: { text: t("신청인원") },
      lookupDisplay: true,
      styleName: "right-column",
    },
    {
      fieldName: "SET_COUNT",
      dataType: "text",
      width: "80",
      header: { text: t("일정수립인원") },
      lookupDisplay: true,
      styleName: "right-column",
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
    },
    {
      fieldName: "YEAR",
      visible: false,
    },
    {
      fieldName: "REQ_DIV",
      visible: false,
    },
    {
      fieldName: "REQ_CHA",
      visible: false,
    },
    {
      fieldName: "PLACE_SEQ",
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [],
});

grdPlaceProps.columns = grdPlaceProps.fields;

const grdEyesightDateProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
  },
  fields: [
    {
      fieldName: "EYESIGHT_DT",
      dataType: "text",
      width: "120",
      header: { text: t("검사일자") },
      styleName: "center-column",
      editor: {
        type: "date",
        datetimeFormat: "yyyy-MM-dd",
        mask: {
          editMask: "9999-99-99",
          placeHolder: "yyyy-MM-dd",
          includedFormat: true,
        },
      },
      datetimeFormat: "yyyy-MM-dd",
    },
    {
      fieldName: "EYESIGHT_TIME",
      dataType: "text",
      width: "120",
      header: { text: t("검사시간") },
      lookupDisplay: true,
      styleName: "center-column",
      editable: true,
      editor: {
        type: "text",
        inputCharacters: "0123456789",
        maxLength: 4 // 4자리 숫자까지만 입력
      },
      displayCallback: function (grid, index, value) {
        // value가 4자리 숫자면 HH:mm으로 포맷해서 보여주기
        if (/^\d{4}$/.test(value)) {
          const hh = value.substring(0, 2);
          const mm = value.substring(2, 4);
          return `${hh}:${mm}`;
        }
        return value; // 그 외에는 그대로 보여줌
      },
      // editCommitHandler: function (grid, index, value) {
      //   // 입력값이 숫자 4자리인지 확인
      //   if (!/^\d{4}$/.test(value)) {
      //     alert("4자리 숫자만 입력 가능합니다. (예: 0930)");
      //     return false;
      //   }

      //   // HH:mm 포맷으로 변환 후 정규식 검증
      //   const hh = value.substring(0, 2);
      //   const mm = value.substring(2, 4);
      //   const formatted = `${hh}:${mm}`;

      //   const valid = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(formatted);
      //   if (!valid) {
      //     alert("유효하지 않은 시간입니다. 예: 23:59");
      //     return false;
      //   }

      //   // 원래 값 (0930) 유지하며 커밋 허용
      //   return true;
      // }
    },
    {
      fieldName: "EYESIGHT_COUNT",
      dataType: "text",
      width: "80",
      header: { text: t("가능인원") },
      lookupDisplay: true,
      styleName: "center-column",
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
    },
    {
      fieldName: "YEAR",
      visible: false,
    },
    {
      fieldName: "REQ_DIV",
      visible: false,
    },
    {
      fieldName: "REQ_CHA",
      visible: false,
    },
    {
      fieldName: "PLACE_SEQ",
      visible: false,
    },
    {
      fieldName: "EYESIGHT_SEQ",
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [],
});

grdEyesightDateProps.columns = grdEyesightDateProps.fields;

const btnEyesightPlace = async () => {
  let userData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: props.year,
    REQ_DIV: props.reqDiv,
    REQ_CHA: props.reqCha,
  };
  hLTHC0020Popup.value.openPopup(userData);
};

const btnAdd = () => {
  const placeRowCnt = grdPlace.value.getDataProvider().getRowCount();

  if (placeRowCnt <= 0) return;

  const placeIndex = grdPlace.value.getGridView().getCurrent().itemIndex;
  const placeData = grdPlace.value.getDataProvider().getJsonRow(placeIndex);

  const rowCnt = grdEyesight.value.getDataProvider().getRowCount();
  grdEyesight.value.getDataProvider().insertRow(rowCnt, {
    CMPNY_DIV: userStore.cmpnyDiv,
    YEAR: placeData.YEAR,
    REQ_DIV: placeData.REQ_DIV,
    REQ_CHA: placeData.REQ_CHA,
    PLACE_SEQ: placeData.PLACE_SEQ,
    EYESIGHT_SEQ: placeData.EYESIGHT_SEQ,
    EYESIGHT_DT: "",
    EYESIGHT_TIME: "",
    EYESIGHT_COUNT: "",
  });
};

const searchData = async () => {
  grdPlace.value.getDataProvider().clearRows();

  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0020_SEARCH_02",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        YEAR: props.year,
        REQ_DIV: props.reqDiv,
        REQ_CHA: props.reqCha,
      },
    }),
  ]);

  grdPlace.value.getDataProvider().setRows(res[0].ORESULT_CUR);

  if (res[0].ORESULT_CUR.length <= 0) {
    Message.warn(t("데이터가 없습니다."));
  } else {
    grdPlace.value.getGridView().setCurrent({ dataRow: 0 });
  }

  await nextTick();
};

const onPlaceCellClicked = async (grid, clickData) => {
  // if (clickIndex.value === clickData.itemIndex) {
  //   return;
  // }
  // const gridView = grdEyesight.value.getGridView();
  // gridView.setAllCheck(false);
  // gridView.checkAll(false);
  // await nextTick();
  //await searchDataDetail(clickData.itemIndex);
};

const setGridItem = async() =>{
  // grdEyesight.value.getGridView().onEditCommit = function(

  // )
}

defineExpose({
  searchData,
});
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-3 pt-3 content-area">
      <div class="d-flex flex-gap fill-height">
        <div class="d-flex flex-column fill-height custom-flex-1">
          <div
            class="pa-1 d-flex justify-space-between align-center w-100"
            style="flex: 1"
          >
            <v-sheet class="titleArea d-flex justify-start align-center">
              <span class="pa-1 menuTitle">시력검사장소</span>
            </v-sheet>
            <v-sheet class="d-flex justify-end">
              <v-btn @click="btnEyesightPlace">시력검사장소관리</v-btn>
            </v-sheet>
          </div>
          <v-sheet class="pb-3 d-flex justify-end" style="flex: 9">
            <RealGrid
              ref="grdPlace"
              :grid-view-option="grdPlaceProps.gridViewOption"
              :fields="grdPlaceProps.fields"
              :columns="grdPlaceProps.columns"
              :column-layout="grdPlaceProps.columnLayout"
              @onCellClicked="onPlaceCellClicked"
            />
          </v-sheet>

          <div
            class="pa-1 d-flex justify-space-between align-center w-100"
            style="flex: 1"
          >
            <v-sheet class="titleArea d-flex justify-start align-center">
              <span class="pa-1 menuTitle">시력검사일정</span>
            </v-sheet>
            <v-sheet class="d-flex justify-end">
              <v-btn @click="btnAdd">추가</v-btn>
              <v-btn @click="cancelApllication">저장</v-btn>
              <v-btn @click="cancelApllication">삭제</v-btn>
            </v-sheet>
          </div>
          <v-sheet class="d-flex justify-end" style="flex: 9">
            <RealGrid
              ref="grdEyesight"
              :grid-view-option="grdEyesightDateProps.gridViewOption"
              :fields="grdEyesightDateProps.fields"
              :columns="grdEyesightDateProps.columns"
              :column-layout="grdEyesightDateProps.columnLayout"
            />
          </v-sheet>
        </div>
        <div class="d-flex flex-column fill-height custom-flex-3">
          <div
            class="pa-1 d-flex justify-space-between align-center w-100"
            style="flex: 1"
          >
            <v-sheet class="titleArea d-flex justify-start align-center">
              <span class="pa-1 menuTitle">신청자 일정</span>
            </v-sheet>
            <v-sheet class="d-flex justify-end">
              <v-btn @click="cancelApllication">일정수립</v-btn>
              <v-btn @click="cancelApllication">일정통보출력</v-btn>
            </v-sheet>
          </div>
          <v-sheet class="d-flex justify-end" style="flex: 19">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdPlaceProps.gridViewOption"
              :fields="grdPlaceProps.fields"
              :columns="grdPlaceProps.columns"
              :column-layout="grdPlaceProps.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <HLTHC0020Popup ref="hLTHC0020Popup" />
</template>

<!--template>
  <v-card class="pa-0 fil-height">
    <v-card-text class="pa-3 pt-3 content-area">
      <div class="d-flex fill-height">
        <div class="d-flex flex-column fill-height custom-flex-1  justify-start align-center">
          <v-sheet class="align-left titleArea">
            <span class="pa-1 menuTitle"> 시력검사장소 </span>
          </v-sheet>
        </div>
        <div class="d-flex flex-column fill-height">
          <v-sheet class="align-left titleArea">
            <span class="pa-1 menuTitle"> 신청자 일정 </span>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template> -->
      <!-- <div class="d-flex flex-column fill-height"> -->


<!-- <div class="d-flex flex-area-gap align-left">
          <v-sheet class="custom-flex-1 flex-gap align-left titleArea">
            <span class="pa-1 menuTitle"> 시력검사장소 </span>
          </v-sheet>
          <v-sheet class="custom-flex-3 flex-gap align-left titleArea">
            <span class="pa-1 menuTitle"> 신청자 일정 </span>
          </v-sheet>
        </div>
        <div class="d-flex flex-area-gap mb-1 align-left ">
          <v-sheet class="searchArea d-flex flex-gap custom-flex-1">
            <i-select
              :label="$t('직군')"
              item-title="TXT"
              item-value="COD"
              labelWidth="50px"
              class="custom-flex-1"
            />
          </v-sheet>
          <v-sheet class="searchArea d-flex flex-gap custom-flex-3">
            <i-select
              :label="$t('직군')"
              item-title="TXT"
              item-value="COD"
              labelWidth="50px"
              class="custom-flex-1"
            />
          </v-sheet>
        </div> -->


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

.flex-area-gap {
  gap: 4px;
}

.flex-gap {
  gap: 15px;
  flex-wrap: wrap;
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  // align-items: center;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 3 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 20px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}
.custom-flex-3 {
  /* width: calc(25% - 0px) !important; */
  flex: 5 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 10px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  // align-items: center;
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

.menuTitle {
  text-align: left !important;
  width: 100% !important;
}

.align-left {
  justify-content: flex-start !important;
  align-items: flex-start !important;
}

.titleArea {
  padding-right: 12px;
}
</style>