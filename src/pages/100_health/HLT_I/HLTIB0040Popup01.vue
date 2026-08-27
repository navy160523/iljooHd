<script setup>
import { ref, reactive, nextTick } from 'vue'
import HLTIB0040PopupTab01 from './HLTIB0040Popup01Tab01.vue'
import HLTIB0040PopupTab02 from './HLTIB0040Popup01Tab02.vue'
import HLTIB0040PopupTab03 from './HLTIB0040Popup01Tab03.vue'
import HLTIB0040PopupTab04 from './HLTIB0040Popup01Tab04.vue'
import IGridTitle from '@/components/IGridTitle.vue'
const dialog = ref(false)
const tab = ref(1)
const rowData = reactive({})
const openPopup = (data) => {
  Object.assign(rowData, data)
  dialog.value = true
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

const closePopup = () => {
  dialog.value = false
  tab.value = 1
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    width="1300"
    height="1200"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    persistent
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>조사이력</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        ></IGridTitle>
      </v-card-title>
      <v-card-text class="pa-2 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet>
            <v-tabs v-model="tab">
              <v-tab :value="1">유해요인 조사표 1/4</v-tab>
              <v-tab :value="2">유해요인 조사표 2/4</v-tab>
              <v-tab :value="3">근골격계부담작업 증상 조사표</v-tab>
              <v-tab :value="4">근골격계 부담작업 개선 결과 등록</v-tab>
            </v-tabs>
            <v-window v-model="tab">
              <v-window-item :value="1">
                <HLTIB0040PopupTab01 :data="rowData"></HLTIB0040PopupTab01>
              </v-window-item>
              <v-window-item :value="2">
                <HLTIB0040PopupTab02 :data="rowData"> </HLTIB0040PopupTab02>
              </v-window-item>
              <v-window-item :value="3">
                <HLTIB0040PopupTab03 :data="rowData"></HLTIB0040PopupTab03>
              </v-window-item>
              <v-window-item :value="4">
                <HLTIB0040PopupTab04 :data="rowData"></HLTIB0040PopupTab04>
              </v-window-item>
            </v-window>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
