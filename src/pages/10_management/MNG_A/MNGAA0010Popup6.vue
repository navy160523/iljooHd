<!--
  화면명 : MNGAA0010Popup6.vue
  화면개요 :HSE 경영시스템 모니터링 -> 전송 내용 작성 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, getCompanyList, commonSendSMS, commonSendApi } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
let sendType = ref('')

const chgDisable = reactive({
  TITLE: false,
  HEIGHT_SIZE : 560
})

const sendParams = reactive({
  FROM : '',
  TO : '',
  TO_ARR : [],
  TITLE : '',
  CONTENT : '',
})

const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: false } },
  keys : ['COL01'],
  field: [
    { fieldName: "ASGN_CD", dataType: "text", width: '50', styleName: "left-column", editable: false, header: { text: t("코드") } },
    { fieldName: "ASGN_NM", dataType: "text", editable: false, header: { text: t("소속") } },
    { fieldName: "EMP_NO", dataType: "text", width: '50', editable: false, header: { text: t("사번") } },
    { fieldName: "KOR_NM", dataType: "text", width: '50', editable: false, header: { text: t("성명") } },
    { fieldName: "JOB_TIT_NM", dataType: "text", width: '50', editable: false, header: { text: t("직위") } },
    { fieldName: "EMAIL", dataType: "text", width: '70', editable: false, header: { text: t("메일주소") } },
    { fieldName: "RES_NM", dataType: "text", width: '50', editable: false, header: { text: t("구분") } },
    { fieldName: "TEL_NO", dataType: "text", width: '50', editable: false, header: { text: t("사내전화") } },

  ],
  columns: [],
  columnLayout: [
    {
      name: '소속',
      direction: 'horizontal',
      items: [
        'ASGN_CD',
        'ASGN_NM',
      ],
    },
    'EMP_NO',
    'KOR_NM',
    'JOB_TIT_NM',
    'EMAIL',
    'RES_NM',
    'TEL_NO',
  ]
})

grdMainProps.columns = grdMainProps.field

const openPopup = (type, sendParam, columnData, year) => {

  sendType = type
  if(type === 'MAIL'){
    
    sendParams.TITLE = '[알림] HSE 경영시스템 모니터링'
    sendParams.CONTENT = columnData+' 작성이 완료되지 않았습니다. \r\n확인 후 작성 및 결재 바랍니다. \r\n부서/협력사 : '+sendParam[0].ASGN_NM+'\r\n년도 : '+year
    sendParam.forEach( (val, index) => {
      sendParams.TO_ARR.push(val.EMAIL)
      sendParams.TO += ('\''+val.EMAIL+'\'')

      if(sendParam.length-1 != index ){
        sendParams.TO += ','
      }
    })
    sendParams.FROM = userStore.email
    chgDisable.TITLE = true
    chgDisable.HEIGHT_SIZE = 560
  }
  else if(type === 'SMS'){
    byte.value = 0
    sendParam.forEach( (val, index) => {
      sendParams.TO_ARR.push(val.EMP_NO)
      // if(sendParam.length-1 != index ){
      //   sendParams.TO_ARR+=','
      // }
    })
    
    sendParams.FROM = userStore.empNo
    chgDisable.TITLE = false
    chgDisable.HEIGHT_SIZE = 515
  }
  
  dialog.value = true  
}

//초기 데이터셋팅
// onMounted(() => {
//   window.addEventListener("mousemove", mouseUpdate)
// })

const countBytes = (str) => {
  let count = 0;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode <= 0x007F) {
            count += 1; // ASCII 문자
        } else if (charCode <= 0x07FF) {
            count += 2; // 2바이트 문자
        } else if (charCode <= 0xFFFF) {
            count += 3; // 3바이트 문자
        } else {
            count += 4; // 4바이트 문자 (유니코드 서로소 범위)
        }
    }
    return count;
}

let byte = ref(0)

const CheckByte = e => {
  const text = e.target.value
  const byteCount = countBytes(text)
  byte.value = byteCount

  if (byteCount > 80) {
      Message.err('문자열이 80 Byte 를 초과합니다.')
      sendParams.CONTENT = sendParams.CONTENT.substring(0, sendParams.CONTENT.length - 1)
  } 
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if(btn.id === "btnSendNormal"){
    if(sendType === 'MAIL') sendMail()
    else if(sendType === 'SMS') sendSMS()
    
    
  } else if (btn.id === "btnClose") {
    onClose()
  }
}

const sendMail = () => {
  /* ******************** 메일 SET ******************* */
  const mailParams = reactive({
    EMAIL: sendParams.TO_ARR, 
    SUBJECT: '',
    CONTENT: ''
  })

  let url = 'http://10.100.45.205:49220/#/'

  mailParams.SUBJECT = sendParams.TITLE
  mailParams.CONTENT = `
  <!doctype html>
    <html>
      <head>
        <meta charset='utf-8'>
      </head>
      <body>`
        + `${sendParams.CONTENT}` +
       `</body>
    </html>`

    commonSendApi(mailParams).then(() => {
      Message.success(t('메일 전송 완료'))
      onClose()
    })
}

const sendSMS = () => {
  // sendParams.TO_ARR = sendParams.TO_ARR.indexOf(',') != -1 ? sendParams.TO_ARR : sendParams.TO_ARR.split(',') 
    sendParams.TO_ARR.forEach(e => {
      let sendSMSParams = {
        EMPNO_FROM : sendParams.FROM,
        EMPNO_TO : emit,
        SYSCODE : '156',
        FROM_P_NO : userStore.hndPhn,
        TO_P_NO : '',
        TITLE : sendParams.CONTENT
      }
      commonSearchApi({ 
        queryId: "searchEMP", 
        param: {
          CMPNY_DIV: 'HHI',
          EMP_NO: e,
          FLAG:'N',
        } 
      }).then( res => {
        if(res.ORESULT_CUR.length<1){
          Message.err('저장된 전화번호가 없습니다.')
          return
        }
        sendSMSParams.TO_P_NO = res.ORESULT_CUR[0].HND_PHN
        commonSendSMS(sendSMSParams).then(() => {
          Message.success(t('메시지 전송 완료'))
          onClose()
        })
      })
      
    })
}

const onClose = () => {
  clearField()
  dialog.value = false
}

const clearField = () => {
  sendParams.FROM = ''
  sendParams.TO = ''
  sendParams.TO_ARR = []
  sendParams.TITLE = ''
  sendParams.CONTENT = ''

}

defineExpose({
  openPopup,
})

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  // let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="500"
    :height="chgDisable.HEIGHT_SIZE"
    class="p-absolute user-select-none draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>전송 내용 작성 팝업</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSendNormal', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div>
              <i-input
                :label="$t('From')"
                label-width="40px"
                v-model="sendParams.FROM"
                width="440px"
                type="text"
                readonly
                />
            </div>

            <div>
              <i-input
                :label="$t('To')"
                label-width="40px"
                v-model="sendParams.TO_ARR"
                class="mt-2"
                readonly
                width="440px"
                type="text"
                />
            </div>

            <div>
              <i-input
                :label="$t('제목')"
                label-width="40px"
                v-model="sendParams.TITLE"
                v-if="chgDisable.TITLE" 
                class="mt-2"
                width="440px"
                type="text"
                />
            </div>

            <div>
              <i-textarea
                :label="$t('내용')"
                width="440px"
                v-model="sendParams.CONTENT"
                class="mt-2"
                row="11"
                @input="CheckByte"
                />
            </div>
            <div v-if="sendType === 'SMS'" class="d-flex justify-end">
              <p>{{ byte }}/80 byte</p>
            </div>
          </v-sheet>

        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.radio {
  border-radius: 3px;
  padding-top: 2px;
  padding-bottom: 2px;
  border: 1px solid #E4E4E4;
  background-color: white;
}
</style>