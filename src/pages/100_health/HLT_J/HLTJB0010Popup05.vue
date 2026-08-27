<!--
  화면명 : 업무상 질병 최종제출
  화면개요 : 업무상질병 최종제출
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
import ILabel from '@/components/ILabel.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

const emit = defineEmits(['after-search', 'send-final'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  BSNS_NM: '',
  DEPT_NM: '',
  GWA_NM: '',
  JOB_TIT_NM: '',
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  APPLI_GUBUN: '', // 신청구분
  APPLI_GUBUN_NM: '', // 신청구분명
  HOSPITAL_CODE: '', // 진단기관
  HOSPITAL_NM: '', // 진단기관명
  DIAGNOSIS_DATE: '', // 진단일
  FINAL_DATE: '',
  SAVE_YN: ''
})

// 팝업 OPEN
const openPopup = (param) => {
  for (let key in param) {
    if (searchParams.hasOwnProperty(key)) {
      if(key === 'DIAGNOSIS_DATE' && !isEmpty(param.DIAGNOSIS_DATE)) {
        searchParams.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYY-MM-DD')
      } else {
        searchParams[key] = param[key]
      }
    }
  }
  searchParams.FINAL_DATE = dayjs().format('YYYY-MM-DD')
  searchParams.EMP_NM = param.KOR_NM
  searchParams.SAVE_YN = 'Y'
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
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}


// 저장 전
const beforeSave = () => {
  return true
}

// 저장
const saveData = () => {
  let saveParam = _.cloneDeep(searchParams)
  saveParam.DIAGNOSIS_DATE = dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD')
  if(!isEmpty(saveParam.FINAL_DATE)) {
    saveParam.FINAL_DATE = dayjs(searchParams.FINAL_DATE).format('YYYYMMDD')
  }
  return commonExecuteApi({ queryId : 'HLTJB0010_SAVE_14', list: [saveParam] })
}
 
const afterSaveData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  emit('send-final', searchParams.FINAL_DATE)
  closePopup()
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
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
    width="800"
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
      <span>최종제출일 저장</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="t('')"
          :use-permission="false"
          :button-list="['btnUpdate','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea flex-column mb-2">
          <div class="d-flex">
            <i-input
              v-model="searchParams.BSNS_NM"
              :label="$t('사업부')"
              label-width="70px"
              type="text"
              width="220px"
              readonly
            />
            <i-input
              v-model="searchParams.DEPT_NM"
              :label="$t('부서')"
              label-width="70px"
              type="text"
              width="220px"
              readonly
            />
            <i-input
              v-model="searchParams.GWA_NM"
              :label="$t('과')"
              label-width="70px"
              type="text"
              width="220px"
              readonly
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.EMP_NM"
              :label="$t('사번/성명')"
              label-width="70px"
              type="text"
              width="220px"
              readonly
            />
            <i-input
              v-model="searchParams.DIAGNOSIS_DATE"
              :label="$t('진단일')"
              label-width="70px"
              type="date"
              width="220px"
              readonly
            />
            <i-input
              v-model="searchParams.HOSPITAL_NM"
              :label="$t('진단기관명')"
              label-width="70px"
              type="text"
              width="220px"
              readonly
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.FINAL_DATE"
              :label="$t('최종제출일')"
              label-width="70px"
              type="date"
              width="220px"
            />
          </div>
        </v-sheet>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
::v-deep(.setWhiteColor > .v-input__control > .v-field) {
  background-color: #ffffff !important;
}
.tmp {
  background-color: #ecff1c !important;
}
</style>
 
