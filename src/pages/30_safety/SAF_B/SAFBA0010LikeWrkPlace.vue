<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 허가서 작성 팝업 장소 즐겨찾기 팝업 -->

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
import { commonSearchApi,commonExecuteApi } from "@hiway/api/commonApi"
import SAFBA0010PopUp1 from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1.vue"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const emit = defineEmits(["upData","seleted"])
const dataRow = ref([])
const WRKData = reactive([])
const grdTitle = ref(null)
const grdMain = ref(null)
const safba00101 = ref(null)
const grdSub1= ref(null)
const grdSub1_1= ref(null)
const grdSub1_2= ref(null)
const LocationType = ref(null)

const intCode = () => {
  Promise.all([
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_20",
      param: {CMPNY_DIV : userStore.cmpnyDiv , USER_ID : userStore.userId},
    })
    ,])
    .then((res) => {
      console.log(res,'res')
      vm.$nextTick(()=>{
        grdSub1.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      })
    })
}

const openPopup = async (popupParam,Location) => {

  // LocationType.value = Location 
  // 장소 바인딩
  vm.$nextTick(() => {
        intCode()
        dialog.value = true
    })
}

const onButtonsClick = (e) => {
  if (e.id === "btnClose") {
    close()
  }
  if(e.id==='select'){
    commonSearchApi({
      queryId: "SAFBA0010_SEARCH_20",
      param: {CMPNY_DIV : userStore.cmpnyDiv , USER_ID : userStore.userId},
    })
    .then((res) => {
      vm.$nextTick(()=>{
        grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    })
  }
  if(e.id ==='btnDelete'){
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdSub1, row: null }])
      .setGridList([grdSub1])
      .setBefore(deleteDataChek)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id: "select" })
      })
      .run()
  }
}

const deleteDataChek =()=>{
  if(!dataRow.value){
    Message.warn(t("선택된 데이터가 없습니다."))
    return false
  }
  return true 
}

const deleteData = () =>{
 return commonExecuteApi({ queryId: "SAFBA0010_DELETE_07", list: [dataRow.value] })
}

const close = () => {
  dialog.value = false
}

const grdProps2 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: false } },
  keys: [],
  fields: [
    {
      fieldName: "BSNS_NM",
      dataType: "text",
      header: { text: t("작업 사업부") },
      editable: false,
      width: "120",
    },
    {
      fieldName: "WRKZIP",
      dataType: "text",
      header: { text: t("장소") },
      editable: false,
      width: "220",
    },
    { fieldName: "WRK_PLC", visible: false },
  
    { fieldName: "DIV_S_NM", visible: false },
    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "DIV_S", visible: false },
    { fieldName: "DIV_M_NM", visible: false },
    { fieldName: "DIV_DESC", visible: false },
    { fieldName: "DIV_S2_NM", visible: false },
    { fieldName: "INSERT_USER_ID", visible: false },
    { fieldName: "DIV_S3_NM", visible: false },
    { fieldName: "JOB_SPLC", visible: false },
    { fieldName: "FMA_DIV", visible: false },
    { fieldName: "DIV_L_NM", visible: false },
    { fieldName: "PCS_DIV", visible: false },
    { fieldName: "DIV_S3", visible: false },
    { fieldName: "WORK_NO", visible: false },
    { fieldName: "DIV_S2", visible: false },
    { fieldName: "LOCATIONTYPE", visible: false },
    { fieldName: "JOB_PLC_DTL", visible: false },
    { fieldName: "JOB_LPLC", visible: false },
    { fieldName: "JOB_MPLC", visible: false },
    { fieldName: "DIV_L", visible: false },
    { fieldName: "DIV_M", visible: false },
    { fieldName: "BSNS_CD", visible: false },
    { fieldName: "FSEQ", visible: false },
    { fieldName: "JOB_PLC", visible: false },
    { fieldName: "CODE_DESC6", visible: false },


  ],
  columns: [],
})

grdProps2.columns = grdProps2.fields



const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType === "data") {
    let row = grdSub1.value.getDataProvider().getJsonRow(clickData.dataRow)
   emit('seleted',row)
   close()
  }
}

const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === "data") {
    let row = grdSub1.value.getDataProvider().getJsonRow(clickData.dataRow)
    dataRow.value = row
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
    width="800"
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
      <span>즐겨찾기 불러오기</span>
    </v-sheet>
    <v-card class="pa-4 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnDelete','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-0">
                <!-- TYPE B  -->
                <RealGrid
                  class="mt-1"
                  ref="grdSub1"
                  style="height: 350px"
                  :grid-view-option="grdProps2.gridViewOption"
                  :keys="grdProps2.keys"
                  :fields="grdProps2.fields"
                  :columns="grdProps2.columns"
                  @onCellDblClicked ="onCellDblClicked"
                  @onCellClicked="onCellClicked"
                />
                
              </v-card-text>
    </v-card>
  
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
