<!--
  화면명 : 난청 최종제출
  화면개요 : 난청 최종제출
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
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  BIRTH_DAY: '', // 생일
  HLD_OFFI_GBN: '', // 재직구분
  BSNS_NM: '', // 사업부
  DEPT_NM: '', // 부서
  GWA_NM: '', // 과
  STD_DUTY_NM: '', // 직종
  COM_ENT_DATE: '', // 입사일자
  RETI_DATE: '', // 휴,퇴직일
  CMPNY_RCPT_DATE: '', // 회사접수일
  APPLI_GUBUN: '', // 신청구분
  APPLI_GUBUN_NM: '', // 신청구분명
  HOSPITAL_CODE: '', // 진단기관
  HOSPITAL_NM: '', // 진단기관명
  DIAGNOSIS_DATE: '', // 진단일
  DISEASE_NM: '난청', // 상병명
  APPLI_DATE: '', // 진정일(pk)
  INCIDENT_CODE: '', // 발생경위 코드
  INCIDENT_NM: '', // 발생경위
  NOTIFY_FILE_ID: '', // 사실통지서
  WORK_YEAR: '',
  WORK_EVAL: '', // 자체 작업력 평가
  EXPIRATION_DATE: '', // 유효기간
  IND_MANAGE: '',
  EAR_LEFT: '',
  EAR_RIGHT: '',
  FINAL_DATE: '',
  EVAL_RESULT: '',
  EVAL_DATE: '',
  CLASS_NUM: '',
  REMARK: '',
  SAVE_YN: ''
})

const codeList = reactive({
  EVAL_RESULT: []
})

// 팝업 OPEN
const openPopup = (param) => {
  Promise.all([
    // 판정결과
    getCodeList('HHII820I'),
  ]).then((res) => {
    codeList.EVAL_RESULT = res[0].ORESULT_CUR

    for (let key in param) {
      if (searchParams.hasOwnProperty(key)) {
        if(key === 'DIAGNOSIS_DATE' && !isEmpty(param.DIAGNOSIS_DATE)) {
          searchParams.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYY-MM-DD')
        } else if (key === 'FINAL_DATE' && !isEmpty(param.FINAL_DATE)) {
          searchParams.FINAL_DATE = dayjs(param.FINAL_DATE).format('YYYY-MM-DD')
        } else if (key === 'EVAL_DATE' && !isEmpty(param.EVAL_DATE)) {
          searchParams.EVAL_DATE = dayjs(param.EVAL_DATE).format('YYYY-MM-DD')
        } else {
          searchParams[key] = param[key]
        }
      }
    }

    searchParams.EMP_NM = param.KOR_NM
    searchParams.SAVE_YN = 'Y'
    dialog.value = true
  })
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

// 저장
const saveData = () => {
  let saveParam = _.cloneDeep(searchParams)
  // 예외처리 안하면 "Invalid Date"이 들어감
  saveParam.APPLI_DATE = searchParams.APPLI_DATE ? dayjs(searchParams.APPLI_DATE).format('YYYYMMDD') : ''
  saveParam.DIAGNOSIS_DATE = searchParams.DIAGNOSIS_DATE ? dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD') : ''
  saveParam.FINAL_DATE = searchParams.FINAL_DATE ? dayjs(searchParams.FINAL_DATE).format('YYYYMMDD') : ''
  saveParam.EVAL_DATE = searchParams.EVAL_DATE ? dayjs(searchParams.EVAL_DATE).format('YYYYMMDD') : ''
  saveParam.RETI_DATE = searchParams.RETI_DATE ? dayjs(searchParams.RETI_DATE).format('YYYYMMDD') : ''
  saveParam.BIRTH_DAY = searchParams.BIRTH_DAY ? dayjs(searchParams.BIRTH_DAY).format('YYYYMMDD') : ''
  saveParam.COM_ENT_DATE = searchParams.COM_ENT_DATE ? dayjs(searchParams.COM_ENT_DATE).format('YYYYMMDD') : ''
  saveParam.CMPNY_RCPT_DATE = searchParams.CMPNY_RCPT_DATE ? dayjs(searchParams.CMPNY_RCPT_DATE).format('YYYYMMDD') : ''
  
  return commonExecuteApi({ queryId : 'HLTJB0030_SAVE_01', list: [saveParam] })
}
 
const afterSaveData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  emit('send-final', searchParams)
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
    height="550"
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
      <span>판정결과 저장</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-0">
        <IGridTitle
          ref="menuTitle"
          :title="t('인원 정보')"
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
            <i-select
              v-model="searchParams.EVAL_RESULT"
              :label="$t('판정결과')"
              label-width="70px"
              :items="codeList.EVAL_RESULT"
              item-value="COD"
              item-title="TXT" 
              width="220px"
            /> 
            <i-input
              v-model="searchParams.EVAL_DATE"
              :label="$t('판정일')"
              label-width="70px"
              type="date"
              width="220px"
            />
            <i-input
              v-model="searchParams.CLASS_NUM"
              :label="$t('장해급수')"
              label-width="70px"
              type="text"
              width="220px"
              maxlength="10"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.REMARK"
              :label="$t('비고')"
              label-width="70px"
              type="text"
              maxlength="50"
              width="700px"
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
</style>
 
