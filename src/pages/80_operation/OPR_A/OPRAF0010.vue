<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

defineOptions({
  name:'80_ooperation-OPR_A-OPRAF0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const saveParam = ref(null)

const codeList = reactive({
  BSNSList: [
    { BSNS_CD: '' ,BSNS_NM: '전체' },
  ],
  JBGBNList: [],

  partCdList: [],

  // RadioGroup set
  OUT_YNList: [
    { TXT: '전체', COD: '' },
    { TXT: '직영', COD: 'N' },
    { TXT: '협력사', COD: 'Y' },
  ],
  GBNList: [
    { TXT: '전체', COD: '' },
    { TXT: '적용', COD: 'Y' },
    { TXT: '제외', COD: 'N' },
  ],
  PRODList: [
    { TXT: '전체', COD: '' },
    { TXT: '생산', COD: 'P' },
    { TXT: '지원', COD: 'S' },
    { TXT: '비생산', COD: 'N' },
  ],
  bindProd: [
    { TXT: '생산', COD: 'P' },
    { TXT: '지원', COD: 'S' },
    { TXT: '비생산', COD: 'N' },
  ],
  GBN: [
    { TXT: '적용', COD: 'Y' },
    { TXT: '제외', COD: 'N' },
  ],
  INSPECTOR: [
    { TXT: '조선', COD: 'A' },
    { TXT: '해양에너지', COD: 'B' },
    { TXT: '특수선', COD: 'C' },
    { TXT: '엔진기계', COD: 'D' },
    { TXT: '경영지원', COD: 'E' },
    { TXT: '자산', COD: 'F' },
    { TXT: '냉천/문산', COD: 'G' },
    { TXT: '군산', COD: 'H' },
    { TXT: '기타', COD: 'I' },
  ]
})

const ORGN_DIVList = reactive([
  { value: 'A', label: '직영' },
  { value: 'B', label: '협력사' },
])

const gridList = reactive([])

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  USE_DIV : 'Y',     // 과거조직 포함여부
  GBN : '',          // 적용 구분 ( '': 전체, 'Y': 적용, 'N': 제외 )
  PROD_DIV : '',     // 생산 구분 ( '': 전체, 'P': 생산, 'S': 지원, 'N': 비생산 )
  OUT_YN: 'N',       // 조직구분
  ASGN_CD: userStore.asgnCd,
})

//코드리스트 셋팅
const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([ 
    commonSearchApi({ queryId : 'searchBSNS', param }), 
    getCodeList('HHIZJB_GUBUN'),
    getCodeList('HHIS310030'),
  
  ]).then(res => {
    res[0].ORESULT_CUR.forEach( value => {
      codeList.BSNSList.push(value) 
    })
    codeList.JBGBNList = res[1].ORESULT_CUR

    codeList.partCdList = res[2].ORESULT_CUR
    codeList.partCdList.unshift({ TXT: "", COD: "" })

    grdMain.value.setBindingColumn("BSNS_CD", codeList.BSNSList, "BSNS_CD", "BSNS_NM")   // 사업부 lookup set
    grdMain.value.setBindingColumn("PART_CD", codeList.partCdList, "COD", "TXT")   // 부문 lookup set
    grdMain.value.setBindingColumn('PROD_DIV', codeList.bindProd, 'COD', 'TXT') 
    grdMain.value.setBindingColumn('GBN', codeList.GBN, 'COD', 'TXT')
    grdMain.value.setBindingColumn('INSPECTOR', codeList.INSPECTOR, 'COD', 'TXT')
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 } , checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['BSNS_CD', 'ASGN_CD', 'ASGN_DESC'],
  fields : [  
    { fieldName: 'BSNS_CD', dataType: 'text', width: '120', header: { text: t('사업부') }, styleName: 'left-column',
      lookupDisplay: true, mergeRule: { "criteria": "value" }, editable: false },
    { fieldName: 'ORGN_DIV', dataType: 'text', width: '70', header: { text: t('조직구분') }, editable: false,lookupDisplay: true, lookupData: ORGN_DIVList, mergeRule: { "criteria": "value" } },
    // { fieldName: 'DEPT_CD', dataType: 'text', width: '50', header: { text: t('부모구분') }, editable: false },
    { fieldName: 'ASGN_CD', dataType: 'text', width: '70', header: { text: t('코드') }, editable: false },
    { fieldName: 'ASGN_DESC', dataType: 'text', width: '150', header: { text: t('부서명/협력사명') }, editable: false, styleName: 'left-column' },
    // { fieldName: 'PROD_DIV', dataType: 'text', width: '200', header: { text: t('생산구분') }, editable: false, renderer: { type: 'html', 
    //   callback: (grid, model, field) =>{ return PROD_GBNCallback(grid, model, field) } }, styleName: 'editable_column' },
    { fieldName: 'PROD_DIV', dataType: 'text', width: '100', header: { text: t('생산구분') }, editable: true, styleName: 'editable_column'
      , editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'GBN', dataType: 'text', width: '120', header: { text: t('HSE SYS 적용여부') }, editable: true, styleName: 'editable_column'
      , editor: { type: 'dropdown' }, lookupDisplay: true },
    { fieldName: 'EXCEPT_DESC', dataType: 'text', width: '180', header: { text: t('제외 사유') }, editable: false, styleName: 'left-column' },
    { fieldName: 'EXCEPT_DATE', dataType: 'date', datetimeFormat: 'yyyy-MM-dd', header: { text: t('제외 처리일') }, editable: false },
    { fieldName: 'EXCEPT_PRSN_NAME', dataType: 'text', width: '100', header: { text: t('제외 처리자') }, editable: false, styleName: 'left-column' },
    // 지정
    { fieldName: 'SPECIFY_DIV', dataType: 'text', width: '90', header: { text: t('칭찬쿠폰배부\n지정여부'), styleName: 'multiline-editor' },
      editable: false, renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, styleName: 'editable_column' },
    { fieldName: 'STTST_YN', dataType: 'text', width: '90', header: { text: t('통계적용여부') },
      editable: false, renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, styleName: 'editable_column' }, 
    { fieldName: 'DESIGN_DIV', dataType: 'text', width: '90', header: { text: t('설계') },
      editable: false, renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, styleName: 'editable_column' },
    { fieldName: 'TEMP_YN', dataType: 'text', width: '90', header: { text: t('폭염 알림여부') },
    editable: false, renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, styleName: 'editable_column' },
    { fieldName: 'GWA_ONLY_YN', dataType: 'text', width: '90', header: { text: t('단독과\n여부'), styleName: 'multiline-editor' },
    editable: false, renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, styleName: 'editable_column' },

    { fieldName: 'PART_CD', dataType: 'text', width: '150', header: { text: t('부문(담당)') }, styleName: 'editable_column', 
      lookupDisplay: true, lookupData: ORGN_DIVList, editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } }, 
    { fieldName: 'SLI_YN', dataType: 'text', width: '80', header: { text: t('SLI 유무') }, styleName: 'editable_column',
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' } }, 
    { fieldName: 'GRADE', dataType: 'text', width: '60', header: { text: t('등급') }, styleName: 'editable_column' }, 

    { fieldName: 'INSPECTOR', dataType: 'text', width:'150' ,header: { text: t('안전보건관리책임자') }, editable: true, styleName: 'editable_column'
      , editor: { type: 'dropdown' }, lookupDisplay: true },
    // 저장, 삭제시 필요 데이터
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false },
    { fieldName: 'YN_OUT', dataType: 'text', header: { text: t('YN_OUT') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
    { fieldName: 'USER_ID ', dataType: 'text', header: { text: t('USER_ID ') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '50', header: { text: t('부모구분') }, visible: false },
  ],
  columns : [],
  columnLayout: [
    'BSNS_CD',
    'ORGN_DIV',
    // 'DEPT_CD',
    {
      name: '부서/협력사',
      direction: 'horizontal',
      items: [ 'ASGN_CD', 'ASGN_DESC' ],
      header: { text: t('부서/협력사') },
    },
    'PROD_DIV', 'GBN', 'EXCEPT_DESC', 'EXCEPT_DATE', 'EXCEPT_PRSN_NAME','SPECIFY_DIV','STTST_YN','DESIGN_DIV', 'TEMP_YN','GWA_ONLY_YN',
    {
      name: 'SLI 관리',
      direction: 'horizontal',
      items: [ 'PART_CD', 'SLI_YN', 'GRADE' ],
      header: { text: t('SLI 관리') },
    },
    'INSPECTOR'
  ],
})

grdMainProps.columns = grdMainProps.fields

// grid radio 생성
const GBNCallback = (grid, model, field) => {
  let checkedY = ''
  let checkedN = ''
  if(model._index.value === 'Y'){
    checkedY = 'checked'
  } else {
    checkedN = 'checked'
  }

  return "<input type='radio' " + "value='Y'" + "name=" + "'group" + model._index.dataRow + 'G' + "' " + checkedY + " />" + 
    "<span style='padding: 0 10px 0 10px !important; margin-right: 20px;'>적용</span>" +
    "<input type='radio' " + "value='N'" + "name=" + "'group" + model._index.dataRow + 'G' + "'" + checkedN + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>제외</span>"
}

const PROD_GBNCallback = (grid, model, field) => {
  let checkedP = ''
  let checkedS = ''
  let checkedN = ''
  if(model._index.value === 'P'){
    checkedP = 'checked'
  } else if(model._index.value === 'S'){
    checkedS = 'checked'
  } else {
    checkedN = 'checked'
  }

  return "<input type='radio' " + "value='P'" + "name=" + "'group" + model._index.dataRow + 'P' + "' " + checkedP + " />" + 
    "<span style='padding: 0 10px 0 10px !important;'>생산</span>" +
    "<input type='radio' " + "value='S'" + "name=" + "'group" + model._index.dataRow + 'P' + "'" + checkedS + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>지원</span>" +
    "<input type='radio' " + "value='N'" + "name=" + "'group" + model._index.dataRow + 'P' + "'" + checkedN + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>비생산</span>"
}


const INSPECTOR_GBNCallback = (grid, model, field) => {
  let checkedA = '' // 조선
  let checkedB = '' // 해양에너지
  let checkedC = '' // 특수선
  let checkedD = '' // 엔진기계
  let checkedE = '' // 경영지원/기타
  let checkedF = '' // 자산
  let checkedG = '' // 냉천, 문산
  let checkedH = '' // 군산
  
  if(model._index.value === 'A'){
    checkedA = 'checked'
  } else if(model._index.value === 'B'){
    checkedB = 'checked'
  } else if(model._index.value === 'C'){
    checkedC = 'checked'
  } else if(model._index.value === 'D'){
    checkedD = 'checked'
  } else if(model._index.value === 'E'){
    checkedE = 'checked'
  } else if(model._index.value === 'F'){
    checkedF = 'checked'
  } else if(model._index.value === 'G'){
    checkedG = 'checked'
  } else if(model._index.value === 'H'){
    checkedH = 'checked'
  } 

  return "<input type='radio' " + "value='A'" + "name=" + "'group" + model._index.dataRow + 'I' + "' " + checkedA + " />" + 
    "<span style='padding: 0 10px 0 10px !important;'>조선</span>" +
    "<input type='radio' " + "value='B'" + "name=" + "'group" + model._index.dataRow + 'I' + "'" + checkedB + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>해양에너지</span>" +
    "<input type='radio' " + "value='C'" + "name=" + "'group" + model._index.dataRow + 'I' + "'" + checkedC + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>특수선</span>"+
    "<input type='radio' " + "value='D'" + "name=" + "'group" + model._index.dataRow + 'I' + "'" + checkedD + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>엔진기계</span>"+
    "<input type='radio' " + "value='E'" + "name=" + "'group" + model._index.dataRow + 'I' + "'" + checkedE + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>경영지원</span>"+
    "<input type='radio' " + "value='F'" + "name=" + "'group" + model._index.dataRow + 'I' + "'" + checkedF + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>자산</span>"+
    "<input type='radio' " + "value='G'" + "name=" + "'group" + model._index.dataRow + 'I' + "'" + checkedG + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>냉천/문산</span>"+
    "<input type='radio' " + "value='H'" + "name=" + "'group" + model._index.dataRow + 'I' + "'" + checkedH + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>군산</span>"+
    "<input type='radio' " + "value='I'" + "name=" + "'group" + model._index.dataRow + 'I' + "'" + checkedH + " />" +
    "<span style='padding: 0 10px 0 10px !important;'>기타</span>"
}

// cell 조건 편집
const rowChanged = (grid, oldRow, newRow) => {
  if(newRow !== -1){
    // newRow는 현재 선택 cell의 index 값
    let rowData = grdMain.value.getDataProvider().getJsonRow(newRow)

    // 편집 필드명 지정(다른 옵션도 줄수 있음)
    let col = { name: 'EXCEPT_DESC' }
    if(rowData.GBN === 'N'){
      col.editable = true
    } else {
      col.editable = false
    }
    grdMain.value.getGridView().setColumn(col)
  }
}

const onEditRowChanged = async (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  grid.commit()
  let cnt = dataRow
  let dataList = await grdMain.value.getDataProvider().getJsonRows(dataRow, -1)
  let data = await grdMain.value.getDataProvider().getJsonRow(dataRow)
  let col = { name: 'EXCEPT_DESC' }

  if(field == '5'){
    if(newValue === 'Y'){
      if(data.ASGN_CD !== data.DEPT_CD){
        grdMain.value.getDataProvider().setValue(dataRow, 'GBN', 'Y')
        grdMain.value.getDataProvider().setValue(dataRow, 'EXCEPT_DESC', null)
        grdMain.value.getDataProvider().setValue(dataRow, 'EXCEPT_DATE', null)
        grdMain.value.getDataProvider().setValue(dataRow, 'EXCEPT_PRSN_NAME', null)
        col.editable = false
      } else {
        dataList.forEach(e => {
          if(e.DEPT_CD === data.ASGN_CD){
            grdMain.value.getDataProvider().setValue(cnt, 'GBN', 'Y')
            grdMain.value.getDataProvider().setValue(cnt, 'EXCEPT_DESC', null)
            grdMain.value.getDataProvider().setValue(cnt, 'EXCEPT_DATE', null)
            grdMain.value.getDataProvider().setValue(cnt, 'EXCEPT_PRSN_NAME', null)
            col.editable = false
            // grdMain.value.getGridView().checkItem(cnt)
            cnt++
          }
        })
      }
    } else {
      let today = dayjs(new Date()).format()
      if(data.ASGN_CD !== data.DEPT_CD){
        col.editable = true
        grdMain.value.getDataProvider().setValue(dataRow, 'GBN', 'N')
        grdMain.value.getDataProvider().setValue(dataRow, 'EXCEPT_DATE', today)
        grdMain.value.getDataProvider().setValue(dataRow, 'EXCEPT_PRSN_NAME', userStore.userName)
      }
      dataList.forEach(e => {
        if(e.DEPT_CD === data.ASGN_CD){
          col.editable = true
          grdMain.value.getDataProvider().setValue(cnt, 'GBN', 'N')
          grdMain.value.getDataProvider().setValue(cnt, 'EXCEPT_DATE', today)
          grdMain.value.getDataProvider().setValue(cnt, 'EXCEPT_PRSN_NAME', userStore.userName)
          // grdMain.value.getGridView().checkItem(cnt)
          cnt++
        }
      })
    }
    grdMain.value.getGridView().setColumn(col)
  }

  grdMain.value.getGridView().checkItem(itemIndex)

  // if(fieldName === 'SPECIFY_DIV'){
  //   if(rowData[fieldName] === 'Y'){
  //     grdMain.value.getDataProvider().setValue(dataRow, 'SPECIFY_DATE', today)
  //     grdMain.value.getDataProvider().setValue(dataRow, 'SPECIFY_MANAGER', userStore.userName)
  //   }else {
  //     grdMain.value.getDataProvider().setValue(dataRow, 'SPECIFY_DATE', null)
  //     grdMain.value.getDataProvider().setValue(dataRow, 'SPECIFY_MANAGER', null)
  //   }
  // }
}

const onCellItemClicked = async (grid, index, clickData) => {
  grid.commit()
  let cnt = clickData.itemIndex
  let dataList = await grdMain.value.getDataProvider().getJsonRows(clickData.itemIndex, -1)
  let data = await grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex)
  let col = { name: 'EXCEPT_DESC' }
  grdMain.value.getGridView().checkItem(clickData.itemIndex)
  
  if(clickData.fieldName === 'GBN'){
    if(clickData.target.value === 'Y'){
      if(data.ASGN_CD !== data.DEPT_CD){
        grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'GBN', 'Y')
        grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'EXCEPT_DESC', null)
        grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'EXCEPT_DATE', null)
        grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'EXCEPT_PRSN_NAME', null)
        col.editable = false
      } else {
        dataList.forEach(e => {
          if(e.DEPT_CD === data.ASGN_CD){
            grdMain.value.getDataProvider().setValue(cnt, 'GBN', 'Y')
            grdMain.value.getDataProvider().setValue(cnt, 'EXCEPT_DESC', null)
            grdMain.value.getDataProvider().setValue(cnt, 'EXCEPT_DATE', null)
            grdMain.value.getDataProvider().setValue(cnt, 'EXCEPT_PRSN_NAME', null)
            col.editable = false

            grdMain.value.getGridView().checkItem(cnt)
            cnt++
          }
        })
      }
    } else {
      let today = dayjs(new Date()).format()
      if(data.ASGN_CD !== data.DEPT_CD){
        col.editable = true
        grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'GBN', 'N')
        grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'EXCEPT_DATE', today)
        grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'EXCEPT_PRSN_NAME', userStore.userName)
      }
      dataList.forEach(e => {
        if(e.DEPT_CD === data.ASGN_CD){
          col.editable = true
          grdMain.value.getDataProvider().setValue(cnt, 'GBN', 'N')
          grdMain.value.getDataProvider().setValue(cnt, 'EXCEPT_DATE', today)
          grdMain.value.getDataProvider().setValue(cnt, 'EXCEPT_PRSN_NAME', userStore.userName)
          grdMain.value.getGridView().checkItem(cnt)
          cnt++
        }
      })
    }
    grdMain.value.getGridView().setColumn(col)
  } else if(clickData.fieldName === 'PROD_DIV'){
    if(clickData.target.value === 'P'){
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'PROD_DIV', 'P')
    } else if(clickData.target.value === 'S'){
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'PROD_DIV', 'S')
    } else {
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'PROD_DIV', 'N')
    }
  } else if(clickData.fieldName === 'INSPECTOR'){
    if(clickData.target.value === 'A'){
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'INSPECTOR', 'A')
    } else if(clickData.target.value === 'B'){
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'INSPECTOR', 'B')
    } else if(clickData.target.value === 'C'){
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'INSPECTOR', 'C')
    } else if(clickData.target.value === 'D'){
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'INSPECTOR', 'D')
    } else if(clickData.target.value === 'E'){
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'INSPECTOR', 'E')
    } else if(clickData.target.value === 'F'){
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'INSPECTOR', 'F')
    } else if(clickData.target.value === 'G'){
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'INSPECTOR', 'G')
    } else if(clickData.target.value === 'H'){
      grdMain.value.getDataProvider().setValue(clickData.itemIndex, 'INSPECTOR', 'H')
    }  
  }
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch'){
    grdMain.value.getDataProvider().setRows([])
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'OPRAF0010_SEARCH_01', param: searchParams })
}

const afterSearch = async res => {
  // console.log(" RES : " , res)
  if(searchParams.OUT_YN === ''){
    res.ORESULT_CUR.forEach(e => {
      if( e.ORGN_DIV === 'B' ){
        e.ASGN_DESC = '\u00a0\u00a0\u00a0\u00a0 - \u00a0' + e.ASGN_DESC
      }
    })
  }
  
  gridList.value = await res.ORESULT_CUR
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 저장전 사용자 정의 validation
const beforeSave = async () => {
  saveParam.value = []
  let result = true
  let checkedRow = await grdMain.value.getGridView().getCheckedRows()

  if(checkedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    result = false
  }

  checkedRow.forEach( val => {
    let data = grdMain.value.getDataProvider().getJsonRow(val)

    if(data.GBN === 'N' && data.EXCEPT_DESC === null){
      Message.warn(t('제외사유를 입력 해주세요.'))

      result = false
      
      return
    }
    if(data.EXCEPT_DATE){
      data.EXCEPT_DATE = dayjs(data.EXCEPT_DATE).format('YYYYMMDD')
    }

    if(data.SPECIFY_DATE){
      data.SPECIFY_DATE = dayjs(data.SPECIFY_DATE).format('YYYYMMDD')
    }
    data.USER_ID = userStore.userId

    saveParam.value.push(data)
  })

  return result
}

// 저장
const saveData = () => {
  return commonExecuteApi({ queryId : 'OPRAF0010_SAVE_01', list: saveParam.value })
}

const resetGrid = e => {
  onButtonsClick({ id: 'btnSearch' })
}

onMounted(() => {
  initCodeList()
  
  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
        <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('사업부')"
            labelWidth="60px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNSList"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            @update:modelValue="resetGrid"
            width="300px"
          />

          <div class="d-flex align-center">
            <div class="formLabelText mr-5">
              {{ $t('조직구분') }}
            </div>
            <VRadioGroup
              v-model="searchParams.OUT_YN"
              inline
              @change="resetGrid"
            >
              <VRadio
                v-for="(item , i) in codeList.OUT_YNList"
                :key="i"
                :value="item.COD"
                :label="item.TXT"
              />
            </VRadioGroup>
          </div>

          <div class="d-flex align-center pl-8">
            <div class="formLabelText mr-5">
              {{ $t('생산여부') }}
            </div>
            <VRadioGroup
              v-model="searchParams.PROD_DIV"
              inline
              @change="resetGrid"
            >
              <VRadio
                v-for="(item , i) in codeList.PRODList"
                :key="i"
                :value="item.COD"
                :label="item.TXT" 
              />
            </VRadioGroup>
          </div>
          <div class="d-flex align-center pl-8">
            <div class="formLabelText mr-5">
              {{ $t('적용여부') }}
            </div>
            <VRadioGroup
              v-model="searchParams.GBN"
              inline
              @change="resetGrid"
            >
              <VRadio
                v-for="(item , i) in codeList.GBNList"
                :key="i"
                :value="item.COD"
                :label="item.TXT" 
              />
            </VRadioGroup>
          </div>

          <div class="d-flex align-center pl-8">
            <div class="formLabelText mr-5">
              {{ $t('과거조직 포함') }}
            </div>
            <VCheckbox 
              v-model="searchParams.USE_DIV" 
              true-value="%"
              false-value="Y"
              @change="resetGrid"
            />
          </div>

        </v-sheet>
        <div class="notice">
          ※ 직영 정보 수정 전 협력사 전체 선택 및 저장을 한 후에
          <br/>
          직영 정보를 수정해 주시기 바랍니다.(협력사 정보 동기화 목적)
        </div>

        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCurrentRowChanged="rowChanged"
            @onCellItemClicked="onCellItemClicked"
            @onEditRowChanged="onEditRowChanged"
          />
        </v-sheet>
      </div>
    </v-card-text>
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

.notice {
  position: fixed;
  z-index: 9999;
  color: #0600ff;
  font-size: 1rem;
  left: 1483px;
  top: 170px;
  font-weight: bold;
}
</style>
