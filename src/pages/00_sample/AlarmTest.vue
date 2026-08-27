<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import { commonExecuteApi, commonSendSMS, commonSendKakao } from '@hiway/api/commonApi'
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from '@hiway/utils/notify'

defineOptions({
  name: 'AlarmTest',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

//1.문자 전송
const sendSMSParams = reactive({
  EMPNO_FROM: '', //송신사번
  EMPNO_TO: '',   //수신사번 
  SYSCODE: '',    //시스템코드
  FROM_P_NO: '',  //송신전화번호
  TO_P_NO: '',    //수신전화번호
  TITLE: '',      //메시지 내용
})

//2.카카오 워크 알림 전송
const sendKakaoParams = reactive({
  RCV_SABUN: '', //수신사번(필수)
  SYSTYPE: '',   //시스템코드(700: 그룹웨어) 
  NOTICE_GBN: '',    //메시지 구분("K": 카카오워크)
  REQEMAIL: '',  //받는 이메일주소(default: NONE) 
  REQTEXT: '',    //알림 목록 메시지(단문TEXT)
  REQBLOCK: '',      //조합형 말풍선 메시지 전달(JSON)
})

const detailData = reactive({ 
  USER_ID: '',
  CMPNY_DIV: '',
  EMPNO_TO: '', 
  SYSCODE:  '156',
  FROM_P_NO: '',
  TO_P_NO: '',
  TITLE: '',
})

const saveSMS = () => {
  new saveFlowHelper(vm, t)
    .setQuery(saveData)
    .setAfter(sendSMS)
    .run()
}

const saveData = () => {
  let saveParam = []

  detailData.USER_ID = 'BP23040' //userStore.userId
  detailData.CMPNY_DIV = 'HHI'
  detailData.EMPNO_TO  = sendSMSParams.EMPNO_TO
  detailData.SYSCODE  = '156'
  detailData.FROM_P_NO  = '01086374717'
  detailData.TO_P_NO  = sendSMSParams.TO_P_NO
  detailData.TITLE  = sendSMSParams.TITLE

  console.log('Save SMS ==============>', sendSMSParams)
  console.log('Save SMS ===>', detailData)

  saveParam.push(detailData)

  return commonExecuteApi({ queryId: "NOTIFICATIONUTIL_SAVESMS", list: saveParam })
}

const sendSMS = () => {

  sendSMSParams.EMPNO_FROM = 'BP23040' //userStore.userId
  sendSMSParams.SYSCODE = '156'
  sendSMSParams.FROM_P_NO = '01086374717'

  console.log('Send SMS ===>', sendSMSParams)

  return commonSendSMS(sendSMSParams).finally( () => {
    Message.success('SMS 발송완료')
  })
}

const sendKakao = () => {
  alert('KAKAO : ' + sendKakaoParams.RCV_SABUN)

  if(sendKakaoParams.RCV_SABUN == '')
  {
    Message.warn('수신 사번 필수입력')
  }

  sendKakaoParams.SYSTYPE = '700'
  sendKakaoParams.NOTICE_GBN = 'K'
  sendKakaoParams.REQBLOCK = ''

  console.log('Send KAKAO ===>', sendKakaoParams.TITLE)

  return commonSendKakao(sendKakaoParams).finally( () => {
    Message.success('KAKAO 발송완료')
  })
}
</script>

<template>
  <label>수신사번: <input v-model="sendSMSParams.EMPNO_TO"></label>
  <label>수신번호: <input v-model="sendSMSParams.TO_P_NO"></label>
  <label>메시지: <input v-model="sendSMSParams.TITLE"></label>
  <div class="buttons">
    <v-btn @click="saveSMS">문자 보내기</v-btn>
  </div>
  <label>수신사번(필수): <input v-model="sendKakaoParams.RCV_SABUN"></label>
  <label>받는 이메일주소(default: NONE): <input v-model="sendKakaoParams.REQEMAIL"></label>
  <label>알림 목록 메시지: <input v-model="sendKakaoParams.REQTEXT"></label>
  <div class="buttons">
    <v-btn @click="sendKakao">카카오워크 보내기</v-btn>
  </div>
</template>