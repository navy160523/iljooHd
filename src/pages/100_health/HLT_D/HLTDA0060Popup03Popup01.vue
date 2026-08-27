<!--
  화면명 : 화학물질 관리시스템 운영이슈 상세 추가
  화면개요 : 화학물질 관리시스템 운영이슈 상세
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
import DeptPopup from '@/components/popup/DeptPopup.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const deptPopup = ref(null)
const deptType = ref('')

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  SEQ: '',
  TMP_OCUR_DATE: '',
  OCUR_DATE: '',
  DIVISION: '',
  CHECK_STEP: '',
  REQ_DEPT_CD: '',
  REQ_DEPT_NM: '',
  BUY_DEPT_CD: '',
  BUY_DEPT_NM: '',
  MATNO: '',
  RESTRICT: '',
  RELEVANT_BASIS: '',
  ACTION_DETAIL: '',
  STATUS_DIV: '',
})

// 팝업 OPEN
const openPopup = (param) => {
  if(!isEmpty(param)) {
    for (let key in param) {
      if (searchParams.hasOwnProperty(key)) {
        if(key === 'OCUR_DATE') {
          searchParams.TMP_OCUR_DATE = dayjs(param.OCUR_DATE).format('YYYY-MM-DD')
        } else {
          searchParams[key] = param[key]
        }
      } 
    }
    menuTitle.value.disableBtn('btnDelete', false)
  } else {
    searchParams.CMPNY_DIV = userStore.cmpnyDiv
    searchParams.TMP_OCUR_DATE = dayjs().format('YYYY-MM-DD')
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

  searchParams.OCUR_DATE = dayjs(searchParams.TMP_OCUR_DATE).format('YYYYMMDD')
  return true
}

const saveData = () => {
  return commonExecuteApi({ queryId : 'HLTDA0060_SAVE_01', list: [searchParams] })
}

const afterSaveData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}


const deleteData = () => { 
  return commonExecuteApi({ queryId : 'HLTDA0060_DELETE_01', list: [searchParams] })
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

// 부서 선택 이벤트
const onDeptSelected = val => {
  if (deptType.value === 'R') {
    searchParams.REQ_DEPT_CD = val.DEPT_CD
    searchParams.REQ_DEPT_NM = val.ASGN_SHRT_NM
  } else if (deptType.value === 'B') {
    searchParams.BUY_DEPT_CD = val.DEPT_CD
    searchParams.BUY_DEPT_NM = val.ASGN_SHRT_NM
  }
}

// 청구부서 선택
const openDeptcdPopupReq = () => {
  deptType.value = 'R'
  deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams.DEPT_NM })
}
 
// 구매부서 선택
const openDeptcdPopupBuy = () => {
  deptType.value = 'B'
  deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams.DEPT_NM })
}

// 청구부서 clear
const clearDeptcdReq = () => {
  searchParams.REQ_DEPT_CD = ''
  searchParams.REQ_DEPT_NM = ''
}

// 구매부서 clear
const clearDeptcdBuy = () => {
  searchParams.BUY_DEPT_CD = ''
  searchParams.BUY_DEPT_NM = ''
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
    width="800"
    height="700"
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
      <span>화학물질 관리시스템 운영이슈 상세 추가 및 수정</span>
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
              v-model="searchParams.TMP_OCUR_DATE"
              :label="$t('발생일자')"
              label-width="50px"
              type="date"
              width="200px"
            />
            <i-input
              v-model="searchParams.DIVISION"
              :label="$t('분류')"
              label-width="50px"
              type="text"
              maxlength="20"
              width="200px"
            />
            <i-input
              v-model="searchParams.CHECK_STEP"
              :label="$t('확인단계')"
              label-width="50px"
              type="text"
              maxlength="20"
              width="200px"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.REQ_DEPT_NM"
              :label="$t('청구부서')"
              label-width="50px"
              type="text"
              append-inner-icon="mdi-magnify"
              width="200px"
              @click:appendInner="openDeptcdPopupReq"
              @keydown.enter="openDeptcdPopupReq"
            >
              <template #append-inner>
                <v-icon 
                  icon="mdi-window-close"
                  @click="clearDeptcdReq"
                />
              </template>
            </i-input>
            <i-input
              v-model="searchParams.BUY_DEPT_NM"
              :label="$t('구매부서')"
              label-width="50px"
              type="text"
              append-inner-icon="mdi-magnify"
              width="200px"
              @click:appendInner="openDeptcdPopupBuy"
              @keydown.enter="openDeptcdPopupBuy"
            >
              <template #append-inner>
                <v-icon 
                  icon="mdi-window-close"
                  @click="clearDeptcdBuy"
                />
              </template>
            </i-input>
            <i-input
              v-model="searchParams.MATNO"
              :label="$t('자재번호')"
              label-width="50px"
              type="text"
              maxlength="20"
              width="200px"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.RESTRICT"
              :label="$t('규제물질')"
              label-width="50px"
              type="text"
              maxlength="20"
              width="200px"
            />
            <i-input
              v-model="searchParams.STATUS_DIV"
              :label="$t('상태구분')"
              label-width="50px"
              class="mt-2"
              type="text"
              maxlength="20"
              width="200px"
            />
          </div>
          <i-textarea
            v-model="searchParams.RELEVANT_BASIS"
            :label="$t('관련근거')"
            :row="5"
            width="100%"
            class="mt-2"
          />
          <i-textarea
            v-model="searchParams.ACTION_DETAIL"
            :label="$t('조치상세')" 
            :row="5"
            width="100%"
            class="mt-2"
          />
        </v-sheet>
      </div>
    </v-card>
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
  </v-dialog>
</template>

<style scoped lang="scss">
.text-title {
  font-weight: bold;
  font-size: 18px;
}
.text-user {
  font-weight: 500;
  font-size: 16px;
  margin-top: 4px;
}

.text-confirm {
  font-weight: bold;
  font-size: 21px;
  color: blue;
}

.text-prohibit {
  font-weight: bold;
  font-size: 21px;
  color: red;
}
</style>
