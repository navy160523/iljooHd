<!--  디지털혁신기획부 한민규   -->
<!--  프로그램명 : 기존 허가서 목록  팝업 -->


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
import { commonSearchApi ,   commonSearchTransaction, commonExecuteApi} from "@hiway/api/commonApi"


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const emit = defineEmits(["upData"])
const props = defineProps({
  datainer: Object,
  codeList: Object  // 메인에서 만든 codeList를 바로 받음
})

const grdMain = ref(null)
const menuTitle = ref(null)
const rcvparam = ref({
  CMPNY_DIV: props.datainer.CMPNY_DIV,
  BSNS_CD: props.datainer.BSNS_CD,
  DEPT_CD: props.datainer.DEPT_CD,
  WORK_FROM: dayjs().subtract(7, "day").format("YYYY-MM-DD"),
  WORK_TO: dayjs().format("YYYY-MM-DD"),
  USER_ID:  props.datainer.USER_ID,
  SHORT_YN : "N", // 단기공사여부

})


const grdMainProps = reactive({
    gridViewOption: {
      edit: { editable: false },
      stateBar: { visible: false },
    },

  fields: [
    {
      fieldName: "RCV_NO",
      dataType: "text",
      header: { text: t("허가번호") },
      editable: false,
      width:'180'
    },
    {
      fieldName: "WORK_DT",
      dataType: "text",
      header: { text: t("작업기간") },
      editable: false,
      width:'200'
    },
    {
      fieldName: "VND_NAME",
      dataType: "text",
      width: "180",
      header: { text: t("단기공사 업체") },

    },
    // 장소
    {
      fieldName: "JOB_SPLC",
      dataType: "text",
      width: "100",
      header: { text: t("기본") },
    },
    {
      fieldName: "DIV_M",
      dataType: "text",
      width: "150",
      header: { text: t("상세") },
      styleName: "left-column",
    },
    {
      header: { text: t("호선") },
      fieldName: "WORK_NO",
      width: "70",
      dataType: "text",
    },
   // 작업
   {
      fieldName: "DANG_DIV",
      dataType: "text",
      width: "150",
      header: { text: t("위험작업분류") },
      styleName: "left-column",
    },
    {
      fieldName: "WRK_DIST",
      dataType: "text",
      width: "150",
      header: { text: t("작업명") },
      styleName: "left-column",
    },
    {
      fieldName: "WORK_DETAIL",
      dataType: "text",
      width: "150",
      header: { text: t("작업상세") },
      styleName: "left-column",
    },
    {
      fieldName: "RESP_EMP_NM",
      dataType: "text",
      width: "90",
      header: { text: t("책임자") },
    },
    {
      fieldName: "MNGR_EMP_NM",
      dataType: "text",
      width: "90",
      header: { text: t("관리감독자　　　(승인자)") },
    },

    {
      fieldName: "CMPNY_DIV",
      editable: false,
      visible: false,
    },


  ],
  columns: [],
  columnLayout: [
    "RCV_NO",
    "WORK_DT",
    {
      name: "장소",
      direction: "horizontal",
      items: ["JOB_SPLC", "DIV_M"],
      header: {
        text: t("장소"),
      },
    },
    "WORK_NO",
    {
      name: "작업",
      direction: "horizontal",
      items: ["DANG_DIV", "WRK_DIST", "WORK_DETAIL"],
      header: {
        text: t("작업"),
      },
    },
    "RESP_EMP_NM",
    "MNGR_EMP_NM",
  ],
  
})

grdMainProps.columns = grdMainProps.fields



const openPopup = async ( short_yn ) => {

  rcvparam.value.CMPNY_DIV= props.datainer.CMPNY_DIV
  rcvparam.value.BSNS_CD= props.datainer.BSNS_CD
  rcvparam.value.DEPT_CD= props.datainer.DEPT_CD
  rcvparam.value.WORK_FROM= dayjs().subtract(7, "day").format("YYYY-MM-DD")
  rcvparam.value.WORK_TO= dayjs().format("YYYY-MM-DD")
  rcvparam.value.SHORT_YN = short_yn
  rcvparam.value.USER_ID=  short_yn == 'N' ?  props.datainer.USER_ID : ''

  grdMainProps.columnLayout = short_yn == 'N' ? grdMainProps.columnLayout : 
  [
    "RCV_NO",
    "WORK_DT",
    "VND_NAME",
    {
      name: "장소",
      direction: "horizontal",
      items: ["JOB_SPLC", "DIV_M"],
      header: {
        text: t("장소"),
      },
    },
    "WORK_NO",
    {
      name: "작업",
      direction: "horizontal",
      items: ["DANG_DIV", "WRK_DIST", "WORK_DETAIL"],
      header: {
        text: t("작업"),
      },
    },
    "RESP_EMP_NM",
    "MNGR_EMP_NM",
  ]

  await search() 
  dialog.value = true

}




const onButtonsClick = (e) => {
  if (e.id === "btnSearch"){
    search()
  }
  else if (e.id === "btnClose") {
    close()
  }
  else if (e.id === "btnSelect") {
    let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let SelectedData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    emit('selected', SelectedData)
    close()
  }


}



const search = () => {

  let searchparam  = JSON.parse(JSON.stringify(rcvparam.value)) // deep copy
  searchparam.WORK_FROM = searchparam.WORK_FROM.replace(/-/g, '')
  searchparam.WORK_TO = searchparam.WORK_TO.replace(/-/g, '')


  commonSearchApi({
    queryId: "SAFBA0010_SEARCH_27",
    param: searchparam,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}


// gird 더블 클릭 시 조회
const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType === "data") {
    let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let SelectedData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    emit('selected', SelectedData)

    close()
  }
}


const clearable = (btn) => {
  if (btn === 'writer'){
    rcvparam.value.USER_ID = ""
  }
  
}







const close = () => {
  dialog.value = false
  // grdMain.value.getGridView().filterPanel.clearInput()
}



// 그리드 이벤트

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1200"
    height="800"
    content-class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>위험작업리스트(PTW list)</span>

    </v-sheet>
    <v-card class="pa-0 rounded-b-5" style="height: calc(100% - 50px); display: flex; flex-direction: column;">
      <v-card-title class="pa-4 pb-2 flex-shrink-0">
        <IMenuTitle
          :button-list="['btnSearch', 'btnSelect', 'btnClose']" 
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="ml-2 mb-4 flex-shrink-0">
        ※ 더블클릭 또는 체크박스 선택 후 선택을 눌러주세요. 
      </div>

      <div class="ml-2 mb-3 flex-shrink-0 d-flex flex-row ">

        <i-input
          :label="$t('작업일')"
          v-model="rcvparam.WORK_FROM"
          type="Date"
          width="200px"
          margin="10px"
          required
        />
        <i-input
          class = 'mr-5'
          :label="$t('-')"
          v-model="rcvparam.WORK_TO"
          type="Date"
          width="160px"
          margin="10px"
        />

        <i-select
          class = 'mr-5'
          v-model="rcvparam.BSNS_CD"
          width="210px"
          :label="t('사업부')"
          :items="props.codeList?.bsnsCd"
          item-title="BSNS_NM"
          item-value="BSNS_CD"
          readonly
          :disabled = "true"
        />
                
        <i-select
          class = 'mr-5'
          v-model="rcvparam.DEPT_CD"
          :label="t('부서')"
          width="210px"
          :items="props.codeList?.deptCd"
          item-title="DEPT_NM"
          item-value="DEPT_CD"
        />

        <i-input
          class = 'mr-1'
          v-model="rcvparam.USER_ID"
          :label="t('작성자(사번)')"
          width="200px"
          clearable
          @click:clearable="clearable('writer')"
        />
 
      </div>
      <div class= "d-flex justify-center">
        <RealGrid
          class="mx-2 mb-2 flex-grow-1"
          style="min-height: 570px; width: 95%;"
          ref="grdMain"
          :grid-view-option="grdMainProps.gridViewOption"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          :column-layout="grdMainProps.columnLayout"
          @onCellDblClicked="onCellDblClicked"
        />
      </div>
    </v-card>

  </VDialog>

</template>

<style lang="scss">
// scoped 제거하여 v-dialog content에 적용되도록 함

.content-area {
  position: relative;
  height:800px;
  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
