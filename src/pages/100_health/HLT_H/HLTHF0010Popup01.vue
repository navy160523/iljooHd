<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import { useUserStore } from '@hiway/stores/user'

const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['Saved'])

const codeList = reactive({
  division: [],
  reqCha: [],
})

const regularDeadlineField = reactive({
  YEAR: '', //년도
  REQ_CHA: '', //신청시기
  ST_DATE: '', //신청기간(FROM)
  EN_DATE: '', //신청기간(TO)
  RECEIVE_ST_DATE: '', //지급기간(FROM)
  RECEIVE_EN_DATE: '', //지급기간(TO)
  COM_ENT_DATE: '', //협력사 지급기준
  REMARKS: '', //비고
  SAVE_YN: '', //저장여부
  DIVISION: '', //안전보호구 구분
  UPDATE_YN: 'N', //수정 여부
})

const readOnlyValue = reactive({
  YEAR: false,
  REQ_CHA: false,
})

const initCodeList = (division) => {

  const div = division//regularDeadlineField.DIVISION
  const systemCode = ref('')

console.log('divdiv : ', div)

  switch(div){
    case 'A':
      systemCode.value = 'HHII808A'
      break
    case 'B':
      systemCode.value = 'HHII808B'
      break
    case 'C':
      systemCode.value = 'HHII808C'
      break
  }

  Promise.all([getCodeList(systemCode.value)]).then((res) => {
    codeList.reqCha = res[0].ORESULT_CUR
  })
}


const openPopup = (division) => {
  dialog.value = true
  regularDeadlineField.UPDATE_YN = 'N'
  regularDeadlineField.YEAR = new Date().getFullYear()
  let day = dayjs().format('MM-DD')
  regularDeadlineField.REQ_CHA = '1'
  regularDeadlineField.DIVISION = division

  initCodeList(division);
}

const closePopup = () => {
  dialog.value = false
  //초기화
  readOnlyValue.YEAR = false //년도 readonly 해제
  readOnlyValue.REQ_CHA = false //신청시기 readonly 해제
  regularDeadlineField.UPDATE_YN = 'N'
  for (let i in regularDeadlineField) {
    regularDeadlineField[i] = ''
  }
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

//저장관련 로직 시작
const beforeSave = () => {
  if (!regularDeadlineField.YEAR) {
    Message.warn(t('년도는 필수값 입니다.'))
    return false
  } else if (!regularDeadlineField.REQ_CHA) {
    Message.warn(t('신청시기는 필수값 입니다.'))
    return false
  } else if (!regularDeadlineField.ST_DATE) {
    Message.warn(t('신청기간-시작일은 필수값 입니다.'))
    return false
  } else if (!regularDeadlineField.EN_DATE) {
    Message.warn(t('신청기간-마감일은 필수값 입니다.'))
    return false
  }  else if (!regularDeadlineField.RECEIVE_ST_DATE) {
    Message.warn(t('지급기간-시작일은 필수값 입니다.'))
    return false
  } else if (!regularDeadlineField.RECEIVE_EN_DATE) {
    Message.warn(t('지급기간-마감일은 필수값 입니다.'))
    return false
  } else if (regularDeadlineField.ST_DATE > regularDeadlineField.EN_DATE) {
    Message.warn(t('시작일은 마감일보다 클수없습니다.'))
    return false
  }
  return true
}

const saveData = () => {

  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    DIVISION: regularDeadlineField.DIVISION,
    YEAR: regularDeadlineField.YEAR,
    REQ_CHA: regularDeadlineField.REQ_CHA,
    ST_DATE: regularDeadlineField.ST_DATE.replaceAll('-', ''),
    EN_DATE: regularDeadlineField.EN_DATE.replaceAll('-', ''),
    RECEIVE_ST_DATE: regularDeadlineField.RECEIVE_ST_DATE.replaceAll('-', ''),
    RECEIVE_EN_DATE: regularDeadlineField.RECEIVE_EN_DATE.replaceAll('-', ''),
    COM_ENT_DATE: regularDeadlineField.COM_ENT_DATE == null ? '' : regularDeadlineField.COM_ENT_DATE.replaceAll('-', ''),
    REMARKS: regularDeadlineField.REMARKS,
    USER_ID: userStore.userId,
    UPDATE_YN: regularDeadlineField.UPDATE_YN
  }

  console.log(regularDeadlineField.ST_DATE.replaceAll('-', ''))

  saveParam.push(saveData)
  return commonExecuteApi({
      queryId: 'HLTHF0010_SAVE_01',
      list: saveParam,
    })

  // //SAVE_YN값이 없으면 신규저장
  // if (!regularDeadlineField.SAVE_YN) {
  //   return commonExecuteApi({
  //     queryId: 'CLDAB0010_SAVE_01',
  //     list: saveParam,
  //   })
  // } else {
  //   return commonExecuteApi({
  //     queryId: 'CLDAB0010_SAVE_02',
  //     list: saveParam,
  //   })
  // }
  // //SAVE_YN값이 있으면 수정
}

const afterSave = (res) => {
  emit('Saved')
  closePopup()
}

//저장관련 로직 끝

const openPopup2 = (data, division) => {
  dialog.value = true
  regularDeadlineField.SAVE_YN = 'Y' //수정플래그값
  readOnlyValue.YEAR = true //년도 readonly
  readOnlyValue.REQ_CHA = true //신청시기 readonly
  regularDeadlineField.DIVISION = division
  regularDeadlineField.UPDATE_YN = 'Y'
  for (const [key, value] of Object.entries(data)) {
    if (regularDeadlineField.hasOwnProperty(key)) {
      regularDeadlineField[key] = value
    }
  }
  initCodeList(division);
}

onMounted(() => {

})

defineExpose({
  openPopup,
  openPopup2,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>정기신청 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="true"
          :button-list="[
            'btnUpdate', //저장
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="d-flex mt-2 form-row">
              <i-select
                :label="$t('연도')"
                width="100px"
                required
                top-label
                type="YEAR"
                class="custom-flex-1"
                v-model="regularDeadlineField.YEAR"
                :readonly="readOnlyValue.YEAR"
              />
              <i-select
                :label="$t('차수')"
                width="150px"
                required
                top-label
                :items="codeList.reqCha"
                item-title="TXT"
                item-value="COD"
                class="custom-flex-1"
                v-model="regularDeadlineField.REQ_CHA"
                :readonly="readOnlyValue.REQ_CHA"
              />
              <!-- <i-input
                :label="$t('협력사 지급 기준일')"
                width="150px"
                top-label
                type="date"
                :iconRight=true
                class="custom-flex-1"
                v-model="regularDeadlineField.COM_ENT_DATE"
              /> -->
              <span class="custom-flex-2"/>
              <span class="custom-flex-2"/>
            </div>
            <div class="d-flex mt-2 form-row">
              <i-input
                :label="$t('신청기간-시작일')"
                width="150px"
                required
                top-label
                type="date"
                class="custom-flex-1"
                v-model="regularDeadlineField.ST_DATE"
              />
              <i-input
                :label="$t('신청기간-마감일')"
                width="150px"
                required
                top-label
                type="date"
                class="custom-flex-1"
                v-model="regularDeadlineField.EN_DATE"
              />
              <i-input
                :label="$t('지급기간-시작일')"
                width="150px"
                required
                top-label
                type="date"
                class="custom-flex-1"
                v-model="regularDeadlineField.RECEIVE_ST_DATE"
              />
              <i-input
                :label="$t('지급기간-마감일')"
                width="150px"
                required
                top-label
                type="date"
                class="custom-flex-1"
                v-model="regularDeadlineField.RECEIVE_EN_DATE"
              />
              <span class="custom-flex-2"/>
            </div>
            <div class="mt-2">
              <i-textarea
                :label="$t('비고')"
                top-label
                width="100%"
                v-model="regularDeadlineField.REMARKS"
              >
              </i-textarea>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped>
  .form-row {
    display: flex;
    flex-wrap: wrap; /* 요소가 넘치면 자동으로 줄 바꿈 */
    gap: 10px; /* 요소 간격 */
  }
  
.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 1 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}
</style>
