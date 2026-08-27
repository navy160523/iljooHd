<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

import { useUserStore } from '@hiway/stores/user'

const dialog = ref(null)
const fileUpload = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['Saved'])
const showValue = ref(true)
const codeList = reactive({
  //품명
  wareName: [],
  //구분1
  gubun1: [],
  //구분2
  gubun2: [],
  //납품업체
  vendSeq: [],
  USER_DIV: [], //조직구분
})

const cloddingField = reactive({
  CMPNY_DIV: '', //사업장구분
  CLOTHES_SEQ: '', //피복순번
  MODEL: '', //모델명
  USER_DIV: '', //조직구분
  WARE_NAME: '', //품명
  GUBUN1: '', //구분1(하복,동복)
  GUBUN2: '', //구분2
  USE: '', //용도
  VEND_SEQ: '', //납품업체
  COST: '', //단가
  FILE_ID: '', //사진 FILE_ID
  ORDER_NUM: '', //정렬순서
  DELETE_YN: 'N ', //삭제여부
  USER_ID: userStore.userId, //로그인유저 아이디
})

const initCodeList = () => {
  Promise.all([
    //품명
    getCodeList('HHIT010'),
    //구분(1)
    getCodeList('HHIT020'),
    //구분(2)
    getCodeList('HHIT030'),
    //납품업체
    getCodeList('HHIT040'),
    //조직구분
    getCodeList('HHIZ020'),
  ]).then((res) => {
    codeList.wareName = res[0].ORESULT_CUR
    codeList.gubun1 = res[1].ORESULT_CUR
    codeList.gubun2 = res[2].ORESULT_CUR
    codeList.vendSeq = res[3].ORESULT_CUR
    codeList.USER_DIV = res[4].ORESULT_CUR.filter((x) => !['Z', 'D'].includes(x.COD))
  })
}

const openPopup = () => {
  dialog.value = true
}

const closePopup = () => {
  for (let i in cloddingField) {
    cloddingField[i] = ''
  }
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const openFileUpload = () => {
  if (cloddingField.FILE_ID) {
    fileUpload.value.openPopup(cloddingField.FILE_ID)
  } else {
    fileUpload.value.openPopup()
  }
}

const uploaded = (val) => {
  if (!cloddingField.FILE_ID) {
    cloddingField.FILE_ID = val.fileId
  }
}

//저장관련 로직 시작
const beforeSave = () => {
  //필수값 품명,모델명,납품업체,합격번호,자재번호,단가
  if (!cloddingField.WARE_NAME) {
    Message.warn(t('품명은 필수값 입니다.'))
    return false
  } else if (!cloddingField.MODEL) {
    Message.warn(t('모델명은 필수값 입니다.'))
    return false
  } else if (!cloddingField.USER_DIV) {
    Message.warn(t('조직구분은 필수값 입니다.'))
    return false
  } else if (!cloddingField.VEND_SEQ) {
    Message.warn(t('납품업체는 필수값 입니다.'))
    return false
  } else if (!cloddingField.GUBUN1) {
    Message.warn(t('구분1은 필수값 입니다.'))
    return false
  } else if (!cloddingField.COST) {
    Message.warn(t('단가는 필수값 입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    CLOTHES_SEQ: cloddingField.CLOTHES_SEQ,
    MODEL: cloddingField.MODEL,
    USER_DIV: cloddingField.USER_DIV,
    WARE_NAME: cloddingField.WARE_NAME,
    USE: cloddingField.USE,
    GUBUN1: cloddingField.GUBUN1,
    GUBUN2: cloddingField.GUBUN2,
    VEND_SEQ: cloddingField.VEND_SEQ,
    COST: cloddingField.COST,
    FILE_ID: cloddingField.FILE_ID,
    ORDER_NUM: cloddingField.ORDER_NUM,
    DELETE_YN: 'N',
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'CLDAA0010_SAVE_01',
    list: saveParam,
  })
}

const afterSave = (res) => {
  emit('Saved')
  closePopup()
}

//저장관련 로직 끝

const openPopup2 = (data) => {
  dialog.value = true

  for (const [key, value] of Object.entries(data)) {
    if (cloddingField.hasOwnProperty(key)) {
      cloddingField[key] = value
    }
  }
}

onMounted(() => {
  initCodeList()
})

defineExpose({
  openPopup,
  openPopup2,
})

//SAFE CLOVER 선택시 조직구분 감춤
//SAFE CLOVER는 직영만
watch(
  () => cloddingField.WARE_NAME,
  (newValue, oldValue) => {
    //SAFE CLOVER 품명이 선택되면 조직구분 감추고 USER_DIV에 A넣음
    if (newValue === '4') {
      showValue.value = false
      cloddingField.USER_DIV = 'A'
    } else {
      showValue.value = true
    }
  }
)
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
      <span>피복 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
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
              <i-input :label="$t('피복순번')" v-model="cloddingField.CLOTHES_SEQ" width="100px" readonly top-label>
              </i-input>
              <i-select
                :label="$t('품명')"
                v-model="cloddingField.WARE_NAME"
                :items="codeList.wareName"
                item-title="TXT"
                item-value="COD"
                width="300px"
                required
                top-label
              >
              </i-select>
              <i-input :label="$t('모델명')" v-model="cloddingField.MODEL" width="300px" required top-label> </i-input>
              <i-select
                :label="$t('조직구분')"
                v-model="cloddingField.USER_DIV"
                :items="codeList.USER_DIV"
                width="100px"
                item-title="TXT"
                item-value="COD"
                v-show="showValue"
                required
                top-label
              >
              </i-select>
            </div>
            <div class="d-flex mt-2">
              <i-select
                :label="$t('납품업체')"
                :items="codeList.vendSeq"
                item-title="TXT"
                item-value="COD"
                width="200px"
                v-model="cloddingField.VEND_SEQ"
                required
                top-label
              >
              </i-select>
              <i-select
                :label="$t('구분1')"
                v-model="cloddingField.GUBUN1"
                :items="codeList.gubun1"
                item-title="TXT"
                item-value="COD"
                width="100px"
                required
                top-label
              >
              </i-select>
              <i-select
                v-model="cloddingField.GUBUN2"
                :label="$t('구분2')"
                :items="codeList.gubun2"
                item-title="TXT"
                item-value="COD"
                width="150px"
                top-label
              >
              </i-select>
            </div>
            <div class="d-flex mt-2">
              <i-input
                :label="$t('단가')"
                width="200px"
                top-label
                number
                maxlength="6"
                required
                v-model="cloddingField.COST"
              >
              </i-input>
              <i-input
                :label="$t('정렬순서')"
                width="100px"
                top-label
                number
                maxlength="2"
                v-model="cloddingField.ORDER_NUM"
              >
              </i-input>

              <v-btn class="mt-5" @click="openFileUpload">사진등록</v-btn>
            </div>
            <div class="mt-2">
              <i-textarea :label="$t('용도')" top-label v-model="cloddingField.USE"> </i-textarea>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <IUploadPopup ref="fileUpload" :img-only="true" @uploaded="uploaded"></IUploadPopup>
  </v-dialog>
</template>
