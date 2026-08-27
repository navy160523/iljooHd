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

import SAFBA0010DAN_WRK_STD2 from "@/pages/30_safety/SAF_B/SAFBA0010DAN_WRK_STD2.vue"

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
  SHORT_WORK_NO: '',
  WRK_STD_NM: ''
})
const VND_NAME = ref(null)

const DanWrkPopup2 = ref(null)
const dataInt = ref({})
// 그리드

//장소 그리드 B
const grdProps = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      header: { text: t("사업자구분") },
      visible: false,
    },
    {
      fieldName: "BIZ_REG_NO",
      dataType: "text",
      header: { text: t("사업자 번호") },
      visible: false,
    },
    {
      fieldName: "WRK_STD_CD",
      dataType: "text",
      header: { text: t("작업 표준코드") },
      visible: false,
    },
    {
      fieldName: "WRK_STD_NM",
      dataType: "text",
      header: { text: t("작업 표준명") },
      styleName: "left-column",
      visible: true,
      editable: false,
    },
    {
      fieldName: "FILE_NM",
      dataType: "text",
      header: { text: t("파일 명") },
      styleName: "left-column",
      visible: true,
      editable: false,
    },
    
    
    {
      fieldName: "WRK_STD_CON",
      dataType: "text",
      header: { text: t("작업 표준 내용") },
      visible: false,
    },
    {
      fieldName: "FILE_ID",
      dataType: "text",
      header: { text: t("상세보기") },
      width: 20,
      visible: true,
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var file_name = cell.value
          if(file_name === null){
            file_name = ''
          }
          var str = 
          `<button id="cellButton"><span class="mdi mdi-magnify" style="font-size: 21px color:#666"></span></button>`
          return str;
        },
      },
    },
    
  ],
  columns: [],
})

grdProps.columns = grdProps.fields

const openPopup = (data) => {
  console.log('openData  :: ', data)

  dialog.value = true
  searchData.SHORT_WORK_NO = data.SHORT_WORK_NO
  // searchData.WRK_STD_NM = data.WRK_STD_NM
  VND_NAME.value = data.VND_NAME

  searchGrid()
}

//버튼 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    searchGrid()
  }
  if (btn.id === "btnClose") {
    dialog.value = false
  }
}

const cellDbClick = (grid, data) => {
  if (data.column === 'FILE_ID')
  {
    return
  }
  console.log('grid ', grid)
  console.log('data ', data)
  let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
  emit("selected", row)
  dialog.value = false
}

const cellItemClick = (grid, index, col) => {

  console.log('index ', index)
  
  if (col.target.classList[0] === "mdi") { 
    const dataRow = grdMain.value.getDataProvider().getJsonRow(index.itemIndex)
    console.log('dataRow ', dataRow)
    DanWrkPopup2.value.openPopup(dataRow)
  }

}

const searchGrid = () => {
  commonSearchApi({
    queryId: "OUTCA0020_SEARCH_02",
    param: searchData,
  }).then((res) => {
    console.log(res, "res", searchData, "searchData")
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
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
      <span>단기공사 작업표준 선택</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
       &nbsp; ※ 선택된 단기공사번호에 해당하는 업체의 작업표준이 들어갑니다. 
      <v-sheet class="searchArea d-flex">
        <i-input
          width="250px"
          v-model="searchData.WRK_STD_NM"
          :label="t('작업 표준명')"
        />
        <i-input
          width="250px"
          v-model="VND_NAME"
          :label="t('업체명')"
          readonly
          :disabled = "true"
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
          @onCellItemClicked="cellItemClick"
        />
      </v-card-text>
    </v-card>
  </VDialog>
  <SAFBA0010DAN_WRK_STD2 ref="DanWrkPopup2" @selected="WrkSelected3($event)" />
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
