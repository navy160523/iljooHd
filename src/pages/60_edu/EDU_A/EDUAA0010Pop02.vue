<script setup>
import { ref, reactive, onMounted } from "vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"

const vm = getCurrentInstance().proxy //다이얼로그관련

const t = useI18n().t //다국어
const dialog = ref(false)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}

const openPopup = () => {
  dialog.value = true 
}

const onClose = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})

onMounted(() => {
  window.addEventListener("mousemove", mouseUpdate)
})
</script>

<template style="margin: 0px">
<!-- persistent  << 영역 밖 클릭시 안닫히게 -->
  <VDialog
    v-model="dialog"
    eager
    width="750"
    height="190"
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
      <span>SLI 가점대상 강사 관련</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-0">
          <IGridTitle 
            ref="gridTitle"
            :button-list="['btnClose']"
            @click-button="onClose"
            class="mb-0"
          />
        </v-card-title>
        <v-card-text class="pa-4 pt-2 content-area">
          <div class="d-flex flex-column fill-height">
            <span style="color: darkblue;">(1) 사내강사(내국인)자격: <font style="color:red">사내 장비자격(내/외업 크레인 신호수, 곤돌라 운전 자격 등)</font> 강사</span>            
            <span style="color: darkblue;">(2) 사내강사(외국인)자격: <font style="color:red">외국인 국적이며, 산업안전보건법 시행규칙 제26조 제3항 각 호에 해당</font> 하는 사람</span>
            <span style="color: darkblue;">※ SLI 가점대상 강사 등록 요청/문의 시, 안전경영부(2-5692) 연락바랍니다.</span>            
          </div>
        </v-card-text>
    </v-card>
  </VDialog>
</template>

