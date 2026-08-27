<!--
  화면명 : 위험성평가 위원회 회의록 등록/현황 파일 업로드
  화면개요 : 파일 업로드
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import IUpload from "@/components/IUpload.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const emit = defineEmits(["selected"])
const dialog = ref(false)
const fileUpload = ref(null)
const gridOnly = ref(false)

const popupParams = reactive({
  FILE_ID: "",
  NROUTINE_WORK_ID: "",
})

// popup open
const openPopup = (el, gbn) => {
  if(el.gridOnly != undefined) {
    gridOnly.value = el.gridOnly
  }

  dialog.value = true

  popupParams.NROUTINE_WORK_ID = el.NROUTINE_WORK_ID

  console.log('gbn', gbn)

  if(gbn === 'EDU_FILE_ID'){
    popupParams.FILE_ID = el.EDU_FILE_ID
    fileUpload.value.setGuid(el.EDU_FILE_ID)    
  } else {
    popupParams.FILE_ID = el.FILE_ID
    fileUpload.value.setGuid(el.FILE_ID)
  }
  fileUpload.value.onButtonsClick({ id: "btnSearch" })
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnClose") {
    closePopup()
  }
}

// 파일 첨부저장 클릭 후 이벤트
const getFileInfo = async(data) => {
  //console.log(data)
  let fileSaveParams = []  

  fileSaveParams.push({
    FILE_ID: data.fileId,
    NROUTINE_WORK_ID: popupParams.NROUTINE_WORK_ID,
  })

  let rtnData = await commonExecuteApi({ queryId: "RSKCA0010_FILE_SAVE_01", list: fileSaveParams })

  //console.log('rtnData',rtnData)
  console.log('rtnData',rtnData.list[0])

  const newArr = [
      { FILE_ID: data.fileId, FILE_CNT: rtnData.list[0].OUT_RES_COD },      
  ]

  console.log('newArr',newArr[0])

  // 파일 데이터 그리드 즉시 반영
  emit("selected", newArr[0])
  // closePopup()
}

// 팝업 닫기
const closePopup = () => {
  dialog.value = false
  fileUpload.value.clearGrid()
}

defineExpose({
  openPopup,
})

onMounted(() => {
  fileUpload.value.setGuid() //guid설정
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    width="900"
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
      <span>파일 업로드</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-sheet class="pa-3">
        <IUpload ref="fileUpload" style="height: 300px" @uploaded="getFileInfo" :gridOnly="gridOnly" />
      </v-sheet>
      <v-sheet class="pa-4 pb-2">
        <IGridTitle :button-list="['btnClose']" @click-button="onButtonsClick" />
      </v-sheet>
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
