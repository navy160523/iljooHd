<!--
  화면명 : 건강관리 항목 상세
  화면개요 : 건강관리대상자 현황 건강관리항목 상세(잘 안보여서 있는 듯)
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

const emit = defineEmits(['after-search', 'send-notify'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const editor = ref(null)
const content = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  EMP_NO: '',
  EMP_NM: userStore.userName,
  MANAGE_ITEM: '',
})

// 팝업 OPEN
const openPopup = (param) => {
  searchParams.EMP_NM = param.EMP_NM
  searchParams.EMP_NO = param.EMP_NO
  searchParams.MANAGE_ITEM = param.MANAGE_ITEM

  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } 
}

/* ********** 닫기 ********** */
const closePopup = () => {
  dialog.value = false
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
    width="600"
    height="400"
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
      <span>건강관리항목</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea flex-column mb-2">
          <div class="d-flex">
            <i-input
              v-model="searchParams.EMP_NO"
              label-width="50px"
              :label="$t('등록번호')"
              width="180px"
              type="text"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.EMP_NM"
              width="180px"
              :label="$t('이름')"
              label-width="50px"
              type="text"
              :readonly="true" 
            />
          </div>
          <i-textarea
            :label="$t('건강관리항목')"
            v-model="searchParams.MANAGE_ITEM"
            topLabel
            width="540px"
            class="custom-flex-2 mt-2"
            :row="3"
            :readonly="true"
          />
        </v-sheet>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
::v-deep(.setWhiteColor > .v-input__control > .v-field) {
  background-color: #ffffff !important;
}
</style>
