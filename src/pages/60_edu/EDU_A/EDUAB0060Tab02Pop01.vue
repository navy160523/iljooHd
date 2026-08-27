<!--
  화면명 : 자율수강신청 접수처리 팝업
  화면개요 : 해당 수강신청에 대해 승인, 승인취소, 반려, 반려취소를 할 수 있는 화면이다.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendSMS, commonSendApi } from '@hiway/api/commonApi'
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
import EDUAB0060Tab02Pop01Pop01 from '@/pages/60_edu/EDU_A/EDUAB0060Tab02Pop01Pop01.vue'
import IUpload from "@/components/IUpload.vue"


//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const popupButtons = ref(null)
const emit = defineEmits(['close']) 
let REQ_LIST = ref('교육대상자 목록(총 0명)')
let _Parameters = null
const fileUpload = ref(null)
const eDUAB0060Tab02Pop01Pop01 = ref(null)
const popupData = reactive({
  CURR_NM : '',             //교육명
  PERSON_CNT : '',          //정원/승인인원/잔여
  EDU_DATE_FROM : '',       //교육기간(시작)
  EDU_DATE_TO : '',         //교육기간(종료)
  REQ_STATUS_NM : '',       //진행상태
  RET_CONTENT : '',         //반려사유
  REQ_ORGN_NM : '',         //신청조직
  REQ_NM : '',              //신청자
  REQ_TEL : '',             //신청자 전화번호
})



//자율수강신청 접수처리
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    { fieldName: 'ORGN_NM', dataType: 'text', width:'200', header: { text: t('소속') }, styleName: "left-column", editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('아이디') }, editable: false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable: false },
    { fieldName: 'INSERT_USER_NM', dataType: 'text', width:'150', header: { text: t('등록자') }, editable: false },
    { fieldName: 'INSERT_USER_TEL', dataType: 'text', header: { text: t('연락처') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') }, editable: false, visible: false },
    { fieldName: 'ORGN_CD', dataType: 'text', header: { text: t('소속코드') }, editable: false, visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', header: { text: t('직책코드') }, editable: false, visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('직위코드') }, editable: false, visible: false },
    { fieldName: 'REQ_ID', dataType: 'text', header: { text: t('신청순번') }, editable: false, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : '' } }),//교육명
  ]).then(res => {
    console.log("레스 확인",res)
  })
}

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = data => {
  console.log("데이터 확인",data)
  Object.keys(popupData).forEach(key => {
    popupData[key] = ''
  })
  popupData.CURR_NM = data.cd.CURR_NM
  popupData.PERSON_CNT = data.cd.EDUPOSSIBLE_NUM + '/' + data.cd.ALL_APPRO_NUM + '/' + (data.cd.EDUPOSSIBLE_NUM - data.cd.ALL_APPRO_NUM)
  popupData.EDU_DATE_FROM = data.cd.EDU_DATE_FROM
  popupData.EDU_DATE_TO = data.cd.EDU_DATE_TO
  popupData.REQ_STATUS_NM = data.cd.REQ_STATUS_NM
  popupData.RET_CONTENT = data.cd.RET_CONTENT
  popupData.REQ_ORGN_NM = data.cd.REQ_ORGN_NM
  popupData.REQ_NM = data.cd.REQ_NM
  popupData.REQ_TEL = data.cd.REQ_TEL
  //initCodeList()
  if(!isNullCheck(data.cd.REQ_ID)){
    searchReqList(data.cd)

    let searchParams = {
      CMPNY_DIV : data.cd.CMPNY_DIV,
      YEAR : data.cd.YEAR,
      REQ_ID : data.cd.REQ_ID
    }
    commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SEARCH_01', param : searchParams }).then(res => {
      
      data.cd.ATTACH_KEY = res.ORESULT_CUR.length === 0 ? '' : res.ORESULT_CUR[0].ATTACH_KEY
      console.log('data.cd.ATTACH_KEY',data.cd.ATTACH_KEY)
      if(data.cd.ATTACH_KEY !== ''){
        console.log('파일 존재')
        fileUpload.value.setGuid(data.cd.ATTACH_KEY)
        fileUpload.value.onButtonsClick({ id: "btnSearch" })
      }else{
        fileUpload.value.setGuid()
      }
    })
    
    _Parameters = data.cd
    console.log("_Parameters 확인",_Parameters)
  }
  setButtons()

  dialog.value = true
}

//실제 테스트 시 주석 해제해야함$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
const setButtons = () => {
  console.log("파라미터 스테이터스",_Parameters.REQ_STATUS)
  popupButtons.value.disableBtn("btnApprove", true)        //승인
  popupButtons.value.disableBtn("btnApproveCancel", true)  //승인취소
  popupButtons.value.disableBtn("btnReject", true)         //반려
  popupButtons.value.disableBtn("btnRejectCancel", true)   //반려취소

  if(_Parameters.REQ_STATUS === 'R'){
    popupButtons.value.disableBtn("btnApprove", false)        //승인
    popupButtons.value.disableBtn("btnReject", false)         //반려
  }
  else if(_Parameters.REQ_STATUS === 'A'){
    popupButtons.value.disableBtn("btnApproveCancel", false)  //승인취소
  }
  else if(_Parameters.REQ_STATUS === 'T'){
    popupButtons.value.disableBtn("btnRejectCancel", false)   //반려취소
  }
  else{
    popupButtons.value.disableBtn("btnApprove", true)        //승인
    popupButtons.value.disableBtn("btnApproveCancel", true)  //승인취소
    popupButtons.value.disableBtn("btnReject", true)         //반려
    popupButtons.value.disableBtn("btnRejectCancel", true)   //반려취소
  }
}

const onPopButtonsClick = async btn => {
  if(btn.id === 'btnApprove'){
    if(popupData.REQ_STATUS_NM !== '승인대기'){
      Message.err(t('진행상태가 승인대기일 경우에만 승인 가능합니다.'))
      return
    }
    let ck = ''
    ck = await vm.$swal({ 
    title: t('승인 하시겠습니까?'), 
    showCancelButton: true,
    })
    if(ck.isConfirmed === false){
      return
    }else{
      btnApprove()
    }
  }else if(btn.id === 'btnApproveCancel'){
    if(popupData.REQ_STATUS_NM !== '승인'){
      Message.err(t('진행상태가 승인일 경우에만 승인취소 가능합니다.'))
      return
    }
    let ck = ''
    ck = await vm.$swal({ 
    title: t('승인취소 하시겠습니까?'), 
    showCancelButton: true,
    })
    if(ck.isConfirmed === false){
      return
    }else{
      btnApproveCancel()
    }
  }else if(btn.id === 'btnReject'){
    if(popupData.REQ_STATUS_NM !== '승인대기'){
      Message.err(t('진행상태가 승인대기일 경우에만 반려 가능합니다.'))
      return
    }
    let ck = ''
    ck = await vm.$swal({ 
    title: t('반려 하시겠습니까?'), 
    showCancelButton: true,
    })
    if(ck.isConfirmed === false){
      return
    }else{
      btnReject()
    }
  }else if (btn.id === 'btnRejectCancel'){
    if(popupData.REQ_STATUS_NM !== '반려'){
      Message.err(t('진행상태가 반려일 경우에만 반려 가능합니다.'))
      return
    }
    let ck = ''
    ck = await vm.$swal({ 
    title: t('반려취소 하시겠습니까?'), 
    showCancelButton: true,
    })
    if(ck.isConfirmed === false){
      return
    }else{
      btnRejectCancel()
    }
  }
  else if(btn.id === 'btnClose'){
    emit('close')
    dialog.value = false
  }
}

const isNullCheck = val => {
  return (val === undefined || val === null || val === '') ? true : false
}
//************************************************이벤트 영역(종료)*********************************************************/

//***************************************************조회 영역**************************************************************/
const searchReqList = params => {
  let searchParams = {
    CMPNY_DIV : params.CMPNY_DIV,
    YEAR : params.YEAR,
    REQ_ID : params.REQ_ID
  }
  console.log("REQLIST 조회 데이터",searchParams)
  commonSearchApi({ queryId : 'EDUAB0060_TAB02_POP01_SEARCH_01', param: searchParams }).then(res => {
    console.log("조회 레스 확인",res)
    REQ_LIST.value = '교육대상자 목록(총 ' + res.ORESULT_CUR.length + '명)'
    if(res.ORESULT_CUR.length > 0){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      Message.success("조회되었습니다.")
    }else{
      grdMain.value.getDataProvider().setRows([])
      Message.warn("데이터가 없습니다.")
    }
  })
}

const searchMain = () => {
  let searchParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    REQ_ID : _Parameters.REQ_ID
  }

  commonSearchApi({ queryId : 'EDUAB0060_TAB02_POP01_SEARCH_02', param: searchParams }).then(res => {
    popupData.RET_CONTENT = res.ORESULT_CUR[0].RET_CONTENT
    popupData.PERSON_CNT = res.ORESULT_CUR[0].PERSON_CNT
  })
}

//*************************************************조회 영역(종료)**********************************************************/

//***************************************************승인, 승인 취소 영역****************************************************/
//승인
const btnApprove = () => {
  console.log("승인 파람 ",_Parameters)
  let saveParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    REQ_ID : _Parameters.REQ_ID,
    USER_ID : userStore.empNo
  }
  console.log("승인 전 데이터 확인",saveParams)
  commonExecuteApi({ queryId : 'EDUAB0060_TAB02_POP01_SAVE_01', list: [saveParams] }).then(res => {
    console.log("승인 후 데이터 확인",res)
    popupData.PERSON_CNT = res.list[0].OUT_RES_DATA
    popupData.REQ_STATUS_NM = '승인'
    _Parameters.REQ_STATUS = 'A'
    setButtons()

    Message.success(t('승인되었습니다.'))
    let msg = 'HiSEs에서 신청한 교육이 승인 되었습니다.'
    let REQ_TEL = popupData.REQ_TEL.replaceAll('-','')

    if(REQ_TEL.length >= 10){
      if(REQ_TEL.substr(0, 3) === '010'){
        let TEL = userStore.telNo
        if(!isNullCheck(TEL)){
          if(TEL.length > 2){
            if(TEL.substr(0, 2) === '2-' || TEL.substr(0, 2) === '3-'){
              TEL = '052-20' + TEL
            }else{
              TEL = userStore.hndPhn
            }
          }
        }else{
          TEL = userStore.hndPhn
        }
      }
      let saveParams = {
        CMPNY_DIV : _Parameters.CMPNY_DIV,
        EMPNO_TO : '',
        SYSCODE : '156',
        FROM_P_NO : userStore.telNo,
        TO_P_NO : REQ_TEL,
        TITLE : 'HiSEs에서 신청한 교육이 승인 되었습니다. \n' + popupData.CURR_NM,
        //"HiSEs에서 신청한 교육이 '승인' 되었습니다.\r\n'곤돌라 운전자격 (4월 2차)'"
        USER_ID : userStore.userId,
      }
      let sendSMSParams = {
        EMPNO_FROM : userStore.empNo,
        EMPNO_TO : '',
        SYSCODE : '156',
        FROM_P_NO : userStore.telNo,
        TO_P_NO : REQ_TEL,
        TITLE : saveParams.TITLE
      }
      commonExecuteApi({ queryId: "NOTIFICATIONUTIL_SAVESMS", list: [saveParams] }).then(res => {
        console.log("모바일 정보 저장 res확인",res)
        saveParams.TITLE = saveParams.TITLE.replaceAll('\n')
        console.log("")
        commonSendSMS(sendSMSParams).then(() => {
          Message.success(t('메시지 전송 완료'))
        })
      })
    }
  })
}

const btnApproveCancel = () => {
  let saveParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    REQ_ID : _Parameters.REQ_ID,
    USER_ID : userStore.empNo
  }
  console.log("승인취소할 데이터 확인",[saveParams])
  commonExecuteApi({ queryId : 'EDUAB0060_TAB02_POP01_SAVE_02', list: [saveParams] }).then(res => {
    console.log("승인취소 후 데이터 확인",res)
    popupData.PERSON_CNT = res.list[0].OUT_RES_DATA
    popupData.REQ_STATUS_NM = '승인대기'
    _Parameters.STATUS = 'R'
    _Parameters.REQ_STATUS_NM = '승인대기'
    _Parameters.REQ_STATUS = 'R'
    setButtons()
    
    Message.success(t('승인취소 되었습니다.'))
  })
}
//*************************************************승인, 승인취소 영역(종료)**************************************************/
//***************************************************반려, 반려 취소 영역****************************************************/
const btnReject = () => {
  let REQ_ID = null
  let grdMainDataRow = []
  for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
    // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
    // grdMainDataRow.push(grdMain.value.getGridView().getValues(i))
    grdMainDataRow.push(grdMain.value.getRowData(i))
  }

  if(grdMainDataRow.length === 0){
    REQ_ID = _Parameters.REQ_ID
  }else{
    REQ_ID = grdMainDataRow[0].REQ_ID
    // grdMainDataRow.forEach(val => {
    //   if(REQ_ID === null){
    //     REQ_ID = val.REQ_ID
    //   }else{
    //     REQ_ID += ';' + val.REQ_ID
    //   }
    // })
  }

  eDUAB0060Tab02Pop01Pop01.value.openPopup({
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    REQ_IDes : REQ_ID,
    READONLY_YN : false
  })
}
const onExecute = (STATUS, dataRow) => {
  console.log("스테이터스",STATUS)
  console.log("데이터로우",dataRow)

  if(!isNullCheck(STATUS)){
    popupData.REQ_STATUS = 'T'
    popupData.REQ_STATUS_NM = '반려'
    popupData.RET_CONTENT = dataRow[0].RET_CONTENT
    console.log("팝업데이터_REQ_STATUS_NM 확인",popupData.REQ_STATUS_NM)
    let msg = ''
    let msg2 = ''

    if(dataRow.length > 0){
      msg2 = dataRow[0].RET_CONTENT
    }

    let REQ_TEL = popupData.REQ_TEL.replace('-','')
    if(REQ_TEL.length >= 10){
      console.log("REQ_TEL.substr(0, 3)",REQ_TEL.substr(0, 3))
      if(REQ_TEL.substr(0, 3) === '010'){
        let TEL = userStore.telNo
        console.log("TEL",TEL)
        if(!isNullCheck(TEL)){
          if(TEL.length > 2){
            console.log('TEL.substr(0, 2)',TEL.substr(0, 2))
            if(TEL.substr(0, 2) === '2-' || TEL.substr(0, 2) === '3-'){
              TEL = '052-20' + TEL
            }else{
              TEL = userStore.hndPhn
            }
          }else{
            TEL = userStore.hndPhn
          }
        }

        let saveParams = {
          CMPNY_DIV : dataRow[0].CMPNY_DIV,
          EMPNO_TO : '',
          SYSCODE : '156',
          FROM_P_NO : userStore.telNo,
          TO_P_NO : REQ_TEL,
          TITLE : 'HiSEs에서 신청한 교육이 반려 되었습니다. \n' + popupData.CURR_NM,
          //"HiSEs에서 신청한 교육이 '반려' 되었습니다.\r\n'곤돌라 운전자격 (4월 2차)'"
          USER_ID : userStore.userId,
        }
        let sendSMSParams = {
          EMPNO_FROM : userStore.empNo,
          EMPNO_TO : '',
          SYSCODE : '156',
          FROM_P_NO : userStore.telNo,
          TO_P_NO : REQ_TEL,
          TITLE : saveParams.TITLE
        }
        commonExecuteApi({ queryId: "NOTIFICATIONUTIL_SAVESMS", list: [saveParams] }).then(res => {
          console.log("모바일 정보 저장 res확인",res)
          saveParams.TITLE = saveParams.TITLE.replaceAll('\n')
          commonSendSMS(sendSMSParams).then(() => {
            if(isNullCheck(msg2)){
              Message.success(t('메시지 전송 완료'))
              _Parameters.REQ_STATUS = 'T'
              setButtons()
            }
          })

          if(!isNullCheck(msg2)){
            saveParams.TITLE = '반려사유 : ' + msg2
            sendSMSParams.TITLE = saveParams.TITLE
            commonExecuteApi({ queryId: "NOTIFICATIONUTIL_SAVESMS", list: [saveParams] }).then(res => {
              console.log("모바일 정보 저장2 res 확인",res)
              commonSendSMS(sendSMSParams).then(() => {
                Message.success(t('메시지 전송 완료'))
                _Parameters.REQ_STATUS = 'T'
                setButtons()
              })
            })
          }
        })
      }
    }
  }
}
const btnRejectCancel = () => {

  let saveParams = {
    CMPNY_DIV : _Parameters.CMPNY_DIV,
    YEAR : _Parameters.YEAR,
    SCHEDULE_ID : _Parameters.SCHEDULE_ID,
    REQ_ID : _Parameters.REQ_ID,
    USER_ID : userStore.empNo
  }
  console.log("반려취소할 데이터",saveParams)
  commonExecuteApi({ queryId: "EDUAB0060_TAB02_POP01_SAVE_03", list: [saveParams] }).then(res => {
    console.log("반려취소 결과",res)
    popupData.PERSON_CNT = res.list[0].OUT_RES_DATA
    popupData.REQ_STATUS_NM = '승인대기'
    popupData.RET_CONTENT = ''
    _Parameters.REQ_STATUS_NM = '승인대기'
    _Parameters.REQ_STATUS = 'R'
    setButtons()

    Message.success(t('반려취소 되었습니다.'))
  })
}
//************************************************반려, 반려 취소 영역(종료)*************************************************/

defineExpose({
  openPopup
})
</script>

<template>
  <VDialog
  v-model="dialog"
  eager
  persistent
  width="1000"
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
      <span>자율수강신청 접수처리</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title>
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :title="$t('')"
          :button-list="['btnApprove','btnApproveCancel', 'btnReject', 'btnRejectCancel', 'btnClose']"
          @click-button="onPopButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <v-sheet class="flex-column searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('교​​ ​ 육​ ​ 명')"
              labelWidth="52px"
              width="570px"
              v-model="popupData.CURR_NM"
              readonly
            />
            <i-input
              :label="$t('정원/승인인원/잔여')"
              labelWidth="145px"
              width="350px"
              v-model="popupData.PERSON_CNT"
              readonly
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              class="mr-2"
              :label="$t('교육기간')"
              labelWidth="52px" 
              width="198px" 
              v-model="popupData.EDU_DATE_FROM"
              type="date"
              readonly
            />
            <i-input
              :label="$t('-')"
              width="155px"
              v-model="popupData.EDU_DATE_TO"
              type="date"
              readonly
            />
            <i-input
              :label="$t('진행상태')"
              labelWidth="52px" 
              width="190px"
              v-model="popupData.REQ_STATUS_NM"
              readonly
            />
            <i-input
              :label="$t('반​려​사유')"
              labelWidth="145px"
              width="350px"
              v-model="popupData.RET_CONTENT"
              readonly
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              :label="$t('신청조직')"
              labelWidth="52px" 
              width="362px"
              v-model="popupData.REQ_ORGN_NM"
              readonly
            />
            <i-input
              :label="$t('신청자')"
              labelWidth="52px" 
              width="190px"
              v-model="popupData.REQ_NM"
              readonly
            />
            <i-input
             :label="$t('신청자 전화번호(Mobile)')"
             labelWidth="145px" 
             width="350px"
              v-model="popupData.REQ_TEL"
              readonly
            />
          </div>
        </v-sheet>
        <span class="mt-1">{{REQ_LIST}}</span>
        <v-sheet height="45%">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet> 
        <v-sheet height="30%" class="mt-2">
          <IUpload
            ref="fileUpload"   
            :is-visibled="false"
            :button-list="['btnDownLoad']"
          />
        </v-sheet>
      </v-card-text>
      
    </v-card>
  </VDialog>
  <EDUAB0060Tab02Pop01Pop01 ref="eDUAB0060Tab02Pop01Pop01" @execute="onExecute"/>
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
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>