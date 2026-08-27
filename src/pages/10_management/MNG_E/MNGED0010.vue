<!--
  화면명 : 법규준수 평가 등록
  화면개요 : 법규 체크리스트 준수 개별 부서에서 평가하고 등록하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi2, commonExecuteApi,commonLogExecuteApi } from '@hiway/api/commonApi'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import MNGEB0010PopTab1Popup from './MNGEB0010PopTab1Popup.vue'
import dayjs from 'dayjs'

defineOptions({
  name:'10_management-MNG_E-MNGED0010',
})

//*******************************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain1 = ref(null)
const grdMain2 = ref(null)
const empPopup = ref(null)
const deptPopup = ref(null)
const tab = ref(null)
const approvalPopup = ref(null)
const mNGEB0010PopTab1Popup = ref(null)
const title1 = ref(null)
const title2 = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR1: dayjs().get("year"),
  YEAR2: dayjs().get("year"),
  TM_GUBN1: 'UP',
  TM_GUBN2: 'UP',
  CYCLE1 : '',
  CYCLE2 : '',
  BSNS_CD : userStore.bsnsCd,
  DEPT_CD : userStore.deptCd,
  DEPT_NM : userStore.deptNm,
  MANAGER_ID : '',
  MANAGER_NM : '',
  USER_ID: userStore.userId,
  INJR_DEPT_CD: userStore.deptCd,  
  ASGN_NM: ` ${userStore.bsnsNm} - ${userStore.deptNm}`,
  ROW_IDX : -1,
})

//그리드 Editable
const gridEditable = reactive({
  EDITABLE1 : true,
  EDITABLE2 : true,
})

//코드리스트 세팅 
const codeList = reactive({
  CYCLE: [],
  TM_GUBN : [
    {COD : 'UP', TXT : '상반기'},
    {COD : 'UN', TXT : '하반기'},
  ],
  EVA_RESULT : [
    {COD : 'A', TXT : '적합'},
    {COD : 'S', TXT : '보완'},
    {COD : 'N', TXT : '미해당'},
  ],
})

//콤보박스 및 그리드 데이터 바인딩
const initCodeList = () => {
  Promise.all([
    getCodeList('HHIAF40'),
  ]).then(res => {
    codeList.CYCLE = [{COD : '' , TXT : '전체'}]
    res[0].ORESULT_CUR.forEach(item => {
    codeList.CYCLE.push({COD : item.COD, TXT : item.TXT })
    })
    grdMain1.value.setBindingColumn("CYCLE", res[0].ORESULT_CUR, "COD", "TXT") 
    grdMain2.value.setBindingColumn("CYCLE", res[0].ORESULT_CUR, "COD", "TXT") 

    grdMain1.value.setBindingColumn("EVA_RESULT", codeList.EVA_RESULT, "COD", "TXT") 
    grdMain2.value.setBindingColumn("EVA_RESULT", codeList.EVA_RESULT, "COD", "TXT") 
  })
}

//그리드 세팅
const grdMainProps1 = reactive({
  gridViewOption: { stateBar: { visible:false }, checkBar: { visible: true } }, 
  fields : [ 
    { fieldName: 'YEAR', dataType: 'text', width:'50', header: { text: t('연도') }, visible : false },
    { fieldName: 'TM_GUBN', dataType: 'text', width:'50', header: { text: t('구분') }, visible : false},
    { fieldName: 'LAW_CD', dataType: 'text', header: { text: t('관련법 코드') }, visible : false },
    { fieldName: 'LAW_NM', dataType: 'text', requiredMessage: '[관련법명]는 필수입니다.' ,
      header: { text: t('관련법명'), styleName: 'header_validit' }, button : 'action' , styleName: 'left-column'  },
    { fieldName: 'CONTENT', dataType: 'text', header: { text: t('준수사항') }, styleName: 'left-column'   },
    { fieldName: 'CYCLE', dataType: 'text', width:'50', editor: { type: 'list' }, header: { text: t('주기') }, lookupDisplay: true, },
    { fieldName: 'CHK_TARGET', dataType: 'text' , width:'50', header: { text: t('확인대상') }, styleName: 'left-column'  },
    { fieldName: 'CHK_CONTENT', dataType: 'text', width:'50', header: { text: t('확인내용') }, styleName: 'left-column'   },
    { fieldName: 'DEPT_CD', dataType: 'text', width:'50', header: { text: t('담당부서 코드') }, visible : false, },
    { fieldName: 'DEPT_NM', dataType: 'text', width:'50', header: { text: t('담당부서명') }, visible : false,   },
    { fieldName: 'EVA_DEPT_CD', dataType: 'text', width:'50', header: { text: t('평가주체부서 코드') }, visible : false },
    { fieldName: 'EVA_DEPT_NM', dataType: 'text', width:'50', header: { text: t('평가주체부서') }, button : 'action'  },
    { fieldName: 'MANAGER_ID', dataType: 'text', width:'50', header: { text: t('담당자 ID') }, visible : false,   },
    { fieldName: 'MANAGER_NM', dataType: 'text', width:'50', requiredMessage: '[담당자명]는 필수입니다.', header: { text: t('담당자명'), styleName: 'header_validit' }, button : 'action',  },
    { fieldName: 'EVA_RESULT', dataType: 'text', width:'50', requiredMessage: '[평가결과]는 필수입니다.', header: { text: t('평가결과'), styleName: 'header_validit' }, editor: { type: 'list' }, lookupDisplay: true  },
    { fieldName: 'SOL_CONTENT', dataType: 'text', width:'100', header: { text: t('조치사항') }, styleName: 'left-column'   },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'IDX_KEY', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },
  ],
  columns: [],
})

const grdMainProps2 = reactive({
  gridViewOption: { stateBar: { visible:false }, checkBar: { visible: true } }, 
  fields : [ 
    { fieldName: 'YEAR', dataType: 'text', width:'50', header: { text: t('연도') }, visible : false },
    { fieldName: 'TM_GUBN', dataType: 'text', width:'50', header: { text: t('구분') }, visible : false},
    { fieldName: 'LAW_CD', dataType: 'text', header: { text: t('관련법 코드') }, visible : false },
    { fieldName: 'LAW_NM', dataType: 'text', requiredMessage: '[관련법명]는 필수입니다.', 
      header: { text: t('관련법명'), styleName: 'header_validit' }, editable: false, button : 'action' , styleName: 'left-column' },
    { fieldName: 'CONTENT', dataType: 'text', header: { text: t('준수사항') }, styleName: 'left-column'  },
    { fieldName: 'CYCLE', dataType: 'text', width:'50', editor: { type: 'list' }, header: { text: t('주기') }, lookupDisplay: true, },
    { fieldName: 'CHK_TARGET', dataType: 'text' , width:'50', header: { text: t('확인대상') }, styleName: 'left-column' },
    { fieldName: 'CHK_CONTENT', dataType: 'text', width:'50', header: { text: t('확인내용') }, styleName: 'left-column' },
    { fieldName: 'DEPT_CD', dataType: 'text', width:'50', header: { text: t('담당부서 코드') }, visible : false, },
    { fieldName: 'DEPT_NM', dataType: 'text', width:'50', header: { text: t('담당부서명') }, visible : false,   },
    { fieldName: 'EVA_DEPT_CD', dataType: 'text', width:'50', header: { text: t('평가주체부서 코드') }, visible : false },
    { fieldName: 'EVA_DEPT_NM', dataType: 'text', width:'50', header: { text: t('평가주체부서') }, editable: false, button : 'action'  },
    { fieldName: 'MANAGER_ID', dataType: 'text', width:'50', header: { text: t('담당자 ID') }, visible : false,   },
    { fieldName: 'MANAGER_NM', dataType: 'text', width:'50', requiredMessage: '[담당자명]는 필수입니다.', header: { text: t('담당자명'), styleName: 'header_validit' }, visible : false, button : 'action',  },
    { fieldName: 'EVA_RESULT', dataType: 'text', width:'50', requiredMessage: '[평가결과]는 필수입니다.', header: { text: t('평가결과'), styleName: 'header_validit' }, editor: { type: 'list' }, lookupDisplay: true  },
    { fieldName: 'SOL_CONTENT', dataType: 'text', width:'100', header: { text: t('조치사항') }, styleName: 'left-column'  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'IDX_KEY', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps1.columns = grdMainProps1.fields
grdMainProps2.columns = grdMainProps2.fields

//*******************************************세팅 영역(종료)***************************************************/


//*******************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = async btn => {
  if(tab.value === 'tab1'){
    if (btn.id === 'btnSearch') {       //조회
      new queryFlowHelper(vm, t)
      .setGridList([grdMain1])
      .setBefore(beforeMainSearch1)
      .setQuery(searchMainData1)
      .setAfter(afterMainSearch1)
      .run()
    } 
    else if (btn.id === 'btnUpdate') {  //저장
      new saveFlowHelper(vm, t)
        .setGridList([grdMain1])
        .setBefore(saveDataValidCheck1)
        .setQuery(saveData1)
        .setAfter(()=>{onButtonsClick({ id:'btnSearch' })})
        .run()
    } 
    else if(btn.id === 'btnPrint'){    //출력
      print1()
    }
    else if(btn.id === 'btnReqApply'){    //결재상신
      new queryFlowHelper(vm, t)
        .setQuery(searchMainData1)
        .setAfter(afterSearchApply)
        .run()
    }
  }else{
    if (btn.id === 'btnSearch') {       //조회
      new queryFlowHelper(vm, t)
        .setGridList([grdMain2])
        .setBefore(beforeMainSearch2)
        .setQuery(searchMainData2)
        .setAfter(afterMainSearch2)
        .run()
    } 
    else if (btn.id === 'btnUpdate') {  //저장
      new saveFlowHelper(vm, t)
        .setGridList([grdMain2])
        .setBefore(saveDataValidCheck2)
        .setQuery(saveData2)
        .setAfter(()=>{onButtonsClick({ id:'btnSearch' })})
        .run()
    } 
    else if(btn.id === 'btnPrint'){    //출력
      print2()
    }
    else if(btn.id === 'btnReqApply'){    //결재상신
      new queryFlowHelper(vm, t)
        .setQuery(searchMainData2)
        .setAfter(afterSearchApply)
        .run()
    }
  }
}
const grdMain1FocusedRowIdx = ref(-1)
const grdMain2FocusedRowIdx = ref(-1)
//로우 변경 이벤트
const onGrdMain1RowChanged = async (grid, oldIdx, newIdx) => {
  grdMain1FocusedRowIdx.value = newIdx
}
const onGrdMain2RowChanged = async (grid, oldIdx, newIdx) => {
  grdMain2FocusedRowIdx.value = newIdx
}
//탭 버튼 이벤트
const onTabButtonsClick1 = async btn => {
  if (btn.id === 'btnCreate') {       //추가
    grdMain1.value
    .getDataProvider()
    .addRow({ YEAR : '',
              TM_GUBN : '',
              LAW_CD : '',
              LAW_NM : '',
              EVA_DEPT_CD : '',
              EVA_DEPT_NM : '',
              CONTENT : '',
              CYCLE : '',
              CHK_TARGET : '',
              CHK_CONTENT : '',
              DEPT_CD : '',
              DEPT_NM : '',
              MANAGER_ID : '',
              MANAGER_NM : '',
              EVA_RESULT : '',
              SOL_CONTENT : '',
              CMPNY_DIV : '',
              IDX_KEY : '',
              STATUS : '' })
  } 
  else if (btn.id === 'btnDelete') {  //삭제
    deleteRow1()     
  } 
}
const onTabButtonsClick2 = async btn => {
  if (btn.id === 'btnCreate') {       //추가
    grdMain2.value
    .getDataProvider()
    .addRow({ YEAR : '',
              TM_GUBN : '',
              LAW_CD : '',
              LAW_NM : '',
              EVA_DEPT_CD : '',
              EVA_DEPT_NM : '',
              CONTENT : '',
              CYCLE : '',
              CHK_TARGET : '',
              CHK_CONTENT : '',
              DEPT_CD : '',
              DEPT_NM : '',
              MANAGER_ID : '',
              MANAGER_NM : '',
              EVA_RESULT : '',
              SOL_CONTENT : '',
              CMPNY_DIV : '',
              IDX_KEY : '',
              STATUS : '' })
  } 
  else if (btn.id === 'btnDelete') {  //삭제
    deleteRow2()    
  } 
}
//삭제 탭1
const deleteRow1 = () => {
  new deleteFlowHelper(vm, t)
    .setConfirmMessage('삭제시 데이터 베이스에서도 바로 삭제됩니다. 진행하시겠습니까?')
    .setQuery(deleteMainData1)
    .setAfter(()=>{onButtonsClick({ id:'btnSearch' })})
    .run()
}
let deleteList = []
const deleteMainData1 = async () =>{
  let checkedRows = grdMain1.value.getGridView().getCheckedRows(true)
  
  deleteList = []

  for (let rowIdx of checkedRows) {
    let data = grdMain1.value.getDataProvider().getJsonRow(rowIdx)  
    let nullChk = await isNullCheck(data.IDX_KEY)
    if(!nullChk) deleteList.push(data) 
  }
  return commonExecuteApi({ queryId : 'MNGED0010_DELETE_02', list: deleteList })
}

const afterDelete1 = () =>{
  let checkedRows = grdMain1.value.getGridView().getCheckedRows(true)
  for(let i = checkedRows.length - 1 ; i >= 0 ; i--){
    grdMain1.value.getDataProvider().removeRow(checkedRows[i])
  }
}

//삭제 탭2
const deleteRow2 = () => {
  new deleteFlowHelper(vm, t)
    .setConfirmMessage('삭제시 데이터 베이스에서도 바로 삭제됩니다. 진행하시겠습니까?')
    .setQuery(deleteMainData2)
    .setAfter(()=>{onButtonsClick({ id:'btnSearch' })})
    .run()
}

const deleteMainData2 = async () =>{
  let checkedRows = grdMain2.value.getGridView().getCheckedRows(true)
  
  deleteList = []

  for (let rowIdx of checkedRows) {
    let data = grdMain2.value.getDataProvider().getJsonRow(rowIdx)
    let nullChk = await isNullCheck(data.IDX_KEY)
    if(!nullChk) deleteList.push(data) 
  }

  return commonExecuteApi({ queryId : 'MNGED0010_DELETE_02', list: deleteList })
}

const afterDelete2 = () =>{
  let checkedRows = grdMain2.value.getGridView().getCheckedRows(true)
  for(let i = checkedRows.length - 1 ; i >= 0 ; i--){
    grdMain2.value.getDataProvider().removeRow(checkedRows[i])
  }
}

//그리드 팝업처리
const popupOpen = (grid, clickInfo, column) =>{
  if(gridEditable.EDITABLE1){
    searchParams.ROW_IDX = clickInfo.itemIndex

    let rowData = tab.value === 'tab1' ? grdMain1.value.getDataProvider().getJsonRow(clickInfo.itemIndex) : grdMain2.value.getDataProvider().getJsonRow(clickInfo.itemIndex)

    if(clickInfo.fieldName === 'EVA_DEPT_NM'){
      deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : rowData.EVA_DEPT_NM, pageGbn : 'MNG' })
    }
    else if(clickInfo.fieldName === 'LAW_NM'){
      let lawArr = []
      grdMain1.value.getDataProvider().getJsonRows().forEach(ele => {
        lawArr.push(ele.LAW_CD)
      })
  
      mNGEB0010PopTab1Popup.value.openPopup({
        SELECT_YN : 'Y',
        LAW_CD_ARR: lawArr
      })
    } else if(clickInfo.fieldName === 'MANAGER_NM'){     
      empPopup.value.openPopup({ BSNS_CD : 'AN00', DEPT_CD : rowData.DEPT_CD })
    }
  }
}

//팝업 이벤트
const openPopup = gbn => {
  if(gbn === '부서조회'){
    deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams.DEPT_NM })
  } 
  else if(gbn === '담당조회'){
    searchParams.ROW_IDX = -1

    empPopup.value.openPopup({
      EMP_NM : searchParams.MANAGER_NM,      
      BSNS_CD : 'AN00',
      DEPT_CD : '',
    })
  }
}

//담당자 팝업 후처리
const onEmpSelected = row =>{
  if(searchParams.ROW_IDX < 0){
    searchParams.MANAGER_ID = row.EMP_NO
    searchParams.MANAGER_NM = row.EMP_NM
  }else{
    grdMain1.value.getDataProvider().setValue(searchParams.ROW_IDX, 'MANAGER_ID', row.EMP_NO)
    grdMain1.value.getDataProvider().setValue(searchParams.ROW_IDX, 'MANAGER_NM', row.EMP_NM)
  }
}

//부서 팝업 후처리
const onDeptSelected = async row =>{
  if(tab.value == 'tab1'){
    grdMain1.value.getDataProvider().setValue(searchParams.ROW_IDX, 'EVA_DEPT_CD', row.ASGN_CD)
    grdMain1.value.getDataProvider().setValue(searchParams.ROW_IDX, 'EVA_DEPT_NM', row.ASGN_SHRT_NM)
  }else{
    searchParams.DEPT_CD = row.ASGN_CD
    searchParams.DEPT_NM = row.ASGN_SHRT_NM
    searchParams.INJR_DEPT_CD = row.ASGN_CD
    searchParams.ASGN_NM = row.ASGN_FULL_NM
  
    onButtonsClick({ id:'btnSearch' })
  }
}
//법령 팝업 후처리
const onMNGEB0010PopTab1PopupSelected = async res =>{
  console.log('법령', res)
  let lawCd = res[0].LAW_CD
  let lawNm = res[0].LAW_NM
  let leTxt = res[0].LE_TXT
  if(res[0].LAW_NM1 != '' && res[0].LAW_NM1 != null){
    lawNm += ' ' + res[0].LAW_NM1 + '조'
  }
  if(res[0].LAW_NM2 != '' && res[0].LAW_NM2 != null){
    lawNm += ' ' + res[0].LAW_NM2 + '항'
  }
  if(tab.value === 'tab1'){
    grdMain1.value.getDataProvider().setValue(searchParams.ROW_IDX, 'LAW_CD', lawCd)    
    grdMain1.value.getDataProvider().setValue(searchParams.ROW_IDX, 'LAW_NM', lawNm)
    grdMain1.value.getDataProvider().setValue(searchParams.ROW_IDX, 'CONTENT', leTxt)
  }
  else{
    grdMain2.value.getDataProvider().setValue(searchParams.ROW_IDX, 'LAW_CD', lawCd)
    grdMain2.value.getDataProvider().setValue(searchParams.ROW_IDX, 'LAW_NM', lawNm)
    grdMain2.value.getDataProvider().setValue(searchParams.ROW_IDX, 'CONTENT', leTxt)
  }
}
//----------------------------조회 시작--------------------------------------
//조회 전 유효성 검사
const beforeMainSearch1 = () => {
  return true
}
const beforeMainSearch2 = () => {
  if(searchParams.DEPT_CD === '') {
    Message.warn(t('부서를 입력해주세요.'))

    return false
  }
  else return true
}
//조회
const searchMainData1 = () => {
  let searchParam = {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    YEAR : searchParams.YEAR1,
    TM_GUBN : searchParams.TM_GUBN1,
    CYCLE : searchParams.CYCLE1,
    MANAGER_ID : searchParams.MANAGER_ID,
    DEPT_CD : 'N090',
  }
  //AN00 안전보건지원부
  //X4J0 ESG추진부
  return commonSearchApi({ queryId : 'MNGED0010_SEARCH_01', param: searchParam })
}
const searchMainData2 = () => {
  let searchParam = {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    YEAR : searchParams.YEAR2,
    TM_GUBN : searchParams.TM_GUBN2,
    CYCLE : searchParams.CYCLE2,
    MANAGER_ID : '',
    DEPT_CD : searchParams.DEPT_CD,
  }

  return commonSearchApi({ queryId : 'MNGED0010_SEARCH_01', param: searchParam })
}
//조회 후
const afterMainSearch1 = res => {
  let data = []
  res.ORESULT_CUR.forEach(ele => {
    if(isNullCheck(ele.MANAGER_ID)){
      ele.MANAGER_ID = userStore.userId
      ele.MANAGER_NM = userStore.userName
    }
    if(isNullCheck(ele.EVA_DEPT_NM)){
      ele.EVA_DEPT_NM = '전 부서'
    }
    data.push(ele)
  })
  grdMain1.value.getDataProvider().setRows(data)

  if(res.ORESULT_CUR !== null && res.ORESULT_CUR.length > 0){
    gridEditable.EDITABLE1 = res.ORESULT_CUR[0].STATUS !== '40'

    grdMain1.value.getGridView().setEditOptions({editable : gridEditable.EDITABLE1})
  }
}
const afterMainSearch2 = res => {
  let data = []
  res.ORESULT_CUR.forEach(ele => {
    if(isNullCheck(ele.MANAGER_ID)){
      ele.MANAGER_ID = userStore.userId
      ele.MANAGER_NM = userStore.userName
    }
    if(isNullCheck(ele.EVA_DEPT_NM)){
      ele.EVA_DEPT_NM = '전 부서'
    }
    data.push(ele)
  })

  grdMain2.value.getDataProvider().setRows(data)

  if(res.ORESULT_CUR !== null && res.ORESULT_CUR.length > 0){
    gridEditable.EDITABLE2 = res.ORESULT_CUR[0].STATUS !== '40'

    grdMain2.value.getGridView().setEditOptions({editable : gridEditable.EDITABLE2})
  }
}
//----------------------------조회 끝----------------------------------------
//----------------------------저장 시작--------------------------------------
let saveList = []

const saveDataValidCheck1 = async () =>{
  grdMain1.value.getGridView().checkAll()
  let checkedRows = grdMain1.value.getGridView().getCheckedRows(true)

  if(checkedRows.length === 0){
    return false
  }
  
  saveList = []

  let result = gridEditable.EDITABLE1
  if(gridEditable.EDITABLE1){
      for (let rowIdx of checkedRows) {
      let data = grdMain1.value.getDataProvider().getJsonRow(rowIdx)      
      saveList.push(data) 
    }

    for(let i = 0 ; i < saveList.length ; i++){
      if(await isNullCheck(saveList[i].LAW_CD)){
        await Message.warn(t('관련법명은 필수값입니다.'))  
        return false
      } else if(await isNullCheck(saveList[i].MANAGER_ID)){
        await Message.warn(t('담당자명은 필수값입니다.'))
        return false
      } else if(await isNullCheck(saveList[i].EVA_RESULT)){
        await Message.warn(t('평가결과는 필수값입니다.'))
        return false
      }
    }
    return result
  }
  else{
    return result
  }
}

const saveDataValidCheck2 = async () =>{
  grdMain2.value.getGridView().checkAll()
  let checkedRows = grdMain2.value.getGridView().getCheckedRows(true)

  if(checkedRows.length === 0){
    return false
  }
  
  saveList = []

  let result = gridEditable.EDITABLE2
  if(gridEditable.EDITABLE2){
      for (let rowIdx of checkedRows) {
      let data = grdMain2.value.getDataProvider().getJsonRow(rowIdx)      
      saveList.push(data) 
    }

    for(let i = 0 ; i < saveList.length ; i++){
      if(await isNullCheck(saveList[i].LAW_CD)){
        await Message.warn(t('관련법명은 필수값입니다.'))  
        return false
      } else if(await isNullCheck(saveList[i].EVA_RESULT)){
        await Message.warn(t('평가결과는 필수값입니다.'))
        return false
      }
    }
    return result
  }
  else{
    return result
  }
}

//널 체크 함수
const isNullCheck = async data => {
return (data === undefined || data === null || data === '') ? true : false
}

const saveData1 = async () =>{
  if(saveList.length > 0){
    for(let i = 0 ; i < saveList.length ; i++){
      saveList[i].IDX_KEY = i
      saveList[i].CMPNY_DIV = searchParams.CMPNY_DIV
      saveList[i].YEAR = searchParams.YEAR1
      saveList[i].TM_GUBN = searchParams.TM_GUBN1
      saveList[i].DEPT_CD = 'N090'
      saveList[i].STATUS = '10'
    }
  }
  
  await commonExecuteApi({ queryId : 'MNGED0010_DELETE_01', list: [saveList[0]] })

  return await commonExecuteApi({ queryId : 'MNGED0010_SAVE_01', list: saveList })
}

const saveData2 = async () =>{
  if(saveList.length > 0){
    for(let i = 0 ; i < saveList.length ; i++){
      saveList[i].IDX_KEY = i
      saveList[i].CMPNY_DIV = searchParams.CMPNY_DIV
      saveList[i].YEAR = searchParams.YEAR2
      saveList[i].TM_GUBN = searchParams.TM_GUBN2
      saveList[i].DEPT_CD = searchParams.DEPT_CD
      saveList[i].STATUS = '10'
    }
  }

  await commonExecuteApi({ queryId : 'MNGED0010_DELETE_01', list: [saveList[0]] })

  return await commonExecuteApi({ queryId : 'MNGED0010_SAVE_01', list: saveList })
}
//----------------------------저장 끝----------------------------------------
//----------------------------출력 시작--------------------------------------
const print1 = () =>{
  grdMain1.value.getGridView().exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '법규 준수평가 등록_'+searchParams.YEAR1+ '_'+ (searchParams.TM_GUBN1 === 'UP' ? '상반기_안전' : '하반기_안전') + '.xlsx', // 저장될 파일 name
    documentTitle: { //제목
      message: searchParams.YEAR1+ ' '+ (searchParams.TM_GUBN1 === 'UP' ? '상반기 안전 ' : '하반기 안전 ') + '법규 준수평가 등록',
      visible: true,
      spaceTop: 1,
      spaceBottom: 0,
      height: 50,
      styleName: 'excelTitle',
    },
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
    indicator: 'visible', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'visible', // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t('엑셀 다운로드가 완료되었습니다.'))
    },
  })
}

const print2 = () =>{
  grdMain2.value.getGridView().exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '법규 준수평가 등록_'+searchParams.YEAR2+ '_'+ (searchParams.TM_GUBN2 === 'UP' ? '상반기_' : '하반기_') + searchParams.DEPT_NM + '.xlsx', // 저장될 파일 name
    documentTitle: { //제목
      message: searchParams.YEAR2+ ' '+ (searchParams.TM_GUBN2 === 'UP' ? '상반기 ' : '하반기 ') + searchParams.DEPT_NM +' 법규 준수평가 등록',
      visible: true,
      spaceTop: 1,
      spaceBottom: 0,
      height: 50,
      styleName: 'excelTitle',
    },
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
    indicator: 'visible', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'visible', // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t('엑셀 다운로드가 완료되었습니다.'))
    },
  })
}
//----------------------------출력 끝----------------------------------------
//----------------------------결재 시작--------------------------------------
const appData = reactive({})

const afterSearchApply = res => {
  let gubn = tab.value === 'tab1'

  appData.CMPNY_DIV = userStore.cmpnyDiv
  appData.BSNS_CD = gubn ? 'AN00' : searchParams.BSNS_CD
  appData.DEPT_CD = gubn ? 'N090' : searchParams.DEPT_CD
  appData.YEAR = gubn ? searchParams.YEAR1 : searchParams.YEAR2
  appData.TM_GUBN = gubn ? searchParams.TM_GUBN1 : searchParams.TM_GUBN2
  appData.STATUS = '40'
  appData.USER_ID = userStore.userId

  if(res.length === 0){ 
    Message.warn('결재할 데이터가 없습니다.')
    return 
  }

  approvalPopup.value.openPopup({
    CLSS_ID: 'MNGED0010',
    TITLE: appData.YEAR + '년 ' + (appData.TM_GUBN === 'UP' ? '상반기' : '하반기') + ' 법규 준수평가 등록',
    CMPNY_DIV : userStore.cmpnyDiv,
    DATA_KEY : userStore.cmpnyDiv+';'+userStore.bsnsCd+';'+userStore.deptCd+';'+userStore.asgnCd+';'+searchParams.YEAR1, 
    REPORT : getApplyHtml(res), // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE : '3', //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE : 'CLR_15', //결재라인
  })
}
//결재 내용 HTML 생성
const getApplyHtml = res =>{
  let html = ''

  if(tab.value === 'tab1'){
    html = `<html>
    <head>
    <title>OZ HTML</title>
    <style type="text/css">
    <!--
    div.offset{
    position:absolute;
    background-color:transparent;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -ms-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    left:0px;
    top:0px;
    width:0px;
    height:0px;
    }
    div{
    position:relative;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -ms-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    }
    table.one{
    width:100%;
    height:100%;
    border:0;
    }
    table.two{
    width:100%;
    height:100%;
    border:0;
    line-height:80%;
    }
    table.three{
    width:100%;
    height:100%;
    border:0;
    line-height:60%;
    }
    table.four{
    width:100%;
    height:100%;
    border:0;
    line-height:40%;
    }
    table.five{
    width:100%;
    height:100%;
    border:0;
    line-height:20%;
    }
    br{letter-spacing:0;}
    #center{
    text-align:center;
    }
    div.b_0{
    border-width:1px;
    border-color:#000000;
    border-style:solid;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -ms-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    }
    #f_9w12s0{
    font-size:9pt;
    line-height:12pt;
    letter-spacing:0pt;
    }
    font.맑은_고딕{
    font-family:맑은 고딕;
    }
    #f_10w13s0{
    font-size:10pt;
    line-height:13pt;
    letter-spacing:0pt;
    }
    font.굴림{
    font-family:굴림;
    }
    -->
    </style>
    </head>
    <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
    <div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:1123px;height:792px">
    <div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:37px;top:37px;width:47px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>No.</font></td></tr></table></div></div>
    <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:82px;top:37px;width:88px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>관련법명</font></td></tr></table></div></div>
    <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:168px;top:37px;width:86px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>평가주체부서</font></td></tr></table></div></div>
    <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:252px;top:37px;width:161px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>준수사항</font></td></tr></table></div></div>
    <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:411px;top:37px;width:60px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>주기</font></td></tr></table></div></div>
    <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:470px;top:37px;width:70px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>확인대상</font></td></tr></table></div></div>
    <div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:538px;top:37px;width:161px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>확인내용</font></td></tr></table></div></div>
    <div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:697px;top:37px;width:108px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>담당자명</font></td></tr></table></div></div>
    <div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:803px;top:37px;width:77px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>평가결과</font></td></tr></table></div></div>
    <div class=offset style="z-index:10"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:878px;top:37px;width:161px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>조치사항</font></td></tr></table></div></div>`
      let z_index = 11
      let idx = 1
      let top = 77
      let height = 40
      
      for(let i=0;i<res.ORESULT_CUR.length;i++){
        
        let cycle_txt = ''
        let eva_result_txt = ''
        if (res.ORESULT_CUR[i].CYCLE){
          cycle_txt = codeList.CYCLE.find(el => el.COD === res.ORESULT_CUR[i].CYCLE).TXT
        }
        if (res.ORESULT_CUR[i].EVA_RESULT){
          eva_result_txt = codeList.EVA_RESULT.find(el => el.COD === res.ORESULT_CUR[i].EVA_RESULT).TXT
        }
        html+=`<div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:37px;top:${top}px;width:47px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${idx++}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:82px;top:${top}px;width:88px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].LAW_NM}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:168px;top:${top}px;width:86px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].EVA_DEPT_NM}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:252px;top:${top}px;width:161px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].CONTENT}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:411px;top:${top}px;width:60px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${cycle_txt}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:470px;top:${top}px;width:70px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].CHK_TARGET}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:538px;top:${top}px;width:161px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].CHK_CONTENT}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:697px;top:${top}px;width:108px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].MANAGER_NM}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:803px;top:${top}px;width:77px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${eva_result_txt}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:878px;top:${top}px;width:161px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].SOL_CONTENT}</font></td></tr></table></div></div>`
        top = top + height - 2
      }
      html+=`</div>
      </body>
    </html>`
  }
  else
  {
    html = `<html>
    <head>
    <title>OZ HTML</title>
    <style type="text/css">
    <!--
    div.offset{
    position:absolute;
    background-color:transparent;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -ms-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    left:0px;
    top:0px;
    width:0px;
    height:0px;
    }
    div{
    position:relative;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -ms-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    }
    table.one{
    width:100%;
    height:100%;
    border:0;
    }
    table.two{
    width:100%;
    height:100%;
    border:0;
    line-height:80%;
    }
    table.three{
    width:100%;
    height:100%;
    border:0;
    line-height:60%;
    }
    table.four{
    width:100%;
    height:100%;
    border:0;
    line-height:40%;
    }
    table.five{
    width:100%;
    height:100%;
    border:0;
    line-height:20%;
    }
    br{letter-spacing:0;}
    #center{
    text-align:center;
    }
    div.b_0{
    border-width:1px;
    border-color:#000000;
    border-style:solid;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -ms-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    }
    #f_9w12s0{
    font-size:9pt;
    line-height:12pt;
    letter-spacing:0pt;
    }
    font.맑은_고딕{
    font-family:맑은 고딕;
    }
    #f_10w13s0{
    font-size:10pt;
    line-height:13pt;
    letter-spacing:0pt;
    }
    font.굴림{
    font-family:굴림;
    }
    -->
    </style>
    </head>
    <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">
    <div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:1123px;height:792px">
    <div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:37px;top:37px;width:47px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>No.</font></td></tr></table></div></div>
    <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:82px;top:37px;width:88px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>관련법명</font></td></tr></table></div></div>
    <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:168px;top:37px;width:86px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>평가주체부서</font></td></tr></table></div></div>
    <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:252px;top:37px;width:161px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>준수사항</font></td></tr></table></div></div>
    <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:411px;top:37px;width:60px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>주기</font></td></tr></table></div></div>
    <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:470px;top:37px;width:70px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>확인대상</font></td></tr></table></div></div>
    <div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:538px;top:37px;width:161px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>확인내용</font></td></tr></table></div></div>
    <div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:697px;top:37px;width:77px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>평가결과</font></td></tr></table></div></div>
    <div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:772px;top:37px;width:161px;height:40px;overflow:hidden;background-color:#FFFFFF; border-bottom-width: 0px;"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>조치사항</font></td></tr></table></div></div>`
      let z_index = 10
      let idx = 1
      let top = 77
      let height = 40
      for(let i=0;i<res.ORESULT_CUR.length;i++){

        let cycle_txt = ''
        let eva_result_txt = ''
        if (res.ORESULT_CUR[i].CYCLE){
          cycle_txt = codeList.CYCLE.find(el => el.COD === res.ORESULT_CUR[i].CYCLE).TXT
        }
        if (res.ORESULT_CUR[i].EVA_RESULT){
          eva_result_txt = codeList.EVA_RESULT.find(el => el.COD === res.ORESULT_CUR[i].EVA_RESULT).TXT
        }

        html+=`<div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:37px;top:${top}px;width:47px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${idx++}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:82px;top:${top}px;width:88px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].LAW_NM}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:168px;top:${top}px;width:86px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].EVA_DEPT_NM}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:252px;top:${top}px;width:161px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].CONTENT}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:411px;top:${top}px;width:60px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${cycle_txt}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:470px;top:${top}px;width:70px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].CHK_TARGET}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:538px;top:${top}px;width:161px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].CHK_CONTENT}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:697px;top:${top}px;width:77px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${eva_result_txt}</font></td></tr></table></div></div>
            <div class=offset style="z-index:${z_index++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:772px;top:${top}px;width:161px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].SOL_CONTENT}</font></td></tr></table></div></div>`
        top = top + height - 2
      }
      html+=`</div>
      </body>
    </html>`
  }
  return html
}

//널 체크시 빈값 메서드
const isNullAndEmpty = data =>{
  return isNullCheck(data) ? '' : data
}

/* ------------ 결재 후 결재ID 저장 ------------ */
const approvalAppkey = appKey => {
  appData.APPROVE_ID = appKey
  commonExecuteApi({ queryId : 'MNGED0010_UPDATE_01', list: [appData] })
}
//----------------------------결재 끝----------------------------------------

const onGrdMain1ValueChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  if(field === 11 && newValue === ''){
    grdMain1.value.getGridView().commit()
    grdMain1.value.getDataProvider().setValue(dataRow, 'EVA_DEPT_CD', '')
    grdMain1.value.getDataProvider().setValue(dataRow, 'EVA_DEPT_NM', '전 부서')
  }
}

const onGrdMain2ValueChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  if(field === 11 && newValue === ''){
    grdMain2.value.getGridView().commit()
    grdMain2.value.getDataProvider().setValue(dataRow, 'EVA_DEPT_CD', '')
    grdMain2.value.getDataProvider().setValue(dataRow, 'EVA_DEPT_NM', '전 부서')
  }
}


watch(() => [searchParams.YEAR1, searchParams.TM_GUBN1, searchParams.CYCLE1, searchParams.MANAGER_ID],
            ([newValueYEAR1, newValueTM_GUBN1, newValueCYCLE1, newValueMANAGER_ID]) => {
  grdMain1.value.getDataProvider().setRows()
})

watch(() => [ searchParams.YEAR2, searchParams.TM_GUBN2, searchParams.CYCLE2, searchParams.DEPT_CD],
            ([newValueYEAR2, newValueTM_GUBN2, newValueCYCLE2, newValueDEPT_CD]) => {
  grdMain2.value.getDataProvider().setRows()
})

onMounted(() => {
  vm.$nextTick(() => {
    initCodeList() 
  
    onButtonsClick({ id:'btnSearch' })

    title1.value.disableBtn('btnCreate', true)
    title1.value.disableBtn('btnDelete', true)
    title2.value.disableBtn('btnCreate', true)
    title2.value.disableBtn('btnDelete', true)
  })  
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnPrint','btnReqApply']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-sheet class="mb-2">      
      <v-tabs v-model="tab">
        <v-tab value="tab1">안전/환경</v-tab>
        <v-tab value="tab2">생산/지원</v-tab>
      </v-tabs>
    </v-sheet>
    <v-sheet v-show="tab == 'tab1'" class="h-auto">
      <!-- content-area 해당 클래스의 이름은 필수 입니다. 
            다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
      <v-card-text class="pa-3 pt-0 content-area">
        <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">           
            <i-select
              width="180px"
              :label="$t('년도')"
              v-model="searchParams.YEAR1"
              label-width="30px"
              type="YEAR"
              margin="10px"
              required
            />
            <i-select
              :label="$t('구분')"
              width="200px"
              v-model="searchParams.TM_GUBN1"
              :items="codeList.TM_GUBN"
              item-title="TXT"
              item-value="COD"
              required
            />
            <!-- <i-select
              :label="$t('주기')"
              width="200px"
              v-model="searchParams.CYCLE1"
              :items="codeList.CYCLE"
              item-title="TXT"
              item-value="COD"
            /> -->
            <i-input 
              :label="$t('담당자')"
              width="230px"
              v-model="searchParams.MANAGER_NM"
              type="Text"
              margin="10px"
              append-inner-icon="mdi-magnify"
              @keydown.enter="e => {
                openPopup('담당조회')
              }"
              @update:modelValue="e => { searchParams.MANAGER_ID = null }"
              @click:appendInner="openPopup('담당조회')"
            />
          </v-sheet>
          <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                        만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
          <v-sheet height="90%" class="mb-2">
            <IGridTitle 
              ref="title1"
              :title="$t('법규 준수평가 목록')" 
              :button-list="['btnCreate', 'btnDelete']"
              @click-button="onTabButtonsClick1"
            />
            <RealGrid
              ref="grdMain1"
              :grid-view-option="grdMainProps1.gridViewOption"
              :keys="grdMainProps1.keys" 
              :fields="grdMainProps1.fields"
              :columns="grdMainProps1.columns"
              @onCellButtonClicked="popupOpen"
              @onCurrentRowChanged="onGrdMain1RowChanged"
              @onEditRowChanged="onGrdMain1ValueChanged"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-sheet>
    <v-sheet v-show="tab == 'tab2'" class="h-auto">
      <!-- content-area 해당 클래스의 이름은 필수 입니다. 
            다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
      <v-card-text class="pa-3 pt-0 content-area">
        <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">           
            <i-select
              width="180px"
              :label="$t('년도')"
              v-model="searchParams.YEAR2"
              label-width="30px"
              type="YEAR"
              margin="10px"
              required
            />
            <i-select
              :label="$t('구분')"
              width="200px"
              v-model="searchParams.TM_GUBN2"
              :items="codeList.TM_GUBN"
              item-title="TXT"
              item-value="COD"
              required
            />
            <i-select
              :label="$t('주기')"
              width="200px"
              v-model="searchParams.CYCLE2"
              :items="codeList.CYCLE"
              item-title="TXT"
              item-value="COD"
            />   
            <i-input
              :label="$t('부서')"
              v-model="searchParams.DEPT_NM"
              width="300px"
              margin="4px"
              readonly
              required
              append-inner-icon="mdi-magnify"
              @keydown.enter="
                (e) => {
                  openPopup('부서조회');
                }
              "
              @update:modelValue="
                (e) => {
                  searchParams.DEPT_CD = null;
                }
              "
              @click:appendInner="openPopup('부서조회')"
            />
            <i-input
              :label="$t('')"
              v-model="searchParams.INJR_DEPT_CD"
              width="80px"
              readonly
            />                
          </v-sheet>
          <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                        만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
          <v-sheet height="90%" class="mb-2">
            <IGridTitle 
              ref="title2"
              :title="$t('법규 준수평가 목록')" 
              :button-list="['btnCreate', 'btnDelete']"
              @click-button="onTabButtonsClick2"
            />
            <RealGrid
              ref="grdMain2"
              :grid-view-option="grdMainProps2.gridViewOption"
              :keys="grdMainProps2.keys" 
              :fields="grdMainProps2.fields"
              :columns="grdMainProps2.columns"
              @onCurrentRowChanged="onGrdMain2RowChanged"
              @onCellButtonClicked="popupOpen"
              @onEditRowChanged="onGrdMain2ValueChanged"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-sheet>
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
    <!--담당자 팝업-->
    <EmpPopup ref="empPopup" @selected ="onEmpSelected"/>
    <!-- 결재 -->
    <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
    <!-- 법령 검색 팝업 -->
    <MNGEB0010PopTab1Popup ref="mNGEB0010PopTab1Popup" @selected="onMNGEB0010PopTab1PopupSelected" :visibleCk="false"/>
  </v-card>
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
</style>
