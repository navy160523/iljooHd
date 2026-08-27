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
    EMPNO: "",
    OCCUR_DT: "",
  },
  multi: false,
})

//  인원검색

//  진행상태 검색
const PopDataProp = reactive({
  STATE: "10",
})

// const initCodeList = () => {
//   Promise.all([
//     getCompanyList(), // 회사구분
//     commonSearchApi({
//       queryId: "searchBSNS",
//       param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
//     }), // 사업부

//     getCodeList("HHIS060"),
//     getCodeList("HHIS070"),
//   ]).then((res) => {
//     codeList.company = res[0].ORESULT_CUR
//     codeList.bsnsCd = res[1].ORESULT_CUR
//     codeList.STATE = res[2].ORESULT_CUR
//     codeList.EXCEPT_REASON = res[3].ORESULT_CUR
//   })
// }

const openPopup = (popupParam) => {
  //   초기화

  if (popupParam) {
    options.values.EMPNO = popupParam
  }
  Apply.value = false
  // initCodeList()
  dialog.value = true
}

//  사업부 바뀌면

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
  if (options.values.OCCUR_DT == "") {
    return Message.warn(t("발생일자는 필수 입력입니다."))
  }
  return commonSearchApi({
    queryId: "SAFAB0020_search11",
    param: options.values,
  })
}

const afterSearch01 = (res) => {
  console.log(res, "resMains")
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

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
      fieldName: "RESP_EMP_NO",
      dataType: "text",

      header: { text: t("사번") },
    },
    {
      fieldName: "RESP_EMP_NM",
      dataType: "text",

      styleName: "left-column",
      header: { text: t("성명") },
    },
    {
      fieldName: "WORK_TITLE",
      dataType: "text",

      header: { text: t("작업지시서") },
    },
    {
      fieldName: "WORK_MSG",
      dataType: "text",

      header: { text: t("작업지시서 비고") },
    },
    {
      fieldName: "SAGO_LOC_DTL",
      dataType: "text",

      header: { text: t("사고장소") },
    },

    // 출력 안함

    { fieldName: "WORK_ID", dataType: "text", visible: false },
    { fieldName: "WORK_DATE", dataType: "text", visible: false },
    { fieldName: "OCCUR_DT", dataType: "text", visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "SAGO_SN", dataType: "text", visible: false },
    { fieldName: "PRNT_SAGO_SN", dataType: "text", visible: false },
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
    <div class="title-bar" @mousedown="startDragging">작업지시서</div>

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
                    <i-input
                      :label="$t('발생일자')"
                      v-model="options.values.OCCUR_DT"
                      type="Date"
                      width="240px"
                      margin="10px"
                      required
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
