<!--
  화면명 : 수강 신청 등록
  화면개요 : 수강을 신청 또는 신청취소할 수 있는 팝업
-->
<script setup>
//str == 팝업데이터(grdSubDataRow)
//_dt1311C == 파라미터(_Parameters)
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonExecuteApi2, commonSendApi } from '@hiway/api/commonApi'
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
import IUpload from "@/components/IUpload.vue"

//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const empPopup = ref(null)
const dialog = ref(false)
const grdMain = ref(null)
const emit = defineEmits(['close']) 
const grdSub = ref(null) 
const popupButtons = ref(null)
let _Parameters = null
let grdSubRowIndex = ref(null)
const fileUpload = ref(null)
let grdSubDataRow = []
let REQ_LIST = ref('수강인원 목록 (총 0명)')
const popupData = reactive({
  CURR_NM : '',         //교육명
  COUNT : '',           //정원/신청인원/잔여
  EDU_DATE_FROM : '',   //교육기간(FROM)
  EDU_DATE_TO : '',     //교육기간(TO)
  STATUS : '',          //진행상태
  RET_CONTENT : '',     //반려사유
  REQ_NM : '',          //신청자
  REQ_TEL1 : '',        //신청자 전화번호1
  REQ_TEL2 : '',        //신청자 전화번호2
  REQ_TEL3 : '',        //신청자 전화번호3

  EDU_DESC : '',        //교육내용
  REMARK : '',          //비고
})

//코드리스트
const codeList = reactive({
  status : []
})

//근로자 정기안전보건교육
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  keys : [''],
  fields : [
    { fieldName: 'ORGN_NM', dataType: 'text', header: { text: t('소속') }, styleName: "left-column", editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사용자 ID') }, editable: false },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') }, editable: false, visible: false },
    { fieldName: 'ORGN_CD', dataType: 'text', header: { text: t('소속코드') }, editable: false, visible: false },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', header: { text: t('직책코드') }, editable: false, visible: false },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('직위코드') }, editable: false, visible: false },
    { fieldName: 'REQ_ID', dataType: 'text', header: { text: t('신청순번') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, editable: false, visible: false },
  ],
  columns: [],
})

//근로자 정기안전보건교육
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'EDU_DATE_TIME', dataType: 'text', width:'200', header: { text: t('교육기간') }, editable: false},
    { fieldName: 'EDU_TIME', dataType: 'text', header: { text: t('교육시간') }, editable: false},
    { fieldName: 'REQ_FROMTO', dataType: 'text', width:'200', header: { text: t('신청기간(From~To)') }, editable: false},
    { fieldName: 'LEAD_TIME', dataType: 'text', width:'60', header: { text: t('학습시간') }, editable: false},
    { fieldName: 'EDUPOSSIBLE_NUM', dataType: 'text', width:'60', header: { text: t('정원(명)') }, editable: false},
    { fieldName: 'TARGET_CNT', dataType: 'text', width:'60', header: { text: t('승인인원') }, editable: false},
    { fieldName: 'REQ_CNT', dataType: 'text', width:'60', header: { text: t('신청인원') }, editable: false},
    { fieldName: 'MORGN_ID', dataType: 'text', header: { text: t('주관부서') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, editable: false, visible: false },
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('진행상태') }, editable: false, visible: false },
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('분류') }, editable: false, visible: false },
    { fieldName: 'EDU_TITLE', dataType: 'text', header: { text: t('교육명') }, editable: false, visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('교육ID') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, editable: false, visible: false },
    { fieldName: 'EDUTIME_SERIAL', dataType: 'text', header: { text: t('EDUTIME_SERIAL') }, editable: false, visible: false },
    { fieldName: 'REQ_ID', dataType: 'text', header: { text: t('REQ_ID') }, editable: false, visible: false },
    { fieldName: 'REQUEST_YN', dataType: 'text', header: { text: t('REQUEST_YN') }, editable: false, visible: false },

    { fieldName: 'CRITERIA', dataType: 'text', header: { text: t('CRITERIA') }, editable: false, visible: false },
    { fieldName: 'TARGET', dataType: 'text', header: { text: t('TARGET') }, editable: false, visible: false },
    { fieldName: 'INTRODUCTION', dataType: 'text', header: { text: t('INTRODUCTION') }, editable: false, visible: false },
    { fieldName: 'CONTENTS', dataType: 'text', header: { text: t('CONTENTS') }, editable: false, visible: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('REMARK') }, editable: false, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields


const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'), //분류
    commonSearchApi({ queryId : 'EDUAB0060_SEARCH_02', param : {CMPNY_DIV : userStore.cmpnyDiv} }) //주관부서명
  ]).then(res => {
    grdSub.value.setBindingColumn("MORGN_ID", res[1].ORESULT_CUR, "COD", "TXT")
    codeList.status.push({COD : 'S', TXT : '작성중'}, {COD : 'A', TXT : '승인'}, {COD : 'R', TXT : '신청완료'},
                         {COD : 'T', TXT : '반려'}, {COD : 'C', TXT : '확정'}, {COD : 'ZZ', TXT : '교육완료'})
  })
}
//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = async (data) => {
  console.log("받아온 데이터",data)
  initCodeList()
  _Parameters = data
  popupData.EDU_DESC = ''
  popupData.REMARK = ''
  popupData.EDU_DESC = _Parameters.EDU_DESC
  popupData.EDU_DESC = _Parameters.REMARK
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])

  
  searchData()
  // //grdSub 그리드 조회
  // await commonSearchApi({ queryId : 'EDUAB0060_TAB01_SEARCH_01', param: _Parameters }).then(res => {
  //   grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  //   if(res.ORESULT_CUR.length !== 0){
  //     grdSub.value.getGridView().setFocus(0)
  //   }
  // })
  dialog.value = true
  //grdSub.value.getGridView().setFocus(1)
}

//조회
const searchData = async () => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
  //grdSub 그리드 조회
  await commonSearchApi({ queryId : 'EDUAB0060_TAB01_SEARCH_01', param: _Parameters }).then(res => {
    console.log("서브 그리드 조회 ::: ",res)
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    for(let i = 0; i < grdSub.value.getDataProvider().getRows().length; i++){
      // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
      // if(_Parameters.SCHEDULE_ID === grdSub.value.getGridView().getValues(i).SCHEDULE_ID){
      if(_Parameters.SCHEDULE_ID === grdSub.value.getRowData(i).SCHEDULE_ID){
        console.log('i값 확인',i)
        grdSub.value.getGridView().setCurrent({ dataRow: i})
      }
    }
  })
}

//grdSub 로우 변경시 이벤트
const grdSubRowChanged = async (grid, oldIdx, newIdx) => {
  console.log("올드인덱스 확인",oldIdx)
  console.log("뉴인덱스 확인",newIdx)
  if(newIdx === -1){
    return
  }

  if(newIdx !== undefined){
    grdSubRowIndex.value = newIdx
  }

  grdMain.value.getDataProvider().setRows([])
  Object.keys(popupData).forEach(key => {
    popupData[key] = ''
  })
  let rowData = grdSub.value.getDataProvider().getJsonRow(grdSubRowIndex.value)

  let searchParams = {
    CMPNY_DIV : rowData.CMPNY_DIV,
    CURR_ID : rowData.CURR_ID,
    YEAR : rowData.YEAR,
    SCHEDULE_ID : rowData.SCHEDULE_ID,
    REQ_BSNS : userStore.bsnsCd,//'AX00',
    // 2024.08.12 박용훈 직영 여부는 orgnDiv가 아닌 userDiv 라서 수정함
    //REQ_ORGN_CD : userStore.orgnDiv === 'A' ? userStore.deptCd : userStore.asgnCd,//'XBS0'
     REQ_ORGN_CD : userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,//'XBS0'
  }

  //REQ_ID 조회
  await commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_SEARCH_01', param: searchParams }).then(res => {
    console.log("REQ_ID 조회",res)
    if(res.ORESULT_CUR.length === 0){
      searchParams.REQ_ID = ''
    }else{
      searchParams.REQ_ID = res.ORESULT_CUR[0].REQ_ID
    }
  })
  //TDB1041C01
  //팝업데이터 조회 == C# [_dt1311C]
  console.log("팝업데이터 조회 파람 ::::: ",searchParams)
  commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SEARCH_03', param: searchParams }).then(res => {
    console.log("팝업데이터 조회 결과 ::::: ",res)
    grdSubDataRow = []
    grdSubDataRow.push(res.ORESULT_CUR[0])
    grdSubDataRow[0].USER_ID = userStore.userId
    popupData.CURR_NM = res.ORESULT_CUR[0].CURR_NM
    popupData.EDU_DATE_FROM = dayjs(res.ORESULT_CUR[0].EDU_DATE_FROM).format('YYYY-MM-DD')
    popupData.EDU_DATE_TO = dayjs(res.ORESULT_CUR[0].EDU_DATE_TO).format('YYYY-MM-DD')
    popupData.STATUS = res.ORESULT_CUR[0].REQ_STATUS
    popupData.CONTENT = res.ORESULT_CUR[0].RET_CONTENT
    popupData.REQ_NM = res.ORESULT_CUR[0].REQ_NM
    popupData.EDU_DESC = _Parameters.EDU_DESC
    popupData.REMARK = _Parameters.REMARK
    if(!isNullCheck(res.ORESULT_CUR[0].REQ_TEL)){
      let REQ_TEL_LIST = res.ORESULT_CUR[0].REQ_TEL.split('-')
      popupData.REQ_TEL1 = REQ_TEL_LIST[0]
      popupData.REQ_TEL2 = REQ_TEL_LIST[1]
      popupData.REQ_TEL3 = REQ_TEL_LIST[2]
    }
    if(isNullCheck(grdSubDataRow[0].REQ_STATUS)){
      grdSubDataRow[0].REQ_STATUS = 'S'
      popupData.STATUS = grdSubDataRow[0].REQ_STATUS
    }
    if(isNullCheck(grdSubDataRow[0].ATTACH_KEY)){
      fileUpload.value.setGuid()
      grdSubDataRow[0].ATTACH_KEY = fileUpload.value.guid
      fileUpload.value.clearGrid()
    }else{
      fileUpload.value.setGuid(grdSubDataRow[0].ATTACH_KEY)
      fileUpload.value.onButtonsClick({ id: "btnSearch" })
    }
  })

  //팝업데이터-정원/신청인원/잔여 조회
  await commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_SEARCH_02', param: searchParams }).then(res => {
    popupData.COUNT = res.ORESULT_CUR[0].CNT
  })

  //메인그리드 조회
  await commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SEARCH_02', param: searchParams }).then(res => {
    console.log("메인그리드 조회 결과 ::: ",res)
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    REQ_LIST.value = '수강인원 목록 (총 ' + res.ORESULT_CUR.length + '명)'
  })

  // 실제 테스트 시 주석 해제해야함$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  //popupButtons.value.disableBtn("btnUpdate", false)      //저장
  //popupButtons.value.disableBtn("btnCourseReq", false)   //수강신청
  //popupButtons.value.disableBtn("btnReqCancel", false)   //신청취소
  setButtons()

}

//버튼 세팅
const setButtons = () => {
  console.log("버튼 세팅 전 파라미터 확인",_Parameters)
  console.log("버튼 세팅 전 진행상태 확인",popupData.STATUS)
  if(_Parameters.STATUS === '2' && (popupData.STATUS === 'S' || popupData.STATUS === 'R')){
    let fRow = grdSub.value.getFocusedRowData()
    console.log("버튼 세팅 전 fRow 확인",fRow)
    if(fRow.REQUEST_YN !== 'Y'){
      popupButtons.value.disableBtn("btnUpdate", true)     //저장
      popupButtons.value.disableBtn("btnCourseReq", true)  //수강신청
      popupButtons.value.disableBtn("btnReqCancel", true)  //신청취소
    }else{
      popupButtons.value.disableBtn("btnUpdate", false)      //저장
      if(_Parameters.REQ_ID !== ''){
        popupButtons.value.disableBtn("btnReqCancel", false) //신청취소
      }else{
        popupButtons.value.disableBtn("btnReqCancel", true)  //신청취소
      }
      if(popupData.STATUS === 'S'){
        if(isNullCheck(_Parameters.REQ_ID)){
          popupButtons.value.disableBtn("btnCourseReq", true)  //수강신청
        }else{
          popupButtons.value.disableBtn("btnCourseReq", false) //수강신청
        }
      }
      if(popupData.STATUS !== 'S'){
        popupButtons.value.disableBtn("btnCourseReq", true)
      }
    }
  }else{
    popupButtons.value.disableBtn("btnUpdate", true)     //저장
    popupButtons.value.disableBtn("btnCourseReq", true)  //수강신청
    popupButtons.value.disableBtn("btnReqCancel", true)  //신청취소
  }
}

//교육내용 버튼 이벤트
const onPopButtonsClick = btn => {
  if(btn.id === 'btnUpdate'){
    btnUpdate()
  }
  else if(btn.id === 'btnCourseReq'){
    btnCourseReq()
  }
  else if(btn.id === 'btnReqCancel'){
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('선택된 데이터를 삭제하시겠습니까?')
      .setGridList([grdSub])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
  else if(btn.id === 'btnClose'){
    dialog.value = false
    fileUpload.value.clearGrid()
    let fRow = grdSub.value.getFocusedRowData()
    console.log('send fRow',fRow)
    if(isNullCheck(fRow)){
      return
    }
    emit('close', fRow)
  }
}

//수강인원 목록 버튼 이벤트
const onGrdButtonsClick = btn => {
  if(btn.id === 'btnCrsPersAdd'){
    openEmpPopup()
  }else if(btn.id === 'btnCrsPersDelete'){
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeDelete2)
      .setQuery(deleteData2)
      .setAfter(afterDelete2)
      .run()
  }
}

//정원/신청인원/잔여 조회
const searchCnt = () => {
  // if(isNullCheck(grdSubRowIndex.value)){
  //   fRow = grdSub.value.getFocusedRowData()
  // }else{
  //   grdSub.value.getGridView().setFocus(grdSubRowIndex.value)
  //   fRow = grdMain.value.getGridView().getValues(grdSubRowIndex.value)
  // }
  // let searchParams = {
  //   CMPNY_DIV : fRow.CMPNY_DIV,
  //   CURR_ID : fRow.CURR_ID,
  //   YEAR : fRow.YEAR,
  //   SCHEDULE_ID : fRow.SCHEDULE_ID,
  //   REQ_BSNS : userStore.bsnsCd,
  //   REQ_ORGN_CD : userStore.orgnDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  // }

  // //팝업데이터-정원/신청인원/잔여 조회
  // commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_SEARCH_02', param: searchParams }).then(res => {
  //   popupData.COUNT = res.ORESULT_CUR[0].CNT
  // })
}

const SetSaveDataToDataTable = () => {
  grdSubDataRow[0].REQ_BSNS = isNullCheck(grdSubDataRow[0].REQ_BSNS) === false ? grdSubDataRow[0].REQ_BSNS : userStore.bsnsCd
  // 2024.08.19 박용훈 userStore.orgnDiv 가 아닌 userStore.userDiv 임
  //if(userStore.orgnDiv === 'A'){
  if(userStore.userDiv === 'A'){
    grdSubDataRow[0].REQ_ORGN_CD = isNullCheck(grdSubDataRow[0].REQ_ORGN_CD) === true ? userStore.deptCd : grdSubDataRow[0].REQ_ORGN_CD
    grdSubDataRow[0].REQ_ORGN_NM = isNullCheck(grdSubDataRow[0].REQ_ORGN_NM) === true ? userStore.deptNm : grdSubDataRow[0].REQ_ORGN_NM
  }else{
    grdSubDataRow[0].REQ_ORGN_CD = isNullCheck(grdSubDataRow[0].REQ_ORGN_CD) === true ? userStore.asgnCd : grdSubDataRow[0].REQ_ORGN_CD
    grdSubDataRow[0].REQ_ORGN_NM = isNullCheck(grdSubDataRow[0].REQ_ORGN_NM) === true ? userStore.asgnNm : grdSubDataRow[0].REQ_ORGN_NM
  }
  grdSubDataRow[0].REQ_DATE = grdSubDataRow[0].REQ_ID
  grdSubDataRow[0].REQ_NM = popupData.REQ_NM
  grdSubDataRow[0].REQ_TEL = popupData.REQ_TEL1 + '-' + popupData.REQ_TEL2 + '-' + popupData.REQ_TEL3
}

//파일 업로드 버튼 이벤트
// const onFileButtonsClick = btn => {
//   if(btn.id === 'btnFileUpload'){
//     let saveParams = {
//       CMPNY_DIV : grdSubDataRow[0].CMPNY_DIV,
//       YEAR : grdSubDataRow[0].YEAR,
//       REQ_ID : grdSubDataRow[0].REQ_ID,
//       ATTACH_KEY : grdSubDataRow[0].ATTACH_KEY,
//       USER_ID : userStore.userId,
//     }

//     commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SAVE_05', list: [saveParams] })
//   }
// }

//널 체크 이벤트
const isNullCheck = data => {
return (data === undefined || data === null || data === '') ? true : false
}

//신청자명 유효성 검사
const requiredREQ_NM = val => {
  const regex = /^[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]*$/;
  if(!regex.test(val)){
    popupData.REQ_NM = popupData.REQ_NM.slice(0, -1)
  }
}

//신청자 전화번호 유효성 검사
const requiredREQ_TEL1 = val => {
  const regex = /^[0-9]*$/;
  if(!regex.test(val)){
    popupData.REQ_TEL1 = popupData.REQ_TEL1.slice(0, -1)
  }
}

const requiredREQ_TEL2 = val => {
  const regex = /^[0-9]*$/;
  if(!regex.test(val)){
    popupData.REQ_TEL2 = popupData.REQ_TEL2.slice(0, -1)
  }
}

const requiredREQ_TEL3 = val => {
  const regex = /^[0-9]*$/;
  if(!regex.test(val)){
    popupData.REQ_TEL3 = popupData.REQ_TEL3.slice(0, -1)
  }
}
//************************************************이벤트 영역(종료)*********************************************************/

//***************************************************저장 영역**************************************************************/
//확정 전 유효성 검사
const btnUpdate = async () => {
  let saveParams = []
  let arrCnt = popupData.COUNT.split('/')

  if(isNullCheck(popupData.REQ_NM)){
    Message.warn(t('신청자는 필수 입력 항목입니다.'))
    return
  }else{
    if(isNullCheck(popupData.REQ_TEL1) || isNullCheck(popupData.REQ_TEL2) || isNullCheck(popupData.REQ_TEL3)){
      Message.warn(t('신청자 전화번호는 필수 입력 항목입니다.'))
      return
    }
  }

  if(popupData.STATUS === 'S' && arrCnt.length > 0){
    if(arrCnt.length  === 3){
      let checkedRows = grdMain.value.getGridView().getCheckedRows()
      for(let i = 0; i < checkedRows.length; i++){
        if(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]).SAVE_YN === 'N'){
          saveParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
        }
      }
      if(arrCnt[2] < saveParams.length){
        let ck = ''
        ck = await vm.$swal({ 
        title: t('교육 정원을 초과하여 수강신청이 불가 합니다. \n 교육 추가개설을 요청 하시겠습니까?'), 
        showCancelButton: true,
        })
        if(ck.isConfirmed === false){
          return;
        }else{
          let saveParams = {
            CMPNY_DIV : grdSubDataRow[0].CMPNY_DIV,
            CURR_ID : grdSubDataRow[0].CURR_ID,
            MORGN_ID : grdSubDataRow[0].MORGN_ID,
            USER_ID : userStore.userId
          }
          commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SAVE_01', list: [saveParams] }).then(() => {
            Message.success(t('추가 개설 요청 완료'))
            return
          })

        }
      }
    }
  }
  saveData()
}

//_dt1311C === grdSubDataRow
const saveData = async () => {
  SetSaveDataToDataTable()
  let result = true
  let ck = ''
  ck = await vm.$swal({ 
  title: t('저장하시겠습니까?'), 
  showCancelButton: true,
  })
  if(ck.isConfirmed === true){
    //DB1312C_SAVE_01#####
    let _grdSubDataRow = _.cloneDeep(grdSubDataRow)
    console.log('팝업데이터 저장 파람',_grdSubDataRow)
    await commonExecuteApi2({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SAVE_02', list: _grdSubDataRow }).then(res => {
      console.log('팝업데이터 저장 결과',res)
      //if(res.OUT_RES_COD !== 0){ // 실제 테스트 시 주석 해제해야 함$$$$$$$$
        //Message.err(t('선택한 교육은 수강 신청 기간이 아닙니다.'))//000044
        //result = false
      //}
      if(isNullCheck(grdSubDataRow[0].REQ_ID)){
        _grdSubDataRow[0].REQ_ID = res.OUT_RES_REQ_ID
        grdSubDataRow[0].REQ_ID  = _grdSubDataRow[0].REQ_ID == null ? '' : _grdSubDataRow[0].REQ_ID
        _Parameters.REQ_ID = grdSubDataRow[0].REQ_ID
      }
    })

    //첫번째 저장이 문제없이 됐다면
    if(result === true){
      if(!isNullCheck(_Parameters.REQ_ID)){
        if(grdMain.value.getDataProvider().getRows().length > 0){
          let result2 = false
          let saveParams2 = []
          for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
            grdMain.value.getDataProvider().setValue(i,'REQ_ID', _grdSubDataRow[0].REQ_ID)
            // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
            // let row = grdMain.value.getGridView().getValues(i)
            let row = grdMain.value.getRowData(i)
            saveParams2.push(row)
          }
          console.log("교육 신청자 저장 :::: >>>> ",saveParams2)
          await commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SAVE_03', list: saveParams2 }).then(res => {
            console.log("교육신청자 저장 후~!!~#~!#~!~!#~!0 ", res)
            if(res.list.length > 0){
              onPopButtonsClick({ id : 'btnCourseReq' })
            }
          })
        }
      }else{
        let saveParams2 = []
        for(let i = 0; i < grdMain.value.getDataProvider().getRows().length; i++){
            grdMain.value.getDataProvider().setValue(i,'REQ_ID', _grdSubDataRow[0].REQ_ID)
            // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
            // let row = grdMain.value.getGridView().getValues(i)
            let row = grdMain.value.getRowData(i)
            saveParams2.push(row)
          }
        if(saveParams2.length > 0){
          await commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SAVE_03', list: saveParams2 }).then(res => {
            if(res.list.length > 0){
              onPopButtonsClick({ id : 'btnCourseReq' })
            }
          })
        }
      }
    }
    grdSubRowChanged()
  }
}
//***************************************************저장 영역(종료)**************************************************************/

//**************************************************수강신청 영역*****************************************************************/
const btnCourseReq = async () => {
  let arrCnt = popupData.COUNT.split('/')
  let _grdSubDataRow = _.cloneDeep(grdSubDataRow)
  if(popupData.STATUS === 'S' && arrCnt.length > 0){
    if(arrCnt.length === 3){
      if(Number(arrCnt[2]) < grdMain.value.getDataProvider().getRows().length){
        Message.warn(t('교육 정원을 초과하여 수강신청이 불가 합니다. \n 통합안전교육센터(T.2-5415)로 추가 개설 요청 하세요'))
        return
      }
    }
  }
  let ck = ''
  ck = await vm.$swal({ 
  title: t('수강신청작업을 완료하시겠습니까?'), 
  showCancelButton: true,
  })

  if(ck.isConfirmed !== true ){
    return
  }else{
    _grdSubDataRow[0].REQ_STATUS = 'R'
    await commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SAVE_04', list: _grdSubDataRow }).then(res => {
      Message.success(t('저장되었습니다.'))
      grdSubRowChanged()
    })
    
  }
}
//***********************************************수강신청 영역(종료)**************************************************************/


//***********************************************수강인원 추가 이벤트*************************************************************/
//팝업 오픈
const openEmpPopup = async () => {
  let rowData = grdSub.value.getDataProvider().getJsonRow(grdSubRowIndex.value)
  if(rowData.REQUEST_YN === 'N'){
      Message.warn(t('선택한 교육은 수강 신청 기간이 아닙니다.')) //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$실제 테스트때 주석해제해야함
      return
  }
  if(_Parameters.STATUS !== '2'){
      Message.warn(t('해당 강좌는 개설중이 아닙니다.')) //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$실제 테스트때 주석해제해야함
      return
  }
  if(!(popupData.STATUS === 'S' || popupData.STATUS === 'R')){
      Message.warn(t('작성중이거나 신청완료 상태만 수정할 수 있습니다.')) //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$실제 테스트때 주석해제해야함
      return
  }
  empPopup.value.openPopup({MULTI : true})
}

//이수자명을 선택했을 때 실행되는 이벤트
const onEmpSelected = row => {
  let msg = "아래 인원은 사전학습과정 미 이수로 인하여 수강신청이 불가하여 제외 됩니다.\n";
  let msg2 = "아래 인원은 해당 과정의 운전자격을 이미 취득하여 제외 됩니다.\n";
  let msg3 = ''
  let msg4 = '아래 인원은 장비자격 취소로 인하여 수강신청이 불가하여 제외 됩니다.\n'
  let msg5 = '아래 인원은 금월에 해당강좌에 대한 신청/등록이력 존재하여 제외 됩니다.\n'
  let errCnt = 0;
  let errCnt2 = 0;
  let errCnt4 = 0
  let errCnt5 = 0
  //수강신청 데이터
  let grdMainData = grdMain.value.getDataProvider().getRows()
  let remainCount = popupData.COUNT.split('/')

  /* 2024.02.01 정경동 책임 요청으로 수강신청 인원 3명까지로 제한 
     2024.05.08 정경동 책임 요청으로 운전 자격 교육만 3명으로 제한
  */
  if (grdSubDataRow[0].DIVISION === 'C' && (row.length + grdMainData.length) > 3){
    Message.warn(t('수강신청은 3명까지 가능합니다.'))
    return
  }

  //인원 조회 팝업 데이터 forEach
  row.forEach( async val => {
    let cnt = 0

    console.log("아이템 확인",val)
    for(let i = 0; i < grdMainData.length; i++){
      if(grdMainData[i][5] == val.CMPNY_DIV && grdMainData[i][2] == val.EMP_NO){
        return
      }
    }

    //자격증 체크 조회 파람
    let liceSearchParams ={
    CMPNY_DIV : '',
    YEAR : '',
    SCHEDULE_ID : '',
    CURR_ID : '',
    EDU_DATE_FROM : '',
    MORGN_ID : '',
    TARGET_ID : '',
    USER_ID : ''
    }
    console.log("grdSubDataRow",grdSubDataRow)
    console.log("_parameters",_Parameters)
    //if(!grdSubDataRow[0].PRE_EDU_CNT === '0' || !grdSubDataRow[0].PRE_LICE_CNT === '0'){
      liceSearchParams.CMPNY_DIV = grdSubDataRow[0].CMPNY_DIV
      liceSearchParams.YEAR = grdSubDataRow[0].YEAR
      liceSearchParams.SCHEDULE_ID = grdSubDataRow[0].SCHEDULE_ID
      liceSearchParams.CURR_ID = grdSubDataRow[0].CURR_ID
      liceSearchParams.EDU_DATE_FROM = grdSubDataRow[0].EDU_DATE_FROM
      liceSearchParams.MORGN_ID = grdSubDataRow[0].MORGN_ID
      liceSearchParams.TARGET_ID = val.EMP_NO
      liceSearchParams.USER_ID = userStore.userId
      
      // 운전자격 교육일 때 이미 자격증 소지자 제외
      if(grdSubDataRow[0].DIVISION === 'C'){
        //자격증체크조회
        commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SEARCH_04', param: liceSearchParams }).then(res2 => {
          console.log("자격증 체크 조회",res2)
          if(res2.ORESULT_CUR[0].POINT === 0){
            if(errCnt2 === 0){
              msg2 += '' + val.EMP_NM + '(' + val.EMP_NO + ')'
            }else{
              msg2 += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
            }
            errCnt2++
            cnt++
          }
        })
      }

      // 운전보수 교육 일 때 자격 취소자 제외 (연결된 자격 모두 취소일 때만 교육신청 불가)
      if(grdSubDataRow[0].DIVISION === 'M'){
        //자격증 체크 조회
        await commonSearchApi({ queryId : 'EDUAB0030_TAB01_POP01_SEARCH_18', param : liceSearchParams }).then(res2 => {
        // console.log("자격증 체크 조회",res2)
          if(res2.ORESULT_CUR[0].POINT === 0){
            if(errCnt4 === 0){
              msg4 += '' + val.EMP_NM + '(' + val.EMP_NO + ')'
            // console.log("지금 msg2", msg2)
            }else{
              msg4 += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
            }
            errCnt4++
            cnt++
          }
        })
      }

      // 운전자격/운전보수 교육 일 때 금월에 동일한 강좌 신청이력이 있으면 신청 불가
      if(grdSubDataRow[0].DIVISION === 'C' || grdSubDataRow[0].DIVISION === 'M'){
        //자격증 체크 조회
        await commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SEARCH_07', param : liceSearchParams }).then(res2 => {
        // console.log("자격증 체크 조회",res2)
          if(res2.ORESULT_CUR[0].CNT > 0){
            if(errCnt5 === 0){
              msg5 += '' + val.EMP_NM + '(' + val.EMP_NO + ')'
            // console.log("지금 msg2", msg2)
            }else{
              msg5 += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
            }
            errCnt5++
            cnt++
          }
        })
      }

      //사전학습 체크 조회
      commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SEARCH_05', param: liceSearchParams }).then(res3 => {
        console.log("사전학습 체크 조회",res3)
        if(res3.ORESULT_CUR[0].POINT === 0){
          if(grdSubDataRow[0].DIVISION === 'C'){
            //자격증 체크 조회
            commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SEARCH_06', param: liceSearchParams }).then(res4 => {
              console.log("res4 : ",res4)
              if(res4.ORESULT_CUR.length > 0){
                if(res4.ORESULT_CUR[0].POINT === 0){
                  if(errCnt === 0){
                    msg += val.EMP_NM + '(' + val.EMP_NO + ')'
                  }else{
                    msg += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
                  }
                  errCnt++
                  cnt++
                }
              }else{
                if(errCnt === 0){
                  msg += val.EMP_NM + '(' + val.EMP_NO + ')'
                }else{
                  msg += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
                }
              }

            })
          }else{
            if(errCnt === 0){
              msg += val.EMP_NM + '(' + val.EMP_NO + ')'
            }else{
              msg += ', ' + val.EMP_NM + '(' + val.EMP_NO + ')'
            }
            errCnt++
            cnt++
          }
        }
      })

      if(val.HLD_OFFI_GBN === '2'){
        val.HLD_OFFI_GBN = '휴직'
      }
      else if(val.HLD_OFFI_GBN === '3'){
        val.HLD_OFFI_GBN = '퇴직'
      }
    //}

    val.CMPNY_DIV = grdSubDataRow[0].CMPNY_DIV
    val.YEAR = grdSubDataRow[0].YEAR
    val.REQ_ID = grdSubDataRow[0].REQ_ID
    val.TARGET_ID = val.EMP_NO
    val.TARGET_NM = val.EMP_NM
    val.ORGN_NM = val.DEPT_NM
    val.ORGN_CD = val.DEPT_CD
    val.SAVE_YN = 'N'
    if(remainCount[0] <= grdMain.value.getDataProvider().getRows().length){
      if(msg3 !== 'end'){
        msg3 = '수강신청은 ' + remainCount[0] + '명까지 가능합니다'
      }
      if(msg3 !== '' && msg3 !== 'end'){
        Message.warn(msg3)
        msg3 = 'end'
      }
      return
    }

    if(cnt === 0){
      grdMain.value.addRow(val)
    }

    if(errCnt > 0 && errCnt2 > 0){
      msg = msg + '\n' + msg2
    }else if(errCnt2 > 0){
      msg = msg2
    }

    if(errCnt > 0 || errCnt2 > 0){
      Message.warn(msg)
    }

    if(errCnt4 > 0){
      let ck = ''

      ck = vm.$swal({ 
        title: t(msg4), 
      })      
    }

    if(errCnt5 > 0){
      let ck = ''

      ck = vm.$swal({ 
        title: t(msg5), 
      })      
    }
  })
}
const statusChanged = () => {
  console.log('진행상태 변경',popupData.STATUS)  
}
//***********************************************수강인원 추가 이벤트(종료)*******************************************************/



//*************************************************삭제 이벤트***********************************************************/
//신청취소 전
const beforeDelete = () => {
  if(isNullCheck(grdSubDataRow[0].REQ_ID)){
    Message.warn('저장되지 않은 교육 신청입니다.')
    return false
  }
  return true
}
//신청취소
const deleteData = () => {
  let _grdSubDataRow = _.cloneDeep(grdSubDataRow)
  return commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_DELETE_01', list: _grdSubDataRow })
}
//신청취소 후
const afterDelete = () => {
  _Parameters.REQ_ID = ''
  grdSubRowChanged()
}

//수강인원 삭제 전
const beforeDelete2 = () => {
  return true
}
//수강인원 삭제
const deleteData2 = () => {
  let deleteParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows()
  for(let i = 0; i < checkedRows.length; i++){
    deleteParams.push(grdMain.value.getDataProvider().getJsonRow(checkedRows[i]))
    deleteParams[i].USER_ID = userStore.userId
    if(deleteParams[0].REQUEST_YN === 'N'){
      Message.warn(t('선택한 교육은 수강 신청 기간이 아닙니다.'))//000044
      return
    }
  }
  console.log("수강인원 삭제할라는데? ",_Parameters)
  if(_Parameters.STATUS != 2){
    Message.warn(t('해당 강좌는 개설중이 아닙니다.'))
    return
  }

  if(!(popupData.STATUS === 'S' || popupData.STATUS === 'R')){
    Message.warn(t('작성중이거나 신청완료 상태만 수정할 수 있습니다.'))
    return
  }
  return commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_DELETE_02', list: deleteParams })
}
//수강인원 삭제 후
const afterDelete2 = () => {
  grdMain.value.getGridView().checkAll(false)
  grdSubRowChanged()
}
//***********************************************삭제 이벤트(종료)*******************************************************/
defineExpose({
  openPopup
})
</script>

<template>
  <VDialog
  v-model="dialog"
  eager
  persistent
  width="1200"
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
      <span>수강 신청 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title>
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :title="$t('교육 내용')"
          class="mt-1 mb-0"
          :button-list="['btnUpdate', 'btnCourseReq', 'btnReqCancel', 'btnClose']"
          @click-button="onPopButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex" style="width:100%; height:100%">
          <div style="width: 30%" class="mr-2">
            <v-sheet class="flex-column searchArea">
              <div class="d-flex">
                <div class="formLabelText pr-3 pb-2">교육내용</div>
                <i-textarea
                  class="mb-2"
                  labelWidth="52px"
                  width="260px"
                  v-model="popupData.EDU_DESC"
                  readonly
                  row="3"
                />
              </div>
              <div class="d-flex">
                <div class="formLabelText pr-3 pb-2">비　　고</div>
                <i-textarea
                  labelWidth="52px"
                  width="260px"
                  v-model="popupData.REMARK"
                  readonly
                  row="3"
                />
              </div>
            </v-sheet>
            <v-sheet height="76%">
              <RealGrid
                ref="grdSub"
                class="ma-0"
                :grid-view-option="grdSubProps.gridViewOption"
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns"
                @onCurrentRowChanged="grdSubRowChanged"
              />
            </v-sheet>
          </div>
          <div style="width:69.5%">
            <v-sheet class="flex-column searchArea">
              <div class="d-flex">
                <i-input
                  :label="$t('교​​ ​ 육​​ ​ 명')"
                  labelWidth="52px"
                  width="533px"
                  v-model="popupData.CURR_NM"
                  readonly
                />
                <i-input
                  :label="$t('정원/신청인원/잔여')"
                  labelWidth="112px"
                  width="231px"
                  v-model="popupData.COUNT"
                  readonly
                />
              </div>
              <div class="d-flex mt-2">
                <i-input
                  :label="$t('교육기간')"
                  labelWidth="52px" 
                  width="173px" 
                  class="pr-2"
                  margin="0px"
                  v-model="popupData.EDU_DATE_FROM"
                  type="date"
                  readonly
                />
                <i-input
                  :label="$t('-')"
                  width="130px"
                  v-model="popupData.EDU_DATE_TO"
                  type="date"
                  readonly
                />
                <i-select
                  :label="$t('진행상태')"
                  labelWidth="52px"
                  width="170px"
                  class="ml-10"
                  v-model="popupData.STATUS"
                  :items="codeList.status"
                  readonly
                  item-title="TXT"
                  item-value="COD"
                  @update:model-value="statusChanged"
                />
                <i-input
                  :label="$t('반려사유')"
                  labelWidth="52px"
                  width="232px"
                  v-model="popupData.CONTENT"
                  readonly
                />
              </div>
              <div class="d-flex mt-2">
                <i-input
                  :label="$t('신​​ ​ 청​​ ​ 자')"
                  labelWidth="52px"
                  width="250px"
                  v-model="popupData.REQ_NM"
                  :rules="[requiredREQ_NM]"
                />
                <i-input
                  class="mr-2"
                  :label="$t('신청자 전화번호(Mobile)')"
                  labelWidth="145px"
                  width="264px"
                  v-model="popupData.REQ_TEL1"
                  :rules="[requiredREQ_TEL1]"
                  maxlength="3"
                />
                <i-input
                  class="mr-2"
                  :label="$t('-')"
                  width="118px"
                  v-model="popupData.REQ_TEL2"
                  :rules="[requiredREQ_TEL2]"
                  maxlength="4"
                />
                <i-input
                  :label="$t('-')"
                  width="118px"
                  v-model="popupData.REQ_TEL3"
                  :rules="[requiredREQ_TEL3]"
                  maxlength="4"
                />
              </div>
            </v-sheet>
            <v-sheet height="80%">
              <IGridTitle
                ref="grdButtons"
                :use-permission="false"
                class="mt-1 mb-1"
                :button-list="['btnCrsPersAdd', 'btnCrsPersDelete']"
                @click-button="onGrdButtonsClick"
              />
              <RealGrid
                ref="grdMain"
                class="ma-0 mt-2"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
              />
              <IUpload
                ref="fileUpload"
                :button-list="['btnFileUpload','btnDelete','btnDownLoad']"
                :is-visibled="true"
              />
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
  <EmpPopup 
    ref="empPopup" 
    @selected="onEmpSelected"
  />
</template>
<style scoped lang="scss">
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.formLabelText {
  color: #222;
  font-size: 14px;
  font-weight: 400;
  width:61px !important;
  min-width: 61px !important;
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
