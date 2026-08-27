<!-- 공정위험성평가 -->
<!-- 2025.03.28 -->

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
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import { isEmpty, isEmptyArray } from "@/@core/utils"
import { handleDragging } from '@/utils/useDrag'
import { commonDownloadFilesApi } from '@/@hiway/api/commonFileApi'
import SPPFD0010Popup from './SPPFD0010Popup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

defineOptions({
  name: '50_safety-support-SPP_F-SPPFD0010',
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

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  PROCESS_CD: '', //공정설비
  USER_ID: userStore.userId,
})

const saveParam = reactive({
  HIST_ID: '',
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  PROCESS_CD: '',
  PROCESS_NM: '',
  REG_DT: '',
  REG_TECH: '',
  REG_FILE_ID: '',
  IRR_DT: '',
  IRR_TECH: '',
  IRR_FILE_ID: '',
  REG_CONTENT: '',
  IRR_CONTENT: '',
  REMARK: '',
  REG_TYPE: '',
})

const isAdmin = ref(0)

const codeList = reactive({
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  PROCESS: [],
  item: [],
  EVAL_TYPE: [
    {COD: '0', TXT: '정기'},
    {COD: '1', TXT: '수시'},
  ],
  EVAL_TECH : [
    {COD: '0', TXT: 'HAZOP'},
    {COD: '1', TXT: 'K-PSR'},
    {COD: '2', TXT: 'CHECKLIST'},
  ],
  REG_TYPE: [
    {COD: '0', TXT: '정기'},
    {COD: '1', TXT: '수시'},
  ],
  REG_TECH: [
    {COD: '0', TXT: 'HAZOP'},
    {COD: '1', TXT: 'K-PSR'},
    {COD: '2', TXT: 'CHECKLIST'},
  ],
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
    codeList.item = res[3].ORESULT_CUR.map(obj => ({
      ITEM_NM: obj.TXT,
      ITEM_CD: obj.COD
    }))
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ ASGN_SHRT_NM: '전체', DEPT_CD: '' })
    codeList.PROCESS.unshift({ PROCESS_NM: '전체', PROCESS_CD: '' })
    grdSub.value.setBindingColumn('REG_TYPE', codeList.REG_TYPE, 'COD', 'TXT')
    // 항목 초기화
  })
}

// 등록/수정 구분자
const isNew = ref(false)

const onButtonsClick = btn => { 
  if(btn.id === 'btnSearch') {
    getData("B")
  } else if (btn.id === 'btnRegisterModify'){
    // console.log("selectedRow2.value", selectedRow2.value)
    if (selectedRow2.value && Object.keys(selectedRow2.value).length > 0) {
    const allRows = grdSub.value.getDataProvider().getJsonRows();

    if (!allRows.length) {
      Popup.value.openPopup(selectedRow2.value);
      return;
    }

    // 가장 최신 이력 찾기
    const latestRow = allRows.reduce((max, row) => {
      return Number(row.HIST_ID) > Number(max.HIST_ID) ? row : max;
    }, allRows[0]);
    // 최신이력의 구분 (정기, 수시)
    const regType = latestRow.REG_TYPE;

    if (regType === '0') {
      if (selectedRow2.value.REG_FILE_YN) {
        const tempRow = { ...selectedRow2.value, FYN: 'Y' };
        Popup.value.openPopup(tempRow);
      } else {
        Message.warn('변경이력에서 정기 위험성 평가 파일을 첨부하세요.');
      }
    } else if (regType === '1') {
      if (selectedRow2.value.IRR_FILE_YN) {
        const tempRow = { ...selectedRow2.value, FYN: 'Y' };
        Popup.value.openPopup(tempRow);
      } else {
        Message.warn('변경이력에서 수시 위험성 평가 파일을 첨부하세요.');
      }
    } else {
      Message.warn('구분을 확인할 수 없습니다');
    }
  } else {
    Message.warn('행을 선택하세요');
  }
    // if(selectedRow2.value && Object.keys(selectedRow2.value).length > 0) {
    //   Popup.value.openPopup(selectedRow2.value)
    //   // selectedRow2.value = {};
    // }else {
    //   Message.warn('행을 선택하세요')
    // }
  }

}

const getData = (val) => {

  if(val=="B"){
    selectedRow.value = 0
  }else{
    selectedRow.value = selectedRow.value
  }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
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

  return commonSearchApi({ queryId: 'SPPFD0010_SEARCH_01', param: param })
}

// 조회 후
const afterSearch = (res) => {
  // console.log("res", res)
  // debugger

  const formatData = res.ORESULT_CUR.map(item => { 
    const newItem = { ...item }

    if (newItem.REG_DT) {
      const regDate = dayjs(newItem.REG_DT)
      newItem.REG_DT = regDate.format('YYYY-MM-DD')

      // REG_DT 기준으로 +1450일 → CAL_DT에 저장
      newItem.CAL_DT = regDate.add(1450, 'day').format('YYYY-MM-DD')
    }

    // IRR_DT도 있으면 포맷
    if (newItem.IRR_DT) {
      newItem.IRR_DT = dayjs(newItem.IRR_DT).format('YYYY-MM-DD')
    }

    return newItem
  })
  // console.log("formatData", formatData)
  // initFileSearchData()
  // grdSub.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(formatData)

  gridSelect()

  const sessionProcess = window.sessionStorage.getItem('PROCESS_CD')

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

// 팝업 종료 이벤트(저장버튼 클릭 시)
const upData = () => {
  // bindingItems()
  // bindingFile()
  // onButtonsClick({ id: "btnSearch" })
  getData("F")
}

const onCellClicked = async (grid, clickData) => {
    selectedRow.value = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    window.sessionStorage.setItem('PROCESS_CD', selectedRow.value.PROCESS_CD || '');

    grid.checkAll(false);
    grid.checkItem(clickData.dataRow,true)

    // 파일아이디 생성
    // 팝업에서 내용 먼저 저장 후 파일첨부하는데 
    // 파일업로드 후에 저장안해도 내용 저장시에 파일아이디를 저장하기 위해 미리 파일아이디를 넘김
    const newFileId = create_UUID()
    const newFileId2 = create_UUID()

    // 추가팝업에 넘기는 데이터
    selectedRow2.value = {
    // CMPNY_DIV: selectedRow.value.CMPNY_DIV,
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: selectedRow.value.BSNS_CD,
    BSNS_NM: selectedRow.value.BSNS_NM,
    DEPT_CD: selectedRow.value.DEPT_CD,
    DEPT_NM: selectedRow.value.DEPT_NM,
    PROCESS_CD: selectedRow.value.PROCESS_CD,
    PROCESS_NM: selectedRow.value.PROCESS_NM,
    EVAL_TYPE: '0',
    ADD_DIV : 'Y',
    // 추가팝업 열때 파일업로드 버튼 비활성화
    ADD_DIVV: 'Y',
    REG_FILE_ID : newFileId,
    IRR_FILE_ID : newFileId2,
    REG_FILE_YN: selectedRow.value.REG_FILE_YN,
    IRR_FILE_YN: selectedRow.value.IRR_FILE_YN
  }
    // console.log(" 선택한 행 데이터:", selectedRow.value)
    // console.log(" 추가팝업에 넘길 데이터2:", selectedRow2.value)

    const seData = selectedRow2.value

    // 변경이력 조회
    const param = {
    CMPNY_DIV: seData.CMPNY_DIV,
    BSNS_CD: seData.BSNS_CD, //사업부
    DEPT_CD: seData.DEPT_CD, //부서
    PROCESS_CD: seData.PROCESS_CD, //공정설비
  }
  // console.log("param", param)

  commonSearchApi({ queryId: 'SPPFD0010_SEARCH_02', param: param }).then(res2=>{
    // console.log("res2", res2)
    
    const formatData = res2.ORESULT_CUR.map(item => { 
    const newItem = { ...item }

    if (newItem.REG_DT) {
      const regDate = dayjs(newItem.REG_DT)
      newItem.REG_DT = regDate.format('YYYY-MM-DD')
    }

    if (newItem.IRR_DT) {
      newItem.IRR_DT = dayjs(newItem.IRR_DT).format('YYYY-MM-DD')
    }

    return newItem
  })

    
    // console.log("formatData22222",formatData)
    grdSub.value.getDataProvider().setRows(formatData);
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

// 서브그리드 더블클릭
const onCellDblClicked = (grid, clickData) => {
  // debugger
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  selectedRow.value = grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)
  // console.log("변경이력 데이터", selectedRow.value)
  // console.log('REG_TYPE:', selectedRow.value.REG_TYPE)

  const seData = selectedRow.value
  // console.log("seData", seData)
  
  // 기본 구분자 ( 서브그리드에서 열때만 넘김 )
  saveParam.DIV = 'Y'

  // 구분자 하나 더 넘겨서 변경이력에서 팝업 열때는 SAVE02 쿼리 타게함
  saveParam.DIVV = 'Y'
  
  // 최신데이터 구분 위해 서브그리드 데이터 전체
  const allRows = grdSub.value.getDataProvider().getJsonRows()
  // console.log("allRows", allRows)

  // DT값이 있는지 확인후 REG_DT가 있으면 REG_DT끼리 비교, IRR_DT가 있으면 IRR_DT끼리 비교
  // 날짜 + ID로 최신 이력 확인후 최신이력만 수정
  if ((seData.REG_DT && seData.REG_DT === allRows[0]?.REG_DT && seData.HIST_ID === allRows[0]?.HIST_ID) ||
  (seData.IRR_DT && seData.IRR_DT === allRows[0]?.IRR_DT && seData.HIST_ID === allRows[0]?.HIST_ID)) {
    saveParam.DIV = 'N' // 최신이니까 수정 가능
  } else {
    saveParam.DIV = 'Y' // 옛날 이력이니까 수정 불가
  }

  // if (seData.HIST_ID === allRows[0]?.HIST_ID) {
  //   saveParam.DIV = 'N' // 최신이니까 수정 가능
  // } else {
  //   saveParam.DIV = 'Y' // 옛날 이력이니까 수정 불가
  // }



  // // 정기 최신 1건
  // const latestReg = allRows
  // .filter(r => r.REG_TYPE === '0' && r.REG_DT)
  // .sort((a, b) => {
  //   const dateDiff = new Date(b.REG_DT) - new Date(a.REG_DT)
  //   return dateDiff !== 0 ? dateDiff : b.HIST_ID - a.HIST_ID
  // })[0]

  // // 수시 최신 1건
  // const latestIrr = allRows
  // .filter(r => r.REG_TYPE === '1' && r.REG_DT)
  // .sort((a, b) => {
  //   const dateDiff = new Date(b.REG_DT) - new Date(a.REG_DT)
  //   return dateDiff !== 0 ? dateDiff : b.HIST_ID - a.HIST_ID
  // })[0]

  // if (seData.REG_TYPE === '0') {
  //   console.log("latestReg", latestReg)
  //   // 현재 선택된 행이 최신 정기 or 수시와 같으면 수정 가능
  //   if ((latestReg && seData.HIST_ID === latestReg.HIST_ID)) {
  //     saveParam.DIV = 'N'
  //   }
  // }

  // if (seData.REG_TYPE === '1') {
  //   console.log("latestIrr", latestIrr)
  //   // 현재 선택된 행이 최신 정기 or 수시와 같으면 수정 가능
  //   if ((latestIrr && seData.HIST_ID === latestIrr.HIST_ID)) {
  //     saveParam.DIV = 'N'
  //   }
  // }



  saveParam.HIST_ID = seData.HIST_ID
  saveParam.BSNS_CD = seData.BSNS_CD
  saveParam.BSNS_NM = row.BSNS_NM
  saveParam.DEPT_CD = seData.DEPT_CD
  saveParam.DEPT_NM = row.DEPT_NM
  saveParam.PROCESS_CD = seData.PROCESS_CD
  saveParam.PROCESS_NM = row.PROCESS_NM
  saveParam.REMARK = seData.REMARK
  saveParam.REG_TYPE = seData.REG_TYPE

  if (seData.REG_TYPE === '0') {
    // 정기일 경우
    saveParam.EVAL_TYPE = seData.REG_TYPE
    saveParam.REG_DT = seData.REG_DT
    saveParam.REG_TECH = seData.REG_TECH
    saveParam.REG_FILE_ID = seData.REG_FILE_ID
    saveParam.REG_CONTENT = seData.REG_CONTENT 

    // 수시쪽은 비우기
    saveParam.IRR_DT = null
    saveParam.IRR_TECH = null
    saveParam.IRR_FILE_ID = null
    saveParam.IRR_CONTENT = null

  } else if (seData.REG_TYPE === '1') {
    // 수시일 경우
    saveParam.EVAL_TYPE = seData.REG_TYPE
    saveParam.IRR_DT = seData.REG_DT
    saveParam.IRR_TECH = seData.REG_TECH
    saveParam.IRR_FILE_ID = seData.REG_FILE_ID
    saveParam.IRR_CONTENT = seData.REG_CONTENT

    // 정기쪽은 비우기
    saveParam.REG_DT = null
    saveParam.REG_TECH = null
    saveParam.REG_FILE_ID = null
    saveParam.REG_CONTENT = null
  }

  // console.log("saveeeee", saveParam)

  if(saveParam && Object.keys(saveParam).length > 0) {
      Popup.value.openPopup(saveParam)
      // selectedRow.value = {};
}
}

// 메인그리드 결과를 클릭해서 팝업을 열면 다운로드만 가능 
const onCellItemClicked = (grid, index, col) => {
  if(col.fieldName === 'REG_FILE_YN'){    
    let fileId=grdMain.value.getGridView().getValues(col.dataRow)['REG_FILE_ID']
    FIUploadPopup.value.openPopup(fileId);
  }else if (col.fieldName === 'IRR_FILE_YN') {
    let fileId=grdMain.value.getGridView().getValues(col.dataRow)['IRR_FILE_ID']
    FIUploadPopup.value.openPopup(fileId);
  }
}

//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    rowIndicator: { visible: true },
    // checkBar: { visible: true, exclusive: true}
  },
  fields : [
    { 
      fieldName: 'BSNS_NM', dataType: 'text', width: '100', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('사업부'),
    } ,
    },
    { 
      fieldName: 'DEPT_NM', dataType: 'text', width: '100', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('부서') },
    },
    { 
      fieldName: 'PROCESS_NM', dataType: 'text', width: '220', styleName: 'left-column',
      header: { text: t('공정설비') }, 
    },
    // 정기
    { 
      fieldName: 'REG_TECH', dataType: 'text', width: '100',
      header: { text: t('기법') },
      displayCallback: function (grid, index, value) {
      const match = codeList.EVAL_TECH.find(item => item.COD === value);
      return match ? match.TXT : value;
    }
    },
    { 
      fieldName: 'REG_DT', dataType: 'text', width: '100',
      header: { text: t('일자') }, 
    },
    { 
      fieldName: 'CAL_DT', dataType: 'text', width: '100',
      header: { text: t('유효기간') }, 
    },
    { 
      fieldName: 'REG_CONTENT', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('내용') }, 
    },
    { 
      fieldName: 'REG_FILE_YN', dataType: 'text', width: '100',
      header: { text: t('결과') },
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
    { 
      fieldName: 'REG_FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible: false,
      header: { text: t('아이디') }, 
    },
    // 수시
    { 
      fieldName: 'IRR_TECH', dataType: 'text', width: '100',
      header: { text: t('기법') },
      displayCallback: function (grid, index, value) {
      const match = codeList.EVAL_TECH.find(item => item.COD === value);
      return match ? match.TXT : value;
    }
    },
    { 
      fieldName: 'IRR_DT', dataType: 'text', width: '100',
      header: { text: t('일자') }, 
    },
    { 
      fieldName: 'IRR_CONTENT', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('내용') }, 
    },
    { 
      fieldName: 'IRR_FILE_YN', dataType: 'text', width: '100',
      header: { text: t('결과') },
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
    { 
      fieldName: 'REMARK', dataType: 'text', width: '200', styleName: 'left-column',
      header: { text: t('비고') }, 
    },
    { 
      fieldName: 'IRR_FILE_ID', dataType: 'text', width: '150', styleName: 'left-column', visible: false,
      header: { text: t('아이디') }, 
    },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장코드') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
  ],
  columns : [],
  columnLayout: [
    'BSNS_NM',
    'DEPT_NM',
    'PROCESS_NM',
    {
      name: '정기 공정위험성평가',
      direction: 'horizontal',
      items: ['REG_TECH', 'REG_DT', 'CAL_DT', 'REG_CONTENT', 'REG_FILE_YN'],
    },
    {
      name: '수시 공정위험성평가',
      direction: 'horizontal',
      items: ['IRR_TECH', 'IRR_DT', 'IRR_CONTENT', 'IRR_FILE_YN'],
    },
    'REMARK'
  ]
})

grdMain1Props.columns = grdMain1Props.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false } 
  },
  fields : [
    { 
      fieldName: 'REG_DT', dataType: 'text', width: '100', lookupDisplay: true,
      header: { text: t('일자') },
    },
    { 
      fieldName: 'REG_TYPE', dataType: 'text', width: '100', lookupDisplay: true,
      header: { text: t('구분') },
      // editor: {
      //   type: 'dropdown',
      //   textReadOnly: true, dropDownCount: 6, partialMatch: true, domainOnly: true, dropDownWhenClick: true
      // },
      // values: ["0", "1"],
      // labels: ["정기", "수시"]
    },
    { 
      fieldName: 'REG_TECH', dataType: 'text', width: '100', lookupDisplay: true,
      header: { text: t('기법') },
      values: ["0", "1", "2"],
      labels: ["HAZOP", "K-PSR", "CHECKLIST"]
    },
    { 
      fieldName: 'REG_CONTENT', dataType: 'text', width: '250', styleName: 'left-column',
      header: { text: t('내용') } ,
    },
    { 
      fieldName: 'FILE_YN', dataType: 'text', 
      header: { text: t('결과') },
      width: '100',
      renderer: {
      type: 'html',
      callback: function (grid, cell, w, h) {
      const value = grid.getValue(cell.index.itemIndex, 'FILE_YN')
      if (value) {
      return `
        <div style="display: flex; align-items: center; justify-content: center;">
          <button style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;">
            첨부 완료
          </button>
        </div>
      `;
    } else {
      return `
        <div style="display: flex; align-items: center; justify-content: center;">
          <button style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;">
            첨부
          </button>
        </div>
      `;
    }
    }
      }
    },
    { 
      fieldName: 'REMARK', dataType: 'text', styleName: 'left-column', width: '250',
      header: { text: t('비고') },
    },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장구분') },visible: false, },
    { 
      fieldName: 'BSNS_NM', dataType: 'text', width: '100', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('사업부')},
      visible: false,
    },
    { 
      fieldName: 'DEPT_NM', dataType: 'text', width: '100', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('부서') },
      visible: false,
    },
    { 
      fieldName: 'PROCESS_NM', dataType: 'text', width: '220', styleName: 'left-column',
      header: { text: t('공정설비') },
      visible: false,
    },
    { 
      fieldName: 'REG_FILE_ID', dataType: 'text', width: '100', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('아이디')},
      visible: false,
    },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('등록자아이디') },visible: false, },
    { fieldName: 'HIST_ID', dataType: 'text', header: { text: t('등록자아이디') },visible: false, }
  ],
  columns : [],
  columnLayout: [
    'REG_DT',
    'REG_TYPE',
    {
      name: '실시현황',
      direction: 'horizontal',
      items: ['REG_TECH', 'CONTENT', 'FILE_YN'],
    },
    'REMARK'
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

const resetForm = () => {
  Object.keys(saveParam).forEach(key => {
    saveParam[key] = ''
  })
}

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
        :button-list="['btnSearch', 'btnRegisterModify']"
        :use-permission="true"
        @click-button="onButtonsClick"
        :title="$t(useLogsStore().menuId)"
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
        <VRow no-gutters>
          <VCol cols="12 pa-2">
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
            <RealGrid
              ref="grdSub"
              style="height: calc(100% - 50px);"
              :grid-view-option="grdSubProps.gridViewOption"
              :keys="grdSubProps.keys" 
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"      
              @onCellDblClicked="onCellDblClicked"
              />
            </VCol>
        </VRow>
      </div>
      <SPPFD0010Popup ref="Popup" @upData="upData" />
      <IUploadPopup ref="FIUploadPopup" 
      gridTitle="첨부파일 다운로드"
      width="1200" 
      height="800" 
      :button-list="['btnDownLoad','btnClose']"
      :isVisibled="false"
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