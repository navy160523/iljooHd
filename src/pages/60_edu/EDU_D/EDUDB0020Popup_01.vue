<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi, commonGetEarnYN, commonExchangePayPoint, commonReconcilePayPoint} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
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
const emit = defineEmits(['saved']) 
const saveYn = ref(false)

const reconcile_param = ref('2024-06-12/1/500')
const concileinfo = ref('-')

const popupData = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs(new Date).format('YYYY'), // 년도
  MNTH : dayjs(new Date).format('MM'), // 월
  EMP_NO : '', // 사번
  BSNS_CD : userStore.bsnsCd,              //사업부
  DEPT_CD : userStore.deptCd,              //부서코드
  ASGN_CD : userStore.asgnCd,             //소속코드
  ASGN_NAME : userStore.asgnFullNm,             //소속조직명(직영조직명,협력사명)
  EMP_NAME : '', // 성명
  ORGN_DIV : userStore.userDiv,             //소속구분 (A : 직영, B : 협력사)
  CHANGE_POINT : 0, // 전환포인트
  CHANGE_POINT_NM : '', // 화면에 표시용 전환 포인트
  CHANGE_USER_IP : userStore.clientIp, // 전환 IP
  INSERT_USER_ID : userStore.userId, //등록자
  TOTAL_POINT : 0, //포인트
  TOTAL_POINT_NM : '', //포인트
  KAKAOPAY_OK  : 'UN', 
})

//*************************************************세팅 영역(종료)*********************************************************/




//***************************************************이벤트 영역*********************************************************/
const openPopup =  (data) => {
  dialog.value = true
  // console.log("팝업오픈됨")
  // console.log("넘어온 데이터 확인",data)
  // console.log("popupData : ",popupData)
  
  popupData.EMP_NO = data.EMP_NO
  popupData.EMP_NAME = data.EMP_NAME
  popupData.TOTAL_POINT =  data.TOTAL_POINT
  popupData.TOTAL_POINT_NM = data.TOTAL_POINT_NM
  popupData.CHANGE_POINT = null  // 전환포인트
  popupData.CHANGE_POINT_NM = '' // 화면에 표시용 전환 포인트
  saveYn.value = false
}


const onPopButtonsClick = btn => {
  if(btn.id === 'btnPointChange'){
    new saveFlowHelper(vm, t)
      .setConfirmMessage('전환하시겠습니까?')
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id === 'btnClose'){
   dialog.value = false
   emit("saved", saveYn.value)
  }

}

const reconcile = () => {
  concileinfo.value = 'reconcile started!'

  const param = {}
  param.target_date  = reconcile_param.value.split('/')[0]
  param.page  = reconcile_param.value.split('/')[1]
  param.size  = reconcile_param.value.split('/')[2]
  console.log("reconcile: ", param)

  commonReconcilePayPoint(param).then((res)=>{
      console.log("ReconcilePayPoint res: ", res)
      concileinfo.value = res
  })

}  



// const isNullCheck = val => {
//   return (val === undefined || val === null || val === '') ? true : false
// }
//************************************************이벤트 영역(종료)*********************************************************/
//***************************************************저장 영역*********************************************************/
const beforeSave = () => {
  console.log("저장할 데이터",popupData)
  if(popupData.CHANGE_POINT <= 0){
      Message.warn(t('1 포인트 이상 가능 합니다.'))
      return false
  }
  else if(popupData.CHANGE_POINT >= 50000){
      Message.warn(t('한 번에 50000 포인트 미만의 금액만 전환 가능 합니다.'))
      return false
  }
  else if(popupData.CHANGE_POINT > popupData.TOTAL_POINT){
    Message.warn(t('전환신청 포인트가 전환가능 포인트를 넘을수는 없습니다.'))
    return false
  }
  else{
    return true
  }
}

const saveData = async() => {



  // < 1 > 먼저 입출 기록 TABLE에 저장(INSERT TABLE): KAKAOPAY_OK 행은 UN으로 저장
  await commonExecuteApi({ queryId : 'EDUDB0020_TAB01_POP01_SAVE_01', list: [popupData] })
  console.log("< 1 >  성공 ")


  // < 2 > 입출 기록 TABLE에 해당인원의 마지막 SEQ 기반으로 REQUEST ID 를 만들기 
  // IN_CMPNY_DIV || IN_EMP_NO || TO_CHAR(V_POINT_SEQ) || V_ACCUMULATED_CONTENT_CD   
  let res  = await commonSearchApi({ queryId : 'EDUDB0020_GET_REQUEST_ID', param :  {CMPNY_DIV : 'HHI', EMP_NO: 'A526166'}})
  let request_id = res.ORESULT_CUR[0].REQUEST_ID

  const param2 = {}
  param2.PhoneNumber = userStore.hndPhn   // 운영시 로그인자로 수정 예정
  //param2.BirthDate = userStore.bi        // 운영시 로그인자로 수정 예정
  param2.Name = userStore.               // 운영시 로그인자로 수정 예정
  param2.request_id = request_id
  param2.amount = Number(popupData.CHANGE_POINT_NM.replace(/,/g, ""))
  

  // < 3 > ACCUMULATED_CONTENT_CD = '90' 인지 확인 //
  if ( res.ORESULT_CUR[0].ACCUMULATED_CONTENT_CD == '90' & res.ORESULT_CUR[0].POINT_SEQ > 0 ){

      // < 4 > 카카오페이포인트 전환 API 요청
      console.log("< 4 >  param2 ", param2)
      let res2 = await commonExchangePayPoint(param2)
      console.log("< 5 >  res2 ", res2)

      // < 5 > 입출 기록 TABLE에 완료 처리 (UPDATE TABLE)
      // 코드 값에 따라서 어떻게 처리할지 달라짐
      const param3 = {}
      param3.CMPNY_DIV = request_id.split('_')[0]
      param3.EMP_NO = request_id.split('_')[1]
      param3.POINT_SEQ = request_id.split('_')[2]
      await commonExecuteApi({ queryId : 'EDUDB0020_TAB01_POP01_KAKAKO_UPDATE', list: [param3] })


    }
    else {
      Message.warn('[적립실패] 한민규 매니저(T2-2681)에게 문의해주세요.')
      return false
    }

  return commonSearchApi({ queryId : 'EDUDB0020_GET_REQUEST_ID', param :  {CMPNY_DIV : 'HHI', EMP_NO: 'A526166'}})
}


const afterSave =() => {
  popupData.TOTAL_POINT = popupData.TOTAL_POINT - popupData.CHANGE_POINT
  popupData.TOTAL_POINT_NM = popupData.TOTAL_POINT.toLocaleString("en-US")
  popupData.CHANGE_POINT = null
  popupData.CHANGE_POINT_NM = ''
  dialog.value = true
  saveYn.value = true
  
  onPopButtonsClick({ id: 'btnClose' })
}


//************************************************저장 영역(종료)*********************************************************/
const formatInput = () =>{
  // 입력된 값을 숫자로 파싱하고 천 단위 콤마 추가

  popupData.CHANGE_POINT = parseFloat(popupData.CHANGE_POINT_NM.replace(/,/g, "")) || 0
  popupData.CHANGE_POINT_NM = popupData.CHANGE_POINT.toLocaleString("en-US")

  console.log("console.log(popupData.CHANGE_POINT): ", popupData.CHANGE_POINT)

  if(popupData.CHANGE_POINT > popupData.TOTAL_POINT){
    //console.log("넘었따")
    Message.warn(t('전환신청 포인트가 전환가능 포인트를 넘을수는 없습니다.\r\n전환신청 포인트가 전환가능 포인트로 세팅 됩니다.'))
    popupData.CHANGE_POINT = popupData.TOTAL_POINT
    popupData.CHANGE_POINT_NM = popupData.TOTAL_POINT_NM
  }
}


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
      <span>포인트 전환</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :title="$t('')"
          :button-list="['btnPointChange', 'btnClose']"
          @click-button="onPopButtonsClick"
        />
      </v-card-title>
      <!-- 상세 -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex mb-2">
            <i-input
              :label="$t('성명')"
              topLabel
              v-model="popupData.EMP_NAME"
              readonly
            />
          </div>
          <div class="d-flex mb-2">
            <i-input
              :label="$t('전환가능 포인트')"
              topLabel
              v-model="popupData.TOTAL_POINT_NM"
              reverse
              readonly
            />
          </div>
          <div class="d-flex mb-2">
            <i-input
              :label="$t('전환신청 포인트')"
              topLabel
              reverse
              v-model="popupData.CHANGE_POINT_NM"
              @input="formatInput"
            />
          </div>
          <hr>
          <hr>
          <div class="d-flex mb-2">
            <i-input
              :label="$t('기준일/page/size')"
              topLabel
              reverse
              v-model="reconcile_param"
            />
          </div>


          <div class="d-flex mb-2">
            <v-btn 
              @click = "reconcile">
              정산대사 결과
            </v-btn>
          </div>

          <div class="d-flex mb-2">
            <i-input
              :label="$t('정산대사 결과')"
              topLabel
              reverse
              v-model="concileinfo"
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