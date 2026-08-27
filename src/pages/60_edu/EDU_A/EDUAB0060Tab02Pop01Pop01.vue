<!--
  화면명 : 반려사유 팝업
  화면개요 : 해당 수강신청에 반려 및 반려사유를 작성하는 팝업이다.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'

//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const popupButtons = ref(null)
const emit = defineEmits(['execute']) 
let REQ_LIST = ref('교육대상자 목록(총 0명)')
let _Parameters = null
let readOnlyYn = ref(false)
const popupData = reactive({
  REQ_ORGN_CD : '', //신청부서
  RET_CONTENT : '', //반려사유
})

const codeList = reactive({
  reqOrgnCd : []
})

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = data => {
  console.log("데이터 확인",data)
  popupData.REQ_ORGN_CD = ''
  popupData.RET_CONTENT = ''
  _Parameters = data
  let searchParams = {
    CMPNY_DIV : data.CMPNY_DIV,
    YEAR : data.YEAR,
    REQ_ID : data.REQ_IDes
  }
  commonSearchApi({ queryId : 'EDUAB0060_TAB02_POP01_POP01_SEARCH_02', param : searchParams }).then(res => {
    console.log("조회 레스 확인",res)
    codeList.reqOrgnCd = []
    codeList.reqOrgnCd.push({COD : res.ORESULT_CUR[0].REQ_ID, TXT : res.ORESULT_CUR[0].REQ_ORGN_NM})
    popupData.REQ_ORGN_CD = searchParams.REQ_ID
  })
  readOnlyYn.value = data.READONLY_YN
  popupButtons.value.disableBtn("btnChk", data.READONLY_YN)
  dialog.value = true
}

const onPopButtonsClick = async btn => {
  if(btn.id === 'btnChk'){
    btnChk()
  }
  else if(btn.id === 'btnClose'){
    dialog.value = false
  }
}

//확인 버튼 클릭 이벤트
const btnChk = () => { 
  let saveParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    REQ_ID : popupData.REQ_ORGN_CD,
    RET_CONTENT : popupData.RET_CONTENT,
    RET_DATE : dayjs(new Date()).format('YYYYMMDD'),
    USER_ID : userStore.empNo,
  }
  console.log("세이브 파람 확인",saveParams)
  commonExecuteApi({ queryId : 'EDUAB0060_TAB02_POP01_POP01_SAVE_01', list: [saveParams] }).then(res => {
    Message.success(t('반려 되었습니다.'))
    emit('execute', 'T', [saveParams])
    dialog.value = false
  })
}

//널 체크 이벤트
const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}
//************************************************이벤트 영역(종료)*********************************************************/

defineExpose({
  openPopup
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    width="600"
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>반려사유</span>
    </v-sheet>
    <v-card class="pa-2 fill-height rounded-b-5">
      <v-card-title class="pa-0 d-flex" style="justify-content: space-between;">
        <i-select
            :label="$t('신청부서')"
            labelWidth="52px"
            width="300px"
            v-model="popupData.REQ_ORGN_CD"
            :items="codeList.reqOrgnCd"
            :readonly="readOnlyYn"
            item-title="TXT"
            item-value="COD"
          />
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :title="$t('')"
          :button-list="['btnChk', 'btnClose']"
          @click-button="onPopButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-0 pt-0 content-area">
        <v-sheet class="d-flex">
          <VTextarea
            placeholder="반려사유를 작성해 주세요."
            v-model="popupData.RET_CONTENT"
            :readonly="readOnlyYn"
            maxlength="3000"
            counter="3000"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (830px - 12px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>