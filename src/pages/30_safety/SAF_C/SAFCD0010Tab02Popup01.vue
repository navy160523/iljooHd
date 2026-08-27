<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import SAFCD0010Tab02Popup01Tab01 from './SAFCD0010Tab02Popup01Tab01.vue'
import SAFCD0010Tab02Popup01Tab02 from './SAFCD0010Tab02Popup01Tab02.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const tab = ref('PER_SUM')
const dialog = ref(false)
const sAFCD0010Tab02Popup01Tab01 = ref(null)
const sAFCD0010Tab02Popup01Tab02 = ref(null)
const receivedRowData = ref('') //

const openPopup = (data) => {
  dialog.value = true
  receivedRowData.value = data
}

const closePopup = () => {
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

//개별취합 탭이 마운트 되었을때
const mounted1 = () => {
  sAFCD0010Tab02Popup01Tab01.value.receivedData(receivedRowData.value)
}
//전체취합 탭이 마운트 되었을때
const mounted2 = () => {
  sAFCD0010Tab02Popup01Tab02.value.totalCollection(receivedRowData.value)
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1300"
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
      <span>계획점검 결과 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="mt-2">
            <v-tabs v-model="tab">
              <v-tab>개별 취합</v-tab>
              <v-tab>전체 취합</v-tab>
            </v-tabs>
            <v-window v-model="tab" class="h-window">
              <v-window-item value="PER_SUM">
                <SAFCD0010Tab02Popup01Tab01
                  ref="sAFCD0010Tab02Popup01Tab01"
                  @mounted1="mounted1"
                ></SAFCD0010Tab02Popup01Tab01>
              </v-window-item>
              <v-window-item value="ALL_SUM">
                <SAFCD0010Tab02Popup01Tab02
                  ref="sAFCD0010Tab02Popup01Tab02"
                  @mounted2="mounted2"
                ></SAFCD0010Tab02Popup01Tab02>
              </v-window-item>
            </v-window>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
