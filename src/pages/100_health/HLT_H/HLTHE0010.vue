<!-- HLTHE0010 안전보호구 및 안전소모품 비용 -->
<!-- SI1팀 마환구 2025.06.09 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
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
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper';
import Message from '@hiway/utils/notify'
import HLTHE0010Popup01 from '@/pages/100_health/HLT_H/HLTHE0010Popup01.vue'

import { useRoute } from 'vue-router'



defineOptions({
  name: '100_health-HLT_H-HLTHE0010'
})

const SPPFC0010_Popup = ref(null)
const approvalPopup = ref(null)
const FIUploadPopup = ref(null)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const useLogStore = useLogsStore()
const menuTitle = ref(null)
const grdMain1 = ref(null)
const grdMain2 = ref(null)

const grdTitle1 = ref(null)
const grdTitle2 = ref(null)

const route = useRoute()
const HLTHE0010_Popup01 = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  ASGN_CD: '', //소속
  REG_YEAR: dayjs().format("YYYY"),//년도
})

const saveParams =ref([]);

const isAdmin = ref(0)
const isReadC= ref(false);
const isReadB= ref(false);

const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
  cmpnyDiv: [],
})

const initCodeList = () => {
  Promise.all([ 
    getCodeList('HHIZ000'),
    isAdmin.value == 0
    ? commonSearchApi({ queryId : 'HLTHE0010_SEARCH_04', param : { CMPNY_DIV: searchParams.CMPNY_DIV, USER_ID: userStore.userId } }) // 부서 자재관리자용 사업부 
    : commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV:'Y' } }), // 사업부
    isAdmin.value == 0
    ? commonSearchApi({ queryId : 'HLTHE0010_SEARCH_03', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USER_ID: userStore.userId } }) // // 부서 자재관리자용 부서
    : commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV:'Y' } }) // 부서     
  ]).then(res => {    

    codeList.cmpnyDiv = res[0].ORESULT_CUR
    codeList.bsnscd = res[1].ORESULT_CUR
    codeList.deptcd = res[2].ORESULT_CUR

    if(isAdmin.value==2)
    {
      codeList.cmpnyDiv.unshift({ TXT: '전체', COD: '' })
      codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    }
    
    if(isAdmin.value==0)
    {
      searchParams.BSNS_CD=codeList.bsnscd[0].BSNS_CD
      searchParams.DEPT_CD=codeList.deptcd[0].DEPT_CD
    }
  })
}

// 등록/수정 구분자
const isNew = ref(false)

const onButtonsClick = btn => {
  if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
       .setTargetGridRow([{ grid:grdMain2, row: 'check' }])
       .setGridList([grdMain2])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id === 'btnSearch') {
    getData()
  }
  else if(btn.id=='btnSendMail')
  {
    openPopup();
  }
}

const openPopup = () =>{
 
  let checkRow=grdMain2.value.getGridView().getCheckedRows(true);
  let rowList =[];
  if(checkRow.length ==0)
  {
    return Message.warn(t('메일을 보낼 부서를 선택해주세요.'))
  }
  for(let rowIdx of checkRow)
  {
    let row= grdMain2.value.getDataProvider().getJsonRow(rowIdx)
    let sameList = rowList.filter(item => item.CMPNY_DIV == row.CMPNY_DIV && 
        item.BSNS_CD == row.BSNS_CD && item.DEPT_CD == row.DEPT_CD
        )
      if(isEmpty(sameList)) {
        rowList.push(row)
      } 
  }
  HLTHE0010_Popup01.value.openPopup(rowList);
}

const beforeSave =()=>{
  let chekedRow = ref([])
  let bCheck = true
  chekedRow = grdMain2.value.getGridView().getCheckedRows()
  
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  saveParams.value = []
  let data = ref([])

  chekedRow.forEach(val => {
    data = grdMain2.value.getDataProvider().getJsonRow(val)
    data.USER_ID = userStore.userId // 수정자

    saveParams.value.push(data)
  })
  // console.log('saveParams : ',saveParams)
  // console.log("저장 파라메트", saveParams.value)
  return bCheck
}
const saveData =()=>{
  return commonExecuteApi({ queryId : "HLTHE0010_SAVE_01", list: saveParams.value })
}
const afterSave=(res)=>{
    onButtonsClick({ id: 'btnSearch' })
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain1,grdMain2])
    // .setBefore(beforeSearch)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

// const beforeSearch = () =>{
//   return true
// }


//  조회
const searchData = async () => {

  await commonSearchApi({ queryId: 'HLTHE0010_SEARCH_01', param: searchParams })
  .then(res=>{
    grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR);
  });
  
  await commonSearchApi({ queryId: 'HLTHE0010_SEARCH_02', param: searchParams })  
  .then(res=>{
    grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR);
  });

}

// 조회 후
const afterSearch = () => {

}

//그리드 속성셋팅
const grdMain1Props = reactive({
  gridViewOption: { checkBar: { visible: false }},
  fields: [],
  columns: [],
  columnLayout:[],
})

const grdMain2Props = reactive({
  gridViewOption: { checkBar: { visible: true }},
  fields: [],
  columns: [],
  columnLayout:[],
})

onMounted( async () => {

  isAdmin.value= await getAdmin();
  console.log("isAdmin:",isAdmin.value);
  initCodeList()
  createGrid()
  
  grdMain1.value.getGridView().filterPanel.visible = true
  grdMain2.value.getGridView().filterPanel.visible = true
})

const getAdmin = async () => {
  if (
    userStore.authGrpCd.includes("HLTH001") || // 안전보호구 모듈 관리자
    userStore.authGrpCd.includes("GRP00392") // HES추진자 
  ) 
  {
    return 2;
  } 
  else if(    
    userStore.authGrpCd.includes("GRP00389") || // 직책과장
    userStore.authGrpCd.includes("GRP00387")  // 부서장
    )
  {
    return 1;
  }
  else {
    return 0;
  }
};

const createGrid=()=>{

  if(isAdmin.value==2)//관리자
  {
    // menuTitle.value.visibleBtn('btnSearch',true)
    // menuTitle.value.visibleBtn('btnUpdate',true)
    // isReadC.value=false
    // isReadB.value=false

    isReadC.value=false
    isReadB.value=false
  }
  else if(isAdmin.value==1)//부서장
  {
    // menuTitle.value.visibleBtn('btnSearch',false)
    // menuTitle.value.visibleBtn('btnUpdate',false)
    isReadC.value=true
    isReadB.value=true
  }
  else//부서 자재관리자
  {
    // menuTitle.value.visibleBtn('btnSearch',false)
    // menuTitle.value.visibleBtn('btnUpdate',false)
    isReadC.value=true
    isReadB.value=false
  }
  
  const result1 = BandGrid01();
  const result2 = BandGrid02();

  grdMain1Props.columnLayout = result1.columnLayout;
  grdMain1Props.fields = result1.fields;
  grdMain1Props.columns = result1.columns

  grdMain2Props.columnLayout = result2.columnLayout;
  grdMain2Props.fields = result2.fields;
  grdMain2Props.columns = result2.columns

  grdMain1.value.getDataProvider().setFields(grdMain1Props.columns)
  grdMain1.value.getGridView().setColumns(grdMain1Props.columns)
  grdMain1.value.getGridView().setColumnLayout(grdMain1Props.columnLayout)
  grdMain1.value.getGridView().filterPanel.visible = true;
  // grdMain1.value.getGridView().footer.visible=true;
  grdMain1.value.getGridView().setFixedOptions({
    colCount: 2,
  })
  
  
  grdMain2.value.getDataProvider().setFields(grdMain2Props.columns)
  grdMain2.value.getGridView().setColumns(grdMain2Props.columns)
  grdMain2.value.getGridView().setColumnLayout(grdMain2Props.columnLayout)
  grdMain2.value.getGridView().filterPanel.visible = true;
  grdMain2.value.getGridView().footer.visible=true;
  grdMain2.value.getGridView().setFixedOptions({
    colCount: 3,
  })
}

function BandGrid01 () {
   
   const fields = [
   {
     fieldName: 'CMPNY_DIV',
     dataType: 'text'
   },
   {
     fieldName: 'BSNS_CD',
     dataType: 'text'
   },
   {
     fieldName: 'DEPT_CD',
     dataType: 'text'
   },
   {
     fieldName: 'ASGN_CD',
     dataType: 'text'
   },
   {
     fieldName: 'YEAR',
     dataType: 'text'
   },
   {
     fieldName: 'REL_CD',
     dataType: 'text'
   },
   {
     fieldName: 'BSNS_NM',
     dataType: 'text'
   },
   {
     fieldName: 'DEPT_NM',
     dataType: 'text'
   },
  ];
   const columns = [
   {
     name: 'CMPNY_DIV',
     dataType: 'text',
     fieldName: 'CMPNY_DIV',
     width: 80,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },  
   {
     name: 'BSNS_CD',
     dataType: 'text',
     fieldName: 'BSNS_CD',
     width: 80,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },
   {
     name: 'DEPT_CD',
     dataType: 'text',
     fieldName: 'DEPT_CD',
     width: 80,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },    
   {
     name: 'ASGN_CD',
     dataType: 'text',
     fieldName: 'ASGN_CD',
     width: 80,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },  
   {
     name: 'REL_CD',
     dataType: 'text',
     fieldName: 'REL_CD',
     width: 80,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },  
   {
     name: 'YEAR',
     dataType: 'text',
     fieldName: 'YEAR',
     width: 80,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },  
   {
     name: 'BSNS_NM',
     dataType: 'text',
     fieldName: 'BSNS_NM',
     width: 150,
     editable: false,
     lookupDisplay: true,
     header: { text: '사업부' },
     styleName: 'left-column',
   },
   {
     name: 'DEPT_NM',
     dataType: 'text',
     fieldName: 'DEPT_NM',
     width: 150,
     editable: false,
     lookupDisplay: true,
     header: { text: '부서' },
     styleName: 'left-column',
   },
   ];
   const columnLayout = [
     'CMPNY_DIV', 'BSNS_CD', 'DEPT_CD', 'ASGN_CD', 'REL_CD', 'YEAR', 'BSNS_NM', 'DEPT_NM'
   ];
   const suffixes = ['SHIELD', 'SUPPLIES', 'SUM'];
   const suffixesNM = ['안전보호구', '안전소모품', '계'];

  for (let y = 1; y <= 12; y++) {
    const childCols = []; // 매달마다 새로운 배열

    for (let i = 0; i < suffixes.length; i++) {
      let colNm = `${suffixes[i]}${y}`;  // ← 여기가 핵심

      columns.push({
        name: colNm,
        fieldName: colNm,
        header: { text: suffixesNM[i] },
        width: 100,
        dataType: 'number',
        numberFormat: "#,##0",
        styleName: 'right-column',
        editable: i !== suffixes.length - 1, // 마지막(SUM)만 false
      });

      childCols.push(colNm);  // 월별 컬럼 목록에 추가
    }

    columnLayout.push({
      name: `${y}월`,
      direction: 'horizontal',
      items: childCols
    });
  }
 
   return { fields, columns, columnLayout };
 }

function BandGrid02 () {
   
   const fields = [
   {
     fieldName: 'CMPNY_DIV',
     dataType: 'text'
   },
   {
     fieldName: 'BSNS_CD',
     dataType: 'text'
   },
   {
     fieldName: 'DEPT_CD',
     dataType: 'text'
   },
   {
     fieldName: 'ASGN_CD',
     dataType: 'text'
   },
   {
     fieldName: 'REG_YEAR',
     dataType: 'text'
   },
   {
     fieldName: 'REL_CD',
     dataType: 'text'
   },
   {
     fieldName: 'BSNS_NM',
     dataType: 'text'
   },
   {
     fieldName: 'DEPT_NM',
     dataType: 'text'
   },
   {
     fieldName: 'ASGN_NM',
     dataType: 'text'
   },
  ];
   const columns = [
   {
     name: 'CMPNY_DIV',
     dataType: 'text',
     fieldName: 'CMPNY_DIV',
     width: 80,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },  
   {
     name: 'BSNS_CD',
     dataType: 'text',
     fieldName: 'BSNS_CD',
     width: 120,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },
   {
     name: 'DEPT_CD',
     dataType: 'text',
     fieldName: 'DEPT_CD',
     width: 120,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },    
   {
     name: 'ASGN_CD',
     dataType: 'text',
     fieldName: 'ASGN_CD',
     width: 80,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },  
   {
     name: 'REL_CD',
     dataType: 'text',
     fieldName: 'REL_CD',
     width: 80,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },  
   {
     name: 'REG_YEAR',
     dataType: 'text',
     fieldName: 'REG_YEAR',
     width: 80,
     editable: false,
     lookupDisplay: true,
     header: { text: ' ' },
     styleName: 'center-column',
     sortable: false,
     visible : false
   },  
   {
     name: 'BSNS_NM',
     dataType: 'text',
     fieldName: 'BSNS_NM',
     width: 150,
     editable: false,
     lookupDisplay: true,
     header: { text: '사업부' },
     styleName: 'left-column',
   },
   {
     name: 'DEPT_NM',
     dataType: 'text',
     fieldName: 'DEPT_NM',
     width: 150,
     editable: false,
     lookupDisplay: true,
     header: { text: '부서' },
     styleName: 'left-column',
   },
   {
     name: 'ASGN_NM',
     dataType: 'text',
     fieldName: 'ASGN_NM',
     width: 150,
     editable: false,
     lookupDisplay: true,
     header: { text: '협력사' },
     styleName: 'left-column',
     footer:{
          text:"합계",
          styleName: "right-column"
        },
   },

   ];
   const columnLayout = [
     'CMPNY_DIV', 'BSNS_CD', 'DEPT_CD', 'ASGN_CD', 'REL_CD', 'REG_YEAR',
     'BSNS_NM', 'DEPT_NM', 'ASGN_NM'
   ];
   const suffixes = ['SHIELD', 'SUPPLIES', 'ETC', 'SUM'];
   const suffixesNM = ['안전보호구', '안전소모품', '기타품목', '계'];

  for (let y = 1; y <= 12; y++) {
    const childCols = []; // 매달마다 새로운 배열

    for (let i = 0; i < suffixes.length; i++) {
      let colNm = `${suffixes[i]}${y}`;  // ← 여기가 핵심

      columns.push({
        name: colNm,
        fieldName: colNm,
        header: { text: suffixesNM[i] },
        width: 100,
        dataType: 'number',
        numberFormat: "#,##0",
        styleName: 'right-column',
        editable: i !== suffixes.length - 1, // 마지막(SUM)만 false
        editor :{dateType:'number', maxLength:'10', type:'number'},
        footer:{
          expression: "sum",  // ← 여기서 합계 지정
          numberFormat: "#,##0",
          styleName: "right-column"
        },
        'styleCallback':function(grid,dataCell){
          var ret={enabled:true}
          if(i == suffixes.length - 1){
            ret.style={background:'#FFFFFF'}
          }
          else{
            ret.style={background:'#eff8fd'}
          }
          return ret
        }
      });

      childCols.push(colNm);  // 월별 컬럼 목록에 추가
    }

    columnLayout.push({
      name: `${y}월`,
      direction: 'horizontal',
      items: childCols
    });
  }
 
   return { fields, columns, columnLayout };
 }

const changeCmpny =()=>{
  
  Promise.all([ 
    isAdmin.value== 0 ?
    commonSearchApi({ queryId : 'HLTHE0010_SEARCH_04', param : { CMPNY_DIV: searchParams.CMPNY_DIV, USER_ID: userStore.userId } }) // 부서 자재관리자용 사업부
    : commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV:'Y' } }), // 사업부
    isAdmin.value== 0 ?
    commonSearchApi({ queryId : 'HLTHE0010_SEARCH_03', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USER_ID: userStore.userId } }) // 부서 자재관리자용 부서
    : commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV:'Y' } })// 부서

  ]).then(res => {    

    codeList.bsnscd = res[0].ORESULT_CUR
    codeList.deptcd = res[1].ORESULT_CUR

    codeList.bsnscd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

    searchParams.BSNS_CD=''
    searchParams.DEPT_CD=''
  })
}

const changeBsns = ()=>{
  Promise.all([  
  isAdmin.value== 0 ?
    commonSearchApi({ queryId : 'HLTHE0010_SEARCH_03', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USER_ID: userStore.userId } }) // 부서 자재관리자용 부서
    : commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV:'Y' } })//부서
  ]).then(res =>{
    codeList.deptcd = res[0].ORESULT_CUR
    codeList.deptcd.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    searchParams.DEPT_CD=''
  })
}

const onCellValueChanged=(grid, itemIndex, dataRow, field, oldValue, newValue)=>
{
  grid.checkItem(itemIndex,true)
  grid.commit()
  let fieldname=grdMain2.value.getDataProvider().getFieldName(field)
  const match = fieldname.match(/^(SHIELD|SUPPLIES|ETC)(\d{1,2})$/);
  if (!match) return;

  const month = match[2];

  
  const GV=grdMain2.value.getGridView();
  const DP=grdMain2.value.getDataProvider();

  const shield = Number(GV.getValue(itemIndex, `SHIELD${month}`)) || 0;
  const supplies = Number(GV.getValue(itemIndex, `SUPPLIES${month}`)) || 0;
  const etc = Number(GV.getValue(itemIndex, `ETC${month}`)) || 0;

  const sum = shield + supplies + etc;

  DP.setValue(itemIndex, `SUM${month}`, sum);
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnSearch','btnUpdate','btnSendMail']"
        @click-button="onButtonsClick"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <i-select :label="$t('년도')" 
            width="200px" 
            type="YEAR" 
            v-model="searchParams.REG_YEAR"/>
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('회사구분')"
              v-model="searchParams.CMPNY_DIV"
              :items="codeList.cmpnyDiv"
              item-title="TXT"
              item-value="COD" 
              @update:modelValue ="changeCmpny"
              :disabled = "isReadC"
            />
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('사업부')"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnscd"
              item-title="BSNS_NM"
              item-value="BSNS_CD" 
              @update:modelValue ="changeBsns"
              :disabled = "isReadC"
            />
            <!-- :disabled = "isReadB" 담당한 사업부만 보이려면 풀어주면됨--> 
            <i-select
              label-width="50px"
              width="250px"
              :label="$t('부서')"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptcd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :disabled = "isReadB"
            />
          </div>
        </v-sheet>
        <VRow style="height:5%">
          <VCol class="pa-2 pt-0 pb-0">
            <p>※ 부서관리자(부서장, 운영과장, 부서 자재관리자)만 조회 및 등록 가능합니다.</p>
            <p>※ 부서 자재관리자 등록 요청은 보건관리팀으로 요청바랍니다.</p>
          </VCol>
        </VRow>
        <VRow style="height:30%">
          <VCol class="pa-2 pt-0 pb-0">
            <IGridTitle 
              :title="$t('RMS시스템 청구실적')"
              ref="grdTitle1"
            >
            <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain1"
              :grid-view-option="grdMain1Props.gridViewOption"
              :keys="grdMain1Props.keys" 
              :fields="grdMain1Props.fields"
              :columns="grdMain1Props.columns"
              :column-layout="grdMain1Props.columnLayout" 
              style = "height : 80%"
            />
          </VCol>
        </VRow>
        <VRow style="height:60%">
          <VCol class="pa-2 pt-0 pb-0">
            <IGridTitle 
              :title="$t('비용등록')"
              ref="grdTitle2"
            >
            <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain2"
              :grid-view-option="grdMain2Props.gridViewOption"
              :keys="grdMain2Props.keys" 
              :fields="grdMain2Props.fields"
              :columns="grdMain2Props.columns"
              :column-layout="grdMain2Props.columnLayout"
              style = " height : 90%"
              @onEditRowChanged = "onCellValueChanged"
            />
          </VCol>
        </VRow>
      </div>
    </v-card-text>
  </v-card>
<HLTHE0010Popup01 ref="HLTHE0010_Popup01"/>
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
