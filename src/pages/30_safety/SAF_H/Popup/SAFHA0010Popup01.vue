
<!-- 
  * Vue 내 용 : 협력사 안전관리 Dashboard 사업부별 평과결과 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/05/15
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/05/15 
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from "vue-i18n"
import _ from "lodash"
import POB_QR from "@/assets/images/pages/POB_QR.png"

const emit = defineEmits(["closed"])

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)

//초기 데이터셋팅
onMounted(() => {})

const openPopup = val => {
  dialog.value = true
}

const onButtonsClick = btn => {
  if (btn.id === 'btnClose') {
    dialog.value = false
  }
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="750"
    height="1200"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
    <span>호선/프로젝트 승하선(POB) 관리 QR코드</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-0 pr-1">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-0">
        <v-sheet class="d-flex justify-center" width="100%">
          <img 
            :src="POB_QR" 
            width="75%"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
