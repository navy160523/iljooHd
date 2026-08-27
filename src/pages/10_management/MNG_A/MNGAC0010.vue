<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import OZReport from '@/components/OZReport.vue'

defineOptions({
  name:'10_management-MNG_A-MNGAC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)

const btnAuthParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  EMP_NO: userStore.userId,
})

const btnAuth = ref(false)

let korean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),  
  REV: null,
  BSNS_CD: userStore.bsnsCd,
  //ASGN_CD: userStore.asgnCd,
  ASGN_CD: userStore.userDiv === 'A' ? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: userStore.userDiv === 'A' ? userStore.deptNm : userStore.asgnNm,
  DEPT_CD: userStore.deptCd,
  YN_OUT: 'Y',
})

//조회조건
const state = reactive({
  WRITE_DATE: null,     // 작성일
  EDTR_NAME: null,      // 작성자
  // CNFM_DATE: null,      // 확정일
  // ZZ_APP_STATUS: null,  // 진행상태
})

// Grid SelectCheckBox
const wrkList = reactive([])
const occrList = reactive([])
const impctList = reactive([])
const dtrList = reactive([])
const deleteParam = ref(null)
const saveParam = ref(null)

const reportName = ref('/manage/hse/MNGAC0010.ozr')

// IN Parameters [ "PARAM1='AA'", "PARAM2='BB'"]
const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)


// 그리드 리스트
const gridData = reactive([])

// Grid SelectCheckBox 값 조회
const initCodeList = () => {
  Promise.all([    
    // 작업조건
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF13', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),
    
    // 발생시점
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF14', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),
    
    // 영향범위
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF15', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),
    
    // 직/간접영향
    commonSearchApi({ queryId : 'MNG_searchCommonCode', param: { CMPNY_DIV: userStore.cmpnyDiv, ALL_UP_CD: 'HHIAF16', USE_FLAG: 'Y', CODE_NAME_TYPE: '0' } }),
  ]).then(res => {
    wrkList.value = res[0].ORESULT_CUR
    occrList.value = res[1].ORESULT_CUR
    impctList.value = res[2].ORESULT_CUR
    dtrList.value = res[3].ORESULT_CUR

    grdMain.value.setBindingColumn("WRK_COND_CD", wrkList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("OCCR_CD", occrList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("EM_IMPCT_CD", impctList.value, "COD", "TXT")
    grdMain.value.setBindingColumn("DRT_DIV", dtrList.value, "COD", "TXT")

    // 그리드 복사 붙여넣기 제한 - 복사하여 저장 할 경우 코드 대신 한글이 저장됨
    grdMain.value.getGridView().copyOptions.enabled = false
    grdMain.value.getGridView().pasteOptions.enabled = false

    onButtonsClick({ id: 'btnSearch' })
  })
}

const setBtn = () => {
  // 2025년 데이터는 복사 버튼 숨김
  menuTitle.value.setBtnProperty('btnCopy', 'visible', false)

  Promise.all([    
    // 버튼 disable (해당부서의 HSE경영시스템 담당자)
    commonSearchApi({ queryId : 'searchHseAuth', param: {CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, ASGN_CD:searchParams.ASGN_CD, EMP_NO: userStore.empNo} }),
  ]).then(res => {
    menuTitle.value.disableBtn('btnCreate', true)
    menuTitle.value.disableBtn('btnUpdate', true)
    menuTitle.value.disableBtn('btnDelete', true)

    // menuTitle.value.disableBtn('btnCopy', true)

    // 해당부서의 HSE경영시스템 담당자면 true
    btnAuth.value = res[0].ORESULT_CUR[0].AUTH === 'Y' ? true : false

    // 조회한 부서의 HSE추진담당자 일때만 버튼 활성화
    if(btnAuth.value){
      menuTitle.value.disableBtn('btnCreate', false)
      menuTitle.value.disableBtn('btnUpdate', false)
      menuTitle.value.disableBtn('btnDelete', false)

      // menuTitle.value.disableBtn('btnCopy', false)
    }
  })
}

// display: { selectionStyle : 'block'} // selection 스타일
//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: {  visible: true }, header: { height: 60 }, stateBar: { visible: false } },
  keys : ['PRCS_CD','DET_PRCS_CD','EM_PART_CD'],
  fields : [ 
    { fieldName: 'PRCS_CD', dataType: 'text', width: '60', header: { text: t('순번'), styleName: 'header_validit' }, editable: false, required: true, requiredMessage: '[순번]는 필수입니다.' },
    { fieldName: 'PRCS_DESC', dataType: 'text', header: { text: t('명칭'), styleName: 'header_validit' }, styleName: 'left-column, editable_column', required: true, requiredMessage: '[명칭]는 필수입니다.' },
    //{ fieldName: 'INPUT', dataType: 'text', header: { text: t('투입') }, styleName: 'left-column, editable_column' },  // 2025.01.23 김민기 선임 요청으로 삭제 처리
    { fieldName: 'DET_PRCS_CD', dataType: 'text', width: '60', header: { text: t('순번'), styleName: 'header_validit' }, editable: false, required: true, requiredMessage: '[순번]는 필수입니다.' },
    { fieldName: 'DET_PRCS_DESC', dataType: 'text', header: { text: t('명칭'), styleName: 'header_validit' }, styleName: 'left-column, editable_column', required: true, requiredMessage: '[명칭]는 필수입니다.' },
    //{ fieldName: 'DISPOSE', dataType: 'text', header: { text: t('배출') }, styleName: 'left-column, editable_column' },  // 2025.01.23 김민기 선임 요청으로 삭제 처리
    { fieldName: 'EM_PART_CD', dataType: 'text', width: '60', header: { text: t('순번'), styleName: 'header_validit' }, editable: false, required: true, requiredMessage: '[순번]는 필수입니다.' },
    { fieldName: 'EM_PART_DESC', dataType: 'text', width: '200', header: { text: t('명칭'), styleName: 'header_validit' }, styleName: 'left-column, editable_column', required: true, requiredMessage: '[명칭]는 필수입니다.' },
    { fieldName: 'WRK_COND_CD', dataType: 'text', width: '100', header: { text: t('작업조건') }, editable: false ,lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, styleName: 'left-column, editable_column' },
    { fieldName: 'OCCR_CD', dataType: 'text', header: { text: t('발생시점') }, editable: false,lookupDisplay: true,
      editor: { type: 'checklist', textReadOnly: true, dropDownWhenClick: true }, styleName: 'left-column, editable_column' },
    { fieldName: 'DRT_DIV', dataType: 'text', header: { text: t('직/간접영향') }, editable: false,lookupDisplay: true,
      editor: { type: 'checklist', textReadOnly: true, dropDownWhenClick: true }, styleName: 'left-column, editable_column' },
    { fieldName: 'EM_IMPCT_CD', dataType: 'text', header: { text: t('영향범위') }, editable: false,lookupDisplay: true,
      editor: { type: 'checklist', textReadOnly: true, dropDownWhenClick: true }, styleName: 'left-column, editable_column' },
    { fieldName: 'EM_EVAL_YN', name: 'EM_EVAL_YN', dataType: 'text', width: '100', header: { text: t('평가 대상 여부') },
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, editable: true, styleName: 'left-column, editable_column' },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false  },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false  },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible: false  },
    { fieldName: 'REV', dataType: 'text', header: { text: t('차수') } , visible: true },    
    { fieldName: 'USE_YN', dataType: 'text', header: { text: t('사용여부') } , visible: false },
    { fieldName: 'rowGbn', dataType: 'text', header: { text: t('원본 데이터 구분') } , visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') } , visible: false },
  ],
  columns : [],
  columnLayout: [
    {
      name: '구분',
      direction: 'horizontal',
      items: [ 'PRCS_CD', 'PRCS_DESC' ],
      header: { text: t('구분') },
    },
    //'INPUT',
    {
      name: '활동공정',
      direction: 'horizontal',
      items: [ 'DET_PRCS_CD', 'DET_PRCS_DESC' ],
      header: { text: t('활동공정') },
    },
    //'DISPOSE',
    {
      name: '환경영향 측면',
      direction: 'horizontal',
      items: [ 'EM_PART_CD', 'EM_PART_DESC' ],
      header: { text: t('환경영향 측면') },
    },
    'WRK_COND_CD',
    'OCCR_CD',
    'DRT_DIV',
    'EM_IMPCT_CD',
    'EM_EVAL_YN',
  ],
})

grdMainProps.columns = grdMainProps.fields

/* ***************** 평가대상 Y/N 여부에 따라 편집가능 ****************** */
const rowChanged = async (grid, oldRow, newRow)=> {
  if(newRow === -1){
    return
  }
  let rowData = await grdMain.value.getDataProvider().getJsonRow(newRow)
  let rowState = await grdMain.value.getDataProvider().getRowState(newRow)

  // 코드
  let PRCS_CD = { name: 'PRCS_CD' }
  let DET_PRCS_CD = { name: 'DET_PRCS_CD' }
  let EM_PART_CD = { name: 'EM_PART_CD' }

  let WRK_COND_CD = { name: 'WRK_COND_CD' }
  let OCCR_CD = { name: 'OCCR_CD' }
  let DRT_DIV = { name: 'DRT_DIV' }
  let EM_IMPCT_CD = { name: 'EM_IMPCT_CD' }

  // 코드
  PRCS_CD.editable = false
  DET_PRCS_CD.editable = false
  EM_PART_CD.editable = false

  WRK_COND_CD.editable = false
  OCCR_CD.editable = false
  DRT_DIV.editable = false
  EM_IMPCT_CD.editable = false

  if(rowState === 'created'){
    PRCS_CD.editable = true
    DET_PRCS_CD.editable = true
    EM_PART_CD.editable = true
  }
  
  if(rowData.EM_EVAL_YN === 'Y'){
    WRK_COND_CD.editable = true
    OCCR_CD.editable = true
    DRT_DIV.editable = true
    if(rowData.DRT_DIV){
      EM_IMPCT_CD.editable = true
    }
  }
  grdMain.value.getGridView().setColumn(PRCS_CD)
  grdMain.value.getGridView().setColumn(DET_PRCS_CD)
  grdMain.value.getGridView().setColumn(EM_PART_CD)

  grdMain.value.getGridView().setColumn(WRK_COND_CD)
  grdMain.value.getGridView().setColumn(OCCR_CD)
  grdMain.value.getGridView().setColumn(DRT_DIV)
  grdMain.value.getGridView().setColumn(EM_IMPCT_CD)
}

const onEditRowChanged = async (grid, itemIndex, dataRow, field, oldValue, newValue,) => {
  grid.commit()

  let fieldName = grdMain.value.getDataProvider().getFieldName(field)
  let rowData = grdMain.value.getDataProvider().getJsonRow(dataRow)
  if(fieldName === 'EM_EVAL_YN'){
    if(newValue === 'Y'){
      
      let rowData = await grdMain.value.getDataProvider().getJsonRow(itemIndex)
      let rowState = await grdMain.value.getDataProvider().getRowState(itemIndex)

      // 코드
      let PRCS_CD = { name: 'PRCS_CD' }
      let DET_PRCS_CD = { name: 'DET_PRCS_CD' }
      let EM_PART_CD = { name: 'EM_PART_CD' }

      let WRK_COND_CD = { name: 'WRK_COND_CD' }
      let OCCR_CD = { name: 'OCCR_CD' }
      let DRT_DIV = { name: 'DRT_DIV' }
      let EM_IMPCT_CD = { name: 'EM_IMPCT_CD' }

      // 코드
      PRCS_CD.editable = false
      DET_PRCS_CD.editable = false
      EM_PART_CD.editable = false

      WRK_COND_CD.editable = false
      OCCR_CD.editable = false
      DRT_DIV.editable = false
      EM_IMPCT_CD.editable = false

      if(rowState === 'created'){
        PRCS_CD.editable = true
        DET_PRCS_CD.editable = true
        EM_PART_CD.editable = true
      }
      
      if(rowData.EM_EVAL_YN === 'Y'){
        WRK_COND_CD.editable = true
        OCCR_CD.editable = true
        DRT_DIV.editable = true
        if(rowData.DRT_DIV){
          EM_IMPCT_CD.editable = true
        }
      }
      grdMain.value.getGridView().setColumn(PRCS_CD)
      grdMain.value.getGridView().setColumn(DET_PRCS_CD)
      grdMain.value.getGridView().setColumn(EM_PART_CD)

      grdMain.value.getGridView().setColumn(WRK_COND_CD)
      grdMain.value.getGridView().setColumn(OCCR_CD)
      grdMain.value.getGridView().setColumn(DRT_DIV)
      grdMain.value.getGridView().setColumn(EM_IMPCT_CD)

      // gridData.values.forEach(element => {
      //   if(element.rowGbn == rowData.rowGbn){
      //     grdMain.value.getDataProvider().setValue(dataRow, 'WRK_COND_CD', element.WRK_COND_CD )
      //     grdMain.value.getDataProvider().setValue(dataRow, 'OCCR_CD', element.OCCR_CD)
      //     grdMain.value.getDataProvider().setValue(dataRow, 'EM_IMPCT_CD', element.EM_IMPCT_CD)
      //     grdMain.value.getDataProvider().setValue(dataRow, 'DRT_DIV', element.DRT_DIV)
      //   }
      // })
    }else {
      grdMain.value.getDataProvider().setValue(dataRow, 'WRK_COND_CD', null)
      grdMain.value.getDataProvider().setValue(dataRow, 'OCCR_CD', null)
      grdMain.value.getDataProvider().setValue(dataRow, 'EM_IMPCT_CD', null)
      grdMain.value.getDataProvider().setValue(dataRow, 'DRT_DIV', null)
    }
    rowChanged(null, null, dataRow)
  } else if(fieldName === 'DRT_DIV'){
    if(!rowData.DRT_DIV){
      grdMain.value.getDataProvider().setValue(dataRow, 'EM_IMPCT_CD', null)
    }
    rowChanged(null, null, dataRow)
  }
  grdMain.value.getGridView().checkItem(dataRow)
}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch')
  {
    stateSearch()
  }else if (btn.id === 'btnCreate') {
    addRowData()
  }else if (btn.id === 'btnUpdate') {    
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }else if(btn.id === 'btnCopy'){
    let path = useLogsStore().path.split('/')
    let menuId = path[path.length -1] 

    copyPopup.value.openCopyPopup(menuId, searchParams)
  }else {
    if(params.value.length === 0){
      Message.warn(t('조회 후 진행 하십시오.'))

      return
    }

    showOz.value = true
  }
}

// 작성일, 작성자, 결재완료일, 진행상태
const stateSearch = () => {
  
  // state.EDTR_NAME = userStore.empNm
  // state.WRITE_DATE = dayjs().format('YYYY-MM-DD')
  
  // state.CNFM_DATE = null
  // state.ZZ_APP_STATUS = null
  //searchParams.REV = null

  params.value = []
  commonSearchApi({ queryId: "MNGAC0010_SEARCH_01", param: searchParams }).then( res => {
    if(res.ORESULT_CUR.length > 0){
      state.EDTR_NAME = res.ORESULT_CUR[0].EDTR_NAME ? res.ORESULT_CUR[0].EDTR_NAME : userStore.empNm
      state.WRITE_DATE = res.ORESULT_CUR[0].WRITE_DATE ? dayjs(res.ORESULT_CUR[0].WRITE_DATE).format('YYYY-MM-DD') : null

      // state.CNFM_DATE = res.ORESULT_CUR[0].CNFM_DATE ? dayjs(res.ORESULT_CUR[0].CNFM_DATE).format('YYYY-MM-DD') : null

      searchParams.REV = res.ORESULT_CUR[0].REV

      // if(res.ORESULT_CUR[0].ZZ_APP_STATUS === 0){
      //   state.ZZ_APP_STATUS = '확정전'
      // }else {
      //   state.ZZ_APP_STATUS = '확정'
      // }
      setPrint(res.ORESULT_CUR[0])
    }else{
      state.EDTR_NAME = ''
      state.WRITE_DATE = ''
    }


    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData02) 
      .setAfter(afterSearch)
      .run() 

  }).finally(() => {
    // new queryFlowHelper(vm, t)
    //   .setGridList([grdMain])
    //   .setQuery(searchData02) 
    //   .setAfter(afterSearch)
    //   .run()  
  })
}

//로우 추가하는 함수
const addRowData = () => {
  let newRow = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    ASGN_CD: searchParams.ASGN_CD,
    EXP_YN: 'N',
    SAVE_YN: 'N',
    USE_YN: 'Y',
  }
  grdMain.value.addRow(newRow)
}

// 메인그리드
const searchData02 = () => {
  searchParams.REV = searchParams.YEAR + '-01'

  return commonSearchApi({ queryId : 'MNGAC0010_SEARCH_02', param: searchParams })
}

const afterSearch = async res => {
  let cnt = 0
  res.ORESULT_CUR.forEach(element => {
    element.rowGbn = cnt++
  })
  gridData.values = await res.ORESULT_CUR
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdMain.value.getGridView().setFocus(0)
  setBtn()
}

const beforeSave = async () => {
  saveParam.value = []

  let result = true
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    result = false
  } else {
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.CMPNY_DIV = searchParams.CMPNY_DIV
      data.ASGN_CD = searchParams.ASGN_CD
      data.BSNS_CD = searchParams.BSNS_CD
      data.REV = searchParams.REV ? searchParams.REV : searchParams.YEAR + '-01'
      data.USER_ID = userStore.userId
      data.EDTR_NAME = state.EDTR_NAME ? state.EDTR_NAME : userStore.userName
      data.WRITE_DATE = state.WRITE_DATE ? state.WRITE_DATE : dayjs().format('YYYYMMDD')
      data.EM_DOC_NO = 'EM-' + searchParams.ASGN_CD + '001'
      data.YN_OUT = searchParams.YN_OUT

      saveParam.value.push(data)
    })

  }

  return result
}

//저장버튼 눌렀을때 실행되는 함수
const saveData = () => {
  commonExecuteApi({ queryId: "MNGAC0010_SAVE_01", list: saveParam.value })

  return commonExecuteApi({ queryId: "MNGAC0010_SAVE_02", list: saveParam.value })
}

//메뉴버튼 - 삭제
const deleteData = () => {  
  return commonExecuteApi({ queryId : 'MNGAC0010_DELETE_01', list: saveParam.value })
}

/* -------------- 팝업 오픈 -------------- */
const openPopup = gbn => {
  if (gbn === '부서조회') {
    deptPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv, 
      HSE_ONLY : 'Y', 
      ASGN_NM : searchParams.ASGN_NM,
    })
  } else if(gbn === '인원조회') {
    empPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv, 
      HSE_ONLY : 'Y', 
      ASGN_NM : searchParams.ASGN_NM,
      CERT_EMP_NM: searchParams.CERT_EMP_NM,
    })
  } else {
    deptPopup.value.openPopup({})
  }
}

/* -------------- 팝업 선택 이벤트(부서/협력사) -------------- */
const onDeptSelected = val => {
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM
  onButtonsClick({ id: 'btnSearch' })
}

const yearChange = async e => {
  searchParams.YEAR = await searchParams.YEAR.replace(korean, '')
  searchParams.REV = ''
  if(searchParams.YEAR.length > 4){
    searchParams.YEAR = await searchParams.YEAR.slice(0, 4)
  }
}

const setPrint = val => {
  let WRITE_DATE = val.WRITE_DATE ? dayjs(val.WRITE_DATE).format('YYYY년 MM월 DD일') : dayjs(new Date).format('YYYY년 MM월 DD일')
  params.value = [
    "IN_CMPNY_DIV="+searchParams.CMPNY_DIV,
    "IN_BSNS_CD="+searchParams.BSNS_CD,
    "IN_ASGN_CD="+searchParams.ASGN_CD,
    "IN_REV="+searchParams.REV,
    'IN_EM_DOC_NO=' + val.EM_DOC_NO,
    'IN_SPAGE=' + '총 Page',
    'IN_WRITE_DATE=' + WRITE_DATE,
    'IN_ASGN_NM=' + searchParams.ASGN_NM,
    'IN_EDTR_NAME=' + val.EDTR_NAME,
  ]
}

onMounted(() => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnCopy', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex justify-space-between">
          <div class="d-flex">
            <i-input
              :label="$t('년도')"
              labelWidth="35px"
              v-model="searchParams.YEAR"
              @update:modelValue="yearChange"
              type="Number"
              width="200px"
            />
            <i-input 
              :label="$t('부서/ 협력사')"
              label-width="80px"
              width="350px"
              v-model="searchParams.ASGN_NM" 
              append-inner-icon="mdi-magnify" 
              @keydown.enter="e => {
                openPopup('부서조회')
              }"
              @update:modelValue="e => { searchParams.DEPT_CD = null  
                                        searchParams.REV = null }"
              @click:appendInner="openPopup('click')"
              class="ma-0"
            />
            <i-input
              v-model="searchParams.ASGN_CD" 
              readonly 
              width="100px"
            />
          </div>
          <div class="d-flex">
            <i-input
              :label="$t('작성일')"
              labelWidth="50px"
              v-model="state.WRITE_DATE"
              readonly
              width="250px"
            />
            <i-input
              :label="$t('작성자')"
              labelWidth="50px"
              v-model="state.EDTR_NAME"              
              width="250px"
            />
          </div>
        </v-sheet>
        <v-sheet>
          <strong>※ HSE경영시스템 메뉴는 부서 내 HSE추진자만 입력 가능하며, HSE추진자는 부서에서 직접 관리합니다.</strong>
           &nbsp; - HSE추진자 등록 메뉴 : [운영관리 - 담당자 관리 - 부서별 담당자 등록/관리] 
          <br> &nbsp; - HSE추진자 등록 권한:  부서 내 HSE 추진자, 운영과장 
          <br> ※ 평가대상여부에 체크된 행만 작업조건, 발생시점, 직/간접영향이 수정 가능합니다.
        </v-sheet>
        <v-sheet class="h-auto">

          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onEditRowChanged="onEditRowChanged"
            @onCurrentRowChanged="rowChanged"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected" />

    <!-- 복사 팝업 -->
    <CopyPopup ref="copyPopup" />

    <!-- OZReport -->
    <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
