 <!--
  화면명 : MNGEE0010.vue
  화면개요 : 이행점검 결과 현황 및 조치 입력
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import EmpPopup from "@/components/popup/EmpPopup.vue"
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import ImageViewerPopup from '@/components/popup/ImageViewerPopup.vue'
import MNGEE0010Popup from "./MNGEE0010Popup.vue"
import MNGEB0010PopTab1Popup from './MNGEB0010PopTab1Popup.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import OZReport from '@/components/OZReport.vue'


defineOptions({
  name:'10_management-MNG_E-MNGEE0010',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const logsStore = useLogsStore()
const t = useI18n().t //다국어

const empPopup = ref(null)
const deptPopup = ref(null)
const gridEmpPopup = ref(null)
const gridDeptPopup = ref(null)
const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const grdSub1 = ref(null)
const tab = ref(null)
const fileUploadPopup = ref(null)
const imageViewerPopup = ref(null)
const mNGEE0010Popup = ref(null)
const mNGEB0010PopTab1Popup = ref(null)
const approvalPopup = ref(null)

const buttonList = reactive([])

//조회조건
let searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  ASGN_FULL_NM: userStore.deptNm,
  
  FROM_DATE : '',
  TO_DATE : '',
  INS_DATE_FROM : '',
  INS_DATE_TO : '',

  EMP_CD : '',
  INS_EMP_NM : '',
  INS_EMP_NO : '',

  // LAW : '',
  LAW_CD : '',

  // COMP : '',
  COMP_YN : ''
})

let searchParams2 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  ASGN_FULL_NM: userStore.deptNm,
  
  FROM_DATE : '',
  TO_DATE : '',
  INS_DATE_FROM : '',
  INS_DATE_TO : '',

  SEND_FROM_DATE : '',
  SEND_TO_DATE : '',
  SOL_DATE_FROM : '',
  SOL_DATE_TO : '',

  EMP_CD : '',
  INS_EMP_NM : '',
  INS_EMP_NO : '',

  STATUS : '',
  // LAW : '',
  LAW_CD : '',

  // COMP : '',
  COMP_YN : ''
})

let saveParams = reactive([])
let deleteParams = reactive([])
let mailParams = reactive([])

//코드리스트 선언
const codeList = reactive({
  LAW_CD : [
    {TXT : '전체', COD: ''},
  ], // 관련법규
  COMP_YN : [ // 조치여부
    {TXT : '전체', COD: ''},
    {TXT : '조치완료', COD: 'Y'},
    {TXT : '조치미완료', COD: 'N'},
  ],
  GRD_COMP_YN : [ // 조치여부
    {TXT : '조치완료', COD: 'Y'},
    {TXT : '조치미완료', COD: 'N'},
  ],
  INS_RST : [ // 평가결과
    {TXT : '적합', COD: 'Y'},
    {TXT : '보완', COD: 'N'},
  ],
  DEPT_CD : '', //수검부서(장소)
  STATUS : [
    {TXT : '전체', COD : ''},
    {TXT : '결재전', COD : '10'},
    {TXT : '결재중', COD : '20'},
    {TXT : '결재완료', COD : '30'},
  ],
  GRD_STATUS : [
    {TXT : '결재전', COD : '10'},
    {TXT : '결재중', COD : '20'},
    {TXT : '결재완료', COD : '30'},
  ],
  BSNS: []
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({ 
      queryId : 'LAW_DIV_SEARCH', 
      param: {
        CMPNY_DIV : userStore.cmpnyDiv,
        ALL_UP_CD : 'HHI.A',
        UP_CD : 'A',
        USE_FLAG : 'Y',
      } 
    }),
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" }, }),
  ]).then(res => {
    res[0].ORESULT_CUR.forEach(ele => {
      codeList.LAW_CD.push({
        COD : ele.COD,
        TXT : ele.TXT,
      })
    })
    res[1].ORESULT_CUR.forEach(e => {
      codeList.BSNS.push(e)
    })


    // codeList.LAW_CD.unshift({ TXT: '전체', COD: '' })

    grdMain.value.setBindingColumn('COMP_YN', codeList.GRD_COMP_YN, 'COD', 'TXT')
    // codeList.COMP_YN.unshift({ TXT: '전체', COD: '' })

    grdMain.value.setBindingColumn('INS_RST', codeList.INS_RST, 'COD', 'TXT')
    // console.log('searchParsms :',searchParams)
    setPrint()
    setButton()
  })
}

// 부서 팝업
const openPopup = gbn => {  
  if(gbn === '부서조회1'){
    deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams.ASGN_NM })
  } 
  else if(gbn === '부서조회2'){
    deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : searchParams2.ASGN_NM })
  }
  else if(gbn === 'click'){
    deptPopup.value.openPopup({})
  }
}

// 부서 선택 후 이벤트 (조회조건)
const onDeptSelected = val => {
  if(tab.value === 'one'){
    searchParams.CMPNY_DIV = val.CMPNY_DIV
    searchParams.BSNS_CD = val.BSNS_CD
    searchParams.DEPT_CD = val.DEPT_CD
    searchParams.ASGN_CD = val.ASGN_CD
    searchParams.ASGN_NM = val.ASGN_SHRT_NM
    searchParams.ASGN_FULL_NM = val.ASGN_FULL_NM

    onButtonsClick({ id: 'btnSearch' })
  }
  else if(tab.value === 'two'){
    searchParams2.CMPNY_DIV = val.CMPNY_DIV
    searchParams2.BSNS_CD = val.BSNS_CD
    searchParams2.DEPT_CD = val.DEPT_CD
    searchParams2.ASGN_CD = val.ASGN_CD
    searchParams2.ASGN_NM = val.ASGN_SHRT_NM
    searchParams2.ASGN_FULL_NM = val.ASGN_FULL_NM
    
    onButtonsClick2({ id: 'btnSearch' })
  }
}

// 부서 선택 후 이벤트 (그리드 안 - 수검부서(장소))
const onGridDeptSelected = val => {
  if(tab.value === 'one'){ 
    grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DEPT_NM', val.ASGN_SHRT_NM)
    grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DEPT_CD', val.DEPT_CD)
    grdMain.value.getGridView().checkItem(popupParams.ROW_IDX, true)
  }
}

// 인원팝업
const openEmpPopup = async (gbn) => {
  if(tab.value === 'one'){
    if (gbn === "인원조회") {
      empPopup.value.openPopup({
        CMPNY_DIV: userStore.cmpnyDiv,
        HSE_ONLY: "Y",
        EMP_NM: searchParams.INS_EMP_NM,
      })
    }
  }else if(tab.value === 'two'){
    if (gbn === "인원조회") {
      empPopup.value.openPopup({
        CMPNY_DIV: userStore.cmpnyDiv,
        HSE_ONLY: "Y",
        EMP_NM: searchParams2.INS_EMP_NM,
      })
    }
  }
}

// 인원 선택 후 이벤트 (조회조건)
const onEmpSelected = (val) => {
  if(tab.value === 'one'){
    searchParams.INS_EMP_NM = val.EMP_NM
    searchParams.INS_EMP_NO = val.EMP_NO
  }
  else if(tab.value === 'two'){
    searchParams2.INS_EMP_NM = val.EMP_NM
    searchParams2.INS_EMP_NO = val.EMP_NO
  }
}

// 인원 선택 후 이벤트 (그리드 안 - 점검자)
const onGridEmpSelected = val => {
  if(tab.value === 'one'){ 
    grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'INS_EMP_NM', val.EMP_NM)
    grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'INS_EMP', val.EMP_NO)
    grdMain.value.getGridView().checkItem(popupParams.ROW_IDX, true)
  }
}


// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// #1 END ------------------------------------------------------


const setPrint = () => {

  if(tab.value === 'one'){
    reportName.value = '/manage/hse/MNGEE0010.ozr'
    params.value = [
      "IN_DEPT_CD="+searchParams.ASGN_CD,
      "IN_ASGN_NM="+searchParams.ASGN_NM,
      "IN_INS_DATE_FROM="+searchParams.INS_DATE_FROM === null ? '' : searchParams.INS_DATE_FROM,
      "IN_INS_DATE_TO="+searchParams.INS_DATE_TO === null ? '' : searchParams.INS_DATE_TO,
      "IN_INS_ENP_NO="+searchParams.EMP_CD,
      "IN_INS_LAW_CD="+searchParams.LAW_CD,
      "IN_INS_COMP_YN="+searchParams.COMP_YN,
      
    ]
  }else if(tab.value === 'two'){
    reportName.value = '/manage/hse/MNGEE0010_2.ozr'
    params.value = [
      "IN_INS_DATE_FROM="+searchParams2.INS_DATE_FROM === null ? '' : searchParams2.INS_DATE_FROM,
      "IN_INS_DATE_TO="+searchParams2.INS_DATE_TO === null ? '' : searchParams2.INS_DATE_TO,
      "IN_INS_ENP_NO="+searchParams2.EMP_CD,
      "IN_STATUS="+searchParams2.STATUS,
      "IN_COMP_YN="+searchParams2.COMP_YN,
      "IN_SOL_DATE_FROM="+searchParams2.SOL_DATE_FROM === null ? '' : searchParams2.SOL_DATE_FROM,
      "IN_SOL_DATE_TO="+searchParams2.SOL_DATE_TO === null ? '' : searchParams2.SOL_DATE_FROM,
      "IN_DEPT_CD="+searchParams.ASGN_CD,
      "IN_ASGN_NM="+searchParams2.ASGN_NM,
    ]
  }
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL1'],
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', width: '180',
      lookupDisplay: true, button : 'action', editable: false,
      header: { text: t('부서'), styleName: 'header_validit' },
      required: true, requiredMessage: '[부서]는 필수입니다.' ,
    },
    { fieldName: 'INS_DATE', dataType: 'text', dataType: 'text', width: '90',
      'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('점검일자'), styleName: 'header_validit' }, 
      required: true, requiredMessage: '[점검일자]는 필수입니다.' ,
    },
    { fieldName: 'INS_EMP_NM', dataType: 'text', width: '80',
      button : 'action', editable:false,
      header: { text: t('점검자'), styleName: 'header_validit' }, 
      required: true, requiredMessage: '[점검자]는 필수입니다.' , 
    },
    { fieldName: 'INS_RST', dataType: 'text', width: '80',
      lookupDisplay: true, editor: { type: 'list', dropDownWhenClick: true, textReadOnly: true }, 
      header: { text: t('평가결과'), styleName: 'header_validit' }, 
      required: true, requiredMessage: '[평가결과]는 필수입니다.' , 
    },
    { fieldName: 'FAIL_CONTENT', dataType: 'text', width: '200',
      header: { text: t('내용') }, 
      styleName: 'multiline-editor',
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 200,
      }, 
    },
    { fieldName: 'FAIL_FILE', dataType: 'text', editable:false,
      header: { text: t('사진') }, width: '60',
      renderer:{
        type:"button"
      }
    },
    { fieldName: 'LAW_NM', dataType: 'text', width: '200',
      header: { text: t('법규명'), styleName: 'header_validit' }, 
      required: true, requiredMessage: '[법규명]은 필수입니다.' , button : 'action',
      editable:false,
    },
    { fieldName: 'LAW_NM1', dataType: 'text', width: '60', editable:false,
      header: { text: t('조') }, 
    },
    { fieldName: 'LAW_NM2', dataType: 'text', width: '60', editable:false,
      header: { text: t('항') }, 
    },
    { fieldName: 'SOL_SEND_DATE', dataType: 'text', width: '120', editable: false,
      'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('시정조치서 발부일') }, 
    },
    { fieldName: 'SOL_CONTENT', dataType: 'text', width: '200', editable: false,
      header: { text: t('내용') }, styleName: 'multiline-editor'
    },
    { fieldName: 'SOL_FILE', dataType: 'text', editable: false,
      header: { text: t('사진') }, width: '60',
      renderer:{
        type:"button"
      }
    },
    { fieldName: 'SOL_DATE',  dataType: 'text', editable: false,
      'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('조치(예정)일') }, 
    },
    { fieldName: 'COMP_YN',  dataType: 'text', editable: false,
      lookupDisplay: true,
      header: { text: t('조치 완료 여부') }, 
    },
    { fieldName: 'REMARK', dataType: 'text',
      header: { text: t('비고') }, 
    },

    { fieldName: 'LAW_CD', dataType: 'text', visible:false },
    { fieldName: 'INS_EMP', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },
    { fieldName: 'FAIL_FILE_ID', dataType: 'text',visible: false },
    { fieldName: 'SOL_FILE_ID', dataType: 'text',visible: false },
    { fieldName: 'INS_CD', dataType: 'text',visible: false },
    { fieldName: 'FILE_COUNT', dataType: 'text',visible: false },
  ],
  columns : [],
  columnLayout: [
    'DEPT_NM',
    'INS_DATE',
    'INS_EMP_NM',
    'INS_RST',
    {
      name: '점검 결과 부적합 내용',
      direction: 'horizontal',
      items: [
        'FAIL_CONTENT',
        'FAIL_FILE',
      ],
    },
    {
      name: '관련법규',
      direction: 'horizontal',
      items: [
        'LAW_NM',
        'LAW_NM1',
        'LAW_NM2',
      ],
    },
    'SOL_SEND_DATE',
    {
      name: '시정조치(예정)',
      direction: 'horizontal',
      items: [
        'SOL_CONTENT',
        'SOL_FILE',
      ],
    },
    'SOL_DATE',
    'COMP_YN',
    'REMARK',
  ],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSub1Props = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL1'],
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', width: '200',
      lookupDisplay: true, editable : false,
      header: { text: t('수검부서(장소)')}
    },
    { fieldName: 'INS_DATE', dataType: 'text', width: '80',
      'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('점검일자') }, editable : false,
    },
    { fieldName: 'INS_EMP_NM', dataType: 'text', width: '80',
      header: { text: t('점검자') }, editable : false,
    },
    { fieldName: 'FAIL_CONTENT', dataType: 'text', width: '200',
      header: { text: t('내용') },  editable: false
    },
    { fieldName: 'FAIL_FILE', dataType: 'text', editable:false,
      header: { text: t('사진') }, width: '40',
      renderer:{
        type:"button"
      }
    },
    { fieldName: 'SOL_CONTENT', dataType: 'text', width: '200',
      header: { text: t('내용'), styleName: 'header_validit' }, 
      // required: true, requiredMessage: '[내용]은 필수입니다.' ,  
    },
    { fieldName: 'SOL_FILE', dataType: 'text',
      header: { text: t('사진') }, width: '40',
      renderer:{
        type:"button"
      }
    },
    { fieldName: 'SOL_DATE',  dataType: 'text', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('조치(예정)일'), styleName: 'header_validit' }, 
      // required: true, requiredMessage: '[조치 (예정)일]은 필수입니다.' ,  
    },
    { fieldName: 'STATUS',  dataType: 'text',
      lookupDisplay: true, editable: false,
      header: { text: t('결재상태') }, 
    },
    { fieldName: 'COMP_YN',  dataType: 'text',
      lookupDisplay: true, editor: { type: 'list', dropDownWhenClick: true, textReadOnly: true }, 
      header: { text: t('조치 완료 여부') }, 
    },

    { fieldName: 'INS_EMP', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'FAIL_FILE_ID', dataType: 'text',visible: false },
    { fieldName: 'SOL_FILE_ID', dataType: 'text',visible: false },
    { fieldName: 'INS_CD', dataType: 'text',visible: false },
    { fieldName: 'FILE_COUNT', dataType: 'text',visible: false },
  ],
  columns : [],
  columnLayout: [
    'DEPT_NM',
    'INS_DATE',
    'INS_EMP_NM',
    {
      name: '점검 결과 부적합 내용',
      direction: 'horizontal',
      items: [
        'FAIL_CONTENT',
        'FAIL_FILE',
      ],
    },
    {
      name: '시정조치(예정)',
      direction: 'horizontal',
      items: [
        'SOL_CONTENT',
        'SOL_FILE',
      ],
    },
    'SOL_DATE',
    'STATUS',
    'COMP_YN',
  ],
})

grdSub1Props.columns = grdSub1Props.fields




//메뉴버튼
const onButtonsClick = btn => {

  if (btn.id === 'btnSearch')
  {    
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnCreate') {
    addData()
    
  } 
  else if (btn.id === 'btnUpdate') {

    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()  
  }
  else if(btn.id === 'btnPrint'){
    setPrint()
    showOz.value = true
  }
  else if(btn.id === 'btnMailCAReport'){
    mailCAReport()
  }
  
}

// btnSearch 실행
const searchData = () => {
  searchParams.INS_DATE_FROM = searchParams.FROM_DATE ? dayjs(searchParams.FROM_DATE).format('YYYYMMDD') : null
  searchParams.INS_DATE_TO = searchParams.TO_DATE ? dayjs(searchParams.TO_DATE).format('YYYYMMDD') : null
  // searchParams.COMP_YN = searchParams.COMP_YN ? searchParams.COMP_YN : ''
  // searchParams.LAW_CD = searchParams.LAW_CD ? searchParams.LAW_CD : ''
  searchParams.INS_EMP_NO = searchParams.INS_EMP_NO ? searchParams.INS_EMP_NO : null
  return commonSearchApi({ queryId : 'MNGEE0010_SEARCH_01', param: searchParams })
}

// btnSearch 실행 후
const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  cellStyle(res.ORESULT_CUR)
}

const cellStyle = (res) => {
  if(tab.value === 'one'){
    grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      // console.log('dataCell:',dataCell)
      // console.log('grid:',grid)
      var ret = {}
      
      if(dataCell.dataColumn.fieldName === 'FAIL_FILE'){
        if(dataCell.value === '첨부'){
          // console.log('dataCell:',dataCell)
          let fileCount = grid.getValue(dataCell.index.itemIndex, "FILE_COUNT")
          if(fileCount > 0){
            // ret.style = { background: 'lightGray' }   
            ret.style = { background:"#EEEEEE" }  
          }
        }else{
          ret.style = { background: '#000000' }       
          // ret.style["background"] = "#000000"  
        }
      }

    return ret
    })
  }
  else{
    grdSub1.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = {}
      
      if(dataCell.dataColumn.fieldName === 'SOL_FILE'){
        if(dataCell.value === '첨부'){
          let fileCount = grid.getValue(dataCell.index.itemIndex, "FILE_COUNT")
          if(fileCount > 0){
            ret.style = { background:"#EEEEEE" }  
          }
        }else{
          ret.style = { background: '#000000' }       
        }
      }

    return ret
    })
  }
}

// btnCreate 실행
const addData = () => {
  grdMain.value.addRow({ 
    DEPT_NM: searchParams.ASGN_NM, 
    DEPT_CD: searchParams.DEPT_CD, 
    INS_DATE: dayjs(new Date()).format('YYYY-MM-DD'),
    FAIL_FILE: '첨부', 
    COMP_YN: 'N', 
    INS_EMP: userStore.userId, 
    INS_EMP_NM: userStore.userName 
  })
}

// btnUpdate 실행 전
const beforeSave = () => {
  return validationCheck()
}

// btnUpdate 실행
const saveData = () => {  
  saveParams = []
  let stateCheckedRows = grdMain.value.getGridView().getCheckedRows()

  for (let rowIdx of stateCheckedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.CMPNY_DIV = userStore.cmpnyDiv
    data.USER_ID = userStore.userId
    data.INS_DATE = data.INS_DATE ? dayjs(data.INS_DATE).format('YYYYMMDD') : null
    data.SOL_SEND_DATE = data.SOL_SEND_DATE ? dayjs(data.SOL_SEND_DATE).format('YYYYMMDD') : null
    data.SOL_DATE = data.SOL_DATE ? dayjs(data.SOL_DATE).format('YYYYMMDD') : null
    saveParams.push(data)
  }
  // console.log('saveParams:',saveParams)
  return commonExecuteApi({ queryId : 'MNGEE0010_SAVE_01', list: saveParams })
}

// btnDelete 실행
const deleteData = () => {
  deleteParams = []

  let stateCheckedRows = grdMain.value.getGridView().getCheckedRows()
  for (let rowIdx of stateCheckedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }
  
  // console.log('deleteParams:',deleteParams) 
  return commonExecuteApi({ queryId : 'MNGEE0010_DELETE_01', list: deleteParams })
}

// 저장, 삭제전 사용자 정의 validation
const validationCheck = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  // console.log('chekedRow:',chekedRow)
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  } else {
    return true
  }
} 


const mailCAReport = () => {
  mailParams = []
  let stateCheckedRows = grdMain.value.getGridView().getCheckedRows()
  // console.log('stateCheckedRows:',stateCheckedRows)
  if(stateCheckedRows.length === 0){
    Message.warn('선택된 데이터가 없습니다.')
    return
  }
  let PAST_DEPT_CD = ''
  for (let rowIdx of stateCheckedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(!data.STATUS){
      Message.warn('저장되지 않은 행이 포함되어 있습니다. 저장을 먼저 해주세요.')
      return
    }
    else if(PAST_DEPT_CD !== ''){
      if(data.DEPT_CD !== PAST_DEPT_CD){
        Message.warn('동일한 수검부서끼리만 송부할 수 있습니다.')
        return
      }
    }
    else if(data.INS_RST === 'Y'){
      Message.warn('평가결과가 적합인 데이터가 있습니다.')
      return
    }
    else if(data.SOL_SEND_DATE){
      Message.warn('이미 시정조치서가 송부된 데이터가 있습니다.')
      return
    }
    data.FAIL_FILE = '보기'
    mailParams.push(data)
    PAST_DEPT_CD = data.DEPT_CD
  }
  // console.log('mailParams:',mailParams)
  mNGEE0010Popup.value.openPopup(mailParams)
}

// tab2 메뉴버튼
const onButtonsClick2 = btn => {
  if (btn.id === 'btnSearch')
  {    
    new queryFlowHelper(vm, t)
      .setGridList([grdSub1])
      .setQuery(searchData2)
      .setAfter(afterSearch2)
      .run()
  } 
  else if (btn.id === 'btnUpdate') 
  {
  new saveFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdSub1, row: null }])
    .setGridList([grdSub1])
    .setBefore(beforeSave2)
    .setQuery(saveData2)
    .setAfter(() => { onButtonsClick2({ id :'btnSearch' }) })
    .run()
  }
  else if(btn.id === 'btnPrint') {
    setPrint()
    showOz.value = true
  }
  else if(btn.id === 'btnReqApply'){
    let stateCheckedRows = grdSub1.value.getGridView().getCheckedRows()
    let applyParams = []
    if(stateCheckedRows.length === 0){
        Message.warn('체크된 데이터가 없습니다.')
        return
      }
    for (let rowIdx of stateCheckedRows) {
      let data = grdSub1.value.getDataProvider().getJsonRow(rowIdx)
      if(data.STATUS === '20'){
        Message.warn('결재중인 데이터가 포함되어 있습니다.')
        return
      }else if(data.STATUS === '30'){
        Message.warn('결재완료된 데이터가 포함되어 있습니다.')
        return
      } else if(data.SOL_CONTENT === ''){
        Message.warn('시정조치(예정) 데이터가 없습니다.')
        return
      } else if(data.SOL_DATE === ''){
        Message.warn('조치(예정)일 데이터가 없습니다.')
        return
      } else if(data.COMP_YN === 'N'){
        Message.warn('조치미완료 데이터가 있습니다.')
        return
      }
      data.COMP_YN_NM = data.COMP_YN === 'Y' ? '조치완료' : '조치미완료'
      applyParams.push(data)
    }
    let d = `<html>
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
#f_18w22s0{
font-size:18pt;
line-height:22pt;
letter-spacing:0pt;
}
font.맑은_고딕{
font-family:맑은 고딕;
}
#f_9w12s0{
font-size:9pt;
line-height:12pt;
letter-spacing:0pt;
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
<div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:1123px;height:793px">
<!--
<div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:39px;width:455px;height:116px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_18w22s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>이행점검&nbsp결과&nbsp현황&nbsp및&nbsp조치&nbsp입력</font></td></tr></table></div></div>
<div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:479px;top:39px;width:97px;height:116px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>부서&nbsp/&nbsp협력사</font></td></tr></table></div></div>
<div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:574px;top:39px;width:292px;height:116px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/> ${searchParams2.ASGN_NM} </font></td></tr></table></div></div>
<div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:864px;top:39px;width:44px;height:116px;overflow:hidden;background-color:#FFFFFF"><table class=two cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>결<BR><BR>재</font></td></tr></table></div></div>
<div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:906px;top:39px;width:97px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>결재&nbsp상신자</font></td></tr></table></div></div>
<div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1001px;top:39px;width:96px;height:35px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>결재&nbsp승인자</font></td></tr></table></div></div>
<div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:906px;top:72px;width:97px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
<div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1001px;top:72px;width:96px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
<div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:906px;top:130px;width:97px;height:25px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
<div class=offset style="z-index:10"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1001px;top:130px;width:96px;height:25px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕><nobr/></font></td></tr></table></div></div>
-->
<div class=offset style="z-index:11"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:39px;width:39px;height:40px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>No.</font></td></tr></table></div></div>
<div class=offset style="z-index:12"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:63px;top:39px;width:135px;height:40px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>수검부서(장소)</font></td></tr></table></div></div>
<div class=offset style="z-index:13"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:196px;top:39px;width:96px;height:40px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>점검&nbsp일자</font></td></tr></table></div></div>
<div class=offset style="z-index:14"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:290px;top:39px;width:78px;height:40px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>점검자</font></td></tr></table></div></div>
<div class=offset style="z-index:15"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:366px;top:39px;width:210px;height:40px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>점검&nbsp결과&nbsp부적합&nbsp내용</font></td></tr></table></div></div>
<div class=offset style="z-index:16"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:574px;top:39px;width:230px;height:40px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>시정조치&nbsp(예정)</font></td></tr></table></div></div>
<div class=offset style="z-index:17"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:802px;top:39px;width:106px;height:40px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>조치(예정)일</font></td></tr></table></div></div>
<div class=offset style="z-index:18"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:906px;top:39px;width:97px;height:40px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>조치&nbsp완료&nbsp여부</font></td></tr></table></div></div>`
let zindex = 19
let idx = 1
let top = 77
let height = 37
for(let i=0;i<applyParams.length;i++){
  d+=`<div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:${top}px;width:39px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${idx++}</font></td></tr></table></div></div>
  <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:63px;top:${top}px;width:135px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${applyParams[i].DEPT_NM}</font></td></tr></table></div></div>
  <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:196px;top:${top}px;width:96px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${applyParams[i].INS_DATE}</font></td></tr></table></div></div>
  <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:290px;top:${top}px;width:78px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${applyParams[i].INS_EMP_NM}</font></td></tr></table></div></div>
  <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:366px;top:${top}px;width:210px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${applyParams[i].FAIL_CONTENT}</font></td></tr></table></div></div>
  <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:574px;top:${top}px;width:230px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${applyParams[i].SOL_CONTENT}</font></td></tr></table></div></div>
  <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:802px;top:${top}px;width:106px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${applyParams[i].SOL_DATE}</font></td></tr></table></div></div>
  <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:906px;top:${top}px;width:97px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${applyParams[i].COMP_YN_NM}</font></td></tr></table></div></div>`
  top = top + height - 2
}
d+=`</div>
</body>
</html>`

    approvalPopup.value.openPopup({
      CLSS_ID: logsStore.vueId,
      TITLE: '이행점검 결과 현황 및 조치 입력',
      CMPNY_DIV : userStore.cmpnyDiv,
      DATA_KEY : userStore.cmpnyDiv + ';' + userStore.bsnsCd + ';' + userStore.deptCd + ';'+ userStore.asgnCd + ';' + new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
      // DATA_KEY : 'HHI;AX00;X0Q0;X0Q0;2023',
      REPORT : d, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
      MODE : '3', //'오프라인 1, 온라인 2, 양쪽 3'
      FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
      CLRLINE : 'CLR_15', //결재라인
      // PARAM424 : '',  //사고보고서용 결재라인no,사번
    })
    
  }
}

// tab2 btnSearch 실행
const searchData2 = () => {
  searchParams2.INS_DATE_FROM = searchParams2.FROM_DATE ? dayjs(searchParams2.FROM_DATE).format('YYYYMMDD') : null
  searchParams2.INS_DATE_TO = searchParams2.TO_DATE ? dayjs(searchParams2.TO_DATE).format('YYYYMMDD') : null
  searchParams2.INS_EMP_NO = searchParams2.INS_EMP_NO ? searchParams2.INS_EMP_NO : null
  searchParams2.SOL_DATE_FROM = searchParams2.SOL_DATE_FROM ? searchParams2.SOL_DATE_FROM : null
  searchParams2.SOL_DATE_TO = searchParams2.SOL_DATE_TO ? searchParams2.SOL_DATE_TO : null
  // console.log('searchParams2:',searchParams2)
  return commonSearchApi({ queryId : 'MNGEE0010_SEARCH_02', param: searchParams2 })
}

const searchedData2 = ref('')

const afterSearch2 = res => {
  // console.log('afterSearch res:',res)
  searchedData2.value = res.ORESULT_CUR

  for (let i = 0; i < searchedData2.value.length; i++) {
  let obj = searchedData2.value[i];
  for (let key in obj) {
    if (obj[key] === null) {
      obj[key] = ''; // NULL을 빈 문자열로 변경
    }
  }
}

  grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
  cellStyle(res.ORESULT_CUR)
}

// tab2 btnUpdate 실행 전
const beforeSave2 = () => {
  return validationCheck2()
}

// tab2 btnUpdate 실행
const saveData2 = () => {  
  saveParams = []
  let stateCheckedRows = grdSub1.value.getGridView().getCheckedRows()

  for (let rowIdx of stateCheckedRows) {
    let data = grdSub1.value.getDataProvider().getJsonRow(rowIdx)
    data.CMPNY_DIV = userStore.cmpnyDiv
    data.USER_ID = userStore.userId
    data.INS_DATE = data.INS_DATE ? dayjs(data.INS_DATE).format('YYYYMMDD') : null
    data.SOL_SEND_DATE = data.SOL_SEND_DATE ? dayjs(data.SOL_SEND_DATE).format('YYYYMMDD') : null
    data.SOL_DATE = data.SOL_DATE ? dayjs(data.SOL_DATE).format('YYYYMMDD') : null
    saveParams.push(data)
  }
  // console.log('saveParams:',saveParams)
  return commonExecuteApi({ queryId : 'MNGEE0010_SAVE_03', list: saveParams })
}

// tab2 저장, 삭제전 사용자 정의 validation
const validationCheck2 = () => {
  let chekedRow = grdSub1.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  } else {
    for (let rowIdx of chekedRow) {
      let data = grdSub1.value.getDataProvider().getJsonRow(rowIdx)
      // console.log('data:',data)
      if(data.SOL_CONTENT.length === 0) {
        Message.warn('시정조치 내용은 필수입력입니다.')
        return false
      }
      else if(data.SOL_DATE.length === 0) {
        Message.warn('조치(예정)일은 필수입력입니다.')
        return false
      }
    } 
    return true
  }
} 


// tab 변경 이벤트
const tabClick = tab => {
  if(tab === 'one'){
    // console.log('codeList.DEPT_CD:',codeList.DEPT_CD)
    grdMain.value.setBindingColumn("COMP_YN", codeList.GRD_COMP_YN, "COD", "TXT")
    grdMain.value.setBindingColumn('INS_RST', codeList.INS_RST, 'COD', 'TXT')
    onButtonsClick({ id :'btnSearch' })
  }
  else if(tab === 'two'){
    grdSub1.value.setBindingColumn("COMP_YN", codeList.GRD_COMP_YN, "COD", "TXT")
    grdSub1.value.setBindingColumn("STATUS", codeList.GRD_STATUS, "COD", "TXT")

    onButtonsClick2({ id :'btnSearch' })
  }

}

const popupParams = reactive({
  ROW_IDX : 0,
})

// 각종 팝업 처리
const popupOpen = (grid, clickInfo, column) => {  
  popupParams.ROW_IDX = clickInfo.itemIndex
  let row
  if(tab.value === 'one'){
    row = grdMain.value.getRowData(clickInfo.itemIndex)
  }
  else{
    row = grdSub1.value.getRowData(clickInfo.itemIndex)
  }

  if(clickInfo.fieldName === 'DEPT_NM'){
    gridDeptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : row.DEPT_NM, pageGbn : 'MNG' })
  }
  else if(clickInfo.fieldName === 'INS_EMP_NM'){
    gridEmpPopup.value.openPopup({ EMP_NM : row.INS_EMP_NM, DISABLE:["전체","사내협력사","단기공사","기타"], })    
  }
  else if(clickInfo.fieldName === 'LAW_NM'){
    let lawArr = []
    grdMain.value.getDataProvider().getJsonRows().forEach(ele => {
      lawArr.push(ele.LAW_CD)
    })

    mNGEB0010PopTab1Popup.value.openPopup({
      SELECT_YN : 'Y',
      LAW_CD_ARR: lawArr
    })
  }
}

//법령 팝업 선택 결과
const onMNGEB0010PopTab1PopupSelected = res =>{
  // console.log('법령 팝업 선택 결과 : ',res) 
  
  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'LAW_CD', res[0].LAW_CD)
  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'LAW_NM', res[0].LAW_NM)
  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'LAW_NM1', res[0].LAW_NM1)
  grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'LAW_NM2', res[0].LAW_NM2)

  grdMain.value.getGridView().checkItem(popupParams.ROW_IDX, true)
}

const fileID = ref('')
const rowData = ref('')
const uploadVisible = ref('')
// 셀 클릭 이벤트
const onCellItemClicked = (grid, index, col) => {
  // console.log('col:',col,' tab.value:',tab.value)

  // console.log('rowData:',rowData.value)
  if(tab.value === 'one'){
    rowData.value = grdMain.value.getDataProvider().getJsonRow(col.dataRow)
    if (col.field === 5) {
      // 점검 결과 부적합 내용 사진 첨부
      fileID.value = ''
      buttonList.length = 0
      buttonList.push(['btnFileUpload', 'btnDownLoad', 'btnDelete', 'btnClose']) 
      uploadVisible.value = true

      // 첨부 id 생성
      imageViewerPopup.value.setGuid()
      //fileID에 가지고 있음
      fileID.value = rowData.value.FAIL_FILE_ID ? rowData.value.FAIL_FILE_ID : imageViewerPopup.value.guid
      //grid에 fileID 입력
      grdMain.value.getDataProvider().setValue(col.dataRow, 'FAIL_FILE_ID', rowData.value.FAIL_FILE_ID ? rowData.value.FAIL_FILE_ID : imageViewerPopup.value.guid)
      
      
      if(rowData.value.INS_CD){
        // 결과 코드(key값)가 있으면 첨부 id를 업데이트해줌 (저장 된 row는 없데이트, 저장 안 된 row는 그냥 변수에만 담아둠)
        rowData.value.FAIL_FILE_ID = fileID.value
        commonExecuteApi({ queryId : 'MNGEE0010_SAVE_02', list: [rowData.value] })
      } 

      imageViewerPopup.value.openPopup(fileID.value)
    }  
    else if(col.field === 11){
      // 시정조치 사진 보기
      fileID.value = ''
      buttonList.length = 0
      buttonList.push(['btnDownLoad','btnClose']) 
      uploadVisible.value = false

      imageViewerPopup.value.setGuid()
      fileID.value = rowData.value.SOL_FILE_ID ? rowData.value.SOL_FILE_ID : imageViewerPopup.value.guid
      // console.log('SOL_FILE_ID:',fileID.value)
      imageViewerPopup.value.openPopup(fileID.value)
    }
  }else{
    rowData.value = grdSub1.value.getDataProvider().getJsonRow(col.dataRow)
    if(col.field === 4){
      // 점검결과 부적합 내용 보기
      fileID.value = ''
      buttonList.length = 0
      buttonList.push(['btnDownLoad','btnClose']) 
      uploadVisible.value = false

      imageViewerPopup.value.setGuid()
      fileID.value = rowData.value.FAIL_FILE_ID ? rowData.value.FAIL_FILE_ID : imageViewerPopup.value.guid
      // console.log('FAIL_FILE_ID:',fileID.value) 
      imageViewerPopup.value.openPopup(fileID.value)
    }
    else if(col.field === 6){
      // 시정조치 사진 첨부
      fileID.value = ''
      buttonList.length = 0
      buttonList.push(['btnFileUpload', 'btnDownLoad', 'btnDelete', 'btnClose']) 
      uploadVisible.value = true

      // 첨부 id 생성
      imageViewerPopup.value.setGuid()
      //fileID에 가지고 있음
      fileID.value = rowData.value.SOL_FILE_ID ? rowData.value.SOL_FILE_ID : imageViewerPopup.value.guid
      //grid에 fileID 입력
      grdSub1.value.getDataProvider().setValue(col.dataRow, 'SOL_FILE_ID', rowData.value.SOL_FILE_ID ? rowData.value.SOL_FILE_ID : imageViewerPopup.value.guid)
      
      // console.log('rowData.value:',rowData.value)
      
      if(rowData.value.INS_CD){
        // 결과 코드(key값)가 있으면 첨부 id를 업데이트해줌 (저장 된 row는 없데이트, 저장 안 된 row는 그냥 변수에만 담아둠)
        rowData.value.FAIL_FILE_ID = fileID.value
        commonExecuteApi({ queryId : 'MNGEE0010_SAVE_02', list: [rowData.value] })
      }

      imageViewerPopup.value.openPopup(fileID.value)
    }
  }
}

const uploaded = () => {
  // console.log('uploaded 됨 id : ',fileID.value)
  // console.log('rowData:',rowData.value)
  if(tab.value === 'one'){

    rowData.value.FAIL_FILE_ID = fileID.value
    rowData.USER_ID = userStore.userId
    saveParams.push(rowData)

  // console.log('saveParams:',saveParams)
  return commonExecuteApi({ queryId : 'MNGEE0010_SAVE_02', list: saveParams })

  }
  if(tab.value === 'two'){

  rowData.value.FAIL_FILE_ID = fileID.value
  rowData.USER_ID = userStore.userId
  saveParams.push(rowData)

  // console.log('saveParams:',saveParams)
  return commonExecuteApi({ queryId : 'MNGEE0010_SAVE_02', list: saveParams })

  }
}

const viewerClosed = val => {
  if(tab.value === 'one'){
    onButtonsClick({ id :'btnSearch' }) 
  }else {
    onButtonsClick2({ id :'btnSearch' }) 
  }
  
}

const setButton = () => {
  menuTitle.value.setBtnProperty('btnDelete', 'visible', false)  
  if(logsStore.isMenuAdmin === 'Y'){
    menuTitle.value.setBtnProperty('btnDelete', 'visible', true)  
  }
} 

//초기 데이터셋팅
onMounted(() => {
  initCodeList()
  onButtonsClick({ id :'btnSearch' })
})
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2">
      <IMenuTitle
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>

    <v-card-text class="pa-2 content-area p-relative">
      <v-sheet height="100%" min-height="700" class="d-flex flex-column fill-height">
      <!-- tab (안전부서 / 현업부서) -->
        <VTabs v-model="tab" @click="tabClick(tab)">
          <VTab value="one">안전/환경</VTab>
          <VTab value="two">생산/지원</VTab>
        </VTabs>

          
            <template v-if="tab == 'one'"> <!-- 안전부서 -->
              <IGridTitle
                ref="menuTitle"
                class="mt-2"
                :button-list="['btnCreate','btnSearch','btnUpdate', 'btnDelete', 'btnPrint', 'btnMailCAReport']"
                @click-button="onButtonsClick"
              />

              <!-- 조회조건 -->
                <v-sheet class="searchArea">
                  <v-sheet class="d-flex">
                    <!-- <i-input 
                      :label="$t('부서/ 협력사')"
                      label-width="90px"
                      width="410px"
                      v-model="searchParams.ASGN_NM" 
                      append-inner-icon="mdi-magnify" 
                      @keydown.enter="e => {
                        openPopup('부서조회1')
                      }"
                      @update:modelValue="e => { searchParams.DEPT_CD = null }"
                      @click:appendInner="openPopup('부서조회1')"
                      margin="4px"
                    />
                    <i-input
                      v-model="searchParams.DEPT_CD" 
                      readonly
                      width="100px"
                    /> -->

                    <i-select 
                      :label="$t('사업부')"
                      labelWidth="90px"
                      width="350px"
                      v-model="searchParams.BSNS_CD"
                      :items="codeList.BSNS"
                      item-value="BSNS_CD"
                      item-title="BSNS_NM"
                    />

                    <!-- 점검일자 -->
                    <i-input label-width="80px" width="230px" :label="$t('점검일자')" v-model="searchParams.FROM_DATE" type="date"/>
                    <i-input label-width="10px" width="160px" :label="$t('-')" v-model="searchParams.TO_DATE" type="date"/>

                    <!-- 점검자 -->
                    <i-input 
                      :label="$t('점검자')"
                      label-width="60px"
                      width="200px"
                      v-model="searchParams.INS_EMP_NM" 
                      @click:appendInner="openEmpPopup('인원조회')"
                      @keydown.enter="
                        (e) => {
                          openEmpPopup('인원조회') 
                        }
                      "
                      @update:modelValue="e => { searchParams.INS_EMP_NO = '' }"
                      append-inner-icon="mdi-magnify"
                    />
                  </v-sheet>
                  <v-sheet class="d-flex mt-2">
                    <!-- 관련법규 -->
                    <i-select 
                      :label="$t('관련법규')"
                      labelWidth="90px"
                      width="350px"
                      v-model="searchParams.LAW_CD"
                      :items="codeList.LAW_CD"
                      item-value="COD"
                      item-title="TXT"
                    />

                    <!-- 조치여부 -->
                    <i-select 
                      :label="$t('조치여부')"
                      labelWidth="80px"
                      width="230px"
                      v-model="searchParams.COMP_YN"
                      :items="codeList.COMP_YN"
                      item-value="COD"
                      item-title="TXT"
                    />
                  </v-sheet>
              </v-sheet>
              <!-- /조회조건 -->
              
              <!-- 메인그리드 -->
              <v-sheet class="h-auto">
                <!-- style="height: calc(100vh - 380px)" -->
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
                @onCellButtonClicked="popupOpen"
                @onCellItemClicked="onCellItemClicked"
              />
            </v-sheet>
              <!-- /메인그리드 -->

            </template> <!-- /안전부서 -->

            <template v-if="tab == 'two'"> <!-- 현업부서 -->
              <IGridTitle
                class="mt-2"
                :button-list="['btnSearch','btnUpdate','btnPrint', 'btnReqApply']"
                @click-button="onButtonsClick2"
              />

              <!-- 조회조건 -->
              <v-sheet class="searchArea">
                  <v-sheet class="d-flex">
                    <i-input 
                      :label="$t('부서/ 협력사')"
                      label-width="90px"
                      width="410px"
                      readonly
                      v-model="searchParams2.ASGN_NM" 
                      @update:modelValue="e => { searchParams2.DEPT_CD = null }"
                      margin="4px"
                      />
                      <!-- append-inner-icon="mdi-magnify"  -->
                      <!-- @keydown.enter="e => {
                        openPopup('부서조회2')
                      }" -->
                      <!-- @click:appendInner="openPopup('부서조회2')" -->
                    <i-input
                      v-model="searchParams2.DEPT_CD" 
                      readonly
                      width="100px"
                    />

                    <!-- 점검일자 -->
                    <i-input label-width="80px" width="230px" :label="$t('점검일자')" v-model="searchParams2.FROM_DATE" type="date"/>
                    <i-input label-width="10px" width="160px" :label="$t('-')" v-model="searchParams2.TO_DATE" type="date"/>

                    <!-- 점검자 -->
                    <i-input 
                      :label="$t('점검자')"
                      label-width="60px"
                      width="200px"
                      v-model="searchParams2.INS_EMP_NM" 
                      @click:appendInner="openEmpPopup('인원조회')"
                      @keydown.enter="
                        (e) => {
                          openEmpPopup('인원조회')
                        }
                      "
                      @update:modelValue="e => { searchParams2.INS_EMP_NO = '' }"
                      append-inner-icon="mdi-magnify"
                    />
                  </v-sheet>
                  <v-sheet class="d-flex mt-2">

                    <!-- 결재상태 -->
                    <i-select 
                      :label="$t('결재상태')"
                      labelWidth="90px"
                      width="230px"
                      v-model="searchParams2.STATUS"
                      :items="codeList.STATUS"
                      item-value="COD"
                      item-title="TXT"
                    />

                    <!-- 조치여부 -->
                    <i-select 
                      :label="$t('조치여부')"
                      style="margin-left:45px;"
                      labelWidth="70px"
                      width="220px"
                      v-model="searchParams2.COMP_YN"
                      :items="codeList.COMP_YN"
                      item-value="COD"
                      item-title="TXT"
                    />

                     <!-- 조치 예정일 -->
                     <i-input label-width="80px" width="230px" :label="$t('조치예정일')" v-model="searchParams2.SOL_DATE_FROM" type="date"/>
                    <i-input label-width="10px" width="160px" :label="$t('-')" v-model="searchParams2.SOL_DATE_TO" type="date"/>
                  </v-sheet>
              </v-sheet>
              <!-- /조회조건 -->

              <!-- 메인그리드 -->
              <v-sheet class="h-auto">
              <RealGrid
                ref="grdSub1"
                :grid-view-option="grdSub1Props.gridViewOption"
                :keys="grdSub1Props.keys" 
                :fields="grdSub1Props.fields"
                :columns="grdSub1Props.columns"
                :column-layout="grdSub1Props.columnLayout"
                @onCellButtonClicked="popupOpen"
                @onCellItemClicked="onCellItemClicked"
              />
            </v-sheet>
              <!-- /메인그리드 -->
            </template> <!-- /현업부서 -->


        
        <!-- /tab (안전부서 / 현업부서) -->
        
         <!-- OZReport -->
        <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
        <!-- UPLOAD 팝업 -->
        <!-- <IUploadPopup ref="fileUploadPopup" @uploaded="uploaded" /> -->
        <!-- IMAGE 미리보기 팝업 -->
        <ImageViewerPopup ref="imageViewerPopup" :buttonList="buttonList[0]" @uploaded="uploaded" @closed="viewerClosed" :isVisibled="uploadVisible" />
        <!-- 부서/ 협력사 팝업 -->
        <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
        <DeptPopup ref="gridDeptPopup" @selected="onGridDeptSelected"/>
        <!-- 인원조회 팝업 -->
        <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
        <EmpPopup ref="gridEmpPopup" @selected="onGridEmpSelected"></EmpPopup>
        <!-- 시정조치서 발송 -->
        <mNGEE0010Popup ref="mNGEE0010Popup" @search="() => { onButtonsClick({ id: 'btnSearch' }) }"/>
        <!-- @after-search="() => onButtonsClick({ id: 'btnSearch' })" -->
        <!-- 법령 검색 팝업 -->
        <MNGEB0010PopTab1Popup ref="mNGEB0010PopTab1Popup" @selected="onMNGEB0010PopTab1PopupSelected" :visibleCk="false"/>
        <!-- 결재 팝업 -->
        <ApprovalPopup ref="approvalPopup" />
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  height: calc(100vh - 105px);
  overflow-y: auto;
}
</style>
