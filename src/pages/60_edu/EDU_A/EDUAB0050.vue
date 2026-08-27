<!--
  화면명 : 법정교육 이수현황 모니터링
  화면개요 : 근로자 정기안전보건교육, 관리감독자 정기안전보건교육, 생산직 법정 안전교육현황 조회 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUAB0050Pop01 from '@/pages/60_edu/EDU_A/EDUAB0050Pop01.vue'


import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'

defineOptions({
  name: '60_edu-EDU_A-EDUAB0050',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()

const menuTitle = ref(null)
const grdTab01Main = ref(null)
const grdTab02Main = ref(null)
const grdTab03Main = ref(null)
//const searchArea = ref(null)
const dialog = ref(false)
const MainGrd = ref(null)
const tab = ref('one')
const periodDltVisibleYn = ref(true)
const eDUAB0050Pop01 = ref(null)
const isAdmin = ref(userStore.authGrpCd.includes('GRP00381') ? true : false)
const { stateC114 } = history.state

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YYYYMM : dayjs(new Date).format('YYYY-MM'), //기간 시작
  BSNS_CD : '',              //사업부
  DEPT_CD : '',              //부서코드
  ORGN_DIV : '',             //소속구분 (A : 직영, B : 협력사)
})

const searchParams2 = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YYYY : dayjs(new Date).format('YYYY'),
  BSNS_CD : '',              //사업부
  DEPT_CD : '',              //부서코드
  ORGN_DIV : '',             //소속구분 (A : 직영, B : 협력사)
})

const searchParams3 = reactive({
  CMPNY_DIV : '',      //회사구분
  BSNS_CD : '',        //사업부
  DEPT_CD : '',        //부서코드
  ASGN_CD : '',        //협력사
  PERIOD : '',         //교육기간
  YEAR : dayjs(new Date).format('YYYY'),  //년도
  PERIOD_DLT : '',     //월
  DIVISION : '',       //구분
  CURR_ID : '',        //교육명
  USER_DIV : userStore.userDiv,       //소속구분 (A : 직영, B : 협력사)
})

const AUTH_GRP_CD = ref(null) //권한그룹

//근로자 정기안전보건교육
const grdTab01MainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('소속') }, styleName:'left-column', editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, width:'340' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
    { fieldName: 'COM_ENT_DATE', dataType: 'text', header: { text: t('입사일') }, editable: false },
    { fieldName: 'USER_DIV_NM', dataType: 'text', header: { text: t('고용형태') }, editable: false },
    { fieldName: 'GOAL_TIME', dataType: 'number', numberFormat: '#,###', header: { text: t('월별 목표이수시간') }, editable: false },
    { fieldName: 'EDU_PLAN_TIME', dataType: 'number', numberFormat: '#,###', header: { text: t('월별 계획시간(분)') }, styleName:'right-column rg_blue rg_underLine',  editable: false },
    { fieldName: 'NOW_EDU_PLAN_TIME', dataType: 'number', numberFormat: '#,###',  header: { text: t('현재기준계획시간:분(월별 첫날~금일)') }, width:'100', styleName:'right-column', editable: false },
    { fieldName: 'RESULT_TIME', dataType: 'number', numberFormat: '#,###',  header: { text: t('이수시간(분)') }, styleName:'right-column rg_blue rg_underLine', editable: false },
    { fieldName: 'PASS_RATE', dataType: 'number', numberFormat: '#,###', header: { text: t('계획대비 이수율(%)') }, styleName:'right-column', editable: false },
    //{ fieldName: 'GOAL_TIME_NM', dataType: 'text', header: { text: t('분기당 목표이수시간') }, editable: false },
    { fieldName: 'TARGET_YN', dataType: 'text', header: { text: t('사무직 교육대상') }, editable: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, styleName:'left-column', editable: false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'SLI_MINUS_YN', dataType: 'text', header: { text: t('SLI_MINUS_YN') }, editable: false, visible: false },
    { fieldName: 'SLI_MINUS_DESC', dataType: 'text', header: { text: t('SLI_MINUS_DESC') }, editable: false, visible: false },
    { fieldName: 'USER_DIV', dataType: 'text', header: { text: t('USER_DIV') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, editable: false, visible: false },
    { fieldName: 'YYYYMM', dataType: 'text', header: { text: t('YYYYMM') }, editable: false, visible: false },
  ],
  columns: [],
})

//관리감독자 정기안전보건교육
const grdTab02MainProps  = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('소속') }, styleName:'left-column', editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, width:'340' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('이름') }, editable: false },
    { fieldName: 'M001', dataType: 'text', header: { text: t('상반기(480분)') }, styleName:'right-column rg_blue rg_underLine', editable: false },
    { fieldName: 'M002', dataType: 'text', header: { text: t('하반기(480분)') }, styleName:'right-column rg_blue rg_underLine', editable: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, styleName:'left-column', editable: false },

    //비활성화
    { fieldName: 'COLOR_YN', dataType: 'text', header: { text: t('COLOR_YN') }, editable: false, visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'GOAL_TIME', dataType: 'text', header: { text: t('GOAL_TIME') }, editable: false, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD') }, editable: false, visible: false },
    { fieldName: 'YYYY', dataType: 'text', header: { text: t('YYYY') }, editable: false, visible: false },
  ],
  columns: [],
})

//생산직 법정 안전교육현황
const grdTab03MainProps  = reactive({
  gridViewOption: { checkBar: { visible: false }, stateBar: { visible:false }, header: { height : 45 } },
  fields : [
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, editable: false, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true } },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, styleName:'left-column', editable: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('협력사') }, styleName:'left-column', editable: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('협력사코드') }, editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'GOAL_TIME', dataType: 'number', numberFormat: '#,###', header: { text: t('목표이수시간(분)') }, editable: false },
    { fieldName: 'LEAD_TIME', dataType: 'number', numberFormat: '#,###', header: { text: t('실적이수시간(분)') }, editable: false },
    { fieldName: 'EDU_RATIO', dataType: 'number', numberFormat: '#,###', header: { text: t('교육이수율(%)') }, editable: false },
    { fieldName: 'COM_ENT_DATE', dataType: 'text', header: { text: t('입사일') }, editable: false },
    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부명') }, editable: false, visible: false },
    { fieldName: 'USER_DIV', dataType: 'text', header: { text: t('DEPT_CD') }, editable: false, visible: false },

  ],
  columns: [],
  columnLayout: [
    'BSNS_CD',
    {
      name: '부서',
      direction: 'horizontal',
      items: [ 'DEPT_NM', 'DEPT_CD'],
      header: { text: t('부서') },
    },
    {
      name: '협력사',
      direction: 'horizontal',
      items: [ 'ASGN_NM', 'ASGN_CD'],
      header: { text: t('협력사') },
    },
    'JOB_TIT_NM',
    'EMP_NO',
    'KOR_NM',
    'GOAL_TIME',
    'LEAD_TIME',
    'EDU_RATIO',
    'COM_ENT_DATE'
  ],
})

// 그리드 세팅

grdTab01MainProps.columns = grdTab01MainProps.fields
grdTab02MainProps.columns = grdTab02MainProps.fields
grdTab03MainProps.columns = grdTab03MainProps.fields

const codeList = reactive({
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  orgnDiv : [], //소속구분
  division : [],//분류
})

const codeList2 = reactive({
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  orgnDiv : [], //소속구분
  division : [],//분류
})

const codeList3 = reactive({
  cmpnyDiv : [],//회사구분
  currId : [],  //교육명
  bsnsCd : [],  //사업부
  deptCd : [],  //부서
  orgnDiv : [], //소속구분
  asgnCd : [],  //협력사
  division : [],//구분
  period : [],  //교육기간
  periodDlt : [],  //분기, 월
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
    getCodeList('HHID210'), //소속구분
    getCodeList('HHID010'), //분류
    getCodeList('HHID220'), //교육명
    getCompanyList(), // 회사구분

  ]).then(res => {
    //console.log("레스 확인",res)
    //사업부 데이터 세팅
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    let findIndex = res[0].ORESULT_CUR.findIndex(item => item.BSNS_CD === (stateC114 == undefined ? userStore.bsnsCd : stateC114.BSNS_CD))
    searchParams.BSNS_CD = res[0].ORESULT_CUR[findIndex].BSNS_CD

    codeList2.bsnsCd = res[0].ORESULT_CUR
    searchParams2.BSNS_CD = res[0].ORESULT_CUR[findIndex].BSNS_CD

    codeList3.bsnsCd = res[0].ORESULT_CUR
    searchParams3.BSNS_CD = res[0].ORESULT_CUR[findIndex].BSNS_CD

    //부서 데이터 세팅
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    searchParams.DEPT_CD = codeList.deptCd[0].DEPT_CD

    //소속구분 데이터 세팅
    codeList.orgnDiv = res[2].ORESULT_CUR
    searchParams.ORGN_DIV = codeList.orgnDiv[0].COD

    codeList2.orgnDiv = res[2].ORESULT_CUR
    searchParams2.ORGN_DIV = codeList.orgnDiv[0].COD

    let copyList = _.cloneDeep(res[2].ORESULT_CUR)
    codeList3.orgnDiv = copyList
    codeList3.orgnDiv.unshift({TXT : '전체', COD : ''})
    searchParams3.ORGN_DIV = codeList3.orgnDiv[0].COD
    

    //회사구분 데이터 세팅
    codeList3.cmpnyDiv = res[5].ORESULT_CUR
    searchParams3.CMPNY_DIV = codeList3.cmpnyDiv[0].COD

    //구분 데이터 세팅
    codeList3.division = res[3].ORESULT_CUR
    codeList3.division.unshift({ TXT:"전체", COD:"" })
    searchParams3.DIVISION = codeList3.division[0].COD

    //교육명 데이터 세팅
    codeList3.currId.unshift({ TXT: "전체", COD: "" })
    searchParams3.CURR_ID = codeList3.currId[0].COD

    //교육기간 데이터 세팅(하드코딩)
    codeList3.period.push({ TXT: '월', COD: 'M' }, { TXT: '분기별', COD: 'Q' }, { TXT: '연간', COD: 'Y' })
    searchParams3.PERIOD = codeList3.period[0].COD
    searchParams3.PERIOD_DLT = 1

    // 2024.07.25 박용훈 소속/직위/이름 자동 필터 설정
    // 근로자 정기안전보건교육
    grdTab01Main.value.getGridView().setColumnProperty("ASGN_FULL_NM", "autoFilter", true)
    grdTab01Main.value.getGridView().setColumnProperty("JOB_TIT_NM", "autoFilter", true)
    grdTab01Main.value.getGridView().setColumnProperty("KOR_NM", "autoFilter", true)
  
    // 관리감독자 정기안전보건교육
    grdTab02Main.value.getGridView().setColumnProperty("ASGN_FULL_NM", "autoFilter", true)
    grdTab02Main.value.getGridView().setColumnProperty("JOB_TIT_NM", "autoFilter", true)
    grdTab02Main.value.getGridView().setColumnProperty("KOR_NM", "autoFilter", true)
  
    // 생산직 법정 안전교육현황
    grdTab03Main.value.getGridView().setColumnProperty("JOB_TIT_NM", "autoFilter", true)
    grdTab03Main.value.getGridView().setColumnProperty("KOR_NM", "autoFilter", true)
    
  })
  console.log('userStore.authGrpCd',userStore.authGrpCd)
  console.log('isAdmin',isAdmin.value)
  
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  searchParams.DEPT_CD = ''
  if(isNullCheck(newValue)){
    codeList.deptCd = []
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    
    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

      if(stateC114 != undefined) {
        searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
      } else {
        if(isNullCheck(oldValue)){
          let findIndex = res.ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
          searchParams.DEPT_CD = res.ORESULT_CUR[findIndex].DEPT_CD
        } else {
          searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
        }
      }
    }).finally(() => {
      //gridRefresh()
    })
})

// 사업부가 바뀌면 부서 데이터 가져옴
watch(() => searchParams2.BSNS_CD, (newValue, oldValue) => {
  searchParams2.DEPT_CD = ''
  if(isNullCheck(newValue)){
    codeList2.deptCd = []
    codeList2.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    
    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList2.deptCd = res.ORESULT_CUR
      codeList2.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

      if(isNullCheck(oldValue)){
        let findIndex = res.ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
        searchParams2.DEPT_CD = res.ORESULT_CUR[findIndex].DEPT_CD
      } else {
        searchParams2.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
      }
    }).finally(() => {
    })
})

// 사업부가 바뀌면 부서 데이터 가져옴
watch(() => searchParams3.BSNS_CD, (newValue, oldValue) => {
  searchParams3.DEPT_CD = ''
  if(isNullCheck(newValue)){
    codeList3.deptCd = []
    codeList3.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
    
    return
  }
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList3.deptCd = res.ORESULT_CUR
      codeList3.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

      if(isNullCheck(oldValue)){
        let findIndex = res.ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
        searchParams3.DEPT_CD = res.ORESULT_CUR[findIndex].DEPT_CD
      } else {
        searchParams3.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
      }
    }).finally(() => {
    })
})

// 부서가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams3.DEPT_CD, (newValue, oldValue) => {
    codeList3.asgnCd = ''
  if(newValue = ''){
    codeList3.asgnCd.push({ ASGN_NM:"전체", ASGN_CD:"" })
    return
  }
  commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams3.BSNS_CD, DEPT_CD: searchParams3.DEPT_CD } })
    .then(res => {
      codeList3.asgnCd = res.ORESULT_CUR
      codeList3.asgnCd.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
      if(userStore.asgnCd === (res.ORESULT_CUR.findIndex(item => item.ASGN_CD === userStore.asgnCd))){
        let findIndex = res.ORESULT_CUR.findIndex(item => item.ASGN_CD === userStore.asgnCd)
        searchParams3.ASGN_CD = res.ORESULT_CUR[findIndex].ASGN_CD
      }else{
        searchParams3.ASGN_CD = codeList3.asgnCd[0].ASGN_CD
      }
    })
})

//교육기간이 변경될 때 발생되는 이벤트
watch(() => searchParams3.PERIOD, (newValue) => {
  codeList3.periodDlt = []
  if(newValue === 'M'){
    periodDltVisibleYn.value = true
    for(let i = 1; i <= 12; i++ ){
      codeList3.periodDlt.push({TXT : i, COD : i})
    }
    searchParams3.PERIOD_DLT = 1
  }
  else if(newValue === 'Q'){
    periodDltVisibleYn.value = true
    for(let i = 1; i <= 4; i++ ){
      codeList3.periodDlt.push({TXT : i, COD : i})
    }
    searchParams3.PERIOD_DLT = 1
  }else if(newValue === 'Y'){
    periodDltVisibleYn.value = false
    searchParams3.PERIOD_DLT = ''
  }
})

watch(() => searchParams3.YEAR, (newValue) => {
  codeList3.period = []
  if(newValue === '2024') {
    //교육기간 데이터 세팅(하드코딩)
    codeList3.period.push({ TXT: '분기별', COD: 'Q' }, { TXT: '연간', COD: 'Y' })
    searchParams3.PERIOD = codeList3.period[0].COD
    searchParams3.PERIOD_DLT = 1
  } else {
    //교육기간 데이터 세팅(하드코딩)
    codeList3.period.push({ TXT: '월', COD: 'M' }, { TXT: '분기별', COD: 'Q' }, { TXT: '연간', COD: 'Y' })
    searchParams3.PERIOD = codeList3.period[0].COD
    searchParams3.PERIOD_DLT = 1
  }
})

// 2024.02.29 박용훈 없어서 추가함
// 구분이 바뀌면 구분에 따른 교육명 데이터 가져옴
watch(() => searchParams3.DIVISION, (newValue, oldValue) => {
  //console.log("뉴밸류!",newValue)
  if(newValue === ''){
    codeList3.currId = []
    codeList3.currId.unshift({ TXT:"전체", COD:"" })
    
    return
  }
  commonSearchApi({ queryId : 'EDUAA0080_SEARCH_01', param : { CMPNY_DIV: userStore.cmpnyDiv, DIVISION : newValue } })
    .then(res => {
      codeList3.currId = res.ORESULT_CUR
      codeList3.currId.unshift({ TXT:"전체", COD:"" })
      searchParams.currId =codeList3.currId[0].COD
    })
})


//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {//조회
  if(tab.value === 'one'){
    new queryFlowHelper(vm, t)
        .setGridList([grdTab01Main])
        //.setSearchArea(searchArea)
        .setBefore(beforeSearch)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
  }
  else if(tab.value === 'two'){
    new queryFlowHelper(vm, t)
        .setGridList([grdTab02Main])
        //.setSearchArea(searchArea)
        .setBefore(beforeSearchSecond)
        .setQuery(searchDataSecond)
        .setAfter(afterSearchSecond)
        .run()
  }else if(tab.value === 'three'){
    new queryFlowHelper(vm, t)
        .setGridList([grdTab03Main])
        //.setSearchArea(searchArea)
        .setBefore(beforeSearchThird)
        .setQuery(searchDataThird)
        .setAfter(afterSearchThird)
        .run()
  }
}

//탭 변경시 발생하는 이벤트
const tabChange = async data => {
  //console.log("탭체인지",data)
}

//근로자 정기안전보건교육, 관리감독자 정기안전보건교육 그리드 클릭 이벤트
const onCellClicked = (grid, clickData) => {
  //console.log("클릭 데이터",clickData)
  if(tab.value === 'one'){
    let cd = grdTab01Main.value.getDataProvider().getJsonRow(clickData.dataRow)
    //console.log("클릭드데이터",cd)
    if(clickData.fieldName === 'EDU_PLAN_TIME' || clickData.fieldName === 'RESULT_TIME'){
      //console.log("탭1111111")
      eDUAB0050Pop01.value.openPopup({
        //팝업데이터
        KOR_NM : cd.KOR_NM,
        JOB_TIT_NM : cd.JOB_TIT_NM,
        ASGN_FULL_NM : cd.ASGN_FULL_NM,
        //그리드 조회 파라미터
        CMPNY_DIV : cd.CMPNY_DIV,
        YYYYMM : cd.YYYYMM,
        BSNS_CD : cd.BSNS_CD,
        TARGET_ID : cd.EMP_NO,
        //조회구분
        GUBUN : 'grdTab01Main'
      })
    }``
  }else if(tab.value === 'two'){
    let cd = grdTab02Main.value.getDataProvider().getJsonRow(clickData.dataRow)
    //console.log("클릭드데이터",cd)
    if(clickData.fieldName === 'M001' || clickData.fieldName === 'M002'){
      eDUAB0050Pop01.value.openPopup({
        //팝업데이터
        KOR_NM : cd.KOR_NM,
        JOB_TIT_NM : cd.JOB_TIT_NM,
        ASGN_FULL_NM : cd.ASGN_FULL_NM,
        //그리드 조회 파라미터
        CMPNY_DIV : cd.CMPNY_DIV,
        YYYY : searchParams2.YYYY,
        BSNS_CD : cd.BSNS_CD,
        TARGET_ID : cd.EMP_NO,
        CURR_ID : searchParams2.ORGN_DIV === 'A' ? 'C002' : 'C070',
        MORGN_ID : clickData.fieldName,
        ORGN_DIV : searchParams2.ORGN_DIV,
        //조회구분
        GUBUN : 'grdTab02Main'
      })
    }
  }


}

//그리드 초기화 이벤트
const gridRefresh = val => {
  if(val === 'grdTab01Main'){
    grdTab01Main.value.getDataProvider().setRows([])
  }else if(val === 'grdTab02Main'){
    grdTab02Main.value.getDataProvider().setRows([])
  }else if(val === 'grdTab03Main'){
    grdTab03Main.value.getDataProvider().setRows([])
  }
}

//널 체크 이벤트
const isNullCheck = data => {
return (data === undefined || data === null || data === '') ? true : false
}
//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//근로자 정기안전보건교육 조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//근로자 정기안전보건교육 조회
const searchData = () => {
  grdTab01Main.value.getGridView().filterPanel.clearInput()

  const searchParamsCopy = {
    CMPNY_DIV : userStore.cmpnyDiv,
    YYYYMM : dayjs(searchParams.YYYYMM).format('YYYYMM'),
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD,
    ORGN_DIV : searchParams.ORGN_DIV
  }
  //console.log("조회 파라미터 ::::::: ",searchParamsCopy)
  return commonSearchApi({ queryId : 'EDUAB0050_TAB01_SEARCH_01', param: searchParamsCopy })
}

//근로자 정기안전보건교육 조회 후
const afterSearch = res => {
  //console.log("조회된 데이터 확인",res)
  grdTab01Main.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//##################################################### Second #####################################################################
//관리감독자 정기안전보건교육 조회 전 유효성 검사
const beforeSearchSecond = () => {
  return true
}

//관리감독자 정기안전보건교육 조회
const searchDataSecond = () => {
  grdTab02Main.value.getGridView().filterPanel.clearInput()
  //console.log("조회 파라미터 ::::::: ",searchParams2)
  return commonSearchApi({ queryId : 'EDUAB0050_TAB02_SEARCH_01', param: searchParams2 })
}
//관리감독자 정기안전보건교육 조회 후
const afterSearchSecond = res => {
  //console.log("조회된 데이터 확인",res)
  grdTab02Main.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
    var ret = {}
    var colorValue = grid.getValue(item.index, "COLOR_YN")
    if(colorValue === 'N'){
      ret.style = { color : "#FF0000" }
    }
    return ret
  })
  grdTab02Main.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//##################################################### Third #####################################################################
//관리감독자 정기안전보건교육 조회 전 유효성 검사
const beforeSearchThird = () => {
  return true
}

//관리감독자 정기안전보건교육 조회
const searchDataThird = () => {

  grdTab03Main.value.getGridView().filterPanel.clearInput()

  let searchParams3Copy = {
    CMPNY_DIV : searchParams3.CMPNY_DIV,    
    BSNS_CD : searchParams3.BSNS_CD,  
    DEPT_CD : searchParams3.DEPT_CD,        
    ASGN_CD : searchParams3.ASGN_CD,        
    PERIOD : searchParams3.PERIOD,         
    YEAR : searchParams3.YEAR,
    PERIOD_DLT :String(searchParams3.PERIOD_DLT).length === 1 ? '0' + searchParams3.PERIOD_DLT : String(searchParams3.PERIOD_DLT),
    DIVISION : searchParams3.DIVISION,       
    CURR_ID : searchParams3.CURR_ID,       
    USER_DIV : searchParams3.ORGN_DIV
  }
  //console.log("조회결과 확인",searchParams3Copy)
  
  return commonSearchApi({ queryId : 'EDUAB0050_TAB03_SEARCH_01', param: searchParams3Copy })
}
//관리감독자 정기안전보건교육 조회 후
const afterSearchThird = res => {
  //console.log("조회된 데이터 확인",res)
  grdTab03Main.value.getDataProvider().setRows(res.ORESULT_CUR)
  grdTab03Main.value.setBindingColumn("BSNS_CD", codeList.bsnsCd, "BSNS_CD", "BSNS_NM") // 사업부
}


//*****************************************조회 영역(종료)***********************************************************/

onMounted( () => {
  grdTab01Main.value.getGridView().filterPanel.visible = true
  grdTab01Main.value.getGridView().setFocus(0) //행 0으로

  grdTab02Main.value.getGridView().filterPanel.visible = true
  grdTab02Main.value.getGridView().setFocus(0) //행 0으로

  grdTab03Main.value.getGridView().filterPanel.visible = true
  grdTab03Main.value.getGridView().setFocus(0) //행 0으로
  initCodeList()
})
</script>

<template>
  <v-card class="pa-3 fill-height">
    <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
    <!-- 타이틀 -->  
    <v-card-title class="pa-2 py-0">  
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="mb-2">
        <v-tabs v-model="tab">
          <v-tab value="one">근로자 정기안전보건교육</v-tab>
          <v-tab value="two">관리감독자 정기안전보건교육</v-tab>
          <v-tab value="three">생산직 법정 안전교육현황</v-tab>
        </v-tabs>
      </v-sheet>
    </v-card-title>
    <!--근로자 정기안전보건교육------------------------------------------------------------------------------------------>
    <v-card-text v-show="tab == 'one'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
        <!-- 조회조건 -->
          <i-input
            :label="$t('년월')"
            v-model="searchParams.YYYYMM"
            type="month"
            @update:model-value="gridRefresh('grdTab01Main')"
            width="200px"
          />
          <i-select
            :label="$t('사업부')"
            v-model="searchParams.BSNS_CD"
            :items="codeList.bsnsCd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            @update:model-value="gridRefresh('grdTab01Main')"
            width="250px"
            :readonly="!isAdmin"
          />
          <i-select
            :label="$t('부서')"
            v-model="searchParams.DEPT_CD"
            :items="codeList.deptCd"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            @update:model-value="gridRefresh('grdTab01Main')"
            width="250px"
            :readonly="!isAdmin"
          />
          <i-select
            :label="$t('소속구분')"
            v-model="searchParams.ORGN_DIV"
            :items="codeList.orgnDiv"
            item-title="TXT"
            item-value="COD"
            @update:model-value="gridRefresh('grdTab01Main')"
            width="250px"
          />
        </v-sheet>
        <!-- 메인그리드 -->
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        <v-sheet height="85%">
          <RealGrid
            ref="grdTab01Main"
            :grid-view-option="grdTab01MainProps.gridViewOption"
            :fields="grdTab01MainProps.fields"
            :columns="grdTab01MainProps.columns"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!--관리감독자 정기안전보건교육------------------------------------------------------------------------------------------>
    <v-card-text v-show="tab == 'two'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
      <!-- 조회조건 -->
      <v-sheet class="searchArea d-flex">
        <i-input
          :label="$t('년')"
          v-model="searchParams2.YYYY"
          type="number"
          @update:model-value="gridRefresh('grdTab02Main')"
          width="200px"
        />
        <i-select
          :label="$t('사업부')"
          v-model="searchParams2.BSNS_CD"
          :items="codeList2.bsnsCd"
          item-title="BSNS_NM"
          item-value="BSNS_CD"
          @update:model-value="gridRefresh('grdTab02Main')"
          width="250px"
          :readonly="!isAdmin"
        />
        <i-select
          :label="$t('부서')"
          v-model="searchParams2.DEPT_CD"
          :items="codeList2.deptCd"
          item-title="DEPT_NM"
          item-value="DEPT_CD"
          @update:model-value="gridRefresh('grdTab02Main')"
          width="250px"
          :readonly="!isAdmin"
        />
        <i-select
          :label="$t('소속구분')"
          v-model="searchParams2.ORGN_DIV"
          :items="codeList2.orgnDiv"
          item-title="TXT"
          item-value="COD"
          @update:model-value="gridRefresh('grdTab02Main')"
          width="250px"
        />
      </v-sheet>
      <!-- 메인그리드 -->
      <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
      <v-sheet height="85%">
        <RealGrid
          ref="grdTab02Main"
          :grid-view-option="grdTab02MainProps.gridViewOption"
          :fields="grdTab02MainProps.fields"
          :columns="grdTab02MainProps.columns"
          @onCellClicked="onCellClicked"
        />
      </v-sheet>
      </div>
    </v-card-text>
    <!-- 정기안전보건교육------------------------------------------------------------------------------------------>
    <v-card-text v-show="tab == 'three'" class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <!-- 회사구분 -->
            <i-select
              :label="$t('회사구분')"
              v-model="searchParams3.CMPNY_DIV"
              :items="codeList3.cmpnyDiv"
              item-value="COD"
              item-title="TXT"
              @update:model-value="gridRefresh('grdTab03Main')"
              width="250px"
              :readonly="!isAdmin"
            />
            <i-select
              :label="$t('사업부')"
              v-model="searchParams3.BSNS_CD"
              :items="codeList3.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="gridRefresh('grdTab03Main')"
              width="250px"
              :readonly="!isAdmin"
            />
            <i-select
              :label="$t('부서')"
              v-model="searchParams3.DEPT_CD"
              :items="codeList3.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              @update:model-value="gridRefresh('grdTab03Main')"
              width="250px"
              :readonly="!isAdmin"
            />
            <i-select
              :label="$t('협력사')"
              v-model="searchParams3.ASGN_CD"
              :items="codeList3.asgnCd"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              @update:model-value="gridRefresh('grdTab03Main')"
              width="250px"
            />
          </div>
          <div class="d-flex mb-2">
            <i-select
              :label="$t('교육기간')"
              labelWidth="50px"
              v-model="searchParams3.PERIOD"
              :items="codeList3.period"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab03Main')"
              width="160px"
              margin="0px"
              class="mr-2"
            />
            <i-input
              v-model="searchParams3.YEAR"
              type="number"
              @update:model-value="gridRefresh('grdTab03Main')"
              width="100px"
              margin="0px"
              class="mr-2"
            /> 
            <i-select
              v-if="periodDltVisibleYn"
              v-model="searchParams3.PERIOD_DLT"
              :items="codeList3.periodDlt"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab03Main')"
              width="80px"
              class="mr-2"
            />
            <i-select
              :label="$t('구분')"
              v-model="searchParams3.DIVISION"
              :items="codeList3.division"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab03Main')"
              width="250px"
            />
            <i-select
              :label="$t('교육명')"
              v-model="searchParams3.CURR_ID"
              :items="codeList3.currId"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab03Main')"
              width="400px"
            />
            <i-select
              :label="$t('소속구분')"
              v-model="searchParams3.ORGN_DIV"
              :items="codeList3.orgnDiv"
              item-title="TXT"
              item-value="COD"
              @update:model-value="gridRefresh('grdTab03Main')"
              width="250px"
            />
          </div>
        </v-sheet>
        <!-- 메인그리드 -->
        <!-- h-auto : 남은 영역 모두 채우기 / h-auto로 설정된 v-sheet가 2개 이상일 경우 비율로 처리됩니다. -->
        <v-sheet height="85%">
          <RealGrid
            ref="grdTab03Main"
            :grid-view-option="grdTab03MainProps.gridViewOption"
            :fields="grdTab03MainProps.fields"
            :columns="grdTab03MainProps.columns"
            :column-layout="grdTab03MainProps.columnLayout"
          />
        </v-sheet>
        </div>
    </v-card-text>
        

    
  
  <EDUAB0050Pop01
    ref="eDUAB0050Pop01"
  />
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
