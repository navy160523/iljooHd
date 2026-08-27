<!-- 비상조치 계획 탭2-->
<!-- 2025.06.25 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendSMS,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import { isEmpty, isEmptyArray } from "@/@core/utils"
import { handleDragging } from '@/utils/useDrag'
import { commonDownloadFilesApi } from '@/@hiway/api/commonFileApi'
import SPPFD0010Popup from './SPPFD0010Popup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

defineOptions({
  name: '50_safety-support-SPP_F-SPPFM0010',
})

const Popup = ref(null)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const useLogStore = useLogsStore()
const menuTitle = ref(null)
const grdSub = ref(null)
const grdMain = ref(null)
const grdMain2 = ref(null)
const selectedRowIndex = ref(null)
const selectedRow = ref([])
const selectedRow2 = ref([])
const selectedRow3 = ref([])
const FIUploadPopup = ref(null)
const FIUploadPopup2 = ref(null)
const saveParams = reactive([]);
// 파일첨부 시 rowindex
const currentRowIndex = ref(null);
// 파일첨부시 누른 버튼
const currentFieldName = ref(null);
// 파일첨부 후 구분자, 저장메세지 안띄우기위함
let flag = false
// 행추가시
let isNew = false
const isVisibled = ref(true)
const isVisibled2 = ref(true)
const hasAddedRow = ref(false);
// 메인2그리드 선택할때 index저장, sub그리드에서 추가할때 사용
const clickIndex = ref(null);

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  PROCESS_CD: '', //공정설비
  USER_ID: userStore.userId,
})

const isAdmin = ref(0)

const codeList = reactive({
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  PROCESS: [],
})

const initCodeList = () => {
  Promise.all([ 
    commonSearchApi({ queryId: 'SPPFD0010_SEARCH_04', param: searchParams }),
    commonSearchApi({ queryId: 'SPPFD0010_SEARCH_05', param: searchParams }),
    commonSearchApi({ queryId: 'SPPFD0010_SEARCH_06', param: searchParams }),
    getCodeList('HHIV020')
  ]).then(res => {    
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.PROCESS = res[2].ORESULT_CUR
    codeList.item = res[0].ORESULT_CUR.map(obj => ({
      ITEM_NM: obj.TXT,
      ITEM_CD: obj.COD
    }))
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ ASGN_SHRT_NM: '전체', DEPT_CD: '' })
    codeList.PROCESS.unshift({ PROCESS_NM: '전체', PROCESS_CD: '' })
    // grdSub.value.setBindingColumn('REG_TYPE', codeList.REG_TYPE, 'COD', 'TXT')
    // 항목 초기화
  })
}

const onButtonsClick1 = btn => { 
  if(btn.id === 'btnSearch') {
    getData("B")
  } else if (btn.id === 'btnUpdate'){
    if(flag) {
      new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .showMessage(false)
      .setAfter(afterSave)
      .run()  
    }else {
      new saveFlowHelper(vm, t)
        .setBefore(beforeSave)
        .setQuery(saveData)
        .setAfter(afterSave)
        .run()
    }
  } else if (btn.id === 'btnCreate') {
    addData()
  }
}

const onButtonsClick2 = btn => {
  if (btn.id === 'btnCreate') {
    addData2()
  } else if (btn.id === 'btnUpdate'){
    if(flag) {
      new saveFlowHelper(vm, t)
      .setBefore(beforeSave2)
      .setQuery(saveData2)
      .showMessage(false)
      .setAfter(afterSave2)
      .run()  
    }else {
      new saveFlowHelper(vm, t)
        .setBefore(beforeSave2)
        .setQuery(saveData2)
        .setAfter(afterSave3)
        .run()
    }
    // new saveFlowHelper(vm, t)
    //     .setBefore(beforeSave2)
    //     .setQuery(saveData2)
    //     .setAfter(() => {
    //       onButtonsClick1({ id: 'btnSearch' })
    //     })
    //     .run()
  }
}

const getData = (val) => {

  // if(val=="B"){
  //   selectedRow.value = 0
  // }else{
  //   selectedRow.value = selectedRow.value
  // }
  if(val == "B"){
    new queryFlowHelper(vm, t)
  //    .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
      //.showMessage()
  }else{
    // 파일첨부 후 조회될때 ( main2, sub가 남아있는채로 )
    new queryFlowHelper(vm, t)
  //    .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      //afterSearch2
      .run()
  }
    
}

//  조회
const searchData = () => {
  const param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: codeList.BSNS_CD.some(item => item.BSNS_CD === searchParams.BSNS_CD) ? searchParams.BSNS_CD : '', //사업부
    DEPT_CD: codeList.DEPT_CD.some(item => item.DEPT_CD === searchParams.DEPT_CD) ? searchParams.DEPT_CD : '', //부서
    PROCESS_CD: searchParams.PROCESS_CD, //공정설비
    USER_ID: searchParams.USER_ID,
  }

  return commonSearchApi({ queryId: 'SPPFM0010_SEARCH_03', param: param })
}

// 조회 후
const afterSearch = (res) => {
  // debugger
  // console.log("data", data)
  // selectedRow.value = null
  // selectedRow2.value = null
  hasAddedRow.value = false

  
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR) 
  // grdMain2.value.getDataProvider().setRows([])
  // grdSub.value.getDataProvider().setRows([])

  gridSelect()

  gridSearch()

}
const gridSelect =()=>{
  grdMain.value.getGridView().clearCurrent();
  grdMain.value.getGridView().setCurrent({itemIndex : selectedRow.value});
  grdMain2.value.getGridView().clearCurrent();
  grdMain2.value.getGridView().setCurrent({itemIndex : selectedRow2.value});
  // grdSub.value.getGridView().clearCurrent();
}

const gridSearch = () => {
  const sessionProcess = window.sessionStorage.getItem('PROCESS_CD')
  const sessionProcess2 = window.sessionStorage.getItem('IDX_SEQ')

  // console.log("sessionProcess2", sessionProcess2)

  if(!sessionProcess2) {
    grdSub.value.getDataProvider().setRows([])
  }

  if (sessionProcess) {

  const gridView = grdMain.value.getGridView();
  const rowCount = grdMain.value.getDataProvider().getRowCount();

  // 메인2
  for (let i = 0; i < rowCount; i++) {

    const rowData = grdMain.value.getDataProvider().getJsonRow(i);

    if (rowData.PROCESS_CD === sessionProcess) {
      gridView.setCurrent({ dataRow: i });
      gridView.setFocus(true);

      onCellClicked(gridView, {
        dataRow: i,
        column: 'PROCESS_CD', // 또는 클릭으로 가정할 컬럼명
        itemIndex: gridView.getCurrent().itemIndex
      }, 'grdMain');
      
      // sessionStorage 값 삭제 (한번만 실행되도록)
      // window.sessionStorage.removeItem('PROCESS_CD');

      break;  
    }
  }
  }

  if (sessionProcess2) {

  const gridView = grdMain2.value.getGridView();
  const rowCount = grdMain2.value.getDataProvider().getRowCount();

  // 메인2
  for (let i = 0; i < rowCount; i++) {

    const rowData = grdMain2.value.getDataProvider().getJsonRow(i);

    if (rowData.IDX_SEQ === sessionProcess2) {
      gridView.setCurrent({ dataRow: i });
      gridView.setFocus(true);

      onCellClicked2(gridView, {
        dataRow: i,
        column: 'IDX_SEQ', // 또는 클릭으로 가정할 컬럼명
        itemIndex: gridView.getCurrent().itemIndex
      }, 'grdMain2');
      
      // sessionStorage 값 삭제 (한번만 실행되도록)
      // window.sessionStorage.removeItem('PROCESS_CD');

      break;  
    }
  }
  }
}

const afterSearch2 = (res) => {
  // debugger
  // console.log("data", data)
  // selectedRow.value = null
  // selectedRow2.value = null
  
  // grdSub.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const isValidDateYYYYMMDD = (str) => {
  if (!/^\d{8}$/.test(str)) return false;

  const year = +str.substring(0, 4);
  const month = +str.substring(4, 6);
  const day = +str.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}`);

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
};

const beforeSave = () => {
  // debugger
  const chekedRow = grdMain2.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  const row = grdMain2.value.getDataProvider().getJsonRow(chekedRow);
  // console.log("row", row)
  if(!row.SITU || !row.ESTM){
    Message.warn(t('상황 및 예상피해는 필수입력입니다.'))
    return false
  }

  // if(!row.ADD_YN) {
  //   Message.warn(t('새로운 행을 추가해주세요.'))
  //   return false
  // }

  // const val1 = chekedRow;
  // console.log("val1", val1)
  // const rowData1 = grdMain2.value.getDataProvider().getJsonRow(val1);
  // console.log("rowData1", rowData1)

  // // 전체렌더링이 아닌 그리드 남아있게
  // grdMain2.value.getDataProvider().setValue(chekedRow, 'SITU', rowData1.SITU)
  // grdMain2.value.getDataProvider().setValue(chekedRow, 'ESTM', rowData1.ESTM)

  saveParams.length = 0;
  for (let i = 0; i < chekedRow.length; i++) {
  const val = chekedRow[i];
  const rowData = grdMain2.value.getDataProvider().getJsonRow(val);

  // console.log("rowData", rowData)
  if(!rowData.ADD_YN) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return falsebeforeSave
  }
  saveParams.push({
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: rowData.BSNS_CD,
    DEPT_CD: rowData.DEPT_CD,
    PROCESS_CD: rowData.PROCESS_CD,
    IDX_SEQ: rowData.IDX_SEQ ? Number(rowData.IDX_SEQ) : 0,
    SITU: rowData.SITU,
    ESTM: rowData.ESTM,
    FILEID: rowData.FILEID,
    REMARK: rowData.REMARK,
    USER_ID: userStore.userId,
    USER_NM: rowData.USER_NM,
    SAVE_YN: 'Y'
  });
}
return true;
}

const saveData = () => {
  // console.log("저장전", saveParams);
  isNew = false
  return commonExecuteApi({ queryId : 'SPPFM0010_SAVE_02', list: saveParams })
}

const afterSave = () => {
  grdMain.value.getGridView().checkAll(false)
  grdSub.value.getGridView().checkAll(false)
  flag = false
  onButtonsClick1({ id: 'btnSearch' })
  // getData("F")
}

const beforeSave2 = () => {
  // debugger
  const chekedRow = grdSub.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.length = 0;
  for (let i = 0; i < chekedRow.length; i++) {
  const val = chekedRow[i];
  const rowData = grdSub.value.getDataProvider().getJsonRow(val);
  // console.log("rowData", rowData)
  saveParams.push({
    CMPNY_DIV: rowData.CMPNY_DIV,
    BSNS_CD: rowData.BSNS_CD,
    DEPT_CD: rowData.DEPT_CD,
    PROCESS_CD: rowData.PROCESS_CD,
    IDX_SEQ: rowData.IDX_SEQ,
    CNG_SEQ: rowData.CNG_SEQ,
    SITU: rowData.SITU,
    ESTM: rowData.ESTM,
    FILEID: rowData.FILEID,
    REMARK: rowData.REMARK,
    USER_ID: userStore.userId,
    USER_NM: rowData.USER_NM,
    // INSERT_DATE: rowData.INSERT_DATE?.replace(/-/g, ''),
    INSERT_DATE: dayjs().format('YYYYMMDD'),
    SAVE_YN: 'Y'
  });
}
return true;
}

const saveData2 = () => {
  // console.log("저장전", saveParams);
  hasAddedRow.value = false
  selectedRow2.value = null
  return commonExecuteApi({ queryId : 'SPPFM0010_SAVE_03', list: saveParams }) 
}
const afterSave2 = () => {
  // grdMain.value.getGridView().checkAll(false)
  // grdSub.value.getGridView().checkAll(false)
  flag = false
  // onButtonsClick1({ id: 'btnSearch' })
  getData("F")
}
const afterSave3 = () => {
  // grdMain.value.getGridView().checkAll(false)
  // grdSub.value.getGridView().checkAll(false)
  getData("B")
}

const addData = () => {
  if (!selectedRow.value || !selectedRow.value.PROCESS_CD) {
    Message.warn('공정설비를 먼저 선택해주세요');
    return;
  }
  grdMain2.value.getGridView().checkAll(false);

  window.sessionStorage.setItem('IDX_SEQ', '');

  let maxSeq = 0;
  const rowCount = grdMain2.value.getDataProvider().getRowCount();
  // console.log("rowCount", rowCount)
  for (let i = 0; i < rowCount; i++) {
    const val = Number(grdMain2.value.getDataProvider().getValue(i, 'IDX_SEQ'));
    // console.log("val", val)
    if (!isNaN(val) && val > maxSeq) {
      maxSeq = val;
    }
  }
  // console.log("max", maxSeq)

  grdMain2.value.getDataProvider().insertRow(0, {
    SITU: '',
    ESTM: '',
    INSERT_DATE: '', // 여기 오늘 날짜, 근데 인설트데이트 쓸건지 제정, 개정일 넣을건지 생각
    UPDATE_DATE: '',
    FILEID: '',
    REMARK: '',
    USER_NM: userStore.userName,
    CMPNY_DIV: selectedRow.value.CMPNY_DIV || '',
    BSNS_CD: selectedRow.value.BSNS_CD || '',
    DEPT_CD: selectedRow.value.DEPT_CD || '',
    PROCESS_CD: selectedRow.value.PROCESS_CD || '',
    IDX_SEQ: maxSeq + 1,
    ADD_YN: 'Y',
    isNew: true
  })
  grdMain2.value.getGridView().checkItem(0, true)
}

const addData2 = () => {
  if (!selectedRow2.value || !selectedRow2.value.PROCESS_CD) {
    Message.warn(t('시나리오를 선택해주세요.'))
    return;
  }

  if (hasAddedRow.value) {
    Message.warn(t('이미 최신 이력이 추가되어 있습니다.'));
    return;
  }

  const latestRow = grdMain2.value.getDataProvider().getJsonRow(clickIndex.value); // ← 선택된 index
  selectedRow2.value = latestRow;
  // console.log("selectedRow2.value222222", selectedRow2.value)

  const hasFileId = !!selectedRow2.value.FILEID;
  const subData = grdSub.value.getDataProvider().getJsonRows();

  if (hasFileId || subData.length === 0) {
    // debugger

    // FYN은 Y면 팝업에서 새로운 파일아이디 생성, Y가 아니면 다운로드위해서 기존 파일아이디 사용
    let maxSeq2 = 0;
    const rowCount = grdSub.value.getDataProvider().getRowCount();
    // console.log("rowCount", rowCount)
    for (let i = 0; i < rowCount; i++) {
      const val = Number(grdSub.value.getDataProvider().getValue(i, 'CNG_SEQ'));
      // console.log("val", val)
      if (!isNaN(val) && val > maxSeq2) {
        maxSeq2 = val;
      }
    }
    // console.log("max", maxSeq2)

    const today = dayjs().format('YYYY-MM-DD');

    grdSub.value.getDataProvider().insertRow(0, {
      SITU: selectedRow2.value.SITU,
      ESTM: selectedRow2.value.ESTM,
      INSERT_DATE: today, // 여기 오늘 날짜, 근데 인설트데이트 쓸건지 제정, 개정일 넣을건지 생각
      // UPDATE_DATE: '',
      FILEID: '',
      REMARK: '',
      USER_NM: userStore.userName,
      CMPNY_DIV: selectedRow2.value.CMPNY_DIV || '',
      BSNS_CD: selectedRow2.value.BSNS_CD || '',
      DEPT_CD: selectedRow2.value.DEPT_CD || '',
      PROCESS_CD: selectedRow2.value.PROCESS_CD || '',
      IDX_SEQ: selectedRow2.value.IDX_SEQ,
      CNG_SEQ: maxSeq2 + 1,
      ADD_YNN: 'Y',
      ADDROW: 'Y'
    })

    grdSub.value.getGridView().checkItem(0, true)
    hasAddedRow.value = true;

  } else {
  let message = '';

  if (!hasFileId) {
    message = t('변경이력에서 시나리오를 첨부하세요.');
  }
  Message.warn(message);
  }
}

// getData 조회 시
const onCellClicked = async (grid, clickData) => {
  selectedRow.value = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow) 
  // console.log("selectedRow", selectedRow.value)

  window.sessionStorage.setItem('PROCESS_CD', selectedRow.value.PROCESS_CD || '');

  const param = {
    // CMPNY_DIV 이거 selectedRow에 왜 없는지 확인해보기 
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: selectedRow.value.BSNS_CD,
    DEPT_CD: selectedRow.value.DEPT_CD,
    PROCESS_CD: selectedRow.value.PROCESS_CD, //공정설비
  }
  // console.log("param", param)

  grid.checkAll(false);
  grid.checkItem(clickData.dataRow,true)

  commonSearchApi({ queryId: 'SPPFM0010_SEARCH_04', param: param }).then(res2=>{

    // // console.log("res2", res2)

    grdMain2.value.getDataProvider().setRows(res2.ORESULT_CUR);
    // grdSub.value.getDataProvider().setRows([])
  });
}

// 메인 클릭
const onCellClickedd = async (grid, clickData) => {
  selectedRow.value = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow) 
  // console.log("selectedRow", selectedRow.value)

  window.sessionStorage.setItem('PROCESS_CD', selectedRow.value.PROCESS_CD || '');

  const param = {
    // CMPNY_DIV 이거 selectedRow에 왜 없는지 확인해보기 
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: selectedRow.value.BSNS_CD,
    DEPT_CD: selectedRow.value.DEPT_CD,
    PROCESS_CD: selectedRow.value.PROCESS_CD, //공정설비
  }
  // console.log("param", param)

  grid.checkAll(false);
  grid.checkItem(clickData.dataRow,true)

  commonSearchApi({ queryId: 'SPPFM0010_SEARCH_04', param: param }).then(res2=>{

    // // console.log("res2", res2)
 
    grdMain2.value.getDataProvider().setRows(res2.ORESULT_CUR);
    grdSub.value.getDataProvider().setRows([])
  });
}

const onCellClicked2 = async (grid, clickData) => {
  const rowIndex = clickData?.dataRow;
  
  clickIndex.value = rowIndex
  // console.log("clickIndex", clickIndex.value)
  
  // 유효하지 않으면 리턴
  if (typeof rowIndex !== 'number' || rowIndex < 0) {
    return;
  }
  
  const rowData = grdMain2.value.getDataProvider().getJsonRow(rowIndex); 
  
  if(!rowData.ADD_YN) {
    // selectedRow.value = grdMain2.value.getDataProvider().getJsonRow(clickData.dataRow) 
    // console.log("selectedRow", selectedRow.value)
    selectedRow2.value = grdMain2.value.getDataProvider().getJsonRow(clickData.dataRow) 
    // console.log("selectedRow2", selectedRow2.value)

    window.sessionStorage.setItem('IDX_SEQ', selectedRow2.value.IDX_SEQ || '');
  
    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: selectedRow2.value.BSNS_CD,
      DEPT_CD: selectedRow2.value.DEPT_CD,
      PROCESS_CD: selectedRow2.value.PROCESS_CD, //공정설비
      IDX_SEQ: selectedRow2.value.IDX_SEQ
    }
    // console.log("param", param)
  
    grid.checkAll(false);
    grid.checkItem(clickData.dataRow,true)
  
  commonSearchApi({ queryId: 'SPPFM0010_SEARCH_05', param: param }).then(res2=>{
    // console.log("res2", res2)
    res2.ORESULT_CUR.forEach(row => {
      row.SAVE_YN = 'Y';
    });
    grdSub.value.getDataProvider().setRows(res2.ORESULT_CUR);
    hasAddedRow.value = false
  }); 
  }
}

// 최신데이터 구분 위해 서브그리드 데이터 전체
// const allRows = grdSub.value.getDataProvider().getJsonRow()

// 서브그리드 데이터 중 최신 여부 판단
// const isLatest = (row, typeKey, dateKey) => {
//   const targetList = allRows.filter(r => r[typeKey] && r[dateKey])
//   if (!targetList.length) return false

//   const latest = targetList.sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]))[0]
//   return row.HIST_ID === latest.HIST_ID
// }


// 메인그리드 첨부
const onCellItemClicked = function (grid, index, clickData) {
  if (clickData.fieldName === 'BTN_MAIN2') {
    const rowData = grdMain2.value.getDataProvider().getJsonRow(index.dataRow)
    // console.log("로우", rowData)

    if(!rowData.SITU || !rowData.ESTM) {
      Message.warn(t('상황 및 예상피해를 입력해주세요'))
      return
    }

  // console.log("isNew", isNew)
    // SAVE_YN 저장여부
    if(!rowData.SAVE_YN) {
      const new1 = create_UUID()
      // 파일첨부 선택한 행 인덱스 저장
      currentRowIndex.value = index.dataRow;
      currentFieldName.value = 'BTN_MAIN2'
      FIUploadPopup.value.openPopup(new1)
      FIUploadPopup.value.enableFileUploadButton(['btnDelete'])
      isVisibled.value = true
    }else {
      FIUploadPopup.value.openPopup(rowData.FILEID)
      FIUploadPopup.value.diableFileUploadButton(['btnDelete'])
      isVisibled.value = false
    }

    isNew = false
    // if(!rowData.FILEID || !rowData.SAVE_YN) {
    // if(!rowData.SAVE_YN) {
    //   const new1 = create_UUID()
    //   // 파일첨부 선택한 행 인덱스 저장
    //   currentRowIndex.value = index.dataRow;
    //   currentFieldName.value = 'BTN_MAIN2'
    //   FIUploadPopup.value.openPopup(new1)
    // }
    // else if (rowData.SAVE_YN) {
    //   currentFieldName.value = 'BTN_MAIN2'
    //   currentRowIndex.value = index.dataRow;
    //   FIUploadPopup.value.openPopup(rowData.FILEID)
    // }
  }
}
const onCellItemClicked2 = function (grid, index, clickData) {
  if (clickData.fieldName === 'BTN_SUB') {
    const rowData = grdSub.value.getDataProvider().getJsonRow(index.dataRow)
    const allRows = grdSub.value.getDataProvider().getJsonRows()
    // console.log("all", allRows)

    const sameGroup = allRows.filter(row =>
      row.CMPNY_DIV === rowData.CMPNY_DIV &&
      row.BSNS_CD === rowData.BSNS_CD &&
      row.DEPT_CD === rowData.DEPT_CD &&
      row.PROCESS_CD === rowData.PROCESS_CD &&
      row.IDX_SEQ === rowData.IDX_SEQ
    );
    // 해당 그룹 중 CNG_SEQ 가장 큰 값
    const maxCngSeq = Math.max(...sameGroup.map(row => Number(row.CNG_SEQ)));
    // console.log('CNG_SEQ 가장 큰 값', maxCngSeq);

    // 현재 행이 최신인지 여부
    const currentCngSeq = Number(rowData.CNG_SEQ);
    // console.log("currentCngSeq", currentCngSeq)
    // console.log("maxCngSeq", maxCngSeq)
    const isLatest = currentCngSeq === maxCngSeq;
    // console.log('최신 이력?', isLatest);

    // console.log("rowDataabcssssss", rowData)
    currentRowIndex.value = index.dataRow;
    currentFieldName.value = 'BTN_SUB'
    FIUploadPopup2.value.openPopup(rowData.FILEID)
    FIUploadPopup2.value.enableFileUploadButton(['btnDelete'])

    // 여기선 새로추가했을때 add 구분자가 있으면
    // 버튼 다 열어주고
    // 구분자 없으면 버튼 잠금 ( 삭제, 업로드 )
    if(rowData.ADD_YNN || isLatest){
      FIUploadPopup2.value.enableFileUploadButton(['btnDelete'])
      isVisibled2.value = true
    }else {
      FIUploadPopup2.value.diableFileUploadButton(['btnDelete'])
      isVisibled2.value = false
    }
    // else {
    //   FIUploadPopup.value.openPopup(rowData.FILEID)
    // }


    // if(rowData.FILEID) {
    // }
  }
}

const uploaded = (val) => {
  // console.log("val", val)
  // 파일첨부 클릭 시 저장한 행 인덱스
  const rowIndex = currentRowIndex.value
  
  if (rowIndex !== -1) {
    // 행 체크
    grdMain2.value.getGridView().checkItem(rowIndex, true)
  }
  flag = true

  if(val.STATUS === 'update'){
    if(currentFieldName.value === 'BTN_MAIN2') {
      grdMain2.value.getDataProvider().setValue(rowIndex, 'FILEID', val.fileId)
      onButtonsClick1({ id: 'btnUpdate' })
    }

    // if(currentFieldName.value === 'BTN_SUB') {
    //   grdSub.value.getDataProvider().setValue(rowIndex, 'FILEID', val.fileId)
    //   onButtonsClick2({ id: 'btnUpdate' })
    // }
  } else if (val.STATUS === 'delete') {
    if(currentFieldName.value === 'BTN_MAIN2') {
      if (val.rowCnt === 0) {
        grdMain2.value.getDataProvider().setValue(rowIndex, 'FILEID', '')
        onButtonsClick1({ id: 'btnUpdate' })
      }
    }

  //   if(currentFieldName.value === 'BTN_SUB') {
  //     if (val.rowCnt === 0) {
  //     grdSub.value.getDataProvider().setValue(rowIndex, 'FILEID', val.fileId)
  //     onButtonsClick2({ id: 'btnUpdate' })
  //   }
  // }
  }
  // onButtonsClick1({ id: 'btnUpdate' })
}

const uploaded2 = (val2) => {
  // console.log("val2", val2)
  const rowIndex = currentRowIndex.value
  // console.log("rowIndex업로디드2", rowIndex)

  if (rowIndex !== -1) {
    // 행 체크
    grdSub.value.getGridView().checkItem(rowIndex, true)
  }

  flag = true
  if(val2.STATUS === 'update'){
    grdSub.value.getDataProvider().setValue(rowIndex, 'FILEID', val2.fileId)
    grdMain2.value.getDataProvider().setValue(rowIndex, 'FILEID', val2.fileId)
    onButtonsClick2({ id: 'btnUpdate' })
  }else if (val2.STATUS === 'delete') {
    if (val2.rowCnt === 0) {
        grdSub.value.getDataProvider().setValue(rowIndex, 'FILEID', '')
        grdMain2.value.getDataProvider().setValue(rowIndex, 'FILEID', '')
        onButtonsClick2({ id: 'btnUpdate' })
      }
  }
}

//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields : [
    { 
      fieldName: 'BSNS_NM', dataType: 'text', width: '60', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('사업부')}, editable: false
    },
    { 
      fieldName: 'DEPT_NM', dataType: 'text', width: '60', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('부서') }, editable: false
    },
    { 
      fieldName: 'PROCESS_NM', dataType: 'text', width: '120', styleName: 'left-column',
      header: { text: t('공정설비') }, editable: false
    },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장코드') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    // { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('공정설비별순번') },visible: false, },
  ],
  columns : [],
  columnLayout: []
})

grdMain1Props.columns = grdMain1Props.fields

//그리드 속성셋팅
const grdMain2Props = reactive({
  gridViewOption: { 
    edit: { editable:false },     
    stateBar: { visible: false },
    rowIndicator: { visible: true },
    // checkBar: { visible: true, exclusive: true} 
  },
  fields : [
    { 
      fieldName: 'SITU', dataType: 'text', width: '150',
      header: { text: t('상황'), styleName: 'header_validit' }, 
      editable: false, styleName: 'editable_column',
      // required: true,
      'styleCallback' : function(grid, dataCell){
        var ret = { editable : false, styleName : 'editable_column'}
        if(grid.getValue(dataCell.index.itemIndex, 'ADD_YN') == 'Y') {
          ret.editable = true
          ret.style = { background:'#eff8fd' }
        } else {
          ret.editable = false
          ret.style = { background:'#FFFFFF' }
        }
        return ret
      }
    },
    { 
      fieldName: 'ESTM', dataType: 'text', width: '150',
      header: { text: t('예상 피해'), styleName: 'header_validit' }, editable: false, styleName: 'editable_column',
      // required: true,
      'styleCallback' : function(grid, dataCell){
        var ret = { editable : false, styleName : 'editable_column'}
        if(grid.getValue(dataCell.index.itemIndex, 'ADD_YN') == 'Y') {
          ret.editable = true
          ret.style = { background:'#eff8fd' }
        } else {
          ret.editable = false
          ret.style = { background:'#FFFFFF' }
        }
        return ret
      }
    },
    { 
      fieldName: 'REG_DATE', dataType: 'text', width: '60',
      header: { text: t('제정') }, editable : false,
    },
    { 
      fieldName: 'REV_DATE', dataType: 'text', width: '60',
      header: { text: t('개정') }, editable : false,
    },
    { 
      fieldName: 'BTN_MAIN2', width: '50',
      header: { text: t('첨부') }, editable: false, dataType: 'text', 
      styleCallback: function(grid, dataCell) {
      let ret = {};
      const iconSize = 20;

      const fileId = grid.getValue(dataCell.index.itemIndex, 'FILEID');
      // const addYn = grid.getValue(dataCell.index.itemIndex, 'ADD_YN');
      // if (fileId || addYn) {
      if (fileId) {
        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function () {
            // 첨부 아이콘
            return new URL('/src/assets/images/icons/image-search-outline.png', import.meta.url).href;
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        };
      } 
      // else {
      //   ret.renderer = {
      //     // type: 'icon',
      //     // iconLocation: 'center',
      //     // // iconCallback: function () {
      //     // //   // 미첨부 아이콘
      //     // //   return new URL('/src/assets/icons/paperclip-off.svg', import.meta.url).href;
      //     // // },
      //     // iconHeight: iconSize,
      //     // iconWidth: iconSize,
      //   };
      // }

      return ret;
    }
    //   renderer: {
    //   type: 'html',
    //   callback: function (grid, cell, w, h) {
    //   const value = grid.getValue(cell.index.itemIndex, 'FILEID')
    //   if (value) {
    //   return `
    //     <div style="display: flex; align-items: center; justify-content: center;">
    //       <button style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;">
    //         첨부
    //       </button>
    //     </div>
    //   `;
    // } else {
    //   return `
    //     <div style="display: flex; align-items: center; justify-content: center;">
    //       <button style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;">
    //         미첨부
    //       </button>
    //     </div>
    //   `;
    // }
    // }
    //   }
      // renderer: {
      //   type: "html",
      //   callback: function (grid, cell, w, h) {
      //     const row = grid.getValues(cell.index.itemIndex); 
      //     const fileId = row.FILEID;
      //     const btnLabel = fileId ? '첨부완료' : '파일첨부';
      //     const btnColor = fileId ? '#1eaf1e' : '#1a40c7';
      //     // #e52b2b
      //     var str = 
      //     `<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
      //     <button 
      //     class="v-btn" 
      //     style="color: #fff; background: ${btnColor}; padding: 4px;"
      //       >${btnLabel}</button>
      //     </div> 
      //       `;
      //     return str;
      //   },
      // }
    },
    { 
      fieldName: 'FILEID', dataType: 'text', width: '70',
      header: { text: t('첨부') }, visible: false
    },
    { 
      fieldName: 'REMARK', dataType: 'text', width: '150',
      header: { text: t('비고') }, editable: false, styleName: 'left-column',
      // 'styleCallback' : function(grid, dataCell){
      //   var ret = { editable : false, styleName : 'editable_column'}
      //   if(grid.getValue(dataCell.index.itemIndex, 'ADD_YN') == 'Y') {
      //     ret.editable = true
      //     ret.style = { background:'#eff8fd' }
      //   } else {
      //     ret.editable = false
      //     ret.style = { background:'#FFFFFF' }
      //   }
      //   return ret
      // }
    },
    { 
      fieldName: 'USER_NM', dataType: 'text', width: '70',
      header: { text: t('등록자') }, visible: false
    },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장코드') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('공정설비별순번') },visible: false, },
    { fieldName: 'ADD_YN', dataType: 'text', header: { text: t('행추가구분자') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('행추가구분자') },visible: false, },
  ],
  columns : [],
  columnLayout: [
    {
      name: '내용',
      direction: 'horizontal',
      items: ['SITU', 'ESTM'],
    },
    {
      name: '검토 현황',
      direction: 'horizontal',
      items: ['REG_DATE', 'REV_DATE'],
    },
    'BTN_MAIN2',
    'REMARK',
    // 'SAVE_YN'
    // 'IDX_SEQ'
    // 'ADD_YN'
    // 'CMPNY_DIV',
    // 'BSNS_CD',
    // 'DEPT_CD',
    // 'PROCESS_CD',
  ]
})

grdMain2Props.columns = grdMain2Props.fields



//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { 
    checkBar: { visible: true }
    // edit: { editable:false },     
    // stateBar: { visible: false } 
  },
  fields : [
    { 
      fieldName: 'INSERT_DATE', dataType: 'text', width: '100',
      header: { text: t('일자') }, editable: false,
    },
    { 
      fieldName: 'SITU', dataType: 'text', width: '100',
      header: { text: t('상황') }, editable: false,
      // 'styleCallback' : function(grid, dataCell){
      //   var ret = { editable : false, styleName : 'editable_column'}
      //   if(grid.getValue(dataCell.index.itemIndex, 'ADD_YNN') == 'Y') {
      //     ret.editable = true
      //     ret.style = { background:'#eff8fd' }
      //   } else {
      //     ret.editable = false
      //     ret.style = { background:'#FFFFFF' }
      //   }
      //   return ret
      // }
    },
    { 
      // 업데이트데이트가 있으면 보여주고, 없으면 INSERTDATE 보여줌
      fieldName: 'ESTM', dataType: 'text', width: '100',
      header: { text: t('예상 피해') }, editable: false,
      // 'styleCallback' : function(grid, dataCell){
      //   var ret = { editable : false, styleName : 'editable_column'}
      //   if(grid.getValue(dataCell.index.itemIndex, 'ADD_YNN') == 'Y') {
      //     ret.editable = true
      //     ret.style = { background:'#eff8fd' }
      //   } else {
      //     ret.editable = false
      //     ret.style = { background:'#FFFFFF' }
      //   }
      //   return ret
      // }
    },
    { 
      fieldName: 'BTN_SUB', width: '40',
      header: { text: t('첨부') }, editable: false, dataType: 'text',
      renderer: {
      type: 'html',
      callback: function (grid, cell, w, h) {
      const value = grid.getValue(cell.index.itemIndex, 'FILEID')
      const value2 = grid.getValue(cell.index.itemIndex, 'SAVE_YN')
      if(value2){
        if (value) {
        return `
          <div style="display: flex; align-items: center; justify-content: center;">
            <button style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;">
              첨부
            </button>
          </div>
        `;
      } else {
        return `
          <div style="display: flex; align-items: center; justify-content: center;">
            <button style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;">
              미첨부
            </button>
          </div>
        `;
      }
      } else {
        return '';
      }
    }
      }
      // renderer: {
      //   type: "html",
      //   callback: function (grid, cell, w, h) {
      //     const row = grid.getValues(cell.index.itemIndex); 
      //     const fileId = row.FILEID;
      //     const btnLabel = fileId ? '첨부확인' : '첨부없음';
      //     const btnColor = fileId ? '#1eaf1e' : '#1a40c7';
      //     // #e52b2b
      //     var str = 
      //     `<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
      //     <button 
      //         class="v-btn" 
      //         style="color: #fff; background: ${btnColor}; padding: 4px;"
      //       >${btnLabel}</button>
      //     </div> 
      //       `;
      //     return str;
      //   },
      // }
    },
    { 
      fieldName: 'FILEID', dataType: 'text', width: '250', styleName: 'left-column',
      header: { text: t('파일아이디') }, 
      visible: false
    },
    { 
      fieldName: 'USER_NM', dataType: 'text', 
      header: { text: t('등록자') },
      width: '30', editable: false
    },
    { 
      fieldName: 'REMARK', dataType: 'text', 
      header: { text: t('비고') },
      width: '130', editable: false,
      'styleCallback' : function(grid, dataCell){
        const rowIndex = dataCell.index.itemIndex;
        const rowData = grdSub.value.getDataProvider().getJsonRow(rowIndex);
        const allRows = grdSub.value.getDataProvider().getJsonRows();

        // 그룹 추출
        const sameGroup = allRows.filter(row =>
          row.CMPNY_DIV === rowData.CMPNY_DIV &&
          row.BSNS_CD === rowData.BSNS_CD &&
          row.DEPT_CD === rowData.DEPT_CD &&
          row.PROCESS_CD === rowData.PROCESS_CD &&
          row.IDX_SEQ == rowData.IDX_SEQ
        );

        const maxCngSeq = Math.max(...sameGroup.map(r => Number(r.CNG_SEQ || 0)));
        const currentCngSeq = Number(rowData.CNG_SEQ || 0);
        const isLatest = currentCngSeq === maxCngSeq;

        var ret = { editable : false, styleName : 'editable_column'}
        if(grid.getValue(dataCell.index.itemIndex, 'ADD_YNN') == 'Y' || isLatest) {
          ret.editable = true
          ret.style = { background:'#eff8fd' }
        } else {
          ret.editable = false
          ret.style = { background:'#FFFFFF' }
        }
        return ret
      }
    },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('순번') },visible: false, },
    { fieldName: 'CNG_SEQ', dataType: 'text', header: { text: t('변경이력 순번') },visible: false, },
    { fieldName: 'ADD_YNN', dataType: 'text', header: { text: t('행추가구분자') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('행추가구분자') },visible: false, },
  ],
  columns : [],
  columnLayout: [
    'INSERT_DATE',
    {
      name: '내용',
      direction: 'horizontal',
      items: ['SITU', 'ESTM'],
    },
    'BTN_SUB', 'USER_NM',
    'REMARK',
    // 'IDX_SEQ',
    // 'CNG_SEQ'
    // 'ADD_YNN'
  ]
})

grdSubProps.columns = grdSubProps.fields

//사업부 변경시 부서 조회
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    //부서조회
    commonSearchApi({
      queryId: 'SPPFD0010_SEARCH_05',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParams.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ ASGN_SHRT_NM: '전체', DEPT_CD: '' })
    })
  }
)

// 공정안전 자료와 관계없는 관리자가 왔을때 콤보박스 바인딩
const selectedBsnsCd = computed({
  get: () => {
    return codeList.BSNS_CD.some(item => item.BSNS_CD === searchParams.BSNS_CD)
      ? searchParams.BSNS_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.BSNS_CD = value;
  }
});

const selectedDeptCd = computed({
  get: () => {
    return codeList.DEPT_CD.some(item => item.DEPT_CD === searchParams.DEPT_CD)
      ? searchParams.DEPT_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.DEPT_CD = value;
  }
})

// 파일id 생성
const create_UUID = () => {
  grdMain.value.getGridView().filterPanel.clearInput()
  let dt = new Date().getTime()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

onMounted(() => {

  // PSM 관리자 확인
  // 2: PSM 모듈 관리자, 1: PSM 부서 담당자, 0: 일반 사용자
  if(
    useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes("SPPF001")
  ) {
    // isAdmin.value = 2
    isAdmin.value = 2
  }else if(userStore.authGrpCd.includes("SPPF002")) {
    isAdmin.value = 1
  }

  if(isAdmin.value === 0) {
    return
  }

  initCodeList()
  getData("B")
  grdMain.value.getGridView().filterPanel.visible = true
  grdSub.value.getGridView().filterPanel.visible = true

})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnSearch']"
        :use-permission="true"
        @click-button="onButtonsClick1"
        :title="$t('시나리오')"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <!-- v-model="searchParams.BSNS_CD" selectedBsnsCd -->
            <i-select
              label-width="50px"
              width="200px"
              :label="$t('사업부')"
              v-model="selectedBsnsCd"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :disabled="!(isAdmin > 1)"
            />
            <!-- v-model="searchParams.DEPT_CD" selectedDeptCd-->
            <i-select
              label-width="50px"
              width="240px"
              :label="$t('부서')"
              v-model="selectedDeptCd"
              :items="codeList.DEPT_CD"
              item-title="ASGN_SHRT_NM"
              item-value="DEPT_CD"
              :disabled="!(isAdmin > 1)"
              :readonly="isEmpty(searchParams.BSNS_CD)"
            />
            <i-select
              label-width="50px"
              width="240px"
              :label="$t('공정설비')"
              v-model="searchParams.PROCESS_CD"
              :items="codeList.PROCESS"
              item-title="PROCESS_NM"
              item-value="PROCESS_CD"
            />
          </div>
        </v-sheet>
        <!-- ref="menuTitle" -->
        <IGridTitle
        :button-list="['btnCreate', 'btnUpdate']"
        @click-button="onButtonsClick1"
        />
        <VRow no-gutters>
          <VCol cols="12" class="pa-2 d-flex">
            <RealGrid
              ref="grdMain"
              style="width: 28%; height: 100%; margin-right: 2%"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain1Props.keys" 
              :fields="grdMain1Props.fields"
              :columns="grdMain1Props.columns"
              :column-layout="grdMain1Props.columnLayout"
              @onCellClicked="onCellClickedd"
              />
              <!-- @onCellItemClicked="onCellItemClicked"  -->
              
              <RealGrid
              ref="grdMain2"
              style="width: 70%; height: 100%"
              :grid-view-option="grdMain2Props.gridViewOption"
              :keys="grdMain2Props.keys" 
              :fields="grdMain2Props.fields"
              :columns="grdMain2Props.columns"
              :column-layout="grdMain2Props.columnLayout"
              @onCellItemClicked="onCellItemClicked"
              @onCellClicked="onCellClicked2"
              />
            </VCol>
        </VRow>
        <VRow no-gutters>
          <VCol class="pa-2 pt-0 pb-0">
            <IGridTitle 
              :title="$t('변경이력확인')"
              :button-list="['btnCreate', 'btnUpdate']"        
              @click-button="onButtonsClick2"
            >
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              style="height: calc(90% - 50px);"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys" 
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout"    
              @onCellItemClicked="onCellItemClicked2"
              />
            </VCol>
        </VRow>
      </div>
      <!-- <SPPFD0010Popup ref="Popup" @upData="upData" /> -->
      <IUploadPopup ref="FIUploadPopup" @uploaded="uploaded" :isVisibled="isVisibled"/>
      <!-- gridTitle="첨부파일 다운로드" -->
      <IUploadPopup ref="FIUploadPopup2" 
      @uploaded="uploaded2"
      :button-list="['btnDownLoad','btnDelete', 'btnClose']"
      :isVisibled="isVisibled2"
      ></IUploadPopup>
      <!-- width="1200" 
      height="800"  -->
    </v-card-text>
  </v-card>
    
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>