<!-- SI2팀 김성근  안전사고보고서 현황 등록 / 작업표준서 선택팝업 -->
<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { update, value } from "lodash-es"

import Message from "@hiway/utils/notify"
import SendMailPopup from "@/components/popup/SendMailPopup.vue"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { useUserStore } from "@hiway/stores/user"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import EmpPopup from "@/components/popup/EmpPopup.vue"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const dialog = ref(false)
const grdMain = ref(null)
const grdDetail = ref(null)
const emit = defineEmits(["selected"])
const empPopup = ref(null)
const noBsnsCd = ref(true)
const Apply = ref(false)
const MailPopup = ref(null)

let rowData = reactive({})
//  인원검색
const codeList = reactive({
  company: [],
  bsnsCd: [],
  deptCd: [],
  USER_DIV: [
    { COD: "A", TXT: "직영", DISABLE: false },
    { COD: "B", TXT: "사내협력사", DISABLE: false },
  ],
  accdntType: [],
  proc: [],
})

let options = reactive({
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    DEPT_CD: "",
    ASGN_CD: "",
  },
  multi: false,
})

const detailData = reactive({
  CMPNY_DIV: "HHI",
  DEPT_CD: "C740",
  WS_IDS: "",
})

//  인원검색

//  진행상태 검색
const PopDataProp = reactive({
  STATE: "10",
})

const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), // 사업부

    getCodeList("HHIS060"),
    getCodeList("HHIS070"),
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.STATE = res[2].ORESULT_CUR
    codeList.EXCEPT_REASON = res[3].ORESULT_CUR
  })
}

const openPopup = (popupParam) => {
  //   초기화

  if (popupParam) {
    options.values.WS_NM = popupParam
  }
  Apply.value = false
  initCodeList()
  dialog.value = true
}

//  사업부 바뀌면
watch(
  () => options.values.BSNS_CD,
  (newValue) => {
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: options.values.CMPNY_DIV, BSNS_CD: newValue },
    }).then((res) => {
      if (newValue == "") {
        return (noBsnsCd.value = true)
      }
      options.values.DEPT_CD = ""
      codeList.deptCd = res.ORESULT_CUR
      noBsnsCd.value = false
    })
  }
)

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run()
  }
  // } else if (btn.id === "btnSelect") {
  //   // let row = grdDetail.value.getDataProvider().getJsonRows();
  //   emit("selected", row);
  //   onButtonsClick({ id: "btnClose" });
  // } else if (btn.id === "btnDelete") {
  // } else
  if (btn.id == "btnClose") {
    dialog.value = false
  }
}

// const rowChanged = (grid, oldRow, newRow) => {
//   if (newRow === -1) {
//     return;
//   }
//   rowData = grdMain.value.getDataProvider().getJsonRow(newRow);
// };

//  조회
const searchData01 = (idx) => {
  if (options.values.BSNS_CD == "") {
    return Message.warn(t("사업부는 필수 입력입니다."))
  } else if (options.values.DEPT_CD == "") {
    return Message.warn(t("부서는 필수 입력입니다."))
  }
  if (options.values.WS_NM) {
  }
  return commonSearchApi({
    queryId: "SAFAB0020_search04",
    param: options.values,
  })
}

const afterSearch01 = (res) => {
  console.log(res, "resMains")
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 단건저장건으로 삭제처리

// const searchDetail = (popupParam) => {
//   let param = {
//     CMPNY_DIV: "HHI",
//     DEPT_CD: "",
//     WS_IDS: popupParam,
//   };
//   commonSearchApi({
//     queryId: "SAFAB0020_search05",
//     param: param,
//   }).then((res) => {
//     console.log(res, "res");
//     grdDetail.value.getDataProvider().setRows(res.ORESULT_CUR);
//   });
// };

// 저장

//  삭제

//메인
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: false },
  },

  keys: ["WS_NM"],
  field: [
    {
      fieldName: "DEPT_NM",
      dataType: "text",

      header: { text: t("소속") },
    },
    {
      fieldName: "S_DIV_NM",
      dataType: "text",

      styleName: "left-column",
      header: { text: t("구분") },
    },
    {
      fieldName: "WS_NM",
      dataType: "text",

      header: { text: t("작업표준") },
    },
    {
      fieldName: "WS_ID",
      dataType: "text",

      header: { text: t("작업표준번호") },
    },

    // 출력 안함

    { fieldName: "T_DIV_NM", dataType: "text", visible: false },
    { fieldName: "M_DIV_NM", dataType: "text", visible: false },
    //{ fieldName: "WS_ID", dataType: "text", visible: false },
    { fieldName: "COMP_CODE", dataType: "text", visible: false },
    { fieldName: "DEPT_CODE", dataType: "text", visible: false },
    { fieldName: "TDIV_CODE", dataType: "text", visible: false },
    { fieldName: "MDIV_CODE", dataType: "text", visible: false },
    { fieldName: "SDIV_CODE", dataType: "text", visible: false },
    { fieldName: "WS_NO", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const onCellDblClicked = (grd, data) => {
  console.log(data)
  if (data.cellType === "data") {
    let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    emit("selected", innerData)
    onButtonsClick({ id: "btnClose" })
  }
}

// 서브
// const grdDetailProps = reactive({
//   gridViewOption: {
//     stateBar: { visible: false },
//     checkBar: { visible: true },
//   },
//   keys: ["CMPNY_DIV"],
//   field: [
//     {
//       fieldName: "WS_NM",
//       dataType: "text",
//       styleName: "left-column",
//       header: { text: t("작업표준") },
//       editable: false,
//     },

//     { fieldName: "WS_ID", dataType: "text", visible: false },
//   ],
//   columns: [],
// });

// grdDetailProps.columns = grdDetailProps.field;

// 단건 저장건으로 주석처리

// const AddData = () => {
//   let param = {};
//   let checkedRows = grdMain.value.getGridView().getCheckedRows(true);
//   let arr = grdDetail.value.getDataProvider().getJsonRows();
//   if (checkedRows.length == 0) {
//     return Message.warn(t("선택된 행이없습니다."));
//   }
//   for (let i of checkedRows) {
//     param = grdMain.value.getDataProvider().getJsonRow(i);
//     let checkItem = arr.some((row) => row.EXCEPT_EMP === param.EMP_NO);

//     if (!checkItem) {
//       grdDetail.value.addRow({
//         EXCEPT_BSNS_CD: param.BSNS_CD,
//         CMPNY_DIV: param.CMPNY_DIV,
//         WS_NM: param.WS_NM,
//         WS_ID: param.WS_ID,
//       });
//     }
//   }
// };

// const RemoveData = () => {
//   let checkedRows = grdDetail.value.getGridView().getCheckedRows(true);
//   if (checkedRows.length == 0) {
//     return Message.warn(t("선택된 행이없습니다."));
//   }
//   grdDetail.value.getDataProvider().removeRows(checkedRows);
// };

// 팝업존
const empPopupOpen = () => {
  empPopup.value.openPopup(PopDataProp)
}

// const selected = (row) => {
//   console.log(row, "row");
//   if (row) {
//     PopDataProp.EMPLO = row.EMP_NO;
//     PopDataProp.EMP_NM = row.EMP_NM;
//     detailData.APPR_USER_DIV = row.USER_DIV;
//     detailData.HND_PHN = row.HND_PHN;
//   }
// };

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="960"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">작업 표준서</div>

    <VContainer style="background-color: white">
      <IMenuTitle
        :button-list="['btnSearch', 'btnClose']"
        @click-button="onButtonsClick"
      />

      <v-row>
        <v-col class="d-flex" cols="12">
          <!-- 인원검색 -->
          <v-col cols="12">
            <VRow>
              <VCol>
                <VForm ref="searchArea" class="searchArea">
                  <div class="d-flex">
                    <i-select
                      :label="$t('사업부')"
                      label-width="50px"
                      width="250px"
                      margin="10px"
                      v-model="options.values.BSNS_CD"
                      :items="codeList.bsnsCd"
                      item-value="BSNS_CD"
                      item-title="BSNS_NM"
                      required
                    />
                    <i-select
                      :label="$t('부서')"
                      label-width="50px"
                      width="250px"
                      margin="10px"
                      :disabled="noBsnsCd"
                      v-model="options.values.DEPT_CD"
                      :items="codeList.deptCd"
                      item-value="DEPT_CD"
                      item-title="DEPT_NM"
                      required
                    />

                    <i-input
                      :label="$t('작업표준서')"
                      label-width="100px"
                      width="350px"
                      margin="10px"
                      v-model="options.values.WS_NM"
                    />
                  </div>
                </VForm>
              </VCol>
            </VRow>
            <!-- /조회조건 -->

            <!-- 메인그리드 -->
            <VRow>
              <VCol>
                <RealGrid
                  ref="grdMain"
                  class="mt-2"
                  style="height: 500px"
                  :gridViewOption="grdMainProps.gridViewOption"
                  :fields="grdMainProps.field"
                  :columns="grdMainProps.columns"
                  @onCellDblClicked="onCellDblClicked"
                />
              </VCol>
            </VRow>
          </v-col>

          <!-- 단건 저장건으로 주석처리-->

          <!--  등록 / 삭제 -->
          <!-- <v-col cols="1" align-self="center" class="mx-2">
            <v-btn
              @click="AddData"
              append-icon="mdi-chevron-right"
              class="mb-6"
              width="120"
            >
              등록
            </v-btn>

            <v-btn
              @click="RemoveData"
              append-icon="mdi-chevron-left"
              width="120"
            >
              삭제
            </v-btn>
          </v-col> -->
          <!-- 등록/삭제 종료 -->

          <!-- <v-col cols="5">
            <VRow>
              <VCol>
                <RealGrid
                  ref="grdDetail"
                  class="mt-2"
                  style="height: 500px"
                  :gridViewOption="grdDetailProps.gridViewOption"
                  :fields="grdDetailProps.field"
                  :columns="grdDetailProps.columns"
                />
              </VCol>
            </VRow>
          </v-col> -->
        </v-col>
      </v-row>

      <!-- <EmpPopup ref="empPopup" @selected="selected" /> -->
      <SendMailPopup ref="MailPopup" />
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
