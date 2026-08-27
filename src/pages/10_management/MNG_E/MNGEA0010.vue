<!--
  화면명 : MNGEA0010.vue
  화면개요 :관계법령 현황(안전보건법령 / 환경법령)
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
import EmpPopup from '@/components/popup/EmpPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import MNGEA0010Popup from './MNGEA0010Popup .vue'

defineOptions({
    name:'10_management-MNG_E-MNGEA0010',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const searchArea = ref(null)
const deptPopup = ref(null)
const empPopup = ref(null)
const grdMain = ref(null)
const grdSub1 = ref(null)
const tab = ref('S')
const mNGEA0010Popup = ref(null)

const saveParam = ref(null)

const searchParams_S = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  LAW_NM : '',
  GUBN : '',
})

const searchParams_E = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  LAW_NM : '',
  GUBN : '',
})

const popupParams = reactive({
  DEPT_NM : '',
  DEPT_CD : '',
  EMP_CD    : '',
  EMP_NM    : '',
  ROW_IDX : 0,
  COL_NM : '',
  COL_CD : '',
})

const arrList = reactive({
  SLIST: [],
  ELIST: [],
})

let searchParam = {
    CMPNY_DIV 	 : userStore.cmpnyDiv,
    ALL_SYS_CD   : userStore.cmpnyDiv,
  }

const lawCdArr = reactive({
  SARR : '',
  EARR: '',
  GUBN: '',
  GUBN2: '',
})

const GubnArrOrgin = ref()

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
    commonSearchApi({ queryId : 'MNGEA0020_SEARCH_01', param: {
        CMPNY_DIV 	 : userStore.cmpnyDiv,
        ALL_SYS_CD   : userStore.cmpnyDiv,
      } 
    }),
    commonSearchApi({ 
      queryId : 'LAW_DIV_SEARCH', 
      param: {
        CMPNY_DIV : userStore.cmpnyDiv,
        ALL_UP_CD : 'HHI.D',
        UP_CD : 'HHI',
        USE_FLAG : 'Y',
      } 
    }),
  ]).then(res => {
    console.log('res[2].ORESULT_CUR:',res[2].ORESULT_CUR)
    lawCdArr.SARR = []
    lawCdArr.EARR = []
    lawCdArr.SARR = res[0].ORESULT_CUR.filter((data) => data.CODE_DESC1 === '안전')
    lawCdArr.EARR = res[0].ORESULT_CUR.filter((data) => data.CODE_DESC1 === '환경')
    // console.log('lawCdArr.SARR:',lawCdArr.SARR)
    // console.log('lawCdArr.EARR:',lawCdArr.EARR)

    if(tab.value === 'S'){
      grdMain.value.setBindingColumn("DIV_CD", lawCdArr.SARR, "COD", "TXT")
    }
    if(tab.value === 'E'){
      grdSub1.value.setBindingColumn("DIV_CD", lawCdArr.EARR, "COD", "TXT")
    } 

    lawCdArr.GUBN = []
    lawCdArr.GUBN = res[2].ORESULT_CUR.filter((data) => data.ALL_UP_CD === 'HHI.D')
    lawCdArr.GUBN2 = res[2].ORESULT_CUR.filter((data) => data.ALL_UP_CD === 'HHI.D')

    grdMain.value.setBindingColumn("GUBN_DETAIL", lawCdArr.GUBN, "COD", "TXT")
    grdMain.value.setBindingColumn("GUBN_DETAIL", lawCdArr.GUBN2, "COD", "TXT")

    GubnArrOrgin.value = res[2].ORESULT_CUR
  }).finally(()=>{
    onButtonsClick({ id :'btnSearch' })
  })
}

const SLAW = reactive([])

const selectArr = (res, code) =>{
  let list = []
  res.forEach(ele =>{
    if(ele.COD.includes(code)){
      list.push(ele)
    }
  })

  return list
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL1'],
  fields : [ 
    { fieldName: 'DIV_CD', dataType: 'text', width: '200',
      header: { text: t('법령명') , styleName: 'header_validit'},
      required: true, requiredMessage: '[법령명]은 필수입니다.',
      editable: true, lookupDisplay: true, editor: { type: 'list', dropDownWhenClick: true }, styleName: 'editable_column',
      mergeRule: { criteria: "value" },
    },
    { fieldName: 'LAW_NM1', dataType: 'number', numberFormat: '#,###', width: '50', header: { text: t('조') , styleName: 'header_validit'}, required: true, requiredMessage: '[조]는 필수입니다.' },
    { fieldName: 'LAW_NM2', dataType: 'number', numberFormat: '#,###', width: '50', header: { text: t('항') } },
    { fieldName: 'LE_TXT', dataType: 'text', header: { text: t('조문') }},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('관련 조직') } , button : 'action', editable: false},
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false},
    { fieldName: 'BSNS_NM', dataType: 'text', visible: false},
    { fieldName: 'ORGN', dataType: 'text', visible: false},
    
    { fieldName: 'PMG_DATE', dataType: 'text', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('공포일자') , styleName: 'header_validit'}, required: true, requiredMessage: '[공포일자]는 필수입니다.'  },
    
    { fieldName: 'ACT_DATE', dataType: 'text', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('시행일자') , styleName: 'header_validit'}, required: true, requiredMessage: '[시행일자]는 필수입니다.'  },

    { fieldName: 'CHK_DATE', dataType: 'text', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      //editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('제·개정 내역 확인일') }, editable: false, },

    { fieldName: 'MNG_NM', dataType: 'text', header: { text: t('제·개정 내역 입수 담당자') , styleName: 'header_validit'}, required: true, requiredMessage: '[제·개정 내역 입수 담당자]는 필수입니다.'  , button : 'action'},
    
    { fieldName: 'COMP_DATE', dataType: 'text', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      //editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('제·개정 내역 조치일')}, editable: false,  },

    { fieldName: 'GUBN_DETAIL', dataType: 'text', width: '50', header: { text: t('항목 분류') } ,
      editable: true, lookupDisplay: true, editor: { type: 'list', dropDownWhenClick: true }, 
    },

    { fieldName: 'GUBN_DETAIL2_KR', dataType: 'text', width: '50', header: { text: t('항목 세분류') } ,
      editable: true, lookupDisplay: true, editor: { type: 'list', dropDownWhenClick: true }, 
    },
    { fieldName: 'GUBN_DETAIL2', dataType: 'text', visible: false },

    { fieldName: 'LAW_CD', dataType: 'text', visible: false },
    // { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'MNG_ID', dataType: 'text', visible: false },
    // { fieldName: 'LAW_CD', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
    'DIV_CD',
    'LAW_NM1',
    'LAW_NM2',
    'LE_TXT',
    'DEPT_NM',
    'PMG_DATE',
    'ACT_DATE',
    'CHK_DATE',
    'MNG_ID',
    'COMP_DATE',
    'GUBN_DETAIL',
    'GUBN_DETAIL2_KR',
  ]
})

grdMainProps.columns = grdMainProps.fields

const grdSub1Props = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL1'],
  fields : [ 
    { fieldName: 'DIV_CD', dataType: 'text', width: '200',
      header: { text: t('법령명') , styleName: 'header_validit'},
      required: true, requiredMessage: '[법령명]은 필수입니다.',
      editable: true, lookupDisplay: true, editor: { type: 'list', dropDownWhenClick: true }, styleName: 'editable_column'
    },
    { fieldName: 'LAW_NM1', dataType: 'text', width: '50', header: { text: t('조') , styleName: 'header_validit'}, required: true, requiredMessage: '[조]는 필수입니다.' },
    { fieldName: 'LAW_NM2', dataType: 'text', width: '50', header: { text: t('항') } },
    { fieldName: 'LE_TXT', dataType: 'text', header: { text: t('조문') }},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('관련 조직') } , button : 'action', editable: false},
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false},
    { fieldName: 'BSNS_NM', dataType: 'text', visible: false},
    { fieldName: 'ORGN', dataType: 'text', visible: false},
    
    { fieldName: 'PMG_DATE', dataType: 'text', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('공포일자') , styleName: 'header_validit'}, required: true, requiredMessage: '[공포일자]는 필수입니다.'  },
    
    { fieldName: 'ACT_DATE', dataType: 'text', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('시행일자') , styleName: 'header_validit'}, required: true, requiredMessage: '[시행일자]는 필수입니다.'  },

    { fieldName: 'CHK_DATE', dataType: 'text', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      //editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', editable: false, mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('제·개정 내역 확인일') }, editable: false, },

    { fieldName: 'MNG_NM', dataType: 'text', header: { text: t('제·개정 내역 입수 담당자') , styleName: 'header_validit'}, required: true, requiredMessage: '[제·개정 내역 입수 담당자]는 필수입니다.'  , button : 'action'},
    
    { fieldName: 'COMP_DATE', dataType: 'text', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      //editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', editable: false, mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      header: { text: t('제·개정 내역 조치일')}, editable: false,  },

    { fieldName: 'GUBN_DETAIL', dataType: 'text', width: '50', header: { text: t('항목 분류') } ,
      editable: true, lookupDisplay: true, editor: { type: 'list', dropDownWhenClick: true },
    },

    { fieldName: 'GUBN_DETAIL2_KR', dataType: 'text', width: '50', header: { text: t('항목 세분류') } ,
      editable: true, lookupDisplay: true, editor: { type: 'list', dropDownWhenClick: true },
    },
    { fieldName: 'GUBN_DETAIL2', dataType: 'text', visible: false },

    // { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'MNG_ID', dataType: 'text', visible: false },
    { fieldName: 'LAW_CD', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
    'DIV_CD',
    'LAW_NM1',
    'LAW_NM2',
    'LE_TXT',
    'DEPT_NM',
    'PMG_DATE',
    'ACT_DATE',
    'CHK_DATE',
    'MNG_ID',
    'COMP_DATE',
    'GUBN_DETAIL',
    'GUBN_DETAIL2_KR',
  ]
})

grdSub1Props.columns = grdSub1Props.fields

/* 버튼 처리 */
const onButtonsClick = async btn => {
  //console.log('btn:',btn,' / tab.value:',tab.value)
  if(btn.id === 'btnLaw'){
    window.open('https://www.moleg.go.kr/') 
  }
  if(tab.value === 'S'){
    searchParams_S.GUBN = tab.value

    if(btn.id === 'btnSearch'){
      new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData_S)
      .setAfter(afterSearch_S)
      .run()
    }
    else if(btn.id === 'btnCreate'){
      grdMain.value.addRow({})
    }
    else if(btn.id === 'btnUpdate'){
      new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave_S)      
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
    }
    else if(btn.id === 'btnDelete'){
      new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave_S)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
    }
  }
  else if(tab.value === 'E'){
    searchParams_E.GUBN = tab.value

    if(btn.id === 'btnSearch'){
      new queryFlowHelper(vm, t)
      .setGridList([grdSub1])
      .setQuery(searchData_E)
      .setAfter(afterSearch_E)
      .run()
    }
    else if(btn.id === 'btnCreate'){
      grdSub1.value.addRow({})
    }
    else if(btn.id === 'btnUpdate'){
      new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub1, row: null }])
      .setGridList([grdSub1])
      .setBefore(beforeSave_E)      
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()

    }
    else if(btn.id === 'btnDelete'){
      new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub1, row: null }])
      .setGridList([grdSub1])
      .setBefore(beforeSave_E)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
    }
  }
}

const searchData_S = idx => {
  return commonSearchApi({ queryId : 'MNGEA0010_SEARCH_01', param: searchParams_S })
}

const afterSearch_S = res => {
  res.ORESULT_CUR.forEach(e => {
    if(e.GUBN_DETAIL){
      // 분류 코드의 길이 확인하여 1보다 크면 세분류로 판단
      if(e.GUBN_DETAIL.length>1){
          e.GUBN_DETAIL2 = e.GUBN_DETAIL
          e.GUBN_DETAIL = e.GUBN_DETAIL.substr(0,1)
          e.GUBN_DETAIL2_KR = GubnArrOrgin.value.find(item => item.COD === e.GUBN_DETAIL2).TXT
        }
      }
  })
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const beforeSave_S = () => {
  saveParam.value = []

  let result = true

  // 상태바가 체크된 항목
  let chekedRow = grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    result = false
  } else {
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.CMPNY_DIV = searchParams_S.CMPNY_DIV
      data.GUBN = searchParams_S.GUBN
      data.GUBN_DETAIL = data.GUBN_DETAIL2 ? data.GUBN_DETAIL2 : data.GUBN_DETAIL
      data.ACT_DATE = data.ACT_DATE ? dayjs(data.ACT_DATE).format('YYYYMMDD') : null
      data.CHK_DATE = data.CHK_DATE ? dayjs(data.CHK_DATE).format('YYYYMMDD') : null
      data.COMP_DATE = data.COMP_DATE ? dayjs(data.COMP_DATE).format('YYYYMMDD') : null
      data.PMG_DATE = data.PMG_DATE ? dayjs(data.PMG_DATE).format('YYYYMMDD') : null

      saveParam.value.push(data)
    })
  }
  // console.log('beforeSave_S saveParam:',saveParam)
  return result
}

const searchData_E = idx => {
  return commonSearchApi({ queryId : 'MNGEA0010_SEARCH_01', param: searchParams_E })
}

const afterSearch_E = res => {
  res.ORESULT_CUR.forEach(e => {
    if(e.GUBN_DETAIL){
      // 분류 코드의 길이 확인하여 1보다 크면 세분류로 판단
      if(e.GUBN_DETAIL.length>1){
          e.GUBN_DETAIL2 = e.GUBN_DETAIL
          e.GUBN_DETAIL = e.GUBN_DETAIL.substr(0,1)
          e.GUBN_DETAIL2_KR = GubnArrOrgin.value.find(item => item.COD === e.GUBN_DETAIL2).TXT
        }
      }
  })
  grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const beforeSave_E = () => {
  saveParam.value = []

  let result = true

  // 상태바가 체크된 항목
  let chekedRow = grdSub1.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    result = false
  } else {
    chekedRow.forEach( val => {
      let data = grdSub1.value.getDataProvider().getJsonRow(val)
      data.CMPNY_DIV = searchParams_E.CMPNY_DIV
      data.GUBN = searchParams_E.GUBN
      data.GUBN_DETAIL = data.GUBN_DETAIL2 ? data.GUBN_DETAIL2 : data.GUBN_DETAIL
      data.ACT_DATE = data.ACT_DATE ? dayjs(data.ACT_DATE).format('YYYYMMDD') : null
      data.CHK_DATE = data.CHK_DATE ? dayjs(data.CHK_DATE).format('YYYYMMDD') : null
      data.COMP_DATE = data.COMP_DATE ? dayjs(data.COMP_DATE).format('YYYYMMDD') : null
      data.PMG_DATE = data.PMG_DATE ? dayjs(data.PMG_DATE).format('YYYYMMDD') : null
      
      saveParam.value.push(data)
    })
  }
  return result
}

const saveData = () => {
  return commonExecuteApi({ queryId : 'MNGEA0010_SAVE_01', list: saveParam.value })
}

const deleteData = () => {  
  return commonExecuteApi({ queryId : 'MNGEA0010_DELETE_01', list: saveParam.value })
}


const tabClick = tab => {
  if(tab === 'S'){
    grdMain.value.setBindingColumn("DIV_CD", lawCdArr.SARR, "COD", "TXT")
    grdMain.value.setBindingColumn("GUBN_DETAIL", lawCdArr.GUBN, "COD", "TXT")
    onButtonsClick({ id :'btnSearch' })
  }
  else if(tab === 'E'){
    grdSub1.value.setBindingColumn("DIV_CD", lawCdArr.EARR, "COD", "TXT")
    grdSub1.value.setBindingColumn("GUBN_DETAIL", lawCdArr.GUBN, "COD", "TXT")
    onButtonsClick({ id :'btnSearch' })
  }

}


const onEditRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  if(tab.value === 'S'){
    let fieldName = grdMain.value.getDataProvider().getFieldName(field)
    if(fieldName === 'DEPT_NM'){
      grid.commit()
      const clickInfo = ref({
        column: 'DEPT_NM',
        dataRow: dataRow,
        fieldIndex : field,
        fieldName: "DEPT_NM",
        itemIndex: itemIndex,
      })
      popupOpen(grid, clickInfo.value,'')
    }
    else if(fieldName === 'MNG_ID'){
      grid.commit()
      const clickInfo = ref({
        column: 'MNG_NM',
        dataRow: dataRow,
        fieldIndex : field,
        fieldName: "MNG_NM",
        itemIndex: itemIndex,
      })
      popupOpen(grid, clickInfo.value,'')
    }
    else if(fieldName === 'GUBN_DETAIL'){
      grid.commit()
     // newValue 가 A인 경우 A하위 인 거를 가지고 GUBN_DETAIL2에 넣을 수 있게
     const result = GubnArrOrgin.value
        .filter(item => item.ALL_UP_CD === ('HHI.D.'+newValue))
        .map(item => ({ TXT: item.TXT }))
      grdMain.value.getDataProvider().setValue(dataRow, 'GUBN_DETAIL2_KR', '')
      grdMain.value.getDataProvider().setValue(dataRow, 'GUBN_DETAIL2', '')
      grdMain.value.setBindingColumn("GUBN_DETAIL2_KR", result, "TXT", "TXT")
    }
    else if(fieldName === 'GUBN_DETAIL2_KR'){
      grid.commit()
      let data = grdMain.value.getDataProvider().getJsonRow(dataRow)
      let newCod = GubnArrOrgin.value
      .filter(item => item.ALL_UP_CD === ('HHI.D.'+data.GUBN_DETAIL))
      .filter(item => item.TXT === newValue)[0].COD
      grdMain.value.getDataProvider().setValue(dataRow, 'GUBN_DETAIL2', newCod)
    }
  }
  else if(tab.value === 'E'){
    let fieldName = grdSub1.value.getDataProvider().getFieldName(field)
    if(fieldName === 'DEPT_NM'){
      grid.commit()
      const clickInfo = ref({
        column: 'DEPT_NM',
        dataRow: dataRow,
        fieldIndex : field,
        fieldName: "DEPT_NM",
        itemIndex: itemIndex,
      })
      popupOpen(grid, clickInfo.value,'')
    }
    else if(fieldName === 'MNG_ID'){
      grid.commit()
      const clickInfo = ref({
        column: 'MNG_NM',
        dataRow: dataRow,
        fieldIndex : field,
        fieldName: "MNG_NM",
        itemIndex: itemIndex,
      })
      popupOpen(grid, clickInfo.value,'')
    }
    else if(fieldName === 'GUBN_DETAIL'){
      grid.commit()
     // newValue 가 A인 경우 A하위 인 거를 가지고 GUBN_DETAIL2에 넣을 수 있게
     const result = GubnArrOrgin.value
        .filter(item => item.ALL_UP_CD === ('HHI.D.'+newValue))
        .map(item => ({ TXT: item.TXT }))
      grdSub1.value.getDataProvider().setValue(dataRow, 'GUBN_DETAIL2_KR', '')
      grdSub1.value.getDataProvider().setValue(dataRow, 'GUBN_DETAIL2', '')
      grdSub1.value.setBindingColumn("GUBN_DETAIL2_KR", result, "TXT", "TXT")
    }
    else if(fieldName === 'GUBN_DETAIL2_KR'){
      grid.commit()
      let data = grdSub1.value.getDataProvider().getJsonRow(dataRow)
      let newCod = GubnArrOrgin.value
      .filter(item => item.ALL_UP_CD === ('HHI.D.'+data.GUBN_DETAIL))
      .filter(item => item.TXT === newValue)[0].COD
      grdSub1.value.getDataProvider().setValue(dataRow, 'GUBN_DETAIL2', newCod)
    }
  }
}

const onCurrentRowChanged = (grid, oldRow, newRow) => {
  let getRow
  if(tab.value === 'S'){
    getRow = grdMain.value.getDataProvider().getJsonRow(newRow)
    const result = GubnArrOrgin.value
        .filter(item => item.ALL_UP_CD === ('HHI.D.'+getRow.GUBN_DETAIL))
        .map(item => ({ TXT: item.TXT }))

    grdMain.value.setBindingColumn("GUBN_DETAIL2_KR", result, "TXT", "TXT")
  }
  else if(tab.value === 'E'){
    getRow = grdSub1.value.getDataProvider().getJsonRow(newRow)
    const result = GubnArrOrgin.value
        .filter(item => item.ALL_UP_CD === ('HHI.D.'+getRow.GUBN_DETAIL))
        .map(item => ({ TXT: item.TXT }))

    grdSub1.value.setBindingColumn("GUBN_DETAIL2_KR", result, "TXT", "TXT")
  }
}

const popupOpen = (grid, clickInfo, column) => {  
  popupParams.ROW_IDX = clickInfo.itemIndex
  let row
  if(tab.value === 'S'){
    row = grdMain.value.getRowData(clickInfo.itemIndex)
  }
  else{row = grdSub1.value.getRowData(clickInfo.itemIndex)}

  if(clickInfo.fieldName === 'DEPT_NM'){
    // deptPopup.value.openPopup({ CMPNY_DIV: userStore.cmpnyDiv, HSE_ONLY : 'Y', ASGN_NM : row.DEPT_NM, pageGbn : 'MNG' })
    mNGEA0010Popup.value.openPopup({ 
      DEPT_NM : row.DEPT_NM, 
      DEPT_CD : row.DEPT_CD, 
      BSNS_NM : row.BSNS_NM, 
      ORGN : row.ORGN 
    })
  }
  else if(clickInfo.fieldName === 'MNG_NM'){
    empPopup.value.openPopup({ EMP_NM : row.MNG_NM, DISABLE:["전체","사내협력사","단기공사","기타"], })    
  }
}

// const onDeptSelected = val => {
//   if(tab.value === 'S'){
//     grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DEPT_NM', val.ASGN_SHRT_NM)
//     grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DEPT_CD', val.DEPT_CD)
//     grdMain.value.getGridView().checkItem(popupParams.ROW_IDX, true)
//   }
//   else {
//     grdSub1.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DEPT_NM', val.ASGN_SHRT_NM)
//     grdSub1.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DEPT_CD', val.DEPT_CD)
//     grdSub1.value.getGridView().checkItem(popupParams.ROW_IDX, true)
//   }
// }

const onMNGEA0010PopupSelected = val => {
  let DEPT_NM = val.map(item => item.ASGN_SHRT_NM)
  let DEPT_CD = val.map(item => item.ASGN_CD)
  let ORGN = val.map(item => item.ORGN_DIV)
  let BSNS_NM = val.map(item => item.BSNS_NM)
  if(tab.value === 'S'){
    grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DEPT_NM', DEPT_NM)
    grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DEPT_CD', DEPT_CD)
    grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'BSNS_NM', BSNS_NM)
    grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'ORGN', ORGN)
    grdMain.value.getGridView().checkRow(popupParams.ROW_IDX)
  }
  else if(tab.value === 'E'){
    grdSub1.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DEPT_NM', DEPT_NM)
    grdSub1.value.getDataProvider().setValue(popupParams.ROW_IDX, 'DEPT_CD', DEPT_CD)
    grdSub1.value.getDataProvider().setValue(popupParams.ROW_IDX, 'BSNS_NM', BSNS_NM)
    grdSub1.value.getDataProvider().setValue(popupParams.ROW_IDX, 'ORGN', ORGN)
    grdSub1.value.getGridView().checkRow(popupParams.ROW_IDX)
  }
}

//직원 팝업 데이터 셋팅
const selectedEmpData = val =>{

  
//console.log('val:',val)

  if(tab.value === 'S'){
    grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'MNG_NM', val.EMP_NM)
    grdMain.value.getDataProvider().setValue(popupParams.ROW_IDX, 'MNG_ID', val.EMP_NO)
    grdMain.value.getGridView().checkItem(popupParams.ROW_IDX, true)
  }
  else {
    //console.log('popupParams.ROW_//IDX:',popupParams.ROW_IDX)
    grdSub1.value.getDataProvider().setValue(popupParams.ROW_IDX, 'MNG_NM', val.EMP_NM)
    grdSub1.value.getDataProvider().setValue(popupParams.ROW_IDX, 'MNG_ID', val.EMP_NO)
    grdSub1.value.getGridView().checkItem(popupParams.ROW_IDX, true)
  }
}

//초기 데이터셋팅
onMounted(() => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle 
        ref="menuTitle" 
        :title="`${$t(useLogsStore().menuId)}`" 
        :button-list="['btnLaw']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet>
          <v-tabs v-model="tab" @click="tabClick(tab)">
            <v-tab value="S">안전보건법령</v-tab>
            <v-tab value="E">환경법령</v-tab>
          </v-tabs>

          <!-- tab (안전보건법령 / 환경법령) -->
          <v-window v-model="tab">
            <v-window-item value="S"> <!-- 안전보건법령 -->
              <v-card-text class="pa-3 mt-2 content-area">
                <div class="d-flex flex-column fill-height">
                  <v-sheet class="searchArea d-flex justify-space-between pt-2 pb-2" >
                    <div class="d-flex">
                      <i-input 
                        :label="$t('법령명')"
                        label-width="100px"
                        width="600px"
                        v-model="searchParams_S.LAW_NM" 
                        @keydown.enter="() => { onButtonsClick({id: 'btnSearch'}) }"
                        class="ma-0"
                      />
                      <IGridTitle
                        ref="menuTitle"
                        :button-list="['btnSearch']"
                        @click-button="onButtonsClick"
                        class="mt-3 ml-3"
                      /> 
                    </div>
                    <IGridTitle
                    ref="menuTitle"
                    :button-list="['btnCreate','btnUpdate', 'btnDelete']"
                    @click-button="onButtonsClick"
                    class="mt-3"
                    />
                  </v-sheet>
                  <v-sheet class="pa-0 h-auto">
                    <IGridTitle :title="$t('법령리스트')">
                      <template #editors />
                    </IGridTitle>
                    <RealGrid
                      ref="grdMain"
                      class="mt-2"
                      style="height: calc(100vh - 500px)"
                      :grid-view-option="grdMainProps.gridViewOption"
                      :keys="grdMainProps.keys" 
                      :fields="grdMainProps.fields"
                      :columns="grdMainProps.columns"
                      @onCellButtonClicked="popupOpen"
                      @onEditRowChanged="onEditRowChanged"
                      @onCurrentRowChanged="onCurrentRowChanged"
                    />
                  </v-sheet>
                </div>
              </v-card-text>
            </v-window-item>
            <v-window-item value="E">
              <v-card-text class="pa-3 mt-2 content-area">
                <div class="d-flex flex-column fill-height">
                  <v-sheet class="searchArea d-flex justify-space-between pt-2 pb-2" >
                    <div class="d-flex">
                      <i-input 
                        :label="$t('법령명')"
                        label-width="100px"
                        width="600px"
                        v-model="searchParams_E.LAW_NM" 
                        @keydown.enter="() => { onButtonsClick({id: 'btnSearch'}) }"
                        class="ma-0"
                      />
                      <IGridTitle
                        ref="menuTitle"
                        :button-list="['btnSearch']"
                        @click-button="onButtonsClick"
                        class="mt-3 ml-3"
                      /> 
                    </div>
                    <IGridTitle
                      ref="menuTitle"
                      :button-list="['btnCreate','btnUpdate', 'btnDelete']"
                      @click-button="onButtonsClick"
                      class="mt-3"
                      />
                  </v-sheet>
                  <v-sheet class="pa-0 h-auto">
                    <IGridTitle :title="$t('법령리스트')">
                      <template #editors />
                    </IGridTitle>
                    <RealGrid
                      ref="grdSub1"
                      class="mt-2"
                      style="height: calc(100vh - 500px)"
                      :grid-view-option="grdSub1Props.gridViewOption"
                      :keys="grdSub1Props.keys" 
                      :fields="grdSub1Props.fields"
                      :columns="grdSub1Props.columns"
                      @onCellButtonClicked="popupOpen"
                      @onEditRowChanged="onEditRowChanged"
                      @onCurrentRowChanged="onCurrentRowChanged"
                    />
                  </v-sheet>
                </div>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>

  <!-- 부서/ 협력사 팝업 -->
  <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
  <!-- 인원 팝업 -->
  <EmpPopup ref="empPopup" @selected ="selectedEmpData" />
  <!-- 조직 선택 팝업 -->
  <MNGEA0010Popup ref="mNGEA0010Popup" @selected="onMNGEA0010PopupSelected"/>
</template>

