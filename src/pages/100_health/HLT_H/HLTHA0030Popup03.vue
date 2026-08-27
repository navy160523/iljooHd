<!--
  화면명 : 승인/반려
  화면개요 : 승인/반려
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, commonSendApi, getCodeList, commonRequest } from '@hiway/api/commonApi'
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
const content = ref(null)
const textMain = ref('')

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  YEAR: dayjs().get('year'),
  JOB_TIT_NM: '',
  REQ_DIV: '',
  REQ_DIV_NM: '',
  REQ_CHA: '',
  REQ_CHA_NM: '',
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  REQ_DT: '',
  REMARKS: '',
  EMAIL: '',
  STATUS: '',
})

const chipArr = reactive({
  TO_EMP: [],
  SENDER: [],
  REFERER: [],
})

// 메일전송
const mailParams = reactive({
  EMAIL: [],
  SENDER: [],
  REFERER: [],
  SUBJECT: '',
  CONTENT: '',
})

const codeList = reactive({
  YEAR:[],
  REQ_CHA: [
    { COD: '1', TXT: '상반기' },
    { COD: '2', TXT: '하반기' },
  ],
  REQ_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ]
})

// 팝업 OPEN
const openPopup = (param, status) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.YEAR = param.YEAR
  searchParams.JOB_TIT_NM = param.JOB_TIT_NM
  searchParams.EMP_NO = param.EMP_NO
  searchParams.EMP_NM = param.EMP_NM
  searchParams.REQ_DIV = param.REQ_DIV
  searchParams.REQ_CHA = param.REQ_CHA
  searchParams.EMAIL = param.EMAIL
  searchParams.REQ_DT = dayjs(param.REQ_DT).format('YYYY-MM-DD')
  searchParams.REQ_DIV_NM = codeList.REQ_DIV.find(item => item.COD == searchParams.REQ_DIV).TXT
  searchParams.REQ_CHA_NM = searchParams.REQ_DIV_NM === 'A' ? codeList.REQ_CHA.find(item => item.COD == searchParams.REQ_CHA).TXT : ''
  searchParams.STATUS = status
  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: i, TXT: i})
  }
  mailParams.EMAIL = []
  mailParams.REFERER = []
  chipArr.TO_EMP = []
  chipArr.SENDER = []
  chipArr.REFERER = []
  chipArr.TO_EMP.push({ EMP_NM: searchParams.EMP_NM, EMAIL: searchParams.EMAIL })
  mailParams.EMAIL.push(searchParams.EMAIL)
  chipArr.SENDER.push({ EMP_NM: userStore.empNm, EMAIL: userStore.email })

  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content.value.outerHTML, 'text/html')
    const textareas = doc.querySelectorAll('textarea')
    textareas.forEach((textarea) => {
      const pTag = document.createElement('p')
      pTag.textContent = textMain.value
      textarea.replaceWith(pTag)
    })
    let titleApproval = searchParams.STATUS == '5'? '반려' : '승인'
    let mailParam = {
      // EMAIL: ['BP24532@bp.hd.com'], 
      EMAIL: mailParams.EMAIL, // mailParams.EMAIL
      REFERER: [], // mailParams.REFERER
      SUBJECT: '안전화 '+ titleApproval + ' 안내- ' + searchParams.EMP_NM + '/' + searchParams.JOB_TIT_NM,
      CONTENT: doc.body.innerHTML
    }
    vm.$swal({
      title: t('메일 전송하시겠습니까?'),
      showCancelButton: true,
    }).then((ck) => {
      if (ck.isConfirmed === true) {
        commonSendApi(mailParam).then((res) => {
          searchParams.REMARKS = textMain.value
          if(searchParams.STATUS !== '5') {
            closePopup()
            Message.success(t('메일이 전송되었습니다.'))
          } else {
            commonExecuteApi({ queryId : 'HLTHA0030_SAVE_04', list: [ searchParams ] }).then(res => {
              closePopup()
              Message.success(t('메일이 전송되었습니다.'))
            })
          }
        })
      }
    })
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  textMain.value = ''
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
    height="800"
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
      <span>안전화 신청 - 승인/반려</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="true"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea flex-column mb-2">
          <ILabel :label="$t('수신')" :required="true">
            <template>
              <VTextField
                readonly
                class="setWhiteColor"
              >
                <v-chip
                  v-for="(item, i) in chipArr.TO_EMP"
                  :key="i"
                  class="ml-2"
                  size="small"
                  @click="chipDel(item.EMAIL)"
                >
                  {{ item.EMP_NM }}
                </v-chip>
              </VTextField>
            </template>
          </ILabel>
          <ILabel :label="$t('발신')" class="mt-2">
            <template>
              <VTextField
                readonly
                class="setWhiteColor"
              >
                <v-chip
                  v-for="(item, i) in chipArr.SENDER"
                  :key="i"
                  class="ml-2"
                  size="small"
                >
                  {{ item.EMP_NM }}
                </v-chip>
              </VTextField>
            </template>
          </ILabel>
        </v-sheet>
      </div>
      <div ref="content" class="pa-4 ml-4 mr-4 mb-4 cont">
        <div style="font-size:28px; color:black; text-align: center; font-weight: bold;"> [안전화 신청 {{ searchParams.STATUS == '5' ? '반려' : '승인' }} 안내]</div>
        <br>
        <div style="margin-left: 16px;">
          <div style="font-size:17px; color:rgb(23, 23, 23);"> 이름: {{ searchParams.EMP_NM }}</div>
          <div style="font-size:17px; color:rgb(23, 23, 23);"> 사번: {{ searchParams.EMP_NO }}</div>
          <div style="font-size:17px; color:rgb(23, 23, 23);"> 해당년도: {{ searchParams.YEAR }}</div>
          <div style="font-size:17px; color:rgb(23, 23, 23);"> 구분: {{ searchParams.REQ_DIV_NM }}</div>
          <div v-if="searchParams.REQ_DIV === 'A'" style="font-size:17px; color:rgb(23, 23, 23);"> 신청시기: {{ searchParams.REQ_CHA_NM }}</div>
          <div style="font-size:17px; color:rgb(23, 23, 23);"> 신청일자: {{ searchParams.REQ_DT }}</div>
          <div v-if="searchParams.STATUS == '5'" style="font-size:17px; color:rgb(23, 23, 23);"> 반려 사유</div>
          <div v-if="searchParams.STATUS == '5'">
            <textarea style="width:100%; height:120px; border: 2px solid #4645b9; padding:6px; border-radius: 0.5rem;" v-model="textMain"></textarea>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
::v-deep(.setWhiteColor > .v-input__control > .v-field) {
  background-color: #ffffff !important;
}

.cont {
  border: 2px solid rgb(117, 121, 208);
  border-radius: 0.5rem;
}
</style>
