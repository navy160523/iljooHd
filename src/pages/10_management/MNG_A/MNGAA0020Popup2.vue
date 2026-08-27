<!--
  화면명 : MNGAA0020Popup2.vue
  화면개요 :HSE 방침/목표/중점추진사항 - 목표/계획 작성 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import _ from "lodash"
import MNGAA0020Popup3 from './MNGAA0020Popup3.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"

const emit = defineEmits(["popup2Exit"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const mngaa0020PopupDialog = ref(null)
const grdMain = ref(null)
const grdSub1 = ref(null)
const grdSub2 = ref(null)
const grdSub3 = ref(null)
const grdMainTitle = ref(null)
const grdSub2Title = ref(null)
const grdSub3Title = ref(null)
const grdMainFocus = ref(0)
const grdSub1Focus = ref(0)
const grdSub2Focus = ref(0)
const saveParam = ref(null)
let subChangeCk = ref(false)
const grdMainButton = ref(true)
const grdMainButtonEnv = ref(false)
const mNGAA0020Popup3 = ref(null)

const radioGubun = reactive([
  { name: '안전', code: '1' },
  { name: '보건', code: '2' },
  { name: '환경', code: '3' },
])

const PLAN_CYCLELookup = reactive([])

//코드리스트
const codeList = reactive({
  ISSUE_DIV : [],
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  YEAR: '',
  HSE_DIV: '',
})

// 저장조건
const goalData = reactive({
  HSE_DIV: '',
  GOAL_TITLE: '',
  GOAL_TITLE1: '',
  GOAL_TITLE2: '',
  GOAL_TITLE3: '',
  GOAL_TITLE4: '',
  GOAL_TITLE5: '',
  GOAL_TITLE6: '',
  GOAL_TITLE7: '',
  GOAL_TITLE8: '',
  GOAL_TITLE9: '',
  GOAL_TITLE10: '',
})

// 세부내용 저장 파라미터
const detailParam = reactive({
  DETAIL_ITEM: '', 
  DETAIL_NO: '', 
  DETAIL_ORD: '', 
  AHEAD_ITEM: '',  
  AHEAD_NO: '', 
  AHEAD_ORD: '',
})

let selectedGrdMain = reactive(
  { AHEAD_ITEM : '' },
  { AHEAD_NO : '' },
  { AHEAD_ORD : '' },
)

let cycle_items = reactive([
  {CYCLE2 : '1'},
  {CYCLE2 : '2'},
  {CYCLE2 : '3'},
  {CYCLE2 : '4'},
  {CYCLE2 : '5'},
  {CYCLE2 : '6'},
  {CYCLE2 : '7'},
  {CYCLE2 : '8'},
  {CYCLE2 : '9'},
  {CYCLE2 : '10'},
])

// const input = document.querySelector('#title8')
// input.addEventListener('keyup', function(e) {
//   let value = e.target.value;                 
//   value = Number(value.replaceAll('.', ''));
//   const formatValue = value.toLocaleString('ko-KR'); 
//   input.value = formatValue;
// })


// 그리드 속성셋팅
// 중점항목 그리드
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: { visible: true } },
  keys : ['COL01'],
  fields : [ 
    { fieldName: 'AHEAD_ITEM', dataType: 'text',  
      header: { text: t('중점항목 내용'), styleName: 'header_validit' }, styleName: 'multiline-editor left-column', required: true, requiredMessage: '[중점항목 내용]은 필수입니다.' ,
    },
    { fieldName: 'NOTE', dataType: 'text', width: '40', styleName: 'multiline-editor', header: { text: t('비고') }, editable: false},
    
    { fieldName: 'KPI_IDX', dataType: 'text', visible: false },
    { fieldName: 'AHEAD_NO', dataType: 'text', visible: false },
    { fieldName: 'AHEAD_ORD', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
    'AHEAD_ITEM', 
    'NOTE',

    'AHEAD_NO',
    'AHEAD_ORD',
  ],
})

grdMainProps.columns = grdMainProps.fields

// 세부계획 그리드
const grdSub2Props = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL01'],
  fields : [ 
    { fieldName: 'PLAN_ITEM', dataType: 'text', width: '200', styleName: 'multiline-editor left-column', required: true, requiredMessage: '[실행방안]은 필수입니다.' , header: { text: t('실행방안'), styleName: 'header_validit' }, editor: { type: 'multiline' }},
    { fieldName: 'PLAN_CYCLE1', dataType: 'text', width: '70', header: { text: t('주기'), styleName: 'header_validit' }, lookupDisplay: true, lookupData: PLAN_CYCLELookup, required: true, requiredMessage: '[주기는 필수입니다.', editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, editable: true },
    { fieldName: 'PLAN_CYCLE2', dataType: 'text', width: '70', header: { text: t('주기'), styleName: 'header_validit' }, lookupDisplay: true, lookupData: PLAN_CYCLELookup, required: true, requiredMessage: '[주기]는 필수입니다.', editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, editable: true },
    { fieldName: 'PLAN_CYCLE_DESC', dataType: 'text', width: '100', header: { text: t('별도기준'), styleName: 'header_validit' }, required: true, requiredMessage: '[별도기준]은 필수입니다.' },
    { fieldName: 'PLAN_DOCU', dataType: 'text', width: '200', styleName: 'multiline-editor left-column', header: { text: t('기록관리'), styleName: 'header_validit' }, required: true, requiredMessage: '[기록관리]는 필수입니다.', editor: { type: 'multiline' }},
    { fieldName: 'PERSON_NAME', dataType: 'text', width: '100', styleName: 'multiline-editor left-column', header: { text: t('담당자'), styleName: 'header_validit' }, required: true, requiredMessage: '[담당자]는 필수입니다.' },
    { fieldName: 'NOTE', dataType: 'text', width: '55', styleName: 'multiline-editor', header: { text: t('비고') }, editable: false},

    { fieldName: 'KPI_IDX', dataType: 'text', visible: false},
    { fieldName: 'RESULT_MEASUREMENT', dataType: 'text', visible: false},
    { fieldName: 'AHEAD_NO', dataType: 'text', visible: false },
    { fieldName: 'DETAIL_NO', dataType: 'text', visible: false  },
    { fieldName: 'PLAN_NO', dataType: 'text', visible: false  },
    { fieldName: 'PLAN_ORD', dataType: 'text', visible: false  },
  ],
  columns : [],
  columnLayout: [
    'PLAN_ITEM', 
    {
      name: '관리기준',
      direction: 'horizontal',
      items: [
        {
          header : { text: t('주기 '), styleName: 'header_validit_merge' },
          direction: 'horizontal',
          hideChildHeaders: true,
          items: [
            'PLAN_CYCLE1',
            'PLAN_CYCLE2',
          ],
        },
        'PLAN_CYCLE_DESC',
      ],
    },
    'RESULT_MEASUREMENT',
    'PLAN_DOCU',
    'PERSON_NAME',
    'NOTE',

    'AHEAD_NO',
    'DETAIL_NO',
    'PLAN_NO',
    'PLAN_ORD'
  ],
})

grdSub2Props.columns = grdSub2Props.fields

// 중요리스크 개선 계획
const grdSub3Props = reactive({
  gridViewOption : { header: { height: 40 }, stateBar: { visible: false }},
  keys : ['COL01'],
  fields : [ 
    { fieldName: 'ISSUE_DIV', dataType: 'text', width: '100', styleName: 'left-column', header: { text: t('분류') }, 
      lookupDisplay: true, lookupData : { value: "COD", label: "TXT", list:  codeList.ISSUE_DIV }, editable: false },
    { fieldName: 'ISSUE_DESC', dataType: 'text', width: '300', styleName: 'left-column', 
      header: { text: t('경영환경(이슈)/\n 이해관계자 니즈 및 기대사항')}, editable: false },
    { fieldName: 'MEASURE', dataType: 'text', width: '300', styleName: 'left-column',
      header: { text: t('개선 대책') }, editable: false },
    { fieldName: 'ACTION_FROM',dataType: 'datetime', editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true }}
      , datetimeFormat: 'yyyy-MM-dd', width: '100', header: { text: t('시작') }, editable: false },
    { fieldName: 'ACTION_TO',dataType: 'datetime', editor: {type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true }}
      , datetimeFormat: 'yyyy-MM-dd', width: '100', header: { text: t('완료') },editable: false },
  ],
  columns : [],
  columnLayout: [
    'ISSUE_DIV', 
    'ISSUE_DESC',
    'MEASURE',
    {
      name: '조치기간',
      direction: 'horizontal',
      items: [
        'ACTION_FROM',
        'ACTION_TO',
      ],
    },
  ],
})

grdSub3Props.columns = grdSub3Props.fields


const firstWatch = ref(0)

const searchParam = ref('')
// 팝업 오픈 함수
const openPopup =  params => {
  searchParam.value = params
  initCodeList(params)
  searchGoal()


  const tdElement = document.querySelector('.header_validit_merge')
  const spanElement = tdElement.querySelector('span')
  spanElement.classList.add('header_validit')

  mngaa0020PopupDialog.value = true
}

const cycle_old = ref('')
const cycle_new = ref('')

// 초기 코드값 가져오기
const initCodeList = async params => {

  Promise.all([
    getCodeList('HHIAJA'),
  ]).then(res => {
    codeList.ISSUE_DIV = res[0].ORESULT_CUR

    grdSub3.value.setBindingColumn('ISSUE_DIV', codeList.ISSUE_DIV, 'COD', 'TXT')
  })

  searchParams.ASGN_CD = params.ASGN_CD
  searchParams.BSNS_CD = params.BSNS_CD
  searchParams.CMPNY_DIV = params.CMPNY_DIV
  searchParams.DEPT_CD = params.DEPT_CD
  searchParams.YEAR = params.YEAR
  searchParams.HSE_DIV = (!params.HSE_DIV) ? '1' : params.HSE_DIV
  goalData.HSE_DIV = searchParams.HSE_DIV


  Promise.all([ 
    getCodeList('HHIAF40'),
    getCodeList('HHIAF41'),
    commonSearchApi({ queryId : 'MNGAB0020_SEARCH_02', param: searchParams })
  ]).then(res => {
    cycle_old.value = res[0].ORESULT_CUR
    cycle_new.value = res[1].ORESULT_CUR
    grdSub2.value.setBindingColumn("PLAN_CYCLE1",  res[1].ORESULT_CUR , 'COD' , 'TXT') 
    grdSub2.value.setBindingColumn("PLAN_CYCLE2",  cycle_items , 'CYCLE2' , 'CYCLE2') 
    grdSub3.value.getDataProvider().setRows(res[2].ORESULT_CUR)
  }
  )
}


let ckLength = ref(0)

const goalFirst = ref(false)

// 목표 조회
const searchGoal = () => {
  goalData.GOAL_TITLE = ''
  grdMain.value.getDataProvider().setRows()
  // grdSub1.value.getDataProvider().setRows()
  grdSub2.value.getDataProvider().setRows()
  
  commonSearchApi({ queryId : 'MNGAA0020_POPUP_02_SEARCH_01', param: searchParams }).then( res => {
    ckLength.value = res.ORESULT_CUR.length
    if(res.ORESULT_CUR.length === 0){
      setGoalTitle()
    }
    else{
      setGoalTitle(res.ORESULT_CUR[0].GOAL_TITLE)
    }
    // goalData.GOAL_TITLE = (res.ORESULT_CUR.length === 0) ? setGoalTitle() : res.ORESULT_CUR[0].GOAL_TITLE
  }).finally(() => {
    if(ckLength.value === 0){
      // goalFirst.value = true
      // Message.warn('목표를 먼저 저장하세요.')

      return
    }else goalFirst.value = false

    // 자동으로 중점항목 조회
    searchGrdMain()
  })
}

// 중점항목 조회
const searchGrdMain = () => {
  commonSearchApi({ queryId : 'MNGAA0020_POPUP_02_SEARCH_02', param: searchParams }).then( res => {  
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.getGridView().setCurrent({ itemIndex: grdMainFocus.value })

    // 코드
    let AHEAD_ITEM = { name: 'AHEAD_ITEMPRCS_CD' }
    AHEAD_ITEM.editable = true
    if(selectedGrdMain.NOTE === 'KPI 데이터'){
      AHEAD_ITEM.editable = false
    }

    grdMain.value.getGridView().setColumn(AHEAD_ITEM)

    ckLength.value = res.ORESULT_CUR.length
  }).finally(() => {
    if(ckLength.value === 0){
      return
    }
    
    // 자동으로 세부계획 조회
    searchGrdSub2()
  })
}

// 세부계획 그리드 조회
const searchGrdSub2 = detailNo => {
  
  searchParams.AHEAD_NO = selectedGrdMain.AHEAD_NO
  searchParams.DETAIL_NO = ''
  searchParams.KPI_IDX = selectedGrdMain.KPI_IDX
  // searchParams.AHEAD_NO = grdMainFocus.value+1
  // searchParams.DETAIL_NO = grdMainFocus.value+1
  // // searchParams.AHEAD_NO = detailParam.AHEAD_NO
  // // searchParams.DETAIL_NO = detailParam.DETAIL_NO
  // searchParams.KPI_IDX = detailParam.KPI_IDX
  
  commonSearchApi({ queryId : 'MNGAA0020_POPUP_02_SEARCH_04', param: searchParams }).then( res => {  
    let datas = res.ORESULT_CUR
    if(searchParams.YEAR >= '2024'){
      datas.forEach(e => {
        if(e.PLAN_CYCLE === 'Z'){
          e.PLAN_CYCLE2 = '별도기준'
          e.PLAN_CYCLE1 = 'Z'
          grdSub2.value.getGridView().setColumn({name: 'PLAN_CYCLE2', editable: false}) 
        }
        else {
          e.PLAN_CYCLE1 = e.PLAN_DESC.substr(0,1)
          e.PLAN_CYCLE2 = e.PLAN_DESC.substr(1)
          e.PLAN_CYCLE2 += '회'
        } 
     
      })

      // grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
    else{
      datas.forEach(e => {
      if(e.PLAN_CYCLE !== 'Z'){
          e.PLAN_CYCLE2 = e.PLAN_DESC.split('/')[0]
          e.PLAN_CYCLE1 = e.PLAN_DESC.split('/')[1]
        } 
        else{
          e.PLAN_CYCLE2 = '별도기준'
          e.PLAN_CYCLE1 = 'Z'
          grdSub2.value.getGridView().setColumn({name: 'PLAN_CYCLE2', editable: false})
        }
      })
    }
    grdSub2.value.getDataProvider().setRows(datas)
    grdMain.value.getGridView().setCurrent({ itemIndex: grdMainFocus.value })
    grdSub2.value.getGridView().setCurrent({ itemIndex: grdSub2Focus.value })
    
 
  })


}

const setGoalTitle = res => {
  if(goalData.HSE_DIV === '1'){
    goalData.GOAL_TITLE1 = '중대재해 건수'
    goalData.GOAL_TITLE2 = '0'
    goalData.GOAL_TITLE3 = '건 이하 달성'
    goalData.GOAL_TITLE4 = '재해 건수'
    goalData.GOAL_TITLE5 = '0'
    goalData.GOAL_TITLE6 = '건 이하 달성'
    goalData.GOAL_TITLE7 = '재해율'
    goalData.GOAL_TITLE8 = '0'
    goalData.GOAL_TITLE9 = '% 이하 달성'
    goalData.GOAL_TITLE10 = ''
  }
  else if(goalData.HSE_DIV === '2'){
    goalData.GOAL_TITLE1 = '온열질환'
    goalData.GOAL_TITLE2 = '0'
    goalData.GOAL_TITLE3 = '건 이하 달성'
    goalData.GOAL_TITLE4 = '건강검진 실시율'
    goalData.GOAL_TITLE5 = '100'
    goalData.GOAL_TITLE6 = '% 달성'
    goalData.GOAL_TITLE7 = '근골격계질환'
    goalData.GOAL_TITLE8 = '0'
    goalData.GOAL_TITLE9 = '건 이하 달성'
    goalData.GOAL_TITLE10 = ''
  }
  else if(goalData.HSE_DIV === '3'){
    goalData.GOAL_TITLE1 = '법규 위반'
    goalData.GOAL_TITLE2 = '0'
    goalData.GOAL_TITLE3 = '건 이하 달성'
    goalData.GOAL_TITLE4 = `유해화학물질 종사자 교육`
    goalData.GOAL_TITLE5 = '100'
    goalData.GOAL_TITLE6 = '% 달성'
    goalData.GOAL_TITLE7 = ''
    goalData.GOAL_TITLE8 = ''
    goalData.GOAL_TITLE9 = ''
    goalData.GOAL_TITLE10 = '' 
  }

  if(res){
    let numbers = res.match(/\d+/g)
    goalData.GOAL_TITLE2 = numbers[0] ? numbers[0] : goalData.GOAL_TITLE2
    goalData.GOAL_TITLE5 = numbers[1] ? numbers[1] : goalData.GOAL_TITLE5
    // 안전, 보전일 경우에는 title8 적용
    if (goalData.HSE_DIV === '1' || goalData.HSE_DIV === '2') {
      
      // 소수점 
      if (numbers.length === 4){
        goalData.GOAL_TITLE8 = numbers[2] ? numbers[2] + '.' + numbers[3] : goalData.GOAL_TITLE8
      }else{
        goalData.GOAL_TITLE8 = numbers[2] ? numbers[2] : goalData.GOAL_TITLE8
      }
    } else {
      // 환경일 경우에는 title8 미적용함. (목표에 2가지만 있음 : 법규위반, 유해화학물질 종사자 교육)
      goalData.GOAL_TITLE8 = ''
    }
    

    let goalArr = res.split('\r\n')
    if(goalArr.length > 3){
      for(let i=3; i<goalArr.length; i++){
        goalData.GOAL_TITLE10+=goalArr[i]
      }
    }
  }
}


//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === "btnClose") {
    onClose()
  }
  else if(btn.id === "btnUpdate") {
    saveAll()
  }
  else if(btn.id === "btnTemporaryStorage") {
    saveAll('Y')
  }
}

const addEnv = data => {
  let maxOrd = grdMain.value.getGridView().getSummary("AHEAD_ORD","max")
  for(let i=0;i<data.length;i++){
    maxOrd =  !maxOrd ? 1 : maxOrd*1+1
    grdMain.value.addRow({ AHEAD_ITEM:data[i].IMPR_PLAN, AHEAD_NO:maxOrd, AHEAD_ORD: maxOrd }, false)
    grdSub2.value.getDataProvider().setRows()
  }
}

const onGrdMainButtonsClick = async btn => {
  if (btn.id === "btnCreate") {
    let maxOrd = grdMain.value.getGridView().getSummary("AHEAD_ORD","count")
    maxOrd =  !maxOrd ? 1 : maxOrd*1+1
    grdMainFocus.value = maxOrd
    grdMain.value.addRow({ AHEAD_NO:maxOrd, AHEAD_ORD: maxOrd }, false)
    grdSub2.value.getDataProvider().setRows()
  }
  else if (btn.id === "btnDelete"){
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeDeleteGrdMain)
      .setQuery(deleteGrdMainData)
      .setAfter(() => { searchGrdMain() })
      .run()
  }
  else if(btn.id === "btnGetEnvData"){
    mNGAA0020Popup3.value.openPopup(searchParam)
  }
}

const beforeDeleteGrdMain = async() => {

  let chekedRow = grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  } else {

    let dataCount = grdSub2.value.getDataProvider().getRowCount()
    if(dataCount !== 0){
      Message.err(t('세부계획에 데이터가 있습니다.'))
      return false
    }
    let ckKPI = false
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
        if(data.KPI_IDX){
          Message.info('KPI 데이터는 수정/삭제 할 수 없습니다.')
          ckKPI = true
        }
    })
    if(ckKPI){
      return false
    }
    return true
  }

}

const deleteGrdMainData = async() => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
  } else {
    let delParams = []
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.CMPNY_DIV = searchParams.CMPNY_DIV
      data.BSNS_CD = searchParams.BSNS_CD
      data.DEPT_CD = searchParams.DEPT_CD
      data.ASGN_CD = searchParams.ASGN_CD
      data.YEAR = searchParams.YEAR
      data.HSE_DIV = searchParams.HSE_DIV
      data.DETAIL_NO = data.AHEAD_NO
      delParams.push(data)
    })

    grdMainFocus.value = 0


    let result = await commonExecuteApi({ queryId : 'MNGAA0020_POPUP_02_DELETE_03', list: delParams })

    return commonExecuteApi({ queryId : 'MNGAA0020_POPUP_02_DELETE_02', list: delParams })
  }
}

const onGrdSub2ButtonsClick = async btn => {
  if (btn.id === "btnCreate") {
    let focusRow = grdMain.value.getGridView().getCurrent().dataRow
    let row = grdMain.value.getDataProvider().getJsonRow(focusRow)

    grdMainFocus.value = focusRow
    let maxOrd = grdSub2.value.getGridView().getSummary("PLAN_NO","max")
    maxOrd =  !maxOrd ? 1 : maxOrd*1+1
    grdSub2.value.addRow({ AHEAD_NO: row.AHEAD_NO, DETAIL_NO: row.AHEAD_NO, PLAN_NO: maxOrd, PLAN_ORD: maxOrd  }, false)
  }
  else if(btn.id === "btnDelete") {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub2, row: null }])
      .setGridList([grdSub2])
      .setBefore(beforeDeleteGrdSub2)
      .setQuery(deleteGrdSub2Data)
      .setAfter(() => { searchGoal() })
      .run()
  }
}

const beforeDeleteGrdSub2 = () => {

let chekedRow = grdSub2.value.getGridView().getCheckedRows()
if(chekedRow.length === 0){
  Message.warn(t('선택한 데이터가 없습니다.'))
  return false
} else {
  let ckKPI = false
  chekedRow.forEach( val => {
    let data = grdSub2.value.getDataProvider().getJsonRow(val)
      if(data.KPI_IDX){
        Message.info('KPI 데이터는 수정/삭제 할 수 없습니다.')
        ckKPI = true
      }
  })
  if(ckKPI){
    return false
  }
}
  return true
}

const deleteGrdSub2Data = () => {
  let chekedRow = grdSub2.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
  } else {
    let delParams = []
    chekedRow.forEach( val => {
      let data = grdSub2.value.getDataProvider().getJsonRow(val)
      data.CMPNY_DIV = searchParams.CMPNY_DIV
      data.BSNS_CD = searchParams.BSNS_CD
      data.DEPT_CD = searchParams.DEPT_CD
      data.ASGN_CD = searchParams.ASGN_CD
      data.YEAR = searchParams.YEAR
      data.HSE_DIV = searchParams.HSE_DIV
      
      delParams.push(data)
    })
    grdSub2Focus.value = 0

    return commonExecuteApi({ queryId : 'MNGAA0020_POPUP_02_DELETE_04', list: delParams })
  }
}

const onClose = () => {
  mngaa0020PopupDialog.value = false
  grdMainFocus.value = 0
  // grdSub1Focus.value = 0
  emit("popup2Exit")
}

const modifyCk = async(ck) => {
  if(ck<1 || subChangeCk === false){
    return true
  }
  const result = await vm.$swal({
    title: t("수정중인 데이터가 있습니다. 조회하시겠습니까?"),
    showCancelButton: true,
  })
  return result.isConfirmed
}

const onGrdMainCellClick = (grid, clickData) => {
  let gMainData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  // 코드
  let AHEAD_ITEM = { name: 'AHEAD_ITEM' }
  AHEAD_ITEM.editable = true
  if(gMainData.NOTE === 'KPI 데이터'){
    AHEAD_ITEM.editable = false
  }

  grdMain.value.getGridView().setColumn(AHEAD_ITEM)
}

const onGrdMainCellClicked = async (grid, oldRow, newRow) => {
  if(newRow === -1){
    grdMain.value.getDataProvider().setRows()
    //grdSub1.value.getDataProvider().setRows()
    grdSub2.value.getDataProvider().setRows()
    return
  }
  let ck = grdSub2.value.getGridView().getCheckedRows().length
  
  if (!await modifyCk(ck)) {
    return
  }

  subChangeCk = true
  selectedGrdMain = grdMain.value.getDataProvider().getJsonRow(newRow)
  
  grdMainFocus.value = newRow

  

  

  detailParam.DETAIL_ITEM = grdMainFocus.value.AHEAD_ITEM, 
  detailParam.DETAIL_NO = grdMainFocus.value.AHEAD_NO, 
  detailParam.DETAIL_ORD = grdMainFocus.value.AHEAD_NO, 
  detailParam.AHEAD_ITEM = grdMainFocus.value.AHEAD_ITEM,  
  detailParam.AHEAD_NO = grdMainFocus.value.AHEAD_NO , 
  detailParam.AHEAD_ORD = grdMainFocus.value.AHEAD_NO 
  detailParam.KPI_IDX = selectedGrdMain.KPI_IDX ? selectedGrdMain.KPI_IDX : ''
  searchGrdSub2()
}

const onEditRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  grid.commit()
  let fieldName = grdSub2.value.getDataProvider().getFieldName(field)
  if(fieldName === 'PLAN_CYCLE1'){
    if(newValue !== 'Z'){
      grdSub2.value.getDataProvider().setValue(dataRow, 'PLAN_CYCLE2', '1회' )
      grdSub2.value.getGridView().setColumn({name: 'PLAN_CYCLE2', editable: true})
      grdSub2.value.getDataProvider().setValue(dataRow, 'PLAN_CYCLE_DESC', '작성불필요' )
      grdSub2.value.getGridView().setColumn({name: 'PLAN_CYCLE_DESC', editable: false})
    }
    else {
      grdSub2.value.getDataProvider().setValue(dataRow, 'PLAN_CYCLE2', '별도기준' )
      grdSub2.value.getGridView().setColumn({name: 'PLAN_CYCLE2', editable: false})
      grdSub2.value.getDataProvider().setValue(dataRow, 'PLAN_CYCLE_DESC', '' )
      grdSub2.value.getGridView().setColumn({name: 'PLAN_CYCLE_DESC', editable: true})
    }
  }
  if(fieldName === 'PLAN_CYCLE2'){
    // grdSub2.value.getDataProvider().setValue(dataRow, 'PLAN_CYCLE2', newValue+'회' )
    if(newValue !== '별도기준'){
      newValue += '회'
    }
    grdSub2.value.getDataProvider().setValue(dataRow, 'PLAN_CYCLE2', newValue)
  }
  grdSub2.value.getGridView().checkItem(dataRow, true)
}

const onGrdSub2CellClick = (grid, clickData) => {
  let gSub2 = grdSub2.value.getDataProvider().getJsonRow(clickData)
  // 코드
  let PLAN_ITEM = { name: 'PLAN_ITEM' }
  let PLAN_CYCLE1 = { name: 'PLAN_CYCLE1' }
  let PLAN_CYCLE2 = { name: 'PLAN_CYCLE2' }
  let PLAN_CYCLE_DESC = { name: 'PLAN_CYCLE_DESC' }
  let PLAN_DOCU = { name: 'PLAN_DOCU' }
  let PERSON_NAME = { name: 'PERSON_NAME' }
  PLAN_ITEM.editable = true
  PLAN_CYCLE1.editable = true
  PLAN_CYCLE2.editable = true
  PLAN_CYCLE_DESC.editable = true
  PLAN_DOCU.editable = true
  PERSON_NAME.editable = true
  if(gSub2.NOTE === 'KPI 데이터'){
    PLAN_ITEM.editable = false
    PLAN_CYCLE1.editable = false
    PLAN_CYCLE2.editable = false
    PLAN_CYCLE_DESC.editable = false
    PLAN_DOCU.editable = false
    PERSON_NAME.editable = false
  }
  else{
    PLAN_ITEM.editable = true
    PLAN_CYCLE1.editable = true
    PLAN_CYCLE2.editable = true
    PLAN_CYCLE_DESC.editable = true
    PLAN_DOCU.editable = true
    PERSON_NAME.editable = true
  }

  grdSub2.value.getGridView().setColumn(PLAN_ITEM)
  grdSub2.value.getGridView().setColumn(PLAN_CYCLE1)
  grdSub2.value.getGridView().setColumn(PLAN_CYCLE2)
  grdSub2.value.getGridView().setColumn(PLAN_CYCLE_DESC)
  grdSub2.value.getGridView().setColumn(PLAN_DOCU)
  grdSub2.value.getGridView().setColumn(PERSON_NAME)
}

const rowChanged = (grid, oldRow, newRow)=> {
  if(newRow === -1){
    return
  }
  onGrdSub2CellClick(grid, newRow)
let rowData = newRow ? grdSub2.value.getDataProvider().getJsonRow(newRow) : ''
if(rowData.PLAN_CYCLE !== 'Z'){
    grdSub2.value.getGridView().setColumn({name: 'PLAN_CYCLE_DESC', editable: false})
  }
  else{
    grdSub2.value.getGridView().setColumn({name: 'PLAN_CYCLE_DESC', editable: true})
  }
}

const saveAll = async(temp) => {
  
  if(!await saveValidation()){
    return
  }
  await saveGoal()
  await saveGrdMainData(temp)
  await saveGrdSub2Data(temp)
  searchGoal()
}

const saveValidation = async() => {
  let result = 0
  // 목표 유효성 체크
  if( (goalData.GOAL_TITLE1 && !goalData.GOAL_TITLE2) || (goalData.GOAL_TITLE4 && !goalData.GOAL_TITLE5) || (goalData.GOAL_TITLE7 && !goalData.GOAL_TITLE8) ){
    Message.warn(t('목표를 작성 해 주세요.'))
    return false
  }
  // 중점항목 유효성 체크
  let grdMainCheckedRow = grdMain.value.getGridView().getCheckedRows()
  if(grdMainCheckedRow.length > 0){
    grdMainCheckedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      if(data.KPI_IDX){
        Message.info('KPI 데이터는 수정/삭제 할 수 없습니다.')
        result++
        return false
      }
    })
  }
  //세부계획 유효성 체크
  let grdSub2chekedRow = grdSub2.value.getGridView().getCheckedRows()
  if(grdSub2chekedRow.length > 0){
    grdSub2chekedRow.forEach( val => {
      let data = grdSub2.value.getDataProvider().getJsonRow(val)
      if(data.KPI_IDX){
        Message.info('KPI 데이터는 수정/삭제 할 수 없습니다.')
        result++
        return false
      }
      if(!data.PLAN_ITEM){
        Message.warn('실행방안을 작성 해 주세요.')
        result++
        return false
      }
      if(!data.PLAN_CYCLE1){
        Message.warn(t('주기를 선택 해 주세요.'))
        result++
        return false
      }
      if(!data.PLAN_CYCLE2){
        Message.warn(t('주기를 선택 해 주세요.'))
        result++
        return false
      }
      if(!data.PLAN_CYCLE_DESC){
        Message.warn(t('별도기준을 작성 해 주세요.'))
        result++
        return false
      }
      if(!data.PLAN_DOCU){
        Message.warn(t('기록관리를 작성 해 주세요.'))
        result++
        return false
      }
      if(!data.PERSON_NAME){
        Message.warn(t('담당자를 작성 해 주세요.'))
        result++
        return false
      }
    })
  }
  if(result > 0){
    return false
  }
  return true
}

const saveGoal = async() => {
  
  // 목표 합치기
  goalData.GOAL_TITLE = goalData.GOAL_TITLE1 + ' ' + goalData.GOAL_TITLE2 + goalData.GOAL_TITLE3 + '\r\n' + goalData.GOAL_TITLE4 + ' ' + goalData.GOAL_TITLE5 + goalData.GOAL_TITLE6+'\r\n' + goalData.GOAL_TITLE7 + ' ' + goalData.GOAL_TITLE8 + goalData.GOAL_TITLE9 + '\r\n'+goalData.GOAL_TITLE10

  let data = reactive({
      CMPNY_DIV : searchParams.CMPNY_DIV,
      BSNS_CD : searchParams.BSNS_CD,
      DEPT_CD : searchParams.DEPT_CD,
      ASGN_CD : searchParams.ASGN_CD,
      YEAR : searchParams.YEAR,
      HSE_DIV : searchParams.HSE_DIV,
      GOAL_TITLE : goalData.GOAL_TITLE,
      USER_ID : userStore.userId,
    })
    
   await commonSearchApi({ queryId : 'MNGAA0020_POPUP_02_SAVE_01', param: data })
}

const saveGrdMainData = async (temp) => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  saveParam.value = []

  if(chekedRow.length > 0){
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.CMPNY_DIV = searchParams.CMPNY_DIV
      data.ASGN_CD = searchParams.ASGN_CD
      data.BSNS_CD = searchParams.BSNS_CD
      data.DEPT_CD = searchParams.DEPT_CD
      data.YEAR = searchParams.YEAR
      data.HSE_DIV = searchParams.HSE_DIV
      data.UESR_ID = userStore.userId
      data.DETAIL_ITEM = data.AHEAD_ITEM
      data.DETAIL_NO = data.AHEAD_NO
      data.DETAIL_ORD = data.AHEAD_NO
      data.TEMP_YN = temp
      saveParam.value.push(data)

      grdMainFocus.value = 0
      grdSub2Focus.value = 0

      if(data.KPI_IDX){
        Message.info('KPI 데이터는 수정/삭제 할 수 없습니다.')
        return false
      }
    })
  }

  await commonExecuteApi({ queryId : 'MNGAA0020_POPUP_02_SAVE_02', list: saveParam.value })
  await commonExecuteApi({ queryId : 'MNGAA0020_POPUP_02_SAVE_03', list: saveParam.value })
}

const saveGrdSub2Data = async (temp) => {
 let chekedRow = grdSub2.value.getGridView().getCheckedRows()
  saveParam.value = []
  if(chekedRow.length > 0){
    chekedRow.forEach( val => {
      let data = grdSub2.value.getDataProvider().getJsonRow(val)
      data.CMPNY_DIV = searchParams.CMPNY_DIV
      data.BSNS_CD = searchParams.BSNS_CD
      data.DEPT_CD = searchParams.DEPT_CD
      data.ASGN_CD = searchParams.ASGN_CD
      data.YEAR = searchParams.YEAR
      data.HSE_DIV = searchParams.HSE_DIV
      data.SA_COMMENT = ''
      data.USER_ID = userStore.userId
      data.RESULT_MEASUREMENT = ''
      data.TEMP_YN = temp
      data.PLAN_CYCLE=''
      if(searchParams.YEAR >= '2024'){
        data.PLAN_CYCLE= data.PLAN_CYCLE1 === 'Z' ? data.PLAN_CYCLE1 : data.PLAN_CYCLE1+data.PLAN_CYCLE2.replace('회','')
      }
      else{
        if(data.PLAN_CYCLE1 === '별도기준'){
          data.PLAN_CYCLE = data.PLAN_CYCLE1
        }else{
          let c = ''
          cycle_new.value.forEach(e => {
            if(e.COD === data.PLAN_CYCLE1){
              c = data.PLAN_CYCLE2.replace('회','회/')+e.TXT
            }
          })
          cycle_old.value.forEach(e => {
            if(e.TXT === c){

              data.PLAN_CYCLE = e.COD
            }
          })
          if(data.PLAN_CYCLE === ''){
            data.PLAN_CYCLE_DESC = c
            data.PLAN_CYCLE = 'Z'
          }
        }
        // data.PLAN_CYCLE= data.PLAN_CYCLE1 === 'Z' ? data.PLAN_CYCLE1 : data.PLAN_CYCLE1+data.PLAN_CYCLE2.replace('회','')
      }
      saveParam.value.push(data)
      
      // grdMainFocus.value = 0
      grdSub2Focus.value = 0
    })
  }
  
  // return true
  commonExecuteApi({ queryId : 'MNGAA0020_POPUP_02_SAVE_04', list: saveParam.value }).then((res)=>{
    // console.log('MNGAA0020_POPUP_02_SAVE_04 res:',res.list[0].RES_COD)
    if(res.list[0].RES_COD === '0'){
      Message.success('저장되었습니다.')
    }
  })
  
  return true

}

// onMounted(() => {
//   window.addEventListener("mousemove", mouseUpdate)
// })

watch(() => goalData.HSE_DIV,(newValue, oldValue) => {
  
  if(firstWatch.value === 0){
    firstWatch.value += 1

    return
  }
  switch(newValue){
  case '1':
    searchParams.HSE_DIV = '1'
    grdMainButton.value = true
    grdMainButtonEnv.value = false
    break
  case '2':
    searchParams.HSE_DIV = '2'
    grdMainButton.value = true
    grdMainButtonEnv.value = false
    break
  case '3':
    searchParams.HSE_DIV = '3'
    grdMainButton.value = false
    grdMainButtonEnv.value = true
    break
  case '4':
    searchParams.HSE_DIV = '4'
    grdMainButton.value = true
    grdMainButtonEnv.value = false
    break
  }
  searchGoal()
})




//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  // let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="mngaa0020PopupDialog"
    eager
    persistent
    width="1500"
    height="1000"
    class="p-absolute user-select-none draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
        @mousedown="startDragging"
    >
      <span>목표/계획 작성</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5 flex-column">
      <v-card-title class="pa-4 pb-2 d-flex justify-space-between">
        <v-sheet width="230">
          <VRadioGroup
            v-model="goalData.HSE_DIV"
            class="mt-0 pl-4 radio"
            inline
            >
            <VRadio v-for="(item, i) in radioGubun" :key="i" :value="item.code" :label="item.name" />
          </VRadioGroup>
        </v-sheet>

        <v-sheet>
          <IGridTitle
            :use-permission="false"
            :button-list="['btnUpdate','btnClose']"
            @click-button="onButtonsClick"
          />        
          <!-- 임시저장 버튼 삭제
            <IGridTitle
            :use-permission="false"
            :button-list="['btnTemporaryStorage','btnUpdate','btnClose']"
            @click-button="onButtonsClick"
          /> -->
        </v-sheet>
      </v-card-title>

      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="flex-column" height="28%">
            <div class="d-flex fill-height mt-3">
              <v-sheet width="360">
                <IGridTitle 
                :title="$t('목표')"
                />

                <v-sheet class="d-flex">
                  <v-sheet width="140" class="mr-3 pt-1" style="text-align: center;">{{ goalData.GOAL_TITLE1 }}</v-sheet>
                  <!-- <VTextField type="number" min="0" v-model="goalData.GOAL_TITLE2" style="width: 80px !important;"/> -->
                  <i-input v-model="goalData.GOAL_TITLE2" width="80px"/>
                  <v-sheet class="pt-1">{{ goalData.GOAL_TITLE3 }}</v-sheet>
                </v-sheet>
                <v-sheet class="d-flex mt-2">
                  <v-sheet v-if="goalData.HSE_DIV !== '3'" width="140" class="mr-3 pt-1" style="text-align: center;">{{ goalData.GOAL_TITLE4 }}</v-sheet>
                  <v-sheet v-if="goalData.HSE_DIV === '3'" width="140" class="mr-3 pt-0 pb-0" style="text-align: center; top:-3px;">유해화학물질</v-sheet>
                  <i-input v-model="goalData.GOAL_TITLE5" width="80px" style="top:0px;"/>
                  <v-sheet class="pt-1">{{ goalData.GOAL_TITLE6 }}</v-sheet>
                </v-sheet>
                <v-sheet v-if="goalData.HSE_DIV === '3'"  width="140" class="mr-3 pt-0" style="text-align: center; top:-17px;">종사자 교육</v-sheet>
                <v-sheet class="d-flex mt-2">
                  <v-sheet width="140" class="mr-3 pt-1" style="text-align: center;">{{ goalData.GOAL_TITLE7 }}</v-sheet>
                  <!-- <VTextField type="number" min="0" v-model="goalData.GOAL_TITLE2" style="width: 80px !important;"/> -->
                  <i-input v-if="goalData.GOAL_TITLE7" v-model="goalData.GOAL_TITLE8" width="80px" id = 'title8' />
                  <v-sheet class="pt-1">{{ goalData.GOAL_TITLE9 }}</v-sheet>
                </v-sheet>
              </v-sheet>

              <v-sheet width="380"  class="mt-7">
                <v-sheet>추가 목표 작성</v-sheet>
                <i-textarea
                  v-model="goalData.GOAL_TITLE10"
                  class="mt-1"
                  width="380"
                  :row="5"
                  @click="clickAsgn"
                />
              </v-sheet>

              <v-sheet width="720" class="h-auto">
                <IGridTitle 
                  ref="grdSub3Title"
                  :title="$t('중요리스크 개선 계획')"
                  />
                  <RealGrid
                    ref="grdSub3"
                    :grid-view-option="grdSub3Props.gridViewOption"
                    :keys="grdSub3Props.keys" 
                    :fields="grdSub3Props.fields"
                    :columns="grdSub3Props.columns"
                    :column-layout="grdSub3Props.columnLayout"
                  />
              </v-sheet>
            </div>
          </v-sheet>


          <v-sheet class="flex-column mt-4 h-auto">
            <div class="d-flex fill-height mt-3">
              <v-sheet width="340" class="h-auto">
                <IGridTitle 
                  ref="grdMainTitle"
                  :title="$t('중점항목')"
                    :button-list="['btnCreate', 'btnDelete']"
                    @click-button="onGrdMainButtonsClick"
                    v-if="grdMainButton"
                />
                <IGridTitle 
                  ref="grdMainTitle"
                  :title="$t('중점항목')"
                    :button-list="['btnGetEnvData','btnCreate', 'btnDelete']"
                    @click-button="onGrdMainButtonsClick"
                    v-if="grdMainButtonEnv"
                />
                <RealGrid 
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys" 
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns" 
                  :column-layout="grdMainProps.columnLayout"
                  @onCurrentRowChanged="onGrdMainCellClicked"
                  @onCellClicked="onGrdMainCellClick"
                />
              </v-sheet>

              <v-sheet width="1100" class="ml-5 h-auto">
                <IGridTitle 
                    ref="grdSub2Title"
                    :title="$t('세부계획')"
                    :button-list="['btnCreate', 'btnDelete']"
                    @click-button="onGrdSub2ButtonsClick"
                  />
                  <RealGrid
                    ref="grdSub2"
                    :grid-view-option="grdSub2Props.gridViewOption"
                    :keys="grdSub2Props.keys" 
                    :fields="grdSub2Props.fields"
                    :columns="grdSub2Props.columns"
                    :column-layout="grdSub2Props.columnLayout"
                    @onEditRowChanged="onEditRowChanged"
                    @onCurrentRowChanged="rowChanged"
                    />
                    <!-- @onCellClicked="onGrdSub2CellClick" -->
              </v-sheet>
            </div>
          </v-sheet>

        </div>
      </v-card-text>

      <!-- 환경 추가 팝업 -->
    <MNGAA0020Popup3 ref="mNGAA0020Popup3" @selected="addEnv"/>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.radio{
  margin: 12px 0;
  height: 33px; 
  padding-top: 2px; 
  border: 1px solid rgb(148, 154, 157);
  border-radius: 6px;
  /* background-color: #EFF8FD; */
}
.goalFirst{
  text-align: center; 
  font-weight: bold; 
  font-size: large; 
  margin-bottom: 10px;
}
.goalStyle{
  /* border: 1px solid rgb(148, 154, 157); */
  /* background-color: #EFF8FD; */
  border-radius: 6px;
  padding: 5px 10px;
  vertical-align: baseline;
}
.vertical-center{
  align-self: center;
}
</style>
