<!-- SI2팀 김성근  위험작업 허가서 현황 / 작업장소선택  타입 블럭  -->
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
import { useUserStore } from "@hiway/stores/user"
import queryFlowHelper from "@/utils/searchFlowHelper"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const gunbn = ref({})
const dialog = ref(false)
const grdMain = ref(null)
const grdSub = ref(null)
const emit = defineEmits(["selected"])
const codeList = reactive({})
const gbnPop = ref(null)
const searchData = reactive({})
const dataInt = ref({})
// 그리드

//장소 그리드 B
const grdProps = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "DIV_L_NM",
      dataType: "text",
      header: { text: t("대분류") },
    },
    {
      fieldName: "DIV_M_NM",
      dataType: "text",
      header: { text: t("중분류") },
    },
    {
      fieldName: "DIV_S",
      dataType: "text",
      header: { text: t("블록") },
    },
    {
      fieldName: "DIV_PCS",
      dataType: "text",
      header: { text: t("P/C/S") },
    },
    {
      fieldName: "DIV_FMA",
      dataType: "text",
      header: { text: t("F/M/A") },
    },
    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "RCV_NO", visible: false },
    { fieldName: "SEQ_NO", visible: false },
    { fieldName: "DIV_L", visible: false },
    { fieldName: "DIV_M", visible: false },
    { fieldName: "SEALED_CD", visible: false },
  ],
  columns: [],
})

grdProps.columns = grdProps.fields

//장소 그리드 E
const grdProps2 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "DIV_L_NM",
      dataType: "text",
      header: { text: t("구조물") },
    },
    {
      fieldName: "DIV_M_NM",
      dataType: "text",
      header: { text: t("대분류") },
    },
    {
      fieldName: "DIV_S_NM",
      dataType: "text",
      header: { text: t("중분류") },
    },
    {
      fieldName: "DIV_S2_NM",
      dataType: "text",
      header: { text: t("소분류") },
    },
    {
      fieldName: "DIV_S3_NM",
      dataType: "text",
      header: { text: t("세분류") },
    },

    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "RCV_NO", visible: false },
    { fieldName: "SEQ_NO", visible: false },
    { fieldName: "DIV_L", visible: false },
    { fieldName: "DIV_M", visible: false },
    { fieldName: "DIV_S", visible: false },
    { fieldName: "DIV_S2", visible: false },
    { fieldName: "DIV_S3", visible: false },
    { fieldName: "SEALED_CD", visible: false },
  ],
  columns: [],
})

grdProps2.columns = grdProps2.fields

const openPopup = (data, popupParam, gbn) => {
  console.log(data, popupParam, gbn, "sadsa")
  dataInt.value = data
  searchData.BSNS_CD = data.JOB_BSNS_CD
  searchData.SHIP_NO = data.WORK_NO
  searchData.DIV_S = popupParam

  gbnPop.value = gbn
  dialog.value = true

  if (gbn === "1") {
    vm.$nextTick(() => {
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_10",
        param: searchData,
      }).then((res) => {
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    })
  }
  if (gbn === "2") {
    vm.$nextTick(() => {
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_12",
        param: { SHIP_NO: searchData.SHIP_NO, UP_BLK_SEQ: searchData.DIV_S },
      }).then((res) => {
        grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    })
  }
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    console.log(gbnPop.value, "gbnPop.valueasd")
    if (gbnPop.value === "1") {
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_10",
        param: searchData,
      }).then((res) => {
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }
    if (gbnPop.value === "2") {
      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_12",
        param: { SHIP_NO: searchData.SHIP_NO, UP_BLK_SEQ: searchData.DIV_S },
      }).then((res) => {
        console.log(res, "resresrsersersersersers")
        grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }
  }
  if (btn.id === "btnClose") {
    dialog.value = false
  }
}

const cellDbClick = (grid, data) => {
  let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
  emit("selected", row)
  dialog.value = false
}
const cellDbClick2 = (grid, data) => {
  let row = grdSub.value.getDataProvider().getJsonRow(data.dataRow)
  emit("selected", row)
  dialog.value = false
}
defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="800"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move mb-0"
      @mousedown="startDragging"
    >
      <span>작업위치 선택</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-sheet class="searchArea">
        <i-input v-model="searchData.DIV_S" :label="t('블록')" />
      </v-sheet>
      <v-card-title>
        <IGridTitle
          ref="grdTitle"
          :title="$t('')"
          @click-button="onButtonsClick"
        >
          <template #editors />
        </IGridTitle>
      </v-card-title>
      <v-card-text class="pa-0">
        <!-- TYPE B  -->
        <RealGrid
          v-if="gbnPop === '1'"
          class="mt-1"
          ref="grdMain"
          style="height: 400px"
          :grid-view-option="grdProps.gridViewOption"
          :keys="grdProps.keys"
          :fields="grdProps.fields"
          :columns="grdProps.columns"
          @onCellDblClicked="cellDbClick"
        />
        <RealGrid
          v-if="gbnPop === '2'"
          class="mt-1"
          ref="grdSub"
          style="height: 400px"
          :grid-view-option="grdProps2.gridViewOption"
          :keys="grdProps2.keys"
          :fields="grdProps2.fields"
          :columns="grdProps2.columns"
          @onCellDblClicked="cellDbClick2"
        />
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}

div {
  margin-bottom: 8px;
}
</style>
