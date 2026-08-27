
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import MNGBA0010Popup12Tab01 from './MNGBA0010Popup12Tab01.vue'
import MNGBA0010Popup12Tab02 from './MNGBA0010Popup12Tab02.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

defineOptions({
})

const tab = ref('1')
const userStore = useUserStore()
const dialog = ref(false)
const refTab01 = ref(null)

const onButtonsClick = async btn => {
  if(btn.id === "btnClose"){
    onClose()
  }
}

const setTab01 = e => {
  tab.value = '1'
  refTab01.value.searchParam(e)
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {
  dialog.value = true 
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
    scrollable
    width="1600"
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
      <span>{{'안전보건 교육 이행점검 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle 
          ref="menuTitle" 
          :title="`${$t('안전보건 교육 이행점검')}`"
          :button-list="[ 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet>
            <v-tabs v-model="tab">
              <v-tab value="1">안전보건 교육 이행점검</v-tab>
              <v-tab value="2">안전보건교육 실시 현황</v-tab>
            </v-tabs>
            <v-window v-model="tab" class="h-window">
              <v-window-item value="1">
                <MNGBA0010Popup12Tab01 ref="refTab01" />
              </v-window-item>
              <v-window-item value="2">
                <MNGBA0010Popup12Tab02 @cellClick="setTab01" @close="onClose" />
              </v-window-item>
            </v-window>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
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
