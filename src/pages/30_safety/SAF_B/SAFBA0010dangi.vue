<!-- SI2팀 김성근  위험작업 허가서 현황 / 단기공사 조회 팝업    -->
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
const searchData = reactive({
  WORK_DT: dayjs().format("YYYY-MM-DD"),
  WORK_DESC: ''
})
const dataInt = ref({})
// 그리드

//장소 그리드 B
const grdProps = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "SHORT_WORK_NO",
      dataType: "text",
      header: { text: t("공사번호") },
      width: 140
    },
    {
      fieldName: "VND_NAME",
      dataType: "text",
      header: { text: t("협력사명") },
    },
    {
      fieldName: "WORK_DESC",
      dataType: "text",
      header: { text: t("공사명") },
      styleName: 'left-column',
      width: 170
    },
    {
      fieldName: "WORK_DATE",
      dataType: "text",
      header: { text: t("공사기간") },
      width: 150
      // displayCallback: function (grid, index, value) {
      //   return value ? dayjs(value).format("YYYY-MM-DD") : null
      // }, 
    },
    {
      fieldName: "WORKER_CNT",
      dataType: "text",
      header: { text: t("출입 인원") },
      width: 50
    },
    {
      fieldName: "REQ_PIC_EMPNM",
      dataType: "text",
      header: { text: t("의뢰부서담당자") },
    },
    {
      fieldName: "DEPT_PIC_EMPNM",
      dataType: "text",
      header: { text: t("공사담당부서담당자") },
    },
    {
      fieldName: "STATUS_NM",
      dataType: "text",
      header: { text: t("진행상태") },
    },
    { fieldName: "STATUS", visible: false },
    { fieldName: "DEPT_CD", visible: false },
    { fieldName: "BSNS_CD", visible: false },
    { fieldName: "ASGN_CD", visible: false },
    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "WORK_AREA_LCD", visible: false },
    { fieldName: "WORK_AREA_MCD", visible: false },
    { fieldName: "WORK_AREA_SCD", visible: false },
    { fieldName: "WORK_DIV", visible: false },
    { fieldName: "HARM_DPOINT", visible: false },
    { fieldName: "WORK_AREA_DESC", visible: false },
    { fieldName: "USE_EQUIP", visible: false },
    { fieldName: "WORK_PIC_EMPNM", visible: false },
    { fieldName: "DEPT_PIC_EMPNO", visible: false },
    { fieldName: "JOB_PLC", visible: false },
    { fieldName: "DTL_WORK_DESC", visible: false },
    { fieldName: "HULL_NO", visible: false },
    { fieldName: "ENTRANCE", visible: false },
  ],
  columns: [],
})

grdProps.columns = grdProps.fields

const openPopup = (data) => {
  dataInt.value = data
  searchData.DEPT_CD = data
  dialog.value = true

  onButtonsClick({id: 'btnSearch'})
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    const setParam = {
      DEPT_CD: searchData.DEPT_CD,
      WORK_DT: searchData.WORK_DT.replace(/-/g, ''),
      WORK_DESC: searchData.WORK_DESC,
    }
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_17",
      param: setParam,
    }).then((res) => {
      console.log(res, "res", searchData, "searchData")
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
  if (btn.id === "btnClose") {
    dialog.value = false
  }
}

const cellDbClick = (grid, data) => {
  console.log('data ', data)
  let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
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
    width="1200"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>단기공사 선택</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-sheet class="searchArea d-flex">
        <i-input
          :label="$t('작업일')"
          v-model="searchData.WORK_DT"
          type="Date"
          width="195px"
          margin="10px"
          required
        />
        <i-input
          width="250px"
          v-model="searchData.WORK_DESC"
          :label="t('작업명')"
        />
      </v-sheet>

      <v-card-text class="pa-3">
        <!-- TYPE B  -->
        <RealGrid
          class="mt-1"
          ref="grdMain"
          style="height: 400px"
          :grid-view-option="grdProps.gridViewOption"
          :keys="grdProps.keys"
          :fields="grdProps.fields"
          :columns="grdProps.columns"
          @onCellDblClicked="cellDbClick"
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
</style>
