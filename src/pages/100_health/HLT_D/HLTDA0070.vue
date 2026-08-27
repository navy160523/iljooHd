<!-- 
  화면명 : 신규 자재 사전 유해성 확인
  화면개요 : 신규 자재 사전 유해성 확인
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from "@hiway/stores/common"
import { isEmpty } from '@/@core/utils'
import { useRoute } from "vue-router"
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi, commonDeletFilesApi, commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from "dayjs";
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import HLTDA0070PopUp01 from "@/pages/100_health/HLT_D/HLTDA0070PopUp01.vue" // 자체 검토 내역 확인
import HLTDA0010CASPOP from '@/pages/100_health/HLT_D/HLTDA0010PopupCas.vue'
import PdfView from "@/pages/99_indexPopUp/PdfViewPopup.vue"

defineOptions({
  name:'100_health-HLT_D-HLTDA0070', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const route = useRoute()
const isAdmin = ref(false)
const menuTitle = ref(null)
const menuCasNoTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const empPopup = ref(null)
const commonStore = useCommonStore()
const hltda0070PopUp01 = ref(null);
const casPopup = ref(null)
const MainsaveParams = ref([])
const SubsaveParams = ref([])
const maxFileSize = ref(5); // 최대 파일 크기 (MB)
const fileTypes = "pdf"
const pdfPopup = ref(null)

const props = defineProps({
  btnList: {
    Type: Array,
    default: ['btnSearch', 'btnCheckHistory']
  },
})
// 조회조건
const searchParams = reactive({
  // 공통
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분
  USER_ID: userStore.userId,
  BSNS_CD: userStore.bsnsCd, // 사업부
  DEPT_CD: userStore.deptCd, // 부서
  ASGN_CD: userStore.asgnCd, // 과
  // 조회 조건
  EMP_NM:'',
  EMP_NO:'',
  SDATE: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
  EDATE: dayjs().format("YYYY-MM-DD"),
  //
  GRP_DIV:'',
  APPLIES_TO:'',
  REMARKS:'',
  REMARKS_EDIT:'',
  FILE_ID:''
})

const saveParamsSub = reactive({
  FILE_ID:'',
})

const codeList = reactive({
  GRP_DIV:[],
})

/*  공통코드 세팅 */
onMounted(() => {
  if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTD001')) isAdmin.value = true
    isAdmin.value = true;

  if (isAdmin.value === false) {
    menuTitle.value.setBtnProperty('btnCheckHistory', 'visible', false)
    menuCasNoTitle.value.setBtnProperty('btnChk', 'visible', false)
  }
  onButtonsClick({ id: "btnSearch" });
  grdMain.value.getGridView().filterPanel.visible = true
  grdSub.value.getGridView().filterPanel.visible = true
  Promise.all([
    getCodeList('HHII040'),
  ]).then((res) => {
    codeList.GRP_DIV = res[0].ORESULT_CUR
    codeList.GRP_DIV.unshift({ TXT: "선택", COD: "" })
  })
})

// 등록자 팝업
const openEmpPopup = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: searchParams.EMP_NM,
  })
}

const onEmpSelected = (val) => {
  searchParams.EMP_NM = val.EMP_NM
  searchParams.EMP_NO = val.EMP_NO
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }},
  fields : [ 
    { fieldName: 'FILE_NM', dataType: 'text', header: { text: t('파일명') }, width: "80", lookupDisplay: true, button : 'action',},
    { fieldName: 'CONTENT_DT', dataType: 'text', header: { text: t('갱신일자') }, width: "20", editable: false},
    { fieldName: 'USER_NM', dataType: 'text', header: { text: t('등록자') }, width: "20", editable: false},
    { fieldName: 'INGREDIENT_NO', dataType: 'text', header: { text: t('성분갯수') }, width: "20", editable: false},
    { fieldName: 'MSDS_FILEID_DSC', dataType: "text", header: { text: t("MSDS 보기") }, width: "25", editable: false, renderer: { type: "button"}},
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') },visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('과') },visible: false, },
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('파일 ID') },visible: false, },
    { fieldName: 'MSDS_FILEID', dataType: 'text', header: { text: t('파일 ID') },visible: false, },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('등록자 ID') },visible: false, },
    { fieldName: 'GRP_DIV', dataType: 'text', header: { text: t('용도') },visible: false, },
    { fieldName: 'APPLIES_TO', dataType: 'text', header: { text: t('해당여부') },visible: false, },
    { fieldName: 'REMARKS', dataType: 'text', header: { text: t('결과') },visible: false, },
  ],
})

const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  fields : [ 
    { fieldName: 'CASNO', dataType: 'text', header: { text: t('CAS번호') }, width: "50", lookupDisplay: true, button : 'action',},
    { fieldName: 'CASNM_ENG', dataType: 'text', header: { text: t('물질명') }, width: "100", editable: false},
    { fieldName: 'FROM_IGDTRATE', dataType: 'number',  numberFormat: '#,###.##', header: { text: t('최소 값') }, width: "30", editor: { type: 'number'}},
    { fieldName: 'TO_IGDTRATE', dataType: 'number',  numberFormat: '#,###.##', header: { text: t('최대 값') }, width: "30", editor: { type: 'number'}},
    { fieldName: 'ETC', dataType: 'text', header: { text: t('기타') }, width: "30",visible: false,},
  ],
  columnLayout: [
    'CASNO',
    'CASNM_ENG',
    {
      name: '성분비(%)',
      direction: 'horizontal',
      items: [ 'FROM_IGDTRATE', 'TO_IGDTRATE'],
      header: { text: t('구성비(%)') },
    },
    'ETC',
  ],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') { // MSDS 목록
    grdSub.value.getDataProvider().setRows([])
    searchParams.GRP_DIV = ''
    searchParams.APPLIES_TO = ''
    searchParams.REMARKS = ''
    getData() 
  } else if (btn.id === 'btnCheckHistory') { // 자제 검토 내역 확인
    hltda0070PopUp01.value.openPopup('')
  }
}

const getData = () => {
  // .setGridList([grdMain])
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTDA0070_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdSub.value.getDataProvider().setRows([])
  searchParams.GRP_DIV = ''
  searchParams.APPLIES_TO = ''
  searchParams.REMARKS = ''
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onButtonsClickgrdMain = btn => {
  if (btn.id === 'btnCreate') { // 추가
    grdMain.value.addRow({
      FILE_NM:'',
      CONTENT_DT:dayjs().format("YYYY-MM-DD"),
      USER_NM: userStore.userName,
      INGREDIENT_NO:'',
      MSDS_FILEID_DSC:'',
      BTN_IMG:'',
      USER_ID:userStore.userId,
    },false)
  } else if (btn.id === 'btnUpdate') { // 저장
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setBefore(MainbeforeSave)
      .setQuery(MainsaveData)
      .setAfter(() => { onButtonsClick({ id: "btnSearch" })})
      .run()
  }else if (btn.id === 'btnDelete') { // 삭제
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(MaindeleteData)
      .setAfter(() => {onButtonsClick({ id: "btnSearch" })})
      .run()
  }
}

const MainbeforeSave = () => {
  let chekedRow = ref([])
  chekedRow = grdMain.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  MainsaveParams.value = []
  let data = ref([])
  chekedRow.forEach(val => {
    data = grdMain.value.getDataProvider().getJsonRow(val)
    data = Object.assign({}, data, searchParams); 
    MainsaveParams.value.push(data)
  })
  return true
}

const MainsaveData = () => {
  // Message.success(t("업로드 되었습니다."));
  return commonExecuteApi({
    queryId: 'HLTDA0070_SAVE_01',
    list: MainsaveParams.value,
  })   
}

const MaindeleteData = () => {
  let deleteParams = []
  let data = ref([])
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data = Object.assign({}, data, searchParams); 
    deleteParams.push(data) 
  }
  return commonExecuteApi({ queryId : 'HLTDA0070_DELETE_01', list: deleteParams })
} 

const onButtonsClickgrdSub = btn => {
  if (btn.id === 'btnSearch') { // MSDS 목록
    subgetData() 
  } else if (btn.id === 'btnCreate') { // 추가
    let chekedRow = ref([])
    chekedRow = grdMain.value.getGridView().getCheckedRows()
    if(chekedRow.length === 0){
      Message.warn(t('MSDS 목록에서 선택한 데이터가 없습니다.'))
      return false
    }
    grdSub.value.addRow({
      CASNO:'',
      CASNM_ENG:'',
      FROM_IGDTRATE:'',
      TO_IGDTRATE:'',
    },false)
  } else if (btn.id === 'btnUpdate') { // 저장
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setBefore(SubbeforeSave)
      .setQuery(SubsaveData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })  
      })
      .run()
  } else if (btn.id === 'btnDelete') { // 삭제
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setQuery(SubdeleteData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })  
      })
      .run()
  } else if (btn.id === 'btnChk') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setBefore(SubCbeforeSave)
      .setQuery(SubCsaveData)
      .setAfter(() => {
        onButtonsClick({ id: "btnSearch" })  
      })
      .run()
  }
}

const subgetData = () =>{
  new queryFlowHelper(vm, t)
    .setQuery(subsearchData)
    .setAfter(subafterSearch)
    .run()
}

const subsearchData = () => {
  return commonSearchApi({
    queryId: "HLTDA0070_SEARCH_02",
    param: searchParams,
  });
};

const subafterSearch = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR);
};

const SubbeforeSave = () => {
  let chekedRow = ref([])
  chekedRow = grdSub.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  SubsaveParams.value = []
  let data = ref([])
  let data1 = ref([])
  let chekedRow1 = ref([])
  chekedRow1 = grdMain.value.getGridView().getCheckedRows()
  chekedRow1.forEach(val => {
    data1 = grdMain.value.getDataProvider().getJsonRow(val)
  })

  chekedRow.forEach(val => {
    data = grdSub.value.getDataProvider().getJsonRow(val)
    data = Object.assign({}, data, data1);
    data = Object.assign({}, data, searchParams);
    SubsaveParams.value.push(data)
  })
  return true
}

const SubsaveData = () => {
  return commonExecuteApi({
    queryId: 'HLTDA0070_SAVE_02',
    list: SubsaveParams.value,
  })
}

const SubdeleteData = () => { 
  let deleteParams = []
  let data = ref([])
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
    data = Object.assign({}, data, searchParams); 
    deleteParams.push(data) 
  }
  return commonExecuteApi({ queryId : 'HLTDA0070_DELETE_02', list: deleteParams })
} 

const SubCbeforeSave = () => {
  let chekedRow = ref([])
  chekedRow = grdMain.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  MainsaveParams.value = []
  let data = ref([])
  chekedRow.forEach(val => {
    data = grdMain.value.getDataProvider().getJsonRow(val)
    data = Object.assign({}, data, searchParams); 
    MainsaveParams.value.push(data)
  })
  return true
}

const SubCsaveData = () => {
  // console.log('MainsaveParams.value : ', MainsaveParams.value)
  return commonExecuteApi({
    queryId: 'HLTDA0070_SAVE_03',
    list: MainsaveParams.value,
  })
}

const popupParams = reactive({
  ROW_IDX : 0,
})

const casPopupOpen = (grid, clickInfo, column) => { 
  popupParams.ROW_IDX = clickInfo.itemIndex
  let row = grdSub.value.getRowData(clickInfo.itemIndex)
  if(clickInfo.fieldName === 'CASNO'){
    casPopup.value.openPopup({ CASNO : row.CASNO })
  }
}

const casnosearchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분
  CASNO:'',
})

const openCasSelected = val => {  
  console.log("selectedVal", val)
  // searchParams.REMARKS = ''
  grdSub.value.getDataProvider().setValue(popupParams.ROW_IDX, 'CASNO', val.CASNO)
  grdSub.value.getDataProvider().setValue(popupParams.ROW_IDX, 'CASNM_ENG', val.CASNM_ENG)
  grdSub.value.getGridView().checkItem(popupParams.ROW_IDX, true)
  casnosearchParams.CASNO = val.CASNO.trim()
  casnoRegulatoryinformation()
}

const casnoRegulatoryinformation = () => {
  // console.log('casnoRegulatoryinformation')
  new queryFlowHelper(vm, t)
    .setQuery(casNoSearchData)
    .setAfter(casNoAfterSearch)
    .run()
}

const casNoSearchData = () => {
  return commonSearchApi({ queryId: 'HLTDA0070_SEARCH_03', param: casnosearchParams })
}

var EXTINFO_01, EXTINFO_02, EXTINFO_03, EXTINFO_07, EXTINFO_09, EXTINFO_10, EXTINFO_11, EXTINFO_12, EXTINFO_17

const casNoAfterSearch = (res) => {
  if (searchParams.REMARKS == null){
    searchParams.REMARKS = ''
  }
  if (searchParams.REMARKS_EDIT == null){
    searchParams.REMARKS_EDIT = ''
  }

  EXTINFO_01 = res.ORESULT_CUR[0].EXTINFO_01 // 금지 제조 등 금지 Y,N
  EXTINFO_02 = res.ORESULT_CUR[0].EXTINFO_02 // 금지 허가 물질 Y,N
  EXTINFO_03 = res.ORESULT_CUR[0].EXTINFO_03 // 금지 취급 금지 Y,N
  EXTINFO_07 = res.ORESULT_CUR[0].EXTINFO_07 // 제한 특별 관리 Y,N
  EXTINFO_09 = res.ORESULT_CUR[0].EXTINFO_09 // 제한 유독 물질 숫자
  EXTINFO_10 = res.ORESULT_CUR[0].EXTINFO_10 // 제한 사고 대비 숫자
  EXTINFO_11 = res.ORESULT_CUR[0].EXTINFO_11 // 제한 제한 물질 숫자
  EXTINFO_12 = res.ORESULT_CUR[0].EXTINFO_12 // 제한 등록(HHI 관리) 문자
  EXTINFO_17 = res.ORESULT_CUR[0].EXTINFO_17 // 관찰 관리 대상 Y,N

  if (EXTINFO_01 == null && EXTINFO_02 == null && EXTINFO_03 == null && EXTINFO_07 == null && EXTINFO_09 == null && EXTINFO_10 == null && EXTINFO_11 == null && EXTINFO_12 == null && EXTINFO_17 == null) {
    searchParams.REMARKS_EDIT = '사내 반입 가능\n'
  } else {
    if (EXTINFO_01 == 'Y' || EXTINFO_02 == 'Y' || EXTINFO_03 == 'Y') {
      searchParams.REMARKS_EDIT = '사내 반입 금지\n'
    } else {
      // if (EXTINFO_07 == 'Y' || EXTINFO_17 == 'Y') {
      //   searchParams.REMARKS_EDIT = '사내 반입 가능\n'
      // } else {
      Message.warn(t('구성비를 입력 하여 주십시요.'))
      // }
    }
  }
  if(searchParams.REMARKS.includes('금지')) {

  } else {
    searchParams.REMARKS = searchParams.REMARKS_EDIT
  }
}

const getCasNo = () => {
  // console.log('getCasNo')
  new queryFlowHelper(vm, t)
    .setQuery(casNoOSearchData)
    .setAfter(casNoOAfterSearch)
    .run()
}

const casNoOSearchData = () => {
  // console.log('casNoOSearchData')
  // console.log(casnosearchParams)
  return commonSearchApi({ queryId: 'HLTDA0070_SEARCH_03', param: casnosearchParams })
}

const casNoOAfterSearch = (res) => {
  // console.log('casNoOAfterSearch')
  // console.log('res : ' ,  res)
  // console.log('res.ORESULT_CUR.length : ' , res.ORESULT_CUR.length)
  // console.log('Array.isArray(res.ORESULT_CUR) : ', Array.isArray(res?.ORESULT_CUR))
  if (res.ORESULT_CUR.length > 0) {    
    grdSub.value.getDataProvider().setValue(popupParams.ROW_IDX, 'CASNM_ENG', res.ORESULT_CUR[0].CASNM_ENG)
    grdSub.value.getGridView().checkItem(popupParams.ROW_IDX, true)
    casnoRegulatoryinformation()
  } else {
    grdSub.value.getDataProvider().setValue(popupParams.ROW_IDX, 'CASNO', '')
    grdSub.value.getGridView().checkItem(popupParams.ROW_IDX, false)
  }
}

const onEditCommit = (grid, index, oldValue, newValue ) => {
  // console.log('onEditCommit')
  if(index.fieldName == 'CASNO') {
    popupParams.ROW_IDX = index.itemIndex
    casnosearchParams.CASNO = newValue
    // console.log('index')
    // console.log(index.itemIndex)
    // console.log('newValue : ' + newValue)
    getCasNo()
  }
  if(index.fieldName == 'TO_IGDTRATE' ) {
    if(EXTINFO_09 == null && EXTINFO_10 == null && EXTINFO_11 == null) {
      Message.warn(t('현재 검색한 CAS 번호에는 등록된 구성비가(유독물질, 사고대비, 제한물질) 없습니다.'))
    } else {
      let checkValues = []
      for(let val of [EXTINFO_09, EXTINFO_10, EXTINFO_11]) {
        if(!isEmpty(val)) {
          checkValues.push(val)
        }
      }      
      let min = Math.min(...checkValues);
      if (EXTINFO_01 != 'Y' || EXTINFO_02 != 'Y' || EXTINFO_03 != 'Y') {
        if (min <= newValue) {
          searchParams.REMARKS = '사내 반입 금지 합니다.\n'
        } else {
          searchParams.REMARKS = '사내 반입 가능 합니다.\n'
        }
      }
    }
  }
  if(index.fieldName == 'FROM_IGDTRATE') {
    if(EXTINFO_07 == null && EXTINFO_17 == null) {
      Message.warn(t('현재 검색한 CAS 번호에는 등록된 그룹이(특별관리, 관리대상) 없습니다.'))
    } else {
      if (EXTINFO_01 != 'Y' || EXTINFO_02 != 'Y' || EXTINFO_03 != 'Y') {      
        searchParams.REMARKS = '사내 반입 가능 합니다.\n'
        let data = grdSub.value.getDataProvider().getJsonRow(index.itemIndex);      
        // 특별관리대상에 해당되고 최솟값이 0.1% 이상일시 || 특정 CASNO 일때
        if((EXTINFO_07 === 'Y' && newValue >= 0.1) || (data.CASNO === '7440-02-0' || data.CASNO === '7440-47-3')) {
          searchParams.REMARKS = '사내 반입 금지 합니다.\n'
          return
        }
        // 관리대상에 해당되고 최솟값이 1% 이상일시
        if(EXTINFO_17 === 'Y' && newValue >= 1) {
          searchParams.REMARKS = '사내 반입 금지 합니다.\n'
          return
        }
      }
    }
  }
}

// 이미지 업로드
const onCellItemClicked = function (grid, index, clickData) {
  if (clickData.fieldName === "FILE_NM") {
    const rowData = grdMain.value.getDataProvider().getJsonRow(index.dataRow);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    // fileInput.accept = "image/*";

    fileInput.addEventListener("change", function (event) {
      selectFile(event.target.files, index.dataRow); //  selectFile 호출하여 파일 처리
    });

    fileInput.click();
  }
};
const selectFile = (files, rowIndex) => {
  for (let file of files) {
    const fType = file.name.split(".").pop().toUpperCase();
    const fUseType = fileTypes.split(",").map(item => item.toUpperCase());

    //  중복 파일 검사
    if (grdMain.value.getDataProvider().getJsonRows().some(row => row.FILE_NAME === file.name)) {
      Message.err("이름이 중복되는 파일이 있습니다.<br>" + file.name);
      return;
    }

    //  파일 크기 검사
    if (file.size >= maxFileSize.value * 1024 * 1024) {
      Message.err(`${maxFileSize.value}MB 이상 첨부파일은 등록 불가능합니다.<br>${file.name}`);
      return;
    }

    //  확장자 검사
    if (!fUseType.includes(fType)) {
      Message.err("PDF만 업로드 가능합니다.<br>" + file.name);
      return;
    }

    for (let file of files) {
    const fType = file.name.split(".").pop().toLowerCase(); // 확장자 추출
    uploadFileInChunks(file, rowIndex, file.name);
  }
  }
};

const uploadFileInChunks = async(file, rowIndex, newFileName) => {
  let hasErr = false;
  const chunkSize = 1024 * 1024; // 1MB 단위
  const totalChunks = Math.ceil(file.size / chunkSize);
  const fileId = create_UUID();
  const filePath = `${commonStore.systemCode}${route.path}/`;
  const fileName = `${newFileName}`;
  const fileSize = Math.round(file.size / 1024.0);
  let currentChunk = 0;
  const sendNextChunk = async () => {
    if (currentChunk >= totalChunks) return;
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    const formData = new FormData();
    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: fileId,
      FILE_NO: "",
      FILE_TITLE: newFileName,
      FILE_NAME_ORIGINAL: newFileName,
      FILE_NAME: newFileName,
      FILE_PATH: filePath,
      FILE_TYPE: file.name.split(".").pop(),
      FILE_SIZE: fileSize,
      USER_ID: userStore.userId,
      CHUNK_NUMBER: currentChunk,
      TOTAL_CHUNKS: totalChunks,
    };
    formData.append("file", chunk, file.name);
    formData.append("param", new Blob([JSON.stringify(param)], { type: "application/json" }));
    await commonBigUploadFilesApi(formData)
      .then(async (res) => {
        // 전송 결과가 207이면 다음 파일 조각 전송
        if (res.result.status === "207") {
          currentChunk++;
          if (currentChunk < totalChunks) {
            await sendNextChunk();
          }
        } else if (res.result.status === "200") {
          searchParams.FILE_ID = fileId;
          grdMain.value.getDataProvider().setValue(rowIndex, "FILE_ID", fileId);
          grdMain.value.getDataProvider().setValue(rowIndex, "FILE_NM", newFileName);
          onButtonsClickgrdMain({ id: "btnUpdate" })
        }
    })
    .catch((e) => {
      hasErr = true;
      grdMain.value.getDataProvider().setValue(checkedRow[i], "STATUS", "E");
    })
  }
  await sendNextChunk()
};


// 파일id 생성
const create_UUID = () => {
  let dt = new Date().getTime();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// 파일 
const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === "data" && clickData.column === "MSDS_FILEID_DSC") {
    let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    // console.log('data 0070 : ' ,data)
    pdfPopup.value.openMSDSPopup(data, 'HLTDA0020_SEARCH_08')
    // commonDownloadFilesApi(data)
    //   .then((res) => {
    //     //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
    //     const file = res.contentDisposition.split('fileName="')
    //     const blob = new Blob([res])
    //     const blobUrl = URL.createObjectURL(blob)
    //     //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
    //     // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
    //     const decodedFileName = decodeURI(file[1].replace('";', ''))
    //     window.open(blobUrl, '_blank')
    //     URL.revokeObjectURL(blobUrl)
    //   })
    //   .catch((e) => {
    //     console.error('파일 여는 중 오류 발생',e)
    //   })
  }
  // if (clickData.cellType === 'check') {
  //   var checkedRows = grdMain.value.getGridView().getCheckedRows();
  //   if(checkedRows.length === 0){
  //     searchParams.FILE_ID = ''
  //     searchParams.GRP_DIV = ''
  //     searchParams.APPLIES_TO = ''
  //     searchParams.REMARKS = ''
  //     searchParams.REMARKS_EDIT = ''
  //     grdSub.value.getDataProvider().setRows([])
  //   }
  //   else if(checkedRows.length === 1){
  //     let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  //     searchParams.FILE_ID = data.FILE_ID
  //     searchParams.GRP_DIV = data.GRP_DIV
  //     searchParams.APPLIES_TO = data.APPLIES_TO
  //     searchParams.REMARKS = data.REMARKS
  //     searchParams.REMARKS_EDIT = data.REMARKS
  //     subgetData()
  //   }
  //   else {
  //     Message.err('MSDS 목록에서 한개만 선택해주세요.')
  //   }
  // }
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  searchParams.FILE_ID = data.FILE_ID
  searchParams.GRP_DIV = data.GRP_DIV
  searchParams.APPLIES_TO = data.APPLIES_TO
  searchParams.REMARKS = data.REMARKS
  searchParams.REMARKS_EDIT = data.REMARKS

  const gridView = grdMain.value.getGridView();
  if (clickData.dataRow >= 0) {
    gridView.checkAll(false);
    gridView.checkRow(clickData.dataRow, true);
  }

  subgetData()
}

const clearEmpcd = () => {
  if(!isAdmin.value) return
  // 화학물질관리자가 아니고 보건총괄도 아니고 hse추진자면 return
  if(!(useLogsStore().isMenuAdmin === 'Y') && !userStore.authGrpCd.includes('HLTD001')) return
  searchParams.EMP_NM = ''
  searchParams.EMP_NO = ''
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :usePermission="false"
        :title="$t(useLogsStore().menuId)"
        :button-list="props.btnList"
        @click-button="onButtonsClick"
      />
      <!-- :button-list="['btnSearch', 'btnCheckHistory']" -->
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-input 
              :label="$t('등록자')"
              width="200px"
              v-model="searchParams.EMP_NM"
              append-inner-icon="mdi-magnify" 
              :readonly="!isAdmin || (!(useLogsStore().isMenuAdmin === 'Y') && !userStore.authGrpCd.includes('HLTD001'))"
              @click:appendInner="openEmpPopup"
            >
              <template #append-inner>
                <v-icon 
                  v-if="isAdmin"
                  icon="mdi-window-close"
                  @click="clearEmpcd"
                />
              </template>
            </i-input>
            <i-input 
              width="200px"
              v-model="searchParams.EMP_NO"
              readonly
            />
            <i-input
              v-model="searchParams.SDATE"
              width="200px"
              :label="$t('갱신일자')"
              type="date"
              margin="10px"
            />
            <i-input
              v-model="searchParams.EDATE"
              width="200px"
              :label="$t('~')"
              type="date"
            />
          </div>
        </v-sheet>
        <v-sheet height="45%">
          <v-sheet class="h-auto">
            <IGridTitle
                :title="$t('MSDS 목록')"
                :button-list="['btnCreate','btnDelete']"
                @click-button="onButtonsClickgrdMain"
            />
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellButtonClicked="onCellItemClicked"
              @onCellClicked="onCellClicked"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </v-sheet>
        <v-sheet class="mt-2" height="45%">
          <div class="d-flex fill-height">
            <v-sheet class="h-auto" width="65%">
              <IGridTitle
                  :title="$t('성분 등록')"
                  :button-list="['btnCreate','btnUpdate','btnDelete']"
                  @click-button="onButtonsClickgrdSub" 
              />
              <div class="d-flex">
                <i-select
                  v-model="searchParams.GRP_DIV"
                  :label="$t('용도')"
                  label-width="50px"
                  :items="codeList.GRP_DIV"
                  item-value="COD"
                  item-title="TXT" 
                  width="200px"
                />
                <span class="d-flex ml-2 align-center formLabelText" style="width:200px">
                  CAS No. 가 없는 성분 해당 여부
                </span>
                <VRadioGroup
                  v-model="searchParams.APPLIES_TO"
                  style="margin: auto"
                  inline
                >
                <!-- :label="$t('용도')" -->
                <v-radio 
                  label="해당" 
                  value="Y"
                />
                <v-radio 
                  label="미해당" 
                  value="N"
                />
                </VRadioGroup>
              </div>
              <RealGrid
                ref="grdSub"
                :grid-view-option="grdSubProps.gridViewOption"
                :fields="grdSubProps.fields"
                :columns="grdSubProps.columns"
                :column-layout="grdSubProps.columnLayout"
                @onCellButtonClicked="casPopupOpen"
                @onEditCommit="onEditCommit"
              />
              <!-- @onEditCommit="handleEditCommit"
                @onCellBlur="handleCellBlur"
                @onEditChange="onEditChange" -->
            </v-sheet>
            <v-sheet class="h-auto ml-2" width="25%">
              <IGridTitle
                  ref="menuCasNoTitle"
                  :title="$t('검토 결과')"
                  :button-list="['btnChk']"
                  @click-button="onButtonsClickgrdSub" 
              />
              <i-textarea
                  top-label
                  :row="15"
                  width="100%"
                  v-model="searchParams.REMARKS"
              />
              <!-- readonly -->
            </v-sheet>
          </div>
        </v-sheet>
        <!-- </v-sheet> -->
      </div>
      <!-- 팝업존 -->
      <EmpPopup ref="empPopup" @selected="onEmpSelected" />
      <HLTDA0070PopUp01 ref="hltda0070PopUp01"/>  <!-- 검토 내역 확인 -->
      <HLTDA0010CASPOP ref="casPopup" @selectCas="openCasSelected"/> <!-- cas 번호 팝업 -->
      <PdfView ref="pdfPopup"/>
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
.rg-button-renderer-button::before {
    content: "업로드";
    visibility: visible !important;
    height: 20px;
  }
</style>