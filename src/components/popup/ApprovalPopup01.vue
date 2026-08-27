
<!-- 
  * Vue 내 용 : 결재 문서 미리보기
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/21
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/21 
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import IGridTitle from "@/components/IGridTitle.vue"
import _ from "lodash"

const dialog = ref(false)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

const popupParam = reactive(
  {
    NOTICE_NOTE: "",
  },
)

const openPopup = val => {
  console.log("openPopup", val)
  popupParam.NOTICE_NOTE = val
  dialog.value = true
}

const onClose = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnClose')
  {
    onClose()
  }
}
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="70%"
    height="100%"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>미리보기</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div v-html="popupParam.NOTICE_NOTE" /> 
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.content-area {
  text-align: center;
}
</style>
