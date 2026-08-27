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
  USER_DIV: [], //소속구분
  CLOTHE_GUBUN: [], //피복구분
  OFFI_RES_NM: [], //직책
  CLOTHE_COUNT: [], //지급수량
})

const standardManageField = reactive({
  USER_DIV: '', //소속구분
  CLOTHE_GUBUN: '', //피복구분
  CLOTHE_COUNT: '', //지급수량
  OFFI_RES_NM: '', //직책
  REMARKS: '', //비고
})

const initCodeList = () => {
  Promise.all([
    //소속구분
    getCodeList('HHIZ020'),
    //피복구분
    getCodeList('HHIT060'),
    //지급수량
    getCodeList('HHIT080'),
  ]).then((res) => {
    //단기공사,기타 제외
    codeList.USER_DIV = res[0].ORESULT_CUR.filter((x) => !['Z', 'D'].includes(x.COD))
    codeList.CLOTHE_GUBUN = res[1].ORESULT_CUR.filter((x) => x.COD != '1') //SAFE클로버 피복은 제외
    codeList.CLOTHE_COUNT = res[2].ORESULT_CUR
  })
}

const openPopup = () => {
  dialog.value = true
}

const closePopup = () => {
  dialog.value = false
  for (let i in standardManageField) {
    standardManageField[i] = ''
  }
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

//저장관련 로직 시작
const beforeSave = () => {
  if (!standardManageField.USER_DIV) {
    Message.warn(t('소속구분은 필수값 입니다.'))
    return false
  } else if (!standardManageField.CLOTHE_GUBUN) {
    Message.warn(t('피복구분은 필수값 입니다.'))
    return false
  } else if (!standardManageField.OFFI_RES_NM) {
    Message.warn(t('직책은 필수값 입니다.'))
    return false
  } else if (!standardManageField.CLOTHE_COUNT) {
    Message.warn(t('지급수량은 필수값 입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    OFFI_RES_NM: standardManageField.OFFI_RES_NM,
    CLOTHE_GUBUN: standardManageField.CLOTHE_GUBUN,
    USER_DIV: standardManageField.USER_DIV,
    CLOTHE_COUNT: standardManageField.CLOTHE_COUNT,
    REMARKS: standardManageField.REMARKS,
    USER_ID: userStore.userId,
    DIRECT_INPUT_YN: 'Y',
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'CLDAC0010_SAVE_01',
    list: saveParam,
  })
}

const afterSave = (res) => {
  emit('Saved')
  closePopup()
}

//저장관련 로직 끝

const openPopup2 = (data) => {}

onMounted(() => {
  initCodeList()
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
      <span>지급기준관리 추가</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
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
            <div class="d-flex mt-2">
              <i-select
                :label="$t('소속구분')"
                width="100px"
                required
                top-label
                item-title="TXT"
                item-value="COD"
                :items="codeList.USER_DIV"
                v-model="standardManageField.USER_DIV"
              >
              </i-select>
              <i-select
                :label="$t('피복구분')"
                width="150px"
                required
                top-label
                item-title="TXT"
                item-value="COD"
                :items="codeList.CLOTHE_GUBUN"
                v-model="standardManageField.CLOTHE_GUBUN"
              >
              </i-select>
              <i-input
                :label="$t('직책')"
                width="150px"
                required
                top-label
                v-model="standardManageField.OFFI_RES_NM"
              ></i-input>
              <i-select
                :label="$t('지급수량')"
                width="150px"
                required
                top-label
                :items="codeList.CLOTHE_COUNT"
                item-title="TXT"
                item-value="COD"
                v-model="standardManageField.CLOTHE_COUNT"
              ></i-select>
            </div>
            <div class="mt-2">
              <i-textarea :label="$t('비고')" top-label width="100%" v-model="standardManageField.REMARKS">
              </i-textarea>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
