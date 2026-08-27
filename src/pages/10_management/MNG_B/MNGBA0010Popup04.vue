<!--
작성자 : 일주지앤에스 SI3팀 김현재 선임
화면명 : 안전점검 결과등록
화면개요 : 안전점검 결과를 등록한다.
-->
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
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import SAFCD0010Tab02 from './MNGBA0010Popup04Tab02.vue'
import SAFCD0010Tab03 from './MNGBA0010Popup04Tab03.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

defineOptions({
})

const tab = ref('DAILY')
const userStore = useUserStore()
const tabVisibleValue = ref(true)
const dialog = ref(false)

//로그인유저가 협력사 권한을 가지고 있으면 계획점검탭 visible false
const checkPartnerCompany = () => {
  if (userStore.authGrpCd.includes('GRP00385')) {
    tabVisibleValue.value = false
  }
}

const onButtonsClick = async btn => {
  if(btn.id === "btnClose"){
    onClose()
  }
}

//창 닫음
const onClose = () => {
  dialog.value = false
}

const openPopup = async data => {  
  checkPartnerCompany()
  //팝업 오픈
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
      <span>{{'중대재해차단대책 이행점검 팝업'}}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle 
          ref="menuTitle" 
          :title="`${$t('중대재해차단대책 이행점검')}`"
          :button-list="[ 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet>
            <v-tabs v-model="tab">
              <v-tab value="PLAN">계획점검</v-tab>
              <v-tab value="PTW">고위험 3중 안전점검 모니터링</v-tab>
            </v-tabs>
            <v-window v-model="tab" class="h-window">
              <v-window-item value="PLAN">
                <SAFCD0010Tab02></SAFCD0010Tab02>
              </v-window-item>
              <v-window-item value="PTW">
                <SAFCD0010Tab03></SAFCD0010Tab03>
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
