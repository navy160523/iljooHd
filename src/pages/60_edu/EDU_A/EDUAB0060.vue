<!--
  화면명 : 자율수강신청
  화면개요 : 수강신청 및 수상신청 승인을 할 수 있는 페이지
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi, getCompanyList,commonSendSMS } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUAB0060Tab01Pop01 from '@/pages/60_edu/EDU_A/EDUAB0060Tab01Pop01.vue'
import EDUAB0060Tab02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0060Tab02Pop01.vue'
import EDUAB0060Tab02Pop02 from '@/pages/60_edu/EDU_A/EDUAB0060Tab02Pop02.vue'

import _ from 'lodash'

defineOptions({
  name: '60_edu-EDU_A-EDUAB0060',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdTab01Main = ref(null)
const grdTab02Main = ref(null)
const searchArea = ref(null)
const tab = ref('one')
const eDUAB0060Tab01Pop01 = ref(null)
const eDUAB0060Tab02Pop01 = ref(null)
const eDUAB0060Tab02Pop02 = ref(null)
const deptPopup = ref(null)

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv, //회사 구분
  DVIISION : '',    //분류
  CURR_ID : '',     //교육명
  EDATE_FROM : dayjs(new Date()).format('YYYY-MM-DD'),  //교육기간(시작)
  EDATE_TO : dayjs(new Date().setMonth(new Date().getMonth() + 2)).format('YYYY-MM-DD'),  //교육기간(끝)
  STATUS : '',      //진행상태
})

const searchParams2 = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  REQ_STATUS : '',  //진행상태
  DATE_FROM : dayjs(new Date()).format('YYYY-MM-DD'),  //교육기간(시작)
  DATE_TO : dayjs(new Date().setMonth(new Date().getMonth() + 2)).format('YYYY-MM-DD'),  //교육기간(끝)
  REQ_ORGN_NM : '',     //신청조직명        
  REQ_ORGN_CD : '',     //신청조직코드
  DIVISION : '',    //분류
  CURR_ID : ''      //교육명
})


//근로자 정기안전보건교육
const grdTab01MainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'STATUS', dataType: 'text', width:'50', header: { text: t('진행상태') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'DIVISION', dataType: 'text', width:'50', header: { text: t('분류') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, mergeRule: { "criteria": "value" } },
    { fieldName: 'CURR_ID', dataType: 'text', width:'130', header: { text: t('교육명') }, styleName:'left-column', editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, mergeRule: { "criteria": "value" } },
    { fieldName: 'EPLACE_NM', dataType: 'text', header: { text: t('교육장소') }, editable: false },      
    { fieldName: 'EDU_DATE_TIME', dataType: 'text', width:'110', header: { text: t('교육기간') }, styleName:'rg_underLine', editable: false },
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('교육시간') }, editable: false },
    { fieldName: 'REQ_FROMTO', dataType: 'text', width:'110', header: { text: t('신청기간 (From~To)') }, editable: false },
    { fieldName: 'LEAD_TIME', dataType: 'text', width:'50', header: { text: t('학습 시간(분)') }, styleName:'right-column', editable: false},
    { fieldName: 'REQ_BTN', dataType: 'text', editable:false,
      header: { text: t('신청') }, width: '40',
      renderer:{
        type:"button"
      }
    },
    { fieldName: 'EDUPOSSIBLE_NUM', dataType: 'text', width:'50', header: { text: t('정원 (명)') }, styleName:'right-column', editable: false },
    { fieldName: 'TARGET_CNT', dataType: 'text', width:'50', header: { text: t('승인 인원') }, styleName:'right-column', editable: false },
    { fieldName: 'REQ_CNT', dataType: 'text', width:'50', header: { text: t('신청 인원') }, styleName:'right-column', editable: false },
    { fieldName: 'MORGN_ID', dataType: 'text', header: { text: t('주관부서') }, styleName:'left-column', editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, editable: false, visible: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('EDUTIME_SERIAL') }, editable: false, visible: false },
    { fieldName: 'EDU_CONTENT', dataType: 'text', header: { text: t('상세교육명칭') }, editable: false, visible: false },
    { fieldName: 'REQ_ALL_CNT', dataType: 'text', header: { text: t('개설요청 건수') }, editable: false, visible: false },
    { fieldName: 'CURR_NM', dataType: 'text', header: { text: t('CURR_NM') }, editable: false, visible: false },
    { fieldName: 'CRITERIA', dataType: 'text', header: { text: t('CRITERIA') }, editable: false, visible: false },
    { fieldName: 'TARGET', dataType: 'text', header: { text: t('TARGET') }, editable: false, visible: false },
    { fieldName: 'INTRODUCTION', dataType: 'text', header: { text: t('INTRODUCTION') }, editable: false, visible: false },
    { fieldName: 'CONTENTS', dataType: 'text', header: { text: t('CONTENTS') }, editable: false, visible: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('REMARK') }, editable: false, visible: false },
    { fieldName: 'REQUEST_YN', dataType: 'text', header: { text: t('REQUEST_YN') }, editable: false, visible: false },
  ],
  columns: [],
})

//관리감독자 정기안전보건교육
const grdTab02MainProps  = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    { fieldName: 'DIVISION', dataType: 'text', width:'50', header: { text: t('분류') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, mergeRule: { "criteria": "value" } },
    { fieldName: 'CURR_NM', dataType: 'text',  width:'180', header: { text: t('교육명') }, styleName:'left-column', mergeRule: { "criteria": "value" }, editable: false },
    { fieldName: 'EDU_DATETIME', dataType: 'text', width:'160', header: { text: t('교육기간') }, mergeRule: { "criteria": "value" }, editable: false },
    { fieldName: 'EPLACE_NM', dataType: 'text', width:'175', header: { text: t('교육장소') }, styleName:'left-column', editable: false },
    { fieldName: 'ADD_REQ_COUNT', dataType: 'text', width:'50', header: { text: t('추가개설요청건수') },
      mergeRule: { "criteria": "value" }, styleName:'right-column rg_underLine', editable: false, visible: false },
    { fieldName: 'EDUPOSSIBLE_NUM', dataType: 'text', width:'50', header: { text: t('정원(명)') }, styleName: 'right-column', mergeRule: { "criteria": "value" }, editable: false },
    { fieldName: 'REQ_ORGN_NM', dataType: 'text', width:'100', header: { text: t('신청조직') }, styleName:'left-column rg_underLine', editable: false },
    { fieldName: 'REQ_DATE', dataType: 'text', header: { text: t('신청일자') }, editable: false },
    { fieldName: 'REQ_PERSON_CNT', dataType: 'text', width:'50', header: { text: t('신청인원') }, styleName:'right-column', editable: false },
    { fieldName: 'APPRO_PERSON_CNT', dataType: 'text', width:'50', header: { text: t('승인인원') }, styleName:'right-column', editable: false },
    { fieldName: 'CFM_PERSON_CNT', dataType: 'text', width:'50', header: { text: t('확정인원') }, styleName:'right-column', editable: false },
    { fieldName: 'REQ_STATUS_NM', dataType: 'text', width:'50', header: { text: t('진행상태') }, editable: false },
    { fieldName: 'REQ_NM', dataType: 'text', header: { text: t('신청자 성명') }, editable: false },
    //한민규 매니저 요청으로 전화번호 visible : false 처리 / 2024-06-21
    { fieldName: 'REQ_TEL', dataType: 'text', header: { text: t('전화번호') }, editable: false, visible: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('GOAL_TIME') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('BSNS_CD') }, editable: false, visible: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('YYYY') }, editable: false, visible: false },
    { fieldName: 'EDU_CONTENT', dataType: 'text', header: { text: t('EDU_CONTENT') }, editable: false, visible: false },
    { fieldName: 'REQ_ID', dataType: 'text', header: { text: t('REQ_ID') }, editable: false, visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('CURR_ID') }, editable: false, visible: false },
    { fieldName: 'REQ_BSNS', dataType: 'text', header: { text: t('REQ_BSNS') }, editable: false, visible: false },
    { fieldName: 'REQ_ORGN_CD', dataType: 'text', header: { text: t('REQ_ORGN_CD') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, editable: false, visible: false },
    { fieldName: 'REQ_STATUS', dataType: 'text', header: { text: t('REQ_STATUS') }, editable: false, visible: false },
    { fieldName: 'RET_CONTENT', dataType: 'text', header: { text: t('RET_CONTENT') }, editable: false, visible: false },
    { fieldName: 'ALL_APPRO_NUM', dataType: 'text', header: { text: t('ALL_APPRO_NUM') }, editable: false, visible: false },
    { fieldName: 'EDU_DATE_FROM', dataType: 'text', header: { text: t('EDU_DATE_FROM') }, editable: false, visible: false },
    { fieldName: 'EDU_DATE_TO', dataType: 'text', header: { text: t('EDU_DATE_TO') }, editable: false, visible: false },
    { fieldName: 'MORGN_ID', dataType: 'text', header: { text: t('MORGN_ID') }, editable: false, visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('EMP_NO') }, editable: false, visible: false },
  ],
  columns: [],
  columnLayout : []
  // columnLayout: [
  //   'DIVISION',
  //   'CURR_NM',
  //   'EDU_DATETIME',
  //   'EPLACE_NM',
  //   'ADD_REQ_COUNT',
  //   'EDUPOSSIBLE_NUM',
  //   'REQ_ORGN_NM',
  //   'REQ_DATE',
  //   'REQ_PERSON_CNT',
  //   'APPRO_PERSON_CNT',
  //   'CFM_PERSON_CNT',
  //   'REQ_STATUS_NM',
  //   {
  //     name: '신청자',
  //     direction: 'horizontal',
  //     items: ['REQ_NM'],
  //     header: { text: t('신청자') },
  //   },
  // ],
})

// 그리드 세팅

grdTab01MainProps.columns = grdTab01MainProps.fields
grdTab02MainProps.columns = grdTab02MainProps.fields

const codeList = reactive({
  division : [],//분류
  currId : [],  //교육
  status : [],  //진행상태
})

const codeList2 = reactive({
  reqStatus : [], //진행상태
  division : [],  //분류
  currId : [],    //교육
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'), //분류
    commonSearchApi({ queryId : 'EDUAB0060_SEARCH_01', param : {CMPNY_DIV : userStore.cmpnyDiv} }),//교육명
    commonSearchApi({ queryId : 'EDUAB0060_SEARCH_02', param : {CMPNY_DIV : userStore.cmpnyDiv} }) //주관부서명
  ]).then(res => {
    console.log("레스 확인",res)

    //분류 데이터 바인딩
    codeList.division = res[0].ORESULT_CUR
    codeList.division.unshift({ COD : '', TXT : '전체'})
    searchParams.DIVISION = res[0].ORESULT_CUR[0].COD

    codeList2.division = res[0].ORESULT_CUR
    searchParams2.DIVISION = res[0].ORESULT_CUR[0].COD

    //교육명 데이터 바인딩
    codeList.currId.unshift({ COD : '', TXT : '전체'})
    codeList2.currId.unshift({ COD : '', TXT : '전체'})
    searchParams.CURR_ID = codeList.currId[0].COD
    searchParams2.CURR_ID = codeList2.currId[0].COD

    //진행상태 데이터 바인딩
    codeList.status.push({COD : '', TXT : '전체'}, {COD : '2', TXT : '개설'}, {COD : '3', TXT : '확정'}, {COD : '5', TXT : '완료'})
    searchParams.STATUS = codeList.status[0].COD

    //진행상태 데이터 바인딩
    codeList2.reqStatus.push({COD : '', TXT : '전체'}, {COD : 'R', TXT : '승인대기'}, {COD : 'A', TXT : '승인'}, {COD : 'T', TXT : '반려'},
                             {COD : 'C', TXT : '확정'}, {COD : 'ZZ', TXT : '완료'}, {COD : 'AR', TXT : '추가개설요청'})
    searchParams2.REQ_STATUS = codeList2.reqStatus[0].COD
    //진행상태, 분류, 교육명 컬럼 데이터 바인딩
    grdTab01Main.value.setBindingColumn("STATUS", codeList.status, "COD", "TXT")
    grdTab01Main.value.setBindingColumn("DIVISION", codeList.division, "COD", "TXT")
    grdTab01Main.value.setBindingColumn("CURR_ID", res[1].ORESULT_CUR, "COD", "TXT")
    grdTab01Main.value.setBindingColumn("MORGN_ID", res[2].ORESULT_CUR, "COD", "TXT")
  })
}

// 구분이 바뀌면 구분에 따른 교육명 데이터 가져옴
watch(() => searchParams.DIVISION, (newValue, oldValue) => {
  if(newValue === ''){
    codeList.currId = []
    codeList.currId.unshift({ TXT:"전체", COD:"" })
    searchParams.CURR_ID = codeList.currId[0].COD
    return
  }
  commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : newValue } })
    .then(res => {
      codeList.currId = res.ORESULT_CUR
      codeList.currId.unshift({ TXT:"전체", COD:"" })
      searchParams.CURR_ID =codeList.currId[0].COD
    })
})

// 구분이 바뀌면 구분에 따른 교육명 데이터 가져옴
watch(() => searchParams2.DIVISION, (newValue, oldValue) => {
  if(newValue === ''){
    codeList2.currId = []
    codeList2.currId.unshift({ TXT:"전체", COD:"" })
    searchParams2.CURR_ID = codeList2.currId[0].COD
    return
  }
  commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : newValue } })
    .then(res => {
      codeList2.currId = res.ORESULT_CUR
      codeList2.currId.unshift({ TXT:"전체", COD:"" })
      searchParams2.CURR_ID =codeList2.currId[0].COD
    })
})

//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = async btn => {//조회
  if(btn.id === 'btnSearch'){
    if(tab.value === 'one'){
      new queryFlowHelper(vm, t)
          .setBefore(beforeSearch)
          .setQuery(searchData)
          .setAfter(afterSearch)
          .run()
    }
    else if(tab.value === 'two'){
      new queryFlowHelper(vm, t)
          .setBefore(beforeSearchSecond)
          .setQuery(searchDataSecond)
          .setAfter(afterSearchSecond)
          .run()
    }
  }else if(btn.id === 'btnAllApprove'){
    new saveFlowHelper(vm, t)
      .setGridList([grdTab02Main])
      .setBefore(beforeApprove)
      .setQuery(saveApprove)
      .setAfter(afterApprove)
      .setConfirmMessage('승인 하시겠습니까?')
      .run()
  }else if(btn.id === 'btnAllApproveCancel'){
    new saveFlowHelper(vm, t)
      .setGridList([grdTab02Main])
      .setBefore(beforeApproveCancel)
      .setQuery(saveApproveCancel)
      .setAfter(afterApproveCancel)
      .setConfirmMessage('승인취소 하시겠습니까?')
      .run()
  }
}

const beforeApprove = () => {
  let chkData = grdTab02Main.value.getGridView().getCheckedRows(true)
  if (chkData.length === 0) {
    Message.warn(t('승인할 데이터를 선택해주세요.'))
    return false
  } 

  for (let i = 0; i < chkData.length; i++) {
    let data = grdTab02Main.value.getDataProvider().getJsonRow(chkData[i]);
    
    if (data.DIVISION !== null) {
      // 승인대기가 아닌데 상태도 승인 아니면 → 에러
      if (data.REQ_STATUS_NM !== '승인대기' && data.STATUS !== '승인') {
        Message.err(t('진행상태가 승인대기 건만 승인이 가능합니다.'));
        return false;
      }
    }
  }

  // 모든 체크 항목이 조건 통과하면 true 반환
  return true;


}

const saveApprove = () => {
  let saveParams = []
  let checkedData = grdTab02Main.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdTab02Main.value.getDataProvider().getJsonRow(checkedData[i])
    if(data.DIVISION !== null && data.REQ_STATUS === 'R'){
      let saveData = {
        CMPNY_DIV : data.CMPNY_DIV,
        YEAR : data.YEAR,
        SCHEDULE_ID : data.SCHEDULE_ID,
        REQ_ID : data.REQ_ID,
        USER_ID : userStore.empNo,
        REQ_TEL : data.REQ_TEL,
        CURR_NM : data.CURR_NM
      }
      saveParams.push(saveData)
    }
  }
  console.log("승인 전 데이터 확인",saveParams)

  return commonExecuteApi({
    queryId: 'EDUAB0060_TAB02_POP01_SAVE_01',
    list: saveParams,
  }).then((res) => {
    console.log("승인 후 데이터 확인",res)

    let msg = 'HiSEs에서 신청한 교육이 승인 되었습니다.'
    //let REQ_TEL = saveParams.REQ_TEL.replaceAll('-','')
    let saveSendParams = []
    let sendSMSParams = []
    for(let i in res.list){
      //알람 메시지 발송
      if(res.list[i].REQ_TEL.length >= 10){
        let sendData = {
          CMPNY_DIV : res.list[i].CMPNY_DIV,
          EMPNO_TO : '',
          SYSCODE : '156',
          FROM_P_NO : userStore.telNo,
          TO_P_NO : res.list[i].REQ_TEL,
          TITLE : 'HiSEs에서 신청한 교육이 승인 되었습니다. \n' + res.list[i].CURR_NM,
          //"HiSEs에서 신청한 교육이 '승인' 되었습니다.\r\n'곤돌라 운전자격 (4월 2차)'"
          USER_ID : userStore.userId,
        }
        let sendSmsData = {
          EMPNO_FROM : userStore.empNo,
          EMPNO_TO : '',
          SYSCODE : '156',
          FROM_P_NO : userStore.telNo,
          TO_P_NO : res.list[i].REQ_TEL,
          TITLE : saveParams.TITLE
        }
        saveSendParams.push(sendData)
        sendSMSParams.push(sendSmsData)
      }
    }

    if(saveSendParams.length > 0 ){
      commonExecuteApi({ queryId: "NOTIFICATIONUTIL_SAVESMS", list: saveSendParams, }).then(res => {
        console.log("모바일 정보 저장 res확인",res)

        for(let i in res.list){
          sendSMSParams[i].TITLE = saveSendParams[i].TITLE.replaceAll('\n','')
          commonSendSMS(sendSMSParams[i])
        }
        Message.success(t('메시지 전송 완료'))
      })
    }
  })
}

const afterApprove = () => {
  onButtonsClick({ id: 'btnSearch' })
}


const beforeApproveCancel = () => {
  let chkData = grdTab02Main.value.getGridView().getCheckedRows(true)
  if (chkData.length === 0) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false

  }

  for (let i = 0; i < chkData.length; i++) {
    let data = grdTab02Main.value.getDataProvider().getJsonRow(chkData[i])
    if(data.DIVISION !== null){
      if (data.REQ_STATUS_NM !== '승인' && data.STATUS !== '승인대기') {
          Message.err(t('진행상태가 승인 건만 승인취소 가능합니다.'))
          return false
      }
    }
  }

  return true

}

const saveApproveCancel = () => {
  let saveParams = []
  let checkedData = grdTab02Main.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdTab02Main.value.getDataProvider().getJsonRow(checkedData[i])
    if(data.DIVISION !== null && data.REQ_STATUS === 'A'){
      let saveData = {
        CMPNY_DIV : data.CMPNY_DIV,
        YEAR : data.YEAR,
        SCHEDULE_ID : data.SCHEDULE_ID,
        REQ_ID : data.REQ_ID,
        USER_ID : userStore.empNo
      }
      saveParams.push(saveData)
    }
  }
  console.log("승인 전 데이터 확인",saveParams)

  return commonExecuteApi({
    queryId: 'EDUAB0060_TAB02_POP01_SAVE_02',
    list: saveParams,
  }).then((res) => {
    Message.success(t('승인취소 되었습니다.'))
  })
}

const afterApproveCancel = () => {
  onButtonsClick({ id: 'btnSearch' })
}


//탭 변경시 발생하는 이벤트
const tabChange = async data => {

  onButtonsClick({id : 'btnSearch'})
  console.log("탭체인지",data)
  if(tab.value === 'one'){
    // menuTitle.value.disableBtn("btnAllApprove", true)        //승인
    // menuTitle.value.disableBtn("btnAllApproveCancel", true)  //승인취소
    menuTitle.value.visibleBtn('btnAllApprove', true)
    menuTitle.value.visibleBtn('btnAllApproveCancel', true)
  }
  else if(tab.value === 'two'){
    // menuTitle.value.disableBtn("btnAllApprove", false)        //승인
    // menuTitle.value.disableBtn("btnAllApproveCancel", false)  //승인취소
    menuTitle.value.visibleBtn('btnAllApprove', true)
    menuTitle.value.visibleBtn('btnAllApproveCancel', true)
  }
}

//근로자 정기안전보건교육, 관리감독자 정기안전보건교육 그리드 클릭 이벤트
const onCellClicked = (grid, clickData) => {
  if(clickData.cellType === 'gridEmpty' || clickData.cellType === 'header'){
    return
  }
  console.log("클릭 데이터",clickData)
  if(tab.value === 'one'){
    let cd = grdTab01Main.value.getDataProvider().getJsonRow(clickData.dataRow)
    console.log("클릭한 로우 데이터",cd)
    if(clickData.fieldName === 'EDU_DATE_TIME'||clickData.fieldName === 'REQ_BTN'){
      eDUAB0060Tab01Pop01.value.openPopup({
        cd,
        CMPNY_DIV : userStore.cmpnyDiv,
        DIVISION : searchParams.DIVISION,
        CURR_ID : cd.CURR_ID,
        EDATE_FROM : dayjs(searchParams.EDATE_FROM).format('YYYYMMDD'),
        EDATE_TO : dayjs(searchParams.EDATE_TO).format('YYYYMMDD'),
        STATUS : searchParams.STATUS
      })
    }
  }else if(tab.value === 'two'){
    let cd = grdTab02Main.value.getDataProvider().getJsonRow(clickData.dataRow)
    console.log("클릭한 로우 데이터",cd)
    if(clickData.fieldName === 'ADD_REQ_COUNT' && cd.EDUPOSSIBLE_NUM !== '소계'){
      eDUAB0060Tab02Pop02.value.openPopup({
        CMPNY_DIV : cd.CMPNY_DIV,
        CURR_ID : cd.CURR_ID,
        MORGN_ID : cd.MORGN_ID,
        CURR_NM : cd.CURR_NM
      })
    }
    else if(clickData.fieldName === 'REQ_ORGN_NM' && cd.EDUPOSSIBLE_NUM !== '소계'){
      let cd = grdTab02Main.value.getDataProvider().getJsonRow(clickData.dataRow)
      eDUAB0060Tab02Pop01.value.openPopup({
        cd
      })
    }
  }
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  if(tab.value === 'one'){
    grdTab01Main.value.getDataProvider().setRows([])
  }else if(tab.value === 'two'){
    grdTab02Main.value.getDataProvider().setRows([])
  }
}

// 기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const dateFrChanged = data => {
  if(data.target.value > searchParams.EDATE_TO){
    searchParams.EDATE_TO = searchParams.EDATE_FROM
  }
}

// 기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const dateToChanged = data => {
  if(data.target.value < searchParams.EDATE_FROM){
    searchParams.EDATE_FROM = searchParams.EDATE_TO
  }
}

// 기간(FROM)이 TO보다 높을 경우 TO와 FROM값을 같게 함
const dateFrChanged2 = data => {
  if(data.target.value > searchParams2.EDATE_TO){
    searchParams2.EDATE_TO = searchParams2.EDATE_FROM
  }
}

// 기간(TO)이 FROM보다 낮을 경우 TO와 FROM값을 같게 함
const dateToChanged2 = data => {
  if(data.target.value < searchParams2.EDATE_FROM){
    searchParams2.EDATE_FROM = searchParams2.EDATE_TO
  }
}

//부서 조회 팝업 오픈
const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv, 
    ASGN_NM : searchParams2.REQ_ORGN_NM,
    HSE_SYS : 'N',
  })
}

//부서 조회 선택 데이터
const onDeptSelected = row => {
  console.log("로우 확인",row)
  searchParams2.REQ_ORGN_NM = row.ASGN_SHRT_NM
  searchParams2.REQ_ORGN_CD = row.ASGN_CD
}

//널 체크 이벤트
const isNullCheck = data => {
return (data === undefined || data === null || data === '') ? true : false
}
//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//근로자 정기안전보건교육 조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//근로자 정기안전보건교육 조회
const searchData = () => {
  const searchParamsCopy = {
    CMPNY_DIV : userStore.cmpnyDiv,
    DIVISION : searchParams.DIVISION,
    CURR_ID : searchParams.CURR_ID,
    EDATE_FROM : dayjs(searchParams.EDATE_FROM).format('YYYYMMDD'),
    EDATE_TO : dayjs(searchParams.EDATE_TO).format('YYYYMMDD'),
    STATUS : searchParams.STATUS
  }
  console.log("조회 파라미터 ::::::: ",searchParamsCopy)
  return commonSearchApi({ queryId : 'EDUAB0060_TAB01_SEARCH_01', param: searchParamsCopy })
}

//근로자 정기안전보건교육 조회 후
const afterSearch = res => {
  console.log("조회된 데이터 확인",res)
  grdTab01Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  gridColorSetting('grd1')
}

//##################################################### Second #####################################################################
//관리감독자 정기안전보건교육 조회 전 유효성 검사
const beforeSearchSecond = () => {
  grdTab02Main.value.setBindingColumn("DIVISION", codeList.division, "COD", "TXT")
  return true
}

//관리감독자 정기안전보건교육 조회
const searchDataSecond = () => {
  const searchParamsCopy = {
    CMPNY_DIV : userStore.cmpnyDiv,
    REQ_STATUS : searchParams2.REQ_STATUS,
    REQ_ORGN_CD : searchParams2.REQ_ORGN_CD,
    DATE_FROM : dayjs(searchParams2.DATE_FROM).format('YYYYMMDD'),
    DATE_TO : dayjs(searchParams2.DATE_TO).format('YYYYMMDD'),
    DIVISION : searchParams2.DIVISION,
    CURR_ID : searchParams2.CURR_ID,
  }

  console.log("조회 파라미터 ::::::: ",searchParams2)
  return commonSearchApi({ queryId : 'EDUAB0060_TAB02_SEARCH_01', param: searchParamsCopy })
}

//관리감독자 정기안전보건교육 조회 후
const afterSearchSecond = async res => {
  console.log("조회된 데이터 확인",res)
  res.ORESULT_CUR.forEach(val => {
    if(isNullCheck(val.CURR_NM)){
      val.CURR_NM = '　'
    }
  })
  await grdTab02Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  await gridColorSetting('grd2')
  for(let i = 0; i < grdTab02Main.value.getDataProvider().getRows().length; i++){
    // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
    //let grdMainData = grdTab02Main.value.getGridView().getValues(i)
    let grdMainData = grdTab02Main.value.getRowData(i)
    if(grdMainData.DIVISION === '소계'){
      grdTab02Main.value.getDataProvider().setValue(i, "CURR_NM", null)
      grdTab02Main.value.getDataProvider().setValue(i, "EDU_DATETIME", null)
      grdTab02Main.value.getDataProvider().setValue(i, "ADD_REQ_COUNT", null)
      grdTab02Main.value.getDataProvider().setValue(i, "DIVISION", null)
      grdTab02Main.value.getDataProvider().setValue(i, "EDUPOSSIBLE_NUM", '소계')
    }
    
  }
}
const gridColorSetting = grdGubun => {
  
  if(grdGubun === 'grd1'){
    grdTab01Main.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = {}
      if(dataCell.dataColumn.fieldName === 'EDU_DATE_TIME'){
        ret.style = {color: 'blue'}
      }
      if(dataCell.dataColumn.fieldName === 'STATUS'){
        switch(dataCell.value){
          case '1':
            ret.style = {color : '#8C8C8C'}//Gray
            return ret
          case '2':
            ret.style = {color : '#0B7903'}//Green
            return ret
          case '3':
            ret.style = {color : '#AB8212'}//Brown
            return ret
          case '4':
            ret.style = {color : '#FF0000'}//Red
            return ret
          case '5':
            ret.style = {color : '#0100FF'}//Blue
            return ret
          default:
            ret.style = {color : '#000000'}//Black
            return ret
        }
      }
      
      return ret
    })
  }
  else if(grdGubun === 'grd2'){
    grdTab02Main.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
      var ret = {}
      var CHK_YN = grid.getValue(item.index, "EDUPOSSIBLE_NUM")
      if (CHK_YN == '소계') {               
        ret.style = { background:"#C6C6C6" }
      }
      return ret
    })

    grdTab02Main.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = {}
      if(dataCell.dataColumn.fieldName === 'ADD_REQ_COUNT' || dataCell.dataColumn.fieldName === 'REQ_ORGN_NM'){
        ret.style = {color: 'blue'}
      }
      
      return ret
    })
  }

}

//*****************************************조회 영역(종료)***********************************************************/


const setButtons = () => {
  // menuTitle.value.disableBtn("btnAllApprove", true)        //승인
  // menuTitle.value.disableBtn("btnAllApproveCancel", true)  //승인취소
  menuTitle.value.visibleBtn('btnAllApprove', false)
  menuTitle.value.visibleBtn('btnAllApproveCancel', false)
}

onMounted( () => {
  initCodeList(),
  setButtons(),
  onButtonsClick({id : 'btnSearch'})
})
</script>

<template>
  <v-card class="pa-3 fill-height">
      <!-- 타이틀 -->    
        <v-card-title class="pa-0">
          <IMenuTitle
            ref="menuTitle"
            :title="$t(useLogsStore().menuId)"
            :button-list="['btnSearch','btnAllApprove','btnAllApproveCancel']"
            @click-button="onButtonsClick"
          />
        </v-card-title>
        <VTabs v-model="tab" @update:model-value="tabChange">
          <VTab value="one">수강신청</VTab>
          <VTab v-if="userStore.authGrpCd.includes('GRP00414') || userStore.authGrpCd.includes('GRP00369')" value="two">수강신청 승인</VTab>
        </VTabs>
        <VWindow v-model="tab">
          <!--수강신청------------------------------------------------------------------------------------------>
          <VWindowItem value="one">
            <!-- 조회조건 -->
            <v-card-text class="pa-0 content-area">
              <div class="d-flex flex-column fill-height">
                <v-sheet class="searchArea flex-column">
                  <div class="d-flex">
                    <i-select
                      :label="$t('분류')"
                      width="200px"
                      v-model="searchParams.DIVISION"
                      :items="codeList.division"
                      item-title="TXT"
                      item-value="COD"
                      @update:model-value="gridRefresh"
                    />
                    <i-select
                      :label="$t('교육명')"
                      width="200px"
                      v-model="searchParams.CURR_ID"
                      :items="codeList.currId"
                      item-title="TXT"
                      item-value="COD"
                      @update:model-value="gridRefresh"
                    />
                    <i-input
                      :label="$t('교육기간')"
                      labelWidth="50px" 
                      width="213px" 
                      margin="10px"
                      v-model="searchParams.EDATE_FROM"
                      type="date"
                      @blur="dateFrChanged"
                      @update:model-value="gridRefresh"
                    />
                    <i-input
                      :label="$t('-')"
                      width="190px"
                      v-model="searchParams.EDATE_TO"
                      type="date"
                      @blur="dateToChanged"
                      @update:model-value="gridRefresh"
                    />
                    <i-select
                      :label="$t('진행상태')"
                      width="200px"
                      v-model="searchParams.STATUS"
                      :items="codeList.status"
                      item-title="TXT"
                      item-value="COD"
                      @update:model-value="gridRefresh"
                    />
                  </div>
                  <div class="d-flex">
                    
                  </div>
                </v-sheet>
                <div style="height:88%">
                  <!-- 메인그리드 -->
                  <RealGrid
                    ref="grdTab01Main"
                    :grid-view-option="grdTab01MainProps.gridViewOption"
                    :fields="grdTab01MainProps.fields"
                    :columns="grdTab01MainProps.columns"
                    @onCellClicked="onCellClicked"
                  />
                </div>
              </div>
            </v-card-text> 
          </VWindowItem>
          <!--수강신청 승인------------------------------------------------------------------------------------------>
          <VWindowItem value="two">
            <!-- 조회조건 -->
            <v-card-text class="pa-0 content-area">
              <div class="d-flex flex-column fill-height">
                <v-sheet class="searchArea flex-column">
                  <div class="d-flex">
                    <i-select
                      :label="$t('진행상태')"
                      width="200px"
                      v-model="searchParams2.REQ_STATUS"
                      :items="codeList2.reqStatus"
                      item-title="TXT"
                      item-value="COD"
                      @update:model-value="gridRefresh"
                    />
                    <i-input
                      :label="$t('교육기간')"
                      labelWidth="50px" 
                      width="213px" 
                      margin="10px"
                      v-model="searchParams2.DATE_FROM"
                      type="date"
                      @blur="dateFrChanged2"
                      @update:model-value="gridRefresh"
                    />
                    <i-input
                      :label="$t('-')"
                      width="190px"
                      v-model="searchParams2.DATE_TO"
                      type="date"
                      @blur="dateToChanged2"
                      @update:model-value="gridRefresh"
                    />
                    <i-input
                      :label="$t('신청조직')"
                      width="200px"
                      v-model="searchParams2.REQ_ORGN_NM"
                      append-inner-icon="mdi-magnify"
                      @click:appendInner="openDeptPopup()"
                      @keydown.enter="e => {openDeptPopup()}"
                      @update:modelValue="e => {searchParams2.REQ_ORGN_CD = null}"
                      @update:model-value="gridRefresh"
                    />
                    <i-input
                      v-model="searchParams2.REQ_ORGN_CD"
                      :readonly="true"
                    />
                  </div>
                  <div class="d-flex mt-2">
                    <i-select
                      :label="$t('분　　류')"
                      width="200px"
                      v-model="searchParams2.DIVISION"
                      :items="codeList2.division"
                      item-title="TXT"
                      item-value="COD"
                      @update:model-value="gridRefresh"
                    />
                    <i-select
                      :label="$t('교​​육​명')"
                      width="200px"
                      v-model="searchParams2.CURR_ID"
                      :items="codeList2.currId"
                      item-title="TXT"
                      item-value="COD"
                      @update:model-value="gridRefresh"
                    />
                  </div>
                </v-sheet>
                <div style="height:88%">
                  <!-- 메인그리드 -->
                  <RealGrid
                    ref="grdTab02Main"
                    :grid-view-option="grdTab02MainProps.gridViewOption"
                    :fields="grdTab02MainProps.fields"
                    :columns="grdTab02MainProps.columns"
                    :column-layout="grdTab02MainProps.columnLayout"
                    @onCellClicked="onCellClicked"
                  />
                </div>
              </div>
            </v-card-text> 
          </VWindowItem>
          <!-- 정기안전보건교육------------------------------------------------------------------------------------------>
        </VWindow>
      <DeptPopup
        ref="deptPopup"
        @selected="onDeptSelected"
      /> 
  </v-card>
  <EDUAB0060Tab01Pop01 ref="eDUAB0060Tab01Pop01" @close="onButtonsClick({id : 'btnSearch'})" />
  <EDUAB0060Tab02Pop01 ref="eDUAB0060Tab02Pop01" @close="onButtonsClick({id : 'btnSearch'})"/>
  <EDUAB0060Tab02Pop02 ref="eDUAB0060Tab02Pop02" @close="onButtonsClick({id : 'btnSearch'})" />
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (225px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>