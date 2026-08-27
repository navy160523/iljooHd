<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

import { useUserStore } from '@hiway/stores/user'
const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['InputReason'])
const remark = ref(null)

const openPopup = () => {
  dialog.value = true
}

const closePopup = () => {
  dialog.value = false
  remark.value = null
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    emit('InputReason', remark.value)
    closePopup()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>작성완료 취소 사유 입력</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnUpdate', //저장
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="mt-2">
              <i-textarea 
                :label="$t('취소 사유')" 
                top-labelb width="100%" 
                v-model="remark"> 
              </i-textarea>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
