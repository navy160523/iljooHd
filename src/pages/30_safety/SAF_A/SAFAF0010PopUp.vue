<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 사고 세부사항 팝업    -->

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
import { value } from "lodash-es"

import Message from "@hiway/utils/notify"
import AcdtPopup from "@/components/popup/AcdtPopup.vue"
import SendMailPopup from "@/components/popup/SendMailPopup.vue"
import saveFlowHelper from "@/utils/saveFlowHelper"
import { useUserStore } from "@hiway/stores/user"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import IUpload from "@/components/IUpload.vue"
import SAFAF0010PopUpTab1 from "./SAFAF0010PopUpTab1.vue"
import SAFAF0010PopUpTab2 from "./SAFAF0010PopUpTab2.vue"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const tab = ref(null)
const dataCheck = ref({})
const emit = defineEmits(["upData"])
const dataInner = reactive({})

//컴포넌트별 readonly value
const readOnlyValue = reactive({
  btnApproval: true, //결제
  btnPrint: true, //출력
  btnSearch: true, //조회
})

//  팝업 관련
const openPopup = async (popupParam) => {
  dataCheck.value = popupParam
  await searchData()
  dialog.value = true
}

const searchData = async () => {
  let param = {
    CMPNY_DIV: dataCheck.value.CMPNY_DIV,
    SAGO_SN: dataCheck.value.SAGO_SN,
  }
  await commonRequest("/hse/safety/SEARCH", {
    queryId: "SAFAB0020_search03",
    param: param,
  }).then((res) => {
    for (let i in res.ORESULT_CUR) {
      dataInner[i] = res.ORESULT_CUR[i]
    }
  })
}

const upData = () => {
  searchData()
}

const close = () => {
  dialog.value = false
  emit("upData")
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1440"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">사고보고서</div>

    <VContainer style="background-color: white">
      <v-tabs v-model="tab" class="align">
        <v-tab value="사고즉보">{{ t("사고즉보") }}</v-tab>
        <v-tab value="사고 보고서">{{ t("사고 보고서") }}</v-tab>
        <v-spacer />
        <v-btn :disabled="readOnlyValue.btnApproval">결재</v-btn>
        <v-btn :disabled="readOnlyValue.btnPrint">출력</v-btn>
        <v-btn :disabled="readOnlyValue.btnSearch">조회</v-btn>
        <v-btn @click="close" class="mr-4">닫기</v-btn>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="사고즉보">
          <SAFAF0010PopUpTab1 :popupParam="dataInner[0]" @upData="upData" />
        </v-window-item>

        <v-window-item value="사고 보고서">
          <SAFAF0010PopUpTab2 :popupParam="dataInner[0]" @upData="upData" />
        </v-window-item>
      </v-window>
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
