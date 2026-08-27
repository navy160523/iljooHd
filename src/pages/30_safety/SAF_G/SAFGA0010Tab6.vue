<!-- SAFGA0010 안전 PASSPORT Tab6(재해이력)-->
<!-- SI2팀 김성근 2024-04-03  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import img1 from "@images/pages/pose-fs-9.png"
import { useUserStore } from "@hiway/stores/user"
import PopUp from "@/pages/30_safety/SAF_A/SAFAB0020PopUp.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const grdMain = ref(null)

const props = defineProps({
  IntData: {
    type: Array,
    required: false,
    default() {
      return []
    },
  },
})

const popup = ref(null)

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: [""],
  fields: [
    {
      fieldName: "OCCUR_DT",
      header: { text: t("재해일자") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },
    {
      fieldName: "OCCUR_TIME",
      dataType: "text",
      header: { text: t("재해시간") },
    },
    {
      fieldName: "RPT_TYPE_CD",
      dataType: "text",
      header: { text: t("사고처리") },
    },
    {
      fieldName: "SAGO_DIV_S_NM",
      dataType: "text",
      header: { text: t("사고유형") },
    },
    {
      fieldName: "INJURY_PART_L",
      dataType: "text",
      header: { text: t("부위(대)") },
    },
    {
      fieldName: "INJURY_TYPE",
      dataType: "text",
      header: { text: t("상해종류") },
    },
    {
      fieldName: "JINDAN_CD",
      dataType: "text",
      header: { text: t(" 진단(주)") },
    },
    {
      fieldName: "RPT_SEND_DT",
      header: { text: t("조사표 제출일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },
    {
      fieldName: "SANJAE_APPV_DT",
      header: { text: t("산재 승인일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },
    {
      fieldName: "HUDTE",
      header: { text: t("휴직일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },
    {
      fieldName: "BOKDTE",
      header: { text: t("복직일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },
    { fieldName: "SAGO_SN", dataType: "text", header: { text: t("사고번호") } },
    { fieldName: "CMPNY_DIV", visible: false },
  ],
  columns: [],
  columnLayout: [
    {
      name: "재해일시",
      direction: "horizontal",
      items: ["OCCUR_DT", "OCCUR_TIME"],
      header: {
        text: t("재해일시"),
      },
    },
    "RPT_TYPE_CD",
    "SAGO_DIV_S_NM",
    "INJURY_PART_L",
    "INJURY_TYPE",
    "JINDAN_CD",
    "RPT_SEND_DT",
    "SANJAE_APPV_DT",
    "HUDTE",
    "BOKDTE",
    "SAGO_SN",
  ],
})

grdMainProps.columns = grdMainProps.fields

//  이벤트 시작

onMounted(() => {
  if (props.IntData[0]) {
    grdMain.value.getDataProvider().setRows(props.IntData)
  } else {
    grdMain.value.getDataProvider().setRows(null)
  }
})

// 그리드 더블클릭시
const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType !== "data") {
    return
  }
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  popup.value.openPopup(row, "passPort")
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <div class="content-area">
      <v-sheet height="100%" class="mb-3">
        <RealGrid
          ref="grdMain"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          :column-layout="grdMainProps.columnLayout"
          @onCellDblClicked="onCellDblClicked"
        />
      </v-sheet>
    </div>
    <PopUp ref="popup" />
  </v-card>
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: 26vh;
}
</style>
