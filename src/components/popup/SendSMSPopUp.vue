<!-- 
  화면명 : SendSMSPopUp.vue
  화면개요 :  SMS 발송 팝업
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/01/24
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/01/24 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import { commonSearchApi, commonExecuteApi, commonSendSMS } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { isEmpty } from "@/@core/utils"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const empPopup = ref(null)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const empNo = ref(null)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

const grdMainProps = reactive({
  gridViewOption : { 
    edit: { 
      editable:false,
      movable:true, 
    },    
    stateBar: { visible: false },
    display: { selectionStyle : 'rows' },
    checkBar: { visible: true },
  },
  keys : ['EMP_NO'],
  field : [
    { fieldName: "ASGN_NM", dataType: "text", width: "200", styleName: "left-column", header: { text: t("소속") } },
    { fieldName: "EMP_NO", dataType: "text", width: "90", header: { text: t("사번") } },
    { fieldName: "EMP_NM", dataType: "text", width: "90", header: { text: t("성명") } },
    { fieldName: "HND_PHN", dataType: "text", width: "90", header: { text: t("휴대폰번호") } },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.field

const popupField = reactive({
  SMS_CONTENTS: '', //내용
  FROM_P_NO: userStore.HND_PHN,
})
// ------------------------------------------------------------------------
// * 작성자 : 류원진
// * 작성일 : 2024-03-21
// * 내용   : 화면 오픈시 받아온 데이터로만 SMS 전송을 해야하는 상황에 사용하기 위해 작성함(추가, 삭제 제한)
const visible = reactive({
  gridBtn : true,  //그리드 버튼
})

// ------------------------------------------------------------------------
// 조회 파라미터
let searchParams1 = reactive({})
let searchParams2 = reactive({})

const detailData = reactive({ 
  USER_ID: '',
  CMPNY_DIV: '',
  EMPNO_TO: '', 
  SYSCODE:  '156',
  FROM_P_NO: '',
  TO_P_NO: '',
  TITLE: '',
  TYPE: '',
  ROWS: '',
})

const sendSMSParams = reactive({
  EMPNO_FROM: '', //보내는 사람 사번
  EMPNO_TO: '',   //받는 사람 사번 
  SYSCODE: '',    //시스템코드
  FROM_P_NO: '',  //보내는 사람 전화번호
  TO_P_NO: '',    //받는 사람전화번호
  TITLE: '',      //메시지 내용
})

const openPopup = async (val, visibleYn) => {
  console.log("openPopup", val)
  openRefresh()
  if(val.TYPE === 'EDU'){
    empNo.value  = val.grdMainData
    detailData.TYPE = val.TYPE
    detailData.ROWS = val.ROWS
  }else{
    empNo.value  = val
  }
  if(visibleYn === false){
    visible.gridBtn = false
  }

  // 통합안전교육센터 김단아
  if(userStore.userId === 'BP24373'){
      popupField.FROM_P_NO = '052-202-2363'
  }

  dialog.value = true
  vm.$nextTick(() => {
    // console.log('detailData val',detailData)
    onButtonsClick({ id : 'btnSearch' })
  })
  
}

// ------------------------------------------------------------------------
/* 작성자 : 류원진
  * 작성일 : 2024-03-21
  * 내용   : 화면 오픈시 데이터 초기화 작업을 위해 추가함
*/
const openRefresh = () => {
  Object.keys(popupField).forEach(key => {
    console.log("키 확인",key)
    popupField[key] = ''
  })
  grdMain.value.getDataProvider().setRows([])
}

const onClose = () => {
  detailData.TYPE = ''
  detailData.ROWS = ''
  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch')
  {
    if (!isEmpty(empNo.value)) {
      // 받는 사람 정보 조회
      if(detailData.TYPE === 'EDU'){
        // grdMain.value.getDataProvider().setRows([])
        let result = []
        let count = 0
        for(let i = 0 ; i<empNo.value.length; i++){
          // console.log('empNo.value',idx,e)
          searchParams1.CMPNY_DIV = userStore.cmpnyDiv,
          searchParams1.USER_DIV = "",
          searchParams1.BSNS_CD = "",
          searchParams1.DEPT_CD = "",
          searchParams1.EMP_NM = "",
          searchParams1.EMP_NO = empNo.value[i],
          searchParams1.FLAG = "N", //퇴직자 포함 여부 플래그값
          // console.log('교육일정 문자 발송 100명 이상 ', searchParams1)
          commonSearchApi({ queryId: "searchEMP_SMS", param: searchParams1 })
          .then(res=>{
            result = result.concat(res.ORESULT_CUR)
            // console.log('i',i)
            count += 1
            if(empNo.value.length === count){
              grdMain.value.getDataProvider().setRows(result)
            }
          })
        }
      }else{
        new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchData1)
        .setAfter(afterSearch1)
        .run()
      }
      
    }

    // 보낸 최신 이력 조회
    new queryFlowHelper(vm, t)
      .setUseDefaultBefore(false)
      .setQuery(searchData2)
      .setAfter(afterSearch2)
      .showMessage(false)
      .run()
  } 
  else if (btn.id === 'btnSend') {
    console.log('btnSend')
    console.log('popupField => ', popupField)
    new saveFlowHelper(vm, t)
      .setConfirmMessage('메세지를 전송 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(sendSMS)
      .setResultMessage('전송 완료했습니다.')
      .run()
  }
  else if (btn.id === 'btnCreate') {
    console.log('btnCreate')

    //테스트용
    // let newRow = {
    //   ASGN_NM: '', 
    //   EMP_NO: 'BP23977', 
    //   EMP_NM: '차동운', 
    //   HND_PHN: '01093970815',
    // }

    // // grdMain.value.addRow(newRow)
    // grdMain.value.getDataProvider().insertRow(0, newRow)
    // grdMain.value.getGridView().checkItem(0, true)
    // grdMain.value.getGridView().commit()

    empPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      EMP_NM: '',
    }) 
  }
  else if (btn.id === 'btnDelete') {
    console.log('btnDelete')
    let checkedRows = grdMain.value.getGridView().getCheckedRows()

    if(checkedRows.length === 0){
      Message.warn(t('선택된 데이터가 없습니다.'))

      return false
    } else {
      for (let rowIdx of checkedRows) {
        let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
        grdMain.value.deleteRow(data)

        return true
      }
    }
  }
  else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 받는 사람 조회로직
const searchData1 = () => {
  searchParams1.CMPNY_DIV = userStore.cmpnyDiv,
  searchParams1.USER_DIV = "",
  searchParams1.BSNS_CD = "",
  searchParams1.DEPT_CD = "",
  searchParams1.EMP_NM = "",
  searchParams1.EMP_NO = empNo.value,
  searchParams1.FLAG = "N", //퇴직자 포함 여부 플래그값
  console.log('searchData1>>searchParams1: ', searchParams1)
  if(visible.gridBtn === true){
    return commonSearchApi({ queryId: "searchEMP", param: searchParams1 })
  }else{
    return commonSearchApi({ queryId: "searchEMP_SMS", param: searchParams1 })
  }
  
}

// 보낸 최신 이력 조회로직
const searchData2 = () => {
  searchParams2.CMPNY_DIV = userStore.cmpnyDiv
  searchParams2.EMP_NO = userStore.userId

  return commonSearchApi({ queryId : 'NOTIFICATIONUTIL_SEARCH_01', param: searchParams2 })
}

const afterSearch1 = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const afterSearch2 = res => {
  if (res.ORESULT_CUR.length > 0) {
    popupField.SMS_CONTENTS = res.ORESULT_CUR[0].TITLE  //마지막 보낸 메시지
    // 2024.11.13 내선번호로 발송이되면 문자가 발송이 되지 않아서 주석 처리 
    //popupField.FROM_P_NO = isEmpty(res.ORESULT_CUR[0].FROM_P_NO) ? userStore.HND_PHN : res.ORESULT_CUR[0].FROM_P_NO //보내는 사람 전화 번호   
  }
}

const saveData = () => {
  let saveParam = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    detailData.USER_ID = userStore.userId
    detailData.CMPNY_DIV = userStore.cmpnyDiv
    detailData.EMPNO_TO  = data.EMP_NO,
    detailData.SYSCODE  = '156'
    detailData.FROM_P_NO  = popupField.FROM_P_NO
    detailData.TO_P_NO  = data.HND_PHN.replaceAll('-', '')
    detailData.TITLE  = popupField.SMS_CONTENTS
    saveParam.push(detailData)
  }

  console.log('save>>saveParams: ', saveParam)
  if(checkedRows.length < 1){
    
    return  Message.err(t('전송할 데이터를 선택해 주세요.'))
  }

  return commonExecuteApi({ queryId: "NOTIFICATIONUTIL_SAVESMS", list: saveParam })
}

const sendSMS = () => {

  // 테스트 나중에 바꿀것
  // 테스트 하드코딩 수정할 것(BP23200 SMS 전송 안 먹힘)
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    sendSMSParams.EMPNO_FROM = userStore.empNo
    sendSMSParams.EMPNO_TO  = data.EMP_NO,
    sendSMSParams.SYSCODE  = '156'
    sendSMSParams.FROM_P_NO  = popupField.FROM_P_NO
    sendSMSParams.TO_P_NO  = data.HND_PHN.replaceAll('-', '')
    sendSMSParams.TITLE  = popupField.SMS_CONTENTS

    commonSendSMS(sendSMSParams).then(async resSms => {
      console.log('SMS RES => ', resSms)
    })
  }
}

const onEmpSelected= val =>{

  console.log('onEmpSelected: ', val)

  let newRow = {
    ASGN_NM: val.ASGN_NM, 
    EMP_NO: val.EMP_NO, 
    EMP_NM: val.EMP_NM, 
    HND_PHN: val.HND_PHN,
  }

  // grdMain.value.addRow(newRow)
  grdMain.value.getDataProvider().insertRow(0, newRow)
  grdMain.value.getGridView().checkItem(0, true)
  grdMain.value.getGridView().commit()

}
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1050"
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
      <span>SMS 전송</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSend','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <!--이규호 책임 요청으로 내용의 인풋창 길이 최대로 설정// 수정자 : 류원진, 수정일 : 2024.06.25-->
            <i-input
              v-model="popupField.SMS_CONTENTS"
              :label="$t('내용')"
              label-width="26px"
              width="990px"
              auto-grow
            />
          </v-sheet>
          <v-sheet 
            height="100%" 
            class="mb-2"
          >
            <IGridTitle
              :title="$t('받는사람')"
            >
              <template #editors />
            </IGridTitle>
            <IGridTitle
              :button-list="['btnCreate', 'btnDelete']"
              @click-button="onButtonsClick"
              v-if="visible.gridBtn"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: calc(100vh - 400px);"   
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </div>
        <EmpPopup 
          ref="empPopup" 
          @selected="onEmpSelected"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
