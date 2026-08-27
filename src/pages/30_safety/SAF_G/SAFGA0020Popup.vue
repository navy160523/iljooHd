<!-- SAFGA0020Popup 나의 안전다짐 실천서약 팝업-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from "@hiway/stores/user"
import IMenuTitle from "@/components/IMenuTitle.vue"
import {commonExecuteApi} from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import {startDragging,handleDragging,stopDragging} from "@/utils/useDrag.js"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from "dayjs"
import Message from '@hiway/utils/notify'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(null)
const empPopup = ref(null)
const emit = defineEmits(["closed"])

const props = defineProps({
  codeList: {
    Type: Array,
    default: [],
  },
})

const typeList = reactive([
  {COD: 'A' , TXT: '관리감독자'},
  {COD: 'B' , TXT: '작업자'},
  {COD: 'C' , TXT: '설계사무직'},
  {COD: 'D' , TXT: '경영지원사무직'},
])

const saveParams = reactive({
  CMPNY_DIV: null,
  ASGN_NM: null,            // 소속
  SEQ: '1',
  EMP_NM: null,             // 이름
  EMP_NO: null,             // 사번
  YEAR: null,               // 년도
  USER_TYPE: null,          // 구분
  DESC1: null,              // 내용1
  DESC2: null,              // 내용2
  DESC3: null,              // 내용3
})

/* **************** 팝업 오픈 **************** */
const openPopup = () => {
  for(let i in saveParams){
    if(i === 'SEQ'){
      saveParams[i] = '1'
    }else if(i === 'USER_TYPE') {
      saveParams[i] = 'A'
    }else if(i === 'YEAR') {
      saveParams[i] = dayjs().year()
    }else {
      saveParams[i] = null
    }
  }
  dialog.value = true
}

/* **************** 버튼 클릭 **************** */
const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {
    save()   
  }else {
    onClose()
  }
}

const save = () => {
  if(!saveParams.EMP_NO){
    return Message.warn(t('작성자는 필수 입니다.'))
  }else if(!saveParams.USER_TYPE){
    return Message.warn(t('서약서종류는 필수 입니다.'))
  }else if(!saveParams.DESC1){
    return Message.warn(t('내용1 은 필수 입니다.'))
  }else if(!saveParams.DESC2){
    return Message.warn(t('내용2 은 필수 입니다.'))
  }else if(!saveParams.DESC3){
    return Message.warn(t('내용3 은 필수 입니다.'))
  }

  commonExecuteApi({ queryId : 'SAFGA0020_SAVE_01', list: [saveParams] })
}

const onClose = () => {
  dialog.value = false
  emit("closed")
}

const empPopupOpen = () => {
  empPopup.value.openPopup({
      EMP_NM: saveParams.EMP_NM
    })
}

const selectedEmp = val => {
  if(val) {
    saveParams.EMP_NM = val.EMP_NM
    saveParams.EMP_NO = val.EMP_NO
    saveParams.ASGN_NM = val.ASGN_NM
    saveParams.CMPNY_DIV = val.CMPNY_DIV
  }
}

onMounted(() => {

})

defineExpose({
  openPopup,
})
</script>
<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="1000"
    height="530"
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
      <span>나의 안전다짐 실천 서약</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-2">
        <IMenuTitle
          :use-permission="false"
          :button-list="['btnUpdate','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 mt-2 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                :label="$t('년도')"
                topLabel
                v-model="saveParams.YEAR"
                width="100px"
                class="ml-0"
                readonly
              />
              <i-input
                :label="$t('작성자')"
                topLabel
                v-model="saveParams.EMP_NM"
                width="140px"
                class="mr-0"
                append-inner-icon="mdi-magnify"
                @click:appendInner="empPopupOpen"
                @keydown.enter="empPopupOpen"
                @input="() => { saveParams.EMP_NO = null}"
                required
              />
              <i-input
                topLabel
                v-model="saveParams.EMP_NO"
                width="110px"
                class="ml-0"
                readonly
              />
              <i-input
                :label="$t('소속')"
                topLabel
                v-model="saveParams.ASGN_NM"
                width="340px"
                readonly
              />
              <i-select
                :label="$t('서약서종류')"
                topLabel
                v-model="saveParams.USER_TYPE"
                :items="typeList"
                width="190px"
                item-value="COD"
                item-title="TXT"
                required
              />
            </div>
            <div>
              <i-textarea
                :label="$t('내용1')"
                v-model="saveParams.DESC1"
                width="100%"
                class="mt-3"
                :row="3"
                required
              />
              <i-textarea
                :label="$t('내용2')"
                v-model="saveParams.DESC2"
                width="100%"
                class="mt-3"
                :row="3"
                required
              />
              <i-textarea
                :label="$t('내용3')"
                v-model="saveParams.DESC3"
                width="100%"
                class="mt-3"
                :row="3"
                required
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <EmpPopup ref="empPopup" @selected ="selectedEmp" />
</template>
<style lang="scss" scoped>

</style>