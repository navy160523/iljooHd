<!-- SI2팀 김성근  위험작업 허가서 현황 / 단기공사 조회 팝업    -->
<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import IMenuTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import IUpload from "@/components/IUpload.vue"

import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { update, value } from "lodash-es"


const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const filesLoad = ref(null)
const dialog = ref(false)
const emit = defineEmits(["selected"])

const getData = reactive({
  WRK_STD_NM: '',
  WRK_STD_CON: '',
  FILE_ID: ''
})
// 그리드
const openPopup = (data) => {

  dialog.value = true

  vm.$nextTick(() => {
    getData.WRK_STD_NM = data.WRK_STD_NM
    getData.WRK_STD_CON = data.WRK_STD_CON
    getData.FILE_ID = data.FILE_ID

    filesLoad.value.changeCmpny(data.CMPNY_DIV)
    filesLoad.value.setGuid(data.FILE_ID)
    filesLoad.value.onButtonsClick({ id: "btnSearch" })
  })
}

const onButtonsClick = (btn) => {

  if (btn.id === "btnClose") {
    dialog.value = false
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
      <span>단기공사 작업표준 상세</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-sheet class="d-flex flex-column mx-5">
        <i-input 
            top-label
            width="100%" 
            v-model="getData.WRK_STD_NM"
            height="40px" 
            labelWidth="72px" 
            label="제목" 
            readonly
            class="pb-3"
            />
        <i-textarea
            label-width="300px"
            top-label
            :label="$t('내용')"
            v-model="getData.WRK_STD_CON"
            width="100%"
            readonly
            />
      </v-sheet>

      <v-card-text class="pa-3">
        <IUpload
          class="mt-3"
          gridTitle="첨부파일"
          :gridOnly="true"
          ref="filesLoad"
          style="height: 150px"
        />
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
