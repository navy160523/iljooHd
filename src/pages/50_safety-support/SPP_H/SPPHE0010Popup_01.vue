<!-- SPPHE0010Popup_03 실시간 태풍 모니터링 문자전송 팝업-->
<!-- SI2팀 마환구 2025-02-12 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick  } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'

import saveFlowHelper from "@/utils/saveFlowHelper"
import { commonSearchApi, commonExecuteApi, commonSendSMS } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'

import ILabel from '@/components/ILabel.vue'
import SPPHE0010_POPUP_02 from '@/pages/50_safety-support/SPP_H/SPPHE0010Popup_02.vue'
import SPPHE0010_POPUP_03 from '@/pages/50_safety-support/SPP_H/SPPHE0010Popup_03.vue'
import dayjs from "dayjs"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMainProps1 = ref(null)


const byteLength = ref(0);
const MESSAGE_GUBUN = ref('SMS');
const MESSAGE_SEND_OPTION = ref('send');
const SEND_COM = ref('HHI');
const chkHHI= ref([]);
const chkHHIAll=ref(null);
const chkADMIN= ref([]);
const chkADMINETC=ref([]);
const chkADMINAll=ref(false);
const chkETC= ref([]);
const chkETCAll= ref(null);
const chkEMP1 = ref(null);
const chkEMP2 = ref(null);
const chkEMPAll= ref(null);
const SPPHE0010_POPUP02=ref(null)
const SPPHE0010_POPUP03=ref(null)

const txtContent = ref(null); //발송내역
const txtContentTitle = ref('');//LMS 발송제목
const txtSendDept = ref(''); // 발송부서
const txtTestnum = ref(''); // 테스트 전화번호



//mouse coordinate
const x = ref(0)
const y = ref(0)


const grdProps1 = reactive({
  gridViewOption: {
    edit: {
      editable: false,
      movable: true,
    },
    stateBar: { visible: false },
    checkBar: { visible: false },
  },
  keys: [],
  fields: [
    { fieldName: "SEND_DATE", dataType: "text", width: "200", styleName: "left-column", header: { text: t("처리일") } },
    { fieldName: "TIME_FR", dataType: "text", width: "90", header: { text: t("시작시간") } },
    { fieldName: "TIME_TO", dataType: "text", width: "90", header: { text: t("완료시간") } },
    { fieldName: "TIME_USE", dataType: "text", width: "90", header: { text: t("소요시간") } },
    { fieldName: "SEND_DESC", dataType: "text", width: "90", header: { text: t("DESC") } },
    { fieldName: "SEND_CNT", dataType: "text", width: "90", header: { text: t("처리건수") } },
    { fieldName: "CMPNY_DIV", dataType: "text", visible : false },
    { fieldName: "SEND_SERNO", dataType: "text", visible : false},
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields


// ------------------------------------------------------------------------
// * 작성자 : 류원진
// * 작성일 : 2024-03-21
// * 내용   : 화면 오픈시 받아온 데이터로만 SMS 전송을 해야하는 상황에 사용하기 위해 작성함(추가, 삭제 제한)
const visible = reactive({
  gridBtn: true,  //그리드 버튼
})

// ------------------------------------------------------------------------
// 조회 파라미터

let searchParams2 = reactive({})

const detailData = reactive({
  
  CMPNY_DIV: '',
  SEND_DATE:'',
  SEND_GBN: '',
  SEND_TITLE: '156',
  SEND_MSG: '',
  SEND_DEPT: '',
  SEND_HPNO: '',
  REMARK: '',
  USER_ID: '',
})

const sendSMSParams = reactive({
  EMPNO_FROM: '', //보내는 사람 사번
  EMPNO_TO: '',   //받는 사람 사번 
  SYSCODE: '',    //시스템코드
  FROM_P_NO: '',  //보내는 사람 전화번호
  TO_P_NO: '',    //받는 사람전화번호
  TITLE: '',      //SMS(메시지 내용)/LMS(제목)
  TYPE:'',        //SMS/LMS 구분
  CONTENTS:''     //SMS(공백)/LMS(내용)
})

const codeList = reactive({
  DEPT: []
})

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  DEPT : ''
})
const Recive_user = reactive({
  HAND_PHN :[],
  EMP_NO :[],
  KOR_NM :[]
});


// let searchParams1 = reactive({
//   RECEIVE_CMPNY : SEND_COM.value,
//   HHI_BSNS_STR : chkHHI.value,
//   ETC_COMPANY_STR : chkETC.value,
//   HHI_OFFI_STR : chkADMIN.value,
//   ETC_DUTY_STR :chkADMINETC.value,
//   HHI_ALL_CHK : chkEMP1.value,
//   ETC_ALL_CHK : chkEMP2.value
// })

const openPopup = async () => {
  
  initiPopup();
  SEND_GRID();
  dialog.value = true;


}

const initiPopup=()=>{
  MESSAGE_GUBUN.value = 'SMS';
  MESSAGE_SEND_OPTION.value = 'send';
  SEND_COM.value = 'HHI';
  chkHHI.value= [];
  chkHHIAll.value=null;
  chkADMIN.value= [];
  chkADMINETC.value=[];
  chkADMINAll.value= null;
  chkETC.value= [];
  chkETCAll.value= null;
  chkEMP1.value = "N";
  chkEMP2.value = "N";
  chkEMPAll.value= null;
  
  txtContent.value = ''; //발송내역
  txtContentTitle.value = '';//LMS 발송제목
  txtSendDept.value = ''; // 발송부서
  txtTestnum.value = ''; // 테스트 전화번호

  let param = {
    CMPNY_DIV: userStore.cmpnyDiv
  }
    // 조회용 태풍 발생 년도 호출(SPPHB0010_SEARCH_04)
    commonSearchApi({ queryId: 'SPPHE0010_SEARCH_06', param: param })
    .then(res => {
      codeList.DEPT = res.ORESULT_CUR  
      if (codeList.DEPT.length > 0) {
          searchParams.DEPT=codeList.DEPT[0].CODE
          txtSendDept.value=searchParams.DEPT.split('_')[1]
      }
    })
  
  grdMainProps1.value.getGridView().filterPanel.visible = true

}

const SEND_GRID = () => {
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    SEND_DATE: dayjs().format("YYYYMMDD")
  }

  commonSearchApi({ queryId: 'SPPHE0010_SEARCH_13', param: param })
    .then(res => {
      grdMainProps1.value.getDataProvider().setRows(res.ORESULT_CUR);
    })
}

onMounted(() => {
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv
  }
    // 조회용 태풍 발생 년도 호출(SPPHB0010_SEARCH_04)
    commonSearchApi({ queryId: 'SPPHE0010_SEARCH_06', param: param })
    .then(res => {
      codeList.DEPT = res.ORESULT_CUR  
      if (codeList.DEPT.length > 0) {
          searchParams.DEPT=codeList.DEPT[0].CODE
          txtSendDept.value=searchParams.DEPT.split('_')[1]
      }
    })
  
  grdMainProps1.value.getGridView().filterPanel.visible = true
  
})

const onClose = () => {
  detailData.TYPE = ''
  detailData.ROWS = ''
  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnContent') {
    //내용이 있는 POPUP 띄우기
    SPPHE0010_POPUP02.value.openPopup()
  }
  else if (btn.id === 'btnSend') {
    
    new saveFlowHelper(vm, t)
      .setConfirmMessage('메세지를 전송 하시겠습니까?')
      .setBefore(sendBefore)
      .setQuery(saveData)
      .setAfter(sendSMS)
      .setResultMessage('전송 완료했습니다.')
      .run()
  }
  else if (btn.id === 'btnDelete') {
    txtContent.value="";
    txtContentTitle.value="";
  }
  else if (btn.id === 'btnSendHis') {
    
    SPPHE0010_POPUP03.value.openPopup()
  }
  else if (btn.id === 'btnClose') {
    onClose()
  }
}

const afterSearch = (res) => {
  grdMainProps1.value.getDataProvider().setRows(res.ORESULT_CUR);
}

let searchParams1 = reactive({
  RECEIVE_CMPNY : SEND_COM.value,
  HHI_BSNS_STR : chkHHI,
  ETC_COMPANY_STR : chkETC,
  HHI_OFFI_STR : chkADMIN,
  ETC_DUTY_STR :chkADMINETC,
  HHI_ALL_CHK : chkEMP1,
  ETC_ALL_CHK : chkEMP2
})
let result;
// 받는 사람 조회로직
const searchData1 = () => {
  

  // console.log('searchData1>>searchParams1: ', searchParams1)
  if(MESSAGE_SEND_OPTION.value=="send")
  {
    commonSearchApi({ queryId: "SPPHE0010_SEARCH_12", param: searchParams1 }).then(res=>{
      if(res.ORESULT_CUR != null)
      {
        // console.log("res:",res.ORESULT_CUR)
        Recive_user.HAND_PHN=res.ORESULT_CUR.map(item => item.HAND_PHN);
        Recive_user.EMP_NO=res.ORESULT_CUR.map(item => item.EMP_NO);
        Recive_user.KOR_NM=res.ORESULT_CUR.map(item => item.KOR_NM)
        
      }
    })
  }
  else
  {
    Recive_user.HAND_PHN.push(txtTestnum.value);
    Recive_user.EMP_NO.push(userStore.empNo);
    Recive_user.KOR_NM.push(userStore.empNm);
  }
}

// 보낸 최신 이력 조회로직
const searchData2 = () => {
  searchParams2.CMPNY_DIV = userStore.cmpnyDiv
  searchParams2.EMP_NO = userStore.userId

  return commonSearchApi({ queryId: 'NOTIFICATIONUTIL_SEARCH_01', param: searchParams2 })
}

const saveData = () => {
  let saveParam = []
  let SEND_SERNO_Value=''
    detailData.USER_ID = userStore.userId
    detailData.CMPNY_DIV = userStore.cmpnyDiv
    detailData.SEND_DATE = dayjs().format("YYYYMMDD");
    detailData.SEND_GBN = MESSAGE_GUBUN.value
    if(MESSAGE_GUBUN.value=="SMS")
    {
      detailData.SEND_TITLE = ""
      detailData.SEND_MSG=txtContent.value
    }
    else
    {
      detailData.SEND_TITLE = txtContentTitle.value
      detailData.SEND_MSG=txtContent.value
    }
    detailData.SEND_DEPT=codeList.DEPT.find(dept => dept.CODE === searchParams.DEPT)?.DISPLAY_TEXT || '';
    detailData.SEND_HPNO=searchParams.DEPT.split('_')[1]
    detailData.REMARK=""

    
    saveParam.push(detailData)
    //
    //SMS 발송이력
    return commonExecuteApi({ queryId: "SPPHE0010_SAVE_01", list: saveParam }).then(res=>{
      if(res.list[0].OUT_RES_COD!="0")
      {
        return Message.warn(res.list[0].OUT_RES_MSG)
      }
      else
      {
        SEND_SERNO_Value=res.list[0].OUT_SEND_SERNO
        Receive_SAVE(SEND_SERNO_Value)
      }

    })

}

const Receive_SAVE =(SEND_SERNO_Value)=>{
  let save_his_param=[]
        Recive_user.HAND_PHN.forEach((_,index)=>{
        let SendHisParams={
          CMPNY_DIV:userStore.cmpnyDiv,
          SEND_DATE:dayjs().format("YYYYMMDD"),
          SEND_SERNO:SEND_SERNO_Value,
          EMP_NO:Recive_user.EMP_NO[index],
          HPNO:Recive_user.HAND_PHN[index],
          REMARK:"",
          USER_ID:userStore.userId,
        }
        //SMS 수신이력
        
        save_his_param.push(SendHisParams);
        })

        commonExecuteApi({ queryId: "SPPHE0010_SAVE_02", list: save_his_param }).then(res2=>{
          if(res2.list[0].OUT_RES_COD!="0")
          {
            return Message.warn(res2.list[0].OUT_RES_MSG)
          }
        })
}

const sendSMS = () => {

  // 테스트 나중에 바꿀것
  // 테스트 하드코딩 수정할 것(BP23200 SMS 전송 안 먹힘)

  Recive_user.HAND_PHN.forEach((_,index)=>{
    //sendSMSParams.EMPNO_FROM = userStore.empNo
    sendSMSParams.EMPNO_FROM = userStore.userId
    sendSMSParams.EMPNO_TO = Recive_user.EMP_NO[index],
    sendSMSParams.SYSCODE = '156'
    sendSMSParams.FROM_P_NO = txtSendDept.value
    sendSMSParams.TO_P_NO = Recive_user.HAND_PHN[index].replaceAll('-', '')
    if(MESSAGE_GUBUN.value=="SMS")
    {
      sendSMSParams.TYPE='B'
      sendSMSParams.TITLE = txtContent.value
      sendSMSParams.CONTENTS = null
    }
    else
    {
      sendSMSParams.TYPE='L'
      sendSMSParams.TITLE = txtContentTitle.value
      sendSMSParams.CONTENTS = txtContent.value
    }
    
    //  console.log("sendSMSParam:",sendSMSParams);
      commonSendSMS(sendSMSParams).then(async resSms => {
      // console.log('SMS RES => ', resSms)
      resetParams();
      onButtonsClick({ id: 'btnDelete' })
      })
  })
  SEND_GRID()
}

function resetParams() {
  Object.assign(sendSMSParams, {
    EMPNO_FROM: '',
    EMPNO_TO: '',
    SYSCODE: '',
    FROM_P_NO: '',
    TO_P_NO: '',
    TITLE: '',
    TYPE: '',
    CONTENTS: ''
  });
  Recive_user.EMP_NO=[];
  Recive_user.HAND_PHN=[];
  Recive_user.KOR_NM=[];
}

const sendBefore=()=>
{
  //SMS 전송전 각각 체크가 되어있는지 확인

  if(MESSAGE_SEND_OPTION.value=='send')
  {
    if(SEND_COM.value=='HHI')//발송대상 회사 확인 현대중공업
    {
      if(chkHHI.value.length<=0)//사업부 선택여부 확인
      {
        return Message.warn(t('사업부를 선택해 주세요'))
        return false;
      }
    }
    else if(SEND_COM.value == 'ETC')//발송대상 회사 확인 기타 회사
    {
      if(chkETC.value.length<=0)//기타회사 선택여부 확인
      {
        return Message.warn(t('회사를 선택해 주세요'))
        return false;
      }
    }
    if(chkADMIN.value.length<=0 && (chkEMP1.value=="N" && chkEMP2.value=="N"))//발송대상 선택여부 확인
      {
        return Message.warn(t('발송대상을 선택해 주세요'))
        return false;      
      }
    if(MESSAGE_GUBUN.value=="LMS")//장문 문자 여부 확인
    {
      if(!txtContentTitle.value)//장문문자 일시 제목 입력 확인
      {
        return Message.warn(t('발송제목을 입력해 주세요'))
        return false
      }
    }
    if(!txtContent.value)//발송내역 입력 확인
      {
        return Message.warn(t('발송내용을 입력해 주세요')) 
        return false
      }
    if(!txtSendDept.value)//발송부서 선택 및 입력 확인
      {
        return Message.warn(t('발송부서를 선택해 주세요'))
        return false
      }
    else
      {
        searchData1()
        return true;
      }
            
  }
  else//문자 TEST
  {
    if(!txtTestnum.value)//TEST 발송문자 번호 입력 확인
    {
      return Message.warn(t('TEST번호를 입력해 주세요'))
      return false
    }
    if(MESSAGE_GUBUN.value=="LMS")//장문 문자 여부 확인
    {
      if(!txtContentTitle.value)//장문문자 일시 제목 입력 확인
      {
        return Message.warn(t('발송제목을 입력해 주세요'))
        return false
      }
    }
    if(!txtContent.value)//발송내역 입력 확인
    { 
      return Message.warn(t('발송내용을 입력해 주세요'))
      return false
    }

    if(!txtSendDept.value)//발송부서 선택 및 입력 확인
    {
      return Message.warn(t('발송부서 선택해 주세요'))
      return false
    }
    else
    {
      searchData1()
      return true;
    }
  }
}

const selectRecive=(data)=>{
  txtContent.value=data
}

const changDEPT=()=>
{
  txtSendDept.value=searchParams.DEPT.split('_')[1];
}

const handelAdminChange= ()=>{
  if(chkEMP1.value=='Y')
  {
    chkADMIN.value=[]
    return Message.warn(t('전임직원과 관리자(사업부)는 함께 선택 할 수 없습니다.'))
  }  
}
const handelAdminetcChange =()=>{
  if(chkEMP2.value=='Y')
  {
    chkADMINETC.value=[]
    return Message.warn(t('협력사 전직원과 관리자(협력사)는 함께 선택 할 수 없습니다.'))
  }
}


function toggleHHIAll(newValue){
  
  if(newValue=="true")
  {
    chkHHI.value=["'10', '11', '12', '14'","'AC00'","'AE00'","'AX00'","'AN00'","'AK00'","'AY00'","'AD00'"];
  }
  else
  {
    chkHHI.value=[];
  }
}

function toggleHHI(newValue){
  
  if(!newValue)
  {
    chkHHI.value.push(newValue);
  }
}


function toggleADMINAll(){
  if(chkEMP1.value=='N'&&chkEMP2.value=='N')
  {
    if(chkADMINAll.value==true)
    {
      chkADMIN.value=["'10', '11', '12', '14', '54'","'15', '62'","'16'","'17'"];
      chkADMINETC.value=["'C103101','C10302','C10303'"];
    }
    else
    {
      chkADMIN.value=[];
      chkADMINETC.value=[];
    }
  }
  else
  {
    chkADMINAll.value=false;
    
    return Message.warn(t('관리자는 전직원와 함께 선택 할 수 없습니다.'))
  }
}

function toggleETCAll(newValue){
  
  if(newValue=="true")
  {  
    chkETC.value=["'210'","'200'","'230'","'250'","'240'","'110'","'100'"];
  }
  else
  {
    chkETC.value=[];
  }
}

function toggleETC(newValue){
  
  if(!newValue)
  {  
    chkETC.value.push(newValue)
  }
}

const toggleEMPAll=()=>{
  
    if(chkEMPAll.value=="Y")
      { if(chkADMIN.value.length==0 && chkADMINETC.value.length==0)
        {      
        chkEMP1.value="Y";
        chkEMP2.value="Y";
        }
        else
        {
          chkEMPAll.value="N"
          Message.warn(t('전직원은 관리자와 함께 선택 할 수 없습니다.'))
        }
      }
    else
      {
        chkEMP1.value="N";
        chkEMP2.value="N";
      }
  }

const EMP1Change=()=>{
  
  if(chkEMP1.value=="Y")
  {
    if(chkADMIN.value.length>0)
    {
      chkEMP1.value="N"
      return Message.warn(t('관리자(사업부)는 전임직원과 함께 선택 할 수 없습니다.'))
    }
    else
    {   
      chkEMP1.value="Y"
    }
  }
  else
  {
    chkEMP1.value="N"
  }
}
const EMP2Change=()=>{

  if(chkEMP2.value=="Y")
  {
    if(chkADMINETC.value.length>0)
    {
      chkEMP2.value="N"
      return Message.warn(t('관리자(협력사)는 협력사 전직원과 함께 선택 할 수 없습니다.'))
    }
    else
    {
      chkEMP2.value="Y"
    }
  }
  else
  {
    chkEMP2.value="N"
  }

}
// 입력값 변경 시 바이트 수 체크
const handleInput =()=>{
  byteLength.value = getByteLength(txtContent.value);

  if(MESSAGE_GUBUN.value=="SMS")
  {
    MESSAGE_GUBUN.value = byteLength.value > 90 ? 'LMS' : 'SMS';
  }

  if(byteLength.value>2000)
  {
    txtContent.value=trimToMaxLength(txtContent.value,2000);
    Message.warn(t('발송내용은 2000바이트를 넘을 수 없습니다.'))
  }
}

// 바이트 수 계산 함수
const getByteLength = (str) => new TextEncoder().encode(str).length;

// 2000바이트 초과 시 잘라내기 함수
const trimToMaxLength = (str, maxBytes) => {
  let result = str;
  while (getByteLength(result) > maxBytes) {
    result = result.slice(0, -1);
  }
  return result;
};

</script>

<template style="margin: 0px">
  <v-dialog v-model="dialog" eager persistent width="800" class="p-absolute user-select-none"
    >
    <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move"
      >
      <span>태풍발령 문자 발송 시스템</span>
    </v-sheet>
    <!-- <v-card class="pa-0 fill-height rounded-b-5"> -->
      <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle :use-permission="false" :button-list="['btnContent','btnSend','btnDelete','btnSendHis','btnClose']" @click-button="onButtonsClick" />
        <!-- <IButtonList
              :button-list="['btnContent','btnSend','btnDelete','btnSendHis','btnClose']"
              @click-button="onButtonsClick"/> -->
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <VRow class="d-flex flex-column">
          <!-- <VRow class="justify-end pb-4 pt-2">
              <IButtonList
              :button-list="['btnContent','btnSend','btnDelete','btnSendHis','btnClose']"
              @click-button="onButtonsClick"/>
          </VRow> -->
          <VRow style="height: 260px;">
            <!-- <VCol cols="12" md="6" style="align-content: center"> -->
              <VCol cols="12" md="5">
              <VRow>
                <IGridTitle :title="$t('문자 발송 구분 선택')">
                  <template #editors />
                </IGridTitle>
              </VRow>
              <VRow class="searchArea">
                <v-radio-group v-model="MESSAGE_GUBUN" class="d-flex justify-center" inline>
                  <VRadio label="SMS(단문)" value="SMS" />
                  <VRadio label="LMS(장문)" value="LMS" />
                </v-radio-group>
              </VRow>
              <VRow>
                <IGridTitle :title="$t('문자 발송 옵션')">
                  <template #editors />
                </IGridTitle>
              </VRow>
              <VRow class="searchArea">
                <v-radio-group v-model="MESSAGE_SEND_OPTION" class="d-flex justify-center" inline>
                  <VRadio label="문자 발송" value="send" />
                  <VRadio label="문자 TEST" value="test" />
                </v-radio-group>
              </VRow>
            </VCol>
            <VCol cols="12" md="7">
              <VRow v-if="MESSAGE_GUBUN=='LMS'">
                <VCol cols="12" md="3" class="pa-1">
                  <ILabel :label="$t('발송제목')">
                  <!-- <template #editor="editorProps">
                  
                </template> -->
                  </ILabel>
                </VCol>
                <VCol cols="12" md="9" class="pa-1">
                  <VTextField v-model="txtContentTitle"/>

                </VCol>
              </VRow>
              <VRow v-else style="height:43px">
                
              </VRow>
              <VRow>
                <VCol cols="12" md="3" class="pa-1">
                  <ILabel :label="$t('발송내용')">
                  </ILabel>
                </VCol>
                <VCol cols="12" md="9" class="pa-1">
                  <VTextarea 
                  v-model="txtContent"
                  @input="handleInput"
                  />
                </VCol>
              </VRow>
              <VRow>
                <VCol cols="12" md="3" class="pa-1">
                  <ILabel :label="$t('문자 작성부서')">
                </ILabel>
                </VCol>
                <VCol cols="12" md="9" class="pa-1">
                  <v-select
                    v-model="searchParams.DEPT"
                    :items="codeList.DEPT"
                    item-value="CODE"
                    item-title="DISPLAY_TEXT"

                    @update:model-value="changDEPT"/>
                </VCol>
                
              </VRow>    
              <VRow v-if="searchParams.DEPT=='9_'">
                <VCol cols="12" md="3" class="pa-1">
                  <ILabel :label="$t('발송전화번호')">
                  </ILabel>
                </VCol>
                <VCol cols="12" md="9" class="pa-1">
                  <VTextField v-model="txtSendDept"></VTextField>
                </VCol>
              </VRow>
            </VCol>
            
          </VRow>
          <VRow v-if="MESSAGE_SEND_OPTION=='test'"> 
            <VCol cols="12" md="12">
              <VRow>
                <IGridTitle :title="$t('TEST 발송 수신자 휴대폰 번호')"/>
              </VRow>
              <VRow>
                <VCol cols="12" md="4" class="pa-1">
                  <VTextField v-model="txtTestnum"></VTextField>
                </VCol>
                <VCol cols="12" md="4" class="pa-1">
                  <ILabel :label="$t('EX)010-1234-5678')"/>
                </VCol>
              </VRow>
            
            </VCol>
          </VRow>
          <VRow v-if="MESSAGE_SEND_OPTION=='send'">
              <IGridTitle :title="$t('문자 발송지역 및 대상을 선택하세요!')" />
                <template #editors />
          </VRow>
          <VRow v-if="MESSAGE_SEND_OPTION=='send'" style="height:220px">
              <VCol cols="12" md="12">
                <VRow>
                  <!-- <VCol cols="12" md="1" class="pa-1"></VCol> -->
                  <VCol cols="12" md="6" class="pa-1 searchArea">
                    <VRow>
                      <IGridTitle :title="$t('발송 대상 회사')" />
                      <template #editors />
                    </VRow>
                    <VRow>
                      <v-radio-group v-model="SEND_COM" class="d-flex justify-center" inline>
                        <VRadio label="현대중공업" value="HHI" />
                        <VRadio label="기타 회사" value="ETC" />
                      </v-radio-group>
                    </VRow>
                  </VCol>
                  <VCol cols="12" md="6" class="pa-1 searchArea">
                    <VRow>
                      <IGridTitle :title="$t('발송대상 : 관리자')">
                        <template #editors>
                          
                        </template>
                      </IGridTitle>
                      <VCheckbox v-model="chkADMINAll" label="전체" :true-value="true" :false-value="false" @change="toggleADMINAll"/>  
                    </VRow>
                    <VRow>
                      <VCheckbox v-model="chkADMIN" class="pa-1 pr-2" label="임원" true-value="'10', '11', '12', '14', '54'" false-value="" @change="handelAdminChange"/>
                      <VCheckbox v-model="chkADMIN" class="pa-1 pr-2" label="부서장" true-value="'15', '62'" false-value="" @change="handelAdminChange"/>
                      <VCheckbox v-model="chkADMIN" class="pa-1 pr-2" label="직책과장" true-value="'16'" false-value="" @change="handelAdminChange"/>
                      <VCheckbox v-model="chkADMIN" class="pa-1 pr-2" label="생산팀장" true-value="'17'" false-value="" @change="handelAdminChange"/>
                      <VCheckbox v-model="chkADMINETC" class="pa-1 pr-2" label="협력사" true-value="'C103101','C10302','C10303'" false-value="" @change="handelAdminetcChange"/>
                    </VRow>
                  </VCol>
                  <!-- <VCol cols="12" md="1" class="pa-1"></VCol> -->
                </VRow>
                <VRow>
                  <!-- <VCol cols="12" md="1" class="pa-1"></VCol> -->
                  <VCol cols="12" md="6" class="pa-1 searchArea" v-if="SEND_COM =='HHI'">
                    <VRow>
                    <IGridTitle :title="$t('현대중공업 사업부')" />
                    <VCheckbox v-model="chkHHIAll" label="전체" true-value="true" false-value="false" @update:model-value="toggleHHIAll"/>      
                    </VRow>
                    <VRow>
                      <VCheckbox v-model="chkHHI" class="pa-1 pr-2" label="임원실" true-value="'10', '11', '12', '14'" @update:model-value="toggleHHI"/><!--후에 코드 확인이 필요-->
                      <VCheckbox v-model="chkHHI" class="pa-1 pr-2" label="조선" true-value="'AC00'" @update:model-value="toggleHHI"/>
                      <VCheckbox v-model="chkHHI" class="pa-1 pr-2" label="특수선" true-value="'AE00'" @update:model-value="toggleHHI"/>                      
                      <VCheckbox v-model="chkHHI" class="pa-1 pr-2" label="경영" true-value="'AX00'" @update:model-value="toggleHHI"/>
                      
                    </VRow>
                    <VRow>
                      <VCheckbox v-model="chkHHI" class="pa-1 pr-2" label="안전경영실" true-value="'AN00'" @update:model-value="toggleHHI"/>
                      <VCheckbox v-model="chkHHI" class="pa-1 pr-2" label="엔진" true-value="'AK00'" @update:model-value="toggleHHI"/>
                      <VCheckbox v-model="chkHHI" class="pa-1 pr-2" label="재경본부" true-value="'AY00'" @update:model-value="toggleHHI"/>
                      <VCheckbox v-model="chkHHI" class="pa-1 pr-2" label="동반성장실" true-value="'AD00'" @update:model-value="toggleHHI"/>
                    </VRow>
                  </VCol>
                  <VCol cols="12" md="6" class="pa-1 searchArea" v-else-if="SEND_COM!='HHI'">
                    <VRow>
                    <IGridTitle :title="$t('기타회사')" />
                    <VCheckbox v-model="chkETCAll" label="전체" true-value="true" false-value="false" @update:model-value="toggleETCAll" />      
                    </VRow>
                    <VRow>
                      <VCheckbox v-model="chkETC" class="pa-1 pr-2" label="건설기계" true-value="'210'" @update:model-value="toggleETC"/>
                      <VCheckbox v-model="chkETC" class="pa-1 pr-2" label="일렉트릭" true-value="'200'" @update:model-value="toggleETC"/>
                      <VCheckbox v-model="chkETC" class="pa-1 pr-2" label="MOS" true-value="'230'" @update:model-value="toggleETC"/>                      
                      <VCheckbox v-model="chkETC" class="pa-1 pr-2" label="코어모션" true-value="'250'" @update:model-value="toggleETC"/>
                    </VRow>
                    <VRow>
                      <VCheckbox v-model="chkETC" class="pa-1 pr-2" label="파워시스템" true-value="'240'" @update:model-value="toggleETC"/>
                      <VCheckbox v-model="chkETC" class="pa-1 pr-2" label="현대예술관" true-value="'110'" @update:model-value="toggleETC"/>
                      <VCheckbox v-model="chkETC" class="pa-1 pr-2" label="한국조선해양" true-value="'100'" @update:model-value="toggleETC"/>
                    </VRow>
                  </VCol>
                  <VCol cols="12" md="6" class="pa-1 searchArea">
                    <VRow>
                      <IGridTitle :title="$t('발송대상 : 전직원')">
                        <template #editors>
                          
                        </template>
                      </IGridTitle>
                      <VCheckbox v-model="chkEMPAll" label="전체" true-value="Y" false-value="N" @change="toggleEMPAll" />      
                    </VRow>
                    <VRow>
                      <VCheckbox v-model="chkEMP1" class="pa-1 pr-2" label="전임직원" true-value="Y" false-value="N" @change="EMP1Change"/>
                      <VCheckbox v-model="chkEMP2" class="pa-1 pr-2" label="협력사 전직원" true-value="Y" false-value="N" @change="EMP2Change"/>
                    </VRow>
                  </VCol>
                  <!-- <VCol cols="12" md="1" class="pa-1"></VCol> -->
                </VRow>
              </VCol> 
          </VRow>
        <VRow style="height:250px" class="pt-2">
          <RealGrid
                ref="grdMainProps1"
                :grid-view-option="grdProps1.gridViewOption"
                :keys="grdProps1.keys"
                :fields="grdProps1.fields"
                :columns="grdProps1.columns"
                :column-layout="grdProps1.columnLayout"
              />
        </VRow>
        </VRow>
      </v-card-text>
    </v-card>
  </v-dialog>
  <SPPHE0010_POPUP_02 ref="SPPHE0010_POPUP02" @seldata="selectRecive"/>
  <SPPHE0010_POPUP_03 ref="SPPHE0010_POPUP03" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 250px);
  //overflow-y: auto;
  > div {
    // min-height: 700px;
  }
}
</style>