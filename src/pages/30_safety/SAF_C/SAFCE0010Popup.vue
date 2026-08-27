<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import SAFCE0010PopupTab1 from './SAFCE0010PopupTab1.vue'
import SAFCE0010PopupTab2 from './SAFCE0010PopupTab2.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
defineOptions({
  name: '30_safety-SAF_C-SAFCE0010Popup',
})

const dialog = ref(false)
const sAFCE0010PopupTab1 = ref(null)
const sAFCE0010PopupTab2 = ref(null)
const tab = ref('재발방지대책리스트')
const emit = defineEmits(['checkListSelected', 'ptwListSelected'])
const openPopup = () => {
  dialog.value = true
}

const closePopup = () => {
  dialog.value = false
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

const checkListSelected = (val) => {
  emit('checkListSelected', val)
  closePopup()
}

const ptwListSelected = (val) => {
  emit('ptwListSelected', val)
  closePopup()
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1500"
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
      <span>점검항목 불러오기</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="mb-2">
            <v-tabs v-model="tab">
              <v-tab value="재발방지대책리스트">재발방지대책리스트</v-tab>
              <v-tab value="PTW 체크리스트">PTW 체크리스트</v-tab>
            </v-tabs>
          </v-sheet>
          <v-window v-model="tab" class="h-window">
            <v-window-item value="재발방지대책리스트">
              <SAFCE0010PopupTab1
                ref="sAFCE0010PopupTab1"
                @selected="checkListSelected"
              ></SAFCE0010PopupTab1>
            </v-window-item>
            <v-window-item value="PTW 체크리스트">
              <SAFCE0010PopupTab2
                ref="sAFCE0010PopupTab2"
                @ptwSelected="ptwListSelected"
              ></SAFCE0010PopupTab2>
            </v-window-item>
          </v-window>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
