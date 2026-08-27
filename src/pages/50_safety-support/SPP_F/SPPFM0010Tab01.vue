<!-- 비상조치 계획 탭1-->
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
import SPPFM0010Tab01Popup from './SPPFM0010Tab01Popup.vue'
import { useRouter } from 'vue-router'

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
const selectedRowIndex = ref(null)
const selectedRow = ref([])
const selectedRow2 = ref([])
const selectedRow3 = ref([])
const FIUploadPopup = ref(null)
const FIUploadPopup2 = ref(null)
const saveParams = reactive({});
// 파일첨부 시 rowindex
const currentRowIndex = ref(null);
// 파일첨부시 누른 버튼
const currentFieldName = ref(null);
// 파일첨부 후 구분자, 저장메세지 안띄우기위함
let flag = false
const isVisibled = ref(true)
const isVisibled2 = ref(true)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  PROCESS_CD: '', //공정설비
  USER_ID: userStore.userId,
})

const isAdmin = ref(0)

// 화면이동용
const router=useRouter()

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
    isVisibled.value = true
    isVisibled2.value = true
  })
}

// 등록/수정 구분자
const isNew = ref(false)

const onButtonsClick = btn => { 
  if(btn.id === 'btnSearch') {
    getData("B")
  } else if (btn.id === 'btnCreate'){
    // console.log("selectedRow.value", selectedRow.value)
    if(selectedRow.value && Object.keys(selectedRow.value).length > 0) {

      const hasFileId = !!selectedRow.value.FILEID;
      const hasResultFileId = !!selectedRow.value.RESULT_FILEID;
      const hasWDate = !!selectedRow.value.WDATE

      if ((hasFileId && hasResultFileId) || !hasWDate) {
      // FYN은 Y면 팝업에서 새로운 파일아이디 생성, Y가 아니면 다운로드위해서 기존 파일아이디 사용
      const tempRow = { ...selectedRow.value, FYN: 'Y' };
      Popup.value.openPopup(tempRow)
      // selectedRow2.value = {};
    } else {
      let message = '';

      if (!hasFileId && !hasResultFileId) {
        message = t('변경이력에서 비상조치계획, 훈련결과를 첨부하세요.');
      } else if (!hasFileId) {
        message = t('변경이력에서 비상조치계획을 첨부하세요.');
      } else if (!hasResultFileId) {
        message = t('변경이력에서 훈련결과를 첨부하세요.');
      }

      Message.warn(message);
    }}else {
      Message.warn('행을 선택하세요')
    }
  } 
  else if (btn.id === 'btnUpdate'){
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
        .setAfter(() => {
          onButtonsClick({ id: 'btnSearch' })
        })
        .run()
    }
  }
}

        
const afterSave = () => {
  grdMain.value.getGridView().checkAll(false)
  flag = false
  grdSub.value.getDataProvider().setRows([])
  onButtonsClick({ id: 'btnSearch' })
}
const getData = async (val) => {
  // console.log("조회val", val)

  if(val=="B"){
    selectedRow.value = 0
  }else{
    selectedRow.value = selectedRow.value
  }
  new queryFlowHelper(vm, t)
    .setQuery(async ()=> await searchData())
    .setAfter(afterSearch)
    .run()

}

//  조회
const searchData = async () => {
  const param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: codeList.BSNS_CD.some(item => item.BSNS_CD === searchParams.BSNS_CD) ? searchParams.BSNS_CD : '', //사업부
    DEPT_CD: codeList.DEPT_CD.some(item => item.DEPT_CD === searchParams.DEPT_CD) ? searchParams.DEPT_CD : '', //부서
    PROCESS_CD: searchParams.PROCESS_CD, //공정설비
    USER_ID: searchParams.USER_ID,
  }

  return commonSearchApi({ queryId: 'SPPFM0010_SEARCH_01', param: param })
}

// 조회 후
const afterSearch = async (res) => {
   console.log("res", res)
  // console.log("val", val)
  // console.log('selectedRow.value', selectedRow.value)
  // debugger
  const data = res.ORESULT_CUR.map(row => {
    if (row.WDATE && /^\d{8}$/.test(row.WDATE)) {
      row.WDATE = `${row.WDATE.slice(0, 4)}-${row.WDATE.slice(4, 6)}-${row.WDATE.slice(6, 8)}`;
    }
    return row;
  });
  //  console.log("서치01", data)

    grdMain.value.getDataProvider().setRows(data)
    // grdSub.value.getDataProvider().setRows([])

    await nextTick();
    // setTimeout(() => {
    //   gridSelect();
    // }, 0);
    gridSelect()

    const sessionProcess = window.sessionStorage.getItem('PROCESS_CD')
    // console.log("sessionProcess", sessionProcess)

    if (sessionProcess) {

      const gridView = grdMain.value.getGridView();
      const rowCount = grdMain.value.getDataProvider().getRowCount();

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
}
const gridSelect =()=>{
  grdMain.value.getGridView().clearCurrent();
  grdMain.value.getGridView().setCurrent({itemIndex : selectedRow.value});
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
  const chekedRow = grdMain.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.length = 0;
  for (let i = 0; i < chekedRow.length; i++) {
  const val = chekedRow[i];
  const rowData = grdMain.value.getDataProvider().getJsonRow(val);
  let WDATEE = rowData.WDATE;

  if (WDATEE) {
      if (typeof WDATEE === 'string') {
        // YYYY-MM-DD → 하이픈 제거
        if (/^\d{4}-\d{2}-\d{2}$/.test(WDATEE)) {
          WDATEE = WDATEE.replace(/-/g, '');
        }

        // 최종 검증: YYYYMMDD 형식 + 실제 존재하는 날짜
        if (!isValidDateYYYYMMDD(WDATEE)) {
          Message.warn(`'작성일자'는 실제 존재하는 'YYYYMMDD' 형식의 날짜여야 합니다.`);
          return false;
        }
      }
    }

  saveParams.push({
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: rowData.BSNS_CD,
    DEPT_CD: rowData.DEPT_CD,
    PROCESS_CD: rowData.PROCESS_CD,
    IDX_SEQ: rowData.IDX_SEQ ? Number(rowData.IDX_SEQ) : 0, 
    WDATE: WDATEE,
    STATUS: rowData.STATUS,
    FILEID: rowData.FILEID,
    RESULT_FILEID: rowData.RESULT_FILEID,
    REMARK: rowData.REMARK,
    USER_ID: userStore.userId,
    USER_NM: rowData.USER_NM
  });
}
return true;
}

const saveData = () => {
  // console.log("저장전", saveParams);
  return commonExecuteApi({ queryId : 'SPPFM0010_SAVE_01', list: saveParams })
}

// 팝업 종료 이벤트(저장버튼 클릭 시)
const upData = () => {
  // bindingItems()
  // bindingFile()
  // onButtonsClick({ id: "btnSearch" })
  getData("F")
}

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

  commonSearchApi({ queryId: 'SPPFM0010_SEARCH_02', param: param }).then(res2=>{
    // console.log("res2", res2)
    const data = res2.ORESULT_CUR.map(row => {
    if (row.WDATE && /^\d{8}$/.test(row.WDATE)) {
      row.WDATE = `${row.WDATE.slice(0, 4)}-${row.WDATE.slice(4, 6)}-${row.WDATE.slice(6, 8)}`;
    }
    return row;
    });
    // console.log("data21222222", data)

    grdSub.value.getDataProvider().setRows(data);
  }); 
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


// 메인그리드 첨부, 훈련결과 버튼
const onCellItemClicked = function (grid, index, clickData) {
  if (clickData.fieldName === 'FILEID') {
    const rowData = grdMain.value.getDataProvider().getJsonRow(index.dataRow)

    if(rowData.FILEID) {
      currentFieldName.value = 'FILEID'
      currentRowIndex.value = index.dataRow;
      FIUploadPopup2.value.openPopup(rowData.FILEID)
      isVisibled2.value = false
    }

}else if(clickData.fieldName === 'RESULT_FILEID'){
  // const rowData = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  //   // console.log("메인훈련", rowData)
  //   if(rowData.RESULT_FILEID) {
  //     currentFieldName.value = 'RESULT_FILEID'
  //     currentRowIndex.value = index.dataRow;
  //     FIUploadPopup2.value.openPopup(rowData.RESULT_FILEID)
  //     isVisibled2.value = false
  // }
  router.push({ path: '/50_safety-support/SPP_A/SPPAB0010' })
}
}
const onCellItemClicked2 = function (grid, index, clickData) {
  if (clickData.fieldName === 'BTN_IMG2') {
    // const rowData = grdSub.value.getDataProvider().getJsonRow(index.dataRow)
    // const allRows = grdSub.value.getDataProvider().getJsonRows()
    // // console.log("rowData", rowData.IDX_SEQ)

    // const latestRow = allRows.reduce((max, row) => {
    // return Number(row.IDX_SEQ) > Number(max.IDX_SEQ) ? row : max;
    // }, allRows[0]);
    // // console.log("latestRow", latestRow.IDX_SEQ)

    // const isLatest = rowData.IDX_SEQ === latestRow.IDX_SEQ;
    // // console.log("isLatest", isLatest)

    // // selectedRow.value = rowData
    // currentFieldName.value = 'BTN_IMG2'

    // const newRow = {...rowData, NEW2: isLatest ? 'Y' : 'N'}
    // // console.log("newRow", newRow.NEW2)
    // if(newRow.NEW2 === 'Y'){
    //   FIUploadPopup.value.openPopup(newRow.RESULT_FILEID)
    //   // FIUploadPopup.value.enableFileUploadButton(['btnFileUpload'])
    //   isVisibled.value = true
    //   FIUploadPopup.value.enableFileUploadButton(['btnDelete'])
    //   newRow.NEW2 = ''
    // }else if(newRow.NEW2 === 'N'){
    //   // FIUploadPopup.value.diableFileUploadButton(['btnFileUpload'])
    //   isVisibled.value = false
    //   FIUploadPopup.value.diableFileUploadButton(['btnDelete'])
    //   FIUploadPopup.value.openPopup(newRow.RESULT_FILEID)
    //   newRow.NEW2 = ''
    // }
    router.push({ path: '/50_safety-support/SPP_A/SPPAB0010' })
  }
}

const onCellDblClicked = (grid, clickData) => {
  selectedRow.value = grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)
  // console.log("selectedRow.value", selectedRow.value) 

  // 최신데이터 찾기
  const allRows = grdSub.value.getDataProvider().getJsonRows()

  // 최신
  const latestRow = allRows.reduce((max, row) => {
  return Number(row.IDX_SEQ) > Number(max.IDX_SEQ) ? row : max;
  }, allRows[0]);
  // console.log("latestRow", latestRow)
  const isLatest = Number(selectedRow.value.IDX_SEQ) === Number(latestRow.IDX_SEQ);
  // console.log("isLatest", isLatest)
  

  if(selectedRow.value && Object.keys(selectedRow.value).length > 0) {
      // FYN은 Y면 팝업에서 새로운 파일아이디 생성, Y가 아니면 다운로드위해서 기존 파일아이디 사용
      // 메인그리드에서 추가버튼으로 팝업을 열면 무조건 새로운 파일아이디 생성
      const tempRow = { ...selectedRow.value, FYN: 'N', NEW: isLatest ? 'Y' : 'N'  };
      Popup.value.openPopup(tempRow)
      // selectedRow2.value = {};
    }
}

const uploaded = async (val) => {
  // console.log("val", val)
  // 파일첨부 클릭 시 저장한 행 인덱스
  const rowIndex = currentRowIndex.value
  
  if (rowIndex !== -1) {
    // 행 체크
    grdMain.value.getGridView().checkItem(rowIndex, true)
  }

  // 파일 업로드 OR 삭제 구분자
  // 저장메세지 안띄우기위함
  flag = true

  if(val.STATUS === 'update'){
    // if(currentFieldName.value === 'BTN_IMG1') {
    //   grdMain.value.getDataProvider().setValue(rowIndex, 'FILEID', val.fileId)
    //   const today = dayjs().format('YYYY-MM-DD')
    //   grdMain.value.getDataProvider().setValue(rowIndex, 'WDATE', today)
    //   grdMain.value.getDataProvider().setValue(rowIndex, 'USER_NM', userStore.userName)
    // }else 
    // console.log('currentFieldName.value', currentFieldName.value)
    if(currentFieldName.value === 'BTN_IMG2'){
      // grdSub.value.getDataProvider().setValue(rowIndex, 'RESULT_FILEID', val.fileId)

      Object.assign(saveParams, {
      ...selectedRow.value, // 그 행 전체 데이터를 저장 파라미터로 사용
      CMPNY_DIV: userStore.cmpnyDiv,
      RESULT_FILEID: val.fileId,
      WDATE: dayjs().format('YYYYMMDD'),
      USER_NM: userStore.userName
    })
      // console.log("업로드후저장", saveParams)
      try {
        await  commonExecuteApi({ queryId : 'SPPFM0010_SAVE_01', list: [saveParams] })
        await onButtonsClick({ id: "btnSearch" })
      } catch (error){
        console.error("저장 또는 조회 중 오류 발생:", error);
      }
    }
  } else if (val.STATUS === 'delete') {
    // if(currentFieldName.value === 'BTN_IMG1') {
    //   if (val.rowCnt === 0) {
    //     grdMain.value.getDataProvider().setValue(rowIndex, 'FILEID', '')
    //     grdMain.value.getDataProvider().setValue(rowIndex, 'WDATE', '')
    //     grdMain.value.getDataProvider().setValue(rowIndex, 'USER_NM', userStore.userName)
    //   }
    // }else 
    if(currentFieldName.value === 'BTN_IMG2'){
        Object.assign(saveParams, {
      ...selectedRow.value, // 그 행 전체 데이터를 저장 파라미터로 사용
      CMPNY_DIV: userStore.cmpnyDiv,
      RESULT_FILEID: '',
      WDATE: dayjs().format('YYYYMMDD'),
      USER_NM: userStore.userName
    })
      // console.log("업로드후저장", saveParams)
      try {
        await  commonExecuteApi({ queryId : 'SPPFM0010_SAVE_01', list: [saveParams] })
        await getData("F")
        // await onButtonsClick({ id: "btnSearch" })
      } catch (error){
        console.error("저장 또는 조회 중 오류 발생:", error);
      }

        // grdSub.value.getDataProvider().setValue(rowIndex, 'RESULT_FILEID', '')
        // grdMain.value.getDataProvider().setValue(rowIndex, 'USER_NM', userStore.userName)
      }
    }
  
  // onButtonsClick({ id: 'btnUpdate' })
}

//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption: { 
    edit: { editable:false },     
    stateBar: { visible: false },
    rowIndicator: { visible: true },
    // checkBar: { visible: true, exclusive: true}
    // checkBar: { visible: true } 
  },
  fields : [
    { 
      fieldName: 'BSNS_NM', dataType: 'text', width: '70', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('사업부')}, editable: false
    },
    { 
      fieldName: 'DEPT_NM', dataType: 'text', width: '70', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('부서') }, editable: false
    },
    { 
      fieldName: 'PROCESS_NM', dataType: 'text', width: '100', styleName: 'left-column',
      header: { text: t('공정설비') },  editable: false
    },
    { 
      fieldName: 'WDATE', dataType: 'text', width: '70',
      header: { text: t('작성일자') }, editable: false
      // editable: true, styleName: 'editable_column',
    },
    { 
      fieldName: 'USER_NM', dataType: 'text', width: '70',
      header: { text: t('등록자') }, visible: false
    },
    { 
      fieldName: 'STATUS', dataType: 'text', width: '50',
      header: { text: t('결재완료') },  editable: false,
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          const row = grid.getValues(cell.index.itemIndex); 
          const fileId = row.FILEID;
          const btnLabel = fileId ? 'Y' : 'N';
          // const btnColor = fileId ? '#1eaf1e' : '#1a40c7';
          // #e52b2b
          var str = 
          `<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
          <div 
              class="v-btn" 
            >${btnLabel}</div>
          </div> 
            `;
          return str;
        },
      }
    },
    { 
      fieldName: 'FILEID', width: '70',
      header: { text: t('첨부') }, editable: false, dataType: 'text',
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20
        
        if (dataCell.value) {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/image-search-outline.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        return ret;
      },
    },
    // { 
    //   fieldName: 'FILEID', dataType: 'text', width: '70',
    //   header: { text: t('첨부') }, visible: false
    // },
    { 
      fieldName: 'RESULT_FILEID', width: '70',
      header: { text: t('훈련결과') }, editable: false, dataType: 'text',
      // styleCallback: function(grid, dataCell) {
      //   let ret = {}
      //   const iconSize = 20
      //   const value = grid.getValue(cell.index.itemIndex, 'FILE_YN')
      //   if (dataCell.value) {
      //     ret.renderer = {
      //       type: 'icon',
      //       iconLocation: 'center',
      //       iconCallback: function(grid, cell) {
      //         return new URL('/src/assets/images/icons/image-search-outline.png', import.meta.url).href
      //       },
      //       iconHeight: iconSize,
      //       iconWidth: iconSize,
      //     }
      //   }
      //   return ret;
      // },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'IDX_SEQ')
          const value2 = grid.getValue(cell.index.itemIndex, 'WDATE')
          
          if (value && value2) {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >결과등록</button>
              </div>
            `;
          } 
          else
          {
            return '';
          }
        }
      }
    },
    // { 
    //   fieldName: 'RESULT_FILEID', dataType: 'text', width: '70',
    //   header: { text: t('훈련결과') }, visible: false
    // },
    { 
      fieldName: 'REMARK', dataType: 'text', width: '170',
      header: { text: t('비고') }, styleName: 'left-column'
    },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장코드') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('공정설비별순번') },visible: false, },
  ],
  columns : [],
  columnLayout: [
    'BSNS_NM',
    'DEPT_NM',
    'PROCESS_NM',
    {
      name: 'PSM 비상조치계획',
      direction: 'horizontal',
      items: ['WDATE', 'STATUS', 'FILEID'],
    },
    // 'FILEID',
    'RESULT_FILEID',
    // 'RESULT_FILEID',
    'REMARK',
    // 'IDX_SEQ'
  ]
})

grdMain1Props.columns = grdMain1Props.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { 
    // edit: { editable:false },     
    // stateBar: { visible: false } 
  },
  fields : [
    { 
      fieldName: 'INSERT_DATE', dataType: 'text', width: '100',
      header: { text: t('일자') }, editable: false
    },
    { 
      fieldName: 'PROCESS_NM', dataType: 'text', width: '100',
      header: { text: t('구분') }, editable: false
    },
    { 
      // 업데이트데이트가 있으면 보여주고, 없으면 INSERTDATE 보여줌
      fieldName: 'WDATE', dataType: 'text', width: '100',
      header: { text: t('일자') }, editable: false
    },
    { 
      fieldName: 'STATUS', dataType: 'text', width: '50',
      header: { text: t('결재완료') },  editable: false,
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          const row = grid.getValues(cell.index.itemIndex); 
          const fileId = row.FILEID;
          const btnLabel = fileId ? 'Y' : 'N';
          // const btnColor = fileId ? '#1eaf1e' : '#1a40c7';
          // #e52b2b
          var str = 
          `<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
          <div 
              class="v-btn" 
            >${btnLabel}</div>
          </div> 
            `;
          return str;
        },
      }
    },
    { 
      fieldName: 'BTN_IMG', width: '40',
      header: { text: t('첨부') }, editable: false, dataType: 'text',
      renderer: {
      type: 'html',
      callback: function (grid, cell, w, h) {
      const value = grid.getValue(cell.index.itemIndex, 'FILEID')
      // <button style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;">
      // </button>
      if (value) {
      return `
        <div style="display: flex; align-items: center; justify-content: center;">
          첨부
        </div>
      `;
    } else {
      return `
        <div style="display: flex; align-items: center; justify-content: center;">
          미첨부
        </div>
      `;
    }
    }
      }
    },
    { 
      fieldName: 'FILEID', dataType: 'text', width: '250', styleName: 'left-column',
      header: { text: t('파일아이디') }, 
      visible: false
    },
    { 
      fieldName: 'BTN_IMG2', width: '70',
      header: { text: t('훈련결과') }, editable: false, dataType: 'text',
      renderer: {
      type: 'html',
      callback: function (grid, cell, w, h) {
      const value = grid.getValue(cell.index.itemIndex, 'IDX_SEQ')
      if (value) {
      return `
        <div style="display: flex; align-items: center; justify-content: center;">
          <button style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;">
            결과등록
          </button>
        </div>
      `;
    } else {
      // return `
      //   <div style="display: flex; align-items: center; justify-content: center;">
      //     <button style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;">
      //       미첨부
      //     </button>
      //   </div>
      // `;
      return ``;
    }
    }
      }
    },
    { 
      fieldName: 'RESULT_FILEID', dataType: 'text', width: '70',
      header: { text: t('훈련결과') }, visible: false
    },
    { 
      fieldName: 'USER_NM', dataType: 'text', 
      header: { text: t('등록자') },
      width: '30', editable: false
    },
    { 
      fieldName: 'REMARK', dataType: 'text', 
      header: { text: t('비고') },
      width: '130',
    },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'IDX_SEQ', dataType: 'text', header: { text: t('공정설비별순번') },visible: false, },
    { 
      fieldName: 'BSNS_NM', dataType: 'text', width: '70', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('사업부')}, editable: false, visible: false
    },
    { 
      fieldName: 'DEPT_NM', dataType: 'text', width: '70', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('부서') }, editable: false, visible: false
    },
  ],
  columns : [],
  columnLayout: [
    'INSERT_DATE',
    'PROCESS_NM',
    {
      name: 'PSM 비상조치계획',
      direction: 'horizontal',
      items: ['WDATE', 'STATUS', 'BTN_IMG'],
    },
    'BTN_IMG2', 'USER_NM',
    'REMARK',
    // 'IDX_SEQ'
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
      <!-- btnUpdate -->
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnCreate']"
        :use-permission="true"
        @click-button="onButtonsClick"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height" style="height: 100%;">
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
        <VRow no-gutters>
          <VCol cols="12" class="pa-2">
            <RealGrid
              ref="grdMain"
              style="height: 100%"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain1Props.keys" 
              :fields="grdMain1Props.fields"
              :columns="grdMain1Props.columns"
              :column-layout="grdMain1Props.columnLayout"
              @onCellClicked="onCellClicked"
              @onCellItemClicked="onCellItemClicked" 
              />
            </VCol>
        </VRow>
        <VRow no-gutters>
          <VCol class="pa-2 pt-0 pb-0">
            <IGridTitle 
              :title="$t('변경이력확인')"          
            >
            </IGridTitle>
            <!-- style="height: calc(100% - 50px);" -->
            <RealGrid
              ref="grdSub"
              style="height: 75%"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys" 
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout"    
              @onCellItemClicked="onCellItemClicked2"
              @onCellDblClicked="onCellDblClicked"
              />
            </VCol>
        </VRow>
      </div>
      <SPPFM0010Tab01Popup ref="Popup" @upData="upData" />
      <IUploadPopup ref="FIUploadPopup" @uploaded="uploaded" :isVisibled="isVisibled"/>
      <IUploadPopup ref="FIUploadPopup2" 
      gridTitle="첨부파일 다운로드"
      width="1200" 
      height="800" 
      :button-list="['btnDownLoad','btnClose']"
      :isVisibled="isVisibled2"
      ></IUploadPopup>
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