<!--
  화면명 : 법정 안전보건교육 대상자 관리
  화면개요 : 근로자 정기안전보건교육, 관리감독자 정기안전보건교육 지급중단 조회 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from "@hiway/stores/logs"
import { commonSearchApi, getCodeList, commonExecuteApi, commonExecuteApi2 } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import dayjs from 'dayjs'

defineOptions({
  name: '60_edu-EDU_A-EDUAA0050',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t //다국어
const menuTitle = ref(null)
const gridTitle = ref(null)
const gridTitle2 = ref(null)  // 2024.02.29 박용훈 추가 기존에 하나만 사용 했는데 텝이 2개가 있어서 마지막꺼만 나옴.
const grdMain1 = ref(null)
const grdMain2 = ref(null)
const userStore = useUserStore()
//const searchArea = ref(null)
const tab = ref('tab')

//코드리스트 세팅 
const codeList = reactive({
  QUARTER: [{ COD : '1', TXT : '1분기' },{ COD : '2', TXT : '2분기' },{ COD : '3', TXT : '3분기' },{ COD : '4', TXT : '4분기' }],
  BSNS: [],
  DEPT1: [{ TXT: '전체', COD: '' }],
  DEPT2: [{ TXT: '전체', COD: '' }],
  ORGN_DIV: [{ COD : 'A', TXT : '직영' },{ COD : 'B', TXT : '협력사' }],
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR1: dayjs().get("year"),  
  QUARTER: '',
  BSNS1: '',
  DEPT1: '',
  YEAR2: dayjs().get("year"),  
  BSNS2: [],
  DEPT2: 'init',
  TARGET_YN1: '',
  TARGET_YN2: '',
  DISPATCH_YN: '',
  ORGN_DIV: '',
  USER_ID: userStore.userId,
  USE_DIV: 'N',
})

//그리드 속성셋팅
const grdMainProps1 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' }, checkBar: { visible: true }, stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('소속') }, styleName: 'left-column', editable: false, width: '150'  },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false, width: '80' },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사번') }, editable: false, width: '80'  },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') }, editable: false, width: '60'  },
    { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직구분') }, editable: false, width: '60'  },
    { fieldName: 'TARGET_YN', dataType: 'text', header: { text: t('사무직 교육대상') }, styleName: 'editable_column orange-column', renderer: { type: "check", trueValues: "Y", falseValues: "N" }, width: '60' 
    , styleCallback: function(grid, dataCell){
        // 2024.08.21 박용훈 입과완료 여부가 Y인 경우 사무직 교육대상, 교육제외 비고 수정이 안되도록 기능 수정
        var ret = {}
        var cfmYn = grid.getValue(dataCell.index.itemIndex, "CFM_YN")

        if(cfmYn == 'Y'){
          ret.renderer = {type: "check", editable: false}
          ret.editable = false
          ret.styleName = 'center-column'
        }
        return ret;
      },
    },
    { fieldName: 'EXCLUSION_YN', dataType: 'text', header: { text: t('교육제외') }, styleName: 'editable_column', renderer: { type: "check", trueValues: "Y", falseValues: "N" }, width: '30'
    , styleCallback: function(grid, dataCell){
        // 2024.08.21 박용훈 입과완료 여부가 Y인 경우 사무직 교육대상, 교육제외 비고 수정이 안되도록 기능 수정
        var ret = {}
        var cfmYn = grid.getValue(dataCell.index.itemIndex, "CFM_YN")

        if(cfmYn == 'Y'){
          ret.renderer = {type: "check", editable: false}
          ret.editable = false
          ret.styleName = 'center-column'
        }

        return ret;
      },
    },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, editor: { type: "line", maxLength: 1000 }, styleName: 'editable_column left-column', width: '100'
    , styleCallback: function(grid, dataCell){
        // 2024.08.21 박용훈 입과완료 여부가 Y인 경우 사무직 교육대상, 교육제외 비고 수정이 안되도록 기능 수정
        var ret = {}
        var cfmYn = grid.getValue(dataCell.index.itemIndex, "CFM_YN")

        if(cfmYn == 'Y'){
          ret.editable = false
          ret.styleName = 'left-column'
        }
        return ret;
      },
    },
    { fieldName: 'CFM_YN', dataType: 'text', header: { text: t('입과완료여부') }, editable: false, width: '30'  },
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('성명') }, editable: false, width: '60'  },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('등록/수정일시') }, editable: false, width: '60'  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false  },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, visible: false  },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD') }, visible: false  },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', header: { text: t('HLD_OFFI_GBN') }, visible: false  },
    { fieldName: 'TARGET_DIV', dataType: 'text', header: { text: t('TARGET_DIV') }, visible: false  },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, visible: false  },
    { fieldName: 'MNTH', dataType: 'text', header: { text: t('MNTH') }, visible: false  },
    { fieldName: 'CFM_USER_NM', dataType: 'text', header: { text: t('입과완료처리자') }, visible: false  },
    { fieldName: 'CFM_USER_DATE', dataType: 'text', header: { text: t('입과완료처리일') }, visible: false  },
  ],
  columns: [],
  columnLayout: [
    'ASGN_FULL_NM',
    'JOB_TIT_NM',
    'TARGET_ID',
    'TARGET_NM',
    'HLD_OFFI_GBN_NM',
    'TARGET_YN',
    'EXCLUSION_YN',
    'REMARK',
    'CFM_YN',
    {
      name: '등록/최종수정일자',
      direction: 'horizontal',
      items: [ 'UPDATE_USER_NM', 'UPDATE_DATE' ],
      header: { text: t('등록/최종수정일자') },
    },
  ],
})

const grdMainProps2 = reactive({
  gridViewOption : { display: { selectionStyle : 'singleRow' }, checkBar: { visible: true }, stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('소속') }, styleName: 'left-column', editable: false, width: '130'  },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false, width: '80' },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사번') }, editable: false, width: '80'  },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') }, editable: false, width: '60'  },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책') }, editable: false, width: '60'  },
    { fieldName: 'OFFI_RES_DATE', dataType: 'text', header: { text: t('직책보임일자') }, editable: false, width: '60'  },
    { fieldName: 'HLD_OFFI_GBN_NM', dataType: 'text', header: { text: t('재직구분') }, editable: false, width: '30'  },
    { fieldName: 'TARGET_YN', dataType: 'text', header: { text: t('교육대상') }, styleName: 'editable_column', renderer: { type: "check", trueValues: "Y", falseValues: "N" }, width: '30'  },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, editor: { type: "line", maxLength: 1000 }, styleName: 'editable_column-left', width: '150'  },
    { fieldName: 'UPDATE_USER_NM', dataType: 'text', header: { text: t('성명') }, editable: false, width: '60'  },
    { fieldName: 'UPDATE_DATE', dataType: 'text', header: { text: t('등록/수정일시') }, editable: false, width: '60'  },
    { fieldName: 'OFFI_RES_CD', dataType: 'text', header: { text: t('OFFI_RES_CD') }, visible: false  },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', header: { text: t('HLD_OFFI_GBN') }, visible: false  },
    { fieldName: 'JOB_TIT_CD', dataType: 'text', header: { text: t('JOB_TIT_CD') }, visible: false  },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false  },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, visible: false  },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD') }, visible: false  },
    { fieldName: 'TARGET_DIV', dataType: 'text', header: { text: t('TARGET_DIV') }, visible: false  },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('YEAR') }, visible: false  },
    { fieldName: 'MNTH', dataType: 'text', header: { text: t('MNTH') }, visible: false  },
  ],
  columns: [],
  columnLayout: [
    'ASGN_FULL_NM',
    'JOB_TIT_NM',
    'TARGET_ID',
    'TARGET_NM',
    'OFFI_RES_NM',
    'OFFI_RES_DATE',
    'HLD_OFFI_GBN_NM',
    'TARGET_YN',
    'REMARK',
    {
      name: '등록/최종수정일자',
      direction: 'horizontal',
      items: [ 'UPDATE_USER_NM', 'UPDATE_DATE' ],
      header: { text: t('등록/최종수정일자') },
    },
  ],
})

// 그리드 세팅
grdMainProps1.columns = grdMainProps1.fields
grdMainProps2.columns = grdMainProps2.fields

//콤보박스 셋팅
const initCombo = () => {
  //담당 가능 과목, 강의 이력 데이터 바인딩
  Promise.all([
    getCodeList('HHID010'),
  ]).then(res => { 
  })
  //사업부 설정
  commonSearchApi({ queryId : 'searchBSNS', param: searchParams }).then(res => {
    codeList.BSNS.push({ TXT: '전체', COD: '' })
    res.ORESULT_CUR.forEach(element => {
      codeList.BSNS.push({ TXT: element.BSNS_NM, COD: element.BSNS_CD })
    })
  })
  searchParams.BSNS1 = userStore.bsnsCd
  searchParams.BSNS2.push(userStore.bsnsCd)
  searchParams.ORGN_DIV = userStore.userDiv

  //부서설정
  updateBSNS1()
  searchParams.DEPT1 = userStore.deptCd  

  //분기설정
  let month = dayjs().get("months")
  if( month < 3 ){
    searchParams.QUARTER = '1'
  } else if( month < 6 ){
    searchParams.QUARTER = '2'
  } else if( month < 9 ){
    searchParams.QUARTER = '3'
  } else{
    searchParams.QUARTER = '4'
  }

  //tab1 버튼 설정
  let btnItems = gridTitle.value.getButtonItems()
  
  btnItems[1].text = '전 분기 복사'   
  btnItems[2].text = '입과완료' 
  btnItems[3].text = '완료취소' 
}

//사업부 변경 이벤트(탭1)
const updateBSNS1 = () =>{
  codeList.DEPT1 = []
  searchParams.DEPT1 = ''
  codeList.DEPT1.push({ TXT: '전체', COD: '' })

  commonSearchApi({ queryId : 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS1 } }).then(res => {
    res.ORESULT_CUR.forEach(element => {
      codeList.DEPT1.push({ TXT: element.DEPT_NM, COD: element.DEPT_CD })
    })
  })
  gridRefresh()
}

//사업부 변경 이벤트(탭2)
const updateBSNS2 = () =>{
  if(searchParams.BSNS2.includes('') && searchParams.BSNS2[searchParams.BSNS2.length - 1] === ''){
    searchParams.BSNS2 = ['']
  }else if(searchParams.BSNS2.includes('') && searchParams.BSNS2[0] === ''){
    searchParams.BSNS2.shift()
  }

  codeList.DEPT2 = []
  searchParams.DEPT2 = ''
  codeList.DEPT2.push({ TXT: '전체', COD: '' })

  if(searchParams.BSNS2.length === 1){
    if(searchParams.BSNS2[0] != ''){
      commonSearchApi({ queryId : 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS2[0] } }).then(res => {
        res.ORESULT_CUR.forEach(element => {
          codeList.DEPT2.push({ TXT: element.DEPT_NM, COD: element.DEPT_CD })
        })
      })
    }
  }
  gridRefresh()
}

watch(tab, (e) => {
  selectedChanged(e)
})

//탭변경 이벤트
const selectedChanged = tab => {
  
  if(tab === 'tab1'){

  }  
  else{    
    if(searchParams.DEPT2 ==='init'){
      onButtonsClickMenu({ id :'btnSearch' })
      let btnItems = gridTitle2.value.getButtonItems()
      btnItems[1].text = '전 년도 복사'
      searchParams.DEPT2 = userStore.deptCd
    }

    //부서설정
    let dept = searchParams.DEPT2
    updateBSNS2() 
    searchParams.DEPT2 = dept
  }  
}

//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//조회 실행
const searchMainData1 = id => {  
  let searchParam = {
    CMPNY_DIV 	 : searchParams.CMPNY_DIV,
    YEAR			   : searchParams.YEAR1,
    QUARTER		   : searchParams.QUARTER,
    BSNS_CD		   : searchParams.BSNS1,
    DEPT_CD		   : searchParams.DEPT1,
    HLD_OFFI_GBN : searchParams.DISPATCH_YN,
    TARGET_DIV   : 'A',
    TARGET_YN	   : searchParams.TARGET_YN1,
    ORGN_DIV     : '',
  }

  return commonSearchApi({ queryId : 'EDUAA0050_SEARCH_01', param: searchParam })
}

const searchMainData2 = id => {  
  let searchParam = {
    CMPNY_DIV 	 : searchParams.CMPNY_DIV,
    YEAR			   : searchParams.YEAR2,
    BSNS_CD		   : searchParams.BSNS2.join(','),
    DEPT_CD		   : searchParams.DEPT2,
    QUARTER      : '1',
    HLD_OFFI_GBN : '',
    TARGET_DIV   : 'B',
    TARGET_YN	   : searchParams.TARGET_YN2,
    ORGN_DIV     : searchParams.ORGN_DIV,
  }

  return commonSearchApi({ queryId : 'EDUAA0050_SEARCH_01', param: searchParam })
}

const gridRefresh = () => {
  if(tab.value === 'tab1'){
    grdMain1.value.getDataProvider().setRows([])
  }else{
    grdMain2.value.getDataProvider().setRows([])
  }
}

//조회 후
const afterMainSearch1 = res => {
  grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR)

}

const afterMainSearch2 = res => {
  grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onButtonsClickMenu = async btn => {
  if(btn.id === 'btnSearch' ){
    if(tab.value === 'tab1'){
      new queryFlowHelper(vm, t)
        .setGridList([grdMain1])
        //.setSearchArea(searchArea)
        .setBefore(beforeSearch)
        .setQuery(searchMainData1)
        .setAfter(afterMainSearch1)
        .run()    
    }  
    else{
      new queryFlowHelper(vm, t)
        .setGridList([grdMain2])
        //.setSearchArea(searchArea)
        .setBefore(beforeSearch)
        .setQuery(searchMainData2)
        .setAfter(afterMainSearch2)
        .run()   
    }
  }  
}

const validationChk = async () => {
  return true
}

const afterSave = () => {
  if(tab.value === 'tab1'){
    let searchParam = {
    CMPNY_DIV 	 : searchParams.CMPNY_DIV,
    YEAR			   : searchParams.YEAR1,
    QUARTER		   : searchParams.QUARTER,
    BSNS_CD		   : searchParams.BSNS1,
    DEPT_CD		   : searchParams.DEPT1,
    HLD_OFFI_GBN : searchParams.DISPATCH_YN,
    TARGET_DIV   : 'A',
    TARGET_YN	   : searchParams.TARGET_YN1,
    ORGN_DIV     : '',
  }
    commonSearchApi({ queryId : 'EDUAA0050_SEARCH_01', param: searchParam }).then(res => {
      grdMain1.value.getDataProvider().setRows([])
      if(res.ORESULT_CUR.length > 0){
        grdMain1.value.getDataProvider().setRows(res.ORESULT_CUR)
      }
    })
  }else{
    let searchParam = {
    CMPNY_DIV 	 : searchParams.CMPNY_DIV,
    YEAR			   : searchParams.YEAR2,
    BSNS_CD		   : searchParams.BSNS2.join(','),
    DEPT_CD		   : searchParams.DEPT2,
    QUARTER      : '1',
    HLD_OFFI_GBN : '',
    TARGET_DIV   : 'B',
    TARGET_YN	   : searchParams.TARGET_YN2,
    ORGN_DIV     : searchParams.ORGN_DIV,
  }
    commonSearchApi({ queryId : 'EDUAA0050_SEARCH_01', param: searchParam }).then(res => {
      grdMain2.value.getDataProvider().setRows([])
      if(res.ORESULT_CUR.length > 0){
        grdMain2.value.getDataProvider().setRows(res.ORESULT_CUR)
      }
    })
  }
}

const saveMainData1 = () => {
  let saveRows = grdMain1.value.getGridView().getCheckedRows(true)
  if(saveRows.length === 0) return

  let saveList = []
  for(let i = 0; i < saveRows.length; i++){
    let grdJsonRow = grdMain1.value.getDataProvider().getJsonRow(saveRows[i])
    grdJsonRow.CMPNY_DIV = userStore.cmpnyDiv
    grdJsonRow.USER_ID = userStore.userId
    saveList.push(grdJsonRow)
  }  

  return commonExecuteApi({ queryId : 'EDUAA0050_SAVE_01', list: saveList })
}

const saveMainData2 = () => {
  let saveRows = grdMain2.value.getGridView().getCheckedRows(true)
  if(saveRows.length === 0) return

  let saveList = []
  for(let i = 0; i < saveRows.length; i++){
    let grdJsonRow = grdMain2.value.getDataProvider().getJsonRow(saveRows[i])
    grdJsonRow.CMPNY_DIV = userStore.cmpnyDiv
    grdJsonRow.USER_ID = userStore.userId
    saveList.push(grdJsonRow)
  }  

  return commonExecuteApi({ queryId : 'EDUAA0050_SAVE_01', list: saveList })
}

const saveMainCopy1 = () => {
  
  let saveList = {
    CMPNY_DIV : userStore.cmpnyDiv,
    TARGET_DIV : 'A',
    YEAR : searchParams.YEAR1,
    QUARTER : searchParams.QUARTER,
    BSNS_CD : searchParams.BSNS1,
    DEPT_CD : searchParams.DEPT1,
    USER_ID : userStore.userId,
  }

  return commonExecuteApi({ queryId : 'EDUAA0050_TAB01_SAVE_01', list: [saveList] })
}

const saveMainCopy2 = () => {
  
  let saveList = {
    CMPNY_DIV : userStore.cmpnyDiv,
    TARGET_DIV : 'B',
    YEAR : searchParams.YEAR2,
    BSNS_CD : searchParams.BSNS2.join(','),
    DEPT_CD : searchParams.DEPT2,
    USER_ID : userStore.userId,
  }

  return commonExecuteApi({ queryId : 'EDUAA0050_TAB02_SAVE_01', list: [saveList] })
}

const saveMainConfirm1 = () => {
  
  let saveList = {
    CMPNY_DIV : userStore.cmpnyDiv,
    TARGET_DIV : 'A',
    YEAR : searchParams.YEAR1,
    QUARTER : searchParams.QUARTER,
    USER_ID : userStore.userId,
  }

  return commonExecuteApi({ queryId : 'EDUAA0050_TAB01_SAVE_02', list: [saveList] })
}

const saveMainConfirmCancel1 = () => {
  
  let saveList = {
    CMPNY_DIV : userStore.cmpnyDiv,
    TARGET_DIV : 'A',
    YEAR : searchParams.YEAR1,
    QUARTER : searchParams.QUARTER,
    USER_ID : userStore.userId,
  }

  return commonExecuteApi({ queryId : 'EDUAA0050_TAB01_SAVE_03', list: [saveList] })
}

const onButtonsClickTab1 = async btn => {
  if(btn.id === 'btnUpdate' ){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain1, row: 'check' }])
      .setGridList([grdMain1])
      .setBefore(validationChk)
      .setQuery(saveMainData1)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id === 'btnCopy' ){
    let bsns = ''
    let dept = ''
    codeList.BSNS.forEach(element => {
      if(element.COD === searchParams.BSNS1){
        bsns = element.TXT
      }
    })
    codeList.DEPT1.forEach(element => {
      if(element.COD === searchParams.DEPT1){
        dept = element.TXT
      }
    })
    new saveFlowHelper(vm, t)
      .setGridList([grdMain1])
      .setConfirmMessage('사업부 : '+bsns+', 부서 : '+dept+' 의 직전 분기 데이터를 복사합니다.\n\n현재 데이터가 있으면 삭제 후 복사 됩니다.\n\n진행하시겠습니까?')
      .setBefore(validationChk)
      .setQuery(saveMainCopy1)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id === 'btnConfirm'){    
    new saveFlowHelper(vm, t)
      .setGridList([grdMain1])
      .setConfirmMessage(searchParams.YEAR1+'년도 '+searchParams.QUARTER+'분기 전체사업부 교육대상 대해서 입과완료 처리합니다.\n\n진행하시겠습니까?')
      .setBefore(validationChk)
      .setQuery(saveMainConfirm1)
      .setAfter(afterSave)
      .run()
  }
  else{
    new saveFlowHelper(vm, t)
      .setGridList([grdMain1])
      .setConfirmMessage(searchParams.YEAR1+'년도 '+searchParams.QUARTER+'분기 전체사업부 입과완료 대상에 대해서 입과취소 처리를 합니다.\n\n진행하시겠습니까?')
      .setBefore(validationChk)
      .setQuery(saveMainConfirmCancel1)
      .setAfter(afterSave)
      .run()
  }
}

const onButtonsClickTab2 = async btn => {
  if(btn.id === 'btnUpdate' ){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain2, row: 'check' }])
      .setGridList([grdMain2])
      .setBefore(validationChk)
      .setQuery(saveMainData2)
      .setAfter(afterSave)
      .run()
  }
  else{
    let bsns = ''
    let dept = ''
    console.log('체크', searchParams.BSNS2, codeList.BSNS)
    codeList.BSNS.forEach(element => {
      if(searchParams.BSNS2.includes(element.COD)){
        bsns += element.TXT + ' ' 
      }
    })
    codeList.DEPT1.forEach(element => {
      if(element.COD === searchParams.DEPT2){
        dept = element.TXT
      }
    })
    new saveFlowHelper(vm, t)
      .setGridList([grdMain2])
      .setConfirmMessage('사업부 : '+ bsns +', 부서 : '+dept+' 의 전년도 데이터를 복사합니다.\n\n현재 데이터가 있으면 삭제 후 복사 됩니다.\n\n진행하시겠습니까?')
      .setBefore(validationChk)
      .setQuery(saveMainCopy2)
      .setAfter(afterSave)
      .run()
  }
}

onMounted(() => {
  vm.$nextTick(() => {
    initCombo()  
    onButtonsClickMenu({ id :'btnSearch' })
  })  
})
</script>

<template>
  <v-card class="pa-3 fill-height">
    <!-- 타이틀 영역 
          타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClickMenu"
      />
      <!-- tab -->
      <v-sheet class="mb-2">
        <v-tabs v-model="tab">
          <v-tab value="tab1">근로자 정기안전보건교육</v-tab>
          <v-tab value="tab2">관리감독자 정기안전보건교육</v-tab>
        </v-tabs>
      </v-sheet>
    </v-card-title>
    <v-card-text v-show="tab == 'tab1'" class="pa-2 pt-0 content-area">
      <!-- 조회조건 -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-input
              :label="$t('년도')"
              v-model="searchParams.YEAR1"
              type="Number"
              labelWidth="26px"
              width="200px"
              @update:model-value="gridRefresh()"
            />
            <i-select
              :label="$t('분기')"
              v-model="searchParams.QUARTER"
              :items="codeList.QUARTER"
              item-title="TXT"
              item-value="COD"
              labelWidth="26px"
              width="200px"
              @update:model-value="gridRefresh()"
            />
            <i-select
              :label="$t('사업부')"
              v-model="searchParams.BSNS1"
              :items="codeList.BSNS"
              item-title="TXT"
              item-value="COD"
              @update:modelValue="updateBSNS1"
              labelWidth="39px"
              width="200px"
            />
            <i-select
              :label="$t('부서')"
              v-model="searchParams.DEPT1"
              :items="codeList.DEPT1"
              item-title="TXT"
              item-value="COD"
              labelWidth="26px"
              width="200px"
              @update:model-value="gridRefresh()"
            />
            <v-checkbox style="margin-right:20px"
              v-model="searchParams.TARGET_YN1"                              
              :label="$t('교육대상자만 조회')" 
              true-value="Y" 
              false-value="N"
              @update:model-value="gridRefresh()"
            />
            <v-checkbox
              v-model="searchParams.DISPATCH_YN"                              
              :label="$t('파견,휴직자만 조회')" 
              true-value="2" 
              false-value=""
              @update:model-value="gridRefresh()"
            />
          </div>
        </v-sheet>
        <!-- 메인그리드1 -->
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
          <IGridTitle 
            ref="gridTitle"
            title="근로자정기안전보건교육 리스트"
            :button-list="['btnUpdate', 'btnCopy', 'btnConfirm', 'btnCancelConfirm']"
            @click-button="onButtonsClickTab1"
          >
            <!-- 2024.08.23 박용훈 문구 추가 -->
            <template #editors>※입과완료가 된 상태일 경우는 수정이 불가능 합니다. 수정 필요 시 안전교육담당자에게 연락 바랍니다.※</template>
          </IGridTitle>
          <RealGrid
            ref="grdMain1"
            :grid-view-option="grdMainProps1.gridViewOption"
            :fields="grdMainProps1.fields"
            :columns="grdMainProps1.columns"
            :column-layout="grdMainProps1.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <v-card-text v-show="tab == 'tab2'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <!-- 조회조건 -->
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-input
              :label="$t('년도')"
              
              v-model="searchParams.YEAR2"
              type="Number"
              labelWidth="26px"
              width="200px"
              @update:model-value="gridRefresh()"
            />
            <i-select
              :label="$t('사업부')"
              v-model="searchParams.BSNS2"
              :items="codeList.BSNS"
              multiple
              item-title="TXT"
              item-value="COD"
              @update:modelValue="updateBSNS2"
              labelWidth="39px"
              width="500px"
            />
            <i-select
              :label="$t('부서')"
              v-model="searchParams.DEPT2"
              :items="codeList.DEPT2"
              item-title="TXT"
              item-value="COD"
              labelWidth="26px"
              width="200px"
              @update:model-value="gridRefresh()"
            />
            <i-select
              :label="$t('소속구분')"
              v-model="searchParams.ORGN_DIV"
              :items="codeList.ORGN_DIV"
              item-title="TXT"
              item-value="COD"
              labelWidth="52px"
              width="200px"
              @update:model-value="gridRefresh()"
            />
            <v-checkbox
              v-model="searchParams.TARGET_YN2"
              :label="$t('교육대상자만 조회')" 
              true-value="Y" 
              false-value="N"
              @update:model-value="gridRefresh()"
            />
          </div>
        </v-sheet>
        <!-- 메인그리드2 -->
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet class="h-auto">
          <IGridTitle 
            ref="gridTitle2"
            title="관리감독자 정기안전보건교육"
            :button-list="['btnUpdate', 'btnCopy']"
            @click-button="onButtonsClickTab2"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain2"
            :grid-view-option="grdMainProps2.gridViewOption"
            :fields="grdMainProps2.fields"
            :columns="grdMainProps2.columns"
            :column-layout="grdMainProps2.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
      
        
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