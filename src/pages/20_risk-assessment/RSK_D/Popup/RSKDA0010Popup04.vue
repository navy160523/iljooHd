<!--
  화면명 : 위험성평가 위원회 회의록 등록/현황 팝업(파일 미리보기)
  화면개요 : 정기위험성 평가 목록 파일 미리보기
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
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import { useI18n } from "vue-i18n"
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import ImageViewer from '@/components/IUploadImageSingle.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const emit = defineEmits(["selected"])
const dialog = ref(false)
const grdMain = ref(null)
const imgUrl = ref('')
const saveFile = ref(null)
const imageViewer = ref(null)


const saveParams = reactive({
  CMPNY_DIV: '',
  FILE_ID: '',
  FILE_NO: '',
  FILE_TITLE: '',
  FILE_NAME_ORIGINAL: '',
  FILE_NAME: '',
  FILE_PATH: '',
  FILE_TYPE: '',
  FILE_SIZE: '',
  USER_ID: '',
  CHUNK_NUMBER: 0,
  TOTAL_CHUNKS: 0,
})

// 버튼 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    searchData()
  } else if (btn.id === 'btnRskCopyApp') {
    applyData()
  } else if (btn.id ==='btnClose') {
    closePopup()
  }
}


// 팝업 오픈
const openPopup = async el => {
  console.log('팝업 오픈', el)
  dialog.value = true

  imageViewer.value.setGuid(el.FILE_ID)
  imageViewer.value.onButtonsClick({ id: 'btnSearch' })

}

// 팝업 닫기
const closePopup = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog 
    v-model="dialog" 
    eager 
    persistent 
    width="700"
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">미리보기</div>
    <VContainer style="background-color: white" class="pt-0">
      <VRow>
        <VCol cols="12">
          <ImageViewer 
            ref="imageViewer"
            style="height: 400px"
            :button-list="[]"
          />
        </VCol>
      </VRow>
      <VRow>
        <VCol>
          <IGridTitle
            :button-list="['btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
