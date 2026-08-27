<!--
  화면명 : 수입 화학물질 MSDS 제출 현황 추가
  화면개요 : 수입 화학물질 MSDS 제출 현황
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  SEQ: '',
  MSDS_NO: '',
  MSDS_DATE: '',
  TMP_MSDS_DATE: '',
  STATUS: '',
  IMPORT_DATA: '',
  MAT_DIV: '',
  CONTRACT_NO: '',
  POR_NO: '',
  MATNO: '',
  PURCHASE_MANAGE: '',
  IMPORT_QUANTITY: '',
  IT_PRODUCT_NM: '',
  REAL_PRODUCT_NM: '',
  EXPENSE: '',
  TARGET_YN: '',
  LOC_DATE: '',
  TMP_LOC_DATE: '',
  SECRET_YN: ''
})

// 팝업 OPEN
const openPopup = (param) => {
  if(!isEmpty(param)) {
    for (let key in param) {
      if (searchParams.hasOwnProperty(key)) {
        if(key === 'MSDS_DATE') {
          searchParams.TMP_MSDS_DATE = dayjs(param.MSDS_DATE).format('YYYY-MM-DD')
        } else if (key === 'LOC_DATE') {
          searchParams.TMP_LOC_DATE = dayjs(param.LOC_DATE).format('YYYY-MM-DD')
        } else {
          searchParams[key] = param[key]
        }
      } 
    }
    menuTitle.value.disableBtn('btnDelete', false)
  } else {
    searchParams.CMPNY_DIV = userStore.cmpnyDiv
    searchParams.TMP_MSDS_DATE = dayjs().format('YYYY-MM-DD')
    searchParams.TMP_LOC_DATE = dayjs().format('YYYY-MM-DD')
    menuTitle.value.disableBtn('btnDelete', true)
  }

  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}


// 저장 전
const beforeSave = () => {
  // validation 체크

  searchParams.MSDS_DATE = dayjs(searchParams.TMP_MSDS_DATE).format('YYYYMMDD')
  searchParams.LOC_DATE = dayjs(searchParams.TMP_LOC_DATE).format('YYYYMMDD')
  return true
}

const saveData = () => {
  return commonExecuteApi({ queryId : 'HLTDA0060_SAVE_02', list: [searchParams] })
}

const afterSaveData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}


const deleteData = () => { 
  return commonExecuteApi({ queryId : 'HLTDA0060_DELETE_02', list: [searchParams] })
} 

const afterDelete = () => {
  Message.success(t('성공적으로 삭제되었습니다'))
  closePopup()
}


/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')

  for (let key in searchParams) {
    if (searchParams.hasOwnProperty(key)) {
      searchParams[key] = ''
    } 
  }

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
    width="1000"
    height="500"
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
      <span>수입 화학물질 MSDS 제출 현황 상세 추가 및 수정</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea flex-column mb-2">
          <div class="d-flex">
            <i-input
              v-model="searchParams.MSDS_NO"
              :label="$t('MSDS번호')"
              label-width="100px"
              type="text"
              maxlength="20"
              width="250px"
            />
            <i-input
              v-model="searchParams.TMP_MSDS_DATE"
              :label="$t('MSDS제출일자')"
              label-width="100px"
              type="date"
              width="250px"
            />
            <i-input
              v-model="searchParams.STATUS"
              :label="$t('진행상태')"
              label-width="100px"
              type="text"
              maxlength="20"
              width="250px"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.IMPORT_DATA"
              :label="$t('수입정보')"
              label-width="100px"
              type="text"
              maxlength="20"
              width="250px"
            />
            <i-input
              v-model="searchParams.PURCHASE_MANAGE"
              :label="$t('구매담당')"
              label-width="100px"
              class="mt-2"
              type="text"
              maxlength="20"
              width="250px"
            />
            <i-input
              v-model="searchParams.REAL_PRODUCT_NM"
              :label="$t('실제상품명')"
              label-width="100px"
              class="mt-2"
              type="text"
              maxlength="20"
              width="250px"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.EXPENSE"
              :label="$t('용도')"
              label-width="100px"
              type="text"
              maxlength="20"
              width="250px"
            />
            <i-input
              v-model="searchParams.TARGET_YN"
              :label="$t('대상유무')"
              label-width="100px"
              class="mt-2"
              type="text"
              maxlength="20"
              width="250px"
            />
            <i-input
              v-model="searchParams.TMP_LOC_DATE"
              :label="$t('LOC접수일')"
              label-width="100px"
              type="date"
              width="250px"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.SECRET_YN"
              :label="$t('영업비밀 유무')"
              label-width="100px"
              class="mt-2"
              type="text"
              maxlength="20"
              width="250px"
            />
          </div>
        </v-sheet>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
