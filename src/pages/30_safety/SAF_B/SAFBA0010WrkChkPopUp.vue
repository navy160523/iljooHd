<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 허가서 작성 팝업  병행작업목록 -->

<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { useUserStore } from "@hiway/stores/user"
import Message from "@hiway/utils/notify"
import { commonSearchApi } from "@hiway/api/commonApi"
import SAFBA0010PopUp1 from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1.vue"
const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const emit = defineEmits(["upData"])
const datainer = reactive([])
const grdTitle = ref(null)
const grdMain = ref(null)
const safba00101 = ref(null)
const intCode = () => {
  Promise.all([]).then((res) => {})
}
const menuTitle = ref(null)
const grdshow = ref(false) // 병행체크된 건이 있으면 true


const openPopup = async (popupParam) => {
  dialog.value = true
  console.log(popupParam, "popupParam")
  vm.$nextTick(() => {
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_15",
      param: popupParam,
    }).then((res) => {
      if (res.ORESULT_CUR.length === 0) {
        grdshow.value = false
        Message.warn(t("검색된 병행작업이 없습니다."))
      } else {
        grdshow.value = true
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      }
    })
  })
}

const onButtonsClick = (e) => {
  if (e.id === "btnClose") {
    close()
  }
}

const close = () => {
  dialog.value = false
  grdshow.value = false
}

// 그리드
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "RCV_NO",
      dataType: "text",
      width: "170",
      header: { text: t("허가번호") },
    },
    {
      fieldName: "WORK_DT",
      dataType: "text",
      width: "100",
      header: { text: t("작업일") },
    },
    {
      fieldName: "WORK_TIME",
      dataType: "text",
      width: "100",
      header: { text: t("작업시간") },
    },
    {
      fieldName: "WORK_NO",
      dataType: "text",
      width: "70",
      header: { text: t("호선No.") },
      editable: false,
    },
    {
      fieldName: "WORK_DIV",
      dataType: "text",
      width: "80",
      header: { text: t("위험작업분류") },
    },
    {
      fieldName: "WORK_DESC",
      dataType: "text",
      width: "170",
      header: { text: t("작업명") },
    },
    {
      fieldName: "WORK_DETAIL",
      dataType: "text",
      width: "100",
      header: { text: t("작업상세") },
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "200",
      header: { text: t("작업조직") },
    },
    {
      fieldName: "RESP_EMP_NM",
      dataType: "text",
      width: "80",
      header: { text: t("작업 책임자") },
    },
    {
      fieldName: "RESP_HP_NO",
      dataType: "text",
      width: "120",
      header: { text: t("작업 책임자 연락처") },
    },
    {
      fieldName: "INSERT_USER_NM",
      dataType: "text",
      width: "80",
      header: { text: t("작성자") },
    },
    {
      fieldName: "INSERT_USER_TEL",
      dataType: "text",
      width: "120",
      header: { text: t("작성자 연락처") },
    },
    {
      fieldName: "STATUS_NM",
      dataType: "text",
      width: "70",
      header: { text: t("진행상태") },
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      visible: false,
    },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

const onCellDblClicked = (grd, data) => {
  if (data.cellType === "data") {
    let innerData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    safba00101.value.openPopup(innerData)
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
    width="1500"
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
      <span>병행작업 체크</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-4 pt-0 content-area" v-show = "grdshow">
        <v-card class="mt-3">
          <v-card-text class="pa-0">
            <RealGrid
              class="mt-1"
              ref="grdMain"
              style="height: 300px"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
            />
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-card-text class="pa-4 pt-0 content-area" v-show = "!grdshow">
        <v-card class="mt-3">
          <v-card-text class="pa-0 d-flex align-center justify-center" style="font-size: large;">
            검색된 병행작업이 없습니다. (또는, 기존 병행되었던 작업이 취소 되었습니다.) 
          </v-card-text>
        </v-card>
      </v-card-text>








    </v-card>
    <SAFBA0010PopUp1 ref="safba00101" @upData="upData" />
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (615px - 12px));
  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
