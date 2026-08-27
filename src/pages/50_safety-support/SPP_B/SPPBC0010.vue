<script setup>
import { ref, reactive, onMounted, getCurrentInstance, readonly } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import SPPBC0010Popup from './SPPBC0010Popup.vue'
import OZReport from '@/components/OZReport.vue'


defineOptions({
  name: '50_safety-support-SPP_B-SPPBC0010',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
let type = ''
const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null) // 메인그리드
const grdSub = ref(null) //
const deptPopup = ref(null)
// 건물명 팝업
const rSPPBC0010Popup = ref(null)

const reportName = ref(null)
// IN Parameters [ "PARAM1='AA'", "PARAM2='BB'"]
const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)


//조회조건
let searchParams = reactive({    
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  BSNS_NM: '',
  BUILDING_NO: '',
  BUILDING_NAME: '',
  DONG_NAME: '',
  UPDATE_STATE: false,
  SEARCH_STATE: false,
})

let gridState = reactive({    
  parent: false,
})

// v-model
let detailData = reactive({
  PUMP_LOC: '',
  PUMP_DTL_LOC: '',
  ROOFTOP_WATER: '',
  EFFEC_WATER: 0,
  WATER_TANK: '',
  GROUND_TANK: '',
})


//코드리스트 선언
const codeList = reactive({
  bsnsCd: [],
  roofTop: [
    {COD:"Y",TXT:"있음"},
    {COD:"N",TXT:"없음"}],
  groundTank: [
    {COD:"1",TXT:"지상수조"},
    {COD:"2",TXT:"지하수조"}],
  waterTank: [
    {COD:"1",TXT:"전용수조"},
    {COD:"2",TXT:"겸용수조"}],
  pumpNameList: [
    {COD:"HHIK080010",TXT:"주펌프"},
    {COD:"HHIK080020",TXT:"예비펌프"},
    {COD:"HHIK080030",TXT:"충압펌프"},
    {COD:"HHIK080040",TXT:"포주펌프"},
    {COD:"HHIK080050",TXT:"살수펌프"},
    {COD:"HHIK080060",TXT:"엔진펌프"},]
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), // 사업부
  ]).then((res) => {
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({BSNS_CD: '',BSNS_NM: '전체'})  
    // 기본 데이터 적용
    // console.log('codeList.bsnsCd',codeList.bsnsCd)
  })
}

// 출력 버튼 클릭시
const onOzPrint = () => {
  reportName.value = '/manage/hse/SPPBC0010.ozr'
  params.value = ['IN_CMPNY_DIV=' + userStore.cmpnyDiv,
                  'IN_BSNS_CD=' + searchParams.BSNS_CD,
                  'IN_BUILDING_NO=' + searchParams.BUILDING_NO]

  //console.log('pValue = ', params.value)

  showOz.value = true
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },
  keys : ['BSNS_NM'],
  fields : [ 
    // { fieldName: 'TREE_NM',
    //  dataType: 'text',
    //  header: { text:'구분' } ,
    //  width: "100"
    // },
    { fieldName: 'BSNS_NM',
     dataType: 'text',
     header: { text:'사업부' } },
    { fieldName: 'BUILDING_NAME'
    , dataType: 'text'
    , header: { text:'건물명' }
    , editable: false },
    { fieldName: 'DONG_NAME'
    , dataType: 'text'
    , header: { text:'동명' }
    , editable: false },
    { fieldName: 'SEQ'
    , dataType: 'text'
    , header: { text:'순서' }
    , styleName: 'right-column'
    ,width: "50" , editable: false},
    { fieldName: 'PUMP_NAME'
    , dataType: 'text'
    , header: { text:'펌프명' }
    , editor: {
        type: "dropdown",
        dropDownCount: 6,
        dropDownWhenClick: true,
        partialMatch: true,
      },
      renderer:{
        type:'html',
        callback: function(grid,cell,w,h){
          let result = ''
          // console.log(cell.value)
          codeList.pumpNameList.forEach((e)=>{
            if(e.COD === cell.value){
              result = e.TXT
            }else if(cell.value === undefined){
              result = ''
            }
          })
          return result
        }
      },
      styleName:'editable_column',
      // 
      styleCallback: function(grid, dataCell){
      let rowData = grdMain.value.getRowData(dataCell.item.dataRow) 
      var ret = {}
      if(rowData.TREE_STAIR === '1' || rowData.TREE_STAIR === '2'){
        ret.editable = false;
      } else {
        ret.editable = true;
      }
      return ret;
      }
      ,groupFooter: {
      text: "소계 : "
      },
      footer: {
        text: "합계 : "
      },
    },
    { fieldName: 'FLUX', dataType: 'number',
     header: { text:'유량(㎥)' },
     width: "50",
     numberFormat: "#,##0.##",
     styleCallback: function(grid, dataCell){
      let rowData = grdMain.value.getRowData(dataCell.item.dataRow) 
      var ret = {}
      if(rowData.TREE_STAIR === '1' || rowData.TREE_STAIR === '2'){
        ret.editable = false;
      } else {
        ret.editable = true;
      }
      return ret;
      },
    groupFooter: {
      numberFormat: "#,##0.##",
      expression: "sum"
    },
    footer: {
      numberFormat: "#,##0.##",
      expression: "sum"
    },
    styleName:'editable_column-right', 
    },
    { fieldName: 'SUCTION_HEAD', dataType: 'number', header: { text:'양정(m)' }
    , width: "50",numberFormat: "#,##0.##",
     styleCallback: function(grid, dataCell){
      let rowData = grdMain.value.getRowData(dataCell.item.dataRow) 
      var ret = {}
      if(rowData.TREE_STAIR === '1' || rowData.TREE_STAIR === '2'){
        ret.editable = false;
      } else {
        ret.editable = true;
      }
      return ret;
      },
      groupFooter: {
        numberFormat: "#,##0.##",
        expression: "sum"
      },
      footer: {
        numberFormat: "#,##0.##",
        expression: "sum"
      }, 
    styleName:'editable_column-right', 
    },
    { fieldName: 'OUTPUT', dataType: 'number', header: { text:'출력(hp)' },
     width: "50",numberFormat: "#,##0.##",
      styleCallback: function(grid, dataCell){
      let rowData = grdMain.value.getRowData(dataCell.item.dataRow) 
      var ret = {}
      if(rowData.TREE_STAIR === '1'|| rowData.TREE_STAIR === '2'){
        ret.editable = false;
      } else {
        ret.editable = true;
      }
      return ret;
      },
      groupFooter: {
        numberFormat: "#,##0.##",
        expression: "sum"
      },
      footer: {
        numberFormat: "#,##0.##",
        expression: "sum"
      },  
    styleName:'editable_column-right', 
    },
    { fieldName: 'USE_INSIDE',
     dataType: 'text',
      header: { text:'옥내' },
      width: "40",
      renderer: { 
      type: 'check'
      , trueValues: 'Y'
      , falseValues: 'N'
      }
      , styleCallback: function(grid, dataCell){
      let rowData = grdMain.value.getRowData(dataCell.item.dataRow) 
      var ret = {}
      if(rowData.TREE_STAIR === '1' || rowData.TREE_STAIR === '2'){
        ret.renderer = {type:'text'}
        ret.editable = false;
      } 
      return ret;
      }
      , editable: false
      , readonly : true
      , styleName:'editable_column' 
    },
    { fieldName: 'USE_OUTSIDE',
     dataType: 'text', 
     header: { text:'옥외' } ,
     renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
     editable: false,
     width: "40"
     , styleCallback: function(grid, dataCell){
      let rowData = grdMain.value.getRowData(dataCell.item.dataRow) 
      var ret = {}
      if(rowData.TREE_STAIR === '1' || rowData.TREE_STAIR === '2'){
        ret.renderer = {type:'text'}
        ret.editable = false;
      } 
      return ret;
      }
      , editable: false
      , readonly : true
      , styleName:'editable_column' 
    },
    { fieldName: 'USE_SP',
     dataType: 'text',
     width: "40",
     header: { text:'SP' } 
    ,renderer: { type: 'check', trueValues: 'Y',falseValues: 'N' } 
    , styleCallback: function(grid, dataCell){
      let rowData = grdMain.value.getRowData(dataCell.item.dataRow) 
      var ret = {}
      if(rowData.TREE_STAIR === '1' || rowData.TREE_STAIR === '2'){
        ret.renderer = {type:'text'}
        ret.editable = false;
      } 
      return ret;
      }
      , editable: false
      , readonly : true
      , styleName:'editable_column' 
    },
    { fieldName: 'USE_PO', dataType: 'text',
     header: { text:'포' },
     width: "40", 
    renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }
    , styleCallback: function(grid, dataCell){
      let rowData = grdMain.value.getRowData(dataCell.item.dataRow) 
      var ret = {}
      if(rowData.TREE_STAIR === '1' || rowData.TREE_STAIR === '2'){
        ret.renderer = {type:'text'}
        ret.editable = false;
      } 
      return ret;
      }
      , editable: false
      , readonly : true
      , styleName:'editable_column' 
    },
    { fieldName: 'USE_SPRINKLING', 
    dataType: 'text',
     header: { text:'살수' },
     width: "40",
     renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }
     , styleCallback: function(grid, dataCell){
      let rowData = grdMain.value.getRowData(dataCell.item.dataRow) 
      var ret = {}
      if(rowData.TREE_STAIR === '1' || rowData.TREE_STAIR === '2'){
        ret.renderer = {type:'text'}
        ret.editable = false;
      } 
      return ret;
      }
      , editable: false
      , readonly : true
      , styleName:'editable_column' 
    },
    { fieldName: 'USE_RCM', 
    dataType: 'text',
     header: { text:'RCM' },
     width: "40",
     renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }
     , styleCallback: function(grid, dataCell){
      let rowData = grdMain.value.getRowData(dataCell.item.dataRow) 
      var ret = {}
      if(rowData.TREE_STAIR === '1' || rowData.TREE_STAIR === '2'){
        ret.renderer = {type:'text'}
        ret.editable = false;
      } 
      return ret;
      }
      , editable: false
      , readonly : true
      , styleName:'editable_column' 
    },

    
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'TREE_ID', dataType: 'text' , visible: false },
    { fieldName: 'BUILDING_NO', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'TREE_STAIR', dataType: 'text' , visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 서브 그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: true } },

  keys : ['PUMP_NAME'],
  fields : [ 
    { fieldName: 'BUILDING_NAME'
    , dataType: 'text'
    , header: { text:'건물명' },
    styleName: "left-column",
      renderer: {
      type: "html",
      callback: function (grid, cell, w, h) {
        var str = 
        `<div style="display: flex; justify-content: space-between;">
        <p>${cell.value}</p>
        <button id="cellButton"><span class="mdi mdi-magnify text-light-blue-darken-1" style="font-size: 21px;"></span></button>
        </div>`
        return str;
      },
    },
    readonly: true,
    editable: false
   },
    { fieldName: 'DONG_NAME', dataType: 'text', 
      header: { text:'동명' },
      readonly: true,
      editable: false },
    { fieldName: 'BUILDING_NAME_MAIN', dataType: 'text',
      header: { text:'펌프 메인건물' },
      readonly: true,
      editable: false },

    
    // 숨기는 필드 visible:'false'
    
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
    { fieldName: 'BUILDING_NO', dataType: 'text' , visible: false },
    { fieldName: 'BUILDING_NO_SUB', dataType: 'text' , visible: false },
    { fieldName: 'PREVI_VAL', dataType: 'text' , visible: false },
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.fields


//초기 데이터셋팅
onMounted(() => {
  initCodeList()
  onMainButtonsClick({id: 'btnSearch'})
})


/******** 버튼 작동 구간 *********/

//메뉴버튼
const onMainButtonsClick = btn => {

  if (btn.id === 'btnSearch') {  // 조회
    Promise.all([
      commonSearchApi({
        queryId: "SPPBC0010_SEARCH_20",
        param: searchParams,
      }), // 트리 1단계 (건물)
      commonSearchApi({
        queryId: "SPPBC0010_SEARCH_30",
        param: searchParams,
      }),// 트리 2단계 (펌프)
      commonSearchApi({
        queryId: "SPPBC0010_SEARCH_01",
        param: searchParams,
      }), // 트리 3단계 (세부 데이터)
      commonSearchApi({
        queryId: "SPPBC0010_SEARCH_10",
        param: searchParams,
      }), // 펌프실 세부 데이터
    ]).then((res)=>{
      // grdMain.value.getDataProvider().setRows([])
      // grdMain.value.getGridView().setAllCheck(false)
      let tempList = []
      // 트리 순서 배치
      // res[0].ORESULT_CUR.forEach((tree)=>{
      //   // 1단
      //   tempList.push(tree)
      //   res[1].ORESULT_CUR.forEach((tree1) => {
      //     // 1단과 매치 되는 2단
      //     if(tree.TREE_ID === tree1.TREE_ID.split('.')[0]){
      //       tempList.push(tree1)
      //     }
      //     res[2].ORESULT_CUR.forEach((tree2) => {
      //       // 1,2단과 매치되는 3단
      //       // console.log(tree2.TREE_ID.split('.')[0])
      //       if(tree.TREE_ID === tree2.TREE_ID.split('.')[0]){
      //         if(tree1.TREE_ID.split('.')[1] === tree2.TREE_ID.split('.')[1]){
      //           tempList.push(tree2)
      //         } 
      //       }
      //     })
      //   });
      // })
      // 트리뷰 사용
      // grdMain.value.getDataProvider().setRows(tempList,"TREE_ID")
      // grdMain.value.getGridView().expandAll()
      // if(tempList.length>0){
      //   gridState.parent = true
      // }else{
      //   gridState.parent = false
      // }
      // 그룹핑 사용
      grdMain.value.getDataProvider().setRows(res[2].ORESULT_CUR)
      grdMain.value.getGridView().groupBy(["BSNS_NM","BUILDING_NAME"])
      // console.log(grdSub.value.getGridView().rowGroup.headerStatement)
      grdMain.value.getGridView().rowGroup.headerStatement = undefined;
      grdMain.value.getGridView().rowGroup.headerCallback = function(grid, group) {
        const groupName = grid.getDataSource().getOrgFieldName(group.groupField) 
        // console.log('group',group.groupValue)
        if(groupName==="BSNS_NM"){
          return "사업부 : " + group.groupValue
        }else if(groupName === "BUILDING_NAME"){
          return "건물명 : " + group.groupValue
        }
  	  }
      grdMain.value.getGridView().getGroupFieldNames(false)
      grdMain.value.setBindingColumn("PUMP_NAME", codeList.pumpNameList, "COD", "TXT")
      // 펌프실 세부 데이터
      // console.log('detailData',res[3].ORESULT_CUR)
      if(res[3].ORESULT_CUR.length === 1){
        let data = res[3].ORESULT_CUR[0]
        detailData.PUMP_LOC = data.PUMP_LOC
        detailData.PUMP_DTL_LOC = data.PUMP_DTL_LOC
        detailData.ROOFTOP_WATER = data.ROOFTOP_WATER
        detailData.EFFEC_WATER = data.EFFEC_WATER
        detailData.WATER_TANK = data.WATER_TANK
        detailData.GROUND_TANK = data.GROUND_TANK
        searchParams.BSNS_NM = data.BSNS_NM 
      } else {
        detailData.PUMP_LOC = ''
        detailData.PUMP_DTL_LOC = ''
        detailData.ROOFTOP_WATER = ''
        detailData.EFFEC_WATER = ''
        detailData.WATER_TANK = ''
        detailData.GROUND_TANK = ''
        searchParams.BSNS_NM =  ''
      }
      // console.log('res',res)
    })
    onSubGridButtonsClick({ id :'btnSearch' })
  } 
  else if (btn.id === 'btnCreate') { // 추가
    if(!searchParams.UPDATE_STATE){
      return Message.warn(t('건물을 선택해주세요.'))
    }else{
      addData()
    }
  } 
  else if (btn.id === 'btnUpdate') { // 저장
    // if(!searchParams.UPDATE_STATE){
    //   return Message.warn(t('건물을 선택해주세요.'))
    // }else{
    saveDetailData()
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeGridSave)
      .setQuery(saveGridData)
      .setAfter(() => { onMainButtonsClick({ id :'btnSearch' }) })
      .run()
    onSubGridButtonsClick({ id :'btnSearch' })
    // }
  }
  else if (btn.id === 'btnDelete') {  // 삭제
    new deleteFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(DelMainCheck)
      .setQuery(MainDelData)
      .setAfter(() => { onMainButtonsClick({ id :'btnSearch' }) })
      .run();
  }
  else if (btn.id === 'btnPrint') {  // 삭제
    onOzPrint()
  }
}

// 펌프실 굥유 건물 (서브)그리드버튼
const onSubGridButtonsClick = btn => {

if (btn.id === 'btnSearch') {  // 조회
 
  Promise.all([
      commonSearchApi({
        queryId: "SPPBC0010_SEARCH_03",
        param: searchParams,
      }), // 공유건물
    ]).then((res)=>{
      // grdSub.value.getDataProvider().setRows([])
      // console.log('res[0].ORESULT_CUR',res[0].ORESULT_CUR)
      grdSub.value.getDataProvider().setRows(res[0].ORESULT_CUR)
    })
} 
else if (btn.id === 'btnCreate') { // 추가
  if(!searchParams.UPDATE_STATE){
      return Message.warn(t('건물을 선택해주세요.'))
    }else{
      addSubData()
    }
} 
else if (btn.id === 'btnUpdate') { // 저장
  new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore()
      .setQuery(saveSubGridData)
      .setAfter(() => { onSubGridButtonsClick({ id :'btnSearch' }) })
      .run()
    
}
else if (btn.id === 'btnDelete') {  // 삭제
  new deleteFlowHelper(vm, t)
    .setGridList([grdSub])
    .setBefore(DelSubCheck)
    .setQuery(SubDelData)
    .setAfter(() => { onSubGridButtonsClick({ id :'btnSearch' }) })
    .run();
}
}


/******** 버튼 작동 구간 *********/


/* ---------- 메인 데이터 조회 ---------- */
const searchData = () => {
  return commonSearchApi({
    queryId: "SPPBC0010_SEARCH_01",
    param: searchParams,
  })
}
/* ---------- 펌프실 공유 건물 조회 ---------- */
const searchSubData = () => {
  return commonSearchApi({
    queryId: "SPPBC0010_SEARCH_03",
    param: searchParams,
  })
}

const afterSearch = res => {
  // console.log('afterSearch',res)
}

/* ---------- 추가 ---------- */
const addData = () => {
    // console.log('행 추가')
    
    let newRow = {
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_NM: searchParams.BSNS_NM,
      BSNS_CD: searchParams.BSNS_CD,
      BUILDING_NAME: searchParams.BUILDING_NAME,
      BUILDING_NO: searchParams.BUILDING_NO,
      DONG_NAME: searchParams.DONG_NAME,
    }

    grdMain.value.getDataProvider().insertRow(0, newRow)
    grdMain.value.getGridView().setFocus(0)
    grdMain.value.getGridView().checkRow(0, true, false, false)
    console.log('now focused',grdMain.value.getFocusedRowData())
  // 트리뷰 방식 열 추가
  // if(!gridState.parent){
  // // 최상단 노드 추가
  // grdMain.value.getDataProvider().addChildRow(0
  // ,{  
  //   CMPNY_DIV: userStore.cmpnyDiv,
  //   TREE_NM: "사업부 : "+searchParams.BSNS_NM,
  //   TREE_ID: searchParams.BSNS_CD,
  //   TREE_STAIR: '1',
  //   BSNS_CD: searchParams.BSNS_CD,
  // },-1,true)
  // grdMain.value.getDataProvider().addChildRow(1
  // ,{  
  //   CMPNY_DIV: userStore.cmpnyDiv,
  //   TREE_NM: "건물명 : "+searchParams.BUILDING_NAME,
  //   TREE_ID: searchParams.BSNS_CD +'.'+ searchParams.BUILDING_NO,
  //   TREE_STAIR: '2',
  //   BSNS_CD: searchParams.BSNS_CD,
  //   BUILDING_NO: searchParams.BUILDING_NO,
  // },-1,true)
  // gridState.parent = true
  // } 
  //   grdMain.value.getDataProvider().addChildRow(2
  // ,{  
  //     CMPNY_DIV: userStore.cmpnyDiv,
  //     BSNS_NM: searchParams.BSNS_NM,
  //     BSNS_CD: searchParams.BSNS_CD,
  //     BUILDING_NAME: searchParams.BUILDING_NAME,
  //     TREE_STAIR: '3',
  //     TREE_ID: searchParams.BSNS_CD +'.'+ searchParams.BUILDING_NO+'.'+searchParams.DONG_NAME,
  //     BUILDING_NO: searchParams.BUILDING_NO,
  //     DONG_NAME: searchParams.DONG_NAME,
  //  })
  // grdMain.value.getGridView().expandAll()
}

/* ---------- 서브 그리드 추가 ---------- */
const addSubData = () => {
  grdSub.value.addRow({
      BUILDING_NAME:'',
      CMPNY_DIV: userStore.cmpnyDiv,
      BSNS_CD: searchParams.BSNS_CD,
      BUILDING_NAME_MAIN: searchParams.BUILDING_NAME,
      BUILDING_NO: searchParams.BUILDING_NO,
      PREVI_VAL: '',
    })
}
// 그리드 데이터 저장 전
const beforeGridSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {

    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if (!data.PUMP_NAME) {
      return Message.warn(t('펌프명을 입력해주세요.'))
    }
  }
  

  return true
}
// 그리드 데이터 저장
const saveGridData = () => {
  let saveParams = []
  
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    data.USER_ID = userStore.userId // USER_ID
    saveParams.push(data)
  }
  console.log('saveParams',saveParams) 
  return commonExecuteApi({ queryId : 'SPPBC0010_SAVE_02', list: saveParams })
}

// 서브 그리드 데이터 저장
const saveSubGridData = () => {
  let saveParams = []
  
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)

    data.USER_ID = userStore.userId // USER_ID
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'SPPBC0010_SAVE_03', list: saveParams })
}

// 펌프실 세부 데이터 저장
const saveDetailData = () => {
  let saveParams = []
  let data = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: searchParams.BSNS_CD,
    BUILDING_NO: searchParams.BUILDING_NO,
    PUMP_LOC: detailData.PUMP_LOC,
    PUMP_DTL_LOC: detailData.PUMP_DTL_LOC,
    EFFEC_WATER: detailData.EFFEC_WATER,
    WATER_TANK: detailData.WATER_TANK,
    GROUND_TANK:detailData.GROUND_TANK,
    ROOFTOP_WATER:detailData.ROOFTOP_WATER,
    USER_ID: userStore.userId,
  }
  saveParams.push(data)
  // console.log('저장 파라미터 ::: ', saveParams)
  commonExecuteApi({ queryId : 'SPPBC0010_SAVE_01', list: saveParams })
}

// 펌프실 데이터 삭제 전
const DelMainCheck = async () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // console.log(checkedRows, "checkedRows");
  if(checkedRows.length === 0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false;
  }
  return true;
}
// 펌프실 데이터 삭제
const MainDelData = async () => {
  let delParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    delParams.push(data)
  }
  // console.log('삭제 파라미터 333 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SPPBC0010_DELETE_01",
    list: delParams,
  })
}


// 펌프실 공유건물  삭제 전
const DelSubCheck = async () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  // console.log(checkedRows, "checkedRows");
  if(checkedRows.length === 0){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false;
  }
  return true;
}
// 펌프실 공유건물  삭제
const SubDelData = async () => {
  let delParams = []

  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)

    delParams.push(data)
  }
  return commonExecuteApi({
    queryId: "SPPBC0010_DELETE_02",
    list: delParams,
  })
}
// 서브 조회 팝업 오픈
const onCellItemClicked = (grid, index, col) => {
  // console.log(index)
  const selectRow = grdSub.value.getRowData(index.dataRow)
  if(col.target.classList[0]==="mdi"){
    if(selectRow.PREVI_VAL ===''){
      rSPPBC0010Popup.value.openPopup({
        CMPNY_DIV : userStore.cmpnyDiv,
        BSNS_CD : searchParams.BSNS_CD,
        // BUILDING_NAME : searchParams.BUILDING_NAME,
        // DONG_NAME : searchParams.DONG_NAME,   
      })
      type = 'sub'
    } 
  }
}

// 셀 더블클릭 시 선택한 행의 건물 정보로 조회 
const onCellDblClicked = (grid, clickData) => {
  // console.log('clickData', clickData)
  // const gridDataJson = grdMain.value.getDataProvider().getJsonRows()
  // console.log('전체 gridDataJson', gridDataJson)
  // if(clickData.cellType === "data"){
  //   let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  //   console.log('dblClick data', data)
  //   searchParams.BUILDING_NO = data.BUILDING_NO
  //   searchParams.BUILDING_NAME = data.BUILDING_NAME
  //   searchParams.DONG_NAME = data.DONG_NAME
    
  //   onMainButtonsClick({id: 'btnSearch'})
  //   onSubGridButtonsClick({id: 'btnSearch'})
  // }
} 

/* ---------- 팝업 ---------- */
// 메인 조회 팝업 오픈
const openPopup = () => {
  rSPPBC0010Popup.value.openPopup({
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD : searchParams.BSNS_CD,
    BUILDING_NAME : searchParams.BUILDING_NAME,
    // DONG_NAME : searchParams.DONG_NAME,   
  })
  type = 'main'
}
// 팝업 선택 이벤트
const getData = val => {
  // console.log('type',type)
  if(type === 'main'){
    searchParams.BUILDING_NAME = val.BUILDING_NAME
    searchParams.BUILDING_NO = val.BUILDING_NO
    searchParams.DONG_NAME = val.DONG_NAME
    searchParams.UPDATE_STATE = true
    onMainButtonsClick({id:'btnSearch'})
  }else if(type === 'sub'){
    const selectedRow = grdSub.value.getFocusedRowData().FOCUSED_ROW_IDX
    // console.log('selectedRow',selectedRow)
    // 공유 건물 이름
    grdSub.value.getDataProvider().setValue(selectedRow,'BUILDING_NAME',val.BUILDING_NAME)
    // 공유 건물 동이름
    grdSub.value.getDataProvider().setValue(selectedRow,'DONG_NAME',val.DONG_NAME)
    // 공유 건물 번호
    grdSub.value.getDataProvider().setValue(selectedRow,'BUILDING_NO_SUB',val.BUILDING_NO)
  }
}

const clear = () => {
  searchParams.BUILDING_NAME = ''
  searchParams.BUILDING_NO = ''
  searchParams.DONG_NAME = ''
  detailData.PUMP_LOC = ''
  detailData.PUMP_DTL_LOC = ''
  detailData.ROOFTOP_WATER = ''
  detailData.EFFEC_WATER = ''
  detailData.WATER_TANK = ''
  detailData.GROUND_TANK = ''
  searchParams.UPDATE_STATE = false
}

//교육차수 로우 변경 이벤트

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        title="펌프실 관리"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnPrint']"
        @click-button="onMainButtonsClick"
      />
    </v-card-title>
      <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
    <div class="d-flex flex-column fill-height">
      <v-sheet style="display: flex; flex-direction: row;">
        <v-sheet width="50%" style="padding-right: 5px;">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex ">
              <!--  사업부 -->
                <i-select
                  v-model="searchParams.BSNS_CD"
                  :label="$t('사업부')"
                  width="35%"
                  :items="codeList.bsnsCd"
                  item-value="BSNS_CD"
                  item-title="BSNS_NM"
                  @update:modelValue="clear()"
                />
              <!-- 건물명 -->
                <ILabel
                  :label="$t('건물명')"
                  style="width: 40%;"
                >
                  <template #editor="editorProps">
                    <VTextField
                      v-model="searchParams.BUILDING_NAME"
                      @keydown.enter="openPopup()"
                      :readonly=false
                    >
                      <template v-slot:append-inner>
                        <v-icon
                          icon="mdi-magnify"
                          @click="openPopup()"
                        />
                        <v-icon
                          icon="mdi-close-box-outline"
                          @click="clear()"
                        />
                      </template>
                    </VTextField>
                  </template>      
                </ILabel>
              <!-- 동명 -->
                <ILabel
                  :label="$t('동명')"
                  style="width: 25%;"
                >
                  <template #editor="editorProps">
                    <VTextField
                      v-model="searchParams.DONG_NAME"
                      :readonly=true
                    />
                  </template>      
                </ILabel>
            </div>
          </v-sheet>
          <v-sheet class="searchArea flex-column">
            <p style="font-weight: bold; font-size: large; color: black;">
              펌프실 상세정보</p>
                  <!-- 펌프실 위치 -->
              <div class="d-flex" style="margin-bottom: 8px;">
                    <ILabel
                      :label="$t('펌프실 위치')"
                      style="width: 50%;"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="detailData.PUMP_LOC"
                        />
                      </template>      
                    </ILabel>
                 
                    <ILabel
                      :label="$t('세부위치')"
                      style="width: 50%;"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="detailData.PUMP_DTL_LOC"
                        />
                      </template>      
                    </ILabel>
              </div>
                <!-- 옥상수원 -->
              <div style="display: flex; justify-content: space-between;">
                <div style="display: flex;">
                  <i-select
                    v-model="detailData.ROOFTOP_WATER"
                    :label="$t('옥상수원')"
                    :items="codeList.roofTop"
                    labelWidth="85px"
                    width="200px"
                    marginBetween="0px"
                    item-value="COD"
                    item-title="TXT"
                    style="padding-left: 14px;"
                  />
                  <ILabel
                    :label="$t('유효수원')"
                    style="width: 185px;"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        v-model="detailData.EFFEC_WATER"
                        suffix="톤"
                      />
                    </template>
                  </ILabel>
                </div>
                <div style="display: flex;">
                  <i-select
                    v-model="detailData.WATER_TANK"
                    :items="codeList.waterTank"
                    item-value="COD"
                    item-title="TXT"
                    margin="15px"
                    width="165px"
                  />
                  <i-select
                    v-model="detailData.GROUND_TANK"
                    :items="codeList.groundTank"
                    item-value="COD"
                    item-title="TXT"
                    width="165px"
                    margin="15px"
                  />          
                </div>
              </div>
              </v-sheet>
        </v-sheet>
        <v-sheet width="50%" >
          <VForm class="searchArea">
          <IGridTitle 
            style="margin-bottom: 0px;"
            title="펌프실 공유건물"
            :button-list="[ 'btnCreate', 'btnUpdate', 'btnDelete']"
            @click-button="onSubGridButtonsClick"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdSub"
            class="mt-2"        
            style="height: 131px;"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys" 
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
            @onCellItemClicked="onCellItemClicked"
          />
          </VForm>
        </v-sheet>
      <!-- 펌프실 관리화면 조회 목록 -->
      </v-sheet>
      
      <v-sheet class="h-auto">
        <IGridTitle title="펌프실 관리화면 조회 목록">
          <template #editors />
        </IGridTitle>
        <RealGrid
          ref="grdMain"
          class="mt-2"
          :is-tree="false"
          :gridViewOption="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys" 
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          @onCellDblClicked="onCellDblClicked"
        />
      </v-sheet>
    </div>
      <!-- 펌프실 관리화면 조회 목록 -->
    </v-card-text>
  </v-card>
   <!-- 건물명 팝업 -->
   <SPPBC0010Popup ref="rSPPBC0010Popup" @selected="getData"/>
   <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
    <!-- <DeptPopup
      ref="deptPopup"
      @selected="onDeptSelected"
    />   -->
    

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
    min-height: 700px;
  }
}

</style>