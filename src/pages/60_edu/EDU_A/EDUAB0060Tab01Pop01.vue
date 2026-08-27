<!--
  화면명 : 자율수강신청 팝업
  화면개요 : 현재 교육 내용, 수강 신청 현황, 과정 개요를 확인할 수 있는 팝업
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
import EDUAB0060Tab01Pop01Pop01 from '@/pages/60_edu/EDU_A/EDUAB0060Tab01Pop01Pop01.vue'

//***************************************************세팅 영역*********************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const grdSub = ref(null) 
const popupButtons = ref(null)
const emit = defineEmits(['send']) 
const eDUAB0060Tab01Pop01Pop01 = ref(null)
let _Parameters = null
let grdSubDataRow = []
let arrCnt = []
const popupData = reactive({
  EDU_INTRO : '', //과정소개
  TARGET : '',    //교육대상
  EDU_DESC : '',  //교육내용
  EVAL_STD : '',  //평가기준
  REMARK : ''     //비고
})

//교육내용
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'DIVISION', dataType: 'text', width:'60', header: { text: t('분류') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'CURR_NM', dataType: 'text', width:'300', header: { text: t('교육명') }, styleName: "left-column", editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
      { fieldName: 'EPLACE_NM', dataType: 'text', width:'150', header: { text: t('교육장소') }, styleName: "left-column", editable: false },  
    { fieldName: 'MORGN_ID', dataType: 'text', width:'130', header: { text: t('주관부서') }, styleName: "left-column", editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'LEAD_TIME', dataType: 'number', width:'60', numberFormat:"#,###", header: { text: t('학습시간') }, editable: false },
    { fieldName: 'EDUPOSSIBLE_NUM', dataType: 'number', width:'60', numberFormat:"#,###", header: { text: t('정원(명)') }, styleName: "right-column", editable: false },
    { fieldName: 'TARGET_CNT', dataType: 'number', width:'60', numberFormat:"#,###", header: { text: t('승인인원') }, styleName: "right-column", editable: false },
    { fieldName: 'REQ_CNT', dataType: 'number', width:'60', numberFormat:"#,###", header: { text: t('신청인원') }, styleName: "right-column", editable: false },
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('진행상태') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }  },
    { fieldName: 'EDU_DATE_TIME', dataType: 'text', width:'200', header: { text: t('교육기간') }, editable: false },
    { fieldName: 'EDU_TIME', dataType: 'text', width:'100', header: { text: t('교육시간') }, editable: false },
    { fieldName: 'EDU_CONTENT', dataType: 'text', width:'600', header: { text: t('상세교육명칭') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'REQ_FROMTO', dataType: 'text', header: { text: t('신청기간') }, editable: false, visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('CURR_ID') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'REQUEST_YN', dataType: 'text', header: { text: t('REQUEST_YN') }, editable: false, visible: false },
  ],
  columns: [],
})

//수강신청현황 
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false } },
  fields : [
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('등록일자') }, editable: false },
    { fieldName: 'REQ_DATE', dataType: 'text', header: { text: t('신청일자') }, editable: false },
    { fieldName: 'REQ_ORGN_NM', dataType: 'text', header: { text: t('소속') }, editable: false },
    { fieldName: 'REQ_CNT', dataType: 'number', width:'60', numberFormat:"#,###", header: { text: t('신청인원(명)') }, styleName:'rg_blue rg_underLine', editable: false },
    { fieldName: 'REQ_STATUS', dataType: 'text', header: { text: t('진행상태') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'REQ_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'REQ_TEL', dataType: 'text', header: { text: t('전화번호(Mobile)') }, editable: false },
    { fieldName: 'RET_CONTENT', dataType: 'text', header: { text: t('반려사유') }, editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, editable: false, visible: false },
    { fieldName: 'REQ_ID', dataType: 'text', header: { text: t('REQ_ID') }, editable: false, visible: false },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('CURR_ID') }, editable: false, visible: false },
    { fieldName: 'MORGN_ID', dataType: 'text', header: { text: t('MORGN_ID') }, editable: false, visible: false },
    { fieldName: 'MORGN_EMP_NO', dataType: 'text', header: { text: t('MORGN_EMP_NO') }, editable: false, visible: false },
    { fieldName: 'REQ_BSNS', dataType: 'text', header: { text: t('REQ_BSNS') }, editable: false, visible: false },
    { fieldName: 'REQ_ORGN_CD', dataType: 'text', header: { text: t('REQ_ORGN_CD') }, editable: false, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, editable: false, visible: false },
    { fieldName: 'RET_YN', dataType: 'text', header: { text: t('RET_YN') }, editable: false, visible: false },
    { fieldName: 'RET_DATE', dataType: 'text', header: { text: t('RET_DATE') }, editable: false, visible: false },
  ],
  columns: [],
  columnLayout: [
    'INSERT_DATE',
    'REQ_DATE',
    'REQ_ORGN_NM',
    'REQ_CNT',
    'REQ_STATUS',
    {
      name: '신청자',
      direction: 'horizontal',
      items: [ 'REQ_NM', 'REQ_TEL'],
      header: { text: t('신청자') },
    },
    'RET_CONTENT'
  ],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields


const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'), //분류
    commonSearchApi({ queryId : 'EDUAB0060_SEARCH_02', param : {CMPNY_DIV : userStore.cmpnyDiv} }) //주관부서명
  ]).then(res => {
    console.log("레스 확인!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",res)
    grdMain.value.setBindingColumn("DIVISION", res[0].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("MORGN_ID", res[1].ORESULT_CUR, "COD", "TXT")
    let mainCodeList = []
    mainCodeList.push({COD : '', TXT : '전체'}, {COD : '2', TXT : '개설'}, {COD : '3', TXT : '확정'}, {COD : '5', TXT : '완료'})
    let subCodeList = []
    subCodeList.push({COD : 'S', TXT : '작성중'}, {COD : 'A', TXT : '승인'}, {COD : 'R', TXT : '신청완료'},
                     {COD : 'T', TXT : '반려'}, {COD : 'C', TXT : '확정'}, {COD : 'ZZ', TXT : '교육완료'})
    grdMain.value.setBindingColumn("STATUS", mainCodeList, "COD", "TXT")
    grdSub.value.setBindingColumn("REQ_STATUS", subCodeList, "COD", "TXT")
  })
}
//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup =  (data) => {
  _Parameters = data
  console.log("_Parameters",_Parameters)
  initCodeList()
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
  Object.keys(popupData).forEach(key => {
    popupData[key] = ''
  })
  console.log("EDUAB0060팝업 데이터",data)

  popupData.EDU_INTRO = data.cd.INTRODUCTION  //과정소개
  popupData.TARGET = data.cd.TARGET           //교육대상
  popupData.EDU_DESC = data.cd.CONTENTS       //교육내용
  popupData.EVAL_STD = data.cd.CRITERIA       //평가기준
  popupData.REMARK = data.cd.REMARK           //비고

  searchData()
  dialog.value = true
}


const searchData = () => {
  console.log("빠라미터",_Parameters)
  grdMain.value.getDataProvider().setRows([_Parameters.cd])

  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  //let grdMainDataRow = grdMain.value.getGridView().getValues(0)
  let grdMainDataRow = grdMain.value.getRowData(0)

  let searchParams = {
    CMPNY_DIV : grdMainDataRow.CMPNY_DIV,
    YEAR : grdMainDataRow.YEAR,
    SCHEDULE_ID : grdMainDataRow.SCHEDULE_ID,
  }
  commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_SEARCH_02', param: searchParams }).then(res => {
    arrCnt.push(res.ORESULT_CUR[0].CNT.split('/'))
  })
  
  var grdSubSearchData = {
    CMPNY_DIV : userStore.cmpnyDiv,
    CURR_ID : _Parameters.cd.CURR_ID,
    YEAR : _Parameters.cd.YEAR,
    SCHEDULE_ID : _Parameters.cd.SCHEDULE_ID,
    REQ_BSNS : userStore.bsnsCd, //'AX00',
    // 2024.08.19 박용훈 userStore.orgnDiv 가 아닌 userStore.userDiv 임
    //REQ_ORGN_CD : userStore.orgnDiv === 'A' ? userStore.deptCd : userStore.asgnCd//'XBS0'   userDiv
    REQ_ORGN_CD : userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd//'XBS0'   userDiv
  }
  
  grdSubSearch(grdSubSearchData)
}

//서브 그리드 조회
const grdSubSearch = (grdSubSearchData) => {
  grdSubDataRow = []
  commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_SEARCH_01', param: grdSubSearchData }).then(res => {
    console.log("섭그 조회 %%%%%%%%%%%%%%%%%",res)
    if(res.ORESULT_CUR.length <= 0){
      var newArray = {
        REQ_ID : '',
        REQ_DATE : dayjs(new Date).format('YYYY-MM-DD'),
        REQ_STATUS : 'S',
        REQ_ORGN_CD : '',
        REQ_ORGN_NM : '',
        REQ_NM : userStore.empNm,
        CMPNY_DIV : userStore.cmpnyDiv,
        CURR_ID : _Parameters.cd.CURR_ID,
        YEAR : _Parameters.cd.YEAR,
        SCHEDULE_ID : _Parameters.cd.SCHEDULE_ID,
        REQ_CNT : '0'
      }
      // 2024.08.19 박용훈 userStore.orgnDiv 가 아닌 userStore.userDiv 임
      // if(userStore.orgnDiv === 'A'){
      if(userStore.userDiv === 'A'){
        newArray.REQ_ORGN_CD = userStore.deptCd
        newArray.REQ_ORGN_NM = userStore.deptNm
      }else{
        newArray.REQ_ORGN_CD = userStore.asgnCd
        newArray.REQ_ORGN_NM = userStore.asgnNm
      }
      console.log("뉴리스트 데이터 확인",[newArray])
      grdSub.value.getDataProvider().setRows([newArray])
      grdSubDataRow.push(newArray)
    }else{
      console.log("서브그리드 데이터 확인",res.ORESULT_CUR)
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
      grdSubDataRow.push(res.ORESULT_CUR[0])
    }
  }).finally( () => {
    setButtons(grdSubDataRow)
  })
}

const onClose = data => {
  grdMain.value.getDataProvider().setRows([data])

  if(data.STATUS==='2'){
    //인원등록
  }else{
    //인원조회
  }
  popupData.EVAL_STD = data.CRITERIA
  popupData.TARGET = data.TARGET
  popupData.EDU_INTRO = data.INTRODUCTION
  popupData.EDU_DESC = data.CONTENTS
  popupData.REMARK = data.REMARK

  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  //let grdMainDataRow = grdMain.value.getGridView().getValues(0)
  let grdMainDataRow = grdMain.value.getRowData(0)
  console.log("지알디 메인 데이터",grdMainDataRow)
  let searchParams = {
    CMPNY_DIV : grdMainDataRow.CMPNY_DIV,
    YEAR : grdMainDataRow.YEAR,
    SCHEDULE_ID : grdMainDataRow.SCHEDULE_ID,
  }
  commonSearchApi({ queryId : 'EDUAB0060_TAB01_POP01_SEARCH_02', param: searchParams }).then(res => {
    arrCnt.push(res.ORESULT_CUR[0].CNT.split('/'))
  })
  
  var grdSubSearchData = {
    CMPNY_DIV : userStore.cmpnyDiv,
    CURR_ID : grdMainDataRow.CURR_ID,
    YEAR : grdMainDataRow.YEAR,
    SCHEDULE_ID : grdMainDataRow.SCHEDULE_ID,
    REQ_BSNS : userStore.bsnsCd, //'AX00',
    // 2024.08.19 박용훈 userStore.orgnDiv 가 아닌 userStore.userDiv 임
    // REQ_ORGN_CD : userStore.orgnDiv === 'A' ? userStore.deptCd : userStore.asgnCd//'XBS0'
    REQ_ORGN_CD : userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd//'XBS0'
  }
  
  grdSubSearch(grdSubSearchData)
}

//버튼 사용여부 설정
const setButtons = res => {
  console.log("버턴 레스",res)
  //disableBtn('버튼명', true) == 비활성화
  // S:작성중, A:승인, R:신청완료, T:반려, C:확정, ZZ:교육완료

  // 실제 테스트 때 주석 해제해야 함 $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  popupButtons.value.disableBtn('btnAddPerson', false) //인원등록
  popupButtons.value.disableBtn('btnCourseReq', false) //수강신청
  popupButtons.value.disableBtn('btnReqCancel', false) //신청취소
  popupButtons.value.disableBtn('btnDelete', false)    //삭제
  console.log("버튼 확인",res[0].REQ_STATUS)
  switch(res[0].REQ_STATUS){
    case 'S':
      if(isNullCheck(res[0].REQ_ID)){
        popupButtons.value.disableBtn('btnReqCancel', true) //신청취소
        popupButtons.value.disableBtn('btnDelete', true)    //삭제
      }else{
        popupButtons.value.disableBtn('btnReqCancel', true) //신청취소
      }
      break
    
    case 'R':
      popupButtons.value.disableBtn('btnCourseReq', true) //수강신청
      popupButtons.value.disableBtn('btnDelete', true)    //삭제
      break
    
    default:
      popupButtons.value.disableBtn('btnCourseReq', true) //수강신청
      popupButtons.value.disableBtn('btnReqCancel', true) //신청취소
      popupButtons.value.disableBtn('btnDelete', true)    //삭제
  }
  // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$


  //popupButtons.value.disableBtn('btnCreate', false)
  // REQ_STATUS//진행상태
  // REQ_ID //신청아이디
  // REQ_CNT//신청인원
}

const onPopButtonsClick = btn => {
  console.log("버튼 아이디",btn.id)
  if(btn.id === 'btnAddPerson'){  //인원등록
    // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
    // let grdMainDataRow = grdMain.value.getGridView().getValues(0)
    // let grdSubDataRow = grdSub.value.getGridView().getValues(0)
    let grdMainDataRow = grdMain.value.getRowData(0)
    let grdSubDataRow = grdSub.value.getRowData(0)

    // if(grdMainDataRow.REQUEST_YN !== 'Y'){ //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$실제 테스트때 주석해제해야함
    //   Message.warn(t('선택한 교육은 수강 신청 기간이 아닙니다.'))
    //   return
    // }

    eDUAB0060Tab01Pop01Pop01.value.openPopup({
      CMPNY_DIV : userStore.cmpnyDiv,
      STATUS : grdMainDataRow.STATUS,
      YEAR : grdSubDataRow.YEAR,
      SCHEDULE_ID : grdSubDataRow.SCHEDULE_ID,
      REQ_ID : grdSubDataRow.REQ_ID,
      CURR_ID : _Parameters.CURR_ID,
      DIVISION : _Parameters.DIVISION,
      EDATE_FROM : _Parameters.EDATE_FROM,
      EDATE_TO : _Parameters.EDATE_TO,
      EDU_DESC : popupData.EDU_DESC,
      REMARK : popupData.REMARK
    })
  }
  else if(btn.id === 'btnCourseReq'){ //수강신청
    new saveFlowHelper(vm, t)
    .setConfirmMessage('수강신청 하시겠습니까?')
    .setBefore(beforeCourseReq)
    .setQuery(courseReqData)
    .setAfter(afterCourseReq)
    .run()
  }
  else if(btn.id === 'btnReqCancel'){ //수강취소
    new deleteFlowHelper(vm, t)
        .setConfirmMessage('신청취소 하시겠습니까?')
        .setBefore(beforeCancel)
        .setQuery(cancelData)
        .setAfter(afterCancel)
        .run()
  }
  // 정경동 책임의 요청에 의한 추가 개설 요청 기능 비활성화 2024-04-18
  // else if(btn.id === 'btnAddOpenReq'){ //추가개설요청
  //   btnAddOpenReq()
  // }
  else if(btn.id === 'btnDelete'){ //삭제
    new deleteFlowHelper(vm, t)
        .setBefore(beforeDelete)
        .setQuery(deleteData)
        .setAfter(afterDelete)
        .run()
  }
  else if(btn.id === 'btnClose'){ //닫기
    emit('close')
    dialog.value = false
  }
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType === 'gridEmpty' || clickData.cellType === 'header'){
    return
  }
  console.log("클릭 데이터",clickData)
  if(clickData.fieldName === 'REQ_CNT'){
    // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
    // let grdMainDataRow = grdMain.value.getGridView().getValues(0)
    // let grdSubDataRow = grdSub.value.getGridView().getValues(0)
    let grdMainDataRow = grdMain.value.getRowData(0)
    let grdSubDataRow = grdSub.value.getRowData(0)
    eDUAB0060Tab01Pop01Pop01.value.openPopup({
      CMPNY_DIV : userStore.cmpnyDiv,
      STATUS : grdMainDataRow.STATUS,
      YEAR : grdSubDataRow.YEAR,
      SCHEDULE_ID : grdSubDataRow.SCHEDULE_ID,
      REQ_ID : grdSubDataRow.REQ_ID,
      CURR_ID : _Parameters.CURR_ID,
      DIVISION : _Parameters.DIVISION,
      EDATE_FROM : _Parameters.EDATE_FROM,
      EDATE_TO : _Parameters.EDATE_TO,
      EDU_DESC : popupData.EDU_DESC,
      REMARK : popupData.REMARK
    })
  }
}

//널 체크 이벤트
const isNullCheck = data => {
return (data === undefined || data === null || data === '') ? true : false
}
//************************************************이벤트 영역(종료)*********************************************************/
//*************************************************수강신청 영역*********************************************************/
//수강신청 전
const beforeCourseReq = async () => {
  if(grdSubDataRow[0].REQ_STATUS === 'S' && arrCnt.length > 0){
    if(arrCnt.length === 3){
      if(Number(arrCnt[2]) < Number(arrCnt[0])){
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
            return true
          })
        }
      }
    }
  }

  return true
}

//수강신청
const courseReqData = async () => {
  let _grdSubDataRow = _.cloneDeep(grdSubDataRow)
  _grdSubDataRow[0].REQ_STATUS = 'R'
  console.log("수강 신청할 데이터 확인",_grdSubDataRow)
  return commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SAVE_04', list: _grdSubDataRow })
  
}

//수강신청 후
const afterCourseReq = (res) => {
  searchData()
}
//*************************************************수강신청 영역(종료)*********************************************************/
//**************************************************추가개설요청 영역**********************************************************/
// const btnAddOpenReq = async () => {
//   let ck = ''
//   ck = await vm.$swal({ 
//   title: t('해당 교육에 대해서 추가 교육 개설 요청 하시겠습니까?'), 
//   showCancelButton: true,
//   })
//   if(ck.isConfirmed === false){
//     return
//   }else{
//     let grdMainDataRow = grdMain.value.getGridView().getValues(0)
//     let params = {
//       CMPNY_DIV : grdMainDataRow.CMPNY_DIV,
//       CURR_ID : grdMainDataRow.CURR_ID,
//       MORGN_ID : grdMainDataRow.MORGN_ID,
//       USER_ID : userStore.userId,
//     }
//     console.log("수강신청 파람",params)
//     commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_POP01_SAVE_01', list: [params] }).then(res => {
//       Message.success(t('수강신청이 완료 되었습니다.'))
//     })
//   }
// }
//*************************************************추가개설요청 영역(종료)*****************************************************/
//*****************************************************신청취소 영역***********************************************************/
//신청취소 전
const beforeCancel = () => {
  return true
}

//신청취소
const cancelData = () => {
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  // let grdMainDataRow = grdMain.value.getGridView().getValues(0)
  // let grdSubDataRow = grdSub.value.getGridView().getValues(0)
  let grdMainDataRow = grdMain.value.getRowData(0)
  let grdSubDataRow = grdSub.value.getRowData(0)

  let deleteParams = {
    CMPNY_DIV : grdMainDataRow.CMPNY_DIV,
    YEAR : grdMainDataRow.YEAR,
    REQ_ID : grdSubDataRow.REQ_ID
  }
  console.log("신청 취소 파람",deleteParams)
  return commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_DELETE_01', list: [deleteParams] })
}

//신청취소 후
const afterCancel = res => {
  searchData()
}

//*************************************************신청취소 영역(종료)*********************************************************/
//*****************************************************삭제 영역***********************************************************/
const beforeDelete = () => {
  return true
}
const deleteData = () => {
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  // let grdMainDataRow = grdMain.value.getGridView().getValues(0)
  // let grdSubDataRow = grdSub.value.getGridView().getValues(0)
  let grdMainDataRow = grdMain.value.getRowData(0)
  let grdSubDataRow = grdSub.value.getRowData(0)

  let deleteParams = {
    CMPNY_DIV : grdMainDataRow.CMPNY_DIV,
    YEAR : grdMainDataRow.YEAR,
    REQ_ID : grdSubDataRow.REQ_ID
  }
  console.log("삭제할 데이터 정보 확인",deleteParams)
  console.log("돌아와라제발")
  return commonExecuteApi({ queryId : 'EDUAB0060_TAB01_POP01_DELETE_02', list: [deleteParams] })
}
const afterDelete = () => {
  searchData()
}
//**************************************************삭제 영역(종료)***********************************************************/
defineExpose({
  openPopup
})
</script>

<template>
  <VDialog
  v-model="dialog"
  eager
  persistent
  width="1300"
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
      <span>자율수강신청</span>
    </v-sheet>
    <v-card class="pa-4 fill-height rounded-b-5">
      <v-card-title class="pa-0 pb-2">
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :title="$t('교육 내용')"
          class="mt-1 mb-0"
          :button-list="['btnAddPerson', 'btnCourseReq', 'btnReqCancel', 'btnDelete', 'btnClose']"
          @click-button="onPopButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-0 content-area">
        <v-sheet height="16%">
          <RealGrid
            ref="grdMain"
            class="ma-0"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet>
        <v-sheet height="24.5%" class="pt-2">
          <IGridTitle
            :title="$t('수강신청현황')"
          />
          <RealGrid
            ref="grdSub"
            class="ma-0"
            :grid-view-option="grdSubProps.gridViewOption"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
        <v-sheet class="flex-column">
          <IGridTitle 
              :title="$t('과정개요')"
              class="ma-0"
            >
          </IGridTitle>
          <div class="d-flex">
            <div style="width: 70px; font-size: 14px;font-weight: 400;min-width: 61px;">과정소개</div>
            <i-textarea
              labelWidth="100px"
              width="1105px"
              class="pb-2"
              v-model="popupData.EDU_INTRO"
              readonly
              row="2"
            />
          </div>

          <i-input
            :label="$t('교육대상')"
            labelWidth="63px"
            width="1165px"
            class="pb-2"
            v-model="popupData.TARGET"
            readonly
          />
          <div class="d-flex">
            <div style="width: 70px; font-size: 14px;font-weight: 400;min-width: 61px;">교육내용</div>
            <i-textarea
              labelWidth="100px"
              width="1105px"
              class="pb-2"
              v-model="popupData.EDU_DESC"
              readonly
              row="3"
            />
          </div>

          <i-input
            :label="$t('평가기준')"
            labelWidth="63px"
            width="1165px"
            class="pb-2"
            v-model="popupData.EVAL_STD"
            readonly
          />
          <div class="d-flex">
            <div style="width: 70px; font-size: 14px;font-weight: 400;min-width: 61px;">기타사항</div>
            <i-textarea
              labelWidth="100px"
              width="1105px"
              v-model="popupData.REMARK"
              readonly
              row="2"
            />
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </VDialog>
  <EDUAB0060Tab01Pop01Pop01
    ref="eDUAB0060Tab01Pop01Pop01"
    @close="onClose"
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
  height: calc(100vh - (445px - 12px));  
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>