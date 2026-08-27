<!--
  화면명 : 교육 일정 변경(팝업)
  화면개요 : 개인의 교육 일정을 변경할 수 있는 팝업이다.
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
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'

//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const emit = defineEmits([]) 
const popupData = reactive({
  DIVISION : '',          //구분
  CURR_ID : '',           //교육명
  MORGN_NM : '',          //주관부서
  EDUTIME_SERIAL : '',   //교육차수
  LEAD_TIME_DSCR : '',    //소요시간
  EPLACE_ETC : '',        //교육장소
  LECTURER_NM : '',       //강사
  EDUPOSSIBLE_NUM : '',   //가능인원
  EDU_COMENT : '',        //교육내용
  
  CMPNY_DIV : userStore.cmpnyDiv,  //회사구분
  YEAR : '',                        //년도
  SCHEDULE_ID : '',                 //스케줄 ID
  TARGET_ID : '',                   //이수자 ID
  USER_ID : userStore.userId,       //유저 ID

})

const codeList = reactive({
  division : [],      //구분
  currId : [],        //교육명
  asgnCd : [],        //부서
  eduTimeSerial : [], //교육차수
})

//코드리스트 셋팅
const initCodeList = data => {
  Promise.all([
    getCodeList('HHID010'), //구분
    commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : '' } }),//교육명
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
    commonSearchApi({ queryId : 'EDUAB0040_POP_01_SEARCH_01', param: data.selectRow })
  ]).then(res => {
    console.log("레스 확인",res)
    codeList.division = res[0].ORESULT_CUR
    codeList.currId = res[1].ORESULT_CUR
    codeList.asgnCd = res[2].ORESULT_CUR
    codeList.eduTimeSerial = res[3].ORESULT_CUR
  })
}

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup =  (data) => {
  initCodeList(data)
  dialog.value = true
  console.log("팝업오픈됨")
  console.log("넘어온 데이터 확인",data)
  
  popupData.DIVISION = data.selectRow.DIVISION
  popupData.CURR_ID = data.selectRow.CURR_ID
  popupData.MORGN_NM = data.selectRow.MORGN_NM
  popupData.EDUTIME_SERIAL = data.selectRow.EDUTIME_SERIAL
  popupData.LEAD_TIME_DSCR = data.selectRow.LEAD_TIME_DSCR
  popupData.EPLACE_ETC = data.selectRow.EPLACE_NM
  popupData.LECTURER_NM = data.selectRow.LECTURER_NM
  popupData.EDUPOSSIBLE_NUM = data.selectRow.EDUPOSSIBLE_NUM
  popupData.EDU_COMENT = data.selectRow.EDU_CONTENT
  popupData.YEAR = data.selectRow.YEAR
  popupData.SCHEDULE_ID = data.selectRow.SCHEDULE_ID
  popupData.TARGET_ID = data.selectRow.TARGET_ID
  console.log("팝01 서치01 파람",[data.selectRow])

}
const onPopButtonsClick = btn => {
  if(btn.id === 'btnChange'){
    new saveFlowHelper(vm, t)
      .setConfirmMessage('변경하시겠습니까?')
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id === 'btnClose'){
    dialog.value = false
    emit('pop01Close','')
  }
}

// const isNullCheck = val => {
//   return (val === undefined || val === null || val === '') ? true : false
// }
//************************************************이벤트 영역(종료)*********************************************************/
//***************************************************저장 영역*********************************************************/
const beforeSave = () => {
  console.log("저장할 데이터",popupData)
  return true
}

const saveData = () => {
  return commonExecuteApi({ queryId : 'EDUAB0040_SAVE_01', list: [popupData] })
}

const afterSave =() => {
  dialog.value = false
}
//************************************************저장 영역(종료)*********************************************************/

defineExpose({
  openPopup
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="550"
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
      <span>교육 일정 변경</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :title="$t('')"
          :button-list="['btnChange', 'btnClose']"
          @click-button="onPopButtonsClick"
        />
      </v-card-title>
      <!-- 상세 -->
      <div class="pa-2 d-flex flex-column fill-height">
        <v-sheet class="pl-4 searchArea flex-column">
          <div class="d-flex mb-2">
            <i-select
              :label="$t('구분')"
              topLabel
              v-model="popupData.DIVISION"
              :items="codeList.division"
              item-title="TXT"
              item-value="COD"
              width="500px"
              margin="0px"
              readonly
            />
          </div>
          <div class="d-flex mb-2">
            <i-select
              :label="$t('교육명')"
              topLabel
              v-model="popupData.CURR_ID"
              :items="codeList.currId"
              item-title="TXT"
              item-value="COD"
              width="500px"
              margin="0px"
              readonly
            />
          </div>
          <div class="d-flex mb-2">
            <i-input
              :label="$t('주관부서')"
              topLabel
              v-model="popupData.MORGN_NM"
              readonly
            />
          </div>
          <div class="d-flex mb-2">
            <i-select
              :label="$t('교육차수')"
              topLabel
              v-model="popupData.EDUTIME_SERIAL"
              :items="codeList.eduTimeSerial"
              item-title="TXT"
              item-value="COD"
              width="500px"
              margin="0px"
            />
          </div>
          <div class="d-flex mb-2">
            <i-input
              :label="$t('소요시간')"
              topLabel
              v-model="popupData.LEAD_TIME_DSCR"
              width="240px"
              readonly
            />
            <i-input
              :label="$t('교육장소')"
              topLabel
              v-model="popupData.EPLACE_ETC"
              width="240px"
              readonly
              />
          </div>
          <div class="d-flex mb-2">
            <i-input
              :label="$t('강사')"
              topLabel
              v-model="popupData.LECTURER_NM"
              readonly
            />
          </div>
          <div class="d-flex mb-2">
            <i-input
              :label="$t('가능인원')"
              topLabel
              v-model="popupData.EDUPOSSIBLE_NUM"
              width="480px"
              margin="2px"
              readonly
            />
            <v-sheet class="d-flex justify-end mt-5 align-center">
                명
            </v-sheet>
          </div>
          <div class="d-flex mb-2">
            <i-textarea
              :label="$t('교육내용')"
              topLabel
              v-model="popupData.EDU_COMENT"
              :readonly="true"
              row="3"
            />
          </div>
        </v-sheet>
      </div>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>