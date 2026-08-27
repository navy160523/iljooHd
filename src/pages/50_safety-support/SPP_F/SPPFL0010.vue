<!-- SPPFL0010 공정사고조사 -->
<!-- SI1팀 마환구 2025.06.12 -->

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
import {
  commonDeletFilesApi,
  commonDeleteAllFilesApi
} from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
// import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper";
import Message from '@hiway/utils/notify'
// import { isEmpty, isEmptyArray } from "@/@core/utils"
import SPPFL0010Popup from './SPPFL0010Popup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { useRouter } from 'vue-router'



defineOptions({
  name: '50_safety-support-SPP_F-SPPFL0010',
})

const SPPFL0010_Popup = ref(null)
const approvalPopup = ref(null)
const FIUploadPopup = ref(null)
const MIUploadPopup = ref(null)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const useLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain1 = ref(null)
const grdMain2 = ref(null)
const selectrow = ref(null)
const route = useRouter()

const bsnsCd =ref(null);
const deptCd =ref(null);
const processCd =ref(null);
const psiSeq =ref(null);


const popupParam=reactive({});

const revDiv = ref([
  { DISPLAY_TEXT: '정기', CODE: 'A' },
  { DISPLAY_TEXT: '수시', CODE: 'B' },
])



const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  PROCESS_CD: '', //공정설비
  USER_ID: userStore.empNo,
})

const isAdmin = ref(0)

const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
  process: [],
  item: []
})

const initCodeList = () => {
  // console.log("searchParams:",searchParams)
  Promise.all([ 
    // commonSearchApi({ queryId: 'SPPFL0010_COMBO_01', param: searchParams }),
    // commonSearchApi({ queryId: 'SPPFL0010_COMBO_02', param: searchParams }),
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV:'Y' } }),
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV:'Y' } }),
    commonSearchApi({ queryId: 'SPPFL0010_COMBO_01', param: searchParams }),

  ]).then(res => {
    
    codeList.bsnscd = res[0].ORESULT_CUR
    if(searchParams.BSNS_CD !== '') {
      codeList.deptcd = res[1].ORESULT_CUR
      codeList.process = res[2].ORESULT_CUR
    }
    
    codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.process.unshift({ TXT: '전체', COD: '' })
    if(selectedDeptCd !='')
    {
      codeList.process.push({ TXT: 'PSM설비 외 공정', COD: 'ZZ' })
    }
  })
  
}

// 등록/수정 구분자
const isNew = ref(false)

const onButtonsClick = btn => {
  if(btn.id === 'btnCreate') {
    openPopup("C")
  }
  else if(btn.id === 'btnSearch') {
    getData("B")
  }
  else if(btn.id=='btnDelete')
  {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setConfirmMessage('삭제 하시겠습니까?\n업로드된 파일도 함께 삭제됩니다.')
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run();
  }
  else if(btn.id=='btnNmi')
  {
    route.push({ path: '/30_safety/SAF_E/SAFEB0010' })
  }
}

const beforeDelete = () =>{
  let checkedData = grdMain1.value.getGridView().getCheckedRows(true);
  if (checkedData.length === 0) {
    Message.warn(t("삭제할 데이터를 선택해주세요."));

    return false;
  }
  return true;
}
const deleteData = async () =>{

  let temp = null;
  let checkedRows = grdMain1.value.getGridView().getCheckedRows(true);
  for (let rowIdx of checkedRows) {
    let data = grdMain1.value.getDataProvider().getJsonRow(rowIdx);
    let deleteParam = [
      {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: data.BSNS_CD,
        DEPT_CD: data.DEPT_CD,
        PROCESS_CD : data.PROCESS_CD,
        PSI_SEQ: data.PSI_SEQ,
      },
    ];
    
    temp =  commonExecuteApi({queryId: "SPPFL0010_DELETE_01",list: deleteParam})
  }
  return temp;
}

const afterDelete = async () =>{
  const checkedRows = grdMain1.value.getGridView().getCheckedRows(true)

    for (const rowIdx of checkedRows) {
      const data = grdMain1.value.getDataProvider().getJsonRow(rowIdx)

      commonSearchApi({ queryId: 'searchFile', param: { CMPNY_DIV: userStore.cmpnyDiv, FILE_ID: data.FILE_ID } }).then(fileRes => {
        if(fileRes.ORESULT_CUR.length > 0) {
          commonDeletFilesApi(fileRes.ORESULT_CUR)
        }
      })
    }

  onButtonsClick({ id: "btnSearch" });
}

const openPopup = (data) => {
  let row= grdMain1.value.getGridView().getSelectedRows()
  if(data=="M")
  {
    if(row.length>0)
    {
      let rowData = grdMain1.value.getDataProvider().getJsonRow(row)
      if(!rowData.PSI_SEQ)
        {
          return Message.warn(t('작성되지 않은 문서는 수정 할 수 없습니다.'))
        }
    }
    popupParam.DIV=data
  

    SPPFL0010_Popup.value.openPopup(popupParam)
  }
  else if(data=='C')
  {
    // if(row.length>0)
    // {
    //   let rowData = grdMain1.value.getDataProvider().getJsonRow(row)
      
    //     if(rowData.SAVE_STAT == 'T' && rowData.PSI_SEQ && data=="C")
    //     {
    //       return Message.warn(t('보고서가 작성이 완료되지 않았습니다.'))
    //     }

    //     if(rowData.APP_YN == 'N' && rowData.PSI_SEQ && data=="C")
    //     {
    //       return Message.warn(t('결재가 완료되지 않았습니다.'))
    //     }
    // }
    
    popupParam.DIV=data
    popupParam.PROCESS_CD=''
    popupParam.DEPT_CD=''
    popupParam.BSNS_CD=''
    popupParam.SAVE_STAT=''
    popupParam.APP='N'
    

    SPPFL0010_Popup.value.openPopup(popupParam)
  }
}

const getData = () => {

  // if(val=="B")
  // {
  //   selectrow.value=0
  // }
  // else
  // {
  //   selectrow.value=selectrow.value;
  // }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain1])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

// 공정안전 자료와 관계없는 관리자가 왔을때 콤보박스 바인딩
const selectedBsnsCd = computed({
  get: () => {
    return codeList.bsnscd.some(item => item.BSNS_CD === searchParams.BSNS_CD)
      ? searchParams.BSNS_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.BSNS_CD = value;
  }
});

const selectedDeptCd = computed({
  get: () => {
    return codeList.deptcd.some(item => item.DEPT_CD === searchParams.DEPT_CD)
      ? searchParams.DEPT_CD
      : ''; // 없는 값이면 '전체' 선택
  },
  set: (value) => {
    searchParams.DEPT_CD = value;
  }
})

//  조회
const searchData = () => {
  
  const param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: codeList.bsnscd.some(item => item.BSNS_CD === searchParams.BSNS_CD) ? searchParams.BSNS_CD : '', //사업부
    DEPT_CD: codeList.deptcd.some(item => item.DEPT_CD === searchParams.DEPT_CD) ? searchParams.DEPT_CD : '', //부서
    PROCESS_CD: searchParams.PROCESS_CD, //공정설비
  }
  // console.log("param:",param);
  
  return commonSearchApi({ queryId: 'SPPFL0010_SEARCH_01', param: param })  
}

// 조회 후
const afterSearch = (res) => {

  // initFileSearchData()

  grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR);



  const sessionProcess = window.sessionStorage.getItem('PROCESS_CD');

  // if (sessionProcess) {

  //   const gridView = grdMain1.value.getGridView();
  //   const rowCount = grdMain1.value.getDataProvider().getRowCount();

  //   for (let i = 0; i < rowCount; i++) {

  //     const rowData = grdMain1.value.getDataProvider().getJsonRow(i);

  //     // if (rowData.PROCESS_CD === sessionProcess) {
  //     //   gridView.setCurrent({ dataRow: i });
  //     //   gridView.setFocus(true);

  //     //   onCellClicked(gridView, {
  //     //     dataRow: i,
  //     //     column: 'PROCESS_CD', // 또는 클릭으로 가정할 컬럼명
  //     //     itemIndex: gridView.getCurrent().itemIndex
  //     //   }, 'grdMain1');
        
  //     //   // sessionStorage 값 삭제 (한번만 실행되도록)
  //     //   window.sessionStorage.removeItem('PROCESS_CD');

  //     //   break;  
  //     // }
  //   }
  // }
}






//사업부변경 감지
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    const param = {CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue,}
    if(newValue !== '') {
      Promise.all([ 
        commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV:'Y' } }),
        commonSearchApi({ queryId: 'SPPFL0010_COMBO_01', param: searchParams }),
      ]).then((res) => {
        searchParams.DEPT_CD = ''
        searchParams.PROCESS_CD = ''
        codeList.deptcd = res[0].ORESULT_CUR
        codeList.process = []
        // codeList.process = res[1].ORESULT_CUR
        codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        codeList.process.unshift({ TXT: '전체', COD: '' })
        if(selectedDeptCd.value !='')
        {
          codeList.process.push({ TXT: 'PSM설비 외 공정', COD: 'ZZ' })
        }
      })
    }else {
      searchParams.DEPT_CD = ''
      searchParams.PROCESS_CD = ''
      codeList.deptcd = []
      codeList.process = []
      codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      codeList.process.unshift({ TXT: '전체', COD: '' })
      if(selectedDeptCd.value != '')
        {
          codeList.process.push({ TXT: 'PSM설비 외 공정', COD: 'ZZ' })
        }
    }
  }
)

// 부서변경 감지
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    if(newValue !== '') {
      commonSearchApi({ 
        queryId: 'SPPFL0010_COMBO_01', 
        param: { 
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: newValue
        } 
      }).then((res) => {
        searchParams.PROCESS_CD = ''
        codeList.process = res.ORESULT_CUR
        codeList.process.unshift({ TXT: '전체', COD: '' })
        
        if(selectedDeptCd.value !='')
        { 
          codeList.process.push({ TXT: 'PSM설비 외 공정', COD: 'ZZ' })
        }
        
      })
    }else {
      // console.log('dept and process Empty!')
      searchParams.PROCESS_CD = ''
      codeList.process = []
      codeList.process.unshift({ TXT: '전체', COD: '' })
      if(selectedDeptCd.value !='')
        {
          codeList.process.push({ TXT: 'PSM설비 외 공정', COD: 'ZZ' })
        }
    }
  }
)




//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false },
    checkBar: { visible: true}
  },
  fields : [
    { 
      fieldName: 'BSNS_NM', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('사업부'),} ,
    },
    { 
      fieldName: 'DEPT_NM', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('부서') },
    },
    { 
      fieldName: 'PROCESS_NM', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('공정설비') }, 
    },
    { 
      fieldName: 'PSI_PROCESS', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('공정상세') }, 
    },
    {
      fieldName: 'PSI_DATE', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('일자') }, 
    },
    {
      fieldName: 'PSI_TYPE_NM', dataType: 'text', width: '100', styleName: 'center-column',
      header: { text: t('형태') }, 
    },
    {
      fieldName: 'PSI_MAT', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('물질명') }, 
    },
    {
      fieldName: 'PSI_DESC', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('사고개요') }, 
    },
    {
      fieldName: 'HUM_DMG', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('인적') }, 
    },
    {
      fieldName: 'MAT_DMG', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('물적') }, 
    },
    {
      fieldName: 'ETC_DMG', dataType: 'text', width: '150', styleName: 'center-column',
      header: { text: t('기타영향') }, 
    },
    {
      fieldName: 'WRITE_YN', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('작성상태') }, 
    },
    {
      fieldName: 'FILE_YN', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('관련자료') }, 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'FILE_YN')
          if (value == 'Y') {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부 완료</button>
              </div>
            `;
          } else if(value == 'N'){ 
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >첨부</button>
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
    {
      fieldName: 'APP_YN', dataType: 'text', width: '80', styleName: 'center-column',
      header: { text: t('결재') }, 
    },
    {
      fieldName: 'REMARKS', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('비고') }, 
    },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정설비코드') },visible: false, },
    { fieldName: 'PSI_SEQ', dataType: 'text', visible: false, },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false, },
    { fieldName: 'PSI_TYPE', dataType: 'text', visible: false, },
    { fieldName: 'SAVE_STAT', dataType: 'text', visible: false, },
  ],
  columns : [],
  columnLayout :[
    'BSNS_NM','DEPT_NM','PROCESS_NM','PSI_PROCESS',
    {
      name:'내용',
      direction: 'horizontal',
      items:['PSI_DATE', 'PSI_TYPE_NM', 'PSI_MAT','PSI_DESC',
      {
        name:'피해정도',
        direction: 'horizontal',
        items:['HUM_DMG', 'MAT_DMG', 'ETC_DMG']
      }]
    },
    {
      name:'결과',
      direction: 'horizontal',
      items:['WRITE_YN','FILE_YN', 'APP_YN']
    },
    'REMARKS','SAVE_STAT'
  ]
})

grdMain1Props.columns = grdMain1Props.fields

onMounted(() => {
  
  // PSM 관리자 확인
  // 2: PSM 모듈 관리자, 1: PSM 부서 담당자, 0: 일반 사용자
  if(
    useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes("SPPF001")
  ) {
    isAdmin.value = 2
  }else if(userStore.authGrpCd.includes("SPPF002")) {
    isAdmin.value = 1
  }
  // if(isAdmin.value === 0) {
  //   return
  // }
  if(isAdmin.value==0)
  {
    menuTitle.value.visibleBtn('btnCreate',false);
  }
  else
  {
    menuTitle.value.visibleBtn('btnCreate',true);
  }
  
  initCodeList()
  // getData()

  grdMain1.value.getGridView().filterPanel.visible = true
})

const onCurrentChanged = async (grid, oldRow, newRow) =>{
  
  
  const gridView = grdMain1.value.getGridView();
  const clickedColumn = grid.getCurrent().column;
  let clickedField
  if(clickedColumn)
  {
    clickedField = grid.columnByName(clickedColumn).fieldName;
  }
  let row=grdMain1.value.getGridView().getSelectedRows();
  if(row[0]>=0)
  {
    selectrow.value=row[0];
  }
  // gridView.checkAll(false);
  // gridView.checkItem(row,true)


  if(clickedField == "FILE_YN" || clickedField == null)
  {
    return;
  }
  else
  {
  
  let v1, v2, v3
    v1=grdMain1.value.getGridView().getValues(row)["BSNS_CD"];
    v2=grdMain1.value.getGridView().getValues(row)["DEPT_CD"];
    v3=grdMain1.value.getGridView().getValues(row)["PROCESS_CD"];
    popupParam.BSNS_CD=v1
    popupParam.DEPT_CD=v2
    popupParam.PROCESS_CD=v3
    popupParam.BSNS_NM=grdMain1.value.getGridView().getValues(row)["BSNS_NM"];
    popupParam.DEPT_NM=grdMain1.value.getGridView().getValues(row)["DEPT_NM"];
    popupParam.PROCESS_NM=grdMain1.value.getGridView().getValues(row)["PROCESS_NM"];
  }
}

// 셀 클릭 이벤트

// 셀 클릭 이벤트
const onCellItemClicked = (grid, index, col) => {
  if (col.fieldName === 'FILE_YN') {  
    let SAVE_STAT=grdMain1.value.getGridView().getValues(col.dataRow)['SAVE_STAT']
    let APP=grdMain1.value.getGridView().getValues(col.dataRow)['APP_YN']
    
    if(SAVE_STAT=='T')
    {
      return Message.warn(t('보고서가 작성이 완료되지 않았습니다.'))
    }
    // if(APP=='Y')
    // {
    //   return Message.warn(t('결재가 완료된 사항입니다.'))
    // }

    bsnsCd.value = grdMain1.value.getGridView().getValues(col.dataRow)['BSNS_CD']
    deptCd.value = grdMain1.value.getGridView().getValues(col.dataRow)['DEPT_CD']
    processCd.value = grdMain1.value.getGridView().getValues(col.dataRow)['PROCESS_CD']
    psiSeq.value = grdMain1.value.getGridView().getValues(col.dataRow)['PSI_SEQ']

    let fileId=grdMain1.value.getGridView().getValues(col.dataRow)['FILE_ID']
    if(APP=='Y')
    {
      FIUploadPopup.value.openPopup(fileId);
    }
    else
    {
      MIUploadPopup.value.openPopup(fileId);
    }
    
  }
}

const onCellDblClicked = (grid, col) => {

  let status = grdMain1.value.getGridView().getValues(col.dataRow)['SAVE_STAT'];
  let app_status = grdMain1.value.getGridView().getValues(col.dataRow)['APP_YN'];
  // console.log("status:",status)
  // console.log("app_status:",app_status)
  
  if(app_status=='Y')
  {
    popupParam.WRITE="N"
  }
  else
  {
    if(isAdmin.value==0)
    {
      popupParam.WRITE="N"  
    }
    else
    { 
      popupParam.WRITE="Y"
    }
  }

  popupParam.BSNS_CD=grdMain1.value.getGridView().getValues(col.dataRow)['BSNS_CD']
  popupParam.DEPT_CD=grdMain1.value.getGridView().getValues(col.dataRow)['DEPT_CD']
  popupParam.PROCESS_CD=grdMain1.value.getGridView().getValues(col.dataRow)['PROCESS_CD']
  popupParam.PSI_SEQ=grdMain1.value.getGridView().getValues(col.dataRow)['PSI_SEQ']
  popupParam.APP=app_status
  popupParam.SAVE_STAT=status
  openPopup("M")
}
const upDate =()=>{

  getData()
  // onButtonsClick({id:"btnSearch"});

}

const uploaded =(val)=>{
  
  let fId=val.fileId;

  commonExecuteApi({ queryId: 'SPPFL0010_SAVE_02', 
                  list: [{CMPNY_DIV : userStore.cmpnyDiv, BSNS_CD : bsnsCd.value, DEPT_CD : deptCd.value, PROCESS_CD : processCd.value, PSI_SEQ : psiSeq.value, FILE_ID : fId}] })
}

const closed = (val) =>
{
  if(val)
  {
    getData()
  }
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnNmi','btnSearch','btnCreate','btnDelete']"
        @click-button="onButtonsClick"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('사업부')"
              v-model="selectedBsnsCd"
              :items="codeList.bsnscd"
              item-title="BSNS_NM"
              item-value="BSNS_CD" 
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('부서')"
              v-model="selectedDeptCd"
              :items="codeList.deptcd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
            />
            <!-- :disabled="!(isAdmin > 1)" -->
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('공정설비')"
              v-model="searchParams.PROCESS_CD"
              :items="codeList.process"
              item-title="TXT"
              item-value="COD"
            />
          </div>
        </v-sheet>
        <VRow no-gutters style="height 50%">
          <VCol class="pa-2 pt-0 pb-0">
            <RealGrid
              ref="grdMain1"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain1Props.keys" 
              :fields="grdMain1Props.fields"
              :columns="grdMain1Props.columns"
              :column-layout="grdMain1Props.columnLayout"
              @onCurrentChanged="onCurrentChanged"  
              @onCellItemClicked="onCellItemClicked" 
              @onCellDblClicked="onCellDblClicked"
            />
          </VCol>
        </VRow>
      </div>
      <IUploadPopup ref="FIUploadPopup" 
      gridTitle="첨부파일 다운로드"
      width="1200" 
      height="800" 
      :button-list="['btnDownLoad','btnDelete','btnClose']"
      :isVisibled="false"
      @closed = "upDate"
      ></IUploadPopup>

      <IUploadPopup ref="MIUploadPopup" 
      gridTitle="첨부파일"
      width="1200" 
      height="800" 
      @uploaded = "uploaded"
      @closed = "upDate"></IUploadPopup>
      <SPPFL0010Popup ref="SPPFL0010_Popup" @closed="closed"/>
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
